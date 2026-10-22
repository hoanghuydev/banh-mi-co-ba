// Sáu bữa đầu nhẹ tay, chỉ cho khách vãng lai; ngày 7 trở đi mọi hệ số bằng 1.
export const EASE_LAST_DAY = 6;

export type Ease = {
  /** 0 = không ai dặn thêm gì · 1 = dặn đủ kiểu như ngày thường. */
  fuss: number;
  peak: number;
  patience: number;
  balk: number;
};

/** `peak` lớn hơn `PEAK_CAP` thì không có tác dụng. */
const ROWS: readonly Ease[] = [
  { fuss: 0,    peak: 1, patience: 1.60, balk: 0    },
  { fuss: 0.30, peak: 1, patience: 1.45, balk: 0    },
  { fuss: 0.55, peak: 2, patience: 1.30, balk: 0.40 },
  { fuss: 0.75, peak: 2, patience: 1.20, balk: 0.60 },
  { fuss: 0.90, peak: 3, patience: 1.10, balk: 0.80 },
  { fuss: 1,    peak: 3, patience: 1.05, balk: 1    },
];

const FULL: Ease = { fuss: 1, peak: 99, patience: 1, balk: 1 };

/** `day` không truyền → hàng ngày thường, cố ý cho chỗ gọi không biết hôm nay ngày mấy. */
export function easeOf(day?: number): Ease {
  if (day === undefined || !(day >= 1) || day > EASE_LAST_DAY) return FULL;
  const i = Math.floor(day) - 1;
  return ROWS[i];
}

/** Trần số khách vãng lai cùng đứng ở quầy. */
export const PEAK_CAP = 3;

/** Không giới hạn thời gian → 1. */
export const peakCap = (day: number, noTimePressure: boolean) =>
  (noTimePressure ? 1 : Math.min(PEAK_CAP, easeOf(day).peak));
export const easePatience = (day?: number) => easeOf(day).patience;
export const easeBalk = (day?: number) => easeOf(day).balk;
