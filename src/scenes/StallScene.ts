import Phaser from "phaser";
import { GAME_W, GAME_H } from "../core/config";
import { PEAK_START_MIN, type Clock } from "../core/clock";
import { bus, type EventKey, type EventMap } from "../core/eventbus";
import { NEGATIVE_STIMS, type StallCloseReason, type StimId } from "../core/types";
import type { GameContext } from "../core/context";
import { SEASON_DAYS, loadSettings, type Settings } from "../core/save";
import { DEV_TOOLS, PLAYTEST } from "../core/flags";
import { telemetry } from "../core/session";
import { Service } from "../sim/service";
import { SALIENCE } from "../sim/perception";
import { runFrame } from "../sim/frame";
import { cool, isWarm } from "../sim/loaf";
import { Steam } from "../ui/stall/Steam";
import { BubblePool } from "../ui/stall/BubblePool";
import { dev } from "../dev/registry";
import type { DayScene } from "./DayScene";
import { diffDish, type Ingredient } from "../sim/order";
import { Oven, CRUST, OVEN_SLOTS, bandOfCrust } from "../sim/oven";
import { Grip, RUN_TEMPO, WALK_TEMPO } from "../sim/grip";
import { orderDefectKey } from "../core/stimid";
import type { Occluder } from "../sim/perception";
import { presetDish, type Preset } from "../sim/presets";
import { CustomerActor } from "../entities/CustomerActor";
import { AssemblyPanel } from "../ui/AssemblyPanel";
import { TH, TW, depthOf, toScreen } from "../world/iso";
import { SIGN_TILE, WORLD_H, WORLD_W, assertWalkable, floorAt, isSunlit, tileAt } from "../world/map";
import {
  STATIONS, blockedReason, stationAtTile, stationNear, type Station,
} from "../world/stations";
import {
  BASE, FX, TILE, buildTextures, createSign, floorTextureAt, footY, textureForTile,
} from "../art";
import { Player } from "../entities/Player";
import { Hud } from "../ui/Hud";
import { UI, button, buttonHeight, label, panel, textScale, FONT } from "../ui/theme";
import { music, type CueId } from "../audio/music";

/** Lớp nhãn trạm: trên mọi đạo cụ, dưới HUD. */
const LABEL_DEPTH = 8_000_000;

/**
 * Sự kiện tiêu cực làm NHẠC DỪNG (P5-03 §6.5 #2): trong một game mà im lặng là
 * một trong các phản ứng, nhạc chạy đè lên là nuốt mất khoảnh khắc đó.
 * Dừng đúng lúc một khách chạm `CONFIRMED`, không phải lúc kích thích phát ra.
 */
const HUSH_ON: ReadonlySet<StimId> = new Set<StimId>(["BURNT_OR_COLD", "DROPPED_FOOD"]);

/** Nhạc dừng bao nhiêu giây sau một sự kiện tiêu cực (P5-03 §6.5 #2). */
const HUSH_SECONDS = 6;

/**
 * Quán bánh mì ở góc hẻm — scene này chỉ ĐIỀU PHỐI.
 * Vẽ cảnh: `art/`. Nhân vật: `entities/Player`. Thông tin: `ui/Hud`.
 * Luật trạm: `world/stations`. Bản đồ: `world/map`.
 *
 * KHÔNG dùng Container để gom cảnh: Container của Phaser không depth-sort con,
 * bỏ vào đó là mọi `setDepth` mất tác dụng và vật phía sau đè lên vật phía trước.
 * Thay vào đó mọi thứ nằm thẳng trên display list (có sort) và cả cảnh được
 * canh giữa bằng CAMERA SCROLL. HUD miễn nhiễm nhờ `setScrollFactor(0)`.
 */
export class StallScene extends Phaser.Scene {
  private ctx!: GameContext;
  private day!: DayScene;
  private settings!: Settings;
  /** Đồng hồ của cả ngày — sống trong ctx, scene chỉ mượn (P0-01 §2.3). */
  private clock!: Clock;

  private player!: Player;
  private hud!: Hud;
  private ring!: Phaser.GameObjects.Image;
  private bubbles!: BubblePool;

  private near: Station | null = null;

  private service!: Service;
  private actors = new Map<string, CustomerActor>();
  private assembly!: AssemblyPanel;
  /** Nhân đang kẹp trong ổ bánh trên tay. */
  private dish: Ingredient[] = [];
  /**
   * Ổ bánh đang GÁC trên thớt (đã mở bảng kẹp nhân rồi đóng lại chưa gói) và phần nhân
   * đã kẹp dở. `null` = thớt trống. Gác được thì người chơi không bị nhốt trong bảng:
   * đi rót trà, canh lò, rồi quay lại kẹp tiếp.
   */
  private boardLoaf: Ingredient[] | null = null;
  /** `warmth` của ổ trên tay và ổ gác trên thớt — P1-01 §2.4, 1 = vừa ra lò. */
  private handWarmth = 0;
  private boardWarmth = 0;
  private handSteam!: Steam;
  private boardSteam!: Steam;
  /** Độ giòn của ổ đang cầm (P1-01 §2.4). */
  private handCrust = 0;
  /** Lò 3 slot chạy nền — bỏ ổ vào rồi đi làm việc khác được. */
  private oven = new Oven();
  private ovenGfx!: Phaser.GameObjects.Graphics;
  /** Toạ độ nhãn tên trạm — để vẽ chỉ báo NGAY TRÊN nhãn, không bị nhãn che. */
  private labelY = new Map<string, { x: number; y: number }>();
  /** Độ chắc tay với món đang cầm (P1-01 §2.7). */
  private grip = new Grip();
  private gripGfx!: Phaser.GameObjects.Graphics;
  /** Tay bận tới giây này (đang hỏi chuyện, đang bỏ đồ vô thùng) — đi được, làm không được. */
  private handsBusyUntil = 0;
  /** Vừa xong một thao tác giữ phím — phải nhả phím ra mới bắt đầu lần mới. */
  private holdLatch = false;
  /**
   * Tay sạch hay dính tiền — P1-01 §2.8. Doc tách tay trái / tay phải; bản dựng gộp làm một
   * (cầm tiền là "cả tay") cho tới khi có hoạt ảnh hai tay.
   */
  private hands: "CLEAN" | "MONEY" = "CLEAN";
  /** Mỗi lần tay dơ là một "đợt" — cùng một đợt thì khách càng nhìn càng chắc, rửa tay là sang đợt mới. */
  private dirtyEpisode = 0;
  /** FLOURISH không lặp với cùng một người trong 90 s (P1-01 §2.9 norepeat). */
  private lastFlourish = new Map<string, number>();
  private dirtGfx!: Phaser.GameObjects.Graphics;
  private lastMinutes = 0;
  /** Giây THẬT kể từ lúc mở quầy — thang thời gian của tầng nhận thấy. */
  private elapsed = 0;
  /** Trạm đang giữ phím + số ms đã giữ. Một chỗ duy nhất giữ state của thao tác. */
  private busy: { st: Station; ms: number } | null = null;
  /**
   * Thao tác người chơi xếp hàng ở đây và chỉ được ÁP ở bước 2 (craft) của frame —
   * để mọi `stim` phát ra TRƯỚC bước perception của cùng frame (P0-01 §2.4).
   */
  private intents: (() => void)[] = [];

  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private paused = false;
  private closed = false;
  private resumed = false;
  private overlay: Phaser.GameObjects.Container | null = null;
  /** Esc trong một hộp con thì quay lại hộp cha, không đóng hẳn. */
  private overlayBack: (() => void) | null = null;
  private off: (() => void)[] = [];

