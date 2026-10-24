/** Mỗi lối chơi chạy tới khi thắng/thua; in ngày đạt từng danh hiệu. npm run probe:ach -- 160 2 */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay, type Policy } from "../src/sim/headless";
import { eveningCounting } from "../src/sim/day";
import { markBroke } from "../src/sim/broke";
import { markShutdown } from "../src/sim/reviews";
import { markWin } from "../src/sim/win";
import { achGot, checkEvening, checkLive } from "../src/sim/ach";
import { ACH_LIST } from "../src/content/ach";

const days = Number(process.argv[2] ?? 160);
const seeds = Number(process.argv[3] ?? 2);

const LANES: { name: string; policy: Policy }[] = [
  { name: "sạch·thường", policy: { ...POLICIES.greedy, price: 1, tier: "THUONG" } },
  { name: "xịn·đắt", policy: { ...POLICIES.greedy, price: 2, tier: "NGON" } },
  { name: "thường·rẻ", policy: { ...POLICIES.greedy, price: 0, tier: "THUONG" } },
  { name: "bẩn·rẻ", policy: { ...POLICIES.greedy, price: 0, tier: "BAN" } },
  { name: "trà", policy: { ...POLICIES.tea, price: 1, build: POLICIES.greedy.build } },
  { name: "xã giao", policy: POLICIES.social },
  { name: "newbie", policy: POLICIES.newbie },
  { name: "cẩu thả", policy: { ...POLICIES.greedy, dropRate: 0.3, burnRate: 0.2, teaRate: 0.5, price: 1 } },
];

const first: Record<string, Record<string, number>> = {};
for (const lane of LANES) {
  for (let s = 0; s < seeds; s++) {
    const w = newGame("bot", `ach-${lane.name}-${s}`);
    const p = memoryPlatform();
    let end = "chưa";
    for (let d = 1; d <= days; d++) {
      if (d > 1) nextDay(w);
      const h = new HeadlessStall(w, lane.policy, { bus: new Bus(false), platform: memoryPlatform() });
      h.run({ inject: () => {} });
      h.close();
      eveningCounting(w);
      checkEvening(w, p);
      if (markWin(w)) { checkLive(w, p); end = `thắng ${d}`; break; }
      if (markShutdown(w) || markBroke(w)) { checkLive(w, p); end = `thua ${d}`; break; }
    }
    const got = achGot(p);
    console.log(`${lane.name} #${s}: ${end} · ${Object.keys(got).length} danh hiệu`);
    for (const [id, day] of Object.entries(got)) {
      const row = (first[id] ??= {});
      row[lane.name] = Math.min(row[lane.name] ?? 1e9, day);
    }
  }
}
console.log();
for (const a of ACH_LIST) {
  const r = first[a.id];
  console.log(a.name.padEnd(28), r ? Object.entries(r).map(([l, d]) => `${l}:${d}`).join("  ") : "—");
}
