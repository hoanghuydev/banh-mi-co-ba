import type { Slot } from "../core/eventbus";
import { COUNTER_Y, MENU_SPOT, STATION_ROW_Y, tileAt } from "./map";

// `ty` đọc từ bản đồ, không chép số, để dời quầy thì trạm đi theo.

export type Hand =
  | "empty" | "loaf_cold" | "loaf_hot" | "loaf_burnt" | "loaf_filled" | "tea";

export const HAND_LABEL: Record<Hand, string> = {
  empty: "tay không",
  loaf_cold: "ổ bánh nguội",
  loaf_hot: "ổ bánh nóng",
  loaf_burnt: "ổ bánh cháy",
  loaf_filled: "ổ bánh đã kẹp",
  tea: "ly nước trà",
};

export const HAND_COLOR: Record<Hand, number> = {
  empty: 0x9aa6a9,
  loaf_cold: 0xc9a06a,
  loaf_hot: 0xe8b56a,
  loaf_burnt: 0x4a3b32,
  loaf_filled: 0xd9a45f,
  tea: 0x8fc9a8,
};

export type Station = {
  id: string;
  tx: number;
  ty: number;
  // Trạm chiếm thêm một ô thì bấm E ở ô nào cũng tính.
  also?: { tx: number; ty: number };
  name: string;
  verb: string;
  slot: Slot;
  needs: Hand[];
  gives: Hand;
  // 0 = bấm là xong; > 0 = phải giữ phím.
  holdMs: number;
  // Giữ quá mốc này thì cháy.
  overcookMs?: number;
  spoils?: Hand;
};

export const STATIONS: Station[] = [
  {
    id: "shelf", tx: 5, ty: STATION_ROW_Y, name: "kệ nguyên liệu", verb: "lấy ổ bánh",
    slot: "UNDER_COUNTER", needs: ["empty"], gives: "loaf_cold", holdMs: 0,
  },
  {
    id: "oven", tx: 7, ty: STATION_ROW_Y, name: "lò than", verb: "nướng bánh",
    slot: "OVEN", needs: ["loaf_cold", "loaf_hot"], gives: "loaf_hot",
    holdMs: 1500, overcookMs: 2300, spoils: "loaf_burnt",
  },
  {
    id: "board", tx: 3, ty: COUNTER_Y, also: { tx: 3, ty: COUNTER_Y - 1 }, name: "thớt", verb: "kẹp nhân",
    // Bấm E mở bảng nguyên liệu; nhận cả ổ đã gói để mở ra sửa (`unwrapToBoard`).
    slot: "BOARD", needs: ["loaf_hot", "loaf_filled"], gives: "loaf_filled", holdMs: 0,
  },
  {
    // Trạm hai chiều (lấy/để), luật thật nằm ở `pressBasket`; ổ để đây vẫn nguội dần.
    id: "basket", tx: 6, ty: COUNTER_Y, name: "chỗ để bánh", verb: "để bánh xuống",
    slot: "BOARD", needs: ["empty", "loaf_hot", "loaf_cold", "loaf_filled"], gives: "empty", holdMs: 0,
  },
  {
    // Nhận cả ổ trơn cho khách gọi bánh mì không; thiếu món thì `diffDish` đếm.
    id: "handoff", tx: 10, ty: COUNTER_Y, name: "quầy gọi món", verb: "đưa cho khách",
    slot: "HANDS", needs: ["loaf_filled", "loaf_hot", "loaf_cold", "tea"], gives: "empty", holdMs: 0,
  },
  {
    id: "bin", tx: 13, ty: COUNTER_Y, name: "thùng rác", verb: "bỏ đi",
    slot: "UNDER_COUNTER", needs: ["loaf_cold", "loaf_hot", "loaf_burnt", "loaf_filled", "tea"],
    gives: "empty", holdMs: 0,
  },
  {
    // 1,5 s: đủ lâu để khách kịp thấy mình rửa.
    id: "sink", tx: 11, ty: STATION_ROW_Y, name: "rửa tay", verb: "rửa tay",
    slot: "HANDS", needs: ["empty"], gives: "empty", holdMs: 1500,
  },
  {
    // Mở kho xem đồ, không đổi tay; luật ở `StallScene.openStorage`.
    id: "kho", tx: 3, ty: 2, name: "kho", verb: "xem đồ trong kho",
    slot: "UNDER_COUNTER", needs: ["empty", "loaf_cold", "loaf_hot", "loaf_burnt", "loaf_filled", "tea"],
    gives: "empty", holdMs: 0,
  },
  {
    // Chỉ có khi đã mua `BINH_TRA` (`StallScene` loại qua `skip`, `propHidden` giấu trên bản đồ).
    id: "tea", tx: 9, ty: STATION_ROW_Y, name: "máy nước trà", verb: "rót ly nước trà",
    slot: "UNDER_COUNTER", needs: ["empty"], gives: "tea", holdMs: 600,
  },
];

