import Phaser from "phaser";
import { TW, TH } from "../world/iso";
import { SKY_FROM_Y } from "../world/map";
import { SHADOW } from "./palette";

/** Các texture hạt vẽ trắng để emitter `tint`. */
export const FX = {
  shadow: "shadow", ring: "ring", fly: "fly", puff: "puff", you: "you",
  drop: "drop", ripple: "ripple",
} as const;

/** Tam giác đặc chứ không chữ, vì trên đầu khách đã có `?` và `!`. */
const YOU_W = 18, YOU_H = 13, YOU_PAD = 3;
const YOU_INK = 0x2b2f31;
const YOU_FILL = 0xffe9a8;

/** Nét ngoài dày 6 thò ra 3px, cộng 1px để khỏi bị xén. */
const RING_PAD = 4;
const RING_INK = YOU_INK;
const RING_EDGE = 0xffa726;
const RING_CORE = 0xfff0c2;

/** Cố ý to hơn cỡ thật để độ bẩn nhìn thấy được. */
export const FLY_W = 7;

/** Chừa chỗ cho cánh khi ảnh xoay theo hướng bay. */
export const FLY_BOX = 14;

/** Nướng dư rồi emitter thu nhỏ để rìa hạt mượt. */
const PUFF_PX = 32;
/** Mỗi lớp alpha 0,11 nên tâm ≈ 1−0,89¹⁴ ≈ 0,80, rìa 0,11. */
const PUFF_LAYERS = 14;

const DROP_W = 4;
/** `ui/stall/Rain` chia độ dài vệt cho số này ra `scaleY`. */
export const DROP_H = 28;

export const RIPPLE_W = 32;
const RIPPLE_H = 16;

/** Rộng hơn bóng nhìn thấy vì phần dư là vùng nhoè. */
const SHADOW_W = 44, SHADOW_H = 22;
/** Bằng sải chân; mốc quy đổi bóng đạo cụ: `scale = bề ngang muốn có / SHADOW_CORE`. */
export const SHADOW_CORE = 24;

/** `w` theo bề ngang vật che nắng (không theo đáy) · `a` < 1 cho vật cao khỏi sàn; không có tên = không có bóng. */
export const PROP_SHADOW: Record<string, { w: number; a?: number }> = {
  oven: { w: 40 }, oven_e: { w: 42 }, shelf: { w: 40 }, tea: { w: 30 },
  stool: { w: 22 }, pothos: { w: 22 }, bin: { w: 28 }, crate: { w: 30 },
  sign: { w: 26 }, fire: { w: 15 }, fridge: { w: 28 }, cooler: { w: 24 },
  table: { w: 56, a: 0.75 },
  order: { w: 30 }, prep: { w: 44 }, bench_near: { w: 44 }, bench_far: { w: 44 },
  bike: { w: 58, a: 0.8 }, scooter: { w: 52, a: 0.8 },
  sink: { w: 34, a: 0.6 },
  // khớp bản vẽ dự phòng `fillEllipse(x, y + 2, 76, 26)` trong `StallScene`
  umbrella: { w: 76, a: 0.45 },
};

/** Vẽ bằng canvas vì cần gradient: lớp nhoè rộng + lõi tiếp đất đậm. */
function buildShadow(scene: Phaser.Scene) {
  if (scene.textures.exists(FX.shadow)) scene.textures.remove(FX.shadow);
  const tex = scene.textures.createCanvas(FX.shadow, SHADOW_W, SHADOW_H);
  if (!tex) return;
  const ctx = tex.getContext();
  const cx = SHADOW_W / 2, cy = SHADOW_H / 2;
  const r = SHADOW.color >> 16 & 0xff, g = SHADOW.color >> 8 & 0xff, b = SHADOW.color & 0xff;
  const rgba = (a: number) => `rgba(${r},${g},${b},${a})`;

  // Bóp trục Y để gradient tròn thành ê-líp.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, SHADOW_H / SHADOW_W);
  const soft = ctx.createRadialGradient(0, 0, 0, 0, 0, SHADOW_W / 2);
  // Mốc dồn vào trong để vầng nhoè thấy được chỉ ~30px.
  soft.addColorStop(0, rgba(SHADOW.alpha * 0.85));
  soft.addColorStop(0.3, rgba(SHADOW.alpha * 0.55));
  soft.addColorStop(0.55, rgba(SHADOW.alpha * 0.22));
  soft.addColorStop(0.78, rgba(SHADOW.alpha * 0.05));
  soft.addColorStop(1, rgba(0));
  ctx.fillStyle = soft;
  ctx.beginPath();
  ctx.arc(0, 0, SHADOW_W / 2, 0, Math.PI * 2);
  ctx.fill();

  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, SHADOW_CORE / 2);
  core.addColorStop(0, rgba(SHADOW.alpha * 0.75));
  core.addColorStop(0.6, rgba(SHADOW.alpha * 0.4));
  core.addColorStop(1, rgba(0));
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, SHADOW_CORE / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  tex.refresh();
}

/** Dưới mái hiên bóng chỉ dài bằng chừng này so với ngoài nắng. */
const SHADE_RATIO = 1 / 3;

let cast = { rot: 0, stretch: 1 };

