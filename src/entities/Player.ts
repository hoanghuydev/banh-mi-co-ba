import Phaser from "phaser";
import { artScale, fitPhoto, walkLift, holdAnchorAt } from "../art/photo";
import { TH, depthOf, toScreen, facingOf8, type Facing8 } from "../world/iso";
import { hitsWall, SPAWN } from "../world/map";
import { BASE, BODY_H, FX, HELD, footY, holdAnchor, textureFor } from "../art";
import { STRIDE, WALK_FRAMES, walkTextureFor } from "../art/character";
import { heldTexture } from "../art/held";
import { type Hand } from "../world/stations";

/**
 * Người chơi đi bao nhiêu ô mỗi giây. 3,4 → 2,6: ở 3,4 thì đi hết chiều dài quầy mất có 5 giây,
 * nhanh hơn cả con người thật trên vỉa hè.
 *
 * Nó hỏng đúng thứ cả trò chơi dựng lên: cái quán phải có KÍCH THƯỚC, đi từ lò ra chỗ đưa hàng
 * phải TỐN một quãng — không thì chẳng có gì để sắp xếp và chẳng có lý do nào để đặt ổ bánh xuống.
 */
export const SPEED = 2.6;

/** Giữ Shift để chạy: nhanh hơn, nhưng cầm đồ mà chạy là tay lỏng dần (P1-01 §2.7, grip). */
export const RUN_MUL = 1.45;

export type MoveInput = { up: boolean; down: boolean; left: boolean; right: boolean; run?: boolean };

/**
 * Mũi tên "cô Ba đây". Cô Ba không có bảng tên dưới chân như khách, nên trong quán đông người
 * cách duy nhất tìm ra mình là BẤM THỬ MỘT PHÍM rồi xem ai nhúc nhích.
 *
 * Nhưng một mũi tên sáng treo suốt tám tiếng thì phá đúng thứ cảnh này dựng lên (mắt phải nhìn
 * được TAY đang làm gì), nên nó MỜ ĐI khi đang đi và SÁNG LẠI khi đứng yên — đúng lúc người chơi
 * dễ lạc nhất.
 */
const MARK_LIFT = 6;            // px trên đỉnh đầu — mũi nhọn gần đầu, không treo lơ lửng
const MARK_BOB = 1.8;           // biên độ nhấp nhô, tắt khi reducedMotion
const MARK_ALPHA_IDLE = 0.95;
const MARK_ALPHA_MOVING = 0.22;
/** Giây đi liên tục trước khi mũi tên mờ hẳn — đủ cho một bước lắt nhắt không làm nó nháy. */
const MARK_FADE_SEC = 0.55;
/**
 * Nằm trên nhãn trong cảnh (`StallScene.LABEL_DEPTH`) và dưới dấu `?`/`!` trên đầu khách
 * (`CustomerActor.OVERLAY_DEPTH`): lạc chỗ mình đứng là chuyện khó chịu, còn bỏ sót một
 * người vừa bắt gặp mình làm sai là chuyện mất tiền — ai che ai thì theo thứ tự đó.
 */
const MARK_DEPTH = 8_050_000;

/**
 * Nhân vật người chơi: vị trí, va chạm, hướng nhìn, và ba sprite đi kèm (bóng đổ, thân, MÓN ĐANG
 * CẦM). Scene chỉ đưa input và gọi `update`.
 *
 * ⚠️ Sprite nằm THẲNG trên display list, không trong Container: Container của Phaser KHÔNG
 * depth-sort con nên mọi `setDepth` mất tác dụng.
 *
 * Cầm đồ: `character.ts` nướng tư thế `carry` và công bố `holdAnchor()` (chỗ hai bàn tay gặp
 * nhau); `held.ts` nướng hình từng món với tâm texture đặt đúng vào điểm đó. Ở đây chỉ dán món vào
 * cái neo — đổi tư thế hay đổi món đều không phải sửa file này.
 */
