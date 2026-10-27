import {
  EQUIP, EQUIP_GROUPS, EQUIP_IDS, GROUP_IDS, capacity, has, priceVnd, used, type EquipId,
} from "../../../sim/equipment";
import { evidenceFor } from "../../../sim/gearHint";
import { gearBlock, gearCart, gearQuote, orderGear, pendingGear, toggleGear } from "../../../sim/gear";
import { navBar, page, scroller, type AppCtx } from "../ctx";
import { ICON, btn, el, money } from "../dom";
import { tabBar } from "../tabs";

type Tab = "shop" | "cart" | "orders";

let justOrdered = 0;
let useCoupon = false;

export function gearApp(ctx: AppCtx): HTMLElement {
  const tab = (ctx.route.tab as Tab) ?? "shop";
  const body = tab === "shop" ? catalog(ctx) : tab === "cart" ? cart(ctx) : orders(ctx);
  const title = tab === "shop" ? "Đồ nghề" : tab === "cart" ? "Giỏ hàng" : "Đơn hàng";
  return page(
    navBar(ctx, { title, back: { label: "Màn chính", to: { app: "home" } } }),
    body,
    tabBar(ctx, "gear", tab, [
      { id: "shop", label: "Mua sắm", icon: ICON.bagLine },
      { id: "cart", label: "Giỏ hàng", icon: ICON.cart, count: gearCart(ctx.w).length },
      { id: "orders", label: "Đơn hàng", icon: ICON.box, count: ctx.w.shop.gearOrders.filter((o) => !o.delivered).length },
    ]),
  );
}

/** Mặt xe: mỗi ô là một chỗ; đồ trong giỏ hoặc đang giao hiện thành ô sáng. */
function slots(ctx: AppCtx) {
  const e = ctx.w.equipment;
  const queued = [...pendingGear(ctx.w), ...gearCart(ctx.w)].reduce((a, id) => a + Math.max(0, EQUIP[id].slots), 0);
  const box = el("div", "ph-cartcells");
  const u = used(e);
  box.setAttribute("role", "img");
  box.setAttribute("aria-label", "chỗ trên xe");
  for (let i = 0; i < capacity(e); i++) box.append(el("span", `cell${i < u ? " used" : i < u + queued ? " pend" : ""}`));
  const card = el("div", "ph-card ph-cartcard");
  card.append(el("div", "t", "Chỗ trên xe"), box);
  return card;
}

function catalog(ctx: AppCtx) {
  const sc = scroller(slots(ctx));
  for (const g of GROUP_IDS) {
    const ids = EQUIP_IDS.filter((id) => EQUIP[id].group === g && !EQUIP[id].starting);
    if (!ids.length) continue;
    sc.append(el("div", "ph-sec", EQUIP_GROUPS[g] ?? g));
    for (const id of ids) sc.append(card(ctx, id));
  }
  const pad = el("div");
  pad.style.height = "14px";
  sc.append(pad);

  const n = gearCart(ctx.w).length;
  const wrap = el("div");
  wrap.style.cssText = "display:flex;flex-direction:column;flex:1;min-height:0";
  wrap.append(sc);
  if (n) {
    const bar = btn("ph-cartbar", "", () => ctx.go({ app: "gear", tab: "cart" }));
    bar.append(el("span", "", `${n} món trong giỏ`), el("b", "", money(gearQuote(ctx.w).subtotal)), el("span", "go", "Xem giỏ ›"));
    wrap.append(bar);
  }
  return wrap;
}

function card(ctx: AppCtx, id: EquipId) {
  const { w } = ctx;
  const d = EQUIP[id];
  const price = priceVnd(id);
  const owned = has(w.equipment, id);
  const inCart = gearCart(w).includes(id);
  const block = owned ? "đã có" : inCart ? null : gearBlock(w, id);
  const c = el("div", `ph-gear${owned ? " owned" : ""}${inCart ? " has" : ""}`);
  const top = el("div", "tp");
  top.append(el("b", "", d.name), el("span", "pr", price ? money(price) : "Miễn phí"));
  c.append(top);

  const chips = el("div", "ph-chips-s");
  if (d.slots > 0) chips.append(el("span", "", `${d.slots} chỗ`));
  if (d.slots < 0) chips.append(el("span", "", `+${-d.slots} chỗ`));
  if (d.daily_k) chips.append(el("span", "", "có phí hằng ngày"));
  if (d.replaces) chips.append(el("span", "", `thay ${EQUIP[d.replaces].name.toLowerCase()}`));
  if (chips.childElementCount) c.append(chips);

  const gain = el("ul", "gain");
  for (const g of d.gain) gain.append(el("li", "", g));
  if (gain.childElementCount) c.append(gain);
  const hint = evidenceFor(id, w);
  if (hint) c.append(el("div", "hint", hint));

  const ft = el("div", "ft");
  const label = block === "đã có" ? "Đã có" : block === "đang giao" ? "Đang giao" : inCart ? "Bỏ khỏi giỏ" : "Thêm vào giỏ";
  const b = btn(`ph-buy${inCart ? " on" : ""}`, label, () => {
    if (!toggleGear(w, id)) return;
    ctx.host.onSave();
    ctx.rerender();
  });
  b.disabled = block !== null;
  ft.append(b);
  if (block === "xe hết chỗ") ft.append(el("span", "why", "Xe hết chỗ"));
  c.append(ft);
  return c;
}

