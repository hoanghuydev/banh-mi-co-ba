import Phaser from "phaser";
import { TW, TH } from "../world/iso";
import { PAL } from "./palette";
import { blob, diamond, heightFor, prop, shade, slab, standing, type Pen } from "./canvas";

/**
 * Đạo cụ trong quán và trên vỉa hè. Mỗi hàm vẽ đúng một vật,
 * không hàm nào biết tới scene hay bản đồ.
 *
 * MỌI vật ở đây đứng bằng `standing()` — mặt đáy khối trùng khít mặt ô.
 * Trước đây dùng `isoBox` trần nên khối thò xuống dưới đáy texture và bị
 * cắt vát mất chân (thùng trà đá là ca rõ nhất).
 *
 * Chi tiết môi trường bắt buộc của CANON §14: ghế nhựa, hũ đũa,
 * xe máy dựng sát vách, chậu trầu bà.
 *
 * ── Luật vẽ chi tiết ở kích cỡ này ───────────────────────────────────────────
 * Một ô chỉ rộng 60 px. Chi tiết nào nhỏ hơn ~3 px thì ở màn 1024×576 nó biến
 * thành một hạt nhiễu, làm vật trông BẨN chứ không trông KỸ. Nên mọi thứ ở đây
 * đi theo ba bước: khối lớn có viền tối (`blob`/`slab`) → một mảng sáng để mắt
 * đọc ra chất liệu → đúng một hoặc hai "điểm nhấn" bằng màu tương phản mạnh
 * (nắp hũ đỏ, ớt, đèn xe). Nhiều hơn ba tầng là thừa, không ai thấy.
 */
export const PROP = {
  oven: "oven", tea: "tea", shelf: "shelf",
  stool: "stool", table: "table", bike: "bike", pothos: "pothos",
  crate: "crate", bin: "bin",
} as const;

// ───────────────────────────────────────────────────────────── mẩu dùng nhiều nơi

/** Ổ bánh mì nhìn nghiêng — xuất hiện ở lò, ở kệ, ở rổ đầu quầy. */
function loaf(g: Pen, x: number, y: number, s = 1) {
  g.fillStyle(PAL.breadDark, 1);
  g.fillEllipse(x, y, 20 * s, 8 * s);
  g.fillStyle(PAL.bread, 1);
  g.fillEllipse(x, y - 1.2 * s, 17 * s, 6 * s);
  g.fillStyle(PAL.breadSlash, 0.9);                    // đường rạch trên lưng bánh
  g.fillRect(x - 5 * s, y - 3 * s, 10 * s, 1.3 * s);
}

/** Hũ thuỷ tinh có nắp — pate, đồ chua, ớt xay. Nắp là điểm nhấn màu duy nhất. */
function jar(g: Pen, x: number, y: number, w: number, h: number, fill: number) {
  slab(g, x - w / 2, y - h, w, h, 2.5, PAL.jarGlass, 2);
  g.fillStyle(fill, 0.95);                             // phần ruột nhìn xuyên kính
  g.fillRoundedRect(x - w / 2 + 1.5, y - h + h * 0.35, w - 3, h * 0.65 - 1.5, 2);
  g.fillStyle(0xffffff, 0.4);                          // vệt sáng dọc thành hũ
  g.fillRect(x - w / 2 + 2, y - h + 3, 1.6, h - 6);
  g.fillStyle(PAL.jarLid, 1);                          // nắp
  g.fillRoundedRect(x - w / 2 - 1, y - h - 3, w + 2, 4, 1.5);
}

/** Chai nhựa / chai nước tương dựng đứng. */
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

/** Một chiếc lá của bụi trầu bà. */
function leaf(g: Pen, x: number, y: number, color: number, s = 1) {
  g.fillStyle(shade(color, -26), 1);
  g.fillEllipse(x, y, 15 * s, 11 * s);
  g.fillStyle(color, 1);
  g.fillEllipse(x, y - 0.5, 12.5 * s, 8.5 * s);
  g.fillStyle(shade(color, 22), 0.5);                  // gân lá
  g.fillRect(x - 4 * s, y - 1, 8 * s, 1);
}

// ──────────────────────────────────────────────────────────────────── đạo cụ quán

/**
 * Bếp than: slot OVEN.
 * Lửa phải NHÌN THẤY được thì người chơi mới đọc được rủi ro (T5) — nên than hồng,
 * vỉ nướng và hai ổ bánh đang hơ đều nằm ở mặt trên, không bị gì che.
 */
