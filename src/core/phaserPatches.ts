import Phaser from "phaser";

/** Màn 90/120/144 Hz cũng chỉ chạy ~60 khung/giây; mọi hệ theo `dt` nên trông như màn 60 Hz. */
export const FPS_LIMIT = 60;

type Loop = {
  now: number; lastTime: number; rawDelta: number; time: number; delta: number; frame: number;
  smoothStep: boolean; nextFpsUpdate: number; framesThisSecond: number; _limitRate: number;
  smoothDelta(d: number): number; updateFPS(t: number): void; callback(t: number, d: number): void;
};

/** Thay `stepLimitFPS` của Phaser (bản gốc rớt khung khi rAF lệch, màn 144 Hz chỉ còn 48) bằng hạn cộng dồn dung sai nửa khung màn. */
function installFrameCap() {
  let due = 0;
  (Phaser.Core.TimeStep.prototype as unknown as { stepLimitFPS: (this: Loop, time: number) => void }).stepLimitFPS = function (time) {
    this.now = time;
    const raw = Math.max(0, time - this.lastTime);
    this.rawDelta = raw;
    this.time += raw;
    this.delta += this.smoothStep ? this.smoothDelta(raw) : raw;
    if (time >= this.nextFpsUpdate) this.updateFPS(time);
    this.framesThisSecond++;
    if (time + raw / 2 >= due) {
      due = (due + this._limitRate < time ? time : due) + this._limitRate;
      this.callback(time, this.delta);
      this.delta = 0;
    }
    this.lastTime = time;
    this.frame++;
  };
}

type Sortable = { _depth: number; displayList: { queueDepthSort(): void } | null };

/** Phaser xếp lại cả display list mỗi lần gán `depth`, kể cả khi giá trị không đổi; chỉ xếp khi đổi thật. */
function installDepthGuard() {
  const set = function (this: Sortable, v: number) {
    if (v === this._depth) return;
    this.displayList?.queueDepthSort();
    this._depth = v;
  };
  const seen = new Set<unknown>();
  const walk = (ns: Record<string, unknown>) => {
    // Chỉ lấy `value`, không gọi getter của các mixin.
    for (const { value: C } of Object.values(Object.getOwnPropertyDescriptors(ns))) {
      if (!C || seen.has(C)) continue;
      seen.add(C);
      if (typeof C === "function") {
        const d = Object.getOwnPropertyDescriptor(C.prototype ?? {}, "depth");
        if (d?.set) Object.defineProperty(C.prototype, "depth", { ...d, set });
      } else if (typeof C === "object") walk(C as Record<string, unknown>);
    }
  };
  walk(Phaser.GameObjects as unknown as Record<string, unknown>);
}

/** Phải chạy trước khi dựng game. */
export function installPhaserPatches() {
  installFrameCap();
  installDepthGuard();
}
