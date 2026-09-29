/**
 * P2-03 §6 — đúng đắn cơ chế trí nhớ + quan hệ. Mỗi test là một câu trong doc.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { NPCS } from "../src/content/npcs";
import {
  CEILING_STEP, DECAY, currentIntensity, floorOfTier, newRelState, nightly, record, type Memory, type RelState,
} from "../src/sim/memory";
import { MIGRATIONS, SCHEMA_VERSION, newGame } from "../src/core/save";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";

const P = Object.fromEntries(NPCS.map((n) => [n.id, n.personality]));
const BAY = P.BA_BAY;

test("ghi đè SHORT chọn cường độ THẤP NHẤT: 7 ký ức yếu + 1 WRONG_NAME, nhét 5 cái mới → WRONG_NAME vẫn còn", () => {
  const s = newRelState();
  record(s, BAY, "WRONG_NAME", 100, 1);
  const weak = ["FLOURISH", "FREE_EXTRA", "MADE_THEM_WAIT", "DIRTY_HANDS", "BURNT_OR_COLD", "ORDER_DEFECT", "CARED_FOR_THEM"] as const;
  weak.forEach((k) => record(s, BAY, k, 20, 1));
  assert.equal(s.memory.short.length, 8);                  // bà Bảy 8 slot SHORT
  for (const k of ["REMEMBERED_USUAL", "REMEMBERED_STORY", "DROPPED_FOOD", "FLOURISH", "FREE_EXTRA"] as const) record(s, BAY, k, 60, 2);
  assert.ok(s.memory.short.some((m) => m.kind === "WRONG_NAME"), "WRONG_NAME bị đẩy ra — FIFO lẻn vào?");
});

test("decay tapering liên tục, đạo hàm liên tục ở hai đầu — không có cliff", () => {
  const m: Memory = {
    id: "x", kind: "WRONG_NAME", valence: -1, intensity: 90, intensity0: 90, dayCreated: 0, dayLastReinforced: 0,
    occurrences: 1, source: { via: "WITNESSED" }, confidence: 1, tier: "SHORT", redeemPaid: 0, redeemDays: [],
  };
  const d = DECAY.WRONG_NAME;
  const taper = d.taper * (0.4 + 1.6 * BAY.deTha);
  const f = (t: number) => currentIntensity(m, t, BAY);
  const h = 1e-4;
  for (const t0 of [d.hold, d.hold + taper]) {
    assert.ok(Math.abs(f(t0 - h) - f(t0 + h)) < 0.01, `nhảy bậc ở t=${t0}`);
    const left = (f(t0) - f(t0 - h)) / h, right = (f(t0 + h) - f(t0)) / h;
    assert.ok(Math.abs(left - right) < 0.01, `gãy góc ở t=${t0}: ${left} vs ${right}`);
  }
  assert.equal(f(1000), 90 * 0.25);                        // sàn 25% — không bao giờ tự về 0
});

test("points không bao giờ dưới sàn của bucket đã đạt, không bao giờ vượt trần", () => {
  const s = newRelState();
  s.highestTier = "FRIEND"; s.relationPoints = 40;
  for (let i = 0; i < 20; i++) record(s, BAY, "DROPPED_FOOD", 100, 1 + i);
  assert.ok(s.relationPoints >= floorOfTier("FRIEND"));
  const t = newRelState();
  t.trustCeiling = 64;
  for (let i = 0; i < 50; i++) record(t, BAY, "REMEMBERED_USUAL", 90, i + 1);
  assert.ok(t.relationPoints <= 64);
});

test("lặp một hành vi rẻ: tổng đóng góp hội tụ về 4× một lần (0,75^(n−1))", () => {
  const s = newRelState();
  const first = record(s, P.CHU_TU, "FREE_EXTRA", 25, 1).delta;
  let total = first;
  for (let i = 0; i < 200; i++) total += record(s, P.CHU_TU, "FREE_EXTRA", 25, 1).delta;
  assert.ok(total <= first * 4 * 1.01, `${total} > 4×${first}`);
  assert.ok(total >= first * 4 * 0.97);
});

test("chuộc WRONG_NAME trong CÙNG MỘT NGÀY là bất khả thi; qua 3 buổi nhớ đúng thì lành (đổi dấu, không xoá)", () => {
  const s = newRelState();
  record(s, BAY, "WRONG_NAME", 90, 5);
  for (let i = 0; i < 30; i++) record(s, BAY, "REMEMBERED_USUAL", 90, 6);
  assert.ok(s.memory.short.some((m) => m.kind === "WRONG_NAME"), "chuộc xong trong một ngày");
  // trục sai (cho thêm đồ) không chuộc được sai tên
  for (let d = 7; d < 12; d++) record(s, BAY, "FREE_EXTRA", 25, d);
  assert.ok(s.memory.short.some((m) => m.kind === "WRONG_NAME"));
  record(s, BAY, "REMEMBERED_USUAL", 90, 12);
  record(s, BAY, "REMEMBERED_USUAL", 90, 13);
  assert.ok(!s.memory.short.some((m) => m.kind === "WRONG_NAME"), "3 buổi nhớ đúng mà chưa lành");
  assert.ok(s.memory.long.some((m) => m.kind === "HEALED_WRONG_NAME"), "vết thương lành phải còn lại ở LONG");
});

test("decay đếm LẦN GHÉ BỊ LỠ: chú Tư cuối tuần không có lịch → điểm bất biến; lỡ 1 bữa là chuyện thường", () => {
  const s: RelState = { ...newRelState(), relationPoints: 70, tier: "FRIEND", highestTier: "FRIEND", pointsAtDawn: 70, visits: 20 };
  s.memory.long.push({
    id: "u", kind: "REMEMBERED_USUAL", valence: 1, intensity: 90, intensity0: 90, dayCreated: 1, dayLastReinforced: 1,
    occurrences: 5, source: { via: "WITNESSED" }, confidence: 1, tier: "LONG", redeemPaid: 0, redeemDays: [],
  });
  nightly(s, P.CHU_TU, 7);                                 // không có lịch
  assert.equal(s.relationPoints, 70);
  // bảng kiểm chứng số §2.5: 70 → 70 (grace) → 50 → 40 (rớt Acquaintance) → 35 (sàn) → 35
  const seq: number[] = [];
  for (let d = 8; d <= 12; d++) { s.expectedDay = d; nightly(s, P.CHU_TU, d); seq.push(s.relationPoints); }
  assert.deepEqual(seq, [70, 50, 40, 35, 35]);
  assert.equal(s.tier, "ACQUAINTANCE");
});

test("trần tin tưởng không bao giờ TĂNG; đốt 4 lần → 52 < 60 → vĩnh viễn không lên Friend", () => {
  const s = newRelState();
  let last = s.trustCeiling;
  for (let d = 1; d <= 6; d++) {
    record(s, BAY, "DROPPED_FOOD", 75, d);
    record(s, BAY, "BURNT_OR_COLD", 80, d);                // hai chuyện nặng một ngày = HEAVY_DAY
    nightly(s, BAY, d);
    assert.ok(s.trustCeiling <= last);
    last = s.trustCeiling;
  }
  assert.equal(s.trustCeiling, 100 - 4 * CEILING_STEP);
  s.visits = 50;
  for (let d = 7; d < 80; d++) { record(s, BAY, "REMEMBERED_USUAL", 90, d); record(s, BAY, "CARED_FOR_THEM", 50, d); nightly(s, BAY, d); }
  assert.notEqual(s.tier, "FRIEND");
});

test("bucket không đổi 2 lần trong một ngày — chỉ đổi ban đêm", () => {
  const s = newRelState();
  for (let i = 0; i < 10; i++) record(s, BAY, "DROPPED_FOOD", 100, 1);
  assert.equal(s.tier, "ACQUAINTANCE");                    // trong ngày: điểm tụt nhưng bucket đứng yên
});

test("save v2 → v3: bù field trí nhớ mới, giữ nguyên điểm cũ", () => {
  const v2: any = newGame("x", "mig");
  v2.schemaVersion = 2;
  v2.npcs = { BA_BAY: { visits: 4, freebies: 1, heard: 2, relationPoints: 30, tier: "ACQUAINTANCE", trustCeiling: 100, lastSeenDay: 3,
    memory: { short: [], long: [], core: null }, knownFacts: [], microCheatCounter: {}, gone: false } };
  const v3 = MIGRATIONS[2](v2);
  assert.equal(SCHEMA_VERSION, 3);
  assert.equal(v3.npcs.BA_BAY.relationPoints, 30);
  assert.equal(v3.npcs.BA_BAY.visits, 4);
  assert.equal(v3.npcs.BA_BAY.burnCount, 0);
  assert.equal(v3.npcs.BA_BAY.highestTier, null);
});

test("mô phỏng mùa: người chơi hoàn hảo — ≥1 CORE trước ngày 12, không ai vào Rival", () => {
  const w = newGame("sim", "p203-perfect");
  let coreBy12 = false;
  for (let d = 1; d <= 20; d++) {
    if (d > 1) nextDay(w);
    new HeadlessStall(w, POLICIES.greedy).run();
    if (d <= 12 && Object.values(w.npcs).some((n) => n.memory.core)) coreBy12 = true;
  }
  assert.ok(coreBy12);
  assert.ok(Object.values(w.npcs).every((n) => n.tier !== "RIVAL"));
});
