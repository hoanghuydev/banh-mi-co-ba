/**
 * Cái két — P3-03 §2.6 (sổ nợ), §2.8 (tiền lẻ), P3-01 §2.6 (mở hàng / vía). Thuần logic.
 *
 * SỔ NỢ — chỗ DUY NHẤT "nhớ nhầm" hợp trực giác: khách mua chịu, người chơi GHI hay KHÔNG.
 *   · ghi rồi → con số ghi luôn thắng, không cãi (§2.6, bịt ăn gian (h))
 *   · không ghi → lúc trả, khách nhớ theo tính cách: soi cao nhớ thiếu, thân thiện nhớ dư,
 *     càng lâu càng lệch (drift 0,04/ngày, trần 10 ngày)
 *   · ≥ 14 ngày → xoá sổ, không bao giờ trả
 *   · tắt công tắc "nhớ nhầm" → khách luôn nhớ đúng số (trợ năng #1)
 *
 * TIỀN LẺ — sáng đổi ở cô Mai; hết lẻ thì làm tròn xuống (mất vài nghìn) hoặc chạy đi đổi.
 * VÍA — khách mở hàng quyết vía cả ngày: ±3% khách, không một pixel UI nào (P3-01 §2.6).
 */
import { Rng } from "../core/rng";
import type { Personality } from "../content/npcs";

export type DebtRecord = {
  npcId: string;
  day: number;
  minute: number;
  trueAmount: number;           // đồng
  /** Người chơi ghi bao nhiêu — null = chưa ghi ("ghi sau" / quên). */
  playerWrote: number | null;
  settledOnDay?: number;
  settledAmount?: number;
};

export const SHORT_OF_CASH_RATE = 0.08;
export const DEBT_WRITE_OFF_DAYS = 14;
export const RECONCILE_DAYS = [10, 20, 30, 40];

const round5k = (v: number) => Math.max(5000, Math.round(v / 5000) * 5000);

/** Khách tới trả nợ nói số bao nhiêu (P3-03 §2.6). Tất định theo (mùa, người, ngày mua). */
export function recalledAmount(d: DebtRecord, today: number, p: Personality, saveId: string, allowFalse: boolean): number {
  if (d.playerWrote !== null) return d.playerWrote;
  if (!allowFalse) return d.trueAmount;
  const days = Math.min(10, today - d.day);
  const drift = 0.04 * days;
  const bias = (0.5 - p.soi) * 0.10 + (p.thanThien - 0.5) * 0.12;
  const rng = Rng.forSeason(saveId, `debt:${d.npcId}:${d.day}`);
  const u = Math.max(1e-6, rng.next()), v = rng.next();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return round5k(d.trueAmount * (1 + bias + z * drift));
}

export const openDebtOf = (debts: readonly DebtRecord[], npcId: string, today: number) =>
  debts.find((d) => d.npcId === npcId && d.settledOnDay === undefined && today - d.day < DEBT_WRITE_OFF_DAYS && today > d.day);

/** Đối sổ cuối kỳ: bán chịu mà không ghi thì hụt bao nhiêu (đồng). */
export function debtGap(debts: readonly DebtRecord[], today: number) {
  let gap = 0;
  for (const d of debts) {
    if (d.playerWrote !== null) continue;
    if (d.settledOnDay !== undefined) gap += Math.max(0, d.trueAmount - (d.settledAmount ?? 0));
    else if (today - d.day >= DEBT_WRITE_OFF_DAYS) gap += d.trueAmount;
  }
  return gap;
}

// ─────────────────────────────────────────────────────────────── tiền lẻ

export type ChangeOutcome = { ok: true; need: number } | { ok: false; need: number; roundedDown: number; ranToCoMai: boolean };

/**
 * Thối tiền: 35% khách đưa vừa đủ, 40% đưa tờ chẵn chục, 25% đưa tờ 50k (trung bình ~8k
 * tiền thối mỗi lượt — P3-03 §2.8). Thiếu lẻ ≤ 5k thì làm tròn xuống; thiếu hơn thì chạy qua
 * cô Mai đổi (khách phải đứng chờ).
 *
 * Khách đưa vừa đủ thì mình CÓ THÊM lẻ (20k + 5k vô hộp) — đó là `SMALL_NOTE_RECOVERY = 0,35`
 * của P3-03 §2.8, không phải tiền từ không khí. Đo 300 mùa × 40 ngày × 18 khách: mang 100k
 * thì 29% số ngày có lúc hết lẻ, 200k còn 1%, 300k thì không bao giờ — đúng bảng "đủ cho
 * ~19 / ~38 / ~58 giao dịch" của doc. Giá của 300k là 300k nằm trong hộp, không mua hàng
 * được — chỗ đó phải do màn chợ thu (trừ vào két), không phải do chỉnh hệ số ở đây.
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

// ─────────────────────────────────────────────────────────────── vía

export type ViaMood = -1 | 0 | 1;
export type OpeningFacts = { walkedAway: boolean; complained: boolean; noChange: boolean; paidExact: boolean; smiled: boolean; friend: boolean };

/** P3-01 §2.6 `resolveOpeningLuck`. */
export function viaOf(f: OpeningFacts): ViaMood {
  const s = (f.walkedAway ? -2 : 0) + (f.complained ? -1 : 0) + (f.noChange ? -2 : 0)
    + (f.paidExact ? 1 : 0) + (f.smiled ? 1 : 0) + (f.friend ? 1 : 0);
  return s <= -2 ? -1 : s >= 2 ? 1 : 0;
}

/**
 * Hiệu ứng CƠ HỌC của vía = KHÔNG. P3-01 §2.6 từng cho ±3% khách / ±2% làm tròn; P4-05 §2.1 B
 * (tài liệu thi hành lằn ranh LR-6) cấm hẳn: "KHÔNG CÓ buff/debuff số" — đốt vía hay không
 * thì cùng seed ra cùng một ngày (có test). Vía chỉ còn là cô Ba phản ứng. Mối tương quan
 * có thật mà nguyên nhân trần tục (hết tiền lẻ, hàng chờ dài) tự nó đã có sẵn trong game.
 */
export const viaWalkInMul = (_v: ViaMood) => 1;
export const viaRoundUp = (_v: ViaMood) => 0;

/** Nghi thức đốt vía — 5 nhịp, không phạt đếm sai (P3-01 §2.6). */
export const RITUAL_STEPS = [
  "Đốt giấy — giữ tay một chút",
  "Bước qua lửa — bảy lần (nam) hay chín lần (nữ)",
  "Nắm muối, ném qua vai trái",
  "Ba quả chanh cắt tư, đặt quanh xe",
  "Bồ kết với nhang, số lẻ",
];
export const RITUAL_PRAYER = "Đốt vía, đốt van, đốt gan, đốt ruột — vía lành thì ở, vía dữ thì đi.";
export const RITUAL_LINES = {
  offer: 'Cô Ba: "Mở hàng gì mà xui dữ. Đốt vía cái con?"',
  done: 'Cô Ba: "Rồi đó. Cô cũng hổng biết có ăn thua gì không. Nhưng đốt rồi thì thấy nhẹ người, bán mới vô."',
  skipFirst: 'Cô Ba: "Ừ, con hổng tin thì thôi. Cô đốt giùm cho."',
};
