import type { Img } from "./types";

/** Đường chạm đất theo cột: bao lõm trên của các đáy, bỏ đoạn dốc > 0,9 và kéo dài theo độ dốc ở rìa. */
export function groundProfile(img: Img): Float32Array {
  const { w, h, data } = img;
  const raw = new Float32Array(w).fill(-1e6);
  const cols: number[] = [];
  for (let x = 0; x < w; x++) {
    for (let y = h - 1; y >= 0; y--) {
      if (data[(y * w + x) * 4 + 3] > 128) {
        raw[x] = y;
        cols.push(x);
        break;
      }
    }
  }
  const g = new Float32Array(w);
  if (cols.length === 0) return g.fill(h - 1);

  const hx: number[] = [];
  const hy: number[] = [];
  for (const x of cols) {
    const py = raw[x];
    while (hx.length >= 2) {
      const n = hx.length;
      const cross = (hx[n - 1] - hx[n - 2]) * (py - hy[n - 2]) - (hy[n - 1] - hy[n - 2]) * (x - hx[n - 2]);
      if (cross >= 0) {
        hx.pop();
        hy.pop();
      } else break;
    }
    hx.push(x);
    hy.push(py);
  }
  let seg = 0;
  for (let x = 0; x < w; x++) {
    while (seg < hx.length - 2 && x > hx[seg + 1]) seg++;
    if (hx.length === 1 || x <= hx[0]) g[x] = hy[0];
    else if (x >= hx[hx.length - 1]) g[x] = hy[hy.length - 1];
    else {
      const t = (x - hx[seg]) / (hx[seg + 1] - hx[seg]);
      g[x] = hy[seg] + (hy[seg + 1] - hy[seg]) * t;
    }
  }

  const has = (x: number) => raw[x] > -1e5;
  let lo = -1;
  let hi = -1;
  for (let x = 0; x < w; x++) {
    if (!has(x)) continue;
    const grad = x === 0 ? g[1] - g[0] : x === w - 1 ? g[x] - g[x - 1] : (g[x + 1] - g[x - 1]) / 2;
    if (Math.abs(grad) < 0.9 && raw[x] >= g[x] - 3) {
      if (lo < 0) lo = x;
      hi = x;
    }
  }
  if (lo < 0) {
    const out = new Float32Array(w);
    for (let i = 0; i < w; i++) {
      let best = -1e9;
      for (const j of cols) best = Math.max(best, raw[j] - 0.5 * Math.abs(i - j));
      out[i] = best;
    }
    return out;
  }
  const span = Math.max(4, Math.min(12, (hi - lo) >> 1));
  const slL = (g[Math.min(w - 1, lo + span)] - g[lo]) / span;
  const slR = (g[hi] - g[Math.max(0, hi - span)]) / span;
  const gl = g[lo];
  const gr = g[hi];
  for (let x = 0; x < w; x++) {
    if (x < lo) g[x] = gl + slL * (x - lo);
    else if (x > hi) g[x] = gr + slR * (x - hi);
  }
  return g;
}
