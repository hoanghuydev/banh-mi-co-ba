import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { HeadlessStall, POLICIES } from "../src/sim/headless";
import { dishFor, sayOrder, specOf } from "../src/sim/order";
import type { Customer } from "../src/sim/customer";
import type { TalkOrder } from "../src/sim/talk";

function atCounter(seed = "nhieu-o-1") {
  const w = newGame("t", seed);
  w.progress.dayIndex = 7;
  const h = new HeadlessStall(w, { ...POLICIES.greedy, name: "ro", workSec: [1e9, 1e9] }, { bus: new Bus() });
  h.run({ until: (x) => !!x.service.front && x.service.front.phase === "waiting" });
  h.service.stock = 10;
  return { h, c: h.service.front! };
}

const reorder = (h: HeadlessStall, c: Customer, o: TalkOrder) =>
  (h.service as unknown as { reorder(c: Customer, o: TalkOrder): void }).reorder(c, o);

test("câu gọi nói đúng số ổ", () => {
  const spec = { ...specOf({ mon: "opla", rau: "day-du", ot: 1, tuong: 1 }), qty: 2 };
  assert.match(sayOrder(spec), /^Cho hai ổ ốp la/);
});

test("đơn hai ổ: ổ đầu chưa trả tiền, đủ hai ổ mới trả gấp đôi", () => {
  const { h, c } = atCounter();
  reorder(h, c, { qty: 2 });
  assert.match(c.orderLine, /^Cho hai ổ /);
  h.service.drain();

  assert.equal(h.service.serveDish(dishFor(c.order!)).ok, true);
  assert.equal(c.phase, "waiting", "còn chờ ổ thứ hai");
  assert.equal(h.service.drain().filter((e) => e.kind === "paid").length, 0);

  assert.equal(h.service.serveDish(dishFor(c.order!)).ok, true);
  const paid = h.service.drain().filter((e) => e.kind === "paid");
  assert.equal(paid.length, 1);
  const one = (h.service as unknown as { priceOf(i: unknown): number }).priceOf(c.order!.intent);
  const p = paid[0] as { amount: number; tip?: number };
  assert.equal(p.amount - (p.tip ?? 0), 2 * one);
  assert.equal(c.phase, "leaving");
});

test("lời mở đổi món: đơn và câu gọi đổi theo", () => {
  const { h, c } = atCounter();
  reorder(h, c, { mon: "opla", ot: 2 });
  assert.equal(c.order!.intent.mon, "opla");
  assert.equal(c.order!.intent.ot, 2);
  assert.match(c.orderLine, /ốp la.*nhiều ớt/);
});
