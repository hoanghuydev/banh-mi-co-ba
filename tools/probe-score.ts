/** npx tsx tools/probe-score.ts — điểm drive của từng người đi ngang, để đặt sàn. */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TALK_NPC_IDS } from "../src/content/talks";
import { eligible } from "../src/sim/talk";

const w = newGame("sc", "p209");
const bus = new Bus(false);
const platform = memoryPlatform();
for (let d = 1; d < 5; d++) nextDay(w);
const h = new HeadlessStall(w, POLICIES.greedy, { bus, platform });
const svc = (h as unknown as { service: any }).service;
for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);

const seen = new Set<string>();
let n = 0;
for (let i = 0; i < 4000 && n < 16; i++) {
  h.step(1000 / 30);
  if (i % 5) continue;
  await Promise.resolve();
  for (const c of svc.customers) {
    if (!c.ambient || !c.pass || seen.has(c.id) || n >= 16) continue;
    seen.add(c.id); n++;
    const ctx = svc.talkCtx(c);
    const pool = [...svc.talks.get(svc.talkKey(c)), ...svc.talks.get("ANY")];
    const rows = eligible(pool, ctx, "PLAYER").map((t: { id: string }) => [t.id, ctx.score!(t as never)] as const)
      .sort((a, b) => b[1] - a[1]);
    console.log(`${c.purposeLabel.padEnd(32)} VIEC=${String(Math.round(c.drives.VIEC_RIENG)).padStart(3)} YEN=${String(Math.round(c.drives.YEN_THAN)).padStart(3)}  →  ${rows.slice(0, 3).map(([i2, s]) => `${i2} ${s.toFixed(1)}`).join("  |  ")}`);
  }
}
h.close();
