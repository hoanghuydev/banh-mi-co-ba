import { test } from "node:test";
import assert from "node:assert/strict";
import { makeChange } from "../src/sim/till";

test("tiền lẻ: đủ thì thối; thiếu ≤ 5k thì bớt cho khách; thiếu nhiều thì chạy qua cô Mai", () => {
  const f = { floatLeft: 30_000 };
  assert.ok(makeChange(25_000, f, 0.5).ok);                           // đưa 30k, thối 5k
  const g = { floatLeft: 2_000 };
  const r = makeChange(25_000, g, 0.5);
  assert.ok(!r.ok && r.roundedDown === 3_000);
  const h = { floatLeft: 0 };
  const r2 = makeChange(25_000, h, 0.9);                               // đưa 50k
  assert.ok(!r2.ok && r2.ranToCoMai);
});
