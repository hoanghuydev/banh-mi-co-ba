import { test } from "node:test";
import assert from "node:assert/strict";
import { sunAt } from "../src/world/daylight";

test("vạt nắng dịch dần từ sáng đến trưa", () => {
  const s = [6, 7, 8, 9, 10, 11].map((h) => sunAt(h * 60).patchShift);
  for (let i = 1; i < s.length; i++) assert.ok(s[i] >= s[i - 1]);
});
