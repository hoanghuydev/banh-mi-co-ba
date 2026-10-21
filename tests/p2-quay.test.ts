import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES } from "../src/sim/headless";
import { TalkStore } from "../src/content/talks";
import { walkNodes, type TalkNode } from "../src/sim/talk";

async function quay(dirt: number) {
  const w = newGame("quay", "p209");
  const h = new HeadlessStall(w, POLICIES.greedy, { bus: new Bus(false), platform: memoryPlatform() });
  const svc = (h as unknown as { service: any }).service;
  for (let i = 0; i < 600; i++) h.step(1000 / 30);
  const c = svc.customers[0];
  if (!c) return null;
  svc.dirt = dirt;
  svc.handsDirty = false;
  const logs: string[] = [];
  const push = svc.out.push.bind(svc.out);
  svc.out.push = (...ev: any[]) => { for (const e of ev) if (e.kind === "log") logs.push(e.text); return push(...ev); };
  (svc as any).startFilm(c, 1);
  for (let i = 0; i < 200; i++) h.step(1000 / 30);
  return { logs, filming: c.filming };
}

test("Q-1 quay xong lúc quầy SẠCH thì đoạn quay ưng ý", async () => {
  const r = await quay(0);
  assert.ok(r, "không có khách nào để thử");
  assert.equal(r.filming, false, "quay hoài không cất máy");
  assert.ok(r.logs.some((l) => l.includes("quay xong một đoạn ưng ý")), "quầy sạch mà đoạn quay không ưng");
});

test("Q-2 quầy DƠ thì đoạn quay hỏng, và nó để lại dấu", async () => {
  const r = await quay(0.9);
  assert.ok(r);
  assert.equal(r.filming, false);
  assert.ok(r.logs.some((l) => l.includes("quầy chưa dọn")), "quay trúng quầy dơ mà không ghi lại gì");
});

test("Q-3 câu CHO PHÉP quay phải mang `FILM`, câu CẤM phải mang `STOP_FILM`", async () => {
  const talks = await TalkStore.loadAll();
  const act = (n: TalkNode) => (n.act as { kind?: string } | undefined)?.kind;
  let cho = 0, cam = 0;
  for (const t of talks) {
    for (const { node } of walkNodes(t)) {
      const k = act(node as TalkNode);
      if (k === "FILM") cho++;
      if (k === "STOP_FILM") cam++;
    }
  }
  assert.ok(cho >= 5, `mới ${cho} câu cho quay mang act — 13 nhắc mà gần như không câu nào làm gì`);
  assert.ok(cam >= 2, `mới ${cam} câu cấm quay mang act`);
});
