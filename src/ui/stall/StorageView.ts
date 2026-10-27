import type Phaser from "phaser";
import { GOODS, QUALITIES, type GoodId, type InventoryState } from "../../sim/econ";
import { fmtUnits } from "../../sim/day";
import { coldUsage, freshnessOf, moveStack, stacksOf, useRank, type Freshness, type Stack } from "../../sim/stock";
import { CLAY_CSS } from "../clayCss";
import { hint, isPhone, isTouch } from "../../core/device";
import { TourCoach } from "../tour/TourCoach";
import { guardStrayClick } from "../tapGuard";

const STYLE = `
.sv-root{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;padding:max(18px,var(--safe-top)) max(18px,var(--safe-right)) max(18px,var(--safe-bottom)) max(18px,var(--safe-left));box-sizing:border-box;background:rgba(12,15,18,.74);font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#f7f1e2}
.sv-card{box-sizing:border-box;--fresh:#4fbf73;--aging:#ecb93a;--last:#e2563f;display:flex;flex-direction:column;gap:14px;width:min(820px,100%);max-height:100%;min-height:0;padding:16px 18px 18px;background:rgba(42,32,24,.92);box-shadow:0 16px 44px rgba(0,0,0,.5)}
.sv-card.tu{background:rgba(30,40,48,.92);border-color:rgba(190,220,235,.25)}
.sv-head{display:flex;align-items:center;gap:14px}
.sv-head img{height:52px;width:auto;flex:none;filter:drop-shadow(0 3px 3px rgba(0,0,0,.4))}
.sv-ten{font-weight:700;font-size:1.3em;line-height:1.2;flex:1;min-width:0}
.sv-cold{display:flex;align-items:center;gap:9px;flex:0 1 250px;font-variant-numeric:tabular-nums;font-size:.92em}
.sv-cold svg{flex:none;width:18px;height:18px;color:#9fdcf0}
.sv-meter{position:relative;flex:1;height:12px;border-radius:6px;background:rgba(0,0,0,.4);overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.5)}
.sv-meter i{position:absolute;inset:0 auto 0 0;border-radius:6px;background:var(--fresh)}
.sv-meter.nang i{background:var(--aging)}
.sv-meter.day i{background:var(--last)}
.sv-body{display:flex;gap:16px;align-items:stretch;min-height:0;flex:1}
.sv-grid{flex:1 1 auto;min-width:0;overflow:auto;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;align-content:start;grid-auto-rows:max-content;padding:10px;border-radius:10px;background:rgba(0,0,0,.28);box-shadow:inset 0 2px 6px rgba(0,0,0,.45)}
.sv-cell{position:relative;aspect-ratio:1;padding:0;min-height:0;border-radius:.8em;overflow:visible;
  box-shadow:0 4px 0 #b9a47a,0 6px 4px -2px rgba(60,28,10,.45),inset 0 2px 1px rgba(255,255,255,.9),inset 0 -4px 6px rgba(0,0,0,.1)}
.sv-cell::before{left:.35em;right:.35em;top:.18em;height:30%;border-radius:.6em .6em 1em 1em}
@media (hover:hover){.sv-cell:hover{transform:translateY(-1px)}}
.sv-cell.on{transform:none;box-shadow:0 0 0 3px #ffd96a,0 4px 0 #b9a47a,0 6px 8px rgba(255,217,106,.4),inset 0 2px 1px rgba(255,255,255,.9),inset 0 -4px 6px rgba(0,0,0,.1)}
.sv-cell:active{transform:translateY(3px);box-shadow:0 1px 0 #b9a47a,inset 0 3px 6px rgba(0,0,0,.22)}
.sv-cell.rong{border:0;background:rgba(0,0,0,.22);box-shadow:inset 0 2px 4px rgba(0,0,0,.5),0 1px 0 rgba(255,255,255,.06);cursor:default}
.sv-cell.rong::before{display:none}
.sv-cell:focus-visible{outline:2px solid #fff2c6;outline-offset:3px}
.sv-cell .ic{position:absolute;inset:8% 8% 26% 8%;width:84%;height:66%;object-fit:contain;filter:drop-shadow(0 2px 2px rgba(60,30,10,.4))}
.sv-cell .n{position:absolute;right:6px;bottom:13px;font-weight:800;font-size:max(14px,.82em);font-variant-numeric:tabular-nums;color:#2a2420;text-shadow:0 1px 0 #fff,0 0 3px #fffaf0}
.sv-cell .bar{position:absolute;left:7px;right:7px;bottom:6px;height:6px;border-radius:3px;background:rgba(80,55,25,.4);overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.35)}
.sv-cell .bar i,.sv-det .bar i{display:block;height:100%;border-radius:3px;background:var(--fresh)}
.sv-cell .bar.aging i,.sv-det .bar.aging i{background:var(--aging)}
.sv-cell .bar.last i,.sv-det .bar.last i{background:var(--last)}
.sv-cell .tag{position:absolute;left:4px;top:3px;font-size:max(14px,.78em);font-weight:700;line-height:1;color:#c98a00;text-shadow:0 1px 0 #fff}
.sv-cell .tag.bad{color:#c0392b}
.sv-cell:not(.rong){touch-action:none;cursor:grab}
.sv-cell.keo{opacity:.35}
.sv-cell.dich{box-shadow:0 0 0 3px #fff2c6,0 0 0 6px rgba(255,217,106,.55),0 4px 0 #b9a47a}
.sv-ghost{position:fixed;z-index:9600;pointer-events:none;margin:0;transform:scale(1.08) rotate(-3deg);opacity:.92;cursor:grabbing;filter:drop-shadow(0 8px 10px rgba(0,0,0,.5))}
.sv-cell .alert{position:absolute;right:4px;top:4px;width:20px;height:20px;border-radius:50%;background:var(--last);color:#fff;font-weight:700;font-size:14px;line-height:20px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.6)}

.sv-det{flex:0 0 230px;display:flex;flex-direction:column;gap:11px;padding:14px;border-radius:10px;background:rgba(0,0,0,.28);box-shadow:inset 0 2px 6px rgba(0,0,0,.45)}
.sv-det .pic{align-self:center;display:flex;align-items:center;justify-content:center;width:110px;height:110px;border-radius:10px;background:#cfc6ae;box-shadow:inset 0 3px 5px rgba(60,50,30,.45),0 2px 0 rgba(255,255,255,.12)}
.sv-det .pic img,.sv-det .pic svg{width:84%;height:84%;object-fit:contain}
.sv-det .nm{font-weight:700;font-size:1.12em;line-height:1.25;text-align:center}
.sv-det .chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.sv-det .chip{padding:2px 10px;border-radius:12px;font-size:max(14px,.82em);font-weight:600;background:rgba(255,255,255,.12)}
.sv-det .chip.ngon{background:rgba(255,217,106,.22);color:#ffe9a6}
.sv-det .chip.ban{background:rgba(226,86,63,.25);color:#ffb4a8}
.sv-det .row{display:flex;justify-content:space-between;gap:8px;font-size:.92em;font-variant-numeric:tabular-nums}
.sv-det .row span:first-child{color:#aebdc4}
.sv-det .row b{font-weight:700}
.sv-det .bar{height:10px;border-radius:5px;background:rgba(0,0,0,.5);overflow:hidden}
.sv-det .han{font-weight:700;text-align:center;color:var(--fresh)}
.sv-det .han.aging{color:var(--aging)}
.sv-det .han.last{color:var(--last)}

.sv-foot{display:flex;justify-content:flex-end}
.sv-btn{font-size:1em;min-width:7em;min-height:max(44px,2.6em)}
.sv-btn:focus-visible{outline:2px solid #fff2c6;outline-offset:3px}

.sv-x{display:none}
.sv-root.t{justify-content:flex-end;align-items:stretch;padding:0;background:rgba(12,15,18,.4)}
.sv-root.t .sv-card{display:flex;flex-direction:column;position:relative;width:max(45vw,340px);max-height:none;height:100%;gap:8px;padding:max(8px,var(--safe-top)) max(10px,var(--safe-right)) max(8px,var(--safe-bottom)) 12px;border-radius:18px 0 0 18px}
.sv-root.t .sv-head{display:grid;grid-template-columns:auto minmax(0,1fr);gap:2px 10px;align-items:center;padding-right:52px}
.sv-root.t .sv-head img{grid-row:span 2;height:40px}
.sv-root.t .sv-ten{font-size:1.1em}
.sv-root.t .sv-cold{flex:none;font-size:max(14px,.9em)}
.sv-root.t .sv-x{display:flex;align-items:center;justify-content:center;position:absolute;top:max(6px,var(--safe-top));right:max(8px,var(--safe-right));width:44px;height:44px;padding:0;min-height:0;border-radius:50%;font:inherit;font-size:1.5em;line-height:1}
.sv-root.t .sv-foot{display:none}
.sv-root.t .sv-body{flex-direction:column;gap:8px;overflow:auto}
.sv-root.t .sv-grid{flex:0 0 auto;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding:8px;overflow:visible}
.sv-root.t .sv-cell{aspect-ratio:1.1}
.sv-root.t .sv-det{flex:0 0 auto;display:flex;flex-direction:row;flex-wrap:wrap;align-content:flex-start;align-items:center;gap:4px 10px;padding:8px 10px;overflow:visible}
.sv-root.t .sv-det .pic{display:none}
.sv-root.t .sv-det .row,.sv-root.t .sv-det .bar,.sv-root.t .sv-det .han{flex:1 1 100%;text-align:left}
.sv-root.t .sv-det .han{flex:1 1 auto}
@media (max-height:400px){.sv-root.t .sv-cell{aspect-ratio:1.35}.sv-root.t .sv-head img{height:34px}}
html[data-phone="1"] .sv-root.t .sv-card{width:min(58vw,560px);height:auto;max-height:100%;align-self:flex-start;padding-right:max(18px,var(--safe-right));border-radius:0 0 0 18px}
html[data-phone="1"] .sv-root.t .sv-x{width:36px;height:36px;font-size:1.2em}
html[data-phone="1"] .sv-root.t .sv-head{padding-right:42px}
html[data-phone="1"] .sv-root.t .sv-body{flex-direction:row;align-items:flex-start;overflow:hidden;flex:0 1 auto;min-height:0}
html[data-phone="1"] .sv-root.t .sv-grid{flex:1 1 auto;max-height:100%;overflow:auto}
html[data-phone="1"] .sv-root.t .sv-det{flex:0 0 150px;max-height:100%;overflow:auto;flex-direction:column;flex-wrap:nowrap;align-items:stretch;gap:5px}
html[data-phone="1"] .sv-root.t .sv-det>*{flex:0 0 auto}
html[data-phone="1"] .sv-root.t .sv-det .nm{text-align:left}
html[data-phone="1"] .sv-root.t .sv-det .chips{justify-content:flex-start}
html[data-phone="1"] .sv-root.t :is(.sv-cold,.sv-det .chip,.sv-det .row,.sv-cell .n){font-size:max(12px,.9em)}

@media (max-width:700px){
  .sv-body{flex-direction:column;overflow:auto}
  .sv-grid{flex:0 0 auto;grid-template-columns:repeat(4,minmax(0,1fr))}
  .sv-det{flex:0 0 auto;flex-direction:row;flex-wrap:wrap;align-items:center}
  .sv-det .pic{width:72px;height:72px}
  .sv-det .bar,.sv-det .han{flex:1 1 100%}
  .sv-head{flex-wrap:wrap}
  .sv-cold{flex:1 1 100%}
}
@media (max-height:600px){
  .sv-root{padding:max(8px,var(--safe-top)) max(8px,var(--safe-right)) max(8px,var(--safe-bottom)) max(8px,var(--safe-left))}
  .sv-card{gap:8px;padding:10px 12px 12px}
  .sv-head img{height:38px}
}
@media (max-height:500px){
  .sv-card{height:100%;display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"head foot" "body body";grid-template-rows:auto minmax(0,1fr);gap:8px 12px}
  .sv-head{grid-area:head}
  .sv-foot{grid-area:foot;align-self:center}
  .sv-body{grid-area:body;min-height:0;overflow:hidden}
  .sv-grid{grid-template-columns:repeat(6,minmax(0,1fr));padding:8px;gap:6px}
  .sv-det{flex:0 0 200px;gap:6px;padding:10px;overflow:auto}
  .sv-det .pic{width:56px;height:56px}
}
`;

