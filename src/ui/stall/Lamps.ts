import Phaser from "phaser";
import { TW, depthOf, toScreen } from "../../world/iso";
import { MAP, floorAt, tileAt } from "../../world/map";
import {
  LAMP_SPOTS, WALL_FACE_H, easeLevel, faceRun, lampAnchor, lampFloor, lampLevel, ovenTarget, OVEN_IDLE, type LampFace, type LampSpot,
} from "../../world/lampSpots";
import { LIGHT_DEPTH } from "../../art/light/env";
import { materialOf } from "../../art/light/materials";
import { RENDER_SCALE } from "../../core/render";
import { ZOOM } from "../../world/camera";
import { COUNTER, PROP, footY } from "../../art";
import { TABLE_DROP } from "../../art/photo";

export { LAMP_SPOTS, lampLevel };

const LAMP_ON = "lamp_on";
const LAMP_OFF = "lamp_off";

/** Cao và rộng đèn, px thiết kế (ảnh 221 × 256). */
const LAMP_H = 20;
const LAMP_W = (LAMP_H * 221) / 256;
/** Tâm đế đèn và tâm bóng trong ảnh, theo tỉ lệ khung. */
const PLATE = { x: 0.16, y: 0.25 };
const BULB = { x: 0.62, y: 0.85 };

const WARM = "255,190,100";
const SKEW = 0.5;
const WALL_R = 28;
const WALL_UP = 32;
const WALL_BELOW = 60;
const HALO_R = 12;
const CORE_R = 9;
const GLOW = "255,197,98";
const HOT = "255,241,176";
const FLOOR_R = 2.2;
const FLOOR_OUT = 0.9;
const LEVEL_STEP = 1 / 48;
const TABLE_LIFT = COUNTER.TOP_ABOVE_FOOT - TABLE_DROP - 21;
const TABLE_INSET = 0.86;
const TABLE_R = 1;
const FACE_H = 30;
const WOOD_R = 30;
const OVEN_WARM = "255,170,90";
const OVEN_K = 0.9;
const OVEN_KEYS: readonly string[] = [PROP.oven, PROP.ovenE];
/** Tâm cửa kính trong ảnh lò, theo tỉ lệ khung. */
const OVEN_GLASS: Record<string, { x: number; y: number }> = {
  [PROP.oven]: { x: 0.32, y: 0.56 },
  [PROP.ovenE]: { x: 0.36, y: 0.52 },
};

type Pt = { x: number; y: number };
type Piece = { img: Phaser.GameObjects.Image; k: number };

let serial = 0;

function density() {
  return Math.min(4, Math.max(3.2, Math.ceil(ZOOM * RENDER_SCALE * 12) / 10));
}

/** Điểm (u, v) trên mặt tường của ô thứ `t` dọc theo mặt `face`; `fixed` là toạ độ ô còn lại. */
function facePoint(face: LampFace, fixed: number, t: number) {
  const c = face === "y" ? toScreen(t + 0.5, fixed + 0.5) : toScreen(fixed + 0.5, t + 0.5);
  const top = c.sy - 81;
  return face === "y"
    ? (u: number, v: number): Pt => ({ x: c.sx - TW / 2 + u, y: top + u * SKEW + v })
    : (u: number, v: number): Pt => ({ x: c.sx + u, y: top + TW / 4 - u * SKEW + v });
}

function downscale(src: HTMLImageElement, w: number, h: number) {
  let cur: HTMLImageElement | HTMLCanvasElement = src;
  while (cur.width / 2 > w) {
    const c = document.createElement("canvas");
    c.width = Math.ceil(cur.width / 2);
    c.height = Math.ceil(cur.height / 2);
    const g = c.getContext("2d")!;
    g.imageSmoothingQuality = "high";
    g.drawImage(cur, 0, 0, c.width, c.height);
    cur = c;
  }
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const g = out.getContext("2d")!;
  g.imageSmoothingQuality = "high";
  g.drawImage(cur, 0, 0, w, h);
  return out;
}

function radial(ctx: CanvasRenderingContext2D, r: number, stops: readonly (readonly [number, number])[], rgb = WARM) {
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  for (const [at, a] of stops) g.addColorStop(at, `rgba(${rgb},${a})`);
  return g;
}

