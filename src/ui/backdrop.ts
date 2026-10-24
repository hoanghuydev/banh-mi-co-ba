import Phaser from "phaser";
import { GAME_W, GAME_H } from "../core/config";

export const BACKDROP_TEX = "sanh_bg";

export function preloadBackdrop(scene: Phaser.Scene) {
  if (!scene.textures.exists(BACKDROP_TEX)) scene.load.image(BACKDROP_TEX, "art/sanh_bg.webp");
}

/** Phông sảnh phủ kín khung, cắt phần thừa theo tâm. */
export function drawAlleyBackdrop(scene: Phaser.Scene) {
  const img = scene.add.image(GAME_W / 2, GAME_H / 2, BACKDROP_TEX);
  img.setScale(Math.max(GAME_W / img.width, GAME_H / img.height));
}
