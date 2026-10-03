/**
 * Độ ấm của ổ bánh — liên tục và tất định (T5: không roll).
 *   ngoài lò: `warmth -= coolRate · dt` (nhanh hơn khi mưa) · lúc ĐƯA: `< 0,55` → `BURNT_OR_COLD`
 *
 * Nguội tính cho MỌI ổ đã ra lò, cầm tay hay gác thớt đều như nhau. Tín hiệu người chơi thấy
 * KHÔNG phải con số: hơi khói trên ổ, tắt hẳn khi đã nguội.
 *
 * ⚖️ `COOL_RATE` 0,0173 → 0,0075 (60 s; dưới dải 0,012–0,025 của P1-01 §5, cố ý). Ở 26 s thì nướng
 * sẵn một lô là một cái BẪY chứ không phải chiến thuật — ổ thứ ba của lô chạm 24–26 s trước khi
 * tới tay khách, nên cách chơi tối ưu thành nướng từng ổ một, ngược hẳn với cái lò ba ngăn.
 *
 * ⚠️ Chỉ đổi `COOL_RATE`; `WARM_OK`, hệ số mưa và trục cháy không đụng tới. Dưới ~0,005 thì cái
 * đồng hồ này không còn ép ai làm gì nữa.
 */
import type { Weather } from "../core/types";

export const COOL_RATE = 0.0075;
export const WARM_OK = 0.55;
const RAIN_COOL_MUL = 1.4;

export function cool(warmth: number, dt: number, weather: Weather = "NANG_GAT") {
  return Math.max(0, warmth - COOL_RATE * (weather === "MUA_RAO" || weather === "MUA_DAM" ? RAIN_COOL_MUL : 1) * dt);
}

export const isWarm = (warmth: number) => warmth >= WARM_OK;
