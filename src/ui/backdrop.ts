import Phaser from "phaser";

export const BACKDROP_TEX = "sanh_bg";

export function preloadBackdrop(scene: Phaser.Scene) {
  if (!scene.textures.exists(BACKDROP_TEX)) scene.load.image(BACKDROP_TEX, "art/sanh_bg.webp");
}
