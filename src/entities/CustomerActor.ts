import Phaser from "phaser";
import { depthOf, facingOf, toScreen, type Facing } from "../world/iso";
import { BODY_H, FX, buildBody, footY, textureFor } from "../art";
import type { Customer } from "../sim/customer";
import { nowState } from "../sim/perception";
import type { ObsState, Slot } from "../core/types";
import { FONT } from "../ui/theme";
import type { BubblePool } from "../ui/stall/BubblePool";
import { NEUTRAL, POSES } from "../sim/reaction";
import { intensityMul } from "../sim/personality";
import { drawFace } from "./face";
import { STREET_BIN } from "../world/map";

/**
 * Phần NHÌN THẤY của một người khách.
 *
 * T5 — attention phải NHÌN THẤY ĐƯỢC, bằng HÌNH chứ không bằng số:
 *  · Dấu trên đầu, ba HÌNH DẠNG khác nhau (không phân biệt bằng màu — P1-04 §4.1):
 *      GLIMPSED `?` · NOTICED cặp mày nhíu · CONFIRMED `!`
 *  · Tia nhìn (P1-04 §2.5, PA-B) từ mắt khách tới đúng vùng họ đang để ý, bốn bậc rời rạc.
 *  · Trạng thái ÁNH NHÌN có đạo cụ riêng (P1-02 §2.5.3 "không hoạt ảnh = không trạng thái"):
 *      điện thoại sáng xanh · ly trà che mặt · liếc đồng hồ tay.
 *    Người chơi phải thấy VÌ SAO khách không thấy mình làm rớt bánh.
 * Không có thanh kiên nhẫn — T3. Sốt ruột đọc qua DÁNG: đứng yên → nhấp nhổm → liếc đồng hồ.
 */

/** P1-04 §2.5 — bảng tia nhìn. Màu tia cố ý KHÔNG vàng / đỏ. */
const GAZE_RAY: Record<Exclude<ObsState, "UNAWARE">, { width: number; alpha: number; dash: [number, number] | null }> = {
  GLIMPSED:  { width: 2, alpha: 0.15, dash: [6, 8] },
  NOTICED:   { width: 4, alpha: 0.38, dash: [10, 4] },
  CONFIRMED: { width: 7, alpha: 0.70, dash: null },
};
const RAY_COLOR = 0xcfd8da;
const RING_COLOR = 0xc4342a;
const MARK_INK = "#f2efe9";
const MARK_STROKE = "#2b2f31";
/**
 * Dấu trên đầu + bong bóng: trên NHÃN TRẠM (8.000.000) — nhãn đục "quầy gọi món" nằm
 * đúng chỗ đầu người khách đứng trước quầy, để dưới là mất hết dấu `?`/`!` của người quan
 * trọng nhất. Tia nhìn: trên cả bảng kẹp nhân (9.400.000) — lúc kẹp là lúc khách nhìn tay
 * mình kỹ nhất, tia phải chỉ thẳng vào ổ bánh trong bảng.
 */
const OVERLAY_DEPTH = 8_100_000;
const RAY_DEPTH = 9_450_000;

export type ZonePoint = (slot: Slot) => { x: number; y: number };

/**
 * Chip tên: ở CHÂN, không ở trên đầu — xem `CustomerActor.draw`.
 * 12 px dưới bàn chân là ngay dưới bóng đổ, chưa chạm tới đầu người đứng sau.
 */
const TAG_BELOW_FEET = 12;
/** Mép an toàn khi kẹp overlay trong khung nhìn. */
const EDGE = 6;
/** Khe hở tối thiểu giữa hai bong bóng đã né nhau. */
const BUBBLE_GAP = 6;

type Box = { x0: number; y0: number; x1: number; y1: number };
const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/**
 * Ô thật của một bong bóng. `Container.getBounds()` chỉ gộp con nào CÓ `getBounds` —
 * Graphics của Phaser thì không có, nên nó trả về đúng ô CHỮ, nhỏ hơn hẳn cái nền giấy.
 * Nở ra theo đúng hình học của `BubblePool.setText`/`place`: nền rộng
 * `max(chữ + 22, 60)`, cao `chữ + 14`, cái đuôi thò thêm 9 px, bóng đổ +2/+3.
 */
function bubbleBox(root: Phaser.GameObjects.Container, scale: number): Box {
  const t = root.getBounds();
  const w = Math.max(t.width / scale + 22, 60) * scale;
  const h = (t.height / scale + 14) * scale;
  return {
    x0: t.centerX - w / 2, x1: t.centerX + w / 2 + 2 * scale,
    y0: t.centerY - h / 2, y1: t.centerY + h / 2 + 9 * scale,
  };
}

