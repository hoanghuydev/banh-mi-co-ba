/**
 * VẬT VẼ RA PHẢI ĐỨNG ĐÚNG CHỖ HỆ THỐNG GỬI NGƯỜI TỚI.
 *
 * Chủ dự án hỏi: *"có làm cái xe, dù, rồi cho các item vào map không?"* — rà lại thì cái
 * xe và cái gánh đúng chỗ, còn hai món ĐỒ NGHỀ thì không:
 *
 *   `DU_CHE`  vẽ ở (12,6 · 5,6) — sau quầy — mà `SHADE_SPOT` là (15,0 · 8,2):  lệch 3,5 ô
 *   `GHE_BAN` vẽ ở (5,5 · 8,4)  — đầu hẻm — mà `SEAT_SPOT`  là (16,6 · 10,4): lệch 11,3 ô
 *
 * Nghĩa là mười câu *"đứng dưới dù cho mát"* đẩy người ta ra một khoảng vỉa hè TRỐNG, và
 * mười bảy câu mời ngồi đặt người ta cách cái ghế mình vừa mua mười một ô. Đúng cái chủ
 * dự án thấy khi chơi: *"họ chả thèm chạy lại chỗ cái ô để đứng"*.
 *
 * Lưới này đọc THẲNG mã vẽ trong `StallScene` — không đo lại bằng tay, vì đo bằng tay là
 * cách nó trôi lần đầu.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SEAT_SPOT, SHADE_SPOT } from "../src/world/map";

const SRC = readFileSync(new URL("../src/scenes/StallScene.ts", import.meta.url), "utf8");

/** Toạ độ `draw(...)` của một món đồ nghề, đọc từ chính dòng vẽ nó. */
function veO(id: string): string {
  const m = SRC.match(new RegExp(`has\\(e, "${id}"\\)\\) draw\\(([^,]+),\\s*([^,]+),`));
  assert.ok(m, `không tìm thấy chỗ vẽ ${id}`);
  return `${m![1].trim()}|${m![2].trim()}`;
}

test("VD-1 cái dù vẽ ĐÚNG chỗ mát, lấy thẳng toạ độ từ `world/map`", () => {
  assert.equal(veO("DU_CHE"), "SHADE_SPOT.x|SHADE_SPOT.y",
    "cái dù vẽ bằng số viết cứng — nó đã trôi khỏi `SHADE_SPOT` một lần rồi");
});

test("VD-2 bộ ghế vẽ ĐÚNG chỗ ngồi", () => {
  assert.equal(veO("GHE_BAN"), "SEAT_SPOT.x|SEAT_SPOT.y",
    "bộ ghế vẽ bằng số viết cứng — mời ngồi một chỗ, vẽ ghế một chỗ khác");
});

test("VD-3 hai chỗ đó không trùng nhau — đứng mát và ngồi là hai việc khác", () => {
  assert.ok(Math.hypot(SHADE_SPOT.x - SEAT_SPOT.x, SHADE_SPOT.y - SEAT_SPOT.y) > 1.5,
    "chỗ mát và chỗ ngồi dính nhau — hai act ra cùng một dáng người ở cùng một điểm");
});
