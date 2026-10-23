import Phaser from "phaser";
import { TW, TH } from "../world/iso";
import { PAL } from "./palette";
import { blob, diamond, heightFor, prop, shade, slab, standing, type Pen } from "./canvas";

/** Vật chỉ có ảnh thật thì không có hàm vẽ ở đây: thiếu ảnh là bỏ qua hẳn. */
export const PROP = {
  oven: "oven", tea: "tea", shelf: "shelf",
  stool: "stool", table: "table", order: "order", prep: "prep",
  // Bàn dài hai ô cắt đôi: nửa ngoài đặt thớt, nửa trong là khay topping.
  benchNear: "bench_near", benchFar: "bench_far", bike: "bike", pothos: "pothos",
  crate: "crate", bin: "bin", sink: "sink",
  // Chỉ có ảnh thật; `ovenE` thiếu ảnh thì `StallScene.placeProps` phải lùi về `oven`.
  scooter: "scooter", sign: "sign", fire: "fire", ovenE: "oven_e",
  // Chỉ có ảnh thật, không nằm trên lưới ô — `StallScene.drawEquipment` dựng khi đã mua.
  umbrella: "umbrella", fridge: "fridge", cooler: "cooler",
  // Vật động: chỗ của chúng là một nước đi của người chơi.
  ganh: "ganh", cart: "cart",
} as const;

function loaf(g: Pen, x: number, y: number, s = 1) {
  g.fillStyle(PAL.breadDark, 1);
  g.fillEllipse(x, y, 20 * s, 8 * s);
  g.fillStyle(PAL.bread, 1);
  g.fillEllipse(x, y - 1.2 * s, 17 * s, 6 * s);
  g.fillStyle(PAL.breadSlash, 0.9);                    // đường rạch trên lưng bánh
  g.fillRect(x - 5 * s, y - 3 * s, 10 * s, 1.3 * s);
}

function jar(g: Pen, x: number, y: number, w: number, h: number, fill: number) {
  slab(g, x - w / 2, y - h, w, h, 2.5, PAL.jarGlass, 2);
  g.fillStyle(fill, 0.95);                             // phần ruột nhìn xuyên kính
  g.fillRoundedRect(x - w / 2 + 1.5, y - h + h * 0.35, w - 3, h * 0.65 - 1.5, 2);
  g.fillStyle(0xffffff, 0.4);                          // vệt sáng dọc thành hũ
  g.fillRect(x - w / 2 + 2, y - h + 3, 1.6, h - 6);
  g.fillStyle(PAL.jarLid, 1);                          // nắp
  g.fillRoundedRect(x - w / 2 - 1, y - h - 3, w + 2, 4, 1.5);
}

function bottle(g: Pen, x: number, y: number, h: number, color: number) {
  g.fillStyle(shade(color, -30), 1);
  g.fillRoundedRect(x - 3.6, y - h, 7.2, h, 2);
  g.fillStyle(color, 1);
  g.fillRoundedRect(x - 3, y - h + 0.6, 6, h - 1.2, 1.8);
  g.fillStyle(shade(color, -40), 1);                   // cổ + nắp
  g.fillRect(x - 1.6, y - h - 4, 3.2, 4);
  g.fillStyle(0xffffff, 0.35);
  g.fillRect(x - 2, y - h + 3, 1.3, h - 7);
}

function leaf(g: Pen, x: number, y: number, color: number, s = 1) {
  g.fillStyle(shade(color, -26), 1);
  g.fillEllipse(x, y, 15 * s, 11 * s);
  g.fillStyle(color, 1);
  g.fillEllipse(x, y - 0.5, 12.5 * s, 8.5 * s);
  g.fillStyle(shade(color, 22), 0.5);                  // gân lá
  g.fillRect(x - 4 * s, y - 1, 8 * s, 1);
}