export function setCast(dirX: number, dirY: number, stretch: number) {
  cast = { rot: Math.atan2(dirY, dirX), stretch };
}

/** Đặt bóng tại chân vật: đuôi kéo theo hướng nắng, chân bóng giữ ở `(sx, sy)`. */
export function castShadow(img: Phaser.GameObjects.Image, sx: number, sy: number, scale = 1, alpha = 1) {
  const wy = (sy / (TH / 2) - sx / (TW / 2)) / 2;
  const sun = Math.min(1, Math.max(0, (wy - (SKY_FROM_Y - 0.4)) / 0.8));
  const stretch = 1 + (cast.stretch - 1) * (SHADE_RATIO + (1 - SHADE_RATIO) * sun);
  const ox = 0.5 - Math.min(0.3, (stretch - 1) * 0.25);
  return img.setPosition(sx, sy).setOrigin(ox, 0.5).setRotation(cast.rot)
    .setScale(scale * stretch, scale).setAlpha(alpha);
}

export function buildFx(scene: Phaser.Scene) {
  buildShadow(scene);

  // Ba nét (mực sậm · hổ phách · lõi sáng) để đọc được trên cả nền gạch trắng lẫn nền sậm.
  const g2 = scene.make.graphics({ x: 0, y: 0 }, false);
  const cx = (TW + RING_PAD * 2) / 2, cy = (TH + RING_PAD * 2) / 2;
  const rw = TW - 12, rh = TH - 6;
  g2.lineStyle(6, RING_INK, 0.5);
  g2.strokeEllipse(cx, cy, rw, rh);
  g2.lineStyle(3.5, RING_EDGE, 1);
  g2.strokeEllipse(cx, cy, rw, rh);
  g2.lineStyle(1.5, RING_CORE, 1);
  g2.strokeEllipse(cx, cy, rw, rh);
  g2.generateTexture(FX.ring, TW + RING_PAD * 2, TH + RING_PAD * 2);
  g2.destroy();

  // Dự phòng; `art/photo.ts` đè ảnh thật lên nếu `fly.png` tải kịp.
  const g3 = scene.make.graphics({ x: 0, y: 0 }, false);
  g3.fillStyle(0x1b1b1b, 1);
  g3.fillCircle(FLY_BOX / 2, FLY_BOX / 2, 1.8);
  g3.generateTexture(FX.fly, FLY_BOX, FLY_BOX);
  g3.destroy();

  // Viền bằng tam giác to hơn nằm dưới, vì `lineStyle` bị cắt ở đỉnh nhọn.
  const g5 = scene.make.graphics({ x: 0, y: 0 }, false);
  const w = YOU_W + YOU_PAD * 2, h = YOU_H + YOU_PAD * 2;
  const tri = (cx: number, top: number, halfW: number, height: number) =>
    [cx - halfW, top, cx + halfW, top, cx, top + height] as const;
  g5.fillStyle(YOU_INK, 1);
  g5.fillTriangle(...tri(w / 2, YOU_PAD - 2, YOU_W / 2 + 2, YOU_H + 4));
  g5.fillStyle(YOU_FILL, 1);
  g5.fillTriangle(...tri(w / 2, YOU_PAD, YOU_W / 2, YOU_H));
  g5.generateTexture(FX.you, w, h);
  g5.destroy();

  const g4 = scene.make.graphics({ x: 0, y: 0 }, false);
  const r = PUFF_PX / 2;
  for (let i = PUFF_LAYERS; i >= 1; i--) {
    g4.fillStyle(0xffffff, 0.11);
    g4.fillCircle(r, r, r * (i / PUFF_LAYERS));
  }
  g4.generateTexture(FX.puff, PUFF_PX, PUFF_PX);
  g4.destroy();

  // Vệt mưa đậm ở đáy, nhạt dần lên đỉnh, chấm tròn ở đáy để thu ngắn vẫn ra giọt.
  const g6 = scene.make.graphics({ x: 0, y: 0 }, false);
  for (let i = 0; i < DROP_H; i++) {
    const t = i / (DROP_H - 1);                        // 0 đỉnh -> 1 đáy
    g6.fillStyle(0xffffff, 0.12 + 0.88 * t * t);
    g6.fillRect(1, i, DROP_W - 2, 1);
  }
  g6.fillStyle(0xffffff, 1);
  g6.fillCircle(DROP_W / 2, DROP_H - DROP_W / 2, DROP_W / 2);
  g6.generateTexture(FX.drop, DROP_W, DROP_H);
  g6.destroy();

  // Ê-líp dẹt theo mặt đất iso; chừa lề cho nét dày khỏi bị xén.
  const g7 = scene.make.graphics({ x: 0, y: 0 }, false);
  const rcx = RIPPLE_W / 2, rcy = RIPPLE_H / 2;
  g7.lineStyle(3, 0xffffff, 0.35);
  g7.strokeEllipse(rcx, rcy, RIPPLE_W - 4, RIPPLE_H - 4);
  g7.lineStyle(1.2, 0xffffff, 0.95);
  g7.strokeEllipse(rcx, rcy, RIPPLE_W - 4, RIPPLE_H - 4);
  g7.generateTexture(FX.ripple, RIPPLE_W, RIPPLE_H);
  g7.destroy();
}
