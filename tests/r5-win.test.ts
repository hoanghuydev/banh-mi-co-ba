import { test } from "node:test";
import assert from "node:assert/strict";
import { newGame } from "../src/core/save";
import { WIN_VND, markWin, winReport } from "../src/sim/win";
import { LAST_UNLOCK_DAY } from "../src/sim/unlock";
import { markBroke } from "../src/sim/broke";

test("mốc thắng cao hơn tiền kiếm được lúc còn chưa mở hết món", () => {
  const w = newGame("t", "win");
  const perDay = 500_000;
  assert.ok(WIN_VND > w.money.cash + perDay * LAST_UNLOCK_DAY,
    "thắng được trước khi mở hết món thì nửa cái menu không ai thấy");
});

test("chưa đủ tiền thì không thắng; đủ thì bật cờ kèm ngày", () => {
  const w = newGame("t", "win");
  w.progress.dayIndex = 40;
  w.money.cash = WIN_VND - 1;
  assert.equal(markWin(w), false);
  assert.equal(w.flags.won, undefined);
  w.money.cash = WIN_VND;
  assert.equal(markWin(w), true);
  assert.equal(w.flags.won, true);
  assert.equal(w.flags.wonDay, 40);
});

test("thắng rồi thì ngày thắng không bị ghi đè", () => {
  const w = newGame("t", "win");
  w.progress.dayIndex = 40;
  w.money.cash = WIN_VND;
  markWin(w);
  w.progress.dayIndex = 41;
  assert.equal(markWin(w), true);
  assert.equal(w.flags.wonDay, 40);
});

test("đủ tiền thắng thì không thể vừa thắng vừa phá sản", () => {
  const w = newGame("t", "win");
  w.money.cash = WIN_VND;
  assert.equal(markWin(w), true);
  assert.equal(markBroke(w), false);
});

test("bảng tổng kết cộng từ sổ, không đếm lại ngày lẻ", () => {
  const w = newGame("t", "win");
  w.progress.dayIndex = 3;
  w.ledger.push(
    { day: 1, revenue: 300_000, cost: 200_000, served: 10, lost: 0 },
    { day: 2, revenue: 400_000, cost: 250_000, served: 15, lost: 1 },
  );
  w.money.cash = WIN_VND;
  markWin(w);
  const r = winReport(w);
  assert.equal(r.served, 25);
  assert.equal(r.revenue, 700_000);
  assert.equal(r.profit, 250_000);
  assert.equal(r.day, 3);
  assert.equal(r.reviews, 0);
});

test("save cũ không có cờ thắng vẫn chơi được", () => {
  const w = newGame("t", "win");
  delete w.flags.won;
  assert.equal(markWin(w), false);
  assert.equal(winReport(w).served, 0);
});
