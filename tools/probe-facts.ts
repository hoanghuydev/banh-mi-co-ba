/**
 * npx tsx tools/probe-facts.ts [--pool WALKIN|QUA_DUONG] [--days N]
 *
 * LÚC BẤM F, SỰ THẬT NÀO ĐANG ĐÚNG — và đúng bao nhiêu phần trăm.
 *
 * Có mặt vì viết cổng mà không biết tần suất là viết mò, và viết mò ra đúng một kiểu
 * hỏng: câu hay thì khoá chặt tới mức không bao giờ hiện, câu nhạt thì để trần nên luôn
 * hiện. Đo được trên `walkin.cay`: hai câu hay khoá `!t.hasOrder` (đúng 8%) cộng
 * `practice: NAN_LAI` (8%) ⇒ cả mùa không chạy lần nào, còn hai câu luôn hiện thì cụt.
 *
 * Quy tắc rút ra, và cổng `validate:talks` T013 giữ nó: **câu luôn hiện phải có nhánh;
 * câu cụt phải là câu KẾT hoặc phải có khoá.**
 *
 * ⚠️ BẢNG NÀY ĐO "MỘT KHOẢNH KHẮC BẤT KỲ", KHÔNG PHẢI "MỘT CUỘC BẤT KỲ". Mỗi mẫu là một
 * người × một lát cắt thời gian, nên khúc vắng khách kéo dài ăn hết trọng số: `w.band(TRUA)`
 * ra 92% không phải vì phần lớn CUỘC xảy ra lúc trưa, mà vì phần lớn PHÚT của buổi nằm ở
 * đó. Dùng nó để trả lời "khoá này có bao giờ đúng không", đừng dùng để trả lời "bao nhiêu
 * phần trăm cuộc rơi vào khung này".
 */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TALK_NPC_IDS } from "../src/content/talks";
import { gateHolds } from "../src/dialog/gates";
import { queryOf } from "../src/sim/worldfacts";
import blackboard from "../src/content/rules/_blackboard.json";

const argN = (k: string, d: number) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? Number(process.argv[i + 1]) : d; };
const argS = (k: string, d: string) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? String(process.argv[i + 1]) : d; };
const POOL = argS("pool", "WALKIN"), DAYS = argN("days", 4);
/** `--bot social` = con bot BIẾT rót trà / mời ngồi / mời ghé. Mặc định `greedy` chỉ biết gói bánh. */
const BOT = argS("bot", "greedy");

/**
 * ⚠️ TÁCH HAI CHUYỆN. Mười bảy khoá trong bảng đen ĐÒI THAM SỐ (`w.queue(2)`, `t.tier(FRIEND)`
 * …): hỏi chúng trần thì bao giờ cũng sai, và bản trước in cả mười bảy vào cột "KHÔNG BAO
 * GIỜ ĐÚNG". Mười bảy dòng nhiễu nằm lẫn với mấy dòng NÓI THẬT là cách một bảng đo biến
 * thành một tờ giấy chứng nhận sạch — đã bị đúng một lần ở `audit-loi.ts`.
 *
 * Giờ chúng đi riêng xuống mục "cần tham số", và cột không-bao-giờ-đúng chỉ còn khoá
 * BOOLEAN thật.
 */
const CAN_THAM_SO = new Set(
  Object.entries((blackboard as { aliases: Record<string, unknown> }).aliases)
    .filter(([, v]) => JSON.stringify(v).includes("$"))
    .map(([k]) => k),
);
const PROBES: string[] = [];
for (const name of Object.keys((blackboard as { aliases: Record<string, unknown> }).aliases)) {
  if (/^(t|p|w|c|v|d|m)\./.test(name) && !CAN_THAM_SO.has(name)) PROBES.push(name);
}
const EXTRA = ["t.practice(GOI_MON)", "t.practice(XEP_HANG)", "t.practice(QUAY_VANG)", "t.practice(NAN_LAI)",
  "w.queue(1)", "w.queue(2)", "w.band(SOM)", "w.band(TRUA)", "p.stockAtLeast(3)", "w.day(10)", "m.visits(2)"];

const w = newGame("facts", "p209");
const bus = new Bus(false); const platform = memoryPlatform();
for (let d = 1; d < 5; d++) nextDay(w, bus);
const hit = new Map<string, number>(); let n = 0;
for (let day = 0; day < DAYS; day++) {
  const h = new HeadlessStall(w, POLICIES[BOT] ?? POLICIES.greedy, { bus, platform });
  const svc = (h as unknown as { service: any }).service;
  /*
   * ⚠️ BA THỨ ÉP TAY — và phải đọc bảng kết quả với cái này trong đầu. Bot `greedy` không
   * bao giờ nhen lò (đo: 0 mẻ ra lò / 120.000 frame), nên mọi fact dính cái lò sẽ ra 0%
   * nếu không ép. Ép `ovenBusy` làm `w.ovenHot` ra **100%** — con số đó là của CÁI ÉP,
   * không phải của ván chơi thật. `w.meVuaRa` thì vẫn 0% vì `lastBatchOutAt` không ai
   * đụng tới: fact nào cần MỘT SỰ KIỆN xảy ra thì cái bot này không đo được, và nói
   * "không bao giờ đúng" về chúng là nói sai.
   */
  svc.stock = 12; svc.ovenBusy = true; svc.playerHand = "loaf_filled";
  for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);
  /*
   * ⚠️ PHẢI CHẠY HẾT BUỔI. Bản trước dừng ở 9.000 frame = 8h42, tức KHÔNG BAO GIỜ tới
   * khung `TRUA` (từ 9h30), nên `w.band(TRUA)` in ra "không bao giờ đúng" — trong khi nó
   * đúng suốt khúc 9h30–11h00 của mọi buổi. Lại một con số sai vì phép đo ngắn hơn cái
   * được đo. Chạy tới khi hết ngày.
   */
  for (let i = 0; i < 140_000; i++) {
    h.step(1000 / 30);
    if (i % 11) continue;
    await Promise.resolve();
    for (const c of svc.customers) {
      const isAmb = !!c.ambient;
      if (POOL === "WALKIN" && (isAmb || (c.npcId && TALK_NPC_IDS.includes(c.npcId)))) continue;
      if (POOL === "QUA_DUONG" && !isAmb) continue;
      n++;
      const q = queryOf(svc.snapshot(c));
      for (const k of [...PROBES, ...EXTRA]) {
        let ok = false;
        try { ok = gateHolds(k, q); } catch { continue; }
        if (ok) hit.set(k, (hit.get(k) ?? 0) + 1);
      }
    }
  }
  nextDay(w, bus);
}
console.log(`\n${POOL} · bot \`${BOT}\` · ${n} mẫu lúc bấm F · tần suất sự thật\n`);
console.log(`  (${CAN_THAM_SO.size} khoá đòi tham số nên không hỏi trần được: ${[...CAN_THAM_SO].join(", ")})\n`);
const rows = [...PROBES, ...EXTRA].map((k) => [k, (hit.get(k) ?? 0) / n] as const).sort((a, b) => b[1] - a[1]);
for (const [k, r] of rows) {
  const bar = "█".repeat(Math.round(r * 30));
  /** ⚠️ "không bao giờ đúng" chỉ đúng với fact bot này CHẠM TỚI — xem khối ép tay ở trên. */
  const flag = r === 0 ? `  ← KHÔNG BAO GIỜ ĐÚNG (bot \`${BOT}\`)` : r < 0.03 ? "  ← gần như không" : "";
  console.log(`  ${k.padEnd(22)} ${(100 * r).toFixed(0).padStart(3)}%  ${bar}${flag}`);
}
