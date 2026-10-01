/**
 * Camera của cảnh quán — phóng to + trượt theo người chơi.
 *
 * CANON T1 viết "cả góc phố trong một khung hình, camera không đi lang thang". Lý do
 * thật của T1 (xem P3-05 §Camera) là: người chơi phải thấy TRỌN một lỗi từ lúc gây ra
 * tới lúc bị phát hiện, và phải thấy mật độ mắt nhìn. Cái T1 cấm là camera CẮT sang
 * chỗ khác — quầy B, một màn khác — chứ không phải vài trăm pixel trượt quanh chính
 * góc quán đó.
 *
 * Mà để cả 20×12 ô lọt trong 1024×576 thì một người chỉ cao chừng 40 px: nhìn không ra
 * ai đang cau mày, không ra ổ bánh trên thớt còn nhân gì. Nên:
 *
 *   - phóng `ZOOM` lần,
 *   - trượt theo người chơi, nhưng có DEADZONE rộng (đi loanh quanh trong quầy thì
 *     camera đứng yên) và bị CHẶN trong hình bao của cảnh (`setBounds`) — camera
 *     không bao giờ trượt ra khỏi góc quán, mép bản đồ là mép đường đi của nó.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HAI CAMERA, và vì sao bắt buộc phải hai:
 *
 * `setZoom` của Phaser phóng MỌI thứ camera đó vẽ, kể cả object `scrollFactor(0)`.
 * HUD, bảng kẹp nhân, bảng thoại đều dán màn bằng `scrollFactor(0)` — để chung một
 * camera là chúng phình theo và trôi khỏi mép màn (object ở (512, 50) với zoom 1,4 và
 * tâm camera (512, 288) rơi xuống y = −45, tức bay hẳn lên trên khung hình).
 *
 * Nên UI đi một camera RIÊNG: zoom 1, scroll 0, vẽ đè lên camera thế giới.
 *
 * Phân loại object vào camera nào thì lấy đúng `scrollFactorX === 0` làm mốc — đó
 * chính là định nghĩa "dán vào màn hình", không phải một quy ước mới phải nhớ. Nhưng
 * `scrollFactor` được đặt SAU lúc dựng object, nên không thể phân loại ngay ở
 * `ADDED_TO_SCENE`; phải gom lại rồi chốt ở `PRE_RENDER`, lúc mọi `setScrollFactor`
 * và `container.add()` của frame đó đã chạy xong.
 *
 * Object nằm trong Container thì KHÔNG đụng tới: Phaser bỏ qua cả Container khi
 * `willRender` của nó trả false, nên con thừa hưởng quyết định của cha. Đặt cờ riêng
 * cho con là cách chắc chắn nhất để làm nó biến mất (con `scrollFactor` mặc định 1
 * nằm trong Container UI sẽ bị xếp nhầm vào camera thế giới).
 */
import Phaser from "phaser";
import { GAME_W, GAME_H } from "../core/config";
import { RENDER_SCALE, fitDesignFrame } from "../core/render";

/**
 * Phóng bao nhiêu lần. Chỉnh số này là chỗ duy nhất cần chỉnh để đổi độ "to".
 *
 * 1,4 → 1,28. Ở 1,4 thì khung nhìn chỉ còn 731 × 411 toạ độ thiết kế: cái tủ bánh nằm
 * ở hàng trên cùng bị cắt mất NHÃN TÊN mỗi khi người chơi đứng ở nửa dưới quầy, mà
 * camera đã chạm mép trên của `setBounds` nên không trượt lên thêm được nữa. 1,28 cho
 * 800 × 450 — vừa đủ cả hàng trạm phía trên lẫn hàng khách phía dưới trong một khung.
 *
 * Thử 1,18 trước rồi bỏ: rộng hơn thì đúng là thừa chỗ, nhưng mép dưới khung nhìn ăn
 * thêm cả hai hàng lòng đường trống trơn — đổi diện tích màn hình lấy nhựa đường.
 *
 * KHÔNG mất nét: độ nét đến từ `RENDER_SCALE` (canvas dựng ở độ phân giải thật của màn
 * hình) chứ không từ `ZOOM`, và `art/photo.ART_SS` nướng texture dư theo hệ số 1,4 cũ —
 * tức là giờ còn dư hơn mức cần, nét hơn chứ không kém.
 *
 * Mặt khách vẫn đọc được: một người cao 64 px thiết kế × 1,28 = 82 px trên khung 576,
 * tức hơn 1/7 chiều cao màn hình.
 *
 * Nhãn trạm KHÔNG còn phụ thuộc con số này nữa: `StallScene.drawLabels` kẹp chúng trong
 * khung nhìn mỗi frame, nên chỉnh `ZOOM` không bao giờ cắt mất tên trạm lần nữa.
 */
