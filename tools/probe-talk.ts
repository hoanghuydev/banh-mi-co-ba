/**
 * npx tsx tools/probe-talk.ts
 *
 * Bấm F ở mọi khung cảnh và xem CÓ RA DẢI LỰA CHỌN KHÔNG — và nếu không thì vì sao.
 *
 * ⚠️ Phải `await` cho `TalkStore` nạp xong: `talks.ensure()` là bất đồng bộ, mà `h.run()`
 * chạy một mạch không nhả frame. Trong game thật rAF nhả mỗi frame nên không gặp; ở đây
 * không await là mọi lần mở đều trượt với lý do "chưa nạp xong", và probe sẽ nói dối.
 */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TALK_NPC_IDS } from "../src/content/talks";
import { visibleOptions } from "../src/sim/talk";
import { holds } from "../src/sim/worldfacts";

const world = newGame("probe", "talk");
const bus = new Bus(false);
const platform = memoryPlatform();

type Row = { ok: number; fail: number; reasons: Map<string, number> };
/** Tỉ lệ nhịp kết bằng "?" — mốc của P2-07 §4.1 là dưới 5%. */
let qTot = 0, qHit = 0;
const qWhy = new Map<string, number>();
const seen = new Map<string, Row>();
const picked = new Map<string, number>();
const firstLines = new Map<string, string[]>();

for (let d = 1; d <= 6; d++) {
  if (d > 1) nextDay(world, bus);
  const h = new HeadlessStall(world, POLICIES.greedy, { bus, platform });
  const svc = (h as unknown as { service: any }).service;
  for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);

  for (let i = 0; i < 2600; i++) {
    h.step(1000 / 30);
    if (i % 7) continue;
    await Promise.resolve();
    for (const c of svc.customers) {
      if (c.phase === "leaving" && !c.pass) continue;
      const p = svc.practiceOf(c);
      const row = seen.get(p) ?? { ok: 0, fail: 0, reasons: new Map() };
      seen.set(p, row);
      const orig = svc.talkTarget.bind(svc);
      svc.talkTarget = () => c;
      // NGƯỜI CHƠI bấm phím: `talkNpcOpened` phải là false, nên `c.openedBy(PLAYER)` đúng.
      const v = svc.openTalk();
      if (v) {
        row.ok++;
        // TỈ LỆ "?" — mốc của P2-07 §4.1 là dưới 5%. Bấm thử TỪNG lựa chọn đang hiện và
        // đếm xem bao nhiêu nhịp kết bằng một dấu hỏi.
        for (let k = 0; k < (svc.talkSession?.options?.length ?? 0); k++) {
          const probe = svc.talkSession;
          const pending = probe?.peek(k, svc.talkGate());
          if (!pending?.while?.length) { qTot++; continue; }
          qTot++;
          const w2 = (svc as any).snapshot(c);
          const bad = pending.while.find((x: string) => !holds(x, w2));
          if (bad) { qHit++; qWhy.set(bad, (qWhy.get(bad) ?? 0) + 1); }
        }
        const id = svc.talkSession?.talk?.id ?? "?";
        picked.set(id, (picked.get(id) ?? 0) + 1);
        for (const o of visibleOptions(svc.talkSession?.options ?? [], svc.talkGate())) {
          const key = `${id}|${o.tone}|${o.say}`;
          firstLines.set(key, [...(firstLines.get(key) ?? []), "x"]);
        }
        svc.closeTalk();
      } else {
        row.fail++;
        const why = svc.talkUnavailable() ?? "(null — KHÔNG hiện gì cả)";
        row.reasons.set(why, (row.reasons.get(why) ?? 0) + 1);
      }
      svc.talkTarget = orig;
    }
  }
  h.close();
}

console.log("\nbấm F ở từng khung cảnh:");
for (const [p, r] of [...seen].sort()) {
  const pct = (100 * r.ok / Math.max(1, r.ok + r.fail)).toFixed(0);
  console.log(`  ${p.padEnd(10)} mở ${String(r.ok).padStart(5)} · trượt ${String(r.fail).padStart(5)}  (${pct}% mở được)`);
  for (const [why, n] of [...r.reasons].sort((a, b) => b[1] - a[1]).slice(0, 3)) {
    console.log(`       ${String(n).padStart(5)}× ${why}`);
  }
}
console.log(`\ntỉ lệ nhịp ra "?" : ${qHit}/${qTot} = ${(100 * qHit / Math.max(1, qTot)).toFixed(2)}%  (mốc P2-07 §4.1: < 5%)`);
for (const [k, n] of [...qWhy].sort((a, b) => b[1] - a[1])) console.log(`     ${String(n).padStart(5)}× hỏng vì ${k}`);

console.log("\ncuộc rút được:");
for (const [id, n] of [...picked].sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log(`  ${String(n).padStart(5)}× ${id}`);

const arg = process.argv.indexOf("--lines");
if (arg >= 0) {
  const want = process.argv[arg + 1];
  console.log("\ncâu NGƯỜI CHƠI THẤY ở nhịp đầu (số lần):");
  const rows = [...firstLines].filter(([k]) => !want || k.startsWith(`${want}|`))
    .map(([k, v]) => [k, v.length] as const).sort((a, b) => b[1] - a[1]);
  for (const [k, n] of rows) {
    const [id, tone, say] = k.split("|");
    console.log(`  ${String(n).padStart(5)}×  ${id.padEnd(16)} ${tone.padEnd(7)} ${say}`);
  }
  console.log(`  — ${rows.length} câu khác nhau`);
}
