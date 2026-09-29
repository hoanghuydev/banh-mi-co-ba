/**
 * Telemetry CỤC BỘ — P0-03 §2.1. Một listener trên bus, không phải một hệ thống.
 *
 * Không gửi đi đâu cả: ghi vào bộ nhớ trình duyệt cạnh save, có công tắc, và có nút
 * "Xuất file" để người chơi thử tự gửi lại. Dev/playtest mặc định bật; bản bán ra
 * mặc định tắt và hỏi rõ một lần.
 *
 * Câu hỏi số 1 nó phải trả lời bằng CON SỐ: một ngày chơi mất bao nhiêu phút thật →
 * 40 ngày = bao nhiêu giờ? "Nếu bạn chưa đo, bạn chưa thiết kế."
 */
import type { Bus, EventKey, EventMap } from "./eventbus";
import type { AttentionTool, SceneKey, StimId } from "./types";
import type { TimeBand } from "./clock";
import { STIM_IDS } from "./types";
import { platform as defaultPlatform, type Platform } from "./platform";

export const WATCHED: readonly EventKey[] = [
  "day:started", "day:ended", "npc:arrived", "npc:left", "order:placed",
  "order:delivered", "delivery:diffed", "stim:emitted", "perception:stateChanged",
  "perception:confirmed", "attention:toolUsed", "dialog:selected", "dialog:spoken", "dialog:silent",
  "gossip:propagated", "gossip:overheard", "money:changed", "save:written", "ui:pauseToggled",
  "scene:transition", "notebook:hypothesisResolved", "telemetry:mark", "clock:bandChanged",
  "stall:closed",
];

export type TelemetryRow = {
  t: number;          // thứ tự tăng dần
  realMs: number;     // performance.now() từ lúc vào game
  gameMin: number;    // vị trí đồng hồ game
  day: number;
  e: EventKey;
  p: unknown;
};

type LostReason = "IMPATIENT" | "SILENT_EXIT" | "SOLD_OUT" | "REFUSED";

export type DayMetrics = {
  dayIndex: number;
  // ── CÂU HỎI SỐ 1 ─────────────────────────────────────────────────
  realMsTotal: number;
  realMsByScene: Partial<Record<SceneKey, number>>;
  /** KHÔNG tính vào tổng — người chơi đi pha cà phê. */
  realMsPaused: number;
  realMsMenu: number;
  /** = total − paused − menu ← con số dùng để ngoại suy. */
  realMsActive: number;
  // ── nhịp một khách ───────────────────────────────────────────────
  customersServed: number;
  customersLost: Record<LostReason, number>;
  msPerCustomer: { p50: number; p90: number; max: number };
  msPerCustomerByBand: Partial<Record<TimeBand, number>>;
  queueLenMax: number;
  // ── tỉ lệ lỗi theo loại ──────────────────────────────────────────
  stimEmitted: Partial<Record<StimId, number>>;
  stimConfirmed: Partial<Record<StimId, number>>;
  confirmRate: Partial<Record<StimId, number>>;
  defectsSpoken: number;
  defectsSilent: number;
  anticipatedVsDiscovered: { anticipated: number; discovered: number };
  // ── công cụ hạ attention (CANON §5.4) ────────────────────────────
  attentionToolUses: Partial<Record<AttentionTool, number>>;
  /** Dùng rồi KHÔNG bị bắt trong 3 s sau. */
  attentionToolSuccess: Partial<Record<AttentionTool, number>>;
  // ── thoại (chống lặp — HT6) ──────────────────────────────────────
  linesSpoken: number;
  uniqueLinesSpoken: number;
  lineRepeatWithin2h: number;
  /** Mục tiêu ~0,35 (CANON §11). */
  silentNoticeRate: number;
  barkTierMix: Record<1 | 2 | 3, number>;
  // ── hệ thống ─────────────────────────────────────────────────────
  fpsP5: number;
  frameMsP95: number;
  saveWriteMsP99: number;
  saveBytes: number;
  bubblePoolSteals: number;
  dialogQueriesDeferred: number;
};

const RING_ROWS = 20_000;
const KEY_METRICS = "banhmicoba.telemetry.metrics";
const KEY_ROWS = "banhmicoba.telemetry.rows";
/** Giữ bao nhiêu ngày dòng thô trong bộ nhớ trình duyệt (mỗi ngày ~70 KB). */
const KEEP_DAYS_ROWS = 5;

const pct = (xs: number[], p: number) => {
  if (!xs.length) return 0;
  const a = [...xs].sort((x, y) => x - y);
  return a[Math.min(a.length - 1, Math.floor(a.length * p))];
};

