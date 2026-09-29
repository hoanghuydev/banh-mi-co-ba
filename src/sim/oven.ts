/**
 * Lò than — P1-01 §2.4. Nướng là một TRỤC LIÊN TỤC chạy nền, không phải giữ phím canh giờ.
 *
 *   trong lò:  crust += crustRate · heat · dt        (chỉ tăng, không giảm)
 *   mở cửa:    heat −= 0,12, hồi lại về 1 trong ~6 s
 *
 *   crust < 0,45   chưa tới   — chất lượng −, khách sành ăn (soi ≥ 0,7) chê
 *   0,45 – 0,88    GIÒN       — vùng tốt, rộng ~6 s: "đây không phải game canh giờ"
 *   0,88 – 1,00    sém cạnh   — chất lượng −−, vẫn không ra sự kiện
 *   > 1,00         CHÁY       — BURNT_OR_COLD bắn NGAY TẠI LÒ, có mùi
 *
 * 3 slot: bỏ ổ vào rồi đi làm việc khác được — cái giá là ổ ra lò bắt đầu NGUỘI
 * (`sim/loaf.ts`), nên nướng sẵn quá tay là tự hại mình. Không hàm nào ở đây roll RNG.
 */
export const OVEN_SLOTS = 3;
export const CRUST_RATE = 0.073;
export const HEAT_DROP = 0.12;
const HEAT_RECOVER = 0.12 / 6;         // hồi đủ một lần mở cửa trong ~6 s

export const CRUST = { READY: 0.45, SINGED: 0.88, BURNT: 1.0 } as const;
export type CrustBand = "RAW" | "CRISP" | "SINGED" | "BURNT";

export function bandOfCrust(c: number): CrustBand {
  if (c > CRUST.BURNT) return "BURNT";
  if (c >= CRUST.SINGED) return "SINGED";
  if (c >= CRUST.READY) return "CRISP";
  return "RAW";
}

export type OvenLoaf = { crust: number; burntFired: boolean };

export class Oven {
  slots: (OvenLoaf | null)[] = Array(OVEN_SLOTS).fill(null);
  heat = 1;
  /** Lò gas (P3-04 A1): nướng nhanh hơn, và cửa sổ trước khi cháy rộng hơn. */
  rateMul = 1;
  burnAt: number = CRUST.BURNT;

  get count() { return this.slots.filter(Boolean).length; }
  get hasRoom() { return this.slots.some((s) => s === null); }
  get busy() { return this.count > 0; }

  private openDoor() {
    this.heat = Math.max(0.4, this.heat - HEAT_DROP);
  }

  put(): boolean {
    const i = this.slots.indexOf(null);
    if (i < 0) return false;
    this.openDoor();
    this.slots[i] = { crust: 0, burntFired: false };
    return true;
  }

  /** Lấy ra ổ CHÍN NHẤT — người ta luôn rút ổ vào trước ra trước. */
  take(): OvenLoaf | null {
    let best = -1;
    this.slots.forEach((s, i) => { if (s && (best < 0 || s.crust > this.slots[best]!.crust)) best = i; });
    if (best < 0) return null;
    this.openDoor();
    const l = this.slots[best];
    this.slots[best] = null;
    return l;
  }

  /** Trả về danh sách ổ VỪA cháy trong frame này (để phát BURNT_OR_COLD đúng một lần). */
  tick(dt: number): OvenLoaf[] {
    this.heat = Math.min(1, this.heat + HEAT_RECOVER * dt);
    const burnt: OvenLoaf[] = [];
    for (const s of this.slots) {
      if (!s) continue;
      s.crust += CRUST_RATE * this.rateMul * this.heat * dt;
      if (s.crust > this.burnAt && !s.burntFired) { s.burntFired = true; burnt.push(s); }
    }
    return burnt;
  }
}