  constructor() { super("stall"); }

  init(data: { ctx: GameContext; day: DayScene; resume?: boolean }) {
    this.ctx = data.ctx;
    this.day = data.day;
    this.clock = data.ctx.clock;
    this.settings = loadSettings();
    this.near = null;
    this.busy = null;
    this.paused = false;
    this.closed = false;
    this.overlay = null;
    this.dish = [];
    this.boardLoaf = null;
    this.handWarmth = 0;
    this.boardWarmth = 0;
    this.handCrust = 0;
    this.oven = new Oven();
    this.grip = new Grip();
    this.handsBusyUntil = 0;
    this.hands = "CLEAN";
    this.lastFlourish = new Map();
    this.intents = [];
    this.elapsed = 0;
    this.actors.clear();
    this.off = [];
    // Reload giữa buổi: đồng hồ đã được DayScene đặt về đúng giờ đã lưu.
    this.resumed = !!data.resume;
    if (!this.resumed) this.clock.reset();
    this.clock.paused = false;
    // CANON §15.2 / P0-02 §2.2: đồng hồ VẪN trôi, chỉ chậm một nửa.
    this.clock.scaleMul = this.settings.noTimePressure ? 0.5 : 1;
  }

  private get world() { return this.ctx.world; }

  create() {
    // Vỡ ngay nếu ai đó vừa sửa bản đồ mà chặn mất cổng khách hay chỗ xếp hàng.
    if (import.meta.env.DEV) assertWalkable();

    buildTextures(this);
    this.cameras.main.setBackgroundColor("#6f838d");

    this.bakeGround();
    this.centerCamera(this.placeProps());

    this.ring = this.add.image(0, 0, FX.ring).setOrigin(0.5, 0.5).setVisible(false);

    this.player = new Player(this);
    this.player.reset();

    this.hud = new Hud(this, this.settings, () => (this.paused ? this.resume() : this.pause()));
    this.handSteam = new Steam(this);
    this.boardSteam = new Steam(this);
    this.ovenGfx = this.add.graphics().setDepth(LABEL_DEPTH + 2);
    this.gripGfx = this.add.graphics();
    this.dirtGfx = this.add.graphics().setDepth(LABEL_DEPTH - 3);
    this.lastMinutes = this.clock.minutes;
    this.bubbles = new BubblePool(this, this.settings.textScale, undefined, () => {
      telemetry.bubblePoolSteals++;
      bus.emit("telemetry:mark", { key: "bubble.steal", value: 1 });
    });

    // Seed cố định theo ngày -> phát lại ngày đó ra y hệt, chống save-scum (CANON §8e).
    // State NPC + bag thoại nằm thẳng trong world: phải sống xuyên ngày.
    const w = this.world;
    this.service = new Service({
      bus, hub: this.ctx.rng, saveId: w.saveId, day: w.progress.dayIndex,
      npcs: w.npcs, bags: w.shuffleBags,
      resumeAt: this.resumed ? this.clock.minutes : undefined,
    });
    this.assembly = new AssemblyPanel(this,
      (dish, even) => this.intents.push(() => this.finishDish(dish, even)),
      (dish) => { this.boardLoaf = dish; },
      (id) => this.intents.push(() => this.onPlace(id)),
      (i) => this.usePreset(i),
    );
    this.bindInput();
    this.wire();

    if (DEV_TOOLS) {
      dev.stall = {
        service: this.service,
        end: () => this.close("PLAYER"),
        fire: (id, zone) => this.emit(id as StimId, zone as Station["slot"] | undefined),
        gameObjects: () => this.children.length,
      };
    }

    music.duck(false);
    this.syncMusic();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      // Rời quầy giữa lúc pause ("Lưu và về sảnh", "Chơi lại ngày này"): nhạc đang bị hạ
      // −12 dB phải trả về, và phải báo hết pause cho telemetry.
      if (this.paused && !this.closed) {
        music.duck(false);
        bus.emit("ui:pauseToggled", { paused: false, source: "MENU" });
      }
      for (const f of this.off) f();
      this.off = [];
      this.service.dispose();
      for (const a of this.actors.values()) a.destroy();
      this.actors.clear();
      if (DEV_TOOLS && dev.stall?.service === this.service) dev.stall = null;
    });
  }

  private listen<K extends EventKey>(k: K, fn: (p: EventMap[K]) => void) {
    this.off.push(bus.on(k, fn));
  }

  /** Scene NGHE bus — không ai gọi thẳng vào scene. */
  private wire() {
    // KHÔNG ghi "· ổ bánh không đúng đơn" hay "· nhớ đúng" lên màn hình: đó là hệ thống
    // chấm điểm thay cho khách — "tick xanh / X đỏ" mà P1-04 §2.10 cấm, và làm T1/T2 vô
    // nghĩa. Người chơi chỉ biết qua MẶT và LỜI của khách.
    this.listen("perception:confirmed", (p) => {
      if (HUSH_ON.has(p.stimId)) music.hush(HUSH_SECONDS);
      // Build playtest (P0-03 §2.4): hỏi NGAY TẠI KHOẢNH KHẮC, không hỏi cuối buổi —
      // hỏi cuối buổi thì người chơi đã ghép mảnh sau đó và trả lời đúng một cách giả.
      if (PLAYTEST && NEGATIVE_STIMS.has(p.stimId)) this.pause("PLAYTEST");
    });
    this.listen("npc:left", (p) => {
      if (p.reason === "IMPATIENT") this.world.progress.today.lost++;
    });
    this.listen("save:written", () => this.hud.flashSaved());
  }

  // ───────────────────────────────────────────────────────────────── dựng cảnh

  /**
   * Cả góc quán nằm gọn một khung hình — không có camera đi lang thang (CANON T1).
   *
   * Canh theo HÌNH BAO THẬT của những gì đã dựng, không theo hình bao của lưới ô:
   * tường cao nhô lên trên hàng đầu tiên cả trăm pixel, canh theo lưới là cắt mất ngọn.
   * Canh bằng scroll của camera, không bằng vị trí của Container (Container không sort depth).
   */
  private centerCamera(scene: Phaser.GameObjects.Image[]) {
    const bounds = new Phaser.Geom.Rectangle();
    scene.forEach((img, i) => {
      const b = img.getBounds();
      if (i === 0) bounds.setTo(b.x, b.y, b.width, b.height);
      else Phaser.Geom.Rectangle.Union(bounds, b, bounds);
    });
    this.cameras.main.setScroll(
      bounds.centerX - GAME_W / 2,
      bounds.centerY - GAME_H / 2,
    );
  }

  /**
   * Nền không bao giờ đổi -> nướng hết vào MỘT RenderTexture.
   * Gọi drawFrame() cho từng ô riêng lẻ sẽ tụt fps thấy rõ khi map to ra.
   */
  private bakeGround() {
    const minX = toScreen(0, WORLD_H).sx - TW;
    const minY = toScreen(0, 0).sy - TH;
    const w = toScreen(WORLD_W, 0).sx - minX + TW;
    const h = toScreen(WORLD_W, WORLD_H).sy - minY + TH + BASE * 2;

    const rt = this.add.renderTexture(minX, minY, w, h).setOrigin(0, 0).setDepth(-1_000_000);
    const put = (key: string, tx: number, ty: number) => {
      const { sx, sy } = toScreen(tx + 0.5, ty + 0.5);
      rt.batchDrawFrame(key, undefined, sx - minX - (TW + 2) / 2, footY(sy) - minY - (TH + BASE + 2));
    };

    rt.beginDraw();
    for (let ty = 0; ty < WORLD_H; ty++)                 // sàn quán / vỉa hè / mặt đường
      for (let tx = 0; tx < WORLD_W; tx++) put(floorTextureAt(floorAt(tx, ty), tx, ty), tx, ty);
    for (let ty = 0; ty < WORLD_H; ty++)                 // vạt nắng dán chồng lên sàn
      for (let tx = 0; tx < WORLD_W; tx++) if (isSunlit(tx, ty)) put(TILE.sun, tx, ty);
    rt.endDraw();
  }

  /** Mọi thứ đứng trên sàn: duyệt bản đồ một lần, ra sprite có depth đúng. */
  private placeProps() {
    const placed: Phaser.GameObjects.Image[] = [];
    for (let ty = 0; ty < WORLD_H; ty++) {
      for (let tx = 0; tx < WORLD_W; tx++) {
        const code = tileAt(tx, ty);
        const key = textureForTile(code, tx, ty, {
          isCounterEnd: code === "Q" && (tileAt(tx - 1, ty) !== "Q" || tileAt(tx + 1, ty) !== "Q"),
          isStation: stationAtTile(tx, ty) !== null,
        });
        if (!key) continue;

        const img = this.addAt(key, tx, ty);
        placed.push(img);
        const st = stationAtTile(tx, ty);
        if (st) this.addStationLabel(st, img);
      }
    }

    // Bảng hiệu nằm trong mặt vách của tường sau.
    // Depth phải vượt TOÀN BỘ hàng tường y=0: bảng rộng bằng mấy ô, mà ô bên phải
    // cùng hàng lại có depth cao hơn -> để depth theo ô của chính nó thì bị cắt mất
    // nửa bên phải. Không ảnh hưởng các hàng sau vì chúng nằm ở dải x khác hẳn.
    const { sx, sy } = toScreen(SIGN_TILE.x, SIGN_TILE.y);
    createSign(this, sx, sy, depthOf(WORLD_W, 0) + 1);

    return placed;
  }

  private addAt(key: string, tx: number, ty: number) {
    const { sx, sy } = toScreen(tx + 0.5, ty + 0.5);
    return this.add.image(sx, footY(sy), key)
      .setOrigin(0.5, 1)
      .setDepth(depthOf(tx + 0.5, ty + 0.5));
  }

  /**
   * Tên trạm dán ngay trên đạo cụ, để không ai phải đoán khối nào là lò, khối nào là kệ.
   * Nhãn nằm trên MỘT lớp riêng cao hơn mọi đạo cụ — nếu để depth theo ô thì bảng hiệu
   * hay khúc xe ở gần camera hơn sẽ che mất nhãn của trạm phía sau.
   */
  private addStationLabel(st: Station, img: Phaser.GameObjects.Image) {
    const y = img.y - img.displayHeight - 5;
    this.labelY.set(st.id, { x: img.x, y });
    const t = this.add.text(img.x, y, st.name, {
      fontFamily: FONT, fontSize: `${Math.round(11 * this.settings.textScale)}px`, fontStyle: "500", color: "#f4f1e8",
    }).setOrigin(0.5).setDepth(LABEL_DEPTH + 1);

    const g = this.add.graphics().setDepth(LABEL_DEPTH);
    g.fillStyle(0x1b2429, 1);
    g.fillRoundedRect(img.x - t.width / 2 - 8, y - t.height / 2 - 3, t.width + 16, t.height + 6, 8);
  }

  // ───────────────────────────────────────────────────────────────────── input

  private bindInput() {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys("W,A,S,D,UP,LEFT,DOWN,RIGHT,E,SPACE,Q,ESC,SHIFT,C,F,P") as any;

    // MỘT handler duy nhất phân luồng phím. Phaser bắn `keydown-E` TRƯỚC `keydown`
    // chung, nên tách hai handler thì cú E mở bảng lại bị chính nó bấm "Gói lại"
    // ngay trong cùng sự kiện — bảng vừa mở đã đóng, ổ bánh rỗng thành "đã kẹp".
    // Esc: đang mở bảng kẹp nhân thì GÁC ổ lại (đóng bảng); ngoài ra là pause thật (CANON §15.2).
    // Phaser có lúc phát lại CÙNG MỘT sự kiện phím DOM vài lần trong một frame chậm
    // (đo được: bấm "1" một lần mà bảng kẹp nhân nhận ba phần pate). Nhận diện theo
    // chính object sự kiện để mỗi lần bấm chỉ được tính đúng một lần.
    const seenEsc = new WeakSet<KeyboardEvent>(), seenKey = new WeakSet<KeyboardEvent>();
    const first = (set: WeakSet<KeyboardEvent>, ev: KeyboardEvent) => !set.has(ev) && !!set.add(ev);
    kb.on("keydown-ESC", (ev: KeyboardEvent) => {
      if (!first(seenEsc, ev) || this.closed) return;
      if (!this.paused && this.assembly.isOpen) { this.assembly.park(); return; }
      if (this.overlay && this.overlayBack) this.overlayBack();
      else if (this.paused) this.resume();
      else this.pause();
    });
    kb.on("keydown", (ev: KeyboardEvent) => {
      if (!first(seenKey, ev)) return;
      if (ev.code === "KeyP" && this.paused && !this.overlayBack) { this.resume(); return; }
      if (ev.code === "Escape" || ev.repeat || this.paused) return;
      if (ev.code === "KeyP") { this.pause(); return; }   // "tạm dừng MỌI LÚC" (CANON §15.2)
      if (this.assembly.isOpen) { this.assembly.handleKey(ev.code); return; }
      // Không làm ngay: xếp hàng để áp ở bước craft của frame kế (P0-01 §2.4).
      if (ev.code === "KeyQ") this.intents.push(() => this.discard());
      else if (ev.code === "KeyE" || ev.code === "Space") this.intents.push(() => this.press());
      else if (ev.code === "KeyF") this.intents.push(() => this.askFront());
    });
  }

  private holdingWorkKey() {
    return this.keys.E.isDown || this.keys.SPACE.isDown;
  }

  // ──────────────────────────────────────────────────────────────────── update

  /**
   * Vòng đời một frame — đúng thứ tự P0-01 §2.4, qua `runFrame` để test bắt được
   * nếu ai đó đổi thứ tự. Pause = đồng hồ trả `dt = 0` → chỉ vẽ lại, không hệ nào chạy.
   */
  update(_t: number, dtMs: number) {
    runFrame({
      clock: (raw) => {
        frameDeltas.push(raw);
        if (frameDeltas.length > 5400) frameDeltas.shift();
        this.clock.busy = this.service.busy;
        return this.closed ? 0 : this.clock.advance(raw);
      },
      input: (dt) => {
        this.player.move({
          up: this.keys.W.isDown || this.keys.UP.isDown,
          down: this.keys.S.isDown || this.keys.DOWN.isDown,
          left: this.keys.A.isDown || this.keys.LEFT.isDown,
          right: this.keys.D.isDown || this.keys.RIGHT.isDown,
          run: this.keys.SHIFT.isDown,
        }, dt);
        this.near = stationNear(this.player.x, this.player.y);
        // Đi khỏi thớt khi bảng đang mở = gác ổ lại, không phải bỏ ổ.
        if (this.assembly.isOpen && this.near?.id !== "board") this.assembly.park();
        // đi khỏi trạm là huỷ thao tác — không cho "giữ phím rồi chạy đi chỗ khác"
        if (this.busy && this.near?.id !== this.busy.st.id) this.busy = null;
      },
      craft: (dt) => {
        for (const act of this.intents.splice(0)) act();
        this.tickStation(dt * 1000);
        for (const _ of this.oven.tick(dt)) {
          // cháy trong lò: có MÙI — cả hàng cùng biết, kể cả người đang bấm điện thoại
          bus.emit("stim:emitted", { stimId: "BURNT_OR_COLD", zone: "OVEN", salience: SALIENCE.BURNT_OR_COLD, at: this.elapsed, smell: true });
          this.hud.log("khét rồi!");
        }
        this.tickGrip(dt);
        // P1-02 §2.10: quầy bẩn dần theo giờ bán, dù không ai làm gì sai
        this.addDirt(0.0015 * Math.max(0, this.clock.minutes - this.lastMinutes));
        this.lastMinutes = this.clock.minutes;
        this.service.dirt = this.dirt;
        // Trục nguội chạy nền, không ai điều khiển, luôn chống lại người chơi (P1-01 §2.5).
        const weather = this.world.progress.weather;
        if (this.player.hand === "loaf_hot" || this.player.hand === "loaf_filled") this.handWarmth = cool(this.handWarmth, dt, weather);
        if (this.boardLoaf) this.boardWarmth = cool(this.boardWarmth, dt, weather);
      },
      perception: (dt) => {
        this.elapsed += dt;
        this.service.perceive(dt, this.elapsed, this.occluders());
      },
      npc: (dt) => {
        this.service.tickNpcs(dt, {
          minutes: this.clock.minutes,
          // CANON §15.2: chế độ không giới hạn thời gian -> kiên nhẫn đứng yên.
          // Khách vẫn bỏ đi vì bạn làm SAI, nhưng không bao giờ vì bạn CHẬM.
          pressure: !this.settings.noTimePressure,
          dayOver: this.clock.isOver,
        });
        this.drainService();
      },
      dialog: (dt) => {
        this.service.tickDialog(dt);
        this.drainService();
        telemetry.dialogDeferred = this.service.dialogDeferred;
        // Hết giờ thì khách đang chờ được mời về (`closed`); đợi họ đi khuất mới đóng quầy.
        if (this.clock.isOver && !this.service.busy) this.close("CLOCK");
      },
      render: () => this.renderSync(),
      renderPaused: () => this.renderSync(),
    }, dtMs);
  }

  /** Bước 6: CHỈ ĐỌC state vừa tính rồi vẽ. Không đọc input, không đổi state. */
  private renderSync() {
    this.syncActors();
    this.syncMusic();
    this.player.draw(this.settings.reducedMotion);
    for (const a of this.actors.values()) a.draw(this.settings.reducedMotion, this.time.now, this.zonePoint, this.elapsed);
    this.drawRing();
    this.drawSteam();
    this.drawOven();
    this.drawGrip();
    this.drawDirt();
    const ticket = this.frontTicket();
    this.hud.dockFeed(this.assembly.isOpen);
    this.hud.update({
      day: this.world.progress.dayIndex, seasonDays: SEASON_DAYS, clock: this.clock,
      money: this.world.money.cash, served: this.world.progress.today.served,
      // bảng kẹp nhân đang mở thì không nhắc gì về trạm (dòng nhắc nằm ngay sau lưng bảng)
      near: this.assembly.isOpen ? null : this.near, hand: this.player.hand, busy: this.busy,
      frozen: this.paused || this.closed,
      ticket: ticket,
      carry: this.player.hand === "loaf_filled" ? this.dish : null,
      hands: this.hands,
      prompt: this.handsBusy ? "tay đang bận…"
        : this.near?.id === "oven" ? this.ovenPrompt()
        : this.near?.id === "board" && !this.boardLoaf && this.player.hand === "empty" ? "thớt — bấm E để lau thớt"
        : this.near?.id === "board" && this.boardLoaf
        ? (this.player.hand === "empty"
          ? `thớt — bấm E để kẹp tiếp (${this.boardLoaf.length} phần đã kẹp)`
          : "thớt — đang có ổ kẹp dở, tay phải rảnh mới kẹp tiếp")
        : null,
    });
  }

  /**
   * Điểm màn hình của từng vùng quầy — đích của tia nhìn. TAY là chỗ người chơi đang đứng
   * (tay đi theo người), còn lò / thớt / gầm quầy là chỗ cố định của trạm.
   */
  private zonePoint = (slot: Station["slot"]) => {
    // Bảng kẹp nhân đang mở: "thớt" và "tay" chính là ổ bánh trong bảng — tia chỉ vào đó.
    if ((slot === "BOARD" || slot === "HANDS") && this.assembly.isOpen) return this.assembly.loafPoint;
    if (slot === "HANDS") {
      const h = this.player.heldSprite;
      if (h.visible) return { x: h.x, y: h.y };
      const { sx, sy } = toScreen(this.player.x, this.player.y);
      return { x: sx, y: footY(sy) - 40 };
    }
    const id = slot === "OVEN" ? "oven" : slot === "BOARD" ? "board" : "shelf";
    const st = STATIONS.find((x) => x.id === id)!;
    const { sx, sy } = toScreen(st.tx + 0.5, st.ty + 0.5);
    return { x: sx, y: footY(sy) - 30 };
  };

  private ovenPrompt(): string {
    const h = this.player.hand, n = this.oven.count;
    if (h === "loaf_cold") return this.oven.hasRoom ? `lò than — bấm E bỏ ổ vô (${n}/${OVEN_SLOTS})` : "lò than — lò đầy rồi";
    if (h === "empty") return n ? "lò than — bấm E lấy ổ chín nhất ra" : "lò than — lò trống, lấy ổ bánh ở kệ trước";
    return "lò than — tay đang cầm đồ";
  }

  /**
   * Phiếu đơn = ĐÚNG câu khách nói, nguyên văn, ghim suốt lượt (P1-03 §2.4.3). Không phải
   * checklist đã phân tích sẵn — checklist làm hộ người chơi phần NGHE, giết T2. "Như mọi bữa"
   * thì phiếu cũng chỉ ghi đúng câu đó: nhớ là việc của người chơi. Không đổi màu theo độ
   * sốt ruột — đó là một thanh kiên nhẫn trá hình (P1-04 §2.10).
   */
  private frontTicket() {
    const c = this.service.front;
    if (!c || !c.orderLine || c.phase === "leaving") return null;
    return { name: c.name, text: `"${c.orderLine}"`, urgent: false };
  }

  /** Dựng / dọn sprite khách theo danh sách trong `Service`. */
  private syncActors() {
    const live = new Set<string>();
    for (const c of this.service.customers) {
      live.add(c.id);
      if (!this.actors.has(c.id)) this.actors.set(c.id, new CustomerActor(this, c, this.bubbles, this.settings.textScale));
    }
    for (const [id, actor] of this.actors) {
      if (live.has(id)) continue;
      actor.destroy();
      this.actors.delete(id);
    }
  }

  private drainService() {
    for (const ev of this.service.drain()) {
      if (ev.kind === "log") { this.hud.log(ev.text); continue; }
      const w = this.world;
      if (ev.kind === "cost") {                        // trà là MỜI: tốn tiền, không phải bán
        w.money.cash -= ev.amount;
        bus.emit("money:changed", { delta: -ev.amount, balance: w.money.cash, reason: "TEA" });
        continue;
      }
      w.money.cash += ev.amount;
      w.progress.today.revenue += ev.amount;
      w.progress.today.served++;
      bus.emit("money:changed", { delta: ev.amount, balance: w.money.cash, reason: "SALE" });
    }
  }

  /** Thao tác giữ phím. Lò là chỗ duy nhất có "quá tay" — vạch đỏ luôn nhìn thấy (CANON T5). */
  private tickStation(dtMs: number) {
    const st = this.near;
    // Lò không còn là "giữ phím canh 0,8 s" — nó là lò nền 3 slot (xem `pressOven`).
    const usable = st && st.id !== "oven" && !this.handsBusy && !blockedReason(st, this.player.hand) && st.holdMs > 0;

    if (!this.holdingWorkKey()) this.holdLatch = false;
    if (!usable || !this.holdingWorkKey() || this.holdLatch) {
      // thả tay đúng lúc bánh vừa vàng thì ăn; thả sớm thì huỷ, không phạt
      if (this.busy && this.busy.st.overcookMs && this.busy.ms >= this.busy.st.holdMs) {
        this.finish(this.busy.st);
      }
      this.busy = null;
      return;
    }

    if (!this.busy || this.busy.st.id !== st!.id) this.busy = { st: st!, ms: 0 };
    this.busy.ms += dtMs;

    if (st!.overcookMs) {
      if (this.busy.ms >= st!.overcookMs) {              // giữ quá tay: cháy, không cứu được
        this.player.hand = st!.spoils ?? "loaf_burnt";
        this.emit("BURNT_OR_COLD");
        this.busy = null;
      }
    } else if (this.busy.ms >= st!.holdMs) {
      this.finish(st!);
      this.busy = null;
      this.holdLatch = true;                           // xong rồi thì nhả phím mới làm lại được
    }
  }

  /** Nhấn một cái ăn ngay (trạm có holdMs = 0). Tách hàm để test gọi thẳng được. */
  private press() {
    if (this.paused || this.closed) return;
    if (this.handsBusy) { this.hud.log("tay đang bận"); return; }
    const st = this.near;
    if (st?.id === "oven") { this.pressOven(); return; }
    if (st?.id === "board" && this.boardLoaf && this.player.hand === "empty") { this.openBoard(); return; }
    // thớt trống, tay không: lau thớt — WIPE_BOARD 2,5 s, −0,15 độ bẩn (P1-02 §2.10)
    if (st?.id === "board" && !this.boardLoaf && this.player.hand === "empty") {
      this.handsBusyUntil = this.elapsed + 2.5;
      this.addDirt(-0.15);
      this.hud.log("lau thớt");
      return;
    }
    if (st && st.holdMs === 0 && !blockedReason(st, this.player.hand)) this.finish(st);
  }

  private finish(st: Station) {
    switch (st.id) {
      case "board":                                     // T2: mở bảng CHỌN NGUYÊN LIỆU
        // Đặt ổ nóng xuống thớt: tay rảnh, ổ nằm trên thớt cho tới khi gói.
        if (this.boardLoaf) { this.hud.log("thớt đang có ổ kẹp dở — kẹp xong ổ đó đã"); return; }
        this.player.hand = "empty";
        this.boardLoaf = [];
        this.boardWarmth = this.handWarmth;                    // ổ mang theo độ ấm của nó
        this.openBoard();
        return;

      case "handoff":
        return this.handOver();

      case "sink":                                      // WASH_HANDS: sạch cả hai tay
        this.hands = "CLEAN";
        this.dirtyEpisode++;
        this.addDirt(-0.1);
        return;

      default:
        this.pickUp(st.gives);
    }
  }

  /**
   * Gói ổ bánh lại. So ngay với đơn của người đang đứng trước mặt: nếu sai, phát
   * `ORDER_DEFECT` tại slot BOARD — khách ĐANG NHÌN thì sẽ thấy, và lúc đưa bánh
   * họ nói câu "tôi thấy con quên bỏ hành rồi đó" thay vì "ủa… thiếu hành rồi".
   * Đó chính là trụ cột T1 dưới dạng kỹ thuật (CANON §6).
   */
  /** Mở bảng với đúng phần nhân đang nằm trên ổ gác ở thớt. */
  private openBoard() {
    this.assembly.setPresets(this.world.stall.presets);
    this.assembly.placeBelow(this.hud.statsBottom);
    this.assembly.show(this.boardLoaf ?? []);
  }

  private finishDish(dish: Ingredient[], evenWrap = false) {
    this.boardLoaf = null;
    this.grip.reset();                                 // cầm ổ mới gói lên: tay chắc lại từ đầu
    this.handWarmth = this.boardWarmth;
    this.dish = dish;
    this.player.hand = "loaf_filled";

    // Lỗi trong ổ phát tại BOARD với KHOÁ RIÊNG của ổ này + người này (P1-03 §2.7):
    // khách đang đứng nhìn thấy thì lúc đưa họ nói "cô thấy con quên…", còn người
    // xếp hàng phía sau có thấy cũng không thành "đã thấy" lỗi trong ổ CỦA HỌ.
    this.addDirt(0.002);                               // giấy gói, vụn bánh
    const c = this.service.front;
    // FLOURISH (P1-01 §2.9 WRAP_FAST): gói ba nhịp đều tay. Không có nhánh "gói hỏng",
    // không chạm vào tiền — chỉ là một khoảnh khắc khéo tay trước mắt khách.
    if (evenWrap) {
      const last = c ? this.lastFlourish.get(c.id) ?? -Infinity : -Infinity;
      if (!c || this.elapsed - last >= 90) {
        if (c) this.lastFlourish.set(c.id, this.elapsed);
        this.emit("FLOURISH", "HANDS");
      }
    }
    if (c?.order) {
      for (const d of diffDish(c.order, dish)) {
        if (d.kind === "STUFFED") continue;
        bus.emit("stim:emitted", {
          stimId: "ORDER_DEFECT", zone: "BOARD", salience: d.sCounter * d.magnitude, at: this.elapsed,
          key: orderDefectKey(c.id, d.kind, d.item),
        });
      }
    }
  }

  /**
   * Bỏ một phần nhân lên ổ. Bỏ đúng thứ khách đã DẶN KHÔNG là lỗi xảy ra ngay lúc đó,
   * trước mắt khách (UNWANTED phát lúc đặt, P1-03 §2.6.2) — không đợi tới lúc gói.
   */
  private onPlace(id: Ingredient) {
    this.touchFood();
    this.addDirt(0.004);
    const c = this.service.front;
    if (!c?.order || c.order.levels[id] !== 0) return;
    bus.emit("stim:emitted", {
      stimId: "ORDER_DEFECT", zone: "BOARD", salience: 24, at: this.elapsed,
      key: orderDefectKey(c.id, "UNWANTED", id),
    });
  }

  private handOver() {
    // P1-01 §2.4: nguội thì BURNT_OR_COLD bắn ĐÚNG LÚC ĐƯA — khách cầm lên là biết.
    const cold = this.player.hand === "loaf_filled" && !isWarm(this.handWarmth)
      && this.service.front?.phase === "waiting";
    if (cold) this.emit("BURNT_OR_COLD", "HANDS");
    const res = this.player.hand === "tea"
      ? this.service.serveTea()
      : this.service.serveDish(this.dish, { cold, crust: this.handCrust });

    if (!res.ok) { this.hud.log(res.reason ?? "chưa đưa được"); return; }

    const wasDish = this.player.hand === "loaf_filled";
    this.player.hand = "empty";
    this.dish = [];
    // TAKE_MONEY (P1-01 §2.11): 2,0 s nhận tiền — và tay dính tiền cho tới khi rửa.
    if (wasDish) {
      this.hands = "MONEY";
      this.handsBusyUntil = this.elapsed + 2.0;
    }
    // Autosave sau mỗi khách: DayScene nghe `npc:left` (P0-02 §2.6).
  }

  private get handsBusy() {
    return this.elapsed < this.handsBusyUntil;
  }

  /** Cầm một món lên tay: tay chắc lại từ đầu (grip = 1). */
  private pickUp(hand: Station["gives"]) {
    this.player.hand = hand;
    this.grip.reset();
    if (hand === "loaf_cold") this.touchFood();
  }

  /**
   * Chạm vào đồ ăn. Tay còn dính tiền thì đó là DIRTY_HANDS (MONEY_THEN_FOOD, P1-01 §2.8),
   * ở vùng TAY, ngay trước mắt khách. Cùng một đợt tay dơ thì cùng một khoá: bốc càng
   * nhiều, khách càng chắc.
   */
  private touchFood() {
    if (this.hands !== "MONEY") return;
    bus.emit("stim:emitted", {
      stimId: "DIRTY_HANDS", zone: "HANDS", salience: SALIENCE.DIRTY_HANDS, at: this.elapsed,
      key: `DIRTY_HANDS:${this.dirtyEpisode}`,
    });
  }

  private get dirt() {
    return 1 - this.world.stall.cleanliness;
  }

  private addDirt(d: number) {
    const st = this.world.stall;
    st.cleanliness = Math.max(0, Math.min(1, st.cleanliness - d));
  }

  /** Preset P1/P2/P3 (P1-01 §2.6): trả danh sách phần, trừ một phần chia sẵn. */
  private usePreset(i: number) {
    const p = this.world.stall.presets[i] as Preset | undefined;
    if (!p || p.prepped <= 0) return null;
    p.prepped--;
    this.assembly.setPresets(this.world.stall.presets);
    return presetDish(p);
  }

  /**
   * Bỏ món đang cầm vào thùng — DISCARD, P1-01 §2.11: mất 1 giây, KHÔNG phát sự kiện nào.
   * Rớt (DROPPED_FOOD) là chuyện khác: nó chỉ đến từ tay lỏng (`tickGrip`), không phải
   * một nút bấm. Đồ hỏng (bánh cháy) BẮT BUỘC bỏ — không có nút nhặt lên dùng tiếp (§7.2).
   */
  private discard() {
    if (this.paused || this.player.hand === "empty") return;
    if (this.handsBusy) { this.hud.log("tay đang bận"); return; }
    const wasBurnt = this.player.hand === "loaf_burnt";
    this.player.hand = "empty";
    this.dish = [];
    this.busy = null;
    this.handsBusyUntil = this.elapsed + 1.0;
    if (wasBurnt) this.hud.log("cô Ba: \"bánh đó con để cô ăn.\"");   // CANON §7.4: cô buồn chứ không la
  }

  /**
   * Lò 3 slot — P1-01 §2.4. Bấm E cầm ổ nguội = bỏ vào; tay không = lấy ổ chín nhất ra.
   * Mỗi lần mở cửa lò hụt nhiệt một chút. Độ giòn hiện ở vòng trên cửa lò, không phải số.
   */
  private pressOven() {
    const h = this.player.hand;
    if (h === "loaf_cold") {
      if (!this.oven.put()) { this.hud.log("lò đầy rồi"); return; }
      this.player.hand = "empty";
      return;
    }
    if (h !== "empty") { this.hud.log("tay đang cầm đồ"); return; }
    const l = this.oven.take();
    if (!l) { this.hud.log("lò đang trống"); return; }
    const band = bandOfCrust(l.crust);
    this.pickUp(band === "BURNT" ? "loaf_burnt" : "loaf_hot");
    this.handWarmth = 1;
    this.handCrust = l.crust;
    if (band === "RAW") this.hud.log("ổ này chưa giòn");
  }

  /** Hỏi chuyện khách đang đứng trước quầy (ASK_QUESTION) — tay bận ~2,5 s. */
  private askFront() {
    if (this.handsBusy) return;
    const res = this.service.ask();
    if (!res.ok) { this.hud.log(res.reason ?? ""); return; }
    this.hud.log(`con: "${res.line}"`);
    this.handsBusyUntil = this.elapsed + 2.5;
  }

  /**
   * Tay chắc hay lỏng — P1-01 §2.7. Chạy (Shift) khi đang cầm đồ, hoặc va vào đồ đạc,
   * là tay lỏng dần; về 0 thì RỚT — DROPPED_FOOD ở vùng TAY, trước mắt khách.
   */
  private tickGrip(dt: number) {
    const h = this.player.hand;
    if (h === "empty") return;
    const p = this.player;
    const tempo = p.moving ? (p.running ? RUN_TEMPO : WALK_TEMPO) : 0;
    if (!this.grip.tick(dt, tempo, p.bumped)) return;
    this.player.hand = "empty";
    this.dish = [];
    this.busy = null;
    this.emit("DROPPED_FOOD", "HANDS");
    this.addDirt(0.06);                                // DROP_MESS
    this.hud.log("rớt rồi…");
  }

  /** Vật che tầm nhìn (P1-02 §2.6): thân người che tay (giữ C) · hơi lò khi lò đang nướng. */
  private occluders(): Occluder[] {
    const out: Occluder[] = [];
    if (this.keys.C.isDown) out.push({ mul: 0.45, slots: ["HANDS", "BOARD"], zones: ["FRONT_CENTER", "FRONT_SIDE"] });
    if (this.oven.busy) out.push({ mul: 0.8, slots: ["OVEN", "BOARD"], zones: ["FRONT_CENTER", "FRONT_SIDE", "QUEUE_2", "QUEUE_3", "SEATED_FAR"] });
    return out;
  }

  /** Vòng độ giòn trên cửa lò — một vòng mỗi slot, khắc vạch ở 0,45 / 0,88 / 1,00 (P1-04 B5). */
  private drawOven() {
    const g = this.ovenGfx;
    g.clear();
    const lab = this.labelY.get("oven");
    if (!lab) return;
    // ngay trên nhãn "lò than", và vẽ TRÊN lớp nhãn — nhãn không được che độ giòn
    const sx = lab.x, baseY = lab.y - 24;
    const R = 11;
    for (let i = 0; i < OVEN_SLOTS; i++) {
      const cx = sx + (i - 1) * 30;
      const l = this.oven.slots[i];
      g.fillStyle(0x1b2429, 0.9).fillCircle(cx, baseY, R + 3);
      g.lineStyle(2, 0x6d7b84, 1).strokeCircle(cx, baseY, R);
      if (!l) continue;
      const band = bandOfCrust(l.crust);
      const col = band === "RAW" ? 0xe8e2d4 : band === "CRISP" ? 0xd9a441 : band === "SINGED" ? 0xa0582c : 0x3a2a22;
      const frac = Math.min(1, l.crust / CRUST.BURNT);
      g.lineStyle(4, col, 1);
      g.beginPath();
      g.arc(cx, baseY, R, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      g.strokePath();
      for (const n of [CRUST.READY, CRUST.SINGED]) {
        const a = -Math.PI / 2 + (n / CRUST.BURNT) * Math.PI * 2;
        g.lineStyle(2, 0xffffff, 0.9);
        g.lineBetween(cx + Math.cos(a) * (R - 4), baseY + Math.sin(a) * (R - 4), cx + Math.cos(a) * (R + 4), baseY + Math.sin(a) * (R + 4));
      }
      if (band === "BURNT") g.fillStyle(0x3a2a22, 1).fillCircle(cx, baseY, R - 3);
    }
  }

  /**
   * Độ bẩn NHÌN THẤY được (P1-02 §2.10) — không có con số: 0,20 vụn bánh · 0,35 một con
   * ruồi · 0,50 ba con + vệt dầu · 0,70 năm con. Ruồi bay quanh thớt.
   */
  private drawDirt() {
    const g = this.dirtGfx;
    g.clear();
    const d = this.dirt;
    if (d < 0.2) return;
    const lab = this.labelY.get("board");
    if (!lab) return;
    const bx = lab.x, by = lab.y + 34;
    g.fillStyle(0xb58a5a, 0.9);
    for (let i = 0; i < Math.min(9, Math.floor(d * 12)); i++) {
      g.fillCircle(bx - 22 + ((i * 37) % 44), by + ((i * 17) % 12), 1.6);
    }
    if (d >= 0.5) g.fillStyle(0x7a6a3a, 0.15).fillEllipse(bx, by + 6, 46, 12);
    const flies = d >= 0.7 ? 5 : d >= 0.5 ? 3 : d >= 0.35 ? 1 : 0;
    const t = this.settings.reducedMotion ? 0 : this.time.now / 1000;
    g.fillStyle(0x1b1b1b, 1);
    for (let i = 0; i < flies; i++) {
      const a = t * (1.6 + i * 0.3) + i * 2.1;
      g.fillCircle(bx + Math.cos(a) * (14 + i * 3), by - 10 + Math.sin(a * 1.3) * 8, 1.8);
    }
  }

  /** Ba nấc độ chắc tay quanh món đang cầm: không có gì · vòng cam · vòng đỏ run tay. */
  private drawGrip() {
    const g = this.gripGfx;
    g.clear();
    const held = this.player.heldSprite;
    if (this.player.hand === "empty" || !held.visible || this.grip.tier === "SAFE") return;
    const shake = this.grip.tier === "SHAKE" && !this.settings.reducedMotion ? Math.sin(this.time.now / 30) * 1.5 : 0;
    g.setDepth(held.depth + 2);
    g.lineStyle(3, this.grip.tier === "SHAKE" ? 0xd0503c : 0xe39a3b, 0.95);
    g.strokeCircle(held.x + shake, held.y, 17);
  }

  /** Bước 2 phát `stim` ngay trong frame — bước 3 của CÙNG frame sẽ duyệt nó. */
  private emit(id: StimId, zone?: Station["slot"]) {
    bus.emit("stim:emitted", {
      stimId: id, zone: zone ?? "HANDS", salience: SALIENCE[id], at: this.elapsed,
    });
  }

  /** Hơi khói trên ổ đang cầm và ổ gác trên thớt. Tắt khói = ổ đã nguội. */
  private drawSteam() {
    const rm = this.settings.reducedMotion, t = this.time.now;
    const held = this.player.heldSprite;
    const carrying = this.player.hand === "loaf_hot" || this.player.hand === "loaf_filled";
    this.handSteam.draw(held.x, held.y - 10, held.depth + 1, t, carrying && held.visible && isWarm(this.handWarmth), rm);

    const board = STATIONS.find((s) => s.id === "board")!;
    const { sx, sy } = toScreen(board.tx + 0.5, board.ty + 0.5);
    this.boardSteam.draw(sx, footY(sy) - 44, LABEL_DEPTH - 1, t,
      !!this.boardLoaf && !this.assembly.isOpen && isWarm(this.boardWarmth), rm);
    if (this.assembly.isOpen) this.assembly.setWarm(isWarm(this.boardWarmth), t, rm);
  }

  /** Vòng sáng dưới chân trạm đang với tới được — người chơi không phải đoán. */
  private drawRing() {
    if (!this.near) { this.ring.setVisible(false); return; }
    const { sx, sy } = toScreen(this.near.tx + 0.5, this.near.ty + 0.5);
    const pulse = this.settings.reducedMotion ? 0.2 : Math.sin(this.time.now / 260) * 0.2;
    this.ring.setVisible(true)
      .setPosition(sx, sy)
      .setDepth(depthOf(this.near.tx + 0.5, this.near.ty + 0.5) - 2)
      .setAlpha(0.55 + pulse);
  }

  /**
   * Nhạc bám theo GIỜ TRONG NGÀY — P5-03 §6.4.
   *
   * Cố ý không có nhánh nào đọc `served`, `money` hay số lỗi: nhạc phản ứng với
   * BỐI CẢNH, không bao giờ là bảng điểm (vi phạm là hỏng trụ cột T3).
   * Gọi mỗi frame cũng không sao — `music.play` bỏ qua nếu đã đúng cue.
   */
  private syncMusic() {
    const cue: CueId = this.clock.isPeak ? "cao_diem"
      : this.clock.minutes < PEAK_START_MIN ? "to_mo"
      : "lang";
    music.play(this, cue);
  }

  // ───────────────────────────────────────────────────────── tạm dừng / kết ngày

  /**
   * CANON §15.2: pause MỌI LÚC, và pause đóng băng CẢ sự kiên nhẫn của khách.
   * Chỉ một chỗ: `clock.paused` → `advance()` trả 0 → không hệ nào dưới nó chạy.
   */
  private pause(source: "PLAYER" | "PLAYTEST" = "PLAYER") {
    if (this.overlay || this.closed) return;
    // Đang kẹp thì gác ổ lại: bảng còn mở dưới lớp mờ là còn bấm xuyên được — thế giới
    // "đóng băng" mà nhân vẫn vô ổ, preset vẫn bị trừ.
    if (this.assembly.isOpen) this.assembly.park();
    this.paused = true;
    this.clock.paused = true;
    this.busy = null;
    this.intents = [];
    this.tweens.pauseAll();
    music.duck(true);            // P5-03 §6.5 #8: hạ chứ không tắt — pause phải thấy an toàn
    bus.emit("ui:pauseToggled", { paused: true, source });
    this.showPauseMenu(source === "PLAYTEST" ? "Tạm dừng một chút" : "Tạm dừng");
  }

  private showPauseMenu(title: string) {
    this.overlay?.destroy(true);
    this.overlayBack = null;
    this.overlay = this.modal(title, [
      ["Tiếp tục bán", () => this.resume()],
      ["Chơi lại ngày này", () => this.confirmReplay()],
      ["Dẹp hàng sớm", () => this.close("PLAYER")],
      ["Lưu và về sảnh", () => this.day.quitToMenu()],
    ]);
  }

  /**
   * P0-02 §2.8: chơi lại cả ngày là ĐƯỢC PHÉP — và nói thẳng cho người chơi biết
   * nó không reroll được gì, để không ai phí một giờ thử rồi bực.
   */
  private confirmReplay() {
    this.overlay?.destroy(true);
    this.overlay = this.modal("Chơi lại ngày này?", [
      ["Chơi lại từ sáng", () => this.day.replayDay()],
      ["Thôi, bán tiếp", () => this.showPauseMenu("Tạm dừng")],
    ], "Chơi lại ngày này sẽ đưa mọi thứ về sáng sớm. Chợ vẫn bán giá đó,\nkhách vẫn tới giờ đó — chỉ có con là biết trước.");
    this.overlayBack = () => this.showPauseMenu("Tạm dừng");
  }

  private resume() {
    this.overlay?.destroy(true);
    this.overlay = null;
    this.overlayBack = null;
    this.paused = false;
    this.clock.paused = false;
    this.tweens.resumeAll();
    music.duck(false);
    bus.emit("ui:pauseToggled", { paused: false, source: "PLAYER" });
  }

  /** Đóng quầy — hết giờ hoặc dẹp sớm. Scene không tự chuyển cảnh: nó phát event, DayScene nghe. */
  private close(reason: StallCloseReason) {
    if (this.closed) return;
    const wasPaused = this.paused;
    this.overlay?.destroy(true);
    this.overlay = null;
    this.closed = true;
    this.paused = true;
    this.clock.paused = false;
    this.tweens.resumeAll();
    music.duck(false);
    if (wasPaused) bus.emit("ui:pauseToggled", { paused: false, source: "PLAYER" });
    const t = this.world.progress.today;
    bus.emit("stall:closed", { reason, served: t.served, revenue: t.revenue, lost: t.lost });
  }

  private modal(title: string, actions: [string, () => void][], sub?: string) {
    const c = this.add.container(0, 0).setDepth(9_500_000).setScrollFactor(0);
    const step = buttonHeight() + 12;
    const sz = textScale();
    const h = Math.min(GAME_H - 16, 90 + 40 * sz + actions.length * step + (sub ? 44 * sz : 0));
    const top = GAME_H / 2 - h / 2;
    c.add(this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x0d1216, 0.55));
    c.add(panel(this, GAME_W / 2, GAME_H / 2, 470, h, UI.paper, 0.98));
    c.add(label(this, GAME_W / 2, top + 20 + 20 * sz, title, 22, UI.ink, "700"));
    if (sub) c.add(label(this, GAME_W / 2, top + 44 + 44 * sz, sub, 13, UI.muted, "400").setWordWrapWidth(440));

    const first = top + 50 + 40 * sz + (sub ? 44 * sz : 0) + step / 2;
    actions.forEach(([text, fn], i) =>
      // scrollFactor(0) cho TỪNG nút: camera quán đang cuộn, nút không đặt thì vùng bấm
      // lệch khỏi chỗ vẽ đúng bằng độ cuộn — bấm vào nút mà không ăn.
      c.add(button(this, GAME_W / 2, first + i * step, text, fn, { width: 280, primary: i === 0 }).setScrollFactor(0)));
    return c;
  }
}

/** Khoảng cách giữa các frame (ms) — telemetry đọc để ra fps p5 / frame ms p95. */
const frameDeltas: number[] = [];
telemetry.frameSampler = () => ({ frameDeltas: frameDeltas.splice(0) });