const now = () => (typeof performance !== "undefined" ? performance.now() : 0);

/** Số đo phần cứng do scene bơm vào — không đi qua bus vì nó xảy ra mỗi frame. */
export type FrameSampler = () => { frameDeltas: number[] };

export class Telemetry {
  private rows: TelemetryRow[] = [];
  private seq = 0;
  private day = 0;
  private gameMin = 0;
  private band: TimeBand = "PRE_OPEN";
  private off: (() => void)[] = [];
  enabled: boolean;
  /** Người điều phối playtest / overlay dev có thể đọc ngay. */
  readonly days: DayMetrics[] = [];
  bubblePoolSteals = 0;
  dialogDeferred = 0;
  frameSampler: FrameSampler = () => ({ frameDeltas: [] });

  constructor(
    bus: Bus, enabled: boolean, private platform: Platform = defaultPlatform,
    /** Đồng hồ thật — headless sim bơm đồng hồ mô phỏng vào đây. */
    private nowFn: () => number = now,
  ) {
    this.enabled = enabled;
    try {
      const raw = platform.read(KEY_METRICS);
      if (raw) this.days.push(...(JSON.parse(raw) as DayMetrics[]));
    } catch { /* hỏng thì thôi */ }
    this.off.push(bus.on("clock:tick", (p) => { this.gameMin = p.gameMinutes; }));
    this.off.push(bus.on("clock:bandChanged", (p) => { this.band = p.to; }));
    this.off.push(bus.on("day:started", (p) => { this.day = p.dayIndex; }));
    this.off.push(bus.onAny((e, p) => this.record(e, p)));
    this.off.push(bus.on("day:ended", () => this.closeDay()));
  }

  detach() {
    for (const f of this.off) f();
  }

  get currentBand() { return this.band; }

  private record(e: EventKey, p: unknown) {
    if (!this.enabled || !WATCHED.includes(e)) return;
    this.rows.push({ t: ++this.seq, realMs: Math.round(this.nowFn()), gameMin: Math.round(this.gameMin * 10) / 10, day: this.day, e, p });
    if (this.rows.length > RING_ROWS) this.rows.shift();
  }

  /** Dòng của MỘT ngày. */
  rowsOf(day: number) {
    return this.rows.filter((r) => r.day === day);
  }

