import { GOODS, QUALITIES, lotQuality, type GoodId } from "../../../sim/econ";
import { fmtUnits } from "../../../sim/day";
import { goodOpen } from "../../../sim/unlock";
import {
  CATEGORIES, EXPRESS_FEE, EXPRESS_MIN, PRE_OPEN_ARRIVE_MIN, arriveText, coldAfter, coldCap, inTransit, itemsOf,
  cancelOrder, placeOrder, quote, unitPrice, type Basket, type Order,
} from "../../../sim/shop";
import { fmtHhmm } from "../../../core/clock";
import { OFFERS, SUPPLIERS, marketPriceK, offerPrice, offerPriceK, supplierById, type Offer } from "../../../sim/suppliers";
import { page, scroller, navBar, type AppCtx } from "../ctx";
import { ICON, btn, el, money } from "../dom";
import { sfx } from "../../../audio/sfx";
import { tabBar } from "../tabs";

type Tab = "shop" | "cart" | "orders";

/** Đơn vừa đặt, để tab Đơn hàng báo một lần. */
let justOrdered = 0;
const picked = new Set<string>();
let goodFilter: GoodId | "" = "";
const ORDER_PAGE = 10;

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

const TIER_CLASS = { BAN: "bad", THUONG: "mid", NGON: "good" } as const;

function haveText(ctx: AppCtx, g: GoodId): string {
  const w = ctx.w, day = w.progress.dayIndex, inv = w.inventory, d = GOODS[g];
  const left = inv.lots
    .filter((l) => l.good === g && l.left > 0 && lotQuality(l, day, inv.storage) !== null)
    .reduce((a, l) => a + l.left, 0);
  return left > 0 ? `Kho: ${fmtUnits(left / d.perUnit)} ${d.unit}` : "Kho trống";
}

function setQty(ctx: AppCtx, key: string, n: number) {
  const cart = ctx.w.shop.cart;
  if (n <= 0) delete cart[key]; else cart[key] = n;
  ctx.host.onSave();
}

function stepper(ctx: AppCtx, key: string, good: GoodId, after: () => void) {
  const d = GOODS[good];
  const n = ctx.w.shop.cart[key] ?? 0;
  const box = el("div", "ph-step");
  const minus = btn("", "−", () => { setQty(ctx, key, n - d.step); after(); }, `Bớt ${d.label}`);
  minus.disabled = n <= 0;
  const plus = btn("", "+", () => { setQty(ctx, key, n + d.step); after(); }, `Thêm ${d.label}`);
  plus.dataset.offer = key;
  box.append(minus, el("span", "q", n > 0 ? fmtUnits(n) : "0"), plus);
  if (n <= 0) box.classList.add("zero");
  return box;
}

function trend(o: Offer, day: number): HTMLElement | null {
  if (day <= 1) return null;
  const a = offerPrice(o, day), b = offerPrice(o, day - 1);
  if (a === b) return null;
  const t = el("span", `ph-trend ${a > b ? "up" : "down"}`, `${a > b ? "▲" : "▼"} ${money(Math.abs(a - b))}`);
  t.setAttribute("aria-label", a > b ? "giá tăng" : "giá giảm");
  return t;
}

function pips(label: string, n: number, kind: string) {
  const row = el("div", `ph-bar3 ${kind}`);
  row.setAttribute("role", "img");
  row.setAttribute("aria-label", `${label} ${n} trên 5`);
  row.append(el("span", "lb", label));
  const box = el("span", "pp");
  for (let i = 1; i <= 5; i++) box.append(el("i", i <= n ? "on" : ""));
  row.append(box);
  return row;
}

/** Thanh Giá: so với giá thị trường của món. */
const pricePips = (o: Offer, day: number) => {
  const r = offerPriceK(o, day) / marketPriceK(o.good, day);
  return Math.max(1, Math.min(5, Math.round((r - 0.35) / 0.2)));
};

function offerCard(ctx: AppCtx, o: Offer, showSupplier: boolean): HTMLElement {
  const day = ctx.w.progress.dayIndex;
  const d = GOODS[o.good];
  const q = QUALITIES[o.tier];
  const card = el("div", `ph-prod${(ctx.w.shop.cart[o.id] ?? 0) > 0 ? " has" : ""}`);
  const info = el("div", "info");
  const top = el("div", "nm");
  top.append(document.createTextNode(d.label), el("span", `ph-tier-tag ${TIER_CLASS[o.tier]}`, q.label));
  info.append(top);
  if (showSupplier) info.append(el("div", "sup", supplierById(o.supplier)?.name ?? ""));
  const bars = el("div", "ph-bars3");
  bars.append(pips("Ngon", q.tasteBar, "g"), pips("Sạch", q.clean, "g"), pips("Giá", pricePips(o, day), "p"));
  info.append(bars);
  const price = el("div", "pr");
  price.append(el("b", "", money(offerPrice(o, day))), document.createTextNode(` / ${d.unit}`));
  const t = trend(o, day);
  if (t) price.append(t);
  info.append(price);
  info.append(el("div", "st", haveText(ctx, o.good)));
  card.append(info, stepper(ctx, o.id, o.good, () => ctx.rerender()));
  return card;
}

