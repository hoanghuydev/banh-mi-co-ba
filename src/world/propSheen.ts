import Phaser from "phaser";
import { sheenFactor, sheenImage } from "../art/light/sheen";
import type { LightEnv } from "../art/light/env";
import { artScale } from "../art/photo";
import { rimGainOf, sheenSpecOf } from "./sheenParams";
import { TW } from "./iso";
import type { Crop } from "../art/slices";
import type { TexPixels } from "./texPixels";

const SHEEN_DEPTH = 0.15;

/** Lớp bóng bề mặt (kim loại, sứ, men) của đạo cụ đứng yên, nướng một lần, blend SCREEN. */
export class PropSheen {
  private readonly props: { img: Phaser.GameObjects.Image; key: string; crop?: Crop }[] = [];
  private readonly objects: Phaser.GameObjects.Image[] = [];
  private readonly keys: string[] = [];

  constructor(private readonly scene: Phaser.Scene, private readonly env: LightEnv, private readonly pixels: TexPixels) {}

  register(img: Phaser.GameObjects.Image, key: string, crop?: Crop) {
    this.props.push({ img, key, crop });
    return img;
  }

  /** Gọi sau `SceneLight.build` để `env.sun` đã có bản đồ nắng; mỗi `yield` là chỗ được nhường luồng. */
  *build() {
    const { scene, env } = this;
    let serial = 0;
    yield* this.pixels.load(this.props.map((p) => p.key));
    for (const { img, key, crop } of this.props) {
      yield;
      const pixels = this.pixels.get(key);
      if (!pixels) continue;
      const out = sheenImage(pixels, sheenSpecOf(key) ?? [], sheenFactor(env.sun(img.x, img.y), env.overcast), { unit: TW * artScale(key), gain: rimGainOf(key) });
      if (!out) continue;

      const tex = `sheen/${scene.scene.key}/${serial++}`;
      if (scene.textures.exists(tex)) scene.textures.remove(tex);
      const canvas = scene.textures.createCanvas(tex, out.w, out.h)!;
      canvas.getContext().putImageData(new ImageData(new Uint8ClampedArray(out.data), out.w, out.h), 0, 0);
      canvas.refresh();
      this.keys.push(tex);
      const o = scene.add.image(img.x, img.y, tex).setOrigin(img.originX, img.originY)
        .setScale(img.scaleX, img.scaleY).setFlipX(img.flipX)
        .setDepth(img.depth + SHEEN_DEPTH).setBlendMode(Phaser.BlendModes.SCREEN);
      if (crop) o.setCrop(...crop);
      this.objects.push(o);
    }
    // Bước đọc điểm ảnh cuối của lượt dựng.
    this.pixels.clear();
  }

  destroy() {
    for (const o of this.objects) o.destroy();
    this.objects.length = 0;
    for (const k of this.keys) if (this.scene.textures.exists(k)) this.scene.textures.remove(k);
    this.keys.length = 0;
    this.props.length = 0;
  }
}
