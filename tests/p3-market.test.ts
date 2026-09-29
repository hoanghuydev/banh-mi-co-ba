/**
 * P3 Đợt B — người bán là NPC (mối quen, bán chịu), sổ nợ khách, tiền lẻ, vía mở hàng.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  afterMarket, borrow, creditCeiling, dawnCheck, discounted, dueSunday, loyaltyDiscount, repay, state, type SupplierState,
} from "../src/sim/suppliers";
import { debtGap, makeChange, recalledAmount, viaOf, type DebtRecord } from "../src/sim/till";
import { NPCS } from "../src/content/npcs";

const P = Object.fromEntries(NPCS.map((n) => [n.id, n.personality]));

test("mối quen: mua đều 7 ngày → bớt 10%; bỏ một bữa với người dễ tha không mất mối, bỏ hai bữa thì mất", () => {
  const all: Record<string, SupplierState> = {};
  for (let d = 1; d <= 7; d++) afterMarket(all, new Set(["CHU_CHIN", "LO_BA_TAM"]), d);
  assert.equal(loyaltyDiscount("CHU_CHIN", state(all, "CHU_CHIN")), 0.10);
  afterMarket(all, new Set([]), 8);                                   // bỏ một bữa
  afterMarket(all, new Set(["CHU_CHIN", "LO_BA_TAM"]), 9);
  assert.equal(state(all, "LO_BA_TAM").streak, 8, "bà Tám (dễ tha) bỏ một bữa vẫn giữ mối");
  assert.equal(state(all, "CHU_CHIN").streak, 1, "chú Chín (ân hạn 0) bỏ một bữa là mất mối");
});

test("bánh mì của bà Tám là MỎ NEO — mối quen bao lâu cũng không bớt", () => {
  const s = { ...state({}, "LO_BA_TAM"), streak: 30 };
  assert.equal(discounted("BANH", 3.5, "LO_BA_TAM", s), 3.5);
  assert.ok(discounted("PATE_NHA", 32, "LO_BA_TAM", s) < 32);
});

test("bán chịu: người lạ 0; quen rồi mới cho; trễ một lần trần ×0,75 VĨNH VIỄN; chú Chín không bao giờ cho nợ", () => {
  const all: Record<string, SupplierState> = {};
  assert.equal(creditCeiling("LO_BA_TAM", state(all, "LO_BA_TAM")), 0);
  for (let d = 1; d <= 5; d++) afterMarket(all, new Set(["LO_BA_TAM", "CHU_CHIN"]), d);
  const tam = state(all, "LO_BA_TAM");
  const c0 = creditCeiling("LO_BA_TAM", tam);
  assert.ok(c0 > 0);
  assert.equal(creditCeiling("CHU_CHIN", state(all, "CHU_CHIN")), 0);
  borrow(tam, 20_000, 5);
  assert.equal(tam.dueDay, dueSunday(5));
  dawnCheck(all, tam.dueDay! + 1);                                    // quá hạn
  assert.equal(tam.lateCount, 1);
  assert.ok(creditCeiling("LO_BA_TAM", tam) < c0);
  repay(tam, { cash: 100_000 }, 20);
  for (let d = 20; d < 60; d++) afterMarket(all, new Set(["LO_BA_TAM"]), d);
  assert.ok(creditCeiling("LO_BA_TAM", tam) <= c0 * 0.75 * (400 / 120) + 1000, "không đường nào làm trần tăng lại");
});

test("trả nợ TRƯỚC hạn là một lần PAID_EARLY — đường lên 'thân'", () => {
  const s = state({}, "DI_NAM");
  borrow(s, 30_000, 3);
  repay(s, { cash: 30_000 }, 4);
  assert.equal(s.paidEarly, 1);
  assert.equal(s.owed, 0);
});

const debt = (npcId: string, amt = 45_000, wrote: number | null = null): DebtRecord =>
  ({ npcId, day: 1, minute: 400, trueAmount: amt, playerWrote: wrote });

test("sổ nợ: ghi rồi thì số ghi luôn thắng; không ghi thì người soi nhớ thiếu, người thân thiện nhớ dư", () => {
  assert.equal(recalledAmount(debt("CHI_LAN", 45_000, 40_000), 7, P.CHI_LAN, "s", true), 40_000);
  let lan = 0, sau = 0;
  for (let i = 0; i < 40; i++) {
    lan += recalledAmount({ ...debt("CHI_LAN"), day: i }, i + 6, P.CHI_LAN, "s", true);
    sau += recalledAmount({ ...debt("BA_SAU"), day: i }, i + 6, P.BA_SAU, "s", true);
  }
  assert.ok(lan / 40 < 45_000 && sau / 40 > 45_000, `Lan ${lan / 40} · Sáu ${sau / 40}`);
  // trợ năng #1: tắt nhớ nhầm → luôn đúng số
  assert.equal(recalledAmount(debt("BA_SAU"), 7, P.BA_SAU, "s", false), 45_000);
});

test("không ghi sổ thì đối sổ ra hụt; nợ quá 14 ngày là xoá sổ", () => {
  const d1 = { ...debt("CHI_LAN"), settledOnDay: 7, settledAmount: 40_000 };
  const d2 = debt("ANH_BAO");
  assert.equal(debtGap([d1, d2], 10), 5_000);
  assert.equal(debtGap([d1, d2], 20), 5_000 + 45_000);
});

test("tiền lẻ: đủ thì thối; thiếu ≤ 5k thì bớt cho khách; thiếu nhiều thì chạy qua cô Mai", () => {
  const f = { floatLeft: 30_000 };
  assert.ok(makeChange(25_000, f, 0.5).ok);                           // đưa 30k, thối 5k
  const g = { floatLeft: 2_000 };
  const r = makeChange(25_000, g, 0.5);
  assert.ok(!r.ok && r.roundedDown === 3_000);
  const h = { floatLeft: 0 };
  const r2 = makeChange(25_000, h, 0.9);                               // đưa 50k
  assert.ok(!r2.ok && r2.ranToCoMai);
});

test("vía: khách mở hàng bỏ đi hoặc mình không có tiền thối → vía xấu; trả đủ + cười + khách thân → vía tốt", () => {
  const base = { walkedAway: false, complained: false, noChange: false, paidExact: false, smiled: false, friend: false };
  assert.equal(viaOf({ ...base, walkedAway: true }), -1);
  assert.equal(viaOf({ ...base, noChange: true }), -1);
  assert.equal(viaOf({ ...base, paidExact: true, smiled: true }), 1);
  assert.equal(viaOf({ ...base, paidExact: true }), 0);
});
