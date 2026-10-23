/** Đo vòng đời: số khách theo sao, ngày tới mốc thắng, tỉ lệ thua. npm run probe:life -- 160 3 */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { eveningCounting } from "../src/sim/day";
import { attpCheck, average } from "../src/sim/reviews";
import { markBroke } from "../src/sim/broke";
import { WIN_VND, markWin } from "../src/sim/win";
import { baseGuests, guestsOf } from "../src/sim/demand";
import type { PricePick, Quality } from "../src/sim/econ";

const days = Number(process.argv[2] ?? 160);
const seeds = Number(process.argv[3] ?? 3);

/** Phút thật mỗi ngày: quầy (đo) + chợ + tối (ước tính P0-02 §2.1). */
const OFF_STALL_MIN = 2.5;

type Lane = { name: string; tier: Quality; price: PricePick };
const LANES: Lane[] = [
  { name: "sạch · giá thường", tier: "THUONG", price: 1 },
  { name: "xịn · giá đắt", tier: "NGON", price: 2 },
  { name: "thường · giá rẻ", tier: "THUONG", price: 0 },
  { name: "bẩn · giá rẻ", tier: "BAN", price: 0 },
];

type Run = { end: "win" | "attp" | "broke" | "chưa"; day: number; hours: number; stars: number; served: number; guests: number; lost: number };

function play(lane: Lane, seed: number): Run {
  const w = newGame("bot", `life-${lane.tier}-${lane.price}-${seed}`);
  const policy = { ...POLICIES.greedy, price: lane.price, tier: lane.tier };
  let minutes = 0, served = 0, guests = 0, lost = 0;
  for (let d = 1; d <= days; d++) {
    if (d > 1) nextDay(w);
    guests += guestsOf(w);
    const h = new HeadlessStall(w, policy, { bus: new Bus(false), platform: memoryPlatform() });
    h.run({ inject: () => {} });
    h.close();
    eveningCounting(w);
    minutes += h.elapsed / 60 + OFF_STALL_MIN;
    served += w.progress.today.served;
    lost += w.progress.today.lost;
    const stars = average(w);
    if (markWin(w)) return { end: "win", day: d, hours: minutes / 60, stars, served, guests, lost };
    if (attpCheck(w).closed) return { end: "attp", day: d, hours: minutes / 60, stars, served, guests, lost };
    if (markBroke(w)) return { end: "broke", day: d, hours: minutes / 60, stars, served, guests, lost };
  }
  return { end: "chưa", day: days, hours: minutes / 60, stars: average(w), served, guests, lost };
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const pct = (a: number, b: number) => (b ? ((a / b) * 100).toFixed(0) + "%" : "—");

console.log(`mốc thắng ${(WIN_VND / 1_000_000).toFixed(1)}tr · tối đa ${days} ngày × ${seeds} hạt giống\n`);
console.log("nền khách:", [1, 10, 20, 40, 60, 80, 100].map((d) => `n${d}=${baseGuests(d)}`).join(" "));
console.log();
console.log("lối chơi".padEnd(20), "kết".padEnd(6), "ngày", " giờ", "  sao", " ổ/ngày", " khách/ngày", " bỏ đi");

for (const lane of LANES) {
  const runs = Array.from({ length: seeds }, (_, s) => play(lane, s));
  const ends = runs.map((r) => r.end);
  const top = ["win", "attp", "broke", "chưa"].filter((e) => ends.includes(e as Run["end"]))
    .map((e) => `${e} ${ends.filter((x) => x === e).length}/${seeds}`).join(" ");
  console.log(
    lane.name.padEnd(20),
    top.padEnd(6),
    avg(runs.map((r) => r.day)).toFixed(0).padStart(4),
    avg(runs.map((r) => r.hours)).toFixed(1).padStart(5),
    avg(runs.map((r) => r.stars)).toFixed(2).padStart(5),
    avg(runs.map((r) => r.served / r.day)).toFixed(1).padStart(7),
    avg(runs.map((r) => r.guests / r.day)).toFixed(1).padStart(11),
    pct(runs.reduce((a, r) => a + r.lost, 0), runs.reduce((a, r) => a + r.guests, 0)).padStart(6),
  );
}
