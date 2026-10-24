import type { Img } from "./types";

export function smooth(x: number): number {
  const t = x < 0 ? 0 : x > 1 ? 1 : x;
  return t * t * (3 - 2 * t);
}

function boxPass(src: Float32Array, dst: Float32Array, w: number, h: number, r: number, horizontal: boolean): void {
  const len = horizontal ? w : h;
  const lines = horizontal ? h : w;
  const step = horizontal ? 1 : w;
  const lineStep = horizontal ? w : 1;
  const inv = 1 / (2 * r + 1);
  for (let l = 0; l < lines; l++) {
    const base = l * lineStep;
    let sum = 0;
    for (let i = 0; i < r && i < len; i++) sum += src[base + i * step];
    for (let i = 0; i < len; i++) {
      const add = i + r;
      if (add < len) sum += src[base + add * step];
      const sub = i - r - 1;
      if (sub >= 0) sum -= src[base + sub * step];
      dst[base + i * step] = sum * inv;
    }
  }
}

/** Làm mờ gần gauss bằng 3 lượt box tách trục; ngoài ảnh coi là 0. */
export function blur(a: Float32Array, w: number, h: number, sigma: number): void {
  if (sigma < 0.4) return;
  const r = Math.max(1, Math.round((Math.sqrt(4 * sigma * sigma + 1) - 1) / 2));
  const tmp = new Float32Array(a.length);
  for (let i = 0; i < 3; i++) {
    boxPass(a, tmp, w, h, r, true);
    boxPass(tmp, a, w, h, r, false);
  }
}

/** Lấy mẫu song tuyến, kẹp mép. */
export function bilinear(a: Float32Array, w: number, h: number, x: number, y: number): number {
  const fx = x < 0 ? 0 : x > w - 1 ? w - 1 : x;
  const fy = y < 0 ? 0 : y > h - 1 ? h - 1 : y;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = x0 + 1 < w ? x0 + 1 : x0;
  const y1 = y0 + 1 < h ? y0 + 1 : y0;
  const tx = fx - x0;
  const ty = fy - y0;
  const top = a[y0 * w + x0] * (1 - tx) + a[y0 * w + x1] * tx;
  const bot = a[y1 * w + x0] * (1 - tx) + a[y1 * w + x1] * tx;
  return top * (1 - ty) + bot * ty;
}

/** Đổi cỡ ảnh theo hệ số f, nội suy song tuyến có nhân alpha. */
export function resizeImg(img: Img, f: number): Img {
  if (Math.abs(f - 1) < 1e-3) return img;
  const nw = Math.max(1, Math.round(img.w * f));
  const nh = Math.max(1, Math.round(img.h * f));
  const out = new Uint8ClampedArray(nw * nh * 4);
  const d = img.data;
  const rx = img.w / nw;
  const ry = img.h / nh;
  for (let y = 0; y < nh; y++) {
    const sy = Math.min(img.h - 1, Math.max(0, (y + 0.5) * ry - 0.5));
    const y0 = Math.floor(sy);
    const y1 = Math.min(img.h - 1, y0 + 1);
    const ty = sy - y0;
    for (let x = 0; x < nw; x++) {
      const sx = Math.min(img.w - 1, Math.max(0, (x + 0.5) * rx - 0.5));
      const x0 = Math.floor(sx);
      const x1 = Math.min(img.w - 1, x0 + 1);
      const tx = sx - x0;
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let k = 0; k < 4; k++) {
        const px = k & 1 ? x1 : x0;
        const py = k & 2 ? y1 : y0;
        const wgt = (k & 1 ? tx : 1 - tx) * (k & 2 ? ty : 1 - ty);
        const i = (py * img.w + px) * 4;
        const wa = wgt * d[i + 3];
        r += d[i] * wa;
        g += d[i + 1] * wa;
        b += d[i + 2] * wa;
        a += wa;
      }
      const o = (y * nw + x) * 4;
      if (a > 1e-6) {
        out[o] = r / a;
        out[o + 1] = g / a;
        out[o + 2] = b / a;
      }
      out[o + 3] = a;
    }
  }
  return { w: nw, h: nh, data: out };
}

/** Điền lưới W×H từ hàm `fn` gọi thưa: ô step×step có 4 góc cùng giá trị thì điền thẳng, còn lại gọi từng điểm ảnh. */
export function fillCoarse(
  out: Uint8Array | Float32Array,
  W: number,
  H: number,
  step: number,
  fn: (px: number, py: number) => number,
): void {
  const nx = Math.ceil(W / step) + 1;
  const ny = Math.ceil(H / step) + 1;
  const nodes = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) nodes[j * nx + i] = fn(i * step + 0.5, j * step + 0.5);
  for (let j = 0; j < ny - 1; j++) {
    const y0 = j * step;
    const y1 = Math.min(H, y0 + step);
    if (y0 >= H) break;
    for (let i = 0; i < nx - 1; i++) {
      const x0 = i * step;
      const x1 = Math.min(W, x0 + step);
      if (x0 >= W) break;
      const v = nodes[j * nx + i];
      if (v === nodes[j * nx + i + 1] && v === nodes[(j + 1) * nx + i] && v === nodes[(j + 1) * nx + i + 1]) {
        for (let y = y0; y < y1; y++) out.fill(v, y * W + x0, y * W + x1);
      } else {
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) out[y * W + x] = fn(x + 0.5, y + 0.5);
      }
    }
  }
}
