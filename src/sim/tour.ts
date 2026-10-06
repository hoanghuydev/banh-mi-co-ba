import type { SaveFile } from "../core/save";
import { BY_ID, type Ingredient } from "./order";

/**
 * DẪN BỮA ĐẦU — bảy việc của ngày 1, mỗi lúc chỉ một việc.
 *
 *   CHO   đi chợ            → xong khi rời chợ ra quán
 *   MENU  đọc bảng menu     → xong khi mở bảng (bấm E ở vách)
 *   BANH  lấy ổ bánh ở kệ   → xong khi trên tay có ổ nguội
 *   LO    nướng             → xong khi lấy được ổ ra khỏi lò
 *   THOT  gác ổ lên thớt    → xong khi bảng kẹp nhân mở ra
 *   NHAN  bỏ nhân           → xong khi bỏ được miếng đầu tiên
 *   GOI   gói lại           → xong khi ổ rời thớt lên tay
 *
 * Hiện ra bằng BONG BÓNG DẪN kiểu tour của web (`ui/tour/TourCoach`): khoanh tròn thứ cần bấm,
 * cô Ba hiện lên cạnh đó nói một câu, có nút "Bỏ qua".
 *
 * Ba luật, và cả ba đều là để nó KHÔNG thành một cái bảng nhiệm vụ:
 *
 * 1. **Chỉ ngày 1.** Qua ngày 2 mà chưa làm đủ thì thôi, im luôn. Không có dấu chấm than
 *    nào đeo theo người chơi tới ngày 7.
 * 2. **Bỏ qua được bất cứ lúc nào, một cú bấm.** Nút nằm ngay trên bong bóng, không nằm
 *    trong Cài đặt — ai đã biết chơi thì không phải đi tìm chỗ tắt.
 * 3. **Làm trước thì nhảy luôn.** Ai cầm ổ bánh lên trước khi kịp đọc bảng menu thì bước
 *    bảng menu coi như qua — không kéo người ta ngược về một việc họ đã vượt.
 *
 * Trạng thái nằm trong `flags` chứ không phải một trường riêng của `SaveFile`: nó đúng là
 * một cái cờ, và nhét vô đây thì save cũ đọc ra `undefined` → về bước đầu, khỏi migrate.
 */

export type TourStep = "CHO" | "MENU" | "BANH" | "LO" | "THOT" | "NHAN" | "GOI" | "XONG";

const ORDER: readonly TourStep[] = ["CHO", "MENU", "BANH", "LO", "THOT", "NHAN", "GOI", "XONG"];

/** Bao nhiêu việc cả thảy — để bong bóng dẫn ghi "3/7", người chơi biết còn bao xa. */
export const TOUR_TOTAL = ORDER.length - 1;

/** Việc thứ mấy (1…TOUR_TOTAL). `XONG` trả về TOUR_TOTAL. */
export function tourIndex(w: SaveFile): number {
  return Math.min(ORDER.indexOf(tourStep(w)) + 1, TOUR_TOTAL);
}

const KEY = "tour";

export function tourStep(w: SaveFile): TourStep {
  const v = w.flags?.[KEY];
  return typeof v === "string" && (ORDER as readonly string[]).includes(v) ? v as TourStep : "CHO";
}

/** Còn dẫn hay thôi. Luật 1: hết ngày 1 là hết dẫn, dù làm tới đâu. */
export function touring(w: SaveFile): boolean {
  return w.progress.dayIndex === 1 && tourStep(w) !== "XONG";
}

export function tourAt(w: SaveFile, step: TourStep): boolean {
  return touring(w) && tourStep(w) === step;
}

/** Bỏ ngang — nút "Bỏ qua" trên bong bóng dẫn. Không hỏi lại, không hiện lại. */
export function tourSkip(w: SaveFile): void {
  w.flags[KEY] = "XONG";
}

/**
 * Đánh dấu xong một việc. Luật 3: việc nằm SAU chỗ đang đứng thì nhảy thẳng tới sau nó;
 * việc đã qua rồi thì không làm gì (mở lại bảng menu lần hai không kéo ai về bước cũ).
 */
export function tourDone(w: SaveFile, step: TourStep): void {
  if (!touring(w)) return;
  const at = ORDER.indexOf(tourStep(w));
  const of = ORDER.indexOf(step);
  if (at > of) return;
  w.flags[KEY] = ORDER[of + 1] ?? "XONG";
}

/**
 * Còn THIẾU phần nào của một ổ bánh mì — để người dẫn nói đúng cái đang thiếu, thay vì đếm
 * "mới 2/4 thứ". Người ta không học ổ bánh bằng con số, người ta học bằng BA PHẦN:
 *
 *   pate  →  một thứ nhân mặn (thịt nguội, chả lụa, xíu mại, trứng)  →  rau
 *
 * Đây là KHUNG của một ổ, không phải công thức chấm điểm. Chấm điểm là việc của `diffDish`,
 * và nó so với đơn của người đang đứng chờ chứ không so với cái khung này.
 */
export type FillGap = "PATE" | "MAN" | "RAU" | null;

export function fillGap(stack: readonly Ingredient[]): FillGap {
  if (!stack.includes("pate")) return "PATE";
  if (!stack.some((id) => id !== "pate" && BY_ID.get(id)?.kind === "nhan")) return "MAN";
  if (!stack.some((id) => BY_ID.get(id)?.kind === "rau")) return "RAU";
  return null;
}
