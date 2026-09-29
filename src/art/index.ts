import Phaser from "phaser";
import type { Floor, TileCode } from "../world/map";
import { buildTiles, TILE } from "./tiles";
import { buildBuilding, BUILD } from "./building";
import { buildCounter, COUNTER } from "./counter";
import { buildProps, PROP } from "./props";
import { buildCharacter } from "./character";
import { buildHeld } from "./held";
import { buildFx } from "./fx";

/**
 * ĐIỂM NỐI DUY NHẤT giữa game và phần hình ảnh.
 *
 * Toàn bộ art v1 được vẽ bằng Graphics rồi nướng thành texture.
 * Sang v2 (artist vẽ thật) chỉ cần đổi `buildTextures` thành `scene.load.atlas(...)`
 * và giữ nguyên bảng tên texture bên dưới — không file gameplay nào phải sửa.
 */
export { BASE, footY } from "./canvas";
export {
  textureFor, buildBody, holdAnchor, BODY_H, PLAYER_STYLE,
  type BodyStyle, type Pose,
} from "./character";
export { HELD } from "./held";
export { createSign } from "./sign";
export { FX } from "./fx";
export { TILE, BUILD, COUNTER, PROP };

export function buildTextures(scene: Phaser.Scene) {
  if (scene.textures.exists(TILE.floor("shop", 0))) return;   // đã nướng rồi thì thôi
  buildTiles(scene);
  buildBuilding(scene);
  buildCounter(scene);
  buildProps(scene);
  buildCharacter(scene);
  buildHeld(scene);
  buildFx(scene);
}

/** Ô sàn chọn "ngẫu nhiên" nhưng cố định theo toạ độ — chạy lần nào cũng ra y hệt. */
export function floorTextureAt(kind: Floor, tx: number, ty: number) {
  const h = ((tx * 928371) ^ (ty * 12345)) >>> 0;
  return TILE.floor(kind, h % TILE.VARIANTS);
}

/**
 * Ký tự bản đồ -> tên texture.
 * `isStation` là ô có trạm làm việc: khúc quầy ở đó để TRỐNG cố ý,
 * vì T1 bắt buộc khách phải nhìn thấy tay bạn làm gì.
 */
export function textureForTile(
  code: TileCode, tx: number, ty: number,
  opts: { isCounterEnd: boolean; isStation: boolean },
): string | null {
  switch (code) {
    // Tường lặp 16 ô liền nhau -> chọn biến thể theo TOẠ ĐỘ (giống ô sàn) để mắt
    // thôi đếm nhịp lặp. Băm cả tx lẫn ty, không thì cả một cột tường giống hệt nhau.
    case "#": return BUILD.wall(((tx * 5 + ty * 3) >>> 0) % BUILD.WALL_COUNT);
    case "D": return BUILD.door;
    case "N": return BUILD.neighbour(tx % BUILD.NEIGHBOUR_COUNT);
    case "Q": return opts.isCounterEnd ? COUNTER.end
      : opts.isStation ? COUNTER.work
      : COUNTER.case(tx % COUNTER.CASE_COUNT);          // xen kẽ hai kiểu bày trong tủ
    case "O": return PROP.oven;
    case "T": return PROP.tea;
    case "K": return PROP.shelf;
    case "s": return PROP.stool;
    case "b": return PROP.table;
    case "M": return PROP.bike;
    case "P": return PROP.pothos;
    case "C": return PROP.crate;
    case "V": return PROP.bin;
    case "W": return PROP.sink;
    default: return null;                              // ô trống: chỉ có sàn, không có đạo cụ
  }
}
