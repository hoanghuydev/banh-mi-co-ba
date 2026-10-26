import { test } from "node:test";
import assert from "node:assert/strict";
import { drain, runSteps, slice } from "../src/art/steps";

test("runSteps chạy đủ bước theo thứ tự, hết ngân sách thì nhường cả giữa bước", async () => {
  const log: string[] = [];
  const keep = slice.ms;
  slice.ms = 0;
  try {
    const steps = [
      () => { log.push("a"); },
      function* () { log.push("b1"); yield; log.push("b2"); },
      () => { log.push("c"); },
    ];
    const seen: number[] = [];
    await runSteps(steps, async () => { log.push("-"); }, (done) => seen.push(done));
    assert.deepEqual(log, ["a", "-", "b1", "-", "b2", "-", "c", "-"]);
    assert.deepEqual(seen, [1, 2, 3]);
  } finally {
    slice.ms = keep;
  }
});

test("runSteps không nhường khi còn ngân sách", async () => {
  const log: string[] = [];
  const keep = slice.ms;
  slice.ms = 1e9;
  try {
    await runSteps([() => { log.push("a"); }, function* () { log.push("b"); yield; }], async () => { log.push("-"); });
    assert.deepEqual(log, ["a", "b"]);
  } finally {
    slice.ms = keep;
  }
});

test("drain chạy hết iterator và trả giá trị cuối", () => {
  assert.equal(drain((function* () { yield; yield; return 7; })()), 7);
});

test("runSteps chờ Promise được yield rồi chạy tiếp", async () => {
  const log: string[] = [];
  let open!: () => void;
  const gate = new Promise<void>((ok) => { open = ok; });
  const run = runSteps([function* () { log.push("a"); yield gate; log.push("b"); }], async () => {});
  await Promise.resolve();
  assert.deepEqual(log, ["a"]);
  open();
  await run;
  assert.deepEqual(log, ["a", "b"]);
});
