/**
 * P4-03 — thư viện sự kiện nội dung: luật E1 (không cây hội thoại), E2 (bốn loại hành động,
 * luôn có "không làm gì"), 11 sự kiện bắt buộc, bảng tri thức ML (bỏ qua không bao giờ bị phạt),
 * và các móc chạy thật trong `sim/story`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../tools/lib";
import KNOW from "../src/content/season/knowledge.json";
import { doAction, endOfDay, eveningActions, newStoryState, storyCrowdMul, storyOverhear, onStoryOverheard, walkinLine } from "../src/sim/story";
import { arcToday, type ArcCtx } from "../src/content/arcs";

const DIR = join(ROOT, "src/content/events");
const EVENTS = readdirSync(DIR).filter((f) => f.endsWith(".json")).map((f) => ({ f, raw: readFileSync(join(DIR, f), "utf8"), e: JSON.parse(readFileSync(join(DIR, f), "utf8")) }));

test("40 sự kiện nội dung SK-01 → SK-40, mỗi cái một file", () => {
  assert.equal(EVENTS.length, 40);
  for (let i = 1; i <= 40; i++) assert.ok(EVENTS.some((x) => x.e.id === `SK-${String(i).padStart(2, "0")}`), `SK-${i}`);
});

test("11 sự kiện bắt buộc của brief đều có và đều mandatory", () => {
  const must = ["SK-19", "SK-07", "SK-09", "SK-31", "SK-17", "SK-04", "SK-06", "SK-38", "SK-39", "SK-10", "SK-26"];
  for (const id of must) assert.equal(EVENTS.find((x) => x.e.id === id)?.e.mandatory, true, id);
  assert.equal(EVENTS.filter((x) => x.e.mandatory).length, 11);
});

test("E1 — không sự kiện nào có cây hội thoại (grep: 0 kết quả cho choices / dialogueTree / dialogue_options)", () => {
  for (const { f, raw } of EVENTS) assert.ok(!/"choices"|"dialogueTree"|"dialogue_options"/.test(raw), f);
});

test("E2 — mọi hành động thuộc 4 loại, và mọi sự kiện có nhánh 'không làm gì'", () => {
  const KINDS = ["mon_an", "dua_vat", "than_the", "khong_lam_gi"];
  for (const { f, e } of EVENTS) {
    for (const a of e.playerActions) assert.ok(KINDS.includes(a.kind), `${f}: ${a.kind}`);
    assert.ok(e.playerActions.some((a: { kind: string }) => a.kind === "khong_lam_gi"), f);
    assert.ok(typeof e.runtime === "string" && e.runtime.length > 0, `${f}: phải ghi chỗ chạy (hoặc CHƯA)`);
  }
});

test("ML — ≥ 12 mục tri thức, bỏ qua KHÔNG BAO GIỜ bị phạt", () => {
  assert.ok(KNOW.items.length >= 12);
  for (const k of KNOW.items) assert.equal(k.ignorePenalty, "none", k.id);
});

// ───────────────────────── móc chạy thật

const ctx = (day: number, flags: Record<string, number | boolean | string>): ArcCtx =>
  ({ day, flags, count: () => 0, rain: false, owns: () => false, hasWrongName: () => false });

test("SK-12 → SK-14: che tay thì clip dời tới 16; làm đẹp thì tới sớm ngày 9; +40% khách ba ngày sau clip", () => {
  for (const [f, want] of [[{ suCover: 5 }, 16], [{ suPretty: 5 }, 9], [{}, 10]] as const) {
    const st = newStoryState();
    Object.assign(st.flags, f);
    endOfDay(st, 5);
    assert.equal(st.flags.clipDay, want);
    assert.ok(storyCrowdMul(want + 1, st, { hasQr: true }) > storyCrowdMul(want + 5, st, { hasQr: true }) * 1.2);
    assert.equal(walkinLine(want + 1, st, 1), "Em coi TikTok thấy chỗ này nè.");
  }
});

test("SK-11 (b) → SK-32 → truyền xe: đem hũ đồ chua qua thì ngày 31 chú Kiệt qua nói nghề; không đem thì khoá vĩnh viễn", () => {
  const st = newStoryState();
  assert.ok(eveningActions(25, st).some((a) => a.id === "kiet_dochua"));
  assert.equal(arcToday("CHU_KIET", ctx(31, st.flags), 370)?.tag, undefined, "chưa giúp → ngày 31 chỉ đi ngang");
  doAction(st, "kiet_dochua", 25);
  const talk = arcToday("CHU_KIET", ctx(31, st.flags), 370)!;
  assert.equal(talk.tag, "SK-32");
  assert.ok(talk.pass?.lines?.some((l) => (typeof l === "string" ? l : l.text).includes("chín năm")));
});

test("SK-24 → SK-29: nghe chuyện bảng hiệu thì mới có đường 'chờ chú Hải'; chú vẽ vào buổi sáng, không có bản vẽ đẹp", () => {
  const st = newStoryState();
  assert.ok(!eveningActions(24, st).some((a) => a.id === "sign_hai"));
  const plan = storyOverhear(16)!;
  onStoryOverheard(st, plan.id, 1, 16);
  assert.ok(eveningActions(24, st).some((a) => a.id === "sign_hai"));
  doAction(st, "sign_hai", 24);
  assert.equal(arcToday("ONG_HAI", ctx(27, st.flags), 450)?.tag, "SK-29");
  assert.equal(arcToday("ONG_HAI", ctx(26, st.flags), 640)?.tag, undefined, "buổi sau 10 giờ chú hứa rồi quên");
});

test("tin 'đo đạc' (P4-04 §2.3 biến thể 1) chỉ là một cảnh nghe lỏm — không có hệ quả nào", () => {
  const p = storyOverhear(28)!;
  assert.equal(p.id, "story:GIAI_TOA");
  const st = newStoryState();
  onStoryOverheard(st, p.id, 2, 28);
  assert.deepEqual(st.flags, {});
});
