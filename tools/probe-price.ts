/** So sánh 3 mốc giá (rẻ / thường / đắt) khi đã mở hết món: npm run probe:price -- 20 6 */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { eveningCounting } from "../src/sim/day";
import { PRICE_FX, type PricePick } from "../src/sim/econ";
import { average } from "../src/sim/reviews";
import { LAST_UNLOCK_DAY } from "../src/sim/unlock";

const days = Number(process.argv[2] ?? 20);
const seeds = Number(process.argv[3] ?? 6);

// Số khách nhân R theo sao (00-YEU-CAU T5.2); sao lấy thật từ hệ đánh giá.
const BASE_STARS = 3.2;
const R = [0.2, 0.4, 0.7, 1.2, 1.3];
const rOf = (s: number) => {
  const x = Math.min(5, Math.max(1, s)) - 1, i = Math.min(3, Math.floor(x));
  return R[i] + (R[i + 1] - R[i]) * (x - i);
};

console.log(`Bỏ đi vì giá theo mốc: ${PRICE_FX.walkAway}`);
for (const pick of [0, 1, 2] as PricePick[]) {
  let n = 0, served = 0, rev = 0, market = 0, other = 0, walk = 0, profit = 0, stars = 0, seedsDone = 0;
  for (let s = 0; s < seeds; s++) {
    const w = newGame("bot", `price-${s}`);
    const policy = { ...POLICIES.greedy, price: pick };
    for (let d = 1; d <= LAST_UNLOCK_DAY + days; d++) {
      if (d > 1) nextDay(w);
      const before = w.money.cash;
      const h = new HeadlessStall(w, policy, { bus: new Bus(false), platform: memoryPlatform() });
      h.run({ inject: () => {} });
      h.close();
      eveningCounting(w);
      if (d <= LAST_UNLOCK_DAY) continue;
      const t = w.progress.today, e = w.econ.today;
      n++; served += t.served; rev += t.revenue; market += e.market;
      other += e.rent + e.fixed + e.tools + e.talk + e.family;
      walk += t.priceLost ?? 0;
      profit += w.money.cash - before;
    }
    stars += average(w); seedsDone++;
  }
  const avg = stars / Math.max(1, seedsDone);
  const k = rOf(avg) / rOf(BASE_STARS);
  const adj = (k * (rev - market) - other) / n;
  console.log(
    `${["rẻ", "thường", "đắt"][pick].padEnd(7)} bán ${(served / n).toFixed(1)} ổ · bỏ đi vì giá ${(walk / n).toFixed(1)}`
    + ` · lời thô ${Math.round(profit / n / 1000)}k/ngày · sao ${avg.toFixed(2)} (khách ×${k.toFixed(2)}) · lời theo sao ${Math.round(adj / 1000)}k/ngày`,
  );
}
