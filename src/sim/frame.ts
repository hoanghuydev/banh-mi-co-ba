/**
 * Vòng đời MỘT frame — P0-01 §2.4. Thứ tự BẮT BUỘC, không được đổi:
 *
 *   0 clock → 1 input → 2 craft → 3 perception → 4 npc → 5 dialog → 6 render
 *
 * Cặp quan trọng nhất của cả game là craft → perception: `stim` phải được phát
 * TRƯỚC khi perception duyệt, nếu không frame cuối cùng trước khi khách ngẩng lên —
 * đúng frame người chơi đang nín thở nhìn — bị tính sai.
 *
 * Bước 0 là điểm DUY NHẤT trả `dt = 0` khi pause: mọi hệ dưới nó tự đứng im,
 * không hệ nào phải tự hỏi "có đang pause không" (CANON §15.2).
 *
 * Không import Phaser — test gọi thẳng `runFrame` với spy để bắt ai đổi thứ tự.
 */
export const FRAME_STEPS = ["clock", "input", "craft", "perception", "npc", "dialog", "render"] as const;
export type FrameStep = typeof FRAME_STEPS[number];

export type FrameHandlers = {
  /** Trả `dt` giây THẬT; 0 = đang pause. */
  clock(rawDeltaMs: number): number;
  input(dt: number): void;
  craft(dt: number): void;
  perception(dt: number): void;
  npc(dt: number): void;
  dialog(dt: number): void;
  render(dt: number): void;
  /** Frame bị pause: chỉ vẽ lại, KHÔNG đổi state. */
  renderPaused(): void;
};

/** Số đo của frame gần nhất + cửa sổ trượt cho p95 — overlay Perf (F7) và telemetry đọc. */
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