function oven(scene: Phaser.Scene) {
  const H = 26;
  const W = TW - 10, D = TH - 5;
  prop(scene, PROP.oven, heightFor(H + 24), (g, cx, cy) => {
    // Thân tôn xám, để màu than đậm cho lòng lò thì miệng lò mới đọc ra.
    standing(g, cx, cy, H, PAL.grill, W, D);
    const top = cy - H;

    g.fillStyle(shade(PAL.grill, -34), 0.7);           // đai lò chạy quanh thân
    g.fillRect(cx - W / 2, top + D / 2 + 8, W, 3);
    g.fillStyle(shade(PAL.grill, 18), 0.3);
    g.fillRect(cx + 3, top + D / 2 + 2, 12, H - 6);

    g.fillStyle(PAL.charcoalDark, 1);                  // lòng lò
    diamond(g, cx, top, W - 14, D - 8);

    for (const [dx, dy, r] of [[-9, 1, 7], [3, -3, 6], [10, 3, 5], [-2, 5, 5], [1, -6, 4]]) {
      g.fillStyle(PAL.ember, 0.9);                     // than hồng
      g.fillEllipse(cx + dx, top + dy * 0.5, r, r * 0.55);
    }
    g.fillStyle(PAL.emberHot, 0.85);
    g.fillEllipse(cx + 1, top - 1, 6, 3);

    g.lineStyle(1.7, PAL.grill, 0.95);
    for (let t = -0.8; t <= 0.8; t += 0.4) {
      const hw = ((W - 16) / 2) * (1 - Math.abs(t) * 0.55);
      const my = top + (t * (D - 8)) / 2;
      g.lineBetween(cx - hw, my - hw * 0.5, cx + hw, my + hw * 0.5);
    }

    loaf(g, cx - 7, top - 6, 0.66);                    // hai ổ đang hơ cho nóng lại
    loaf(g, cx + 6, top - 9, 0.66);

    const fx = cx - 25, fy = cy - 4;
    g.fillStyle(PAL.shelfBoard, 1);                    // cán quạt chạm đất
    g.fillRect(fx - 1.6, fy - 10, 3.2, 10);
    g.fillStyle(PAL.basketDark, 1);
    g.fillEllipse(fx, fy - 20, 19, 22);
    g.fillStyle(PAL.basket, 1);
    g.fillEllipse(fx, fy - 20.5, 16.5, 19.5);
    g.lineStyle(1, PAL.basketDark, 0.6);
    for (const a of [-0.55, 0, 0.55]) g.lineBetween(fx, fy - 11, fx + Math.sin(a) * 8, fy - 29);
  });
}

function tea(scene: Phaser.Scene) {
  const H = 38;
  const W = TW - 18, D = TH - 9;
  prop(scene, PROP.tea, heightFor(H + 16), (g, cx, cy) => {
    standing(g, cx, cy, H, PAL.teaBarrel, W, D);
    const top = cy - H;

    g.fillStyle(shade(PAL.teaBarrel, 20), 0.3);        // mảng sáng thân thùng
    g.fillRect(cx + 3, top + D / 2 + 3, 12, H - 10);
    g.fillStyle(PAL.teaBarrelDark, 0.6);               // đai thùng
    g.fillRect(cx - W / 2, top + D / 2 + 22, W, 2.6);

    g.fillStyle(PAL.teaLid, 1);                        // nắp
    diamond(g, cx, top, W - 4, D - 2);
    g.fillStyle(shade(PAL.teaLid, -26), 0.8);
    g.fillEllipse(cx, top, W - 16, D - 8);

    slab(g, cx - 12, top - 17, 11, 17, 2.5, 0xeef6f9, 2);
    for (const dy of [-13, -8.5, -4]) {
      g.fillStyle(0xffffff, 0.55);
      g.fillEllipse(cx - 6.5, top + dy, 11, 3.2);
    }

    g.fillStyle(shade(PAL.chrome, -30), 1);            // vòi: thân đứng + mỏ chìa ra
    g.fillRect(cx + 13, cy - 19, 4.5, 11);
    g.fillRect(cx + 13, cy - 12, 8, 3.5);
    g.fillStyle(PAL.chrome, 1);
    g.fillRect(cx + 13.6, cy - 18.4, 1.6, 10);
    g.fillRect(cx + 17, cy - 22, 5, 3.5);              // tay vặn

    const bx = cx - 20, by = cy - 26;
    g.fillStyle(shade(PAL.signRed, -30), 1);
    g.fillPoints([
      { x: bx, y: by }, { x: bx + 22, y: by + 11 },
      { x: bx + 22, y: by + 24 }, { x: bx, y: by + 13 },
    ], true);
    g.fillStyle(PAL.signRed, 1);
    g.fillPoints([
      { x: bx + 1.5, y: by + 1.5 }, { x: bx + 20.5, y: by + 11 },
      { x: bx + 20.5, y: by + 22 }, { x: bx + 1.5, y: by + 12.5 },
    ], true);
    g.fillStyle(PAL.signYellow, 0.95);
    g.fillPoints([
      { x: bx + 4, y: by + 4.5 }, { x: bx + 18, y: by + 11.5 },
      { x: bx + 18, y: by + 14 }, { x: bx + 4, y: by + 7 },
    ], true);
    g.fillPoints([
      { x: bx + 4, y: by + 9 }, { x: bx + 13, y: by + 13.5 },
      { x: bx + 13, y: by + 16 }, { x: bx + 4, y: by + 11.5 },
    ], true);
  });
}

