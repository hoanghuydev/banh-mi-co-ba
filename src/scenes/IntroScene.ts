import Phaser from "phaser";
import { fitDesignFrame } from "../core/render";
import { loadSettings } from "../core/save";
import { textureFor } from "../art";
import { coBaFace } from "../art/faces";
import { faceCrop } from "../art/photo";
import { drawAlleyBackdrop, tintPreDawn } from "../ui/backdrop";
import { IntroView } from "../ui/intro/IntroView";
import { music } from "../audio/music";
import { sfx } from "../audio/sfx";
import type { IntroSpeaker } from "../content/intro";

/**
 * MÀN MỞ ĐẦU — 4 giờ rưỡi sáng ngày 1, cô Ba giao cái xe rồi hỏi tên con.
 *
 * Nằm GIỮA sảnh và `DayScene`, không nằm trong `DayScene`: ván chơi chưa tồn tại lúc này.
 * `newGame()` nhận tên người chơi ngay lúc dựng `SaveFile` và sau đó không có đường nào sửa
 * (`normalize` đọc lại chính nó), nên cái tên phải có mặt TRƯỚC khi ngày 1 bắt đầu.
 *
 * Scene này không vẽ thoại: nó dựng phông, lo nhạc, cắt hai tấm chân dung, rồi giao hết cho
 * `ui/intro/IntroView` — chỗ duy nhất có `<input>` thật để gõ tên tiếng Việt bằng bộ gõ.
 */
export class IntroScene extends Phaser.Scene {
  private view: IntroView | null = null;

  constructor() { super("intro"); }

  create() {
    fitDesignFrame(this.cameras.main);
    drawAlleyBackdrop(this);
    tintPreDawn(this);

    // `to_mo` là track của khung giờ tờ mờ sáng (P5-03 §6.3) — đúng cái giờ cảnh này diễn ra,
    // và nó chạy tiếp vô buổi chợ nên đi từ đây sang ngày 1 không đứt nhạc.
    music.play(this, "to_mo", 1400);
    // Hẻm lúc chưa ai dậy: nền đêm + tiếng quạt, rất khẽ. `sfx.loop` tự tải file nếu
    // chưa có (`lazyLoad`), nên không cần `preload` chặn màn này lại.
    sfx.loop(this, "amb_toi_nha", true, {}, 2200);

    const s = loadSettings();
    this.view = new IntroView({
      textScale: s.textScale,
      reducedMotion: s.reducedMotion,
      face: { CO_BA: this.face("CO_BA"), PLAYER: this.face("PLAYER") },
      sfx: (id) => { sfx.play(this, id); },
      onDone: (name) => this.scene.start("day", { mode: "new", name }),
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.view?.close();
      sfx.stopLoops(900);
    });
  }

  /**
   * Chân dung = ĐẦU cắt ra từ chính cái texture đứng trong quán, qua `faceCrop` — cùng một
   * phép cắt với trang sổ tay (`ui/notebook`). Nhờ vậy mặt cô Ba ở màn mở đầu và mặt khách
   * trong sổ là cùng một kiểu ảnh, không phải hai hệ chân dung sống song song.
   *
   * Mặt cô Ba đi qua `art/faces` vì bong bóng dẫn bữa đầu cũng xài đúng tấm đó.
   */
  private face(who: IntroSpeaker): string {
    if (who === "CO_BA") return coBaFace(this);
    const key = textureFor("s").key;
    return this.textures.exists(key) ? faceCrop(this, key) : "";
  }
}
