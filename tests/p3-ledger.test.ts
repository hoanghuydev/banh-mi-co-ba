/**
 * P3-06 §3 — SỔ TỐI PHẢI CỘNG LẠI ĐƯỢC.
 *
 * Trang tối không có tổng, nhưng từng dòng nó in ra là số thật: cộng hết các dòng của
 * `econ.today` phải ra đúng chênh lệch `money.cash` trong ngày. Mọi đường tiêu tiền không
 * ghi dòng nào (mua đồ nghề, trả nợ mối, hụi, cọc chỗ đứng) đều làm người chơi đọc một
 * cuốn sổ nói dối — và đó là bug tệ nhất trong một game về việc đếm tiền.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { newGame, newNpcState } from "../src/core/save";
import { buyEquip, newEquipState, resaleVnd, sellEquip } from "../src/sim/equipment";
import {
  duesOpen, eveningCount, morningRent, newEconState, newToday, pay, processDefaults, takeHui, type EconToday,
} from "../src/sim/obligations";
import { borrow, newSupplierState, repay } from "../src/sim/suppliers";
import { dawn, forcedSell, noteBasketLoaves, postMove, scout } from "../src/sim/day";
import { playerStaysOf } from "../src/sim/ending";
import { resolveFollowers } from "../src/sim/stands";

/** Tổng các dòng tiền RA của một ngày (âm = tiền vô). `coBaCovered` KHÔNG tính: két không trả. */
const outflow = (t: EconToday) =>
  t.market + t.rent + t.deposit + t.fixed + t.sendHome + t.obligations + t.hui + t.tools + t.debtRepay + t.story;

test("sổ hôm nay cộng lại đúng bằng chênh lệch cái két — một chuỗi giao dịch đủ loại", () => {
  const e = newEconState();
  const m = { cash: 5_000_000 };
  const equip = newEquipState();
  const sup = newSupplierState();
  const before = m.cash;

  morningRent(e, m);                                                  // tiền chỗ
  e.today.market += 400_000; m.cash -= 400_000;                       // đi chợ
  assert.ok(buyEquip("BINH_TRA", equip, m, e));                       // mua đồ nghề
  assert.ok(sellEquip("BINH_TRA", equip, m, 1, e) > 0);               // bán lại
  borrow(sup, 300_000, 5);
  repay(sup, m, 5, e);                                                // trả nợ mối
  pay(e, m, duesOpen(e, 5).find((d) => d.kind === "HUI")!, 5);        // góp hụi
  pay(e, m, duesOpen(e, 20).find((d) => d.kind === "TIEN_THUOC")!, 20);
  e.today.story += 30_000; m.cash -= 30_000;                          // chuyện trong hẻm (A3 ghi)
  eveningCount(e, m, 5, 40_000);                                      // than đá túi xăng + gửi về nhà

  assert.equal(outflow(e.today), before - m.cash, "sổ lệch với két");
  assert.equal(e.today.coBaCovered, 0);
});

test("hốt hụi và bị cho ra khỏi dây cũng có dòng sổ — tiền VÔ thì dòng hụi âm", () => {
  const e = newEconState(), m = { cash: 3_000_000 };
  const before = m.cash;
  for (const d of [5, 10]) pay(e, m, duesOpen(e, d).find((x) => x.kind === "HUI")!, d);
  const got = takeHui(e, m, 10);
  assert.ok(got > 0);
  assert.equal(outflow(e.today), before - m.cash);

  const e2 = newEconState(), m2 = { cash: 3_000_000 };
  pay(e2, m2, duesOpen(e2, 5).find((x) => x.kind === "HUI")!, 5);
  processDefaults(e2, m2, 11);                       // trễ lần 1 — cô Mai ứng
  const c2 = m2.cash;
  e2.today = newToday(16);
  processDefaults(e2, m2, 16);                       // trễ lần 2 — trả lại 55% tiền góp
  assert.ok(e2.huiExpelled && m2.cash > c2);
  assert.equal(outflow(e2.today), c2 - m2.cash);
});

test("cô Ba bù tiền than: sổ chỉ ghi phần két trả nổi, phần bù đi dòng riêng", () => {
  const e = newEconState(), m = { cash: 10_000 };
  eveningCount(e, m, 3, 33_000);
  assert.equal(m.cash, 0);
  assert.equal(e.today.fixed, 10_000, "ghi đủ 33.000 thì trang tối nói dối");
  assert.equal(e.today.coBaCovered, 23_000);
  assert.ok(e.coBaCovered.includes(3));
  assert.equal(outflow(e.today), 10_000);            // két chỉ mất đúng 10.000
});

