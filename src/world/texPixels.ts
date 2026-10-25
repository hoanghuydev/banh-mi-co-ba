import type Phaser from "phaser";
import type { Img } from "../art/light/types";

/** Chép qua canvas CPU rồi mới đọc: đọc thẳng hay gộp trên GPU thì điểm ảnh nửa trong suốt làm tròn khác. */
export function readImg(scene: Phaser.Scene, key: string): Img | null {
  try {
    const src = scene.textures.get(key).getSourceImage() as HTMLCanvasElement | HTMLImageElement;
    const c = document.createElement("canvas");
    c.width = src.width;
    c.height = src.height;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(src, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height);
    return { w: d.width, h: d.height, data: d.data };
  } catch {
    return null;
  }
}

/** Điểm ảnh texture theo key, đọc một lần cho mọi lớp sáng của một lần dựng cảnh. */
export class TexPixels {
  private readonly got = new Map<string, Img | null>();

  constructor(private readonly scene: Phaser.Scene) {}

  /** Mỗi lần đọc phải chờ GPU nên mỗi texture một `yield`. */
  *load(keys: Iterable<string>) {
    for (const key of new Set(keys)) {
      if (this.got.has(key)) continue;
      this.got.set(key, readImg(this.scene, key));
      yield;
    }
  }

  get(key: string): Img | null {
    if (!this.got.has(key)) this.got.set(key, readImg(this.scene, key));
    return this.got.get(key)!;
  }
}