function shelf(scene: Phaser.Scene) {
  const TIER = 18;
  const N = 3;
  const W = TW - 16;
  const H = TIER * N;
  const HALF = W / 2 - 4;                              // mép trong của ván kệ

  prop(scene, PROP.shelf, heightFor(H + 16), (g, cx, cy) => {
    const legX = W / 2 - 3;
    g.fillStyle(PAL.rackSteelDark, 1);                 // bốn chân khung sắt
    for (const dx of [-legX, legX]) g.fillRect(cx + dx - 1.6, cy - H, 3.2, H);
    g.fillStyle(PAL.rackSteel, 1);
    for (const dx of [-legX, legX]) g.fillRect(cx + dx - 1.6, cy - H, 1.4, H);

    const board = (i: number) => {                     // mặt kệ tầng thứ i, đếm từ dưới
      const y = cy - i * TIER;
      standing(g, cx, y, 4, PAL.shelfBoard, W, TH - 12);
      return y - 4;
    };

    let top = board(0);
    for (const [dx, color] of [[-11, PAL.crate[0]], [11, PAL.crate[1]]] as const) {
      standing(g, cx + dx, top, 12, color, 21, 10);
      g.fillStyle(0x000000, 0.16);
      g.fillRect(cx + dx - 9, top - 4, 18, 2.2);
    }

    top = board(1);
    jar(g, cx - 14, top, 12, 13, PAL.pate);
    jar(g, cx, top, 12, 13, PAL.pickle);
    jar(g, cx + 14, top, 12, 13, PAL.chilli);

    top = board(2);
    blob(g, cx, top - 5, HALF * 2 - 4, 14, PAL.basketDark);
    g.fillStyle(PAL.basket, 1);
    g.fillEllipse(cx, top - 7, HALF * 2 - 10, 10);
    loaf(g, cx - 6, top - 10, 0.62);
    loaf(g, cx + 5, top - 12, 0.62);
    loaf(g, cx - 1, top - 15, 0.58);
  });
}

function stool(scene: Phaser.Scene) {
  const SEAT = 14;
  prop(scene, PROP.stool, heightFor(SEAT + 10), (g, cx, cy) => {
    g.fillStyle(PAL.stoolDark, 1);                     // bốn chân choãi ra
    for (const [dx, dy] of [[-10, 2], [10, 2], [0, -5], [0, 7]]) {
      g.fillRect(cx + dx - 1.8, cy - SEAT + dy * 0.4, 3.6, SEAT);
    }
    const top = cy - SEAT;
    standing(g, cx, top, 5, PAL.stool, 31, 16);        // mặt ngồi

    g.fillStyle(PAL.stoolDark, 0.55);                  // rãnh thoát nước trên mặt ngồi
    for (const dy of [-2.5, 0, 2.5]) g.fillRect(cx - 8, top - 5 + dy, 16, 1.3);
    g.fillStyle(shade(PAL.stool, 22), 0.5);            // bắt sáng mép trước
    g.fillEllipse(cx, top - 6.5, 22, 5);
  });
}

