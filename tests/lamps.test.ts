import { test } from "node:test";
import assert from "node:assert/strict";
import { DAY_END_MIN, DAY_START_MIN } from "../src/core/clock";
import {
  LAMP_SPOTS, OVEN_BUSY, OVEN_IDLE, easeLevel, faceRun, faceVisible, lampAnchor, lampFloor, lampLevel, ovenTarget,
} from "../src/world/lampSpots";
import { tileAt } from "../src/world/map";

const at = (t: number) => DAY_START_MIN + t * (DAY_END_MIN - DAY_START_MIN);

test("đèn sáng rõ lúc mở quán, mờ dần giữa buổi, nhích lại cuối ngày", () => {
  assert.equal(lampLevel(DAY_START_MIN), 1);
  const low = lampLevel(at(0.65));
  assert.ok(low >= 0.2 && low <= 0.3, `${low}`);
  assert.ok(lampLevel(at(0.3)) < 1 && lampLevel(at(0.3)) > low);
  assert.ok(lampLevel(DAY_END_MIN) > low);
  assert.ok(lampLevel(DAY_END_MIN) < 0.5);
});

test("mức sáng luôn trong 0..1, kể cả ngoài giờ bán", () => {
  for (let m = DAY_START_MIN - 60; m <= DAY_END_MIN + 60; m += 7) {
    for (const rain of [false, true]) {
      const v = lampLevel(m, rain);
      assert.ok(v >= 0 && v <= 1, `${m} ${rain} ${v}`);
    }
  }
});

test("trời mưa sáng hơn trời nắng, trừ khi đã đầy", () => {
  assert.ok(lampLevel(at(0.65), true) > lampLevel(at(0.65), false));
  assert.equal(lampLevel(DAY_START_MIN, true), 1);
});

test("mọi đèn treo trên ô tường có mặt nhìn thấy", () => {
  for (const s of LAMP_SPOTS) {
    assert.ok("#ND".includes(tileAt(s.tx, s.ty)), `${s.tx},${s.ty} không phải tường`);
    assert.ok(faceVisible(s.tx, s.ty, s.face), `${s.tx},${s.ty} mặt ${s.face} bị che`);
    assert.ok(faceRun(s.tx, s.ty, s.face).includes(s.face === "y" ? s.tx : s.ty));
    assert.ok(s.along >= 0 && s.along <= 1);
    assert.ok(s.hang > 0 && s.hang < 70);
    assert.equal(s.flip, s.face === "y");
  }
});

test("ba đèn: hai đèn bàn topping trên tường trái, một đèn tường sau", () => {
  assert.equal(LAMP_SPOTS.length, 3);
  assert.equal(LAMP_SPOTS.filter((s) => s.face === "x" && s.tx === 2).length, 2);
  assert.equal(LAMP_SPOTS.filter((s) => s.face === "y" && s.ty === 0).length, 1);
});

test("vệt hắt lên mặt bàn có tâm trên ô bàn", () => {
  for (const s of LAMP_SPOTS.filter((x) => x.pool)) {
    const t = tileAt(Math.floor(s.pool!.wx), Math.floor(s.pool!.wy));
    assert.ok("QRZ".includes(t), `${s.tx},${s.ty} → ${t}`);
  }
});

test("mức sáng lò: nhẹ khi mở, mạnh khi nướng, đổi mượt", () => {
  assert.equal(ovenTarget(false), OVEN_IDLE);
  assert.equal(ovenTarget(true), OVEN_BUSY);
  assert.ok(OVEN_IDLE > 0.3 && OVEN_BUSY < 0.85 && OVEN_BUSY > OVEN_IDLE);
  const a = easeLevel(OVEN_IDLE, OVEN_BUSY, 100);
  assert.ok(a > OVEN_IDLE && a < OVEN_BUSY);
  assert.ok(Math.abs(easeLevel(OVEN_IDLE, OVEN_BUSY, 1e6) - OVEN_BUSY) < 1e-9);
  assert.equal(easeLevel(0.5, 0.8, 0), 0.5);
});

test("chỗ chiếu xuống sàn nằm ngoài tường", () => {
  for (const s of LAMP_SPOTS) {
    const f = lampFloor(s, 0.9);
    assert.ok(!"#ND".includes(tileAt(Math.floor(f.wx), Math.floor(f.wy))), `${s.tx},${s.ty}`);
  }
});

test("hai mặt tường: đèn dịch dọc mặt thì toạ độ màn hình đổi đúng hướng", () => {
  const y0 = lampAnchor({ tx: 6, ty: 0, face: "y", along: 0, hang: 10, power: 1, flip: true });
  const y1 = lampAnchor({ tx: 6, ty: 0, face: "y", along: 1, hang: 10, power: 1, flip: true });
  assert.ok(y1.x > y0.x && y1.y > y0.y);
  const x0 = lampAnchor({ tx: 2, ty: 3, face: "x", along: 0, hang: 10, power: 1, flip: false });
  const x1 = lampAnchor({ tx: 2, ty: 3, face: "x", along: 1, hang: 10, power: 1, flip: false });
  assert.ok(x1.x > x0.x && x1.y < x0.y);
});
