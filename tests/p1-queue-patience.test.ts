/** Hệ số sức chờ theo chỗ xếp hàng: các con số là hợp đồng cảm giác giờ cao điểm, đổi phải có chủ ý. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { queuePatienceMul } from "../src/sim/service";

test("người đầu hàng KHÔNG được cộng gì", () => {
  assert.equal(queuePatienceMul(0), 1);
});

test("mỗi người đứng trước cộng đều 15%, cộng tuyến tính chứ không nhân dồn", () => {
  assert.ok(Math.abs(queuePatienceMul(1) - 1.15) < 1e-9);
  assert.ok(Math.abs(queuePatienceMul(2) - 1.30) < 1e-9);
  assert.ok(Math.abs(queuePatienceMul(3) - 1.45) < 1e-9);
  // 1,15^3 = 1,52 — nếu ai đó đổi sang nhân dồn thì chỗ này vỡ.
  assert.ok(queuePatienceMul(3) < 1.15 ** 3);
});

test("chặn ở bậc thứ tư: hàng tám người không làm người cuối chờ được mãi", () => {
  const cap = queuePatienceMul(4);
  assert.ok(Math.abs(cap - 1.6) < 1e-9);
  for (const ahead of [5, 8, 20, 100]) assert.equal(queuePatienceMul(ahead), cap);
});

test("đơn điệu không giảm — xếp sau không bao giờ THIỆT hơn xếp trước", () => {
  for (let n = 1; n <= 12; n++) assert.ok(queuePatienceMul(n) >= queuePatienceMul(n - 1));
});

test("hệ số chỉ NHÂN, nên người vội vẫn vội hơn người điềm đạm", () => {
  // chú Kiệt 28 s xếp cuối vẫn phải sốt ruột sớm hơn bà Sáu 90 s đứng đầu hàng.
  assert.ok(28 * queuePatienceMul(4) < 90 * queuePatienceMul(0));
});
