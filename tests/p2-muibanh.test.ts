// `ovenHot` đúng suốt buổi vì `ovenBusy`, nên câu về mùi bánh phải khoá `w.meVuaRa`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES } from "../src/sim/headless";
import { TalkStore } from "../src/content/talks";

const TALKS = await TalkStore.loadAll();

test("MB-1 hai cuộc về mùi bánh khoá `w.meVuaRa`, không phải `w.ovenHot`", () => {
  for (const id of ["duong.mui", "walkin.meraLo"]) {
    const t = TALKS.find((x) => x.id === id)!;
    assert.ok(t, `${id} biến mất`);
    assert.deepEqual(t.when?.world, ["w.meVuaRa"],
      `${id}: khoá vào \`w.ovenHot\` là không khoá gì — lò nhen suốt buổi`);
  }
});

test("MB-2 `meVuaRa` TẮT khi lò chỉ đang nhen, `ovenHot` thì không", () => {
  const w = newGame("mui", "p210");
  const h = new HeadlessStall(w, POLICIES.greedy, { bus: new Bus(false), platform: memoryPlatform() });
  const svc = (h as unknown as { service: any }).service;

  svc.ovenBusy = true;
  svc.lastBatchOutAt = -1e9;
  assert.equal(svc.ovenHot, true, "lò đang nhen mà `ovenHot` lại false");
  assert.equal(svc.meVuaRa, false, "lò mới nhen, chưa ra mẻ nào, mà đã khai là mẻ vừa ra");
});

test("MB-3 `meVuaRa` BẬT ngay sau một mẻ, rồi tắt khi mùi bay", () => {
  const w = newGame("mui2", "p210");
  const h = new HeadlessStall(w, POLICIES.greedy, { bus: new Bus(false), platform: memoryPlatform() });
  const svc = (h as unknown as { service: any }).service;

  svc.ovenBusy = false;
  svc.lastBatchOutAt = svc.nowSec;
  assert.equal(svc.meVuaRa, true, "mẻ vừa ra mà fact không bật");

  svc.lastBatchOutAt = svc.nowSec - 10_000;
  assert.equal(svc.meVuaRa, false, "mẻ ra từ lâu mà vẫn khai là vừa ra");
  assert.equal(svc.ovenHot, false, "lò tắt, mẻ ra từ lâu, mà `ovenHot` vẫn true");
});
