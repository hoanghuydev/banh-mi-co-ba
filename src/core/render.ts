/**
 * Độ phân giải render — vì sao game từng mờ, và chỗ duy nhất chỉnh nó.
 *
 * ── Bệnh ──────────────────────────────────────────────────────────────────────
 * `Phaser.Scale.FIT` giữ canvas ĐÚNG cỡ thiết kế (1024 × 576) rồi nhờ CSS kéo ra
 * cho vừa cửa sổ. Trên một màn 1920 ở dpr 1,125 thì 1024 px được kéo thành ~2160
 * device px: cả khung hình bị phóng 2,1 lần, và không một tấm ảnh nào sống sót
 * qua đó. Zoom camera của cảnh quán nhân thêm một lần nữa.
 *
 * ── Thuốc ─────────────────────────────────────────────────────────────────────
 * Dựng canvas ở `GAME_W × RENDER_SCALE` rồi cho MỌI camera zoom đúng `RENDER_SCALE`
 * với gốc biến đổi ở (0, 0) — xem `fitDesignFrame`. Nhờ vậy:
 *
 *   - canvas có thật từng ấy pixel, trình duyệt không phải kéo giãn nữa;
 *   - mọi toạ độ trong code VẪN là toạ độ thiết kế 1024 × 576 — không một chỗ
 *     layout nào phải biết `RENDER_SCALE` tồn tại.
 *
 * Nâng độ phân giải KHÔNG tự làm ảnh nét: một texture nướng ở 78 px thì phóng
 * lên bao nhiêu cũng vẫn chỉ có 78 px thông tin. Phải đi kèm `ART_SS` bên
 * `art/photo.ts` — nướng texture dư pixel ra. Thiếu một trong hai là công cốc.
 *
 * ── Giá phải trả ──────────────────────────────────────────────────────────────
 * Fill rate tăng theo BÌNH PHƯƠNG: 2× là gấp 4 lần số pixel mỗi frame. CANON §2 /
 * P0-01 §2.8 chốt ngân sách 33 ms/frame trên máy yếu, nên trần 2 ở đây là trần
 * CỐ Ý, không phải con số tròn cho đẹp.
 */
import Phaser from "phaser";
import { GAME_W } from "./config";

/** Trần phóng. Xem "Giá phải trả" trên — đừng nâng mà không đo lại 33 ms/frame. */
const MAX_SCALE = 2;

/**
 * Bao nhiêu pixel thật cho một pixel thiết kế.
 *
 * Đo theo MÀN HÌNH chứ không theo cửa sổ: người chơi kéo to cửa sổ hay bật
 * toàn màn hình thì `innerWidth` đổi, mà texture thì đã nướng xong từ lúc boot —
 * lấy theo cửa sổ là cứ phóng to cửa sổ một cái là mờ lại.
 */
export const RENDER_SCALE: number = (() => {
  if (typeof window === "undefined") return 1;          // test chạy trong node, không có DOM
  const px = (window.screen?.width ?? window.innerWidth) * (window.devicePixelRatio || 1);
  return Math.min(MAX_SCALE, Math.max(1, px / GAME_W));
})();

/**
 * Độ phân giải canvas của `Text`.
 *
 * Cao hơn `RENDER_SCALE` một nhịp vì chữ TRONG CẢNH (tên trạm, tên khách, bong
 * bóng thoại) còn bị camera thế giới phóng thêm `world/camera.ZOOM` nữa. Lấy dư
 * ra cho cả hai loại chữ dùng chung một con số — texture chữ vốn bé, dư vài pixel
 * không đáng gì so với việc phải nhớ chữ nào ở lớp nào.
 */
export const TEXT_RES = Math.min(3, RENDER_SCALE * 1.5);

/**
 * Bắt MỌI `scene.add.text()` nướng chữ ở `TEXT_RES`.
 *
 * Phaser 3 đã bỏ `resolution` khỏi game config, và `TextStyle` lấy mặc định 0 rồi
 * tự ép về 1 — nên không còn chỗ nào đặt một lần cho cả game. Cách còn lại là
 * nhét vào từng style ở 20 chỗ gọi, mà quên một chỗ là chỗ đó nhoè trong im lặng,
 * không có gì báo.
 *
 * Nên bọc thẳng cái factory. `register` của Phaser có chốt `hasOwnProperty` nên
 * phải `remove` trước — cả hai đều là API công khai. Style người gọi truyền vào
 * vẫn thắng: `resolution` chỉ là MẶC ĐỊNH, ai cần khác thì cứ ghi đè.
 *
 * Gọi đúng một lần, trước khi dựng `new Phaser.Game`.
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
 * Canh một camera vào khung thiết kế 1024 × 576 trên cái canvas đã phóng to.
 *
 * Gốc biến đổi dời hẳn về (0, 0) thay vì giữa camera, và scroll để nguyên 0. Khi đó
 * phép chiếu rút gọn còn đúng một phép nhân: `pixel canvas = toạ độ thiết kế × zoom`.
 *
 * KHÔNG dùng `centerOn` ở đây, dù thoạt nhìn nó cũng ra đúng chỗ. `centerOn` canh
 * khung bằng SCROLL, mà object `scrollFactor(0)` — tức toàn bộ HUD và mấy cái bảng —
 * theo định nghĩa là bỏ qua scroll. Hệ quả: vật trong cảnh nằm đúng chỗ còn cả lớp UI
 * trôi sang trái đúng `scrollX × zoom` px, HUD bay hẳn ra ngoài mép màn. Gốc (0, 0)
 * không dùng tới scroll nên hai loại object rơi về cùng một chỗ.
 *
 * Chỉ dành cho camera ĐỨNG YÊN (UI, và các scene không có camera đi lại). Camera thế
 * giới của cảnh quán giữ nguyên gốc 0,5 mặc định, vì `startFollow`, `setBounds` và
 * `worldView` đều tính theo gốc giữa — `CustomerActor` đọc `worldView` để kẹp bong
 * bóng thoại trong khung.
 */
export function fitDesignFrame(cam: Phaser.Cameras.Scene2D.Camera) {
  cam.setZoom(RENDER_SCALE);
  cam.setOrigin(0, 0);
  cam.setScroll(0, 0);
}
