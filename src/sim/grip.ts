// Rớt đồ do độ chắc tay tụt liên tục về 0, không phải xác suất; số chọn để chạy liên tục ~2,8 s thì rớt.
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
  /** Khung gia cố đặt ×0,85. */
  lossMul = 1;
  private bumpCd = 0;

  reset() { this.value = 1; this.bumpCd = 0; }

  get tier(): GripTier {
    return this.value < GRIP_SHAKE ? "SHAKE" : this.value < GRIP_WARN ? "WARN" : "SAFE";
  }

  /** Trả true nếu tuột tay; `slip` = độ trơn tay (dính tiền/mỡ). */
  tick(dt: number, tempo: number, bumped: boolean, slip = 0): boolean {
    this.bumpCd = Math.max(0, this.bumpCd - dt);
    const over = Math.max(0, tempo - SAFE_TEMPO);
    const drain = (over * DRAIN_MUL + slip * 0.35) * dt * this.lossMul;
    const gain = over === 0 ? RECOVER * dt : 0;
    this.value = Math.max(0, Math.min(1, this.value - drain + gain));
    if (bumped && this.bumpCd === 0) {
      this.value = Math.max(0, this.value - BUMP_LOSS * this.lossMul);
      this.bumpCd = BUMP_COOLDOWN;
    }
    return this.value <= 0;
  }
}