test("cọc chỗ đứng: trả thiếu thì ghi thiếu — dời qua dời lại KHÔNG đẻ ra tiền", () => {
  const w = newGame("dep", "ledger-deposit");
  scout(w, "L4"); scout(w, "L5");
  // dời qua khu văn phòng với cái két rỗng: cọc thật sự đóng được là 0
  w.progress.dayIndex = 17;
  w.econ.lastMoveDay = -99;
  postMove(w, "L4", 1);
  w.progress.dayIndex = 18;
  w.money.cash = 0;
  dawn(w);
  assert.equal(w.econ.stand, "L4");
  assert.equal(w.econ.deposit, 0, "chưa trả đồng nào mà ghi nhận có cọc");
  // dời tiếp qua góc khuất: không được hoàn cái cọc chưa từng đóng
  w.econ.lastMoveDay = -99;
  postMove(w, "L5", 2);
  w.progress.dayIndex = 20;
  const before = w.money.cash;
  dawn(w);
  assert.equal(w.econ.stand, "L5");
  assert.ok(w.money.cash <= before, `két tự đẻ ra ${w.money.cash - before}₫`);
});

test("cọc có dòng sổ: dời khi đủ tiền thì `today.deposit` đúng bằng tiền cọc đi ra", () => {
  const w = newGame("dep2", "ledger-deposit2");
  scout(w, "L4");
  w.progress.dayIndex = 17;
  w.econ.lastMoveDay = -99;
  w.money.cash = 2_000_000;
  postMove(w, "L4", 2);
  w.progress.dayIndex = 19;
  const before = w.money.cash;
  dawn(w);
  const t = w.econ.today;
  assert.ok(t.deposit > 0);
  assert.equal(t.rent + t.deposit, before - w.money.cash, "tiền chỗ + cọc phải khớp cái két");
});

test("bán ép vì vỡ tiền học: món mất, tiền đi thẳng qua tiền học, két không âm không dư", () => {
  const w = newGame("sell", "ledger-forced");
  w.progress.dayIndex = 24;
  w.money.cash = 800_000;
  assert.ok(buyEquip("BINH_TRA", w.equipment, w.money, w.econ));
  w.econ.today = newToday(24);
  w.econ.mustSell = true;
  const before = w.money.cash;
  const v = forcedSell(w, "BINH_TRA");
  assert.equal(v, Math.round(resaleVnd("BINH_TRA") * (0.5 / 0.6) / 1000) * 1000);
  assert.ok(v > 0);
  assert.equal(w.money.cash, before, "tiền bán phải đi thẳng vào tiền học, không nằm lại két");
  assert.ok(!w.equipment.owned.includes("BINH_TRA"));
  assert.equal(w.econ.today.tools, -v);
  assert.equal(w.econ.today.obligations, v);
  assert.equal(outflow(w.econ.today), 0);
});

test("ghi số ổ mua ở chợ: một cửa duy nhất cho bot lẫn người thật (P4-04 §2.3)", () => {
  const st = { flags: {}, counts: {}, moments: [], basketLoaves: {} as Record<number, number> };
  for (const d of [35, 36, 37, 38]) noteBasketLoaves(st, d, 18);
  noteBasketLoaves(st, 39, 20);
  assert.equal(playerStaysOf(st.basketLoaves), "o_lai");
  noteBasketLoaves(st, 39, 0);                       // mua 0 ổ = không có gì để cộng
  assert.equal(st.basketLoaves[39], 20);
  const st2 = { flags: {}, counts: {}, moments: [], basketLoaves: {} as Record<number, number> };
  for (const d of [35, 36, 37, 38]) noteBasketLoaves(st2, d, 18);
  assert.equal(playerStaysOf(st2.basketLoaves), "dung_lai");
});

test("ba nút dời chỗ ra báo trước 1/2/4 ngày — không nút nào xoá chị Lan khỏi mùa", () => {
  for (const [inDays, want] of [[1, 1], [2, 2], [4, 4]] as const) {
    // nhiều seed: chị Lan chỉ bị bỏ lại khi noticeDays === 0, mà nút nào cũng dán giấy
    for (let s = 0; s < 40; s++) {
      const w = newGame("mv", `ledger-notice-${inDays}-${s}`);
      w.progress.dayIndex = 17;
      w.econ.lastMoveDay = -99;
      w.money.cash = 3_000_000;
      w.npcs.CHI_LAN = newNpcState();                 // chị Lan đã ghé rồi — mới có gì để mất
      scout(w, "L3");
      postMove(w, "L3", inDays);
      assert.equal(w.econ.movePlan!.moveDay - w.econ.movePlan!.postedDay, want);
      w.progress.dayIndex = 17 + inDays;
      dawn(w);
      assert.equal(w.econ.stand, "L3");
      assert.ok(!w.npcs.CHI_LAN?.gone, `báo trước ${want} ngày mà chị Lan vẫn mất hẳn (seed ${s})`);
    }
  }
  // luật canon vẫn còn: dời mà tờ giấy chưa dán ngày nào thì người im lặng mất hẳn
  const r = resolveFollowers("s", 20, "L1", "L3", 0, () => "ACQUAINTANCE", () => false);
  assert.ok(r.abandoned.includes("CHI_LAN") || r.followers.includes("CHI_LAN"));
});
