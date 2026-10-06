import type Phaser from "phaser";
import { NPCS } from "../../content/npcs";
import { notebookWriteOpen } from "../../sim/season";
import { buildBody } from "../../art";
import { faceCrop } from "../../art/photo";
import type { SaveFile } from "../../core/save";
import type { NpcId } from "../../core/types";
import {
  MAX_OPEN_HYPOTHESES, SLOTS, SLOT_LABEL, guess, knownOf, options, page, penName, relWords, unguess, valueLabel,
  type EveningNote, type HypothesisSlot, type LogEntry, type Notebook,
} from "../../sim/notebook";
import { Rng } from "../../core/rng";
import { CLAIM } from "../../sim/gossip";

/**
 * Sổ tay của chính người bán — P2-05 §2.2 / §4.2 (PC, trang đôi). Lớp DOM phủ lên canvas:
 * gõ tiếng Việt có dấu bằng bộ gõ của máy dễ hơn nhiều so với vẽ ô nhập trong Phaser.
 *
 * 🔴 HAI THỨ CHỮ, ĐỪNG TRỘN (docs/VAN-PHONG-UI.md): mọi NHÃN ở đây — tiêu đề cột, tên ô,
 * dòng trạng thái, nút — viết TIẾNG PHỔ THÔNG, danh ngữ, không "nghen/bữa/khỏi/hẵng".
 * Giọng miền Nam chỉ sống trong thứ CÓ NGƯỜI VIẾT RA: dòng nhận xét về người, trang cuối
 * ngày, dấu khoanh bút đỏ — tất cả nằm ở `content/lines/so-tay.json`, không nằm trong file này.
 *
 * MỘT GIỌNG, HAI CÂY BÚT. Quán là của người chơi, nên cả cuốn sổ là chữ của một người —
 * phân công lao động của §2.2 giữ nguyên, chỉ đổi cách kể:
 *   TRÁI — "ghi vội lúc bán": máy ghi, KHÔNG sửa được. Ai · mấy giờ · gọi gì · lần thứ mấy.
 *   PHẢI — "ngồi nghĩ lại": chữ tay mực xanh, sửa tự do. Tên, dòng tự do, "mình đoán".
 *
 * Không một con số quan hệ nào ở đây (T3). Giả thuyết không bao giờ hiện "sai" — dấu khoanh
 * bút đỏ chỉ tới vào buổi tối, sau khi người chơi đã DÙNG điều mình đoán ở quầy.
 * Mở giữa ngày = pause hoàn toàn (CANON §15.2) — scene gọi lo phần đó.
 */
const hm = (m: number) => `${Math.floor(m / 60)}h${String(Math.floor(m % 60)).padStart(2, "0")}`;

/**
 * Thước độ hiểu, NÓI RA BẰNG CHỮ.
 *
 * `3/6` là một tỉ số không nói nó đếm cái gì — người chơi mở sổ ra lần đầu nhìn vào không
 * hiểu gì hết, và cái dải mặt sáu vạch cũng vậy. Cùng con số đó, viết thành câu, thì tự
 * nó giải thích nó, và vẫn đếm được y như cũ.
 *
 * Phần "còn n điều chưa rõ" không phải cho đẹp: ô trống mới là thứ kéo người chơi ra quầy
 * để ý tiếp (P2-05b §3.1 — Zeigarnik). Bỏ nó đi là bỏ mất nửa tác dụng của cả cái thước.
 */
const knownWords = (k: { done: number; total: number }) =>
  k.done === 0 ? "chưa xác nhận điều nào"
  : k.done >= k.total ? `đã xác nhận cả ${k.total} điều`
  : `đã xác nhận ${k.done} · chưa rõ ${k.total - k.done}`;

