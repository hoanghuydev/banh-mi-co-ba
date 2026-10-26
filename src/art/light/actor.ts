import type Phaser from "phaser";
import { LIGHT } from "./constants";
import { INDOOR_SHADOW, LIGHT_DEPTH, LIGHT_ENV_KEY, type LightEnv } from "./env";
import { toScreen } from "../../world/iso";
import { WORLD_H, WORLD_W } from "../../world/map";
import { sealTexture, sourceImage } from "../../core/texSeal";
import { isCharacter } from "../character";

export type Matrix = readonly [a: number, b: number, c: number, d: number, e: number, f: number];

/** Màu nhân của bóng nắng: đúng màu sàn khi mất nắng, nên chỗ bóng người chạm bóng nhà, bóng lá thì liền một màu. */
export const SHADOW_RGB = [0, 1, 2].map((c) => Math.round((255 * LIGHT.AMB[c] * (1 - LIGHT.LEAF_DARK[c])) / (LIGHT.AMB[c] + LIGHT.SUN[c]))) as [number, number, number];
/** Độ đậm bóng nắng khi nắng đầy. */
export const SHADOW_MAX = 1;
/** Độ đậm bóng ở đỉnh người và ở chân. */
export const SHADOW_TOP = 0.8;
export const SHADOW_FOOT = 1;
/** Độ đậm phản chiếu ở chân và ở đỉnh khi sàn bóng nhất. */
export const REFLECT_FOOT = 0.13;
export const REFLECT_TOP = 0.025;
export const TINT_SHADE = 0xb4b9d6;
export const AO_ALPHA = 0.9;
const SOLE_ALPHA = 40;

const TINT_TAU = 0.35;
const SUN_RING = 22;
const BAKE_RES = 0.5;
const SHADOW_BLUR = 1.2;
const REFLECT_BLUR = 0.9;
/** Số khung bake giữ cho mỗi thân đang sống: đủ một vòng bước đi và lúc quay người. */
const POSES_PER_ACTOR = 16;
const CACHE_MIN = 32;
const AO_KEY = "actor-ao";
const AO_W = 34;
const AO_H = 17;
const AO_SS = 4;

/** Điểm cao `z` so với đường chân `yFoot` rơi tới (x − 2K·z, yFoot + K·z); toạ độ canvas, y xuống. */
export function shadowMatrix(K: number, yFoot: number): Matrix {
  return [1, 0, 2 * K, -K, -2 * K * yFoot, (1 + K) * yFoot];
}

export function applyMatrix(m: Matrix, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Nắng trung bình quanh chân (tâm + 8 điểm trên vòng), để đốm lá nhỏ không làm nhấp nháy hay xoá cả bóng. */
export function areaSun(env: LightEnv, x: number, y: number) {
  let sum = env.sun(x, y);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    sum += env.sun(x + Math.cos(a) * SUN_RING * 2, y + Math.sin(a) * SUN_RING);
  }
  return sum / 9;
}

/** 0 khi mưa hoặc trong bóng lớn; bóng chỉ mờ khi cả vùng quanh chân ít nắng, không mờ vì một đốm lá. */
export function shadowAlpha(sun: number, overcast: boolean) {
  if (overcast) return 0;
  const t = clamp01((sun - 0.15) / 0.5);
  return SHADOW_MAX * t * t * (3 - 2 * t);
}

/** Nhân vào độ đậm phản chiếu; mưa thì tắt. */
export function reflectAlpha(gloss: number, overcast: boolean) {
  return overcast ? 0 : clamp01(gloss);
}

/** Từ `TINT_SHADE` (bóng) tới trắng (nắng đầy). */
export function tintForSun(sun: number) {
  const t = clamp01(sun);
  const ch = (sh: number) => {
    const lo = (TINT_SHADE >> sh) & 0xff;
    return Math.round(lo + (255 - lo) * t) << sh;
  };
  return ch(16) | ch(8) | ch(0);
}

