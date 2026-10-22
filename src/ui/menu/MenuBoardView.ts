import type Phaser from "phaser";
import { MENU_BOARD, MENU_DRINKS, MENU_TIPS, type MenuItem } from "../../sim/menu";
import { ECON, dishPriceVnd, pickOf, vnd, type PricePick } from "../../sim/econ";
import { isOpen } from "../../sim/unlock";
import { INGREDIENTS, levelsOf } from "../../sim/order";
import { shopName } from "../../content/shop";

// Mọi tên món và con số đọc từ `sim/menu` + `sim/econ`, để bảng dạy đúng cái `diffDish` chấm.

const STYLE = `
.mb-root{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(18,22,26,.66);font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#2b2f31}
.mb-wrap{display:flex;gap:18px;align-items:flex-start;max-width:96vw;max-height:94vh}
.mb-board{position:relative;width:min(400px,42vw);transform:rotate(-.5deg);background:#a83226;border:7px solid #6f6256;border-radius:4px;box-shadow:0 14px 40px rgba(0,0,0,.5);padding:16px 18px 14px;color:#f5c542;flex:0 0 auto;max-height:94vh;overflow:auto}
.mb-board::after{content:"";position:absolute;inset:4px;border:1px solid rgba(245,197,66,.35);border-radius:2px;pointer-events:none}
.mb-nail{position:absolute;top:-3px;left:50%;width:9px;height:9px;margin-left:-4px;border-radius:50%;background:#d9d2c4;box-shadow:0 1px 2px rgba(0,0,0,.6)}
.mb-ten{font-weight:700;font-size:1.5em;letter-spacing:.06em;line-height:1.2;text-shadow:0 1px 0 rgba(0,0,0,.35)}
.mb-ten small{display:block;font-weight:500;font-size:.44em;letter-spacing:.14em;opacity:.85;margin-top:2px}
.mb-ke{height:2px;background:#f5c542;opacity:.75;margin:10px 0 8px;transform:rotate(.25deg)}
.mb-row{padding:5px 0;font-size:1.02em}
.mb-row .top{display:flex;align-items:baseline;gap:6px}
.mb-row .n{font-weight:700;white-space:nowrap}
.mb-pk{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:5px}
.mb-pk button{font:inherit;font-size:.84em;padding:4px 2px;min-height:32px;border-radius:5px;border:1px solid rgba(245,197,66,.65);background:transparent;color:#f5c542;cursor:pointer;font-variant-numeric:tabular-nums;line-height:1.3}
.mb-pk button[aria-pressed=true]{background:#f5c542;color:#6b1d15;font-weight:700}
.mb-pk button:focus-visible{outline:2px solid #fff2c6;outline-offset:2px}
.mb-row .d{flex:1;border-bottom:1px dotted rgba(245,197,66,.5);transform:translateY(-3px)}
.mb-row .g{font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
.mb-row:nth-child(odd) .n{transform:translateY(.5px)}
.mb-row:nth-child(3n) .n{transform:translateX(1px)}
.mb-chan{margin-top:10px;font-size:.78em;line-height:1.55;opacity:.92}
.mb-chan b{color:#fff2c6}

.mb-giay{position:relative;width:min(470px,50vw);max-height:94vh;overflow:auto;background:#f6f0e1;border-radius:3px;box-shadow:0 10px 30px rgba(0,0,0,.4);padding:16px 20px 18px 26px;transform:rotate(.35deg);background-image:linear-gradient(90deg,transparent 14px,rgba(176,52,42,.5) 14px 15px,transparent 15px)}
.mb-bang{position:absolute;top:-10px;left:28px;width:70px;height:22px;background:rgba(222,210,180,.75);border:1px solid rgba(0,0,0,.08);transform:rotate(-3deg)}
.mb-h{font-weight:700;font-size:1.06em;margin:0 0 2px}
.mb-sub{font-size:.8em;color:#7a6f5b;margin-bottom:10px;line-height:1.5}
.mb-nen{border:1px dashed #c3b696;border-radius:6px;padding:8px 10px;margin-bottom:12px;background:rgba(255,255,255,.4)}
.mb-nen .t{font-weight:700;font-size:.92em;margin-bottom:4px}
.mb-nen .l{font-size:.88em;line-height:1.6}
.mb-mon{padding:9px 0;border-bottom:1px dashed #d6c9a8}
.mb-mon:last-of-type{border-bottom:none}
.mb-mon .hd{display:flex;align-items:baseline;gap:6px}
.mb-mon .n{font-weight:700;font-size:1em}
.mb-mon .dot{flex:1;border-bottom:1px dotted #c3b696;transform:translateY(-3px)}
.mb-mon .gia{font-weight:700;font-size:.9em;color:#8e2a20;font-variant-numeric:tabular-nums}
.mb-ing{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}
.mb-ing span{display:inline-flex;align-items:center;gap:4px;padding:2px 7px 2px 3px;border-radius:11px;border:1px solid #cdbf9f;background:rgba(255,255,255,.55);font-size:.84em;line-height:1.5}
.mb-ing span.nhan{border-color:#b0342a;background:rgba(176,52,42,.09);font-weight:700}
.mb-ing b{display:inline-flex;align-items:center;justify-content:center;width:1.35em;height:1.35em;border-radius:50%;background:#2b2f31;color:#f6f0e1;font-size:.82em;font-weight:700}
.mb-ing i{font-style:normal;font-weight:700;color:#8e2a20}
.mb-mon .note{font-size:.82em;color:#6f6450;line-height:1.5;margin-top:4px}
.mb-mon .trong{font-size:.86em;color:#6f6450;margin-top:5px;font-style:italic}
.mb-sec{margin-top:14px;padding-top:10px;border-top:2px solid #d6c9a8}
.mb-tip{display:grid;grid-template-columns:minmax(120px,38%) 1fr;gap:4px 10px;padding:4px 0;font-size:.88em;line-height:1.5}
.mb-tip .s{font-weight:700;color:#8e2a20}
.mb-bar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:14px;font-size:.8em;color:#7a6f5b}
.mb-btn{font:inherit;font-size:1em;padding:6px 14px;border-radius:6px;border:1px solid #b8ab8e;background:#fbf7ec;color:#2b2f31;cursor:pointer;min-height:32px}
.mb-btn:focus-visible{outline:2px solid #8e2a20;outline-offset:2px}
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
    this.root.style.fontSize = `${Math.round(14 * opts.textScale)}px`;
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

  /** Ghi đủ bộ mỗi món kể cả phần lặp lại; mức lấy từ `levelsOf`, cùng hàm `diffDish` chấm. */
  private ingChips(it: MenuItem): HTMLElement {
    const box = this.el("div", "mb-ing");
    const lv = levelsOf({ mon: it.id, rau: "day-du", ot: 1, tuong: 1 });
    for (const i of INGREDIENTS) {
      const n = lv[i.id] ?? 0;
      if (n <= 0) continue;
      const chip = this.el("span", i.kind === "nhan" ? "nhan" : "");
      chip.appendChild(this.el("b", "", String(i.key)));
      chip.appendChild(this.el("span", "", i.label));
      if (n >= 2) chip.appendChild(this.el("i", "", "×2"));
      box.appendChild(chip);
    }
    return box;
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
    b.appendChild(this.el("div", "mb-nail"));
    // Phải trùng tên trên biển ngoài vách (`art/sign.ts`).
    const ten = this.el("div", "mb-ten", shopName(this.opts.shopName ?? ""));
    ten.appendChild(this.el("small", "", "bán từ 6 giờ sáng"));
    b.appendChild(ten);
    b.appendChild(this.el("div", "mb-ke"));

    for (const it of this.shown()) {
      const pick = pickOf(this.opts.prices, it.id);
      const row = this.el("div", "mb-row");
      const top = this.el("div", "top");
      top.appendChild(this.el("span", "n", it.name));
      top.appendChild(this.el("span", "d"));
      top.appendChild(this.el("span", "g", tien(this.priceOf(it, pick))));
      row.appendChild(top);
      const pk = this.el("div", "mb-pk");
      for (const i of [0, 1, 2] as const) {
        const bt = this.el("button", "", `${it.k[i]}k`);
        bt.type = "button";
        bt.setAttribute("aria-pressed", String(pick === i));
        bt.dataset.k = `${it.id}-${i}`;
        bt.onclick = () => { this.opts.prices[it.id] = i; this.render(`${it.id}-${i}`); };
        pk.appendChild(bt);
      }
      row.appendChild(pk);
      b.appendChild(row);
    }

    const chan = this.el("div", "mb-chan");
    if (isOpen("daydu", this.opts.day)) {
      const db = this.el("div");
      db.append("ổ đầy đủ xin thêm một thứ nhân — +");
      db.appendChild(this.el("b", "", tien(vnd(ECON.menu.extra_k))));
      chan.appendChild(db);
    }
    for (const d of MENU_DRINKS) chan.appendChild(this.el("div", "", `${d.name} — ${d.price}`));
    b.appendChild(chan);
    return b;
  }

  private paper(): HTMLElement {
    const p = this.el("div", "mb-giay");
    p.appendChild(this.el("div", "mb-bang"));
    p.appendChild(this.el("div", "mb-h", "Công thức món"));

    for (const it of this.shown()) {
      const m = this.el("div", "mb-mon");
      const hd = this.el("div", "hd");
      hd.appendChild(this.el("span", "n", it.name));
      hd.appendChild(this.el("span", "dot"));
      hd.appendChild(this.el("span", "gia", tien(this.priceOf(it, pickOf(this.opts.prices, it.id)))));
      m.appendChild(hd);
      const chips = this.ingChips(it);
      if (chips.childElementCount) m.appendChild(chips);
      else m.appendChild(this.el("div", "trong", "không bỏ gì — ổ bánh trơn."));
      if (it.note.trim()) m.appendChild(this.el("div", "note", it.note));
      p.appendChild(m);
    }

    const sec = this.el("div", "mb-sec");
    sec.appendChild(this.el("div", "mb-h", "Khách dặn thêm"));
    sec.appendChild(this.el("div", "mb-sub", "Nghe được câu nào thì sửa ổ theo câu đó — bảng không tự sửa."));
    for (const t of MENU_TIPS) {
      const row = this.el("div", "mb-tip");
      row.appendChild(this.el("span", "s", t.say));
      row.appendChild(this.el("span", "", t.means));
      sec.appendChild(row);
    }
    p.appendChild(sec);

    const bar = this.el("div", "mb-bar");
    bar.appendChild(this.el("span", "", "Esc hoặc E — quay lại quầy"));
    const btn = this.el("button", "mb-btn", "Đóng");
    btn.onclick = () => this.close();
    bar.appendChild(btn);
    p.appendChild(bar);
    return p;
  }

  private render(focusKey?: string) {
    const scroll = [".mb-board", ".mb-giay"].map((s) => this.root.querySelector<HTMLElement>(s)?.scrollTop ?? 0);
    this.root.textContent = "";
    const wrap = this.el("div", "mb-wrap");
    wrap.appendChild(this.board());
    wrap.appendChild(this.paper());
    this.root.appendChild(wrap);
    [".mb-board", ".mb-giay"].forEach((s, i) => { const e = this.root.querySelector<HTMLElement>(s); if (e) e.scrollTop = scroll[i]; });
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
