import DAY from "../content/days/day_index.json";
import type { Bus } from "./eventbus";

// Nguồn thời gian duy nhất: `dt` (giây thật) cho certainty/kiên nhẫn/lò, `minutes` (phút game) cho lịch; đừng nhầm hai loại.

export type TimeBand = "PRE_OPEN" | "PEAK" | "MID" | "LULL";

const hhmm = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};

type BandDef = { id: TimeBand; from: number; to: number; busy: number; idle: number };
const BANDS: BandDef[] = DAY.bands.map((b) => ({
  id: b.id as TimeBand, from: hhmm(b.fromHhmm), to: hhmm(b.toHhmm), busy: b.scaleBusy, idle: b.scaleIdle,
}));

export const DAY_START_MIN = hhmm(DAY.openHhmm);
export const DAY_END_MIN = hhmm(DAY.closeHhmm);
export const PEAK_START_MIN = BANDS.find((b) => b.id === "PEAK")!.from;
export const PEAK_END_MIN = BANDS.find((b) => b.id === "PEAK")!.to;
export const TIME_SCALE_BASE = DAY.timeScaleBase;

// Chặn cú nhảy dài khi tab quay lại từ nền.
export const CLOCK_DT_CLAMP_MS = 100;

export const BAND_LABEL: Record<TimeBand, string> = {
  PRE_OPEN: "mới dọn hàng",
  PEAK: "cao điểm",
  MID: "bớt khách",
  LULL: "vắng",
};

export function bandOf(minutes: number): TimeBand {
  for (const b of BANDS) if (minutes < b.to) return b.id;
  return "LULL";
}

export function fmtHhmm(minutes: number) {
  const m = Math.floor(minutes);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

type Timer = { left: number; fn: () => void };

export class Clock {
  // Phút trong ngày tính từ 00:00.
  minutes = DAY_START_MIN;
  paused = false;
  band: TimeBand = bandOf(DAY_START_MIN);
  // Chỉ nhân phút game, không bao giờ đụng `dt`.
  scaleMul = 1;
  devFastForward = 1;
  // Scene báo mỗi frame; có khách thì không tua nhanh.
  busy = false;
  scale = TIME_SCALE_BASE;

  private timers: Timer[] = [];

  constructor(private bus?: Bus) {}

  reset(minutes = DAY_START_MIN) {
    this.minutes = minutes;
    this.band = bandOf(minutes);
    this.timers = [];
  }

  currentScale(): number {
    if (this.paused) return 0;
    const b = BANDS.find((x) => x.id === this.band)!;
    return (this.busy ? TIME_SCALE_BASE : b.idle) * this.scaleMul * this.devFastForward;
  }

  // Gọi đúng 1 lần/frame, đầu frame; trả `dt` giây thật chưa nhân scale.
  advance(rawDeltaMs: number): number {
    if (this.paused) { this.scale = 0; return 0; }
    const ms = Math.min(Number.isFinite(rawDeltaMs) ? Math.max(0, rawDeltaMs) : 0, CLOCK_DT_CLAMP_MS);
    const dt = ms / 1000;
    this.scale = this.currentScale();
    const before = this.band;
    this.minutes = Math.min(DAY_END_MIN, this.minutes + dt * (this.scale / 60));
    this.band = bandOf(this.minutes);
    if (this.band !== before) this.bus?.emit("clock:bandChanged", { from: before, to: this.band });
    this.bus?.emit("clock:tick", { dt, gameMinutes: this.minutes, hhmm: this.format() });
    this.tickTimers(dt);
    return dt;
  }

  // Thay `setTimeout`: giây thật nhưng dừng theo pause.
  after(sec: number, fn: () => void) {
    this.timers.push({ left: sec, fn });
  }

  private tickTimers(dt: number) {
    if (!this.timers.length) return;
    const due: Timer[] = [];
    for (const t of this.timers) if ((t.left -= dt) <= 0) due.push(t);
    if (!due.length) return;
    this.timers = this.timers.filter((t) => t.left > 0);
    for (const t of due) t.fn();
  }

  get isOver() {
    return this.minutes >= DAY_END_MIN;
  }

  get isPeak() {
    return this.band === "PEAK";
  }

  get progress() {
    return (this.minutes - DAY_START_MIN) / (DAY_END_MIN - DAY_START_MIN);
  }

  format() {
    return fmtHhmm(this.minutes);
  }
}


// Phút trong ngày → giờ nói miệng (vd. "gần bảy giờ") cho chỗ trống `{gio}`.
export function gioVi(minutes: number): string {
  const DON = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const gio = (x: number) => (x === 10 ? "mười" : x === 11 ? "mười một" : x === 12 ? "mười hai" : DON[x] ?? String(x));
  const phut = (x: number): string => {
    if (x < 10) return DON[x];
    if (x === 10) return "mười";
    if (x < 20) return `mười ${x % 10 === 5 ? "lăm" : DON[x % 10]}`;
    const c = Math.floor(x / 10), d = x % 10;
    if (!d) return `${DON[c]} mươi`;
    return `${DON[c]} mươi ${d === 5 ? "lăm" : d === 1 ? "mốt" : d === 4 ? "tư" : DON[d]}`;
  };
  const h = Math.floor(minutes / 60), m = minutes % 60;
  if (m === 0) return `${gio(h)} giờ`;
  if (m <= 5) return `hơn ${gio(h)} giờ`;
  if (m >= 50) return `gần ${gio(h + 1)} giờ`;
  if (m >= 25 && m <= 35) return `${gio(h)} giờ rưỡi`;
  return `${gio(h)} giờ ${phut(m)}`;
}
