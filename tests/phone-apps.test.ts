import { test } from "node:test";
import assert from "node:assert/strict";
import { newGame } from "../src/core/save";
import { DAY_START_MIN } from "../src/core/clock";
import { stockOf } from "../src/sim/econ";
import { PRE_OPEN_ARRIVE_MIN, deliverDue, placeOrder, quote } from "../src/sim/shop";
import {
  BEAUTY_MAX, DANH_TIENG_GUESTS, REWARDS, SLOTS, accept, canSpin, cleanHandsToday, extraGuests, feeWaivedToday, patienceBonusSec,
  refuse, spin, spinIndex, swiftToday, wheelOf,
} from "../src/sim/system";
import { addReview, applyFix } from "../src/sim/reviews";
import { MAX_LISTINGS, listable, morning, post, withdraw } from "../src/sim/resell";
import { has } from "../src/sim/equipment";
import { gearBlock, gearCart, gearQuote, installPending, orderGear, pendingGear, toggleGear } from "../src/sim/gear";

test("đặt hàng trước giờ mở cửa: trừ tiền ngay, hàng tới lúc 6:10", () => {
  const w = newGame("x", "sh-1");
  const cash = w.money.cash;
  const o = placeOrder(w, { BANH: 10 }, DAY_START_MIN, { coupon: false, express: false, beforeOpen: true })!;
  assert.ok(o);
  assert.equal(w.money.cash, cash - o.total);
  assert.equal(o.deliverMin, PRE_OPEN_ARRIVE_MIN);
  assert.equal(stockOf(w.inventory, "BANH", 1), 0);
  assert.equal(deliverDue(w, PRE_OPEN_ARRIVE_MIN - 1).length, 0);
  assert.equal(deliverDue(w, PRE_OPEN_ARRIVE_MIN).length, 1);
  assert.equal(stockOf(w.inventory, "BANH", 1), 10);
  assert.equal(deliverDue(w, 700).length, 0);
});

test("đặt hàng giữa ngày: giao sáng mai", () => {
  const w = newGame("x", "sh-2");
  const o = placeOrder(w, { BANH: 5 }, 8 * 60, { coupon: false, express: false, beforeOpen: false })!;
  assert.equal(o.deliverDay, 2);
  assert.equal(deliverDue(w, 600).length, 0);
  w.progress.dayIndex = 2;
  assert.equal(deliverDue(w, DAY_START_MIN).length, 1);
});

test("không đủ tiền hoặc giỏ trống thì không đặt được", () => {
  const w = newGame("x", "sh-3");
  assert.equal(quote(w, {}, 360, { coupon: false, express: false, beforeOpen: true }).blocked, "empty");
  w.money.cash = 1000;
  assert.equal(placeOrder(w, { BANH: 10 }, 360, { coupon: false, express: false, beforeOpen: true }), null);
  assert.equal(w.money.cash, 1000);
});

test("thẻ giảm giá −10% và hoả tốc chỉ dùng khi có thẻ", () => {
  const w = newGame("x", "sh-4");
  const plain = quote(w, { BANH: 10 }, 360, { coupon: false, express: false, beforeOpen: true });
  assert.equal(placeOrder(w, { BANH: 10 }, 360, { coupon: true, express: true, beforeOpen: true })!.express, false);
  w.system.discount = 1;
  w.system.express = 1;
  const o = placeOrder(w, { BANH: 10 }, 400, { coupon: true, express: true, beforeOpen: true })!;
  assert.ok(o.total < plain.total);
  assert.equal(o.deliverMin, 460);
  assert.equal(w.system.discount, 0);
  assert.equal(w.system.express, 0);
});

test("vòng quay: 8 ô, ít nhất 2 ô may mắn, cùng ngày cùng kết quả", () => {
  const w = newGame("x", "sy-1");
  const a = wheelOf(w);
  assert.equal(a.length, SLOTS);
  assert.ok(a.filter((x) => x === "LUCK").length >= 2);
  assert.deepEqual(wheelOf(w), a);
  assert.equal(spinIndex(w), spinIndex(w));
  assert.ok(REWARDS.every((r) => r.win > 0));
});

test("chỉ quay khi đã liên kết và mới ngày 2 trở đi, mỗi ngày một lượt", () => {
  const w = newGame("x", "sy-2");
  assert.equal(canSpin(w), false);
  accept(w);
  assert.equal(canSpin(w), false);
  w.progress.dayIndex = 2;
  assert.equal(canSpin(w), true);
  assert.ok(spin(w));
  assert.equal(canSpin(w), false);
  assert.equal(spin(w), null);
});

test("từ chối hai lần là gỡ liên kết, không bao giờ quay được", () => {
  const w = newGame("x", "sy-3");
  assert.equal(refuse(w), "again");
  assert.equal(refuse(w), "gone");
  assert.equal(w.system.stage, "unlinked");
  w.progress.dayIndex = 5;
  assert.equal(canSpin(w), false);
});

