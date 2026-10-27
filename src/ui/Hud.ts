import Phaser from "phaser";
import { ICON, ntfKey, type NtfIcon } from "../art";
import { fitPhoto } from "../art/photo";
import { GAME_W, GAME_H } from "../core/config";
import { designFor, isPhone, isTouch, onDeviceChange } from "../core/device";
import { ACTION_SIZE, CTX_SIZE, EDGE, PILL_GAP, RUN_SIZE, STICK_BASE } from "./touch/touchStyle";
import { BAND_LABEL, type Clock } from "../core/clock";
import type { Settings } from "../core/save";
import { blockedReason, type Hand, type Station } from "../world/stations";
import { INGREDIENTS, portionsOf, type Ingredient } from "../sim/order";
import { FOOD } from "../art/food";
import { FONT, UI, iconButton, touchFont, touchSize } from "./theme";
import { CLAY, clayButton, clayImage, clayOrigin } from "./clay";

const DEPTH = 9_000_000;
const HELP_UNTIL_DAY = 3;

const HELP_BY_DAY = [
  "WASD đi · E làm việc · Esc tạm dừng",
  "WASD đi · Shift chạy · E làm việc · Q đặt xuống",
  "WASD đi · E làm việc · R cầm ổ trên thớt · Q đặt xuống · F hỏi chuyện",
];

/** Chừa chỗ cho cần và cụm nút điều khiển cảm ứng, pixel thật. */
const LEFT_RESERVE = EDGE + STICK_BASE + 24;
const RIGHT_RESERVE = EDGE + ACTION_SIZE + 12 + RUN_SIZE + 8;
const STICK_TOP = EDGE + STICK_BASE + 40;
const CLUSTER_TOP = EDGE + ACTION_SIZE + 10 + CTX_SIZE + 16;

/** `GLANCE` = có người nhìn MẶT mình · `CLOSE` = có người nhìn thẳng vào TAY mình. */
export type Watch = "NONE" | "GLANCE" | "CLOSE";

const ICON_H = 19;
const EYE_BLINK_MS = 1150;

/** Toast nằm cột phải vì giữa đỉnh màn hình là chỗ nhãn trạm. */
const TOAST_INSET = 26;
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
/** `notice`: tin không gấp, được hoãn khi thẻ hướng dẫn đang hiện. */
export type ToastOpts = { icon?: NtfIcon; title?: string; notice?: boolean };
type Held = { text: string; tone: ToastTone; opts: ToastOpts };

const CREAM = "#f7f1e2";

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
  hit: Phaser.GameObjects.Zone;
  iconName: NtfIcon;
  born: number;
  tone: ToastTone;
  body: string;
  count: number;
  life: number;
};

