/**
 * HAI ACT CUỐI CỦA BẢNG NỢ — `TAKE_CASH` và `OVERHEARD_BY`.
 *
 * `TAKE_CASH` — chiều VÀO của `PAY`. *"Ừ. Cô cầm lại."*: bé Su thối dư hai ngàn, mình cầm
 * lại, và két không nhích một đồng. Và nặng hơn: `phuc.quen · 1.1` *"Dạ hai chục thầy."*
 * là một câu NÓI DỐI — thầy Phúc trả rồi mà mình bảo chưa. CANON §8 đòi ăn gian phải có
 * LỢI THẬT thì nó mới là một lựa chọn; trước đợt này nó chỉ mất `rel −3` và không được gì,
 * tức là một nút không ai bấm.
 *
 * `OVERHEARD_BY` — *"Bà rảnh ghê, lo chuyện người ta."* nói ngay giữa hẻm bà Sáu đang gánh
 * đi qua. Trước đợt này chỉ mất `rel −3` với anh Dũng; **bà Sáu không biết gì**. Giá phải
 * nằm trong sổ của CHÍNH BÀ, và bà phải có một niềm tin hạng nhất để kể lại.
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
  for (let d = 1; d < 9; d++) nextDay(w, bus);
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

test("HA-4 `OVERHEARD_BY` ghi vết vào sổ của NGƯỜI BỊ NÓI, và chỉ khi họ đứng gần", () => {
  const { h, svc } = dung();
  for (let i = 0; i < 20000 && svc.customers.length < 1; i++) h.step(1000 / 30);
  const noi = svc.customers[0];
  const act = { kind: "OVERHEARD_BY" as const, ai: "BA_SAU", vet: "RUDE_TO_THEM" as const, intensity: 60 };

  // (a) bà Sáu KHÔNG có mặt — không ai nghe, không ghi gì. Đây là một nước đi hợp lệ.
  const dem = () => { const m = svc.mem("BA_SAU").memory; return m.short.length + m.long.length + (m.core ? 1 : 0); };
  const truoc = dem();
  svc.applyTalkOption(noi, { act });
  assert.equal(dem(), truoc, "bà Sáu không có mặt mà vẫn bị ghi vết");

  // (b) bà Sáu đứng ngay đó — phải ghi, và phải ghi vào sổ CỦA BÀ.
  const sau = { ...noi, memKey: "BA_SAU", phase: "queueing", x: noi.x, y: noi.y, personality: noi.personality };
  svc.customers.push(sau);
  svc.applyTalkOption(noi, { act });
  assert.ok(dem() > truoc, "bà Sáu đứng ngay đó nghe hết mà sổ của bà trống trơn");
  assert.ok(svc.mem("BA_SAU").memory.short.some((m: any) => m.kind === "RUDE_TO_THEM"),
    "ghi vết mà không phải vết bị nói xấu");
});
