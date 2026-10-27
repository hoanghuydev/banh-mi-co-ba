import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyMatrix, approach, bakeLayout, reflectAlpha, shadowAlpha, shadowMatrix, tintForSun, TINT_SHADE,
} from "../src/art/light/actor";

const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test("ma trận bóng giữ điểm chân, đẩy điểm cao về dưới-trái theo (−2K, +K)", () => {
  const K = 0.45, yF = 100;
  assert.deepEqual(applyMatrix(shadowMatrix(K, yF), 30, yF), [30, yF]);
  const [x, y] = applyMatrix(shadowMatrix(K, yF), 30, yF - 40);
  near(x, 30 - 2 * K * 40);
  near(y, yF + K * 40);
});

test("trong bóng thì nhạt, mưa thì không có bóng nắng", () => {
  assert.equal(shadowAlpha(0, false), 0);
  assert.ok(shadowAlpha(1, false) > shadowAlpha(0.4, false));
  assert.equal(shadowAlpha(1, true), 0);
});

test("phản chiếu theo độ bóng sàn, nhám ẩn, mưa tắt", () => {
  assert.equal(reflectAlpha(0, false), 0);
  assert.equal(reflectAlpha(1, false), 1);
  assert.equal(reflectAlpha(1, true), 0);
});

test("nhuộm từ xanh bóng tới trắng", () => {
  assert.equal(tintForSun(0), TINT_SHADE);
  assert.equal(tintForSun(1), 0xffffff);
  assert.equal(tintForSun(5), 0xffffff);
});

test("làm mượt tiến về đích mà không vượt", () => {
  const a = approach(0, 1, 0.1);
  assert.ok(a > 0 && a < 1);
  assert.equal(approach(0, 1, 0), 0);
});

test("khung bóng chứa trọn đuôi bóng", () => {
  const L = bakeLayout(100, 200, 180, 0.45, 0.9, 4, 0.5);
  assert.ok(L.padL >= Math.ceil(0.9 * 180));
  assert.ok(L.ch >= Math.ceil((180 + 0.45 * 180) * 0.5));
  assert.ok(L.ox > 0 && L.ox < 1);
});
