import Phaser from "phaser";
import { sheenFactor, sheenImage } from "../art/light/sheen";
import type { LightEnv } from "../art/light/env";
import type { Img } from "../art/light/types";
import { artScale } from "../art/photo";
import { rimGainOf, sheenSpecOf } from "./sheenParams";
import { TW } from "./iso";

const SHEEN_DEPTH = 0.15;

function readImg(scene: Phaser.Scene, key: string): Img | null {
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

/** Lớp bóng bề mặt (kim loại, sứ, men) của đạo cụ đứng yên, nướng một lần, blend SCREEN. */
export class PropSheen {
  private readonly props: { img: Phaser.GameObjects.Image; key: string }[] = [];
  private readonly objects: Phaser.GameObjects.Image[] = [];
  private readonly keys: string[] = [];
  private readonly cache = new Map<string, Img | null>();

  constructor(private readonly scene: Phaser.Scene, private readonly env: LightEnv) {}

  register(img: Phaser.GameObjects.Image, key: string) {
    this.props.push({ img, key });
    return img;
  }

  /** Gọi sau `SceneLight.build` để `env.sun` đã có bản đồ nắng. */
  build() {
    const { scene, env } = this;
    let serial = 0;
    for (const { img, key } of this.props) {
      if (!this.cache.has(key)) this.cache.set(key, readImg(scene, key));
      const pixels = this.cache.get(key);
      if (!pixels) continue;
      const out = sheenImage(pixels, sheenSpecOf(key) ?? [], sheenFactor(env.sun(img.x, img.y), env.overcast), { unit: TW * artScale(key), gain: rimGainOf(key) });
      if (!out) continue;

      const tex = `sheen/${scene.scene.key}/${serial++}`;
      if (scene.textures.exists(tex)) scene.textures.remove(tex);
      const canvas = scene.textures.createCanvas(tex, out.w, out.h)!;
      canvas.getContext().putImageData(new ImageData(new Uint8ClampedArray(out.data), out.w, out.h), 0, 0);
      canvas.refresh();
      this.keys.push(tex);
      this.objects.push(scene.add.image(img.x, img.y, tex).setOrigin(img.originX, img.originY)
        .setScale(img.scaleX, img.scaleY).setFlipX(img.flipX)
        .setDepth(img.depth + SHEEN_DEPTH).setBlendMode(Phaser.BlendModes.SCREEN));
    }
  }

  destroy() {
    for (const o of this.objects) o.destroy();
    this.objects.length = 0;
    for (const k of this.keys) if (this.scene.textures.exists(k)) this.scene.textures.remove(k);
    this.keys.length = 0;
    this.props.length = 0;
    this.cache.clear();
  }
}
