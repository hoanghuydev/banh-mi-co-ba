import type { Img } from "../art/light/types";
import { TH, TW } from "./iso";
import { SKY_FROM_Y, WORLD_H, WORLD_W, floorAt, tileAt } from "./map";
import { SHADOW_RGB } from "../art/light/actor";
import { worldAt } from "./lightParams";

const EDGE = 0.25;

const ROAD_FROM_Y = (() => {
  for (let y = 0; y < WORLD_H; y++) if (floorAt(0, y) === "road") return y;
  return WORLD_H;
})();

const smooth = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

/** 1 trên nhựa đường, mượt quanh ranh với vỉa hè. */
export function roadWeight(wy: number) {
  return smooth((wy - (ROAD_FROM_Y - EDGE)) / (2 * EDGE));
}

/** 1 trong tiệm. */
function shopWeight(wy: number) {
  return 1 - smooth((wy - (SKY_FROM_Y - EDGE)) / (2 * EDGE));
}

const WARM = [255, 224, 160] as const;
const WARM_A = 0.32;
const WARM_INDOOR = 0.18;
const ROAD_LIT = [213, 197, 163] as const;
const ROAD_LIT_A = 0.16;
const WALK_TINT = [215, 120, 85] as const;
const WALK_TINT_A = 0.12;
const COOL = [71, 89, 79] as const;
const COOL_A = 0.1;
const SUN_BLUR = 9;
const SHAFT_COLOR = [255, 222, 154] as const;
const SHAFT_ALPHA = 0.22;
const SHAFT_BLUR = 14;
const CORE_COLOR = [255, 240, 188] as const;
const CORE_ALPHA = 0.11;
const LIFT = [255, 241, 214] as const;
const LIFT_A = 0.19;
const LIFT_BLUR = 24;
const COOL_LOCAL = [199, 210, 222] as const;
const COOL_LOCAL_A = 0.05;
const COOL_LOCAL_BLUR = 28;
const DEPTH_COOL = [167, 183, 198] as const;
const DEPTH_COOL_A = 0.055;
const DEPTH_BLUR = 15;
const CORNER_WARM = [201, 181, 156] as const;
const CORNER_WARM_A = 0.04;
const CORNER_BLUR = 60;
const CORE_BLUR = 5;
/** Vạt nắng trên sàn tiệm: [x0, x1, y0, y1] theo ô thế giới, dài theo +y; lõi là phần giữa. */
const SHAFTS = [
  [6.0, 9.6, 1.4, 5.2],
  [10.6, 13.2, 1.8, 5.4],
  [14.0, 15.6, 3.0, 5.5],
] as const;
const CORE_INSET = 0.3;

function shaftField(
  w: number, h: number, ground: { x: number; y: number },
  toScreen: (wx: number, wy: number) => { sx: number; sy: number },
  inset: number, blur: number,
) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.translate(-ground.x, -ground.y);
  ctx.fillStyle = "#fff";
  for (const [x0, x1, y0, y1] of SHAFTS) {
    const a = x0 + inset, b = x1 - inset, c0 = y0 + inset, d = y1 - inset;
    if (b <= a || d <= c0) continue;
    ctx.beginPath();
    [[a, c0], [b, c0], [b, d], [a, d]].forEach(([x, y], i) => {
      const p = toScreen(x, y);
      if (i) ctx.lineTo(p.sx, p.sy); else ctx.moveTo(p.sx, p.sy);
    });
    ctx.closePath();
    ctx.fill();
  }
  const d = ctx.getImageData(0, 0, w, h).data;
  c.width = c.height = 0;
  const f = new Float32Array(w * h);
  for (let i = 0; i < f.length; i++) f[i] = d[i * 4 + 3] / 255;
  boxBlur(f, w, h, blur);
  boxBlur(f, w, h, blur);
  return f;
}

