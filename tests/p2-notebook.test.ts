/**
 * P2-05 §6 — ranh giới phân chia lao động, hệ giả thuyết, trang cuối ngày, tên do người chơi ghi.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { newGame } from "../src/core/save";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import {
  NOTE_RULES, checkHypotheses, displayName, guess, logOrder, nameCheck, newNotebook, options, page,
} from "../src/sim/notebook";
import { ROOT } from "../tools/lib";

test("cột trái: mỗi dòng nhật ký có ĐÚNG sáu trường, không số quan hệ, không suy luận", () => {
  const nb = newNotebook();
  logOrder(nb, { day: 1, minute: 407, npcId: "CHU_TU", orderText: "Cho một ổ đầy đủ.", visitCount: 1 });
  const allowed = new Set(["day", "minute", "npcId", "orderText", "visitCount", "note"]);
  for (const e of nb.log) assert.ok(Object.keys(e).every((k) => allowed.has(k)) && Object.keys(e).length <= 6);
});

test("tên: chỉ người chơi ghi; 'bà Sáu' cho bà Bảy là GỌI SAI; chưa ghi là không gọi tên; tag hiện '—'", () => {
  const nb = newNotebook();
  assert.equal(nameCheck(nb, "BA_BAY"), null);
  assert.equal(displayName(nb, "BA_BAY", "Bà Bảy"), "—");
  assert.equal(displayName(nb, "walkin3", "bà cụ"), "bà cụ");          // vãng lai giữ mô tả hình dáng
  page(nb, "BA_BAY", 1).name = "bà Sáu";
  assert.equal(nameCheck(nb, "BA_BAY"), false);
  nb.pages.BA_BAY.name = "Bảo";
  assert.equal(nameCheck(nb, "BA_BAY"), false);                       // khác đúng một cái dấu
  nb.pages.BA_BAY.name = "Bà Bảy vé số";
  assert.equal(nameCheck(nb, "BA_BAY"), true);
  assert.equal(displayName(nb, "BA_BAY", "Bà Bảy"), "Bà Bảy vé số");
});

test("giả thuyết: lựa chọn ⊆ điều ĐÃ GẶP; chưa gặp ai thì danh sách rỗng; tối đa 5 điều mở; đổi 1 lần/ngày", () => {
  const nb = newNotebook();
  assert.deepEqual(options(nb, "CHU_TU", "HAY_AN"), []);
  logOrder(nb, { day: 1, minute: 405, npcId: "CHU_TU", orderText: "Cho một ổ pate, nhiều ớt.", visitCount: 1 });
  const hay = options(nb, "CHU_TU", "HAY_AN");
  assert.ok(hay.includes("pate") && hay.includes("ot"));
  assert.ok(!hay.includes("xiumai"), "lộ nguyên liệu chưa ai gọi");
  assert.equal(guess(nb, "CHU_TU", "HAY_AN", "xiumai", 1), "chưa gặp điều này ở người này");
  assert.equal(guess(nb, "CHU_TU", "HAY_AN", "ot", 1), null);
  assert.notEqual(guess(nb, "CHU_TU", "HAY_AN", "pate", 1), null);     // cùng ngày không đổi được
  assert.equal(guess(nb, "CHU_TU", "HAY_AN", "pate", 2), null);
});

test("không xác nhận được giả thuyết nào nếu chưa CHỨNG MINH ở quầy; sai thì không có gì xảy ra (không có 'WRONG')", () => {
  const nb = newNotebook();
  logOrder(nb, { day: 3, minute: 405, npcId: "CHU_TU", orderText: "Cho một ổ pate, nhiều ớt.", visitCount: 3 });
  guess(nb, "CHU_TU", "HAY_AN", "ot", 3);
  guess(nb, "CHU_TU", "KHONG_AN_DUOC", "pate", 3);
  const usual = { ot: 3, pate: 2 };
  assert.deepEqual(checkHypotheses(nb, 3, () => usual), []);          // đúng nhưng chưa dùng
  nb.today.served_.CHU_TU = [{ minute: 406, dish: ["pate", "ot", "ot", "ot"] }];
  nb.today.usualServed.push("CHU_TU");
  const c = checkHypotheses(nb, 3, () => usual);
  assert.deepEqual(c.map((x) => x.slot), ["HAY_AN"]);                   // KHONG_AN_DUOC pate: sai → im lặng
  const states = nb.pages.CHU_TU.hypotheses.map((h) => h.state);
  assert.ok(states.every((s) => s === "OPEN" || s === "CONFIRMED"));
  assert.equal(nb.pages.CHU_TU.vignetteUnlocked, false);                // cần ĐÚNG 3
});

test("trang của cô Ba: mọi rule ≥3 biến thể (trừ speakonce); 0 câu phán xét; 0 con số quan hệ", () => {
  const banned = /(làm tốt|làm dở|con sai|con giỏi|điểm|trust|[+-]\d)/i;
  for (const [id, r] of Object.entries(NOTE_RULES)) {
    if (!r.speakonce && id !== "day40") assert.ok(r.variants.length >= 3, `${id}: ${r.variants.length} biến thể`);
    for (const v of r.variants) assert.ok(!banned.test(v), `${id}: "${v}"`);
  }
  const src = readFileSync(join(ROOT, "src", "content", "lines", "so-tay.json"), "utf8");
  assert.ok(!/♥|★/.test(src));
});

test("một mùa headless: nhật ký có đủ khách, trang tối có 2–3 dòng mỗi ngày, gọi sai tên thành WRONG_NAME", () => {
  const w = newGame("nb", "notebook-season");
  page(w.notebook, "BA_BAY", 1).name = "bà Sáu";                         // người chơi ghi nhầm tên
  for (let d = 1; d <= 6; d++) {
    if (d > 1) nextDay(w);
    new HeadlessStall(w, POLICIES.greedy).run();
  }
  nextDay(w);
  assert.ok(w.notebook.log.length > 40);
  assert.equal(w.notebook.eveningNotes.length, 6);
  for (const n of w.notebook.eveningNotes) assert.ok(n.lines.length >= 2 && n.lines.length <= 3, `ngày ${n.day}: ${n.lines.length} dòng`);
  const bay = w.npcs.BA_BAY;
  assert.ok([...bay.memory.short, ...bay.memory.long].some((m) => m.kind === "WRONG_NAME"), "gọi 'bà Sáu' mà bà Bảy không nhớ");
});
