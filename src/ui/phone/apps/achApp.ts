import { ACH_BY_ID, ACH_LIST, TIER_LABEL, type AchDef, type AchTier } from "../../../content/ach";
import { achGot, markSeen } from "../../../sim/ach";
import { navBar, page, scroller, type AppCtx } from "../ctx";
import { btn, el } from "../dom";
import { badgeSvg, type BadgeState } from "./achBadge";

const TIERS: AchTier[] = ["dong", "bac", "vang", "kc"];

export function achApp(ctx: AppCtx): HTMLElement {
  if (ctx.route.id) return detail(ctx, ctx.route.id);
  const got = achGot();
  const sc = scroller();
  const root = page(navBar(ctx, { title: "Danh hiệu", back: { label: "Màn chính", to: { app: "home" } } }), sc);
  markSeen();

  sc.append(el("div", "ph-sec", `Đã đạt ${Object.keys(got).length}/${ACH_LIST.length}`));
  for (const t of TIERS) {
    const list = ACH_LIST.filter((a) => a.tier === t);
    if (!list.length) continue;
    const n = list.filter((a) => a.id in got).length;
    const h = el("div", `ph-ach-h ${t}`);
    h.innerHTML = badgeSvg(t, "got", 18);
    h.append(el("b", "", TIER_LABEL[t]), el("span", "", `${n}/${list.length}`));
    const grid = el("div", "ph-ach-grid");
    for (const a of list) grid.append(cell(ctx, a, got));
    sc.append(h, grid);
  }
  return root;
}

const stateOf = (a: AchDef, got: boolean): BadgeState => (!got ? "off" : a.fail ? "fail" : "got");

function cell(ctx: AppCtx, a: AchDef, all: Record<string, number>) {
  const got = a.id in all;
  const hidden = a.hidden && !got;
  const b = btn(`ph-ach t-${a.tier}${got ? "" : " off"}`, "", () => ctx.go({ app: "ach", id: a.id }), hidden ? "Danh hiệu ẩn" : a.name);
  const ico = el("span", "bd");
  ico.innerHTML = badgeSvg(a.tier, stateOf(a, got), 52);
  if (hidden) ico.append(el("i", "q", "?"));
  b.append(ico, el("span", "nm", hidden ? "?" : a.name));
  return b;
}

function detail(ctx: AppCtx, id: string) {
  const a = ACH_BY_ID[id];
  if (!a) return achApp({ ...ctx, route: { app: "ach" } });
  const day = achGot()[id];
  const got = day !== undefined;
  const hidden = a.hidden && !got;
  const sc = scroller();
  const root = page(navBar(ctx, { back: { label: "Danh hiệu", to: { app: "ach" } } }), sc);

  const hero = el("div", `ph-ach-hero t-${a.tier}${got ? "" : " off"}`);
  const bd = el("div", "bd");
  bd.innerHTML = badgeSvg(a.tier, stateOf(a, got), 132);
  if (hidden) bd.append(el("i", "q", "?"));
  hero.append(bd, el("h2", "", hidden ? "?" : a.name));
  if (!hidden) hero.append(el("span", `ph-ach-tier ${a.tier}`, TIER_LABEL[a.tier]));
  sc.append(hero);

  const card = el("div", "ph-card ph-ach-info");
  const row = (k: string, v: string) => {
    const r = el("div", "kv");
    r.append(el("span", "", k), el("p", "", v));
    card.append(r);
  };
  if (hidden) row("Điều kiện", "Chưa rõ");
  else {
    row("Mô tả", a.desc);
    row("Điều kiện", a.cond);
  }
  if (got) row("Ngày đạt", `Ngày ${day}`);
  sc.append(card);
  return root;
}
