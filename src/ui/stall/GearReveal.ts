import Phaser from "phaser";
import { FX } from "../../art/fx";
import { sfx } from "../../audio/sfx";
import { GAME_W, GAME_H } from "../../core/config";
import { isTouch } from "../../core/device";
import { EQUIP, type EquipId } from "../../sim/equipment";
import type { StallCamera } from "../../world/camera";
import { FONT, UI, touchFont } from "../theme";

/** Hình của một món đồ nghề trong cảnh; `at` là chân vật, dùng khi món chỉ có nét vẽ. */
export type GearArt = { obj: Phaser.GameObjects.GameObject; at?: { x: number; y: number } };

type Part = { obj: Phaser.GameObjects.Image; sx: number; sy: number; alpha: number };
type Item = { id: EquipId; parts: Part[]; marks: Phaser.GameObjects.Graphics[]; x: number; y: number; foot: number; depth: number };

const PAN_MS = 600;
const ZOOM_MUL = 1.3;
const POP_MS = 350;
/** Đỉnh ~1,15 của `Back.Out`. */
const POP_OVERSHOOT = 2.2;
const FADE_MS = 300;
const CARD_MS = 1500;
const CARD_PER_LINE_MS = 500;
const DEPTH = 9_000_000 + 400;
const PAPER = 0xffffff;

/** Lớp sáng phủ (`PropSheen`, lốm đốm nắng) nằm trùng chân ảnh, cao hơn chút depth. */
function overlaysOf(scene: Phaser.Scene, img: Phaser.GameObjects.Image) {
  return scene.children.list.filter((o): o is Phaser.GameObjects.Image =>
    o instanceof Phaser.GameObjects.Image && o !== img && o.blendMode !== Phaser.BlendModes.NORMAL
    && Math.abs(o.x - img.x) < 0.01 && Math.abs(o.y - img.y) < 0.01 && o.depth > img.depth && o.depth < img.depth + 0.5);
}

/** Sáng hôm giao đồ: lia tới từng món, món bật ra, thẻ tên + lợi ích, rồi trả máy về người chơi. */
export class GearReveal {
  active = true;
  private items: Item[];
  private puff: Phaser.GameObjects.Particles.ParticleEmitter;
  private shield: Phaser.GameObjects.Zone;
  private card: Phaser.GameObjects.GameObject[] = [];
  private skipCard: (() => void) | null = null;

