import Phaser from "phaser";
import { ICON } from "../art";
import { fitPhoto } from "../art/photo";
import { GAME_W, GAME_H } from "../core/config";
import { BAND_LABEL, type Clock } from "../core/clock";
import type { Settings } from "../core/save";
import { blockedReason, type Hand, type Station } from "../world/stations";
import { INGREDIENTS, portionsOf, type Ingredient } from "../sim/order";
import { FOOD } from "../art/food";
import { FONT, UI } from "./theme";

const DEPTH = 9_000_000;
const HELP_UNTIL_DAY = 3;

const HELP_BY_DAY = [
  "WASD đi · E làm việc · Esc tạm dừng",
  "WASD đi · Shift chạy · E làm việc · Q đặt xuống",
  "WASD đi · E làm việc · R cầm ổ trên thớt · Q đặt xuống · F hỏi chuyện · giữ C che tay",
];

/** `GLANCE` = có người nhìn MẶT mình · `CLOSE` = có người nhìn thẳng vào TAY mình. */
export type Watch = "NONE" | "GLANCE" | "CLOSE";

/** Không đặt giữa màn hình: vòng độ giòn trên cửa lò nằm ở quãng y 60–90. */
const EYE_X = GAME_W / 2 + 58;
const EYE_Y = 26;
const EYE_PLATE_W = 44, EYE_PLATE_H = 36;
const EYE_W = 33, EYE_H = 20;
const EYE_RED = 0xc0392b;
const EYE_BLINK_MS = 1150;

/** Toast nằm cột phải vì giữa đỉnh màn hình là chỗ nhãn trạm. */
const TOAST_RIGHT = GAME_W - 26;
const TOAST_TOP = 150;
const TOAST_GAP = 6;
const TOAST_MAX = 3;
/** Đếm ký tự chứ không đếm từ vì chữ Việt tách theo âm tiết. */
const TOAST_BASE_MS = 1800;
const TOAST_PER_CHAR_MS = 55;
const TOAST_MIN_MS = 2600;
const TOAST_MAX_MS = 6000;
const TOAST_FADE_FROM = 0.78;
/** Dưới ~15–20 px thì mắt ngoại vi không bắt được chuyển động. */
const TOAST_SLIDE_PX = 20;
const TOAST_SLIDE_MS = 190;
const TOAST_TONE: Record<ToastTone, number> = {
  good: 0x3f7d5a,
  bad: 0xc0392b,
  info: 0x6a7680,
};

export type ToastTone = "good" | "bad" | "info";

type Toast = {
  text: Phaser.GameObjects.Text;
  born: number;
  tone: ToastTone;
  body: string;
  count: number;
  life: number;
};

/** Không hiện điểm, sao, thanh kiên nhẫn hay "đúng/sai" của hệ thống. */
export class Hud {
  private left: Phaser.GameObjects.Text;
  private right: Phaser.GameObjects.Text;
  private statBg: Phaser.GameObjects.Graphics;
  private prompt: Phaser.GameObjects.Text;
  private promptBg: Phaser.GameObjects.Graphics;
  private bar: Phaser.GameObjects.Graphics;
  private feedText: Phaser.GameObjects.Text;
  private feedBg: Phaser.GameObjects.Graphics;
  private feed: string[] = [];
  private ticketBg: Phaser.GameObjects.Graphics;
  private ticketText: Phaser.GameObjects.Text;
  private help: Phaser.GameObjects.Text;
  private saveDot: Phaser.GameObjects.Arc;
  private carryBg: Phaser.GameObjects.Graphics;
  private carryIcons: Phaser.GameObjects.Image[] = [];
  private carryNums: Phaser.GameObjects.Text[] = [];
  private carryKey = "";
  private handsGfx: Phaser.GameObjects.Graphics;
  private handsKey = "";
  private eyePlate: Phaser.GameObjects.Graphics;
  private eye: Phaser.GameObjects.Image | null = null;
  private toastBg: Phaser.GameObjects.Graphics;
  private toasts: Toast[] = [];
  private scene: Phaser.Scene;
  private fs: (n: number) => string;

