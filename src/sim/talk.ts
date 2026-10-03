/**
 * Trò chuyện có nhánh: mỗi nút mang `reply` và `then` của riêng nó; `ref` trỏ vào cây
 * con dùng chung trong `shared`. Thuần dữ liệu — không Phaser, không RNG riêng.
 *
 * ⚠️ Mở cuộc KHÔNG được đóng băng đồng hồ (`StallScene` đặt `clock.busy`), và `rel` /
 * `anger` không bao giờ lên màn hình (CANON T3).
 */
import type { Personality } from "../content/npcs";
import type { RelTier } from "../core/types";
import type { Rng } from "../core/rng";
import { record, talkPoints, type BaseKind, type RelState } from "./memory";
import { weekdayOf, type Weekday } from "./schedule";
import type { TimeBand } from "../core/clock";
import type { Face, PoseId } from "./reaction";
import type { PracticeId } from "../content/vocab";
import { pickWeighted, type Satisfies } from "./drives";
import type { DriveId } from "../content/vocab";

/**
 * Giọng của một lựa chọn — tô mép nút, và test bắt nhịp nào cả 4 dòng cùng giọng.
 *
 *   AM     ấm, hỏi han      THUONG xã giao        DUA  giỡn, chọc
 *   THANG  nói thẳng        LANH   cho qua        IM   không nói gì
 *   GAT    gắt với CHÍNH người đang đứng đây — luôn có giá
 *   CHUI   chửi NGƯỜI THỨ BA cùng với họ — khác GAT, hợp người thì được điểm
 */
export type TalkTone = "AM" | "THUONG" | "DUA" | "THANG" | "LANH" | "GAT" | "CHUI" | "IM";

export const TONE_LABEL: Record<TalkTone, string> = {
  AM: "ấm", THUONG: "thường", DUA: "giỡn", THANG: "thẳng",
  LANH: "lạnh", GAT: "gắt", CHUI: "chửi đổng", IM: "im",
};

/** Cây sâu quá ngần này là viết lỗi (hoặc `ref` quay vòng) — runtime cắt, test bắt. */
export const MAX_DEPTH = 6;

export type TalkEffect = {
  /** Điểm quan hệ cộng thẳng (không thành ký ức). Cỡ thường gặp: −6 … +4. */
  rel?: number;
  /** Thành ký ức hẳn hoi — chỉ cho câu đủ nặng để người ta còn nhớ sang hôm sau. */
  mem?: { kind: BaseKind; intensity: number };
  /** Giận 0..100 — ăn thẳng vào sức chờ của lượt ghé này (`waitSec` lên theo %). */
  anger?: number;
  /** Dỗ 0..100 — lấy lại ngần ấy % quãng đã chờ. ⚠️ Không `calm` nào được quá 30. */
  calm?: number;
  /** Đặt một cờ chuyện (story.flags) — cho arc và cho `need` của cuộc khác đọc lại. */
  flag?: string;
};

/**
 * Hành động thật mà một câu nói sinh ra. ⚠️ Mọi act có thời lượng đều phải khai `forSec`.
 *
 *   PAY        tiền ra khỏi két NGAY — nút bị ẩn nếu không đủ
 *   DISCOUNT   bớt tiền thật ở `settlePayment`    FREE_LOAF  ổ này không tính tiền
 *   PROMISE    hứa bỏ thêm món — kiểm lúc đưa bánh
 *   STEP_ASIDE bảo dạt qua cho người sau          REFUSE     không bán nữa
 *   INVITE     mời người đi ngang ghé vô mua
 */
/**
 * Thời lượng của một hành động: hết giờ thì họ quay lại đúng mục đích ban đầu. Hai mốc
 * không đo được bằng giây có tên riêng, mọi thứ khác là giây THẬT.
 */
export type ForSec = number | "TOI_LUOT" | "TOI_KHI_AN_XONG";

/** `forSec` quy ra giây, với hai mốc có tên thì trả `null` (người gọi tự biết khi nào hết). */
export const forSecOf = (f: ForSec): number | null => (typeof f === "number" ? f : null);

/**
 * Việc đã hứa, có HẠN tính bằng giây thật. Khác `PROMISE` (món kẹp vô ổ, kiểm lúc đưa
 * bánh) ở chỗ thưởng trả LÚC LÀM XONG, và nuốt lời có ba nấc theo tính cách.
 */
export type Deed = {
  what: string;
  /** Giây THẬT từ lúc nói. Trà ~25 s · trao tay ~15 s · chạy đi lấy ~40 s. */
  dueSec: number;
  /** Trả KHI LÀM XONG. */
  onKept?: TalkEffect;
  /** Ba nấc nuốt lời, theo thứ tự. Nấc cuối luôn là bỏ đi. */
  onBroken?: [TalkEffect, TalkEffect, TalkEffect];
};

