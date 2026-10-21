/** Độ ấm ổ bánh: nguội tuyến tính cho mọi ổ đã ra lò (nhanh hơn khi mưa); dưới `WARM_OK` lúc đưa là `BURNT_OR_COLD`. */
import type { Weather } from "../core/types";

// 0,0075 cố ý chậm: nhanh hơn thì nướng sẵn cả lô thành bẫy thay vì chiến thuật.
export const COOL_RATE = 0.0075;
export const WARM_OK = 0.55;
const RAIN_COOL_MUL = 1.4;

export function cool(warmth: number, dt: number, weather: Weather = "NANG_GAT") {
  return Math.max(0, warmth - COOL_RATE * (weather === "MUA_RAO" || weather === "MUA_DAM" ? RAIN_COOL_MUL : 1) * dt);
}

export const isWarm = (warmth: number) => warmth >= WARM_OK;