/** Tiến về đích theo hàm mũ, không phụ thuộc tốc độ khung hình. */
export function approach(cur: number, target: number, dt: number, tau = TINT_TAU) {
  return cur + (target - cur) * (1 - Math.exp(-dt / tau));
}

export type BakeLayout = {
  /** Cạnh canvas (px canvas). */
  cw: number; ch: number;
  /** Lề trái (px texture) để bóng đổ sang trái không bị cắt. */
  padL: number;
  /** Gốc ảnh (0..1) để canvas khớp với thân đặt gốc (0,5; 1). */
  ox: number; oy: number;
};

/** Khung canvas chứa bóng (`side` = 2K) hoặc phản chiếu (`side` = 0) của frame rộng `w` cao `h`, chạm đất tại hàng `foot`, kéo dài xuống `reach` × `foot`. */
export function bakeLayout(w: number, h: number, foot: number, reach: number, side: number, pad: number, res: number): BakeLayout {
  const padL = Math.ceil(side * foot) + pad;
  const wTex = padL + w + pad;
  const hTex = Math.max(h, Math.ceil(foot + reach * foot)) + pad;
  return {
    cw: Math.max(1, Math.ceil(wTex * res)), ch: Math.max(1, Math.ceil(hTex * res)),
    padL, ox: (padL + w / 2) / wTex, oy: h / hTex,
  };
}

type Entry = {
  src: Phaser.Textures.TextureSource; users: number; foot: number;
  shadow?: HTMLCanvasElement; shadowL?: BakeLayout; shadowIn?: HTMLCanvasElement; shadowInL?: BakeLayout;
  refl?: string; reflL?: BakeLayout;
};

const cache = new Map<string, Entry>();
let serial = 0;
let actors = 0;
let tmp: HTMLCanvasElement | null = null;

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/** Safari giữ bộ nhớ canvas tới lúc GC, nên thu về 0 ngay khi bỏ. */
function free(c: HTMLCanvasElement | undefined) {
  if (!c) return;
  c.width = 0;
  c.height = 0;
}

/** Vẽ cả khung (kể lề đã cắt của frame trim, có thể lật ngang) vào canvas nháp dùng chung, trả ctx của nó. */
function sprite(cut: Phaser.Textures.Frame, flip: boolean) {
  const w = cut.realWidth, h = cut.realHeight;
  tmp ??= canvas(1, 1);
  tmp.width = Math.max(tmp.width, w);
  tmp.height = Math.max(tmp.height, h);
  const ctx = tmp.getContext("2d")!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, tmp.width, tmp.height);
  if (flip) { ctx.translate(w, 0); ctx.scale(-1, 1); }
  ctx.drawImage(sourceImage(cut), cut.cutX, cut.cutY, cut.cutWidth, cut.cutHeight, cut.x, cut.y, cut.cutWidth, cut.cutHeight);
  return ctx;
}

const canFilter = (ctx: CanvasRenderingContext2D) => "filter" in ctx;

const blurOf = (ctx: CanvasRenderingContext2D, px: number) => {
  if (canFilter(ctx)) ctx.filter = `blur(${px}px)`;
};

/** Thay `ctx.filter` ở trình duyệt thiếu: thu nhỏ rồi phóng lại cho mềm. */
function softenWithoutFilter(ctx: CanvasRenderingContext2D, px: number) {
  if (canFilter(ctx)) return;
  const { width: w, height: h } = ctx.canvas;
  const k = Math.max(2, Math.round(px * 2));
  const small = canvas(Math.max(1, Math.ceil(w / k)), Math.max(1, Math.ceil(h / k)));
  const s = small.getContext("2d")!;
  s.imageSmoothingQuality = "high";
  s.drawImage(ctx.canvas, 0, 0, small.width, small.height);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "copy";
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(small, 0, 0, w, h);
  ctx.restore();
  free(small);
}