test("quay nhiều ngày: tiền thưởng kỳ vọng dưới 2,5% doanh thu/ngày", () => {
  const w = newGame("x", "sy-4");
  accept(w);
  w.ledger.push({ day: 1, revenue: 450_000, cost: 300_000, served: 17, lost: 0 });
  const start = w.money.cash;
  const N = 3000;
  for (let i = 0; i < N; i++) {
    w.saveId = `sy-4-${i}`;
    w.progress.dayIndex = 2 + (i % 7);
    w.system.spunDay = 0;
    spin(w);
  }
  const perDay = (w.money.cash - start) / N;
  assert.ok(perDay / 450_000 < 0.025, `thưởng ${perDay} đồng/ngày`);
});

test("rao bán: tối đa 3 tin, đồ nghề rời xe khi đăng, gỡ tin thì về lại", () => {
  const w = newGame("x", "rb-1");
  w.equipment.owned.push("GHE_BAN");
  assert.ok(has(w.equipment, "GHE_BAN"));
  assert.ok(listable(w).equip.includes("GHE_BAN"));
  const l = post(w, "equip", "GHE_BAN", "THUONG")!;
  assert.ok(l);
  assert.equal(has(w.equipment, "GHE_BAN"), false);
  w.equipment.owned.push("DU_CHE", "QUAT_DIEN");
  assert.ok(post(w, "equip", "DU_CHE", "THUONG"));
  assert.ok(post(w, "equip", "QUAT_DIEN", "THUONG"));
  assert.equal(post(w, "equip", "GHE_BAN", "THUONG"), null);
  withdraw(w, l);
  assert.ok(has(w.equipment, "GHE_BAN"));
  assert.equal(MAX_LISTINGS, 3);
});

test("rao bán: bán được thì tiền vào két, hết hạn thì đồ về lại", () => {
  const w = newGame("x", "rb-2");
  w.equipment.owned.push("GHE_BAN");
  post(w, "equip", "GHE_BAN", "RE");
  const cash = w.money.cash;
  let sold = false;
  for (let d = 2; d < 40 && w.resell.listings.length; d++) {
    w.progress.dayIndex = d;
    morning(w);
    sold = w.money.cash > cash;
  }
  assert.equal(w.resell.listings.length, 0);
  assert.ok(sold || has(w.equipment, "GHE_BAN"));
});

test("đồ nghề: bỏ vào giỏ, đặt hàng trả tiền ngay, sáng mai mới lắp", () => {
  const w = newGame("x", "gear-1");
  const cash = w.money.cash;
  assert.equal(orderGear(w), null);
  assert.ok(toggleGear(w, "QUAT_DIEN"));
  assert.equal(gearCart(w).length, 1);
  const id = orderGear(w)!;
  assert.ok(id);
  assert.ok(w.money.cash < cash);
  assert.equal(gearCart(w).length, 0);
  assert.equal(has(w.equipment, "QUAT_DIEN"), false);
  assert.equal(gearBlock(w, "QUAT_DIEN"), "đang giao");
  assert.equal(toggleGear(w, "QUAT_DIEN"), false);
  assert.deepEqual(installPending(w), ["QUAT_DIEN"]);
  assert.equal(has(w.equipment, "QUAT_DIEN"), true);
  assert.equal(pendingGear(w).length, 0);
  assert.equal(w.shop.gearOrders[0].delivered, true);
});

test("đồ nghề: giỏ vượt tiền hoặc vượt chỗ trên xe thì không đặt được", () => {
  const w = newGame("x", "gear-2");
  w.money.cash = 100_000;
  toggleGear(w, "TU_MAT");
  assert.equal(gearQuote(w).blocked, "cash");
  assert.equal(orderGear(w), null);
  w.money.cash = 99_000_000;
  w.shop.gearCart = [];
  for (const g of ["GHE_BAN", "DU_CHE", "QUAT_DIEN", "LOA_RAO", "BANG_HIEU", "NOI_U", "LONG_BAN"] as const) toggleGear(w, g);
  w.shop.gearCart.push("TU_MAT", "LO_DIEN");
  assert.equal(gearQuote(w).blocked, "slots");
});

test("thưởng kỳ vọng theo bảng ≤ 2,5% doanh thu/ngày", () => {
  const avg = 450_000;
  const win = REWARDS.reduce((a, r) => a + r.win, 0);
  const ev = REWARDS.reduce((a, r) => a + r.win * r.value(avg), 0) / win;
  assert.ok(ev / avg <= 0.025, `${ev}`);
});

test("tiền lẻ ~25k, tiểu kim khố ~75k theo doanh thu 450k", () => {
  assert.ok(Math.abs(REWARDS.find((r) => r.id === "TIEN_LE")!.value(450_000) - 25_000) <= 2000);
  assert.ok(Math.abs(REWARDS.find((r) => r.id === "KIM_KHO")!.value(450_000) - 75_000) <= 2000);
});

function spinUntil(w: ReturnType<typeof newGame>, id: string, max = 6000) {
  for (let i = 0; i < max; i++) {
    w.saveId = `rw-${id}-${i}`;
    w.progress.dayIndex = 2;
    w.system.spunDay = 0;
    w.system.spunCount = 0;
    if (wheelOf(w)[spinIndex(w)] === id) return spin(w);
  }
  throw new Error(`không trúng ${id}`);
}

