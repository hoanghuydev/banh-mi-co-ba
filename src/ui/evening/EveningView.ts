import type { SaveFile } from "../../core/save";
import { SEASON_DAYS } from "../../core/save";
import { ECON, WEEKDAY_VI, weekdayIdx } from "../../sim/econ";
import { RECONCILE_DAYS, debtGap } from "../../sim/till";
import { STANDS, STAND_IDS } from "../../sim/stands";
import { creditBookOpen, standsOpen } from "../../sim/season";
import { doAction, eveningActions } from "../../sim/story";
import { canMoveTo, postMove, scout } from "../../sim/day";
import { rentVnd } from "../../sim/obligations";
import {
  EQUIP, EQUIP_GROUPS, EQUIP_IDS, GROUP_IDS, buyEquip, capacity, has, priceVnd, resaleVnd, sellEquip,
  unlocked, used, whyNot, type EquipId,
} from "../../sim/equipment";
import { evidenceFor, hasEvidence } from "../../sim/gearHint";
import { displayName } from "../../sim/notebook";
import {
  canTakeHui, duesOpen, huiPayoutVnd, pay, takeHui, upcoming, type Due,
} from "../../sim/obligations";

/**
 * Cảnh tối — P3-01 pha EVENING / P3-06 §3 UI. Không đồng hồ, không khách, không ai nhìn.
 *
 *   Đếm tiền:   bán được bao nhiêu · chợ sáng · tiền chỗ · than đá túi · gửi về nhà · trong ống
 *   Sổ nghĩa vụ: chữ viết tay, ngày + số tiền, hai nút [trả] [để mai]. KHÔNG có tổng, KHÔNG màu
 *               đỏ, KHÔNG "còn N ngày" (P3-06 §3). Lời nhắc là lời NGƯỜI nói, không phải đồng hồ.
 *
 * ── BỐ CỤC (viết lại sau playtest: *"UX UI cũng không tốt"*) ───────────────────────────
 *
 * Trang tối là một cuốn sổ mở: TRÁI là cái đã xảy ra (không bấm được), PHẢI là việc tối nay
 * (bấm được). Ba luật giữ cho nó đọc được:
 *
 *  1. ĐIỀU HƯỚNG Ở TRÊN, VIỆC Ở DƯỚI. Mấy cái thẻ (Sổ nợ / Đồ nghề / Chỗ đứng) là *đang xem
 *     trang nào* — chúng nằm trên đầu trang phải. Chân trang chỉ còn hai nút *làm gì tiếp*:
 *     mở sổ tay, đi ngủ. Bản cũ nhét cả năm nút vào một hàng ở chân, nên "Đồ nghề" (đổi trang)
 *     nằm ngay cạnh "Đi ngủ" (hết ngày, không lùi được) — hai thứ khác hạng, một cú bấm trượt.
 *  2. MỘT THỨ MỘT KIỂU CHỮ. Số thì cột đều, lời người nói thì nghiêng có vạch lề, chữ con ghi
 *     thì mực xanh. Bản cũ lấy `.ev-ink` (mực xanh = *con ghi*) làm tiêu đề cho cả tên món đồ
 *     nghề, nên cái giọng "chữ viết tay" mất hết nghĩa.
 *  3. QUÉT TRƯỚC, ĐỌC SAU. Tên + giá đứng một hàng; chỗ trên xe và tiền mỗi ngày thành *thẻ số*
 *     tách khỏi câu chữ; câu cảm giác và cái giá nằm dưới. Bản cũ nối hết bằng dấu "·" thành
 *     một dòng tiêu đề dài hai hàng — đúng cái bệnh `MarketView` đã chữa.
 */
