import { platform } from "./platform";

const KEY = "byesep.rewinds";

/** Số lần quay ngược thời gian, tính theo máy; không mất khi chơi lại. */
export function rewinds(): number {
  const n = Number(platform.read(KEY));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function addRewind(): number {
  const n = rewinds() + 1;
  platform.write(KEY, String(n));
  return n;
}

export const HELP_FROM = 6;
