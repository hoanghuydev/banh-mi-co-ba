import type { SaveFile } from "../../core/save";
import { SEASON_DAYS } from "../../core/save";
import { ECON, WEEKDAY_VI, weekdayIdx } from "../../sim/econ";
import { RECONCILE_DAYS, debtGap } from "../../sim/till";
import { STANDS, STAND_IDS } from "../../sim/stands";
import { canMoveTo, postMove, scout } from "../../sim/day";
import { rentVnd } from "../../sim/obligations";
import {
  EQUIP, EQUIP_IDS, buyEquip, capacity, has, priceVnd, resaleVnd, sellEquip, unlocked, used, whyNot, type EquipId,
} from "../../sim/equipment";
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
 */
const STYLE = `
.ev-root{position:fixed;inset:0;z-index:8990;display:flex;align-items:center;justify-content:center;background:rgba(14,18,22,.4);font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#2b2f31}
.ev-book{width:min(760px,94vw);max-height:94vh;display:grid;grid-template-columns:1fr 1fr;background:#efe6d2;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.45);overflow:hidden}
.ev-col{padding:14px 18px;overflow:auto;min-height:0}
.ev-left{border-right:2px solid #cdbf9f;font-family:ui-monospace,Consolas,monospace;font-size:.92em}
.ev-right{background:#f6f0e1}
.ev-h{font-weight:700;font-size:1.08em;margin:0 0 8px;font-family:"Be Vietnam Pro",system-ui,sans-serif}
.ev-r{display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px dashed #d8cdb3}
.ev-cash{margin-top:8px;font-weight:700}
.ev-note{font-size:.85em;color:#6d624e;margin-top:6px}
.ev-say{font-style:italic;color:#4a5a6a;margin:6px 0;font-size:.92em}
.ev-ink{font-family:"Segoe Print","Comic Sans MS",cursive;color:#2f5d8a}
.ev-due{padding:6px 0;border-bottom:1px dashed #d8cdb3}
.ev-due .btns{display:flex;gap:6px;margin-top:4px}
.ev-btn{font:inherit;font-size:.88em;padding:6px 12px;border-radius:6px;border:1px solid #b8ab8e;background:#fbf7ec;color:#2b2f31;cursor:pointer;min-height:32px}
.ev-btn.primary{background:#2f5d8a;color:#fff;border-color:#2f5d8a}
.ev-btn:disabled{opacity:.5;cursor:default}
.ev-btn:focus-visible{outline:2px solid #2f5d8a;outline-offset:2px}
.ev-foot{grid-column:1/3;display:flex;justify-content:flex-end;gap:8px;padding:10px 18px;border-top:2px solid #cdbf9f;background:#efe6d2}
`;

const money = (v: number) => `${Math.round(v).toLocaleString("vi-VN")}₫`;

const DUE_TEXT: Record<Due["kind"], (d: Due) => string> = {
  HUI: (d) => `ngày ${d.dueDay} · góp hụi kỳ ${d.id.split("_")[1]} (cô Mai) · ${money(d.amount)}`,
  TIEN_HOC: (d) => `ngày ${d.dueDay} · tiền học của em · ${money(d.amount)}`,
  TIEN_THUOC: (d) => `tiền thuốc của cô Ba · ${money(d.amount)}`,
};

export class EveningView {
  private root: HTMLDivElement;
  private deferred = new Set<string>();
  private msg = "";
  /** Trang phải đang mở: sổ nợ nần hay đồ nghề. */
  private tab: "debts" | "gear" | "stand" = "debts";
  private askSign = false;

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
    const w = this.w, day = w.progress.dayIndex, e = w.econ, t = w.progress.today, et = e.today;
    this.root.replaceChildren();
    const book = this.el("div", "ev-book");