function table(scene: Phaser.Scene) {
  const LEGS = 18;
  prop(scene, PROP.table, heightFor(LEGS + 40), (g, cx, cy) => {
    g.fillStyle(shade(PAL.tableTop, -34), 1);          // chân bàn
    for (const dx of [-16, 16]) g.fillRect(cx + dx, cy - LEGS, 3.5, LEGS);
    standing(g, cx, cy - LEGS, 5, PAL.tableTop, TW - 12, TH - 6);

    const top = cy - LEGS - 5;

    slab(g, cx - 16, top - 19, 12, 17, 2, 0xdfeaef, 2);    // hũ đũa
    g.fillStyle(PAL.shelfBoard, 1);
    for (const dx of [-14, -11.5, -9]) g.fillRect(cx + dx, top - 27, 1.8, 10);
    g.fillStyle(shade(PAL.shelfBoard, -26), 1);
    for (const dx of [-14, -11.5, -9]) g.fillRect(cx + dx, top - 27, 1.8, 2);

    slab(g, cx - 1, top - 16, 15, 14, 2, PAL.newsprint, 2);  // hộp giấy lau
    g.fillStyle(0xffffff, 0.9);
    g.fillEllipse(cx + 6.5, top - 16, 7, 3.5);

    blob(g, cx + 19, top - 4, 15, 7, 0xf2efe6, 2);     // chén ớt
    g.fillStyle(PAL.chilli, 1);
    g.fillEllipse(cx + 19, top - 4.5, 9, 4);

    slab(g, cx + 6, top - 4, 9, 11, 1.5, 0xdff0f6, 2); // ly trà đá ai đó để quên
    g.fillStyle(0x8d5a2b, 0.75);
    g.fillRect(cx + 7, top - 8, 7, 7);
    g.fillStyle(0xffffff, 0.55);
    g.fillEllipse(cx + 10.5, top - 4, 9, 3);
  }, TW + 12);
}

