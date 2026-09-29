/**
 * Thiết bị — P3-04. Cái xe LÀ bảng thành tựu (§2.7): không huy hiệu, không thông báo nổi, không
 * thanh tiến trình. Mỗi món hiện trên xe, đổi cảm giác một thao tác, và có một cái giá.
 *
 * Sức chứa (TB-4): 12 ô, đầu mùa lò than (2) + thùng xốp (2) chiếm 4 → còn 8. Giá treo và
 * khung gia cố mỗi cái +2. Không bao giờ mua hết được — đó là để lựa chọn có nghĩa.
 * Bán lại 60% giá (và đó cũng là đường fail mềm của tiền học — P3-06 §2.4).
 *
 * Hiệu ứng KHÔNG nằm ở đây thành số trừu tượng: mỗi hệ tự hỏi `has(w, id)` và tự đổi đúng
 * chỗ của nó (lò, bảng kẹp, bồn rửa…). UI không bao giờ hiện con số hiệu ứng.
 */
import EQUIP_JSON from "../content/econ/equipment.json";
import { ECON } from "./econ";

export type EquipId = "LO_THAN" | "THUNG_XOP" | "LO_GAS" | "DAO_BEN" | "THOT_RIENG" | "KEP_GAP" | "TU_MAT" | "NOI_U"
  | "LONG_BAN" | "VOI_BON" | "THUNG_RAC" | "KHAN_3_MAU" | "GHE_BAN" | "DU_CHE" | "BINH_TRA" | "BANG_QR" | "LOA_RAO"
  | "BANG_HIEU" | "GIA_TREO" | "KHUNG_GIA_CO";

export type EquipDef = {
  name: string; group: string; price_k: number; slots: number; daily_k: number; starting?: boolean;
  resellable?: boolean; resale_k?: number; replaces?: EquipId; costsMorning?: boolean;
  unlock?: { minDay: number; requiresAny?: EquipId[]; afterFlag?: string };
  feel: string; drawbacks: string[];
};

const J = EQUIP_JSON as unknown as { cart: { baseSlots: number; resale: number; start: EquipId[] }; items: Record<EquipId, EquipDef> };
export const EQUIP = J.items;
export const EQUIP_IDS = Object.keys(EQUIP) as EquipId[];
export const CART = J.cart;

export type EquipState = { owned: string[]; installed: string[]; wear: Record<string, number> };

export const has = (e: EquipState | undefined, id: EquipId) => !!e?.owned.includes(id);

/** Giá mua / bán lại (đồng, đã co). */
export const priceVnd = (id: EquipId) => Math.round(EQUIP[id].price_k * ECON.scale) * 1000;
export const resaleVnd = (id: EquipId) => {
  const d = EQUIP[id];
  const k = d.resale_k ?? d.price_k * CART.resale;
  return Math.round(k * ECON.scale) * 1000;
};
export const dailyCostVnd = (e: EquipState) =>
  e.owned.reduce((a, id) => a + Math.round((EQUIP[id as EquipId]?.daily_k ?? 0) * ECON.scale) * 1000, 0);
/** Chi phí cố định ĐÃ gồm lò than + thùng xốp của đầu mùa (P3-04: 100k nền gồm cấu hình giữa mùa). */
export const extraDailyVnd = (e: EquipState) => {
  const base = CART.start.reduce((a, id) => a + Math.round(EQUIP[id].daily_k * ECON.scale) * 1000, 0);
  return Math.max(0, dailyCostVnd(e) - base);
};

export function capacity(e: EquipState) {
  return CART.baseSlots + e.owned.reduce((a, id) => a + Math.max(0, -(EQUIP[id as EquipId]?.slots ?? 0)), 0);
}
export function used(e: EquipState) {
  return e.owned.reduce((a, id) => a + Math.max(0, EQUIP[id as EquipId]?.slots ?? 0), 0);
}

export function newEquipState(): EquipState {
  return { owned: [...CART.start], installed: [...CART.start], wear: {} };
}

