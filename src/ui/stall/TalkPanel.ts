import Phaser from "phaser";
import { GAME_H, GAME_W } from "../../core/config";
import { designFor, isPhone, isTouch, onDeviceChange } from "../../core/device";
import { FONT, UI, label, textScale, touchFont, touchSize } from "../theme";
import { sfx } from "../../audio/sfx";
import type { TalkTone } from "../../sim/talk";
import { CARD_EDGE, placeTalkCard } from "./talkCardLayout";

/**
 * Một thẻ HẸP neo CẠNH người đang nói, tự lật sang bên kia khi chạm mép khung. Bảng đáy màn hình
 * cũ che TRỌN người đang nói chuyện (mép trên y = 244 so với đỉnh đầu y ≈ 246), và ở cỡ chữ 200%
 * thì hàng thứ tư rơi ra ngoài màn hình — cái trợ năng tự huỷ chính nó.
 *
 * Đồng hồ KHÔNG đóng băng khi thẻ mở, nên ngân sách đọc phải chặt: tối đa ba dòng.
 */

/** Bề ngang thẻ. Hẹp là CỐ Ý: nó phải lọt vào khoảng trống cạnh người, không chiếm hàng ghế đầu. */
const CARD_W = 310;
const CARD_W_TOUCH = 430;
const PAD = 12;
/** Điện thoại, pixel CSS thật: bề ngang thẻ và khoảng né nửa bong bóng của người nói. */
const PHONE_CARD_CSS = 230;
const PHONE_GAP_CSS = 104;

/** Màu mép trái của mỗi dòng theo giọng. Chỉ là GỢI Ý khí, không phải điểm số (T3). */
const TONE_TINT: Record<TalkTone, number> = {
  AM: 0x3f7d5a,
  THUONG: 0xa9a393,
  DUA: 0xd4a13c,
  THANG: 0x4a6f8c,
  LANH: 0x7d8a93,
  GAT: 0xc0392b,
  CHUI: 0x9b4a2f,
  IM: 0x6a7680,
};

export type TalkPanelView = {
  name: string;
  line: string;
  /** Khách cố ý KHÔNG đáp — thẻ vẫn phải nói ra cái trống đó, xem `show()`. */
  silent?: boolean;
  options: readonly { say: string; tone: TalkTone }[];
  done: boolean;
  /** TOẠ ĐỘ MÀN HÌNH (đã trừ camera) — thẻ là `scrollFactor(0)`. */
  anchor?: { x: number; y: number };
};

export class TalkPanel {
  private root: Phaser.GameObjects.Container | null = null;
  private rows: { bg: Phaser.GameObjects.Graphics; row: Phaser.GameObjects.Container; y: number; w: number; h: number }[] = [];
  private cursor = 0;
  private count = 0;
  private off: (() => void)[] = [];
  /** ⚠️ Khoá riêng điểm neo là chưa đủ: chiều cao đổi theo nhịp, nên nhịp dày chạm mép dưới thì cú kẹp đẩy thẻ LÊN rồi nhịp sau mỏng lại nó RƠI XUỐNG. Khoá chỗ ĐÃ GIẢI XONG, và cho đi MỘT CHIỀU. */
  private locked: { cx: number; top: number } | null = null;
  private view: TalkPanelView | null = null;

  /**
   * @param onPick  người chơi chọn dòng thứ i
   * @param onClose người chơi đóng thẻ (Esc) — LUÔN MIỄN PHÍ, xem `StallScene.endTalk`
   * @param blocked thẻ đang bị một lớp khác che (menu tạm dừng) ⇒ nuốt hết phím
   */
  constructor(
    private scene: Phaser.Scene,
    private onPick: (i: number) => void,
    private onClose: () => void,
    private blocked: () => boolean = () => false,
  ) {
    const off = onDeviceChange(() => { const v = this.view; if (v) { this.locked = null; this.show(v); } });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
  }

  get isOpen() {
    return this.root !== null;
  }

