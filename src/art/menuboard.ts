import Phaser from "phaser";
import { TH, TW } from "../world/iso";
import { PAL } from "./palette";
import { FACE_SLOPE, shade } from "./canvas";
import { WALL_H } from "./building";
import { FONT } from "../ui/theme";
import { MENU_BOARD } from "../sim/menu";

/**
 * BẢNG MENU TREO VÁCH — tấm tôn sơn tay, treo cạnh bảng hiệu.
 *
 * Tấm này phải TRÔNG RA LÀ VẼ TAY: nghiêng chừng một độ, chữ không đều cột, một vệt sơn
 * lem ở góc, mép tôn gỉ.
 *
 * Cùng kỹ thuật với `art/sign.ts`: bảng phải NẰM TRONG mặt phẳng vách, nên tấm bảng là
 * hình bình hành nghiêng đúng độ dốc của vách và chữ xoay đúng góc đó. Vẽ chữ nhật thẳng
 * đứng lên đây là ra ngay cảm giác sticker dán đè.
 *
 * Ở xa thì đây chỉ là một mảng đỏ có mấy dòng vàng — ĐỌC được thì phải tới gần và bấm E
 * (`ui/menu/MenuBoardView`). Tấm trên vách là cái MỜI, không phải cái để đọc.
 */
/**
 * NẰM NGANG, hai cột — bảng tôn ngoài đời là một tấm chữ nhật nằm, không phải một cột dọc.
 * Và nó phải TREO CAO: thấp xuống một chút là người chơi đứng ngay dưới nó che mất, mà
 * `depthOf` không cứu được (tấm bảng trải qua ba ô tường, mỗi ô một độ sâu khác nhau, nên
 * nó chỉ có đúng MỘT depth cho cả tấm). Treo trên tầm đầu là hết chuyện.
 */
const HALF_W = 40;
const HALF_H = 24;
/** Cách mép trên của tường bao nhiêu px, đo dọc theo mặt vách — ngang tầm bảng hiệu. */
const DROP = 28;
/** Treo bằng một cái đinh nên nó lệch. */
const TILT = 0.015;

export function createMenuBoard(scene: Phaser.Scene, sx: number, sy: number, depth: number) {
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
  // vệt sơn lem ở góc dưới — dấu tay người, không phải lỗi in
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
  // gạch chân vẽ tay: một nét thẳng tay, không phải một đường kẻ
  g.lineStyle(1.2, PAL.signYellow, 0.65);
  g.strokePoints([at(-HALF_W + 7, -HALF_H + 13), at(-HALF_W + 38, -HALF_H + 13.6)], false, false);

  /**
   * Chỉ ghi TÊN MÓN, không ghi giá: ở cỡ chữ này thêm một cột số nữa là một mảng nhoè.
   * Giá nằm trong bảng bấm E — chỗ người chơi thật sự đọc. Tấm trên vách là cái MỜI.
   *
   * Đọc từ `MENU_BOARD` chứ không gõ tay: cái vẽ trên vách và cái `diffDish` chấm điểm
   * phải là một. Thêm một món vào JSON là nó hiện lên vách, khỏi sửa file này — còn món
   * đặt `onBoard: false` thì vẫn gọi được mà không chiếm chỗ trên tấm tôn.
   */
  const COT = 4;                                                  // mỗi cột mấy dòng
  MENU_BOARD.forEach((it, i) => {
    const cot = Math.floor(i / COT), hang = i % COT;
    // mỗi dòng xê dịch một chút — chữ viết tay không bao giờ thẳng cột
    const jitter = [0, 1.1, -0.7, 0.5][hang];
    objs.push(line(-HALF_W + 7 + jitter + cot * 36, -HALF_H + 19 + hang * 6.5,
      it.call, 6, "500"));
  });

  return objs;
}
