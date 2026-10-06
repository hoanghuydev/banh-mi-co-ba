/**
 * BẢNG MENU TREO VÁCH — "ổ nào có gì", và chỉ có MỘT bảng.
 *
 * Trước file này món ăn không có TÊN: một đơn hàng là một tổ hợp nguyên liệu, nên
 * `nhan: ["xiumai"]` làm ra ổ bánh mì xíu mại KHÔNG CÓ PATE, và `tierOf` tính tiền bằng
 * cách ĐẾM số nhân — hễ quết thêm miếng pate cho đúng đời thật là giá tự nhảy một bậc.
 * Hai chuyện đó cùng một gốc: không có chỗ nào khai "bánh mì xíu mại LÀ gì".
 *
 * Đây là chỗ đó. Khách gọi TÊN MÓN, món khai nhân của nó, lời dặn thêm ("cho ít rau",
 * "không hành", "cho nhiều xíu mại") chỉ còn là phần SỬA trên nền ấy. Nhờ vậy tấm bảng
 * người chơi đọc ở vách (`ui/menu/MenuBoardView`) và tấm bảng `diffDish` chấm điểm là
 * CÙNG MỘT dữ liệu: không còn chỗ nào để lệch.
 *
 * ⚠️ Tầng dưới cùng của chuỗi món ăn: chỉ nhập KIỂU từ `order.ts` và `econ.ts` (bị xoá lúc
 * biên dịch), không nhập giá trị — `order.ts` nhập ngược lại file này. Thêm một `import`
 * thường vào đây là một vòng lặp module lúc chạy.
 */
import type { Ingredient } from "./order";
import type { Tier } from "./econ";
import MENU_JSON from "../content/recipes/menu.json";

export type MenuItemId = "thit" | "chalua" | "xiumai" | "opla" | "pate" | "daydu" | "khong";

export type MenuItem = {
  id: MenuItemId;
  /** Tên ghi trên bảng: "bánh mì xíu mại". */
  name: string;
  /** Khúc khách gọi ra miệng: "Cho một ổ **xíu mại**". Khác `name` vì không ai nói đủ chữ "bánh mì". */
  call: string;
  /** Bậc giá, tra sang `econ.json: menu_k`. Tiền chỉ có một nguồn. */
  tier: Tier;
  /**
   * Có ghi lên tấm bảng không. Mặc định CÓ; `false` là món vẫn gọi được nhưng không ai
   * viết nó lên bảng — xe nào cũng bán bánh mì không mà chẳng xe nào ghi nó ra.
   *
   * ⚠️ Đây là cờ HIỂN THỊ, không phải cờ tồn tại: `levelsOf`, `tierOf`, `diffDish` không
   * đọc nó. Giấu một món khỏi bảng không làm khách thôi gọi món đó.
   */
  onBoard?: boolean;
  /** NHÂN của món, theo phần. Thứ nào không có mặt ở đây là mức 0 — gọi tên món là đã nói cả hai vế. */
  nhan: Partial<Record<Ingredient, number>>;
  /** Dòng mô tả trên bảng — người chơi đọc để NHỚ, không phải để bấm. */
  note: string;
};

export type MenuTip = { say: string; means: string };
export type MenuDrink = { name: string; price: string; note: string };

type RawMenu = {
  rauNen: Record<string, number | string>;
  items: MenuItem[];
  them: { rows: MenuTip[] };
  nuoc: MenuDrink[];
};
const RAW = MENU_JSON as unknown as RawMenu;

/** Bỏ mấy khoá `_note` của người viết dữ liệu. */
const noMeta = <T>(o: Record<string, T | string>) =>
  Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith("_"))) as Record<string, T>;

/**
 * KHAY RAU của xe — ổ nào cũng rắc như nhau, nên nó KHÔNG thuộc về món nào.
 * "Rau đầy đủ" là mặc định nên không khách nào nói ra; họ chỉ nói khi muốn bớt.
 */
export const RAU_NEN: Readonly<Partial<Record<Ingredient, number>>> =
  noMeta<number>(RAW.rauNen) as Partial<Record<Ingredient, number>>;

/** Ba thứ co theo chữ "ít rau" — ớt và tương ớt KHÔNG, vì khách nói hai thứ đó riêng. */
export const RAU_CO_GIAN = ["dochua", "dualeo", "hanhngo"] as const;

/** Đúng thứ tự ghi trên bảng. Đổi thứ tự ở JSON là đổi thứ tự trên vách. */
export const MENU_ITEMS: readonly MenuItem[] = RAW.items;
export const MENU_IDS: readonly MenuItemId[] = MENU_ITEMS.map((i) => i.id);
const BY_ID = new Map(MENU_ITEMS.map((i) => [i.id, i]));

/**
 * MỖI id TRONG `MenuItemId` PHẢI CÓ MỘT DÒNG TRONG `menu.json`.
 *
 * Gỡ một món khỏi dữ liệu là `itemOf()` trả `undefined`, và chỗ vỡ không nằm ở đây mà là
 * `Cannot read properties of undefined (reading 'nhan')` ở giữa `levelsOf` — đã xảy ra
 * thật, 65 test đỏ cùng lúc mà không test nào chỉ được ra món nào biến mất.
 *
 * Muốn một món KHÔNG hiện trên bảng thì đặt `onBoard: false`, đừng xoá dòng: `content/arcs.ts`
 * gọi thẳng tên món trong đơn hàng viết tay của cả 40 ngày.
 */
const BAT_BUOC: readonly MenuItemId[] = ["thit", "chalua", "xiumai", "opla", "pate", "daydu", "khong"];
const THIEU = BAT_BUOC.filter((id) => !BY_ID.has(id));
if (THIEU.length) {
  throw new Error(
    `content/recipes/menu.json thiếu món: ${THIEU.join(", ")}. Mấy món này có đơn hàng viết ` +
    'tay trong content/arcs.ts nên không gỡ khỏi dữ liệu được — muốn giấu thì đặt "onBoard": false.',
  );
}

export const itemOf = (id: MenuItemId): MenuItem => BY_ID.get(id)!;

/**
 * Mấy món GHI TRÊN BẢNG — cái người chơi đọc. Khác `MENU_ITEMS` (mọi món gọi được) đúng
 * một chuyện: tấm bảng là thứ cô Ba viết ra, không phải bản kê khai đầy đủ.
 */
export const MENU_BOARD: readonly MenuItem[] = MENU_ITEMS.filter((i) => i.onBoard !== false);
/** Tên món để ghép vào câu log / câu thoại. */
export const monName = (id: MenuItemId) => itemOf(id).name;

/**
 * Nhân của một món, theo đúng thứ tự ghi trong JSON (pate trước — thứ tự xếp lớp).
 * Dùng khi phải CHỌN một thứ nhân để cho thêm (`themNhan` của `ORDER_CHANGE`).
 */
export const nhanOf = (id: MenuItemId): Ingredient[] => Object.keys(itemOf(id).nhan) as Ingredient[];

/** Lời dặn thêm bảng dạy người chơi — nửa thứ hai của tấm bảng. */
export const MENU_TIPS: readonly MenuTip[] = RAW.them.rows;
export const MENU_DRINKS: readonly MenuDrink[] = RAW.nuoc;

/** Ổ TRƠN: khay rau không chạm tới nó. "Bánh mì không" là ổ bánh, hết. */
export const isBare = (id: MenuItemId) => Object.keys(itemOf(id).nhan).length === 0;
