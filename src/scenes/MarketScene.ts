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
import { coBaFace } from "../art/faces";

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
    fitDesignFrame(this.cameras.main);          // canvas phóng to, toạ độ giữ nguyên — `core/render`
    this.cameras.main.setBackgroundColor(P.skyLow);
    music.play(this, "menu", 800);
    /*
     * Nền chợ — bản thu THẬT ở chợ Bến Thành (xem `PROVENANCE.csv`). Nạp lười: nó
     * fade vào trong 2 giây nên vài trăm mili-giây chờ tải không ai nghe ra, mà
     * nhét nó vào `preload` thì màn đi chợ đứng chờ thêm 200 KB mới mở ra được.
     */
    sfx.loop(this, "amb_cho", true, {}, 2000);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x1b2126, 0.35);
    const st = loadSettings();
    this.view = new MarketView(this.game, this.ctx.world, {
      textScale: st.textScale,
      showTotal: st.marketRunningTotal,
      // Mặt cô Ba cho bong bóng dẫn bữa đầu. Nướng ở đây vì `MarketView` là lớp DOM, không
      // cầm scene — mà `faceCrop` thì cần texture của scene.
      face: coBaFace(this),
      onDone: (r) => this.done(r.spent, r.bought.map((b) => ({ itemId: b.good, qty: b.units }))),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.view?.close();
      sfx.stopLoops(700);                 // tiếng chợ không được theo vào quán
    });
  }

  private done(spent: number, bought: { itemId: string; qty: number }[]) {
    if (this.finished) return;
    this.finished = true;
    bus.emit("market:done", { spent, bought });
  }
}
