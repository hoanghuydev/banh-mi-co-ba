import Phaser from "phaser";
import { fitDesignFrame } from "../core/render";
import { Stack, buttonHeight, label, platedKit, sliderDragging, sliderHeight, textScale, UI } from "../ui/theme";

const { button, panel, slider, toggle } = platedKit;

const TRAY_INK = "#f7f1e2";
import { drawAlleyBackdrop } from "../ui/backdrop";
import { GAME_TITLE, cleanName } from "../content/shop";
import {
  SaveService, loadSettings, saveSettings, type SaveFile, type Settings,
} from "../core/save";
import { bus } from "../core/eventbus";
import { PLAYTEST } from "../core/flags";
import { telemetry } from "../core/session";
import { GAME_W, GAME_H } from "../core/config";
import { CUES, music } from "../audio/music";
import { sfx } from "../audio/sfx";
import { warmNpcPhotos } from "../art";

type Page = "main" | "settings" | "audio" | "about" | "telemetry" | "confirmNew";

/** Mỗi trang dựng lại trong một container, chuyển trang là xoá container cũ. */
export class MenuScene extends Phaser.Scene {
  private page!: Phaser.GameObjects.Container;
  private at: Page = "main";

  constructor() { super("menu"); }

  create() {
    fitDesignFrame(this.cameras.main);
    this.drawBackdrop();
    this.show("main");
    this.input.keyboard?.on("keydown-ESC", () => {
      if (this.at === "audio") this.show("settings");
      else if (this.at !== "main") this.show("main");
    });
    // Bị chặn autoplay thì Phaser tự phát sau cú chạm đầu tiên.
    music.play(this, "menu");
    warmNpcPhotos(this);
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


  private drawBackdrop() {
    drawAlleyBackdrop(this);
  }


  /** Khay phẳng tối để nút 3D nổi lên, không chồng khối 3D lên khối 3D. */
  private tray(x: number, top: number, w: number, h: number) {
    const g = this.add.graphics();
    g.fillStyle(0x2a2018, 0.62).fillRoundedRect(x - w / 2, top, w, h, 22);
    g.lineStyle(2, 0xf7f1e2, 0.2).strokeRoundedRect(x - w / 2 + 1, top + 1, w - 2, h - 2, 21);
    return g;
  }

  private peekSave(): { save: SaveFile | null } {
    return { save: new SaveService(bus, () => { throw new Error("peek"); }).load() };
  }

  /** Khung ôm theo khối chữ đã xếp, để cỡ chữ lớn không tràn. */
  private card(body: Phaser.GameObjects.Container, top: number, bottom: number, texts: Phaser.GameObjects.Text[]) {
    const w = Math.min(GAME_W - 40, Math.max(560, ...texts.map((t) => t.width + 64)));
    body.addAt(panel(this, GAME_W / 2, (top + bottom) / 2, w, bottom - top, 0xf7f4ec, 0.94), 0);
  }

  private pageMain() {
    const { save } = this.peekSave();
    const x = GAME_W / 2;
    const body = this.add.container(0, 0);
    this.page.add(body);

    const top = Math.round(88 / textScale());
    const st = new Stack(top, 12);
    const title = st.place(label(this, x, 0, GAME_TITLE, 40, UI.ink, "700"), 10);
    const sub = st.place(label(this, x, 0, "Một quán nhỏ đầu hẻm, Sài Gòn", 15, UI.muted, "400"), 0);
    body.add([title, sub]);
    this.card(body, top - 24, st.y + 24, [title, sub]);
    st.skip(Math.round(72 / textScale()));

    body.add(st.button(button(this, x, 0, "Chơi mới", () => this.startNew(), {
      primary: true, width: 300,
    }), 14));

    body.add(st.button(button(this, x, 0,
      save ? "Chơi tiếp" : "Chưa có ván nào",
      () => this.continueRun(), {
      width: 300, disabled: !save,
      hint: save ? [cleanName(save.shopName ?? ""), `ngày ${save.progress.dayIndex}`,
      `${save.money.cash.toLocaleString("vi-VN")}₫`].filter(Boolean).join(" · ") : undefined,
    }), 14));

    body.add(st.button(button(this, x, 0, "Cài đặt", () => this.show("settings"), { width: 300 }), 14));
    body.add(st.button(button(this, x, 0, "Giới thiệu", () => this.show("about"), { width: 300 }), 14));

    // Trang dài hơn khung hình thì chân trang đi theo nội dung để khỏi đè nút cuối.
    const foot = label(this, x, GAME_H - 12,
      `bản dựng thử v0.2${PLAYTEST ? " · chơi thử" : ""}`, 11, "#cfdae0", "400");
    if (st.y > GAME_H - 48) {
      st.skip(10);
      body.add(st.place(foot, 0));
      this.enableScroll(body, st.y + 10, GAME_H - 10);
    } else {
      this.page.add(foot);
    }
  }

  private hasSave() {
    return new SaveService(bus, () => { throw new Error("peek"); }).hasSave();
  }

  private startNew() {
    // Chỉ có một chỗ lưu nên phải hỏi trước khi xoá.
    if (this.hasSave()) { this.show("confirmNew"); return; }
    this.askTelemetryThenStart();
  }

  private askTelemetryThenStart() {
    if (loadSettings().telemetry === null) { this.show("telemetry"); return; }
    this.scene.start("intro");
  }

  private pageConfirmNew() {
    const { save } = this.peekSave();
    const x = GAME_W / 2;
    const body = this.add.container(0, 0);
    this.page.add(body);

    const top = Math.round(120 / textScale());
    const st = new Stack(top, 12);
    const title = st.place(label(this, x, 0, "Xoá ván đang chơi?", 24, UI.ink, "700"), 18);
    const what = st.place(label(this, x, 0, save
      ? `Đang chơi dở: ngày ${save.progress.dayIndex} · ${save.money.cash.toLocaleString("vi-VN")}₫`
      : "Đang có một bản lưu.", 15, UI.ink, "500"), 10);
    const why = st.place(label(this, x, 0,
      "Game chỉ lưu được một ván. Chơi mới là ván này mất luôn,\nkhông lấy lại được.",
      13, UI.muted, "400").setAlign("center"), 0);
    body.add([title, what, why]);
    this.card(body, top - 28, st.y + 28, [title, what, why]);
    st.skip(34);

    body.add(st.button(button(this, x, 0, "Giữ ván cũ", () => this.show("main"), {
      primary: true, width: 320, hint: "hoặc bấm Esc",
    }), 14));
    body.add(st.button(button(this, x, 0, "Xoá, chơi mới", () => this.askTelemetryThenStart(), {
      width: 320, hint: "ván đang chơi sẽ mất",
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

  private pageTelemetryAsk() {
    const x = GAME_W / 2;
    const body = this.add.container(0, 0);
    this.page.add(body);

    const top = Math.round(120 / textScale());
    const st = new Stack(top, 12);
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
    body.add(st.button(button(this, x, 0, "Quay lại", () => this.show("main"),
      { width: 220, hint: "hoặc bấm Esc" }), 14));
    this.enableScroll(body, st.y, GAME_H - 20);
  }


  private pageSettings() {
    const s = loadSettings();
    const put = (patch: Partial<Settings>) => {
      Object.assign(s, patch);
      saveSettings(s);
    };

    const x = GAME_W / 2;
    const body = this.add.container(0, 0);
    this.page.add(body);
    const top = Math.round(70 / textScale());
    const st = new Stack(top + 22, 12);
    body.add(st.place(label(this, x, 0, "Cài đặt", 26, TRAY_INK, "700"), 16));

    const sizes: Settings["textScale"][] = [1, 1.25, 1.5, 2];
    const tg = (name: string, get: () => string, fn: () => void, hint?: string) =>
      body.add(st.button(toggle(this, x, 0, name, get, fn, 400, hint)));

    tg("Cỡ chữ", () => `${Math.round(s.textScale * 100)}%`,
      () => { put({ textScale: sizes[(sizes.indexOf(s.textScale) + 1) % sizes.length] }); this.show("settings"); });
    // Đặt hàng thứ hai vì cuộn ở trang này còn lệch vùng bấm.
    tg("Âm thanh", () => (s.masterVolume === 0 ? "tắt" : `${s.masterVolume}%`),
      () => this.show("audio"), "tổng · nhạc nền · đường phố · giọng người · thao tác · âm báo");
    tg("Giảm chuyển động", () => (s.reducedMotion ? "bật" : "tắt"), () => put({ reducedMotion: !s.reducedMotion }),
      "tắt xe chạy qua, lá bay, rung màn hình");
    tg("Mũi tên trên đầu mình", () => (s.playerMarker ? "bật" : "tắt"), () => put({ playerMarker: !s.playerMarker }),
      "tự mờ đi khi đang đi, sáng lại lúc đứng yên");
    tg("Bỏ giới hạn thời gian", () => (s.noTimePressure ? "bật" : "tắt"), () => put({ noTimePressure: !s.noTimePressure }),
      "khách bỏ đi vì mình làm sai, không vì mình chậm");
    tg("Ghi số liệu chơi thử", () => (s.telemetry ? "bật" : "tắt"),
      () => { put({ telemetry: !s.telemetry }); telemetry.enabled = !!s.telemetry; },
      "nằm trong máy này, không tự gửi đi đâu");
    st.skip(12);

    body.addAt(this.tray(x, top, 540, st.y - top), 0);

    // Ghim đáy vì danh sách công tắc có thể cao hơn khung hình.
    const barTop = GAME_H - buttonHeight() - 28;
    this.page.add(this.add.graphics().fillStyle(0x121820, 0.92).fillRect(0, barTop, GAME_W, GAME_H - barTop));
    const row = (barTop + GAME_H) / 2;
    this.page.add(button(this, x - 118, row, "Xuất số liệu", () => telemetry.download(), { width: 210 }));
    this.page.add(button(this, x + 118, row, "Quay lại", () => this.show("main"), { width: 210 }));

    this.enableScroll(body, st.y + 10, barTop);
  }

  private pageAudio() {
    const s = loadSettings();
    const put = (patch: Partial<Settings>) => {
      Object.assign(s, patch);
      saveSettings(s);
      music.applySettings(s);
      sfx.applySettings(s);
    };

    const x = GAME_W / 2;
    const body = this.add.container(0, 0);
    this.page.add(body);
    const top = Math.round(70 / textScale());
    const st = new Stack(top + 22, 12);
    body.add(st.place(label(this, x, 0, "Âm thanh", 26, TRAY_INK, "700"), 14));

    const tg = (name: string, get: () => string, fn: () => void, hint?: string) =>
      body.add(st.button(toggle(this, x, 0, name, get, fn, 400, hint)));
    type Chan = "masterVolume" | "musicVolume" | "streetVolume" | "voiceVolume" | "foleyVolume" | "uiVolume" | "crowdVolume";
    const chan = (name: string, key: Chan, hint: string, onRelease?: () => void) => {
      const o = slider(this, x, 0, name, () => s[key], (v) => put({ [key]: v } as Partial<Settings>),
        { width: 400, hint, onRelease });
      o.setY(st.y + sliderHeight() / 2);
      st.skip(sliderHeight() + 10);
      body.add(o);
    };

    // Từ 0 lên thì track đã bị thả, phải mồi lại.
    const wake = () => music.play(this, "menu", 400);
    chan("Âm lượng tổng", "masterVolume", "nhân vào mọi kênh bên dưới", wake);
    chan("Nhạc nền", "musicVolume", "nhạc theo giờ trong ngày", wake);
    chan("Tiếng đường phố", "streetVolume", "hẻm, xe máy, còi, mưa, chó, chim");
    chan("Tiếng người lao xao", "crowdVolume", "nằm trong tiếng đường phố, chỉnh riêng được");
    chan("Giọng người", "voiceVolume", "tiếng khách — kênh duy nhất không bị gì đè lên");
    chan("Tiếng thao tác", "foleyVolume", "dao, vỏ bánh, gói giấy, tiền lẻ");
    chan("Âm báo", "uiVolume", "click, chốt đơn, chuyển ngày");

    st.skip(6);
    body.add(st.place(label(this, x, 0, "trợ năng", 13, UI.muted), 8));

    tg("Tắt âm báo tiêu cực", () => (s.disableNegativeAudioCues ? "bật" : "tắt"),
      () => put({ disableNegativeAudioCues: !s.disableNegativeAudioCues }),
      "vẫn nghe bánh rơi, bánh khét, ruồi bay — chỉ bỏ tiếng chê");
    tg("Báo khi có người để ý", () => (s.a11yPerceptionPing ? "bật" : "tắt"),
      () => put({ a11yPerceptionPing: !s.a11yPerceptionPing }),
      "một tiếng gõ gỗ, lệch về phía người đang nhìn");
    tg("Gộp về một kênh", () => (s.monoAudio ? "bật" : "tắt"), () => put({ monoAudio: !s.monoAudio }),
      "bỏ trái–phải, dồn hết vào giữa");

    st.skip(12);
    body.addAt(this.tray(x, top, 540, st.y - top), 0);

    const barTop = GAME_H - buttonHeight() - 28;
    this.page.add(this.add.graphics().fillStyle(0x121820, 0.92).fillRect(0, barTop, GAME_W, GAME_H - barTop));
    this.page.add(button(this, x, (barTop + GAME_H) / 2, "Quay lại", () => this.show("settings"), { width: 210 }));
    this.enableScroll(body, st.y + 10, barTop);
  }

  private enableScroll(body: Phaser.GameObjects.Container, contentBottom: number, viewBottom = GAME_H) {
    const extra = Math.max(0, contentBottom - viewBottom);
    if (!extra) return;
    const clamp = (y: number) => Math.max(-extra, Math.min(0, y));
    this.input.on("wheel", (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      if (body.active) body.y = clamp(body.y - dy * 0.6);
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (body.active && p.isDown && !sliderDragging()) body.y = clamp(body.y + (p.y - p.prevPosition.y));
    });
  }


  private pageAbout() {
    const x = GAME_W / 2;
    const body = this.add.container(0, 0);
    this.page.add(body);

    const top = Math.round(104 / textScale());
    const st = new Stack(top, 12);
    const title = st.place(label(this, x, 0, "Giới thiệu", 26, UI.ink, "700"), 22);

    const what = st.place(label(this, x, 0, [
      "Phương Anh, 24 tuổi, nghỉ việc văn phòng sau hai năm OT không lương.",
      "Cô dồn hết tiền tiết kiệm thuê một mặt bằng nhỏ đầu hẻm và mở quán bánh mì.",
      "",
      "Khách đứng ngay trước quầy, thấy hết mọi thứ bạn làm,",
      "rồi chấm sao trên điện thoại.",
      "",
      "Đủ tiền thì mở chi nhánh 2. Hết tiền hoặc bị đóng cửa",
      "vì an toàn thực phẩm thì mất quán.",
    ].join("\n"), 14, UI.ink, "400").setAlign("center"), 26);

    const keys = st.place(label(this, x, 0,
      "WASD đi  ·  E làm việc  ·  Tab điện thoại  ·  Esc tạm dừng\n"
      + "còn lại game nhắc khi tới lúc.", 13, UI.muted, "400").setAlign("center"), 20);

    // Nhạc CC BY 4.0 bắt buộc ghi công ở nơi người chơi thấy.
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
