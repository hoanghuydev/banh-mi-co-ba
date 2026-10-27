import Phaser from "phaser";
import { TW } from "../world/iso";
import { PAL } from "./palette";
import { BASE, faceRect, facePoint, heightFor, isoBox, prop, shade, type Face, type Pen } from "./canvas";

// Tường có 6 biến thể để 16 ô liền nhau không lộ nhịp lặp texture.
export const BUILD = {
  wall: (i: number) => `b_wall${i}`,
  WALL_COUNT: 6,
  door: "b_door",
  neighbour: (i: number) => `b_neighbour${i}`,
  NEIGHBOUR_COUNT: 4,
} as const;

export const WALL_H = 80;

const TILE_BAND = WALL_H + BASE - 26;

function wallBody(g: Pen, cx: number, cy: number, top: number) {
  // `isoBox` trần ăn xuống thêm `BASE` px để chân tường liền mặt đường, không hở khe.
  isoBox(g, cx, cy - WALL_H, WALL_H + BASE, top);

  const cyTop = cy - WALL_H;
  for (const face of ["left", "right"] as Face[]) {
    const at = facePoint(face, cx, cyTop);

    faceRect(g, at, 0, TW / 2, 0, 4.5, shade(top, -26), 0.55);       // gờ mái
    faceRect(g, at, 0, TW / 2, 4.5, 6, shade(top, 14), 0.4);

    for (let v = 24; v < TILE_BAND; v += 26) {                       // mạch vữa ngang
      faceRect(g, at, 0, TW / 2, v, v + 1.6, shade(top, -10), 0.4);
    }

    // dải gạch men ốp chân tường
    faceRect(g, at, 0, TW / 2, TILE_BAND, WALL_H + BASE, PAL.wallTile, 0.9);
    faceRect(g, at, 0, TW / 2, TILE_BAND, TILE_BAND + 1.6, shade(PAL.wallTile, 20), 0.9);
    for (let u = 0; u < TW / 2; u += 9) {                            // mạch gạch dọc
      faceRect(g, at, u, u + 1, TILE_BAND + 2, WALL_H + BASE, PAL.wallTileJoint, 0.55);
    }
    faceRect(g, at, 0, TW / 2, WALL_H + BASE - 7, WALL_H + BASE, PAL.wallMoss, 0.22);  // rêu chân tường
  }
}

function meter(g: Pen, at: (u: number, v: number) => { x: number; y: number }) {
  const U0 = 9, U1 = 22, V0 = 20, V1 = 38;
  faceRect(g, at, U0 - 1.5, U1 + 1.5, V0 - 1.5, V1 + 1.5, shade(PAL.meterBox, -34));
  faceRect(g, at, U0, U1, V0, V1, PAL.meterBox);
  faceRect(g, at, U0 + 2.5, U1 - 2.5, V0 + 3, V0 + 11, PAL.meterGlass);
  faceRect(g, at, U0 + 3.5, U1 - 6, V0 + 5.5, V0 + 7, PAL.paper, 0.85);   // mặt số
  faceRect(g, at, U0 + 2.5, U1 - 2.5, V1 - 4, V1 - 2.5, shade(PAL.meterBox, -22));

  g.lineStyle(1.6, PAL.wire, 0.85);                                  // dây điện bò xuống
  const a = at(U1 - 4, V1), b = at(U1 - 2, V1 + 14), c = at(U1 + 4, TILE_BAND - 2);
  g.lineBetween(a.x, a.y, b.x, b.y);
  g.lineBetween(b.x, b.y, c.x, c.y);
}

function smallWindow(g: Pen, at: (u: number, v: number) => { x: number; y: number }) {
  const U0 = 6, U1 = TW / 2 - 6, V0 = 22, V1 = 50;
  faceRect(g, at, U0 - 2, U1 + 2, V0 - 2, V1 + 2, PAL.windowFrame);
  faceRect(g, at, U0, U1, V0, V1, PAL.window);
  faceRect(g, at, U0, U1, V0, V0 + 9, shade(PAL.window, 18), 0.7);   // trời phản chiếu
  for (let u = U0 + 3; u < U1; u += 5) {                             // song sắt
    faceRect(g, at, u, u + 1.4, V0, V1, shade(PAL.wire, 26), 0.8);
  }
  faceRect(g, at, U0 - 4, U1 + 4, V1 + 2, V1 + 5.5, PAL.windowFrame);   // bệ cửa sổ

  const pot = at(U0 + 6, V1 + 2);                                    // chậu cây con trên bệ
  g.fillStyle(PAL.potDark, 1);
  g.fillRect(pot.x - 4.5, pot.y - 5, 9, 5);
  g.fillStyle(PAL.leafDark, 1);
  g.fillEllipse(pot.x, pot.y - 8, 12, 8);
  g.fillStyle(PAL.leaf, 1);
  g.fillEllipse(pot.x - 1, pot.y - 9, 9, 6);
}

