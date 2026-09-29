import type { Slot } from "../core/eventbus";

/**
 * Trạm làm việc trong quầy — DỮ LIỆU, không phải code.
 * Thêm một công đoạn = thêm một dòng ở đây, không phải sửa scene.
 *
 * Chuỗi thao tác v0.1 (xương sống của control loop), xếp trải dài theo chiều hẻm
 * để mỗi trạm có chỗ thở và người chơi phải thật sự DI CHUYỂN giữa các công đoạn:
 *   kệ (x4) → lò (x7) → thớt (x7) → chỗ đưa hàng (x12);  thùng trà đá (x13,y1) là nhánh riêng.
 */

export type Hand =
  | "empty" | "loaf_cold" | "loaf_hot" | "loaf_burnt" | "loaf_filled" | "tea";

export const HAND_LABEL: Record<Hand, string> = {
  empty: "tay không",
  loaf_cold: "ổ bánh nguội",
  loaf_hot: "ổ bánh nóng",
  loaf_burnt: "ổ bánh cháy",
  loaf_filled: "ổ bánh đã kẹp",
  tea: "ly trà đá",
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
  /** Ô người chơi phải đứng cạnh. */
  tx: number;
  ty: number;
  name: string;
  /** Động từ hiện trên gợi ý phím. */
  verb: string;
  /** Cột của bảng visibility (CANON §5) — tầng perception ở P1 sẽ đọc field này. */
  slot: Slot;
  /** Cầm gì thì dùng được trạm. */
  needs: Hand[];
  /** Xong thì tay cầm gì. */
  gives: Hand;
  /** 0 = bấm phát ăn ngay; > 0 = phải GIỮ phím, có thanh tiến trình. */
  holdMs: number;
  /**
   * Chỉ lò mới có: giữ quá mốc này thì cháy.
   * CANON T5 — rủi ro phải ĐỌC ĐƯỢC trước khi hành động, nên nó là thanh tiến trình
   * có vạch đỏ nhìn thấy, không phải một cú roll xúc xắc giấu sau lưng.
   */
  overcookMs?: number;
  spoils?: Hand;
};

export const STATIONS: Station[] = [
  {
    id: "shelf", tx: 4, ty: 1, name: "kệ nguyên liệu", verb: "lấy ổ bánh",
    slot: "UNDER_COUNTER", needs: ["empty"], gives: "loaf_cold", holdMs: 0,
  },
  {
    id: "oven", tx: 7, ty: 1, name: "lò than", verb: "nướng bánh",
    slot: "OVEN", needs: ["loaf_cold"], gives: "loaf_hot",
    holdMs: 1500, overcookMs: 2300, spoils: "loaf_burnt",
  },
  {
    id: "board", tx: 7, ty: 4, name: "thớt", verb: "kẹp nhân",
    // holdMs = 0: bấm E là MỞ BẢNG CHỌN NGUYÊN LIỆU, không phải giữ phím chờ xong.
    // Trụ cột T2 nằm ở đây — người chơi chọn nguyên liệu chứ không chọn câu nói.
    slot: "BOARD", needs: ["loaf_hot"], gives: "loaf_filled", holdMs: 0,
  },
  {
    id: "handoff", tx: 12, ty: 4, name: "chỗ đưa hàng", verb: "đưa cho khách",
    slot: "HANDS", needs: ["loaf_filled", "tea"], gives: "empty", holdMs: 0,
  },
  {
    id: "tea", tx: 13, ty: 1, name: "thùng trà đá", verb: "rót ly trà đá",
    slot: "UNDER_COUNTER", needs: ["empty"], gives: "tea", holdMs: 600,
  },
];

/** Tra nhanh theo ô, dùng lúc dựng cảnh. */
export function stationAtTile(tx: number, ty: number) {
  return STATIONS.find((s) => s.tx === tx && s.ty === ty) ?? null;
}

/** Trạm gần nhất mà người chơi với tới được, hoặc null. Bán kính ~1.6 ô. */
export function stationNear(wx: number, wy: number): Station | null {
  let best: Station | null = null;
  let bestD = 1.6 * 1.6;
  for (const s of STATIONS) {
    const dx = s.tx + 0.5 - wx;
    const dy = s.ty + 0.5 - wy;
    const d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}

/** Vì sao chưa dùng được trạm — nói thẳng ra, không để người chơi bấm vào khoảng không. */
export function blockedReason(s: Station, hand: Hand): string | null {
  if (s.needs.includes(hand)) return null;
  if (hand === "loaf_burnt") return "bánh cháy rồi — bấm Q bỏ đi";
  if (s.id === "handoff") return "chưa có gì để đưa";
  if (s.id === "board" && hand === "loaf_cold") return "bánh còn nguội — nướng đã";
  if (hand === "empty") return `cần cầm ${s.needs.map((h) => HAND_LABEL[h]).join(" hoặc ")}`;
  return `đang cầm ${HAND_LABEL[hand]}`;
}
