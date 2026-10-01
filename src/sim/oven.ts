/**
 * Lò than — P1-01 §2.4. Nướng là một TRỤC LIÊN TỤC chạy nền, không phải giữ phím canh giờ.
 *
 *   trong lò:  crust += crustRate · heat · dt        (chỉ tăng, không giảm)
 *   mở cửa:    heat −= 0,12, hồi lại về 1 trong ~6 s
 *
 *   crust < 0,45   chưa tới   — chất lượng −, khách sành ăn (soi ≥ 0,7) chê
 *   0,45 – 0,88    GIÒN       — vùng tốt, rộng ~6 s: "đây không phải game canh giờ"
 *   0,88 – 1,30    sém cạnh   — chất lượng −−, vẫn không ra sự kiện
 *   > 1,30         CHÁY       — BURNT_OR_COLD bắn NGAY TẠI LÒ, có mùi
 *
 * 3 slot: bỏ ổ vào rồi đi làm việc khác được — cái giá là ổ ra lò bắt đầu NGUỘI
 * (`sim/loaf.ts`), nên nướng sẵn quá tay là tự hại mình. Không hàm nào ở đây roll RNG.
 *
 * Mỗi ổ mang THÔNG SỐ CỦA CHÍNH NÓ qua lò: `crust` (nướng tới đâu) và `q` (chất lượng
 * lô bánh lấy ở kệ). Trước đây `q` nằm ở một biến dùng chung trong scene nên bỏ ba ổ
 * vào lò là cả ba bị chấm bằng chất lượng của ổ lấy sau cùng.
 */
export const OVEN_SLOTS = 3;
export const CRUST_RATE = 0.073;
export const HEAT_DROP = 0.12;
const HEAT_RECOVER = 0.12 / 6;         // hồi đủ một lần mở cửa trong ~6 s

/**
 * ⚖️ CÂN BẰNG — `BURNT` 1,00 → 1,30 (chờ người thiết kế duyệt lại con số này).
 *
 * Vì sao đổi: với 1,00 thì lò 3 slot chỉ dùng được 2. Đo ngày 1, khách xếp sẵn: nạp
 * 3 ổ mất ~7,2 s, vòng phục vụ ngắn nhất 7,4–8,5 s/khách (lò→thớt 1,2 s · thớt→quầy
 * 2,9 s · quầy→lò 1,85 s · cộng kẹp nhân và 3 nhịp gói). Ổ thứ ba phải nằm trong lò
 * thêm hai vòng ≈ 16 s, mà cửa sổ READY→BURNT ở 1,00 chỉ có 7,5 s ⇒ ổ thứ ba CHÁY,
 * mất trắng, kèm BURNT_OR_COLD cho cả hàng. Docstring ngay trên tự hứa "bỏ ổ vào rồi
 * đi làm việc khác được" — hằng số phủ nhận lời hứa đó.
 *
 * Đổi CÁI GÌ: chỉ một con số, `BURNT`. `READY` và `SINGED` giữ nguyên nên mốc chín và
 * băng GIÒN (~5,9 s) không đổi một li — "quá tay là cháy, có mùi" vẫn còn nguyên, chỉ
 * là quãng SÉM trước khi mất trắng giãn từ 1,7 s (không ai đọc kịp) ra 5,8 s (nhìn
 * vòng trên cửa lò là thấy). Ổ thứ ba giờ ra lò ở 0,96–1,11 = SÉM: bán được, chất
 * lượng kém — đúng giá phải trả cho việc nạp đầy lò, thay vì mất trắng.
 *
 * Đo lại (một ổ trong lò, tính từ lúc bỏ vào):  READY 6,5 s · SINGED 12,4 s ·
 * CHÁY 14,1 s → 18,2 s.  Hai cửa sổ đổi:
 *   READY→CHÁY  7,5 s → 11,7 s
 *   SÉM→CHÁY    1,7 s →  5,8 s
 * Quên hẳn lò thì vẫn cháy: vòng phục vụ ≥ ~10,5 s/khách là ổ thứ ba mất trắng.
 *
 * Muốn chỉnh lại: `BURNT` nhỏ hơn = lò 3 slot ngặt hơn; lớn hơn = thoải mái hơn.
 * `burnAt` của lò gas (P3-04 A1) đặt ở `StallScene`, phải nới theo cho khỏi mất ưu thế.
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
export type OvenLoaf = { crust: number; burntFired: boolean; q: number };

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
  put(q = 1, crust = 0): boolean {
    const i = this.slots.indexOf(null);
    if (i < 0) return false;
    this.openDoor();
    this.slots[i] = { crust, burntFired: crust > this.burnAt, q };
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
