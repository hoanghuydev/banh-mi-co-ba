/**
 * P3 Đợt A — kinh tế lõi: lịch mùa, giá chợ, kho theo lô, chất lượng ổ, nghĩa vụ + fail mềm.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CAL, dishQuality, isRain, lotQuality, newInventory, priceOf, stockOf, take, tasteThreshold, tierOf, weatherOf, buy,
} from "../src/sim/econ";
import {
  canTakeHui, duesOpen, eveningCount, morningRent, newEconState, pay, processDefaults, takeHui,
} from "../src/sim/obligations";
import { newGame } from "../src/core/save";
import { standClosed } from "../src/sim/stands";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { weekdayOf } from "../src/sim/schedule";
import { ROOT, walk, read } from "../tools/lib";

test("lịch mùa cố định: ngày 1 thứ Hai; 11 mưa rào + 2 mưa dầm + 2 oi (lịch mùa P4-02 §2.4 thay P3-01 §2.4.4)", () => {
  assert.equal(weekdayOf(1), "MON");
  const w = CAL.weather;
  assert.equal(w.length, 40);
  assert.equal(w.filter((x) => x === "MUA_RAO").length, 11);
  assert.equal(w.filter((x) => x === "MUA_DAM").length, 2);
  assert.equal(w.filter((x) => x === "OI").length, 2);
  assert.equal(weatherOf(24), "MUA_DAM");
  assert.ok(isRain(weatherOf(19)));
});

test("giá chợ: thứ Hai đắt, thứ Năm rẻ; dịch heo ngày 19–23 (P4-02); bánh mì là mỏ neo 3,5 (trừ lò bà Tám nghỉ)", () => {
  assert.ok(priceOf("THIT_NGUOI", 1) > priceOf("THIT_NGUOI", 4));          // T2 > T5
  assert.ok(priceOf("PATE_THUONG", 22) > priceOf("PATE_THUONG", 15) * 1.3); // dịch heo (22 và 15 đều thứ Hai)
  for (let d = 1; d <= 40; d++) assert.equal(priceOf("BANH", d), d >= 28 && d <= 30 ? 4.2 : 3.5);
  // tỉ lệ khớp bảng 40 ngày của P3-03 (pate thường 60k gốc: thứ Hai = 67; ngày 22 = thứ Hai × dịch heo 1,4 × rằm 0,95 ≈ 90)
  assert.ok(Math.abs((priceOf("PATE_THUONG", 1) / 20) * 60 - 67) <= 1);
  assert.ok(Math.abs((priceOf("PATE_THUONG", 22) / 20) * 60 - 90) <= 2);
});

test("kho: lô cũ nhất trước; pate trong thùng xốp chỉ sống 1 ngày; hàng hư là KHOÁ", () => {
  const inv = newInventory();
  buy(inv, "PATE_THUONG", 1, 1);
  buy(inv, "PATE_NHA", 1, 2);
  // "hạn 1 ngày" = dùng tới hết ngày SAU ngày mua; ngày thứ ba là hư (pate thường 2 ngày − 1 thùng xốp)
  assert.equal(stockOf(inv, "PATE_THUONG", 2), 20);
  assert.equal(stockOf(inv, "PATE_THUONG", 3), 0);
  const inv2 = newInventory();
  buy(inv2, "THIT_NGUOI", 1, 1);
  buy(inv2, "THIT_NGUOI", 1, 2);
  const q = take(inv2, "thit", 3, 2);
  assert.equal(q.length, 3);
  assert.equal(inv2.lots.find((l) => l.day === 1)!.left, 12 - 3);          // lô ngày 1 trước
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

test("giá ổ theo loại: 1 nhân thường · 2 nhân / đầy đủ · đầy đủ + xin thêm = đặc biệt", () => {
  assert.equal(tierOf({ nhan: ["pate"] }), "thuong");
  assert.equal(tierOf({ nhan: ["pate", "thit"] }), "dayDu");
  assert.equal(tierOf({ nhan: ["pate", "thit", "chalua"], dayDu: true, nhieu: "pate" }), "dacBiet");
});

test("hụi: trễ lần 1 cô Mai ứng; lần 2 bị cho ra khỏi dây (trả lại 55%) — không có game over", () => {
  const e = newEconState(); const m = { cash: 10_000_000 };
  pay(e, m, duesOpen(e, 5).find((d) => d.kind === "HUI")!, 5);
  assert.equal(processDefaults(e, m, 10).defaulted.length, 0);   // kỳ 2 hôm nay mới tới — còn ân hạn
  assert.equal(processDefaults(e, m, 11).defaulted[0].loss, "HUI_UNG");
  assert.equal(processDefaults(e, m, 16).defaulted[0].loss, "HUI_EXPELLED");
  assert.ok(e.huiExpelled && e.losses.includes("HUI_EXPELLED"));
  assert.equal(duesOpen(e, 20).filter((d) => d.kind === "HUI").length, 0);
});

test("hốt hụi: chỉ sau khi góp kỳ đó, chỉ một lần cả mùa, hốt càng muộn càng nhiều", () => {
  const e = newEconState(); const m = { cash: 10_000_000 };
  assert.equal(canTakeHui(e, 5), null);                           // kỳ 1 là của cô Mai
  for (const d of [5, 10]) pay(e, m, duesOpen(e, d).find((x) => x.kind === "HUI")!, d);
  assert.equal(canTakeHui(e, 10), 2);
  const got = takeHui(e, m, 10);
  assert.ok(got > 0);
  assert.equal(canTakeHui(e, 15), null);
});

test("tiền học quá 5 ngày ân hạn → bán bớt xe (còn 2 chỗ kẹp sẵn); tiền chỗ nợ quá 3 ngày → xuống góc khuất", () => {
  const e = newEconState(); const m = { cash: 0 };
  assert.equal(processDefaults(e, m, 23).defaulted.find((d) => d.due.kind === "TIEN_HOC")?.loss, "CART_DOWNGRADED");
  assert.equal(e.presetSlots, 2);
  for (let i = 0; i < 4; i++) morningRent(e, m);
  assert.equal(e.stand, "L5");
  assert.ok(e.losses.includes("LOST_PRIME_STAND"));
});

test("két không bao giờ âm: thiếu tiền than thì cô Ba bù, gửi về nhà gửi thiếu", () => {
  const e = newEconState(); const m = { cash: 10_000 };
  eveningCount(e, m, 3, 33_000);
  assert.equal(m.cash, 0);
  assert.ok(e.coBaCovered.includes(3));
  assert.ok(e.today.sendHomeShort > 0);
});

test("một mùa: bot không trả gì vẫn tới ngày 40 — mất là mất thật nhưng ngày sau vẫn bán", () => {
  const w = newGame("no-pay", "p3-nopay");
  for (let d = 1; d <= 40; d++) {
    if (d > 1) nextDay(w, undefined, { payDues: false });
    const h = new HeadlessStall(w, { ...POLICIES.greedy, build: [] });
    h.run();
    // ngày đám cưới chắn đầu hẻm (P3-05 §2.5) thì đứng đó không bán được — đã báo trước
    if (!standClosed(w.econ.stand, d)) assert.ok(w.progress.today.served > 0, `ngày ${d} không bán được ổ nào`);
    assert.ok(w.money.cash >= 0);
  }
  assert.ok(w.econ.losses.includes("HUI_EXPELLED"));
  assert.ok(w.econ.losses.includes("CART_DOWNGRADED"));
});

test("một mùa: bot trả đủ nghĩa vụ, mua đủ cho 16 ổ — không vỡ khoản nào", () => {
  const w = newGame("pay", "p3-pay");
  for (let d = 1; d <= 40; d++) {
    if (d > 1) nextDay(w);
    new HeadlessStall(w, POLICIES.greedy).run();
  }
  nextDay(w);
  assert.deepEqual(w.econ.losses, []);
  assert.ok(w.money.cash > 0);
});

test("vỡ tiền học khi xe có đồ nghề → phải bán một món (SOLD_EQUIPMENT), không bán bớt xe", () => {
  const w = newGame("sell", "p3-sell");
  for (let d = 1; d <= 24; d++) {
    if (d > 1) nextDay(w, undefined, { payDues: false });
    new HeadlessStall(w, { ...POLICIES.greedy, build: [[2, "KEP_GAP"], [4, "THUNG_RAC"]] }).run();
  }
  assert.ok(w.econ.losses.includes("SOLD_EQUIPMENT"));
  assert.ok(!w.econ.losses.includes("CART_DOWNGRADED"));
});

test("KHÔNG CÓ game over ở bất kỳ đâu (P3-06 §2.1)", () => {
  for (const f of walk(join(ROOT, "src"), [".ts"])) {
    assert.ok(!/gameOver|GAME_OVER/.test(read(f)), f);
  }
  void readFileSync;
});
