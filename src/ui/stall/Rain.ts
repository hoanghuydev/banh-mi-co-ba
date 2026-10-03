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

/**
 * TRỜI MƯA — bốn lớp: tấm phủ đổi sáng (`veil`, thứ duy nhất còn thấy rõ khi `reduceMotion` kéo
 * hạt xuống 25%) · nền ướt (nướng vào `bakeGround`, không ở file này) · vệt mưa ngoài trời · giọt
 * chảy từ mép mái.
 *
 * Lớp 4 GIẢI THÍCH lớp 3: mưa cắt ngang một đường chéo (mép mái), và không có hàng giọt chảy ở
 * đúng mép ấy thì đường cắt đọc ra là một lỗi vẽ.
 *
 * Tự bơm hạt chứ không dùng `frequency`: mỗi hạt cần ba thứ chỉ `pick()` tính được, và `draw()`
 * còn biết khung hình đang nhìn vào đâu nên chỉ thả vào khúc trời thật sự thấy.
 */

/** Núm RẺ NHẤT: "mưa dày" đọc theo TỔNG CHIỀU DÀI vệt, nên kéo số này lên là mua được cảm giác đó mà không thêm hạt nào. ⚠️ Đi ĐÔI với `SPEED_MIN`/`SPEED_MAX`. */
const EXPOSURE = 0.115;
/**
 * ⚙️ NÚM VẶN TỐC ĐỘ RƠI. Dải rộng là nguồn biến thiên DUY NHẤT — iso không có phối cảnh nên hạt ở
 * xa không nhỏ đi.
 *
 * ⚠️ Vặn cái này kéo theo hai thứ: độ dài vệt (= tốc độ × `EXPOSURE`) và số hạt đang sống
 * (= mật độ × quãng rơi ÷ tốc độ), nên `BASE_DENSITY` bên `world/rain.ts` phải hạ cùng tỉ lệ.
 */
const SPEED_MIN = 400, SPEED_MAX = 640;

/** Giọt mép mái: chảy xuống chứ không rơi, nên chậm hơn hẳn và to hơn hẳn. */
const DRIP_SPEED = 300;
const DRIP_LEN = 15;
const DRIP_ROW = SKY_FROM_Y + 0.08;

/** Một-đổi-một là đúng vật lý và là chỗ TỐN NHẤT: vòng nước sống lâu gấp đôi đời một giọt nên chiếm quá nửa tổng số hạt, mà mắt không soi được giọt nào đẻ ra vòng nào. */
const SPLASH_EVERY = 3;

const RIPPLE_FROM = 0.12, RIPPLE_TO = 0.62;
const RIPPLE_MS = 320;

/**
 * `SPLASH` dưới MỌI thứ đứng trên đất (vòng nước nằm TRÊN mặt đất nên người đứng trước che được
 * nó) · `DROP` trên mọi đạo cụ và người (mưa rơi GIỮA camera và cái hẻm) · `GRADE` trên cả hai
 * nhưng DƯỚI chữ và mặt người — lớp phủ là chuyện của THẾ GIỚI, chữ và mặt là kênh thông tin.
 */
const SPLASH_DEPTH = -900_000;
const DROP_DEPTH = 1_000_000;
const GRADE_DEPTH = 7_000_000;

/** Mưa rào ở mật độ nền đạt cỡ 55 — trần này là LƯỚI AN TOÀN cho frame kẹt, không phải nhịp độ. */
const MAX_DROPS = 110;

const GRADE_PAD = 24;

/** Nhịp thở của mây (ms) và biên độ — trời mưa dày mỏng từng đợt, không phẳng lì. */
const CLOUD_MS = 9_100, CLOUD_AMP = 0.035;

/** Số tông pha sẵn giữa "vệt mưa xa" và "vệt mưa gần". Pha mỗi hạt một lần là phí. */
const TINT_STEPS = 8;

/** Hằng số của đường MẶT ĐẤT ở hàng mép mái, đã cộng `footY`. */
const GROUND_C = SKY_FROM_Y * TH + TH / 2 + BASE;
/** Hằng số của chính ĐƯỜNG MÉP MÁI — cao hơn mặt đất `ROOF_PX`. */
const EAVE_C = GROUND_C - ROOF_PX;
/** Bề dày dải ngoài trời trên màn hình, px. */
const SKY_BAND = TH * (LAST_SKY_ROW - SKY_FROM_Y);

const rnd = Phaser.Math.FloatBetween;

type Pending = { tx: number; ty: number; life: number; len: number; tint: number; wide: number };

export class Rain {
  /** MỘT emitter cho CẢ mưa lẫn giọt mái — xem `constructor`. */
  private readonly drops: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly splash: Phaser.GameObjects.Particles.ParticleEmitter;
  /** MỘT tấm phủ duy nhất — xem `world/rain.rainGrade` về phép gộp. */
  private readonly veil: Phaser.GameObjects.Rectangle;
  private readonly tints: number[];

