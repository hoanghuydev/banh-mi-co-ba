import Phaser from "phaser";
import { fitDesignFrame } from "../core/render";
import { Stack, button, buttonHeight, label, panel, textScale, toggle, UI } from "../ui/theme";
import { PAL as P } from "../art/palette";
import { COUNTER, textureFor } from "../art";
import { BASKET_TEX, BASKET_W, artScale, fitPhoto } from "../art/photo";
import {
  SaveService, SaveTooNewError, loadSettings, saveSettings, type SaveFile, type Settings,
} from "../core/save";
import { bus } from "../core/eventbus";
import { PLAYTEST } from "../core/flags";
import { telemetry } from "../core/session";
import { GAME_W, GAME_H } from "../core/config";
import { CUES, MUSIC_STEPS, music } from "../audio/music";
import { sfx } from "../audio/sfx";

type Page = "main" | "settings" | "audio" | "about" | "telemetry" | "confirmNew";

/**
 * Sảnh menu. Mọi trang dựng lại từ đầu trong một container -> chuyển trang là
 * xoá container cũ, không phải quản lý ẩn/hiện chục object.
 */
export class MenuScene extends Phaser.Scene {
  private page!: Phaser.GameObjects.Container;
  private at: Page = "main";

  constructor() { super("menu"); }

  create() {
    fitDesignFrame(this.cameras.main);          // canvas phóng to, toạ độ giữ nguyên — `core/render`
    this.drawBackdrop();
    this.show("main");
    // Mọi trang con phải thoát được bằng bàn phím (CANON §15): trước đây trang Cài đặt
    // không có phím nào ra, mà nút "Quay lại" thì nằm dưới mép màn hình.
    this.input.keyboard?.on("keydown-ESC", () => {
      if (this.at === "audio") this.show("settings");      // trang con của Cài đặt
      else if (this.at !== "main") this.show("main");
    });
    // Trình duyệt chỉ cho phát tiếng sau cú chạm/gõ phím đầu tiên; Phaser xếp
    // hàng sẵn rồi tự phát lại, nên gọi thẳng ở đây là đủ.
    music.play(this, "menu");
  }

