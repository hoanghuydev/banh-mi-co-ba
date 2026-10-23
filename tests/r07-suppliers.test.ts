import { test } from "node:test";
import assert from "node:assert/strict";
import { newGame } from "../src/core/save";
import { GOOD_IDS, GOODS, QUALITIES, buy, newInventory, sickChance, stockOf, takeFull, lotQuality } from "../src/sim/econ";
import { OFFERS, SUPPLIERS, defaultOffer, marketPriceK, offerPrice, offerPriceK, offersOfGood, resolveKey } from "../src/sim/suppliers";
import { deliverDue, itemsOf, placeOrder, quote } from "../src/sim/shop";
import { TOUR_ORDER, TOUR_SUPPLIER, tourOrderReady, tourOrderSteps } from "../src/sim/tour";
import { phoneTick } from "../src/sim/phone";
import { SICK_WINDOW_DAYS, addReview, sickWindow } from "../src/sim/reviews";

const opts = { coupon: false, express: false, beforeOpen: true };

test("mọi món đều có người bán, và có ít nhất hai nhà cung cấp cho mỗi nhóm hàng chính", () => {
  for (const g of GOOD_IDS) assert.ok(offersOfGood(g).length >= 1, g);
  assert.ok(SUPPLIERS.length >= 5);
  assert.ok(offersOfGood("PATE").length >= 3);
});

test("có nơi ớt ngon mà pate dỏm, có nơi bán toàn hàng thường", () => {
  const mk = SUPPLIERS.find((s) => s.id === "MINH_KHOA")!;
  assert.equal(mk.offers.OT, "NGON");
  assert.equal(mk.offers.PATE, "BAN");
  const f = SUPPLIERS.find((s) => s.id === "FRESH24")!;
  assert.ok(Object.values(f.offers).every((t) => t === "THUONG"));
});

test("giá: dỏm rẻ hơn thường rẻ hơn ngon; nhiễu ±8% và cố định theo ngày", () => {
  for (const g of GOOD_IDS) {
    const bans = offersOfGood(g).filter((o) => o.tier === "BAN");
    const ngons = offersOfGood(g).filter((o) => o.tier === "NGON");
    if (bans.length && ngons.length) {
      assert.ok(Math.min(...bans.map((o) => offerPriceK(o, 3))) < Math.min(...ngons.map((o) => offerPriceK(o, 3))), g);
    }
  }
  for (let d = 1; d <= 40; d++) {
    assert.equal(marketPriceK("PATE", d), marketPriceK("PATE", d));
    assert.equal(marketPriceK("BANH", d) === 3.5 || marketPriceK("BANH", d) === 4.2, true);
  }
  const rs = Array.from({ length: 60 }, (_, d) => marketPriceK("TRUNG", d + 1) / GOODS.TRUNG.base_k);
  assert.ok(Math.max(...rs) <= 1.08 + 1e-9 && Math.min(...rs) >= 0.92 - 1e-9);
});

test("hàng dỏm kém ngon, mau hỏng và mới có xác suất đau bụng", () => {
  const inv = newInventory();
  buy(inv, "PATE", 20, 1, "BAN");
  buy(inv, "PATE", 20, 1, "THUONG");
  buy(inv, "PATE", 20, 1, "NGON");
  const q = (t: "BAN" | "THUONG" | "NGON") => inv.lots.find((l) => l.tier === t)!;
  assert.ok(q("BAN").q0 < q("THUONG").q0 && q("THUONG").q0 < q("NGON").q0);
  assert.equal(q("NGON").q0, 1);
  assert.equal(lotQuality(q("BAN"), 2) === null, true);
  assert.notEqual(lotQuality(q("THUONG"), 2), null);
  const got = takeFull(inv, "pate", 60, 1);
  assert.equal(got.filter((p) => p.sick > 0).length, 20);
  assert.ok(sickChance(got.filter((p) => p.sick > 0).slice(0, 1)) === 0.25);
});

