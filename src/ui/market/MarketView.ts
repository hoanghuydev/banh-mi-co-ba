import type Phaser from "phaser";
import type { SaveFile } from "../../core/save";
import {
  CAL, GOODS, GOOD_IDS, SELLERS, WEEKDAY_VI, buy, coldSlotCap, coldSlotsUsed, lotQuality, priceOf,
  vnd, weatherOf, weekdayIdx, type GoodId,
} from "../../sim/econ";
import { basketCost, fmtUnits, forcedSell, unitPriceVnd } from "../../sim/day";
import { EQUIP, priceVnd, resellable } from "../../sim/equipment";
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
 *   · tổng tiền chỉ hiện ở bước xác nhận (doc: không có tổng chạy)
 *   · "mua như hôm qua" chép Y giỏ hôm qua, kể cả Chủ nhật — không bao giờ tối ưu
 */
const STYLE = `
.mk-root{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(18,22,26,.55);font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#2b2f31}
.mk-book{width:min(1000px,96vw);height:min(560px,94vh);display:flex;flex-direction:column;background:#f3ecdc;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.45);overflow:hidden}
.mk-head{padding:12px 18px 8px;border-bottom:2px solid #d8cdb3}
.mk-title{font-weight:700;font-size:1.15em}
.mk-sub{font-size:.85em;color:#6d624e;margin-top:2px}
.mk-news{font-size:.85em;color:#4a5a6a;margin-top:4px;font-style:italic}
.mk-body{flex:1;overflow:auto;padding:10px 18px;display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:10px;align-content:start}
.mk-card{background:#fbf7ec;border:1px solid #d8cdb3;border-radius:8px;padding:8px 10px}
.mk-seller{font-weight:700}
.mk-blurb{font-size:.78em;color:#7a6f5b;margin-bottom:4px}
.mk-row{display:grid;grid-template-columns:1fr auto;gap:4px 8px;align-items:center;padding:5px 0;border-top:1px dashed #e0d6bf}
.mk-name{font-size:.92em}
.mk-price{font-size:.82em}
.mk-y{color:#a99d85;margin-left:6px}
.mk-have{font-size:.76em;color:#6d624e}
.mk-step{display:flex;align-items:center;gap:4px}
.mk-step button{width:30px;height:30px;border-radius:6px;border:1px solid #b8ab8e;background:#fff;font:inherit;cursor:pointer}
.mk-step span{min-width:28px;text-align:center;font-weight:700}
.mk-foot{display:flex;gap:8px;justify-content:space-between;align-items:center;padding:10px 18px;border-top:2px solid #d8cdb3;flex-wrap:wrap}
.mk-btn{font:inherit;font-size:.9em;padding:7px 14px;border-radius:6px;border:1px solid #b8ab8e;background:#fbf7ec;color:#2b2f31;cursor:pointer;min-height:34px}
.mk-btn.primary{background:#2f5d8a;color:#fff;border-color:#2f5d8a}
.mk-btn:disabled{opacity:.5;cursor:default}
.mk-btn:focus-visible,.mk-step button:focus-visible{outline:2px solid #2f5d8a;outline-offset:2px}
.mk-msg{font-size:.85em;color:#8a4a2a}
.mk-cash{font-size:.9em}
`;

