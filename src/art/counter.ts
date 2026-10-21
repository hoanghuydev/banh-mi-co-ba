import Phaser from "phaser";
import { TW, TH } from "../world/iso";
import { PAL } from "./palette";
import { BASE, diamond, heightFor, prop, shade, slab, standing, type Pen } from "./canvas";

// Quầy ghép từ mô-đun một ô; tủ kính có 2 biến thể bày bên trong để dãy dài không lộ tile lặp.
const BODY = 32;
// Không hạ dưới 24, kẻo bảng giá trong tủ (cao tới `base − 22`) chọc thủng nóc kính.
const CASE = 25;

export const COUNTER = {
  end: "counter_end",
  case: (i: number) => `counter_case${i}`,
  CASE_COUNT: 2,
  work: "counter_work",
  // Px từ đáy sprite lên mặt quầy (`prop()` đặt mặt đất ở `height − 1 − BASE − TH/2`, `body()` cộng `BODY`); đặt vật lên quầy phải dùng hằng này.
  TOP_ABOVE_FOOT: 1 + BASE + TH / 2 + BODY,
} as const;

function loaf(g: Pen, x: number, y: number, s = 1) {
  g.fillStyle(PAL.breadDark, 1);
  g.fillEllipse(x, y, 20 * s, 8 * s);
  g.fillStyle(PAL.bread, 1);
  g.fillEllipse(x, y - 1.2 * s, 17 * s, 6 * s);
  g.fillStyle(PAL.breadSlash, 0.9);
  g.fillRect(x - 5 * s, y - 3 * s, 10 * s, 1.3 * s);
}

// Mặt gỗ tràn hết ô để các khúc nối thành một mặt quầy liền.
function body(g: Pen, cx: number, cy: number) {
  standing(g, cx, cy, BODY, PAL.counterTile);

  const top = cy - BODY;
  g.fillStyle(PAL.counterBase, 0.85);
  g.fillRect(cx - TW / 2, cy - 5, TW / 2, 5);
  g.fillRect(cx, cy + TH / 2 - 5, TW / 2, 5);

  g.fillStyle(shade(PAL.counterTile, -22), 0.5);
  for (let d = 10; d < BODY; d += 11) {
    g.fillRect(cx - TW / 2, cy - BODY + TH / 2 + d, TW / 2, 1.2);
    g.fillRect(cx, cy - BODY + TH + d - 2, TW / 2, 1.2);
  }
  g.fillStyle(shade(PAL.counterTile, 16), 0.45);
  g.fillRect(cx - TW / 2, cy - BODY + TH / 2, TW / 2, 1.6);

  g.fillStyle(PAL.counterBoard, 1);
  diamond(g, cx, top, TW, TH);
  g.fillStyle(PAL.counterBoardDark, 0.32);
  for (const dy of [-5, 0, 5]) g.fillRect(cx - 16, top + dy, 32, 1);
}

function counterEnd(scene: Phaser.Scene) {
  prop(scene, COUNTER.end, heightFor(BODY + 30), (g, cx, cy) => {
    // Rổ bánh là ảnh thật do `StallScene.addOnCounter` đặt, không nướng vào texture.
    body(g, cx, cy);
  });
}

