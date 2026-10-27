import type { FloorMaterial } from "./types";

export type FloorKind = "shop" | "walk" | "road";

export const FLOOR_MATERIALS: Record<FloorKind, FloorMaterial> = {
  shop: { id: "shop", gloss: 1, reflNear: 0.16, reflFar: 0.03, glare: true },
  walk: { id: "walk", gloss: 0, reflNear: 0, reflFar: 0, glare: false },
  road: { id: "road", gloss: 0, reflNear: 0, reflFar: 0, glare: false },
};

export function materialOf(kind: FloorKind): FloorMaterial {
  return FLOOR_MATERIALS[kind];
}