function boxBlur(a: Float32Array, w: number, h: number, r: number) {
  const tmp = new Float32Array(a.length);
  const k = 1 / (2 * r + 1);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let sum = 0;
    for (let x = -r; x <= r; x++) sum += a[row + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = sum * k;
      sum += a[row + Math.min(w - 1, x + r + 1)] - a[row + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      a[y * w + x] = sum * k;
      sum += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
}

export type TintLayers = { warm: Img; walk: Img; cool: Img; shaft: Img; core: Img; lift: Img; shade: Img; w: number; h: number };

/** Ba lớp màu ở 1 px mỗi px thiết kế: nắng ấm (SCREEN), phủ cam gạch đỏ (SCREEN), tông lạnh dưới lá (MULTIPLY); mỗi `yield` là chỗ được nhường luồng. */
export function* buildTintLayers(
  ground: { x: number; y: number; width: number; height: number },
  sun: { w: number; h: number; data: Float32Array },
  scale: number,
  inside: (sx: number, sy: number) => boolean,
  toScreen: (wx: number, wy: number) => { sx: number; sy: number },
): Generator<void, TintLayers> {
  const w = Math.ceil(ground.width), h = Math.ceil(ground.height);
  const n = w * h;
  const sunLow = new Float32Array(n);
  const zone = new Float32Array(n * 3);
  for (let y = 0; y < h; y++) {
    if ((y & 31) === 31) yield;
    const sy = ground.y + y + 0.5;
    const sj = Math.min(sun.h - 1, Math.floor((y + 0.5) * scale));
    for (let x = 0; x < w; x++) {
      const sx = ground.x + x + 0.5;
      const i = y * w + x;
      if (!inside(sx, sy)) continue;
      const wy = worldAt(sx, sy).wy;
      const road = roadWeight(wy), shop = shopWeight(wy);
      zone[i * 3] = shop;
      zone[i * 3 + 1] = Math.max(0, 1 - shop - road);
      zone[i * 3 + 2] = road;
      sunLow[i] = sun.data[sj * sun.w + Math.min(sun.w - 1, Math.floor((x + 0.5) * scale))];
    }
  }
  yield;
  const sunSharp = Float32Array.from(sunLow);
  boxBlur(sunSharp, w, h, 2);
  yield;
  boxBlur(sunLow, w, h, SUN_BLUR);
  yield;
  boxBlur(sunLow, w, h, SUN_BLUR);
  yield;

  const warm = new Uint8ClampedArray(n * 4);
  const walk = new Uint8ClampedArray(n * 4);
  const cool = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    const shop = zone[i * 3], out = zone[i * 3 + 1], road = zone[i * 3 + 2];
    if (shop + out + road === 0) continue;
    const s = sunSharp[i];
    const o = i * 4;
    const sunA = (sunLow[i] * WARM_INDOOR * shop + s * out) * WARM_A;
    const roadA = s * road * ROAD_LIT_A;
    const a = sunA + roadA;
    if (a > 0) {
      for (let c = 0; c < 3; c++) warm[o + c] = (WARM[c] * sunA + ROAD_LIT[c] * roadA) / a;
      warm[o + 3] = a * 255;
    }
    walk[o] = WALK_TINT[0];
    walk[o + 1] = WALK_TINT[1];
    walk[o + 2] = WALK_TINT[2];
    walk[o + 3] = out * WALK_TINT_A * 255;
    cool[o] = COOL[0];
    cool[o + 1] = COOL[1];
    cool[o + 2] = COOL[2];
    cool[o + 3] = (1 - Math.min(1, s)) * out * COOL_A * 255;
  }
  yield;
  const shaft = new Uint8ClampedArray(n * 4);
  const core = new Uint8ClampedArray(n * 4);
  const shade = new Uint8ClampedArray(n * 4);
  const lift = new Uint8ClampedArray(n * 4);
  const shopMask = new Float32Array(n);
  const dark = new Float32Array(n);
  const corner = new Float32Array(n);
  const cornerAo = buildCornerAo(ground, toScreen);
  const cornerData = cornerAo.getContext("2d")!.getImageData(0, 0, w, h).data;
  cornerAo.width = cornerAo.height = 0;
  for (let i = 0; i < n; i++) {
    shopMask[i] = zone[i * 3];
    dark[i] = zone[i * 3] > 0 ? 1 - Math.min(1, sunSharp[i]) : 0;
    corner[i] = cornerData[i * 4 + 3] / 255;
  }
  yield;
  boxBlur(shopMask, w, h, LIFT_BLUR);
  yield;
  boxBlur(shopMask, w, h, LIFT_BLUR);
  yield;
  boxBlur(dark, w, h, DEPTH_BLUR);
  yield;
  const wide = Float32Array.from(dark);
  boxBlur(wide, w, h, COOL_LOCAL_BLUR);
  yield;
  boxBlur(corner, w, h, CORNER_BLUR);
  yield;
  boxBlur(corner, w, h, CORNER_BLUR);
  yield;
  const broad = shaftField(w, h, ground, toScreen, 0, SHAFT_BLUR);
  yield;
  const bright = shaftField(w, h, ground, toScreen, CORE_INSET, CORE_BLUR);
  yield;
  for (let i = 0; i < n; i++) {
    const shop = zone[i * 3];
    if (shop <= 0) continue;
    const s = Math.min(1, sunSharp[i]) * shop;
    const o = i * 4;
    const f = (c: number, col: readonly number[], a: number) => 1 - a + (col[c] / 255) * a;
    const sunless = Math.min(1, wide[i] * 1.6) * shop;
    const near = Math.min(1, dark[i] * 1.4) * shop;
    const cn = Math.min(1, corner[i] * 4) * shop;
    for (let c = 0; c < 3; c++) {
      shade[o + c] = 255 * f(c, COOL_LOCAL, COOL_LOCAL_A * sunless) * f(c, DEPTH_COOL, DEPTH_COOL_A * near) * f(c, CORNER_WARM, CORNER_WARM_A * cn);
    }
    shade[o + 3] = 255;
    lift[o] = LIFT[0];
    lift[o + 1] = LIFT[1];
    lift[o + 2] = LIFT[2];
    lift[o + 3] = Math.min(1, shopMask[i] * 1.15) * shop * LIFT_A * 255;
    shaft[o] = SHAFT_COLOR[0];
    shaft[o + 1] = SHAFT_COLOR[1];
    shaft[o + 2] = SHAFT_COLOR[2];
    shaft[o + 3] = broad[i] * s * SHAFT_ALPHA * 255;
    core[o] = CORE_COLOR[0];
    core[o + 1] = CORE_COLOR[1];
    core[o + 2] = CORE_COLOR[2];
    core[o + 3] = bright[i] * s * CORE_ALPHA * 255;
  }
  return { warm: { w, h, data: warm }, walk: { w, h, data: walk }, cool: { w, h, data: cool }, shaft: { w, h, data: shaft }, core: { w, h, data: core }, lift: { w, h, data: lift }, shade: { w, h, data: shade }, w, h };
}

const WALL_SHADE = [100, 120, 138] as const;
const WALL_SHADE_A = 0.09;
const WALL_LIGHT = [255, 224, 172] as const;
const WALL_LIGHT_A = 0.15;
const WALL_TOP_LIGHT_A = 0.3;
const WALL_TOP_SHADE_A = 0.3;
/** Bề rộng (px thiết kế) chỗ chuyển tông quanh cạnh đứng giữa; mỗi mặt đều một tông nên hai ô kề nhau không lệch ở mép. */
const WALL_RIDGE = 2;

/** Hai ảnh phủ cùng khung sprite tường, chỉ phần thân: nửa trái tối lạnh (MULTIPLY), nửa phải sáng ấm (SCREEN). */
export function wallOverlays(src: Img, imgScale: number): { shade: Img; light: Img } {
  const { w, h, data } = src;
  const shade = new Uint8ClampedArray(w * h * 4);
  const light = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const alpha = data[i + 3] / 255;
      if (alpha === 0) continue;
      const dx = (x - w / 2) / imgScale, dy = y / imgScale;
      if (isTop(dx, dy)) continue;
      const side = smooth(dx / WALL_RIDGE + 0.5);
      shade[i] = WALL_SHADE[0];
      shade[i + 1] = WALL_SHADE[1];
      shade[i + 2] = WALL_SHADE[2];
      shade[i + 3] = alpha * (1 - side) * WALL_SHADE_A * 255;
      light[i] = WALL_LIGHT[0];
      light[i + 1] = WALL_LIGHT[1];
      light[i + 2] = WALL_LIGHT[2];
      light[i + 3] = alpha * side * WALL_LIGHT_A * 255;
    }
  }
  return { shade: { w, h, data: shade }, light: { w, h, data: light } };
}