const STYLE = `
.ev-root{position:fixed;inset:0;z-index:8990;display:flex;align-items:center;justify-content:center;background:rgba(14,18,22,.45);font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#2b2f31}
/* hai hàng RÕ RÀNG: hàng sổ co được (minmax(0,1fr) — không có nó thì hàng tự phình theo nội
   dung, đẩy chân trang ra ngoài max-height và overflow:auto của .ev-col không bao giờ chạy),
   hàng chân trang đúng bằng nội dung. MarketView dùng flex cũng là cùng một ý.
   Cột phải RỘNG HƠN cột trái: cột trái là một cột số cố định, cột phải phải chứa thẻ đồ nghề. */
.ev-book{width:min(900px,95vw);max-height:94vh;display:grid;grid-template-columns:minmax(0,.86fr) minmax(0,1.14fr);grid-template-rows:minmax(0,1fr) auto;background:#efe6d2;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.45);overflow:hidden}
.ev-col{padding:14px 18px;overflow:auto;min-height:0}
/* index.html §CANON 15: CHỈ dùng font đã nạp VÀ có dấu. Be Vietnam Pro (9 face: 3 nét ×
   latin / latin-ext / vietnamese) là font duy nhất bản dựng nạp. Consolas / "Segoe Print"
   không có bảng tiếng Việt → trình duyệt ghép dấu rời: "tiêǹ chô˜", "gưỉ vê nhà".
   Cảm giác máy đánh giữ bằng cột số đều (tabular-nums) + giãn chữ, không bằng font thiếu dấu. */
.ev-left{border-right:2px solid #cdbf9f;font-size:.92em;letter-spacing:.02em;font-variant-numeric:tabular-nums}
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

/* ── trang phải: thẻ điều hướng ở TRÊN, ruột cuộn ở giữa ── */
.ev-page{display:flex;flex-direction:column;min-height:0;background:#f6f0e1}
.ev-tabs{display:flex;gap:2px;padding:10px 18px 0;border-bottom:2px solid #cdbf9f;flex:0 0 auto}
.ev-tab{font:inherit;font-size:.9em;padding:7px 13px;border:1px solid transparent;border-bottom:0;border-radius:7px 7px 0 0;background:transparent;color:#6d624e;cursor:pointer;min-height:34px;margin-bottom:-2px;display:flex;align-items:center;gap:6px}
.ev-tab:hover{color:#2b2f31}
/* trang đang mở DÍNH LIỀN vô tờ giấy bên dưới — viền dưới của nó phải biến mất, không phải
   đổi màu nền cho đậm hơn. Thẻ "tô đậm" mà vẫn nằm tách khỏi ruột thì đọc như một cái nút. */
.ev-tab.on{background:#f6f0e1;border-color:#cdbf9f;color:#2b2f31;font-weight:700;border-bottom:2px solid #f6f0e1}
.ev-tab:focus-visible{outline:2px solid #2f5d8a;outline-offset:-2px}
/* chấm = "trang này còn việc chưa làm". KHÔNG phải con số đếm ngược (P3-06 §3 cấm "còn N ngày") */
.ev-dot{width:7px;height:7px;border-radius:50%;background:#2f5d8a;flex:0 0 auto}
.ev-sheet{overflow:auto;min-height:0;flex:1;padding:12px 18px 16px}

/* ── nhóm + thẻ món ── */
.ev-grp{margin:14px 0 6px;font-size:.78em;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#8a7d64}
.ev-grp:first-child{margin-top:2px}
.ev-card{border:1px solid #ddd2b8;border-radius:8px;background:#fbf7ec;padding:9px 11px;margin-bottom:7px}
.ev-card.lock{background:transparent;border-style:dashed}
.ev-top{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.ev-name{font-weight:700;font-size:.98em}
.ev-price{font-size:.92em;font-variant-numeric:tabular-nums;white-space:nowrap}
.ev-price.cant{color:#8a7d64}
.ev-chips{display:flex;gap:5px;flex-wrap:wrap;margin:5px 0 4px}
.ev-chip{font-size:.74em;color:#7a6f5b;background:#f0e8d4;border:1px solid #e0d6bf;border-radius:5px;padding:1px 7px}
.ev-feel{font-size:.88em;line-height:1.5}
/* LỢI ÍCH quy ra chỉ số. Mỗi dòng một dấu cộng, mực xanh lá: mắt đọc ra "được", không phải
   "phải cân nhắc". Kế thừa chỗ của khối cái-giá cũ (.ev-cost, đã bỏ cùng drawbacks). */
.ev-gain{margin-top:6px;padding-left:9px;border-left:2px solid #bcd3b4;font-size:.84em;color:#4a6b45;line-height:1.55}
.ev-gain div{margin:1px 0}
.ev-gain div::before{content:"+ ";font-weight:700;opacity:.65}
/* dấu vết hôm nay: mực xanh như chữ con ghi, vì đây LÀ chuyện của con, không phải lời rao hàng */
.ev-mark{margin-top:7px;font-size:.85em;color:#2f5d8a;font-style:italic;letter-spacing:.015em}
.ev-card.mark{border-color:#bcc9d6;background:#f7f4ea}
.ev-own{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:5px 2px;border-bottom:1px dashed #e0d6bf}
.ev-own .ev-name{font-weight:500}
.ev-own.hi{background:#f1e7cf;border-radius:5px;padding:5px 6px;border-bottom-color:transparent}

/* ── mặt xe: mỗi ô là một chỗ. Đếm bằng mắt, KHÔNG có "8/14" (P3-04 §4) ── */
.ev-cart{background:#f0e8d4;border:1px solid #e0d6bf;border-radius:8px;padding:9px 11px}
.ev-slots{display:flex;gap:7px;flex-wrap:wrap;margin:6px 0 5px}
.ev-blk{display:flex;gap:2px}
.ev-cell{width:15px;height:15px;border-radius:3px;border:1px solid #b8ab8e;background:#8a7a60}
.ev-cell.free{background:rgba(184,171,142,.16)}
/* rê chuột lên nút mua → đúng bằng ấy ô trống sáng lên. Trả lời "món này ăn mấy chỗ" bằng
   chính mặt xe, khỏi bắt người chơi trừ nhẩm hai con số (P3-04 §4: ô sáng nhẹ khi rê chuột). */
.ev-cell.ghost{background:#2f5d8a;border-color:#2f5d8a}
.ev-blk.hi .ev-cell{background:#2f5d8a;border-color:#2f5d8a}
/* món sắp bị thay: khối của nó rỗng ra — mấy chỗ đó sắp trả lại cho cái xe */
.ev-blk.out .ev-cell{background:rgba(184,171,142,.16);border-style:dashed}

.ev-due{padding:7px 0;border-bottom:1px dashed #d8cdb3}
.ev-due:last-child{border-bottom:0}
/* "chữ viết tay": mực xanh + nghiêng + giãn chữ. Không có face viết tay nào có dấu tiếng
   Việt được nạp, mà chữ vỡ dấu thì đọc còn tệ hơn là không có nét viết tay.
   CHỈ dùng cho thứ CON GHI (sổ nợ, sổ bán chịu) — không dùng làm tiêu đề linh tinh. */
.ev-ink{font-style:italic;letter-spacing:.015em;color:#2f5d8a}
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
.ev-empty{color:#8a7d64;font-style:italic;font-size:.88em;padding:10px 0;line-height:1.6}
.ev-foot{grid-column:1/3;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 18px;border-top:2px solid #cdbf9f;background:#efe6d2}
.ev-msg{font-size:.85em;color:#6d624e;font-style:italic}
.ev-acts{display:flex;gap:8px;margin-left:auto}
`;

const money = (v: number) => `${Math.round(v).toLocaleString("vi-VN")}₫`;
const signed = (v: number) => `${v < 0 ? "+" : "−"}${money(Math.abs(v))}`;

/**
 * Biên con số ghi được vào sổ bán chịu (P3-03 §2.6 "bịt ăn gian (h)").
 *
 * Ghi rồi thì con số ghi LUÔN THẮNG: `recalledAmount` trả thẳng `playerWrote`, và `debtGap`
 * bỏ qua mọi record đã ghi nên đối sổ với cô Ba cũng không cãi. Ô trống không kẹp = máy in
 * tiền (gõ 9999 cho một ổ 25 ngàn thì mai khách trả 9.999.000₫).
 *
 * KHÔNG ép bằng đúng `trueAmount`: nhớ nhầm là cơ chế P3-02, ghi sai vài ngàn phải được.
 * Biên ±50% (tối thiểu ±10 ngàn cho khoản nhỏ) chọn theo chính mức khách tự nhớ lệch ở
 * `recalledAmount`: bias ±0,11 + drift 0,04/ngày × trần 10 ngày ≈ ±0,5 ở 2σ. Rộng bằng đó
 * thì không cắt mất cái nhớ nhầm thật — mà người chơi ghi NGAY TỐI HÔM ĐÓ còn nhớ rõ hơn
 * khách nhớ sau mười ngày — chỉ cắt con số phi lý.
 */
