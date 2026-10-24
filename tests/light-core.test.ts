import { test } from "node:test";
import assert from "node:assert/strict";
import { castShadow, composeFloorLight, dappleOverlay, groundProfile, LIGHT, reflect } from "../src/art/light";
import type { Img, LitObject } from "../src/art/light";

function blank(w: number, h: number): Img {
  return { w, h, data: new Uint8ClampedArray(w * h * 4) };
}

function fillRect(img: Img, x0: number, y0: number, x1: number, y1: number, rgb: [number, number, number] = [180, 120, 80]): void {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * img.w + x) * 4;
      img.data[i] = rgb[0];
      img.data[i + 1] = rgb[1];
      img.data[i + 2] = rgb[2];
      img.data[i + 3] = 255;
    }
  }
}

/** Tủ: chân trái và phải ở rìa, chân trước thấp hơn; feet là điểm đáy ngoài cùng mà đường chạm đất phải đi qua. */
function cabinet(): { img: Img; feet: { x: number; bottom: number }[] } {
  const img = blank(80, 100);
  fillRect(img, 10, 0, 69, 59);
  fillRect(img, 10, 60, 15, 79);
  fillRect(img, 64, 60, 69, 79);
  fillRect(img, 37, 60, 42, 89);
  return { img, feet: [{ x: 10, bottom: 79 }, { x: 69, bottom: 79 }, { x: 40, bottom: 89 }] };
}

function bin(): Img {
  const img = blank(60, 70);
  fillRect(img, 4, 0, 55, 9);
  fillRect(img, 12, 10, 47, 69);
  return img;
}

function firstAlphaRow(img: Img, x: number, from: number): number {
  for (let y = from; y < img.h; y++) if (img.data[(y * img.w + x) * 4 + 3] > 0) return y;
  return -1;
}

test("groundProfile đi qua đáy từng chân tủ và nối thẳng giữa các chân", () => {
  const { img, feet } = cabinet();
  const g = groundProfile(img);
  for (const f of feet) assert.ok(Math.abs(g[f.x] - f.bottom) < 0.5, `chân x=${f.x}: ${g[f.x]} vs ${f.bottom}`);
  assert.ok(g[26] > 79 && g[26] < 89);
});

test("phản chiếu khít đáy chân tủ", () => {
  const { img, feet } = cabinet();
  const r = reflect(img, 0.64, 0.34, 0.07);
  assert.equal(r.w, img.w);
  for (const f of feet) {
    const first = firstAlphaRow(r, f.x, 0);
    assert.equal(first - f.bottom, 1, `chân x=${f.x}: hàng đầu ${first}`);
  }
});

test("thùng có nắp nhô: phản chiếu không nằm trên đường chạm đất và không có thanh dọc ở rìa", () => {
  const img = bin();
  const g = groundProfile(img);
  const r = reflect(img, 0.62, 0.34, 0.07);
  for (let x = 0; x < r.w; x++) {
    for (let y = 0; y <= Math.floor(g[x]); y++) assert.equal(r.data[(y * r.w + x) * 4 + 3], 0, `x=${x} y=${y}`);
  }
  for (const x of [4, 5, 6, 7, 52, 53, 54, 55]) {
    for (let y = 0; y < r.h; y++) assert.equal(r.data[(y * r.w + x) * 4 + 3], 0, `thanh dọc x=${x} y=${y}`);
  }
  assert.ok(firstAlphaRow(r, 30, 0) >= 0);
});

test("castShadow đúng công thức (−2kz, +kz) với điểm chạm đất", () => {
  const img = blank(40, 50);
  fillRect(img, 18, 10, 21, 39);
  const k = LIGHT.SUN_K;
  const s = castShadow(img, k);
  assert.equal(s.padX, Math.floor(2 * k * 50) + 3);
  const z = 30;
  const ix = Math.round(19 - 2 * k * z) + s.padX;
  const iy = Math.round(39 + k * z);
  assert.ok(s.mask[iy * s.w + ix] > 0.9, "điểm đỉnh phải có bóng");
  assert.ok(s.t[iy * s.w + ix] > 0.5, "đỉnh cao thì t lớn");
  const foot = s.t[39 * s.w + 19 + s.padX];
  assert.ok(foot < 0.25, "chân thì t nhỏ");
  assert.equal(s.mask[(s.h - 1) * s.w], 0);
});

function scene(overcast: boolean, glossAt = (_x: number, _y: number) => 1): { input: Parameters<typeof composeFloorLight>[0]; out: ReturnType<typeof composeFloorLight> } {
  const { img } = cabinet();
  const obj: LitObject = { img, imgScale: 2.56, footX: 120, footY: 110, side: 0.64, fw: 1, fh: 0.9 };
  const input = {
    rect: { x: 0, y: 0, w: 240, h: 140 },
    scale: 2,
    objects: [obj],
    canopies: [],
    glossAt,
    insideAt: () => true,
    overcast,
  };
  return { input, out: composeFloorLight(input) };
}

test("mưa: lightmap không có bóng nắng, nắng bằng 0, vẫn có AO", () => {
  const { out } = scene(true);
  assert.ok(out.sun.data.every((v) => v === 0));
  const at = (x: number, y: number) => out.lightmap.data[(y * out.lightmap.w + x) * 4];
  const far = at(10, 10);
  assert.ok(Math.abs(far - LIGHT.AMB[0] * 255) < 1.5);
  let min = 255;
  for (let x = 0; x < out.lightmap.w; x++) min = Math.min(min, at(x, 215));
  assert.ok(min < far - 10, "AO sát chân");
});

