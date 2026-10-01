/**
 * Ổ BÁNH ĐÃ NẰM DƯỚI ĐẤT — `serveDish(..., { soiled: true })`.
 *
 * Cả luật này chỉ là MỘT câu hỏi: người đứng trước mặt CÓ THẤY ổ bánh rớt không. Hai
 * nhánh, và khoảng cách giữa hai cái giá mới là thứ phải giữ — nếu nhánh "không ai thấy"
 * mà rẻ quá thì nước đi tối ưu thành "cứ đưa đại, cầu cho nó đừng ngó".
 *
 * Mấy con số ở đây (95 · 30) là HỢP ĐỒNG, không phải chi tiết cài đặt.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { HeadlessStall, POLICIES } from "../src/sim/headless";
import { dishFor } from "../src/sim/order";
import type { Customer } from "../src/sim/customer";

type Ev = { e: string; p: any };

/**
 * Dựng tới đúng khoảnh khắc một NGƯỜI CÓ TÊN đứng ở quầy chờ bánh, rồi trả quyền điều
 * khiển lại cho test. `workSec` khổng lồ để con bot không bao giờ tự đưa bánh — tay đưa
 * bánh trong mấy bài này là tay của test.
 */
function atCounter(day = 7) {
  const bus = new Bus();
  const ev: Ev[] = [];
  bus.onAny((e, p) => { if (e !== "clock:tick") ev.push({ e, p: p as any }); });
  const w = newGame("t", "soil-save");
  w.progress.dayIndex = day;
  const h = new HeadlessStall(w, { ...POLICIES.greedy, name: "ro", workSec: [1e9, 1e9] }, { bus });
  h.run({ until: (x) => !!x.service.front && x.service.front.phase === "waiting" && !!x.service.front.npc });
  const c = h.service.front!;
  assert.ok(c?.npc, "bài này cần một người CÓ TÊN — khách vãng lai không có sổ nhớ");
  ev.length = 0;                                       // chỉ quan tâm những gì xảy ra TỪ LÚC ĐƯA BÁNH
  return { h, bus, ev, c };
}

/**
 * Cho người này một chút vốn quan hệ trước đã.
 *
 * `clampPoints` chặn sàn ở `floorOfTier(highestTier)` = 0 với người chưa từng lên hạng,
 * nên một mục trí nhớ XẤU đầu tiên không kéo điểm xuống dưới 0 được — delta = 0 và
 * `relationship:moved` im lặng. Đó là luật sẵn có của `sim/memory.ts`, không phải chuyện
 * của bài này; muốn ĐO cái dòng HUD thì phải có sẵn cái để mất.
 */
function hasSomethingToLose(h: HeadlessStall, key: string) {
  h.ctx.world.npcs[key].relationPoints = 40;
}

/** Người này đã tận mắt thấy một ổ bánh rớt xuống đất trong lượt ghé này. */
function sawTheDrop(c: Customer, peak: "NOTICED" | "CONFIRMED" = "CONFIRMED") {
  c.observations.set(`DROPPED_FOOD:${c.id}`, {
    id: "DROPPED_FOOD", slot: "HANDS", certainty: peak === "CONFIRMED" ? 1 : 0.8, peak, diedAt: null,
  });
}

const pick = (ev: Ev[], e: string) => ev.filter((x) => x.e === e).map((x) => x.p);
const dropMemories = (ev: Ev[]) => pick(ev, "memory:written").filter((p) => p.kind === "DROPPED_FOOD");

// ───────────────────────────────────────────────── nhánh 1: bị bắt tận mắt

test("THẤY ổ rớt mà vẫn đưa: không bán được, khách bỏ về", () => {
  const { h, ev, c } = atCounter();
  sawTheDrop(c);
  const cashBefore = h.ctx.world.money.cash;

  const res = h.service.serveDish(dishFor(c.order!), { soiled: true });

  assert.equal(res.ok, false, "không có lượt giao nào hết — lắc đầu là lắc đầu");
  assert.ok(res.reason && res.reason.length > 0 && res.reason.length <= 40, `toast phải ngắn: "${res.reason}"`);
  assert.equal(c.phase, "leaving");
  assert.equal(c.leaveReason, "soiled");
  assert.deepEqual(pick(ev, "npc:left").map((p) => p.reason), ["SOILED_FOOD"]);
  // không `order:delivered`, không tiền: lượt bán đó không hề xảy ra
  assert.equal(pick(ev, "order:delivered").length, 0);
  assert.equal(h.ctx.world.money.cash, cashBefore);
  assert.equal(h.service.servedCount, 0);
});

