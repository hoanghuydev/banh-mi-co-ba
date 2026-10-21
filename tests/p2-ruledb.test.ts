/**
 * P2-01 §6 — rule DB: điểm = số criterion, fact vắng = loại, `absent`, `odds` không
 * rơi xuống rule thấp hơn, `applycontext` có hạn giờ, chuỗi `followup` tự tắt khi thế
 * giới đổi (khách mới tới / hàng đông).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Rng } from "../src/core/rng";
import { Query } from "../src/dialog/facts";
import { RuleDb, compileRules, tierOfScore, type SpokenState } from "../src/dialog/ruledb";
import { ContextStore } from "../src/dialog/context";
import { Speaker, newDialogState, ruleDb } from "../src/dialog/speaker";
import { newGame } from "../src/core/save";
import { HeadlessStall, POLICIES } from "../src/sim/headless";

const st = (): SpokenState => ({ once: new Set(), norepeat: {}, lastAt: new Map(), day: 1 });

function baBay(q = new Query()) {
  return q.reset().set("npcId", "BA_BAY").set("npcVisitCount", 5)
    .set("queueLength", 1).set("stallCleanliness", 90).set("playerHandsDirty", false);
}

test("rule cụ thể hơn thắng: bà Bảy có dòng riêng, khách khác rơi về generic", () => {
  const db = ruleDb();
  const q = baBay().set("eventId", "DROPPED_FOOD").set("obsState", "NOTICED");
  assert.equal(db.select("NOTICE_EVENT", q, st(), 0, new Rng(1))?.idName, "bay.drop.t1.lan1");
  q.set("npcId", "CHU_TU");
  assert.equal(db.select("NOTICE_EVENT", q, st(), 0, new Rng(1))?.idName, "tu.dropped_food");
  q.set("npcId", "KHACH_VANG_LAI");
  assert.equal(db.select("NOTICE_EVENT", q, st(), 0, new Rng(1))?.idName, "gen.drop.t1");
});

test("fact vắng mặt LOẠI rule; `absent` chỉ khớp khi fact vắng", () => {
  const db = ruleDb();
  const q = new Query().set("eventId", "DROPPED_FOOD").set("obsState", "NOTICED");
  assert.equal(db.select("NOTICE_EVENT", q, st(), 0, new Rng(1))?.idName, "gen.drop.t1");
  q.set("ctxBarkT1_DROP", true);                          // vừa nói tier-1 → rơi xuống tier-2
  assert.equal(db.select("NOTICE_EVENT", q, st(), 0, new Rng(1))?.idName, "gen.drop.t2");
  // thiếu eventId: mọi rule có criterion eventId bị loại → chỉ còn lưới an toàn
  const bare = new Query().set("obsState", "NOTICED");
  assert.equal(db.select("NOTICE_EVENT", bare, st(), 0, new Rng(1))?.idName, "gen.any.t3");
});

test("odds trượt KHÔNG để rule điểm thấp hơn nói thay", () => {
  const db = new RuleDb(compileRules([
    { id: "hi", concept: "SMALLTALK", when: { npcId: "BA_BAY", queueLength: "<=2" }, say: ["a"], odds: 0 },
    { id: "lo", concept: "SMALLTALK", when: { npcId: "BA_BAY" }, say: ["b"] },
  ]));
  assert.equal(db.select("SMALLTALK", baBay(), st(), 0, new Rng(3)), null);
  assert.equal(db.select("SMALLTALK", baBay().set("queueLength", 5), st(), 0, new Rng(3))?.idName, "lo");
});

test("giá trị mảng tách thành rule anh em; tier chỉ là tên của dải score", () => {
  const rules = compileRules([{ id: "x", concept: "IDLE", when: { npcId: ["BA_BAY", "CHU_TU"], queueLength: "0..2" }, say: ["a"] }]);
  assert.deepEqual(rules.map((r) => r.idName), ["x#0", "x#1"]);
  assert.equal(rules[0].score, 2);
  assert.deepEqual([tierOfScore(6), tierOfScore(3), tierOfScore(2)], [1, 2, 3]);
});

test("applycontext hết hạn lười, sống qua save (lưu giây CÒN LẠI), sang ngày mới là sạch", () => {
  const c = new ContextStore(1);
  c.apply("BA_BAY", "ctxBarkT1_DROP", 1, 90, 10);
  c.apply("BA_BAY", "ctxNhacQuayDo", 1, -1, 10);
  const q = new Query();
  c.write(q.reset(), "BA_BAY", 50);
  assert.equal(q.dump().length, 2);
  const saved = c.toJSON(50);                                   // còn 50 s
  const back = new ContextStore(1, saved, 0);                   // reload: đồng hồ buổi chạy lại từ 0
  back.write(q.reset(), "BA_BAY", 49);
  assert.equal(q.dump().length, 2);
  back.write(q.reset(), "BA_BAY", 51);
  assert.deepEqual(q.dump().map(([k]) => k), ["ctxNhacQuayDo"]);
  new ContextStore(2, saved, 0).write(q.reset(), "BA_BAY", 0);
  assert.equal(q.dump().length, 0);
});

test("chuỗi cải lương: followup tra lại query — khách mới tới thì tắt, hàng đông thì bà ngắt lời", () => {
  // tìm một seed để odds 35% qua
  let sp: Speaker | null = null;
  let first = null;
  for (let seed = 1; seed < 200 && !first; seed++) {
    sp = new Speaker(new Rng(seed), {}, 1, newDialogState(), 0);
    first = sp.pick("SMALLTALK", "BA_BAY", baBay(), 0);
  }
  assert.ok(first && sp);
  assert.equal(first.rule.idName, "bay.cailuong.1");
  sp.spoken(first.rule, "BA_BAY", 0);
  assert.equal(first.rule.followup?.concept, "SMALLTALK_CAILUONG_2");

  const two = sp.pick("SMALLTALK_CAILUONG_2", "BA_BAY", baBay(), 5);
  assert.equal(two?.rule.idName, "bay.cailuong.2");
  const three = sp.pick("SMALLTALK_CAILUONG_3", "BA_BAY", baBay().set("queueLength", 4), 10);
  assert.equal(three?.rule.idName, "bay.cailuong.3.ngat");

  sp.apply("BA_BAY", "ctxKhachMoiToi", 1, 8, 10);
  assert.equal(sp.pick("SMALLTALK_CAILUONG_4", "BA_BAY", baBay(), 12), null);
  // norepeat: hôm nay không kể lại từ đầu
  assert.notEqual(sp.pick("SMALLTALK", "BA_BAY", baBay(), 300)?.rule.idName, "bay.cailuong.1");
  assert.equal(sp.st.norepeat["bay.cailuong.1"], 1);
});

test("mỗi concept Service hỏi đều có lưới an toàn — tình huống cơ bản không bao giờ câm", () => {
  const db = ruleDb();
  const q = new Query();
  const cases: [string, [string, string | number | boolean][]][] = [
    ["NOTICE_EVENT", [["obsState", "NOTICED"]]],
    ["DELIVERY", [["defectCount", 0]]],
    ["DELIVERY", [["defectCount", 2]]],
    ["FAREWELL", [["leaveReason", "IMPATIENT"]]],
    ["INTERACT", [["interaction", "TEA"]]],
  ];
  for (const [concept, facts] of cases) {
    q.reset();
    for (const [k, v] of facts) q.set(k, v);
    assert.ok(db.select(concept, q, st(), 0, new Rng(1)), `${concept} ${JSON.stringify(facts)} câm`);
  }
});

test("ngày chơi thật (headless) vẫn tất định và có thoại từ rule DB", () => {
  const run = () => {
    const w = newGame("rule-db", "rule-db-seed");
    const h = new HeadlessStall(w, POLICIES.newbie, {});
    const spoken: string[] = [];
    h.bus.on("dialog:spoken", (p) => spoken.push(`${p.npcId}:${p.text}`));
    h.run();
    return { spoken, ds: w.dialogState };
  };
  const a = run(), b = run();
  assert.ok(a.spoken.length > 5, `quá ít thoại: ${a.spoken.length}`);
  assert.deepEqual(a.spoken, b.spoken);
  assert.ok(Array.isArray(a.ds.appliedContext));
});

/**
 * `BURNT_OR_COLD` gánh HAI chuyện — ổ cháy trong lò và ổ nguội lúc đưa. `eventBurnt` là
 * chỗ duy nhất tách hai nhánh, để ổ chỉ nguội không bị kêu "khét".
 */
