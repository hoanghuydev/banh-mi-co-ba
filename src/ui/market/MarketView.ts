import type Phaser from "phaser";
import type { SaveFile } from "../../core/save";
import {
  CAL, GOODS, GOOD_IDS, SELLERS, WEEKDAY_VI, buy, coldSlotCap, coldSlotsUsed, lotQuality,
  weatherOf, weekdayIdx, type GoodId,
} from "../../sim/econ";
import { basketCost, fmtUnits, forcedSell, noteBasketLoaves, quenMat, unitPriceVnd } from "../../sim/day";
import { moment } from "../../sim/story";
import { EQUIP, priceVnd, resaleVnd, resellable, type EquipId } from "../../sim/equipment";
import { STANDS, alleyRumours, standClosed } from "../../sim/stands";
import {
  SUPPLIERS, afterMarket, borrow, creditCeiling, greetingOf, isClosed, repay, state, type SupplierId,
} from "../../sim/suppliers";
import { NOTICE_LINES, rentVnd, upcoming } from "../../sim/obligations";

/**
 * Đi chợ sáng — P3-01 §2.1 pha MORNING, P3-03 §2.5 (giá), §2.1 (hạn dùng). Chạy theo LƯỢT:
 * không đồng hồ, không ai nhìn — lúc suy nghĩ.
 *
 *   · giá hôm qua hiện MỜ bên cạnh — học pattern thứ Hai đắt, thứ Năm rẻ bằng mắt
 *   · tồn kho hiện bằng số lẻ ("còn 0,4 lạng"), đồ chua hiện NGÀY NGÂM, KHÔNG BAO GIỜ hiện
 *     chất lượng % (P3-03 §6 #13) — và không có dự báo, không có "tính giùm"
 *   · tổng tiền mặc định chỉ hiện ở bước xác nhận — "không có tổng chạy", người chơi phải
 *     nhẩm. Công tắc trợ năng "hiện tổng khi đang chọn" (P3-03 §4 luật UI #4) cho tổng
 *     chạy ở chân trang; nó vẫn là dữ liệu thô, không gợi ý mua gì
 *   · "mua như hôm qua" chép Y giỏ hôm qua, kể cả Chủ nhật — không bao giờ tối ưu
 */
