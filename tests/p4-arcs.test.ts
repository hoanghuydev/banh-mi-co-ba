/**
 * P4-01 — dàn nhân vật: chỉ số khoá theo CANON §9, luật L2 (mỗi người một thứ ngoài nghề),
 * câu gọi món nguyên văn vẫn tự đủ để làm đúng ổ (T2), lịch vắng/tín hiệu của arc, khẩu vị
 * ẩn không bao giờ phạt (ML ignorePenalty = none).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { NPCS } from "../src/content/npcs";
import { QUIRKS, arcToday, extraVisits, usualOf, type ArcCtx } from "../src/content/arcs";
import { INGREDIENTS, diffDish, dishFor, levelsOf, type Ingredient, type OrderIntent, type OrderSpec } from "../src/sim/order";
import { newGame, type SaveFile } from "../src/core/save";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { newStoryState } from "../src/sim/story";

const CANON: Record<string, [number, number, number, number]> = {
  BA_BAY: [0.9, 0.6, 0.8, 0.7], CHU_TU: [0.3, 0.3, 0.9, 0.6], ANH_DUNG: [0.2, 0.5, 0.7, 0.5], CHI_LAN: [0.9, 0.1, 0.2, 0.3],
  BE_SU: [0.4, 0.4, 0.9, 1.0], ONG_HAI: [0.5, 0.9, 0.5, 0.6], CO_MAI: [0.6, 0.4, 0.6, 0.8], THAY_PHUC: [0.8, 0.2, 0.7, 0.5],
  CHI_HANH: [0.5, 0.3, 0.6, 0.4], ANH_BAO: [0.3, 0.2, 0.8, 0.4], BA_SAU: [0.4, 0.3, 0.8, 0.9], CHU_KIET: [0.7, 0.6, 0.3, 0.4],
};

test("L1 — tên và 4 chỉ số của 12 NPC khoá đúng CANON §9", () => {
  assert.equal(NPCS.length, 12);
  for (const n of NPCS) {
    const p = n.personality;
    assert.deepEqual([p.soi, p.nongTinh, p.deTha, p.thanThien], CANON[n.id], n.id);
  }
});

test("L2 — mọi NPC có đúng một thứ không liên quan tới nghề, lộ ra bằng lời hoặc prop", () => {
  for (const n of NPCS) assert.ok(QUIRKS[n.id]?.key.length > 10 && QUIRKS[n.id].reveal.length > 3, n.id);
});

// ───────────────────────── T2: đọc lại câu nói ra bảng định lượng (không nhìn spec)

function read(phrase: string, base?: OrderIntent): OrderIntent {
  const s = phrase.toLowerCase();
  // "Như mọi bữa, mà…" = đơn quen (TRÍ NHỚ của người chơi) + phần nói thêm
  if (base && /như mọi bữa/.test(s)) {
    const it = { ...base, usual: false };
    if (/không ớt|khỏi ớt/.test(s)) it.ot = 0;
    return it;
  }
  const it: OrderIntent = { nhan: [], rau: "day-du", ot: 1, tuong: 1, usual: false };
  if (/bánh mì không|ổ bánh không/.test(s)) Object.assign(it, { rau: "khong", ot: 0, tuong: 0 });
  if (/đầy đủ/.test(s)) { it.dayDu = true; it.nhan = ["pate", "thit", "chalua"]; }
  else {
    const n: Ingredient[] = [];
    if (/pate|pa-tê/.test(s)) n.push("pate");
    if (/thịt/.test(s)) n.push("thit");
    if (/chả lụa/.test(s)) n.push("chalua");
    if (/xíu mại/.test(s)) n.push("xiumai");
    if (/ốp la|trứng/.test(s)) n.push("opla");
    it.nhan = n;
  }
  if (/ít rau|ít ngò|ít rau mùi/.test(s)) it.rau = "it";
  if (/không rau/.test(s)) it.rau = "khong";
  if (/không hành|đừng bỏ ngò/.test(s)) it.bo = ["hanhngo"];
  if (/không ớt|khỏi ớt/.test(s)) it.ot = 0;
  if (/nhiều ớt/.test(s)) it.ot = 2;
  if (/không tương/.test(s)) it.tuong = 0;
  if (/nhiều tương/.test(s)) it.tuong = 2;
  return it;
}
const sameLevels = (a: OrderSpec, it: OrderIntent) => {
  const b = levelsOf(it);
  return INGREDIENTS.every((i) => (a.levels[i.id] ?? 0) === (b[i.id] ?? 0));
};
const ctx = (day: number, flags: Record<string, number | boolean | string> = {}): ArcCtx =>
  ({ day, flags, count: () => 0, rain: false, owns: () => false, hasWrongName: () => false });

test("T2 — mọi câu gọi món nguyên văn của 40 ngày tự nó quyết định được ổ bánh", () => {
  const checked = new Set<string>();
  const check = (o: OrderSpec | undefined, who: string) => {
    if (!o || o.intent.usual || !o.phrase || checked.has(o.phrase)) return;   // "như mọi bữa" là TRÍ NHỚ, không phải câu
    checked.add(o.phrase);
    const phrase = who === "CO_MAI" && o.phrase.startsWith("Cho cô hai ổ") ? "một đầy đủ" : o.phrase;   // ổ đầu trong câu hai ổ
    const base = usualOf(who, ctx(1), 7 * 60)?.intent;
    assert.ok(sameLevels(o, read(phrase, base)), `${who}: "${o.phrase}"`);
  };
  for (let d = 1; d <= 40; d++) {
    for (const flags of [{}, { baoAsksChili: 1, dungStory: 1 }] as Record<string, number>[]) {
      const c = ctx(d, flags);
      for (const n of NPCS) {
        check(usualOf(n.id, c, 7 * 60) ?? undefined, n.id);
        check(usualOf(n.id, c, 10 * 60 + 40) ?? undefined, n.id);
        const a = arcToday(n.id, c, 7 * 60);
        check(a?.order, n.id);
        for (const m of a?.more ?? []) check(m, n.id);
      }
      for (const x of extraVisits(c)) { check(x.order, x.key); for (const m of x.more ?? []) check(m, x.key); }
    }
  }
  assert.ok(checked.size >= 25, `mới kiểm ${checked.size} câu`);
});

// ───────────────────────── lịch của arc

function dayWorld(day: number, seed = "arc"): SaveFile {
  const w = newGame("t", seed);
  w.progress.dayIndex = day;
  w.story = newStoryState();
  return w;
}
const namesOn = (day: number, seed?: string) => new HeadlessStall(dayWorld(day, seed), POLICIES.greedy).service.upcoming.map((u) => u.name);

test("chú Tư: ngày 30 trở đi KHÔNG BAO GIỜ ghé — kể cả ngày 40 (chủ ý tuyệt đối)", () => {
  for (const d of [30, 31, 33, 36, 40]) for (const seed of ["a", "b", "c"]) assert.ok(!namesOn(d, seed).includes("Chú Tư"), `ngày ${d}`);
  assert.ok(namesOn(29).includes("Chú Tư"), "ngày 29 chú còn ghé (nửa ổ — tín hiệu cuối)");
});

test("chị Lan: vắng 24–39, không một câu báo trước; anh Dũng: sáng 18 không còn; thầy Phúc vắng 20–21 rồi về", () => {
  for (const d of [24, 27, 33, 39]) assert.ok(!namesOn(d).includes("Chị Lan"), `ngày ${d}`);
  assert.ok(!namesOn(18).includes("Anh Dũng") && !namesOn(25).includes("Anh Dũng"));
  assert.ok(!namesOn(20).includes("Thầy Phúc") && !namesOn(21).includes("Thầy Phúc"));
  assert.ok(["a", "b", "c"].some((seed) => namesOn(22, seed).includes("Thầy Phúc")), "ngày 22 thầy về");
  const tu = arcToday("CHU_TU", ctx(26), 405)!;
  assert.equal(tu.at, 7 * 60 + 10);
  assert.ok(tu.after?.some((l) => (typeof l === "string" ? l : l.text).includes("Bình Dương")));
});

test("chú Kiệt: từ ngày 5 đi ngang lúc 6h10 — không bao giờ gọi món; CN nghỉ", () => {
  assert.ok(!namesOn(4).includes("Chú Kiệt"));
  assert.ok(namesOn(5).includes("Chú Kiệt"));
  assert.ok(!namesOn(7).includes("Chú Kiệt"));
  const w = dayWorld(6);
  const h = new HeadlessStall(w, POLICIES.greedy);
  const ordered: string[] = [];
  h.bus.on("order:placed", (p) => ordered.push(p.npcId));
  h.run();
  assert.ok(!ordered.includes("CHU_KIET"));
  assert.ok((w.npcs.CHU_KIET?.lastSeenDay ?? 0) === 6, "vẫn có mặt trong hẻm (đồn thổi đếm người có mặt)");
});

// ───────────────────────── khẩu vị ẩn

test("ML — làm theo khẩu vị ẩn cũng ĐÚNG; bỏ qua cũng không bị gì (ignorePenalty = none)", () => {
  const bay = usualOf("BA_BAY", ctx(3))!;
  assert.deepEqual(diffDish(bay, dishFor(bay)), []);                              // làm đúng câu nói
  const noChili = dishFor(bay).filter((x) => x !== "ot");
  assert.ok(diffDish(bay, noChili).length > 0, "không có khẩu vị ẩn thì bớt ớt là lệch câu nói");
  assert.deepEqual(diffDish({ ...bay, levels: { ...bay.levels, ...bay.alt } }, noChili), [], "khẩu vị ẩn: không ớt");
  for (const id of ["BA_BAY", "ANH_DUNG", "ANH_BAO", "CO_MAI"]) assert.ok(usualOf(id, ctx(5))!.alt, id);
  assert.ok(!usualOf("CHU_TU", ctx(22))!.alt && usualOf("CHU_TU", ctx(23))!.alt, "ML-02 chỉ từ ngày 23");
});

test("một mùa với chuyện: bot chạy 40 ngày không gãy, cô Mai trả hai ổ, bà Sáu đổi hàng không qua tiền", () => {
  const w = newGame("t", "arc-season");
  let maiPaid = 0;
  for (let d = 1; d <= 12; d++) {
    if (d > 1) nextDay(w);
    const h = new HeadlessStall(w, POLICIES.greedy);
    h.bus.on("order:placed", (p) => { if (p.npcId === "CO_MAI" && d === 2) maiPaid++; });
    h.run();
  }
  assert.equal(maiPaid, 2, "ngày 2 cô Mai gọi hai ổ, từng ổ một");
  assert.ok((w.story.counts.barterAccepted ?? 0) + (w.story.counts.barterRefused ?? 0) >= 1, "SK-02 đã diễn ra");
});

test("bức tường lửa (P4-01 NPC-07/12): cô Mai, thầy Phúc, chú Tư, bà Bảy không bao giờ kể cho chú Kiệt", async () => {
  const { tiesOf } = await import("../src/sim/gossip");
  for (const id of ["CO_MAI", "THAY_PHUC", "CHU_TU", "BA_BAY"]) assert.ok(!tiesOf(id).some((e) => e.to === "CHU_KIET"), id);
  assert.ok(tiesOf("ONG_HAI").some((e) => e.to === "CHU_KIET"), "ông Hải → chú Kiệt: đường rò rỉ nguy hiểm nhất vẫn còn");
});