/** Món này đã mở chưa (theo ngày, theo món đã có, theo chuyện đã xảy ra). */
export function unlocked(id: EquipId, e: EquipState, day: number, flags: Record<string, unknown>) {
  const u = EQUIP[id].unlock;
  if (!u) return !EQUIP[id].starting;
  if (day < u.minDay) return false;
  if (u.requiresAny && !u.requiresAny.some((x) => has(e, x))) return false;
  if (u.afterFlag && !flags[u.afterFlag]) return false;
  return true;
}

/** Lý do KHÔNG mua được, hoặc null. Không bao giờ nói con số hiệu ứng. */
export function whyNot(id: EquipId, e: EquipState, cash: number, day: number, flags: Record<string, unknown>): string | null {
  const d = EQUIP[id];
  if (has(e, id)) return "có rồi";
  if (!unlocked(id, e, day, flags)) return "chưa có ai bán";
  const freed = d.replaces && has(e, d.replaces) ? Math.max(0, EQUIP[d.replaces].slots) : 0;
  if (d.slots > 0 && used(e) - freed + d.slots > capacity(e)) return "xe hết chỗ";
  if (cash < priceVnd(id)) return "chưa đủ tiền";
  return null;
}

export function buyEquip(id: EquipId, e: EquipState, m: { cash: number }): boolean {
  const d = EQUIP[id];
  const v = priceVnd(id);
  if (m.cash < v || has(e, id)) return false;
  m.cash -= v;
  if (d.replaces && has(e, d.replaces)) {
    // đồ cũ đổi đi: thùng xốp bán lại được, lò than của cô Ba thì không (cô giữ)
    if (EQUIP[d.replaces].resellable) m.cash += resaleVnd(d.replaces);
    e.owned = e.owned.filter((x) => x !== d.replaces);
  }
  e.owned.push(id);
  e.installed = [...e.owned];
  return true;
}

export function sellEquip(id: EquipId, e: EquipState, m: { cash: number }, share = 1): number {
  if (!has(e, id) || EQUIP[id].resellable === false || EQUIP[id].starting && !EQUIP[id].resellable) return 0;
  const v = Math.round((resaleVnd(id) * share) / 1000) * 1000;
  m.cash += v;
  e.owned = e.owned.filter((x) => x !== id);
  // bán lò gas thì lò than của cô Ba vẫn còn đó; bán tủ mát thì lại xài thùng xốp
  const d = EQUIP[id];
  if (d.replaces && !has(e, d.replaces)) e.owned.push(d.replaces);
  e.installed = [...e.owned];
  return v;
}

export const resellable = (e: EquipState) => e.owned.filter((id) => EQUIP[id as EquipId]?.resellable !== false && !EQUIP[id as EquipId]?.starting) as EquipId[];

// ─────────────────────────────────────────────────────────────── hiệu ứng (chỗ mỗi hệ hỏi)

/** Hệ số khách vãng lai từ đồ nghề: loa rao +18%, bảng hiệu +12%, dù che (mưa ×1,2 · nắng −4%). */
export function walkInMul(e: EquipState | undefined, rain: boolean, sunny: boolean, loaOn = true) {
  let m = 1;
  if (has(e, "LOA_RAO") && loaOn) m *= 1.18;
  if (has(e, "BANG_HIEU")) m *= 1.12;
  if (has(e, "DU_CHE")) m *= rain ? 1.2 : sunny ? 0.96 : 1;
  return m;
}
/** Quầy bẩn dần chậm hơn / nhanh hơn. */
export function dirtMul(e: EquipState | undefined) {
  let m = 1;
  if (has(e, "THOT_RIENG")) m *= 0.88;
  if (has(e, "LONG_BAN")) m *= 0.80;
  if (has(e, "THUNG_RAC")) m *= 0.85;
  if (has(e, "GHE_BAN")) m *= 1.15;
  return m;
}
