/**
 * P4-04 — kết game: mọi ending đều tử tế, chỉ khác AI CÒN Ở ĐÓ. EndingState không chứa chỉ số
 * quan hệ nào (T3); chị Lan luôn quay lại (R3); chú Tư không bao giờ; sàn ≥ 6 người; một track.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { newGame, type SaveFile } from "../src/core/save";
import { ALWAYS, coBaLastLine, computeEnding, endingMusicTrack, playerStaysOf, CREDITS } from "../src/sim/ending";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { ROOT, walk } from "../tools/lib";

/** Ba save: người chơi tệ nhất (phạm mọi lỗi), trung bình, tốt nhất — cộng vài nhánh lạ. */
function saves(): SaveFile[] {
  const worst = newGame("t", "worst");
  Object.assign(worst.story.flags, { suCover: 5, baoSneak: 29, lanGot: 0 });
  worst.money.debtsOwedToPlayer.push({ npcId: "CO_MAI", day: 12, minute: 480, trueAmount: 25_000, playerWrote: null });
  const mid = newGame("t", "mid");
  Object.assign(mid.story.flags, { lanGot: 40, lanCorrect: false, signboard: "in_decal" });
  mid.story.basketLoaves = { 35: 18, 36: 18, 37: 16, 38: 14, 39: 3 };
  mid.notebook.pages.BA_BAY = { ...(mid.notebook.pages.BA_BAY ?? {}), name: "bà Bảy", freeLines: "" } as never;
  const best = newGame("t", "best");
  Object.assign(best.story.flags, { lanGot: 40, lanCorrect: true, dungStory: 11, baoRespect: 29, kietStopped: 40, signboard: "ve_tay_run" });
  best.story.basketLoaves = { 35: 18, 36: 18, 37: 18, 38: 18, 39: 22 };
  best.notebook.pages.CHU_TU = { ...(best.notebook.pages.CHU_TU ?? {}), name: "chú Tư", freeLines: "như mọi bữa, nhiều ớt" } as never;
  return [worst, mid, best];
}

test("T3 — EndingState không chứa trường nào là điểm / hạng / % / tin tưởng / bucket", () => {
  const BANNED = ["reputation", "score", "rank", "affection", "trust", "completion", "percent", "tier", "bucket", "money", "point"];
  for (const s of saves()) for (const k of Object.keys(computeEnding(s))) assert.ok(!BANNED.some((b) => k.toLowerCase().includes(b)), k);
});

test("R3 — chị Lan LUÔN quay lại; chú Tư không bao giờ có mặt; sàn luôn ≥ 6 người", () => {
  for (const s of saves()) {
    const e = computeEnding(s);
    assert.equal(e.lanReturned, true);
    assert.ok(e.presentOnDay40.includes("CHI_LAN"));
    assert.ok(!e.presentOnDay40.includes("CHU_TU") && !e.presentOnDay40.includes("ONG_HAI"));
    assert.ok(e.presentOnDay40.length >= 6);
    for (const id of ALWAYS) assert.ok(e.presentOnDay40.includes(id), id);
  }
});

test("một track cho mọi màn kết — không nhạc buồn khi ít người, nhạc vui khi đông", () => {
  assert.equal(new Set(saves().map((s) => endingMusicTrack(computeEnding(s)))).size, 1);
});

test("dòng cuối của cô Ba: cụ thể nhất thắng, không bao giờ khen hay chê", () => {
  const [worst, mid, best] = saves().map(computeEnding);
  assert.equal(coBaLastLine(best).id, "lan_dung");
  assert.equal(coBaLastLine(worst).id, "lan_het_hang");
  assert.equal(coBaLastLine(mid).id, "dung_lai");
  for (const e of [worst, mid, best]) assert.ok(!/giỏi|dở|tệ|hay lắm|thất bại|xuất sắc/.test(coBaLastLine(e).text));
});

test("ở lại hay dừng — đọc bằng hành động mua hàng ngày 35–39", () => {
  assert.equal(playerStaysOf({ 35: 18, 36: 18, 37: 18, 38: 18, 39: 18 }), "o_lai");
  assert.equal(playerStaysOf({ 35: 18, 36: 14, 37: 10, 38: 8, 39: 2 }), "dung_lai");
  assert.equal(playerStaysOf({}), "chua_ro");
});

test("credits: người Việt viết văn hoá đứng ĐẦU; không có 'cultural consultant'; sau credits không có 'chơi tiếp'", () => {
  assert.match(CREDITS[0].head, /Viết văn hoá/);
  const src = [...walk(join(ROOT, "src"), [".ts", ".json"])].map((f) => readFileSync(f, "utf8")).join("\n");
  assert.ok(!/cultural consultant/i.test(src));
  assert.ok(!/New Game\+"|"Chơi tiếp sau ngày 40|Season 2|Coming soon/i.test(src));
});

test("ngày 40 thật (bot): chị Lan tới 10h20 và mua ổ cuối hoặc được lắc đầu — cả hai đều ghi chị có mặt", () => {
  const w = newGame("t", "day40");
  for (let d = 1; d <= 40; d++) {
    if (d > 1) nextDay(w);
    const h = new HeadlessStall(w, POLICIES.greedy);
    h.run();
    if (d === 40) assert.ok(h.service.lanLeft, "chị Lan đã tới và đã đi");
  }
  const e = computeEnding(w);
  assert.ok(e.presentOnDay40.includes("CHI_LAN"));
  assert.ok(w.story.moments.includes("CON_O_NAO_KHONG_EM"), "thành tựu ngày 40 mở cho mọi người chơi");
});