export type TalkAct =
  | { kind: "PAY"; vnd: number; note: string }
  | { kind: "DISCOUNT"; vnd: number }
  | { kind: "FREE_LOAF" }
  | { kind: "PROMISE"; item: string }
  | { kind: "REFUSE" }
  /**
   * Bảo họ dạt qua cho người sau — họ nghe hay không là chuyện của họ.
   * `forSec: "TOI_LUOT"` nép tới khi người được nhường xong việc; không có ai để nhường
   * thì `ASIDE_HOLD_SEC` giây rồi bước vô lại.
   */
  | { kind: "STEP_ASIDE"; forSec: ForSec }
  /**
   * Mời người đi ngang ghé mua. Người viết phải khai CẢ `yes` và `no` — kết cục do roll
   * `sim/passersby.inviteChance` × `purpose.purposeInviteMul` quyết, không do người chơi.
   */
  | { kind: "INVITE"; yes: string; no: string }
  /**
   * Họ đi tiếp, kết thúc cuộc. Với `QUA_DUONG` đây là trạng thái NGHỈ: nút lá không khai
   * act thì mặc định đi tiếp (`Service.walkOnDefault`).
   */
  | { kind: "WALK_ON" }
  /** Ổ rời tay người chơi, họ cầm lấy, ăn. 60 nút đòi tới. */
  | { kind: "GIVE_BREAD"; forSec: ForSec }
  /** Tốn một ly thật; họ nhận HOẶC từ chối theo tính cách + tâm trạng + mục đích. */
  | { kind: "OFFER_TEA"; forSec: ForSec }
  /** Họ đi tới ô hóng mát và đứng đó, rồi **đi tiếp đúng mục đích cũ**. */
  | { kind: "STAND_IN_SHADE"; forSec: ForSec }
  /**
   * HỌ NGỒI XUỐNG — mở khoá bằng thiết bị `GHE_BAN`, chỗ ngồi là `world/map.SEAT_SPOT`.
   *
   * `P2-08` §2 nhóm C đòi 24 lần, và tới đợt này nó vẫn là món nợ to nhất: `GHE_BAN` mua
   * được, vẽ ra được, mà **không nút thoại nào làm ai ngồi xuống**. Hai mươi bốn câu mời
   * ngồi chạy không tải.
   */
  | { kind: "THEY_SIT"; forSec: ForSec }
  /**
   * HỌ QUAY PHIM — bé Su (13 nhắc), và `walkin.quayclip` (anh làm kênh review).
   *
   * `P2-08` §2 nhóm C ghi *"quay phim là lý do tồn tại của nhân vật"*, mà tới đợt này
   * mười ba câu "ừ con quay đi" vẫn không làm ai giơ điện thoại lên. Cái clip thì đã có
   * sẵn chỗ trong kinh tế từ lâu (`story.clipDay` → ×1,4 lượng khách ba ngày), chỉ là nó
   * do kịch bản đặt chứ không do việc bé Su quay cái gì.
   */
  | { kind: "FILM"; forSec: ForSec }
  /** Bảo họ cất máy — đoạn quay huỷ, không ra clip nào. */
  | { kind: "STOP_FILM" }
  | { kind: "LEAVE_SHADE" }
  /** Họ quay nhìn vào quầy. */
  | { kind: "LOOK_INSIDE"; forSec: ForSec }
  /** Lời hứa có hạn — xem `Deed`. */
  | { kind: "PROMISE_DEED"; deed: Deed }
  /** Ghi nợ một ổ. KHÁC `FREE_LOAF`: nợ là nợ, có sổ, và có ngày đòi (`chu-tu`). */
  | { kind: "CREDIT_LOAF" };


/**
 * Cảm xúc của câu đáp — người viết khai, không suy ra từ `rel` / `anger`. Bảng dưới dịch
 * sang ba lớp mặt của P2-02, cộng dáng người hay đi kèm.
 *
 * ⚠️ KHÔNG dùng emoji: bảng glyph của game (linter L013) chỉ có chữ Việt và dấu câu.
 */
export type TalkMood =
  | "CUOI_TUOI" | "CUOI" | "CUOI_KHAN" | "THUONG" | "NGAC_NHIEN" | "NGUONG"
  | "BUON" | "RUNG_RUNG" | "GIAN" | "BUC" | "NGHI" | "LANH" | "MET" | "NGHIEM";

/** Tên tiếng Việt — nhật ký cuối ngày và tooltip dev đọc. */
export const MOOD_LABEL: Record<TalkMood, string> = {
  CUOI_TUOI: "cười lớn", CUOI: "cười nhẹ", CUOI_KHAN: "cười gượng", THUONG: "thương",
  NGAC_NHIEN: "ngạc nhiên", NGUONG: "ngượng", BUON: "buồn", RUNG_RUNG: "rưng rưng",
  GIAN: "giận", BUC: "bực", NGHI: "nghi", LANH: "lạnh", MET: "mệt", NGHIEM: "nghiêm",
};

/**
 * Mỗi cảm xúc → một bộ ba (mày, mắt, miệng) của `entities/face.ts`.
 *   Mày  0 thường · 1 nhíu nhẹ · 2 nhíu sâu · 3 nhướn · 4 lệch · 5 xuôi
 *   Mắt  0 thường · 1 nheo · 2 mở to · 3 liếc ngang · 4 nhắm · 5 cười
 *   Miệng 0 thường · 1 mím · 2 cười nhẹ · 3 cười tươi · 4 méo · 5 há
 */
export const MOOD_FACE: Record<TalkMood, Face> = {
  CUOI_TUOI:  [3, 5, 3],
  CUOI:       [0, 5, 2],
  CUOI_KHAN:  [4, 0, 2],
  THUONG:     [5, 5, 2],
  NGAC_NHIEN: [3, 2, 5],
  NGUONG:     [3, 4, 2],
  BUON:       [5, 4, 0],
  RUNG_RUNG:  [5, 2, 1],
  GIAN:       [2, 1, 4],
  BUC:        [1, 3, 1],
  NGHI:       [1, 1, 0],
  LANH:       [0, 0, 1],
  MET:        [5, 4, 1],
  NGHIEM:     [1, 0, 1],
};

/** Dáng đi kèm. Cảm xúc không chỉ nằm trên mặt — người ta ngả tới hay lùi ra theo. */
export const MOOD_POSE: Record<TalkMood, PoseId> = {
  CUOI_TUOI: "LEAN_IN", CUOI: "NOD", CUOI_KHAN: "SHRUG", THUONG: "SETTLE_IN",
  NGAC_NHIEN: "STEP_BACK_HALF", NGUONG: "TURN_AWAY_QUARTER", BUON: "IDLE", RUNG_RUNG: "SETTLE_IN",
  GIAN: "LEAN_IN", BUC: "ARMS_CROSS", NGHI: "PEEK_OVER", LANH: "FREEZE", MET: "SETTLE_IN",
  NGHIEM: "TILT_HEAD",
};

/** Cảm xúc nào là ÂM — test đòi câu `GAT` không được đáp bằng mặt cười. */
export const MOOD_NEGATIVE: ReadonlySet<TalkMood> = new Set<TalkMood>(["GIAN", "BUC", "LANH", "BUON", "MET", "NGHI"]);

/**
 * Hợp đồng ba phần của một câu nói:
 *
 *   TRƯỚC  `need`   cần chuyện gì ĐÃ xảy ra   → không thoả: KHÔNG HIỆN lựa chọn
 *   LÚC    `while`  cần gì ĐANG đúng lúc nói  → không thoả: NPC hiện "?" rồi bỏ qua
 *   SAU    `act`    nói xong thế giới đổi gì  → không có: là free word
 *
 * Hai cách xử khác nhau vì hai loại sai khác nhau: `need` sai = câu đó vô nghĩa với
 * người này; `while` sai = vừa nãy còn đúng, giờ hết đúng.
 */
