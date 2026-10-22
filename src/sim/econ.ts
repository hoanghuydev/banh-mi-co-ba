// Nội dung tính bằng nghìn đồng (k), `world.money.cash` tính bằng đồng; không RNG lúc chạy.
import ECON_JSON from "../content/econ/econ.json";
import GOODS_JSON from "../content/econ/goods.json";
import CAL_JSON from "../content/econ/calendar.json";
import type { Ingredient } from "./order";
import { itemOf, type MenuItemId } from "./menu";

export type Weather = "NANG_GAT" | "MAT" | "AM_U" | "MUA_RAO" | "MUA_DAM" | "OI";
export type GoodId = "BANH" | "PATE" | "THIT_NGUOI" | "CHA_LUA" | "XIU_MAI" | "TRUNG"
  | "RAU" | "OT" | "SOT" | "DO_CHUA_NL" | "DO_CHUA_SAN";

export type GoodDef = {
  label: string; unit: string; perUnit: number; base_k: number; q0: number; curve: number[];
  weekday: "fixed" | "pate" | "thit" | "rau"; step: number; storage: "COLD" | "DRY";
  coldSlots?: number; pickle?: boolean;
  /** Xác suất đau bụng mỗi phần hàng dỏm. */
  sick?: number;
};

export const ECON = ECON_JSON as unknown as {
  scale: number; startCash_k: number;
  fixedCost_k: { base: number; fromDay: number; raised: number };
  menu: { extra_k: number; price: { walkAway: number[]; praise: number[]; overpriced: number[] } };
  rent_k: number;
  storage: { thung_xop: { coldSlots: number; coldShelfLifeDelta: Partial<Record<GoodId, number>> } };
};
export const GOODS = (GOODS_JSON as unknown as { goods: Record<GoodId, GoodDef> }).goods;
export const GOOD_IDS = Object.keys(GOODS) as GoodId[];
export type Quality = "BAN" | "THUONG" | "NGON";
export type QualityDef = { label: string; taste: number; price: number; shelf: number; clean: number; tasteBar: number };
export const QUALITIES = (GOODS_JSON as unknown as { tiers: Record<Quality, QualityDef> }).tiers;
export const QUALITY_IDS: Quality[] = ["BAN", "THUONG", "NGON"];
const ING_GOOD = (GOODS_JSON as unknown as { ingredientGood: Record<string, GoodId[]> }).ingredientGood;
export const goodsFor = (ing: Ingredient): GoodId[] => ING_GOOD[ing] ?? [];
export const RECIPE_W = (GOODS_JSON as unknown as { recipeWeight: Record<string, number> }).recipeWeight;

type Cal = {
  weather: Weather[];
  weatherInfo: Record<Weather, { label: string; walkIn: number; gazeMul: number }>;
  weekdayIndex: Record<GoodDef["weekday"], number[]>;
  events: { id: string; fromDay: number; toDay: number; priceMul?: Record<string, number>; crowdMul?: number;
    breadPrice_k?: number; breadQ0?: number; telegraphFromDay: number; speakers: string[]; line?: string }[];
};
export const CAL = CAL_JSON as unknown as Cal;

export const scaledVnd = (k: number) => Math.round(k * ECON.scale) * 1000;
export const vnd = (k: number) => Math.round(k * 1000);

/** 64000 → "sáu mươi tư ngàn"; ngoài 1–999 ngàn tròn thì trả chữ số. */
export function dongVi(d: number): string {
  const k = Math.round(d / 1000);
  if (k <= 0 || k > 999 || d % 1000 !== 0) return d.toLocaleString("vi-VN") + " đồng";
  const DON = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const tram = Math.floor(k / 100), chuc = Math.floor((k % 100) / 10), donvi = k % 10;
  const parts: string[] = [];
  if (tram) parts.push(`${DON[tram]} trăm`);
  if (chuc === 0 && donvi && tram) parts.push("lẻ");
  // "Chục" chỉ cho hàng chục tròn; có hàng đơn vị thì đọc "mươi".
  if (chuc === 1) parts.push("mười");
  else if (chuc > 1) parts.push(donvi ? `${DON[chuc]} mươi` : `${DON[chuc]} chục`);
  if (donvi) {
    if (donvi === 5 && chuc >= 1) parts.push("lăm");
    else if (donvi === 1 && chuc >= 2) parts.push("mốt");
    else if (donvi === 4 && chuc >= 2) parts.push("tư");
    else parts.push(DON[donvi]);
  }
  return `${parts.join(" ")} ngàn`;
}

