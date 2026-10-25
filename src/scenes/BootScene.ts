import Phaser from "phaser";
import { buildTextures, preloadArt } from "../art";
import { sfx } from "../audio/sfx";
import { preloadBackdrop } from "../ui/backdrop";
import { fadeOut, paintTick, setLoading, setStep } from "../ui/bootScreen";

const FONT_WAIT_MS = 400;

/** Ảnh phải tải xong trước `buildTextures` vì `art/photo.ts` đè lên texture vẽ code trong đó. */
export class BootScene extends Phaser.Scene {
  constructor() { super("boot"); }

  preload() {
    setLoading(0);
    this.load.on("progress", setLoading);
    preloadArt(this);
    preloadBackdrop(this);
    // Sảnh không có `preload` riêng mà nút nào cũng kêu.
    sfx.preload(this, sfx.idsOfBus("amBao"));
    // `DayScene` thường trực không có `preload` riêng.
    sfx.preload(this, ["sfx_cua_cuon"]);
    // Điện thoại gọi hai tiếng này từ HTML, không qua `preload` của cảnh quán.
    sfx.preload(this, ["sfx_tien_le", "sfx_ngan_keo"]);
  }

  async create() {
    // Nhường một nhịp vẽ cho dòng chữ hiện ra trước khi dựng.
    setStep("đang dựng hình…", 0.9);
    await paintTick();
    await buildTextures(this);

    // Chờ ngắn để chữ có dấu khỏi nhảy layout; quá hạn thì vào luôn với phông dự phòng.
    setStep("đang mở menu…", 0.97);
    const fonts = document.fonts;
    if (fonts?.load) {
      const need = Promise.all([fonts.load('700 32px "Be Vietnam Pro"', "ễ"), fonts.load('800 32px "Be Vietnam Pro"', "ễ")]).catch(() => {});
      await Promise.race([need, new Promise((done) => setTimeout(done, FONT_WAIT_MS))]);
    }
    await paintTick();

    fadeOut();
    this.scene.start("menu");
  }
}
