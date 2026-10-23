import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TalkStore } from "../src/content/talks";
import { walkNodes, type TalkNode } from "../src/sim/talk";
import { INVITE_BASE, inviteChance } from "../src/sim/passersby";

const TALKS = await TalkStore.loadAll();

test("R-1 rao làm người ĐANG ĐI NGANG ngoái lại", async () => {
  const w = newGame("rao", "p209");
  const bus = new Bus(false); const platform = memoryPlatform();
  for (let d = 1; d < 9; d++) nextDay(w);
  const h = new HeadlessStall(w, POLICIES.greedy, { bus, platform });
  const svc = (h as unknown as { service: any }).service;

  let ngoai = 0, thu = 0;
  for (let i = 0; i < 60000 && thu < 25; i++) {
    h.step(1000 / 30);
    if (i % 97) continue;
    const dangDi = svc.customers.filter((c: any) => c.ambient && c.pass && c.pass.stay <= 0 && c.pass.until < 0);
    if (!dangDi.length) continue;
    thu++;
    const truoc = dangDi.length;
    (svc as any).rao(12);
    const con = svc.customers.filter((c: any) => c.ambient && c.pass && c.pass.stay <= 0 && c.pass.until < 0).length;
    ngoai += truoc - con;
  }
  assert.ok(thu > 0, "cả buổi không có lúc nào có người đi thẳng ngang qua");
  assert.ok(ngoai > 0, `rao ${thu} lần mà không ai ngoái lại — vậy dì Liên dạy làm gì`);
});

test("R-2 ngoái lại chỉ MỞ CỬA cho câu mời, không tự thành khách", () => {
  const o = {
    soldOut: false, tone: "AM" as const, ahead: 0, slots: 6,
    person: { thanThien: 0.5, deTha: 0.5, soi: 0.5 },
  };
  const diThang = inviteChance({ ...o, glanced: false } as never);
  const ngoaiLai = inviteChance({ ...o, glanced: true } as never);
  assert.ok(ngoaiLai > diThang, "ngoái lại mà cơ hội mời không nhích");
  assert.ok(ngoaiLai < 1, "ngoái lại không được thành chắc chắn mua");
  void INVITE_BASE;
});

test("R-3 câu rao mang act RAO và ĐẶT CỜ bà đã dạy", () => {
  let co = 0;
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      const n = node as TalkNode;
      if ((n.act as { kind?: string } | undefined)?.kind !== "RAO") continue;
      co++;
      assert.equal(n.flag, "sauRaoThu",
        `${t.id}: "${n.say}" — rao mà không đặt cờ, nhánh chú Đạt không bao giờ mở ra`);
    }
  }
  assert.ok(co >= 1, "không câu nào mang act RAO — cả cuộc `sau.rao` vẫn chạy không tải");
});
