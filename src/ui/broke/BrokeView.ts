import type { SaveFile } from "../../core/save";
import { brokeReport } from "../../sim/broke";

/**
 * HẾT VỐN — màn dừng khi sáng mai không mở hàng được nữa (`sim/broke.ts`).
 *
 * Đây KHÔNG phải màn "bạn đã thua". Trò chơi này không chấm điểm ai (CANON §15 cuối mục),
 * và một người bán bánh mì hết vốn thì cũng không phải người thua cuộc — họ chỉ là hết
 * tiền lấy hàng. Nên ở đây không có chữ "thất bại", không có xếp hạng, không có "bạn đã
 * sống sót N ngày", không có gợi ý "lần sau hãy…".
 *
 * Có đúng ba thứ: một cái xe đứng không dưới mưa, cuốn sổ chốt lại bằng bốn dòng cho người
 * chơi biết VÌ SAO (không phải vì xui), và hai lối đi ra — chơi lại sáng nay, hoặc về sảnh.
 *
 * "Chơi lại ngày này" để TRƯỚC và là nút sáng: người ta tới đây vì vừa tiêu một khoản lớn,
 * và bản chụp đầu ngày (P0-02 §2.8) còn nguyên. Bắt họ bỏ cả mùa vì một cú bấm tối nay là
 * tàn nhẫn mà chẳng dạy được gì.
 */
const STYLE = `
.bk-root{position:fixed;inset:0;z-index:9100;display:flex;align-items:center;justify-content:center;background:#121820;font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#2b2f31}
.bk-page{width:min(560px,94vw);max-height:94vh;overflow:auto;background:#efe6d2;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.5)}
.bk-art{display:block;width:100%;height:auto;background:#2a3744;border-radius:10px 10px 0 0}
.bk-body{padding:18px 22px 20px}
.bk-h{font-weight:700;font-size:1.3em;margin:0 0 2px}
.bk-sub{font-style:italic;color:#4a5a6a;font-size:.95em;line-height:1.6;margin-bottom:14px}
.bk-why{background:#f6f0e1;border-radius:7px;padding:10px 13px;font-size:.9em;font-variant-numeric:tabular-nums}
.bk-r{display:flex;justify-content:space-between;gap:10px;padding:4px 0;border-bottom:1px dashed #ddd2b8}
.bk-r:last-child{border-bottom:0}
.bk-r span+span{white-space:nowrap}
.bk-r.no span+span{color:#6d624e;font-style:italic}
.bk-r.sum{border-top:1px solid #c9bb9c;border-bottom:0;margin-top:3px;padding-top:7px;font-weight:700}
.bk-r.sum span+span{color:#8e3b2d}
.bk-bar{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}
.bk-btn{font:inherit;font-size:.92em;padding:8px 15px;border-radius:7px;border:1px solid #b8ab8e;background:#fbf7ec;color:#2b2f31;cursor:pointer;min-height:36px}
.bk-btn.primary{background:#2f5d8a;color:#fff;border-color:#2f5d8a;font-weight:700}
.bk-btn:focus-visible{outline:2px solid #2f5d8a;outline-offset:2px}
@media (prefers-reduced-motion: reduce){.bk-rain{display:none}}
.bk-still .bk-rain{display:none}
`;

const money = (v: number) => `${Math.round(v).toLocaleString("vi-VN")}₫`;

/**
 * Cái xe đứng không dưới mưa. Vẽ bằng SVG chứ không bằng ảnh: trang này phải đọc được ở
 * mọi cỡ chữ và mọi độ phân giải, và nó là thứ DUY NHẤT trong bản dựng không vẽ bằng
 * Phaser — nó sống trong lớp DOM cùng với cuốn sổ.
 *
 * Giữ cho nó BUỒN mà THƯƠNG, không thảm: cái dù còn bung, bóng đèn còn sáng một chút, và
 * có con chó nhỏ ngồi đợi bên cạnh. Một cái xe trống dưới mưa mà không có ai bên cạnh thì
 * thành ra trừng phạt, mà trừng phạt không phải là giọng của trò chơi này.
 */
