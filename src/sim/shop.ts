import type { SaveFile } from "../core/save";
import { DAY_START_MIN, fmtHhmm } from "../core/clock";
import { GOODS, GOOD_IDS, buy, coldSlotCap, coldSlotsUsed, type GoodId } from "./econ";
import { basketCost, unitPriceVnd } from "./day";

export type Basket = Partial<Record<GoodId, number>>;

export type Order = {
  id: number;
  day: number;
  items: Basket;
  total: number;
  deliverDay: number;
  deliverMin: number;
  express: boolean;
  delivered: boolean;
};

export type GearOrder = { id: number; day: number; items: string[]; total: number; delivered: boolean };

export type ShopState = {
  seq: number; orders: Order[]; cart: Basket;
  /** Giỏ đồ nghề và đơn đồ nghề; mỗi món một cái. */
  gearCart: string[]; gearOrders: GearOrder[];
};

export const newShop = (): ShopState => ({ seq: 0, orders: [], cart: {}, gearCart: [], gearOrders: [] });

/** Đơn đặt trước giờ mở cửa tới lúc này. */
export const PRE_OPEN_ARRIVE_MIN = DAY_START_MIN + 10;
export const EXPRESS_MIN = 60;
export const DISCOUNT_PCT = 0.1;
export const ORDER_KEEP = 30;

export type Category = { id: string; label: string; goods: GoodId[] };

export const CATEGORIES: Category[] = [
  { id: "banh", label: "Bánh", goods: ["BANH"] },
  { id: "nhan", label: "Nhân", goods: ["PATE_NHA", "PATE_THUONG", "THIT_NGUOI", "CHA_LUA", "XIU_MAI", "TRUNG"] },
  { id: "rau", label: "Rau & đồ chua", goods: ["RAU", "DO_CHUA_NL", "DO_CHUA_SAN"] },
  { id: "gv", label: "Gia vị", goods: ["OT", "SOT"] },
];

export const itemsOf = (b: Basket) => GOOD_IDS.filter((g) => (b[g] ?? 0) > 0).map((g) => ({ g, n: b[g]! }));

function coldOf(b: Basket) {
  let s = 0;
  for (const [g, n] of Object.entries(b)) {
    const d = GOODS[g as GoodId];
    if (d.storage === "COLD") s += (n ?? 0) * (d.coldSlots ?? 1);
  }
  return s;
}

export const inTransit = (w: SaveFile) => w.shop.orders.filter((o) => !o.delivered);

/** Chỗ lạnh đã dùng + đang trên đường tới. */
export function coldAfter(w: SaveFile, extra: Basket) {
  const day = w.progress.dayIndex;
  const pending = inTransit(w).reduce((a, o) => a + coldOf(o.items), 0);
  return coldSlotsUsed(w.inventory, day) + pending + coldOf(extra);
}

export const coldCap = (w: SaveFile) => coldSlotCap(w.inventory);

export type Quote = {
  subtotal: number;
  discount: number;
  total: number;
  deliverDay: number;
  deliverMin: number;
  /** Thiếu gì thì ghi lý do, đủ thì null. */
  blocked: "empty" | "cash" | "cold" | null;
};

export function quote(w: SaveFile, b: Basket, nowMin: number, o: { coupon: boolean; express: boolean; beforeOpen: boolean }): Quote {
  const day = w.progress.dayIndex;
  const subtotal = basketCost(b, day);
  const discount = o.coupon ? Math.round(subtotal * DISCOUNT_PCT / 1000) * 1000 : 0;
  const total = subtotal - discount;
  let deliverDay = day, deliverMin = PRE_OPEN_ARRIVE_MIN;
  if (o.express) deliverMin = Math.max(nowMin, DAY_START_MIN) + EXPRESS_MIN;
  else if (!o.beforeOpen) { deliverDay = day + 1; deliverMin = DAY_START_MIN; }
  let blocked: Quote["blocked"] = null;
  if (!itemsOf(b).length) blocked = "empty";
  else if (total > w.money.cash) blocked = "cash";
  else if (coldAfter(w, b) > coldCap(w)) blocked = "cold";
  return { subtotal, discount, total, deliverDay, deliverMin, blocked };
}

export function placeOrder(w: SaveFile, b: Basket, nowMin: number, o: { coupon: boolean; express: boolean; beforeOpen: boolean }): Order | null {
  const coupon = o.coupon && w.system.discount > 0;
  const express = o.express && w.system.express > 0;
  const q = quote(w, b, nowMin, { ...o, coupon, express });
  if (q.blocked) return null;
  if (coupon) w.system.discount--;
  if (express) w.system.express--;
  w.money.cash -= q.total;
  w.econ.today.market += q.total;
  const order: Order = {
    id: ++w.shop.seq, day: w.progress.dayIndex, items: { ...b }, total: q.total,
    deliverDay: q.deliverDay, deliverMin: q.deliverMin, express, delivered: false,
  };
  w.shop.orders.unshift(order);
  w.inventory.lastBasket = { ...b };
  if (w.shop.orders.length > ORDER_KEEP) w.shop.orders.length = ORDER_KEEP;
  return order;
}

/** Giao các đơn đã tới hạn; trả về những đơn vừa giao. */
export function deliverDue(w: SaveFile, nowMin: number): Order[] {
  const day = w.progress.dayIndex;
  const out: Order[] = [];
  for (const o of w.shop.orders) {
    if (o.delivered) continue;
    if (o.deliverDay > day || (o.deliverDay === day && o.deliverMin > nowMin)) continue;
    for (const [g, n] of Object.entries(o.items)) if (n) buy(w.inventory, g as GoodId, n, day);
    o.delivered = true;
    out.push(o);
  }
  return out;
}

export const arriveText = (o: Pick<Order, "deliverDay" | "deliverMin">, today: number) =>
  o.deliverDay > today ? `sáng mai ${fmtHhmm(o.deliverMin)}` : fmtHhmm(o.deliverMin);

export const itemLine = (g: GoodId, n: number) => `${GOODS[g].label} × ${n}`;
export const lineTotal = (g: GoodId, n: number, day: number) => unitPriceVnd(g, day) * n;
