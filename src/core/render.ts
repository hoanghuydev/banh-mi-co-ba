// Canvas dựng ở GAME_W × RENDER_SCALE, mọi camera zoom RENDER_SCALE nên code vẫn dùng toạ độ thiết kế.
import Phaser from "phaser";
import { GAME_W, GAME_H } from "./config";

// Fill rate tăng theo bình phương; nâng trần phải đo lại ngân sách 33 ms/frame.
const MAX_SCALE = 2;

/** Pixel thật trên một pixel thiết kế; đo theo khung nhìn đặt ngang để xoay máy không làm mờ, vì texture nướng một lần lúc boot. */
export const RENDER_SCALE: number = (() => {
  if (typeof window === "undefined") return 1;          // test chạy trong node, không có DOM
  const long = Math.max(window.innerWidth, window.innerHeight);
  const short = Math.min(window.innerWidth, window.innerHeight);
  const fit = Math.min(long / GAME_W, short / GAME_H);
  return Math.min(MAX_SCALE, Math.max(1, fit * (window.devicePixelRatio || 1)));
})();

/** Dư hơn RENDER_SCALE vì chữ trong cảnh còn bị camera thế giới phóng thêm `ZOOM`. */
export const TEXT_RES = Math.min(3, RENDER_SCALE * 1.5);

/** Mặc định `resolution: TEXT_RES` cho mọi `scene.add.text()`; gọi một lần trước `new Phaser.Game`. */
export function installTextResolution() {
  const F = Phaser.GameObjects.GameObjectFactory;
  const native = F.prototype.text;
  // register có chốt hasOwnProperty nên phải remove trước.
  F.remove("text");
  F.register("text", function (this: Phaser.GameObjects.GameObjectFactory,
    x: number, y: number, text: string | string[],
    style?: Phaser.Types.GameObjects.Text.TextStyle) {
    return native.call(this, x, y, text, { resolution: TEXT_RES, ...style });
  });
}

/** Chỉ cho camera đứng yên; không dùng `centerOn` vì nó canh bằng scroll làm HUD `scrollFactor(0)` trôi. */
export function fitDesignFrame(cam: Phaser.Cameras.Scene2D.Camera) {
  cam.setZoom(RENDER_SCALE);
  cam.setOrigin(0, 0);
  cam.setScroll(0, 0);
}
