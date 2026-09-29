import Phaser from "phaser";
import { TW, TH } from "../world/iso";
import { SHADOW } from "./palette";

/** Hiệu ứng nhỏ: bóng đổ và vòng sáng "đang với tới được". */
export const FX = { shadow: "shadow", ring: "ring" } as const;

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
}
