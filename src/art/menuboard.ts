import Phaser from "phaser";
import { TH } from "../world/iso";
import { FACE_SLOPE } from "./canvas";
import { WALL_H } from "./building";
import { bakeWall, fitPhoto } from "./photo";
import { FONT } from "../ui/theme";
import { MENU_BOARD } from "../sim/menu";
import { isOpen } from "../sim/unlock";

// Treo cao vì cả tấm chỉ có một depth nên thấp là bị người chơi che.
const W = 70;
const H = 52;
/** Px từ mép trên tường, đo dọc mặt vách. */
const DROP = 33;
const TILT = 0.015;
const INK = "#7f261c";
const TEX = "menu_wall";

export function createMenuBoard(scene: Phaser.Scene, sx: number, sy: number, depth: number, day: number) {
  bakeWall(scene, TEX, W, H, FACE_SLOPE + TILT, (ctx) => {
    ctx.fillStyle = "#9a9087";
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 3);
    ctx.fill();
    ctx.fillStyle = "#f4ecda";
    ctx.beginPath();
    ctx.roundRect(2, 2, W - 4, H - 4, 2);
    ctx.fill();
    ctx.strokeStyle = "#b0443a";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.roundRect(4, 4, W - 8, H - 8, 1.5);
    ctx.stroke();

    ctx.textBaseline = "middle";
    ctx.fillStyle = INK;
    ctx.font = `800 8px ${FONT}`;
    ctx.fillText("BÁNH MÌ", 8, 11);
    ctx.fillRect(8, 15.5, 31, 0.7);

    // Chỉ ghi tên món, không ghi giá: cỡ chữ này thêm cột số là nhoè; giá xem ở bảng bấm E.
    const COT = 4;
    ctx.font = `500 5.6px ${FONT}`;
    ctx.fillStyle = "#3a2b27";
    MENU_BOARD.filter((it) => isOpen(it.id, day)).forEach((it, i) => {
      ctx.fillText(it.call, 8 + Math.floor(i / COT) * 34, 21.5 + (i % COT) * 6.2);
    });
  });

  const cy = sy - WALL_H + TH / 2 + DROP;
  return [fitPhoto(scene.add.image(sx, cy, TEX)).setDepth(depth)];
}
