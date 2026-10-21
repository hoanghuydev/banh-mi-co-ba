/** So sánh 3 chiến lược nhập hàng (dỏm / thường / ngon): npm run probe:supply -- 30 6 */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay, type Policy } from "../src/sim/headless";
import { eveningCounting } from "../src/sim/day";
import type { Quality } from "../src/sim/econ";

const days = Number(process.argv[2] ?? 30);
const seeds = Number(process.argv[3] ?? 6);

for (const tier of ["BAN", "THUONG", "NGON"] as Quality[]) {
  let profit = 0, sick = 0, served = 0, rev = 0, cost = 0, n = 0;
  for (let s = 0; s < seeds; s++) {
    const w = newGame("bot", `supply-${s}`);
    const policy: Policy = { ...POLICIES.greedy, tier };
    for (let d = 1; d <= days; d++) {
      if (d > 1) nextDay(w);
      const before = w.money.cash;
      const h = new HeadlessStall(w, policy, { bus: new Bus(false), platform: memoryPlatform() });
      h.run({ inject: () => {} });
      h.close();
      eveningCounting(w);
      profit += w.money.cash - before;
      sick += w.progress.today.sick ?? 0;
      served += w.progress.today.served;
      rev += w.progress.today.revenue;
      cost += w.econ.today.market;
      n++;
    }
  }
  console.log(`${tier.padEnd(6)} lời ${Math.round(profit / n / 1000)}k/ngày · thu ${Math.round(rev / n / 1000)}k · tiền hàng ${Math.round(cost / n / 1000)}k · bán ${(served / n).toFixed(1)} ổ · đau bụng ${(sick / n).toFixed(2)}/ngày (${((sick / Math.max(1, served)) * 100).toFixed(1)}% ổ)`);
}
