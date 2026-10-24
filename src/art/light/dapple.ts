import { LIGHT } from "./constants";
import { groundProfile } from "./profile";
import type { FloorLightOutput, Img, LitObject } from "./types";

type Rect = { x: number; y: number; w: number; h: number };

function sampleSun(sun: FloorLightOutput["sun"], fx: number, fy: number): number {
  const x = Math.min(sun.w - 1, Math.max(0, fx - 0.5));
  const y = Math.min(sun.h - 1, Math.max(0, fy - 0.5));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(sun.w - 1, x0 + 1);
  const y1 = Math.min(sun.h - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;
  const d = sun.data;
  const top = d[y0 * sun.w + x0] * (1 - tx) + d[y0 * sun.w + x1] * tx;
  const bot = d[y1 * sun.w + x0] * (1 - tx) + d[y1 * sun.w + x1] * tx;
  return top * (1 - ty) + bot * ty;
}

/** Ảnh nhân cùng khung sprite: mỗi điểm đục nhận nắng tại điểm chạm đất của tia nắng; màu trên 1 bị kẹp ở 255. */
export function dappleOverlay(obj: LitObject, sun: FloorLightOutput["sun"], rect: Rect, scale: number, k: number): Img {
  const { img, imgScale } = obj;
  const { w, h, data } = img;
  const by = groundProfile(img);
  const left = obj.footX - w / imgScale / 2;
  const top = obj.footY - h / imgScale;

  const v = new Float32Array(w * h);
  const wgt = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (data[i * 4 + 3] <= 8) continue;
      const z = Math.max(0, by[x] - y);
      const sx = left + (x - 2 * k * z) / imgScale;
      const sy = top + (by[x] + k * z) / imgScale;
      v[i] = sampleSun(sun, (sx - rect.x) * scale, (sy - rect.y) * scale);
      wgt[i] = 1;
    }
  }

  const out = new Uint8ClampedArray(w * h * 4);
  const [sr, sg, sb] = LIGHT.SHADE;
  const [wr, wg, wb] = LIGHT.WARM;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const a = data[i * 4 + 3];
      if (a === 0) continue;
      let sum = 0;
      let ws = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          const j = yy * w + xx;
          if (wgt[j] === 0) continue;
          const kw = (dx === 0 ? 2 : 1) * (dy === 0 ? 2 : 1);
          sum += v[j] * kw;
          ws += kw;
        }
      }
      const s = ws > 0 ? Math.min(1, Math.max(0, sum / ws)) : 0;
      const o = i * 4;
      out[o] = (sr + (wr - sr) * s) * 255;
      out[o + 1] = (sg + (wg - sg) * s) * 255;
      out[o + 2] = (sb + (wb - sb) * s) * 255;
      out[o + 3] = a;
    }
  }
  return { w, h, data: out };
}
