import { test } from "node:test";
import assert from "node:assert/strict";
import { newGame } from "../src/core/save";
import { TOUR_TOTAL, fillGap, tourAt, tourDone, tourIndex, tourSkip, tourStep, touring } from "../src/sim/tour";

test("dẫn bữa đầu chạy đủ bảy việc, theo thứ tự", () => {
  const w = newGame("x", "tour-1");
  const order = ["CHO", "MENU", "BANH", "LO", "THOT", "NHAN", "GOI"] as const;
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

test("fillGap dạy ổ bánh bằng BA PHẦN, theo đúng thứ tự pate → nhân mặn → rau", () => {
  assert.equal(fillGap([]), "PATE");
  assert.equal(fillGap(["dochua", "hanhngo"]), "PATE", "có rau mà chưa pate thì vẫn thiếu pate");
  assert.equal(fillGap(["pate"]), "MAN");
  assert.equal(fillGap(["pate", "pate"]), "MAN", "pate x2 không thay được nhân mặn");
  assert.equal(fillGap(["pate", "chalua"]), "RAU");
  assert.equal(fillGap(["pate", "chalua", "dochua"]), null);
  assert.equal(fillGap(["pate", "opla", "ot"]), null, "ớt cũng là rau");
  assert.equal(fillGap(["pate", "thit", "tuongot"]), "RAU", "tương ớt là sốt, không phải rau");
});
