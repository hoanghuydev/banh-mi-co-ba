// Số lượt khách của một buổi bán: sao gần đây → hệ số khách → số người ghé.
import type { SaveFile } from "../core/save";
import { Rng, fnv1a, splitmix32 } from "../core/rng";
import { CAL, crowdMul, isRain, weatherOf } from "./econ";
import { has, walkInMul } from "./equipment";

/** Khách nền ngày 1; cộng 1 sau mỗi `STEP_DAYS` ngày, tới `BASE_CAP` thì dừng — quầy không phục vụ nổi hơn. */
const BASE_DAY1 = 14;
const STEP_DAYS = 5;
const BASE_CAP = 25;

/** Hệ số khách ở 1★…5★; giữa hai mốc thì nội suy thẳng. */
const R_BY_STAR = [0.2, 0.4, 0.7, 1.2, 1.3];

/** Chỉ sao trong chừng này ngày nuôi hệ số khách; app Đánh giá vẫn hiện sao trọn đời. */
export const STAR_WINDOW_DAYS = 30;

/** Chưa đủ chừng này đánh giá thì quán chưa có tiếng: hệ số 1. */
export const STAR_MIN_REVIEWS = 10;

/** Nhiễu ±10%. */
const NOISE = 0.1;

/** Sao trung bình trong cửa sổ; `null` = chưa đủ đánh giá. */
export function recentStars(w: SaveFile, days = STAR_WINDOW_DAYS): number | null {
  const from = w.progress.dayIndex - days;
  const l = w.reviews.list.filter((r) => r.day > from);
  return l.length >= STAR_MIN_REVIEWS ? l.reduce((a, r) => a + r.stars, 0) / l.length : null;
}

/** 3,7★ → 0,90. */
export function crowdFactor(stars: number | null): number {
  if (stars === null) return 1;
  const x = Math.min(5, Math.max(1, stars));
  const i = Math.min(3, Math.floor(x) - 1);
  return R_BY_STAR[i] + (R_BY_STAR[i + 1] - R_BY_STAR[i]) * (x - (i + 1));
}

export const baseGuests = (day: number) =>
  Math.min(BASE_CAP, BASE_DAY1 + Math.floor((Math.max(1, day) - 1) / STEP_DAYS));

/** Số lượt khách dự kiến: nền theo ngày × sao × trời × sự kiện × đồ nghề, nhiễu ±10%. */
export function guestsOf(w: SaveFile, day = w.progress.dayIndex): number {
  const wx = weatherOf(day);
  const loaOn = has(w.equipment, "LOA_RAO") && (w.econ?.loaOffUntil ?? 0) < day;
  const m = baseGuests(day)
    * crowdFactor(recentStars(w))
    * CAL.weatherInfo[wx].walkIn
    * crowdMul(day)
    * walkInMul(w.equipment, isRain(wx), wx === "NANG_GAT", loaOn);
  const rng = new Rng(splitmix32(fnv1a(`${w.saveId}|guests|${day}`)));
  return Math.max(1, Math.round(m * (1 + (rng.next() * 2 - 1) * NOISE)));
}
