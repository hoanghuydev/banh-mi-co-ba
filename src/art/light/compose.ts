import { LIGHT } from "./constants";
import { dappleOverlay } from "./dapple";
import { FLOOR_MATERIALS } from "./materials";
import { bilinear, blur, fillCoarse, resizeImg } from "./raster";
import { drain } from "../steps";
import { reflect } from "./reflect";
import { castShadow, footprintPatch, type Patch } from "./shadow";
import type { Canopy, FloorLightInput, FloorLightOutput, Gray, Img, LitObject } from "./types";

const GRID_STEP = 8;

type Placed = { obj: LitObject; fit: Img; x0: number; y0: number };

type CanopyField = { w: number; h: number; data: Float32Array };

/** Không giữ qua các lượt dựng: mỗi trường vài MB. */
type CanopyMemo = Map<Gray, Map<number, CanopyField>>;

/** Giá trị xám -> độ che 0–1, giữ nguyên chi tiết; trắng là nắng, xám trung bình là bóng đủ; `soft` là độ nhoè theo ô. */
function canopyField(c: Canopy, memo: CanopyMemo): CanopyField {
  const img = c.img;
  const sigma = Math.round(((c.soft ?? 0) * img.w) / c.w * 4) / 4;
  let bySigma = memo.get(img);
  if (!bySigma) memo.set(img, (bySigma = new Map()));
  const hit = bySigma.get(sigma);
  if (hit) return hit;
  const data = new Float32Array(img.w * img.h);
  for (let i = 0; i < data.length; i++) data[i] = Math.min(1, Math.max(0, (1 - img.data[i] / 255 - 0.03) / 0.42));
  if (sigma > 0.25) blur(data, img.w, img.h, sigma);
  const field = { w: img.w, h: img.h, data };
  bySigma.set(sigma, field);
  return field;
}

const CANOPY_FEATHER = 0.12;

