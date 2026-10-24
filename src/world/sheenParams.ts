import { BUILD, COUNTER, PROP } from "../art";
import type { SheenLayer } from "../art/light/sheen";

const GLAZE: SheenLayer[] = [{ kind: "glaze", strength: 0.34 }];
const GLAZE_SOFT: SheenLayer[] = [{ kind: "glaze", strength: 0.16 }];
const METAL: SheenLayer[] = [{ kind: "metal", strength: 0.4 }];

/** Vùng bóng của từng sprite, chọn theo màu điểm ảnh nên ảnh gen lại vẫn dùng được; `region` theo phần trăm khung đục. */
const SHEEN: Record<string, readonly SheenLayer[]> = {
  [PROP.oven]: METAL,
  [PROP.ovenE]: METAL,
  [PROP.shelf]: [{ kind: "metal", strength: 0.34 }],
  [PROP.fridge]: [{ kind: "enamel", strength: 0.32 }],
  [PROP.tea]: [{ kind: "glass", strength: 0.32 }],
  [PROP.sink]: [
    { kind: "porcelain", strength: 0.5, region: [[0, 0], [1, 0], [1, 0.62], [0, 0.62]] },
    { kind: "metal", strength: 0.4, region: [[0.3, 0], [0.75, 0], [0.75, 0.3], [0.3, 0.3]] },
  ],
  [PROP.order]: GLAZE_SOFT,
  [PROP.prep]: GLAZE_SOFT,
  [PROP.benchNear]: GLAZE_SOFT,
  [PROP.benchFar]: GLAZE_SOFT,
  [PROP.tableLong]: GLAZE,
  [PROP.table]: GLAZE,
  [COUNTER.end]: GLAZE,
  [COUNTER.case(0)]: GLAZE,
  [COUNTER.case(1)]: GLAZE,
};

export function sheenSpecOf(key: string): readonly SheenLayer[] | null {
  return SHEEN[key] ?? null;
}

const RIM_GAIN: Record<string, number> = {
  [PROP.oven]: 1.3, [PROP.ovenE]: 1.3, [PROP.order]: 1.3, [PROP.prep]: 1.3, [PROP.benchNear]: 1.3, [PROP.benchFar]: 1.3,
  [PROP.tableLong]: 1.3, [PROP.table]: 1.3, [COUNTER.end]: 1.3, [COUNTER.case(0)]: 1.3, [COUNTER.case(1)]: 1.3,
  [PROP.shelf]: 0.5, [PROP.crate]: 0.7, [PROP.bin]: 0.7, [PROP.pothos]: 0.8, [PROP.stool]: 0.7,
  [PROP.scooter]: 0.8, [PROP.bike]: 0.8, [PROP.sign]: 0.7, [PROP.umbrella]: 0.7, [PROP.cooler]: 0.7,
};

/** Hệ số viền nắng của sprite: mặc định 1; tường và cửa là các ô ghép liền nên không viền. */
export function rimGainOf(key: string) {
  if (key.startsWith(BUILD.wall(0).slice(0, -1)) || key === BUILD.door || key.startsWith(BUILD.neighbour(0).slice(0, -1))) return 0;
  return RIM_GAIN[key] ?? 1;
}
