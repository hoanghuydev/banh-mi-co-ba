import { blur } from "./raster";
import { groundProfile } from "./profile";
import type { Img } from "./types";

/** Lật mặt bên (cao side×h) qua đường chạm đất từng cột, mờ dần near→far, nhoè tăng về đuôi. */
export function reflect(img: Img, side: number, near: number, far: number): Img {
  const { w, h, data } = img;
  const g = groundProfile(img);
  const hs = Math.floor(side * h);
  const rows = h + hs + 2;
  const n = w * rows;
  const A = new Float32Array(n);
  const P = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  const C = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  const valid = new Uint8Array(w);

  for (let x = 0; x < w; x++) {
    const gx = g[x];
    if (gx < 0 || gx >= h) continue;
    valid[x] = 1;
    const r0 = Math.floor(gx) + 1;
    const r1 = Math.min(rows - 1, Math.floor(gx) + hs + 1);
    for (let r = r0; r <= r1; r++) {
      const s = 2 * gx - r;
      if (s < 0 || s > gx || s < gx - hs) continue;
      const s0 = Math.floor(s);
      const s1 = Math.min(h - 1, s0 + 1);
      const f = s - s0;
      const i0 = (s0 * w + x) * 4;
      const i1 = (s1 * w + x) * 4;
      const a0 = data[i0 + 3];
      const a1 = data[i1 + 3];
      const aSum = a0 * (1 - f) + a1 * f;
      if (aSum <= 0) continue;
      const d = Math.min(1, Math.max(0, (r - gx) / Math.max(1, hs)));
      const alpha = (aSum / 255) * (near + (far - near) * d);
      const o = r * w + x;
      A[o] = alpha;
      for (let c = 0; c < 3; c++) {
        const col = (data[i0 + c] * a0 * (1 - f) + data[i1 + c] * a1 * f) / aSum / 255;
        C[c][o] = col;
        P[c][o] = col * alpha;
      }
    }
  }

  const sigma = Math.max(0.8, 0.0096 * h);
  const soft = A.slice();
  blur(soft, w, rows, sigma);
  for (let c = 0; c < 3; c++) blur(P[c], w, rows, sigma);

  const out = new Uint8ClampedArray(n * 4);
  for (let r = 0; r < rows; r++) {
    const k = Math.min(1, 0.3 + (0.7 * r) / (h + hs));
    for (let x = 0; x < w; x++) {
      if (!valid[x] || r <= Math.floor(g[x])) continue;
      const o = r * w + x;
      const a = A[o] * (1 - k) + soft[o] * k;
      if (a <= 0) continue;
      const q = (o << 2);
      for (let c = 0; c < 3; c++) {
        const blurred = soft[o] > 1e-6 ? P[c][o] / soft[o] : C[c][o];
        const col = A[o] > 0 ? C[c][o] * (1 - k) + blurred * k : blurred;
        out[q + c] = col * 255;
      }
      out[q + 3] = a * 255;
    }
  }
  return { w, h: rows, data: out };
}
