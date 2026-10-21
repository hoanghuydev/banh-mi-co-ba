import type { SaveFile } from "../core/save";
import { unitPriceVnd } from "./day";
import { resaleVnd, resellable } from "./equipment";

/**
 * Phá sản: tiền trong ống + bán sạch đồ nghề vẫn không mua nổi rổ nhỏ nhất cho sáng mai → thua.
 * Hỏi "bán hết có đủ không", không hỏi "còn món nào bán được không" — không thì kẹt vòng lặp vô tận.
 */

/** Rổ nhỏ nhất còn mở hàng được: mười ổ bánh với một lạng pate thường. Dưới mức này thì sáng mai không có gì để bán. */
export const MIN_BASKET = { BANH: 10, PATE_THUONG: 1 } as const;

export function minBasketVnd(day: number): number {
  return (Object.entries(MIN_BASKET) as [keyof typeof MIN_BASKET, number][])
    .reduce((a, [g, n]) => a + unitPriceVnd(g, day) * n, 0);
}

export type BrokeReport = {
  broke: boolean;
  /** Tiền mua rổ nhỏ nhất cho sáng mai. */
  need: number;
  cash: number;
  /** Bán hết đồ nghề trên xe thì được chừng này — 0 nghĩa là xe không còn gì. */
  resale: number;
};

export function brokeReport(w: SaveFile): BrokeReport {
  const day = w.progress.dayIndex;
  const need = minBasketVnd(day + 1);
  const cash = w.money.cash;
  const resale = resellable(w.equipment).reduce((a, id) => a + resaleVnd(id), 0);
  // Phép cộng, không phải hai câu hỏi rời: mọi đồng có thể xoay ra được trước sáng mai.
  return { broke: cash + resale < need, need, cash, resale };
}

/** Chốt lúc đi ngủ. Cờ nằm trong save để vào lại ván đó thì về đúng màn phá sản. */
export function markBroke(w: SaveFile): boolean {
  if (w.flags.broke) return true;
  const r = brokeReport(w);
  if (r.broke) {
    w.flags.broke = true;
    w.flags.brokeDay = w.progress.dayIndex;
  }
  return r.broke;
}