const WRITE_SLACK = 0.5, WRITE_SLACK_MIN = 10_000;
const writeSlack = (t: number) => Math.max(t * WRITE_SLACK, WRITE_SLACK_MIN);
const writeFloor = (t: number) => Math.max(1000, Math.round((t - writeSlack(t)) / 1000) * 1000);
const writeCeil = (t: number) => Math.round((t + writeSlack(t)) / 1000) * 1000;

const DUE_TEXT: Record<Due["kind"], (d: Due) => string> = {
  HUI: (d) => `ngày ${d.dueDay} · góp hụi kỳ ${d.id.split("_")[1]} (cô Mai)`,
  TIEN_HOC: (d) => `ngày ${d.dueDay} · tiền học của em`,
  TIEN_THUOC: () => `tiền thuốc của cô Ba`,
};

type Tab = "debts" | "gear" | "stand";

export class EveningView {
  private root: HTMLDivElement;
  private deferred = new Set<string>();
  private msg = "";
  private tab: Tab = "debts";
  /** Bước xác nhận của một món (CANON §15.5). Chỉ MỘT món hỏi một lúc. */
  private ask: { kind: "buy" | "sell"; id: EquipId } | null = null;
  /** Mấy ô trên mặt xe đang được một thẻ "soi" — rê chuột lên nút mua / lên dòng món đã có. */
  private slotsEl: HTMLElement | null = null;

  constructor(private w: SaveFile,
    private opts: { textScale: number; lines?: string[]; onBook: () => void; onSleep: () => void }) {
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
    const keep = this.root.querySelector(".ev-sheet")?.scrollTop ?? 0;
    this.root.replaceChildren();
    this.slotsEl = null;
    const book = this.el("div", "ev-book");
    const page = this.el("div", "ev-page");
    page.append(this.tabs());
    const sheet = this.el("div", "ev-sheet");
    sheet.append(...(this.tab === "gear" ? this.gear() : this.tab === "stand" ? this.stands() : this.debts()));
    page.append(sheet);
    book.append(this.ledger(), page, this.foot());
    this.root.append(book);
    sheet.scrollTop = keep;
  }

  // ─────────────────────────────────────────────── trái: đếm tiền (máy ghi, không phán xét)

  private ledger() {
    const w = this.w, day = w.progress.dayIndex, e = w.econ, t = w.progress.today, et = e.today;
    const L = this.el("div", "ev-col ev-left");
    L.append(this.el("div", "ev-h", `Tối ngày ${day} — ${WEEKDAY_VI[weekdayIdx(day)]}`));
    const row = (a: string, b: string, dir: "in" | "out" | "" = "out") => {
      const r = this.el("div", `ev-r${dir ? ` ${dir}` : ""}`);
      r.append(this.el("span", "", a), this.el("span", "", b));
      L.append(r);
    };
    // Sổ phải cộng lại ĐÚNG bằng cái két: mỗi đồng ra/vào hôm nay có một dòng, không gộp,
    // không giấu. Thứ tự theo lúc tiền đi trong ngày (chợ sáng → tiền chỗ → tối đếm).
    row(`bán được ${t.served} ổ`, `+${money(t.revenue)}`, "in");
    if (et.market) row("chợ sáng", `−${money(et.market)}`);
    if (et.debtRepay) row("trả nợ nguồn hàng ở chợ", `−${money(et.debtRepay)}`);
    if (et.rent) row("tiền chỗ", `−${money(et.rent)}`);
    if (et.deposit) row(et.deposit < 0 ? "cọc chỗ cũ trả lại" : "cọc chỗ mới", signed(et.deposit), et.deposit < 0 ? "in" : "out");
    if (et.tools) row(et.tools < 0 ? "bán đồ nghề" : "sắm đồ nghề", signed(et.tools), et.tools < 0 ? "in" : "out");
    if (et.story) row("chuyện trong hẻm", `−${money(et.story)}`);
    if (et.hui) row(et.hui < 0 ? "hốt hụi" : "góp hụi", signed(et.hui), et.hui < 0 ? "in" : "out");
    if (et.obligations) row("tiền học, tiền thuốc", `−${money(et.obligations)}`);
    row("than, đá, túi, xăng", `−${money(et.fixed)}`);
    if (et.coBaCovered) row("cô Ba bù giúp", `(${money(et.coBaCovered)})`);
    // "gửi thiếu −0₫" đọc như lỗi hiển thị, mà số thiếu THẬT thì không hiện ở đâu
    row("gửi về nhà", et.sendHome ? `−${money(et.sendHome)}` : "chưa gửi được");
    if (et.sendHomeShort) row("còn thiếu", `(${money(et.sendHomeShort)})`);
    const cash = this.el("div", "ev-cash");
    cash.append(this.el("span", "", "trong ống"), this.el("span", "", money(w.money.cash)));
    L.append(cash);

    // Mọi câu NGƯỜI NÓI gom vô một khối có vạch lề, dưới cột số — không xen giữa mấy dòng tiền.
    const says = this.el("div", "ev-says");
    if (e.coBaCovered.includes(day)) says.append(this.el("div", "ev-say", `Cô Ba: "Két không đủ tiền than, cô bù rồi. Kệ, mai bán."`));
    if (e.rentOwed) says.append(this.el("div", "ev-say", `Chủ nhà: "Tiền chỗ mấy bữa nay con tính sao?"`));
    for (const l of this.opts.lines ?? []) says.append(this.el("div", "ev-say", l));
    if (t.lost) says.append(this.el("div", "ev-note", "có người đợi không nổi rồi về"));
    if (et.soldOut) says.append(this.el("div", "ev-note", "có người tới mà hết bánh"));
    if (et.wasted.length) says.append(this.el("div", "ev-note", `sáng nay bỏ (hư): ${et.wasted.join(", ")}`));
    if (says.childElementCount) L.append(says);
    return L;
  }

