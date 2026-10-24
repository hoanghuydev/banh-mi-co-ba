import Phaser from "phaser";
import { depthOf, facingOf8, toScreen, type Facing8 } from "../world/iso";
import { COUNTER_Y, QUEUE_SLOTS } from "../world/map";
import { BODY_H, buildBody, footY, textureFor } from "../art";
import { STRIDE, GAIT_FRAMES, walkTextureFor } from "../art/character";
import { artScale } from "../art/photo";
import { ActorLight } from "../art/light/actor";
import type { Customer } from "../sim/customer";
import { nowState } from "../sim/perception";
import { FONT } from "../ui/theme";
import type { BubblePool } from "../ui/stall/BubblePool";
import { NEUTRAL, POSES } from "../sim/reaction";
import { intensityMul } from "../sim/personality";
import { drawFace } from "./face";
import { STREET_BIN } from "../world/map";
import { passerAlpha } from "../sim/passersby";

// Vòng kiên nhẫn là ngoại lệ có chủ ý của CANON L2: chỉ hiện khi xếp hàng, không số, không vạch chia.
const PATIENCE_COLORS = [0x3f7fb0, 0xd8b13c, 0xc0392b] as const;
const PATIENCE_R = 11;
const PATIENCE_W = 3.5;
// Tính từ đỉnh đầu, không từ `markY`.
const PATIENCE_LIFT = 14;
const PATIENCE_RED_SEC = 0.9;

function mixRgb(a: number, b: number, t: number) {
  const f = (sh: number) => {
    const x = (a >> sh) & 0xff, y = (b >> sh) & 0xff;
    return Math.round(x + (y - x) * t) << sh;
  };
  return f(16) | f(8) | f(0);
}

function patienceColor(frac: number) {
  const [blue, yellow, red] = PATIENCE_COLORS;
  return frac > 0.5
    ? mixRgb(yellow, blue, (frac - 0.5) * 2)
    : mixRgb(red, yellow, frac * 2);
}
const MARK_INK = "#f2efe9";
const MARK_STROKE = "#2b2f31";
// Trên nhãn trạm, vì nhãn quầy nằm đúng chỗ đầu người đứng trước quầy.
export const OVERLAY_DEPTH = 8_100_000;
const FX_DEPTH = 9_450_000;
// Trên mặt và vòng kiên nhẫn của người đứng sau, kẻo chúng đè lên chữ.
export const BUBBLE_DEPTH = FX_DEPTH + 1;

// Đo từ `sy` (điểm chạm đất), không từ `footY(sy)` vốn thấp hơn 21 px.
const TAG_BELOW_FEET = 14;
const EDGE = 6;

const K = 120, DAMP = 14;

// Ngồi: hạ thân 9 px (lưới 1 ô ≈ 34 px) và nén cao 12%.
const SIT_DROP = 9;
const SIT_SQUASH = 0.12;

// Người đứng hàng quay vuông góc mặt quầy, không theo người chơi cho cả hàng khỏi xoay qua lại.
const COUNTER_FACING = facingOf8(0, COUNTER_Y - QUEUE_SLOTS[0].y);

function atCounter(c: Customer) {
  return !c.ambient && !c.sitting
    && (c.phase === "queueing" || c.phase === "ordering" || c.phase === "waiting");
}
type Spring = { v: number; x: number };
const spring = (s: Spring, target: number, dt: number, d = DAMP) => {
  s.v += (-K * (s.x - target) - d * s.v) * dt;
  s.x += s.v * dt;
};
const browColor = (hair: number) => {
  const r = (hair >> 16) & 255, g = (hair >> 8) & 255, b = hair & 255;
  return 0.3 * r + 0.59 * g + 0.11 * b > 140 ? 0x5a5550 : hair;
};

export class CustomerActor {
  private body: Phaser.GameObjects.Image;
  private light: ActorLight;
  private mark: Phaser.GameObjects.Text;
  private tag: Phaser.GameObjects.Text;
  private fx: Phaser.GameObjects.Graphics;
  private leftAt = -1;

