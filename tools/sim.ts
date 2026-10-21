/**
 * npm run sim -- --days 30 --seed test-01 --policy greedy --out metrics.json
 *
 * Chạy N ngày KHÔNG render (P0-03 §2.2), in DayMetrics của từng ngày và ước tính tổng giờ chơi.
 *
 * ⚠️ Con số thời gian ở đây là thời gian MÔ PHỎNG của buổi bán (bot chơi), không
 * phải thời gian người thật chơi. Chợ sáng và buổi tối chạy theo LƯỢT nên bot không
 * đo được — cộng thêm theo ước tính của P0-02 §2.1 và ghi rõ là ƯỚC TÍNH.
 * Con số thật chỉ đến từ telemetry của người chơi thật (P0-03 §2.1, cổng A1/A2).
 */
import { writeFileSync } from "node:fs";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { Telemetry, paceOf } from "../src/core/telemetry";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { eveningCounting } from "../src/sim/day";

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};

const days = Number(arg("days", "30"));
const seed = arg("seed", "test-01");
const policy = POLICIES[arg("policy", "greedy")];
const out = arg("out", "");
if (!policy) throw new Error(`policy phải là một trong: ${Object.keys(POLICIES).join(", ")}`);

/** P0-02 §2.1: phút thật ước tính cho hai khung theo lượt. KHÔNG phải số đo. */
const MARKET_MIN_EST = 1.5;
const EVENING_MIN_EST = 1.0;

const t0 = performance.now();
const world = newGame("bot", seed);
const platform = memoryPlatform();
const bus = new Bus(false);
let simMs = 0;
const tele = new Telemetry(bus, true, platform, () => simMs);

const rows: string[] = [];
const k = (v: number) => String(Math.round(v / 1000)).padStart(5);
for (let d = 1; d <= days; d++) {
  if (d > 1) nextDay(world);
  simMs = 0;
  const h = new HeadlessStall(world, policy, { bus, platform });
  h.run({ inject: () => { simMs = h.elapsed * 1000; } });
  simMs = h.elapsed * 1000;
  h.close();
  const m = tele.days.at(-1)!;
  eveningCounting(world);
  const et = world.econ.today;
  rows.push([
    String(d).padStart(3),
    (h.elapsed / 60).toFixed(2).padStart(6),
    String(m.customersServed).padStart(4),
    String(m.customersLost.IMPATIENT).padStart(4),
    String(Math.round(m.msPerCustomer.p50 / 1000)).padStart(5),
    String(m.stimEmitted.DROPPED_FOOD ?? 0).padStart(5),
    (m.confirmRate.DROPPED_FOOD ?? 0).toFixed(2).padStart(6),
    m.silentNoticeRate.toFixed(2).padStart(6),
    String(m.lineRepeatWithin2h).padStart(5),
    k(world.progress.today.revenue), k(et.market), k(et.fixed + et.rent + et.sendHome), k(world.money.cash),
    world.econ.today.soldOut ? `hết×${world.econ.today.soldOut}` : "",
  ].join(" │ "));
}
const wall = performance.now() - t0;

console.log(`\nsim · ${days} ngày · seed "${seed}" · policy ${policy.name}\n`);
console.log("ngày │ phút  │ bán  │ bỏ   │ s/kh  │ rớt   │ bắt   │ im    │ lặp   │  thu │  chợ │ cố định+nhà │ trong ống (k)");
console.log(rows.join("\n"));

const est = paceOf(tele.days);
const perDay = est.minPerDay + MARKET_MIN_EST + EVENING_MIN_EST;
console.log(`\nquầy (mô phỏng): ${est.minPerDay} phút/ngày`);
console.log(`+ chợ ${MARKET_MIN_EST} + tối ${EVENING_MIN_EST} (ƯỚC TÍNH P0-02 §2.1, không phải số đo)`);
console.log(`= ~${perDay.toFixed(2)} phút/ngày → ${days} ngày ≈ ${((perDay * days) / 60).toFixed(2)} giờ`);
console.log(`chạy mất ${(wall / 1000).toFixed(2)} s`);
console.log("\n⚠️ Đây là nhịp của BOT. Cổng A1/A2 chỉ được chốt bằng telemetry người thật (≥5 ngày, ≥2 người).");

if (out) {
  writeFileSync(out, JSON.stringify({ seed, policy: policy.name, days: tele.days, estimate: est, wallMs: wall }, null, 2));
  console.log(`đã ghi ${out}`);
}
