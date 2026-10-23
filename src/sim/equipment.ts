// Mỗi hệ tự hỏi `has(e, id)`; cuối file chỉ chứa hiệu ứng dùng chung nhiều hệ.
import EQUIP_JSON from "../content/econ/equipment.json";
import { ECON } from "./econ";
import type { EconBook } from "./obligations";

export type EquipId = "LO_THAN" | "THUNG_XOP" | "LO_DIEN" | "KEP_GAP" | "TU_MAT" | "LONG_BAN"
  | "GHE_BAN" | "DU_CHE" | "BINH_TRA" | "QUAT_DIEN" | "LOA_RAO" | "BANG_HIEU" | "BANG_QR" | "GIA_TREO";

export type EquipDef = {
  name: string; group: string; price_k: number; slots: number; daily_k: number; starting?: boolean;
  resellable?: boolean; resale_k?: number; replaces?: EquipId; costsMorning?: boolean;
  feel: string;
  /** Mỗi phần tử một dòng lợi ích trên thẻ. */
  gain: string[];
};

const J = EQUIP_JSON as unknown as {
  cart: { baseSlots: number; resale: number; start: EquipId[] };
  groups: Record<string, string>;
  items: Record<EquipId, EquipDef>;
};
export const EQUIP = J.items;
export const EQUIP_IDS = Object.keys(EQUIP) as EquipId[];
export const CART = J.cart;
/** Thứ tự key trong JSON là thứ tự trên màn hình. */
export const EQUIP_GROUPS = J.groups;
export const GROUP_IDS = Object.keys(J.groups);

export type EquipState = { owned: string[]; installed: string[]; wear: Record<string, number> };

export const has = (e: EquipState | undefined, id: EquipId) => !!e?.owned.includes(id);

/** Đồng, đã nhân `ECON.scale`. */
export const priceVnd = (id: EquipId) => Math.round(EQUIP[id].price_k * ECON.scale) * 1000;
export const resaleVnd = (id: EquipId) => {
  const d = EQUIP[id];
  const k = d.resale_k ?? d.price_k * CART.resale;
  return Math.round(k * ECON.scale) * 1000;
};
export const dailyCostVnd = (e: EquipState) =>
  e.owned.reduce((a, id) => a + Math.round((EQUIP[id as EquipId]?.daily_k ?? 0) * ECON.scale) * 1000, 0);
/** Trừ phần của đồ có sẵn lúc bắt đầu. */
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

/** Lý do không mua được, hoặc null. */
export function whyNot(id: EquipId, e: EquipState, cash: number): string | null {
  const d = EQUIP[id];
  if (has(e, id)) return "có rồi";
  if (d.starting) return "chưa có ai bán";
  const freed = d.replaces && has(e, d.replaces) ? Math.max(0, EQUIP[d.replaces].slots) : 0;
  if (d.slots > 0 && used(e) - freed + d.slots > capacity(e)) return "xe hết chỗ";
  if (cash < priceVnd(id)) return "chưa đủ tiền";
  return null;
}

/** `book` ghi vào `today.tools` (dương = chi ra); chỉ để trống khi gọi từ test. */
export function buyEquip(id: EquipId, e: EquipState, m: { cash: number }, book?: EconBook): boolean {
  const v = priceVnd(id);
  if (m.cash < v || has(e, id)) return false;
  m.cash -= v;
  if (book) book.today.tools += v;
  installEquip(id, e, m, book);
  return true;
}

/** Lắp đồ đã trả tiền; thay món cũ thì được trả lại giá bán lại. */
export function installEquip(id: EquipId, e: EquipState, m: { cash: number }, book?: EconBook) {
  const d = EQUIP[id];
  if (d.replaces && has(e, d.replaces)) {
    if (EQUIP[d.replaces].resellable) {
      const back = resaleVnd(d.replaces);
      m.cash += back;
      if (book) book.today.tools -= back;
    }
    e.owned = e.owned.filter((x) => x !== d.replaces);
  }
  e.owned.push(id);
  e.installed = [...e.owned];
}

export function sellEquip(id: EquipId, e: EquipState, m: { cash: number }, share = 1, book?: EconBook): number {
  if (!has(e, id) || EQUIP[id].resellable === false || EQUIP[id].starting && !EQUIP[id].resellable) return 0;
  const v = Math.round((resaleVnd(id) * share) / 1000) * 1000;
  m.cash += v;
  if (book) book.today.tools -= v;
  e.owned = e.owned.filter((x) => x !== id);
  // Bán đồ thay thế thì lấy lại đồ cũ.
  const d = EQUIP[id];
  if (d.replaces && !has(e, d.replaces)) e.owned.push(d.replaces);
  e.installed = [...e.owned];
  return v;
}

export const resellable = (e: EquipState) => e.owned.filter((id) => EQUIP[id as EquipId]?.resellable !== false && !EQUIP[id as EquipId]?.starting) as EquipId[];

// Mỗi số dưới đây phải khớp dòng `gain` trong `equipment.json` (canh ở `tests/p3-equipment.test.ts`).

export function walkInMul(e: EquipState | undefined, rain: boolean, _sunny = false, loaOn = true) {
  let m = 1;
  if (has(e, "LOA_RAO") && loaOn) m *= 1.15;
  if (has(e, "BANG_HIEU")) m *= 1.2;
  if (has(e, "DU_CHE")) m *= rain ? 1.3 : 1.1;
  return m;
}

export function dirtMul(e: EquipState | undefined) {
  return has(e, "LONG_BAN") ? 0.8 : 1;
}

/** Nhân vào `patienceMul` (`day.dayDeps`). */
export function equipPatienceMul(e: EquipState | undefined) {
  return has(e, "QUAT_DIEN") ? 1.15 : 1;
}