function art(): string {
  const drops = Array.from({ length: 26 }, (_, i) => {
    const x = 8 + ((i * 47) % 304), delay = ((i * 7) % 11) / 11, dur = 0.7 + ((i * 3) % 5) / 10;
    return `<line class="bk-rain" x1="${x}" y1="-10" x2="${x - 5}" y2="4" stroke="#9fb4c6" stroke-width="1.1" opacity=".5">`
      + `<animateTransform attributeName="transform" type="translate" values="0 0; 6 190" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>`
      + `</line>`;
  }).join("");
  return `
<svg class="bk-art" viewBox="0 0 320 180" role="img" aria-label="Cái xe bánh mì đứng không dưới mưa, có con chó nhỏ ngồi đợi bên cạnh">
  <defs>
    <linearGradient id="bk-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#232f3c"/><stop offset="1" stop-color="#36485a"/>
    </linearGradient>
    <radialGradient id="bk-glow" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#ffd98a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="320" height="180" fill="url(#bk-sky)"/>
  ${drops}
  <rect y="146" width="320" height="34" fill="#2b3845"/>
  <ellipse cx="196" cy="162" rx="52" ry="6" fill="#3b4b5c" opacity=".8"/>

  <!-- dù che, còn bung -->
  <path d="M96 62 Q150 30 204 62 Z" fill="#b8503f"/>
  <path d="M96 62 q18 9 27 0 q18 9 27 0 q18 9 27 0 q18 9 27 0" fill="none" stroke="#8e3b2d" stroke-width="2.4"/>
  <line x1="150" y1="62" x2="150" y2="96" stroke="#7b6a52" stroke-width="2.4"/>

  <!-- bóng đèn treo DƯỚI mái dù, còn sáng — đúng kiểu cái xe bánh mì buổi tối. Treo trên
       nóc dù thì nó thành đèn đường, mà đèn đường thì không phải của mình. -->
  <line x1="176" y1="56" x2="176" y2="73" stroke="#55667a" stroke-width="1.2"/>
  <circle cx="176" cy="78" r="5" fill="#ffd98a" opacity=".92"/>
  <circle cx="176" cy="80" r="36" fill="url(#bk-glow)"/>

  <!-- cái xe: tủ kính trống -->
  <rect x="112" y="96" width="98" height="40" rx="4" fill="#d8cdb3"/>
  <rect x="118" y="101" width="86" height="24" rx="2" fill="#2f3f4d" opacity=".55"/>
  <line x1="118" y1="113" x2="204" y2="113" stroke="#8fa3b4" stroke-width="1" opacity=".5"/>
  <rect x="112" y="136" width="98" height="6" rx="2" fill="#b8ab8e"/>
  <circle cx="132" cy="147" r="7.5" fill="#3d4b58" stroke="#59697a" stroke-width="2"/>
  <circle cx="190" cy="147" r="7.5" fill="#3d4b58" stroke="#59697a" stroke-width="2"/>

  <!-- cái ghế nhựa ngã -->
  <g transform="translate(248 140) rotate(-74)">
    <rect x="0" y="0" width="17" height="4" rx="1.6" fill="#c8543f"/>
    <rect x="1.5" y="4" width="3" height="11" rx="1.2" fill="#c8543f"/>
    <rect x="12.5" y="4" width="3" height="11" rx="1.2" fill="#c8543f"/>
  </g>

  <!-- con chó nhỏ ngồi đợi -->
  <g transform="translate(74 118)">
    <ellipse cx="13" cy="26" rx="12" ry="5" fill="#2b3845" opacity=".55"/>
    <path d="M6 26 q-1 -14 7 -14 q8 0 7 14 Z" fill="#c9a071"/>
    <path d="M18 26 q6 -2 7 1 q-3 3 -7 2 Z" fill="#c9a071"/>
    <circle cx="13" cy="8" r="7.5" fill="#d7ad7c"/>
    <path d="M6.5 4 q-2.5 -1 -3 4 q3 1.5 4.5 -1 Z" fill="#b1875e"/>
    <path d="M19.5 4 q2.5 -1 3 4 q-3 1.5 -4.5 -1 Z" fill="#b1875e"/>
    <circle cx="10.4" cy="8" r="1.1" fill="#3a2c1e"/>
    <circle cx="15.6" cy="8" r="1.1" fill="#3a2c1e"/>
    <ellipse cx="13" cy="11.2" rx="1.6" ry="1.2" fill="#3a2c1e"/>
  </g>
</svg>`;
}

