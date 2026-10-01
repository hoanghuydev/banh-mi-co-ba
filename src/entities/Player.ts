import Phaser from "phaser";
import { artScale, fitPhoto } from "../art/photo";
import { TH, depthOf, toScreen, facingOf8, type Facing8 } from "../world/iso";
import { hitsWall, SPAWN } from "../world/map";
import { BASE, FX, HELD, footY, holdAnchor, textureFor } from "../art";
import { heldTexture } from "../art/held";
import { type Hand } from "../world/stations";

/**
 * Người chơi đi bao nhiêu ô mỗi giây.
 *
 * 3,4 → 2,6. Ở 3,4 thì đi hết chiều dài quầy (18 ô, ~540 px màn hình) mất có 5 giây, mà
 * chạy thì 3,7 — nhanh hơn cả con người thật trên một cái vỉa hè rộng ba bước. Nó làm
 * hỏng đúng thứ cả trò chơi dựng lên: cái quán phải có KÍCH THƯỚC, đi từ lò ra chỗ đưa
 * hàng phải TỐN một quãng, nếu không thì chẳng có gì để sắp xếp và chẳng có lý do nào để
 * đặt ổ bánh xuống. Chậm lại một phần tư thì khoảng cách trong quán trở lại có nghĩa, mà
 * vẫn chưa tới mức phải chờ nhân vật lê chân.
 */
export const SPEED = 2.6;

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
  facing: Facing8 = "s";
  hand: Hand = "empty";

  /**
   * Độ giòn của ổ đang cầm (`sim/oven.crust`), CHỈ để chọn hình — không ai tính
   * điểm từ biến này. Scene giữ bản gốc (`handCrust`) và gán xuống đây mỗi khi
   * `hand` đổi; quên gán thì tệ nhất là ổ hiện ra như chưa nướng, không gãy gì.
   *
   * Vì sao không đọc thẳng từ scene: `Player` cố ý không biết gì về `StallScene`
   * (xem docstring lớp) — một con số đi vào thì rẻ hơn một tham chiếu ngược.
   */
  heldCrust = 0;

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
    this.heldCrust = 0;
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

    this.facing = facingOf8(wx, wy);
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
    // Phải chia lại hệ số siêu lấy mẫu sau mỗi `setTexture` (xem `art/photo.fitPhoto`):
    // tám hướng người chơi là ẢNH THẬT nướng dư pixel, còn tư thế nào artist chưa gửi
    // thì rơi về bản vẽ code tỉ lệ 1:1 — không chia là cô to gấp đôi ở đúng hướng đó.
    const k = 1 / artScale(tex.key);
    this.body.setScale(k * (covering ? 0.92 : 1), k * (1 + Math.sin(this.bob * 2) * 0.022 * amp));

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
    // Hình ổ bánh tra theo CẢ độ giòn, không chỉ theo tay đang cầm gì: ổ nướng dở để
    // nguội vẫn là `loaf_cold`, mà vẽ nó bằng hình bột sống là xoá mất công nướng
    // trước mắt người chơi. `fitPhoto` phải gọi lại sau mỗi `setTexture` — hệ số siêu
    // lấy mẫu thuộc về texture, mà hai hình này một bên có ảnh thật, một bên vẽ code.
    fitPhoto(this.held.setTexture(heldTexture(this.hand, this.heldCrust)))
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
