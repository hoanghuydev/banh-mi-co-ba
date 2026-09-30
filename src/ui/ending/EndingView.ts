import type { SaveFile } from "../../core/save";
import { NPCS } from "../../content/npcs";
import { CREDITS, DEBT_LINE, coBaLastLine, computeEnding, type EndingState } from "../../sim/ending";

/**
 * Màn kết — P4-04 §2.4–2.5. Bốn phần theo đúng thứ tự, rồi một tấm ảnh, một dòng chữ,
 * credits, và MỘT nút duy nhất.
 *
 * 🔴 Luật UI quan trọng nhất của toàn bộ P4-04: ở đây KHÔNG MỘT PIXEL NÀO hiện một con số về
 * quan hệ — không điểm, không %, không xếp hạng, không "bạn đã bỏ lỡ", không danh sách chữ
 * những người vắng. Người có mặt được vẽ; người không có mặt thì không.
 *
 * Trợ năng (§4): text không tự chạy tiếp · chữ viết tay có công tắc "dùng font thường" ·
 * giảm chuyển động tắt hiệu ứng gõ chữ · nền đục · cỡ chữ theo cài đặt.
 */
const STYLE = `
.en-root{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:#141a20;font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#2b2f31}
.en-page{width:min(760px,94vw);max-height:94vh;overflow:auto;background:#efe6d2;border-radius:10px;padding:22px 26px;box-shadow:0 12px 40px rgba(0,0,0,.5)}
.en-alley{position:relative;height:260px;border-radius:8px;background:linear-gradient(#c3cbce,#e8ebe9 55%,#9faab0 56%,#8a969c);overflow:hidden}
.en-sign{position:absolute;left:50%;top:22px;transform:translateX(-50%);padding:6px 16px;background:#9b2b22;color:#f2c14e;font-weight:800;letter-spacing:.04em;border-radius:4px;font-size:1.25em}
.en-sign.tay{font-family:"Segoe Print","Comic Sans MS",cursive;transform:translateX(-50%) rotate(-1.2deg)}
.en-sign.cu{opacity:.75;filter:saturate(.6)}
.en-people{position:absolute;left:0;right:0;bottom:12px;display:flex;justify-content:center;gap:10px;flex-wrap:wrap}
.en-p{width:64px;height:84px;object-fit:cover;object-position:50% 0;image-rendering:pixelated}
.en-p:hover{outline:2px solid #2f5d8a}
.en-who{position:absolute;right:10px;top:8px;font-size:.8em;color:#4a5a6a;min-height:1em}
.en-h{font-weight:700;margin:14px 0 8px}
.en-nb{background:#f6f0e1;border-radius:6px;padding:12px 14px;min-height:120px}
.en-nb .d{font-size:.82em;color:#6d624e}
.en-ink{font-family:"Segoe Print","Comic Sans MS",cursive;color:#2f5d8a;white-space:pre-wrap;line-height:1.7}
.en-plain .en-ink{font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#2b2f31}
.en-say{font-style:italic;color:#4a5a6a;margin:8px 0}
.en-bar{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:16px}
.en-btn{font:inherit;font-size:.9em;padding:7px 14px;border-radius:6px;border:1px solid #b8ab8e;background:#fbf7ec;color:#2b2f31;cursor:pointer;min-height:34px}
.en-btn.primary{background:#2f5d8a;color:#fff;border-color:#2f5d8a}
.en-btn:focus-visible{outline:2px solid #2f5d8a;outline-offset:2px}
.en-photo{margin:0 auto;width:min(420px,80vw);aspect-ratio:4/3;background:#9a9a96;filter:grayscale(1) contrast(1.05);border:10px solid #f4f1ea;box-shadow:0 6px 18px rgba(0,0,0,.35);position:relative;transform:rotate(-1deg)}
.en-photo .cart{position:absolute;left:28%;right:28%;bottom:16%;height:34%;background:#5c5c58;border-radius:4px}
.en-photo .sg{position:absolute;left:22%;right:22%;bottom:52%;padding:4px;text-align:center;background:#3d3d3a;color:#e8e8e2;font-weight:800;font-size:.9em}
.en-thanks{text-align:center;font-size:1.3em;margin:22px 0 6px}
.en-cred h4{margin:14px 0 4px;font-size:1em}
.en-cred div{font-size:.9em;color:#4a4a44}
`;

