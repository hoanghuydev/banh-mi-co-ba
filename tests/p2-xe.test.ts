import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CART_CHUNG, CART_LAN, CART_XA } from "../src/world/map";
import { TalkStore } from "../src/content/talks";
import { walkNodes, type TalkNode } from "../src/sim/talk";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";

const SRC = new URL("../src/sim/service.ts", import.meta.url);
const TALKS = await TalkStore.loadAll();

test("X-1 ba chỗ của cái xe là ba chỗ khác nhau", () => {
  assert.ok(Math.hypot(CART_XA.x - CART_LAN.x, CART_XA.y - CART_LAN.y) >= 3,
    "đẩy đi với lấn chỗ trông như một chỗ — người chơi không thấy mình vừa làm gì");
  assert.ok(Math.hypot(CART_CHUNG.x - CART_LAN.x, CART_CHUNG.y - CART_LAN.y) >= 1,
    "chung mái với lấn chỗ trùng nhau");
});

test("X-2 có cả hai nước đi: đuổi đi, và mời vô chung mái", () => {
  let xa = 0, chung = 0;
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      const a = (node as TalkNode).act as { kind?: string; toi?: string } | undefined;
      if (a?.kind !== "MOVE_CART") continue;
      if (a.toi === "XA") xa++;
      if (a.toi === "CHUNG") chung++;
    }
  }
  assert.ok(xa >= 5, `mới ${xa} câu đuổi xe mang act`);
  assert.ok(chung >= 2, `mới ${chung} câu mời chung mái — mất hẳn nước đi hào phóng`);
});

test("X-3 mọi câu dời xe đều khoá `w.cartLan` — không dời một cái xe không có ở đó", () => {
  const hong: string[] = [];
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      const n = node as TalkNode;
      if ((n.act as { kind?: string } | undefined)?.kind !== "MOVE_CART") continue;
      if (!(n.while ?? []).some((g) => g.includes("cartLan"))) hong.push(`${t.id}: "${n.say}"`);
    }
  }
  assert.deepEqual(hong, []);
});

test("X-4 xe lấn ăn bớt khách LẠ, không đụng người có tên", async () => {
  const src = await readFile(SRC, "utf8");
  assert.match(src, /KIET_STEAL/, "không có hằng số nào cho việc ăn bớt khách");
  assert.match(src, /this\.cart === "LAN" && !npc/, "xe lấn ăn cả khách có tên — sai");
  assert.match(src, /derive\(`kiet:\$\{v\.seq\}`\)/, "rút ké dòng số của `balk:` — sẽ lệch pha golden");
});

test("X-5 MỌI act có trong nội dung đều có nhánh trong `applyAct` — không act nào chạy không tải", async () => {
  const src = await readFile(SRC, "utf8");
  const dung = new Set<string>();
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      const k = ((node as TalkNode).act as { kind?: string } | undefined)?.kind;
      if (k) dung.add(k);
    }
  }
  const thieu = [...dung].filter((k) => !src.includes(`case "${k}":`));
  assert.deepEqual(thieu, [],
    `act có trong nội dung mà applyAct không nối: ${thieu.join(", ")} — lời nói miễn phí, và nó IM LẶNG`);
  assert.match(src, /assertActHandled\(act\)/,
    "không còn `never` chặn ở `default` — thêm một `kind` mà quên nối sẽ lại im lặng");
});

async function buoiBan(dayXe: boolean) {
  const w = newGame("xe-test", "p209");
  const bus = new Bus(false); const platform = memoryPlatform();
  // Ngày 17 của seed này có cả chú Đạt lẫn dì Liên theo `rollVisit`.
  for (let d = 1; d < 17; d++) nextDay(w);
  const h = new HeadlessStall(w, POLICIES.greedy, { bus, platform });
  const svc = (h as unknown as { service: any }).service;
  let mat = 0;
  const orig = svc.out.push.bind(svc.out);
  svc.out.push = (o: any) => { if (o?.text?.includes("ghé xe chú Đạt")) mat++; return orig(o); };
  for (let i = 0; i < 60000; i++) {
    h.step(1000 / 30);
    if (i % 31) continue;
    if (dayXe && svc.cart === "LAN") svc.cart = "XA";
  }
  return { mat, cart: svc.cart as string | null, ganh: svc.ganh as string | null };
}

test("X-6 để yên xe chú lấn thì MẤT KHÁCH THẬT; đẩy đi thì hết", async () => {
  const deYen = await buoiBan(false);
  assert.equal(deYen.cart, "LAN", "cả buổi mà cái xe không bao giờ lấn — điều kiện đặt sai");
  assert.ok(deYen.mat > 0, "xe lấn suốt buổi mà không mất một khách nào — vậy đuổi nó làm gì");

  const dayDi = await buoiBan(true);
  assert.equal(dayDi.cart, "XA");
  assert.equal(dayDi.mat, 0, "đẩy xe đi rồi mà vẫn mất khách");
});

test("X-7 cái gánh cũng có mặt thật trong một buổi bán", async () => {
  const r = await buoiBan(true);
  assert.equal(r.ganh, "NGOAI",
    "cả buổi mà cái gánh không bao giờ xuất hiện — cùng loại lỗi `pass` của cái xe");
});