  // ─────────────────────────────────────────────── thẻ điều hướng + chân trang

  /** Trang này còn việc tối nay chưa làm chưa? Một CHẤM, không phải con số. */
  private pending(tab: Tab): boolean {
    const w = this.w, day = w.progress.dayIndex, e = w.econ;
    if (tab === "debts") {
      if (duesOpen(e, day).some((d) => !this.deferred.has(d.id))) return true;
      const p = canTakeHui(e, day);
      if (p && !this.deferred.has(`hui_take_${p}`)) return true;
      if (eveningActions(day, w.story).length) return true;
      return creditBookOpen(day) && (w.money.debtsOwedToPlayer ?? []).some((d) => d.day === day && d.playerWrote === null);
    }
    if (tab === "stand") return STAND_IDS.some((id) => !e.scouted.includes(id));
    return false;
  }

  private tabs() {
    const day = this.w.progress.dayIndex;
    const bar = this.el("div", "ev-tabs");
    bar.setAttribute("role", "tablist");
    const list: [Tab, string][] = [["debts", "Sổ nợ nần"], ["gear", "Đồ nghề"]];
    if (standsOpen(day)) list.push(["stand", "Chỗ đứng"]);
    for (const [id, label] of list) {
      const b = this.el("button", `ev-tab${this.tab === id ? " on" : ""}`, label);
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", String(this.tab === id));
      if (this.pending(id)) {
        const dot = this.el("span", "ev-dot");
        dot.title = "còn việc";
        b.append(dot);
      }
      b.onclick = () => { this.tab = id; this.msg = ""; this.ask = null; this.render(); };
      bar.append(b);
    }
    return bar;
  }

  private foot() {
    const day = this.w.progress.dayIndex;
    const foot = this.el("div", "ev-foot");
    if (this.msg) foot.append(this.el("div", "ev-msg", this.msg));
    const acts = this.el("div", "ev-acts");
    const nb = this.el("button", "ev-btn", "Mở sổ tay");
    nb.onclick = () => this.opts.onBook();
    const sleep = this.el("button", "ev-btn primary", day >= SEASON_DAYS ? "Về sảnh" : "Đi ngủ");
    sleep.onclick = () => this.opts.onSleep();
    acts.append(nb, sleep);
    foot.append(acts);
    return foot;
  }

  // ─────────────────────────────────────────────── trang: sổ nợ nần

  private debts(): HTMLElement[] {
    const w = this.w, day = w.progress.dayIndex, e = w.econ;
    const out: HTMLElement[] = [];
    // P4-03 — chuyện trong hẻm: làm hay không là chuyện của con (E2: đưa vật / thân thể; không bấm = không làm gì)
    const acts = eveningActions(day, w.story);
    if (acts.length) {
      out.push(this.el("div", "ev-grp", "Chuyện trong hẻm"));
      for (const a of acts) {
        const box = this.el("div", "ev-due");
        const b = this.el("button", "ev-btn", a.costVnd ? `${a.label} (${money(a.costVnd)})` : a.label);
        b.disabled = (a.costVnd ?? 0) > w.money.cash;
        b.onclick = () => {
          // tiền ra khỏi két thì phải có một dòng trong sổ tối — nếu không thì sáng mai
          // hụt tiền mà không biết vì đâu (`today.story`, quy ước dương = tiền ra)
          if (a.costVnd) { w.money.cash -= a.costVnd; e.today.story += a.costVnd; }
          this.msg = doAction(w.story, a.id, day);
          this.render();
        };
        box.append(b);
        out.push(box);
      }
    }

    out.push(this.el("div", "ev-grp", "Phải trả"));
    const hoc = [...upcoming(e, day, 6), ...duesOpen(e, day)].find((d) => d.kind === "TIEN_HOC");
    if (hoc) {
      const says = this.el("div", "ev-says");
      says.append(this.el("div", "ev-say", `Điện thoại — em: "Chị ơi em thi thử được tám phẩy hai."`));
      says.append(this.el("div", "ev-say", `"Ngày ${hoc.dueDay} đóng tiền học nghen chị."`));
      out.push(says);
    }
    const dues = duesOpen(e, day);
    if (!dues.length) out.push(this.el("div", "ev-empty", "Hôm nay không ai đòi gì."));
    for (const d of dues) {
      const box = this.el("div", "ev-due");
      const top = this.el("div", "ev-top");
      top.append(this.el("span", "ev-ink", DUE_TEXT[d.kind](d)), this.el("span", "ev-price ev-ink", money(d.amount)));
      box.append(top);
      if (d.kind === "HUI" && day === d.lastDay && day > d.dueDay) box.append(this.el("div", "ev-say", `Cô Mai: "Bữa nay chót rồi đó con."`));
      if (d.kind === "TIEN_THUOC") box.append(this.el("div", "ev-note", "vỉ thuốc để trên bàn"));
      const btns = this.el("div", "btns");
      const p = this.el("button", "ev-btn primary", d.kind === "HUI" ? "góp" : "gửi");
      p.disabled = w.money.cash < d.amount;
      p.onclick = () => {
        if (pay(e, w.money, d, day)) { this.msg = ""; this.render(); }
      };
      btns.append(p);
      if (p.disabled) btns.append(this.el("span", "ev-why", `trong ống còn thiếu ${money(d.amount - w.money.cash)}`));
      if (d.mandatory && day < d.lastDay || !d.mandatory) {
        const later = this.el("button", "ev-btn quiet", "để mai");
        later.onclick = () => { this.deferred.add(d.id); this.render(); };
        if (!this.deferred.has(d.id)) btns.append(later);
      }
      box.append(btns);
      out.push(box);
    }

    const period = canTakeHui(e, day);
    if (period && !this.deferred.has(`hui_take_${period}`)) {
      const now = huiPayoutVnd(period), next = huiPayoutVnd(period + 1);
      const box = this.el("div", "ev-due");
      box.append(this.el("div", "ev-say", next
        ? `Cô Mai: "Kỳ này con hốt là ${money(now)}. Hốt kỳ sau thì được ${money(next)}."`
        : `Cô Mai: "Kỳ chót rồi con. Con hốt đi, ${money(now)}."`));
      const btns = this.el("div", "btns");
      const take = this.el("button", "ev-btn primary", "hốt");
      take.onclick = () => { takeHui(e, w.money, day); this.render(); };
      btns.append(take);
      if (next) {
        const wait = this.el("button", "ev-btn quiet", "để kỳ sau");
        // gỡ mỗi cái khung thì đổi qua trang Đồ nghề rồi quay lại là lời mời hiện lại y
        // nguyên. Nhớ như "để mai" của nghĩa vụ.
        wait.onclick = () => { this.deferred.add(`hui_take_${period}`); this.render(); };
        btns.append(wait);
      }
      box.append(btns);
      out.push(box);
    }

    const debts = w.money.debtsOwedToPlayer ?? [];
    const unwritten = creditBookOpen(day) ? debts.filter((d) => d.day === day && d.playerWrote === null) : [];
    const openWritten = debts.filter((d) => d.playerWrote !== null && d.settledOnDay === undefined && day - d.day < 14);
    if (unwritten.length || openWritten.length) out.push(this.el("div", "ev-grp", "Sổ bán chịu"));
    if (unwritten.length) out.push(this.el("div", "ev-note", `Hôm nay có ${unwritten.length} người mua chịu mà chưa ghi sổ.`));
    for (const d of unwritten) {
      const box = this.el("div", "ev-due");
      const hm = `${Math.floor(d.minute / 60)}h${String(d.minute % 60).padStart(2, "0")}`;
      box.append(this.el("div", "ev-ink", `${displayName(w.notebook, d.npcId, "khách")} · lúc ${hm} · bao nhiêu?`));
      const btns = this.el("div", "btns");
      const lo = writeFloor(d.trueAmount), hi = writeCeil(d.trueAmount);
      const inp = this.el("input") as HTMLInputElement;
      inp.type = "number"; inp.step = "1"; inp.placeholder = "nghìn";
      inp.min = String(lo / 1000); inp.max = String(hi / 1000);
      inp.setAttribute("aria-label", "số tiền (nghìn đồng)");
      inp.style.cssText = "width:90px;font:inherit;padding:5px 6px;border:1px solid #b8ab8e;border-radius:6px;background:#fff";
      const ok = this.el("button", "ev-btn", "ghi");
      ok.onclick = () => {
        const v = Math.round(Number(inp.value)) * 1000;
        if (!(v > 0)) return;
        d.playerWrote = Math.min(Math.max(v, lo), hi);
        // nhớ nhầm thì im (đó là cơ chế); chỉ nói khi con số vượt hẳn ra ngoài đời thật
        this.msg = v === d.playerWrote ? "" : "Ghi nhầm — sổ ghi lại theo cỡ ổ bánh.";
        this.render();
      };
      btns.append(inp, ok);
      box.append(btns);
      out.push(box);
    }
    for (const d of openWritten) {
      const r = this.el("div", "ev-own");
      r.append(this.el("span", "ev-ink", `${displayName(w.notebook, d.npcId, "khách")} · ngày ${d.day}`),
        this.el("span", "ev-price ev-ink", money(d.playerWrote!)));
      out.push(r);
    }
    if (RECONCILE_DAYS.includes(day)) {
      const gap = debtGap(debts, day);
      if (gap > 150_000 * ECON.scale) out.push(this.el("div", "ev-say", `Cô Ba: "Bán chịu nhiều mà ghi ít quá con. Thiếu chừng ${Math.round(gap / 10000) * 10} ngàn đó."`));
    }
    return out;
  }