  constructor(private scene: Phaser.Scene, private cam: StallCamera, arts: [EquipId, GearArt[]][], private reduced: boolean) {
    this.items = arts.map(([id, list]) => this.item(id, list));
    this.puff = scene.add.particles(0, 0, FX.puff, {
      lifespan: { min: 380, max: 620 },
      speed: { min: 40, max: 90 },
      angle: { min: 190, max: 350 },
      gravityY: 40,
      scale: { start: 0.35, end: 1.1, ease: "Quad.easeOut" },
      alpha: { start: 0.6, end: 0 },
      tint: [0xf3f0e7, 0xe4d8c6, 0xc8b8a8],
      emitting: false,
    });
    this.shield = scene.add.zone(0, 0, GAME_W, GAME_H).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH - 1).setInteractive();
    this.shield.on("pointerdown", () => this.skip());
  }

  skip() { this.skipCard?.(); }

  async run() {
    for (const it of this.items) {
      await this.cam.focus(it.x, it.y, this.reduced ? 1 : ZOOM_MUL, this.reduced ? 0 : PAN_MS);
      sfx.play(this.scene, "ui_do_moi");
      await (this.reduced ? this.fadeIn(it) : this.pop(it));
      await this.showCard(it.id);
    }
    await this.cam.release(this.reduced ? 0 : PAN_MS);
    this.destroy();
  }

  destroy() {
    this.active = false;
    this.skipCard = null;
    for (const it of this.items) {
      for (const p of it.parts) p.obj.setVisible(true).setScale(p.sx, p.sy).setAlpha(p.alpha);
      for (const g of it.marks) g.setVisible(true).setAlpha(1);
    }
    for (const o of this.card) o.destroy();
    this.card = [];
    this.puff.destroy();
    this.shield.destroy();
  }

  private item(id: EquipId, list: GearArt[]): Item {
    const parts: Part[] = [], marks: Phaser.GameObjects.Graphics[] = [];
    let box: Phaser.Geom.Rectangle | null = null, at: { x: number; y: number } | undefined;
    for (const { obj, at: a } of list) {
      at ??= a;
      if (obj instanceof Phaser.GameObjects.Image) {
        for (const o of [obj, ...overlaysOf(this.scene, obj)]) parts.push({ obj: o, sx: o.scaleX, sy: o.scaleY, alpha: o.alpha });
        const b = obj.getBounds();
        box = box ? Phaser.Geom.Rectangle.Union(box, b) : b;
      } else if (obj instanceof Phaser.GameObjects.Graphics) marks.push(obj);
    }
    for (const p of parts) p.obj.setVisible(false);
    for (const g of marks) g.setVisible(false);
    const x = box ? box.centerX : at?.x ?? 0, y = box ? box.centerY : (at?.y ?? 0) - 20;
    const depth = Math.max(0, ...parts.map((p) => p.obj.depth), ...marks.map((g) => g.depth));
    return { id, parts, marks, x, y, foot: box ? box.bottom : at?.y ?? y, depth };
  }

  private pop(it: Item) {
    for (const p of it.parts) p.obj.setVisible(true).setScale(0);
    this.puff.setDepth(it.depth + 1).explode(10, it.x, it.foot - 4);
    this.fade(it.marks, POP_MS);
    return new Promise<void>((done) => this.scene.tweens.addCounter({
      from: 0, to: 1, duration: POP_MS,
      ease: (t: number) => Phaser.Math.Easing.Back.Out(t, POP_OVERSHOOT),
      onUpdate: (tw) => { const k = tw.getValue() ?? 1; for (const p of it.parts) p.obj.setScale(p.sx * k, p.sy * k); },
      onComplete: () => done(),
    }));
  }

  private fadeIn(it: Item) {
    for (const p of it.parts) p.obj.setVisible(true).setAlpha(0);
    this.fade(it.marks, FADE_MS);
    return new Promise<void>((done) => this.scene.tweens.addCounter({
      from: 0, to: 1, duration: FADE_MS,
      onUpdate: (tw) => { const k = tw.getValue() ?? 1; for (const p of it.parts) p.obj.setAlpha(p.alpha * k); },
      onComplete: () => done(),
    }));
  }

  private fade(marks: Phaser.GameObjects.Graphics[], ms: number) {
    for (const g of marks) g.setVisible(true).setAlpha(0);
    if (marks.length) this.scene.tweens.add({ targets: marks, alpha: 1, duration: ms });
  }

  private showCard(id: EquipId) {
    const { scene } = this;
    const d = EQUIP[id];
    const touch = isTouch();
    const pad = touch ? 14 : 16, gap = 4;
    const name = scene.add.text(0, 0, d.name, {
      fontFamily: FONT, fontStyle: "700", fontSize: `${touchFont(17)}px`, color: UI.ink,
    }).setOrigin(0.5, 0);
    const body = scene.add.text(0, 0, d.gain.join("\n"), {
      fontFamily: FONT, fontStyle: "500", fontSize: `${touchFont(14)}px`, color: UI.good, align: "center", lineSpacing: 3,
      wordWrap: { width: GAME_W * 0.6 },
    }).setOrigin(0.5, 0);
    const w = Math.max(220, name.width, body.width) + pad * 2;
    const h = pad + name.height + gap + body.height + pad;
    const x0 = (GAME_W - w) / 2, y0 = GAME_H - h - (touch ? 28 : 64);
    const bg = scene.add.graphics();
    bg.fillStyle(0x0d1216, 0.1).fillRoundedRect(x0 - 2, y0 + 1, w + 4, h + 7, 18);
    bg.fillStyle(0x0d1216, 0.16).fillRoundedRect(x0 - 0.5, y0 + 1.5, w + 1, h + 3, 17);
    bg.fillStyle(PAPER, 0.97).fillRoundedRect(x0, y0, w, h, 16);
    name.setPosition(GAME_W / 2, y0 + pad);
    body.setPosition(GAME_W / 2, y0 + pad + name.height + gap);
    this.card = [bg, name, body];
    for (const o of this.card) (o as unknown as Phaser.GameObjects.Components.ScrollFactor).setScrollFactor(0);
    bg.setDepth(DEPTH);
    name.setDepth(DEPTH + 1);
    body.setDepth(DEPTH + 1);
    if (!this.reduced) {
      for (const o of this.card) (o as Phaser.GameObjects.Text).setAlpha(0);
      scene.tweens.add({ targets: this.card, alpha: 1, duration: 160 });
    }
    return new Promise<void>((done) => {
      const timer = scene.time.delayedCall(CARD_MS + CARD_PER_LINE_MS * Math.max(0, d.gain.length - 1), () => this.skip());
      this.skipCard = () => {
        this.skipCard = null;
        timer.remove();
        for (const o of this.card) o.destroy();
        this.card = [];
        done();
      };
    });
  }
}
