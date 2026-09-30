/**
 * P4-05 §2.8 — LẰN RANH ĐỎ, phần máy làm được (phần người làm nằm ở docs/audit/LAN-RANH-DO.md).
 *  · LR-4 chiến tranh: blocklist CHẶN BUILD trên mọi CHỮ sẽ lên màn hình (JSON + chuỗi trong TS)
 *  · LR-3 hạ thấp nghề: grep chặn
 *  · LR-6 tâm linh: đốt vía không có tác dụng cơ học — cùng seed ra cùng một ngày
 *  · T3 / achievement: không thành tựu nào đếm số lượng, tiền, quan hệ, hoàn thành
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, walk } from "../tools/lib";
import { newGame } from "../src/core/save";
import { HeadlessStall, POLICIES } from "../src/sim/headless";
import { Bus } from "../src/core/eventbus";
import ACH from "../src/content/season/achievements.json";

const BLOCK = readFileSync(join(ROOT, "tools/lr4-blocklist.txt"), "utf8").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
const word = (w: string) => new RegExp(`(^|[^\\p{L}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`, "iu");

/** Mọi chữ có thể lên màn hình: giá trị chuỗi của JSON nội dung + chuỗi literal trong TS (bỏ chú thích). */
function screenText(): { file: string; text: string }[] {
  const out: { file: string; text: string }[] = [];
  const skip = (f: string) => /redlines\.json$|lr4-blocklist/.test(f);
  for (const f of walk(join(ROOT, "src"), [".json"])) {
    if (skip(f)) continue;
    const walkJson = (v: unknown): void => {
      if (typeof v === "string") out.push({ file: f, text: v });
      else if (Array.isArray(v)) v.forEach(walkJson);
      else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (!k.startsWith("_")) walkJson(x);
    };
    walkJson(JSON.parse(readFileSync(f, "utf8")));
  }
  for (const f of walk(join(ROOT, "src"), [".ts"])) {
    const src = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
    for (const m of src.matchAll(/"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g)) out.push({ file: f, text: m[1] ?? m[2] ?? m[3] ?? "" });
  }
  return out;
}

test("LR-4 — chiến tranh: KHÔNG MỘT CHỮ trong mọi thứ lên màn hình (chặn build)", () => {
  const hits: string[] = [];
  for (const { file, text } of screenText()) for (const w of BLOCK) if (word(w).test(text)) hits.push(`${file.replace(ROOT, "")}: "${w}" trong "${text.slice(0, 60)}"`);
  assert.deepEqual(hits, []);
});

test("LR-3 — hạ thấp nghề: grep chặn", () => {
  const re = /nghề này (khổ|cực|bạc)|làm ăn gì (kỳ|cực) vậy|sao không (kiếm|tìm) việc|(bỏ|nghỉ) cái nghề|nghề hèn|thấp kém|tạm thời thôi/i;
  const hits = screenText().filter((x) => re.test(x.text)).map((x) => `${x.file.replace(ROOT, "")}: ${x.text.slice(0, 60)}`);
  assert.deepEqual(hits, []);
});

test("LR-6 — đốt vía hay không, cùng seed ra ĐÚNG một ngày (không buff, không debuff)", () => {
  const run = (burn: boolean) => {
    const w = newGame("t", "lr6");
    w.progress.dayIndex = 3;
    const bus = new Bus();
    const trace: string[] = [];
    bus.on("npc:arrived", (p) => trace.push(`${p.visitId}@${p.atHhmm}`));
    bus.on("money:changed", (p) => trace.push(`${p.reason}:${p.delta}`));
    const h = new HeadlessStall(w, POLICIES.greedy, { bus });
    if (burn) { h.service.via = -1; h.service.burnVia(); }
    h.run();
    return { trace, cash: w.money.cash, served: w.progress.today.served };
  };
  assert.deepEqual(run(true), run(false));
});

test("thành tựu = KHOẢNH KHẮC: không cái nào đếm số lượng, tiền, quan hệ, hoàn thành; không viết hoa toàn bộ", () => {
  assert.ok(ACH.items.length >= 8);
  for (const a of ACH.items) {
    assert.ok(!/\d/.test(a.when), `${a.id}: điều kiện có con số`);
    assert.ok(!/bán \d|kiếm|thân với|gặp tất cả|hoàn thành/i.test(a.when + a.name), a.id);
    assert.notEqual(a.name, a.name.toUpperCase(), `${a.id}: viết hoa toàn bộ`);
  }
});
