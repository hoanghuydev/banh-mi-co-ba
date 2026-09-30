/**
 * P4-02 — cấu trúc mùa 40 ngày: bảng kiểm C (§2.6), phanh XĐ3 (§2.5 luật B1/B3/B4),
 * ngày 30 trống, lịch trời là nguồn duy nhất, cổng mở khoá đồn thổi (§2.2–2.3).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DAYS, DEPARTURES, doubleNegativeDays, doublePositiveWithin, gossipOpen, netOfAct, scriptedNegativesAfter, signalsOf,
} from "../src/sim/season";
import { CAL, weatherOf } from "../src/sim/econ";
import { weekdayOf } from "../src/sim/schedule";
import { newGossipState, gossipTick, witness, type GossipState } from "../src/sim/gossip";
import { viaRoundUp, viaWalkInMul } from "../src/sim/till";
import { ROOT, walk } from "../tools/lib";

test("40 ngày, đủ trường, thứ khớp lịch (ngày 1 = thứ Hai)", () => {
  assert.equal(DAYS.length, 40);
  const vi = { MON: "T2", TUE: "T3", WED: "T4", THU: "T5", FRI: "T6", SAT: "T7", SUN: "CN" } as const;
  DAYS.forEach((d, i) => {
    assert.equal(d.day, i + 1);
    assert.equal(d.weekday, vi[weekdayOf(d.day)], `ngày ${d.day}`);
    assert.ok(d.balance.length > 0 && d.act >= 1 && d.act <= 4);
  });
});

test("bảng kiểm C — không hồi nào âm; −− không liền nhau (trừ 24–25); mỗi −− có ++ trong ±2", () => {
  for (const act of [1, 2, 3, 4] as const) assert.ok(netOfAct(act) >= 0, `hồi ${act}: ${netOfAct(act)}`);
  const bad = doubleNegativeDays();
  for (let i = 1; i < bad.length; i++) {
    if (bad[i] - bad[i - 1] === 1) assert.deepEqual([bad[i - 1], bad[i]], [24, 25], `${bad[i - 1]}–${bad[i]}`);
  }
  for (const d of bad) assert.ok(doublePositiveWithin(d, 2), `ngày ${d} không có ++ trong ±2`);
});

test("bảng kiểm C — không sự kiện tiêu cực kịch bản nào sau ngày 36; Hồi I không có −− (N1); ngày 1–2 không cutscene (N5)", () => {
  assert.deepEqual(scriptedNegativesAfter(36), []);
  assert.ok(DAYS.filter((d) => d.act === 1).every((d) => !d.balance.includes("−−")));
  assert.deepEqual(DAYS[0].events, []);
});

test("ngày 30 KHÔNG có sự kiện kịch bản nào (sự vắng mặt cần không gian trống)", () => {
  assert.deepEqual(DAYS[29].events, []);
  assert.ok(DAYS[29].absent?.includes("CHU_TU"));
});

test("phanh XĐ3 — mọi người rời đi có ≥ 3 tín hiệu trong 8 ngày trước, ≥ 1 là hành vi, cái cuối cách ≤ 2 ngày", () => {
  for (const p of DEPARTURES) {
    const inWin = signalsOf(p.npc).filter((s) => s.day < p.departureDay && p.departureDay - s.day <= 8);
    assert.ok(inWin.length >= 3, `${p.npc}: ${inWin.length} tín hiệu`);
    assert.ok(inWin.some((s) => s.kind === "hanh_vi"), `${p.npc}: không có tín hiệu hành vi`);
    assert.ok(Math.min(...inWin.map((s) => p.departureDay - s.day)) <= 2, `${p.npc}: tín hiệu cuối quá xa`);
  }
  // chị Lan không được nói một câu báo trước nào (P4-02 §2.5 B-B)
  assert.ok(signalsOf("CHI_LAN").every((s) => s.kind === "hanh_vi"));
});

test("lịch trời của kinh tế chép ĐÚNG lịch mùa (nguồn duy nhất); ngày 24 mưa lớn", () => {
  DAYS.forEach((d) => assert.equal(CAL.weather[d.day - 1], d.weather, `ngày ${d.day}`));
  assert.equal(weatherOf(24), "MUA_DAM");
});

test("đồn thổi: ngày ≥ 9 HOẶC ≥ 90 phút chơi — trước đó chỉ chuỗi kịch bản đi ngầm, không cảnh nghe lỏm", () => {
  assert.equal(gossipOpen(8, 0), false);
  assert.equal(gossipOpen(9, 0), true);
  assert.equal(gossipOpen(6, 91 * 60_000), true);
  const g = newGossipState();
  witness(g, "BA_BAY", "DROPPED_FOOD", 80, 4);
  const present = () => true;
  for (let d = 4; d <= 7; d++) gossipTick(g, { saveId: "s", day: d, allowFalseMemory: true, present, open: false });
  assert.ok(g.log.length >= 1 && g.log.every((e) => e.to === "BA_SAU" && !e.mutated), "chỉ chuỗi bà Bảy → bà Sáu");
  assert.equal(g.overhear, null);
  // đêm 8 (sáng 9 mở) — CÚ LỘ: bà Sáu kể cô Mai, người chơi nghe sáng mai
  gossipTick(g, { saveId: "s", day: 8, allowFalseMemory: true, present, open: true });
  const plan = (g as GossipState).overhear!;           // (đọc lại — TS đã thu hẹp về null ở trên)
  assert.ok(plan && plan.a === "BA_SAU" && plan.b === "CO_MAI" && plan.day === 9);
  assert.equal(plan.source, "BA_BAY");
});

test("LR-6 — vía không có tác dụng cơ học nào", () => {
  for (const v of [-1, 0, 1] as const) { assert.equal(viaWalkInMul(v), 1); assert.equal(viaRoundUp(v), 0); }
});

test("không có chuỗi '/40' hay 'ngày x / 40' ở UI (P4-02 §4)", () => {
  for (const f of walk(join(ROOT, "src"), [".ts"])) {
    // bỏ chú thích — chỉ soi chữ thật sự lên màn hình
    const s = readFileSync(f, "utf8").split(/\r?\n/).filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).map((l) => l.replace(/\s\/\/ .*$/, "")).join("\n");
    assert.ok(!/\/ ?\$\{s\.seasonDays\}|\/40\b|\/ 40\b/.test(s), f);
  }
});
