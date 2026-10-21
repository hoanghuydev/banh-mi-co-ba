import Phaser from "phaser";
import { fitDesignFrame } from "../core/render";
import { Stack, button, buttonHeight, label, panel, textScale, toggle, UI } from "../ui/theme";
import { drawAlleyBackdrop } from "../ui/backdrop";
import { DEFAULT_PLAYER_NAME, GAME_TITLE, cleanName } from "../content/shop";
import {
  SaveService, loadSettings, saveSettings, type SaveFile, type Settings,
} from "../core/save";
import { bus } from "../core/eventbus";
import { PLAYTEST } from "../core/flags";
import { telemetry } from "../core/session";
import { GAME_W, GAME_H } from "../core/config";
import { CUES, MUSIC_STEPS, music } from "../audio/music";
import { sfx } from "../audio/sfx";

type Page = "main" | "settings" | "audio" | "about" | "telemetry" | "confirmNew";

/** Tên người chơi ở dòng phụ của nút "Chơi tiếp" — tên mặc định thì khỏi nhắc. */
const playerLabel = (name: string) => {
  const n = cleanName(name ?? "");
  return n && n !== DEFAULT_PLAYER_NAME ? n : "";
};

/**
 * Sảnh menu. Mọi trang dựng lại từ đầu trong một container -> chuyển trang là
 * xoá container cũ, không phải quản lý ẩn/hiện chục object.
 */
export class MenuScene extends Phaser.Scene {
  private page!: Phaser.GameObjects.Container;
  private at: Page = "main";

  constructor() { super("menu"); }