test("nhan sắc cộng dồn +1 giây mỗi lần, tối đa 15, quá thì đổi thành tiền", () => {
  const w = newGame("x", "rw-1");
  accept(w);
  for (let k = 1; k <= BEAUTY_MAX; k++) {
    spinUntil(w, "NHAN_SAC");
    assert.equal(w.system.beauty, k);
    assert.equal(patienceBonusSec(w), k);
  }
  const cash = w.money.cash;
  const r = spinUntil(w, "NHAN_SAC")!;
  assert.equal(w.system.beauty, BEAUTY_MAX);
  assert.ok(r.lines.some((l) => /không thể xinh hơn/i.test(l)));
  assert.ok(w.money.cash > cash);
});

test("bất nhiễm trần thể: hôm nay không cần rửa tay, hôm sau hết", () => {
  const w = newGame("x", "rw-2");
  accept(w);
  spinUntil(w, "BAT_NHIEM");
  assert.equal(cleanHandsToday(w), true);
  w.progress.dayIndex = 3;
  assert.equal(cleanHandsToday(w), false);
});

test("danh tiếng lan xa +3 khách, địa chủ miễn tô bỏ chi phí cố định", () => {
  const w = newGame("x", "rw-3");
  accept(w);
  spinUntil(w, "DANH_TIENG");
  assert.equal(extraGuests(w), DANH_TIENG_GUESTS);
  spinUntil(w, "MIEN_TO");
  assert.equal(feeWaivedToday(w), true);
});

test("thiên mệnh tái chuyển cho quay thêm một lần", () => {
  const w = newGame("x", "rw-4");
  accept(w);
  spinUntil(w, "TAI_CHUYEN");
  assert.equal(canSpin(w), true);
  assert.ok(spin(w));
  assert.equal(canSpin(w), false);
});

test("hồi tâm chuyển ý: sửa sao và lời, một lần, không áp dụng đau bụng", () => {
  const w = newGame("x", "rw-5");
  w.system.fix = 2;
  const a = addReview(w, { day: 2, who: "Khách A", stars: 1, text: "dở", food: false });
  const b = addReview(w, { day: 2, who: "Khách B", stars: 1, text: "đau bụng", food: true });
  assert.equal(applyFix(w, a.id, { stars: 1, text: "dở" }), false);
  assert.equal(w.system.fix, 2);
  assert.ok(applyFix(w, a.id, { stars: 4, text: "ăn lại thấy ngon" }));
  assert.equal(w.system.fix, 1);
  assert.equal(w.reviews.list.find((r) => r.id === a.id)!.edited, true);
  assert.equal(applyFix(w, a.id, { stars: 5, text: "x" }), false);
  assert.equal(applyFix(w, b.id, { stars: 5, text: "x" }), false);
});

test("thiên giáng bảo khí: tặng đồ nghề nhỏ, giao sáng mai, đồ đã có thì không tặng trùng", () => {
  const w = newGame("x", "rw-6");
  accept(w);
  spinUntil(w, "BAO_KHI");
  const order = w.shop.gearOrders[0];
  assert.equal(order.gift, true);
  assert.equal(order.total, 0);
  assert.equal(order.items.length, 1);
  assert.equal(has(w.equipment, order.items[0] as never), false);
  installPending(w);
  assert.equal(has(w.equipment, order.items[0] as never), true);
});

test("bảo khí hết món hợp thì đổi thành tiền", () => {
  const w = newGame("x", "rw-7");
  accept(w);
  w.equipment.owned.push("KEP_GAP", "LONG_BAN", "QUAT_DIEN", "GHE_BAN", "BINH_TRA", "LOA_RAO");
  const cash = w.money.cash;
  const r = spinUntil(w, "BAO_KHI")!;
  assert.ok(w.money.cash > cash);
  assert.ok(r.lines[0].includes("chuyển hoá"));
});

test("thẻ giảm giá đồ nghề −15% đúng một đơn", () => {
  const w = newGame("x", "rw-8");
  w.money.cash = 5_000_000;
  w.system.gearCoupon = 1;
  toggleGear(w, "GHE_BAN");
  const plain = gearQuote(w, false);
  const cut = gearQuote(w, true);
  assert.ok(cut.total < plain.total);
  const before = w.money.cash;
  orderGear(w, true);
  assert.equal(before - w.money.cash, cut.total);
  assert.equal(w.system.gearCoupon, 0);
});

test("phong hành chi thủ chỉ trong ngày; thiên cơ báo thời tiết ngày mai; nhân liệu vào kho", () => {
  const w = newGame("x", "rw-9");
  accept(w);
  spinUntil(w, "PHONG_HANH");
  assert.equal(swiftToday(w), true);
  w.progress.dayIndex = 3;
  assert.equal(swiftToday(w), false);
  const t = spinUntil(w, "THIEN_CO")!;
  assert.ok(/ngày mai/.test(t.lines[1]));
  const before = stockOf(w.inventory, "RAU", 2);
  spinUntil(w, "NHAN_LIEU");
  assert.ok(stockOf(w.inventory, "RAU", 2) > before);
});