  private show(page: Page) {
    this.page?.destroy(true);
    this.input.off("wheel");
    this.input.off("pointermove");
    this.at = page;
    this.page = this.add.container(0, 0);
    ({
      main: () => this.pageMain(), settings: () => this.pageSettings(),
      audio: () => this.pageAudio(),
      about: () => this.pageAbout(), telemetry: () => this.pageTelemetryAsk(),
      confirmNew: () => this.pageConfirmNew(),
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
    const S = 2.0;
    this.add.image(GAME_W - 262, GAME_H - 26, COUNTER.case(0)).setOrigin(0.5, 1).setScale(S).setAlpha(0.5);
    const end = this.add.image(GAME_W - 190, GAME_H + 4, COUNTER.end).setOrigin(0.5, 1).setScale(S).setAlpha(0.5);
    // Rổ bánh là ẢNH THẬT đặt rời (xem `art/photo.ts`), không còn nướng trong texture
    // khúc quầy — không đặt lại ở đây thì mặt quầy của sảnh trơ ra một khoảng trống.
    // Dùng chung đúng phép đặt của `StallScene.addOnCounter`, chỉ nhân thêm hệ số phóng.
    if (this.textures.exists(BASKET_TEX)) {
      fitPhoto(this.add.image(end.x, end.y - (COUNTER.TOP_ABOVE_FOOT - BASKET_W / 4) * S, BASKET_TEX))
        .setOrigin(0.5, 1).setScale(S / artScale(BASKET_TEX)).setAlpha(0.5);
    }
    // `fitPhoto` chứ không `setScale` thẳng: hình người chơi là ẢNH THẬT nướng dư pixel.
    fitPhoto(this.add.image(GAME_W - 292, GAME_H - 84, textureFor("s").key), 1.9)
      .setOrigin(0.5, 1).setAlpha(0.5);
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

  /**
   * Khung giấy ôm ĐÚNG khối chữ vừa xếp, chèn xuống dưới cùng của container.
   * Khung cao/rộng cố định chỉ đúng ở 100% — ở 200% chữ tràn ra ngoài khung (ui/theme §Stack).
   */
  private card(body: Phaser.GameObjects.Container, top: number, bottom: number, texts: Phaser.GameObjects.Text[]) {
    const w = Math.min(GAME_W - 40, Math.max(560, ...texts.map((t) => t.width + 64)));
    body.addAt(panel(this, GAME_W / 2, (top + bottom) / 2, w, bottom - top, 0xf7f4ec, 0.94), 0);
  }

  private pageMain() {
    const { save, tooNew } = this.peekSave();
    const over = save?.flags.seasonOver === true;
    const x = GAME_W / 2;
    const body = this.add.container(0, 0);
    this.page.add(body);

    // Xếp theo chiều cao ĐO ĐƯỢC (ui/theme §Stack) chứ không đặt toạ độ cứng: ở 150–200%
    // tựa đè lên dòng phụ và ba cái nút đè lên nhau. Lề trên co lại khi chữ to — ở 200%
    // riêng khối tựa đã cao gấp đôi.
    const top = Math.round(88 / textScale());
    const st = new Stack(top, 10);
    const title = st.place(label(this, x, 0, "Bánh Mì Cô Ba", 40, UI.ink, "700"), 10);
    // Tựa game KHÔNG phải chỗ đứng của tagline marketing (CANON §0 — chỗ của nó là trang
    // bán và README). Một dòng tả CHỖ, để người ta biết mình sắp đứng ở đâu.
    const sub = st.place(label(this, x, 0, "Đầu hẻm, Sài Gòn.", 15, UI.muted, "400"), 0);
    body.add([title, sub]);
    this.card(body, top - 24, st.y + 24, [title, sub]);
    st.skip(Math.round(72 / textScale()));

    body.add(st.button(button(this, x, 0, "Mùa mới", () => this.startNew(), {
      primary: true, width: 300, hint: "40 ngày",
    }), 14));

    // P0-02 §2.7 luật 1: save của phiên bản MỚI hơn thì từ chối, nói rõ, không đoán mò.
    body.add(st.button(button(this, x, 0,
      tooNew ? "Bản lưu của bản mới hơn" : over ? "Hết mùa rồi" : save ? "Chơi tiếp" : "Chưa có ván nào",
      () => this.continueRun(), {
        width: 300, disabled: !save || over,
        hint: tooNew ? "cập nhật game rồi chơi tiếp"
          : save ? `ngày ${save.progress.dayIndex} · ${save.money.cash.toLocaleString("vi-VN")}₫` : undefined,
      }), 14));

    body.add(st.button(button(this, x, 0, "Cài đặt", () => this.show("settings"), { width: 300 }), 14));
    body.add(st.button(button(this, x, 0, "Giới thiệu", () => this.show("about"), { width: 300 }), 14));

    // dòng chân trang nằm trên dải mặt đường tối -> phải dùng màu sáng mới đọc được.
    // Ở cỡ chữ to trang dài hơn khung hình: lúc đó dòng này đi THEO nội dung, không ghim đáy,
    // không thì nó nằm đè lên nút cuối.
    const foot = label(this, x, GAME_H - 26,
      `bản dựng thử v0.2${PLAYTEST ? " · chơi thử" : ""}`, 11, "#cfdae0", "400");
    if (st.y > GAME_H - 48) {
      st.skip(10);
      body.add(st.place(foot, 0));
      this.enableScroll(body, st.y + 10, GAME_H - 10);
    } else {
      this.page.add(foot);
    }
  }

  /** Có thứ gì để mất không — kể cả save hỏng / save của bản mới hơn: `clear()` xoá hết như nhau. */
  private hasSave() {
    return new SaveService(bus, () => { throw new Error("peek"); }).hasSave();
  }

  private startNew() {
    // Chỉ có MỘT chỗ lưu: "Bắt đầu mùa mới" là xoá hẳn ván đang chơi. Một mùa 40 ngày về
    // quan hệ không respawn được (P0-02 §2.5) — phải hỏi trước, và nút này nằm ngay trên
    // "Chơi tiếp" nên bấm nhầm là chuyện thường.
    if (this.hasSave()) { this.show("confirmNew"); return; }
    this.askTelemetryThenStart();
  }

  private askTelemetryThenStart() {
    // Bản bán ra: hỏi rõ MỘT lần về telemetry trước ván đầu tiên (P0-03 §4).
    if (loadSettings().telemetry === null) { this.show("telemetry"); return; }
    this.scene.start("day", { mode: "new" });
  }

  /** Hỏi trước khi xoá — chỉ hiện khi THẬT SỰ có cái để mất. Đường lùi rõ hơn đường xoá. */
  private pageConfirmNew() {
    const { save } = this.peekSave();
    const x = GAME_W / 2;
    const body = this.add.container(0, 0);
    this.page.add(body);

    const top = Math.round(120 / textScale());
    const st = new Stack(top, 10);
    const title = st.place(label(this, x, 0, "Xoá ván đang chơi?", 24, UI.ink, "700"), 18);
    const what = st.place(label(this, x, 0, save
      ? `Đang chơi dở: ngày ${save.progress.dayIndex} · ${save.money.cash.toLocaleString("vi-VN")}₫`
      : "Đang có một bản lưu.", 15, UI.ink, "500"), 10);
    const why = st.place(label(this, x, 0,
      "Game chỉ lưu được một ván. Mùa mới là ván này mất luôn,\nkhông lấy lại được.",
      13, UI.muted, "400").setAlign("center"), 0);
    body.add([title, what, why]);
    this.card(body, top - 28, st.y + 28, [title, what, why]);
    st.skip(34);

    body.add(st.button(button(this, x, 0, "Giữ ván cũ", () => this.show("main"), {
      primary: true, width: 320, hint: "hoặc bấm Esc",
    }), 14));
    body.add(st.button(button(this, x, 0, "Xoá, chơi mùa mới", () => this.askTelemetryThenStart(), {
      width: 320, hint: "ván đang chơi mất luôn",
    }), 14));
    this.enableScroll(body, st.y, GAME_H - 20);
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
    const x = GAME_W / 2;
    const body = this.add.container(0, 0);
    this.page.add(body);

    const top = Math.round(120 / textScale());
    const st = new Stack(top, 10);
    const title = st.place(label(this, x, 0, "Ghi số liệu chơi thử?", 22, UI.ink, "700"), 20);
    const text = st.place(label(this, x, 0,
      "Game ghi vài con số vào máy này: một ngày dài bao lâu, khách nào bỏ đi.\n"
      + "Không tự gửi đi đâu. Muốn gửi cho người làm game thì vào Cài đặt,\n"
      + "bấm Xuất số liệu. Đổi ý lúc nào cũng được.", 13, UI.muted, "400")
      .setAlign("center"), 0);
    body.add([title, text]);
    this.card(body, top - 28, st.y + 28, [title, text]);
    st.skip(34);

    const row = st.y + buttonHeight() / 2;
    body.add(button(this, x - 124, row, "Cứ ghi", () => {
      this.setTelemetry(true); this.askTelemetryThenStart();
    }, { width: 220, primary: true }));
    body.add(button(this, x + 124, row, "Thôi, khỏi", () => {
      this.setTelemetry(false); this.askTelemetryThenStart();
    }, { width: 220 }));
    st.skip(buttonHeight() + 14);
    // Cả hai câu trả lời đều đi thẳng vào ván mới (= xoá ván cũ). Phải có đường lùi, không
    // thì trang này là cái bẫy một chiều.
    body.add(st.button(button(this, x, 0, "Quay lại", () => this.show("main"),
      { width: 220, hint: "hoặc bấm Esc" }), 14));
    this.enableScroll(body, st.y, GAME_H - 20);
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

    const x = GAME_W / 2;
    // Danh sách công tắc cuộn được; hai cái nút ở dưới KHÔNG cuộn theo (xem cuối hàm).
    const body = this.add.container(0, 0);
    this.page.add(body);
    const bg = this.add.graphics();
    body.add(bg);
    const top = Math.round(70 / textScale());
    const st = new Stack(top + 22, 10);
    body.add(st.place(label(this, x, 0, "Cài đặt", 26, UI.ink, "700"), 16));

    const sizes: Settings["textScale"][] = [1, 1.25, 1.5, 2];
    const tg = (name: string, get: () => string, fn: () => void, hint?: string) =>
      body.add(st.button(toggle(this, x, 0, name, get, fn, 340, hint)));

    tg("Cỡ chữ", () => `${Math.round(s.textScale * 100)}%`,
      () => { put({ textScale: sizes[(sizes.indexOf(s.textScale) + 1) % sizes.length] }); this.show("settings"); });
    /*
     * CANON §15.4 có NĂM kênh, mỗi kênh một công tắc — mười một hàng cả thảy. Nhét hết
     * vào đây thì trang Cài đặt phải cuộn ba màn hình và mấy công tắc chơi (cỡ chữ, bỏ
     * giới hạn thời gian) chìm nghỉm giữa đám thanh âm lượng. Tách ra trang riêng, và
     * vẫn hiện sẵn mức của kênh Nhạc để biết có đang tắt tiếng hay không.
     *
     * Đặt ở HÀNG THỨ HAI, không phải cuối danh sách: danh sách này đã dài hơn khung
     * hình ở cỡ chữ 100%, nên mấy hàng cuối chỉ tới được bằng cách cuộn — mà cuộn ở
     * trang này còn lệch vùng bấm (lỗi có sẵn, chưa sửa). Một cửa dẫn sang cả một
     * trang con mà lại nằm đúng chỗ khó bấm nhất thì coi như không có.
     */
    tg("Âm thanh", () => (s.musicVolume === 0 ? "nhạc đang tắt" : "5 kênh riêng"),
      () => this.show("audio"), "nhạc · hẻm · giọng người · thao tác · âm báo");
    tg("Giảm chuyển động", () => (s.reducedMotion ? "bật" : "tắt"), () => put({ reducedMotion: !s.reducedMotion }),
      "tắt xe chạy qua, lá bay, rung màn hình");
    // Cô Ba không có bảng tên dưới chân như khách — không có mũi tên thì người chơi mới
    // vào phải bấm thử một phím mới biết mình là ai trong đám người đứng quanh quầy.
    tg("Mũi tên trên đầu mình", () => (s.playerMarker ? "bật" : "tắt"), () => put({ playerMarker: !s.playerMarker }),
      "tự mờ đi khi đang đi, sáng lại lúc đứng yên");
    tg("Bỏ giới hạn thời gian", () => (s.noTimePressure ? "bật" : "tắt"), () => put({ noTimePressure: !s.noTimePressure }),
      "khách bỏ đi vì mình làm sai, không vì mình chậm");
    // CANON §15 công tắc số 1 (P2-04 RB6): tắt thì tin vẫn lan, chỉ là luôn đúng
    tg("Khách nhớ nhầm, đồn sai", () => (s.allowFalseMemory ? "bật" : "tắt"), () => put({ allowFalseMemory: !s.allowFalseMemory }),
      "tắt thì tin vẫn lan, chỉ là lan đúng");
    // CANON §15 công tắc #4 (P2-05 §4.4): tắt thì nhật ký vẫn ghi, vẫn mở bằng Tab
    tg("Mở sổ tay cuối ngày", () => (s.notebookAuto ? "bật" : "tắt"), () => put({ notebookAuto: !s.notebookAuto }),
      "tắt thì sổ vẫn ghi, mở bằng Tab");
    tg("Nghi thức đốt vía", () => (s.skipRitual ? "bỏ qua" : "có"), () => put({ skipRitual: !s.skipRitual }));
    // P3-03 §4 luật UI #4: tắt thì đi chợ không có tổng chạy — người chơi nhẩm, tổng chỉ
    // hiện ở bước xác nhận
    tg("Hiện tổng tiền ở chợ", () => (s.marketRunningTotal ? "bật" : "tắt"),
      () => put({ marketRunningTotal: !s.marketRunningTotal }), "tắt thì tổng chỉ hiện lúc trả tiền");
    // P0-03 §2.1: cục bộ, có công tắc, KHÔNG gửi đi đâu.
    tg("Ghi số liệu chơi thử", () => (s.telemetry ? "bật" : "tắt"),
      () => { put({ telemetry: !s.telemetry }); telemetry.enabled = !!s.telemetry; },
      "nằm trong máy này, không tự gửi đi đâu");
    st.skip(12);                                // lề dưới của khung giấy

    // nền khung cao đúng bằng nội dung
    bg.fillStyle(0xf7f4ec, 0.96).fillRoundedRect(x - 270, top, 540, st.y - top, 16);

    // Thanh chân GHIM ĐÁY màn hình. Trước đây hai nút này nằm trong dòng chảy của Stack: tám
    // công tắc đã cao hơn khung hình nên ngay ở cỡ chữ 100% chúng rơi hẳn xuống dưới mép
    // (~87px), chỉ tới được bằng cách cuộn — mà không có phím nào thoát được trang.
    const barTop = GAME_H - buttonHeight() - 28;
    this.page.add(this.add.graphics().fillStyle(0x121820, 0.92).fillRect(0, barTop, GAME_W, GAME_H - barTop));
    const row = (barTop + GAME_H) / 2;
    this.page.add(button(this, x - 118, row, "Xuất số liệu", () => telemetry.download(), { width: 210 }));
    this.page.add(button(this, x + 118, row, "Quay lại", () => this.show("main"), { width: 210 }));

    // Chữ to (150–200%) thì trang dài hơn màn hình: cuộn bằng con lăn / kéo, không cắt chữ.
    this.enableScroll(body, st.y + 10, barTop);
  }

  /**
   * Trang ÂM THANH — năm kênh của CANON §15.4, mỗi kênh một công tắc riêng.
   *
   * Vì sao không gộp thành một thanh "âm lượng": năm kênh này làm năm việc khác hẳn
   * nhau với người chơi. Có người tắt sạch nhạc mà vẫn cần tiếng thao tác để biết tay
   * mình vừa làm gì; có người tắt giọng lao xao vì nó làm quá tải, nhưng vẫn muốn nghe
   * tiếng xe để thấy mình đang ở trong một cái hẻm. Một thanh chung thì cả hai cùng thua.
   */
  private pageAudio() {
    const s = loadSettings();
    const put = (patch: Partial<Settings>) => {
      Object.assign(s, patch);
      saveSettings(s);
      music.applySettings(s);
      sfx.applySettings(s);
    };
    /** Xoay vòng qua các nấc. Giá trị lạ (save cũ, sửa tay localStorage) rơi về nấc đầu. */
    const nextStep = (v: number) => {
      const at = (MUSIC_STEPS as readonly number[]).indexOf(v);
      return MUSIC_STEPS[(Math.max(at, -1) + 1) % MUSIC_STEPS.length];
    };
    const show = (v: number) => (v === 0 ? "tắt" : `${v}%`);

    const x = GAME_W / 2;
    const body = this.add.container(0, 0);
    this.page.add(body);
    const bg = this.add.graphics();
    body.add(bg);
    const top = Math.round(70 / textScale());
    const st = new Stack(top + 22, 10);
    body.add(st.place(label(this, x, 0, "Âm thanh", 26, UI.ink, "700"), 6));
    body.add(st.place(label(this, x, 0, "năm kênh, chỉnh riêng từng kênh", 13, UI.muted), 14));

    const tg = (name: string, get: () => string, fn: () => void, hint?: string) =>
      body.add(st.button(toggle(this, x, 0, name, get, fn, 340, hint)));
    /** Một kênh = một hàng xoay vòng âm lượng. */
    const chan = (name: string, key: "musicVolume" | "streetVolume" | "voiceVolume" | "foleyVolume" | "uiVolume" | "crowdVolume", hint: string, after?: () => void) =>
      tg(name, () => show(s[key]), () => { put({ [key]: nextStep(s[key]) } as Partial<Settings>); after?.(); }, hint);

    chan("Nhạc", "musicVolume", "nhạc nền theo giờ trong ngày",
      // Kéo từ 0 lên thì track đã bị thả ra rồi — phải mồi lại, không thì im tới lúc đổi cue.
      () => music.play(this, "menu", 400));
    chan("Tiếng đường phố", "streetVolume", "hẻm, xe máy, còi, mưa, chó, chim");
    chan("Giọng người", "voiceVolume", "tiếng khách — kênh duy nhất không bị gì đè lên");
    chan("Tiếng thao tác", "foleyVolume", "dao, vỏ bánh, gói giấy, tiền lẻ");
    chan("Âm báo", "uiVolume", "click, chốt đơn, chuyển ngày");
    chan("Tiếng người lao xao", "crowdVolume", "nằm trong tiếng đường phố, tắt riêng được");

    st.skip(6);
    body.add(st.place(label(this, x, 0, "trợ năng", 13, UI.muted), 8));

    // P5-03 §5.5 — ranh giới một dòng: âm mô tả thế giới thì giữ, âm chấm điểm thì bỏ.
    tg("Tắt âm báo tiêu cực", () => (s.disableNegativeAudioCues ? "bật" : "tắt"),
      () => put({ disableNegativeAudioCues: !s.disableNegativeAudioCues }),
      "vẫn nghe bánh rớt, bánh khét, ruồi bay — chỉ bỏ tiếng chê");
    // P5-03 §5.4 — cùng một tiếng cho chuyện tốt và chuyện xấu: thông tin, không phán xét.
    tg("Báo khi có người để ý", () => (s.a11yPerceptionPing ? "bật" : "tắt"),
      () => put({ a11yPerceptionPing: !s.a11yPerceptionPing }),
      "một tiếng gõ gỗ, lệch về phía người đang nhìn");
    // P5-03 §2.4 — cho người nghe bằng một bên tai.
    tg("Gộp về một kênh", () => (s.monoAudio ? "bật" : "tắt"), () => put({ monoAudio: !s.monoAudio }),
      "bỏ trái–phải, dồn hết vào giữa");

    st.skip(12);
    bg.fillStyle(0xf7f4ec, 0.96).fillRoundedRect(x - 270, top, 540, st.y - top, 16);

    const barTop = GAME_H - buttonHeight() - 28;
    this.page.add(this.add.graphics().fillStyle(0x121820, 0.92).fillRect(0, barTop, GAME_W, GAME_H - barTop));
    this.page.add(button(this, x, (barTop + GAME_H) / 2, "Quay lại", () => this.show("settings"), { width: 210 }));
    this.enableScroll(body, st.y + 10, barTop);
  }

  /** Cuộn phần thân theo chiều dọc nếu nó cao hơn vùng nhìn thấy (`viewBottom`). */
  private enableScroll(body: Phaser.GameObjects.Container, contentBottom: number, viewBottom = GAME_H) {
    const extra = Math.max(0, contentBottom - viewBottom);
    if (!extra) return;
    const clamp = (y: number) => Math.max(-extra, Math.min(0, y));
    this.input.on("wheel", (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      if (body.active) body.y = clamp(body.y - dy * 0.6);
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (body.active && p.isDown) body.y = clamp(body.y + (p.y - p.prevPosition.y));
    });
  }

  // --------------------------------------------------------------- giới thiệu

  private pageAbout() {
    const x = GAME_W / 2;
    const body = this.add.container(0, 0);
    this.page.add(body);

    // Xếp theo chiều cao ĐO ĐƯỢC như mọi trang khác (ui/theme §Stack). Toạ độ cứng ở đây
    // chỉ đúng ở cỡ chữ 100%, mà trang này là trang nhiều chữ nhất của sảnh.
    const top = Math.round(104 / textScale());
    const st = new Stack(top, 10);
    const title = st.place(label(this, x, 0, "Giới thiệu", 26, UI.ink, "700"), 22);

    // Trang này KHÔNG phải changelog. Bản cũ liệt kê "bản dựng này có gì / cái gì ở
    // giai đoạn sau" — đó là ghi chú của người làm game, người chơi không mua cái đó.
    // Nó tả CHỖ và CÁI GIÁ, đúng hai thứ cần biết trước khi bấm chơi.
    const what = st.place(label(this, x, 0, [
      "Cô Ba đi nằm. Xe bánh mì đầu hẻm giao lại cho mình.",
      "",
      "Khách đứng cách mình nửa mét. Họ thấy hết:",
      "tay mình có rửa không, ổ bánh có cháy không,",
      "mình có còn nhớ bữa qua họ gọi gì không.",
      "",
      "Bốn mươi ngày. Hết mùa là hết, không chơi lại.",
    ].join("\n"), 14, UI.ink, "400").setAlign("center"), 26);

    const keys = st.place(label(this, x, 0,
      "WASD đi  ·  E làm việc  ·  Tab sổ tay  ·  Esc tạm dừng\n"
      + "còn lại game nhắc khi tới lúc.", 13, UI.muted, "400").setAlign("center"), 20);

    /*
     * Ghi công âm thanh.
     *
     * NHẠC là bắt buộc phải có ở đây: giấy phép CC BY 4.0 đòi nêu tên tác giả ở nơi
     * người chơi THẤY ĐƯỢC, không phải trong một file README trên kho mã. Gỡ hai dòng
     * đó ra là vi phạm giấy phép.
     *
     * TIẾNG ĐỘNG thì KHÔNG bắt buộc — toàn bộ là CC0, không nghĩa vụ ghi công nào.
     * Vẫn ghi, vì hai lý do không phải pháp lý: đó là công của người khác, và vì bản
     * thu ambience ở đây là field recording THẬT ở Sài Gòn, mà nói ra điều đó thì
     * người chơi nghe cái hẻm khác đi. Danh sách đủ 169 file ở `PROVENANCE.csv`.
     */
    const tracks = [...new Set(Object.values(CUES).map((c) => c.title))].join(" · ");
    const credit = st.place(label(this, x, 0,
      `Nhạc tạm: ${tracks}\nKevin MacLeod (incompetech.com) · CC BY 4.0\n\n`
      + "Tiếng động tạm: thư viện Freesound, toàn bộ giấy phép CC0.\n"
      + "Nền hẻm, chợ và tiếng người là bản thu thật ở TP.HCM.", 11, "#8b959e", "400")
      .setAlign("center"), 0);

    body.add([title, what, keys, credit]);
    this.card(body, top - 26, st.y + 26, [title, what, keys, credit]);
    st.skip(34);

    body.add(st.button(button(this, x, 0, "Quay lại", () => this.show("main"),
      { width: 220, hint: "hoặc bấm Esc" }), 14));
    this.enableScroll(body, st.y, GAME_H - 20);
  }
}
