/** Phân bố điểm chọn chuyện theo khung cảnh — kiểm có cuộc nào rơi dưới `TALK_SCORE_FLOOR` (nhất là lúc `DOI_BANH`) không. */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TALK_NPC_IDS } from "../src/content/talks";
import { TALK_SCORE_FLOOR, eligible, kindOf } from "../src/sim/talk";

const theo = new Map<string, number[]>();
/** Riêng cuộc `CHUYEN` — đáng lẽ phải im khi người ta đang đợi bánh. */
const tanGau = new Map<string, number[]>();

for (let d = 1; d <= 6; d++) {
  const w = newGame(`diem${d}`, "p210");
  const bus = new Bus(false);
  for (let k = 1; k < d * 3; k++) nextDay(w);
  const h = new HeadlessStall(w, POLICIES.greedy, { bus, platform: memoryPlatform() });
  const svc = (h as any).service;
  for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);

  for (let i = 0; i < 120000; i++) {
    h.step(1000 / 30);
    if (i % 53) continue;
    for (const ai of svc.customers) {
      if (ai.phase === "leaving" || ai.pass) continue;
      const kc = svc.practiceOf(ai);
      if (!kc) continue;
      const ok = eligible(svc.talks.get(svc.talkKey(ai)), svc.talkCtx(ai), "PLAYER")
        .filter((x: any) => svc.canRun(x, ai));
      for (const t of ok) {
        const diem = svc.scoreTalk(ai, t);
        (theo.get(kc) ?? theo.set(kc, []).get(kc)!).push(diem);
        if (kindOf(t) === "CHUYEN") (tanGau.get(kc) ?? tanGau.set(kc, []).get(kc)!).push(diem);
      }
    }
  }
}

const tom = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return `n=${String(s.length).padStart(6)}  thấp nhất ${s[0].toFixed(1).padStart(7)}  p10 ${q(0.1).toFixed(1).padStart(7)}  trung vị ${q(0.5).toFixed(1).padStart(7)}  cao nhất ${s[s.length - 1].toFixed(1).padStart(7)}`;
};

console.log(`sàn đang đặt: TALK_SCORE_FLOOR = ${TALK_SCORE_FLOOR}\n`);
console.log("── MỌI CUỘC, theo khung cảnh ──");
for (const [k, xs] of [...theo].sort()) console.log(`  ${k.padEnd(10)} ${tom(xs)}`);
console.log("\n── RIÊNG CUỘC TÁN GẪU (`CHUYEN`) ──");
for (const [k, xs] of [...tanGau].sort()) console.log(`  ${k.padEnd(10)} ${tom(xs)}`);

const cho = tanGau.get("DOI_BANH") ?? [];
if (cho.length) {
  const duoi = cho.filter((x) => x < TALK_SCORE_FLOOR).length;
  console.log(`\nĐang đợi bánh: ${duoi}/${cho.length} câu tán gẫu nằm DƯỚI sàn `
    + `(${((duoi / cho.length) * 100).toFixed(0)}%) — phần còn lại vẫn bắt chuyện được.`);
}
