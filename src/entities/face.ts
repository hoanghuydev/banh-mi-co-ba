import type Phaser from "phaser";
import type { Face } from "../sim/reaction";

/**
 *   Mày  B0 thường · B1 nhíu nhẹ · B2 nhíu sâu · B3 nhướn · B4 lệch · B5 xuôi (buồn)
 *   Mắt  E0 thường · E1 nheo (soi) · E2 mở to · E3 liếc ngang · E4 nhắm (chịu) · E5 cười
 *   Miệng M0 thường · M1 mím (chữ ký chị Lan) · M2 cười nhẹ · M3 cười tươi · M4 méo · M5 há
 */
export const FACE_R = 11;
const INK = 0x2b2f31;

type G = Phaser.GameObjects.Graphics;

function brow(g: G, x: number, y: number, b: number, color: number) {
  g.lineStyle(2.2, color, 1);
  const L = (x1: number, y1: number, x2: number, y2: number) => g.lineBetween(x + x1, y + y1, x + x2, y + y2);
  // y âm là lên trên.
  switch (b) {
    case 0: L(-7, -5, -2.5, -5); L(2.5, -5, 7, -5); break;
    case 1: L(-7, -5.6, -2.5, -4.4); L(2.5, -4.4, 7, -5.6); break;
    case 2: L(-7, -6.6, -2.2, -3.6); L(2.2, -3.6, 7, -6.6); break;
    case 3: L(-7, -6.2, -4.6, -7.6); L(-4.6, -7.6, -2.4, -6.6); L(2.4, -6.6, 4.6, -7.6); L(4.6, -7.6, 7, -6.2); break;
    case 4: L(-7, -5, -2.5, -5); L(2.5, -6.2, 7, -7.4); break;
    default: L(-7, -4.2, -2.5, -6); L(2.5, -6, 7, -4.2); break;
  }
}

function eyes(g: G, x: number, y: number, e: number) {
  for (const dx of [-4.2, 4.2]) {
    const ex = x + dx, ey = y - 1;
    switch (e) {
      case 0: g.fillStyle(INK, 1).fillCircle(ex, ey, 1.6); break;
      case 1: g.lineStyle(2, INK, 1).lineBetween(ex - 2.2, ey, ex + 2.2, ey); break;
      case 2:
        g.fillStyle(0xffffff, 1).fillCircle(ex, ey, 2.6);
        g.fillStyle(INK, 1).fillCircle(ex, ey, 1.5);
        break;
      case 3:
        g.fillStyle(0xffffff, 1).fillEllipse(ex, ey, 5, 3.6);
        g.fillStyle(INK, 1).fillCircle(ex + 1.4, ey, 1.2);
        break;
      case 4:
        g.lineStyle(1.8, INK, 1);
        g.beginPath(); g.arc(ex, ey - 1, 2.2, 0.15 * Math.PI, 0.85 * Math.PI); g.strokePath();
        break;
      default:
        g.lineStyle(1.8, INK, 1);
        g.beginPath(); g.arc(ex, ey + 1.2, 2.2, 1.15 * Math.PI, 1.85 * Math.PI); g.strokePath();
        break;
    }
  }
}

function mouth(g: G, x: number, y: number, m: number) {
  const my = y + 4.6;
  switch (m) {
    case 0: g.lineStyle(1.6, INK, 0.9).lineBetween(x - 2.2, my, x + 2.2, my); break;
    case 1: g.lineStyle(2.4, INK, 1).lineBetween(x - 2.6, my, x + 2.6, my); break;
    case 2:
      g.lineStyle(1.7, INK, 1);
      g.beginPath(); g.arc(x, my - 1.8, 3, 0.2 * Math.PI, 0.8 * Math.PI); g.strokePath();
      break;
    case 3:
      g.fillStyle(INK, 1);
      g.beginPath(); g.arc(x, my - 0.8, 3.4, 0, Math.PI); g.closePath(); g.fillPath();
      g.fillStyle(0xd9696a, 1).fillEllipse(x, my + 1.6, 3.2, 1.4);
      break;
    case 4:
      g.lineStyle(1.7, INK, 1);
      g.beginPath(); g.moveTo(x - 3.2, my + 0.6); g.lineTo(x - 1.2, my - 0.8); g.lineTo(x + 0.8, my + 0.8); g.lineTo(x + 3.2, my - 0.6); g.strokePath();
      break;
    default:
      g.fillStyle(INK, 1).fillEllipse(x, my + 0.4, 3.4, 4.2);
      break;
  }
}

export function drawFace(g: G, x: number, y: number, f: Face, skin: number, hair: number, alpha = 1) {
  g.fillStyle(0x1b2429, 0.55 * alpha).fillCircle(x, y + 1.2, FACE_R + 1.6);
  g.fillStyle(skin, alpha).fillCircle(x, y, FACE_R);
  g.lineStyle(1.6, 0x1b2429, 0.9 * alpha).strokeCircle(x, y, FACE_R);
  brow(g, x, y, f[0], hair);
  eyes(g, x, y, f[1]);
  mouth(g, x, y, f[2]);
}