test("ổ NGUỘI không bao giờ lôi ra được một câu 'khét' — eventBurnt tách hai nhánh", () => {
  const db = ruleDb();
  const khet = /khét|cháy|khói/i;
  const cold = new Query().set("eventId", "BURNT_OR_COLD").set("eventBurnt", false).set("obsState", "NOTICED");
  const burnt = new Query().set("eventId", "BURNT_OR_COLD").set("eventBurnt", true).set("obsState", "NOTICED");

  for (const npc of ["KHACH_VANG_LAI", "ONG_HAI", "THAY_PHUC", "ANH_DUNG", "CHI_HANH", "BE_SU", "BA_SAU", "CO_MAI", "CHU_TU", "CHU_KIET"]) {
    cold.set("npcId", npc).set("hour", 800);
    burnt.set("npcId", npc).set("hour", 800);
    // Mọi hạt giống: rule thắng rồi mới tới chuyện bốc câu nào trong `say`.
    for (let seed = 1; seed <= 8; seed++) {
      const r = db.select("NOTICE_EVENT", cold, st(), 0, new Rng(seed));
      assert.ok(r, `${npc}: ổ nguội mà không rule nào khớp`);
      for (const s of r!.say) assert.ok(!khet.test(s), `${npc}: ổ nguội mà nói "${s}" (rule ${r!.idName})`);
    }
    // …và nhánh cháy vẫn còn nguyên: người nào vốn kêu khét thì vẫn kêu.
    const b = db.select("NOTICE_EVENT", burnt, st(), 0, new Rng(1));
    assert.ok(b, `${npc}: ổ cháy mà không rule nào khớp`);
  }
});

