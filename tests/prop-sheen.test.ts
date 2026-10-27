import { test } from "node:test";
import assert from "node:assert/strict";
import { sheenFactor, sheenImage } from "../src/art/light/sheen";
import type { Img } from "../src/art/light/types";


type RGB = [number, number, number];

function rect(img: Img, x0: number, y0: number, x1: number, y1: number, c: RGB) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * img.w + x) * 4;
      img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255;
    }
  }
}

const TEAL: RGB = [44, 94, 95], GREY: RGB = [150, 150, 154], WHITE: RGB = [225, 222, 218], WOOD: RGB = [200, 130, 60];

/** Trái teal, giữa xám, phải trắng, dưới là gỗ. */
function sample(): Img {
  const img: Img = { w: 120, h: 80, data: new Uint8ClampedArray(120 * 80 * 4) };
  rect(img, 0, 0, 40, 50, TEAL);
  rect(img, 40, 0, 80, 50, GREY);
  rect(img, 80, 0, 120, 50, WHITE);
  rect(img, 0, 50, 120, 80, WOOD);
  return img;
}

const alphaAt = (o: Img, x: number, y: number) => o.data[(y * o.w + x) * 4 + 3];

function coverage(o: Img, x0: number, y0: number, x1: number, y1: number) {
  let s = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) s += alphaAt(o, x, y);
  return s / ((x1 - x0) * (y1 - y0) * 255);
}

test("mỗi chất liệu chỉ sáng ở vùng màu của nó", () => {
  const img = sample();
  const teal = sheenImage(img, [{ kind: "glaze", strength: 0.4 }], 1)!;
  assert.ok(coverage(teal, 2, 2, 38, 48) > 0.02);
  assert.equal(coverage(teal, 44, 0, 120, 50), 0);
  assert.equal(coverage(teal, 0, 54, 120, 80), 0);

  const metal = sheenImage(img, [{ kind: "metal", strength: 0.3 }], 1)!;
  assert.ok(coverage(metal, 42, 2, 78, 48) > 0.02);
  assert.equal(coverage(metal, 0, 0, 36, 50), 0);
  assert.equal(coverage(metal, 0, 54, 120, 80), 0);

  const china = sheenImage(img, [{ kind: "porcelain", strength: 0.4 }], 1)!;
  assert.ok(coverage(china, 82, 2, 118, 48) > 0.01);
  assert.equal(coverage(china, 0, 0, 76, 50), 0);
});

test("cường độ không vượt strength và vệt không phủ kín bề mặt", () => {
  const img = sample();
  for (const [kind, strength] of [["glaze", 0.4], ["metal", 0.3], ["porcelain", 0.4]] as const) {
    const o = sheenImage(img, [{ kind, strength }], 1)!;
    let max = 0;
    for (let i = 3; i < o.data.length; i += 4) max = Math.max(max, o.data[i]);
    assert.ok(max <= strength * 255 * 3.1 && max > 0, `${kind} max ${max}`);
    assert.ok(coverage(o, 0, 0, 120, 50) < 0.2, `${kind} phủ quá rộng`);
  }
});

test("vùng đa giác theo phần trăm giới hạn lớp", () => {
  const img = sample();
  const o = sheenImage(img, [{ kind: "glaze", strength: 0.4, region: [[0, 0], [0.15, 0], [0.15, 1], [0, 1]] }], 1)!;
  assert.equal(coverage(o, 20, 0, 120, 80), 0);
  assert.ok(coverage(o, 0, 0, 20, 50) > 0);
});

test("xác định, không vùng thì null, hệ số 0 thì null", () => {
  const img = sample();
  const a = sheenImage(img, [{ kind: "metal", strength: 0.3 }], 1)!;
  const b = sheenImage(img, [{ kind: "metal", strength: 0.3 }], 1)!;
  assert.deepEqual(a.data, b.data);
  const wood: Img = { w: 40, h: 40, data: new Uint8ClampedArray(40 * 40 * 4) };
  rect(wood, 0, 0, 40, 40, WOOD);
  assert.equal(sheenImage(wood, [{ kind: "glaze", strength: 0.4 }], 1), null);
  assert.equal(sheenImage(img, [{ kind: "metal", strength: 0.3 }], 0), null);
});

test("hệ số: bóng nhạt hơn, mưa còn 40%", () => {
  assert.equal(sheenFactor(1, false), 1);
  assert.ok(sheenFactor(0, false) < sheenFactor(1, false));
  assert.ok(Math.abs(sheenFactor(1, true) - 0.4) < 1e-9);
});

/** Hộp cam sáng 40×40 trên nền trong suốt 80×80. */
function box(): Img {
  const img: Img = { w: 80, h: 80, data: new Uint8ClampedArray(80 * 80 * 4) };
  rect(img, 20, 20, 60, 60, [210, 150, 90]);
  return img;
}

test("viền nắng chỉ ở mép phải-trên, không viền mép trái-dưới", () => {
  const o = sheenImage(box(), [], 1, { unit: 180, gain: 1 })!;
  const ne = alphaAt(o, 58, 22), sw = alphaAt(o, 21, 57), mid = alphaAt(o, 40, 40);
  assert.ok(ne > 8, `phải-trên ${ne}`);
  assert.equal(sw, 0);
  assert.equal(mid, 0);
  assert.ok(ne <= 0.4 * 255);
});

test("viền nắng bỏ mặt tối và tắt khi hệ số 0, gain nhỏ thì mờ hơn", () => {
  const dark: Img = { w: 80, h: 80, data: new Uint8ClampedArray(80 * 80 * 4) };
  rect(dark, 20, 20, 60, 60, [30, 30, 40]);
  const d = sheenImage(dark, [], 1, { unit: 180, gain: 1 });
  assert.equal(alphaAt(d!, 58, 22), 0);
  assert.equal(sheenImage(box(), [], 0, { unit: 180, gain: 1 }), null);
  const full = alphaAt(sheenImage(box(), [], 1, { unit: 180, gain: 1 })!, 58, 22);
  const soft = alphaAt(sheenImage(box(), [], 1, { unit: 180, gain: 0.5 })!, 58, 22);
  assert.ok(soft < full);
  assert.equal(sheenImage(box(), [], 1), null);
});

test("viền nắng xác định, nằm trong bề rộng nhoè 0,07 ô", () => {
  const a = sheenImage(box(), [], 1, { unit: 180, gain: 1 })!;
  const b = sheenImage(box(), [], 1, { unit: 180, gain: 1 })!;
  assert.deepEqual(a.data, b.data);
  assert.equal(alphaAt(a, 40, 40), 0);
});
