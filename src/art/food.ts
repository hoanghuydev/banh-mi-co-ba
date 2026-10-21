import Phaser from "phaser";
import { INGREDIENTS, type Ingredient } from "../sim/order";
import { shade, type Pen } from "./canvas";

// Mỗi nhân một bóng (silhouette) riêng để nhìn đen trắng vẫn phân biệt được, không chỉ khác màu.
export const FOOD = {
  icon: (id: Ingredient) => `ing_${id}`,
  big: (id: Ingredient) => `ing_${id}_big`,
  loaf: "loaf_open",
  ICON: 36,
  BIG_SCALE: 1.7,

  // Hình học ổ bánh, nguồn duy nhất cho `loaf()`, `photo.ts` và `ui/AssemblyPanel.ts`.
  LOAF_W: 300,
  LOAF_H: 136,
  CRUMB_W: 214,
  CRUMB_DY: 16,
  /** Px nắp ló trên mép máng; trần ~38, cao hơn thì bị khung `LOAF_H` xén. */
  LID_PEEK: 38,
} as const;

type Draw = (g: Pen, cx: number, cy: number, s: number) => void;

const thit: Draw = (g, cx, cy, s) => {
  g.fillStyle(0xf2e6e0, 1);
  g.fillRoundedRect(cx - 12 * s, cy - 9 * s, 24 * s, 18 * s, 4 * s);
  g.fillStyle(0xd98a86, 1);
  g.fillRoundedRect(cx - 10 * s, cy - 7 * s, 20 * s, 14 * s, 3 * s);
  g.fillStyle(0xb9645f, 0.5);
  g.fillRect(cx - 6 * s, cy - 2 * s, 12 * s, 1.6 * s);
};

const pate: Draw = (g, cx, cy, s) => {
  g.fillStyle(0x6f533c, 1);
  g.fillPoints([
    { x: cx - 13 * s, y: cy + 7 * s }, { x: cx - 9 * s, y: cy - 7 * s },
    { x: cx + 8 * s, y: cy - 8 * s }, { x: cx + 13 * s, y: cy + 2 * s },
    { x: cx + 5 * s, y: cy + 8 * s },
  ], true);
  g.fillStyle(0x8d6b4f, 1);
  g.fillPoints([
    { x: cx - 10 * s, y: cy + 4 * s }, { x: cx - 7 * s, y: cy - 5 * s },
    { x: cx + 6 * s, y: cy - 6 * s }, { x: cx + 10 * s, y: cy + 1 * s },
    { x: cx + 3 * s, y: cy + 5 * s },
  ], true);
  g.fillStyle(0xa98663, 0.55);
  g.fillEllipse(cx - 2 * s, cy - 2 * s, 8 * s, 3 * s);
};

const chalua: Draw = (g, cx, cy, s) => {
  g.fillStyle(0xd8c7ac, 1);
  g.fillCircle(cx, cy, 11 * s);
  g.fillStyle(0xf0e2cd, 1);
  g.fillCircle(cx, cy, 9 * s);
  g.fillStyle(0xd8c7ac, 0.9);
  for (const [dx, dy, r] of [[-3, -2, 1.6], [3, 1, 2.1], [0, 4, 1.3], [4, -4, 1.2]]) {
    g.fillCircle(cx + dx * s, cy + dy * s, r * s);
  }
};

const xiumai: Draw = (g, cx, cy, s) => {
  g.fillStyle(0x9c3f28, 0.75);
  g.fillEllipse(cx, cy + 7 * s, 24 * s, 7 * s);
  g.fillStyle(0x93402c, 1);
  g.fillCircle(cx, cy - 1 * s, 10.5 * s);
  g.fillStyle(0xc0563a, 1);
  g.fillCircle(cx, cy - 2 * s, 9 * s);
  g.fillStyle(0xe08b69, 0.45);
  g.fillEllipse(cx - 3 * s, cy - 5 * s, 6 * s, 3.5 * s);
};

