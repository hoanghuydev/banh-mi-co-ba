import Phaser from "phaser";
import { GAME_W, GAME_H } from "../core/config";
import type { GameContext } from "../core/context";
import { bus } from "../core/eventbus";
import { loadSettings } from "../core/save";
import { PAL as P } from "../art/palette";
import { music } from "../audio/music";
import { MarketView } from "../ui/market/MarketView";

/**
 * Đi chợ sáng — P0-01 §2.3 / P3-01 §2.1. Chạy theo LƯỢT: đồng hồ KHÔNG trôi ở đây
 * (P0-02 §2.1). Áp lực thời gian là đặc sản của giờ cao điểm; đi chợ là lúc suy nghĩ.
 *
 * Bước rạng sáng (dọn hàng hư, thu tiền chỗ, trời hôm nay) đã chạy ở DayScene trước bản
 * chụp đầu ngày — "chơi lại ngày này" không thu tiền chỗ hai lần. Phần mua bán là
 * `MarketView` (lớp DOM, cùng họ với sổ tay).
 */
export class MarketScene extends Phaser.Scene {
  private ctx!: GameContext;
  /** Bấm nút và gõ Enter cùng lúc không được phát event hai lần (= nhảy cóc một ngày). */
  private finished = false;
  private view: MarketView | null = null;

  constructor() { super("market"); }

  init(data: { ctx: GameContext }) {
    this.ctx = data.ctx;
    this.finished = false;
  }

  create() {
    this.cameras.main.setBackgroundColor(P.skyLow);
    music.play(this, "menu", 800);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x1b2126, 0.35);
    this.view = new MarketView(this.game, this.ctx.world, {
      textScale: loadSettings().textScale,
      onDone: (r) => this.done(r.spent, r.bought.map((b) => ({ itemId: b.good, qty: b.units }))),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.view?.close());
  }

  private done(spent: number, bought: { itemId: string; qty: number }[]) {
    if (this.finished) return;
    this.finished = true;
    bus.emit("market:done", { spent, bought });
  }
}
