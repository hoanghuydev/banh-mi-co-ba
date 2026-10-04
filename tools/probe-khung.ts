/**
 * MỖI NGƯỜI CÓ TÊN SỐNG TRONG KHUNG CẢNH NÀO — và kho thoại của họ gắn thẻ khung nào.
 *
 * `okPractice` là cổng im lặng nhất của cả hệ: thẻ gắn trật thì cuộc không bao giờ rút ra
 * được, mà không có lỗi nào nổ. `tools/probe-act.ts` chỉ ra sáu act "chưa bao giờ đủ điều
 * kiện"; máy này nói VÌ SAO — so khung cảnh người đó THẬT SỰ ở, với khung cảnh kho thoại
 * của họ KHAI.
 */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TALK_NPC_IDS, TalkStore } from "../src/content/talks";
import { PRACTICE_IDS } from "../src/content/vocab";
import type { Talk } from "../src/sim/talk";

const argN = (k: string, d: number) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? Number(process.argv[i + 1]) : d; };
const NGAY = argN("days", 10);

const TALKS: Talk[] = await TalkStore.loadAll();
const o = new Map<string, Record<string, number>>();

const w = newGame("khung", "p210");
const bus = new Bus(false);
const platform = memoryPlatform();
for (let d = 1; d < 5; d++) nextDay(w, bus);
for (let ngay = 0; ngay < NGAY; ngay++) {
  const h = new HeadlessStall(w, POLICIES.social, { bus, platform });
  const svc = (h as unknown as { service: any }).service;
  for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);
  for (let f = 0; f < 140_000 && !h.closed; f++) {
    h.step(1000 / 30);
    if (f % 29) continue;
    for (const c of svc.customers) {
      if (!c.npc) continue;
      const r = o.get(c.memKey) ?? Object.fromEntries(PRACTICE_IDS.map((p) => [p, 0]));
      r[svc.practiceOf(c)]++;
      o.set(c.memKey, r);
    }
  }
  nextDay(w, bus);
}

console.log(`\n${NGAY} buổi · khung cảnh người đó THẬT SỰ ở (%), và thẻ kho thoại KHAI\n`);
for (const [npc, r] of [...o].sort()) {
  const tong = Object.values(r).reduce((a, b) => a + b, 0) || 1;
  const song = PRACTICE_IDS.filter((p) => r[p] / tong >= 0.01);
  const kho = TALKS.filter((t) => t.npc === npc);
  const khai = new Set<string>();
  for (const t of kho) for (const p of [t.practice ?? []].flat()) khai.add(p);
  /** Thẻ KHAI mà người đó gần như KHÔNG BAO GIỜ ở trong đó = cuộc gắn thẻ ấy coi như chôn. */
  const chon = [...khai].filter((p) => !song.includes(p as never));
  console.log(`${npc.padEnd(11)} ở: ${song.map((p) => `${p} ${(r[p] / tong * 100).toFixed(0)}%`).join(" · ")}`);
  if (chon.length) {
    const nanNhan = kho.filter((t) => [t.practice ?? []].flat().every((p) => chon.includes(p)));
    console.log(`${" ".repeat(11)} ⚠ thẻ KHAI mà không bao giờ ở: ${chon.join(", ")}`
      + (nanNhan.length ? `  ⇒ CHÔN HẲN: ${nanNhan.map((t) => t.id).join(", ")}` : ""));
  }
}
