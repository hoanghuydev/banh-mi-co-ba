/**
 * Mốc trong ngày dùng chung cho game thật (DayScene / MarketScene / EveningScene) và sim headless.
 *
 *   dawn()      rạng sáng: trời hôm nay · dọn hàng hư · thu tiền thuê
 *   basketFor() giỏ đủ cho N ổ — chỉ bot dùng; nút "mua như hôm qua" chép y giỏ hôm qua.
 */
import type { SaveFile } from "../core/save";
import {
  GOODS, GOOD_IDS, buy, expire, newInventory, priceOf, stockOf, vnd, weatherOf, type GoodId, type InventoryState,
} from "./econ";
import { easePatience } from "./ease";
import { eveningCount, morningRent, newEconState, newToday } from "./obligations";
import { CAL, fixedCostVnd, isRain } from "./econ";
import { equipPatienceMul, extraDailyVnd, has, newEquipState } from "./equipment";

const DAWN = "dawnDay";

export const USE_PER_LOAF: Partial<Record<GoodId, number>> = {
  BANH: 1, PATE_NHA: 1.0, THIT_NGUOI: 0.9, CHA_LUA: 0.9, XIU_MAI: 0.6, TRUNG: 0.6,
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

export function basketFor(inv: InventoryState, loaves: number, day: number, pate: GoodId = "PATE_NHA") {
  const out: Partial<Record<GoodId, number>> = {};
  for (const g of GOOD_IDS) {
    const per = g === pate ? USE_PER_LOAF.PATE_NHA : USE_PER_LOAF[g];
    if (!per) continue;
    const need = loaves * per;
    let have = stockOf(inv, g, day);
    if (g === "DO_CHUA_NL") have += stockOf(inv, "DO_CHUA_SAN", day);
    if (g === pate) have += stockOf(inv, pate === "PATE_NHA" ? "PATE_THUONG" : "PATE_NHA", day);
    const units = Math.ceil(Math.max(0, need - have) / GOODS[g].perUnit);
    if (units > 0) out[g] = units;
  }
  return out;
}

export const unitPriceVnd = (g: GoodId, day: number) => vnd(priceOf(g, day));

export function basketCost(b: Partial<Record<GoodId, number>>, day: number) {
  let s = 0;
  for (const [g, n] of Object.entries(b)) s += unitPriceVnd(g as GoodId, day) * (n ?? 0);
  return s;
}

export function buyBasket(w: SaveFile, b: Partial<Record<GoodId, number>>) {
  const day = w.progress.dayIndex;
  const basket = { ...b };
  const order: GoodId[] = ["BANH", "PATE_NHA", "PATE_THUONG", "THIT_NGUOI", "CHA_LUA", "RAU", "DO_CHUA_NL", "XIU_MAI", "TRUNG", "OT", "SOT", "DO_CHUA_SAN"];
  while (basketCost(basket, day) > w.money.cash) {
    const g = [...order].reverse().find((x) => (basket[x] ?? 0) > 0);
    if (!g) break;
    basket[g] = (basket[g] ?? 0) - (g === "BANH" ? Math.min(basket[g]!, 5) : 1);
  }
  const cost = basketCost(basket, day);
  w.money.cash -= cost;
  w.econ.today.market += cost;
  for (const [g, n] of Object.entries(basket)) if (n) buy(w.inventory, g as GoodId, n, day);
  w.inventory.lastBasket = basket;
  return { cost, basket };
}

export const fmtUnits = (u: number) => (Math.round(u * 10) / 10).toLocaleString("vi-VN");

export function eveningCounting(w: SaveFile) {
  const day = w.progress.dayIndex;
  eveningCount(w.econ, w.money, fixedCostVnd(day) + extraDailyVnd(w.equipment ?? newEquipState()));
  const e = w.econ.today, t = w.progress.today;
  const cost = e.market + e.rent + e.fixed + e.tools + e.talk;
  const row = { day, revenue: t.revenue, cost, served: t.served, lost: t.lost };
  const i = w.ledger.findIndex((r) => r.day === day);
  if (i >= 0) w.ledger[i] = row; else w.ledger.push(row);
}

/**
 * P3-04 E2 — loa rao làm hàng xóm khó chịu dần (ẩn, không bao giờ hiện số). Ngưỡng 7: cô Mai
 * nhắc khéo · 12: khách than ồn · 18: bị bắt tắt 5 ngày. Chạy mỗi tối.
 */
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
    gazeMul: CAL.weatherInfo[weatherOf(day)].gazeMul,
  };
}
