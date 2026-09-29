import { test } from "node:test";
import assert from "node:assert/strict";
import { FRAME_STEPS, runFrame, type FrameHandlers } from "../src/sim/frame";
import { Bus } from "../src/core/eventbus";

function spy(dt: number) {
  const calls: string[] = [];
  const h: FrameHandlers = {
    clock: () => { calls.push("clock"); return dt; },
    input: () => calls.push("input"),
    craft: () => calls.push("craft"),
    perception: () => calls.push("perception"),
    npc: () => calls.push("npc"),
    dialog: () => calls.push("dialog"),
    render: () => calls.push("render"),
    renderPaused: () => calls.push("renderPaused"),
  };
  return { h, calls };
}

test("thứ tự frame BẮT BUỘC: clock → input → craft → perception → npc → dialog → render", () => {
  const { h, calls } = spy(0.033);
  runFrame(h, 33);
  assert.deepEqual(calls, [...FRAME_STEPS]);
});

test("pause (dt = 0): chỉ vẽ lại, KHÔNG hệ nào dưới clock chạy", () => {
  const { h, calls } = spy(0);
  runFrame(h, 33);
  assert.deepEqual(calls, ["clock", "renderPaused"]);
});

test("bus đồng bộ: listener chạy xong trước khi emit() trả về", () => {
  const bus = new Bus();
  const order: string[] = [];
  bus.on("stim:emitted", () => order.push("listener"));
  bus.emit("stim:emitted", { stimId: "DROPPED_FOOD", zone: "HANDS", salience: 75, at: 0 });
  order.push("sau emit");
  assert.deepEqual(order, ["listener", "sau emit"]);
});

test("bus chống vòng lặp: A → B → A quá 8 tầng thì throw", () => {
  const bus = new Bus();
  bus.on("stim:emitted", (p) => bus.emit("stim:expired", { stimId: p.stimId }));
  bus.on("stim:expired", (p) => bus.emit("stim:emitted", { stimId: p.stimId, zone: "HANDS", salience: 1, at: 0 }));
  assert.throws(() => bus.emit("stim:emitted", { stimId: "FLOURISH", zone: "HANDS", salience: 15, at: 0 }), /vòng lặp/);
});

test("bus.trace.dump() ra JSONL, bỏ qua clock:tick", () => {
  const bus = new Bus(true);
  bus.emit("clock:tick", { dt: 0.03, gameMinutes: 360, hhmm: "06:00" });
  bus.emit("npc:left", { npcId: "BA_BAY", visitId: "BA_BAY#0", reason: "SERVED" });
  const lines = bus.trace.dump().split("\n");
  assert.equal(lines.length, 1);
  assert.equal(JSON.parse(lines[0]).e, "npc:left");
});
