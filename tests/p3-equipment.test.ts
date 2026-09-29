/**
 * P3-04 §6 — bốn luật gốc của cây thiết bị + các đường nối vào hệ khác.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CART, EQUIP, EQUIP_IDS, buyEquip, capacity, has, newEquipState, priceVnd, resaleVnd, sellEquip, used, whyNot,
} from "../src/sim/equipment";
import { lotQuality, shelfDays } from "../src/sim/econ";
import { ROOT, read, walk } from "../tools/lib";
import { join } from "node:path";

test("TB-1 + TB-3: món nào cũng có một câu về cảm giác và ít nhất một cái giá", () => {
  for (const id of EQUIP_IDS) {
    assert.ok(EQUIP[id].feel.length > 10, id);
    assert.ok(EQUIP[id].drawbacks.length >= 1, id);
  }
});

test("TB-4: xe không chứa nổi mọi thứ — kể cả khi mua hết giá treo lẫn khung gia cố", () => {
  const maxCap = CART.baseSlots + 4;
  const allSlots = EQUIP_IDS.filter((id) => !EQUIP[id].replaces || true).reduce((a, id) => a + Math.max(0, EQUIP[id].slots), 0)
    - EQUIP.LO_THAN.slots - EQUIP.THUNG_XOP.slots;          // hai món đầu mùa bị thay chứ không cộng dồn
  assert.ok(allSlots > maxCap, `${allSlots} ≤ ${maxCap}`);
});

test("đầu mùa: lò than + thùng xốp chiếm 4 ô, còn 8 ô trống", () => {
  const e = newEquipState();
  assert.equal(capacity(e), 12);
  assert.equal(used(e), 4);
});

test("mua tủ mát thay thùng xốp (+1 ô ròng, thùng xốp bán lại được); lò gas thay lò than (lò của cô Ba không bán)", () => {
  const e = newEquipState(); const m = { cash: 10_000_000 };
  const flags = { dirtyHandsConfirmed: true };
  assert.equal(whyNot("TU_MAT", e, m.cash, 30, flags), "chưa có ai bán");   // cần thớt riêng hoặc vòi rửa trước
  buyEquip("THOT_RIENG", e, m);
  assert.equal(whyNot("TU_MAT", e, m.cash, 30, flags), null);
  const before = m.cash;
  buyEquip("TU_MAT", e, m);
  assert.ok(!has(e, "THUNG_XOP") && has(e, "TU_MAT"));
  assert.equal(before - m.cash, priceVnd("TU_MAT") - resaleVnd("THUNG_XOP"));
  const c2 = m.cash;
  buyEquip("LO_GAS", e, m);
  assert.equal(c2 - m.cash, priceVnd("LO_GAS"));                          // lò than không bán lại
  assert.equal(used(e), 3 + 3 + 1);
});

test("bán lại = 60% giá; bán lò gas thì lò than của cô Ba vẫn còn đó", () => {
  const e = newEquipState(); const m = { cash: 10_000_000 };
  buyEquip("LO_GAS", e, m);
  const v = sellEquip("LO_GAS", e, m);
  assert.equal(v, resaleVnd("LO_GAS"));
  assert.equal(resaleVnd("LO_GAS"), Math.round(priceVnd("LO_GAS") * 0.6 / 1000) * 1000);
  assert.ok(has(e, "LO_THAN"));
});

test("tủ mát: đồ lạnh để được gấp đôi (pate 2 ngày → 4), đồ chua KHÔNG đổi", () => {
  assert.equal(shelfDays("PATE_NHA", "thung_xop"), 2);
  assert.equal(shelfDays("PATE_NHA", "tu_mat"), 6);
  assert.equal(shelfDays("DO_CHUA_NL", "tu_mat"), shelfDays("DO_CHUA_NL", "thung_xop"));
  assert.equal(lotQuality({ good: "RAU", day: 1, left: 1, q0: 1 }, 2, "thung_xop"), 0.55);
  assert.equal(lotQuality({ good: "RAU", day: 1, left: 1, q0: 1 }, 2, "tu_mat"), 1.0);
});

test("TB-2: không món nào tự làm thay người chơi — không có hiệu ứng AUTO, không ai gọi assembly.commit", () => {
  for (const f of walk(join(ROOT, "src"), [".ts", ".json"])) {
    const s = read(f);
    assert.ok(!/kind:\s*["']AUTO["']/.test(s), f);
    assert.ok(!/assembly\.commit\(/.test(s), f);
  }
});

test("cái xe LÀ bảng thành tựu: không achievement / toast / progress bar ở đâu cả", () => {
  for (const f of walk(join(ROOT, "src"), [".ts"])) assert.ok(!/achievement|unlocked_toast|progress_bar/i.test(read(f)), f);
});
