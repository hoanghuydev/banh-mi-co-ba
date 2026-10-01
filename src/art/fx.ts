import Phaser from "phaser";
import { TW, TH } from "../world/iso";
import { SHADOW } from "./palette";

/** Hiệu ứng nhỏ: bóng đổ, vòng sáng "đang với tới được", ruồi bu thớt, bụi lau thớt. */
export const FX = { shadow: "shadow", ring: "ring", fly: "fly", puff: "puff" } as const;

/**
 * Bề ngang con ruồi, tính bằng px thiết kế.
 *
 * KHÔNG phải cỡ thật: ở đây mặt thớt rộng chừng 46 px cho ~40 cm, nên một con ruồi
 * đúng tỉ lệ sẽ chưa tới 1 px — tức vô hình, mà P1-02 §2.10 đòi độ bẩn phải NHÌN
 * THẤY ĐƯỢC. Mấy mẩu vụn bánh cạnh nó cũng đã phóng chừng mười lần rồi.
 *
 * 7 px là mức đọc ra cánh và thân ở zoom của cảnh quán mà vẫn còn bé hơn bàn tay cô Ba.
 * Đây là con số để CHỈNH BẰNG MẮT — đổi ở đây là đổi mọi chỗ.
 */
export const FLY_W = 7;

/** Khung vuông của texture ruồi — chừa chỗ cho cánh lúc ảnh bị XOAY theo hướng bay. */
export const FLY_BOX = 14;

/**
 * Cỡ hạt bụi. 32 px là dư: mặt thớt chỉ rộng `BOARD_W = 28`, mà hạt còn được emitter
 * thu xuống 0,2 lúc sinh ra. Lấy dư rồi thu lại thì rìa hạt mới mượt — P5-02 §621
 * cho ngân sách 4–6 texture hạt cho cả lửa/khói/mưa/bụi, nên một texture tròn mềm
 * dùng chung, đổi tông bằng `tint`, là đúng khoản đó.
 */
const PUFF_PX = 32;
/**
 * Số lớp vẽ chồng. Mỗi lớp phủ alpha 0,11 nên tâm hạt (bị cả 14 lớp phủ) đậm
 * 1−0,89¹⁴ ≈ 0,80, rìa chỉ 0,11 — ra dốc mềm. Vẽ một vòng tròn đặc rồi hạ alpha thì
 * rìa thành một ĐƯỜNG TRÒN đọc ra được, hạt hoá bong bóng xà phòng chứ không ra bụi.
 */
const PUFF_LAYERS = 14;

export function buildFx(scene: Phaser.Scene) {
  // Bóng đổ: ê-líp dẹt bằng đúng sải chân, đặt ngay TẠI điểm chạm đất.
  // Bóng to và rơi thấp là thứ làm nhân vật trông lơ lửng.
  const g1 = scene.make.graphics({ x: 0, y: 0 }, false);
  g1.fillStyle(SHADOW.color, SHADOW.alpha);
  g1.fillEllipse(14, 6, 24, 10);
  g1.generateTexture(FX.shadow, 28, 12);
  g1.destroy();

  // Vòng dưới chân trạm: phản hồi điều khiển, không phải trang trí —
  // người chơi phải biết mình đang với tới cái gì mà không cần đoán.
  const g2 = scene.make.graphics({ x: 0, y: 0 }, false);
  g2.lineStyle(2.5, 0xffe9a8, 0.95);
  g2.strokeEllipse(TW / 2 + 1, TH / 2 + 1, TW - 12, TH - 6);
  g2.generateTexture(FX.ring, TW + 2, TH + 2);
  g2.destroy();

  // Ruồi bản vẽ code — đúng cái chấm đen trước giờ. `art/photo.ts` đè ảnh thật lên
  // nếu `fly.png` về kịp; không kịp thì vẫn còn chấm này, không thủng lỗ.
  const g3 = scene.make.graphics({ x: 0, y: 0 }, false);
  g3.fillStyle(0x1b1b1b, 1);
  g3.fillCircle(FLY_BOX / 2, FLY_BOX / 2, 1.8);
  g3.generateTexture(FX.fly, FLY_BOX, FLY_BOX);
  g3.destroy();

  // Hạt bụi lau thớt. Vẽ TRẮNG để `tint` bên emitter quyết màu — một texture xài cho
  // mọi tông bụi, khỏi nướng thêm cái nào.
  const g4 = scene.make.graphics({ x: 0, y: 0 }, false);
  const r = PUFF_PX / 2;
  for (let i = PUFF_LAYERS; i >= 1; i--) {
    g4.fillStyle(0xffffff, 0.11);
    g4.fillCircle(r, r, r * (i / PUFF_LAYERS));
  }
  g4.generateTexture(FX.puff, PUFF_PX, PUFF_PX);
  g4.destroy();
}
