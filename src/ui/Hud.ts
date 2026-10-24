import Phaser from "phaser";
import { ICON, ntfKey, type NtfIcon } from "../art";
import { fitPhoto } from "../art/photo";
import { GAME_W, GAME_H } from "../core/config";
import { BAND_LABEL, type Clock } from "../core/clock";
import type { Settings } from "../core/save";
import { blockedReason, type Hand, type Station } from "../world/stations";
import { INGREDIENTS, portionsOf, type Ingredient } from "../sim/order";
import { FOOD } from "../art/food";
import { FONT, UI, iconButton } from "./theme";
import { CLAY, clayButton, clayImage } from "./clay";

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
const EYE_X = GAME_W / 2 + 124;
const EYE_Y = 26;
const ICON_H = 19;
const HANDS_X = GAME_W / 2 - 58;
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
const TOAST_TILE: Record<ToastTone, number> = { good: 0xe3f2e8, bad: 0xfbe3df, info: 0xe9edf0 };
const TOAST_ICON: Record<ToastTone, NtfIcon> = { good: "check", bad: "alert", info: "info" };
const TOAST_TILE_PX = 34;
const TOAST_ICON_PX = 19;
const TOAST_BODY_W = 210;

export type ToastTone = "good" | "bad" | "info";
export type ToastOpts = { icon?: NtfIcon; title?: string };

const CREAM = "#f7f1e2";
const BTN_W = 48, BTN_H = 38;

/** Cùng kiểu với `glass()` nhưng vẽ lại được vào Graphics có sẵn khi kích thước đổi. */
function paintGlass(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r = 12) {
  g.fillStyle(0x2a2018, 0.55).fillRoundedRect(x, y, w, h, r);
  g.lineStyle(1.5, 0xf7f1e2, 0.28).strokeRoundedRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5, r);
}

/** Thẻ giấy phẳng: hai lớp bóng mềm, không môi dưới. */
function paintPaper(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r: number, fill: number, a = 1) {
  g.fillStyle(0x0d1216, 0.1 * a).fillRoundedRect(x - 2, y + 1, w + 4, h + 7, r + 2);
  g.fillStyle(0x0d1216, 0.16 * a).fillRoundedRect(x - 0.5, y + 1.5, w + 1, h + 3, r + 1);
  g.fillStyle(fill, a).fillRoundedRect(x, y, w, h, r);
}

type Toast = {
  text: Phaser.GameObjects.Text;
  title: Phaser.GameObjects.Text;
  icon: Phaser.GameObjects.Image;
  iconName: NtfIcon;
  born: number;
  tone: ToastTone;
  body: string;
  count: number;
  life: number;
};

/** Không hiện điểm, sao, thanh kiên nhẫn hay "đúng/sai" của hệ thống. */
const PHONE_X = GAME_W / 2 + 60;
const PHONE_Y = 26;

export class Hud {
  private left: Phaser.GameObjects.Text;
  private right: Phaser.GameObjects.Text;
  private statBg: Phaser.GameObjects.Graphics;
  private prompt: Phaser.GameObjects.Text;
  private promptBg: Phaser.GameObjects.Graphics;
  private bar: Phaser.GameObjects.Graphics;
  private feedText: Phaser.GameObjects.Text;
  private feedBg: Phaser.GameObjects.Graphics;
  private helpBg: Phaser.GameObjects.Graphics;
  private feed: string[] = [];
  private ticketBg: Phaser.GameObjects.Graphics;
  private ticketText: Phaser.GameObjects.Text;
  private help: Phaser.GameObjects.Text;
  private saveDot: Phaser.GameObjects.Arc;
  private carryBg: Phaser.GameObjects.Graphics;
  private carryIcons: Phaser.GameObjects.Image[] = [];
  private carryNums: Phaser.GameObjects.Text[] = [];
  private carryKey = "";
  private phoneBadgeGfx: Phaser.GameObjects.Graphics;
  private phoneBadge: Phaser.GameObjects.Text;
  private unread = 0;
  private handsIcon: Phaser.GameObjects.Image;
  private handsKey = "";
  private eyeGroup: Phaser.GameObjects.Container;
  private eyePlate: Phaser.GameObjects.Image;
  private eyeIcon: Phaser.GameObjects.Image;
  private toastBg: Phaser.GameObjects.Graphics;
  private toasts: Toast[] = [];
  private scene: Phaser.Scene;
  private fs: (n: number) => string;

