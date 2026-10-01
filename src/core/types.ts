/**
 * Định danh cố định dùng chung — P0-01 §3. Mọi doc và mọi hệ dùng đúng các tên này.
 *
 * Một số kiểu ở đây mới là KHUNG: hệ sở hữu chúng thuộc phase sau (ghi ở chú thích).
 * Khai báo trước để EventMap đầy đủ ngay từ P0 — "thêm event trước, viết code sau".
 */

/** 11 sự kiện CANON §3 + REFUSED_SERVICE (CANON §3.4, đã sửa sau bộ doc). */
export type StimId =
  | "WRONG_NAME" | "MADE_THEM_WAIT" | "BURNT_OR_COLD" | "DROPPED_FOOD"
  | "ORDER_DEFECT" | "DIRTY_HANDS" | "REFUSED_SERVICE"
  | "REMEMBERED_USUAL" | "REMEMBERED_STORY" | "CARED_FOR_THEM" | "FREE_EXTRA" | "FLOURISH";

export const STIM_IDS: readonly StimId[] = [
  "WRONG_NAME", "MADE_THEM_WAIT", "BURNT_OR_COLD", "DROPPED_FOOD", "ORDER_DEFECT", "DIRTY_HANDS",
  "REFUSED_SERVICE",
  "REMEMBERED_USUAL", "REMEMBERED_STORY", "CARED_FOR_THEM", "FREE_EXTRA", "FLOURISH",
];

export const NEGATIVE_STIMS: ReadonlySet<StimId> = new Set<StimId>([
  "WRONG_NAME", "MADE_THEM_WAIT", "BURNT_OR_COLD", "DROPPED_FOOD", "ORDER_DEFECT", "DIRTY_HANDS",
  "REFUSED_SERVICE",
]);

/** Vùng quầy nơi sự kiện xảy ra — cột của bảng visibility (CANON §5). */
export type StallZone = "HANDS" | "BOARD" | "OVEN" | "UNDER_COUNTER";
/** Tên cũ của `StallZone`, giữ lại cho code đã viết. */
export type Slot = StallZone;

export type CustomerSlot = "FRONT_CENTER" | "FRONT_SIDE" | "QUEUE_2" | "QUEUE_3" | "SEATED_FAR";
export type ObsState = "UNAWARE" | "GLIMPSED" | "NOTICED" | "CONFIRMED";
export type RelTier = "RIVAL" | "ACQUAINTANCE" | "FRIEND";
export type SceneKey = "Boot" | "Menu" | "Day" | "Market" | "Stall" | "Evening" | "Ending";
export type AttentionTool = "TRA_DA" | "ASK_QUESTION" | "OCCLUDE_BODY" | "SWITCH_SIDE" | "CO_BA";

/**
 * 12 NPC có tên + cô Ba + khách vãng lai — CANON §9.
 * Ở runtime `npcId` là `string` vì khách vãng lai mang khoá theo dáng người
 * (`walkin3`); validator nội dung (R013) mới là chỗ ép đúng danh sách này.
 */
export const NPC_IDS = [
  "BA_BAY", "CHU_TU", "ANH_DUNG", "CHI_LAN", "BE_SU", "ONG_HAI",
  "CO_MAI", "THAY_PHUC", "CHI_HANH", "ANH_BAO", "BA_SAU", "CHU_KIET",
  "CO_BA", "KHACH_VANG_LAI",
] as const;
export type NpcId = string;

/** Sáu kiểu trời của lịch mùa (P3-01 §2.4.4). Mưa = MUA_RAO | MUA_DAM — xem `isRain`. */
export type Weather = "NANG_GAT" | "MAT" | "AM_U" | "MUA_RAO" | "MUA_DAM" | "OI";
export type StandPointId = "DAU_HEM" | string;

/**
 * Vì sao người đó quay lưng. `BALKED` ≠ `IMPATIENT`, và đừng bao giờ gộp hai cái lại:
 *  · `IMPATIENT` — đã đứng vào hàng, đã chờ quá 1,6 lần sức chờ. Lỗi của người bán.
 *  · `BALKED`    — ngó thấy hàng dài rồi QUAY ĐẦU, chưa từng xếp vào. Không ai làm gì sai;
 *    người bán chỉ đang bận. Vì vậy nó KHÔNG tính vào `DaySummary.lost` (xem sim/service.ts).
 *  · `REFUSED`      — NGƯỜI BÁN mời đi (P5-02 act REFUSE).
 *  · `SOILED_FOOD`  — ngược lại: KHÁCH từ chối ổ bánh, vì chính mắt họ thấy nó rớt xuống
 *    đất rồi được nhặt lên đưa cho họ. Đây là cái mất khách đắt nhất trong game, và là
 *    cái duy nhất người chơi CỐ Ý gây ra.
 */
export type LeaveReason =
  | "SERVED" | "IMPATIENT" | "SILENT_EXIT" | "SOLD_OUT" | "REFUSED" | "CLOSED" | "BALKED" | "SOILED_FOOD";
export type StallCloseReason = "CLOCK" | "SOLD_OUT" | "PLAYER";
export type AutosaveReason = "CUSTOMER_DONE" | "EVENT" | "SCENE_CHANGE" | "QUIT";

// ── khung cho các hệ phase sau ────────────────────────────────────────────────
export type CraftStep = "TAKE_LOAF" | "TOAST" | "FILL" | "WRAP" | "HAND_OVER" | "POUR_TEA";
export type ItemId = string;
/** Hình dạng lỗi đi trên bus — bản đầy đủ ở `sim/order.ts`. */
export type Defect = { kind: string; item: string | null; text: string; weight: number; witness?: "ANTICIPATED" | "DISCOVERED" };
export type DaySummary = { served: number; lost: number; revenue: number };
export type StockCause = "BOUGHT" | "USED" | "DROPPED" | "SPOILED";
export type LedgerKind = "SALE" | "TIP" | "PURCHASE" | "RENT" | "HUI" | "OTHER";
export type A11yKey = string;