export const ZOOM = 1.28;

/**
 * Vùng chết: người chơi còn trong khung này thì camera ĐỨNG YÊN — đi loanh quanh trong
 * quầy không làm cả cảnh trôi qua trôi lại, mà đó mới là thứ gây mệt mắt chứ không phải
 * bản thân việc camera trượt.
 *
 * 300 → 420 theo chiều ngang: quầy giờ dài 18 ô (trước là 12), người chơi đi từ thớt
 * (x=4) tới chỗ đưa hàng (x=12) là 360 px màn hình. Vùng chết 300 px hẹp hơn quãng đó
 * nên mỗi lượt khách là một cú lia máy đi rồi lia về. 420 px nuốt trọn quãng đi lại
 * thường xuyên nhất, camera chỉ nhúc nhích khi người chơi thật sự rời khu làm việc.
 */
const DEADZONE_W = 420;
const DEADZONE_H = 170;

/** Độ trễ bám (0..1 mỗi frame). Thấp = trôi mượt, cao = bám sát. */
const LERP = 0.09;

/**
 * Camera nhìn thấp hơn chân người chơi chừng này px. Âm = nhìn CAO hơn chân.
 *
 * 46 → 4. Con số 46 cũ tính cho bản đồ 20×12, hồi khu làm việc chỉ sâu ba hàng và hàng
 * khách nằm ngay sát dưới quầy: lúc đó phải đẩy tầm nhìn xuống mới thấy được mặt khách.
 *
 * Bản đồ mới sâu hơn hẳn — năm hàng trong quán, năm hàng vỉa hè, năm hàng đường — và
 * đo thật thì mọi thứ ĐÁNG NHÌN nằm gọn trong dải màn hình y ≈ 75…302: đỉnh quán 75,
 * người chơi 135 (ở thớt) tới 255 (ở chỗ đưa hàng), hàng khách 189…302. Với khung nhìn
 * cao 450 px thì 46 đẩy dải đó lên sát mép trên và chừa 170 px — hơn một phần ba màn
 * hình — cho lòng đường trống trơn. 4 kéo dải ấy về đúng giữa khung.
 *
 * Thứ T1 thật sự bảo vệ vẫn còn nguyên: cả hàng khách vẫn trong khung ở cả hai đầu quầy.
 */
const LOOK_DOWN = 4;

export class StallCamera {
  /** Camera vẽ UI: không phóng, không trượt. */
  readonly ui: Phaser.Cameras.Scene2D.Camera;
  /** Camera thế giới (= `cameras.main`, vì `CustomerActor` đọc `worldView` của nó). */
  readonly world: Phaser.Cameras.Scene2D.Camera;

  private target: Phaser.GameObjects.Zone;
  /** Lần `lookAt` đầu tiên thì NHẢY thẳng tới, không trôi từ giữa bản đồ qua. */
  private snapped = false;
  private pending: Phaser.GameObjects.GameObject[] = [];
  private onAdd: (o: Phaser.GameObjects.GameObject) => void;
  private onPreRender: () => void;

