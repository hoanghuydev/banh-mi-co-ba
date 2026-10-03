/**
 * npx tsx tools/show-talk.ts [kho]
 *
 * In ĐÚNG CÁI NGƯỜI CHƠI THẤY ở nhịp đầu, cho CẢ HAI đường mở lời.
 *
 * Có mặt vì lỗi gốc của chủ dự án không phải một bug nổ ra ở đâu — nó là *đọc lên thấy
 * sai vai*, và thứ đó chỉ nhìn ra khi hai đường được bày cạnh nhau: *"chính mình là
 * người bắt chuyện trước"* mà câu đầu lại là một câu đáp.
 */
import { TalkStore } from "../src/content/talks";
import { okSource, visibleOptions, type Talk, type TalkGate } from "../src/sim/talk";

const pool = process.argv[2] ?? "QUA_DUONG";
const all: Talk[] = await TalkStore.loadAll();

/**
 * Mọi cổng NGOÀI `c.openedBy` coi như THOẢ — kể cả cổng phủ định.
 *
 * Mục đích của công cụ này là xem TRẦN TRÊN của từng nhánh, không phải một lát cắt của
 * một khoảnh khắc. Trả `false` cho `!p.soldOut` (lỗi của bản đầu) là tự cắt mất mấy dòng
 * mời mua rồi tưởng nội dung thiếu.
 */
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
