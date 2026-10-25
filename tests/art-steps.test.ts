import { test } from "node:test";
import assert from "node:assert/strict";
import { runSteps } from "../src/art/steps";

test("runSteps chạy đủ bước theo thứ tự và nhường giữa các bước", async () => {
  const log: string[] = [];
  const steps = ["a", "b", "c"].map((n) => () => { log.push(n); });
  await runSteps(steps, async () => { log.push("-"); });
  assert.deepEqual(log, ["a", "-", "b", "-", "c"]);
});