  constructor(scene: Phaser.Scene, private settings: Settings, onPause?: () => void) {
    this.scene = scene;
    const fs = this.fs = (n: number) => `${Math.round(n * settings.textScale)}px`;
    const fixed = <T extends Phaser.GameObjects.GameObject>(o: T, d = DEPTH) =>
      (o as any).setScrollFactor(0).setDepth(d) as T;

    this.statBg = fixed(scene.add.graphics());
    const stat = (x: number, origin: number) => fixed(scene.add.text(x, 20, "", {
      fontFamily: FONT, fontSize: fs(14), fontStyle: "500", color: UI.ink, lineSpacing: Math.round(7 * settings.textScale),
    }).setOrigin(origin, 0), DEPTH + 100);
    this.left = stat(26, 0);
    this.right = stat(GAME_W - 26, 1);

    this.promptBg = fixed(scene.add.graphics());
    this.prompt = fixed(scene.add.text(GAME_W / 2, GAME_H - 66, "", {
      fontFamily: FONT, fontSize: fs(15), fontStyle: "500", color: UI.ink, align: "center",
      wordWrap: { width: GAME_W - 80 },
    }).setOrigin(0.5), DEPTH + 100);

    this.bar = fixed(scene.add.graphics(), DEPTH + 50);

    // Phiếu đơn ở góc trên phải để không che mặt khách và không bị bảng kẹp nhân che.
    this.ticketBg = fixed(scene.add.graphics());
    this.ticketText = fixed(scene.add.text(GAME_W - 26, 100, "", {
      fontFamily: FONT, fontSize: fs(13), fontStyle: "500", color: UI.ink, align: "right",
      lineSpacing: Math.round(7 * settings.textScale), wordWrap: { width: 320 * Math.min(settings.textScale, 1.5) },
    }).setOrigin(1, 0), DEPTH + 100);

    this.feedBg = fixed(scene.add.graphics());
    this.feedText = fixed(scene.add.text(26, GAME_H - 100, "", {
      fontFamily: FONT, fontSize: fs(12), color: "#f2efe9", lineSpacing: Math.round(6 * settings.textScale),
      wordWrap: { width: 380 },
    }).setOrigin(0, 1), DEPTH + 100);

    // Ở cỡ chữ 200% dòng này tràn khung nên phải xuống dòng, neo đáy để `drawPrompt` xếp lên trên.
    this.help = fixed(scene.add.text(GAME_W / 2, GAME_H - 8, HELP_BY_DAY[0], {
      fontFamily: FONT, fontSize: fs(11), color: "#f2efe9", stroke: "#1b2429", strokeThickness: 3,
      align: "center", wordWrap: { width: GAME_W - 32 },
    }).setOrigin(0.5, 1), DEPTH + 100);

    this.carryBg = fixed(scene.add.graphics());

    const px = GAME_W / 2, py = 26;
    const pbg = fixed(scene.add.graphics());
    pbg.fillStyle(UI.paper, 1).fillRoundedRect(px - 24, py - 18, 48, 36, 10);
    pbg.fillStyle(0x222a31, 1).fillRect(px - 7, py - 8, 5, 16).fillRect(px + 2, py - 8, 5, 16);
    const hit = fixed(scene.add.zone(px, py, 48, 36).setInteractive({ useHandCursor: true }), DEPTH + 200);
    hit.on("pointerup", () => onPause?.());

    this.handsGfx = fixed(scene.add.graphics());

    // Thiếu icon thì HUD vẫn chạy, chỉ không có mắt.
    this.eyePlate = fixed(scene.add.graphics(), DEPTH + 150);
    if (scene.textures.exists(ICON.eyeInk) && scene.textures.exists(ICON.eyeRed)) {
      this.eye = fixed(scene.add.image(EYE_X, EYE_Y, ICON.eyeInk), DEPTH + 151)
        .setDisplaySize(EYE_W, EYE_H).setVisible(false);
    }

    // Pool cố định để tránh GC giật đúng giờ cao điểm.
    this.toastBg = fixed(scene.add.graphics(), DEPTH + 160);
    for (let i = 0; i < TOAST_MAX; i++) {
      this.toasts.push({
        text: fixed(scene.add.text(TOAST_RIGHT, 0, "", {
          fontFamily: FONT, fontSize: fs(13), fontStyle: "500", color: UI.ink,
          // Rộng hơn 236 px thì dòng dài thò ra giữa màn hình, đè nhãn trạm.
          align: "right", wordWrap: { width: 236 },
        }).setOrigin(1, 0).setVisible(false), DEPTH + 161),
        born: -1,
        tone: "info",
        body: "",
        count: 0,
        life: TOAST_MIN_MS,
      });
    }

    this.saveDot = fixed(scene.add.circle(GAME_W - 14, GAME_H - 14, 4, 0xf4f1e8), DEPTH + 100).setAlpha(0);
  }

