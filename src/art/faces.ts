import type Phaser from "phaser";
import { buildBody } from "./character";
import { faceCrop } from "./photo";
import { CO_BA_BODY } from "../content/npcs";

/**
 * Chân dung cô Ba, cắt từ chính cái texture người cô — dùng ở màn mở đầu (`scenes/IntroScene`)
 * và ở bong bóng dẫn bữa đầu (`ui/tour/TourCoach`).
 *
 * Một chỗ duy nhất vì hai nơi kia phải ra CÙNG MỘT KHUÔN MẶT: người giao xe lúc 4 rưỡi sáng và
 * người đứng chỉ việc trong quán là một bà. Hai phép cắt khác nhau là hai bà khác nhau.
 *
 * Cô Ba chưa bao giờ đứng trong cảnh nào nên texture của cô chưa có — nướng tại chỗ, lần đầu gọi.
 * Chưa nướng được thì trả chuỗi rỗng: chỗ gọi để khung trống, không chỗ nào vỡ.
 */
export function coBaFace(scene: Phaser.Scene): string {
  const key = "CO_BA_s";
  if (!scene.textures.exists(key)) buildBody(scene, "CO_BA", CO_BA_BODY);
  return scene.textures.exists(key) ? faceCrop(scene, key) : "";
}
