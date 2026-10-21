import { test } from "node:test";
import assert from "node:assert/strict";
import { newGame, type SaveFile } from "../src/core/save";
import { HeadlessStall, POLICIES, type Policy } from "../src/sim/headless";
import { ASIDE_SPOT, QUEUE_SLOTS } from "../src/world/map";
import type { Customer } from "../src/sim/customer";
import type { Service } from "../src/sim/service";

const CHAM: Policy = { ...POLICIES.greedy, name: "cham", workSec: [25, 40] };

// Gọi thẳng để khỏi phụ thuộc roll.
type Inner = { stepAside(c: Customer): void };
const inner = (svc: Service) => svc as unknown as Inner;

const dayOf = (day: number): SaveFile => {
  const w = newGame("aside", "aside-seed");
  w.progress.dayIndex = day;
  return w;
};

const toQueue = (c: Customer) =>
  Math.min(...QUEUE_SLOTS.map((s) => Math.hypot(s.x - c.x, s.y - c.y)));

function twoInLine(h: HeadlessStall): [Customer, Customer] | null {
  for (let i = 0; i < 30 * 60 * 20 && !h.closed; i++) {
    h.step(1000 / 30);
    const q = h.service.customers.filter((c) => c.phase !== "leaving" && !c.pass && !c.balking);
    const front = q.find((c) => c.slot === 0 && (c.phase === "ordering" || c.phase === "waiting"));
    const behind = q.find((c) => c.slot === 1);
    if (front && behind) return [front, behind];
  }
  return null;
}

test("dạt qua một bên là RA KHỎI HÀNG THẬT, không phải đổi chỗ trong hàng", () => {
  const h = new HeadlessStall(dayOf(13), CHAM, {});
  const pair = twoInLine(h);
  assert.ok(pair, "chạy hết buổi mà không lúc nào có hai người xếp hàng");
  const [first, second] = pair!;

  inner(h.service).stepAside(first);

  assert.equal(first.aside, true, "bảo dạt ra mà cờ `aside` không bật");
  assert.equal(first.slot, -1, "người đang nép vẫn được cấp một chỗ trong hàng");
  assert.equal(second.slot, 0, "nhường rồi mà người sau không lên trước quầy");

  for (let i = 0; i < 30 * 4; i++) h.step(1000 / 30);
  assert.equal(first.aside, true, "mới nép đã vào lại — người được nhường chưa mua xong");
  assert.ok(toQueue(first) > 0.8, `còn đứng trên hàng (cách chỗ gần nhất ${toQueue(first).toFixed(2)} ô)`);
  assert.ok(Math.hypot(ASIDE_SPOT.x - first.x, ASIDE_SPOT.y - first.y) < 0.4, "không tới được chỗ nép");
  assert.ok(first.y > QUEUE_SLOTS[0].y + 0.5, "nép mà vẫn đứng đúng hàng người ta xếp");
});

test("nhường xong thì bước TRỞ VÔ hàng — không đứng ngoài lề tới hết lượt ghé", () => {
  const h = new HeadlessStall(dayOf(13), CHAM, {});
  const pair = twoInLine(h);
  assert.ok(pair, "chạy hết buổi mà không lúc nào có hai người xếp hàng");
  const [first, second] = pair!;

  inner(h.service).stepAside(first);
  assert.equal(first.asideFor, second.id, "không ghi mình đang nhường ai");

  for (let i = 0; i < 30 * 60 * 6 && !h.closed && first.aside; i++) h.step(1000 / 30);
  assert.equal(first.aside, false, "người mình nhường đi rồi mà vẫn đứng nép ngoài lề");
  assert.notEqual(first.phase, "leaving", "nép xong là bỏ về — cái act này đang đuổi khách");

  for (let i = 0; i < 30 * 10 && toQueue(first) > 0.5; i++) h.step(1000 / 30);
  assert.ok(toQueue(first) < 0.5, "vào lại hàng mà không đứng vào chỗ nào");
});

test("không có ai sau lưng thì nép một nhịp rồi tự vào lại — không bị bỏ quên", () => {
  const h = new HeadlessStall(dayOf(2), POLICIES.greedy, {});
  let alone: Customer | null = null;
  for (let i = 0; i < 30 * 60 * 20 && !h.closed && !alone; i++) {
    h.step(1000 / 30);
    const q = h.service.customers.filter((c) => c.phase !== "leaving" && !c.pass && !c.balking);
    if (q.length === 1 && q[0].slot === 0 && (q[0].phase === "ordering" || q[0].phase === "waiting")) alone = q[0];
  }
  assert.ok(alone, "chạy hết buổi mà không lúc nào có đúng một người đứng quầy");

  inner(h.service).stepAside(alone!);
  assert.equal(alone!.asideFor, null, "không có ai sau lưng mà vẫn ghi là đang nhường ai đó");
  assert.equal(alone!.aside, true);

  // ASIDE_HOLD_SEC = 6 s, chạy dư 12 s.
  for (let i = 0; i < 30 * 12 && alone!.aside; i++) h.step(1000 / 30);
  assert.equal(alone!.aside, false, "đứng nép mãi trong khi quầy trống trơn");
});
