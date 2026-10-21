/** Đo: lúc nói chuyện với người đi đường thì `w.ovenHot` đúng được mấy phần. */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";

const w = newGame("oven", "p209");
const bus = new Bus(false);
const platform = memoryPlatform();
let total = 0, hot = 0, served0 = 0;
for (let d = 1; d <= 5; d++) {
  if (d > 1) nextDay(w);
  const h = new HeadlessStall(w, POLICIES.greedy, { bus, platform });
  const svc = (h as unknown as { service: any }).service;
  h.run({ inject: () => {
    for (const c of svc.customers) {
      if (!c.ambient) continue;
      total++;
      if (svc.ovenHot) hot++;
      if (svc.servedCount === 0) served0++;
    }
  } });
  h.close();
}
console.log(`người-đi-đường-frame: ${total}`);
console.log(`  w.ovenHot đúng : ${hot} (${(100 * hot / total).toFixed(1)}%)`);
console.log(`  chưa bán ổ nào : ${served0} (${(100 * served0 / total).toFixed(1)}%)`);
