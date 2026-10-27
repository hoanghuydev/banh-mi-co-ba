import Phaser from "phaser";
import { TW, depthOf, toScreen } from "../world/iso";
import { artScale } from "./photo";

/** Cột `m` phủ sx ∈ [m · COL_W, (m + 1) · COL_W) dời thêm `shift`, tức x − y ∈ [m, m + 1]. */
const COL_W = TW / 2;

/** Ảnh tường gối sang ô kề chừng này px; lát dán trên tường dời ranh theo để chỉ chạm ô tường nó nằm trên. */
export const WALL_OVERHANG = 2.5;

/** x, y, rộng, cao theo pixel texture. */
export type Crop = [number, number, number, number];

/** Cắt texture theo cột màn hình, mỗi lát một depth, cho vật dài hơn một ô mà người đi được cả trước lẫn sau. */
export function sliceColumns(
  scene: Phaser.Scene, key: string, left: number, top: number, w: number, depthAt: (m: number) => number, shift = 0,
) {
  const ss = artScale(key);
  const tex = scene.textures.get(key).getSourceImage();
  const right = left + w;
  const objs: (Slice & { crop: Crop })[] = [];
  for (let m = Math.floor((left - shift) / COL_W); m * COL_W + shift < right; m++) {
    const x0 = Math.max(left, m * COL_W + shift);
    const x1 = Math.min(right, (m + 1) * COL_W + shift);
    if (x1 <= x0) continue;
    const crop: Crop = [Math.floor((x0 - left) * ss), 0, Math.ceil((Math.min(x1 + 1, right) - x0) * ss), tex.height];
    const img = scene.add.image(left, top, key).setOrigin(0, 0).setScale(1 / ss).setCrop(...crop).setDepth(depthAt(m));
    objs.push({ img, m, cx: (x0 + x1) / 2, crop });
  }
  return objs;
}

/** Cắt một ảnh đã đặt; ảnh gốc ẩn đi nhưng giữ lại cho bóng đổ. */
export function sliceImage(img: Phaser.GameObjects.Image, depthAt: (m: number) => number) {
  const left = img.x - img.displayWidth * img.originX;
  const top = img.y - img.displayHeight * img.originY;
  img.setVisible(false);
  return sliceColumns(img.scene, img.texture.key, left, top, img.displayWidth, depthAt);
}

export type Slice = { img: Phaser.GameObjects.Image; m: number; cx: number };

/** Lát người đứng trước chạm tới thì hạ xuống ngay dưới người, còn lại về depth gốc. */
export function yieldTo(slices: readonly Slice[], base: (m: number) => number, x: number, y: number, inFront: boolean) {
  const p = toScreen(x, y).sx, d = depthOf(x, y) - 10;
  for (const { img, m, cx } of slices) {
    const touch = inFront && Math.abs(p - cx) < COL_W;
    img.setDepth(touch ? Math.min(base(m), d) : base(m));
  }
}