function bakeShadow(cut: Phaser.Textures.Frame, flip: boolean, foot: number, K: number, ss: number, soft = 1) {
  const w = cut.realWidth, h = cut.realHeight;
  const t = sprite(cut, flip);
  t.globalCompositeOperation = "source-in";
  t.fillStyle = `rgb(${SHADOW_RGB.join(",")})`;
  t.fillRect(0, 0, w, h);
  t.globalCompositeOperation = "destination-in";
  const g = t.createLinearGradient(0, 0, 0, foot);
  g.addColorStop(0, `rgba(0,0,0,${SHADOW_TOP})`);
  g.addColorStop(1, `rgba(0,0,0,${SHADOW_FOOT})`);
  t.fillStyle = g;
  t.fillRect(0, 0, w, h);

  const blur = SHADOW_BLUR * ss * soft;
  const L = bakeLayout(w, h, foot, K, 2 * K, Math.ceil(blur * 3) + 2, BAKE_RES);
  const out = canvas(L.cw, L.ch);
  const ctx = out.getContext("2d")!;
  blurOf(ctx, blur * BAKE_RES);
  ctx.setTransform(BAKE_RES, 0, 0, BAKE_RES, L.padL * BAKE_RES, 0);
  const m = shadowMatrix(K, foot);
  ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
  ctx.drawImage(tmp!, 0, 0, w, h, 0, 0, w, h);
  softenWithoutFilter(ctx, blur * BAKE_RES);
  return { out, L };
}

function bakeReflection(cut: Phaser.Textures.Frame, flip: boolean, foot: number, ss: number) {
  const w = cut.realWidth, h = cut.realHeight;
  sprite(cut, flip);
  const blur = REFLECT_BLUR * ss;
  const L = bakeLayout(w, h, foot, 1, 0, Math.ceil(blur * 3) + 2, BAKE_RES);
  const out = canvas(L.cw, L.ch);
  const ctx = out.getContext("2d")!;
  blurOf(ctx, blur * BAKE_RES);
  ctx.setTransform(BAKE_RES, 0, 0, BAKE_RES, L.padL * BAKE_RES, 0);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, foot, w, h);
  ctx.clip();
  ctx.transform(1, 0, 0, -1, 0, 2 * foot);
  ctx.drawImage(tmp!, 0, 0, w, h, 0, 0, w, h);
  ctx.restore();
  softenWithoutFilter(ctx, blur * BAKE_RES);
  ctx.filter = "none";
  ctx.globalCompositeOperation = "destination-in";
  const g = ctx.createLinearGradient(0, foot, 0, 2 * foot);
  g.addColorStop(0, `rgba(0,0,0,${REFLECT_FOOT})`);
  g.addColorStop(1, `rgba(0,0,0,${REFLECT_TOP})`);
  ctx.fillStyle = g;
  ctx.fillRect(-L.padL, 0, w + 2 * L.padL, L.ch / BAKE_RES);
  return { out, L };
}

/** Hàng ngay dưới điểm đục thấp nhất của frame: chỗ chạm đất. */
export function soleRow(data: ArrayLike<number>, w: number, h: number) {
  for (let y = h - 1; y >= 0; y--) {
    for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] >= SOLE_ALPHA) return y + 1;
  }
  return h;
}

/** Hàng chân theo TextureSource rồi theo frame, không theo canvas vì Phaser dùng lại canvas của texture đã xoá. */
const feet = new WeakMap<Phaser.Textures.TextureSource, Map<string, number>>();
/** Ảnh khung hình của một nhân vật theo hướng và bước đi. */
const POSE_KEY = /^(.+)_(?:n|ne|e|se|s|sw|w|nw)(?:_[a-z]+\d*)?$/;
/** Phần đáy khung được đọc gộp; chân nằm cao hơn thì đọc riêng cả khung. */
const SOLE_SLICE = 0.4;
/** Trần bề cao tấm gộp, để tấm vẫn nằm trên GPU và mỗi lần đọc ngắn. */
const SHEET_H = 2048;

const footOf = (cut: Phaser.Textures.Frame) => feet.get(cut.source)?.get(cut.name);
function keepFoot(cut: Phaser.Textures.Frame, foot: number) {
  let m = feet.get(cut.source);
  if (!m) feet.set(cut.source, (m = new Map()));
  m.set(cut.name, foot);
}

