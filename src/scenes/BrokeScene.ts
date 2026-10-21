import Phaser from "phaser";
import { fitDesignFrame } from "../core/render";
import { GAME_W, GAME_H } from "../core/config";
import type { GameContext } from "../core/context";
import { bus } from "../core/eventbus";
import { loadSettings } from "../core/save";
import { music } from "../audio/music";
import { sfx } from "../audio/sfx";
import { BrokeView } from "../ui/broke/BrokeView";

/** Màn phá sản — thay cho việc sang ngày mới khi `sim/broke.markBroke` bật cờ. Lối ra do `DayScene` cầm. */
export class BrokeScene extends Phaser.Scene {
  private ctx!: GameContext;
  private view: BrokeView | null = null;

  constructor() { super("broke"); }

  init(data: { ctx: GameContext }) {
    this.ctx = data.ctx;
  }

  create() {
    fitDesignFrame(this.cameras.main);
    const w = this.ctx.world;
    this.cameras.main.setBackgroundColor(0x121820);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x121820, 1);
    music.play(this, "toi", 2200);
    sfx.loop(this, "amb_toi_nha", true, {}, 2500);
    this.view = new BrokeView(w, {
      textScale: loadSettings().textScale,
      onMenu: () => bus.emit("broke:done", { dayIndex: w.progress.dayIndex }),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.view?.close(); sfx.stopLoops(700); });
  }
}