const STYLE = `
.mk-root{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(18,22,26,.55);font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#2b2f31}
.mk-book{width:min(1060px,96vw);height:min(600px,94vh);display:flex;flex-direction:column;background:#f3ecdc;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.45);overflow:hidden}

/* ── đầu trang: ngày giờ, rồi mấy con số, rồi lời người ta nói. Ba thứ khác loại
      thì ba kiểu chữ khác nhau — không còn chín dòng y hệt nhau nối bằng dấu "·". */
.mk-head{padding:12px 18px 10px;border-bottom:2px solid #d8cdb3;flex:0 0 auto}
.mk-head-top{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.mk-title{font-weight:700;font-size:1.2em}
.mk-when{font-size:.86em;color:#6d624e}
.mk-stats{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
.mk-stat{background:#fbf7ec;border:1px solid #ddd2b8;border-radius:7px;padding:4px 10px;line-height:1.3}
.mk-stat b{display:block;font-size:.97em;font-variant-numeric:tabular-nums;font-weight:600}
.mk-stat i{display:block;font-style:normal;font-size:.72em;color:#8a7d64}
.mk-stat.warn{border-color:#c69072;background:#faeee4}
.mk-stat.warn b{color:#8a4a2a}
/* lời ở chợ: một khối CÓ VẠCH, tách hẳn khỏi mấy con số phía trên */
.mk-talk{margin-top:9px;padding-left:10px;border-left:3px solid #ddd2b8}
.mk-talk div{font-size:.85em;color:#4a5a6a;font-style:italic;line-height:1.5}
.mk-owe{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;font-size:.86em;color:#6d624e}

/* ── thân: sạp bên trái, giỏ bên phải ── */
.mk-main{flex:1;display:grid;grid-template-columns:minmax(0,1fr) clamp(220px,17.8em,330px);min-height:0}
.mk-body{overflow:auto;scrollbar-gutter:stable;padding:10px 10px 12px 18px;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,19em),1fr));gap:10px;align-items:start;align-content:start}
.mk-body.solo{grid-column:1/3}
.mk-card{background:#fbf7ec;border:1px solid #d8cdb3;border-radius:8px;padding:8px 10px 5px}
.mk-seller{font-weight:700;font-size:.97em}
.mk-blurb{font-size:.78em;color:#7a6f5b;font-style:italic;margin-bottom:4px}
.mk-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1px 8px;align-items:center;padding:6px 0;border-top:1px dashed #e0d6bf}
/* món đã bỏ vô giỏ thì NHÌN RA ĐƯỢC ngay trên sạp, không phải lần xuống chân trang mới biết */
.mk-row.has{background:#f1e7cf;margin:0 -10px;padding:6px 10px;border-top-color:transparent;border-radius:6px}
.mk-name{font-size:.93em}
.mk-price{font-size:.82em;font-variant-numeric:tabular-nums}
.mk-y{color:#a99d85;margin-left:6px}
.mk-have{font-size:.76em;color:#8a7d64;line-height:1.35}
.mk-step{display:flex;align-items:center;gap:2px}
.mk-step button{width:2.4em;height:2.4em;min-width:34px;min-height:34px;border-radius:7px;border:1px solid #b8ab8e;background:#fff;font:inherit;font-size:1.15em;line-height:1;color:#2b2f31;cursor:pointer}
.mk-step button:hover:not(:disabled){background:#2f5d8a;border-color:#2f5d8a;color:#fff}
.mk-step button:disabled{opacity:.3;cursor:default}
.mk-qty{min-width:4em;text-align:center;font-size:.84em;font-variant-numeric:tabular-nums;color:#a99d85}
.mk-row.has .mk-qty{color:#2f5d8a;font-weight:700}

/* ── giỏ: thứ DUY NHẤT trả lời "nãy giờ mình lấy những gì" mà không phải cuộn lại ── */
.mk-side{border-left:2px solid #d8cdb3;background:#efe7d4;display:flex;flex-direction:column;min-height:0}
.mk-side-h{padding:11px 14px 6px;font-weight:700;font-size:.95em}
.mk-basket{flex:1;overflow:auto;padding:0 14px 8px;font-size:.86em}
.mk-bi{display:flex;justify-content:space-between;gap:10px;padding:4px 0;border-bottom:1px dashed #ddd2b8}
.mk-bi span+span{white-space:nowrap;font-variant-numeric:tabular-nums;color:#5d5340}
.mk-empty{color:#8a7d64;font-style:italic;padding:5px 0;line-height:1.45}
.mk-sub{margin-top:8px;padding-top:6px;border-top:1px solid #cdbf9f}
.mk-sub .mk-bi{border-bottom:0;font-weight:600}
.mk-float{padding:9px 14px;border-top:1px solid #ddd2b8}
.mk-float-h{font-size:.78em;color:#6d624e;margin-bottom:5px}
.mk-float-b{display:flex;gap:5px}
.mk-float-b .mk-btn{padding:6px 0;flex:1;min-height:32px;font-size:.84em}

/* ── hoá đơn: bước xác nhận THAY RUỘT, không phải đổi mỗi cái chân trang ── */
.mk-bill{grid-column:1/3;overflow:auto;padding:16px 24px 18px}
.mk-bill-in{max-width:40em;margin:0 auto}
.mk-bill h4{margin:14px 0 2px;font-size:.9em;font-weight:700}
.mk-bill h4:first-child{margin-top:0}
.mk-bill .mk-bi{font-size:.93em}
.mk-sum{margin-top:16px;padding-top:4px;border-top:2px solid #d8cdb3}
.mk-sum .mk-bi.big span{font-weight:700;font-size:1.1em}
.mk-sum .mk-bi.short span{color:#8a4a2a}

/* ── chân trang: bên trái là TÌNH HÌNH, bên phải là VIỆC. Không trộn. ── */
.mk-foot{display:flex;gap:10px;justify-content:space-between;align-items:center;padding:10px 18px;border-top:2px solid #d8cdb3;flex:0 0 auto;flex-wrap:wrap}
.mk-acts{display:flex;gap:8px;align-items:center;margin-left:auto}
.mk-btn{font:inherit;font-size:.9em;padding:8px 14px;border-radius:7px;border:1px solid #b8ab8e;background:#fbf7ec;color:#2b2f31;cursor:pointer;min-height:36px}
.mk-btn:hover:not(:disabled){border-color:#2f5d8a}
.mk-btn.primary{background:#2f5d8a;color:#fff;border-color:#2f5d8a;font-weight:700}
.mk-btn.on{background:#2f5d8a;color:#fff;border-color:#2f5d8a}
.mk-btn:disabled{opacity:.45;cursor:default}
.mk-btn:focus-visible,.mk-step button:focus-visible{outline:2px solid #2f5d8a;outline-offset:2px}
.mk-msg{font-size:.85em;color:#6d624e}
.mk-msg.warn{color:#8a4a2a}
`;

const money = (v: number) => `${Math.round(v).toLocaleString("vi-VN")}₫`;

/**
 * Bán ép ở màn "phải xoay cho đủ" — gương của `forcedSell` trong sim/day.ts, nó gọi
 * `sellEquip(id, …, 0,5/0,6)`: bán lại thường được sáu phần mười, bán gấp chỉ còn năm.
 */
