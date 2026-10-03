import type Phaser from "phaser";
import { NPCS } from "../../content/npcs";
import { notebookWriteOpen } from "../../sim/season";
import { buildBody } from "../../art";
import { faceCrop } from "../../art/photo";
import type { SaveFile } from "../../core/save";
import type { NpcId } from "../../core/types";
import {
  MAX_OPEN_HYPOTHESES, SLOTS, SLOT_LABEL, guess, options, page, unguess, valueLabel,
  type EveningNote, type HypothesisSlot, type LogEntry, type Notebook,
} from "../../sim/notebook";
import { CLAIM } from "../../sim/gossip";

/**
 * Sổ tay cô Ba — P2-05 §2.2 / §4.2 (PC, trang đôi). Lớp DOM phủ lên canvas: gõ tiếng Việt
 * có dấu bằng bộ gõ của máy dễ hơn nhiều so với vẽ ô nhập trong Phaser.
 *
 *   TRÁI — "cô Ba ghi giùm": chữ đánh máy, KHÔNG sửa được. Ai · mấy giờ · gọi gì · lần thứ mấy.
 *   PHẢI — "con ghi": chữ viết tay mực xanh, sửa tự do. Tên, dòng tự do, "cô đoán".
 *
 * Không một con số quan hệ nào ở đây (T3). Giả thuyết không bao giờ hiện "sai" — tick đỏ
 * của cô Ba chỉ tới vào buổi tối, sau khi người chơi đã DÙNG điều mình đoán ở quầy.
 * Mở giữa ngày = pause hoàn toàn (CANON §15.2) — scene gọi lo phần đó.
 */
/** "6h47" — cách người trong hẻm nói giờ, không phải "06:47". */
const hm = (m: number) => `${Math.floor(m / 60)}h${String(Math.floor(m % 60)).padStart(2, "0")}`;

/**
 * 🔴 FONT: chỉ được dùng những face `index.html` đã nạp — **Be Vietnam Pro** (400/500/700,
 * mỗi cỡ ba subset, latin · latin-ext · vietnamese). `ui-monospace / Consolas / "Segoe
 * Print" / "Comic Sans MS"` KHÔNG có bộ chữ Việt: "Sổ ghi" ra "Sô᾿ ghi", "không sửa được"
 * ra "không sưả được" — đúng thứ quy tắc ở `index.html:11` cấm.
 *
 * Giữ cảm giác mà không mất dấu:
 *  · cột trái "máy ghi"  → số đều cột (`tabular-nums`) + giãn chữ, trên nền giấy kẻ dòng
 *  · cột phải "con ghi"  → mực xanh + nghiêng (`--tay`), trên nền có lằn lề đỏ
 */
const TAY = 'font-family:"Be Vietnam Pro",system-ui,sans-serif;font-style:italic;letter-spacing:.01em';

