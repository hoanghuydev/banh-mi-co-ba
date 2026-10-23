import type { Rng } from "../core/rng";
import { easeOf } from "./ease";
import { openMenu } from "./unlock";
import { MENU_IDS, RAU_CO_GIAN, RAU_NEN, isBare, itemOf, nhanOf, type MenuItemId } from "./menu";

// Món ăn LÀ lựa chọn hội thoại: người chơi không chọn câu nói, họ chọn nguyên liệu.

export type Ingredient =
  | "pate" | "thit" | "chalua" | "xiumai" | "opla"
  | "dochua" | "dualeo" | "hanhngo" | "ot" | "tuongot";

export type IngredientInfo = {
  id: Ingredient;
  label: string;
  kind: "nhan" | "rau" | "sot";
  /** Một phần là mặc định, hai phần là "cho nhiều". */
  max: number;
};

/** Thứ tự xếp lớp trong ổ, từ dưới lên. */
export const INGREDIENTS: IngredientInfo[] = [
  { id: "pate",    label: "pate",         kind: "nhan", max: 2 },
  { id: "thit",    label: "thịt nguội",   kind: "nhan", max: 2 },
  { id: "chalua",  label: "chả lụa",      kind: "nhan", max: 2 },
  { id: "xiumai",  label: "xíu mại",      kind: "nhan", max: 2 },
  { id: "opla",    label: "trứng ốp la",  kind: "nhan", max: 2 },
  { id: "dochua",  label: "đồ chua",      kind: "rau",  max: 2 },
  { id: "dualeo",  label: "dưa leo",      kind: "rau",  max: 2 },
  { id: "hanhngo", label: "hành ngò",     kind: "rau",  max: 2 },
  { id: "ot",      label: "ớt",           kind: "rau",  max: 2 },
  { id: "tuongot", label: "tương ớt",     kind: "sot",  max: 2 },
];

export const BY_ID = new Map(INGREDIENTS.map((i) => [i.id, i]));
export const labelOf = (id: Ingredient) => BY_ID.get(id)!.label;

/** Đơn nặng nhất 14 phần + 2 cho thêm; phải dưới 20 (10 món × 2) để `STUFFED` còn bắt được. */
export const CAPACITY = 16;

/** Mấy thứ cho thêm được mà khách không phật lòng. */
export const NICETY: ReadonlySet<Ingredient> = new Set<Ingredient>(["dochua", "ot", "tuongot", "hanhngo"]);

const NHAN = INGREDIENTS.filter((i) => i.kind === "nhan").map((i) => i.id);

/** Trọng số món khách vãng lai gọi; dàn phẳng để chỉ tốn đúng một lần rút số. */
const WALK_IN_WEIGHT: Readonly<Record<MenuItemId, number>> = {
  daydu: 22, thit: 18, chalua: 18, xiumai: 16, opla: 12, pate: 10, khong: 4,
};
const WALK_IN_BAG: readonly MenuItemId[] = MENU_IDS.flatMap((id) =>
  Array.from({ length: WALK_IN_WEIGHT[id] }, () => id));

/** Rổ chỉ gồm món đã mở, giữ tỉ lệ trọng số giữa các món còn lại. */
const BAGS = new Map<string, readonly MenuItemId[]>();
function walkInBag(day?: number): readonly MenuItemId[] {
  if (day === undefined) return WALK_IN_BAG;
  const open = openMenu(day).map((i) => i.id);
  if (open.length === MENU_IDS.length) return WALK_IN_BAG;
  const key = open.join(",");
  let bag = BAGS.get(key);
  if (!bag) BAGS.set(key, (bag = WALK_IN_BAG.filter((id) => open.includes(id))));
  return bag;
}

/** Cả câu nói lẫn bảng định lượng đều suy ra từ đây nên không bao giờ lệch nhau. */
export type OrderIntent = {
  mon: MenuItemId;
  /** Một thứ nhân được xin thêm, lên mức 2. */
  nhieu?: Ingredient;
  /** "it" = rau một nửa, không cấm thứ nào. */
  rau: "day-du" | "it" | "khong";
  /** Thứ khách nói bỏ ra — mức 0. */
  bo?: Ingredient[];
  ot: 0 | 1 | 2;
  tuong: 0 | 1 | 2;
};

export type OrderSpec = {
  intent: OrderIntent;
  /** Không có trong bảng = khách không nói tới. */
  levels: Partial<Record<Ingredient, number>>;
  /** Câu gọi nguyên văn; vẫn phải tự nó quyết định được ổ bánh. */
  phrase?: string;
  /** Khẩu vị ẩn: làm theo mức này cũng đúng, bỏ qua thì không bị gì. */
  alt?: Partial<Record<Ingredient, number>>;
};

