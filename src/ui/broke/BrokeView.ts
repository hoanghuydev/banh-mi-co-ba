import type { SaveFile } from "../../core/save";
import { REWIND_ASK } from "../../content/system";
import { brokeReport } from "../../sim/broke";
import { SICK_WINDOW_DAYS, attpCheck, average, starText } from "../../sim/reviews";
import { linked } from "../../sim/system";

const STYLE = `
.bk-root{position:fixed;inset:0;z-index:9100;display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto;background:linear-gradient(180deg,#1b2430,#10151c);font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#1c2329}
.bk-page{width:min(460px,100%);display:flex;flex-direction:column;gap:12px}
.bk-card{background:#f4f1ea;border-radius:18px;padding:18px 20px;box-shadow:0 14px 40px rgba(0,0,0,.45)}
.bk-h{font-weight:700;font-size:1.35em;line-height:1.25;margin:0}
.bk-why{margin-top:8px;line-height:1.55;color:#3a444b;font-variant-numeric:tabular-nums}
.bk-note{display:flex;gap:10px;align-items:flex-start;background:rgba(250,248,242,.96);border-radius:16px;padding:11px 14px;box-shadow:0 6px 18px rgba(0,0,0,.3)}
.bk-av{flex:none;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700}
.bk-note b{display:block;font-size:.9em}
.bk-note span{font-size:.92em;color:#3a444b}
.bk-sys{background:#0f1430;color:#e8ecff;border:1px solid #ffd84a;border-radius:18px;padding:16px 18px}
.bk-sys p{margin:0 0 6px;line-height:1.5}
.bk-btns{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.bk-btn{min-height:48px;border-radius:24px;border:0;font:inherit;font-weight:700;cursor:pointer;background:#c0392b;color:#fff}
.bk-btn.gold{background:#ffd84a;color:#0f1430}
.bk-btn.ghost{background:transparent;color:inherit;border:1.5px solid rgba(128,128,128,.55);font-weight:500}
.bk-btn:focus-visible{outline:3px solid #fff;outline-offset:2px}
`;

const money = (v: number) => `${Math.round(v).toLocaleString("vi-VN")}₫`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = "") {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function note(name: string, tint: string, initial: string, text: string) {
  const n = el("div", "bk-note");
  const a = el("span", "bk-av", initial);
  a.style.background = tint;
  const t = el("div");
  t.append(el("b", "", name), el("span", "", text));
  n.append(a, t);
  return n;
}

/** Màn thua: lý do, vài tin nhắn sáng hôm sau, rồi lối chơi lại. */
export class BrokeView {
  private root: HTMLDivElement;

  constructor(w: SaveFile, opts: { textScale: number; onMenu: () => void; onRestart: () => void }) {
    if (!document.getElementById("bk-style")) {
      const st = document.createElement("style");
      st.id = "bk-style"; st.textContent = STYLE;
      document.head.appendChild(st);
    }
    this.root = el("div", "bk-root");
    this.root.style.fontSize = `${Math.round(15 * Math.min(opts.textScale, 1.4))}px`;
    this.root.addEventListener("keydown", (e) => e.stopPropagation(), true);

    const attp = !!w.flags.shutdown;
    const page = el("div", "bk-page");
    const card = el("div", "bk-card");
    card.append(el("h1", "bk-h", `Quán ${w.shopName} đóng cửa sau ${w.progress.dayIndex} ngày`));
    if (attp) {
      const a = attpCheck(w);
      card.append(el("div", "bk-why",
        `Bị đình chỉ vì an toàn thực phẩm: ${a.n} đánh giá đau bụng trong ${SICK_WINDOW_DAYS} ngày, sao trung bình ${starText(average(w))}.`));
    } else {
      const r = brokeReport(w);
      card.append(el("div", "bk-why",
        `Tiền quán còn ${money(r.cash + r.resale)}, không đủ nhập hàng cho ngày mai (cần ${money(r.need)}).`));
    }
    page.append(
      card,
      note("Sếp Tùng", "#5b6b7a", "T", "công ty vẫn đang tuyển đó em"),
      note("Hoàng Huy", "#4f6fb3", "H", attp
        ? "quán bị đóng cửa hả 🤣 ăn bẩn thì phải chịu thôi"
        : "tui nói rồi mà 🤷 tui sắp lên trưởng nhóm đó nha"),
    );

    const isLinked = linked(w);
    const box = el("div", isLinked ? "bk-sys" : "bk-card");
    if (isLinked) for (const l of REWIND_ASK) box.append(el("p", "", l));
    const btns = el("div", "bk-btns");
    const again = el("button", isLinked ? "bk-btn gold" : "bk-btn", isLinked ? "Quay ngược thời gian" : "Chơi lại từ đầu");
    again.type = "button";
    again.onclick = () => opts.onRestart();
    const menu = el("button", "bk-btn ghost", "Về menu");
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
