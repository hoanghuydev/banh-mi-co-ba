import Phaser from "phaser";
import { WALL_H } from "../../art/building";
import { FX } from "../../art/fx";
import { PAL } from "../../art/palette";
import { BASE, footY } from "../../art/canvas";
import { TH, TW, depthOf, toScreen } from "../../world/iso";
import { COUNTER_Y, WORLD_W } from "../../world/map";

/**
 * Hai cây đèn tuýp trên tường sau + vũng sáng xuống khu làm việc. Mưa xuống là người ta BẬT ĐÈN,
 * nên quán phải SÁNG LÊN so với con hẻm chứ không tối đi cùng nó — và nó bơm lại tương phản đúng
 * khu T1 bắt phải nhìn rõ nhất (tay, thớt, ổ bánh).
 *
 * Vũng sáng blend `SCREEN` chứ không `ADD`: `ADD` làm sàn gạch men trắng cháy mất sạch đường chỉ.
 * Riêng quầng ngay tại bóng vẫn `ADD` — chỗ đó LÀ nguồn sáng.
 */

/**
 * ⚙️ BẢNG ĐÈN — `axis` là tường nào ("x" tường sau · "y" vách hông), `px`/`py` độ lệch vũng sáng,
 * `pw`/`ph` bề rộng (nhân texture `puff` 32 px).
 *
 * ⚠️ Không gắn trùng cột với một cái trạm: trạm có depth cao hơn nên vẽ ĐÈ lên cây đèn, và người
 * chơi thấy một vũng sáng không có nguồn.
 *
 * ⚠️ BẤT ĐỐI XỨNG LÀ CỐ Ý: `depthOf` vẽ theo `x + y`, nên vách TRÁI cho ta nhìn vào MẶT ĐỨNG còn
 * vách PHẢI chỉ cho thấy LƯNG và NÓC — không có chỗ nào để treo.
 */
type Lamp = {
  x: number; y: number; axis: "x" | "y";
  px: number; py: number; pw: number; ph: number;
};

const LAMPS: readonly Lamp[] = [
  { x: 6.2, y: 0.95, axis: "x", px: 1, py: 2.05, pw: 13, ph: 6.5 },
  { x: 11.8, y: 0.95, axis: "x", px: 1, py: 2.05, pw: 13, ph: 6.5 },
  // Đầu quầy bên trái: vách hông, vũng sáng hắt NGANG vào trong và nhỏ hơn hai cây
  // trên — xem ghi chú về chuyện tràn qua mép mái ở ngay trên.
  { x: 3.06, y: 4, axis: "y", px: 1.5, py: 0, pw: 9, ph: 4.5 },
  // Đầu quầy bên phải: PHẢI ở tường sau, không phải vách phải — xem "VÌ SAO ĐẦU TRÁI
  // GẮN VÁCH HÔNG MÀ ĐẦU PHẢI THÌ KHÔNG" ở trên.
  { x: 19.5, y: 0.95, axis: "x", px: 1, py: 2.05, pw: 11, ph: 5.5 },
];

/**
 * SUY TỪ HÌNH HỌC BỨC TƯỜNG, không phải con số chỉnh bằng mắt — nhờ vậy sửa chiều cao tường bên
 * `art/building.ts` thì cả bốn cây đèn tự theo.
 *
 * ⚠️ Hai bẫy đã dính: cao hơn `WALL_H` thì đèn lơ lửng giữa trời; đúng `WALL_H` thì nó rơi vào
 * MẶT NÓC của khối tường, nằm chỏng chơ trên mái nhà hàng xóm.
 */
const TUBE_UP = Math.round(BASE + (WALL_H + BASE) * 0.75 - TH / 2);
/** Nửa chiều dài và nửa bề dày thanh đèn, px. */
const TUBE_L = 22, TUBE_T = 2.6;

/**
 * Quầng ngay tại thanh đèn. ÔM LẤY thanh đèn, không nuốt nó: để to quá thì vầng sáng blend CỘNG
 * phủ trùm lên chính cây đèn, và nguồn sáng mà không thấy nguồn đâu thì mắt đọc ra là một vết
 * bẩn trên tường.
 */
const HALO = { x: 2.2, y: 1.1, alpha: 0.68 };

/**
 * ⚙️ NÚM VẶN ĐỘ SÁNG — chỉnh `alpha` ở dòng ngay dưới. Ăn theo blend `SCREEN` nên KHÔNG tuyến
 * tính và không bao giờ cháy trắng; tệ nhất là khung hình bệt.
 *
 * Mốc: 0,52 còn thấy rõ trời mưa · 0,68 sáng gần bằng ban ngày · 0,80 gần như không còn thấy mưa.
 * (Ngày nắng sàn ~0,95; chỉ có lớp phủ mưa mà không đèn thì ~0,69.)
 */
const POOL_ALPHA = 0.7;

/** Trên lớp phủ mưa (`Rain.GRADE_DEPTH` = 7.000.000), dưới nhãn trạm (8.000.000). */
const POOL_DEPTH = 7_000_100;

