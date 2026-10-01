/**
 * Nhà cung cấp LÀ NPC — P3-02 §2.1, §2.6. Không phải menu giá: họ nhớ bạn mua đều hay bỏ
 * mối, trả sớm hay trễ, và đối xử theo đó. Quan hệ KHÔNG BAO GIỜ hiện ra — đọc qua cách
 * gọi ("con" → "con Ba" → "cưng"), qua giá mối quen, qua chuyện có cho nợ hay không.
 *
 * Bốn đòn bẩy (§2.6): mối quen (streak → bớt giá) · bán chịu (trần theo quan hệ, trễ một
 * lần là trần ×0,75 VĨNH VIỄN) · giữ hàng (Friend) · lời đồn chợ (P2-04 dùng lại, sau).
 * Bánh mì của bà Tám là MỎ NEO 3,5k — không mối quen nào bớt được (P3-03 khoá).
 *
 * ⚠️ Trần nợ tính theo tiền → co theo ECON.scale như mọi khoản khác.
 */
import type { RelTier } from "../core/types";
import { ECON, weekdayIdx, type GoodId } from "./econ";
import type { EconBook } from "./obligations";

export type SupplierId = "LO_BA_TAM" | "CO_NHUNG" | "CHU_CHIN" | "DI_NAM" | "CO_MAI";

type SupplierDef = {
  name: string;
  personality: { soi: number; nongTinh: number; deTha: number; thanThien: number };
  /** Trần bớt giá mối quen (P3-02 §2.6.2 bảng per-supplier). */
  discountCap: number;
  /** Chào theo quan hệ — [người lạ, quen, thân]. */
  greet: [string, string, string];
  closedDays?: number[];
};

export const SUPPLIERS: Record<SupplierId, SupplierDef> = {
  LO_BA_TAM: { name: "Lò bà Tám", personality: { soi: 0.5, nongTinh: 0.3, deTha: 0.8, thanThien: 0.9 }, discountCap: 0.10,
    greet: ["Lấy gì con?", "Con Ba lấy như bữa hả?", "Cưng lấy gì, cô để sẵn rồi nè."], closedDays: [28, 29, 30] },
  CO_NHUNG: { name: "Sạp cô Nhung", personality: { soi: 0.4, nongTinh: 0.5, deTha: 0.7, thanThien: 0.7 }, discountCap: 0.09,
    greet: ["Pate hả con?", "Như bữa hả con?", "Để cô lựa hộp mới cho."] },
  CHU_CHIN: { name: "Sạp chú Chín", personality: { soi: 0.4, nongTinh: 0.7, deTha: 0.5, thanThien: 0.5 }, discountCap: 0.14,
    greet: ["Lấy gì?", "Mối quen rồi, chú bớt cho.", "Bữa nay thịt ngon, chú để phần con rồi."] },
  DI_NAM: { name: "Sạp dì Năm", personality: { soi: 0.3, nongTinh: 0.6, deTha: 0.9, thanThien: 0.9 }, discountCap: 0.08,
    greet: ["Rau hả con?", "Rau bữa nay tươi nè con.", "Dì chừa bó ngon cho con nè."] },
  CO_MAI: { name: "Tạp hoá cô Mai", personality: { soi: 0.6, nongTinh: 0.4, deTha: 0.6, thanThien: 0.8 }, discountCap: 0.05,
    greet: ["Lấy gì con?", "Như bữa hả con?", "Cô để sẵn cho con rồi nè."] },
};

export type SupplierState = {
  tier: RelTier;
  /** Ngày mua liên tiếp (tính cả ân hạn). */
  streak: number;
  lastBuyDay: number;
  buyDays: number;
  paidEarly: number;
  lateCount: number;
  /** Trần nợ nhân vĩnh viễn — trễ một lần ×0,75, không có đường nào làm nó tăng lại. */
  ceilingMul: number;
  owed: number;              // đồng
  dueDay: number | null;
};

export const newSupplierState = (): SupplierState => ({
  tier: "ACQUAINTANCE", streak: 0, lastBuyDay: -99, buyDays: 0, paidEarly: 0, lateCount: 0, ceilingMul: 1, owed: 0, dueDay: null,
});
/** Người mới (chưa mua ngày nào) chưa phải "quen" — P3-02: Acquaintance sau 5 ngày mua. */
export const knows = (s: SupplierState) => s.buyDays >= 5;

export function state(all: Record<string, SupplierState>, id: SupplierId): SupplierState {
  return (all[id] ??= newSupplierState());
}

/** Ân hạn bỏ một buổi — người dễ tha (deTha ≥ 0,7) không tính một bữa vắng là bỏ mối. */
const grace = (id: SupplierId) => (SUPPLIERS[id].personality.deTha >= 0.7 ? 1 : 0);