export class Player {
  x = SPAWN.x;
  y = SPAWN.y;
  facing: Facing8 = "s";
  hand: Hand = "empty";

  /**
   * Độ giòn của ổ đang cầm, CHỈ để chọn hình — không ai tính điểm từ biến này. Scene giữ bản gốc
   * (`handCrust`) và gán xuống đây mỗi khi `hand` đổi; quên gán thì tệ nhất là ổ hiện ra như chưa
   * nướng.
   *
   * Không đọc thẳng từ scene vì `Player` cố ý không biết gì về `StallScene` — một con số đi vào
   * rẻ hơn một tham chiếu ngược.
   */
  heldCrust = 0;

  /** Có đang bước không — dùng cho nhịp nhún và cho việc huỷ thao tác khi rời trạm. */
  moving = false;
  /** Đang chạy (Shift) — tempo cao hơn, grip hụt dần. */
  running = false;
  /** Frame này có va vào tường/đồ đạc không (muốn đi mà bị chặn cả hai trục). */
  bumped = false;

  private bob = 0;
  /** Quãng đã đi liên tục, tính bằng ô — chỉ dùng để chọn frame chân. Đứng lại là reset. */
  private gait = 0;
  /** Giây đã đi liên tục — mũi tên trên đầu mờ dần theo nó, đứng lại là sáng ngay. */
  private walked = 0;
  private body: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;
  private held: Phaser.GameObjects.Image;
  private mark: Phaser.GameObjects.Image;

  constructor(private scene: Phaser.Scene) {
    this.shadow = scene.add.image(0, 0, FX.shadow).setOrigin(0.5, 0.5);
    this.body = scene.add.image(0, 0, textureFor("s").key).setOrigin(0.5, 1);
    this.held = scene.add.image(0, 0, HELD.key("loaf_hot")).setOrigin(0.5, 0.5).setVisible(false);
    // Origin ở ĐÁY: mũi tên chỉ xuống, mũi nhọn của nó mới là chỗ "chính là người này".
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
    // Ngày mới mở ra là lúc dễ lạc nhất: mũi tên phải sáng sẵn, không phải chờ mờ hết rồi sáng lại.
    this.walked = 0;
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
    // Đứng lại là RESET HẲN, không giảm dần: mũi tên sáng lại ngay khi người chơi thả
    // phím, vì đó mới đúng là lúc họ ngước lên tìm "mình đang ở đâu".
    this.walked = this.moving ? this.walked + dt : 0;
    if (!this.moving) { this.bob = 0; this.gait = 0; return; }

    const len = Math.hypot(wx, wy);
    const speed = SPEED * (this.running ? RUN_MUL : 1);
    wx = (wx / len) * speed * dt;
    wy = (wy / len) * speed * dt;

    // tách hai trục ra thử riêng -> chạm tường thì trượt dọc tường, không bị dính cứng
    const bx = hitsWall(this.x + wx, this.y), by = hitsWall(this.x, this.y + wy);
    const x0 = this.x, y0 = this.y;
    if (!bx) this.x += wx;
    if (!by) this.y += wy;
    // Cộng dồn quãng ĐÃ ĐI THẬT, sau khi va chạm đã cắt bớt — nên ấn vào tường là
    // chân đứng im thay vì quậy tại chỗ.
    this.gait += Math.hypot(this.x - x0, this.y - y0);
    // va thẳng vào thứ gì đó (không trượt được trục nào) = cú va
    this.bumped = (bx || wx === 0) && (by || wy === 0);

    this.facing = facingOf8(wx, wy);
    this.bob += dt * 11;
  }

