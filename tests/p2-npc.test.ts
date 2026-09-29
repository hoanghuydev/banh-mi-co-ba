/**
 * P2-02 §6 + CANON §9 — dàn 12 NPC, tính cách 4 chiều, kênh phản ứng, mood, lịch ghé.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { NPCS } from "../src/content/npcs";
import { NPC_IDS } from "../src/core/types";
import { Rng } from "../src/core/rng";
import { dominant, intensityMul, isSilentGrudge, pGossip, reactionDelay } from "../src/sim/personality";
import { GROUP_OF, ReactionState, faceFor, poseFor, POSES } from "../src/sim/reaction";
import { MOOD_CAUSES, rollMood } from "../src/sim/mood";
import { rollVisit, weekdayOf } from "../src/sim/schedule";
import { Query } from "../src/dialog/facts";
import { ruleDb } from "../src/dialog/speaker";
import type { SpokenState } from "../src/dialog/ruledb";

/** CANON §9 — chép nguyên, KHÔNG được tự đổi. */
const CANON: Record<string, [number, number, number, number]> = {
  BA_BAY: [0.9, 0.6, 0.8, 0.7], CHU_TU: [0.3, 0.3, 0.9, 0.6], ANH_DUNG: [0.2, 0.5, 0.7, 0.5],
  CHI_LAN: [0.9, 0.1, 0.2, 0.3], BE_SU: [0.4, 0.4, 0.9, 1.0], ONG_HAI: [0.5, 0.9, 0.5, 0.6],
  CO_MAI: [0.6, 0.4, 0.6, 0.8], THAY_PHUC: [0.8, 0.2, 0.7, 0.5], CHI_HANH: [0.5, 0.3, 0.6, 0.4],
  ANH_BAO: [0.3, 0.2, 0.8, 0.4], BA_SAU: [0.4, 0.3, 0.8, 0.9], CHU_KIET: [0.7, 0.6, 0.3, 0.4],
};

test("12 NPC có tên, đúng id và đúng bốn chỉ số của CANON §9", () => {
  assert.equal(NPCS.length, 12);
  for (const n of NPCS) {
    assert.ok(NPC_IDS.includes(n.id as never), n.id);
    const p = n.personality;
    assert.deepEqual([p.soi, p.nongTinh, p.deTha, p.thanThien], CANON[n.id], n.id);
    const tickets = n.gaze.tickets.reduce((a, b) => a + b, 0);
    assert.equal(tickets, 20, `${n.id}: túi ánh nhìn phải đúng 20 vé`);
  }
});

test("ô 'im lặng biến mất' chỉ cấp cho ĐÚNG MỘT người — chị Lan (CANON §4 ràng buộc 2)", () => {
  assert.deepEqual(NPCS.filter((n) => isSilentGrudge(n.personality)).map((n) => n.id), ["CHI_LAN"]);
});

test("hệ số suy ra khớp bảng P2-02 §2.1", () => {
  const P = Object.fromEntries(NPCS.map((n) => [n.id, n.personality]));
  assert.equal(intensityMul(P.ONG_HAI).toFixed(2), "1.40");
  assert.equal(intensityMul(P.CHI_LAN).toFixed(2), "0.60");
  assert.equal(pGossip(P.BE_SU).toFixed(2), "0.70");
  assert.equal(pGossip(P.BA_SAU).toFixed(2), "0.65");
  assert.equal(dominant(P.CHI_LAN), "soi");
  // ông Hải (nóng) quay đầu TRƯỚC thầy Phúc (điềm đạm) — cùng jitter
  assert.ok(reactionDelay(P.ONG_HAI, 0.5) < reactionDelay(P.THAY_PHUC, 0.5));
});

test("bảng mặt §3.1 phủ đủ mọi nhóm sự kiện × chiều trội ở NOTICED/CONFIRMED; mọi dáng có target", () => {
  for (const n of NPCS) {
    for (const g of new Set(Object.values(GROUP_OF))) {
      for (const i of [2, 3] as const) {
        const f = faceFor(g, n.personality, i);
        assert.ok(f && f.every((x) => x >= 0 && x <= 5), `${n.id} ${g} I${i}`);
        assert.ok(POSES[poseFor(g, n.personality, i)]);
      }
    }
    for (const p of Object.values(n.poses ?? {})) assert.ok(POSES[p!], `${n.id}: dáng ${p}`);
  }
});

test("mặt trở về NỀN sau thời gian giữ; phản ứng có độ trễ, không đổi ngay", () => {
  const r = new ReactionState();
  r.schedule(0, 0.3, [2, 2, 1], "FREEZE", 3.8);
  r.tick(0.1);
  assert.deepEqual(r.face, [0, 0, 0]);
  r.tick(0.35);
  assert.deepEqual(r.face, [2, 2, 1]);
  assert.equal(r.pose, "FREEZE");
  r.tick(4.2);
  assert.deepEqual(r.face, [0, 0, 0]);
});