const FORCED_SELL_SHARE = 0.5 / 0.6;
const forcedSellVnd = (id: EquipId) => Math.round(resaleVnd(id) * FORCED_SELL_SHARE / 1000) * 1000;

/** Lời người ta nói ở chợ về sự kiện sắp tới — NÓI RA, không có banner (Đừng-1). */
function rumours(day: number): string[] {
  const out: string[] = [];
  for (const e of CAL.events) {
    if (!e.line || day < e.telegraphFromDay || day >= e.fromDay) continue;
    out.push(`"${e.line}"`);
  }
  return out;
}

export type MarketResult = { spent: number; bought: { good: GoodId; units: number }[] };

export class MarketView {
  private root: HTMLDivElement;
  private basket: Partial<Record<GoodId, number>> = {};
  private confirming = false;
  /** P3-03 §2.8 — tiền lẻ đổi ở cô Mai (nghìn): 100k ≈ 19 lượt thối, 200k ≈ 38, 300k ≈ 58. */
  private float = 100;
  private msg = "";
  private keyGuard = (ev: KeyboardEvent) => { ev.stopPropagation(); if (ev.code === "Escape" && this.confirming) { this.confirming = false; this.render(); } };

  constructor(private game: Phaser.Game, private w: SaveFile, private opts: { textScale: number; showTotal?: boolean; onDone: (r: MarketResult) => void }) {
    if (!document.getElementById("mk-style")) {
      const st = document.createElement("style");
      st.id = "mk-style"; st.textContent = STYLE;
      document.head.appendChild(st);
    }
    this.root = document.createElement("div");
    this.root.className = "mk-root";
    this.root.style.fontSize = `${Math.round(14 * opts.textScale)}px`;
    this.root.addEventListener("keydown", this.keyGuard, true);
    this.root.addEventListener("keyup", (e) => e.stopPropagation(), true);
    document.body.appendChild(this.root);
    if (game.input.keyboard) game.input.keyboard.enabled = false;
    this.render();
  }

  private get day() { return this.w.progress.dayIndex; }

