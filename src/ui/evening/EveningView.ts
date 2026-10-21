import type { SaveFile } from "../../core/save";
import { WEEKDAY_VI, weekdayIdx } from "../../sim/econ";

const STYLE = `
.ev-root{position:fixed;inset:0;z-index:8990;display:flex;align-items:center;justify-content:center;background:rgba(14,18,22,.45);font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#2b2f31}
/* hai hàng RÕ RÀNG: hàng sổ co được (minmax(0,1fr) — không có nó thì hàng tự phình theo nội
   dung, đẩy chân trang ra ngoài max-height và overflow:auto của .ev-col không bao giờ chạy),
   hàng chân trang đúng bằng nội dung.
   Cột phải RỘNG HƠN cột trái: cột trái là một cột số cố định, cột phải phải chứa thẻ đồ nghề. */
.ev-book{width:min(460px,95vw);max-height:94vh;display:grid;grid-template-rows:minmax(0,1fr) auto;background:#efe6d2;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.45);overflow:hidden}
.ev-col{padding:14px 18px;overflow:auto;min-height:0}
/* index.html §CANON 15: CHỈ dùng font đã nạp VÀ có dấu. Be Vietnam Pro (9 face: 3 nét ×
   latin / latin-ext / vietnamese) là font duy nhất bản dựng nạp. Consolas / "Segoe Print"
   không có bảng tiếng Việt → trình duyệt ghép dấu rời: "tiêǹ chô˜", "gưỉ vê nhà".
   Cảm giác máy đánh giữ bằng cột số đều (tabular-nums) + giãn chữ, không bằng font thiếu dấu. */
.ev-left{font-size:.92em;letter-spacing:.02em;font-variant-numeric:tabular-nums}
.ev-h{font-weight:700;font-size:1.08em;margin:0 0 8px;font-family:"Be Vietnam Pro",system-ui,sans-serif}
.ev-r{display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px dashed #d8cdb3}
.ev-r span+span{white-space:nowrap;font-variant-numeric:tabular-nums}
/* tiền VÔ đậm hơn tiền RA: hai chục dòng cùng một sắc độ thì không quét được dòng nào là thu.
   Không dùng màu đỏ/xanh — P3-06 §3 cấm, và mù màu đỏ-lục là 8% đàn ông (CANON §15). */
.ev-r.in span+span{font-weight:700}
.ev-r.out span,.ev-r.out span+span{color:#6d624e}
.ev-cash{display:flex;justify-content:space-between;gap:8px;margin-top:10px;padding-top:8px;border-top:2px solid #cdbf9f;font-weight:700;font-size:1.06em}
.ev-cash span+span{font-variant-numeric:tabular-nums}
.ev-note{font-size:.85em;color:#6d624e;margin-top:6px}
/* lời người nói: một khối CÓ VẠCH LỀ, không trộn vô cột số (giống .mk-talk của màn chợ) */
.ev-says{margin-top:10px;padding-left:10px;border-left:3px solid #ddd2b8}
.ev-say{font-style:italic;color:#4a5a6a;margin:4px 0;font-size:.9em;line-height:1.5}
.ev-says .ev-note{margin-top:4px;font-style:italic}

.btns{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:6px}
.ev-btn{font:inherit;font-size:.88em;padding:6px 12px;border-radius:6px;border:1px solid #b8ab8e;background:#fbf7ec;color:#2b2f31;cursor:pointer;min-height:32px}
.ev-btn:hover:not(:disabled){border-color:#2f5d8a}
.ev-btn.primary{background:#2f5d8a;color:#fff;border-color:#2f5d8a}
.ev-btn.quiet{border-color:transparent;background:transparent;color:#6d624e;padding:4px 8px;min-height:28px;font-size:.84em;text-decoration:underline}
.ev-btn:disabled{opacity:.45;cursor:default}
.ev-btn:focus-visible{outline:2px solid #2f5d8a;outline-offset:2px}
.ev-why{font-size:.82em;color:#8a7d64}
/* bước xác nhận (CANON §15.5) — không phải popup, mà là chính cái thẻ đó đổi ruột */
.ev-ask{background:#f1e7cf;border:1px solid #cdbf9f;border-radius:7px;padding:8px 10px;margin-top:6px;font-size:.88em;line-height:1.5}
.ev-foot{grid-column:1/3;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 18px;border-top:2px solid #cdbf9f;background:#efe6d2}
.ev-msg{font-size:.85em;color:#6d624e;font-style:italic}
.ev-acts{display:flex;gap:8px;margin-left:auto}
`;

const money = (v: number) => `${Math.round(v).toLocaleString("vi-VN")}₫`;
const signed = (v: number) => `${v < 0 ? "+" : "−"}${money(Math.abs(v))}`;

export class EveningView {
  private root: HTMLDivElement;
  private msg = "";

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
    const L = this.el("div", "ev-col ev-left");
    L.append(this.el("div", "ev-h", `Tối ngày ${day} — ${WEEKDAY_VI[weekdayIdx(day)]}`));
    const row = (a: string, b: string, dir: "in" | "out" | "" = "out") => {
      const r = this.el("div", `ev-r${dir ? ` ${dir}` : ""}`);
      r.append(this.el("span", "", a), this.el("span", "", b));
      L.append(r);
    };
    // Mỗi khoản ra/vào một dòng để sổ cộng lại đúng bằng két.
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
    if (t.sick) says.append(this.el("div", "ev-note", `${t.sick} khách đau bụng sau khi ăn`));
    if (et.soldOut) says.append(this.el("div", "ev-note", "có người tới mà hết bánh"));
    if (et.wasted.length) says.append(this.el("div", "ev-note", `sáng nay bỏ (hư): ${et.wasted.join(", ")}`));
    if (says.childElementCount) L.append(says);
    return L;
  }

  private foot() {
    const foot = this.el("div", "ev-foot");
    if (this.msg) foot.append(this.el("div", "ev-msg", this.msg));
    const acts = this.el("div", "ev-acts");
    const sleep = this.el("button", "ev-btn primary", "Đi ngủ");
    sleep.onclick = () => this.opts.onSleep();
    acts.append(sleep);
    foot.append(acts);
    return foot;
  }

  close() { this.root.remove(); }
}