test("mood: tất định theo seed, hai ngày đầu thế giới đứng yên, đúng 7 nguyên nhân", () => {
  assert.equal(MOOD_CAUSES.length, 7);
  assert.equal(rollMood(new Rng(5), 1).cause, "NONE");
  const a = rollMood(new Rng(99), 10), b = rollMood(new Rng(99), 10);
  assert.deepEqual(a, b);
  const seen = new Set<string>();
  for (let s = 0; s < 400; s++) seen.add(rollMood(new Rng(s), 10).cause);
  assert.equal(seen.size, 7, `chỉ thấy ${[...seen]}`);
});

test("lịch: ngày 1 là thứ Hai; chú Tư không bao giờ ghé cuối tuần; không ai ghé 100% số ngày", () => {
  assert.equal(weekdayOf(1), "MON");                     // P3-01 §2.4.4: ngày 1 là thứ Hai
  assert.equal(weekdayOf(12), "FRI");
  const tu = NPCS.find((n) => n.id === "CHU_TU")!;
  let weekdays = 0, hits = 0;
  for (let d = 1; d <= 400; d++) {
    const t = rollVisit(tu.schedule, d, new Rng(d * 7919));
    const wd = weekdayOf(d);
    if (wd === "SAT" || wd === "SUN") assert.equal(t, null, `ngày ${d}`);
    else { weekdays++; if (t !== null) { hits++; assert.ok(Math.abs(t - 405) <= 7); } }
  }
  assert.ok(hits < weekdays, "không ai ghé 100%");
  assert.ok(hits / weekdays > 0.85);
});

const st = (): SpokenState => ({ once: new Set(), norepeat: {}, lastAt: new Map(), day: 1 });
function q(npc: string, facts: Record<string, string | number | boolean>) {
  const n = NPCS.find((x) => x.id === npc)!;
  const out = new Query().set("npcId", npc).set("npcSoi", Math.round(n.personality.soi * 100))
    .set("npcNongTinh", Math.round(n.personality.nongTinh * 100)).set("npcThanThien", Math.round(n.personality.thanThien * 100))
    .set("npcDeTha", Math.round(n.personality.deTha * 100)).set("queueLength", 1).set("hour", 700);
  for (const [k, v] of Object.entries(facts)) out.set(k, v);
  return out;
}

test("chị Lan: rớt bánh trước mặt → KHÔNG MỘT CHỮ (luật tính cách, không phải 35% may rủi)", () => {
  const db = ruleDb();
  const r = db.select("NOTICE_EVENT", q("CHI_LAN", { eventId: "DROPPED_FOOD", obsState: "CONFIRMED" }), st(), 0, new Rng(1));
  assert.ok(r?.silent, `chọn ${r?.idName}`);
  const d = db.select("DELIVERY", q("CHI_LAN", { defectCount: 1, defectKind: "MISSING", defectWasSeen: true }), st(), 0, new Rng(1));
  assert.ok(d?.silent);
  const u = db.select("DELIVERY", q("CHI_LAN", { defectCount: 0, orderIsUsual: true }), st(), 0, new Rng(1));
  assert.equal(u?.say[0], "…Cảm ơn em.");
});

test("chú Kiệt (M3): giao bánh HOÀN HẢO vẫn có một câu xóc — 0 lượt 'không có gì để nói'", () => {
  const db = ruleDb();
  for (let s = 0; s < 30; s++) {
    const r = db.select("DELIVERY", q("CHU_KIET", { defectCount: 0, orderIsUsual: false }), st(), 0, new Rng(s));
    assert.ok(r && !r.silent && r.idName.startsWith("kiet."), `seed ${s}: ${r?.idName}`);
  }
});

test("hai ông Hải: cùng sự kiện, trước 10h và sau 10h là hai người khác nhau", () => {
  const db = ruleDb();
  const am = db.select("NOTICE_EVENT", q("ONG_HAI", { eventId: "MADE_THEM_WAIT", obsState: "CONFIRMED", hour: 830 }), st(), 0, new Rng(1));
  const pm = db.select("NOTICE_EVENT", q("ONG_HAI", { eventId: "MADE_THEM_WAIT", obsState: "CONFIRMED", hour: 1015 }), st(), 0, new Rng(1));
  assert.equal(am?.idName, "hai.wait.sang");
  assert.equal(pm?.idName, "hai.wait.trua");
});

test("mỗi NPC có ≥ 1 nội dung không liên quan tới vai trò gameplay (P2-02 T-11)", () => {
  const db = ruleDb();
  for (const n of NPCS) {
    if (n.id === "CHI_LAN") continue;                    // chị Lan: con đường duy nhất là NHỚ ĐÚNG (P2-04 REMEMBERED_STORY)
    const has = db.all.some((r) => r.concept === "SMALLTALK" && r.criteria.length > 0 && r.idName.split(".")[0] !== "gen"
      && r.idName.startsWith(({ BA_BAY: "bay", CHU_TU: "tu", ANH_DUNG: "dung", BE_SU: "su", ONG_HAI: "hai", CO_MAI: "mai",
        THAY_PHUC: "phuc", CHI_HANH: "hanh", ANH_BAO: "bao", BA_SAU: "sau", CHU_KIET: "kiet" } as Record<string, string>)[n.id]));
    assert.ok(has, n.id);
  }
});
