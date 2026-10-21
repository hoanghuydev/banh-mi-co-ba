import Phaser from "phaser";
import { TW, TH } from "../world/iso";

// Texture origin (0.5, 1) đặt tại `footY(sy)`; điểm chạm đất là tâm hình thoi (y = H - 1 - BASE - TH/2), không phải đáy texture.

/** Độ dày lớp mặt đường — nối texture với chỗ đặt sprite. */
export const BASE = 6;

export function footY(sy: number) {
  return sy + TH / 2 + BASE;
}

export type Pen = Phaser.GameObjects.Graphics;

export function shade(color: number, amount: number) {
  const c = Phaser.Display.Color.IntegerToColor(color);
  return amount >= 0 ? c.lighten(amount).color : c.darken(-amount).color;
}

export function diamond(g: Pen, cx: number, cy: number, w: number, h: number) {
  g.fillPoints([
    { x: cx, y: cy - h / 2 }, { x: cx + w / 2, y: cy },
    { x: cx, y: cy + h / 2 }, { x: cx - w / 2, y: cy },
  ], true);
}

export function isoBox(
  g: Pen, cx: number, cy: number, lift: number, top: number,
  w = TW, h = TH, sideTint = 0,
) {
  g.fillStyle(shade(top, -32 + sideTint), 1);           // mặt bên trái (khuất nắng)
  g.fillPoints([
    { x: cx - w / 2, y: cy }, { x: cx, y: cy + h / 2 },
    { x: cx, y: cy + h / 2 + lift }, { x: cx - w / 2, y: cy + lift },
  ], true);
  g.fillStyle(shade(top, -16 + sideTint), 1);           // mặt bên phải
  g.fillPoints([
    { x: cx + w / 2, y: cy }, { x: cx, y: cy + h / 2 },
    { x: cx, y: cy + h / 2 + lift }, { x: cx + w / 2, y: cy + lift },
  ], true);
  g.fillStyle(top, 1);                                  // mặt trên
  diamond(g, cx, cy, w, h);
}

/** Dùng cho mọi đạo cụ; `isoBox` trần chỉ cho nền và tường (cố ý ăn xuống `BASE` px). */
export function standing(
  g: Pen, cx: number, cy: number, height: number, top: number,
  w = TW, h = TH, sideTint = 0,
) {
  isoBox(g, cx, cy - height, height, top, w, h, sideTint);
}

/** `"left"` hướng +y, dốc xuống bên phải; `"right"` hướng +x, dốc xuống bên trái. */
export type Face = "left" | "right";

export const FACE_SLOPE = TH / TW;

/** (u, v) → điểm màn hình nằm trong mặt vách: `u` dọc mặt (0 → TW/2), `v` thẳng đứng xuống từ mép trên. */
export function facePoint(face: Face, cx: number, cyTop: number) {
  const slope = face === "left" ? FACE_SLOPE : -FACE_SLOPE;
  const x0 = face === "left" ? cx - TW / 2 : cx;
  const y0 = face === "left" ? cyTop : cyTop + TH / 2;
  return (u: number, v: number) => ({ x: x0 + u, y: y0 + u * slope + v });
}

export function faceRect(
  g: Pen, at: (u: number, v: number) => { x: number; y: number },
  u0: number, u1: number, v0: number, v1: number, color: number, alpha = 1,
) {
  g.fillStyle(color, alpha);
  g.fillPoints([at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)], true);
}

export function blob(g: Pen, cx: number, cy: number, w: number, h: number, color: number, edge = 3) {
  g.fillStyle(shade(color, -34), 1);
  g.fillEllipse(cx, cy, w + edge, h + edge);
  g.fillStyle(color, 1);
  g.fillEllipse(cx, cy, w, h);
}

export function slab(
  g: Pen, x: number, y: number, w: number, h: number, r: number, color: number, edge = 2.5,
) {
  g.fillStyle(shade(color, -34), 1);
  g.fillRoundedRect(x - edge / 2, y - edge / 2, w + edge, h + edge, r + edge / 2);
  g.fillStyle(color, 1);
  g.fillRoundedRect(x, y, w, h, r);
}

/** (cx, cy) truyền cho `draw` là tâm hình thoi của ô mà vật đứng lên. */
export function prop(
  scene: Phaser.Scene, key: string, height: number,
  draw: (g: Pen, cx: number, cy: number) => void,
  width = TW + 2,
) {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g, width / 2, height - 1 - BASE - TH / 2);
  g.generateTexture(key, width, height);
  g.destroy();
}

export function heightFor(lift: number) {
  return TH + lift + BASE + 2;
}
