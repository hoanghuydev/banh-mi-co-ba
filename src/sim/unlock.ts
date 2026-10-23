import { MENU_ITEMS, type MenuItem, type MenuItemId } from "./menu";
import { GOOD_IDS, goodsFor, type GoodId } from "./econ";
import { INGREDIENTS, type Ingredient, type IngredientInfo } from "./order";

export const LAST_UNLOCK_DAY = Math.max(...MENU_ITEMS.map((i) => i.unlockDay));

export const isOpen = (id: MenuItemId, day: number) => MENU_ITEMS.some((i) => i.id === id && i.unlockDay <= day);

export const openMenu = (day: number): MenuItem[] => MENU_ITEMS.filter((i) => i.unlockDay <= day);

/** Món lên bảng đúng ngày này. */
export const openedOn = (day: number): MenuItem[] => MENU_ITEMS.filter((i) => i.unlockDay === day);

/** Nhân chỉ có mặt trong món chưa mở thì chưa mở; rau, sốt không thuộc món nào nên luôn mở. */
function ingredientOpen(ing: Ingredient, day: number) {
  const users = MENU_ITEMS.filter((i) => ing in i.nhan);
  return !users.length || users.some((i) => i.unlockDay <= day);
}

const ING_OF = new Map<GoodId, Ingredient[]>(GOOD_IDS.map((g) => [g, []]));
for (const ing of new Set(MENU_ITEMS.flatMap((i) => Object.keys(i.nhan) as Ingredient[]))) {
  for (const g of goodsFor(ing)) ING_OF.get(g)!.push(ing);
}

/** Hàng không làm nhân nào (bánh mì, rau, sốt) hoặc có ít nhất một nhân đã mở thì nhập được. */
export function goodOpen(g: GoodId, day: number) {
  const ings = ING_OF.get(g)!;
  return !ings.length || ings.some((i) => ingredientOpen(i, day));
}

/** Nhân đã mở theo món trên bảng; rau, sốt luôn có. */
export const openIngredients = (day: number): IngredientInfo[] =>
  INGREDIENTS.filter((i) => i.kind !== "nhan" || ingredientOpen(i.id, day));
