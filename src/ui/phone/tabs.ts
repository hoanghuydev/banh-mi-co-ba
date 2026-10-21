import type { AppCtx, Route } from "./ctx";
import { btn, el } from "./dom";

export type TabDef = { id: string; label: string; icon: string; count?: number };

/** Thanh tab dưới cùng của app mua sắm. */
export function tabBar(ctx: AppCtx, app: Route["app"], current: string, defs: TabDef[]): HTMLElement {
  const bar = el("nav", "ph-tabs");
  for (const d of defs) {
    const b = btn(`ph-tab${d.id === current ? " on" : ""}`, "", () => ctx.go({ app, tab: d.id }, ""), d.label);
    b.innerHTML = `${d.icon}<span>${d.label}</span>`;
    if (d.count) b.append(el("i", "ph-tab-n", String(d.count)));
    bar.append(b);
  }
  return bar;
}
