import { MIN_TOUCH, isTouch, onDeviceChange, viewport } from "../../core/device";
import { stickDirs, type InputState } from "../../input/intent";
import {
  ACTION_SIZE, EDGE, PILL_GAP, PILL_H, PILL_W, STICK_BASE, TOUCH_CSS,
} from "./touchStyle";

export type TouchLabel = { text: string; hold: boolean; enabled: boolean };

/** `null` = nút không áp dụng được lúc này, ẩn đi. */
export type TouchView = {
  visible: boolean;
  action: TouchLabel;
  run: boolean;
  cover: boolean;
  discard: string | null;
  lift: string | null;
  talk: string | null;
};

const STICK_RADIUS = STICK_BASE / 2 - 8;
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
  private runBtn = el("button", "tc-btn tc-pill", this.root);
  private coverBtn = el("button", "tc-btn tc-pill", this.root);
  private discardBtn = el("button", "tc-btn tc-pill", this.root);
  private liftBtn = el("button", "tc-btn tc-pill", this.root);
  private talkBtn = el("button", "tc-btn tc-pill", this.root);

  private stickId: number | null = null;
  private origin = { x: 0, y: 0 };
  private shown = false;
  private layoutKey = "";
  private frame = 0;
  private offDevice: () => void;
  private text = new Map<HTMLElement, string>();

  constructor(private input: InputState) {
    if (!cssDone) {
      cssDone = true;
      const st = document.createElement("style");
      st.textContent = TOUCH_CSS;
      document.head.appendChild(st);
    }
    document.body.appendChild(this.root);
    this.runBtn.textContent = "Chạy";
    this.coverBtn.textContent = "Che tay";
    this.setText(this.act, "");

    this.bindStick();
    this.bindHold(this.act, (down) => {
      this.input.touchWork = down;
      if (down) this.input.fire("interact");
    });
    this.bindHold(this.runBtn, (down) => { this.input.touchRun = down; });
    this.bindHold(this.coverBtn, (down) => { this.input.touchCover = down; });
    this.bindHold(this.discardBtn, (down) => { if (down) this.input.fire("discard"); });
    this.bindHold(this.liftBtn, (down) => { if (down) this.input.fire("lift"); });
    this.bindHold(this.talkBtn, (down) => { if (down) this.input.fire("talk"); });

    this.offDevice = onDeviceChange(() => { this.layoutKey = ""; });
  }

  private setText(e: HTMLElement, t: string) {
    if (this.text.get(e) === t) return;
    this.text.set(e, t);
    e.textContent = t;
  }

  private bindHold(btn: HTMLElement, cb: (down: boolean) => void) {
    let id: number | null = null;
    const up = (e: PointerEvent) => {
      if (id !== e.pointerId) return;
      id = null;
      btn.classList.remove("on");
      cb(false);
    };
    btn.addEventListener("pointerdown", (e) => {
      if (id !== null) return;
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
      const m = STICK_BASE / 2 + 4;
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
    const k = len > STICK_RADIUS ? STICK_RADIUS / len : 1;
    this.knob.style.transform = `translate(${dx * k}px,${dy * k}px)`;
    this.input.stick = stickDirs(dx, dy, STICK_RADIUS);
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
    const cl = cr ? Math.max(0, cr.left) : 0, cRight = cr ? Math.max(0, w - cr.right) : 0;
    const rightC = cRight >= STRIP_MIN ? (w - cRight / 2) - ACTION_SIZE / 2 - PILL_W / 2 - 40 : null;
    const mr = Math.max(EDGE, s.r);
    const ml = Math.max(EDGE, s.l);
    const mb = Math.max(EDGE, s.b);
    const right = rightC === null ? mr : Math.max(mr, w - rightC - ACTION_SIZE);

    const place = (e: HTMLElement, r: number, b: number) => {
      e.style.right = `${r}px`;
      e.style.bottom = `${b}px`;
    };
    place(this.act, right, mb);
    const pillGap = PILL_GAP;
    const colA = right;
    const colB = right + ACTION_SIZE + 12;
    const rowH = Math.max(PILL_H, MIN_TOUCH + 4) + pillGap;
    const aBase = mb + ACTION_SIZE + 10;
    place(this.coverBtn, colA, aBase);
    place(this.discardBtn, colA, aBase + rowH);
    place(this.liftBtn, colA, aBase + rowH * 2);
    place(this.runBtn, colB, mb + (ACTION_SIZE - Math.max(PILL_H, MIN_TOUCH + 4)) / 2);
    place(this.talkBtn, colB, mb + (ACTION_SIZE - Math.max(PILL_H, MIN_TOUCH + 4)) / 2 + rowH);

    const zoneRight = (cr ? cr.left + cr.width * ZONE_FRAC : w * ZONE_FRAC);
    const zoneTop = h * ZONE_TOP_FRAC;
    Object.assign(this.zone.style, {
      left: "0px", top: `${zoneTop}px`,
      width: `${Math.max(STICK_BASE + 16, zoneRight)}px`, height: `${h - zoneTop}px`,
    });
    this.idleSpot = {
      x: (cl >= STRIP_MIN ? cl / 2 : ml + STICK_BASE / 2 + 20),
      y: h - mb - STICK_BASE / 2 - 20,
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
    this.act.classList.toggle("off", !a.enabled);
    this.act.classList.toggle("hold", a.hold && a.enabled);
    this.runBtn.hidden = !v.run;
    this.coverBtn.hidden = !v.cover;
    this.show(this.discardBtn, v.discard);
    this.show(this.liftBtn, v.lift);
    this.show(this.talkBtn, v.talk);
  }

  private show(b: HTMLElement, t: string | null) {
    b.hidden = t === null;
    if (t !== null) this.setText(b, t);
  }

  private releaseAll() {
    this.stickId = null;
    this.base.classList.remove("live");
    this.knob.style.transform = "";
    for (const b of [this.act, this.runBtn, this.coverBtn]) b.classList.remove("on");
    this.input.releaseTouch();
  }

  destroy() {
    this.offDevice();
    this.input.releaseTouch();
    this.root.remove();
  }
}