function wheelAsScrollX(row: HTMLElement) {
  row.addEventListener("wheel", (e) => {
    if (e.deltaY === 0 || row.scrollWidth <= row.clientWidth) return;
    row.scrollLeft += e.deltaY;
    e.preventDefault();
  }, { passive: false });
}

function catalog(ctx: AppCtx, cat: string): HTMLElement {
  const day = ctx.w.progress.dayIndex;
  const chips = el("div", "ph-chips");
  const chip = (id: string, label: string) =>
    chips.append(btn(`ph-pill${id === cat ? " on" : ""}`, label, () => ctx.go({ app: "shop", tab: "shop", id }, "")));
  chip("all", "Tất cả");
  for (const s of SUPPLIERS) chip(s.id, s.name);
  wheelAsScrollX(chips);

  const goods = CATEGORIES.flatMap((c) => c.goods).filter((g) => goodOpen(g, day));
  if (goodFilter && !goods.includes(goodFilter)) goodFilter = "";
  const kinds = el("div", "ph-chips");
  const kind = (g: GoodId | "", label: string) =>
    kinds.append(btn(`ph-pill${g === goodFilter ? " on" : ""}`, label, () => { goodFilter = g; ctx.rerender(); }));
  kind("", "Mọi món");
  for (const g of goods) kind(g, GOODS[g].label);
  wheelAsScrollX(kinds);

  const shown = (o: Offer) => goodOpen(o.good, day) && (!goodFilter || o.good === goodFilter);
  const list = el("div", "ph-prods");
  const sup = supplierById(cat);
  if (sup) {
    list.append(el("div", "ph-supnote", sup.blurb));
    for (const o of OFFERS.filter((x) => x.supplier === sup.id && shown(x))) list.append(offerCard(ctx, o, false));
  } else {
    for (const c of CATEGORIES) {
      const rows = OFFERS.filter((o) => c.goods.includes(o.good) && shown(o))
        .sort((a, b) => GOODS[a.good].label.localeCompare(GOODS[b.good].label, "vi") || offerPrice(a, day) - offerPrice(b, day));
      if (!rows.length) continue;
      list.append(el("div", "ph-sec", c.label));
      for (const o of rows) list.append(offerCard(ctx, o, true));
    }
  }
  if (!list.querySelector(".ph-prod")) list.append(el("div", "ph-supnote", "Nhà này không có món đang lọc."));
  const sc = scroller(chips, kinds, list);
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
  const useExpress = picked.has("express") && !ctx.host.beforeOpen();
  const q = quote(w, w.shop.cart, ctx.host.minutes(), { coupon: useCoupon, express: useExpress, beforeOpen: ctx.host.beforeOpen() });

  const lines = el("div");
  const bySupplier = new Map<string, typeof items>();
  for (const l of items) {
    const sid = l.offer?.supplier ?? "";
    (bySupplier.get(sid) ?? bySupplier.set(sid, []).get(sid)!).push(l);
  }
  for (const [sid, rows] of bySupplier) {
    const card = el("div", "ph-card");
    card.append(el("div", "ph-sec in", supplierById(sid)?.name ?? "Đơn cũ"));
    for (const l of rows) {
      const d = GOODS[l.good];
      const row = el("div", "ph-line-item");
      const info = el("div", "info");
      const nm = el("div", "nm");
      nm.append(document.createTextNode(d.label), el("span", `ph-tier-tag ${TIER_CLASS[l.tier]}`, QUALITIES[l.tier].label));
      info.append(nm, el("div", "pr", `${money(unitPrice(l, day))} / ${d.unit} × ${fmtUnits(l.n)}`));
      info.append(el("div", "amt", money(unitPrice(l, day) * l.n)));
      row.append(info, stepper(ctx, l.key, l.good, () => ctx.rerender()));
      card.append(row);
    }
    lines.append(card);
  }

  const opts = el("div", "ph-card");
  const toggle = (key: string, label: string, note: string, off = "") => {
    const on = picked.has(key) && !off;
    const r = btn(`ph-switch${on ? " on" : ""}`, "", () => { if (on) picked.delete(key); else picked.add(key); ctx.rerender(); });
    r.disabled = !!off;
    r.dataset.opt = key;
    r.setAttribute("role", "switch");
    r.setAttribute("aria-checked", String(on));
    const tx = el("div", "tx");
    tx.append(el("div", "lb", label), el("div", "ct", off || note));
    r.append(tx, el("span", "sw"));
    opts.append(r);
  };
  if (w.system.discount > 0) toggle("coupon", "Thẻ giảm giá −10%", `còn ${w.system.discount}`);
  toggle("express", `Giao hoả tốc · ${EXPRESS_MIN} phút`,
    w.system.express > 0 ? `Thần Hành Phù ×${w.system.express}` : money(EXPRESS_FEE),
    ctx.host.beforeOpen() ? `hàng đã về ${fmtHhmm(PRE_OPEN_ARRIVE_MIN)}` : "");

  const sum = el("div", "ph-card ph-sum");
  const kv = (k: string, v: string, cls = "") => {
    const r = el("div", `kv ${cls}`);
    r.append(el("span", "", k), el("b", "", v));
    sum.append(r);
  };
  kv("Tạm tính", money(q.subtotal));
  if (q.discount) kv("Thẻ giảm giá", `−${money(q.discount)}`, "good");
  if (useExpress) kv("Phí hoả tốc", q.fee ? money(q.fee) : "0₫", q.fee ? "" : "good");
  kv("Giao hàng", arriveText({ deliverDay: q.deliverDay, deliverMin: q.deliverMin }, day));
  kv("Tiền quán sau khi đặt", money(w.money.cash - q.total), q.blocked === "cash" ? "bad" : "");

  const warn = q.blocked === "cash" ? "Không đủ tiền quán."
    : q.blocked === "shipper" ? "Giờ này không có shipper. Thử lại sau."
    : q.blocked === "late" ? "Hoả tốc giao sau giờ đóng cửa."
    : q.blocked === "cold" ? `Thùng xốp hết chỗ (${fmtUnits(coldAfter(w, w.shop.cart))}/${coldCap(w)} ô).` : "";
  const dock = el("div", "ph-compose");
  if (warn) dock.append(el("div", "ph-warn", warn));
  const go = btn("ph-primary", `Đặt hàng · ${money(q.total)}`, () => {
    const o = placeOrder(w, w.shop.cart, ctx.host.minutes(), { coupon: useCoupon, express: useExpress, beforeOpen: ctx.host.beforeOpen() });
    if (!o) return;
    sfx.ui("sfx_ngan_keo");
    w.shop.cart = {};
    picked.clear();
    justOrdered = o.id;
    ctx.host.onSave();
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
  const want = Math.max(ORDER_PAGE, Number(ctx.route.id) || 0);
  const card = el("div", "ph-orders");
  for (const o of w.shop.orders.slice(0, want)) card.append(orderCard(ctx, o, day));
  sc.append(card);
  if (w.shop.orders.length > want) {
    sc.append(btn("ph-btn-text ph-more", "Xem thêm", () => ctx.go({ app: "shop", tab: "orders", id: String(want + ORDER_PAGE) }, "")));
  }
  return sc;
}

function orderCard(ctx: AppCtx, o: Order, day: number) {
  const c = el("div", "ph-order");
  const head = el("div", "hd");
  head.append(el("b", "", `Đơn #${o.id}`), el("span", "", o.day === day ? "Hôm nay" : `Ngày ${o.day}`));
  const status = el("span", `ph-st ${o.delivered ? "ok" : "go"}`, o.delivered ? "Đã giao" : `Đang giao · ${arriveText(o, day)}`);
  head.append(status);
  const lines = el("div", "ls");
  for (const l of itemsOf(o.items)) {
    const row = el("div", "li");
    const left = el("div", "nm");
    left.append(
      el("span", "", `${GOODS[l.good].label} × ${fmtUnits(l.n)} ${GOODS[l.good].unit}`),
      el("small", "", `${l.offer ? supplierById(l.offer.supplier)?.name : "đơn cũ"} · ${QUALITIES[l.tier].label.toLowerCase()}`),
    );
    row.append(left, el("b", "", money(unitPrice(l, o.day) * l.n)));
    lines.append(row);
  }
  const foot = el("div", "ft");
  foot.append(el("b", "", money(o.total)));
  if (!o.delivered) {
    foot.append(btn("ph-btn-text", "Huỷ đơn", () => {
      if (!cancelOrder(ctx.w, o.id)) return;
      ctx.host.onSave();
      ctx.go({ app: "shop", tab: "orders" }, "");
    }));
  }
  foot.append(btn("ph-btn-text", "Đặt lại", () => {
    ctx.w.shop.cart = { ...(o.items as Basket) };
    ctx.host.onSave();
    ctx.go({ app: "shop", tab: "cart" }, "");
  }));
  c.append(head, lines, foot);
  return c;
}
