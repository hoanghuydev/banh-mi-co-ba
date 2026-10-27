// Nội dung tính bằng nghìn đồng (k), `world.money.cash` tính bằng đồng; không RNG lúc chạy.
import ECON_JSON from "../content/econ/econ.json";
import GOODS_JSON from "../content/econ/goods.json";
import CAL_JSON from "../content/econ/calendar.json";
import type { Ingredient, TasteItem } from "./order";
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
  scale: number; startCash_k: number; win_k: number;
  fixedCost_k: { base: number; fromDay: number; raised: number };
  menu: { extra_k: number; price: { walkAway: number[] } };
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
  return Math.round(p * 100) / 100;
}

export function q0Of(g: GoodId, day: number): number {
  if (g === "BANH") return eventsOn(day).find((e) => e.breadQ0)?.breadQ0 ?? GOODS.BANH.q0;
  return GOODS[g].q0;
}

export const fixedCostVnd = (day: number) => scaledVnd(day >= ECON.fixedCost_k.fromDay ? ECON.fixedCost_k.raised : ECON.fixedCost_k.base);

/** Lô cũ không có `tier` thì tính là hàng thường. */
export type Lot = { good: GoodId; day: number; left: number; q0: number; tier?: Quality };
export type Storage = "thung_xop" | "tu_mat";
export type InventoryState = { lots: Lot[]; lastBasket: Partial<Record<GoodId, number>>; storage?: Storage };
export const newInventory = (): InventoryState => ({ lots: [], lastBasket: {}, storage: "thung_xop" });

/** Tủ lạnh nhân đôi hạn đồ lạnh. */
export function shelfDays(g: GoodId, storage: Storage = "thung_xop", tier: Quality = "THUONG"): number {
  const d = GOODS[g];
  const tierDelta = QUALITIES[tier].shelf;
  if (d.storage === "COLD" && storage === "tu_mat") return Math.max(1, d.curve.length * 2 + tierDelta);
  const delta = d.storage === "COLD" ? ECON.storage.thung_xop.coldShelfLifeDelta[g] ?? 0 : 0;
  return Math.max(1, d.curve.length + delta + tierDelta);
}

const curveAt = (l: Lot, day: number, storage: Storage) =>
  Math.min(GOODS[l.good].storage === "COLD" && storage === "tu_mat" ? Math.floor((day - l.day) / 2) : day - l.day, GOODS[l.good].curve.length - 1);

export function lotQuality(l: Lot, day: number, storage: Storage = "thung_xop"): number | null {
  const age = day - l.day;
  if (age < 0 || age >= shelfDays(l.good, storage, l.tier)) return null;
  return l.q0 * GOODS[l.good].curve[curveAt(l, day, storage)];
}
const lq = (inv: InventoryState, l: Lot, day: number) => lotQuality(l, day, inv.storage ?? "thung_xop");

/** Vị mất do để lâu, so với lúc ngon nhất tới nay — đồ chua chưa ngấm không tính là cũ. */
function lotFresh(l: Lot, day: number, storage: Storage): number {
  const c = GOODS[l.good].curve;
  const i = curveAt(l, day, storage);
  return c[i] / Math.max(...c.slice(0, i + 1));
}

export function stockOf(inv: InventoryState, g: GoodId, day: number) {
  return inv.lots.reduce((a, l) => a + (l.good === g && lq(inv, l, day) !== null ? l.left : 0), 0);
}

export function portionsFor(inv: InventoryState, ing: Ingredient, day: number) {
  return goodsFor(ing).reduce((a, g) => a + stockOf(inv, g, day), 0);
}

/** Chất lượng một phần hàng và phần trong đó thuộc về độ tươi. */
export type Taste = { q: number; fresh: number };
export const FULL_TASTE: Taste = { q: 1, fresh: 1 };

/** Một phần hàng lấy ra khỏi kho, kèm xác suất đau bụng (chỉ hàng dỏm mới có). */
export type Portion = Taste & { sick: number };

