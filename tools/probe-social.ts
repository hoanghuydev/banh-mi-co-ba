// Bot xã giao chạy qua `openTalk` → `chooseTalk`, in act nào chạy bao nhiêu lần, act nào đứng yên.
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TALK_NPC_IDS } from "../src/content/talks";
import { walkNodes, type Talk } from "../src/sim/talk";
import { TalkStore } from "../src/content/talks";
import { isRain } from "../src/sim/econ";

const argN = (k: string, d: number) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? Number(process.argv[i + 1]) : d; };
const NGAY = argN("days", 8);

const TALKS: Talk[] = await TalkStore.loadAll();
const CO_TRONG_KHO = new Set<string>();
for (const t of TALKS) for (const { node } of walkNodes(t)) if (node.act) CO_TRONG_KHO.add(node.act.kind);

const chay = new Map<string, number>();
const troi = new Set<string>();
let moCuoc = 0, nhip = 0, ban = 0;

const w = newGame("social", "p210");
const bus = new Bus(false);
const platform = memoryPlatform();
for (let d = 1; d < 5; d++) nextDay(w);

for (let ngay = 0; ngay < NGAY; ngay++) {
  // Xoay vòng mọi act để act hiếm cũng tới lượt.
  const pol = { ...POLICIES.social, socialActs: [...CO_TRONG_KHO].sort() };
  const h = new HeadlessStall(w, pol, { bus, platform });
  const svc = (h as unknown as { service: any }).service;
  for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);

  // Đếm ở `applyAct` để không tính cú bấm hụt.
  const goc = svc.applyAct.bind(svc);
  svc.applyAct = (c: any, act: any, tone: any) => {
    chay.set(act.kind, (chay.get(act.kind) ?? 0) + 1);
    return goc(c, act, tone);
  };
  const moGoc = svc.openTalk.bind(svc);
  svc.openTalk = () => { const r = moGoc(); if (r) moCuoc++; return r; };
  const chonGoc = svc.chooseTalk.bind(svc);
  svc.chooseTalk = (i: number) => { nhip++; return chonGoc(i); };

  for (let i = 0; i < 140_000 && !h.closed; i++) h.step(1000 / 30);
  ban += w.progress.today.served;
  troi.add(w.progress.weather);
  nextDay(w);
}

console.log(`\nbot \`social\` · ${NGAY} buổi · mở ${moCuoc} cuộc · ${nhip} nhịp · bán ${ban} ổ\n`);
const tat = [...CO_TRONG_KHO].filter((k) => !chay.has(k)).sort();
for (const [k, n] of [...chay].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(16)} ${String(n).padStart(4)} lần`);
}
console.log(`\nVẪN ĐỨNG YÊN (${tat.length}/${CO_TRONG_KHO.size} act nội dung có gọi):`);
for (const k of tat) console.log(`  ${k}`);
console.log("\nĐiều kiện ván chơi này CÓ hay KHÔNG — đọc cột trên với mấy dòng này:");
const coMua = [...troi].some((x) => isRain(x as never));
console.log(`  thời tiết gặp: ${[...troi].join(", ")}${coMua ? "" : "  ← KHÔNG có ngày mưa"}`);
console.log(`  đồ nghề cuối ván: ${w.equipment.owned.join(", ") || "(không mua được gì)"}`);
console.log("  act dính một NGƯỜI cụ thể (RAO·MOVE_GANH·BARTER của bà Sáu, OVERHEARD_BY của anh Dũng)");
console.log("  chỉ chạy khi đúng người đó có mặt VÀ đúng cuộc đó được rút — số buổi càng ít càng khó gặp.");
