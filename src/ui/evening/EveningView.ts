import type { SaveFile } from "../../core/save";
import { WEEKDAY_VI, weekdayIdx } from "../../sim/econ";

const STYLE = `
.ev-root{position:fixed;inset:0;z-index:8990;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:rgba(14,18,22,.45);font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#2b2f31}
.ev-book{width:min(420px,100%);max-height:100%;display:flex;flex-direction:column;background:#efe6d2;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.45);overflow:hidden}
.ev-col{padding:18px 20px 14px;overflow:auto;min-height:0;flex:1 1 auto;font-variant-numeric:tabular-nums}
.ev-h{font-weight:700;font-size:1.15em;margin:0 0 4px}
.ev-sub{font-size:.85em;color:#6d624e;margin-bottom:10px}
.ev-r{display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px dashed #d8cdb3}
.ev-r span+span{white-space:nowrap}
.ev-r.in span+span{font-weight:700}
.ev-r.out span,.ev-r.out span+span{color:#6d624e}
.ev-cash{display:flex;justify-content:space-between;gap:12px;margin-top:12px;padding-top:10px;border-top:2px solid #cdbf9f;font-weight:700;font-size:1.1em}
.ev-note{font-size:.85em;color:#6d624e;margin-top:6px}
.ev-says{margin-top:12px;padding-left:10px;border-left:3px solid #ddd2b8}
.ev-say{font-style:italic;color:#4a5a6a;margin:4px 0;font-size:.9em;line-height:1.5}
.ev-says .ev-note{margin-top:4px;font-style:italic}
.ev-btn{font:inherit;font-size:.92em;padding:8px 18px;border-radius:6px;border:1px solid #2f5d8a;background:#2f5d8a;color:#fff;cursor:pointer;min-height:36px}
.ev-btn:focus-visible{outline:2px solid #2f5d8a;outline-offset:2px}
.ev-foot{display:flex;justify-content:flex-end;padding:10px 20px;border-top:2px solid #cdbf9f}
`;

const money = (v: number) => `${Math.round(v).toLocaleString("vi-VN")}₫`;
const signed = (v: number) => `${v < 0 ? "+" : "−"}${money(Math.abs(v))}`;

export class EveningView {
  private root: HTMLDivElement;

  constructor(private w: SaveFile,
    private opts: { textScale: number; lines?: string[]; onSleep: () => void }) {
    if (!document.getElementById("ev-style")) {
      const st = document.createElement("style");
      st.id = "ev-style"; st.textContent = STYLE;
      document.head.appendChild(st);
    }
    this.root = document.createElement("div");
    this.root.className = "ev-root";
    this.root.style.fontSize = `${Math.round(14 * opts.textScale)}px`;
    this.root.addEventListener("keydown", (e) => e.stopPropagation(), true);
    document.body.appendChild(this.root);
    this.render();
  }

  private el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = ""): HTMLElementTagNameMap[K] {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  render() {
    this.root.replaceChildren();
    const book = this.el("div", "ev-book");
    book.append(this.ledger(), this.foot());
    this.root.append(book);
  }

  private ledger() {
    const w = this.w, day = w.progress.dayIndex, e = w.econ, t = w.progress.today, et = e.today;
    const L = this.el("div", "ev-col");
    L.append(this.el("div", "ev-h", `Tối ngày ${day}`), this.el("div", "ev-sub", WEEKDAY_VI[weekdayIdx(day)]));
    const row = (a: string, b: string, dir: "in" | "out" | "" = "out") => {
      const r = this.el("div", `ev-r${dir ? ` ${dir}` : ""}`);
      r.append(this.el("span", "", a), this.el("span", "", b));
      L.append(r);
    };
    row(`bán được ${t.served} ổ`, `+${money(t.revenue)}`, "in");
    if (et.market) row("nhập hàng", `−${money(et.market)}`);
    if (et.rent) row("tiền chỗ", `−${money(et.rent)}`);
    if (et.tools) row(et.tools < 0 ? "bán đồ nghề" : "sắm đồ nghề", signed(et.tools), et.tools < 0 ? "in" : "out");
    if (et.talk) row("chi khi trò chuyện", `−${money(et.talk)}`);
    if (et.family) row("gửi mẹ", `−${money(et.family)}`);
    row("than, đá, túi, xăng", `−${money(et.fixed)}`);
    const cash = this.el("div", "ev-cash");
    cash.append(this.el("span", "", "trong ống"), this.el("span", "", money(w.money.cash)));
    L.append(cash);

    const says = this.el("div", "ev-says");
    if (e.rentOwed) says.append(this.el("div", "ev-say", `Chủ nhà: "Tiền chỗ mấy bữa nay con tính sao?"`));
    for (const l of this.opts.lines ?? []) says.append(this.el("div", "ev-say", l));
    if (t.lost) says.append(this.el("div", "ev-note", "có người đợi không nổi rồi về"));
    if (t.priceLost) says.append(this.el("div", "ev-note", `${t.priceLost} khách xem giá rồi bỏ đi`));
    if (t.overpriced) says.append(this.el("div", "ev-note", `${t.overpriced} khách chê giá đắt`));
    if (t.sick) says.append(this.el("div", "ev-note", `${t.sick} khách đau bụng sau khi ăn`));
    if (et.soldOut) says.append(this.el("div", "ev-note", "có người tới mà hết bánh"));
    if (et.wasted.length) says.append(this.el("div", "ev-note", `sáng nay bỏ (hư): ${et.wasted.join(", ")}`));
    if (says.childElementCount) L.append(says);
    return L;
  }

  private foot() {
    const foot = this.el("div", "ev-foot");
    const sleep = this.el("button", "ev-btn", "Đi ngủ");
    sleep.onclick = () => this.opts.onSleep();
    foot.append(sleep);
    return foot;
  }

  close() { this.root.remove(); }
}
