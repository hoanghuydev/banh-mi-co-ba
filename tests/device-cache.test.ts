import { test } from "node:test";
import assert from "node:assert/strict";
import { isTouch } from "../src/core/device";
import { loadSettings, saveSettings } from "../src/core/flags";

test("isTouch theo dõi cài đặt sau mỗi lần lưu", () => {
  const s = loadSettings();
  saveSettings({ ...s, touchControls: "on" });
  assert.equal(isTouch(), true);
  saveSettings({ ...s, touchControls: "off" });
  assert.equal(isTouch(), false);
  saveSettings({ ...s, touchControls: "on" });
  assert.equal(isTouch(), true);
});