type Part = "alley" | "notebook" | "debt" | "last" | "photo" | "credits";

export class EndingView {
  private root: HTMLDivElement;
  private part: Part = "alley";
  private e: EndingState;
  private pageIdx = 0;
  private typed = 0;
  private timer: number | null = null;
  private plain = false;

  constructor(private w: SaveFile,
    private opts: { textScale: number; reducedMotion: boolean; face: (id: string) => string; onMenu: () => void }) {
    if (!document.getElementById("en-style")) {
      const st = document.createElement("style");
      st.id = "en-style"; st.textContent = STYLE;
      document.head.appendChild(st);
    }
    this.e = computeEnding(w);
    this.root = document.createElement("div");
    this.root.className = "en-root";
    this.root.style.fontSize = `${Math.round(15 * opts.textScale)}px`;
    this.root.addEventListener("keydown", (ev) => {
      ev.stopPropagation();
      if (this.part === "notebook" && ev.key === "ArrowRight") { this.pageIdx++; this.render(); }
      if (this.part === "notebook" && ev.key === "ArrowLeft") { this.pageIdx = Math.max(0, this.pageIdx - 1); this.render(); }
    }, true);
    this.root.tabIndex = -1;
    document.body.appendChild(this.root);
    this.render();
    this.root.focus();
  }

