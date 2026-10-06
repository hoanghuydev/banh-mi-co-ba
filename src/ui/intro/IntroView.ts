import {
  DEFAULT_PLAYER_NAME, INTRO_AFTER, INTRO_AFTER_BLANK, INTRO_ASK, INTRO_SCRIPT, NAME_MAX,
  SPEAKER_NAME, cleanName, shopName, type IntroLine, type IntroSpeaker,
} from "../../content/intro";

/**
 * MÀN MỞ ĐẦU — hai người, hai tấm ảnh, một ô thoại, Enter đi tiếp.
 *
 * Lớp DOM phủ lên canvas, cùng kỹ thuật với `ui/notebook` và `ui/menu/MenuBoardView`. Ở đây
 * nó KHÔNG phải chuyện tiện tay: bước cuối của màn này là gõ TÊN TIẾNG VIỆT. Bộ gõ (Telex,
 * VNI, bộ gõ của hệ điều hành) chỉ làm việc với một `<input>` thật — bắt phím trong Phaser
 * thì "Hoàng" ra "Hoang" hoặc ra "Hoafng", tuỳ bộ gõ. Vẽ ô nhập bằng canvas là tự tay chặn
 * đúng cái việc duy nhất người chơi phải làm ở màn này.
 *
 * Trợ năng (CANON §15):
 *   · ô thoại NỀN ĐỤC, không trong suốt
 *   · chữ không bao giờ TỰ chạy tiếp — một dòng đứng đó tới khi người chơi bấm
 *   · `reducedMotion` tắt hẳn hiệu ứng gõ chữ (hiện trọn dòng ngay)
 *   · cỡ chữ theo cài đặt
 *   · bấm lần nữa lúc chữ đang chạy = hiện trọn dòng, không phải nhảy qua dòng sau
 *   · bỏ qua được bằng nút VÀ bằng Esc — trừ bước đặt tên
 */

const STYLE = `
.in-root{position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;
  font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#2b2f31;
  background:radial-gradient(120% 80% at 50% 0%,rgba(10,15,21,.08),rgba(10,15,21,.55))}
.in-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:14px 18px 0}
.in-luc{color:#dbe4ea;font-size:.86em;letter-spacing:.04em;text-shadow:0 1px 4px rgba(0,0,0,.85)}
.in-btn{font:inherit;font-size:.86em;padding:7px 14px;border-radius:7px;border:1px solid #b8ab8e;
  background:#fbf7ec;color:#2b2f31;cursor:pointer;min-height:34px}
.in-btn.primary{background:#8e2a20;color:#fff5e2;border-color:#8e2a20}
.in-btn[disabled]{opacity:.45;cursor:default}
.in-btn:focus-visible{outline:2px solid #f5c542;outline-offset:2px}

.in-san{flex:1;display:flex;align-items:flex-end;justify-content:center;gap:clamp(18px,9vw,110px);
  padding:0 24px 10px;min-height:0}
.in-ai{margin:0;display:flex;flex-direction:column;align-items:center;gap:6px;
  opacity:.42;filter:saturate(.55) brightness(.8);transition:opacity .22s ease,transform .22s ease,filter .22s ease;
  transform:translateY(6px) scale(.96)}
.in-ai.dang{opacity:1;filter:none;transform:none}
.in-khung{width:clamp(96px,21vh,176px);height:clamp(96px,21vh,176px);border-radius:12px;overflow:hidden;
  background:#cdd6da;border:3px solid #f3efe3;box-shadow:0 10px 26px rgba(0,0,0,.5)}
.in-ai.dang .in-khung{border-color:#f5c542}
.in-khung img{width:100%;height:100%;object-fit:cover;display:block}
.in-ai[data-who="PLAYER"] .in-khung img{transform:scaleX(-1)}
.in-ai figcaption{font-size:.84em;color:#eef3f6;text-shadow:0 1px 3px rgba(0,0,0,.8)}

.in-hop{background:#f6f2e6;border-top:3px solid #8e2a20;box-shadow:0 -10px 30px rgba(0,0,0,.45);
  padding:14px clamp(16px,6vw,64px) 16px;max-height:76vh;overflow:auto}
.in-trong{max-width:860px;margin:0 auto}
.in-ten{display:inline-block;background:#8e2a20;color:#f5c542;font-weight:700;font-size:.92em;
  padding:3px 14px;border-radius:5px;margin-bottom:8px}
.in-loi{margin:0;font-size:1.18em;line-height:1.72;min-height:3.44em;white-space:pre-wrap}
.in-chan{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin-top:8px;
  font-size:.8em;color:#7a6f5b;min-height:34px}
.in-chan .in-dat{flex:1 1 100%}
.in-tiep{animation:in-nhay 1.2s ease-in-out infinite}
@keyframes in-nhay{0%,100%{opacity:.35}50%{opacity:1}}

.in-dat{display:flex;flex-wrap:wrap;align-items:flex-end;gap:14px 22px;margin-top:10px}
.in-o{display:flex;flex-direction:column;gap:5px;flex:1 1 230px;min-width:200px}
.in-o label{font-size:.82em;color:#7a6f5b}
.in-o input{font:inherit;font-size:1.1em;padding:9px 12px;border-radius:7px;border:1px solid #b8ab8e;
  background:#fffdf6;color:#2b2f31;min-height:40px;width:100%;box-sizing:border-box}
.in-o input:focus-visible{outline:2px solid #8e2a20;outline-offset:1px}
.in-dem{font-size:.76em;color:#9a8f79}
.in-nut{display:flex;flex-wrap:wrap;gap:8px}

.in-bang{flex:0 0 auto;background:#a83226;border:6px solid #6f6256;border-radius:4px;color:#f5c542;
  padding:8px 18px;text-align:center;transform:rotate(-1deg);box-shadow:0 8px 20px rgba(0,0,0,.35)}
.in-bang b{display:block;font-size:1.05em;letter-spacing:.05em}
.in-bang small{display:block;font-size:.74em;opacity:.9;margin-top:2px;min-height:1.2em;font-style:italic}
`;