  private el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = ""): HTMLElementTagNameMap[K] {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  private haveText(g: GoodId): string {
    const d = GOODS[g], inv = this.w.inventory;
    const lots = inv.lots.filter((l) => l.good === g && lotQuality(l, this.day, inv.storage, inv.noiU) !== null && l.left > 0);
    if (!lots.length) return "hết";
    if (d.pickle || g === "DO_CHUA_SAN") {
      return lots.map((l) => `hũ ${g === "DO_CHUA_SAN" ? "mua" : "ngâm"} ngày ${l.day < 1 ? "cô Ba" : l.day} (còn ${fmtUnits(l.left / d.perUnit)})`).join(" · ");
    }
    const byDay = new Map<number, number>();
    for (const l of lots) byDay.set(l.day, (byDay.get(l.day) ?? 0) + l.left);
    return [...byDay].sort((a, b) => a[0] - b[0])
      .map(([dd, n]) => `${fmtUnits(n / d.perUnit)} ${d.unit}${dd < this.day ? ` mua ngày ${dd}` : ""}`).join(" · ");
  }

  /** Những món đang có trong giỏ, kèm số lượng theo đơn vị của món. */
  private picked(): { g: GoodId; n: number }[] {
    return GOOD_IDS.filter((g) => (this.basket[g] ?? 0) > 0).map((g) => ({ g, n: this.basket[g]! }));
  }

  private render() {
    const r = this.root;
    const prev = r.querySelector<HTMLElement>(".mk-body");
    const scroll = prev ? prev.scrollTop : 0;
    const act = document.activeElement as HTMLElement | null;
    const focusKey = act && r.contains(act) ? act.dataset.k ?? "" : "";
    r.replaceChildren();
    if (this.w.econ.mustSell) { r.append(this.mustSell()); this.restore(scroll, focusKey); return; }
    const book = this.el("div", "mk-book");
    const w = this.w, day = this.day;
    const cold = coldSlotsUsed(w.inventory, day) + this.coldAdded();
    const cap = coldSlotCap(w.inventory);
    const overCold = cold > cap;

    book.append(this.head(cold, cap, overCold));

    const main = this.el("div", "mk-main");
    if (this.confirming) {
      main.append(this.bill());
    } else {
      main.append(this.stalls(), this.side());
    }
    book.append(main, this.foot(overCold));
    r.append(book);
    this.restore(scroll, focusKey);
  }

  /**
   * Đầu trang. Ba TẦNG, không phải chín dòng giống hệt nhau:
   *   1. ngày nào, trời gì            — chữ lớn, đọc lướt
   *   2. mấy con số của hôm nay       — ô vuông, mắt bắt được ngay con nào đổi
   *   3. người ta nói gì ở chợ        — chữ nghiêng sau một vạch, biết là LỜI chứ không phải số
   *
   * Tầng 2 là chỗ cái thùng xốp dọn về. Trước đây nó là một dòng chữ nhỏ màu nâu-đỏ nằm
   * lẫn giữa mấy cái nút ở chân trang, và "thùng xốp còn chỗ" — một tin MỪNG — hiện ra
   * y hệt một lời cảnh báo, cùng màu với "thùng xốp không đủ chỗ".
   */
  private head(cold: number, cap: number, overCold: boolean) {
    const w = this.w, day = this.day, e = w.econ;
    const head = this.el("div", "mk-head");

    const top = this.el("div", "mk-head-top");
    top.append(this.el("div", "mk-title", "Chợ sáng"));
    top.append(this.el("div", "mk-when",
      `Ngày ${day} · ${WEEKDAY_VI[weekdayIdx(day)]} · ${CAL.weatherInfo[weatherOf(day)].label}`));
    head.append(top);

    const stats = this.el("div", "mk-stats");
    const stat = (label: string, value: string, warn = false) => {
      const box = this.el("div", `mk-stat${warn ? " warn" : ""}`);
      box.append(this.el("b", "", value), this.el("i", "", label));
      stats.append(box);
    };
    stat("trong ống", money(w.money.cash));
    if (e.today.rent) stat("tiền chỗ", `đã đóng ${money(e.today.rent)}`);
    else if (e.rentOwed) stat("tiền chỗ", `nợ ${money(e.rentOwed)}`, true);
    else stat("tiền chỗ", money(rentVnd(e.stand)));
    stat("thùng xốp", `${fmtUnits(cold)}/${cap} ô`, overCold);
    if (e.stand !== "L1") stat("chỗ bán", STANDS[e.stand].name.toLowerCase());
    head.append(stats);

    // nợ mối — trả được ngay ở đây; hạn luôn là "cuối tuần", không đếm ngược
    for (const id of Object.keys(SUPPLIERS) as SupplierId[]) {
      const sup = w.suppliers?.[id];
      if (!sup || sup.owed <= 0) continue;
      const line = this.el("div", "mk-owe");
      line.append(this.el("span", "", `Còn nợ ${SUPPLIERS[id].name} ${money(sup.owed)}, hẹn cuối tuần.`));
      const b = this.el("button", "mk-btn", "Trả");
      b.dataset.k = `repay:${id}`;
      b.disabled = w.money.cash <= 0;
      // `w.econ` là cuốn sổ hôm nay: trả nợ mối là tiền ra khỏi két, phải để lại một dòng
      // (`today.debtRepay`) — không thì tối đếm tiền hụt mà không biết vì đâu
      b.onclick = () => { repay(sup, w.money, day, w.econ); this.render(); };
      line.append(b);
      head.append(line);
    }

    // ── tầng 3: lời người. Gom hết vào MỘT khối, không rải xen kẽ với số.
    const said: string[] = [];
    for (const n of e.notices ?? []) said.push(...(NOTICE_LINES[n] ?? []));
    said.push(...(e.morningLines ?? []));
    if (upcoming(e, day, 2).some((d) => d.kind === "HUI")) said.push(`Cô Mai: "Mốt góp hụi nghen con."`);
    said.push(...rumours(day));
    said.push(...alleyRumours(day, w.npcs.CHU_KIET?.tier === "FRIEND"));
    if (standClosed(e.stand, day)) said.push(`Bữa nay ${STANDS[e.stand].name.toLowerCase()} không bán được, người ta chắn hết rồi.`);
    if (day === 1) said.push("Cô Ba đi chợ từ bốn giờ sáng rồi, đồ có sẵn trong thùng. Con coi thiếu gì thì mua thêm.");
    if (e.today.wasted.length) said.push(`Sáng nay bỏ đi: ${e.today.wasted.join(", ")} — hư rồi.`);
    if (said.length) {
      const talk = this.el("div", "mk-talk");
      for (const l of said) talk.append(this.el("div", "", l));
      head.append(talk);
    }
    return head;
  }

  /** Các sạp. Thẻ cao đúng bằng ruột nó (`align-items:start`), không kéo cho bằng hàng. */
  private stalls() {
    const w = this.w, day = this.day;
    const body = this.el("div", "mk-body");
    const bySeller = new Map<string, GoodId[]>();
    for (const g of GOOD_IDS) (bySeller.get(GOODS[g].seller) ?? bySeller.set(GOODS[g].seller, []).get(GOODS[g].seller)!).push(g);
    for (const [sid, goods] of bySeller) {
      const card = this.el("div", "mk-card");
      const sup = SUPPLIERS[sid as SupplierId];
      const closed = sup && isClosed(sid as SupplierId, day);
      card.append(this.el("div", "mk-seller", closed ? `${SELLERS[sid]?.name} — nghỉ giỗ` : SELLERS[sid]?.name ?? sid));
      // quan hệ đọc qua CÁCH GỌI, không qua thanh số (P3-02 §2.6.4)
      if (sup && !closed) card.append(this.el("div", "mk-blurb", `"${greetingOf(sid as SupplierId, state(w.suppliers ??= {}, sid as SupplierId))}"`));
      // Nghỉ giỗ KHÔNG phải là hết hàng: calendar.json `lo_ba_tam_nghi` (ngày 28–30) định
      // giá sẵn cho lò khác — bánh 4,2 ngàn thay vì 3,5 và ruột xấu hơn (breadQ0 0,90). Cái
      // sai là tấm blurb cũ ("giá không bao giờ đổi") nói ngược với con số ngay dưới nó.
      else if (closed) card.append(this.el("div", "mk-blurb", "lò khác bán đỡ mấy bữa, bánh đắt hơn mà ruột cũng không bằng"));
      else card.append(this.el("div", "mk-blurb", SELLERS[sid]?.blurb ?? ""));
      for (const g of goods) card.append(this.row(g));
      body.append(card);
    }
    return body;
  }

  /**
   * Cột GIỎ. Thiếu đúng cái này là lỗi nặng nhất của bảng cũ: muốn biết nãy giờ mình
   * lấy những gì thì phải cuộn ngược hết cả danh sách và tự nhớ, vì con số duy nhất
   * nhìn thấy nằm ngay dưới cái nút vừa bấm — rồi cuộn đi là mất.
   *
   * Nó liệt kê MÓN và SỐ LƯỢNG, không liệt kê tiền. P3-03 §4 luật UI #4 nói tổng chỉ
   * hiện ở bước trả tiền, mà "mình đang cầm cái gì trong giỏ" thì không phải tổng —
   * đó là thứ ngoài đời liếc vô giỏ là thấy. Có bật công tắc trợ năng thì mới có tiền.
   */
  private side() {
    const w = this.w, day = this.day;
    const side = this.el("div", "mk-side");
    side.append(this.el("div", "mk-side-h", "Trong giỏ"));
    const list = this.el("div", "mk-basket");
    const items = this.picked();
    if (!items.length) {
      list.append(this.el("div", "mk-empty", "Chưa lấy gì. Bấm dấu + ở sạp bên trái."));
    } else {
      for (const { g, n } of items) {
        const d = GOODS[g];
        const r = this.el("div", "mk-bi");
        r.append(this.el("span", "", d.label), this.el("span", "", `${fmtUnits(n)} ${d.unit}`));
        list.append(r);
      }
      if (this.opts.showTotal) {
        const box = this.el("div", "mk-sub");
        const t = this.el("div", "mk-bi");
        t.append(this.el("span", "", "Tạm tính"), this.el("span", "", money(basketCost(this.basket, day, w.suppliers))));
        box.append(t);
        list.append(box);
      }
    }
    side.append(list);

    // P3-03 §2.8 — "đổi bạc lớn lấy bạc nhỏ": đổi tiền MÌNH ĐANG CÓ, không phải in thêm.
    // Vào chợ với 30 ngàn mà bấm 300k thì hộp lẻ tự đẻ ra gấp mười lần tiền thật có.
    const fl = this.el("div", "mk-float");
    fl.append(this.el("div", "mk-float-h", "Đổi tiền lẻ để thối"));
    const row = this.el("div", "mk-float-b");
    for (const v of [100, 200, 300]) {
      const b = this.el("button", `mk-btn${this.float === v ? " on" : ""}`, `${v}k`);
      b.dataset.k = `float:${v}`;
      b.disabled = v * 1000 > w.money.cash;
      b.setAttribute("aria-pressed", String(this.float === v));
      b.onclick = () => { this.float = v; this.render(); };
      row.append(b);
    }
    fl.append(row);
    if (this.float * 1000 > w.money.cash) fl.append(this.el("div", "mk-float-h", `Trong ống có ${money(w.money.cash)}, đổi được bấy nhiêu thôi.`));
    side.append(fl);
    return side;
  }

  /**
   * Hoá đơn. Bước xác nhận CŨ chỉ đổi mỗi cái chân trang: ruột vẫn là nguyên cái chợ với
   * đủ nút cộng trừ bấm được, nên "xác nhận" không cho người chơi xem lại thứ gì cả —
   * họ bấm trả tiền mà chưa một lần thấy danh sách mình sắp mua.
   */
  private bill() {
    const w = this.w, day = this.day;
    const bill = this.el("div", "mk-bill");
    const inner = this.el("div", "mk-bill-in");
    bill.append(inner);
    const total = basketCost(this.basket, day, w.suppliers);
    const plan = this.creditPlan(total);
    const short = Math.max(0, total - w.money.cash - plan.credit);

    const bySeller = new Map<string, { g: GoodId; n: number }[]>();
    for (const it of this.picked()) {
      const sid = GOODS[it.g].seller;
      (bySeller.get(sid) ?? bySeller.set(sid, []).get(sid)!).push(it);
    }
    for (const [sid, items] of bySeller) {
      inner.append(this.el("h4", "", SELLERS[sid]?.name ?? sid));
      for (const { g, n } of items) {
        const d = GOODS[g];
        const r = this.el("div", "mk-bi");
        r.append(this.el("span", "", `${d.label} · ${fmtUnits(n)} ${d.unit}`),
          this.el("span", "", money(unitPriceVnd(g, day, w.suppliers) * n)));
        inner.append(r);
      }
    }

    const sum = this.el("div", "mk-sum");
    const line = (a: string, b: string, cls = "") => {
      const r = this.el("div", `mk-bi${cls ? ` ${cls}` : ""}`);
      r.append(this.el("span", "", a), this.el("span", "", b));
      sum.append(r);
    };
    line("Hết thảy", money(total), "big");
    line("Trong ống", money(w.money.cash));
    for (const [id, v] of plan.by) if (v > 0) line(`Ghi sổ ${SUPPLIERS[id].name}`, money(v));
    if (short) line("Còn thiếu", money(short), "short");
    else line("Trả xong còn lại", money(w.money.cash - (total - plan.credit)));
    inner.append(sum);
    return bill;
  }

  /** Chân trang: trái là TÌNH HÌNH, phải là VIỆC. Hai thứ không còn đứng lẫn vào nhau. */
  private foot(overCold: boolean) {
    const w = this.w, day = this.day;
    const foot = this.el("div", "mk-foot");

    if (this.confirming) {
      const total = basketCost(this.basket, day, w.suppliers);
      const plan = this.creditPlan(total);
      const short = total > w.money.cash + plan.credit;
      foot.append(this.el("span", `mk-msg${short || overCold ? " warn" : ""}`,
        short ? "Không đủ tiền. Bớt lại ít món." : overCold ? "Thùng xốp không đủ chỗ." : "Coi lại rồi trả tiền."));
      const acts = this.el("div", "mk-acts");
      const back = this.el("button", "mk-btn", "Sửa lại");
      back.dataset.k = "back";
      back.onclick = () => { this.confirming = false; this.render(); };
      const ok = this.el("button", "mk-btn primary", "Trả tiền");
      ok.dataset.k = "pay";
      ok.disabled = short || overCold;
      ok.onclick = () => this.finish();
      acts.append(back, ok);
      foot.append(acts);
      return foot;
    }

    foot.append(this.el("span", `mk-msg${overCold || this.msg ? " warn" : ""}`,
      this.msg || (overCold ? "Thùng xốp không đủ chỗ, bớt đồ lạnh lại." : "")));

    const acts = this.el("div", "mk-acts");
    const same = this.el("button", "mk-btn", "Mua như hôm qua");
    same.dataset.k = "same";
    // Ngày 1 `lastBasket` là rổ CÔ BA đã đi mua từ bốn giờ sáng — hàng đã nằm trong thùng
    // rồi. Chép lại là mua đúp: thùng xốp lập tức 8,8/8 ô, bấm gì cũng không checkout được.
    same.disabled = day === 1;
    if (day === 1) same.title = "Đồ bữa nay cô Ba mua sẵn rồi.";
    same.onclick = () => { this.basket = { ...w.inventory.lastBasket }; this.msg = ""; this.render(); };
    const clear = this.el("button", "mk-btn", "Bỏ hết");
    clear.dataset.k = "clear";
    clear.disabled = !this.picked().length;
    clear.onclick = () => { this.basket = {}; this.msg = ""; this.render(); };
    const has = this.picked().length > 0;
    const done = this.el("button", "mk-btn primary", has ? "Mua xong" : "Dọn hàng ra bán");
    done.dataset.k = "done";
    done.onclick = () => {
      if (overCold) { this.msg = "Thùng xốp không đủ chỗ, bớt đồ lạnh lại."; this.render(); return; }
      if (!has) { this.finish(); return; }
      this.confirming = true; this.render();
    };
    acts.append(same, clear, done);
    foot.append(acts);
    return foot;
  }

  /**
   * `render()` dựng lại NGUYÊN cây DOM mỗi lần bấm, nên chỗ cuộn và focus bay sạch: cuộn
   * xuống sạp rau bấm thêm một mớ là màn hình nhảy ngược lên đầu danh sách, bấm tiếp phải
   * cuộn xuống lại. `data-k` là tên cố định của từng nút, sống qua `replaceChildren` — chụp
   * trước, gắn lại sau.
   */
  private restore(scroll: number, focusKey: string) {
    const body = this.root.querySelector<HTMLElement>(".mk-body");
    if (body) body.scrollTop = scroll;
    if (!focusKey) return;
    const pick = (k: string) => this.root.querySelector<HTMLButtonElement>(`[data-k="${k}"]`);
    const el = pick(focusKey);
    // nút "−" tự khoá lúc về 0 — focus rơi sang nút "+" cùng hàng, không rơi về đầu trang
    (el && !el.disabled ? el : pick(focusKey.replace("minus:", "plus:")))?.focus();
  }

  /**
   * P3-06 §2.4 — màn hình DUY NHẤT trong game không có nút thoát: phải xoay đủ tiền học.
   * Ảnh món, giá mua và giá bán cạnh nhau. Không sting, không rung.
   */
  private mustSell() {
    const w = this.w;
    const book = this.el("div", "mk-book");
    const head = this.el("div", "mk-head");
    const top = this.el("div", "mk-head-top");
    top.append(this.el("div", "mk-title", "Phải xoay cho đủ"));
    head.append(top);
    const talk = this.el("div", "mk-talk");
    talk.append(this.el("div", "", "Tiền học của em không chờ được nữa. Bán cái nào?"));
    head.append(talk);
    book.append(head);
    const body = this.el("div", "mk-body solo");
    const items = resellable(w.equipment).filter((id) => forcedSellVnd(id) > 0);
    for (const id of items) {
      const card = this.el("div", "mk-card");
      card.append(this.el("div", "mk-seller", EQUIP[id].name));
      // con số phải là con số người chơi NHẬN — `forcedSell` bán qua `sellEquip(…, 0,5/0,6)`,
      // tức 50% giá mua tính TRÊN giá bán lại, không phải 50% giá mua tính thẳng. Hai công
      // thức hiện ra cùng kết quả cho mọi món đang bán được, nhưng món nào có `resale_k`
      // riêng (thùng xốp) là lệch ngay — nên tính từ đúng cái hàm bán.
      card.append(this.el("div", "mk-price", `mua ${money(priceVnd(id))} · bán lại ${money(forcedSellVnd(id))}`));
      const b = this.el("button", "mk-btn primary", "Bán");
      b.onclick = () => { forcedSell(w, id); this.render(); };
      card.append(b);
      body.append(card);
    }
    book.append(body);
    // P3-06 §2.4 nói màn này KHÔNG có nút thoát — nhưng "không có lối ra" chỉ đúng khi còn
    // cái để bán. Trên xe không còn món nào đáng đồng nào thì không có lựa chọn nào để bắt
    // người chơi chọn, và màn hình chỉ còn một cái tiêu đề với không một cái nút.
    if (!items.length) {
      const foot = this.el("div", "mk-foot");
      foot.append(this.el("span", "mk-msg warn", "Trên xe không còn món nào bán được nữa."));
      const out = this.el("button", "mk-btn primary", "Đẩy xe đi bán");
      out.onclick = () => { w.econ.mustSell = false; this.render(); };
      foot.append(out);
      book.append(foot);
    }
    return book;
  }

  private coldAdded() {
    let s = 0;
    for (const [g, n] of Object.entries(this.basket)) {
      const d = GOODS[g as GoodId];
      if (d.storage === "COLD") s += (n ?? 0) * (d.coldSlots ?? 1);
    }
    return s;
  }

  private row(g: GoodId) {
    const d = GOODS[g], day = this.day;
    const n = this.basket[g] ?? 0;
    // Dòng có hàng trong giỏ thì NỀN KHÁC: lướt mắt qua cả cái chợ là thấy ngay mình
    // đã lấy ở đâu, không phải đọc từng con số một.
    const row = this.el("div", `mk-row${n > 0 ? " has" : ""}`);
    const left = this.el("div");
    left.append(this.el("div", "mk-name", d.label));
    const pr = this.el("div", "mk-price", `${money(unitPriceVnd(g, day, this.w.suppliers))}/${d.unit}`);
    // dòng mờ này để học pattern "thứ Hai đắt, thứ Năm rẻ" BẰNG MẮT, nên hai con số phải
    // CÙNG MỘT LOẠI giá. Giá trần hôm qua so với giá đã bớt mối quen hôm nay thì dạy ngược:
    // ngày 20, bà Tám streak 9 → "43.000₫ · hôm qua 44.000₫" trong khi thật ra hôm qua trả
    // 39.500₫, tức giá TĂNG. Mối càng thân sai càng nặng.
    if (day > 1) pr.append(this.el("span", "mk-y", `hôm qua ${money(unitPriceVnd(g, day - 1, this.w.suppliers))}`));
    left.append(pr, this.el("div", "mk-have", `trong thùng: ${this.haveText(g)}`));
    const step = this.el("div", "mk-step");
    const minus = this.el("button", "", "−"), plus = this.el("button", "", "+");
    minus.setAttribute("aria-label", `bớt ${d.label}`); plus.setAttribute("aria-label", `thêm ${d.label}`);
    minus.dataset.k = `minus:${g}`; plus.dataset.k = `plus:${g}`;
    minus.disabled = n <= 0;
    minus.onclick = () => { this.basket[g] = Math.max(0, n - d.step); this.msg = ""; this.render(); };
    plus.onclick = () => { this.basket[g] = n + d.step; this.msg = ""; this.render(); };
    // Con số trần ("0", "5") không nói nó là cái gì. Kèm đơn vị thì nó tự đọc được:
    // "5 ổ", "1 lạng" — và trùng với cách cái giỏ bên phải ghi, không phải quy đổi trong đầu.
    step.append(minus, this.el("span", "mk-qty", n > 0 ? `${fmtUnits(n)} ${d.unit}` : "—"), plus);
    row.append(left, step);
    return row;
  }

  /**
   * Thiếu tiền thì người cho nợ được (bà Tám, dì Năm — người đã quen) ghi sổ phần của họ,
   * tới trần. Không có "vay" ở đâu khác (P3-02 §2.6.1).
   */
  private creditPlan(total: number) {
    const w = this.w, day = this.day;
    const by = new Map<SupplierId, number>();
    let need = Math.max(0, total - w.money.cash), credit = 0;
    for (const id of Object.keys(SUPPLIERS) as SupplierId[]) {
      if (need <= 0) break;
      const s = state(w.suppliers ??= {}, id);
      const part = Object.entries(this.basket).filter(([g, n]) => n && GOODS[g as GoodId].seller === id)
        .reduce((a, [g, n]) => a + unitPriceVnd(g as GoodId, day, w.suppliers) * (n ?? 0), 0);
      const room = Math.max(0, creditCeiling(id, s) - s.owed);
      const v = Math.min(part, room, need);
      if (v > 0) { by.set(id, v); need -= v; credit += v; }
    }
    return { credit, by };
  }

  private finish() {
    const w = this.w, day = this.day;
    const total = basketCost(this.basket, day, w.suppliers);
    const plan = this.creditPlan(total);
    if (total > w.money.cash + plan.credit) return;
    for (const [id, v] of plan.by) borrow(state(w.suppliers, id), v, day);
    w.money.cash -= total - plan.credit;
    // sổ ghi tiền RA KHỎI KÉT, không ghi giá trị giỏ hàng: phần ghi nợ mối chưa trả đồng nào
    // (nó sẽ thành dòng `debtRepay` hôm mình trả). Ghi cả `total` thì mua chịu 38 ngàn với 20
    // ngàn tiền mặt mà sổ ghi "chợ sáng −58.000₫".
    w.econ.today.market += total - plan.credit;
    // tiền lẻ: đổi bạc lớn lấy bạc nhỏ — không mất tiền, chỉ là có sẵn để thối. Đổi được
    // nhiều nhất là đúng số đang có trong ống sau khi trả tiền hàng.
    w.econ.float = w.econ.floatLeft = Math.max(0, Math.min(this.float * 1000, w.money.cash));
    afterMarket(w.suppliers, new Set(Object.entries(this.basket).filter(([, n]) => n).map(([g]) => GOODS[g as GoodId].seller as SupplierId)), day);
    const bought: MarketResult["bought"] = [];
    for (const [g, n] of Object.entries(this.basket)) {
      if (!n) continue;
      // `unitPriceVnd` ĐÃ tính người chơi khoản tăng giá của mối quen mất mặt, nên mốc
      // chuyện cũng phải được ghi — nếu không thì nó chỉ tồn tại ở đường bot (P4-04 §2.3).
      if (w.story && quenMat(g as GoodId, day, w.suppliers)) moment(w.story, "QUEN_MAT_DAT_HANG");
      buy(w.inventory, g as GoodId, n, day);
      bought.push({ good: g as GoodId, units: n });
    }
    w.inventory.lastBasket = { ...this.basket };
    // P4-04 §2.3 — "còn cái xe… con tính sao thì tính": ngày 35–39 người chơi trả lời bằng
    // việc MUA HÀNG. `buyBasket` (bot) ghi sẵn; người thật đi qua đây, không ghi thì nhánh
    // kết đó chết với mọi người chơi thật.
    if (w.story) noteBasketLoaves(w.story, day, this.basket.BANH ?? 0);
    w.econ.notices = [];
    this.close();
    this.opts.onDone({ spent: total, bought });
  }

  close() {
    if (!this.root.isConnected) return;
    this.root.remove();
    if (this.game.input.keyboard) this.game.input.keyboard.enabled = true;
  }
}

