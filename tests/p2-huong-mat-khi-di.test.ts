import { test } from "node:test";
import assert from "node:assert/strict";
import { TW, TH, facingOf, facingOf8, toScreen, type Facing8 } from "../src/world/iso";
import { COUNTER_Y, QUEUE_SLOTS } from "../src/world/map";

// Góc màn hình mỗi tấm ảnh phải nhìn về; khớp `ISO_ELEV` trong `tools/render-character.py`.
const SPRITE_LOOKS: Record<Facing8, number> = {
  e: 0,
  se: Math.atan2(TH / 2, TW / 2) * 180 / Math.PI,      // 26,57°
  s: 90,
  sw: 180 - Math.atan2(TH / 2, TW / 2) * 180 / Math.PI,
  w: 180,
  nw: -(180 - Math.atan2(TH / 2, TW / 2) * 180 / Math.PI),
  n: -90,
  ne: -Math.atan2(TH / 2, TW / 2) * 180 / Math.PI,
};

function screenAngle(wdx: number, wdy: number) {
  const a = toScreen(0, 0), b = toScreen(wdx, wdy);
  return Math.atan2(b.sy - a.sy, b.sx - a.sx) * 180 / Math.PI;
}

const gap = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

const WORLD_DIRS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4;
  const ssx = Math.cos(a), ssy = Math.sin(a);
  // ssx = wdx − wdy, ssy = wdx + wdy  ->  giải ngược
  return { wdx: (ssx + ssy) / 2, wdy: (ssy - ssx) / 2 };
});

test("facingOf8: tám hướng đi đều ra đúng tấm ảnh nhìn cùng góc, lệch 0", () => {
  for (const { wdx, wdy } of WORLD_DIRS) {
    const f = facingOf8(wdx, wdy);
    assert.ok(gap(SPRITE_LOOKS[f], screenAngle(wdx, wdy)) < 1e-9,
      `đi ${screenAngle(wdx, wdy).toFixed(2)}° mà chọn tấm "${f}" nhìn ${SPRITE_LOOKS[f]}°`);
  }
});

test("facingOf bốn hướng lệch tới 63,4° ở bước chéo — mốc để không quay lại", () => {
  const { wdx, wdy } = WORLD_DIRS.find((d) => facingOf8(d.wdx, d.wdy) === "se")!;
  assert.equal(facingOf(wdx, wdy), "s");
  const lech = gap(SPRITE_LOOKS[facingOf(wdx, wdy)], screenAngle(wdx, wdy));
  assert.ok(Math.abs(lech - 63.43) < 0.01, `lệch đo được ${lech.toFixed(2)}°`);
  assert.equal(gap(SPRITE_LOOKS[facingOf8(wdx, wdy)], screenAngle(wdx, wdy)), 0);
});

test("khách đứng trong hàng quay vuông góc vào mặt quầy", () => {
  const dy = COUNTER_Y - QUEUE_SLOTS[0].y;
  assert.ok(dy < 0, "quầy phải nằm phía y nhỏ hơn hàng chờ");
  const f = facingOf8(0, dy);
  assert.equal(f, "ne");
  assert.ok(gap(SPRITE_LOOKS[f], screenAngle(0, dy)) < 1e-9);
  assert.notEqual(f, facingOf8(1, 0));
});
