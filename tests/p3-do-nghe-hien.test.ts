/**
 * MÓN CHƯA MỞ KHOÁ VẪN PHẢI THẤY TRONG TRANG ĐỒ NGHỀ.
 *
 * Chủ dự án, sau khi tôi bảo *"mua `DU_CHE` ở trang tối là thấy"*:
 *
 *   *"Ủa mua dù, bàn ghế kiểu gì thế? Tôi có thấy chỗ nào mua đâu?"*
 *
 * Đúng. `EveningView.gear()` `continue` thẳng qua món chưa mở khoá, nên trước ngày 8 (và
 * trước khi gặp một bữa mưa) cái dù KHÔNG TỒN TẠI ở đâu trên màn hình. Người chơi không
 * thể muốn một thứ họ chưa từng thấy — mà cái dù là chỗ dựa của mười câu "đứng cho mát".
 *
 * Lưới đọc thẳng mã: cái cần canh là "có vẽ món bị khoá không", và nó nói điều kiện bằng
 * tiếng người chứ không phải tên cờ.
 *
 * ⚠️ Cái dù KHÔNG còn bị khoá (đợt rút gọn gỡ hết cổng của thế giới, chỉ giữ hai `minDay` của
 * kịch bản), nên lưới này giờ bám vào `BANG_QR`. Lý do ban đầu vẫn đứng: món chưa mở khoá vẫn
 * phải THẤY, vì người chơi không thể muốn một thứ họ chưa từng thấy.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EQUIP, EQUIP_IDS, unlocked } from "../src/sim/equipment";

const SRC = readFileSync(new URL("../src/ui/evening/EveningView.ts", import.meta.url), "utf8");
const GEAR = SRC.slice(SRC.indexOf("private gear()"), SRC.indexOf("private stands()"));

test("DN-1 không còn bỏ qua món chưa mở khoá", () => {
  assert.ok(!/if \(!own && \(d\.starting \|\| !unlocked\(/.test(GEAR),
    "vẫn `continue` qua món chưa mở khoá — người chơi không thấy nó tồn tại");
  assert.match(GEAR, /const khoa = !own && !unlocked\(/, "không tính trạng thái khoá để vẽ mờ");
  assert.match(GEAR, /box\.style\.opacity/, "món bị khoá không được vẽ mờ cho khác món mua được");
});

test("DN-2 nói ĐIỀU KIỆN còn thiếu, không nói trống không", () => {
  assert.match(GEAR, /qua ngày \$\{u\.minDay\}/, "không nói còn chờ tới ngày mấy");
  assert.match(GEAR, /UNLOCK_WORDS/, "không dịch cờ mở khoá ra tiếng người");
});

/**
 * DN-3 — CÒN CỜ NÀO THÌ CÒN CÂU CHO CỜ ĐÓ.
 *
 * Đợt rút gọn gỡ hết cổng `afterFlag`: cái dù thôi đợi một bữa mưa (chủ dự án: *"dù che thì cần
 * gì đợi mưa. Muốn mua ngày nào mua chứ"*), và cái bồn rửa — món duy nhất còn khoá theo cờ — đã
 * bỏ khỏi cây thiết bị. Nên lưới này đổi từ "phải có cờ" thành "cờ nào còn thì phải dịch được":
 * `UNLOCK_WORDS` vẫn phải sống, vì thêm lại một cổng chỉ là thêm một dòng JSON.
 */
test("DN-3 cờ mở khoá nào còn trong dữ liệu thì đều có câu tiếng người", () => {
  for (const id of EQUIP_IDS) {
    const f = EQUIP[id].unlock?.afterFlag;
    if (f) assert.ok(SRC.includes(`${f}:`), `cờ \`${f}\` chưa có câu tiếng người trong UNLOCK_WORDS`);
  }
  assert.match(SRC, /UNLOCK_WORDS[^=]*=\s*\{[^}]*:/s, "`UNLOCK_WORDS` rỗng — thêm lại một cổng là không ai dịch nổi");
});

test("DN-4 `unlocked()` vẫn là cổng MUA — vẽ ra không có nghĩa là mua được", () => {
  // Thấy ≠ mua được. Nếu lẫn hai cái thì người chơi mua được đồ chưa tới lượt.
  // Hai món của kịch bản (bảng QR · đèn ca tối) là chỗ duy nhất còn khoá — xem `equipment.json`.
  const e = { owned: [], installed: [], wear: {} };
  assert.equal(unlocked("BANG_QR", e, 13, {}), false, "ngày 13 mà bảng QR đã mở khoá");
  assert.equal(unlocked("BANG_QR", e, 14, {}), true, "ngày 14 rồi mà bảng QR vẫn khoá");
  // Và cái dù thì KHÔNG còn khoá: mua ngày nào cũng được.
  assert.equal(unlocked("DU_CHE", e, 1, {}), true, "cái dù còn đợi một bữa mưa");
});