function bike(scene: Phaser.Scene) {
  prop(scene, PROP.bike, heightFor(52), (g, cx, cy) => {
    const axle = cy - 11;

    for (const dx of [-17, 16]) {                      // hai bánh, chạm đất
      blob(g, cx + dx, axle, 22, 22, PAL.tyre, 2);
      g.fillStyle(shade(PAL.tyre, 22), 1);
      g.fillCircle(cx + dx, axle, 7.5);
      g.fillStyle(PAL.chrome, 1);
      g.fillCircle(cx + dx, axle, 3.5);
      // Không vẽ nan hoa: ở 22 px mỗi nan dưới 1 px, ra một mảng nhiễu xám.
    }

    g.fillStyle(PAL.bikeDark, 1);                      // chắn bùn sau
    g.fillEllipse(cx - 17, axle - 9, 24, 14);
    g.fillStyle(PAL.bike, 1);                          // thân xe
    g.fillPoints([
      { x: cx - 20, y: axle - 8 }, { x: cx + 2, y: axle - 15 },
      { x: cx + 18, y: axle - 11 }, { x: cx + 16, y: axle - 2 }, { x: cx - 16, y: axle - 1 },
    ], true);
    g.fillStyle(shade(PAL.bike, 20), 0.45);            // mảng sáng sườn xe
    g.fillPoints([
      { x: cx - 14, y: axle - 8 }, { x: cx + 2, y: axle - 12 },
      { x: cx + 12, y: axle - 9 }, { x: cx - 12, y: axle - 5 },
    ], true);

    slab(g, cx - 19, axle - 23, 28, 9, 4, PAL.bikeDark, 2);  // yên dài
    g.fillStyle(shade(PAL.bikeDark, 26), 0.45);
    g.fillRoundedRect(cx - 17, axle - 22, 24, 3, 1.5);

    g.lineStyle(3, PAL.chrome, 1);                     // càng trước + ghi đông
    g.lineBetween(cx + 16, axle - 2, cx + 20, axle - 28);
    g.lineBetween(cx + 12, axle - 28, cx + 27, axle - 28);
    g.fillStyle(PAL.bikeDark, 1);                      // tay nắm
    g.fillRoundedRect(cx + 24, axle - 30, 5, 4, 2);

    g.lineStyle(1.6, PAL.chrome, 1);                   // kính chiếu hậu
    g.lineBetween(cx + 25, axle - 28, cx + 28, axle - 38);
    g.fillStyle(PAL.bikeDark, 1);
    g.fillEllipse(cx + 28, axle - 39, 7, 8);
    g.fillStyle(0xcfe0e6, 0.8);
    g.fillEllipse(cx + 28, axle - 39, 4.5, 5.5);

    slab(g, cx + 9, axle - 30, 15, 13, 2, PAL.rackSteelDark, 2);   // giỏ trước
    g.fillStyle(PAL.rackSteel, 0.8);
    for (const dy of [-27, -24, -21]) g.fillRect(cx + 10, axle + dy, 13, 1.2);

    blob(g, cx + 21, axle - 17, 10, 9, 0xeae4d4, 2);   // đèn pha
    g.fillStyle(0xffffff, 0.5);
    g.fillEllipse(cx + 22, axle - 18, 4, 3.5);

    slab(g, cx - 24, axle - 8, 11, 7, 1.5, PAL.paper, 1.5);        // biển số
    g.fillStyle(PAL.ink, 0.8);
    g.fillRect(cx - 22, axle - 6, 7, 1.4);

    g.lineStyle(2, shade(PAL.chrome, -34), 0.9);       // chân chống nghiêng
    g.lineBetween(cx - 2, axle + 2, cx - 7, cy - 1);
  }, TW + 24);
}

/** Để dưới đất chứ không treo — treo cao đọc ra như cột đèn. */
function pothos(scene: Phaser.Scene) {
  // Phải khớp tầm cao với ảnh thật (`photo.ts`).
  const S = 0.68;
  const POT = 20 * S;
  prop(scene, PROP.pothos, heightFor(POT + 34 * S), (g, cx, cy) => {
    g.fillStyle(PAL.potDark, 1);                       // chậu đất nung
    g.fillPoints([
      { x: cx - 15 * S, y: cy - POT }, { x: cx + 15 * S, y: cy - POT },
      { x: cx + 11 * S, y: cy }, { x: cx - 11 * S, y: cy },
    ], true);
    g.fillStyle(PAL.pot, 1);
    g.fillEllipse(cx, cy - POT, 30 * S, 10 * S);
    g.fillStyle(shade(PAL.pot, 16), 0.5);              // gờ miệng chậu
    g.fillRect(cx - 14 * S, cy - POT - 1, 28 * S, 2);
    g.fillStyle(0x4a3a2c, 1);
    g.fillEllipse(cx, cy - POT, 22 * S, 6 * S);

    const rim = cy - POT;
    const bush: [number, number, number][] = [         // bụi lá xoè lên rồi rủ xuống
      [-13, -6, 1], [12, -7, 1], [0, -19, 0.9], [-9, -19, 0.85], [10, -18, 0.85],
      [-17, 4, 0.95], [16, 3, 0.95], [-4, -10, 1], [5, -11, 1], [0, 2, 0.9],
      [-6, -26, 0.7], [6, -25, 0.7],
    ];
    bush.forEach(([dx, dy, s], i) =>
      leaf(g, cx + dx * S, rim + dy * S, i % 3 === 0 ? PAL.leafDark : PAL.leaf, s * S));

    g.lineStyle(1.4, PAL.leafDark, 0.85);              // một nhánh rủ xuống thành chậu
    g.lineBetween(cx + 14 * S, rim - 2 * S, cx + 19 * S, rim + 12 * S);
    leaf(g, cx + 20 * S, rim + 15 * S, PAL.leaf, 0.55 * S);
  });
}

