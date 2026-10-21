/** Mỗi sáng 3 preset có phần chia sẵn; preset không tự sửa theo lời dặn của khách, hết phần thì làm tay. */
import DEFAULTS from "../content/recipes/presets.default.json";
import { INGREDIENTS, type Ingredient } from "./order";

export type Preset = { id: string; name: string; dish: Partial<Record<Ingredient, number>>; prepped: number };

export const PRESETS_PER_DAY = 3;

export function defaultPresets(): Preset[] {
  return (DEFAULTS.presets as Preset[]).map((p) => ({ ...p, dish: { ...p.dish } }));
}

/** Đúng thứ tự xếp lớp: pate dưới cùng, sốt trên cùng. */
export function presetDish(p: Preset): Ingredient[] {
  const out: Ingredient[] = [];
  for (const ing of INGREDIENTS) for (let i = 0; i < (p.dish[ing.id] ?? 0); i++) out.push(ing.id);
  return out;
}

export function refillPresets(list: Preset[] | undefined): Preset[] {
  const base = defaultPresets();
  if (!list?.length) return base;
  return list.slice(0, PRESETS_PER_DAY).map((p, i) => ({ ...p, prepped: base[i]?.prepped ?? p.prepped }));
}
