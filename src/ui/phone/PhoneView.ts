import Phaser from "phaser";
import { sfx } from "../../audio/sfx";
import type { SaveFile } from "../../core/save";
import { fmtHhmm } from "../../core/clock";
import { WEEKDAY_VI, weekdayIdx } from "../../sim/econ";
import { totalUnread } from "../../sim/phone";
import { unseen } from "../../sim/reviews";
import { canSpin, linked } from "../../sim/system";
import { inTransit } from "../../sim/shop";
import { chatPage, membersPage, messageList } from "./apps/messageApp";
import { dayNote, noteEditor, noteList } from "./apps/noteApp";
import { reviewPage } from "./apps/reviewApp";
import { achUnseen } from "../../sim/ach";
import { achApp } from "./apps/achApp";
import { sellApp } from "./apps/sellApp";
import { gearApp } from "./apps/gearApp";
import { shopApp } from "./apps/shopApp";
import { systemApp } from "./apps/systemApp";
import { page, type AppCtx, type Dir, type Host, type Route } from "./ctx";
import { ICON, btn, el, money } from "./dom";
import { OrderTour } from "./orderTour";
import { PhoneShell } from "./PhoneShell";
import { vietsociApp } from "./apps/vietsociApp";
import { unseenPosts } from "../../sim/vietsoci";

export type { Route } from "./ctx";

export type PhoneOpts = {
  textScale: number;
  host: Host;
  route?: Route;
  onClose: () => void;
};

type AppDef = {
  key: Route["app"];
  label: string;
  icon: string;
  bg: string;
  show?: (w: SaveFile) => boolean;
  badge?: (w: SaveFile) => number;
};

const APPS: AppDef[] = [
  { key: "msg", label: "Message", icon: ICON.msg, bg: "linear-gradient(160deg,#5bd17f,#2f9e57)", badge: (w) => totalUnread(w.phone) },
  { key: "rev", label: "Đánh giá", icon: ICON.star, bg: "linear-gradient(160deg,#ffcb52,#ee9a1c)", badge: unseen },
  { key: "note", label: "Note", icon: ICON.note, bg: "linear-gradient(160deg,#ffe58a,#f2bf3a)" },
  { key: "sys", label: "Hệ thống", icon: ICON.sys, bg: "radial-gradient(circle at 30% 20%,#14485a,#04090d)", show: linked, badge: (w) => (canSpin(w) ? 1 : 0) },
  { key: "shop", label: "Thực phẩm", icon: ICON.bag, bg: "linear-gradient(160deg,#ff8a5c,#e5532b)", badge: (w) => inTransit(w).length },
  { key: "gear", label: "Đồ nghề", icon: ICON.tool, bg: "linear-gradient(160deg,#8d9aa6,#55626e)", badge: (w) => w.shop.gearOrders.filter((o) => !o.delivered).length },
  { key: "ach", label: "Danh hiệu", icon: ICON.medal, bg: "linear-gradient(160deg,#f0b04a,#b9722a)", badge: () => achUnseen() },
  { key: "vs", label: "VietSoci", icon: ICON.soci, bg: "linear-gradient(160deg,#4f7cf0,#1d4ed8)", badge: unseenPosts },
  { key: "sell", label: "Rao bán", icon: ICON.tag, bg: "linear-gradient(160deg,#4fc3d9,#2189a8)" },
];

/** Chấm đỏ trên nút điện thoại: tin nhắn, đánh giá, bài VietSoci chưa xem. */
export const phoneBadge = (w: SaveFile) => totalUnread(w.phone) + unseen(w) + unseenPosts(w);

const parentOf = (r: Route): Route | null => {
  switch (r.app) {
    case "chat": return { app: "msg" };
    case "members": return { app: "chat", id: r.id };
    case "edit": case "day": return { app: "note" };
    case "vs": return r.id ? { app: "vs" } : { app: "home" };
    case "home": return null;
    default: return { app: "home" };
  }
};

