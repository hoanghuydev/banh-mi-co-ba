/** Kéo tay các chuỗi act hai mắt xích qua đường chạy thật. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TALK_NPC_IDS, TalkStore } from "../src/content/talks";
import { walkNodes, type Talk } from "../src/sim/talk";

const TALKS: Talk[] = await TalkStore.loadAll();

async function moQuan(ngay = 9) {
  const w = newGame("chuoi", "p210");
  const bus = new Bus(false);
  for (let d = 1; d < ngay; d++) nextDay(w);
  const h = new HeadlessStall(w, POLICIES.social, { bus, platform: memoryPlatform() });
  const svc = (h as unknown as { service: any }).service;
  for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);
  // Phải là người có tên: người lạ dùng chung một `memKey`.
  let ai: any = null;
  for (let i = 0; i < 60_000 && !ai; i++) {
    h.step(1000 / 30);
    ai = svc.customers.find((c: any) => c.npc && c.phase !== "leaving") ?? null;
  }
  return { w, h, svc, ai };
}

test("CA-5 cuộc `OVERHEARD_BY` khoá sau một cờ mà cờ đó CÓ người đặt", () => {
  const chu = TALKS.filter((t) => [...walkNodes(t)].some((x) => x.node.act?.kind === "OVERHEARD_BY"));
  assert.ok(chu.length, "không cuộc nào gọi `OVERHEARD_BY`");
  const dat = new Set<string>();
  for (const t of TALKS) for (const { node } of walkNodes(t)) if (node.flag) dat.add(node.flag);
  for (const t of chu) {
    const co = t.when?.needFlag;
    if (!co) continue;
    assert.ok(dat.has(co.replace(/^~/, "")),
      `${t.id} chờ cờ "${co}" mà không cuộc nào đặt được nó — chuỗi đứt ở giữa`);
  }
});

test("CA-6 `LEAVE_SHADE` là mắt xích THỨ HAI — chưa vô trú thì không tiễn được", async () => {
  const { svc, ai } = await moQuan();
  assert.ok(ai, "cả buổi không ai CÓ TÊN ghé");

  svc.shadeFree = true;
  svc.applyTalkOption(ai, { act: { kind: "LEAVE_SHADE" } });
  assert.equal(ai.inShade, false, "chưa vô trú mà tiễn cũng xong — act chạy không tải");

  svc.applyTalkOption(ai, { act: { kind: "STAND_IN_SHADE", forSec: 90 } });
  assert.equal(ai.inShade, true, "mời vô trú mà không vô");
  svc.applyTalkOption(ai, { act: { kind: "LEAVE_SHADE" } });
  assert.equal(ai.inShade, false, "tiễn rồi mà vẫn đứng nguyên trong bóng mát");
});

test("CA-7 tiễn xong thì chỗ mát TRỐNG RA cho người sau", async () => {
  const { svc, ai } = await moQuan();
  assert.ok(ai, "cả buổi không ai CÓ TÊN ghé");
  svc.shadeFree = true;
  svc.applyTalkOption(ai, { act: { kind: "STAND_IN_SHADE", forSec: 90 } });
  svc.tickNpcs(0.05, { minutes: svc.nowMin, pressure: true, dayOver: false });
  assert.equal(svc.shadeFree, false, "một người đang trú mà chỗ mát vẫn khai là trống");
  svc.applyTalkOption(ai, { act: { kind: "LEAVE_SHADE" } });
  svc.tickNpcs(0.05, { minutes: svc.nowMin, pressure: true, dayOver: false });
  assert.equal(svc.shadeFree, true, "tiễn rồi mà chỗ mát vẫn kẹt — người sau không vô được");
});
