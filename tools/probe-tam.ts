import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";

let gap = 0, roll = 0, ban = 0, canh = 0, chao = 0;
for (let d = 0; d < 6; d++) {
  const w = newGame(`t${d}`, "p210");
  const bus = new Bus(false);
  for (let k = 0; k < d; k++) nextDay(w);
  const h = new HeadlessStall(w, POLICIES.greedy, { bus, platform: memoryPlatform() });
  const svc = (h as any).service;
  const goc = svc.greetPassers.bind(svc), gocC = svc.chatScene.bind(svc);
  svc.chatScene = (...a: any[]) => { canh++; return gocC(...a); };
  svc.greetPassers = () => {
    const amb = svc.customers.filter((c: any) => c.ambient && c.pass && !c.speaking && !c.greeted);
    for (let i = 0; i < amb.length; i++) for (let j = i + 1; j < amb.length; j++) {
      const a = amb[i], b = amb[j];
      if (Math.sign((a.pass.exit?.x ?? a.x) - a.x) === Math.sign((b.pass.exit?.x ?? b.x) - b.x)) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) > 1.0) continue;
      gap++;
      if (svc.deps.hub.derive(`greet:${svc.deps.day}:${[a.id, b.id].sort().join("|")}`).next() < 0.25) {
        roll++;
        if (svc.queue.length > 1) ban++;
      }
    }
    return goc();
  };
  for (let i = 0; i < 120000; i++) h.step(1000 / 30);
  chao += svc.customers.length;
}
console.log(`gặp mặt ${gap} · qua roll chào ${roll} · bị gác hàng đợi chặn ${ban} · cảnh tám ${canh}`);
