import { Rng, ShuffleBag } from "../core/rng";

/**
 * Pool thoại. CANON §11:
 *  · shuffle-bag thay random thuần — 8 biến thể ≈ cảm giác của 25–30 dòng random,
 *    vì không bao giờ lặp lại ngay lập tức. Đòn bẩy rẻ nhất dự án.
 *  · pool GENERIC dùng chung cho mọi khách, chỉ viết dòng riêng cho tình huống đặc trưng.
 *    Cắt được khoảng 40% khối lượng viết.
 *  · ~35% số lần "nhận thấy" KHÔNG nói gì cả — im lặng làm phần còn lại đáng tin.
 */

export const SILENCE_RATE = 0.35;

/** Chờ hơi lâu — tier 1, còn nhẹ. */
const WAIT_SOFT = [
  "Chừng nào xong vậy con?",
  "Con làm lẹ giùm cô chút nghen.",
  "Trời ơi, tui trễ giờ rồi.",
  "Còn lâu không con?",
];

/** Chờ quá lâu — tier 2, đã bực. */
const WAIT_HARD = [
  "Thôi khỏi, tui đi chỗ khác.",
  "Đợi hết nổi rồi, tui đi nghen.",
  "Bữa khác ghé vậy.",
];

/** Thấy người bán làm hỏng — nhưng chưa tới lượt mình. */
const NOTICED_MESS = [
  "Ủa…",
  "Con ơi, cái đó…",
  "Hửm.",
  "Cái ổ hồi nãy sao rồi con?",
];

/** Lỗi trong ổ bánh mà khách ĐÃ THẤY người chơi làm sai (CANON §6: ANTICIPATED). */
const ANTICIPATED = [
  "Cô thấy con quên bỏ {defect} rồi đó.",
  "Nãy cô nhìn thấy rồi — {defect} mà.",
  "Cô đứng ngay đây mà con, {defect} kìa.",
];

/** Cùng một lỗi nhưng khách chỉ phát hiện lúc mở ra (DISCOVERED). */
const DISCOVERED = [
  "Ủa… {defect} rồi.",
  "Ơ, {defect} nè con.",
  "Sao kỳ vậy, {defect}.",
];

const HAPPY = [
  "Ngon à nghen.",
  "Cảm ơn con.",
  "Y như mọi bữa, được đó.",
  "Thơm quá.",
];

/** Làm đúng "như mọi bữa" mà khách không phải nói — khoảnh khắc lõi của game. */
const REMEMBERED = [
  "Con nhớ hả? Giỏi.",
  "Ừ, đúng rồi đó con.",
  "Khỏi nói mà con cũng biết, hay ghê.",
];

const THANKS_TEA = [
  "Ờ, đang khát.",
  "Trời nắng mà có ly trà đá là nhất.",
  "Cảm ơn con nghen.",
];

export type LinePool =
  | "waitSoft" | "waitHard" | "noticedMess"
  | "anticipated" | "discovered" | "happy" | "remembered" | "tea";

const POOLS: Record<LinePool, string[]> = {
  waitSoft: WAIT_SOFT,
  waitHard: WAIT_HARD,
  noticedMess: NOTICED_MESS,
  anticipated: ANTICIPATED,
  discovered: DISCOVERED,
  happy: HAPPY,
  remembered: REMEMBERED,
  tea: THANKS_TEA,
};

/**
 * Một bộ shuffle-bag cho cả ngày. Seed theo ngày nên phát lại ván đó ra y hệt
 * (CANON §8e: chống save-scum bằng seed cố định).
 */
export class Barks {
  private bags = new Map<LinePool, ShuffleBag<string>>();

  constructor(private rng: Rng) {}

  take(pool: LinePool, vars: Record<string, string> = {}) {
    let bag = this.bags.get(pool);
    if (!bag) this.bags.set(pool, (bag = new ShuffleBag(POOLS[pool], this.rng)));
    return bag.take().replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
  }

  /** Có nói gì không. Im lặng là một lựa chọn thiết kế, không phải thiếu nội dung. */
  speaks() {
    return this.rng.next() >= SILENCE_RATE;
  }
}
