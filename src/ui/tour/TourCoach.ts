// Lớp DOM để chỉ được cả phần tử DOM lẫn ô trên canvas; không nuốt chuột trừ bong bóng.
export type CoachShape = "circle" | "rect";

export type CoachAim = {
  /** Toạ độ CSS px theo khung nhìn. */
  x: number; y: number; w: number; h: number;
  shape?: CoachShape;
  text: string;
  step?: number;
  total?: number;
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
.tg-who{font-size:.72em;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#8e2a20}
.tg-text{margin:2px 0 0;font-size:.98em;line-height:1.5}
.tg-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:9px}
.tg-step{font-size:.76em;color:#8a7d64;font-variant-numeric:tabular-nums}
.tg-skip{font:inherit;font-size:.8em;padding:5px 11px;border-radius:7px;border:1px solid #b8ab8e;
  background:#fbf7ec;color:#4a4330;cursor:pointer;min-height:30px}
.tg-skip:hover{background:#efe7d3}
.tg-skip:focus-visible{outline:2px solid #8e2a20;outline-offset:2px}
`;

const GAP = 14;
const EDGE = 10;

export class TourCoach {
  private root: HTMLDivElement;
  private hole: HTMLDivElement;
  private bub: HTMLDivElement;
  private txt: HTMLParagraphElement;
  private stepEl: HTMLSpanElement;
  private last = "";
  private who!: HTMLDivElement;

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
    bar.append(this.stepEl, skip);
    col.append(who, this.txt, bar);
    this.bub.append(col);

    this.root.append(this.hole, this.bub);
    document.body.appendChild(this.root);
    this.hide();
  }

  destroy() { this.root.remove(); }

  setWho(text: string) { if (this.who.textContent !== text) this.who.textContent = text; }

  hide() {
    if (this.root.style.display === "none") return;
    this.root.style.display = "none";
    this.last = "";
  }

  pointEl(el: Element | null, text: string, step?: number, total?: number, shape: CoachShape = "rect") {
    if (!el) { this.hide(); return; }
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) { this.hide(); return; }
    this.aim({ x: r.left, y: r.top, w: r.width, h: r.height, shape, text, step, total });
  }

  /** Khoanh một ô theo toạ độ thiết kế; người gọi đã quy về toạ độ thiết kế. */
  pointDesign(canvas: HTMLCanvasElement | null, designW: number, designH: number,
    o: { x: number; y: number; w: number; h: number; shape?: CoachShape; text: string; step?: number; total?: number }) {
    if (!canvas) { this.hide(); return; }
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) { this.hide(); return; }
    const kx = r.width / designW, ky = r.height / designH;
    this.aim({
      x: r.left + o.x * kx, y: r.top + o.y * ky, w: o.w * kx, h: o.h * ky,
      shape: o.shape, text: o.text, step: o.step, total: o.total,
    });
  }

  private aim(a: CoachAim) {
    const shape = a.shape ?? "circle";
    // Chỉ ghi chữ khi đổi, không thì nút "Bỏ qua" mất focus.
    const key = `${a.text}|${a.step}|${shape}`;
    if (key !== this.last) {
      this.last = key;
      this.txt.textContent = a.text;
      this.stepEl.textContent = a.step && a.total ? `việc ${a.step}/${a.total}` : "";
    }
    this.root.style.display = "";

    const pad = shape === "circle" ? 10 : 8;
    const x = a.x - pad, y = a.y - pad, w = a.w + pad * 2, h = a.h + pad * 2;
    const s = this.hole.style;
    s.left = `${Math.round(x)}px`;
    s.top = `${Math.round(y)}px`;
    s.width = `${Math.round(w)}px`;
    s.height = `${Math.round(h)}px`;
    s.borderRadius = shape === "circle" ? "50%" : "12px";

    this.place(x, y, w, h);
  }

  /** Dưới → phải → trên → trái; phải trước trên để không đè ổ bánh khi lỗ khoét cao. */
  private place(x: number, y: number, w: number, h: number) {
    const bw = this.bub.offsetWidth, bh = this.bub.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    const midX = () => clamp(x + w / 2 - bw / 2, EDGE, vw - EDGE - bw);
    const midY = () => clamp(y + h / 2 - bh / 2, EDGE, vh - EDGE - bh);

    let bx: number, by: number;
    if (y + h + GAP + bh <= vh - EDGE) { bx = midX(); by = y + h + GAP; }
    else if (x + w + GAP + bw <= vw - EDGE) { bx = x + w + GAP; by = midY(); }
    else if (y - GAP - bh >= EDGE) { bx = midX(); by = y - GAP - bh; }
    else if (x - GAP - bw >= EDGE) { bx = x - GAP - bw; by = midY(); }
    else { bx = midX(); by = midY(); }

    this.bub.style.left = `${Math.round(bx)}px`;
    this.bub.style.top = `${Math.round(by)}px`;
  }
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}
