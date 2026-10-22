// Mốc trong ngày dùng chung cho game thật và sim headless.
import type { SaveFile } from "../core/save";
import {
  GOODS, GOOD_IDS, buy, expire, newInventory, stockOf, weatherOf, type GoodId, type InventoryState, type Quality,
} from "./econ";
import { defaultOffer, offerPrice } from "./suppliers";
import { easePatience } from "./ease";
import { eveningCount, morningRent, newEconState, newToday } from "./obligations";
import { CAL, fixedCostVnd, isRain } from "./econ";
import { extraGuests, feeWaivedToday, patienceBonusSec } from "./system";
import { equipPatienceMul, extraDailyVnd, has, newEquipState } from "./equipment";
import { goodOpen } from "./unlock";

const DAWN = "dawnDay";

export const USE_PER_LOAF: Partial<Record<GoodId, number>> = {
  BANH: 1, PATE: 1.0, THIT_NGUOI: 0.9, CHA_LUA: 0.9, XIU_MAI: 0.6, TRUNG: 0.6,
  RAU: 3.4, OT: 1.1, SOT: 1.1, DO_CHUA_NL: 1.7,
};

export function dawn(w: SaveFile) {
  const day = w.progress.dayIndex;
  if (w.flags[DAWN] === day) return null;
  w.flags[DAWN] = day;
  w.inventory ??= newInventory();
  w.econ ??= newEconState();
  w.progress.weather = weatherOf(day);
  w.equipment ??= newEquipState();
  w.inventory.storage = has(w.equipment, "TU_MAT") ? "tu_mat" : "thung_xop";
  w.inventory.noiU = has(w.equipment, "NOI_U");
  if (isRain(w.progress.weather)) w.flags.rainyDaySeen = true;
  w.econ.today = newToday(day);
  const wasted = expire(w.inventory, day);
  w.econ.today.wasted = wasted.map((x) => `${fmtUnits(x.units)} ${GOODS[x.good].unit} ${GOODS[x.good].label}`);
  w.econ.float = w.econ.floatLeft = 100_000;
  const rent = morningRent(w.econ, w.money);
  return { wasted, rent };
}

export function basketFor(inv: InventoryState, loaves: number, day: number) {
  const out: Partial<Record<GoodId, number>> = {};
  for (const g of GOOD_IDS) {
    const per = USE_PER_LOAF[g];
    if (!per || !goodOpen(g, day)) continue;
    const need = loaves * per;
    let have = stockOf(inv, g, day);
    if (g === "DO_CHUA_NL") have += stockOf(inv, "DO_CHUA_SAN", day);
    const units = Math.ceil(Math.max(0, need - have) / GOODS[g].perUnit);
    if (units > 0) out[g] = units;
  }
  return out;
}

/** Giá một đơn vị ở nhà cung cấp rẻ nhất của mức đó. */
export const unitPriceVnd = (g: GoodId, day: number, tier: Quality = "THUONG") => offerPrice(defaultOffer(g, tier), day);

export function basketCost(b: Partial<Record<GoodId, number>>, day: number, tier: Quality = "THUONG") {
  let s = 0;
  for (const [g, n] of Object.entries(b)) s += unitPriceVnd(g as GoodId, day, tier) * (n ?? 0);
  return s;
}

/** Mua cả rổ ở nhà cung cấp rẻ nhất của `tier` (bot mô phỏng dùng). */
export function buyBasket(w: SaveFile, b: Partial<Record<GoodId, number>>, tier: Quality = "THUONG") {
  const day = w.progress.dayIndex;
  const basket = { ...b };
  const order: GoodId[] = ["BANH", "PATE", "THIT_NGUOI", "CHA_LUA", "RAU", "DO_CHUA_NL", "XIU_MAI", "TRUNG", "OT", "SOT", "DO_CHUA_SAN"];
  while (basketCost(basket, day, tier) > w.money.cash) {
    const g = [...order].reverse().find((x) => (basket[x] ?? 0) > 0);
    if (!g) break;
    basket[g] = (basket[g] ?? 0) - (g === "BANH" ? Math.min(basket[g]!, 5) : 1);
  }
  const cost = basketCost(basket, day, tier);
  w.money.cash -= cost;
  w.econ.today.market += cost;
  for (const [g, n] of Object.entries(basket)) if (n) buy(w.inventory, g as GoodId, n, day, defaultOffer(g as GoodId, tier).tier);
  return { cost, basket };
}

export const fmtUnits = (u: number) => (Math.round(u * 10) / 10).toLocaleString("vi-VN");

export function eveningCounting(w: SaveFile) {
  const day = w.progress.dayIndex;
  eveningCount(w.econ, w.money, feeWaivedToday(w) ? 0 : fixedCostVnd(day) + extraDailyVnd(w.equipment ?? newEquipState()));
  const e = w.econ.today, t = w.progress.today;
  const cost = e.market + e.rent + e.fixed + e.tools + e.talk + e.family;
  const row = { day, revenue: t.revenue, cost, served: t.served, lost: t.lost, sick: t.sick ?? 0 };
  if (w.flags.sickDay !== day) { w.flags.sickDay = day; w.flags.sickTotal = Number(w.flags.sickTotal ?? 0) + (t.sick ?? 0); }
  const i = w.ledger.findIndex((r) => r.day === day);
  if (i >= 0) w.ledger[i] = row; else w.ledger.push(row);
}

/** Loa rao làm hàng xóm khó chịu dần (ẩn số): 7 cô Mai nhắc · 12 khách than · 18 tắt loa 5 ngày. */
export function neighborTick(w: SaveFile) {
  const e = w.econ, day = w.progress.dayIndex;
  if (w.flags.neighborDay === day) return [];
  w.flags.neighborDay = day;
  const loaOn = has(w.equipment, "LOA_RAO") && (e.loaOffUntil ?? 0) < day;
  const before = e.neighborAnnoyance ?? 0;
  e.neighborAnnoyance = Math.max(0, before + (loaOn ? 1 : 0) - 0.5);
  const lines: string[] = [];
  if (before < 7 && e.neighborAnnoyance >= 7) lines.push('Cô Mai: "Con mở nhỏ nhỏ chút nghen, bà Tư nhà trên ngủ trưa."');
  if (before < 12 && e.neighborAnnoyance >= 12) lines.push('Khách: "Ồn quá con."');
  if (e.neighborAnnoyance >= 18) {
    e.loaOffUntil = day + 5;
    e.neighborAnnoyance = 10;
    lines.push('Hàng xóm: "Tắt cái loa giùm cái! Ngày nào cũng rao!" — năm hôm nay không mở loa được.');
  }
  return lines;
}

/** Hệ số khách của buổi bán: đồ nghề × sáu bữa đầu (sức chờ) và trời (ánh nhìn). */
export function dayDeps(w: SaveFile) {
  const day = w.progress.dayIndex;
  return {
    patienceMul: equipPatienceMul(w.equipment) * easePatience(day),
    patienceBonusSec: patienceBonusSec(w),
    extraGuests: extraGuests(w),
    gazeMul: CAL.weatherInfo[weatherOf(day)].gazeMul,
    prices: w.menu.price,
  };
}
