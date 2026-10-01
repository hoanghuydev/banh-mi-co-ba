/**
 * Khẩu vị ẩn — P1-01 §2.6. Mỗi NPC có một `TasteVector` lý tưởng + trọng số cho biết họ
 * để ý chiều nào. KHÔNG BAO GIỜ hiện số (T3): người chơi suy ra qua lời, qua sổ tay,
 * qua việc họ boa nhiều hay ít.
 *
 * Ranh giới không được lẫn (P1-01 §2.6, CANON Đ3): lệch KHẨU VỊ ≠ ORDER_DEFECT.
 * Khách NÓI RA "không hành" → ràng buộc cứng (xử lý ở `order.ts`). Khách không nói mà
 * vốn thích ít rau → chỉ là `satisfaction` thấp, im lặng, đi vào tiền boa.
 */
import TASTES from "../content/npcs/taste.json";
import { portionsOf, type Ingredient } from "./order";

export const DIMS = ["pate", "meat", "veg", "chili", "salt", "sauce", "crust"] as const;
export type Dim = typeof DIMS[number];
export type TasteVector = Record<Dim, number>;
export type NpcTaste = { ideal: TasteVector; weight: TasteVector; tolerance: number };

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const toVec = (xs: readonly number[]): TasteVector =>
  Object.fromEntries(DIMS.map((d, i) => [d, xs[i] ?? 0.5])) as TasteVector;

const TABLE: Record<string, NpcTaste> = Object.fromEntries(
  Object.entries((TASTES as { npcs: Record<string, { ideal: number[]; weight: number[]; tolerance: number }> }).npcs)
    .map(([id, t]) => [id, { ideal: toVec(t.ideal), weight: toVec(t.weight), tolerance: t.tolerance }]),
);

export function tasteOf(npcId: string): NpcTaste | null {
  return TABLE[npcId] ?? null;
}

/**
 * Ổ bánh → vector khẩu vị. Doc chưa định nghĩa ánh xạ này (P1-01 gap e) — đây là lựa
 * chọn của bản dựng: mỗi chiều = số phần / mức "rất nhiều" của chiều đó.
 * `salt` chưa có nguyên liệu (muối tiêu, xì dầu) nên đứng ở 0,5 — không ai bị phạt vì nó.
 */
export function servedVector(dish: readonly Ingredient[], crust: number): TasteVector {
  const n = portionsOf(dish as Ingredient[]);
  const g = (id: Ingredient) => n.get(id) ?? 0;
  // Mẫu số = TRẦN THẬT của từng trục trên thang hai nấc (`INGREDIENTS[].max` = 2):
  // một món 2, nhóm nhân bốn món 8 nhưng không ai kẹp đủ bốn — 4 là "đã nhiều thịt",
  // rau ba món 6. Lấy mẫu số cũ (thang bốn nấc) thì không ổ nào chạm nổi 1,0 và NPC nào
  // cũng đọc ra là nhạt — `satisfaction` lệch vĩnh viễn về một phía.
  return {
    pate: clamp01(g("pate") / 2),
    meat: clamp01((g("thit") + g("chalua") + g("xiumai") + g("opla")) / 4),
    veg: clamp01((g("dochua") + g("dualeo") + g("hanhngo")) / 6),
    chili: clamp01(g("ot") / 2),
    salt: 0.5,
    sauce: clamp01(g("tuongot") / 2),
    // độ giòn: vùng giòn của lò (0,45–0,88) ánh xạ quanh 0,5–0,85
    crust: clamp01(crust),
  };
}

/** Chép nguyên P1-01 §2.6. 0..1, KHÔNG BAO GIỜ hiển thị. */
export function satisfaction(n: NpcTaste, served: TasteVector): number {
  let err = 0, wsum = 0;
  for (const k of DIMS) {
    const w = n.weight[k];
    err += w * Math.max(0, Math.abs(n.ideal[k] - served[k]) - n.tolerance);
    wsum += w;
  }
  return clamp01(1 - err / wsum);
}
