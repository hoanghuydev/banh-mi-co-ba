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

/** Lớp nhãn trạm: trên mọi đạo cụ, dưới HUD. */
const LABEL_DEPTH = 8_000_000;

/** Trần số ruồi cùng lúc (độ bẩn 0,70 — xem `drawDirt`), cũng là cỡ hồ sprite. */
const FLY_MAX = 5;
/** Ruồi chúi đầu lên/xuống tối đa chừng này rad (~34°) — xem `drawFlies`. */
const FLY_TILT = 0.6;
/** Bẩn QUÁ mức này mới có ruồi. Lau thớt một lần là tụt về đúng mốc này. */
const FLY_DIRT_MIN = 0.35;
/**
 * Rổ bánh nóng chứa được mấy ổ — bằng số ngăn lò (`OVEN_SLOTS` = 3) chứ không hơn: cái rổ đỡ
 * đúng một mẻ lò vừa ra, không phải để biến thành kho bánh.
 */
const BASKET_SLOTS = 3;
/**
 * Hai ổ để cạnh nhau cách nhau chừng này px, ĐO DỌC THEO MẶT QUẦY. Lệch theo CẢ HAI trục chứ
 * không chỉ ngang (quầy chạy chéo trên màn hình); tỉ lệ 2:1 là đúng độ dốc của lưới iso — xem
 * `world/iso`.
 */
const BASKET_STEP = 13;
/**
 * "TÊN NGƯỜI: " ở đầu dòng — dấu hiệu đây là LỜI NGƯỜI (xem `routeLine`). Trần 24 ký tự cho
 * phần tên: tên dài nhất trong game là "Cô Mai (chạy qua)" (17).
 */
const SPEAKER_PREFIX = /^[^:\n]{1,24}: \S/;
/**
 * Sàn chứa được mấy món. Ba: đủ để gỡ mọi thế kẹt tay (ổ nóng + ly trà + một ổ nữa),
 * chưa đủ để thành chỗ trữ hàng thay cho rổ bánh nóng.
 */
const FLOOR_MAX = 3;
/** Với tới món dưới sàn trong bán kính này (ô). Hẹp hơn tầm với trạm để khỏi tranh nhau. */
const FLOOR_REACH = 1.1;
/**
 * Mỗi món để quên dưới sàn làm bẩn quán chừng này mỗi giây. 0,004/s: một mình nó mất 87 giây
 * mới đủ bẩn để gọi một con ruồi tới (`FLY_DIRT_MIN` 0,35 tính từ mức sạch đầu ngày).
 */
const FLOOR_DIRT_RATE = 0.004;
/** Giây đặt xuống / nhặt lên. Nhanh — đây là động tác cúi người, không phải một công đoạn. */
const FLOOR_SEC = 0.35;
/** Giây bỏ đồ vô thùng rác. Cũng nhanh: ném một cái là xong, không có gì để canh. */
const BIN_SEC = 0.4;
/** Giây khoá tay lúc nhận tiền của khách — xem chỗ gọi trong `handOver`. */
const TAKE_MONEY_SEC = 0.8;
/** Bán kính khung tròn của dấu "việc cần làm". */
const CHORE_R = 11;
/** Dấu bị ghim ở mép thì cách mép thật chừng này px — không dính sát viền. */
const CHORE_EDGE = 8;
/**
 * Mép TRÊN của vùng được phép vẽ dấu: hàng icon ở đỉnh màn hình kết thúc ở y = 44, cộng bán kính
 * dấu 11 và một khe 3 px. ⚠️ KHÔNG mượn `HUD_BAND_PX` (74) — con số đó tính cho mấy CON SỐ TIỀN
 * bay lên, mà cái lò thì nằm ngay hàng trên cùng bản đồ.
 */
const CHORE_TOP = 58;
/** Dấu "việc cần làm" nhô cao hơn điểm neo của trạm chừng này px — xem `drawChores`. */
const CHORE_LIFT = 26;
/** Một lượt lau trừ ít nhất chừng này độ bẩn — xem `wipeBoard`. */
const WIPE_DIRT = 0.15;
/**
 * Lau xong thì quầy sạch ÍT NHẤT tới mức này, tức bẩn 0,30 — dưới `FLY_DIRT_MIN` một khoảng
 * thấy được. Viết thẳng con số thay vì suy ra `1 − FLY_DIRT_MIN`: `1 − 0,35` quay về qua `dirt`
 * thành 0,35000000000000003, nhỉnh hơn ngưỡng đúng một hạt bụi dấu phẩy động.
 */
const WIPED_CLEAN = 0.7;


/** Đỉnh đầu nhân vật tính từ điểm chạm đất — cùng con số `zonePoint` dùng cho vùng TAY. */
const HEAD_PX = 52;

/**
 * Người ta nghĩ bao lâu trước khi đáp — tách bong bóng của mình và của họ ra khỏi nhau, và cho
 * ba chấm "đang trả lời" một chỗ để sống.
 *
 * ⚠️ `PLAYER_SAY_TAIL` ngay dưới đo từ cái mốc này, nên nới chỗ này là nới cả quãng bong bóng
 * của cô Ba nán lại.
 */
const REPLY_DELAY_SEC = 1.2;
/**
 * Bong bóng của CÔ BA nán thêm bao lâu sau khi người kia bắt đầu đáp. Ngắn hơn hẳn bong bóng của
 * khách là CỐ Ý — câu của mình là câu mình vừa tự bấm ra. 0,35 s đủ cho cú tắt dần 260 ms của
 * `BubblePool` chạy trọn vẹn, nên nó TAN đúng lúc câu đáp nổi lên.
 */
const PLAYER_SAY_TAIL = 0.35;
/** Chiều cao dải HUD trên cùng (hộp ngày/giờ, nút trà, nút tạm dừng) ở cỡ chữ 100%. */
const HUD_BAND_PX = 74;

/**
 * Sự kiện tiêu cực làm NHẠC DỪNG: trong một game mà im lặng là một trong các phản ứng, nhạc
 * chạy đè lên là nuốt mất khoảnh khắc đó. Dừng đúng lúc một khách chạm `CONFIRMED`, không phải
 * lúc kích thích phát ra.
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
 * Quán bánh mì ở góc hẻm — scene này chỉ ĐIỀU PHỐI. Vẽ cảnh `art/` · nhân vật `entities/Player`
 * · thông tin `ui/Hud` · luật trạm `world/stations` · bản đồ `world/map`.
 *
 * ⚠️ KHÔNG dùng Container để gom cảnh: Container của Phaser không depth-sort con nên mọi
 * `setDepth` mất tác dụng. Mọi thứ nằm thẳng trên display list, camera lo phần canh khung.
 */
export class StallScene extends Phaser.Scene {
  private ctx!: GameContext;
  private cam!: StallCamera;
  private day!: DayScene;
  private settings!: Settings;
  /** Đồng hồ của cả ngày — sống trong ctx, scene chỉ mượn (P0-01 §2.3). */
  private clock!: Clock;

