/** Soi phân bố đánh giá và tỉ lệ lỗi trên mỗi ổ: npm run probe:topics -- 20 */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { eveningCounting } from "../src/sim/day";

const days = Number(process.argv[2] ?? 20);
const w = newGame("bot", "diag");
let turned = 0, served = 0;
const defects = new Map<string, number>();
let delivered = 0;
for (let d = 1; d <= days; d++) {
  if (d > 1) nextDay(w);
  const bus = new Bus(false);
  bus.on("delivery:diffed", (p: any) => {
    delivered++;
    for (const d of p.defects) defects.set(d.kind, (defects.get(d.kind) ?? 0) + 1);
  });
  const h = new HeadlessStall(w, { ...POLICIES.greedy, price: 1, tier: "THUONG" }, { bus, platform: memoryPlatform() });
  h.run({ inject: () => {} });
  turned += h.service.soldOutCount;
  served += w.progress.today.served;
  h.close();
  eveningCounting(w);
}
const KEY: [string, RegExp][] = [
  ["hết bánh", /hết bánh|tới nơi là hết|bán có nhiêu đó/],
  ["đau bụng", /đau bụng|ôm bụng|nằm cả ngày|hại người|đi viện/],
  ["tay bẩn", /rửa tay|tay trần|tay chưa rửa/],
  ["chờ lâu", /chờ|đợi/],
  ["giá", /mắc|đắt|chát|rẻ|giá/],
  ["cho thêm / trà đá", /cho thêm|trà đá/],
];
const byStar = [0, 0, 0, 0, 0];
for (const r of w.reviews.list) byStar[r.stars - 1]++;
console.log(`${days} ngày · phục vụ ${served} · bị từ chối vì hết bánh ${turned} · đánh giá ${w.reviews.list.length}`);
console.log("sao:", byStar.map((v, i) => `${i + 1}★ ${v}`).join("  "));
for (const [name, rx] of KEY) {
  const hit = w.reviews.list.filter((r) => rx.test(r.text));
  const s = [0, 0, 0, 0, 0];
  for (const r of hit) s[r.stars - 1]++;
  console.log(`  ${name.padEnd(18)} ${String(hit.length).padStart(3)}  (${s.map((v, i) => `${i + 1}★${v}`).join(" ")})`);
}
console.log(`  ${"không chữ".padEnd(18)} ${String(w.reviews.list.filter((r) => !r.text).length).padStart(3)}`);

console.log("\nLỗi trên " + delivered + " ổ đã giao:");
for (const [k, v] of [...defects].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(14)} ${String(v).padStart(4)}  ${(v / delivered * 100).toFixed(0)}% số ổ`);
}
console.log("\nMẫu 3★:");
for (const r of w.reviews.list.filter((r) => r.stars === 3).slice(0, 10)) console.log(`  ${r.text || "(không chữ)"}`);
console.log("\nMẫu 5★:");
for (const r of w.reviews.list.filter((r) => r.stars === 5).slice(0, 5)) console.log(`  ${r.text || "(không chữ)"}`);
