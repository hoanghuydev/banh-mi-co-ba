import Phaser from "phaser";
import { WALL_H } from "../../art/building";
import { FX } from "../../art/fx";
import { PAL } from "../../art/palette";
import { BASE, footY } from "../../art/canvas";
import { TH, TW, depthOf, toScreen } from "../../world/iso";
import { COUNTER_Y, WORLD_W } from "../../world/map";

/**
 * HAI CÂY ĐÈN TUÝP TRÊN TƯỜNG SAU — và vũng sáng chúng đổ xuống khu làm việc.
 *
 * Lớp phủ mưa kéo CẢ khung hình về xám xanh, mà khung hình có hai nửa khác hẳn nhau: ngoài hiên
 * ướt, trong quán thì không. Mưa xuống là người ta BẬT ĐÈN, nên cái quán phải SÁNG LÊN so với
 * con hẻm chứ không tối đi cùng nó. Nó cũng trả một món nợ của T1: lớp phủ hạ tương phản đúng
 * khu người chơi phải nhìn kỹ nhất (tay, thớt, ổ bánh).
 *
 * ĐÈN TUÝP chứ không bóng tròn: ở cỡ thật một bóng compact ra cái chấm 4 px treo dưới một gạch
 * ngang, đọc ra là cột cắm bảng. Thanh nằm NGHIÊNG theo hướng bức tường (dốc `TH/TW`) — tường
 * trong phép chiếu iso chạy chéo, thanh ngang dán lên đọc ra là thanh đang rơi.
 *
 * Vũng sáng dùng blend `SCREEN` chứ không `ADD`: `ADD` cộng thẳng nên sàn gạch men trắng cháy
 * trắng mất sạch đường chỉ gạch. `SCREEN` kéo chỗ TỐI lên nhiều, chỗ SÁNG gần như không đổi, và
 * không bao giờ vượt quá 1. Riêng quầng ngay tại bóng vẫn `ADD` — chỗ đó LÀ nguồn sáng.
 *
 * HAI vũng chứ không một: dải trong quán trên màn hình là một BĂNG CHÉO (dốc 1:2) còn vũng sáng
 * là ê-líp nằm ngang, nên một vũng đủ rộng để phủ hết quầy sẽ TRÀN qua mép mái ra vỉa hè.
 */

