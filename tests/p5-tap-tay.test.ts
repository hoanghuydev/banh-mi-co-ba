import { test } from "node:test";
import assert from "node:assert/strict";
import { EASE_LAST_DAY, PEAK_CAP, easeOf, peakCap } from "../src/sim/ease";
import { itemOf } from "../src/sim/menu";
import { LAST_UNLOCK_DAY, openMenu } from "../src/sim/unlock";
import { randomOrder, sayOrder } from "../src/sim/order";
import { Rng } from "../src/core/rng";
import { newGame } from "../src/core/save";
import { dayDeps } from "../src/sim/day";

const DAYS = [1, 2, 3, 4, 5, 6] as const;

test("HĐ1 ngày 7 trở đi mọi hệ số về 1", () => {
  for (const day of [EASE_LAST_DAY + 1, 8, 20, 40]) {
    const e = easeOf(day);
    assert.equal(e.fuss, 1, `ngày ${day} còn bóp lời dặn`);
    assert.equal(e.patience, 1, `ngày ${day} còn nới sức chờ`);
    assert.equal(e.balk, 1, `ngày ${day} còn chặn quay đầu`);
    assert.ok(e.peak >= 4, `ngày ${day} còn trần khách — trần phải để days.json quyết`);
  }
  assert.deepEqual(easeOf(undefined), easeOf(99));
});

test("HĐ1 `randomOrder` khi đã mở hết món ra y hệt bản không truyền ngày — dãy số không dịch một bước", () => {
  for (let seed = 1; seed <= 200; seed++) {
    const a = randomOrder(new Rng(seed), LAST_UNLOCK_DAY);
    const b = randomOrder(new Rng(seed));
    assert.deepEqual(a, b, `seed ${seed} lệch giữa "ngày mở hết món" và "không truyền ngày"`);
  }
});

test("HĐ2 không ngày nào trong sáu bữa đầu nặng hơn ngày thường, và càng về sau càng gần nó", () => {
  const full = easeOf(99);
  let prev = easeOf(1);
  for (const day of DAYS) {
    const e = easeOf(day);
    assert.ok(e.fuss <= full.fuss, `ngày ${day}: lời dặn nhiều hơn ngày thường`);
    assert.ok(e.patience >= full.patience, `ngày ${day}: khách chờ ÍT hơn ngày thường`);
    assert.ok(e.balk <= full.balk, `ngày ${day}: quay đầu NHIỀU hơn ngày thường`);
    if (day > 1) {
      assert.ok(e.fuss >= prev.fuss, `ngày ${day}: lời dặn đi giật lùi`);
      assert.ok(e.patience <= prev.patience, `ngày ${day}: sức chờ đi giật lùi`);
      assert.ok(e.balk >= prev.balk, `ngày ${day}: quay đầu đi giật lùi`);
      assert.ok(e.peak >= prev.peak, `ngày ${day}: trần quầy đi giật lùi`);
    }
    prev = e;
  }
});

test("HĐ4 ngày 1 khách vãng lai gọi một mệnh đề, và chỉ gọi món đã mở", () => {
  const open = new Set(openMenu(1).map((i) => i.id));
  for (let seed = 1; seed <= 300; seed++) {
    const spec = randomOrder(new Rng(seed), 1);
    assert.ok(open.has(spec.intent.mon), `seed ${seed}: gọi món chưa mở (${spec.intent.mon})`);
    assert.equal(spec.intent.nhieu, undefined, `seed ${seed}: còn "cho nhiều"`);
    assert.equal(spec.intent.rau, "day-du", `seed ${seed}: còn dặn rau`);
    assert.equal(spec.intent.ot, 1, `seed ${seed}: còn dặn ớt`);
    assert.equal(spec.intent.tuong, 1, `seed ${seed}: còn dặn tương`);
    assert.equal(sayOrder(spec), `Cho một ổ ${itemOf(spec.intent.mon).call}.`);
  }
});

test("trần quầy: ngày 1–2 một khách vãng lai một lượt, và không bao giờ vượt `PEAK_CAP`", () => {
  assert.equal(peakCap(1, false), 1);
  assert.equal(peakCap(2, false), 1);
  for (let day = 1; day <= 60; day++) {
    assert.ok(peakCap(day, false) <= PEAK_CAP, `ngày ${day}: vượt trần quầy`);
    assert.equal(peakCap(day, true), 1, `ngày ${day}: chế độ không giới hạn thời gian phải luôn ép về 1`);
  }
});

test("sức chờ: `dayDeps` ngày 1 nới hơn ngày 7 đúng bằng easePatience", () => {
  const w = newGame("t", "ease-test");
  w.progress.dayIndex = 1;
  const d1 = dayDeps(w).patienceMul;
  w.progress.dayIndex = EASE_LAST_DAY + 1;
  const d7 = dayDeps(w).patienceMul;
  assert.ok(d1 > d7, "ngày 1 không nới sức chờ");
  assert.ok(Math.abs(d1 / d7 - easeOf(1).patience) < 1e-9, "`dayDeps` không nhân đúng easePatience");
});
