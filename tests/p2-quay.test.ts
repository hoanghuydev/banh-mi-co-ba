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
  const posts = w.vietsoci.posts.length;
  (svc as any).startFilm(c, 1, "su");
  for (let i = 0; i < 200; i++) h.step(1000 / 30);
  return { post: w.vietsoci.posts.length > posts ? w.vietsoci.posts[0] : null, filming: c.filming };
}

test("Q-1 quay xong lúc quầy SẠCH thì clip sạch lên VietSoci", async () => {
  const r = await quay(0);
  assert.ok(r, "không có khách nào để thử");
  assert.equal(r.filming, false, "quay hoài không cất máy");
  assert.equal(r.post?.img, "clip_sach");
});

test("Q-2 quầy DƠ thì clip dính ruồi", async () => {
  const r = await quay(0.9);
  assert.ok(r);
  assert.equal(r.filming, false);
  assert.equal(r.post?.img, "clip_ruoi", "quay trúng quầy dơ mà clip vẫn sạch");
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
