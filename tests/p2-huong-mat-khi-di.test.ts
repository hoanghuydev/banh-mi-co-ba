import { test } from "node:test";
import assert from "node:assert/strict";
import { TW, TH, facingOf, facingOf8, toScreen, type Facing8 } from "../src/world/iso";
import { COUNTER_Y, QUEUE_SLOTS } from "../src/world/map";

/**
 * HƯỚNG MẶT PHẢI KHỚP HƯỚNG ĐI — đo bằng góc trên MÀN HÌNH, không phải trên lưới ô.
 *
 * Người chơi và khách đều đi trong hệ ô, nhưng mắt người xem thấy hệ MÀN HÌNH: `toScreen`
 * nén trục dọc còn một nửa (`TH/TW` = 0,5), nên một bước chéo trong thế giới hiện ra thành
 * một góc 26,57° chứ không phải 45°. Tấm ảnh được chọn phải là tấm mà NGƯỜI TRONG ẢNH đang
 * nhìn về đúng cái góc màn hình đó.
 *
 * `SPRITE_LOOKS` là góc mà mỗi tấm PHẢI nhìn về. Nó thành đúng khi máy ảnh render ngẩng
 * đúng góc của phép chiếu này — xem `ISO_ELEV` trong `tools/render-character.py`, chỗ đó
 * đã từng để `atan(0.5)` và làm bốn tấm chéo lệch 2,47°.
 */
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

/** Góc đi THẬT trên màn hình của một bước trong hệ ô. */
function screenAngle(wdx: number, wdy: number) {
  const a = toScreen(0, 0), b = toScreen(wdx, wdy);
  return Math.atan2(b.sy - a.sy, b.sx - a.sx) * 180 / Math.PI;
}

const gap = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

/** Tám hướng đi trong hệ ô, cách đều 45° trên lưới iso (ssx, ssy). */
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

/**
 * Vì sao khách KHÔNG được quay lại `facingOf` bốn hướng.
 *
 * Bốn hướng chọn theo trục lớn hơn, nên bước chéo `se` — trên màn hình đi xuống-phải
 * 26,57° — lại ra tấm `s` nhìn thẳng ra trước 90°. Số đo chốt ở đây để lần sau ai định
 * "đơn giản hoá" về bốn hướng thì thấy ngay cái giá.
 */
test("facingOf bốn hướng lệch tới 63,4° ở bước chéo — mốc để không quay lại", () => {
  const { wdx, wdy } = WORLD_DIRS.find((d) => facingOf8(d.wdx, d.wdy) === "se")!;
  assert.equal(facingOf(wdx, wdy), "s");
  const lech = gap(SPRITE_LOOKS[facingOf(wdx, wdy)], screenAngle(wdx, wdy));
  assert.ok(Math.abs(lech - 63.43) < 0.01, `lệch đo được ${lech.toFixed(2)}°`);
  assert.equal(gap(SPRITE_LOOKS[facingOf8(wdx, wdy)], screenAngle(wdx, wdy)), 0);
});

/**
 * Đứng gọi món thì QUAY VÀO QUẦY.
 *
 * `facing` chỉ đổi lúc đang đi, nên nếu không nắn lúc dừng thì người vừa đi từ cổng vào
 * sẽ đứng gọi món mà mặt hướng ra đường — đúng hướng bước cuối của họ.
 */
test("khách đứng trong hàng quay vuông góc vào mặt quầy", () => {
  const dy = COUNTER_Y - QUEUE_SLOTS[0].y;
  assert.ok(dy < 0, "quầy phải nằm phía y nhỏ hơn hàng chờ");
  const f = facingOf8(0, dy);
  assert.equal(f, "ne");
  // vuông góc với quầy, chiếu ra màn hình là lên-phải 26,57°
  assert.ok(gap(SPRITE_LOOKS[f], screenAngle(0, dy)) < 1e-9);
  // và KHÁC hướng người ta vừa đi vào (từ cổng bên trái, tức theo +x)
  assert.notEqual(f, facingOf8(1, 0));
});
