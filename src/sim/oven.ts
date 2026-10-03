/**
 * Lò than — nướng là một TRỤC LIÊN TỤC chạy nền, không phải giữ phím canh giờ.
 *   trong lò: `crust += crustRate · heat · dt` (chỉ tăng) · mở cửa: `heat −= 0,12`, hồi trong ~6 s
 *   <0,45 chưa tới · 0,45–0,88 GIÒN · 0,88–1,30 sém · >1,30 CHÁY (bắn `BURNT_OR_COLD` ngay tại lò)
 *
 * ⚠️ Mỗi ổ mang `crust` và `q` CỦA CHÍNH NÓ: để `q` ở một biến dùng chung thì bỏ ba ổ vào lò là cả
 * ba bị chấm bằng chất lượng của ổ lấy sau cùng.
 */
export const OVEN_SLOTS = 3;
export const CRUST_RATE = 0.073;
export const HEAT_DROP = 0.12;
const HEAT_RECOVER = 0.12 / 6;         // hồi đủ một lần mở cửa trong ~6 s

/**
 * ⚖️ `BURNT` 1,00 → 1,30 (chờ người thiết kế duyệt lại).
 *
 * Với 1,00 thì lò 3 slot chỉ dùng được 2: ổ thứ ba phải nằm thêm ~16 s mà cửa sổ READY→BURNT chỉ
 * có 7,5 s ⇒ cháy, mất trắng, kèm `BURNT_OR_COLD` cho cả hàng — tức hằng số phủ nhận chính lời hứa
 * "bỏ ổ vào rồi đi làm việc khác được" ở docstring trên.
 *
 * Chỉ đổi `BURNT`; `READY` và `SINGED` giữ nguyên nên băng GIÒN không đổi một li. Quãng SÉM giãn
 * từ 1,7 s (không ai đọc kịp) ra 5,8 s, và ổ thứ ba ra lò ở mức SÉM — bán được, chất lượng kém.
 *
 * ⚠️ `burnAt` của lò gas đặt ở `StallScene`, phải nới theo cho khỏi mất ưu thế.
 */
export const CRUST = { READY: 0.45, SINGED: 0.88, BURNT: 1.3 } as const;
export type CrustBand = "RAW" | "CRISP" | "SINGED" | "BURNT";

/** `burnAt` khác mặc định khi có lò gas — không truyền vào thì ổ lò gas bị đọc nhầm là cháy. */
export function bandOfCrust(c: number, burnAt: number = CRUST.BURNT): CrustBand {
  if (c > burnAt) return "BURNT";
  if (c >= CRUST.SINGED) return "SINGED";
  if (c >= CRUST.READY) return "CRISP";
  return "RAW";
}

/** `q` = chất lượng lô bánh mì ổ này lấy ở kệ (P3-03) — đi theo ổ, không phải theo scene. */
/**
 * `soiled` = ổ này đã từng nằm dưới đất. Lò GIỮ NGUYÊN cờ đó chứ không đốt sạch nó:
 * nếu nướng lại tẩy được lý lịch ổ bánh thì có ngay một mẹo rửa sạch mọi cú rớt, mà
 * cái người chơi phải cân nhắc chính là "liều đưa hay chịu mất một ổ".
 */
export type OvenLoaf = { crust: number; burntFired: boolean; q: number; soiled: boolean };

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

  /**
   * `q` đi theo ổ. `crust` khác 0 là ổ đã nướng dở rồi đem nướng lại (gác trên thớt
   * cho nguội rồi cầm ra lò): nướng lại KHÔNG xoá vỏ đã có, nếu không thì gác-rồi-nướng
   * thành nút reset độ giòn miễn phí.
   */
  put(q = 1, crust = 0, soiled = false): boolean {
    const i = this.slots.indexOf(null);
    if (i < 0) return false;
    this.openDoor();
    this.slots[i] = { crust, burntFired: crust > this.burnAt, q, soiled };
    return true;
  }

  /**
   * Lấy ra ổ CHÍN NHẤT — người ta luôn rút ổ vào trước ra trước.
   * Trừ ổ đã CHÁY: nó bị đẩy xuống cuối hàng. Trước đây ổ cháy luôn là ổ "chín nhất"
   * nên nó chặn đường tới hai ổ còn tốt phía sau — đúng lúc đang cao điểm. Cháy rồi thì
   * vẫn phải lấy ra (và bỏ đi), chỉ là lấy sau, lúc lò không còn ổ nào ăn được.
   */
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
