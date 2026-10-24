import Phaser from "phaser";
import { FONT, UI } from "../theme";
import { stackBubbles, type Box, type Slot } from "../../world/bubbleLayout";

/** Pool bong bóng thoại dựng sẵn, không cấp phát mới trong scene để tránh GC spike giờ cao điểm. */
export const BUBBLE_POOL_SIZE = 8;
const FADE_IN = 120, FADE_OUT = 260;
// Giây; đổi chỗ né thì trượt ~96% quãng trong 0,3 s.
const GLIDE_TAU = 0.1;

export class Bubble {
  readonly root: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private tail: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  owner: string | null = null;
  text = "";
  since = 0;
  /** ms theo đồng hồ scene. */
  private shownAt = 0;
  private hidingAt = -1;
  private w = 0;
  private h = 0;
  anchor = { x: 0, y: 0, scale: 1, depth: 0 };
  /** Độ lệch so với `anchor` đang vẽ; `null` là chưa đặt lần nào, frame đầu đặt thẳng. */
  off: { x: number; y: number } | null = null;
  slot: Slot | null = null;

  constructor(private scene: Phaser.Scene, textScale: number) {
    const size = Math.round(12 * textScale);
    this.bg = scene.add.graphics();
    this.tail = scene.add.graphics();
    this.label = scene.add.text(0, 0, "", {
      fontFamily: FONT, fontSize: `${size}px`, color: UI.ink, align: "center",
      lineSpacing: Math.round(size * 0.7),
      wordWrap: { width: 190 * Math.min(textScale, 1.5) },
    }).setOrigin(0.5);
    this.root = scene.add.container(0, 0, [this.bg, this.tail, this.label]).setVisible(false);
  }

  get hiding() { return this.hidingAt >= 0; }

  setText(text: string) {
    if (text === this.text && !this.hiding) return;
    const fresh = this.text === "" || this.hiding;
    this.text = text;
    this.hidingAt = -1;
    if (fresh) { this.shownAt = this.scene.time.now; this.off = null; this.slot = null; }
    this.label.setText(text).setPosition(0, 0);
    const w = this.w = Math.max(this.label.width + 22, 60);
    const h = this.h = this.label.height + 14;
    this.bg.clear();
    this.bg.fillStyle(0x0d1216, 0.2);
    this.bg.fillRoundedRect(-w / 2 + 2, -h / 2 + 3, w, h, 9);
    this.bg.fillStyle(UI.paper, 1);
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, 9);
    this.tail.clear();
    this.tail.fillStyle(UI.paper, 1);
    // Mũi lệch sang vai, không chĩa thẳng xuống mặt.
    this.tail.fillTriangle(-2, h / 2 - 1, 8, h / 2 - 1, 0, h / 2 + 9);
  }

  /** `y` là mép dưới thân bong bóng lúc không phải né ai, `x` là đỉnh đầu. */
  setAnchor(x: number, y: number, depth: number, scale = 1) {
    this.anchor = { x, y, scale, depth };
  }

  get size() { return { w: this.w * this.anchor.scale, h: this.h * this.anchor.scale }; }

  /** Chỉ trượt độ lệch so với đầu, nên đầu đi tới đâu bong bóng theo tới đó. */
  place(spot: Slot & { x: number; y: number }, dt: number, reducedMotion: boolean, order = 0) {
    const { scale, depth } = this.anchor;
    this.slot = { side: spot.side, level: spot.level };
    const want = { x: spot.x - this.anchor.x, y: spot.y - this.anchor.y };
    if (!this.off || reducedMotion) this.off = want;
    else {
      const k = 1 - Math.exp(-dt / GLIDE_TAU);
      this.off = { x: this.off.x + (want.x - this.off.x) * k, y: this.off.y + (want.y - this.off.y) * k };
    }
    const x = this.anchor.x + this.off.x;
    const now = this.scene.time.now;
    let a = scale < 1 ? 0.85 : 1;
    if (!reducedMotion) {
      if (this.hiding) a *= Math.max(0, 1 - (now - this.hidingAt) / FADE_OUT);
      else a *= Math.min(1, (now - this.shownAt) / FADE_IN);
    } else if (this.hiding) a = 0;
    // Hình đuôi rộng -2…8 quanh mũi, mũi nằm 12 px bên trái đỉnh đầu; giữ đáy đuôi trong phần thẳng của viền.
    this.tail.setX(Math.min(Math.max((this.anchor.x - x) / scale - 12, 11 - this.w / 2), this.w / 2 - 17));
    this.root.setPosition(x, this.anchor.y + this.off.y - (this.h / 2) * scale)
      .setScale(scale).setDepth(depth + order).setAlpha(a).setVisible(a > 0);
  }

  /** Trả true khi đã tắt hẳn. */
  fadeOut(reducedMotion: boolean): boolean {
    const now = this.scene.time.now;
    if (!this.hiding) this.hidingAt = now;
    if (reducedMotion || now - this.hidingAt >= FADE_OUT) { this.hide(); return true; }
    return false;
  }

  hide() {
    this.root.setVisible(false);
    this.owner = null;
    this.text = "";
    this.hidingAt = -1;
    this.off = null;
    this.slot = null;
  }
}

