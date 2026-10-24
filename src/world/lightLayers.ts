import Phaser from "phaser";
import { LEAF_A_KEY, LEAF_B_KEY, LEAF_C_KEY, LEAF_EAVE_KEY, artScale } from "../art/photo";
import { INDOOR_SHADOW as INDOOR, LIGHT_DEPTH, type LightEnv } from "../art/light/env";
import type { Canopy, Gray, Img, LitObject } from "../art/light/types";
import { LIGHT, composeFloorLight, dappleOverlay, materialOf } from "../art/light";
import { SKY_FROM_Y, WORLD_H, WORLD_W, tileAt } from "./map";
import { floorAtScreen, lightSpecOf, worldAt } from "./lightParams";
import { BASE } from "../art/canvas";
import { TH, toScreen } from "./iso";
import { buildCornerAo, buildTintLayers, roadWeight, wallOverlays } from "./lightTint";

const DAPPLE_DEPTH = 0.2;

type Prop = { img: Phaser.GameObjects.Image; key: string };

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

const grayCache = new Map<string, Gray>();

function grayOf(scene: Phaser.Scene, key: string): Gray {
  const hit = grayCache.get(key);
  if (hit) return hit;
  const img = scene.textures.exists(key) ? readImg(scene, key) : null;
  if (!img) return { w: 1, h: 1, data: new Uint8ClampedArray([255]) };
  const data = new Uint8ClampedArray(img.w * img.h);
  for (let i = 0; i < data.length; i++) data[i] = img.data[i * 4];
  const gray = { w: img.w, h: img.h, data };
  grayCache.set(key, gray);
  return gray;
}

/** Bóng mái nhà dọc mặt tiền và tán lá đổ trên đường: C từ góc dưới-trái đổ lên, B lấp khoảng giữa, A từ giữa tới hết cuối đường; ô thế giới, ảnh lật dọc cho cụm lá nặng nằm phía dưới. */
function canopiesOf(scene: Phaser.Scene): Canopy[] {
  return [
    { img: grayOf(scene, LEAF_EAVE_KEY), x: -0.5, y: 5.34, w: 19, h: 6.75, alpha: 0.85, soft: 0.08, feather: false },
    { img: grayOf(scene, LEAF_C_KEY), x: -1, y: 4.1, w: 8.1, h: 11.9, flipY: true },
    { img: grayOf(scene, LEAF_B_KEY), x: 2, y: 4.45, w: 8, h: 11.55, flipY: true },
    { img: grayOf(scene, LEAF_A_KEY), x: 6, y: 2.8, w: 12, h: 13.2, flipY: true },
  ];
}

function insideAt(sx: number, sy: number) {
  const { wx, wy } = worldAt(sx, sy);
  if (wx < 0 || wy < 0 || wx >= WORLD_W || wy >= WORLD_H) return false;
  const code = tileAt(Math.floor(wx), Math.floor(wy));
  return code !== "#" && code !== "N" && code !== "D";
}

const LEAF_EDGE = 0.25;
const LEAF_INDOOR = 0.07;
const INDOOR_SHADOW = { shadowK: INDOOR.k, shadowSoft: INDOOR.soft, shadowAlpha: INDOOR.alpha } as const;

/** 1 trong tiệm, 0 ngoài trời, mượt quanh ranh sàn. */
export function indoorWeight(wy: number) {
  const c = Math.min(1, Math.max(0, (wy - (SKY_FROM_Y - LEAF_EDGE)) / (2 * LEAF_EDGE)));
  return 1 - c * c * (3 - 2 * c);
}

/** Trong tiệm chỉ vài đốm lá nhạt; ngoài mái hiên đủ, chuyển mượt quanh ranh. */
function leafStrengthAt(sx: number, sy: number) {
  const t = (worldAt(sx, sy).wy - (SKY_FROM_Y - LEAF_EDGE)) / (2 * LEAF_EDGE);
  const c = Math.min(1, Math.max(0, t));
  return (LEAF_INDOOR + (1 - LEAF_INDOOR) * c * c * (3 - 2 * c)) * (1 - 0.45 * roadWeight(worldAt(sx, sy).wy));
}