/**
 * Vượt TOÀN BỘ phần tường của quán — một vật GẮN LÊN TƯỜNG trải ngang qua mấy ô, mà mỗi ô có depth
 * riêng tăng dần, nên lấy depth theo ô của chính nó thì ô kế bên xén mất nửa cây đèn.
 *
 * ⚠️ Mốc này vượt luôn hàng QUẦY; thực tế không chạm vì đèn treo cao, nhưng dời một cây xuống thấp
 * hoặc ra sát quầy thì phải kiểm lại đúng chỗ này.
 */
const LAMP_DEPTH = depthOf(WORLD_W, COUNTER_Y) + 2;

export class ShopLight {
  /** MỘT Graphics cho MỖI cây đèn — xem `constructor`. */
  private readonly fixtures: Phaser.GameObjects.Graphics[] = [];
  private readonly halos: Phaser.GameObjects.Image[] = [];
  private readonly pools: Phaser.GameObjects.Image[] = [];
  private lit: boolean | null = null;

  constructor(scene: Phaser.Scene) {
    for (const L of LAMPS) {
      const { sx, sy } = toScreen(L.x, L.y);
      const bulb = footY(sy) - TUBE_UP;
      // Mỗi đèn một Graphics riêng: `drawFixture` xoá sạch rồi vẽ lại lúc bật/tắt, mà
      // bốn cây thì bật tắt cùng lúc nhưng nằm bốn chỗ — chung một Graphics là lần vẽ
      // sau xoá mất cây vẽ trước.
      this.fixtures.push(scene.add.graphics().setDepth(LAMP_DEPTH + 1));

      // Quầng tại đèn + vũng dưới sàn: cùng một texture tròn mềm của hạt bụi, đổi
      // `tint` và kéo giãn. Không nướng thêm texture nào cho một thứ chỉ là vệt sáng.
      this.halos.push(scene.add.image(sx, bulb, FX.puff)
        .setScale(HALO.x, HALO.y).setTint(PAL.lamp.core).setAlpha(HALO.alpha)
        .setBlendMode(Phaser.BlendModes.ADD)
        // DƯỚI cây đèn: quầng là ánh toả ra TỪ nó, không phải lớp sương phủ LÊN nó.
        .setDepth(LAMP_DEPTH).setVisible(false));

      const p = toScreen(L.x + L.px, L.y + L.py);
      this.pools.push(scene.add.image(p.sx, footY(p.sy), FX.puff)
        .setScale(L.pw, L.ph).setTint(PAL.lamp.glow).setAlpha(POOL_ALPHA)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setDepth(POOL_DEPTH).setVisible(false));
    }
    this.draw(false);
  }

  /**
   * ⚠️ Thanh nằm DỌC theo bức tường nó treo lên, suy từ phép chiếu: trục x là `(+TW/2, +TH/2)`,
   * trục y là `(−TW/2, +TH/2)`. Hai vách nghiêng NGƯỢC chiều nên một hằng số duy nhất sai ở một
   * nửa số đèn.
   */
  private drawFixture(g: Phaser.GameObjects.Graphics, sx: number, cy: number, axis: "x" | "y", on: boolean) {
    const len = Math.hypot(TW / 2, TH / 2);
    const dx = ((axis === "x" ? TW : -TW) / 2) / len, dy = (TH / 2) / len;
    const nx = -dy, ny = dx;
    const quad = (hl: number, ht: number) => [
      { x: sx - dx * hl - nx * ht, y: cy - dy * hl - ny * ht },
      { x: sx + dx * hl - nx * ht, y: cy + dy * hl - ny * ht },
      { x: sx + dx * hl + nx * ht, y: cy + dy * hl + ny * ht },
      { x: sx - dx * hl + nx * ht, y: cy - dy * hl + ny * ht },
    ];
    g.clear();
    g.fillStyle(PAL.lamp.housing, 1);
    g.fillPoints(quad(TUBE_L + 3, TUBE_T + 1.8), true);          // máng đèn
    g.fillStyle(on ? PAL.lamp.core : PAL.lamp.shell, 1);
    g.fillPoints(quad(TUBE_L, TUBE_T), true);                    // thân bóng
    // Hai đầu bịt: không có chúng thì thanh sáng đọc ra là một vệt sơn, không ra bóng đèn.
    g.fillStyle(PAL.lamp.housing, 1);
    for (const s of [-1, 1]) {
      g.fillCircle(sx + dx * TUBE_L * s, cy + dy * TUBE_L * s, TUBE_T + 0.8);
    }
  }

  /**
   * `on` = hôm nay có cần đèn không. Hiện chỉ ngày mưa — nhưng cổng là một tham số chứ
   * không phải một câu hỏi về thời tiết nằm trong này, để lúc nào thêm "tối trời" hay
   * "mất điện" thì không phải mổ lại lớp vẽ.
   */
  draw(on: boolean) {
    if (on === this.lit) return;                       // chỉ đụng tới GameObject lúc ĐỔI
    this.lit = on;
    for (const h of this.halos) h.setVisible(on);
    for (const p of this.pools) p.setVisible(on);
    LAMPS.forEach((L, i) => {
      const { sx, sy } = toScreen(L.x, L.y);
      this.drawFixture(this.fixtures[i], sx, footY(sy) - TUBE_UP, L.axis, on);
    });
  }

  destroy() {
    for (const g of this.fixtures) g.destroy();
    for (const h of this.halos) h.destroy();
    for (const p of this.pools) p.destroy();
  }
}
