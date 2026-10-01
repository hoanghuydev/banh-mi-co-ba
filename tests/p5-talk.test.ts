/**
 * P5-01 §6 — trò chuyện có nhánh. Chia hai nửa:
 *   T-* máy chạy đúng   ·   L-* nội dung viết đúng (lưới chắn cho hàng trăm cuộc viết tay)
 *
 * Nửa L quan trọng hơn: bug người chơi báo không phải "engine sai" mà là "nó trả lời trật
 * câu tôi hỏi" và "nó hỏi con bé cấp 2 chuyện đi làm". Máy không bắt được mấy cái đó thì
 * người viết nội dung phải tự nhớ 100 lần — và sẽ quên.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { NPCS } from "../src/content/npcs";
import { Rng } from "../src/core/rng";
import { newRelState } from "../src/sim/memory";
import {
  ADDRESS, DEFAULT_IGNORE_REL, FORBIDDEN_SELF, MAX_DEPTH, TalkSession, angerToWaitSec, applyTalk,
  childrenOf, eligible, linesOf, pickTalk, visibleOptions, walkNodes, type Talk, type TalkCtx, type TalkNode,
} from "../src/sim/talk";
import { TALK_NPC_IDS, TalkStore } from "../src/content/talks";

const P = Object.fromEntries(NPCS.map((n) => [n.id, n.personality]));
const TALKS: Talk[] = await TalkStore.loadAll();

const ctx = (over: Partial<TalkCtx> = {}): TalkCtx => ({
  npcId: "BA_BAY", day: 10, slot: "PEAK", rain: false, tier: "ACQUAINTANCE",
  visits: 8, flags: {}, usedToday: [], usedSeason: [], ...over,
});

const byId = (id: string) => TALKS.find((t) => t.id === id)!;

// ────────────────────────────────────────────────────────────── T — máy chạy

test("T-1 câu đáp đi THEO lựa chọn, không rút riêng — đúng cái bug của nút F cũ", () => {
  const t = byId("bay.veso");
  const replies = t.tree.map((o) => o.reply ?? `(im ${o.say})`);
  assert.equal(new Set(replies).size, replies.length, "bốn lựa chọn mà đáp lại giống nhau");
  for (const [i, o] of t.tree.entries()) {
    const s = new TalkSession(t, "BA_BAY");
    assert.equal(s.choose(i, {})!.reply, o.reply, `lựa chọn ${i} nhận câu đáp của lựa chọn khác`);
  }
});

test("T-2 mỗi nhánh có BỘ LỰA CHỌN RIÊNG — chọn A và chọn B không ra cùng một nhịp sau", () => {
  const t = byId("bay.veso");
  const next = (i: number) => {
    const s = new TalkSession(t, "BA_BAY");
    s.choose(i, {});
    return (s.options ?? []).map((o) => o.say).join("|");
  };
  const a = next(0), b = next(1);
  assert.ok(a && b, "hai nhánh đầu phải còn đi tiếp được");
  assert.notEqual(a, b, "rẽ A hay rẽ B cũng ra cùng bốn câu — cây chưa rẽ thật");
});

test("T-3 rẽ được nhiều cấp: A → A4 → A4b", () => {
  const deep = TALKS.find((t) => walkNodes(t).some((x) => x.depth >= 3));
  assert.ok(deep, "không cuộc nào sâu tới 3 cấp — doc đòi hội thoại nhiều tầng");
  const s = new TalkSession(deep!, deep!.npc);
  let steps = 0;
  while (!s.done && steps < MAX_DEPTH) {
    const here = s.options!;
    // đi theo nhánh nào còn con, để xuống đáy
    const i = here.findIndex((o) => childrenOf(o, deep!));
    s.choose(i >= 0 ? i : 0, {});
    steps++;
  }
  assert.ok(steps >= 3, `chỉ đi được ${steps} cấp`);
});

test("T-4 nhánh cụt thì cuộc đóng, không rơi vào nhịp không tồn tại", () => {
  for (const t of TALKS) {
    const s = new TalkSession(t, t.npc);
    for (let guard = 0; guard <= MAX_DEPTH + 1 && !s.done; guard++) {
      const here = s.options;
      assert.ok(here, `${t.id}: chưa done mà hết nhịp`);
      const i = here!.findIndex((o) => childrenOf(o, t));
      s.choose(i >= 0 ? i : 0, {});
    }
    assert.equal(s.done, true, `${t.id}: đi mãi không kết thúc — \`ref\` quay vòng?`);
    assert.equal(s.options, null);
  }
});

test("T-5 khách im lặng vẫn là một nước đi: `silent` đi tiếp bình thường, không phải lỗi", () => {
  const silent = TALKS.flatMap((t) => walkNodes(t).map((x) => ({ t, n: x.node }))).find((x) => x.n.silent);
  assert.ok(silent, "không có nút nào khách không thèm đáp");
  const i = silent!.t.tree.indexOf(silent!.n);
  if (i < 0) return;                                   // nút im nằm sâu — T-4 đã phủ
  const s = new TalkSession(silent!.t, silent!.t.npc);
  const r = s.choose(i, {})!;
  assert.equal(r.reply, undefined, "khai `silent` mà vẫn có câu đáp");
});

test("T-6 ấm thì lên điểm, gắt thì xuống — và gắt xuống NẶNG hơn ấm lên", () => {
  const warm = newRelState(), rude = newRelState();
  // Có sẵn vốn liếng quan hệ: `clampPoints` có SÀN theo bucket đã đạt (P2-03 §2.5), nên
  // người chưa từng lên bucket nào đứng ở 0 và không tụt xuống dưới được. Đo "nói nặng
  // thì nguội đi" trên một trạng thái 0 điểm là đo cái sàn, không phải đo câu nói.
  rude.relationPoints = warm.relationPoints = 40;
  const up = applyTalk({ rel: 3 }, warm, P.BA_BAY, 10);
  const down = applyTalk({ rel: -4, mem: { kind: "RUDE_TO_THEM", intensity: 55 } }, rude, P.BA_BAY, 10);
  assert.ok(up.relDelta > 0, "nói tử tế mà không ấm lên");
  assert.ok(down.relDelta < 0, "nói nặng mà không nguội đi");
  assert.ok(Math.abs(down.relDelta) > up.relDelta, "chửi người ta rẻ hơn nói tử tế");
  assert.equal(down.mem, "RUDE_TO_THEM");
  assert.equal(rude.memory.short.length, 1, "câu nặng phải thành ký ức, không chỉ là điểm");
});

test("T-6b `relGainMul` chỉ nhân cho phần DƯƠNG — khép kín không vì vậy mà bớt đau", () => {
  const a = applyTalk({ rel: 4 }, newRelState(), P.BE_SU, 10).relDelta;      // thanThien 1,0
  const b = applyTalk({ rel: 4 }, newRelState(), P.CHI_LAN, 10).relDelta;    // thanThien 0,3
  assert.ok(a > b, "người mở lòng phải ấm lên nhanh hơn");
  const na = applyTalk({ rel: -4 }, newRelState(), P.BE_SU, 10).relDelta;
  const nb = applyTalk({ rel: -4 }, newRelState(), P.CHI_LAN, 10).relDelta;
  assert.equal(na, nb, "bị nói nặng mà tính cách lại làm đau ít đi");
});

test("T-7 giận ăn vào sức chờ, nhưng MỘT câu không bao giờ đẩy thẳng ra khỏi cửa", () => {
  const waitT = 50, leaveAt = 1.6;
  assert.equal(angerToWaitSec(0, waitT, 0, leaveAt), 0);
  const big = angerToWaitSec(100, waitT, 0, leaveAt);
  assert.ok(big > 0 && big < waitT * leaveAt, "giận tối đa mà bỏ đi ngay — người chơi không kịp thấy mình vừa làm gì");
  assert.ok(angerToWaitSec(40, waitT, 0, leaveAt) < angerToWaitSec(80, waitT, 0, leaveAt));
  const late = angerToWaitSec(100, waitT, waitT * leaveAt - 2, leaveAt);
  assert.ok(late >= 0 && late <= 2);
});

test("T-8 không nghe lại một cuộc cả mùa, không đụng một chủ đề hai lần trong ngày", () => {
  const all = eligible(TALKS, ctx());
  assert.ok(all.length >= 2);
  const first = all[0];
  assert.ok(!eligible(TALKS, ctx({ usedSeason: [first.id] })).some((t) => t.id === first.id));
  assert.ok(!eligible(TALKS, ctx({ usedToday: [first.topic] })).some((t) => t.topic === first.topic));
});

test("T-9 `when` lọc đúng: ngày, số lần ghé, bucket quan hệ", () => {
  const late = TALKS.find((t) => t.when?.day && t.when.day[0] > 1)!;
  const okCtx = ctx({ npcId: late.npc, day: late.when!.day![0], visits: 99 });
  assert.ok(!eligible(TALKS, { ...okCtx, day: late.when!.day![0] - 1 }).some((t) => t.id === late.id));
  assert.ok(eligible(TALKS, okCtx).some((t) => t.id === late.id));

  const gated = TALKS.find((t) => t.when?.minVisits);
  if (gated) {
    const c = ctx({ npcId: gated.npc, day: gated.when!.day?.[0] ?? 10, visits: 0 });
    assert.ok(!eligible(TALKS, c).some((t) => t.id === gated.id), "minVisits bị bỏ qua");
  }
});

test("T-10 rút cuộc là TẤT ĐỊNH theo seed — bấm F không được làm xê dịch gì của ngày mai", () => {
  assert.equal(pickTalk(TALKS, ctx(), new Rng(12345))?.id, pickTalk(TALKS, ctx(), new Rng(12345))?.id);
});

test("T-11 `need` ẩn lựa chọn chưa mở, mà vẫn luôn còn một đường ra", () => {
  const nodes: TalkNode[] = [
    { say: "a", tone: "AM", need: "chuaCo" },
    { say: "b", tone: "LANH", need: "chuaCo" },
  ];
  assert.equal(visibleOptions(nodes, {}).length, 1, "lọc sạch hết thì bảng không còn nút nào bấm");
  assert.equal(visibleOptions(nodes, { chuaCo: 1 }).length, 2);
});

test("T-12 kho nạp theo người: `ensure` rồi mới có, `release` thì trả chỗ", async () => {
  const s = new TalkStore();
  const who = TALK_NPC_IDS[0];
  assert.equal(s.has(who), false, "chưa ai tới mà đã nạp sẵn cả hẻm");
  assert.deepEqual(s.get(who), [], "chưa nạp mà đã trả về nội dung");
  await s.ensure(who);
  assert.ok(s.has(who) && s.get(who).length > 0);
  // LRU giữ vài người gần nhất — thả một người không làm họ biến mất ngay
  s.release(who);
  assert.equal(s.has(who), true, "thả xong mất luôn thì khách ghé lại phải tải lại từ đầu");
  s.clear();
  assert.equal(s.has(who), false);
});

test("T-13 file thoại thiếu KHÔNG được làm sập buổi bán", async () => {
  const s = new TalkStore();
  await s.ensure("KHONG_CO_AI");
  assert.deepEqual(s.get("KHONG_CO_AI"), []);
});

// ────────────────────────────────────────────────────────── L — nội dung đúng

test("L-1 id duy nhất, npc có thật, `ref` trỏ tới cây con có thật", () => {
  const ids = new Set<string>();
  const known = new Set([...NPCS.map((n) => n.id), "WALKIN", "ANY"]);
  for (const t of TALKS) {
    assert.ok(!ids.has(t.id), `id trùng: ${t.id}`);
    ids.add(t.id);
    assert.ok(known.has(t.npc), `${t.id}: npc lạ "${t.npc}"`);
    assert.ok(t.tree.length >= 2, `${t.id}: nhịp đầu chỉ có ${t.tree.length} lựa chọn`);
    for (const { node } of walkNodes(t)) {
      if (node.ref) assert.ok(t.shared?.[node.ref], `${t.id}: ref "${node.ref}" không có trong \`shared\``);
      if (node.then && node.ref) assert.fail(`${t.id}: "${node.say}" vừa \`then\` vừa \`ref\` — chọn một`);
    }
  }
});

test("L-2 mỗi nhịp 2–4 lựa chọn và ÍT NHẤT HAI giọng — bốn dòng cùng giọng không phải lựa chọn", () => {
  const check = (t: Talk, nodes: readonly TalkNode[], where: string) => {
    assert.ok(nodes.length >= 2 && nodes.length <= 4, `${t.id} ${where}: ${nodes.length} lựa chọn`);
    const tones = new Set(nodes.map((o) => o.tone));
    assert.ok(tones.size >= 2, `${t.id} ${where}: cả ${nodes.length} dòng cùng giọng ${[...tones][0]}`);
  };
  for (const t of TALKS) {
    check(t, t.tree, "nhịp đầu");
    for (const { node } of walkNodes(t)) {
      const kids = childrenOf(node, t);
      if (kids) check(t, kids, `sau "${node.say}"`);
    }
    for (const [k, v] of Object.entries(t.shared ?? {})) check(t, v, `shared.${k}`);
  }
});

test("L-3 mỗi cuộc có đường từ chối ngay ở nhịp đầu — người chơi còn phải bán hàng", () => {
  for (const t of TALKS) {
    const out = t.tree.some((o) => o.tone === "LANH" || o.tone === "IM" || o.tone === "GAT");
    assert.ok(out, `${t.id}: nhịp đầu không có đường từ chối`);
  }
});

test("L-4 câu GẮT luôn có giá, câu ẤM không bao giờ bị phạt", () => {
  for (const t of TALKS) {
    for (const { node: o } of walkNodes(t)) {
      if (o.tone === "GAT") {
        assert.ok((o.rel ?? 0) < 0 || (o.anger ?? 0) > 0 || o.mem, `${t.id}: "${o.say}" gắt mà miễn phí`);
      }
      if (o.tone === "AM") assert.ok((o.rel ?? 0) >= 0, `${t.id}: "${o.say}" tử tế mà bị trừ điểm`);
    }
  }
});

test("L-5 không có `reply` thì phải khai `silent` — phân biệt im CÓ Ý với quên viết", () => {
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      assert.ok(node.reply || node.silent, `${t.id}: "${node.say}" không có câu đáp mà cũng không khai \`silent\``);
    }
  }
});

test("L-6 DANH XƯNG: không ai tự xưng bằng từ của người khác", () => {
  for (const t of TALKS) {
    const forbidden = FORBIDDEN_SELF[t.npc];
    if (!forbidden) continue;
    for (const l of linesOf(t).npc) {
      for (const w of forbidden) {
        assert.ok(
          !new RegExp(`(^|[^\\p{L}])${w}([^\\p{L}]|$)`, "iu").test(l),
          `${t.id}: ${t.npc} nói "${l}" — "${w}" không phải từ của người này`,
        );
      }
    }
  }
});

test("L-7 DANH XƯNG: lời người chơi gọi khách đúng vai, ít nhất một lần mỗi cuộc", () => {
  for (const t of TALKS) {
    const a = ADDRESS[t.npc];
    if (!a) continue;
    const says = linesOf(t).player.join(" ");
    assert.ok(
      new RegExp(`(^|[^\\p{L}])${a.call}([^\\p{L}]|$)`, "iu").test(says),
      `${t.id}: cả cuộc không ai gọi ${t.npc} là "${a.call}" — người chơi đang nói với ai?`,
    );
  }
});

test("L-8 bé Su không bị hỏi chuyện người lớn", () => {
  const adult = ["đi làm", "công việc", "lương", "chồng", "vợ", "nhậu", "con cái", "làm ăn", "bồ bịch"];
  const su = TALKS.filter((t) => t.npc === "BE_SU");
  assert.ok(su.length > 0);
  for (const t of su) {
    const { npc, player } = linesOf(t);
    const all = [...npc, ...player].join(" ").toLowerCase();
    for (const w of adult) assert.ok(!all.includes(w), `${t.id}: hỏi một đứa cấp 2 chuyện "${w}"`);
  }
});

test("L-9 cuộc nào khách TỰ bắt chuyện cũng phải khai giá của việc làm thinh — và phải HIẾM", () => {
  for (const t of TALKS.filter((x) => x.initiates)) {
    assert.ok(t.ignore, `${t.id}: tự bắt chuyện mà không khai \`ignore\` — làm thinh thành miễn phí`);
    assert.ok((t.ignore!.rel ?? DEFAULT_IGNORE_REL) < 0, `${t.id}: làm thinh mà không mất gì`);
    assert.ok((t.initiates ?? 0) > 0 && (t.initiates ?? 0) <= 0.35, `${t.id}: initiates ${t.initiates} quá dày`);
  }
  // Đa số khách tới là để mua bánh mì, không phải để tâm sự (P5-01 §3).
  const share = TALKS.filter((t) => t.initiates).length / TALKS.length;
  assert.ok(share <= 0.5, `${(share * 100).toFixed(0)}% số cuộc là khách tự bắt chuyện — quán này không bán được gì`);
});

test("L-10 cây không sâu quá `MAX_DEPTH` — `ref` quay vòng là treo máy giữa buổi bán", () => {
  for (const t of TALKS) {
    const deepest = walkNodes(t).reduce((a, x) => Math.max(a, x.depth), 0);
    assert.ok(deepest <= MAX_DEPTH, `${t.id}: sâu ${deepest} cấp`);
  }
});
