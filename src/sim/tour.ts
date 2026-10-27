import type { SaveFile } from "../core/save";
import { INGREDIENTS, portionsOf, type Ingredient } from "./order";
import { GOODS, type GoodId } from "./econ";
import { itemsOf } from "./shop";

// Dẫn ngày 1, mỗi lúc một việc; lưu trong `flags` nên save cũ đọc ra `undefined` → bước đầu, khỏi migrate.
export type TourStep = "CHO" | "MENU" | "KHO" | "BANH" | "LO" | "THOT" | "NHAN" | "GOI" | "GIAO" | "TAY" | "DT" | "XONG";

const ORDER: readonly TourStep[] = ["CHO", "MENU", "KHO", "BANH", "LO", "THOT", "NHAN", "GOI", "GIAO", "TAY", "DT", "XONG"];

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

/** Cờ riêng, ngoài thứ tự bước: mắt sáng lần đầu thì dừng lại giải thích một lần. */
const EYE_KEY = "tourMat";
export const eyeExplained = (w: SaveFile) => w.flags[EYE_KEY] === true;
export function explainEye(w: SaveFile): void {
  w.flags[EYE_KEY] = true;
}

/** Cờ riêng: vừa xong việc trong điện thoại (đặt hàng, đọc tin) thì chỉ thêm nút đóng điện thoại. */
const CLOSE_KEY = "tourDong";
export const closePending = (w: SaveFile) => w.flags[CLOSE_KEY] === true;
export function closeDone(w: SaveFile): void {
  delete w.flags[CLOSE_KEY];
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
  if (step === "CHO" || step === "DT") w.flags[CLOSE_KEY] = true;
  return of - at + 1;
}

/** Lượng từng phần nhân, để câu dẫn gọi đúng tên thứ đang kẹp. */
const PORTION_WORD: Record<Ingredient, string> = {
  pate: "lớp pate", thit: "lát thịt nguội", chalua: "khoanh chả lụa", xiumai: "viên xíu mại",
  opla: "trứng ốp la", dochua: "phần đồ chua", dualeo: "lát dưa leo", hanhngo: "nhúm hành ngò",
  ot: "lát ớt", tuongot: "phần tương ớt",
};

export type DishGap = { id: Ingredient; left: number; placed: boolean };

/** Thứ còn thiếu so với đơn, theo thứ tự xếp lớp; hết mảng là ổ đã đúng đơn. */
export function dishGaps(
  levels: Partial<Record<Ingredient, number>>, stack: readonly Ingredient[],
): DishGap[] {
  const got = portionsOf(stack);
  const out: DishGap[] = [];
  for (const ing of INGREDIENTS) {
    const want = levels[ing.id] ?? 0;
    const have = got.get(ing.id) ?? 0;
    if (have < want) out.push({ id: ing.id, left: want - have, placed: have > 0 });
  }
  return out;
}

export const gapText = (g: DishGap) =>
  g.placed ? `Thêm ${g.left} ${PORTION_WORD[g.id]} nữa.` : `Thêm ${g.left} ${PORTION_WORD[g.id]}.`;

/**
 * Hàng ngày đầu: đủ cho 25 ổ, nhiều hơn 21 khách của ngày 1 một quãng (`tools/sim.ts`).
 * Số lượng chia chẵn theo `step` của từng món nên mỗi bước là mấy cú bấm +.
 */
export const TOUR_SUPPLIER = "FRESH24";
export const TOUR_ORDER: readonly { good: GoodId; units: number; label: string }[] = [
  { good: "BANH", units: 25, label: "bánh mì" },
  { good: "TRUNG", units: 30, label: "trứng" },
  { good: "DO_CHUA_SAN", units: 40, label: "đồ chua làm sẵn" },
  { good: "RAU", units: 30, label: "rau (dưa leo, hành ngò)" },
  { good: "OT", units: 40, label: "ớt" },
  { good: "SOT", units: 30, label: "tương ớt" },
];

/** Đơn ngày 1 đã đặt xong chưa — bước CHO còn phải chỉ giờ hàng về. */
export const tourOrdered = (w: SaveFile) => w.shop.orders.length > 0;

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