function canopyAt(f: CanopyField, c: Canopy, wx: number, wy: number): number {
  let u = (wx - c.x) / c.w;
  let v = (wy - c.y) / c.h;
  if (u < 0 || v < 0 || u >= 1 || v >= 1) return 0;
  if (c.flipX) u = 1 - u;
  if (c.flipY) v = 1 - v;
  const e = c.feather === false ? 1 : Math.min(u, 1 - u, v, 1 - v);
  const edge = e >= CANOPY_FEATHER ? 1 : e / CANOPY_FEATHER;
  const fx = u * (f.w - 1);
  const fy = v * (f.h - 1);
  const x0 = fx | 0;
  const y0 = fy | 0;
  const x1 = Math.min(f.w - 1, x0 + 1);
  const y1 = Math.min(f.h - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const d = f.data;
  const s = (d[y0 * f.w + x0] * (1 - tx) + d[y0 * f.w + x1] * tx) * (1 - ty) + (d[y1 * f.w + x0] * (1 - tx) + d[y1 * f.w + x1] * tx) * ty;
  return s * edge * (c.alpha ?? 1);
}

/** Độ che lá 0–1 tại điểm thế giới (ô): hợp các mảng. */
export function leafCover(canopies: Canopy[]): (wx: number, wy: number) => number {
  const memo: CanopyMemo = new Map();
  const fields = canopies.map((c) => canopyField(c, memo));
  return (wx, wy) => {
    let lf = 0;
    for (let k = 0; k < fields.length; k++) lf = 1 - (1 - lf) * (1 - canopyAt(fields[k], canopies[k], wx, wy));
    return lf;
  };
}

const fitCache = new WeakMap<Img, Map<number, Img>>();

function fitOf(img: Img, f: number): Img {
  let byScale = fitCache.get(img);
  if (!byScale) fitCache.set(img, (byScale = new Map()));
  let hit = byScale.get(f);
  if (!hit) byScale.set(f, (hit = resizeImg(img, f)));
  return hit;
}

function placeObject(obj: LitObject, rect: FloorLightInput["rect"], scale: number): Placed {
  const fit = fitOf(obj.img, scale / obj.imgScale);
  const x0 = Math.round((obj.footX - rect.x) * scale - fit.w / 2);
  const y0 = Math.round((obj.footY - rect.y) * scale - fit.h);
  return { obj, fit, x0, y0 };
}

type ShadowWindow = { v: Float32Array; bw: number; bh: number; padX: number; M: number; fw: number; fh: number };

const shadowCache = new WeakMap<Img, Map<string, ShadowWindow>>();

function* shadowWindow(obj: LitObject, hs: number): Generator<void, ShadowWindow> {
  const k = obj.shadowK ?? LIGHT.SUN_K;
  const soft0 = obj.shadowSoft ?? 1;
  const alpha = obj.shadowAlpha ?? 1;
  const key = `${hs}|${k}|${soft0}|${alpha}|${obj.imgScale}`;
  let byKey = shadowCache.get(obj.img);
  if (!byKey) shadowCache.set(obj.img, (byKey = new Map()));
  const hit = byKey.get(key);
  if (hit) return hit;

  const fit = fitOf(obj.img, hs / obj.imgScale);
  const sh = castShadow(fit, k);
  yield;
  const M = Math.ceil(15 * hs * soft0) + 3;
  const bw = sh.w + 2 * M;
  const bh = sh.h + 2 * M;
  const m = new Float32Array(bw * bh);
  const t = new Float32Array(bw * bh);
  for (let y = 0; y < sh.h; y++) {
    m.set(sh.mask.subarray(y * sh.w, (y + 1) * sh.w), (y + M) * bw + M);
    t.set(sh.t.subarray(y * sh.w, (y + 1) * sh.w), (y + M) * bw + M);
  }
  const soft = m.slice();
  const mid = m.slice();
  blur(soft, bw, bh, 5 * hs * soft0);
  yield;
  blur(mid, bw, bh, 2 * hs * soft0);
  yield;
  blur(m, bw, bh, 0.45 * hs * soft0);
  yield;
  const v = new Float32Array(bw * bh);
  for (let i = 0; i < v.length; i++) {
    const tt = Math.min(1, t[i]);
    const a = Math.min(1, Math.max(0, 1 - tt * 2));
    const c = Math.min(1, Math.max(0, tt * 2 - 1));
    v[i] = (m[i] * a + mid[i] * (1 - Math.abs(tt * 2 - 1)) + soft[i] * c) * (0.97 - 0.3 * tt) * alpha;
  }
  const win = { v, bw, bh, padX: sh.padX, M, fw: fit.w, fh: fit.h };
  byKey.set(key, win);
  return win;
}

/** Bóng tính ở nửa độ phân giải rồi nội suy lên lightmap. */
function* addShadow(p: Placed, cast: Float32Array, W: number, H: number, scale: number, rect: FloorLightInput["rect"]) {
  const hs = scale / 2;
  const { v, bw, bh, padX, M, fw, fh } = yield* shadowWindow(p.obj, hs);
  const ox = Math.round((p.obj.footX - rect.x) * hs - fw / 2) - padX - M;
  const oy = Math.round((p.obj.footY - rect.y) * hs - fh) - M;
  const gx0 = Math.max(0, ox * 2);
  const gx1 = Math.min(W, (ox + bw) * 2);
  const gy0 = Math.max(0, oy * 2);
  const gy1 = Math.min(H, (oy + bh) * 2);
  for (let gy = gy0; gy < gy1; gy++) {
    const fy = (gy + 0.5) / 2 - 0.5 - oy;
    for (let gx = gx0; gx < gx1; gx++) {
      const o = gy * W + gx;
      const val = bilinear(v, bw, bh, (gx + 0.5) / 2 - 0.5 - ox, fy);
      if (val > cast[o]) cast[o] = val;
    }
  }
}

const footCache = new Map<string, Patch>();

function addFootprint(obj: LitObject, rect: FloorLightInput["rect"], scale: number, ao: Float32Array, W: number, H: number): void {
  const hh = (obj.fh * LIGHT.TILE_H * scale) / 2;
  const cx = Math.round((obj.footX - rect.x) * scale);
  const cy = Math.round((obj.footY - rect.y) * scale - hh);
  const hw = ((obj.fw * LIGHT.TILE_W * scale) / 2) * LIGHT.AO_GROW;
  const sigma = 0.12 * LIGHT.TILE_W * obj.fw * scale;
  const key = `${hw}|${hh}|${sigma}`;
  let p = footCache.get(key);
  if (!p) {
    if (footCache.size > 64) footCache.clear();
    footCache.set(key, (p = footprintPatch(0, 0, hw, hh * LIGHT.AO_GROW, sigma)));
  }
  for (let y = 0; y < p.h; y++) {
    const gy = cy + p.y0 + y;
    if (gy < 0 || gy >= H) continue;
    for (let x = 0; x < p.w; x++) {
      const gx = cx + p.x0 + x;
      if (gx < 0 || gx >= W) continue;
      const v = p.data[y * p.w + x];
      if (v > ao[gy * W + gx]) ao[gy * W + gx] = v;
    }
  }
}

function multiplyOverlay(img: Img, overlay: Img): Img {
  const out = new Uint8ClampedArray(img.data);
  for (let i = 0; i < img.w * img.h * 4; i += 4) {
    out[i] = (img.data[i] * overlay.data[i]) / 255;
    out[i + 1] = (img.data[i + 1] * overlay.data[i + 1]) / 255;
    out[i + 2] = (img.data[i + 2] * overlay.data[i + 2]) / 255;
  }
  return { w: img.w, h: img.h, data: out };
}

export function composeFloorLight(input: FloorLightInput): FloorLightOutput {
  return drain(composeFloorLightSteps(input));
}

/** Như `composeFloorLight`, mỗi `yield` là chỗ được nhường luồng. */
export function* composeFloorLightSteps(input: FloorLightInput): Generator<void, FloorLightOutput> {
  const { rect, scale, glossAt, insideAt, overcast } = input;
  const W = Math.ceil(rect.w * scale);
  const H = Math.ceil(rect.h * scale);
  const n = W * H;
  const placed: Placed[] = [];
  for (const o of [...input.objects].sort((a, b) => a.footY - b.footY)) {
    placed.push(placeObject(o, rect, scale));
    yield;
  }
  const inside = new Uint8Array(n);
  fillCoarse(inside, W, H, GRID_STEP, (px, py) => (insideAt(rect.x + px / scale, rect.y + py / scale) ? 1 : 0));
  yield;
  const { lm, sun } = yield* lightPass(input, placed, inside, W, H);
  const gloss = new Float32Array(n);
  fillCoarse(gloss, W, H, GRID_STEP, (px, py) => glossAt(rect.x + px / scale, rect.y + py / scale));
  yield;

  const sunField = { w: W, h: H, data: sun };
  const refl = new Uint8ClampedArray(n * 4);
  const mat = FLOOR_MATERIALS.shop;
  for (const p of placed) {
    const lit = overcast
      ? p.fit
      : multiplyOverlay(p.fit, dappleOverlay({ ...p.obj, img: p.fit, imgScale: scale }, sunField, rect, scale, p.obj.shadowK ?? LIGHT.SUN_K));
    yield;
    const r = reflect(lit, p.obj.side, mat.reflNear, mat.reflFar);
    for (let y = 0; y < r.h; y++) {
      const gy = p.y0 + y;
      if (gy < 0 || gy >= H) continue;
      for (let x = 0; x < r.w; x++) {
        const gx = p.x0 + x;
        if (gx < 0 || gx >= W) continue;
        const i = (y * r.w + x) << 2;
        const ra = r.data[i + 3];
        const o = gy * W + gx;
        if (ra === 0 || !inside[o]) continue;
        const gl = gloss[o];
        const a = (ra / 255) * (gl < 0 ? 0 : gl > 1 ? 1 : gl);
        if (a <= 0) continue;
        const q = o << 2;
        const oa = refl[q + 3] / 255;
        const na = a + oa * (1 - a);
        for (let c = 0; c < 3; c++) refl[q + c] = (r.data[i + c] * a + refl[q + c] * oa * (1 - a)) / na;
        refl[q + 3] = na * 255;
      }
    }
  }

  return { lightmap: { w: W, h: H, data: lm }, reflection: { w: W, h: H, data: refl }, sun: sunField };
}

/** Bóng, AO và lá ra lightmap cùng ảnh nắng; mảng trung gian hết hạn khi hàm trả về. */
function* lightPass(input: FloorLightInput, placed: Placed[], inside: Uint8Array, W: number, H: number) {
  const { rect, scale, canopies, overcast } = input;
  const n = W * H;
  const cast = new Float32Array(n);
  const ao = new Float32Array(n);
  for (const p of placed) {
    if (!overcast) yield* addShadow(p, cast, W, H, scale, rect);
    addFootprint(p.obj, rect, scale, ao, W, H);
    yield;
  }

  const SW = Math.ceil(W / GRID_STEP) + 2;
  const SH = Math.ceil(H / GRID_STEP) + 2;
  const gs = new Float32Array(SW * SH).fill(1);
  const memo: CanopyMemo = new Map();
  const fields: CanopyField[] = [];
  for (const c of canopies) {
    fields.push(canopyField(c, memo));
    yield;
  }
  const leafA = new Float32Array(W);
  const leafB = new Float32Array(H);
  const strengthAt = input.leafStrengthAt;
  if (!overcast) {
    const halfW = LIGHT.TILE_W / 2;
    const halfH = LIGHT.TILE_H / 2;
    for (let x = 0; x < W; x++) leafA[x] = (rect.x + (x + 0.5) / scale) / halfW;
    for (let y = 0; y < H; y++) leafB[y] = (rect.y + (y + 0.5) / scale) / halfH;
    if (strengthAt) {
      for (let y = 0; y < SH; y++) {
        for (let x = 0; x < SW; x++) {
          const v = strengthAt(rect.x + (GRID_STEP * x + 0.5) / scale, rect.y + (GRID_STEP * y + 0.5) / scale);
          gs[y * SW + x] = v < 0 ? 0 : v > 1 ? 1 : v;
        }
      }
    }
  }

  const sun = new Float32Array(n);
  const lm = new Uint8ClampedArray(n * 4);
  const out = new Uint32Array(lm.buffer);
  const [ar, ag, ab] = LIGHT.AMB;
  const [sr, sg, sb] = LIGHT.SUN;
  const [cr, cg, cb] = LIGHT.AO_COL;
  const ao0 = LIGHT.AO_STRENGTH * (1 - cr);
  const ao1 = LIGHT.AO_STRENGTH * (1 - cg);
  const ao2 = LIGHT.AO_STRENGTH * (1 - cb);
  const sr255 = sr * 255;
  const sg255 = sg * 255;
  const sb255 = sb * 255;
  const white = 0xffffffff;
  for (let y = 0; y < H; y++) {
    if ((y & 7) === 7) yield;
    const lb = leafB[y];
    for (let x = 0; x < W; x++) {
      const o = y * W + x;
      if (!inside[o]) {
        out[o] = white;
        continue;
      }
      const c = cast[o];
      const a = ao[o];
      let s = 0;
      let leafM = 0;
      if (!overcast) {
        const la = leafA[x];
        const wx = (la + lb) / 2;
        const wy = (lb - la) / 2;
        let lf = 0;
        for (let k = 0; k < fields.length; k++) lf = 1 - (1 - lf) * (1 - canopyAt(fields[k], canopies[k], wx, wy));
        let strength = 1;
        if (strengthAt) {
          const sx = x / GRID_STEP;
          const sy = y / GRID_STEP;
          const ix = sx | 0;
          const iy = sy | 0;
          const fx = sx - ix;
          const fy = sy - iy;
          const k = iy * SW + ix;
          strength = (gs[k] * (1 - fx) + gs[k + 1] * fx) * (1 - fy) + (gs[k + SW] * (1 - fx) + gs[k + SW + 1] * fx) * fy;
        }
        leafM = strength * lf;
        s = (1 - leafM) * (1 - c);
        sun[o] = s;
      }
      const cut = (1 - LIGHT.CAST_AMB_CUT * c) * 255;
      const ld0 = 1 - LIGHT.LEAF_DARK[0] * leafM;
      const ld1 = 1 - LIGHT.LEAF_DARK[1] * leafM;
      const ld2 = 1 - LIGHT.LEAF_DARK[2] * leafM;
      const r = ar * cut * ld0 * (1 - a * ao0) + sr255 * s;
      const gg = ag * cut * ld1 * (1 - a * ao1) + sg255 * s;
      const bb = ab * cut * ld2 * (1 - a * ao2) + sb255 * s;
      out[o] = ((255 << 24) | ((bb > 255 ? 255 : bb + 0.5) << 16) | ((gg > 255 ? 255 : gg + 0.5) << 8) | (r > 255 ? 255 : r + 0.5)) >>> 0;
    }
  }
  return { lm, sun };
}
