/**
 * CON BOT BIẾT RÓT TRÀ, MỜI NGỒI, MỜI GHÉ.
 *
 * *"viết bot biết rót trà, mời ngồi, cho mượn áo mưa đi"* — chủ dự án, sau khi tôi khai
 * rằng mấy fact `v.gaveTea` · `t.sitting` · `m.borrowing` đo ra 0% *"vì bot greedy chỉ biết
 * gói bánh"*. Khai như vậy là một lời bào chữa cho tới khi có cái máy chứng minh nó.
 *
 * Bot `social` đi qua ĐÚNG hai hàm `StallScene` gọi — `openTalk()` → `chooseTalk(i)` — và
 * chọn nhánh theo ACT. Không gọi tắt `service.serveTea()`: gọi tắt là đo cái hàm, không
 * đo cái game, và đó đúng là lỗi chủ dự án bắt được ở đợt đầu (*"bạn có thật sự test như
 * player không hay gọi fake code thế?"*).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TALK_NPC_IDS, TalkStore } from "../src/content/talks";
import { walkNodes } from "../src/sim/talk";
import { readFileSync } from "node:fs";

/** Chạy `n` buổi với bot xã giao, trả về act nào chạy bao nhiêu lần. */
async function chay(n: number, acts?: readonly string[]) {
  const w = newGame("botxg", "p210");
  const bus = new Bus(false);
  const platform = memoryPlatform();
  for (let d = 1; d < 5; d++) nextDay(w, bus);
  const dem = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const h = new HeadlessStall(w, { ...POLICIES.social, ...(acts ? { socialActs: acts } : {}) }, { bus, platform });
    const svc = (h as unknown as { service: any }).service;
    for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);
    const goc = svc.applyAct.bind(svc);
    svc.applyAct = (c: any, a: any, t: any) => { dem.set(a.kind, (dem.get(a.kind) ?? 0) + 1); return goc(c, a, t); };
    for (let f = 0; f < 140_000 && !h.closed; f++) h.step(1000 / 30);
    nextDay(w, bus);
  }
  return dem;
}

test("BX-1 bot `social` có trong bảng chính sách và khai đủ mấy núm xã giao", () => {
  const p = POLICIES.social;
  assert.ok(p, "không có chính sách `social`");
  assert.ok((p.socialRate ?? 0) > 0, "`socialRate` không bật thì bot không mở miệng");
  assert.ok(p.build?.some(([, id]) => id === "GHE_BAN"), "không mua ghế thì `THEY_SIT` vô phương");
  assert.ok(p.build?.some(([, id]) => id === "BINH_TRA"), "không mua bình trà thì `OFFER_TEA` vô phương");
});

test("BX-2 bot CHẠY ĐƯỢC mấy act xã giao mà bot cũ không bao giờ chạm tới", async () => {
  const dem = await chay(6);
  // `OFFER_TEA` là cái chủ dự án gọi tên đầu tiên — nó phải chạy, không phải "có thể chạy".
  assert.ok((dem.get("OFFER_TEA") ?? 0) > 0, "bot vẫn không rót trà lần nào");
  // Mời người đi ngang: cần bot biết BƯỚC RA ĐƯỜNG (`playerAt`), không chỉ đứng ở quầy.
  assert.ok((dem.get("INVITE") ?? 0) > 0, "bot không mời được ai — nó chưa bước ra đường");
  assert.ok((dem.get("WALK_ON") ?? 0) > 0, "không nhánh nào tiễn người đi ngang đi tiếp");
  const soAct = [...dem.keys()].length;
  assert.ok(soAct >= 8, `mới ${soAct} act chạy được — bot này đáng lẽ chạm được cả chục`);
});

test("BX-3 bot đi qua `openTalk`/`chooseTalk`, KHÔNG gọi tắt hàm hệ thống", () => {
  const src = readFileSync(new URL("../src/sim/headless.ts", import.meta.url), "utf8");
  const than = src.slice(src.indexOf("private socialise()"), src.indexOf("private act("));
  assert.match(than, /openTalk\(\)/, "bot không mở cuộc qua `openTalk`");
  assert.match(than, /chooseTalk\(/, "bot không chọn qua `chooseTalk`");
  for (const tat of ["serveTea(", "theySit(", "lendItem(", "standInShade("]) {
    assert.ok(!than.includes(tat), `bot gọi tắt \`${tat}\` — đo cái hàm chứ không đo cái game`);
  }
});

test("BX-4 danh sách săn XOAY VÒNG — act hiếm cũng tới lượt", () => {
  const src = readFileSync(new URL("../src/sim/headless.ts", import.meta.url), "utf8");
  assert.match(src, /this\.hunt % pool\.length/,
    "không xoay vòng thì bot bấm mãi cái act đầu tiên nó gặp");
});

test("BX-5 mọi act bot săn đều CÓ THẬT trong kho thoại", async () => {
  const TALKS = await TalkStore.loadAll();
  const co = new Set<string>();
  for (const t of TALKS) for (const { node } of walkNodes(t)) if (node.act) co.add(node.act.kind);
  const dem = await chay(2, ["OFFER_TEA", "THEY_SIT", "LEND_ITEM"]);
  for (const k of dem.keys()) {
    assert.ok(co.has(k), `bot chạy act \`${k}\` mà không nút nội dung nào gọi nó`);
  }
});