export function levelsOf(it: OrderIntent): Partial<Record<Ingredient, number>> {
  const lv: Partial<Record<Ingredient, number>> = {};
  // Nhân không có trong món phải là 0, không phải undefined — không thì `diffDish` bỏ qua nhân thừa.
  for (const n of NHAN) lv[n] = 0;
  for (const [id, phan] of Object.entries(itemOf(it.mon).nhan)) {
    lv[id as Ingredient] = it.nhieu === id ? 2 : phan;
  }
  const bare = isBare(it.mon);
  const mul = bare || it.rau === "khong" ? 0 : it.rau === "it" ? 0.5 : 1;
  for (const id of RAU_CO_GIAN) lv[id] = Math.round((RAU_NEN[id] ?? 0) * mul);
  lv.ot = bare ? 0 : it.ot;
  lv.tuongot = bare ? 0 : it.tuong;
  for (const b of it.bo ?? []) lv[b] = 0;
  return lv;
}

export const specOf = (intent: OrderIntent): OrderSpec => ({ intent, levels: levelsOf(intent) });

/** `fuss` chỉ nhân vào ngưỡng, không thêm bớt lần `rng.next()` nào để giữ dãy số tất định. */
function randomIntent(rng: Rng, day?: number): OrderIntent {
  const f = easeOf(day).fuss;
  const mon = rng.pick(walkInBag(day));
  if (mon === "khong") return { mon, rau: "khong", ot: 0, tuong: 0 };
  const nhan = nhanOf(mon);
  return {
    mon,
    nhieu: rng.next() < 0.25 * f ? rng.pick(nhan) : undefined,
    rau: rng.next() < 1 - 0.3 * f ? "day-du" : "it",
    ot: rng.next() < 0.25 * f ? 2 : rng.next() < 0.3 * f ? 0 : 1,
    tuong: rng.next() < 0.2 * f ? 2 : rng.next() < 0.25 * f ? 0 : 1,
  };
}

export const randomOrder = (rng: Rng, day?: number) => specOf(randomIntent(rng, day));

/** Câu nói phải tự nó quyết định được ổ bánh; phiếu đơn chỉ hiện đúng câu này. */
export function sayOrder(spec: OrderSpec): string {
  const it = spec.intent;
  if (spec.phrase) return spec.phrase;
  const item = itemOf(it.mon);
  if (isBare(it.mon)) return `Cho một ổ ${item.call}.`;

  const parts = [`Cho một ổ ${item.call}`];
  if (it.nhieu) parts.push(`cho nhiều ${labelOf(it.nhieu)}`);
  if (it.rau === "it") parts.push("cho ít rau");
  else if (it.rau === "khong") parts.push("không rau");
  // Mọi thứ mức 0 phải thành lời, trừ những thứ câu này đã hàm ý (nhân ngoài món, không rau/ớt/tương).
  const spoken = new Set<Ingredient>();
  for (const i of INGREDIENTS) if (i.kind === "nhan" && item.nhan[i.id] === undefined) spoken.add(i.id);
  if (it.rau === "khong") for (const r of RAU_CO_GIAN) spoken.add(r);
  if (it.ot === 0) spoken.add("ot");
  if (it.tuong === 0) spoken.add("tuongot");
  for (const b of it.bo ?? []) {
    if (spoken.has(b)) continue;
    spoken.add(b);
    parts.push(b === "hanhngo" ? "không hành" : `không ${labelOf(b)}`);
  }
  if (it.ot === 2) parts.push("nhiều ớt");
  else if (it.ot === 0) parts.push("không ớt");
  if (it.tuong === 2) parts.push("nhiều tương");
  else if (it.tuong === 0) parts.push("không tương");
  return parts.join(", ") + ".";
}

/** `TASTE_OFF` là lỗi của kho (đồ để lâu), khách chỉ nếm ra lúc ăn. */
export type DefectKind = "MISSING" | "UNWANTED" | "WRONG_RATIO" | "WRONG_TEMP" | "STUFFED" | "TASTE_OFF";

export type Defect = {
  kind: DefectKind;
  item: Ingredient | null;
  dir?: "under" | "over";
  magnitude: number;
  /** Salience nếu phát hiện tại quầy. */
  sCounter: number;
  /** Salience lúc cắn miếng đầu (= sCounter × 5). */
  sEat: number;
  label: string;
  weight: number;
  text: string;
};