export type IntroOpts = {
  textScale: number;
  reducedMotion: boolean;
  /** Ảnh chân dung (data URL). Thiếu ảnh thì khung trống, màn vẫn chạy. */
  face: Record<IntroSpeaker, string>;
  sfx?: (id: "ui_click_go" | "ui_dat_thanh_cong") => void;
  /** Gọi đúng MỘT lần, với cái tên đã dọn (có thể là tên mặc định). */
  onDone: (name: string) => void;
};

/** ms cho mỗi ký tự — chậm hơn nhịp đọc một chút, đủ để nghe ra giọng. */
const TYPE_MS = 24;

type Step = "say" | "ask" | "after";

export class IntroView {
  private root: HTMLDivElement;
  private loi!: HTMLParagraphElement;
  private ten!: HTMLSpanElement;
  private chan!: HTMLDivElement;
  /** Hai khung ảnh, dựng xong ở `build()` trước mọi lần `show()`. */
  private faces = {} as Record<IntroSpeaker, HTMLElement>;
  private caps = {} as Record<IntroSpeaker, HTMLElement>;

  private step: Step = "say";
  private at = 0;
  private typed = 0;
  private timer: number | null = null;
  private name = "";
  private done = false;

  constructor(private opts: IntroOpts) {
    if (!document.getElementById("in-style")) {
      const st = document.createElement("style");
      st.id = "in-style";
      st.textContent = STYLE;
      document.head.appendChild(st);
    }
    this.root = document.createElement("div");
    this.root.className = "in-root";
    this.root.style.fontSize = `${Math.round(15 * opts.textScale)}px`;
    this.root.tabIndex = -1;
    this.root.addEventListener("keydown", this.onKey, true);
    // Phím của màn này KHÔNG được rơi xuống scene bên dưới.
    this.root.addEventListener("keyup", (e) => e.stopPropagation(), true);
    document.body.appendChild(this.root);
    this.build();
    this.show();
    this.root.focus();
  }

  close() {
    this.stopTimer();
    this.root.remove();
  }

  // ── khung ──────────────────────────────────────────────────────────────────