function measureFoot(cut: Phaser.Textures.Frame) {
  const hit = footOf(cut);
  if (hit !== undefined) return hit;
  const ctx = sprite(cut, false);
  const foot = soleRow(ctx.getImageData(0, 0, cut.realWidth, cut.realHeight).data, cut.realWidth, cut.realHeight);
  keepFoot(cut, foot);
  return foot;
}

/** Đọc trước chân mọi khung nhân vật rồi niêm texture: đáy nhiều khung vẽ chung một tấm rồi đọc một lần, vì mỗi lần getImageData phải chờ GPU; mỗi tấm một `yield`. */
export function* feetSteps(textures: Phaser.Textures.TextureManager) {
  const todo: Phaser.Textures.Frame[] = [];
  for (const key of textures.getTextureKeys()) {
    const who = POSE_KEY.exec(key)?.[1];
    const f = who && isCharacter(who) ? textures.getFrame(key) : null;
    if (f && footOf(f) === undefined) todo.push(f);
  }
  while (todo.length) {
    const frames: { f: Phaser.Textures.Frame; h: number; y: number }[] = [];
    let w = 1, y = 0;
    while (todo.length) {
      const f = todo[todo.length - 1];
      const h = Math.max(1, Math.ceil(f.realHeight * SOLE_SLICE));
      if (frames.length && y + h > SHEET_H) break;
      todo.pop();
      frames.push({ f, h, y });
      w = Math.max(w, f.realWidth);
      y += h;
    }
    const sheet = canvas(w, y);
    const ctx = sheet.getContext("2d")!;
    for (const { f, h, y: at } of frames) {
      // Hàng `realHeight − h` của khung đầy đủ nằm ở `at`; frame trim chỉ chép phần hàng nó có.
      const top = Math.max(0, f.realHeight - h - f.y), bot = Math.min(f.cutHeight, f.realHeight - f.y);
      if (bot > top) ctx.drawImage(sourceImage(f), f.cutX, f.cutY + top, f.cutWidth, bot - top, f.x, at + f.y + top - (f.realHeight - h), f.cutWidth, bot - top);
    }
    const data = ctx.getImageData(0, 0, w, y).data;
    free(sheet);
    for (const { f, h, y: at } of frames) {
      for (let r = h - 1; r >= 0; r--) {
        if (!opaqueRow(data, w, at + r)) continue;
        keepFoot(f, f.realHeight - h + r + 1);
        break;
      }
      measureFoot(f);
      sealTexture(textures, f.texture.key);
    }
    yield;
  }
}

const opaqueRow = (data: ArrayLike<number>, w: number, y: number) => {
  for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] >= SOLE_ALPHA) return true;
  return false;
};

function drop(textures: Phaser.Textures.TextureManager, e: Entry) {
  free(e.shadow);
  free(e.shadowIn);
  if (e.refl && textures.exists(e.refl)) {
    // Đọc thẳng `source.image`: `getSourceImage` của texture đã niêm sẽ chép ngược từ GPU.
    const img = textures.get(e.refl).source[0].image;
    textures.remove(e.refl);
    if (img instanceof HTMLCanvasElement) free(img);
  }
}

/** Bỏ bóng, phản chiếu đã bake của mọi khung thuộc nhân vật `who` mà không thân nào đang dùng. */
export function forgetActor(textures: Phaser.Textures.TextureManager, who: string) {
  const pre = `${who}_`;
  for (const [k, e] of cache) {
    if (!k.startsWith(pre) || e.users > 0) continue;
    drop(textures, e);
    cache.delete(k);
  }
}

/** Xoá mục cũ nhất không ai dùng cho tới khi về trần theo số thân đang sống. */
function evict(textures: Phaser.Textures.TextureManager) {
  const cap = Math.max(CACHE_MIN, actors * POSES_PER_ACTOR);
  for (const [k, e] of cache) {
    if (cache.size <= cap) return;
    if (e.users > 0) continue;
    drop(textures, e);
    cache.delete(k);
  }
}

function aoTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(AO_KEY)) return;
  const w = AO_W * AO_SS, h = AO_H * AO_SS;
  const tex = scene.textures.createCanvas(AO_KEY, w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2);
  g.addColorStop(0, "rgba(115,107,140,1)");
  g.addColorStop(0.55, "rgba(115,107,140,0.55)");
  g.addColorStop(1, "rgba(115,107,140,0)");
  ctx.translate(w / 2, h / 2);
  ctx.scale(1, 0.5);
  ctx.fillStyle = g;
  ctx.fillRect(-w / 2, -w / 2, w, w);
  tex.refresh();
}

type Live = {
  key: string; tex: Phaser.Textures.CanvasTexture; w: number; h: number;
  src: HTMLCanvasElement | null; x: number; y: number;
  /** Đang giữ nguyên bóng bake, chưa cắt theo nắng. */
  plain: boolean;
};

/** Lề px ảnh nắng quanh vùng lấy mẫu, phủ phần lọc song tuyến đọc lấn ra. */
const COVER_PAD = 4;

type ReflMask = {
  env: LightEnv; gfx: Phaser.GameObjects.Graphics; mask: Phaser.Display.Masks.GeometryMask;
  /** Mọi phản chiếu chung một mặt nạ, vẽ trong một Container để stencil chỉ dựng một lần mỗi khung. */
  layer: Phaser.GameObjects.Container; users: number;
};

let reflMask: ReflMask | null = null;

function destroyMask(m: ReflMask) {
  m.layer.removeAll(false);
  m.layer.destroy();
  m.mask.destroy();
  m.gfx.destroy();
}

/** Một mặt nạ chung gồm các ô sàn bóng; chỉ chất liệu bóng mới phản chiếu. */
function acquireMask(scene: Phaser.Scene, env: LightEnv) {
  if (reflMask && reflMask.env !== env) {
    destroyMask(reflMask);
    reflMask = null;
  }
  if (!reflMask) {
    const gfx = scene.make.graphics({}, false);
    gfx.fillStyle(0xffffff, 1);
    for (let ty = 0; ty < WORLD_H; ty++) {
      for (let tx = 0; tx < WORLD_W; tx++) {
        if (env.gloss(tx + 0.5, ty + 0.5) <= 0) continue;
        const a = toScreen(tx, ty), b = toScreen(tx + 1, ty), c = toScreen(tx + 1, ty + 1), d = toScreen(tx, ty + 1);
        gfx.fillPoints([{ x: a.sx, y: a.sy }, { x: b.sx, y: b.sy }, { x: c.sx, y: c.sy }, { x: d.sx, y: d.sy }], true);
      }
    }
    const mask = gfx.createGeometryMask();
    const layer = scene.add.container(0, 0).setDepth(LIGHT_DEPTH.reflection + 1).setMask(mask);
    reflMask = { env, gfx, mask, layer, users: 0 };
  }
  reflMask.users++;
  return reflMask;
}

function releaseMask(m: ReflMask) {
  if (--m.users > 0) return;
  if (reflMask === m) reflMask = null;
  destroyMask(m);
}

export type ActorPose = {
  /** Toạ độ thế giới của chân, để tra độ bóng sàn. */
  wx: number; wy: number;
  /** Px thiết kế thân nhấc khỏi mặt đất (nhún, nhảy). */
  lift?: number;
  /** Bề ngang AO (px thiết kế). */
  footW?: number;
};

/** Bóng nắng, AO, phản chiếu sàn và nhuộm nắng cho một thân sprite; thiếu `LightEnv` thì không vẽ gì. */
export class ActorLight {
  private shadow: Phaser.GameObjects.Image;
  private shadowIn: Phaser.GameObjects.Image;
  private refl: Phaser.GameObjects.Image;
  private ao: Phaser.GameObjects.Image;
  private entryKey = "";
  private entry: Entry | null = null;
  private sun = -1;
  private last = 0;
  private mask: ReflMask | null = null;
  private lives: { o?: Live; i?: Live } = {};

