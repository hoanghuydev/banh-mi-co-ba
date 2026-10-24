import type Phaser from "phaser";
import { MENU_BOARD, MENU_DRINKS, MENU_TIPS, RAU_NEN, type MenuItem } from "../../sim/menu";
import { ECON, dishPriceVnd, pickOf, vnd, type PricePick } from "../../sim/econ";
import { isOpen } from "../../sim/unlock";
import { INGREDIENTS, levelsOf, type IngredientInfo } from "../../sim/order";
import { shopName } from "../../content/shop";

// Mọi tên món và con số đọc từ `sim/menu` + `sim/econ`, để bảng dạy đúng cái `diffDish` chấm.

const STYLE = `
.mb-root{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(12,15,18,.74);font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#2b2f31}
.mb-card{display:flex;flex-direction:column;gap:12px;width:min(940px,100%);max-height:100%;min-height:0}
.mb-cols{display:flex;gap:16px;align-items:stretch;flex:1;min-height:0}

.mb-board{position:relative;display:flex;flex-direction:column;flex:0 0 clamp(290px,36%,380px);margin-top:46px;border:solid transparent;border-width:34px;border-image:url(art/menu_khung.webp) 46 fill/34px stretch;color:#f8d978;filter:drop-shadow(0 14px 22px rgba(0,0,0,.5))}
.mb-board-in{display:flex;flex-direction:column;flex:1;min-height:0;overflow:auto;padding:4px 6px 2px}
.mb-day{position:absolute;left:50%;bottom:calc(100% + 31px);width:min(280px,76%);aspect-ratio:399/83;transform:translateX(-50%);background:url(art/menu_day.webp) center/100% 100% no-repeat;pointer-events:none}
.mb-ten{font-weight:700;font-size:1.4em;letter-spacing:.05em;line-height:1.2;text-shadow:0 1px 0 rgba(0,0,0,.35)}
.mb-gio{font-size:.88em;font-weight:500;letter-spacing:.1em;color:#ffe3a3;margin-top:3px}
.mb-ke{height:2px;background:#f8d978;opacity:.7;margin:10px 0 6px}
.mb-cot{display:flex;justify-content:space-between;font-size:.82em;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#edbe62;padding-bottom:6px}
.mb-row{padding:6px 0}
.mb-row .top{display:flex;align-items:baseline;gap:6px}
.mb-row .n{font-weight:700;white-space:nowrap}
.mb-row .d{flex:1;border-bottom:1px dotted rgba(248,217,120,.5);transform:translateY(-3px)}
.mb-row .g{font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
.mb-pk{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:6px}
.mb-pk button{font:inherit;font-size:.88em;padding:5px 2px;min-height:34px;border-radius:5px;border:1px solid rgba(248,217,120,.6);background:transparent;color:#f8d978;cursor:pointer;font-variant-numeric:tabular-nums;line-height:1.3}
.mb-pk button[aria-pressed=true]{background:#f8d978;color:#6b1d15;font-weight:700;border-color:#f8d978}
.mb-pk button:focus-visible{outline:2px solid #fff2c6;outline-offset:2px}
.mb-chan{margin-top:auto;padding-top:14px;border-top:1px solid rgba(248,217,120,.3);font-size:.88em;line-height:1.6}
.mb-chan b{color:#fff2c6}

.mb-giay{position:relative;display:flex;flex-direction:column;flex:1 1 auto;min-width:0;border:solid transparent;border-width:16px;border-image:url(art/menu_giay.webp) 22 fill/16px stretch;filter:drop-shadow(0 10px 18px rgba(0,0,0,.4))}
.mb-giay-in{flex:1;min-height:0;overflow:auto;margin-top:40px;padding:4px 8px 6px 46px}
.mb-bang{position:absolute;top:-52px;left:-36px;width:124px;height:98px;background:url(art/menu_bang_dan.webp) center/100% 100% no-repeat;pointer-events:none;z-index:1}
.mb-h{font-weight:700;font-size:1.25em;margin:0 0 12px;padding-bottom:7px;border-bottom:2px solid #2b2f31}
.mb-h2{font-size:.82em;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8e2a20;margin:18px 0 6px}
.mb-h2.dau{margin-top:0}
.mb-mon{padding:9px 0;border-bottom:1px dashed #d6c9a8}
.mb-mon:last-of-type{border-bottom:none}
.mb-mon .n{font-weight:700}
.mb-ing{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.mb-ing>span{display:inline-flex;align-items:center;gap:6px;padding:4px 11px;border-radius:14px;border:1px solid #cdbf9f;background:rgba(255,255,255,.6);font-size:.88em;line-height:1.5}
.mb-ing>span.nhan{border-color:#b0342a;background:rgba(176,52,42,.09);font-weight:600}
.mb-ing i{font-style:normal;font-weight:700;color:#8e2a20;font-variant-numeric:tabular-nums}
.mb-mon .note{font-size:.88em;color:#5f5542;line-height:1.5;margin-top:6px}
.mb-mon .trong{font-size:.88em;color:#5f5542;margin-top:6px}
.mb-tip{display:flex;align-items:baseline;gap:8px;padding:5px 0;font-size:.88em;line-height:1.5}
.mb-tip .s{font-weight:700;color:#8e2a20;white-space:nowrap}
.mb-tip .d{flex:1;border-bottom:1px dotted #c3b696;transform:translateY(-3px)}

.mb-bar{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:.88em;color:#ded5c6}
.mb-btn{font:inherit;font-size:1em;padding:7px 16px;border-radius:6px;border:1px solid #b8ab8e;background:#fbf7ec;color:#2b2f31;cursor:pointer;min-height:34px}
.mb-btn:focus-visible{outline:2px solid #fff2c6;outline-offset:2px}

@media (max-height:640px){
  .mb-root{padding:10px}
  .mb-row{padding:4px 0}
  .mb-pk button{min-height:30px}
  .mb-mon{padding:7px 0}
}
@media (max-width:760px){
  .mb-cols{flex-direction:column;overflow:auto;gap:34px}
  .mb-board,.mb-giay{flex:0 0 auto}
  .mb-board-in,.mb-giay-in{overflow:visible}
}
`;