  private view = new Phaser.Geom.Rectangle(0, 0, 0, 0);
  /** Khung nhìn lần vẽ trước — để khỏi dựng lại tấm phủ khi camera đứng yên. */
  private lastView = new Phaser.Geom.Rectangle(-1, -1, -1, -1);
  private pending: Pending = { tx: 0, ty: 0, life: 300, len: 24, tint: 0xffffff, wide: 0.5 };
  /** Phần hạt còn nợ từ frame trước — không giữ thì mật độ bị fps quyết định. */
  private owedDrops = 0;
  private owedDrips = 0;
  /** Đếm vòng cho `SPLASH_EVERY`. */
  private splashTurn = 0;
  private lean = 0;
  private spin = 0;
  private density: RainDensity;
  private reduced: boolean;

  /** `null` nếu hôm nay không mưa — cảnh khỏi phải tự hỏi trời nào mới dựng lớp nào. */
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

    // Tông vệt mưa: xa thì chìm về màu nền trời, gần thì sáng tới mức sáng NHẤT mà
    // P5-02 §2.1.5 còn cho phép trong mưa (`highlight`). Pha sẵn `TINT_STEPS` nấc.
    const far = Phaser.Display.Color.IntegerToColor(PAL.rain.ambient);
    const near = Phaser.Display.Color.IntegerToColor(PAL.rain.highlight);
    this.tints = Array.from({ length: TINT_STEPS }, (_, i) => {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(far, near, TINT_STEPS - 1, i);
      return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
    });

