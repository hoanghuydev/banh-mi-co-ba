import { test } from "node:test";
import assert from "node:assert/strict";
import { InputState, NO_DIRS, STICK_DEAD, stickDirs } from "../src/input/intent";

const R = 50;
const at = (deg: number, frac: number) => stickDirs(Math.cos(deg * Math.PI / 180) * R * frac, Math.sin(deg * Math.PI / 180) * R * frac, R);
const set = (d: ReturnType<typeof stickDirs>) => (["up", "down", "left", "right"] as const).filter((k) => d[k]).join("+");

test("vùng chết: nghiêng nhẹ thì đứng yên", () => {
  assert.deepEqual(stickDirs(0, 0, R), NO_DIRS);
  assert.deepEqual(at(0, STICK_DEAD - 0.01), NO_DIRS);
  assert.notDeepEqual(at(0, STICK_DEAD + 0.01), NO_DIRS);
});

test("tám hướng theo màn hình, 0° là phải, 90° là xuống", () => {
  const want: Record<number, string> = {
    0: "right", 45: "down+right", 90: "down", 135: "down+left",
    180: "left", 225: "up+left", 270: "up", 315: "up+right",
  };
  for (const [deg, w] of Object.entries(want)) {
    assert.equal(set(at(Number(deg), 1)).split("+").sort().join("+"), w.split("+").sort().join("+"), `${deg}°`);
  }
});

test("ranh giới giữa hai hướng nằm ở 22,5°", () => {
  assert.equal(set(at(20, 1)), "right");
  assert.equal(set(at(25, 1)), "down+right");
  assert.equal(set(at(-20, 1)), "right");
});

test("độ nghiêng không bao giờ thành chạy", () => {
  const i = new InputState();
  for (const f of [0.3, 0.6, 1, 3]) {
    i.stick = at(0, f);
    assert.equal(i.move().right, true);
    assert.equal(i.move().run, false);
  }
});

test("chạy chỉ do nút; che tay thì không chạy", () => {
  const i = new InputState();
  i.touchRun = true;
  assert.equal(i.move().run, true);
  i.touchCover = true;
  assert.equal(i.move().run, false);
  i.releaseTouch();
  assert.equal(i.move().run, false);
});

test("phím và cảm ứng cộng gộp, phím như cũ", () => {
  const i = new InputState();
  i.kbDirs = { up: true, down: false, left: false, right: false };
  i.kbRun = true;
  assert.deepEqual(i.move(), { up: true, down: false, left: false, right: false, run: true });
  i.kbCover = true;
  assert.equal(i.move().run, false);
  i.stick = at(90, 1);
  assert.equal(i.move().down, true);
});

test("nhả hết khi mất focus", () => {
  const i = new InputState();
  i.kbDirs = { up: true, down: false, left: false, right: false };
  i.kbWork = true;
  i.stick = at(180, 1);
  i.touchWork = true;
  i.releaseAll();
  assert.deepEqual(i.move(), { ...NO_DIRS, run: false });
  assert.equal(i.work, false);
});

test("hành động đi qua một cửa", () => {
  const i = new InputState();
  const got: string[] = [];
  i.onAction((a) => got.push(a));
  i.fire("interact");
  i.fire("talk");
  i.onAction(null);
  i.fire("lift");
  assert.deepEqual(got, ["interact", "talk"]);
});
