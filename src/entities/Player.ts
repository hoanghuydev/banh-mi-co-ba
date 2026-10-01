import Phaser from "phaser";
import { TH, depthOf, toScreen, facingOf, type Facing } from "../world/iso";
import { hitsWall, SPAWN } from "../world/map";
import { BASE, FX, HELD, footY, holdAnchor, textureFor } from "../art";
import { type Hand } from "../world/stations";

/** Người chơi đi bao nhiêu ô mỗi giây. */
export const SPEED = 3.4;

/** Giữ Shift để chạy: nhanh hơn, nhưng cầm đồ mà chạy là tay lỏng dần (P1-01 §2.7, grip). */
export const RUN_MUL = 1.45;

export type MoveInput = { up: boolean; down: boolean; left: boolean; right: boolean; run?: boolean };

/**
 * Nhân vật người chơi: vị trí, va chạm, hướng nhìn, và ba sprite đi kèm
 * (bóng đổ, thân, MÓN ĐANG CẦM).
 *
 * Scene chỉ đưa input và gọi `update` — mọi thứ còn lại nằm gọn trong đây,
 * nên đổi cách điều khiển hay đổi art nhân vật không phải mở StallScene ra.
 *
 * Sprite nằm THẲNG trên display list của scene, không nằm trong Container:
 * Container của Phaser KHÔNG depth-sort con, nên bỏ vào đó là mọi `setDepth` mất tác dụng.
 *
 * ── Cầm đồ ───────────────────────────────────────────────────────────────────
 * Đang cầm gì thì THẤY trên tay, không phải đọc ở một cái chip chữ trên đầu.
 * Hai phần rời nhau lo việc đó và chỉ gặp nhau ở một điểm:
 *  · `character.ts` nướng thêm tư thế `carry` (khuỷu gập, cẳng tay đưa ra trước)
 *    và công bố `holdAnchor()` — toạ độ chỗ hai bàn tay gặp nhau.
 *  · `held.ts` nướng hình từng món, tâm texture đặt đúng vào điểm cầm đó.
 * Ở đây chỉ việc dán món vào cái neo. Đổi tư thế hay đổi món đều không phải sửa file này.
 */
export class Player {
  x = SPAWN.x;
  y = SPAWN.y;
  facing: Facing = "s";
  hand: Hand = "empty";

  /** Có đang bước không — dùng cho nhịp nhún và cho việc huỷ thao tác khi rời trạm. */
  moving = false;
  /** Đang chạy (Shift) — tempo cao hơn, grip hụt dần. */
  running = false;
  /** Frame này có va vào tường/đồ đạc không (muốn đi mà bị chặn cả hai trục). */
  bumped = false;

  private bob = 0;
  private body: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;
  private held: Phaser.GameObjects.Image;

  constructor(private scene: Phaser.Scene) {
    this.shadow = scene.add.image(0, 0, FX.shadow).setOrigin(0.5, 0.5);
    this.body = scene.add.image(0, 0, textureFor("s").key).setOrigin(0.5, 1);
    this.held = scene.add.image(0, 0, HELD.key("loaf_hot")).setOrigin(0.5, 0.5).setVisible(false);
  }

  reset() {
    this.x = SPAWN.x;
    this.y = SPAWN.y;
    this.facing = "s";
    this.hand = "empty";
    this.moving = false;
    this.bob = 0;
  }

  /**
   * Điều khiển xoay 45°: bấm D thì nhân vật đi sang PHẢI MÀN HÌNH.
   * Không xoay thì người chơi bấm "sang phải" mà nhân vật đi chéo xuống — rất khó chịu.
   */
  move(input: MoveInput, dt: number) {
    const ix = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    const iy = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let wx = ix + iy;
    let wy = ix - iy;

    this.moving = wx !== 0 || wy !== 0;
    this.running = this.moving && !!input.run;
    this.bumped = false;
    if (!this.moving) { this.bob = 0; return; }

    const len = Math.hypot(wx, wy);
    const speed = SPEED * (this.running ? RUN_MUL : 1);
    wx = (wx / len) * speed * dt;
    wy = (wy / len) * speed * dt;

    // tách hai trục ra thử riêng -> chạm tường thì trượt dọc tường, không bị dính cứng
    const bx = hitsWall(this.x + wx, this.y), by = hitsWall(this.x, this.y + wy);
    if (!bx) this.x += wx;
    if (!by) this.y += wy;
    // va thẳng vào thứ gì đó (không trượt được trục nào) = cú va
    this.bumped = (bx || wx === 0) && (by || wy === 0);

    this.facing = facingOf(wx, wy);
    this.bob += dt * 11;
  }

