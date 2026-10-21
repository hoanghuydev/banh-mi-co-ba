/** npx tsx tools/probe-p209.ts [--days N] — chạy N ngày headless, đếm các cơ chế có thật sự xảy ra không. */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";

const i = process.argv.indexOf("--days");
const days = i >= 0 ? Number(process.argv[i + 1]) : 20;

const world = newGame("probe", "p209");
const platform = memoryPlatform();
const bus = new Bus(false);

let phases = new Map<string, number>();
let cut = 0, blocked = 0, shadeFreeFalse = 0, frames = 0, deeds = 0, practices = new Map<string, number>();
for (let d = 1; d <= days; d++) {
  if (d > 1) nextDay(world);
  const h = new HeadlessStall(world, POLICIES.greedy, { bus, platform });
  const svc = (h as unknown as { service: { customers: { cutLine: boolean; blocking: boolean }[]; shadeFree: boolean; practiceOf: (c: unknown) => string; pendingDeeds: (k: string) => unknown[] } }).service;
  h.run({ inject: () => {
    frames++;
    for (const c of svc.customers) {
      if (c.cutLine) cut++;
      if (c.blocking) blocked++;
      const p = svc.practiceOf(c);
      practices.set(p, (practices.get(p) ?? 0) + 1);
      const ph = (c as unknown as { phase: string; slot: number }).phase;
      phases.set(ph, (phases.get(ph) ?? 0) + 1);
    }
    if (!svc.shadeFree) shadeFreeFalse++;
  } });
  h.close();
}
console.log(`\n${days} ngày · ${frames} frame`);
console.log(`  frame có người ĐANG mang cờ chen hàng : ${cut}`);
console.log(`  frame có người ĐANG đứng chắn         : ${blocked}`);
console.log(`  frame chỗ mát BỊ CHIẾM                : ${shadeFreeFalse}`);
console.log(`  lời hứa đang treo                     : ${deeds}`);
console.log("  pha gặp được:");
for (const [p, n] of [...phases].sort((a, b) => b[1] - a[1])) console.log(`    ${p.padEnd(10)} ${n}`);
console.log("  khung cảnh gặp được:");
for (const [p, n] of [...practices].sort((a, b) => b[1] - a[1])) console.log(`    ${p.padEnd(10)} ${n}`);