/**
 * Sổ bố cục bong bóng của MỘT frame — P1-04 §2.9.
 *
 * Hai chỗ đứng trong hàng chờ cách nhau đúng (Δx+Δy)·TH/2 ≈ 34,5 px trên màn hình, mà
 * một bong bóng hai dòng đã cao ~54 px. Hai người xếp sát nhau cùng nói thì bong bóng
 * CHẮC CHẮN chồng nhau (~20 px với câu hai dòng, ~35 px với ba dòng — chữ bị cắt mất).
 * Đây là hình học, không phải xui: chờ may là không bao giờ hết.
 *
 * Mỗi actor đặt xong thì ghi ô của mình vào đây; actor sau đọc và né. Ai đứng TRƯỚC
 * (sy nhỏ hơn, gần quầy hơn) thì trồi LÊN, ai đứng SAU thì lùi XUỐNG — giữ nguyên thứ
 * tự hàng chờ, nên bong bóng không bao giờ rời khỏi chủ của nó.
 * `stamp` là `time` của scene: frame mới thì sổ tự trắng, không cần ai dọn.
 */
let bubbleStamp = -1;
const bubbleBoxes: { sy: number; box: Box }[] = [];

/** Lò xo của kênh dáng (P2-02 §3.2): K cứng, DAMP giảm chấn — cao thì "chắc", thấp thì "nhão". */
const K = 120, DAMP = 14;
type Spring = { v: number; x: number };
const spring = (s: Spring, target: number, dt: number, d = DAMP) => {
  s.v += (-K * (s.x - target) - d * s.v) * dt;
  s.x += s.v * dt;
};
/** Mày tóc bạc vẽ lên nền da thì chìm mất — sậm lại cho đọc được. */
const browColor = (hair: number) => {
  const r = (hair >> 16) & 255, g = (hair >> 8) & 255, b = hair & 255;
  return 0.3 * r + 0.59 * g + 0.11 * b > 140 ? 0x5a5550 : hair;
};

export class CustomerActor {
  private body: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;
  private mark: Phaser.GameObjects.Text;
  private tag: Phaser.GameObjects.Text;
  /** Tia nhìn, cặp mày NOTICED, và đạo cụ ánh nhìn — một Graphics, vẽ lại mỗi frame. */
  private fx: Phaser.GameObjects.Graphics;

  /** Đạo cụ trên THÂN (áo ướt, tay băng, ổ bánh cầm về) — nằm cùng lớp với người. */
  private propFx: Phaser.GameObjects.Graphics;
  private sp = { fwd: { v: 0, x: 0 }, up: { v: 0, x: 0 }, rot: { v: 0, x: 0 }, sy: { v: 0, x: 1 } };
  private lastT = -1;

  private facing: Facing = "n";
  private lastX: number;
  private lastY: number;
  private bob = 0;

  constructor(private scene: Phaser.Scene, private c: Customer, private bubbles: BubblePool, textScale = 1,
    /** P2-05: tên người chơi ghi trong sổ, chưa ghi thì mô tả hình dáng. */
    private label: (c: Customer) => string = (x) => x.name) {
    // Texture nướng theo `memKey` (dáng người), không theo `id` (duy nhất mỗi lượt ghé).
    if (!scene.textures.exists(`${c.memKey}_s`)) buildBody(scene, c.memKey, c.body);

    this.shadow = scene.add.image(0, 0, FX.shadow).setOrigin(0.5, 0.5);
    this.body = scene.add.image(0, 0, textureFor("n", c.memKey).key).setOrigin(0.5, 1);

    this.tag = scene.add.text(0, 0, label(c), {
      fontFamily: FONT, fontSize: `${Math.round(10 * textScale)}px`, fontStyle: "500", color: "#f2efe6",
      stroke: "#1b2429", strokeThickness: 3,
    }).setOrigin(0.5);

    // Dấu trên đầu cỡ CỐ ĐỊNH, không co giãn theo sprite (P1-04 §2.5).
    this.mark = scene.add.text(0, 0, "", {
      fontFamily: FONT, fontSize: "18px", fontStyle: "700", color: MARK_INK,
      stroke: MARK_STROKE, strokeThickness: 4,
    }).setOrigin(0.5);
    this.fx = scene.add.graphics().setDepth(RAY_DEPTH);
    this.propFx = scene.add.graphics();

    this.lastX = c.x;
    this.lastY = c.y;
  }

