import { DAY_END_MIN, DAY_START_MIN } from "../core/clock";
import { TH, TW, toScreen } from "./iso";
import { tileAt } from "./map";

/** "y" = mặt hướng +y (xuống-trái trên màn hình), "x" = mặt hướng +x (xuống-phải). */
export type LampFace = "x" | "y";

export type LampSpot = {
  /** Ô tường mang đèn. */
  tx: number;
  ty: number;
  face: LampFace;
  /** Vị trí dọc mặt tường, 0..1: "y" từ mép trái sang phải, "x" từ mép gần camera ra xa. */
  along: number;
  /** Khoảng từ mép trên tường tới tâm đế đèn, px thiết kế. */
  hang: number;
  /** Hệ số cường độ quầng và vệt sáng. */
  power: number;
  /** Tâm vệt hắt lên mặt men bàn, toạ độ thế giới; `wood` = x thế giới tâm vệt trên mặt gỗ phía trước, `glint` = vệt phản chiếu đèn trên mặt men. */
  pool?: { wx: number; wy: number; wood?: number; glint?: { wx: number; wy: number } };
  /** Ảnh gốc đế bên trái, bóng đèn chìa sang phải; mặt "y" chìa sang trái nên lật. */
  flip: boolean;
};

export const LAMP_SPOTS: readonly LampSpot[] = [
  { tx: 2, ty: 3, face: "x", along: 0.5, hang: 26, power: 0.9, pool: { wx: 3.5, wy: 4.3 }, flip: false },
  { tx: 2, ty: 5, face: "x", along: 0.5, hang: 26, power: 0.9, pool: { wx: 3.5, wy: 5.4, wood: 3.4, glint: { wx: 4.1, wy: 5.55 } }, flip: false },
  { tx: 12, ty: 0, face: "y", along: 0.52, hang: 14, power: 1, flip: true },
];

export const WALL_FACE_H = 86;

const isWall = (tx: number, ty: number) => "#ND".includes(tileAt(tx, ty));

/** Mặt tường có ai nhìn thấy: ô phía trước mặt đó không phải tường. */
export function faceVisible(tx: number, ty: number, face: LampFace) {
  return isWall(tx, ty) && !(face === "y" ? isWall(tx, ty + 1) : isWall(tx + 1, ty));
}

/** Dãy ô tường liền nhau cùng nhìn thấy mặt `face`, theo thứ tự tăng dần của trục chạy dọc mặt. */
export function faceRun(tx: number, ty: number, face: LampFace): number[] {
  const along = (i: number) => (face === "y" ? faceVisible(i, ty, face) : faceVisible(tx, i, face));
  let a = face === "y" ? tx : ty;
  while (along(a - 1)) a--;
  const out: number[] = [];
  for (let i = a; along(i); i++) out.push(i);
  return out;
}

/** Tâm đế đèn trên màn hình thiết kế. */
export function lampAnchor(s: LampSpot) {
  const c = toScreen(s.tx + 0.5, s.ty + 0.5);
  const top = c.sy - 81;
  const u = s.along * TW / 2;
  return s.face === "y"
    ? { x: c.sx - TW / 2 + u, y: top + u * (TH / TW) + s.hang }
    : { x: c.sx + u, y: top + TH / 2 - u * (TH / TW) + s.hang };
}

/** Điểm trên sàn cách chân tường `out` ô, thẳng dưới đèn, toạ độ thế giới. */
export function lampFloor(s: LampSpot, out: number) {
  return s.face === "y"
    ? { wx: s.tx + s.along, wy: s.ty + 1 + out }
    : { wx: s.tx + 1 + out, wy: s.ty + 1 - s.along };
}

const smooth = (a: number, b: number, t: number) => {
  const k = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/** Mức sáng đèn 0..1: rõ lúc mở quán, mờ nhất quanh giữa buổi khi nắng lên, nhích lại về cuối. */
export function lampLevel(minutes: number, overcast = false) {
  const t = Math.min(1, Math.max(0, (minutes - DAY_START_MIN) / (DAY_END_MIN - DAY_START_MIN)));
  const dim = 0.25;
  const base = t < 0.65 ? 1 - (1 - dim) * smooth(0, 0.65, t) : dim + 0.15 * smooth(0.65, 1, t);
  return Math.min(1, base + (overcast ? 0.2 : 0));
}

export const OVEN_IDLE = 0.35;
export const OVEN_BUSY = 0.8;

export const ovenTarget = (busy: boolean) => (busy ? OVEN_BUSY : OVEN_IDLE);

/** Tiến `cur` về `target` theo hàm mũ, hằng thời gian `tauMs`. */
export function easeLevel(cur: number, target: number, dtMs: number, tauMs = 450) {
  return target + (cur - target) * Math.exp(-Math.max(0, dtMs) / tauMs);
}
