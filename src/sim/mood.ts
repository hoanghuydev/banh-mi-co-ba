/** Mood ngoài tầm kiểm soát, roll lúc spawn theo (ngày, người), không đọc hành động người chơi; chỉ đổi thoại/dáng/sức chờ, không đổi traitMul, salience, tiền. */
import type { Rng } from "../core/rng";
import type { Face } from "./reaction";

export type MoodCause = "NONE" | "SEP_MANG" | "MUA_UOT" | "DAU_OM" | "HET_TIEN" | "MET" | "TIN_VUI";
export type MoodProp = "NONE" | "MAT_LAM_LI" | "AO_UOT" | "TAY_BANG" | "VI_MONG" | "VAI_XUOI" | "AO_MOI";
export const MOOD_CAUSES: readonly MoodCause[] = ["NONE", "SEP_MANG", "MUA_UOT", "DAU_OM", "HET_TIEN", "MET", "TIN_VUI"];

const TABLE: { cause: MoodCause; prop: MoodProp; weight: number; delta: [number, number] }[] = [
  { cause: "NONE",     prop: "NONE",       weight: 62, delta: [0, 0] },
  { cause: "SEP_MANG", prop: "MAT_LAM_LI", weight: 9,  delta: [-45, -25] },
  { cause: "MUA_UOT",  prop: "AO_UOT",     weight: 8,  delta: [-30, -15] },
  { cause: "DAU_OM",   prop: "TAY_BANG",   weight: 6,  delta: [-35, -20] },
  { cause: "HET_TIEN", prop: "VI_MONG",    weight: 6,  delta: [-25, -10] },
  { cause: "MET",      prop: "VAI_XUOI",   weight: 5,  delta: [-20, -8] },
  { cause: "TIN_VUI",  prop: "AO_MOI",     weight: 4,  delta: [20, 40] },
];

export type Mood = { value: number; cause: MoodCause; prop: MoodProp };
export const CALM_MOOD: Mood = { value: 50, cause: "NONE", prop: "NONE" };

/** `rng` phải là dòng số riêng của (ngày, người); hai ngày đầu luôn bình thường. */
export function rollMood(rng: Rng, day: number): Mood {
  const r = rng.next(), d = rng.next();
  if (day < 3) return CALM_MOOD;
  const total = TABLE.reduce((a, b) => a + b.weight, 0);
  let x = r * total;
  const row = TABLE.find((t) => (x -= t.weight) < 0) ?? TABLE[0];
  const v = Math.round(row.delta[0] + (row.delta[1] - row.delta[0]) * d);
  return { value: Math.max(0, Math.min(100, 50 + v)), cause: row.cause, prop: row.prop };
}

/** Chỉ cho dev (`npc.mood`): ép một mood cụ thể để kiểm thứ tự THẤY → HIỂU → NGHE. */
export function moodOf(cause: MoodCause): Mood {
  const row = TABLE.find((t) => t.cause === cause) ?? TABLE[0];
  return { value: Math.max(0, Math.min(100, 50 + Math.round((row.delta[0] + row.delta[1]) / 2))), cause: row.cause, prop: row.prop };
}

/** Mặt nền nhìn từ xa trước khi tới quầy. */
export function moodBaseFace(m: Mood): Face | null {
  if (m.cause === "SEP_MANG" || m.cause === "DAU_OM") return [1, 3, 1];
  if (m.cause === "MET" || m.cause === "HET_TIEN") return [5, 4, 0];
  if (m.cause === "MUA_UOT") return [1, 1, 0];
  if (m.cause === "TIN_VUI") return [3, 5, 2];
  return null;
}

export const moodPatienceMul = (m: Mood) => (m.value < 35 ? 0.85 : m.value > 65 ? 1.1 : 1);