type Metrics = {
  touch: boolean;
  /** Điện thoại ngang: chữ và khung về sàn của điện thoại. */
  small: boolean;
  /** Hệ số phóng hình theo cỡ chữ; 1 trên chuột. */
  k: number;
  btnW: number;
  btnH: number;
  cy: number;
  hands: number;
  pause: number;
  phone: number;
  eye: number;
  pauseY: number;
  phoneY: number;
  statL: number;
  statR: number;
  statY: number;
  /** Mép trái/phải của dải giữa, nơi prompt, thanh tiến độ và dòng gợi ý được đặt. */
  midL: number;
  midR: number;
  toastRight: number;
  toastBottom: number;
  bodyW: number;
  feedX: number;
  feedY: number;
  feedW: number;
  helpY: number;
};

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
  private feedDocked = false;
  private ticketBg: Phaser.GameObjects.Graphics;
  private ticketText: Phaser.GameObjects.Text;
  private help: Phaser.GameObjects.Text;
  private saveDot: Phaser.GameObjects.Arc;
  private carryBg: Phaser.GameObjects.Graphics;
  private carryIcons: Phaser.GameObjects.Image[] = [];
  private carryNums: Phaser.GameObjects.Text[] = [];
  private carryKey = "";
  private phoneBadgeGfx!: Phaser.GameObjects.Graphics;
  private phoneBadge!: Phaser.GameObjects.Text;
  private unread = 0;
  private handsIcon!: Phaser.GameObjects.Image;
  private handsPlate!: Phaser.GameObjects.Image;
  private handsKey = "";
  private eyeGroup!: Phaser.GameObjects.Container;
  private eyePlate!: Phaser.GameObjects.Image;
  private eyeIcon!: Phaser.GameObjects.Image;
  private cluster: Phaser.GameObjects.GameObject[] = [];
  private toastBg: Phaser.GameObjects.Graphics;
  private toasts: Toast[] = [];
  private held: Held[] = [];
  private holdAll = false;
  private noticeKey: string | null = null;
  private keepOut: { x: number; y: number; w: number; h: number } | null = null;
  private scene: Phaser.Scene;
  private m!: Metrics;
  private lastUpdate: Parameters<Hud["update"]>[0] | null = null;
  private statKey = "";

  constructor(scene: Phaser.Scene, private settings: Settings, private onPause?: () => void, private onPhone?: () => void) {
    this.scene = scene;
    const fixed = this.fixed;

    this.statBg = fixed(scene.add.graphics());
    const stat = (origin: number) => fixed(scene.add.text(0, 20, "", {
      fontFamily: FONT, fontStyle: "600", color: CREAM,
    }).setOrigin(origin, 0).setShadow(0, 1, "#1b1410", 2, false, true), DEPTH + 100);
    this.left = stat(0);
    this.right = stat(1);

    this.promptBg = fixed(scene.add.graphics());
    this.prompt = fixed(scene.add.text(GAME_W / 2, GAME_H - 66, "", {
      fontFamily: FONT, fontStyle: "500", color: UI.ink, align: "center",
    }).setOrigin(0.5), DEPTH + 100);

    this.bar = fixed(scene.add.graphics(), DEPTH + 50);

    // Phiếu đơn ở góc trên phải để không che mặt khách và không bị bảng kẹp nhân che.
    this.ticketBg = fixed(scene.add.graphics());
    this.ticketText = fixed(scene.add.text(GAME_W - 26, 100, "", {
      fontFamily: FONT, fontStyle: "500", color: UI.ink, align: "right",
    }).setOrigin(1, 0), DEPTH + 100);

    this.feedBg = fixed(scene.add.graphics());
    this.feedText = fixed(scene.add.text(26, GAME_H - 100, "", {
      fontFamily: FONT, color: CREAM,
    }).setOrigin(0, 1), DEPTH + 100);

    this.helpBg = fixed(scene.add.graphics(), DEPTH + 90);
    this.help = fixed(scene.add.text(GAME_W / 2, GAME_H - 12, "", {
      fontFamily: FONT, color: CREAM, align: "center",
    }).setOrigin(0.5, 1), DEPTH + 100);

    this.carryBg = fixed(scene.add.graphics());

    // Pool cố định để tránh GC giật đúng giờ cao điểm.
    this.toastBg = fixed(scene.add.graphics(), DEPTH + 160);
    for (let i = 0; i < TOAST_MAX; i++) {
      const hit = fixed(scene.add.zone(0, 0, 10, 10).setOrigin(0, 0).setInteractive(), DEPTH + 170);
      const toast: Toast = {
        text: fixed(scene.add.text(GAME_W - TOAST_INSET, 0, "", {
          fontFamily: FONT, fontStyle: "500", color: UI.ink,
        }).setOrigin(0, 0).setVisible(false), DEPTH + 162),
        title: fixed(scene.add.text(GAME_W - TOAST_INSET, 0, "", {
          fontFamily: FONT, fontStyle: "700", color: "#6a7680",
        }).setOrigin(0, 0).setVisible(false), DEPTH + 162),
        icon: fixed(scene.add.image(0, 0, ntfKey("info")).setVisible(false), DEPTH + 162),
        hit,
        iconName: "info",
        born: -1,
        tone: "info",
        body: "",
        count: 0,
        life: TOAST_MIN_MS,
      };
      hit.input!.enabled = false;
      hit.on("pointerdown", () => this.dismiss(toast));
      this.toasts.push(toast);
    }

    this.saveDot = fixed(scene.add.circle(GAME_W - 14, GAME_H - 14, 4, 0xf4f1e8), DEPTH + 100).setAlpha(0);

    this.applyDevice();
    const off = onDeviceChange(() => this.applyDevice());
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
  }

  private fixed = <T extends Phaser.GameObjects.GameObject>(o: T, d = DEPTH) =>
    (o as any).setScrollFactor(0).setDepth(d) as T;

  /** `phoneCss` là cỡ chữ thật trên điện thoại, mặc định theo sàn chung. */
  private font(n: number, phoneCss?: number) {
    const ts = this.settings.textScale;
    return touchFont(Math.round(n * ts), phoneCss && isPhone() ? Math.round(phoneCss * ts) : undefined);
  }

  private fs(n: number, phoneCss?: number) {
    return `${this.font(n, phoneCss)}px`;
  }

  private spacing(n: number) {
    return Math.round(n * this.settings.textScale * (isTouch() ? this.m.k : 1));
  }

  private metrics(): Metrics {
    const touch = isTouch();
    if (!touch) {
      return {
        touch, small: false, k: 1, btnW: 48, btnH: 38, cy: 26,
        hands: GAME_W / 2 - 58, pause: GAME_W / 2, phone: GAME_W / 2 + 60, eye: GAME_W / 2 + 124,
        pauseY: 26, phoneY: 26, statL: 26, statR: GAME_W - 26, statY: 20,
        midL: 40, midR: GAME_W - 40,
        toastRight: GAME_W - TOAST_INSET, toastBottom: GAME_H, bodyW: TOAST_BODY_W,
        feedX: 26, feedY: GAME_H - 100, feedW: 380, helpY: GAME_H - 12,
      };
    }
    const k = Math.max(1, this.font(13) / 13);
    const btnW = touchSize(48), btnH = touchSize(38);
    const gap = Math.ceil(designFor(PILL_GAP));
    const edge = designFor(EDGE);
    const statY = edge + 10;
    const pillBottom = statY + Math.round(this.font(14) * 1.4) + 8;
    const colX = GAME_W - edge - btnW / 2;
    const pauseY = pillBottom + gap + btnH / 2;
    const midL = designFor(LEFT_RESERVE), midR = GAME_W - designFor(RIGHT_RESERVE);
    return {
      touch, small: isPhone(), k, btnW, btnH, cy: statY + Math.round(this.font(14) * 0.7),
      hands: 0, pause: colX, phone: colX, eye: 0,
      pauseY, phoneY: pauseY + btnH + gap,
      statL: edge + 14, statR: GAME_W - edge - 14, statY,
      midL, midR,
      toastRight: GAME_W - edge - btnW - designFor(12),
      toastBottom: GAME_H - designFor(CLUSTER_TOP),
      bodyW: Math.round(190 * k),
      feedX: designFor(EDGE), feedY: GAME_H - designFor(STICK_TOP), feedW: Math.min(380, Math.round(midR - midL - designFor(24))),
      helpY: GAME_H - designFor(8),
    };
  }

  /** Dựng lại mọi thứ phụ thuộc thiết bị: kích thước nút, cỡ chữ, vùng tránh cần và nút cảm ứng. */
  private applyDevice() {
    const m = this.m = this.metrics();
    const ts = this.settings.textScale;
    const fixed = this.fixed;

    for (const o of this.cluster) o.destroy();
    this.cluster = [];
    const pause = iconButton(this.scene, m.pause, m.pauseY, m.btnW, m.btnH, () => this.onPause?.());
    const kb = m.btnH / 38;
    pause.icon.setScale(kb);
    pause.icon.fillStyle(0xffffff, 0.8).fillRoundedRect(-8, -7, 5, 16, 1.5).fillRoundedRect(3, -7, 5, 16, 1.5);
    pause.icon.fillStyle(0x2a2420, 1).fillRoundedRect(-8, -8, 5, 16, 1.5).fillRoundedRect(3, -8, 5, 16, 1.5);
    fixed(pause, DEPTH + 200);

    const phone = iconButton(this.scene, m.phone, m.phoneY, m.btnW, m.btnH, () => this.onPhone?.());
    phone.setIconImage(ntfKey("phone"), 21 * kb);
    fixed(phone, DEPTH + 200);
    this.phoneBadgeGfx = fixed(this.scene.add.graphics(), DEPTH + 201);
    this.phoneBadge = fixed(this.scene.add.text(0, 0, "", {
      fontFamily: FONT, fontSize: `${touchFont(11)}px`, fontStyle: "800", color: "#ffffff",
    }).setOrigin(0.5).setShadow(0, 1, "#8f1f13", 0, false, true), DEPTH + 202);

    this.handsPlate = fixed(clayImage(this.scene, clayButton(this.scene, CLAY.cream, m.btnW, m.btnH, "up"), m.hands, m.cy, m.btnW, m.btnH), DEPTH);
    this.handsIcon = fixed(this.scene.add.image(m.hands, m.cy - 2, ICON.handClean), DEPTH + 1);
    this.handsKey = "";
    this.eyePlate = clayImage(this.scene, clayButton(this.scene, CLAY.cream, m.btnW, m.btnH, "up"), 0, 0, m.btnW, m.btnH);
    this.eyeIcon = this.scene.add.image(0, -2, ICON.eyeGlance);
    this.eyeGroup = fixed(this.scene.add.container(m.eye, m.cy, [this.eyePlate, this.eyeIcon]), DEPTH + 150).setVisible(false);
    this.cluster.push(pause, phone, this.phoneBadgeGfx, this.phoneBadge, this.handsPlate, this.handsIcon, this.eyeGroup);
    this.fitIcon(this.handsIcon);
    this.fitIcon(this.eyeIcon);
    this.paintPhone();

    const stat = (t: Phaser.GameObjects.Text, x: number) => t
      .setFontSize(this.fs(14, 13)).setLineSpacing(this.spacing(7)).setPosition(x, 20);
    stat(this.left, m.statL);
    stat(this.right, m.statR);
    this.left.y = this.right.y = m.statY;

    const mid = (m.midL + m.midR) / 2;
    const midW = m.midR - m.midL;
    this.prompt.setFontSize(this.fs(15)).setWordWrapWidth(m.touch ? midW - 34 : GAME_W - 80);
    this.help.setFontSize(this.fs(11)).setWordWrapWidth(m.touch ? midW - 24 : GAME_W - 80).setPosition(mid, m.helpY);
    this.ticketText.setFontSize(this.fs(13)).setLineSpacing(this.spacing(m.small ? 2 : 7))
      .setWordWrapWidth(m.touch ? Math.round(190 * m.k) : 320 * Math.min(ts, 1.5));
    this.feedText.setFontSize(this.fs(12)).setLineSpacing(this.spacing(6)).setWordWrapWidth(m.feedW);
    this.placeFeed();

    for (const t of this.toasts) {
      t.text.setFontSize(this.fs(13)).setWordWrapWidth(m.bodyW);
      t.title.setFontSize(this.fs(11));
    }
    this.carryKey = "";
    for (const o of [...this.carryIcons, ...this.carryNums]) o.destroy();
    this.carryIcons = [];
    this.carryNums = [];
    this.carryBg.clear();
    this.saveDot.setPosition(GAME_W - 14, GAME_H - 14);
    this.statKey = "";
    if (this.lastUpdate) this.update(this.lastUpdate);
  }

  private placeFeed() {
    const m = this.m;
    const docked = this.feedDocked && !m.touch;
    this.feedText.setPosition(docked ? 496 : m.feedX, docked ? GAME_H - 14 : m.feedY);
    // Điện thoại không có nhật ký: mọi dòng trong đó đã hiện ở bong bóng hoặc thẻ trò chuyện.
    this.feedText.setVisible(!(this.feedDocked && m.touch) && !m.small);
    this.redrawFeedBg();
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
    const { btnW, btnH, phone, phoneY } = this.m;
    const kb = btnH / 38;
    const x = phone + btnW / 2 - 4 * kb, y = phoneY - btnH / 2 + 4 * kb;
    this.phoneBadge.setPosition(x, y);
    if (this.unread > 0) {
      const r = (this.unread > 9 ? 10 : 9) * Math.max(1, kb * 0.9);
      g.fillStyle(0x3c1c0a, 0.35).fillCircle(x, y + 4, r);
      g.fillStyle(0x8f1f13, 1).fillCircle(x, y + 2, r);
      g.fillStyle(0xe0432f, 1).fillCircle(x, y, r);
      g.fillStyle(0xf77a64, 1).fillCircle(x, y - 1.5, r - 2.5);
      g.fillStyle(0xffffff, 0.55).fillEllipse(x - 2, y - 4.5, r * 0.9, r * 0.45);
    }
    this.phoneBadge.setText(this.unread > 9 ? "9+" : this.unread ? String(this.unread) : "");
  }

  /**
   * `all`: giữ mọi toast tới khi nhả (lớp tối đang mở). `noticeKey` khác null thì giữ tin `notice`; đổi khoá là nhả.
   * `keepOut`: ô toạ độ thiết kế toast phải né.
   */
  hold(all: boolean, noticeKey: string | null, keepOut: Hud["keepOut"], now: number) {
    this.keepOut = keepOut;
    if (all && !this.holdAll) {
      const live = this.toasts.filter((t) => t.born >= 0).sort((a, b) => a.born - b.born);
      this.held.unshift(...live.map((t) => ({
        text: t.body, tone: t.tone, opts: { icon: t.iconName, title: t.title.text || undefined },
      })));
      for (const t of live) this.dismiss(t);
    }
    const flushNotice = this.noticeKey !== null && noticeKey !== this.noticeKey;
    this.holdAll = all;
    this.noticeKey = noticeKey;
    if (all || !this.held.length) return;
    const out = this.held.filter((h) => !h.opts.notice || flushNotice || noticeKey === null);
    if (!out.length) return;
    this.held = this.held.filter((h) => !out.includes(h));
    for (const h of out) this.toast(h.text, h.tone, now, { ...h.opts, notice: false });
  }

  toast(text: string, tone: ToastTone = "info", now = this.scene.time.now, opts: ToastOpts = {}) {
    if (this.holdAll || (opts.notice && this.noticeKey !== null)) {
      if (!this.held.some((h) => h.text === text)) this.held.push({ text, tone, opts });
      return;
    }
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
    t.icon.setTexture(ntfKey(t.iconName)).setScale((this.m.small ? designFor(14) : TOAST_ICON_PX * this.m.k) / t.icon.height).setVisible(true);
    const chars = t.text.text.length;
    t.life = Math.min(TOAST_MAX_MS, Math.max(TOAST_MIN_MS, TOAST_BASE_MS + chars * TOAST_PER_CHAR_MS));
  }

  private dismiss(t: Toast) {
    t.born = -1; t.count = 0; t.body = "";
    t.text.setVisible(false); t.title.setVisible(false); t.icon.setVisible(false);
    t.hit.input!.enabled = false;
  }

  flashSaved() {
    this.scene.tweens.killTweensOf(this.saveDot);
    this.saveDot.setAlpha(0.85);
    this.scene.tweens.add({ targets: this.saveDot, alpha: 0, duration: 800, ease: "Sine.easeIn" });
  }

  get statsBottom() {
    return this.left.getBounds().bottom + 11;
  }

  /** Ô nút điện thoại theo toạ độ thiết kế. */
  get phoneRect() {
    if (!this.m.touch) return { x: GAME_W / 2 + 36, y: 8, w: 48, h: 36 };
    const { phone, phoneY, btnW, btnH } = this.m;
    return { x: phone - btnW / 2, y: phoneY - btnH / 2, w: btnW, h: btnH };
  }

  /** Bảng kẹp nhân mở thì dời nhật ký lời người sang phải để không chồng nhau; cảm ứng thì ẩn. */
  dockFeed(right: boolean) {
    if (this.feedDocked === right) return;
    this.feedDocked = right;
    this.placeFeed();
  }

  private redrawFeedBg() {
    this.feedBg.clear();
    if (!this.feed.length || !this.feedText.visible) return;
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
    this.held = [];
    for (const t of this.toasts) this.dismiss(t);
    this.toastBg.clear();
  }

  update(s: {
    day: number; clock: Clock; money: number; served: number;
    near: Station | null; hand: Hand; busy: { st: Station; ms: number } | null;
    frozen: boolean;
    ticket: { name: string; text: string; urgent: boolean } | null;
    prompt?: string | null;
    /** Bỏ dòng nhãn trạm vì nút cảm ứng đã nói việc cần làm. */
    quiet?: boolean;
    carry?: readonly Ingredient[] | null;
    hands?: "CLEAN" | "DIRTY";
    watch?: Watch;
    now?: number;
    work?: { frac: number } | null;
  }) {
    this.lastUpdate = s;
    const m = Math.floor(s.clock.minutes);
    const statKey = `${s.day}|${m}|${s.clock.band}|${s.money}|${s.served}|${this.m.touch}|${this.settings.noTimePressure}`;
    if (statKey !== this.statKey) {
      this.statKey = statKey;
      const hhmm = `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
      const slow = this.settings.noTimePressure ? " · thong thả" : "";
      const money = `${s.money.toLocaleString("vi-VN")}₫`;
      if (this.m.touch) {
        this.left.setText(`Ngày ${s.day} · ${hhmm}${slow}`);
        this.right.setText(money);
      } else {
        this.left.setText(`ngày ${s.day}\n${hhmm} · ${BAND_LABEL[s.clock.band]}${slow}`);
        this.right.setText(`${money}\nđã bán ${s.served} ổ`);
      }
    }
    this.drawStats();
    this.placeBadges();

    const show = !this.m.touch && s.day <= HELP_UNTIL_DAY && !this.feedDocked;
    if (show) this.help.setText(HELP_BY_DAY[Math.min(s.day, HELP_BY_DAY.length) - 1]);
    this.help.setVisible(show);
    this.helpBg.clear();
    if (show) {
      const hb = this.help.getBounds();
      paintGlass(this.helpBg, hb.x - 12, hb.y - 6, hb.width + 24, hb.height + 12, 10);
    }
    this.drawPrompt(s.quiet ? null : s.near, s.hand, s.frozen, s.prompt ?? null);
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
    const m = this.m, k = m.k;
    const live = this.toasts.filter((t) => t.born >= 0).sort((a, b) => b.born - a.born);
    const ticketBottom = this.ticketText.text ? this.ticketText.getBounds().bottom + 18 : 0;
    let y = m.touch ? Math.max(this.right.getBounds().bottom + 16, ticketBottom) : Math.max(TOAST_TOP, ticketBottom);
    const tile = m.small ? designFor(24) : TOAST_TILE_PX * k;
    for (const t of live) {
      const age = (now - t.born) / t.life;
      if (age >= 1) { this.dismiss(t); continue; }
      const alpha = age < TOAST_FADE_FROM ? 1 : 1 - (age - TOAST_FADE_FROM) / (1 - TOAST_FADE_FROM);
      const slide = reducedMotion ? 0 : Math.max(0, 1 - (now - t.born) / TOAST_SLIDE_MS) * TOAST_SLIDE_PX;
      const titled = !!t.title.text;
      const titleH = titled ? t.title.height + 1 : 0;
      const pad = m.small ? designFor(7) : 12, textX = pad + tile + (m.small ? designFor(6) : 10);
      const h = Math.max(tile + (m.small ? designFor(10) : 16), titleH + t.text.height + (m.small ? designFor(10) : 18));
      const w = Math.max(150, textX + Math.max(t.text.width, titled ? t.title.width : 0) + pad + 2);
      const ko = this.keepOut;
      if (ko && y < ko.y + ko.h && y + h > ko.y && m.toastRight + TOAST_SLIDE_PX > ko.x && m.toastRight - w < ko.x + ko.w) y = ko.y + ko.h + TOAST_GAP;
      const hidden = m.touch && y + h > m.toastBottom;
      for (const o of [t.text, t.icon]) o.setVisible(!hidden);
      t.title.setVisible(!hidden && titled);
      t.hit.input!.enabled = m.touch && !hidden;
      if (hidden) continue;
      const x1 = m.toastRight + slide, x0 = x1 - w, y0 = y;
      paintPaper(g, x0, y0, w, h, 16, 0xffffff, alpha * 0.97);
      const ty = y0 + (h - tile) / 2;
      g.fillStyle(TOAST_TILE[t.tone], alpha).fillRoundedRect(x0 + pad, ty, tile, tile, 10);
      t.icon.setPosition(x0 + pad + tile / 2, ty + tile / 2).setAlpha(alpha);
      const ty0 = m.small ? y0 + (h - titleH - t.text.height) / 2 : y0 + 9;
      t.title.setPosition(x0 + textX, ty0).setAlpha(alpha);
      t.text.setPosition(x0 + textX, ty0 + titleH).setAlpha(alpha);
      t.hit.setPosition(x0, y0).setSize(w, h);
      y += h + TOAST_GAP;
    }
  }

  /** Cảm ứng: biểu tượng tay và mắt nằm cạnh ô ngày giờ, tay chỉ hiện khi bẩn. */
  private badgePos() {
    const m = this.m;
    if (!m.touch) return { hx: m.hands, ex: m.eye, y: m.cy };
    const b = this.left.getBounds();
    const gap = Math.ceil(designFor(PILL_GAP));
    const hx = b.right + 14 + gap + m.btnW / 2;
    const ex = hx + (this.handsKey === "DIRTY" ? m.btnW + gap : 0);
    return { hx, ex, y: m.statY - 10 + (b.height + 18) / 2 };
  }

  private placeBadges() {
    const m = this.m;
    if (!m.touch) return;
    const { hx, ex, y } = this.badgePos();
    const o = clayOrigin(m.btnW, m.btnH);
    this.handsIcon.setPosition(hx, y - 2);
    this.handsPlate.setPosition(hx + o.x, y + o.y);
    this.eyeGroup.setPosition(ex, y);
  }

  get handsBox() {
    const { btnW, btnH } = this.m;
    const { hx, y } = this.badgePos();
    return { x: hx - btnW / 2, y: y - btnH / 2, w: btnW, h: btnH };
  }

  get eyeBox() {
    const { btnW, btnH } = this.m;
    return { x: this.eyeGroup.x - btnW / 2, y: this.eyeGroup.y - btnH / 2, w: btnW, h: btnH };
  }

  private fitIcon(img: Phaser.GameObjects.Image) {
    const { btnW, btnH } = this.m;
    img.setScale(ICON_H * (btnH / 38) / img.height);
    if (img.displayWidth > btnW - 12) img.setScale((btnW - 16) / img.width);
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
    this.eyePlate.setTexture(clayButton(this.scene, close ? CLAY.red : CLAY.cream, this.m.btnW, this.m.btnH, "up"));
    this.eyeIcon.setTexture(close ? ICON.eyeClose : ICON.eyeGlance);
    this.fitIcon(this.eyeIcon);
    this.eyeGroup.setAlpha(close ? 0.6 + 0.4 * beat : 1);
  }

  private drawHands(state: "CLEAN" | "DIRTY") {
    if (state === this.handsKey) return;
    this.handsKey = state;
    if (this.m.touch) {
      this.handsPlate.setVisible(state === "DIRTY");
      this.handsIcon.setVisible(state === "DIRTY");
    }
    this.handsIcon.setTexture(state === "DIRTY" ? ICON.handDirty : ICON.handClean);
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
    const m = this.m;
    const px = m.small ? designFor(8) : 12, py = m.small ? designFor(5) : 8;
    const top = this.right.getBounds().bottom + (m.small ? designFor(8) + py : 20);
    const x = m.small ? m.toastRight - designFor(6) : m.touch ? m.toastRight : GAME_W - 26;
    this.ticketText.setText(`${t.name}\n${t.text}`).setPosition(x, top);
    const b = this.ticketText.getBounds();
    this.ticketBg.fillStyle(UI.paper, 1).fillRoundedRect(b.x - px, b.y - py, b.width + px * 2, b.height + py * 2, 10);
    this.ticketBg.lineStyle(1.2, UI.line, 1).strokeRoundedRect(b.x - px, b.y - py, b.width + px * 2, b.height + py * 2, 10);
  }

  private drawCarry(dish: readonly Ingredient[] | null) {
    const key = dish ? dish.join(",") : "";
    if (key === this.carryKey) return;
    this.carryKey = key;
    this.carryBg.clear();
    for (const o of [...this.carryIcons, ...this.carryNums]) o.setVisible(false);
    if (!dish || !dish.length || !this.scene.textures.exists(FOOD.icon("pate"))) return;

    const m = this.m;
    const kc = m.touch ? Math.min(1.7, this.font(11) / 11) : 1;
    const counts = portionsOf(dish as Ingredient[]);
    const items = INGREDIENTS.filter((i) => counts.has(i.id));
    const step = 46 * kc, w = items.length * step + 16, half = 22 * kc;
    const y = m.touch ? this.left.getBounds().bottom + 24 + half : 76;
    const x0 = m.touch
      ? designFor(EDGE)
      : Math.max(16, Math.min(GAME_W / 2 - w / 2, this.ticketText.getBounds().left - 24 - w));
    this.carryBg.fillStyle(UI.paper, 1).fillRoundedRect(x0, y - half, w, half * 2, 10);
    items.forEach((ing, i) => {
      const icon = this.carryIcons[i] ??= this.scene.add.image(0, 0, FOOD.icon(ing.id)).setScrollFactor(0).setDepth(DEPTH + 100);
      const num = this.carryNums[i] ??= this.scene.add.text(0, 0, "", {
        fontFamily: FONT, fontSize: this.fs(11), fontStyle: "700", color: UI.ink,
      }).setOrigin(0, 1).setScrollFactor(0).setDepth(DEPTH + 101);
      const cx = x0 + 8 + step * i + step / 2 - 4;
      fitPhoto(icon.setTexture(FOOD.icon(ing.id)), 0.62 * kc).setPosition(cx, y).setVisible(true);
      num.setText(`×${counts.get(ing.id)}`).setPosition(cx + 11 * kc, y + 18 * kc).setVisible(true);
    });
  }

  private get stackTop() {
    return this.help.visible ? this.help.getBounds().top - 16 : GAME_H - (this.m.touch ? designFor(8) + 16 : 48);
  }

  private drawPrompt(st: Station | null, hand: Hand, frozen: boolean, override: string | null) {
    this.promptBg.clear();
    if (frozen || (!st && !override)) { this.prompt.setText(""); return; }

    const why = override || !st ? null : blockedReason(st, hand);
    const hold = !!st && st.holdMs > 0;
    const key = this.m.touch ? (hold ? "giữ nút" : "") : hold ? "giữ E" : "bấm E";
    const act = st?.verb === st?.name
      ? key
      : key ? `${key} để ${st?.verb}` : `${st?.verb}`;
    this.prompt.setText(override ?? (why
      ? `${st!.name} — ${why}`
      : act ? `${st!.name} — ${act}` : st!.name));

    const cx = (this.m.midL + this.m.midR) / 2;
    const w = this.prompt.width + 34, h = this.prompt.height + 16;
    const x = cx - w / 2, y = this.stackTop - h;
    this.prompt.setPosition(cx, y + h / 2);
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
    const cx = (this.m.midL + this.m.midR) / 2;
    const px = cx - W / 2, py = this.stackTop - promptH - 5 - (H + pad * 2);
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
