/**
 * PHÂN BỐ ĐIỂM CHỌN CHUYỆN, chia theo KHUNG CẢNH.
 *
 * `tools/tune-drives.ts` cho thấy ba núm của `sim/drives.ts` quét 8× mà KHÔNG đổi một con
 * số nào. Lý do phải đo chứ không đoán: cái duy nhất so điểm với một mốc TUYỆT ĐỐI là
 * `TALK_SCORE_FLOOR`, và nếu không cuộc nào rơi xuống dưới nó thì `ATT_K` chỉ là một phép
 * nhân đều — `pickWeighted` chuẩn hoá lại, nên nhân bao nhiêu cũng ra cùng một lựa chọn.
 *
 * Bảng này in điểm THẤP NHẤT / trung vị theo từng khung cảnh. Chỗ phải nhìn là `DOI_BANH`:
 * `sim/talk.ts` khai cái sàn để *"người ta đang bận thì KHÔNG AI BẮT CHUYỆN ĐƯỢC"*, nên nếu
 * lúc đợi bánh mà chuyện tán gẫu vẫn nằm trên sàn thì lời khai đó không đúng.
 */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TALK_NPC_IDS } from "../src/content/talks";
import { TALK_SCORE_FLOOR, eligible, kindOf } from "../src/sim/talk";

const theo = new Map<string, number[]>();
/** Riêng chuyện TÁN GẪU — cuộc `CHUYEN`, thứ đáng lẽ phải im khi người ta đang đợi bánh. */
const tanGau = new Map<string, number[]>();

for (let d = 1; d <= 6; d++) {
  const w = newGame(`diem${d}`, "p210");
  const bus = new Bus(false);
  for (let k = 1; k < d * 3; k++) nextDay(w, bus);
  const h = new HeadlessStall(w, POLICIES.greedy, { bus, platform: memoryPlatform() });
  const svc = (h as any).service;
  for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);

  for (let i = 0; i < 120000; i++) {
    h.step(1000 / 30);
    if (i % 53) continue;
    for (const ai of svc.customers) {
      if (ai.phase === "leaving" || ai.pass) continue;
      const kc = svc.practiceOf(ai);
      if (!kc) continue;
      const ok = eligible(svc.talks.get(svc.talkKey(ai)), svc.talkCtx(ai), "PLAYER")
        .filter((x: any) => svc.canRun(x, ai));
      for (const t of ok) {
        const diem = svc.scoreTalk(ai, t);
        (theo.get(kc) ?? theo.set(kc, []).get(kc)!).push(diem);
        if (kindOf(t) === "CHUYEN") (tanGau.get(kc) ?? tanGau.set(kc, []).get(kc)!).push(diem);
      }
    }
  }
}

const tom = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return `n=${String(s.length).padStart(6)}  thấp nhất ${s[0].toFixed(1).padStart(7)}  p10 ${q(0.1).toFixed(1).padStart(7)}  trung vị ${q(0.5).toFixed(1).padStart(7)}  cao nhất ${s[s.length - 1].toFixed(1).padStart(7)}`;
};

console.log(`sàn đang đặt: TALK_SCORE_FLOOR = ${TALK_SCORE_FLOOR}\n`);
console.log("── MỌI CUỘC, theo khung cảnh ──");
for (const [k, xs] of [...theo].sort()) console.log(`  ${k.padEnd(10)} ${tom(xs)}`);
console.log("\n── RIÊNG CUỘC TÁN GẪU (`CHUYEN`) ──");
for (const [k, xs] of [...tanGau].sort()) console.log(`  ${k.padEnd(10)} ${tom(xs)}`);

const cho = tanGau.get("DOI_BANH") ?? [];
if (cho.length) {
  const duoi = cho.filter((x) => x < TALK_SCORE_FLOOR).length;
  console.log(`\nĐang đợi bánh: ${duoi}/${cho.length} câu tán gẫu nằm DƯỚI sàn `
    + `(${((duoi / cho.length) * 100).toFixed(0)}%) — phần còn lại vẫn bắt chuyện được.`);
}