export type TalkNode = TalkEffect & {
  /**
   * Cần ĐANG đúng ngay lúc bấm. Không thoả ⇒ NPC hiện "?" và nhịp đó kết thúc.
   * Từ vựng khoá: `docs/phase-2-he-npc/P2-07-neo-thoai-vao-the-gioi.md` §3.
   */
  while?: string[];
  /**
   * Chuyện này nói về thẻ gì — đầu vào của truy hồi ký ức. Vắng = kế thừa `about` của cả
   * cuộc; khai ở đây khi một nhánh rẽ sang chuyện khác hẳn.
   */
  about?: string[];
  /** Hành động thật câu này gây ra ở thế giới. */
  act?: TalkAct;
  /** Ẩn nút nếu két không đủ ngần này tiền — không hứa được cái mình không trả nổi. */
  needCash?: number;
  /** Câu người chơi nói. Ngắn — nó nằm trên một cái nút. */
  say: string;
  tone: TalkTone;
  /** Câu khách đáp ĐÚNG lựa chọn này. */
  reply?: string;
  /**
   * Khách đáp câu này bằng MẶT MŨI nào. Vắng = `applyTalkOption` suy ra; có khai thì nó
   * thắng.
   */
  mood?: TalkMood;
  /**
   * Khách KHÔNG đáp, cố ý. Test đòi mọi nút không có `reply` phải khai cờ này, để phân
   * biệt với chỗ quên viết `reply`.
   */
  silent?: boolean;
  /** Bộ lựa chọn tiếp theo CỦA RIÊNG nhánh này. Vắng (và không có `ref`) = hết chuyện. */
  then?: TalkNode[];
  /** Nhập vào một cây con đặt tên trong `talk.shared` — để nhánh hội tụ mà khỏi chép lại. */
  ref?: string;
  /**
   * Cần gì ĐÃ xảy ra rồi. Không thoả ⇒ ẩn hẳn lựa chọn, nên chỉ dùng cho sự thật TĨNH —
   * sự thật ĐỘNG thì dùng `while`. Hai loại khoá, phân biệt bằng DẤU CHẤM:
   *
   *   `coBienHieu`    không có dấu chấm ⇒ cờ chuyện (`story.flags`)
   *   `p.holdsBread`  có dấu chấm ⇒ khoá bảng đen (`_blackboard.json` mục `aliases`)
   *   `m.visits(3)`   khoá có tham số · `!x` phủ định
   */
  need?: string | string[];
  /**
   * Chỉ hiện khi người chơi ĐÃ MUA thiết bị này. Test `E-1` của `p2-equip-talk` quét nội
   * dung theo bảng từ vựng đạo cụ và bắt mọi câu nhắc đồ phải mua mà thiếu cổng này.
   */
  needEquip?: string;
};

export type TalkWhen = {
  /** Khoảng ngày [từ, tới] trong mùa 40 ngày. */
  day?: [number, number];
  weekday?: Weekday[];
  tier?: RelTier[];
  slot?: TimeBand[];
  rain?: boolean;
  /** Ghé đủ ngần này lần rồi mới có chuyện này để nói. */
  minVisits?: number;
  needFlag?: string;
  /** Không hiện khi cờ này bật (chuyện đã cũ / người ta đã đi rồi). */
  notFlag?: string;
  /** Cả cuộc chỉ mở khi đã mua thiết bị này — xem `TalkNode.needEquip`. */
  needEquip?: string;
  /**
   * CẢ CUỘC chỉ sống khi thế giới đang thế này — khoá bảng đen, phép VÀ.
   *
   * Khác `TalkNode.need` ở TẦNG: `need` ẩn một LỰA CHỌN, cái này rút cả CUỘC ra. Dùng khi
   * chủ đề của cả cuộc dựa vào một sự thật.
   */
  world?: string[];
};

/**
 * Ai được quyền mở lời. Bắt buộc khai; linter L014 fail nếu vắng.
 *
 *   NPC_ONLY    ý định / hoàn cảnh / yêu cầu của chính họ — ĐA SỐ (81/86 cuộc)
 *   PLAYER_ONLY chỉ có nghĩa khi người chơi chủ động gợi — tầng chào hỏi dùng chung `ANY`
 *   BOTH        chuyện phiếm chung, ai mở cũng được
 */
export type TalkSource = "NPC_ONLY" | "PLAYER_ONLY" | "BOTH";

/**
 * Cuộc này tốn bao nhiêu thời gian ĐỌC, không đo độ quan trọng.
 *   BARK  một nhịp · SHORT  ba nhịp, không `act` · FULL  cây đầy đủ
 *
 * Chỉ `FULL` tiêu vào trần `TALK_DEEP_PER_DAY` và đòi mở dải lựa chọn ở kênh LỜI.
 * `BARK` / `SHORT` chạy được cả lúc đang bán.
 */
export type TalkDepth = "BARK" | "SHORT" | "FULL";

/**
 * Loại hội thoại — trục vuông góc với `depth`: chuyện này để LÀM GÌ.
 *
 *   MOI     mời người đi ngang ghé mua. Người chơi luôn mở lời, kết cục là một cái roll.
 *           KHÔNG trí nhớ, KHÔNG điểm quan hệ, KHÔNG tiêu trần ngày.
 *   CHAO    xã giao — hỏi đường, đứng nhờ mái hiên. Không hệ quả đáng kể.
 *   MUA     chuyện phát sinh lúc mua bán với khách vãng lai, tắt theo lượt ghé.
 *   CHUYEN  chuyện đời của 12 người CÓ TÊN. Chỗ duy nhất có trí nhớ, lời hứa, arc nhiều
 *           ngày, và là chỗ duy nhất tiêu vào trần `TALK_DEEP_PER_DAY`.
 */
export type TalkKind = "MOI" | "CHAO" | "MUA" | "CHUYEN";

/** Loại của một cuộc, suy ra từ kho + nội dung (cả bốn loại ứng 1–1 với kho thoại). */
export function kindOf(t: Talk): TalkKind {
  if (t.kind) return t.kind;
  if (t.npc === "ANY") return "CHAO";
  if (t.npc === "QUA_DUONG") return hasInvite(t) ? "MOI" : "CHAO";
  if (t.npc === "WALKIN") return "MUA";
  return "CHUYEN";
}

/**
 * Nói xong người ta nhẹ đi chuyện gì — suy từ kho + `source` + `depth`.
 *
 * Một luật trái chiều: cuộc nào cũng đẩy `VIEC_RIENG` LÊN, vì đứng nói chuyện là chậm
 * việc của người ta. Đó là cái hãm giữ cho tán gẫu không bao giờ miễn phí.
 */
