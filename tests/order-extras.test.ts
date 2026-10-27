import { test } from "node:test";
import assert from "node:assert/strict";
import { dishFor, extraPortions, extrasOf, labelOf, monVi, sayOrder, specOf, type Ingredient } from "../src/sim/order";
import { MENU_IDS, nhanOf } from "../src/sim/menu";

const opla = specOf({ mon: "opla", rau: "day-du", ot: 1, tuong: 1 });
const say = (extra: Ingredient[]) => monVi(extrasOf(opla, [...dishFor(opla), ...extra]).map(labelOf));

test("monVi kể đủ 0, 1, 2, 3+ món", () => {
  assert.equal(monVi([]), "");
  assert.equal(monVi(["ớt"]), "ớt");
  assert.equal(monVi(["trứng ốp la", "ớt"]), "trứng ốp la với ớt");
  assert.equal(monVi(["pate", "trứng ốp la", "ớt"]), "pate, trứng ốp la với ớt");
  assert.equal(monVi(["a", "b", "c", "d"]), "a, b, c với d");
});

test("câu cho thêm kể cả nhân lẫn đồ dễ thương", () => {
  assert.equal(say([]), "");
  assert.equal(say(["ot"]), "ớt");
  assert.equal(say(["opla", "ot"]), "trứng ốp la với ớt");
  assert.equal(say(["ot", "opla", "dochua"]), "trứng ốp la, đồ chua với ớt");
  assert.equal(say(["pate", "opla", "ot", "tuongot"]), "pate, trứng ốp la, ớt với tương ớt");
});

test("chỉ đồ dễ thương mới tính là cho thêm", () => {
  assert.deepEqual(extraPortions(opla, [...dishFor(opla), "opla", "ot"]), ["ot"]);
  assert.deepEqual(extraPortions(opla, [...dishFor(opla), "opla"]), []);
});

test("câu gọi món nói đủ mọi lời dặn", () => {
  for (const mon of MENU_IDS) for (const nhieu of [undefined, ...nhanOf(mon)])
    for (const rau of ["day-du", "it", "khong"] as const) for (const ot of [0, 1, 2] as const) for (const tuong of [0, 1, 2] as const) {
      const line = sayOrder(specOf({ mon, nhieu, rau, ot, tuong }));
      if (nhanOf(mon).length === 0) continue;
      if (nhieu) assert.ok(line.includes(`nhiều ${labelOf(nhieu)}`), line);
      assert.equal(line.includes("nhiều ớt"), ot === 2, line);
      assert.equal(line.includes("không ớt"), ot === 0, line);
      assert.equal(line.includes("nhiều tương"), tuong === 2, line);
      assert.equal(line.includes("không tương"), tuong === 0, line);
    }
});
