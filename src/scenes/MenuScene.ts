import Phaser from "phaser";
import { Stack, button, buttonHeight, label, panel, toggle, UI } from "../ui/theme";
import { PAL as P } from "../art/palette";
import { COUNTER, textureFor } from "../art";
import {
  SaveService, SaveTooNewError, loadSettings, saveSettings, type SaveFile, type Settings,
} from "../core/save";
import { bus } from "../core/eventbus";
import { PLAYTEST } from "../core/flags";
import { telemetry } from "../core/session";
import { GAME_W, GAME_H } from "../core/config";
import { CUES, MUSIC_STEPS, music } from "../audio/music";

type Page = "main" | "settings" | "about" | "telemetry";

/**
 * Sảnh menu. Mọi trang dựng lại từ đầu trong một container -> chuyển trang là
 * xoá container cũ, không phải quản lý ẩn/hiện chục object.
 */
export class MenuScene extends Phaser.Scene {
  private page!: Phaser.GameObjects.Container;

  constructor() { super("menu"); }

  create() {
    this.drawBackdrop();
    this.show("main");
    // Trình duyệt chỉ cho phát tiếng sau cú chạm/gõ phím đầu tiên; Phaser xếp
    // hàng sẵn rồi tự phát lại, nên gọi thẳng ở đây là đủ.
    music.play(this, "menu");
  }

  private show(page: Page) {
    this.page?.destroy(true);
    this.input.off("wheel");
    this.input.off("pointermove");
    this.page = this.add.container(0, 0);
    ({
      main: () => this.pageMain(), settings: () => this.pageSettings(),
      about: () => this.pageAbout(), telemetry: () => this.pageTelemetryAsk(),
    })[page]();
    this.page.setAlpha(0);
    this.tweens.add({ targets: this.page, alpha: 1, duration: 160 });
  }

  // ------------------------------------------------------------------ backdrop

  /** Nền: trời xanh xám + vệt nắng trắng + bóng hẻm. CANON §14, không dùng vàng nghệ. */
  private drawBackdrop() {
    const g = this.add.graphics();
    for (let i = 0; i < GAME_H; i += 4) {
      const t = i / GAME_H;
      g.fillStyle(Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(P.skyTop),
        Phaser.Display.Color.IntegerToColor(P.skyLow), 100, t * 100,
      ).color as unknown as number, 1);
      g.fillRect(0, i, GAME_W, 5);
    }

    g.fillStyle(P.sun, 0.1);                       // nắng chém chéo qua hẻm
    g.fillPoints([
      { x: GAME_W * 0.52, y: 0 }, { x: GAME_W * 0.78, y: 0 },
      { x: GAME_W * 0.46, y: GAME_H }, { x: GAME_W * 0.2, y: GAME_H },
    ], true);

    g.fillStyle(0x2f3a41, 0.32);                   // hai dãy nhà hai bên
    g.fillPoints([{ x: 0, y: 0 }, { x: 190, y: 0 }, { x: 96, y: GAME_H }, { x: 0, y: GAME_H }], true);
    g.fillPoints([
      { x: GAME_W, y: 0 }, { x: GAME_W - 210, y: 0 },
      { x: GAME_W - 110, y: GAME_H }, { x: GAME_W, y: GAME_H },
    ], true);

    g.fillStyle(0x1b2126, 0.25);                   // mặt đường
    g.fillRect(0, GAME_H - 96, GAME_W, 96);