const isTop = (dx: number, dy: number) => Math.abs(dx) * (TH / TW) + Math.abs(dy - TH / 2) <= TH / 2;

/** Bóng lá lên nóc: chỗ lá nhân `SHADOW_RGB` như sàn (MULTIPLY), chỗ nắng sáng ấm (SCREEN); `leafAt(dx, dy)` nhận px thiết kế tính từ tâm nóc. */
export function wallTopOverlays(src: Img, imgScale: number, leafAt: (dx: number, dy: number) => number): { shade: Img; light: Img } {
  const { w, data } = src;
  const h = Math.ceil(TH * imgScale) + 2;
  const shade = new Uint8ClampedArray(w * h * 4);
  const light = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const alpha = data[i + 3] / 255;
      if (alpha === 0) continue;
      const dx = (x - w / 2) / imgScale, dy = y / imgScale;
      if (!isTop(dx, dy)) continue;
      const leaf = leafAt(dx, dy - TH / 2);
      shade[i] = SHADOW_RGB[0];
      shade[i + 1] = SHADOW_RGB[1];
      shade[i + 2] = SHADOW_RGB[2];
      shade[i + 3] = alpha * leaf * WALL_TOP_SHADE_A * 255;
      light[i] = WALL_LIGHT[0];
      light[i + 1] = WALL_LIGHT[1];
      light[i + 2] = WALL_LIGHT[2];
      light[i + 3] = alpha * (1 - leaf) * WALL_TOP_LIGHT_A * 255;
    }
  }
  return { shade: { w, h, data: shade }, light: { w, h, data: light } };
}

