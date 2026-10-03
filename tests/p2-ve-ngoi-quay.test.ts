/**
 * NGỒI THẤY ĐƯỢC, VÀ CÁI MÁY ĐANG QUAY THẤY ĐƯỢC.
 *
 * Hai món art cuối của bảng nợ, và cả hai không phải chuyện thẩm mỹ:
 *
 *   · `THEY_SIT` làm kiên nhẫn trôi chậm 45% từ đợt `GHE_BAN`, nhưng người ngồi và người
 *     đứng vẽ Y HỆT nhau — tức bỏ 320 nghìn mua bộ ghế mà màn hình không đổi một pixel.
 *   · `FILM` đặt `c.filming`, và clip hỏng nếu quầy dơ lúc máy chạy. Không vẽ gì thì người
 *     chơi KHÔNG BIẾT máy đang chạy, nên cái giá đó là một cái bẫy chứ không phải một rủi
 *     ro đọc được trước khi hành động (T5).
 *
 * Lưới đọc THẲNG mã vẽ: không dựng được Phaser trong `node:test`, mà cái cần canh là "có
 * nhánh vẽ cho hai trạng thái đó hay không", không phải từng pixel.
 */
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
