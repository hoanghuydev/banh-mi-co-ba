/**
 * P5-01 §6 — trò chuyện có nhánh. Chia hai nửa:
 *   T-* máy chạy đúng   ·   L-* nội dung viết đúng (lưới chắn cho hàng trăm cuộc viết tay)
 *
 * Nửa L quan trọng hơn: bug người chơi báo không phải "engine sai" mà là "nó trả lời trật
 * câu tôi hỏi" và "nó hỏi con bé cấp 2 chuyện đi làm". Máy không bắt được mấy cái đó thì
 * người viết nội dung phải tự nhớ 100 lần — và sẽ quên.
 */
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { NPCS } from "../src/content/npcs";
import { Rng } from "../src/core/rng";
import { DECAY, REDEEM, newRelState } from "../src/sim/memory";
import {
  ADDRESS, DEFAULT_IGNORE_REL, FORBIDDEN_SELF, MAX_DEPTH, TalkSession, angerToWaitSec, applyTalk,
  childrenOf, eligible, linesOf, pickTalk, visibleOptions, walkNodes, WALKIN_CALLS,
  type Talk, type TalkCtx, type TalkNode,
} from "../src/sim/talk";
import { TALK_NPC_IDS, TalkStore } from "../src/content/talks";
import { newGame } from "../src/core/save";
import { HeadlessStall, POLICIES } from "../src/sim/headless";
import { Customer } from "../src/sim/customer";
import { makeUsual } from "../src/sim/order";

const P = Object.fromEntries(NPCS.map((n) => [n.id, n.personality]));
const TALKS: Talk[] = await TalkStore.loadAll();

const ctx = (over: Partial<TalkCtx> = {}): TalkCtx => ({
  npcId: "BA_BAY", day: 10, slot: "PEAK", rain: false, tier: "ACQUAINTANCE",
  visits: 8, flags: {}, usedToday: [], usedSeason: [], ...over,
});

const byId = (id: string) => TALKS.find((t) => t.id === id)!;

/** Một lượt ghé trần trụi, sức chờ 50 s — chỉ để đo `patienceLeft` / `soothe`. */
const mkCustomer = (id: string) =>
  new Customer(id, "CHU_TU", "Chú Tư", P.CHU_TU, NPCS[1].body, null,
    makeUsual(new Rng(1)), 0, { x: 0, y: 0 }, 50, new Rng(2));

// ────────────────────────────────────────────────────────────── T — máy chạy

test("T-1 câu đáp đi THEO lựa chọn, không rút riêng — đúng cái bug của nút F cũ", () => {
  const t = byId("bay.veso");
  const replies = t.tree.map((o) => o.reply ?? `(im ${o.say})`);
  assert.equal(new Set(replies).size, replies.length, "bốn lựa chọn mà đáp lại giống nhau");
  for (const [i, o] of t.tree.entries()) {
    const s = new TalkSession(t, "BA_BAY");
    assert.equal(s.choose(i, { flags: {} })!.reply, o.reply, `lựa chọn ${i} nhận câu đáp của lựa chọn khác`);
  }
});

