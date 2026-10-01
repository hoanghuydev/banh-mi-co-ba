import Phaser from "phaser";
import { buildTextures, preloadArt } from "../art";

/**
 * Tải ảnh artist + nướng texture + đợi font rồi sang menu.
 *
 * Ảnh phải tải XONG trước `buildTextures`, vì art v2 (`art/photo.ts`) đè lên art v1
 * ngay trong đó. Ảnh chưa về kịp thì cảnh vẫn dựng được, chỉ là ra bản vẽ code.
 */
export class BootScene extends Phaser.Scene {
  constructor() { super("boot"); }

  preload() {
    preloadArt(this);
  }

  async create() {
    buildTextures(this);

    // Chờ font Việt tải xong, nếu không chữ có dấu sẽ nhảy layout một nhịp.
    try {
      await (document as any).fonts?.load?.('700 32px "Be Vietnam Pro"');
      await (document as any).fonts?.ready;
    } catch { /* không có Font Loading API thì thôi, fallback sans vẫn đọc được */ }

    document.getElementById("boot")?.classList.add("gone");
    this.scene.start("menu");
  }
}
