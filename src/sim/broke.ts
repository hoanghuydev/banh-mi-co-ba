import type { SaveFile } from "../core/save";
import { unitPriceVnd } from "./day";
import { resaleVnd, resellable } from "./equipment";
import { rentVnd } from "./obligations";

/**
 * Phá sản khi một trong hai:
 * - tiền trong ống không đủ tiền chỗ sáng mai (đồ nghề không tính);
 * - trả tiền chỗ xong, tiền còn lại + bán sạch đồ nghề vẫn không mua nổi rổ nhỏ nhất.
 * Hỏi "bán hết có đủ không", không hỏi "còn món nào bán được không" — không thì kẹt vòng lặp vô tận.
 */

/** Rổ nhỏ nhất còn mở hàng được: mười ổ bánh với pate cho mười ổ. Dưới mức này thì sáng mai không có gì để bán. */
export const MIN_BASKET = { BANH: 10, PATE: 10 } as const;

export function minBasketVnd(day: number): number {
  return (Object.entries(MIN_BASKET) as [keyof typeof MIN_BASKET, number][])
    .reduce((a, [g, n]) => a + unitPriceVnd(g, day) * n, 0);
}

export type BrokeReport = {
  broke: boolean;
  /** Lý do thua; `null` khi chưa thua. */
  why: "rent" | "basket" | null;
  /** Tiền chỗ sáng mai. */
  rent: number;
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
  const rent = rentVnd();
  const resale = resellable(w.equipment).reduce((a, id) => a + resaleVnd(id), 0);
  const why = cash < rent ? "rent" : cash - rent + resale < need ? "basket" : null;
  return { broke: why !== null, why, rent, need, cash, resale };
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