    // cái quầy + người bán đứng lùi ở góc, để sảnh có "nơi chốn" chứ không trống trơn.
    // Tên texture lấy từ hằng số của `art/` để menu không bao giờ lệch khi art đổi tên.
    this.add.image(GAME_W - 262, GAME_H - 26, COUNTER.case(0)).setOrigin(0.5, 1).setScale(2.0).setAlpha(0.5);
    this.add.image(GAME_W - 190, GAME_H + 4, COUNTER.end).setOrigin(0.5, 1).setScale(2.0).setAlpha(0.5);
    this.add.image(GAME_W - 292, GAME_H - 84, textureFor("s").key).setOrigin(0.5, 1).setScale(1.9).setAlpha(0.5);
  }

  // ---------------------------------------------------------------- trang chính

  /** Đọc save chỉ để hiện "Chơi tiếp" — không dựng context, không đụng RNG. */
  private peekSave(): { save: SaveFile | null; tooNew: boolean } {
    try {
      return { save: new SaveService(bus, () => { throw new Error("peek"); }).load(), tooNew: false };
    } catch (e) {
      return { save: null, tooNew: e instanceof SaveTooNewError };
    }
  }

  private pageMain() {
    const { save, tooNew } = this.peekSave();
    const over = save?.flags.seasonOver === true;

    this.page.add(panel(this, GAME_W / 2, 152, 560, 168, 0xf7f4ec, 0.94));
    this.page.add(label(this, GAME_W / 2, 118, "Bánh Mì Cô Ba", 40, UI.ink, "700"));
    this.page.add(label(this, GAME_W / 2, 164, "Món ăn chính là lựa chọn hội thoại.", 15, UI.muted, "400"));
    this.page.add(label(this, GAME_W / 2, 196, "a game about being watched while you work", 12, "#98a2ab", "400"));

    const x = GAME_W / 2;
    this.page.add(button(this, x, 288, "Bắt đầu mùa mới", () => this.startNew(), {
      primary: true, width: 300, hint: "một mùa 40 ngày, có điểm kết",
    }));

    // P0-02 §2.7 luật 1: save của phiên bản MỚI hơn thì từ chối, nói rõ, không đoán mò.
    this.page.add(button(this, x, 352,
      tooNew ? "Bản lưu của phiên bản mới hơn" : over ? "Mùa đã kết" : save ? "Chơi tiếp" : "Chưa có ván nào",
      () => this.continueRun(), {
        width: 300, disabled: !save || over,
        hint: tooNew ? "cập nhật game để chơi tiếp"
          : save ? `ngày ${save.progress.dayIndex} · ${save.money.cash.toLocaleString("vi-VN")}₫` : undefined,
      }));

    this.page.add(button(this, x, 410, "Cài đặt", () => this.show("settings"), { width: 300 }));
    this.page.add(button(this, x, 462, "Giới thiệu", () => this.show("about"), { width: 300 }));

    // dòng chân trang nằm trên dải mặt đường tối -> phải dùng màu sáng mới đọc được
    this.page.add(label(this, GAME_W / 2, GAME_H - 26,
      `bản dựng thử v0.2${PLAYTEST ? " · chơi thử" : ""} · chợ sáng → bán → buổi tối`, 11, "#cfdae0", "400"));
  }

  private startNew() {
    // Bản bán ra: hỏi rõ MỘT lần về telemetry trước ván đầu tiên (P0-03 §4).
    if (loadSettings().telemetry === null) { this.show("telemetry"); return; }
    this.scene.start("day", { mode: "new" });
  }

  private continueRun() {
    if (this.peekSave().save) this.scene.start("day", { mode: "continue" });
  }

  private setTelemetry(on: boolean) {
    const s = loadSettings();
    s.telemetry = on;
    saveSettings(s);
    telemetry.enabled = on;
  }

  /** P0-03 §2.1: telemetry CỤC BỘ — nói rõ ghi gì, và rằng nó không gửi đi đâu. */
  private pageTelemetryAsk() {
    this.page.add(panel(this, GAME_W / 2, GAME_H / 2, 560, 300, 0xf7f4ec, 0.97));
    this.page.add(label(this, GAME_W / 2, GAME_H / 2 - 104, "Ghi lại cách con chơi?", 22, UI.ink, "700"));
    this.page.add(label(this, GAME_W / 2, GAME_H / 2 - 34,
      "Game có thể ghi lại vài con số — một ngày dài bao lâu, khách nào bỏ đi —\n"
      + "vào máy của con. Không gửi đi đâu cả. Con muốn gửi cho người làm game\n"
      + "thì vào Cài đặt, bấm \"Xuất số liệu\". Đổi ý lúc nào cũng được.", 13, UI.muted, "400"));
    this.page.add(button(this, GAME_W / 2 - 124, GAME_H / 2 + 80, "Được, cứ ghi", () => {
      this.setTelemetry(true); this.startNew();
    }, { width: 220, primary: true }));
    this.page.add(button(this, GAME_W / 2 + 124, GAME_H / 2 + 80, "Thôi, khỏi", () => {
      this.setTelemetry(false); this.startNew();
    }, { width: 220 }));
  }

  // ------------------------------------------------------------------ cài đặt

  /**
   * CANON §15: trợ năng là bắt buộc, không phải "nice to have".
   * Ở bản dựng thử này ba công tắc đều CÓ TÁC DỤNG THẬT, không phải nút giả.
   */
  private pageSettings() {
    const s = loadSettings();
    const put = (patch: Partial<Settings>) => {
      Object.assign(s, patch);
      saveSettings(s);
    };

    const bg = this.add.graphics();
    this.page.add(bg);
    const st = new Stack(92, 10);
    const x = GAME_W / 2;
    this.page.add(st.place(label(this, x, 0, "Cài đặt", 26, UI.ink, "700"), 16));

    const sizes: Settings["textScale"][] = [1, 1.25, 1.5, 2];
    const tg = (name: string, get: () => string, fn: () => void) =>
      this.page.add(st.button(toggle(this, x, 0, name, get, fn, 340)));

    tg("Cỡ chữ", () => `${Math.round(s.textScale * 100)}%`,
      () => { put({ textScale: sizes[(sizes.indexOf(s.textScale) + 1) % sizes.length] }); this.show("settings"); });
    tg("Giảm chuyển động", () => (s.reducedMotion ? "bật" : "tắt"), () => put({ reducedMotion: !s.reducedMotion }));
    tg("Không giới hạn thời gian", () => (s.noTimePressure ? "bật" : "tắt"), () => put({ noTimePressure: !s.noTimePressure }));
    // CANON §15 công tắc số 1 (P2-04 RB6): tắt thì tin vẫn lan, chỉ là luôn đúng
    tg("Khách nhớ nhầm / đồn sai", () => (s.allowFalseMemory ? "bật" : "tắt"), () => put({ allowFalseMemory: !s.allowFalseMemory }));
    // CANON §15 công tắc #4 (P2-05 §4.4): tắt thì nhật ký vẫn ghi, vẫn mở bằng Tab
    tg("Sổ tay cô Ba cuối ngày", () => (s.notebookAuto ? "bật" : "tắt"), () => put({ notebookAuto: !s.notebookAuto }));
    // CANON §15.4: mỗi kênh âm thanh một công tắc riêng. Mới có kênh Nhạc —
    // bốn kênh còn lại thêm vào đây khi có âm thanh cho chúng.
    tg("Nhạc nền", () => (s.musicVolume === 0 ? "tắt" : `${s.musicVolume}%`), () => {
      // giá trị lạ (save cũ, sửa tay localStorage) -> rơi về nấc đầu, không kẹt
      const at = (MUSIC_STEPS as readonly number[]).indexOf(s.musicVolume);
      put({ musicVolume: MUSIC_STEPS[(Math.max(at, -1) + 1) % MUSIC_STEPS.length] });
      music.applySettings(s);
      music.play(this, "menu", 400);          // kéo từ 0 lên thì phải mồi lại
    });
    // P0-03 §2.1: cục bộ, có công tắc, KHÔNG gửi đi đâu.
    tg("Ghi số liệu chơi thử", () => (s.telemetry ? "bật" : "tắt"),
      () => { put({ telemetry: !s.telemetry }); telemetry.enabled = !!s.telemetry; });

    this.page.add(st.place(label(this, x, 0,
      "Khách vẫn bỏ đi vì bạn làm sai — nhưng không bao giờ vì bạn chậm.\n"
      + "Số liệu chỉ nằm trong máy này; muốn gửi cho người làm game thì bấm xuất.", 11, UI.muted, "400")
      .setWordWrapWidth(470).setAlign("center"), 14));

    const row = st.y + buttonHeight() / 2;
    this.page.add(button(this, x - 118, row, "Xuất số liệu", () => telemetry.download(), { width: 210 }));
    this.page.add(button(this, x + 118, row, "Quay lại", () => this.show("main"), { width: 210 }));
    st.skip(buttonHeight() + 20);

    // nền khung cao đúng bằng nội dung
    bg.fillStyle(0xf7f4ec, 0.96).fillRoundedRect(x - 270, 70, 540, st.y - 70, 16);
    // Chữ to (150–200%) thì trang dài hơn màn hình: cuộn bằng con lăn / kéo, không cắt chữ.
    this.enableScroll(st.y + 10);
  }

  /** Cuộn trang hiện tại theo chiều dọc nếu nó cao hơn khung hình. */
  private enableScroll(contentBottom: number) {
    const extra = Math.max(0, contentBottom - GAME_H);
    if (!extra) return;
    const page = this.page;
    const clamp = (y: number) => Math.max(-extra, Math.min(0, y));
    this.input.on("wheel", (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      if (page.active) page.y = clamp(page.y - dy * 0.6);
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (page.active && p.isDown) page.y = clamp(page.y + (p.y - p.prevPosition.y));
    });
  }

  // --------------------------------------------------------------- giới thiệu

  private pageAbout() {
    this.page.add(panel(this, GAME_W / 2, GAME_H / 2, 620, 400, 0xf7f4ec, 0.96));
    this.page.add(label(this, GAME_W / 2, 124, "Giới thiệu", 26, UI.ink, "700"));

    const lines = [
      "Bạn bán bánh mì ở đầu hẻm Sài Gòn.",
      "Khách đứng cách bạn nửa mét và nhìn thấy mọi thứ bạn làm.",
      "",
      "Bản dựng thử này có: vòng một ngày (chợ sáng → bán → buổi tối),",
      "khách nhìn thấy bạn làm, đơn \"như mọi bữa\", ly trà đá.",
      "Trí nhớ dài hạn và tin đồn nằm ở giai đoạn sau.",
    ];
    this.page.add(label(this, GAME_W / 2, 210, lines.join("\n"), 14, UI.ink, "400"));

    this.page.add(label(this, GAME_W / 2, 330,
      "Điều khiển:  WASD / phím mũi tên để đi  ·  E hoặc Space để làm việc\n"
      + "Q để bỏ thứ đang cầm  ·  Esc để tạm dừng", 13, UI.muted, "400"));

    // Ghi công nhạc — CC BY 4.0 bắt buộc nêu tên tác giả TRONG game, không chỉ
    // trong file README. Danh sách đầy đủ ở `public/audio/PROVENANCE.csv`.
    const tracks = [...new Set(Object.values(CUES).map((c) => c.title))].join(" · ");
    this.page.add(label(this, GAME_W / 2, 392,
      `Nhạc tạm: ${tracks}\nKevin MacLeod (incompetech.com) — CC BY 4.0`, 11, "#8b959e", "400"));

    this.page.add(button(this, GAME_W / 2, 456, "Quay lại", () => this.show("main"), { width: 220 }));
  }
}