  draw(reducedMotion: boolean, time: number, zonePoint: ZonePoint, nowSec: number) {
    const c = this.c;
    const moved = Math.hypot(c.x - this.lastX, c.y - this.lastY);
    if (moved > 0.002) this.facing = facingOf(c.x - this.lastX, c.y - this.lastY);
    this.lastX = c.x;
    this.lastY = c.y;

    const { sx, sy } = toScreen(c.x, c.y);
    const depth = depthOf(c.x, c.y);
    const amp = reducedMotion ? 0 : 1;

    this.bob = moved > 0.002 ? this.bob + moved * 9 : 0;
    const hop = Math.abs(Math.sin(this.bob)) * 2.2 * amp;

    // sốt ruột thì nhấp nhổm tại chỗ — dáng nói thay cho con số
    const fidget = c.mood === "annoyed" ? Math.sin(time / 130) * 1.6 * amp
      : c.mood === "checking" ? Math.sin(time / 320) * 0.9 * amp : 0;

    // ── kênh 2: dáng — một bộ TARGET cho lò xo, 0 sprite mới (P2-02 §3.2) ─────────
    const dt = this.lastT < 0 ? 0 : Math.min(0.05, (time - this.lastT) / 1000);
    this.lastT = time;
    const pose = POSES[c.react.pose];
    const s = intensityMul(c.personality);                 // nóng tính phóng đại BIÊN ĐỘ, không tốc độ
    let tFwd = pose.fwd * s, tUp = pose.up * s, tRot = pose.rot * s;
    const tSy = pose.sy ?? 1;
    const since = c.now - c.react.poseSince;
    if (pose.osc && !reducedMotion && (!pose.osc.beats || since < pose.osc.beats * pose.osc.period)) {
      const w = Math.sin((since / pose.osc.period) * Math.PI * 2) * pose.osc.amp * s;
      if (pose.osc.axis === "x") tFwd += w; else if (pose.osc.axis === "y") tUp += w; else tRot += w;
    }
    if (reducedMotion) {                                   // CANON §15.3: nhảy thẳng tới target, không nhún
      this.sp.fwd.x = tFwd; this.sp.up.x = tUp; this.sp.rot.x = tRot; this.sp.sy.x = tSy;
    } else {
      const d = pose.d ?? DAMP;
      spring(this.sp.fwd, tFwd, dt, d); spring(this.sp.up, tUp, dt, d);
      spring(this.sp.rot, tRot, dt, d); spring(this.sp.sy, tSy, dt, d);
    }
    // "về phía quầy" trên màn hình = hướng −y của thế giới
    const a = toScreen(c.x, c.y), b = toScreen(c.x, c.y - 1);
    const len = Math.hypot(b.sx - a.sx, b.sy - a.sy) || 1;
    const fx = ((b.sx - a.sx) / len) * this.sp.fwd.x, fy = ((b.sy - a.sy) / len) * this.sp.fwd.x * 0.5;

    const tex = textureFor(this.facing, c.memKey);
    this.body.setTexture(tex.key).setFlipX(tex.flip);
    this.body.setPosition(sx + fidget + fx, footY(sy) - hop + fy - this.sp.up.x).setDepth(depth);
    this.body.setAngle(this.sp.rot.x * (tex.flip ? -1 : 1));
    this.body.setScale(1, this.sp.sy.x + Math.sin(this.bob * 2) * 0.02 * amp);
    this.shadow.setPosition(sx, sy).setDepth(depth - 1);

    const headX = sx + fidget, headY = footY(sy) - BODY_H + 12 - hop;
    const name = this.label(c);
    if (this.tag.text !== name) this.tag.setText(name);
    // Chip tên ở CHÂN, không ở trên đầu.
    //
    // Trên đầu thì chip của người đứng sau rơi thẳng vào thân — có khi vào cằm — của
    // người đứng trước: hai chỗ đứng chỉ cách nhau 34,5 px màn hình mà một chip tên rộng
    // gần 90 px, và chip của người ở quầy thì đè luôn nhãn trạm "quầy gọi món" ngay trên
    // đầu họ. Ở chân thì chip đi theo đúng nhịp hàng chờ (cũng 34,5 px một bậc) nên hai
    // chip KHÔNG BAO GIỜ chồng nhau, và không chip nào che mặt ai — mặt là kênh 1, thứ
    // người chơi phải đọc được (CANON §5).
    this.tag.setPosition(sx, footY(sy) + TAG_BELOW_FEET).setDepth(OVERLAY_DEPTH)
      .setAlpha(c.phase === "leaving" ? 0.45 : 0.9);
    this.clampInView(this.tag);

    const g = this.fx;
    g.clear();
    const watching = c.phase !== "leaving" && c.phase !== "arriving";

    // ── tia nhìn + dấu trên đầu ────────────────────────────────────────────
    const st = watching ? nowState(c, nowSec) : null;
    const markY = sy - BODY_H - 24;
    if (st && st.state !== "UNAWARE") {
      const r = GAZE_RAY[st.state];
      const to = zonePoint(st.slot);
      ray(g, headX, headY, to.x, to.y, r.width, r.alpha, r.dash);
      if (st.state === "CONFIRMED") g.lineStyle(3, RING_COLOR, 0.9).strokeCircle(to.x, to.y, 16);
    }
    if (st?.state === "NOTICED") {
      // cặp mày nhíu — hình dạng khác hẳn `?` và `!`
      g.lineStyle(4, 0x2b2f31, 1);
      g.lineBetween(sx - 11, markY - 5, sx - 2, markY + 1);
      g.lineBetween(sx + 11, markY - 5, sx + 2, markY + 1);
      g.lineStyle(2, 0xf2efe9, 1);
      g.lineBetween(sx - 11, markY - 5, sx - 2, markY + 1);
      g.lineBetween(sx + 11, markY - 5, sx + 2, markY + 1);
    }
    const glyph = st?.state === "GLIMPSED" ? "?" : st?.state === "CONFIRMED" ? "!" : "";
    this.mark.setText(glyph).setPosition(sx, markY).setDepth(OVERLAY_DEPTH + 1);

    // ── đạo cụ của trạng thái ánh nhìn ──────────────────────────────────────
    if (watching) this.drawGazeProp(g, headX, headY, time, reducedMotion);

    // ── kênh 1: nét mặt — huy hiệu cạnh đầu, chỉ hiện khi mặt KHÁC nền trung tính ──
    const face = c.react.face;
    if (face !== NEUTRAL && (face[0] || face[1] || face[2])) {
      // Celeste: đổi mặt thì giật đầu 1 px trong 90 ms — "cái giật" của cảm xúc
      const jolt = !reducedMotion && c.now - c.react.faceChangedAt < 0.09 ? -1 : 0;
      drawFace(g, sx + 22, markY + 6 + jolt, face, c.body.skin, browColor(c.body.hair), c.phase === "leaving" ? 0.7 : 1);
    }

    this.drawBodyProps(sx + fidget + fx, footY(sy) - hop + fy - this.sp.up.x, depth, time, reducedMotion);

    // Bong bóng lấy từ pool (P0-01 §2.6c) — không tạo, không huỷ object nào ở đây.
    // Người xếp hàng phía sau: bong bóng nhỏ hơn 15%, mờ hơn (P1-04 §2.9).
    if (c.say) {
      const b = this.bubbles.acquire(c.id);
      b.setText(c.say);
      const scale = c.slot > 0 ? 0.85 : 1;
      const depthB = OVERLAY_DEPTH + 2;
      let bx = sx, by = sy - BODY_H - 46;
      b.place(bx, by, depthB, scale, reducedMotion);

      if (time !== bubbleStamp) { bubbleStamp = time; bubbleBoxes.length = 0; }
      const box = bubbleBox(b.root, scale);
      // né những bong bóng đã đặt trong frame này (xem `bubbleBoxes`)
      for (const o of bubbleBoxes) {
        if (!overlaps(box, o.box)) continue;
        const dy = sy < o.sy ? o.box.y0 - BUBBLE_GAP - box.y1 : o.box.y1 + BUBBLE_GAP - box.y0;
        by += dy; box.y0 += dy; box.y1 += dy;
      }
      // rồi kẹp trong mép khung nhìn — bong bóng mọc LÊN nên chỉ có mép trên là chạm được
      const v = this.scene.cameras.main.worldView;
      let dx = 0;
      if (box.x1 > v.right - EDGE) dx = v.right - EDGE - box.x1;
      if (box.x0 + dx < v.left + EDGE) dx = v.left + EDGE - box.x0;
      let dy = 0;
      if (box.y0 < v.top + EDGE) dy = v.top + EDGE - box.y0;
      if (dx || dy) {
        bx += dx; by += dy;
        box.x0 += dx; box.x1 += dx; box.y0 += dy; box.y1 += dy;
      }
      if (bx !== sx || by !== sy - BODY_H - 46) b.place(bx, by, depthB, scale, reducedMotion);
      bubbleBoxes.push({ sy, box });
    } else {
      this.bubbles.release(c.id, reducedMotion);
    }
  }

