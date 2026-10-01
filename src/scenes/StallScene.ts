import Phaser from "phaser";
import { standDeps } from "../sim/day";
import { GAME_W, GAME_H } from "../core/config";
import { PEAK_START_MIN, type Clock } from "../core/clock";
import { bus, type EventKey, type EventMap } from "../core/eventbus";
import { NEGATIVE_STIMS, type StallCloseReason, type StimId } from "../core/types";
import type { GameContext } from "../core/context";
import { SEASON_DAYS, loadSettings, type Settings } from "../core/save";
import { creditBookOpen } from "../sim/season";
import { moment, onStoryOverheard } from "../sim/story";
import { DEV_TOOLS, PLAYTEST } from "../core/flags";
import { telemetry } from "../core/session";
import { Service } from "../sim/service";
import { SALIENCE } from "../sim/perception";
import { runFrame } from "../sim/frame";
import { cool, isWarm } from "../sim/loaf";
import { Steam } from "../ui/stall/Steam";
import { BubblePool } from "../ui/stall/BubblePool";
import { TalkPanel } from "../ui/stall/TalkPanel";
import { GossipCorner } from "../ui/stall/GossipCorner";
import { NotebookView } from "../ui/notebook/NotebookView";
import { logNote } from "../sim/notebook";
import { CLAIM } from "../sim/gossip";
import { dishQuality, portionsFor, stockOf, take, goodsFor } from "../sim/econ";
import { RITUAL_LINES, RITUAL_PRAYER, RITUAL_STEPS } from "../sim/till";
import { dirtMul, has } from "../sim/equipment";
import { labelOf } from "../sim/order";
import { OverhearScene, type Tier } from "../sim/overhear";
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
  BASE, FX, HELD, TILE, buildTextures, createSign, floorTextureAt, footY, preloadArt,
  textureForTile,
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

/** Khoảng lặng ngày 40 dài bao nhiêu giây THẬT, và sau bao lâu mới cho bấm bỏ qua. */
const FINALE_SECONDS = 40;
const SKIP_AFTER = 1.5;

/**
 * Giữ C = xoay người che tay (P1-02 §2.8 Công cụ 3). Hệ số occluder 0,45 không được
 * miễn phí: mọi thao tác chậm 1,3× và không chạy được — đúng cái giá doc ghi.
 */
