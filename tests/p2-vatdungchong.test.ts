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
import { MAP, SEAT_SPOT, SHADE_SPOT } from "../src/world/map";

const SRC = readFileSync(new URL("../src/scenes/StallScene.ts", import.meta.url), "utf8");

/** Toạ độ `draw(...)` của một món đồ nghề, đọc từ chính dòng vẽ nó. */
function veO(id: string): string {
  const m = SRC.match(new RegExp(`has\\(e, "${id}"\\)\\) draw\\(([^,]+),\\s*([^,]+),`));
  assert.ok(m, `không tìm thấy chỗ vẽ ${id}`);
  return `${m![1].trim()}|${m![2].trim()}`;
}

/**
 * Cái dù không còn đi qua `draw(...)`: từ lúc nó là ẢNH THẬT (`PROP.umbrella`) nó có hàm riêng
 * `addUmbrella`, và nó lùi ra sau chỗ đứng mát một quãng để cái đế đá không trùm lên người đang
 * đứng đó. Cắt lấy thân hàm rồi mới dò — dò thẳng cả file thì cái regex toạ độ vớ phải dòng đầu
 * tiên nào trông giống nó.
 */
function thanDu(): string {
  const i = SRC.indexOf("private addUmbrella()");
  assert.ok(i > 0, "không tìm thấy `addUmbrella` trong StallScene");
  const j = SRC.indexOf("\n  }\n", i);
  return SRC.slice(i, j < 0 ? i + 3000 : j);
}

test("VD-1 cái dù dựng ĐÚNG chỗ mát, lấy thẳng toạ độ từ `world/map`", () => {
  const m = thanDu().match(/const tx = SHADE_SPOT\.x([^,]*), ty = SHADE_SPOT\.y([^;]*);/);
  assert.ok(m, "cái dù dựng bằng số viết cứng — nó đã trôi khỏi `SHADE_SPOT` một lần rồi");
  // Lùi phải ĐỀU trên hai trục. Lệch một trục là lùi theo đường chéo khác, mà đường chéo kia đi
  // NGANG màn hình — tán dù trôi sang bên, bỏ người đứng mát đứng ngoài nắng.
  assert.equal(m![1].trim(), m![2].trim(),
    "lùi lệch giữa hai trục — tán dù trôi ngang khỏi chỗ người đứng");
});

test("VD-1b lùi ra sau vừa đủ: không chồng chỗ người đứng, cũng không hở nắng", () => {
  const m = SRC.match(/const UMBRELLA_BACK = ([\d.]+);/);
  assert.ok(m, "không tìm thấy `UMBRELLA_BACK`");
  const back = Number(m![1]);
  // 0 là quay về đúng lỗi cũ: cột dù và cái đế đá nằm chồng lên người đứng mát, và `depthOf`
  // cho hai vật cùng tổng x+y thì ai vẽ sau nấy đè.
  assert.ok(back > 0, "cái dù dựng ngay trên đầu chỗ đứng — người sẽ lún trong đế dù");
  // Tán dù rộng ~1,8 ô. Lùi quá nửa ô là mép tán bò qua khỏi chỗ người đứng.
  assert.ok(back <= 0.6, `lùi ${back} ô — người đứng mát lòi ra ngoài tán dù`);
});

test("VD-2 bộ ghế vẽ ĐÚNG chỗ ngồi", () => {
  assert.equal(veO("GHE_BAN"), "SEAT_SPOT.x|SEAT_SPOT.y",
    "bộ ghế vẽ bằng số viết cứng — mời ngồi một chỗ, vẽ ghế một chỗ khác");
});

test("VD-3 hai chỗ đó không trùng nhau — đứng mát và ngồi là hai việc khác", () => {
  assert.ok(Math.hypot(SHADE_SPOT.x - SEAT_SPOT.x, SHADE_SPOT.y - SEAT_SPOT.y) > 1.5,
    "chỗ mát và chỗ ngồi dính nhau — hai act ra cùng một dáng người ở cùng một điểm");
});

/**
 * VD-4 — ĐỒ ĐỨNG DƯỚI SÀN THÌ PHẢI ĐỨNG TRÊN Ô ĐI ĐƯỢC.
 *
 * Cái tủ lạnh từng đứng ở x=2,6, mà x=2 là Ô TƯỜNG: điểm chạm đất của nó nằm bên trong bức vách.
 * Hình vẽ code cũ rộng 24 px nên còn đọc trôi được thành "cái thùng dựa vào vách"; đổi sang ảnh
 * thật rộng 36 px là lòi ra ngay nửa cái tủ chui vào tường.
 *
 * Lưới này chỉ soi mấy món `addPhotoProp(PROP.…, x, y)` gọi bằng SỐ — tức đồ đứng dưới sàn. Cái
 * dù không lọt vào đây vì nó tính toạ độ từ `SHADE_SPOT` (VD-1 lo), mà `SHADE_SPOT` thì
 * `assertWalkable()` đã soi.
 */
test("VD-4 đồ nghề là ảnh thật không đứng chồng lên tường", () => {
  const calls = [...SRC.matchAll(/addPhotoProp\(PROP\.(\w+),\s*([\d.]+),\s*([\d.]+)/g)];
  assert.ok(calls.length > 0, "không tìm thấy món đồ nghề ảnh thật nào đặt bằng toạ độ số");
  for (const [, ten, sx, sy] of calls) {
    const tx = Math.floor(Number(sx)), ty = Math.floor(Number(sy));
    assert.equal(MAP[ty][tx], ".",
      `${ten} đứng ở (${sx} · ${sy}) -> ô "${MAP[ty][tx]}" ở (${tx},${ty}), không phải sàn đi được`);
  }
});
