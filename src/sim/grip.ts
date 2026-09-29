/**
 * Độ chắc tay — P1-01 §2.7. DROPPED_FOOD KHÔNG ĐƯỢC LÀ XÁC SUẤT (T5): rớt là vì
 * một đại lượng liên tục, nhìn thấy trước, tụt về 0 — không phải vì xui.
 *
 *   drain = (max(0, tempo − SAFE_TEMPO) · 2,4 + slip · 0,35) · dt
 *   gain  = (tempo ≤ SAFE_TEMPO ? 0,55 : 0) · dt
 *   va vào đồ đạc: −0,30 một lần
 *
 * Ở bản dựng đi-lại-tự-do, "tempo" là nhịp bước: đứng/đi thường = an toàn, CHẠY (Shift)
 * mà cầm đồ là tay lỏng dần. Doc có hai chỗ số không khớp nhau (P1-01 gap a/b); số dưới
 * đây chọn để chạy liên tục ~2,8 s thì rớt — đủ để thấy cảnh báo và kịp dừng.
 *
 * Ba nấc hiển thị RỜI RẠC (P1-04 §2.10): ≥ 0,45 an toàn · < 0,45 cam · < 0,25 run tay.
 */
export const SAFE_TEMPO = 0.75;
export const WALK_TEMPO = 0.6;
export const RUN_TEMPO = 0.9;
const DRAIN_MUL = 2.4;
const RECOVER = 0.55;
export const BUMP_LOSS = 0.3;
/** Một cú va chỉ tính một lần, không tính mỗi frame dí vào tường. */
const BUMP_COOLDOWN = 0.5;

export const GRIP_WARN = 0.45;
export const GRIP_SHAKE = 0.25;

export type GripTier = "SAFE" | "WARN" | "SHAKE";

export class Grip {
  value = 1;
  private bumpCd = 0;

  reset() { this.value = 1; this.bumpCd = 0; }

  get tier(): GripTier {
    return this.value < GRIP_SHAKE ? "SHAKE" : this.value < GRIP_WARN ? "WARN" : "SAFE";
  }

  /** Trả true nếu frame này tuột tay. `slip` = độ trơn của tay (tay dính tiền/mỡ — P1-01 §2.8). */
  tick(dt: number, tempo: number, bumped: boolean, slip = 0): boolean {
    this.bumpCd = Math.max(0, this.bumpCd - dt);
    const over = Math.max(0, tempo - SAFE_TEMPO);
    const drain = (over * DRAIN_MUL + slip * 0.35) * dt;
    const gain = over === 0 ? RECOVER * dt : 0;
    this.value = Math.max(0, Math.min(1, this.value - drain + gain));
    if (bumped && this.bumpCd === 0) {
      this.value = Math.max(0, this.value - BUMP_LOSS);
      this.bumpCd = BUMP_COOLDOWN;
    }
    return this.value <= 0;
  }
}
