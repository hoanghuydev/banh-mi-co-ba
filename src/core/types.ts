/** Sự kiện ở quầy mà khách nhìn thấy được. */
export type StimId =
  | "MADE_THEM_WAIT" | "BURNT_OR_COLD" | "DROPPED_FOOD"
  | "ORDER_DEFECT" | "DIRTY_HANDS" | "REFUSED_SERVICE"
  | "CARED_FOR_THEM" | "FREE_EXTRA" | "FLOURISH";

export const STIM_IDS: readonly StimId[] = [
  "MADE_THEM_WAIT", "BURNT_OR_COLD", "DROPPED_FOOD", "ORDER_DEFECT", "DIRTY_HANDS",
  "REFUSED_SERVICE",
  "CARED_FOR_THEM", "FREE_EXTRA", "FLOURISH",
];

export const NEGATIVE_STIMS: ReadonlySet<StimId> = new Set<StimId>([
  "MADE_THEM_WAIT", "BURNT_OR_COLD", "DROPPED_FOOD", "ORDER_DEFECT", "DIRTY_HANDS",
  "REFUSED_SERVICE",
]);

/** Vùng quầy nơi sự kiện xảy ra — cột của bảng visibility. */
export type StallZone = "HANDS" | "BOARD" | "OVEN" | "UNDER_COUNTER";
export type Slot = StallZone;

export type CustomerSlot = "FRONT_CENTER" | "FRONT_SIDE" | "QUEUE_2" | "QUEUE_3" | "SEATED_FAR";
export type ObsState = "UNAWARE" | "GLIMPSED" | "NOTICED" | "CONFIRMED";
export type SceneKey = "Boot" | "Menu" | "Day" | "Stall" | "Evening" | "Broke";
export type AttentionTool = "TRA_DA" | "ASK_QUESTION" | "OCCLUDE_BODY" | "SWITCH_SIDE";

/** Runtime `npcId` là `string` vì khách vãng lai mang khoá theo dáng (`walkin3`); validator nội dung mới ép đúng danh sách này. */
export const NPC_IDS = [
  "BA_BAY", "CHU_TU", "ANH_DUNG", "CHI_LAN", "BE_SU", "ONG_HAI",
  "CO_MAI", "THAY_PHUC", "CHI_HANH", "ANH_BAO", "BA_SAU", "CHU_KIET",
  "KHACH_VANG_LAI",
] as const;
export type NpcId = string;

/** Mưa = MUA_RAO | MUA_DAM — xem `isRain`. */
export type Weather = "NANG_GAT" | "MAT" | "AM_U" | "MUA_RAO" | "MUA_DAM" | "OI";

/** `IMPATIENT` chờ quá sức trong hàng (lỗi người bán) ≠ `BALKED` thấy hàng dài quay đầu (không tính vào `lost`); `SOILED_FOOD` khách thấy bánh rớt đất rồi bị đưa. */
export type LeaveReason =
  | "SERVED" | "IMPATIENT" | "SILENT_EXIT" | "SOLD_OUT" | "REFUSED" | "CLOSED" | "BALKED" | "SOILED_FOOD";
export type StallCloseReason = "CLOCK" | "SOLD_OUT" | "PLAYER";
export type AutosaveReason = "CUSTOMER_DONE" | "EVENT" | "SCENE_CHANGE" | "QUIT";

export type ItemId = string;
/** Hình dạng lỗi đi trên bus — bản đầy đủ ở `sim/order.ts`. */
export type Defect = { kind: string; item: string | null; text: string; weight: number; witness?: "ANTICIPATED" | "DISCOVERED" };
export type DaySummary = { served: number; lost: number; revenue: number };
