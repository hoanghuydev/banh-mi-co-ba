/**
 * Hai camera vì `setZoom` phóng cả object `scrollFactor(0)`: UI (scrollFactorX === 0) đi camera riêng không phóng;
 * con của Container không đặt cờ riêng vì Phaser bỏ qua cả Container theo quyết định của cha.
 */
import Phaser from "phaser";
import { GAME_W, GAME_H } from "../core/config";
import { MAX_SCALE, RENDER_SCALE, fitDesignFrame } from "../core/render";
import { fitScale, isTouch } from "../core/device";

/** Khung 16:9 thấy 613 × 345 px thế giới: gần người chơi, vẫn vừa hàng trạm với quầy đưa hàng; độ nét đến từ `RENDER_SCALE`. */
export const BASE_ZOOM = 1.67;
/** Pixel texture tối đa trên một pixel thế giới mà PC vẽ ra màn: dư hơn là phí bộ nhớ, thiếu là mờ. */
export const WORLD_SS_MAX = BASE_ZOOM * MAX_SCALE;
/** Trần phóng thêm trên cảm ứng, còn thấy đủ hàng trạm. */
const TOUCH_ZOOM_MAX = 2.2;
/** Pixel CSS thật tối thiểu cho một pixel thế giới ở vòng lò (R = 11 → khoảng 16 px). */
const TOUCH_WORLD_PX = 1.44;

/** Đổi theo thiết bị mỗi lần dựng camera; PC luôn `BASE_ZOOM`. */
export let ZOOM = BASE_ZOOM;

let touchMode = false;

export function applyDeviceZoom() {
  touchMode = isTouch();
  ZOOM = touchMode
    ? Math.min(TOUCH_ZOOM_MAX, Math.max(BASE_ZOOM, TOUCH_WORLD_PX / fitScale()))
    : BASE_ZOOM;
}

/** Bằng quãng thớt → chỗ đưa hàng (360 px) để mỗi lượt khách không thành một cú lia máy. */
const DEADZONE_W = 360;
const DEADZONE_H = 140;

/** 0..1 mỗi frame; thấp = trôi mượt, cao = bám sát. */
const LERP = 0.09;

/** Âm là nhìn cao hơn chân người chơi, để hàng vòng lò không chui xuống dưới nút HUD. */
const LOOK_DOWN = -36;
/** Cảm ứng nhìn cao hơn để hàng vòng lò không chui xuống dưới nút HUD. */
const LOOK_DOWN_TOUCH = -48;
/** Cảm ứng nhìn lệch trái để hàng khách ở mép trái nằm ngoài tầm ngón cái và vùng cắt của khung. */
const LOOK_LEFT_TOUCH = 60;

export class StallCamera {
  readonly ui: Phaser.Cameras.Scene2D.Camera;
  /** = `cameras.main`, vì `CustomerActor` đọc `worldView` của nó. */
  readonly world: Phaser.Cameras.Scene2D.Camera;

  private target: Phaser.GameObjects.Zone;
  private snapped = false;
  private pending: Phaser.GameObjects.GameObject[] = [];
  private onAdd: (o: Phaser.GameObjects.GameObject) => void;
  private onPreRender: () => void;

  constructor(private scene: Phaser.Scene, bounds: Phaser.Geom.Rectangle) {
    applyDeviceZoom();
    // Scene được dùng lại giữa hai ngày: không dọn thì mỗi `create()` chồng thêm một camera UI.
    this.world = scene.cameras.resetAll();
    // Viewport tính bằng pixel canvas thật; `fitDesignFrame` kéo về khung thiết kế 1024 × 576.
    this.ui = scene.cameras.add(0, 0, Math.round(GAME_W * RENDER_SCALE), Math.round(GAME_H * RENDER_SCALE));
    this.ui.transparent = true;
    fitDesignFrame(this.ui);

    this.world.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
    this.world.setZoom(ZOOM * RENDER_SCALE);
    const k = BASE_ZOOM / ZOOM;
    this.world.setDeadzone(DEADZONE_W * k, DEADZONE_H * k);

    // Bám mốc vô hình vì `Player` giữ sprite private.
    this.target = scene.add.zone(bounds.centerX, bounds.centerY, 1, 1);
    this.world.startFollow(this.target, true, LERP, LERP);

    this.onAdd = (o) => this.pending.push(o);
    this.onPreRender = () => this.flush();
    scene.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, this.onAdd);
    scene.events.on(Phaser.Scenes.Events.PRE_RENDER, this.onPreRender);

    // Nền và đạo cụ dựng trước camera nên `ADDED_TO_SCENE` không bắt được; thiếu dòng này cả quán vẽ trên hai camera.
    this.pending.push(...scene.children.list);
  }

  /** Toạ độ màn hình (đã qua `toScreen` + `footY`). */
  lookAt(sx: number, sy: number) {
    const y = sy + (touchMode ? LOOK_DOWN_TOUCH : LOOK_DOWN);
    const x = sx - (touchMode ? LOOK_LEFT_TOUCH : 0);
    this.target.setPosition(x, y);
    // Frame đầu nhảy thẳng tới, không trôi từ giữa bản đồ vào.
    if (!this.snapped) { this.snapped = true; this.world.centerOn(x, y); }
  }

  /** Chạy ở `PRE_RENDER` vì `setScrollFactor` và `container.add()` gọi sau lúc dựng object. */
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
