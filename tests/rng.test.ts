import { test } from "node:test";
import assert from "node:assert/strict";
import { Rng, RngHub, ShuffleBag, fnv1a } from "../src/core/rng";

test("fnv1a ổn định — seed của một ngày không được đổi giữa các bản build", () => {
  assert.equal(fnv1a(""), 0x811c9dc5);
  assert.equal(fnv1a("abc|7"), fnv1a("abc|7"));
  assert.notEqual(fnv1a("abc|7"), fnv1a("abc|8"));
});

test("Rng theo bộ đếm: skipTo(n) ra đúng số thứ n, O(1)", () => {
  const a = new Rng(123);
  const seq = Array.from({ length: 50 }, () => a.next());
  const b = new Rng(123);
  b.skipTo(37);
  assert.equal(b.next(), seq[37]);
});

test("RngHub: cùng (saveId, ngày) → cùng dãy; khác ngày → khác dãy", () => {
  const h1 = new RngHub(); h1.beginDay("save-x", 7);
  const h2 = new RngHub(); h2.beginDay("save-x", 7);
  const h3 = new RngHub(); h3.beginDay("save-x", 8);
  const take = (h: RngHub) => Array.from({ length: 10 }, () => h.next("market"));
  const [a, b, c] = [take(h1), take(h2), take(h3)];
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
});

test("tách stream: đốt 20 số ở dialog KHÔNG dịch chuỗi số của gossip (§8e)", () => {
  const h1 = new RngHub(); h1.beginDay("s", 12);
  const h2 = new RngHub(); h2.beginDay("s", 12);
  for (let i = 0; i < 20; i++) h2.next("dialog-shufflebag");   // "hỏi thêm một câu" x20
  const g1 = Array.from({ length: 8 }, () => h1.next("gossip"));
  const g2 = Array.from({ length: 8 }, () => h2.next("gossip"));
  assert.deepEqual(g1, g2);
});

test("bộ đếm stream vào/ra save: reload giữa ngày tiếp tục đúng chỗ", () => {
  const h = new RngHub(); h.beginDay("s", 3);
  for (let i = 0; i < 13; i++) h.next("npc-schedule");
  const saved = h.toJSON();
  const expected = h.next("npc-schedule");
  const r = new RngHub(); r.fromJSON("s", 3, saved);
  assert.equal(r.next("npc-schedule"), expected);
});

test("shuffle-bag 8 biến thể, rút 40 lần: mỗi cái đúng 5 lần, không hai lần liền trùng", () => {
  for (let seed = 1; seed <= 30; seed++) {
    const rng = new Rng(seed);
    const bag = new ShuffleBag(8);
    const out = Array.from({ length: 40 }, () => bag.draw(rng));
    const counts = new Array(8).fill(0);
    for (const x of out) counts[x]++;
    assert.deepEqual(counts, new Array(8).fill(5), `seed ${seed}`);
    for (let i = 1; i < out.length; i++) assert.notEqual(out[i], out[i - 1], `seed ${seed} trùng ở ${i}`);
  }
});

test("shuffle-bag sống qua reload: rút 3/8, lưu, dựng lại, rút 5 → hết đúng túi", () => {
  const rng = new Rng(99);
  const bag = new ShuffleBag(8);
  const first = [bag.draw(rng), bag.draw(rng), bag.draw(rng)];
  const restored = new ShuffleBag(8, JSON.parse(JSON.stringify(bag.toJSON())));
  const rest = Array.from({ length: 5 }, () => restored.draw(rng));
  assert.deepEqual([...first, ...rest].sort(), [0, 1, 2, 3, 4, 5, 6, 7]);
});

test("mỗi lần refill tiêu đúng n-1 số RNG (điều kiện để skipTo đúng)", () => {
  const rng = new Rng(5);
  const bag = new ShuffleBag(8);
  const before = rng.counter;
  bag.draw(rng);
  assert.equal(rng.counter - before, 7);
  for (let i = 0; i < 7; i++) bag.draw(rng);
  assert.equal(rng.counter - before, 7);                   // chưa refill lần hai
  bag.draw(rng);
  assert.equal(rng.counter - before, 14);
});
