/**
 * npx tsx tools/play-deep.ts [--day N] [--n N] [--pool QUA_DUONG|WALKIN|ALL]
 *
 * ĐÓNG VAI NGƯỜI CHƠI CHO TỚI HẾT CUỘC — không dừng ở nhịp đầu.
 *
 * `play-passers.ts` chỉ in NHỊP ĐẦU. Mà chỗ hỏng không nằm ở nhịp đầu: nó nằm ở chỗ
 * bấm xong một câu thì cuộc TẮT. Chủ dự án chơi thật rồi nói *"sao cái của tôi nó trả
 * lời ngu lắm"* — đo trong trình duyệt ra 8/9 cuộc dài đúng MỘT nhịp. Không công cụ nào
 * trước đó nhìn thấy, vì không công cụ nào bấm tới nhịp hai.
 *
 * Đi đúng đường cú bấm F đi: `service.openTalk()` → `service.chooseTalk(i)`, y hệt
 * `StallScene.askFront()` / `pickTalk()`. Khác bản chơi tay đúng hai chỗ: không có
 * Phaser vẽ, và chọn ngẫu nhiên thay vì cân nhắc.
 */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TALK_NPC_IDS } from "../src/content/talks";

/** 12 người CÓ TÊN — `TALK_NPC_IDS` gồm cả `WALKIN`/`QUA_DUONG`/`ANY` nên không dùng thẳng được. */
const NAMED_IDS = TALK_NPC_IDS.filter((k) => !["WALKIN", "QUA_DUONG", "ANY"].includes(k));

const argN = (k: string, d: number) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? Number(process.argv[i + 1]) : d;
};
const argS = (k: string, d: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? String(process.argv[i + 1]) : d;
};
const DAY = argN("day", 5), WANT = argN("n", 20), POOL = argS("pool", "ALL"), DAYS = argN("days", 1);
const QUIET = process.argv.includes("--quiet");
/*
 * `--engaged`: NGƯỜI CHƠI MUỐN NÓI CHUYỆN thì không bấm vào đường ra.
 *
 * Mặc định bot bấm ngẫu nhiên đều, nên nó chọn đúng câu "Thôi, hổng có gì" khoảng một
 * phần ba số lần — và mỗi lần như vậy cuộc dừng ở nhịp một vì ĐÓ LÀ VIỆC câu đó làm.
 * Đếm chung vào "cuộc chết sau một nhịp" là đổ lỗi cho nội dung một chuyện do cách đo.
 * Chế độ này bỏ qua `LANH`/`IM`/`GAT` khi còn dòng khác — đo ĐỘ SÂU có thật của cây.
 */
const ENGAGED = process.argv.includes("--engaged");
const EXITS = new Set(["LANH", "IM", "GAT"]);

const w = newGame("deep", "p209");
const bus = new Bus(false);
const platform = memoryPlatform();
for (let d = 1; d < DAY; d++) nextDay(w, bus);

let h!: HeadlessStall, svc: any;
async function openStall() {
  h = new HeadlessStall(w, POLICIES.greedy, { bus, platform });
  svc = (h as unknown as { service: any }).service;
  svc.stock = 12;
  svc.ovenBusy = true;
  svc.playerHand = "loaf_filled";
  for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);
}
await openStall();

// Một dòng số riêng cho việc CHỌN, để không đụng vào dòng chung của spawn.
let seed = 0x9e3779b9;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000);

const seen = new Set<string>();
let shown = 0;
const lens: number[] = [];
const byTalk = new Map<string, { n: number; beats: number }>();
const byBag = new Map<string, number>();

for (let day = 0; day < DAYS && shown < WANT; day++) {
 if (day) { nextDay(w, bus); await openStall(); }
 for (let i = 0; i < 60000 && shown < WANT; i++) {
  h.step(1000 / 30);
  if (i % 3) continue;
  await Promise.resolve();
  for (const c of svc.customers) {
    if (seen.has(c.id) || shown >= WANT) continue;
    /*
     * BẮT CHUYỆN Ở MỘT LÚC NGẪU NHIÊN TRONG LƯỢT GHÉ, không phải ở frame đầu tiên.
     *
     * Bản đầu mở cuộc ngay lần đầu thấy người đó — tức là luôn ở `phase: "arriving"`.
     * Thế là `t.served` (28% ngoài đời) và `w.queue(1)` (54%) không bao giờ đúng, và hai
     * cuộc viết cho đúng hai lúc đó báo "không chạy lần nào" — một kết luận SAI do công
     * cụ đo chứ không do nội dung. Người chơi thật bấm F rải ra cả lượt ghé.
     */
    if (rnd() > 0.05) continue;
    const pool = c.ambient ? "QUA_DUONG" : (svc.talkKey(c) as string);
    if (POOL !== "ALL" && POOL !== pool && !(POOL === "NAMED" && NAMED_IDS.includes(pool))) continue;
    const orig = svc.talkTarget.bind(svc);
    svc.talkTarget = () => c;
    const v = svc.openTalk();
    if (!v) { svc.talkTarget = orig; continue; }
    seen.add(c.id); shown++;
    const tid = svc.talkSession.talk.id as string;
    const out: string[] = [];
    out.push(`\n[${shown}] ${c.name} · ${pool} · ${tid}  ${c.purposeLabel ?? ""}`);
    if (v.line) out.push(`  HỌ : “${v.line}”`);
    let view = v, beats = 0;
    while (view && view.options.length && beats < 8) {
      const pool = ENGAGED
        ? view.options.map((o: any, i: number) => [o, i] as const).filter(([o]: readonly [any, number]) => !EXITS.has(o.tone))
        : view.options.map((o: any, i: number) => [o, i] as const);
      const k = (pool.length ? pool : view.options.map((o: any, i: number) => [o, i] as const))[
        Math.floor(rnd() * (pool.length || view.options.length))][1];
      const say = view.options[k].say;
      const nx = svc.chooseTalk(k);
      beats++;
      out.push(`  TÔI: “${say}”`);
      out.push(`  HỌ : ${nx && nx.line ? `“${nx.line}”` : nx && nx.silent ? "(im lặng)" : "(hết)"}`);
      if (!nx || nx.done) break;
      view = nx;
    }
    if (svc.talkOpen) svc.closeTalk();
    svc.talkTarget = orig;
    lens.push(beats);
    const b = byTalk.get(tid) ?? { n: 0, beats: 0 };
    b.n++; b.beats += beats; byTalk.set(tid, b);
    const bag = tid.split(".")[0];
    byBag.set(bag, (byBag.get(bag) ?? 0) + 1);
    if (!QUIET) console.log(out.join("\n"));
  }
 }
}

const one = lens.filter((x) => x <= 1).length;
console.log(`\n──────── ${lens.length} cuộc ────────`);
console.log(`  dài trung bình : ${(lens.reduce((a, b) => a + b, 0) / Math.max(lens.length, 1)).toFixed(2)} nhịp`);
console.log(`  chỉ MỘT nhịp   : ${one}/${lens.length}  (${Math.round(100 * one / Math.max(lens.length, 1))}%)`);
console.log(`  phân bố        : ${[1, 2, 3, 4, 5].map((k) => `${k}:${lens.filter((x) => x === k).length}`).join("  ")}`);
console.log(`\n  theo TÚI    : ${[...byBag].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join("  ")}`);
console.log(`\n  theo cuộc:`);
for (const [k, v] of [...byTalk].sort((a, b) => b[1].n - a[1].n)) {
  console.log(`    ${k.padEnd(24)} ${String(v.n).padStart(3)} lần · ${(v.beats / v.n).toFixed(2)} nhịp`);
}