  close() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.root.remove();
  }

  private el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = ""): HTMLElementTagNameMap[K] {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  private next(to: Part) { this.part = to; this.render(); }

  private bar(page: HTMLElement, onNext: () => void, label = "tiếp") {
    const bar = this.el("div", "en-bar");
    const font = this.el("button", "en-btn", this.plain ? "dùng chữ viết tay" : "dùng font thường");
    font.onclick = () => { this.plain = !this.plain; this.render(); };
    const go = this.el("button", "en-btn primary", label);
    go.onclick = onNext;
    bar.append(font, go);
    page.append(bar);
    queueMicrotask(() => go.focus());
  }

  private render() {
    this.root.replaceChildren();
    const page = this.el("div", `en-page${this.plain ? " en-plain" : ""}`);
    this.root.append(page);
    switch (this.part) {
      case "alley": return this.alley(page);
      case "notebook": return this.notebook(page);
      case "debt": return this.debt(page);
      case "last": return this.last(page);
      case "photo": return this.photo(page);
      case "credits": return this.credits(page);
    }
  }

  /** Phần 1 — AI CÒN GHÉ. Không tiêu đề, không danh sách chữ. Chỗ trống của chú Tư không đánh dấu. */
  private alley(page: HTMLElement) {
    const box = this.el("div", "en-alley");
    const sign = this.el("div", `en-sign${this.e.signboard === "ve_tay_run" ? " tay" : this.e.signboard === "bang_cu" ? " tay cu" : ""}`, "BÁNH MÌ CÔ BA");
    const who = this.el("div", "en-who");
    const people = this.el("div", "en-people");
    for (const id of this.e.presentOnDay40) {
      const npc = NPCS.find((n) => n.id === id);
      const img = this.el("img", "en-p");
      img.src = this.opts.face(id);
      img.alt = "";
      // rê chuột qua → tên hiện nhỏ ở góc (tên CANON, không phải tên người chơi ghi — đây là khung hình, không phải sổ)
      img.onmouseenter = () => { who.textContent = npc?.name ?? ""; };
      img.onmouseleave = () => { who.textContent = ""; };
      people.append(img);
    }
    box.append(sign, people, who);
    page.append(box);
    this.bar(page, () => this.next("notebook"));
  }

  /** Phần 2 — sổ tay CỦA NGƯỜI CHƠI, đọc lại. Game chỉ thêm hai dòng dữ kiện. Trang trống là trống. */
  private notebook(page: HTMLElement) {
    const nb = this.w.notebook;
    const ids = (nb?.met ?? []).filter((id) => {
      const p = nb.pages[id];
      return p && (p.name?.trim() || p.freeLines?.trim());
    });
    const box = this.el("div", "en-nb");
    if (!ids.length) {
      box.append(this.el("div", "en-ink", " "));
    } else {
      const i = Math.min(this.pageIdx, ids.length - 1);
      this.pageIdx = i;
      const id = ids[i], p = nb.pages[id];
      const seen = nb.log.filter((l) => l.npcId === id).map((l) => l.day);
      box.append(this.el("div", "en-ink", p.name?.trim() || " "));
      box.append(this.el("div", "d", `ghi lần đầu: ngày ${p.firstSeenDay}${seen.length ? ` · ghé lần cuối: ngày ${Math.max(...seen)}` : ""}`));
      box.append(this.el("div", "en-ink", p.freeLines ?? ""));
      const nav = this.el("div", "en-bar");
      const prev = this.el("button", "en-btn", "←");
      prev.disabled = i === 0;
      prev.onclick = () => { this.pageIdx = Math.max(0, i - 1); this.render(); };
      const nx = this.el("button", "en-btn", "→");
      nx.disabled = i >= ids.length - 1;
      nx.onclick = () => { this.pageIdx = i + 1; this.render(); };
      nav.append(prev, this.el("span"), nx);
      box.append(nav);
    }
    page.append(box);
    this.bar(page, () => this.next("debt"));
  }

  /** Phần 3 — chốt sổ nợ với cô Mai. Cả ba nhánh đều tử tế. */
  private debt(page: HTMLElement) {
    page.append(this.el("div", "en-say", DEBT_LINE[this.e.debtBook]));
    this.bar(page, () => this.next("last"));
  }

  /** Phần 4 — dòng cuối của cô Ba, hiện theo tốc độ viết tay (~2,5 ký tự/giây), có nút hiện ngay. */
  private last(page: HTMLElement) {
    const { text } = coBaLastLine(this.e);
    const ink = this.el("div", "en-ink");
    const box = this.el("div", "en-nb");
    box.append(ink);
    page.append(box);
    const full = () => { this.typed = text.length; ink.textContent = text; if (this.timer !== null) { window.clearInterval(this.timer); this.timer = null; } };
    if (this.opts.reducedMotion) full();
    else {
      ink.textContent = text.slice(0, this.typed);
      if (this.timer === null && this.typed < text.length) {
        this.timer = window.setInterval(() => {
          this.typed++;
          ink.textContent = text.slice(0, this.typed);
          if (this.typed >= text.length && this.timer !== null) { window.clearInterval(this.timer); this.timer = null; }
        }, 400);
      }
    }
    const bar = this.el("div", "en-bar");
    const now = this.el("button", "en-btn", "hiện hết");
    now.onclick = full;
    const go = this.el("button", "en-btn primary", "đóng sổ");
    go.onclick = () => { full(); this.next("photo"); };
    bar.append(now, go);
    page.append(bar);
    queueMicrotask(() => go.focus());
  }

  /** Tấm ảnh chị Hạnh chụp bằng máy film ngày 40 — hoặc ảnh cô Ba chụp điện thoại, mờ, lệch. Không chữ giải thích. */
  private photo(page: HTMLElement) {
    const ph = this.el("div", "en-photo");
    if (this.e.finalPhoto === "co_ba_dien_thoai") ph.style.transform = "rotate(2.5deg)", ph.style.filter = "grayscale(.4) blur(.6px)";
    const sg = this.el("div", "sg", "BÁNH MÌ CÔ BA");
    if (this.e.signboard === "ve_tay_run") sg.style.fontFamily = '"Segoe Print","Comic Sans MS",cursive';
    ph.append(sg, this.el("div", "cart"));
    page.append(ph);
    // không dịch — kể cả ở bản tiếng Anh (P4-05 §2.9 C)
    page.append(this.el("div", "en-thanks", "Cảm ơn cô, chú, anh, chị — và con."));
    this.bar(page, () => this.next("credits"));
  }

  /** Credits — LR-5: người Việt viết văn hoá đứng ĐẦU. Đủ dấu, không viết hoa toàn bộ. */
  private credits(page: HTMLElement) {
    const box = this.el("div", "en-cred");
    for (const c of CREDITS) {
      box.append(this.el("h4", "", c.head));
      for (const l of c.lines) box.append(this.el("div", "", l));
    }
    page.append(box);
    const bar = this.el("div", "en-bar");
    bar.append(this.el("span"));
    const menu = this.el("button", "en-btn primary", "Về menu chính");
    menu.onclick = () => this.opts.onMenu();
    bar.append(menu);
    page.append(bar);
    queueMicrotask(() => menu.focus());
  }
}
