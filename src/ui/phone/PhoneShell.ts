import Phaser from "phaser";
import { PHONE_STYLE } from "./phoneStyle";
import { isTouch, onDeviceChange, viewport } from "../../core/device";
import { btn, el, svg } from "./dom";

const FRAME_W = 438;
const FRAME_H = 835;
const FRAMED_MIN_K_TOUCH = 0.85;
const FRAMED_MIN_K_PC = 0.5;

export type Dir = "r" | "l" | "up" | "";

export type ShellOpts = {
  textScale: number;
  clock: string;
  dark?: boolean;
  onHome: () => void;
  /** Esc: trả true nếu đã tự xử lý. */
  onEscape: () => boolean;
  onClose: () => void;
  /** Không cho đóng bằng Esc, Tab hay bấm nền. */
  locked?: boolean | (() => boolean);
};

const SIGNAL = svg('<rect x="2" y="13" width="3" height="5" rx="1" fill="currentColor"/><rect x="7" y="10" width="3" height="8" rx="1" fill="currentColor"/><rect x="12" y="7" width="3" height="11" rx="1" fill="currentColor"/><rect x="17" y="4" width="3" height="14" rx="1" fill="currentColor"/>', 18, 22);
const WIFI = svg('<path d="M2 9a14 14 0 0120 0M5 12.5a9.5 9.5 0 0114 0M8.3 16a5 5 0 017.4 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/>', 18, 24);
const BATTERY = '<svg width="27" height="14" viewBox="0 0 27 14" aria-hidden="true"><rect x="1" y="1" width="22" height="12" rx="3.5" stroke="currentColor" stroke-width="1.4" opacity=".5" fill="none"/><rect x="3" y="3" width="16" height="8" rx="2" fill="currentColor"/><rect x="24.5" y="5" width="2" height="4" rx="1" fill="currentColor" opacity=".5"/></svg>';

/** Khung máy + màn hình; app dựng ruột qua `show()`. */
export class PhoneShell {
  readonly root: HTMLDivElement;
  private screen: HTMLDivElement;
  private view: HTMLDivElement | null = null;
  private fit: HTMLDivElement;
  private stage: HTMLDivElement;
  private status: HTMLDivElement;
  private prevKbd: boolean | null = null;
  private closed = false;

  private onKey = (ev: KeyboardEvent) => {
    const typing = ev.target instanceof HTMLTextAreaElement || ev.target instanceof HTMLInputElement;
    if (ev.code === "Escape") {
      ev.preventDefault();
      ev.stopPropagation();
      if (typing) (ev.target as HTMLElement).blur();
      else if (!this.opts.onEscape() && !this.isLocked()) this.close();
      return;
    }
    if (ev.code === "Tab" && !typing) {
      ev.preventDefault();
      ev.stopPropagation();
      if (!this.isLocked()) this.close();
      return;
    }
    if (ev.code === "KeyP" || ev.code === "F12") return;
    if (!typing && !ev.ctrlKey && !ev.metaKey && !ev.altKey) ev.stopPropagation();
  };

  private isLocked() {
    const l = this.opts.locked;
    return typeof l === "function" ? l() : !!l;
  }

  private offDevice: () => void;

  constructor(private game: Phaser.Game | null, private opts: ShellOpts) {
    if (!document.getElementById("ph-style")) {
      const st = document.createElement("style");
      st.id = "ph-style";
      st.textContent = PHONE_STYLE;
      document.head.appendChild(st);
    }
    this.root = el("div", "ph-root");
    this.root.setAttribute("role", "dialog");
    this.root.setAttribute("aria-label", "Điện thoại");
    this.fit = el("div", "ph-fit");
    this.stage = el("div", "ph-stage");
    this.screen = el("div", "ph-screen");
    this.status = el("div", "ph-status");
    this.status.append(el("span", "", opts.clock));
    const right = el("span", "r");
    right.innerHTML = `${SIGNAL}${WIFI}${BATTERY}`;
    const x = btn("ph-x", "", () => this.close(), "Đóng điện thoại");
    x.innerHTML = svg('<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>', 24);
    this.status.append(right, x);
    const frame = el("img", "ph-frame");
    frame.src = "art/phone.webp";
    frame.alt = "";
    frame.draggable = false;
    this.screen.append(this.status);
    this.stage.append(this.screen, frame);
    this.fit.append(this.stage);
    this.root.append(this.fit);
    this.root.addEventListener("pointerdown", (e) => { if (e.target === this.root && !this.isLocked()) this.close(); });
    document.body.appendChild(this.root);
    window.addEventListener("keydown", this.onKey, true);
    this.offDevice = onDeviceChange(() => this.layout());
    if (this.game?.input.keyboard) {
      this.prevKbd = this.game.input.keyboard.enabled;
      this.game.input.keyboard.enabled = false;
    }
    this.layout();
  }