  /** Việc máy báo, không dùng cho lời người (đi `say()`); hết chỗ thì cướp dòng già nhất. */
  toast(text: string, tone: ToastTone = "info", now = this.scene.time.now) {
    // Trùng dòng đang hiện thì gộp "×N" và đếm lại giờ từ đầu.
    const same = this.toasts.find((t) => t.born >= 0 && t.body === text);
    if (same) {
      same.count++;
      same.born = now;
      same.tone = tone;
      this.dressToast(same);
      return;
    }
    const slot = this.toasts.find((t) => t.born < 0)
      ?? this.toasts.reduce((a, b) => (a.born <= b.born ? a : b));
    slot.body = text;
    slot.count = 1;
    slot.tone = tone;
    slot.born = now;
    slot.text.setVisible(true).setAlpha(1);
    this.dressToast(slot);
  }

  private dressToast(t: Toast) {
    t.text.setText(t.count > 1 ? `${t.body}  ×${t.count}` : t.body);
    const chars = t.text.text.length;
    t.life = Math.min(TOAST_MAX_MS, Math.max(TOAST_MIN_MS, TOAST_BASE_MS + chars * TOAST_PER_CHAR_MS));
  }

  flashSaved() {
    this.scene.tweens.killTweensOf(this.saveDot);
    this.saveDot.setAlpha(0.85);
    this.scene.tweens.add({ targets: this.saveDot, alpha: 0, duration: 800, ease: "Sine.easeIn" });
  }

  get statsBottom() {
    return this.left.getBounds().bottom + 11;
  }

  /** Bảng kẹp nhân mở thì dời nhật ký lời người sang phải để không chồng nhau. */
  dockFeed(right: boolean) {
    const x = right ? 496 : 26;
    if (this.feedText.x === x) return;
    this.feedText.setPosition(x, right ? GAME_H - 14 : GAME_H - 100);
    this.redrawFeedBg();
  }

  private redrawFeedBg() {
    this.feedBg.clear();
    if (!this.feed.length) return;
    const b = this.feedText.getBounds();
    this.feedBg.fillStyle(0x2b2f31, 1).fillRoundedRect(b.x - 10, b.y - 6, b.width + 20, b.height + 12, 8);
  }

  /** Lời người nói; việc máy báo đi `toast()`. */
  say(line: string) {
    this.log(line);
  }

  log(line: string) {
    this.feed.push(line);
    if (this.feed.length > 3) this.feed.shift();
    this.feedText.setText(this.feed.join("\n"));
    this.redrawFeedBg();
  }

  clearLog() {
    this.feed = [];
    this.feedText.setText("");
    this.feedBg.clear();
    for (const t of this.toasts) { t.born = -1; t.count = 0; t.body = ""; t.text.setVisible(false); }
    this.toastBg.clear();
  }

