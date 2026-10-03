/**
 * `any.banh` — *"Ờ thì… cho một ổ coi sao."* rồi đi mất.
 *
 * Lần thứ ba cùng một lớp lỗi, chủ dự án bắt được khi chơi:
 *
 *   *"bữa nay con làm mẻ ngon lắm. ngon thiệt ăn rồi biết. ờ cho một ổ. mà npc đi mất
 *   chứ không mua. vẫn là free word"*
 *
 * `any.json` là kho DÙNG CHUNG, nghĩa là một người ĐANG ĐI NGANG cũng nghe được. Câu đáp
 * chốt vụ mua mà nút không mang act nào ⇒ không đơn nào sinh ra, họ gật rồi đi tiếp.
 *
 * Hai lưới: nút đó giờ tách đôi theo `t.passing`, và nhánh người đi ngang BIẾN họ THÀNH
 * KHÁCH thật khi roll thuận — đo bằng `acceptInvite`, không đo bằng lời thoại.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { TalkStore } from "../src/content/talks";
import { walkNodes, type Talk } from "../src/sim/talk";

const TALKS: Talk[] = await TalkStore.loadAll();

test("AB-1 nhánh cho người đi ngang là `INVITE`, nhánh cho khách đang mua khoá `!t.passing`", () => {
  const t = TALKS.find((x) => x.id === "any.banh")!;
  const chot = [...walkNodes(t)]
    .map((x) => x.node)
    .filter((n) => /cho một ổ/.test(n.reply ?? "") || n.act?.kind === "INVITE");
  assert.equal(chot.length, 2, `mới ${chot.length} nhánh — phải có đúng hai: đi ngang và đang mua`);

  const moi = chot.find((n) => n.act?.kind === "INVITE");
  const mua = chot.find((n) => n.act?.kind !== "INVITE");
  assert.ok(moi, "không nhánh nào mời thật — người đi ngang gật rồi đi tiếp");
  assert.ok([moi!.need ?? []].flat().includes("t.passing"), "nhánh mời không khoá `t.passing`");
  assert.ok([mua!.need ?? []].flat().includes("!t.passing"),
    "nhánh cho khách đang mua không khoá `!t.passing` — nó vẫn tới tai người đang đi");
});

test("AB-2 cả hai kho dùng chung không còn câu chốt mua nào thiếu `INVITE`", () => {
  // Cùng mẫu với T017, nhắc lại ở tầng test để lưới không chỉ sống trong validator.
  const CHOT = /(cho|lấy|mua|làm|gói)\s+(?:\S+\s+){0,2}?(?:một|hai|ba|[123])?\s*(ổ|phần)(?![\p{L}])/iu;
  const KHAC = /ở (cổng|trường|chợ|nhà|bên)|bên kia|chỗ khác|hồi nãy|lúc nãy/iu;
  const xau: string[] = [];
  for (const t of TALKS) {
    if (t.npc !== "ANY" && t.npc !== "QUA_DUONG") continue;
    for (const { node } of walkNodes(t)) {
      const r = node.reply ?? "";
      if (!CHOT.test(r) || KHAC.test(r)) continue;
      if (node.act?.kind === "INVITE") continue;
      if ([node.need ?? [], node.while ?? []].flat().map(String).includes("!t.passing")) continue;
      xau.push(`${t.id}: ${r}`);
    }
  }
  assert.deepEqual(xau, [], "câu chốt mua không có `INVITE` — người đi ngang gật rồi đi mất");
});

test("AB-3 chạy thật: lời mời ĂN được thì người đi ngang thành KHÁCH, không chỉ đổi câu thoại", async () => {
  const { Bus } = await import("../src/core/eventbus");
  const { newGame } = await import("../src/core/save");
  const { memoryPlatform } = await import("../src/core/platform");
  const { HeadlessStall, POLICIES } = await import("../src/sim/headless");

  const w = newGame("anybanh", "p210");
  const bus = new Bus(false);
  const h = new HeadlessStall(w, POLICIES.greedy, { bus, platform: memoryPlatform() });
  const svc = (h as unknown as { service: any }).service;

  let nguoi: any = null;
  for (let i = 0; i < 40000 && !nguoi; i++) {
    h.step(1000 / 30);
    nguoi = svc.customers.find((c: any) => c.ambient && c.pass) ?? null;
  }
  assert.ok(nguoi, "cả buổi không ai đi ngang");

  const t = TALKS.find((x) => x.id === "any.banh")!;
  const moi = [...walkNodes(t)].map((x) => x.node).find((n) => n.act?.kind === "INVITE")!;
  svc.applyTalkOption(nguoi, { act: moi.act, tone: moi.tone });
  // `invite()` roll; thuận thì `acceptInvite` bỏ `ambient`/`pass` và đẩy họ vô hàng.
  // Thuận hay không là chuyện của roll — điều phải đúng là nó ĐI QUA đường đó, chứ không
  // phải rơi vào `return` im lặng như mọi `INVITE` gắn nhầm người.
  assert.ok(nguoi.ambient === false || nguoi.inviteRefused === true,
    "lời mời không đi tới đâu: vẫn đang đi ngang mà cũng không ghi là bị từ chối");
});
