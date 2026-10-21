/**
 * Sáu bữa đầu nhẹ tay: cùng số khách, nhưng ít người đứng cùng lúc (`peak`), chờ lâu hơn
 * (`patience`), không quay đầu (`balk`), gọi món đơn giản (`mon` + `fuss`). Ngày 7 trở đi mọi hệ số bằng 1.
 * Chỉ bóp khách vãng lai; người có tên giữ nguyên. Bảng menu không đổi.
 */
import type { MenuItemId } from "./menu";

/** Hết ngày này là hết đỡ. Ngày 7 trở đi `easeOf` trả về hàng TOÀN 1. */
export const EASE_LAST_DAY = 6;

export type Ease = {
  /** Mấy món khách vãng lai gọi được. Người có tên không đọc trường này (luật 2). */
  mon: readonly MenuItemId[];
  /** 0 = không ai dặn thêm gì ("Cho một ổ chả lụa.") · 1 = dặn đủ kiểu như ngày thường. */
  fuss: number;
  peak: number;
  patience: number;
  balk: number;
};

/**
 * MÓN MỞ DẦN. Ngày 1 chỉ hai thứ nhân — pate với chả lụa, hai thứ không cần nấu, quết với
 * kẹp là xong. Rồi thêm MỘT thứ mỗi bữa, theo đúng thứ tự khó lên:
 *
 *   1  pate · chả lụa          hai nhân, học cái thớt
 *   2  + thịt nguội            ba nhân cùng loại thao tác
 *   3  + đầy đủ                ổ ba nhân một lượt (pate + thịt + chả lụa — đã quen cả ba)
 *   4  + xíu mại               món có nước, hũ riêng
 *   5  + ốp la                 món phải chiên
 *   6  + bánh mì không         BẪY: khách không nói nhân nào, người mới tưởng họ quên
 *
 * "Bánh mì không" để sau cùng vì nó là cái bẫy lớn nhất của người chơi mới: tới ngày 6 thì
 * người ta đã đọc bảng menu đủ lâu để hiểu.
 */
const MON: readonly MenuItemId[][] = [
  ["pate", "chalua"],
  ["pate", "chalua", "thit"],
  ["pate", "chalua", "thit", "daydu"],
  ["pate", "chalua", "thit", "daydu", "xiumai"],
  ["pate", "chalua", "thit", "daydu", "xiumai", "opla"],
  ["pate", "chalua", "thit", "daydu", "xiumai", "opla", "khong"],
];

/** Sáu hàng cho sáu ngày; `peak` lớn hơn `PEAK_CAP` thì không có tác dụng. */
const ROWS: readonly Omit<Ease, "mon">[] = [
  { fuss: 0,    peak: 1, patience: 1.60, balk: 0    },
  { fuss: 0.30, peak: 1, patience: 1.45, balk: 0    },
  { fuss: 0.55, peak: 2, patience: 1.30, balk: 0.40 },
  { fuss: 0.75, peak: 2, patience: 1.20, balk: 0.60 },
  { fuss: 0.90, peak: 3, patience: 1.10, balk: 0.80 },
  { fuss: 1,    peak: 3, patience: 1.05, balk: 1    },
];

/** Hàng "ngày thường": mọi hệ số bằng 1, cả bảy món. Đây là cái game vốn có. */
const FULL: Ease = { mon: MON[MON.length - 1], fuss: 1, peak: 99, patience: 1, balk: 1 };

/**
 * `day` không truyền (hoặc ngoài khoảng 1…6) → hàng ngày thường. Nhận `undefined` là cố ý:
 * có chỗ gọi KHÔNG biết hôm nay ngày mấy (mấy lưới đo ở `tests/`), và chúng phải đọc cái
 * đơn THẬT, không đọc đơn đang được đỡ.
 */
export function easeOf(day?: number): Ease {
  if (day === undefined || !(day >= 1) || day > EASE_LAST_DAY) return FULL;
  const i = Math.floor(day) - 1;
  return { mon: MON[i], ...ROWS[i] };
}

/** Trần số khách vãng lai cùng đứng ở quầy. */
export const PEAK_CAP = 3;

/** Quá trần thì `Service.spawn` dời lượt ghé một phút. Không giới hạn thời gian → 1. */
export const peakCap = (day: number, noTimePressure: boolean) =>
  (noTimePressure ? 1 : Math.min(PEAK_CAP, easeOf(day).peak));
export const easePatience = (day?: number) => easeOf(day).patience;
export const easeBalk = (day?: number) => easeOf(day).balk;
