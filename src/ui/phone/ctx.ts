import type { SaveFile } from "../../core/save";
import { ICON, btn, el } from "./dom";

export type Route = {
  app: "home" | "msg" | "chat" | "members" | "note" | "edit" | "day" | "rev" | "sys" | "shop" | "gear" | "sell" | "ach";
  id?: string;
  day?: number;
  tab?: string;
};

export type Dir = "r" | "l" | "up" | "";

/** Những gì app cần từ bên ngoài điện thoại. */
export type Host = {
  /** Phút trong ngày của game. */
  minutes: () => number;
  /** Có đang trước giờ bán không (đơn đặt lúc này giao ngay lúc mở cửa). */
  beforeOpen: () => boolean;
  /** Đặt hàng xong và đã xem giờ hàng về — hết việc đầu của phần dẫn. */
  onOrdered?: () => void;
  onSave: () => void;
};

export type AppCtx = {
  w: SaveFile;
  host: Host;
  route: Route;
  go: (r: Route, dir?: Dir) => void;
  rerender: () => void;
  close: () => void;
};

export function page(...kids: HTMLElement[]): HTMLElement {
  const p = el("div");
  p.style.cssText = "display:flex;flex-direction:column;flex:1;min-height:0";
  p.append(...kids);
  return p;
}

export function navBar(ctx: AppCtx, o: {
  title?: string; sub?: string; back?: { label: string; to: Route }; right?: HTMLElement; onTitle?: () => void;
}): HTMLElement {
  const bar = el("div", "ph-nav");
  const l = el("div");
  if (o.back) {
    const b = btn("ph-btn-text", "", () => ctx.go(o.back!.to, "l"), `Quay lại ${o.back.label}`);
    b.innerHTML = `${ICON.back}<span>${o.back.label}</span>`;
    l.append(b);
  }
  const t = el(o.onTitle ? "button" : "div", "t");
  if (o.onTitle) { (t as HTMLButtonElement).type = "button"; t.classList.add("link"); t.onclick = o.onTitle; }
  if (o.title) t.append(document.createTextNode(o.title));
  if (o.sub) t.append(el("small", "", o.sub));
  const r = el("div", "r");
  if (o.right) r.append(o.right);
  bar.append(l, t, r);
  return bar;
}

export const scroller = (...kids: HTMLElement[]) => {
  const s = el("div", "ph-scroll");
  s.append(...kids);
  return s;
};