  /** Tính DayMetrics từ dòng thô — hàm thuần, test gọi thẳng được. */
  static compute(dayIndex: number, rows: TelemetryRow[], sys: {
    frameDeltas: number[]; bubblePoolSteals: number; dialogDeferred: number;
  }): DayMetrics {
    const of = <K extends EventKey>(k: K) =>
      rows.filter((r) => r.e === k) as (TelemetryRow & { p: EventMap[K] })[];

    const start = of("day:started")[0]?.realMs ?? rows[0]?.realMs ?? 0;
    const end = of("day:ended").at(-1)?.realMs ?? rows.at(-1)?.realMs ?? start;
    const realMsTotal = Math.max(0, end - start);

    // thời gian theo scene — cắt theo từng lần chuyển cảnh
    const byScene: Partial<Record<SceneKey, number>> = {};
    let curScene: SceneKey | null = null;
    let since = start;
    for (const r of of("scene:transition")) {
      if (curScene) byScene[curScene] = (byScene[curScene] ?? 0) + (r.realMs - since);
      curScene = r.p.to; since = r.realMs;
    }
    if (curScene) byScene[curScene] = (byScene[curScene] ?? 0) + (end - since);

    // pause: cặp bật/tắt
    let paused = 0, pausedAt: number | null = null;
    for (const r of of("ui:pauseToggled")) {
      if (r.p.paused && pausedAt === null) pausedAt = r.realMs;
      else if (!r.p.paused && pausedAt !== null) { paused += r.realMs - pausedAt; pausedAt = null; }
    }
    if (pausedAt !== null) paused += end - pausedAt;
    const realMsMenu = byScene.Menu ?? 0;

    // nhịp một khách
    const arrived = new Map<string, TelemetryRow>();
    for (const r of of("npc:arrived")) arrived.set(r.p.visitId, r);
    const durations: number[] = [];
    const byBand: Partial<Record<TimeBand, number[]>> = {};
    const lost: Record<LostReason, number> = { IMPATIENT: 0, SILENT_EXIT: 0, SOLD_OUT: 0, REFUSED: 0 };
    let served = 0;
    let queue = 0, queueMax = 0;
    for (const r of rows) {
      if (r.e === "npc:arrived") { queue++; queueMax = Math.max(queueMax, queue); }
      if (r.e !== "npc:left") continue;
      queue = Math.max(0, queue - 1);
      const p = r.p as EventMap["npc:left"];
      if (p.reason === "SERVED") served++;
      else if (p.reason in lost) lost[p.reason as LostReason]++;
      const a = arrived.get(p.visitId);
      if (!a) continue;
      const d = r.realMs - a.realMs;
      durations.push(d);
      const band = bandAtGameMin(a.gameMin);
      (byBand[band] ??= []).push(d);
    }
    const msPerCustomerByBand: Partial<Record<TimeBand, number>> = {};
    for (const [b, xs] of Object.entries(byBand)) msPerCustomerByBand[b as TimeBand] = pct(xs!, 0.5);

    // sự kiện
    const emitted: Partial<Record<StimId, number>> = {};
    const confirmed: Partial<Record<StimId, number>> = {};
    for (const r of of("stim:emitted")) emitted[r.p.stimId] = (emitted[r.p.stimId] ?? 0) + 1;
    for (const r of of("perception:confirmed")) confirmed[r.p.stimId] = (confirmed[r.p.stimId] ?? 0) + 1;
    const confirmRate: Partial<Record<StimId, number>> = {};
    for (const id of STIM_IDS) if (emitted[id]) confirmRate[id] = (confirmed[id] ?? 0) / emitted[id]!;

    let spoken = 0, silentDefects = 0, anticipated = 0, discovered = 0;
    for (const r of of("delivery:diffed")) {
      if (r.p.spoken) spoken++;
      silentDefects += Math.max(0, r.p.defects.length - (r.p.spoken ? 1 : 0));
      if (r.p.mode === "ANTICIPATED") anticipated++;
      if (r.p.mode === "DISCOVERED") discovered++;
    }

    // công cụ hạ attention — "thành công" = 3 s sau không ai CONFIRMED sự kiện tiêu cực
    const uses: Partial<Record<AttentionTool, number>> = {};
    const success: Partial<Record<AttentionTool, number>> = {};
    const confirms = of("perception:confirmed");
    for (const r of of("attention:toolUsed")) {
      uses[r.p.tool] = (uses[r.p.tool] ?? 0) + 1;
      const caught = confirms.some((c) => c.realMs > r.realMs && c.realMs - r.realMs <= 3000);
      if (!caught) success[r.p.tool] = (success[r.p.tool] ?? 0) + 1;
    }

    // thoại
    const lines = of("dialog:spoken");
    const seenAt = new Map<string, number>();
    let repeat2h = 0;
    const tierMix: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
    for (const r of lines) {
      tierMix[r.p.tier]++;
      const k = `${r.p.npcId}|${r.p.text}`;
      const prev = seenAt.get(k);
      if (prev !== undefined && r.realMs - prev < 2 * 3600_000) repeat2h++;
      seenAt.set(k, r.realMs);
    }
    const silents = of("dialog:silent").filter((r) => r.p.reason === "RATE_35").length;
    const noticeTurns = silents + lines.filter((r) => r.p.tier === 1).length;

    const saves = of("save:written");
    const fd = sys.frameDeltas;

    return {
      dayIndex,
      realMsTotal,
      realMsByScene: byScene,
      realMsPaused: paused,
      realMsMenu,
      realMsActive: Math.max(0, realMsTotal - paused - realMsMenu),
      customersServed: served,
      customersLost: lost,
      msPerCustomer: { p50: pct(durations, 0.5), p90: pct(durations, 0.9), max: Math.max(0, ...durations) },
      msPerCustomerByBand,
      queueLenMax: queueMax,
      stimEmitted: emitted,
      stimConfirmed: confirmed,
      confirmRate,
      defectsSpoken: spoken,
      defectsSilent: silentDefects,
      anticipatedVsDiscovered: { anticipated, discovered },
      attentionToolUses: uses,
      attentionToolSuccess: success,
      linesSpoken: lines.length,
      uniqueLinesSpoken: new Set(lines.map((r) => r.p.text)).size,
      lineRepeatWithin2h: repeat2h,
      silentNoticeRate: noticeTurns ? silents / noticeTurns : 0,
      barkTierMix: tierMix,
      fpsP5: fd.length ? Math.round(1000 / Math.max(1, pct(fd, 0.95))) : 0,
      frameMsP95: Math.round(pct(fd, 0.95) * 10) / 10,
      saveWriteMsP99: Math.round(pct(saves.map((r) => r.p.ms), 0.99) * 100) / 100,
      saveBytes: saves.at(-1)?.p.bytes ?? 0,
      bubblePoolSteals: sys.bubblePoolSteals,
      dialogQueriesDeferred: sys.dialogDeferred,
    };
  }

