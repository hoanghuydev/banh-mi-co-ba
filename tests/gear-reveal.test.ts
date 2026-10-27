import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { EQUIP, EQUIP_IDS, type EquipId } from "../src/sim/equipment";
import { BUYABLE_TILES } from "../src/world/map";
import { ROOT, read } from "../tools/lib";

test("món có ô trên bản đồ thì thẻ ra mắt có lợi ích kèm số", () => {
  for (const id of new Set(Object.values(BUYABLE_TILES)) as Set<EquipId>) {
    assert.ok(EQUIP[id], `${id} trong BUYABLE_TILES không có trong equipment.json`);
    assert.ok(EQUIP[id].gain.length > 0, `${id}: gain rỗng, thẻ ra mắt chỉ còn cái tên`);
    assert.ok(EQUIP[id].gain.some((g) => /\d/.test(g)), `${id}: gain không có con số nào`);
  }
});

test("món có hình rời trong cảnh (addGear) cũng phải có gain", () => {
  const src = read(join(ROOT, "src/scenes/StallScene.ts"));
  const ids = new Set([...src.matchAll(/\b(?:addGear|addMounted)\("([A-Z_]+)"|\}, (?:\w+ \? )?"([A-Z_]+)"(?: : null)?\);/g)]
    .map((m) => m[1] ?? m[2]));
  assert.ok(ids.size >= 5, `chỉ dò ra ${ids.size} món, regex có lẽ đã lệch với code`);
  for (const id of ids) {
    assert.ok(EQUIP_IDS.includes(id as EquipId), `${id} không phải mã đồ nghề`);
    assert.ok(EQUIP[id as EquipId].gain.length > 0, `${id}: gain rỗng`);
  }
});