export class BubblePool {
  private free: Bubble[] = [];
  private live: Bubble[] = [];
  private tick = 0;
  private lastNow = -1;
  /** Số lần phải cướp bong bóng; > 0 là lỗi cân bằng lịch nói. */
  steals = 0;

  constructor(scene: Phaser.Scene, textScale: number, size = BUBBLE_POOL_SIZE, private onSteal?: () => void) {
    for (let i = 0; i < size; i++) this.free.push(new Bubble(scene, textScale));
  }

  acquire(owner: string): Bubble {
    const mine = this.live.find((b) => b.owner === owner);
    if (mine) return mine;
    let b = this.free.pop();
    if (!b) {
      b = this.live.reduce((a, x) => (x.since < a.since ? x : a));
      this.live.splice(this.live.indexOf(b), 1);
      // Không `hide()`: cướp nhau mỗi frame mà reset độ hiện dần thì cả đám tàng hình.
      b.off = null;
      b.slot = null;
      this.steals++;
      this.onSteal?.();
    }
    b.owner = owner;
    b.since = ++this.tick;
    this.live.push(b);
    return b;
  }

  /** Cả bong bóng đang mờ dần cũng phải bám theo người nói. */
  anchor(owner: string, x: number, y: number, depth: number, scale = 1) {
    this.live.find((b) => b.owner === owner)?.setAnchor(x, y, depth, scale);
  }

  release(owner: string, reducedMotion = false) {
    const i = this.live.findIndex((b) => b.owner === owner);
    if (i < 0) return;
    const b = this.live[i];
    if (!b.fadeOut(reducedMotion)) return;
    this.live.splice(i, 1);
    this.free.push(b);
  }

  /** Gọi sau khi camera đã cuộn xong frame này, không thì kẹp vào khung cũ. */
  layout(view: { left: number; right: number; top: number }, keepOut: readonly Box[], now: number, reducedMotion: boolean) {
    const dt = this.lastNow < 0 ? 0 : Math.min(0.05, (now - this.lastNow) / 1000);
    this.lastNow = now;
    // `live` đã theo thứ tự nói trước vì `acquire` chỉ đẩy vào cuối; buộc phải chồng thì câu mới nhất nằm trên.
    const spots = stackBubbles(this.live.map((b) => ({ x: b.anchor.x, y: b.anchor.y, ...b.size, prev: b.slot })), view, keepOut);
    this.live.forEach((b, i) => b.place(spots[i], dt, reducedMotion, i * 1e-3));
  }

  get liveCount() { return this.live.length; }
}
