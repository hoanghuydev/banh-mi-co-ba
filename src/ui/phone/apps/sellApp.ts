import { GOODS, stockOf, type GoodId } from "../../../sim/econ";
import { EQUIP, type EquipId } from "../../../sim/equipment";
import {
  MAX_LISTINGS, TIERS, askFor, costOf, listable, nameOf, oddsOf, post, withdraw, type Listing, type Tier,
} from "../../../sim/resell";
import { navBar, page, scroller, type AppCtx } from "../ctx";
import { ICON, btn, el, money } from "../dom";

let chosen: Tier = "THUONG";

const oddsWord = (p: number) => (p >= 0.3 ? "Dễ bán" : p >= 0.12 ? "Vừa" : "Khó bán");

function meter(p: number) {
  const m = el("div", "ph-meter");
  const f = el("i");
  f.style.width = `${Math.round(Math.min(1, p / 0.6) * 100)}%`;
  m.append(f);
  m.setAttribute("role", "img");
  m.setAttribute("aria-label", oddsWord(p));
  return m;
}

export function sellApp(ctx: AppCtx): HTMLElement {
  if (ctx.route.tab === "post" && ctx.route.id) return postPage(ctx, ctx.route.id);
  const { w } = ctx;
  const sc = scroller();

  sc.append(el("div", "ph-sec", `Đang đăng · ${w.resell.listings.length}/${MAX_LISTINGS}`));
  if (!w.resell.listings.length) sc.append(el("div", "ph-blank", "Chưa đăng gì"));
  else {
    const card = el("div", "ph-card");
    for (const l of w.resell.listings) card.append(listingRow(ctx, l));
    sc.append(card);
  }

  const items = listable(w);
  sc.append(el("div", "ph-sec", "Đồ có thể bán"));
  const full = w.resell.listings.length >= MAX_LISTINGS;
  if (!items.equip.length && !items.goods.length) sc.append(el("div", "ph-blank", "Không còn gì để bán"));
  else {
    const card = el("div", "ph-card");
    for (const id of items.equip) card.append(itemRow(ctx, `equip:${id}`, EQUIP[id as EquipId].name, money(costOf(w, "equip", id, 1)), full));
    for (const g of items.goods) {
      const d = GOODS[g as GoodId];
      const units = Math.floor(stockOf(w.inventory, g as GoodId, w.progress.dayIndex) / d.perUnit);
      card.append(itemRow(ctx, `good:${g}`, `${d.label} × ${units}`, money(costOf(w, "good", g, units)), full));
    }
    sc.append(card);
  }
  return page(navBar(ctx, { title: "Rao bán", back: { label: "Màn chính", to: { app: "home" } } }), sc);
}

function itemRow(ctx: AppCtx, key: string, name: string, price: string, full: boolean) {
  const r = btn("ph-row", "", () => ctx.go({ app: "sell", tab: "post", id: key }));
  r.disabled = full;
  const mid = el("span", "mid");
  mid.append(el("div", "nm", name), el("div", "pv", `Mua ${price}`));
  const chev = el("span", "ph-chev");
  chev.innerHTML = ICON.chev;
  r.append(mid, chev);
  return r;
}

function listingRow(ctx: AppCtx, l: Listing) {
  const day = ctx.w.progress.dayIndex;
  const r = el("div", "ph-listing");
  const top = el("div", "tp");
  top.append(el("b", "", nameOf(l)), el("span", "ask", money(l.ask)));
  const p = oddsOf(l);
  const mid = el("div", "md");
  mid.append(meter(p), el("span", "", oddsWord(p)));
  const ft = el("div", "ft");
  ft.append(el("span", "", `Còn ${Math.max(0, l.expireDay - day)} ngày`), btn("ph-btn-text", "Gỡ tin", () => {
    withdraw(ctx.w, l);
    ctx.host.onSave();
    ctx.rerender();
  }));
  r.append(top, mid, ft);
  return r;
}

function postPage(ctx: AppCtx, key: string) {
  const { w } = ctx;
  const [kind, ref] = key.split(":") as ["equip" | "good", string];
  let units = 1;
  let name: string;
  if (kind === "equip") name = EQUIP[ref as EquipId].name;
  else {
    const d = GOODS[ref as GoodId];
    units = Math.max(1, Math.floor(stockOf(w.inventory, ref as GoodId, w.progress.dayIndex) / d.perUnit));
    name = `${d.label} × ${units}`;
  }
  const cost = costOf(w, kind, ref, units);
  const head = el("div", "ph-post-h");
  head.append(el("div", "nm", name), el("div", "pv", `Giá mua ${money(cost)}`));

  const list = el("div", "ph-tiers");
  (["RE", "THUONG", "CAO"] as Tier[]).forEach((t) => {
    const p = oddsOf({ kind, ref, tier: t });
    const b = btn(`ph-tier${chosen === t ? " on" : ""}`, "", () => { chosen = t; ctx.rerender(); });
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(chosen === t));
    const l = el("div", "l");
    l.append(el("b", "", TIERS[t].label), el("span", "", oddsWord(p)), meter(p));
    b.append(l, el("div", "r", money(askFor(cost, t))));
    list.append(b);
  });

  const dock = el("div", "ph-compose");
  const go = btn("ph-primary", `Đăng tin · nhận ${money(askFor(cost, chosen))}`, () => {
    if (!post(w, kind, ref, chosen, units)) return;
    ctx.host.onSave();
    ctx.go({ app: "sell" }, "l");
  });
  dock.append(go);
  return page(
    navBar(ctx, { title: "Đăng tin", back: { label: "Rao bán", to: { app: "sell" } } }),
    scroller(head, list),
    dock,
  );
}
