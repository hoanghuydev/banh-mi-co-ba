/** npx tsx tools/show-talk.ts [kho] — in cái người chơi thấy ở nhịp đầu cho cả hai đường mở lời, để soi câu sai vai. */
import { TalkStore } from "../src/content/talks";
import { okSource, visibleOptions, type Talk, type TalkGate } from "../src/sim/talk";

const pool = process.argv[2] ?? "QUA_DUONG";
const all: Talk[] = await TalkStore.loadAll();

/** Mọi cổng ngoài `c.openedBy` coi như thoả (kể cả cổng phủ định) để xem trần trên của từng nhánh. */
const gate = (by: "PLAYER" | "NPC"): TalkGate => ({
  flags: {},
  holds: (k) => !k.startsWith("c.openedBy") || k === `c.openedBy(${by})`,
});

for (const t of all.filter((x) => x.npc === pool)) {
  console.log(`\n═══ ${t.id}  [${t.source} · ${t.depth}]`);
  for (const by of ["PLAYER", "NPC"] as const) {
    if (!okSource(t, by)) continue;
    console.log(by === "PLAYER"
      ? "   ▸ MÌNH bấm phím bắt chuyện (opener KHÔNG nổ — P2-06 §2.15)"
      : `   ▸ HỌ mở lời: ${JSON.stringify(t.opener)}`);
    for (const o of visibleOptions(t.tree, gate(by))) console.log(`       ${o.tone.padEnd(7)} ${o.say}`);
  }
}