const dochua: Draw = (g, cx, cy, s) => {
  const stick = (dx: number, dy: number, rot: number, color: number) => {
    g.save();
    g.translateCanvas(cx + dx * s, cy + dy * s);
    g.rotateCanvas(rot);
    g.fillStyle(shade(color, -22), 1);
    g.fillRoundedRect(-11 * s, -2.6 * s, 22 * s, 5.2 * s, 2 * s);
    g.fillStyle(color, 1);
    g.fillRoundedRect(-10 * s, -1.8 * s, 20 * s, 3.6 * s, 1.6 * s);
    g.restore();
  };
  stick(0, 5, -0.28, 0xe8a23c);
  stick(-1, 0, 0.22, 0xf2eee2);
  stick(1, -5, -0.12, 0xe8a23c);
};

const dualeo: Draw = (g, cx, cy, s) => {
  g.fillStyle(0x4f7d33, 1);
  g.fillEllipse(cx, cy, 24 * s, 20 * s);
  g.fillStyle(0x7fb04e, 1);
  g.fillEllipse(cx, cy, 21 * s, 17 * s);
  g.fillStyle(0xdfeccb, 1);
  g.fillEllipse(cx, cy, 14 * s, 11 * s);
  g.fillStyle(0xa9c47f, 1);
  for (const [dx, dy] of [[-3, -2], [3, -2], [0, 3]]) {
    g.fillEllipse(cx + dx * s, cy + dy * s, 3 * s, 4 * s);
  }
};

const hanhngo: Draw = (g, cx, cy, s) => {
  g.lineStyle(2 * s, 0x3d6b33, 1);
  g.lineBetween(cx - 2 * s, cy + 10 * s, cx, cy - 2 * s);
  g.lineBetween(cx, cy + 2 * s, cx - 8 * s, cy - 4 * s);
  g.lineBetween(cx, cy + 1 * s, cx + 8 * s, cy - 5 * s);
  const leaf = (dx: number, dy: number, w: number, h: number, rot: number) => {
    g.save();
    g.translateCanvas(cx + dx * s, cy + dy * s);
    g.rotateCanvas(rot);
    g.fillStyle(0x3d6b33, 1);
    g.fillEllipse(0, 0, (w + 2) * s, (h + 2) * s);
    g.fillStyle(0x4f8f45, 1);
    g.fillEllipse(0, 0, w * s, h * s);
    g.restore();
  };
  leaf(-9, -6, 9, 6, -0.5);
  leaf(9, -7, 9, 6, 0.5);
  leaf(0, -7, 8, 7, 0);
};

const ot: Draw = (g, cx, cy, s) => {
  g.fillStyle(0x9c2a1c, 1);
  g.fillPoints([
    { x: cx - 5 * s, y: cy - 9 * s }, { x: cx + 4 * s, y: cy - 2 * s },
    { x: cx + 4 * s, y: cy + 8 * s }, { x: cx - 1 * s, y: cy + 10 * s },
    { x: cx - 2 * s, y: cy + 1 * s }, { x: cx - 9 * s, y: cy - 6 * s },
  ], true);
  g.fillStyle(0xd0402c, 1);
  g.fillPoints([
    { x: cx - 4 * s, y: cy - 7 * s }, { x: cx + 2 * s, y: cy - 1 * s },
    { x: cx + 2 * s, y: cy + 6 * s }, { x: cx - 1 * s, y: cy + 7 * s },
    { x: cx - 4 * s, y: cy }, { x: cx - 7 * s, y: cy - 5 * s },
  ], true);
  g.lineStyle(2.2 * s, 0x4f7d33, 1);
  g.lineBetween(cx - 5 * s, cy - 9 * s, cx - 8 * s, cy - 13 * s);
};

