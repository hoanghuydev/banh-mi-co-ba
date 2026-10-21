// Mỗi tick `crust += CRUST_RATE · rateMul · heat · dt`; mở cửa `heat −= HEAT_DROP`.
export const OVEN_SLOTS = 3;
export const CRUST_RATE = 0.073;
export const HEAT_DROP = 0.12;
const HEAT_RECOVER = 0.12 / 6;         // hồi đủ một lần mở cửa trong ~6 s

/** `BURNT` 1,3 để ổ thứ ba trong lò kịp ra ở mức sém thay vì cháy. */
export const CRUST = { READY: 0.45, SINGED: 0.88, BURNT: 1.3 } as const;
export type CrustBand = "RAW" | "CRISP" | "SINGED" | "BURNT";

/** Lò điện phải truyền cả `burnAt` lẫn `singeAt`, không thì ổ bị đọc nhầm là sém/cháy. */
export function bandOfCrust(c: number, burnAt: number = CRUST.BURNT, singeAt: number = CRUST.SINGED): CrustBand {
  if (c > burnAt) return "BURNT";
  if (c >= singeAt) return "SINGED";
  if (c >= CRUST.READY) return "CRISP";
  return "RAW";
}

/** `q` là chất lượng lô ở kệ, đi theo từng ổ; `soiled` giữ qua lò để nướng lại không tẩy được cú rớt. */
export type OvenLoaf = { crust: number; burntFired: boolean; q: number; soiled: boolean };

/** `singeAt` phải nới theo `rateMul`, không thì lò điện làm dải giòn co lại; đo lại bằng `tools/audit-gain.ts`. */
export const OVEN_DIEN = { rateMul: 1.35, singeAt: 1.3, burnAt: 1.9 } as const;

export function ovenFor(hasDien: boolean): Oven {
  const o = new Oven();
  if (hasDien) { o.rateMul = OVEN_DIEN.rateMul; o.singeAt = OVEN_DIEN.singeAt; o.burnAt = OVEN_DIEN.burnAt; }
  return o;
}

export class Oven {
  slots: (OvenLoaf | null)[] = Array(OVEN_SLOTS).fill(null);
  heat = 1;
  rateMul = 1;
  burnAt: number = CRUST.BURNT;
  singeAt: number = CRUST.SINGED;

  get count() { return this.slots.filter(Boolean).length; }
  get hasRoom() { return this.slots.some((s) => s === null); }
  get busy() { return this.count > 0; }

  private openDoor() {
    this.heat = Math.max(0.4, this.heat - HEAT_DROP);
  }

  /** Nướng lại giữ `crust` cũ, để khỏi thành nút reset độ giòn. */
  put(q = 1, crust = 0, soiled = false): boolean {
    const i = this.slots.indexOf(null);
    if (i < 0) return false;
    this.openDoor();
    this.slots[i] = { crust, burntFired: crust > this.burnAt, q, soiled };
    return true;
  }

  /** Lấy ổ chín nhất, nhưng ổ cháy xếp sau cùng để không chặn ổ còn tốt. */
  take(): OvenLoaf | null {
    const pick = (ok: (s: OvenLoaf) => boolean) => {
      let best = -1;
      this.slots.forEach((s, i) => {
        if (s && ok(s) && (best < 0 || s.crust > this.slots[best]!.crust)) best = i;
      });
      return best;
    };
    const good = pick((s) => s.crust <= this.burnAt);
    const best = good >= 0 ? good : pick(() => true);
    if (best < 0) return null;
    this.openDoor();
    const l = this.slots[best];
    this.slots[best] = null;
    return l;
  }

  /** Trả ổ vừa cháy trong frame này, mỗi ổ đúng một lần. */
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
