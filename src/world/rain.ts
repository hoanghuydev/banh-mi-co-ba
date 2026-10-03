/**
 * HÌNH HỌC CỦA MỘT CƠN MƯA — toán thuần, không Phaser. `ui/stall/Rain.ts` là phần VẼ; file này
 * kiểm được bằng Node (`tests/p5-rain.test.ts`) còn cái vẽ thì không.
 *
 * ⚠️ Mọi hàm trả `sy` của TÂM Ô, CHƯA cộng `art/canvas.footY` — `footY` thuộc lớp VẼ (import
 * Phaser), mà test chạy trong Node. Nó là phép tịnh tiến thuần nên cộng trước hay sau đều như nhau.
 */
import { TH, TW } from "./iso";
import { SKY_FROM_Y, WORLD_H } from "./map";
import type { Weather } from "../core/types";

/**
 * Con số CHỈNH BẰNG MẮT: cao quá thì mưa bắt đầu rơi phía trên chỗ người chơi đứng (đọc ra là
 * "mưa tạt vào trong quán"); thấp quá thì giọt rơi trúng hàng khách chỉ còn một vệt 18 px.
 */
export const ROOF_PX = 80;

/** Một HÀNG trong iso là một ĐƯỜNG THẲNG dốc `TH/TW`; suy từ `toScreen` chứ không gõ tay hai con số. */
export function eaveCenterY(sx: number) {
  return sx * (TH / TW) + SKY_FROM_Y * TH;
}

export function isUnderSky(wy: number) {
  return wy >= SKY_FROM_Y;
}

/** `ROOF_PX` là quãng từ mép mái xuống mặt đất NGAY DƯỚI nó; mỗi hàng ra xa thêm một bậc thì mặt đất tụt thêm `TH` px. */
export function fallPx(wy: number) {
  return TH * (wy - SKY_FROM_Y) + ROOF_PX;
}

/** Ngược của `fallPx`: rơi ngần này px thì chạm đất ở hàng nào. */
export function rowAtFall(px: number) {
  return SKY_FROM_Y + (px - ROOF_PX) / TH;
}

export const LAST_SKY_ROW = WORLD_H;

/**
 * Biết điểm chạm đất và độ nghiêng gió, tìm chỗ thả trên mép mái:
 *   `sx = tx − lean·d`, `d = ty − mép(sx)`, `mép(sx) = k·sx + C`  ⇒  `sx·(1 − lean·k) = tx − lean·(ty − C)`
 *
 * Nghiệm đóng nên không phải dò — lặp xấp xỉ thì mỗi giọt lệch một chút khác nhau và cả màn mưa
 * rung lên theo sai số. `eaveC` đã cộng `footY` và trừ `ROOF_PX` sẵn.
 */
export function spawnSx(tx: number, ty: number, lean: number, eaveC: number) {
  return (tx - lean * (ty - eaveC)) / (1 - lean * (TH / TW));
}

/** Hai kiểu mưa của lịch mùa là hai cơn mưa khác hẳn nhau, không phải một cơn chỉnh to nhỏ. */
export type RainDensity = {
  /** Giọt mưa rơi xuống nền, mỗi giây. */
  drops: number;
  /** Giọt nhỏ từ mép mái xuống ngay trước quầy, mỗi giây. */
  drips: number;
  /** Góc gió (độ) — 0 là rơi thẳng đứng. */
  windDeg: number;
  /** Biên độ lay gió (độ) quanh `windDeg`. `reducedMotion` ép về 0. */
  gustDeg: number;
};

/**
 * ⚠️ `drops` BUỘC phải đi cùng `SPEED_MIN`/`SPEED_MAX` bên `ui/stall/Rain.ts`: cái quyết định độ
 * dày (và khoản máy phải gánh) là SỐ HẠT ĐANG SỐNG = `drops × quãng rơi ÷ tốc độ`.
 */
const BASE_DENSITY: Record<"MUA_RAO" | "MUA_DAM", RainDensity> = {
  MUA_RAO: { drops: 135, drips: 7, windDeg: 7, gustDeg: 4 },
  MUA_DAM: { drops: 78, drips: 4, windDeg: 3, gustDeg: 2 },
};

/** Không xoá hẳn như "lá bay / bụi": mưa là sự kiện của thế giới (ngày mưa ít khách, khách cầm dù), xoá sạch là người bật trợ năng mất một tin. */
export const REDUCED_MUL = 0.25;

export function rainDensity(weather: Weather, reducedMotion: boolean): RainDensity | null {
  const base = weather === "MUA_RAO" || weather === "MUA_DAM" ? BASE_DENSITY[weather] : null;
  if (!base) return null;
  if (!reducedMotion) return base;
  return {
    drops: base.drops * REDUCED_MUL,
    drips: base.drips * REDUCED_MUL,
    windDeg: base.windDeg,                             // vẫn nghiêng — chỉ bỏ phần LAY
    gustDeg: 0,
  };
}

/** Chu kỳ một hơi gió (ms). Dài và lệch số nguyên để hai cơn gió không bao giờ trùng nhịp. */
const GUST_MS = 5300;

export function windAt(d: RainDensity, tMs: number) {
  return d.windDeg + d.gustDeg * Math.sin(tMs / GUST_MS);
}

/**
 * Spec đòi hai tấm phủ (NHÂN hạ sáng + THƯỜNG nén tương phản), nhưng chồng lên nhau chúng vẫn chỉ
 * là MỘT phép tuyến tính `d ↦ d·k + b` — tức một tấm phủ THƯỜNG duy nhất. Bỏ được 2,4 triệu pixel
 * phải tô mỗi frame cộng một lần đổi blend mode; chênh lớn nhất 2,2/255, `tests/p5-rain` kẹp lại.
 *
 * ⚠️ Chỉ làm được vế TRẦN ("không còn gì trắng hẳn"). Vế SÀN là việc của khâu VẼ ASSET — đừng đi
 * vặn alpha cho khớp con số 30%.
 */
export function rainGrade(weather: Weather): number | null {
  if (weather === "MUA_RAO") return 0.484;
  if (weather === "MUA_DAM") return 0.415;
  return null;
}
