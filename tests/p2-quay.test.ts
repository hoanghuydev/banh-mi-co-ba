/**
 * BÉ SU QUAY PHIM THẬT — act `FILM` / `STOP_FILM`.
 *
 * `P2-08` §2 nhóm C: *"quay phim là lý do tồn tại của nhân vật"*. Mà trước đợt này mười
 * ba câu "ừ con quay đi" không làm ai giơ điện thoại lên, còn cái clip thì đã có sẵn chỗ
 * trong kinh tế từ lâu (`story.clipDay` → ×1,4 lượng khách ba ngày) — do KỊCH BẢN đặt,
 * không do bé Su quay được cái gì.
 *
 * Bốn chuyện phải đúng, và cả bốn đều là "cái clip phải phụ thuộc vào mình làm gì".
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES } from "../src/sim/headless";
import { TalkStore } from "../src/content/talks";
import { walkNodes, type TalkNode } from "../src/sim/talk";
import { storyCrowdMul } from "../src/sim/story";

async function quay(dirt: number) {
  const w = newGame("quay", "p209");
  const h = new HeadlessStall(w, POLICIES.greedy, { bus: new Bus(false), platform: memoryPlatform() });
  const svc = (h as unknown as { service: any }).service;
  for (let i = 0; i < 600; i++) h.step(1000 / 30);
  const c = svc.customers[0];
  if (!c) return null;
  svc.dirt = dirt;
  svc.handsDirty = false;
  (svc as any).startFilm(c, 1);
  for (let i = 0; i < 200; i++) h.step(1000 / 30);
  return { st: svc.deps.story, filming: c.filming };
}

test("Q-1 quay xong lúc quầy SẠCH thì cái clip tới sớm", async () => {
  const r = await quay(0);
  assert.ok(r, "không có khách nào để thử");
  assert.equal(r.filming, false, "quay hoài không cất máy");
  assert.ok(Number(r.st.flags.clipDay) < 99, "quay xong mà `clipDay` không nhích — cái clip vẫn là số kịch bản");
  assert.equal(r.st.flags.clipBad, undefined);
});

test("Q-2 quầy DƠ thì không có clip tốt, và nó để lại dấu", async () => {
  const r = await quay(0.9);
  assert.ok(r);
  assert.equal(r.filming, false);
  assert.ok(r.st.flags.clipBad !== undefined, "quay trúng quầy dơ mà không ghi lại gì");
});

test("Q-3 clip tới sớm thì LƯỢNG KHÁCH nhảy thật — không phải một con số nằm im", () => {
  const st = (d?: number) => ({ flags: d === undefined ? {} : { clipDay: d } }) as never;
  const thuong = storyCrowdMul(14, st(10), { hasQr: false });
  const coClip = storyCrowdMul(14, st(13), { hasQr: false });
  assert.ok(coClip > thuong * 1.3, `clip lên mà lượng khách chỉ ${(coClip / thuong).toFixed(2)}×`);
});

test("Q-4 câu CHO PHÉP quay phải mang `FILM`, câu CẤM phải mang `STOP_FILM`", async () => {
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