const BASE: Record<DefectKind, number> = { MISSING: 20, UNWANTED: 24, WRONG_RATIO: 12, WRONG_TEMP: 18, STUFFED: 12, TASTE_OFF: 20 };
const ITEM_WEIGHT: Record<Ingredient, number> = {
  pate: 1.4, thit: 1.3, chalua: 1.2, xiumai: 1.3, opla: 1.3,
  dochua: 1.0, dualeo: 0.8, hanhngo: 0.7, ot: 0.8, tuongot: 1.0,
};
/** Nửa nấc: không nấc lệch nào lọt, và lệch một nấc cho `magnitude` 0,5. */
const DEFAULT_TOLERANCE = 0.5;
const LEVEL_TO_RATIO = 1;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function mkDefect(kind: DefectKind, item: Ingredient | null, magnitude = 1, dir?: "under" | "over"): Defect {
  const w = item ? ITEM_WEIGHT[item] : 1;
  const sCounter = Math.min(100, BASE[kind] * w * magnitude);
  const label = item ? labelOf(item) : kind === "WRONG_TEMP" ? "bánh nguội" : kind === "TASTE_OFF" ? "vị lạ" : "nhồi chặt quá";
  const text = kind === "MISSING" ? `thiếu ${label}`
    : kind === "UNWANTED" ? `có ${label}`
    : kind === "WRONG_RATIO" ? `${dir === "under" ? "ít" : "nhiều"} ${label} quá`
    : kind === "WRONG_TEMP" ? "bánh nguội ngắt"
    : kind === "TASTE_OFF" ? "ăn thấy lạ vị"
    : "ổ bánh nhồi chặt quá, kẹp không lại";
  return { kind, item, dir, magnitude, sCounter, sEat: Math.min(100, sCounter * 5), label, weight: sCounter, text };
}

export function portionsOf(dish: readonly Ingredient[]) {
  const m = new Map<Ingredient, number>();
  for (const id of dish) m.set(id, (m.get(id) ?? 0) + 1);
  return m;
}

/** Xếp theo điểm giảm dần: phần tử đầu là ứng viên của `take(1)`. */
export function diffDish(spec: OrderSpec, dish: readonly Ingredient[]): Defect[] {
  const got = portionsOf(dish);
  const out: Defect[] = [];

  for (const ing of INGREDIENTS) {
    const want = spec.levels[ing.id];
    if (want === undefined) continue;
    const have = got.get(ing.id) ?? 0;

    if (want === 0 && have > 0) { out.push(mkDefect("UNWANTED", ing.id)); continue; }
    if (want > 0 && have === 0) { out.push(mkDefect("MISSING", ing.id)); continue; }
    if (have === want) continue;
    // Dư một phần đồ "dễ thương" là hào phóng, không phải lỗi; phải đứng trước phép tính dung sai.
    if (have - want === 1 && NICETY.has(ing.id)) continue;
    const gap = Math.abs(have - want) * LEVEL_TO_RATIO;
    if (gap <= DEFAULT_TOLERANCE) continue;
    out.push(mkDefect("WRONG_RATIO", ing.id, clamp01((gap - DEFAULT_TOLERANCE) / 1.0), have < want ? "under" : "over"));
  }

  if (dish.length > CAPACITY) out.push(mkDefect("STUFFED", null, 1));
  return out.sort((a, b) => b.weight - a.weight);
}

/** Giá trị một phần theo giá chợ (`econ/goods.json`, chép tay), thịt nguội = 1; đếm phần thì ớt thành cách cày thiện cảm rẻ nhất. */
const PORTION_VALUE: Record<Ingredient, number> = {
  pate: 0.5, thit: 1, chalua: 0.9, xiumai: 0.75, opla: 1.25,
  dochua: 0.22, dualeo: 0.16, hanhngo: 0.16, ot: 0.18, tuongot: 0.22,
};

/** Tối đa 0,78 một ổ (mỗi món dư được một phần) — chưa bằng một lát thịt nguội. */
export function generosityOf(spec: OrderSpec, dish: readonly Ingredient[]) {
  const got = portionsOf(dish);
  let value = 0;
  for (const id of NICETY) {
    const want = spec.levels[id] ?? 0;
    value += Math.max(0, (got.get(id) ?? 0) - want) * PORTION_VALUE[id];
  }
  return value;
}

export function extraPortions(spec: OrderSpec, dish: readonly Ingredient[]): Ingredient[] {
  const got = portionsOf(dish);
  return INGREDIENTS
    .filter((i) => NICETY.has(i.id) && (got.get(i.id) ?? 0) > (spec.levels[i.id] ?? 0))
    .map((i) => i.id);
}

export function dishFor(spec: OrderSpec): Ingredient[] {
  const out: Ingredient[] = [];
  for (const ing of INGREDIENTS) for (let i = 0; i < (spec.levels[ing.id] ?? 0); i++) out.push(ing.id);
  return out;
}