  /**
   * Đồ nghề — P3-04 §4 UI: giá, chỗ trên xe, tiền mỗi ngày, và MỘT câu về cảm giác. KHÔNG
   * BAO GIỜ hiện con số hiệu ứng. Chỗ trống trên xe vẽ thành ô mờ, không phải "8/14".
   */
  /**
   * Mấy cờ mở khoá nói bằng tiếng người. Không khai "flag `rainyDaySeen`" — người chơi
   * không đọc tên biến, họ đọc *"đợi một hôm mưa"*.
   */
  private static readonly UNLOCK_WORDS: Record<string, string> = {
    rainyDaySeen: "đợi một hôm mưa",
    dirtyHandsConfirmed: "đợi lúc có người chê tay mình bẩn",
  };

  /**
   * Mặt xe vẽ theo TỪNG MÓN: mỗi món đã có là một khối ô dính liền, giữa hai món có khe hở.
   * Vậy thì "cái lò ăn hai chỗ" nhìn ra được, chứ không phải một dãy mười hai ô giống hệt
   * nhau mà muốn biết gì cũng phải đếm.
   */
  private cart() {
    const e = this.w.equipment;
    const box = this.el("div", "ev-cart");
    const top = this.el("div", "ev-top");
    top.append(this.el("span", "ev-name", "Mặt xe"), this.el("span", "ev-why", `trong ống ${money(this.w.money.cash)}`));
    box.append(top);
    const slots = this.el("div", "ev-slots");
    slots.setAttribute("aria-label", "chỗ trên xe");
    for (const id of e.owned as EquipId[]) {
      const n = Math.max(0, EQUIP[id]?.slots ?? 0);
      if (!n) continue;
      const blk = this.el("div", "ev-blk");
      blk.dataset.own = id;
      blk.title = EQUIP[id].name;
      for (let i = 0; i < n; i++) blk.append(this.el("span", "ev-cell"));
      slots.append(blk);
    }
    // chỗ trống gom thành MỘT khối liền: nó là một khoảng trống trên mặt xe, không phải
    // mấy cái ô rời. Rải chúng ra cùng khe hở với đồ đã có thì nhìn ra bảy món, không phải
    // ba món và một khoảng trống.
    const free = this.el("div", "ev-blk");
    for (let i = used(e); i < capacity(e); i++) free.append(this.el("span", "ev-cell free"));
    if (free.childElementCount) slots.append(free);
    box.append(slots);
    // KHÔNG có dòng "ô đậm là đồ đang để trên xe, ô mờ là chỗ trống". Mười hai ô vuông, mấy
    // ô tô đậm, mấy ô để mờ — không ai cần đọc chú thích cho cái đó, và một dòng chú thích
    // dưới một bức tranh tự hiểu được là giọng của máy chứ không phải của cuốn sổ.
    this.slotsEl = slots;
    return box;
  }

