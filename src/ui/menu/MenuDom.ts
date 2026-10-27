import type Phaser from "phaser";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { GAME_TITLE, cleanName } from "../../content/shop";
import { SaveService, loadSettings, saveSettings, type SaveFile, type Settings } from "../../core/save";
import { bus } from "../../core/eventbus";
import { PLAYTEST } from "../../core/flags";
import { telemetry } from "../../core/session";
import { hint, isTouch, notifyDeviceChange, onDeviceChange, orientation } from "../../core/device";
import { CUES, music } from "../../audio/music";
import { sfx } from "../../audio/sfx";
import { btn, el } from "../phone/dom";
import { fullscreenSupported, isFullscreen, toggleFullscreen } from "../rotatePrompt";
import { MENU_CSS } from "./menuStyle";

type Page = "main" | "map" | "settings" | "audio" | "about" | "telemetry" | "confirmNew";
type Chan = "masterVolume" | "musicVolume" | "streetVolume" | "voiceVolume" | "foleyVolume" | "uiVolume" | "crowdVolume";

const peek = () => new SaveService(bus, () => { throw new Error("peek"); });
const vnd = (n: number) => `${n.toLocaleString("vi-VN")}₫`;
const HOLD_MS = 1000;
const SOON_MS = 1500;
const onOff = (b: boolean) => (b ? "Bật" : "Tắt");

/** Menu dựng bằng DOM phủ trên canvas; chuyển cảnh qua `onStart`. */
export class MenuDom {
  private root = el("div", "mn-root");
  private at: Page = "main";
  private prevKbd: boolean | null = null;
  private offDevice: () => void;
  private save: SaveFile | null | undefined;
  private shape = this.deviceShape();

  constructor(
    private scene: Phaser.Scene,
    private onStart: (key: string, data?: object) => void,
    private opts: { page?: Page; onExit?: () => void } = {},
  ) {
    this.at = opts.page ?? "main";
    if (!document.getElementById("mn-style")) {
      const st = el("style");
      st.id = "mn-style";
      st.textContent = MENU_CSS;
      document.head.appendChild(st);
    }
    document.addEventListener("keydown", this.onKey, true);
    document.addEventListener("fullscreenchange", this.onFs);
    document.body.appendChild(this.root);
    const kb = scene.game.input.keyboard;
    if (kb) { this.prevKbd = kb.enabled; kb.enabled = false; }
    this.offDevice = onDeviceChange(() => {
      const now = this.deviceShape();
      if (now === this.shape) return;
      this.shape = now;
      this.render(false);
    });
    this.render(true);
  }

  close() {
    if (!this.root.isConnected) return;
    document.removeEventListener("keydown", this.onKey, true);
    document.removeEventListener("fullscreenchange", this.onFs);
    this.offDevice();
    this.root.remove();
    const kb = this.scene.game.input.keyboard;
    if (kb && this.prevKbd !== null) kb.enabled = this.prevKbd;
  }

  private deviceShape() { return `${orientation()}${isTouch()}`; }

  private exit() {
    this.close();
    this.opts.onExit?.();
  }

  private onFs = () => this.render(false);