  /** Vẽ lại toàn bộ thẻ cho một nhịp. Gọi lại mỗi lần khách đáp xong. */
  show(v: TalkPanelView) {
    // Giữ chỗ đã chốt qua cú `destroy()` ngay dưới: vẽ lại một nhịp KHÔNG phải mở cuộc mới.
    const lock = this.locked;
    this.destroy();
    this.locked = lock;
    this.view = v;
    const sz = Math.min(textScale(), 1.35);
    const touch = isTouch(), phone = isPhone();
    const w = Math.min(phone ? designFor(PHONE_CARD_CSS * Math.min(sz, 1.2)) : (touch ? CARD_W_TOUCH : CARD_W) * Math.min(sz, 1.2), GAME_W - CARD_EDGE * 2);
    const c = this.scene.add.container(0, 0).setDepth(9_400_000).setScrollFactor(0);


    // Mỗi dòng lựa chọn cao theo CHÍNH chữ của nó. Bản cũ dùng một `rowH` cố định rồi
    // kẹp chiều cao cả bảng — đó là chỗ cỡ chữ 200% làm hàng cuối rơi ra ngoài màn hình.
    const rowTexts = v.options.map((o) => this.scene.add.text(0, 0, o.say, {
      fontFamily: FONT, fontSize: `${touchFont(Math.round(14 * sz))}px`, color: UI.ink,
      lineSpacing: Math.round(5 * sz), wordWrap: { width: w - PAD * 2 - 30 },
    }).setOrigin(0, 0.5));
    const rowPad = phone ? designFor(8) : Math.round(14 * sz);
    const rowH = rowTexts.map((t) => Math.max(touchSize(Math.round(30 * sz)), t.height + rowPad));

    const closeH = touch ? touchSize(44) : 0;
    const nameH = Math.max(Math.round(16 * sz), closeH);
    /** Bong bóng SỐNG CÓ HẠN rồi tắt, trong khi thẻ đứng chờ tới lúc người chơi bấm — nên tới lúc bấm thì câu mình đang ĐÁP LẠI đã biến mất. Im lặng cố ý vẫn phải có hình: "…" chứ không phải ô trống. */
    const quote = v.silent ? "…" : v.line.trim();
    const lineTxt = quote
      ? this.scene.add.text(0, 0, `“${quote}”`, {
        fontFamily: FONT, fontSize: `${touchFont(Math.round(13 * sz))}px`, color: UI.ink,
        fontStyle: "italic", lineSpacing: Math.round(4 * sz),
        wordWrap: { width: w - PAD * 2 },
        ...(touch ? { maxLines: phone ? 2 : 3 } : {}),
      }).setOrigin(0, 0)
      : null;
    const lineH = lineTxt ? lineTxt.height + Math.round(10 * sz) : 0;
    const hintH = touch ? 0 : Math.round(15 * sz) + 6;
    const h = PAD * 2 + nameH + lineH + rowH.reduce((a, x) => a + x + 5, 0) + hintH;

    const { cx, cy } = this.place(v.anchor, w, h);
    const top = cy - h / 2;

    c.add(this.card(cx, cy, w, h));
    c.add(label(this.scene, cx - w / 2 + PAD, top + PAD + nameH / 2, `nói với ${v.name}`, 12, UI.muted, "700").setOrigin(0, 0.5));
    if (touch) c.add(this.closeButton(cx + w / 2 - PAD - closeH / 2, top + PAD + nameH / 2, closeH));

    if (lineTxt) {
      lineTxt.setPosition(cx - w / 2 + PAD, top + PAD + nameH + Math.round(3 * sz));
      c.add(lineTxt);
      // Một gạch mảnh ngăn lời HỌ với lời MÌNH: hai khối chữ liền nhau trong cùng một
      // thẻ thì mắt đọc thành một danh sách bốn dòng, và dòng đầu không bấm được.
      const sep = this.scene.add.graphics();
      sep.fillStyle(UI.line, 1);
      sep.fillRect(cx - w / 2 + PAD, top + PAD + nameH + lineH - Math.round(5 * sz), w - PAD * 2, 1);
      c.add(sep);
    }

    let y = top + PAD + nameH + lineH;
    this.rows = [];
    this.count = v.options.length;
    this.cursor = touch ? -1 : 0;
    v.options.forEach((o, i) => {
      c.add(this.makeRow(cx, y + rowH[i] / 2, w - PAD * 2, rowH[i], i, rowTexts[i], o.tone, sz));
      y += rowH[i] + 5;
    });

    if (!touch) {
      const hint = v.done ? "Enter — thôi" : "1–3 · ↑↓ + Enter · Esc đóng";
      c.add(label(this.scene, cx, top + h - PAD / 2 - hintH / 2, hint, 10, UI.muted, "400"));
    }

    this.root = c;
    this.paint();
    this.bindKeys(v.done);
  }

