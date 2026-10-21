/** Mỗi lời mời INVITE của ANY/QUA_DUONG có ĂN được không — đo trên người ĐI NGANG thật, mỗi người một lần. */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TalkStore } from "../src/content/talks";
import { walkNodes } from "../src/sim/talk";

const TALKS = await TalkStore.loadAll();
/** Mọi lời mời viết sẵn trong ANY và QUA_DUONG. */
const MOI: { ten: string; node: any }[] = [];
for (const t of TALKS) {
  if (t.npc !== "ANY" && t.npc !== "QUA_DUONG") continue;
  for (const { node } of walkNodes(t)) {
    if (node.act?.kind === "INVITE") MOI.push({ ten: `${t.id} · ${node.tone}`, node });
  }
}

for (const { ten, node: moi } of MOI) {
let moiLan = 0, ghe = 0;
for (let d = 0; d < 4; d++) {
  const w = newGame(`ab${d}`, "p210");
  const bus = new Bus(false);
  for (let k = 0; k < d; k++) nextDay(w);
  const h = new HeadlessStall(w, POLICIES.greedy, { bus, platform: memoryPlatform() });
  const svc = (h as any).service;
  const xong = new Set<string>();
  for (let i = 0; i < 120000; i++) {
    h.step(1000 / 30);
    if (i % 61) continue;
    const ai = svc.customers.find((c: any) => c.ambient && c.pass && !c.speaking && !xong.has(c.id));
    if (!ai) continue;
    xong.add(ai.id); moiLan++;
    svc.applyTalkOption(ai, { act: moi.act, tone: moi.tone });
    if (!ai.ambient) ghe++;
  }
}
console.log(`${ten.padEnd(34)} mời ${String(moiLan).padStart(4)} · ghé ${String(ghe).padStart(3)} (${(ghe / moiLan * 100).toFixed(0)}%)`);
}
