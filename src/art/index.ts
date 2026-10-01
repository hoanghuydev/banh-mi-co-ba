import Phaser from "phaser";
import { ROAD_LANE_Y, type Floor, type TileCode } from "../world/map";
import { buildTiles, TILE } from "./tiles";
import { buildBuilding, BUILD } from "./building";
import { buildCounter, COUNTER } from "./counter";
import { buildProps, PROP } from "./props";
import { buildCharacter } from "./character";
import { buildHeld } from "./held";
import { buildFood } from "./food";
import { buildFx } from "./fx";
import { paintPhotos, preloadPhotos } from "./photo";

/**
 * ĐIỂM NỐI DUY NHẤT giữa game và phần hình ảnh.
 *
 * Art v1 vẽ bằng Graphics rồi nướng thành texture. Art v2 (artist vẽ thật) nằm ở
 * `photo.ts` và ĐÈ LÊN đúng những key v1 đã có — lời hứa "không file gameplay nào
 * phải sửa" giữ nguyên, và món nào artist chưa vẽ thì tự khắc còn bản vẽ code.
 *
 * Nên thứ tự bắt buộc là: nướng hết bằng code TRƯỚC, `paintPhotos` SAU.
 * Scene nào dựng cảnh thì phải gọi `preloadArt()` trong `preload()` — không có
 * ảnh thì `paintPhotos` lặng lẽ không làm gì, cảnh vẫn dựng được bằng art v1.
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

/** Ảnh thật của artist. Gọi trong `preload()` của scene nào dựng cảnh. */
export function preloadArt(scene: Phaser.Scene) {
  preloadPhotos(scene);
}

export function buildTextures(scene: Phaser.Scene) {
  if (scene.textures.exists(BUILD.door)) return;              // đã nướng rồi thì thôi
  buildTiles(scene);
  buildBuilding(scene);
  buildCounter(scene);
  buildProps(scene);
  buildCharacter(scene);
  buildHeld(scene);
  buildFood(scene);
  buildFx(scene);
  paintPhotos(scene);                                         // art v2 đè lên art v1
}

/** Ô sàn chọn "ngẫu nhiên" nhưng cố định theo toạ độ — chạy lần nào cũng ra y hệt. */
export function floorTextureAt(kind: Floor, tx: number, ty: number) {
  const h = ((tx * 928371) ^ (ty * 12345)) >>> 0;
  // Vạch sơn giữa đường phải là một ĐƯỜNG chứ không phải mấy vệt trắng rắc bừa:
  // biến thể 1 của mặt đường là ô CÓ vạch, và nó chỉ được rơi vào đúng một hàng.
  // Ba biến thể còn lại là nhựa đường trơn, vẫn bốc theo toạ độ như mọi ô sàn khác.
  if (kind === "road") return TILE.floor(kind, ty === ROAD_LANE_Y ? 1 : [0, 2, 3][h % 3]);
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
    // Hai ô `M` nằm sát nhau: cho một chiếc xe số và một chiếc Vespa để cái hẻm
    // không đọc ra là hai bản sao của cùng một chiếc xe dán cạnh nhau.
    case "M": return tx % 2 === 0 ? PROP.bike : PROP.scooter;
    case "P": return PROP.pothos;
    case "C": return PROP.crate;
    case "V": return PROP.bin;
    case "W": return PROP.sink;
    case "A": return PROP.sign;
    case "X": return PROP.fire;
    default: return null;                              // ô trống: chỉ có sàn, không có đạo cụ
  }
}
