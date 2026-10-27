/**
 * TỪ VỰNG DÙNG CHUNG — P2-09 §2.2.
 *
 * Trước file này, mỗi hệ tự giữ danh sách id của mình: `dialog/facts.ts` có `MACROS`,
 * `tools/validate-rules.ts` có một bản `MACROS` thứ hai chép tay, `sim/worldfacts.ts` có
 * `FACT_KEYS`/`FACT_FNS` viết tay lần thứ ba. Ba bản chép tay của cùng một danh sách là
 * ba chỗ để lệch, và nó đã lệch thật: `p.hasTea` có trong code mà không có trong bảng
 * §3.1 của P2-07 — lỗi được phát hiện bằng mắt người, sau khi hai bản rà kết luận sai.
 *
 * Từ đây mọi danh sách id nằm đúng MỘT chỗ: file này. Runtime đọc, validator đọc, test
 * đọc. Lệch được thì trình kiểm kiểu bắt.
 *
 * Thuần dữ liệu: không Phaser, không đọc file lúc chạy (JSON nhập tĩnh).
 */
import PURPOSES from "./npcs/purposes.json";

type RawPurposeFile = { states: { id: string }[]; purposes: { id: string }[] };
const RAW = PURPOSES as unknown as RawPurposeFile;

export const PURPOSE_IDS: readonly string[] = RAW.purposes.map((p) => p.id);
export const STATE_IDS: readonly string[] = RAW.states.map((s) => s.id);

export const HAND_IDS = [
  "empty", "loaf_cold", "loaf_hot", "loaf_burnt", "loaf_filled", "tea",
] as const;

/**
 * BẢY KHUNG CẢNH — P2-09 §2.5 (Versu / Evans: một câu chỉ CÓ NGHĨA trong một thực hành).
 *
 * Đây là cái thay cho kho `ANY`: `ANY` phải đúng trong 14 vai × 5 pha ≈ 70 ngữ cảnh, và
 * bản rà đếm được 13/33 nút của nó nhắc một trạng thái thế giới mà không đọc nó. Không
 * ai viết nổi 33 câu đúng trong 70 ngữ cảnh. Practice bảo đảm ngữ cảnh, câu chỉ còn phải
 * đúng trong MỘT cái.
 */
export const PRACTICE_IDS = [
  "DI_NGANG",
  "XEP_HANG",
  "GOI_MON",
  "DOI_BANH",
  "NAN_LAI",
  "QUAY_VANG",
  "NGHE_LOM",   // cảnh NPC↔NPC, người chơi là khán giả
] as const;
export type PracticeId = (typeof PRACTICE_IDS)[number];

/**
 * SÁU DRIVE — P2-09 §2.7 (Zubek: chấm điểm theo ĐỘ CHÊNH có suy giảm).
 *
 * Không phải "nhu cầu sống" kiểu The Sims — CANON §16 Đừng-1 cấm mô phỏng đời sống NPC
 * ngoài quầy. Đây chỉ là *lúc này người đó muốn một cuộc trao đổi kiểu gì*, và nó chỉ
 * được dùng để chọn CHUYỆN ĐỂ NÓI, không bao giờ để chọn CHỖ ĐỂ ĐI.
 */
export const DRIVE_IDS = [
  "DUOC_PHUC_VU",  // tôi đang đợi, làm ơn lo cho tôi trước
  "KE_CHUYEN",     // tôi có chuyện muốn kể
  "DUOC_HOI",      // tôi muốn có người hỏi han
  "PHAN_NAN",      // tôi đang bực một chuyện
  "YEN_THAN",      // để tôi yên
  "VIEC_RIENG",    // tôi còn việc, tôi phải đi
] as const;
export type DriveId = (typeof DRIVE_IDS)[number];

/**
 * VIỆC ĐÃ HỨA — P2-09 §2.6. Khác `PROMISE` (món kẹp vô ổ, kiểm lúc đưa bánh): đây là
 * việc LÀM, có hạn tính bằng giây thật, và có đường nuốt lời ba nấc.
 */
export const DEED_IDS = [
  "ROT_TRA",     // rót cho họ ly trà đá
  "DUA_BANH",    // đưa cho họ miếng/ổ bánh
  "LAY_SO",      // chạy đi lấy giùm cuốn sổ
  "DOI_DON",     // sửa lại đơn cho họ
] as const;
export type DeedId = (typeof DEED_IDS)[number];

/**
 * KHUNG GIỜ ĐỌC ĐƯỢC — khác `timeSlot` (mật độ khách) ở chỗ nó nói về BUỔI.
 *
 * Bản rà đòi khoá này ở ba chỗ (`any.chao` 1.1.1 "nay ra sớm ha", `any.troi` 2.2 "chút
 * nữa chắc nắng", `duong.voi` 5.1 "gần bảy giờ rồi") và §3.4 của P2-07 không có gì cho
 * nó: `w.peak` là mật độ khách, không phải buổi. Ngày game chỉ có 06:00–11:00.
 */
export const BAND_IDS = ["SOM", "SANG", "TRUA"] as const;
export type BandId = (typeof BAND_IDS)[number];

export function bandOfMinutes(min: number): BandId {
  return min < 7 * 60 + 30 ? "SOM" : min < 9 * 60 + 30 ? "SANG" : "TRUA";
}
