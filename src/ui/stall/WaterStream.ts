import Phaser from "phaser";
import { FX } from "../../art/fx";
import { ART_SS } from "../../art/photo";

const KEY = "water_stream";
/** Px texture, bằng đúng một chu kỳ lặp dọc để cuộn không thấy mối nối. */
const TEX_W = 6;
const TEX_H = 96;
const WIDTH = 2;
const FLOW_PX_PER_SEC = 70;
const FADE_PER_SEC = 9;
const ALPHA = 0.8;

/** Vệt sáng chạy dọc dòng nước, hai chu kỳ trên một tile. */
function paintTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(KEY)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const edge = [0.10, 0.55, 0.9, 0.9, 0.55, 0.10];
  for (let y = 0; y < TEX_H; y++) {
    const wave = 0.62 + 0.38 * Math.sin((y / (TEX_H / 2)) * Math.PI * 2);
    for (let x = 0; x < TEX_W; x++) {
      g.fillStyle(wave > 0.85 && (x === 2 || x === 3) ? 0xffffff : 0xcfeaff, edge[x] * wave);
      g.fillRect(x, y, 1, 1);
    }
  }
  g.generateTexture(KEY, TEX_W, TEX_H);
  g.destroy();
}

const SPLASH: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
  lifespan: { min: 260, max: 420 },
  speed: { min: 8, max: 22 },
  angle: { min: 225, max: 315 },
  gravityY: 40,
  scale: { start: 0.07, end: 0.2 },
  alpha: { start: 0.5, end: 0 },
  tint: 0xdff2ff,
  blendMode: "NORMAL",
  frequency: 80,
  quantity: 1,
  emitting: false,
  reserve: 8,
};

export class WaterStream {
  private stream: Phaser.GameObjects.TileSprite;
  private splash: Phaser.GameObjects.Particles.ParticleEmitter;
  private level = 0;

  /** `from` là đầu vòi, `to` là mặt nước trong chậu; toạ độ thế giới. */
  constructor(scene: Phaser.Scene, from: { x: number; y: number }, to: { x: number; y: number }, depth: number) {
    paintTexture(scene);
    const len = to.y - from.y;
    this.stream = scene.add.tileSprite(from.x, from.y, WIDTH * ART_SS, len * ART_SS, KEY)
      .setOrigin(0.5, 0)
      .setScale(1 / ART_SS)
      .setTileScale((WIDTH * ART_SS) / TEX_W, 1)
      .setDepth(depth)
      .setAlpha(0)
      .setVisible(false);
    this.splash = scene.add.particles(to.x, to.y, FX.puff, SPLASH).setDepth(depth);
  }

  update(dt: number, on: boolean, reducedMotion: boolean) {
    const target = on ? ALPHA : 0;
    this.level += Math.sign(target - this.level) * Math.min(Math.abs(target - this.level), FADE_PER_SEC * dt * ALPHA);
    this.stream.setAlpha(this.level).setVisible(this.level > 0.01);
    if (!reducedMotion) this.stream.tilePositionY -= FLOW_PX_PER_SEC * dt * ART_SS;
    if (on && !reducedMotion && !this.splash.emitting) this.splash.start();
    if ((!on || reducedMotion) && this.splash.emitting) this.splash.stop();
  }

  setPaused(paused: boolean) {
    if (paused) this.splash.pause(); else this.splash.resume();
  }

  destroy() {
    this.stream.destroy();
    this.splash.destroy();
  }
}