  constructor(private scene: Phaser.Scene, private body: Phaser.GameObjects.Image) {
    actors++;
    aoTexture(scene);
    const mk = (depth: number) => scene.add.image(0, 0, AO_KEY).setDepth(depth).setVisible(false);
    this.shadow = mk(LIGHT_DEPTH.actorShadow).setBlendMode("MULTIPLY");
    this.shadowIn = mk(LIGHT_DEPTH.actorShadow).setBlendMode("MULTIPLY");
    this.ao = mk(LIGHT_DEPTH.actorShadow).setBlendMode("MULTIPLY");
    this.refl = mk(LIGHT_DEPTH.reflection + 1);
  }

  private release() {
    if (this.entry) this.entry.users--;
    this.entry = null;
    this.entryKey = "";
  }

  private enter(key: string, src: Phaser.Textures.TextureSource, frame: Phaser.Textures.Frame) {
    this.release();
    let e = cache.get(key);
    if (e && e.src !== src) {
      drop(this.scene.textures, e);
      cache.delete(key);
      e = undefined;
    }
    if (e) cache.delete(key);
    e ??= { src, users: 0, foot: measureFoot(frame) };
    cache.set(key, e);
    e.users++;
    evict(this.scene.textures);
    this.entry = e;
    this.entryKey = key;
  }

  update(p: ActorPose) {
    const body = this.body;
    const env = this.scene.registry.get(LIGHT_ENV_KEY) as LightEnv | undefined;
    if (!env || !body.visible || body.alpha <= 0.01) { this.hide(); return; }

    const frame = body.frame;
    const k = body.scaleX;
    const ss = 1 / k;
    const h = frame.realHeight;
    const flip = body.flipX;
    const key = `${frame.texture.key}|${frame.name}|${flip ? 1 : 0}`;
    if (key !== this.entryKey || this.entry?.src !== frame.source) this.enter(key, frame.source, frame);
    const e = this.entry!;
    const foot = e.foot;
    const lift = p.lift ?? 0;
    const groundY = body.y + lift - (h - foot) * k;

    const now = performance.now();
    const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0;
    this.last = now;
    const target = areaSun(env, body.x, groundY);
    this.sun = this.sun < 0 ? target : approach(this.sun, target, dt);
    body.setTint(tintForSun(this.sun));

    this.ao.setPosition(body.x, groundY).setScale((p.footW ?? 38) / (AO_W * AO_SS))
      .setAlpha(AO_ALPHA * body.alpha).setVisible(true);

    const sAlpha = shadowAlpha(this.sun, env.overcast) * body.alpha;
    const inW = env.indoor(p.wx, p.wy);
    const outA = sAlpha * (1 - inW);
    const inA = sAlpha * INDOOR_SHADOW.alpha * inW;
    if (outA > 0.01) {
      if (!e.shadow) {
        const { out, L } = bakeShadow(frame, flip, foot, env.sunK, ss);
        e.shadow = out;
        e.shadowL = L;
      }
      this.shadow.setVisible(this.live(this.shadow, "o", e.shadow, e.shadowL!, env, lift, k)).setAlpha(outA);
    } else this.shadow.setVisible(false);
    if (inA > 0.01) {
      if (!e.shadowIn) {
        const { out, L } = bakeShadow(frame, flip, foot, INDOOR_SHADOW.k, ss, INDOOR_SHADOW.soft);
        e.shadowIn = out;
        e.shadowInL = L;
      }
      this.shadowIn.setVisible(this.live(this.shadowIn, "i", e.shadowIn, e.shadowInL!, env, lift, k)).setAlpha(inA);
    } else this.shadowIn.setVisible(false);

    const rAlpha = reflectAlpha(env.gloss(p.wx, p.wy), env.overcast) * body.alpha;
    if (rAlpha > 0.01) {
      if (this.mask?.env !== env) {
        if (this.mask) releaseMask(this.mask);
        this.mask = acquireMask(this.scene, env);
        this.mask.layer.add(this.refl);
      }
      if (!e.refl) {
        const { out, L } = bakeReflection(frame, flip, foot, ss);
        e.refl = `actor-rf${serial++}`;
        e.reflL = L;
        this.scene.textures.addCanvas(e.refl, out);
        sealTexture(this.scene.textures, e.refl);
      }
      this.place(this.refl, e.refl, e.reflL!, lift, k);
      this.refl.setAlpha(rAlpha).setVisible(true);
    } else this.refl.setVisible(false);
  }

