import Phaser from "phaser";
import { TH, TW } from "../world/iso";
import { PAL } from "./palette";
import { FACE_SLOPE, shade } from "./canvas";
import { WALL_H } from "./building";
import { FONT } from "../ui/theme";

/**
 * Bảng hiệu đỏ chữ vàng (CANON §14), gắn trên MẶT VÁCH của tường sau quán.
 *
 * Không phải texture mà là object trong scene, vì nó trải ngang qua nhiều ô tường.
 * Điểm mấu chốt: bảng phải NẰM TRONG mặt phẳng tường, nên
 *  · tấm bảng là hình bình hành nghiêng theo đúng độ dốc của vách (TH/TW),
 *  · chữ xoay đúng góc đó (atan(TH/TW) ≈ 26,6°),
 *  · và nó treo dưới mép trên của vách chứ không lơ lửng ngoài không khí.
 * Vẽ tấm chữ nhật thẳng đứng lên đây là ra ngay cảm giác sticker dán đè.
 */
const HALF_W = 78;
const HALF_H = 18;
/** Cách mép trên của tường bao nhiêu px, đo dọc theo mặt vách. */
const DROP = 26;

export function createSign(scene: Phaser.Scene, sx: number, sy: number, depth: number) {
  // Mép trên mặt vách "left" tại hoành độ sx (xem `facePoint` ở art/canvas.ts).
  const cy = sy - WALL_H + TH / 2 + DROP;
  const at = (u: number, v: number) => ({ x: sx + u, y: cy + u * FACE_SLOPE + v });
  const quad = (u0: number, u1: number, v0: number, v1: number) =>
    [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)];

  const g = scene.add.graphics().setDepth(depth);
  g.fillStyle(0x2f2a26, 0.25);                         // bóng bảng hắt lên tường
  g.fillPoints(quad(-HALF_W + 3, HALF_W + 3, -HALF_H + 4, HALF_H + 4), true);
  g.fillStyle(PAL.signRedDark, 1);
  g.fillPoints(quad(-HALF_W, HALF_W, -HALF_H, HALF_H), true);
  g.fillStyle(PAL.signRed, 1);
  g.fillPoints(quad(-HALF_W + 2, HALF_W - 2, -HALF_H + 2, HALF_H - 2), true);
  g.lineStyle(1.4, shade(PAL.signRed, 20), 0.85);
  g.strokePoints(quad(-HALF_W + 6, HALF_W - 6, -HALF_H + 5, HALF_H - 5), true, true);

  const mid = at(0, 0);
  const t = scene.add.text(mid.x, mid.y, "BÁNH MÌ CÔ BA", {
    fontFamily: FONT, fontSize: "18px", fontStyle: "700",
    color: Phaser.Display.Color.IntegerToColor(PAL.signYellow).rgba,
  })
    .setOrigin(0.5)
    .setRotation(Math.atan2(TH, TW))                   // nằm đúng trong mặt phẳng tường
    .setDepth(depth + 1);

  return [g, t] as const;
}