const STYLE = `
.nb-root{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(18,22,26,.62);font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#2b2f31}
.nb-book{width:min(1000px,96vw);height:min(560px,94vh);display:grid;grid-template-columns:1fr 1fr;background:#efe6d2;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.45);overflow:hidden}
.nb-col{display:flex;flex-direction:column;min-height:0;padding:14px 18px}
.nb-left{background:repeating-linear-gradient(#ece2cb 0 27px,#e2d6bb 27px 28px);border-right:2px solid #cdbf9f;font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1;letter-spacing:.015em}
.nb-right{background:#f6f0e1 linear-gradient(90deg,transparent 30px,#e8a9a0 30px 31px,transparent 31px);padding-left:44px}
.nb-h{display:flex;align-items:center;gap:8px;font-weight:700;font-size:1.05em;margin-bottom:6px}
.nb-sub{font-weight:400;font-size:.78em;color:#7a6f5b}
.nb-scroll{overflow:auto;flex:1;min-height:0;padding-right:4px}
.nb-e{display:grid;grid-template-columns:40px 1fr;gap:8px;padding:6px 0;border-bottom:1px dashed #cdbf9f}
.nb-e img,.nb-face img{width:34px;height:34px;object-fit:cover;object-position:50% 0;image-rendering:pixelated;border-radius:50%;background:#d9cdb2}
.nb-t{font-size:.8em;color:#6d624e}
.nb-q{font-size:.92em}
.nb-note{font-size:.8em;color:#4a5a6a}
.nb-red{${TAY};color:#b0342a;font-size:.98em;line-height:1.5;margin:6px 0 10px;padding:8px 10px;border-left:3px solid #b0342a;background:rgba(176,52,42,.06)}
.nb-red div{margin:2px 0}
.nb-abs{margin-top:8px;padding-top:6px;border-top:2px solid #cdbf9f}
.nb-abs .row{display:flex;align-items:center;gap:8px;margin:4px 0}
.nb-abs .row img {width :35px; height:35px ; object-fit:contain}
.nb-faces{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.nb-face{cursor:pointer;border:2px solid transparent;border-radius:50%;padding:1px;background:none}
.nb-face.on{border-color:#2f5d8a}
.nb-face:focus-visible,.nb-btn:focus-visible{outline:2px solid #2f5d8a;outline-offset:2px}
.nb-ink{${TAY};color:#2f5d8a}
.nb-in{width:100%;box-sizing:border-box;font:inherit;font-size:1.05em;padding:4px 6px;border:none;border-bottom:1px solid #b8ab8e;background:transparent;color:#2f5d8a;${TAY}}
.nb-ta{width:100%;box-sizing:border-box;min-height:90px;resize:vertical;font:inherit;padding:6px;border:1px solid #d8cdb3;background:rgba(255,255,255,.35);color:#2f5d8a;${TAY};line-height:1.6}
.nb-guess{margin-top:8px;border:1px solid #cdbf9f;border-radius:6px;padding:6px 8px;background:rgba(255,255,255,.3)}
.nb-g{display:grid;grid-template-columns:18px 104px 1fr;align-items:center;gap:6px;margin:3px 0;font-size:.9em}
.nb-g select{font:inherit;padding:2px;background:#fbf7ec;border:1px solid #cdbf9f;color:#2f5d8a}
.nb-ok{color:#b0342a;font-weight:700}
.nb-msg{font-size:.78em;color:#7a6f5b;min-height:1.2em}
.nb-bar{display:flex;gap:8px;justify-content:space-between;align-items:center;margin-top:8px}
.nb-btn{font:inherit;font-size:.85em;padding:6px 12px;border-radius:6px;border:1px solid #b8ab8e;background:#fbf7ec;color:#2b2f31;cursor:pointer;min-height:32px}
.nb-btn.primary{background:#2f5d8a;color:#fff;border-color:#2f5d8a}
.nb-empty{color:#7a6f5b;font-size:.85em;padding:8px 0}
`;

export type NotebookOpts = {
  mode: "evening" | "midday";
  /** Tỉ lệ cỡ chữ CANON §15.1. */
  textScale: number;
  /** Bật trang cuối ngày của cô Ba (công tắc #4). */
  showEvening: boolean;
  onClose: () => void;
};

export class NotebookView {
  private root: HTMLDivElement;
  /** Hai nửa trang đôi, dựng một lần rồi chỉ thay ruột từng nửa — xem `render()`. */
  private colL!: HTMLDivElement;
  private colR!: HTMLDivElement;
  private day: number;
  private sel: NpcId | null = null;
  private msg = "";
  private faces = new Map<string, string>();
  private keyGuard = (ev: KeyboardEvent) => {
    // Phím gõ trong sổ không được lọt xuống game (WASD, E, Q…).
    //
    // Tab NHẢY Ô, không đóng sổ: ô tên, vùng ghi chú và sáu ô "Cô đoán" là chỗ duy nhất
    // trong game phải gõ bằng bàn phím — Tab mà đóng sổ thì cả trang chỉ dùng được bằng
    // chuột, và người chơi bị ném thẳng về cái quầy đang bán. Esc vẫn đóng.
    if (ev.code === "Escape") { ev.preventDefault(); this.close(); }
    else if (ev.code === "Tab") this.cycleFocus(ev);
    ev.stopPropagation();
  };

