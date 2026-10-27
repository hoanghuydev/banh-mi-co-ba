import Phaser from "phaser";
import { ROAD_LANE_Y, type Floor, type TileCode } from "../world/map";
import { buildTiles, TILE } from "./tiles";
import { buildBuilding, BUILD } from "./building";
import { buildCounter, COUNTER } from "./counter";
import { buildProps, PROP } from "./props";
import { buildCharacter, isCharacter } from "./character";
import { buildHeld } from "./held";
import { buildFood } from "./food";
import { buildFx } from "./fx";
import type { Step } from "./steps";
import { npcSteps, photoSteps, preloadPhotos } from "./photo";
import { feetSteps } from "./light/actor";

export { BASE, footY } from "./canvas";
export { bakeSourceLoads, bakeRegulars, dropRegular, regularFiles, regularIds, regularReady } from "./photo";
export {
  textureFor, buildBody, holdAnchor, BODY_H, PLAYER_STYLE,
  type BodyStyle, type Pose,
} from "./character";
export { HELD, heldTexture, heldFootPad, type HeldLook } from "./held";
export { opaqueBox, opaqueEdges, spriteEdges, type Edges, type OpaqueBox, type SpriteBox } from "./opaque";
export { createSign, type Awning } from "./sign";
export { sliceImage } from "./slices";
export { createMenuBoard } from "./menuboard";
export { FX, RING_SS } from "./fx";
export { TILE, BUILD, COUNTER, PROP };

export const ICON = {
  handClean: "icon:hand-clean", handDirty: "icon:hand-dirty",
  eyeGlance: "icon:eye-glance", eyeClose: "icon:eye-close",
} as const;
const ICON_FILE: Record<string, string> = {
  [ICON.handClean]: "art/hud_hand_clean.webp", [ICON.handDirty]: "art/hud_hand_dirty.webp",
  [ICON.eyeGlance]: "art/hud_eye_glance.webp", [ICON.eyeClose]: "art/hud_eye_close.webp",
};
export const NTF = ["phone", "star", "chat", "alert", "box", "check", "info", "flame", "medal_dong", "medal_bac", "medal_vang", "medal_kc"] as const;
export type NtfIcon = typeof NTF[number];
export const ntfKey = (n: NtfIcon) => `icon:ntf-${n}`;
for (const n of NTF) ICON_FILE[ntfKey(n)] = `art/ntf_${n}.webp`;
const askedIcon = new Set<string>();

export function preloadArt(scene: Phaser.Scene) {
  preloadPhotos(scene);
  // Lúc đang tải `textures.exists` vẫn false, nên phải nhớ key đã xin kẻo Phaser báo trùng.
  for (const [key, file] of Object.entries(ICON_FILE)) {
    if (askedIcon.has(key) || scene.textures.exists(key)) continue;
    askedIcon.add(key);
    scene.load.image(key, file);
  }
}

/** Gọi một lần sau khi `preloadArt` tải xong; ảnh thật phải đè sau cùng lên texture vẽ bằng code. */
export function artSteps(scene: Phaser.Scene): Step[] {
  return [
    () => buildTiles(scene),
    () => buildBuilding(scene),
    () => buildCounter(scene),
    () => buildProps(scene),
    () => buildCharacter(scene),
    () => buildHeld(scene),
    () => buildFood(scene),
    () => buildFx(scene),
    ...photoSteps(scene),
    // Đọc chân rồi niêm sau từng người, để lúc nướng chỉ một bộ khung còn giữ canvas.
    ...npcSteps(scene).flatMap((step) => [() => feetSteps(scene.textures, isCharacter), step]),
    () => feetSteps(scene.textures, isCharacter),
  ];
}

export function floorTextureAt(kind: Floor, tx: number, ty: number) {
  const h = ((tx * 928371) ^ (ty * 12345)) >>> 0;
  // Biến thể 1 của mặt đường là ô có vạch sơn, chỉ dùng cho đúng hàng giữa đường.
  if (kind === "road") return TILE.floor(kind, ty === ROAD_LANE_Y ? 1 : [0, 2, 3][h % 3]);
  return TILE.floor(kind, h % TILE.VARIANTS);
}

export function textureForTile(
  code: TileCode, tx: number, ty: number,
  opts: { isCounterEnd: boolean; stationId: string | null; eOven?: boolean },
): string | null {
  switch (code) {
    case "#": return BUILD.wall(((tx * 5 + ty * 3) >>> 0) % BUILD.WALL_COUNT);
    case "D": return BUILD.door;
    case "N": return BUILD.neighbour(tx % BUILD.NEIGHBOUR_COUNT);
    case "R": return PROP.benchFar;
    case "Q": return opts.stationId === "handoff" ? PROP.order
      : opts.stationId === "board" ? PROP.benchNear
      : opts.stationId ? PROP.prep
      : opts.isCounterEnd ? COUNTER.end
      : COUNTER.case(tx % COUNTER.CASE_COUNT);
    case "O": return opts.eOven ? PROP.ovenE : PROP.oven;
    case "T": return PROP.tea;
    case "K": return PROP.shelf;
    case "s": return PROP.stool;
    case "b": return PROP.table;
    case "Z": return PROP.tableLong;
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
