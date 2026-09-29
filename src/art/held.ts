import Phaser from "phaser";
import { PAL } from "./palette";
import { shade, type Pen } from "./canvas";
import type { Hand } from "../world/stations";

/**
 * MÓN ĐANG CẦM TRÊN TAY.
 *
 * Trước đây trạng thái tay hiện bằng một cái chip CHỮ lơ lửng trên đầu. Chip chữ
 * là thứ CANON §16 (Đừng-1) gọi đúng tên: dán nhãn lên thay vì diễn ra. Và nó phá
 * đúng trụ cột T1 — khách phải NHÌN THẤY tay bạn làm gì; nếu chính người chơi cũng
 * chỉ đọc chữ chứ không nhìn tay, thì cái nhìn của khách chẳng còn nghĩa gì.
 *
 * Nên mỗi trạng thái tay là một HÌNH khác hẳn nhau, phân biệt được cả khi in đen
 * trắng — đúng bài kiểm tra mà `food.ts` đang dùng cho icon nhân:
 *
 *   loaf_cold   ổ trắng nhợt, chưa rạch, không có gì bốc lên
 *   loaf_hot    ổ vàng có vết rạch + hai luồng hơi
 *   loaf_burnt  ổ đen xám, vỏ nứt, hai đầu quắt lại, khói mảnh
 *   loaf_filled ổ gói giấy báo, ló đầu bánh và cọng ngò xanh ra ngoài
 *   tea         ly nhựa trà đá có ống hút — bóng hình ĐỨNG, khác hẳn bốn ổ nằm ngang
 *
 * ── Quy ước neo ──────────────────────────────────────────────────────────────
 * Tâm texture (W/2, H/2) là ĐIỂM CẦM — chỗ hai bàn tay ôm lấy món, không phải tâm
 * hình học của món. `Player` đặt sprite gốc (0.5, 0.5) thẳng vào `holdAnchor()`
 * của `character.ts`, nên hai file chỉ cần thống nhất đúng một điểm này.
 */
export const HELD = { key: (h: Hand) => `held_${h}`, W: 40, H: 40 } as const;

/** Tay không thì không có texture nào — đây là danh sách thật sự được nướng. */
const CARRIED = ["loaf_cold", "loaf_hot", "loaf_burnt", "loaf_filled", "tea"] as const;

/** Thân ổ bánh nằm ngang, nằm ngay trên điểm cầm. `warp` làm hai đầu quắt lại. */
function loafBody(g: Pen, cx: number, cy: number, top: number, dark: number, warp = 0) {
  // Bề ngang 24 px, tức đúng bằng bề ngang thân người. To hơn nữa là nhìn ra
  // đang bưng một khúc gỗ chứ không phải một ổ bánh mì.
  g.fillStyle(dark, 1);
  g.fillEllipse(cx, cy - 1, 24, 11);
  g.fillStyle(top, 1);
  g.fillEllipse(cx, cy - 1.8, 21.5, 8.6);
  if (warp) {
    g.fillStyle(dark, 1);
    g.fillEllipse(cx - 9.5, cy - 1 - warp, 7, 7);
    g.fillEllipse(cx + 9.5, cy - 1 - warp, 7, 7);
  }
  g.fillStyle(shade(top, 16), 0.45);                   // mảng sáng trên lưng ổ
  g.fillEllipse(cx - 2.5, cy - 4, 12, 3.4);
}

/** Ổ chưa nướng: trắng nhợt, chưa rạch. */
function loafCold(g: Pen, cx: number, cy: number) {
  loafBody(g, cx, cy, 0xe3d3ae, 0xbba884);
  g.fillStyle(0xcdbb96, 0.55);                         // vết bột còn bám trên vỏ
  g.fillEllipse(cx + 5, cy - 0.5, 7, 2.6);
}

/** Ổ vừa ra lò: vàng, có đường rạch, có hơi bốc lên. */
function loafHot(g: Pen, cx: number, cy: number) {
  loafBody(g, cx, cy, PAL.bread, PAL.breadDark);
  g.fillStyle(PAL.breadSlash, 0.95);                   // đường rạch dọc lưng
  g.fillEllipse(cx, cy - 3.6, 14, 2.6);
  g.fillStyle(shade(PAL.breadDark, -12), 0.5);
  g.fillEllipse(cx, cy - 3, 14, 1.2);

  // Hơi nóng: hai sợi mảnh, độ lệch nhỏ. Lệch to là ra hai dấu "<" nhọn hoắt,
  // trông như mũi tên chỉ dẫn chứ không ra hơi.
  g.lineStyle(1.5, 0xffffff, 0.5);
  for (const dx of [-6, 7]) {
    g.beginPath();
    g.moveTo(cx + dx, cy - 9);
    g.lineTo(cx + dx - 1.6, cy - 12);
    g.lineTo(cx + dx + 1.2, cy - 15);
    g.lineTo(cx + dx - 0.8, cy - 18);
    g.strokePath();
  }
}

