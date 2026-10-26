import Phaser from "phaser";
import { RENDER_SCALE } from "../core/render";
import { sealTexture } from "../core/texSeal";

export type ClayTone = { name: string; hi: string; base: string; lo: string; lip: string; edge: string; flat?: boolean };

export const CLAY = {
  red: { name: "red", hi: "#f77a64", base: "#e0432f", lo: "#b52a1a", lip: "#8f1f13", edge: "#5e130b" },
  cream: { name: "cream", hi: "#fffdf6", base: "#f6efdc", lo: "#e3d6b4", lip: "#b9a47a", edge: "#7d6a43" },
  grey: { name: "grey", hi: "#d8d8d8", base: "#b6b6b6", lo: "#9a9a9a", lip: "#6f6f72", edge: "#4a4a4d", flat: true },
} satisfies Record<string, ClayTone>;

export type ClayState = "up" | "hover" | "down";

const S = Math.max(2, Math.ceil(RENDER_SCALE));
export const PAD = { x: 24, top: 16, bottom: 36 };
const LIP: Record<ClayState, number> = { up: 4, hover: 6, down: 1 };
const LIP_BASE = 4;

/** Toạ độ góc trái-trên của ảnh so với tâm thân nút. */
export const clayOrigin = (w: number, h: number) => ({ x: -(w / 2 + PAD.x), y: -(h / 2 + PAD.top) });

/** Tâm mặt nút lệch bao nhiêu so với tâm thân, theo trạng thái. */
export const clayFaceDy = (state: ClayState) => (LIP_BASE - LIP[state]) - LIP_BASE / 2;

