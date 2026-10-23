import Phaser from "phaser";
import { fitDesignFrame } from "../core/render";
import { GAME_W, GAME_H } from "../core/config";
import type { GameContext } from "../core/context";
import { bus } from "../core/eventbus";
import { loadSettings } from "../core/save";
import { music } from "../audio/music";
import { WinView } from "../ui/win/WinView";

/** Màn thắng — thay cho việc sang ngày mới khi `sim/win.markWin` bật cờ. Lối ra do `DayScene` cầm. */
export class WinScene extends Phaser.Scene {
  private ctx!: GameContext;
  private view: WinView | null = null;

  constructor() { super("win"); }

  init(data: { ctx: GameContext }) {
    this.ctx = data.ctx;
  }

  create() {
    fitDesignFrame(this.cameras.main);
    const w = this.ctx.world;
    this.cameras.main.setBackgroundColor(0x1a1510);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x1a1510, 1);
    music.play(this, "toi", 2200);
    this.view = new WinView(w, {
      textScale: loadSettings().textScale,
      onMenu: () => bus.emit("win:done", { dayIndex: w.progress.dayIndex }),
      onRestart: () => bus.emit("win:done", { dayIndex: w.progress.dayIndex, restart: true }),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.view?.close());
  }
}
