/**
 * P3-06 §3 — SỔ TỐI PHẢI CỘNG LẠI ĐƯỢC: cộng hết các dòng của `econ.today` phải ra đúng
 * chênh lệch `money.cash` trong ngày.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { buyEquip, newEquipState, sellEquip } from "../src/sim/equipment";
import { eveningCount, morningRent, newEconState, type EconToday } from "../src/sim/obligations";

/** Tổng các dòng tiền RA của một ngày (âm = tiền vô). */
const outflow = (t: EconToday) => t.market + t.rent + t.fixed + t.tools + t.talk;

test("sổ hôm nay cộng lại đúng bằng chênh lệch cái két — một chuỗi giao dịch đủ loại", () => {
  const e = newEconState();
  const m = { cash: 5_000_000 };
  const equip = newEquipState();
  const before = m.cash;

  morningRent(e, m);                                                  // tiền chỗ
  e.today.market += 400_000; m.cash -= 400_000;                       // đi chợ
  assert.ok(buyEquip("BINH_TRA", equip, m, e));                       // mua đồ nghề
  assert.ok(sellEquip("BINH_TRA", equip, m, 1, e) > 0);               // bán lại
  e.today.talk += 30_000; m.cash -= 30_000;                           // chi khi trò chuyện
  eveningCount(e, m, 40_000);                                         // than đá túi xăng

  assert.equal(outflow(e.today), before - m.cash, "sổ lệch với két");
});

test("thiếu tiền than: sổ chỉ ghi phần két trả nổi", () => {
  const e = newEconState(), m = { cash: 10_000 };
  eveningCount(e, m, 33_000);
  assert.equal(m.cash, 0);
  assert.equal(e.today.fixed, 10_000, "ghi đủ 33.000 thì trang tối nói dối");
  assert.equal(outflow(e.today), 10_000);
});