function path(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function vgrad(ctx: CanvasRenderingContext2D, y0: number, y1: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function hgrad(ctx: CanvasRenderingContext2D, x0: number, x1: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function make(scene: Phaser.Scene, key: string, cw: number, ch: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, Math.ceil(cw * S), Math.ceil(ch * S))!;
  const ctx = tex.context;
  ctx.scale(S, S);
  draw(ctx);
  tex.refresh();
  sealTexture(scene.textures, key);
  return key;
}

function shadowed(ctx: CanvasRenderingContext2D, color: string, blur: number, dy: number, fill: () => void) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur * S;
  ctx.shadowOffsetY = dy * S;
  fill();
  ctx.restore();
}

/** Khối đất sét: môi dưới, mặt chuyển màu, vệt sáng, gờ sáng trên và viền nét. */
function slab(
  ctx: CanvasRenderingContext2D, tone: ClayTone, x: number, ft: number, w: number, fh: number, lip: number, r: number,
) {
  const lipY = ft + lip;
  shadowed(ctx, "rgba(60,28,10,.30)", 24, 18, () => { path(ctx, x, lipY, w, fh, r); ctx.fillStyle = tone.lip; ctx.fill(); });
  shadowed(ctx, "rgba(60,28,10,.38)", 5, 8, () => { path(ctx, x, lipY, w, fh, r); ctx.fillStyle = tone.lip; ctx.fill(); });
  path(ctx, x, lipY, w, fh, r);
  ctx.fillStyle = vgrad(ctx, ft + fh * 0.5, lipY + fh, [[0, tone.lip], [1, tone.edge]]);
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = tone.edge + "99";
  ctx.stroke();

  ctx.save();
  path(ctx, x, ft, w, fh, r);
  ctx.clip();
  ctx.fillStyle = vgrad(ctx, ft, ft + fh, [[0, tone.hi], [0.55, tone.base], [1, tone.lo]]);
  ctx.fillRect(x, ft, w, fh);
  ctx.fillStyle = vgrad(ctx, ft + fh * 0.6, ft + fh, [[0, "rgba(0,0,0,0)"], [1, "rgba(0,0,0,.2)"]]);
  ctx.fillRect(x, ft, w, fh);
  ctx.fillStyle = hgrad(ctx, x, x + w, [[0, "rgba(0,0,0,.10)"], [0.1, "rgba(0,0,0,0)"], [0.9, "rgba(255,255,255,0)"], [1, "rgba(255,255,255,.26)"]]);
  ctx.fillRect(x, ft, w, fh);
  path(ctx, x + 1.2, ft + 1.2, w - 2.4, fh - 2.4, r - 1.2);
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = vgrad(ctx, ft, ft + fh * 0.6, [[0, "rgba(255,255,255,.9)"], [1, "rgba(255,255,255,0)"]]);
  ctx.stroke();
  const gl = tone.flat ? 0.45 : 1;
  path(ctx, x + r * 0.55, ft + 4, w - r * 1.1, fh * 0.38, Math.min(r, fh * 0.2));
  ctx.fillStyle = vgrad(ctx, ft + 4, ft + 4 + fh * 0.38, [[0, `rgba(255,255,255,${0.62 * gl})`], [1, `rgba(255,255,255,${0.04 * gl})`]]);
  ctx.fill();
  ctx.restore();

  path(ctx, x, ft, w, fh, r);
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = tone.edge + "8c";
  ctx.stroke();
}

/** Nút cao `h` gồm cả môi dưới; trả về key texture. */
export function clayButton(scene: Phaser.Scene, tone: ClayTone, w: number, h: number, state: ClayState) {
  const lip = LIP[state], fh = h - LIP_BASE;
  return make(scene, `clay:${tone.name}:${w}x${h}:${state}`, w + PAD.x * 2, h + PAD.top + PAD.bottom, (ctx) => {
    slab(ctx, tone, PAD.x, PAD.top + LIP_BASE - lip, w, fh, lip, Math.min(20, fh * 0.45));
  });
}

export type CardOpts = { ornate?: boolean; lip?: number; radius?: number };

/** Khung kem có môi dưới; `ornate` thêm kẻ vàng và bốn mắt ở góc. */
export function clayCard(scene: Phaser.Scene, w: number, h: number, o: CardOpts = {}) {
  const lip = o.lip ?? 9, r = o.radius ?? 26, ornate = o.ornate ?? true;
  return make(scene, `clay:card:${w}x${h}:${lip}:${r}:${ornate}`, w + PAD.x * 2, h + PAD.top + PAD.bottom, (ctx) => {
    const x = PAD.x, ft = PAD.top;
    const tone: ClayTone = { ...CLAY.cream, hi: "#f6ead0", base: "#ecdcb4", lo: "#dcc592", lip: "#a68c56", edge: "#6e5a30" };
    slab(ctx, tone, x, ft, w, h - lip, lip, r);
    if (!ornate) return;
    const fh = h - lip, ins = 11;
    path(ctx, x + ins, ft + ins, w - ins * 2, fh - ins * 2, r - 8);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ead69c";
    ctx.stroke();
    path(ctx, x + ins + 1.8, ft + ins + 1.8, w - ins * 2 - 3.6, fh - ins * 2 - 3.6, r - 10);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(150,115,40,.28)";
    ctx.stroke();
    path(ctx, x + ins - 1.8, ft + ins - 1.8, w - ins * 2 + 3.6, fh - ins * 2 + 3.6, r - 6);
    ctx.strokeStyle = "rgba(255,255,255,.85)";
    ctx.stroke();
    for (const [dx, dy] of [[1, 1], [w - 1, 1], [1, fh - 1], [w - 1, fh - 1]] as const) {
      ctx.save();
      ctx.translate(x + dx + (dx > w / 2 ? -9 : 9), ft + dy + (dy > fh / 2 ? -9 : 9));
      ctx.rotate(Math.PI / 4);
      path(ctx, -6, -6, 12, 12, 3);
      ctx.shadowColor = "#a86d08";
      ctx.shadowOffsetY = 2 * S;
      ctx.fillStyle = "#e29d12";
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(x + dx + (dx > w / 2 ? -9 : 9), ft + dy + (dy > fh / 2 ? -9 : 9));
      ctx.rotate(Math.PI / 4);
      path(ctx, -6, -6, 12, 12, 3);
      ctx.fillStyle = vgrad(ctx, -6, 6, [[0, "#ffe9a0"], [1, "#e29d12"]]);
      ctx.fill();
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = "rgba(168,109,8,.8)";
      ctx.stroke();
      ctx.restore();
    }
  });
}

/** Ảnh nút/khung đặt sao cho tâm thân trùng (cx, cy). */
export function clayImage(scene: Phaser.Scene, key: string, cx: number, cy: number, w: number, h: number) {
  const o = clayOrigin(w, h);
  return scene.add.image(cx + o.x, cy + o.y, key).setOrigin(0, 0).setScale(1 / S);
}
