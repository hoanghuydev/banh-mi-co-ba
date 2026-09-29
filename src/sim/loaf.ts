/**
 * Độ ấm của ổ bánh — P1-01 §2.4. Liên tục và tất định (T5: không roll).
 *
 *   ngoài lò:  warmth -= coolRate · dt      (nhanh hơn khi mưa)
 *   lúc ĐƯA:   warmth < 0,55  →  BURNT_OR_COLD, salience 80, "bánh nguội ngắt"
 *
 * t_nguội ≈ (1 − 0,55) / 0,0173 ≈ 26 s. Nguội tính cho MỌI ổ đã ra lò — cầm trên tay
 * hay gác trên thớt đều nguội như nhau. Chính vì thế gác ổ lại để đi làm việc khác
 * không miễn phí: đi lâu quá là về kẹp một ổ nguội.
 *
 * Tín hiệu người chơi thấy KHÔNG phải con số: hơi khói trên ổ, TẮT HẲN khi ổ đã nguội
 * (P1-01 §4 — "tắt khói là tín hiệu, không phải thiếu hiệu ứng").
 */
import type { Weather } from "../core/types";

export const COOL_RATE = 0.0173;
export const WARM_OK = 0.55;
const RAIN_COOL_MUL = 1.4;

export function cool(warmth: number, dt: number, weather: Weather = "NANG") {
  return Math.max(0, warmth - COOL_RATE * (weather === "MUA" ? RAIN_COOL_MUL : 1) * dt);
}

export const isWarm = (warmth: number) => warmth >= WARM_OK;
