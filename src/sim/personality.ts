/**
 * Bốn chiều tính cách → các con số hệ khác dùng — P2-02 §2.1. Đây là chỗ DUY NHẤT
 * suy ra hệ số từ tính cách; tune ở đây rồi mọi hệ đi theo.
 *
 * Bốn chiều KHÔNG chạm vào: ra đúng món không, tiền có vào túi không, cốt truyện có
 * mở không (CANON §16 Đừng-3). Chúng đổi biến thể, cường độ hiển thị — không đổi
 * CATEGORY của hệ quả.
 *
 * `traitMul` (perception) KHÔNG ở đây: CANON §4 chốt `0,65 + 0,70·soi` (perception.ts).
 */
import type { Personality } from "../content/npcs";

/** Cường độ phản ứng: biên độ dáng, tầng biểu cảm. Ông Hải 1,40 · chị Lan 0,60. */
export const intensityMul = (p: Personality) => 0.5 + 1.0 * p.nongTinh;
/** Mặt trở về nền sau `3,0 + deTha·4,0` giây (P2-02 §3.1 quy ước 2). */
export const faceHoldSec = (p: Personality) => 3.0 + 4.0 * p.deTha;
/**
 * Độ trễ phản ứng (mặt, dáng) — P2-02 §5.3: sàn 0,20 + jitter 0..0,20 + điềm đạm chậm hơn
 * tới 0,25. Người chơi học được AI QUAY ĐẦU TRƯỚC. Lời nói cộng thêm 0,2–0,8 s.
 */
export const reactionDelay = (p: Personality, jitter01: number) => 0.2 + 0.2 * jitter01 + (1 - p.nongTinh) * 0.25;

/**
 * "Im lặng rồi biến mất" — ô số 8 (CANON §4): soi cao VÀ nóng thấp VÀ khép kín.
 * CANON chỉ cấp ô này cho ĐÚNG MỘT người có tên: chị Lan.
 */
export const isSilentGrudge = (p: Personality) => p.soi >= 0.7 && p.nongTinh <= 0.3 && p.thanThien <= 0.4;

export type Dim = "soi" | "nongTinh" | "deTha" | "thanThien";
/** Chiều TRỘI = chiều cao nhất sau khi trừ trung bình (P2-02 §3.1). */
export function dominant(p: Personality): Dim {
  const dims: Dim[] = ["soi", "nongTinh", "deTha", "thanThien"];
  const mean = (p.soi + p.nongTinh + p.deTha + p.thanThien) / 4;
  let best: Dim = "soi", bv = -Infinity;
  for (const d of dims) if (p[d] - mean > bv) { bv = p[d] - mean; best = d; }
  return best;
}
