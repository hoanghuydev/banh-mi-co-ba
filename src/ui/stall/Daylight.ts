import Phaser from "phaser";
import { setCast } from "../../art/fx";
import { TW, toScreen } from "../../world/iso";
import { SKY_FROM_Y, SUN_BAND as BAND, WORLD_H } from "../../world/map";
import { OVERCAST, sunAt, type Sun } from "../../world/daylight";

const TONE_DEPTH = 6_900_000;
const PATCH_DEPTH = -999_999;
const VIEW_PAD = 24;
const STEP_MIN = 4;
const VIGNETTE = "vignette";

const LEAN = -0.4;
const FEATHER = 16;

function buildVignette(scene: Phaser.Scene) {
  if (scene.textures.exists(VIGNETTE)) return;
  const tex = scene.textures.createCanvas(VIGNETTE, 256, 144)!;
  const ctx = tex.getContext();
  const g = ctx.createRadialGradient(128, 72, 50, 128, 72, 160);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.65, "rgba(238,240,244,1)");
  g.addColorStop(1, "rgba(190,196,208,1)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 144);
  tex.refresh();
}

/** Vạt nắng mềm nướng một lần: mép nhoè, nhạt dần về phía xa mái hiên. */
function buildPatch(scene: Phaser.Scene, key: string, ground: Phaser.Geom.Rectangle) {
  const w = Math.ceil(ground.width), h = Math.ceil(ground.height);
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h)!;
  const ctx = tex.getContext();

  const at = (tx: number, ty: number) => {
    const { sx, sy } = toScreen(tx, ty);
    return { x: sx - ground.x + LEAN * (sy - toScreen(0, SKY_FROM_Y).sy), y: sy - ground.y };
  };
  const pts = [
    at(SKY_FROM_Y + BAND.lo, SKY_FROM_Y), at(SKY_FROM_Y + BAND.hi, SKY_FROM_Y),
    at(WORLD_H + BAND.hi, WORLD_H), at(WORLD_H + BAND.lo, WORLD_H),
  ];

  // Vẽ polygon ngoài khung rồi chỉ giữ cái bóng của nó: shadowBlur là cách nhoè mép có ở mọi trình duyệt.
  const OFF = w + FEATHER * 4;
  ctx.save();
  ctx.shadowColor = "#fff";
  ctx.shadowBlur = FEATHER;
  ctx.shadowOffsetX = OFF;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x - OFF, p.y) : ctx.moveTo(p.x - OFF, p.y)));
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const top = pts[0].y, bottom = pts[2].y;
  const fall = ctx.createLinearGradient(0, top, 0, bottom);
  fall.addColorStop(0, "rgba(255,255,255,1)");
  fall.addColorStop(1, "rgba(255,255,255,0.45)");
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = fall;
  ctx.fillRect(0, 0, w, h);
  tex.refresh();
}

export class Daylight {
  private readonly tone: Phaser.GameObjects.Rectangle;
  private readonly vignette: Phaser.GameObjects.Image;
  private readonly patch: Phaser.GameObjects.Image | null;
  private readonly view = new Phaser.Geom.Rectangle();
  private readonly patchX: number;
  private step = -1;
  private sun: Sun;

  constructor(scene: Phaser.Scene, ground: Phaser.Geom.Rectangle, private readonly overcast: boolean) {
    this.patchX = ground.x;
    this.sun = overcast ? OVERCAST : sunAt(0);
    buildVignette(scene);
    this.tone = scene.add.rectangle(0, 0, 1, 1, 0xffffff).setOrigin(0, 0)
      .setDepth(TONE_DEPTH).setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.vignette = scene.add.image(0, 0, VIGNETTE).setOrigin(0, 0)
      .setDepth(TONE_DEPTH + 1).setBlendMode(Phaser.BlendModes.MULTIPLY);

    if (overcast) {
      this.patch = null;
    } else {
      buildPatch(scene, "sunpatch", ground);
      this.patch = scene.add.image(ground.x, ground.y, "sunpatch").setOrigin(0, 0)
        .setDepth(PATCH_DEPTH).setBlendMode(Phaser.BlendModes.ADD);
    }
    setCast(this.sun.dirX, this.sun.dirY, this.sun.stretch);
  }

  /** Trả `true` khi hướng nắng đổi, để cảnh đặt lại bóng đạo cụ. */
  update(minutes: number, view: Phaser.Geom.Rectangle): boolean {
    if (view.x !== this.view.x || view.y !== this.view.y
      || view.width !== this.view.width || view.height !== this.view.height) {
      this.view.setTo(view.x, view.y, view.width, view.height);
      const x = view.x - VIEW_PAD, y = view.y - VIEW_PAD;
      const w = view.width + VIEW_PAD * 2, h = view.height + VIEW_PAD * 2;
      this.tone.setPosition(x, y).setSize(w, h);
      this.vignette.setPosition(x, y).setDisplaySize(w, h);
    }

    const step = Math.floor(minutes / STEP_MIN);
    if (step === this.step) return false;
    this.step = step;
    if (!this.overcast) this.sun = sunAt(minutes);
    const s = this.sun;
    this.tone.setFillStyle(s.tone);
    this.patch?.setX(this.patchX + s.patchShift * (TW / 2))
      .setAlpha(s.patchAlpha).setTint(s.patchTint);
    setCast(s.dirX, s.dirY, s.stretch);
    return true;
  }

  destroy() {
    this.tone.destroy();
    this.vignette.destroy();
    this.patch?.destroy();
  }
}
