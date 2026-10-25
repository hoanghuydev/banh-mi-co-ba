import Phaser from "phaser";
import { depthOf, toScreen } from "../world/iso";
import { bakeWall, drawPhoto, photoRatio } from "./photo";
import { WALL_OVERHANG, sliceColumns, yieldTo } from "./slices";
import { FONT } from "../ui/theme";
import { shopName } from "../content/shop";

/** Cột x thế giới của đầu trái bảng, và độ cao mép sau mái dù (px) trên sàn. */
const LEFT_X = 6.5;
const RIDGE_Z = 74;

/** Ảnh `shopfront` nguyên bản 1360 px rộng; mọi số "SRC" dưới đây đo trên ảnh đó. */
const SRC_W = 1360;
const SCALE = 0.1384;
const W = SRC_W * SCALE;
/** Điểm mép sau mái dù ở đầu trái bảng. */
const ANCHOR = { x: 163, y: 203 };
/** Đường giữa mặt bảng: y = FACE_Y + 0.5 · (x − FACE_X). */
const FACE_X = 179;
const FACE_Y = 111;
const TEXT_X = 602;
const TEXT_ROOM = 775;
const FACE_H = 140;

const INK = "#7f261c";
const BASE_PX = 22;
const MIN_PX = 8;
const TEX = "shopfront_wall";
/** Mép trước mái dù nhô ra tới đây: đồ và người đứng hàng y1 nằm dưới mái. */
const AWNING_Y = 1.7;

/** Đặt lại depth theo chỗ người chơi mỗi khung hình. */
export type Awning = { follow(x: number, y: number): void };

/** Trên mọi đồ hàng y1 chạm cột `m`: đồ xa nhất chạm tới có tâm (m + 3,5; 1,5). */
const underDepth = (m: number) => depthOf(m + 3.5, 1.5) + 50;

export function createSign(scene: Phaser.Scene, name = ""): Awning | null {
  const ratio = photoRatio(scene, "shopfront");
  if (!ratio) return null;
  const h = W * ratio;

  bakeWall(scene, TEX, W, h, 0, (ctx) => {
    drawPhoto(ctx, scene, "shopfront", W, h);

    const lines = fitLines(ctx, shopName(name), TEXT_ROOM * SCALE, FACE_H * SCALE * 0.9);
    ctx.save();
    ctx.translate(TEXT_X * SCALE, (FACE_Y + 0.5 * (TEXT_X - FACE_X)) * SCALE);
    ctx.transform(1, 0.5, 0, 1, 0, 0);
    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${lines.px}px ${FONT}`;
    ctx.letterSpacing = "0.6px";
    const step = lines.px * 1.15;
    lines.text.forEach((line, i) => {
      ctx.fillText(line, 0, (i - (lines.text.length - 1) / 2) * step + lines.px * 0.08);
    });
    ctx.restore();
  });

  const at = toScreen(LEFT_X, 1.1);
  const left = at.sx - ANCHOR.x * SCALE;
  const top = at.sy - RIDGE_Z - ANCHOR.y * SCALE;
  const slices = sliceColumns(scene, TEX, left, top, W, underDepth, -WALL_OVERHANG);
  return { follow: (x, y) => yieldTo(slices, underDepth, x, y, y >= AWNING_Y) };
}

/** Một dòng nếu đủ to, không thì tách hai dòng ở chỗ cân nhất; chọn cỡ chữ lớn hơn. */
function fitLines(ctx: CanvasRenderingContext2D, text: string, room: number, tall: number) {
  const widthAt = (s: string, px: number) => {
    ctx.font = `800 ${px}px ${FONT}`;
    ctx.letterSpacing = "0.6px";
    return ctx.measureText(s).width;
  };
  const fit = (lines: string[]) => {
    let px = BASE_PX;
    const widest = () => Math.max(...lines.map((l) => widthAt(l, px)));
    while (px > MIN_PX && (widest() > room || px * 1.15 * lines.length > tall)) px--;
    return { text: lines, px };
  };
  const one = fit([text]);
  const words = text.split(" ");
  if (words.length < 2) return one;
  let best = one;
  for (let i = 1; i < words.length; i++) {
    const two = fit([words.slice(0, i).join(" "), words.slice(i).join(" ")]);
    if (two.px > best.px) best = two;
  }
  return best;
}
