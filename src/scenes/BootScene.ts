import Phaser from "phaser";
import { buildTextures } from "../art";

/** Nướng texture + đợi font rồi sang menu. Không có asset ngoài nên gần như tức thì. */
export class BootScene extends Phaser.Scene {
  constructor() { super("boot"); }

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