/**
 * ⚙️ BẢNG ĐÈN — thêm, bớt hay dời một cây đèn thì sửa đúng mảng này.
 *
 *   `x`, `y`   chỗ gắn, theo ô thế giới
 *   `axis`     thanh đèn nằm DỌC theo tường nào: "x" tường sau · "y" vách hông
 *   `px`,`py`  vũng sáng lệch đi đâu so với đèn — đèn gắn tường hắt CHÉO xuống
 *   `pw`,`ph`  bề rộng vũng sáng (nhân texture `puff` 32 px)
 *
 * ⚠️ Hai cột x của hai cây tường sau không chọn cho cân đối: gắn trùng cột với một cái trạm là
 * trạm đó (depth cao hơn) vẽ ĐÈ lên cây đèn, và người chơi thấy một vũng sáng không có nguồn.
 * 6,2 lọt giữa kệ và lò; 11,8 lọt giữa thùng rác và thùng trà.
 *
 * ⚠️ BẤT ĐỐI XỨNG LÀ CỐ Ý — đầu trái gắn vách hông, đầu phải thì không. `depthOf` vẽ theo `x + y`:
 * vách TRÁI nằm phía sau sàn quán nên ta nhìn thẳng vào MẶT ĐỨNG của nó, còn vách PHẢI nằm TRƯỚC
 * sàn quán nên thứ thấy được là LƯNG và NÓC — không có chỗ nào để treo. Cây đó dời về TƯỜNG SAU
 * ở `x = 19,5`. Nhìn từ góc này thì quán chỉ có BA bức tường thấy được mặt trong.
 *
 * Cây vách trái đặt ngang tầm quầy (`y = 4`): lùi sâu thì vũng sáng rơi vào góc tường trống, đẩy
 * ra sát quầy (y ≥ 5) thì vũng sáng TRÀN qua mép mái ra vỉa hè.
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
 * Đèn treo cao bao nhiêu px so với mặt sàn — SUY TỪ HÌNH HỌC BỨC TƯỜNG, không phải con số chỉnh
 * bằng mắt.
 *
 * ⚠️ Hai cái bẫy đã dính: treo cao hơn `WALL_H` thì cây đèn nhô khỏi mép tường, lơ lửng giữa
 * khoảng trời; mà treo đúng `WALL_H` thì thanh đèn rơi vào MẶT NÓC của khối tường, nằm chỏng chơ
 * trên mái nhà hàng xóm.
 *
 * Nên tính thẳng từ cách `art/building.wallBody` dựng khối: mặt đứng trải từ `BASE` tới
 * `WALL_H + BASE` px, treo ở 3/4 khoảng đó, rồi trừ `TH/2` vì cây đèn đứng trước tường nửa ô.
 * Nhờ vậy sửa chiều cao tường bên `art/building.ts` thì cả bốn cây đèn tự theo.
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
 * ⚙️ NÚM VẶN ĐỘ SÁNG CỦA ĐÈN — chỉnh `alpha` ở dòng ngay dưới là xong.
 *
 * `alpha` ăn theo blend `SCREEN` nên KHÔNG tuyến tính và KHÔNG BAO GIỜ cháy trắng — tệ nhất là
 * khung hình bệt chứ không mất chi tiết:
 *
 *   | alpha | sàn gạch men ngày mưa | đọc ra là                         |
 *   |-------|----------------------|-----------------------------------|
 *   | 0,52  | ~0,85                | đủ sáng, còn thấy là trời đang mưa |
 *   | 0,68  | ~0,90                | sáng rõ, gần bằng ban ngày         |
 *   | 0,80  | ~0,94                | gần như không còn thấy trời mưa    |
 *   | 1,00  | 1,00                 | trắng bệt, mất hết chỗ tối để nhìn |
 *
 * Mốc so sánh: ngày nắng sàn ~0,95; chỉ có lớp phủ mưa mà không đèn thì ~0,69. Cỡ từng vũng sáng
 * nằm ở `pw`/`ph` trong BẢNG ĐÈN phía trên.
 */
const POOL_ALPHA = 0.7;

/** Trên lớp phủ mưa (`Rain.GRADE_DEPTH` = 7.000.000), dưới nhãn trạm (8.000.000). */
const POOL_DEPTH = 7_000_100;

/**
 * ĐỘ SÂU CỦA CÂY ĐÈN — vượt TOÀN BỘ phần tường của quán, đúng mẹo tấm bảng hiệu đã dùng
 * (`art/sign.createSign`).
 *
 * ⚠️ Một vật GẮN LÊN TƯỜNG trải ngang qua mấy ô, mà mỗi ô tường có depth riêng tăng dần — lấy
 * depth theo ô của chính nó thì ô tường kế bên xén mất nửa cây đèn.
 *
 * Mốc là góc XA NHẤT của phần tường (`WORLD_W`, `COUNTER_Y`), không phải hàng tường sau: vách
 * phải có depth tới 31.000, cao hơn hẳn hàng tường sau (26.000).
 *
 * ⚠️ Mốc này vượt luôn hàng QUẦY (27.000) — trên lý thuyết đèn vẽ đè lên quầy, thực tế không bao
 * giờ chạm vì đèn treo cao trên vách. Dời một cây đèn xuống thấp hoặc ra sát quầy thì phải kiểm
 * lại đúng chỗ này.
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
   * Một cây đèn tuýp: máng bắt tường, thân bóng, hai đầu bịt.
   *
   * ⚠️ Thanh nằm DỌC theo bức tường nó treo lên, suy thẳng từ phép chiếu: đi một ô theo trục x
   * trên màn hình là `(+TW/2, +TH/2)` — xuống-phải; theo trục y là `(−TW/2, +TH/2)` — xuống-trái.
   * Hai bức vách nghiêng NGƯỢC chiều nhau nên một hằng số duy nhất là sai ở một nửa số đèn.
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
