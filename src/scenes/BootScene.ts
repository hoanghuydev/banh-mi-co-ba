import Phaser from "phaser";
import { sfx } from "../audio/sfx";
import { BOOT_SFX, BOOT_SFX_BUS } from "../core/bootFiles";
import { preloadBackdrop } from "../ui/backdrop";
import { fadeOut, paintTick, setLoading, setStep } from "../ui/bootScreen";
import { HAND_FONT } from "../ui/theme";
import { warmUp } from "./warmup";

const FONT_WAIT_MS = 400;

/** Chỉ tải thứ menu cần rồi mở menu; scene này sống tiếp để loader của nó tải nền phần còn lại. */
export class BootScene extends Phaser.Scene {
  constructor() { super("boot"); }

  preload() {
    setLoading(0);
    this.load.on("progress", setLoading);
    preloadBackdrop(this);
    sfx.preload(this, [...sfx.idsOfBus(BOOT_SFX_BUS), ...BOOT_SFX]);
  }

  async create() {
    this.load.off("progress", setLoading);
    // Chờ ngắn để chữ có dấu khỏi nhảy layout; quá hạn thì vào luôn với phông dự phòng.
    setStep("đang mở menu…", 0.97);
    const fonts = document.fonts;
    if (fonts?.load) {
      const need = Promise.all([fonts.load('700 32px "Be Vietnam Pro"', "Bánh mì ễƯ"), fonts.load('800 32px "Be Vietnam Pro"', "Bánh mì ễƯ"), fonts.load(`32px ${HAND_FONT}`, "Bánh mì ặổữợ")]).catch(() => {});
      await Promise.race([need, new Promise((done) => setTimeout(done, FONT_WAIT_MS))]);
    }
    await paintTick();

    fadeOut();
    this.scene.launch("menu");
    void warmUp(this);
  }
}