  /**
   * Vòng tiêu điểm khép kín trong sổ: Tab từ ô cuối quay về ô đầu (Shift+Tab thì ngược).
   * Tự lo chứ không để trình duyệt lo, vì phía sau sổ còn cái canvas của game.
   */
  private cycleFocus(ev: KeyboardEvent) {
    const all = [...this.root.querySelectorAll<HTMLElement>("button,input,textarea,select,[tabindex]")]
      .filter((e) => !(e as HTMLButtonElement).disabled && e.tabIndex >= 0);
    if (!all.length) return;
    ev.preventDefault();
    const at = all.indexOf(document.activeElement as HTMLElement);
    const next = at < 0 ? 0 : (at + (ev.shiftKey ? -1 : 1) + all.length) % all.length;
    all[next].focus();
  }

  constructor(private game: Phaser.Game, private scene: Phaser.Scene, private w: SaveFile, private opts: NotebookOpts) {
    this.day = w.progress.dayIndex;
    if (!document.getElementById("nb-style")) {
      const st = document.createElement("style");
      st.id = "nb-style";
      st.textContent = STYLE;
      document.head.appendChild(st);
    }
    this.root = document.createElement("div");
    this.root.className = "nb-root";
    this.root.style.fontSize = `${Math.round(14 * opts.textScale)}px`;
    this.root.addEventListener("keydown", this.keyGuard, true);
    this.root.addEventListener("keyup", (e) => e.stopPropagation(), true);
    this.root.addEventListener("pointerdown", (e) => { if (e.target === this.root) this.close(); });
    document.body.appendChild(this.root);
    if (this.game.input.keyboard) this.game.input.keyboard.enabled = false;
    const nb = this.nb;
    this.sel = nb.pages[this.lastVisitor() ?? ""] ? this.lastVisitor() : nb.met[0] ?? null;
    this.render();
    (this.root.querySelector("button") as HTMLButtonElement | null)?.focus();
  }

  private get nb(): Notebook { return this.w.notebook; }

  private lastVisitor(): NpcId | null {
    for (let i = this.nb.log.length - 1; i >= 0; i--) {
      const id = this.nb.log[i].npcId;
      if (id !== "KHACH_LA") return id;
    }
    return null;
  }

  private face(id: string): string {
    let u = this.faces.get(id);
    if (u !== undefined) return u;
    const npc = NPCS.find((n) => n.id === id);
    if (npc && !this.scene.textures.exists(`${id}_s`)) buildBody(this.scene, id, npc.body);
    // `faceCrop` chứ không `getBase64`: xem lý do ở `art/photo.faceCrop` — texture người
    // vẽ bằng code và texture ảnh thật có lề khác nhau, giao cho CSS cắt là ra hai kiểu
    // chân dung khác hẳn nhau trên cùng một trang sổ.
    u = this.scene.textures.exists(`${id}_s`) ? faceCrop(this.scene, `${id}_s`) : "";
    this.faces.set(id, u);
    return u;
  }

  /** Tên hiển thị trong sổ = tên NGƯỜI CHƠI ghi. Chưa ghi thì là "—". */
  private who(id: string) {
    if (id === "KHACH_LA") return "khách lạ";
    return this.nb.pages[id]?.name?.trim() || "—";
  }

