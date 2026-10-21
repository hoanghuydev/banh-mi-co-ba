/** Đọc thẳng mã vẽ (không dựng được Phaser trong `node:test`) để canh có nhánh vẽ cho người ngồi và máy đang quay. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const SRC = readFileSync(new URL("../src/entities/CustomerActor.ts", import.meta.url), "utf8");

test("VE-1 có nhánh vẽ riêng cho người ĐANG NGỒI", () => {
  assert.match(SRC, /this\.sp\.sit/, "không có lò xo `sit` — ngồi phịch một frame là sai");
  assert.match(SRC, /SIT_DROP/, "không hạ thân người ngồi xuống");
  assert.match(SRC, /SIT_SQUASH/, "chỉ tụt xuống mà không nén — trông như lún xuống đất");
});

test("VE-2 có nhánh vẽ riêng cho người ĐANG QUAY", () => {
  assert.match(SRC, /if \(c\.filming\)/, "`c.filming` không được vẽ — máy chạy mà không ai thấy");
});

test("VE-3 dáng ngồi đi qua LÒ XO, không gán thẳng", () => {
  // Gán thẳng `sit.x = SIT_DROP` ngoài nhánh `reducedMotion` là nhảy nấc một frame.
  const spring = SRC.match(/spring\(this\.sp\.sit,/);
  assert.ok(spring, "`sit` không đi qua `spring()`");
});

test("VE-4 hai trạng thái đó có thật trong `Customer`", async () => {
  const src = readFileSync(new URL("../src/sim/customer.ts", import.meta.url), "utf8");
  for (const f of ["sitting", "filming"]) {
    assert.match(src, new RegExp(`\\b${f}\\b`), `\`Customer.${f}\` không tồn tại — mã vẽ bám vào hư không`);
  }
});