export function satisfiesOf(t: Talk): Satisfies {
  if (t.drives) return t.drives;
  const deep = t.depth === "FULL" ? 1.6 : t.depth === "SHORT" ? 1 : 0.5;
  const k = kindOf(t);
  if (k === "MOI") return { VIEC_RIENG: -12 * deep };
  const out: Satisfies = { VIEC_RIENG: -6 * deep };
  if (t.source !== "PLAYER_ONLY") out.KE_CHUYEN = 30 * deep;
  if (t.source !== "NPC_ONLY") out.DUOC_HOI = 28 * deep;
  if (k === "MUA") out.DUOC_PHUC_VU = 22 * deep;
  // Nhiều lời than trong cây = một cuộc để xả. Đếm giọng, không bắt ai khai.
  const tones = walkNodes(t).map((x) => x.node.tone);
  const kho = tones.filter((x) => x === "CHUI" || x === "THANG").length;
  if (kho >= 2) out.PHAN_NAN = 18 * deep;
  return out;
}

/** Cuộc này có đường mời khách ở đâu đó không. */
export function hasInvite(t: Talk): boolean {
  return walkNodes(t).some((x) => x.node.act?.kind === "INVITE");
}

/**
 * Cuộc này MỞ MIỆNG RA đã là mời chưa — chỉ xét NHỊP ĐẦU, khác `hasInvite`. Đây là cái
 * quyết ai được miễn sàn điểm trong `pickTalk`.
 */
export const opensWithInvite = (t: Talk): boolean =>
  t.tree.some((n) => n.act?.kind === "INVITE");

/** Chỉ `CHUYEN` mới ăn vào trần cuộc sâu mỗi ngày — xem `TalkKind`. */
export const countsAgainstDailyCap = (t: Talk) => kindOf(t) === "CHUYEN" && t.depth === "FULL";

/**
 * Cuộc này có được đụng vào TRÍ NHỚ và ĐIỂM QUAN HỆ không. `MOI` thì không: `memKey` của
 * người đi ngang dùng chung cho tám dáng người suốt cả mùa.
 */
export const touchesRelationship = (t: Talk) => kindOf(t) !== "MOI";

/**
 * Người chơi đang mở lời, hay đang trả lời? Quyết định rút từ tập nào.
 *   PLAYER  người chơi chủ động (bấm phím) — loại `NPC_ONLY`
 *   NPC     khách tự bắt chuyện           — loại `PLAYER_ONLY`
 */
export type TalkOpenBy = "PLAYER" | "NPC";

/** Tối đa bao nhiêu lựa chọn hiện ra MỘT nhịp — ngân sách đọc, P2-06 §2.6. */
export const TALK_CHOICES_MAX = 3;

/** Dưới ngần này điểm thì KHÔNG mở được cuộc nào — xem khối trong `pickTalk`. */
export const TALK_SCORE_FLOOR = -5;

export type Talk = {
  id: string;
  /** NPC id, hoặc `WALKIN` (khách vãng lai), hoặc `ANY`. */
  npc: string;
  /** Chủ đề — mỗi ngày mỗi người chỉ đụng một chủ đề một lần. */
  topic: string;
  /** Ai được quyền mở lời. Bắt buộc. */
  source: TalkSource;
  /** Tốn bao nhiêu thời gian đọc. Bắt buộc. */
  depth: TalkDepth;
  /** Loại hội thoại. Vắng thì `kindOf()` suy ra từ kho — xem `TalkKind`. */
  kind?: TalkKind;
  /**
   * Khung cảnh cuộc này sống được. Vắng = mọi khung cảnh — hiếm, và phải có lý do ghi
   * trong `_note`; `tools/validate-talks` kiểm chuyện đó.
   */
  practice?: PracticeId | PracticeId[];
  /** Câu khách nói trước. */
  opener: string;
  /** Mặt khách lúc nói `opener`. */
  openMood?: TalkMood;
  /**
   * Khách TỰ bắt chuyện (không cần F): 0..0,6, roll khi họ đứng chờ. Người chơi làm lơ
   * được, và làm lơ có giá — xem `ignore`.
   */
  initiates?: number;
  /** Người chơi đóng bảng mà không chọn gì (Esc). Vắng = coi như `{ rel: -1 }`. */
  ignore?: { reply?: string; rel?: number; anger?: number; mem?: TalkEffect["mem"]; mood?: TalkMood };
  when?: TalkWhen;
  /**
   * Trọng số khi nhiều cuộc cùng đủ điều kiện, mặc định 10. Là ĐƯỜNG LUI: `pickTalk` chấm
   * điểm theo drive khi `TalkCtx.score` có mặt.
   */
  weight?: number;
  /**
   * Nói xong người ta nhẹ đi chuyện gì. Vắng thì `satisfiesOf()` suy ra; khai tay chỉ khi
   * suy ra sai.
   */
  drives?: Partial<Record<DriveId, number>>;
  /**
   * CẢ CUỘC này nói về thẻ gì (thẻ của `sim/recall.tagsOf`) — đầu vào của `retrieve()`,
   * chấm relevance bằng Jaccard. Vắng = "nhớ gì cũng được", relevance bị bỏ khỏi tổng.
   *
   * ⚠️ KHÔNG phải chỗ khai chuyện gì đã xảy ra — chuyện nào được nhớ ra là việc của
   * `retrieve()`.
   */
  about?: string[];
  /** Nhịp đầu. */
  tree: TalkNode[];
  /** Cây con dùng chung, cho `ref` trỏ tới. */
  shared?: Record<string, TalkNode[]>;
};

export type TalkFile = { talks: Talk[] };

// ─────────────────────────────────────────────────────────────── danh xưng

/**
 * Ai gọi ai bằng gì — `self` / `you` là của khách, `call` / `me` là của người chơi.
 * Bảng này là lưới chắn: test `p5-talk` đọc nó và bắt mọi dòng dùng sai đại từ.
 */
export type Address = { self: string; you: string; call: string; me: string };

/**
 * Kho thoại KHÔNG gắn với một người cố định.
 *   WALKIN     khách vãng lai — đang mua, chỉ là chưa biết tên
 *   QUA_DUONG  người chỉ đi ngang (`sim/passersby.ts`) — KHÔNG mua gì
 *
 * Hai cái này đổi vai mỗi lượt, nên lưới danh xưng với họ chỉ đòi gọi bằng MỘT trong
 * `WALKIN_CALLS`, không đòi đúng một từ như với 12 người có tên.
 */
