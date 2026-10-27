import type { SaveFile } from "../core/save";
import { Rng, fnv1a, splitmix32 } from "../core/rng";
import { GOODS, buy, stockOf, type GoodId } from "./econ";
import { unitPriceVnd } from "./day";
import { EQUIP, has, priceVnd, resellable, type EquipId } from "./equipment";

export type Tier = "RE" | "THUONG" | "CAO";

export const TIERS: Record<Tier, { label: string; pay: number; odds: number }> = {
  RE: { label: "Giá rẻ", pay: 0.5, odds: 1.5 },
  THUONG: { label: "Giá thường", pay: 0.7, odds: 1 },
  CAO: { label: "Giá cao", pay: 0.9, odds: 0.4 },
};

export const MAX_LISTINGS = 3;
export const LISTING_DAYS = 4;

/** Xác suất có người mua mỗi sáng, chờ mô phỏng chốt. */
export const BASE_ODDS = { small: 0.5, large: 0.2, dry: 0.3 } as const;

/** Đồ nghề đắt từ mức này tính là đồ lớn. */
const LARGE_FROM_K = 1000;
export const DRY_GOODS: GoodId[] = ["SOT", "DO_CHUA_SAN"];

export type Listing = {
  id: number;
  kind: "equip" | "good";
  ref: string;
  units: number;
  tier: Tier;
  listedDay: number;
  expireDay: number;
  ask: number;
  cost: number;
};

export type ResellState = { seq: number; listings: Listing[]; news: string[] };
export const newResell = (): ResellState => ({ seq: 0, listings: [], news: [] });

const sizeOf = (id: EquipId) => (EQUIP[id].price_k >= LARGE_FROM_K ? "large" : "small");

export const listable = (w: SaveFile) => ({
  equip: resellable(w.equipment).filter((id) => !w.resell.listings.some((l) => l.ref === id)),
  goods: DRY_GOODS.filter((g) => stockOf(w.inventory, g, w.progress.dayIndex) > 0),
});

export function costOf(w: SaveFile, kind: Listing["kind"], ref: string, units: number): number {
  return kind === "equip" ? priceVnd(ref as EquipId) : unitPriceVnd(ref as GoodId, w.progress.dayIndex) * units;
}

export const askFor = (cost: number, tier: Tier) => Math.round((cost * TIERS[tier].pay) / 1000) * 1000;

export function oddsOf(l: Pick<Listing, "kind" | "ref" | "tier">): number {
  const base = l.kind === "good" ? BASE_ODDS.dry : BASE_ODDS[sizeOf(l.ref as EquipId)];
  return Math.min(0.95, base * TIERS[l.tier].odds);
}

export function whyNot(w: SaveFile): string | null {
  return w.resell.listings.length >= MAX_LISTINGS ? "full" : null;
}

export function post(w: SaveFile, kind: Listing["kind"], ref: string, tier: Tier, units = 1): Listing | null {
  if (whyNot(w)) return null;
  const day = w.progress.dayIndex;
  if (kind === "equip") {
    if (!has(w.equipment, ref as EquipId)) return null;
    w.equipment.owned = w.equipment.owned.filter((x) => x !== ref);
    w.equipment.installed = [...w.equipment.owned];
  } else {
    const have = stockOf(w.inventory, ref as GoodId, day);
    const per = GOODS[ref as GoodId].perUnit;
    if (have < units * per) return null;
    take(w, ref as GoodId, units * per, day);
  }
  const cost = costOf(w, kind, ref, units);
  const l: Listing = {
    id: ++w.resell.seq, kind, ref, units, tier, listedDay: day, expireDay: day + LISTING_DAYS,
    ask: askFor(cost, tier), cost,
  };
  w.resell.listings.push(l);
  return l;
}

function take(w: SaveFile, g: GoodId, portions: number, day: number) {
  let need = portions;
  for (const lot of w.inventory.lots.filter((x) => x.good === g).sort((a, b) => a.day - b.day)) {
    const t = Math.min(lot.left, need);
    lot.left -= t;
    need -= t;
    if (need <= 0) break;
  }
  w.inventory.lots = w.inventory.lots.filter((x) => x.left > 0);
  void day;
}

export const nameOf = (l: Pick<Listing, "kind" | "ref" | "units">) =>
  l.kind === "equip" ? EQUIP[l.ref as EquipId].name : `${GOODS[l.ref as GoodId].label} × ${l.units}`;

/** Lấy tin xuống: đồ nghề về xe, hàng về kho. */
export function withdraw(w: SaveFile, l: Listing) {
  w.resell.listings = w.resell.listings.filter((x) => x.id !== l.id);
  if (l.kind === "equip") {
    if (!has(w.equipment, l.ref as EquipId)) w.equipment.owned.push(l.ref);
    w.equipment.installed = [...w.equipment.owned];
  } else {
    buy(w.inventory, l.ref as GoodId, l.units, w.progress.dayIndex);
  }
}

/** Mỗi sáng: tin có người mua thì tiền vào két, hết hạn thì gỡ. */
export function morning(w: SaveFile): string[] {
  const day = w.progress.dayIndex;
  const news: string[] = [];
  for (const l of [...w.resell.listings]) {
    const rng = new Rng(splitmix32(fnv1a(`${w.saveId}|resell|${day}|${l.id}`)));
    if (rng.next() < oddsOf(l)) {
      w.money.cash += l.ask;
      w.econ.today.tools -= l.ask;
      w.resell.listings = w.resell.listings.filter((x) => x.id !== l.id);
      w.ach.resold++;
      news.push(`Đã bán ${nameOf(l)}: +${l.ask.toLocaleString("vi-VN")}₫`);
    } else if (day >= l.expireDay) {
      withdraw(w, l);
      news.push(`Tin ${nameOf(l)} hết hạn, đồ đã về lại`);
    }
  }
  w.resell.news.push(...news);
  return news;
}
