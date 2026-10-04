/**
 * NGƯỜI TA TỰ BẮT CHUYỆN BAO NHIÊU LẦN MỘT BUỔI — đo thật, không tin trần per-cuộc.
 *
 * `L-9` từng giữ lời hứa "phải HIẾM" bằng một trần trên `initiates` của từng cuộc (0,35).
 * Đó là cái thắt THỨ HAI cho cùng một việc — `TALK_OFFERS_PER_DAY` đã chặn rồi — và nó
 * bóp chết đúng mấy cảnh hàng xóm hiếm-vì-điều-kiện: `tools/probe-offer2.ts` đo 6,4% lượt
 * thử thành lời mời (~0,9 lượt/buổi) trong khi trần là 3. Ngân sách không hề cạn, mà cảnh
 * cái gánh thì cả mùa không gặp một lần.
 *
 * Nên bỏ cái proxy, giữ lời hứa bằng CHÍNH CON SỐ người chơi cảm thấy: mấy lần một buổi.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TALK_NPC_IDS } from "../src/content/talks";
import { TALK_OFFERS_PER_DAY } from "../src/sim/service";

test("OF-1 lời mời chuyện: có thật, mà không thành cái chợ", async () => {
  const NGAY = 8;
  const w = newGame("nhipmoi", "p210");
  const bus = new Bus(false);
  const platform = memoryPlatform();
  for (let d = 1; d < 5; d++) nextDay(w, bus);
  let moi = 0;
  const theoNgay: number[] = [];
  for (let i = 0; i < NGAY; i++) {
    const h = new HeadlessStall(w, POLICIES.social, { bus, platform });
    const svc = (h as unknown as { service: any }).service;
    for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);
    const truoc = moi;
    const goc = svc.offerTalk.bind(svc);
    svc.offerTalk = (c: any) => { const r = goc(c); if (r) moi++; return r; };
    for (let f = 0; f < 140_000 && !h.closed; f++) h.step(1000 / 30);
    theoNgay.push(moi - truoc);
    nextDay(w, bus);
  }
  const tb = moi / NGAY;
  assert.ok(tb >= 1, `mới ${tb.toFixed(1)} lượt/buổi — cả hẻm gần như không ai tự mở miệng`);
  assert.ok(tb <= TALK_OFFERS_PER_DAY, `${tb.toFixed(1)} lượt/buổi — quá dày, người chơi còn phải bán hàng`);
  // Trần NGÀY là cái chặn cuối: không buổi nào được vượt.
  for (const [i, n] of theoNgay.entries()) {
    assert.ok(n <= TALK_OFFERS_PER_DAY, `buổi ${i + 1} có ${n} lượt mời — vượt \`TALK_OFFERS_PER_DAY\``);
  }
});