// Tủ rộng đúng một ô nên trụ nhôm hai khúc liền nhau trùng khít.
function counterCase(scene: Phaser.Scene, variant: number) {
  prop(scene, COUNTER.case(variant), heightFor(BODY + CASE), (g, cx, cy) => {
    body(g, cx, cy);

    const base = cy - BODY;
    const top = base - CASE;

    if (variant === 0) {
      // Bánh to và chồng lên vì qua hai lớp kính màu nhạt đi một nửa.
      loaf(g, cx - 10, base - 4, 0.8);
      loaf(g, cx + 9, base - 6, 0.8);
      loaf(g, cx - 2, base - 10, 0.76);
      loaf(g, cx + 8, base - 13, 0.7);
    } else {
      slab(g, cx - 19, base - 9, 17, 8, 1.5, 0xe6e0d0, 2);
      g.fillStyle(PAL.pate, 1);
      g.fillEllipse(cx - 10.5, base - 9, 12, 4.5);
      slab(g, cx + 2, base - 12, 16, 8, 1.5, 0xe6e0d0, 2);
      g.fillStyle(0xe8ddc4, 1);
      g.fillEllipse(cx + 10, base - 12, 11, 4.5);
      g.fillStyle(PAL.chilli, 1);
      g.fillEllipse(cx + 13, base - 13.5, 4, 2.5);

      slab(g, cx - 4, base - 22, 15, 10, 1.5, PAL.paper, 1.5);
      g.fillStyle(PAL.signRed, 0.85);
      g.fillRect(cx - 1.5, base - 19.5, 10, 2);
      g.fillStyle(PAL.ink, 0.4);
      g.fillRect(cx - 1.5, base - 16, 7, 1.4);
    }

    g.fillStyle(PAL.glass, 0.34);
    g.fillPoints([
      { x: cx - TW / 2, y: top }, { x: cx, y: top + TH / 2 },
      { x: cx, y: base + TH / 2 }, { x: cx - TW / 2, y: base },
    ], true);
    g.fillStyle(PAL.glass, 0.5);
    g.fillPoints([
      { x: cx + TW / 2, y: top }, { x: cx, y: top + TH / 2 },
      { x: cx, y: base + TH / 2 }, { x: cx + TW / 2, y: base },
    ], true);
    g.fillStyle(PAL.glass, 0.62);
    diamond(g, cx, top, TW, TH);

    g.fillStyle(0xffffff, 0.16);
    g.fillPoints([
      { x: cx + 6, y: base + TH / 2 - 4 }, { x: cx + 14, y: top + 8 },
      { x: cx + 21, y: top + 11 }, { x: cx + 13, y: base + TH / 2 - 2 },
    ], true);

    g.lineStyle(1.6, PAL.glassFrame, 0.9);
    g.beginPath();
    g.moveTo(cx - TW / 2, top); g.lineTo(cx, top - TH / 2);
    g.lineTo(cx + TW / 2, top); g.lineTo(cx, top + TH / 2);
    g.closePath(); g.strokePath();
    for (const dx of [-TW / 2, TW / 2]) g.lineBetween(cx + dx, top, cx + dx, base);
  });
}

// Giữa thớt cố ý để trống cho khách thấy tay mình làm.
function counterWork(scene: Phaser.Scene) {
  prop(scene, COUNTER.work, heightFor(BODY + 22), (g, cx, cy) => {
    body(g, cx, cy);
    const top = cy - BODY;

    slab(g, cx - 24, top - 13, 15, 9, 2, 0xe9e4d6, 2);
    g.fillStyle(PAL.pickle, 0.9);
    g.fillEllipse(cx - 16.5, top - 13, 10, 4);

    slab(g, cx - 6, top - 16, 15, 10, 2, 0xd8cdb4, 2);
    g.fillStyle(PAL.pate, 1);
    g.fillEllipse(cx + 1.5, top - 16, 10, 4);

    g.fillStyle(0xf2efe6, 1);
    g.fillEllipse(cx + 14, top - 10, 13, 6);
    g.fillStyle(PAL.chilli, 1);
    g.fillEllipse(cx + 14, top - 10.5, 8, 3.5);

    g.lineStyle(2.4, PAL.chrome, 1);
    g.lineBetween(cx + 4, top + 6, cx + 22, top - 1);
    g.lineStyle(2.4, PAL.doorWoodDark, 1);
    g.lineBetween(cx - 2, top + 8, cx + 5, top + 5.5);
  });
}

export function buildCounter(scene: Phaser.Scene) {
  counterEnd(scene);
  for (let i = 0; i < COUNTER.CASE_COUNT; i++) counterCase(scene, i);
  counterWork(scene);
}
