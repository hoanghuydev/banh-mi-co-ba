import { test } from "node:test";
import assert from "node:assert/strict";
import { buy, newInventory, takeFull } from "../src/sim/econ";
import { moveStack, stacksOf, useRank } from "../src/sim/stock";

test("kho: ô đứng trước được lấy dùng trước, kéo thả đổi được", () => {
  const inv = newInventory();
  buy(inv, "DO_CHUA_SAN", 1, 1, "NGON");
  buy(inv, "DO_CHUA_SAN", 1, 1, "BAN");
  let st = stacksOf(inv, 1);
  assert.deepEqual(st.map((s) => s.tier), ["NGON", "BAN"]);
  assert.deepEqual(useRank(st, 1), { at: 2, of: 2 });
  assert.equal(takeFull(inv, "dochua", 1, 1)[0].sick, 0);

  moveStack(inv, st, 1, 0);
  st = stacksOf(inv, 1);
  assert.deepEqual(st.map((s) => s.tier), ["BAN", "NGON"]);
  assert.ok(takeFull(inv, "dochua", 1, 1)[0].sick > 0);
});

test("kho: mua thêm cùng mức cùng ngày thì gộp vào ô cũ, giữ chỗ", () => {
  const inv = newInventory();
  buy(inv, "TRUNG", 1, 1);
  buy(inv, "OT", 1, 1);
  buy(inv, "TRUNG", 1, 1);
  assert.equal(inv.lots.length, 2);
  assert.deepEqual(stacksOf(inv, 1).map((s) => s.good), ["TRUNG", "OT"]);
  assert.equal(useRank(stacksOf(inv, 1), 0), null);
});