const opla: Draw = (g, cx, cy, s) => {
  g.fillStyle(0xe8e2cf, 1);
  g.fillPoints([
    { x: cx - 14 * s, y: cy - 2 * s }, { x: cx - 8 * s, y: cy - 10 * s },
    { x: cx + 2 * s, y: cy - 11 * s }, { x: cx + 12 * s, y: cy - 5 * s },
    { x: cx + 13 * s, y: cy + 5 * s }, { x: cx + 3 * s, y: cy + 11 * s },
    { x: cx - 8 * s, y: cy + 9 * s }, { x: cx - 13 * s, y: cy + 4 * s },
  ], true);
  g.fillStyle(0xfaf6ea, 1);
  g.fillPoints([
    { x: cx - 11 * s, y: cy - 2 * s }, { x: cx - 6 * s, y: cy - 8 * s },
    { x: cx + 2 * s, y: cy - 9 * s }, { x: cx + 10 * s, y: cy - 4 * s },
    { x: cx + 10 * s, y: cy + 4 * s }, { x: cx + 2 * s, y: cy + 9 * s },
    { x: cx - 7 * s, y: cy + 7 * s }, { x: cx - 10 * s, y: cy + 3 * s },
  ], true);
  g.fillStyle(0xd99a1f, 1);
  g.fillCircle(cx + 2 * s, cy - 1 * s, 6.2 * s);
  g.fillStyle(0xf5bf3c, 1);
  g.fillCircle(cx + 2 * s, cy - 1.5 * s, 5 * s);
  g.fillStyle(0xfde49a, 0.75);
  g.fillEllipse(cx + 0.5 * s, cy - 3.5 * s, 3.5 * s, 2 * s);
};

const tuongot: Draw = (g, cx, cy, s) => {
  const wave = (dy: number, color: number, w: number) => {
    g.lineStyle(w * s, color, 1);
    g.beginPath();
    g.moveTo(cx - 13 * s, cy + (dy + 3) * s);
    g.lineTo(cx - 5 * s, cy + (dy - 4) * s);
    g.lineTo(cx + 3 * s, cy + (dy + 3) * s);
    g.lineTo(cx + 12 * s, cy + (dy - 3) * s);
    g.strokePath();
  };
  wave(2, 0x8f2417, 5.5);
  wave(2, 0xc9341f, 3.4);
  wave(-6, 0x8f2417, 5);
  wave(-6, 0xd94a2c, 3);
};

const DRAWERS: Record<Ingredient, Draw> = {
  pate, thit, chalua, xiumai, opla, dochua, dualeo, hanhngo, ot, tuongot,
};

/** Tỉ lệ dài/cao phải gần 5:1 mới đọc ra baguette. */
function loaf(scene: Phaser.Scene) {
  const W = FOOD.LOAF_W, H = FOOD.LOAF_H;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const cx = W / 2, cy = H / 2 + FOOD.CRUMB_DY;

  g.fillStyle(0x1a2228, 0.1);                          // bóng dưới ổ
  g.fillEllipse(cx, cy + 30, 250, 16);

  // nắp bánh lật ra phía sau: vành khuyết nằm cao hơn, hơi lệch
  g.fillStyle(0xa56d38, 1);
  g.fillEllipse(cx + 6, cy - 30, 250, 40);
  g.fillStyle(0xc9924f, 1);
  g.fillEllipse(cx + 6, cy - 32, 242, 34);
  g.fillStyle(0x8a5a2c, 0.45);                         // đường rạch trên lưng nắp
  for (const dx of [-78, -30, 18, 66]) g.fillEllipse(cx + dx, cy - 38, 30, 5);

  // nửa dưới: cái máng đựng nhân
  g.fillStyle(0xa96c33, 1);
  g.fillEllipse(cx, cy, 268, 56);
  g.fillStyle(0xdba463, 1);
  g.fillEllipse(cx, cy - 2, 260, 50);
  g.fillStyle(0xf5e3c2, 1);                            // ruột bánh, nơi nhân nằm lên
  g.fillEllipse(cx, cy - 1, 240, 34);
  g.fillStyle(0xe8d3ad, 1);
  g.fillEllipse(cx, cy + 4, 232, 24);

  g.generateTexture(FOOD.loaf, W, H);
  g.destroy();
}

export function buildFood(scene: Phaser.Scene) {
  if (scene.textures.exists(FOOD.loaf)) return;
  loaf(scene);
  const bake = (key: (id: Ingredient) => string, s: number) => {
    const S = Math.ceil(FOOD.ICON * s);
    for (const ing of INGREDIENTS) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      DRAWERS[ing.id](g, S / 2, S / 2, s);
      g.generateTexture(key(ing.id), S, S);
      g.destroy();
    }
  };
  bake(FOOD.icon, 1);
  bake(FOOD.big, FOOD.BIG_SCALE);
}
