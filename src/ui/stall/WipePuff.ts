import Phaser from "phaser";
import { FX } from "../../art/fx";

/**
 * Bụi bốc lên lúc lau thớt — phản hồi DUY NHẤT nhìn thấy được ở ngay cái thớt, chỗ mắt người chơi
 * đang dán vào (thanh tiến trình và dòng toast đều nằm xa).
 *
 * Ba thứ giữ cho nó ra chất BỤI chứ không ra vụ nổ, cùng một texture tròn: tốc độ chậm (12–30 px/s
 * — bụi bị GẠT ra, không bị BẮN ra) · phun theo QUẠT ngửa lên chứ không toả tròn · nở ra RỒI mờ đi.
 * ⚠️ `blendMode` phải NORMAL — ADD nghĩa là hạt tự phát sáng, và bụi thì che sáng.
 *
 * Nhỏ giọt 1 hạt mỗi 70 ms chứ không nổ một phát: một chùm sinh cùng frame đọc ra là MỘT biến cố,
 * nhỏ giọt đều mới ra một việc đang được làm.
 */
const CFG: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
  lifespan: { min: 420, max: 640 },
  speed: { min: 12, max: 30 },
  angle: { min: 200, max: 340 },
  gravityY: -14,
  scale: { start: 0.2, end: 0.95, ease: "Quad.easeOut" },
  // Hiện lên rồi tắt — `values` cho đường cong nhiều chặng, `start`/`end` chỉ đi
  // được một chiều nên không tả được nhịp "bật lên rồi mới nhạt dần".
  alpha: { values: [0, 0.55, 0.42, 0], interpolation: "linear" },
  rotate: { min: -18, max: 18 },
  // Xám ấm bạc màu — `#C8B8A8` là đúng tông "lớp bụi lơ lửng" của P5-02 §2.1.4.
  tint: [0xf3f0e7, 0xe4d8c6, 0xc8b8a8],
  blendMode: "NORMAL",
  frequency: 70,
  quantity: 1,
  emitting: false,
  // Cấp phát sẵn, y như `BubblePool` và `MoneyPops`: giờ cao điểm là lúc người chơi
  // lau thớt nhiều nhất, mà cũng là lúc không được phép khựng một frame nào.
  reserve: 24,
};

/** Bề ngang vạt bụi, tính bằng px thiết kế — hẹp hơn `BOARD_W = 28` một chút để chừa lề. */
const SPREAD_W = 22;
const SPREAD_H = 6;

/**
 * Rải đều dọc mặt thớt thay vì phun từ một điểm — một điểm đọc ra là "rò rỉ".
 *
 * Viết tay thay vì đưa thẳng `Phaser.Geom.Rectangle` vào: `getRandomPoint` TRẢ VỀ điểm còn
 * `RandomZoneSource` đòi hàm GHI vào điểm truyền vào. `FloatBetween` chứ không `Math.random` —
 * cổng `check-gates` cấm `Math.random()` ngoài `src/core/`.
 */
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
      // `as const` cho `type`: typing của Phaser đòi đúng literal `"random"`, còn suy ra
      // từ object literal thì nó ra `string` và cả `emitZone` trượt kiểu.
      emitZone: { type: "random" as const, source: SPREAD },
    });
  }

  /**
   * Tự tắt sau `ms` nên không có đường nào để bụi bốc mãi sau khi người chơi đã đi chỗ khác.
   *
   * `reducedMotion` thì KHÔNG bốc hạt nào (khác khói lò, giữ 20%): khói lò là tín hiệu DUY NHẤT của
   * "lò đang nóng", còn bụi lau thớt không mang tin gì riêng.
   */
  start(x: number, y: number, depth: number, ms: number, reducedMotion: boolean) {
    if (reducedMotion) return;
    this.emitter.setPosition(x, y);
    this.emitter.setDepth(depth);
    this.emitter.start(0, ms);
  }

  /**
   * `StallScene.pause()` gọi `tweens.pauseAll()`, mà emitter KHÔNG phải tween — nó
   * chạy theo delta của scene nên vẫn phun đều sau tấm che pause. Phải tắt bằng tay.
   */
  setPaused(paused: boolean) {
    if (paused) this.emitter.pause(); else this.emitter.resume();
  }

  destroy() {
    this.emitter.destroy();
  }
}
