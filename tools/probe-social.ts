/**
 * BOT XÃ GIAO CÓ THẬT SỰ RÓT TRÀ, MỜI NGỒI, CHO MƯỢN ÁO MƯA KHÔNG.
 *
 * `tools/probe-facts.ts` đo ra `v.gaveTea` 0% · `t.sitting` 0% · `t.filming` 0% ·
 * `m.borrowing` 0% · `w.cartChung` 0%, và tôi đã khai mấy dòng đó là "không đo được, vì
 * bot `greedy` chỉ biết gói bánh". Chủ dự án: *"viết bot biết rót trà, mời ngồi, cho mượn
 * áo mưa đi"*. Đây là cái máy trả lời câu đó.
 *
 * Bot đi qua ĐÚNG hai hàm `StallScene` gọi (`openTalk` → `chooseTalk`), không gọi tắt
 * `service.serveTea()`: gọi tắt là đo cái hàm, không đo cái game.
 *
 * In ra: act nào CHẠY được bao nhiêu lần, và act nào vẫn ĐỨNG YÊN — vì sau đợt này,
 * "0 lần" mới thật sự có nghĩa là một nhánh nội dung không với tới được.
 */
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
/** Mọi act NỘI DUNG có gọi tới — act không có trong đây thì không trách bot được. */
const CO_TRONG_KHO = new Set<string>();
for (const t of TALKS) for (const { node } of walkNodes(t)) if (node.act) CO_TRONG_KHO.add(node.act.kind);

const chay = new Map<string, number>();
const troi = new Set<string>();
let moCuoc = 0, nhip = 0, ban = 0;

const w = newGame("social", "p210");
const bus = new Bus(false);
const platform = memoryPlatform();
for (let d = 1; d < 5; d++) nextDay(w, bus);

for (let ngay = 0; ngay < NGAY; ngay++) {
  /** Săn XOAY VÒNG qua mọi act nội dung có gọi — không có cái này thì act hiếm không tới lượt. */
  const pol = { ...POLICIES.social, socialActs: [...CO_TRONG_KHO].sort() };
  const h = new HeadlessStall(w, pol, { bus, platform });
  const svc = (h as unknown as { service: any }).service;
  for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);

  // Đếm ở CHÍNH `applyAct` — chỗ act biến thành hệ quả. Đếm ở chỗ bấm thì đếm cả cú bấm hụt.
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
  nextDay(w, bus);
}

console.log(`\nbot \`social\` · ${NGAY} buổi · mở ${moCuoc} cuộc · ${nhip} nhịp · bán ${ban} ổ\n`);
const tat = [...CO_TRONG_KHO].filter((k) => !chay.has(k)).sort();
for (const [k, n] of [...chay].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(16)} ${String(n).padStart(4)} lần`);
}
/*
 * ⚠️ BẢNG NÀY PHẢI TỰ KHAI NÓ KHÔNG ĐO ĐƯỢC CÁI GÌ — quy tắc rút ra sau ba đợt liền khai
 * sai vì một phép đo im lặng. Một act "đứng yên" có thể là nhánh chết, mà cũng có thể chỉ
 * là ván chơi này không có điều kiện cho nó.
 */
console.log(`\nVẪN ĐỨNG YÊN (${tat.length}/${CO_TRONG_KHO.size} act nội dung có gọi):`);
for (const k of tat) console.log(`  ${k}`);
console.log("\nĐiều kiện ván chơi này CÓ hay KHÔNG — đọc cột trên với mấy dòng này:");
// ⚠️ Hỏi `isRain` chứ đừng so chuỗi: mưa có HAI tên (`MUA_RAO`, `MUA_DAM`), và bản đầu
// của chính dòng này so với "MUA" nên in ra "không có ngày mưa" giữa một mùa có mưa.
const coMua = [...troi].some((x) => isRain(x as never));
console.log(`  thời tiết gặp: ${[...troi].join(", ")}${coMua ? "" : "  ← KHÔNG có ngày mưa: arc áo mưa (LEND_ITEM/CLEAR_DEBT) không có cửa"}`);
console.log(`  đồ nghề cuối mùa: ${w.equipment.owned.join(", ") || "(không mua được gì)"}`);
console.log("  act dính một NGƯỜI cụ thể (RAO·MOVE_GANH·BARTER của bà Sáu, OVERHEARD_BY của anh Dũng)");
console.log("  chỉ chạy khi đúng người đó có mặt VÀ đúng cuộc đó được rút — số buổi càng ít càng khó gặp.");