function poster(g: Pen, at: (u: number, v: number) => { x: number; y: number }) {
  const U0 = 8, U1 = 22, V0 = 24, V1 = 50;
  faceRect(g, at, U0 - 1, U1 + 1, V0 - 1, V1 + 1, shade(PAL.posterRed, -30), 0.9);
  faceRect(g, at, U0, U1, V0, V1, PAL.posterRed);
  faceRect(g, at, U0 + 1.5, U1 - 1.5, V0 + 6, V1 - 1.5, PAL.posterPaper);
  faceRect(g, at, U0 + 3, U1 - 3, V0 + 2, V0 + 4, PAL.signYellow, 0.9);
  for (let v = V0 + 10; v < V1 - 3; v += 5) {                        // mấy dòng chữ nhỏ
    faceRect(g, at, U0 + 3, U1 - 3, v, v + 1.4, PAL.ink, 0.28);
  }
  faceRect(g, at, TW / 2 - 12, TW / 2 - 7, 6, TILE_BAND, shade(PAL.wallShade, -10), 0.22);  // vệt ố
}

function wall(scene: Phaser.Scene, i: number) {
  prop(scene, BUILD.wall(i), heightFor(WALL_H), (g, cx, cy) => {
    wallBody(g, cx, cy, PAL.wallTop);
    const at = facePoint("left", cx, cy - WALL_H);
    if (i === 1) meter(g, at);
    else if (i === 2) smallWindow(g, at);
    else if (i >= 3) poster(g, at);
  });
}

/** Vẽ trên mặt "left" — mặt duy nhất của hàng tường sau camera thấy. */
function door(scene: Phaser.Scene) {
  prop(scene, BUILD.door, heightFor(WALL_H), (g, cx, cy) => {
    wallBody(g, cx, cy, PAL.wallTop);
    const at = facePoint("left", cx, cy - WALL_H);
    const U0 = 4, U1 = TW / 2 - 4, V0 = 24, V1 = 82;

    faceRect(g, at, U0 - 2, U1 + 2, V0 - 2, V1, PAL.doorFrame);        // khung
    faceRect(g, at, U0 - 2, U1 + 2, V0 - 2, V0 + 1, shade(PAL.doorFrame, -18));
    faceRect(g, at, U0, U1, V0, V1, PAL.doorWood);                     // cánh
    faceRect(g, at, U0 + 2, U1 - 2, V0 + 3, V0 + 22, PAL.doorWoodDark, 0.45);   // hai ô panel
    faceRect(g, at, U0 + 2, U1 - 2, V0 + 27, V0 + 46, PAL.doorWoodDark, 0.45);
    faceRect(g, at, U0, U1, V0, V1, shade(PAL.doorWood, 22), 0.12);

    // rèm hạt buông xuống hai phần ba cửa
    for (let u = U0 + 1.5; u < U1 - 1; u += 3) {
      const len = V0 + 30 + ((u * 7) % 11);
      faceRect(g, at, u, u + 1.4, V0 + 2, len, PAL.beadCurtain, 0.8);
      faceRect(g, at, u, u + 1.4, V0 + 2, len, shade(PAL.beadCurtain, 24), 0.25);
    }

    const knob = at(U0 + 5, V0 + 34);                                  // tay nắm
    g.fillStyle(shade(PAL.chrome, -30), 1);
    g.fillCircle(knob.x, knob.y, 3);
    g.fillStyle(PAL.chrome, 1);
    g.fillCircle(knob.x - 0.4, knob.y - 0.5, 2.2);

    faceRect(g, at, U1 - 10, U1 - 1, V0 - 12, V0 - 4, PAL.paper, 0.9); // số nhà
    faceRect(g, at, U1 - 8, U1 - 3, V0 - 10, V0 - 6, PAL.ink, 0.65);

    const step = at(0, V1);                                            // bậc thềm + đôi dép
    g.fillStyle(shade(PAL.wallShade, -6), 1);
    g.fillEllipse(step.x + TW / 4, step.y + 4, TW * 0.46, 7);
    g.fillStyle(PAL.sandal, 0.9);
    g.fillEllipse(step.x + TW / 4 - 5, step.y + 4, 9, 4);
    g.fillEllipse(step.x + TW / 4 + 5, step.y + 5, 9, 4);
  });
}

