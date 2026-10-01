import Phaser from "phaser";
import { FX } from "../../art/fx";

/**
 * Bụi bốc lên lúc lau thớt — phản hồi DUY NHẤT nhìn thấy được ở ngay cái thớt.
 *
 * Trước đây lau thớt chỉ có thanh tiến trình trên HUD và một dòng toast; cả hai đều
 * nằm xa chỗ tay đang làm, mà lúc đó mắt người chơi đang dán vào mặt thớt. Mấy cụm
 * bụi này đặt tín hiệu về đúng chỗ mắt đã nhìn.
 *
 * Dùng particle emitter sẵn có của Phaser chứ không phải sprite sheet: P5-02 §2 xếp
 * "lửa, khói, mưa, hơi nước, BỤI" vào ô "Particle procedural (Phaser emitter)" với
 * ngân sách 4–6 texture hạt, và ngân sách vẽ tay từng frame là "0 giờ, KHÔNG CÓ NGOẠI
 * LỆ". Thêm một sheet tải về còn kéo theo một dòng PROVENANCE.csv và một giấy phép
 * phải soi lại lúc phát hành — đổi lấy một hiệu ứng rộng 24 px thì không đáng.
 *
 * ── Vì sao mấy con số này là "lau chùi" chứ không phải "nổ" ──────────────────
 * Cùng một texture tròn, chỉnh sai thì ra vụ nổ. Ba thứ giữ cho nó ra chất bụi:
 *  · TỐC ĐỘ chậm (12–30 px/s). Đây là đòn bẩy lớn nhất — bụi bị GẠT ra, không bị
 *    BẮN ra. Cũng texture đó ở 200 px/s là một vụ nổ, không cãi được.
 *  · Phun theo QUẠT ngửa lên (góc 200–340°) chứ không toả tròn 360°: toả tròn đọc
 *    ra là nổ từ một điểm, quạt ôm mặt thớt đọc ra là có ai vừa quét ngang nó.
 *  · Nở ra RỒI mờ đi (scale 0,2 → 0,95, alpha đỉnh chỉ 0,55). Nhỏ dần là "bị đốt
 *    hết", to dần mà nhạt đi mới là "tan vào không khí".
 * Và `blendMode` phải là NORMAL: ADD nghĩa là hạt TỰ PHÁT SÁNG — bụi thì che sáng,
 * không phát sáng. Để ADD là thành tàn lửa ngay.
 *
 * Nhỏ giọt chứ không nổ một phát: 1 hạt mỗi 70 ms, trải suốt lượt lau. Một chùm hạt
 * sinh cùng một frame đọc ra là MỘT biến cố; nhỏ giọt đều mới đọc ra là một việc
 * đang được làm, và nó tắt đúng lúc thanh tiến trình đầy.
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
 * Vạt sinh hạt: rải đều dọc mặt thớt thay vì phun ra từ một điểm — một điểm đọc ra là
 * "rò rỉ", cả vạt mới ra "vừa có người quét hết mặt thớt".
 *
 * Viết tay thay vì đưa thẳng `Phaser.Geom.Rectangle` vào: `Rectangle.getRandomPoint`
 * TRẢ VỀ điểm, còn `RandomZoneSource` đòi hàm GHI vào điểm truyền vào rồi trả `void`
 * — hai chữ ký không khớp nhau, nhét vào là phải ép kiểu.
 *
 * `Phaser.Math.FloatBetween` chứ không phải `Math.random`: cổng `check-gates` cấm
 * `Math.random()` ở mọi nơi ngoài `src/core/` (CANON §8.1). Hạt bụi thì không cần
 * tất định — nó không chạm vào luật chơi — nhưng cổng là cổng.
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
   * Chạy đúng `ms` của lượt lau rồi tự tắt — không ai phải nhớ gọi `stop()`, nên
   * không có đường nào để bụi bốc mãi sau khi người chơi đã bỏ đi chỗ khác.
   *
   * `reducedMotion` thì KHÔNG bốc hạt nào: P5-01 §2.3 dòng 3 xếp "lá bay / bụi / hạt"
   * vào nhóm "xoá hoàn toàn", khác hẳn khói lò ở dòng 9 (giữ 20%). Khói lò phải giữ
   * vì nó là tín hiệu DUY NHẤT của "lò đang nóng"; bụi lau thớt thì không mang tin gì
   * riêng — thanh `handsBusyFrac` và dòng toast đã nói đủ, nên xoá không mất gì.
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