const money = (v: number) => `${Math.round(v).toLocaleString("vi-VN")}₫`;

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

  constructor(private game: Phaser.Game, private w: SaveFile, private opts: { textScale: number; onDone: (r: MarketResult) => void }) {
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

  private render() {
    const r = this.root;
    r.replaceChildren();
    if (this.w.econ.mustSell) { r.append(this.mustSell()); return; }
    const book = this.el("div", "mk-book");
    const w = this.w, day = this.day;

    // ── đầu trang: ngày, trời, két, tiền thuê, hàng bỏ, lời đồn ở chợ
    const head = this.el("div", "mk-head");
    head.append(this.el("div", "mk-title", `Ngày ${day} — ${WEEKDAY_VI[weekdayIdx(day)]}, đi chợ sáng`));
    const e = w.econ;
    const rentLine = e.today.rent ? `chủ nhà thu tiền chỗ ${money(e.today.rent)}` : e.rentOwed ? `chưa đủ tiền chỗ — nợ chủ nhà ${money(e.rentOwed)}` : `tiền chỗ ${money(rentVnd(e.stand))}`;
    head.append(this.el("div", "mk-sub", `${CAL.weatherInfo[weatherOf(day)].label} · ${money(w.money.cash)} trong ống · ${rentLine}`));
    for (const n of e.notices ?? []) for (const l of NOTICE_LINES[n] ?? []) head.append(this.el("div", "mk-news", l));
    for (const l of e.morningLines ?? []) head.append(this.el("div", "mk-news", l));
    // nợ người bán — trả được ở chợ; hạn luôn là "cuối tuần" (không đếm ngược)
    for (const id of Object.keys(SUPPLIERS) as SupplierId[]) {
      const s = w.suppliers?.[id];
      if (!s || s.owed <= 0) continue;
      const line = this.el("div", "mk-sub", `còn nợ ${SUPPLIERS[id].name} ${money(s.owed)} — hẹn cuối tuần `);
      const b = this.el("button", "mk-btn", "trả");
      b.disabled = w.money.cash <= 0;
      b.onclick = () => { repay(s, w.money, day); this.render(); };
      line.append(b);
      head.append(line);
    }
    if (e.today.wasted.length) head.append(this.el("div", "mk-sub", `sáng nay bỏ (hư): ${e.today.wasted.join(", ")}`));
    const up = upcoming(e, day, 2).filter((d) => d.kind === "HUI");
    if (up.length) head.append(this.el("div", "mk-news", `Cô Mai: "Mốt góp hụi nghen con."`));
    for (const l of rumours(day)) head.append(this.el("div", "mk-news", l));
    for (const l of alleyRumours(day, w.npcs.CHU_KIET?.tier === "FRIEND")) head.append(this.el("div", "mk-news", l));
    if (standClosed(e.stand, day)) head.append(this.el("div", "mk-news", `Bữa nay ${STANDS[e.stand].name.toLowerCase()} không bán được — người ta chắn hết rồi.`));
    if (e.stand !== "L1") head.append(this.el("div", "mk-sub", `đang bán ở: ${STANDS[e.stand].name.toLowerCase()}`));
    if (day === 1) head.append(this.el("div", "mk-news", "Bữa nay cô Ba đi chợ từ bốn giờ sáng — đồ đã có sẵn trong thùng. Con coi, thiếu gì mua thêm."));
    book.append(head);

    // ── các sạp
    const body = this.el("div", "mk-body");
    const bySeller = new Map<string, GoodId[]>();
    for (const g of GOOD_IDS) (bySeller.get(GOODS[g].seller) ?? bySeller.set(GOODS[g].seller, []).get(GOODS[g].seller)!).push(g);
    for (const [sid, goods] of bySeller) {
      const card = this.el("div", "mk-card");
      const sup = SUPPLIERS[sid as SupplierId];
      const closed = sup && isClosed(sid as SupplierId, day);
      card.append(this.el("div", "mk-seller", closed ? `${SELLERS[sid]?.name} — nghỉ giỗ, lấy đỡ lò khác` : SELLERS[sid]?.name ?? sid));
      // quan hệ đọc qua CÁCH GỌI, không qua thanh số (P3-02 §2.6.4)
      if (sup && !closed) card.append(this.el("div", "mk-blurb", `"${greetingOf(sid as SupplierId, state(w.suppliers ??= {}, sid as SupplierId))}"`));
      else card.append(this.el("div", "mk-blurb", SELLERS[sid]?.blurb ?? ""));
      for (const g of goods) card.append(this.row(g));
      body.append(card);
    }
    book.append(body);

    // ── chân trang
    const foot = this.el("div", "mk-foot");
    const cold = coldSlotsUsed(w.inventory, day) + this.coldAdded();
    const cap = coldSlotCap(w.inventory);
    const coldWord = cold > cap ? "thùng xốp không đủ chỗ" : cold > cap * 0.75 ? "thùng xốp gần đầy" : "thùng xốp còn chỗ";
    if (this.confirming) {
      const total = basketCost(this.basket, day, w.suppliers);
      const plan = this.creditPlan(total);
      const short = total > w.money.cash + plan.credit;
      const owe = [...plan.by].filter(([, v]) => v > 0).map(([id, v]) => `ghi nợ ${SUPPLIERS[id].name} ${money(v)}`).join(", ");
      foot.append(this.el("span", "mk-cash", `Hết ${money(total)} · trong ống ${money(w.money.cash)}`
        + (short ? ` — thiếu ${money(total - w.money.cash - plan.credit)}` : owe ? ` — ${owe}` : "")));
      const back = this.el("button", "mk-btn", "Sửa lại");
      back.onclick = () => { this.confirming = false; this.render(); };
      const ok = this.el("button", "mk-btn primary", "Trả tiền, dọn hàng ra bán");
      ok.disabled = short || cold > cap;
      ok.onclick = () => this.finish();
      foot.append(back, ok);
    } else {
      const fl = this.el("span", "mk-cash", "tiền lẻ: ");
      for (const v of [100, 200, 300]) {
        const b = this.el("button", `mk-btn${this.float === v ? " primary" : ""}`, `${v}k`);
        b.setAttribute("aria-pressed", String(this.float === v));
        b.onclick = () => { this.float = v; this.render(); };
        fl.append(b);
      }
      foot.append(fl);
      const same = this.el("button", "mk-btn", "Mua như hôm qua");
      same.onclick = () => { this.basket = { ...w.inventory.lastBasket }; this.msg = ""; this.render(); };
      const clear = this.el("button", "mk-btn", "Bỏ hết");
      clear.onclick = () => { this.basket = {}; this.render(); };
      foot.append(same, clear, this.el("span", "mk-msg", this.msg || coldWord));
      const done = this.el("button", "mk-btn primary", Object.values(this.basket).some((n) => n) ? "Mua xong" : "Không mua gì, dọn hàng");
      done.onclick = () => {
        if (cold > cap) { this.msg = "thùng xốp không đủ chỗ — bớt đồ lạnh lại"; this.render(); return; }
        if (!Object.values(this.basket).some((n) => n)) { this.finish(); return; }
        this.confirming = true; this.render();
      };
      foot.append(done);
    }
    book.append(foot);
    r.append(book);
  }

  /**
   * P3-06 §2.4 — màn hình DUY NHẤT trong game không có nút thoát: phải xoay đủ tiền học.
   * Ảnh món, giá mua và giá bán cạnh nhau. Không sting, không rung.
   */
  private mustSell() {
    const w = this.w;
    const book = this.el("div", "mk-book");
    const head = this.el("div", "mk-head");
    head.append(this.el("div", "mk-title", "Phải xoay cho đủ. Bán cái nào?"));
    head.append(this.el("div", "mk-sub", "Tiền học của em không chờ được nữa."));
    book.append(head);
    const body = this.el("div", "mk-body");
    for (const id of resellable(w.equipment)) {
      const card = this.el("div", "mk-card");
      card.append(this.el("div", "mk-seller", EQUIP[id].name));
      card.append(this.el("div", "mk-price", `mua ${money(priceVnd(id))} · bán ${money(Math.round(priceVnd(id) * 0.5 / 1000) * 1000)}`));
      const b = this.el("button", "mk-btn primary", "bán cái này");
      b.onclick = () => { forcedSell(w, id); this.render(); };
      card.append(b);
      body.append(card);
    }
    book.append(body);
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
    const row = this.el("div", "mk-row");
    const left = this.el("div");
    left.append(this.el("div", "mk-name", d.label));
    const pr = this.el("div", "mk-price", `${money(unitPriceVnd(g, day, this.w.suppliers))}/${d.unit}`);
    if (day > 1) pr.append(this.el("span", "mk-y", `hôm qua ${money(vnd(priceOf(g, day - 1)))}`));
    left.append(pr, this.el("div", "mk-have", `trong thùng: ${this.haveText(g)}`));
    const step = this.el("div", "mk-step");
    const n = this.basket[g] ?? 0;
    const minus = this.el("button", "", "−"), plus = this.el("button", "", "+");
    minus.setAttribute("aria-label", `bớt ${d.label}`); plus.setAttribute("aria-label", `thêm ${d.label}`);
    minus.disabled = n <= 0;
    minus.onclick = () => { this.basket[g] = Math.max(0, n - d.step); this.msg = ""; this.render(); };
    plus.onclick = () => { this.basket[g] = n + d.step; this.msg = ""; this.render(); };
    step.append(minus, this.el("span", "", String(n)), plus);
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
    w.econ.today.market += total;
    // tiền lẻ: đổi bạc lớn lấy bạc nhỏ — không mất tiền, chỉ là có sẵn để thối
    w.econ.float = w.econ.floatLeft = this.float * 1000;
    afterMarket(w.suppliers, new Set(Object.entries(this.basket).filter(([, n]) => n).map(([g]) => GOODS[g as GoodId].seller as SupplierId)), day);
    const bought: MarketResult["bought"] = [];
    for (const [g, n] of Object.entries(this.basket)) {
      if (!n) continue;
      buy(w.inventory, g as GoodId, n, day);
      bought.push({ good: g as GoodId, units: n });
    }
    w.inventory.lastBasket = { ...this.basket };
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