const AO_COLOR = "85,72,61";
const AO_DEPTH = 0.55;
const AO_ALPHA = 0.23;
const AO_ALPHA_PROP = 0.28;
const AO_PROPS = new Set(["K", "Q", "Z", "R", "O", "T", "W", "F", "X"]);

const isWall = (tx: number, ty: number) => {
  const c = tileAt(tx, ty);
  return c === "#" || c === "N" || c === "D";
};

/** Bóng sát chân tường: dải gradient dọc mép ô sàn tiệm giáp ô tường. */
export function buildCornerAo(
  ground: { x: number; y: number; width: number; height: number },
  toScreen: (wx: number, wy: number) => { sx: number; sy: number },
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.ceil(ground.width);
  c.height = Math.ceil(ground.height);
  const ctx = c.getContext("2d")!;
  ctx.translate(-ground.x, -ground.y);
  const strip = (ax: number, ay: number, bx: number, by: number, dx: number, dy: number, alpha: number) => {
    const p = toScreen(ax, ay), q = toScreen(bx, by), r = toScreen(ax + dx, ay + dy), s = toScreen(bx + dx, by + dy);
    const g = ctx.createLinearGradient((p.sx + q.sx) / 2, (p.sy + q.sy) / 2, (r.sx + s.sx) / 2, (r.sy + s.sy) / 2);
    g.addColorStop(0, `rgba(${AO_COLOR},${alpha})`);
    g.addColorStop(1, `rgba(${AO_COLOR},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(p.sx, p.sy);
    ctx.lineTo(q.sx, q.sy);
    ctx.lineTo(s.sx, s.sy);
    ctx.lineTo(r.sx, r.sy);
    ctx.closePath();
    ctx.fill();
  };
  for (let ty = 0; ty < WORLD_H; ty++) {
    for (let tx = 0; tx < WORLD_W; tx++) {
      if (floorAt(tx, ty) !== "shop" || isWall(tx, ty)) continue;
      const a = AO_PROPS.has(tileAt(tx, ty)) ? AO_ALPHA_PROP : AO_ALPHA;
      if (isWall(tx, ty - 1)) strip(tx, ty, tx + 1, ty, 0, AO_DEPTH, a);
      if (isWall(tx - 1, ty)) strip(tx, ty, tx, ty + 1, AO_DEPTH, 0, a);
      if (isWall(tx + 1, ty)) strip(tx + 1, ty, tx + 1, ty + 1, -AO_DEPTH, 0, a);
    }
  }
  return c;
}