export class PhoneView {
  private shell: PhoneShell;
  private route: Route;
  private ctx: AppCtx;
  private tour: OrderTour;

  constructor(game: Phaser.Game, private w: SaveFile, private opts: PhoneOpts) {
    this.route = opts.route ?? { app: "home" };
    this.tour = new OrderTour(w, opts.textScale, () => opts.host.onOrdered?.());
    this.ctx = {
      w, host: opts.host, route: this.route,
      go: (r, d) => this.go(r, d),
      rerender: () => this.go(this.route, ""),
      close: () => this.shell.close(),
    };
    this.shell = new PhoneShell(game, {
      textScale: opts.textScale,
      clock: fmtHhmm(opts.host.minutes()),
      locked: () => w.system.stage === "new" && this.route.app === "sys",
      onHome: () => { if (!(w.system.stage === "new" && this.route.app === "sys")) this.go({ app: "home" }); },
      onEscape: () => {
        const up = parentOf(this.route);
        if (!up) return false;
        this.go(up, "l");
        return true;
      },
      onClose: () => { this.tour.destroy(); opts.host.onSave(); opts.onClose(); },
    });
    sfx.ui("ph_mo_may");
    this.go(this.route, "up");
  }

  get open() { return this.shell.open; }
  close() { this.shell.close(); }

  go(r: Route, dir: Dir = r.app === "home" ? "l" : "r") {
    if (dir && dir !== "up") sfx.ui("ui_click");
    this.route = r;
    this.ctx.route = r;
    this.shell.setClock(fmtHhmm(this.opts.host.minutes()));
    this.shell.setTheme(r.app === "home" ? "ph-home" : r.app === "sys" ? "ph-sysbg" : "");
    const c = this.ctx;
    const build = () => {
      switch (r.app) {
        case "home": return this.home();
        case "msg": return messageList(c);
        case "chat": return chatPage(c, r.id ?? "");
        case "members": return membersPage(c, r.id ?? "");
        case "note": return noteList(c);
        case "edit": return noteEditor(c, r.id);
        case "day": return dayNote(c, r.day ?? 0);
        case "rev": return reviewPage(c);
        case "sys": return systemApp(c);
        case "shop": return shopApp(c);
        case "gear": return gearApp(c);
        case "sell": return sellApp(c);
        case "ach": return achApp(c);
        case "vs": return vietsociApp(c);
      }
    };
    let body: HTMLElement;
    try {
      body = build();
    } catch (err) {
      console.error(err);
      body = r.app === "home" ? page(el("div", "ph-blank", "Điện thoại gặp lỗi")) : this.home();
    }
    this.shell.show(body, dir);
    this.tour.update(r);
  }

  private home() {
    const w = this.w;
    const d = w.progress.dayIndex;
    const wrap = el("div", "ph-scroll ph-homewrap");

    const widget = el("div", "ph-widget");
    widget.append(el("div", "shop", w.shopName));
    widget.append(el("div", "day", `Ngày ${d} · ${WEEKDAY_VI[weekdayIdx(d)]}`));
    const cash = el("div", "cash");
    cash.append(el("span", "", "Tiền quán"), el("b", "", money(w.money.cash)));
    widget.append(cash);

    const grid = el("div", "ph-grid");
    for (const a of APPS) {
      if (a.show && !a.show(w)) continue;
      const b = btn("ph-app", "", () => this.go({ app: a.key }), a.label);
      const ico = el("span", "ico");
      ico.style.background = a.bg;
      ico.innerHTML = a.icon;
      const n = a.badge?.(w) ?? 0;
      if (n) {
        const bd = el("span", "badge", n > 99 ? "99+" : String(n));
        ico.append(bd);
      }
      b.append(ico, el("span", "", a.label));
      grid.append(b);
    }
    wrap.append(widget, grid);
    return page(wrap);
  }
}
