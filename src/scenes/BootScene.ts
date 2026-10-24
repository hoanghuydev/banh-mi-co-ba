import Phaser from "phaser";
import { buildTextures, preloadArt } from "../art";
import { sfx } from "../audio/sfx";
import { preloadBackdrop } from "../ui/backdrop";
import { fadeOut, paintTick, setLoading, setStep } from "../ui/bootScreen";

const FONT_TIMEOUT_MS = 3000;

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
    // `buildTextures` chặn luồng, phải nhường một nhịp vẽ cho dòng chữ hiện ra.
    setStep("đang dựng hình…", 0.9);
    await paintTick();
    buildTextures(this);

    // Không chờ thì chữ có dấu nhảy layout một nhịp; quá hạn thì chạy tiếp với phông dự phòng.
    setStep("đang chờ phông chữ…", 0.96);
    const fonts = (document as any).fonts;
    if (fonts?.load) {
      const loaded = Promise.all([fonts.load('700 32px "Be Vietnam Pro"'), fonts.load('800 32px "Be Vietnam Pro"'), fonts.ready]).catch(() => {});
      await Promise.race([loaded, new Promise((done) => setTimeout(done, FONT_TIMEOUT_MS))]);
    }

    fadeOut();
    this.scene.start("menu");
  }
}
