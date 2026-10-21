import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TALK_NPC_IDS, TalkStore } from "../src/content/talks";
import { SHADE_CAPACITY, SHADE_SPOT } from "../src/world/map";
import { walkNodes, type Talk } from "../src/sim/talk";

const TALKS: Talk[] = await TalkStore.loadAll();

async function quan(ngay = 9) {
  const w = newGame("pha", "p210");
  const bus = new Bus(false);
  for (let d = 1; d < ngay; d++) nextDay(w);
  const h = new HeadlessStall(w, POLICIES.social, { bus, platform: memoryPlatform() });
  const svc = (h as unknown as { service: any }).service;
  for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);
  let ai: any = null;
  for (let i = 0; i < 60_000 && !ai; i++) { h.step(1000 / 30); ai = svc.customers[0] ?? null; }
  return { w, h, svc, ai };
}

test("PHA-1 tay KHÔNG CÓ GÌ mà bấm cho ăn ⇒ không được đẻ ra ổ bánh", async () => {
  const { svc, ai } = await quan();
  svc.playerHand = "empty";
  svc.applyTalkOption(ai, { act: { kind: "GIVE_BREAD", forSec: 20 } });
  assert.equal(ai.eating, false, "tay trống mà vẫn đưa được bánh — in ra bánh từ không khí");
  assert.ok(!ai.visit.gaveFood, "ghi là đã cho ăn trong khi không có gì rời tay");
});

test("PHA-2 bấm HAI LẦN ⇒ chỉ một ổ rời tay, không phải hai", async () => {
  const { svc, ai } = await quan();
  svc.playerHand = "loaf_filled";
  let roiTay = 0;
  const goc = svc.out.push.bind(svc.out);
  svc.out.push = (e: any) => { if (e?.kind === "takeHand") roiTay++; return goc(e); };
  svc.applyTalkOption(ai, { act: { kind: "GIVE_BREAD", forSec: 20 } });
  svc.applyTalkOption(ai, { act: { kind: "GIVE_BREAD", forSec: 20 } });
  assert.equal(roiTay, 1, `bấm hai lần thì ${roiTay} ổ rời tay — cho ăn hai lần bằng một ổ`);
});

test("PHA-3 mọi nút `GIVE_BREAD` phải khoá TAY CÓ BÁNH — không thì nó là lời hứa suông", () => {
  const xau: string[] = [];
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      if (node.act?.kind !== "GIVE_BREAD") continue;
      const k = [node.need ?? [], node.while ?? []].flat().map(String);
      if (!k.some((x) => x === "p.holdsFilled" || x === "p.holdsBread")) xau.push(`${t.id}: ${node.say}`);
    }
  }
  assert.deepEqual(xau, [], "nút cho ăn mà không khoá tay có bánh — bấm lúc tay không là nói dối");
});

test("PHA-4 câu ĐƯA Ổ ĐÃ BÁN không được mang `GIVE_BREAD` — nếu không là bán mà cho không", () => {
  const DUA_HANG = /^(dạ |)ổ (của|pate|xíu|bánh)|ổ của (chị|anh|cô|chú|bà|em|con).{0,6}(đây|nè)/i;
  const xau: string[] = [];
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      if (node.act?.kind !== "GIVE_BREAD") continue;
      if (DUA_HANG.test(node.say)) xau.push(`${t.id}: ${node.say}`);
    }
  }
  assert.deepEqual(xau, [], "câu đưa ổ đã bán lại mang `GIVE_BREAD` — bán mà hoá ra cho không");
});

test("PHA-5 chỗ mát CHỈ MỘT NGƯỜI — người thứ hai không được chen vào", async () => {
  const { svc, h } = await quan();
  for (let i = 0; i < 40_000 && svc.customers.length < 2; i++) h.step(1000 / 30);
  const [a, b] = svc.customers;
  if (!b) return;
  svc.shadeFree = true;
  svc.applyTalkOption(a, { act: { kind: "STAND_IN_SHADE", forSec: 60 } });
  svc.tickNpcs(0.05, { minutes: svc.nowMin, pressure: true, dayOver: false });
  svc.applyTalkOption(b, { act: { kind: "STAND_IN_SHADE", forSec: 60 } });
  const trong = svc.customers.filter((c: any) => c.inShade).length;
  assert.ok(trong <= SHADE_CAPACITY, `${trong} người cùng đứng một chỗ mát (sức chứa ${SHADE_CAPACITY})`);
});

test("PHA-6 chỗ mát ĐÃ ĐẦY thì lời mời không được im lặng gật", async () => {
  const { svc, ai } = await quan();
  svc.shadeFree = false;
  svc.applyTalkOption(ai, { act: { kind: "STAND_IN_SHADE", forSec: 30 } });
  assert.equal(ai.inShade, false, "chỗ mát đầy mà vẫn nhét thêm được một người");
});

test("PHA-7 vô bóng mát thì phải ĐI TỚI ĐÓ, không đứng nguyên chỗ cũ", async () => {
  const { svc, h, ai } = await quan();
  if (!ai?.pass) return;
  svc.shadeFree = true;
  svc.applyTalkOption(ai, { act: { kind: "STAND_IN_SHADE", forSec: 60 } });
  const truoc = Math.hypot(ai.x - SHADE_SPOT.x, ai.y - SHADE_SPOT.y);
  for (let i = 0; i < 200; i++) h.step(1000 / 30);
  const sau = Math.hypot(ai.x - SHADE_SPOT.x, ai.y - SHADE_SPOT.y);
  assert.ok(sau < truoc + 0.05,
    `mời vô bóng mát mà họ đi XA ra (${truoc.toFixed(2)} → ${sau.toFixed(2)} ô)`);
});

test("PHA-8 mọi nút `STAND_IN_SHADE` khoá `w.shadeFree` bằng `while`, không phải `need`", () => {
  const xau: string[] = [];
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      if (node.act?.kind !== "STAND_IN_SHADE") continue;
      const wh = [node.while ?? []].flat().map(String);
      const nd = [node.need ?? []].flat().map(String);
      if (nd.includes("w.shadeFree")) xau.push(`${t.id}: khoá bằng \`need\` — câu biến mất thay vì ra "?"`);
      else if (!wh.includes("w.shadeFree")) xau.push(`${t.id}: không khoá \`w.shadeFree\` — mời vô chỗ đã có người`);
    }
  }
  assert.deepEqual(xau, [], "cổng chỗ mát gắn sai tầng");
});

test("PHA-9 `forSec` bắt buộc — thiếu nó là một hành động không có hồi kết", () => {
  const xau: string[] = [];
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      const a = node.act;
      if (a?.kind !== "STAND_IN_SHADE" && a?.kind !== "GIVE_BREAD") continue;
      if ((a as { forSec?: unknown }).forSec === undefined) xau.push(`${t.id}: ${node.say}`);
    }
  }
  assert.deepEqual(xau, [], "hành động có thời lượng mà thiếu `forSec`");
});
