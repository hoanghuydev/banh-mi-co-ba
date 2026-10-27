import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { HeadlessStall, POLICIES } from "../src/sim/headless";
import { dishFor, specOf, type Ingredient } from "../src/sim/order";
import { takesHollowLoaf } from "../src/sim/service";
import { NPCS, type Personality } from "../src/content/npcs";
import type { Customer } from "../src/sim/customer";
import RULES from "../src/content/rules/generic.json";

type Ev = { e: string; p: any };

function atCounter(seed = "hollow-1") {
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
  return { h, bus, ev, c };
}

// Thay object mới vì object cũ dùng chung với `content/npcs.ts`.
const setPerson = (c: Customer, p: Partial<Personality>) =>
  ((c as { personality: Personality }).personality = { ...c.personality, ...p });

const refuses = (c: Customer) => setPerson(c, { nongTinh: 0.9, deTha: 0.5 });
const takes = (c: Customer) => setPerson(c, { nongTinh: 0.2, deTha: 0.9 });

const pick = (ev: Ev[], e: string) => ev.filter((x) => x.e === e).map((x) => x.p);

const BARE: Ingredient[] = [];

test("ổ chưa có nhân: người dễ nổi không nhận — không bán được, ổ còn trong tay", () => {
  const { h, ev, c } = atCounter();
  refuses(c);
  const res = h.service.serveDish(BARE);

  assert.equal(res.ok, false, "lượt giao đó không xảy ra");
  assert.ok(res.reason && res.reason.length <= 40, `toast phải ngắn: "${res.reason}"`);
  assert.equal(pick(ev, "order:delivered").length, 0);
  assert.equal(h.service.drain().filter((e) => e.kind === "paid").length, 0, "không một đồng nào");
  assert.equal(c.phase, "waiting");
  assert.equal(h.service.lostCount, 0, "chưa mất ai hết — mất hay không là chuyện đồng hồ chờ");
});

test("không nhận: đưa lần nữa KHÔNG chê thêm — cái giá là thời gian", () => {
  const { h, ev, c } = atCounter();
  refuses(c);
  for (let i = 0; i < 3; i++) assert.equal(h.service.serveDish(BARE).ok, false);
  assert.equal(pick(ev, "bark:queued").filter((p) => p.npcId === c.memKey).length, 1, "ba lần lắc đầu là MỘT câu, không phải ba");
  assert.equal(pick(ev, "dialog:silent").filter((p) => p.reason === "NO_RULE").length, 0);
});

test("không nhận: đường ra là đi kẹp nhân cho đủ rồi đưa lại — và nó bán được", () => {
  const { h, ev, c } = atCounter();
  refuses(c);
  assert.equal(h.service.serveDish(BARE).ok, false);
  const res = h.service.serveDish(dishFor(c.order!));
  assert.equal(res.ok, true, "sửa xong thì phải bán được, không thì lắc đầu là đuổi khách");
  assert.equal(pick(ev, "order:delivered").length, 1);
});

test("ổ chưa có nhân: người điềm đạm + dễ tha vẫn cầm — trả tiền bánh mì không", () => {
  const { h, ev, c } = atCounter();
  takes(c);
  const res = h.service.serveDish(BARE);

  assert.equal(res.ok, true);
  assert.equal(pick(ev, "order:delivered").length, 1);
  const paid = h.service.drain().find((e) => e.kind === "paid");
  assert.ok(paid && paid.kind === "paid" && paid.amount === 10_000, "đưa ra cái gì thì tính tiền cái đó");
  assert.ok(pick(ev, "delivery:diffed")[0].defects.length >= 1, "cầm cho xong không phải là ổ đúng");
});

test("ổ chưa có nhân KHÔNG BAO GIỜ im — túi im lặng 7/20 không được nuốt tín hiệu này", () => {
  const pool = (RULES.rules as { id: string; say: string[] }[]).find((r) => r.id === "gen.hollow.take")!;
  const matches = (text: string) => pool.say.some((v) => {
    const re = new RegExp("^" + v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\{\w+\\\}/g, ".+") + "$", "i");
    return re.test(text);
  });

  const { h, ev, c } = atCounter();
  takes(c);
  const bagId = `silence:${c.memKey}`;
  // 7 vé đầu túi là vé im.
  h.ctx.world.shuffleBags[bagId] = { o: [0, 1, 2, 3, 4, 5, 6], l: -1, r: 1, t: 0 };
  h.service.serveDish(BARE);
  // 5 s đủ cho trần `HOLD_MAX_SEC` 3 s cộng trễ của `say()`.
  for (let i = 0; i < 150; i++) h.step();

  const said = pick(ev, "dialog:spoken").map((p) => p.text as string);
  assert.ok(said.some(matches), `túi toàn vé im mà vẫn phải nói — ${JSON.stringify(said)}`);
});

test("ổ chưa có nhân không RÚT vé im lặng — để dành cả hai mươi vé cho lỗi thường", () => {
  // Đo ở nhánh lắc đầu vì không có `farewell` cũng rút túi này.
  const { h, c } = atCounter();
  refuses(c);
  const bagId = `silence:${c.memKey}`;
  h.ctx.world.shuffleBags[bagId] = { o: [0, 1, 2, 3, 4, 5, 6], l: -1, r: 1, t: 0 };
  h.service.serveDish(BARE);
  assert.deepEqual(h.ctx.world.shuffleBags[bagId].o, [0, 1, 2, 3, 4, 5, 6]);
});

test("khách GỌI bánh mì không: ổ trống là ổ ĐÚNG — không lỗi, không ai lắc đầu", () => {
  const { h, ev, c } = atCounter();
  refuses(c);
  c.order = specOf({ mon: "khong", rau: "khong", ot: 0, tuong: 0 });

  const res = h.service.serveDish(BARE);
  assert.equal(res.ok, true, "cái bẫy dịch lớn nhất của game — đừng để luật ổ trống đụng tới nó");
  const diffed = pick(ev, "delivery:diffed")[0];
  assert.equal(diffed.defects.length, 0);
  assert.equal(diffed.spoken, null);
});

test("ổ chỉ có rau, không có miếng nhân mặn nào: vẫn là ổ chưa có nhân", () => {
  const { h, c } = atCounter();
  refuses(c);
  assert.equal(h.service.serveDish(["dochua", "dualeo", "hanhngo"]).ok, false,
    "người ta gọi pate mà trong ổ không có miếng nhân nào thì rau không đỡ được");
});

test("takesHollowLoaf: 5 người trong hẻm cầm cho xong, 7 người bắt làm lại", () => {
  const take = NPCS.filter((n) => takesHollowLoaf(n.personality)).map((n) => n.id).sort();
  assert.deepEqual(take, ["ANH_BAO", "BA_SAU", "BE_SU", "CHU_TU", "THAY_PHUC"]);
  assert.equal(NPCS.length - take.length, 7);
  // Trục quyết định không phải `soi`.
  assert.equal(takesHollowLoaf({ soi: 0.9, nongTinh: 0.6, deTha: 0.8, thanThien: 0.7 }), false);
  assert.equal(takesHollowLoaf({ soi: 0.8, nongTinh: 0.2, deTha: 0.7, thanThien: 0.5 }), true);
});

test("tất định: cùng seed, cùng thao tác → mọi sự kiện giống hệt", () => {
  const once = (who: (c: Customer) => void) => {
    const { h, ev, c } = atCounter();
    who(c);
    h.service.serveDish(BARE);
    for (let i = 0; i < 60; i++) h.step();
    return JSON.stringify(ev);
  };
  for (const who of [refuses, takes]) assert.equal(once(who), once(who));
});