/** Lightmap, phản chiếu và đốm lá của sàn cùng các đạo cụ đứng yên. */
export class SceneLight {
  private readonly props: Prop[] = [];
  private readonly walls: Phaser.GameObjects.Image[] = [];
  private readonly keys: string[] = [];
  private readonly objects: Phaser.GameObjects.Image[] = [];
  private readonly cache = new Map<string, Img | null>();
  private serial = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly ground: Phaser.Geom.Rectangle,
    private readonly env: LightEnv,
    private readonly scale: number,
  ) {}

  add(img: Phaser.GameObjects.Image) {
    this.props.push({ img, key: img.texture.key });
    return img;
  }

  addWall(img: Phaser.GameObjects.Image) {
    this.walls.push(img);
    return img;
  }

  build() {
    const { scene, ground, env, scale } = this;
    const objects: { obj: LitObject; img: Phaser.GameObjects.Image; indoor: boolean }[] = [];
    for (const { img, key } of this.props) {
      const spec = lightSpecOf(key);
      if (!spec) continue;
      if (!this.cache.has(key)) this.cache.set(key, readImg(scene, key));
      const pixels = this.cache.get(key);
      if (!pixels) continue;
      const footWy = worldAt(img.x, img.y - TH / 2 - BASE).wy;
      const indoor = footWy < SKY_FROM_Y;
      objects.push({
        img,
        indoor: indoorWeight(footWy) > 0.5,
        obj: { img: pixels, imgScale: artScale(key), footX: img.x, footY: img.y, ...spec, ...(indoor ? INDOOR_SHADOW : {}) },
      });
    }

    const out = composeFloorLight({
      rect: { x: ground.x, y: ground.y, w: ground.width, h: ground.height },
      scale,
      objects: objects.map((o) => o.obj),
      canopies: canopiesOf(scene),
      leafStrengthAt,
      glossAt: (sx, sy) => materialOf(floorAtScreen(sx, sy)).gloss,
      insideAt,
      overcast: env.overcast,
    });

    this.layer("lightmap", out.lightmap, LIGHT_DEPTH.lightmap, true);
    this.layer("reflection", out.reflection, LIGHT_DEPTH.reflection, false);

    const sun = out.sun;
    env.sun = (sx, sy) => {
      const ix = Math.floor((sx - ground.x) * scale), iy = Math.floor((sy - ground.y) * scale);
      if (ix < 0 || iy < 0 || ix >= sun.w || iy >= sun.h) return 1;
      return sun.data[iy * sun.w + ix];
    };

    const ao = buildCornerAo(ground, toScreen);
    const aoKey = this.paintCanvas("corner-ao", ao);
    this.objects.push(scene.add.image(ground.x, ground.y, aoKey).setOrigin(0, 0)
      .setDepth(LIGHT_DEPTH.lightmap + 2).setBlendMode(Phaser.BlendModes.MULTIPLY));

    if (env.overcast) return;
    const tint = buildTintLayers(ground, sun, scale, insideAt, toScreen);
    this.layer("warm", tint.warm, LIGHT_DEPTH.lightmap + 1, false, Phaser.BlendModes.SCREEN, 1);
    this.layer("walk", tint.walk, LIGHT_DEPTH.lightmap + 1, false, Phaser.BlendModes.SCREEN, 1);
    this.layer("shopshade", tint.shade, LIGHT_DEPTH.lightmap + 1, true, undefined, 1);
    this.layer("lift", tint.lift, LIGHT_DEPTH.lightmap + 1, false, Phaser.BlendModes.SCREEN, 1);
    this.layer("shaft", tint.shaft, LIGHT_DEPTH.lightmap + 1, false, undefined, 1);
    this.layer("core", tint.core, LIGHT_DEPTH.lightmap + 1, false, Phaser.BlendModes.SCREEN, 1);
    this.layer("cool", tint.cool, LIGHT_DEPTH.lightmap + 1, true, undefined, 1);
    this.buildWalls();
    const rect = { x: ground.x, y: ground.y, w: ground.width, h: ground.height };
    for (const { obj, img, indoor } of objects) {
      if (indoor) continue;
      const over = dappleOverlay(obj, sun, rect, scale, obj.shadowK ?? LIGHT.SUN_K);
      const key = this.paint(over);
      this.objects.push(scene.add.image(img.x, img.y, key).setOrigin(0.5, 1)
        .setScale(1 / obj.imgScale).setDepth(img.depth + DAPPLE_DEPTH)
        .setBlendMode(Phaser.BlendModes.MULTIPLY));
    }
  }

  private buildWalls() {
    const made = new Map<string, { shade: string; light: string; scale: number }>();
    for (const img of this.walls) {
      const key = img.texture.key;
      let m = made.get(key);
      if (!m) {
        const src = this.cache.get(key) ?? readImg(this.scene, key);
        if (!src) continue;
        const o = wallOverlays(src, artScale(key));
        m = { shade: this.paint(o.shade), light: this.paint(o.light), scale: img.scaleX };
        made.set(key, m);
      }
      this.objects.push(
        this.scene.add.image(img.x, img.y, m.shade).setOrigin(0.5, 1).setScale(m.scale)
          .setDepth(img.depth + 0.1).setBlendMode(Phaser.BlendModes.MULTIPLY),
        this.scene.add.image(img.x, img.y, m.light).setOrigin(0.5, 1).setScale(m.scale)
          .setDepth(img.depth + 0.1).setBlendMode(Phaser.BlendModes.SCREEN),
      );
    }
  }

  private paintCanvas(name: string, canvas: HTMLCanvasElement) {
    const key = `light/${this.scene.scene.key}/${name}`;
    if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
    this.scene.textures.addCanvas(key, canvas);
    this.keys.push(key);
    return key;
  }

  private layer(name: string, img: Img, depth: number, multiply: boolean, blend?: number, scale = this.scale) {
    const image = this.scene.add.image(this.ground.x, this.ground.y, this.paint(img, name))
      .setOrigin(0, 0).setScale(1 / scale).setDepth(depth);
    if (multiply) image.setBlendMode(Phaser.BlendModes.MULTIPLY);
    else if (blend !== undefined) image.setBlendMode(blend);
    this.objects.push(image);
  }

  private paint(img: Img, name = `dapple${this.serial++}`) {
    const key = `light/${this.scene.scene.key}/${name}`;
    if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
    const tex = this.scene.textures.createCanvas(key, img.w, img.h)!;
    tex.getContext().putImageData(new ImageData(new Uint8ClampedArray(img.data), img.w, img.h), 0, 0);
    tex.refresh();
    this.keys.push(key);
    return key;
  }

  destroy() {
    for (const o of this.objects) o.destroy();
    this.objects.length = 0;
    for (const k of this.keys) if (this.scene.textures.exists(k)) this.scene.textures.remove(k);
    this.keys.length = 0;
    this.props.length = 0;
    this.walls.length = 0;
    this.cache.clear();
  }
}