  private el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = ""): HTMLElementTagNameMap[K] {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  private who(id: IntroSpeaker): HTMLElement {
    const fig = this.el("figure", "in-ai");
    fig.dataset.who = id;
    const khung = this.el("div", "in-khung");
    const src = this.opts.face[id];
    if (src) {
      const img = this.el("img");
      img.src = src;
      img.alt = "";
      khung.appendChild(img);
    }
    fig.append(khung, this.el("figcaption", "", SPEAKER_NAME[id]));
    this.caps[id] = fig.querySelector("figcaption")!;
    this.faces[id] = fig;
    return fig;
  }

  private build() {
    const top = this.el("div", "in-top");
    // Chỗ và giờ, một dòng. Cảnh này là 4 rưỡi sáng — không nói ra thì cái hẻm tối om
    // chỉ đọc ra là "trời tối", và câu đầu của cô Ba ("Bốn giờ rưỡi rồi") thành thừa.
    top.appendChild(this.el("div", "in-luc", "Đầu hẻm · 4 giờ rưỡi sáng"));
    const skip = this.el("button", "in-btn", "Bỏ qua ⏭");
    skip.onclick = () => this.skip();
    top.appendChild(skip);

    const san = this.el("div", "in-san");
    san.append(this.who("CO_BA"), this.who("PLAYER"));

    const hop = this.el("div", "in-hop");
    const trong = this.el("div", "in-trong");
    this.ten = this.el("span", "in-ten");
    this.loi = this.el("p", "in-loi");
    this.chan = this.el("div", "in-chan");
    trong.append(this.ten, this.loi, this.chan);
    hop.appendChild(trong);

    // Bấm vô ô thoại cũng đi tiếp — chuột và cảm ứng không có phím Enter.
    hop.addEventListener("pointerdown", (ev) => {
      if ((ev.target as HTMLElement).closest("button,input,label")) return;
      this.goNext();
    });

    this.root.append(top, san, hop);
  }

  // ── chạy kịch bản ──────────────────────────────────────────────────────────

  /** Bỏ trống tên thì cô Ba có hai câu khác — bà không ép ai đặt tên. */
  private get tail() { return this.name ? INTRO_AFTER : INTRO_AFTER_BLANK; }

  private line(): IntroLine {
    if (this.step === "ask") return INTRO_ASK;
    if (this.step === "after") return this.tail[this.at];
    return INTRO_SCRIPT[this.at];
  }

  private text(): string {
    const l = this.line();
    return l.needsName ? l.text.replace("{ten}", this.name || DEFAULT_PLAYER_NAME) : l.text;
  }

  /** Người chơi đã xưng tên rồi thì ô thoại gọi đúng tên đó, không gọi "Con" nữa. */
  private speaker(who: IntroSpeaker) {
    return who === "PLAYER" && this.name ? this.name : SPEAKER_NAME[who];
  }

  private show() {
    const l = this.line();
    this.ten.textContent = this.speaker(l.who);
    for (const [id, fig] of Object.entries(this.faces)) {
      fig.classList.toggle("dang", id === l.who);
      this.caps[id as IntroSpeaker].textContent = this.speaker(id as IntroSpeaker);
    }
    this.chan.replaceChildren();
    this.loi.textContent = "";
    this.typed = 0;

    if (this.step === "ask") {
      // Câu mời gõ tên hiện TRỌN, không gõ máy chữ: dưới nó đã có một ô nhập đang chờ,
      // mà bắt người ta ngồi coi chữ chạy trong khi con trỏ đã nhấp nháy là chọc tức.
      this.loi.textContent = this.text();
      this.chan.appendChild(this.nameForm());
      return;
    }
    /*
     * Kéo focus về khung ngoài cùng SAU MỖI MÀN.
     *
     * Bàn phím của màn này nghe ở `this.root`, mà gõ tên xong thì `replaceChildren` gỡ luôn
     * cái `<input>` đang giữ focus — trình duyệt trả focus về `<body>`, nằm NGOÀI `root`, nên
     * phím Enter không tới được listener nào và màn đứng hình ở câu "… cô ghi vô sổ". Lỗi này
     * đã xảy ra thật, và nó không ném ra lỗi nào: nút bấm thì vẫn chạy, chỉ bàn phím chết.
     */
    this.root.focus({ preventScroll: true });
    this.type();
  }

  private type() {
    const full = this.text();
    if (this.opts.reducedMotion) { this.loi.textContent = full; this.typed = full.length; this.waitKey(); return; }
    const chars = [...full];
    this.loi.textContent = "";
    this.stopTimer();
    this.timer = window.setInterval(() => {
      this.typed++;
      this.loi.textContent = chars.slice(0, this.typed).join("");
      if (this.typed >= chars.length) { this.stopTimer(); this.waitKey(); }
    }, TYPE_MS);
  }

  private stopTimer() {
    if (this.timer !== null) { window.clearInterval(this.timer); this.timer = null; }
  }

  /** Dòng đã hiện trọn → mời bấm. Không có đồng hồ nào tự lật trang. */
  private waitKey() {
    this.chan.replaceChildren(this.el("span", "in-tiep", "Enter — nói tiếp"));
  }

  private get typing() {
    return this.timer !== null;
  }

  /**
   * Tên là `goNext`, không phải `advance`: cổng kỹ thuật của P0-02 (`tools/check-gates.ts`)
   * cấm chuỗi `.advance(` ở mọi file ngoài `StallScene` + `sim/headless`, vì đồng hồ ngày
   * chỉ được chạy ở đúng một chỗ. Một hàm trùng tên ở đây làm cổng đó kêu nhầm mỗi lần build.
   */
  private goNext() {
    if (this.done || this.step === "ask") return;
    if (this.typing) { this.stopTimer(); this.loi.textContent = this.text(); this.waitKey(); return; }
    this.opts.sfx?.("ui_click_go");
    this.at++;
    if (this.step === "say" && this.at >= INTRO_SCRIPT.length) { this.step = "ask"; this.at = 0; }
    else if (this.step === "after" && this.at >= this.tail.length) { this.finish(); return; }
    this.show();
  }

  /** Bỏ qua = nhảy tới bước đặt tên, KHÔNG nhảy vô ngày 1: cái tên thì không bỏ qua được. */
  private skip() {
    if (this.done || this.step !== "say") return;
    this.stopTimer();
    this.step = "ask";
    this.at = 0;
    this.show();
  }

  private finish() {
    if (this.done) return;
    this.done = true;
    this.stopTimer();
    this.opts.onDone(this.name || DEFAULT_PLAYER_NAME);
  }

  // ── bước đặt tên ───────────────────────────────────────────────────────────

  private nameForm(): HTMLElement {
    const form = this.el("form", "in-dat");

    const o = this.el("div", "in-o");
    const lab = this.el("label", "", "Tên");
    lab.htmlFor = "in-ten-input";
    const inp = this.el("input");
    inp.id = "in-ten-input";
    inp.type = "text";
    inp.maxLength = NAME_MAX;
    inp.autocomplete = "off";
    inp.spellcheck = false;
    inp.placeholder = "gõ tên rồi bấm Enter";
    const dem = this.el("div", "in-dem", `tối đa ${NAME_MAX} chữ — tên này sơn lên bảng hiệu`);
    o.append(lab, inp, dem);

    // Tấm bảng hiệu THU NHỎ, cập nhật theo từng chữ gõ vô: người chơi thấy TRƯỚC cái tên
    // mình sắp treo ngoài hẻm bốn chục bữa, chứ không phải gõ vô một ô rồi hồi hộp.
    const bang = this.el("div", "in-bang");
    const tenQuan = this.el("b", "", shopName(""));
    bang.append(tenQuan, this.el("small", "", "bán từ 6 giờ sáng"));

    const nut = this.el("div", "in-nut");
    const ok = this.el("button", "in-btn primary", "Xong");
    ok.type = "submit";
    ok.disabled = true;
    const bo = this.el("button", "in-btn", "Để trống");
    bo.type = "button";
    bo.onclick = () => this.setName("");
    nut.append(ok, bo);

    const sync = () => {
      const n = cleanName(inp.value);
      tenQuan.textContent = shopName(n);
      ok.disabled = !n;
    };
    inp.addEventListener("input", sync);
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      this.setName(inp.value);
    });

    form.append(o, bang, nut);
    // `preventScroll`: cú focus kéo cả trang nếu ô thoại cao hơn khung hình ở cỡ chữ 200%.
    queueMicrotask(() => inp.focus({ preventScroll: true }));
    return form;
  }

  private setName(raw: string) {
    const n = cleanName(raw);
    this.name = n;
    this.opts.sfx?.("ui_dat_thanh_cong");
    this.step = "after";
    this.at = 0;
    this.show();
  }

  // ── bàn phím ───────────────────────────────────────────────────────────────

  private onKey = (ev: KeyboardEvent) => {
    /*
     * `isComposing` — bộ gõ tiếng Việt (và mọi IME) nuốt phím Enter để CHỐT chữ đang gõ:
     * "Hoàng" lúc còn đang tổ hợp mà mình cướp mất Enter thì chữ chốt hụt và màn nhảy tiếp
     * với cái tên dở dang. Trình duyệt cũ không có cờ này thì `keyCode === 229` là dấu hiệu.
     */
    if (ev.isComposing || ev.keyCode === 229) return;
    const inInput = (ev.target as HTMLElement | null)?.tagName === "INPUT";

    if (ev.code === "Escape") {
      ev.preventDefault();
      ev.stopPropagation();
      this.skip();
      return;
    }
    if (inInput) {
      // Trong ô nhập: để `submit` của form lo phím Enter, mọi phím khác là chữ người ta gõ.
      ev.stopPropagation();
      return;
    }
    if (ev.code === "Enter" || ev.code === "NumpadEnter" || ev.code === "Space") {
      ev.preventDefault();
      ev.stopPropagation();
      this.goNext();
      return;
    }
    ev.stopPropagation();
  };
}