  private el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = ""): HTMLElementTagNameMap[K] {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  /**
   * HAI cột dựng RIÊNG, và chỉ dựng lại cột nào thật sự đổi.
   *
   * Dựng lại cả cây cho một thay đổi giá trị là cách chắc chắn nhất để nuốt chữ người
   * chơi: mousedown vào ô ghi chú làm ô tên mất tiêu điểm → `change` → render → cái
   * textarea vừa bấm bị huỷ giữa chừng, mouseup rơi vào phần tử mới và KHÔNG AI được
   * tiêu điểm. Gõ 140 ký tự vào không một chữ nào lọt, không báo lỗi gì.
   * Đổi tên chỉ đụng cột trái (tên hiện trong từng dòng máy ghi) — cột phải không rụng.
   */
  private render() {
    this.root.replaceChildren();
    const book = this.el("div", "nb-book");
    this.colL = this.el("div", "nb-col nb-left");
    this.colR = this.el("div", "nb-col nb-right");
    book.append(this.colL, this.colR);
    this.root.append(book);
    this.renderLeft(true);
    this.renderRight();
  }

  /** Thay ruột một cột, giữ nguyên chỗ đang cuộn (đổi một ô "Cô đoán" không được nhảy trang). */
  private swap(col: HTMLElement, parts: HTMLElement[], toBottom = false) {
    const keep = col.querySelector(".nb-scroll")?.scrollTop ?? -1;
    col.replaceChildren(...parts);
    const sc = col.querySelector(".nb-scroll") as HTMLElement | null;
    if (sc) sc.scrollTop = keep >= 0 && !toBottom ? keep : sc.scrollHeight;
  }

  private renderLeft(toBottom = false) { this.swap(this.colL, this.left(), toBottom); }

  private renderRight() {
    const focused = (document.activeElement as HTMLElement | null)?.dataset?.nbSlot;
    this.swap(this.colR, this.right());
    // Đổi một ô "Cô đoán" xong thì tiêu điểm phải ở lại ĐÚNG ô đó, không rơi về body.
    if (focused) this.colR.querySelector<HTMLElement>(`[data-nb-slot="${focused}"]`)?.focus();
  }

  // ───────────────────────────────────────────────── cột trái — máy ghi

  private left(): HTMLElement[] {
    const col: HTMLElement[] = [];
    const h = this.el("div", "nb-h");
    const prev = this.el("button", "nb-btn", "‹");
    const next = this.el("button", "nb-btn", "›");
    prev.setAttribute("aria-label", "ngày trước");
    next.setAttribute("aria-label", "ngày sau");
    prev.onclick = () => { this.day = Math.max(1, this.day - 1); this.renderLeft(); };
    next.onclick = () => { this.day = Math.min(this.w.progress.dayIndex, this.day + 1); this.renderLeft(); };
    const title = this.el("span", "", `Sổ ghi — ngày ${this.day}`);
    title.append(this.el("span", "nb-sub", "  (cô Ba ghi giùm)"));
    h.append(prev, title, next);
    col.push(h);

    const sc = this.el("div", "nb-scroll");
    // trang cuối ngày của cô Ba — mực đỏ, 2–3 dòng, không phán đúng sai
    const note: EveningNote | undefined = this.nb.eveningNotes.find((n) => n.day === this.day);
    if (note && (this.opts.showEvening || note.confirmations.length)) {
      const red = this.el("div", "nb-red");
      if (this.opts.showEvening) for (const l of note.lines) red.append(this.el("div", "", l));
      for (const c of note.confirmations) red.append(this.el("div", "", `✓ ${c.line}`));
      sc.append(red);
    }
    const rows = this.nb.log.filter((e) => e.day === this.day);
    if (!rows.length) sc.append(this.el("div", "nb-empty", "chưa có gì trong ngày này"));
    for (const e of rows) sc.append(this.entry(e));

    // "lâu rồi không thấy" — chỉ đếm số bữa, không diễn giải (§2.6)
    if (this.opts.showEvening) {
      const abs = this.nb.met.map((id) => ({ id, n: this.w.npcs[id]?.missStreak ?? 0 })).filter((a) => a.n >= 2 && !this.w.npcs[a.id]?.gone);
      if (abs.length) {
        const box = this.el("div", "nb-abs");
        box.append(this.el("div", "nb-h", "Lâu rồi không thấy"));
        for (const a of abs.sort((x, y) => y.n - x.n)) {
          const row = this.el("div", "row");
          const img = this.el("img");
          img.src = this.face(a.id); img.alt = "";
          row.append(img, this.el("span", "nb-ink", this.who(a.id)), this.el("span", "nb-t", `— ${a.n} bữa`));
          box.append(row);
        }
        sc.append(box);
      }
    }
    col.push(sc);

    const bar = this.el("div", "nb-bar");
    const csv = this.el("button", "nb-btn", "Xuất CSV");
    csv.onclick = () => this.exportCsv();
    bar.append(csv, this.el("span", "nb-t", "tự ghi, không sửa được"));
    col.push(bar);
    return col;
  }

  private entry(e: LogEntry) {
    const row = this.el("div", "nb-e");
    const img = this.el("img");
    img.alt = "";
    if (e.npcId !== "KHACH_LA") img.src = this.face(e.npcId);
    row.append(img);
    const body = this.el("div");
    body.append(this.el("div", "nb-t", `${hm(e.minute)}  ${this.who(e.npcId)}`));
    if (e.orderText) body.append(this.el("div", "nb-q", `"${e.orderText}"`));
    const extra: string[] = [];
    if (e.visitCount) extra.push(`lần thứ ${e.visitCount}`);
    const n = e.note;
    if (n?.t === "FIRST_VISIT") extra.push("lần đầu ghé");
    if (n?.t === "EAVESDROP") extra.push(`(nghe ở góc hẻm) ${n.source ? this.who(n.source) + " — " : ""}${CLAIM[n.claim]?.label ?? "chuyện gì đó"}`);
    if (n?.t === "SAID_SOMETHING") extra.push(`kể: "${n.text}"`);
    if (n?.t === "ABSENT_STREAK") extra.push(`lâu rồi không ghé (${n.missed} bữa)`);
    if (extra.length) body.append(this.el("div", "nb-note", extra.join(" · ")));
    row.append(body);
    if (e.npcId !== "KHACH_LA") { row.style.cursor = "pointer"; row.onclick = () => { this.sel = e.npcId; this.msg = ""; this.renderRight(); }; }
    return row;
  }

  // ───────────────────────────────────────────────── cột phải — con ghi

  private right(): HTMLElement[] {
    const col: HTMLElement[] = [];
    const nb = this.nb;
    const h = this.el("div", "nb-h");
    h.append(this.el("span", "", "Người trong hẻm"), this.el("span", "nb-sub", "  (con ghi)"));
    col.push(h);
    const faces = this.el("div", "nb-faces");
    for (const id of nb.met) {
      const b = this.el("button", `nb-face${id === this.sel ? " on" : ""}`);
      const img = this.el("img");
      img.src = this.face(id); img.alt = this.who(id);
      b.title = this.who(id);
      b.append(img);
      b.onclick = () => { this.sel = id; this.msg = ""; this.renderRight(); };
      faces.append(b);
    }
    col.push(faces);
    const sc = this.el("div", "nb-scroll");
    if (!this.sel) {
      sc.append(this.el("div", "nb-empty", "chưa gặp ai. Mở hàng rồi hẵng ghi."));
    } else sc.append(this.pageView(this.sel));
    col.push(sc);

    const bar = this.el("div", "nb-bar");
    bar.append(this.el("span", "nb-t", this.opts.mode === "evening" ? "đóng sổ rồi đi ngủ" : "Tab nhảy ô · Esc đóng sổ · quầy đứng yên trong lúc này"));
    const close = this.el("button", "nb-btn primary", "Đóng sổ");
    close.onclick = () => this.close();
    bar.append(close);
    col.push(bar);
    return col;
  }

  private pageView(id: NpcId) {
    const wrap = this.el("div");
    const p = page(this.nb, id, this.w.progress.dayIndex);
    const top = this.el("div", "nb-h");
    const img = this.el("img");
    img.src = this.face(id); img.alt = "";
    img.style.cssText = "width:44px;height:44px;border-radius:50%;object-fit:cover;object-position:50% 0;image-rendering:pixelated;background:#d9cdb2";
    // P4-03 SK-21: thầy Phúc đưa cây bút NGÀY 11 — trước đó cột phải chỉ có mặt người, chưa ghi được
    if (!notebookWriteOpen(this.w.progress.dayIndex)) {
      top.append(img);
      wrap.append(top);
      wrap.append(this.el("div", "nb-t", `gặp lần đầu ngày ${p.firstSeenDay}`));
      wrap.append(this.el("div", "nb-empty", "chưa có cây bút, con nhớ trong đầu đã."));
      return wrap;
    }
    const name = this.el("input", "nb-in");
    name.placeholder = "tên (con tự ghi)";
    name.value = p.name;
    name.maxLength = 32;
    name.setAttribute("aria-label", "tên người này");
    name.oninput = () => { p.name = name.value; };
    // CHỈ cột trái: dựng lại cột phải ở đây là huỷ đúng cái ô người chơi vừa bấm sang.
    name.onchange = () => {
      this.renderLeft();
      const b = this.colR.querySelectorAll<HTMLButtonElement>(".nb-face")[this.nb.met.indexOf(id)];
      if (b) { b.title = this.who(id); b.querySelector("img")?.setAttribute("alt", this.who(id)); }
    };
    top.append(img, name);
    wrap.append(top);
    wrap.append(this.el("div", "nb-t", `gặp lần đầu ngày ${p.firstSeenDay}`));

    const ta = this.el("textarea", "nb-ta");
    ta.placeholder = "ghi gì cũng được: ai, hay ghé lúc nào, thích gì…";
    ta.value = p.freeLines;
    ta.setAttribute("aria-label", "ghi chú của con");
    ta.oninput = () => { p.freeLines = ta.value; };
    wrap.append(ta);

    const box = this.el("div", "nb-guess");
    box.append(this.el("div", "nb-h", "Cô đoán"));
    const day = this.w.progress.dayIndex;
    for (const slot of SLOTS) box.append(this.slotRow(id, slot, day));
    const open = p.hypotheses.filter((h) => h.state === "OPEN").length;
    box.append(this.el("div", "nb-msg", this.msg || `đang đoán ${open}/${MAX_OPEN_HYPOTHESES} điều`));
    wrap.append(box);
    return wrap;
  }

  private slotRow(id: NpcId, slot: HypothesisSlot, day: number) {
    const row = this.el("div", "nb-g");
    const h = this.nb.pages[id]?.hypotheses.find((x) => x.slot === slot);
    row.append(this.el("span", h?.state === "CONFIRMED" ? "nb-ok" : "", h?.state === "CONFIRMED" ? "✓" : "○"));
    row.append(this.el("span", "", SLOT_LABEL[slot]));
    if (h?.state === "CONFIRMED") {
      row.append(this.el("span", "nb-ink", valueLabel(slot, h.value)));
      return row;
    }
    const opts = options(this.nb, id, slot);
    const sel = this.el("select");
    sel.setAttribute("aria-label", SLOT_LABEL[slot]);
    const blank = this.el("option", "", opts.length ? "______" : "(chưa biết gì)");
    blank.value = "";
    sel.append(blank);
    for (const v of opts) {
      const o = this.el("option", "", valueLabel(slot, v));
      o.value = v;
      sel.append(o);
    }
    sel.value = h?.value ?? "";
    sel.disabled = !opts.length;
    sel.dataset.nbSlot = slot;
    sel.onchange = () => {
      if (!sel.value) { unguess(this.nb, id, slot); this.msg = ""; }
      else this.msg = guess(this.nb, id, slot, sel.value, day) ?? "";
      this.renderRight();
    };
    row.append(sel);
    return row;
  }

  private exportCsv() {
    const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const lines = ["ngay,gio,nguoi,goi_mon,lan_thu,ghi_chu"];
    for (const e of this.nb.log) {
      const n = e.note;
      const note = !n ? "" : n.t === "EAVESDROP" ? `nghe lỏm: ${CLAIM[n.claim]?.label ?? n.claim}${n.source ? ` (${this.who(n.source)})` : ""}`
        : n.t === "SAID_SOMETHING" ? `kể: ${n.text}` : n.t === "FIRST_VISIT" ? "lần đầu ghé" : `vắng ${n.missed} bữa`;
      lines.push([e.day, hm(e.minute), q(this.who(e.npcId)), q(e.orderText), e.visitCount, q(note)].join(","));
    }
    const url = URL.createObjectURL(new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `so-tay-co-ba-ngay-${this.w.progress.dayIndex}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  close() {
    if (!this.root.isConnected) return;
    this.root.remove();
    if (this.game.input.keyboard) this.game.input.keyboard.enabled = true;
    this.opts.onClose();
  }

  get open() { return this.root.isConnected; }
}