/**
 * 🔴 FONT: chỉ được dùng những face `index.html` đã nạp — **Be Vietnam Pro** (400/500/700,
 * mỗi cỡ ba subset, latin · latin-ext · vietnamese). `ui-monospace / Consolas / "Segoe
 * Print" / "Comic Sans MS"` KHÔNG có bộ chữ Việt: "Sổ ghi" ra "Sô᾿ ghi", "không sửa được"
 * ra "không sưả được" — đúng thứ quy tắc ở `index.html:11` cấm.
 *
 * Giữ cảm giác mà không mất dấu:
 *  · cột trái "máy ghi"  → số đều cột (`tabular-nums`) + giãn chữ, trên nền giấy kẻ dòng
 *  · cột phải "nghĩ lại" → mực xanh + nghiêng (`--tay`), trên nền có lằn lề đỏ
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
.nb-faces{display:flex;flex-wrap:wrap;gap:9px 7px;margin-bottom:8px}
.nb-face{cursor:pointer;border:none;background:none;padding:0;width:42px;display:flex;flex-direction:column;align-items:center;gap:3px}
.nb-av{position:relative;border:2px solid transparent;border-radius:50%;padding:1px;line-height:0}
.nb-face.on .nb-av{border-color:#2f5d8a}
.nb-face.away{opacity:.5}
/* "co tick moi o nguoi nay" - dau duy nhat trong dai MOI nguoi choi bam vao */
.nb-badge{position:absolute;right:-3px;top:-3px;width:14px;height:14px;border-radius:50%;background:#b0342a;color:#f6f0e1;font-size:9px;font-weight:700;line-height:13px;text-align:center;border:1.5px solid #f6f0e1}
/* Thuoc DO HIEU. Ve bang hop CSS chu khong bang ky tu hinh hoc: cung ly do o khoi FONT
   ben tren - glyph hinh hoc khong co trong Be Vietnam Pro, may nao co bo nao thi ra bo do. */
.nb-kn{display:flex;gap:2px;align-items:center;height:7px}
.nb-kn s{display:block;width:4px;height:7px;border-radius:1px;background:#cdbf9f;text-decoration:none}
.nb-kn s.f{background:#2f5d8a}
.nb-kn i{display:block;width:6px;height:6px;margin-left:2px;background:#b0342a;transform:rotate(45deg)}
.nb-face:focus-visible,.nb-btn:focus-visible{outline:2px solid #2f5d8a;outline-offset:2px}
.nb-ink{${TAY};color:#2f5d8a}
.nb-in{width:100%;box-sizing:border-box;font:inherit;font-size:1.05em;padding:4px 6px;border:none;border-bottom:1px solid #b8ab8e;background:transparent;color:#2f5d8a;${TAY}}
.nb-ta{width:100%;box-sizing:border-box;min-height:90px;resize:vertical;font:inherit;padding:6px;border:1px solid #d8cdb3;background:rgba(255,255,255,.35);color:#2f5d8a;${TAY};line-height:1.6}
.nb-guess{margin-top:8px;border:1px solid #cdbf9f;border-radius:6px;padding:6px 8px;background:rgba(255,255,255,.3)}
.nb-g{display:grid;grid-template-columns:18px 104px 1fr;align-items:center;gap:6px;margin:3px 0;font-size:.9em}
.nb-g select{font:inherit;padding:2px;background:#fbf7ec;border:1px solid #cdbf9f;color:#2f5d8a}
.nb-ok{color:#b0342a;font-weight:700}
/* Dong muc do co Ba, LUON tren cung trang nguoi - cai lam no doc duoc trong nua giay la
   VI TRI CO DINH + mau muc, khong phai do dai mot cai thanh (P2-05b section 3). */
.nb-rel{${TAY};color:#b0342a;font-size:.95em;line-height:1.5;margin:0 0 8px;padding:6px 9px;border-left:3px solid #b0342a;background:rgba(176,52,42,.06)}
.nb-msg{font-size:.78em;color:#7a6f5b;min-height:1.2em}
.nb-legend{font-size:.72em;color:#8a7f69;margin:-2px 0 6px;font-style:italic}
.nb-bar{display:flex;gap:8px;justify-content:space-between;align-items:center;margin-top:8px}
.nb-btn{font:inherit;font-size:.85em;padding:6px 12px;border-radius:6px;border:1px solid #b8ab8e;background:#fbf7ec;color:#2b2f31;cursor:pointer;min-height:32px}
.nb-btn.primary{background:#2f5d8a;color:#fff;border-color:#2f5d8a}
.nb-empty{color:#7a6f5b;font-size:.85em;padding:8px 0}
`;

export type NotebookOpts = {
  mode: "evening" | "midday";
  textScale: number;
  showEvening: boolean;
  onClose: () => void;
};

export class NotebookView {
  private root: HTMLDivElement;
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
    title.append(this.el("span", "nb-sub", "  (bản ghi tại quầy)"));
    h.append(prev, title, next);
    col.push(h);

    const sc = this.el("div", "nb-scroll");
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

    if (this.opts.showEvening) {
      const abs = this.nb.met.map((id) => ({ id, n: this.w.npcs[id]?.missStreak ?? 0 })).filter((a) => a.n >= 2 && !this.w.npcs[a.id]?.gone);
      if (abs.length) {
        const box = this.el("div", "nb-abs");
        box.append(this.el("div", "nb-h", "Lâu rồi không thấy"));
        for (const a of abs.sort((x, y) => y.n - x.n)) {
          const row = this.el("div", "row");
          const img = this.el("img");
          img.src = this.face(a.id); img.alt = "";
          row.append(img, this.el("span", "nb-ink", this.who(a.id)), this.el("span", "nb-t", `— ${a.n} ngày`));
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
    if (n?.t === "ABSENT_STREAK") extra.push(`lâu rồi không ghé (${n.missed} ngày)`);
    if (extra.length) body.append(this.el("div", "nb-note", extra.join(" · ")));
    row.append(body);
    if (e.npcId !== "KHACH_LA") { row.style.cursor = "pointer"; row.onclick = () => { this.sel = e.npcId; this.msg = ""; this.renderRight(); }; }
    return row;
  }

  // ──────────────────────────────────────────── cột phải — ngồi nghĩ lại

  private right(): HTMLElement[] {
    const col: HTMLElement[] = [];
    const nb = this.nb;
    const h = this.el("div", "nb-h");
    h.append(this.el("span", "", "Người trong hẻm"), this.el("span", "nb-sub", "  (nhận xét cuối ngày)"));
    col.push(h);
    const faces = this.el("div", "nb-faces");
    const fresh = this.freshTicks();
    for (const id of nb.met) {
      const away = !this.w.npcs[id]?.gone && (this.w.npcs[id]?.missStreak ?? 0) >= 2;
      const b = this.el("button", `nb-face${id === this.sel ? " on" : ""}${away ? " away" : ""}`);
      const av = this.el("div", "nb-av");
      const img = this.el("img");
      img.src = this.face(id); img.alt = "";
      av.append(img);
      if (fresh.has(id)) av.append(this.el("div", "nb-badge", "!"));
      b.append(av, this.known(id));
      // Tiêu đề + nhãn trợ năng phải NÓI RA CHỮ: mọi dấu trong dải đều phân biệt được
      // bằng HÌNH, và vẫn phải đọc được khi người chơi không thấy được hình nào hết.
      const label = this.strip(id, away, fresh.has(id));
      b.title = label;
      b.setAttribute("aria-label", label);
      b.onclick = () => { this.sel = id; this.msg = ""; this.renderRight(); };
      faces.append(b);
    }
    if (nb.met.length) col.push(this.el("div", "nb-legend", "mỗi vạch là một điều đã xác nhận về người đó"));
    col.push(faces);
    const sc = this.el("div", "nb-scroll");
    if (!this.sel) {
      sc.append(this.el("div", "nb-empty", "chưa gặp ai"));
    } else sc.append(this.pageView(this.sel));
    col.push(sc);

    const bar = this.el("div", "nb-bar");
    bar.append(this.el("span", "nb-t", this.opts.mode === "evening" ? "Esc đóng sổ" : "Tab nhảy ô · Esc đóng sổ · quầy đứng yên trong lúc này"));
    const close = this.el("button", "nb-btn primary", "Đóng sổ");
    close.onclick = () => this.close();
    bar.append(close);
    col.push(bar);
    return col;
  }

  // ───────────────────────────────────────── đọc quan hệ (P2-05b)

  /**
   * Dấu "có gì mới ở người này" — lấy từ TRANG CUỐI NGÀY MỚI NHẤT CÓ, không phải trang
   * của hôm nay: người đóng game lúc đi ngủ rồi mở lại sáng sau vẫn phải thấy nó. Đó đúng
   * là người chơi mà cả cuốn sổ này tồn tại vì họ (§2.1 — Ngọc Ánh).
   *
   * TODO P4-03: khi cảnh nhỏ có scene thật, đổi nguồn sang "đủ 3 điều mà chưa coi cảnh"
   * và cộng thêm `needsFarewellHint` (§2.4) — hai cái đó mạnh hơn, mà hôm nay chưa có.
   */
  private freshTicks(): Set<NpcId> {
    const last = this.nb.eveningNotes.reduce<EveningNote | null>((a, n) => (!a || n.day > a.day ? n : a), null);
    return new Set((last?.confirmations ?? []).map((c) => c.npcId));
  }

  /** Thước độ hiểu: n gạch đặc trên `total`, cộng viên kim cương đỏ nếu đã mở được chuyện riêng. */
  private known(id: NpcId) {
    const k = knownOf(this.nb, id);
    const box = this.el("div", "nb-kn");
    for (let i = 0; i < k.total; i++) box.append(this.el("s", i < k.done ? "f" : ""));
    if (k.vignette) box.append(this.el("i"));
    return box;
  }

  private strip(id: NpcId, away: boolean, fresh: boolean) {
    const k = knownOf(this.nb, id);
    const bits = [knownWords(k)];
    if (k.vignette) bits.push("đã mở chuyện riêng");
    if (fresh) bits.push("có ghi chú mới");
    if (away) bits.push(`vắng ${this.w.npcs[id]?.missStreak ?? 0} ngày`);
    // `penName` chứ không `who()`: cột nhật ký bên trái cố ý hiện `—` khi chưa ghi tên (đó
    // là bản ghi, nó chỉ chép đúng cái mình đã viết). Nhưng cái mặt trong dải phải GỌI ĐƯỢC
    // ra người — "— — đã xác nhận 3" thì không ai biết đang nói về ai.
    return `${penName(this.nb, id)} — ${bits.join(", ")}`;
  }

  /**
   * Dòng bút đỏ trên đầu trang. `null` khi chưa có sổ riêng cho người này (người lạ dùng
   * chung `memKey`, đọc vào đó là đọc sổ người khác — P2-09 §2.4).
   *
   * RNG TIỀN ĐỊNH theo (saveId, người, ngày): cột phải dựng lại sau mỗi chữ người chơi gõ
   * vào ô ghi chú, rút ngẫu nhiên thật thì câu đó nhảy chữ dưới ngón tay họ.
   */
  private relLine(id: NpcId) {
    const rel = this.w.npcs[id];
    if (!rel) return null;
    const day = this.w.progress.dayIndex;
    const { line } = relWords(rel, penName(this.nb, id), Rng.forSeason(this.w.saveId, `rel:${id}:${day}`));
    const el = this.el("div", "nb-rel", line);
    el.setAttribute("aria-label", line);
    return el;
  }

  private pageView(id: NpcId) {
    const wrap = this.el("div");
    const p = page(this.nb, id, this.w.progress.dayIndex);
    // Nhận xét về người, không phải ô nhập — nên nó có mặt cả trước ngày có cây bút.
    const rel = this.relLine(id);
    if (rel) wrap.append(rel);
    const top = this.el("div", "nb-h");
    const img = this.el("img");
    img.src = this.face(id); img.alt = "";
    img.style.cssText = "width:44px;height:44px;border-radius:50%;object-fit:cover;object-position:50% 0;image-rendering:pixelated;background:#d9cdb2";
    if (!notebookWriteOpen(this.w.progress.dayIndex)) {
      top.append(img);
      wrap.append(top);
      wrap.append(this.el("div", "nb-t", `gặp lần đầu ngày ${p.firstSeenDay}`));
      wrap.append(this.el("div", "nb-empty", "chưa có bút · chưa ghi được"));
      return wrap;
    }
    const name = this.el("input", "nb-in");
    name.placeholder = "tên (tự ghi)";
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
    ta.setAttribute("aria-label", "ghi chú của mình");
    ta.oninput = () => { p.freeLines = ta.value; };
    wrap.append(ta);

    const box = this.el("div", "nb-guess");
    const k = knownOf(this.nb, id);
    const hd = this.el("div", "nb-h", "Phỏng đoán");
    // KHÔNG hiện "3/6" trần trụi: một tỉ số không nói nó đếm cái gì thì người chơi đọc
    // vào không hiểu gì hết. Cùng con số đó, nói ra bằng chữ, là tự giải thích.
    hd.append(this.el("span", "nb-sub", `  — ${knownWords(k)}`));
    box.append(hd);
    const day = this.w.progress.dayIndex;
    for (const slot of SLOTS) box.append(this.slotRow(id, slot, day));
    const open = p.hypotheses.filter((h) => h.state === "OPEN").length;
    // Cùng lý do như `knownWords`: "2/5" không nói nó đếm cái gì. Và khi đã chạm trần,
    // dòng này phải nói ra VIỆC PHẢI LÀM — không thì người chơi bấm hoài không hiểu sao kẹt.
    const left = MAX_OPEN_HYPOTHESES - open;
    const hint = left <= 0
      ? `đang đoán ${open} điều · hết chỗ — xoá bớt để đoán điều khác`
      : open === 0 ? `chưa đoán điều nào · tối đa ${MAX_OPEN_HYPOTHESES} cùng lúc`
      : `đang đoán ${open} điều · còn ${left} chỗ`;
    box.append(this.el("div", "nb-msg", this.msg || hint));
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
        : n.t === "SAID_SOMETHING" ? `kể: ${n.text}` : n.t === "FIRST_VISIT" ? "lần đầu ghé" : `vắng ${n.missed} hôm`;
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
