/**
 * Độ phân giải render — vì sao game từng mờ, và chỗ duy nhất chỉnh nó.
 *
 * `Phaser.Scale.FIT` giữ canvas ĐÚNG cỡ thiết kế rồi nhờ CSS kéo ra cho vừa cửa sổ: trên màn 1920
 * ở dpr 1,125 thì cả khung hình bị phóng 2,1 lần và không tấm ảnh nào sống sót qua đó.
 *
 * Thuốc: dựng canvas ở `GAME_W × RENDER_SCALE` rồi cho MỌI camera zoom đúng `RENDER_SCALE` với gốc
 * biến đổi ở (0, 0) — canvas có thật từng ấy pixel, mà mọi toạ độ trong code VẪN là toạ độ thiết
 * kế, không chỗ layout nào phải biết `RENDER_SCALE` tồn tại.
 *
 * ⚠️ Nâng độ phân giải KHÔNG tự làm ảnh nét: một texture nướng ở 78 px thì phóng lên bao nhiêu cũng
 * vẫn chỉ có 78 px thông tin. Phải đi kèm `ART_SS` bên `art/photo.ts`.
 *
 * Giá phải trả: fill rate tăng theo BÌNH PHƯƠNG (2× là gấp 4 lần số pixel mỗi frame), nên trần 2 ở
 * đây là trần CỐ Ý — ngân sách 33 ms/frame trên máy yếu.
 */
import Phaser from "phaser";
import { GAME_W } from "./config";

/** Trần phóng. Xem "Giá phải trả" trên — đừng nâng mà không đo lại 33 ms/frame. */
const MAX_SCALE = 2;

/**
 * Bao nhiêu pixel thật cho một pixel thiết kế. Đo theo MÀN HÌNH chứ không theo cửa sổ: texture đã
 * nướng xong từ lúc boot, nên lấy theo cửa sổ là cứ phóng to cửa sổ một cái là mờ lại.
 */
export const RENDER_SCALE: number = (() => {
  if (typeof window === "undefined") return 1;          // test chạy trong node, không có DOM
  const px = (window.screen?.width ?? window.innerWidth) * (window.devicePixelRatio || 1);
  return Math.min(MAX_SCALE, Math.max(1, px / GAME_W));
})();

/**
 * Độ phân giải canvas của `Text`. Cao hơn `RENDER_SCALE` một nhịp vì chữ TRONG CẢNH (tên trạm, tên
 * khách, bong bóng thoại) còn bị camera thế giới phóng thêm `ZOOM` nữa — lấy dư cho cả hai loại
 * chữ dùng chung một con số, texture chữ vốn bé.
 */
export const TEXT_RES = Math.min(3, RENDER_SCALE * 1.5);

/**
 * Bắt MỌI `scene.add.text()` nướng chữ ở `TEXT_RES`. Phaser 3 đã bỏ `resolution` khỏi game config
 * nên không còn chỗ nào đặt một lần cho cả game, mà nhét vào từng style ở 20 chỗ gọi thì quên một
 * chỗ là chỗ đó nhoè trong im lặng.
 *
 * `register` của Phaser có chốt `hasOwnProperty` nên phải `remove` trước. Style người gọi truyền
 * vào vẫn thắng — `resolution` chỉ là MẶC ĐỊNH. Gọi đúng một lần, trước `new Phaser.Game`.
 */
export function installTextResolution() {
  const F = Phaser.GameObjects.GameObjectFactory;
  const native = F.prototype.text;
  F.remove("text");
  F.register("text", function (this: Phaser.GameObjects.GameObjectFactory,
    x: number, y: number, text: string | string[],
    style?: Phaser.Types.GameObjects.Text.TextStyle) {
    return native.call(this, x, y, text, { resolution: TEXT_RES, ...style });
  });
}

/**
 * Canh một camera vào khung thiết kế trên cái canvas đã phóng to. Gốc biến đổi dời hẳn về (0, 0)
 * và scroll để nguyên 0, nên phép chiếu rút gọn còn đúng một phép nhân.
 *
 * ⚠️ KHÔNG dùng `centerOn`: nó canh khung bằng SCROLL, mà object `scrollFactor(0)` — toàn bộ HUD và
 * mấy cái bảng — theo định nghĩa là bỏ qua scroll, nên cả lớp UI trôi sang trái đúng
 * `scrollX × zoom` px.
 *
 * Chỉ dành cho camera ĐỨNG YÊN. Camera thế giới của cảnh quán giữ gốc 0,5 mặc định vì `startFollow`,
 * `setBounds` và `worldView` đều tính theo gốc giữa.
 */
export function fitDesignFrame(cam: Phaser.Cameras.Scene2D.Camera) {
  cam.setZoom(RENDER_SCALE);
  cam.setOrigin(0, 0);
  cam.setScroll(0, 0);
}
