/**
 * XẾP ACT THEO ĐỘ HIẾM — và nói mỗi act đó là CẢNH GÌ.
 *
 * Chủ dự án: *"hiếm thì cũng được nhưng sắp xếp theo độ hiếm đi. Cho một số xuất hiện
 * thường xuyên hơn tý."* Muốn chỉnh thì trước hết phải NHÌN THẤY cái thang, chứ không
 * phải một đống số rời.
 *
 * ⚠️ `weight` của một cuộc KHÔNG phải cái cần vặn: `pickTalk` dùng `c.score` khi `Service`
 * đưa vào, nên `t.weight` chỉ còn tác dụng ở test và công cụ. Núm thật là `initiates`
 * (xác suất chính họ mở lời) và trần `TALK_OFFERS_PER_DAY` — mỗi buổi CẢ HẺM chỉ có ngần
 * ấy lượt người ta tự bắt chuyện, nên nâng `initiates` của một cuộc là lấy chỗ của cuộc
 * khác, không phải thêm chỗ.
 */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TALK_NPC_IDS, TalkStore } from "../src/content/talks";
import { walkNodes, type Talk } from "../src/sim/talk";

const argN = (k: string, d: number) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? Number(process.argv[i + 1]) : d; };
const NGAY = argN("days", 20);

const TALKS: Talk[] = await TalkStore.loadAll();
const canh = new Map<string, string[]>();
for (const t of TALKS) {
  for (const { node } of walkNodes(t)) {
    if (!node.act) continue;
    const l = canh.get(node.act.kind) ?? [];
    if (!l.includes(t.id)) l.push(t.id);
    canh.set(node.act.kind, l);
  }
}

const dem = new Map<string, number>();
const w = newGame("rank", "p210");
const bus = new Bus(false);
const platform = memoryPlatform();
for (let d = 1; d < 5; d++) nextDay(w, bus);
const pol = { ...POLICIES.social, socialActs: [...canh.keys()].sort() };
for (let i = 0; i < NGAY; i++) {
  const h = new HeadlessStall(w, pol, { bus, platform });
  const svc = (h as unknown as { service: any }).service;
  for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);
  const goc = svc.applyAct.bind(svc);
  svc.applyAct = (c: any, a: any, t: any) => { dem.set(a.kind, (dem.get(a.kind) ?? 0) + 1); return goc(c, a, t); };
  for (let f = 0; f < 140_000 && !h.closed; f++) h.step(1000 / 30);
  nextDay(w, bus);
}

const BAC = (n: number) =>
  n === 0 ? "KHÔNG GẶP" : n / NGAY >= 1 ? "mỗi buổi" : n / NGAY >= 0.3 ? "vài bữa một lần" : n >= 3 ? "dăm lần một mùa" : "cả mùa một hai lần";

console.log(`\n${NGAY} buổi · xếp theo độ hiếm (dày → thưa)\n`);
const rows = [...canh.keys()].map((k) => [k, dem.get(k) ?? 0] as const).sort((a, b) => b[1] - a[1]);
for (const [k, n] of rows) {
  console.log(`  ${k.padEnd(16)} ${String(n).padStart(4)}  ${BAC(n).padEnd(20)} ${(canh.get(k) ?? []).slice(0, 3).join(", ")}`);
}
