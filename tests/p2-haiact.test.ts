/**
 * `TAKE_CASH` và `OVERHEARD_BY`.
 *
 * `TAKE_CASH` — chiều VÀO của `PAY`: bé Su thối dư hai ngàn mình cầm lại, hay `phuc.quen · 1.1`
 * nói dối thầy Phúc là chưa trả. CANON §8 đòi ăn gian phải có LỢI THẬT thì mới là một lựa chọn.
 *
 * `OVERHEARD_BY` — nói xấu bà Sáu giữa hẻm chỉ có hậu quả khi bà đứng đủ gần để nghe.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TalkStore } from "../src/content/talks";
import { walkNodes, type Talk } from "../src/sim/talk";

const TALKS: Talk[] = await TalkStore.loadAll();

const dung = () => {
  const w = newGame("haiact", "p210");
  const bus = new Bus(false);
  for (let d = 1; d < 9; d++) nextDay(w);
  const h = new HeadlessStall(w, POLICIES.greedy, { bus, platform: memoryPlatform() });
  return { w, bus, h, svc: (h as unknown as { service: any }).service };
};

test("HA-1 cả hai act đều có nút nội dung gọi tới — act không ai gọi là act chết", () => {
  const dem = (k: string) =>
    TALKS.flatMap((t) => [...walkNodes(t)]).filter((x) => x.node.act?.kind === k).length;
  assert.ok(dem("TAKE_CASH") >= 3, `TAKE_CASH mới ${dem("TAKE_CASH")} nút`);
  assert.ok(dem("OVERHEARD_BY") >= 1, "OVERHEARD_BY không nút nào gọi");
});

test("HA-2 `TAKE_CASH` làm tiền lẻ trong ống TĂNG thật", () => {
  const { h, svc } = dung();
  for (let i = 0; i < 20000 && !svc.customers.length; i++) h.step(1000 / 30);
  assert.ok(svc.customers.length, "cả buổi không ai tới");
  const truoc = svc.deps.till.floatLeft;
  svc.applyTalkOption(svc.customers[0], { act: { kind: "TAKE_CASH", vnd: 2000, note: "thử" } });
  assert.equal(svc.deps.till.floatLeft, truoc + 2000, "cầm tiền mà két không nhích");
});

test("HA-3 `TAKE_CASH` KHÔNG tính là doanh thu — nó là tiền quay lại ống", () => {
  const { h, svc } = dung();
  for (let i = 0; i < 20000 && !svc.customers.length; i++) h.step(1000 / 30);
  const ban = svc.sold ?? 0;
  svc.applyTalkOption(svc.customers[0], { act: { kind: "TAKE_CASH", vnd: 2000, note: "thử" } });
  assert.equal(svc.sold ?? 0, ban, "cầm lại tiền lẻ mà sổ ghi là bán được hàng");
});

test("HA-4 `OVERHEARD_BY` chỉ ăn khi người bị nói đứng gần", () => {
  const { h, svc } = dung();
  for (let i = 0; i < 20000 && svc.customers.length < 1; i++) h.step(1000 / 30);
  const noi = svc.customers[0];
  const act = { kind: "OVERHEARD_BY" as const, ai: "BA_SAU" };
  const nghe = () => svc.drainLogs().filter((l: string) => l.includes("nghe hết")).length;

  // (a) bà Sáu KHÔNG có mặt — không ai nghe. Đây là một nước đi hợp lệ.
  nghe();
  svc.applyTalkOption(noi, { act });
  assert.equal(nghe(), 0, "bà Sáu không có mặt mà vẫn nghe thấy");

  // (b) bà Sáu đứng ngay đó — người chơi phải thấy là bà nghe hết.
  const sau = { ...noi, memKey: "BA_SAU", phase: "queueing", x: noi.x, y: noi.y, personality: noi.personality };
  svc.customers.push(sau);
  svc.applyTalkOption(noi, { act });
  assert.equal(nghe(), 1, "bà Sáu đứng ngay đó mà không có gì xảy ra");
});
