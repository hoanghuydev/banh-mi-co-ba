/** Thứ tự frame bắt buộc: craft phải phát `stim` trước perception; clock là chỗ duy nhất trả dt = 0 khi pause. */
export const FRAME_STEPS = ["clock", "input", "craft", "perception", "npc", "dialog", "render"] as const;
export type FrameStep = typeof FRAME_STEPS[number];

export type FrameHandlers = {
  /** Trả `dt` giây thật; 0 = đang pause. */
  clock(rawDeltaMs: number): number;
  input(dt: number): void;
  craft(dt: number): void;
  perception(dt: number): void;
  npc(dt: number): void;
  dialog(dt: number): void;
  render(dt: number): void;
  renderPaused(): void;
};

export const frameStats = {
  last: Object.fromEntries(FRAME_STEPS.map((s) => [s, 0])) as Record<FrameStep, number>,
  totals: [] as number[],
  push(total: number) {
    this.totals.push(total);
    if (this.totals.length > 900) this.totals.shift();    // ~30 s ở 30 fps
  },
  p95() {
    if (!this.totals.length) return 0;
    const a = [...this.totals].sort((x, y) => x - y);
    return a[Math.min(a.length - 1, Math.floor(a.length * 0.95))];
  },
};

const now = () => (typeof performance !== "undefined" ? performance.now() : 0);

export function runFrame(h: FrameHandlers, rawDeltaMs: number) {
  const t0 = now();
  let t = t0;
  const mark = (s: FrameStep) => { const n = now(); frameStats.last[s] = n - t; t = n; };

  const dt = h.clock(rawDeltaMs);                mark("clock");
  if (dt === 0) { h.renderPaused(); return; }
  h.input(dt);                                   mark("input");
  h.craft(dt);                                   mark("craft");
  h.perception(dt);                              mark("perception");
  h.npc(dt);                                     mark("npc");
  h.dialog(dt);                                  mark("dialog");
  h.render(dt);                                  mark("render");
  frameStats.push(now() - t0);
}
