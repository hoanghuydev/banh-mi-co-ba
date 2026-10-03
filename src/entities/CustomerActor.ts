import Phaser from "phaser";
import { depthOf, facingOf, toScreen, type Facing } from "../world/iso";
import { pickBubbleSpot, type Box } from "../world/bubbleLayout";
import { BODY_H, FX, buildBody, footY, textureFor } from "../art";
import { artScale } from "../art/photo";
import type { Customer } from "../sim/customer";
import { nowState } from "../sim/perception";
import { FONT } from "../ui/theme";
import type { BubblePool } from "../ui/stall/BubblePool";
import { NEUTRAL, POSES } from "../sim/reaction";
import { intensityMul } from "../sim/personality";
import { drawFace } from "./face";
import { STREET_BIN } from "../world/map";
import { passerAlpha } from "../sim/passersby";

/**
 * Phần NHÌN THẤY của một người khách. T5 — attention đọc bằng HÌNH, không bằng số: dấu trên đầu
 * ba HÌNH DẠNG khác nhau · "có người nhìn" gom về MỘT con mắt ở đỉnh màn hình · mỗi trạng thái
 * ánh nhìn có đạo cụ riêng (người chơi phải thấy VÌ SAO khách không thấy mình làm rớt bánh).
 *
 * ⚠️ VÒNG KIÊN NHẪN là NGOẠI LỆ CÓ CHỦ Ý — CANON L2 cấm đúng hình dạng này. Ba cái hãm: chỉ hiện
 * khi đang xếp hàng · không số, không vạch chia · `certainty`/quan hệ/khẩu vị vẫn không có thanh nào.
 */

/** Nội suy liên tục chứ không nhảy bậc — nhảy bậc là một cái thước đo trá hình. */
const PATIENCE_COLORS = [0x3f7fb0, 0xd8b13c, 0xc0392b] as const;
const PATIENCE_R = 11;
const PATIENCE_W = 3.5;
/** Neo theo ĐỈNH ĐẦU chứ không theo `markY` (đã nằm 45 px trên đầu): cộng vào đó nữa là vòng bay lơ lửng như của ai khác. */
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
/** Trên NHÃN TRẠM vì nhãn "quầy gọi món" nằm đúng chỗ đầu người đứng trước quầy; lớp hiệu ứng trên cả bảng kẹp nhân. */
export const OVERLAY_DEPTH = 8_100_000;
const FX_DEPTH = 9_450_000;

/** ⚠️ Đo TỪ `sy` (điểm chạm đất), KHÔNG từ `footY(sy)` — `footY` thấp hơn mặt đất 21 px, đo từ đó là chip rơi sang ô phía trước. */
const TAG_BELOW_FEET = 14;
const EDGE = 6;
/** 0,09 s ⇒ đi ~96% quãng trong một phần tư giây: mắt đọc ra là nó DI CHUYỂN, mà chữ không bị kéo lê đủ lâu để khó đọc. */
const BUBBLE_GLIDE_TAU = 0.09;
/**
 * ⚠️ KHÔNG mờ dần theo MÉP KHUNG NHÌN — đã thử và đã bỏ: hệ số đó tính trên toạ độ MÀN HÌNH nên
 * người đi ngang tan ra giữa đường, và alpha của họ nhảy theo mỗi bước chân người chơi.
 * Cú bật THẬT chỉ có ở hai đầu dải, và `passersby.passerAlpha` đã lo (theo toạ độ THẾ GIỚI).
 */

/** ⚠️ `Container.getBounds()` chỉ gộp con nào CÓ `getBounds`, mà Graphics thì không — nó trả về đúng ô CHỮ, nhỏ hơn hẳn nền giấy. */
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
 * Hai chỗ đứng cách nhau ~34,5 px mà bong bóng hai dòng đã cao ~54 px, nên hai người sát nhau cùng
 * nói là CHẮC CHẮN chồng — hình học, không phải xui. Ai đứng TRƯỚC thì trồi LÊN, giữ nguyên thứ tự
 * hàng chờ. `stamp` là `time` của scene nên frame mới sổ tự trắng.
 */
