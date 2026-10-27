import Phaser from "phaser";

/** Các texture hạt vẽ trắng để emitter `tint`. */
export const FX = {
  ring: "ring", fly: "fly", puff: "puff", you: "you",
  drop: "drop", ripple: "ripple",
} as const;

/** Tam giác đặc chứ không chữ, vì trên đầu khách đã có `?` và `!`. */
const YOU_W = 13, YOU_H = 9, YOU_PAD = 3;
const YOU_INK = 0x2b2f31;
const YOU_FILL = 0xffe9a8;

/** Nửa bề ngang ô thoi của khung góc, hụt mép ô 2,5 px để nhịp phình không chạm ô bên. */
const RING_HW = 27.5;
/** Mỗi nhánh chữ V dài bằng chừng này phần cạnh ô. */
const RING_ARM = 0.3;
const RING_PAD = 3;
/** Nướng dày gấp chừng này để nét dưới 1 px vẫn mịn khi camera phóng; `StallScene` chia lại. */
export const RING_SS = 4;
const RING_SHADOW = "rgba(70,44,18,0.38)";
const RING_EDGE = "#dc9636";
const RING_CORE = "rgba(255,247,226,0.95)";

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

export function buildFx(scene: Phaser.Scene) {
  ringTexture(scene);

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

/** Bốn góc chữ V ôm ô thoi; bóng nâu lệch xuống để vàng nhạt vẫn nổi trên gạch trắng. */
function ringTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(FX.ring)) scene.textures.remove(FX.ring);
  const hh = RING_HW / 2, w = (RING_HW + RING_PAD) * 2, h = (hh + RING_PAD) * 2;
  const tex = scene.textures.createCanvas(FX.ring, w * RING_SS, h * RING_SS);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.scale(RING_SS, RING_SS);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const V = [[0, -hh], [RING_HW, 0], [0, hh], [-RING_HW, 0]];
  const corners = (dy: number) => {
    ctx.beginPath();
    V.forEach(([x, y], i) => {
      const [px, py] = V[(i + 3) % 4], [nx, ny] = V[(i + 1) % 4];
      ctx.moveTo(w / 2 + x + (px - x) * RING_ARM, h / 2 + dy + y + (py - y) * RING_ARM);
      ctx.lineTo(w / 2 + x, h / 2 + dy + y);
      ctx.lineTo(w / 2 + x + (nx - x) * RING_ARM, h / 2 + dy + y + (ny - y) * RING_ARM);
    });
  };
  for (const [dy, lw, col] of [[0.8, 2.9, RING_SHADOW], [0, 2, RING_EDGE], [0, 0.6, RING_CORE]] as const) {
    corners(dy);
    ctx.lineWidth = lw;
    ctx.strokeStyle = col;
    ctx.stroke();
  }
  tex.refresh();
}