test("nắng: bóng đổ làm tối lightmap về dưới-trái chân", () => {
  const { out } = scene(false);
  let darkest = 255;
  for (let i = 0; i < out.lightmap.w * out.lightmap.h; i++) darkest = Math.min(darkest, out.lightmap.data[i * 4]);
  assert.ok(darkest < LIGHT.AMB[0] * 255 * (1 - LIGHT.CAST_AMB_CUT * 0.5));
});

test("phản chiếu bằng 0 trên điểm có glossAt = 0", () => {
  const { out } = scene(false, (x) => (x < 120 ? 0 : 1));
  const r = out.reflection;
  let left = 0;
  let right = 0;
  for (let y = 0; y < r.h; y++) {
    for (let x = 0; x < r.w; x++) {
      const a = r.data[(y * r.w + x) * 4 + 3];
      if (x / 2 < 120) left += a;
      else right += a;
    }
  }
  assert.equal(left, 0);
  assert.ok(right > 0);
});

test("dựng xác định và đủ nhanh", () => {
  const t0 = performance.now();
  const a = scene(false).out;
  const ms = performance.now() - t0;
  const b = scene(false).out;
  assert.deepEqual(a.lightmap.data, b.lightmap.data);
  assert.deepEqual(a.reflection.data, b.reflection.data);
  assert.ok(ms < 3000, `${ms} ms`);
});

test("đốm lá lên vật: cùng khung và cùng alpha với ảnh gốc", () => {
  const { input, out } = scene(false);
  const o = dappleOverlay(input.objects[0], out.sun, input.rect, input.scale, LIGHT.SUN_K);
  assert.equal(o.w, input.objects[0].img.w);
  for (let i = 0; i < o.w * o.h; i++) assert.equal(o.data[i * 4 + 3], input.objects[0].img.data[i * 4 + 3]);
});

function leafScene(strength: number, objects: LitObject[], gray = 0) {
  const img = { w: 8, h: 8, data: new Uint8ClampedArray(64).fill(gray) };
  return composeFloorLight({
    rect: { x: 0, y: 0, w: 240, h: 140 },
    scale: 2,
    objects,
    canopies: [{ img, x: -20, y: -20, w: 80, h: 80 }],
    glossAt: () => 1,
    insideAt: () => true,
    overcast: false,
    leafStrengthAt: () => strength,
  });
}

test("cường độ lá 0: nắng đầy; cường độ 1 với ảnh bóng đen: gần như che hết; ảnh trắng: không che", () => {
  const none = leafScene(0, []);
  assert.ok(none.sun.data.every((v) => v === 1));
  const clear = leafScene(1, [], 255);
  assert.ok(clear.sun.data.every((v) => v === 1));
  const full = leafScene(1, []);
  let shaded = 0;
  for (const v of full.sun.data) if (v < 0.5) shaded++;
  assert.ok(shaded / full.sun.data.length > 0.95, `tỉ lệ che ${shaded / full.sun.data.length}`);
});

test("cường độ lá 0: sun chỉ phụ thuộc bóng vật", () => {
  const { img } = cabinet();
  const obj: LitObject = { img, imgScale: 2.56, footX: 120, footY: 110, side: 0.64, fw: 1, fh: 0.9 };
  const out = leafScene(0, [obj]);
  let lo = 1;
  for (const v of out.sun.data) lo = Math.min(lo, v);
  assert.ok(lo < 0.6 && lo >= 0);
  assert.ok(out.sun.data.some((v) => v === 1));
});

function shadowScene(extra: Partial<LitObject>) {
  const img = blank(40, 60);
  fillRect(img, 10, 0, 29, 59);
  const obj: LitObject = { img, imgScale: 2, footX: 100, footY: 90, side: 0.6, fw: 0.5, fh: 0.5, ...extra };
  return composeFloorLight({
    rect: { x: 0, y: 0, w: 200, h: 120 },
    scale: 2,
    objects: [obj],
    canopies: [],
    glossAt: () => 0,
    insideAt: () => true,
    overcast: false,
  });
}

function shadowStats(out: ReturnType<typeof composeFloorLight>) {
  let minX = Infinity;
  let darkest = 1;
  for (let y = 0; y < out.sun.h; y++) {
    for (let x = 0; x < out.sun.w; x++) {
      const v = out.sun.data[y * out.sun.w + x];
      if (v < 0.5 && x < minX) minX = x;
      if (v < darkest) darkest = v;
    }
  }
  return { minX, darkest };
}

test("shadowK ngắn hơn thì bóng ngắn đúng tỉ lệ", () => {
  const long = shadowStats(shadowScene({ shadowK: 0.45 }));
  const short = shadowStats(shadowScene({ shadowK: 0.25 }));
  const footLeft = 190;
  const lenLong = footLeft - long.minX;
  const lenShort = footLeft - short.minX;
  assert.ok(lenShort < lenLong);
  assert.ok(Math.abs(lenShort / lenLong - 0.25 / 0.45) < 0.15, `${lenShort}/${lenLong}`);
});

test("shadowAlpha 0,5 làm bóng nhạt một nửa", () => {
  const full = 1 - shadowStats(shadowScene({})).darkest;
  const half = 1 - shadowStats(shadowScene({ shadowAlpha: 0.5 })).darkest;
  assert.ok(Math.abs(half / full - 0.5) < 0.05, `${half}/${full}`);
});
