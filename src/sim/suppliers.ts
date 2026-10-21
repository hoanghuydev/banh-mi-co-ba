import SUP_JSON from "../content/econ/suppliers.json";
import { fnv1a } from "../core/rng";
import { GOODS, GOOD_IDS, QUALITIES, priceOf, vnd, type GoodId, type Quality } from "./econ";

export type Supplier = { id: string; name: string; blurb: string; mul: number; offers: Partial<Record<GoodId, Quality>> };

export const SUPPLIERS = (SUP_JSON as unknown as { suppliers: Supplier[] }).suppliers;

/** Một dòng hàng: nhà cung cấp bán món này ở mức này. */
export type Offer = { id: string; supplier: string; good: GoodId; tier: Quality; mul: number };

export const OFFERS: Offer[] = SUPPLIERS.flatMap((s) =>
  (Object.keys(s.offers) as GoodId[]).map((good) => ({ id: `${s.id}.${good}`, supplier: s.id, good, tier: s.offers[good]!, mul: s.mul })));

const BY_ID = new Map(OFFERS.map((o) => [o.id, o]));
export const offerById = (id: string) => BY_ID.get(id);
export const supplierById = (id: string) => SUPPLIERS.find((s) => s.id === id);
export const offersOfGood = (g: GoodId) => OFFERS.filter((o) => o.good === g);

export const NOISE = 0.08;

/** Giá thị trường: lịch (thứ, sự kiện) × nhiễu ±8% theo seed ngày. Bánh mì không nhiễu. */
export function marketPriceK(g: GoodId, day: number): number {
  const base = priceOf(g, day);
  if (g === "BANH") return base;
  const r = (fnv1a(`price|${g}|${day}`) % 20001) / 10000 - 1;
  return base * (1 + r * NOISE);
}

/** Nghìn đồng, làm tròn 0,5. */
export function offerPriceK(o: Offer, day: number): number {
  return Math.max(0.5, Math.round(marketPriceK(o.good, day) * QUALITIES[o.tier].price * o.mul * 2) / 2);
}

export const offerPrice = (o: Offer, day: number) => vnd(offerPriceK(o, day));

/** Dòng rẻ nhất ở mức yêu cầu; không có thì mức gần nhất. */
export function defaultOffer(g: GoodId, tier: Quality = "THUONG"): Offer {
  const all = offersOfGood(g);
  const order: Quality[] = tier === "BAN" ? ["BAN", "THUONG", "NGON"] : tier === "NGON" ? ["NGON", "THUONG", "BAN"] : ["THUONG", "NGON", "BAN"];
  for (const t of order) {
    const of = all.filter((o) => o.tier === t);
    if (of.length) return of.reduce((a, b) => (a.mul * QUALITIES[a.tier].price <= b.mul * QUALITIES[b.tier].price ? a : b));
  }
  throw new Error(`không có nhà cung cấp bán ${g}`);
}

/** Mọi món đều phải có người bán. */
export const UNSOLD = GOOD_IDS.filter((g) => !GOODS[g] || !offersOfGood(g).length);

/** Mã dòng hàng hoặc mã món cũ → món và mức. */
export function resolveKey(key: string): { good: GoodId; tier: Quality } | null {
  const o = offerById(key);
  if (o) return { good: o.good, tier: o.tier };
  return GOODS[key as GoodId] ? { good: key as GoodId, tier: "THUONG" } : null;
}
