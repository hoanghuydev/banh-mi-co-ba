import { test } from "node:test";
import assert from "node:assert/strict";
import { sunAt } from "../src/world/daylight";

test("bóng ngắn dần từ sáng đến trưa, không bao giờ dưới 1", () => {
  const s = [6, 7, 8, 9, 10, 11].map((h) => sunAt(h * 60).stretch);
  for (let i = 1; i < s.length; i++) assert.ok(s[i] <= s[i - 1]);
  assert.ok(Math.min(...s) >= 1);
});

test("hướng bóng là vector đơn vị", () => {
  for (const h of [6, 8.5, 11]) {
    const { dirX, dirY } = sunAt(h * 60);
    assert.ok(Math.abs(Math.hypot(dirX, dirY) - 1) < 1e-9);
  }
});