export class BrokeView {
  private root: HTMLDivElement;

  constructor(private w: SaveFile,
    private opts: { textScale: number; reducedMotion: boolean; canReplay: boolean; onReplay: () => void; onMenu: () => void }) {
    if (!document.getElementById("bk-style")) {
      const st = document.createElement("style");
      st.id = "bk-style"; st.textContent = STYLE;
      document.head.appendChild(st);
    }
    this.root = document.createElement("div");
    this.root.className = `bk-root${opts.reducedMotion ? " bk-still" : ""}`;
    this.root.style.fontSize = `${Math.round(15 * opts.textScale)}px`;
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

  private render() {
    const r = brokeReport(this.w);
    const page = this.el("div", "bk-page");
    const art_ = this.el("div");
    art_.innerHTML = art();
    page.append(art_.firstElementChild!);

    const body = this.el("div", "bk-body");
    body.append(this.el("div", "bk-h", "Hết vốn."));
    body.append(this.el("div", "bk-sub", `Cô Ba: "Thôi con. Sáng mai không có tiền lấy hàng thì mình không dọn ra được."`));

    // BỐN DÒNG CỘNG LẠI, rồi một dòng chốt. Người chơi phải đọc ra được là chuyện này tới từ
    // đâu — một màn dừng không nói lý do thì đọc y như một cái bug.
    //
    // Dòng chốt không phải để cho đẹp: `sim/broke.ts` dừng mùa khi CỘNG cả ba đường xoay vẫn
    // không đủ, nên bỏ nó đi thì bốn dòng trên thành bốn con số rời. Người chơi còn 23.000₫
    // đồ bán được sẽ đọc ra "tôi còn đồ bán mà sao lại dừng" — tức là đọc ra một cái bug.
    const why = this.el("div", "bk-why");
    const row = (a: string, b: string, no = false) => {
      const x = this.el("div", `bk-r${no ? " no" : ""}`);
      x.append(this.el("span", "", a), this.el("span", "", b));
      why.append(x);
    };
    row("trong ống", money(r.cash));
    row("rổ nhỏ nhất cho sáng mai", money(r.need));
    row("bán đồ trên xe", r.resale > 0 ? money(r.resale) : "xe không còn gì bán", r.resale <= 0);
    row("nguồn hàng ngoài chợ cho nợ thêm", r.credit > 0 ? money(r.credit) : "không ai cho nợ thêm", r.credit <= 0);
    const thieu = Math.max(0, r.need - (r.cash + r.resale + r.credit));
    const sum = this.el("div", "bk-r sum");
    sum.append(this.el("span", "", "gom hết cũng còn thiếu"), this.el("span", "", money(thieu)));
    why.append(sum);
    body.append(why);

    const bar = this.el("div", "bk-bar");
    if (this.opts.canReplay) {
      const again = this.el("button", "bk-btn primary", "Chơi lại từ sáng nay");
      again.onclick = () => this.opts.onReplay();
      bar.append(again);
    }
    const menu = this.el("button", `bk-btn${this.opts.canReplay ? "" : " primary"}`, "Về sảnh");
    menu.onclick = () => this.opts.onMenu();
    bar.append(menu);
    body.append(bar);

    page.append(body);
    this.root.replaceChildren(page);
    (this.root.querySelector("button") as HTMLButtonElement | null)?.focus();
  }

  close() { this.root.remove(); }
}