  private closeDay() {
    if (!this.enabled) return;
    const rows = this.rowsOf(this.day);
    const m = Telemetry.compute(this.day, rows, {
      frameDeltas: this.frameSampler().frameDeltas,
      bubblePoolSteals: this.bubblePoolSteals,
      dialogDeferred: this.dialogDeferred,
    });
    const i = this.days.findIndex((d) => d.dayIndex === m.dayIndex);
    if (i >= 0) this.days.splice(i, 1, m); else this.days.push(m);
    this.bubblePoolSteals = 0;
    this.dialogDeferred = 0;
    // Ghi NGOÀI frame gameplay: `day:ended` phát lúc quầy đã đóng.
    this.platform.write(KEY_METRICS, JSON.stringify(this.days));
    const keepFrom = this.day - KEEP_DAYS_ROWS + 1;
    this.platform.write(KEY_ROWS, this.rows.filter((r) => r.day >= keepFrom).map((r) => JSON.stringify(r)).join("\n"));
  }

  /** Ngoại suy cả mùa + kết luận BẰNG CHỮ theo bảng quyết định P0-03 §2.1. */
  seasonEstimate(seasonDays = 40) {
    return estimateSeason(this.days, seasonDays);
  }

  exportJsonl(): string {
    const head = JSON.stringify({ kind: "metrics", days: this.days, estimate: this.seasonEstimate() });
    let rows = this.rows.map((r) => JSON.stringify(r));
    if (!rows.length) rows = (this.platform.read(KEY_ROWS) ?? "").split("\n").filter(Boolean);
    return [head, ...rows].join("\n");
  }

  download() {
    this.platform.download(`banhmicoba-telemetry-${new Date().toISOString().slice(0, 10)}.jsonl`, this.exportJsonl());
  }

  clear() {
    this.rows = [];
    this.days.length = 0;
    this.platform.remove(KEY_METRICS);
    this.platform.remove(KEY_ROWS);
  }
}

function bandAtGameMin(m: number): TimeBand {
  if (m < 6 * 60 + 30) return "PRE_OPEN";
  if (m < 8 * 60) return "PEAK";
  if (m < 9 * 60 + 30) return "MID";
  return "LULL";
}

/**
 * gioMuaUocTinh = Σ(realMsActive của N ngày đã đo) / N × 40 / 3.600.000
 * Báo cáo CẢ HAI con số: người mua trên Steam thấy "playtime" gồm cả pause.
 */
export function estimateSeason(days: DayMetrics[], seasonDays = 40) {
  const n = days.length;
  if (!n) return { days: 0, minPerDay: 0, minPerDayTotal: 0, seasonHours: 0, seasonHoursTotal: 0, verdict: "chưa đo ngày nào" };
  const avg = (f: (d: DayMetrics) => number) => days.reduce((s, d) => s + f(d), 0) / n;
  const minPerDay = avg((d) => d.realMsActive) / 60_000;
  const minPerDayTotal = avg((d) => d.realMsTotal) / 60_000;
  const seasonHours = (minPerDay * seasonDays) / 60;
  const seasonHoursTotal = (minPerDayTotal * seasonDays) / 60;
  const verdict =
    seasonHours < 4 ? "QUÁ NGẮN (< 4 giờ) — giảm SEASON_DAYS 40 → 30 VÀ tăng mật độ. Không kéo dài bằng thời gian chờ."
    : seasonHours < 6 ? "Ngắn nhưng đủ (4–6 giờ) — giữ 40 ngày, thêm 2–3 khách vãng lai/ngày."
    : seasonHours <= 8 ? "VÙNG MỤC TIÊU (6–8 giờ) — không đổi."
    : seasonHours <= 10 ? "Hơi dài (8–10 giờ) — tăng TIME_SCALE_IDLE_LULL, rút EveningScene."
    : "QUÁ DÀI (> 10 giờ) — cắt xuống 30–35 ngày: người chơi sẽ bỏ dở trước cú quay lại ngày 40.";
  return {
    days: n,
    minPerDay: Math.round(minPerDay * 100) / 100,
    minPerDayTotal: Math.round(minPerDayTotal * 100) / 100,
    seasonHours: Math.round(seasonHours * 100) / 100,
    seasonHoursTotal: Math.round(seasonHoursTotal * 100) / 100,
    verdict: n < 5 ? `${verdict} (mới đo ${n}/5 ngày — chưa đủ để chốt)` : verdict,
  };
}