export class Lamps {
  private readonly keys: string[] = [];
  private readonly objects: Phaser.GameObjects.Image[] = [];
  private readonly pieces: Piece[] = [];
  private readonly lit: Phaser.GameObjects.Image[] = [];
  private readonly S = density();
  private readonly id = serial++;
  private readonly oven: Piece[] = [];
  private level = -1;
  private ovenGoal = OVEN_IDLE;
  private ovenNow = OVEN_IDLE;
  private ovenShown = -1;

  /** Gọi trong `preload` của cảnh. */
  static preload(scene: Phaser.Scene) {
    if (!scene.textures.exists(LAMP_ON)) scene.load.image(LAMP_ON, "art/lamp_on.webp");
    if (!scene.textures.exists(LAMP_OFF)) scene.load.image(LAMP_OFF, "art/lamp_off.webp");
  }

  constructor(
    private readonly scene: Phaser.Scene,
    spots: readonly LampSpot[],
    private readonly opts: { overcast: boolean },
  ) {
    const keyOn = this.bakeLamp("on", LAMP_ON), keyOff = this.bakeLamp("off", LAMP_OFF);
    spots.forEach((spot, i) => this.build(spot, i, keyOn, keyOff));
    this.buildOvens();
    this.update(0);
  }

  private bakeLamp(name: string, src: string) {
    const img = this.scene.textures.get(src).getSourceImage() as HTMLImageElement;
    const key = `lamp${this.id}_${name}`;
    this.scene.textures.addCanvas(key, downscale(img, Math.round(LAMP_W * this.S), Math.round(LAMP_H * this.S)));
    this.keys.push(key);
    return key;
  }

  private bake(name: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
    const key = `lamp${this.id}_${name}`;
    const tex = this.scene.textures.createCanvas(key, Math.ceil(w * this.S), Math.ceil(h * this.S))!;
    const ctx = tex.getContext();
    ctx.scale(this.S, this.S);
    draw(ctx);
    tex.refresh();
    this.keys.push(key);
    return key;
  }

  private add(key: string, x: number, y: number, depth: number, blend = true) {
    const img = this.scene.add.image(x, y, key).setScale(1 / this.S).setDepth(depth);
    if (blend) img.setOrigin(0, 0).setBlendMode(Phaser.BlendModes.SCREEN);
    this.objects.push(img);
    return img;
  }

  private build(spot: LampSpot, i: number, keyOn: string, keyOff: string) {
    const a = lampAnchor(spot);
    const sign = spot.face === "y" ? 1 : -1;
    const dir = spot.flip ? -1 : 1;
    const base = depthOf(spot.tx + 0.5, spot.ty + 0.5);
    const run = faceRun(spot.tx, spot.ty, spot.face);
    const bulb: Pt = { x: a.x + dir * (BULB.x - PLATE.x) * LAMP_W, y: a.y + (BULB.y - PLATE.y) * LAMP_H };

    const origin = [spot.flip ? 1 - PLATE.x : PLATE.x, PLATE.y] as const;
    this.add(keyOff, a.x, a.y, base + 10, false).setOrigin(...origin).setFlipX(spot.flip);
    const lit = this.add(keyOn, a.x, a.y, base + 10.5, false).setOrigin(...origin).setFlipX(spot.flip);
    this.lit.push(lit);

    const wallW = WALL_R * 2, wallH = WALL_UP + WALL_BELOW;
    const wallLeft = a.x - WALL_R, wallTop = a.y - WALL_UP;
    const fixed = spot.face === "y" ? spot.ty : spot.tx;
    const wallKey = this.bake(`wall${i}`, wallW, wallH, (ctx) => {
      ctx.beginPath();
      for (const t of run) {
        const p = facePoint(spot.face, fixed, t);
        [p(0, 0), p(TW / 2, 0), p(TW / 2, WALL_FACE_H), p(0, WALL_FACE_H)]
          .forEach((q, n) => (n ? ctx.lineTo(q.x - wallLeft, q.y - wallTop) : ctx.moveTo(q.x - wallLeft, q.y - wallTop)));
        ctx.closePath();
      }
      ctx.clip();
      ctx.translate(a.x - wallLeft, a.y - wallTop);
      ctx.transform(1, sign * SKEW, 0, 1, 0, 0);
      ctx.translate(0, bulb.y - a.y);
      ctx.save();
      ctx.scale(1, 0.9);
      ctx.fillStyle = radial(ctx, WALL_R, [[0, 0.17], [0.45, 0.11], [1, 0]], GLOW);
      ctx.fillRect(-WALL_R, -WALL_R, WALL_R * 2, WALL_R * 2);
      ctx.restore();
      ctx.fillStyle = radial(ctx, CORE_R, [[0, 0.27], [0.5, 0.13], [1, 0]], HOT);
      ctx.fillRect(-CORE_R, -CORE_R, CORE_R * 2, CORE_R * 2);
    });
    this.strips(wallKey, wallLeft, wallTop, wallW, wallH, spot, run, 5, 0.9 * spot.power);

    const hw = HALO_R * 2;
    const haloKey = this.bake(`halo${i}`, hw, hw, (ctx) => {
      ctx.translate(HALO_R, HALO_R);
      ctx.fillStyle = radial(ctx, HALO_R, [[0, 0.5], [0.4, 0.2], [1, 0]], HOT);
      ctx.fillRect(-HALO_R, -HALO_R, hw, hw);
    });
    this.strips(haloKey, bulb.x - HALO_R, bulb.y - HALO_R, hw, hw, spot, run, 9, spot.power);

    const fl = lampFloor(spot, FLOOR_OUT);
    const fw = FLOOR_R * TW * Math.SQRT1_2 * 2, fh = fw / 2;
    const floorKey = this.bake(`floor${i}`, fw, fh, (ctx) => {
      ctx.translate(fw / 2, fh / 2);
      ctx.transform(TW / 2, TW / 4, -TW / 2, TW / 4, 0, 0);
      ctx.fillStyle = radial(ctx, FLOOR_R, [[0, 0.3], [0.4, 0.16], [0.75, 0.06], [1, 0]]);
      ctx.fillRect(-FLOOR_R, -FLOOR_R, FLOOR_R * 2, FLOOR_R * 2);
    });
    const gloss = materialOf(floorAt(Math.floor(fl.wx), Math.floor(fl.wy))).gloss;
    const cx = (fl.wx - fl.wy) * (TW / 2), cy = (fl.wx + fl.wy) * (TW / 4);
    this.pieces.push({
      img: this.add(floorKey, cx - fw / 2, cy - fh / 2, LIGHT_DEPTH.actorShadow + 1000),
      k: (0.6 + 0.4 * gloss) * spot.power,
    });
    if (spot.pool) this.buildPool(spot, i);
  }

