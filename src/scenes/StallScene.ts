import Phaser from "phaser";
import { standDeps } from "../sim/day";
import { GAME_W, GAME_H } from "../core/config";
import { CLOCK_DT_CLAMP_MS, PEAK_START_MIN, type Clock } from "../core/clock";
import { bus, type EventKey, type EventMap } from "../core/eventbus";
import { NEGATIVE_STIMS, type StallCloseReason, type StimId } from "../core/types";
import type { GameContext } from "../core/context";
import { SEASON_DAYS, loadSettings, type Settings } from "../core/save";
import { creditBookOpen } from "../sim/season";
import { moment, onStoryOverheard } from "../sim/story";
import { DEV_TOOLS, PLAYTEST } from "../core/flags";
import { telemetry } from "../core/session";
import { Service, bubbleLife } from "../sim/service";
import { SALIENCE } from "../sim/perception";
import { runFrame } from "../sim/frame";
import { cool, isWarm } from "../sim/loaf";
import { Steam } from "../ui/stall/Steam";
import { WipePuff } from "../ui/stall/WipePuff";
import { Rain } from "../ui/stall/Rain";
import { ShopLight } from "../ui/stall/ShopLight";
import { BubblePool } from "../ui/stall/BubblePool";
import { TalkPanel } from "../ui/stall/TalkPanel";
import { MoneyPops } from "../ui/stall/MoneyPops";
import { GossipCorner } from "../ui/stall/GossipCorner";
import { NotebookView } from "../ui/notebook/NotebookView";
import { logNote } from "../sim/notebook";
import { chorePin } from "../ui/chorePin";
import { CLAIM } from "../sim/gossip";
import { NPCS } from "../content/npcs";
import { dishQuality, isRain, portionsFor, stockOf, take, goodsFor } from "../sim/econ";
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
import { CustomerActor, OVERLAY_DEPTH, setBubbleKeepOut, type BubbleKeepOutBox } from "../entities/CustomerActor";
import { AssemblyPanel } from "../ui/AssemblyPanel";
import { TH, TW, depthOf, toScreen } from "../world/iso";
import { COUNTER_Y } from "../world/map";
import { RENDER_SCALE } from "../core/render";
import { StallCamera } from "../world/camera";
import { artScale, fitPhoto, BOARD_TEX, BOARD_W, BASKET_TEX, BASKET_W } from "../art/photo";
import { SIGN_TILE, SKY_FROM_Y, WORLD_H, WORLD_W, assertWalkable, floorAt, isSunlit, tileAt } from "../world/map";
import {
  HAND_LABEL, STATIONS, blockedReason, stationAtTile, stationNear, type Hand, type Station,
} from "../world/stations";
import {
  BASE, COUNTER, FX, HELD, TILE, buildTextures, createSign, floorTextureAt, footY, heldFootPad,
  heldTexture, preloadArt, spriteEdges, textureForTile,
} from "../art";
import { Player } from "../entities/Player";
import { Hud, type Watch } from "../ui/Hud";
import { UI, button, buttonHeight, label, panel, textScale } from "../ui/theme";
import { music, type CueId } from "../audio/music";
import { StallAudio } from "../audio/stallAudio";

const LABEL_DEPTH = 8_000_000;

const FLY_MAX = 5;
const FLY_TILT = 0.6;
const FLY_DIRT_MIN = 0.35;
/** Bằng số ngăn lò chứ không hơn: cái rổ đỡ đúng một mẻ vừa ra, không phải để thành kho bánh. */
const BASKET_SLOTS = 3;
/** ĐO DỌC THEO MẶT QUẦY — quầy chạy chéo nên lệch theo CẢ HAI trục, tỉ lệ 2:1 là độ dốc lưới iso. */
const BASKET_STEP = 13;
/** "TÊN NGƯỜI: " ở đầu dòng = LỜI NGƯỜI (xem `routeLine`). Trần 24 ký tự cho phần tên. */
const SPEAKER_PREFIX = /^[^:\n]{1,24}: \S/;
/** Ba: đủ gỡ mọi thế kẹt tay, chưa đủ để sàn thành cái kho tiện nhất quán. */
const FLOOR_MAX = 3;
const FLOOR_REACH = 1.1;
/** 0,004/s: một mình nó mất 87 giây mới đủ bẩn để gọi một con ruồi tới. */
const FLOOR_DIRT_RATE = 0.004;
const FLOOR_SEC = 0.35;
const BIN_SEC = 0.4;
const TAKE_MONEY_SEC = 0.8;
const CHORE_R = 11;
const CHORE_EDGE = 8;
/** ⚠️ KHÔNG mượn `HUD_BAND_PX` — con số đó tính cho mấy CON SỐ TIỀN bay lên, mà cái lò nằm ngay hàng trên cùng. */
const CHORE_TOP = 58;
const CHORE_LIFT = 26;
const WIPE_DIRT = 0.15;
/** Viết thẳng số thay vì `1 − FLY_DIRT_MIN`: phép trừ đó trả về 0,35000000000000003, nhỉnh hơn ngưỡng đúng một hạt bụi. */
const WIPED_CLEAN = 0.7;


const HEAD_PX = 52;

/** ⚠️ `PLAYER_SAY_TAIL` đo từ mốc này — nới chỗ này là nới cả quãng bong bóng của cô Ba nán lại. */
const REPLY_DELAY_SEC = 1.2;
/** Ngắn hơn hẳn bong bóng khách: câu của mình là câu mình vừa tự bấm ra. Đủ cho cú tắt dần 260 ms. */
const PLAYER_SAY_TAIL = 0.35;
const HUD_BAND_PX = 74;

/** Trong một game mà im lặng là một phản ứng, nhạc chạy đè lên là nuốt mất khoảnh khắc đó. */
const HUSH_ON: ReadonlySet<StimId> = new Set<StimId>(["BURNT_OR_COLD", "DROPPED_FOOD"]);

const HUSH_SECONDS = 6;

const FINALE_SECONDS = 40;
const SKIP_AFTER = 1.5;

/** Hệ số occluder 0,45 không được miễn phí: giữ C thì KHÔNG đi được. */
const COVER_SLOW = 1.3;

/**
 * Quán bánh mì ở góc hẻm — scene này chỉ ĐIỀU PHỐI.
 * ⚠️ KHÔNG dùng Container để gom cảnh: Container của Phaser không depth-sort con.
 */
export class StallScene extends Phaser.Scene {
  private ctx!: GameContext;
  private cam!: StallCamera;
  private day!: DayScene;
  private settings!: Settings;
  private clock!: Clock;

  private player!: Player;
  private hud!: Hud;
  private ring!: Phaser.GameObjects.Image;
  private bubbles!: BubblePool;
  private audio!: StallAudio;
  private corner: GossipCorner | null = null;
  private overhearTier: Tier = 0;
  private notebook: NotebookView | null = null;
  /** Theo từng ổ, không phải một biến dùng chung — nếu không thì gác ổ A rồi nướng ổ B là A bị chấm bằng thông số của B. */
  private breadQ = 1;
  private ritualOffered = false;
  private finaleAt = -1;
  private dishReadyAt = 0;
  private pendingDebt: { record: import("../sim/till").DebtRecord; name: string; until: number } | null = null;
  private debtQueued = false;
  private dishQ = 1;

  private near: Station | null = null;