  /**
   * Vẽ lại. `reducedMotion` tắt nhịp nhún (CANON §15.3).
   *
   * `covering` — người chơi đang giữ C để nghiêng người che tay (P1-02 §2.8 Công cụ 3).
   * Doc viết "xoay nghiêng 40°", nhưng `Facing` chỉ có bốn hướng (`world/iso`), một nấc
   * đã là 90° — quá nhiều, và thêm frame sprite thì phạm CANON §16 Đừng-4. Nên cái
   * nghiêng đó nói bằng đúng thành ngữ file này vẫn dùng: squash ngang + dồn trọng tâm,
   * và món trên tay bị đẩy RA SAU THÂN ở mọi hướng — đó mới là thứ làm hệ số occluder
   * 0,45 đọc được bằng mắt.
   */
  draw(reducedMotion: boolean, covering = false) {
    const { sx, sy } = toScreen(this.x, this.y);
    const depth = depthOf(this.x, this.y);

    // Cầm đồ thì đổi hẳn sang bộ texture tư thế bưng — không phải dán món lên
    // người đang buông thõng tay, nhìn ra ngay là món trôi lơ lửng trước bụng.
    const carrying = this.hand !== "empty";
    const tex = textureFor(this.facing, "p", carrying ? "carry" : "idle");
    this.body.setTexture(tex.key).setFlipX(tex.flip);

    // CANON §16 Đừng-4: nhún bằng squash/stretch, không thêm một frame sprite nào
    const amp = reducedMotion ? 0 : 1;
    const hop = Math.abs(Math.sin(this.bob)) * 2.4 * amp;
    // Nghiêng người che tay: thu hẹp bóng dáng lại và dồn người về một bên. Vẽ tĩnh,
    // nên `reducedMotion` không phải tắt gì thêm.
    const lean = covering ? 5 : 0;
    this.body.setPosition(sx + lean, footY(sy) - hop).setDepth(depth);
    this.body.setScale(covering ? 0.92 : 1, 1 + Math.sin(this.bob * 2) * 0.022 * amp);

    // Bóng đổ nằm ĐÚNG tại điểm chạm đất (tâm ô), không phải ở đáy texture —
    // lệch chỗ này là nhân vật trông như đang lơ lửng.
    this.shadow.setPosition(sx + lean, sy).setDepth(depth - 1).setScale(1 - hop * 0.04);

    if (!carrying) {
      this.held.setVisible(false);
      return;
    }

    // Neo đo TỪ BÀN CHÂN lên. Bàn chân KHÔNG nằm ở `footY(sy)` — đó là đáy
    // texture, thấp hơn chân `1 + BASE + TH/2` px (xem `prop` trong canvas.ts);
    // dùng thẳng footY là món rơi xuống ngang dép. Trừ `hop` để món nhún cùng nhịp.
    const a = holdAnchor(this.facing);
    const feet = footY(sy) - (1 + BASE + TH / 2);
    this.held
      .setTexture(HELD.key(this.hand))
      // Che tay: kéo món về sát thân rồi giấu ra sau lưng, bất kể đang quay hướng nào.
      .setPosition(sx + lean + (covering ? a.x * 0.35 : a.x), feet - hop - a.y)
      // Quay lưng thì món khuất sau thân; mọi hướng khác thì nằm trong lòng hai bàn tay.
      .setDepth(depth + (covering || a.behind ? -0.5 : 1))
      .setVisible(true);
  }

  /** Sprite món đang cầm — để scene vẽ hơi khói đúng ngay trên ổ bánh (P1-01 §4). */
  get heldSprite(): Readonly<Phaser.GameObjects.Image> {
    return this.held;
  }

  destroy() {
    this.body.destroy();
    this.shadow.destroy();
    this.held.destroy();
    void this.scene;
  }
}