/** Lấy theo thứ tự lô trong kho: người chơi kéo thả để đổi lô nào dùng trước. */
export function takeFull(inv: InventoryState, ing: Ingredient | "bread", n: number, day: number): Portion[] {
  const goods = ing === "bread" ? (["BANH"] as GoodId[]) : goodsFor(ing);
  const lots = inv.lots.filter((l) => goods.includes(l.good) && l.left > 0 && lq(inv, l, day) !== null);
  const out: Portion[] = [];
  for (const l of lots) {
    const sick = l.tier === "BAN" ? GOODS[l.good].sick ?? 0 : 0;
    while (l.left > 0 && out.length < n) { l.left--; out.push({ q: lq(inv, l, day)!, fresh: lotFresh(l, day, inv.storage ?? "thung_xop"), sick }); }
    if (out.length >= n) break;
  }
  inv.lots = inv.lots.filter((l) => l.left > 0);
  return out;
}

export const take = (inv: InventoryState, ing: Ingredient | "bread", n: number, day: number): Taste[] =>
  takeFull(inv, ing, n, day).map((p) => ({ q: p.q, fresh: p.fresh }));

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
  const left = units * GOODS[g].perUnit;
  const same = inv.lots.find((l) => l.good === g && l.day === day && (l.tier ?? "THUONG") === tier);
  if (same) same.left += left;
  else inv.lots.push({ good: g, day, left, q0: q0Of(g, day) * QUALITIES[tier].taste, tier });
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

const RECIPE_GROUP: Record<Ingredient, string> = {
  pate: "pate", thit: "meat", chalua: "meat", xiumai: "meat", opla: "meat",
  dochua: "dochua", dualeo: "rau", hanhngo: "rau", ot: "rau", tuongot: "sot",
};

/** Vị mất của từng món: 1 − Q = Σ w·(1 − Q) theo nhóm, chia đều cho các phần trong nhóm; nhóm vắng mặt không mất gì. */
function lossByItem(bread: number, parts: { ing: Ingredient; q: number }[]): Map<TasteItem, number> {
  const count = new Map<string, number>();
  for (const p of parts) count.set(RECIPE_GROUP[p.ing], (count.get(RECIPE_GROUP[p.ing]) ?? 0) + 1);
  const out = new Map<TasteItem, number>([["banh", RECIPE_W.bread * (1 - bread)]]);
  for (const p of parts) {
    const g = RECIPE_GROUP[p.ing];
    out.set(p.ing, (out.get(p.ing) ?? 0) + RECIPE_W[g] * (1 - p.q) / count.get(g)!);
  }
  return out;
}

export function dishQuality(bread: number, parts: { ing: Ingredient; q: number }[]): number {
  let loss = 0;
  for (const v of lossByItem(bread, parts).values()) loss += v;
  return Math.max(0, Math.min(1, 1 - loss));
}

/** Lỗi vị của cả ổ và món kéo vị xuống nhiều nhất. */
export type TasteFlaw = { loss: number; item: TasteItem };

function worst(bread: number, parts: { ing: Ingredient; q: number }[]): TasteFlaw {
  let loss = 0, item: TasteItem = "banh", top = -1;
  for (const [k, v] of lossByItem(bread, parts)) {
    loss += v;
    if (v > top) { top = v; item = k; }
  }
  return { loss, item };
}

/** Tách vị mất theo hai nguồn: `stale` do để lâu, `poor` do hạng hàng và loại hàng; hàng ngon còn tươi thì cả hai bằng 0. */
export type DishFlaws = { stale: TasteFlaw; poor: TasteFlaw };
export const NO_FLAWS: DishFlaws = { stale: { loss: 0, item: "banh" }, poor: { loss: 0, item: "banh" } };

export function tasteFlaws(bread: Taste, parts: (Taste & { ing: Ingredient })[]): DishFlaws {
  const grade = (t: Taste) => t.q / t.fresh;
  return {
    stale: worst(bread.fresh, parts.map((p) => ({ ing: p.ing, q: p.fresh }))),
    poor: worst(grade(bread), parts.map((p) => ({ ing: p.ing, q: grade(p) }))),
  };
}

export const tasteThreshold = (soi: number) => 0.18 - 0.10 * soi;
