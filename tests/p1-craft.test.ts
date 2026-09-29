import { test } from "node:test";
import assert from "node:assert/strict";
import { COOL_RATE, WARM_OK, cool, isWarm } from "../src/sim/loaf";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { HeadlessStall, POLICIES } from "../src/sim/headless";
import { dishFor } from "../src/sim/order";

test("ổ ra lò nguội sau ~26 s (P1-01 §2.4), mưa nguội nhanh hơn 1,4 lần", () => {
  const tCold = (1 - WARM_OK) / COOL_RATE;
  assert.ok(tCold > 25 && tCold < 27);
  let w = 1;
  for (let i = 0; i < 25 * 30; i++) w = cool(w, 1 / 30);
  assert.ok(isWarm(w), "25 s vẫn còn ấm");
  for (let i = 0; i < 2 * 30; i++) w = cool(w, 1 / 30);
  assert.ok(!isWarm(w), "27 s đã nguội");
  assert.ok(cool(1, 10, "MUA_RAO") < cool(1, 10, "NANG_GAT"));
});

test("đưa ổ nguội: lỗi 'bánh nguội ngắt' được nói ra, không tính là ORDER_DEFECT", () => {
  const bus = new Bus();
  const h = new HeadlessStall(newGame("t", "cold-1"), { ...POLICIES.greedy, workSec: [1e9, 1e9] }, { bus });
  h.run({ until: (x) => x.service.front?.phase === "waiting" });
  const c = h.service.front!;
  const dish = dishFor(c.order!);
  let diff: any = null;
  const stims: string[] = [];
  bus.on("delivery:diffed", (p) => { diff = p; });
  bus.on("stim:emitted", (p) => stims.push(p.stimId));
  h.service.serveDish(dish, { cold: true });
  assert.ok(diff.defects.some((d: any) => d.kind === "WRONG_TEMP"));
  // túi im lặng (7/20) có thể khiến khách không nói — nhưng nếu nói thì là nói chuyện nguội
  if (diff.spoken) assert.equal(diff.spoken.kind, "WRONG_TEMP");
  assert.equal(diff.mode, "DISCOVERED");
  assert.ok(!stims.includes("ORDER_DEFECT"), "ổ đúng đơn mà nguội không phải sai đơn");
});

import { satisfaction, servedVector, tasteOf } from "../src/sim/taste";
import { defaultPresets, presetDish, refillPresets } from "../src/sim/presets";

test("khẩu vị ẩn: ổ đúng gu → ~1; ổ lệch gu (không ớt cho người mê cay) → thấp hơn — nhưng KHÔNG phải lỗi đơn", () => {
  const dung = tasteOf("ANH_DUNG")!;
  const spicy = servedVector(["pate", "thit", "thit", "chalua", "chalua", "dochua", "ot", "ot", "tuongot", "tuongot"], 0.7);
  const bland = servedVector(["pate", "thit", "thit", "chalua", "chalua", "dochua"], 0.7);
  assert.ok(satisfaction(dung, spicy) > satisfaction(dung, bland));
  assert.equal(tasteOf("walkin3"), null);
});

test("preset: 3 cái, đúng số phần; sáng nào cũng chia lại", () => {
  const ps = defaultPresets();
  assert.equal(ps.length, 3);
  assert.equal(presetDish(ps[0]).filter((x) => x === "pate").length, 2);
  ps[0].prepped = 0;
  assert.equal(refillPresets(ps)[0].prepped, 12);
});