/** Vẽ trên mặt "right" vì mặt +y bị khối nhà phía trước che hết. */
function neighbour(scene: Phaser.Scene, i: number) {
  prop(scene, BUILD.neighbour(i), heightFor(WALL_H), (g, cx, cy) => {
    wallBody(g, cx, cy, PAL.neighbour[i % PAL.neighbour.length]);
    const at = facePoint("right", cx, cy - WALL_H);

    if (i === 0) {                                     // cửa cuốn kéo xuống nửa chừng
      const V0 = 34, V1 = 74;
      faceRect(g, at, 3, TW / 2 - 3, V0 - 2, V0, shade(PAL.shutter, -24));
      faceRect(g, at, 4, TW / 2 - 4, V0, V1, PAL.shutter);
      for (let v = V0 + 4; v < V1; v += 6) {           // nan cửa cuốn
        faceRect(g, at, 6, TW / 2 - 6, v, v + 1.8, shade(PAL.shutter, 14), 0.8);
      }
      faceRect(g, at, 8, 17, V0 + 8, V0 + 16, PAL.posterPaper, 0.85);   // tờ rao vặt dán đè
      faceRect(g, at, 9, 16, V0 + 10, V0 + 11.4, PAL.posterRed, 0.7);
    } else if (i === 1) {                              // cửa sổ + dây phơi quần áo
      const V0 = 20, V1 = 48;
      faceRect(g, at, 5, TW / 2 - 5, V0, V1, PAL.windowFrame);
      faceRect(g, at, 8, TW / 2 - 8, V0 + 3, V1 - 3, PAL.window);
      faceRect(g, at, 8, TW / 2 - 8, V0 + 3, V0 + 11, shade(PAL.window, 16), 0.7);
      faceRect(g, at, TW / 4 - 0.7, TW / 4 + 0.7, V0 + 3, V1 - 3, PAL.windowFrame, 0.9);
      faceRect(g, at, 3, TW / 2 - 3, V1, V1 + 3.5, PAL.windowFrame);    // bệ cửa sổ

      g.lineStyle(1.2, PAL.wire, 0.75);                // dây phơi, căng ngay dưới bệ cửa sổ
      const a = at(3, V1 + 8), b = at(TW / 2 - 3, V1 + 11);
      g.lineBetween(a.x, a.y, b.x, b.y);
      const shirts = [0x9fb6c4, 0xd6c9a8, 0xb98f9a];
      shirts.forEach((c, k) => {
        const p = at(7 + k * 8, V1 + 9 + k * 1.1);
        g.fillStyle(shade(c, -26), 1);
        g.fillRoundedRect(p.x - 4, p.y, 8, 11, 2);
        g.fillStyle(c, 1);
        g.fillRoundedRect(p.x - 3.4, p.y, 6.8, 10, 2);
      });
    } else if (i === 2) {                              // cửa cuốn đóng hẳn + hộp thư
      const V0 = 28, V1 = TILE_BAND - 2;
      faceRect(g, at, 3, TW / 2 - 3, V0 - 2, V0, shade(PAL.shutter, -24));
      faceRect(g, at, 4, TW / 2 - 4, V0, V1, shade(PAL.shutter, -8));
      for (let v = V0 + 3; v < V1; v += 5.5) {
        faceRect(g, at, 6, TW / 2 - 6, v, v + 1.6, shade(PAL.shutter, 10), 0.7);
      }
      faceRect(g, at, TW / 2 - 14, TW / 2 - 6, V0 - 14, V0 - 5, PAL.signRed, 0.95);  // hộp thư
      faceRect(g, at, TW / 2 - 13, TW / 2 - 7, V0 - 12, V0 - 10.5, PAL.paper, 0.9);
    } else {                                           // cửa sổ + cục nóng máy lạnh
      const V0 = 22, V1 = 46;
      faceRect(g, at, 16, TW / 2 - 4, V0, V1, PAL.windowFrame);
      faceRect(g, at, 18, TW / 2 - 6, V0 + 2.5, V1 - 2.5, PAL.window);
      faceRect(g, at, 18, TW / 2 - 6, V0 + 2.5, V0 + 9, shade(PAL.window, 16), 0.7);

      const A0 = 4, A1 = 15, B0 = 26, B1 = 44;         // cục nóng
      faceRect(g, at, A0 - 1, A1 + 1, B0 - 1, B1 + 1, shade(PAL.meterBox, -34));
      faceRect(g, at, A0, A1, B0, B1, PAL.meterBox);
      faceRect(g, at, A0 + 1.5, A1 - 1.5, B0 + 2, B1 - 2, shade(PAL.meterBox, -14));
      for (let v = B0 + 3; v < B1 - 2; v += 3) {       // khe thoát gió
        faceRect(g, at, A0 + 2.5, A1 - 2.5, v, v + 1.2, shade(PAL.meterGlass, -10), 0.6);
      }
      g.lineStyle(1.5, PAL.wire, 0.8);                 // ống đồng bò xuống
      const p = at(A1 - 2, B1), q = at(A1 + 2, TILE_BAND);
      g.lineBetween(p.x, p.y, q.x, q.y);
    }

  });
}

export function buildBuilding(scene: Phaser.Scene) {
  for (let i = 0; i < BUILD.WALL_COUNT; i++) wall(scene, i);
  door(scene);
  for (let i = 0; i < BUILD.NEIGHBOUR_COUNT; i++) neighbour(scene, i);
}