/** P3-02 §2.6.2 — mối quen: ≥4 ngày 4% · ≥7 10% · ≥14 12% · ≥21 14%, có trần riêng từng người. */
export function loyaltyDiscount(id: SupplierId, s: SupplierState): number {
  const d = s.streak >= 21 ? 0.14 : s.streak >= 14 ? 0.12 : s.streak >= 7 ? 0.10 : s.streak >= 4 ? 0.04 : 0;
  return Math.min(d, SUPPLIERS[id].discountCap);
}

/** Giá sau mối quen — bánh mì là mỏ neo, không bao giờ bớt. */
export function discounted(g: GoodId, priceK: number, id: SupplierId, s: SupplierState) {
  if (g === "BANH") return priceK;
  return Math.round(priceK * (1 - loyaltyDiscount(id, s)) * 2) / 2;
}

export const isClosed = (id: SupplierId, day: number) => !!SUPPLIERS[id].closedDays?.includes(day);

/** Cuối buổi chợ: ai mua thì streak +1, ai không mua quá ân hạn thì mất mối. Ngày họ nghỉ thì đóng băng. */
export function afterMarket(all: Record<string, SupplierState>, boughtFrom: ReadonlySet<SupplierId>, day: number) {
  for (const id of Object.keys(SUPPLIERS) as SupplierId[]) {
    const s = state(all, id);
    if (isClosed(id, day)) { if (s.lastBuyDay === day - 1) s.lastBuyDay = day; continue; }
    if (boughtFrom.has(id)) {
      s.streak = day - s.lastBuyDay <= 1 + grace(id) ? s.streak + 1 : 1;
      s.lastBuyDay = day;
      s.buyDays++;
    } else if (day - s.lastBuyDay > 1 + grace(id)) s.streak = 0;
    s.tier = s.lateCount >= 2 ? "RIVAL" : s.streak >= 14 && s.paidEarly >= 1 ? "FRIEND" : s.tier === "FRIEND" && s.streak >= 7 ? "FRIEND" : "ACQUAINTANCE";
  }
}

/** Người cho nợ được: thanThien > 0,75 (bà Tám, dì Năm). Trần: người lạ 0 · quen 120k · thân 400k. */
export function creditCeiling(id: SupplierId, s: SupplierState): number {
  if (SUPPLIERS[id].personality.thanThien <= 0.75 || s.tier === "RIVAL" || !knows(s)) return 0;
  const k = s.tier === "FRIEND" ? 400 : 120;
  return Math.round(k * ECON.scale * s.ceilingMul) * 1000;
}

/** Hạn trả luôn là "cuối tuần" — Chủ nhật tới (P3-02 §2.6.1). */
export function dueSunday(day: number) {
  const wd = weekdayIdx(day);                 // 0 = T2 … 6 = CN
  return day + (6 - wd || 7);
}

export function borrow(s: SupplierState, amount: number, day: number) {
  s.owed += amount;
  s.dueDay ??= dueSunday(day);
}

/**
 * Trả nợ. Trả TRƯỚC hạn là một lần `PAID_EARLY` — đường lên "thân".
 * `book` = sổ hôm nay (`world.econ`): tiền ra khỏi két thì phải có một dòng, nếu không thì
 * tối cộng lại không khớp. Để trống chỉ khi gọi từ test.
 */
export function repay(s: SupplierState, m: { cash: number }, day: number, book?: EconBook): number {
  const v = Math.min(s.owed, m.cash);
  if (v <= 0) return 0;
  m.cash -= v;
  if (book) book.today.debtRepay += v;
  s.owed -= v;
  if (s.owed === 0) {
    if (s.dueDay !== null && day < s.dueDay) s.paidEarly++;
    s.dueDay = null;
  }
  return v;
}

/** Rạng sáng: nợ quá hạn → một lần trễ, trần ×0,75 vĩnh viễn, hạn mới Chủ nhật sau. */
export function dawnCheck(all: Record<string, SupplierState>, day: number): SupplierId[] {
  const late: SupplierId[] = [];
  for (const id of Object.keys(SUPPLIERS) as SupplierId[]) {
    const s = all[id];
    if (!s || s.owed <= 0 || s.dueDay === null || day <= s.dueDay) continue;
    s.lateCount++;
    s.ceilingMul *= 0.75;
    s.dueDay = dueSunday(day);
    late.push(id);
  }
  return late;
}

/** Câu bà Tám khi mình trễ lần đầu — P3-02 §2.6.1, nguyên văn. */
export const LATE_LINE: Partial<Record<SupplierId, string>> = {
  LO_BA_TAM: "Ừ thôi, khi nào có con đưa cô. Cô biết dạo này khó.",
  DI_NAM: "Thôi được, mai mốt đưa dì cũng được con.",
};

export function greetingOf(id: SupplierId, s: SupplierState) {
  const g = SUPPLIERS[id].greet;
  return s.tier === "FRIEND" ? g[2] : knows(s) && s.tier !== "RIVAL" ? g[1] : g[0];
}
