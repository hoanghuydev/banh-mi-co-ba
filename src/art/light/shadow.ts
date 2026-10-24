import { blur } from "./raster";
import { groundProfile } from "./profile";
import type { Img } from "./types";

export type CastShadow = { w: number; h: number; mask: Float32Array; t: Float32Array; padX: number };

function maxFilter5(a: Float32Array, w: number, h: number): Float32Array {
  const tmp = new Float32Array(a.length);
  const out = new Float32Array(a.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let m = 0;
      for (let k = Math.max(0, x - 2); k <= Math.min(w - 1, x + 2); k++) m = Math.max(m, a[y * w + k]);
      tmp[y * w + x] = m;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let m = 0;
      for (let k = Math.max(0, y - 2); k <= Math.min(h - 1, y + 2); k++) m = Math.max(m, tmp[k * w + x]);
      out[y * w + x] = m;
    }
  }
  return out;
}

/** Mỗi điểm đục ở độ cao z so với chân cột đổ tới (x − 2kz, đáy + kz); góc trên-trái bóng ở (trái sprite − padX, trên sprite). */
export function castShadow(img: Img, k: number): CastShadow {
  const { w: iw, h: ih, data } = img;
  const by = groundProfile(img);
  const padX = Math.floor(2 * k * ih) + 3;
  const w = iw + padX + 2;
  const h = Math.floor(ih + k * ih) + 3;
  const m = new Float32Array(w * h);
  const t = new Float32Array(w * h);
  const zDen = Math.max(1, ih * 0.85);
  for (let y = 0; y < ih; y++) {
    for (let x = 0; x < iw; x++) {
      const a = data[(y * iw + x) * 4 + 3] / 255;
      if (a <= 0.03) continue;
      const z = Math.max(0, by[x] - y);
      const tz = Math.min(1, z / zDen);
      const ix = Math.round(x - 2 * k * z) + padX;
      const iy = Math.round(by[x] + k * z);
      for (let oy = 0; oy < 2; oy++) {
        for (let ox = 0; ox < 2; ox++) {
          const xx = ix + ox;
          const yy = iy + oy;
          if (xx < 0 || xx >= w || yy < 0 || yy >= h) continue;
          const i = yy * w + xx;
          if (a > m[i]) m[i] = a;
          if (tz > t[i]) t[i] = tz;
        }
      }
    }
  }
  return { w, h, mask: maxFilter5(m, w, h), t: maxFilter5(t, w, h), padX };
}

export type Patch = { x0: number; y0: number; w: number; h: number; data: Float32Array };

/** Hình thoi chân vật nhoè, chỉ cấp phát vùng bao quanh. */
export function footprintPatch(cx: number, cy: number, hw: number, hh: number, sigma: number): Patch {
  const mx = Math.ceil(hw + sigma * 3) + 2;
  const my = Math.ceil(hh + sigma * 3) + 2;
  const x0 = Math.floor(cx) - mx;
  const y0 = Math.floor(cy) - my;
  const w = mx * 2 + 1;
  const h = my * 2 + 1;
  const data = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let c = 0;
      for (let sy = 0; sy < 2; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const px = x0 + x + 0.25 + sx * 0.5 - cx;
          const py = y0 + y + 0.25 + sy * 0.5 - cy;
          if (Math.abs(px) / hw + Math.abs(py) / hh <= 1) c += 0.25;
        }
      }
      data[y * w + x] = c;
    }
  }
  blur(data, w, h, sigma);
  return { x0, y0, w, h, data };
}

export function footprintAO(w: number, h: number, cx: number, cy: number, hw: number, hh: number, blurSigma: number): Float32Array {
  const p = footprintPatch(cx, cy, hw, hh, blurSigma);
  const out = new Float32Array(w * h);
  for (let y = 0; y < p.h; y++) {
    const yy = p.y0 + y;
    if (yy < 0 || yy >= h) continue;
    for (let x = 0; x < p.w; x++) {
      const xx = p.x0 + x;
      if (xx >= 0 && xx < w) out[yy * w + xx] = p.data[y * p.w + x];
    }
  }
  return out;
}
