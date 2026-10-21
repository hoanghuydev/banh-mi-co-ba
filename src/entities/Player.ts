import Phaser from "phaser";
import { artScale, fitPhoto, walkLift, holdAnchorAt } from "../art/photo";
import { TH, depthOf, toScreen, facingOf8, type Facing8 } from "../world/iso";
import { hitsWall, SPAWN } from "../world/map";
import { BASE, BODY_H, FX, HELD, footY, holdAnchor, textureFor } from "../art";
import { STRIDE, WALK_FRAMES, walkTextureFor } from "../art/character";
import { heldTexture } from "../art/held";
import { type Hand } from "../world/stations";

/** Ô/giây; chậm cố ý để đi giữa các trạm tốn một quãng. */
export const SPEED = 2.6;

export const RUN_MUL = 1.45;

export type MoveInput = { up: boolean; down: boolean; left: boolean; right: boolean; run?: boolean };

// Mũi tên "mình đây": mờ khi đi để không che tay, sáng lại khi đứng yên.
const MARK_LIFT = 6;            // px trên đỉnh đầu
const MARK_BOB = 1.8;
const MARK_ALPHA_IDLE = 0.95;
const MARK_ALPHA_MOVING = 0.22;
const MARK_FADE_SEC = 0.55;
/** Trên `StallScene.LABEL_DEPTH`, dưới `CustomerActor.OVERLAY_DEPTH`. */
const MARK_DEPTH = 8_050_000;

/** Sprite nằm thẳng trên display list vì Container của Phaser không depth-sort con. */
export class Player {
  x = SPAWN.x;
  y = SPAWN.y;
  facing: Facing8 = "s";
  hand: Hand = "empty";

  /** Chỉ để chọn hình ổ đang cầm; scene gán xuống mỗi khi `hand` đổi. */
  heldCrust = 0;

  moving = false;
  running = false;
  /** Bị chặn cả hai trục trong frame này. */
  bumped = false;

  private bob = 0;
  /** Quãng đã đi liên tục (ô), để chọn frame chân. */
  private gait = 0;
  private walked = 0;
  private body: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;
  private held: Phaser.GameObjects.Image;
  private mark: Phaser.GameObjects.Image;

  constructor(private scene: Phaser.Scene) {
    this.shadow = scene.add.image(0, 0, FX.shadow).setOrigin(0.5, 0.5);
    this.body = scene.add.image(0, 0, textureFor("s").key).setOrigin(0.5, 1);
    this.held = scene.add.image(0, 0, HELD.key("loaf_hot")).setOrigin(0.5, 0.5).setVisible(false);
    this.mark = scene.add.image(0, 0, FX.you).setOrigin(0.5, 1).setDepth(MARK_DEPTH);
  }

  reset() {
    this.x = SPAWN.x;
    this.y = SPAWN.y;
    this.facing = "s";
    this.hand = "empty";
    this.heldCrust = 0;
    this.moving = false;
    this.bob = 0;
    this.gait = 0;
    this.walked = 0;
  }

  /** Input xoay 45° để bấm D là đi sang phải MÀN HÌNH. */
  move(input: MoveInput, dt: number) {
    const ix = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    const iy = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let wx = ix + iy;
    let wy = ix - iy;

    this.moving = wx !== 0 || wy !== 0;
    this.running = this.moving && !!input.run;
    this.bumped = false;
    this.walked = this.moving ? this.walked + dt : 0;
    if (!this.moving) { this.bob = 0; this.gait = 0; return; }

    const len = Math.hypot(wx, wy);
    const speed = SPEED * (this.running ? RUN_MUL : 1);
    wx = (wx / len) * speed * dt;
    wy = (wy / len) * speed * dt;

    // Thử riêng từng trục để chạm tường thì trượt dọc tường.
    const bx = hitsWall(this.x + wx, this.y), by = hitsWall(this.x, this.y + wy);
    const x0 = this.x, y0 = this.y;
    if (!bx) this.x += wx;
    if (!by) this.y += wy;
    // Quãng đi thật sau va chạm, để ấn vào tường thì chân đứng im.
    this.gait += Math.hypot(this.x - x0, this.y - y0);
    this.bumped = (bx || wx === 0) && (by || wy === 0);

    this.facing = facingOf8(wx, wy);
    this.bob += dt * 11;
  }

