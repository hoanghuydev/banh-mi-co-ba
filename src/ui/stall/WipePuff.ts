import Phaser from "phaser";
import { FX } from "../../art/fx";

/** Chậm, phun quạt ngửa, nhỏ giọt và `NORMAL` blend để ra bụi chứ không ra vụ nổ. */
const CFG: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
  lifespan: { min: 420, max: 640 },
  speed: { min: 12, max: 30 },
  angle: { min: 200, max: 340 },
  gravityY: -14,
  scale: { start: 0.2, end: 0.95, ease: "Quad.easeOut" },
  alpha: { values: [0, 0.55, 0.42, 0], interpolation: "linear" },
  rotate: { min: -18, max: 18 },
  tint: [0xf3f0e7, 0xe4d8c6, 0xc8b8a8],
  blendMode: "NORMAL",
  frequency: 70,
  quantity: 1,
  emitting: false,
  reserve: 24,
};

/** Px thiết kế, hẹp hơn `BOARD_W` để chừa lề. */
const SPREAD_W = 22;
const SPREAD_H = 6;

/** Viết tay vì `RandomZoneSource` đòi ghi vào điểm truyền vào; `check-gates` cấm `Math.random()` ngoài `src/core/`. */
const SPREAD: Phaser.Types.GameObjects.Particles.RandomZoneSource = {
  getRandomPoint(p) {
    p.x = Phaser.Math.FloatBetween(-SPREAD_W / 2, SPREAD_W / 2);
    p.y = Phaser.Math.FloatBetween(-SPREAD_H / 2, SPREAD_H / 2);
  },
};

export class WipePuff {
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene) {
    this.emitter = scene.add.particles(0, 0, FX.puff, {
      ...CFG,
      emitZone: { type: "random" as const, source: SPREAD },
    });
  }

  start(x: number, y: number, depth: number, ms: number, reducedMotion: boolean) {
    if (reducedMotion) return;
    this.emitter.setPosition(x, y);
    this.emitter.setDepth(depth);
    this.emitter.start(0, ms);
  }

  /** Emitter không phải tween nên `tweens.pauseAll()` không dừng nó. */
  setPaused(paused: boolean) {
    if (paused) this.emitter.pause(); else this.emitter.resume();
  }

  destroy() {
    this.emitter.destroy();
  }
}