export const ANON_TALK_POOLS = ["WALKIN", "QUA_DUONG"] as const;
export const EXTRA_TALK_POOLS = [...ANON_TALK_POOLS, "ANY"] as const;

export const ADDRESS: Record<string, Address> = {
  BA_BAY:    { self: "bà",   you: "con", call: "bà",   me: "con" },
  CHU_TU:    { self: "chú",  you: "con", call: "chú",  me: "con" },
  ANH_DUNG:  { self: "anh",  you: "em",  call: "anh",  me: "em" },
  CHI_LAN:   { self: "em",   you: "em",  call: "chị",  me: "em" },
  BE_SU:     { self: "con",  you: "cô",  call: "con",  me: "cô" },
  ONG_HAI:   { self: "chú",  you: "con", call: "chú",  me: "con" },
  CO_MAI:    { self: "cô",   you: "con", call: "cô",   me: "con" },
  THAY_PHUC: { self: "thầy", you: "con", call: "thầy", me: "con" },
  CHI_HANH:  { self: "chị",  you: "em",  call: "chị",  me: "em" },
  ANH_BAO:   { self: "em",   you: "cô",  call: "em",   me: "cô" },
  BA_SAU:    { self: "tui",  you: "con", call: "bà",   me: "con" },
  CHU_KIET:  { self: "tao",  you: "mày", call: "chú",  me: "tui" },
  WALKIN:    { self: "tui",  you: "em",  call: "anh",  me: "em" },
  QUA_DUONG: { self: "tui",  you: "cô",  call: "anh",  me: "em" },
};

/**
 * Danh xưng người lạ theo DÁNG NGƯỜI — khớp 1–1 theo chỉ số với `WALKIN_STYLES` (và vì
 * vậy với `WALKIN_NAMES` / `PASSER_NAMES`).
 *
 * Nội dung viết `{call}` / `{me}` / `{self}` / `{you}` và `Service.fill()` thay vào đúng
 * vai của người đang đứng đó — một bộ thoại dùng chung cho cả tám người.
 */
export const WALKIN_ADDRESS: readonly Address[] = [
  { self: "tui", you: "cô",  call: "anh", me: "em" },   // 0 tóc ngắn — anh
  { self: "tui", you: "em",  call: "chị", me: "em" },   // 1 đuôi gà, khẩu trang — chị
  { self: "tui", you: "cô",  call: "cô",  me: "em" },   // 2 tóc bob, xách giỏ — cô
  { self: "tui", you: "con", call: "bà",  me: "con" },  // 3 tóc búi bạc, lưng còng — bà cụ
  { self: "tui", you: "con", call: "cô",  me: "con" },  // 4 nón lá — cô
  { self: "tui", you: "cô",  call: "anh", me: "em" },   // 5 nón bảo hiểm — anh chạy xe
  { self: "tui", you: "em",  call: "chị", me: "em" },   // 6 đuôi gà, áo hồng — chị
  { self: "tui", you: "con", call: "chú", me: "con" },  // 7 đeo kính, tóc ngắn — chú
];

/**
 * Người lạ không có MỘT vai cố định, nên lưới danh xưng với họ — cả `WALKIN` lẫn
 * `QUA_DUONG`, xem `ANON_TALK_POOLS` — chỉ đòi gọi bằng một trong mấy vai này.
 */
export const WALKIN_CALLS = ["anh", "chị", "cô", "chú", "bà", "ông", "em"];

/**
 * Đại từ CẤM trong lời của từng người (lưới L-6 của test). Không suy ra được từ `ADDRESS`
 * vì chiều ngược lại mới là chỗ sai hay gặp.
 */
export const FORBIDDEN_SELF: Record<string, string[]> = {
  BE_SU: ["chị", "cô ấy", "tui", "tao"],
  ANH_BAO: ["anh", "tui", "tao", "chú"],
  CHI_LAN: ["tui", "tao"],
  THAY_PHUC: ["tao", "tui", "chú", "anh"],
  BA_BAY: ["tao", "chị", "em"],
  CHU_TU: ["tao", "anh", "ông"],
  CO_MAI: ["tao", "chị", "bà"],
  ONG_HAI: ["cô", "chị", "em"],
  BA_SAU: ["tao", "cô", "chị"],
  ANH_DUNG: ["tao", "chú", "tui"],
  CHI_HANH: ["tui", "tao", "cô"],
};

// ─────────────────────────────────────────────────────────────── chọn cuộc

/** Mọi thứ cần biết để lọc + chấm một cuộc trò chuyện. Service dựng, talk.ts không tự đọc gì. */
export type TalkCtx = {
  npcId: string;
  day: number;
  slot: TimeBand;
  rain: boolean;
  tier: RelTier;
  visits: number;
  flags: Record<string, string | number | boolean | undefined>;
  /** Chủ đề đã đụng hôm nay với CHÍNH người này (không lặp chủ đề trong ngày). */
  usedToday: readonly string[];
  /** id cuộc đã chơi cả mùa — không bao giờ lặp lại nguyên một cuộc. */
  usedSeason: readonly string[];
  /** Người chơi đã mua thiết bị này chưa. Vắng = coi như có đủ. */
  hasEquip?: (id: string) => boolean;
  /** Khung cảnh đang diễn ra — P2-09 §2.5. Vắng = không lọc (test, công cụ). */
  practice?: PracticeId;
  /** Một khoá bảng đen có đúng không — cho `TalkWhen.world`. Vắng = coi như thoả. */
  holds?: (key: string) => boolean;
  /**
   * Chấm điểm một cuộc theo drive của người đang đứng đó. Vắng = rơi về `weight`, để
   * `tools/sim.ts` và golden bốn mươi ngày chạy y như cũ.
   */
  score?: (t: Talk) => number;
};