  private propFx: Phaser.GameObjects.Graphics;
  private sp = {
    fwd: { v: 0, x: 0 }, up: { v: 0, x: 0 }, rot: { v: 0, x: 0 }, sy: { v: 0, x: 1 },
    sit: { v: 0, x: 0 },
  };
  private lastT = -1;

  private facing: Facing8 = "n";
  private lastX: number;
  private lastY: number;
  private bob = 0;
  // Quãng đã đi (ô), cộng dồn để bàn chân khớp mặt đất.
  private gait = 0;

  constructor(private scene: Phaser.Scene, private c: Customer, private bubbles: BubblePool, textScale = 1,
    private label: (c: Customer) => string = (x) => x.name) {
    if (!scene.textures.exists(`${c.memKey}_s`)) buildBody(scene, c.memKey, c.body);

    this.body = scene.add.image(0, 0, textureFor("n", c.memKey).key).setOrigin(0.5, 1);
    this.light = new ActorLight(scene, this.body);

    this.tag = scene.add.text(0, 0, label(c), {
      fontFamily: FONT, fontSize: `${Math.round(10 * textScale)}px`, fontStyle: "500", color: "#f2efe6",
      stroke: "#1b2429", strokeThickness: 3,
    }).setOrigin(0.5);

    this.mark = scene.add.text(0, 0, "", {
      fontFamily: FONT, fontSize: "18px", fontStyle: "700", color: MARK_INK,
      stroke: MARK_STROKE, strokeThickness: 4,
    }).setOrigin(0.5);
    this.fx = scene.add.graphics().setDepth(FX_DEPTH);
    this.propFx = scene.add.graphics();

    this.lastX = c.x;
    this.lastY = c.y;
  }