const COVER_SLOW = 1.3;

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
  /** Cảnh nghe lỏm sáng nay (P2-04 §2.7) — null nếu đêm qua không ai kể gì. */
  private corner: GossipCorner | null = null;
  private overhearTier: Tier = 0;
  /** Sổ tay mở giữa ngày (Tab) — pause HOÀN TOÀN, kể cả kiên nhẫn của khách (CANON §15.2). */
  private notebook: NotebookView | null = null;
  /**
   * Chất lượng lô bánh của ổ ĐANG CẦM TRÊN TAY, và của ổ vừa gói (P3-03 dishQuality) —
   * người chơi không thấy số này. Đi theo ổ suốt kệ → lò → thớt → khách: xem `handCrust`.
   */
  private breadQ = 1;
  /** Khách vừa mua chịu — còn vài giây để bấm G ghi sổ. */
  private ritualOffered = false;
  /** P4-04 §2.2 — lúc chị Lan đi khỏi khung hình ngày 40 (bắt đầu khoảng lặng 40 giây). */
  private finaleAt = -1;
  /** Lúc gói xong ổ đang cầm — để biết người chơi có làm TRƯỚC khi khách gọi không (T-B). */
  private dishReadyAt = 0;
  private pendingDebt: { record: import("../sim/till").DebtRecord; name: string; until: number } | null = null;
  /** Bấm G lúc tay còn bận nhận tiền: NHỚ lại, ghi ngay khi rảnh — không vứt cú bấm đi. */
  private debtQueued = false;
  private dishQ = 1;

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
  /**
   * MỖI Ổ MANG THÔNG SỐ CỦA CHÍNH NÓ — P1-01 §2.4. Ba số đi thành một bộ và phải đi
   * cùng nhau qua mọi chặng: kệ → lò (`OvenLoaf`) → tay → thớt → khách.
   *
   *   warmth  1 = vừa ra lò, tụt dần (`sim/loaf.ts`)
   *   crust   độ giòn lúc rút khỏi lò — `serveDish` đọc để biết ổ non hay tới
   *   q       chất lượng lô bánh lấy ở kệ (`breadQ`) — vào `dishQuality`
   *
   * Trước đây chỉ `warmth` có bản riêng cho thớt: `crust` và `q` là biến dùng chung,
   * nên gác ổ A trên thớt rồi nướng ổ B là ổ A bị chấm bằng thông số của ổ B.
   */
  private handWarmth = 0;
  private boardWarmth = 0;
  private handSteam!: Steam;
  private boardSteam!: Steam;
  /** Ổ đang gác trên thớt, vẽ thật trong thế giới — khói tắt khi nguội, ổ thì không. */
  private boardLoafImg!: Phaser.GameObjects.Image;
  /** Thân người xoay che tay khi giữ C — occluder phải NHÌN THẤY (CANON §5). */
  private coverGfx!: Phaser.GameObjects.Graphics;
  private handCrust = 0;
  private boardCrust = 0;
  private boardQ = 1;
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
  /** P5-01 — bảng trò chuyện. Mở = đồng hồ đứng (kể cả kiên nhẫn của khách). */
  private talk!: TalkPanel;
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
    this.boardCrust = 0;
    this.breadQ = 1;
    this.boardQ = 1;
    this.finaleAt = -1;
    this.pendingDebt = null;
    this.debtQueued = false;
    this.oven = new Oven();
    this.grip = new Grip();
    // P3-04 — đồ nghề đổi CẢM GIÁC thao tác, không bỏ thao tác nào (TB-2)
    // ⚖️ CÂN BẰNG — `burnAt` lò gas 1,25 → 1,70, đi kèm `CRUST.BURNT` 1,00 → 1,30 (xem
    // `sim/oven.ts`). P3-04 A1 hứa lò gas "nướng nhanh hơn, và cửa sổ trước khi cháy RỘNG
    // HƠN"; vì `rateMul` 1,35 bóp mọi cửa sổ lại 1/1,35, ngưỡng cháy phải nới theo mới
    // giữ được lời hứa: READY→BURNT 12,7 s (lò gas) so với 11,7 s (lò than).
    if (has(this.world.equipment, "LO_GAS")) { this.oven.rateMul = 1.35; this.oven.burnAt = 1.7; }
    if (has(this.world.equipment, "KHUNG_GIA_CO")) this.grip.lossMul = 0.85;
    this.handsBusyUntil = 0;
    this.hands = "CLEAN";
    this.lastFlourish = new Map();
    this.intents = [];
    this.elapsed = 0;
    this.actors.clear();
    this.off = [];
    // Reload giữa buổi: đồng hồ đã được DayScene đặt về đúng giờ đã lưu.
    this.resumed = !!data.resume;
    // Phaser dùng lại instance scene, nên field initializer KHÔNG chạy lại giữa hai ngày.
    // Quên reset là nghi thức đốt vía chỉ mời được đúng một lần cả mùa.
    this.ritualOffered = false;
    if (!this.resumed) this.clock.reset();
    this.clock.paused = false;
    // CANON §15.2 / P0-02 §2.2: đồng hồ VẪN trôi, chỉ chậm một nửa.
    this.clock.scaleMul = this.settings.noTimePressure ? 0.5 : 1;
  }

  private get world() { return this.ctx.world; }

  /** Vào thẳng scene này (dev, test) mà chưa qua BootScene thì tự tải lấy ảnh. */
  preload() {
    preloadArt(this);
  }

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
    this.talk = new TalkPanel(this, (i) => this.pickTalk(i), () => this.ignoreTalk());
    this.handSteam = new Steam(this);
    this.boardSteam = new Steam(this);
    // Ổ gác trên thớt phải THẤY được. Trước đây chỉ có khói, mà khói tắt hẳn khi ổ nguội
    // — đúng lúc người chơi quên ổ lâu nhất thì trên thớt lại chẳng còn gì để nhắc.
    this.boardLoafImg = this.add.image(0, 0, HELD.key("loaf_hot"))
      .setOrigin(0.5, 0.5).setDepth(LABEL_DEPTH - 2).setVisible(false);
    this.coverGfx = this.add.graphics();
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
    // P3-04 E1 — làm bảng QR tốn MỘT BUỔI SÁNG giấy tờ ngân hàng: hôm đó 8h mới mở hàng
    if (!this.resumed && w.flags.lateOpenDay === w.progress.dayIndex && this.clock.minutes < 8 * 60) {
      this.clock.minutes = 8 * 60;
      this.lastMinutes = this.clock.minutes;
    }
    this.service = new Service({
      bus, hub: this.ctx.rng, saveId: w.saveId, day: w.progress.dayIndex,
      npcs: w.npcs, bags: w.shuffleBags, dialog: w.dialogState, gossip: w.gossip, notebook: w.notebook,
      ...standDeps(w),
      debts: w.money.debtsOwedToPlayer, till: w.econ, allowFalseMemory: w.a11y.allowFalseMemory ?? true,
      equip: w.equipment, loaOn: (w.econ?.loaOffUntil ?? 0) < w.progress.dayIndex,
      story: w.story, noTimePressure: this.settings.noTimePressure,
      resumeAt: this.resumed || w.flags.lateOpenDay === w.progress.dayIndex ? this.clock.minutes : undefined,
    });
    this.assembly = new AssemblyPanel(this,
      (dish, even) => this.intents.push(() => this.finishDish(dish, even)),
      (dish) => { this.boardLoaf = dish; },
      (id) => this.intents.push(() => this.onPlace(id)),
      (i) => this.usePreset(i),
      (id, stack) => {
        // Đếm theo HÀNG TRONG KHO, không theo id nguyên liệu: `dualeo` và `hanhngo`
        // cùng rút từ một hàng RAU (`goods.json → ingredientGood`). Đếm theo id thì
        // còn 2 phần rau vẫn đặt được 2+2, rồi `take()` lúc gói trả rỗng trong im lặng
        // — luật "hết là hết" (P3-03 KH-3) thủng đúng ở chỗ đồ dùng chung.
        const mine = new Set(goodsFor(id));
        const inStack = stack.filter((x) => goodsFor(x).some((g) => mine.has(g))).length;
        return portionsFor(this.world.inventory, id, this.world.progress.dayIndex) > inStack ? null : `hết ${labelOf(id)} rồi`;
      },
      () => this.orderIsEmptyLoaf(),
      (i) => this.consumePreset(i),
    );
    if (has(this.world.equipment, "DAO_BEN")) this.assembly.wrapSnapMs = 1500;
    if (has(this.world.equipment, "KEP_GAP")) this.assembly.addCooldownMs = 350;
    this.drawEquipment();
    this.bindInput();
    this.wire();

    // P2-04 §2.7 — cảnh nghe lỏm của đêm qua, nếu có
    this.corner?.destroy();
    this.corner = null;
    const plan = w.gossip?.overhear;
    if (plan && plan.day === w.progress.dayIndex) {
      this.corner = new GossipCorner(this, new OverhearScene(plan, {
        reducedMotion: this.settings.reducedMotion, noTimePressure: this.settings.noTimePressure,
      }), this.bubbles);
    }

    if (DEV_TOOLS) {
      dev.stall = {
        service: this.service,
        end: () => this.close("PLAYER"),
        fire: (id, zone) => this.emit(id as StimId, zone as Station["slot"] | undefined),
        gameObjects: () => this.children.length,
      };
    }

    // Vào lại giữa buổi: dựng lại ổ dở đúng như lúc rời đi. Ngày mới thì dọn sổ.
    {
      const st = w.stall;
      if (this.resumed) {
        if (st.board) {
          this.boardLoaf = st.board.dish as Ingredient[];
          this.boardWarmth = st.board.warmth; this.boardCrust = st.board.crust; this.boardQ = st.board.q;
        }
        if (st.hand) {
          this.player.hand = st.hand.item as Player["hand"];
          this.handWarmth = st.hand.warmth; this.handCrust = st.hand.crust; this.breadQ = st.hand.q;
        }
      }
      st.board = null; st.hand = null;
    }

    music.duck(false);
    this.syncMusic();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      // Ổ đang dở phải sống qua lần thoát: bánh đã bị trừ khỏi kho từ lúc lấy ở kệ, nên
      // quên lưu là mỗi lần về sảnh bốc hơi một ổ (P0-02 §2.8).
      const st = this.world.stall;
      st.board = this.boardLoaf
        ? { dish: [...this.boardLoaf], warmth: this.boardWarmth, crust: this.boardCrust, q: this.boardQ }
        : null;
      st.hand = this.player.hand !== "empty"
        ? { item: this.player.hand, warmth: this.handWarmth, crust: this.handCrust, q: this.breadQ }
        : null;
      // Rời quầy giữa lúc pause ("Lưu và về sảnh", "Chơi lại ngày này"): nhạc đang bị hạ
      // −12 dB phải trả về, và phải báo hết pause cho telemetry.
      if (this.paused && !this.closed) {
        music.duck(false);
        bus.emit("ui:pauseToggled", { paused: false, source: "MENU" });
      }
      // Bảng trò chuyện gắn listener lên `window` (capture) — không gỡ là phím Esc của
      // màn sau vẫn chạy vào cái bảng đã chết.
      this.talk.destroy();
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
        // Vật CHỈ CÓ ẢNH THẬT (bảng gỗ, bình chữa cháy) mà ảnh chưa tải về thì
        // bỏ qua hẳn — thà thiếu một món đạo cụ còn hơn một ô vuông xanh lè.
        if (!key || !this.textures.exists(key)) continue;

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
      if (ev.code === "Tab") { ev.preventDefault(); this.openNotebook(); return; }
      if (this.assembly.isOpen) { this.assembly.handleKey(ev.code); return; }
      // Không làm ngay: xếp hàng để áp ở bước craft của frame kế (P0-01 §2.4).
      if (ev.code === "KeyQ") this.intents.push(() => this.discard());
      else if (ev.code === "KeyE" || ev.code === "Space") this.intents.push(() => this.press());
      else if (ev.code === "KeyF") this.intents.push(() => this.askFront());
      else if (ev.code === "KeyG") this.intents.push(() => this.writeDebt());
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
        // khoảng lặng ngày 40: đồng hồ đi chậm như lúc có khách — 40 giây thật không được tua mất
        this.clock.busy = this.service.busy || this.finaleAt >= 0;
        return this.closed ? 0 : this.clock.advance(raw);
      },
      input: (dt) => {
        this.player.move({
          up: this.keys.W.isDown || this.keys.UP.isDown,
          down: this.keys.S.isDown || this.keys.DOWN.isDown,
          left: this.keys.A.isDown || this.keys.LEFT.isDown,
          right: this.keys.D.isDown || this.keys.RIGHT.isDown,
          // Xoay người che tay thì không chạy được — một nửa cái giá của Công cụ 3.
          run: this.keys.SHIFT.isDown && !this.keys.C.isDown,
        }, dt);
        this.near = stationNear(this.player.x, this.player.y);
        // Đi khỏi thớt khi bảng đang mở = gác ổ lại, không phải bỏ ổ.
        if (this.assembly.isOpen && this.near?.id !== "board") this.assembly.park();
        // đi khỏi trạm là huỷ thao tác — không cho "giữ phím rồi chạy đi chỗ khác"
        if (this.busy && this.near?.id !== this.busy.st.id) this.busy = null;
      },
      craft: (dt) => {
        for (const act of this.intents.splice(0)) act();
        this.tickDebt();
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
        this.service.handsDirty = this.hands === "MONEY";
        // hết sạch bánh: kho + lò + thớt + tay đều không còn ổ nào → khách tới là về không
        const hand = this.player.hand;
        this.service.soldOut = stockOf(this.world.inventory, "BANH", this.world.progress.dayIndex) === 0
          && this.oven.count === 0 && !this.boardLoaf && !hand.startsWith("loaf");
        // Trục nguội chạy nền, không ai điều khiển, luôn chống lại người chơi (P1-01 §2.5).
        const weather = this.world.progress.weather;
        if (this.player.hand === "loaf_hot" || this.player.hand === "loaf_filled") this.handWarmth = cool(this.handWarmth, dt, weather);
        if (this.boardLoaf) this.boardWarmth = cool(this.boardWarmth, dt, weather);
      },
      perception: (dt) => {
        this.elapsed += dt;
        this.service.ovenHot = this.oven.busy || this.service.servedCount > 0;
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
        this.tickOverhear(dt);
    this.tickVia();
        this.drainService();
        telemetry.dialogDeferred = this.service.dialogDeferred;
        // Khoảng lặng ngày 40 phải được quyền mở TRƯỚC cú đóng quầy theo đồng hồ, và
        // trong CÙNG frame mà khách cuối vừa biến mất — bước `npc` ngay trên vừa set
        // `lanLeft`. Chạy nó ở bước `perception` (trước `npc`) thì frame nào đồng hồ đã
        // qua 11h00 là `close` cướp mất cả 40 giây.
        this.tickFinale();
        // Hết giờ thì khách đang chờ được mời về (`closed`); đợi họ đi khuất mới đóng quầy.
        if (this.clock.isOver && !this.service.busy && this.finaleAt < 0 && !this.hasFinale) this.close("CLOCK");
      },
      render: () => this.renderSync(),
      renderPaused: () => this.renderSync(),
    }, dtMs);
  }

  /**
   * Nghe lỏm — ba tầng theo việc người chơi đang làm (P2-04 §2.7): tay bận → chỉ biết có
   * người nói; dừng tay đứng yên → nghe nội dung; đứng yên + giữ Shift (nghiêng người) →
   * nghe cả nguồn, nhưng khách trước quầy thấy mình lơ đễnh. Không có nút phát lại.
   */
  private tickOverhear(dt: number) {
    const k = this.corner;
    if (!k) return;
    const handsBusy = this.player.hand !== "empty" || this.assembly.isOpen || this.busy !== null || this.handsBusy;
    const still = !this.player.moving;
    const loud = has(this.world.equipment, "LOA_RAO") && (this.world.econ.loaOffUntil ?? 0) < this.world.progress.dayIndex;
    const tier: Tier = handsBusy || !still ? 0 : this.keys.SHIFT.isDown && !loud ? 2 : 1;
    this.overhearTier = tier;
    if (k.sc.state === "PLAY" && tier === 2) this.service.playerLeaning();
    // lõm khách: hàng vắng, và hai người đang nói chuyện không đứng ở quầy lúc đó
    const quiet = this.service.audience.length <= 2
      && !this.service.customers.some((c) => c.memKey === k.sc.plan.a || c.memKey === k.sc.plan.b);
    const ended = k.sc.tick(dt, { minutes: this.clock.minutes, quiet, tier });
    if (ended) {
      const p = k.sc.plan;
      const source = k.sc.bestFirst >= 2 ? p.source : null;
      bus.emit("gossip:overheard", { a: p.a, b: p.b, claim: p.claim, source, tier: k.sc.best });
      const nb = this.world.notebook;
      // P4-03 — cảnh có kịch bản (bảng hiệu, "nhà tui gần xe bánh mì cô Ba", tin đo đạc): không phải tin đồn về mình
      if (p.claim.startsWith("story:")) {
        onStoryOverheard(this.world.story, p.claim, k.sc.best, this.world.progress.dayIndex);
        if (nb && k.sc.best >= 1) logNote(nb, this.world.progress.dayIndex, this.clock.minutes, p.a, { t: "SAID_SOMETHING", text: p.lines.join(" — ") });
        return;
      }
      // P2-05: nghe hụt vẫn không mất trắng — tầng 1 ghi được NỘI DUNG, chỉ mất NGUỒN
      if (nb && k.sc.best >= 1) {
        logNote(nb, this.world.progress.dayIndex, this.clock.minutes, p.a, { t: "EAVESDROP", claim: p.claim, ...(source ? { source } : {}) });
        if (CLAIM[p.claim]?.valence < 0) nb.today.heardBad = true; else nb.today.heardGood = true;
      }
    }
  }

  /** Bước 6: CHỈ ĐỌC state vừa tính rồi vẽ. Không đọc input, không đổi state. */
  private renderSync() {
    this.syncActors();
    this.syncMusic();
    this.player.draw(this.settings.reducedMotion, this.keys.C.isDown);
    for (const a of this.actors.values()) a.draw(this.settings.reducedMotion, this.time.now, this.zonePoint, this.elapsed);
    this.drawRing();
    this.drawSteam();
    this.drawOven();
    this.drawGrip();
    this.drawDirt();
    this.drawCover();
    this.corner?.draw(this.overhearTier, this.clock.minutes, this.time.now, this.settings.reducedMotion);
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
      prompt: this.promptLine(),
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

  /**
   * MỘT chỗ duy nhất quyết dòng nhắc dưới màn hình. Thứ tự ưu tiên là thứ tự "việc gấp
   * nhất trước", và mỗi dòng phải là việc BẤM ĐƯỢC ngay lúc đó (P1-04 §2.4 mục 7).
   */
  private promptLine(): string | null {
    const d = this.pendingDebt;
    if (d && this.elapsed <= d.until) {
      const amt = d.record.trueAmount.toLocaleString("vi-VN");
      // Tay còn bận thì cú G vẫn được NHỚ (xem `writeDebt`) — nói rõ chứ không câm.
      return `G — ghi sổ nợ: ${d.name} ${amt}₫${this.debtQueued ? " (ghi ngay khi rảnh tay)" : ""}`;
    }
    // P4-04 §2.2 — khoảng lặng ngày 40: một dòng nhắc kín đáo, không panel, không đếm ngược.
    if (this.finaleAt >= 0 && this.elapsed - this.finaleAt > SKIP_AFTER) return "Enter — thôi, dọn hàng";
    if (this.handsBusy) return "tay đang bận…";
    if (this.keys.C.isDown) return "che tay — chậm 1,3× và không chạy được";
    if (this.near?.id === "oven") return this.ovenPrompt();
    if (this.near?.id === "board") return this.boardPrompt() ?? (this.player.hand === "empty" ? "thớt — bấm E để lau thớt" : null);
    return null;
  }

  private ovenPrompt(): string {
    const h = this.player.hand, n = this.oven.count;
    const lo = has(this.world.equipment, "LO_GAS") ? "lò gas" : "lò than";
    if (h === "loaf_cold") return this.oven.hasRoom ? `${lo} — bấm E bỏ ổ vô (${n}/${OVEN_SLOTS})` : `${lo} — lò đầy rồi`;
    if (h === "empty") return n ? `${lo} — bấm E lấy ổ chín nhất ra` : `${lo} — lò trống, lấy ổ bánh ở kệ trước`;
    return `${lo} — tay đang cầm đồ`;
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
    return { name: this.service.label(c), text: `"${c.orderLine}"`, urgent: false };
  }

  /** Dựng / dọn sprite khách theo danh sách trong `Service`. */
  private syncActors() {
    const live = new Set<string>();
    for (const c of this.service.customers) {
      live.add(c.id);
      if (!this.actors.has(c.id)) {
        this.actors.set(c.id, new CustomerActor(this, c, this.bubbles, this.settings.textScale, (x) => this.service.label(x)));
      }
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
        // Phải vào sổ, không thì cột "đếm tiền" buổi tối lệch đúng bội số của TEA_COST.
        // Tiền tiêu vì một câu nói (mua vé số của bà Bảy) đi dòng `story` — "chuyện trong
        // hẻm" — chứ không lẫn vô chi phí cố định: buổi tối phải đọc ra được mình đã
        // tiêu bao nhiêu vì tử tế với người ta.
        if (ev.item === "talk") w.econ.today.story += ev.amount;
        else w.econ.today.fixed += ev.amount;
        bus.emit("money:changed", { delta: -ev.amount, balance: w.money.cash, reason: "TEA" });
        continue;
      }
      if (ev.kind === "credit") {
        // P3-03 §2.6: GHI_SO tốn 2 giây tay; không bấm = "ghi sau" (tối chỉ biết số người chưa ghi)
        w.progress.today.served++;
        // P4-03 SK-20: cuốn sổ caro là cô Mai đưa NGÀY 9 — trước đó bán chịu thì chỉ nhớ trong đầu
        if (creditBookOpen(w.progress.dayIndex)) {
          // Cửa sổ MỜI phải trùng cửa sổ NHẬN: cú bán vừa xong khoá tay 2,0 s
          // (TAKE_MONEY), nên 4 giây ghi sổ đếm TỪ LÚC RẢNH TAY. Trước đây nó đếm ngay
          // trong frame nhận tiền, HUD mời 4 s mà hệ chỉ nhận được 2 s cuối.
          this.pendingDebt = { record: ev.record, name: ev.name, until: Math.max(this.elapsed, this.handsBusyUntil) + 4 };
          this.debtQueued = false;
          this.hud.log(`${ev.name} mua chịu ${ev.record.trueAmount.toLocaleString("vi-VN")}₫ — bấm G để ghi sổ`);
        } else this.hud.log(`${ev.name} mua chịu ${ev.record.trueAmount.toLocaleString("vi-VN")}₫ — chưa có sổ, nhớ trong đầu`);
        continue;
      }
      if (ev.kind === "repay") {
        w.money.cash += ev.amount;
        w.progress.today.revenue += ev.amount;
        this.hud.log(`${ev.name} trả tiền bữa trước ${ev.amount.toLocaleString("vi-VN")}₫`);
        bus.emit("money:changed", { delta: ev.amount, balance: w.money.cash, reason: "DEBT_REPAID" });
        continue;
      }
      // Khách tự bắt chuyện: chỉ là một lời mời. Không bấm F cũng không sao — mà cũng
      // không phải là không sao (xem `talk.ignore`).
      // Cùng lối nhắc với "bấm G để ghi sổ": một dòng ở nhật ký, không có mũi tên nhấp
      // nháy trên đầu ai. Không bấm F cũng chơi tiếp được — mà cũng không phải không sao.
      if (ev.kind === "talkOffer") {
        this.hud.log(`${ev.name} bắt chuyện — bấm F để trả lời`);
        continue;
      }
      w.money.cash += ev.amount;
      w.progress.today.revenue += ev.amount;
      w.progress.today.served++;
      bus.emit("money:changed", { delta: ev.amount, balance: w.money.cash, reason: "SALE" });
    }
  }

  /**
   * G — ghi sổ nợ cho khách vừa mua chịu (2 giây tay, P3-03 §2.6).
   * Bấm sớm (tay còn bận nhận tiền) thì cú bấm được XẾP HÀNG, không bị vứt: `tickDebt`
   * ghi giúp ngay khi tay rảnh. Vứt cú bấm đi là dạy người chơi rằng phím này hên xui.
   */
  private writeDebt() {
    const p = this.pendingDebt;
    if (!p || this.elapsed > p.until) return;
    if (this.handsBusy) { this.debtQueued = true; return; }
    p.record.playerWrote = p.record.trueAmount;
    this.pendingDebt = null;
    this.debtQueued = false;
    this.handsBusyUntil = this.elapsed + this.workSeconds(2.0);
    this.hud.log(`đã ghi sổ: ${p.name} ${p.record.trueAmount.toLocaleString("vi-VN")}₫`);
  }

  /** Cú G bấm sớm: giữ lại tới đúng lúc tay rảnh rồi mới ghi. */
  private tickDebt() {
    if (this.pendingDebt && this.elapsed > this.pendingDebt.until) { this.pendingDebt = null; this.debtQueued = false; }
    if (this.debtQueued && !this.handsBusy) this.writeDebt();
  }

  /** Giữ C (xoay người che tay) thì thao tác chậm 1,3× — P1-02 §2.8 Công cụ 3. */
  private workSeconds(s: number) {
    return this.keys.C.isDown ? s * COVER_SLOW : s;
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
    // Giữ C: thao tác chậm 1,3× (P1-02 §2.8 Công cụ 3) — thanh tiến trình bò chậm lại,
    // nhìn thấy được ngay chứ không phải một hệ số giấu sau lưng.
    this.busy.ms += this.keys.C.isDown ? dtMs / COVER_SLOW : dtMs;

    if (st!.overcookMs) {
      if (this.busy.ms >= st!.overcookMs) {              // giữ quá tay: cháy, không cứu được
        this.player.hand = st!.spoils ?? "loaf_burnt";
        this.emit("BURNT_OR_COLD");
        this.busy = null;
      }
    } else if (this.busy.ms >= this.holdOf(st!)) {
      this.finish(st!);
      this.busy = null;
      this.holdLatch = true;                           // xong rồi thì nhả phím mới làm lại được
    }
  }

  /** Thời gian giữ phím của trạm, đã tính đồ nghề: vòi rửa 3 s → 1 s, bình trà 0,6 → 0,25 s. */
  private holdOf(st: Station) {
    const e = this.world.equipment;
    if (st.id === "sink" && has(e, "VOI_BON")) return 1000;
    if (st.id === "tea" && has(e, "BINH_TRA")) return 250;
    return st.holdMs;
  }

  /** Nhấn một cái ăn ngay (trạm có holdMs = 0). Tách hàm để test gọi thẳng được. */
  private press() {
    if (this.paused || this.closed) return;
    if (this.handsBusy) { this.hud.log("tay đang bận"); return; }
    const st = this.near;
    if (st?.id === "oven") { this.pressOven(); return; }
    if (st?.id === "board" && this.player.hand === "empty") {
      // Ổ gác đã NGUỘI và chưa kẹp gì: việc đúng lúc này không phải kẹp nhân vào một ổ
      // nguội ngắt, mà là cầm nó ra lò nướng lại (`Oven.put` giữ nguyên phần vỏ đã có,
      // nên nướng lại không phải nút reset độ giòn miễn phí).
      if (this.boardLoaf?.length === 0 && !isWarm(this.boardWarmth)) { this.liftBoardLoaf(); return; }
      if (this.boardLoaf) { this.openBoard(); return; }
      // thớt trống, tay không: lau thớt — WIPE_BOARD 2,5 s, −0,15 độ bẩn (P1-02 §2.10)
      this.handsBusyUntil = this.elapsed + this.workSeconds(has(this.world.equipment, "KHAN_3_MAU") ? 1.2 : 2.5);
      this.addDirt(-0.15);
      this.hud.log("lau thớt");
      return;
    }
    if (st && st.holdMs === 0 && !blockedReason(st, this.player.hand)) this.finish(st);
  }

  /** Cầm ổ đang gác trên thớt lên tay — cả bộ thông số của nó đi theo. Thớt sạch trở lại. */
  private liftBoardLoaf() {
    this.boardLoaf = null;
    this.pickUp(isWarm(this.boardWarmth) ? "loaf_hot" : "loaf_cold");
    this.handWarmth = this.boardWarmth;
    this.handCrust = this.boardCrust;
    this.breadQ = this.boardQ;
    this.hud.log("cầm ổ trên thớt lên");
  }

  /**
   * Dòng nhắc ở thớt — phải nói ĐÚNG việc bấm phím sẽ làm, và luôn có ít nhất một
   * đường ra. Trước đây ổ gác + tay cầm ổ nóng chỉ trả một dòng "kẹp xong ổ đó đã"
   * mãi mãi, mà không phím nào làm được việc đó.
   */
  private boardPrompt(): string | null {
    if (!this.boardLoaf) return null;
    if (this.player.hand !== "empty") return "thớt — đang có ổ gác · Q bỏ ổ đang cầm vô thùng";
    if (this.boardLoaf.length === 0 && !isWarm(this.boardWarmth)) {
      return "thớt — ổ nguội rồi · E cầm lên nướng lại · Q bỏ vô thùng";
    }
    return `thớt — E kẹp tiếp (${this.boardLoaf.length} phần đã kẹp) · Q bỏ ổ vô thùng`;
  }

  private finish(st: Station) {
    switch (st.id) {
      case "board":                                     // T2: mở bảng CHỌN NGUYÊN LIỆU
        // Đặt ổ nóng xuống thớt: tay rảnh, ổ nằm trên thớt cho tới khi gói.
        // Thớt đã có ổ thì nói luôn đường ra, đừng chỉ nói "không được" (xem `boardPrompt`).
        if (this.boardLoaf) { this.hud.log("thớt đang có ổ — bấm Q bỏ ổ đang cầm vô thùng"); return; }
        this.player.hand = "empty";
        this.boardLoaf = [];
        this.boardWarmth = this.handWarmth;                    // ổ mang theo cả bộ thông số của nó
        this.boardCrust = this.handCrust;
        this.boardQ = this.breadQ;
        this.openBoard();
        return;

      case "handoff":
        return this.handOver();

      case "sink":                                      // WASH_HANDS: sạch cả hai tay
        this.hands = "CLEAN";
        this.dirtyEpisode++;
        this.addDirt(-0.1);
        // P3-04 C1: rửa ở vòi ngay trước mặt khách — ai đang nhìn tay thì thấy
        if (has(this.world.equipment, "VOI_BON")) this.service.washedVisibly();
        return;

      default:
        // P3-03 KH-1: bánh mì mua buổi sáng, hết là hết — không có nút nhập thêm giữa buổi
        if (st.gives === "loaf_cold") {
          const q = take(this.world.inventory, "bread", 1, this.world.progress.dayIndex);
          if (!q.length) { this.hud.log("hết bánh mì rồi — mai mua thêm"); return; }
          this.breadQ = q[0];
          this.handCrust = 0;                            // ổ mới lấy ở kệ: chưa nướng
        }
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
    // Ổ rời thớt lên tay thì cả bộ thông số của NÓ đi theo — không phải của ổ nào khác.
    this.handWarmth = this.boardWarmth;
    this.handCrust = this.boardCrust;
    this.breadQ = this.boardQ;
    this.dish = dish;
    this.dishReadyAt = this.elapsed;
    this.player.hand = "loaf_filled";
    // gói xong mới trừ kho — lô cũ nhất trước (P3-03); chất lượng từng phần vào dishQuality
    const day = this.world.progress.dayIndex;
    const parts: { ing: Ingredient; q: number }[] = [];
    for (const ing of dish) for (const q of take(this.world.inventory, ing, 1, day)) parts.push({ ing, q });
    this.dishQ = dishQuality(this.breadQ, parts);
    if (has(this.world.equipment, "DAO_BEN") && this.service.audience.length >= 4 && this.ctx.rng.stream("ambient").next() < 0.015) {
      this.hands = "MONEY";                              // băng lại xong phải rửa tay
      this.handsBusyUntil = this.elapsed + 6;
      this.hud.log("đứt tay rồi — băng lại cái đã");
    }

    // Lỗi trong ổ phát tại BOARD với KHOÁ RIÊNG của ổ này + người này (P1-03 §2.7):
    // khách đang đứng nhìn thấy thì lúc đưa họ nói "cô thấy con quên…", còn người
    // xếp hàng phía sau có thấy cũng không thành "đã thấy" lỗi trong ổ CỦA HỌ.
    this.addDirt(0.002);                               // giấy gói, vụn bánh
    const c = this.service.front;
    // FLOURISH (P1-01 §2.9 WRAP_FAST): gói liền tay sau miếng nhân cuối. Không có nhánh "gói hỏng",
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
    if (!has(this.world.equipment, "KEP_GAP")) this.touchFood();
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
      : this.service.serveDish(this.dish, { cold, crust: this.handCrust, quality: this.dishQ, readyAt: this.dishReadyAt });

    if (!res.ok) { this.hud.log(res.reason ?? "chưa đưa được"); return; }

    const wasDish = this.player.hand === "loaf_filled";
    this.player.hand = "empty";
    this.dish = [];
    // TAKE_MONEY (P1-01 §2.11): 2,0 s nhận tiền — và tay dính tiền cho tới khi rửa.
    if (wasDish) {
      this.hands = "MONEY";
      this.handsBusyUntil = this.elapsed + this.workSeconds(2.0);
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
    if (d > 0) d *= dirtMul(this.world.equipment);
    st.cleanliness = Math.max(0, Math.min(1, st.cleanliness - d));
  }

  /**
   * Preset P1/P2/P3 (P1-01 §2.6): CHỈ trả danh sách phần — thuần tuý, không trừ gì.
   * Bảng kẹp nhân có thể từ chối áp preset (kho hết một món giữa chừng); trừ ngay ở đây
   * là mất một phần chia sẵn mà ổ bánh không nhận được gì.
   */
  private usePreset(i: number) {
    const p = this.world.stall.presets[i] as Preset | undefined;
    if (!p || p.prepped <= 0) return null;
    return presetDish(p);
  }

  /** Ổ đã GÓI XONG bằng preset thứ i — giờ mới trừ phần chia sẵn. */
  private consumePreset(i: number) {
    const p = this.world.stall.presets[i] as Preset | undefined;
    if (!p || p.prepped <= 0) return;
    p.prepped--;
    this.assembly.setPresets(this.world.stall.presets);
  }

  /**
   * Đơn hiện tại có phải "cho một ổ bánh mì không" (P4-05 §2.7 A) — chỉ lúc đó bảng kẹp
   * nhân mới cho gói một ổ TRỐNG. Không có nhánh này thì ổ trống là ngõ cụt.
   */
  private orderIsEmptyLoaf() {
    const it = this.service.front?.order?.intent;
    return !!it && !it.nhan.length && !it.dayDu && it.rau === "khong";
  }

  /**
   * Bỏ món đang cầm vào thùng — DISCARD, P1-01 §2.11: mất 1 giây, KHÔNG phát sự kiện nào.
   * Rớt (DROPPED_FOOD) là chuyện khác: nó chỉ đến từ tay lỏng (`tickGrip`), không phải
   * một nút bấm. Đồ hỏng (bánh cháy) BẮT BUỘC bỏ — không có nút nhặt lên dùng tiếp (§7.2).
   */
  private discard() {
    if (this.paused) return;
    if (this.handsBusy) { this.hud.log("tay đang bận"); return; }
    // Tay không mà đứng ở thớt: Q dọn ổ đang GÁC. Không có đường này thì một ổ gác với
    // stack rỗng là ngõ cụt vĩnh viễn — không gói được, không lau thớt được, không bỏ
    // được, mà dòng gợi ý vẫn mời "bấm E để kẹp tiếp".
    if (this.player.hand === "empty") {
      if (this.near?.id !== "board" || !this.boardLoaf) return;
      this.boardLoaf = null;
      this.handsBusyUntil = this.elapsed + this.workSeconds(1.0);
      this.hud.log("bỏ ổ trên thớt vô thùng");
      return;
    }
    const wasBurnt = this.player.hand === "loaf_burnt";
    this.player.hand = "empty";
    this.dish = [];
    this.busy = null;
    this.handsBusyUntil = this.elapsed + this.workSeconds(1.0);
    if (wasBurnt) { this.hud.log("cô Ba: \"bánh đó con để cô ăn.\""); moment(this.world.story, "BANH_DO_CON_DE_CO_AN"); }   // CANON §7.4: cô buồn chứ không la
  }

  /**
   * Lò 3 slot — P1-01 §2.4. Bấm E cầm ổ nguội = bỏ vào; tay không = lấy ổ chín nhất ra.
   * Mỗi lần mở cửa lò hụt nhiệt một chút. Độ giòn hiện ở vòng trên cửa lò, không phải số.
   */
  private pressOven() {
    const h = this.player.hand;
    if (h === "loaf_cold") {
      // Ổ mang cả chất lượng lô lẫn phần vỏ đã nướng dở vào lò (nướng lại ổ đã nguội).
      if (!this.oven.put(this.breadQ, this.handCrust)) { this.hud.log("lò đầy rồi"); return; }
      this.player.hand = "empty";
      this.handCrust = 0;
      return;
    }
    if (h !== "empty") { this.hud.log("tay đang cầm đồ"); return; }
    const l = this.oven.take();
    if (!l) { this.hud.log("lò đang trống"); return; }
    const band = bandOfCrust(l.crust, this.oven.burnAt);
    this.pickUp(band === "BURNT" ? "loaf_burnt" : "loaf_hot");
    this.handWarmth = 1;
    this.handCrust = l.crust;
    this.breadQ = l.q;
    if (band === "RAW") this.hud.log("ổ này chưa giòn");
    if (band === "SINGED") this.hud.log("ổ này sém cạnh rồi");
  }

  /**
   * F — bắt chuyện với người trước quầy (hoặc trả lời người vừa bắt chuyện với mình).
   *
   * Có chuyện để nói → mở bảng lựa chọn và ĐÓNG BĂNG đồng hồ. Không có → rơi về câu xã
   * giao một nhịp của P1-02 (`ask()`), vẫn tốn 2,5 s tay bận như cũ.
   */
  private askFront() {
    if (this.handsBusy || this.paused || this.closed || this.talk.isOpen) return;
    const view = this.service.openTalk();
    if (view) { this.openTalkPanel(view); return; }
    const res = this.service.ask();
    if (!res.ok) { this.hud.log(res.reason ?? ""); return; }
    this.hud.log(`con: "${res.line}"`);
    this.handsBusyUntil = this.elapsed + this.workSeconds(2.5);
  }

  /**
   * Đóng băng trong lúc đọc — CANON §15.2 cho pause, và cùng một lý do: bảng này bắt
   * người chơi ĐỌC. Bốn dòng tiếng Việt mất 6–10 giây; anh Dũng có 28 giây kiên nhẫn.
   * Không đóng băng thì luật của trò chơi trở thành "đừng bao giờ nói chuyện với ai".
   *
   * KHÔNG dùng `this.pause()`: pause mở menu, hạ nhạc, và bắn `ui:pauseToggled` (telemetry
   * đếm thành một lần người chơi tạm dừng). Đây chỉ cần đúng một thứ — `clock.paused`.
   */
  private openTalkPanel(view: ReturnType<Service["openTalk"]>) {
    if (!view) return;
    if (this.assembly.isOpen) this.assembly.park();
    this.clock.paused = true;
    this.busy = null;
    this.intents = [];
    this.talk.show(view);
  }

  /** Người chơi chọn một dòng. Khách đáp ngay trong bảng — không qua bong bóng. */
  private pickTalk(i: number) {
    const next = this.service.chooseTalk(i);
    for (const l of this.service.drainLogs()) this.hud.log(l);
    if (!next) { this.closeTalkPanel(); return; }
    // Nhịp cuối: vẫn vẽ bảng một lần nữa để người chơi ĐỌC được câu đáp cuối cùng, rồi
    // Enter mới đóng. Đáp xong đóng cái rụp là mất đúng câu quan trọng nhất của cuộc.
    this.talk.show(next);
    if (!next.done) return;
  }

  /** Esc giữa chừng = làm thinh. Service tính tiền cho nó (`talk.ignore`). */
  private ignoreTalk() {
    this.service.closeTalk();
    for (const l of this.service.drainLogs()) this.hud.log(l);
    this.closeTalkPanel();
  }

  private closeTalkPanel() {
    this.talk.destroy();
    // Người chơi có thể đã bấm Esc giữa lúc game đang pause thật — đừng thả đồng hồ ra
    // khi menu tạm dừng vẫn đang mở.
    if (!this.paused && !this.closed) this.clock.paused = false;
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
    moment(this.world.story, "BANH_DO_CON_DE_CO_AN");  // rớt thì bỏ — đúng luật (P4-05 §2.2 B)
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
      // Vòng chia theo `burnAt` THẬT của lò này, không theo hằng số: lò gas có ngưỡng
      // cháy riêng, lấy hằng số thì vòng đầy trước khi ổ cháy — vạch đỏ nói dối.
      const burnAt = this.oven.burnAt;
      const band = bandOfCrust(l.crust, burnAt);
      const col = band === "RAW" ? 0xe8e2d4 : band === "CRISP" ? 0xd9a441 : band === "SINGED" ? 0xa0582c : 0x3a2a22;
      const frac = Math.min(1, l.crust / burnAt);
      g.lineStyle(4, col, 1);
      g.beginPath();
      g.arc(cx, baseY, R, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      g.strokePath();
      for (const n of [CRUST.READY, CRUST.SINGED]) {
        const a = -Math.PI / 2 + (n / burnAt) * Math.PI * 2;
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

  /**
   * Ổ gác trên thớt + hơi khói trên hai ổ (tay và thớt). Tắt khói = ổ đã nguội —
   * nhưng bản thân Ổ thì vẫn nằm đó, thấy được, và mờ đi một chút để đọc ra "nguội".
   */
  private drawSteam() {
    const rm = this.settings.reducedMotion, t = this.time.now;
    const held = this.player.heldSprite;
    const carrying = this.player.hand === "loaf_hot" || this.player.hand === "loaf_filled";
    this.handSteam.draw(held.x, held.y - 10, held.depth + 1, t, carrying && held.visible && isWarm(this.handWarmth), rm);

    const board = STATIONS.find((s) => s.id === "board")!;
    const { sx, sy } = toScreen(board.tx + 0.5, board.ty + 0.5);
    const parked = !!this.boardLoaf && !this.assembly.isOpen;
    const warm = isWarm(this.boardWarmth);
    this.boardLoafImg.setVisible(parked).setPosition(sx, footY(sy) - 34).setAlpha(warm ? 1 : 0.72);
    this.boardSteam.draw(sx, footY(sy) - 44, LABEL_DEPTH - 1, t, parked && warm, rm);
    if (this.assembly.isOpen) this.assembly.setWarm(warm, t, rm);
  }

  /**
   * Giữ C = xoay người che tay (P1-02 §2.8 Công cụ 3). Hệ số occluder 0,45 chỉ được
   * tồn tại nếu người chơi THẤY mình đang che: CANON §5 "không có hoạt ảnh thì không
   * có trạng thái". Đây là mảng thân người chắn giữa khách và món trên tay, cộng bóng
   * đổ xuống thớt — vẽ tĩnh nên `reducedMotion` không phải tắt gì.
   *
   * CÒN THIẾU (cần sửa `entities/Player.ts`, file của người khác): tư thế xoay nghiêng
   * 40° của chính nhân vật.
   */
  private drawCover() {
    const g = this.coverGfx;
    g.clear();
    if (!this.keys.C.isDown || this.paused || this.closed) return;
    const held = this.player.heldSprite;
    const at = held.visible ? { x: held.x, y: held.y } : this.zonePoint("HANDS");
    g.setDepth((held.visible ? held.depth : LABEL_DEPTH) + 2);
    g.fillStyle(0x1b2429, 0.55).fillEllipse(at.x + 5, at.y + 3, 44, 30);   // lưng quay ra phía khách
    g.lineStyle(3, 0xcdbb96, 0.85);                                        // cẳng tay vòng qua trước món
    g.beginPath();
    g.arc(at.x + 3, at.y + 5, 19, -2.7, -0.5);
    g.strokePath();
    const b = this.zonePoint("BOARD");
    g.fillStyle(0x1b2429, 0.3).fillEllipse(b.x, b.y + 10, 66, 26);
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
      ["Lưu và về sảnh", () => this.confirmQuit()],
    ]);
  }

  /**
   * "Lưu và về sảnh" giữa lúc còn người đứng chờ.
   *
   * P0-02 §2.8 ghi rõ "thoát bất cứ lúc nào, vào lại đúng chỗ" là TRỢ NĂNG, không được
   * phạt — nên nút vẫn ở đó, vẫn bấm một cái là đi. Nhưng CANON §8e cũng không cho phép
   * cú thoát đó XOÁ hậu quả đang lơ lửng: hiện tại ba người đang chờ biến mất sạch,
   * `lost` không nhích, không ai nhớ gì, và `resumeAt` tua lịch qua luôn — tức là bỏ đi
   * đúng lúc sắp bị bắt là thoát trắng án.
   *
   * Người đang chờ KHÔNG lưu được (SaveFile chưa có chỗ cho khách sống — xem báo cáo),
   * nên chọn vế còn lại: họ tính là khách VỀ KHÔNG. Đi qua `tickNpcs(dayOver)` để
   * `Service.leave(..., "closed")` chạy đủ: `onUnserved`, `npc:left` → autosave ghi
   * TRƯỚC khi rời scene. Nói trước một câu để người chơi không bị mất ba người trong im lặng.
   */
  private confirmQuit() {
    const waiting = this.service.customers.filter((c) => c.phase !== "leaving").length;
    if (!waiting) { this.day.quitToMenu(); return; }
    this.overlay?.destroy(true);
    this.overlay = this.modal("Về sảnh bây giờ?", [
      ["Bán nốt đã", () => this.showPauseMenu("Tạm dừng")],
      ["Dẹp, về sảnh", () => this.quitWithCustomers()],
    ], `Còn ${waiting} người đang đứng chờ. Về bây giờ là dọn hàng trước mặt họ:\nhọ về không, và họ có nhớ. Vào lại vẫn đúng giờ này.`);
    this.overlayBack = () => this.showPauseMenu("Tạm dừng");
  }

  private quitWithCustomers() {
    const waiting = this.service.customers.filter((c) => c.phase !== "leaving").length;
    // dayOver: true → mỗi người còn đứng chờ được `leave(c, "closed")` đúng một lần.
    this.service.tickNpcs(0, {
      minutes: this.clock.minutes, pressure: !this.settings.noTimePressure, dayOver: true,
    });
    this.world.progress.today.lost += waiting;
    this.drainService();
    this.day.quitToMenu();
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

  /**
   * Vía (P3-01 §2.6): khách mở hàng xui → cô Ba (còn ở quầy trước 6h30) rủ đốt vía. Một lần
   * một ngày, bỏ qua được, KHÔNG phạt. Không ánh vàng, không chuông, không "+%": đốt xong
   * chỉ là vía xấu về 0 — không bao giờ lên +1.
   */
  private tickVia() {
    const s = this.service;
    if (this.ritualOffered || !s.viaSettled) return;
    if (this.settings.skipRitual) { if (this.clock.minutes >= 6 * 60 + 30) { s.burnVia(); this.ritualOffered = true; } return; }
    if (s.via >= 0) { this.ritualOffered = true; return; }
    if (this.clock.minutes >= 6 * 60 + 30 || this.overlay || this.closed || this.notebook?.open) return;
    this.ritualOffered = true;
    this.paused = true;
    this.clock.paused = true;
    this.busy = null;
    this.intents = [];
    const econ = this.world.econ;
    const skip = () => {
      if (econ.ritualSkips === 0) { this.hud.log(RITUAL_LINES.skipFirst); s.burnVia(); }
      econ.ritualSkips++;
      this.resume();
    };
    const step = (i: number) => {
      this.overlay?.destroy(true);
      if (i >= RITUAL_STEPS.length) {
        this.world.money.cash -= 2000;                           // giấy, muối, chanh, nhang
        s.burnVia();
        this.resume();
        this.hud.log(RITUAL_LINES.done);
        moment(this.world.story, "VIA_LANH_THI_O");
        return;
      }
      this.overlay = this.modal(`Đốt vía · ${i + 1}/${RITUAL_STEPS.length}`, [[RITUAL_STEPS[i], () => step(i + 1)]], i === 0 ? RITUAL_PRAYER : undefined);
      this.overlayBack = null;
    };
    this.overlay = this.modal("Mở hàng xui", [["Đốt vía", () => step(0)], ["Thôi", skip]], RITUAL_LINES.offer);
    this.overlayBack = skip;
  }

  /**
   * TB-1 (P3-04): mỗi món đồ nghề phải NHÌN THẤY trên xe. Vẽ bằng code, tĩnh, một lần lúc
   * dựng cảnh — không popup, không toast: món mới cứ thế hiện ra trên xe.
   */
  private drawEquipment() {
    const e = this.world.equipment;
    const g = this.add.graphics();
    const at = (tx: number, ty: number, up = 0) => { const p = toScreen(tx, ty); return { x: p.sx, y: footY(p.sy) - up }; };
    const depth = (tx: number, ty: number) => depthOf(tx, ty) + 5;
    if (has(e, "LO_GAS")) { const p = at(7.9, 1.6, 8); g.setDepth(depth(7.9, 1.6)); g.fillStyle(0x3d6fa8, 1).fillRoundedRect(p.x - 6, p.y - 22, 12, 22, 4).fillStyle(0xd8dde2, 1).fillRect(p.x - 3, p.y - 26, 6, 4); }
    const draw = (tx: number, ty: number, fn: (x: number, y: number, gg: Phaser.GameObjects.Graphics) => void) => {
      const gg = this.add.graphics().setDepth(depth(tx, ty));
      const p = at(tx, ty);
      fn(p.x, p.y, gg);
    };
    if (has(e, "VOI_BON")) draw(14.6, 4.3, (x, y, gg) => { gg.fillStyle(0x9aa6ae, 1).fillRect(x - 2, y - 58, 3, 14).fillRect(x - 2, y - 58, 12, 3); gg.fillStyle(0x6fb4e0, 0.9).fillCircle(x + 9, y - 51, 2); });
    if (has(e, "LONG_BAN")) draw(8.5, 4.3, (x, y, gg) => { gg.fillStyle(0xdfe8ec, 0.55).fillEllipse(x, y - 52, 44, 18); gg.lineStyle(1.5, 0x8a979f, 0.9).strokeEllipse(x, y - 52, 44, 18); });
    if (has(e, "THUNG_RAC")) draw(3.4, 3.4, (x, y, gg) => { gg.fillStyle(0x3f7d5a, 1).fillRoundedRect(x - 7, y - 20, 14, 20, 3).fillStyle(0x2f5f44, 1).fillRect(x - 8, y - 22, 16, 3); });
    if (has(e, "DU_CHE")) draw(12.6, 5.6, (x, y, gg) => { gg.lineStyle(2, 0x6b5a4a, 1).lineBetween(x, y, x, y - 92); gg.fillStyle(0xc0443a, 0.92).fillTriangle(x - 46, y - 88, x + 46, y - 88, x, y - 110); });
    if (has(e, "BINH_TRA")) draw(13.6, 1.6, (x, y, gg) => { gg.fillStyle(0xe25c3c, 1).fillRoundedRect(x - 8, y - 46, 16, 20, 4).fillStyle(0xf2efe9, 1).fillRect(x - 2, y - 30, 4, 4); });
    if (has(e, "BANG_QR")) draw(12.2, 4.2, (x, y, gg) => { gg.fillStyle(0xf8f8f4, 1).fillRect(x - 7, y - 62, 14, 16); gg.fillStyle(0x222222, 1).fillRect(x - 5, y - 60, 4, 4).fillRect(x + 1, y - 60, 4, 4).fillRect(x - 5, y - 54, 4, 4).fillRect(x + 1, y - 52, 2, 2); });
    if (has(e, "LOA_RAO")) draw(10.2, 0.6, (x, y, gg) => { gg.fillStyle(0x3a3f45, 1).fillTriangle(x - 8, y - 86, x + 8, y - 80, x + 8, y - 92).fillRect(x - 12, y - 90, 5, 8); });
    if (has(e, "BANG_HIEU")) draw(10.5, 0.4, (x, y, gg) => { gg.lineStyle(3, 0xf2c14e, 1).strokeRoundedRect(x - 70, y - 124, 140, 26, 5); });
    if (has(e, "GHE_BAN")) draw(5.5, 8.4, (x, y, gg) => { gg.fillStyle(0x2f6fb3, 1).fillRect(x - 10, y - 12, 20, 4).fillRect(x - 9, y - 8, 3, 8).fillRect(x + 6, y - 8, 3, 8); });
    if (has(e, "GIA_TREO")) draw(8.5, 4.0, (x, y, gg) => { gg.lineStyle(2, 0x8a7a60, 1).lineBetween(x - 60, y - 86, x + 60, y - 86); });
    if (has(e, "THOT_RIENG")) draw(3.6, 4.4, (x, y, gg) => { gg.fillStyle(0xd9b98a, 1).fillRoundedRect(x - 9, y - 48, 18, 6, 2); });
    if (has(e, "DAO_BEN")) draw(4.3, 4.4, (x, y, gg) => { gg.fillStyle(0xcfd6db, 1).fillRect(x - 6, y - 50, 11, 2).fillStyle(0x3a2a20, 1).fillRect(x + 5, y - 51, 5, 3); });
    if (has(e, "KEP_GAP")) draw(4.8, 4.5, (x, y, gg) => { gg.lineStyle(1.5, 0xbfc7cc, 1).lineBetween(x - 5, y - 49, x + 6, y - 46).lineBetween(x - 5, y - 47, x + 6, y - 46); });
    if (has(e, "KHAN_3_MAU")) draw(5.4, 4.5, (x, y, gg) => { [0x5aa05a, 0xe0c040, 0xc84a3a].forEach((c, i) => gg.fillStyle(c, 1).fillRect(x - 7 + i * 5, y - 46, 4, 6)); });
    if (has(e, "TU_MAT")) draw(2.6, 2.4, (x, y, gg) => { gg.fillStyle(0xe8eef1, 1).fillRoundedRect(x - 12, y - 40, 24, 40, 3).lineStyle(1, 0x9aa6ae, 1).strokeRoundedRect(x - 12, y - 40, 24, 40, 3); });
    if (has(e, "NOI_U")) draw(9.4, 1.6, (x, y, gg) => { gg.fillStyle(0xb8bec3, 1).fillEllipse(x, y - 34, 18, 10).fillStyle(0x8a9095, 1).fillRect(x - 9, y - 34, 18, 8); });
  }

  /**
   * Ngày 40, sau khi chị Lan đi: cô Ba nói MỘT câu (không phải câu hỏi), rồi hẻm trống 40 giây.
   * Người chơi vẫn đi lại, dọn quầy được — bấm phím bất kỳ (E/Space/Enter) là qua màn kết.
   * Không nhạc, không swell (P4-03 §2.5).
   */
  /** Ngày cuối mùa mới có khoảng lặng — ngoài ngày đó, đồng hồ đóng quầy như thường. */
  private get hasFinale() {
    return this.world.progress.dayIndex >= SEASON_DAYS;
  }

  private tickFinale() {
    if (!this.hasFinale || this.closed) return;
    // Chị Lan đi rồi là mở khoảng lặng. Hết giờ mà chị Lan chưa từng tới (vào lại giữa
    // buổi thì lịch của chị đã bị `resumeAt` cắt mất) thì đồng hồ mở thay — không có
    // nhánh nào để ngày 40 kết thúc mà KHÔNG có khoảng lặng.
    if (this.finaleAt < 0 && (this.service.lanLeft || this.clock.isOver) && !this.service.busy) {
      this.finaleAt = this.elapsed;
      this.hud.log("Cô Ba: Hết rồi hả con.");
      music.duck(true);
      // `once` tự tiêu ngay lần bấm ĐẦU TIÊN, kể cả cú bấm trong 1,5 giây đầu lúc `skip`
      // cố ý không làm gì — bấm sớm một cái là phím bỏ qua chết hẳn. Dùng `on`, và chỉ
      // gỡ tay nghe khi đã thật sự bỏ qua.
      const kb = this.input.keyboard;
      const skip = () => {
        if (this.finaleAt < 0 || this.elapsed - this.finaleAt <= SKIP_AFTER) return;
        off();
        this.close("PLAYER");
      };
      const off = () => { kb?.off("keydown-ENTER", skip); kb?.off("keydown-SPACE", skip); };
      kb?.on("keydown-ENTER", skip);
      kb?.on("keydown-SPACE", skip);
      this.off.push(off);
    }
    if (this.finaleAt >= 0 && this.elapsed - this.finaleAt >= FINALE_SECONDS) this.close("PLAYER");
  }

  /** Tab — sổ tay giữa ngày. Mở sổ = pause hoàn toàn; đóng sổ = bán tiếp. */
  private openNotebook() {
    if (this.overlay || this.closed || this.notebook?.open) return;
    if (this.assembly.isOpen) this.assembly.park();
    this.paused = true;
    this.clock.paused = true;
    this.busy = null;
    this.intents = [];
    this.tweens.pauseAll();
    bus.emit("ui:pauseToggled", { paused: true, source: "PLAYER" });
    this.notebook = new NotebookView(this.game, this, this.world, {
      mode: "midday", textScale: this.settings.textScale, showEvening: this.settings.notebookAuto ?? true,
      onClose: () => { this.notebook = null; this.resume(); },
    });
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
    // P3-01 §2.7: dẹp hàng sớm — người có lịch ghé sau giờ này tới mà không có gì (xử ban đêm)
    if (reason === "PLAYER") this.world.econ.today.closedAtMin = this.clock.minutes;
    this.world.econ.today.soldOut = this.service.soldOutCount;
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
