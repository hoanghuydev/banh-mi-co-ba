import Phaser from "phaser";
import { fitDesignFrame } from "../core/render";
import { loadSettings } from "../core/save";
import { INTRO } from "../content/phone/intro";
import { IntroPhone } from "../ui/phone/IntroPhone";
import { NamingView } from "../ui/phone/NamingView";
import { music } from "../audio/music";

/** Chơi mới: đọc tin nhắn → đặt tên quán → mở app Đánh giá → vào ngày 1. */
export class IntroScene extends Phaser.Scene {
  private phone: IntroPhone | null = null;
  private naming: NamingView | null = null;

  constructor() { super("intro"); }

  create() {
    fitDesignFrame(this.cameras.main);
    this.cameras.main.setBackgroundColor(0x1d232b);
    music.play("toi", 1200);
    const textScale = loadSettings().textScale;
    this.phone = new IntroPhone(this.game, {
      textScale,
      chapters: INTRO,
      onChaptersDone: (history) => {
        this.phone?.hide(true);
        this.naming = new NamingView(this.game, {
          textScale,
          onDone: (name) => this.phone?.showReview(name, () => {
            this.scene.start("day", { mode: "new", shopName: name, phone: history });
          }),
        });
      },
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.naming?.close();
      this.phone?.destroy();
    });
  }
}
