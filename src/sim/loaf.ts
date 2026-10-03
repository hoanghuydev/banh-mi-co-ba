/**
 * Độ ấm của ổ bánh — P1-01 §2.4. Liên tục và tất định (T5: không roll).
 *
 *   ngoài lò:  warmth -= coolRate · dt      (nhanh hơn khi mưa)
 *   lúc ĐƯA:   warmth < 0,55  →  BURNT_OR_COLD, salience 80, "bánh nguội ngắt"
 *
 * t_nguội = (1 − 0,55) / 0,0075 = 60 s chẵn. Nguội tính cho MỌI ổ đã ra lò — cầm trên
 * tay hay gác trên thớt đều nguội như nhau. Gác ổ lại để đi làm việc khác vẫn KHÔNG
 * miễn phí: đi lâu quá là về kẹp một ổ nguội, chỉ là cái "lâu quá" đó giờ đo bằng một
 * phút chứ không phải hai mươi sáu giây.
 *
 * Tín hiệu người chơi thấy KHÔNG phải con số: hơi khói trên ổ, TẮT HẲN khi ổ đã nguội
 * (P1-01 §4 — "tắt khói là tín hiệu, không phải thiếu hiệu ứng").
 *
 * ⚖️ CÂN BẰNG — `COOL_RATE` 0,0173 → 0,0075 (chờ người thiết kế duyệt lại con số này;
 * nó nằm DƯỚI dải 0,012–0,025 của P1-01 §5, cố ý).
 *
 * Vì sao đổi: lò có ba ngăn và docstring của `sim/oven.ts` hứa "bỏ ổ vào rồi đi làm
 * việc khác được", nhưng ở 26 s thì nướng sẵn một lô rồi gác lên thớt/quầy là một cái
 * BẪY, không phải một chiến thuật. Đo bằng vòng phục vụ ngắn nhất của chính file đó
 * (7,4–8,5 s/khách): ổ thứ ba trong lô ra lò xong phải nằm chờ hết hai vòng ≈ 17 s,
 * cộng quãng đi lò→thớt→quầy và ba nhịp gói là chạm 24–26 s — đúng bằng cả đồng hồ.
 * Nói cách khác, cách chơi "nướng trước cho đỡ cuống" bị phạt gần như chắc chắn, nên
 * cách chơi tối ưu là nướng từng ổ một theo từng khách: ngược hẳn với cái lò ba ngăn.
 *
 * Ở 60 s, lô ba ổ đi hết ba vòng phục vụ (~25 s) vẫn còn hơn một nửa đồng hồ, dư cho
 * một việc vặt xen vào (rửa tay 3 s, rót trà 0,6 s, lau thớt) mà không mất ổ nào. Vẫn
 * mất ổ nếu bỏ quên thật: nướng sẵn đầu giờ rồi đứng nói chuyện hai phút là nguội hết.
 *
 * Đổi CÁI GÌ: chỉ `COOL_RATE`. `WARM_OK` và hệ số mưa giữ nguyên, nên ngưỡng "nguội"
 * và chuyện mưa làm nguội nhanh hơn không đổi một li — mưa giờ là 42,9 s thay vì 18,4 s.
 * Trục cháy (`sim/oven.ts`) hoàn toàn không đụng tới: quá tay vẫn cháy, vẫn mất trắng.
 *
 * Muốn chỉnh lại: lớn hơn = ổ nguội nhanh hơn, nướng sẵn thành bẫy trở lại; nhỏ hơn =
 * độ ấm thôi còn là một trục để tính toán. Dưới ~0,005 (90 s) thì cả cái đồng hồ này
 * không còn ép ai làm gì nữa.
 */
import type { Weather } from "../core/types";

export const COOL_RATE = 0.0075;
export const WARM_OK = 0.55;
const RAIN_COOL_MUL = 1.4;

export function cool(warmth: number, dt: number, weather: Weather = "NANG_GAT") {
  return Math.max(0, warmth - COOL_RATE * (weather === "MUA_RAO" || weather === "MUA_DAM" ? RAIN_COOL_MUL : 1) * dt);
}

export const isWarm = (warmth: number) => warmth >= WARM_OK;