export function okWhen(w: TalkWhen | undefined, c: TalkCtx): boolean {
  if (!w) return true;
  if (w.day && (c.day < w.day[0] || c.day > w.day[1])) return false;
  if (w.weekday && !w.weekday.includes(weekdayOf(c.day))) return false;
  if (w.tier && !w.tier.includes(c.tier)) return false;
  if (w.slot && !w.slot.includes(c.slot)) return false;
  if (w.rain !== undefined && w.rain !== c.rain) return false;
  if (w.minVisits !== undefined && c.visits < w.minVisits) return false;
  if (w.needFlag && !c.flags[w.needFlag]) return false;
  if (w.needEquip && !(c.hasEquip?.(w.needEquip) ?? true)) return false;
  if (w.notFlag && c.flags[w.notFlag]) return false;
  // Vắng `holds` (test, công cụ) = coi như THOẢ: một bộ ctx trần không được phép làm cả
  // kho biến mất — cùng lý do với `TalkGate.holds`.
  if (w.world?.length && c.holds && !w.world.every((k) => c.holds!(k))) return false;
  return true;
}

/**
 * Ai mở lời thì rút được cuộc nào. ⚠️ Cổng này nằm trong `eligible()` chứ KHÔNG ở chỗ
 * gọi — đặt ở đây thì không đường nào vòng được.
 */
export function okSource(t: Talk, by: TalkOpenBy): boolean {
  return by === "PLAYER" ? t.source !== "NPC_ONLY" : t.source !== "PLAYER_ONLY";
}

/**
 * Cuộc dùng chung KHÔNG BAO GIỜ CẠN: không áp `usedSeason`, chỉ còn `usedToday` theo chủ
 * đề. Hôm nay hỏi thăm rồi thì mai hỏi tiếp.
 */
export const isSharedTalk = (t: Talk) => t.npc === "ANY";

/**
 * Cuộc này sống được trong khung cảnh đang diễn ra không. Không khai `practice` = sống ở
 * mọi khung; `validate-talks` T009 đẩy việc gắn nhãn đi tới.
 */
export function okPractice(t: Talk, here: PracticeId | undefined): boolean {
  if (!t.practice || !here) return true;
  return Array.isArray(t.practice) ? t.practice.includes(here) : t.practice === here;
}

export function eligible(all: readonly Talk[], c: TalkCtx, by: TalkOpenBy = "PLAYER"): Talk[] {
  return all.filter((t) =>
    (t.npc === c.npcId || t.npc === "ANY")
    && okSource(t, by)
    && okPractice(t, c.practice)
    && (isSharedTalk(t) || !c.usedSeason.includes(t.id))
    && !c.usedToday.includes(t.topic)
    && okWhen(t.when, c));
}

/**
 * Rút một cuộc theo trọng số, dùng stream `dialog-shufflebag`. ⚠️ KHÔNG được đụng
 * `npc-schedule`, nếu không bấm F hôm nay làm xê dịch ai tới ngày mai.
 */
export function pickTalk(all: readonly Talk[], c: TalkCtx, rng: Rng, by: TalkOpenBy = "PLAYER"): Talk | null {
  const list = eligible(all, c, by);
  if (!list.length) return null;
  /* Chấm điểm theo drive. `c.score` do `Service` đưa vào; vắng thì rơi về `weight`. */
  const scored = list.map((t) => ({ item: t, score: c.score ? c.score(t) : (t.weight ?? 10) }));
  if (c.score) {
    /*
     * SÀN ĐIỂM — người ta đang bận thì KHÔNG AI BẮT CHUYỆN ĐƯỢC. Thiếu nó thì
     * `pickWeighted` luôn trả về một cuộc, kể cả khi mọi điểm đều âm nặng.
     *
     * Trả `null` chứ không trả một cuộc tệ: `talkUnavailable()` có sẵn câu đúng.
     */
    /*
     * LỜI MỜI KHÔNG BỊ SÀN CHẶN. Hai chuyện khác nhau: mở miệng mời thì ai cũng mời được,
     * còn họ có ghé không là việc của `inviteChance` × `purposeInviteMul`.
     *
     * Miễn theo `opensWithInvite`, KHÔNG theo `hasInvite`: cuộc có lời mời tận nhịp hai
     * thì nhịp đầu vẫn là tán gẫu.
     */
    const ok = scored.filter((x) => x.score >= TALK_SCORE_FLOOR || opensWithInvite(x.item));
    if (!ok.length) return null;
    /*
     * XOAY DANH SÁCH TRƯỚC KHI CHẤM — điểm bằng nhau thì `Array.sort` ổn định cho THỨ TỰ
     * TRONG FILE quyết định mãi mãi, và nội dung viết sau không bao giờ chạy.
     *
     * Rút MỘT số nữa, LUÔN LUÔN rút — không rút có điều kiện (P0-02 §2.3).
     */
    const off = Math.floor(rng.next() * ok.length);
    const spun = off ? [...ok.slice(off), ...ok.slice(0, off)] : ok;
    return pickWeighted(spun, rng.next());
  }
  const total = scored.reduce((a, x) => a + x.score, 0);
  let x = rng.next() * total;
  for (const s of scored) if ((x -= s.score) < 0) return s.item;
  return list[list.length - 1];
}

/** Điều kiện hiện một lựa chọn: cờ chuyện + tiền trong két + người ta đã từ chối chưa. */
export type TalkGate = {
  flags: TalkCtx["flags"];
  /**
   * Một khoá bảng đen có đúng không — `Service` đưa vào (`worldfacts.holds` đã gắn sẵn
   * ảnh chụp thế giới). Vắng = coi như đúng hết (test, headless).
   */
  holds?: (key: string) => boolean;
  cash?: number;
  /** Người chơi đã mua thiết bị này chưa. Vắng = coi như có đủ (test dựng gate trần). */
  hasEquip?: (id: string) => boolean;
  /** Người này đã lắc đầu với một lời mời rồi — ẩn hẳn mọi lựa chọn `INVITE`. */
  noInvite?: boolean;
};

/**
 * Lựa chọn nào được hiện ở nhịp này. Luôn trả về ít nhất một đường ra — lọc sạch hết thì
 * người chơi kẹt giữa buổi bán.
 *
 * ⚠️ Đường lui phải là một nút THẬT SỰ đi được (ưu tiên nút qua được cổng tiền), không
 * phải `nodes.slice(0, 1)`. Trần `TALK_CHOICES_MAX` cắt SAU khi lọc.
 */
