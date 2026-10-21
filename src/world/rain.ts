// Mọi hàm trả `sy` của tâm ô, chưa cộng `footY` (thuộc lớp vẽ Phaser).
import { TH, TW } from "./iso";
import { SKY_FROM_Y, WORLD_H } from "./map";
import type { Weather } from "../core/types";

// Chỉnh bằng mắt: cao quá thì mưa như tạt vào quán, thấp quá thì vệt mưa trên hàng khách quá ngắn.
export const ROOF_PX = 80;

export function eaveCenterY(sx: number) {
  return sx * (TH / TW) + SKY_FROM_Y * TH;
}

export function isUnderSky(wy: number) {
  return wy >= SKY_FROM_Y;
}

export function fallPx(wy: number) {
  return TH * (wy - SKY_FROM_Y) + ROOF_PX;
}

export function rowAtFall(px: number) {
  return SKY_FROM_Y + (px - ROOF_PX) / TH;
}

export const LAST_SKY_ROW = WORLD_H;

/** Chỗ thả trên mép mái: `sx·(1 − lean·k) = tx − lean·(ty − C)`; `eaveC` đã cộng `footY`, trừ `ROOF_PX`. */
export function spawnSx(tx: number, ty: number, lean: number, eaveC: number) {
  return (tx - lean * (ty - eaveC)) / (1 - lean * (TH / TW));
}

export type RainDensity = {
  /** Hạt/giây. */
  drops: number;
  /** Giọt mép mái/giây. */
  drips: number;
  /** Độ, 0 là rơi thẳng. */
  windDeg: number;
  /** Biên độ lay gió (độ). */
  gustDeg: number;
};

// Đi cùng SPEED_MIN/MAX bên ui/stall/Rain.ts: số hạt sống = drops × quãng rơi ÷ tốc độ.
const BASE_DENSITY: Record<"MUA_RAO" | "MUA_DAM", RainDensity> = {
  MUA_RAO: { drops: 135, drips: 7, windDeg: 7, gustDeg: 4 },
  MUA_DAM: { drops: 78, drips: 4, windDeg: 3, gustDeg: 2 },
};

// Không tắt hẳn khi giảm chuyển động vì mưa mang thông tin gameplay.
export const REDUCED_MUL = 0.25;

export function rainDensity(weather: Weather, reducedMotion: boolean): RainDensity | null {
  const base = weather === "MUA_RAO" || weather === "MUA_DAM" ? BASE_DENSITY[weather] : null;
  if (!base) return null;
  if (!reducedMotion) return base;
  return {
    drops: base.drops * REDUCED_MUL,
    drips: base.drips * REDUCED_MUL,
    windDeg: base.windDeg,
    gustDeg: 0,
  };
}

const GUST_MS = 5300;

export function windAt(d: RainDensity, tMs: number) {
  return d.windDeg + d.gustDeg * Math.sin(tMs / GUST_MS);
}

/** Alpha tấm phủ `d ↦ d·(1−a) + grade·a`, cố ý nhẹ để khung không tối thui. */
export function rainGrade(weather: Weather): number | null {
  if (weather === "MUA_RAO") return 0.11;
  if (weather === "MUA_DAM") return 0.085;
  return null;
}