  private onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    if (this.at === "audio") this.show("settings");
    else if (this.at === "settings" && this.opts.onExit) this.exit();
    else if (this.at !== "main") this.show("main");
  };

  private show(page: Page) {
    this.at = page;
    this.save = undefined;
    this.render(true);
  }

  private render(focus: boolean) {
    const s = loadSettings();
    this.root.style.fontSize = `${16 * s.textScale}px`;
    this.root.classList.toggle("calm", s.reducedMotion);
    const scroll = this.root.scrollTop;
    this.root.replaceChildren(({
      main: () => this.pageMain(),
      settings: () => this.pageSettings(s),
      audio: () => this.pageAudio(s),
      about: () => this.pageAbout(),
      telemetry: () => this.pageTelemetry(),
      confirmNew: () => this.pageConfirm(),
      map: () => this.pageMap(),
    })[this.at]());
    if (focus) {
      this.root.scrollTop = 0;
      const h = this.root.querySelector<HTMLElement>(".mn-h");
      h?.focus({ preventScroll: true });
    } else {
      this.root.scrollTop = scroll;
    }
  }

  private button(text: string, fn: () => void, cls = "") {
    return btn(`clay-btn ${cls}`.trim(), text, () => { sfx.play(this.scene, "ui_click"); fn(); });
  }

  private soon(text: string) {
    let timer = 0;
    const b = this.button(text, () => {
      b.textContent = "Sắp ra mắt";
      clearTimeout(timer);
      timer = window.setTimeout(() => { b.textContent = text; }, SOON_MS);
    }, "ghost");
    return b;
  }

  private heading(text: string, tag: "h1" | "h2" = "h2") {
    const h = el(tag, "mn-h", text);
    h.tabIndex = -1;
    h.style.outline = "0";
    return h;
  }

  private page(cls = "") {
    return el("div", `mn-page ${cls}`.trim());
  }

  private fitPage(title: string, tray: HTMLElement, ...foot: HTMLElement[]) {
    const p = this.page("mn-fit");
    p.append(this.heading(title), tray, el("div", "mn-foot"));
    p.lastElementChild!.append(...foot);
    return p;
  }

  private back(to: Page, label = "Quay lại") {
    return this.button(label, () => this.show(to), "ghost");
  }

  private pageMain() {
    if (this.save === undefined) this.save = peek().load();
    const save = this.save;
    const p = this.page("mn-main");
    const hero = el("div", "mn-hero");
    const logo = el("img", "mn-logo");
    logo.src = "art/logo.webp";
    logo.alt = GAME_TITLE;
    logo.draggable = false;
    const h = el("h1", "mn-h", "");
    h.tabIndex = -1;
    h.append(logo);
    hero.append(h, el("p", "mn-sub", "Một quán nhỏ đầu hẻm, Sài Gòn"));

    const stack = el("div", "mn-stack");
    const fresh = this.button("Chơi mới", () => this.show("map"), save ? "" : "red");
    if (save) {
      const info = [cleanName(save.shopName ?? ""), `ngày ${save.progress.dayIndex}`, vnd(save.money.cash)]
        .filter(Boolean).join(" · ");
      const cont = this.button("", () => this.continueRun(), "red");
      const col = el("span", "mn-btn-col", "Chơi tiếp");
      col.append(el("small", "", info));
      cont.append(col);
      stack.append(cont, fresh);
    } else {
      stack.append(fresh);
    }
    const modes = el("div", "mn-modes");
    modes.append(this.soon("Co-op"), this.soon("PvP"));
    stack.append(modes, this.button("Cài đặt", () => this.show("settings")), this.button("Giới thiệu", () => this.show("about")));
    p.append(hero, stack);
    return p;
  }

  private pageMap() {
    const p = this.page("mn-maps");
    const grid = el("div", "mn-map-grid");
    const hem = this.mapCard("art/map-hem.webp", "Quán đầu hẻm");
    hem.onclick = () => { sfx.play(this.scene, "ui_click"); this.startNew(); };
    const lot = this.mapCard("art/map-mat-tien.webp", "Mặt tiền đường lớn, đang khoá");
    lot.classList.add("locked");
    lot.disabled = true;
    const lock = el("span", "mn-lock");
    const [w, h, , , d] = faLock.icon;
    lock.innerHTML = `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true"><path fill="currentColor" d="${String(d)}"/></svg>`;
    lot.append(lock);
    grid.append(hem, lot);
    p.append(this.heading("Chọn nơi bán"), grid, this.back("main"));
    return p;
  }

  private mapCard(src: string, label: string) {
    const b = el("button", "mn-map");
    b.type = "button";
    b.setAttribute("aria-label", label);
    const img = el("img");
    img.src = src;
    img.alt = "";
    img.draggable = false;
    b.append(img);
    return b;
  }

  private startNew() {
    if (peek().hasSave()) { this.show("confirmNew"); return; }
    this.askTelemetryThenStart();
  }

  private askTelemetryThenStart() {
    if (loadSettings().telemetry === null) { this.show("telemetry"); return; }
    this.onStart("intro");
  }

  private continueRun() {
    if (peek().load()) this.onStart("day", { mode: "continue" });
  }

  private pageConfirm() {
    const save: SaveFile | null = peek().load();
    const p = this.page();
    const card = el("div", "mn-paper");
    card.append(this.heading("Xoá ván đang chơi?"));
    card.append(el("p", "mn-info", save
      ? `Đang chơi dở: ngày ${save.progress.dayIndex} · ${vnd(save.money.cash)}`
      : "Đang có một bản lưu."));
    card.append(el("p", "mn-info mn-muted mn-small", "Game chỉ lưu được một ván. Chơi mới là ván này mất luôn, không lấy lại được."));
    p.append(card, this.button("Giữ ván cũ", () => this.show("main"), "red"), el("div", "mn-gap"),
      this.holdButton("Xoá, chơi mới", () => this.askTelemetryThenStart()));
    return p;
  }

  private holdButton(text: string, fn: () => void) {
    const b = el("button", "clay-btn mn-hold");
    b.type = "button";
    b.append(el("span", "mn-hold-bar"), el("span", "mn-hold-t", text), el("small", "mn-hold-s", "giữ 1 giây"));
    let timer = 0;
    const stop = () => { clearTimeout(timer); timer = 0; b.classList.remove("holding"); };
    const start = () => {
      if (timer) return;
      b.classList.add("holding");
      timer = window.setTimeout(() => { stop(); sfx.play(this.scene, "ui_click"); fn(); }, HOLD_MS);
    };
    b.onpointerdown = (e) => { if (e.button === 0) start(); };
    b.onpointerup = b.onpointercancel = b.onpointerleave = stop;
    b.onkeydown = (e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); start(); } };
    b.onkeyup = stop;
    b.onblur = stop;
    b.oncontextmenu = (e) => e.preventDefault();
    return b;
  }

  private setTelemetry(on: boolean) {
    const s = loadSettings();
    s.telemetry = on;
    saveSettings(s);
    telemetry.enabled = on;
  }

  private pageTelemetry() {
    const p = this.page();
    const card = el("div", "mn-paper");
    card.append(this.heading("Ghi số liệu chơi thử?"));
    card.append(el("p", "mn-info mn-muted",
      "Game ghi vài con số vào máy này: một ngày dài bao lâu, khách nào bỏ đi. Không tự gửi đi đâu. "
      + "Muốn gửi cho người làm game thì vào Cài đặt, bấm Xuất số liệu. Đổi ý lúc nào cũng được."));
    p.append(card,
      this.button("Cứ ghi", () => { this.setTelemetry(true); this.askTelemetryThenStart(); }, "red"),
      this.button("Thôi, khỏi", () => { this.setTelemetry(false); this.askTelemetryThenStart(); }),
      this.back("main"));
    return p;
  }

  private sw(name: string, on: boolean, fn: () => void, note?: string) {
    const b = el("button", "mn-sw");
    b.type = "button";
    b.setAttribute("role", "switch");
    b.setAttribute("aria-checked", String(on));
    const t = el("span", "t");
    t.append(el("b", "", name));
    if (note) t.append(el("small", "", note));
    b.append(t, el("span", "mn-pill", onOff(on)));
    b.onclick = () => { sfx.play(this.scene, "ui_click"); fn(); };
    return b;
  }

  private seg<T extends string | number>(name: string, opts: [T, string][], cur: T, fn: (v: T) => void, note?: string) {
    const row = el("div", "mn-row");
    const head = el("div", "mn-row-h");
    head.append(el("b", "", name));
    row.append(head);
    if (note) row.append(el("small", "", note));
    const seg = el("div", "mn-seg");
    for (const [v, text] of opts) {
      const b = el("button", "", text);
      b.type = "button";
      b.setAttribute("aria-pressed", String(v === cur));
      b.onclick = () => { sfx.play(this.scene, "ui_click"); fn(v); };
      seg.append(b);
    }
    row.append(seg);
    return row;
  }

  private pageSettings(s: Settings) {
    const put = (patch: Partial<Settings>) => { Object.assign(s, patch); saveSettings(s); this.render(false); };
    const tray = el("div", "clay-tray mn-tray");

    tray.append(this.seg("Cỡ chữ", [[1, "100%"], [1.25, "125%"], [1.5, "150%"], [2, "200%"]], s.textScale,
      (v) => put({ textScale: v })));

    const au = el("button", "mn-sw");
    au.type = "button";
    au.dataset.go = "1";
    const t = el("span", "t");
    t.append(el("b", "", "Âm thanh"), el("small", "", s.masterVolume === 0 ? "tắt" : `tổng ${s.masterVolume}%`));
    au.append(t, el("span", "mn-pill", "›"));
    au.onclick = () => { sfx.play(this.scene, "ui_click"); this.show("audio"); };
    tray.append(au);

    tray.append(this.seg("Điều khiển cảm ứng", [["auto", "Tự động"], ["on", "Bật"], ["off", "Tắt"]], s.touchControls,
      (v) => { s.touchControls = v; saveSettings(s); notifyDeviceChange(); this.render(false); }));

    if (fullscreenSupported()) {
      tray.append(this.sw("Toàn màn hình", isFullscreen(),
        toggleFullscreen));
    }
    tray.append(
      this.sw("Giảm chuyển động", s.reducedMotion, () => put({ reducedMotion: !s.reducedMotion }),
        "tắt xe chạy qua, lá bay, rung màn hình"),
      this.sw("Mũi tên trên đầu mình", s.playerMarker, () => put({ playerMarker: !s.playerMarker }),
        "tự mờ đi khi đang đi, sáng lại lúc đứng yên"),
      this.sw("Bỏ giới hạn thời gian", s.noTimePressure, () => put({ noTimePressure: !s.noTimePressure }),
        "khách bỏ đi vì mình làm sai, không vì mình chậm"),
      this.sw("Ghi số liệu chơi thử", !!s.telemetry, () => { put({ telemetry: !s.telemetry }); telemetry.enabled = !!s.telemetry; },
        "nằm trong máy này, không tự gửi đi đâu"),
    );
    return this.fitPage("Cài đặt", tray, this.button("Xuất số liệu", () => this.exportData(), "ghost"),
      this.opts.onExit ? this.button("Quay lại", () => this.exit(), "ghost") : this.back("main"));
  }

  private exportData() {
    const name = `byesep-telemetry-${new Date().toISOString().slice(0, 10)}.jsonl`;
    const file = new File([telemetry.exportJsonl()], name, { type: "application/x-ndjson" });
    if (navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file], title: name }).catch(() => {});
      return;
    }
    telemetry.download();
  }

  private slider(s: Settings, name: string, key: Chan, note: string, wake?: boolean) {
    const row = el("div", "mn-row");
    const head = el("div", "mn-row-h");
    const val = el("span", "", "");
    head.append(el("b", "", name), val);
    const range = el("input", "mn-range");
    range.type = "range";
    range.min = "0"; range.max = "100"; range.step = "5";
    range.setAttribute("aria-label", name);
    const paint = () => {
      const v = s[key];
      range.value = String(v);
      range.style.setProperty("--p", `${v}%`);
      val.textContent = v === 0 ? "tắt" : `${v}%`;
      minus.disabled = v <= 0;
      plus.disabled = v >= 100;
    };
    const set = (v: number) => {
      s[key] = Math.max(0, Math.min(100, v));
      saveSettings(s);
      music.applySettings(s);
      sfx.applySettings(s);
      paint();
    };
    const step = (txt: string, label: string, d: number) => {
      const b = el("button", "mn-step", txt);
      b.type = "button";
      b.setAttribute("aria-label", label);
      b.onclick = () => { set(s[key] + d); if (wake) music.play("menu", 400); };
      return b;
    };
    const minus = step("−", `Giảm ${name}`, -5);
    const plus = step("+", `Tăng ${name}`, 5);
    range.oninput = () => set(Number(range.value));
    range.onchange = () => { if (wake) music.play("menu", 400); };
    const line = el("div", "mn-slider");
    line.append(minus, range, plus);
    row.append(head, el("small", "", note), line);
    paint();
    return row;
  }

  private pageAudio(s: Settings) {
    const put = (patch: Partial<Settings>) => {
      Object.assign(s, patch);
      saveSettings(s);
      music.applySettings(s);
      sfx.applySettings(s);
      this.render(false);
    };
    const tray = el("div", "clay-tray mn-tray");
    tray.append(
      this.slider(s, "Âm lượng tổng", "masterVolume", "nhân vào mọi kênh bên dưới", true),
      this.slider(s, "Nhạc nền", "musicVolume", "nhạc theo giờ trong ngày", true),
      this.slider(s, "Tiếng đường phố", "streetVolume", "hẻm, xe máy, còi, mưa, chó, chim"),
      this.slider(s, "Tiếng người lao xao", "crowdVolume", "nằm trong tiếng đường phố, chỉnh riêng được"),
      this.slider(s, "Giọng người", "voiceVolume", "tiếng khách — kênh duy nhất không bị gì đè lên"),
      this.slider(s, "Tiếng thao tác", "foleyVolume", "dao, vỏ bánh, gói giấy, tiền lẻ"),
      this.slider(s, "Âm báo", "uiVolume", "click, chốt đơn, chuyển ngày"),
      el("div", "mn-tray-h", "Trợ năng"),
      this.sw("Tắt âm báo tiêu cực", s.disableNegativeAudioCues, () => put({ disableNegativeAudioCues: !s.disableNegativeAudioCues }),
        "vẫn nghe bánh rơi, bánh khét, ruồi bay — chỉ bỏ tiếng chê"),
      this.sw("Báo khi có người để ý", s.a11yPerceptionPing, () => put({ a11yPerceptionPing: !s.a11yPerceptionPing }),
        "một tiếng gõ gỗ, lệch về phía người đang nhìn"),
      this.sw("Gộp về một kênh", s.monoAudio, () => put({ monoAudio: !s.monoAudio }),
        "bỏ trái–phải, dồn hết vào giữa"),
    );
    return this.fitPage("Âm thanh", tray, this.back("settings"));
  }

  private pageAbout() {
    const card = el("div", "mn-paper mn-tray mn-about");
    for (const t of [
      "Phương Anh, 24 tuổi, nghỉ việc văn phòng sau hai năm OT không lương. Cô dồn hết tiền tiết kiệm thuê một mặt bằng nhỏ đầu hẻm và mở quán bánh mì.",
      "Khách đứng ngay trước quầy, thấy hết mọi thứ bạn làm, rồi chấm sao trên điện thoại.",
      "Đủ tiền thì mở chi nhánh 2. Hết tiền hoặc bị đóng cửa vì an toàn thực phẩm thì mất quán.",
    ]) card.append(el("p", "", t));
    card.append(el("p", "mn-muted", hint(
      "WASD đi · E làm việc · Tab điện thoại · Esc tạm dừng. Còn lại game nhắc khi tới lúc.",
      "Cần joystick góc trái dưới để đi, nút lớn góc phải dưới để làm việc. Nút tạm dừng và điện thoại nằm trên thanh trên cùng.",
    )));
    const tracks = [...new Set(Object.values(CUES).map((c) => c.title))].join(" · ");
    const credit = el("div", "mn-credit");
    credit.append(
      el("p", "", `Nhạc tạm: ${tracks} — Kevin MacLeod (incompetech.com), CC BY 4.0.`),
      el("p", "", "Tiếng động tạm: thư viện Freesound, toàn bộ giấy phép CC0. Nền hẻm, chợ và tiếng người là bản thu thật ở TP.HCM."),
      el("p", "", "Biểu tượng trong app VietSoci: Font Awesome Free (fontawesome.com), CC BY 4.0."),
      el("p", "", `Bản dựng thử v0.2${PLAYTEST ? " · chơi thử" : ""}`),
    );
    card.append(credit);
    return this.fitPage("Giới thiệu", card, this.back("main"));
  }
}
