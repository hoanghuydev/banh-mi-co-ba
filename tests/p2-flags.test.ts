/**
 * CỜ CHUYỆN PHẢI CÓ CHỖ VỀ — P2-06 §2.14.
 *
 * Một `flag` trong kho thoại là lời hứa của hệ thống: *"game vừa ghi lại việc bạn làm."*
 * Đặt cờ rồi không ai đọc là hứa suông — và nó không nổ ra thành bug, không ai thấy,
 * nên nó lặng lẽ chất lên. Đo lúc dựng lưới này: **106 cờ đặt ra, 2 được đọc**.
 *
 * Mấy cờ đó không phải chuyện vặt. Chúng ghi LỜI HỨA và BÍ MẬT: `maiTraGiumBay` (người
 * chơi ngỏ ý trả giùm một phần nợ của bà Bảy mà cô Mai đang gánh), `sauNhoNoi` (hứa nói
 * lại với anh Dũng chuyện ôm cua), `maiNhoLan` (nhận lời để ý chị Lan giùm cô Mai).
 * Người viết đã dựng sẵn một mạng lưới; không ai nối dây.
 *
 * Luật: mỗi cờ phải HOẶC được đọc ở đâu đó, HOẶC bị xoá. Không có ô thứ ba.
 */
import { test } from "node:test";
import { readFile, readdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { bareFlag, needKeys, walkNodes, type Talk } from "../src/sim/talk";
import { TalkStore } from "../src/content/talks";

const TALKS: Talk[] = await TalkStore.loadAll();

/** Mọi chỗ NGOÀI kho thoại có thể đọc một cờ: arc, sự kiện, luật chơi, UI. */
async function outsideText(): Promise<string> {
  const parts: string[] = [];
  const walkDir = async (d: URL) => {
    for (const e of await readdir(d, { withFileTypes: true })) {
      if (e.isDirectory()) { if (e.name !== "talks") await walkDir(new URL(`${e.name}/`, d)); }
      else if (/\.(json|ts)$/.test(e.name)) parts.push(await readFile(new URL(e.name, d), "utf8"));
    }
  };
  for (const d of ["content/", "sim/", "scenes/", "ui/"]) {
    await walkDir(new URL(`../src/${d}`, import.meta.url));
  }
  return parts.join("\n");
}

/** Cờ chuyện mà nút này ĐỌC — bỏ khoá bảng đen và bỏ dấu phủ định (P2-09 §2.2). */
const storyFlagsOf = (node: { need?: string | string[] }): string[] =>
  needKeys(node as never)
    .map((k) => (k.startsWith("!") ? k.slice(1) : k))
    .filter((k) => !k.includes("."))
    .map(bareFlag);

const setBy = new Map<string, string[]>();
const readBy = new Set<string>();
for (const t of TALKS) {
  if (t.when?.needFlag) readBy.add(bareFlag(t.when.needFlag));
  if (t.when?.notFlag) readBy.add(bareFlag(t.when.notFlag));
  for (const { node } of walkNodes(t)) {
    // `need` nhận cả chuỗi lẫn mảng từ P2-09, và chỉ khoá KHÔNG có dấu chấm mới là cờ
    // chuyện — khoá bảng đen (`p.holdsBread`) không phải cờ, đừng tính nó vào đây.
    for (const k of storyFlagsOf(node)) readBy.add(k);
    if (node.flag) (setBy.get(node.flag) ?? setBy.set(node.flag, []).get(node.flag)!).push(t.id);
  }
}

test("F-1 cờ nào đặt ra cũng phải có người đọc — không thì xoá nó đi", async () => {
  const outside = await outsideText();
  const dead = [...setBy.keys()].filter((f) => !readBy.has(f) && !outside.includes(f));
  assert.deepEqual(dead, [],
    `${dead.length} cờ đặt rồi không ai đọc. Mỗi cái phải hoặc được một cuộc khác đọc `
    + `(\`need\` / \`when.needFlag\`), hoặc bị xoá khỏi nội dung:\n  `
    + dead.map((f) => `${f}  (đặt ở ${setBy.get(f)!.join(", ")})`).join("\n  "));
});

test("F-2 cờ đọc mà không ai đặt = một nhánh nội dung không bao giờ mở ra", () => {
  const outside = new Set<string>();
  const orphan = [...readBy].filter((f) => !setBy.has(f) && !outside.has(f));
  assert.deepEqual(orphan, [], `cờ không bao giờ được đặt: ${orphan.join(", ")}`);
});

test("F-3 phải có đủ cầu BẮC NGANG giữa hai người — đó là thứ đáng đi tìm", () => {
  /**
   * Cờ mà người đặt và người đọc là HAI NPC khác nhau mới là thứ làm cái hẻm đáng lục
   * lọi: chuyện mình kể cho cô Mai tới tai chị Lan. Cờ đặt rồi chính người đó đọc lại
   * chỉ là trí nhớ một chiều — vẫn tốt, nhưng không phải khám phá.
   */
  const npcOf = new Map(TALKS.map((t) => [t.id, t.npc]));
  const readerNpc = new Map<string, Set<string>>();
  for (const t of TALKS) {
    const add = (f: string) => (readerNpc.get(f) ?? readerNpc.set(f, new Set()).get(f)!).add(t.npc);
    if (t.when?.needFlag) add(t.when.needFlag);
    if (t.when?.notFlag) add(t.when.notFlag);
    for (const { node } of walkNodes(t)) for (const k of storyFlagsOf(node)) add(k);
  }
  let bridges = 0;
  for (const [flag, talkIds] of setBy) {
    const setters = new Set(talkIds.map((id) => npcOf.get(id)!));
    const readers = readerNpc.get(flag);
    if (readers && [...readers].some((r) => !setters.has(r))) bridges++;
  }
  assert.ok(bridges >= 15,
    `mới ${bridges} cờ bắc cầu giữa hai người cho cả mùa 40 ngày — cái hẻm chưa đáng đi lục`);
});
