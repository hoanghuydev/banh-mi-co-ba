import Phaser from "phaser";
import { TW, TH } from "../world/iso";
import { PAL } from "./palette";
import { blob, diamond, heightFor, prop, shade, slab, standing, type Pen } from "./canvas";

/**
 * QUẦY bánh mì — bệ xây cố định tại chỗ, ốp gạch men, tủ kính đặt lên trên.
 * Không phải xe đẩy: quán nằm hẳn ở góc nhà nên quầy là đồ xây, có chân bệ chạm đất.
 *
 * Ghép từ ba mô-đun một ô, nối dọc theo trục x thành một quầy dài:
 *  · `counter_end`  hai đầu quầy: rổ bánh để hở
 *  · `counter_case` khúc giữa: tủ kính bày bánh — CÓ 2 BIẾN THỂ (xem dưới)
 *  · `counter_work` khúc có trạm làm việc: để TRỐNG cố ý, vì T1 bắt buộc
 *                   khách phải nhìn thấy tay bạn làm gì trên thớt
 *
 * ── Vì sao tủ kính có 2 biến thể ─────────────────────────────────────────────
 * Quầy dài 14 ô. Một texture tủ kính lặp 14 lần ra một dãy ô vuông đều tăm tắp,
 * mắt đọc ngay là "tile lặp" chứ không phải "một tủ bánh dài". Hai biến thể khác
 * nhau ở thứ BÀY BÊN TRONG (ổ bánh / khay giò chả + bảng giá) là đủ phá nhịp,
 * mà khung nhôm vẫn trùng khít nên vẫn đọc ra MỘT cái tủ liền.
 */
export const COUNTER = {
  end: "counter_end",
  case: (i: number) => `counter_case${i}`,
  CASE_COUNT: 2,
  work: "counter_work",
} as const;

const BODY = 32;         // cao bệ quầy
const CASE = 30;         // cao tủ kính

/** Ổ bánh mì nhìn nghiêng. Dùng lại cho cả tủ kính lẫn rổ ở đầu quầy. */
function loaf(g: Pen, x: number, y: number, s = 1) {
  g.fillStyle(PAL.breadDark, 1);
  g.fillEllipse(x, y, 20 * s, 8 * s);
  g.fillStyle(PAL.bread, 1);
  g.fillEllipse(x, y - 1.2 * s, 17 * s, 6 * s);
  g.fillStyle(PAL.breadSlash, 0.9);                    // đường rạch trên lưng bánh
  g.fillRect(x - 5 * s, y - 3 * s, 10 * s, 1.3 * s);
}

/**
 * Phần chung của mọi khúc quầy: bệ ốp gạch + mặt thớt gỗ.
 * Mặt gỗ vẽ TRÀN hết ô để các khúc nối nhau thành một mặt quầy liền,
 * không bị nhìn ra "một dãy hộp rời".
 */
function body(g: Pen, cx: number, cy: number) {
  standing(g, cx, cy, BODY, PAL.counterTile);

  const top = cy - BODY;
  g.fillStyle(PAL.counterBase, 0.85);                  // chân bệ xi măng sát đất
  g.fillRect(cx - TW / 2, cy - 5, TW / 2, 5);
  g.fillRect(cx, cy + TH / 2 - 5, TW / 2, 5);

  g.fillStyle(shade(PAL.counterTile, -22), 0.5);       // mạch gạch men trên mặt bệ
  for (let d = 10; d < BODY; d += 11) {
    g.fillRect(cx - TW / 2, cy - BODY + TH / 2 + d, TW / 2, 1.2);
    g.fillRect(cx, cy - BODY + TH + d - 2, TW / 2, 1.2);
  }
  g.fillStyle(shade(PAL.counterTile, 16), 0.45);       // gờ sáng mép trên bệ
  g.fillRect(cx - TW / 2, cy - BODY + TH / 2, TW / 2, 1.6);

  g.fillStyle(PAL.counterBoard, 1);                    // thớt gỗ — slot BOARD (CANON §5)
  diamond(g, cx, top, TW, TH);
  g.fillStyle(PAL.counterBoardDark, 0.32);             // vân gỗ chạy dọc quầy
  for (const dy of [-5, 0, 5]) g.fillRect(cx - 16, top + dy, 32, 1);
}

function counterEnd(scene: Phaser.Scene) {
  prop(scene, COUNTER.end, heightFor(BODY + 30), (g, cx, cy) => {
    body(g, cx, cy);
    const top = cy - BODY;
    blob(g, cx, top - 8, 38, 17, PAL.basketDark);      // rổ tre đựng bánh nóng
    g.fillStyle(PAL.basket, 1);
    g.fillEllipse(cx, top - 10, 31, 11);
    g.fillStyle(shade(PAL.basket, -20), 0.45);         // nan rổ
    for (const dx of [-10, 0, 10]) g.fillEllipse(cx + dx, top - 10, 3, 10);
    loaf(g, cx - 7, top - 13, 0.72);
    loaf(g, cx + 6, top - 16, 0.72);
    loaf(g, cx, top - 19, 0.66);

    // khăn vắt mép rổ — chi tiết nhỏ nhưng nó nói "bánh này mới ra lò, còn ủ nóng"
    g.fillStyle(shade(PAL.paper, -22), 1);
    g.fillPoints([
      { x: cx + 9, y: top - 11 }, { x: cx + 23, y: top - 6 },
      { x: cx + 21, y: top + 2 }, { x: cx + 8, y: top - 4 },
    ], true);
    g.fillStyle(PAL.paper, 1);
    g.fillPoints([
      { x: cx + 9, y: top - 12 }, { x: cx + 22, y: top - 7 },
      { x: cx + 21, y: top - 1 }, { x: cx + 8, y: top - 5 },
    ], true);
  });
}