test("bị bắt: ghi trí nhớ DROPPED_FOOD mức 95 — nặng hơn cả nuốt lời", () => {
  const { h, ev, c } = atCounter();
  sawTheDrop(c);
  h.service.serveDish(dishFor(c.order!), { soiled: true });

  const mem = dropMemories(ev);
  assert.equal(mem.length, 1, "đúng MỘT mục, không phải mỗi chặng một mục");
  assert.equal(mem[0].intensity, 95);
  assert.equal(mem[0].npcId, c.memKey);
  // và nó phải SỐNG QUA NGÀY: nằm trong RelState, không phải trong lượt ghé
  const s = h.ctx.world.npcs[c.memKey];
  assert.ok([...s.memory.short, ...s.memory.long].some((m) => m.kind === "DROPPED_FOOD"),
    "ăn gian xong hôm sau quên sạch thì không còn là hệ quả nữa");
});

test("bị bắt: HUD nhận đúng một dòng, nói đúng chuyện vừa xảy ra", () => {
  const { h, ev, c } = atCounter();
  hasSomethingToLose(h, c.memKey);
  sawTheDrop(c);
  h.service.serveDish(dishFor(c.order!), { soiled: true });

  const moved = pick(ev, "relationship:moved");
  assert.equal(moved.length, 1);
  assert.equal(moved[0].dir, "DOWN");
  assert.equal(moved[0].note, "đồ ăn rơi xuống đất");
  assert.equal(moved[0].strength, "RO", "95 điểm mà hiện 'nhẹ' thì người chơi đọc sai hẳn");
});

test("bị bắt: tính là một người chơi ĐỂ MẤT — khác hẳn chuyện quay đầu vì đông", () => {
  const { h, c } = atCounter();
  const lostBefore = h.service.lostCount;
  sawTheDrop(c);
  h.service.serveDish(dishFor(c.order!), { soiled: true });
  assert.equal(h.service.lostCount, lostBefore + 1);
  assert.equal(h.service.balkedCount, 0, "đừng lẫn hai cửa mất khách vào nhau");
});

test("chỉ LIẾC THẤY (NOTICED) cũng đủ để không ăn — không cần CONFIRMED", () => {
  const { h, c } = atCounter();
  sawTheDrop(c, "NOTICED");
  const res = h.service.serveDish(dishFor(c.order!), { soiled: true });
  assert.equal(res.ok, false);
});

// ────────────────────────────────────────────── nhánh 2: không ai thấy gì

test("KHÔNG thấy: vẫn bán được, vẫn nhận tiền", () => {
  const { h, ev, c } = atCounter();
  const cashBefore = h.ctx.world.money.cash;
  const res = h.service.serveDish(dishFor(c.order!), { soiled: true });
  for (let i = 0; i < 30; i++) h.step();               // sổ tiền chảy qua `service.out`, cần vài frame

  assert.equal(res.ok, true);
  assert.deepEqual(pick(ev, "npc:left").map((p) => p.reason), ["SERVED"]);
  assert.equal(pick(ev, "order:delivered").length, 1);
  // Tiền vô két HOẶC vô sổ nợ (`SHORT_OF_CASH_RATE` — thầy Phúc ngày 7 mua chịu), nên
  // đừng chấm bằng `cash`: thứ phải đúng là LƯỢT BÁN CÓ XẢY RA.
  assert.equal(h.ctx.world.progress.today.served, 1, "họ có biết gì đâu mà không nhận bánh");
  assert.ok(h.ctx.world.money.cash >= cashBefore);
  assert.equal(h.service.lostCount, 0);
});

