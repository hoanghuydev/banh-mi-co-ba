import type { SaveFile } from "../core/save";
import { unitPriceVnd } from "./day";
import { resaleVnd, resellable } from "./equipment";
import { SUPPLIERS, creditCeiling, state, type SupplierId } from "./suppliers";

/**
 * PHÁ SẢN — cái đáy của cuốn sổ.
 *
 * Tới trước bản này, trò chơi không có đáy. Mọi cú vỡ đều được đỡ: két không đủ tiền than
 * thì cô Ba bù, góp hụi trễ thì cô Mai ứng, tiền học vỡ thì sáng mai bán một món đồ nghề
 * (P3-06 §2.4 "phải xoay cho đủ"). Đỡ mãi thì một người chơi tiêu sạch vốn không thua —
 * họ kẹt, đứng bán không ra đồng nào, hết ngày này qua ngày khác, và không ai nói cho họ
 * biết là chuyện đã hỏng rồi.
 *
 * Cái đáy này là MẶT KIA của việc gỡ khoá theo ngày (`equipment.ts` `unlock`). Ngày 2 mua
 * được cái tủ mát ba triệu là một quyết định thật — nhưng chỉ thật khi nó có thể sai. Hai
 * thứ đó phải đi chung; bỏ khoá mà không có đáy thì chỉ là bỏ phanh.
 *
 * BA ĐƯỜNG XOAY, CỘNG LẠI VẪN KHÔNG ĐỦ. Phá sản không phải "một bữa ế", nó là ngày mai
 * không mở hàng được nữa — và "không mở hàng được" là một phép cộng, không phải ba câu hỏi
 * rời:
 *
 *   1. Trong ống còn bao nhiêu.
 *   2. Bán sạch đồ nghề trên xe thì được thêm bao nhiêu — đường "xoay cho đủ" (P3-06 §2.4).
 *   3. Mối ngoài chợ còn cho nợ thêm bao nhiêu.
 *
 * Cộng cả ba mà vẫn không mua nổi rổ nhỏ nhất cho sáng mai thì mùa đó dừng. Còn đủ thì CHƯA
 * phá sản, và trò chơi đi tiếp như cũ — người chơi phải cảm thấy mình đã trượt qua từng cái
 * phao một, chứ không phải rơi thẳng xuống đáy.
 *
 * TRƯỚC ĐÂY LƯỢNG ĐƯỢC HỎI SAI, và cái đáy thủng vì đúng một chữ: điều kiện 2 hỏi "trên xe
 * CÒN MÓN NÀO bán lại được không", chứ không hỏi "bán hết CÓ ĐỦ không". Một người chơi hết
 * sạch tiền mà còn cái kẹp gắp bán lại được 23.000₫ thì không bao giờ chạm đáy: 23.000₫
 * không mua nổi rổ 56.000₫, nhưng nó khác 0, nên cờ không bao giờ cắm. Sáng ra họ không mua
 * được gì, đứng bán cái xe trống, tối lại về — lặp vô tận, không ai nói cho họ biết là
 * chuyện đã hỏng rồi. Đúng cái mà cả tệp này được viết ra để tránh.
 */

/** Rổ nhỏ nhất còn mở hàng được: mười ổ bánh với một lạng pate thường. Dưới mức này thì sáng mai không có gì để bán. */
export const MIN_BASKET = { BANH: 10, PATE_THUONG: 1 } as const;

export function minBasketVnd(day: number, suppliers?: SaveFile["suppliers"]): number {
  return (Object.entries(MIN_BASKET) as [keyof typeof MIN_BASKET, number][])
    .reduce((a, [g, n]) => a + unitPriceVnd(g, day, suppliers) * n, 0);
}

/** Còn nợ thêm được bao nhiêu ở mấy mối ngoài chợ (trần trừ phần đang nợ). */
export function creditLeftVnd(w: SaveFile): number {
  return (Object.keys(SUPPLIERS) as SupplierId[])
    .reduce((a, id) => {
      const s = state(w.suppliers, id);
      return a + Math.max(0, creditCeiling(id, s) - s.owed);
    }, 0);
}

export type BrokeReport = {
  broke: boolean;
  /** Tiền mua rổ nhỏ nhất cho sáng mai. */
  need: number;
  cash: number;
  /** Bán hết đồ nghề trên xe thì được chừng này — 0 nghĩa là xe không còn gì. */
  resale: number;
  credit: number;
};

export function brokeReport(w: SaveFile): BrokeReport {
  const day = w.progress.dayIndex;
  const need = minBasketVnd(day + 1, w.suppliers);
  const cash = w.money.cash;
  const resale = resellable(w.equipment).reduce((a, id) => a + resaleVnd(id), 0);
  const credit = creditLeftVnd(w);
  // Phép cộng, không phải ba câu hỏi rời: mọi đồng có thể xoay ra được trước sáng mai.
  return { broke: cash + resale + credit < need, need, cash, resale, credit };
}

/**
 * Chốt lúc đi ngủ. Cờ nằm trong save để màn kết đọc được, và để vào lại ván đó không
 * rơi ngược về buổi sáng của một cái mùa đã dừng.
 */
export function markBroke(w: SaveFile): boolean {
  if (w.flags.broke) return true;
  const r = brokeReport(w);
  if (r.broke) {
    w.flags.broke = true;
    w.flags.brokeDay = w.progress.dayIndex;
  }
  return r.broke;
}
