/** Đo hệ đánh giá: sao theo lối chơi, nhịp ra review, nguy cơ đóng cửa. npm run probe:review -- 30 6 */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { eveningCounting } from "../src/sim/day";
import { attpCheck, average, spread } from "../src/sim/reviews";
import type { Quality } from "../src/sim/econ";
import type { PricePick } from "../src/sim/econ";

const days = Number(process.argv[2] ?? 30);
const seeds = Number(process.argv[3] ?? 6);

type Lane = { name: string; tier: Quality; price: PricePick };
const LANES: Lane[] = [
  { name: "sạch · giá thường", tier: "THUONG", price: 1 },
  { name: "xịn · giá đắt", tier: "NGON", price: 2 },
  { name: "thường · giá rẻ", tier: "THUONG", price: 0 },
  { name: "bẩn · giá rẻ", tier: "BAN", price: 0 },
];

const pct = (a: number, b: number) => (b ? ((a / b) * 100).toFixed(0) + "%" : "—");

console.log(`${days} ngày × ${seeds} hạt giống, bot greedy\n`);
console.log("lối chơi".padEnd(20), "sao", " rv/ngày", "viết/lượt", " 1★", " 2★", " 3★", " 4★", " 5★", " bụng", " đóng cửa");

for (const lane of LANES) {
  let stars = 0, revs = 0, servedAll = 0, dayCount = 0, sick = 0, closed = 0;
  const sp = [0, 0, 0, 0, 0];
  for (let s = 0; s < seeds; s++) {
    const w = newGame("bot", `rev-${lane.tier}-${lane.price}-${s}`);
    const policy = { ...POLICIES.greedy, price: lane.price, tier: lane.tier };
    let dead = false;
    for (let d = 1; d <= days && !dead; d++) {
      if (d > 1) nextDay(w);
      const h = new HeadlessStall(w, policy, { bus: new Bus(false), platform: memoryPlatform() });
      h.run({ inject: () => {} });
      h.close();
      eveningCounting(w);
      servedAll += w.progress.today.served;
      dayCount++;
      if (attpCheck(w).closed) { dead = true; closed++; }
    }
    stars += average(w);
    revs += w.reviews.list.length;
    sick += w.reviews.list.filter((r) => r.food).length;
    const x = spread(w);
    for (let i = 0; i < 5; i++) sp[i] += x[i];
  }
  const total = sp.reduce((a, b) => a + b, 0);
  console.log(
    lane.name.padEnd(20),
    (stars / seeds).toFixed(2),
    (revs / dayCount).toFixed(2).padStart(7),
    pct(revs, servedAll).padStart(8),
    ...sp.map((v) => pct(v, total).padStart(4)),
    pct(sick, total).padStart(5),
    pct(closed, seeds).padStart(8),
  );
}
