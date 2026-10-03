/**
 * LÚC NGƯỜI TA ĐANG ĐỢI BÁNH, BẤM BẮT CHUYỆN THÌ RA CÁI GÌ?
 *
 * `sim/talk.ts` khai `TALK_SCORE_FLOOR` để *"người ta đang bận thì KHÔNG AI BẮT CHUYỆN
 * ĐƯỢC"*. `tools/probe-diem.ts` đo ra điểm KHÔNG BAO GIỜ ÂM (thấp nhất 0,0), nên cái sàn
 * −5 chưa từng cắt một cuộc nào — lời khai đó không do nó giữ.
 *
 * Cái giữ thật là thứ hạng: lúc `DOI_BANH`, cuộc về phục vụ ăn 46 điểm còn tán gẫu 2,3.
 * Nhưng `pickWeighted` rút trong TOP-3 có trọng số, nên 2,3 vẫn có cửa. Đo xem cửa đó
 * rộng bao nhiêu, và một ngưỡng cắt THEO TỈ LỆ (so với cuộc cao nhất) đóng được tới đâu.
 */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { TALK_NPC_IDS } from "../src/content/talks";
import { TALK_SCORE_FLOOR, eligible, kindOf } from "../src/sim/talk";
import { pickWeighted } from "../src/sim/drives";

import { DRIVE_TUNE } from "../src/sim/drives";

/** Quét `CHO_PHIEN` — khoản ÂM một cuộc tán gẫu đặt lên `DUOC_PHUC_VU`. */
const QUET = [0, 3, 6, 10, 16, 24];
/** Ba khung cảnh phải nhìn cùng lúc: cấm lúc đợi bánh KHÔNG được kéo theo cấm lúc xếp hàng. */
const KHUNG = ["DOI_BANH", "GOI_MON", "XEP_HANG"] as const;
type O = { tanGau: number; tong: number };
const dem: Record<string, O>[] = QUET.map(() => Object.fromEntries(KHUNG.map((k) => [k, { tanGau: 0, tong: 0 }])));

for (let d = 1; d <= 6; d++) {
  const w = newGame(`tg${d}`, "p210");
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
      if (!KHUNG.includes(kc)) continue;
      const ok = eligible(svc.talks.get(svc.talkKey(ai)), svc.talkCtx(ai), "PLAYER")
        .filter((x: any) => svc.canRun(x, ai));
      if (!ok.length) continue;
      QUET.forEach((v, j) => {
        DRIVE_TUNE.CHO_PHIEN = v;
        const cham = ok.map((t: any) => ({ item: t, score: svc.scoreTalk(ai, t) }))
          .filter((x) => x.score >= TALK_SCORE_FLOOR);
        if (!cham.length) return;                   // câm — đúng điều cái sàn sinh ra để làm
        const t: any = pickWeighted(cham, (i % 997) / 997);
        dem[j][kc].tong++;
        if (kindOf(t) === "CHUYEN") dem[j][kc].tanGau++;
      });
    }
  }
}

console.log("tỉ lệ bấm-ra-tán-gẫu, theo khung cảnh:\n");
console.log(`  ${"CHO_PHIEN".padEnd(11)}${KHUNG.map((k) => k.padStart(12)).join("")}`);
QUET.forEach((v, j) => {
  const o = dem[j];
  const c = KHUNG.map((k) => {
    const x = o[k];
    return `${x.tong ? ((x.tanGau / x.tong) * 100).toFixed(0) : "–"}%`.padStart(12);
  }).join("");
  console.log(`  ${String(v).padEnd(11)}${c}`);
});
console.log("\n  DOI_BANH phải ≈0 (đang đợi bánh thì chỉ nói bằng ổ bánh),");
console.log("  XEP_HANG phải CÒN SỐNG (đứng xếp hàng là lúc tán gẫu được).");