const COLS = 5;
const TOUCH_COLS = 4;
const MIN_CELLS = 20;

const SNOW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5"/></svg>`;

const ICON: Record<GoodId, string> = {
  BANH: "held_loaf_cold", PATE: "ing_pate", THIT_NGUOI: "ing_thit", CHA_LUA: "ing_chalua", XIU_MAI: "ing_xiumai", SOT: "kho_tuongot",
  TRUNG: "ing_opla", RAU: "kho_rau", OT: "kho_ot", DO_CHUA_NL: "kho_dochua", DO_CHUA_SAN: "kho_dochua",
};

export type StorageViewOpts = {
  textScale: number;
  day: number;
  inventory: InventoryState;
  title: string;
  fridge: boolean;
  /** Lần đầu mở kho: chỉ cách xem chi tiết và kéo thả. */
  guide: boolean;
  onGuideDone: () => void;
  onClose: () => void;
};

const DRAG_PX = 8;

type Drag = { from: number; id: number; x: number; y: number; to: number; ghost: HTMLElement | null };

export class StorageView {
  private root: HTMLDivElement;
  private stacks: Stack[];
  private sel = 0;
  private cells: HTMLButtonElement[] = [];
  private touch = isTouch();
  private cols = this.touch ? TOUCH_COLS : COLS;
  private det!: HTMLDivElement;
  private gridEl!: HTMLDivElement;
  private drag: Drag | null = null;
  private dropped = false;
  private coach: TourCoach | null = null;
  private keyGuard = (ev: KeyboardEvent) => {
    if (ev.code === "Escape" || ev.code === "KeyE") { ev.preventDefault(); this.close(); return; }
    if (ev.code === "KeyP") return;
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -this.cols, ArrowDown: this.cols, KeyA: -1, KeyD: 1, KeyW: -this.cols, KeyS: this.cols }[ev.code];
    if (step) {
      ev.preventDefault();
      const to = this.sel + step;
      if (to >= 0 && to < this.stacks.length) this.select(to, true);
    }
    ev.stopPropagation();
  };

  constructor(private game: Phaser.Game, private opts: StorageViewOpts) {
    if (!document.getElementById("sv-style")) {
      const st = document.createElement("style");
      st.id = "sv-style";
      st.textContent = CLAY_CSS + STYLE;
      document.head.appendChild(st);
    }
    this.stacks = stacksOf(opts.inventory, opts.day);
    this.root = this.el("div", this.touch ? "sv-root t" : "sv-root");
    this.root.style.fontSize = `${Math.round((isPhone() ? 13 : 16) * opts.textScale)}px`;
    this.root.addEventListener("keydown", this.keyGuard, true);
    this.root.addEventListener("keyup", (e) => { if (e.code !== "KeyP") e.stopPropagation(); }, true);
    this.root.addEventListener("pointerdown", (e) => { if (e.target === this.root) this.close(); });
    this.root.addEventListener("pointermove", (e) => this.dragMove(e));
    this.root.addEventListener("pointerup", (e) => this.dragEnd(e, true));
    this.root.addEventListener("pointercancel", (e) => this.dragEnd(e, false));
    guardStrayClick(this.root);
    this.root.appendChild(this.card());
    document.body.appendChild(this.root);
    if (this.game.input.keyboard) this.game.input.keyboard.enabled = false;
    (this.cells[0] ?? this.root.querySelector<HTMLButtonElement>(".sv-btn"))?.focus({ preventScroll: true });
    if (opts.guide && this.stacks.length) this.startGuide();
  }

  private startGuide() {
    const done = () => { this.coach?.destroy(); this.coach = null; this.opts.onGuideDone(); };
    this.coach = new TourCoach({ textScale: this.opts.textScale, onSkip: done });
    const tap = hint("Bấm", "Chạm");
    const phone = isPhone();
    const steps = [
      {
        el: () => (phone ? this.det.parentElement : this.det),
        text: `${tap} vào một ô để xem chi tiết: độ ngon và hạn dùng. Dấu ★: hàng ngon. Dấu ▼: hàng dỏm. Dấu !: phải dùng hết hôm nay.`,
      },
      {
        el: () => this.gridEl,
        text: "Kéo thả ô để đổi thứ tự. Cùng loại, ô đứng trước (trái sang phải, trên xuống dưới) được lấy dùng trước.",
      },
    ];
    const show = (i: number) => {
      const st = steps[i];
      const last = i === steps.length - 1;
      this.coach?.pointEl(st.el(), st.text, undefined, undefined, {
        okText: last ? "Đã hiểu" : "Tiếp",
        beside: this.root.querySelector(".sv-card")?.getBoundingClientRect(),
        ok: () => (last ? done() : show(i + 1)),
      });
      if (phone) this.tuckGuide();
    };
    requestAnimationFrame(() => show(0));
  }

  /** Điện thoại: đủ chỗ thì dời thẻ hướng dẫn xuống ngay dưới ngăn kéo cho sát lưới. */
  private tuckGuide() {
    const bub = [...document.querySelectorAll<HTMLElement>(".tg-root")].find((r) => r.style.display !== "none")?.querySelector<HTMLElement>(".tg-bub");
    const card = this.root.querySelector(".sv-card")?.getBoundingClientRect();
    if (!bub || !card) return;
    const prev = bub.style.cssText;
    bub.style.width = `${card.width - 20}px`;
    bub.style.maxWidth = "none";
    const top = card.bottom + 8;
    if (top + bub.offsetHeight > window.innerHeight - 8) { bub.style.cssText = prev; return; }
    bub.style.left = `${Math.round(card.left + 10)}px`;
    bub.style.top = `${Math.round(top)}px`;
  }

  private el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = ""): HTMLElementTagNameMap[K] {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  private card(): HTMLElement {
    const card = this.el("div", this.opts.fridge ? "sv-card tu clay-tray" : "sv-card clay-tray");
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-label", this.opts.title);

    const head = this.el("div", "sv-head");
    const pic = this.el("img");
    pic.src = `art/${this.opts.fridge ? "prop_fridge" : "prop_cooler"}.webp`;
    pic.alt = "";
    head.append(pic, this.el("div", "sv-ten", this.opts.title), this.meter());
    card.appendChild(head);

    const body = this.el("div", "sv-body");
    body.appendChild(this.grid());
    this.det = this.el("div", "sv-det");
    if (this.stacks.length) body.appendChild(this.det);
    card.appendChild(body);

    const foot = this.el("div", "sv-foot");
    const close = this.el("button", "sv-btn clay-btn", "Đóng");
    close.type = "button";
    close.onclick = () => this.close();
    foot.appendChild(close);
    card.appendChild(foot);

    if (this.touch) {
      const x = this.el("button", "sv-x clay-btn", "×");
      x.type = "button";
      x.setAttribute("aria-label", "Đóng");
      x.onclick = () => this.close();
      card.appendChild(x);
    }

    if (this.stacks.length) this.select(0);
    return card;
  }

  private meter(): HTMLElement {
    const { used, cap } = coldUsage(this.opts.inventory, this.opts.day);
    const frac = Math.min(1, used / cap);
    const box = this.el("div", "sv-cold");
    box.title = "Chỗ chứa đồ lạnh";
    const ic = this.el("span");
    ic.innerHTML = SNOW;
    const m = this.el("div", frac >= 1 ? "sv-meter day" : frac >= 0.7 ? "sv-meter nang" : "sv-meter");
    const fill = this.el("i");
    fill.style.width = `${Math.max(frac * 100, used > 0 ? 4 : 0)}%`;
    m.appendChild(fill);
    box.append(ic, m, this.el("span", "", `${fmtUnits(used)}/${cap}`));
    return box;
  }

  private grid(): HTMLElement {
    this.gridEl = this.el("div", "sv-grid");
    this.gridEl.setAttribute("role", "list");
    this.fillGrid();
    return this.gridEl;
  }

  private fillGrid() {
    const g = this.gridEl;
    g.replaceChildren();
    this.cells = [];
    const total = this.touch ? Math.ceil(this.stacks.length / this.cols) * this.cols : Math.max(MIN_CELLS, Math.ceil(this.stacks.length / COLS) * COLS);
    for (let i = 0; i < total; i++) {
      const s = this.stacks[i];
      if (!s) {
        const e = this.el("div", "sv-cell rong");
        e.setAttribute("aria-hidden", "true");
        g.appendChild(e);
        continue;
      }
      const c = this.el("button", "sv-cell clay-btn");
      c.type = "button";
      c.setAttribute("role", "listitem");
      c.setAttribute("aria-label", this.label(s));
      c.appendChild(this.icon(s.good, "ic"));
      if (s.tier === "NGON") c.appendChild(this.el("span", "tag", "★"));
      else if (s.tier === "BAN") c.appendChild(this.el("span", "tag bad", "▼"));
      if (freshnessOf(s) === "last") c.appendChild(this.el("span", "alert", "!"));
      c.appendChild(this.el("span", "n", `×${fmtUnits(s.left)}`));
      c.appendChild(this.bar(s));
      c.dataset.i = String(i);
      c.onpointerenter = () => { if (!this.drag?.ghost) this.select(i); };
      c.onfocus = () => this.select(i);
      c.onclick = () => { if (!this.dropped) this.select(i); };
      c.onpointerdown = (e) => {
        if (e.button !== 0) return;
        this.drag = { from: i, id: e.pointerId, x: e.clientX, y: e.clientY, to: i, ghost: null };
      };
      this.cells.push(c);
      g.appendChild(c);
    }
  }

  private dragMove(e: PointerEvent) {
    const d = this.drag;
    if (!d || d.id !== e.pointerId) return;
    if (!d.ghost) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < DRAG_PX) return;
      const src = this.cells[d.from];
      const r = src.getBoundingClientRect();
      d.ghost = src.cloneNode(true) as HTMLElement;
      d.ghost.classList.remove("on");
      d.ghost.classList.add("sv-ghost");
      d.ghost.style.width = `${r.width}px`;
      d.ghost.style.height = `${r.height}px`;
      this.root.appendChild(d.ghost);
      src.classList.add("keo");
    }
    const g = d.ghost;
    g.style.left = `${e.clientX - g.offsetWidth / 2}px`;
    g.style.top = `${e.clientY - g.offsetHeight / 2}px`;
    const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>(".sv-cell[data-i]");
    if (hit && this.gridEl.contains(hit)) d.to = Number(hit.dataset.i);
    this.cells.forEach((c, k) => c.classList.toggle("dich", k === d.to && k !== d.from));
  }

  private dragEnd(e: PointerEvent, drop: boolean) {
    const d = this.drag;
    if (!d || d.id !== e.pointerId) return;
    this.drag = null;
    if (!d.ghost) return;
    d.ghost.remove();
    this.dropped = true;
    setTimeout(() => { this.dropped = false; });
    if (drop && d.to !== d.from) {
      moveStack(this.opts.inventory, this.stacks, d.from, d.to);
      this.stacks = stacksOf(this.opts.inventory, this.opts.day);
    }
    const at = drop ? d.to : d.from;
    this.fillGrid();
    this.select(at);
  }

  private bar(s: Stack): HTMLElement {
    const b = this.el("div", `bar ${freshnessOf(s)}`);
    const f = this.el("i");
    f.style.width = `${Math.max(8, Math.round((s.daysLeft / s.shelf) * 100))}%`;
    b.appendChild(f);
    return b;
  }

  private icon(good: GoodId, cls: string): HTMLElement {
    const img = this.el("img", cls);
    img.src = `art/${ICON[good]}.webp`;
    img.alt = "";
    img.draggable = false;
    return img;
  }

  private ageText(age: number) {
    return age === 0 ? "hôm nay" : age === 1 ? "hôm qua" : `${age} ngày trước`;
  }

  private hanText(s: Stack) {
    return s.age > 0 && s.daysLeft === 1 ? "Dùng hết hôm nay" : `Còn ${s.daysLeft} ngày`;
  }

  private label(s: Stack) {
    return `${GOODS[s.good].label}, ${QUALITIES[s.tier].label}, ${fmtUnits(s.left)} ${GOODS[s.good].unit}, ${this.hanText(s)}`;
  }

  private select(i: number, focus = false) {
    this.sel = i;
    this.cells.forEach((c, k) => c.classList.toggle("on", k === i));
    if (focus) this.cells[i].focus({ preventScroll: false });
    const s = this.stacks[i];
    const fr: Freshness = freshnessOf(s);
    this.det.replaceChildren();

    const pic = this.el("div", "pic");
    pic.appendChild(this.icon(s.good, ""));
    const chips = this.el("div", "chips");
    chips.appendChild(this.el("span", `chip ${s.tier === "NGON" ? "ngon" : s.tier === "BAN" ? "ban" : ""}`, QUALITIES[s.tier].label));
    if (s.cold) chips.appendChild(this.el("span", "chip", "Giữ lạnh"));

    const row = (k: string, v: string) => {
      const r = this.el("div", "row");
      r.append(this.el("span", "", k), this.el("b", "", v));
      return r;
    };
    const bar = this.bar(s);
    const rank = useRank(this.stacks, i);
    this.det.append(
      pic,
      this.el("div", "nm", GOODS[s.good].label.replace(/^./u, (c) => c.toUpperCase())),
      chips,
      ...(this.touch ? [] : [row("Số lượng", `${fmtUnits(s.left)} ${GOODS[s.good].unit}`), row("Nhập", this.ageText(s.age))]),
      ...(rank ? [row("Thứ tự dùng", `${rank.at}/${rank.of}`)] : []),
      row("Độ ngon", `${Math.round(s.quality * 100)}%`),
      bar,
      this.el("div", `han ${fr}`, this.hanText(s)),
    );
  }

  close() {
    if (!this.root.isConnected) return;
    this.coach?.destroy();
    this.coach = null;
    this.root.remove();
    if (this.game.input.keyboard) this.game.input.keyboard.enabled = true;
    this.opts.onClose();
  }

  get open() { return this.root.isConnected; }
}
