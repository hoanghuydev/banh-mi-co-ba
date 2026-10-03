/**
 * Camera của cảnh quán — phóng to + trượt theo người chơi.
 *
 * CANON T1 cấm camera CẮT sang chỗ khác (quầy B, một màn khác), không cấm vài trăm pixel trượt
 * quanh chính góc quán đó. Mà để cả bản đồ lọt trong 1024×576 thì một người chỉ cao ~40 px: nhìn
 * không ra ai đang cau mày. Nên phóng `ZOOM` lần, trượt theo người chơi với DEADZONE rộng, và
 * chặn trong hình bao của cảnh (`setBounds`).
 *
 * ⚠️ HAI CAMERA, và vì sao bắt buộc: `setZoom` phóng MỌI thứ camera đó vẽ, kể cả object
 * `scrollFactor(0)` — để chung một camera thì HUD và mấy cái bảng phình theo rồi trôi khỏi mép
 * màn. Nên UI đi một camera RIÊNG (zoom 1, scroll 0, vẽ đè lên camera thế giới).
 *
 * Phân loại lấy `scrollFactorX === 0` làm mốc — đó chính là định nghĩa "dán vào màn hình". Nhưng
 * `scrollFactor` được đặt SAU lúc dựng object nên phải gom lại rồi chốt ở `PRE_RENDER`.
 *
 * ⚠️ Object nằm trong Container thì KHÔNG đụng tới: Phaser bỏ qua cả Container khi `willRender`
 * trả false, nên con thừa hưởng quyết định của cha — đặt cờ riêng cho con là cách chắc chắn nhất
 * để làm nó biến mất.
 */
import Phaser from "phaser";
import { GAME_W, GAME_H } from "../core/config";
import { RENDER_SCALE, fitDesignFrame } from "../core/render";

/**
 * Phóng bao nhiêu lần — chỗ duy nhất cần chỉnh để đổi độ "to".
 *
 * 1,4 → 1,28: ở 1,4 thì khung nhìn chỉ còn 731 × 411, cái tủ bánh ở hàng trên cùng bị cắt mất
 * nhãn tên mà camera đã chạm mép trên của `setBounds`. 1,28 cho 800 × 450 — vừa đủ cả hàng trạm
 * phía trên lẫn hàng khách phía dưới. Thử 1,18 rồi bỏ: rộng hơn thì mép dưới ăn thêm hai hàng
 * lòng đường trống trơn.
 *
 * KHÔNG mất nét: độ nét đến từ `RENDER_SCALE` chứ không từ `ZOOM`, và `art/photo.ART_SS` vẫn nướng
 * texture theo hệ số 1,4 cũ nên còn dư hơn mức cần.
 */
export const ZOOM = 1.28;

/**
 * Vùng chết: người chơi còn trong khung này thì camera ĐỨNG YÊN — đi loanh quanh trong quầy không
 * làm cả cảnh trôi qua trôi lại, mà đó mới là thứ gây mệt mắt.
 *
 * 300 → 420 theo chiều ngang: người chơi đi từ thớt tới chỗ đưa hàng là 360 px màn hình, nên vùng
 * chết 300 px hẹp hơn quãng đó và mỗi lượt khách thành một cú lia máy đi rồi lia về.
 */
const DEADZONE_W = 420;
const DEADZONE_H = 170;

/** Độ trễ bám (0..1 mỗi frame). Thấp = trôi mượt, cao = bám sát. */
const LERP = 0.09;

/**
 * Camera nhìn thấp hơn chân người chơi chừng này px. Âm = nhìn CAO hơn chân.
 *
 * 46 → 4. Con số 46 cũ tính cho bản đồ 20×12 hồi khu làm việc chỉ sâu ba hàng. Bản đồ mới sâu hơn
 * hẳn, và đo thật thì mọi thứ ĐÁNG NHÌN nằm gọn trong dải màn hình y ≈ 75…302 — với khung nhìn cao
 * 450 px thì 46 chừa 170 px cho lòng đường trống trơn, còn 4 kéo dải ấy về đúng giữa khung.
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