    // ── trái: đếm tiền (máy ghi, không phán xét)
    const L = this.el("div", "ev-col ev-left");
    L.append(this.el("div", "ev-h", `Tối ngày ${day} — ${WEEKDAY_VI[weekdayIdx(day)]}`));
    const row = (a: string, b: string) => { const r = this.el("div", "ev-r"); r.append(this.el("span", "", a), this.el("span", "", b)); L.append(r); };
    row(`bán được ${t.served} ổ`, `+${money(t.revenue)}`);
    if (et.market) row("chợ sáng", `−${money(et.market)}`);
    if (et.rent) row("tiền chỗ", `−${money(et.rent)}`);
    row("than, đá, túi, xăng", `−${money(et.fixed)}`);
    row(et.sendHomeShort ? "gửi về nhà (gửi thiếu)" : "gửi về nhà", `−${money(et.sendHome)}`);
    if (et.obligations) row("trả nợ, góp hụi", `−${money(et.obligations)}`);
    L.append(this.el("div", "ev-cash", `trong ống: ${money(w.money.cash)}`));
    if (e.coBaCovered.includes(day)) L.append(this.el("div", "ev-say", `Cô Ba: "Két không đủ tiền than, cô bù rồi. Kệ, mai bán."`));
    if (t.lost) L.append(this.el("div", "ev-note", "có người đợi không nổi rồi về"));
    if (et.soldOut) L.append(this.el("div", "ev-note", "có người tới mà hết bánh"));
    if (et.wasted.length) L.append(this.el("div", "ev-note", `sáng nay bỏ (hư): ${et.wasted.join(", ")}`));
    if (e.rentOwed) L.append(this.el("div", "ev-say", `Chủ nhà: "Tiền chỗ mấy bữa nay con tính sao?"`));
    for (const l of this.opts.lines ?? []) L.append(this.el("div", "ev-say", l));
    book.append(L);
    if (this.tab === "gear") { book.append(this.gear()); this.finishRender(book); return; }
    if (this.tab === "stand") { book.append(this.stands()); this.finishRender(book); return; }

