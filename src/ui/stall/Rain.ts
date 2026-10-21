import Phaser from "phaser";
import { DROP_H, FX } from "../../art/fx";
import { PAL } from "../../art/palette";
import { BASE, footY } from "../../art/canvas";
import { TH, TW, toScreen } from "../../world/iso";
import { SHOPFRONT_X, SKY_FROM_Y } from "../../world/map";
import {
  LAST_SKY_ROW, ROOF_PX, rainDensity, rainGrade, spawnSx, windAt,
  type RainDensity,
} from "../../world/rain";
import type { Weather } from "../../core/types";

// Độ dài vệt = tốc độ × EXPOSURE.
const EXPOSURE = 0.115;
// Đổi tốc độ thì BASE_DENSITY bên world/rain.ts phải đổi cùng tỉ lệ (số hạt sống = mật độ × quãng ÷ tốc độ).
const SPEED_MIN = 400, SPEED_MAX = 640;

const DRIP_SPEED = 300;
const DRIP_LEN = 15;
const DRIP_ROW = SKY_FROM_Y + 0.08;

// Cứ 3 giọt mới bắn 1 vòng nước, vì vòng nước sống lâu và chiếm quá nửa số hạt.
const SPLASH_EVERY = 3;

const RIPPLE_FROM = 0.12, RIPPLE_TO = 0.62;
const RIPPLE_MS = 320;

// Vòng nước dưới người, giọt trên đạo cụ, lớp phủ trên cả hai nhưng dưới chữ và mặt người.
const SPLASH_DEPTH = -900_000;
const DROP_DEPTH = 1_000_000;
const GRADE_DEPTH = 7_000_000;

// Lưới an toàn cho frame kẹt; mưa rào bình thường chỉ ~55.
const MAX_DROPS = 110;

const GRADE_PAD = 24;

const CLOUD_MS = 9_100, CLOUD_AMP = 0.035;

const TINT_STEPS = 8;

// Hằng số đường mặt đất ở hàng mép mái, đã cộng footY.
const GROUND_C = SKY_FROM_Y * TH + TH / 2 + BASE;
const EAVE_C = GROUND_C - ROOF_PX;
const SKY_BAND = TH * (LAST_SKY_ROW - SKY_FROM_Y);

const rnd = Phaser.Math.FloatBetween;

type Pending = { tx: number; ty: number; life: number; len: number; tint: number; wide: number };

export class Rain {
  private readonly drops: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly splash: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly veil: Phaser.GameObjects.Rectangle;
  private readonly tints: number[];

  private view = new Phaser.Geom.Rectangle(0, 0, 0, 0);
  private lastView = new Phaser.Geom.Rectangle(-1, -1, -1, -1);
  private pending: Pending = { tx: 0, ty: 0, life: 300, len: 24, tint: 0xffffff, wide: 0.5 };
  // Phần hạt lẻ còn nợ từ frame trước, không giữ thì mật độ phụ thuộc fps.
  private owedDrops = 0;
  private owedDrips = 0;
  private splashTurn = 0;
  private lean = 0;
  private spin = 0;
  private density: RainDensity;
  private reduced: boolean;

  static for(scene: Phaser.Scene, weather: Weather, reducedMotion: boolean): Rain | null {
    const g = rainGrade(weather);
    return g !== null && rainDensity(weather, reducedMotion) ? new Rain(scene, weather, g, reducedMotion) : null;
  }

  private constructor(
    scene: Phaser.Scene,
    private readonly weather: Weather,
    private readonly grade: number,
    reducedMotion: boolean,
  ) {
    this.density = rainDensity(weather, reducedMotion)!;
    this.reduced = reducedMotion;

    const far = Phaser.Display.Color.IntegerToColor(PAL.rain.ambient);
    const near = Phaser.Display.Color.IntegerToColor(PAL.rain.highlight);
    this.tints = Array.from({ length: TINT_STEPS }, (_, i) => {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(far, near, TINT_STEPS - 1, i);
      return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
    });

    // moveTo thay speed + angle để hạt chết đúng điểm đã định, deathCallback đặt vòng nước chính xác.
    const dropCfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      lifespan: () => this.pending.life,
      moveToX: () => this.pending.tx,
      moveToY: () => this.pending.ty - this.pending.len / 2,
      scaleX: () => this.pending.wide,
      scaleY: () => this.pending.len / DROP_H,
      rotate: () => this.spin,
      tint: () => this.pending.tint,
      alpha: { values: [0, 0.72, 0.88, 0.88], interpolation: "linear" },
      // ADD làm vệt mưa thành sợi neon.
      blendMode: "NORMAL",
      emitting: false,
      deathCallback: (p: Phaser.GameObjects.Particles.Particle) => this.splashAt(p),
      reserve: 96,
      maxAliveParticles: MAX_DROPS,
    };

    // Một emitter chung cho mưa và giọt mái để renderer gộp được.
    this.drops = scene.add.particles(0, 0, FX.drop, dropCfg).setDepth(DROP_DEPTH);

    this.splash = scene.add.particles(0, 0, FX.ripple, {
      lifespan: RIPPLE_MS,
      speed: 0,
      scale: { start: RIPPLE_FROM, end: RIPPLE_TO, ease: "Quad.easeOut" },
      alpha: { values: [0, 0.7, 0.34, 0], interpolation: "linear" },
      tint: PAL.rain.highlight,
      blendMode: "NORMAL",
      emitting: false,
      reserve: 48,
    }).setDepth(SPLASH_DEPTH);