  constructor(private scene: Phaser.Scene, bounds: Phaser.Geom.Rectangle) {
    // Scene được Phaser DÙNG LẠI giữa hai ngày: không dọn thì mỗi lần `create()` lại
    // chồng thêm một camera UI nữa, và cái cũ vẫn vẽ đè.
    this.world = scene.cameras.resetAll();
    // Canvas dựng ở độ phân giải thật (xem `core/render`) nên viewport phải tính bằng
    // pixel canvas, còn `fitDesignFrame` kéo camera UI về đúng khung thiết kế 1024 × 576.
    this.ui = scene.cameras.add(0, 0, Math.round(GAME_W * RENDER_SCALE), Math.round(GAME_H * RENDER_SCALE));
    this.ui.transparent = true;
    fitDesignFrame(this.ui);

    this.world.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
    // Hai cái nhân vào nhau: `ZOOM` là "phóng to cho dễ nhìn" (quyết định thiết kế),
    // `RENDER_SCALE` là "vẽ ở độ phân giải thật" (quyết định kỹ thuật). Deadzone và
    // bounds vẫn tính bằng toạ độ thế giới nên không đụng tới.
    this.world.setZoom(ZOOM * RENDER_SCALE);
    this.world.setDeadzone(DEADZONE_W, DEADZONE_H);

    // Camera bám một cái mốc vô hình thay vì bám thẳng sprite người chơi: `Player`
    // giữ sprite private, và mốc riêng còn cho phép dời điểm nhìn đi chỗ khác sau này
    // (cảnh nghe lỏm, khoảng lặng ngày 40) mà không phải đụng vào `Player`.
    this.target = scene.add.zone(bounds.centerX, bounds.centerY, 1, 1);
    this.world.startFollow(this.target, true, LERP, LERP);

    this.onAdd = (o) => this.pending.push(o);
    this.onPreRender = () => this.flush();
    scene.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, this.onAdd);
    scene.events.on(Phaser.Scenes.Events.PRE_RENDER, this.onPreRender);

    // Nền và đạo cụ đã dựng XONG trước lúc này (`sceneBounds` cần hình bao của chúng mới
    // tính được mép đường đi của camera), nên `ADDED_TO_SCENE` không bắt được cái nào.
    // Không nạp lại ở đây thì cả cái quán vẽ trên CẢ HAI camera: một bản đúng chỗ, một
    // bản của camera UI nằm lệch hẳn sang bên — nhìn ra ngay thành hai cái quán.
    this.pending.push(...scene.children.list);
  }

  /** Điểm camera muốn nhìn, theo toạ độ MÀN HÌNH (đã qua `toScreen` + `footY`). */
  lookAt(sx: number, sy: number) {
    const y = sy + LOOK_DOWN;
    this.target.setPosition(sx, y);
    // Frame đầu của một ngày: nhảy thẳng vào chỗ người chơi. Không có cái này thì camera
    // khởi động ở giữa bản đồ (tức ngoài lòng đường, vì bản đồ có tận ba hàng đường) rồi
    // trôi ngược vào quán mất vài giây — mở màn bằng một cú lia máy không ai xin.
    if (!this.snapped) { this.snapped = true; this.world.centerOn(sx, y); }
  }

  /**
   * Chốt object mới vào đúng camera. Chạy ở `PRE_RENDER` nên mọi `setScrollFactor`
   * và `container.add()` của frame này đã xong.
   */
  private flush() {
    for (const o of this.pending) {
      const g = o as Phaser.GameObjects.GameObject & {
        parentContainer?: Phaser.GameObjects.Container | null;
        scrollFactorX?: number;
      };
      if (g.parentContainer) continue;                 // con của Container: cha quyết định
      if (g.scrollFactorX === 0) this.world.ignore(o);
      else this.ui.ignore(o);
    }
    this.pending.length = 0;
  }

  destroy() {
    this.scene.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, this.onAdd);
    this.scene.events.off(Phaser.Scenes.Events.PRE_RENDER, this.onPreRender);
    this.pending.length = 0;
    this.target.destroy();
  }
}
