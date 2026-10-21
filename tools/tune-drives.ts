/**
 * Quét ba núm của hệ drive (`K`, `FLOOR`, `DECAY_PER_MIN`): giữ hai núm kia, đo hết-nội-dung, câm-vì-sàn,
 * sàn-cắt, lặp chủ đề, số cuộc khác nhau và độ trải điểm.
 */
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { DRIVE_TUNE } from "../src/sim/drives";
import { TALK_SCORE_FLOOR, eligible } from "../src/sim/talk";
import { TALK_NPC_IDS } from "../src/content/talks";

type Do = {
  lan: number;
  /** Hết nội dung chạy được — `canRun` lọc sạch. KHÔNG liên quan tới điểm. */
  camNoiDung: number;
  /** Có cuộc chạy được, mà MỌI điểm dưới `TALK_SCORE_FLOOR`. Đây mới là chỗ ba núm nói vào. */
  camSan: number;
  /** Phần ứng viên bị sàn điểm cắt bỏ, trung bình. 0 = cái sàn không làm gì. */
  sanCat: number;
  lap: number; khac: number; trai: number;
};

/** ⚠️ `talks.ensure()` là async mà `h.step()` đồng bộ: phải nạp sẵn kho thoại trước khi đo. */
async function do1(ngay: number): Promise<Do> {
  const w = newGame(`tune${ngay}`, "p210");
  const bus = new Bus(false);
  for (let k = 1; k < ngay; k++) nextDay(w);
  const h = new HeadlessStall(w, POLICIES.greedy, { bus, platform: memoryPlatform() });
  const svc = (h as any).service;
  for (const k of [...TALK_NPC_IDS, "WALKIN", "QUA_DUONG", "ANY"]) await svc.talks.ensure(k);

  let lan = 0, camNoiDung = 0, camSan = 0, lap = 0, trai = 0, traiN = 0, sanCat = 0, sanN = 0;
  const thay = new Map<string, Set<string>>();
  const vua = new Map<string, string>();

  for (let i = 0; i < 120000; i++) {
    h.step(1000 / 30);
    if (i % 43) continue;
    const ai = svc.customers.find((c: any) => c.phase !== "leaving" && !c.pass);
    if (!ai) continue;
    lan++;
    // Tách hai kiểu câm: `canRun` lọc sạch (trước khi chấm điểm, núm không với tới) và sàn điểm cắt hết.
    const ok = eligible(svc.talks.get(svc.talkKey(ai)), svc.talkCtx(ai), "PLAYER")
      .filter((x: any) => svc.canRun(x, ai));
    if (!ok.length) { camNoiDung++; continue; }
    const diem = ok.map((x: any) => svc.scoreTalk(ai, x));
    const qua = diem.filter((d: number) => d >= TALK_SCORE_FLOOR).length;
    sanCat += 1 - qua / diem.length; sanN++;
    const t = svc.pickRunnable(ai, "PLAYER");
    if (!t) { camSan++; continue; }
    // Trải điểm: các cuộc chạy được chênh nhau bao nhiêu; gần 0 = hệ drive không phân biệt được gì.
    if (diem.length >= 2) {
      const hi = Math.max(...diem), lo = Math.min(...diem);
      const tb = diem.reduce((a: number, b: number) => a + Math.abs(b), 0) / diem.length;
      trai += tb > 0 ? (hi - lo) / tb : 0; traiN++;
    }
    const set = thay.get(ai.memKey) ?? new Set<string>();
    set.add(t.id); thay.set(ai.memKey, set);
    if (vua.get(ai.memKey) === t.topic) lap++;
    vua.set(ai.memKey, t.topic);
    // ⚠️ Phải tiêu cuộc vừa rút như cuộc nói thật, không thì `usedToday` đứng im và "lặp" đo sai.
    svc.markTalkUsed(ai, t);
  }
  const khac = thay.size ? [...thay.values()].reduce((a, s) => a + s.size, 0) / thay.size : 0;
  return {
    lan, camNoiDung, camSan, lap, khac,
    sanCat: sanN ? sanCat / sanN : 0,
    trai: traiN ? trai / traiN : 0,
  };
}

async function doNhieu(): Promise<Do> {
  const g: Do = { lan: 0, camNoiDung: 0, camSan: 0, sanCat: 0, lap: 0, khac: 0, trai: 0 };
  const N = 5;
  for (let d = 1; d <= N; d++) {
    const r = await do1(d * 3);
    g.camNoiDung += r.camNoiDung; g.camSan += r.camSan; g.lap += r.lap; g.lan += r.lan;
    g.khac += r.khac / N; g.trai += r.trai / N; g.sanCat += r.sanCat / N;
  }
  return g;
}

function in1(nhan: string, r: Do) {
  const p = (x: number) => `${((x / Math.max(1, r.lan)) * 100).toFixed(0)}%`;
  console.log(
    `${nhan.padEnd(22)} hết-nội-dung ${p(r.camNoiDung).padStart(4)} · câm-vì-sàn ${p(r.camSan).padStart(4)}`
    + ` · sàn-cắt ${(r.sanCat * 100).toFixed(0).padStart(3)}% · lặp ${p(r.lap).padStart(4)} · khác ${r.khac.toFixed(1)} · trải ${r.trai.toFixed(2)}`);
}

const goc = { ...DRIVE_TUNE };
const QUET: [keyof typeof DRIVE_TUNE, number[]][] = [
  ["K", [250, 500, 1000, 2000]],
  ["FLOOR", [3, 5, 8, 14, 22]],
  ["DECAY_PER_MIN", [0.5, 1, 2, 4, 8]],
];
for (const [num, dai] of QUET) {
  console.log(`\n── ${num} (đang đặt ${goc[num]}) ──`);
  for (const v of dai) {
    Object.assign(DRIVE_TUNE, goc);
    DRIVE_TUNE[num] = v;
    in1(`${num}=${v}${v === goc[num] ? "  ←" : ""}`, await doNhieu());
  }
}
Object.assign(DRIVE_TUNE, goc);