  create() {
    fitDesignFrame(this.cameras.main);
    this.drawBackdrop();
    this.show("main");
    // Mọi trang con phải thoát được bằng bàn phím (CANON §15).
    this.input.keyboard?.on("keydown-ESC", () => {
      if (this.at === "audio") this.show("settings");
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


  private drawBackdrop() {
    drawAlleyBackdrop(this);
  }


  private peekSave(): { save: SaveFile | null } {
    return { save: new SaveService(bus, () => { throw new Error("peek"); }).load() };
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
    const { save } = this.peekSave();
    const x = GAME_W / 2;
    const body = this.add.container(0, 0);
    this.page.add(body);

    // Xếp theo chiều cao ĐO ĐƯỢC (ui/theme §Stack), không toạ độ cứng, để chữ 150–200% không đè nhau; lề trên co lại khi chữ to.
    const top = Math.round(88 / textScale());
    const st = new Stack(top, 10);
    const title = st.place(label(this, x, 0, GAME_TITLE, 40, UI.ink, "700"), 10);
    const sub = st.place(label(this, x, 0, "Tiệm bánh mì nhỏ", 15, UI.muted, "400"), 0);
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
      hint: save ? [playerLabel(save.playerName), `ngày ${save.progress.dayIndex}`,
      `${save.money.cash.toLocaleString("vi-VN")}₫`].filter(Boolean).join(" · ") : undefined,
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

  private hasSave() {
    return new SaveService(bus, () => { throw new Error("peek"); }).hasSave();
  }

  private startNew() {
    // Chỉ có MỘT chỗ lưu: chơi mới là xoá hẳn ván đang chơi — phải hỏi trước.
    if (this.hasSave()) { this.show("confirmNew"); return; }
    this.askTelemetryThenStart();
  }

  private askTelemetryThenStart() {
    if (loadSettings().telemetry === null) { this.show("telemetry"); return; }
    this.scene.start("day", { mode: "new" });
  }

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
    body.add(st.button(button(this, x, 0, "Quay lại", () => this.show("main"),
      { width: 220, hint: "hoặc bấm Esc" }), 14));
    this.enableScroll(body, st.y, GAME_H - 20);
  }


  /**
   * CANON §15: trợ năng là bắt buộc; mọi công tắc đều có tác dụng thật.
   */
  private pageSettings() {
    const s = loadSettings();
    const put = (patch: Partial<Settings>) => {
      Object.assign(s, patch);
      saveSettings(s);
    };

    const x = GAME_W / 2;
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
    // Năm kênh âm thanh (CANON §15.4) tách trang riêng cho trang này khỏi dài. Đặt hàng thứ hai vì
    // mấy hàng cuối phải cuộn mới tới — mà cuộn ở trang này còn lệch vùng bấm (chưa sửa).
    tg("Âm thanh", () => (s.musicVolume === 0 ? "nhạc đang tắt" : "5 kênh riêng"),
      () => this.show("audio"), "nhạc · hẻm · giọng người · thao tác · âm báo");
    tg("Giảm chuyển động", () => (s.reducedMotion ? "bật" : "tắt"), () => put({ reducedMotion: !s.reducedMotion }),
      "tắt xe chạy qua, lá bay, rung màn hình");
    tg("Mũi tên trên đầu mình", () => (s.playerMarker ? "bật" : "tắt"), () => put({ playerMarker: !s.playerMarker }),
      "tự mờ đi khi đang đi, sáng lại lúc đứng yên");
    tg("Bỏ giới hạn thời gian", () => (s.noTimePressure ? "bật" : "tắt"), () => put({ noTimePressure: !s.noTimePressure }),
      "khách bỏ đi vì mình làm sai, không vì mình chậm");
    // P3-03 §4 luật UI #4: tắt thì đi chợ không có tổng chạy — người chơi nhẩm, tổng chỉ
    // hiện ở bước xác nhận
    tg("Hiện tổng tiền ở chợ", () => (s.marketRunningTotal ? "bật" : "tắt"),
      () => put({ marketRunningTotal: !s.marketRunningTotal }), "tắt thì tổng chỉ hiện lúc trả tiền");
    // P0-03 §2.1: cục bộ, có công tắc, KHÔNG gửi đi đâu.
    tg("Ghi số liệu chơi thử", () => (s.telemetry ? "bật" : "tắt"),
      () => { put({ telemetry: !s.telemetry }); telemetry.enabled = !!s.telemetry; },
      "nằm trong máy này, không tự gửi đi đâu");
    st.skip(12);

    bg.fillStyle(0xf7f4ec, 0.96).fillRoundedRect(x - 270, top, 540, st.y - top, 16);

    // Thanh chân GHIM ĐÁY màn hình: danh sách công tắc cao hơn khung hình, hai nút không được trôi xuống dưới mép.
    const barTop = GAME_H - buttonHeight() - 28;
    this.page.add(this.add.graphics().fillStyle(0x121820, 0.92).fillRect(0, barTop, GAME_W, GAME_H - barTop));
    const row = (barTop + GAME_H) / 2;
    this.page.add(button(this, x - 118, row, "Xuất số liệu", () => telemetry.download(), { width: 210 }));
    this.page.add(button(this, x + 118, row, "Quay lại", () => this.show("main"), { width: 210 }));

    // Chữ to (150–200%) thì trang dài hơn màn hình: cuộn bằng con lăn / kéo, không cắt chữ.
    this.enableScroll(body, st.y + 10, barTop);
  }

  /**
   * Trang ÂM THANH — năm kênh của CANON §15.4, mỗi kênh một công tắc riêng (không gộp một thanh chung).
   */
  private pageAudio() {
    const s = loadSettings();
    const put = (patch: Partial<Settings>) => {
      Object.assign(s, patch);
      saveSettings(s);
      music.applySettings(s);
      sfx.applySettings(s);
    };
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

    tg("Tắt âm báo tiêu cực", () => (s.disableNegativeAudioCues ? "bật" : "tắt"),
      () => put({ disableNegativeAudioCues: !s.disableNegativeAudioCues }),
      "vẫn nghe bánh rơi, bánh khét, ruồi bay — chỉ bỏ tiếng chê");
    tg("Báo khi có người để ý", () => (s.a11yPerceptionPing ? "bật" : "tắt"),
      () => put({ a11yPerceptionPing: !s.a11yPerceptionPing }),
      "một tiếng gõ gỗ, lệch về phía người đang nhìn");
    tg("Gộp về một kênh", () => (s.monoAudio ? "bật" : "tắt"), () => put({ monoAudio: !s.monoAudio }),
      "bỏ trái–phải, dồn hết vào giữa");

    st.skip(12);
    bg.fillStyle(0xf7f4ec, 0.96).fillRoundedRect(x - 270, top, 540, st.y - top, 16);

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
      if (body.active && p.isDown) body.y = clamp(body.y + (p.y - p.prevPosition.y));
    });
  }


  private pageAbout() {
    const x = GAME_W / 2;
    const body = this.add.container(0, 0);
    this.page.add(body);

    const top = Math.round(104 / textScale());
    const st = new Stack(top, 10);
    const title = st.place(label(this, x, 0, "Giới thiệu", 26, UI.ink, "700"), 22);

    // Trang này KHÔNG phải changelog: chỉ tả CHỖ và CÁI GIÁ.
    const what = st.place(label(this, x, 0, [
      "Một xe bánh mì ở đầu hẻm, Sài Gòn.",
      "",
      "Khách đứng cách bạn nửa mét. Họ thấy hết:",
      "tay có rửa không, ổ bánh có cháy không.",
      "",
      "Hết vốn nhập hàng là thua.",
    ].join("\n"), 14, UI.ink, "400").setAlign("center"), 26);

    const keys = st.place(label(this, x, 0,
      "WASD đi  ·  E làm việc  ·  Esc tạm dừng\n"
      + "còn lại game nhắc khi tới lúc.", 13, UI.muted, "400").setAlign("center"), 20);

    // Ghi công âm thanh. ⚠️ NHẠC CC BY 4.0: bắt buộc nêu tên ở nơi người chơi thấy — gỡ là vi phạm giấy phép.
    // Tiếng động CC0, không bắt buộc ghi công; danh sách đủ ở `PROVENANCE.csv`.
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
