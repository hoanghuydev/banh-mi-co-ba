/**
 * P4-02 §2.2 — lịch mở khoá hệ thống: cổng nào ghi ở `season/days.json` thì phải có người
 * THI HÀNH nó, và cổng nào có người thi hành ở chỗ khác thì đừng ghi lại ở đây.
 *
 * Khoá chết trong một file tự xưng "nguồn duy nhất" là bẫy tệ nhất: nó không crash, nó chỉ
 * làm người sau tin rằng sửa con số ở đây thì game đổi theo. `unlocks.qr` / `unlocks.evening`
 * (ngày 14) và `unlocks.supplierTiers` (ngày 12) từng nằm ở đó mà không ai đọc.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../tools/lib";
import { UNLOCKS, creditBookOpen, gossipOpen, notebookWriteOpen, standsOpen } from "../src/sim/season";
import { EQUIP, newEquipState, unlocked } from "../src/sim/equipment";

test("mỗi khoá trong days.json.unlocks đều được sim/season.ts đọc thật", () => {
  const src = readFileSync(join(ROOT, "src/sim/season.ts"), "utf8");
  const keys = Object.keys(UNLOCKS).filter((k) => !k.startsWith("_"));
  assert.ok(keys.length > 0);
  for (const k of keys) {
    assert.ok(src.includes(`UNLOCKS.${k}`), `unlocks.${k} không ai đọc — hoặc nối vào, hoặc bỏ khỏi days.json`);
  }
});

test("bốn cổng còn lại mở đúng ngày (9 · 9 · 11 · 16)", () => {
  assert.ok(!gossipOpen(8, 0) && gossipOpen(9, 0));
  assert.ok(gossipOpen(3, 91 * 60_000));             // người chơi chậm vẫn gặp cú lộ
  assert.ok(!creditBookOpen(8) && creditBookOpen(9));
  assert.ok(!notebookWriteOpen(10) && notebookWriteOpen(11));
  assert.ok(!standsOpen(15) && standsOpen(16));
});

test("cổng thiết bị ngày 14 (bảng QR · đèn ca tối) có người thi hành — ở equipment.json", () => {
  const e = newEquipState(), flags = {};
  for (const id of ["BANG_QR", "DEN_CA_TOI"] as const) {
    assert.equal(EQUIP[id].unlock?.minDay, 14, `${id} lệch ngày 14 của P4-02 §2.2`);
    assert.ok(!unlocked(id, e, 13, flags), `${id} mở sớm`);
    assert.ok(unlocked(id, e, 14, flags), `${id} chưa mở ngày 14`);
  }
});
