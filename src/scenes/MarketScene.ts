import Phaser from "phaser";
import { fitDesignFrame } from "../core/render";
import { GAME_W, GAME_H } from "../core/config";
import type { GameContext } from "../core/context";
import { bus } from "../core/eventbus";
import { loadSettings } from "../core/save";
import { PAL as P } from "../art/palette";
import { music } from "../audio/music";
import { sfx } from "../audio/sfx";
import { MarketView } from "../ui/market/MarketView";

/** Chạy theo lượt: đồng hồ không trôi. */
export class MarketScene extends Phaser.Scene {
  private ctx!: GameContext;
  /** Chặn bấm nút và Enter cùng lúc phát event hai lần (= nhảy cóc một ngày). */
  private finished = false;
  private view: MarketView | null = null;

  constructor() { super("market"); }

  init(data: { ctx: GameContext }) {
    this.ctx = data.ctx;
    this.finished = false;
  }

  create() {
    fitDesignFrame(this.cameras.main);
    this.cameras.main.setBackgroundColor(P.skyLow);
    music.play(this, "menu", 800);
    // Nạp lười: fade 2 giây che thời gian tải.
    sfx.loop(this, "amb_cho", true, {}, 2000);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x1b2126, 0.35);
    const st = loadSettings();
    this.view = new MarketView(this.game, this.ctx.world, {
      textScale: st.textScale,
      showTotal: st.marketRunningTotal,
      onDone: (r) => this.done(r.spent, r.bought.map((b) => ({ itemId: b.good, qty: b.units }))),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.view?.close();
      sfx.stopLoops(700);
    });
  }

  private done(spent: number, bought: { itemId: string; qty: number }[]) {
    if (this.finished) return;
    this.finished = true;
    bus.emit("market:done", { spent, bought });
  }
}
