import type { Img } from "./types";

/** Chất liệu bề mặt; mỗi loại có cách chọn vùng theo màu và kiểu highlight riêng. */
export type SheenKind = "metal" | "glaze" | "porcelain" | "enamel" | "glass";

/** Đa giác theo phần trăm (0–1) khung đục của sprite. */
export type SheenRegion = readonly (readonly [number, number])[];

export type SheenLayer = { kind: SheenKind; strength: number; region?: SheenRegion };

type RGB = readonly [number, number, number];

const COOL: RGB = [0.9, 0.95, 1];
const WARM: RGB = [1, 0.95, 0.86];
const WHITE: RGB = [1, 0.98, 0.94];

const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function hsv(r: number, g: number, b: number) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d > 0) {
    if (mx === r) h = ((g - b) / d + 6) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  return { h: h * 60, s: mx === 0 ? 0 : d / mx, v: mx / 255 };
}

/** Độ thuộc về chất liệu theo màu điểm ảnh, 0–1 mượt. */
function membership(kind: SheenKind, r: number, g: number, b: number): number {
  const { h, s, v } = hsv(r, g, b);
  switch (kind) {
    case "glaze":
      return sstep(150, 165, h) * (1 - sstep(200, 215, h)) * sstep(0.22, 0.34, s) * sstep(0.1, 0.2, v) * (1 - sstep(0.55, 0.68, v));
    case "metal":
      return (1 - sstep(0.15, 0.22, s)) * sstep(0.12, 0.22, v) * (1 - sstep(0.9, 0.97, v));
    case "porcelain":
    case "enamel":
      return (1 - sstep(0.07, 0.12, s)) * sstep(0.58, 0.68, v);
    case "glass":
      return sstep(180, 195, h) * (1 - sstep(230, 245, h)) * sstep(0.16, 0.26, s) * sstep(0.4, 0.5, v);
  }
}

function inPoly(poly: SheenRegion, u: number, v: number) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > v !== yj > v && u < ((xj - xi) * (v - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function blur3(src: Float32Array, w: number, h: number) {
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          s += src[yy * w + xx];
          n++;
        }
      }
      out[y * w + x] = s / n;
    }
  }
  return out;
}

/** Hệ số cường độ: nắng đầy = 1, trong bóng còn 0,35, mưa còn 40%. */
export function sheenFactor(sun: number, overcast: boolean) {
  const s = Math.min(1, Math.max(0, sun));
  return (0.35 + 0.65 * s) * (overcast ? 0.4 : 1);
}

/** Dải sáng mềm: lõi rộng `hw`, mép mờ `f`. */
const pulse = (t: number, c: number, hw: number, f: number) => {
  const d = Math.abs(t - c);
  return 1 - sstep(hw, hw + f, d);
};

const gauss = (du: number, dv: number, su: number, sv: number) => Math.exp(-0.5 * ((du / su) ** 2 + (dv / sv) ** 2));

type Box = { x0: number; y0: number; w: number; h: number };

