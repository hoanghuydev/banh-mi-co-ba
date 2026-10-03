/**
 * CÁI ÁO MƯA LÀ MỘT MÓN ĐỒ CÒN PHẢI VỀ — `LEND_ITEM` / `CLEAR_DEBT` (5 nhắc).
 *
 * *"Anh lấy cái áo mưa này của em đi anh. Em có hai cái."* — một câu nói ra con số kho
 * của chính nó, mà tới đợt này không có cái áo mưa nào tồn tại để mà cho. Và chưa ai viết
 * đường MANG TRẢ: cho mượn mà không có chiều về thì nó là `FREE_LOAF` đội lốt.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TalkStore } from "../src/content/talks";
import { walkNodes, needKeys, type TalkNode } from "../src/sim/talk";

const TALKS = await TalkStore.loadAll();
const actOf = (n: TalkNode) => (n.act as { kind?: string } | undefined)?.kind;

async function quay() {
  const w = newGame("coat", "p209");
  const bus = new Bus(false); const platform = memoryPlatform();
  for (let d = 1; d < 9; d++) nextDay(w, bus);
  const h = new HeadlessStall(w, POLICIES.greedy, { bus, platform });
  const svc = (h as unknown as { service: any }).service;
  for (let i = 0; i < 3000; i++) h.step(1000 / 30);
  return svc;
}

test("A-1 cho mượn thì KHO VƠI, mang trả thì về — và nó sống qua đêm", async () => {
  const svc = await quay();
  const ai = svc.customers.find((c: any) => c.npc) ?? svc.customers[0];
  assert.ok(ai, "không có ai ở quầy để thử");
  const bat = svc.coats;
  assert.equal(bat, 2, 'kho áo mưa phải khớp con số lời thoại nói ra — "em có hai cái"');

  (svc as any).lendItem(ai, "áo mưa");
  if (!ai.npc) { assert.equal(svc.coats, 2, "cho người LẠ mượn — `memKey` dùng chung, ghi nợ là ghi lên sổ người khác"); return; }
  assert.equal(svc.coats, 1, "cho mượn mà kho không vơi");
  assert.ok(svc.mem(ai.memKey).borrowed, "cho mượn mà sổ MÙA không ghi — mai họ trả thì lấy gì đối chiếu");

  (svc as any).lendItem(ai, "áo mưa");
  assert.equal(svc.coats, 1, "cho cùng một người mượn hai lần");

  (svc as any).clearDebt(ai);
  assert.equal(svc.coats, 2, "trả rồi mà kho không về");
  assert.equal(svc.mem(ai.memKey).borrowed, undefined);
});

test("A-2 cho mượn hết hai cái thì thôi — đó là cả cái giá", async () => {
  const svc = await quay();
  svc.coats = 0;
  const ai = svc.customers.find((c: any) => c.npc);
  if (!ai) return;
  (svc as any).lendItem(ai, "áo mưa");
  assert.equal(svc.mem(ai.memKey).borrowed, undefined, "hết áo mà vẫn cho mượn được");
});

test("A-3 câu cho mượn phải khoá CÒN ÁO và CHƯA AI MƯỢN", () => {
  let cho = 0;
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      const n = node as TalkNode;
      if (actOf(n) !== "LEND_ITEM") continue;
      cho++;
      const g = needKeys(n);
      assert.ok(g.some((k) => k.includes("p.coats")), `${t.id}: "${n.say}" — cho mượn một cái áo mình không có`);
      assert.ok(g.includes("!m.borrowing"), `${t.id}: "${n.say}" — cho mượn tiếp trong khi họ đang giữ một cái rồi`);
    }
  }
  assert.ok(cho >= 2, `mới ${cho} câu cho mượn mang act`);
});

test("A-4 CÓ ĐƯỜNG MANG TRẢ, và nó chỉ mở khi người ta thật sự đang giữ đồ", () => {
  let tra = 0;
  for (const t of TALKS) {
    let coTra = false;
    for (const { node } of walkNodes(t)) if (actOf(node as TalkNode) === "CLEAR_DEBT") { coTra = true; tra++; }
    if (!coTra) continue;
    assert.ok((t.when?.world ?? []).includes("m.borrowing"),
      `${t.id}: cuộc mang trả mà không khoá \`m.borrowing\` — họ mang trả một thứ chưa từng mượn`);
  }
  assert.ok(tra >= 4, `mới ${tra} nút mang trả — cho mượn mà không có chiều về thì là FREE_LOAF đội lốt`);
});