  draw(reducedMotion: boolean, time: number, nowSec: number) {
    const c = this.c;
    const moved = Math.hypot(c.x - this.lastX, c.y - this.lastY);
    const walking = moved > 0.002;
    if (walking) this.facing = facingOf8(c.x - this.lastX, c.y - this.lastY);
    else if (atCounter(c)) this.facing = COUNTER_FACING;
    this.lastX = c.x;
    this.lastY = c.y;

    const { sx, sy } = toScreen(c.x, c.y);
    const depth = depthOf(c.x, c.y);
    const amp = reducedMotion ? 0 : 1;

    this.bob = walking ? this.bob + moved * 9 : 0;
    this.gait = walking ? this.gait + moved : 0;

    // `null` khi chưa có atlas đi bộ hoặc đứng yên.
    const walkTex = walking
      ? walkTextureFor(this.facing, Math.floor((this.gait / STRIDE) * GAIT_FRAMES.walk), "walk", c.memKey)
      : null;

    // Frame đi đã có nhún sẵn nên tắt cả nhún lẫn squash code, tránh nảy hai tầng.
    const bodyAmp = walkTex ? 0 : amp;
    const hop = Math.abs(Math.sin(this.bob)) * 2.2 * bodyAmp;

    const fidget = c.mood === "annoyed" ? Math.sin(time / 130) * 1.6 * amp
      : c.mood === "checking" ? Math.sin(time / 320) * 0.9 * amp : 0;

    const dt = this.lastT < 0 ? 0 : Math.min(0.05, (time - this.lastT) / 1000);
    this.lastT = time;
    const pose = POSES[c.react.pose];
    const s = intensityMul(c.personality);
    let tFwd = pose.fwd * s, tUp = pose.up * s, tRot = pose.rot * s;
    const tSy = pose.sy ?? 1;
    const tSit = c.sitting ? SIT_DROP : 0;
    const since = c.now - c.react.poseSince;
    if (pose.osc && !reducedMotion && (!pose.osc.beats || since < pose.osc.beats * pose.osc.period)) {
      const w = Math.sin((since / pose.osc.period) * Math.PI * 2) * pose.osc.amp * s;
      if (pose.osc.axis === "x") tFwd += w; else if (pose.osc.axis === "y") tUp += w; else tRot += w;
    }
    if (reducedMotion) {
      this.sp.fwd.x = tFwd; this.sp.up.x = tUp; this.sp.rot.x = tRot; this.sp.sy.x = tSy;
      this.sp.sit.x = tSit;
    } else {
      const d = pose.d ?? DAMP;
      spring(this.sp.fwd, tFwd, dt, d); spring(this.sp.up, tUp, dt, d);
      spring(this.sp.rot, tRot, dt, d); spring(this.sp.sy, tSy, dt, d);
      spring(this.sp.sit, tSit, dt, d);
    }
    const a = toScreen(c.x, c.y), b = toScreen(c.x, c.y - 1);
    const len = Math.hypot(b.sx - a.sx, b.sy - a.sy) || 1;
    const fx = ((b.sx - a.sx) / len) * this.sp.fwd.x, fy = ((b.sy - a.sy) / len) * this.sp.fwd.x * 0.5;

    // Mờ theo toạ độ thế giới, không theo mép màn hình kẻo người đi ngang tan giữa đường.
    const fade = c.ambient ? passerAlpha(c.x) : 1;

    const tex = walkTex ?? textureFor(this.facing, c.memKey);
    this.body.setTexture(tex.key).setFlipX(tex.flip).setAlpha(fade);
    this.body.setPosition(sx + fidget + fx, footY(sy) - hop + fy - this.sp.up.x + this.sp.sit.x).setDepth(depth);
    this.body.setAngle(this.sp.rot.x * (tex.flip ? -1 : 1));
    // Texture ảnh thật nướng dư pixel (`ART_SS`), phải chia lại sau mỗi `setTexture`.
    const k = 1 / artScale(tex.key);
    const sitSquash = 1 - (this.sp.sit.x / SIT_DROP) * SIT_SQUASH;
    this.body.setScale(k, k * (this.sp.sy.x + Math.sin(this.bob * 2) * 0.02 * bodyAmp) * sitSquash);

    this.light.update({ wx: c.x, wy: c.y, lift: hop + this.sp.up.x - this.sp.sit.x });

    const headX = sx + fidget, headY = footY(sy) - BODY_H + 12 - hop;
    const name = this.label(c);
    if (this.tag.text !== name) this.tag.setText(name);
    // Chip đặt dưới chân vì trên đầu thì đè thân người trước và nhãn trạm.
    this.tag.setVisible(!c.ambient);
    this.tag.setPosition(sx, sy + TAG_BELOW_FEET).setDepth(OVERLAY_DEPTH)
      .setAlpha(c.phase === "leaving" ? 0.45 : 0.9);
    this.clampInView(this.tag);

    const g = this.fx;
    g.clear();
    const watching = c.phase !== "leaving" && c.phase !== "arriving";

    const st = watching ? nowState(c, nowSec) : null;
    const markY = sy - BODY_H - 24;
    if (st?.state === "NOTICED") {
      g.lineStyle(4, 0x2b2f31, 1);
      g.lineBetween(sx - 11, markY - 5, sx - 2, markY + 1);
      g.lineBetween(sx + 11, markY - 5, sx + 2, markY + 1);
      g.lineStyle(2, 0xf2efe9, 1);
      g.lineBetween(sx - 11, markY - 5, sx - 2, markY + 1);
      g.lineBetween(sx + 11, markY - 5, sx + 2, markY + 1);
    }
    const glyph = st?.state === "GLIMPSED" ? "?" : st?.state === "CONFIRMED" ? "!" : "";
    this.mark.setText(glyph).setPosition(sx, markY).setDepth(OVERLAY_DEPTH + 1);

    // Không trừ `hop` để vòng đứng yên, dễ đọc.
    this.drawPatience(g, sx, footY(sy) - BODY_H - PATIENCE_LIFT);

    if (watching) this.drawGazeProp(g, headX, headY, time, reducedMotion);

    const face = c.react.face;
    if (face !== NEUTRAL && (face[0] || face[1] || face[2])) {
      // Đổi mặt thì giật 1 px trong 90 ms.
      const jolt = !reducedMotion && c.now - c.react.faceChangedAt < 0.09 ? -1 : 0;
      drawFace(g, sx + 22, markY + 6 + jolt, face, c.body.skin, browColor(c.body.hair), c.phase === "leaving" ? 0.7 : 1);
    }

    this.drawBodyProps(sx + fidget + fx, footY(sy) - hop + fy - this.sp.up.x + this.sp.sit.x, depth, time, reducedMotion);
    g.setAlpha(fade);
    this.propFx.setAlpha(fade);

    if (c.say) this.bubbles.acquire(c.id).setText(c.say);
    else this.bubbles.release(c.id, reducedMotion);
    this.bubbles.anchor(c.id, sx, sy - BODY_H - 46, BUBBLE_DEPTH, c.slot > 0 ? 0.85 : 1);
  }

