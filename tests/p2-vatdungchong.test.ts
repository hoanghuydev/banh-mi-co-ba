import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MAP, SEAT_SPOT, SHADE_SPOT } from "../src/world/map";

const SRC = readFileSync(new URL("../src/scenes/StallScene.ts", import.meta.url), "utf8");

function veO(id: string): string {
  const m = SRC.match(new RegExp(`has\\(e, "${id}"\\)\\) draw\\(([^,]+),\\s*([^,]+),`));
  assert.ok(m, `không tìm thấy chỗ vẽ ${id}`);
  return `${m![1].trim()}|${m![2].trim()}`;
}

function thanDu(): string {
  const i = SRC.indexOf("private addUmbrella()");
  assert.ok(i > 0, "không tìm thấy `addUmbrella` trong StallScene");
  const j = SRC.indexOf("\n  }\n", i);
  return SRC.slice(i, j < 0 ? i + 3000 : j);
}

test("VD-1 cái dù dựng ĐÚNG chỗ mát, lấy thẳng toạ độ từ `world/map`", () => {
  const m = thanDu().match(/const tx = SHADE_SPOT\.x([^,]*), ty = SHADE_SPOT\.y([^;]*);/);
  assert.ok(m, "cái dù dựng bằng số viết cứng — nó đã trôi khỏi `SHADE_SPOT` một lần rồi");
  assert.equal(m![1].trim(), m![2].trim(),
    "lùi lệch giữa hai trục — tán dù trôi ngang khỏi chỗ người đứng");
});

test("VD-1b lùi ra sau vừa đủ: không chồng chỗ người đứng, cũng không hở nắng", () => {
  const m = SRC.match(/const UMBRELLA_BACK = ([\d.]+);/);
  assert.ok(m, "không tìm thấy `UMBRELLA_BACK`");
  const back = Number(m![1]);
  assert.ok(back > 0, "cái dù dựng ngay trên đầu chỗ đứng — người sẽ lún trong đế dù");
  // Tán dù rộng ~1,8 ô.
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

test("VD-4 đồ nghề là ảnh thật không đứng chồng lên tường", () => {
  const calls = [...SRC.matchAll(/addPhotoProp\(([^,]+),\s*([\d.]+),\s*([\d.]+)/g)];
  assert.ok(calls.length > 0, "không tìm thấy món đồ nghề ảnh thật nào đặt bằng toạ độ số");
  for (const [, ten, sx, sy] of calls) {
    const tx = Math.floor(Number(sx)), ty = Math.floor(Number(sy));
    assert.ok(MAP[ty][tx] === "." || MAP[ty][tx] === "F",
      `${ten} đứng ở (${sx} · ${sy}) -> ô "${MAP[ty][tx]}" ở (${tx},${ty}), không phải sàn hay ô kho`);
  }
});