function boxOf(w: number, h: number, hit: (i: number) => boolean): Box | null {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!hit(y * w + x)) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? null : { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Khoảng cách tới mép vùng theo hướng pháp tuyến, trong `reach` bước; 0 nếu không có mép. */
function edgeGlow(m: Float32Array, w: number, h: number, x: number, y: number, nx: number, ny: number, reach: number) {
  for (let k = 1; k <= reach; k++) {
    const px = Math.round(x + nx * k), py = Math.round(y + ny * k);
    if (px < 0 || py < 0 || px >= w || py >= h || m[py * w + px] < 0.35) return (1 - (k - 1) / reach) ** 1.6;
  }
  return 0;
}

/** `unit`: px texture của một ô sàn; `gain`: kim loại và men nhận nhiều, vải và nhựa ít. */
export type RimSpec = { unit: number; gain: number };

const RIM_GLOW: RGB = [1, 0.831, 0.58];
const RIM_LINE: RGB = [1, 0.941, 0.776];
const RIM_DIRS = [
  { dx: 1, dy: -1, len: Math.SQRT2, weight: 0.5 },
  { dx: 1, dy: -2, len: Math.sqrt(5), weight: 0.25 },
  { dx: 2, dy: -1, len: Math.sqrt(5), weight: 0.25 },
] as const;

/** Viền sáng ấm ở mép đục kề vùng trong suốt phía phải-trên, bỏ phần tối; không viền mép hướng khác. */
function paintRim(acc: Float32Array, img: Img, rim: RimSpec, factor: number) {
  const { w, h, data } = img;
  const glowReach = 0.1 * rim.unit, lineReach = 0.045 * rim.unit;
  const maxSteps = Math.ceil(glowReach / 1.4) + 1;
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && data[(y * w + x) * 4 + 3] >= 90;

  const glow = new Float32Array(w * h), line = new Float32Array(w * h);
  for (const { dx, dy, len, weight } of RIM_DIRS) {
    const steps = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!solid(x, y)) continue;
        const nx = x + dx, ny = y + dy;
        steps[i] = !solid(nx, ny) ? 1 : Math.min(maxSteps, steps[ny * w + nx] + 1);
      }
    }
    for (let i = 0; i < w * h; i++) {
      if (steps[i] === 0) continue;
      const d = steps[i] * len;
      if (d < glowReach) glow[i] += weight * (1 - d / glowReach) ** 2;
      if (d < lineReach) line[i] += weight * (1 - d / lineReach);
    }
  }

  const k = rim.gain * factor;
  for (let i = 0; i < w * h; i++) {
    if (glow[i] === 0 && line[i] === 0) continue;
    const o = i * 4;
    const lit = sstep(0.28, 0.55, Math.max(data[o], data[o + 1], data[o + 2]) / 255) * (data[o + 3] / 255);
    const a1 = 0.34 * glow[i] * lit * k, a2 = 0.22 * line[i] * lit * k;
    acc[o] += RIM_GLOW[0] * a1 + RIM_LINE[0] * a2;
    acc[o + 1] += RIM_GLOW[1] * a1 + RIM_LINE[1] * a2;
    acc[o + 2] += RIM_GLOW[2] * a1 + RIM_LINE[2] * a2;
    acc[o + 3] += a1 + a2;
  }
}

const NE: readonly [number, number] = [0.447, -0.894];
const NW: readonly [number, number] = [-0.447, -0.894];

/**
 * Lớp bóng bề mặt cho sprite: ảnh cùng khung, rgb là màu sáng, alpha là cường độ; dùng với blend SCREEN.
 * `rim` thêm viền nắng ấm ở mép hướng phải-trên của mọi sprite; trả null khi không có gì để vẽ.
 */
export function sheenImage(img: Img, layers: readonly SheenLayer[], factor: number, rim?: RimSpec): Img | null {
  const { w, h, data } = img;
  const opaque = boxOf(w, h, (i) => data[i * 4 + 3] > 8);
  if (!opaque || factor <= 0) return null;
  const acc = new Float32Array(w * h * 4);
  let any = false;

  for (const layer of layers) {
    let m = new Float32Array(w * h);
    for (let y = opaque.y0; y < opaque.y0 + opaque.h; y++) {
      for (let x = opaque.x0; x < opaque.x0 + opaque.w; x++) {
        const o = (y * w + x) * 4;
        const a = data[o + 3] / 255;
        if (a < 0.03) continue;
        if (layer.region && !inPoly(layer.region, (x - opaque.x0) / opaque.w, (y - opaque.y0) / opaque.h)) continue;
        m[y * w + x] = membership(layer.kind, data[o], data[o + 1], data[o + 2]) * a;
      }
    }
    m = blur3(m, w, h);
    const box = boxOf(w, h, (i) => m[i] > 0.5);
    if (!box || box.w * box.h < 0.002 * opaque.w * opaque.h) continue;
    any = true;
    paint(acc, m, w, h, box, layer, factor);
  }
  if (rim && rim.gain > 0) {
    paintRim(acc, img, rim, factor);
    any = true;
  }
  if (!any) return null;

  const out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const a = Math.min(1, acc[i * 4 + 3]);
    if (a <= 0.004) continue;
    const s = acc[i * 4 + 3];
    out[i * 4] = (acc[i * 4] / s) * 255;
    out[i * 4 + 1] = (acc[i * 4 + 1] / s) * 255;
    out[i * 4 + 2] = (acc[i * 4 + 2] / s) * 255;
    out[i * 4 + 3] = a * 255;
  }
  return { w, h, data: out };
}

