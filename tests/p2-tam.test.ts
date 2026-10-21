/**
 * HAI NGƯỜI ĐI NGANG ĐỨNG TÁM CHUYỆN — lâu lâu mới có, người chơi không cần tương tác.
 *
 * Ba thứ phải đúng:
 *   1. họ ĐỨNG THẬT (đi ngang mà nói thì sai logic),
 *   2. cảnh luân phiên A → B → A → B chứ không phải một người độc thoại,
 *   3. không cảnh nào lôi cái xe bánh mì vô: người ta không đứng giữa đường nói chuyện
 *      của mình, và người chơi KHÔNG cần xen vào.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import TAM from "../src/content/lines/tam.json";

const CANH: string[][] = TAM.canh;

test("TAM-1 cảnh nào cũng ít nhất 3 câu và luân phiên hai người", () => {
  assert.ok(CANH.length >= 6, `mới ${CANH.length} cảnh — ít quá, chơi vài ngày là nghe lại`);
  for (const [i, c] of CANH.entries()) {
    assert.ok(c.length >= 3, `cảnh ${i} chỉ ${c.length} câu — hai câu là CHÀO, không phải tám`);
    assert.equal(c.length % 2, 0, `cảnh ${i} lẻ câu: người nói trước bị bỏ lửng`);
    for (const d of c) assert.ok(d.trim().length > 6, `cảnh ${i} có câu rỗng`);
  }
});

test("TAM-2 không cảnh nào nói về cái xe của mình", () => {
  const cam = /bánh mì|xe mình|quán|ổ bánh/i;
  for (const [i, c] of CANH.entries())
    for (const d of c)
      assert.ok(!cam.test(d), `cảnh ${i} lôi cái xe vô: ${JSON.stringify(d)} — người chơi không cần xen vào cảnh này`);
});

test("TAM-3 các cảnh không trùng nhau", () => {
  const seen = new Set<string>();
  for (const c of CANH) {
    const k = c[0];
    assert.ok(!seen.has(k), `hai cảnh mở bằng cùng một câu: ${k}`);
    seen.add(k);
  }
});

test("TAM-4 đứng tám thì ĐỨNG THẬT, và nói đủ cảnh", () => {
  const w = newGame("tam", "p210");
  const bus = new Bus(false); const platform = memoryPlatform();
  const h = new HeadlessStall(w, POLICIES.greedy, { bus, platform });
  const svc = (h as unknown as { service: any }).service;

  /** Gọi thẳng cảnh trên hai người đi ngang có thật, rồi đo xem họ có nhúc nhích không. */
  let a: any = null, b: any = null;
  for (let i = 0; i < 40000 && !b; i++) {
    h.step(1000 / 30);
    const amb = svc.customers.filter((c: any) => c.ambient && c.pass && !c.speaking);
    if (amb.length >= 2) { [a, b] = amb; }
  }
  assert.ok(b, "cả buổi không có lúc nào hai người cùng đi ngang");

  b.x = a.x + 0.6; b.y = a.y;              // họ phải đứng cạnh nhau mới tám được — xem TAM-4b
  const x0 = a.x, y0 = a.y, x1 = b.x, y1 = b.y;
  svc.chatScene(a, b, "test|test");
  const noi = svc.queue.filter((q: any) => q.c === a || q.c === b).length;
  assert.ok(noi >= 3, `cảnh chỉ xếp ${noi} câu`);
  // luân phiên: cả hai người đều phải có phần
  assert.ok(svc.queue.some((q: any) => q.c === a) && svc.queue.some((q: any) => q.c === b),
    "một mình một người độc thoại chứ không phải tám chuyện");

  for (let i = 0; i < 90; i++) h.step(1000 / 30);   // 3 giây
  assert.ok(Math.hypot(a.x - x0, a.y - y0) < 0.35, `người thứ nhất vẫn đi tiếp trong lúc nói (${Math.hypot(a.x - x0, a.y - y0).toFixed(2)} ô)`);
  assert.ok(Math.hypot(b.x - x1, b.y - y1) < 0.35, `người thứ hai vẫn đi tiếp trong lúc nói`);
});

test("TAM-4b hai người ở hai đầu hẻm thì KHÔNG tám — bong bóng hét qua đường", () => {
  // Ép một cặp cách nhau mười bốn ô: không được ra cảnh.
  const w = newGame("tamxa", "p210");
  const bus = new Bus(false);
  const h = new HeadlessStall(w, POLICIES.greedy, { bus, platform: memoryPlatform() });
  const svc = (h as unknown as { service: any }).service;
  let a: any = null, b: any = null;
  for (let i = 0; i < 40000 && !b; i++) {
    h.step(1000 / 30);
    const amb = svc.customers.filter((c: any) => c.ambient && c.pass && !c.speaking);
    if (amb.length >= 2) { [a, b] = amb; }
  }
  assert.ok(b, "cả buổi không có lúc nào hai người cùng đi ngang");
  b.x = a.x + 14;
  svc.chatScene(a, b, "xa|xa");
  assert.equal(svc.queue.filter((q: any) => q.c === a || q.c === b).length, 0,
    "hai người cách nhau mười bốn ô mà vẫn tám chuyện");
});

test("TAM-5 cảnh nổ ra LÂU LÂU: vài buổi có, mà không buổi nào đứng đầy đường", () => {
  // Một buổi lẻ có thể trắng — đó đúng là "lâu lâu". Đo trên sáu buổi mới nói được gì.
  let canh = 0;
  for (let d = 0; d < 6; d++) {
    const w = newGame(`tam${d}`, "p210");
    const bus = new Bus(false);
    for (let k = 0; k < d; k++) nextDay(w);
    const h = new HeadlessStall(w, POLICIES.greedy, { bus, platform: memoryPlatform() });
    const svc = (h as unknown as { service: any }).service;
    const goc = svc.chatScene.bind(svc);
    svc.chatScene = (...args: any[]) => { canh++; return goc(...args); };
    for (let i = 0; i < 120000; i++) h.step(1000 / 30);
  }
  assert.ok(canh > 0, "sáu buổi không một cảnh nào — `CHAT_SCENE_CHANCE` hay cái gác hàng đợi đang khoá chết nó");
  assert.ok(canh <= 18, `${canh} cảnh / 6 buổi — nhiều quá, hẻm thành cái chợ đứng tám`);
});
