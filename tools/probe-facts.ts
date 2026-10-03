/**
 * npx tsx tools/probe-facts.ts [--pool WALKIN|QUA_DUONG] [--days N]
 *
 * LÚC BẤM F, SỰ THẬT NÀO ĐANG ĐÚNG — và đúng bao nhiêu phần trăm.
 *
 * Có mặt vì viết cổng mà không biết tần suất là viết mò, và viết mò ra đúng một kiểu
 * hỏng: câu hay thì khoá chặt tới mức không bao giờ hiện, câu nhạt thì để trần nên luôn
 * hiện. Đo được trên `walkin.cay`: hai câu hay khoá `!t.hasOrder` (đúng 8%) cộng
 * `practice: NAN_LAI` (8%) ⇒ cả mùa không chạy lần nào, còn hai câu luôn hiện thì cụt.
 *
 * Quy tắc rút ra, và cổng `validate:talks` T013 giữ nó: **câu luôn hiện phải có nhánh;
 * câu cụt phải là câu KẾT hoặc phải có khoá.**
 */
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

/** Khoá có tham số thì thử mấy giá trị hay dùng. */
const PROBES: string[] = [];
for (const name of Object.keys((blackboard as { aliases: Record<string, unknown> }).aliases)) {
  if (/^(t|p|w|c|v|d|m)\./.test(name)) PROBES.push(name);
}
const EXTRA = ["t.practice(GOI_MON)", "t.practice(XEP_HANG)", "t.practice(QUAY_VANG)", "t.practice(NAN_LAI)",
  "w.queue(1)", "w.queue(2)", "w.band(SOM)", "w.band(TRUA)", "p.stockAtLeast(3)", "w.day(10)", "m.visits(2)"];

const w = newGame("facts", "p209");
const bus = new Bus(false); const platform = memoryPlatform();
for (let d = 1; d < 5; d++) nextDay(w, bus);
const hit = new Map<string, number>(); let n = 0;
for (let day = 0; day < DAYS; day++) {
  const h = new HeadlessStall(w, POLICIES.greedy, { bus, platform });
  const svc = (h as unknown as { service: any }).service;
  svc.stock = 12; svc.ovenBusy = true; svc.playerHand = "loaf_filled";
  for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);
  for (let i = 0; i < 9000; i++) {
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
  nextDay(w, bus);
}
console.log(`\n${POOL} · ${n} mẫu lúc bấm F · tần suất sự thật\n`);
const rows = [...PROBES, ...EXTRA].map((k) => [k, (hit.get(k) ?? 0) / n] as const).sort((a, b) => b[1] - a[1]);
for (const [k, r] of rows) {
  const bar = "█".repeat(Math.round(r * 30));
  const flag = r === 0 ? "  ← KHÔNG BAO GIỜ ĐÚNG" : r < 0.03 ? "  ← gần như không" : "";
  console.log(`  ${k.padEnd(22)} ${(100 * r).toFixed(0).padStart(3)}%  ${bar}${flag}`);
}