test("rule im lặng của Anh Bảo vẫn hơn điểm rule generic ở CẢ hai nhánh cháy/nguội", () => {
  const db = ruleDb();
  for (const burnt of [true, false]) {
    const q = new Query().set("npcId", "ANH_BAO").set("eventId", "BURNT_OR_COLD").set("eventBurnt", burnt).set("obsState", "NOTICED");
    for (let seed = 1; seed <= 8; seed++) {
      const r = db.select("NOTICE_EVENT", q, st(), 0, new Rng(seed));
      assert.ok(r?.silent, `eventBurnt=${burnt} hạt ${seed}: Bảo nói "${r?.say[0]}" (rule ${r?.idName})`);
    }
  }
});

/**
 * Hai latch RIÊNG: kêu về ổ cháy xong không được bịt miệng lời chê ổ nguội ngay sau đó
 * — hai lỗi khác nhau, người ta nhắc cả hai.
 */
test("ctxBarkT1_KHET và ctxBarkT1_NGUOI không khoá chéo nhau", () => {
  const db = ruleDb();
  const q = new Query().set("eventId", "BURNT_OR_COLD").set("obsState", "NOTICED").set("npcId", "KHACH_VANG_LAI");
  assert.equal(db.select("NOTICE_EVENT", q.set("eventBurnt", true), st(), 0, new Rng(1))?.idName, "gen.burnt.t1");
  q.set("ctxBarkT1_KHET", true);                                   // vừa kêu "khét"
  assert.equal(db.select("NOTICE_EVENT", q, st(), 0, new Rng(1))?.idName, "gen.burnt.t2");
  // …ổ nguội ngay sau đó vẫn được nói tier-1, vì nó đếm bằng latch của chính nó
  assert.equal(db.select("NOTICE_EVENT", q.set("eventBurnt", false), st(), 0, new Rng(1))?.idName, "gen.cold.t1");
  q.set("ctxBarkT1_NGUOI", true);
  assert.equal(db.select("NOTICE_EVENT", q, st(), 0, new Rng(1))?.idName, "gen.cold.t2");
});
