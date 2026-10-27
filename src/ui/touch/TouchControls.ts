import { isTouch, onDeviceChange, viewport } from "../../core/device";
import { stickDirs, type InputState } from "../../input/intent";
import { EDGE, TOUCH_CSS, touchDims } from "./touchStyle";

export type TouchLabel = { text: string; hold: boolean; enabled: boolean };

export type CtxKind = "discard" | "lift" | "talk";
export type CtxIcon = "talk" | "lift" | "pick" | "drop";

/** Ba ô cố định: `action` và `ctx` ẩn khi không áp dụng được, vị trí các ô không đổi. */
export type TouchView = {
  visible: boolean;
  action: TouchLabel;
  run: boolean;
  ctx: { kind: CtxKind; icon: CtxIcon; text: string } | null;
};

const svg = (d: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

const RUN_ICON = svg('<path d="M2.5 17.5h19M3 17.5c0-3 .6-7.2 1.6-9.3l3 .8c1.3.4 2.6 0 3.4-.9l1.8 2.7c1.9 1.5 4.6 2.1 7 2.6 1 .2 1.7 1.2 1.7 2.2v1.9"/><path d="M11.2 10.3l1.6-1.1M12.6 11.8l1.6-1.1"/>');

const CTX_ICONS: Record<CtxIcon, string> = {
  talk: svg('<path d="M4.5 4h15a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H12l-5 4v-4H4.5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M8 10.3h.01M12 10.3h.01M16 10.3h.01" stroke-width="3"/>'),
  lift: svg('<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.3l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>'),
  pick: svg('<path d="M12 16V4M6.5 9.5 12 4l5.5 5.5M4 20.5h16"/>'),
  drop: svg('<path d="M12 3.5v12M6.5 10 12 15.5 17.5 10M4 20.5h16"/>'),
};
/** Phần bề ngang bên trái nhận ngón điều khiển. */
const ZONE_FRAC = 0.45;
/** Chừa dải trên cho nút HUD. */
const ZONE_TOP_FRAC = 0.3;
/** Dải trống hai bên canvas đủ rộng thì đặt điều khiển vào giữa dải. */
const STRIP_MIN = 200;

let cssDone = false;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, parent?: HTMLElement) {
  const e = document.createElement(tag);
  e.className = cls;
  parent?.appendChild(e);
  return e;
}

export class TouchControls {
  private root = el("div", "tc-root");
  private zone = el("div", "tc-zone", this.root);
  private base = el("div", "tc-base", this.root);
  private knob = el("div", "tc-knob", this.base);
  private act = el("button", "tc-btn tc-act", this.root);
  private runBtn = el("button", "tc-btn tc-sm", this.root);
  private ctxBtn = el("button", "tc-btn tc-sm", this.root);
  private ctxKind: CtxKind | null = null;
  private ctxDown: CtxKind | null = null;

  private stickId: number | null = null;
  private origin = { x: 0, y: 0 };
  private shown = false;
  private layoutKey = "";
  private frame = 0;
  private offDevice: () => void;
  private text = new Map<HTMLElement, string>();
  private holdResets: (() => void)[] = [];

  constructor(private input: InputState) {
    if (!cssDone) {
      cssDone = true;
      const st = document.createElement("style");
      st.textContent = TOUCH_CSS;
      document.head.appendChild(st);
    }
    document.body.appendChild(this.root);
    this.runBtn.innerHTML = `${RUN_ICON}<span class="tc-tag">Chạy</span>`;
    this.setText(this.act, "");

    this.bindStick();
    this.bindHold(this.act, (down) => {
      this.input.touchWork = down;
      if (down) this.input.fire("interact");
    });
    this.bindHold(this.runBtn, (down) => { this.input.touchRun = down; });
    this.bindHold(this.ctxBtn, (down) => {
      if (down) {
        this.ctxDown = this.ctxKind;
        if (this.ctxDown) this.input.fire(this.ctxDown);
      } else {
        this.ctxDown = null;
      }
    });

    this.offDevice = onDeviceChange(() => { this.layoutKey = ""; });
  }

  private setText(e: HTMLElement, t: string) {
    if (this.text.get(e) === t) return;
    this.text.set(e, t);
    e.textContent = t;
  }

  private setHtml(e: HTMLElement, h: string) {
    if (this.text.get(e) === h) return;
    this.text.set(e, h);
    e.innerHTML = h;
  }

  private bindHold(btn: HTMLElement, cb: (down: boolean) => void) {
    let id: number | null = null;
    const up = (e: PointerEvent) => {
      if (id !== e.pointerId) return;
      id = null;
      btn.classList.remove("on");
      cb(false);
    };
    // Nút bị ẩn giữa lúc giữ thì có thể không bao giờ nhận `pointerup`; không xoá ở đây là nút chết luôn.
    this.holdResets.push(() => { id = null; });
    btn.addEventListener("pointerdown", (e) => {
      if (id !== null && btn.hasPointerCapture(id)) return;
      e.preventDefault();
      id = e.pointerId;
      btn.setPointerCapture(e.pointerId);
      btn.classList.add("on");
      cb(true);
    });
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointercancel", up);
    btn.addEventListener("lostpointercapture", up);
  }

