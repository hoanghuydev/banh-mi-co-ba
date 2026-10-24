/** Dựng sàn thử bằng lõi ánh sáng: `npx tsx tools/light-core-preview.ts <thư-mục-ra>`; thư mục có sẵn tu.rgba, thung.rgba, gobo.gray, tile.rgb, meta.json. */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { composeFloorLight, dappleOverlay, LIGHT } from "../src/art/light";
import type { Img, LitObject } from "../src/art/light";

const dir = process.argv[2];
if (!dir) throw new Error("thiếu thư mục");
const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8")) as Record<string, [number, number]>;
const bytes = (name: string) => new Uint8ClampedArray(readFileSync(join(dir, name)));

const S = 3.2;
const N = 7;
const OX = 210;
const OY = 100;
const rect = { x: -40, y: 0, w: 500, h: 330 };
const W = Math.ceil(rect.w * S);
const H = Math.ceil(rect.h * S);

const sprite = (name: string): Img => ({ w: meta[name][0], h: meta[name][1], data: bytes(`${name}.rgba`) });
const tile = { w: meta.tile[0], data: bytes("tile.rgb") };

function cellOf(sx: number, sy: number): [number, number] {
  const a = (sx - OX) / (LIGHT.TILE_W / 2);
  const b = (sy - OY) / (LIGHT.TILE_H / 2);
  return [(a + b) / 2, (b - a) / 2];
}
const inside = (sx: number, sy: number) => {
  const [u, v] = cellOf(sx, sy);
  return u >= 0 && u < N && v >= 0 && v < N;
};
const glossAt = (sx: number, sy: number) => (cellOf(sx, sy)[1] < 5 ? 1 : 0);

function tileAt(px: number, py: number, c: number): number {
  const x = Math.min(tile.w - 2, Math.max(0, px));
  const y = Math.min(tile.w - 2, Math.max(0, py));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const g = (xx: number, yy: number) => tile.data[(yy * tile.w + xx) * 3 + c];
  return (g(x0, y0) * (1 - fx) + g(x0 + 1, y0) * fx) * (1 - fy) + (g(x0, y0 + 1) * (1 - fx) + g(x0 + 1, y0 + 1) * fx) * fy;
}

function albedo(u: number, v: number, out: number[]): void {
  const cell = tile.w / 4;
  const iu = Math.floor(u);
  const iv = Math.floor(v);
  const pick = (((iu * 7 + iv * 13) % 4) + 4) % 4;
  for (let c = 0; c < 3; c++) {
    let a = tileAt((1 + (pick % 2) + (u - iu)) * cell, (1 + (pick >> 1) + (v - iv)) * cell, c) / 255;
    a = 1 - (1 - a) * 0.65;
    if (v >= 5) a *= [0.95, 0.62, 0.52][c];
    out[c] = a;
  }
}

const place = (name: string, u: number, v: number, dy: number, fw: number, fh: number, side: number): LitObject => ({
  img: sprite(name),
  imgScale: S,
  footX: OX + ((u - v) * LIGHT.TILE_W) / 2,
  footY: OY + ((u + v) * LIGHT.TILE_H) / 2 + dy,
  side,
  fw,
  fh,
});
const indoor = process.argv[3] === "tiem";
const shadowOpts = indoor ? { shadowK: 0.25, shadowSoft: 2, shadowAlpha: 0.6 } : {};
const objects = [
  place("tu", 2.5, 2.5, 14, 1, 0.9, 0.64),
  place("thung", 4.6, 3.6, 10, 0.62, 0.62, 0.62),
  place("thung", 4.6, 5.6, 10, 0.62, 0.62, 0.62),
].map((o) => ({ ...o, ...shadowOpts }));

const overcast = process.argv[3] === "mua";
const t0 = performance.now();
const out = composeFloorLight({
  rect,
  scale: S,
  objects,
  canopies: [],
  glossAt,
  insideAt: inside,
  overcast,
});
console.log(`compose ${(performance.now() - t0).toFixed(0)} ms, ${W}x${H}`);

const img = new Float32Array(W * H * 3);
const al = [0, 0, 0];
for (let y = 0; y < H; y++) {
  const yy = y / H;
  for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 3;
    const q = (y * W + x) * 4;
    const sx = rect.x + (x + 0.5) / S;
    const sy = rect.y + (y + 0.5) / S;
    if (!inside(sx, sy)) {
      const k = 1.1 - 0.25 * yy;
      img[o] = 0.2 * k;
      img[o + 1] = 0.24 * k;
      img[o + 2] = 0.29 * k;
      continue;
    }
    const [u, v] = cellOf(sx, sy);
    albedo(u, v, al);
    for (let c = 0; c < 3; c++) {
      let col = al[c] * (out.lightmap.data[q + c] / 255);
      const ra = out.reflection.data[q + 3] / 255;
      col = col * (1 - ra) + (out.reflection.data[q + c] / 255) * ra;
      img[o + c] = col;
    }
  }
}

const sorted = [...objects].sort((a, b) => a.footY - b.footY);
for (const obj of sorted) {
  const ov = overcast ? null : dappleOverlay(obj, out.sun, rect, S, obj.shadowK ?? LIGHT.SUN_K);
  const x0 = Math.round((obj.footX - rect.x) * S - obj.img.w / 2);
  const y0 = Math.round((obj.footY - rect.y) * S - obj.img.h);
  for (let y = 0; y < obj.img.h; y++) {
    for (let x = 0; x < obj.img.w; x++) {
      const gx = x0 + x;
      const gy = y0 + y;
      if (gx < 0 || gx >= W || gy < 0 || gy >= H) continue;
      const i = (y * obj.img.w + x) * 4;
      const a = obj.img.data[i + 3] / 255;
      const o = (gy * W + gx) * 3;
      for (let c = 0; c < 3; c++) img[o + c] = img[o + c] * (1 - a) + (obj.img.data[i + c] / 255) * (ov ? ov.data[i + c] / 255 : 1) * a;
    }
  }
}

const tone = [0xf2 / 255, 0xec / 255, 0xe6 / 255];
const raw = new Uint8Array(W * H * 3);
for (let y = 0; y < H; y++) {
  const yv = (y - H / 2) / (H / 2);
  for (let x = 0; x < W; x++) {
    const xx = (x - W / 2) / (W / 2);
    const vg = 1 - 0.1 * Math.min(1.5, xx * xx + yv * yv);
    for (let c = 0; c < 3; c++) {
      const v = img[(y * W + x) * 3 + c] * tone[c] * vg;
      raw[(y * W + x) * 3 + c] = Math.max(0, Math.min(255, v * 255 + 0.5));
    }
  }
}
writeFileSync(join(dir, indoor ? "preview_tiem.rgb" : "preview.rgb"), raw);
writeFileSync(join(dir, "preview.json"), JSON.stringify({ w: W, h: H, S, rect, objects: objects.map((o) => ({ x: o.footX, y: o.footY, w: o.img.w / S, h: o.img.h / S })) }));