    /** `moveTo` thay `speed` + `angle`: Phaser tính lại vận tốc mỗi frame nên hạt CHẮC CHẮN chết đúng điểm đã định, và `deathCallback` biết chính xác chỗ đặt vòng nước. */
    const dropCfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      lifespan: () => this.pending.life,
      moveToX: () => this.pending.tx,
      moveToY: () => this.pending.ty - this.pending.len / 2,
      scaleX: () => this.pending.wide,
      scaleY: () => this.pending.len / DROP_H,
      rotate: () => this.spin,
      tint: () => this.pending.tint,
      /** Hiện DẦN ở mấy chục ms đầu — giọt phải "ló ra" từ dưới mép mái chứ không bật ra giữa không trung. Đậm hơn trực giác vì nền ở đây SÁNG. */
      alpha: { values: [0, 0.72, 0.88, 0.88], interpolation: "linear" },
      // NORMAL chứ không ADD: mưa che bớt ánh sáng phía sau nó, không tự phát sáng.
      // Để ADD là cả màn mưa hoá ra mấy sợi đèn neon.
      blendMode: "NORMAL",
      emitting: false,
      deathCallback: (p: Phaser.GameObjects.Particles.Particle) => this.splashAt(p),
      /** Cấp phát sẵn đủ cho lúc đông nhất, y như `BubblePool` và `WipePuff`. */
      reserve: 96,
      maxAliveParticles: MAX_DROPS,
    };

    /** Khác nhau ở cái gì thì cái đó đã nằm trong `pending`; mỗi emitter thêm vào là một lần renderer phải cắt mạch gộp. */
    this.drops = scene.add.particles(0, 0, FX.drop, dropCfg).setDepth(DROP_DEPTH);

    this.splash = scene.add.particles(0, 0, FX.ripple, {
      lifespan: RIPPLE_MS,
      speed: 0,
      // Loang RA rồi tắt. Nhỏ dần đi là "nước rút xuống", không phải "nước bắn lên".
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

  /** `dt` = 0 nghĩa là đang pause → không thả thêm hạt nào. `view` là `camera.worldView`. */
  draw(view: Phaser.Geom.Rectangle, dt: number, timeMs: number, reducedMotion: boolean) {
    if (reducedMotion !== this.reduced) this.setReduced(reducedMotion);
    this.view.setTo(view.x, view.y, view.width, view.height);

    /** ⚠️ `worldView` đọc ở đây là của frame TRƯỚC, nên tấm phủ chậm sau camera đúng một frame — thiếu lề là hở một vạch SÁNG chạy dọc mép màn hình. */
    // Camera đứng yên là chuyện thường xuyên nhất trong cả buổi bán (vùng chết rộng
    // 420 px). `setSize` của Shape đụng vào hình học và origin, nên gọi mỗi frame cho
    // một tấm không đổi là trả tiền đều đặn cho một việc không có.
    if (view.x !== this.lastView.x || view.y !== this.lastView.y
      || view.width !== this.lastView.width || view.height !== this.lastView.height) {
      this.lastView.setTo(view.x, view.y, view.width, view.height);
      this.veil.setPosition(view.x - GRADE_PAD, view.y - GRADE_PAD)
        .setSize(view.width + GRADE_PAD * 2, view.height + GRADE_PAD * 2);
    }
    // Mây dày mỏng từng đợt. Đây là chỗ DUY NHẤT còn đụng tới tấm phủ mỗi frame, và
    // `setAlpha` chỉ ghi một con số — không dựng lại hình học.
    this.veil.setAlpha(this.grade + (this.reduced ? 0 : Math.sin(timeMs / CLOUD_MS) * CLOUD_AMP));

    const deg = windAt(this.density, timeMs);
    this.lean = Math.tan(Phaser.Math.DegToRad(deg));
    // Texture vệt vẽ THẲNG ĐỨNG, đáy là đầu giọt. Quay ÂM theo góc gió thì đáy vệt
    // ngả về đúng phía giọt đang bay tới — quay dương là vệt chỉ ngược chiều rơi.
    this.spin = -deg;

    if (dt <= 0) return;
    this.owedDrops += dt * this.density.drops;
    this.owedDrips += dt * this.density.drips;
    /** Một frame kẹt trả `dt` lớn thành cú thả dồn mấy chục hạt trong đúng frame đang kẹt — càng kẹt càng nặng. Quá trần thì BỎ phần nợ, không dồn sang frame sau. */
    if (this.drops.getAliveParticleCount() > MAX_DROPS) { this.owedDrops = 0; this.owedDrips = 0; return; }
    while (this.owedDrops >= 1) { this.owedDrops -= 1; this.fall(); }
    while (this.owedDrips >= 1) { this.owedDrips -= 1; this.drip(); }
  }

  /** Công tắc trợ năng đổi giữa buổi: mật độ và lay gió tính lại từ đầu, không nội suy. */
  private setReduced(reducedMotion: boolean) {
    this.reduced = reducedMotion;
    this.density = rainDensity(this.weather, reducedMotion)!;
  }

  /** Giao của khung hình và dải ngoài trời. Giải trực tiếp chứ không bắn thử rồi loại: lúc camera nhìn vào trong quán thì tỉ lệ trượt hơn phân nửa. */
  private fall() {
    const v = this.view;
    const k = TH / TW;
    // mép trái/phải của khúc cột có mặt đất ngoài trời lọt vào khung
    const lo = Math.max(v.left, (v.top - GROUND_C - SKY_BAND) / k);
    const hi = Math.min(v.right, (v.bottom - GROUND_C) / k);
    if (hi <= lo) return;                              // camera đang nhìn hẳn vào trong quán

    const tx = rnd(lo, hi);
    const top = tx * k + GROUND_C;                     // mặt đất ở hàng mép mái, cột này
    const ty = rnd(Math.max(v.top, top), Math.min(v.bottom, top + SKY_BAND));
    // 0 = sát hiên, 1 = sáu hàng ngoài kia. Sáu hàng là cỡ khúc trời lọt khung ở zoom
    // hiện tại; lấy cả `SKY_BAND` thì hạt nào cũng rơi vào nửa "xa" của thang màu.
    const depth = Phaser.Math.Clamp((ty - top) / (TH * 6), 0, 1);
    const speed = rnd(SPEED_MIN, SPEED_MAX);
    this.emitDrop(tx, ty, speed, depth,
      speed * EXPOSURE, 0.55 + 0.4 * ((speed - SPEED_MIN) / (SPEED_MAX - SPEED_MIN)));
  }

  /** Giọt chảy xuống từ mép mái, rơi thành một hàng dọc mặt tiền quán. */
  private drip() {
    const wx = rnd(SHOPFRONT_X.lo, SHOPFRONT_X.hi);
    const s = toScreen(wx, DRIP_ROW);
    const ty = footY(s.sy);
    if (!this.view.contains(s.sx, ty)) return;         // mặt tiền đang ngoài khung
    this.emitDrop(s.sx, ty, DRIP_SPEED, 1, DRIP_LEN, 0.9);
  }

  /** Tính chỗ THẢ từ chỗ RƠI TRÚNG rồi nhét ba con số của nó vào `pending` cho mấy hàm `onEmit` đọc. */
  private emitDrop(tx: number, ty: number, speed: number, depth: number, len: number, wide: number) {
    const sx = spawnSx(tx, ty, this.lean, EAVE_C);
    const sy = sx * (TH / TW) + EAVE_C;
    const dist = Math.hypot(tx - sx, ty - sy);
    /** Ghi ĐÈ lên chính object cũ, không tạo mới: mưa rào thả 210 giọt mỗi giây. */
    const p = this.pending;
    p.tx = tx; p.ty = ty; p.len = len; p.wide = wide;
    p.life = (dist / speed) * 1000;
    p.tint = this.tints[Math.round(depth * (TINT_STEPS - 1))];
    this.drops.emitParticleAt(sx, sy);
  }

  /** Origin hạt nằm giữa vệt nên phải trừ nửa vệt, không thì nước bắn lên ở giữa thân vệt mưa. */
  private splashAt(p: Phaser.GameObjects.Particles.Particle) {
    if (++this.splashTurn < SPLASH_EVERY) return;
    this.splashTurn = 0;
    this.splash.emitParticleAt(p.x, p.y + (p.scaleY * DROP_H) / 2);
  }

  /** Emitter KHÔNG phải tween nên `tweens.pauseAll()` không đụng tới — phải tự gọi `setPaused`. */
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