  /** Kéo một overlay vào trong khung nhìn — chữ chạy ra ngoài mép là chữ mất. */
  private clampInView(t: Phaser.GameObjects.Text) {
    const v = this.scene.cameras.main.worldView;
    const hw = t.displayWidth / 2, hh = t.displayHeight / 2;
    t.setPosition(
      Math.min(Math.max(t.x, v.left + EDGE + hw), v.right - EDGE - hw),
      Math.min(Math.max(t.y, v.top + EDGE + hh), v.bottom - EDGE - hh),
    );
  }

  /**
   * Prop của mood (P2-02 §5.2: THẤY → HIỂU → NGHE — nhìn thấy từ xa, trước câu nói đầu)
   * và ổ bánh khách cầm về. Vẽ ngay trên thân, cùng lớp chiều sâu với người.
   */
  private drawBodyProps(x: number, foot: number, depth: number, time: number, rm: boolean) {
    const c = this.c, g = this.propFx;
    g.clear().setDepth(depth + 0.5);
    const shoulder = foot - 36;
    switch (c.dayMood.prop) {
      case "AO_UOT": {                                     // áo ướt: vai sậm + giọt nước
        g.fillStyle(0x1b2a3a, 0.35).fillEllipse(x, shoulder + 4, 26, 10);
        const drip = rm ? 0 : (time / 400) % 1;
        g.fillStyle(0x9fc6e8, 0.9).fillCircle(x - 9, shoulder + 8 + drip * 10, 1.4).fillCircle(x + 8, shoulder + 12 + ((drip + 0.5) % 1) * 10, 1.4);
        break;
      }
      case "TAY_BANG":                                     // tay băng trắng
        g.fillStyle(0xf4f1ea, 1).fillRoundedRect(x + 9, shoulder + 10, 6, 9, 2);
        g.lineStyle(1, 0xc9c3b8, 1).lineBetween(x + 9, shoulder + 13, x + 15, shoulder + 13).lineBetween(x + 9, shoulder + 16, x + 15, shoulder + 16);
        break;
      case "AO_MOI": {                                     // áo mới: lấp lánh
        const t = rm ? 0.5 : (Math.sin(time / 260) + 1) / 2;
        g.fillStyle(0xfff4c2, 0.5 + 0.5 * t).fillCircle(x - 8, shoulder + 3, 1.6).fillCircle(x + 7, shoulder + 9, 1.3);
        break;
      }
      case "VI_MONG":                                      // ví mỏng lép cầm tay
        g.fillStyle(0x6b4a33, 1).fillRoundedRect(x + 8, shoulder + 14, 7, 5, 1.5);
        break;
      default:
        break;
    }
    // ổ bánh cầm về — và, với chị Lan, rơi vào thùng rác đầu hẻm (P2-02 §4.6)
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

  private drawGazeProp(g: Phaser.GameObjects.Graphics, x: number, y: number, time: number, rm: boolean) {
    switch (this.c.gazeState) {
      case "PHONE": {
        // điện thoại trước mặt, màn hình sáng xanh nhấp nháy — lý do khách không thấy gì
        const pulse = rm ? 0.5 : 0.35 + 0.25 * Math.sin(time / 180);
        g.fillStyle(0x7fb8ff, pulse).fillCircle(x + 10, y + 8, 12);
        g.fillStyle(0x1b2429, 1).fillRoundedRect(x + 5, y, 10, 16, 2);
        g.fillStyle(0x9fd0ff, 1).fillRect(x + 6.5, y + 2, 7, 11);
        break;
      }
      case "DRINKING": {
        // ly trà che ngang mặt
        g.fillStyle(0xd9e6ea, 0.95).fillRoundedRect(x - 6, y - 4, 12, 16, 3);
        g.fillStyle(0xa8743f, 0.9).fillRect(x - 5, y + 2, 10, 9);
        g.fillStyle(0xffffff, 0.8).fillRect(x - 3, y + 3, 3, 3);
        break;
      }
      case "WATCH": {
        // liếc đồng hồ tay
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
    this.body.destroy();
    this.shadow.destroy();
    this.tag.destroy();
    this.mark.destroy();
    this.fx.destroy();
    this.propFx.destroy();
    this.bubbles.release(this.c.id, true);           // người đã khuất: tắt ngay, không mờ dần
  }
}

/** Tia nhìn: vệt mềm, không phải tia laser. Nét đứt ở hai bậc thấp. */
function ray(g: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number,
  width: number, alpha: number, dash: [number, number] | null) {
  g.lineStyle(width, RAY_COLOR, alpha);
  if (!dash) { g.lineBetween(x1, y1, x2, y2); return; }
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  for (let d = 0; d < len; d += dash[0] + dash[1]) {
    const e = Math.min(len, d + dash[0]);
    g.lineBetween(x1 + ux * d, y1 + uy * d, x1 + ux * e, y1 + uy * e);
  }
}