let bubbleStamp = -1;
const bubbleBoxes: { sy: number; box: Box }[] = [];

/**
 * ⚠️ CỐ Ý ngắn và ĐỘNG. Không thay được bằng "đẩy một hướng cố định": chiếu ra màn hình thì hàng
 * khách và hàng trạm CHỒNG nhau, đẩy đâu cũng đụng một trạm khác. Mà che cái lò lúc lò trống chỉ
 * là che một bức hình, còn che vòng độ giòn lúc ổ sắp sém là lấy mất thứ duy nhất báo nó sắp cháy.
 */
const bubbleKeepOut: Box[] = [];

export function setBubbleKeepOut(boxes: readonly Box[]) {
  bubbleKeepOut.length = 0;
  bubbleKeepOut.push(...boxes);
}

export type BubbleKeepOutBox = Box;
export { pickBubbleSpot };


const K = 120, DAMP = 14;

/**
 * NGỒI — act `THEY_SIT`. Hạ thân chừng này px và nén chiều cao chừng này phần.
 *
 * Đo bằng mắt trên lưới isometric 1 ô ≈ 34 px: 9 px là đủ thấy người ngồi THẤP HƠN người
 * đứng cạnh mà chân không chui xuống dưới nền. Nén 12% là phần chân gập lại.
 */
