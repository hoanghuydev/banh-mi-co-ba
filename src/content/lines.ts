import GENERIC from "./lines/generic.json";
import { ShuffleBag, type BagState, type Rng } from "../core/rng";

/**
 * Pool thoại — nội dung ở `content/lines/*.json` (JSON thuần, P0-01 §2.2), file này
 * chỉ nạp và rút. CANON §11:
 *  · shuffle-bag thay random thuần — 8 biến thể ≈ cảm giác của 25–30 dòng random,
 *    vì không bao giờ lặp lại ngay lập tức. Đòn bẩy rẻ nhất dự án.
 *  · pool GENERIC dùng chung cho mọi khách, chỉ viết dòng riêng cho tình huống đặc trưng.
 *  · ~35% số lần "nhận thấy" KHÔNG nói gì cả — im lặng làm phần còn lại đáng tin.
 */

export const SILENCE_RATE = 0.35;
/** Túi im lặng: 7 / 20 = 35%. */
const SILENCE_BAG = 20, SILENCE_TICKETS = 7;

/**
 * Thoại của khách nằm ở rule DB (P2-01), câu người chơi ở `content/talks` (P5-01).
 * Ở đây chỉ có ba túi của P5-02: câu khách nói khi mình giữ / nuốt / làm trật lời hứa.
 */
export type LinePool = "promiseKept" | "promiseBroken" | "promiseWrong"
  /** P2-06 §2.11 — hai người đi ngang chào nhau giữa đường. Nền, không mang tin gì. */
  | "chaoNhau" | "chaoDap"
  /**
   * Ba túi của khoảnh khắc GIAO BÁNH (`sim/service.ts: serveDish`). Hai túi sau là VẾ KẸP
   * quanh câu rule DB chứ không phải câu đứng một mình — xem `_note` của từng túi.
   *   extraOffer   mình chìa ổ có đồ cho thêm
   *   thanksExtra  khách cảm ơn chuyện cho thêm, TRƯỚC khi nói ổ trật chỗ nào
   *   crustTail    "với lại ổ chưa giòn / cháy cạnh" nối vào cuối câu chê món
   */
  | "extraOffer" | "thanksExtra" | "crustTail";

export type PoolDef = { id: LinePool; tier: 1 | 2 | 3; vars: string[]; variants: string[]; en?: string[] };

export const POOLS: Record<LinePool, PoolDef> = Object.fromEntries(
  (GENERIC.pools as PoolDef[]).map((p) => [p.id, p]),
) as Record<LinePool, PoolDef>;

/**
 * Rút thoại. Bag là PER-NPC (P0-02 §2.4): dùng chung thì bà Bảy "dùng hết" biến thể
 * của chú Tư. Trạng thái bag nằm thẳng trong save (`bags`) nên sống qua ngày và qua
 * reload — nếu reset mỗi sáng thì sáng nào cũng nghe lại đúng các dòng quen.
 * Mọi số ngẫu nhiên lấy từ stream `dialog-shufflebag`, không đụng hệ khác.
 */
export class Barks {
  private live = new Map<string, ShuffleBag>();

  constructor(
    private rng: Rng,
    private bags: Record<string, BagState>,
    private day = 0,
  ) {}

  take(pool: LinePool, npcKey = "any", vars: Record<string, string> = {}) {
    const def = POOLS[pool];
    const id = `generic:${pool}:${npcKey}`;
    let bag = this.live.get(id);
    if (!bag) this.live.set(id, (bag = new ShuffleBag(def.variants.length, this.bags[id])));
    const i = bag.draw(this.rng, this.day);
    this.bags[id] = bag.toJSON();
    /*
     * Chỗ trống KHÔNG có trong `vars` được GIỮ NGUYÊN, không xoá. Túi `extraOffer` là lời của
     * mình: nó mang `{me}` / `{call}`, và chỉ `Service.fill` mới biết điền ai vào đó (và viết hoa
     * nếu đứng đầu câu). Xoá sạch ở đây thì câu ra màn hình thành " ơi,  bỏ thêm ớt nghen."
     * Mọi túi khác đều được truyền đủ biến nên không đổi gì với chúng.
     */
    return def.variants[i].replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
  }

  tierOf(pool: LinePool) {
    return POOLS[pool].tier;
  }

  /**
   * Có nói gì không. Im lặng là một lựa chọn thiết kế, không phải thiếu nội dung.
   * P1-03 §2.9.3: là một SHUFFLE-BAG THEO NPC (7 vé im / 13 vé nói trong 20), không
   * phải roll RNG — nên trong 20 lần nhận thấy, đúng 7 lần im, không bao giờ im 5 lần liền.
   */
  speaks(npcKey = "any") {
    const id = `silence:${npcKey}`;
    let bag = this.live.get(id);
    if (!bag) this.live.set(id, (bag = new ShuffleBag(SILENCE_BAG, this.bags[id])));
    const i = bag.draw(this.rng, this.day);
    this.bags[id] = bag.toJSON();
    return i >= SILENCE_TICKETS;
  }
}
