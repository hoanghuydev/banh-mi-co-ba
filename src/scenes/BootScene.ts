import Phaser from "phaser";
import { buildTextures, preloadArt } from "../art";
import { sfx } from "../audio/sfx";
import { fadeOut, paintTick, setLoading, setStep } from "../ui/bootScreen";

/** Ảnh phải tải xong trước `buildTextures` vì `art/photo.ts` đè lên texture vẽ code trong đó. */
export class BootScene extends Phaser.Scene {
  constructor() { super("boot"); }

  preload() {
    setLoading(0);
    this.load.on("progress", setLoading);
    preloadArt(this);
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

    // Không chờ thì chữ có dấu nhảy layout một nhịp.
    setStep("đang chờ phông chữ…", 0.96);
    try {
      await (document as any).fonts?.load?.('700 32px "Be Vietnam Pro"');
      await (document as any).fonts?.load?.('800 32px "Be Vietnam Pro"');
      await (document as any).fonts?.ready;
    } catch { /* không có Font Loading API */ }

    fadeOut();
    this.scene.start("menu");
  }
}
