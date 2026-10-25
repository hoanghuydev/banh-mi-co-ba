import { test } from "node:test";
import assert from "node:assert/strict";
import { newGame } from "../src/core/save";
import { TOUR_TOTAL, dishGaps, gapText, tourAt, tourDone, tourIndex, tourSkip, tourStep, touring } from "../src/sim/tour";
import { levelsOf } from "../src/sim/order";

test("dẫn bữa đầu chạy đủ mười một việc, theo thứ tự", () => {
  const w = newGame("x", "tour-1");
  const order = ["CHO", "MENU", "KHO", "BANH", "LO", "THOT", "NHAN", "GOI", "GIAO", "TAY", "DT"] as const;
  order.forEach((step, i) => {
    assert.equal(tourStep(w), step);
    assert.equal(tourIndex(w), i + 1);
    tourDone(w, step);
  });
  assert.equal(tourStep(w), "XONG");
  assert.equal(touring(w), false);
  assert.equal(TOUR_TOTAL, order.length);
});

test("bấm Bỏ qua là hết dẫn, không hiện lại", () => {
  const w = newGame("x", "tour-6");
  tourDone(w, "CHO");
  tourSkip(w);
  assert.equal(touring(w), false);
  assert.equal(tourAt(w, "MENU"), false);
});

test("làm trước thì nhảy luôn — cầm ổ bánh lúc còn ở bước bảng menu", () => {
  const w = newGame("x", "tour-2");
  tourDone(w, "CHO");
  assert.ok(tourAt(w, "MENU"));
  tourDone(w, "BANH");                     // lấy ổ bánh trước khi kịp đọc bảng
  assert.equal(tourStep(w), "LO");         // bỏ qua bước bảng menu, không kéo ngược về
});

test("việc đã qua rồi thì không kéo ngược", () => {
  const w = newGame("x", "tour-3");
  tourDone(w, "CHO");
  tourDone(w, "MENU");
  tourDone(w, "BANH");
  assert.equal(tourStep(w), "LO");
  tourDone(w, "MENU");                     // mở lại bảng menu lần hai
  assert.equal(tourStep(w), "LO");
});

test("hết ngày 1 là hết dẫn, dù chưa làm xong", () => {
  const w = newGame("x", "tour-4");
  tourDone(w, "CHO");
  w.progress.dayIndex = 2;
  assert.equal(touring(w), false);
  assert.equal(tourAt(w, "MENU"), false);
  tourDone(w, "MENU");
  assert.equal(tourStep(w), "MENU", "qua ngày 2 thì không ghi thêm gì nữa");
});

test("save cũ không có cờ nào vẫn vào được bước đầu", () => {
  const w = newGame("x", "tour-5");
  delete (w.flags as Record<string, unknown>).tour;
  assert.equal(tourStep(w), "CHO");
  (w.flags as Record<string, unknown>).tour = "rác";
  assert.equal(tourStep(w), "CHO");
});

test("dẫn kẹp nhân theo ĐƠN: thiếu món nào chỉ món đó, đủ số phần mới thôi", () => {
  const lv = levelsOf({ mon: "opla", rau: "day-du", ot: 1, tuong: 1 });
  const ids = (stack: Parameters<typeof dishGaps>[1]) => dishGaps(lv, stack).map((g) => g.id);

  assert.deepEqual(ids([]), ["opla", "dochua", "dualeo", "hanhngo", "ot", "tuongot"]);
  assert.deepEqual(ids(["opla"]), ["dochua", "dualeo", "hanhngo", "ot", "tuongot"], "ốp la xong thì tới rau");
  assert.equal(dishGaps(lv, ["opla", "dochua"])[0].left, 1, "đồ chua hai phần, mới một phần thì còn một");
  assert.deepEqual(ids(["opla", "dochua", "dochua", "dualeo", "dualeo", "hanhngo", "hanhngo", "ot", "tuongot"]), []);
  assert.deepEqual(ids(["opla", "pate"]), ["dochua", "dualeo", "hanhngo", "ot", "tuongot"], "pate thừa không phải thiếu");
});

test("câu dẫn gọi đúng tên phần, và biết mình đang thêm tiếp", () => {
  assert.equal(gapText({ id: "dualeo", left: 2, placed: false }), "Thêm 2 lát dưa leo.");
  assert.equal(gapText({ id: "dochua", left: 1, placed: true }), "Thêm 1 phần đồ chua nữa.");
});
