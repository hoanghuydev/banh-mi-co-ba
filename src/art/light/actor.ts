import type Phaser from "phaser";
import { INDOOR_SHADOW, LIGHT_DEPTH, LIGHT_ENV_KEY, type LightEnv } from "./env";
import { toScreen } from "../../world/iso";
import { WORLD_H, WORLD_W } from "../../world/map";

export type Matrix = readonly [a: number, b: number, c: number, d: number, e: number, f: number];

/** Màu nhân của bóng nắng. */
export const SHADOW_RGB = [150, 148, 178] as const;
/** Độ đậm bóng nắng khi nắng đầy. */
export const SHADOW_MAX = 1;
/** Độ đậm bóng ở đỉnh người và ở chân. */
export const SHADOW_TOP = 0.67;
export const SHADOW_FOOT = 0.97;
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
const CACHE_CAP = 600;
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
  src: unknown; users: number; foot: number;
  shadow?: string; shadowL?: BakeLayout; shadowIn?: string; shadowInL?: BakeLayout;
  refl?: string; reflL?: BakeLayout;
};

const cache = new Map<string, Entry>();
let serial = 0;
let tmp: HTMLCanvasElement | null = null;

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/** Vẽ frame (có thể lật ngang) vào canvas nháp dùng chung, trả ctx của nó. */
function sprite(img: CanvasImageSource, cut: Phaser.Textures.Frame, flip: boolean) {
  const w = cut.cutWidth, h = cut.cutHeight;
  tmp ??= canvas(1, 1);
  tmp.width = Math.max(tmp.width, w);
  tmp.height = Math.max(tmp.height, h);
  const ctx = tmp.getContext("2d")!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, tmp.width, tmp.height);
  if (flip) { ctx.translate(w, 0); ctx.scale(-1, 1); }
  ctx.drawImage(img, cut.cutX, cut.cutY, w, h, 0, 0, w, h);
  return ctx;
}

const blurOf = (ctx: CanvasRenderingContext2D, px: number) => {
  if ("filter" in ctx) ctx.filter = `blur(${px}px)`;
};

function bakeShadow(img: CanvasImageSource, cut: Phaser.Textures.Frame, flip: boolean, foot: number, K: number, ss: number, soft = 1) {
  const w = cut.cutWidth, h = cut.cutHeight;
  const t = sprite(img, cut, flip);
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
  return { out, L };
}

function bakeReflection(img: CanvasImageSource, cut: Phaser.Textures.Frame, flip: boolean, foot: number, ss: number) {
  const w = cut.cutWidth, h = cut.cutHeight;
  sprite(img, cut, flip);
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

function measureFoot(img: CanvasImageSource, cut: Phaser.Textures.Frame, flip: boolean) {
  const ctx = sprite(img, cut, flip);
  return soleRow(ctx.getImageData(0, 0, cut.cutWidth, cut.cutHeight).data, cut.cutWidth, cut.cutHeight);
}

function drop(textures: Phaser.Textures.TextureManager, e: Entry) {
  for (const k of [e.shadow, e.shadowIn, e.refl]) if (k && textures.exists(k)) textures.remove(k);
}

/** Xoá mục cũ nhất không ai dùng cho tới khi về trần. */
function evict(textures: Phaser.Textures.TextureManager) {
  for (const [k, e] of cache) {
    if (cache.size <= CACHE_CAP) return;
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

type ReflMask = { env: LightEnv; gfx: Phaser.GameObjects.Graphics; mask: Phaser.Display.Masks.GeometryMask; users: number };

let reflMask: ReflMask | null = null;

/** Một mặt nạ chung gồm các ô sàn bóng; chỉ chất liệu bóng mới phản chiếu. */
function acquireMask(scene: Phaser.Scene, env: LightEnv) {
  if (reflMask && reflMask.env !== env) {
    reflMask.mask.destroy();
    reflMask.gfx.destroy();
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
    reflMask = { env, gfx, mask: gfx.createGeometryMask(), users: 0 };
  }
  reflMask.users++;
  return reflMask;
}

function releaseMask(m: ReflMask) {
  if (--m.users > 0) return;
  if (reflMask === m) reflMask = null;
  m.mask.destroy();
  m.gfx.destroy();
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

  constructor(private scene: Phaser.Scene, private body: Phaser.GameObjects.Image) {
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

  private enter(key: string, src: unknown, frame: Phaser.Textures.Frame, flip: boolean) {
    this.release();
    let e = cache.get(key);
    if (e && e.src !== src) {
      drop(this.scene.textures, e);
      cache.delete(key);
      e = undefined;
    }
    if (e) cache.delete(key);
    e ??= { src, users: 0, foot: measureFoot(src as CanvasImageSource, frame, flip) };
    cache.set(key, e);
    evict(this.scene.textures);
    e.users++;
    this.entry = e;
    this.entryKey = key;
  }

  update(p: ActorPose) {
    const body = this.body;
    const env = this.scene.registry.get(LIGHT_ENV_KEY) as LightEnv | undefined;
    if (!env || !body.visible || body.alpha <= 0.01) { this.hide(); return; }

    const frame = body.frame;
    const src = frame.source.image as CanvasImageSource;
    const k = body.scaleX;
    const ss = 1 / k;
    const h = frame.cutHeight;
    const flip = body.flipX;
    const key = `${frame.texture.key}|${frame.name}|${flip ? 1 : 0}`;
    if (key !== this.entryKey) this.enter(key, src, frame, flip);
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
        const { out, L } = bakeShadow(src, frame, flip, foot, env.sunK, ss);
        e.shadow = `actor-sh${serial++}`;
        e.shadowL = L;
        this.scene.textures.addCanvas(e.shadow, out);
      }
      this.place(this.shadow, e.shadow, e.shadowL!, lift, k);
      this.shadow.setAlpha(outA).setVisible(true);
    } else this.shadow.setVisible(false);
    if (inA > 0.01) {
      if (!e.shadowIn) {
        const { out, L } = bakeShadow(src, frame, flip, foot, INDOOR_SHADOW.k, ss, INDOOR_SHADOW.soft);
        e.shadowIn = `actor-si${serial++}`;
        e.shadowInL = L;
        this.scene.textures.addCanvas(e.shadowIn, out);
      }
      this.place(this.shadowIn, e.shadowIn, e.shadowInL!, lift, k);
      this.shadowIn.setAlpha(inA).setVisible(true);
    } else this.shadowIn.setVisible(false);

    const rAlpha = reflectAlpha(env.gloss(p.wx, p.wy), env.overcast) * body.alpha;
    if (rAlpha > 0.01) {
      if (this.mask?.env !== env) {
        if (this.mask) releaseMask(this.mask);
        this.mask = acquireMask(this.scene, env);
        this.refl.setMask(this.mask.mask);
      }
      if (!e.refl) {
        const { out, L } = bakeReflection(src, frame, flip, foot, ss);
        e.refl = `actor-rf${serial++}`;
        e.reflL = L;
        this.scene.textures.addCanvas(e.refl, out);
      }
      this.place(this.refl, e.refl, e.reflL!, lift, k);
      this.refl.setAlpha(rAlpha).setVisible(true);
    } else this.refl.setVisible(false);
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
    this.release();
    this.shadow.destroy();
    this.shadowIn.destroy();
    this.refl.destroy();
    this.ao.destroy();
    if (this.mask) releaseMask(this.mask);
    this.mask = null;
  }
}
