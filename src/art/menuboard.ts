import Phaser from "phaser";
import { TH, depthOf } from "../world/iso";
import { FACE_SLOPE } from "./canvas";
import { WALL_H } from "./building";
import { artScale, bakeWall, drawFrame } from "./photo";
import { WALL_OVERHANG, sliceColumns } from "./slices";
import { FONT } from "../ui/theme";
import { MENU_BOARD } from "../sim/menu";
import { isOpen } from "../sim/unlock";

const W = 70;
const H = 52;
/** Px từ mép trên tường, đo dọc mặt vách. */
const DROP = 33;
const TILT = 0.015;
const GOLD = "#f8d978";
const CREAM = "#ffe9b8";
/** Bề dày khung gỗ, và lề trái của chữ tính từ mép bảng. */
const BORDER = 6;
const LEFT = 11;
const TEX = "menu_wall";

/** Lát `m` dán trên mặt ô tường (m + 1, 0): ngay trên ô đó, dưới người đứng trước tường. */
const onWall = (m: number) => depthOf(m + 1.5, 0.5) + 50;

export function createMenuBoard(scene: Phaser.Scene, sx: number, sy: number, day: number) {
  bakeWall(scene, TEX, W, H, FACE_SLOPE + TILT, (ctx) => {
    drawFrame(ctx, scene, "menu_khung", W, H, 46, BORDER);

    ctx.textBaseline = "middle";
    ctx.fillStyle = GOLD;
    ctx.font = `800 8px ${FONT}`;
    ctx.fillText("BÁNH MÌ", LEFT, 14);
    ctx.fillRect(LEFT, 18.5, 31, 0.7);

    // Chỉ ghi tên món, không ghi giá: cỡ chữ này thêm cột số là nhoè; giá xem ở bảng bấm E.
    const COT = 4;
    ctx.font = `500 5.6px ${FONT}`;
    ctx.fillStyle = CREAM;
    MENU_BOARD.filter((it) => isOpen(it.id, day)).forEach((it, i) => {
      ctx.fillText(it.call, LEFT + Math.floor(i / COT) * 32, 24 + (i % COT) * 5.9);
    });
  });

  const cy = sy - WALL_H + TH / 2 + DROP;
  const src = scene.textures.get(TEX).getSourceImage();
  const w = src.width / artScale(TEX), h = src.height / artScale(TEX);
  return sliceColumns(scene, TEX, sx - w / 2, cy - h / 2, w, onWall, -WALL_OVERHANG).map((s) => s.img);
}
