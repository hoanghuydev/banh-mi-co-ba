/**
 * Thiết bị — cái xe LÀ bảng thành tựu (§2.7): không huy hiệu, không thông báo nổi, không thanh
 * tiến trình. Mỗi món hiện trên xe (hay trên vỉa hè), đổi cảm giác một thao tác, và có một cái giá
 * bằng tiền.
 *
 * Mỗi món khai `gain`: một hai dòng quy ra chỉ số (`+15% khách ghé`, `chờ thêm 20 giây`).
 *
 * Sức chứa: 12 ô nền, lúc bắt đầu lò than (2) + thùng xốp (2) chiếm 4. Giá treo +2 → trần 14, mà mua
 * hết thì cần 16: thiếu đúng một hai món chứ không còn là một bài toán. Bán lại 60% giá.
 *
 * Hiệu ứng KHÔNG nằm hết ở đây: mỗi hệ tự hỏi `has(w, id)` và tự đổi đúng chỗ của nó (lò, bảng
 * kẹp, trạm trà…). Mấy hàm cuối file là chỗ cho hiệu ứng DÙNG CHUNG nhiều hệ.
 */
import EQUIP_JSON from "../content/econ/equipment.json";
import { ECON } from "./econ";
import type { EconBook } from "./obligations";

export type EquipId = "LO_THAN" | "THUNG_XOP" | "LO_DIEN" | "KEP_GAP" | "TU_MAT" | "NOI_U" | "LONG_BAN"
  | "GHE_BAN" | "DU_CHE" | "BINH_TRA" | "QUAT_DIEN" | "LOA_RAO" | "BANG_HIEU" | "BANG_QR" | "GIA_TREO";

export type EquipDef = {
  name: string; group: string; price_k: number; slots: number; daily_k: number; starting?: boolean;
  resellable?: boolean; resale_k?: number; replaces?: EquipId; costsMorning?: boolean;
  feel: string;
  /** LỢI ÍCH, quy ra chỉ số. Mỗi phần tử một dòng trên thẻ. Món có sẵn lúc bắt đầu để trống. */
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
/**
 * Tên nhóm bằng tiếng người, theo THỨ TỰ bày ra trang Đồ nghề: thứ tự `groups` trong JSON LÀ
 * thứ tự trên màn hình.
 */
export const EQUIP_GROUPS = J.groups;
export const GROUP_IDS = Object.keys(J.groups);

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
/** Chi phí cố định ĐÃ gồm lò than + thùng xốp có sẵn lúc bắt đầu (P3-04: 100k nền). */
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

/** Lý do KHÔNG mua được, hoặc null. Không bao giờ nói con số hiệu ứng. */
export function whyNot(id: EquipId, e: EquipState, cash: number): string | null {
  const d = EQUIP[id];
  if (has(e, id)) return "có rồi";
  if (d.starting) return "chưa có ai bán";
  const freed = d.replaces && has(e, d.replaces) ? Math.max(0, EQUIP[d.replaces].slots) : 0;
  if (d.slots > 0 && used(e) - freed + d.slots > capacity(e)) return "xe hết chỗ";
  if (cash < priceVnd(id)) return "chưa đủ tiền";
  return null;
}

/**
 * `book` = sổ hôm nay (`world.econ`): mua/bán đồ nghề là tiền ra/vào két nên phải có một
 * dòng ở `today.tools` (dương = chi ra). Để trống chỉ khi gọi từ test.
 */
export function buyEquip(id: EquipId, e: EquipState, m: { cash: number }, book?: EconBook): boolean {
  const d = EQUIP[id];
  const v = priceVnd(id);
  if (m.cash < v || has(e, id)) return false;
  m.cash -= v;
  if (book) book.today.tools += v;
  if (d.replaces && has(e, d.replaces)) {
    // đồ cũ đổi đi: thùng xốp bán lại được, lò than thì không
    if (EQUIP[d.replaces].resellable) {
      const back = resaleVnd(d.replaces);
      m.cash += back;
      if (book) book.today.tools -= back;
    }
    e.owned = e.owned.filter((x) => x !== d.replaces);
  }
  e.owned.push(id);
  e.installed = [...e.owned];
  return true;
}

export function sellEquip(id: EquipId, e: EquipState, m: { cash: number }, share = 1, book?: EconBook): number {
  if (!has(e, id) || EQUIP[id].resellable === false || EQUIP[id].starting && !EQUIP[id].resellable) return 0;
  const v = Math.round((resaleVnd(id) * share) / 1000) * 1000;
  m.cash += v;
  if (book) book.today.tools -= v;                 // tiền VÔ — dòng đồ nghề hôm nay thành âm
  e.owned = e.owned.filter((x) => x !== id);
  // bán lò điện thì lò than vẫn còn đó; bán tủ mát thì lại xài thùng xốp
  const d = EQUIP[id];
  if (d.replaces && !has(e, d.replaces)) e.owned.push(d.replaces);
  e.installed = [...e.owned];
  return v;
}

export const resellable = (e: EquipState) => e.owned.filter((id) => EQUIP[id as EquipId]?.resellable !== false && !EQUIP[id as EquipId]?.starting) as EquipId[];

// ─────────────────────────────────────────────────────── hiệu ứng dùng chung nhiều hệ
/*
 * MỖI CON SỐ Ở ĐÂY CÓ MỘT DÒNG CHỮ ĐỐI DIỆN trong `equipment.json` khoá `gain`. Đó là hợp đồng
 * với người chơi: thẻ ghi "+20% khách ghé" thì `walkInMul` phải trả 1,20. Đổi một bên mà quên bên
 * kia là nói dối người ta một cách lặng lẽ — `tests/p3-equipment.test.ts` canh đúng chỗ đó.
 */

/**
 * Hệ số khách vãng lai: bảng hiệu +20% · loa rao +15% · dù che +10% (bữa mưa +30%).
 *
 * ⚖️ BẢNG HIỆU MẠNH HƠN LOA, VÀ ĐẮT HƠN: loa rẻ (380k) nhưng ăn 4k mỗi ngày, bảng đắt (650k) nhưng
 * trả một lần — người chơi chọn theo túi tiền hôm nay, không có đáp án đúng.
 */
export function walkInMul(e: EquipState | undefined, rain: boolean, _sunny = false, loaOn = true) {
  let m = 1;
  if (has(e, "LOA_RAO") && loaOn) m *= 1.15;
  if (has(e, "BANG_HIEU")) m *= 1.2;
  // Cái dù KHÔNG trừ ngược lúc nắng: thẻ hứa một con số dương thì nó phải dương ở mọi thời tiết.
  if (has(e, "DU_CHE")) m *= rain ? 1.3 : 1.1;
  return m;
}

/** Quầy bẩn chậm hơn: lồng bàn / tủ kính −20%. Không món nào làm quầy bẩn NHANH hơn. */
export function dirtMul(e: EquipState | undefined) {
  return has(e, "LONG_BAN") ? 0.8 : 1;
}

/** Kiên nhẫn của MỌI khách đang chờ: quạt điện +15%. Nhân vào `patienceMul` (`day.dayDeps`). */
export function equipPatienceMul(e: EquipState | undefined) {
  return has(e, "QUAT_DIEN") ? 1.15 : 1;
}
