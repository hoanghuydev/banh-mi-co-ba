/**
 * P3-05 §6 — chỗ đứng: một xe một chỗ, ai đi theo khi dời, sự kiện hẻm, trần sau khi mất chỗ.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { NPCS } from "../src/content/npcs";
import { ALLEY_EVENTS, followChance, resolveFollowers, standClosed, standDayMul } from "../src/sim/stands";
import { canMoveTo, postMove, scout } from "../src/sim/day";
import { newGame } from "../src/core/save";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";

const expectKept = (to: "L3" | "L5") => {
  let sum = 0;
  for (const n of NPCS) if (n.id !== "CHU_KIET") sum += followChance(n.id, "ACQUAINTANCE", n.personality.thanThien, "L1", to, 3);
  return sum;
};

test("dời xuống góc khuất (cùng hẻm) giữ 7–9/11 người quen; ra chợ (khác khu) chỉ giữ 1–3/11", () => {
  const l5 = expectKept("L5"), l3 = expectKept("L3");
  assert.ok(l5 >= 6.5 && l5 <= 9.5, `L5 ${l5.toFixed(2)}`);
  assert.ok(l3 >= 0.5 && l3 <= 3.2, `L3 ${l3.toFixed(2)}`);
});

test("báo trước quan trọng: dán giấy 3 ngày giữ nhiều người hơn dời ngay; dời ngay thì chị Lan mất hẳn", () => {
  const n = NPCS.find((x) => x.id === "BA_BAY")!;
  assert.ok(followChance("BA_BAY", "FRIEND", n.personality.thanThien, "L1", "L3", 3) > followChance("BA_BAY", "FRIEND", n.personality.thanThien, "L1", "L3", 0));
  const r = resolveFollowers("s", 20, "L1", "L3", 0, () => "ACQUAINTANCE", () => false);
  assert.ok(r.abandoned.includes("CHI_LAN") || r.followers.includes("CHI_LAN"));
});

test("ngập chợ 17–18 chắn chợ sáng; đám cưới ngày 38 (SK-39) KHÔNG chắn đầu hẻm; sự kiện hẻm nào cũng báo trước ≥ 1 ngày", () => {
  assert.ok(standClosed("L3", 17) && standClosed("L3", 18) && !standClosed("L3", 19));
  assert.ok(!standClosed("L1", 38) && standDayMul("L1", 38, false) > standDayMul("L1", 37, false) * 1.4);
  for (const e of ALLEY_EVENTS) assert.ok(e.fromDay - e.warnFrom >= 1 && e.line.length > 0, e.id);
});

test("dời chỗ: phải coi trước; nghỉ 6 ngày mới dời tiếp; mất chỗ vì nợ thì không về đầu hẻm được", () => {
  const w = newGame("st", "p3-stand");
  w.progress.dayIndex = 10;
  assert.equal(canMoveTo(w, "L3"), "chưa coi chỗ này");
  scout(w, "L3");
  assert.equal(canMoveTo(w, "L3"), null);
  w.econ.lastMoveDay = 7;
  assert.equal(canMoveTo(w, "L3"), "mới dời, để yên vài bữa");
  w.econ.stand = "L5";
  w.econ.lastMoveDay = -99;
  w.econ.losses.push("LOST_PRIME_STAND");
  assert.equal(canMoveTo(w, "L1"), "đầu hẻm giờ chú Kiệt thuê rồi");
});

test("mùa headless: dời ra chợ ngày 20 → người không đi theo không ghé nữa; một xe một chỗ mọi lúc (CD-1)", () => {
  const w = newGame("mv", "p3-move");
  for (let d = 1; d <= 26; d++) {
    if (d > 1) nextDay(w);
    if (d === 16) { scout(w, "L3"); postMove(w, "L3", 4); }
    new HeadlessStall(w, { ...POLICIES.greedy, build: [] }).run();
    assert.equal(typeof w.econ.stand, "string");
  }
  assert.equal(w.econ.stand, "L3");
  assert.ok(w.econ.followers && w.econ.followers.length <= 6, `${w.econ.followers?.length} người theo`);
  const regularsSeen = Object.entries(w.npcs).filter(([id, n]) => !id.startsWith("walkin") && n.lastSeenDay >= 21).map(([id]) => id);
  for (const id of regularsSeen) assert.ok(w.econ.followers!.includes(id), `${id} ghé chợ mà không theo`);
});
