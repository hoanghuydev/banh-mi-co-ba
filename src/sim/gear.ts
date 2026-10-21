import type { SaveFile } from "../core/save";
import { ORDER_KEEP } from "./shop";
import { EQUIP, capacity, has, installEquip, priceVnd, used, whyNot, type EquipId, type EquipState } from "./equipment";

/** Đồ nghề đã đặt, giao và lắp vào sáng mai. */
export const pendingGear = (w: SaveFile) =>
  w.shop.gearOrders.filter((o) => !o.delivered).flatMap((o) => o.items) as EquipId[];

export const gearCart = (w: SaveFile) => w.shop.gearCart as EquipId[];

function applyTo(e: EquipState, ids: readonly EquipId[]) {
  for (const id of ids) {
    const r = EQUIP[id].replaces;
    if (r) e.owned = e.owned.filter((x) => x !== r);
    e.owned.push(id);
  }
}

/** Trạng thái xe sau khi đồ đang giao (và đồ trong giỏ nếu `withCart`) đã lắp. */
function afterPending(w: SaveFile, withCart = false): EquipState {
  const e: EquipState = { owned: [...w.equipment.owned], installed: [], wear: {} };
  applyTo(e, pendingGear(w));
  if (withCart) applyTo(e, gearCart(w));
  return e;
}

/** Lý do chưa thêm vào giỏ được, hoặc null. */
export function gearBlock(w: SaveFile, id: EquipId): string | null {
  if (pendingGear(w).includes(id)) return "đang giao";
  return whyNot(id, afterPending(w), Number.MAX_SAFE_INTEGER);
}

export function toggleGear(w: SaveFile, id: EquipId): boolean {
  const i = w.shop.gearCart.indexOf(id);
  if (i >= 0) { w.shop.gearCart.splice(i, 1); return true; }
  if (gearBlock(w, id)) return false;
  w.shop.gearCart.push(id);
  return true;
}

export type GearQuote = { total: number; blocked: "empty" | "cash" | "slots" | null };

export function gearQuote(w: SaveFile): GearQuote {
  const cart = gearCart(w);
  const total = cart.reduce((a, id) => a + priceVnd(id), 0);
  if (!cart.length) return { total, blocked: "empty" };
  if (total > w.money.cash) return { total, blocked: "cash" };
  const e = afterPending(w, true);
  if (used(e) > capacity(e)) return { total, blocked: "slots" };
  return { total, blocked: null };
}

export function orderGear(w: SaveFile): number | null {
  const q = gearQuote(w);
  if (q.blocked) return null;
  w.money.cash -= q.total;
  w.econ.today.tools += q.total;
  const id = ++w.shop.seq;
  w.shop.gearOrders.unshift({ id, day: w.progress.dayIndex, items: [...w.shop.gearCart], total: q.total, delivered: false });
  if (w.shop.gearOrders.length > ORDER_KEEP) w.shop.gearOrders.length = ORDER_KEEP;
  w.shop.gearCart = [];
  return id;
}

/** Sáng mai: lắp hết đồ vừa giao. */
export function installPending(w: SaveFile): EquipId[] {
  const done: EquipId[] = [];
  for (const o of w.shop.gearOrders) {
    if (o.delivered) continue;
    for (const id of o.items as EquipId[]) {
      if (has(w.equipment, id)) continue;
      installEquip(id, w.equipment, w.money, w.econ);
      if (EQUIP[id].costsMorning) w.flags.lateOpenDay = w.progress.dayIndex;
      done.push(id);
    }
    o.delivered = true;
  }
  return done;
}