function crate(scene: Phaser.Scene) {
  const BOX = 15;
  prop(scene, PROP.crate, heightFor(BOX * 3 + 10), (g, cx, cy) => {
    for (let i = 0; i < 3; i++) {
      const base = cy - i * BOX;
      const color = i === 1 ? PAL.crateRed : PAL.crate[i % PAL.crate.length];
      standing(g, cx, base, BOX, color, TW - 18, TH - 9);
      g.fillStyle(0x000000, 0.16);                     // khe thoáng thành két
      g.fillRect(cx - 14, base - BOX + 8, 28, 2.4);
      g.fillStyle(0xffffff, 0.14);
      g.fillRect(cx - 14, base - BOX + 13, 28, 1.4);
    }
    const top = cy - BOX * 3;
    for (let i = 0; i < 4; i++) {                      // mấy chai còn sót trên cùng
      bottle(g, cx - 12 + i * 8, top, 13, PAL.bottle[i % PAL.bottle.length]);
    }
  });
}

function bin(scene: Phaser.Scene) {
  const H = 28;
  prop(scene, PROP.bin, heightFor(H + 12), (g, cx, cy) => {
    standing(g, cx, cy, H, PAL.binBody, TW - 26, TH - 13);
    const top = cy - H;

    g.fillStyle(shade(PAL.binBody, 18), 0.35);
    g.fillRect(cx + 2, top + TH / 2 - 2, 10, H - 6);
    g.fillStyle(PAL.binLid, 1);                        // nắp hơi hé
    diamond(g, cx, top - 3, TW - 24, TH - 12);
    g.fillStyle(shade(PAL.binLid, 20), 1);
    g.fillRoundedRect(cx - 5, top - 8, 10, 3.2, 1.5);  // quai nắp
    g.fillStyle(PAL.charcoalDark, 0.5);                // khe hở dưới nắp
    g.fillRect(cx - (TW - 24) / 2, top - 1, TW - 24, 2);

    g.fillStyle(PAL.newsprint, 0.9);                   // mẩu giấy thò ra
    g.fillEllipse(cx + 9, top - 4, 9, 5);
  });
}

function sink(scene: Phaser.Scene) {
  const H = 30;
  const W = TW - 22, D = TH - 10;
  prop(scene, PROP.sink, heightFor(H + 26), (g, cx, cy) => {
    standing(g, cx, cy, H, 0x5e6b73, W, D);             // chân tủ sắt
    const top = cy - H;
    g.fillStyle(0xc9d3d8, 1);                           // mặt chậu inox
    diamond(g, cx, top, W, D);
    g.fillStyle(0x8e9aa1, 1);                           // lòng chậu
    g.fillEllipse(cx, top, W - 14, D - 6);
    g.fillStyle(0x9fc6d8, 0.7);                         // nước đọng
    g.fillEllipse(cx + 2, top + 1, W - 26, D - 12);
    g.lineStyle(3, 0xaab5bb, 1);                        // vòi cong
    g.beginPath();
    g.moveTo(cx - 10, top - 2);
    g.lineTo(cx - 10, top - 18);
    g.lineTo(cx - 2, top - 18);
    g.lineTo(cx - 2, top - 12);
    g.strokePath();
    slab(g, cx + 10, top - 14, 7, 14, 2, 0xc0392b, 2);  // chai xà bông đỏ — điểm nhấn
  });
}