  /** ⚠️ NEO BẰNG MÉP TRÊN, KHÔNG BẰNG TÂM: chiều cao đổi theo từng nhịp, neo bằng tâm thì cả hai mép cùng xê dịch. Mắt đọc từ trên xuống nên mỏ neo phải là chỗ họ đang nhìn. */
  private place(a: { x: number; y: number } | undefined, w: number, h: number) {
    const gap = isPhone() ? designFor(PHONE_GAP_CSS) : undefined;
    const r = placeTalkCard(this.locked, a, { w, h }, { w: GAME_W, h: GAME_H }, gap);
    this.locked = { cx: r.cx, top: r.top };
    return { cx: r.cx, cy: r.top + h / 2 };
  }


  private closeButton(x: number, y: number, size: number) {
    const b = this.scene.add.container(x, y);
    const g = this.scene.add.graphics();
    const r = size / 2;
    g.fillStyle(0x3c1c0a, 0.18).fillRoundedRect(-r, -r + 3, size, size, 12);
    g.fillStyle(0xfbf8ef, 1).fillRoundedRect(-r, -r, size, size, 12);
    g.lineStyle(1.5, UI.line, 1).strokeRoundedRect(-r, -r, size, size, 12);
    const a = size * 0.18;
    g.lineStyle(Math.max(3, size * 0.07), 0x222a31, 1).beginPath()
      .moveTo(-a, -a).lineTo(a, a).moveTo(a, -a).lineTo(-a, a).strokePath();
    b.add(g);
    b.setSize(size, size);
    b.setInteractive(new Phaser.Geom.Rectangle(0, 0, size, size), Phaser.Geom.Rectangle.Contains);
    let pressed = false;
    b.on("pointerdown", () => { pressed = true; });
    b.on("pointerout", () => { pressed = false; });
    b.on("pointerup", () => {
      if (!pressed) return;
      sfx.play(this.scene, "ui_click");
      this.close();
    });
    return b;
  }

  /** Thẻ giấy phẳng: viền mảnh, hai lớp bóng mềm. */
  private card(cx: number, cy: number, w: number, h: number) {
    const g = this.scene.add.graphics();
    const x = cx - w / 2, y = cy - h / 2;
    g.fillStyle(0x3c1c0a, 0.1).fillRoundedRect(x - 4, y + 3, w + 8, h + 10, 18);
    g.fillStyle(0x3c1c0a, 0.2).fillRoundedRect(x - 1, y + 3, w + 2, h + 3, 14);
    g.fillStyle(0xf7f1e2, 1).fillRoundedRect(x, y, w, h, 12);
    g.lineStyle(1.5, UI.line, 1).strokeRoundedRect(x, y, w, h, 12);
    return g;
  }

  private makeRow(x: number, y: number, w: number, h: number, i: number, txt: Phaser.GameObjects.Text, tone: TalkTone, sz: number) {
    const row = this.scene.add.container(x, y);
    const bg = this.scene.add.graphics();
    const num = label(this.scene, -w / 2 + 13, 0, String(i + 1), 12, UI.muted, "700").setOrigin(0.5);
    txt.setPosition(-w / 2 + 26, 0);

    row.add([bg, num, txt]);
    row.setSize(w, h);
    // Container cộng displayOrigin vào toạ độ local trước khi gọi Contains — hit area
    // phải tính từ (0,0), y hệt bẫy đã gặp ở `theme.button`.
    row.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    let pressed = false;
    row.on("pointerover", () => { this.cursor = i; this.paint(); });
    row.on("pointerdown", () => { pressed = true; });
    row.on("pointerout", () => { pressed = false; });
    row.on("pointerup", () => { if (pressed) this.pick(i); });

    this.rows.push({ bg, row, y, w, h });
    (bg as any).__tone = tone;
    void sz;
    return row;
  }