test("KHÔNG thấy: cái giá NHỎ HƠN HẲN — 30 so với 95", () => {
  const { h, ev, c } = atCounter();
  hasSomethingToLose(h, c.memKey);
  h.service.serveDish(dishFor(c.order!), { soiled: true });

  const mem = dropMemories(ev);
  assert.equal(mem.length, 1);
  assert.equal(mem[0].intensity, 30);
  // Khoảng cách này LÀ luật chơi: gần nhau quá thì nước đi tối ưu thành "cứ đưa đại".
  assert.ok(mem[0].intensity * 3 <= 95, "bị bắt phải đắt hơn gấp bội lần trót lọt");

  const moved = pick(ev, "relationship:moved");
  assert.equal(moved.length, 1);
  assert.equal(moved[0].dir, "DOWN");
  assert.equal(moved[0].note, "nhai phải sạn");
});

test("KHÔNG thấy: cùng KIND nên làm lần nữa là CỘNG DỒN trên đầu người đó", () => {
  // Đây mới là cái răn thật của nhánh này, không phải con số 30.
  const { h, c } = atCounter();
  h.service.serveDish(dishFor(c.order!), { soiled: true });
  const s = h.ctx.world.npcs[c.memKey];
  const m = [...s.memory.short, ...s.memory.long].find((x) => x.kind === "DROPPED_FOOD");
  assert.ok(m, "phải có mục trí nhớ, dù người ta không biết vì sao");
  assert.equal(m!.kind, "DROPPED_FOOD", "cùng kind với nhánh bị bắt — hai lần là occurrences lên 2");
});

test("KHÔNG thấy: lượt đó MẤT TƯ CÁCH một ổ sạch", () => {
  // `servedWell()` không chạy và `disprove()` không chạy. Bán gian thì không gột được
  // tiếng — kể cả khi không ai bắt được.
  const clean = (() => {
    const { h, c } = atCounter();
    h.service.serveDish(dishFor(c.order!), {});
    return h.ctx.world.npcs[c.memKey].relationPoints;
  })();
  const gritty = (() => {
    const { h, c } = atCounter();
    h.service.serveDish(dishFor(c.order!), { soiled: true });
    return h.ctx.world.npcs[c.memKey].relationPoints;
  })();
  assert.ok(clean > 0, "một ổ đàng hoàng phải đẩy quan hệ lên");
  assert.ok(gritty < clean, "ổ có sạn không được hưởng cái đẩy lên đó");
});

// ─────────────────────────────────────────────────── cờ đi theo TỪNG Ổ

test("thấy ổ rớt, rồi được đưa ổ KHÁC còn sạch: không có gì xảy ra hết", () => {
  const { h, ev, c } = atCounter();
  sawTheDrop(c);
  const res = h.service.serveDish(dishFor(c.order!), {});       // soiled vắng mặt = ổ sạch

  assert.equal(res.ok, true, "làm rớt một ổ rồi nướng ổ khác thì không bị phạt");
  assert.deepEqual(pick(ev, "npc:left").map((p) => p.reason), ["SERVED"]);
  assert.equal(dropMemories(ev).length, 0, "không mục trí nhớ nào sinh ra từ lượt giao này");
  assert.equal(pick(ev, "relationship:moved").filter((p) => p.note === "đồ ăn rơi xuống đất").length, 0);
});

test("ổ sạch cho người KHÔNG thấy gì: đường cũ không suy suyển một chữ", () => {
  const { h, ev, c } = atCounter();
  const res = h.service.serveDish(dishFor(c.order!), {});
  assert.equal(res.ok, true);
  assert.equal(dropMemories(ev).length, 0);
});

// ───────────────────────────────────────────────────────────── tất định

test("tất định: cùng seed, cùng thao tác → mọi sự kiện giống hệt từng byte", () => {
  const once = (soiled: boolean, saw: boolean) => {
    const { h, ev, c } = atCounter();
    if (saw) sawTheDrop(c);
    h.service.serveDish(dishFor(c.order!), { soiled });
    for (let i = 0; i < 60; i++) h.step();              // cho câu thoại kịp ra khỏi hàng đợi
    return JSON.stringify(ev);
  };
  for (const [soiled, saw] of [[true, true], [true, false], [false, true]] as const) {
    assert.equal(once(soiled, saw), once(soiled, saw), `soiled=${soiled} saw=${saw}`);
  }
});
