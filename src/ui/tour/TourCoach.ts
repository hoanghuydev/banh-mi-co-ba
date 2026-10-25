// Lớp DOM để chỉ được cả phần tử DOM lẫn ô trên canvas; không nuốt chuột trừ bong bóng.
import { isTouch, onDeviceChange } from "../../core/device";

export type CoachShape = "circle" | "rect";

export type CoachAim = {
  /** Toạ độ CSS px theo khung nhìn. */
  x: number; y: number; w: number; h: number;
  shape?: CoachShape;
  text: string;
  step?: number;
  total?: number;
  /** Có thì hiện nút "Đã hiểu" gọi hàm này. */
  ok?: () => void;
  /** Bong bóng đặt ngang thì bám mép dưới lỗ thay vì giữa. */
  low?: boolean;
};

const STYLE = `
.tg-root{position:fixed;inset:0;z-index:9500;pointer-events:none;
  font-family:"Be Vietnam Pro",system-ui,sans-serif}
.tg-hole{position:absolute;border:3px solid #f5c542;box-shadow:0 0 0 9999px rgba(10,14,20,.46),0 0 18px rgba(245,197,66,.55) inset;
  transition:left .22s ease,top .22s ease,width .22s ease,height .22s ease,border-radius .22s ease}
.tg-hole.pulse{animation:tg-pulse 1.5s ease-in-out infinite}
@keyframes tg-pulse{0%,100%{border-color:#f5c542}50%{border-color:#fff3c4}}

.tg-bub{position:absolute;max-width:min(380px,76vw);display:flex;gap:11px;align-items:flex-start;
  background:#f6f2e6;color:#2b2f31;border-radius:12px;padding:12px 14px;pointer-events:auto;
  box-shadow:0 14px 34px rgba(0,0,0,.5);border-top:3px solid #8e2a20}
.tg-col{min-width:0;flex:1}
.tg-who{font-size:max(14px,.72em);font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#8e2a20}
.tg-text{margin:2px 0 0;font-size:.98em;line-height:1.5}
.tg-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:9px}
.tg-step{font-size:max(14px,.76em);color:#8a7d64;font-variant-numeric:tabular-nums}
.tg-skip{font:inherit;font-size:max(14px,.8em);padding:5px 14px;border-radius:7px;border:1px solid #b8ab8e;
  background:#fbf7ec;color:#4a4330;cursor:pointer;min-height:44px;min-width:44px}
.tg-dots{display:none;gap:4px;align-items:center}
.tg-dot{width:7px;height:7px;border-radius:50%;background:#cdbf9f}
.tg-dot.on{background:#8e2a20}
.tg-bub.strip{display:grid;grid-template-columns:auto 1fr auto;column-gap:10px;row-gap:2px;align-items:center;padding:8px 10px 8px 14px;box-sizing:border-box}
.tg-bub.strip .tg-col,.tg-bub.strip .tg-bar{display:contents}
.tg-bub.strip .tg-who{grid-column:1;grid-row:1}
.tg-bub.strip .tg-dots{display:flex;grid-column:2;grid-row:1}
.tg-bub.strip .tg-step{display:none}
.tg-bub.strip .tg-text{grid-column:1/3;grid-row:2;margin:0;font-size:max(14px,.93em);line-height:1.3}
.tg-bub.strip .tg-skip{grid-column:3;grid-row:1/3;padding:0 12px}
@media (hover:hover){.tg-skip:hover{background:#efe7d3}}
.tg-skip:focus-visible{outline:2px solid #8e2a20;outline-offset:2px}
.tg-btns{display:flex;gap:8px}
.tg-ok{font:inherit;font-size:max(14px,.8em);font-weight:700;padding:5px 13px;border-radius:7px;border:1px solid #8e2a20;
  background:#8e2a20;color:#fff7e6;cursor:pointer;min-height:44px;min-width:44px}
@media (hover:hover){.tg-ok:hover{background:#a63427}}
.tg-bub.strip .tg-btns{grid-column:3;grid-row:1/3}
.tg-ok:focus-visible{outline:2px solid #2b2f31;outline-offset:2px}
`;

const GAP = 14;
const EDGE = 10;
const AVOID_PAD = 8;

