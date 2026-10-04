/**
 * MẮT XÍCH THỨ HAI CỦA MỘT CHUỖI — `LEND_ITEM → CLEAR_DEBT` và `cờ → OVERHEARD_BY`.
 *
 * `tools/probe-act.ts` xếp hai act này vào ô "✗ chưa bao giờ đủ điều kiện", và lần đó lời
 * giải thích đúng: chúng là mắt xích THỨ HAI, phải có người chơi làm cái thứ nhất trước.
 * Nhưng "đúng lý thuyết" là chỗ mấy đợt trước tôi sai nhiều nhất — một chuỗi đứt ở giữa
 * thì nhìn y hệt một chuỗi chưa ai chạm tới.
 *
 * Lưới này kéo chuỗi bằng tay qua ĐÚNG đường chạy thật, và kiểm từng khớp:
 *   cho mượn → sổ của HỌ ghi nợ → cuộc trả đồ MỞ RA → trả xong thì sổ sạch và áo mưa về.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TALK_NPC_IDS, TalkStore } from "../src/content/talks";
import { eligible, walkNodes, type Talk, type TalkCtx } from "../src/sim/talk";

const TALKS: Talk[] = await TalkStore.loadAll();

async function moQuan(ngay = 9) {
  const w = newGame("chuoi", "p210");
  const bus = new Bus(false);
  for (let d = 1; d < ngay; d++) nextDay(w, bus);
  const h = new HeadlessStall(w, POLICIES.social, { bus, platform: memoryPlatform() });
  const svc = (h as unknown as { service: any }).service;
  for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);
  /*
   * ⚠️ Phải là người CÓ TÊN. `lendItem` từ chối người lạ, và đúng: tám dáng người lạ dùng
   * chung một `memKey` cả mùa, ghi nợ vào đó là ghi lên sổ của người khác (P2-09 §2.4).
   */
  let ai: any = null;
  for (let i = 0; i < 60_000 && !ai; i++) {
    h.step(1000 / 30);
    ai = svc.customers.find((c: any) => c.npc && c.phase !== "leaving") ?? null;
  }
  return { w, h, svc, ai };
}

test("CA-1 `LEND_ITEM` ghi nợ vào sổ CỦA HỌ, và trừ áo mưa của mình", async () => {
  const { svc, ai } = await moQuan();
  assert.ok(ai, "cả buổi không ai CÓ TÊN ghé");
  const truoc = svc.coats;
  svc.applyTalkOption(ai, { act: { kind: "LEND_ITEM", item: "áo mưa" } });
  const m = svc.mem(ai.memKey);
  assert.ok(m.borrowed, "cho mượn mà sổ của họ không ghi gì — hôm sau không ai mang trả");
  assert.equal(m.borrowed.item, "áo mưa");
  assert.equal(svc.coats, truoc - 1, "cho mượn mà số áo mưa của mình không giảm");
});

test("CA-2 có nợ thì cuộc TRẢ ĐỒ mở ra được; không nợ thì không", async () => {
  const traDo = TALKS.filter((t) => [t.when?.world ?? []].flat().includes("m.borrowing"));
  assert.ok(traDo.length >= 2, `mới ${traDo.length} cuộc trả đồ — arc áo mưa chỉ có một chiều`);

  const { svc, ai } = await moQuan();
  assert.ok(ai, "cả buổi không ai CÓ TÊN ghé");
  const nen = (): TalkCtx => svc.talkCtx(ai);

  const t = traDo.find((x) => x.npc === ai.npc?.id) ?? traDo[0];
  const chuaNo = eligible([t], { ...nen(), npcId: t.npc }, "NPC").length;
  svc.applyTalkOption(ai, { act: { kind: "LEND_ITEM", item: "áo mưa" } });
  // `m.borrowing` đọc từ sổ của chính người này, nên phải hỏi lại ctx SAU khi ghi nợ.
  const coNo = eligible([t], { ...nen(), npcId: t.npc }, "NPC").length;

  if (ai.memKey === t.npc) {
    assert.equal(chuaNo, 0, `${t.id}: chưa cho ai mượn gì mà cuộc trả đồ đã mở`);
    assert.equal(coNo, 1, `${t.id}: đang giữ đồ của mình mà cuộc trả đồ không mở ra`);
  }
});

test("CA-3 `CLEAR_DEBT` xoá nợ và trả áo mưa về — chuỗi khép kín", async () => {
  const { svc, ai } = await moQuan();
  assert.ok(ai, "cả buổi không ai CÓ TÊN ghé");
  const truoc = svc.coats;
  svc.applyTalkOption(ai, { act: { kind: "LEND_ITEM", item: "áo mưa" } });
  assert.equal(svc.coats, truoc - 1);
  svc.applyTalkOption(ai, { act: { kind: "CLEAR_DEBT" } });
  assert.ok(!svc.mem(ai.memKey).borrowed, "trả rồi mà sổ vẫn ghi đang mượn");
  assert.equal(svc.coats, truoc, "trả rồi mà cái áo mưa không về chỗ cũ");
});

test("CA-4 `CLEAR_DEBT` gọi khi KHÔNG nợ gì thì không đẻ thêm áo mưa", async () => {
  const { svc, ai } = await moQuan();
  assert.ok(ai, "cả buổi không ai CÓ TÊN ghé");
  const truoc = svc.coats;
  svc.applyTalkOption(ai, { act: { kind: "CLEAR_DEBT" } });
  assert.equal(svc.coats, truoc, "không nợ mà trả cũng được ⇒ bấm hoài là in ra áo mưa");
});

test("CA-5 cuộc `OVERHEARD_BY` khoá sau một cờ mà cờ đó CÓ người đặt", () => {
  const chu = TALKS.filter((t) => [...walkNodes(t)].some((x) => x.node.act?.kind === "OVERHEARD_BY"));
  assert.ok(chu.length, "không cuộc nào gọi `OVERHEARD_BY`");
  const dat = new Set<string>();
  for (const t of TALKS) for (const { node } of walkNodes(t)) if (node.flag) dat.add(node.flag);
  for (const t of chu) {
    const co = t.when?.needFlag;
    if (!co) continue;
    assert.ok(dat.has(co.replace(/^~/, "")),
      `${t.id} chờ cờ "${co}" mà không cuộc nào đặt được nó — chuỗi đứt ở giữa`);
  }
});
