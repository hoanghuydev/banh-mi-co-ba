import type { SaveFile } from "../core/save";
import { BY_ID, type Ingredient } from "./order";
import { GOODS, type GoodId } from "./econ";
import { itemsOf } from "./shop";

// Dẫn ngày 1, mỗi lúc một việc; lưu trong `flags` nên save cũ đọc ra `undefined` → bước đầu, khỏi migrate.
export type TourStep = "CHO" | "MENU" | "BANH" | "LO" | "THOT" | "NHAN" | "GOI" | "GIAO" | "TAY" | "DT" | "XONG";

const ORDER: readonly TourStep[] = ["CHO", "MENU", "BANH", "LO", "THOT", "NHAN", "GOI", "GIAO", "TAY", "DT", "XONG"];

export const TOUR_TOTAL = ORDER.length - 1;

/** 1…TOUR_TOTAL; `XONG` trả về TOUR_TOTAL. */
export function tourIndex(w: SaveFile): number {
  return Math.min(ORDER.indexOf(tourStep(w)) + 1, TOUR_TOTAL);
}

const KEY = "tour";

export function tourStep(w: SaveFile): TourStep {
  const v = w.flags?.[KEY];
  return typeof v === "string" && (ORDER as readonly string[]).includes(v) ? v as TourStep : "CHO";
}

/** Hết ngày 1 là hết dẫn, dù làm tới đâu. */
export function touring(w: SaveFile): boolean {
  return w.progress.dayIndex === 1 && tourStep(w) !== "XONG";
}

export function tourAt(w: SaveFile, step: TourStep): boolean {
  return touring(w) && tourStep(w) === step;
}

export function tourSkip(w: SaveFile): void {
  w.flags[KEY] = "XONG";
}

/** Làm trước bước sau thì nhảy thẳng tới đó; bước đã qua thì bỏ qua. Trả về số việc vừa xong. */
export function tourDone(w: SaveFile, step: TourStep): number {
  if (!touring(w)) return 0;
  const at = ORDER.indexOf(tourStep(w));
  const of = ORDER.indexOf(step);
  if (at > of) return 0;
  w.flags[KEY] = ORDER[of + 1] ?? "XONG";
  return of - at + 1;
}

/** Phần còn thiếu theo khung pate → nhân mặn → rau, chỉ để dẫn; chấm điểm là việc của `diffDish`. */
export type FillGap = "PATE" | "MAN" | "RAU" | null;

export function fillGap(stack: readonly Ingredient[]): FillGap {
  if (!stack.includes("pate")) return "PATE";
  if (!stack.some((id) => id !== "pate" && BY_ID.get(id)?.kind === "nhan")) return "MAN";
  if (!stack.some((id) => BY_ID.get(id)?.kind === "rau")) return "RAU";
  return null;
}

/** Hàng tối thiểu để bán ngày đầu: đủ bánh, pate, một nhân mặn, rau. Tour dắt đặt từng món ở Fresh24. */
export const TOUR_SUPPLIER = "FRESH24";
export const TOUR_ORDER: readonly { good: GoodId; units: number; label: string }[] = [
  { good: "BANH", units: 10, label: "bánh mì" },
  { good: "PATE", units: 1, label: "pate" },
  { good: "THIT_NGUOI", units: 1, label: "thịt nguội" },
  { good: "RAU", units: 1, label: "rau (dưa leo, hành ngò)" },
  { good: "OT", units: 1, label: "ớt" },
  { good: "SOT", units: 1, label: "tương ớt" },
];

export type OrderStep = { good: GoodId; label: string; clicks: number; done: number; offerId: string };

/** Mỗi món cần bấm + mấy lần và đã bấm mấy lần (đếm theo hàng trong giỏ, bất kể nhà cung cấp). */
export function tourOrderSteps(w: SaveFile): OrderStep[] {
  const inCart = new Map<GoodId, number>();
  for (const l of itemsOf(w.shop.cart)) inCart.set(l.good, (inCart.get(l.good) ?? 0) + l.n);
  return TOUR_ORDER.map((t) => {
    const step = GOODS[t.good].step;
    return {
      good: t.good, label: t.label, clicks: Math.ceil(t.units / step),
      done: Math.min(Math.ceil(t.units / step), Math.floor((inCart.get(t.good) ?? 0) / step)),
      offerId: `${TOUR_SUPPLIER}.${t.good}`,
    };
  });
}

export const tourOrderReady = (w: SaveFile) => tourOrderSteps(w).every((s) => s.done >= s.clicks);