/** Lịch quay vòng khi ngày vượt độ dài mảng. */
export const calDay = (day: number) => ((Math.max(1, day) - 1) % CAL.weather.length) + 1;

export const weatherOf = (day: number): Weather => CAL.weather[calDay(day) - 1];
export const isRain = (w: Weather) => w === "MUA_RAO" || w === "MUA_DAM";
export const weekdayIdx = (day: number) => (((day - 1) % 7) + 7) % 7;
export const WEEKDAY_VI = ["thứ Hai", "thứ Ba", "thứ Tư", "thứ Năm", "thứ Sáu", "thứ Bảy", "Chủ nhật"];

export const eventsOn = (day: number) => CAL.events.filter((e) => calDay(day) >= e.fromDay && calDay(day) <= e.toDay);
export const crowdMul = (day: number) => eventsOn(day).reduce((a, e) => a * (e.crowdMul ?? 1), 1);

export function priceOf(g: GoodId, day: number): number {
  const d = GOODS[g];
  if (g === "BANH") return eventsOn(day).find((e) => e.breadPrice_k)?.breadPrice_k ?? d.base_k;
  let p = d.base_k * CAL.weekdayIndex[d.weekday][weekdayIdx(day)];
  for (const e of eventsOn(day)) p *= e.priceMul?.[d.weekday] ?? 1;
  return Math.round(p * 2) / 2;
}

export function q0Of(g: GoodId, day: number): number {
  if (g === "BANH") return eventsOn(day).find((e) => e.breadQ0)?.breadQ0 ?? GOODS.BANH.q0;
  return GOODS[g].q0;
}

export const fixedCostVnd = (day: number) => scaledVnd(day >= ECON.fixedCost_k.fromDay ? ECON.fixedCost_k.raised : ECON.fixedCost_k.base);

/** Lô cũ không có `tier` thì tính là hàng thường. */
export type Lot = { good: GoodId; day: number; left: number; q0: number; tier?: Quality };
export type Storage = "thung_xop" | "tu_mat";
export type InventoryState = { lots: Lot[]; lastBasket: Partial<Record<GoodId, number>>; storage?: Storage; noiU?: boolean };
export const newInventory = (): InventoryState => ({ lots: [], lastBasket: {}, storage: "thung_xop" });

/** Tủ mát nhân đôi hạn đồ lạnh; nồi ủ giữ xíu mại qua đêm. */
export function shelfDays(g: GoodId, storage: Storage = "thung_xop", noiU = false, tier: Quality = "THUONG"): number {
  const d = GOODS[g];
  const tierDelta = QUALITIES[tier].shelf;
  if (g === "XIU_MAI" && noiU) return Math.max(1, 2 + tierDelta);
  if (d.storage === "COLD" && storage === "tu_mat") return Math.max(1, d.curve.length * 2 + tierDelta);
  const delta = d.storage === "COLD" ? ECON.storage.thung_xop.coldShelfLifeDelta[g] ?? 0 : 0;
  return Math.max(1, d.curve.length + delta + tierDelta);
}

export function lotQuality(l: Lot, day: number, storage: Storage = "thung_xop", noiU = false): number | null {
  const age = day - l.day;
  if (age < 0 || age >= shelfDays(l.good, storage, noiU, l.tier)) return null;
  const c = GOODS[l.good].curve;
  const idx = GOODS[l.good].storage === "COLD" && storage === "tu_mat" ? Math.floor(age / 2) : age;
  return l.q0 * (c[Math.min(idx, c.length - 1)] ?? (l.good === "XIU_MAI" ? 0.85 : c[c.length - 1]));
}
const lq = (inv: InventoryState, l: Lot, day: number) => lotQuality(l, day, inv.storage ?? "thung_xop", !!inv.noiU);

export function stockOf(inv: InventoryState, g: GoodId, day: number) {
  return inv.lots.reduce((a, l) => a + (l.good === g && lq(inv, l, day) !== null ? l.left : 0), 0);
}

export function portionsFor(inv: InventoryState, ing: Ingredient, day: number) {
  return goodsFor(ing).reduce((a, g) => a + stockOf(inv, g, day), 0);
}

/** Một phần hàng lấy ra khỏi kho: chất lượng và xác suất đau bụng của nó (chỉ hàng dỏm mới có). */
export type Portion = { q: number; sick: number };

