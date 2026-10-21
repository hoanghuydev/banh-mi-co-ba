import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { HeadlessStall, POLICIES } from "../src/sim/headless";
import { dishFor } from "../src/sim/order";
import type { Customer } from "../src/sim/customer";

type Ev = { e: string; p: any };

/** `workSec` khổng lồ để bot không tự đưa bánh. */
function atCounter(day = 7) {
  const bus = new Bus();
  const ev: Ev[] = [];
  bus.onAny((e, p) => { if (e !== "clock:tick") ev.push({ e, p: p as any }); });
  const w = newGame("t", "soil-save");
  w.progress.dayIndex = day;
  const h = new HeadlessStall(w, { ...POLICIES.greedy, name: "ro", workSec: [1e9, 1e9] }, { bus });
  h.run({ until: (x) => !!x.service.front && x.service.front.phase === "waiting" && !!x.service.front.npc });
  const c = h.service.front!;
  assert.ok(c?.npc, "bài này cần một người CÓ TÊN");
  ev.length = 0;
  return { h, bus, ev, c };
}

function sawTheDrop(c: Customer, peak: "NOTICED" | "CONFIRMED" = "CONFIRMED") {
  c.observations.set(`DROPPED_FOOD:${c.id}`, {
    id: "DROPPED_FOOD", slot: "HANDS", certainty: peak === "CONFIRMED" ? 1 : 0.8, peak, diedAt: null,
  });
}

const pick = (ev: Ev[], e: string) => ev.filter((x) => x.e === e).map((x) => x.p);

test("THẤY ổ rớt mà vẫn đưa: không bán được, khách bỏ về", () => {
  const { h, ev, c } = atCounter();
  sawTheDrop(c);
  const cashBefore = h.ctx.world.money.cash;

  const res = h.service.serveDish(dishFor(c.order!), { soiled: true });

  assert.equal(res.ok, false, "không có lượt giao nào hết — lắc đầu là lắc đầu");
  assert.ok(res.reason && res.reason.length > 0 && res.reason.length <= 40, `toast phải ngắn: "${res.reason}"`);
  assert.equal(c.phase, "leaving");
  assert.equal(c.leaveReason, "soiled");
  assert.deepEqual(pick(ev, "npc:left").map((p) => p.reason), ["SOILED_FOOD"]);
  assert.equal(pick(ev, "order:delivered").length, 0);
  assert.equal(h.ctx.world.money.cash, cashBefore);
  assert.equal(h.service.servedCount, 0);
});

test("bị bắt: tính là một người chơi ĐỂ MẤT — khác hẳn chuyện quay đầu vì đông", () => {
  const { h, c } = atCounter();
  const lostBefore = h.service.lostCount;
  sawTheDrop(c);
  h.service.serveDish(dishFor(c.order!), { soiled: true });
  assert.equal(h.service.lostCount, lostBefore + 1);
  assert.equal(h.service.balkedCount, 0, "đừng lẫn hai cửa mất khách vào nhau");
});

test("chỉ LIẾC THẤY (NOTICED) cũng đủ để không ăn — không cần CONFIRMED", () => {
  const { h, c } = atCounter();
  sawTheDrop(c, "NOTICED");
  const res = h.service.serveDish(dishFor(c.order!), { soiled: true });
  assert.equal(res.ok, false);
});

test("KHÔNG thấy: vẫn bán được, vẫn nhận tiền", () => {
  const { h, ev, c } = atCounter();
  const cashBefore = h.ctx.world.money.cash;
  const res = h.service.serveDish(dishFor(c.order!), { soiled: true });
  for (let i = 0; i < 30; i++) h.step();               // tiền chảy qua `service.out`, cần vài frame

  assert.equal(res.ok, true);
  assert.deepEqual(pick(ev, "npc:left").map((p) => p.reason), ["SERVED"]);
  assert.equal(pick(ev, "order:delivered").length, 1);
  assert.equal(h.ctx.world.progress.today.served, 1, "họ có biết gì đâu mà không nhận bánh");
  assert.ok(h.ctx.world.money.cash >= cashBefore);
  assert.equal(h.service.lostCount, 0);
});

test("thấy ổ rớt, rồi được đưa ổ KHÁC còn sạch: không có gì xảy ra hết", () => {
  const { h, ev, c } = atCounter();
  sawTheDrop(c);
  const res = h.service.serveDish(dishFor(c.order!), {});

  assert.equal(res.ok, true, "làm rớt một ổ rồi nướng ổ khác thì không bị phạt");
  assert.deepEqual(pick(ev, "npc:left").map((p) => p.reason), ["SERVED"]);
});

test("ổ sạch cho người KHÔNG thấy gì: bán như thường", () => {
  const { h, c } = atCounter();
  const res = h.service.serveDish(dishFor(c.order!), {});
  assert.equal(res.ok, true);
});

test("tất định: cùng seed, cùng thao tác → mọi sự kiện giống hệt từng byte", () => {
  const once = (soiled: boolean, saw: boolean) => {
    const { h, ev, c } = atCounter();
    if (saw) sawTheDrop(c);
    h.service.serveDish(dishFor(c.order!), { soiled });
    for (let i = 0; i < 60; i++) h.step();
    return JSON.stringify(ev);
  };
  for (const [soiled, saw] of [[true, true], [true, false], [false, true]] as const) {
    assert.equal(once(soiled, saw), once(soiled, saw), `soiled=${soiled} saw=${saw}`);
  }
});