  update(s: {
    day: number; clock: Clock; money: number; served: number;
    near: Station | null; hand: Hand; busy: { st: Station; ms: number } | null;
    frozen: boolean;
    ticket: { name: string; text: string; urgent: boolean } | null;
    prompt?: string | null;
    carry?: readonly Ingredient[] | null;
    hands?: "CLEAN" | "MONEY";
    watch?: Watch;
    now?: number;
    work?: { frac: number } | null;
  }) {
    const m = Math.floor(s.clock.minutes);
    const hhmm = `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
    const slow = this.settings.noTimePressure ? " · thong thả" : "";
    this.left.setText(`ngày ${s.day}\n${hhmm} · ${BAND_LABEL[s.clock.band]}${slow}`);
    this.right.setText(`${s.money.toLocaleString("vi-VN")}₫\nđã bán ${s.served} ổ`);
    this.drawStats();

    const show = s.day <= HELP_UNTIL_DAY && this.feedText.x < 100;
    if (show) this.help.setText(HELP_BY_DAY[Math.min(s.day, HELP_BY_DAY.length) - 1]);
    this.help.setVisible(show);
    this.drawPrompt(s.near, s.hand, s.frozen, s.prompt ?? null);
    this.drawBar(s.busy, s.work ?? null);
    this.drawTicket(s.ticket, s.frozen);
    this.drawCarry(s.frozen ? null : s.carry ?? null);
    this.drawHands(s.hands ?? "CLEAN");
    this.drawEye(s.frozen ? "NONE" : s.watch ?? "NONE");
    this.drawToasts(s.now ?? this.scene.time.now, this.settings.reducedMotion);
  }

  /** `now` là đồng hồ hiệu ứng của scene, vì menu đóng băng `clock` chứ không đóng băng Phaser. */
  private drawToasts(now: number, reducedMotion: boolean) {
    const g = this.toastBg;
    g.clear();
    const live = this.toasts.filter((t) => t.born >= 0).sort((a, b) => b.born - a.born);
    const ticketBottom = this.ticketText.text ? this.ticketText.getBounds().bottom + 18 : 0;
    let y = Math.max(TOAST_TOP, ticketBottom);
    for (const t of live) {
      const age = (now - t.born) / t.life;
      if (age >= 1) { t.born = -1; t.count = 0; t.body = ""; t.text.setVisible(false); continue; }
      const alpha = age < TOAST_FADE_FROM ? 1 : 1 - (age - TOAST_FADE_FROM) / (1 - TOAST_FADE_FROM);
      const slide = reducedMotion ? 0 : Math.max(0, 1 - (now - t.born) / TOAST_SLIDE_MS) * TOAST_SLIDE_PX;
      const h = t.text.height + 12, w = t.text.width + 30;
      const x1 = TOAST_RIGHT + slide, x0 = x1 - w, y0 = y;
      g.fillStyle(0x0d1216, 0.18 * alpha).fillRoundedRect(x0 + 1, y0 + 4, w, h, 9);
      g.fillStyle(UI.paper, alpha).fillRoundedRect(x0, y0, w, h, 9);
      g.fillStyle(TOAST_TONE[t.tone], alpha).fillRoundedRect(x0 + 5, y0 + 6, 3, h - 12, 1.5);
      t.text.setPosition(x1 - 12, y0 + 6).setAlpha(alpha);
      y += h + TOAST_GAP;
    }
  }

  /** Hai bậc phân biệt bằng nháy chứ không chỉ màu; `reducedMotion` tắt nháy. */
  private drawEye(w: Watch) {
    const eye = this.eye;
    const on = w !== "NONE";
    this.eyePlate.clear();
    eye?.setVisible(on);
    if (!on || !eye) return;

    const close = w === "CLOSE";
    const beat = this.settings.reducedMotion || !close
      ? 1
      : 0.5 + 0.5 * Math.sin((this.scene.time.now / EYE_BLINK_MS) * Math.PI * 2);

    const pw = EYE_PLATE_W, ph = EYE_PLATE_H;
    this.eyePlate.fillStyle(UI.paper, 1).fillRoundedRect(EYE_X - pw / 2, EYE_Y - ph / 2, pw, ph, 10);
    if (close) {
      this.eyePlate.lineStyle(2, EYE_RED, 0.35 + 0.5 * beat);
      this.eyePlate.strokeRoundedRect(EYE_X - pw / 2, EYE_Y - ph / 2, pw, ph, 10);
    }

    // `setTexture` làm mất displaySize nên phải set lại ngay sau.
    eye.setTexture(close ? ICON.eyeRed : ICON.eyeInk)
      .setDisplaySize(EYE_W, EYE_H)
      .setAlpha(close ? 0.55 + 0.45 * beat : 0.75);
  }

  private drawHands(state: "CLEAN" | "MONEY") {
    if (state === this.handsKey) return;
    this.handsKey = state;
    const g = this.handsGfx;
    g.clear();
    const x = GAME_W / 2 - 58, y = 26;
    g.fillStyle(UI.paper, 1).fillRoundedRect(x - 22, y - 18, 44, 36, 10);
    const ink = 0x222a31;
    g.lineStyle(2, ink, 1);
    g.strokeRoundedRect(x - 7, y - 3, 14, 13, 3);                     // lòng bàn tay
    for (let i = 0; i < 4; i++) g.strokeRoundedRect(x - 7 + i * 3.6, y - 12, 2.6, 10, 1.2);  // bốn ngón
    g.strokeRoundedRect(x + 7, y - 1, 5, 3, 1.2);                     // ngón cái
    if (state === "MONEY") {
      g.fillStyle(0x5f9e6e, 1);
      g.fillPoints([{ x: x - 12, y: y + 6 }, { x: x + 2, y: y - 6 }, { x: x + 12, y: y + 2 }, { x: x - 2, y: y + 14 }], true);
      g.lineStyle(1.5, 0xf2efe9, 1).strokeCircle(x, y + 4, 3);
    }
  }

  private drawStats() {
    const g = this.statBg;
    g.clear();
    for (const t of [this.left, this.right]) {
      const b = t.getBounds();
      g.fillStyle(0x0d1216, 0.18).fillRoundedRect(b.x - 14, b.y - 9, b.width + 28, b.height + 18, 12);
      g.fillStyle(UI.paper, 1).fillRoundedRect(b.x - 14, b.y - 11, b.width + 28, b.height + 18, 12);
    }
  }

  private drawTicket(t: { name: string; text: string; urgent: boolean } | null, frozen: boolean) {
    this.ticketBg.clear();
    if (!t || frozen) { this.ticketText.setText(""); return; }
    const top = this.right.getBounds().bottom + 20;
    this.ticketText.setText(`${t.name}\n${t.text}`).setPosition(GAME_W - 26, top);
    const b = this.ticketText.getBounds();
    this.ticketBg.fillStyle(UI.paper, 1).fillRoundedRect(b.x - 12, b.y - 8, b.width + 24, b.height + 16, 10);
    this.ticketBg.lineStyle(1.2, UI.line, 1).strokeRoundedRect(b.x - 12, b.y - 8, b.width + 24, b.height + 16, 10);
  }

  private drawCarry(dish: readonly Ingredient[] | null) {
    const key = dish ? dish.join(",") : "";
    if (key === this.carryKey) return;
    this.carryKey = key;
    this.carryBg.clear();
    for (const o of [...this.carryIcons, ...this.carryNums]) o.setVisible(false);
    if (!dish || !dish.length || !this.scene.textures.exists(FOOD.icon("pate"))) return;

    const counts = portionsOf(dish as Ingredient[]);
    const items = INGREDIENTS.filter((i) => counts.has(i.id));
    const step = 46, w = items.length * step + 16, y = 76;
    const x0 = Math.max(16, Math.min(GAME_W / 2 - w / 2, this.ticketText.getBounds().left - 24 - w));
    this.carryBg.fillStyle(UI.paper, 1).fillRoundedRect(x0, y - 22, w, 44, 10);
    items.forEach((ing, i) => {
      const icon = this.carryIcons[i] ??= this.scene.add.image(0, 0, FOOD.icon(ing.id)).setScrollFactor(0).setDepth(DEPTH + 100);
      const num = this.carryNums[i] ??= this.scene.add.text(0, 0, "", {
        fontFamily: FONT, fontSize: this.fs(11), fontStyle: "700", color: UI.ink,
      }).setOrigin(0, 1).setScrollFactor(0).setDepth(DEPTH + 101);
      const cx = x0 + 8 + step * i + step / 2 - 4;
      fitPhoto(icon.setTexture(FOOD.icon(ing.id)), 0.62).setPosition(cx, y).setVisible(true);
      num.setText(`×${counts.get(ing.id)}`).setPosition(cx + 11, y + 18).setVisible(true);
    });
  }

  private get stackTop() {
    return this.help.visible ? this.help.getBounds().top - 8 : GAME_H - 48;
  }

  private drawPrompt(st: Station | null, hand: Hand, frozen: boolean, override: string | null) {
    this.promptBg.clear();
    if (frozen || (!st && !override)) { this.prompt.setText(""); return; }

    const why = override || !st ? null : blockedReason(st, hand);
    const keyHint = st && st.holdMs === 0 ? "bấm E" : "giữ E";
    this.prompt.setText(override ?? (why
      ? `${st!.name} — ${why}`
      : `${st!.name} — ${keyHint} để ${st!.verb}`));

    const w = this.prompt.width + 34, h = this.prompt.height + 16;
    const x = GAME_W / 2 - w / 2, y = this.stackTop - h;
    this.prompt.setPosition(GAME_W / 2, y + h / 2);
    this.promptBg.fillStyle(0x0d1216, 0.22);
    this.promptBg.fillRoundedRect(x, y + 3, w, h, 10);
    this.promptBg.fillStyle(why ? 0xe7e0d2 : UI.paper, 1);
    this.promptBg.fillRoundedRect(x, y, w, h, 10);
  }

  /** Chỉ `busy` (giữ phím) mới xanh khi đầy, vì xanh nghĩa là được nhả phím; `work` thì không. */
  private drawBar(busy: { st: Station; ms: number } | null, work: { frac: number } | null) {
    this.bar.clear();
    const frac = busy ? Math.min(1, busy.ms / busy.st.holdMs) : work ? work.frac : -1;
    if (frac < 0) return;
    const done = !!busy && busy.ms >= busy.st.holdMs;
    const promptH = this.prompt.text ? this.prompt.height + 16 : 0;
    const W = 200, H = 10, x = GAME_W / 2 - W / 2, y = this.stackTop - promptH - H - 12;
    this.bar.fillStyle(0x1b2429, 0.55);
    this.bar.fillRoundedRect(x - 2, y - 2, W + 4, H + 4, 6);
    this.bar.fillStyle(done ? 0x6fbf8a : 0xe8c27a, 1);
    this.bar.fillRoundedRect(x, y, Math.max(4, W * frac), H, 5);
  }
}
