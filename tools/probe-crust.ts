/** Tạm: xem câu giao bánh ra sao với mấy tổ hợp lỗi vỏ bánh + thiếu món + cho thêm. */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { HeadlessStall, POLICIES } from "../src/sim/headless";
import { dishFor, type Ingredient } from "../src/sim/order";

function atCounter(seed: string) {
  const bus = new Bus();
  const said: string[] = [];
  bus.on("dialog:spoken", (p: any) => said.push(`S: ${p.text}`));
  bus.on("dialog:silent", (p: any) => said.push(`[im: ${p.reason}]`));
  bus.on("bark:queued", (p: any) => said.push(`[queued tier${p.tier} +${p.delaySec.toFixed(2)}s]`));
  bus.on("delivery:diffed", (p: any) => said.push(`[diff ${p.mode} spoken=${p.spoken?.text ?? "KHONG"} lỗi=${p.defects.map((d: any) => d.text).join(" / ")}]`));
  const w = newGame("t", seed);
  w.progress.dayIndex = 7;
  const h = new HeadlessStall(w, { ...POLICIES.greedy, name: "ro", workSec: [1e9, 1e9] }, { bus });
  h.run({ until: (x) => !!x.service.front && x.service.front.phase === "waiting" && !!x.service.front.npc });
  h.run({ until: (x) => !x.service.front?.speaking, maxFrames: 400 });   // cho câu gọi món ra miệng xong
  said.length = 0;
  return { h, said, c: h.service.front! };
}

function show(title: string, seed: string, mut: (d: Ingredient[]) => Ingredient[], crust: number) {
  const { h, said, c } = atCounter(seed);
  const dish = mut(dishFor(c.order!));
  const r = h.service.serveDish(dish, { crust });
  h.run({ maxFrames: 2000, until: () => said.filter((x) => x.startsWith("S:")).length > 99 });
  console.log(`\n── ${title} — ${c.npc?.name} (soi ${Math.round(c.personality.soi * 100)}) · ok=${r.ok}`);
  console.log(`   đơn: ${c.orderLine}`);
  console.log("   cô Ba:", r.playerSay ?? "—");
  for (const s of said) console.log("    ", s);
}

const dropAll = (ids: Ingredient[]) => (d: Ingredient[]) => d.filter((x) => !ids.includes(x));
const add = (ids: Ingredient[]) => (d: Ingredient[]) => [...d, ...ids];

for (const seed of ["c1", "c2", "c3"]) {
  show("chưa giòn, đủ món", seed, (d) => d, 0.2);
  show("cháy cạnh, đủ món", seed, (d) => d, 1.05);
  show("thiếu đồ chua + chưa giòn", seed, dropAll(["dochua"]), 0.2);
  show("thiếu đồ chua + ớt + cháy cạnh", seed, dropAll(["dochua", "ot"]), 1.05);
  show("đủ món + cho thêm", seed, add(["dochua", "ot"]), 0.66);
  show("thiếu hành ngò + cho thêm ớt + chưa giòn", seed, (d) => add(["ot"])(dropAll(["hanhngo"])(d)), 0.2);
}
