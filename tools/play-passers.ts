/**
 * npx tsx tools/play-passers.ts [--day N] [--n N]
 *
 * ĐÓNG VAI NGƯỜI CHƠI: chạy một buổi bán, mỗi lần có người đi ngang thì bấm F và IN RA
 * ĐÚNG NHỮNG DÒNG HIỆN LÊN, kèm hoàn cảnh (họ đang đi đâu, đang thế nào, lò có nóng
 * không, còn mấy ổ).
 *
 * Có mặt vì `validate:talks` chỉ kiểm CẤU TRÚC — nó không biết một câu có ai nói ngoài
 * đời hay không. Chủ dự án bắt được bốn câu vô lý mà cả mười hai lưới đều cho qua
 * (*"Cô cần gì cứ nói con nghen"* với một người đang rảo bước). Thứ duy nhất bắt được
 * loại đó là ĐỌC, và muốn đọc thì phải in ra.
 */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TALK_NPC_IDS } from "../src/content/talks";
import { visibleOptions } from "../src/sim/talk";

const argN = (k: string, d: number) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? Number(process.argv[i + 1]) : d;
};
const DAY = argN("day", 5), WANT = argN("n", 14);

const w = newGame("play", "p209");
const bus = new Bus(false);
const platform = memoryPlatform();
for (let d = 1; d < DAY; d++) nextDay(w, bus);

const h = new HeadlessStall(w, POLICIES.greedy, { bus, platform });
const svc = (h as unknown as { service: any }).service;
/*
 * Bot headless không có lò và không cầm gì, nên `stock`/`playerHand`/`ovenBusy` ở mặc
 * định — và thế là mọi lời mời bị `!p.soldOut` loại hết, bản ghi ra toàn câu xã giao.
 * Người chơi thật thì đang đứng với một khay bánh. Đặt cho đúng cảnh đó.
 */
svc.stock = 12;
svc.ovenBusy = true;
svc.playerHand = "loaf_filled";
for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);

const seen = new Set<string>();
let shown = 0;
console.log(`\n════ NGÀY ${DAY} · bấm F với từng người đi ngang ════`);

for (let i = 0; i < 3200 && shown < WANT; i++) {
  h.step(1000 / 30);
  if (i % 5) continue;
  await Promise.resolve();
  for (const c of svc.customers) {
    if (!c.ambient || !c.pass || seen.has(c.id) || shown >= WANT) continue;
    const snap = svc.snapshot(c);
    const orig = svc.talkTarget.bind(svc);
    svc.talkTarget = () => c;
    const v = svc.openTalk();
    svc.talkTarget = orig;
    if (!v) continue;
    seen.add(c.id);
    shown++;
    const t = svc.talkSession.talk;
    const opts = visibleOptions(svc.talkSession.options, svc.talkGate());
    const hoanCanh = [
      c.purposeLabel || "(không rõ)",
      snap.them.glanced ? "đã dừng ngó" : "đi thẳng",
      snap.hot ? "nắng" : snap.rain ? "mưa" : "mát",
      snap.ovenHot ? "lò nóng" : "lò nguội",
      `còn ${snap.stock} ổ`,
    ].join(" · ");
    console.log(`\n[${shown}] ${c.name} — ${hoanCanh}`);
    console.log(`     cuộc: ${t.id}`);
    for (const o of opts) console.log(`       ${o.tone.padEnd(7)} ${svc.fill(c, o.say)}`);
    svc.closeTalk();
  }
}
h.close();
console.log(`\n— ${shown} lượt bấm F ·  ${new Set([...seen]).size} người khác nhau`);