/**
 * Khúc quầy có tủ kính. Tủ dựng bằng khối iso rộng ĐÚNG BẰNG một ô,
 * nên trụ nhôm của hai khúc liền nhau trùng khít -> đọc ra MỘT tủ dài.
 */
function counterCase(scene: Phaser.Scene, variant: number) {
  prop(scene, COUNTER.case(variant), heightFor(BODY + CASE), (g, cx, cy) => {
    body(g, cx, cy);

    const base = cy - BODY;                            // mặt quầy = đáy tủ
    const top = base - CASE;                           // tâm hình thoi của nóc tủ

    if (variant === 0) {                               // khúc bày bánh
      // Bánh phải to và xếp chồng: nhìn qua hai lớp kính alpha 0.34–0.5 thì mọi
      // thứ nhạt đi một nửa, ổ bánh cỡ 0.6 chìm mất thành hai vệt be be.
      loaf(g, cx - 10, base - 4, 0.8);
      loaf(g, cx + 9, base - 6, 0.8);
      loaf(g, cx - 2, base - 10, 0.76);
      loaf(g, cx + 8, base - 13, 0.7);
    } else {                                           // khúc bày khay nhân + bảng giá
      slab(g, cx - 19, base - 9, 17, 8, 1.5, 0xe6e0d0, 2);
      g.fillStyle(PAL.pate, 1);
      g.fillEllipse(cx - 10.5, base - 9, 12, 4.5);
      slab(g, cx + 2, base - 12, 16, 8, 1.5, 0xe6e0d0, 2);
      g.fillStyle(0xe8ddc4, 1);                        // khay giò chả
      g.fillEllipse(cx + 10, base - 12, 11, 4.5);
      g.fillStyle(PAL.chilli, 1);
      g.fillEllipse(cx + 13, base - 13.5, 4, 2.5);

      slab(g, cx - 4, base - 22, 15, 10, 1.5, PAL.paper, 1.5);   // bảng giá dựng trong tủ
      g.fillStyle(PAL.signRed, 0.85);
      g.fillRect(cx - 1.5, base - 19.5, 10, 2);
      g.fillStyle(PAL.ink, 0.4);
      g.fillRect(cx - 1.5, base - 16, 7, 1.4);
    }

    g.fillStyle(PAL.glass, 0.34);                      // mặt kính trái
    g.fillPoints([
      { x: cx - TW / 2, y: top }, { x: cx, y: top + TH / 2 },
      { x: cx, y: base + TH / 2 }, { x: cx - TW / 2, y: base },
    ], true);
    g.fillStyle(PAL.glass, 0.5);                       // mặt kính phải
    g.fillPoints([
      { x: cx + TW / 2, y: top }, { x: cx, y: top + TH / 2 },
      { x: cx, y: base + TH / 2 }, { x: cx + TW / 2, y: base },
    ], true);
    g.fillStyle(PAL.glass, 0.62);                      // nóc tủ
    diamond(g, cx, top, TW, TH);

    g.fillStyle(0xffffff, 0.16);                       // vệt phản chiếu trên kính phải
    g.fillPoints([
      { x: cx + 6, y: base + TH / 2 - 4 }, { x: cx + 14, y: top + 8 },
      { x: cx + 21, y: top + 11 }, { x: cx + 13, y: base + TH / 2 - 2 },
    ], true);

    g.lineStyle(1.6, PAL.glassFrame, 0.9);             // khung nhôm: viền nóc + hai trụ
    g.beginPath();
    g.moveTo(cx - TW / 2, top); g.lineTo(cx, top - TH / 2);
    g.lineTo(cx + TW / 2, top); g.lineTo(cx, top + TH / 2);
    g.closePath(); g.strokePath();
    for (const dx of [-TW / 2, TW / 2]) g.lineBetween(cx + dx, top, cx + dx, base);
  });
}

/**
 * Khúc quầy có trạm làm việc.
 * Mặt thớt để trống ở GIỮA là cố ý (T1: khách phải thấy tay bạn làm gì) —
 * đồ nghề dồn hết ra hai mép ô.
 */
function counterWork(scene: Phaser.Scene) {
  prop(scene, COUNTER.work, heightFor(BODY + 22), (g, cx, cy) => {
    body(g, cx, cy);
    const top = cy - BODY;

    slab(g, cx - 24, top - 13, 15, 9, 2, 0xe9e4d6, 2); // khay đồ chua
    g.fillStyle(PAL.pickle, 0.9);
    g.fillEllipse(cx - 16.5, top - 13, 10, 4);

    slab(g, cx - 6, top - 16, 15, 10, 2, 0xd8cdb4, 2); // hũ pate
    g.fillStyle(PAL.pate, 1);
    g.fillEllipse(cx + 1.5, top - 16, 10, 4);

    g.fillStyle(0xf2efe6, 1);                          // chén ớt
    g.fillEllipse(cx + 14, top - 10, 13, 6);
    g.fillStyle(PAL.chilli, 1);
    g.fillEllipse(cx + 14, top - 10.5, 8, 3.5);

    // con dao rạch bánh gác mép thớt — âm chữ ký của game nằm ở cái này (P5-03 §4.2)
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
