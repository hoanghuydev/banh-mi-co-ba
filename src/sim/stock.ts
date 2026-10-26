import { GOODS, coldSlotCap, coldSlotsUsed, goodsFor, lotQuality, shelfDays, type GoodId, type InventoryState, type Lot, type Quality } from "./econ";
import { INGREDIENTS } from "./order";

/** Các lô cùng món, cùng mức, cùng ngày mua gộp thành một ô kho. */
export type Stack = {
  good: GoodId;
  tier: Quality;
  left: number;
  age: number;
  daysLeft: number;
  shelf: number;
  key: string;
  quality: number;
  cold: boolean;
};

export type Freshness = "fresh" | "aging" | "last";

const keyOf = (l: Lot) => `${l.good}|${l.tier ?? "THUONG"}|${l.day}`;

/** Ô còn hạn, theo thứ tự lô trong kho (ô trước được lấy dùng trước). */
export function stacksOf(inv: InventoryState, day: number): Stack[] {
  const storage = inv.storage ?? "thung_xop";
  const by = new Map<string, Stack>();
  for (const l of inv.lots) {
    const quality = lotQuality(l, day, storage);
    if (l.left <= 0 || quality === null) continue;
    const tier = l.tier ?? "THUONG";
    const key = keyOf(l);
    const hit = by.get(key);
    if (hit) { hit.left += l.left; continue; }
    const shelf = shelfDays(l.good, storage, tier);
    by.set(key, {
      good: l.good, tier, left: l.left, age: day - l.day, shelf, daysLeft: shelf - (day - l.day),
      key, quality, cold: GOODS[l.good].storage === "COLD",
    });
  }
  return [...by.values()];
}

/** Dời ô `from` vào chỗ ô `to`; lô ngoài các ô (hết hạn) giữ ở cuối. */
export function moveStack(inv: InventoryState, stacks: readonly Stack[], from: number, to: number) {
  const order = stacks.map((s) => s.key);
  const [k] = order.splice(from, 1);
  order.splice(to, 0, k);
  const rank = new Map(order.map((key, i) => [key, i]));
  inv.lots = inv.lots
    .map((l, i) => ({ l, i, r: rank.get(keyOf(l)) ?? order.length }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.l);
}

/** Thứ tự lấy dùng của ô trong số các ô cùng loại nhân, `null` nếu chỉ có một ô. */
export function useRank(stacks: readonly Stack[], i: number): { at: number; of: number } | null {
  const peers = stacks.filter((s) => sameUse(s.good, stacks[i].good));
  return peers.length < 2 ? null : { at: peers.indexOf(stacks[i]) + 1, of: peers.length };
}

const usesOf = (g: GoodId): string[] =>
  g === "BANH" ? ["bread"] : INGREDIENTS.filter((x) => goodsFor(x.id).includes(g)).map((x) => x.id);
const sameUse = (a: GoodId, b: GoodId) => usesOf(a).some((u) => usesOf(b).includes(u));

export function freshnessOf(s: Stack): Freshness {
  if (s.age > 0 && s.daysLeft === 1) return "last";
  return s.daysLeft / s.shelf >= 0.6 ? "fresh" : "aging";
}

export const coldUsage = (inv: InventoryState, day: number) => ({
  used: coldSlotsUsed(inv, day),
  cap: coldSlotCap(inv),
});