    // ── phải: sổ nghĩa vụ (chữ viết tay) + lời nhắc
    const R = this.el("div", "ev-col ev-right");
    R.append(this.el("div", "ev-h", "Sổ nợ nần"));
    // điện thoại: em gọi — báo trước 6 ngày, gọi lại mỗi tối tới khi đóng (P3-06 §2.2)
    const hoc = [...upcoming(e, day, 6), ...duesOpen(e, day)].find((d) => d.kind === "TIEN_HOC");
    if (hoc) {
      R.append(this.el("div", "ev-say", `Điện thoại — em: "Chị ơi em thi thử được tám phẩy hai."`));
      R.append(this.el("div", "ev-say", `"Ngày ${hoc.dueDay} đóng tiền học nghen chị."`));
    }
    const dues = duesOpen(e, day);
    if (!dues.length) R.append(this.el("div", "ev-note ev-ink", "bữa nay không có khoản nào"));
    for (const d of dues) {
      const box = this.el("div", "ev-due");
      box.append(this.el("div", "ev-ink", DUE_TEXT[d.kind](d)));
      if (d.kind === "HUI" && day === d.lastDay && day > d.dueDay) box.append(this.el("div", "ev-say", `Cô Mai: "Bữa nay chót rồi đó con."`));
      if (d.kind === "TIEN_THUOC") box.append(this.el("div", "ev-note", "vỉ thuốc để trên bàn"));
      const btns = this.el("div", "btns");
      const p = this.el("button", "ev-btn primary", d.kind === "HUI" ? "góp" : "gửi");
      p.disabled = w.money.cash < d.amount;
      p.onclick = () => {
        if (pay(e, w.money, d, day)) { this.msg = ""; this.render(); }
      };
      btns.append(p);
      if (d.mandatory && day < d.lastDay || !d.mandatory) {
        const later = this.el("button", "ev-btn", "để mai");
        later.onclick = () => { this.deferred.add(d.id); this.render(); };
        if (!this.deferred.has(d.id)) btns.append(later);
      }
      box.append(btns);
      R.append(box);
    }
    // hốt hụi — cảnh, không phải menu; hai lựa chọn: hốt / để kỳ sau (P3-06 §2.3)
    const period = canTakeHui(e, day);
    if (period) {
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
        const wait = this.el("button", "ev-btn", "để kỳ sau");
        wait.onclick = () => box.remove();
        btns.append(wait);
      }
      box.append(btns);
      R.append(box);
    }
    // ── sổ nợ khách (P3-03 §2.6): máy chỉ biết SỐ NGƯỜI chưa ghi — số tiền là trí nhớ của con
    const debts = w.money.debtsOwedToPlayer ?? [];
    const unwritten = debts.filter((d) => d.day === day && d.playerWrote === null);
    const openWritten = debts.filter((d) => d.playerWrote !== null && d.settledOnDay === undefined && day - d.day < 14);
    if (unwritten.length || openWritten.length) R.append(this.el("div", "ev-h", "Sổ bán chịu"));
    if (unwritten.length) R.append(this.el("div", "ev-note", `Hôm nay có ${unwritten.length} người mua chịu mà con chưa ghi.`));
    for (const d of unwritten) {
      const box = this.el("div", "ev-due");
      const hm = `${Math.floor(d.minute / 60)}h${String(d.minute % 60).padStart(2, "0")}`;
      box.append(this.el("div", "ev-ink", `${displayName(w.notebook, d.npcId, "khách")} · lúc ${hm} · bao nhiêu?`));
      const btns = this.el("div", "btns");
      const inp = this.el("input") as HTMLInputElement;
      inp.type = "number"; inp.min = "0"; inp.step = "1"; inp.placeholder = "nghìn";
      inp.setAttribute("aria-label", "số tiền (nghìn đồng)");
      inp.style.cssText = "width:90px;font:inherit;padding:4px";
      const ok = this.el("button", "ev-btn", "ghi");
      ok.onclick = () => { const v = Number(inp.value); if (v > 0) { d.playerWrote = Math.round(v) * 1000; this.render(); } };
      btns.append(inp, ok);
      box.append(btns);
      R.append(box);
    }
    for (const d of openWritten) R.append(this.el("div", "ev-note ev-ink", `${displayName(w.notebook, d.npcId, "khách")} · ngày ${d.day} · ${money(d.playerWrote!)}`));
    // đối sổ cuối kỳ — cô Ba nói một câu, KHÔNG phán xét
    if (RECONCILE_DAYS.includes(day)) {
      const gap = debtGap(debts, day);
      if (gap > 150_000 * ECON.scale) R.append(this.el("div", "ev-say", `Cô Ba: "Bán chịu nhiều mà ghi ít quá con. Thiếu chừng ${Math.round(gap / 10000) * 10} ngàn đó."`));
    }
    if (this.msg) R.append(this.el("div", "ev-note", this.msg));
    book.append(R);

    this.finishRender(book);
  }

  private finishRender(book: HTMLElement) {
    const day = this.w.progress.dayIndex;
    const foot = this.el("div", "ev-foot");
    for (const [id, label] of [["debts", "Sổ nợ nần"], ["gear", "Đồ nghề"], ["stand", "Chỗ đứng"]] as const) {
      const b = this.el("button", `ev-btn${this.tab === id ? " primary" : ""}`, label);
      b.setAttribute("aria-pressed", String(this.tab === id));
      b.onclick = () => { this.tab = id; this.msg = ""; this.render(); };
      foot.append(b);
    }
    const nb = this.el("button", "ev-btn", "Mở sổ tay");
    nb.onclick = () => this.opts.onBook();
    const sleep = this.el("button", "ev-btn primary", day >= SEASON_DAYS ? "Về sảnh" : "Đi ngủ");
    sleep.onclick = () => this.opts.onSleep();
    foot.append(nb, sleep);
    book.append(foot);
    this.root.append(book);
  }

  /**
   * Đồ nghề — P3-04 §4 UI: giá, chỗ trên xe, tiền mỗi ngày, và MỘT câu về cảm giác. KHÔNG
   * BAO GIỜ hiện con số hiệu ứng. Chỗ trống trên xe vẽ thành ô mờ, không phải "8/14".
   */
  private gear() {
    const w = this.w, day = w.progress.dayIndex, e = w.equipment;
    const R = this.el("div", "ev-col ev-right");
    R.append(this.el("div", "ev-h", "Đồ nghề trên xe"));
    const cap = capacity(e), u = used(e);
    const cells = this.el("div", "");
    cells.setAttribute("aria-label", "chỗ trên xe");
    cells.style.cssText = "display:flex;gap:3px;margin:4px 0 10px;flex-wrap:wrap";
    for (let i = 0; i < cap; i++) {
      const c = this.el("span");
      c.style.cssText = `width:14px;height:14px;border-radius:3px;border:1px solid #b8ab8e;background:${i < u ? "#8a7a60" : "rgba(184,171,142,.18)"}`;
      cells.append(c);
    }
    R.append(cells);
    if (this.askSign) {
      // P3-04 E3 — chọn tên ghi lên bảng hiệu. Không lựa chọn nào bị phạt.
      R.append(this.el("div", "ev-say", "Bảng hiệu ghi tên gì?"));
      const opts: [string, "CO_BA" | "PLAYER" | "BLANK"][] = [["BÁNH MÌ CÔ BA", "CO_BA"], [`Tên của con (${w.playerName})`, "PLAYER"], ["Không ghi chữ, vẽ ổ bánh thôi", "BLANK"]];
      for (const [t, v] of opts) {
        const b = this.el("button", "ev-btn", t);
        b.style.margin = "3px 0";
        b.onclick = () => {
          w.econ.signName = v;
          this.askSign = false;
          this.msg = v === "PLAYER" ? 'Cô Ba: "Ờ. Cũng tới lúc rồi." — cô cười.' : v === "CO_BA" ? "Cô Ba đứng nhìn tấm bảng hơi lâu." : "";
          this.render();
        };
        R.append(b);
      }
      return R;
    }
    for (const id of EQUIP_IDS) {
      const d = EQUIP[id];
      const own = has(e, id);
      if (!own && (d.starting || !unlocked(id, e, day, w.flags))) continue;
      const box = this.el("div", "ev-due");
      const head = own ? `${d.name} · đang có` : `${d.name} · ${priceVnd(id) ? money(priceVnd(id)) : "không tốn tiền"}`
        + `${d.slots > 0 ? ` · ${d.slots} chỗ` : d.slots < 0 ? ` · thêm ${-d.slots} chỗ` : ""}${d.daily_k ? " · tốn thêm mỗi ngày" : ""}`;
      box.append(this.el("div", "ev-ink", head), this.el("div", "ev-note", d.feel));
      if (!own) box.append(this.el("div", "ev-note", `cái giá: ${d.drawbacks.join("; ")}`));
      const btns = this.el("div", "btns");
      if (own) {
        if (d.resellable !== false && !d.starting) {
          const sell = this.el("button", "ev-btn", `bán lại ${money(resaleVnd(id))}`);
          sell.onclick = () => { sellEquip(id, e, w.money); this.msg = `đã bán ${d.name} — lấy lại sáu phần mười`; this.render(); };
          btns.append(sell);
        }
      } else {
        const why = whyNot(id, e, w.money.cash, day, w.flags);
        const b = this.el("button", "ev-btn primary", "mua");
        b.disabled = why !== null;
        b.onclick = () => this.buy(id);
        btns.append(b);
        if (why) btns.append(this.el("span", "ev-note", why));
      }
      box.append(btns);
      R.append(box);
    }
    if (this.msg) R.append(this.el("div", "ev-say", this.msg));
    return R;
  }

  /**
   * Chỗ đứng — P3-05 §4: chỉ là một trang vẽ tay trong sổ, điền dần bằng đi coi. Không bảng so
   * sánh, không điểm, không "bao nhiêu người sẽ theo". Dời = dán tờ giấy lên xe, mấy bữa sau đẩy đi.
   */
  private stands() {
    const w = this.w, e = w.econ;
    const R = this.el("div", "ev-col ev-right");
    R.append(this.el("div", "ev-h", "Mấy chỗ bán quanh đây"));
    if (e.movePlan) {
      const p = e.movePlan;
      R.append(this.el("div", "ev-say", `Tờ giấy dán trên xe: "Ngày ${p.moveDay} dời qua ${STANDS[p.to].name.toLowerCase()}."`));
      const c = this.el("button", "ev-btn", "gỡ tờ giấy");
      c.onclick = () => { e.movePlan = null; this.render(); };
      R.append(c);
    }
    for (const id of STAND_IDS) {
      const s = STANDS[id];
      const box = this.el("div", "ev-due");
      const here = e.stand === id;
      box.append(this.el("div", "ev-ink", `${s.name}${here ? " · đang bán ở đây" : ""}${s.push ? ` · đẩy ${s.push} phút` : ""}`));
      if (e.scouted.includes(id)) {
        box.append(this.el("div", "ev-note", s.blurb));
        box.append(this.el("div", "ev-note", `tiền chỗ ${money(rentVnd(id))} một ngày · ${s.rivals === 0 ? "không xe nào khác" : s.rivals === 1 ? "có một xe khác" : `${s.rivals} xe khác`} · ${s.shelter ? "có mái che" : "không có mái"}`));
      } else box.append(this.el("div", "ev-note", "chưa coi chỗ này"));
      const btns = this.el("div", "btns");
      if (!e.scouted.includes(id)) {
        const ask = this.el("button", "ev-btn", "hỏi dì Năm");
        ask.onclick = () => { scout(w, id); this.msg = 'Dì Năm: "Chỗ đó hả, để dì kể cho nghe."'; this.render(); };
        btns.append(ask);
      } else if (!here && !e.movePlan) {
        const why = canMoveTo(w, id);
        for (const [n, label] of [[1, "mai dời"], [2, "hai bữa nữa"], [4, "bốn bữa nữa"]] as const) {
          const b = this.el("button", "ev-btn", label);
          b.disabled = why !== null;
          b.onclick = () => { postMove(w, id, n); this.msg = ""; this.render(); };
          btns.append(b);
        }
        if (why) btns.append(this.el("span", "ev-note", why));
      }
      box.append(btns);
      R.append(box);
    }
    if (this.msg) R.append(this.el("div", "ev-say", this.msg));
    return R;
  }

  private buy(id: EquipId) {
    const w = this.w;
    if (!buyEquip(id, w.equipment, w.money)) return;
    // không popup, không toast: món mới cứ thế có mặt trên xe sáng mai (P3-04 §2.7)
    if (EQUIP[id].costsMorning) { w.flags.lateOpenDay = w.progress.dayIndex + 1; this.msg = 'Cô Mai: "Mai con đi làm giấy ngân hàng với cô, trưa về bán."'; }
    else this.msg = "";
    if (id === "BANG_HIEU") this.askSign = true;
    this.render();
  }

  close() { this.root.remove(); }
}