const SIT_DROP = 9;
const SIT_SQUASH = 0.12;
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
  private shadow: Phaser.GameObjects.Image;
  private mark: Phaser.GameObjects.Text;
  private tag: Phaser.GameObjects.Text;
  private fx: Phaser.GameObjects.Graphics;
  private leftAt = -1;

  private propFx: Phaser.GameObjects.Graphics;
  private sp = {
    fwd: { v: 0, x: 0 }, up: { v: 0, x: 0 }, rot: { v: 0, x: 0 }, sy: { v: 0, x: 1 },
    /** NGỒI XUỐNG — act `THEY_SIT`. Lò xo chứ không nhảy nấc: ngồi phịch một frame là sai. */
    sit: { v: 0, x: 0 },
  };
  private lastT = -1;

  private facing: Facing = "n";
  private lastX: number;
  private lastY: number;
  private bob = 0;

  /**
   * ⚠️ Phải nhớ chứ không hỏi `pickBubbleSpot` mỗi frame: hàm đó RỜI RẠC (bảy nấc), và nấc thắng đổi
   * ngay khi `keepOut` đổi — đặt thẳng kết quả là bong bóng dịch chuyển tức thời giữa hai frame.
   * `settled` = chưa từng đặt ⇒ câu MỚI hiện ngay tại chỗ của nó, không trượt vào từ chỗ câu trước.
   */
  private bubbleOff = { live: { dx: 0, dy: 0 }, want: { dx: 0, dy: 0 }, settled: false };
  private bubbleSaid = "";

  constructor(private scene: Phaser.Scene, private c: Customer, private bubbles: BubblePool, textScale = 1,
    private label: (c: Customer) => string = (x) => x.name) {
    if (!scene.textures.exists(`${c.memKey}_s`)) buildBody(scene, c.memKey, c.body);

    this.shadow = scene.add.image(0, 0, FX.shadow).setOrigin(0.5, 0.5);
    this.body = scene.add.image(0, 0, textureFor("n", c.memKey).key).setOrigin(0.5, 1);

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
    if (moved > 0.002) this.facing = facingOf(c.x - this.lastX, c.y - this.lastY);
    this.lastX = c.x;
    this.lastY = c.y;

    const { sx, sy } = toScreen(c.x, c.y);
    const depth = depthOf(c.x, c.y);
    const amp = reducedMotion ? 0 : 1;

    this.bob = moved > 0.002 ? this.bob + moved * 9 : 0;
    const hop = Math.abs(Math.sin(this.bob)) * 2.2 * amp;

    const fidget = c.mood === "annoyed" ? Math.sin(time / 130) * 1.6 * amp
      : c.mood === "checking" ? Math.sin(time / 320) * 0.9 * amp : 0;

    // ── kênh 2: dáng — một bộ TARGET cho lò xo, 0 sprite mới (P2-02 §3.2) ─────────
    const dt = this.lastT < 0 ? 0 : Math.min(0.05, (time - this.lastT) / 1000);
    this.lastT = time;
    const pose = POSES[c.react.pose];
    const s = intensityMul(c.personality);
    let tFwd = pose.fwd * s, tUp = pose.up * s, tRot = pose.rot * s;
    const tSy = pose.sy ?? 1;
    /*
     * NGỒI THẤY ĐƯỢC. `THEY_SIT` đã làm kiên nhẫn trôi chậm từ đợt `GHE_BAN`, nhưng người
     * ngồi và người đứng vẽ y hệt nhau — tức người chơi bỏ 320 nghìn mua bộ ghế và KHÔNG
     * THẤY GÌ ĐỔI. Không nướng sprite mới: hạ thân xuống `SIT_DROP` và nén nhẹ chiều cao
     * (chân gập), đúng lối "một bộ target cho lò xo, 0 sprite mới" của P2-02 §3.2.
     */
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

    /** Hai đầu dải nằm ngoài khung nhìn ở phần lớn vị trí camera nhưng không phải MỌI vị trí — nên quãng mờ đo bằng ô BẢN ĐỒ. */
    const fade = c.ambient ? passerAlpha(c.x) : 1;

    const tex = textureFor(this.facing, c.memKey);
    this.body.setTexture(tex.key).setFlipX(tex.flip).setAlpha(fade);
    this.body.setPosition(sx + fidget + fx, footY(sy) - hop + fy - this.sp.up.x + this.sp.sit.x).setDepth(depth);
    this.body.setAngle(this.sp.rot.x * (tex.flip ? -1 : 1));
    // Chia lại hệ số siêu lấy mẫu sau mỗi `setTexture`, y như `Player.ts`: người nào
    // đã có bảng xoay ẢNH THẬT (`art/photo.NPC_PHOTOS`) thì texture nướng dư pixel, còn
    // người chưa có ảnh vẫn là bản vẽ code tỉ lệ 1:1 (`artScale` trả 1). Không chia là
    // mấy người có ảnh đứng cao gấp `ART_SS` lần người chơi — to hơn cả cái quầy.
    const k = 1 / artScale(tex.key);
    /** Ngồi thì thân NGẮN lại chứ không chỉ tụt xuống — tụt không thôi trông như lún xuống đất. */
    const sitSquash = 1 - (this.sp.sit.x / SIT_DROP) * SIT_SQUASH;
    this.body.setScale(k, k * (this.sp.sy.x + Math.sin(this.bob * 2) * 0.02 * amp) * sitSquash);
    this.shadow.setPosition(sx, sy).setDepth(depth - 1).setAlpha(fade);

    const headX = sx + fidget, headY = footY(sy) - BODY_H + 12 - hop;
    const name = this.label(c);
    if (this.tag.text !== name) this.tag.setText(name);
    /** Trên đầu thì chip của người sau rơi vào thân người trước (hai chỗ cách 34,5 px, chip rộng ~90 px) và chip người ở quầy đè nhãn trạm. Người QUA ĐƯỜNG không có chip. */
    this.tag.setVisible(!c.ambient);
    this.tag.setPosition(sx, sy + TAG_BELOW_FEET).setDepth(OVERLAY_DEPTH)
      .setAlpha(c.phase === "leaving" ? 0.45 : 0.9);
    this.clampInView(this.tag);

    const g = this.fx;
    g.clear();
    const watching = c.phase !== "leaving" && c.phase !== "arriving";

    // ── dấu trên đầu ───────────────────────────────────────────────────────
    // KHÔNG còn tia nhìn kẻ từ mắt khách tới vùng quầy: lúc đông khách màn hình thành một nắm
    // dây nhợ che đúng cái người chơi cần nhìn. Dấu `?`/`!`/cặp mày nói AI đã thấy; con mắt ở
    // đỉnh màn hình (`Hud.drawEye`) nói CÓ NGƯỜI ĐANG NHÌN.
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

    // Không trừ `hop`: vòng đứng yên, chỉ có người nhún. Vòng nhún theo là nhiễu — mắt
    // phải đọc được nó vơi tới đâu, không phải đọc nó đang nhảy.
    this.drawPatience(g, sx, footY(sy) - BODY_H - PATIENCE_LIFT);

    // ── đạo cụ của trạng thái ánh nhìn ──────────────────────────────────────
    if (watching) this.drawGazeProp(g, headX, headY, time, reducedMotion);

    // ── kênh 1: nét mặt — huy hiệu cạnh đầu, chỉ hiện khi mặt KHÁC nền trung tính ──
    const face = c.react.face;
    if (face !== NEUTRAL && (face[0] || face[1] || face[2])) {
      // Celeste: đổi mặt thì giật đầu 1 px trong 90 ms — "cái giật" của cảm xúc
      const jolt = !reducedMotion && c.now - c.react.faceChangedAt < 0.09 ? -1 : 0;
      drawFace(g, sx + 22, markY + 6 + jolt, face, c.body.skin, browColor(c.body.hair), c.phase === "leaving" ? 0.7 : 1);
    }

    this.drawBodyProps(sx + fidget + fx, footY(sy) - hop + fy - this.sp.up.x + this.sp.sit.x, depth, time, reducedMotion);
    g.setAlpha(fade);
    this.propFx.setAlpha(fade);

    // Bong bóng lấy từ pool (P0-01 §2.6c) — không tạo, không huỷ object nào ở đây.
    // Người xếp hàng phía sau: bong bóng nhỏ hơn 15%, mờ hơn (P1-04 §2.9).
    if (c.say) {
      const b = this.bubbles.acquire(c.id);
      b.setText(c.say);
      const scale = c.slot > 0 ? 0.85 : 1;
      const depthB = OVERLAY_DEPTH + 2;
      const homeX = sx, homeY = sy - BODY_H - 46;
      b.place(homeX, homeY, depthB, scale, reducedMotion);

      // Câu mới (hoặc bong bóng vừa được cấp lại) ⇒ quên chỗ cũ: nó thuộc về câu trước.
      if (c.say !== this.bubbleSaid) { this.bubbleSaid = c.say; this.bubbleOff.settled = false; }

      if (time !== bubbleStamp) { bubbleStamp = time; bubbleBoxes.length = 0; }
      const box0 = bubbleBox(b.root, scale);
      const v = this.scene.cameras.main.worldView;
      const w = box0.x1 - box0.x0, h = box0.y1 - box0.y0;
      const centre0 = { x: (box0.x0 + box0.x1) / 2, y: (box0.y0 + box0.y1) / 2 };
      const off = this.bubbleOff;
      const spot = pickBubbleSpot(centre0, { w, h },
        { left: v.left, right: v.right, top: v.top, bottom: v.bottom },
        bubbleBoxes.map((o) => o.box), bubbleKeepOut, off.settled ? off.want : null);
      off.want = { dx: spot.x - centre0.x, dy: spot.y - centre0.y };
      if (!off.settled) { off.live = { ...off.want }; off.settled = true; }
      else if (reducedMotion) off.live = { ...off.want };
      else {
        /** ⚠️ Dùng CHUNG `dt` đã kẹp 50 ms ở trên — `this.lastT` lúc này đã bị gán `= time`, tự tính lại là ra 0 và bong bóng đứng im vĩnh viễn. */
        const k = 1 - Math.exp(-dt / BUBBLE_GLIDE_TAU);
        off.live = {
          dx: off.live.dx + (off.want.dx - off.live.dx) * k,
          dy: off.live.dy + (off.want.dy - off.live.dy) * k,
        };
      }
      const bx = homeX + off.live.dx, by = homeY + off.live.dy;
      if (bx !== homeX || by !== homeY) b.place(bx, by, depthB, scale, reducedMotion);
      // Ghi ô THẬT (chỗ đang vẽ), không ghi ô đích: người sau phải né cái họ NHÌN THẤY,
      // nếu không thì suốt quãng trượt hai bong bóng vẫn chồng nhau.
      const cx2 = centre0.x + off.live.dx, cy2 = centre0.y + off.live.dy;
      bubbleBoxes.push({ sy, box: { x0: cx2 - w / 2, x1: cx2 + w / 2, y0: cy2 - h / 2, y1: cy2 + h / 2 } });
    } else {
      this.bubbleSaid = "";
      this.bubbleOff.settled = false;
      this.bubbles.release(c.id, reducedMotion);
    }
  }

  private clampInView(t: Phaser.GameObjects.Text) {
    const v = this.scene.cameras.main.worldView;
    const hw = t.displayWidth / 2, hh = t.displayHeight / 2;
    t.setPosition(
      Math.min(Math.max(t.x, v.left + EDGE + hw), v.right - EDGE - hw),
      Math.min(Math.max(t.y, v.top + EDGE + hh), v.bottom - EDGE - hh),
    );
  }

  /** THẤY → HIỂU → NGHE: nhìn thấy từ xa, trước câu nói đầu tiên. */
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
    /*
     * CÁI GHẾ DƯỚI NGƯỜI ĐANG NGỒI. Bản đồ có sẵn bộ bàn ghế ở hàng y11, nhưng người ta
     * ngồi ở `SEAT_SPOT` ngay trước bộ đó — không có cái ghế nào ở ĐÚNG chỗ họ ngồi. Vẽ
     * một cái ghế nhựa thấp bám theo người, nên dời `SEAT_SPOT` thì ghế đi theo.
     */
    if (this.sp.sit.x > 0.4) {
      const k = this.sp.sit.x / SIT_DROP;
      g.fillStyle(0x24588f, 0.95 * k).fillRect(x - 9, foot + 1, 3.5, 8).fillRect(x + 5.5, foot + 1, 3.5, 8);
      g.fillStyle(0x2f6fb3, 0.95 * k).fillEllipse(x, foot + 1, 26, 10);
      g.fillStyle(0x4b8fd6, 0.8 * k).fillEllipse(x, foot - 0.5, 20, 6);
    }

    /*
     * BÉ SU GIƠ ĐIỆN THOẠI LÊN QUAY — act `FILM`. Trước đợt này `FILM` đổi `c.filming`,
     * trừ điểm nếu quầy dơ, và KHÔNG VẼ GÌ: người chơi không biết máy đang chạy, nên cái
     * giá "quầy dơ thì clip hỏng" là một cái bẫy chứ không phải một rủi ro đọc được (T5).
     * Chấm đỏ nhấp nháy là thứ ai cũng đọc được mà không cần học.
     */
    if (c.filming) {
      const px = x + 10, py = shoulder - 2;
      g.fillStyle(0x24282b, 1).fillRoundedRect(px - 4, py - 7, 9, 15, 2);          // thân máy
      g.fillStyle(0x7fb8d8, 0.85).fillRect(px - 2.5, py - 5.5, 6, 12);             // màn hình
      const nhay = rm ? 1 : (Math.sin(time / 260) + 1) / 2;
      g.fillStyle(0xd94f3d, 0.45 + 0.55 * nhay).fillCircle(px + 7, py - 6, 2.1);   // chấm đang quay
      g.lineStyle(1.5, 0xe8d9b5, 0.9).lineBetween(x + 4, shoulder + 7, px - 2, py + 6);  // cánh tay giơ lên
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

  /** Ngoại lệ của CANON L2 — xem khối đầu file. Không số, không vạch chia. */
  private drawPatience(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    const c = this.c;
    const leaving = c.phase === "leaving";

    if (leaving) {
      // Bỏ về vì mình: một vòng đỏ ĐẦY, mờ dần. Được phục vụ xong thì không có gì cả —
      // người ta đi vì xong việc, không phải vì hết chịu nổi.
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
    // Rãnh mờ phía sau: không có nó thì lúc gần cạn, cái cung đỏ ngắn ngủn trông như
    // một vệt bẩn chứ không ra "sắp hết giờ".
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
    this.body.destroy();
    this.shadow.destroy();
    this.tag.destroy();
    this.mark.destroy();
    this.fx.destroy();
    this.propFx.destroy();
    this.bubbles.release(this.c.id, true);
  }
}