  private service!: Service;
  private actors = new Map<string, CustomerActor>();
  private assembly!: AssemblyPanel;
  private dish: Ingredient[] = [];
  /** `null` = thớt trống. Gác được thì người chơi không bị nhốt trong bảng kẹp nhân. */
  private boardLoaf: Ingredient[] | null = null;
  /** Ba số đi thành một bộ qua mọi chặng (kệ → lò → tay → thớt → khách): `warmth` · `crust` · `q`. */
  private handWarmth = 0;
  private boardWarmth = 0;
  private handSteam!: Steam;
  private boardSteam!: Steam;
  private wipePuff!: WipePuff;
  private rain: Rain | null = null;
  private light!: ShopLight;
  /** Không phải thùng rác — chỗ đặt tạm để rảnh tay, nhặt lên lúc nào cũng được, giữ nguyên thông số. */
  private floor: { x: number; y: number; hand: Hand; warmth: number; crust: number; q: number; dish: Ingredient[] }[] = [];
  /** ⚠️ Đi theo Ổ BÁNH chứ không theo BÀN TAY, y như `handCrust`; không có đường nào tẩy ngoài việc bỏ ổ đó đi. */
  private handSoiled = false;
  private boardSoiled = false;
  private floorImgs: Phaser.GameObjects.Image[] = [];
  private boardLoafImg!: Phaser.GameObjects.Image;
  private flies: Phaser.GameObjects.Image[] = [];
  private boardTopY = 0;
  private coverGfx!: Phaser.GameObjects.Graphics;
  private handCrust = 0;
  private boardCrust = 0;
  private boardQ = 1;
  private oven = new Oven();
  private ovenGfx!: Phaser.GameObjects.Graphics;
  private choreGfx!: Phaser.GameObjects.Graphics;
  private basket: {
    hand: Hand; warmth: number; crust: number; q: number; soiled: boolean;
    dish: Ingredient[]; dishQ: number; readyAt: number;
  }[] = [];
  private basketImgs: Phaser.GameObjects.Image[] = [];
  private basketTopY = 0;
  private basketX = 0;
  private basketDepth = 0;
  private boardDepth = 0;
  private labelY = new Map<string, { x: number; y: number }>();
  /** ⚠️ ĐỈNH CỦA CHÍNH CÁI VẬT, không phải `labelY` (đỉnh cả khối quầy, cao hơn mặt thớt 38 px). */
  private choreAt = new Map<string, { x: number; y: number }>();
  private grip = new Grip();
  private gripGfx!: Phaser.GameObjects.Graphics;
  /**
   * Bốn field đi CÙNG NHAU, luôn đặt qua `beBusy()`. `handsBusyWhat` là bắt buộc: thiếu nó thì lau
   * thớt xong bấm E lần nữa ra câu "tay đang bận" trong lúc tay rõ ràng đang trống.
   */
  private handsBusyUntil = 0;
  private handsBusyFrom = 0;
  private handsBusyWhat = "";
  private handsBusyBar = true;
  private holdLatch = false;
  /** Doc tách tay trái / phải; bản dựng gộp làm một. */
  private hands: "CLEAN" | "MONEY" = "CLEAN";
  private dirtyEpisode = 0;
  private lastFlourish = new Map<string, number>();
  private lastMinutes = 0;
  private elapsed = 0;
  private busy: { st: Station; ms: number } | null = null;
  /** Xếp hàng ở đây và chỉ ÁP ở bước craft của frame — để mọi thao tác đi qua đúng một cửa. */
  private intents: (() => void)[] = [];

  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private paused = false;
  private talk!: TalkPanel;
  /** Dải mở ⇒ `clock.busy`, KHÔNG đóng băng. */
  private talkRing!: Phaser.GameObjects.Graphics;
  private pendingDots!: Phaser.GameObjects.Graphics;
  private talkHoldsClock = false;
  /** Giữ cú bấm lại, mở ngay khi tay rảnh — cùng lối với `debtQueued`. */
  private talkQueued = -1;
  private talkTurn = 0;
  private playerSay: { text: string; until: number } | null = null;
  private moneyPops!: MoneyPops;
  private popClock = 0;
  private popLastNow = 0;
  private closed = false;
  private resumed = false;
  private overlay: Phaser.GameObjects.Container | null = null;
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
    // ⚖️ `burnAt` lò gas 1,25 → 1,70 đi kèm `CRUST.BURNT` 1,00 → 1,30: `rateMul` 1,35 bóp mọi cửa sổ lại
    // 1/1,35, nên ngưỡng cháy phải nới theo mới giữ được lời hứa "cửa sổ trước khi cháy RỘNG HƠN".
    if (has(this.world.equipment, "LO_GAS")) { this.oven.rateMul = 1.35; this.oven.burnAt = 1.7; }
    if (has(this.world.equipment, "KHUNG_GIA_CO")) this.grip.lossMul = 0.85;
    this.handsBusyUntil = 0;
    this.handsBusyFrom = 0;
    this.handsBusyWhat = "";
    this.handsBusyBar = true;
    this.handSoiled = false;
    this.boardSoiled = false;
    this.floor = [];
    this.hands = "CLEAN";
    this.lastFlourish = new Map();
    this.intents = [];
    this.elapsed = 0;
    this.actors.clear();
    this.off = [];
    this.resumed = !!data.resume;
    // ⚠️ Phaser dùng lại instance scene: field initializer KHÔNG chạy lại giữa hai ngày.
    this.ritualOffered = false;
    /**
     * ⚠️ Phaser KHÔNG chạy lại field initializer giữa hai ngày. Quên `talkHoldsClock` là `clock.busy`
     * kẹt true mọi frame hôm sau; quên `talkQueued` là thẻ trò chuyện tự bật lúc vừa mở hàng.
     */
    this.talkHoldsClock = false;
    this.talkQueued = -1;
    this.talkTurn = 0;
    this.playerSay = null;
    if (!this.resumed) this.clock.reset();
    this.clock.paused = false;
    this.clock.scaleMul = this.settings.noTimePressure ? 0.5 : 1;
  }

  private get world() { return this.ctx.world; }

  private get raining() { return isRain(this.world.progress.weather); }

  preload() {
    preloadArt(this);
    StallAudio.preload(this);
  }

  create() {
    if (import.meta.env.DEV) assertWalkable();

    buildTextures(this);

    const ground = this.bakeGround();
    // Dọn TRƯỚC `placeProps` — chính nó gọi `addStationLabel` để nạp lại.
    this.labelY.clear();
    this.choreAt.clear();
    this.basketImgs = [];
    this.floorImgs = [];
    this.cam = new StallCamera(this, this.sceneBounds(ground, this.placeProps()));
    /** `backgroundColor` là thứ duy nhất vẽ ra ngoài hình bao của cảnh, còn lớp phủ chỉ phủ `worldView`. */
    this.cameras.main.setBackgroundColor(this.raining ? "#5f686c" : "#6f838d");
    this.rain = Rain.for(this, this.world.progress.weather, this.settings.reducedMotion);
    this.light = new ShopLight(this);

    this.ring = this.add.image(0, 0, FX.ring).setOrigin(0.5, 0.5).setVisible(false);

    this.player = new Player(this);
    this.player.reset();

    this.hud = new Hud(this, this.settings, () => (this.paused ? this.resume() : this.pause()));
    this.talkRing = this.add.graphics();
    this.pendingDots = this.add.graphics();
    this.talk = new TalkPanel(this, (i) => this.pickTalk(i), () => this.endTalk(),
      () => this.paused || this.closed || !!this.overlay);
    this.moneyPops = new MoneyPops(this, this.settings.textScale, LABEL_DEPTH + 6);
    this.handSteam = new Steam(this);
    this.boardSteam = new Steam(this);
    this.wipePuff = new WipePuff(this);
    this.flies = [];
    // origin (0,5 · 1): `y` là MÉP DƯỚI texture, để `heldFootPad` đặt đáy thật của ổ chạm mặt thớt.
    this.boardLoafImg = fitPhoto(this.add.image(0, 0, HELD.key("loaf_hot")))
      .setOrigin(0.5, 1).setVisible(false);
    this.coverGfx = this.add.graphics();
    this.ovenGfx = this.add.graphics().setDepth(LABEL_DEPTH + 2);
    this.choreGfx = this.add.graphics().setDepth(LABEL_DEPTH + 4);
    this.gripGfx = this.add.graphics();
    this.lastMinutes = this.clock.minutes;
    this.bubbles = new BubblePool(this, this.settings.textScale, undefined, () => {
      telemetry.bubblePoolSteals++;
      bus.emit("telemetry:mark", { key: "bubble.steal", value: 1 });
    });

    // Seed cố định theo ngày: phát lại ngày đó ra y hệt, chống save-scum.
    const w = this.world;
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
      todayCounters: w.progress.today,
      readMul: (this.settings.textScale > 1 ? 1.25 : 1) * (this.settings.noTimePressure ? 1.5 : 1),
      resumeAt: this.resumed || w.flags.lateOpenDay === w.progress.dayIndex ? this.clock.minutes : undefined,
    });
    this.assembly = new AssemblyPanel(this,
      (dish, even) => this.intents.push(() => this.finishDish(dish, even)),
      (dish) => { this.boardLoaf = dish; },
      (id) => this.intents.push(() => this.onPlace(id)),
      (i) => this.usePreset(i),
      (id, stack) => {
        // Đếm theo HÀNG TRONG KHO, không theo id nguyên liệu: `dualeo` và `hanhngo` cùng rút từ một hàng RAU.
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

    /** Dựng SAU `service` vì nó hỏi `service` chỗ từng khách đứng để pan tiếng về đúng phía. */
    const ambientRng = this.ctx.rng.stream("ambient");
    this.audio = new StallAudio({
      scene: this,
      panOf: (npcId) => this.panOf(npcId),
      rand: () => ambientRng.next(),
    });

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
        this.basket = (st.basket ?? []).slice(0, BASKET_SLOTS).map((l) => ({
          ...l,
          hand: (l.hand ?? "loaf_hot") as Hand,
          soiled: !!l.soiled,
          dish: (l.dish ?? []) as Ingredient[],
          dishQ: l.dishQ ?? 1,
          readyAt: l.readyAt ?? 0,
        }));
        this.floor = (st.floor ?? []).slice(0, FLOOR_MAX)
          .map((f) => ({ ...f, hand: f.hand as Hand, dish: f.dish as Ingredient[] }));
        this.handSoiled = !!st.handSoiled;
        this.boardSoiled = !!st.boardSoiled;
      } else {
        this.basket = [];
        this.floor = [];
      }
      st.board = null; st.hand = null; st.basket = null; st.floor = null;
    }

    music.duck(false);
    this.syncMusic();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      const st = this.world.stall;
      st.board = this.boardLoaf
        ? { dish: [...this.boardLoaf], warmth: this.boardWarmth, crust: this.boardCrust, q: this.boardQ }
        : null;
      st.hand = this.player.hand !== "empty"
        ? { item: this.player.hand, warmth: this.handWarmth, crust: this.handCrust, q: this.breadQ }
        : null;
      st.basket = this.basket.length ? this.basket.map((l) => ({ ...l })) : null;
      st.floor = this.floor.length ? this.floor.map((f) => ({ ...f, dish: [...f.dish] })) : null;
      st.handSoiled = this.handSoiled;
      st.boardSoiled = this.boardSoiled;
      // Nhạc đang bị hạ −12 dB vì pause — phải trả về trước khi rời scene.
      if (this.paused && !this.closed) {
        music.duck(false);
        bus.emit("ui:pauseToggled", { paused: false, source: "MENU" });
      }
      this.audio?.destroy();
      // ⚠️ Listener gắn trên `window` (capture): không gỡ là Esc của màn sau vẫn chạy vào cái thẻ đã chết.
      this.wipePuff.destroy();
      this.rain?.destroy();
      this.rain = null;
      this.light.destroy();
      this.talk.destroy();
      // ⚠️ Không gỡ thì mỗi ngày thêm một bộ listener, và listener cũ trỏ vào scene đã huỷ.
      this.cam.destroy();
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

  private wire() {
    // KHÔNG ghi "ổ bánh không đúng đơn" lên màn hình: đó là hệ thống chấm điểm, không phải một sự việc.
    this.listen("perception:confirmed", (p) => {
      if (HUSH_ON.has(p.stimId)) music.hush(HUSH_SECONDS);
      // Hỏi NGAY TẠI KHOẢNH KHẮC, không hỏi cuối buổi — cuối buổi thì người ta đã quên.
      if (PLAYTEST && NEGATIVE_STIMS.has(p.stimId)) this.pause("PLAYTEST");
    });
    this.listen("npc:left", (p) => {
      // SOILED_FOOD cũng là MẤT một người khách thật — họ tới, đứng chờ, rồi về tay không.
      if (p.reason === "IMPATIENT" || p.reason === "SOILED_FOOD") this.world.progress.today.lost++;
    });
    /** Nghe `money:changed` chứ không gắn vào từng chỗ trả tiền — thêm đường tiền mới mai mốt là nó tự có số bay. */
    this.listen("money:changed", (p) => {
      if (this.closed) return;
      const { sx, sy } = toScreen(this.player.x, this.player.y);
      const ceil = this.cameras.main.scrollY + HUD_BAND_PX * textScale();
      this.moneyPops.pop(p.delta, sx, footY(sy) - HEAD_PX, this.popClock, ceil);
    });
    this.listen("save:written", () => this.hud.flashSaved());

    /** T3 không bị phá: không con số, không tổng, không thanh — chỉ một dòng nói HƯỚNG và cái VIỆC vừa làm ra nó. */
    this.listen("relationship:moved", (p) => {
      if (this.closed) return;
      const who = NPCS.find((n) => n.id === p.npcId)?.name ?? "khách";
      const verb = p.dir === "UP"
        ? (p.strength === "RO" ? "quý hẳn lên" : "vui hơn một chút")
        : (p.strength === "RO" ? "phật ý" : "hơi kém vui");
      this.hud.toast(`${who} ${verb} — ${p.note}`, p.dir === "UP" ? "good" : "bad", this.popClock);
    });

    /** Ba đường có sẵn đều rất kín, nên người chơi bị tin đồn làm cho ế mà không biết là có tin đồn. */
    this.listen("gossip:mentioned", (p) => {
      if (this.closed) return;
      const c = CLAIM[p.claim];
      if (!c) return;
      const who = NPCS.find((n) => n.id === p.npcId)?.name ?? "khách";
      const src = p.source ? NPCS.find((n) => n.id === p.source)?.name : null;
      this.hud.toast(
        `${who} nhắc chuyện ${c.label}${src ? ` — nghe từ ${src}` : ""}`,
        c.valence < 0 ? "bad" : "good", this.popClock,
      );
    });
    this.listen("gossip:overheard", (p) => {
      if (this.closed || p.tier === 0) return;
      const c = CLAIM[p.claim];
      if (!c) return;
      const src = p.tier === 2 && p.source ? NPCS.find((n) => n.id === p.source)?.name : null;
      this.hud.toast(
        `nghe lỏm ngoài hẻm: chuyện ${c.label}${src ? ` — từ ${src}` : ""}`,
        c.valence < 0 ? "bad" : "good", this.popClock,
      );
    });
  }

  // ───────────────────────────────────────────────────────────────── dựng cảnh

  /** Hình bao THẬT của những gì đã dựng, không phải của lưới ô — tường cao nhô lên cả trăm pixel. */
  private sceneBounds(ground: Phaser.Geom.Rectangle, props: Phaser.GameObjects.Image[]) {
    const bounds = Phaser.Geom.Rectangle.Clone(ground);
    for (const img of props) Phaser.Geom.Rectangle.Union(bounds, img.getBounds(), bounds);
    return bounds;
  }

  /** Gọi `drawFrame()` cho từng ô riêng lẻ sẽ tụt fps thấy rõ khi map to ra. */
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
    for (let ty = 0; ty < WORLD_H; ty++)
      for (let tx = 0; tx < WORLD_W; tx++) put(floorTextureAt(floorAt(tx, ty), tx, ty), tx, ty);
    /** Trời không vừa đổ nắng gắt vừa đổ mưa. Cả hai chỉ dán NGOÀI TRỜI. */
    for (let ty = 0; ty < WORLD_H; ty++) {
      for (let tx = 0; tx < WORLD_W; tx++) {
        if (!this.raining) { if (isSunlit(tx, ty)) put(TILE.sun, tx, ty); continue; }
        if (ty < SKY_FROM_Y) continue;
        /** Một vệt phản chiếu chỉ có nghĩa khi nó là ẢNH CỦA MỘT NGUỒN SÁNG; rắc đều theo ô thì mắt đọc ra là lỗi texture. */
        put(TILE.wet, tx, ty);
      }
    }
    rt.endDraw();
    return new Phaser.Geom.Rectangle(minX, minY, w, h);
  }

  private placeProps() {
    const placed: Phaser.GameObjects.Image[] = [];
    for (let ty = 0; ty < WORLD_H; ty++) {
      for (let tx = 0; tx < WORLD_W; tx++) {
        const code = tileAt(tx, ty);
        const key = textureForTile(code, tx, ty, {
          isCounterEnd: code === "Q" && (tileAt(tx - 1, ty) !== "Q" || tileAt(tx + 1, ty) !== "Q"),
          isStation: stationAtTile(tx, ty) !== null,
        });
        if (!key || !this.textures.exists(key)) continue;

        const img = this.addAt(key, tx, ty);
        placed.push(img);
        const st = stationAtTile(tx, ty);
        if (st) this.addStationLabel(st, img);
        if (st?.id === "board") this.addBoard(img, tx, ty);
        if (st?.id === "basket") this.addBasket(img, tx, ty);
        if (key === COUNTER.end) this.addOnCounter(img, tx, ty, BASKET_TEX, BASKET_W);
      }
    }

    // Depth phải vượt TOÀN BỘ hàng tường y=0: bảng trải ngang qua mấy ô, mỗi ô có depth riêng tăng dần.
    const { sx, sy } = toScreen(SIGN_TILE.x, SIGN_TILE.y);
    createSign(this, sx, sy, depthOf(WORLD_W, 0) + 1);

    return placed;
  }

  /** `artScale`: `photo.ts` nướng dư pixel nên sprite phải thu lại đúng từng ấy lần; Graphics trả về 1. */
  private addAt(key: string, tx: number, ty: number) {
    const { sx, sy } = toScreen(tx + 0.5, ty + 0.5);
    return this.add.image(sx, footY(sy), key)
      .setOrigin(0.5, 1)
      .setScale(1 / artScale(key))
      .setDepth(depthOf(tx + 0.5, ty + 0.5));
  }

  /**
   * Theo MỐC CỦA CHÍNH KHÚC QUẦY chứ không theo lưới ô (mặt quầy cao hơn mặt đất, mà `footY` chỉ biết
   * mặt đất). Depth bám theo ô của nó: người chơi đi ra trước quầy thì phải che được nó.
   */
  /** Mốc là MẶT QUẦY (`COUNTER.TOP_ABOVE_FOOT`), không mặt đất. Origin (0,5 · 1) là mép TRƯỚC của ê-líp đáy. */
  private addOnCounter(img: Phaser.GameObjects.Image, tx: number, ty: number, key: string, w: number) {
    if (!this.textures.exists(key)) return null;
    const topY = img.y - COUNTER.TOP_ABOVE_FOOT;
    const sprite = fitPhoto(this.add.image(img.x, topY + w / 4, key))
      .setOrigin(0.5, 1)
      .setDepth(depthOf(tx + 0.5, ty + 0.5) + 1);
    return { sprite, topY };
  }

  /** Không có cái rổ nào cả: nó không chứa được ổ ĐÃ GÓI, và ổ gác lên "miệng rổ" là gác lên một con số ước lượng. */
  private addBasket(img: Phaser.GameObjects.Image, tx: number, ty: number) {
    this.basketX = img.x;
    this.basketTopY = img.y - COUNTER.TOP_ABOVE_FOOT;
    // Depth lấy từ chính Ô của nó cộng một hạt — vật nằm TRÊN mặt quầy ở ô này.
    this.basketDepth = depthOf(tx + 0.5, ty + 0.5) + 0.5;
    // Ghi đè mốc mặc định của `addStationLabel`: ở đây không có VẬT nào, nên neo theo mặt quầy.
    this.choreAt.set("basket", { x: this.basketX, y: this.basketTopY - 5 });
  }

  private addBoard(img: Phaser.GameObjects.Image, tx: number, ty: number) {
    const made = this.addOnCounter(img, tx, ty, BOARD_TEX, BOARD_W);
    if (!made) {
      // ⚠️ Thiếu ảnh cái thớt thì KHÔNG để `choreAt("board")` rơi về mốc mặc định — dấu sẽ trỏ vào nóc tủ kính.
      this.boardTopY = img.y - COUNTER.TOP_ABOVE_FOOT;
      this.choreAt.set("board", { x: img.x, y: this.boardTopY - 5 });
      return;
    }
    // Bề dày thớt = tổng cao trừ hai nửa ê-líp (đáy và mặt trên cùng hình).
    this.boardTopY = made.topY - (made.sprite.displayHeight - BOARD_W / 2);
    // Dấu "thớt dơ" neo vào CÁI THỚT, không vào nóc tủ kính của khúc quầy.
    const e = spriteEdges(this, made.sprite);
    this.choreAt.set("board", { x: e.cx, y: e.top - 5 });
    // `boardLoafImg` chưa dựng ở thời điểm này (`placeProps` chạy trước) — ghi depth rồi áp sau.
    this.boardDepth = made.sprite.depth + 0.5;
  }

  /** ⚠️ Neo là toạ độ THẾ GIỚI, KHÔNG kẹp vào khung nhìn mỗi frame — kẹp là kéo vòng độ giòn chạy theo chân người chơi. */
  private addStationLabel(st: Station, img: Phaser.GameObjects.Image) {
    // Đo MÉP THẬT của cái vật, không lấy khung texture: `displayHeight` của khúc quầy là cả khối kể cả nóc tủ.
    const e = spriteEdges(this, img);
    const x = e.cx, y = e.top - 5;
    this.labelY.set(st.id, { x, y });
    this.choreAt.set(st.id, { x, y });
  }




  // ───────────────────────────────────────────────────────────────────── input

  private bindInput() {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys("W,A,S,D,UP,LEFT,DOWN,RIGHT,E,SPACE,Q,R,ESC,SHIFT,C,F,P") as any;

    // MỘT handler duy nhất: Phaser bắn `keydown-E` TRƯỚC `keydown` chung, và có lúc phát lại CÙNG một sự
    // kiện phím DOM vài lần trong một frame chậm — nhận diện theo chính object sự kiện.
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
      if (ev.code === "KeyP") { this.pause(); return; }
      if (ev.code === "Tab") { ev.preventDefault(); this.openNotebook(); return; }
      if (this.assembly.isOpen) { this.assembly.handleKey(ev.code); return; }
      if (ev.code === "KeyQ") this.intents.push(() => this.discard());
      else if (ev.code === "KeyE" || ev.code === "Space") this.intents.push(() => this.press());
      else if (ev.code === "KeyR") this.intents.push(() => this.liftFromBoard());
      else if (ev.code === "KeyF") this.intents.push(() => this.askFront());
      else if (ev.code === "KeyG") this.intents.push(() => this.writeDebt());
    });
  }

  private holdingWorkKey() {
    return this.keys.E.isDown || this.keys.SPACE.isDown;
  }

  // ──────────────────────────────────────────────────────────────────── update

  /** Vòng đời một frame — qua `runFrame` để test bắt được nếu ai đó đổi thứ tự. */
  update(_t: number, dtMs: number) {
    runFrame({
      clock: (raw) => {
        frameDeltas.push(raw);
        if (frameDeltas.length > 5400) frameDeltas.shift();
        this.clock.busy = this.service.busy || this.talkHoldsClock || this.finaleAt >= 0;
        return this.closed ? 0 : this.clock.advance(raw);
      },
      input: (dt) => {
        /** Khoá PHÍM mà không khoá CHÂN thì "mất 2,5 giây" không tốn gì. ⚠️ Truyền input toàn `false`, không bỏ qua `move()`. */
        const rooted = this.handsBusy || !!this.busy;
        this.player.move(rooted ? { up: false, down: false, left: false, right: false, run: false } : {
          up: this.keys.W.isDown || this.keys.UP.isDown,
          down: this.keys.S.isDown || this.keys.DOWN.isDown,
          left: this.keys.A.isDown || this.keys.LEFT.isDown,
          right: this.keys.D.isDown || this.keys.RIGHT.isDown,
          run: this.keys.SHIFT.isDown && !this.keys.C.isDown,
        }, dt);
        this.near = stationNear(this.player.x, this.player.y, this.near);
        if (this.assembly.isOpen && this.near?.id !== "board") this.assembly.park();
        if (this.busy && this.near?.id !== this.busy.st.id) this.busy = null;
      },
      craft: (dt) => {
        for (const act of this.intents.splice(0)) act();
        this.tickDebt();
        this.tickStation(dt * 1000);
        for (const _ of this.oven.tick(dt)) {
          bus.emit("stim:emitted", { stimId: "BURNT_OR_COLD", zone: "OVEN", salience: SALIENCE.BURNT_OR_COLD, at: this.elapsed, smell: true });
          this.hud.toast("khét rồi!", "bad", this.popClock);
        }
        this.tickGrip(dt);
        this.addDirt(0.0015 * Math.max(0, this.clock.minutes - this.lastMinutes));
        this.lastMinutes = this.clock.minutes;
        this.service.dirt = this.dirt;
        this.service.handsDirty = this.hands === "MONEY";
        this.service.playerAt = { x: this.player.x, y: this.player.y };
        /** ⚠️ `Service` tự kết thúc phiên ở hai chỗ scene không biết; thiếu nhánh này thì `talkHoldsClock` kẹt và đồng hồ không bao giờ tua nhanh nữa. */
        if (this.talk.isOpen && !this.service.talkOpen) this.closeTalkPanel();
        this.service.interruptible = this.canBeInterrupted();
        this.service.playerHand = this.player.hand;
        this.service.playerOnStreet = this.player.y > COUNTER_Y + 0.5;
        const hand = this.player.hand;
        this.service.soldOut = stockOf(this.world.inventory, "BANH", this.world.progress.dayIndex) === 0
          && this.oven.count === 0 && !this.boardLoaf && !hand.startsWith("loaf");
        const weather = this.world.progress.weather;
        if (this.player.hand === "loaf_hot" || this.player.hand === "loaf_filled") this.handWarmth = cool(this.handWarmth, dt, weather);
        if (this.boardLoaf) this.boardWarmth = cool(this.boardWarmth, dt, weather);
        for (const l of this.basket) l.warmth = cool(l.warmth, dt, weather);
        for (const f of this.floor) f.warmth = cool(f.warmth, dt, weather);
        // …và để đó thì quán BẨN DẦN. Đây là cái giá duy nhất của phím Q.
        if (this.floor.length) this.addDirt(FLOOR_DIRT_RATE * this.floor.length * dt);
      },
      perception: (dt) => {
        this.elapsed += dt;
        /** ⚠️ Scene chỉ đưa SỰ THẬT THÔ: đừng gán thẳng `service.ovenHot`, bảng đen khai fact đó nghĩa khác. */
        this.service.ovenBusy = this.oven.busy;
        this.service.perceive(dt, this.elapsed, this.occluders());
      },
      npc: (dt) => {
        this.service.tickNpcs(dt, {
          minutes: this.clock.minutes,
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
        // Khoảng lặng ngày 40 phải được mở TRƯỚC cú đóng quầy theo đồng hồ, trong CÙNG frame.
        this.tickFinale();
        if (this.clock.isOver && !this.service.busy && this.finaleAt < 0 && !this.hasFinale) this.close("CLOCK");
      },
      render: (dt) => { this.syncAudio(dt); this.renderSync(dt); },
      renderPaused: () => { this.syncAudio(0); this.renderSync(0); },
    }, dtMs);
  }

  /** Ba tầng theo việc người chơi đang làm: tay bận → biết có người nói · đứng yên → nghe nội dung · giữ Shift → nghe cả nguồn. */
  private tickOverhear(dt: number) {
    const k = this.corner;
    if (!k) return;
    const handsBusy = this.player.hand !== "empty" || this.assembly.isOpen || this.busy !== null || this.handsBusy;
    const still = !this.player.moving;
    const loud = has(this.world.equipment, "LOA_RAO") && (this.world.econ.loaOffUntil ?? 0) < this.world.progress.dayIndex;
    const tier: Tier = handsBusy || !still ? 0 : this.keys.SHIFT.isDown && !loud ? 2 : 1;
    this.overhearTier = tier;
    if (k.sc.state === "PLAY" && tier === 2) this.service.playerLeaning();
    const quiet = this.service.audience.length <= 2
      && !this.service.customers.some((c) => c.memKey === k.sc.plan.a || c.memKey === k.sc.plan.b);
    const ended = k.sc.tick(dt, { minutes: this.clock.minutes, quiet, tier });
    if (ended) {
      const p = k.sc.plan;
      const source = k.sc.bestFirst >= 2 ? p.source : null;
      bus.emit("gossip:overheard", { a: p.a, b: p.b, claim: p.claim, source, tier: k.sc.best });
      const nb = this.world.notebook;
      if (p.claim.startsWith("story:")) {
        onStoryOverheard(this.world.story, p.claim, k.sc.best, this.world.progress.dayIndex);
        if (nb && k.sc.best >= 1) logNote(nb, this.world.progress.dayIndex, this.clock.minutes, p.a, { t: "SAID_SOMETHING", text: p.lines.join(" — ") });
        return;
      }
      if (nb && k.sc.best >= 1) {
        logNote(nb, this.world.progress.dayIndex, this.clock.minutes, p.a, { t: "EAVESDROP", claim: p.claim, ...(source ? { source } : {}) });
        if (CLAIM[p.claim]?.valence < 0) nb.today.heardBad = true; else nb.today.heardGood = true;
      }
    }
  }

  /** CHỈ ĐỌC state rồi vẽ. `dt` là giây THẬT và bằng 0 khi pause. */
  private renderSync(dt: number) {
    const p = toScreen(this.player.x, this.player.y);
    this.cam.lookAt(p.sx, footY(p.sy));
    this.syncActors();
    this.syncMusic();
    this.player.heldCrust = this.handCrust;
    this.player.draw(this.settings.reducedMotion, this.keys.C.isDown, this.settings.playerMarker !== false);
    this.drawPlayerBubble();
    setBubbleKeepOut(this.bubbleKeepOut());
    for (const a of this.actors.values()) a.draw(this.settings.reducedMotion, this.time.now, this.elapsed);
    this.moneyPops.update(this.tickPopClock(), this.settings.reducedMotion);
    this.drawTalkTarget();
    this.drawPendingTalk();
    this.drawRing();
    this.drawSteam();
    this.drawOven();
    this.drawGrip();
    this.drawDirt();
    this.drawChores();
    this.drawBasket();
    this.drawFloorItems();
    this.drawCover();
    this.corner?.draw(this.overhearTier, this.clock.minutes, this.time.now, this.settings.reducedMotion);
    this.rain?.draw(this.cam.world.worldView, dt, this.time.now, this.settings.reducedMotion);
    // ⚠️ Phải gọi SAU lớp mưa: vũng sáng cộng lên TRÊN lớp phủ.
    this.light.draw(this.raining);
    const ticket = this.frontTicket();
    this.hud.dockFeed(this.assembly.isOpen);
    this.hud.update({
      day: this.world.progress.dayIndex, seasonDays: SEASON_DAYS, clock: this.clock,
      money: this.world.money.cash, served: this.world.progress.today.served,
      near: this.assembly.isOpen ? null : this.near, hand: this.player.hand, busy: this.busy,
      frozen: this.paused || this.closed,
      ticket: ticket,
      carry: this.player.hand === "loaf_filled" ? this.dish : null,
      hands: this.hands,
      prompt: this.promptLine(),
      watch: this.watchLevel(),
      now: this.popClock,
      // Thanh tay chỉ hiện khi KHÔNG đang giữ phím ở trạm nào — hai thứ dùng chung một chỗ vẽ.
      work: !this.busy && this.handsBusy && this.handsBusyBar ? { frac: this.handsBusyFrac } : null,
    });
  }

  /** Đọc THẲNG từ máy trạng thái ánh nhìn chứ không từ `certainty`: con mắt phải sáng TRƯỚC khi mình làm bậy. */
  private watchLevel(): Watch {
    let out: Watch = "NONE";
    for (const c of this.service.customers) {
      if (c.phase === "arriving" || c.phase === "leaving") continue;
      if (c.gazeState === "LOOK_HANDS") return "CLOSE";
      if (c.gazeState === "LOOK_FACE") out = "GLANCE";
    }
    return out;
  }

  /** Đứng yên khi pause nên số tiền treo nguyên chờ người chơi đọc xong. */
  private tickPopClock() {
    const now = this.time.now;
    const dt = this.popLastNow ? now - this.popLastNow : 0;
    this.popLastNow = now;
    if (!this.clock.paused && !this.closed) this.popClock += Math.min(dt, CLOCK_DT_CLAMP_MS);
    return this.popClock;
  }

  /** TAY là chỗ người chơi đang đứng (tay đi theo người), mấy vùng còn lại cố định theo trạm. */
  private zonePoint = (slot: Station["slot"]) => {
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

  /** MỘT chỗ duy nhất quyết dòng nhắc. Thứ tự ưu tiên là thứ tự "việc gấp nhất trước". */
  private promptLine(): string | null {
    /** ⚠️ Dòng trò chuyện phải ở ĐẦU chuỗi: để sau mấy nhánh trạm thì đứng ở lò hay thớt nó không bao giờ hiện. */
    const waiting = this.service.talkTargetNow;
    if (waiting && !this.talk.isOpen && this.service.pendingTalkers.includes(waiting.id)) {
      return `${this.service.label(waiting)} đang chờ mình trả lời — bấm F`;
    }
    const d = this.pendingDebt;
    if (d && this.elapsed <= d.until) {
      const amt = d.record.trueAmount.toLocaleString("vi-VN");
      return `G — ghi sổ nợ: ${d.name} ${amt}₫${this.debtQueued ? " (ghi ngay khi rảnh tay)" : ""}`;
    }
    if (this.finaleAt >= 0 && this.elapsed - this.finaleAt > SKIP_AFTER) return "Enter — thôi, dọn hàng";
    if (this.handsBusy) return `${this.handsBusyWhat || "tay đang bận"}…`;
    if (this.keys.C.isDown) return "che tay — đi chậm lại, không chạy được";
    if (this.player.hand === "empty" && this.nearestFloor() >= 0) {
      return "dưới sàn có đồ, bấm Q nhặt lên";
    }
    if (this.near?.id === "oven") return this.ovenPrompt();
    if (this.near?.id === "basket") return this.basketPrompt();
    if (this.near?.id === "bin") {
      return this.player.hand === "empty"
        ? "thùng rác — tay không có gì để bỏ"
        : `thùng rác — bấm E bỏ ${HAND_LABEL[this.player.hand]} đi`;
    }
    if (this.near?.id === "board") {
      const slow = this.dirt > FLY_DIRT_MIN ? " — thớt dơ, lau lâu hơn" : "";
      return this.boardPrompt() ?? (this.player.hand === "empty" ? `thớt — bấm E để lau thớt${slow}` : null);
    }
    const who = this.service.talkTargetNow;
    if (who && !this.talk.isOpen) {
      return this.service.talkVerb(who) === "mời"
        ? `F — mời ${this.service.label(who)} ghé mua`
        : `F — nói chuyện với ${this.service.label(who)}`;
    }
    return null;
  }

  private ovenPrompt(): string {
    const h = this.player.hand, n = this.oven.count;
    const lo = has(this.world.equipment, "LO_GAS") ? "lò gas" : "lò than";
    if (h === "loaf_cold") return this.oven.hasRoom ? `${lo} — bấm E bỏ ổ vô (${n}/${OVEN_SLOTS})` : `${lo} — lò đầy rồi`;
    if (h === "empty") return n ? `${lo} — bấm E lấy ổ chín nhất ra` : `${lo} — lò trống, lấy ổ bánh ở kệ trước`;
    return `${lo} — tay đang cầm đồ`;
  }

  /** ĐÚNG câu khách nói, nguyên văn, ghim suốt lượt — checklist đã phân tích sẵn là giết T2. */
  /** Theo KHOẢNG CÁCH THẬT chứ không tra bảng slot, vì chính người chơi cũng di chuyển dọc quầy. Trần 0,6. */
  private panOf(npcId: string): number {
    const c = this.service.customers.find((x) => x.memKey === npcId && x.phase !== "leaving")
      ?? this.service.customers.find((x) => x.memKey === npcId);
    if (!c) return 0;
    return Math.max(-0.6, Math.min(0.6, (c.x - this.player.x) / 6));
  }

  private frontTicket() {
    const c = this.service.front;
    if (!c || !c.orderLine || c.phase === "leaving") return null;
    return { name: this.service.label(c), text: `"${c.orderLine}"`, urgent: false };
  }

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

  /** LỜI NGƯỜI luôn có dạng `TÊN NGƯỜI: câu nói`. ⚠️ Dấu ngoặc kép không dùng để nhận ra được — câu gọi món không có ngoặc. */
  private routeLine(text: string) {
    if (SPEAKER_PREFIX.test(text)) this.hud.say(text);
    else this.hud.toast(text, "info", this.popClock);
  }

  private drainService() {
    for (const ev of this.service.drain()) {
      if (ev.kind === "log") { this.routeLine(ev.text); continue; }
      const w = this.world;
      if (ev.kind === "cost") {
        w.money.cash -= ev.amount;
        // Phải vào sổ, không thì cột "đếm tiền" buổi tối lệch đúng bội số của `TEA_COST`.
        if (ev.item === "talk") w.econ.today.story += ev.amount;
        else w.econ.today.fixed += ev.amount;
        bus.emit("money:changed", { delta: -ev.amount, balance: w.money.cash, reason: "TEA" });
        continue;
      }
      if (ev.kind === "credit") {
        w.progress.today.served++;
        if (creditBookOpen(w.progress.dayIndex)) {
          // Cửa sổ MỜI phải trùng cửa sổ NHẬN: cú bán vừa xong còn khoá tay `TAKE_MONEY_SEC`.
          this.pendingDebt = { record: ev.record, name: ev.name, until: Math.max(this.elapsed, this.handsBusyUntil) + 4 };
          this.debtQueued = false;
          this.hud.toast(`${ev.name} mua chịu ${ev.record.trueAmount.toLocaleString("vi-VN")}₫ — bấm G để ghi sổ`, "info", this.popClock);
        } else this.hud.toast(`${ev.name} mua chịu ${ev.record.trueAmount.toLocaleString("vi-VN")}₫ — chưa có sổ, nhớ trong đầu`, "info", this.popClock);
        continue;
      }
      if (ev.kind === "repay") {
        w.money.cash += ev.amount;
        w.progress.today.revenue += ev.amount;
        this.hud.toast(`${ev.name} trả tiền bữa trước ${ev.amount.toLocaleString("vi-VN")}₫`, "good", this.popClock);
        bus.emit("money:changed", { delta: ev.amount, balance: w.money.cash, reason: "DEBT_REPAID" });
        continue;
      }
      // Khách tự bắt chuyện chỉ là một lời mời — không bấm F cũng không sao.
      /** Toast là tín hiệu TỨC THỜI gắn vào một trạng thái BỀN. Thay bằng bong bóng trên đầu họ + dấu bền `drawPendingTalk()`. */
      if (ev.kind === "talkOffer") continue;
      /** ⚠️ Phải làm ở ĐÂY, không trong `Service`: `service.playerHand = player.hand` chạy mỗi frame. */
      if (ev.kind === "takeHand") {
        this.player.hand = "empty";
        this.dish = [];
        this.handWarmth = 0;
        this.handCrust = 0;
        this.audio.wrap();
        continue;
      }
      w.money.cash += ev.amount;
      w.progress.today.revenue += ev.amount;
      w.progress.today.served++;
      bus.emit("money:changed", { delta: ev.amount, balance: w.money.cash, reason: "SALE" });
    }
  }

  /** Bấm sớm (tay còn bận) thì cú bấm được XẾP HÀNG, không bị vứt. */
  private writeDebt() {
    const p = this.pendingDebt;
    if (!p || this.elapsed > p.until) return;
    if (this.handsBusy) { this.debtQueued = true; return; }
    p.record.playerWrote = p.record.trueAmount;
    this.pendingDebt = null;
    this.debtQueued = false;
    const sec = this.workSeconds(2.0);
    this.beBusy(sec, "đang ghi sổ");
    this.audio.writeFor(sec);
    this.hud.toast(`đã ghi sổ: ${p.name} ${p.record.trueAmount.toLocaleString("vi-VN")}₫`, "good", this.popClock);
  }

  /** Cú G bấm sớm: giữ lại tới đúng lúc tay rảnh rồi mới ghi. */
  private tickDebt() {
    if (this.pendingDebt && this.elapsed > this.pendingDebt.until) { this.pendingDebt = null; this.debtQueued = false; }
    if (this.debtQueued && !this.handsBusy) this.writeDebt();
    // Cú bấm nói chuyện đã xếp hàng: mở ngay khi tay rảnh, và tự hết hạn sau 4 giây —
    // quá lâu thì người chơi đã quên mình bấm gì, mở ra là một cái bảng từ trên trời rơi xuống.
    if (this.talkQueued >= 0) {
      if (this.elapsed - this.talkQueued > 4) this.talkQueued = -1;
      else if (!this.handsBusy) { this.talkQueued = -1; this.askFront(); }
    }
  }

  /** Ngắt giữa chừng một nhiệm vụ con đắt hơn hẳn ngắt ở ranh giới. Bảy cửa sổ cấm, theo thứ tự dễ gặp: */
  private canBeInterrupted(): boolean {
    const h = this.player.hand;
    if (h === "loaf_hot" || h === "loaf_filled") return false;   // ⛔ ổ nóng đang nguội trên tay
    if (h === "tea") return false;                               // ⛔ ly trà đang trên tay
    if (this.assembly.isOpen) return false;                      // ⛔ bảng kẹp nhân đang mở
    if (this.handsBusy || this.busy) return false;               // ⛔ rót, lau, rửa, ghi sổ
    if (this.boardLoaf) return false;                            // ⛔ còn ổ dở trên thớt
    if (this.floor.length) return false;                         // ⛔ còn đồ rơi dưới sàn
    // ⛔ lò đã qua vạch giòn: mấy giây nữa là sém, đây không phải lúc ngoảnh đi
    if (this.oven.slots.some((l) => l && bandOfCrust(l.crust, this.oven.burnAt) !== "RAW")) return false;
    return true;
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

    if (!this.busy || this.busy.st.id !== st!.id) {
      this.busy = { st: st!, ms: 0 };
      /** Nổ lúc bắt đầu giữ, không ở `finish` — đặt ở `finish` thì tiếng rót kêu đúng lúc ly đã đầy. */
      if (st!.id === "tea") this.audio.tea();
    }
    // Giữ C: thao tác chậm 1,3× (P1-02 §2.8 Công cụ 3) — thanh tiến trình bò chậm lại,
    // nhìn thấy được ngay chứ không phải một hệ số giấu sau lưng.
    this.busy.ms += this.keys.C.isDown ? dtMs / COVER_SLOW : dtMs;

    if (st!.overcookMs) {
      if (this.busy.ms >= st!.overcookMs) {              // giữ quá tay: cháy, không cứu được
        this.player.hand = st!.spoils ?? "loaf_burnt";
        this.emit("BURNT_OR_COLD", undefined, true);   // giữ quá tay ở lò = ổ CHÁY, có mùi
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
    if (st.id === "sink" && has(e, "VOI_BON")) return 500;
    if (st.id === "tea" && has(e, "BINH_TRA")) return 250;
    return st.holdMs;
  }

  /** Nhấn một cái ăn ngay (trạm có holdMs = 0). Tách hàm để test gọi thẳng được. */
  private press() {
    if (this.paused || this.closed) return;
    // Đang dở một việc: dòng nhắc đã ghi rõ "đang lau thớt…" kèm thanh tiến trình.
    if (this.handsBusy) return;
    const st = this.near;
    if (st?.id === "oven") { this.pressOven(); return; }
    if (st?.id === "basket") { this.pressBasket(); return; }
    if (st?.id === "board" && this.player.hand === "empty") {
      // E Ở THỚT CHỈ CÓ MỘT NGHĨA: "làm việc với cái đang nằm trên thớt". Cầm ổ lên là phím R riêng.
      if (this.boardLoaf) { this.openBoard(); return; }
      // thớt trống, tay không: lau thớt — WIPE_BOARD 2,5 s (P1-02 §2.10), CO GIÃN THEO ĐỘ BẨN
      const sec = this.workSeconds(this.wipeSeconds());
      this.beBusy(sec, "đang lau thớt");
      // Bụi bốc ngay TẠI MẶT THỚT suốt lượt lau: thanh tiến trình nằm dưới chân màn hình,
      // dòng thông báo nằm ở cột phải, mà mắt người chơi lúc này đang ở ngay cái thớt.
      this.wipePuff.start(
        toScreen(st.tx + 0.5, st.ty + 0.5).sx, this.boardTopY,
        depthOf(st.tx + 0.5, st.ty + 0.5) + 3, sec * 1000, this.settings.reducedMotion,
      );
      this.wipeBoard();
      this.audio.wipeFor(sec);                   // trải đủ lượt lau, không chỉ một nhát ở đầu
      this.hud.toast("lau thớt", "good", this.popClock);
      return;
    }
    if (st && st.holdMs === 0 && !blockedReason(st, this.player.hand)) this.finish(st);
  }

  /** Trạm HAI CHIỀU như lò. Lấy ổ GIÒN NHẤT chứ không phải ổ để lâu nhất. */
  private pressBasket() {
    const h = this.player.hand;
    if (h === "loaf_hot" || h === "loaf_cold" || h === "loaf_filled") {
      if (this.basket.length >= BASKET_SLOTS) { this.hud.toast("chỗ để bánh đầy rồi", "info", this.popClock); return; }
      this.basket.push({
        hand: h, warmth: this.handWarmth, crust: this.handCrust, q: this.breadQ,
        soiled: this.handSoiled, dish: [...this.dish], dishQ: this.dishQ, readyAt: this.dishReadyAt,
      });
      this.audio.putDown();
      this.player.hand = "empty";
      this.dish = [];
      this.handCrust = 0;
      this.handSoiled = false;
      const what = h === "loaf_filled" ? "ổ đã gói" : "ổ bánh";
      this.hud.toast(`để ${what} xuống (${this.basket.length}/${BASKET_SLOTS})`, "info", this.popClock);
      return;
    }
    if (h !== "empty") { this.hud.toast("tay đang cầm đồ", "info", this.popClock); return; }
    if (!this.basket.length) { this.hud.toast("chỗ để bánh đang trống", "info", this.popClock); return; }
    /** Ấm trước rồi mới tới giòn: ổ nguội là ổ khách chê, nên ổ còn ấm bao giờ cũng được rút trước. */
    let bi = 0;
    for (let i = 1; i < this.basket.length; i++) {
      const a = this.basket[i], b = this.basket[bi];
      const aw = isWarm(a.warmth), bw = isWarm(b.warmth);
      if (aw !== bw ? aw : a.crust > b.crust) bi = i;
    }
    const l = this.basket.splice(bi, 1)[0];
    // Ổ đã gói thì cầm lên vẫn là ổ đã gói; ổ trơn thì nóng/nguội theo chính nó.
    this.pickUp(l.hand === "loaf_filled" ? "loaf_filled" : isWarm(l.warmth) ? "loaf_hot" : "loaf_cold");
    this.handWarmth = l.warmth;
    this.handCrust = l.crust;
    this.handSoiled = l.soiled;                        // ổ để đây giữ nguyên lý lịch của nó
    this.breadQ = l.q;
    this.dish = l.dish;
    this.dishQ = l.dishQ;
    this.dishReadyAt = l.readyAt;
  }

  private basketPrompt(): string {
    const n = this.basket.length, h = this.player.hand;
    const wrapped = this.basket.filter((l) => l.hand === "loaf_filled").length;
    if (h === "loaf_hot" || h === "loaf_cold" || h === "loaf_filled") {
      return n >= BASKET_SLOTS
        ? `chỗ để bánh — đầy rồi (${n}/${BASKET_SLOTS})`
        : `chỗ để bánh — bấm E để xuống (${n}/${BASKET_SLOTS})`;
    }
    if (h !== "empty") return "chỗ để bánh — tay đang cầm đồ";
    if (!n) return "chỗ để bánh — đang trống";
    // Nói rõ có mấy ổ GÓI SẴN: đó là con số quyết định có kịp bán giờ cao điểm hay không.
    const got = wrapped ? `${wrapped} ổ đã gói` : `${n} ổ`;
    return `chỗ để bánh — bấm E lấy ra (${got})`;
  }

  /** Phím RIÊNG chứ không chung E: ổ nguội thì việc đúng là nướng lại, ổ còn ấm thì kẹp tiếp. */
  private liftFromBoard() {
    if (this.paused || this.closed || this.handsBusy) return;
    if (this.assembly.isOpen) return;
    if (this.near?.id !== "board") return;
    if (this.player.hand !== "empty") { this.hud.toast("tay đang cầm đồ", "info", this.popClock); return; }
    // Chỉ cầm được ổ TRƠN. Ổ đã kẹp nhân thì đường ra là gói lại (E) hoặc bỏ (Q) —
    // cầm một ổ đang hở nhân đi lòng vòng không phải thao tác có thật.
    if (!this.boardLoaf) { this.hud.toast("thớt đang trống", "info", this.popClock); return; }
    if (this.boardLoaf.length > 0) { this.hud.toast("ổ đang kẹp dở, E gói lại hoặc Q đặt xuống", "info", this.popClock); return; }
    this.liftBoardLoaf();
  }

  /** Cầm ổ đang gác trên thớt lên tay — cả bộ thông số của nó đi theo. Thớt sạch trở lại. */
  private liftBoardLoaf() {
    this.boardLoaf = null;
    this.pickUp(isWarm(this.boardWarmth) ? "loaf_hot" : "loaf_cold");
    this.handWarmth = this.boardWarmth;
    this.handCrust = this.boardCrust;
    this.handSoiled = this.boardSoiled;
    this.breadQ = this.boardQ;
    this.hud.toast("cầm ổ trên thớt lên", "info", this.popClock);
  }

  /** Phải nói ĐÚNG việc bấm phím sẽ làm, và luôn có ít nhất một đường ra. */
  private boardPrompt(): string | null {
    if (!this.boardLoaf) return null;
    if (this.player.hand !== "empty") return "thớt — đang có ổ gác · Q đặt ổ trên tay xuống";
    const bare = this.boardLoaf.length === 0;
    // Ổ nguội: nói thẳng việc đúng nhất là cầm ra lò nướng lại, nhưng KHÔNG giấu mất đường kẹp tiếp.
    if (bare && !isWarm(this.boardWarmth)) return "thớt — ổ nguội rồi · R cầm lên nướng lại";
    if (bare) return "thớt — E kẹp nhân · R cầm ổ lên";
    return `thớt — E kẹp tiếp (${this.boardLoaf.length} phần đã kẹp) · Q đặt ổ xuống sàn`;
  }

  private finish(st: Station) {
    switch (st.id) {
      case "board":                                     // T2: mở bảng CHỌN NGUYÊN LIỆU
        // Đặt ổ nóng xuống thớt: tay rảnh, ổ nằm trên thớt cho tới khi gói.
        // Thớt đã có ổ thì nói luôn đường ra, đừng chỉ nói "không được" (xem `boardPrompt`).
        if (this.boardLoaf) { this.hud.toast("thớt đang có ổ, bấm Q đặt ổ trên tay xuống", "info", this.popClock); return; }
        this.player.hand = "empty";
        this.boardLoaf = [];
        this.boardWarmth = this.handWarmth;                    // ổ mang theo cả bộ thông số của nó
        this.boardCrust = this.handCrust;
        this.boardSoiled = this.handSoiled;
        this.boardQ = this.breadQ;
        this.audio.putDown();
        this.openBoard();
        return;

      case "bin": {                                     // bỏ đi THẬT — không lấy lại được
        const wasBurnt = this.player.hand === "loaf_burnt";
        this.player.hand = "empty";
        this.dish = [];
        this.handSoiled = false;
        this.busy = null;
        this.beBusy(this.workSeconds(BIN_SEC), "đang bỏ vô thùng", "quick");
        this.audio.bin();
        this.addDirt(0.004);                            // vụn bánh rơi quanh miệng thùng
        if (wasBurnt) { this.hud.say("cô Ba: \"bánh đó con để cô ăn.\""); moment(this.world.story, "BANH_DO_CON_DE_CO_AN"); }  // CANON §7.4: cô buồn chứ không la
        else this.hud.toast("bỏ vô thùng", "info", this.popClock);
        return;
      }

      case "handoff":
        return this.handOver();

      case "sink":                                      // WASH_HANDS: sạch cả hai tay
        // Vòi nước đã kêu suốt lượt giữ phím (xem `audio.tick`), ở đây chỉ còn cú vẩy tay.
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
          if (!q.length) { this.hud.toast("hết bánh mì rồi, mai mua thêm", "bad", this.popClock); return; }
          this.breadQ = q[0];
          this.handCrust = 0;                            // ổ mới lấy ở kệ: chưa nướng
          this.handSoiled = false;                       // …và chưa chạm đất
          this.audio.layLoaf();
        }
        // Tiếng rót đã kêu từ lúc bắt đầu giữ phím (xem `tickStation`); ở đây chỉ
        // còn cú đặt ly xuống — đúng cái vừa xảy ra.
        if (st.id === "tea") this.audio.cup();
        this.pickUp(st.gives);
    }
  }

  /** So ngay với đơn của người đứng trước mặt: sai thì phát `ORDER_DEFECT` tại slot BOARD — khách ĐANG NHÌN thì sẽ thấy. */
  /** Mở bảng với đúng phần nhân đang nằm trên ổ gác ở thớt. */
  private openBoard() {
    // Nhát dao rạch dọc ổ — "âm chữ ký của game" (P5-03 §4.2 A). Nó nổ ở ĐÂY vì đây
    // là lúc ổ bánh thật sự được mở ra, dù trên màn hình chỉ là một cái bảng hiện lên.
    this.audio.knife();
    this.assembly.setPresets(this.world.stall.presets);
    this.assembly.placeBelow(this.hud.statsBottom);
    this.assembly.show(this.boardLoaf ?? []);
  }

  private finishDish(dish: Ingredient[], evenWrap = false) {
    this.audio.wrap();
    this.boardLoaf = null;
    this.grip.reset();                                 // cầm ổ mới gói lên: tay chắc lại từ đầu
    // Ổ rời thớt lên tay thì cả bộ thông số của NÓ đi theo — không phải của ổ nào khác.
    this.handWarmth = this.boardWarmth;
    this.handCrust = this.boardCrust;
    this.handSoiled = this.boardSoiled;
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
      this.beBusy(6, "đang băng tay");
      this.hud.toast("đứt tay rồi, băng lại cái đã", "bad", this.popClock);
    }

    // Lỗi trong ổ phát tại BOARD với KHOÁ RIÊNG của ổ này + người này.
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

  /** Bỏ đúng thứ khách đã DẶN KHÔNG là lỗi xảy ra NGAY lúc đó, trước cả lúc đưa. */
  private onPlace(id: Ingredient) {
    this.audio.place(id);
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
    // Ổ trơn đưa thẳng cũng là một ổ bánh — nguội thì vẫn là nguội.
    const isLoaf = this.player.hand === "loaf_filled" || this.player.hand === "loaf_hot"
      || this.player.hand === "loaf_cold";
    const cold = isLoaf && !isWarm(this.handWarmth) && this.service.front?.phase === "waiting";
    if (cold) this.emit("BURNT_OR_COLD", "HANDS");
    const res = this.player.hand === "tea"
      ? this.service.serveTea()
      : this.service.serveDish(this.dish, {
        cold, crust: this.handCrust, quality: this.dishQ, readyAt: this.dishReadyAt,
        // `burnAt` THẬT của cái lò đang dùng — lò gas có ngưỡng riêng, lấy hằng số thì dải tốt
        // của nó bị đọc thành "cháy cạnh" (xem `serveDish`).
        burnAt: this.oven.burnAt,
        // Người NHÌN THẤY lúc nó rơi thì biết chắc; người không thấy thì chỉ cắn phải sạn.
        soiled: this.handSoiled,
      });

    if (!res.ok) { this.hud.toast(res.reason ?? "chưa đưa được", "info", this.popClock); return; }
    // Cô Ba nói ra chuyện mình vừa cho thêm — bong bóng của người chơi, ngay lúc chìa ổ bánh.
    // Câu đáp của khách tới sau ~0,2–0,4 s (`BARK_DELAY_MIN`), nên hai bong bóng chồng nhau một
    // quãng: đúng như hai người nói chuyện, và `bubbleLayout` lo chuyện chúng không đè lên nhau.
    if (res.playerSay) this.sayAsPlayer(res.playerSay, bubbleLife(res.playerSay, this.readMul()));

    this.handSoiled = false;
    const wasDish = isLoaf;                            // ổ trơn cũng lấy tiền → tay dính tiền
    this.player.hand = "empty";
    this.dish = [];
    // ⚖️ P1-01 §2.11 ghi 2,0 s, nhưng nhận tiền không phải thao tác có tay nghề. 0,8 s vẫn giữ cái giá
    // thật của nó: tay DÍNH TIỀN cho tới khi đi rửa.
    if (wasDish) {
      this.hands = "MONEY";
      this.audio.money();
      this.beBusy(this.workSeconds(TAKE_MONEY_SEC), "đang nhận tiền", "quick");
    }
    // Autosave sau mỗi khách: DayScene nghe `npc:left` (P0-02 §2.6).
  }

  /**
   * MỌI chỗ khoá tay phải đi qua đây. `"bar"` = việc phải ĐỨNG CHỜ (có thanh); `"quick"` = động tác
   * cúi người / chìa tay (tay vẫn khoá, chỉ bỏ cái thanh). ⚠️ Không tự suy ra từ `sec` — giữ C nhân
   * mọi thao tác lên 1,3×, mà "nhận tiền" chậm đi thì vẫn là nhận tiền.
   */
  private beBusy(sec: number, what: string, how: "bar" | "quick" = "bar") {
    this.handsBusyFrom = this.elapsed;
    this.handsBusyUntil = this.elapsed + sec;
    this.handsBusyWhat = what;
    this.handsBusyBar = how === "bar";
  }

  /** 0 → 1 trong suốt lượt bận, để HUD vẽ thanh. 1 khi đang rảnh. */
  private get handsBusyFrac() {
    const total = this.handsBusyUntil - this.handsBusyFrom;
    if (total <= 0) return 1;
    return Math.min(1, Math.max(0, (this.elapsed - this.handsBusyFrom) / total));
  }

  private get handsBusy() {
    return this.elapsed < this.handsBusyUntil;
  }

  /** Cầm một món lên tay: tay chắc lại từ đầu (grip = 1). */
  /** `handSoiled` reset `false` tại đây, chỗ gọi nào biết ổ dính đất thì tự bật lại. */
  private pickUp(hand: Station["gives"]) {
    this.player.hand = hand;
    this.handSoiled = false;
    this.grip.reset();
    if (hand === "loaf_cold") this.touchFood();
  }

  /** Tay dính tiền thì đó là `DIRTY_HANDS` ở vùng TAY. Cùng một đợt tay dơ thì cùng một khoá. */
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

  /** CÀNG BẨN CÀNG LÂU (×1,0 → ×2,0). Chưa gấp ba để không thành cái vòng xoáy mà `wipeBoard` vừa gỡ ra. */
  private wipeSeconds() {
    const base = has(this.world.equipment, "KHAN_3_MAU") ? 1.2 : 2.5;
    return base * (1 + this.dirt);
  }

  /** MỘT lần là hết ruồi, dù bẩn tới đâu. Vẫn trừ ít nhất `WIPE_DIRT` nên lau lúc đã sạch vẫn có ích. */
  private wipeBoard() {
    const st = this.world.stall;
    st.cleanliness = Math.min(1, Math.max(st.cleanliness + WIPE_DIRT, WIPED_CLEAN));
  }

  private addDirt(d: number) {
    const st = this.world.stall;
    if (d > 0) d *= dirtMul(this.world.equipment);
    st.cleanliness = Math.max(0, Math.min(1, st.cleanliness - d));
  }

  /** CHỈ trả danh sách phần, không trừ gì: bảng kẹp nhân có thể từ chối áp preset. */
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

  /** Chỉ lúc đó bảng kẹp nhân mới cho gói ổ trống. */
  private orderIsEmptyLoaf() {
    const it = this.service.front?.order?.intent;
    return !!it && !it.nhan.length && !it.dayDu && it.rau === "khong";
  }

  /** Mất 1 giây, KHÔNG phát sự kiện nào. Rớt (`DROPPED_FOOD`) chỉ đến từ tay lỏng. */
  /** ĐẶT XUỐNG SÀN, nhặt lại được. Muốn bỏ thật thì đi tới thùng rác và bấm E. */
  private discard() {
    if (this.paused || this.closed) return;
    if (this.handsBusy) return;

    if (this.player.hand === "empty") {
      // Có món nằm trong tầm với: nhặt lên. Ưu tiên hơn việc dọn thớt vì người chơi vừa
      // đặt nó xuống đây, và tầm với của sàn hẹp hơn hẳn tầm với của trạm.
      const i = this.nearestFloor();
      if (i >= 0) { this.pickFloor(i); return; }
      // Tay không, đứng ở thớt, không có gì dưới sàn: Q dọn ổ đang GÁC xuống sàn.
      if (this.near?.id !== "board" || !this.boardLoaf) return;
      if (this.floor.length >= FLOOR_MAX) { this.hud.toast("dưới sàn hết chỗ rồi", "info", this.popClock); return; }
      // Đặt xuống sàn là đặt Ổ BÁNH, không đặt mấy phần nhân đã rải lên nó.
      this.putFloor("loaf_hot", this.boardWarmth, this.boardCrust, this.boardQ, []);
      this.boardLoaf = null;
      this.beBusy(this.workSeconds(FLOOR_SEC), "đang dọn thớt", "quick");
      this.hud.toast("đặt ổ trên thớt xuống sàn", "info", this.popClock);
      return;
    }

    if (this.floor.length >= FLOOR_MAX) { this.hud.toast("dưới sàn hết chỗ rồi", "info", this.popClock); return; }
    this.putFloor(this.player.hand, this.handWarmth, this.handCrust, this.breadQ, this.dish);
    this.player.hand = "empty";
    this.dish = [];
    this.busy = null;
    this.beBusy(this.workSeconds(FLOOR_SEC), "đang đặt xuống", "quick");
  }

  /** Món dưới sàn gần nhất trong tầm với, hoặc −1. */
  private nearestFloor() {
    let best = -1, bestD = FLOOR_REACH * FLOOR_REACH;
    for (let i = 0; i < this.floor.length; i++) {
      const f = this.floor[i];
      const d = (f.x - this.player.x) ** 2 + (f.y - this.player.y) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  /** ⚠️ Phát `DROPPED_FOOD` kể cả khi ĐẶT CÓ CHỦ Ý — không thì bấm Q rồi nhặt lên là cách rửa sạch lý lịch ổ bánh. */
  private putFloor(hand: Hand, warmth: number, crust: number, q: number, dish: readonly Ingredient[]) {
    // Cùng một tiếng cho "đặt xuống" và "làm rớt", y như `putFloor` phát cùng một `DROPPED_FOOD`.
    this.audio.drop();
    this.floor.push({ x: this.player.x, y: this.player.y, hand, warmth, crust, q, dish: [...dish] });
    this.emit("DROPPED_FOOD", "HANDS");
    this.addDirt(0.02);                                // ít hơn cú rớt (0,06): đặt xuống thì gọn hơn
  }

  private pickFloor(i: number) {
    const f = this.floor.splice(i, 1)[0];
    // Ổ đã nguội hẳn thì cầm lên là ổ nguội — hình và chữ phải nói đúng cái đang cầm.
    const hand: Hand = f.hand === "loaf_hot" && !isWarm(f.warmth) ? "loaf_cold" : f.hand;
    this.pickUp(hand);
    this.handWarmth = f.warmth;
    this.handCrust = f.crust;
    this.breadQ = f.q;
    this.dish = f.dish;
    // Đã nằm dưới đất thì phủi cách mấy cũng vẫn là đã nằm dưới đất. Không có đường nào
    // gỡ cờ này ngoài bỏ ổ đó đi — người chơi phải CHỌN: liều đưa, hay chịu mất một ổ.
    this.handSoiled = true;
    this.beBusy(this.workSeconds(FLOOR_SEC), "đang nhặt lên", "quick");
  }

  /** Bấm E cầm ổ nguội = bỏ vào; tay không = lấy ổ chín nhất ra. */
  private pressOven() {
    const h = this.player.hand;
    if (h === "loaf_cold") {
      // Ổ mang cả chất lượng lô lẫn phần vỏ đã nướng dở vào lò (nướng lại ổ đã nguội).
      if (!this.oven.put(this.breadQ, this.handCrust, this.handSoiled)) { this.hud.toast("lò đầy rồi", "info", this.popClock); return; }
      this.audio.ovenDoor();
      this.player.hand = "empty";
      this.handCrust = 0;
      return;
    }
    if (h !== "empty") { this.hud.toast("tay đang cầm đồ", "info", this.popClock); return; }
    const l = this.oven.take();
    if (!l) { this.hud.toast("lò đang trống", "info", this.popClock); return; }
    const band = bandOfCrust(l.crust, this.oven.burnAt);
    // Ổ cháy thì KHÔNG có tiếng vỏ giòn — cái vỏ đó không còn giòn nữa. Tiếng khét
    // đã chạy vòng từ lúc nó cháy trong lò (`audio.tick`), không cần nhắc lại.
    if (band === "BURNT") this.audio.ovenDoor(); else this.audio.loafOut();
    this.pickUp(band === "BURNT" ? "loaf_burnt" : "loaf_hot");
    this.handWarmth = 1;
    this.handCrust = l.crust;
    this.handSoiled = l.soiled;                        // nướng lại KHÔNG tẩy được chuyện rớt đất
    this.breadQ = l.q;
    if (band === "RAW") this.hud.toast("ổ này chưa giòn", "bad", this.popClock);
    if (band === "SINGED") this.hud.toast("ổ này sém cạnh rồi", "bad", this.popClock);
  }

  /** Thứ tự ai được nói nằm ở `Service.talkTarget()`, và chỉ báo dưới chân đọc ĐÚNG hàm đó. */
  private askFront() {
    if (this.paused || this.closed || this.talk.isOpen) return;
    /** XẾP HÀNG cú bấm, không nuốt nó: bấm một phím mà màn hình không nhúc nhích thì người chơi tưởng phím hỏng. */
    if (this.handsBusy) {
      this.talkQueued = this.elapsed;
      this.hud.toast("đang dở tay — nói ngay khi rảnh", "info", this.popClock);
      return;
    }
    const view = this.service.openTalk();
    if (view) { this.openTalkPanel(view); return; }
    // `null` = không có lý do CON NGƯỜI nào (chưa nạp xong / không ai trong tầm) ⇒ im.
    // Nói dối về một tình huống kỹ thuật là làm hỏng cả mười câu còn lại (P2-06 §2.9).
    const why = this.service.talkUnavailable();
    if (why) this.hud.toast(why, "info", this.popClock);
  }

  /**
   * `clock.busy`, không `clock.paused`: đóng băng là một cái nút dừng giờ miễn phí (22–32 giây CHÚ Ý,
   * 0 giây GAME) nên spam thành hành vi tối ưu. Người chơi học "nói chuyện tốn giờ bán" bằng đồng hồ
   * treo tường đã có trên HUD, không thêm chỉ số nào.
   */
  private openTalkPanel(view: ReturnType<Service["openTalk"]>) {
    if (!view) return;
    this.talkHoldsClock = true;
    this.busy = null;
    this.intents = [];
    this.talk.show({ ...view, anchor: this.anchorFor(view.at) });
  }

  /** Thẻ là `scrollFactor(0)` nên sống trong hệ toạ độ màn hình, còn `toScreen` trả toạ độ THẾ GIỚI. */
  private anchorFor(at: { x: number; y: number }) {
    /**
     * ⚠️ `sx - cam.scrollX` sai hai lần: `scrollX` không phải mép trái khung nhìn khi camera có zoom, và
     * kết quả chưa được NHÂN zoom. Chia `RENDER_SCALE` ở cuối vì camera UI cũng zoom đúng ngần ấy.
     */
    const { sx, sy } = toScreen(at.x, at.y);
    const cam = this.cameras.main;
    const v = cam.worldView;
    return {
      x: (sx - v.x) * cam.zoom / RENDER_SCALE,
      y: (sy - v.y) * cam.zoom / RENDER_SCALE - 40,
    };
  }

  /** Ba nhịp: câu MÌNH nói → ba chấm (`REPLY_DELAY_SEC`) → câu họ đáp. Thẻ bị GIẤU suốt hai nhịp đầu. */
  private pickTalk(i: number) {
    const next = this.service.chooseTalk(i);
    for (const l of this.service.drainLogs()) this.routeLine(l);
    // `null` = phiên đã chết ở phía Service. Phải đi qua `closeTalk()` chứ không chỉ destroy UI.
    if (!next) { this.endTalk(); return; }

    const turn = ++this.talkTurn;
    if (next.said) this.sayAsPlayer(next.said, REPLY_DELAY_SEC + PLAYER_SAY_TAIL);
    this.talk.destroy();                               // giấu thẻ trong lúc họ còn chưa đáp
    // "Đang nhập": ba chấm trên đầu người kia. Im lặng CỐ Ý (`silent`) cũng có ba chấm —
    // nhưng sau đó không có câu nào, và chính cái trống đó là câu trả lời (P2-02 §2.3).
    this.service.talkPartnerSpeak("…", REPLY_DELAY_SEC);
    this.time.delayedCall(REPLY_DELAY_SEC * 1000, () => {
      if (turn !== this.talkTurn || this.closed) return;   // đã đóng hoặc đã sang nhịp khác
      if (next.line) this.service.talkPartnerSpeak(next.line, bubbleLife(next.line, this.readMul()));
      if (!this.service.talkOpen && next.done) { this.closeTalkPanel(); return; }
      this.talk.show({ ...next, anchor: this.anchorFor(next.at) });
    });
  }

  /** Hệ số đọc chậm — cùng công thức với chỗ dựng `Service` (CANON §15). */
  private readMul() {
    return (this.settings.textScale > 1 ? 1.25 : 1) * (this.settings.noTimePressure ? 1.5 : 1);
  }

  /** Lời người chơi xưa nay chỉ rơi vào khung nhật ký góc dưới — nhỏ, ba dòng, xa chỗ mắt đang nhìn. */
  private sayAsPlayer(text: string, sec: number) {
    this.playerSay = { text, until: this.elapsed + sec };
  }

  /** Esc LUÔN MIỄN PHÍ (luật L4). "Làm thinh" đã thành một DÒNG viết sẵn trong dải, giọng `IM`. */
  private endTalk() {
    this.service.closeTalk();
    for (const l of this.service.drainLogs()) this.routeLine(l);
    this.closeTalkPanel();
  }

  private closeTalkPanel() {
    this.talk.destroy();
    this.talkHoldsClock = false;
    this.talkTurn++;                 // huỷ mọi `delayedCall` của nhịp đang treo
    this.playerSay = null;
  }

  /** Bong bóng của cô Ba — cùng pool, cùng luật né với bong bóng của khách. */
  private drawPlayerBubble() {
    const p = this.playerSay;
    if (!p || this.elapsed >= p.until) {
      if (this.playerSay) this.playerSay = null;
      this.bubbles.release("player", this.settings.reducedMotion);
      return;
    }
    const b = this.bubbles.acquire("player");
    b.setText(p.text);
    const { sx, sy } = toScreen(this.player.x, this.player.y);
    b.place(sx, footY(sy) - HEAD_PX - 46, OVERLAY_DEPTH + 2, 1, this.settings.reducedMotion);
  }

  /** ⚠️ CỐ Ý ngắn và ĐỘNG: liệt kê cả cái quầy thì bong bóng rời hẳn khỏi người đang nói. Chỉ ba thứ. */
  private bubbleKeepOut(): BubbleKeepOutBox[] {
    const out: BubbleKeepOutBox[] = [];
    const at = (tx: number, ty: number, w = 92, h = 76) => {
      const { sx, sy } = toScreen(tx + 0.5, ty + 0.5);
      const y = footY(sy);
      out.push({ x0: sx - w / 2, x1: sx + w / 2, y0: y - h, y1: y + 10 });
    };
    if (this.oven.count > 0) {
      const st = STATIONS.find((x) => x.id === "oven");
      if (st) at(st.tx, st.ty);
    }
    if (this.boardLoaf) {
      const st = STATIONS.find((x) => x.id === "board");
      if (st) at(st.tx, st.ty);
    }
    if (this.near) at(this.near.tx, this.near.ty);
    return out;
  }

  /** VÒNG DƯỚI CHÂN chứ không dấu trên đầu — `?` và `!` đã bị hệ ánh nhìn chiếm, còn bàn chân không bao giờ chồng nhau. */
  private drawTalkTarget() {
    const g = this.talkRing;
    g.clear();
    if (this.talk.isOpen || this.paused || this.closed) return;
    const t = this.service.talkTargetNow;
    if (!t) return;
    const { sx, sy } = toScreen(t.x, t.y);
    /** ⚠️ Neo ở `sy`, KHÔNG ở `footY(sy)` (thấp hơn mặt đất 21 px) — không thì vòng rớt khỏi bàn chân. */
    const y = sy;
    g.setDepth(depthOf(t.x, t.y) - 1);
    // Nhịp thở rất nhẹ — đủ để mắt bắt được là nó SỐNG, không đủ để thành một thứ nhấp nháy.
    const k = this.settings.reducedMotion ? 1 : 1 + Math.sin(this.time.now / 420) * 0.05;
    g.lineStyle(1.5, 0xc0392b, 0.75);
    g.strokeEllipse(sx, y - 1, 26 * k, 12 * k);
    // Hai mũi nhỏ hai bên: "bước dọc quầy thì mục tiêu đổi" — dạy luật mà không cần một dòng chữ.
    g.lineStyle(1.5, 0xc0392b, 0.35);
    g.beginPath(); g.moveTo(sx - 20 * k, y - 7); g.lineTo(sx - 25 * k, y - 1); g.lineTo(sx - 20 * k, y + 5); g.strokePath();
    g.beginPath(); g.moveTo(sx + 20 * k, y - 7); g.lineTo(sx + 25 * k, y - 1); g.lineTo(sx + 20 * k, y + 5); g.strokePath();
  }

  /** Xẹp dần chứ không nhấp nháy. ⚠️ KHÔNG dùng `!` — `CustomerActor` đã lấy ký hiệu đó. */
  /** Dài hơn mọi hạn đang có nên cung luôn bắt đầu dưới một vòng và chỉ vơi đi. */
  private static readonly DEED_ARC_SEC = 45;

  private drawPendingTalk() {
    const g = this.pendingDots;
    g.clear();
    if (this.paused || this.closed) return;
    const keys = new Set(this.service.pendingTalkers);
    if (!keys.size) return;
    for (const c of this.service.customers) {
      if (!keys.has(c.id)) continue;
      const { sx, sy } = toScreen(c.x, c.y);
      const top = footY(sy) - HEAD_PX - 18;
      g.setDepth(depthOf(c.x, c.y) + 3);
      for (let i = 0; i < 3; i++) {
        g.fillStyle(0x222a31, 0.28 + 0.2 * i);
        g.fillCircle(sx + 16 + i * 6, top, 2);
      }
    }
    this.drawPendingDeeds();
  }

  /** Đòi hỏi của T5: phạt vì quên một chuyện game không nhắc là phạt TRÍ NHỚ, không phải LỰA CHỌN. */
  private drawPendingDeeds() {
    const g = this.pendingDots;
    for (const c of this.service.customers) {
      const deeds = this.service.pendingDeeds(c.memKey);
      if (!deeds.length) continue;
      const d = deeds[0];
      const { sx, sy } = toScreen(c.x, c.y);
      const top = footY(sy) - HEAD_PX - 30;
      g.setDepth(depthOf(c.x, c.y) + 3);
      // Vòng nền mờ: chỗ của lời hứa, luôn thấy được dù còn nhiều hay sắp hết.
      g.lineStyle(2, 0x222a31, 0.25);
      g.strokeCircle(sx - 18, top, 6);
      const left = Math.max(0, Math.min(1, d.leftSec / StallScene.DEED_ARC_SEC));
      g.lineStyle(2, left > 0.25 ? 0xe8b56a : 0xc0583f, 0.9);
      g.beginPath();
      g.arc(sx - 18, top, 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left, false);
      g.strokePath();
    }
  }

  /** Chạy (Shift) khi đang cầm đồ, hoặc va vào đồ đạc, là tay lỏng. */
  private tickGrip(dt: number) {
    const h = this.player.hand;
    if (h === "empty") return;
    const p = this.player;
    const tempo = p.moving ? (p.running ? RUN_TEMPO : WALK_TEMPO) : 0;
    if (!this.grip.tick(dt, tempo, p.bumped)) return;
    // Rớt là RƠI XUỐNG SÀN, không phải bốc hơi.
    if (this.floor.length < FLOOR_MAX) {
      this.putFloor(this.player.hand, this.handWarmth, this.handCrust, this.breadQ, this.dish);  // tự phát DROPPED_FOOD
    } else {
      this.emit("DROPPED_FOOD", "HANDS");             // sàn đầy: ổ mất luôn, nhưng vẫn có người thấy
    }
    this.player.hand = "empty";
    this.dish = [];
    this.busy = null;
    this.addDirt(0.04);                                // DROP_MESS — cộng với 0,02 của `putFloor`
    this.hud.toast("rớt rồi…", "bad", this.popClock);
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

  /** ĐI TỚI ĐÂY, BẤM MỘT CÁI, HẾT — chỉ mọc trên trạm giải quyết được bằng một thao tác có thật. KHÔNG phải danh sách nhiệm vụ. */
  private drawChores() {
    const g = this.choreGfx;
    g.clear();
    if (this.paused || this.closed) return;
    // Nhún nhẹ để mắt bắt được ở ngoại vi — đây là thứ phải nhìn thấy mà KHÔNG cần
    // nhìn thẳng vào. `reducedMotion` thì đứng yên, dấu vẫn còn nguyên (CANON §15.3).
    const bob = this.settings.reducedMotion ? 0 : Math.sin(this.time.now / 330) * 2.5;
    // Thớt bẩn tới mức có ruồi: lau một cái là xong.
    if (this.dirt > FLY_DIRT_MIN) this.bang(g, this.choreAt.get("board"), bob);
    // Tay dính tiền: đi tới vòi, giữ E.
    if (this.hands === "MONEY") this.bang(g, this.choreAt.get("sink"), bob);
    // Vòng độ giòn đã nói điều này bằng màu, nhưng chỉ đọc được khi đang nhìn vào lò.
    if (this.oven.slots.some((l) => l && bandOfCrust(l.crust, this.oven.burnAt) === "BURNT")) {
      this.bang(g, this.choreAt.get("oven"), bob);
    }
    // Món nằm dưới chân quầy bị chính thân người chơi che — dấu này cần hơn cả hai cái trên.
    for (const f of this.floor) {
      const { sx, sy } = toScreen(f.x, f.y);
      this.bang(g, { x: sx, y: footY(sy) }, bob);   // chân món, `CHORE_LIFT` tự nhô lên
    }
  }

  /** Mỗi ổ một sprite riêng với hình theo độ giòn của CHÍNH NÓ, không thì cái rổ thành một con số đếm trá hình. */
  private drawBasket() {
    for (let i = 0; i < BASKET_SLOTS; i++) {
      const l = this.basket[i];
      const img = this.basketImgs[i] ??= this.add.image(0, 0, HELD.key("loaf_hot"))
        .setOrigin(0.5, 1).setDepth(LABEL_DEPTH - 2);
      if (!l) { img.setVisible(false); continue; }
      // Ổ ĐÃ GÓI có hình riêng (giấy bọc) — nhìn vào phải phân biệt được ngay cái nào
      // bán được liền, cái nào còn phải kẹp nhân.
      const look: Hand = l.hand === "loaf_filled" ? "loaf_filled"
        : isWarm(l.warmth) ? "loaf_hot" : "loaf_cold";
      fitPhoto(img.setTexture(heldTexture(look, l.crust)));
      // So le sang phải, KHÔNG nhích lên (nhích lên là ổ thứ ba lơ lửng). Nhích dọc bằng nửa nhích ngang.
      const k = i - (BASKET_SLOTS - 1) / 2;
      // Đáy THẬT của ổ (bỏ khoảng trong suốt dưới texture) đặt đúng vào mặt quầy.
      const pad = heldFootPad(this, img.texture.key) * img.scaleY;
      img.setVisible(true).setPosition(
        this.basketX + k * BASKET_STEP,
        this.basketTopY + k * BASKET_STEP / 2 + pad,
      ).setDepth(this.basketDepth + i * 0.01);
    }
  }

  /** Vẽ ở ĐÚNG chỗ đặt với depth theo ô đó — người đi qua trước mặt nó thì che nó. */
  private drawFloorItems() {
    for (let i = 0; i < FLOOR_MAX; i++) {
      const f = this.floor[i];
      const img = this.floorImgs[i] ??= this.add.image(0, 0, HELD.key("loaf_cold")).setOrigin(0.5, 1);
      if (!f) { img.setVisible(false); continue; }
      const { sx, sy } = toScreen(f.x, f.y);
      fitPhoto(img.setTexture(heldTexture(f.hand, f.crust)));
      // Cùng luật với ổ trên thớt và trên quầy: đáy THẬT của ổ chạm mặt sàn.
      img.setVisible(true)
        .setPosition(sx, footY(sy) + heldFootPad(this, img.texture.key) * img.scaleY)
        .setDepth(depthOf(f.x, f.y) + 0.5);
    }
  }

  /** Phần toán nằm ở `ui/chorePin` (thuần, có test). Nhỏ lại 0,8 lần lúc bị ghim. */
  private bang(g: Phaser.GameObjects.Graphics, at: { x: number; y: number } | undefined, bob: number) {
    if (!at) return;
    const v = this.cam.world.worldView;
    const p = chorePin(at.x, at.y - CHORE_LIFT + bob, v, {
      edge: CHORE_R + CHORE_EDGE,
      top: CHORE_TOP * textScale(),
    });
    const { x, y } = p;
    const s = p.pinned ? 0.8 : 1;
    g.fillStyle(0x1b2429, 0.92).fillCircle(x, y, CHORE_R * s);
    g.fillStyle(UI.accent, 1).fillCircle(x, y, 9 * s);
    // Thân và chấm vẽ rời, bo góc — chữ "!" bằng Text ở cỡ này mỏng hơn hẳn và
    // nhoè mất trên nền tối.
    g.fillStyle(0xf4f1e8, 1);
    g.fillRoundedRect(x - 1.5 * s, y - 5.5 * s, 3 * s, 6.5 * s, 1.5 * s);
    g.fillCircle(x, y + 3.5 * s, 1.7 * s);
  }


  /** Độ bẩn nhìn thấy được = RUỒI. Vụn bánh vẽ bằng code đọc ra "lỗi hiển thị" chứ không ra "bẩn". */
  private drawDirt() {
    const d = this.dirt;
    const lab = this.choreAt.get("board");
    this.drawFlies(
      !lab || d <= FLY_DIRT_MIN ? 0 : d >= 0.7 ? 5 : d >= 0.5 ? 3 : 1,
      // Bay quanh MẶT THỚT. Trước đây neo theo nhãn tên trạm cộng 34 px — một con số
      // chỉnh bằng mắt dựa trên đỉnh cả khối quầy, tức dựa trên một mốc vừa đổi nghĩa.
      lab?.x ?? 0, this.boardTopY,
    );
  }

  /** Ảnh chụp ngang quay TRÁI: bay phải thì `flipX`, chúi thì xoay — nhưng xoay CÓ TRẦN, ruồi thật không lộn nhào. */
  private drawFlies(n: number, bx: number, by: number) {
    const t = this.settings.reducedMotion ? 0 : this.time.now / 1000;
    for (let i = 0; i < FLY_MAX; i++) {
      const img = this.flies[i] ??= fitPhoto(this.add.image(0, 0, FX.fly))
        .setOrigin(0.5, 0.5).setDepth(LABEL_DEPTH - 3);
      if (i >= n) { img.setVisible(false); continue; }

      const spin = 1.6 + i * 0.3, R = 14 + i * 3;
      const a = t * spin + i * 2.1;
      // Vận tốc = đạo hàm của chính hai dòng đặt vị trí bên dưới. Thừa số `spin` chung
      // cho cả hai trục nên bỏ đi: ở đây chỉ cần đúng HƯỚNG, không cần đúng độ lớn.
      const vx = -Math.sin(a) * R, vy = Math.cos(a * 1.3) * 8 * 1.3;
      const tilt = Phaser.Math.Clamp(Math.atan2(vy, Math.abs(vx)), -FLY_TILT, FLY_TILT);
      img.setPosition(bx + Math.cos(a) * R, by - 10 + Math.sin(a * 1.3) * 8)
        .setFlipX(vx > 0)
        .setRotation(vx > 0 ? tilt : -tilt)
        .setVisible(true);
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

  /** ⚠️ `smell` chỉ cho `BURNT_OR_COLD`, phân biệt ổ CHÁY (có mùi) với ổ NGUỘI. Quên cờ này là cả hàng than phiền bánh nguội trước ổ than đen. */
  private emit(id: StimId, zone?: Station["slot"], smell = false) {
    bus.emit("stim:emitted", {
      stimId: id, zone: zone ?? "HANDS", salience: SALIENCE[id], at: this.elapsed, smell,
    });
  }

  /** Tắt khói = ổ đã nguội. */
  private drawSteam() {
    const rm = this.settings.reducedMotion, t = this.time.now;
    const held = this.player.heldSprite;
    const carrying = this.player.hand === "loaf_hot" || this.player.hand === "loaf_filled";
    this.handSteam.draw(held.x, held.y - 10, held.depth + 1, t, carrying && held.visible && isWarm(this.handWarmth), rm);

    const board = STATIONS.find((s) => s.id === "board")!;
    const { sx } = toScreen(board.tx + 0.5, board.ty + 0.5);
    const parked = !!this.boardLoaf && !this.assembly.isOpen;
    const warm = isWarm(this.boardWarmth);
    // origin (0,5 · 1) nên `y` CHÍNH LÀ mép dưới texture — đặt thấp hơn mặt thớt đúng phần trong suốt.
    const loafY = this.boardTopY + heldFootPad(this, this.boardLoafImg.texture.key) * this.boardLoafImg.scaleY;
    // Hình ổ gác theo ĐỘ GIÒN của chính nó, không cứng một hình "ổ nóng".
    fitPhoto(this.boardLoafImg.setTexture(heldTexture(warm ? "loaf_hot" : "loaf_cold", this.boardCrust)));
    // Mờ đi chỉ còn dành cho ổ CHƯA nướng: ổ đã nướng đã có hình riêng nói hộ chữ
    // "nguội" rồi, chồng thêm alpha nữa là nó đọc ra "hình bị lỗi" chứ không ra "nguội".
    const faded = !warm && this.boardCrust < CRUST.READY;
    this.boardLoafImg.setVisible(parked).setPosition(sx, loafY)
      .setDepth(this.boardDepth).setAlpha(faded ? 0.72 : 1);
    // Khói bốc từ LƯNG ổ, tức trên đáy ổ một quãng bằng bề cao thật của nó.
    this.boardSteam.draw(sx, loafY - this.boardLoafImg.displayHeight * 0.45, this.boardLoafImg.depth + 0.5, t, parked && warm, rm);
    if (this.assembly.isOpen) this.assembly.setWarm(warm, t, rm);
  }

  /** Occluder 0,45 chỉ được tồn tại nếu người chơi THẤY mình đang che. ⚠️ CÒN THIẾU tư thế xoay nghiêng của chính nhân vật. */
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
    // Nền sáng 0,78…0,98, không 0,35…0,75 như bản cũ: một vòng mờ trên gạch men trắng
    // là một vòng không ai thấy. Nhịp thở vẫn còn, chỉ là nó thở quanh một mức ĐỌC ĐƯỢC.
    const pulse = this.settings.reducedMotion ? 0.1 : Math.sin(this.time.now / 260) * 0.1;
    this.ring.setVisible(true)
      .setPosition(sx, sy)
      .setDepth(depthOf(this.near.tx + 0.5, this.near.ty + 0.5) - 2)
      .setAlpha(0.88 + pulse);
  }

  /** Cố ý không đọc `served`, `money` hay số lỗi: nhạc phản ứng với BỐI CẢNH, không bao giờ là bảng điểm. */
  /** Một bức ảnh chụp trạng thái, không phải chuỗi lệnh bật/tắt rải khắp scene — sẽ có một chỗ quên gọi. */
  private syncAudio(dt: number) {
    this.audio.tick(dt, {
      band: this.clock.band,
      weather: this.world.progress.weather,
      dirt: this.dirt,
      ovenHot: this.oven.busy,
      washing: this.busy?.st.id === "sink",
      // Ổ cháy còn nằm trong lò thì còn khét. Cầm trên tay cũng vậy — cho tới khi bỏ đi.
      burning: this.player.hand === "loaf_burnt"
        || this.oven.slots.some((l) => !!l && l.crust > this.oven.burnAt),
      moving: this.player.moving && !this.paused,
      running: this.keys.SHIFT.isDown && !this.keys.C.isDown,
    });
  }

  private syncMusic() {
    const cue: CueId = this.clock.isPeak ? "cao_diem"
      : this.clock.minutes < PEAK_START_MIN ? "to_mo"
      : "lang";
    music.play(this, cue);
  }

  // ───────────────────────────────────────────────────────── tạm dừng / kết ngày

  /** Pause MỌI LÚC, và đóng băng CẢ sự kiên nhẫn của khách. */
  private pause(source: "PLAYER" | "PLAYTEST" = "PLAYER") {
    if (this.overlay || this.closed) return;
    // Đang kẹp thì gác ổ lại: bảng còn mở dưới lớp mờ là còn bấm xuyên được — thế giới
    // "đóng băng" mà nhân vẫn vô ổ, preset vẫn bị trừ.
    if (this.assembly.isOpen) this.assembly.park();
    this.paused = true;
    this.clock.paused = true;
    // Emitter không phải tween nên `tweens.pauseAll()` không đụng tới nó — bụi sẽ phun
    // đều sau tấm che pause nếu không tắt bằng tay.
    this.wipePuff.setPaused(true);
    this.rain?.setPaused(true);
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
   * Nút vẫn bấm một cái là đi (thoát bất cứ lúc nào là TRỢ NĂNG), nhưng cú thoát không được XOÁ hậu
   * quả: người đang chờ tính là khách VỀ KHÔNG, qua `leave(..., "closed")` để autosave ghi đủ.
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

  /** Chơi lại cả ngày là ĐƯỢC PHÉP — và nói thẳng cho người chơi biết nó không reset quan hệ. */
  private confirmReplay() {
    this.overlay?.destroy(true);
    this.overlay = this.modal("Chơi lại ngày này?", [
      ["Chơi lại từ sáng", () => this.day.replayDay()],
      ["Thôi, bán tiếp", () => this.showPauseMenu("Tạm dừng")],
    ], "Chơi lại ngày này sẽ đưa mọi thứ về sáng sớm. Chợ vẫn bán giá đó,\nkhách vẫn tới giờ đó — chỉ có con là biết trước.");
    this.overlayBack = () => this.showPauseMenu("Tạm dừng");
  }

  /** Một lần một ngày, bỏ qua được, KHÔNG phạt. Đốt xong vía xấu về 0, không bao giờ lên +1. */
  private tickVia() {
    const s = this.service;
    if (this.ritualOffered || !s.viaSettled) return;
    if (this.settings.skipRitual) { if (this.clock.minutes >= 6 * 60 + 30) { s.burnVia(); this.ritualOffered = true; } return; }
    if (s.via >= 0) { this.ritualOffered = true; return; }
    if (this.clock.minutes >= 6 * 60 + 30 || this.overlay || this.closed || this.notebook?.open) return;
    this.ritualOffered = true;
    this.paused = true;
    this.clock.paused = true;
    // Emitter không phải tween nên `tweens.pauseAll()` không đụng tới nó — bụi sẽ phun
    // đều sau tấm che pause nếu không tắt bằng tay.
    this.wipePuff.setPaused(true);
    this.rain?.setPaused(true);
    this.busy = null;
    this.intents = [];
    const econ = this.world.econ;
    const skip = () => {
      if (econ.ritualSkips === 0) { this.hud.say(RITUAL_LINES.skipFirst); s.burnVia(); }
      econ.ritualSkips++;
      this.resume();
    };
    const step = (i: number) => {
      this.overlay?.destroy(true);
      if (i >= RITUAL_STEPS.length) {
        this.world.money.cash -= 2000;                           // giấy, muối, chanh, nhang
        s.burnVia();
        this.resume();
        this.hud.say(RITUAL_LINES.done);
        moment(this.world.story, "VIA_LANH_THI_O");
        return;
      }
      this.overlay = this.modal(`Đốt vía · ${i + 1}/${RITUAL_STEPS.length}`, [[RITUAL_STEPS[i], () => step(i + 1)]], i === 0 ? RITUAL_PRAYER : undefined);
      this.overlayBack = null;
    };
    this.overlay = this.modal("Mở hàng xui", [["Đốt vía", () => step(0)], ["Thôi", skip]], RITUAL_LINES.offer);
    this.overlayBack = skip;
  }

  /** Mỗi món đồ nghề phải NHÌN THẤY trên xe. Vẽ bằng code, tĩnh, một lần lúc dựng cảnh. */
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

  /** Cô Ba nói MỘT câu rồi hẻm trống 40 giây. Bấm phím bất kỳ là qua màn kết. Không nhạc, không swell. */
  /** Ngày cuối mùa mới có khoảng lặng — ngoài ngày đó, đồng hồ đóng quầy như thường. */
  private get hasFinale() {
    return this.world.progress.dayIndex >= SEASON_DAYS;
  }

  private tickFinale() {
    if (!this.hasFinale || this.closed) return;
    // Chị Lan đi rồi là mở khoảng lặng. Hết giờ mà chị chưa từng tới thì bỏ qua.
    if (this.finaleAt < 0 && (this.service.lanLeft || this.clock.isOver) && !this.service.busy) {
      this.finaleAt = this.elapsed;
      this.hud.say("Cô Ba: Hết rồi hả con.");
      music.duck(true);
      // `once` tự tiêu ngay lần bấm ĐẦU TIÊN, kể cả cú bấm trong 1,5 giây đầu lúc `skip` cố ý chưa nhận.
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
    // Emitter không phải tween nên `tweens.pauseAll()` không đụng tới nó — bụi sẽ phun
    // đều sau tấm che pause nếu không tắt bằng tay.
    this.wipePuff.setPaused(true);
    this.rain?.setPaused(true);
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
    this.wipePuff.setPaused(false);
    this.rain?.setPaused(false);
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
    // Hết ngày giữa lúc thẻ trò chuyện còn mở: dọn cho sạch TRƯỚC khi chuyển cảnh.
    // Thiếu dòng này thì `talkSession` rò sang ngày sau và `talkHoldsClock` kẹt `true`.
    if (this.talk.isOpen) this.endTalk();
    this.talkQueued = -1;
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