function oven(scene: Phaser.Scene) {
  const H = 26;
  const W = TW - 10, D = TH - 5;
  prop(scene, PROP.oven, heightFor(H + 24), (g, cx, cy) => {
    // Thân lò bằng tôn xám chứ không phải màu than: để màu than đậm cho LÒNG lò,
    // thì cái miệng đỏ rực mới bật lên. Cả khối cùng một màu tối là mất luôn ngọn lửa,
    // mà người chơi phải đọc được lửa mới đọc được rủi ro (T5).
    // Dùng thẳng màu tôn, KHÔNG làm tối thêm: `isoBox` còn tự trừ 32 độ sáng nữa
    // cho mặt bên khuất nắng, nên tối sẵn ở đây là ra một khối đen kịt.
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

    // Vỉ nướng: các thanh cắt theo đúng hình thoi miệng lò, không thanh nào thò ra
    // ngoài thân — bản trước để nó tràn ra hai bên nên trông như cái thang dựng ngang.
    g.lineStyle(1.7, PAL.grill, 0.95);
    for (let t = -0.8; t <= 0.8; t += 0.4) {
      const hw = ((W - 16) / 2) * (1 - Math.abs(t) * 0.55);
      const my = top + (t * (D - 8)) / 2;
      g.lineBetween(cx - hw, my - hw * 0.5, cx + hw, my + hw * 0.5);
    }

    loaf(g, cx - 7, top - 6, 0.66);                    // hai ổ đang hơ cho nóng lại
    loaf(g, cx + 6, top - 9, 0.66);

    // quạt nan dựng vào hông lò — thứ khiến cái lò đọc ra là lò than, không phải bếp ga
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

/**
 * Thùng trà đá — CANON §5.4: công cụ CHỦ ĐỘNG hạ attention của khách.
 *
 * Bản trước bày ba thứ rời nhau cạnh nhau (thùng · chồng ly · tấm bảng đỏ dựng
 * dưới đất) nên ở 60 px nó đọc ra là một đống đồ vứt ở góc, không phải MỘT vật.
 * Giờ gom hết về một khối: bảng dán LÊN thân thùng, chồng ly đặt LÊN nắp thùng.
 * Một bóng hình, ba mảng màu — xanh / đỏ / trắng — nhìn phát ra ngay.
 */
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

    // chồng ly nhựa đặt NGAY TRÊN nắp thùng — cùng một khối, không còn vật rời
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

    // bảng "TRÀ ĐÁ" DÁN LÊN mặt thùng, nghiêng theo mặt vách
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

/**
 * Kệ nguyên liệu: khung sắt ba tầng.
 * Hạn dùng là ràng buộc kinh tế #1 (CANON §13) — nên hàng phải NHÌN THẤY ĐƯỢC
 * và đếm được bằng mắt, chứ không nằm trong một cái thùng kín.
 *
 * Bản trước nhồi bảy nhóm đồ vào ba tầng, lại còn để rổ bánh và chai nước tương
 * thò hẳn ra ngoài khung kệ — nhìn ra một đống lộn xộn chứ không ra cái kệ.
 * Luật bây giờ: MỖI TẦNG ĐÚNG MỘT NHÓM, và không gì được vượt quá mép ván kệ.
 */
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

    // ── tầng dưới: hai két nhựa xếp cạnh nhau
    let top = board(0);
    for (const [dx, color] of [[-11, PAL.crate[0]], [11, PAL.crate[1]]] as const) {
      standing(g, cx + dx, top, 12, color, 21, 10);
      g.fillStyle(0x000000, 0.16);
      g.fillRect(cx + dx - 9, top - 4, 18, 2.2);
    }

    // ── tầng giữa: ba hũ bằng nhau, chia đều bề ngang kệ
    top = board(1);
    jar(g, cx - 14, top, 12, 13, PAL.pate);
    jar(g, cx, top, 12, 13, PAL.pickle);
    jar(g, cx + 14, top, 12, 13, PAL.chilli);

    // ── tầng trên: một rổ bánh, nằm gọn trong khung kệ
    top = board(2);
    blob(g, cx, top - 5, HALF * 2 - 4, 14, PAL.basketDark);
    g.fillStyle(PAL.basket, 1);
    g.fillEllipse(cx, top - 7, HALF * 2 - 10, 10);
    loaf(g, cx - 6, top - 10, 0.62);
    loaf(g, cx + 5, top - 12, 0.62);
    loaf(g, cx - 1, top - 15, 0.58);
  });
}

