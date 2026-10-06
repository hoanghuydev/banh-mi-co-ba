import Phaser from "phaser";
import { fitDesignFrame } from "../core/render";
import { GAME_W, GAME_H } from "../core/config";
import type { GameContext } from "../core/context";
import { bus } from "../core/eventbus";
import { loadSettings } from "../core/save";
import { music } from "../audio/music";
import { sfx } from "../audio/sfx";
import { BrokeView } from "../ui/broke/BrokeView";

/**
 * Màn dừng vì hết vốn — thay cho việc sang ngày mới khi `sim/broke.markBroke` bật cờ.
 *
 * Cùng khuôn với `EndingScene`: một lớp DOM phủ lên nền tối, không chơi được gì, lối ra
 * do `DayScene` cầm. Khác một chỗ: ở đây CÓ đường lùi (`broke:replay` → bản chụp đầu
 * ngày), vì cú vỡ này tới từ một quyết định tiêu tiền chứ không phải từ hết mùa.
 */
export class BrokeScene extends Phaser.Scene {
  private ctx!: GameContext;
  private view: BrokeView | null = null;
  private canReplay = false;

  constructor() { super("broke"); }

  init(data: { ctx: GameContext; canReplay?: boolean }) {
    this.ctx = data.ctx;
    this.canReplay = !!data.canReplay;
  }

  create() {
    fitDesignFrame(this.cameras.main);
    const w = this.ctx.world;
    this.cameras.main.setBackgroundColor(0x121820);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x121820, 1);
    // cùng track với cảnh tối: đây vẫn là một buổi tối, chỉ là buổi tối cuối
    music.play(this, "toi", 2200);
    sfx.loop(this, "amb_toi_nha", true, {}, 2500);
    const s = loadSettings();
    this.view = new BrokeView(w, {
      textScale: s.textScale, reducedMotion: s.reducedMotion, canReplay: this.canReplay,
      onReplay: () => bus.emit("broke:replay", { dayIndex: w.progress.dayIndex }),
      onMenu: () => bus.emit("broke:done", { dayIndex: w.progress.dayIndex }),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.view?.close(); sfx.stopLoops(700); });
  }
}
