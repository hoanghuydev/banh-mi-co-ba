import { GOODS, coldSlotCap, coldSlotsUsed, lotQuality, shelfDays, type GoodId, type InventoryState, type Quality } from "./econ";

/** Các lô cùng món, cùng mức, cùng ngày mua gộp thành một ô kho. */
export type Stack = {
  good: GoodId;
  tier: Quality;
  left: number;
  age: number;
  daysLeft: number;
  shelf: number;
  quality: number;
  cold: boolean;
};

export type Freshness = "fresh" | "aging" | "last";

/** Ô còn hạn, món sắp hư xếp trước. */
export function stacksOf(inv: InventoryState, day: number): Stack[] {
  const storage = inv.storage ?? "thung_xop";
  const by = new Map<string, Stack>();
  for (const l of inv.lots) {
    const quality = lotQuality(l, day, storage);
    if (l.left <= 0 || quality === null) continue;
    const tier = l.tier ?? "THUONG";
    const key = `${l.good}|${tier}|${l.day}`;
    const hit = by.get(key);
    if (hit) { hit.left += l.left; continue; }
    const shelf = shelfDays(l.good, storage, tier);
    by.set(key, {
      good: l.good, tier, left: l.left, age: day - l.day, shelf, daysLeft: shelf - (day - l.day),
      quality, cold: GOODS[l.good].storage === "COLD",
    });
  }
  return [...by.values()].sort((a, b) => a.daysLeft - b.daysLeft || a.age - b.age || a.good.localeCompare(b.good));
}

export function freshnessOf(s: Stack): Freshness {
  if (s.age > 0 && s.daysLeft === 1) return "last";
  return s.daysLeft / s.shelf >= 0.6 ? "fresh" : "aging";
}

export const coldUsage = (inv: InventoryState, day: number) => ({
  used: coldSlotsUsed(inv, day),
  cap: coldSlotCap(inv),
});
