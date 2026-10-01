import Phaser from "phaser";
import { TW, TH } from "../world/iso";
import type { Floor } from "../world/map";
import { PAL } from "./palette";
import { BASE, diamond, heightFor, isoBox, prop, type Pen } from "./canvas";

/**
 * Ba loại mặt sàn + vạt nắng.
 * Tách riêng vì đây là thứ được "nướng" một lần vào RenderTexture, không phải sprite.
 */

export const TILE = {
  floor: (kind: Floor, i: number) => `f_${kind}${i}`,
  VARIANTS: 4,
  sun: "sun",
} as const;

type FloorSpec = {
  colors: readonly number[];
  joint: number;
  /** Vạch sơn trắng giữa đường — chỉ mặt đường mới có. */
  paint?: boolean;
};

const FLOORS: Record<Floor, FloorSpec> = {
  shop: { colors: PAL.shopFloor, joint: PAL.shopJoint },
  walk: { colors: PAL.walkFloor, joint: PAL.walkJoint },
  road: { colors: PAL.roadFloor, joint: PAL.roadJoint, paint: true },
};

/** Một ô sàn: khối hộp rất mỏng + mạch nối + vết loang, để không phẳng lì. */
function floorTile(scene: Phaser.Scene, key: string, spec: FloorSpec, top: number, variant: number) {
  prop(scene, key, heightFor(0), (g, cx, cy) => {
    isoBox(g, cx, cy, BASE, top);
    joints(g, cx, cy, spec.joint);

    // Vết loang cho mặt sàn khỏi phẳng lì. RẤT nhạt: từ khi vỉa hè và lòng đường
    // dùng ảnh thật, hàm này chỉ còn vẽ SÀN QUÁN — mà sàn quán là gạch men trắng,
    // vết loang 0,22 trên nền trắng đọc ra là mấy vũng xám bẩn chứ không ra chất men.
    g.fillStyle(PAL.floorStain, 0.075);                // cố định theo variant
    for (let i = 0; i < 3; i++) {
      const u = (((i * 7 + variant * 3) % 9) / 9 - 0.5) * 0.66;
      const v = (((i * 5 + variant * 2) % 7) / 7 - 0.5) * 0.66;
      g.fillEllipse(cx + u * TW, cy + v * TH, 9 + i * 3, 5 + i);
    }
    if (spec.paint && variant === 1) {                 // vạch sơn đứt quãng giữa đường
      g.fillStyle(PAL.roadPaint, 0.55);
      g.fillPoints([
        { x: cx - 13, y: cy - 6 }, { x: cx + 1, y: cy + 1 },
        { x: cx - 1, y: cy + 2 }, { x: cx - 15, y: cy - 5 },
      ], true);
    }
  });
}

/** Mạch nối giữa hai tấm — chạy dọc hai cạnh sau của ô, đủ để mắt thấy "từng tấm". */
function joints(g: Pen, cx: number, cy: number, color: number) {
  g.fillStyle(color, 0.32);
  g.fillPoints([
    { x: cx - TW / 2, y: cy }, { x: cx, y: cy - TH / 2 },
    { x: cx + 1.6, y: cy - TH / 2 + 0.8 }, { x: cx - TW / 2 + 3.2, y: cy + 1.6 },
  ], true);
  g.fillPoints([
    { x: cx + TW / 2, y: cy }, { x: cx, y: cy - TH / 2 },
    { x: cx - 1.6, y: cy - TH / 2 + 0.8 }, { x: cx + TW / 2 - 3.2, y: cy + 1.6 },
  ], true);
}

/** Vạt nắng gắt trắng — dán chồng lên sàn với blend ADD. */
function sun(scene: Phaser.Scene) {
  prop(scene, TILE.sun, heightFor(0), (g, cx, cy) => {
    g.fillStyle(PAL.sun, 0.3);
    diamond(g, cx, cy, TW - 1, TH - 1);
  });
}

export function buildTiles(scene: Phaser.Scene) {
  (Object.keys(FLOORS) as Floor[]).forEach((kind) => {
    const spec = FLOORS[kind];
    for (let i = 0; i < TILE.VARIANTS; i++) {
      floorTile(scene, TILE.floor(kind, i), spec, spec.colors[i % spec.colors.length], i);
    }
  });
  sun(scene);
}