export function visibleOptions(nodes: readonly TalkNode[], gate: TalkGate): TalkNode[] {
  const affordable = (o: TalkNode) => o.needCash === undefined || (gate.cash ?? Infinity) >= o.needCash;
  const offerable = (o: TalkNode) => !(gate.noInvite && o.act?.kind === "INVITE");
  const equipped = (o: TalkNode) => !o.needEquip || (gate.hasEquip?.(o.needEquip) ?? true);
  const needed = (o: TalkNode) => needKeys(o).every((k) => gateOk(k, gate));
  const out = nodes.filter((o) => needed(o) && affordable(o) && offerable(o) && equipped(o));
  const list = out.length ? out : nodes.filter((o) => affordable(o) && offerable(o) && equipped(o));
  return trimKeepingExit(list.length ? list : [...nodes]);
}

/** `need` nhận cả một chuỗi lẫn một mảng — mảng là phép VÀ. */
export const needKeys = (o: TalkNode): string[] =>
  o.need === undefined ? [] : Array.isArray(o.need) ? o.need : [o.need];

/**
 * Khoá VÉT CẠN — luôn đúng đúng MỘT trong mấy giá trị này, không bao giờ vắng mặt. Nhờ
 * vậy một nhịp chia theo khoá vét cạn thì KHÔNG BAO GIỜ teo.
 */
export const EXHAUSTIVE_KEYS: Record<string, readonly string[]> = {
  "c.openedBy": ["PLAYER", "NPC"],
};

/**
 * Khoá CHỈ NHẬN MỘT GIÁ TRỊ một lúc, nên `beatWidth` đếm chúng là MỘT dòng.
 *
 * ⚠️ `m.tier` và `t.tier` là CÙNG một sự thật (`seasonTier`) dưới hai alias — cả hai phải
 * có mặt ở đây. (`c.saidTone` và `v.promised` KHÔNG thuộc đây — chúng là tập.)
 */
const SINGLE_VALUED = ["t.purpose", "t.state", "t.practice", "t.tier", "m.tier", "w.band", "c.openedBy"];

/**
 * MỘT NHỊP RA MẤY DÒNG — đếm thứ người chơi THẤY, không đếm phần tử trong mảng.
 *   `min`  nhánh NGHÈO NHẤT còn mấy dòng — dưới 2 là lưới `T011` bắt
 *   `max`  nhịp ĐÔNG NHẤT ra mấy dòng — trên 4 là quá ngân sách đọc, lưới `L-2`
 *
 * Cách đếm: nút không cổng tính cho mọi nhánh; nút chỉ khoá bằng một khoá vét cạn tính
 * cho đúng nhánh của nó; nút khoá bằng thứ khác không tính vào `min` nhưng có tính vào
 * `max`, và mấy nút khoá cùng một khoá đơn-trị chỉ góp MỘT vào `max`.
 */
export function beatWidth(nodes: readonly TalkNode[]): { min: number; max: number; worst: string } {
  type Info = { branch: [string, string] | null; other: string[] };
  const infoOf = (o: TalkNode): Info => {
    let branch: [string, string] | null = null;
    const other: string[] = [];
    if (o.needCash !== undefined) other.push("needCash");
    if (o.needEquip) other.push(`needEquip:${o.needEquip}`);
    for (const raw of needKeys(o)) {
      const neg = raw.startsWith("!");
      const k = neg ? raw.slice(1) : raw;
      const m = /^([a-z]\.[a-zA-Z]+)\((.*)\)$/.exec(k);
      if (m && EXHAUSTIVE_KEYS[m[1]] && !neg) { branch = [m[1], m[2]]; continue; }
      other.push(m && SINGLE_VALUED.includes(m[1]) ? m[1] : k);
    }
    return { branch, other };
  };

  const infos = nodes.map(infoOf);
  const always = infos.filter((x) => !x.branch && !x.other.length).length;
  const aliases = new Set(infos.map((x) => x.branch?.[0]).filter((x): x is string => !!x));

  const widthOf = (keep: (x: Info) => boolean) => {
    const groups = new Set<string>();
    let n = 0;
    for (const x of infos) {
      if (!keep(x)) continue;
      if (!x.other.length) { n++; continue; }
      /*
       * Nhóm theo KHOÁ ĐƠN-TRỊ nếu có, không theo cả bộ cổng: hai nút cùng khoá
       * `t.purpose` loại trừ nhau dù cổng kèm theo khác nhau.
       */
      const don = x.other.find((k) => SINGLE_VALUED.includes(k));
      groups.add(don ?? x.other.slice().sort().join("+"));
    }
    return n + groups.size;
  };

  if (!aliases.size) {
    const only = (x: Info) => !x.branch;
    return { min: always, max: widthOf(only), worst: "(không cổng)" };
  }
  let min = Infinity, max = 0, worst = "(không cổng)";
  for (const alias of aliases) {
    for (const val of EXHAUSTIVE_KEYS[alias]) {
      const inBranch = (x: Info) => !x.branch || (x.branch[0] === alias && x.branch[1] === val);
      const chac = always + infos.filter((x) => x.branch?.[0] === alias && x.branch[1] === val && !x.other.length).length;
      if (chac < min) { min = chac; worst = `${alias}(${val})`; }
      max = Math.max(max, widthOf(inBranch));
    }
  }
  return { min, max, worst };
}

/**
 * Một khoá `need` có thoả không. Không có dấu chấm = cờ chuyện; có dấu chấm = khoá bảng
 * đen, hỏi qua `gate.holds`. ⚠️ Thiếu `gate.holds` thì coi như ĐÚNG, không coi như sai.
 */
function gateOk(key: string, gate: TalkGate): boolean {
  const neg = key.startsWith("!");
  const body = neg ? key.slice(1) : key;
  if (body.includes(".")) return gate.holds ? gate.holds(key) : true;
  return neg !== !!gate.flags[body];
}

/** Giọng nào đọc ra là "thôi, tôi không nói chuyện này nữa". Xem `trimKeepingExit`. */
const EXIT_TONES: ReadonlySet<TalkTone> = new Set<TalkTone>(["LANH", "IM", "GAT"]);

/**
 * Cắt xuống `TALK_CHOICES_MAX` dòng mà KHÔNG cắt mất đường ra: giữ `max - 1` dòng đầu rồi
 * dành chỗ cuối cho một dòng `EXIT_TONES`.
 *
 * ⚠️ `.slice(0, 3)` thẳng là sai — người viết gần như luôn đặt dòng `LANH` / `IM` ở CUỐI,
 * nên cắt thẳng làm nhịp đầu không còn cách nào từ chối.
 */
