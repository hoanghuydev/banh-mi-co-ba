/** Cái két: tiền lẻ (P3-03 §2.8). Thuần logic. */

export type ChangeOutcome = { ok: true; need: number } | { ok: false; need: number; roundedDown: number; ranToCoMai: boolean };

/**
 * Thối tiền: 35% khách đưa vừa đủ, 40% đưa tờ chẵn chục, 25% đưa tờ 50k. Thiếu lẻ ≤ 5k thì làm
 * tròn xuống; thiếu hơn thì chạy qua cô Mai đổi (khách đứng chờ). Khách đưa vừa đủ thì hộp có thêm lẻ.
 */
export function makeChange(price: number, float: { floatLeft: number }, roll: number): ChangeOutcome {
  const paid = roll < 0.35 ? price : roll < 0.75 ? Math.ceil(price / 10000) * 10000 : Math.max(50000, Math.ceil(price / 50000) * 50000);
  const need = paid - price;
  if (need === 0) { float.floatLeft += Math.round(price * 0.35 / 1000) * 1000; return { ok: true, need: 0 }; }
  if (float.floatLeft >= need) { float.floatLeft -= need; return { ok: true, need }; }
  const gap = need - float.floatLeft;
  if (gap <= 5000) { float.floatLeft = 0; return { ok: false, need, roundedDown: gap, ranToCoMai: false }; }
  return { ok: false, need, roundedDown: 0, ranToCoMai: true };
}