  /**
   * Soi cái món đang rê chuột sẽ làm gì với mặt xe. `id` = null để tắt.
   *
   * Phải tính PHẦN CHÊNH, không phải `slots` trần: lò điện ăn ba chỗ nhưng nó hất cái lò
   * than hai chỗ xuống, nên thật ra xe chỉ chật thêm một. Soi đủ ba ô trống là nói dối
   * ngay trên cái hình — và đây là chỗ duy nhất người chơi kiểm được câu "còn đủ chỗ không".
   * Khối của món bị thay thì vẽ rỗng ra: nó sắp rời khỏi xe.
   */
  private ghost(id: EquipId | null) {
    const el = this.slotsEl;
    if (!el) return;
    const d = id ? EQUIP[id] : null;
    const gone = d?.replaces && has(this.w.equipment, d.replaces) ? d.replaces : null;
    el.querySelectorAll<HTMLElement>(".ev-blk").forEach((b) => b.classList.toggle("out", !!gone && b.dataset.own === gone));
    const freed = gone ? Math.max(0, EQUIP[gone].slots) : 0;
    const n = Math.max(0, (d?.slots ?? 0) - freed);
    el.querySelectorAll<HTMLElement>(".ev-cell.free").forEach((c, i) => c.classList.toggle("ghost", i < n));
  }

  /** Sáng khối ô của một món đã có (rê chuột lên dòng của nó). */
  private hiOwn(id: EquipId | null) {
    this.slotsEl?.querySelectorAll<HTMLElement>(".ev-blk").forEach((b) => b.classList.toggle("hi", !!id && b.dataset.own === id));
  }

  /**
   * ⚠️ `gear()` · `owned()` · `offer()` phải nằm LIỀN NHAU và ở TRÊN `stands()`: lưới
   * `tests/p3-do-nghe-hien.ts` đọc thẳng mã nguồn, cắt đúng khúc giữa hai cái tên đó rồi
   * canh xem trang đồ nghề có còn vẽ món bị khoá không. Tách `offer()` xuống dưới
   * `stands()` là lưới mù, không phải lưới đỏ.
   */
  private gear(): HTMLElement[] {
    const w = this.w, day = w.progress.dayIndex, e = w.equipment;
    const out: HTMLElement[] = [this.cart()];

    /*
     * CÂU HỎI "BẢNG HIỆU GHI TÊN GÌ?" ĐÃ BỎ.
     *
     * Nó hỏi ba lựa chọn (tên cô Ba / tên con / không ghi chữ) mà KHÔNG lựa chọn nào đi tới đâu:
     * `econ.signName` không có chỗ nào đọc để vẽ. Lượt này tấm bảng mua được là ô `A` trên bản
     * đồ — ảnh `prop_sign.png`, chữ "bánh mì ngon" nướng sẵn trong ảnh — nên vẫn không có mặt
     * chữ nào để ghi lên. Một câu hỏi không đổi được gì thì tệ hơn là không hỏi: nó dạy người
     * chơi rằng mấy câu hỏi ở đây chỉ là trang trí.
     *
     * Cô Ba vẫn nói câu của cô, ở `buy()` — giữ khoảnh khắc, bỏ cái nút giả.
     * (`econ.signName` giữ trong kiểu cho save cũ đọc được, không ai ghi nữa.)
     */

    /*
     * MÓN CHƯA MỞ KHOÁ VẪN PHẢI THẤY — mờ đi và nói rõ còn thiếu gì.
     *
     * Chủ dự án: *"Ủa mua dù, bàn ghế kiểu gì thế? Tôi có thấy chỗ nào mua đâu?"* Đúng:
     * bản trước `continue` thẳng, nên món chưa tới ngày (hay chưa gặp ngày mưa) KHÔNG
     * TỒN TẠI ở đâu trên màn hình. Người chơi không thể muốn một thứ họ chưa từng thấy,
     * và cái dù là chỗ dựa của mười câu "đứng cho mát" — không biết nó có thì không bao
     * giờ mua.
     *
     * Vẫn KHÔNG nói con số hiệu ứng (P3-04 §4), chỉ nói món đó là gì và còn thiếu gì.
     *
     * Trong một nhóm, thứ tự là: ĐANG CÓ (một dòng gọn — đó là hiện trạng) → MUA ĐƯỢC
     * (thẻ đầy đủ — đó là việc tối nay) → CHƯA BÁN (dòng mờ — đó là chuyện mai mốt).
     */
    for (const g of GROUP_IDS) {
      const ids = EQUIP_IDS.filter((id) => EQUIP[id].group === g && (has(e, id) || !EQUIP[id].starting));
      if (!ids.length) continue;
      const mine: EquipId[] = [], buy: EquipId[] = [], wait: EquipId[] = [];
      for (const id of ids) {
        const own = has(e, id);
        const khoa = !own && !unlocked(id, e, day, w.flags);
        (own ? mine : khoa ? wait : buy).push(id);
      }
      // Món CÓ DẤU VẾT tối nay lên đầu khúc mua được. Tối nào cháy bánh thì cái lò điện phải
      // nằm chỗ mắt rơi vào trước, không nằm dưới ba món không dính dáng gì. Ngoài ra giữ
      // nguyên thứ tự trong JSON — không xếp theo giá, không xếp theo "nên mua trước".
      buy.sort((a, b) => Number(hasEvidence(b, w)) - Number(hasEvidence(a, w)));
      out.push(this.el("div", "ev-grp", EQUIP_GROUPS[g] ?? g));
      for (const id of mine) out.push(this.owned(id));
      for (const id of buy) out.push(this.offer(id, false));
      for (const id of wait) out.push(this.offer(id, true));
    }
    return out;
  }

