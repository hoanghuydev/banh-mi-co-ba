// Mốc tiền thắng: chạm thì hết ván, như `sim/broke.ts` ở phía thua.
import type { SaveFile } from "../core/save";
import { ECON, vnd } from "./econ";
import { average } from "./reviews";

export const WIN_VND = vnd(ECON.win_k);

export type WinReport = {
  day: number;
  cash: number;
  /** Tổng ổ đã bán cả ván. */
  served: number;
  revenue: number;
  profit: number;
  stars: number;
  reviews: number;
};

export function winReport(w: SaveFile): WinReport {
  const sum = (f: (r: SaveFile["ledger"][number]) => number) => w.ledger.reduce((a, r) => a + f(r), 0);
  const revenue = sum((r) => r.revenue);
  return {
    day: Number(w.flags.wonDay ?? w.progress.dayIndex),
    cash: w.money.cash,
    served: sum((r) => r.served),
    revenue,
    profit: revenue - sum((r) => r.cost),
    stars: average(w),
    reviews: w.reviews.list.length,
  };
}

/** Chốt lúc đi ngủ, trước phá sản và đóng cửa. */
export function markWin(w: SaveFile): boolean {
  if (w.flags.won) return true;
  if (w.money.cash < WIN_VND) return false;
  w.flags.won = true;
  w.flags.wonDay = w.progress.dayIndex;
  return true;
}
