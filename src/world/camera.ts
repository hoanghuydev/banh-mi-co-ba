/**
 * Hai camera vì `setZoom` phóng cả object `scrollFactor(0)`: UI (scrollFactorX === 0) đi camera riêng không phóng;
 * con của Container không đặt cờ riêng vì Phaser bỏ qua cả Container theo quyết định của cha.
 */
import Phaser from "phaser";
import { GAME_W, GAME_H } from "../core/config";
import { MAX_SCALE, RENDER_SCALE, fitDesignFrame } from "../core/render";
import { fitScale, isTouch } from "../core/device";
import { footY } from "../art/canvas";
import { toScreen } from "./iso";
import { MAP, STATION_ROW_Y } from "./map";

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
const DEADZONE_H = 40;

/** 0..1 mỗi frame; thấp = trôi mượt, cao = bám sát. */
const LERP = 0.15;

/** Cảm ứng nhìn lệch trái để hàng khách ở mép trái nằm ngoài tầm ngón cái và vùng cắt của khung. */
const LOOK_LEFT_TOUCH = 60;
/** Nhìn trước theo hướng đi dọc màn hình, px thế giới. */
const LOOK_AHEAD = 40;
const LOOK_AHEAD_RATE = 3;
/** Px/giây dọc màn hình tối thiểu để tính là đang đi. */
const MOVE_MIN = 20;

/** Trong bếp (hàng ô ≤ `KITCHEN_IN`) khung nhìn đặt theo lò, ra tới `KITCHEN_OUT` thì về bám người chơi. */
const KITCHEN_IN = 3.2;
const KITCHEN_OUT = 4.4;
const ZONE_RATE = 2.5;
/** Px từ chân lò lên đỉnh vòng lò. */
const OVEN_RING_H = 124;
const OVEN_MARGIN = 6;

/** Neo cố định chứ không theo cột người chơi, vì hàng trạm dốc: đứng ở bồn rửa thì lò vẫn phải thấy. */
const OVEN_TOP = (() => {
  const tx = MAP[STATION_ROW_Y].indexOf("O");
  return footY(toScreen(tx + 0.5, STATION_ROW_Y + 0.5).sy) - OVEN_RING_H;
})();

export class StallCamera {
  readonly ui: Phaser.Cameras.Scene2D.Camera;
  /** = `cameras.main`, vì `CustomerActor` đọc `worldView` của nó. */
  readonly world: Phaser.Cameras.Scene2D.Camera;

  private target: Phaser.GameObjects.Zone;
  private snapped = false;
  private lastY = 0;
  private ahead = 0;
  private kitchen = 0;
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

  /** `wx`, `wy` là ô thế giới của người chơi, `topInset` đáy dải HUD trên cùng theo px thiết kế, `dt` giây thật. */
  lookAt(wx: number, wy: number, topInset: number, dt: number) {
    const p = toScreen(wx, wy);
    const sx = p.sx, sy = footY(p.sy);
    const x = sx - (touchMode ? LOOK_LEFT_TOUCH : 0);
    const inKitchen = wy <= KITCHEN_IN ? 1 : wy >= KITCHEN_OUT ? 0 : (KITCHEN_OUT - wy) / (KITCHEN_OUT - KITCHEN_IN);
    if (!this.snapped) {
      this.kitchen = inKitchen;
    } else if (dt > 0) {
      const v = (sy - this.lastY) / dt;
      if (Math.abs(v) > MOVE_MIN) this.ahead += (Math.sign(v) * LOOK_AHEAD - this.ahead) * (1 - Math.exp(-LOOK_AHEAD_RATE * dt));
      this.kitchen += (inKitchen - this.kitchen) * (1 - Math.exp(-ZONE_RATE * dt));
    }
    this.lastY = sy;

    const viewH = GAME_H / ZOOM;
    const dzHalf = (DEADZONE_H * BASE_ZOOM / ZOOM) / 2;
    const kitchenY = OVEN_TOP - OVEN_MARGIN - topInset / ZOOM + viewH / 2 - dzHalf;
    const y = Phaser.Math.Linear(sy + this.ahead, kitchenY, this.kitchen);
    this.target.setPosition(x, y);
    // Frame đầu nhảy thẳng tới, không trôi từ giữa bản đồ vào.
    if (!this.snapped) { this.snapped = true; this.world.centerOn(x, y); }
  }

  private homeZoom = 0;
  private held = false;

  /** Tạm rời người chơi, lia tới điểm màn hình (`x`, `y`) và phóng `zoomMul` lần; `ms` 0 là cắt thẳng. */
  focus(x: number, y: number, zoomMul: number, ms: number): Promise<void> {
    const cam = this.world;
    if (!this.held) { this.held = true; this.homeZoom = cam.zoom; cam.stopFollow(); }
    return this.glide(x, y, this.homeZoom * zoomMul, ms);
  }

  /** Lia về người chơi rồi bám lại như cũ. */
  async release(ms: number) {
    const cam = this.world;
    if (!this.held) return;
    await this.glide(this.target.x, this.target.y, this.homeZoom, ms);
    this.held = false;
    cam.startFollow(this.target, false, cam.lerp.x, cam.lerp.y);
  }

  private glide(x: number, y: number, zoom: number, ms: number) {
    const cam = this.world;
    if (ms <= 0) { cam.setZoom(zoom).centerOn(x, y); return Promise.resolve(); }
    cam.zoomTo(zoom, ms, "Sine.easeInOut", true);
    return new Promise<void>((done) => cam.pan(x, y, ms, "Sine.easeInOut", true, (_c, t) => { if (t === 1) done(); }));
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