/** Gánh tàu hũ dì Liên, đã hạ xuống đất: đòn tre gác ngang trên hai vành nồi. */
function ganh(scene: Phaser.Scene) {
  const POT = 14;
  prop(scene, PROP.ganh, heightFor(POT + 16), (g, cx, cy) => {
    for (const dx of [-16, 16]) {
      const s = dx < 0 ? 1 : 0.95;
      g.fillStyle(0x2b2b2b, 0.22);                     // bóng đổ dưới nồi
      g.fillEllipse(cx + dx, cy + 1, 26 * s, 9 * s);
      g.fillStyle(PAL.potDark, 1);
      g.fillEllipse(cx + dx, cy - 1, 23 * s, 9 * s);
      standing(g, cx + dx, cy, POT * s, PAL.pot, 22 * s, 10 * s);
      g.fillStyle(shade(PAL.pot, 26), 1);              // vành nồi
      g.fillEllipse(cx + dx, cy - POT * s, 23 * s, 9.5 * s);
      g.fillStyle(shade(PAL.potDark, -16), 0.85);      // miệng nồi sâu xuống
      g.fillEllipse(cx + dx, cy - POT * s + 1, 16 * s, 6 * s);
    }
    const rim = cy - POT - 1;                          // đòn gác trên vành nồi
    g.fillStyle(shade(PAL.breadDark, -8), 1);
    for (let i = -20; i <= 20; i++) {
      const t = i / 20;
      g.fillRect(cx + i * 0.95 - 1.6, rim - 2 + t * 1.6 + Math.abs(t) * -1.2, 3.2, 4.2);
    }
    g.fillStyle(shade(PAL.breadDark, 18), 0.6);        // bắt sáng dọc thân tre
    for (let i = -20; i <= 20; i++) {
      const t = i / 20;
      g.fillRect(cx + i * 0.95 - 1.6, rim - 2 + t * 1.6 + Math.abs(t) * -1.2, 3.2, 1.2);
    }
    g.fillStyle(0xe8e3d4, 1);                          // khăn vắt vắt qua đòn
    g.fillRoundedRect(cx - 5, rim - 2, 10, 13, 2.5);
    g.fillStyle(shade(0xe8e3d4, -20), 0.75);
    g.fillRect(cx - 5, rim + 5, 10, 1.8);
  }, TW + 38);
}

/** Xe chú Đạt: thùng thấp, ô xanh, không bảng hiệu — liếc là phân biệt với xe của mình. */
function cart(scene: Phaser.Scene) {
  const BODY = 20, CASE = 13, POLE = 30;
  prop(scene, PROP.cart, heightFor(BODY + CASE + POLE), (g, cx, cy) => {
    g.fillStyle(0x3a3a3a, 1);                          // bánh xe
    for (const dx of [-13, 13]) g.fillEllipse(cx + dx, cy - 3, 8, 5);
    standing(g, cx, cy, BODY, 0x9c6b4a, TW - 10, TH - 6);   // thân xe gỗ
    const top = cy - BODY;
    g.fillStyle(shade(0x9c6b4a, -30), 0.8);            // hộc dưới
    g.fillRect(cx - 14, top + 5, 28, 7);

    standing(g, cx, top, CASE, PAL.jarGlass, TW - 16, TH - 10);  // tủ kính
    g.fillStyle(0xffffff, 0.22);
    g.fillRect(cx - 12, top - CASE + 3, 24, CASE - 6);
    for (const dx of [-7, 0, 7]) loaf(g, cx + dx, top - 4, 0.55);  // bánh trong tủ

    const px = cx + 10;                                // cọc ô, lệch về một bên thân xe
    g.fillStyle(0x6f6f6f, 1);
    g.fillRect(px - 1.2, top - CASE - POLE, 2.4, POLE);
    const uy = top - CASE - POLE + 3;                  // ô XANH — khác hẳn dù của mình
    g.fillStyle(shade(0x3f7d5a, -26), 1);
    g.fillEllipse(px, uy + 3, 42, 9);
    g.fillStyle(0x3f7d5a, 1);
    g.fillEllipse(px, uy, 42, 13);
    g.fillStyle(shade(0x3f7d5a, 20), 0.55);            // bắt sáng mặt ô
    g.fillEllipse(px - 6, uy - 2, 20, 6);
  }, TW + 26);
}

export function buildProps(scene: Phaser.Scene) {
  sink(scene);
  oven(scene);
  tea(scene);
  shelf(scene);
  stool(scene);
  table(scene);
  bike(scene);
  pothos(scene);
  crate(scene);
  bin(scene);
  ganh(scene);
  cart(scene);
}
