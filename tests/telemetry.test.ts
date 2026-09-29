import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { memoryPlatform } from "../src/core/platform";
import { Telemetry, estimateSeason, type DayMetrics } from "../src/core/telemetry";
import { newGame } from "../src/core/save";
import { HeadlessStall, POLICIES } from "../src/sim/headless";

test("DayMetrics sinh đủ field sau mỗi day:ended, pause tách khỏi thời gian active", () => {
  const bus = new Bus();
  let now = 0;
  const t = new Telemetry(bus, true, memoryPlatform(), () => now);
  const w = newGame("t", "tele-1");
  const h = new HeadlessStall(w, POLICIES.newbie, { bus });
  // pause 30 giây thật giữa buổi
  let paused = false;
  h.run({
    inject: (sec) => {
      now = sec * 1000;
      if (!paused && sec > 60) {
        paused = true;
        bus.emit("ui:pauseToggled", { paused: true, source: "PLAYER" });
        now += 30_000;
        bus.emit("ui:pauseToggled", { paused: false, source: "PLAYER" });
      }
    },
  });
  const m = t.days.at(-1)!;
  assert.equal(m.dayIndex, 1);
  assert.ok(m.customersServed > 5);
  assert.ok(Math.abs(m.realMsPaused - 30_000) < 50);
  assert.equal(m.realMsActive, m.realMsTotal - m.realMsPaused - m.realMsMenu);
  assert.ok(m.msPerCustomer.p50 > 0);
  assert.ok(m.linesSpoken > 0);
  for (const k of ["stimEmitted", "confirmRate", "attentionToolUses", "barkTierMix", "saveWriteMsP99", "bubblePoolSteals"] as const) {
    assert.ok(k in m, `thiếu ${k}`);
  }
});

test("bảng quyết định §2.1: < 4 giờ là QUÁ NGẮN, 6–8 là vùng mục tiêu, > 10 là QUÁ DÀI", () => {
  const day = (min: number) => ({ realMsActive: min * 60_000, realMsTotal: min * 60_000 } as DayMetrics);
  const five = (min: number) => Array.from({ length: 5 }, () => day(min));
  assert.match(estimateSeason(five(5)).verdict, /QUÁ NGẮN/);
  assert.match(estimateSeason(five(10)).verdict, /VÙNG MỤC TIÊU/);
  assert.match(estimateSeason(five(16)).verdict, /QUÁ DÀI/);
  assert.match(estimateSeason([day(10)]).verdict, /chưa đủ để chốt/);
  assert.equal(estimateSeason(five(10)).seasonHours, 6.67);
});

test("telemetry tắt thì không ghi gì", () => {
  const bus = new Bus();
  const t = new Telemetry(bus, false, memoryPlatform());
  bus.emit("npc:left", { npcId: "BA_BAY", visitId: "BA_BAY#0", reason: "SERVED" });
  assert.equal(t.rowsOf(0).length, 0);
});
