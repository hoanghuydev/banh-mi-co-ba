import { test } from "node:test";
import assert from "node:assert/strict";
import { newGame } from "../src/core/save";
import { INTRO } from "../src/content/phone/intro";
import { ME } from "../src/content/phone/contacts";
import {
  addNote, beatToMsg, deleteNote, editNote, newPhone, pendingEvent, phoneTick, reply, seedIntro, sortedThreads,
  totalUnread, unreadOf,
} from "../src/sim/phone";

const dayRow = (day: number, revenue: number, cost: number, served = 10) => ({ day, revenue, cost, served, lost: 0 });

test("tin của màn giới thiệu đã đọc hết, đủ năm cuộc chat", () => {
  const w = newGame("x", "ph-1");
  seedIntro(w.phone, INTRO);
  assert.equal(w.phone.threads.length, 5);
  assert.equal(totalUnread(w.phone), 0);
  assert.equal(sortedThreads(w.phone)[0].id, "huy");
});

test("Hoàng Huy: nhắn khi ngày 2, ghen khi quán nổi, bị sa thải rồi xin việc", () => {
  const w = newGame("x", "ph-huy");
  w.progress.dayIndex = 2;
  assert.ok(phoneTick(w).some((m) => m.from === "huy"));
  w.phone.fired.push("ky-luc-linh");
  w.phone.firedDay["ky-luc-linh"] = 5;
  w.progress.dayIndex = 6;
  assert.ok(phoneTick(w).some((m) => m.from === "huy" && /view/.test(m.text)));
  w.progress.dayIndex = 9;
  assert.ok(phoneTick(w).some((m) => /sa thải/.test(m.text)));
  assert.equal(phoneTick(w).length, 0);
  w.progress.dayIndex = 10;
  assert.ok(phoneTick(w).some((m) => m.from === "huy" && /tuyển/.test(m.text)));
});

test("tin của mình không tính là chưa đọc", () => {
  const p = newPhone();
  const c = INTRO[0];
  beatToMsg(p, c, { from: ME, text: "dạ" });
  p.threads[0].seen = 0;
  assert.equal(unreadOf(p.threads[0]), 0);
});

test("khai trương: ngày 1 có tin Linh chờ sẵn, chỉ bắn một lần", () => {
  const w = newGame("x", "ph-2");
  assert.equal(phoneTick(w).length, 1);
  assert.equal(totalUnread(w.phone), 1);
  assert.equal(phoneTick(w).length, 0);
});

test("hết ngày 1: Linh hỏi bán được bao nhiêu ổ, trả lời được và người kia đáp", () => {
  const w = newGame("x", "ph-3");
  phoneTick(w);
  w.ledger.push(dayRow(1, 400_000, 300_000, 17));
  const fired = phoneTick(w);
  assert.equal(fired.length, 1);
  const t = w.phone.threads.find((x) => x.id === "linh")!;
  const pe = pendingEvent(t)!;
  assert.match(pe.options[0].me, /17 ổ/);
  assert.ok(reply(w, "linh", 0));
  assert.equal(t.pending, undefined);
  assert.equal(t.msgs.at(-1)!.from, "linh");
  assert.equal(reply(w, "linh", 0), false);
});

test("lỗ lần đầu: mẹ nhắn; lỗ lần hai thì không nhắn lại", () => {
  const w = newGame("x", "ph-4");
  w.ledger.push(dayRow(2, 100_000, 300_000));
  w.progress.dayIndex = 2;
  assert.ok(phoneTick(w).some((m) => m.from === "mom"));
  w.ledger.push(dayRow(3, 100_000, 300_000));
  w.progress.dayIndex = 3;
  assert.ok(!phoneTick(w).some((m) => m.from === "mom" && m.text.startsWith("hôm nay")));
});

test("note: thêm, sửa, xoá, bỏ note rỗng", () => {
  const w = newGame("x", "ph-5");
  assert.equal(addNote(w, "   "), null);
  const n = addNote(w, "giá 20k bán chạy")!;
  assert.equal(w.phone.notes.length, 1);
  editNote(w, n.id, "giá 25k hơi đắt");
  assert.equal(w.phone.notes[0].text, "giá 25k hơi đắt");
  editNote(w, n.id, "");
  assert.equal(w.phone.notes.length, 0);
  const m = addNote(w, "a")!;
  deleteNote(w, m.id);
  assert.equal(w.phone.notes.length, 0);
});

test("save cũ thiếu phone vẫn đọc được", () => {
  const w = newGame("Quán Thử", "ph-6");
  assert.equal(w.shopName, "Quán Thử");
  assert.deepEqual(w.phone.threads, []);
});

test("mẹ xin tiền học: chỉ một nút Gửi, trừ tiền, ghi sổ, không xin dồn", () => {
  const w = newGame("x", "ph-tuition");
  w.money.cash = 5_000_000;
  let asked = 0;
  for (let d = 2; d < 60 && !asked; d++) {
    w.progress.dayIndex = d;
    w.ledger.push({ day: d, revenue: 500_000, cost: 350_000, served: 15, lost: 0 });
    asked = phoneTick(w, true).filter((m) => m.from === "mom" && /học/.test(m.text)).length;
  }
  assert.equal(asked, 1);
  const t = w.phone.threads.find((x) => x.id === "mom")!;
  assert.equal(pendingEvent(t)!.options.length, 1);
  const cash = w.money.cash;
  assert.ok(reply(w, "mom", 0));
  assert.ok(w.money.cash < cash);
  assert.equal(w.econ.today.family, cash - w.money.cash);
  assert.equal(t.pending, undefined);
});

test("mẹ không xin khi két còn mỏng", () => {
  const w = newGame("x", "ph-tuition-2");
  w.money.cash = 50_000;
  for (let d = 2; d < 80; d++) {
    w.progress.dayIndex = d;
    w.ledger.push({ day: d, revenue: 500_000, cost: 350_000, served: 15, lost: 0 });
    assert.ok(!phoneTick(w, true).some((m) => /học/.test(m.text)));
  }
});
