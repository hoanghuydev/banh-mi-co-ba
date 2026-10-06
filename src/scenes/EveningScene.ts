import Phaser from "phaser";
import { fitDesignFrame } from "../core/render";
import { GAME_W, GAME_H } from "../core/config";
import type { GameContext } from "../core/context";
import { bus } from "../core/eventbus";
import { loadSettings } from "../core/save";
import { NotebookView } from "../ui/notebook/NotebookView";
import { EveningView } from "../ui/evening/EveningView";
import { bedtime, eveningCounting, neighborTick } from "../sim/day";
import { music } from "../audio/music";
import { sfx } from "../audio/sfx";
import { settleNight } from "../sim/night";
import { eveningLines } from "../sim/story";

/**
 * Buổi tối — P0-01 §2.3. Đếm tiền, ghi sổ, một cảnh yên tĩnh. Chạy theo LƯỢT.
 *
 * Trước khi phát `evening:done`, đúng thứ tự: tick đồn thổi (P2-04), promote trí nhớ
 * (P2-03), ghi autosave. P0 mới có phần sổ sách; hai hệ kia cắm vào `settle()`.
 * Stream `gossip` chỉ được tiêu số ở ĐÚNG thời điểm này (P0-02 §2.3) — một hệ chỉ
 * rút RNG ở một mốc cố định thì số lần rút không phụ thuộc cách người chơi chơi.
 */
export class EveningScene extends Phaser.Scene {
  private ctx!: GameContext;
  /** Bấm nút và gõ Enter cùng lúc không được phát event hai lần (= nhảy cóc một ngày). */
  private finished = false;
  private book: NotebookView | null = null;
  private view: EveningView | null = null;

  constructor() { super("evening"); }

  init(data: { ctx: GameContext }) {
    this.ctx = data.ctx;
    this.finished = false;
  }

  create() {
    fitDesignFrame(this.cameras.main);          // canvas phóng to, toạ độ giữ nguyên — `core/render`
    const w = this.ctx.world;
    // Vào cảnh tối = ngày đã hết: đếm tiền (P3-06) → tick đồn thổi (P2-04) → trí nhớ + quan hệ
    // (P2-03) → trang sổ tay của cô Ba (P2-05). Mỗi bước chỉ chạy một lần mỗi ngày.
    eveningCounting(w);
    const neighbor = neighborTick(w);
    settleNight(w, bus);
    music.play(this, "toi", 2200);                     // cảnh tối, đếm tiền — P5-03 §6.3 `mus_toi`
    // Đêm Việt Nam thu thật + quạt — P5-03 §4.2 B `amb_toi_nha`. Rất khẽ: cảnh này
    // là chỗ duy nhất trong ngày KHÔNG có gì giục, nền to lên là mất đúng cái đó.
    sfx.loop(this, "amb_toi_nha", true, {}, 2500);
    sfx.loop(this, "sfx_quat_may", true, {}, 2500);
    this.cameras.main.setBackgroundColor(0x1d232b);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x141a20, 1);
    const s = loadSettings();
    // P4 — chuyện buổi tối: cô Ba, cô Mai, bé Su nói một câu (SK-14, SK-34…). Không ô thoại.
    // `hasLamp` đổi chủ: đèn ca tối đã bỏ, nên câu "19h40 anh Dũng ghé" treo vào CHUYỆN của anh
    // (`dungStory` — mình đã rót cho anh ly nước trà ở SK-15) chứ không treo vào một món đồ.
    const story = eveningLines(w.progress.dayIndex, w.story, { hasLamp: !!w.story?.flags?.dungStory });
    this.view = new EveningView(w, { textScale: s.textScale, lines: [...neighbor, ...story], onBook: () => this.openBook(), onSleep: () => this.settle() });
    this.input.keyboard?.on("keydown-TAB", (ev: KeyboardEvent) => { ev.preventDefault(); this.openBook(); });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.book?.close(); this.view?.close();
      sfx.stopLoops(900);
    });
    // P2-05 §4.1: sổ tay TỰ MỞ cuối ngày — trừ khi tắt công tắc #4
    if (s.notebookAuto ?? true) this.openBook();
  }

  private openBook() {
    if (this.book?.open || this.finished) return;
    // Mở sổ tay: tiếng lật trang + bút bi. Cảnh tối gần như im, nên hai tiếng này là
    // phần lớn những gì nghe được ở đây — và chúng đúng là hai việc cô Ba đang làm.
    sfx.play(this, "sfx_lat_so");
    sfx.play(this, "sfx_viet_but", { delay: 500, volume: 0.7 });
    const s = loadSettings();
    this.book = new NotebookView(this.game, this, this.ctx.world, {
      mode: "evening", textScale: s.textScale, showEvening: s.notebookAuto ?? true, onClose: () => { this.book = null; },
    });
  }

  private settle() {
    if (this.finished || this.book?.open) return;
    this.finished = true;
    // Đi ngủ: khoản bắt buộc quá ân hạn thành fail mềm (P3-06) — ghi lại để sáng mai nói ra
    const out = bedtime(this.ctx.world);
    this.ctx.world.econ.notices = out.defaulted.map((d) => d.loss);
    // Dòng sổ cái chốt lúc RỜI cảnh tối, không phải lúc vào: mọi khoản người chơi tiêu trong
    // đêm (góp hụi, tiền học, đồ nghề…) đều nằm ở `econ.today` và chỉ đủ mặt ở đây. Gọi lại
    // `eveningCounting` là an toàn — phần đếm tiền có cờ `today.counted`, chỉ dòng sổ được ghi đè.
    eveningCounting(this.ctx.world);
    this.view?.close();
    bus.emit("evening:done", { dayIndex: this.ctx.world.progress.dayIndex });
  }
}
