import Phaser from "phaser";
import { TH, TW } from "../world/iso";
import { PAL } from "./palette";
import { FACE_SLOPE, shade } from "./canvas";
import { WALL_H } from "./building";
import { FONT } from "../ui/theme";
import { MENU_BOARD } from "../sim/menu";
import { isOpen } from "../sim/unlock";

// Bảng là hình bình hành theo độ dốc vách (như `art/sign.ts`), treo cao vì cả tấm chỉ có một depth nên thấp là bị người chơi che.
const HALF_W = 40;
const HALF_H = 24;
/** Px từ mép trên tường, đo dọc mặt vách. */
const DROP = 28;
const TILT = 0.015;

export function createMenuBoard(scene: Phaser.Scene, sx: number, sy: number, depth: number, day: number) {
  const cy = sy - WALL_H + TH / 2 + DROP;
  const at = (u: number, v: number) => ({ x: sx + u, y: cy + u * FACE_SLOPE + v + u * TILT });
  const quad = (u0: number, u1: number, v0: number, v1: number) =>
    [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)];

  const g = scene.add.graphics().setDepth(depth);
  g.fillStyle(0x2f2a26, 0.25);                                   // bóng hắt lên vách
  g.fillPoints(quad(-HALF_W + 3, HALF_W + 3, -HALF_H + 4, HALF_H + 4), true);
  g.fillStyle(0x6f6256, 1);                                      // mép tôn gỉ
  g.fillPoints(quad(-HALF_W, HALF_W, -HALF_H, HALF_H), true);
  g.fillStyle(PAL.signRedDark, 1);
  g.fillPoints(quad(-HALF_W + 2, HALF_W - 2, -HALF_H + 2, HALF_H - 2), true);
  g.fillStyle(PAL.signRed, 1);
  g.fillPoints(quad(-HALF_W + 4, HALF_W - 4, -HALF_H + 4, HALF_H - 4), true);
  g.fillStyle(shade(PAL.signRed, -14), 0.5);
  g.fillPoints(quad(HALF_W - 19, HALF_W - 7, HALF_H - 10, HALF_H - 5), true);

  const rot = Math.atan2(TH, TW) + TILT;
  const line = (u: number, v: number, text: string, size: number, weight: "500" | "700") => {
    const p = at(u, v);
    return scene.add.text(p.x, p.y, text, {
      fontFamily: FONT, fontSize: `${size}px`, fontStyle: weight,
      color: Phaser.Display.Color.IntegerToColor(PAL.signYellow).rgba,
    }).setOrigin(0, 0.5).setRotation(rot).setDepth(depth + 1);
  };

  const objs: Phaser.GameObjects.GameObject[] = [g];
  objs.push(line(-HALF_W + 7, -HALF_H + 8, "BÁNH MÌ", 7, "700"));
  g.lineStyle(1.2, PAL.signYellow, 0.65);
  g.strokePoints([at(-HALF_W + 7, -HALF_H + 13), at(-HALF_W + 38, -HALF_H + 13.6)], false, false);

  // Chỉ ghi tên món, không ghi giá: cỡ chữ này thêm cột số là nhoè; giá xem ở bảng bấm E.
  const COT = 4;                                                  // mỗi cột mấy dòng
  MENU_BOARD.filter((it) => isOpen(it.id, day)).forEach((it, i) => {
    const cot = Math.floor(i / COT), hang = i % COT;
    const jitter = [0, 1.1, -0.7, 0.5][hang];
    objs.push(line(-HALF_W + 7 + jitter + cot * 36, -HALF_H + 19 + hang * 6.5,
      it.call, 6, "500"));
  });

  return objs;
}
