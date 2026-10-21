/** Đo gánh nặng của tin mẹ xin tiền học: npm run probe:tuition. */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { eveningCounting } from "../src/sim/day";
import { phoneTick, reply } from "../src/sim/phone";

const days = Number(process.argv[2] ?? 60);
const seeds = Number(process.argv[3] ?? 8);
let paid = 0, profit = 0, asks = 0, n = 0;
for (let s = 0; s < seeds; s++) {
  const w = newGame("bot", `tuition-${s}`);
  for (let d = 1; d <= days; d++) {
    if (d > 1) nextDay(w);
    const before = w.money.cash;
    const h = new HeadlessStall(w, POLICIES.greedy, { bus: new Bus(false), platform: memoryPlatform() });
    h.run({ inject: () => {} });
    h.close();
    eveningCounting(w);
    profit += w.money.cash - before;
    phoneTick(w, true);
    for (const t of w.phone.threads) {
      if (!t.pending) continue;
      const tuition = t.pending.ev === "tuition";
      const c = w.money.cash;
      reply(w, t.id, 0);
      if (tuition) { paid += c - w.money.cash; asks++; }
    }
    n++;
  }
}
console.log(`${n} ngày · ${asks} lần xin (${((asks / n) * 100).toFixed(1)}%/ngày)`);
console.log(`lời TB ${Math.round(profit / n)}đ/ngày · gửi TB ${Math.round(paid / n)}đ/ngày = ${((paid / profit) * 100).toFixed(1)}% lợi nhuận`);