  /** `covering`: giữ C nghiêng người che tay — squash ngang + đẩy món ra sau thân thay cho frame mới. */
  draw(reducedMotion: boolean, covering = false, marker = true) {
    const { sx, sy } = toScreen(this.x, this.y);
    const depth = depthOf(this.x, this.y);

    const carrying = this.hand !== "empty";

    const walking = this.moving && !reducedMotion;
    // Cầm đồ thì dùng chu kỳ `carry` cả lúc đứng yên (frame 0), không thì neo món giật khi thả phím.
    const cycling = walking || carrying;
    const walkTex = cycling
      ? walkTextureFor(this.facing,
                       walking ? Math.floor((this.gait / STRIDE) * WALK_FRAMES) : 0,
                       carrying ? "carry" : "walk")
      : null;
    const tex = walkTex ?? textureFor(this.facing, "p", carrying ? "carry" : "idle");
    this.body.setTexture(tex.key).setFlipX(tex.flip);

    const amp = reducedMotion ? 0 : 1;
    // Frame đi đã có sẵn nhún, nên tắt cả nhún lẫn squash code để không nảy hai tầng.
    const bodyAmp = walkTex ? 0 : amp;
    const hop = Math.abs(Math.sin(this.bob)) * 2.4 * bodyAmp;
    const lean = covering ? 5 : 0;
    this.body.setPosition(sx + lean, footY(sy) - hop).setDepth(depth);
    // Hệ số siêu lấy mẫu thuộc về texture (ảnh thật vs vẽ code), phải tính lại sau mỗi `setTexture`.
    const k = 1 / artScale(tex.key);
    this.body.setScale(k * (covering ? 0.92 : 1), k * (1 + Math.sin(this.bob * 2) * 0.022 * bodyAmp));

    // Lúc đi `hop` = 0, nên lấy độ nhấc chân đo từ chính frame đang vẽ.
    const lift = walkTex ? walkLift(walkTex.key) : hop;
    // Hệ số nhỏ cố ý: nhấc tối đa ~2,2 px nên bóng chỉ co ~7%, nhạt ~11%.
    this.shadow.setPosition(sx + lean, sy).setDepth(depth - 1)
      .setScale(1 - lift * 0.03)
      .setAlpha(1 - lift * 0.05);

    this.drawMark(sx + lean, sy, hop, reducedMotion, marker);

    if (!carrying) {
      this.held.setVisible(false);
      return;
    }

    // Neo đo từ bàn chân, mà bàn chân cao hơn `footY(sy)` (đáy texture) `1 + BASE + TH/2` px.
    const base = holdAnchor(this.facing);
    const live = walkTex?.gait === "carry" ? holdAnchorAt(this.facing, walkTex.frame) : null;
    const a = live ? { x: live.x, y: live.y, behind: base.behind } : base;
    const feet = footY(sy) - (1 + BASE + TH / 2);
    // Tra hình theo cả độ giòn: ổ nướng dở để nguội vẫn là `loaf_cold` nhưng không được vẽ như bột sống.
    fitPhoto(this.held.setTexture(heldTexture(this.hand, this.heldCrust)))
      .setPosition(sx + lean + (covering ? a.x * 0.35 : a.x), feet - hop - a.y)
      .setDepth(depth + (covering || a.behind ? -0.5 : 1))
      .setVisible(true);
  }

  /** Đo từ `sy` + hằng `BODY_H` như dấu trên đầu khách, để hai thứ cùng độ cao. */
  private drawMark(sx: number, sy: number, hop: number, reducedMotion: boolean, on: boolean) {
    if (!on) { this.mark.setVisible(false); return; }
    const t = Math.min(1, this.walked / MARK_FADE_SEC);
    const bob = reducedMotion ? 0 : Math.sin(this.bob * 0.9) * MARK_BOB;
    this.mark.setVisible(true)
      .setPosition(sx, sy - BODY_H - MARK_LIFT - hop + bob)
      .setAlpha(MARK_ALPHA_IDLE + (MARK_ALPHA_MOVING - MARK_ALPHA_IDLE) * t);
  }

  get heldSprite(): Readonly<Phaser.GameObjects.Image> {
    return this.held;
  }

  destroy() {
    this.body.destroy();
    this.shadow.destroy();
    this.held.destroy();
    this.mark.destroy();
    void this.scene;
  }
}