/** Ghế nhựa đỏ — cái ghế mà ai từng ngồi quán vỉa hè đều nhận ra trong nửa giây. */
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

/** Bàn nhựa thấp + hũ đũa + chén ớt + hộp giấy — bộ tứ của quán vỉa hè. */
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

/**
 * Xe máy dựng sát vách nhường lối đi — CANON §14.
 * Vẽ đúng dáng xe số: yên dài, giỏ trước, kính chiếu hậu, biển số.
 * Không có mấy chi tiết đó thì ở 60 px nó chỉ là hai bánh xe và một cục tối.
 */
function bike(scene: Phaser.Scene) {
  prop(scene, PROP.bike, heightFor(52), (g, cx, cy) => {
    const axle = cy - 11;

    for (const dx of [-17, 16]) {                      // hai bánh, chạm đất
      blob(g, cx + dx, axle, 22, 22, PAL.tyre, 2);
      g.fillStyle(shade(PAL.tyre, 22), 1);
      g.fillCircle(cx + dx, axle, 7.5);
      g.fillStyle(PAL.chrome, 1);
      g.fillCircle(cx + dx, axle, 3.5);
      // KHÔNG vẽ nan hoa: ở đường kính 22 px mỗi nan chỉ còn dưới 1 px,
      // ra đúng một mảng nhiễu xám làm bánh xe trông bẩn chứ không trông kỹ.
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

/**
 * Chậu trầu bà — CANON §14.
 * Để DƯỚI ĐẤT chứ không treo: bản treo cao đọc ra như cột lá lơ lửng,
 * vì ở góc iso này không có gì phía trên để mắt hiểu là nó treo vào đâu.
 */
function pothos(scene: Phaser.Scene) {
  const POT = 20;
  prop(scene, PROP.pothos, heightFor(POT + 34), (g, cx, cy) => {
    g.fillStyle(PAL.potDark, 1);                       // chậu đất nung
    g.fillPoints([
      { x: cx - 15, y: cy - POT }, { x: cx + 15, y: cy - POT },
      { x: cx + 11, y: cy }, { x: cx - 11, y: cy },
    ], true);
    g.fillStyle(PAL.pot, 1);
    g.fillEllipse(cx, cy - POT, 30, 10);
    g.fillStyle(shade(PAL.pot, 16), 0.5);              // gờ miệng chậu
    g.fillRect(cx - 14, cy - POT - 1, 28, 2);
    g.fillStyle(0x4a3a2c, 1);
    g.fillEllipse(cx, cy - POT, 22, 6);

    const rim = cy - POT;
    const bush: [number, number, number][] = [         // bụi lá xoè lên rồi rủ xuống
      [-13, -6, 1], [12, -7, 1], [0, -19, 0.9], [-9, -19, 0.85], [10, -18, 0.85],
      [-17, 4, 0.95], [16, 3, 0.95], [-4, -10, 1], [5, -11, 1], [0, 2, 0.9],
      [-6, -26, 0.7], [6, -25, 0.7],
    ];
    bush.forEach(([dx, dy, s], i) =>
      leaf(g, cx + dx, rim + dy, i % 3 === 0 ? PAL.leafDark : PAL.leaf, s));

    g.lineStyle(1.4, PAL.leafDark, 0.85);              // một nhánh rủ xuống thành chậu
    g.lineBetween(cx + 14, rim - 2, cx + 19, rim + 12);
    leaf(g, cx + 20, rim + 15, PAL.leaf, 0.55);
  });
}

// ─────────────────────────────────────────────────────────────── đạo cụ vỉa hè

/** Chồng két nước ngọt dựng sát vách — rác đường phố có chủ ý, đọc ra "quán đang sống". */
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

/** Thùng rác nhỏ đầu hẻm. Có nó thì vỉa hè mới đọc ra là vỉa hè thật. */
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

export function buildProps(scene: Phaser.Scene) {
  oven(scene);
  tea(scene);
  shelf(scene);
  stool(scene);
  table(scene);
  bike(scene);
  pothos(scene);
  crate(scene);
  bin(scene);
}
