import Phaser from "phaser";
import { BACKDROP_FILE } from "../core/bootFiles";

const KEY = "sanh_bg";

/** Nền sảnh vẽ bằng CSS; tải qua loader chỉ để menu hiện ra là có sẵn ảnh, xong thì bỏ bản texture GPU không ai vẽ. */
export function preloadBackdrop(scene: Phaser.Scene) {
  if (scene.textures.exists(KEY)) return;
  scene.load.image(KEY, BACKDROP_FILE);
  scene.load.once(`${Phaser.Loader.Events.FILE_KEY_COMPLETE}image-${KEY}`, () => scene.textures.remove(KEY));
}
