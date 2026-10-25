import Phaser from "phaser";
import { dayDeps } from "../sim/day";
import { GAME_W, GAME_H } from "../core/config";
import { CLOCK_DT_CLAMP_MS, PEAK_START_MIN, type Clock } from "../core/clock";
import { bus, type EventKey, type EventMap } from "../core/eventbus";
import { NEGATIVE_STIMS, type StallCloseReason, type StimId } from "../core/types";
import type { GameContext } from "../core/context";
import { loadSettings, type Settings } from "../core/save";
import { DEV_TOOLS, PLAYTEST } from "../core/flags";
import { telemetry } from "../core/session";
import { Service, bubbleLife } from "../sim/service";
import { SALIENCE } from "../sim/perception";
import { runFrame } from "../sim/frame";
import { cool, isWarm } from "../sim/loaf";
import { Steam } from "../ui/stall/Steam";
import { WipePuff } from "../ui/stall/WipePuff";
import { WaterStream } from "../ui/stall/WaterStream";
import { Rain } from "../ui/stall/Rain";
import { Daylight } from "../ui/stall/Daylight";
import { BubblePool } from "../ui/stall/BubblePool";
import { TalkPanel } from "../ui/stall/TalkPanel";
import { MoneyPops } from "../ui/stall/MoneyPops";
import { MenuBoardView } from "../ui/menu/MenuBoardView";
import { MenuDom } from "../ui/menu/MenuDom";
import { StorageView } from "../ui/stall/StorageView";
import { sfx } from "../audio/sfx";
import { PhoneView } from "../ui/phone/PhoneView";
import { totalUnread } from "../sim/phone";
import { chorePin } from "../ui/chorePin";
import { TOUR_TOTAL, dishGaps, explainEye, eyeExplained, gapText, tourAt, tourDone, tourIndex, tourOrdered, tourSkip, tourStep, touring, type TourStep } from "../sim/tour";
import { deliverDue } from "../sim/shop";
import { dueReviews, enqueue, rollReview, unseen } from "../sim/reviews";
import { achTick, takeAch } from "../sim/ach";
import { openIngredients, openedOn } from "../sim/unlock";
import { SWIFT_MUL, canSpin, cleanHandsToday, finishRookie, linked, questDone, swiftToday } from "../sim/system";
import { EYE_TEXT, KHO_READ, QUEST_DONE, QUEST_TEXT, ROOKIE_DONE } from "../content/system";
import { TourCoach } from "../ui/tour/TourCoach";
import { dishQuality, isRain, portionsFor, putBack, sickChance, stockOf, take, takeFull, goodsFor, type Portion } from "../sim/econ";
import { EQUIP, dirtMul, has, type EquipId } from "../sim/equipment";
import { labelOf } from "../sim/order";
import { dev } from "../dev/registry";
import type { DayScene } from "./DayScene";
import { diffDish, specOf, type Ingredient } from "../sim/order";
import { isBare } from "../sim/menu";
import { CRUST, OVEN_SLOTS, Oven, bandOfCrust, ovenFor, type CrustBand } from "../sim/oven";
import { Grip, RUN_TEMPO, WALK_TEMPO } from "../sim/grip";
import { orderDefectKey } from "../core/stimid";
import type { Occluder } from "../sim/perception";
import { presetDish, type Preset } from "../sim/presets";
import { BUBBLE_DEPTH, CustomerActor } from "../entities/CustomerActor";
import type { Box } from "../world/bubbleLayout";
import { AssemblyPanel } from "../ui/AssemblyPanel";
import { hint, isTouch } from "../core/device";
import { InputState, type Action } from "../input/intent";
import { TouchControls, type TouchLabel, type TouchView } from "../ui/touch/TouchControls";
import { TH, TW, depthOf, facingOf8, toScreen } from "../world/iso";
import { COUNTER_Y } from "../world/map";
import { RENDER_SCALE } from "../core/render";
import { StallCamera, ZOOM, applyDeviceZoom } from "../world/camera";
import { LIGHT_ENV_KEY, type LightEnv } from "../art/light/env";
import { materialOf } from "../art/light/materials";
import { SceneLight, indoorWeight } from "../world/lightLayers";
import { PropSheen } from "../world/propSheen";
import { Lamps, LAMP_SPOTS } from "../ui/stall/Lamps";
import { SUNK, TABLE_DROP, artScale, fitPhoto, BOARD_TEX, BOARD_W, BASKET_TEX, BASKET_W } from "../art/photo";
import { BUYABLE_TILES, MENU_REACH, MENU_SPOT, MENU_TILE, SEAT_SPOT, SHADE_SPOT, SKY_FROM_Y, WORLD_H, WORLD_W, assertWalkable, floorAt, openTilesFor, setOpenTiles, setPole, tileAt, type TileCode } from "../world/map";
import {
  HAND_LABEL, STATIONS, assertMenuSpotFree, assertStationsOnCounter, blockedReason, stationAtTile, stationNear, type Hand, type Station,
} from "../world/stations";
import {
  BASE, COUNTER, FX, HELD, PROP, TILE, createMenuBoard, createSign, floorTextureAt, footY, heldFootPad,
  heldTexture, paintNpcPhotos, preloadArt, sliceImage, spriteEdges, textureForTile, type Awning,
} from "../art";
import { Player } from "../entities/Player";
import { Hud, type Watch } from "../ui/Hud";
import { UI, label, platedButtonHeight, platedKit, textScale, tray } from "../ui/theme";
import { music, type CueId } from "../audio/music";
import { StallAudio } from "../audio/stallAudio";
import { reveal } from "../ui/transition";

const WIPE_LABEL = "đang lau thớt";
const LABEL_DEPTH = 8_000_000;

const MAX_TEX = 4096;

/** Thu từng nửa một tới đúng cỡ, vì thu một phát thì song tuyến bỏ sót điểm nguồn. */
function halve(img: HTMLImageElement | HTMLCanvasElement, w: number, h: number) {
  let src: CanvasImageSource = img;
  let sw = img.width, sh = img.height;
  for (;;) {
    const last = !(sw > w * 2 && sh > h * 2);
    const nw = last ? w : Math.max(w, sw >> 1), nh = last ? h : Math.max(h, sh >> 1);
    const step = document.createElement("canvas");
    step.width = nw;
    step.height = nh;
    const ctx = step.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, 0, 0, nw, nh);
    if (last) return step;
    src = step;
    sw = nw;
    sh = nh;
  }
}
/** Ô vẽ to hơn một chút quanh tâm để cạnh chéo chồng lên ô kề, không lộ khe. */
const TILE_GROW = 1.03;
const WEAK_GROUND_SS = 2;
/** Dấu hiệu trong thế giới to thêm trên cảm ứng, nơi một pixel thế giới chỉ chiếm chưa tới một pixel CSS. */
let touchMarks = false;
const markScale = () => (touchMarks ? 1.25 : 1);
const LIGHT_SS = 2;

const FLY_MAX = 5;
const ACH_TOAST_GAP_MS = 2800;
const FLY_TILT = 0.6;
const FLY_DIRT_MIN = 0.35;
/** Bằng số ngăn lò: rổ đỡ một mẻ, không phải kho bánh. */
const BASKET_SLOTS = 3;
/** Đo dọc mặt quầy chạy chéo, lệch cả hai trục theo tỉ lệ iso 2:1. */
const BASKET_STEP = 13;
/** "TÊN: " ở đầu dòng = lời người (xem `routeLine`). */
const SPEAKER_PREFIX = /^[^:\n]{1,24}: \S/;
/** Đủ gỡ kẹt tay, chưa đủ để sàn thành kho. */
const FLOOR_MAX = 3;
const FLOOR_REACH = 1.1;
/** Một mình nó mất 87 s mới đủ bẩn gọi ruồi. */
const FLOOR_DIRT_RATE = 0.004;
const FLOOR_SEC = 0.35;
const BIN_SEC = 0.4;
const TAKE_MONEY_SEC = 0.8;
const WASH_EVERY = 10;
const CHORE_R = 11;
const CHORE_EDGE = 8;
/** Không mượn `HUD_BAND_PX`: số đó cho tiền bay lên, còn cái lò nằm ngay hàng trên cùng. */
const CHORE_TOP = 58;
const CHORE_LIFT = 26;
/** Px từ đáy sprite lên mặt bàn. */
const topAbove = (img: Phaser.GameObjects.Image) =>
  COUNTER.TOP_ABOVE_FOOT - (SUNK.has(img.texture.key) ? TABLE_DROP : 0);

const WIPE_DIRT = 0.15;
const RAW_COL = 0xe8e2d4, CRISP_COL = 0xd9a441, SINGE_COL = 0xa0582c, BURNT_COL = 0x3a2a22;
/** Không viết `1 − FLY_DIRT_MIN`: phép trừ ra 0,35000000000000003, nhỉnh hơn ngưỡng. */
const WIPED_CLEAN = 0.7;

const HEAD_PX = 52;

/** Quãng ba chấm trước câu đáp; `PLAYER_SAY_TAIL` đo từ mốc này. */
const REPLY_DELAY_SEC = 0.3;
/** Đủ cho cú tắt dần 260 ms. */
const PLAYER_SAY_TAIL = 0.35;
const HUD_BAND_PX = 74;

/** Im lặng là phản ứng, nhạc đè lên thì mất khoảnh khắc đó. */
const HUSH_ON: ReadonlySet<StimId> = new Set<StimId>(["BURNT_OR_COLD", "DROPPED_FOOD"]);

const HUSH_SECONDS = 6;

/** Số ô cái dù lùi sau `SHADE_SPOT`; nhỏ nhất để `depthOf` vẽ người đứng mát đè lên dù. */
const UMBRELLA_BACK = 0.45;