/** Không dùng `dongVi()` vì hàm đó đọc số thành lời cho thoại. */
const tien = (d: number) => `${d.toLocaleString("vi-VN")}₫`;

export type MenuBoardOpts = {
  textScale: number;
  day: number;
  /** Mốc giá theo món; sửa thẳng vào đây. */
  prices: Record<string, number>;
  shopName?: string;
  onClose: () => void;
};

export class MenuBoardView {
  private root: HTMLDivElement;
  private keyGuard = (ev: KeyboardEvent) => {
    // Không nuốt phím tạm dừng `P`.
    if (ev.code === "Escape" || ev.code === "KeyE") { ev.preventDefault(); this.close(); return; }
    if (ev.code === "KeyP") return;
    ev.stopPropagation();
  };

  constructor(private game: Phaser.Game, private opts: MenuBoardOpts) {
    if (!document.getElementById("mb-style")) {
      const st = document.createElement("style");
      st.id = "mb-style";
      st.textContent = STYLE;
      document.head.appendChild(st);
    }
    this.root = document.createElement("div");
    this.root.className = "mb-root";
    this.root.style.fontSize = `${Math.round(16 * opts.textScale)}px`;
    this.root.addEventListener("keydown", this.keyGuard, true);
    this.root.addEventListener("keyup", (e) => { if (e.code !== "KeyP") e.stopPropagation(); }, true);
    this.root.addEventListener("pointerdown", (e) => { if (e.target === this.root) this.close(); });
    document.body.appendChild(this.root);
    if (this.game.input.keyboard) this.game.input.keyboard.enabled = false;
    this.render();
    // Không `preventScroll` thì focus kéo tờ giấy xuống đáy.
    this.root.querySelector<HTMLButtonElement>(".mb-btn")?.focus({ preventScroll: true });
  }

