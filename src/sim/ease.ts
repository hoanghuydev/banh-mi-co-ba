/**
 * TẬP TAY — SÁU BỮA ĐẦU HẺM NHẸ TAY VỚI CÔ BA.
 *
 * Đo ngày 1 của bản dựng: 19 lượt ghé, 11 trong đó là khách vãng lai, và chín người rơi
 * vào khung `PEAK` 6h30–8h00 — tức 90 phút game = 180 giây thật = **20 giây một ổ**. Một ổ
 * bánh mì cần: lấy ổ ở kệ · nướng · gác lên thớt · quết pate · bỏ nhân · rau · gói. Người
 * chơi bữa đầu chưa biết phím nào ở đâu. Hai mươi giây là một bài kiểm tra, không phải một
 * buổi học.
 *
 * SỐ KHÁCH THÌ KHÔNG ĐỔI — vẫn đúng 19 người đó ghé. Cái đổi là họ không được phép ĐỨNG
 * CÙNG LÚC (`peak`), họ chờ được lâu hơn (`patience`), họ không quay đầu (`balk`), và cái
 * họ gọi là đơn hàng một mệnh đề (`mon` + `fuss`). Áp lực hạ xuống mà cuốn sổ không mất
 * một dòng doanh thu nào: bỏ bớt khách thì mất tiền, dàn khách ra thì không.
 *
 * File này là CHỖ DUY NHẤT nói "mấy bữa đầu nhẹ hơn bao nhiêu". Năm cái cần, mỗi cái gắn
 * vào đúng một chỗ ở hệ khác:
 *
 *   `mon`       `order.randomIntent` — khách VÃNG LAI hôm nay gọi được mấy món trên bảng
 *   `fuss`      `order.randomIntent` — nhân vào xác suất của mọi LỜI DẶN THÊM
 *   `peak`      `season.peakCap` — trần số khách vãng lai CÙNG đứng ở quầy
 *   `patience`  `day.standDeps` — nhân vào `patienceMul` (sức chờ của mọi khách)
 *   `balk`      `service.spawn` — nhân vào khả năng khách thấy hàng dài rồi quay đầu
 *
 * ⚠️ KHÔNG đụng tới MẬT ĐỘ KHÁCH và LÒ THAN — hai cần đó đã bị chủ dự án gạt ra, có lý do:
 *   · bỏ bớt dòng khách vãng lai làm `v.seq` đánh số lại, nên mọi `hub.derive("visit:{seq}")`
 *     lệch pha ⇒ ngày 1–6 thành một lượt rút khác hẳn, và save đang chơi dở không khớp;
 *   · lò thì `tools/audit-gain.ts` đo thành con số công khai của cây nâng cấp 1.800 nghìn,
 *     nới ngưỡng theo ngày là làm con số đó nói hai nghĩa.
 * Muốn nhẹ hơn nữa thì xoay năm cần dưới đây, đừng mở lại hai cái này.
 *
 * BỐN LUẬT, và luật 2 là cái dễ phá nhất:
 *
 * 1. **Chỉ tới ngày 6.** Ngày 7 trở đi mọi hệ số đều bằng 1, nghĩa là game KHÔNG đổi một li
 *    so với trước — mùa 40 ngày của P4-02, bảng cân bằng, mấy cái cổng mở khoá vẫn y nguyên.
 *    Vì vậy mọi test đang neo ở ngày 7/8 vẫn đo đúng cái nó đo.
 *
 * 2. **Không đụng tới NGƯỜI CÓ TÊN.** Bà Bảy vẫn gọi ổ thịt ít rau ngày 1, cô Mai vẫn hai ổ
 *    đầy đủ, ông Hải vẫn ốp la hai trứng — mấy câu đó là `content/arcs.ts`, là kịch bản, và
 *    gọt chúng đi là gọt mất buổi dạy nghề. Cái được bóp là ĐÁM ĐÔNG VÔ DANH: họ tới dày,
 *    họ không có câu nào riêng, và họ là chỗ người chơi mới ngộp.
 *
 * 3. **Không hiện ra, không ai nói ra.** Không có popup "đã mở khoá xíu mại", không có
 *    chữ "dễ" ở đâu. Người chơi chỉ thấy: bữa đầu hẻm vắng hơn, khách gọi mấy món đơn giản,
 *    rồi tự nó đông dần lên. Đúng T3 (CANON §6): không hiện chỉ số.
 *
 * 4. **Bảng menu KHÔNG đổi.** `menu.json` là tấm bảng cô Ba viết, treo đủ bảy món từ bữa đầu
 *    — vì người có tên GỌI mấy món đó ngay ngày 1. Cái co lại là ai-mua-gì, không phải xe
 *    bán gì. Giấu món khỏi bảng mà khách vẫn gọi là cách chắc chắn nhất để người chơi nghĩ
 *    game bị lỗi.
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
 * "Bánh mì không" để sau cùng là có chủ ý: P4-05 §2.7 A xếp nó là cái bẫy lớn nhất của
 * người chơi mới. Gặp nó ở ngày 6 thì người ta đã đọc bảng menu đủ lâu để hiểu.
 */
const MON: readonly MenuItemId[][] = [
  ["pate", "chalua"],
  ["pate", "chalua", "thit"],
  ["pate", "chalua", "thit", "daydu"],
  ["pate", "chalua", "thit", "daydu", "xiumai"],
  ["pate", "chalua", "thit", "daydu", "xiumai", "opla"],
  ["pate", "chalua", "thit", "daydu", "xiumai", "opla", "khong"],
];

/**
 * Sáu hàng cho sáu ngày. Đọc dọc từng cột thì thấy đường cong: cái gì cũng về 1 ở ngày 7,
 * không cái nào nhảy bậc quá một lần.
 *
 * ⚠️ `peak` là TRẦN THỨ HAI, không phải trần duy nhất: `season.peakCap` lấy `min` của nó và
 * `target.peak` viết tay trong `season/days.json`. Để số ở đây lớn hơn days.json là số đó
 * không có tác dụng gì — cố ý, vì file này chỉ được phép làm game NHẸ hơn.
 */
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
 * `makeUsual` có chỗ gọi KHÔNG biết hôm nay ngày mấy (`sim/night.ts` đối chiếu giả thuyết sổ
 * tay, mấy lưới đo ở `tests/`), và chúng phải đọc cái đơn THẬT, không đọc đơn đang được đỡ.
 */
export function easeOf(day?: number): Ease {
  if (day === undefined || !(day >= 1) || day > EASE_LAST_DAY) return FULL;
  const i = Math.floor(day) - 1;
  return { mon: MON[i], ...ROWS[i] };
}

export const easePeak = (day?: number) => easeOf(day).peak;
export const easePatience = (day?: number) => easeOf(day).patience;
export const easeBalk = (day?: number) => easeOf(day).balk;
