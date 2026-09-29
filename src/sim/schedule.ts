/**
 * Lịch sinh hoạt NPC — P2-03 §2.9 (phần `base`; `overrides` + arc là việc của P2-03/P4).
 *
 * Ranh giới CANON §16 Đừng-1: KHÔNG mô phỏng ai đi làm. Mỗi người chỉ là một hàm xác
 * suất xuất hiện tại quầy: thứ nào · mấy giờ · lệch bao nhiêu · khả năng bao nhiêu.
 * Không ai ghé 100% số ngày (trần 0,98) — người chơi phải xây mô hình XÁC SUẤT.
 *
 * Game KHÔNG BAO GIỜ hiện lịch này ra (P2-03 §2.9 bảng ranh giới) — kiến thức về lịch
 * phải nằm trong đầu người chơi, ghi bằng chữ của người chơi vào sổ tay.
 */
import type { Rng } from "../core/rng";

export type Weekday = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
export const WEEKDAYS: readonly Weekday[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
export const WEEKDAY_VI: Record<Weekday, string> = {
  MON: "thứ Hai", TUE: "thứ Ba", WED: "thứ Tư", THU: "thứ Năm", FRI: "thứ Sáu", SAT: "thứ Bảy", SUN: "Chủ nhật",
};
export const WEEKDAYS_WORK: readonly Weekday[] = ["MON", "TUE", "WED", "THU", "FRI"];
export const EVERY_DAY = WEEKDAYS;

/**
 * Ngày 1 của mùa là THỨ HAI — lịch giá chợ, lịch thời tiết và bảng nghĩa vụ của P3 đều
 * đếm theo mốc này (P3-01 §2.4.4). (Ví dụ "ngày 12, thứ Tư" ở P2-03 §2.10 là bản cũ.)
 */
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
  /** 0..0,98. */
  probability: number;
};

export const PROBABILITY_CAP = 0.98;

/** Một lượt ghé hôm nay theo lịch, hoặc null nếu hôm nay không ghé. Rút từ stream `npc-schedule`. */
export function rollVisit(rules: readonly ScheduleRule[], day: number, rng: Rng, probMul = 1): number | null {
  const wd = weekdayOf(day);
  let hit: number | null = null;
  for (const r of rules) {
    // rút đủ 3 số cho MỌI rule dù không dùng — số lần rút không phụ thuộc kết quả (P0-02
    // §2.3), nếu không thì quan hệ của một người sẽ xê dịch giờ ghé của người kế tiếp
    const pass = rng.next(), a = rng.next(), b = rng.next();
    if (hit !== null || !r.days.includes(wd)) continue;
    if (pass >= Math.min(PROBABILITY_CAP, r.probability * probMul)) continue;
    hit = r.arriveMin + (a - b) * r.jitterMin;           // hiệu hai đều = tam giác
  }
  return hit;
}