export function trimKeepingExit(list: TalkNode[], max = TALK_CHOICES_MAX): TalkNode[] {
  if (list.length <= max) return list;
  const head = list.slice(0, max);
  if (head.some((o) => EXIT_TONES.has(o.tone))) return head;
  const exit = list.find((o) => EXIT_TONES.has(o.tone));
  return exit ? [...list.slice(0, max - 1), exit] : head;
}

/** Nhánh con của một nút: `then` của chính nó, hoặc cây con dùng chung mà nó trỏ `ref`. */
export function childrenOf(n: TalkNode, t: Talk): TalkNode[] | null {
  if (n.then?.length) return n.then;
  if (n.ref) return t.shared?.[n.ref] ?? null;
  return null;
}

// ─────────────────────────────────────────────────────────────── phiên

/** Một cuộc đang mở. Sống trong Service, chết khi đóng bảng. */
export class TalkSession {
  /** Bộ lựa chọn đang hiện. null = hết chuyện. */
  private here: TalkNode[] | null;
  private depth = 0;
  done = false;
  /**
   * Những câu đã nói TRẬT (`while` không giữ nữa). Nói trật rồi thì không nói lại được —
   * nếu không, một nhịp khoá trọn sau `while` cho bấm vô hạn lần, mỗi lần trừ một điểm.
   */
  private struck = new Set<TalkNode>();
  /** Người chơi đã chọn gì — nhật ký cuối ngày đọc. */
  readonly picked: { say: string; tone: TalkTone }[] = [];

  constructor(readonly talk: Talk, readonly npcKey: string) {
    this.here = talk.tree.length ? talk.tree : null;
    this.done = this.here === null;
  }

  get options(): readonly TalkNode[] | null {
    if (this.done || !this.here) return null;
    const left = this.here.filter((n) => !this.struck.has(n));
    return left.length ? left : null;
  }

  /**
   * Câu vừa chọn nói trật (`while` không giữ) — gạch nó đi. Trả `true` nếu nhịp này đã
   * hết đường: `Service` đóng phiên và cuộc kết thúc.
   */
  strike(n: TalkNode): boolean {
    this.struck.add(n);
    if (this.options) return false;
    this.here = null;
    this.done = true;
    return true;
  }

  /**
   * Người chơi chọn lựa chọn thứ `i` của nhịp hiện tại (đã lọc `need`).
   * Trả câu khách đáp + chính cái nút đã chọn, và tự đi xuống nhánh con của nó.
   */
  /**
   * Nhìn trước lựa chọn thứ `i` mà KHÔNG đi tiếp — để `Service` kiểm `while` trước khi áp
   * bất cứ hệ quả nào.
   */
  peek(i: number, gate: TalkGate): TalkNode | null {
    const here = this.options;
    if (!here) return null;
    const opts = visibleOptions(here, gate);
    return opts[Math.max(0, Math.min(opts.length - 1, i))] ?? null;
  }

  choose(i: number, gate: TalkGate): { node: TalkNode; reply?: string; done: boolean } | null {
    const here = this.options;
    if (!here) return null;
    const opts = visibleOptions(here, gate);
    const n = opts[Math.max(0, Math.min(opts.length - 1, i))];
    this.picked.push({ say: n.say, tone: n.tone });

    const kids = childrenOf(n, this.talk);
    this.depth++;
    // Cắt ở MAX_DEPTH: `ref` trỏ vòng lại là cây vô hạn. Test L-9 bắt lúc build; đây là
    // lưới thứ hai lúc chạy.
    this.here = kids && this.depth < MAX_DEPTH ? kids : null;
    this.struck.clear();                                     // nhịp mới, sổ trắng
    this.done = this.here === null;
    return { node: n, reply: n.reply, done: this.done };
  }
}

// ─────────────────────────────────────────────────────────────── hệ quả

export const DEFAULT_IGNORE_REL = -1;

export type TalkOutcome = { relDelta: number; mem: BaseKind | null; anger: number; flag?: string };

/**
 * Áp hiệu ứng của MỘT lựa chọn lên quan hệ + trí nhớ. ⚠️ KHÔNG đi qua `Service.remember()`
 * nên không vào tin đồn — chỉ hành động mới đi xa được, lời nói ở quầy thì không.
 */
export function applyTalk(e: TalkEffect, s: RelState, p: Personality, day: number): TalkOutcome {
  const out: TalkOutcome = { relDelta: 0, mem: null, anger: e.anger ?? 0, flag: e.flag };
  if (e.rel) out.relDelta += talkPoints(s, p, e.rel);
  if (e.mem) {
    const r = record(s, p, e.mem.kind, e.mem.intensity, day);
    out.relDelta += r.delta;
    out.mem = e.mem.kind;
  }
  return out;
}

/**
 * Giận → sức chờ: `anger` 0..100 = đốt ngần ấy % quãng kiên nhẫn CÒN LẠI của lượt ghé.
 * Trả số giây phải cộng thêm; không bao giờ đẩy quá mốc bỏ đi trong MỘT câu.
 */
export function angerToWaitSec(anger: number, waitT: number, waited: number, leaveAt: number) {
  if (anger <= 0) return 0;
  const room = Math.max(0, waitT * leaveAt - waited);
  return Math.min(room * 0.85, (room * Math.min(100, anger)) / 100);
}

// ─────────────────────────────────────────────────────── duyệt cây (test/tool)

/** Mọi nút của một cuộc, kể cả cây con dùng chung. Cắt ở `MAX_DEPTH` để `ref` vòng không treo. */
export function walkNodes(t: Talk): { node: TalkNode; depth: number }[] {
  const out: { node: TalkNode; depth: number }[] = [];
  const seen = new Set<TalkNode>();
  const go = (nodes: readonly TalkNode[], depth: number) => {
    if (depth > MAX_DEPTH) return;
    for (const n of nodes) {
      if (seen.has(n)) continue;
      seen.add(n);
      out.push({ node: n, depth });
      const kids = childrenOf(n, t);
      if (kids) go(kids, depth + 1);
    }
  };
  go(t.tree, 1);
  return out;
}

/** Mọi dòng thoại của một cuộc — linter và test danh xưng đọc. */
export function linesOf(t: Talk): { npc: string[]; player: string[] } {
  const all = walkNodes(t);
  return {
    npc: [t.opener, ...(t.ignore?.reply ? [t.ignore.reply] : []), ...all.map((x) => x.node.reply).filter((x): x is string => !!x)],
    player: all.map((x) => x.node.say),
  };
}