function paint(acc: Float32Array, m: Float32Array, w: number, h: number, box: Box, layer: SheenLayer, factor: number) {
  const { kind } = layer;
  const k = layer.strength * factor;
  const reach = Math.max(2, Math.round(0.022 * box.w));
  const sigma = Math.max(1.2, 0.012 * box.w);

  let spot: { x: number; y: number } | null = null;
  if (kind === "porcelain") {
    let best = -Infinity;
    for (let y = box.y0; y < box.y0 + box.h; y++) {
      for (let x = box.x0; x < box.x0 + box.w; x++) {
        if (m[y * w + x] < 0.7) continue;
        const score = (x - box.x0) / box.w - 0.8 * ((y - box.y0) / box.h);
        if (score > best) { best = score; spot = { x, y }; }
      }
    }
    if (spot) spot = { x: spot.x - 0.035 * box.w, y: spot.y + 0.05 * box.h };
  }

  for (let y = box.y0; y < box.y0 + box.h; y++) {
    for (let x = box.x0; x < box.x0 + box.w; x++) {
      const i = y * w + x;
      const mem = m[i];
      if (mem < 0.02) continue;
      const u = (x - box.x0) / box.w, v = (y - box.y0) / box.h;
      const rim = Math.max(edgeGlow(m, w, h, x, y, NE[0], NE[1], reach), 0.4 * edgeGlow(m, w, h, x, y, NW[0], NW[1], reach));
      let amp = 0;
      let col: RGB = WHITE;
      const top = 0.62 + 0.38 * (1 - v);

      if (kind === "glaze") {
        const t = (u + 0.4 * v) / 1.4;
        const band = pulse(t, 0.45, 0.12, 0.14);
        amp = band * top * 0.8 + rim * 0.9;
        col = [0.86, 0.97, 1];
      } else if (kind === "metal") {
        const t = (u + 0.25 * v) / 1.25;
        const band = 1.0 * pulse(t, 0.62, 0.03, 0.05) + 0.4 * pulse(t, 0.36, 0.1, 0.12);
        const env = 0.2 * (0.35 + 0.65 * (1 - v) ** 1.2);
        amp = band * top * 1.1 + env + rim * 1.4;
        const mix = Math.min(1, v * 1.2);
        col = [COOL[0] + (WARM[0] - COOL[0]) * mix, COOL[1] + (WARM[1] - COOL[1]) * mix, COOL[2] + (WARM[2] - COOL[2]) * mix];
      } else if (kind === "porcelain") {
        amp = 0.8 * gauss(u - 0.72, v - 0.32, 0.22, 0.2) + rim * 2.2;
        if (spot) amp += 3 * gauss((x - spot.x) / box.w, (y - spot.y) / box.w, sigma / box.w, sigma / box.w);
      } else if (kind === "enamel") {
        const t = (u + 0.1 * v) / 1.1;
        amp = 0.6 * pulse(t, 0.3, 0.05, 0.06) + 0.35 * gauss(u - 0.6, v - 0.3, 0.3, 0.25) + rim * 0.6;
      } else {
        const t = (u + 0.15 * v) / 1.15;
        amp = pulse(t, 0.34, 0.04, 0.05) * (0.5 + 0.5 * (1 - v)) + rim * 0.8;
        col = [0.9, 0.97, 1];
      }

      const a = Math.min(1, amp) * k * mem;
      if (a <= 0) continue;
      acc[i * 4] += col[0] * a;
      acc[i * 4 + 1] += col[1] * a;
      acc[i * 4 + 2] += col[2] * a;
      acc[i * 4 + 3] += a;
    }
  }
}
