/**
 * P0-03 §6 — test âm tính: cố tình tạo 1 rule chết, 1 fact mồ côi, 1 response 4 biến
 * thể, 1 dòng NFD, 1 dòng mất dấu, 1 từ Bắc trong pool Nam, 1 dòng dịch đại từ xưng
 * hô → cả 7 đều phải bị bắt. Và test dương tính giả: chị Hạnh dùng từ Bắc → KHÔNG báo.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateRules } from "../tools/validate-rules";
import { lintLines } from "../tools/lint-lines";
import { ROOT } from "../tools/lib";

const real = join(ROOT, "src", "content");

function sandbox(rules: unknown[], pools: unknown[]) {
  const dir = mkdtempSync(join(tmpdir(), "bmcb-content-"));
  mkdirSync(join(dir, "rules"));
  mkdirSync(join(dir, "lines"));
  copyFileSync(join(real, "rules", "_blackboard.json"), join(dir, "rules", "_blackboard.json"));
  copyFileSync(join(real, "redlines.json"), join(dir, "redlines.json"));
  writeFileSync(join(dir, "rules", "bad.json"), JSON.stringify(rules));
  writeFileSync(join(dir, "lines", "bad.json"), JSON.stringify({ pools }));
  return dir;
}

const variants8 = ["Một.", "Hai nè.", "Ba đó.", "Bốn hả?", "Năm rồi.", "Sáu nghen.", "Bảy ha.", "Tám luôn."];
const rule = (id: string, extra: object) => ({ id, concept: "NOTICE_EVENT", say: variants8, when: {}, ...extra });

test("validator bắt rule chết, mâu thuẫn, fact mồ côi, response thiếu biến thể", () => {
  const dir = sandbox([
    rule("dead", { when: { khongCo: 1 } }),                                                   // R001
    rule("contra", { when: { npcVisitCount: "<-3" } }),                                        // R002 (ngoài miền ≥ 0)
    rule("orphan", { when: { npcRelTier: "FRIEND" },
                     applycontext: { ctxKhachMoiToi: { value: 1, duration: 60 } } }),         // R005: không rule nào đọc
    rule("short", { when: { npcMood: ">=10" }, say: variants8.slice(0, 4) }),                // R007 (dòng dùng chung)
    rule("badnpc", { when: { npcId: "ONG_KHONG_TON_TAI" } }),                                 // R013
    rule("both", { when: { npcMood: "CALM" }, speakonce: true, norepeat: true }),              // R010
    rule("ghost", { concept: "KHONG_AI_HOI" }),                                               // R003
    rule("baddur", { when: { ctxBarkT1_TAY: "absent" },
                     applycontext: { ctxBarkT1_TAY: { value: 1, duration: -5 } } }),          // R011
  ], []);
  const r = validateRules(dir, join(ROOT, "src"));
  for (const code of ["R001", "R002", "R005", "R007", "R013", "R010", "R003", "R011"]) {
    assert.ok(r.has(code), `phải bắt ${code}; có: ${r.diags.map((d) => d.code).join(",")}`);
  }
});

test("linter bắt NFD, mất dấu, từ Bắc trong pool Nam, đại từ bị dịch", () => {
  const nfd = "Con ơi, cái ổ đó rớt rồi đó nghen.".normalize("NFD");
  const dir = sandbox([], [
    { id: "a", tier: 1, vars: [], variants: [nfd, "Cho co mot o banh mi do chua nha con", "Con ăn cái bát này đi."],
      en: ["…", "…", "Here you go, auntie."] },
  ]);
  const r = lintLines(dir);
  for (const code of ["L004", "L006", "L008", "L009"]) {
    assert.ok(r.has(code), `phải bắt ${code}; có: ${r.diags.map((d) => d.code).join(",")}`);
  }
});

test("dương tính giả: chị Hạnh dùng từ Bắc là ĐẶC ĐIỂM NHÂN VẬT, không phải lỗi", () => {
  const dir = sandbox([], [
    { id: "hanh", npc: "CHI_HANH", tier: 1, vars: [], variants: ["Cho chị một bát nước, em ơi."] },
  ]);
  assert.equal(lintLines(dir).has("L008"), false);
});

test("linter bắt biến nội suy chưa định nghĩa, viết hoa toàn bộ, lằn ranh đỏ", () => {
  const dir = sandbox([], [
    { id: "b", tier: 1, vars: ["defect"], variants: ["Chào {npcName} nghen.", "TRỜI ƠI NGON QUÁ", "Hồi đó ổng đi bộ đội."] },
  ]);
  const r = lintLines(dir);
  for (const code of ["L001", "L007", "L010"]) assert.ok(r.has(code), `phải bắt ${code}`);
});

test("--fix sửa NFD, kiểu dấu, viết hoa — rồi lint lại sạch ba mã đó", () => {
  const dir = sandbox([], [
    { id: "c", tier: 1, vars: [], variants: ["Hòa bình nè con.".normalize("NFD"), "CẢM ƠN CON NHIỀU"] },
  ]);
  lintLines(dir, { fix: true });
  const after = lintLines(dir);
  for (const code of ["L004", "L005", "L007"]) assert.equal(after.has(code), false, `${code} còn sau --fix`);
  const text = JSON.parse(readFileSync(join(dir, "lines", "bad.json"), "utf8")).pools[0].variants;
  assert.equal(text[0], "Hoà bình nè con.");
  assert.equal(text[1], "Cảm ơn con nhiều");
});

test("nội dung thật của repo: 0 ERROR ở cả hai công cụ", () => {
  assert.equal(validateRules(real, join(ROOT, "src")).errors.length, 0);
  assert.equal(lintLines(real).errors.length, 0);
});