test("T-2 mỗi nhánh có BỘ LỰA CHỌN RIÊNG — chọn A và chọn B không ra cùng một nhịp sau", () => {
  const t = byId("bay.veso");
  const next = (i: number) => {
    const s = new TalkSession(t, "BA_BAY");
    s.choose(i, { flags: {} });
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
    s.choose(i >= 0 ? i : 0, { flags: {} });
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
      s.choose(i >= 0 ? i : 0, { flags: {} });
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
  const r = s.choose(i, { flags: {} })!;
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
  assert.equal(visibleOptions(nodes, { flags: {} }).length, 1, "lọc sạch hết thì bảng không còn nút nào bấm");
  assert.equal(visibleOptions(nodes, { flags: { chuaCo: 1 } }).length, 2);
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

test("L-4 câu GẮT luôn có giá, câu ẤM không bị phạt, câu CHỬI ĐỔNG không trung tính", () => {
  for (const t of TALKS) {
    for (const { node: o } of walkNodes(t)) {
      // GẮT là hỗn với CHÍNH người đang đứng đây — không có đường nào miễn phí.
      if (o.tone === "GAT") {
        assert.ok((o.rel ?? 0) < 0 || (o.anger ?? 0) > 0 || o.mem, `${t.id}: "${o.say}" gắt mà miễn phí`);
      }
      if (o.tone === "AM") assert.ok((o.rel ?? 0) >= 0, `${t.id}: "${o.say}" tử tế mà bị trừ điểm`);
      // Chửi đổng người thứ ba: ăn hay trật tuỳ người, nhưng không bao giờ là con số 0 —
      // hùa theo một câu chửi luôn nói điều gì đó về mình.
      if (o.tone === "CHUI") {
        assert.notEqual(o.rel ?? 0, 0, `${t.id}: "${o.say}" chửi đổng mà không ai thấy gì`);
      }
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
  /**
   * "bà Bảy", "cô Mai", "chú Tư" là GỌI TÊN người khác, không phải tự xưng — nên bỏ qua
   * khi ngay sau từ đó là một tên riêng (chữ hoa). Thiếu cái cửa này thì cô Mai không
   * được phép nhắc tới bà Bảy, mà cô Mai là cái loa của cả hẻm.
   */
  const usedAsPronoun = (line: string, w: string) =>
    new RegExp(`(^|[^\\p{L}])${w}(?!\\s+\\p{Lu})([^\\p{L}]|$)`, "iu").test(line);
  for (const t of TALKS) {
    const forbidden = FORBIDDEN_SELF[t.npc];
    if (!forbidden) continue;
    for (const l of linesOf(t).npc) {
      for (const w of forbidden) {
        assert.ok(!usedAsPronoun(l, w), `${t.id}: ${t.npc} nói "${l}" — "${w}" không phải từ của người này`);
      }
    }
  }
});

test("L-7 DANH XƯNG: lời người chơi gọi khách đúng vai, ít nhất một lần mỗi cuộc", () => {
  for (const t of TALKS) {
    const a = ADDRESS[t.npc];
    if (!a) continue;
    const says = linesOf(t).player.join(" ");
    // Khách vãng lai đổi vai mỗi lượt — chấp nhận bất kỳ vai nào, miễn là CÓ gọi.
    const calls = t.npc === "WALKIN" ? WALKIN_CALLS : [a.call];
    assert.ok(
      calls.some((w) => new RegExp(`(^|[^\\p{L}])${w}([^\\p{L}]|$)`, "iu").test(says)),
      `${t.id}: cả cuộc không ai gọi ${t.npc} là "${calls.join("/")}" — người chơi đang nói với ai?`,
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

// ──────────────────────────────────── A — lời nói có HÀNH ĐỘNG THẬT (P5-02)

test("A-1 câu nào hứa chuyện có thật thì phải mang `act` — không có lời nói miễn phí", () => {
  /**
   * Lưới này đọc CHÍNH LỜI THOẠI. Người viết thêm một câu "để cô bỏ thêm miếng chả" mà
   * quên gắn `act` thì câu đó lại thành chữ suông — đúng cái bug đang sửa. Từ khoá cố ý
   * hẹp: chỉ bắt những lối nói CHẮC CHẮN là một lời hứa.
   */
  const promises: [RegExp, string][] = [
    [/\bcô bỏ (chút|thêm|cho)\b/i, "PROMISE"],
    [/\bbỏ cho (em|con|anh|chị)\b.*\bmiếng\b/i, "PROMISE"],
    [/\bbớt (cô|chú|anh|chị|bà|em)\b.*\bngàn\b/i, "DISCOUNT"],
    // Phải là NGƯỜI CHƠI hứa, nên bắt buộc có chủ ngữ ngôi thứ nhất: "em không lấy tiền".
    // Không có cửa này thì "Sao chú hổng lấy tiền chú?" — một câu HỎI — bị tính là lời hứa.
    [/\b(em|con|cô|tui)\s+(không|hổng)\s+lấy tiền\b/i, "FREE_LOAF"],
    [/\bđứng qua bên\b|\bdạt qua\b/i, "STEP_ASIDE"],
    [/\bmua chỗ khác\b/i, "REFUSE"],
    [/\bcho (con|em) (một|hai|ba) tờ\b|\blấy hết cho\b|\bđưa đây một tờ\b/i, "PAY"],
  ];
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      for (const [re, kind] of promises) {
        if (!re.test(node.say)) continue;
        assert.ok(node.act, `${t.id}: "${node.say}" hứa chuyện có thật mà không có \`act\``);
        assert.equal(node.act!.kind, kind, `${t.id}: "${node.say}" nên là ${kind}`);
      }
    }
  }
});

test("A-2 `act` tốn tiền phải khai `needCash` — không hứa được cái mình không trả nổi", () => {
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      if (node.act?.kind !== "PAY") continue;
      assert.equal(node.needCash, node.act.vnd, `${t.id}: "${node.say}" trả ${node.act.vnd} mà cổng tiền là ${node.needCash}`);
      assert.ok(node.act.note.length > 0, `${t.id}: PAY không có ghi chú để vô sổ`);
    }
  }
});

test("A-3 két rỗng thì lựa chọn tốn tiền BIẾN MẤT, mà vẫn còn đường đi tiếp", () => {
  const nodes: TalkNode[] = [
    { say: "mua hai tờ", tone: "AM", needCash: 20000, act: { kind: "PAY", vnd: 20000, note: "vé số" } },
    { say: "thôi bà", tone: "LANH" },
  ];
  assert.equal(visibleOptions(nodes, { flags: {}, cash: 20000 }).length, 2);
  const broke = visibleOptions(nodes, { flags: {}, cash: 5000 });
  assert.equal(broke.length, 1, "hết tiền mà vẫn mời người ta mua vé số");
  assert.equal(broke[0].say, "thôi bà");
  // cash không khai = không chặn (test cũ, sim headless)
  assert.equal(visibleOptions(nodes, { flags: {} }).length, 2);
});

test("A-4 nuốt lời đau hơn bỏ nhầm món, và cả hai đều đau hơn một câu nói nặng", () => {
  const bad = (kind: "BROKEN_PROMISE" | "RUDE_TO_THEM", i: number) => {
    const s = newRelState();
    s.relationPoints = 60;
    return -applyTalk({ mem: { kind, intensity: i } }, s, P.ANH_BAO, 10).relDelta;
  };
  const broken = bad("BROKEN_PROMISE", 85);
  const swapped = bad("BROKEN_PROMISE", 55);
  const rude = bad("RUDE_TO_THEM", 65);
  assert.ok(broken > swapped, "nuốt lời mà rẻ hơn bỏ nhầm món");
  assert.ok(broken > rude, "hứa rồi quên mà nhẹ hơn nói một câu khó nghe");
});

test("A-5 vết `BROKEN_PROMISE` phai chậm hơn và đọng lại cao hơn mọi vết âm khác", () => {
  const bp = DECAY.BROKEN_PROMISE;
  for (const k of ["RUDE_TO_THEM", "ORDER_DEFECT", "BURNT_OR_COLD", "MADE_THEM_WAIT"] as const) {
    assert.ok(bp.floor >= DECAY[k].floor, `BROKEN_PROMISE đọng lại ít hơn ${k}`);
  }
  // và phải chuộc được — bằng VIỆC LÀM, không bằng lời
  assert.ok(REDEEM.BROKEN_PROMISE, "không có đường chuộc lời hứa gãy");
  assert.deepEqual(REDEEM.BROKEN_PROMISE!.requireKinds, ["FREE_EXTRA", "CARED_FOR_THEM"]);
});

// ───────────────────────────────── E — Esc giữa chừng (lỗi người chơi báo)

test("E-1 mở bảng rồi Esc mà CHƯA nói câu nào: cuộc đó còn nguyên, bấm F lại vẫn vào", () => {
  /**
   * Lỗi gốc: `markTalkUsed` chạy ngay lúc MỞ, nên Esc là đốt luôn cuộc đó cả mùa —
   * `pickTalk` không còn gì để rút và nút F trông như chết. Giờ chỉ đánh dấu khi người
   * chơi THẬT SỰ chọn một câu. Test này là cái chốt giữ, đừng tối ưu nó đi.
   */
  const t = byId("bay.veso");
  const used: string[] = [];
  const s = new TalkSession(t, "BA_BAY");
  assert.equal(s.done, false);
  // Esc = chưa `choose()` lần nào → không có gì để ghi vào `talksDone`
  assert.deepEqual(s.picked, [], "chưa bấm gì mà đã tính là đã nói");
  assert.ok(eligible(TALKS, ctx({ npcId: "BA_BAY", usedSeason: used })).some((x) => x.id === t.id));
});

test("E-2 chọn MỘT câu rồi Esc: cuộc đó tính là đã nghe, không nghe lại cả mùa", () => {
  const t = byId("bay.veso");
  const s = new TalkSession(t, "BA_BAY");
  s.choose(0, { flags: {} });
  assert.equal(s.picked.length, 1, "đã chọn mà không ghi lại");
  // Service gọi `markTalkUsed` đúng ở nhịp này → mô phỏng bằng usedSeason
  assert.ok(!eligible(TALKS, ctx({ npcId: "BA_BAY", usedSeason: [t.id] })).some((x) => x.id === t.id));
});

test("E-3 cơ chế hỏi chuyện CŨ đã bỏ hẳn — không còn túi `askPlayer`, không còn rule `gen.ask`", async () => {
  const lines = JSON.parse(
    await readFile(new URL("../src/content/lines/generic.json", import.meta.url), "utf8"),
  ) as { pools: { id: string }[] };
  assert.ok(!lines.pools.some((p) => p.id === "askPlayer"),
    "túi `askPlayer` còn đó — câu người chơi lại rút ngẫu nhiên, và bug cũ quay lại");

  const rules = JSON.parse(
    await readFile(new URL("../src/content/rules/generic.json", import.meta.url), "utf8"),
  ) as { rules: { id: string }[] };
  assert.ok(!rules.rules.some((r) => r.id === "gen.ask"), "rule `gen.ask` còn đó");

  const bb = JSON.parse(
    await readFile(new URL("../src/content/rules/_blackboard.json", import.meta.url), "utf8"),
  ) as { facts: Record<string, { values?: string[] }> };
  assert.ok(!bb.facts.interaction.values?.includes("ASK"), "fact `interaction` còn giá trị ASK");
});

test("E-4 trên Service THẬT: F → Esc → F lại vẫn mở được bảng (lỗi người chơi báo)", async () => {
  const w = newGame("esc-f", "esc-f-seed");
  const h = new HeadlessStall(w, POLICIES.newbie, {});
  const svc = h.service;

  /*
   * Phải NHẢ cho vòng lặp sự kiện thở giữa chừng: `talks.ensure()` là `import()` động,
   * promise của nó nằm ở hàng đợi microtask. Một vòng `while` đồng bộ thuần (kiểu
   * `HeadlessStall.run`) không bao giờ nhả, nên nội dung KHÔNG BAO GIỜ nạp xong và
   * `openTalk()` luôn trả null. Trong game thật thì rAF nhả mỗi frame nên không gặp.
   */
  for (let round = 0; round < 400 && !svc.front; round++) {
    for (let i = 0; i < 60; i++) h.step(1000 / 30);
    await Promise.resolve();
  }
  const c = svc.front;
  assert.ok(c, "chạy hết buổi mà không ai tới quầy");
  await svc.talks.ensure(c!.npc?.id ?? "WALKIN");

  const first = svc.openTalk();
  assert.ok(first, "bấm F lần đầu không mở được bảng");
  assert.ok(first!.options.length >= 2, "bảng mở mà không có lựa chọn nào");

  svc.closeTalk();                                  // Esc, chưa chọn câu nào
  assert.equal(svc.talkOpen, false);

  const again = svc.openTalk();
  assert.ok(again, "Esc xong bấm F lại thì bảng không mở nữa — đúng lỗi đã báo");
  assert.equal(again!.line, first!.line, "mở lại mà ra cuộc khác — cuộc cũ bị đốt mất");
});

// ──────────────────────────── P — vòng kiên nhẫn & câu dỗ (P5-05)

test("P-1 `patienceLeft` đo theo mốc BỎ ĐI, không theo mốc MADE_THEM_WAIT", () => {
  const c = mkCustomer("x");
  assert.equal(c.patienceLeft, 1, "chưa chờ giây nào mà vòng đã vơi");
  c.waitSec = c.waitT;                               // đúng mốc MADE_THEM_WAIT
  assert.ok(c.patienceLeft > 0,
    "tới mốc MADE_THEM_WAIT là vòng cạn sạch — mà người ta còn đứng thêm 60% nữa");
  c.waitSec = c.waitT * 1.6;                         // đúng mốc bỏ đi
  assert.equal(c.patienceLeft, 0, "hết vòng mà chưa phải lúc bỏ đi");
  c.waitSec = c.waitT * 99;
  assert.equal(c.patienceLeft, 0, "vòng âm");
});

test("P-2 `soothe` lấy lại phần ĐÃ chờ, không bao giờ âm, và luôn yếu hơn chọc giận", () => {
  const c = mkCustomer("x");
  c.waitSec = 20;
  c.soothe(25);
  assert.ok(c.waitSec < 20 && c.waitSec > 0, `dỗ xong còn ${c.waitSec}`);

  // dỗ người vừa tới thì gần như vô nghĩa — đó là chủ ý
  const fresh = mkCustomer("y");
  fresh.waitSec = 1;
  fresh.soothe(30);
  assert.ok(fresh.waitSec < 1 && fresh.waitSec >= 0);

  c.waitSec = 5;
  c.soothe(1000);
  assert.ok(c.waitSec >= 0, "dỗ quá tay thành kiên nhẫn âm");
});

test("P-3 không câu `calm` nào quá 30 — nếu không thì chọc rồi dỗ thành cách chơi tối ưu", () => {
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      if (node.calm === undefined) continue;
      assert.ok(node.calm > 0 && node.calm <= 30, `${t.id}: "${node.say}" calm ${node.calm}`);
      assert.ok(!node.anger, `${t.id}: "${node.say}" vừa chọc vừa dỗ`);
      assert.notEqual(node.tone, "GAT", `${t.id}: "${node.say}" gắt mà lại làm người ta dịu xuống`);
    }
  }
  const soothing = TALKS.flatMap((t) => walkNodes(t)).filter((x) => x.node.calm);
  assert.ok(soothing.length >= 8, `mới có ${soothing.length} câu dỗ — quá ít để người chơi tìm ra`);
});
