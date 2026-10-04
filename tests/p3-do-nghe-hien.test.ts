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

test("DN-3 mọi cờ mở khoá trong dữ liệu đều có câu tiếng người", () => {
  const can = new Set<string>();
  for (const id of EQUIP_IDS) { const f = EQUIP[id].unlock?.afterFlag; if (f) can.add(f); }
  assert.ok(can.size > 0, "không món nào khoá theo cờ — lưới này mất chỗ bám");
  for (const f of can) {
    assert.ok(SRC.includes(`${f}:`), `cờ \`${f}\` chưa có câu tiếng người trong UNLOCK_WORDS`);
  }
});

test("DN-4 `unlocked()` vẫn là cổng MUA — vẽ ra không có nghĩa là mua được", () => {
  // Thấy ≠ mua được. Nếu lẫn hai cái thì người chơi mua được đồ chưa tới lượt.
  const e = { owned: [], installed: [], wear: {} };
  assert.equal(unlocked("DU_CHE", e, 3, {}), false, "ngày 3 mà `DU_CHE` đã mở khoá");
  assert.equal(unlocked("DU_CHE", e, 9, { rainyDaySeen: true }), true, "đủ điều kiện mà vẫn khoá");
});