  private tableTiles(wx: number, wy: number) {
    const out: { tx: number; ty: number }[] = [];
    for (let ty = 0; ty < MAP.length; ty++) {
      for (let tx = 0; tx < MAP[ty].length; tx++) {
        if ("QRZ".includes(tileAt(tx, ty)) && Math.hypot(tx + 0.5 - wx, ty + 0.5 - wy) < TABLE_R + 0.7) out.push({ tx, ty });
      }
    }
    return out;
  }

  private clipDiamonds(ctx: CanvasRenderingContext2D, tiles: { tx: number; ty: number }[], ox: number, oy: number) {
    ctx.beginPath();
    for (const t of tiles) {
      const c = toScreen(t.tx + 0.5, t.ty + 0.5);
      const x = c.sx - ox, y = c.sy - TABLE_LIFT - oy;
      const w = (TW / 2) * TABLE_INSET, h = (TW / 4) * TABLE_INSET;
      ctx.moveTo(x, y - h);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x - w, y);
      ctx.closePath();
    }
    ctx.clip();
  }

  /** Đèn chỉ phụ: lớp men xanh rất nhạt, mặt gỗ phía trước ấm nhẹ và một vệt phản chiếu nhỏ trên men. */
  private buildPool(spot: LampSpot, i: number) {
    const pool = spot.pool!;
    const tiles = this.tableTiles(pool.wx, pool.wy);
    const depth = Math.max(...tiles.map((t) => depthOf(t.tx + 0.5, t.ty + 0.5)), 0) + 2;

    const fw = TABLE_R * TW * Math.SQRT1_2 * 2, fh = fw / 2;
    const cx = (pool.wx - pool.wy) * (TW / 2), cy = (pool.wx + pool.wy) * (TW / 4) - TABLE_LIFT;
    const teal = this.bake(`pool${i}`, fw, fh, (ctx) => {
      this.clipDiamonds(ctx, tiles, cx - fw / 2, cy - fh / 2);
      ctx.translate(fw / 2, fh / 2);
      ctx.transform(TW / 2, TW / 4, -TW / 2, TW / 4, 0, 0);
      ctx.fillStyle = radial(ctx, TABLE_R, [[0, 0.05], [0.5, 0.032], [1, 0]], "255,215,154");
      ctx.fillRect(-TABLE_R, -TABLE_R, TABLE_R * 2, TABLE_R * 2);
    });
    this.pieces.push({ img: this.add(teal, cx - fw / 2, cy - fh / 2, depth), k: spot.power });

    if (pool.wood !== undefined) this.buildWood(pool.wood, Math.floor(pool.wy) + 1, tiles, depth, i, spot.power);

    if (pool.glint) {
      const g = pool.glint, gr = 0.22, gw = gr * TW * Math.SQRT1_2 * 2, gh = gw / 2;
      const gx = (g.wx - g.wy) * (TW / 2), gy = (g.wx + g.wy) * (TW / 4) - TABLE_LIFT;
      const key = this.bake(`glint${i}`, gw, gh, (ctx) => {
        this.clipDiamonds(ctx, tiles, gx - gw / 2, gy - gh / 2);
        ctx.translate(gw / 2, gh / 2);
        ctx.transform(TW / 2, TW / 4, -TW / 2, TW / 4, 0, 0);
        ctx.scale(1.4, 0.7);
        ctx.fillStyle = radial(ctx, gr, [[0, 0.11], [0.5, 0.06], [1, 0]], "255,243,201");
        ctx.fillRect(-gr, -gr, gr * 2, gr * 2);
      });
      this.pieces.push({ img: this.add(key, gx - gw / 2, gy - gh / 2, depth), k: spot.power });
    }
  }

  /** Mặt gỗ hướng +y của dãy bàn (mặt phẳng y = `wy`), tâm vệt ở x thế giới `wx`. */
  private buildWood(wx: number, wy: number, tiles: { tx: number; ty: number }[], depth: number, i: number, power: number) {
    const faces = tiles.filter((t) => t.ty + 1 === wy);
    if (!faces.length) return;
    const origin = toScreen(wx, wy);
    const w = WOOD_R * 2, h = WOOD_R + FACE_H + 20;
    const left = origin.sx - WOOD_R, top = origin.sy - TABLE_LIFT - WOOD_R * 0.5 - 8;
    const key = this.bake(`wood${i}`, w, h, (ctx) => {
      ctx.beginPath();
      for (const t of faces) {
        const a = toScreen(t.tx, wy), b = toScreen(t.tx + 1, wy);
        const pts = [
          { x: a.sx, y: a.sy - TABLE_LIFT }, { x: b.sx, y: b.sy - TABLE_LIFT },
          { x: b.sx, y: b.sy - TABLE_LIFT + FACE_H }, { x: a.sx, y: a.sy - TABLE_LIFT + FACE_H },
        ];
        pts.forEach((q, n) => (n ? ctx.lineTo(q.x - left, q.y - top) : ctx.moveTo(q.x - left, q.y - top)));
        ctx.closePath();
      }
      ctx.clip();
      ctx.translate(origin.sx - left, origin.sy - TABLE_LIFT - top + FACE_H * 0.4);
      ctx.transform(1, SKEW, 0, 1, 0, 0);
      ctx.fillStyle = radial(ctx, WOOD_R, [[0, 0.07], [0.5, 0.045], [1, 0]], "242,191,115");
      ctx.fillRect(-WOOD_R, -WOOD_R, WOOD_R * 2, WOOD_R * 2);
    });
    this.pieces.push({ img: this.add(key, left, top, depth), k: power });
  }

  /** Mỗi ô lò `O` có sprite lò đã đặt trong cảnh: quầng quanh cửa kính và vệt sáng hắt ra sàn trước lò. */
  private buildOvens() {
    let n = 0;
    for (let ty = 0; ty < MAP.length; ty++) {
      for (let tx = 0; tx < MAP[ty].length; tx++) {
        if (tileAt(tx, ty) !== "O") continue;
        const c = toScreen(tx + 0.5, ty + 0.5), foot = footY(c.sy);
        const img = this.scene.children.list.find((o): o is Phaser.GameObjects.Image =>
          o instanceof Phaser.GameObjects.Image && OVEN_KEYS.includes(o.texture.key)
          && Math.abs(o.x - c.sx) < 1 && Math.abs(o.y - foot) < 30);
        if (!img) continue;
        this.buildOven(img, tx, ty, n++);
      }
    }
  }

  private buildOven(img: Phaser.GameObjects.Image, tx: number, ty: number, n: number) {
    const g = OVEN_GLASS[img.texture.key];
    const left = img.x - img.displayWidth * img.originX, top = img.y - img.displayHeight * img.originY;
    const gx = left + g.x * img.displayWidth, gy = top + g.y * img.displayHeight;
    const r = img.displayWidth * 0.7 + 6, hw = r * 2;
    const haloKey = this.bake(`ovenhalo${n}`, hw, hw, (ctx) => {
      ctx.translate(r, r);
      ctx.fillStyle = radial(ctx, r, [[0, 0.95], [0.2, 0.6], [0.5, 0.2], [1, 0]], OVEN_WARM);
      ctx.fillRect(-r, -r, hw, hw);
    });
    this.oven.push({ img: this.add(haloKey, gx - r, gy - r, depthOf(tx + 0.5, ty + 0.5) + 2), k: OVEN_K });

    const fl = { wx: tx + 0.5, wy: ty + 1.5 };
    const fr = 1.5, fw = fr * TW * Math.SQRT1_2 * 2, fh = fw / 2;
    const floorKey = this.bake(`ovenfloor${n}`, fw, fh, (ctx) => {
      ctx.translate(fw / 2, fh / 2);
      ctx.transform(TW / 2, TW / 4, -TW / 2, TW / 4, 0, 0);
      ctx.fillStyle = radial(ctx, fr, [[0, 0.95], [0.4, 0.55], [0.75, 0.2], [1, 0]], OVEN_WARM);
      ctx.fillRect(-fr, -fr, fr * 2, fr * 2);
    });
    const cx = (fl.wx - fl.wy) * (TW / 2), cy = (fl.wx + fl.wy) * (TW / 4);
    this.oven.push({
      img: this.add(floorKey, cx - fw / 2, cy - fh / 2, LIGHT_DEPTH.actorShadow + 1000),
      k: OVEN_K,
    });
  }

  setOven(busy: boolean) {
    this.ovenGoal = ovenTarget(busy);
  }

  /** Cắt ảnh sáng theo cột ô tường để mỗi dải nằm đúng độ sâu của ô nó phủ lên. */
  private strips(
    key: string, left: number, top: number, w: number, h: number,
    spot: LampSpot, run: number[], bump: number, k: number,
  ) {
    const fixed = spot.face === "y" ? spot.ty : spot.tx;
    const range = (t: number): [number, number] => {
      const c = spot.face === "y" ? (t - fixed) * (TW / 2) : (fixed - t) * (TW / 2);
      const x0 = spot.face === "y" ? c - TW / 2 : c;
      return [x0, x0 + TW / 2];
    };
    const spans = run.map((t) => range(t));
    const lo = Math.min(...spans.map((s) => s[0])), hi = Math.max(...spans.map((s) => s[1]));
    run.forEach((t, n) => {
      const x0 = spans[n][0] <= lo ? -Infinity : spans[n][0];
      const x1 = spans[n][1] >= hi ? Infinity : spans[n][1];
      const a = Math.max(left, x0), b = Math.min(left + w, x1);
      if (b <= a) return;
      const depth = (spot.face === "y" ? depthOf(t + 0.5, fixed + 0.5) : depthOf(fixed + 0.5, t + 0.5)) + bump;
      const img = this.add(key, left, top, depth).setCrop((a - left) * this.S, 0, (b - a) * this.S, h * this.S);
      this.pieces.push({ img, k });
    });
  }

  update(minutes: number) {
    this.ovenNow = easeLevel(this.ovenNow, this.ovenGoal, this.scene.game.loop.delta);
    if (Math.abs(this.ovenNow - this.ovenShown) > 1 / 200) {
      this.ovenShown = this.ovenNow;
      for (const p of this.oven) p.img.setAlpha(this.ovenNow * p.k);
    }
    const level = Math.round(lampLevel(minutes, this.opts.overcast) / LEVEL_STEP) * LEVEL_STEP;
    if (level === this.level) return;
    this.level = level;
    for (const o of this.lit) o.setAlpha(level);
    for (const p of this.pieces) p.img.setAlpha(level * p.k);
  }

  destroy() {
    for (const o of this.objects) o.destroy();
    this.objects.length = 0;
    this.pieces.length = 0;
    this.oven.length = 0;
    this.lit.length = 0;
    for (const k of this.keys) if (this.scene.textures.exists(k)) this.scene.textures.remove(k);
    this.keys.length = 0;
  }
}
