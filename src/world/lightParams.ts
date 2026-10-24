import { COUNTER, PROP } from "../art";
import { TH, TW } from "./iso";
import { floorAt, type Floor } from "./map";

/** `side`: phần cao ảnh là mặt bên; `fw`/`fh`: cỡ chân theo ô cho AO. */
export type LightSpec = { side: number; fw: number; fh: number };

const SPECS: Record<string, LightSpec> = {
  // Thân hộp kim loại một ô, mặt trên là nắp lò.
  [PROP.oven]: { side: 0.6, fw: 0.8, fh: 0.8 },
  [PROP.ovenE]: { side: 0.6, fw: 0.8, fh: 0.8 },
  // Tủ kính nguyên ô: skill mục 2.
  [PROP.shelf]: { side: 0.64, fw: 1.0, fh: 0.9 },
  // Bình trà đặt trên thùng nhỏ, thân tròn cao.
  [PROP.tea]: { side: 0.6, fw: 0.5, fh: 0.5 },
  // Bồn treo trên chân mảnh: skill mục 2.
  [PROP.sink]: { side: 0.85, fw: 0.35, fh: 0.35 },
  // Ghế nhựa thấp, chân nhỏ.
  [PROP.stool]: { side: 0.55, fw: 0.5, fh: 0.5 },
  // Mặt bàn mỏng, gần hết ảnh là chân bàn.
  [PROP.table]: { side: 0.85, fw: 0.8, fh: 0.8 },
  // Quầy một ô, thân đặc, mặt trên chiếm phần nhỏ.
  [PROP.order]: { side: 0.6, fw: 1.0, fh: 1.0 },
  [PROP.prep]: { side: 0.6, fw: 1.0, fh: 1.0 },
  [PROP.benchNear]: { side: 0.6, fw: 1.0, fh: 1.0 },
  [PROP.benchFar]: { side: 0.6, fw: 1.0, fh: 1.0 },
  [COUNTER.end]: { side: 0.6, fw: 1.0, fh: 1.0 },
  [COUNTER.case(0)]: { side: 0.64, fw: 1.0, fh: 1.0 },
  [COUNTER.case(1)]: { side: 0.64, fw: 1.0, fh: 1.0 },
  // Bàn 2 × 1 ô theo +x: chân chiếm hình thoi 3 ô rộng, 1,5 ô cao.
  [PROP.tableLong]: { side: 0.85, fw: 1.4, fh: 1.4 },
  // Xe dài nằm chéo, bánh chạm đất.
  [PROP.bike]: { side: 0.5, fw: 1.0, fh: 0.8 },
  [PROP.scooter]: { side: 0.5, fw: 1.0, fh: 0.8 },
  // Chậu cây: chỉ phần chậu là mặt bên, tán lá không soi gương.
  [PROP.pothos]: { side: 0.4, fw: 0.5, fh: 0.5 },
  // Két nước nhựa vuông.
  [PROP.crate]: { side: 0.6, fw: 0.35, fh: 0.35 },
  // Thùng rác: skill mục 2.
  [PROP.bin]: { side: 0.62, fw: 0.62, fh: 0.62 },
  // Bảng chữ A mỏng, hai mặt dựng đứng.
  [PROP.sign]: { side: 0.75, fw: 0.7, fh: 0.3 },
  // Bình trụ nhỏ, gần hết ảnh là thân.
  [PROP.fire]: { side: 0.9, fw: 0.3, fh: 0.3 },
  // Cột dù mảnh; tán ở trên cao không phản chiếu.
  [PROP.umbrella]: { side: 0.1, fw: 0.3, fh: 0.3 },
  [PROP.fridge]: { side: 0.64, fw: 0.8, fh: 0.8 },
  [PROP.cooler]: { side: 0.6, fw: 0.8, fh: 0.8 },
};

export function lightSpecOf(key: string): LightSpec | null {
  return SPECS[key] ?? null;
}

/** Ô thế giới (liên tục) tại một điểm trên mặt sàn, toạ độ màn hình thiết kế. */
export function worldAt(sx: number, sy: number) {
  const a = sy / (TH / 2), b = sx / (TW / 2);
  return { wx: (a + b) / 2, wy: (a - b) / 2 };
}

export function floorAtScreen(sx: number, sy: number): Floor {
  const { wx, wy } = worldAt(sx, sy);
  return floorAt(Math.floor(wx), Math.floor(wy));
}
