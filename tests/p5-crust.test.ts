import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { HeadlessStall, POLICIES } from "../src/sim/headless";
import { INGREDIENTS, dishFor, type Ingredient, type OrderSpec } from "../src/sim/order";
import { CRUST } from "../src/sim/oven";

type Ev = { e: string; p: any };

const RAW = 0.2, CRISP = 0.66, SINGED = 1.05;

function atCounter(seed = "crust-1") {
  const bus = new Bus();
  const ev: Ev[] = [];
  bus.onAny((e, p) => { if (e !== "clock:tick") ev.push({ e, p: p as any }); });
  const w = newGame("t", seed);
  w.progress.dayIndex = 7;
  const h = new HeadlessStall(w, { ...POLICIES.greedy, name: "ro", workSec: [1e9, 1e9] }, { bus });
  h.run({ until: (x) => !!x.service.front && x.service.front.phase === "waiting" && !!x.service.front.npc });
  const c = h.service.front!;
  assert.ok(c?.npc, "bài này cần một người CÓ TÊN");
  ev.length = 0;
  return { h, ev, c };
}

const pick = (ev: Ev[], e: string) => ev.filter((x) => x.e === e).map((x) => x.p);
const diffed = (ev: Ev[]) => pick(ev, "delivery:diffed")[0];
const without = (dish: Ingredient[], ...ids: Ingredient[]) => dish.filter((x) => !ids.includes(x));
// Tránh nhân mặn vì rút hết nhân thành `HOLLOW_LOAF`.
function dropMe(spec: OrderSpec): Ingredient {
  const i = INGREDIENTS.find((x) => x.kind !== "nhan" && (spec.levels[x.id] ?? 0) > 0);
  assert.ok(i, "đơn này không có rau nào để bỏ bớt — đổi seed");
  return i.id;
}

// Lọc theo `memKey` vì câu đầu thường là lời chào của người đứng kế bên.
function linesOf(h: HeadlessStall, ev: Ev[], memKey: string) {
  h.run({ maxFrames: 1200 });
  return pick(ev, "dialog:spoken").filter((p) => p.npcId === memKey).map((p) => p.text as string);
}

test("rút sớm quá: ổ chưa giòn là một LỖI, và khách nói ra", () => {
  const { h, ev, c } = atCounter();
  h.service.serveDish(dishFor(c.order!), { crust: RAW });
  const d = diffed(ev);
  assert.equal(d.defects.length, 1, "đúng một lỗi: cái vỏ bánh");
  assert.equal(d.defects[0].kind, "WRONG_TEMP");
  assert.equal(d.defects[0].text, "bánh nướng chưa tới");
  assert.ok(d.spoken, "ổ có lỗi thì không bao giờ im");
});

test("rút trễ quá (dải SINGED): ổ cháy cạnh cũng là một LỖI", () => {
  const { h, ev, c } = atCounter();
  h.service.serveDish(dishFor(c.order!), { crust: SINGED });
  const d = diffed(ev);
  assert.equal(d.defects.length, 1);
  assert.equal(d.defects[0].kind, "WRONG_TEMP");
  assert.equal(d.defects[0].text, "bánh cháy cạnh rồi");
  assert.ok(d.spoken);
});

test("giữa dải GIÒN thì không ai nói gì — vùng tốt vẫn rộng như cũ", () => {
  const { h, ev, c } = atCounter();
  h.service.serveDish(dishFor(c.order!), { crust: CRISP });
  assert.equal(diffed(ev).defects.length, 0);
});

test("lò điện có `burnAt` riêng: dải tốt của nó KHÔNG bị đọc thành cháy cạnh", () => {
  // `CRUST.SINGED` (0,88) < 1,05 < `burnAt` lò điện (1,7): lò thường thì sém, lò điện thì chưa.
  const { h, ev, c } = atCounter();
  h.service.serveDish(dishFor(c.order!), { crust: 0.8, burnAt: 1.7 });
  assert.equal(diffed(ev).defects.length, 0, "0,80 vẫn nằm trong dải GIÒN của mọi lò");
  assert.ok(0.8 < CRUST.SINGED);
});

test("vừa thiếu món vừa chưa giòn: câu chính nói chuyện THIẾU MÓN", () => {
  const { h, ev, c } = atCounter();
  const miss = dropMe(c.order!);
  h.service.serveDish(without(dishFor(c.order!), miss), { crust: RAW });
  const d = diffed(ev);
  assert.ok(d.defects.length >= 2, "hệ vẫn ghi đủ cả hai lỗi");
  assert.ok(d.defects.some((x: any) => x.text === "bánh nướng chưa tới"));
  assert.notEqual(d.spoken?.text, "bánh nướng chưa tới", "vỏ bánh KHÔNG được là câu chính");
});

test("câu nói ra gồm CẢ HAI vế: chuyện thiếu món rồi tới chuyện vỏ bánh", () => {
  const { h, ev, c } = atCounter();
  const miss = dropMe(c.order!);
  h.service.serveDish(without(dishFor(c.order!), miss), { crust: SINGED });
  const lines = linesOf(h, ev, c.memKey);
  const line = lines.find((t) => /cháy cạnh|chưa giòn|vỏ/.test(t));
  assert.ok(line, `phải có một câu nhắc tới cái vỏ bánh — đang có: ${JSON.stringify(lines)}`);
});

test("ổ có lỗi KHÔNG qua túi im lặng — hai chục lượt liền đều có câu", () => {
  for (let i = 0; i < 20; i++) {
    const { h, ev, c } = atCounter(`im-${i}`);
    h.service.serveDish(dishFor(c.order!), { crust: RAW });
    assert.ok(diffed(ev).spoken, `lượt ${i}: ổ chưa giòn mà khách im`);
  }
});

test("cho thêm: chủ quán nói ra mình cho thêm gì, có kể tên món", () => {
  const { h, c } = atCounter();
  const r = h.service.serveDish([...dishFor(c.order!), "dochua", "ot"], { crust: CRISP });
  assert.ok(r.playerSay, "bỏ thêm đồ mà không ai nói gì thì người chơi không biết hệ có đọc ra");
  assert.match(r.playerSay!, /đồ chua/);
  assert.match(r.playerSay!, /ớt/);
  assert.doesNotMatch(r.playerSay!, /\{/, "danh xưng phải được điền, không để nguyên {call}");
});

test("không cho thêm gì thì chủ quán không nói gì", () => {
  const { h, c } = atCounter();
  assert.equal(h.service.serveDish(dishFor(c.order!), { crust: CRISP }).playerSay, undefined);
});

test("cho thêm trên ổ CÓ LỖI: vẫn nói ra, và khách vẫn cảm ơn trước khi chê", () => {
  const { h, ev, c } = atCounter();
  const miss = dropMe(c.order!);
  const r = h.service.serveDish([...without(dishFor(c.order!), miss), "ot"], { crust: RAW });
  assert.ok(r.playerSay, "ổ trật thì tấm lòng vẫn là tấm lòng");
  const lines = linesOf(h, ev, c.memKey);
  assert.ok(lines.some((t) => /ơn/.test(t)), `phải có một tiếng cảm ơn — đang có: ${JSON.stringify(lines)}`);
});