/** Ổ cháy: đen xám, nứt, quắt lại. Phải đọc ra HỎNG từ xa (CANON §7.2). */
function loafBurnt(g: Pen, cx: number, cy: number) {
  loafBody(g, cx, cy, 0x4a3b32, 0x2b221d, 2);
  g.fillStyle(0x1c1613, 1);                            // vết nứt trên vỏ
  for (const [dx, dy, w] of [[-7, -3.5, 6], [0, -4.5, 5], [6, -2, 4]]) {
    g.fillRect(cx + dx, cy + dy, w, 1.3);
  }
  g.fillStyle(0x6d5a4c, 0.4);
  g.fillEllipse(cx - 3, cy - 4.5, 9, 2.6);
  g.lineStyle(1.4, 0x8d8d8d, 0.34);                    // khói xám, mảnh hơn hơi nóng
  g.beginPath();
  g.moveTo(cx + 1, cy - 10);
  g.lineTo(cx - 1.4, cy - 13);
  g.lineTo(cx + 1.8, cy - 16);
  g.lineTo(cx - 0.6, cy - 19);
  g.strokePath();
}

/** Ổ đã kẹp nhân, gói giấy báo — ló đầu bánh và cọng ngò ra ngoài. */
function loafFilled(g: Pen, cx: number, cy: number) {
  loafBody(g, cx, cy, PAL.bread, PAL.breadDark);

  g.fillStyle(PAL.herbDark, 1);                        // ngò + đồ chua ló ra ở đầu ổ
  g.fillEllipse(cx + 10.5, cy - 4.5, 8, 5.5);
  g.fillStyle(PAL.herb, 1);
  g.fillEllipse(cx + 11.5, cy - 6, 5.5, 4);
  g.fillStyle(PAL.pickle, 1);
  g.fillEllipse(cx + 9, cy - 1, 6, 3);

  // Giấy báo CUỐN QUANH nửa ổ. Vẽ bằng ê-líp chứ không bằng hình chữ nhật:
  // hình chữ nhật phẳng lì đọc ra như một quyển sổ mở, không ra tờ giấy cuốn tròn.
  g.fillStyle(shade(PAL.newsprint, -30), 1);
  g.fillEllipse(cx - 5.5, cy - 1.5, 19, 13);
  g.fillStyle(PAL.newsprint, 1);
  g.fillEllipse(cx - 5.5, cy - 2.3, 17.5, 11);
  g.fillStyle(shade(PAL.newsprint, -18), 0.55);        // mặt trong của mép giấy cuốn
  g.fillEllipse(cx + 2.5, cy - 2.3, 4, 10.5);
  g.fillStyle(shade(PAL.newsprint, -36), 0.4);         // dòng chữ báo
  for (const [dy, w] of [[-4.5, 12], [-2, 14], [0.5, 12]]) g.fillRect(cx - 13, cy + dy, w, 1);
  g.fillStyle(shade(PAL.newsprint, -26), 0.6);         // nếp gấp dọc
  g.fillEllipse(cx - 9.5, cy - 2.3, 1.8, 9.5);
}

/** Ly trà đá: bóng hình ĐỨNG, khác hẳn bốn ổ bánh nằm ngang. */
function teaCup(g: Pen, cx: number, cy: number) {
  const H = 19, W = 13;
  const topY = cy - H / 2;
  const botY = cy + H / 2;

  g.fillStyle(shade(0xdff0f6, -32), 1);                // thành ly côn
  g.fillPoints([
    { x: cx - W / 2, y: topY }, { x: cx + W / 2, y: topY },
    { x: cx + W / 2 - 3, y: botY }, { x: cx - W / 2 + 3, y: botY },
  ], true);
  g.fillStyle(0xdff0f6, 0.95);
  g.fillPoints([
    { x: cx - W / 2 + 1, y: topY + 1 }, { x: cx + W / 2 - 1, y: topY + 1 },
    { x: cx + W / 2 - 3.8, y: botY - 1 }, { x: cx - W / 2 + 3.8, y: botY - 1 },
  ], true);

  g.fillStyle(0x8d5a2b, 0.72);                         // nước trà
  g.fillPoints([
    { x: cx - W / 2 + 1.5, y: topY + 4 }, { x: cx + W / 2 - 1.5, y: topY + 4 },
    { x: cx + W / 2 - 3.8, y: botY - 1.5 }, { x: cx - W / 2 + 3.8, y: botY - 1.5 },
  ], true);
  g.fillStyle(0xcfe6ee, 0.85);                         // hai viên đá nổi
  g.fillRect(cx - 4, topY + 4.5, 4.2, 3.8);
  g.fillRect(cx + 0.4, topY + 6.8, 3.8, 3.4);

  g.fillStyle(0xffffff, 0.45);                         // bắt sáng thành ly
  g.fillRect(cx - W / 2 + 2.5, topY + 3, 1.6, H - 8);
  g.fillStyle(0xeef6f9, 1);                            // miệng ly
  g.fillEllipse(cx, topY, W, 4.5);
  g.fillStyle(0x8d5a2b, 0.5);
  g.fillEllipse(cx, topY + 0.6, W - 4, 2.6);

  g.lineStyle(2.2, PAL.signRed, 0.95);                 // ống hút đỏ
  g.lineBetween(cx + 3, topY - 1, cx + 7, topY - 9);
}

const DRAW: Record<(typeof CARRIED)[number], (g: Pen, cx: number, cy: number) => void> = {
  loaf_cold: loafCold,
  loaf_hot: loafHot,
  loaf_burnt: loafBurnt,
  loaf_filled: loafFilled,
  tea: teaCup,
};

export function buildHeld(scene: Phaser.Scene) {
  for (const hand of CARRIED) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    DRAW[hand](g, HELD.W / 2, HELD.H / 2);
    g.generateTexture(HELD.key(hand), HELD.W, HELD.H);
    g.destroy();
  }
}