/** Không dùng Container để gom cảnh: Container của Phaser không depth-sort con. */
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
  private menuBoard: MenuBoardView | null = null;
  private awning: Awning | null = null;
  private storageView: StorageView | null = null;
  private phoneView: PhoneView | null = null;
  private coach: TourCoach | null = null;
  /** Theo từng ổ, không dùng chung, kẻo gác ổ A nướng ổ B thì A bị chấm bằng số của B. */
  private breadQ = 1;
  private dishQ = 1;
  private dishSick = 0;

  private near: Station | null = null;

  private service!: Service;
  private actors = new Map<string, CustomerActor>();
  private assembly!: AssemblyPanel;
  private dish: Ingredient[] = [];
  /** `null` = thớt trống. */
  private boardLoaf: Ingredient[] | null = null;
  /** `warmth` · `crust` · `q` đi thành bộ qua mọi chặng kệ → lò → tay → thớt → khách. */
  private handWarmth = 0;
  private boardWarmth = 0;
  private handSteam!: Steam;
  private boardSteam!: Steam;
  private wipePuff!: WipePuff;
  private tap: WaterStream | null = null;
  private rain: Rain | null = null;
  private daylight!: Daylight;
  private lamps!: Lamps;
  private sheen!: PropSheen;
  private light!: SceneLight;
  /** Chỗ đặt tạm cho rảnh tay, nhặt lại giữ nguyên thông số. */
  private floor: { x: number; y: number; hand: Hand; warmth: number; crust: number; q: number; dish: Ingredient[] }[] = [];
  /** Đi theo ổ bánh chứ không theo bàn tay; chỉ bỏ ổ mới tẩy được. */
  private handSoiled = false;
  private boardSoiled = false;
  private floorImgs: Phaser.GameObjects.Image[] = [];
  private boardLoafImg!: Phaser.GameObjects.Image;
  private flies: Phaser.GameObjects.Image[] = [];
  private boardTopY = 0;
  private handCrust = 0;
  private boardCrust = 0;
  private boardQ = 1;
  private oven = new Oven();
  private ovenGfx!: Phaser.GameObjects.Graphics;
  private choreGfx!: Phaser.GameObjects.Graphics;
  private basket: {
    hand: Hand; warmth: number; crust: number; q: number; soiled: boolean;
    dish: Ingredient[]; dishQ: number; dishSick: number;
  }[] = [];
  private basketImgs: Phaser.GameObjects.Image[] = [];
  private basketTopY = 0;
  private basketX = 0;
  private basketDepth = 0;
  private boardDepth = 0;
  private labelY = new Map<string, { x: number; y: number }>();
  /** Đỉnh của chính cái vật, không phải `labelY` (đỉnh khối quầy, cao hơn mặt thớt 38 px). */
  private choreAt = new Map<string, { x: number; y: number }>();
  /** Tâm + bán kính thật của vật (mép pixel đục) để khoanh tròn khi dẫn bữa đầu. */
  private tourSpot = new Map<string, { x: number; y: number; r: number }>();
  /** Ngày 1 đứng hình lúc ổ vừa vàng, vì khúc vàng chỉ dài vài giây; bấm E chạy tiếp. */
  private tourFreeze = false;
  /** Đang dừng cảnh giải thích biểu tượng mắt, chờ bấm "Đã hiểu". */
  private eyeLesson = false;
  private grip = new Grip();
  private gripGfx!: Phaser.GameObjects.Graphics;
  /** Bốn field đi cùng nhau, luôn đặt qua `beBusy()`. */
  private handsBusyUntil = 0;
  private handsBusyFrom = 0;
  private handsBusyWhat = "";
  private handsBusyBar = true;
  private holdLatch = false;
  private hands: "CLEAN" | "MONEY" = "CLEAN";
  private soldSinceWash = 0;
  private dirtyEpisode = 0;
  private lastFlourish = new Map<string, number>();
  private lastMinutes = 0;
  /** Số thứ tự lượt phục vụ trong ngày, để seed đánh giá. */
  private elapsed = 0;
  private busy: { st: Station; ms: number } | null = null;
  /** Chỉ áp ở bước craft của frame để mọi thao tác qua đúng một cửa. */
  private intents: (() => void)[] = [];

  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private intent = new InputState();
  private touch: TouchControls | null = null;
  private paused = false;
  private talk!: TalkPanel;
  private talkRing!: Phaser.GameObjects.Graphics;
  private pendingDots!: Phaser.GameObjects.Graphics;
  private talkHoldsClock = false;
  /** Giữ cú bấm lại, mở ngay khi tay rảnh. */
  private talkQueued = -1;
  private talkTurn = 0;
  private playerSay: { text: string; until: number } | null = null;
  private moneyPops!: MoneyPops;
  private popClock = 0;
  private achToastAt = 0;
  private popLastNow = 0;
  private closed = false;
  private resumed = false;
  private overlay: Phaser.GameObjects.Container | null = null;
  private overlayBack: (() => void) | null = null;
  private settingsDom: MenuDom | null = null;
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
    this.oven = ovenFor(has(this.world.equipment, "LO_DIEN"));
    this.grip = new Grip();
    this.handsBusyUntil = 0;
    this.handsBusyFrom = 0;
    this.handsBusyWhat = "";
    this.handsBusyBar = true;
    this.handSoiled = false;
    this.boardSoiled = false;
    this.floor = [];
    this.hands = "CLEAN";
    this.soldSinceWash = 0;
    this.lastFlourish = new Map();
    this.intents = [];
    this.elapsed = 0;
    this.actors.clear();
    this.off = [];
    this.resumed = !!data.resume;
    // Phaser không chạy lại field initializer giữa hai ngày.
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
    preloadArt(this, true);
    Lamps.preload(this);
    StallAudio.preload(this);
  }

  create() {
    // Soi bản đồ gốc, trước khi mở ô đạo cụ chưa mua.
    if (import.meta.env.DEV) { assertWalkable(); assertMenuSpotFree(); assertStationsOnCounter(); }
    // Trước mọi thứ biết đi.
    setOpenTiles(openTilesFor((id) => has(this.world.equipment, id as EquipId)));
    setPole(has(this.world.equipment, "DU_CHE") ? { x: SHADE_SPOT.x - UMBRELLA_BACK, y: SHADE_SPOT.y - UMBRELLA_BACK } : null);

    paintNpcPhotos(this);

    const env: LightEnv = {
      overcast: this.raining,
      sunK: 0.45,
      gloss: (wx, wy) => materialOf(floorAt(Math.floor(wx), Math.floor(wy))).gloss,
      indoor: (_wx, wy) => indoorWeight(wy),
      sun: () => 1,
    };
    this.registry.set(LIGHT_ENV_KEY, env);

    const ground = this.bakeGround();
    this.light = new SceneLight(this, ground, env, LIGHT_SS);
    this.sheen = new PropSheen(this, env);
    // Dọn TRƯỚC `placeProps` — chính nó gọi `addStationLabel` để nạp lại.
    this.labelY.clear();
    this.choreAt.clear();
    this.tourSpot.clear();
    this.basketImgs = [];
    this.floorImgs = [];
    this.cam = new StallCamera(this, this.sceneBounds(ground, this.placeProps()));
    // Chỉ `backgroundColor` vẽ ra ngoài hình bao cảnh.
    this.cameras.main.setBackgroundColor(this.raining ? "#5f686c" : "#6f838d");
    this.rain = Rain.for(this, this.world.progress.weather, this.settings.reducedMotion);
    this.daylight = new Daylight(this, ground, this.raining);
    this.lamps = new Lamps(this, LAMP_SPOTS, { overcast: this.raining });

    this.ring = this.add.image(0, 0, FX.ring).setOrigin(0.5, 0.5).setVisible(false);

    this.player = new Player(this);
    this.player.reset();

    this.hud = new Hud(this, this.settings, () => (this.paused ? this.resume() : this.pause()), () => this.openPhone());
    this.hud.setUnread(totalUnread(this.world.phone) + unseen(this.world));
    this.touch = new TouchControls(this.intent);
    this.talkRing = this.add.graphics();
    this.pendingDots = this.add.graphics();
    this.talk = new TalkPanel(this, (i) => this.pickTalk(i), () => this.endTalk(),
      () => this.paused || this.closed || !!this.overlay);
    this.moneyPops = new MoneyPops(this, this.settings.textScale, LABEL_DEPTH + 6);
    this.handSteam = new Steam(this);
    this.boardSteam = new Steam(this);
    this.wipePuff = new WipePuff(this);
    this.flies = [];
    // `y` là mép dưới texture để `heldFootPad` đặt đáy ổ chạm mặt thớt.
    this.boardLoafImg = fitPhoto(this.add.image(0, 0, HELD.key("loaf_hot")))
      .setOrigin(0.5, 1).setVisible(false);
    this.ovenGfx = this.add.graphics().setDepth(LABEL_DEPTH + 2);
    this.choreGfx = this.add.graphics().setDepth(LABEL_DEPTH + 4);
    this.gripGfx = this.add.graphics();
    this.lastMinutes = this.clock.minutes;
    this.bubbles = new BubblePool(this, this.settings.textScale, undefined, () => {
      telemetry.bubblePoolSteals++;
      bus.emit("telemetry:mark", { key: "bubble.steal", value: 1 });
    });
    // Xếp bong bóng sau khi camera cuộn xong frame, không thì kẹp theo khung frame trước.
    this.cam.world.on(Phaser.Cameras.Scene2D.Events.FOLLOW_UPDATE, () =>
      this.bubbles.layout(this.cam.world.worldView, this.bubbleKeepOut(), this.time.now, this.settings.reducedMotion));

    const w = this.world;
    if (!this.resumed && w.flags.lateOpenDay === w.progress.dayIndex && this.clock.minutes < 8 * 60) {
      this.clock.minutes = 8 * 60;
      this.lastMinutes = this.clock.minutes;
    }
    this.service = new Service({
      bus, hub: this.ctx.rng, saveId: w.saveId, day: w.progress.dayIndex,
      npcs: w.npcs, bags: w.shuffleBags, dialog: w.dialogState,
      ...dayDeps(w),
      till: w.econ, flags: w.flags,
      equip: w.equipment, loaOn: has(w.equipment, "LOA_RAO") && (w.econ?.loaOffUntil ?? 0) < w.progress.dayIndex,
      noTimePressure: this.settings.noTimePressure,
      todayCounters: w.progress.today,
      onServed: (rec) => {
        const p = rollReview(w, rec, this.clock.minutes);
        if (p) enqueue(w, p);
      },
      readMul: (this.settings.textScale > 1 ? 1.25 : 1) * (this.settings.noTimePressure ? 1.5 : 1),
      resumeAt: this.resumed || w.flags.lateOpenDay === w.progress.dayIndex ? this.clock.minutes : undefined,
    });
    this.assembly = new AssemblyPanel(this,
      (dish, even) => this.intents.push(() => this.finishDish(dish, even)),
      (dish) => { this.boardLoaf = dish; },
      (id) => this.intents.push(() => {
        if (!this.dishGaps().length) this.quest("NHAN");
        this.onPlace(id);
      }),
      (i) => this.usePreset(i),
      (id, stack) => {
        // Đếm theo hàng trong kho: `dualeo` và `hanhngo` cùng rút từ hàng RAU.
        const mine = new Set(goodsFor(id));
        const inStack = stack.filter((x) => goodsFor(x).some((g) => mine.has(g))).length;
        return portionsFor(this.world.inventory, id, this.world.progress.dayIndex) > inStack ? null : `hết ${labelOf(id)}`;
      },
      () => this.orderIsEmptyLoaf(),
      (i) => this.consumePreset(i),
      openIngredients(this.world.progress.dayIndex),
    );
    this.drawEquipment();
    this.light.build();
    this.sheen.build();
    this.bindInput();
    this.wire();

    // Sau `service`: cần chỗ khách đứng để pan tiếng.
    const ambientRng = this.ctx.rng.stream("ambient");
    this.audio = new StallAudio({
      scene: this,
      panOf: (npcId) => this.panOf(npcId),
      rand: () => ambientRng.next(),
    });

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
          dishSick: l.dishSick ?? 0,
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
    if (touring(this.world)) {
      this.coach = new TourCoach({
        textScale: this.settings.textScale,
        onSkip: () => { tourSkip(this.world); this.eyeLesson = false; this.coach?.destroy(); this.coach = null; },
      });
    }

    this.time.delayedCall(900, () => this.autoPhone());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.registry.remove(LIGHT_ENV_KEY);
      this.coach?.destroy();
      this.coach = null;
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
      // Pause đang hạ nhạc −12 dB, trả về trước khi rời scene.
      if (this.paused && !this.closed) {
        music.duck(false);
        bus.emit("ui:pauseToggled", { paused: false, source: "MENU" });
      }
      this.audio?.destroy();
      this.wipePuff.destroy();
      this.tap?.destroy();
      this.tap = null;
      this.rain?.destroy();
      this.rain = null;
      this.daylight.destroy();
      this.lamps.destroy();
      this.light.destroy();
      this.sheen.destroy();
      // Listener trên `window`, không gỡ thì Esc màn sau chạy vào thẻ đã chết.
      this.talk.destroy();
      this.cam.destroy();
      for (const f of this.off) f();
      this.off = [];
      this.touch?.destroy();
      this.settingsDom?.close();
      this.touch = null;
      this.service.dispose();
      for (const a of this.actors.values()) a.destroy();
      this.actors.clear();
      if (DEV_TOOLS && dev.stall?.service === this.service) dev.stall = null;
    });
    reveal(this);
  }

  private listen<K extends EventKey>(k: K, fn: (p: EventMap[K]) => void) {
    this.off.push(bus.on(k, fn));
  }

  private wire() {
    this.listen("perception:confirmed", (p) => {
      if (HUSH_ON.has(p.stimId)) music.hush(HUSH_SECONDS);
      if (PLAYTEST && NEGATIVE_STIMS.has(p.stimId)) this.pause("PLAYTEST");
    });
    this.listen("npc:left", (p) => {
      if (p.reason === "IMPATIENT" || p.reason === "SOILED_FOOD") this.world.progress.today.lost++;
    });
    this.listen("money:changed", (p) => {
      if (this.closed) return;
      const { sx, sy } = toScreen(this.player.x, this.player.y);
      const ceil = this.cameras.main.scrollY + HUD_BAND_PX * textScale();
      this.moneyPops.pop(p.delta, sx, footY(sy) - HEAD_PX, this.popClock, ceil);
    });
    this.listen("save:written", () => this.hud.flashSaved());
  }

  /** Hình bao thật của cảnh chứ không của lưới ô: tường cao nhô lên cả trăm pixel. */
  private sceneBounds(ground: Phaser.Geom.Rectangle, props: Phaser.GameObjects.Image[]) {
    const bounds = Phaser.Geom.Rectangle.Clone(ground);
    for (const img of props) Phaser.Geom.Rectangle.Union(bounds, img.getBounds(), bounds);
    return bounds;
  }

  /** Nướng sẵn ở mật độ màn thật, chia mảnh để mỗi RenderTexture không vượt `MAX_TEX`. */
  private bakeGround() {
    const minX = toScreen(0, WORLD_H).sx - TW;
    const minY = toScreen(0, 0).sy - TH;
    const w = toScreen(WORLD_W, 0).sx - minX + TW;
    const h = toScreen(WORLD_W, WORLD_H).sy - minY + TH + BASE * 2;
    applyDeviceZoom();
    const weak = isTouch() && ((navigator as { deviceMemory?: number }).deviceMemory ?? 8) <= 4;
    const ss = Math.min(3, ZOOM * RENDER_SCALE, weak ? WEAK_GROUND_SS : 3);
    const gl = (this.game.renderer as { gl?: WebGLRenderingContext }).gl;
    const maxTex = Math.min(MAX_TEX, gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) as number : MAX_TEX);
    const part = Math.floor(maxTex / ss);

    const stamp = this.make.image({ key: TILE.floor("shop", 0) }, false).setOrigin(0, 0);
    const shrunk = new Map<string, string>();
    const prepared = (key: string, dw: number, dh: number) => {
      const hit = shrunk.get(key);
      if (hit) return hit;
      const src = this.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      const out = halve(src, Math.max(1, Math.round(dw * ss * TILE_GROW)), Math.max(1, Math.round(dh * ss * TILE_GROW)));
      const name = `ground/${key}`;
      if (this.textures.exists(name)) this.textures.remove(name);
      this.textures.addCanvas(name, out);
      shrunk.set(key, name);
      return name;
    };
    const put = (rt: Phaser.GameObjects.RenderTexture, ox: number, oy: number, key: string, tx: number, ty: number) => {
      const k = artScale(key);
      const tex = this.textures.get(key).getSourceImage();
      const dw = tex.width / k, dh = tex.height / k;
      const { sx, sy } = toScreen(tx + 0.5, ty + 0.5);
      const left = sx + (-dw / 2) * TILE_GROW, top = sy + (footY(sy) - dh - sy) * TILE_GROW;
      stamp.setTexture(prepared(key, dw, dh)).setScale(1);
      rt.batchDraw(stamp, (left - minX - ox) * ss, (top - minY - oy) * ss);
    };

    for (let oy = 0; oy < h; oy += part) {
      for (let ox = 0; ox < w; ox += part) {
        const pw = Math.min(part, w - ox), ph = Math.min(part, h - oy);
        const rt = this.add.renderTexture(minX + ox, minY + oy, Math.ceil(pw * ss), Math.ceil(ph * ss))
          .setOrigin(0, 0).setScale(1 / ss).setDepth(-1_000_000);
        rt.beginDraw();
        for (let ty = 0; ty < WORLD_H; ty++)
          for (let tx = 0; tx < WORLD_W; tx++) put(rt, ox, oy, floorTextureAt(floorAt(tx, ty), tx, ty), tx, ty);
        if (this.raining) {
          for (let ty = SKY_FROM_Y; ty < WORLD_H; ty++)
            for (let tx = 0; tx < WORLD_W; tx++) put(rt, ox, oy, TILE.wet, tx, ty);
        }
        rt.endDraw();
      }
    }
    stamp.destroy();
    for (const name of shrunk.values()) this.textures.remove(name);
    return new Phaser.Geom.Rectangle(minX, minY, w, h);
  }

  /** Đồ chưa mua thì ẩn; ô `A` là tấm bảng gỗ `BANG_HIEU`, không phải banner tên quán. */
  private propHidden(code: TileCode) {
    const id = BUYABLE_TILES[code];
    return id !== undefined && !has(this.world.equipment, id as EquipId);
  }

  private placeProps() {
    const placed: Phaser.GameObjects.Image[] = [];
    for (let ty = 0; ty < WORLD_H; ty++) {
      for (let tx = 0; tx < WORLD_W; tx++) {
        const code = tileAt(tx, ty);
        if (this.propHidden(code)) continue;
        const eOven = has(this.world.equipment, "LO_DIEN");
        let key = textureForTile(code, tx, ty, {
          isCounterEnd: code === "Q" && (tileAt(tx - 1, ty) !== "Q" || tileAt(tx + 1, ty) !== "Q"),
          stationId: stationAtTile(tx, ty)?.id ?? null,
          eOven,
        });
        // `ovenE` chỉ có ảnh thật; tải hỏng thì lùi về lò than còn hơn để trống.
        if (key === PROP.ovenE && !this.textures.exists(key)) key = PROP.oven;
        if (!key || !this.textures.exists(key)) continue;

        if (key === PROP.tableLong) {
          if (tileAt(tx - 1, ty) !== "Z") placed.push(...this.addLong(key, tx, ty));
          continue;
        }
        // Nửa xa của bàn dài cùng khung ảnh với nửa gần nên neo theo ô gần.
        const img = this.addAt(key, tx, ty, key === PROP.benchFar ? ty + 1 : ty);
        placed.push(this.sheen.register(this.light.add(img), key));
        if (code === "#" || code === "N" || code === "D") this.light.addWall(img);
        const st = stationAtTile(tx, ty);
        const primary = st?.tx === tx && st.ty === ty;
        if (st && primary) this.addStationLabel(st, img);
        if (st?.id === "sink" && primary) this.addTap(img);
        if (st?.id === "board" && primary) this.addBoard(img, tx, ty);
        if (st?.id === "basket") this.addBasket(img, tx, ty);
        if (key === COUNTER.end) this.addOnCounter(img, tx, ty, BASKET_TEX, BASKET_W);
      }
    }

    this.awning = createSign(this, this.world.shopName);

    const m = toScreen(MENU_TILE.x, MENU_TILE.y);
    const board = createMenuBoard(this, m.sx, m.sy, this.world.progress.dayIndex)
      .map((img) => img.getBounds())
      .reduce((a, b) => Phaser.Geom.Rectangle.Union(a, b));
    // Dấu cắm ở chỗ đứng đọc, không ở tấm bảng treo cao.
    const ms = toScreen(MENU_SPOT.x, MENU_SPOT.y);
    this.choreAt.set("menu", { x: ms.sx, y: footY(ms.sy) });
    this.tourSpot.set("menu", { x: board.centerX, y: board.centerY, r: Math.max(board.width, board.height) / 2 });

    return placed;
  }

  /** Bàn 2 × 1 ô dọc theo +x; đỉnh dưới của ảnh nằm đúng góc dưới của chân bàn. Mỗi cột lấy depth của trục giữa bàn. */
  private addLong(key: string, tx: number, ty: number) {
    const { sx, sy } = toScreen(tx + 2, ty + 1);
    const img = this.light.add(this.add.image(sx, sy + BASE, key).setOrigin(0.5, 1).setScale(1 / artScale(key)));
    return sliceImage(img, (m) => depthOf(m + ty + 1, ty + 0.5))
      .map(({ img: part, crop }) => this.sheen.register(part, key, crop));
  }

  private addAt(key: string, tx: number, ty: number, anchorTy = ty) {
    const at = toScreen(tx + 0.5, anchorTy + 0.5);
    return this.add.image(at.sx, footY(at.sy), key)
      .setOrigin(0.5, 1)
      .setScale(1 / artScale(key))
      .setDepth(depthOf(tx + 0.5, ty + 0.5));
  }

  /** Neo vào mặt quầy chứ không mặt đất; origin (0,5 · 1) là mép trước ê-líp đáy. */
  private addOnCounter(img: Phaser.GameObjects.Image, tx: number, ty: number, key: string, w: number) {
    if (!this.textures.exists(key)) return null;
    const topY = img.y - topAbove(img);
    const sprite = fitPhoto(this.add.image(img.x, topY + w / 4, key))
      .setOrigin(0.5, 1)
      .setDepth(depthOf(tx + 0.5, ty + 0.5) + 1);
    return { sprite, topY };
  }

  /** Không vẽ cái rổ: ổ nằm thẳng trên mặt quầy. */
  private addBasket(img: Phaser.GameObjects.Image, tx: number, ty: number) {
    this.basketX = img.x;
    this.basketTopY = img.y - topAbove(img);
    this.basketDepth = depthOf(tx + 0.5, ty + 0.5) + 0.5;
    // Không có vật nên neo theo mặt quầy.
    this.choreAt.set("basket", { x: this.basketX, y: this.basketTopY - 5 });
  }

  private addBoard(img: Phaser.GameObjects.Image, tx: number, ty: number) {
    const made = this.addOnCounter(img, tx, ty, BOARD_TEX, BOARD_W);
    if (!made) {
      // Không để rơi về mốc mặc định, dấu sẽ trỏ vào nóc tủ kính.
      this.boardTopY = img.y - COUNTER.TOP_ABOVE_FOOT;
      this.choreAt.set("board", { x: img.x, y: this.boardTopY - 5 });
      return;
    }
    // Bề dày thớt = tổng cao trừ hai nửa ê-líp (đáy và mặt trên cùng hình).
    this.boardTopY = made.topY - (made.sprite.displayHeight - BOARD_W / 2);
    const e = spriteEdges(this, made.sprite);
    this.choreAt.set("board", { x: e.cx, y: e.top - 5 });
    // Khớp tâm trạm: giữa hai bàn, tức lệch nửa ô về phía bàn topping so với thớt.
    this.tourSpot.set("board", { x: made.sprite.x + TW / 4, y: made.topY - TH / 4, r: TW * 0.8 });
    // `boardLoafImg` chưa dựng, ghi depth rồi áp sau.
    this.boardDepth = made.sprite.depth + 0.5;
  }

  /** Neo toạ độ thế giới, không kẹp vào khung nhìn. */
  private addStationLabel(st: Station, img: Phaser.GameObjects.Image) {
    // Mép pixel thật, khung texture khúc quầy gồm cả nóc tủ.
    const e = spriteEdges(this, img);
    const x = e.cx, y = e.top - 5;
    this.labelY.set(st.id, { x, y });
    this.choreAt.set(st.id, { x, y });
    this.tourSpot.set(st.id, {
      x, y: (e.top + e.bottom) / 2,
      r: Math.max(e.right - e.left, e.bottom - e.top) / 2 + 5,
    });
  }

  /** Đầu vòi và mặt nước đo theo tỉ lệ trên ảnh bồn. */
  private addTap(img: Phaser.GameObjects.Image) {
    const e = spriteEdges(this, img);
    const at = (fx: number, fy: number) => ({ x: e.left + (e.right - e.left) * fx, y: e.top + (e.bottom - e.top) * fy });
    this.tap = new WaterStream(this, at(0.41, 0.16), at(0.42, 0.40), img.depth + 0.5);
  }

  private bindInput() {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys("W,A,S,D,UP,LEFT,DOWN,RIGHT,E,SPACE,Q,R,ESC,SHIFT,F,P") as any;

    // Phaser có lúc phát lại cùng một sự kiện DOM vài lần trong frame chậm, nên khử trùng theo object.
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
      if (ev.code === "Tab") { ev.preventDefault(); if (!ev.repeat) this.intent.fire("phone"); return; }
      if (ev.code === "Escape" || ev.repeat || this.paused) return;
      if (ev.code === "KeyP") { this.intent.fire("pause"); return; }
      if (this.assembly.isOpen) { this.assembly.handleKey(ev.code); return; }
      if (ev.code === "KeyQ") this.intent.fire("discard");
      else if (ev.code === "KeyE" || ev.code === "Space") this.intent.fire("interact");
      else if (ev.code === "KeyR") this.intent.fire("lift");
      else if (ev.code === "KeyF") this.intent.fire("talk");
    });
    this.intent.releaseAll();
    this.intent.onAction((a) => this.act(a));
    const releaseAll = () => this.intent.releaseAll();
    window.addEventListener("blur", releaseAll);
    const onHidden = () => { if (document.hidden) releaseAll(); };
    document.addEventListener("visibilitychange", onHidden);
    this.off.push(() => {
      window.removeEventListener("blur", releaseAll);
      document.removeEventListener("visibilitychange", onHidden);
      this.intent.onAction(null);
    });
  }

  private act(a: Action) {
    switch (a) {
      case "phone": this.openPhone(); break;
      case "pause": if (this.paused) this.resume(); else this.pause(); break;
      case "discard": this.intents.push(() => this.discard()); break;
      case "lift": this.intents.push(() => this.liftFromBoard()); break;
      case "talk": this.intents.push(() => this.askFront()); break;
      case "interact":
        // Phải thả băng ở đây: `intents` chỉ chạy ở pha `craft` đang bị đóng băng.
        this.tourFreeze = false;
        this.intents.push(() => this.press());
        break;
    }
  }

  private syncKeys() {
    const k = this.keys, i = this.intent;
    i.kbDirs = {
      up: k.W.isDown || k.UP.isDown, down: k.S.isDown || k.DOWN.isDown,
      left: k.A.isDown || k.LEFT.isDown, right: k.D.isDown || k.RIGHT.isDown,
    };
    i.kbRun = k.SHIFT.isDown;
    i.kbWork = k.E.isDown || k.SPACE.isDown;
  }

  private holdingWorkKey() {
    return this.intent.work;
  }

  /** Qua `runFrame` để test bắt được nếu đổi thứ tự pha. */
  update(_t: number, dtMs: number) {
    this.syncKeys();
    touchMarks = isTouch();
    runFrame({
      clock: (raw) => {
        frameDeltas.push(raw);
        if (frameDeltas.length > 5400) frameDeltas.shift();
        this.clock.busy = this.service.busy || this.talkHoldsClock;
        // dt = 0 thì `runFrame` bỏ qua cả frame, đóng băng mọi hệ.
        if (this.tourHolding() || this.eyeLesson) return 0;
        return this.closed ? 0 : this.clock.advance(raw);
      },
      input: (dt) => {
        // Khoá cả chân khi tay bận; vẫn gọi `move()` với input toàn `false`.
        const rooted = this.handsBusy || !!this.busy;
        if (rooted) this.player.interrupt();
        this.player.move(rooted ? { up: false, down: false, left: false, right: false, run: false } : this.intent.move(), dt);
        this.near = stationNear(this.player.x, this.player.y, this.near);
        // Chưa mua bình trà thì không có trạm trà; lọc ở đây vì `STATIONS` là dữ liệu tĩnh.
        if (this.near?.id === "tea" && !has(this.world.equipment, "BINH_TRA")) this.near = null;
        if (this.assembly.isOpen && this.near?.id !== "board") this.assembly.park();
        if (this.busy && this.near?.id !== this.busy.st.id) this.busy = null;
      },
      craft: (dt) => {
        for (const act of this.intents.splice(0)) act();
        this.tickTalkQueue();
        this.tickStation(dt * 1000);
        this.tickTourOven();
        for (const _ of this.oven.tick(dt)) {
          const t = this.world.progress.today;
          t.burnt = (t.burnt ?? 0) + 1;
          bus.emit("stim:emitted", { stimId: "BURNT_OR_COLD", zone: "OVEN", salience: SALIENCE.BURNT_OR_COLD, at: this.elapsed, smell: true });
          this.hud.toast("khét rồi", "bad", this.popClock, { icon: "flame" });
        }
        this.tickGrip(dt);
        this.addDirt(0.0015 * Math.max(0, this.clock.minutes - this.lastMinutes));
        this.lastMinutes = this.clock.minutes;
        this.service.dirt = this.dirt;
        this.service.handsDirty = this.hands === "MONEY";
        this.service.playerAt = { x: this.player.x, y: this.player.y };
        // `Service` có thể tự kết thúc phiên; thiếu nhánh này thì `talkHoldsClock` kẹt.
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
        // Đồ dưới sàn làm quán bẩn dần, cái giá duy nhất của phím Q.
        if (this.floor.length) this.addDirt(FLOOR_DIRT_RATE * this.floor.length * dt);
      },
      perception: (dt) => {
        this.elapsed += dt;
        // Chỉ đưa sự thật thô; đừng gán `service.ovenHot`, fact đó nghĩa khác.
        this.service.ovenBusy = this.oven.busy;
        this.service.perceive(dt, this.elapsed, this.occluders());
      },
      npc: (dt) => {
        for (const o of deliverDue(this.world, this.clock.minutes)) {
          this.hud.toast(`Đơn #${o.id} đã giao`, "good", this.popClock, { icon: "box", title: "Đơn hàng" });
          sfx.play(this, "ui_dat_thanh_cong");
        }
        const fresh = dueReviews(this.world, this.clock.minutes);
        for (const r of fresh) {
          this.hud.toast(`${r.who} — ${r.stars}★`, r.stars >= 4 ? "good" : "bad", this.popClock, { icon: "star", title: "Đánh giá mới" });
          sfx.play(this, "ui_dat_thanh_cong");
        }
        if (fresh.length) this.hud.setUnread(totalUnread(this.world.phone) + unseen(this.world));
        achTick(this.world, dt);
        if (this.popClock >= this.achToastAt) {
          const got = takeAch();
          if (got) {
            this.hud.toast(`Danh hiệu: ${got.name}`, "good", this.popClock, { icon: `medal_${got.tier}` });
            this.achToastAt = this.popClock + ACH_TOAST_GAP_MS;
          }
        }
        this.service.tickNpcs(dt, {
          minutes: this.clock.minutes,
          pressure: !this.settings.noTimePressure,
          dayOver: this.clock.isOver,
        });
        this.drainService();
      },
      dialog: (dt) => {
        this.service.tickDialog(dt);
        this.drainService();
        telemetry.dialogDeferred = this.service.dialogDeferred;
        if (this.clock.isOver && !this.service.busy) this.close("CLOCK");
      },
      render: (dt) => { this.syncAudio(dt); this.renderSync(dt); },
      renderPaused: () => { this.syncAudio(0); this.renderSync(0); },
    }, dtMs);
    this.touch?.update(this.touchView());
  }

  private syncPlayerActivity() {
    const st = this.near;
    const wiping = this.handsBusy && this.handsBusyWhat === WIPE_LABEL;
    const washing = this.busy?.st.id === "sink";
    const act = this.paused || this.closed ? null : wiping ? "wipe" : washing ? "wash" : null;
    if (act && st) this.player.facing = facingOf8(st.tx + 0.5 - this.player.x, st.ty + 0.5 - this.player.y);
    this.player.activity = act;
  }

  /** Chỉ đọc state rồi vẽ; `dt` là giây thật, 0 khi pause. */
  private renderSync(dt: number) {
    const p = toScreen(this.player.x, this.player.y);
    this.cam.lookAt(p.sx, footY(p.sy));
    this.syncActors();
    this.syncMusic();
    this.player.heldCrust = this.handCrust;
    this.syncPlayerActivity();
    this.tap?.update(dt, !this.paused && !this.closed && this.busy?.st.id === "sink", this.settings.reducedMotion);
    this.player.draw(this.settings.reducedMotion, this.settings.playerMarker !== false);
    this.awning?.follow(this.player.x, this.player.y);
    this.drawPlayerBubble();
    for (const a of this.actors.values()) a.draw(this.settings.reducedMotion, this.time.now, this.elapsed);
    this.moneyPops.update(this.tickPopClock(), this.settings.reducedMotion);
    this.drawTalkTarget();
    this.drawPendingTalk();
    // Không lồng trong `drawPendingTalk()`: hàm đó `return` sớm.
    this.drawPendingDeeds();
    this.drawRing();
    this.drawSteam();
    this.drawOven();
    this.drawGrip();
    this.drawDirt();
    this.drawChores();
    this.drawCoach();
    this.drawBasket();
    this.drawFloorItems();
    this.rain?.draw(this.cam.world.worldView, dt, this.time.now, this.settings.reducedMotion);
    this.daylight.update(this.clock.minutes, this.cam.world.worldView);
    this.lamps.update(this.clock.minutes);
    const ticket = this.frontTicket();
    const quiet = this.promptDuplicatesButtons();
    this.hud.dockFeed(this.assembly.isOpen);
    this.hud.update({
      day: this.world.progress.dayIndex, clock: this.clock,
      money: this.world.money.cash, served: this.world.progress.today.served,
      near: this.assembly.isOpen ? null : this.near, hand: this.player.hand, busy: this.busy,
      frozen: this.paused || this.closed,
      ticket: ticket,
      carry: this.player.hand === "loaf_filled" ? this.dish : null,
      hands: this.hands,
      prompt: this.assembly.isOpen || quiet ? null : this.promptLine(),
      quiet,
      watch: this.watchLevel(),
      now: this.popClock,
      // Dùng chung chỗ vẽ với thanh giữ phím ở trạm.
      work: !this.busy && this.handsBusy && this.handsBusyBar ? { frac: this.handsBusyFrac } : null,
    });
  }

  /** Cảm ứng: nút đã ghi việc cần làm thì dòng nhãn trạm là thừa. */
  private promptDuplicatesButtons() {
    if (!isTouch() || this.handsBusy) return false;
    const v = this.touchView();
    return v.action.enabled || v.ctx?.kind === "talk" || v.ctx?.kind === "lift" || v.ctx?.text === "Nhặt";
  }

  /** Đọc từ trạng thái ánh nhìn chứ không `certainty`, để mắt sáng trước khi mình làm bậy. */
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

  /** Thứ tự nhánh là thứ tự ưu tiên, việc gấp nhất trước. */
  private promptLine(): string | null {
    const waiting = this.service.talkTargetNow;
    if (waiting && !this.talk.isOpen && this.service.pendingTalkers.includes(waiting.id)) {
      return `${this.service.label(waiting)} đang chờ mình trả lời${hint(" — bấm F", "")}`;
    }
    if (this.handsBusy) return `${this.handsBusyWhat || "tay đang bận"}…`;
    if (this.player.hand === "empty" && this.nearestFloor() >= 0) {
      return hint("dưới sàn có đồ, bấm Q nhặt lên", "dưới sàn có đồ, bấm Nhặt");
    }
    if (this.near?.id === "oven") return this.ovenPrompt();
    if (this.near?.id === "basket") return this.basketPrompt();
    if (this.near?.id === "kho") return `${this.storageName()}${hint(" — bấm E xem đồ", "")}`;
    if (this.near?.id === "bin") {
      return this.player.hand === "empty"
        ? "thùng rác — tay không có gì để bỏ"
        : `thùng rác${hint(" — bấm E bỏ", " — bỏ")} ${HAND_LABEL[this.player.hand]}`;
    }
    if (this.near?.id === "board") {
      const slow = this.dirt > FLY_DIRT_MIN ? " — thớt bẩn, lau lâu hơn" : "";
      return this.boardPrompt() ?? (this.player.hand === "empty" ? `thớt${hint(" — bấm E để lau thớt", " — lau thớt")}${slow}` : null);
    }
    if (this.nearMenuBoard()) return hint("bảng menu — bấm E đọc công thức", "bảng menu — đọc công thức");
    const who = this.service.talkTargetNow;
    if (who && !this.talk.isOpen) {
      return this.service.talkVerb(who) === "mời"
        ? hint(`F — mời ${this.service.label(who)} ghé mua`, `mời ${this.service.label(who)} ghé mua`)
        : hint(`F — nói chuyện với ${this.service.label(who)}`, `nói chuyện với ${this.service.label(who)}`);
    }
    return null;
  }

  /** Nhãn nút hành động cảm ứng, cùng luật với `promptLine` và `press`. */
  private actionLabel(): TouchLabel {
    const none: TouchLabel = { text: "", hold: false, enabled: false };
    if (this.handsBusy) return none;
    const h = this.player.hand, st = this.near;
    const ok = (text: string, hold = false): TouchLabel => ({ text, hold, enabled: true });
    if (this.nearMenuBoard()) return ok("Đọc bảng");
    if (!st) return none;
    switch (st.id) {
      case "oven":
        if (h === "loaf_cold" || h === "loaf_hot") return this.oven.hasRoom ? ok("Bỏ vào lò") : none;
        return h === "empty" && this.oven.count ? ok("Lấy bánh ra") : none;
      case "shelf": return h === "empty" ? ok("Lấy bánh") : none;
      case "sink": return h === "empty" ? ok("Rửa tay", true) : none;
      case "tea": return h === "empty" ? ok("Rót trà", true) : none;
      case "kho": return ok("Mở kho");
      case "bin": return h === "empty" ? none : ok("Bỏ đi");
      case "handoff": return blockedReason(st, h) ? none : ok("Giao bánh");
      case "basket":
        if (h === "empty") return this.basket.length ? ok("Lấy bánh") : none;
        return h === "loaf_hot" || h === "loaf_cold" || h === "loaf_filled" ? ok("Để bánh") : none;
      case "board":
        if (this.boardLoaf) return h === "empty" ? ok("Kẹp bánh") : none;
        if (h === "loaf_filled") return ok("Mở ổ");
        if (h === "loaf_hot") return ok("Kẹp bánh");
        return h === "empty" ? ok("Lau thớt") : none;
    }
    return none;
  }

  private touchView(): TouchView {
    const h = this.player.hand, busy = this.handsBusy;
    const onBoard = this.near?.id === "board";
    const who = this.service.talkTargetNow;
    const canDiscard = !busy && (h !== "empty" || this.nearestFloor() >= 0 || (onBoard && !!this.boardLoaf));
    const lift = !busy && onBoard && h === "empty" && !!this.boardLoaf && this.boardLoaf.length === 0;
    let ctx: TouchView["ctx"] = null;
    if (who && !this.talk.isOpen) ctx = { kind: "talk", text: this.service.talkVerb(who) === "mời" ? "Mời khách" : "Nói chuyện" };
    else if (lift) ctx = { kind: "lift", text: "Nhấc bánh" };
    else if (canDiscard) ctx = { kind: "discard", text: h === "empty" && this.nearestFloor() >= 0 ? "Nhặt" : "Đặt xuống" };
    return {
      visible: !this.closed && !this.paused && !this.overlay && !this.assembly.isOpen && !this.talk.isOpen
        && !this.menuBoard?.open && !this.storageView?.open && !this.phoneView?.open,
      action: this.actionLabel(),
      run: !busy,
      ctx,
    };
  }

  private ovenPrompt(): string {
    const h = this.player.hand, n = this.oven.count;
    const lo = has(this.world.equipment, "LO_DIEN") ? "lò điện" : "lò than";
    if (h === "loaf_cold" || h === "loaf_hot") return this.oven.hasRoom ? `${lo} — ${hint("bấm E bỏ ổ vào", "bỏ ổ vào")} (${n}/${OVEN_SLOTS})` : `${lo} — lò đầy rồi`;
    if (h === "empty") return n ? `${lo} — ${hint("bấm E lấy ổ chín nhất ra", "lấy ổ chín nhất ra")}` : `${lo} — lò trống, lấy ổ bánh ở kệ trước`;
    return `${lo} — tay đang cầm đồ`;
  }

  /** Theo khoảng cách thật tới người chơi, trần 0,6. */
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

  /** Nhận lời người bằng tiền tố `TÊN: `, không bằng ngoặc kép vì câu gọi món không có ngoặc. */
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
        if (ev.item === "talk") w.econ.today.talk += ev.amount;
        else w.econ.today.fixed += ev.amount;
        bus.emit("money:changed", { delta: -ev.amount, balance: w.money.cash, reason: "TEA" });
        continue;
      }
      // Không toast: đã có bong bóng và dấu `drawPendingTalk()`.
      if (ev.kind === "talkOffer") continue;
      // Làm ở đây, không trong `Service`: `service.playerHand = player.hand` ghi đè mỗi frame.
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

  private tickTalkQueue() {
    // Hết hạn sau 4 s, lâu hơn thì người chơi đã quên mình bấm gì.
    if (this.talkQueued >= 0) {
      if (this.elapsed - this.talkQueued > 4) this.talkQueued = -1;
      else if (!this.handsBusy) { this.talkQueued = -1; this.askFront(); }
    }
  }

  /** Chỉ cho khách ngắt ở ranh giới việc, không giữa chừng. */
  private canBeInterrupted(): boolean {
    const h = this.player.hand;
    if (h === "loaf_hot" || h === "loaf_filled") return false;
    if (h === "tea") return false;
    if (this.assembly.isOpen) return false;
    if (this.handsBusy || this.busy) return false;
    if (this.boardLoaf) return false;
    if (this.floor.length) return false;
    // Lò đã qua vạch giòn, mấy giây nữa là sém.
    if (this.oven.slots.some((l) => l && bandOfCrust(l.crust, this.oven.burnAt, this.oven.singeAt) !== "RAW")) return false;
    return true;
  }

  private workSeconds(s: number) {
    const k = swiftToday(this.world) ? SWIFT_MUL : 1;
    return s * k;
  }

  private tickStation(dtMs: number) {
    const st = this.near;
    // Lò không giữ phím (xem `pressOven`).
    const usable = st && st.id !== "oven" && !this.handsBusy && !blockedReason(st, this.player.hand) && st.holdMs > 0;

    if (!this.holdingWorkKey()) this.holdLatch = false;
    if (!usable || !this.holdingWorkKey() || this.holdLatch) {
      // Thả đúng lúc bánh vàng thì ăn; thả sớm thì huỷ, không phạt.
      if (this.busy && this.busy.st.overcookMs && this.busy.ms >= this.busy.st.holdMs) {
        this.finish(this.busy.st);
      }
      this.busy = null;
      return;
    }

    if (!this.busy || this.busy.st.id !== st!.id) {
      this.busy = { st: st!, ms: 0 };
      // Tiếng rót phát lúc bắt đầu giữ, không lúc ly đã đầy.
      if (st!.id === "tea") this.audio.tea();
    }
    this.busy.ms += dtMs;

    if (st!.overcookMs) {
      if (this.busy.ms >= st!.overcookMs) {
        this.player.hand = st!.spoils ?? "loaf_burnt";
        this.emit("BURNT_OR_COLD", undefined, true);
        this.busy = null;
      }
    } else if (this.busy.ms >= this.holdOf(st!)) {
      this.finish(st!);
      this.busy = null;
      this.holdLatch = true;                           // phải nhả phím mới làm lại được
    }
  }

  private holdOf(st: Station) {
    if (st.id === "tea") return 250;
    return st.holdMs * (swiftToday(this.world) ? SWIFT_MUL : 1);
  }

  private press() {
    if (this.paused || this.closed) return;
    if (this.handsBusy) return;
    if (this.nearMenuBoard()) { this.openMenuBoard(); return; }
    const st = this.near;
    if (st?.id === "kho") { this.openStorage(); return; }
    if (st?.id === "oven") { this.pressOven(); return; }
    if (st?.id === "basket") { this.pressBasket(); return; }
    if (st?.id === "board" && this.player.hand === "empty") {
      // E ở thớt chỉ làm việc với ổ trên thớt; cầm ổ lên là phím R.
      if (this.boardLoaf) { this.openBoard(); return; }
      const sec = this.workSeconds(this.wipeSeconds());
      this.beBusy(sec, WIPE_LABEL);
      this.wipePuff.start(
        toScreen(st.tx + 0.5, st.ty + 0.5).sx, this.boardTopY,
        depthOf(st.tx + 0.5, st.ty + 0.5) + 3, sec * 1000, this.settings.reducedMotion,
      );
      this.wipeBoard();
      this.audio.wipeFor(sec);
      this.hud.toast("lau thớt", "good", this.popClock);
      return;
    }
    if (st && st.holdMs === 0 && !blockedReason(st, this.player.hand)) this.finish(st);
  }

  private pressBasket() {
    const h = this.player.hand;
    if (h === "loaf_hot" || h === "loaf_cold" || h === "loaf_filled") {
      if (this.basket.length >= BASKET_SLOTS) { this.hud.toast("chỗ để bánh đầy rồi", "info", this.popClock); return; }
      this.basket.push({
        hand: h, warmth: this.handWarmth, crust: this.handCrust, q: this.breadQ,
        soiled: this.handSoiled, dish: [...this.dish], dishQ: this.dishQ, dishSick: this.dishSick,
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
    // Rút ổ còn ấm trước, rồi mới xét giòn.
    let bi = 0;
    for (let i = 1; i < this.basket.length; i++) {
      const a = this.basket[i], b = this.basket[bi];
      const aw = isWarm(a.warmth), bw = isWarm(b.warmth);
      if (aw !== bw ? aw : a.crust > b.crust) bi = i;
    }
    const l = this.basket.splice(bi, 1)[0];
    this.pickUp(l.hand === "loaf_filled" ? "loaf_filled" : isWarm(l.warmth) ? "loaf_hot" : "loaf_cold");
    this.handWarmth = l.warmth;
    this.handCrust = l.crust;
    this.handSoiled = l.soiled;
    this.breadQ = l.q;
    this.dish = l.dish;
    this.dishQ = l.dishQ;
    this.dishSick = l.dishSick;
  }

  private basketPrompt(): string {
    const n = this.basket.length, h = this.player.hand;
    const wrapped = this.basket.filter((l) => l.hand === "loaf_filled").length;
    if (h === "loaf_hot" || h === "loaf_cold" || h === "loaf_filled") {
      return n >= BASKET_SLOTS
        ? `chỗ để bánh — đầy rồi (${n}/${BASKET_SLOTS})`
        : `chỗ để bánh — ${hint("bấm E để xuống", "để xuống")} (${n}/${BASKET_SLOTS})`;
    }
    if (h !== "empty") return "chỗ để bánh — tay đang cầm đồ";
    if (!n) return "chỗ để bánh — đang trống";
    const got = wrapped ? `${wrapped} ổ đã gói` : `${n} ổ`;
    return `chỗ để bánh — ${hint("bấm E lấy ra", "lấy ra")} (${got})`;
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
    if (this.boardLoaf.length > 0) { this.hud.toast(hint("ổ đang kẹp dở, E gói lại hoặc Q đặt xuống", "ổ đang kẹp dở, gói lại hoặc đặt xuống"), "info", this.popClock); return; }
    this.liftBoardLoaf();
  }

  /**
   * MỞ Ổ ĐÃ GÓI RA: nhân trở lại thớt, bảng kẹp mở lại với đúng ổ đó, kẹp thêm hay gỡ bớt
   * tuỳ ý rồi gói lại (`finishDish`). Không có nó thì một cú bấm "Gói lại" sớm là không
   * sửa được — kẹp nhầm có miếng ớt cũng phải đem cả ổ bỏ thùng rác.
   */
  private unwrapToBoard() {
    // Kho phải nhận lại từng phần, ĐỐI XỨNG với `finishDish` (gói xong mới trừ kho): không
    // trả thì mở ra gói lại một ổ hai lần là trừ nguyên liệu hai lần.
    //
    // Phần chia sẵn (preset) đã trừ ở cú gói đầu thì KHÔNG hoàn lại — nhân đổ ra thớt rồi,
    // nó về kho thành nguyên liệu rời chứ không về lại thành một suất đã chia.
    const day = this.world.progress.dayIndex;
    for (const ing of this.dish) putBack(this.world.inventory, ing, 1, day);
    this.boardLoaf = [...this.dish];
    this.boardWarmth = this.handWarmth;                  // ổ mang theo cả bộ thông số của nó
    this.boardCrust = this.handCrust;
    this.boardSoiled = this.handSoiled;
    this.boardQ = this.breadQ;
    this.player.hand = "empty";
    this.dish = [];
    this.audio.wrap();                                   // tiếng giấy gói — lần này là mở ra
    this.openBoard(false);
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
    if (!this.boardLoaf) {
      // Tay đang cầm ổ đã gói: thớt là đường QUAY LẠI — mở ra kẹp thêm, gỡ bớt miếng kẹp nhầm.
      return this.player.hand === "loaf_filled" ? hint("thớt — bấm E mở ổ ra kẹp thêm hoặc gỡ bớt", "thớt — mở ổ ra kẹp thêm hoặc gỡ bớt") : null;
    }
    if (this.player.hand !== "empty") return hint("thớt — đang có ổ gác · Q đặt ổ trên tay xuống", "thớt — đang có ổ gác · Đặt ổ trên tay xuống");
    const bare = this.boardLoaf.length === 0;
    // Ổ nguội: nói thẳng việc đúng nhất là cầm ra lò nướng lại, nhưng KHÔNG giấu mất đường kẹp tiếp.
    if (bare && !isWarm(this.boardWarmth)) return hint("thớt — ổ nguội rồi · R cầm lên nướng lại", "thớt — ổ nguội rồi · Nhấc bánh lên nướng lại");
    if (bare) return hint("thớt — E kẹp nhân · R cầm ổ lên", "thớt — Kẹp bánh · Nhấc bánh lên");
    return `thớt — ${hint("E kẹp tiếp", "Kẹp bánh tiếp")} (${this.boardLoaf.length} phần đã kẹp) · ${hint("Q đặt ổ xuống sàn", "Đặt xuống sàn")}`;
  }

  private finish(st: Station) {
    switch (st.id) {
      case "board":                                     // T2: mở bảng CHỌN NGUYÊN LIỆU
        // Đặt ổ nóng xuống thớt: tay rảnh, ổ nằm trên thớt cho tới khi gói.
        // Thớt đã có ổ thì nói luôn đường ra, đừng chỉ nói "không được" (xem `boardPrompt`).
        if (this.boardLoaf) { this.hud.toast(hint("thớt đang có ổ, bấm Q đặt ổ trên tay xuống", "thớt đang có ổ, đặt ổ trên tay xuống trước"), "info", this.popClock); return; }
        // Ổ ĐÃ GÓI đem lại thớt = mở giấy ra sửa, không phải gói ổ mới.
        if (this.player.hand === "loaf_filled") { this.unwrapToBoard(); return; }
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
        this.player.hand = "empty";
        this.dish = [];
        this.handSoiled = false;
        this.busy = null;
        this.beBusy(this.workSeconds(BIN_SEC), "đang bỏ vào thùng", "quick");
        this.audio.bin();
        this.addDirt(0.004);                            // vụn bánh rơi quanh miệng thùng
        this.hud.toast("bỏ vào thùng", "info", this.popClock);
        return;
      }

      case "handoff":
        return this.handOver();

      case "sink":                                      // WASH_HANDS: sạch cả hai tay
        // Vòi nước đã kêu suốt lượt giữ phím (xem `audio.tick`), ở đây chỉ còn cú vẩy tay.
        this.hands = "CLEAN";
        this.soldSinceWash = 0;
        this.quest("TAY", true);
        this.dirtyEpisode++;
        this.addDirt(-0.1);
        // Rửa ngay trước mặt khách — ai đang nhìn tay thì thấy.
        this.service.washedVisibly();
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
  private openBoard(slice = true) {
    this.quest("THOT");
    // Nhát dao rạch dọc ổ — "âm chữ ký của game" (P5-03 §4.2 A). Nó nổ ở ĐÂY vì đây
    // là lúc ổ bánh thật sự được mở ra, dù trên màn hình chỉ là một cái bảng hiện lên.
    // Ổ ĐÃ GÓI mở lại thì không có nhát dao nào nữa: nó đã bị rạch ở cú mở đầu tiên.
    if (slice) this.audio.knife();
    this.assembly.setPresets(this.world.stall.presets);
    this.assembly.placeBelow(this.hud.statsBottom);
    this.assembly.show(this.boardLoaf ?? []);
  }

  private finishDish(dish: Ingredient[], evenWrap = false) {
    this.quest("GOI");
    this.audio.wrap();
    this.boardLoaf = null;
    this.grip.reset();                                 // cầm ổ mới gói lên: tay chắc lại từ đầu
    // Ổ rời thớt lên tay thì cả bộ thông số của NÓ đi theo — không phải của ổ nào khác.
    this.handWarmth = this.boardWarmth;
    this.handCrust = this.boardCrust;
    this.handSoiled = this.boardSoiled;
    this.breadQ = this.boardQ;
    this.dish = dish;
    this.player.hand = "loaf_filled";
    // gói xong mới trừ kho — lô cũ nhất trước (P3-03); chất lượng từng phần vào dishQuality
    const day = this.world.progress.dayIndex;
    const parts: { ing: Ingredient; q: number }[] = [];
    const taken: Portion[] = [];
    for (const ing of dish) for (const p of takeFull(this.world.inventory, ing, 1, day)) { parts.push({ ing, q: p.q }); taken.push(p); }
    this.dishQ = dishQuality(this.breadQ, parts);
    this.dishSick = sickChance(taken);

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
    // Ổ trơn đưa thẳng cũng là một ổ bánh — nguội thì vẫn là nguội.
    const isLoaf = this.player.hand === "loaf_filled" || this.player.hand === "loaf_hot"
      || this.player.hand === "loaf_cold";
    const cold = isLoaf && !isWarm(this.handWarmth) && this.service.front?.phase === "waiting";
    if (cold) this.emit("BURNT_OR_COLD", "HANDS");
    const res = this.player.hand === "tea"
      ? this.service.serveTea()
      : this.service.serveDish(this.dish, {
        cold, crust: this.handCrust, quality: this.dishQ, sick: this.dishSick,
        // `burnAt` THẬT của cái lò đang dùng — lò điện có ngưỡng riêng, lấy hằng số thì dải tốt
        // của nó bị đọc thành "cháy cạnh" (xem `serveDish`).
        burnAt: this.oven.burnAt, singeAt: this.oven.singeAt,
        // Người NHÌN THẤY lúc nó rơi thì biết chắc; người không thấy thì chỉ cắn phải sạn.
        soiled: this.handSoiled,
      });

    if (!res.ok) { this.hud.toast(res.reason ?? "chưa đưa được", "info", this.popClock); return; }
    this.quest("GIAO", true);
    // Mình nói ra chuyện vừa cho thêm — bong bóng của người chơi, ngay lúc chìa ổ bánh.
    // Câu đáp của khách tới sau ~0,2–0,4 s (`BARK_DELAY_MIN`), nên hai bong bóng chồng nhau một
    // quãng: đúng như hai người nói chuyện.
    if (res.playerSay) this.sayAsPlayer(res.playerSay, bubbleLife(res.playerSay, this.readMul()));

    this.handSoiled = false;
    const wasDish = isLoaf;                            // ổ trơn cũng lấy tiền → tay dính tiền
    this.player.hand = "empty";
    this.dish = [];
    // ⚖️ P1-01 §2.11 ghi 2,0 s, nhưng nhận tiền không phải thao tác có tay nghề. 0,8 s vẫn giữ cái giá
    // thật của nó: tay DÍNH TIỀN cho tới khi đi rửa.
    if (wasDish) {
      if (!cleanHandsToday(this.world) && ++this.soldSinceWash >= WASH_EVERY && this.hands === "CLEAN") {
        this.hands = "MONEY";
        this.hud.toast("tay dơ rồi, rửa ngay", "info", this.popClock, { icon: "alert" });
      }
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
    /*
     * Hai bước cuối của bữa đầu chốt ở ĐÂY, chỗ duy nhất món lên tay — kệ, lò, và cả ổ nhặt
     * dưới sàn đều đi qua hàm này. Treo vô từng chỗ bấm thì sót, mà sót thì dòng dẫn kẹt lại
     * bảo người ta đi lấy cái họ đang cầm.
     *
     * Ổ CHÁY thì KHÔNG tính là xong bước lò — nó không gác lên thớt được, nên cho qua bước là
     * đẩy người chơi vào một bước kế không làm nổi. Người dẫn ở lại bước lò và đổi câu: bỏ ổ
     * khét đi, lấy ổ khác (xem `ovenAim`).
     */
    if (hand === "loaf_cold") this.quest("BANH");
    if (hand === "loaf_hot") this.quest("LO");
  }

  /**
   * Tay dính tiền thì đó là `DIRTY_HANDS` ở vùng TAY. Cùng một đợt tay dơ thì cùng một khoá.
   *
   * CÁI KẸP GẮP GỠ HẲN CHUYỆN NÀY, ở cửa hệ tay dơ chứ không ở từng chỗ gọi (gác ở `onPlace` thôi thì
   * lấy ổ ở kệ vẫn bắn `DIRTY_HANDS`).
   */
  private touchFood() {
    if (has(this.world.equipment, "KEP_GAP")) return;
    if (this.hands !== "MONEY") return;
    // đếm SAU cái cổng: "tay cầm tiền xong đụng vô đồ ăn" mới là việc cái kẹp gắp gỡ được.
    // Đếm ở chỗ gọi (mỗi lần bỏ một thứ nhân) thì ra con số của số nguyên liệu, không phải
    // của số lần tay dơ chạm đồ ăn.
    const t = this.world.progress.today;
    t.bareHands = (t.bareHands ?? 0) + 1;
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
    const base = 2.5;
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

  /** Chỉ lúc đó bảng kẹp nhân mới cho gói ổ trống. Một món duy nhất trên bảng là ổ trơn. */
  private orderIsEmptyLoaf() {
    const it = this.service.front?.order?.intent;
    return !!it && isBare(it.mon);
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

  /** Bấm E cầm ổ trơn = bỏ vào; tay không = lấy ổ chín nhất ra. */
  private pressOven() {
    const h = this.player.hand;
    if (h === "loaf_cold" || h === "loaf_hot") {
      // Ổ mang cả chất lượng lô lẫn phần vỏ đã nướng dở vào lò.
      if (!this.oven.put(this.breadQ, this.handCrust, this.handSoiled)) { this.hud.toast("lò đầy rồi", "info", this.popClock); return; }
      this.audio.ovenDoor();
      this.player.hand = "empty";
      this.handCrust = 0;
      return;
    }
    if (h !== "empty") { this.hud.toast("tay đang cầm đồ", "info", this.popClock); return; }
    if (this.tourBlocksTake()) { this.hud.toast("chưa giòn — chờ vòng vàng", "info", this.popClock); return; }
    const l = this.oven.take();
    if (!l) { this.hud.toast("lò đang trống", "info", this.popClock); return; }
    const band = bandOfCrust(l.crust, this.oven.burnAt, this.oven.singeAt);
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

  /** Lời người chơi hiện thành bong bóng trên đầu, ngay chỗ mắt đang nhìn. */
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

  /** Bong bóng của người chơi — cùng pool, cùng luật né với bong bóng của khách. */
  private drawPlayerBubble() {
    const p = this.playerSay;
    if (!p || this.elapsed >= p.until) {
      if (this.playerSay) this.playerSay = null;
      this.bubbles.release("player", this.settings.reducedMotion);
    } else this.bubbles.acquire("player").setText(p.text);
    const { sx, sy } = toScreen(this.player.x, this.player.y);
    this.bubbles.anchor("player", sx, footY(sy) - HEAD_PX - 46, BUBBLE_DEPTH);
  }

  /** Chỉ thứ đổi theo trạng thái món, không theo chỗ người chơi đứng, kẻo bong bóng nhảy theo bước chân. */
  private bubbleKeepOut(): Box[] {
    const out: Box[] = [];
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
    this.hud.toast("rơi rồi…", "bad", this.popClock);
  }

  /** Hơi lò che tầm nhìn khi lò đang nướng. */
  private occluders(): Occluder[] {
    const out: Occluder[] = [];
    if (this.oven.busy) out.push({ mul: 0.8, slots: ["OVEN", "BOARD"], zones: ["FRONT_CENTER", "FRONT_SIDE", "QUEUE_2", "QUEUE_3", "SEATED_FAR"] });
    return out;
  }

  /**
   * Vòng độ giòn trên cửa lò — một vòng mỗi slot. Ba nấc (non · giòn · sém) vẽ thành ba cung nền
   * mờ, cung sáng là chỗ ổ bánh đang đứng, hai vạch trắng là hai ranh giới.
   *
   * ⚠️ MỌI MỐC ĐỌC TỪ `this.oven`, KHÔNG TỪ `CRUST`: lò điện có `singeAt`/`burnAt` riêng, lấy
   * hằng số là vòng nói một đằng màu một nẻo.
   */
  private drawOven() {
    const g = this.ovenGfx;
    g.clear();
    const lab = this.labelY.get("oven");
    if (!lab) return;
    // ngay trên nhãn "lò than", và vẽ TRÊN lớp nhãn — nhãn không được che độ giòn
    const sx = lab.x, baseY = lab.y - 24;
    const R = 11 * markScale();
    for (let i = 0; i < OVEN_SLOTS; i++) {
      const cx = sx + (i - 1) * 30 * markScale();
      const l = this.oven.slots[i];
      g.fillStyle(0x1b2429, 0.9).fillCircle(cx, baseY, R + 3);
      g.lineStyle(2, 0x6d7b84, 1).strokeCircle(cx, baseY, R);
      if (!l) continue;
      // Vòng chia theo `burnAt` THẬT của lò này, không theo hằng số: lò điện có ngưỡng
      // cháy riêng, lấy hằng số thì vòng đầy trước khi ổ cháy — vạch đỏ nói dối.
      const burnAt = this.oven.burnAt, singeAt = this.oven.singeAt;
      const band = bandOfCrust(l.crust, burnAt, singeAt);
      const col = band === "RAW" ? RAW_COL : band === "CRISP" ? CRISP_COL : band === "SINGED" ? SINGE_COL : BURNT_COL;
      const ang = (n: number) => -Math.PI / 2 + (n / burnAt) * Math.PI * 2;

      // Ba nấc phải thấy trước khi đi tới: nền ba cung mờ (non · giòn · sém), rồi cung sáng chạy đè lên.
      g.lineStyle(4, RAW_COL, 0.22);
      g.beginPath(); g.arc(cx, baseY, R, ang(0), ang(CRUST.READY)); g.strokePath();
      g.lineStyle(4, CRISP_COL, 0.3);
      g.beginPath(); g.arc(cx, baseY, R, ang(CRUST.READY), ang(singeAt)); g.strokePath();
      g.lineStyle(4, SINGE_COL, 0.3);
      g.beginPath(); g.arc(cx, baseY, R, ang(singeAt), ang(burnAt)); g.strokePath();

      const frac = Math.min(1, l.crust / burnAt);
      g.lineStyle(4, col, 1);
      g.beginPath();
      g.arc(cx, baseY, R, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      g.strokePath();

      /*
       * ⚠️ VẠCH THỨ HAI ĐỌC `oven.singeAt`, KHÔNG ĐỌC `CRUST.SINGED`: lò điện có `singeAt` riêng,
       * lấy hằng số là vạch trắng lệch khỏi chỗ đổi màu.
       */
      for (const n of [CRUST.READY, singeAt]) {
        const a = ang(n);
        g.lineStyle(2, 0xffffff, 0.9);
        g.lineBetween(cx + Math.cos(a) * (R - 4), baseY + Math.sin(a) * (R - 4), cx + Math.cos(a) * (R + 4), baseY + Math.sin(a) * (R + 4));
      }
      if (band === "BURNT") g.fillStyle(BURNT_COL, 1).fillCircle(cx, baseY, R - 3);
    }
  }

  /**
   * Bong bóng dẫn bữa đầu — khoanh tròn thứ cần bấm, kèm một câu hướng dẫn.
   *
   * Chạy MỖI FRAME vì camera còn trượt theo người chơi: cái vòng phải dính vào cái lò chứ không
   * dính vào màn hình. `TourCoach` chỉ ghi lại chữ khi chữ thật sự đổi, nên gọi liên tục không
   * làm bong bóng nhấp nháy.
   *
   * Tắt hẳn khi có lớp khác đang mở (bảng menu, pause): khoanh một chỗ bị che là chỉ
   * vào tấm màn.
   */
  private drawCoach() {
    const c = this.coach;
    if (!c) return;
    const w = this.world;
    if (!touring(w) || w.system.stage === "new") { c.hide(); return; }
    c.setWho(linked(w) ? "Hệ thống" : "Hướng dẫn");
    if (this.storageView?.open && tourAt(w, "KHO")) {
      const read = linked(w) ? KHO_READ
        : "Số lượng: hàng còn lại. \"Còn … ngày\": hạn dùng. Thanh màu càng ngắn càng gần hỏng. Xem xong bấm Đóng.";
      c.pointEl(document.querySelector(".sv-det"), read, tourIndex(w), TOUR_TOTAL, "rect", true);
      return;
    }
    if (this.paused || this.closed || this.menuBoard?.open || this.storageView?.open || this.phoneView?.open) {
      c.hide();
      return;
    }
    if (!this.eyeLesson && !eyeExplained(w) && this.watchLevel() !== "NONE") this.eyeLesson = true;
    if (this.eyeLesson) {
      const text = linked(w) ? EYE_TEXT
        : "Mắt sáng: có khách đang nhìn bạn. Mắt đỏ nháy: khách nhìn chằm vào tay. Sơ suất lúc này, khách thấy rõ.";
      c.pointDesign(this.game.canvas, GAME_W, GAME_H, {
        ...this.hud.eyeBox, shape: "rect", text,
        ok: () => { explainEye(w); this.eyeLesson = false; },
      });
      return;
    }
    const aim = this.coachAim();
    if (!aim) { c.hide(); return; }
    c.pointDesign(this.game.canvas, GAME_W, GAME_H,
      { ...aim, step: tourIndex(w), total: TOUR_TOTAL });
  }

  /**
   * Ô cần khoanh, theo TOẠ ĐỘ KHUNG THIẾT KẾ.
   *
   * Hai loại mốc, hai phép quy đổi:
   *   · trạm trong quán — toạ độ THẾ GIỚI, phải trừ `worldView` rồi nhân `ZOOM` (camera thế giới
   *     zoom `ZOOM × RENDER_SCALE`, mà khung thiết kế đã chia sẵn `RENDER_SCALE`);
   *   · bảng kẹp nhân — đã là toạ độ thiết kế sẵn (`scrollFactor(0)`), lấy thẳng.
   */
  private coachAim(): { x: number; y: number; w: number; h: number; shape?: "circle" | "rect"; text: string } | null {
    const w = this.world;
    const ring = (id: string, text: string) => {
      const at = this.tourSpot.get(id);
      if (!at) return null;
      const v = this.cam.world.worldView;
      const d = at.r * ZOOM;
      return {
        x: (at.x - v.x) * ZOOM - d, y: (at.y - v.y) * ZOOM - d,
        w: d * 2, h: d * 2, shape: "circle" as const, text,
      };
    };

    const say = (step: TourStep, plain: string) => (linked(w) ? QUEST_TEXT[step] : plain);
    if (tourAt(w, "CHO")) {
      return { ...this.hud.phoneRect, shape: "rect", text: say("CHO", "Mở điện thoại, vào Thực phẩm, đặt hàng đủ bán hôm nay.") };
    }
    if (tourAt(w, "MENU")) return ring("menu", say("MENU", hint("Tới bảng menu, bấm E đọc.", "Tới bảng menu, bấm nút Đọc bảng.")));
    if (tourAt(w, "KHO")) {
      if (stockOf(w.inventory, "BANH", w.progress.dayIndex) <= 0) return ring("kho", "Hàng đang trên đường giao. Chờ một chút.");
      return ring("kho", say("KHO", hint("Tới thùng xốp, bấm E xem hàng còn lại.", "Tới thùng xốp, bấm nút Mở kho.")));
    }
    if (tourAt(w, "BANH")) {
      if (stockOf(w.inventory, "BANH", w.progress.dayIndex) <= 0 && this.player.hand === "empty") {
        return ring("shelf", "Hàng đang trên đường giao. Chờ một chút.");
      }
      return ring("shelf", say("BANH", hint("Qua kệ, bấm E lấy một ổ bánh.", "Qua kệ, bấm nút Lấy bánh.")));
    }
    if (tourAt(w, "LO")) return this.ovenAim(ring);
    if (tourAt(w, "THOT")) return ring("board", say("THOT", hint("Gác ổ lên thớt — bấm E.", "Gác ổ lên thớt — bấm nút Kẹp bánh.")));
    if (tourAt(w, "NHAN")) {
      if (!this.assembly.isOpen) return ring("board", hint("Mở ổ ra: tới thớt bấm E.", "Mở ổ ra: tới thớt bấm nút Mở ổ."));
      const gap = this.dishGaps()[0];
      const tile = gap ? this.assembly.tileBounds(gap.id) : null;
      if (!gap || !tile) return { ...this.assembly.wrapBounds(), shape: "rect", text: "Ổ đúng đơn rồi — bấm Gói lại." };
      return { ...tile, shape: "rect", text: gapText(gap) };
    }
    if (tourAt(w, "TAY")) return ring("sink", say("TAY", hint("Rửa tay ở bồn — bấm E.", "Rửa tay ở bồn — giữ nút Rửa tay.")));
    if (tourAt(w, "DT")) {
      return { ...this.hud.phoneRect, shape: "rect", text: say("DT", hint("Có tin nhắn mới. Bấm Tab hoặc bấm biểu tượng điện thoại.", "Có tin nhắn mới. Bấm biểu tượng điện thoại.")) };
    }
    if (tourAt(w, "GOI")) {
      if (!this.assembly.isOpen) return ring("board", hint("Mở ổ ra: tới thớt bấm E.", "Mở ổ ra: tới thớt bấm nút Mở ổ."));
      return { ...this.assembly.wrapBounds(), shape: "rect", text: say("GOI", "Đủ rồi — bấm Gói lại.") };
    }
    if (tourAt(w, "GIAO")) return ring("handoff", say("GIAO", hint("Đưa ổ cho khách ở quầy gọi món — bấm E.", "Đưa ổ cho khách ở quầy gọi món — bấm nút Giao bánh.")));
    return null;
  }

  /** Độ giòn của ổ chín nhất đang nằm trong lò — `null` nếu lò trống. */
  private ovenBand(): CrustBand | null {
    if (!this.oven.count) return null;
    const best = this.oven.slots.reduce<number>((m, l) => (l ? Math.max(m, l.crust) : m), 0);
    return bandOfCrust(best, this.oven.burnAt, this.oven.singeAt);
  }

  /**
   * Còn đang đóng băng hay không. Hỏi lại ĐIỀU KIỆN chứ không tin mỗi cái cờ: bỏ qua phần dẫn,
   * qua bước khác, hay ổ sém mất rồi — bất cứ cái nào cũng phải thả băng ngay. Một cái cờ đọc
   * mù là một cái cờ có ngày kẹt, mà kẹt ở đây nghĩa là game đứng hình không lý do.
   */
  private tourHolding() {
    if (!this.tourFreeze) return false;
    const ok = this.tourOvenMoment();
    if (!ok) this.tourFreeze = false;
    return ok;
  }

  /**
   * Đúng cái khoảnh khắc đáng đứng lại: bữa đầu · bước lò · tay không · ổ vừa tới khúc vàng ·
   * VÀ NGƯỜI CHƠI ĐANG ĐỨNG NGAY LÒ.
   *
   * ⚠️ Vế cuối không phải cho đẹp, nó chống KẸT: đóng băng là tắt luôn pha `input`, nên đứng
   * xa lò mà bị đóng băng thì không đi tới lò được nữa, mà cú E thả băng ở xa lò lại không lấy
   * được ổ — thả xong frame sau đóng lại ngay. Chỉ đứng tại lò mới có nhịp dừng này, và lúc đó
   * `near` cũng không đổi được nữa (pha `input` đã tắt) nên điều kiện giữ nguyên tới khi bấm E.
   */
  private tourOvenMoment() {
    return tourAt(this.world, "LO")
      && this.player.hand === "empty"
      && this.near?.id === "oven"
      && this.ovenBand() === "CRISP";
  }

  /** Ổ vừa chạm khúc vàng ở bữa đầu → đứng lại một nhịp. Chỉ bật, việc tắt là của `tourHolding`. */
  private tickTourOven() {
    if (this.tourOvenMoment()) this.tourFreeze = true;
  }

  /** Bữa đầu: CHẶN cú E lấy ổ còn non. Người mới bỏ vô cái là bấm lấy ra liền, rồi không hiểu vì sao khách chê ổ nguội. */
  private tourBlocksTake() {
    return tourAt(this.world, "LO") && this.player.hand === "empty" && this.ovenBand() === "RAW";
  }

  /**
   * BƯỚC LÒ — dẫn theo ĐỘ GIÒN ĐANG CHẠY, không chỉ nói "bấm E".
   *
   * Người mới hay táy máy: bỏ ổ vào lò rồi bấm E lấy ra liền, ra ổ còn nguội mà không hiểu vì sao
   * khách chê. Nên ở đây người dẫn CHỜ cùng người chơi: lúc vỏ còn nhạt thì bảo đừng đụng, tới
   * lúc vòng độ giòn chuyển vàng mới bảo lấy ra. Cái vòng đó (`drawRing`) vốn đã vẽ sẵn trên lò —
   * chỗ này chỉ dạy người ta ĐỌC nó, một lần, rồi thôi.
   */
  private ovenAim(ring: (id: string, text: string) => { x: number; y: number; w: number; h: number; shape?: "circle" | "rect"; text: string } | null) {
    const h = this.player.hand;
    if (h === "loaf_burnt") return ring("bin", "Khét rồi — đem bỏ thùng rác.");
    if (h === "loaf_cold" || h === "loaf_hot") return ring("oven", hint("Tới lò, bấm E bỏ ổ vào.", "Tới lò, bấm nút Bỏ vào lò."));
    if (h !== "empty") return ring("bin", "Tay đang cầm đồ — bỏ xuống trước.");
    const band = this.ovenBand();
    if (!band) return ring("shelf", "Lò trống. Lấy ổ bánh ở kệ trước.");
    // Từ đây trở xuống KHOANH BA CÁI VÒNG, không khoanh cái lò: thứ người chơi phải học đọc
    // là ba cái vòng đó. Khoanh cái lò lần nữa thì họ nhìn cái lò và cái vòng vẫn vô hình.
    if (band === "RAW") {
      return this.crustAim("Mỗi lò để được 3 ổ bánh mì. Mỗi vòng có 3 mức độ chín (chưa chín, giòn, cháy sém).");
    }
    if (band === "CRISP") return this.crustAim(hint("Bánh mì đã giòn rồi. Bấm E lấy ra.", "Bánh mì đã giòn rồi. Bấm nút Lấy bánh ra."));
    if (band === "SINGED") return this.crustAim("Bánh mì sắp cháy sém. Lấy ra ngay.");
    return this.crustAim("Hết vòng là khét. Bỏ ổ này, lấy ổ khác.");
  }

  /**
   * Ô khoanh BA VÒNG ĐỘ GIÒN trên lò (xem `drawOven`), toạ độ khung thiết kế.
   *
   * Dính theo `labelY` của lò y hệt chỗ vẽ chúng, không gõ lại con số: dời cái lò một ô là cả
   * ba vòng đi theo, mà vòng khoanh thì đứng lại — và không có gì báo.
   */
  private crustAim(text: string) {
    const lab = this.labelY.get("oven");
    if (!lab) return null;
    const v = this.cam.world.worldView;
    const R = 11, GAP = 30, PAD = 7;
    const halfW = (GAP + R + PAD) * ZOOM, halfH = (R + PAD) * ZOOM;
    const cx = (lab.x - v.x) * ZOOM, cy = (lab.y - 24 - v.y) * ZOOM;
    return { x: cx - halfW, y: cy - halfH, w: halfW * 2, h: halfH * 2, shape: "rect" as const, text };
  }

  /** Ổ đang kẹp còn thiếu gì so với đơn của khách đứng quầy; không có khách thì theo ổ mặc định. */
  private dishGaps() {
    const spec = this.service.front?.order ?? specOf({ mon: "opla", rau: "day-du", ot: 1, tuong: 1 });
    return dishGaps(spec.levels, this.assembly.dish);
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
    if (this.oven.slots.some((l) => l && bandOfCrust(l.crust, this.oven.burnAt, this.oven.singeAt) === "BURNT")) {
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
    const s = (p.pinned ? 0.8 : 1) * markScale();
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
      // Bay quanh MẶT THỚT.
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
    g.strokeCircle(held.x + shake, held.y, 17 * markScale());
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

  /** Vòng sáng dưới chân trạm đang với tới được — người chơi không phải đoán. */
  private drawRing() {
    if (!this.near) { this.ring.setVisible(false); return; }
    const { sx, sy } = toScreen(this.near.tx + 0.5, this.near.ty + 0.5);
    // Nền sáng 0,78…0,98: vòng mờ hơn thì không thấy trên gạch men trắng.
    const pulse = this.settings.reducedMotion ? 0.1 : Math.sin(this.time.now / 260) * 0.1;
    this.ring.setVisible(true)
      .setPosition(sx, sy)
      .setDepth(depthOf(this.near.tx + 0.5, this.near.ty + 0.5) - 120)
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
      running: this.intent.run,
    });
  }

  private syncMusic() {
    const cue: CueId = this.clock.isPeak ? "cao_diem"
      : this.clock.minutes < PEAK_START_MIN ? "to_mo"
        : "lang";
    music.play(cue);
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
    this.tap?.setPaused(true);
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
      ["Cài đặt", () => this.openSettings()],
      ["Lưu và về sảnh", () => this.confirmQuit()],
      ["Dẹp hàng sớm", () => this.confirmEarlyClose()],
      ["Chơi lại ngày này", () => this.confirmReplay()],
    ], undefined, 3);
  }

  private openSettings() {
    this.overlay?.destroy(true);
    this.overlay = null;
    this.overlayBack = null;
    this.settingsDom = new MenuDom(this, () => {}, {
      page: "settings",
      onExit: () => { this.settingsDom = null; this.showPauseMenu("Tạm dừng"); },
    });
  }

  private confirmEarlyClose() {
    this.overlay?.destroy(true);
    this.overlay = this.modal("Dẹp hàng sớm?", [
      ["Thôi, bán tiếp", () => this.showPauseMenu("Tạm dừng")],
      ["Dẹp hàng", () => this.close("PLAYER")],
    ], "Ngưng bán và chốt sổ ngày hôm nay.");
    this.overlayBack = () => this.showPauseMenu("Tạm dừng");
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
      ["Bán nốt", () => this.showPauseMenu("Tạm dừng")],
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

  /** Chơi lại cả ngày là ĐƯỢC PHÉP. */
  private confirmReplay() {
    this.overlay?.destroy(true);
    this.overlay = this.modal("Chơi lại ngày này?", [
      ["Chơi lại từ sáng", () => this.day.replayDay()],
      ["Thôi, bán tiếp", () => this.showPauseMenu("Tạm dừng")],
    ], "Chơi lại ngày này sẽ đưa mọi thứ về sáng sớm. Chợ vẫn bán giá đó,\nkhách vẫn tới giờ đó — chỉ có mình là biết trước.");
    this.overlayBack = () => this.showPauseMenu("Tạm dừng");
  }

  /** Mỗi món đồ nghề phải NHÌN THẤY trên xe. Vẽ bằng code, tĩnh, một lần lúc dựng cảnh. */
  private drawEquipment() {
    const e = this.world.equipment;
    const at = (tx: number, ty: number) => { const p = toScreen(tx, ty); return { x: p.sx, y: footY(p.sy) }; };
    const depth = (tx: number, ty: number) => depthOf(tx, ty) + 5;
    // LÒ ĐIỆN KHÔNG VẼ Ở ĐÂY: nâng cấp THAY ảnh ô `O` sang `prop_e-oven` (xem `placeProps`, `art/index.ts` `textureForTile`).
    const draw = (tx: number, ty: number, fn: (x: number, y: number, gg: Phaser.GameObjects.Graphics) => void) => {
      const gg = this.add.graphics().setDepth(depth(tx, ty));
      const p = at(tx, ty);
      fn(p.x, p.y, gg);
    };
    if (has(e, "LONG_BAN")) draw(8.5, 4.3, (x, y, gg) => { gg.fillStyle(0xdfe8ec, 0.55).fillEllipse(x, y - 52, 44, 18); gg.lineStyle(1.5, 0x8a979f, 0.9).strokeEllipse(x, y - 52, 44, 18); });
    if (has(e, "DU_CHE")) this.addUmbrella();
    /*
     * BÌNH NƯỚC TRÀ không vẽ ở đây: nó là đạo cụ `T` thật trên bản đồ, và `propHidden` mở
     * ô đó ra lúc mua. Vẽ thêm một cái bình nhỏ cạnh cái thùng là hai cái bình cho một món đồ.
     * BẢNG HIỆU cũng vậy — `createSign` dựng tấm bảng thật trên vách.
     */
    if (has(e, "QUAT_DIEN")) draw(14.2, 4.3, (x, y, gg) => {
      gg.fillStyle(0x6a7076, 1).fillRect(x - 1.5, y - 46, 3, 46);        // chân đứng
      gg.fillStyle(0x30353a, 1).fillEllipse(x, y, 16, 5);                // đế
      gg.fillStyle(0xd7dde1, 0.9).fillCircle(x, y - 52, 11);             // lồng quạt
      gg.lineStyle(1, 0x7c858c, 1).strokeCircle(x, y - 52, 11);
      gg.fillStyle(0x9aa3a9, 1).fillCircle(x, y - 52, 3);
    });
    if (has(e, "BANG_QR")) draw(12.2, 4.2, (x, y, gg) => { gg.fillStyle(0xf8f8f4, 1).fillRect(x - 7, y - 62, 14, 16); gg.fillStyle(0x222222, 1).fillRect(x - 5, y - 60, 4, 4).fillRect(x + 1, y - 60, 4, 4).fillRect(x - 5, y - 54, 4, 4).fillRect(x + 1, y - 52, 2, 2); });
    if (has(e, "LOA_RAO")) draw(10.2, 0.6, (x, y, gg) => { gg.fillStyle(0x3a3f45, 1).fillTriangle(x - 8, y - 86, x + 8, y - 80, x + 8, y - 92).fillRect(x - 12, y - 90, 5, 8); });
    /* Vẽ đúng `SEAT_SPOT`, chỗ người ta ngồi. */
    if (has(e, "GHE_BAN")) draw(SEAT_SPOT.x, SEAT_SPOT.y, (x, y, gg) => {
      gg.fillStyle(0x2f6fb3, 1).fillRect(x - 10, y - 12, 20, 4).fillRect(x - 9, y - 8, 3, 8).fillRect(x + 6, y - 8, 3, 8);
    });
    if (has(e, "GIA_TREO")) draw(8.5, 4.0, (x, y, gg) => { gg.lineStyle(2, 0x8a7a60, 1).lineBetween(x - 60, y - 86, x + 60, y - 86); });
    if (has(e, "KEP_GAP")) draw(3.8, 4.5, (x, y, gg) => { gg.lineStyle(1.5, 0xbfc7cc, 1).lineBetween(x - 5, y - 49, x + 6, y - 46).lineBetween(x - 5, y - 47, x + 6, y - 46); });
    this.addStorage(has(e, "TU_MAT"));
  }

  /**
   * CÁI DÙ CHE — ảnh thật (`PROP.umbrella`).
   *
   * ⚠️ PHẢI ĐỨNG ĐÚNG CHỖ MÁT: lấy thẳng `SHADE_SPOT` từ `world/map`, đừng gõ toạ độ riêng.
   */
  private addUmbrella() {
    /*
     * LÙI RA SAU chỗ đứng mát, đúng `UMBRELLA_BACK` ô trên CẢ HAI trục — tức lùi thẳng theo
     * hướng xa camera, nên trên màn hình nó chỉ đi LÊN chứ không trôi ngang: tán dù vẫn nằm
     * chính giữa đầu người đứng, mà cây cột với cái đế đá thì ra sau lưng họ (không thì người đứng LÚN trong đế dù).
     */
    const tx = SHADE_SPOT.x - UMBRELLA_BACK, ty = SHADE_SPOT.y - UMBRELLA_BACK;
    this.addPhotoProp(PROP.umbrella, tx, ty, (x, y, gg) => {
      gg.lineStyle(2, 0x6b5a4a, 1).lineBetween(x, y, x, y - 92);
      gg.fillStyle(0xc0443a, 0.92).fillTriangle(x - 46, y - 88, x + 46, y - 88, x, y - 110);
    });
  }

  /** Ô `F` luôn chặn: thùng xốp lúc đầu, mua tủ mát thì thay bằng tủ. */
  private addStorage(fridge: boolean) {
    this.addPhotoProp(fridge ? PROP.fridge : PROP.cooler, 3.5, 2.4, (x, y, gg) => {
      const h = fridge ? 40 : 20;
      gg.fillStyle(0xe8eef1, 1).fillRoundedRect(x - 12, y - h, 24, h, 3);
      gg.lineStyle(1, 0x9aa6ae, 1).strokeRoundedRect(x - 12, y - h, 24, h, 3);
    });
    const { sx, sy } = toScreen(3.5, 2.4);
    const h = fridge ? 40 : 29;
    this.tourSpot.set("kho", { x: sx, y: footY(sy) - h / 2, r: h / 2 + 12 });
  }

  /**
   * Một món đồ nghề dựng bằng ẢNH THẬT, ở toạ độ thế giới có phần lẻ (đồ nghề không nằm trên lưới
   * ô như đạo cụ của `placeProps`).
   *
   * `veDuPhong` là bản vẽ code dự phòng, chỉ chạy khi ảnh chưa về hay tải hỏng — để trống thì mất
   * món người chơi vừa trả tiền. Cùng lý do mà `placeProps` cho lò điện lùi về lò than.
   */
  private addPhotoProp(
    key: string, wx: number, wy: number,
    veDuPhong: (x: number, y: number, gg: Phaser.GameObjects.Graphics) => void,
  ) {
    const { sx, sy } = toScreen(wx, wy);
    const y = footY(sy);
    const depth = depthOf(wx, wy);
    if (this.textures.exists(key)) {
      this.sheen.register(this.light.add(this.add.image(sx, y, key).setOrigin(0.5, 1).setScale(1 / artScale(key)).setDepth(depth)), key);
      return;
    }
    veDuPhong(sx, y, this.add.graphics().setDepth(depth));
  }

  /**
   * Đứng trong tầm với của tấm bảng treo vách chưa — và KHÔNG trạm nào đang tranh.
   *
   * `!this.near` không phải thừa. Bán kính đọc bảng (1,8 ô) và bán kính với tới trạm
   * (1,6 ô) chồng lên nhau ở khúc giữa bảng và cái bồn rửa, nên đứng trong khúc đó mà xét
   * bảng trước là cú E định rửa tay lại mở ra tấm bảng. Luật rõ ràng: CÓ TRẠM THÌ TRẠM
   * THẮNG. `assertMenuSpotFree()` bảo đảm chỗ ngay dưới bảng không trạm nào với tới, nên
   * lúc nào cũng còn một chỗ đứng đọc được.
   */
  private nearMenuBoard() {
    if (this.near) return false;
    return Math.hypot(this.player.x - MENU_SPOT.x, this.player.y - MENU_SPOT.y) <= MENU_REACH;
  }

  /**
   * E ở bảng menu — ĐỨNG ĐỌC. Pause hoàn toàn (CANON §15.2 mục 2: pause
   * đóng băng cả sự kiên nhẫn của khách).
   *
   * Đọc bảng không tốn thời gian trong game, nhưng tốn ĐƯỜNG ĐI: bảng treo tuốt khúc
   * phải của vách, nên giữa giờ cao điểm chạy qua đó là bỏ quầy một quãng thật. Đó là
   * cái giá đúng — phạt bằng đồng hồ thì thành phạt người chơi vì chưa thuộc bài, mà
   * cái bảng sinh ra chính là để họ thuộc bài.
   */
  private openMenuBoard() {
    if (this.overlay || this.closed || this.menuBoard?.open || this.storageView?.open) return;
    this.freezeForView();
    this.quest("MENU");
    this.menuBoard = new MenuBoardView(this.game, {
      textScale: this.settings.textScale,
      day: this.world.progress.dayIndex,
      prices: this.world.menu.price,
      shopName: this.world.shopName,
      onClose: () => { this.menuBoard = null; this.resume(); },
    });
  }

  private freezeForView() {
    if (this.assembly.isOpen) this.assembly.park();
    this.paused = true;
    this.clock.paused = true;
    this.wipePuff.setPaused(true);
    this.tap?.setPaused(true);
    this.rain?.setPaused(true);
    this.busy = null;
    this.intents = [];
    this.tweens.pauseAll();
    bus.emit("ui:pauseToggled", { paused: true, source: "PLAYER" });
  }

  private storageName() {
    return EQUIP[has(this.world.equipment, "TU_MAT") ? "TU_MAT" : "THUNG_XOP"].name;
  }

  private openStorage() {
    if (this.overlay || this.closed || this.menuBoard?.open || this.storageView?.open || this.phoneView?.open) return;
    this.freezeForView();
    this.storageView = new StorageView(this.game, {
      textScale: this.settings.textScale,
      day: this.world.progress.dayIndex,
      inventory: this.world.inventory,
      title: this.storageName(),
      fridge: has(this.world.equipment, "TU_MAT"),
      onClose: () => {
        this.storageView = null;
        this.resume();
        if (stockOf(this.world.inventory, "BANH", this.world.progress.dayIndex) > 0) this.quest("KHO", true);
      },
    });
  }

  /** Đầu ngày: Hệ thống thức tỉnh (ngày 1) hoặc vòng quay điểm danh tự bật; tin rao bán báo qua HUD. */
  private autoPhone() {
    if (this.closed || this.paused) return;
    const w = this.world;
    for (const n of w.resell.news.splice(0)) this.hud.toast(n, "good", this.popClock);
    if (w.progress.dayIndex > 1) {
      for (const it of openedOn(w.progress.dayIndex)) this.hud.toast(`Món mới: ${it.name}. ${hint("Nhấn E ở bảng menu để chọn giá.", "Bấm nút Đọc bảng ở bảng menu để chọn giá.")}`, "good", this.popClock);
    }
    if ((w.system.stage === "new" && w.progress.dayIndex === 1) || canSpin(w)) this.openPhone({ app: "sys" });
  }

  /** `exact`: chỉ tính khi đang đúng bước đó, không nhảy cóc. */
  private quest(step: TourStep, exact = false) {
    const w = this.world;
    if (exact && !tourAt(w, step)) return;
    const n = tourDone(w, step);
    if (!n) return;
    if (linked(w)) {
      for (let i = 0; i < n; i++) questDone(w);
      this.hud.toast(QUEST_DONE, "good", this.popClock, { title: "Hệ thống" });
      if (tourStep(w) === "XONG") finishRookie(w, ROOKIE_DONE);
    }
  }

  private phoneHost() {
    return {
      minutes: () => this.clock.minutes,
      beforeOpen: () => this.clock.band === "PRE_OPEN",
      onOrdered: () => this.quest("CHO", true),
      onSave: () => this.ctx.save.request("EVENT"),
    };
  }

  private openPhone(route?: { app: "sys" }) {
    if (this.overlay || this.closed || this.menuBoard?.open || this.storageView?.open || this.phoneView?.open) return;
    if (this.assembly.isOpen) this.assembly.park();
    this.paused = true;
    this.clock.paused = true;
    this.wipePuff.setPaused(true);
    this.tap?.setPaused(true);
    this.rain?.setPaused(true);
    this.busy = null;
    this.intents = [];
    this.tweens.pauseAll();
    bus.emit("ui:pauseToggled", { paused: true, source: "PLAYER" });
    const rookieEnd = tourStep(this.world) === "DT" && linked(this.world);
    this.quest("DT", true);
    this.phoneView = new PhoneView(this.game, this.world, {
      textScale: this.settings.textScale,
      host: this.phoneHost(),
      route: route ?? (rookieEnd ? { app: "sys" } : undefined),
      onClose: () => {
        this.phoneView = null;
        if (tourOrdered(this.world)) this.quest("CHO", true);
        this.hud.setUnread(totalUnread(this.world.phone) + unseen(this.world));
        if (!this.closed) this.resume();
      },
    });
  }

  private resume() {
    this.overlay?.destroy(true);
    this.overlay = null;
    this.overlayBack = null;
    // Lớp che nuốt keyup nên phím đang giữ vẫn `isDown` sau khi đóng — nhân vật tự đi.
    this.input.keyboard?.resetKeys();
    this.paused = false;
    this.clock.paused = false;
    this.wipePuff.setPaused(false);
    this.tap?.setPaused(false);
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

  /** `gapAt`: chỉ số nút bắt đầu nhóm riêng, cách xa nhóm trước. */
  private modal(title: string, actions: [string, () => void][], sub?: string, gapAt = -1) {
    const c = this.add.container(0, 0).setDepth(9_500_000).setScrollFactor(0);
    const sz = textScale();
    const step = platedButtonHeight() + 16;
    const pad = 24;
    const ttl = label(this, GAME_W / 2, 0, title, 22, "#f7f1e2", "700");
    const note = sub ? label(this, GAME_W / 2, 0, sub, 13, "#d8cfba", "400").setWordWrapWidth(420).setOrigin(0.5, 0) : null;
    const noteTop = pad + ttl.height + 10;
    const btnTop = note ? noteTop + note.height + 20 : pad + ttl.height + 20;
    const gap = gapAt >= 0 ? step * 0.6 : 0;
    const h = Math.min(GAME_H - 16, btnTop + actions.length * step - 16 + gap + pad + 6 * sz);
    const top = GAME_H / 2 - h / 2;
    ttl.setY(top + pad + ttl.height / 2);
    note?.setY(top + noteTop);
    c.add(this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x0d1216, 0.55));
    c.add(tray(this, GAME_W / 2, GAME_H / 2, 470, h, 22, 0.78));
    c.add(note ? [ttl, note] : [ttl]);
    actions.forEach(([text, fn], i) =>
      // scrollFactor(0) cho TỪNG nút: camera quán đang cuộn, nút không đặt thì vùng bấm
      // lệch khỏi chỗ vẽ đúng bằng độ cuộn — bấm vào nút mà không ăn.
      c.add(platedKit.button(this, GAME_W / 2, top + btnTop + platedButtonHeight() / 2 + i * step + (gapAt >= 0 && i >= gapAt ? gap : 0), text, fn, { width: 280, primary: i === 0 }).setScrollFactor(0)));
    return c;
  }
}

/** Khoảng cách giữa các frame (ms) — telemetry đọc để ra fps p5 / frame ms p95. */
const frameDeltas: number[] = [];
telemetry.frameSampler = () => ({ frameDeltas: frameDeltas.splice(0) });
