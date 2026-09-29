/**
 * Test tất định — P0-02 §6. Đây là test PHẢI chạy mỗi commit (R1): một
 * `Math.random()` lọt vào là cơ chế chống save-scum hỏng âm thầm.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus, type EventKey } from "../src/core/eventbus";
import { memoryPlatform } from "../src/core/platform";
import { SaveService, newGame, type SaveFile } from "../src/core/save";
import { HeadlessStall, POLICIES, type Policy } from "../src/sim/headless";

/** certainty cao nhất của một loại sự kiện với một người (observations giờ theo KHOÁ từng lần). */
function certOf(c: { observations: Map<string, { id: string; certainty: number }> }, id: string) {
  let best = 0;
  for (const o of c.observations.values()) if (o.id === id) best = Math.max(best, o.certainty);
  return best;
}

function day7(): SaveFile {
  const w = newGame("t", "det-save");
  w.progress.dayIndex = 7;
  return w;
}

function record(bus: Bus, keys?: EventKey[]) {
  const out: string[] = [];
  bus.onAny((e, p) => {
    if (e === "clock:tick") return;
    if (keys && !keys.includes(e)) return;
    out.push(JSON.stringify([e, p]));
  });
  return out;
}

test("chạy ngày 7 hai lần, cùng saveId, cùng input → mọi event giống hệt từng byte", () => {
  const runs = [0, 1].map(() => {
    const bus = new Bus(true);
    const log = record(bus);
    new HeadlessStall(day7(), POLICIES.newbie, { bus }).run();
    return { log: log.join("\n"), trace: bus.trace.dump() };
  });
  assert.ok(runs[0].log.length > 1000, "ngày chơi quá ít sự kiện — harness có chạy không?");
  assert.equal(runs[0].log, runs[1].log);
  assert.equal(runs[0].trace, runs[1].trace);
});

test("cô lập stream: chèn 20 lần rút RNG thoại → lịch khách và đơn gọi vẫn giống hệt", () => {
  const keys: EventKey[] = ["npc:arrived", "order:placed"];
  const a = (() => {
    const bus = new Bus();
    const log = record(bus, keys);
    new HeadlessStall(day7(), POLICIES.newbie, { bus }).run();
    return log;
  })();
  const b = (() => {
    const bus = new Bus();
    const log = record(bus, keys);
    let burned = 0;
    new HeadlessStall(day7(), POLICIES.newbie, { bus }).run({
      // "hỏi một câu" (công cụ hạ attention, CANON §5.4) tiêu số của stream thoại
      inject: (t, h) => { if (burned < 20 && t > 10 + burned * 7) { h.ctx.rng.next("dialog-shufflebag"); burned++; } },
    });
    assert.equal(burned, 20);
    return log;
  })();
  assert.ok(a.length > 10);
  assert.deepEqual(b, a);
});

test("reload giữa ngày (sau khách thứ 5) → những người còn lại tới đúng thứ tự như không reload", () => {
  const arrivals = (bus: Bus) => {
    const ids: string[] = [];
    bus.on("npc:arrived", (p) => ids.push(`${p.visitId}@${p.atHhmm}`));
    return ids;
  };

  const busA = new Bus();
  const all = arrivals(busA);
  new HeadlessStall(day7(), POLICIES.greedy, { bus: busA }).run();

  // Lần B: chơi tới lúc khách thứ 5 rời đi, ghi save xuống "đĩa", tắt tab.
  const platform = memoryPlatform();
  const busB = new Bus();
  const before = arrivals(busB);
  let left = 0;
  busB.on("npc:left", () => left++);
  const hB = new HeadlessStall(day7(), POLICIES.greedy, { bus: busB, platform });
  hB.run({ until: () => left >= 5 });
  new SaveService(busB, () => hB.ctx.snapshot(), platform).flushNow("QUIT");

  // Mở lại: đọc từ "đĩa", vào đúng giữa buổi.
  const loaded = new SaveService(new Bus(), () => { throw new Error(); }, platform).load()!;
  assert.equal(loaded.progress.scene, "Stall");
  const busC = new Bus();
  const after = arrivals(busC);
  new HeadlessStall(loaded, POLICIES.greedy, { bus: busC, platform, resume: true }).run();

  assert.deepEqual(before, all.slice(0, before.length), "trước reload phải trùng lần chạy gốc");
  assert.ok(after.length > 5, "phải còn khách tới sau reload");
  assert.deepEqual(after, all.slice(before.length));
});

test("pause 10 giây: đồng hồ, kiên nhẫn và certainty KHÔNG đổi một chữ số thập phân nào", () => {
  const h = new HeadlessStall(day7(), { ...POLICIES.greedy, workSec: [1e9, 1e9] });
  h.run({ until: (x) => x.service.front?.phase === "waiting" });
  h.bus.emit("stim:emitted", { stimId: "DROPPED_FOOD", zone: "HANDS", salience: 75, at: h.elapsed });
  for (let i = 0; i < 10; i++) h.step();                 // cho certainty kịp tích một ít
  const c = h.service.front!;
  const snap = () => JSON.stringify({
    m: h.ctx.clock.minutes, w: c.waitSec, o: [...c.observations].map(([k, v]) => [k, v.certainty]),
  });
  const before = snap();
  assert.ok(certOf(c, "DROPPED_FOOD") > 0);
  h.ctx.clock.paused = true;
  for (let i = 0; i < 300; i++) h.step();                // 10 giây ở 30 fps
  assert.equal(snap(), before);
  h.ctx.clock.paused = false;
  h.step();
  assert.notEqual(snap(), before);
});

test("không giới hạn thời gian: đứng ì 10 phút, không ai bỏ đi vì chậm", () => {
  const lazy: Policy = { ...POLICIES.greedy, name: "lazy", workSec: [1e9, 1e9] };
  const count = (pressure: boolean) => {
    const bus = new Bus();
    let impatient = 0;
    bus.on("npc:left", (p) => { if (p.reason === "IMPATIENT") impatient++; });
    const h = new HeadlessStall(day7(), lazy, { bus, pressure });
    for (let i = 0; i < 30 * 60 * 10 && !h.closed; i++) h.step();
    return impatient;
  };
  assert.ok(count(true) > 0, "có áp lực thì người ì phải mất khách");
  assert.equal(count(false), 0);
});

test("thứ tự trong frame: stim phát ở bước craft được perception duyệt NGAY frame đó", () => {
  const h = new HeadlessStall(day7(), { ...POLICIES.greedy, workSec: [1e9, 1e9] });
  h.run({ until: (x) => x.service.front?.phase === "waiting" });
  const c = h.service.front!;
  let fired = false;
  h.step(1000 / 30, () => {
    if (fired) return;
    fired = true;
    h.bus.emit("stim:emitted", { stimId: "DROPPED_FOOD", zone: "HANDS", salience: 75, at: h.elapsed });
  });
  assert.ok(certOf(c, "DROPPED_FOOD") > 0, "trễ 1 frame = sai thứ tự");
});
