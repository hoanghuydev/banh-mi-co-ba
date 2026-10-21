import type { SaveFile } from "../../core/save";
import { WEEKDAY_VI, weekdayIdx } from "../../sim/econ";
import {
  EQUIP, EQUIP_GROUPS, EQUIP_IDS, GROUP_IDS, buyEquip, capacity, has, priceVnd, resaleVnd, sellEquip,
  used, whyNot, type EquipId,
} from "../../sim/equipment";
import { evidenceFor, hasEvidence } from "../../sim/gearHint";

/**
 * Cảnh tối — không đồng hồ, không khách. Cuốn sổ mở: TRÁI là đếm tiền (đã xảy ra, không bấm được),
 * PHẢI là trang Đồ nghề (việc tối nay). Không tổng, không màu đỏ (P3-06 §3).
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

/* ── trang phải: ruột cuộn ── */
.ev-page{display:flex;flex-direction:column;min-height:0;background:#f6f0e1}
.ev-sheet{overflow:auto;min-height:0;flex:1;padding:12px 18px 16px}

/* ── nhóm + thẻ món ── */
.ev-grp{margin:14px 0 6px;font-size:.78em;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#8a7d64}
.ev-grp:first-child{margin-top:2px}
.ev-card{border:1px solid #ddd2b8;border-radius:8px;background:#fbf7ec;padding:9px 11px;margin-bottom:7px}
.ev-top{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.ev-name{font-weight:700;font-size:.98em}
.ev-price{font-size:.92em;font-variant-numeric:tabular-nums;white-space:nowrap}
.ev-price.cant{color:#8a7d64}
.ev-chips{display:flex;gap:5px;flex-wrap:wrap;margin:5px 0 4px}
.ev-chip{font-size:.74em;color:#7a6f5b;background:#f0e8d4;border:1px solid #e0d6bf;border-radius:5px;padding:1px 7px}
.ev-feel{font-size:.88em;line-height:1.5}
/* LỢI ÍCH quy ra chỉ số, mực xanh lá: mắt đọc ra "được", không phải "phải cân nhắc". */
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
  /** Bước xác nhận của một món (CANON §15.5). Chỉ MỘT món hỏi một lúc. */
  private ask: { kind: "buy" | "sell"; id: EquipId } | null = null;
  /** Mấy ô trên mặt xe đang được một thẻ "soi" — rê chuột lên nút mua / lên dòng món đã có. */
  private slotsEl: HTMLElement | null = null;

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
    const keep = this.root.querySelector(".ev-sheet")?.scrollTop ?? 0;
    this.root.replaceChildren();
    this.slotsEl = null;
    const book = this.el("div", "ev-book");
    const page = this.el("div", "ev-page");
    const sheet = this.el("div", "ev-sheet");
    sheet.append(...this.gear());
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
    if (et.rent) row("tiền chỗ", `−${money(et.rent)}`);
    if (et.tools) row(et.tools < 0 ? "bán đồ nghề" : "sắm đồ nghề", signed(et.tools), et.tools < 0 ? "in" : "out");
    if (et.talk) row("chi khi trò chuyện", `−${money(et.talk)}`);
    row("than, đá, túi, xăng", `−${money(et.fixed)}`);
    const cash = this.el("div", "ev-cash");
    cash.append(this.el("span", "", "trong ống"), this.el("span", "", money(w.money.cash)));
    L.append(cash);

    // Mọi câu NGƯỜI NÓI gom vô một khối có vạch lề, dưới cột số — không xen giữa mấy dòng tiền.
    const says = this.el("div", "ev-says");
    if (e.rentOwed) says.append(this.el("div", "ev-say", `Chủ nhà: "Tiền chỗ mấy bữa nay con tính sao?"`));
    for (const l of this.opts.lines ?? []) says.append(this.el("div", "ev-say", l));
    if (t.lost) says.append(this.el("div", "ev-note", "có người đợi không nổi rồi về"));
    if (et.soldOut) says.append(this.el("div", "ev-note", "có người tới mà hết bánh"));
    if (et.wasted.length) says.append(this.el("div", "ev-note", `sáng nay bỏ (hư): ${et.wasted.join(", ")}`));
    if (says.childElementCount) L.append(says);
    return L;
  }

  // ─────────────────────────────────────────────── chân trang

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

  /**
   * Đồ nghề — P3-04 §4 UI: giá, chỗ trên xe, tiền mỗi ngày, và MỘT câu về cảm giác. KHÔNG
   * BAO GIỜ hiện con số hiệu ứng. Chỗ trống trên xe vẽ thành ô mờ, không phải "8/14".
   */
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

  private gear(): HTMLElement[] {
    const w = this.w, e = w.equipment;
    const out: HTMLElement[] = [this.cart()];

    for (const g of GROUP_IDS) {
      const ids = EQUIP_IDS.filter((id) => EQUIP[id].group === g && (has(e, id) || !EQUIP[id].starting));
      if (!ids.length) continue;
      const mine = ids.filter((id) => has(e, id)), buy = ids.filter((id) => !has(e, id));
      // Món CÓ DẤU VẾT tối nay lên đầu khúc mua được. Tối nào cháy bánh thì cái lò điện phải
      // nằm chỗ mắt rơi vào trước, không nằm dưới ba món không dính dáng gì. Ngoài ra giữ
      // nguyên thứ tự trong JSON — không xếp theo giá, không xếp theo "nên mua trước".
      buy.sort((a, b) => Number(hasEvidence(b, w)) - Number(hasEvidence(a, w)));
      out.push(this.el("div", "ev-grp", EQUIP_GROUPS[g] ?? g));
      for (const id of mine) out.push(this.owned(id));
      for (const id of buy) out.push(this.offer(id));
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
    } else row.append(this.el("span", "ev-why", d.resellable === false ? "không bán lại được" : "có sẵn trên xe"));
    return row;
  }

  /** Món chưa có: một thẻ. */
  private offer(id: EquipId) {
    const w = this.w, e = w.equipment, d = EQUIP[id];
    const dau = evidenceFor(id, w);
    const box = this.el("div", `ev-card${dau ? " mark" : ""}`);
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
    // Lợi ích quy ra chỉ số, mỗi dòng một chỉ số, giữ thứ tự JSON (dòng đầu là lý do chính để mua).
    const gain = this.el("div", "ev-gain");
    for (const c of d.gain) gain.append(this.el("div", "", c));
    if (gain.childElementCount) box.append(gain);
    // DẤU VẾT (sim/gearHint): chuyện hôm nay của chính người chơi, không phải lời quảng cáo
    // của món đồ. Nó đứng DƯỚI cái giá và SÁT nút mua — chỗ mắt dừng lại lần cuối trước khi bấm.
    if (dau) box.append(this.el("div", "ev-mark", dau));

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

    const why = whyNot(id, e, w.money.cash);
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

  private buy(id: EquipId) {
    const w = this.w;
    this.ask = null;
    if (!buyEquip(id, w.equipment, w.money, w.econ)) { this.render(); return; }
    if (EQUIP[id].costsMorning) { w.flags.lateOpenDay = w.progress.dayIndex + 1; this.msg = 'Cô Mai: "Mai con đi làm giấy ngân hàng với cô, trưa về bán."'; }
    else this.msg = `Đã lắp ${EQUIP[id].name} lên xe.`;
    if (id === "BANG_HIEU") this.msg = "Đã dựng tấm bảng ra mép vỉa hè.";
    this.render();
  }

  close() { this.root.remove(); }
}
