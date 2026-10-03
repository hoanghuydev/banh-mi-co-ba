/**
 * NGƯỜI QUA ĐƯỜNG — cái hẻm có người đi ngang, và đa số họ không mua gì.
 *
 * Cả trò chơi dựng trên "có người nhìn mình làm"; nếu người duy nhất đi ngang cũng là người sắp
 * xếp hàng thì "có người" không còn là tin tức nào nữa, và người chơi học một phản xạ sai rất
 * bền: thấy bóng người = sắp có đơn.
 *
 * ⚠️ TỰ HỌ thì KHÔNG ĐỤNG TỚI KINH TẾ: không gọi món, không xếp hàng, không tính vào `ahead`,
 * không chiếm `peakCap`, không vào `audience`, và không bao giờ TỰ đổi ý thành khách. Một ngày có
 * họ và một ngày không, nếu người chơi cứ đứng sau quầy, phải ra đúng cùng một con số bán được.
 *
 * Cửa DUY NHẤT để họ thành khách là người chơi tự đi mời (`inviteChance`, act `INVITE`) — nên cái
 * nền vẫn chỉ là cái nền.
 *
 * Thuần dữ liệu + toán, nên `tools/sim.ts` và test chạy được y như trong game.
 */
import type { Rng } from "../core/rng";
import type { TimeBand } from "../core/clock";
import { STREET_LANES, STREET_X } from "../world/map";
import { WALKIN_STYLES } from "../content/npcs";

/**
 * Tối đa bao nhiêu người cùng ở trên đường một lúc — trần AN TOÀN chứ không phải nhịp độ (nhịp độ
 * nằm ở `GAP_SEC`). Nó có mặt để ai sửa `GAP_SEC` xuống quá tay thì cái hẻm không biến thành đám
 * đông che mất hàng khách.
 */
export const PASSERS_MAX = 5;

/**
 * Cách nhau bao nhiêu GIÂY THẬT giữa hai người, theo khung giờ.
 *
 * ⚠️ Giây THẬT chứ không phải phút game: đồng hồ game tua nhanh khi quầy trống, nên tính theo phút
 * game thì đúng lúc hẻm vắng nhất lại là lúc người đi ngang ùa ra thành một đám.
 *
 * Một người đi hết chiều ngang bản đồ mất ~11 s, chỉ ~8 s trong khung hình — nên 2,6–6 s ở giờ
 * cao điểm ra chừng một hai người trong khung.
 */
export const GAP_SEC: Record<TimeBand, readonly [number, number]> = {
  PRE_OPEN: [6, 14],
  PEAK: [2.6, 6],
  MID: [4.5, 10],
  LULL: [8, 18],
};

/** Mưa thì người ta ở trong nhà. Nhân vào khoảng cách, nên số càng lớn đường càng vắng. */
export const RAIN_GAP_MUL = 1.7;

/**
 * Bao nhiêu phần người đi ngang có ngoái nhìn cái xe.
 *
 * Phải là THIỂU SỐ. Ai đi ngang cũng ngoái thì cái ngoái đầu hết nghĩa, mà nó lại là chi
 * tiết duy nhất ở đây nói được một câu: "người ta có để ý, chỉ là không mua".
 */
export const GLANCE_CHANCE = 0.3;

/** Đứng ngó bao lâu (giây thật). Dưới 1 s thì đọc ra là giật chân chứ không ra ngoái nhìn. */
export const GLANCE_SEC: readonly [number, number] = [1.1, 2.6];

/** Mỗi người một nhịp chân — cùng tốc độ hết thì sáu người thành một đoàn diễu hành. */
export const SPEED_MUL: readonly [number, number] = [0.8, 1.25];

/**
 * Tên gọi tạm, khớp 1–1 theo chỉ số với `WALKIN_STYLES`. Tách riêng khỏi `WALKIN_NAMES` vì mấy
 * người này KHÔNG phải khách — "khách lạ" sai hẳn nghĩa với một người chỉ đi ngang.
 *
 * Tên này chỉ hiện lúc người chơi bắt chuyện; trên đầu họ không có chip tên nào.
 */
export const PASSER_NAMES = [
  "người đi đường", "chị đeo khẩu trang", "cô xách giỏ", "bà cụ",
  "cô nón lá", "anh chạy xe", "chị áo hồng", "chú đeo kính",
];

/** Một lượt đi ngang: đi từ đâu tới đâu, nhanh chậm, có ngoái nhìn không. */
export type PassPlan = {
  /** Chỉ số trong `STREET_LANES`. */
  lane: number;
  /** Chỗ bước vào khung, và chỗ đi khuất. Luôn nằm ngoài khung nhìn. */
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** Chỗ dừng ngó cái xe, nằm NGAY TRÊN đường họ đi. `null` = đi thẳng, không ngoái. */
  spot: { x: number; y: number } | null;
  /** Đứng ngó mấy giây. 0 khi `spot` là null. */
  stay: number;
  speed: number;
  /** Chỉ số trong `WALKIN_STYLES` / `PASSER_NAMES`. */
  style: number;
};

/**
 * Giây thật tới người kế tiếp. Rút MỘT số — cố ý: thêm một lần rút ở đây là dịch cả dãy
 * số của dòng `passer`, tức mọi golden của người đi ngang lệch theo.
 */
export function nextGapSec(band: TimeBand, raining: boolean, rng: Rng): number {
  const [lo, hi] = GAP_SEC[band];
  return rng.range(lo, hi) * (raining ? RAIN_GAP_MUL : 1);
}

