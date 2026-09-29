/**
 * Preset công thức — P1-01 §2.6: biến thao tác lặp thành bài toán TUNING.
 *
 * Mỗi sáng có đúng 3 preset, mỗi cái có `prepped` phần đã chia sẵn. Áp preset là
 * đường tắt (một chạm thay cho mười chạm) — nhưng preset KHÔNG BAO GIỜ tự sửa theo lời
 * khách: khách dặn "không ớt" mà preset có ớt thì người chơi phải tự gỡ. Đó là T2.
 * Hết phần chia sẵn thì quay về làm tay, không bị chặn.
 */
import DEFAULTS from "../content/recipes/presets.default.json";
import { INGREDIENTS, type Ingredient } from "./order";

export type Preset = { id: string; name: string; dish: Partial<Record<Ingredient, number>>; prepped: number };

export const PRESETS_PER_DAY = 3;

export function defaultPresets(): Preset[] {
  return (DEFAULTS.presets as Preset[]).map((p) => ({ ...p, dish: { ...p.dish } }));
}

/** Preset → danh sách phần, đúng thứ tự xếp lớp (pate dưới cùng, sốt trên cùng). */
export function presetDish(p: Preset): Ingredient[] {
  const out: Ingredient[] = [];
  for (const ing of INGREDIENTS) for (let i = 0; i < (p.dish[ing.id] ?? 0); i++) out.push(ing.id);
  return out;
}

/** Sáng nào cũng chia lại đủ phần (P1-01 §2.6: prep buổi sáng). */
export function refillPresets(list: Preset[] | undefined): Preset[] {
  const base = defaultPresets();
  if (!list?.length) return base;
  return list.slice(0, PRESETS_PER_DAY).map((p, i) => ({ ...p, prepped: base[i]?.prepped ?? p.prepped }));
}
