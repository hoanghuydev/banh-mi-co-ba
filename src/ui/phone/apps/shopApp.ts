import { GOODS, GOOD_IDS, lotQuality, type GoodId } from "../../../sim/econ";
import { fmtUnits, unitPriceVnd } from "../../../sim/day";
import {
  CATEGORIES, arriveText, coldAfter, coldCap, inTransit, itemsOf, placeOrder, quote, type Basket, type Order,
} from "../../../sim/shop";
import { page, scroller, navBar, type AppCtx } from "../ctx";
import { ICON, btn, el, money } from "../dom";
import { tabBar } from "../tabs";

type Tab = "shop" | "cart" | "orders";

/** Đơn vừa đặt, để tab Đơn hàng báo một lần. */
let justOrdered = 0;
const picked = new Set<string>();

export function shopApp(ctx: AppCtx): HTMLElement {
  const tab = (ctx.route.tab as Tab) ?? "shop";
  const cat = ctx.route.id ?? "all";
  const body = tab === "shop" ? catalog(ctx, cat) : tab === "cart" ? cart(ctx) : orders(ctx);
  return page(
    navBar(ctx, { title: tab === "shop" ? "Thực phẩm" : tab === "cart" ? "Giỏ hàng" : "Đơn hàng", back: { label: "Màn chính", to: { app: "home" } } }),
    body,
    tabBar(ctx, "shop", tab, [
      { id: "shop", label: "Mua sắm", icon: ICON.bagLine },
      { id: "cart", label: "Giỏ hàng", icon: ICON.cart, count: itemsOf(ctx.w.shop.cart).length },
      { id: "orders", label: "Đơn hàng", icon: ICON.box, count: inTransit(ctx.w).length },
    ]),
  );
}

function haveText(ctx: AppCtx, g: GoodId): string {
  const w = ctx.w, day = w.progress.dayIndex, inv = w.inventory, d = GOODS[g];
  const left = inv.lots
    .filter((l) => l.good === g && l.left > 0 && lotQuality(l, day, inv.storage, inv.noiU) !== null)
    .reduce((a, l) => a + l.left, 0);
  return left > 0 ? `Còn ${fmtUnits(left / d.perUnit)} ${d.unit}` : "Hết hàng";
}

function setQty(ctx: AppCtx, g: GoodId, n: number) {
  const cart = ctx.w.shop.cart;
  if (n <= 0) delete cart[g]; else cart[g] = n;
  ctx.host.onSave();
}

function stepper(ctx: AppCtx, g: GoodId, after: () => void) {
  const d = GOODS[g];
  const n = ctx.w.shop.cart[g] ?? 0;
  const box = el("div", "ph-step");
  const minus = btn("", "−", () => { setQty(ctx, g, n - d.step); after(); }, `Bớt ${d.label}`);
  minus.disabled = n <= 0;
  const plus = btn("", "+", () => { setQty(ctx, g, n + d.step); after(); }, `Thêm ${d.label}`);
  box.append(minus, el("span", "q", n > 0 ? fmtUnits(n) : "0"), plus);
  if (n <= 0) box.classList.add("zero");
  return box;
}

function trend(g: GoodId, day: number): HTMLElement | null {
  if (day <= 1) return null;
  const a = unitPriceVnd(g, day), b = unitPriceVnd(g, day - 1);
  if (a === b) return null;
  const t = el("span", `ph-trend ${a > b ? "up" : "down"}`, `${a > b ? "▲" : "▼"} ${money(Math.abs(a - b))}`);
  t.setAttribute("aria-label", a > b ? "giá tăng" : "giá giảm");
  return t;
}

function catalog(ctx: AppCtx, cat: string): HTMLElement {
  const day = ctx.w.progress.dayIndex;
  const chips = el("div", "ph-chips");
  const all = [{ id: "all", label: "Tất cả", goods: GOOD_IDS }, ...CATEGORIES];
  for (const c of all) {
    chips.append(btn(`ph-pill${c.id === cat ? " on" : ""}`, c.label, () => ctx.go({ app: "shop", tab: "shop", id: c.id }, "")));
  }
  const goods = (all.find((c) => c.id === cat) ?? all[0]).goods;
  const list = el("div", "ph-prods");
  for (const g of goods) {
    const d = GOODS[g];
    const card = el("div", `ph-prod${(ctx.w.shop.cart[g] ?? 0) > 0 ? " has" : ""}`);
    const info = el("div", "info");
    info.append(el("div", "nm", d.label));
    const price = el("div", "pr");
    price.append(el("b", "", money(unitPriceVnd(g, day))), document.createTextNode(` / ${d.unit}`));
    const t = trend(g, day);
    if (t) price.append(t);
    info.append(price, el("div", "st", haveText(ctx, g)));
    card.append(info, stepper(ctx, g, () => ctx.rerender()));
    list.append(card);
  }
  const sc = scroller(chips, list);
  sc.style.position = "relative";
  const n = itemsOf(ctx.w.shop.cart).length;
  const wrap = el("div");
  wrap.style.cssText = "display:flex;flex-direction:column;flex:1;min-height:0";
  wrap.append(sc);
  if (n) {
    const q = quote(ctx.w, ctx.w.shop.cart, ctx.host.minutes(), { coupon: false, express: false, beforeOpen: ctx.host.beforeOpen() });
    const bar = btn("ph-cartbar", "", () => ctx.go({ app: "shop", tab: "cart" }));
    bar.append(el("span", "", `${n} món trong giỏ`), el("b", "", money(q.subtotal)), el("span", "go", "Xem giỏ ›"));
    wrap.append(bar);
  }
  return wrap;
}