  private layout() {
    const { w, h } = viewport();
    const vv = window.visualViewport;
    this.root.style.top = `${Math.round(vv?.offsetTop ?? 0)}px`;
    this.root.style.bottom = "auto";
    this.root.style.height = `${h}px`;
    const fit = Math.min((h - 28) / FRAME_H, (w - 16) / FRAME_W);
    const framed = fit >= (isTouch() ? FRAMED_MIN_K_TOUCH : FRAMED_MIN_K_PC);
    const set = (a: string, on: boolean) => (on ? this.root.setAttribute(a, "") : this.root.removeAttribute(a));
    set("data-compact", !framed);
    set("data-card", !framed && w >= 500);
    set("data-short", !framed && h < 520);
    if (framed) {
      const k = Math.min(1.1, fit);
      this.root.style.setProperty("--k", String(k));
      this.root.style.setProperty("--fmin", `${14 / k}px`);
      this.root.style.setProperty("--tmin", `${44 / k}px`);
      this.fit.style.width = `${FRAME_W * k}px`;
      this.fit.style.height = `${FRAME_H * k}px`;
    } else {
      this.root.style.setProperty("--k", "1");
      this.root.style.setProperty("--fmin", "14px");
      this.root.style.setProperty("--tmin", "44px");
      this.fit.style.width = "";
      this.fit.style.height = "";
    }
  }

  setClock(text: string) {
    (this.status.firstElementChild as HTMLElement).textContent = text;
  }

  setDark(dark: boolean) {
    this.screen.classList.toggle("ph-dark", dark);
  }

  setTheme(cls: string) {
    this.screen.classList.remove("ph-home", "ph-sysbg");
    if (cls) this.screen.classList.add(cls);
    this.screen.classList.toggle("ph-dark", cls === "ph-home" || cls === "ph-sysbg");
  }

  /** Thay ruột màn hình; thanh vuốt về nhà luôn ở đáy. */
  show(content: HTMLElement, dir: Dir = "") {
    const keep = dir ? [] : this.scrollPos();
    this.view?.remove();
    const v = el("div", "ph-view");
    v.style.fontSize = `max(calc(var(--fmin) * 1.08), ${Math.round(15 * Math.min(this.opts.textScale, 1.4))}px)`;
    if (dir) v.classList.add(`in-${dir}`);
    v.append(content);
    content.style.cssText += "flex:1;min-height:0;display:flex;flex-direction:column";
    this.screen.insertBefore(v, this.screen.querySelector(".ph-bar"));
    if (!this.screen.querySelector(".ph-bar")) {
      const bar = el("div", "ph-bar");
      bar.append(btn("", "", () => this.opts.onHome(), "Về màn hình chính"));
      this.screen.append(bar);
      this.screen.insertBefore(v, bar);
    }
    this.view = v;
    if (this.isLocked()) this.root.setAttribute("data-locked", "");
    else this.root.removeAttribute("data-locked");
    v.querySelectorAll<HTMLElement>(".ph-scroll, .ph-chips").forEach((n, i) => {
      if (keep[i]) { n.scrollTop = keep[i][0]; n.scrollLeft = keep[i][1]; }
    });
    return v;
  }

  private scrollPos(): [number, number][] {
    return [...(this.view?.querySelectorAll<HTMLElement>(".ph-scroll, .ph-chips") ?? [])].map((n) => [n.scrollTop, n.scrollLeft]);
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    window.removeEventListener("keydown", this.onKey, true);
    this.offDevice();
    this.root.remove();
    if (this.game?.input.keyboard && this.prevKbd !== null) this.game.input.keyboard.enabled = this.prevKbd;
    this.opts.onClose();
  }

  get open() { return !this.closed; }
}