  /**
   * Vẽ lại. `reducedMotion` tắt nhịp nhún.
   *
   * `covering` — người chơi giữ C để nghiêng người che tay. Doc viết "xoay nghiêng 40°" nhưng
   * `Facing` chỉ có bốn hướng (một nấc đã là 90°), và thêm frame sprite thì phạm CANON §16 Đừng-4.
   * Nên cái nghiêng đó nói bằng squash ngang + dồn trọng tâm, và món trên tay bị đẩy RA SAU THÂN —
   * đó mới là thứ làm hệ số occluder 0,45 đọc được bằng mắt.
   */
  draw(reducedMotion: boolean, covering = false, marker = true) {
    const { sx, sy } = toScreen(this.x, this.y);
    const depth = depthOf(this.x, this.y);

    // Cầm đồ thì đổi hẳn sang bộ texture tư thế bưng — không phải dán món lên
    // người đang buông thõng tay, nhìn ra ngay là món trôi lơ lửng trước bụng.
    const carrying = this.hand !== "empty";

    const walking = this.moving && !reducedMotion;
    /*
     * Bưng đồ thì dùng chu kỳ `carry` — hai tay giữ yên trước bụng (xem `character.ts`) —
     * và dùng CẢ LÚC ĐỨNG YÊN, ghim ở frame 0.
     *
     * ⚠️ Chỗ này là một cái bẫy: nếu đứng yên lại rơi về ảnh tĩnh `p_s_c` thì tay đổi từ
     * "bưng trước bụng" sang "buông thõng", mà neo món theo đó nhảy từ ~28 px xuống 23 px.
     * Ổ bánh giật một cái mỗi lần người chơi thả phím. Mà đứng yên trong lúc cầm ổ bánh thì
     * đằng nào cũng PHẢI đang bưng, nên dùng chính frame bưng là vừa hết giật vừa đúng hơn.
     *
     * `reducedMotion` vẫn được tôn trọng: lúc đó `walking` tắt nên frame đứng im ở 0.
     */
    const cycling = walking || carrying;
    const walkTex = cycling
      ? walkTextureFor(this.facing,
                       walking ? Math.floor((this.gait / STRIDE) * WALK_FRAMES) : 0,
                       carrying ? "carry" : "walk")
      : null;
    const tex = walkTex ?? textureFor(this.facing, "p", carrying ? "carry" : "idle");
    this.body.setTexture(tex.key).setFlipX(tex.flip);

    // CANON §16 Đừng-4: nhún bằng squash/stretch, không thêm một frame sprite nào.
    // Ngoại lệ hẹp cho chu kỳ đi (xem CANON §16) — và khi chu kỳ đó đang chạy thì
    // TẮT nhún code đi: frame render đã có sẵn nhún trong người (đo được 10 px),
    // chồng thêm sine nữa là nảy hai tầng, nhìn ra ngay là lò xo chứ không phải bước chân.
    const amp = reducedMotion ? 0 : 1;
    // Một công tắc cho CẢ nhún lẫn squash, không phải hai: tắt mỗi nhún mà để squash
    // chạy tiếp thì người vẫn phập phồng tại chỗ trong lúc chân đã bước đúng nhịp.
    const bodyAmp = walkTex ? 0 : amp;
    const hop = Math.abs(Math.sin(this.bob)) * 2.4 * bodyAmp;
    // Nghiêng người che tay: thu hẹp bóng dáng lại và dồn người về một bên. Vẽ tĩnh,
    // nên `reducedMotion` không phải tắt gì thêm.
    const lean = covering ? 5 : 0;
    this.body.setPosition(sx + lean, footY(sy) - hop).setDepth(depth);
    // Phải chia lại hệ số siêu lấy mẫu sau mỗi `setTexture` (xem `art/photo.fitPhoto`):
    // tám hướng người chơi là ẢNH THẬT nướng dư pixel, còn tư thế nào artist chưa gửi
    // thì rơi về bản vẽ code tỉ lệ 1:1 — không chia là cô to gấp đôi ở đúng hướng đó.
    const k = 1 / artScale(tex.key);
    this.body.setScale(k * (covering ? 0.92 : 1), k * (1 + Math.sin(this.bob * 2) * 0.022 * bodyAmp));

    // Bóng đổ nằm ĐÚNG tại điểm chạm đất (tâm ô), không phải ở đáy texture —
    // lệch chỗ này là nhân vật trông như đang lơ lửng.
    // Bóng phải phản ứng theo CHÂN, chứ không theo một đồng hồ riêng.
    //
    // ⚠️ Lúc chạy chu kỳ đi, `hop` bị tắt (nhún đã nằm sẵn trong frame render) — nên nếu
    // chỉ nhìn `hop` thì người nhún mà bóng đứng im như đóng đinh, và đó chính là thứ
    // tố cáo cái bóng là miếng dán. `walkLift` trả về độ nhấc chân ĐO TỪ chính frame đang vẽ.
    const lift = walkTex ? walkLift(walkTex.key) : hop;
    // Nhấc cao thì bóng CO LẠI và NHẠT ĐI. Hai thứ phải đi cùng nhau: chỉ co mà giữ nguyên
    // độ đậm thì ra cái bóng nhỏ mà đen kịt, đọc thành một vũng dầu chứ không phải bóng.
    //
    // Hai hệ số NHỎ, và phải nhỏ: nhấc cao nhất trong chu kỳ đi đo được ~2,2 px trên thân
    // người cao 65 px — tức 3,3%. Lần đầu mình để 0,075/0,12, ra bóng co 16% và nhạt 26%,
    // nhìn thành nhân vật nảy tưng tưng chứ không phải bước đi. Ở mức này bóng co ~7% và
    // nhạt ~11% ở đỉnh bước: đủ để thấy nó SỐNG, không đủ để thành nhịp đập.
    this.shadow.setPosition(sx + lean, sy).setDepth(depth - 1)
      .setScale(1 - lift * 0.03)
      .setAlpha(1 - lift * 0.05);

    this.drawMark(sx + lean, sy, hop, reducedMotion, marker);

    if (!carrying) {
      this.held.setVisible(false);
      return;
    }

    // Neo đo TỪ BÀN CHÂN lên. Bàn chân KHÔNG nằm ở `footY(sy)` — đó là đáy
    // texture, thấp hơn chân `1 + BASE + TH/2` px (xem `prop` trong canvas.ts);
    // dùng thẳng footY là món rơi xuống ngang dép. Trừ `hop` để món nhún cùng nhịp.
    // Đang chạy chu kỳ BƯNG thì neo bám theo đúng bàn tay của frame đang vẽ, lấy từ bảng
    // `tools/render-character.py` xuất thẳng từ XƯƠNG. Lúc đứng yên (hay thiếu bảng) thì
    // về neo cố định theo hướng như cũ.
    const base = holdAnchor(this.facing);
    const live = walkTex?.gait === "carry" ? holdAnchorAt(this.facing, walkTex.frame) : null;
    const a = live ? { x: live.x, y: live.y, behind: base.behind } : base;
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

  /**
   * Mũi tên "cô Ba đây" (xem khối hằng số đầu file). Đo từ `sy` chứ không `footY(sy)`, và dùng hằng
   * `BODY_H` chứ không đo texture — giống hệt dấu trên đầu khách, nên hai thứ nằm cùng một độ cao
   * dù ảnh thật của artist có cao thấp khác nhau. Trừ `hop` để nó nhún cùng nhịp bước.
   */
  private drawMark(sx: number, sy: number, hop: number, reducedMotion: boolean, on: boolean) {
    if (!on) { this.mark.setVisible(false); return; }
    const t = Math.min(1, this.walked / MARK_FADE_SEC);
    const bob = reducedMotion ? 0 : Math.sin(this.bob * 0.9) * MARK_BOB;
    this.mark.setVisible(true)
      .setPosition(sx, sy - BODY_H - MARK_LIFT - hop + bob)
      .setAlpha(MARK_ALPHA_IDLE + (MARK_ALPHA_MOVING - MARK_ALPHA_IDLE) * t);
  }

  /** Sprite món đang cầm — để scene vẽ hơi khói đúng ngay trên ổ bánh (P1-01 §4). */
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