test("ổ nhiều phần dỏm: 1 − Π(1 − p)", () => {
  assert.ok(Math.abs(sickChance([{ q: 1, sick: 0.4 }, { q: 1, sick: 0.35 }]) - (1 - 0.6 * 0.65)) < 1e-9);
  assert.equal(sickChance([{ q: 1, sick: 0 }]), 0);
});

test("đặt đơn theo dòng hàng: giao đúng mức vào kho, đơn cũ mã món vẫn đọc được", () => {
  const w = newGame("x", "r07-1");
  const o = placeOrder(w, { "CHO_COC.PATE": 1, "TAM_AN.RAU": 1 }, 360, opts)!;
  assert.ok(o);
  deliverDue(w, 700);
  assert.equal(w.inventory.lots.find((l) => l.good === "PATE")!.tier, "BAN");
  assert.equal(w.inventory.lots.find((l) => l.good === "RAU")!.tier, "NGON");
  assert.deepEqual(resolveKey("BANH"), { good: "BANH", tier: "THUONG" });
  assert.equal(resolveKey("khong-co"), null);
  const old = quote(w, { BANH: 10 }, 360, opts);
  assert.ok(old.subtotal > 0);
  assert.equal(itemsOf({ BANH: 10 })[0].offer, null);
});

test("tour đặt hàng ngày đầu: đủ bánh cho cả ngày, đủ món mới xong", () => {
  const w = newGame("x", "r07-2");
  const steps = tourOrderSteps(w);
  assert.equal(steps.find((s) => s.good === "BANH")!.clicks, 5, "25 ổ, mỗi cú bấm 5 ổ");
  assert.ok(steps.some((s) => s.good === "DO_CHUA_SAN"), "ngày đầu phải mua cả đồ chua");
  assert.ok(!steps.some((s) => s.good === "PATE"), "pate chưa mở ngày 1");
  assert.equal(steps.length, TOUR_ORDER.length);
  assert.equal(tourOrderReady(w), false);
  w.shop.cart[`${TOUR_SUPPLIER}.BANH`] = 5;
  assert.equal(tourOrderSteps(w).find((s) => s.good === "BANH")!.done, 1);
  for (const t of TOUR_ORDER) w.shop.cart[`${TOUR_SUPPLIER}.${t.good}`] = t.units;
  assert.equal(tourOrderReady(w), true);
  for (const s of tourOrderSteps(w)) assert.ok(defaultOffer(s.good).id.length > 0);
});

test("đau bụng: đếm theo cửa sổ 14 ngày, tin cảnh báo đến đúng lúc", () => {
  const w = newGame("x", "r07-3");
  w.progress.dayIndex = 5;
  const sick = (n: number) => {
    for (let i = 0; i < n; i++) {
      addReview(w, { day: w.progress.dayIndex, who: "x", stars: 1, text: "đau bụng", food: true });
    }
  };
  sick(1);
  assert.equal(sickWindow(w), 1);
  assert.ok(phoneTick(w).some((m) => /đau bụng/.test(m.text)));
  assert.ok(!phoneTick(w).some((m) => /đau bụng/.test(m.text)));
  sick(5);
  assert.ok(phoneTick(w).some((m) => m.from === "mom" && /đau bụng/.test(m.text)));
  // Qua cửa sổ thì rơi khỏi sổ đếm.
  w.progress.dayIndex = 5 + SICK_WINDOW_DAYS + 1;
  assert.equal(sickWindow(w), 0);
});

test("bảng mức có đủ ba mức và giá đi đúng chiều", () => {
  assert.ok(QUALITIES.BAN.price < QUALITIES.THUONG.price && QUALITIES.THUONG.price < QUALITIES.NGON.price);
  assert.ok(QUALITIES.BAN.taste < QUALITIES.THUONG.taste && QUALITIES.THUONG.taste < QUALITIES.NGON.taste);
  assert.ok(OFFERS.every((o) => offerPrice(o, 1) > 0));
  assert.equal(stockOf(newInventory(), "PATE", 1), 0);
});