  private clampInView(t: Phaser.GameObjects.Text) {
    const v = this.scene.cameras.main.worldView;
    const hw = t.displayWidth / 2, hh = t.displayHeight / 2;
    t.setPosition(
      Math.min(Math.max(t.x, v.left + EDGE + hw), v.right - EDGE - hw),
      Math.min(Math.max(t.y, v.top + EDGE + hh), v.bottom - EDGE - hh),
    );
  }

  private drawBodyProps(x: number, foot: number, depth: number, time: number, rm: boolean) {
    const c = this.c, g = this.propFx;
    g.clear().setDepth(depth + 0.5);
    const shoulder = foot - 36;
    switch (c.dayMood.prop) {
      case "AO_UOT": {
        g.fillStyle(0x1b2a3a, 0.35).fillEllipse(x, shoulder + 4, 26, 10);
        const drip = rm ? 0 : (time / 400) % 1;
        g.fillStyle(0x9fc6e8, 0.9).fillCircle(x - 9, shoulder + 8 + drip * 10, 1.4).fillCircle(x + 8, shoulder + 12 + ((drip + 0.5) % 1) * 10, 1.4);
        break;
      }
      case "TAY_BANG":
        g.fillStyle(0xf4f1ea, 1).fillRoundedRect(x + 9, shoulder + 10, 6, 9, 2);
        g.lineStyle(1, 0xc9c3b8, 1).lineBetween(x + 9, shoulder + 13, x + 15, shoulder + 13).lineBetween(x + 9, shoulder + 16, x + 15, shoulder + 16);
        break;
      case "AO_MOI": {
        const t = rm ? 0.5 : (Math.sin(time / 260) + 1) / 2;
        g.fillStyle(0xfff4c2, 0.5 + 0.5 * t).fillCircle(x - 8, shoulder + 3, 1.6).fillCircle(x + 7, shoulder + 9, 1.3);
        break;
      }
      case "VI_MONG":
        g.fillStyle(0x6b4a33, 1).fillRoundedRect(x + 8, shoulder + 14, 7, 5, 1.5);
        break;
      default:
        break;
    }
    // Ghế nhựa vẽ bám theo người vì `SEAT_SPOT` không trùng ghế trên bản đồ.
    if (this.sp.sit.x > 0.4) {
      const k = this.sp.sit.x / SIT_DROP;
      g.fillStyle(0x24588f, 0.95 * k).fillRect(x - 9, foot + 1, 3.5, 8).fillRect(x + 5.5, foot + 1, 3.5, 8);
      g.fillStyle(0x2f6fb3, 0.95 * k).fillEllipse(x, foot + 1, 26, 10);
      g.fillStyle(0x4b8fd6, 0.8 * k).fillEllipse(x, foot - 0.5, 20, 6);
    }

    if (c.filming) {
      const px = x + 10, py = shoulder - 2;
      g.fillStyle(0x24282b, 1).fillRoundedRect(px - 4, py - 7, 9, 15, 2);
      g.fillStyle(0x7fb8d8, 0.85).fillRect(px - 2.5, py - 5.5, 6, 12);
      const nhay = rm ? 1 : (Math.sin(time / 260) + 1) / 2;
      g.fillStyle(0xd94f3d, 0.45 + 0.55 * nhay).fillCircle(px + 7, py - 6, 2.1);
      g.lineStyle(1.5, 0xe8d9b5, 0.9).lineBetween(x + 4, shoulder + 7, px - 2, py + 6);
    }

    const binT = c.binAt >= 0 ? c.now - c.binAt : -1;
    if (c.carrying || (binT >= 0 && binT < 0.35)) {
      let bx = x + 11, by = shoulder + 14;
      if (binT >= 0) {
        const bin = toScreen(STREET_BIN.x - 0.45, STREET_BIN.y - 1.1);
        const k = binT / 0.35;
        bx += (bin.sx - bx) * k; by += (footY(bin.sy) - 22 - by) * k * k;
      }
      g.fillStyle(0xc98a45, 1).fillEllipse(bx, by, 14, 6);
      g.fillStyle(0xe6b574, 1).fillEllipse(bx - 1, by - 1, 10, 3);
    }
  }

