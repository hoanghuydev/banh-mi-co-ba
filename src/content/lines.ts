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

export type LinePool =
  | "waitSoft" | "waitHard" | "waitConfirmed"
  | "noticedMess" | "noticeDrop" | "noticeBurnt" | "noticeDirty" | "dirtyRemark"
  | "ant_MISSING" | "disc_MISSING" | "ant_UNWANTED" | "disc_UNWANTED"
  | "ratio_under" | "ratio_over" | "cold" | "stuffed"
  | "happy" | "remembered" | "underdone"
  | "tea" | "teaNod" | "teaSuspect" | "askReply" | "askPlayer";

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
    return def.variants[i].replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
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
