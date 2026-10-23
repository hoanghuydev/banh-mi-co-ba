// Tính cách chỉ đổi biến thể và cường độ hiển thị, không đổi kết quả món, tiền hay cốt truyện.
import type { Personality } from "../content/npcs";

/** Biên độ dáng và tầng biểu cảm. */
export const intensityMul = (p: Personality) => 0.5 + 1.0 * p.nongTinh;
/** Giây trước khi mặt trở về nền. */
export const faceHoldSec = (p: Personality) => 3.0 + 4.0 * p.deTha;
/** Giây trễ trước khi mặt/dáng phản ứng. */
export const reactionDelay = (p: Personality, jitter01: number) => 0.2 + 0.2 * jitter01 + (1 - p.nongTinh) * 0.25;

/** "Im lặng rồi biến mất": chỉ chị Trâm rơi vào ô này. */
export const isSilentGrudge = (p: Personality) => p.soi >= 0.7 && p.nongTinh <= 0.3 && p.thanThien <= 0.4;

export type Dim = "soi" | "nongTinh" | "deTha" | "thanThien";
/** Chiều cao nhất sau khi trừ trung bình. */
export function dominant(p: Personality): Dim {
  const dims: Dim[] = ["soi", "nongTinh", "deTha", "thanThien"];
  const mean = (p.soi + p.nongTinh + p.deTha + p.thanThien) / 4;
  let best: Dim = "soi", bv = -Infinity;
  for (const d of dims) if (p[d] - mean > bv) { bv = p[d] - mean; best = d; }
  return best;
}
