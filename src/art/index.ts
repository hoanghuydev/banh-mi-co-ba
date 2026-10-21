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

export { BASE, footY } from "./canvas";
export {
  textureFor, buildBody, holdAnchor, BODY_H, PLAYER_STYLE,
  type BodyStyle, type Pose,
} from "./character";
export { HELD, heldTexture, heldFootPad, type HeldLook } from "./held";
export { opaqueBox, opaqueEdges, spriteEdges, type Edges, type OpaqueBox, type SpriteBox } from "./opaque";
export { createSign } from "./sign";
export { createMenuBoard } from "./menuboard";
export { FX } from "./fx";
export { TILE, BUILD, COUNTER, PROP };

// SVG nướng gấp đôi cỡ hiển thị để không nhoè khi FIT phóng lên full-HD.
export const ICON = { eyeInk: "icon:eye-ink", eyeRed: "icon:eye-red" } as const;
const SVGS: Record<string, { file: string; w: number; h: number }> = {
  [ICON.eyeInk]: { file: "art/eye-ink.svg", w: 144, h: 88 },
  [ICON.eyeRed]: { file: "art/eye-red.svg", w: 144, h: 88 },
};
const askedSvg = new Set<string>();

export function preloadArt(scene: Phaser.Scene) {
  preloadPhotos(scene);
  // Lúc đang tải `textures.exists` vẫn false, nên phải nhớ key đã xin kẻo Phaser báo trùng.
  for (const [key, svg] of Object.entries(SVGS)) {
    if (askedSvg.has(key) || scene.textures.exists(key)) continue;
    askedSvg.add(key);
    scene.load.svg(key, svg.file, { width: svg.w, height: svg.h });
  }
}

export function buildTextures(scene: Phaser.Scene) {
  if (scene.textures.exists(BUILD.door)) return;
  buildTiles(scene);
  buildBuilding(scene);
  buildCounter(scene);
  buildProps(scene);
  buildCharacter(scene);
  buildHeld(scene);
  buildFood(scene);
  buildFx(scene);
  // Ảnh thật phải đè sau cùng lên texture vẽ bằng code.
  paintPhotos(scene);
}

export function floorTextureAt(kind: Floor, tx: number, ty: number) {
  const h = ((tx * 928371) ^ (ty * 12345)) >>> 0;
  // Biến thể 1 của mặt đường là ô có vạch sơn, chỉ dùng cho đúng hàng giữa đường.
  if (kind === "road") return TILE.floor(kind, ty === ROAD_LANE_Y ? 1 : [0, 2, 3][h % 3]);
  return TILE.floor(kind, h % TILE.VARIANTS);
}

export function textureForTile(
  code: TileCode, tx: number, ty: number,
  opts: { isCounterEnd: boolean; isStation: boolean; eOven?: boolean },
): string | null {
  switch (code) {
    case "#": return BUILD.wall(((tx * 5 + ty * 3) >>> 0) % BUILD.WALL_COUNT);
    case "D": return BUILD.door;
    case "N": return BUILD.neighbour(tx % BUILD.NEIGHBOUR_COUNT);
    case "Q": return opts.isStation ? COUNTER.work
      : opts.isCounterEnd ? COUNTER.end
      : COUNTER.case(tx % COUNTER.CASE_COUNT);
    case "O": return opts.eOven ? PROP.ovenE : PROP.oven;
    case "T": return PROP.tea;
    case "K": return PROP.shelf;
    case "s": return PROP.stool;
    case "b": return PROP.table;
    case "M": return tx % 2 === 0 ? PROP.bike : PROP.scooter;
    case "P": return PROP.pothos;
    case "C": return PROP.crate;
    case "V": return PROP.bin;
    case "W": return PROP.sink;
    case "A": return PROP.sign;
    case "X": return PROP.fire;
    default: return null;
  }
}
