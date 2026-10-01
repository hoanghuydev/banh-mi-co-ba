import Phaser from "phaser";
import { fitDesignFrame } from "../core/render";
import { GAME_W, GAME_H } from "../core/config";
import type { GameContext } from "../core/context";
import { bus } from "../core/eventbus";
import { loadSettings } from "../core/save";
import { NPCS } from "../content/npcs";
import { buildBody } from "../art";
import { music } from "../audio/music";
import { EndingView } from "../ui/ending/EndingView";
import { computeEnding, endingMusicTrack } from "../sim/ending";

/**
 * Màn kết — P4-04. Chạy sau khoảng lặng 40 giây của ngày 40 (StallScene), thay cho cảnh tối.
 * Không chơi tiếp, không New Game+, không teaser (T4) — chỉ một nút "Về menu chính".
 */
export class EndingScene extends Phaser.Scene {
  private ctx!: GameContext;
  private view: EndingView | null = null;

  constructor() { super("ending"); }

  init(data: { ctx: GameContext }) {
    this.ctx = data.ctx;
  }

  create() {
    fitDesignFrame(this.cameras.main);          // canvas phóng to, toạ độ giữ nguyên — `core/render`
    const w = this.ctx.world;
    this.cameras.main.setBackgroundColor(0x141a20);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x141a20, 1);
    // MỘT track, không đổi theo số người có mặt (P4-04 §6 — có test)
    music.play(this, endingMusicTrack(computeEnding(w)), 2600);
    const s = loadSettings();
    this.view = new EndingView(w, {
      textScale: s.textScale, reducedMotion: s.reducedMotion,
      face: (id) => this.face(id),
      onMenu: () => {
        w.flags.seasonOver = true;
        bus.emit("ending:done", { dayIndex: w.progress.dayIndex });
      },
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.view?.close());
  }

  private face(id: string): string {
    const npc = NPCS.find((n) => n.id === id);
    if (npc && !this.textures.exists(`${id}_s`)) buildBody(this, id, npc.body);
    return this.textures.exists(`${id}_s`) ? this.textures.getBase64(`${id}_s`) : "";
  }
}
