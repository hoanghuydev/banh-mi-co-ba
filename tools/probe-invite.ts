/** npx tsx tools/probe-invite.ts — vì sao cuộc mở ra không có đường mời. */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { eligible, hasInvite, kindOf } from "../src/sim/talk";

const w = newGame("inv", "p209");
const bus = new Bus(false);
const platform = memoryPlatform();
for (let d = 1; d < 5; d++) nextDay(w);
const h = new HeadlessStall(w, POLICIES.greedy, { bus, platform });
const svc = (h as unknown as { service: any }).service;
await svc.talks.ensure("QUA_DUONG");
await svc.talks.ensure("ANY");

let n = 0;
const seen = new Set<string>();
for (let i = 0; i < 3000 && n < 4; i++) {
  h.step(1000 / 30);
  if (i % 5) continue;
  await Promise.resolve();
  for (const c of svc.customers) {
    if (!c.ambient || !c.pass || seen.has(c.id) || n >= 4) continue;
    seen.add(c.id); n++;
    const ctx = svc.talkCtx(c);
    const pool = svc.talks.get(svc.talkKey(c));
    console.log(`\n[${n}] ${c.name} · ${c.purposeLabel} · practice=${svc.practiceOf(c)}`);
    console.log(`     pool có ${pool.length} cuộc`);
    const ok = eligible(pool, ctx, "PLAYER");
    console.log(`     eligible: ${ok.map((t: any) => `${t.id}${hasInvite(t) ? "*" : ""}`).join(" ")}`);
    for (const t of pool) {
      if (ok.includes(t)) continue;
      const why = [
        t.npc !== ctx.npcId && t.npc !== "ANY" ? "npc" : "",
        t.source === "NPC_ONLY" ? "source" : "",
        ctx.usedBefore.includes(t.id) ? "usedBefore" : "",
        ctx.usedToday.includes(t.topic) ? "usedToday" : "",
      ].filter(Boolean);
      const w2 = t.when;
      if (!why.length && w2) {
        if (w2.rain !== undefined && w2.rain !== ctx.rain) why.push("rain");
        if (w2.slot && !w2.slot.includes(ctx.slot)) why.push(`slot(${ctx.slot})`);
        if (w2.world) for (const k of w2.world) if (!ctx.holds!(k)) why.push(`world:${k}`);
      }
      if (!why.length) why.push("practice?");
      if (hasInvite(t)) console.log(`       ✗ ${t.id} (có mời) — loại vì ${why.join(",")}`);
    }
    console.log(`     kindOf: ${ok.map((t: any) => `${t.id}=${kindOf(t)}`).join(" ")}`);
  }
}
h.close();