  private el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = ""): HTMLElementTagNameMap[K] {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  private chip(i: IngredientInfo, n: number): HTMLElement {
    const c = this.el("span", i.kind === "nhan" ? "nhan" : "");
    c.append(i.label);
    if (n >= 2) c.appendChild(this.el("i", "", "×2"));
    return c;
  }

  private chipRow(pick: (i: IngredientInfo) => number): HTMLElement {
    const box = this.el("div", "mb-ing");
    for (const i of INGREDIENTS) {
      const n = pick(i);
      if (n > 0) box.appendChild(this.chip(i, n));
    }
    return box;
  }

  /** Mức lấy từ `levelsOf`, cùng hàm `diffDish` chấm. */
  private levels(it: MenuItem) {
    return levelsOf({ mon: it.id, rau: "day-du", ot: 1, tuong: 1 });
  }

  /** `MENU_BOARD`, không phải `MENU_ITEMS`: món `onBoard: false` gọi được nhưng không ghi lên bảng. */
  private shown(): MenuItem[] {
    return MENU_BOARD.filter((i) => isOpen(i.id, this.opts.day));
  }

  private priceOf(it: MenuItem, pick: PricePick) {
    return dishPriceVnd({ mon: it.id }, pick);
  }

  private board(): HTMLElement {
    const b = this.el("div", "mb-board");
    b.appendChild(this.el("div", "mb-day"));
    const inner = this.el("div", "mb-board-in");

    // Phải trùng tên trên biển ngoài vách (`art/sign.ts`).
    inner.appendChild(this.el("div", "mb-ten", shopName(this.opts.shopName ?? "")));
    inner.appendChild(this.el("div", "mb-gio", "bán từ 6 giờ sáng"));
    inner.appendChild(this.el("div", "mb-ke"));

    const cot = this.el("div", "mb-cot");
    cot.appendChild(this.el("span", "", "Món"));
    cot.appendChild(this.el("span", "", "Giá bán"));
    inner.appendChild(cot);

    for (const it of this.shown()) {
      const pick = pickOf(this.opts.prices, it.id);
      const row = this.el("div", "mb-row");
      const top = this.el("div", "top");
      top.appendChild(this.el("span", "n", it.name));
      top.appendChild(this.el("span", "d"));
      top.appendChild(this.el("span", "g", tien(this.priceOf(it, pick))));
      row.appendChild(top);
      const pk = this.el("div", "mb-pk");
      pk.setAttribute("role", "group");
      pk.setAttribute("aria-label", `Giá bán — ${it.name}`);
      for (const i of [0, 1, 2] as const) {
        const bt = this.el("button", "", `${it.k[i]}k`);
        bt.type = "button";
        bt.setAttribute("aria-pressed", String(pick === i));
        bt.dataset.k = `${it.id}-${i}`;
        bt.onclick = () => { this.opts.prices[it.id] = i; this.render(`${it.id}-${i}`); };
        pk.appendChild(bt);
      }
      row.appendChild(pk);
      inner.appendChild(row);
    }

    const chan = this.el("div", "mb-chan");
    if (isOpen("daydu", this.opts.day)) {
      const db = this.el("div");
      db.append("thêm một thứ nhân — +");
      db.appendChild(this.el("b", "", tien(vnd(ECON.menu.extra_k))));
      chan.appendChild(db);
    }
    for (const d of MENU_DRINKS) chan.appendChild(this.el("div", "", `${d.name} — ${d.price}`));
    inner.appendChild(chan);

    b.appendChild(inner);
    return b;
  }

  private paper(): HTMLElement {
    const p = this.el("div", "mb-giay");
    p.appendChild(this.el("div", "mb-bang"));
    const inner = this.el("div", "mb-giay-in");
    inner.appendChild(this.el("div", "mb-h", "Công thức món"));

    inner.appendChild(this.el("div", "mb-h2 dau", "Rau nền"));
    inner.appendChild(this.chipRow((i) => (i.kind === "nhan" ? 0 : RAU_NEN[i.id] ?? 0)));

    inner.appendChild(this.el("div", "mb-h2", "Nhân từng ổ"));
    for (const it of this.shown()) {
      const lv = this.levels(it);
      const m = this.el("div", "mb-mon");
      m.appendChild(this.el("div", "n", it.name));

      const nhan = this.chipRow((i) => (i.kind === "nhan" ? lv[i.id] ?? 0 : 0));
      m.appendChild(nhan.childElementCount ? nhan : this.el("div", "trong", "không nhân"));

      // Ổ nào rắc khác khay rau chung thì ghi riêng, khỏi phải đoán.
      const khacNen = INGREDIENTS.some((i) => i.kind !== "nhan" && (lv[i.id] ?? 0) !== (RAU_NEN[i.id] ?? 0));
      if (khacNen) {
        const rau = this.chipRow((i) => (i.kind === "nhan" ? 0 : lv[i.id] ?? 0));
        m.appendChild(rau.childElementCount ? rau : this.el("div", "trong", "không rau"));
      }
      if (it.note.trim()) m.appendChild(this.el("div", "note", it.note));
      inner.appendChild(m);
    }

    inner.appendChild(this.el("div", "mb-h2", "Khách dặn thêm"));
    for (const t of MENU_TIPS) {
      const row = this.el("div", "mb-tip");
      row.appendChild(this.el("span", "s", t.say));
      row.appendChild(this.el("span", "d"));
      row.appendChild(this.el("span", "", t.means));
      inner.appendChild(row);
    }

    p.appendChild(inner);
    return p;
  }

  private render(focusKey?: string) {
    const scroll = [".mb-board-in", ".mb-giay-in"].map((s) => this.root.querySelector<HTMLElement>(s)?.scrollTop ?? 0);
    this.root.textContent = "";

    const card = this.el("div", "mb-card");
    const cols = this.el("div", "mb-cols");
    cols.appendChild(this.board());
    cols.appendChild(this.paper());
    card.appendChild(cols);

    const bar = this.el("div", "mb-bar");
    bar.appendChild(this.el("span", "", "Esc hoặc E — đóng"));
    const btn = this.el("button", "mb-btn", "Đóng");
    btn.onclick = () => this.close();
    bar.appendChild(btn);
    card.appendChild(bar);

    this.root.appendChild(card);
    [".mb-board-in", ".mb-giay-in"].forEach((s, i) => { const e = this.root.querySelector<HTMLElement>(s); if (e) e.scrollTop = scroll[i]; });
    if (focusKey) this.root.querySelector<HTMLButtonElement>(`[data-k="${focusKey}"]`)?.focus({ preventScroll: true });
  }

  close() {
    if (!this.root.isConnected) return;
    this.root.remove();
    if (this.game.input.keyboard) this.game.input.keyboard.enabled = true;
    this.opts.onClose();
  }

  get open() { return this.root.isConnected; }
}