/** Vùng nút và cần cảm ứng đang hiện, toạ độ CSS px theo khung nhìn. */
function touchRects(): DOMRect[] {
  return [...document.querySelectorAll<HTMLElement>(".tc-root.on .tc-btn:not([hidden]), .tc-root.on .tc-base")]
    .map((e) => e.getBoundingClientRect());
}

export class TourCoach {
  private root: HTMLDivElement;
  private hole: HTMLDivElement;
  private bub: HTMLDivElement;
  private txt: HTMLParagraphElement;
  private stepEl: HTMLSpanElement;
  private dots: HTMLDivElement;
  private dotCount = 0;
  private last = "";
  private who!: HTMLDivElement;
  private okBtn: HTMLButtonElement;
  private onOk: (() => void) | null = null;
  private lastAim: CoachAim | null = null;
  private offDevice: () => void;

  constructor(opts: { textScale?: number; onSkip: () => void }) {
    if (!document.getElementById("tg-style")) {
      const st = document.createElement("style");
      st.id = "tg-style";
      st.textContent = STYLE;
      document.head.appendChild(st);
    }
    this.root = document.createElement("div");
    this.root.className = "tg-root";
    this.root.style.fontSize = `${Math.round(15 * (opts.textScale ?? 1))}px`;

    this.hole = document.createElement("div");
    this.hole.className = "tg-hole pulse";

    this.bub = document.createElement("div");
    this.bub.className = "tg-bub";
    const col = document.createElement("div");
    col.className = "tg-col";
    const who = document.createElement("div");
    who.className = "tg-who";
    who.textContent = "Hướng dẫn";
    this.who = who;
    this.txt = document.createElement("p");
    this.txt.className = "tg-text";
    const bar = document.createElement("div");
    bar.className = "tg-bar";
    this.stepEl = document.createElement("span");
    this.stepEl.className = "tg-step";
    const skip = document.createElement("button");
    skip.className = "tg-skip";
    skip.textContent = "Bỏ qua";
    skip.onclick = () => { this.hide(); opts.onSkip(); };
    this.okBtn = document.createElement("button");
    this.okBtn.className = "tg-ok";
    this.okBtn.textContent = "Đã hiểu";
    this.okBtn.onclick = () => this.onOk?.();
    const btns = document.createElement("div");
    btns.className = "tg-btns";
    btns.append(skip, this.okBtn);
    this.dots = document.createElement("div");
    this.dots.className = "tg-dots";
    bar.append(this.stepEl, this.dots, btns);
    col.append(who, this.txt, bar);
    this.bub.append(col);

    this.root.append(this.hole, this.bub);
    document.body.appendChild(this.root);
    this.hide();
    this.offDevice = onDeviceChange(() => { if (this.lastAim && this.root.style.display !== "none") this.aim(this.lastAim); });
  }

  destroy() {
    this.offDevice();
    this.root.remove();
  }

  setWho(text: string) { if (this.who.textContent !== text) this.who.textContent = text; }

  hide() {
    if (this.root.style.display === "none") return;
    this.root.style.display = "none";
    this.last = "";
  }