  private drawPatience(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    const c = this.c;
    const leaving = c.phase === "leaving";

    if (leaving) {
      // Chỉ bỏ về vì bực mới hiện vòng đỏ đầy mờ dần.
      const bad = c.leaveReason === "impatient" || c.leaveReason === "insulted" || c.leaveReason === "refused";
      if (!bad) { this.leftAt = -1; return; }
      if (this.leftAt < 0) this.leftAt = c.now;
      const t = (c.now - this.leftAt) / PATIENCE_RED_SEC;
      if (t >= 1) return;
      g.lineStyle(PATIENCE_W, PATIENCE_COLORS[2], 1 - t);
      g.strokeCircle(x, y, PATIENCE_R);
      return;
    }
    this.leftAt = -1;
    if (c.phase === "arriving" || c.pass) return;

    const frac = c.patienceLeft;
    // Rãnh mờ để cung đỏ ngắn lúc gần cạn không trông như vệt bẩn.
    g.lineStyle(PATIENCE_W, 0x0d1216, 0.22);
    g.strokeCircle(x, y, PATIENCE_R);
    if (frac <= 0) return;
    const from = -Math.PI / 2;
    g.lineStyle(PATIENCE_W, patienceColor(frac), 0.95);
    g.beginPath();
    g.arc(x, y, PATIENCE_R, from, from + Math.PI * 2 * frac, false);
    g.strokePath();
  }

  private drawGazeProp(g: Phaser.GameObjects.Graphics, x: number, y: number, time: number, rm: boolean) {
    switch (this.c.gazeState) {
      case "PHONE": {
        const pulse = rm ? 0.5 : 0.35 + 0.25 * Math.sin(time / 180);
        g.fillStyle(0x7fb8ff, pulse).fillCircle(x + 10, y + 8, 12);
        g.fillStyle(0x1b2429, 1).fillRoundedRect(x + 5, y, 10, 16, 2);
        g.fillStyle(0x9fd0ff, 1).fillRect(x + 6.5, y + 2, 7, 11);
        break;
      }
      case "DRINKING": {
        g.fillStyle(0xd9e6ea, 0.95).fillRoundedRect(x - 6, y - 4, 12, 16, 3);
        g.fillStyle(0xa8743f, 0.9).fillRect(x - 5, y + 2, 10, 9);
        g.fillStyle(0xffffff, 0.8).fillRect(x - 3, y + 3, 3, 3);
        break;
      }
      case "WATCH": {
        g.fillStyle(0x2b2f31, 1).fillCircle(x + 12, y + 20, 5);
        g.fillStyle(0xf2efe9, 1).fillCircle(x + 12, y + 20, 3.5);
        g.lineStyle(1.5, 0x2b2f31, 1).lineBetween(x + 12, y + 20, x + 12, y + 17.5);
        break;
      }
      default:
        break;
    }
  }

  destroy() {
    this.light.destroy();
    this.body.destroy();
    this.tag.destroy();
    this.mark.destroy();
    this.fx.destroy();
    this.propFx.destroy();
    this.bubbles.release(this.c.id, true);
  }
}
