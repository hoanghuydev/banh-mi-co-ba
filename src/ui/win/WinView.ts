import type { SaveFile } from "../../core/save";
import { starText } from "../../sim/reviews";
import { winReport } from "../../sim/win";

const STYLE = `
.wn-root{position:fixed;inset:0;z-index:9100;display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto;background:linear-gradient(180deg,#2a2013,#14100a);font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#1c2329}
.wn-page{width:min(460px,100%);display:flex;flex-direction:column;gap:12px}
.wn-card{background:#f8f4ea;border-radius:18px;padding:18px 20px;box-shadow:0 14px 40px rgba(0,0,0,.45)}
.wn-h{font-weight:700;font-size:1.35em;line-height:1.25;margin:0}
.wn-day{margin-top:4px;color:#6b6252;font-size:.95em}
.wn-rows{margin-top:12px;display:flex;flex-direction:column;gap:6px;font-variant-numeric:tabular-nums}
.wn-row{display:flex;justify-content:space-between;gap:12px;line-height:1.5}
.wn-row b{font-weight:700}
.wn-row.big{border-top:1.5px solid rgba(0,0,0,.12);padding-top:8px;margin-top:4px;font-size:1.1em}
.wn-note{display:flex;gap:10px;align-items:flex-start;background:rgba(250,248,242,.96);border-radius:16px;padding:11px 14px;box-shadow:0 6px 18px rgba(0,0,0,.3)}
.wn-av{flex:none;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700}
.wn-note b{display:block;font-size:.9em}
.wn-note span{font-size:.92em;color:#3a444b}
.wn-btns{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.wn-btn{min-height:48px;border-radius:24px;border:0;font:inherit;font-weight:700;cursor:pointer;background:#d9a21b;color:#2a2013}
.wn-btn.ghost{background:transparent;color:inherit;border:1.5px solid rgba(128,128,128,.55);font-weight:500}
.wn-btn:focus-visible{outline:3px solid #fff;outline-offset:2px}
`;

const money = (v: number) => `${Math.round(v).toLocaleString("vi-VN")}₫`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = "") {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function row(label: string, value: string, big = false) {
  const r = el("div", big ? "wn-row big" : "wn-row");
  r.append(el("span", "", label), el("b", "", value));
  return r;
}

function note(name: string, tint: string, initial: string, text: string) {
  const n = el("div", "wn-note");
  const a = el("span", "wn-av", initial);
  a.style.background = tint;
  const t = el("div");
  t.append(el("b", "", name), el("span", "", text));
  n.append(a, t);
  return n;
}

/** Màn thắng: đủ tiền sang chi nhánh hai, hết ván. */
export class WinView {
  private root: HTMLDivElement;

  constructor(w: SaveFile, opts: { textScale: number; onMenu: () => void; onRestart: () => void }) {
    if (!document.getElementById("wn-style")) {
      const st = document.createElement("style");
      st.id = "wn-style"; st.textContent = STYLE;
      document.head.appendChild(st);
    }
    this.root = el("div", "wn-root");
    this.root.style.fontSize = `${Math.round(15 * Math.min(opts.textScale, 1.4))}px`;
    this.root.addEventListener("keydown", (e) => e.stopPropagation(), true);

    const r = winReport(w);
    const page = el("div", "wn-page");
    const card = el("div", "wn-card");
    card.append(
      el("h1", "wn-h", `${w.shopName} đủ tiền sang chi nhánh hai`),
      el("div", "wn-day", `Ngày ${r.day}`),
    );
    const rows = el("div", "wn-rows");
    rows.append(
      row("tổng ổ đã bán", `${r.served.toLocaleString("vi-VN")} ổ`),
      row("doanh thu", money(r.revenue)),
      row("lời", money(r.profit)),
      row("sao trung bình", `${starText(r.stars)} · ${r.reviews} đánh giá`),
      row("tiền trong ống", money(r.cash), true),
    );
    card.append(rows);

    page.append(
      card,
      note("Mẹ", "#c0507a", "M", "mẹ coi chỗ giùm con rồi. mai con ghé xem nha"),
      note("Thuỳ Linh", "#2f8f83", "L", "hai quán luôn hả bà 😳 chi nhánh hai tui xin ổ đầu tiên"),
      note("Hoàng Huy", "#4f6fb3", "H", "hai quán thì ai đứng bán. tui đoán bà thuê người thôi 😏"),
    );

    const box = el("div", "wn-card");
    const btns = el("div", "wn-btns");
    const again = el("button", "wn-btn", "Chơi lại từ đầu");
    again.type = "button";
    again.onclick = () => opts.onRestart();
    const menu = el("button", "wn-btn ghost", "Về menu");
    menu.type = "button";
    menu.onclick = () => opts.onMenu();
    btns.append(again, menu);
    box.append(btns);
    page.append(box);
    this.root.append(page);
    document.body.appendChild(this.root);
    again.focus();
  }

  close() { this.root.remove(); }
}
