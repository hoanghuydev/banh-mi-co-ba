import Phaser from "phaser";
import { LEAF_A_KEY, LEAF_B_KEY, LEAF_C_KEY, LEAF_EAVE_KEY, LEAF_WALL_A_KEY, LEAF_WALL_B_KEY, artScale } from "../art/photo";
import { INDOOR_SHADOW as INDOOR, LIGHT_DEPTH, type LightEnv } from "../art/light/env";
import type { Canopy, Gray, Img, LitObject } from "../art/light/types";
import { LIGHT, composeFloorLight, dappleOverlay, leafCover, materialOf } from "../art/light";
import { SKY_FROM_Y, WORLD_H, WORLD_W, tileAt } from "./map";
import { floorAtScreen, lightSpecOf, worldAt } from "./lightParams";
import { BASE } from "../art/canvas";
import { TH, toScreen } from "./iso";
import { buildCornerAo, buildTintLayers, roadWeight, wallOverlays, wallTopOverlays } from "./lightTint";
import type { FloorBake } from "./floorBake";

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

/** Bóng cây trên nóc tường, ô thế giới: phủ khung tường sau, trái và phải. */
function wallCanopies(scene: Phaser.Scene): Canopy[] {
  const a = grayOf(scene, LEAF_WALL_A_KEY);
  const b = grayOf(scene, LEAF_WALL_B_KEY);
  const w = 15, h = 5;
  return [
    { img: a, x: -1, y: -1.2, w, h },
    { img: b, x: 7.5, y: -1.2, w, h, flipX: true },
    { img: b, x: -1, y: 3, w, h },
    { img: a, x: 7.5, y: 3, w, h, flipX: true },
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

const COVER_BLOCK = 8;

/** Tra nhanh một vùng của ảnh nắng có đều 255 hay đều 0 không, qua bảng cộng dồn theo khối. */
function coverOf(img: ImageData) {
  const { width: w, height: h, data } = img;
  const bw = Math.ceil(w / COVER_BLOCK), bh = Math.ceil(h / COVER_BLOCK);
  const lit = new Int32Array((bw + 1) * (bh + 1));
  const dark = new Int32Array((bw + 1) * (bh + 1));
  for (let by = 0; by < bh; by++) {
    for (let bx = 0; bx < bw; bx++) {
      let anyLit = 0, anyDark = 0;
      for (let y = by * COVER_BLOCK; y < Math.min(h, (by + 1) * COVER_BLOCK); y++) {
        for (let x = bx * COVER_BLOCK; x < Math.min(w, (bx + 1) * COVER_BLOCK); x++) {
          const a = data[(y * w + x) * 4 + 3];
          if (a > 0) anyLit = 1;
          if (a < 255) anyDark = 1;
        }
      }
      const i = (by + 1) * (bw + 1) + bx + 1;
      lit[i] = anyLit + lit[i - 1] + lit[i - bw - 1] - lit[i - bw - 2];
      dark[i] = anyDark + dark[i - 1] + dark[i - bw - 1] - dark[i - bw - 2];
    }
  }
  const sum = (t: Int32Array, x0: number, y0: number, x1: number, y1: number) =>
    t[y1 * (bw + 1) + x1] - t[y0 * (bw + 1) + x1] - t[y1 * (bw + 1) + x0] + t[y0 * (bw + 1) + x0];
  return (x0: number, y0: number, x1: number, y1: number) => {
    if (x0 < 0 || y0 < 0 || x1 > w || y1 > h || x1 <= x0 || y1 <= y0) return -1;
    const bx0 = Math.floor(x0 / COVER_BLOCK), by0 = Math.floor(y0 / COVER_BLOCK);
    const bx1 = Math.ceil(x1 / COVER_BLOCK), by1 = Math.ceil(y1 / COVER_BLOCK);
    if (sum(dark, bx0, by0, bx1, by1) === 0) return 1;
    if (sum(lit, bx0, by0, bx1, by1) === 0) return 0;
    return -1;
  };
}

/** Lề lặp điểm ảnh mép quanh mỗi khung, để lọc song tuyến ở mép đọc như texture riêng (kẹp mép). */
const ATLAS_PAD = 2;
const ATLAS_W = 2048;

/** Xếp ảnh theo hàng vào một canvas. */
class Atlas {
  readonly frames: { x: number; y: number; w: number; h: number; img: Img }[] = [];
  private x = 0;
  private y = 0;
  private row = 0;

  add(img: Img) {
    const w = img.w + ATLAS_PAD * 2, h = img.h + ATLAS_PAD * 2;
    if (this.x + w > ATLAS_W) {
      this.x = 0;
      this.y += this.row;
      this.row = 0;
    }
    this.frames.push({ x: this.x + ATLAS_PAD, y: this.y + ATLAS_PAD, w: img.w, h: img.h, img });
    this.x += w;
    this.row = Math.max(this.row, h);
    return this.frames.length - 1;
  }

  canvas() {
    const c = document.createElement("canvas");
    c.width = Math.max(1, ...this.frames.map((f) => f.x + f.w + ATLAS_PAD));
    c.height = Math.max(1, this.y + this.row);
    const ctx = c.getContext("2d")!;
    for (const { x, y, img } of this.frames) {
      const w = img.w + ATLAS_PAD * 2, h = img.h + ATLAS_PAD * 2;
      const out = new ImageData(w, h);
      for (let j = 0; j < h; j++) {
        const sy = Math.min(img.h - 1, Math.max(0, j - ATLAS_PAD));
        for (let i = 0; i < w; i++) {
          const sx = Math.min(img.w - 1, Math.max(0, i - ATLAS_PAD));
          const o = (j * w + i) * 4, q = (sy * img.w + sx) * 4;
          out.data[o] = img.data[q];
          out.data[o + 1] = img.data[q + 1];
          out.data[o + 2] = img.data[q + 2];
          out.data[o + 3] = img.data[q + 3];
        }
      }
      ctx.putImageData(out, x - ATLAS_PAD, y - ATLAS_PAD);
    }
    return c;
  }
}

/** Lightmap, phản chiếu và đốm lá của sàn cùng các đạo cụ đứng yên. */
export class SceneLight {
  private readonly props: Prop[] = [];
  private readonly walls: Phaser.GameObjects.Image[] = [];
  private readonly keys: string[] = [];
  private readonly objects: Phaser.GameObjects.Image[] = [];
  private readonly cache = new Map<string, Img | null>();
  private serial = 0;

  private readonly ground: Phaser.Geom.Rectangle;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly floor: FloorBake,
    private readonly env: LightEnv,
    private readonly scale: number,
  ) {
    this.ground = floor.rect;
  }

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
    const sunCanvas = document.createElement("canvas");
    sunCanvas.width = sun.w;
    sunCanvas.height = sun.h;
    const sunCtx = sunCanvas.getContext("2d")!;
    const sunPixels = sunCtx.createImageData(sun.w, sun.h);
    for (let i = 0; i < sun.data.length; i++) {
      const o = i * 4;
      sunPixels.data[o] = sunPixels.data[o + 1] = sunPixels.data[o + 2] = 255;
      sunPixels.data[o + 3] = Math.round(Math.min(1, Math.max(0, sun.data[i])) * 255);
    }
    sunCtx.putImageData(sunPixels, 0, 0);
    env.sunLayer = { canvas: sunCanvas, x: ground.x, y: ground.y, scale, cover: coverOf(sunPixels) };
    env.sun = (sx, sy) => {
      const ix = Math.floor((sx - ground.x) * scale), iy = Math.floor((sy - ground.y) * scale);
      if (ix < 0 || iy < 0 || ix >= sun.w || iy >= sun.h) return 1;
      return sun.data[iy * sun.w + ix];
    };

    const ao = buildCornerAo(ground, toScreen);
    const aoKey = this.paintCanvas("corner-ao", ao);
    this.floor.add(scene.make.image({ x: ground.x, y: ground.y, key: aoKey }, false).setOrigin(0, 0)
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

  /** Mỗi tường bốn lớp phủ; xếp hai lớp MULTIPLY rồi hai lớp SCREEN (thân và nóc không chồng nhau) và gom vào atlas để mỗi nhóm một lượt vẽ. */
  private buildWalls() {
    const leafAt = leafCover(wallCanopies(this.scene));
    const shade = new Atlas(), light = new Atlas();
    const made = new Map<string, { shade: number; light: number }>();
    const placed: { img: Phaser.GameObjects.Image; shade: number; light: number; topShade: number; topLight: number }[] = [];
    for (const img of this.walls) {
      const key = img.texture.key;
      const src = this.cache.get(key) ?? readImg(this.scene, key);
      if (!src) continue;
      const imgScale = artScale(key);
      let m = made.get(key);
      if (!m) {
        const o = wallOverlays(src, imgScale);
        m = { shade: shade.add(o.shade), light: light.add(o.light) };
        made.set(key, m);
      }
      const groundY = img.y - TH / 2 - BASE;
      const top = wallTopOverlays(src, imgScale, (dx, dy) => {
        const { wx, wy } = worldAt(img.x + dx, groundY + dy);
        return leafAt(wx, wy);
      });
      placed.push({ img, ...m, topShade: shade.add(top.shade), topLight: light.add(top.light) });
    }
    const shadeKey = this.paintAtlas("wall-shade", shade), lightKey = this.paintAtlas("wall-light", light);
    for (const p of placed) {
      const { img } = p;
      const topY = img.y - img.displayHeight;
      const add = (x: number, y: number, key: string, frame: number, oy: number, blend: number) =>
        this.scene.add.image(x, y, key, frame).setOrigin(0.5, oy).setScale(img.scaleX)
          .setDepth(img.depth + 0.1).setBlendMode(blend);
      this.objects.push(
        add(img.x, img.y, shadeKey, p.shade, 1, Phaser.BlendModes.MULTIPLY),
        add(img.x, topY, shadeKey, p.topShade, 0, Phaser.BlendModes.MULTIPLY),
        add(img.x, img.y, lightKey, p.light, 1, Phaser.BlendModes.SCREEN),
        add(img.x, topY, lightKey, p.topLight, 0, Phaser.BlendModes.SCREEN),
      );
    }
  }

  private paintAtlas(name: string, atlas: Atlas) {
    const key = this.paintCanvas(name, atlas.canvas());
    const tex = this.scene.textures.get(key);
    atlas.frames.forEach((f, i) => tex.add(i, 0, f.x, f.y, f.w, f.h));
    return key;
  }

  private paintCanvas(name: string, canvas: HTMLCanvasElement) {
    const key = `light/${this.scene.scene.key}/${name}`;
    if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
    this.scene.textures.addCanvas(key, canvas);
    this.keys.push(key);
    return key;
  }

  private layer(name: string, img: Img, depth: number, multiply: boolean, blend?: number, scale = this.scale) {
    const image = this.scene.make.image({ x: this.ground.x, y: this.ground.y, key: this.paint(img, name) }, false)
      .setOrigin(0, 0).setScale(1 / scale).setDepth(depth);
    if (multiply) image.setBlendMode(Phaser.BlendModes.MULTIPLY);
    else if (blend !== undefined) image.setBlendMode(blend);
    this.floor.add(image);
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
