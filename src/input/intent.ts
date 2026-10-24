// Nhập liệu thuần dữ liệu: bàn phím và cảm ứng cùng ghi vào đây, cảnh chỉ đọc.
import type { MoveInput } from "../entities/Player";

export type Action = "interact" | "discard" | "lift" | "talk" | "pause" | "phone";

export type Dirs = { up: boolean; down: boolean; left: boolean; right: boolean };

export const NO_DIRS: Dirs = { up: false, down: false, left: false, right: false };

/** Nghiêng dưới mức này (tỉ lệ bán kính) thì đứng yên. */
export const STICK_DEAD = 0.22;

/** Hướng theo màn hình, 8 hướng như WASD; độ nghiêng chỉ quyết định đi hay đứng, không quyết định chạy. */
export function stickDirs(dx: number, dy: number, radius: number, dead = STICK_DEAD): Dirs {
  if (radius <= 0 || Math.hypot(dx, dy) < radius * dead) return { ...NO_DIRS };
  const sector = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
  const s = ((sector % 8) + 8) % 8;
  return {
    right: s === 7 || s === 0 || s === 1,
    down: s === 1 || s === 2 || s === 3,
    left: s === 3 || s === 4 || s === 5,
    up: s === 5 || s === 6 || s === 7,
  };
}

export class InputState {
  kbDirs: Dirs = { ...NO_DIRS };
  kbRun = false;
  kbCover = false;
  kbWork = false;

  stick: Dirs = { ...NO_DIRS };
  touchRun = false;
  touchCover = false;
  touchWork = false;

  private listener: ((a: Action) => void) | null = null;

  onAction(cb: ((a: Action) => void) | null) { this.listener = cb; }
  fire(a: Action) { this.listener?.(a); }

  get cover() { return this.kbCover || this.touchCover; }
  get work() { return this.kbWork || this.touchWork; }
  get run() { return (this.kbRun || this.touchRun) && !this.cover; }

  move(): MoveInput {
    const k = this.kbDirs, t = this.stick;
    return {
      up: k.up || t.up, down: k.down || t.down, left: k.left || t.left, right: k.right || t.right,
      run: this.run,
    };
  }

  releaseTouch() {
    this.stick = { ...NO_DIRS };
    this.touchRun = this.touchCover = this.touchWork = false;
  }

  releaseAll() {
    this.releaseTouch();
    this.kbDirs = { ...NO_DIRS };
    this.kbRun = this.kbCover = this.kbWork = false;
  }
}