export function takeFull(inv: InventoryState, ing: Ingredient | "bread", n: number, day: number): Portion[] {
  const goods = ing === "bread" ? (["BANH"] as GoodId[]) : goodsFor(ing);
  const lots = inv.lots.filter((l) => goods.includes(l.good) && l.left > 0 && lq(inv, l, day) !== null)
    .sort((a, b) => a.day - b.day);
  const out: Portion[] = [];
  for (const l of lots) {
    const sick = l.tier === "BAN" ? GOODS[l.good].sick ?? 0 : 0;
    while (l.left > 0 && out.length < n) { l.left--; out.push({ q: lq(inv, l, day)!, sick }); }
    if (out.length >= n) break;
  }
  inv.lots = inv.lots.filter((l) => l.left > 0);
  return out;
}

export const take = (inv: InventoryState, ing: Ingredient | "bread", n: number, day: number): number[] =>
  takeFull(inv, ing, n, day).map((p) => p.q);

/** Xác suất khách đau bụng khi ăn ổ gồm các phần này. */
export const sickChance = (parts: readonly Portion[]) => 1 - parts.reduce((a, p) => a * (1 - p.sick), 1);

export function putBack(inv: InventoryState, ing: Ingredient, n: number, day: number) {
  const g = goodsFor(ing).find((x) => stockOf(inv, x, day) > 0) ?? goodsFor(ing)[0];
  if (!g) return;
  const l = inv.lots.filter((x) => x.good === g && lq(inv, x, day) !== null).sort((a, b) => b.day - a.day)[0];
  if (l) l.left += n; else inv.lots.push({ good: g, day, left: n, q0: q0Of(g, day) });
}

export function buy(inv: InventoryState, g: GoodId, units: number, day: number, tier: Quality = "THUONG") {
  if (units <= 0) return;
  inv.lots.push({ good: g, day, left: units * GOODS[g].perUnit, q0: q0Of(g, day) * QUALITIES[tier].taste, tier });
}

export function expire(inv: InventoryState, day: number): { good: GoodId; units: number }[] {
  const out: { good: GoodId; units: number }[] = [];
  inv.lots = inv.lots.filter((l) => {
    if (lq(inv, l, day) !== null) return true;
    out.push({ good: l.good, units: l.left / GOODS[l.good].perUnit });
    return false;
  });
  return out;
}

export function coldSlotsUsed(inv: InventoryState, day: number) {
  let s = 0;
  for (const g of GOOD_IDS) {
    const d = GOODS[g];
    if (d.storage !== "COLD") continue;
    s += (stockOf(inv, g, day) / d.perUnit) * (d.coldSlots ?? 1);
  }
  return s;
}
export const coldSlotCap = (inv?: InventoryState) => (inv?.storage === "tu_mat" ? 20 : ECON.storage.thung_xop.coldSlots);

/** 0 = rẻ · 1 = thường · 2 = đắt. */
export type PricePick = 0 | 1 | 2;
export type PricePicks = Partial<Record<string, number>>;
export const PRICE_FX = ECON.menu.price;

export const pickOf = (picks: PricePicks | undefined, mon: MenuItemId): PricePick =>
  (picks?.[mon] === 0 || picks?.[mon] === 2 ? picks[mon] : 1) as PricePick;

/** Xin thêm nhân chỉ tính trên ổ đầy đủ. */
export function dishPriceVnd(intent: { mon: MenuItemId; nhieu?: string }, pick: PricePick = 1): number {
  const extra = intent.mon === "daydu" && intent.nhieu ? ECON.menu.extra_k : 0;
  return vnd(itemOf(intent.mon).k[pick] + extra);
}

const MEAT: ReadonlySet<string> = new Set(["thit", "chalua", "xiumai", "opla"]);
const RAU_ING: ReadonlySet<string> = new Set(["dualeo", "hanhngo", "ot"]);

/** 1 − Σ w·(1 − Q) theo nhóm; nhóm vắng mặt tính Q = 1. */
export function dishQuality(bread: number, parts: { ing: Ingredient; q: number }[]): number {
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 1);
  const grp = (f: (i: string) => boolean) => avg(parts.filter((p) => f(p.ing)).map((p) => p.q));
  const q = 1
    - RECIPE_W.bread * (1 - bread)
    - RECIPE_W.pate * (1 - grp((i) => i === "pate"))
    - RECIPE_W.meat * (1 - grp((i) => MEAT.has(i)))
    - RECIPE_W.dochua * (1 - grp((i) => i === "dochua"))
    - RECIPE_W.rau * (1 - grp((i) => RAU_ING.has(i)))
    - RECIPE_W.sot * (1 - grp((i) => i === "tuongot"));
  return Math.max(0, Math.min(1, q));
}

export const tasteThreshold = (soi: number) => 0.18 - 0.10 * soi;