  constructor(scene: Phaser.Scene, private settings: Settings, onPause?: () => void, onPhone?: () => void) {
    this.scene = scene;
    const fs = this.fs = (n: number) => `${Math.round(n * settings.textScale)}px`;
    const fixed = <T extends Phaser.GameObjects.GameObject>(o: T, d = DEPTH) =>
      (o as any).setScrollFactor(0).setDepth(d) as T;

    this.statBg = fixed(scene.add.graphics());
    const stat = (x: number, origin: number) => fixed(scene.add.text(x, 20, "", {
      fontFamily: FONT, fontSize: fs(14), fontStyle: "600", color: CREAM, lineSpacing: Math.round(7 * settings.textScale),
    }).setOrigin(origin, 0).setShadow(0, 1, "#1b1410", 2, false, true), DEPTH + 100);
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
      fontFamily: FONT, fontSize: fs(12), color: CREAM, lineSpacing: Math.round(6 * settings.textScale),
      wordWrap: { width: 380 },
    }).setOrigin(0, 1), DEPTH + 100);

    // Ở cỡ chữ 200% dòng này tràn khung nên phải xuống dòng, neo đáy để `drawPrompt` xếp lên trên.
    this.helpBg = fixed(scene.add.graphics(), DEPTH + 90);
    this.help = fixed(scene.add.text(GAME_W / 2, GAME_H - 12, HELP_BY_DAY[0], {
      fontFamily: FONT, fontSize: fs(11), color: CREAM,
      align: "center", wordWrap: { width: GAME_W - 80 },
    }).setOrigin(0.5, 1), DEPTH + 100);

    this.carryBg = fixed(scene.add.graphics());

    const pause = iconButton(scene, GAME_W / 2, 26, BTN_W, BTN_H, () => onPause?.());
    pause.icon.fillStyle(0xffffff, 0.8).fillRoundedRect(-8, -7, 5, 16, 1.5).fillRoundedRect(3, -7, 5, 16, 1.5);
    pause.icon.fillStyle(0x2a2420, 1).fillRoundedRect(-8, -8, 5, 16, 1.5).fillRoundedRect(3, -8, 5, 16, 1.5);
    fixed(pause, DEPTH + 200);

    const phone = iconButton(scene, PHONE_X, PHONE_Y, BTN_W, BTN_H, () => onPhone?.());
    phone.setIconImage(ntfKey("phone"), 21);
    fixed(phone, DEPTH + 200);
    this.phoneBadgeGfx = fixed(scene.add.graphics(), DEPTH + 201);
    this.phoneBadge = fixed(scene.add.text(PHONE_X + 20, PHONE_Y - 15, "", {
      fontFamily: FONT, fontSize: "11px", fontStyle: "800", color: "#ffffff",
    }).setOrigin(0.5).setShadow(0, 1, "#8f1f13", 0, false, true), DEPTH + 202);
    this.paintPhone();

    fixed(clayImage(scene, clayButton(scene, CLAY.cream, BTN_W, BTN_H, "up"), HANDS_X, 26, BTN_W, BTN_H), DEPTH);
    this.handsIcon = fixed(scene.add.image(HANDS_X, 24, ICON.handClean), DEPTH + 1);
    this.fitIcon(this.handsIcon);

    this.eyePlate = clayImage(scene, clayButton(scene, CLAY.cream, BTN_W, BTN_H, "up"), 0, 0, BTN_W, BTN_H);
    this.eyeIcon = scene.add.image(0, -2, ICON.eyeGlance);
    this.fitIcon(this.eyeIcon);
    this.eyeGroup = fixed(scene.add.container(EYE_X, EYE_Y, [this.eyePlate, this.eyeIcon]), DEPTH + 150).setVisible(false);

    // Pool cố định để tránh GC giật đúng giờ cao điểm.
    this.toastBg = fixed(scene.add.graphics(), DEPTH + 160);
    for (let i = 0; i < TOAST_MAX; i++) {
      this.toasts.push({
        text: fixed(scene.add.text(TOAST_RIGHT, 0, "", {
          fontFamily: FONT, fontSize: fs(13), fontStyle: "500", color: UI.ink,
          // Rộng hơn 210 px thì dòng dài thò ra giữa màn hình, đè nhãn trạm.
          wordWrap: { width: TOAST_BODY_W },
        }).setOrigin(0, 0).setVisible(false), DEPTH + 162),
        title: fixed(scene.add.text(TOAST_RIGHT, 0, "", {
          fontFamily: FONT, fontSize: fs(11), fontStyle: "700", color: "#6a7680",
        }).setOrigin(0, 0).setVisible(false), DEPTH + 162),
        icon: fixed(scene.add.image(0, 0, ntfKey("info")).setVisible(false), DEPTH + 162),
        iconName: "info",
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
  setUnread(n: number) {
    if (n === this.unread) return;
    this.unread = n;
    this.paintPhone();
  }

  private paintPhone() {
    const g = this.phoneBadgeGfx;
    g.clear();
    const x = PHONE_X + 20, y = PHONE_Y - 15;
    if (this.unread > 0) {
      const r = this.unread > 9 ? 10 : 9;
      g.fillStyle(0x3c1c0a, 0.35).fillCircle(x, y + 4, r);
      g.fillStyle(0x8f1f13, 1).fillCircle(x, y + 2, r);
      g.fillStyle(0xe0432f, 1).fillCircle(x, y, r);
      g.fillStyle(0xf77a64, 1).fillCircle(x, y - 1.5, r - 2.5);
      g.fillStyle(0xffffff, 0.55).fillEllipse(x - 2, y - 4.5, r * 0.9, r * 0.45);
    }
    this.phoneBadge.setText(this.unread > 9 ? "9+" : this.unread ? String(this.unread) : "");
  }

  toast(text: string, tone: ToastTone = "info", now = this.scene.time.now, opts: ToastOpts = {}) {
    // Trùng dòng đang hiện thì gộp "×N" và đếm lại giờ từ đầu.
    const same = this.toasts.find((t) => t.born >= 0 && t.body === text);
    if (same) {
      same.count++;
      same.born = now;
      same.tone = tone;
      this.dressToast(same, opts);
      return;
    }
    const slot = this.toasts.find((t) => t.born < 0)
      ?? this.toasts.reduce((a, b) => (a.born <= b.born ? a : b));
    slot.body = text;
    slot.count = 1;
    slot.tone = tone;
    slot.born = now;
    slot.text.setVisible(true).setAlpha(1);
    this.dressToast(slot, opts);
  }

  private dressToast(t: Toast, opts: ToastOpts) {
    t.text.setText(t.count > 1 ? `${t.body}  ×${t.count}` : t.body);
    t.title.setText(opts.title ?? "").setVisible(!!opts.title);
    t.iconName = opts.icon ?? TOAST_ICON[t.tone];
    t.icon.setTexture(ntfKey(t.iconName)).setScale(TOAST_ICON_PX / t.icon.height).setVisible(true);
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
    paintGlass(this.feedBg, b.x - 10, b.y - 6, b.width + 20, b.height + 12, 10);
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
    for (const t of this.toasts) { t.born = -1; t.count = 0; t.body = ""; t.text.setVisible(false); t.title.setVisible(false); t.icon.setVisible(false); }
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
    this.helpBg.clear();
    if (show) {
      const hb = this.help.getBounds();
      paintGlass(this.helpBg, hb.x - 12, hb.y - 6, hb.width + 24, hb.height + 12, 10);
    }
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
      if (age >= 1) { t.born = -1; t.count = 0; t.body = ""; t.text.setVisible(false); t.title.setVisible(false); t.icon.setVisible(false); continue; }
      const alpha = age < TOAST_FADE_FROM ? 1 : 1 - (age - TOAST_FADE_FROM) / (1 - TOAST_FADE_FROM);
      const slide = reducedMotion ? 0 : Math.max(0, 1 - (now - t.born) / TOAST_SLIDE_MS) * TOAST_SLIDE_PX;
      const titleH = t.title.visible ? t.title.height + 1 : 0;
      const pad = 12, textX = pad + TOAST_TILE_PX + 10;
      const h = Math.max(TOAST_TILE_PX + 16, titleH + t.text.height + 18);
      const w = Math.max(150, textX + Math.max(t.text.width, t.title.visible ? t.title.width : 0) + pad + 2);
      const x1 = TOAST_RIGHT + slide, x0 = x1 - w, y0 = y;
      paintPaper(g, x0, y0, w, h, 16, 0xffffff, alpha * 0.97);
      const ty = y0 + (h - TOAST_TILE_PX) / 2;
      g.fillStyle(TOAST_TILE[t.tone], alpha).fillRoundedRect(x0 + pad, ty, TOAST_TILE_PX, TOAST_TILE_PX, 10);
      t.icon.setPosition(x0 + pad + TOAST_TILE_PX / 2, ty + TOAST_TILE_PX / 2).setAlpha(alpha);
      t.title.setPosition(x0 + textX, y0 + 9).setAlpha(alpha);
      t.text.setPosition(x0 + textX, y0 + 9 + titleH).setAlpha(alpha);
      y += h + TOAST_GAP;
    }
  }

  private fitIcon(img: Phaser.GameObjects.Image) {
    img.setScale(ICON_H / img.height);
    if (img.displayWidth > BTN_W - 12) img.setScale((BTN_W - 16) / img.width);
  }

  /** Hai bậc phân biệt bằng màu nút và nháy; `reducedMotion` tắt nháy. */
  private drawEye(w: Watch) {
    const on = w !== "NONE";
    this.eyeGroup.setVisible(on);
    if (!on) return;

    const close = w === "CLOSE";
    const beat = this.settings.reducedMotion || !close
      ? 1
      : 0.5 + 0.5 * Math.sin((this.scene.time.now / EYE_BLINK_MS) * Math.PI * 2);
    this.eyePlate.setTexture(clayButton(this.scene, close ? CLAY.red : CLAY.cream, BTN_W, BTN_H, "up"));
    this.eyeIcon.setTexture(close ? ICON.eyeClose : ICON.eyeGlance);
    this.fitIcon(this.eyeIcon);
    this.eyeGroup.setAlpha(close ? 0.6 + 0.4 * beat : 1);
  }

  private drawHands(state: "CLEAN" | "MONEY") {
    if (state === this.handsKey) return;
    this.handsKey = state;
    this.handsIcon.setTexture(state === "MONEY" ? ICON.handMoney : ICON.handClean);
    this.fitIcon(this.handsIcon);
  }

  private drawStats() {
    const g = this.statBg;
    g.clear();
    for (const t of [this.left, this.right]) {
      const b = t.getBounds();
      paintGlass(g, b.x - 14, b.y - 10, b.width + 28, b.height + 18, 12);
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
    return this.help.visible ? this.help.getBounds().top - 16 : GAME_H - 48;
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
    paintPaper(this.promptBg, x, y, w, h, 10, why ? 0xe7e0d2 : 0xf7f1e2);
  }

  /** Chỉ `busy` (giữ phím) mới xanh khi đầy, vì xanh nghĩa là được nhả phím; `work` thì không. */
  private drawBar(busy: { st: Station; ms: number } | null, work: { frac: number } | null) {
    this.bar.clear();
    const frac = busy ? Math.min(1, busy.ms / busy.st.holdMs) : work ? work.frac : -1;
    if (frac < 0) return;
    const done = !!busy && busy.ms >= busy.st.holdMs;
    const promptH = this.prompt.text ? this.prompt.height + 16 : 0;
    const W = Math.max(150, this.prompt.text ? this.prompt.width + 16 : 0), H = 12, pad = 5;
    const px = GAME_W / 2 - W / 2, py = this.stackTop - promptH - 5 - (H + pad * 2);
    const gx = px + pad, gy = py + pad, gw = W - pad * 2;
    const g = this.bar;
    g.fillStyle(0x2a2018, 0.72).fillRoundedRect(px, py, W, H + pad * 2, (H + pad * 2) / 2);
    g.lineStyle(1.5, 0xf7f1e2, 0.25).strokeRoundedRect(px + 0.75, py + 0.75, W - 1.5, H + pad * 2 - 1.5, (H + pad * 2) / 2);
    g.fillStyle(0x120d08, 0.9).fillRoundedRect(gx, gy, gw, H, H / 2);
    g.fillStyle(0x000000, 0.55).fillRoundedRect(gx + 1, gy, gw - 2, 3, 1.5);
    const fw = Math.max(H, gw * frac);
    g.fillStyle(done ? 0x337a52 : 0xa86d08, 1).fillRoundedRect(gx, gy, fw, H, H / 2);
    g.fillStyle(done ? 0x4a9a6b : 0xe29d12, 1).fillRoundedRect(gx, gy, fw, H - 2, H / 2);
    g.fillStyle(done ? 0x79c698 : 0xf7c23c, 1).fillRoundedRect(gx, gy, fw, (H - 2) * 0.62, H / 2);
    g.fillStyle(0xffffff, 0.55).fillRoundedRect(gx + 3, gy + 1.5, Math.max(2, fw - 6), 2, 1);
    if (!done && frac < 1) g.fillStyle(0xffffff, 0.9).fillCircle(gx + fw - H / 2, gy + H / 2 - 0.5, 2);
  }
}
