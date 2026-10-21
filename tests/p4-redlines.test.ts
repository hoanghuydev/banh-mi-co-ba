/**
 * P4-05 §2.8 — LẰN RANH ĐỎ, phần máy làm được (phần người làm nằm ở docs/audit/LAN-RANH-DO.md).
 *  · LR-4 chiến tranh: blocklist CHẶN BUILD trên mọi CHỮ sẽ lên màn hình (JSON + chuỗi trong TS)
 *  · LR-3 hạ thấp nghề: grep chặn
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, walk } from "../tools/lib";

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
