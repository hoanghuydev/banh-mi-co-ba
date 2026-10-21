/** Đếm lời mời chuyện rụng ở cổng nào của `offerTalk()`, để biết nên vặn tham số nào. */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TALK_NPC_IDS } from "../src/content/talks";

const argN = (k: string, d: number) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? Number(process.argv[i + 1]) : d; };
const NGAY = argN("days", 10);

const rung = new Map<string, number>();
const bump = (k: string) => rung.set(k, (rung.get(k) ?? 0) + 1);

const w = newGame("off2", "p210");
const bus = new Bus(false);
const platform = memoryPlatform();
for (let d = 1; d < 5; d++) nextDay(w);
for (let i = 0; i < NGAY; i++) {
  const h = new HeadlessStall(w, POLICIES.social, { bus, platform });
  const svc = (h as unknown as { service: any }).service;
  for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);

  // Chép lại đúng thứ tự cổng của `offerTalk()`, không đụng hàm thật.
  const goc = svc.offerTalk.bind(svc);
  svc.offerTalk = (c: any) => {
    if (svc.talkSession) { bump("1. đang nói chuyện"); return false; }
    if (!svc.interruptible) { bump("2. tay đang bận"); return false; }
    if (svc.offers.length >= 2 || svc.offers.find((o: any) => o.c === c)) { bump("3. hàng chờ mời đầy"); return false; }
    if (svc.offersToday >= 3) { bump("4. hết trần lượt/ngày"); return false; }
    if (svc.nowSec - svc.lastOfferAt < 100) { bump("5. chưa giãn đủ 100 giây"); return false; }
    if (!svc.talks.has(svc.talkKey(c))) { bump("6. kho chưa nạp"); return false; }
    const t = svc.pickRunnable(c, "NPC");
    if (!t) { bump("7. không cuộc nào chạy được"); return false; }
    const r = goc(c);
    bump(r ? "✓ MỜI ĐƯỢC" : "8. trượt roll `initiates`");
    return r;
  };
  for (let f = 0; f < 140_000 && !h.closed; f++) h.step(1000 / 30);
  nextDay(w);
}

const tong = [...rung.values()].reduce((a, b) => a + b, 0) || 1;
console.log(`\n${NGAY} buổi · ${tong} lượt thử mời\n`);
for (const [k, n] of [...rung].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(30)} ${String(n).padStart(6)}  ${((n / tong) * 100).toFixed(1).padStart(5)}%`);
}
