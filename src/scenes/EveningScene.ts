import Phaser from "phaser";
import { fitDesignFrame } from "../core/render";
import { GAME_W, GAME_H } from "../core/config";
import type { GameContext } from "../core/context";
import { bus } from "../core/eventbus";
import { loadSettings } from "../core/save";
import { EveningView } from "../ui/evening/EveningView";
import { eveningCounting, neighborTick } from "../sim/day";
import { music } from "../audio/music";
import { sfx } from "../audio/sfx";
import { phoneTick, totalUnread } from "../sim/phone";
import { unseen } from "../sim/reviews";
import { PhoneView, type Route } from "../ui/phone/PhoneView";
import { showBanner } from "../ui/phone/banner";

export class EveningScene extends Phaser.Scene {
  private ctx!: GameContext;
  /** Chặn bấm nút và Enter cùng lúc phát event hai lần (= nhảy cóc một ngày). */
  private finished = false;
  private view: EveningView | null = null;
  private phone: PhoneView | null = null;
  private killBanner: () => void = () => {};

  constructor() { super("evening"); }

  init(data: { ctx: GameContext }) {
    this.ctx = data.ctx;
    this.finished = false;
  }

  create() {
    fitDesignFrame(this.cameras.main);
    const w = this.ctx.world;
    // Mỗi bước chỉ chạy một lần mỗi ngày.
    eveningCounting(w);
    const neighbor = neighborTick(w);
    const incoming = phoneTick(w, true);
    this.ctx.save.request("EVENT");
    music.play("toi", 2200);
    sfx.loop(this, "amb_toi_nha", true, {}, 2500);
    sfx.loop(this, "sfx_quat_may", true, {}, 2500);
    this.cameras.main.setBackgroundColor(0x1d232b);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x141a20, 1);
    const s = loadSettings();
    this.view = new EveningView(w, {
      textScale: s.textScale, lines: neighbor,
      unread: () => totalUnread(w.phone) + unseen(w), onPhone: () => this.openPhone(),
      onSleep: () => this.settle(),
    });
    this.input.keyboard?.on("keydown-TAB", (ev: KeyboardEvent) => { ev.preventDefault(); this.openPhone(); });
    this.killBanner = showBanner(incoming, (id) => this.openPhone({ app: "chat", id }), s.textScale);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.killBanner();
      this.phone?.close();
      this.view?.close();
      sfx.stopLoops(900);
    });
  }

  private openPhone(route?: Route) {
    if (this.finished || this.phone?.open) return;
    this.killBanner();
    this.phone = new PhoneView(this.game, this.ctx.world, {
      textScale: loadSettings().textScale,
      host: {
        minutes: () => this.ctx.clock.minutes,
        beforeOpen: () => false,
        onSave: () => this.ctx.save.request("EVENT"),
      },
      route,
      onClose: () => { this.phone = null; this.view?.setUnread(); },
    });
  }

  private settle() {
    if (this.finished) return;
    this.finished = true;
    // Chốt lại lúc rời cảnh để tính cả đồ nghề mua trong đêm; gọi lại an toàn nhờ `today.counted`.
    eveningCounting(this.ctx.world);
    this.view?.close();
    bus.emit("evening:done", { dayIndex: this.ctx.world.progress.dayIndex });
  }
}
