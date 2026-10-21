import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CAL, dishQuality, isRain, loafPriceVnd, lotQuality, newInventory, priceOf, stockOf, take, tasteThreshold, tierOf, weatherOf, buy,
} from "../src/sim/econ";
import { eveningCount, morningRent, newEconState, rentVnd } from "../src/sim/obligations";
import { newGame } from "../src/core/save";
import { MENU_ITEMS } from "../src/sim/menu";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { weekdayOf } from "../src/sim/schedule";

test("lịch 40 ngày cố định: ngày 1 thứ Hai; 11 mưa rào + 2 mưa dầm + 2 oi", () => {
  assert.equal(weekdayOf(1), "MON");
  const w = CAL.weather;
  assert.equal(w.length, 40);
  assert.equal(w.filter((x) => x === "MUA_RAO").length, 11);
  assert.equal(w.filter((x) => x === "MUA_DAM").length, 2);
  assert.equal(w.filter((x) => x === "OI").length, 2);
  assert.equal(weatherOf(24), "MUA_DAM");
  assert.ok(isRain(weatherOf(19)));
});

test("giá chợ: thứ Hai đắt, thứ Năm rẻ; dịch heo ngày 19–23; bánh mì là mỏ neo 3,5 (trừ lò bà Tám nghỉ)", () => {
  assert.ok(priceOf("THIT_NGUOI", 1) > priceOf("THIT_NGUOI", 4));
  assert.ok(priceOf("PATE_THUONG", 22) > priceOf("PATE_THUONG", 15) * 1.3); // 22 và 15 đều thứ Hai
  for (let d = 1; d <= 40; d++) assert.equal(priceOf("BANH", d), d >= 28 && d <= 30 ? 4.2 : 3.5);
  // pate thường gốc 60k: thứ Hai ≈ 67; ngày 22 = thứ Hai × dịch heo 1,4 × rằm 0,95 ≈ 90
  assert.ok(Math.abs((priceOf("PATE_THUONG", 1) / 20) * 60 - 67) <= 1);
  assert.ok(Math.abs((priceOf("PATE_THUONG", 22) / 20) * 60 - 90) <= 2);
});

test("kho: lô cũ nhất trước; pate trong thùng xốp chỉ sống 1 ngày; hàng hư là KHOÁ", () => {
  const inv = newInventory();
  buy(inv, "PATE_THUONG", 1, 1);
  buy(inv, "PATE_NHA", 1, 2);
  // hạn 1 ngày = dùng tới hết ngày sau ngày mua
  assert.equal(stockOf(inv, "PATE_THUONG", 2), 20);
  assert.equal(stockOf(inv, "PATE_THUONG", 3), 0);
  const inv2 = newInventory();
  buy(inv2, "THIT_NGUOI", 1, 1);
  buy(inv2, "THIT_NGUOI", 1, 2);
  const q = take(inv2, "thit", 3, 2);
  assert.equal(q.length, 3);
  assert.equal(inv2.lots.find((l) => l.day === 1)!.left, 12 - 3);
  assert.equal(lotQuality({ good: "RAU", day: 1, left: 1, q0: 1 }, 3), null);
});

test("đồ chua đạt đỉnh ngày 3, ngày 7 còn 0,60 (khoá cứng P3-03)", () => {
  const jar = (age: number) => lotQuality({ good: "DO_CHUA_NL", day: 10, left: 80, q0: 1 }, 10 + age);
  assert.equal(jar(3), 1.0);
  assert.equal(jar(7), 0.6);
  assert.equal(jar(10), null);
});

test("chất lượng ổ: pate rẻ một mình KHÔNG vượt ngưỡng chị Lan; pate rẻ + rau cũ + đồ chua ngày 7 thì vượt", () => {
  const lan = tasteThreshold(0.9);
  const cheap = dishQuality(1, [{ ing: "pate", q: 0.82 }, { ing: "pate", q: 0.82 }]);
  assert.ok(1 - cheap < lan);
  const bad = dishQuality(1, [{ ing: "pate", q: 0.82 }, { ing: "dualeo", q: 0.55 }, { ing: "dochua", q: 0.6 }]);
  assert.ok(1 - bad >= lan);
});

test("giá đọc từ BẢNG MENU, không đếm nhân: món một nhân thường · đầy đủ · đầy đủ + xin thêm = đặc biệt", () => {
  assert.equal(tierOf({ mon: "pate" }), "thuong");
  assert.equal(tierOf({ mon: "xiumai" }), "thuong", "ổ xíu mại CÓ pate mà vẫn là giá món một nhân — đây là chỗ cách đếm nhân sai");
  assert.equal(tierOf({ mon: "daydu" }), "dayDu");
  assert.equal(tierOf({ mon: "daydu", nhieu: "pate" }), "dacBiet");
  assert.equal(tierOf({ mon: "xiumai", nhieu: "xiumai" }), "thuong", "xin nhiều xíu mại không làm ổ thường thành ổ đặc biệt");
  assert.equal(tierOf({ mon: "khong" }), "khong");
  for (const it of MENU_ITEMS) assert.ok(loafPriceVnd(it.tier) > 0, it.id);
});

test("lịch quay vòng: ngày quá độ dài lịch vẫn có thời tiết và giá", () => {
  const n = CAL.weather.length;
  assert.equal(weatherOf(n + 1), weatherOf(1));
  assert.equal(weatherOf(n + 24), weatherOf(24));
  assert.equal(priceOf("BANH", n + 28), priceOf("BANH", 28));
  assert.ok(priceOf("PATE_THUONG", n + 22) > priceOf("PATE_THUONG", n + 15) * 1.3, "dịch heo không quay lại ở vòng lịch sau");
});

test("tiền thuê một mức mỗi ngày; thiếu thì dồn sang mai, trả nợ cũ trước", () => {
  const e = newEconState(); const m = { cash: 0 };
  assert.equal(morningRent(e, m).paid, 0);
  assert.equal(e.rentOwed, rentVnd());
  m.cash = 10 * rentVnd();
  assert.equal(morningRent(e, m).paid, 2 * rentVnd());
  assert.equal(e.rentOwed, 0);
  assert.equal(m.cash, 8 * rentVnd());
});

test("két không bao giờ âm: thiếu tiền than thì trả phần có", () => {
  const e = newEconState(); const m = { cash: 10_000 };
  eveningCount(e, m, 33_000);
  assert.equal(m.cash, 0);
  assert.equal(e.today.fixed, 10_000);
});

test("chơi quá ngày 40: bot mua đủ cho 16 ổ, ngày nào cũng bán được, két không âm", () => {
  const w = newGame("pay", "p3-pay");
  for (let d = 1; d <= 50; d++) {
    if (d > 1) nextDay(w);
    new HeadlessStall(w, POLICIES.greedy).run();
    assert.ok(w.progress.today.served > 0, `ngày ${d} không bán được ổ nào`);
    assert.ok(w.money.cash >= 0);
  }
  assert.ok(w.money.cash > 0);
});
