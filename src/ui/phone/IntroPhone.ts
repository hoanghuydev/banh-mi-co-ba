import Phaser from "phaser";
import { ME, MEMBERS, contactOf } from "../../content/phone/contacts";
import type { Chapter } from "../../content/phone/intro";
import { beatToMsg, newPhone, type PhoneState } from "../../sim/phone";
import { bubbleNodes, typingDots } from "./chat";
import { sfx } from "../../audio/sfx";
import { btn, el } from "./dom";
import { PhoneShell } from "./PhoneShell";
import { reviewIntro } from "./reviewIntro";

export type IntroOpts = {
  textScale: number;
  chapters: readonly Chapter[];
  onChaptersDone: (phone: PhoneState) => void;
};

const clockOf = (at: string) => at.match(/\d{1,2}:\d{2}/)?.[0] ?? "";
const typingMs = (text: string) => 650 + Math.min(text.length * 16, 800);

/** Màn giới thiệu kể bằng tin nhắn: chạm để đọc tiếp, câu trả lời của Phương Anh tự hiện. */
export class IntroPhone {
  readonly shell: PhoneShell;
  private phone = newPhone();
  private ci = 0;
  private bi = 0;
  private timer = 0;
  private waiting = false;
  private live = true;
  private ended = false;

  private onKey = (ev: KeyboardEvent) => {
    if (!this.live || ev.repeat) return;
    if (ev.code === "Space" || ev.code === "Enter") {
      if (document.activeElement instanceof HTMLButtonElement) return;
      ev.preventDefault();
      this.step();
    }
  };

  constructor(game: Phaser.Game, private opts: IntroOpts) {
    this.shell = new PhoneShell(game, {
      textScale: opts.textScale,
      clock: clockOf(opts.chapters[0].at),
      locked: true,
      onHome: () => {},
      onEscape: () => true,
      onClose: () => {},
    });
    window.addEventListener("keydown", this.onKey);
    this.enter(0, "up");
  }

  private chapter(): Chapter { return this.opts.chapters[this.ci]; }

  private enter(ci: number, dir: "r" | "up") {
    this.ci = ci;
    this.bi = 0;
    this.waiting = false;
    clearTimeout(this.timer);
    this.shell.setClock(clockOf(this.chapter().at));
    this.shell.setTheme("");
    this.shell.root.className = `ph-root bg bg-${this.chapter().bg}`;
    this.render(dir, 0);
    this.timer = window.setTimeout(() => this.reveal(), 650);
    this.waiting = true;
  }

  private reveal() {
    const c = this.chapter();
    const b = c.beats[this.bi];
    if (!b) return;
    beatToMsg(this.phone, c, b);
    this.bi++;
    this.waiting = false;
    this.render("", this.shown() - 1);
    const next = c.beats[this.bi];
    if (next && next.from === ME) {
      this.waiting = true;
      this.render("", this.shown() - 1, true);
      this.timer = window.setTimeout(() => this.reveal(), typingMs(next.text));
    }
  }

  private shown() {
    return this.phone.threads.find((t) => t.id === this.chapter().thread)?.msgs.length ?? 0;
  }

  step() {
    if (this.ended) return;
    if (this.waiting) { clearTimeout(this.timer); this.reveal(); return; }
    if (this.bi < this.chapter().beats.length) { this.reveal(); return; }
    this.next();
  }

  private next() {
    if (this.ci + 1 < this.opts.chapters.length) { this.enter(this.ci + 1, "r"); return; }
    this.ended = true;
    this.opts.onChaptersDone(this.phone);
  }

  /** Hiện hết phần còn lại của cuộc trò chuyện đang đọc, dừng ở nút Tiếp. */
  skip() {
    clearTimeout(this.timer);
    const c = this.chapter();
    const from = this.shown();
    while (this.bi < c.beats.length) beatToMsg(this.phone, c, c.beats[this.bi++]);
    this.waiting = false;
    this.render("", from);
  }

  /** `fromIdx`: bong bóng từ vị trí này trở đi mới có hiệu ứng hiện. */
  private render(dir: "r" | "up" | "", fromIdx: number, typing = false) {
    const c = this.chapter();
    const ct = contactOf(c.thread);
    const msgs = this.phone.threads.find((t) => t.id === c.thread)?.msgs ?? [];

    const nav = el("div", "ph-nav");
    const done = this.bi >= c.beats.length && !this.waiting;
    const r = el("div", "r");
    if (!done) r.append(btn("ph-btn-text muted", "Bỏ qua", () => this.skip(), "Bỏ qua cuộc trò chuyện này"));
    nav.style.gridTemplateColumns = "20px 1fr 90px";
    nav.append(el("div"), el("div", "t", ct.name), r);
    if (ct.group) (nav.querySelector(".t") as HTMLElement).append(el("small", "", `${(MEMBERS[ct.id]?.length ?? 0) + 1} thành viên`));

    const sc = el("div", "ph-scroll");
    sc.style.cursor = "pointer";
    sc.onclick = () => this.step();
    const body = el("div", "ph-chat");
    msgs.forEach((m, i) => {
      const nodes = bubbleNodes(m, msgs[i - 1], !!ct.group, msgs[i + 1]);
      if (i < fromIdx) for (const n of nodes) n.querySelector(".ph-b")?.setAttribute("style", "animation:none");
      body.append(...nodes);
    });
    if (typing) { body.append(typingDots(true)); sfx.ui("ph_soan_tin"); }
    sc.append(body);

    const dock = el("div", "ph-compose");
    if (done) {
      const last = this.ci + 1 >= this.opts.chapters.length;
      const go = btn("ph-primary", last ? "Đặt tên quán ›" : "Tiếp ›", () => this.step());
      dock.append(go);
      queueMicrotask(() => go.focus({ preventScroll: true }));
    } else {
      const hint = el("div", "ph-tap");
      hint.innerHTML = '<svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true"><path d="M3 3l8 8 8-8" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      hint.setAttribute("aria-label", "Chạm để đọc tiếp");
      hint.onclick = () => this.step();
      dock.append(hint);
    }

    const page = el("div");
    page.style.cssText = "display:flex;flex-direction:column;flex:1;min-height:0";
    page.append(nav, sc, dock);
    this.shell.show(page, dir);
    queueMicrotask(() => { sc.scrollTop = sc.scrollHeight; });
  }

  hide(on: boolean) {
    this.shell.root.style.display = on ? "none" : "";
    this.live = !on;
  }

  /** Màn cuối: app Đánh giá của quán mới, nút vào khai trương. */
  showReview(shopName: string, onStart: () => void) {
    this.hide(false);
    this.live = false;
    this.shell.setClock("06:00");
    this.shell.setTheme("");
    this.shell.root.className = "ph-root bg bg-morning";
    const sc = el("div", "ph-scroll");
    sc.append(...reviewIntro(shopName));
    const nav = el("div", "ph-nav");
    nav.append(el("div"), el("div", "t", "Đánh giá"), el("div"));
    const cta = el("div", "ph-cta");
    const go = btn("ph-primary", "Vào ngày khai trương", () => { this.destroy(); onStart(); });
    cta.append(go);
    const page = el("div");
    page.style.cssText = "display:flex;flex-direction:column;flex:1;min-height:0";
    page.append(nav, sc, cta);
    this.shell.show(page, "up");
    queueMicrotask(() => go.focus({ preventScroll: true }));
  }

  destroy() {
    this.live = false;
    clearTimeout(this.timer);
    window.removeEventListener("keydown", this.onKey);
    this.shell.root.remove();
    this.shell.close();
  }
}