    this.veil = scene.add.rectangle(0, 0, 1, 1, PAL.rain.grade)
      .setOrigin(0, 0).setDepth(GRADE_DEPTH).setAlpha(grade);
  }

  /** `dt` = 0 là đang pause. */
  draw(view: Phaser.Geom.Rectangle, dt: number, timeMs: number, reducedMotion: boolean) {
    if (reducedMotion !== this.reduced) this.setReduced(reducedMotion);
    this.view.setTo(view.x, view.y, view.width, view.height);

    // worldView trễ một frame nên tấm phủ cần GRADE_PAD, không thì hở vạch sáng ở mép.
    if (view.x !== this.lastView.x || view.y !== this.lastView.y
      || view.width !== this.lastView.width || view.height !== this.lastView.height) {
      this.lastView.setTo(view.x, view.y, view.width, view.height);
      this.veil.setPosition(view.x - GRADE_PAD, view.y - GRADE_PAD)
        .setSize(view.width + GRADE_PAD * 2, view.height + GRADE_PAD * 2);
    }
    this.veil.setAlpha(this.grade + (this.reduced ? 0 : Math.sin(timeMs / CLOUD_MS) * CLOUD_AMP));

    const deg = windAt(this.density, timeMs);
    this.lean = Math.tan(Phaser.Math.DegToRad(deg));
    // Texture vệt thẳng đứng nên quay âm theo góc gió mới khớp chiều rơi.
    this.spin = -deg;

    if (dt <= 0) return;
    this.owedDrops += dt * this.density.drops;
    this.owedDrips += dt * this.density.drips;
    // Quá trần thì bỏ nợ, không dồn hạt vào frame đang kẹt.
    if (this.drops.getAliveParticleCount() > MAX_DROPS) { this.owedDrops = 0; this.owedDrips = 0; return; }
    while (this.owedDrops >= 1) { this.owedDrops -= 1; this.fall(); }
    while (this.owedDrips >= 1) { this.owedDrips -= 1; this.drip(); }
  }

  private setReduced(reducedMotion: boolean) {
    this.reduced = reducedMotion;
    this.density = rainDensity(this.weather, reducedMotion)!;
  }

  /** Thả hạt vào giao của khung hình và dải ngoài trời. */
  private fall() {
    const v = this.view;
    const k = TH / TW;
    const lo = Math.max(v.left, (v.top - GROUND_C - SKY_BAND) / k);
    const hi = Math.min(v.right, (v.bottom - GROUND_C) / k);
    if (hi <= lo) return;                              // camera đang nhìn hẳn vào trong quán

    const tx = rnd(lo, hi);
    const top = tx * k + GROUND_C;                     // mặt đất ở hàng mép mái, cột này
    const ty = rnd(Math.max(v.top, top), Math.min(v.bottom, top + SKY_BAND));
    // 0 = sát hiên, 1 = sáu hàng ngoài kia (cỡ khúc trời lọt khung ở zoom hiện tại).
    const depth = Phaser.Math.Clamp((ty - top) / (TH * 6), 0, 1);
    const speed = rnd(SPEED_MIN, SPEED_MAX);
    this.emitDrop(tx, ty, speed, depth,
      speed * EXPOSURE, 0.55 + 0.4 * ((speed - SPEED_MIN) / (SPEED_MAX - SPEED_MIN)));
  }

  private drip() {
    const wx = rnd(SHOPFRONT_X.lo, SHOPFRONT_X.hi);
    const s = toScreen(wx, DRIP_ROW);
    const ty = footY(s.sy);
    if (!this.view.contains(s.sx, ty)) return;         // mặt tiền đang ngoài khung
    this.emitDrop(s.sx, ty, DRIP_SPEED, 1, DRIP_LEN, 0.9);
  }

  /** Tính chỗ thả từ chỗ rơi trúng rồi ghi vào `pending` cho các callback của emitter đọc. */
  private emitDrop(tx: number, ty: number, speed: number, depth: number, len: number, wide: number) {
    const sx = spawnSx(tx, ty, this.lean, EAVE_C);
    const sy = sx * (TH / TW) + EAVE_C;
    const dist = Math.hypot(tx - sx, ty - sy);
    const p = this.pending;
    p.tx = tx; p.ty = ty; p.len = len; p.wide = wide;
    p.life = (dist / speed) * 1000;
    p.tint = this.tints[Math.round(depth * (TINT_STEPS - 1))];
    this.drops.emitParticleAt(sx, sy);
  }

  /** Origin hạt nằm giữa vệt nên phải cộng nửa vệt để ra đầu giọt. */
  private splashAt(p: Phaser.GameObjects.Particles.Particle) {
    if (++this.splashTurn < SPLASH_EVERY) return;
    this.splashTurn = 0;
    this.splash.emitParticleAt(p.x, p.y + (p.scaleY * DROP_H) / 2);
  }

  /** `tweens.pauseAll()` không dừng emitter nên phải gọi riêng. */
  setPaused(paused: boolean) {
    for (const e of [this.drops, this.splash]) {
      if (paused) e.pause(); else e.resume();
    }
  }

  destroy() {
    this.drops.destroy();
    this.splash.destroy();
    this.veil.destroy();
  }
}
