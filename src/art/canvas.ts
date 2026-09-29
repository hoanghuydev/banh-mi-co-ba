import Phaser from "phaser";
import { TW, TH } from "../world/iso";

/**
 * Bút vẽ dùng chung cho mọi file trong `art/`.
 * Không file art nào được tự bịa ra quy ước đặt sprite — tất cả đi qua `prop()`.
 *
 * ── Quy ước đặt sprite (một luật cho mọi thứ) ─────────────────────────────────
 * 1. Mọi texture dùng origin (0.5, 1) và đặt tại điểm màn hình `footY(sy)`.
 * 2. Trong texture, TÂM HÌNH THOI của ô nằm ở local y = H - 1 - BASE - TH/2.
 * 3. ĐIỂM CHẠM ĐẤT của mọi vật là tâm hình thoi đó — KHÔNG phải đáy texture.
 *    Đáy texture là đáy của lớp mặt đường dày `BASE`, nằm thấp hơn mặt đất.
 *
 * Vi phạm (3) là lý do vật bị "lơ lửng" và bóng đổ rơi lệch xuống dưới chân.
 * Cứ dùng `standing()` cho đạo cụ thì không phải nhớ gì thêm.
 */

/** Độ dày lớp mặt đường — hằng số duy nhất nối texture với chỗ đặt sprite. */
export const BASE = 6;

/** Điểm chân: nơi đặt mọi sprite đứng trên ô có tâm màn hình (sx, sy). */
export function footY(sy: number) {
  return sy + TH / 2 + BASE;
}

export type Pen = Phaser.GameObjects.Graphics;

export function shade(color: number, amount: number) {
  const c = Phaser.Display.Color.IntegerToColor(color);
  return amount >= 0 ? c.lighten(amount).color : c.darken(-amount).color;
}

/** Hình thoi = mặt trên của một ô. */
export function diamond(g: Pen, cx: number, cy: number, w: number, h: number) {
  g.fillPoints([
    { x: cx, y: cy - h / 2 }, { x: cx + w / 2, y: cy },
    { x: cx, y: cy + h / 2 }, { x: cx - w / 2, y: cy },
  ], true);
}

/**
 * Khối hộp iso: mặt trên hình thoi + hai mặt bên tối dần.
 * Viên gạch của gần như mọi thứ trong hẻm.
 */
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

/**
 * Vật ĐỨNG TRÊN ô: mặt đáy của khối trùng khít với mặt ô (tâm hình thoi `cy`).
 *
 * Dùng cái này cho mọi đạo cụ. `isoBox` trần chỉ dành cho NỀN và TƯỜNG —
 * hai thứ cố ý ăn xuống dưới mặt đất thêm `BASE` px.
 */
export function standing(
  g: Pen, cx: number, cy: number, height: number, top: number,
  w = TW, h = TH, sideTint = 0,
) {
  isoBox(g, cx, cy - height, height, top, w, h, sideTint);
}

/**
 * Toạ độ NẰM TRONG mặt vách của một khối iso.
 *
 * Khối iso lộ ra hai mặt đứng. Mỗi mặt là một hình bình hành nghiêng, nên mọi thứ
 * "dán lên tường" (cửa, cửa sổ, bảng hiệu) phải nghiêng theo — vẽ hình chữ nhật
 * thẳng đứng lên đó là nhìn ra ngay như miếng sticker dán đè, không ăn nhập mặt tường.
 *
 *  · `"left"`  mặt hướng +y (quay về phía người xem), dốc XUỐNG BÊN PHẢI
 *  · `"right"` mặt hướng +x, dốc XUỐNG BÊN TRÁI
 *
 * Trả về hàm đổi (u, v) -> điểm màn hình: `u` chạy dọc mặt (0 → TW/2),
 * `v` chạy thẳng đứng xuống dưới tính từ mép trên của mặt.
 */
export type Face = "left" | "right";

export const FACE_SLOPE = TH / TW;

export function facePoint(face: Face, cx: number, cyTop: number) {
  const slope = face === "left" ? FACE_SLOPE : -FACE_SLOPE;
  const x0 = face === "left" ? cx - TW / 2 : cx;
  const y0 = face === "left" ? cyTop : cyTop + TH / 2;
  return (u: number, v: number) => ({ x: x0 + u, y: y0 + u * slope + v });
}

/** Hình chữ nhật nằm trong mặt vách, từ (u0,v0) tới (u1,v1). */
export function faceRect(
  g: Pen, at: (u: number, v: number) => { x: number; y: number },
  u0: number, u1: number, v0: number, v1: number, color: number, alpha = 1,
) {
  g.fillStyle(color, alpha);
  g.fillPoints([at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)], true);
}

/** Viền tối mảnh quanh một hình tròn/ê-líp — mẹo rẻ tiền làm art code nhìn có chủ ý. */
export function blob(g: Pen, cx: number, cy: number, w: number, h: number, color: number, edge = 3) {
  g.fillStyle(shade(color, -34), 1);
  g.fillEllipse(cx, cy, w + edge, h + edge);
  g.fillStyle(color, 1);
  g.fillEllipse(cx, cy, w, h);
}

/** Như `blob` nhưng cho chữ nhật bo góc. */
export function slab(
  g: Pen, x: number, y: number, w: number, h: number, r: number, color: number, edge = 2.5,
) {
  g.fillStyle(shade(color, -34), 1);
  g.fillRoundedRect(x - edge / 2, y - edge / 2, w + edge, h + edge, r + edge / 2);
  g.fillStyle(color, 1);
  g.fillRoundedRect(x, y, w, h, r);
}

/**
 * Nướng một texture theo đúng quy ước trên.
 * `draw` nhận (g, cx, cy) với (cx, cy) là TÂM HÌNH THOI của ô mà vật đứng lên.
 */
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

/** Chiều cao texture cho một vật cao `lift` px đứng trên ô. */
export function heightFor(lift: number) {
  return TH + lift + BASE + 2;
}