  private bindStick() {
    const z = this.zone;
    z.addEventListener("pointerdown", (e) => {
      if (this.stickId !== null) return;
      e.preventDefault();
      this.stickId = e.pointerId;
      z.setPointerCapture(e.pointerId);
      const r = z.getBoundingClientRect();
      const m = touchDims().stick / 2 + 4;
      this.origin = {
        x: Math.min(r.right - m, Math.max(r.left + m, e.clientX)),
        y: Math.min(r.bottom - m, Math.max(r.top + m, e.clientY)),
      };
      this.placeBase(this.origin.x, this.origin.y);
      this.base.classList.add("live");
      this.moveStick(e);
    });
    z.addEventListener("pointermove", (e) => { if (e.pointerId === this.stickId) this.moveStick(e); });
    const up = (e: PointerEvent) => { if (e.pointerId === this.stickId) this.endStick(); };
    z.addEventListener("pointerup", up);
    z.addEventListener("pointercancel", up);
    z.addEventListener("lostpointercapture", up);
  }

  private moveStick(e: PointerEvent) {
    const dx = e.clientX - this.origin.x, dy = e.clientY - this.origin.y;
    const len = Math.hypot(dx, dy);
    const rad = touchDims().stick / 2 - 8;
    const k = len > rad ? rad / len : 1;
    this.knob.style.transform = `translate(${dx * k}px,${dy * k}px)`;
    this.input.stick = stickDirs(dx, dy, rad);
  }

  private endStick() {
    this.stickId = null;
    this.input.stick = { up: false, down: false, left: false, right: false };
    this.base.classList.remove("live");
    this.knob.style.transform = "";
    this.placeIdleBase();
  }

  private placeBase(x: number, y: number) {
    this.base.style.left = `${x}px`;
    this.base.style.top = `${y}px`;
  }

  private idleSpot = { x: 0, y: 0 };
  private placeIdleBase() { this.placeBase(this.idleSpot.x, this.idleSpot.y); }

  private safe() {
    const cs = getComputedStyle(document.documentElement);
    const n = (k: string) => parseFloat(cs.getPropertyValue(k)) || 0;
    return { l: n("--safe-left"), r: n("--safe-right"), b: n("--safe-bottom") };
  }

  private layout() {
    const { w, h } = viewport();
    const canvas = document.querySelector<HTMLCanvasElement>("#game canvas");
    const cr = canvas?.getBoundingClientRect();
    const key = `${w}x${h}:${cr ? `${Math.round(cr.left)},${Math.round(cr.right)}` : ""}`;
    if (key === this.layoutKey) return;
    this.layoutKey = key;

    const s = this.safe();
    const { act, sm, stick, gap } = touchDims();
    const cl = cr ? Math.max(0, cr.left) : 0, cRight = cr ? Math.max(0, w - cr.right) : 0;
    const rightC = cRight >= STRIP_MIN ? (w - cRight / 2) - act / 2 - sm / 2 - 40 : null;
    const mr = Math.max(EDGE, s.r);
    const ml = Math.max(EDGE, s.l);
    const mb = Math.max(EDGE, s.b);
    const right = rightC === null ? mr : Math.max(mr, w - rightC - act);

    const place = (e: HTMLElement, r: number, b: number) => {
      e.style.right = `${r}px`;
      e.style.bottom = `${b}px`;
    };
    place(this.act, right, mb);
    place(this.runBtn, right + act + gap, mb + (act - sm) / 2);
    place(this.ctxBtn, right + (act - sm) / 2, mb + act + gap);

    const zoneRight = (cr ? cr.left + cr.width * ZONE_FRAC : w * ZONE_FRAC);
    const zoneTop = h * ZONE_TOP_FRAC;
    Object.assign(this.zone.style, {
      left: "0px", top: `${zoneTop}px`,
      width: `${Math.max(stick + 16, zoneRight)}px`, height: `${h - zoneTop}px`,
    });
    this.idleSpot = {
      x: (cl >= STRIP_MIN ? cl / 2 : ml + stick / 2 + 20),
      y: h - mb - stick / 2 - 20,
    };
    if (this.stickId === null) this.placeIdleBase();
  }

  update(v: TouchView) {
    const on = isTouch() && v.visible;
    if (on !== this.shown) {
      this.shown = on;
      this.root.classList.toggle("on", on);
      if (!on) this.releaseAll();
      this.layoutKey = "";
    }
    if (!on) return;
    if ((this.frame++ & 15) === 0) this.layout();

    const a = v.action;
    this.setText(this.act, a.text);
    hide(this.act, !a.enabled && !this.act.classList.contains("on"));
    this.act.classList.toggle("hold", a.hold);
    hide(this.runBtn, !v.run);
    this.ctxKind = v.ctx?.kind ?? null;
    hide(this.ctxBtn, !v.ctx);
    if (v.ctx) this.setHtml(this.ctxBtn, `${CTX_ICONS[v.ctx.icon]}<span class="tc-tag">${v.ctx.text}</span>`);
  }

  private releaseAll() {
    for (const r of this.holdResets) r();
    this.stickId = null;
    this.base.classList.remove("live");
    this.knob.style.transform = "";
    for (const b of [this.act, this.runBtn, this.ctxBtn]) b.classList.remove("on");
    this.input.releaseTouch();
  }

  destroy() {
    this.offDevice();
    this.input.releaseTouch();
    this.root.remove();
  }
}

/** Ghi `hidden` cùng giá trị vẫn là một lần đổi thuộc tính, làm trình duyệt tính lại style. */
function hide(e: HTMLElement, v: boolean) {
  if (e.hidden !== v) e.hidden = v;
}
