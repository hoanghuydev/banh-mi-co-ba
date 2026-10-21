/**
 * npm run probe:offer
 *
 * Một ngày khách tự mở lời bao nhiêu lần, và rớt ở cổng nào của `offerTalk`.
 * Quan trọng vì đa số kho thoại là `NPC_ONLY` (lưới `V-3`): `offerTalk` hiếm thì chúng không tới tai người chơi.
 */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TALK_NPC_IDS } from "../src/content/talks";

const w = newGame("off", "p209");
const bus = new Bus(false); const platform = memoryPlatform();
const why = new Map<string, number>(); const tally = new Map<string, number>();
const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
const DAYS = 12;
for (let d = 0; d < DAYS; d++) {
  const h = new HeadlessStall(w, POLICIES.greedy, { bus, platform });
  const svc = (h as unknown as { service: any }).service;
  for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);
  const orig = svc.offerTalk.bind(svc);
  svc.offerTalk = (c: any) => {
    if (svc.talkSession) { bump(why, "1 đang có phiên"); return false; }
    if (!svc.interruptible) { bump(why, "2 tay bận"); return false; }
    if (svc.offers.length >= 2 || svc.offerFor(c)) { bump(why, "3 hàng đợi đầy"); return false; }
    if (svc.offersToday >= 3) { bump(why, "4 đủ trần ngày"); return false; }
    if (svc.nowSec - svc.lastOfferAt < 100) { bump(why, "5 chưa đủ 100 s"); return false; }
    if (!svc.talks.has(svc.talkKey(c))) { bump(why, "6 chưa nạp"); return false; }
    const t = svc.pickRunnable(c, "NPC");
    if (!t) { bump(why, "7 không cuộc nào chạy được"); return false; }
    if (svc.deps.hub.derive(`talk:${svc.deps.day}:${c.id}`).next() >= (t.initiates ?? 0.3)) { bump(why, "8 trượt roll initiates"); return false; }
    bump(why, "9 ✓ MỞ LỜI"); bump(tally, t.id as string);
    return orig(c);
  };
  for (let i = 0; i < 60000; i++) { h.step(1000 / 30); if (!(i % 7)) await Promise.resolve(); }
  nextDay(w);
}
const tot = [...why.values()].reduce((a, b) => a + b, 0);
const ok = why.get("9 ✓ MỞ LỜI") ?? 0;
console.log(`\n${DAYS} ngày · ${tot} lần hệ THỬ · ${ok} lần mở lời thật = ${(ok / DAYS).toFixed(1)}/ngày (trần 3)\n`);
for (const [k, v] of [...why].sort()) console.log(`  ${k.padEnd(28)} ${String(v).padStart(5)}  ${(100 * v / tot).toFixed(1)}%`);
console.log(`\n  cuộc đã mở:`);
for (const [k, v] of [...tally].sort((a, b) => b[1] - a[1])) console.log(`    ${k.padEnd(24)} ${v}`);
