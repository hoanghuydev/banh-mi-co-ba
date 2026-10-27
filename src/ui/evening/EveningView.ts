import { sfx } from "../../audio/sfx";
import type { SaveFile } from "../../core/save";
import { WEEKDAY_VI, weekdayIdx } from "../../sim/econ";
import { average, starText } from "../../sim/reviews";
import { isPhone } from "../../core/device";

const STYLE = `
.ev-root{position:fixed;inset:0;z-index:8990;display:flex;align-items:center;justify-content:center;padding:max(16px,var(--safe-top)) max(16px,var(--safe-right)) max(16px,var(--safe-bottom)) max(16px,var(--safe-left));box-sizing:border-box;background:rgba(14,18,22,.45);font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#2b2f31}
.ev-book{width:min(420px,100%);max-height:100%;display:flex;flex-direction:column;background:#efe6d2;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.45);overflow:hidden}
.ev-col{padding:18px 20px 14px;overflow:auto;min-height:0;flex:1 1 auto;font-variant-numeric:tabular-nums}
.ev-h{font-weight:700;font-size:1.15em;margin:0 0 4px}
.ev-sub{font-size:max(14px,.85em);color:#6d624e;margin-bottom:10px}
.ev-r{display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px dashed #d8cdb3}
.ev-r span+span{white-space:nowrap}
.ev-r.in span+span{font-weight:700}
.ev-r.out span,.ev-r.out span+span{color:#6d624e}
.ev-cash{display:flex;justify-content:space-between;gap:12px;margin-top:12px;padding-top:10px;border-top:2px solid #cdbf9f;font-weight:700;font-size:1.1em}
.ev-note{font-size:max(14px,.85em);color:#6d624e;margin-top:6px}
.ev-says{margin-top:12px;padding-left:10px;border-left:3px solid #ddd2b8}
.ev-say{font-style:italic;color:#4a5a6a;margin:4px 0;font-size:max(14px,.9em);line-height:1.5}
.ev-says .ev-note{margin-top:4px;font-style:italic}
.ev-btn{position:relative;font:inherit;font-size:max(14px,.92em);padding:8px 18px;border-radius:6px;border:1px solid #2f5d8a;background:#2f5d8a;color:#fff;cursor:pointer;min-height:48px;min-width:88px}
.ev-btn.ghost{background:#fbf7ec;color:#2f5d8a;margin-top:6px}
.ev-btn.sleep{min-height:48px;min-width:132px;background:#c0392b;border-color:#c0392b;font-weight:700;margin-left:auto;box-shadow:0 3px 10px rgba(192,57,43,.35)}
.ev-btn.sleep:focus-visible{outline-color:#c0392b}
.ev-badge[hidden]{display:none}
.ev-badge{position:absolute;top:-12px;right:-10px;min-width:24px;height:24px;padding:0 6px;border-radius:12px;background:#e03a2c;color:#fff;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px #efe6d2;font-variant-numeric:tabular-nums}
.ev-btn:focus-visible{outline:2px solid #2f5d8a;outline-offset:2px}
.ev-foot{display:flex;align-items:center;gap:16px;padding:8px 20px 10px;border-top:2px solid #cdbf9f}
html[data-phone="1"] .ev-root{padding:max(6px,var(--safe-top)) max(8px,var(--safe-right)) max(6px,var(--safe-bottom)) max(8px,var(--safe-left))}
html[data-phone="1"] .ev-book{width:min(720px,100%)}
html[data-phone="1"] .ev-col{display:flex;align-items:flex-start;gap:24px;padding:10px 16px 8px}
html[data-phone="1"] :is(.ev-a,.ev-b){flex:1 1 0;min-width:0}
html[data-phone="1"] .ev-b .ev-cash{margin-top:0;padding-top:0;border-top:0;padding-bottom:6px;border-bottom:2px solid #cdbf9f}
html[data-phone="1"] .ev-sub{margin-bottom:4px}
html[data-phone="1"] .ev-r{padding:3px 0}
html[data-phone="1"] :is(.ev-sub,.ev-note,.ev-say,.ev-btn){font-size:max(12px,.92em)}
html[data-phone="1"] .ev-says{margin-top:8px}
html[data-phone="1"] .ev-foot{padding:6px 16px}
html[data-phone="1"] .ev-btn,html[data-phone="1"] .ev-btn.sleep{min-height:40px;padding:4px 16px}
html[data-phone="1"] .ev-btn.ghost{margin-top:0}
`;

const money = (v: number) => `${Math.round(v).toLocaleString("vi-VN")}₫`;
const signed = (v: number) => `${v < 0 ? "+" : "−"}${money(Math.abs(v))}`;

export class EveningView {
  private root: HTMLDivElement;
  private badge: HTMLSpanElement | null = null;

  constructor(private w: SaveFile,
    private opts: { textScale: number; lines?: string[]; unread?: () => number; onPhone?: () => void; onSleep: () => void }) {
    if (!document.getElementById("ev-style")) {
      const st = document.createElement("style");
      st.id = "ev-style"; st.textContent = STYLE;
      document.head.appendChild(st);
    }
    this.root = document.createElement("div");
    this.root.className = "ev-root";
    this.root.style.fontSize = `${Math.round((isPhone() ? 13 : 14) * opts.textScale)}px`;
    this.root.addEventListener("keydown", (e) => e.stopPropagation(), true);
    document.body.appendChild(this.root);
    sfx.ui("ui_mo_so_tay");
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
    const col = this.el("div", "ev-col"), L = this.el("div", "ev-a"), R = this.el("div", "ev-b");
    col.append(L, R);
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
    R.append(cash);

    const says = this.el("div", "ev-says");
    for (const l of this.opts.lines ?? []) says.append(this.el("div", "ev-say", l));
    if (t.lost) says.append(this.el("div", "ev-note", "có người đợi không nổi rồi về"));
    if (t.priceLost) says.append(this.el("div", "ev-note", `${t.priceLost} khách xem giá rồi bỏ đi`));
    if (t.sick) says.append(this.el("div", "ev-note", `${t.sick} khách đau bụng sau khi ăn`));
    const today = w.reviews.list.filter((r) => r.day === w.progress.dayIndex);
    if (today.length) {
      says.append(this.el("div", "ev-note",
        `${today.length} đánh giá mới — sao trung bình ${starText(average(w))}`));
    }
    if (et.soldOut) says.append(this.el("div", "ev-note", "có người tới mà hết bánh"));
    if (et.wasted.length) says.append(this.el("div", "ev-note", `sáng nay bỏ (hư): ${et.wasted.join(", ")}`));
    if (says.childElementCount) R.append(says);
    return col;
  }

  private foot() {
    const foot = this.el("div", "ev-foot");
    const sleep = this.el("button", "ev-btn sleep", "Đi ngủ");
    sleep.type = "button";
    sleep.onclick = () => this.opts.onSleep();
    if (this.opts.onPhone) {
      const phone = this.el("button", "ev-btn ghost", "Điện thoại");
      phone.type = "button";
      phone.onclick = () => this.opts.onPhone?.();
      this.badge = this.el("span", "ev-badge");
      phone.append(this.badge);
      foot.append(phone);
      this.setUnread();
    }
    foot.append(sleep);
    return foot;
  }

  /** Đọc lại số tin chưa xem từ `opts.unread`. */
  setUnread() {
    const n = this.opts.unread?.() ?? 0;
    if (!this.badge) return;
    this.badge.hidden = n <= 0;
    this.badge.textContent = n > 9 ? "9+" : String(n);
  }

  close() { this.root.remove(); }
}