  /** Món đã có: một dòng. Nó là hiện trạng, không phải lời mời — đừng cho nó cỡ của một thẻ. */
  private owned(id: EquipId) {
    const d = EQUIP[id], w = this.w;
    const row = this.el("div", "ev-own");
    row.onmouseenter = () => this.hiOwn(id);
    row.onmouseleave = () => this.hiOwn(null);
    const name = this.el("span", "ev-name", d.name);
    // Món đã có thì cái người ta muốn nhớ lại là NÓ ĐANG LÀM GÌ, không phải câu kể lúc mua.
    name.title = d.gain.length ? d.gain.join(" · ") : d.feel;
    row.append(name);
    const sellable = d.resellable !== false && !d.starting;
    if (this.ask?.kind === "sell" && this.ask.id === id) {
      const box = this.el("div", "ev-ask");
      box.append(this.el("div", "", `Bán ${d.name.toLowerCase()} đi? Đồ cũ người ta trả ${money(resaleVnd(id))} thôi.`));
      const btns = this.el("div", "btns");
      const ok = this.el("button", "ev-btn primary", "bán");
      ok.onclick = () => {
        // `w.econ` là cuốn sổ hôm nay — bán đồ nghề là tiền VÔ, phải có một dòng (`today.tools`)
        sellEquip(id, w.equipment, w.money, 1, w.econ);
        this.ask = null;
        this.msg = "Đã bán.";
        this.render();
      };
      const no = this.el("button", "ev-btn quiet", "thôi");
      no.onclick = () => { this.ask = null; this.render(); };
      btns.append(ok, no);
      box.append(btns);
      const wrap = this.el("div");
      wrap.append(row, box);
      return wrap;
    }
    if (sellable) {
      const sell = this.el("button", "ev-btn quiet", `bán lại ${money(resaleVnd(id))}`);
      sell.onclick = () => { this.ask = { kind: "sell", id }; this.msg = ""; this.render(); };
      row.append(sell);
    } else row.append(this.el("span", "ev-why", d.resellable === false ? "của cô Ba, không bán" : "có sẵn trên xe"));
    return row;
  }

  /** Món chưa có: một thẻ. `khoa` = chưa tới lượt, vẽ mờ nhưng vẫn đọc được. */
  private offer(id: EquipId, khoa: boolean) {
    const w = this.w, day = w.progress.dayIndex, e = w.equipment, d = EQUIP[id];
    const dau = khoa ? null : evidenceFor(id, w);
    const box = this.el("div", `ev-card${khoa ? " lock" : dau ? " mark" : ""}`);
    if (khoa) box.style.opacity = "0.55";
    const price = priceVnd(id);
    const top = this.el("div", "ev-top");
    const tag = this.el("span", "ev-price", price ? money(price) : "không tốn tiền");
    if (price > w.money.cash) tag.className = "ev-price cant";
    top.append(this.el("span", "ev-name", d.name), tag);
    box.append(top);

    // chỗ + tiền mỗi ngày thành THẺ SỐ, không nối vô tên món bằng dấu "·"
    const chips = this.el("div", "ev-chips");
    if (d.slots > 0) chips.append(this.el("span", "ev-chip", d.slots === 1 ? "một chỗ trên xe" : `${d.slots} chỗ trên xe`));
    if (d.slots < 0) chips.append(this.el("span", "ev-chip", `nới thêm ${-d.slots} chỗ`));
    if (d.daily_k) chips.append(this.el("span", "ev-chip", "tốn tiền mỗi ngày"));
    if (d.replaces) chips.append(this.el("span", "ev-chip", `thay cho ${EQUIP[d.replaces].name.toLowerCase()}`));
    if (d.costsMorning) chips.append(this.el("span", "ev-chip", "mất một buổi sáng"));
    if (chips.childElementCount) box.append(chips);
    box.append(this.el("div", "ev-feel", d.feel));
    /*
     * LỢI ÍCH, QUY RA CHỈ SỐ — thay hẳn khối `drawbacks` cũ.
     *
     * Chủ dự án: *"nên viết theo kiểu. Mua thì +10% khả năng khách ghé hay gì đó… quy ra chỉ số
     * để user dễ nắm"* và *"không cần nhược điểm món đồ"*. Trước đợt này mỗi thẻ có một câu cảm
     * giác rồi một hai dòng CÁI GIÁ, và không dòng nào trả lời được câu "mua về thì khác gì" —
     * nên người đọc cân đo giữa một thứ mơ hồ và một thứ rõ ràng là xấu, và không mua gì cả.
     *
     * Mỗi dòng một chỉ số, giữ nguyên thứ tự trong JSON (dòng đầu là lý do chính để mua). Cái
     * giá KHÔNG mất đi — nó nằm ở giá mua và thẻ "tốn tiền mỗi ngày" phía trên, chỗ nó vốn thuộc về.
     */
    const gain = this.el("div", "ev-gain");
    for (const c of d.gain) gain.append(this.el("div", "", c));
    if (gain.childElementCount) box.append(gain);
    // DẤU VẾT (sim/gearHint): chuyện hôm nay của chính người chơi, không phải lời quảng cáo
    // của món đồ. Nó đứng DƯỚI cái giá và SÁT nút mua — chỗ mắt dừng lại lần cuối trước khi bấm.
    if (dau) box.append(this.el("div", "ev-mark", dau));

    if (khoa) {
      /** Nói ĐIỀU KIỆN, không nói "chưa có ai bán" trống không — người chơi cần biết chờ cái gì. */
      const u = EQUIP[id].unlock;
      const can: string[] = [];
      if (u?.minDay && day < u.minDay) can.push(`qua ngày ${u.minDay}`);
      if (u?.afterFlag && !w.flags[u.afterFlag]) can.push(EveningView.UNLOCK_WORDS[u.afterFlag] ?? "còn chờ dịp");
      if (u?.requiresAny?.length && !u.requiresAny.some((x) => has(e, x))) {
        can.push(`cần có ${u.requiresAny.map((x) => EQUIP[x].name.toLowerCase()).join(" hoặc ")}`);
      }
      const btns = this.el("div", "btns");
      btns.append(this.el("span", "ev-why", `chưa bán — ${can.join(", ") || "còn chờ dịp"}`));
      box.append(btns);
      return box;
    }

    if (this.ask?.kind === "buy" && this.ask.id === id) {
      const ask = this.el("div", "ev-ask");
      const swap = d.replaces && has(e, d.replaces)
        ? EQUIP[d.replaces].resellable
          ? ` ${EQUIP[d.replaces].name} bán lại được ${money(resaleVnd(d.replaces))}.`
          : ` ${EQUIP[d.replaces].name} dẹp qua một bên.`
        : "";
      ask.append(this.el("div", "", price
        ? `Lấy ${d.name.toLowerCase()}? ${money(price)}.${swap} Trong ống còn ${money(w.money.cash - price)}.`
        : `Lấy ${d.name.toLowerCase()}?${swap}`));
      const btns = this.el("div", "btns");
      const ok = this.el("button", "ev-btn primary", "ừ, lấy");
      ok.onclick = () => this.buy(id);
      const no = this.el("button", "ev-btn quiet", "thôi");
      no.onclick = () => { this.ask = null; this.render(); };
      btns.append(ok, no);
      ask.append(btns);
      box.append(ask);
      return box;
    }

    const why = whyNot(id, e, w.money.cash, day, w.flags);
    const btns = this.el("div", "btns");
    const b = this.el("button", "ev-btn primary", "mua");
    b.disabled = why !== null;
    b.onclick = () => { this.ask = { kind: "buy", id }; this.msg = ""; this.render(); };
    // rê chuột (hay Tab tới) nút mua → mặt xe sáng lên đúng số ô món này ăn
    const on = () => this.ghost(id);
    const off = () => this.ghost(null);
    b.onmouseenter = on; b.onfocus = on; b.onmouseleave = off; b.onblur = off;
    btns.append(b);
    if (why === "chưa đủ tiền") btns.append(this.el("span", "ev-why", `còn thiếu ${money(price - w.money.cash)}`));
    else if (why === "xe hết chỗ") btns.append(this.el("span", "ev-why", "xe hết chỗ"));
    else if (why) btns.append(this.el("span", "ev-why", why));
    box.append(btns);
    return box;
  }

