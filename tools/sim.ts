/**
 * npm run sim -- --days 40 --seed test-01 --policy greedy --out metrics.json
 *
 * Chạy N ngày KHÔNG render (P0-03 §2.2), in DayMetrics của từng ngày và ước tính
 * cả mùa. Mục tiêu: 40 ngày < 20 giây.
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
import { Telemetry, estimateSeason } from "../src/core/telemetry";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { settleNight } from "../src/sim/night";
import { eveningCounting } from "../src/sim/day";
import { CLAIM } from "../src/sim/gossip";
import { NPCS } from "../src/content/npcs";

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};

const days = Number(arg("days", "40"));
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
    world.econ.losses.join(","),
  ].join(" │ "));
}
const wall = performance.now() - t0;

console.log(`\nsim · ${days} ngày · seed "${seed}" · policy ${policy.name}\n`);
console.log("ngày │ phút  │ bán  │ bỏ   │ s/kh  │ rớt   │ bắt   │ im    │ lặp   │  thu │  chợ │ cố định+nhà │ trong ống (k)");
console.log(rows.join("\n"));

// Quan hệ cuối mùa (P2-03 §6) — SỐ CHỈ Ở CÔNG CỤ DEV, không bao giờ lên màn hình (T3).
settleNight(world);
console.log("\nquan hệ cuối mùa (dev):  NPC          bucket        điểm  trần  ghé  ký ức S/L/C");
for (const npc of NPCS) {
  const n = world.npcs[npc.id];
  if (!n) continue;
  console.log(`  ${npc.name.padEnd(22)} ${n.tier.padEnd(13)} ${n.relationPoints.toFixed(0).padStart(4)}  ${String(n.trustCeiling).padStart(4)}  ${String(n.visits).padStart(3)}  ${n.memory.short.length}/${n.memory.long.length}/${n.memory.core ? 1 : 0}`);
}
const friends = NPCS.filter((n) => world.npcs[n.id]?.tier === "FRIEND").length;
console.log(`  Friend: ${friends}/12 (P2-03 §5 mục tiêu 3–5 ở ngày 40)`);

// Đồn thổi (P2-04 §6 cân bằng)
const glog = world.gossip.log;
const good = glog.filter((e) => CLAIM[e.claim]?.valence > 0).length;
console.log(`\nđồn thổi (dev): ${glog.length} lần kể · tốt ${good} : xấu ${glog.length - good} (mục tiêu ≥ 2:1)`
  + ` · méo ${glog.filter((e) => e.mutatedHere).length} (≤ 4) · hop tối đa ${Math.max(0, ...glog.map((e) => e.hops))}`);
for (const e of glog.slice(0, 12)) console.log(`  ngày ${String(e.day).padStart(2)}: ${e.from} → ${e.to} · ${e.claim}${e.mutated ? " (MÉO)" : ""}`);

const est = estimateSeason(tele.days, 40);
const perDay = est.minPerDay + MARKET_MIN_EST + EVENING_MIN_EST;
console.log(`\nquầy (mô phỏng): ${est.minPerDay} phút/ngày`);
console.log(`+ chợ ${MARKET_MIN_EST} + tối ${EVENING_MIN_EST} (ƯỚC TÍNH P0-02 §2.1, không phải số đo)`);
console.log(`= ~${perDay.toFixed(2)} phút/ngày → 40 ngày ≈ ${((perDay * 40) / 60).toFixed(2)} giờ`);
console.log(`chạy mất ${(wall / 1000).toFixed(2)} s (mục tiêu < 20 s cho 40 ngày)`);
console.log("\n⚠️ Đây là nhịp của BOT. Cổng A1/A2 chỉ được chốt bằng telemetry người thật (≥5 ngày, ≥2 người).");

if (out) {
  writeFileSync(out, JSON.stringify({ seed, policy: policy.name, days: tele.days, estimate: est, wallMs: wall }, null, 2));
  console.log(`đã ghi ${out}`);
}