  /** Bóng bake nhân với ảnh nắng của sàn: chỗ sàn đã có bóng nhà, bóng lá thì bóng người không tối thêm. */
  private live(img: Phaser.GameObjects.Image, slot: "o" | "i", baked: HTMLCanvasElement, L: BakeLayout, env: LightEnv, lift: number, k: number): boolean {
    const layer = env.sunLayer;
    const px = this.body.x, py = this.body.y + lift;
    let live = this.lives[slot];
    if (!layer) return false;
    if (!live || live.w !== baked.width || live.h !== baked.height) {
      if (live) this.scene.textures.remove(live.key);
      const key = `actor-live${serial++}`;
      const tex = this.scene.textures.createCanvas(key, baked.width, baked.height);
      if (!tex) return false;
      live = { key, tex, w: baked.width, h: baked.height, src: null, x: NaN, y: NaN, plain: false };
      this.lives[slot] = live;
    }
    const s = k / BAKE_RES;
    const sx = (px - L.ox * live.w * s - layer.x) * layer.scale, sy = (py - L.oy * live.h * s - layer.y) * layer.scale;
    const sw = live.w * s * layer.scale, sh = live.h * s * layer.scale;
    // Nắng đều cả vùng thì cắt cũng ra y nguyên bóng bake (hoặc rỗng), khỏi vẽ lại mỗi lần nhích.
    const cover = layer.cover(Math.floor(sx) - COVER_PAD, Math.floor(sy) - COVER_PAD, Math.ceil(sx + sw) + COVER_PAD, Math.ceil(sy + sh) + COVER_PAD);
    if (cover === 0) return false;
    const plain = cover === 1;
    const stale = plain ? !live.plain : live.plain || Math.abs(live.x - px) > 0.25 || Math.abs(live.y - py) > 0.25;
    if (live.src !== baked || stale) {
      const ctx = live.tex.getContext();
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, live.w, live.h);
      ctx.drawImage(baked, 0, 0);
      if (!plain) {
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(layer.canvas, sx, sy, sw, sh, 0, 0, live.w, live.h);
        ctx.globalCompositeOperation = "source-over";
      }
      live.tex.refresh();
      live.src = baked;
      live.plain = plain;
      live.x = px;
      live.y = py;
    }
    if (img.texture.key !== live.key) img.setTexture(live.key).setOrigin(L.ox, L.oy);
    img.setPosition(px, py).setScale(k / BAKE_RES);
    return true;
  }

  private place(img: Phaser.GameObjects.Image, tex: string, L: BakeLayout, lift: number, k: number) {
    if (img.texture.key !== tex) img.setTexture(tex).setOrigin(L.ox, L.oy);
    img.setPosition(this.body.x, this.body.y + lift).setScale(k / BAKE_RES);
  }

  private hide() {
    this.shadow.setVisible(false);
    this.shadowIn.setVisible(false);
    this.refl.setVisible(false);
    this.ao.setVisible(false);
    this.body.clearTint();
    this.sun = -1;
    this.last = 0;
  }

  destroy() {
    for (const l of [this.lives.o, this.lives.i]) if (l && this.scene.textures.exists(l.key)) this.scene.textures.remove(l.key);
    this.lives = {};
    this.release();
    this.shadow.destroy();
    this.shadowIn.destroy();
    this.refl.destroy();
    this.ao.destroy();
    if (this.mask) releaseMask(this.mask);
    this.mask = null;
    actors--;
    evict(this.scene.textures);
  }
}
