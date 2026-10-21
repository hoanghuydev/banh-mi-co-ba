// Lịch NPC chỉ là xác suất xuất hiện tại quầy, không mô phỏng ai đi làm; game không bao giờ hiện lịch này ra.
import type { Rng } from "../core/rng";

export type Weekday = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
export const WEEKDAYS: readonly Weekday[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
export const WEEKDAY_VI: Record<Weekday, string> = {
  MON: "thứ Hai", TUE: "thứ Ba", WED: "thứ Tư", THU: "thứ Năm", FRI: "thứ Sáu", SAT: "thứ Bảy", SUN: "Chủ nhật",
};
export const WEEKDAYS_WORK: readonly Weekday[] = ["MON", "TUE", "WED", "THU", "FRI"];
export const EVERY_DAY = WEEKDAYS;

/** Ngày 1 của ván là THỨ HAI; giá chợ, thời tiết, nghĩa vụ đều đếm theo mốc này. */
const DAY1_INDEX = 0;
export function weekdayOf(day: number): Weekday {
  return WEEKDAYS[(((day - 1 + DAY1_INDEX) % 7) + 7) % 7];
}

export type ScheduleRule = {
  days: readonly Weekday[];
  /** Phút trong ngày — 6*60+45 = 405. */
  arriveMin: number;
  /** ±, phân phối TAM GIÁC quanh `arriveMin`. */
  jitterMin: number;
  probability: number;
};

export const PROBABILITY_CAP = 0.98;

export function rollVisit(rules: readonly ScheduleRule[], day: number, rng: Rng, probMul = 1): number | null {
  const wd = weekdayOf(day);
  let hit: number | null = null;
  for (const r of rules) {
    // Rút đủ 3 số cho MỌI rule để số lần rút không phụ thuộc kết quả.
    const pass = rng.next(), a = rng.next(), b = rng.next();
    if (hit !== null || !r.days.includes(wd)) continue;
    if (pass >= Math.min(PROBABILITY_CAP, r.probability * probMul)) continue;
    hit = r.arriveMin + (a - b) * r.jitterMin;           // hiệu hai đều = tam giác
  }
  return hit;
}