function cart(ctx: AppCtx): HTMLElement {
  const { w } = ctx;
  const items = itemsOf(w.shop.cart);
  const day = w.progress.dayIndex;
  if (!items.length) {
    const e = el("div", "ph-empty-big");
    e.innerHTML = ICON.cartBig;
    e.append(el("b", "", "Giỏ hàng trống"));
    e.append(btn("ph-primary slim", "Xem hàng", () => ctx.go({ app: "shop", tab: "shop" }, "")));
    return e;
  }
  const useCoupon = picked.has("coupon") && w.system.discount > 0;
  const useExpress = picked.has("express") && w.system.express > 0;
  const q = quote(w, w.shop.cart, ctx.host.minutes(), { coupon: useCoupon, express: useExpress, beforeOpen: ctx.host.beforeOpen() });

  const lines = el("div", "ph-card");
  for (const { g } of items) {
    const d = GOODS[g];
    const row = el("div", "ph-line-item");
    const info = el("div", "info");
    info.append(el("div", "nm", d.label), el("div", "pr", `${money(unitPriceVnd(g, day))} / ${d.unit}`));
    row.append(info, stepper(ctx, g, () => ctx.rerender()));
    lines.append(row);
  }

  const opts = el("div", "ph-card");
  const toggle = (key: string, label: string, left: number) => {
    const on = picked.has(key);
    const r = btn(`ph-switch${on ? " on" : ""}`, "", () => { if (on) picked.delete(key); else picked.add(key); ctx.rerender(); });
    r.setAttribute("role", "switch");
    r.setAttribute("aria-checked", String(on));
    r.append(el("span", "lb", label), el("span", "ct", `còn ${left}`), el("span", "sw"));
    opts.append(r);
  };
  if (w.system.discount > 0) toggle("coupon", "Thẻ giảm giá −10%", w.system.discount);
  if (w.system.express > 0) toggle("express", "Giao hoả tốc", w.system.express);

  const sum = el("div", "ph-card ph-sum");
  const kv = (k: string, v: string, cls = "") => {
    const r = el("div", `kv ${cls}`);
    r.append(el("span", "", k), el("b", "", v));
    sum.append(r);
  };
  kv("Tạm tính", money(q.subtotal));
  if (q.discount) kv("Thẻ giảm giá", `−${money(q.discount)}`, "good");
  kv("Giao hàng", arriveText({ deliverDay: q.deliverDay, deliverMin: q.deliverMin }, day));
  kv("Tiền quán sau khi đặt", money(w.money.cash - q.total), q.blocked === "cash" ? "bad" : "");

  const warn = q.blocked === "cash" ? "Không đủ tiền quán."
    : q.blocked === "cold" ? `Thùng xốp hết chỗ (${fmtUnits(coldAfter(w, w.shop.cart))}/${coldCap(w)} ô).` : "";
  const dock = el("div", "ph-compose");
  if (warn) dock.append(el("div", "ph-warn", warn));
  const go = btn("ph-primary", `Đặt hàng · ${money(q.total)}`, () => {
    const o = placeOrder(w, w.shop.cart, ctx.host.minutes(), { coupon: useCoupon, express: useExpress, beforeOpen: ctx.host.beforeOpen() });
    if (!o) return;
    w.shop.cart = {};
    picked.clear();
    justOrdered = o.id;
    ctx.host.onSave();
    ctx.host.onOrdered?.();
    ctx.go({ app: "shop", tab: "orders" }, "");
  });
  go.disabled = !!q.blocked;
  dock.append(go);

  const wrap = el("div");
  wrap.style.cssText = "display:flex;flex-direction:column;flex:1;min-height:0";
  wrap.append(scroller(lines, ...(opts.childElementCount ? [opts] : []), sum), dock);
  return wrap;
}

function orders(ctx: AppCtx): HTMLElement {
  const { w } = ctx;
  const day = w.progress.dayIndex;
  const sc = scroller();
  if (justOrdered) {
    const f = el("div", "ph-flash", `Đã đặt đơn #${justOrdered}`);
    sc.append(f);
    justOrdered = 0;
  }
  if (!w.shop.orders.length) {
    const e = el("div", "ph-empty-big");
    e.innerHTML = ICON.boxBig;
    e.append(el("b", "", "Chưa có đơn nào"));
    sc.append(e);
    return sc;
  }
  const card = el("div", "ph-orders");
  for (const o of w.shop.orders) card.append(orderCard(ctx, o, day));
  sc.append(card);
  return sc;
}

function orderCard(ctx: AppCtx, o: Order, day: number) {
  const c = el("div", "ph-order");
  const head = el("div", "hd");
  head.append(el("b", "", `Đơn #${o.id}`), el("span", "", o.day === day ? "Hôm nay" : `Ngày ${o.day}`));
  const status = el("span", `ph-st ${o.delivered ? "ok" : "go"}`, o.delivered ? "Đã giao" : `Đang giao · ${arriveText(o, day)}`);
  head.append(status);
  const lines = el("div", "ls");
  for (const { g, n } of itemsOf(o.items)) lines.append(el("div", "", `${GOODS[g].label} × ${fmtUnits(n)}`));
  const foot = el("div", "ft");
  foot.append(el("b", "", money(o.total)), btn("ph-btn-text", "Đặt lại", () => {
    ctx.w.shop.cart = { ...(o.items as Basket) };
    ctx.host.onSave();
    ctx.go({ app: "shop", tab: "cart" }, "");
  }));
  c.append(head, lines, foot);
  return c;
}
