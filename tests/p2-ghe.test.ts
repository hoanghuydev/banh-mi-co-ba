import { test } from "node:test";
import assert from "node:assert/strict";
import { Customer } from "../src/sim/customer";
import { Rng } from "../src/core/rng";
import { NPCS } from "../src/content/npcs";

const P = Object.fromEntries(NPCS.map((n) => [n.id, n.personality]));
import { SEAT_SPOT, SHADE_SPOT, ASIDE_SPOT, SEAT_CAPACITY } from "../src/world/map";
import { TalkStore } from "../src/content/talks";
import { needKeys, walkNodes, type TalkNode } from "../src/sim/talk";

test("G-1 ngồi thì kiên nhẫn trôi CHẬM hơn — nhưng vẫn trôi", () => {
  const ai = (id: string) => new Customer(
    id, "CHU_TU", "Chú Quang", P.CHU_TU, NPCS[1].body, null,
    0, { x: 0, y: 0 }, 100, new Rng(2),
  );
  const dung = ai("a"), ngoi = ai("b");
  dung.phase = "waiting"; ngoi.phase = "waiting"; ngoi.sitting = true;
  for (let i = 0; i < 300; i++) { dung.tick(0.1, true); ngoi.tick(0.1, true); }
  assert.ok(ngoi.waitSec > 0, "ngồi mà đồng hồ chờ đứng im — cái ghế thành nút tắt kiên nhẫn");
  assert.ok(ngoi.waitSec < dung.waitSec * 0.8,
    `ngồi ${ngoi.waitSec.toFixed(1)}s vs đứng ${dung.waitSec.toFixed(1)}s — ngồi phải đỡ hơn rõ rệt`);
});

test("G-2 chỗ ngồi là một chỗ CÓ THẬT, tách khỏi chỗ mát và chỗ nép", () => {
  assert.ok(Math.hypot(SEAT_SPOT.x - SHADE_SPOT.x, SEAT_SPOT.y - SHADE_SPOT.y) >= 1,
    "ngồi với đứng mát chung một điểm — người chơi không phân biệt được hai việc");
  assert.ok(Math.hypot(SEAT_SPOT.x - ASIDE_SPOT.x, SEAT_SPOT.y - ASIDE_SPOT.y) >= 1,
    "ngồi với nép ra chung một điểm");
  assert.ok(SEAT_CAPACITY >= 1);
});

test("G-3 MỌI câu mời ngồi đều mang act THEY_SIT, khoá ghế và khoá chỗ trống", async () => {
  const MOI_NGOI = /ngồi (xuống|ghế|cái ghế|đây|nghỉ)|lấy ghế|ngồi nhờ/iu;
  const talks = await TalkStore.loadAll();
  const hong: string[] = [];
  for (const t of talks) {
    for (const { node } of walkNodes(t)) {
      const n = node as TalkNode;
      if (!MOI_NGOI.test(n.say)) continue;
      const gates = [...needKeys(n), ...(n.while ?? [])];
      const act = (n.act as { kind?: string } | undefined)?.kind;
      if (act !== "THEY_SIT") hong.push(`${t.id}: "${n.say}" — act ${act ?? "KHÔNG CÓ"}`);
      else if (n.needEquip !== "GHE_BAN") hong.push(`${t.id}: "${n.say}" — thiếu needEquip GHE_BAN`);
      else if (!gates.some((g) => g.includes("seatFree"))) hong.push(`${t.id}: "${n.say}" — thiếu while w.seatFree`);
    }
  }
  assert.deepEqual(hong, []);
});

test("G-4 `w.seatFree` là sự thật ĐỘNG — khai ở `while`, không ở `need`", async () => {
  const talks = await TalkStore.loadAll();
  for (const t of talks) {
    for (const { node } of walkNodes(t)) {
      assert.ok(!needKeys(node as TalkNode).some((k) => k.includes("seatFree")),
        `${t.id}: "${(node as TalkNode).say}" khoá \`w.seatFree\` ở \`need\` — người khác ngồi mất giữa chừng thì phải ra "?", không được ẩn`);
    }
  }
});
