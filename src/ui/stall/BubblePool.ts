import Phaser from "phaser";
import { FONT, UI } from "../theme";

/** Pool bong bóng thoại dựng sẵn, không cấp phát mới trong scene để tránh GC spike giờ cao điểm. */
export const BUBBLE_POOL_SIZE = 8;
const FADE_IN = 120, FADE_OUT = 260;

export class Bubble {
  readonly root: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  owner: string | null = null;
  text = "";
  since = 0;
  /** ms theo đồng hồ scene. */
  private shownAt = 0;
  private hidingAt = -1;
  private targetAlpha = 1;

  constructor(private scene: Phaser.Scene, textScale: number) {
    const size = Math.round(12 * textScale);
    this.bg = scene.add.graphics();
    this.label = scene.add.text(0, 0, "", {
      fontFamily: FONT, fontSize: `${size}px`, color: UI.ink, align: "center",
      lineSpacing: Math.round(size * 0.7),
      wordWrap: { width: 190 * Math.min(textScale, 1.5) },
    }).setOrigin(0.5);
    this.root = scene.add.container(0, 0, [this.bg, this.label]).setVisible(false);
  }

  get hiding() { return this.hidingAt >= 0; }

  setText(text: string) {
    if (text === this.text && !this.hiding) return;
    const fresh = this.text === "" || this.hiding;
    this.text = text;
    this.hidingAt = -1;
    if (fresh) this.shownAt = this.scene.time.now;
    this.label.setText(text).setPosition(0, 0);
    const w = Math.max(this.label.width + 22, 60);
    const h = this.label.height + 14;
    this.bg.clear();
    this.bg.fillStyle(0x0d1216, 0.2);
    this.bg.fillRoundedRect(-w / 2 + 2, -h / 2 + 3, w, h, 9);
    this.bg.fillStyle(UI.paper, 1);
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, 9);
    // đuôi lệch sang vai, không chĩa thẳng xuống mặt
    this.bg.fillTriangle(-14, h / 2 - 1, -4, h / 2 - 1, -12, h / 2 + 9);
  }

  /** `y` là mép dưới; bong bóng mọc lên trên. */
  place(x: number, y: number, depth: number, scale = 1, reducedMotion = false) {
    const h = this.label.height + 14;
    const now = this.scene.time.now;
    let a = this.targetAlpha = scale < 1 ? 0.85 : 1;
    if (!reducedMotion) {
      if (this.hiding) a *= Math.max(0, 1 - (now - this.hidingAt) / FADE_OUT);
      else a *= Math.min(1, (now - this.shownAt) / FADE_IN);
    } else if (this.hiding) a = 0;
    this.root.setPosition(x, y - (h / 2) * scale).setScale(scale).setDepth(depth).setAlpha(a).setVisible(a > 0);
  }

  /** Trả true khi đã tắt hẳn. */
  fadeOut(reducedMotion: boolean): boolean {
    const now = this.scene.time.now;
    if (!this.hiding) this.hidingAt = now;
    if (reducedMotion || now - this.hidingAt >= FADE_OUT) { this.hide(); return true; }
    this.root.setAlpha(this.targetAlpha * Math.max(0, 1 - (now - this.hidingAt) / FADE_OUT));
    return false;
  }

  hide() {
    this.root.setVisible(false);
    this.owner = null;
    this.text = "";
    this.hidingAt = -1;
  }
}

export class BubblePool {
  private free: Bubble[] = [];
  private live: Bubble[] = [];
  private tick = 0;
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
      this.steals++;
      this.onSteal?.();
    }
    b.owner = owner;
    b.since = ++this.tick;
    this.live.push(b);
    return b;
  }

  release(owner: string, reducedMotion = false) {
    const i = this.live.findIndex((b) => b.owner === owner);
    if (i < 0) return;
    const b = this.live[i];
    if (!b.fadeOut(reducedMotion)) return;
    this.live.splice(i, 1);
    this.free.push(b);
  }

  get liveCount() { return this.live.length; }
}
