// ⚠️ Chỉ `import type` từ `order.ts`/`econ.ts` — `order.ts` nhập ngược file này, import thường là vòng lặp module.
import type { Ingredient } from "./order";
import type { Tier } from "./econ";
import MENU_JSON from "../content/recipes/menu.json";

export type MenuItemId = "thit" | "chalua" | "xiumai" | "opla" | "pate" | "daydu" | "khong";

export type MenuItem = {
  id: MenuItemId;
  name: string;
  /** Khúc khách gọi ra miệng: "Cho một ổ **xíu mại**". */
  call: string;
  /** Bậc giá, tra sang `econ.json: menu_k`. */
  tier: Tier;
  /** Cờ HIỂN THỊ (mặc định có): `false` vẫn gọi được, chỉ không ghi lên bảng. */
  onBoard?: boolean;
  /** NHÂN theo phần; thứ không có mặt là mức 0. */
  nhan: Partial<Record<Ingredient, number>>;
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

const noMeta = <T>(o: Record<string, T | string>) =>
  Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith("_"))) as Record<string, T>;

/** Khay rau ổ nào cũng rắc như nhau, không thuộc món nào. */
export const RAU_NEN: Readonly<Partial<Record<Ingredient, number>>> =
  noMeta<number>(RAW.rauNen) as Partial<Record<Ingredient, number>>;

/** Ba thứ co theo chữ "ít rau" — ớt và tương ớt KHÔNG, vì khách nói hai thứ đó riêng. */
export const RAU_CO_GIAN = ["dochua", "dualeo", "hanhngo"] as const;

/** Đúng thứ tự ghi trên bảng. */
export const MENU_ITEMS: readonly MenuItem[] = RAW.items;
export const MENU_IDS: readonly MenuItemId[] = MENU_ITEMS.map((i) => i.id);
const BY_ID = new Map(MENU_ITEMS.map((i) => [i.id, i]));

// Thiếu món trong JSON thì `itemOf()` trả undefined và vỡ xa tận `levelsOf`, nên chặn sớm.
const BAT_BUOC: readonly MenuItemId[] = ["thit", "chalua", "xiumai", "opla", "pate", "daydu", "khong"];
const THIEU = BAT_BUOC.filter((id) => !BY_ID.has(id));
if (THIEU.length) {
  throw new Error(
    `content/recipes/menu.json thiếu món: ${THIEU.join(", ")}. Code gọi thẳng tên mấy món này ` +
    'nên không gỡ khỏi dữ liệu được — muốn giấu thì đặt "onBoard": false.',
  );
}

export const itemOf = (id: MenuItemId): MenuItem => BY_ID.get(id)!;

export const MENU_BOARD: readonly MenuItem[] = MENU_ITEMS.filter((i) => i.onBoard !== false);
export const monName = (id: MenuItemId) => itemOf(id).name;

/** Theo thứ tự xếp lớp trong JSON (pate trước). */
export const nhanOf = (id: MenuItemId): Ingredient[] => Object.keys(itemOf(id).nhan) as Ingredient[];

export const MENU_TIPS: readonly MenuTip[] = RAW.them.rows;
export const MENU_DRINKS: readonly MenuDrink[] = RAW.nuoc;

/** Ổ trơn: khay rau không chạm tới. */
export const isBare = (id: MenuItemId) => Object.keys(itemOf(id).nhan).length === 0;