  private paint() {
    this.rows.forEach((r, i) => {
      const on = i === this.cursor;
      const tone = (r.bg as any).__tone as TalkTone;
      r.row.setY(r.y - (on ? 1.5 : 0));
      r.bg.clear();
      if (on) r.bg.fillStyle(0x3c1c0a, 0.16).fillRoundedRect(-r.w / 2 + 1, -r.h / 2 + 3, r.w - 2, r.h, 8);
      r.bg.fillStyle(on ? 0xffffff : 0xfbf8ef, 1);
      r.bg.fillRoundedRect(-r.w / 2, -r.h / 2, r.w, r.h, 8);
      r.bg.lineStyle(1.5, on ? UI.accent : UI.line, 1);
      r.bg.strokeRoundedRect(-r.w / 2, -r.h / 2, r.w, r.h, 8);
      r.bg.fillStyle(TONE_TINT[tone], on ? 1 : 0.75);
      r.bg.fillRoundedRect(-r.w / 2, -r.h / 2 + 5, 3, r.h - 10, 2);
    });
  }

  /** ⚠️ `stopPropagation()` trên MỌI `keydown` làm `P` không tới được `StallScene`, tức không vào được menu tạm dừng khi thẻ đang mở. */
  private static readonly PASS_THROUGH = new Set(["KeyP", "Tab", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8"]);

  private bindKeys(done: boolean) {
    const kb = this.scene.input.keyboard;
    if (!kb) return;
    const onKey = (ev: KeyboardEvent) => {
      if (!this.root) return;
      /** Không lọc `ev.repeat` thì giữ Space là key-repeat bấm qua cả cây trong một phần mười giây — cuộc đó coi như đã nghe. */
      if (TalkPanel.PASS_THROUGH.has(ev.code)) return;
      /** ⚠️ `return` ngay khi `ev.repeat` mà chưa `stopPropagation()` thì mọi sự kiện lặp lọt xuống plugin bàn phím và bật `keys.W/A/S/D.isDown` — người chơi đi mất khỏi quầy. */
      ev.stopPropagation();
      if (ev.repeat && ev.code !== "ArrowUp" && ev.code !== "ArrowDown"
        && ev.code !== "KeyW" && ev.code !== "KeyS") return;
      /** `PASS_THROUGH` cho `P` đi thẳng vào menu tạm dừng, nhưng thẻ vẫn còn đó và vẫn nghe phím — mà phản xạ của ai cũng là bấm Enter. */
      if (this.blocked()) return;
      // Listener này ở pha CAPTURE trên window nên nó chạy trước plugin bàn phím của
      // Phaser — `stopPropagation` phía trên là thứ duy nhất giữ cho W/A/S/D không làm
      // người chơi đi mất khỏi quầy trong lúc đọc.
      const num = /^(?:Digit|Numpad)([1-9])$/.exec(ev.code);
      if (num && !done) {
        const i = Number(num[1]) - 1;
        if (i < this.count) { ev.preventDefault(); this.pick(i); }
        return;
      }
      if (ev.code === "ArrowUp" || ev.code === "KeyW") {
        ev.preventDefault();
        this.cursor = (this.cursor - 1 + this.count) % Math.max(1, this.count);
        this.paint();
        return;
      }
      if (ev.code === "ArrowDown" || ev.code === "KeyS") {
        ev.preventDefault();
        this.cursor = (this.cursor + 1) % Math.max(1, this.count);
        this.paint();
        return;
      }
      if (ev.code === "Enter" || ev.code === "Space") {
        ev.preventDefault();
        if (done || !this.count) this.close();
        else this.pick(Math.max(0, this.cursor));
        return;
      }
      /** Esc LUÔN MIỄN PHÍ (luật L4). "Làm thinh" đã thành một DÒNG viết sẵn trong dải, giọng `IM`, đọc được hệ quả trước khi bấm. */
      if (ev.code === "Escape") { ev.preventDefault(); this.close(); }
    };
    // `capture` để Esc không chạm tới menu tạm dừng của StallScene lúc thẻ đang mở.
    window.addEventListener("keydown", onKey, true);
    this.off.push(() => window.removeEventListener("keydown", onKey, true));
  }

  private pick(i: number) {
    const fn = this.onPick;
    this.unbind();
    fn(i);
  }

  private close() {
    const fn = this.onClose;
    this.destroy();
    fn();
  }

  private unbind() {
    for (const f of this.off) f();
    this.off = [];
  }

  destroy() {
    this.view = null;
    this.locked = null;
    this.unbind();
    this.root?.destroy(true);
    this.root = null;
    this.rows = [];
    this.count = 0;
  }
}