  pointEl(el: Element | null, text: string, step?: number, total?: number, shape: CoachShape = "rect", low = false) {
    if (!el) { this.hide(); return; }
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) { this.hide(); return; }
    this.aim({ x: r.left, y: r.top, w: r.width, h: r.height, shape, text, step, total, low });
  }

  /** Khoanh một ô theo toạ độ thiết kế; người gọi đã quy về toạ độ thiết kế. */
  pointDesign(canvas: HTMLCanvasElement | null, designW: number, designH: number,
    o: { x: number; y: number; w: number; h: number; shape?: CoachShape; text: string; step?: number; total?: number; ok?: () => void }) {
    if (!canvas) { this.hide(); return; }
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) { this.hide(); return; }
    const kx = r.width / designW, ky = r.height / designH;
    this.aim({
      x: r.left + o.x * kx, y: r.top + o.y * ky, w: o.w * kx, h: o.h * ky,
      shape: o.shape, text: o.text, step: o.step, total: o.total, ok: o.ok,
    });
  }

  private aim(a: CoachAim) {
    this.lastAim = a;
    const shape = a.shape ?? "circle";
    // Chỉ ghi chữ khi đổi, không thì nút "Bỏ qua" mất focus.
    const key = `${a.text}|${a.step}|${shape}|${!!a.ok}`;
    this.onOk = a.ok ?? null;
    if (key !== this.last) {
      this.last = key;
      this.txt.textContent = a.text;
      this.okBtn.style.display = a.ok ? "" : "none";
      this.stepEl.textContent = a.step && a.total ? `việc ${a.step}/${a.total}` : "";
      this.paintDots(a.step ?? 0, a.total ?? 0);
    }
    this.bub.classList.toggle("strip", isTouch());
    this.root.style.display = "";

    const pad = shape === "circle" ? 10 : 8;
    const x = a.x - pad, y = a.y - pad, w = a.w + pad * 2, h = a.h + pad * 2;
    const s = this.hole.style;
    s.left = `${Math.round(x)}px`;
    s.top = `${Math.round(y)}px`;
    s.width = `${Math.round(w)}px`;
    s.height = `${Math.round(h)}px`;
    s.borderRadius = shape === "circle" ? "50%" : "12px";

    this.place(x, y, w, h, !!a.low);
  }

  private paintDots(step: number, total: number) {
    if (total !== this.dotCount) {
      this.dotCount = total;
      this.dots.replaceChildren(...Array.from({ length: total }, () => {
        const d = document.createElement("i");
        d.className = "tg-dot";
        return d;
      }));
    }
    [...this.dots.children].forEach((d, i) => d.classList.toggle("on", i < step));
  }

  /** Dải gọn: trên giữa, giữa ô ngày giờ và cột nút; lọt vào ô được chỉ thì xuống dưới. */
  private placeStrip(x: number, y: number, w: number, h: number) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const left = 190, right = 170;
    const bw = Math.min(560, vw - left - right);
    this.bub.style.width = `${bw}px`;
    const bh = this.bub.offsetHeight;
    const bx = (vw - bw) / 2 + (left - right) / 2;
    const top = EDGE, bottom = vh - EDGE - bh;
    const hit = (by: number) => bx < x + w + AVOID_PAD && bx + bw > x - AVOID_PAD && by < y + h + AVOID_PAD && by + bh > y - AVOID_PAD;
    const by = hit(top) && !hit(bottom) ? bottom : top;
    this.bub.style.left = `${Math.round(bx)}px`;
    this.bub.style.top = `${Math.round(by)}px`;
  }

  /** Dưới → phải → trên → trái; bỏ vị trí đè lên nút cảm ứng, hết chỗ thì lấy vị trí đầu tiên lọt khung. */
  private place(x: number, y: number, w: number, h: number, low: boolean) {
    if (isTouch()) { this.placeStrip(x, y, w, h); return; }
    this.bub.style.width = "";
    const bw = this.bub.offsetWidth, bh = this.bub.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    const midX = () => clamp(x + w / 2 - bw / 2, EDGE, vw - EDGE - bw);
    const midY = () => clamp(low ? y + h - bh : y + h / 2 - bh / 2, EDGE, vh - EDGE - bh);
    const avoid = touchRects();
    const hits = (bx: number, by: number) => avoid.some((r) =>
      bx < r.right + AVOID_PAD && bx + bw > r.left - AVOID_PAD && by < r.bottom + AVOID_PAD && by + bh > r.top - AVOID_PAD);

    const below = y + h + GAP + bh <= vh - EDGE ? { bx: midX(), by: y + h + GAP } : null;
    const right = x + w + GAP + bw <= vw - EDGE ? { bx: x + w + GAP, by: midY() } : null;
    const above = y - GAP - bh >= EDGE ? { bx: midX(), by: y - GAP - bh } : null;
    const left = x - GAP - bw >= EDGE ? { bx: x - GAP - bw, by: midY() } : null;
    const options = [below, right, above, left].filter((o): o is { bx: number; by: number } => !!o);
    const pick = options.find((o) => !hits(o.bx, o.by)) ?? options[0] ?? { bx: midX(), by: midY() };

    this.bub.style.left = `${Math.round(pick.bx)}px`;
    this.bub.style.top = `${Math.round(pick.by)}px`;
  }
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}
