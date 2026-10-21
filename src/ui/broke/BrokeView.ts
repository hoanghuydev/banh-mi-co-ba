import type { SaveFile } from "../../core/save";
import { brokeReport } from "../../sim/broke";

/** Màn phá sản: tiêu đề, một dòng lý do, một nút về sảnh. */
const STYLE = `
.bk-root{position:fixed;inset:0;z-index:9100;display:flex;align-items:center;justify-content:center;background:#121820;font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#2b2f31}
.bk-page{width:min(460px,92vw);background:#efe6d2;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.5);padding:20px 22px}
.bk-h{font-weight:700;font-size:1.3em;margin:0 0 8px}
.bk-why{line-height:1.6;font-variant-numeric:tabular-nums}
.bk-bar{display:flex;justify-content:flex-end;margin-top:16px}
.bk-btn{font:inherit;font-size:.92em;padding:8px 15px;border-radius:7px;border:1px solid #2f5d8a;background:#2f5d8a;color:#fff;font-weight:700;cursor:pointer;min-height:36px}
.bk-btn:focus-visible{outline:2px solid #2f5d8a;outline-offset:2px}
`;

const money = (v: number) => `${Math.round(v).toLocaleString("vi-VN")}₫`;

export class BrokeView {
  private root: HTMLDivElement;

  constructor(w: SaveFile, opts: { textScale: number; onMenu: () => void }) {
    if (!document.getElementById("bk-style")) {
      const st = document.createElement("style");
      st.id = "bk-style"; st.textContent = STYLE;
      document.head.appendChild(st);
    }
    this.root = document.createElement("div");
    this.root.className = "bk-root";
    this.root.style.fontSize = `${Math.round(15 * opts.textScale)}px`;
    this.root.addEventListener("keydown", (e) => e.stopPropagation(), true);

    const r = brokeReport(w);
    const page = document.createElement("div");
    page.className = "bk-page";
    const h = document.createElement("div");
    h.className = "bk-h"; h.textContent = "Phá sản";
    const why = document.createElement("div");
    why.className = "bk-why";
    why.textContent = `Không đủ vốn nhập hàng cho ngày mai: cần ${money(r.need)}, gom hết tiền và đồ nghề chỉ được ${money(r.cash + r.resale)}.`;
    const bar = document.createElement("div");
    bar.className = "bk-bar";
    const menu = document.createElement("button");
    menu.className = "bk-btn"; menu.textContent = "Về sảnh";
    menu.onclick = () => opts.onMenu();
    bar.append(menu);
    page.append(h, why, bar);
    this.root.append(page);
    document.body.appendChild(this.root);
    menu.focus();
  }

  close() { this.root.remove(); }
}
