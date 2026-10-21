/** npx tsx tools/probe-facts.ts [--pool WALKIN|QUA_DUONG] [--days N] — lúc bấm F fact nào đang đúng, bao nhiêu %; đo theo khoảnh khắc, không theo cuộc. */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TALK_NPC_IDS } from "../src/content/talks";
import { gateHolds } from "../src/dialog/gates";
import { queryOf } from "../src/sim/worldfacts";
import blackboard from "../src/content/rules/_blackboard.json";

const argN = (k: string, d: number) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? Number(process.argv[i + 1]) : d; };
const argS = (k: string, d: string) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? String(process.argv[i + 1]) : d; };
const POOL = argS("pool", "WALKIN"), DAYS = argN("days", 4);
// `social` = bot biết rót trà / mời ngồi / mời ghé; `greedy` chỉ biết gói bánh.
const BOT = argS("bot", "greedy");

// Khoá đòi tham số (`w.queue(2)`…) hỏi trần luôn sai nên in riêng.
const CAN_THAM_SO = new Set(
  Object.entries((blackboard as { aliases: Record<string, unknown> }).aliases)
    .filter(([, v]) => JSON.stringify(v).includes("$"))
    .map(([k]) => k),
);
const PROBES: string[] = [];
for (const name of Object.keys((blackboard as { aliases: Record<string, unknown> }).aliases)) {
  if (/^(t|p|w|c|v|d|m)\./.test(name) && !CAN_THAM_SO.has(name)) PROBES.push(name);
}
const EXTRA = ["t.practice(GOI_MON)", "t.practice(XEP_HANG)", "t.practice(QUAY_VANG)", "t.practice(NAN_LAI)",
  "w.queue(1)", "w.queue(2)", "w.band(SOM)", "w.band(TRUA)", "p.stockAtLeast(3)", "w.day(10)"];

const w = newGame("facts", "p209");
const bus = new Bus(false); const platform = memoryPlatform();
for (let d = 1; d < 5; d++) nextDay(w);
const hit = new Map<string, number>(); let n = 0;
for (let day = 0; day < DAYS; day++) {
  const h = new HeadlessStall(w, POLICIES[BOT] ?? POLICIES.greedy, { bus, platform });
  const svc = (h as unknown as { service: any }).service;
  // Bot greedy không nhen lò nên ép tay; % fact dính lò là của cái ép, không phải ván thật.
  svc.stock = 12; svc.ovenBusy = true; svc.playerHand = "loaf_filled";
  for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);
  // Phải chạy hết ngày, nếu không khung TRUA (từ 9h30) không bao giờ tới.
  for (let i = 0; i < 140_000; i++) {
    h.step(1000 / 30);
    if (i % 11) continue;
    await Promise.resolve();
    for (const c of svc.customers) {
      const isAmb = !!c.ambient;
      if (POOL === "WALKIN" && (isAmb || (c.npcId && TALK_NPC_IDS.includes(c.npcId)))) continue;
      if (POOL === "QUA_DUONG" && !isAmb) continue;
      n++;
      const q = queryOf(svc.snapshot(c));
      for (const k of [...PROBES, ...EXTRA]) {
        let ok = false;
        try { ok = gateHolds(k, q); } catch { continue; }
        if (ok) hit.set(k, (hit.get(k) ?? 0) + 1);
      }
    }
  }
  nextDay(w);
}
console.log(`\n${POOL} · bot \`${BOT}\` · ${n} mẫu lúc bấm F · tần suất sự thật\n`);
console.log(`  (${CAN_THAM_SO.size} khoá đòi tham số nên không hỏi trần được: ${[...CAN_THAM_SO].join(", ")})\n`);
const rows = [...PROBES, ...EXTRA].map((k) => [k, (hit.get(k) ?? 0) / n] as const).sort((a, b) => b[1] - a[1]);
for (const [k, r] of rows) {
  const bar = "█".repeat(Math.round(r * 30));
  const flag = r === 0 ? `  ← KHÔNG BAO GIỜ ĐÚNG (bot \`${BOT}\`)` : r < 0.03 ? "  ← gần như không" : "";
  console.log(`  ${k.padEnd(22)} ${(100 * r).toFixed(0).padStart(3)}%  ${bar}${flag}`);
}
