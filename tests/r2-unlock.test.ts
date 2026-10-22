import { test } from "node:test";
import assert from "node:assert/strict";
import { Rng } from "../src/core/rng";
import { newGame } from "../src/core/save";
import { MENU_ITEMS, itemOf } from "../src/sim/menu";
import { LAST_UNLOCK_DAY, goodOpen, openMenu, openedOn } from "../src/sim/unlock";
import { PRICE_FX, dishPriceVnd, pickOf } from "../src/sim/econ";
import { randomOrder } from "../src/sim/order";
import { basketFor } from "../src/sim/day";
import { newInventory } from "../src/sim/econ";

test("ngày 1 chỉ có ốp la, ngày 10 mở hết", () => {
  assert.deepEqual(openMenu(1).map((i) => i.id), ["opla"]);
  assert.equal(openMenu(LAST_UNLOCK_DAY).length, MENU_ITEMS.length);
  assert.ok(LAST_UNLOCK_DAY <= 10);
});

test("món mở sau có giá thường cao hơn món mở trước (trừ bánh mì không)", () => {
  const items = MENU_ITEMS.filter((i) => i.id !== "khong").sort((a, b) => a.unlockDay - b.unlockDay);
  for (let i = 1; i < items.length; i++) {
    assert.ok(items[i].k[1] > items[i - 1].k[1], `${items[i].id} mở sau ${items[i - 1].id} mà giá không cao hơn`);
  }
});

test("mỗi ngày mở thêm không quá một món (bánh mì không đi cùng đầy đủ)", () => {
  for (let d = 1; d <= LAST_UNLOCK_DAY; d++) assert.ok(openedOn(d).filter((i) => i.id !== "khong").length <= 1, `ngày ${d}`);
});

test("khách vãng lai chỉ gọi món đã mở", () => {
  for (const day of [1, 2, 4, 6, 8, 10, 11]) {
    const open = new Set(openMenu(day).map((i) => i.id));
    for (let seed = 1; seed <= 200; seed++) {
      assert.ok(open.has(randomOrder(new Rng(seed), day).intent.mon), `ngày ${day} seed ${seed}`);
    }
  }
});

test("hàng của nhân chưa mở bị ẩn, hàng nền luôn mở", () => {
  assert.ok(!goodOpen("XIU_MAI", 1) && goodOpen("XIU_MAI", 4));
  assert.ok(!goodOpen("CHA_LUA", 4) && goodOpen("CHA_LUA", 6));
  assert.ok(!goodOpen("THIT_NGUOI", 6) && goodOpen("THIT_NGUOI", 8));
  for (const g of ["BANH", "PATE", "TRUNG", "RAU", "OT", "SOT", "DO_CHUA_NL"] as const) assert.ok(goodOpen(g, 1), g);
});

test("rổ tối thiểu ngày 1 không có nhân chưa mở", () => {
  const b = basketFor(newInventory(), 10, 1);
  assert.ok(b.TRUNG && b.PATE && b.BANH);
  assert.equal(b.XIU_MAI, undefined);
  assert.equal(b.THIT_NGUOI, undefined);
  assert.equal(b.CHA_LUA, undefined);
});

test("giá theo mốc: rẻ < thường < đắt, thiếu mốc là thường", () => {
  for (const it of MENU_ITEMS) {
    const [a, b, c] = [0, 1, 2].map((p) => dishPriceVnd({ mon: it.id }, p as 0 | 1 | 2));
    assert.ok(a < b && b < c, it.id);
  }
  assert.equal(pickOf({}, "opla"), 1);
  assert.equal(pickOf({ opla: 2 }, "opla"), 2);
  assert.equal(itemOf("opla").unlockDay, 1);
});

test("bảng tác động giá: đắt bỏ đi nhiều nhất, rẻ khen nhiều nhất, chỉ đắt bị chê giá", () => {
  const { walkAway, praise, overpriced } = PRICE_FX;
  assert.ok(walkAway[0] <= walkAway[1] && walkAway[1] <= walkAway[2]);
  assert.ok(praise[0] >= praise[1] && praise[1] >= praise[2]);
  assert.equal(overpriced[0], 0);
  assert.ok(overpriced[2] > 0);
});

test("save mới có mốc giá rỗng", () => {
  assert.deepEqual(newGame("t", "x").menu.price, {});
});
