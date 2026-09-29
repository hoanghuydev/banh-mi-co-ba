import { test } from "node:test";
import assert from "node:assert/strict";
import { Clock, DAY_START_MIN, PEAK_START_MIN, TIME_SCALE_BASE, bandOf } from "../src/core/clock";
import { Bus } from "../src/core/eventbus";

const minutes = (h: number, m: number) => h * 60 + m;

test("khung giờ chốt: bán 06:00–11:00, cao điểm 06:30–08:00", () => {
  assert.equal(DAY_START_MIN, minutes(6, 0));
  assert.equal(PEAK_START_MIN, minutes(6, 30));
  assert.equal(bandOf(minutes(6, 10)), "PRE_OPEN");
  assert.equal(bandOf(minutes(7, 0)), "PEAK");
  assert.equal(bandOf(minutes(8, 30)), "MID");
  assert.equal(bandOf(minutes(10, 0)), "LULL");
});

test("TIME_SCALE_BASE 30: 1 giây thật = 30 giây game khi có khách", () => {
  const c = new Clock();
  c.busy = true;
  for (let i = 0; i < 10; i++) c.advance(100);           // 1 giây thật
  assert.ok(Math.abs(c.minutes - (DAY_START_MIN + TIME_SCALE_BASE / 60)) < 1e-9);
});

test("quầy trống ở LULL thì tua nhanh (120), có khách thì về 30 ngay frame đó", () => {
  const c = new Clock();
  c.reset(minutes(10, 0));
  c.busy = false;
  c.advance(100);
  assert.equal(c.scale, 120);
  c.busy = true;
  c.advance(100);
  assert.equal(c.scale, 30);
});

test("cao điểm KHÔNG BAO GIỜ tua, kể cả lúc trống", () => {
  const c = new Clock();
  c.reset(minutes(7, 0));
  c.busy = false;
  c.advance(100);
  assert.equal(c.scale, 30);
});

test("pause: advance() trả 0 và đồng hồ đứng im", () => {
  const c = new Clock();
  c.paused = true;
  const before = c.minutes;
  for (let i = 0; i < 600; i++) assert.equal(c.advance(33), 0);
  assert.equal(c.minutes, before);
});

test("tab ẩn 5 phút rồi quay lại: dt bị kẹp 100 ms", () => {
  const c = new Clock();
  assert.equal(c.advance(5 * 60_000), 0.1);
});

test("chế độ không giới hạn thời gian: đồng hồ chậm MỘT NỬA, dt thật không đổi", () => {
  const a = new Clock(); a.busy = true;
  const b = new Clock(); b.busy = true; b.scaleMul = 0.5;
  const dtA = a.advance(100), dtB = b.advance(100);
  assert.equal(dtA, dtB);
  assert.ok(Math.abs((b.minutes - DAY_START_MIN) * 2 - (a.minutes - DAY_START_MIN)) < 1e-9);
});

test("day.fastForward nhân phút GAME, KHÔNG nhân dt của certainty (P0-03 §2.2)", () => {
  const c = new Clock(); c.busy = true; c.devFastForward = 4;
  const dt = c.advance(100);
  assert.equal(dt, 0.1);
  assert.ok(Math.abs(c.minutes - (DAY_START_MIN + (4 * 30 * 0.1) / 60)) < 1e-9);
});

test("clock.after() thay setTimeout: pause thì hẹn giờ cũng đứng", () => {
  const c = new Clock();
  let fired = 0;
  c.after(0.5, () => fired++);
  c.advance(100); c.advance(100);
  c.paused = true;
  for (let i = 0; i < 100; i++) c.advance(100);
  assert.equal(fired, 0);
  c.paused = false;
  c.advance(100); c.advance(100);
  assert.equal(fired, 0);
  c.advance(100); c.advance(100);                        // 0,6 s > 0,5 s (tránh mép sai số float)
  assert.equal(fired, 1);
});

test("clock:bandChanged phát đúng một lần khi qua mốc", () => {
  const bus = new Bus();
  const seen: string[] = [];
  bus.on("clock:bandChanged", (p) => seen.push(`${p.from}->${p.to}`));
  const c = new Clock(bus);
  c.reset(minutes(6, 29.9));
  c.busy = true;
  for (let i = 0; i < 20; i++) c.advance(100);
  assert.deepEqual(seen, ["PRE_OPEN->PEAK"]);
});
