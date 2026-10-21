/**
 * "MAI CON ĐEM RA CHO CÔ COI" — lời hứa của HỌ, và cái hẹn phải qua đêm thật.
 *
 * Cờ trơn (`need: "cờ"`) ĐÚNG NGAY trong cùng buổi, nên người ta vừa hứa xong là cuộc trả
 * bài mở ra liền. Tiền tố `~` bắt cờ phải đặt từ một NGÀY TRƯỚC.
 *
 * Lưới này canh đúng chỗ đó, vì nó không nổ ra thành lỗi: nó chỉ làm một lời hứa mất
 * trọng lượng, và không ai thấy.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { TalkStore } from "../src/content/talks";
import { bareFlag, eligible, walkNodes, type Talk, type TalkCtx } from "../src/sim/talk";

const TALKS: Talk[] = await TalkStore.loadAll();

/** Mọi cuộc mở ra nhờ MỘT lời hứa hôm trước. */
const TRA_BAI = TALKS.filter((t) => t.when?.needFlag?.startsWith("~"));

test("HM-1 có cuộc trả bài, và cuộc nào cũng khớp một nút ĐẶT cờ", () => {
  assert.ok(TRA_BAI.length >= 3, `mới ${TRA_BAI.length} cuộc trả bài lời hứa`);
  const dat = new Map<string, string>();
  for (const t of TALKS) for (const { node } of walkNodes(t)) if (node.flag) dat.set(node.flag, t.id);
  for (const t of TRA_BAI) {
    const co = bareFlag(t.when!.needFlag!);
    assert.ok(dat.has(co), `${t.id}: chờ cờ "${co}" mà không cuộc nào đặt`);
    assert.notEqual(dat.get(co), t.id, `${t.id}: tự hứa tự trả bài trong cùng một cuộc`);
  }
});

const ctx = (t: Talk, day: number, flags: TalkCtx["flags"]): TalkCtx => ({
  npcId: t.npc, day, slot: "MID", rain: false, flags,
  usedToday: [], usedBefore: [], practice: t.practice?.[0] as TalkCtx["practice"],
});

test("HM-2 hứa hôm nay thì hôm nay CHƯA trả bài được — qua đêm mới mở", () => {
  for (const t of TRA_BAI) {
    const co = bareFlag(t.when!.needFlag!);
    const homNay = eligible([t], ctx(t, 9, { [co]: 9 }), "NPC");
    const homSau = eligible([t], ctx(t, 10, { [co]: 9 }), "NPC");
    const chuaHua = eligible([t], ctx(t, 10, {}), "NPC");
    assert.equal(homNay.length, 0, `${t.id}: vừa hứa xong đã trả bài ngay trong buổi`);
    assert.equal(homSau.length, 1, `${t.id}: qua ngày rồi mà cuộc trả bài vẫn không mở`);
    assert.equal(chuaHua.length, 0, `${t.id}: chưa ai hứa mà cuộc trả bài đã mở`);
  }
});

test("HM-3 cờ KHÔNG có `~` thì ăn ngay trong ngày", () => {
  const cu = TALKS.find((t) => t.when?.needFlag && !t.when.needFlag.startsWith("~"));
  assert.ok(cu, "không còn cuộc nào dùng cờ trơn để đối chứng");
  const co = cu!.when!.needFlag!;
  const ngay = 12;
  assert.equal(eligible([cu!], ctx(cu!, ngay, { [co]: ngay }), "NPC").length, 1,
    `${cu!.id}: cờ trơn mà cũng bị hoãn qua đêm`);
});

test("HM-4 chạy thật: hứa hôm nay thì cờ ghi ĐÚNG NGÀY, và hôm sau cuộc trả bài mở ra", async () => {
  const { Bus } = await import("../src/core/eventbus");
  const { newGame } = await import("../src/core/save");
  const { memoryPlatform } = await import("../src/core/platform");
  const { HeadlessStall, POLICIES, nextDay } = await import("../src/sim/headless");

  const w = newGame("hua", "p210");
  const bus = new Bus(false);
  for (let d = 1; d < 9; d++) nextDay(w);
  const h = new HeadlessStall(w, POLICIES.greedy, { bus, platform: memoryPlatform() });
  const svc = (h as unknown as { service: any }).service;
  const homNay = w.progress.dayIndex;

  // Ghi cờ qua ĐÚNG đường chạy thật (`applyOutcome`), không nhét tay vào save — chỗ dễ
  // sai nhất là nó ghi `true` thay vì số ngày, và lúc đó `~` không có gì để so.
  for (let i = 0; i < 20000 && !svc.customers.length; i++) h.step(1000 / 30);
  assert.ok(svc.customers.length, "cả buổi không ai tới");
  svc.applyTalkOption(svc.customers[0], { flag: "suHuaQuayChim" });
  assert.equal(w.flags.suHuaQuayChim, homNay, "cờ không ghi NGÀY — `~` không có gì để so");

  const chim = TALKS.find((t) => t.id === "su.chim")!;
  const nen = (day: number): TalkCtx => ({
    npcId: chim.npc, day, slot: "MID", rain: false,
    flags: w.flags as TalkCtx["flags"], usedToday: [], usedBefore: [],
    practice: chim.practice?.[0] as TalkCtx["practice"],
  });
  assert.equal(eligible([chim], nen(homNay), "NPC").length, 0, "hứa xong trả bài ngay trong buổi");
  assert.equal(eligible([chim], nen(homNay + 1), "NPC").length, 1, "qua đêm rồi vẫn chưa trả bài");
});