  /**
   * Chỗ đứng — P3-05 §4: chỉ là một trang vẽ tay trong sổ, điền dần bằng đi coi. Không bảng so
   * sánh, không điểm, không "bao nhiêu người sẽ theo". Dời = dán tờ giấy lên xe, mấy bữa sau đẩy đi.
   */
  private stands(): HTMLElement[] {
    const w = this.w, e = w.econ;
    const out: HTMLElement[] = [];
    if (e.movePlan) {
      const p = e.movePlan;
      const box = this.el("div", "ev-ask");
      box.append(this.el("div", "", `Tờ giấy dán trên xe: "Ngày ${p.moveDay} dời qua ${STANDS[p.to].name.toLowerCase()}."`));
      const c = this.el("button", "ev-btn quiet", "gỡ tờ giấy");
      c.onclick = () => { e.movePlan = null; this.render(); };
      const btns = this.el("div", "btns");
      btns.append(c);
      box.append(btns);
      out.push(box);
    }
    out.push(this.el("div", "ev-grp", "Mấy chỗ bán quanh đây"));
    for (const id of STAND_IDS) {
      const s = STANDS[id];
      const here = e.stand === id;
      const box = this.el("div", "ev-card");
      const top = this.el("div", "ev-top");
      top.append(this.el("span", "ev-name", s.name));
      if (here) top.append(this.el("span", "ev-chip", "đang bán ở đây"));
      box.append(top);
      if (e.scouted.includes(id)) {
        const chips = this.el("div", "ev-chips");
        chips.append(this.el("span", "ev-chip", `tiền chỗ ${money(rentVnd(id))} một ngày`));
        chips.append(this.el("span", "ev-chip", s.rivals === 0 ? "không xe nào khác" : s.rivals === 1 ? "có một xe khác" : `${s.rivals} xe khác`));
        chips.append(this.el("span", "ev-chip", s.shelter ? "có mái che" : "không có mái"));
        if (s.push) chips.append(this.el("span", "ev-chip", `đẩy ${s.push} phút`));
        box.append(chips);
        // mấy câu này là LỜI DÌ NĂM kể lúc mình đi hỏi, không phải chú thích của trò chơi —
        // nên nó mặc đúng cái áo của lời người nói, giống mọi câu thoại khác trong màn tối
        const says = this.el("div", "ev-says");
        says.append(this.el("div", "ev-say", s.blurb));
        box.append(says);
      } else box.append(this.el("div", "ev-why", "Chưa ghé xem."));
      const btns = this.el("div", "btns");
      if (!e.scouted.includes(id)) {
        const ask = this.el("button", "ev-btn", "hỏi dì Năm");
        ask.onclick = () => { scout(w, id); this.msg = 'Dì Năm: "Chỗ đó hả, để dì kể cho nghe."'; this.render(); };
        btns.append(ask);
      } else if (!here && !e.movePlan) {
        const why = canMoveTo(w, id);
        for (const [n, label] of [[1, "mai dời"], [2, "hai hôm nữa"], [4, "bốn hôm nữa"]] as const) {
          const b = this.el("button", "ev-btn", label);
          b.disabled = why !== null;
          b.onclick = () => { postMove(w, id, n); this.msg = ""; this.render(); };
          btns.append(b);
        }
        if (why) btns.append(this.el("span", "ev-why", why));
      }
      if (btns.childElementCount) box.append(btns);
      out.push(box);
    }
    return out;
  }

  private buy(id: EquipId) {
    const w = this.w;
    this.ask = null;
    if (!buyEquip(id, w.equipment, w.money, w.econ)) { this.render(); return; }
    if (EQUIP[id].costsMorning) { w.flags.lateOpenDay = w.progress.dayIndex + 1; this.msg = 'Cô Mai: "Mai con đi làm giấy ngân hàng với cô, trưa về bán."'; }
    else this.msg = `Đã lắp ${EQUIP[id].name} lên xe.`;
    if (id === "BANG_HIEU") this.msg = 'Dựng tấm bảng ra mép vỉa hè. Cô Ba đứng nhìn hơi lâu: "Ờ. Cũng tới lúc rồi."';
    this.render();
  }

  close() { this.root.remove(); }
}