/**
 * Dựng một lượt đi ngang. `counterX` là cột của chỗ đưa hàng — chỗ ngoái nhìn phải nằm ngang tầm
 * cái xe, chứ ngoái ở cuối hẻm thì không ai hiểu họ đang nhìn gì.
 *
 * ⚠️ Thứ tự rút số là HỢP ĐỒNG (test `p6-passersby` neo vào nó): hướng · dải · dáng người · tốc độ
 * · có ngoái không · ngó mấy giây · lệch chỗ ngó. Chèn thêm một lần rút vào giữa là đổi hết mọi
 * người của mọi ngày.
 */
export function planPasser(rng: Rng, counterX: number): PassPlan {
  const rightward = rng.next() < 0.5;
  const lane = rng.int(0, STREET_LANES.length);
  const y = STREET_LANES[lane].y;
  const style = rng.int(0, WALKIN_STYLES.length);
  const speed = rng.range(SPEED_MUL[0], SPEED_MUL[1]);
  const glances = rng.next() < GLANCE_CHANCE;
  const stay = glances ? rng.range(GLANCE_SEC[0], GLANCE_SEC[1]) : 0;
  // Lệch ±1 ô quanh chỗ đưa hàng: ba người cùng dừng đúng một điểm thì nhìn ra là kịch bản.
  const spotX = glances ? counterX + rng.range(-1, 1) : 0;

  const [x0, x1] = STREET_X;
  const from = { x: rightward ? x0 : x1, y };
  const to = { x: rightward ? x1 : x0, y };
  return { lane, from, to, spot: glances ? { x: spotX, y } : null, stay, speed, style };
}

/**
 * Mờ dần ở hai đầu đường — người ta ĐI VÀO khung hình chứ không hiện ra. Hai đầu dải nằm ngoài
 * khung nhìn ở phần lớn vị trí camera nhưng không phải MỌI vị trí, và một người bật ra giữa vỉa hè
 * là thứ nhìn ra ngay.
 *
 * ⚠️ Đây là quãng mờ DUY NHẤT của người đi ngang, và nó đo bằng Ô BẢN ĐỒ. Đã từng có thêm một hệ
 * số mờ theo mép khung nhìn: nó làm người ta tan ra giữa đường, lại nhấp nháy theo bước chân của
 * người chơi vì camera bám người chơi. Lý do dài hơn ở `entities/CustomerActor.ts`.
 */
export const FADE_TILES = 1.5;

export function passerAlpha(x: number): number {
  const [x0, x1] = STREET_X;
  const d = Math.min(x - x0, x1 - x);
  return Math.max(0, Math.min(1, d / FADE_TILES));
}

// ──────────────────────────────────────────────────────────── mời khách vô

/**
 * Quán vắng thì bước ra mời một câu — và người ta vô hay không là chuyện của người ta. Đây là việc
 * DUY NHẤT làm được khi không có ai ở quầy, nên nó phải THẬT: có tay nghề, có rủi ro, không bao
 * giờ chắc ăn. Ba cái hãm:
 *  1. trần 0,8 — không câu nào kéo được mọi người vô
 *  2. hàng chờ ăn mạnh nhất, nên cơ chế này tự biết điều: chỉ đáng dùng lúc VẮNG
 *  3. `warmth` là điểm quan hệ kiếm được TRONG CHÍNH cuộc này — "mời khéo" nghĩa là nói mấy câu
 *     tử tế TRƯỚC rồi mới mời; trần +0,15, nịnh giỏi cỡ nào cũng không bằng một cái hàng ngắn
 *
 * Hết bánh thì bằng 0 — mời người ta vô rồi nói hết hàng là tệ hơn không mời.
 */
export const INVITE_MAX = 0.8;
export const INVITE_BASE = 0.2;
/** Giọng nào mời được. Gắt / lạnh thì không phải một lời mời, nên bằng 0 tuyệt đối. */
export const INVITE_TONE: Record<string, number> = {
  AM: 0.2, DUA: 0.08, THUONG: 0.04, THANG: -0.04,
};

export type InviteCtx = {
  /** `thanThien` ấm · `deTha` xuề xoà · `soi` kỹ tính. */
  person: { soi: number; deTha: number; thanThien: number };
  /** Người này vốn đã ngoái nhìn cái xe — nửa bước chân đã quay vô rồi. */
  glanced: boolean;
  tone: string;
  /** Điểm quan hệ kiếm được trong chính cuộc này (xem `warmth` ở trên). */
  warmth: number;
  /** Đang có mấy người đứng ở quầy, và cả thảy có mấy chỗ. */
  ahead: number;
  slots: number;
  soldOut: boolean;
};

export function inviteChance(o: InviteCtx): number {
  if (o.soldOut) return 0;
  const tone = INVITE_TONE[o.tone];
  if (tone === undefined) return 0;                      // LANH, GAT, CHUI, IM — không ai gọi đó là mời
  if (o.ahead >= o.slots) return 0;                      // hết chỗ đứng: mời cũng không có chỗ mà vô
  const p = INVITE_BASE
    + tone
    + (o.glanced ? 0.24 : 0)
    + Math.min(0.15, Math.max(0, o.warmth) * 0.03)
    + 0.15 * o.person.thanThien + 0.1 * o.person.deTha - 0.1 * o.person.soi
    - 0.13 * o.ahead;
  return Math.max(0, Math.min(INVITE_MAX, p));
}