function cart(ctx: AppCtx) {
  const { w } = ctx;
  const ids = gearCart(w);
  if (!ids.length) {
    const e = el("div", "ph-empty-big");
    e.innerHTML = ICON.cartBig;
    e.append(el("b", "", "Giỏ hàng trống"));
    e.append(btn("ph-primary slim", "Xem đồ nghề", () => ctx.go({ app: "gear", tab: "shop" }, "")));
    return e;
  }
  const coupon = useCoupon && w.system.gearCoupon > 0;
  const q = gearQuote(w, coupon);
  const lines = el("div", "ph-card");
  for (const id of ids) {
    const row = el("div", "ph-line-item");
    const info = el("div", "info");
    info.append(el("div", "nm", EQUIP[id].name), el("div", "pr", priceVnd(id) ? money(priceVnd(id)) : "Miễn phí"));
    row.append(info, btn("ph-btn-text", "Bỏ", () => { toggleGear(w, id); ctx.host.onSave(); ctx.rerender(); }, `Bỏ ${EQUIP[id].name}`));
    lines.append(row);
  }
  const sum = el("div", "ph-card ph-sum");
  const kv = (k: string, v: string, cls = "") => {
    const r = el("div", `kv ${cls}`);
    r.append(el("span", "", k), el("b", "", v));
    sum.append(r);
  };
  kv("Tạm tính", money(q.subtotal));
  if (q.discount) kv("Thẻ giảm giá", `−${money(q.discount)}`, "good");
  kv("Giao hàng", "sáng mai");
  kv("Tiền quán sau khi đặt", money(w.money.cash - q.total), q.blocked === "cash" ? "bad" : "");

  const dock = el("div", "ph-compose");
  const warn = q.blocked === "cash" ? "Không đủ tiền quán." : q.blocked === "slots" ? "Xe hết chỗ cho cả giỏ này." : "";
  if (warn) dock.append(el("div", "ph-warn", warn));
  const go = btn("ph-primary", `Đặt hàng · ${money(q.total)}`, () => {
    const id = orderGear(w, coupon);
    if (!id) return;
    justOrdered = id;
    useCoupon = false;
    ctx.host.onSave();
    ctx.go({ app: "gear", tab: "orders" }, "");
  });
  go.disabled = !!q.blocked;
  dock.append(go);

  const wrap = el("div", "ph-cartwrap");
  wrap.style.cssText = "display:flex;flex-direction:column;flex:1;min-height:0";
  const opts = el("div", "ph-card");
  if (w.system.gearCoupon > 0) {
    const sw = btn(`ph-switch${coupon ? " on" : ""}`, "", () => { useCoupon = !coupon; ctx.rerender(); });
    sw.setAttribute("role", "switch");
    sw.setAttribute("aria-checked", String(coupon));
    sw.append(el("span", "lb", "Thẻ giảm giá −15%"), el("span", "ct", `còn ${w.system.gearCoupon}`), el("span", "sw"));
    opts.append(sw);
  }
  wrap.append(scroller(lines, ...(opts.childElementCount ? [opts] : []), sum), dock);
  return wrap;
}

function orders(ctx: AppCtx) {
  const { w } = ctx;
  const sc = scroller();
  if (justOrdered) {
    sc.append(el("div", "ph-flash", `Đã đặt đơn #${justOrdered}`));
    justOrdered = 0;
  }
  if (!w.shop.gearOrders.length) {
    const e = el("div", "ph-empty-big");
    e.innerHTML = ICON.boxBig;
    e.append(el("b", "", "Chưa có đơn nào"));
    sc.append(e);
    return sc;
  }
  const list = el("div", "ph-orders");
  for (const o of w.shop.gearOrders) {
    const c = el("div", "ph-order");
    const hd = el("div", "hd");
    hd.append(el("b", "", o.gift ? `Quà #${o.id}` : `Đơn #${o.id}`), el("span", "", o.day === w.progress.dayIndex ? "Hôm nay" : `Ngày ${o.day}`));
    hd.append(el("span", `ph-st ${o.delivered ? "ok" : "go"}`, o.delivered ? "Đã lắp" : "Đang giao · sáng mai"));
    const ls = el("div", "ls");
    for (const id of o.items as EquipId[]) ls.append(el("div", "", EQUIP[id].name));
    const ft = el("div", "ft");
    ft.append(el("b", "", o.gift ? "Quà từ Hệ thống" : money(o.total)));
    c.append(hd, ls, ft);
    list.append(c);
  }
  sc.append(list);
  return sc;
}