  private player!: Player;
  private hud!: Hud;
  private ring!: Phaser.GameObjects.Image;
  private bubbles!: BubblePool;
  private audio!: StallAudio;
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
   * Ổ bánh đang GÁC trên thớt và phần nhân đã kẹp dở; `null` = thớt trống. Gác được thì người
   * chơi không bị nhốt trong bảng: đi rót trà, canh lò, rồi quay lại kẹp tiếp.
   */
  private boardLoaf: Ingredient[] | null = null;
  /**
   * MỖI Ổ MANG THÔNG SỐ CỦA CHÍNH NÓ — ba số đi thành một bộ qua mọi chặng (kệ → lò → tay → thớt
   * → khách): `warmth` (1 = vừa ra lò, tụt dần) · `crust` (độ giòn lúc rút khỏi lò, `serveDish`
   * đọc để biết ổ non hay tới) · `q` (chất lượng lô bánh lấy ở kệ).
   */
  private handWarmth = 0;
  private boardWarmth = 0;
  private handSteam!: Steam;
  private boardSteam!: Steam;
  /** Bụi bốc lên lúc lau thớt — phản hồi ngay tại mặt thớt, chỗ mắt đang nhìn. */
  private wipePuff!: WipePuff;
  /** Trời mưa: vệt mưa + nước bắn + lớp phủ đổi sáng. `null` những ngày không mưa. */
  private rain: Rain | null = null;
  /** Hai cây đèn tường — treo mọi ngày, chỉ SÁNG những ngày cần (hiện là ngày mưa). */
  private light!: ShopLight;
  /**
   * Đồ đang NẰM DƯỚI SÀN (phím Q). Không phải thùng rác — đây là chỗ đặt tạm để rảnh tay, nhặt
   * lên lúc nào cũng được, món đồ giữ nguyên mọi thông số của nó. Có trần `FLOOR_MAX`.
   */
  private floor: { x: number; y: number; hand: Hand; warmth: number; crust: number; q: number; dish: Ingredient[] }[] = [];
  /**
   * Món đang cầm ĐÃ TỪNG CHẠM ĐẤT. Cờ này đi theo ổ bánh qua mọi chặng (tay → thớt → tay →
   * khách) đúng như `handCrust`, và KHÔNG có đường nào tẩy được nó ngoài việc bỏ ổ đó đi.
   */
  private handSoiled = false;
  private boardSoiled = false;
  private floorImgs: Phaser.GameObjects.Image[] = [];
  /** Ổ đang gác trên thớt, vẽ thật trong thế giới — khói tắt khi nguội, ổ thì không. */
  private boardLoafImg!: Phaser.GameObjects.Image;
  /** Hồ sprite ruồi bu thớt (P1-02 §2.10). Scene dựng lại mỗi ngày nên phải reset. */
  private flies: Phaser.GameObjects.Image[] = [];
  /** Y của MẶT TRÊN thớt — chỗ ổ bánh gác nằm lên. Đặt trong `addBoard`. */
  private boardTopY = 0;
  /** Thân người xoay che tay khi giữ C — occluder phải NHÌN THẤY (CANON §5). */
  private coverGfx!: Phaser.GameObjects.Graphics;
  private handCrust = 0;
  private boardCrust = 0;
  private boardQ = 1;
  /** Lò 3 slot chạy nền — bỏ ổ vào rồi đi làm việc khác được. */
  private oven = new Oven();
  private ovenGfx!: Phaser.GameObjects.Graphics;
  private choreGfx!: Phaser.GameObjects.Graphics;
  /** Toạ độ nhãn tên trạm — để vẽ chỉ báo NGAY TRÊN nhãn, không bị nhãn che. */
  /**
   * Ổ đã nướng đang gác ở rổ bánh nóng (trạm `basket`). Mỗi ổ mang nguyên bộ thông số
   * của nó — ấm, giòn, lô hàng — y như ổ trên thớt và ổ trên tay.
   */
  private basket: {
    hand: Hand; warmth: number; crust: number; q: number; soiled: boolean;
    dish: Ingredient[]; dishQ: number; readyAt: number;
  }[] = [];
  private basketImgs: Phaser.GameObjects.Image[] = [];
  /** Mặt quầy ở chỗ để bánh, để xếp ổ nằm đúng trên đó. */
  private basketTopY = 0;
  private basketX = 0;
  /** Depth theo đúng ô của nó — ổ bánh phải nằm SAU tủ kính đứng trước mặt. */
  private basketDepth = 0;
  private boardDepth = 0;
  private labelY = new Map<string, { x: number; y: number }>();
  /**
   * Mốc neo của DẤU VIỆC CẦN LÀM — ĐỈNH CỦA CHÍNH CÁI VẬT, không phải đỉnh ô chứa nó.
   *
   * ⚠️ Tách khỏi `labelY` (đỉnh SPRITE của ô, cả khối quầy cao 92 px kể cả nóc tủ kính): cái thớt
   * nằm trên MẶT quầy, thấp hơn 38 px. Chỉ mấy thứ GÁC TRÊN QUẦY mới phải ghi riêng.
   */
  private choreAt = new Map<string, { x: number; y: number }>();
  /** Nhãn trạm + chỗ "nhà" của nó — xem `drawLabels`. */
  /** Độ chắc tay với món đang cầm (P1-01 §2.7). */
  private grip = new Grip();
  private gripGfx!: Phaser.GameObjects.Graphics;
  /**
   * Tay bận tới giây này — đi được, làm không được. Bốn field đi CÙNG NHAU, luôn đặt qua
   * `beBusy()`: `handsBusyUntil` · `handsBusyFrom` (vẽ thanh) · `handsBusyWhat` (nói đúng tên
   * việc) · `handsBusyBar`.
   *
   * `handsBusyWhat` là bắt buộc: thiếu nó thì lau thớt xong bấm E lần nữa ra câu "tay đang bận"
   * trong lúc tay rõ ràng đang trống.
   */
  private handsBusyUntil = 0;
  private handsBusyFrom = 0;
  private handsBusyWhat = "";
  private handsBusyBar = true;
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
  /**
   * Dải trò chuyện đang mở ⇒ đồng hồ chạy ở `TIME_SCALE_BASE` chứ KHÔNG đóng băng
   * (P2-06 §2.2). Scene báo xuống `clock.busy` mỗi frame, cùng chỗ với `service.busy`.
   */
  private talkRing!: Phaser.GameObjects.Graphics;
  private pendingDots!: Phaser.GameObjects.Graphics;
  private talkHoldsClock = false;
  /**
   * Bấm phím nói chuyện lúc tay đang bận — giữ cú bấm lại, mở ngay khi tay rảnh.
   * Cùng lối với `debtQueued` của phím G. `-1` = không có gì đang chờ.
   */
  private talkQueued = -1;
  /** Đếm lượt đối đáp — để một `delayedCall` của nhịp cũ không vẽ đè lên nhịp mới. */
  private talkTurn = 0;
  /** Câu cô Ba đang nói, và lúc nó tắt. */
  private playerSay: { text: string; until: number } | null = null;
  /** P5-03 — số tiền bay lên trên đầu mỗi lần két đổi. */
  private moneyPops!: MoneyPops;
  /** Đồng hồ riêng của hiệu ứng tiền: cộng dồn, và CHỈ chạy khi không pause. */
  private popClock = 0;
  private popLastNow = 0;
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
    // ⚖️ `burnAt` lò gas 1,25 → 1,70, đi kèm `CRUST.BURNT` 1,00 → 1,30 (xem `sim/oven.ts`):
    // `rateMul` 1,35 bóp mọi cửa sổ lại 1/1,35, nên ngưỡng cháy phải nới theo mới giữ được lời
    // hứa "cửa sổ trước khi cháy RỘNG HƠN" — READY→BURNT 12,7 s (gas) so với 11,7 s (than).
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
    // Reload giữa buổi: đồng hồ đã được DayScene đặt về đúng giờ đã lưu.
    this.resumed = !!data.resume;
    // Phaser dùng lại instance scene, nên field initializer KHÔNG chạy lại giữa hai ngày.
    // Quên reset là nghi thức đốt vía chỉ mời được đúng một lần cả mùa.
    this.ritualOffered = false;
    /*
     * HAI CỜ CỦA HỆ TRÒ CHUYỆN phải reset ở đây — Phaser KHÔNG chạy lại field initializer giữa
     * hai ngày.
     *
     * ⚠️ Quên `talkHoldsClock`: hết ngày lúc thẻ còn mở ⇒ hôm sau `clock.busy` true mọi frame ⇒
     * đồng hồ không bao giờ tua nhanh nữa. Quên `talkQueued`: `elapsed - talkQueued` thành ÂM ⇒
     * thẻ trò chuyện tự bật ra lúc vừa mở hàng.
     */
    this.talkHoldsClock = false;
    this.talkQueued = -1;
    this.talkTurn = 0;
    this.playerSay = null;
    if (!this.resumed) this.clock.reset();
    this.clock.paused = false;
    // CANON §15.2 / P0-02 §2.2: đồng hồ VẪN trôi, chỉ chậm một nửa.
    this.clock.scaleMul = this.settings.noTimePressure ? 0.5 : 1;
  }

  private get world() { return this.ctx.world; }

  /** Hôm nay có mưa không — nền nướng, màu trời và lớp mưa đều hỏi đúng chỗ này. */
  private get raining() { return isRain(this.world.progress.weather); }

  /** Vào thẳng scene này (dev, test) mà chưa qua BootScene thì tự tải lấy ảnh. */
  preload() {
    preloadArt(this);
    // Mẩu một phát phải có SẴN lúc bấm phím đầu tiên; nền dài thì `sfx.loop` nạp lười.
    StallAudio.preload(this);
  }

  create() {
    // Vỡ ngay nếu ai đó vừa sửa bản đồ mà chặn mất cổng khách hay chỗ xếp hàng.
    if (import.meta.env.DEV) assertWalkable();

    buildTextures(this);

    const ground = this.bakeGround();
    // Dọn TRƯỚC `placeProps` — chính nó gọi `addStationLabel` để nạp lại. Object của
    // ngày hôm qua đã bị Phaser huỷ cùng scene, còn hai cái này là mảng/map của mình.
    this.labelY.clear();
    this.choreAt.clear();
    this.basketImgs = [];                              // sprite ngày hôm qua đã bị huỷ cùng scene
    this.floorImgs = [];
    this.cam = new StallCamera(this, this.sceneBounds(ground, this.placeProps()));
    /*
     * Nền trời. Ngày mưa phải đổi ở ĐÂY chứ không chỉ ở lớp phủ: `backgroundColor` là thứ duy
     * nhất vẽ ra ngoài hình bao của cảnh, còn lớp phủ chỉ phủ đúng `worldView`.
     */
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
    // Trên bong bóng thoại một nấc: con số chỉ sống hơn một giây, không đáng để nó bị
    // một cái bong bóng che mất đúng lúc người chơi liếc lên.
    this.moneyPops = new MoneyPops(this, this.settings.textScale, LABEL_DEPTH + 6);
    this.handSteam = new Steam(this);
    this.boardSteam = new Steam(this);
    this.wipePuff = new WipePuff(this);
    // Ổ gác trên thớt phải THẤY được. Trước đây chỉ có khói, mà khói tắt hẳn khi ổ nguội
    // — đúng lúc người chơi quên ổ lâu nhất thì trên thớt lại chẳng còn gì để nhắc.
    this.flies = [];                                   // sprite ngày hôm qua đã bị huỷ cùng scene
    // origin (0,5 · 1): `y` là MÉP DƯỚI texture, để `heldFootPad` đặt đáy thật của ổ
    // chạm đúng mặt thớt. Depth lấy theo ô của cái thớt (`addBoard`), không phải một
    // con số cố định — ổ bánh phải nằm SAU khúc tủ kính đứng trước mặt nó.
    this.boardLoafImg = fitPhoto(this.add.image(0, 0, HELD.key("loaf_hot")))
      .setOrigin(0.5, 1).setVisible(false);
    this.coverGfx = this.add.graphics();
    this.ovenGfx = this.add.graphics().setDepth(LABEL_DEPTH + 2);
    // Trên cả nhãn trạm lẫn vòng độ giòn: dấu "việc cần làm" mà bị che thì vô nghĩa.
    this.choreGfx = this.add.graphics().setDepth(LABEL_DEPTH + 4);
    this.gripGfx = this.add.graphics();
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
      todayCounters: w.progress.today,
      // Cỡ chữ lớn và chế độ không giới hạn giờ đều là lời khai rằng người chơi cần
      // thêm thời gian — bong bóng phải nghe theo, không chỉ cái đồng hồ (CANON §15).
      readMul: (this.settings.textScale > 1 ? 1.25 : 1) * (this.settings.noTimePressure ? 1.5 : 1),
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

    /*
     * Lớp âm thanh của quán. Dựng SAU `service` vì nó hỏi `service` chỗ từng khách đứng để pan
     * tiếng về đúng phía, và dùng chung dòng `ambient` của scene chứ không tự đẻ thêm nguồn.
     */
    const ambientRng = this.ctx.rng.stream("ambient");
    this.audio = new StallAudio({
      scene: this,
      panOf: (npcId) => this.panOf(npcId),
      rand: () => ambientRng.next(),
    });

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
        // `slice` chứ không dùng thẳng mảng của save: scene sẽ đẩy/rút trên nó cả buổi.
        this.basket = (st.basket ?? []).slice(0, BASKET_SLOTS).map((l) => ({
          ...l,
          // Save cũ chỉ chứa ổ trơn nên không có `hand`: đọc ra là ổ bánh nóng.
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
        this.basket = [];                              // ngày mới: rổ trống, sàn sạch
        this.floor = [];
      }
      st.board = null; st.hand = null; st.basket = null; st.floor = null;
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
      st.basket = this.basket.length ? this.basket.map((l) => ({ ...l })) : null;
      st.floor = this.floor.length ? this.floor.map((f) => ({ ...f, dish: [...f.dish] })) : null;
      st.handSoiled = this.handSoiled;
      st.boardSoiled = this.boardSoiled;
      // Rời quầy giữa lúc pause ("Lưu và về sảnh", "Chơi lại ngày này"): nhạc đang bị hạ
      // −12 dB phải trả về, và phải báo hết pause cho telemetry.
      if (this.paused && !this.closed) {
        music.duck(false);
        bus.emit("ui:pauseToggled", { paused: false, source: "MENU" });
      }
      // Ambience của quán KHÔNG được theo vào sảnh hay cảnh tối — mỗi cảnh một bộ nền.
      this.audio?.destroy();
      // Bảng trò chuyện gắn listener lên `window` (capture) — không gỡ là phím Esc của
      // màn sau vẫn chạy vào cái bảng đã chết.
      this.wipePuff.destroy();
      this.rain?.destroy();
      this.rain = null;
      this.light.destroy();
      this.talk.destroy();
      // Camera UI nghe ADDED_TO_SCENE/PRE_RENDER của scene — không gỡ thì mỗi ngày
      // thêm một bộ listener, và listener cũ vẫn gọi vào camera đã bị resetAll() ném đi.
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
      // SOILED_FOOD cũng là MẤT một người khách thật — họ tới, đứng chờ, rồi về tay
      // không vì ổ bánh mình đưa. BALKED thì không: hàng dài là hệ quả của bán được,
      // đếm nó vào đây là ngày đắt hàng nhất lại hiện con số xấu nhất.
      if (p.reason === "IMPATIENT" || p.reason === "SOILED_FOOD") this.world.progress.today.lost++;
    });
    /*
     * Tiền vào/ra bay lên trên đầu. Nghe `money:changed` chứ không gắn vào từng chỗ trả tiền:
     * mọi đường tiền của buổi bán đã đi qua đúng event này, nên thêm một đường tiền mới mai
     * mốt là nó tự có số bay.
     */
    this.listen("money:changed", (p) => {
      if (this.closed) return;
      const { sx, sy } = toScreen(this.player.x, this.player.y);
      // Mép trên: dải HUD (hộp ngày/giờ + mấy cái nút) tính theo scroll hiện tại của camera.
      const ceil = this.cameras.main.scrollY + HUD_BAND_PX * textScale();
      this.moneyPops.pop(p.delta, sx, footY(sy) - HEAD_PX, this.popClock, ceil);
    });
    this.listen("save:written", () => this.hud.flashSaved());

    /*
     * "Việc mình vừa làm có ăn thua gì không?" — quan hệ hoàn toàn ẩn thì người chơi không bao
     * giờ thấy nhân với quả cạnh nhau. T3 KHÔNG bị phá: không con số, không tổng, không thanh —
     * chỉ một dòng chữ nói HƯỚNG và cái VIỆC vừa làm ra nó, rồi tắt.
     */
    this.listen("relationship:moved", (p) => {
      if (this.closed) return;
      const who = NPCS.find((n) => n.id === p.npcId)?.name ?? "khách";
      const verb = p.dir === "UP"
        ? (p.strength === "RO" ? "quý hẳn lên" : "vui hơn một chút")
        : (p.strength === "RO" ? "phật ý" : "hơi kém vui");
      this.hud.toast(`${who} ${verb} — ${p.note}`, p.dir === "UP" ? "good" : "bad", this.popClock);
    });

    /*
     * Lời đồn phải ĐẬP VÀO MẶT ít nhất một lần: ba đường có sẵn đều rất kín, nên người chơi bị
     * tin đồn làm cho ế mà không biết là có tin đồn.
     *
     * KHÔNG phải cái badge "tin đồn mới!" mà `GossipCorner` cấm: không mọc ở góc hẻm, không bắt
     * đi xem, không đếm.
     */
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
      // Tier 0 là nghe thấy tiếng mà không ra chữ — nói hộ thành chữ là ăn gian.
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

  /**
   * Mép đường đi của camera: hình bao THẬT của những gì đã dựng, không phải hình bao của lưới ô
   * — tường cao nhô lên trên hàng đầu tiên cả trăm pixel.
   */
  private sceneBounds(ground: Phaser.Geom.Rectangle, props: Phaser.GameObjects.Image[]) {
    const bounds = Phaser.Geom.Rectangle.Clone(ground);
    for (const img of props) Phaser.Geom.Rectangle.Union(bounds, img.getBounds(), bounds);
    return bounds;
  }

  /**
   * Nền không bao giờ đổi → nướng hết vào MỘT RenderTexture; gọi `drawFrame()` cho từng ô riêng
   * lẻ sẽ tụt fps thấy rõ khi map to ra. Trả về hình bao của nền cho `sceneBounds`.
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
    /*
     * Vạt nắng và mặt đường ướt LOẠI TRỪ NHAU — trời không vừa đổ nắng gắt vừa đổ mưa. Cả hai
     * chỉ dán NGOÀI TRỜI (`isSunlit` đã tự lọc, `SKY_FROM_Y` lọc cho vế mưa).
     */
    for (let ty = 0; ty < WORLD_H; ty++) {
      for (let tx = 0; tx < WORLD_W; tx++) {
        if (!this.raining) { if (isSunlit(tx, ty)) put(TILE.sun, tx, ty); continue; }
        if (ty < SKY_FROM_Y) continue;
        /*
         * CHỈ SẬM LẠI, KHÔNG VẼ PHẢN CHIẾU. Một vệt phản chiếu chỉ có nghĩa khi nó là ẢNH CỦA
         * MỘT NGUỒN SÁNG ở trên nó; rắc đều theo ô thì mắt đọc ra là lỗi texture, không phải
         * nước. Dòng "phản chiếu nhựa đường" của spec là lời dặn cho người VẼ TAY tấm nền mưa.
         */
        put(TILE.wet, tx, ty);
      }
    }
    rt.endDraw();
    return new Phaser.Geom.Rectangle(minX, minY, w, h);
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
        if (st?.id === "board") this.addBoard(img, tx, ty);
        if (st?.id === "basket") this.addBasket(img, tx, ty);
        if (key === COUNTER.end) this.addOnCounter(img, tx, ty, BASKET_TEX, BASKET_W);
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

  /**
   * Đặt một texture vào ô (tx, ty) theo đúng luật của `art/canvas.ts`. `artScale` là chỗ ảnh thật
   * và hình vẽ-bằng-code gặp nhau: `photo.ts` nướng dư pixel nên sprite phải thu lại đúng từng ấy
   * lần, còn Graphics trả về 1. Thu quanh origin (0.5, 1) nên điểm chạm đất không nhúc nhích.
   */
  private addAt(key: string, tx: number, ty: number) {
    const { sx, sy } = toScreen(tx + 0.5, ty + 0.5);
    return this.add.image(sx, footY(sy), key)
      .setOrigin(0.5, 1)
      .setScale(1 / artScale(key))
      .setDepth(depthOf(tx + 0.5, ty + 0.5));
  }

  /**
   * Tên trạm dán ngay trên đạo cụ, để không ai phải đoán khối nào là lò, khối nào là kệ.
   * Nhãn nằm trên MỘT lớp riêng cao hơn mọi đạo cụ — nếu để depth theo ô thì bảng hiệu
   * hay khúc xe ở gần camera hơn sẽ che mất nhãn của trạm phía sau.
   */
  /**
   * Thớt gỗ đặt lên mặt quầy ở trạm `board`, theo MỐC CỦA CHÍNH KHÚC QUẦY (`img`) chứ không theo
   * lưới ô — mặt quầy cao hơn mặt đất, mà `footY` chỉ biết mặt đất. Origin (0,5 · 1) nghĩa là MÉP
   * DƯỚI của thớt chạm vạch mặt quầy, nên ảnh render lại dày mỏng thế nào cũng nằm đúng chỗ.
   *
   * Depth bám theo ô của nó chứ không dùng `LABEL_DEPTH`: thớt là vật trong cảnh, người chơi đi
   * ra phía trước quầy thì phải che được nó.
   */
  /**
   * Đặt một vật NẰM TRÊN mặt quầy (thớt, rổ bánh). Trả null nếu chưa có ảnh — khúc quầy để trơn,
   * đúng lệ "thà thiếu một món đạo cụ còn hơn một ô vuông xanh lè".
   *
   * Mốc là MẶT QUẦY chứ không mặt đất (`COUNTER.TOP_ABOVE_FOOT`, đo từ mép dưới sprite khúc quầy
   * nên không phụ thuộc chiều cao texture). Origin (0,5 · 1) là mép TRƯỚC của ê-líp đáy, thấp hơn
   * tâm đáy đúng 1/4 bề ngang — phép chiếu ép mọi hình tròn nằm ngang về 2:1.
   */
  private addOnCounter(img: Phaser.GameObjects.Image, tx: number, ty: number, key: string, w: number) {
    if (!this.textures.exists(key)) return null;
    const topY = img.y - COUNTER.TOP_ABOVE_FOOT;
    const sprite = fitPhoto(this.add.image(img.x, topY + w / 4, key))
      .setOrigin(0.5, 1)
      .setDepth(depthOf(tx + 0.5, ty + 0.5) + 1);
    return { sprite, topY };
  }

  /**
   * Rổ bánh nóng + chỗ để xếp ổ lên miệng rổ.
   *
   * Dùng lại đúng cái rổ vẫn bày ở hai đầu quầy (`BASKET_TEX`) — người chơi đã quen mắt
   * nó là chỗ để bánh, nên không phải học thêm một món đồ mới nào.
   */
  /**
   * Chỗ để bánh — một KHÚC MẶT QUẦY trống, không có cái rổ nào cả.
   *
   * Bỏ sprite cái rổ vì hai lẽ: nó không chứa được ổ ĐÃ GÓI (mà gói sẵn lúc vắng rồi bán nhanh
   * lúc đông mới là thứ người chơi cần chỗ để), và ổ gác lên "miệng rổ" là gác lên một con số
   * ước lượng từ bề cao sprite — nhìn ra ngay là ổ bánh bay lơ lửng.
   */
  private addBasket(img: Phaser.GameObjects.Image, tx: number, ty: number) {
    this.basketX = img.x;
    this.basketTopY = img.y - COUNTER.TOP_ABOVE_FOOT;
    // Depth lấy từ chính Ô của nó, cộng một hạt — vật nằm TRÊN mặt quầy ở ô này, nên
    // khúc quầy nào đứng gần người xem hơn (ô có x+y lớn hơn) phải che nó. Đặt một con
    // số cố định to đùng như trước là ổ bánh vẽ đè lên cả tủ kính chắn trước mặt nó.
    this.basketDepth = depthOf(tx + 0.5, ty + 0.5) + 0.5;
    // Ghi đè mốc mặc định của `addStationLabel` (đỉnh khúc quầy): ở đây không có VẬT nào
    // cố định để đo, chỗ để bánh chỉ là một khúc mặt quầy. Lấy chính mặt quầy, trừ 5 px
    // cho đúng khoảng hở mọi trạm khác đang dùng. Hôm nay chưa dấu nào treo ở đây, nhưng
    // để sẵn cho đúng còn hơn để một con số sai nằm chờ.
    this.choreAt.set("basket", { x: this.basketX, y: this.basketTopY - 5 });
  }

  /** Thớt + ghi lại MẶT TRÊN của nó, vì ổ bánh gác phải nằm lên đúng cái mặt ấy. */
  private addBoard(img: Phaser.GameObjects.Image, tx: number, ty: number) {
    const made = this.addOnCounter(img, tx, ty, BOARD_TEX, BOARD_W);
    if (!made) {
      // Thiếu ảnh cái thớt (artist chưa gửi, hoặc tải hỏng): KHÔNG để `choreAt("board")`
      // rơi về mốc mặc định — mốc đó là đỉnh cả khối quầy, tức dấu "thớt dơ" lại bay lên
      // nóc tủ kính đúng như lỗi vừa sửa, mà lần này không ai ngờ vì nó chỉ xảy ra khi
      // thiếu một file ảnh. Mặt quầy là chỗ đúng nhất còn biết được.
      this.boardTopY = img.y - COUNTER.TOP_ABOVE_FOOT;
      this.choreAt.set("board", { x: img.x, y: this.boardTopY - 5 });
      return;
    }
    // Bề dày thớt = tổng cao trừ hai nửa ê-líp (đáy và mặt trên cùng hình, mỗi nửa cao
    // bằng 1/4 bề ngang). Tính ra thay vì gõ tay, để anh render lại thớt dày mỏng khác
    // thì ổ bánh vẫn nằm đúng trên mặt nó.
    this.boardTopY = made.topY - (made.sprite.displayHeight - BOARD_W / 2);
    // Dấu "thớt dơ" neo vào CÁI THỚT, không vào nóc tủ kính của khúc quầy — và neo theo
    // đúng công thức mọi trạm khác đang dùng (đỉnh sprite, chừa 5 px), để khoảng hở giữa
    // dấu và vật giống hệt nhau ở mọi chỗ. Lấy `boardTopY` (mặt thớt) thì dấu sát hơn 12
    // px so với dấu ở lò và bồn rửa, đọc ra là hai thứ khác loại.
    const e = spriteEdges(this, made.sprite);
    this.choreAt.set("board", { x: e.cx, y: e.top - 5 });
    // `boardLoafImg` chưa dựng ở thời điểm này (`placeProps` chạy trước) — ghi lại depth
    // rồi áp lúc vẽ. Trên mặt thớt một hạt: thớt che chân ổ, còn khúc tủ kính ở ô gần
    // người xem hơn thì che cả ổ.
    this.boardDepth = made.sprite.depth + 0.5;
  }

  /**
   * Nhãn tên trạm. Chỗ "nhà" của nó là ngay trên đỉnh đạo cụ, nhưng mỗi frame nó còn bị
   * KẸP vào trong khung nhìn (`drawLabels`) — xem lý do ở đó.
   */
  /**
   * Ghi lại ĐIỂM NEO trên đỉnh mỗi trạm; không còn vẽ cái tên nữa, vì vòng sáng dưới chân trạm và
   * dòng nhắc dưới màn hình đã nói đủ.
   *
   * ⚠️ Neo là toạ độ THẾ GIỚI, đặt một lần và KHÔNG kẹp vào khung nhìn mỗi frame — kẹp là kéo ba
   * cái vòng độ giòn CHẠY THEO CHÂN người chơi thay vì nằm yên trên cửa lò.
   */
  private addStationLabel(st: Station, img: Phaser.GameObjects.Image) {
    // Đo MÉP THẬT của cái vật, không lấy khung texture: `displayHeight` của một khúc
    // quầy là cả khối 92 px kể cả nóc tủ kính, còn `img.x` là tâm Ô chứ không phải tâm
    // VẬT (ảnh bồn rửa nướng lệch 2 px, xem `STANDING[].dx`).
    const e = spriteEdges(this, img);
    const x = e.cx, y = e.top - 5;
    this.labelY.set(st.id, { x, y });
    // Mặc định hai mốc trùng nhau — đúng cho mọi vật ĐỨNG TRÊN SÀN. Thứ gác trên quầy
    // (thớt, chỗ để bánh) ghi đè ở `addBoard` / `addBasket`.
    this.choreAt.set(st.id, { x, y });
  }




  // ───────────────────────────────────────────────────────────────────── input

  private bindInput() {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys("W,A,S,D,UP,LEFT,DOWN,RIGHT,E,SPACE,Q,R,ESC,SHIFT,C,F,P") as any;

    // MỘT handler duy nhất phân luồng phím: Phaser bắn `keydown-E` TRƯỚC `keydown` chung, nên
    // tách hai handler thì cú E mở bảng lại bị chính nó bấm "Gói lại" ngay trong cùng sự kiện.
    // Phaser cũng có lúc phát lại CÙNG MỘT sự kiện phím DOM vài lần trong một frame chậm, nên
    // nhận diện theo chính object sự kiện để mỗi lần bấm chỉ được tính đúng một lần.
    // Esc: đang mở bảng kẹp nhân thì GÁC ổ lại; ngoài ra là pause thật (CANON §15.2).
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
      else if (ev.code === "KeyR") this.intents.push(() => this.liftFromBoard());
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
        this.clock.busy = this.service.busy || this.talkHoldsClock || this.finaleAt >= 0;
        return this.closed ? 0 : this.clock.advance(raw);
      },
      input: (dt) => {
        /*
         * ĐANG LÀM THÌ ĐỨNG YÊN — khoá PHÍM mà không khoá CHÂN thì "mất 2,5 giây" không tốn gì cả.
         *
         * ⚠️ Truyền input TOÀN `false` chứ không bỏ qua lời gọi `move()`: bỏ qua thì `Player` giữ
         * nguyên cờ `moving` và cái nhún bước chân của frame trước.
         */
        const rooted = this.handsBusy || !!this.busy;
        this.player.move(rooted ? { up: false, down: false, left: false, right: false, run: false } : {
          up: this.keys.W.isDown || this.keys.UP.isDown,
          down: this.keys.S.isDown || this.keys.DOWN.isDown,
          left: this.keys.A.isDown || this.keys.LEFT.isDown,
          right: this.keys.D.isDown || this.keys.RIGHT.isDown,
          // Xoay người che tay thì không chạy được — một nửa cái giá của Công cụ 3.
          run: this.keys.SHIFT.isDown && !this.keys.C.isDown,
        }, dt);
        this.near = stationNear(this.player.x, this.player.y, this.near);
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
          this.hud.toast("khét rồi!", "bad", this.popClock);
        }
        this.tickGrip(dt);
        // P1-02 §2.10: quầy bẩn dần theo giờ bán, dù không ai làm gì sai
        this.addDirt(0.0015 * Math.max(0, this.clock.minutes - this.lastMinutes));
        this.lastMinutes = this.clock.minutes;
        this.service.dirt = this.dirt;
        this.service.handsDirty = this.hands === "MONEY";
        // F nói chuyện với người GẦN NHẤT, không chỉ với người đứng đầu quầy — nên
        // `Service` phải biết mình đang đứng chỗ nào (`Service.talkTarget`).
        this.service.playerAt = { x: this.player.x, y: this.player.y };
        /*
         * PHIÊN CHẾT Ở PHÍA SERVICE THÌ THẺ PHẢI ĐÓNG THEO — `Service` tự kết thúc phiên ở hai chỗ
         * scene không hề biết: `leave()` khi người đang nói bỏ đi, và vòng dọn của `tickNpcs`.
         *
         * ⚠️ Hậu quả không phải một cái thẻ thừa: `talkHoldsClock` kẹt `true` ⇒ đồng hồ không bao
         * giờ tua nhanh nữa suốt phần còn lại của ngày.
         */
        if (this.talk.isOpen && !this.service.talkOpen) this.closeTalkPanel();
        // Lời bắt chuyện chỉ nổ ra ở cửa sổ an toàn — P2-06 §2.4.
        this.service.interruptible = this.canBeInterrupted();
        // Ảnh chụp thế giới cho hợp đồng `while` của P2-07: thoại chỉ được nói về
        // những thứ ĐANG CÓ THẬT trong tay và trên sân.
        this.service.playerHand = this.player.hand;
        this.service.playerOnStreet = this.player.y > COUNTER_Y + 0.5;
        // hết sạch bánh: kho + lò + thớt + tay đều không còn ổ nào → khách tới là về không
        const hand = this.player.hand;
        this.service.soldOut = stockOf(this.world.inventory, "BANH", this.world.progress.dayIndex) === 0
          && this.oven.count === 0 && !this.boardLoaf && !hand.startsWith("loaf");
        // Trục nguội chạy nền, không ai điều khiển, luôn chống lại người chơi (P1-01 §2.5).
        const weather = this.world.progress.weather;
        if (this.player.hand === "loaf_hot" || this.player.hand === "loaf_filled") this.handWarmth = cool(this.handWarmth, dt, weather);
        if (this.boardLoaf) this.boardWarmth = cool(this.boardWarmth, dt, weather);
        // Rổ KHÔNG phải tủ giữ ấm: gác ổ vào đó vẫn nguội như mọi chỗ, nên nướng dư
        // nhiều ổ là tự chuốc một rổ bánh nguội chứ không phải một mẹo chơi.
        for (const l of this.basket) l.warmth = cool(l.warmth, dt, weather);
        // Dưới sàn cũng nguội — đặt tạm xuống không phải cách giữ ấm.
        for (const f of this.floor) f.warmth = cool(f.warmth, dt, weather);
        // …và để đó thì quán BẨN DẦN. Đây là cái giá duy nhất của phím Q: đặt xuống thì
        // rẻ, QUÊN KHÔNG DỌN mới đắt. Dọn nghĩa là nhặt lên hoặc bỏ vô thùng, cả hai đều
        // một thao tác — nên đây là một lời nhắc, không phải một cái bẫy.
        if (this.floor.length) this.addDirt(FLOOR_DIRT_RATE * this.floor.length * dt);
      },
      perception: (dt) => {
        this.elapsed += dt;
        /*
         * Scene chỉ đưa SỰ THẬT THÔ, không đưa kết luận: lò có ổ trong hay không. ⚠️ Đừng gán
         * thẳng `service.ovenHot` — bảng đen khai fact đó nghĩa khác ("lò đang nhen / mẻ vừa ra"),
         * và nội dung được viết theo nghĩa trong bảng đen.
         */
        this.service.ovenBusy = this.oven.busy;
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
      render: (dt) => { this.syncAudio(dt); this.renderSync(dt); },
      // Pause: `dt` = 0 nên hẻm không đẻ thêm tiếng xe và bước chân đứng im, nhưng
      // nền vẫn kêu — §6.5 #8: "pause phải thấy an toàn, không thấy trống rỗng".
      renderPaused: () => { this.syncAudio(0); this.renderSync(0); },
    }, dtMs);
  }

  /**
   * Nghe lỏm — ba tầng theo việc người chơi đang làm: tay bận → chỉ biết có người nói; dừng tay
   * đứng yên → nghe nội dung; đứng yên + giữ Shift → nghe cả nguồn, nhưng khách trước quầy thấy
   * mình lơ đễnh. Không có nút phát lại.
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

  /**
   * Bước 6: CHỈ ĐỌC state vừa tính rồi vẽ. Không đọc input, không đổi state. `dt` là giây THẬT
   * và bằng 0 khi pause (xem `sim/frame`) — lớp mưa cần nó để thả đúng số hạt mỗi giây.
   */
  private renderSync(dt: number) {
    // Camera bám chân người chơi, không bám đỉnh đầu: chân mới là chỗ nhân vật THẬT SỰ
    // đứng trên lưới, bám đỉnh đầu thì camera giật một nấc mỗi lần nhún.
    const p = toScreen(this.player.x, this.player.y);
    this.cam.lookAt(p.sx, footY(p.sy));
    this.syncActors();
    this.syncMusic();
    // Hình ổ bánh trên tay theo ĐỘ GIÒN, không chỉ theo nóng/nguội (xem `art/held.heldTexture`):
    // ổ nướng dở rồi để nguội phải nhìn ra là đã nướng, không được quay về hình bột sống.
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
    // Sau mọi thứ trong cảnh: mưa rơi GIỮA camera và cái hẻm, nên nó phải biết khung
    // hình đang nhìn vào đâu — `worldView` chỉ đúng sau khi camera đã bám xong.
    this.rain?.draw(this.cam.world.worldView, dt, this.time.now, this.settings.reducedMotion);
    // Mưa xuống thì bật đèn. Phải gọi SAU lớp mưa: vũng sáng cộng lên TRÊN lớp phủ,
    // nên thứ tự ở đây là thứ tự của câu chuyện — trời tối lại, rồi người ta bật đèn.
    this.light.draw(this.raining);
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
      watch: this.watchLevel(),
      now: this.popClock,
      // Thanh tiến trình của tay: chỉ hiện khi KHÔNG đang giữ phím ở trạm nào, vì hai
      // thứ dùng chung một chỗ vẽ và cái đang giữ phím mới là cái người chơi điều khiển.
      // Việc `"quick"` (đặt xuống, nhặt lên, bỏ thùng, nhận tiền) không có thanh — xem `beBusy`.
      work: !this.busy && this.handsBusy && this.handsBusyBar ? { frac: this.handsBusyFrac } : null,
    });
  }

  /**
   * Có ai đang để mắt tới mình không — nguồn của con mắt ở đỉnh màn hình. Đọc THẲNG từ máy trạng
   * thái ánh nhìn chứ không từ `certainty`: con mắt phải sáng TRƯỚC khi mình làm bậy.
   *
   * `LOOK_HANDS` là bậc duy nhất đáng gọi là "bị soi"; mấy bậc còn lại đã có đạo cụ riêng trên
   * đầu khách.
   */
  private watchLevel(): Watch {
    let out: Watch = "NONE";
    for (const c of this.service.customers) {
      if (c.phase === "arriving" || c.phase === "leaving") continue;
      if (c.gazeState === "LOOK_HANDS") return "CLOSE";
      if (c.gazeState === "LOOK_FACE") out = "GLANCE";
    }
    return out;
  }

  /**
   * Nhích đồng hồ hiệu ứng. Đứng yên khi pause nên số tiền treo nguyên tại chỗ chờ người chơi
   * đọc xong; `CLOCK_DT_CLAMP_MS` để tab bị nền lại rồi mở ra không ăn một bước nhảy năm giây.
   */
  private tickPopClock() {
    const now = this.time.now;
    const dt = this.popLastNow ? now - this.popLastNow : 0;
    this.popLastNow = now;
    if (!this.clock.paused && !this.closed) this.popClock += Math.min(dt, CLOCK_DT_CLAMP_MS);
    return this.popClock;
  }

  /**
   * Điểm màn hình của từng vùng quầy. TAY là chỗ người chơi đang đứng (tay đi theo người),
   * còn lò / thớt / gầm quầy là chỗ cố định của trạm. Dùng cho dáng che tay (`drawCover`).
   */
  private zonePoint = (slot: Station["slot"]) => {
    // Bảng kẹp nhân đang mở: "thớt" và "tay" chính là ổ bánh trong bảng.
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
    /*
     * NGƯỜI ĐANG CHỜ MÌNH TRẢ LỜI ĐỨNG TRƯỚC MỌI VIỆC CỦA CÁI QUÁN. ⚠️ Dòng trò chuyện phải ở
     * ĐẦU chuỗi, không ở cuối: để sau mấy nhánh `near?.id === oven | board | basket | bin` thì
     * đứng ở lò hay ở thớt — gần như toàn bộ thời gian chơi — nó không bao giờ hiện.
     */
    const waiting = this.service.talkTargetNow;
    if (waiting && !this.talk.isOpen && this.service.pendingTalkers.includes(waiting.id)) {
      return `${this.service.label(waiting)} đang chờ mình trả lời — bấm F`;
    }
    const d = this.pendingDebt;
    if (d && this.elapsed <= d.until) {
      const amt = d.record.trueAmount.toLocaleString("vi-VN");
      // Tay còn bận thì cú G vẫn được NHỚ (xem `writeDebt`) — nói rõ chứ không câm.
      return `G — ghi sổ nợ: ${d.name} ${amt}₫${this.debtQueued ? " (ghi ngay khi rảnh tay)" : ""}`;
    }
    // P4-04 §2.2 — khoảng lặng ngày 40: một dòng nhắc kín đáo, không panel, không đếm ngược.
    if (this.finaleAt >= 0 && this.elapsed - this.finaleAt > SKIP_AFTER) return "Enter — thôi, dọn hàng";
    if (this.handsBusy) return `${this.handsBusyWhat || "tay đang bận"}…`;
    if (this.keys.C.isDown) return "che tay — đi chậm lại, không chạy được";
    // Món nằm trong tầm với dưới sàn: nói trước mọi thứ khác. Một ổ bỏ quên dưới đất là
    // việc gấp nhất trong quán — nó làm bẩn quán từng giây và khách thì đang nhìn.
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
      // Nói trước là lau sẽ lâu, đừng để người chơi biết sau khi đã bấm (CANON T5: rủi ro
      // phải đọc được TRƯỚC khi hành động).
      const slow = this.dirt > FLY_DIRT_MIN ? " — thớt dơ, lau lâu hơn" : "";
      return this.boardPrompt() ?? (this.player.hand === "empty" ? `thớt — bấm E để lau thớt${slow}` : null);
    }
    const who = this.service.talkTargetNow;
    if (who && !this.talk.isOpen) {
      // Hai động từ, hai việc: "mời" người đang đi ngang vs "nói chuyện" với người đứng đó.
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

  /**
   * Phiếu đơn = ĐÚNG câu khách nói, nguyên văn, ghim suốt lượt. Không phải checklist đã phân
   * tích sẵn — checklist làm hộ người chơi phần NGHE, giết T2. Không đổi màu theo độ sốt ruột:
   * đó là một thanh kiên nhẫn trá hình.
   */
  /**
   * Khách `npcId` đang đứng lệch về phía nào — tính theo KHOẢNG CÁCH THẬT trong thế giới chứ
   * không tra bảng slot, vì chính người chơi cũng DI CHUYỂN dọc quầy. Trần 0,6 chứ không 1,0: pan
   * hết biên nghe như khách đứng ngoài khung hình.
   */
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

  /**
   * `Service` đẩy ra một dòng chữ — nó thuộc kênh nào? LỜI NGƯỜI luôn có dạng `TÊN NGƯỜI: câu
   * nói`; lời tường thuật không có tiền tố đó nên đi lên dải thông báo.
   *
   * ⚠️ Dấu ngoặc kép KHÔNG dùng để nhận ra được: câu khách gọi món không có ngoặc, nên lấy ngoặc
   * làm mốc là đẩy đúng câu quan trọng nhất màn hình sang nhầm cột.
   */
  private routeLine(text: string) {
    if (SPEAKER_PREFIX.test(text)) this.hud.say(text);
    else this.hud.toast(text, "info", this.popClock);
  }

  private drainService() {
    for (const ev of this.service.drain()) {
      if (ev.kind === "log") { this.routeLine(ev.text); continue; }
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
          // Cửa sổ MỜI phải trùng cửa sổ NHẬN: cú bán vừa xong còn khoá tay `TAKE_MONEY_SEC`,
          // nên 4 giây ghi sổ đếm TỪ LÚC RẢNH TAY. Trước đây nó đếm ngay trong frame nhận
          // tiền, HUD mời 4 s mà hệ chỉ nhận được phần cuối.
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
      // Khách tự bắt chuyện: chỉ là một lời mời. Không bấm F cũng không sao — mà cũng
      // không phải là không sao (xem `talk.ignore`).
      // Cùng lối nhắc với "bấm G để ghi sổ": một dòng ở nhật ký, không có mũi tên nhấp
      // nháy trên đầu ai. Không bấm F cũng chơi tiếp được — mà cũng không phải không sao.
      /*
       * Khách bắt chuyện — KHÔNG còn một cái toast: toast là tín hiệu TỨC THỜI gắn vào một trạng
       * thái BỀN, nó sống 2,6–6 s rồi trôi mất trong khi lời bắt chuyện vẫn đứng đó chờ.
       *
       * Thay bằng bong bóng trên đầu CHÍNH họ cộng dấu bền `drawPendingTalk()` — sống đúng bằng
       * quãng lời mời còn giá trị.
       */
      if (ev.kind === "talkOffer") continue;
      /*
       * Ổ RỜI TAY NGƯỜI CHƠI — `GIVE_BREAD`. ⚠️ Phải làm ở ĐÂY chứ không trong `Service`: dòng
       * `service.playerHand = player.hand` chạy mỗi frame, nên mọi thứ Service tự ghi vào đó bị
       * đè ngay frame sau.
       */
      if (ev.kind === "takeHand") {
        this.player.hand = "empty";
        this.dish = [];
        this.handWarmth = 0;
        this.handCrust = 0;
        this.audio.wrap();   // tiếng giấy gói — ổ sang tay người khác
        continue;
      }
      w.money.cash += ev.amount;
      w.progress.today.revenue += ev.amount;
      w.progress.today.served++;
      bus.emit("money:changed", { delta: ev.amount, balance: w.money.cash, reason: "SALE" });
    }
  }

  /**
   * G — ghi sổ nợ cho khách vừa mua chịu (2 giây tay). Bấm sớm (tay còn bận nhận tiền) thì cú
   * bấm được XẾP HÀNG, không bị vứt: `tickDebt` ghi giúp ngay khi tay rảnh.
   */
  private writeDebt() {
    const p = this.pendingDebt;
    if (!p || this.elapsed > p.until) return;
    if (this.handsBusy) { this.debtQueued = true; return; }
    p.record.playerWrote = p.record.trueAmount;
    this.pendingDebt = null;
    this.debtQueued = false;
    const sec = this.workSeconds(2.0);
    this.beBusy(sec, "đang ghi sổ");
    this.audio.writeFor(sec);                    // lật sổ rồi mấy nét bút, suốt lượt ghi
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

  /**
   * BỐN CỬA SỔ AN TOÀN — lúc nào thì một lời bắt chuyện được phép nổ ra. Ngắt quãng giữa chừng
   * một nhiệm vụ con đắt hơn hẳn ngắt ở ranh giới nhiệm vụ, mà ba cái van cũ đều là van TẦN SUẤT
   * — không cái nào biết người chơi đang cầm gì. Bảy cửa sổ cấm, theo thứ tự dễ gặp:
   */
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
      /*
       * Tiếng của một thao tác GIỮ PHÍM nổ ở ĐÂY, lúc bắt đầu giữ — đặt ở `finish` thì tiếng rót
       * kêu đúng lúc ly đã đầy. Vòi rửa tay không nằm ở đây vì nó là một VÒNG LẶP chạy suốt lượt
       * giữ (`syncAudio` → `washing`).
       */
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
    // Đang dở một việc: dòng nhắc dưới màn hình đã ghi rõ "đang lau thớt…" kèm thanh
    // tiến trình (xem `promptLine`), nên KHÔNG đẩy thêm một dòng thông báo nữa — bấm
    // sốt ruột ba cái là ba dòng y hệt, che mất mấy dòng đáng đọc.
    if (this.handsBusy) return;
    const st = this.near;
    if (st?.id === "oven") { this.pressOven(); return; }
    if (st?.id === "basket") { this.pressBasket(); return; }
    if (st?.id === "board" && this.player.hand === "empty") {
      // E Ở THỚT CHỈ CÓ MỘT NGHĨA: "làm việc với cái đang nằm trên thớt". Cầm ổ lên là phím R
      // riêng (`liftFromBoard`), nên E không còn đoán ý ai nữa — trước đây cùng một phím là ba
      // việc khác nhau tuỳ một trạng thái người chơi không nhìn thấy (ổ còn ấm hay đã nguội).
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

  /**
   * Rổ bánh nóng — trạm HAI CHIỀU, giống hệt lò: tay đang cầm ổ thì GÁC xuống, tay không thì
   * LẤY ổ giòn nhất lên. Lấy ổ GIÒN NHẤT chứ không phải ổ để lâu nhất: người chơi gác ổ vào rổ
   * là để dành ổ ngon cho khách tới.
   */
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
    /*
     * Lấy ổ NÀO: ấm trước, rồi mới tới giòn. Bấm E ở đây với hai tay không thì ý người chơi luôn
     * là "đưa tôi cái bán được ngay", và ổ nguội là ổ khách chê (`WRONG_TEMP` lúc đưa).
     */
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

  /**
   * Phím R — cầm ổ đang gác trên thớt lên. Phím RIÊNG chứ không chung E: ổ nguội thì việc đúng
   * là cầm ra lò nướng lại, ổ còn ấm thì việc đúng là kẹp tiếp — hai việc trái ngược nhau mà
   * xưa nay đi chung một phím. Giờ E luôn là "kẹp", R luôn là "cầm lên".
   */
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

  /**
   * Dòng nhắc ở thớt — phải nói ĐÚNG việc bấm phím sẽ làm, và luôn có ít nhất một
   * đường ra. Trước đây ổ gác + tay cầm ổ nóng chỉ trả một dòng "kẹp xong ổ đó đã"
   * mãi mãi, mà không phím nào làm được việc đó.
   */
  private boardPrompt(): string | null {
    if (!this.boardLoaf) return null;
    if (this.player.hand !== "empty") return "thớt — đang có ổ gác · Q đặt ổ trên tay xuống";
    const bare = this.boardLoaf.length === 0;
    // Ổ nguội: nói thẳng việc đúng nhất lúc này là cầm ra lò nướng lại, nhưng KHÔNG giấu
    // mất đường kẹp tiếp — kẹp vào ổ nguội vẫn là quyền của người chơi (T5: nói rủi ro,
    // đừng chặn tay họ).
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

  /**
   * Gói ổ bánh lại. So ngay với đơn của người đang đứng trước mặt: sai thì phát `ORDER_DEFECT`
   * tại slot BOARD — khách ĐANG NHÌN thì sẽ thấy, và lúc đưa bánh họ nói "tôi thấy con quên bỏ
   * hành rồi đó" thay vì "ủa… thiếu hành rồi". Đó là trụ cột T1 dưới dạng kỹ thuật.
   */
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
        // Ổ này đã từng nằm dưới đất. Người NHÌN THẤY lúc nó rơi thì biết chắc; người
        // không thấy thì chỉ nhai phải sạn. `Service` quyết hai đường đó — nó là chỗ
        // duy nhất biết ai đã thấy gì (xem tầng `perception`).
        soiled: this.handSoiled,
      });

    if (!res.ok) { this.hud.toast(res.reason ?? "chưa đưa được", "info", this.popClock); return; }

    this.handSoiled = false;
    const wasDish = isLoaf;                            // ổ trơn cũng lấy tiền → tay dính tiền
    this.player.hand = "empty";
    this.dish = [];
    // TAKE_MONEY: 0,8 s nhận tiền — và tay dính tiền cho tới khi rửa.
    // ⚖️ P1-01 §2.11 ghi 2,0 s; nhận tiền không phải một thao tác có tay nghề (không hỏng được,
    // không có gì để canh), nên hai giây chôn chân sau MỖI lượt khách chỉ là thời gian chết.
    // 0,8 s vẫn giữ nguyên cái giá thật của nó: tay DÍNH TIỀN cho tới khi đi rửa.
    if (wasDish) {
      this.hands = "MONEY";
      this.audio.money();
      this.beBusy(this.workSeconds(TAKE_MONEY_SEC), "đang nhận tiền", "quick");
    }
    // Autosave sau mỗi khách: DayScene nghe `npc:left` (P0-02 §2.6).
  }

  /**
   * Khoá tay lại `sec` giây để làm `what`. MỌI chỗ khoá tay phải đi qua đây — khoá mà không nói
   * đang làm gì thì người chơi gặp lại cái "tay đang bận" vô duyên cũ.
   *
   *   `"bar"`   việc phải ĐỨNG CHỜ (lau thớt, ghi sổ, băng tay) — có thanh tiến trình
   *   `"quick"` động tác cúi người / chìa tay — tay vẫn khoá, dòng nhắc vẫn nói, chỉ bỏ cái thanh
   *
   * ⚠️ Cố ý KHÔNG tự suy ra từ `sec`: giữ C nhân mọi thao tác lên 1,3×, mà "nhận tiền" chậm đi
   * thì vẫn là nhận tiền.
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
  /**
   * Cầm một món lên. MỌI đường cầm đều đi qua đây, và `handSoiled` reset về `false` ngay tại đây
   * — chỗ gọi nào biết ổ đó thật sự dính đất thì tự bật lại.
   *
   * ⚠️ Cờ phải là thuộc tính của Ổ BÁNH chứ không của BÀN TAY, y như `handCrust`.
   */
  private pickUp(hand: Station["gives"]) {
    this.player.hand = hand;
    this.handSoiled = false;
    this.grip.reset();
    if (hand === "loaf_cold") this.touchFood();
  }

  /**
   * Chạm vào đồ ăn. Tay còn dính tiền thì đó là `DIRTY_HANDS` (MONEY_THEN_FOOD) ở vùng TAY, ngay
   * trước mắt khách. Cùng một đợt tay dơ thì cùng một khoá: bốc càng nhiều, khách càng chắc.
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

  /**
   * Lau thớt mất bao lâu — CÀNG BẨN CÀNG LÂU, nhân từ ×1,0 tới ×2,0 (2,5 s → 5,0 s). Bẩn phải
   * ĐẮT DẦN thì "lau tranh thủ lúc vắng" mới là lựa chọn thật; chưa gấp ba để không thành cái
   * vòng xoáy mà `wipeBoard` vừa gỡ ra. Khăn ba màu rút ngắn phần gốc chứ không rút phần phạt.
   */
  private wipeSeconds() {
    const base = has(this.world.equipment, "KHAN_3_MAU") ? 1.2 : 2.5;
    return base * (1 + this.dirt);
  }

  /**
   * Lau thớt. MỘT lần là hết ruồi, dù quầy đang bẩn tới đâu — trừ từng chút một thì quầy bẩn
   * 0,95 phải lau năm lượt, mà trong năm lượt đó khách vẫn tới.
   *
   * Vẫn trừ ÍT NHẤT `WIPE_DIRT` nên lau lúc quầy đã sạch sẵn vẫn có ích cho hai ngưỡng 0,5 / 0,7.
   */
  private wipeBoard() {
    const st = this.world.stall;
    st.cleanliness = Math.min(1, Math.max(st.cleanliness + WIPE_DIRT, WIPED_CLEAN));
  }

  private addDirt(d: number) {
    const st = this.world.stall;
    if (d > 0) d *= dirtMul(this.world.equipment);
    st.cleanliness = Math.max(0, Math.min(1, st.cleanliness - d));
  }

  /**
   * Preset P1/P2/P3: CHỈ trả danh sách phần — thuần tuý, không trừ gì. Bảng kẹp nhân có thể từ
   * chối áp preset (kho hết một món giữa chừng), nên trừ ngay ở đây là mất một phần chia sẵn mà
   * ổ bánh không nhận được gì.
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
   * Bỏ món đang cầm vào thùng — mất 1 giây, KHÔNG phát sự kiện nào. Rớt (`DROPPED_FOOD`) là
   * chuyện khác: nó chỉ đến từ tay lỏng (`tickGrip`). Đồ hỏng (bánh cháy) BẮT BUỘC bỏ.
   */
  /**
   * Phím Q — ĐẶT XUỐNG SÀN, và nhặt lại: món đồ còn nguyên đó với nguyên độ nóng và độ giòn của
   * nó. Muốn bỏ thật thì đi tới thùng rác và bấm E. Nhờ vậy cú "lỡ tay" rẻ hẳn đi, và gỡ được
   * thế kẹt kinh điển: đang cầm ổ nóng thì khách đòi ly trà.
   */
  private discard() {
    if (this.paused || this.closed) return;
    if (this.handsBusy) return;

    if (this.player.hand === "empty") {
      // Có món nằm trong tầm với: nhặt lên. Ưu tiên hơn việc dọn thớt vì người chơi vừa
      // đặt nó xuống đây, và tầm với của sàn hẹp hơn hẳn tầm với của trạm.
      const i = this.nearestFloor();
      if (i >= 0) { this.pickFloor(i); return; }
      // Tay không, đứng ở thớt, không có gì dưới sàn: Q dọn ổ đang GÁC xuống sàn. Không
      // có đường này thì một ổ gác với stack rỗng là ngõ cụt — không gói được, không lau
      // thớt được, mà dòng gợi ý vẫn mời "bấm E để kẹp tiếp".
      if (this.near?.id !== "board" || !this.boardLoaf) return;
      if (this.floor.length >= FLOOR_MAX) { this.hud.toast("dưới sàn hết chỗ rồi", "info", this.popClock); return; }
      // Đặt xuống sàn là đặt ĐỔ BÁNH, không đặt mấy phần nhân đã rải lên nó: nhân chưa
      // bị trừ kho (chỉ trừ lúc gói, xem `finishDish`) nên bỏ đi không mất gì, mà một ổ
      // hở nhân nằm dưới sàn rồi nhặt lên thì không ai biết trong đó còn gì.
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

  /**
   * Đặt một món xuống sàn tại chỗ đang đứng.
   *
   * ⚠️ Phát `DROPPED_FOOD` kể cả khi ĐẶT CÓ CHỦ Ý: nếu chỉ cú rớt mới phát thì bấm Q đặt xuống
   * rồi nhặt lên là một cách rửa sạch lý lịch ổ bánh. Phát ra KHÔNG có nghĩa là bị bắt — tầng
   * nhận thấy vẫn quyết theo chỗ đứng, hướng nhìn và độ che của từng người.
   */
  private putFloor(hand: Hand, warmth: number, crust: number, q: number, dish: readonly Ingredient[]) {
    // Cùng một tiếng cho "đặt xuống" và "làm rớt" — y như `putFloor` phát cùng một
    // `DROPPED_FOOD` cho cả hai. Đặt ổ bánh xuống đất trước mặt khách thì khó coi
    // bằng làm rớt, và cho nó một tiếng êm hơn là mở đường cho cái kẽ hở đó.
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

  /**
   * Lò 3 slot — P1-01 §2.4. Bấm E cầm ổ nguội = bỏ vào; tay không = lấy ổ chín nhất ra.
   * Mỗi lần mở cửa lò hụt nhiệt một chút. Độ giòn hiện ở vòng trên cửa lò, không phải số.
   */
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

  /**
   * F — TRẢ LỜI người vừa nói với mình, hoặc bắt chuyện với người đang được tô sáng. Thứ tự ai
   * được nói nằm ở `Service.talkTarget()`, và chỉ báo dưới chân đọc ĐÚNG hàm đó — nên cái người
   * chơi thấy luôn là cái họ sẽ bấm trúng. Đồng hồ KHÔNG đóng băng (xem `openTalkPanel`).
   */
  private askFront() {
    if (this.paused || this.closed || this.talk.isOpen) return;
    /*
     * Tay đang bận thì XẾP HÀNG cú bấm, không nuốt nó: bấm một phím mà màn hình không nhúc nhích
     * thì người chơi tưởng phím hỏng. Phím G ngay cạnh đã làm đúng chuyện này (`debtQueued`).
     */
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
   * ĐỒNG HỒ VẪN CHẠY — `clock.busy`, không `clock.paused`. Đóng băng là một cái nút dừng giờ
   * miễn phí: một cuộc tốn 22–32 giây CHÚ Ý và đúng 0 giây GAME, nên spam thành hành vi tối ưu.
   *
   * `clock.busy` cho đồng hồ chạy ở `TIME_SCALE_BASE` — một cuộc 25 giây tốn ~12,5 phút game, và
   * người chơi học "nói chuyện thì mất giờ bán" bằng ĐỒNG HỒ TREO TƯỜNG đã có trên HUD, không
   * thêm chỉ số nào (T3).
   *
   * KHÔNG `assembly.park()` nữa: dải lựa chọn không mở được khi còn người chờ bánh.
   */
  private openTalkPanel(view: ReturnType<Service["openTalk"]>) {
    if (!view) return;
    this.talkHoldsClock = true;
    this.busy = null;
    this.intents = [];
    this.talk.show({ ...view, anchor: this.anchorFor(view.at) });
  }

  /**
   * Ô bản đồ → toạ độ MÀN HÌNH (đã trừ camera), cho thẻ trò chuyện neo cạnh người nói. Thẻ là
   * `setScrollFactor(0)` nên nó sống trong hệ toạ độ màn hình, còn `toScreen` trả toạ độ THẾ GIỚI.
   */
  private anchorFor(at: { x: number; y: number }) {
    /*
     * THẾ GIỚI → MÀN HÌNH, và phải đi qua ZOOM. ⚠️ `sx - cam.scrollX` sai hai lần: `scrollX`
     * không phải mép trái khung nhìn khi camera có zoom, và kết quả còn chưa được NHÂN zoom
     * trong khi thẻ là `scrollFactor(0)`.
     *
     * Chia `RENDER_SCALE` ở cuối vì camera UI cũng zoom đúng ngần ấy — toạ độ trả về phải là toạ
     * độ THIẾT KẾ, không phải pixel thật.
     */
    const { sx, sy } = toScreen(at.x, at.y);
    const cam = this.cameras.main;
    const v = cam.worldView;
    return {
      x: (sx - v.x) * cam.zoom / RENDER_SCALE,
      y: (sy - v.y) * cam.zoom / RENDER_SCALE - 40,
    };
  }

  /**
   * Người chơi chọn một dòng — rồi MỘT LƯỢT QUA LẠI diễn ra, không phải một cú nhảy: câu MÌNH
   * nói nổi lên đầu cô Ba → ba chấm trên đầu người kia (`REPLY_DELAY_SEC`) → câu họ đáp, rồi thẻ
   * mới hiện bộ lựa chọn kế.
   *
   * Thẻ bị GIẤU suốt hai nhịp đầu: bày sẵn câu trả lời trong lúc người ta còn chưa đáp là nói
   * trước phần của họ.
   */
  private pickTalk(i: number) {
    const next = this.service.chooseTalk(i);
    for (const l of this.service.drainLogs()) this.routeLine(l);
    // `null` = phiên đã chết ở phía Service. Phải đi qua `closeTalk()` chứ không chỉ
    // destroy UI: bỏ qua nó là rò `talkSession`, và một `talkSession` còn sống khoá
    // `offerTalk` suốt phần còn lại của ngày — cả hẻm câm vì một nhánh `if` (H-15).
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

  /**
   * CÔ BA CŨNG CÓ BONG BÓNG. Lời người chơi xưa nay chỉ rơi vào khung nhật ký góc dưới — nhỏ,
   * giữ ba dòng, nằm xa chỗ mắt đang nhìn — nên bấm một câu xong không có gì trên sân khấu cho
   * biết mình vừa nói.
   */
  private sayAsPlayer(text: string, sec: number) {
    this.playerSay = { text, until: this.elapsed + sec };
  }

  /**
   * Đóng dải mà chưa nói hết. Esc LUÔN MIỄN PHÍ (luật L4: "lùi ra khỏi lớp trên cùng" không bao
   * giờ được là một nước đi có giá) — "làm thinh" đã thành một DÒNG viết sẵn trong dải lựa chọn.
   *
   * `Service.closeTalk()` vẫn tính giá cho trường hợp đúng của nó: khách mở lời trước rồi mình
   * bỏ đi làm việc khác, hoặc mình đã nói rồi mới bỏ ngang.
   */
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

  /**
   * CHỖ NGƯỜI CHƠI ĐANG CẦN NHÌN — bong bóng thoại phải tránh.
   *
   * ⚠️ CỐ Ý ngắn và ĐỘNG: liệt kê cả cái quầy vào đây thì bong bóng rời hẳn khỏi người đang nói,
   * mà "ai vừa nói câu đó" là thông tin quan trọng hơn. Chỉ ba thứ: cái LÒ khi trong lò có ổ ·
   * TRẠM người chơi đang đứng cạnh · cái THỚT khi còn ổ dở.
   */
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

  /**
   * CHỈ BÁO MỤC TIÊU — một VÒNG DƯỚI CHÂN, không phải dấu trên đầu: `?` và `!` trên đầu đã bị hệ
   * ánh nhìn chiếm, còn bàn chân thì không bao giờ chồng nhau.
   *
   * Đọc `service.talkTargetNow` — CÙNG hàm mà cú bấm phím đọc. T3: một vòng mảnh, hết.
   */
  private drawTalkTarget() {
    const g = this.talkRing;
    g.clear();
    if (this.talk.isOpen || this.paused || this.closed) return;
    const t = this.service.talkTargetNow;
    if (!t) return;
    const { sx, sy } = toScreen(t.x, t.y);
    /*
     * ⚠️ Neo ở `sy`, KHÔNG ở `footY(sy)`: `footY` là chỗ đặt SPRITE (đáy lớp mặt đường dày
     * `BASE`), thấp hơn mặt đất 21 px. Điểm chạm đất thật nằm ở `sy`, đúng chỗ `CustomerActor`
     * đặt bóng đổ — vẽ ở `footY` là vòng rớt khỏi bàn chân, trông như của người đứng sau.
     */
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

  /**
   * DẤU "ĐANG CHỜ MÌNH TRẢ LỜI" — ba chấm nhỏ trên vai người đã mở lời, mờ dần theo thời gian còn
   * lại. Xẹp dần chứ không nhấp nháy: dấu đứng yên mãi thì mắt thôi nhìn thấy, dấu nhấp nháy thì
   * thành cái chuông đòi nợ. ⚠️ KHÔNG dùng `!` — `CustomerActor` đã lấy ký hiệu đó.
   */
  /**
   * Cung tròn của lời hứa vẽ trọn vòng ở ngần này giây. Dài hơn mọi hạn đang có (`DEED_DUE` lớn
   * nhất là 40 s) nên cung luôn bắt đầu dưới một vòng và chỉ vơi đi.
   */
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

  /**
   * LỜI HỨA ĐANG TREO — một đòi hỏi của T5: phạt một người vì quên một chuyện mà game không nhắc
   * là phạt TRÍ NHỚ chứ không phải LỰA CHỌN của họ.
   *
   * Vẽ bằng HÌNH, không bằng số: một cung tròn vơi dần trên đầu người được hứa, hết giờ thì đỏ
   * lên một nhịp rồi tắt — đúng lúc nấc nhắc đầu tiên nổ ra.
   */
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
    // Rớt là RƠI XUỐNG SÀN, không phải bốc hơi. Trước đây ổ bánh biến mất tại chỗ —
    // người chơi mất trắng một ổ mà trên sàn chẳng còn dấu vết gì, nên cũng chẳng có
    // quyết định nào để ra: nhặt lên liều đưa, hay bỏ vô thùng cho sạch tay.
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

  /**
   * Dấu CHẤM THAN trên trạm đang có việc phải làm — thớt bẩn, tay dính tiền chưa rửa.
   *
   * Ruồi và icon bàn tay là tín hiệu "tình trạng", đọc được khi người chơi ĐÃ nhìn đúng chỗ. Dấu
   * này nói một điều khác hẳn: ĐI TỚI ĐÂY, BẤM MỘT CÁI, HẾT — nên nó chỉ mọc trên trạm giải
   * quyết được bằng một thao tác có thật, và tắt ngay khi việc xong.
   *
   * KHÔNG phải một danh sách nhiệm vụ: không đếm, không xếp hạng, không ép làm.
   */
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
    // Có ổ cháy nằm trong lò. Vòng độ giòn trên cửa lò đã nói điều này bằng màu, nhưng
    // chỉ đọc được khi đứng nhìn thẳng vào lò — mà lúc ổ cháy thì người chơi đang ở tận
    // đầu kia quầy, và cái mùi khét thì cả hàng khách ngửi thấy trước mình.
    if (this.oven.slots.some((l) => l && bandOfCrust(l.crust, this.oven.burnAt) === "BURNT")) {
      this.bang(g, this.choreAt.get("oven"), bob);
    }
    // Đồ bỏ quên dưới sàn. Dấu này cần hơn cả hai cái trên: món nằm dưới chân quầy bị
    // chính cái quầy che một nửa (đúng thứ tự lớp của phép chiếu), nên không có nó thì
    // người chơi mất một ổ bánh mà không bao giờ biết nó nằm đâu — trong khi quán cứ
    // bẩn dần từng giây vì nó.
    for (const f of this.floor) {
      const { sx, sy } = toScreen(f.x, f.y);
      this.bang(g, { x: sx, y: footY(sy) }, bob);   // chân món, `CHORE_LIFT` tự nhô lên
    }
  }

  /**
   * Ổ bánh đang nằm trong rổ. Vẽ ĐÚNG SỐ ổ đang có, mỗi ổ một sprite riêng với hình theo độ giòn
   * của CHÍNH NÓ — không thì cái rổ thành một con số đếm trá hình. Xếp so le để ba ổ chồng đúng
   * một chỗ không đọc ra thành một ổ.
   */
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
      // Xếp so le sang phải, KHÔNG nhích lên (nhích lên là ổ thứ ba lơ lửng trên mặt quầy). Quầy
      // chạy chéo nên nhích ngang bao nhiêu thì nhích dọc đúng một nửa ngần ấy (độ dốc lưới iso).
      // `LOAF_SINK` cho đáy ổ chạm thật vào mặt gỗ chứ không treo bên trên.
      const k = i - (BASKET_SLOTS - 1) / 2;
      // Đáy THẬT của ổ (bỏ khoảng trong suốt dưới texture) đặt đúng vào mặt quầy.
      const pad = heldFootPad(this, img.texture.key) * img.scaleY;
      img.setVisible(true).setPosition(
        this.basketX + k * BASKET_STEP,
        this.basketTopY + k * BASKET_STEP / 2 + pad,
      ).setDepth(this.basketDepth + i * 0.01);
    }
  }

  /**
   * Món đang nằm dưới sàn (phím Q). Vẽ ở ĐÚNG chỗ đặt, với depth theo ô của chỗ đó — người đi
   * qua trước mặt nó thì che nó. Hình theo độ giòn của chính món đó, y như trên tay và trong rổ.
   */
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

  /**
   * Một dấu `!` trong khung tròn, đặt trên `at` — ĐỈNH CỦA CHÍNH CÁI VẬT cần làm.
   *
   * Phần toán (còn trong khung thì kẹp, ra ngoài thì ghim vào mép theo hướng) nằm ở
   * `ui/chorePin` — thuần, không Phaser, có test quét cả ngàn vị trí. Nhỏ lại 0,8 lần lúc bị
   * ghim, để mắt phân biệt "việc ở ngay đây" với "việc ở ngoài kia".
   */
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


  /**
   * Độ bẩn NHÌN THẤY được (P1-02 §2.10) — không có con số: 0,20 vụn bánh · 0,35 một con
   * ruồi · 0,50 ba con + vệt dầu · 0,70 năm con. Ruồi bay quanh thớt.
   */
  /**
   * Độ bẩn nhìn thấy được = RUỒI, hết. Mấy chấm vụn bánh và vệt dầu vẽ bằng code đã bỏ: ở cỡ này
   * chúng đọc ra "lỗi hiển thị" chứ không đọc ra "bẩn".
   */
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

  /**
   * Ruồi bay quanh thớt — `n` con, phần còn lại trong hồ thì ẩn đi.
   *
   * ĐẦU QUAY THEO HƯỚNG BAY: ảnh chụp ngang quay sang TRÁI, nên bay sang phải thì lật (`flipX`),
   * chúi lên/xuống thì xoay — nhưng xoay CÓ TRẦN `FLY_TILT`, vì ruồi thật đổi hướng bằng cách
   * quay mình chứ không lộn nhào. Dấu của góc xoay phải đảo theo `flipX`.
   */
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

  /**
   * Bước 2 phát `stim` ngay trong frame — bước 3 của CÙNG frame sẽ duyệt nó.
   *
   * ⚠️ `smell` chỉ dành cho `BURNT_OR_COLD`, và nó phân biệt hai chuyện khác hẳn nhau đang đi
   * chung một `StimId`: ổ CHÁY (có mùi, khách kêu "khét") với ổ NGUỘI. Quên cờ này ở một chỗ
   * phát ổ cháy là cả hàng đứng trước ổ than đen mà than phiền bánh nguội.
   */
  private emit(id: StimId, zone?: Station["slot"], smell = false) {
    bus.emit("stim:emitted", {
      stimId: id, zone: zone ?? "HANDS", salience: SALIENCE[id], at: this.elapsed, smell,
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
    const { sx } = toScreen(board.tx + 0.5, board.ty + 0.5);
    const parked = !!this.boardLoaf && !this.assembly.isOpen;
    const warm = isWarm(this.boardWarmth);
    // Ổ gác trên thớt có origin (0,5 · 1) nên `y` CHÍNH LÀ mép dưới texture — đặt nó thấp hơn
    // mặt thớt đúng phần trong suốt thì đáy ổ chạm mặt gỗ, không lửng lơ. `boardTopY` do
    // `addBoard` tính từ chính cái thớt.
    const loafY = this.boardTopY + heldFootPad(this, this.boardLoafImg.texture.key) * this.boardLoafImg.scaleY;
    // Hình ổ gác theo ĐỘ GIÒN của chính nó, không cứng một hình "ổ nóng": ổ nướng dở
    // rồi để nguội trên thớt phải nhìn ra là đã nướng. `fitPhoto` phải gọi LẠI sau mỗi
    // `setTexture` — hình ổ nóng là ảnh artist (nướng dư pixel), hình ổ nguội-đã-nướng
    // là bản vẽ code 1:1, đổi qua lại mà không fit lại thì ổ to gấp đôi hoặc bé một nửa.
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

  /**
   * Giữ C = xoay người che tay. Hệ số occluder 0,45 chỉ được tồn tại nếu người chơi THẤY mình
   * đang che (CANON §5: không có hoạt ảnh thì không có trạng thái) — đây là mảng thân người chắn
   * giữa khách và món trên tay, cộng bóng đổ xuống thớt.
   *
   * ⚠️ CÒN THIẾU: tư thế xoay nghiêng 40° của chính nhân vật (cần sửa `entities/Player.ts`).
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
    // Nền sáng 0,78…0,98, không 0,35…0,75 như bản cũ: một vòng mờ trên gạch men trắng
    // là một vòng không ai thấy. Nhịp thở vẫn còn, chỉ là nó thở quanh một mức ĐỌC ĐƯỢC.
    const pulse = this.settings.reducedMotion ? 0.1 : Math.sin(this.time.now / 260) * 0.1;
    this.ring.setVisible(true)
      .setPosition(sx, sy)
      .setDepth(depthOf(this.near.tx + 0.5, this.near.ty + 0.5) - 2)
      .setAlpha(0.88 + pulse);
  }

  /**
   * Nhạc bám theo GIỜ TRONG NGÀY. Cố ý không có nhánh nào đọc `served`, `money` hay số lỗi: nhạc
   * phản ứng với BỐI CẢNH, không bao giờ là bảng điểm (T3). Gọi mỗi frame cũng không sao.
   */
  /**
   * Khai báo cho lớp âm thanh biết GIỜ NÀY ĐÁNG LẼ PHẢI NGHE GÌ — gọi mỗi frame, cố ý là một bức
   * ảnh chụp trạng thái chứ không phải chuỗi lệnh bật/tắt rải khắp scene (sẽ có một chỗ quên gọi).
   */
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
   * "Lưu và về sảnh" giữa lúc còn người đứng chờ. Nút vẫn ở đó, vẫn bấm một cái là đi — thoát
   * bất cứ lúc nào là TRỢ NĂNG, không được phạt.
   *
   * Nhưng cú thoát không được XOÁ hậu quả đang lơ lửng (CANON §8e). Người đang chờ KHÔNG lưu được
   * (SaveFile chưa có chỗ cho khách sống), nên họ tính là khách VỀ KHÔNG: đi qua
   * `tickNpcs(dayOver)` để `Service.leave(..., "closed")` chạy đủ, và autosave ghi TRƯỚC khi rời
   * scene. Nói trước một câu để người chơi không bị mất ba người trong im lặng.
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
   * Vía: khách mở hàng xui → cô Ba (còn ở quầy trước 6h30) rủ đốt vía. Một lần một ngày, bỏ qua
   * được, KHÔNG phạt. Đốt xong chỉ là vía xấu về 0 — không bao giờ lên +1.
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
   * Người chơi vẫn đi lại, dọn quầy được; bấm phím bất kỳ là qua màn kết. Không nhạc, không swell.
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
      this.hud.say("Cô Ba: Hết rồi hả con.");
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
