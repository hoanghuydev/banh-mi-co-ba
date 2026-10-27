/**
 * GameContext — P0-01 §3. Sống trong `DayScene` (scene thường trực), KHÔNG trong
 * scene con bị `stop()`: nếu context sống trong scene bị dừng thì mỗi lần chuyển cảnh
 * phải serialize lại toàn bộ, và chỉ cần quên một field là seed lệch — cơ chế chống
 * save-scum (§8e) hỏng âm thầm.
 */
import { Bus, bus as globalBus } from "./eventbus";
import { Clock } from "./clock";
import { RngHub } from "./rng";
import { SaveService, type SaveFile } from "./save";
import { platform as defaultPlatform, type Platform } from "./platform";
import type { SceneKey } from "./types";

export class GameContext {
  readonly clock: Clock;
  readonly rng = new RngHub();
  readonly save: SaveService;

  constructor(
    /** Thế giới mutable — tiền, 12 NPC, bag thoại, sổ sách. Cũng chính là thứ được ghi xuống. */
    public world: SaveFile,
    readonly bus: Bus = globalBus,
    platform: Platform = defaultPlatform,
  ) {
    this.clock = new Clock(bus);
    this.save = new SaveService(bus, () => this.snapshot(), platform);
  }

  get saveId() { return this.world.saveId; }
  get day() { return this.world.progress.dayIndex; }

  /** Đồng bộ phần state nằm ngoài `world` (đồng hồ, bộ đếm RNG) vào `world`. */
  sync() {
    const p = this.world.progress;
    p.gameMinutes = this.clock.minutes;
    p.band = this.clock.band;
    this.world.rng.counters = this.rng.toJSON();
  }

  /** Chụp thế giới thành object thuần, độc lập — sửa world sau đó không ảnh hưởng bản chụp. */
  snapshot(): SaveFile {
    this.sync();
    return structuredClone(this.world);
  }

  setScene(scene: SceneKey) {
    this.save.capture();
    const from = this.world.progress.scene;
    this.world.progress.scene = scene;
    if (from !== scene) this.bus.emit("scene:transition", { from, to: scene });
  }
}