export function stationAtTile(tx: number, ty: number) {
  return STATIONS.find((s) => (s.tx === tx && s.ty === ty) || (s.also?.tx === tx && s.also.ty === ty)) ?? null;
}

/** Tâm trạm theo toạ độ ô; trạm hai ô thì ở giữa hai ô. */
export function stationCenter(s: Station) {
  return s.also
    ? { x: (s.tx + s.also.tx) / 2 + 0.5, y: (s.ty + s.also.ty) / 2 + 0.5 }
    : { x: s.tx + 0.5, y: s.ty + 0.5 };
}

// Ô.
const REACH = 1.6;
// Trạm mới phải gần hơn hẳn (bình phương khoảng cách × 0,62 ≈ gần hơn 21%) mới giật khỏi trạm đang chọn, chống nhảy qua lại.
const STICKY = 0.62;

// `current` là trạm frame trước để bám lấy; `skip` loại trạm chưa có trong quán.
export function stationNear(wx: number, wy: number, current?: Station | null, skip?: (s: Station) => boolean): Station | null {
  const dist2 = (s: Station) => {
    const c = stationCenter(s);
    const dx = c.x - wx, dy = c.y - wy;
    return dx * dx + dy * dy;
  };
  let best: Station | null = null;
  let bestD = REACH * REACH;
  for (const s of STATIONS) {
    if (skip?.(s)) continue;
    const d = dist2(s);
    if (d < bestD) { bestD = d; best = s; }
  }
  if (!current || !best || best === current || skip?.(current)) return best;
  const dCur = dist2(current);
  if (dCur <= REACH * REACH && bestD > dCur * STICKY) return current;
  return best;
}

export function assertStationsOnCounter() {
  for (const st of STATIONS) {
    if (st.ty === COUNTER_Y && tileAt(st.tx, st.ty) === ".") {
      throw new Error(`Trạm "${st.id}" (${st.tx}, ${st.ty}) đứng trên ô trống, không có bàn hay đồ nào.`);
    }
  }
}

// Phím E ưu tiên trạm gần, nên chỗ đọc bảng menu phải ngoài tầm với mọi trạm.
export function assertMenuSpotFree() {
  const st = stationNear(MENU_SPOT.x, MENU_SPOT.y);
  if (st) {
    throw new Error(`Chỗ đứng đọc bảng menu (${MENU_SPOT.x}, ${MENU_SPOT.y}) nằm trong tầm với của trạm "${st.id}" — cú E sẽ rơi vào trạm đó, không mở bảng.`);
  }
}

export function blockedReason(s: Station, hand: Hand): string | null {
  if (s.needs.includes(hand)) return null;
  if (hand === "loaf_burnt") return "bánh cháy rồi, đem bỏ thùng rác";
  if (s.id === "handoff") return "chưa có gì để đưa";
  if (s.id === "board" && hand === "loaf_cold") return "bánh còn nguội, nướng đã";
  if (hand === "empty") return `cần cầm ${s.needs.map((h) => HAND_LABEL[h]).join(" hoặc ")}`;
  return `đang cầm ${HAND_LABEL[hand]}`;
}
