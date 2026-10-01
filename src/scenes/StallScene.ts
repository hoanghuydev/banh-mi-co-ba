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
import { Service } from "../sim/service";
import { SALIENCE } from "../sim/perception";
import { runFrame } from "../sim/frame";
import { cool, isWarm } from "../sim/loaf";
import { Steam } from "../ui/stall/Steam";
import { WipePuff } from "../ui/stall/WipePuff";
import { BubblePool } from "../ui/stall/BubblePool";
import { TalkPanel } from "../ui/stall/TalkPanel";
import { MoneyPops } from "../ui/stall/MoneyPops";
import { GossipCorner } from "../ui/stall/GossipCorner";
import { NotebookView } from "../ui/notebook/NotebookView";
import { logNote } from "../sim/notebook";
import { chorePin } from "../ui/chorePin";
import { CLAIM } from "../sim/gossip";
import { NPCS } from "../content/npcs";
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
import { StallCamera } from "../world/camera";
import { artScale, fitPhoto, BOARD_TEX, BOARD_W, BASKET_TEX, BASKET_W } from "../art/photo";
import { SIGN_TILE, WORLD_H, WORLD_W, assertWalkable, floorAt, isSunlit, tileAt } from "../world/map";
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
 * Rổ bánh nóng chứa được mấy ổ.
 *
 * Bằng số ngăn lò (`OVEN_SLOTS` = 3) chứ không hơn: cái rổ sinh ra để đỡ đúng một mẻ lò
 * vừa ra, không phải để biến thành kho bánh. Cho nhiều hơn thì người chơi nướng sẵn cả
 * chục ổ từ sáng rồi đứng chơi — mà ổ nguội là ổ khách chê, nên "tích trữ" phải là một
 * lựa chọn tồi, không phải một lựa chọn bị cấm.
 */
const BASKET_SLOTS = 3;
/**
 * Hai ổ để cạnh nhau cách nhau chừng này px, ĐO DỌC THEO MẶT QUẦY.
 *
 * 7 px là sai: ổ bánh rộng 21 px nên ba ổ chồng gần như trùng khít, nhìn vào tưởng chỉ
 * có một. 13 px cho hở ra đủ để đếm được mà vẫn ra một dãy bánh xếp liền nhau.
 *
 * Lệch theo CẢ HAI trục chứ không chỉ ngang: quầy chạy chéo trên màn hình (phép chiếu
 * iso), xê ngang không thôi thì dãy bánh cắt ngang mặt quầy thay vì nằm dọc theo nó.
 * Tỉ lệ 2:1 là đúng độ dốc của lưới (xem `world/iso`).
 */
const BASKET_STEP = 13;
/**
 * "TÊN NGƯỜI: " ở đầu dòng — dấu hiệu đây là LỜI NGƯỜI (xem `routeLine`).
 * Trần 24 ký tự cho phần tên: tên dài nhất trong game là "Cô Mai (chạy qua)" (17), còn
 * câu tường thuật nào lỡ có dấu hai chấm thì cũng nằm sâu trong câu chứ không ở đầu.
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
 * Mỗi món để quên dưới sàn làm bẩn quán chừng này mỗi giây.
 *
 * 0,004/s: một mình nó mất 87 giây mới đủ bẩn để gọi một con ruồi tới (`FLY_DIRT_MIN`
 * 0,35 tính từ mức sạch đầu ngày). Đủ chậm để đặt tạm xuống vài chục giây là chuyện
 * bình thường, đủ nhanh để quên nó cả buổi thì cả hàng khách đều thấy.
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
 * Mép TRÊN của vùng được phép vẽ dấu, tính từ đỉnh khung nhìn.
 *
 * Đo đúng theo thứ thật sự chắn: hàng icon ở đỉnh màn hình kết thúc ở y = 44, cộng bán
 * kính dấu 11 và một khe 3 px. KHÔNG mượn `HUD_BAND_PX` (74) — con số đó tính cho mấy
 * CON SỐ TIỀN bay lên (chữ, cao hơn, dễ lẫn vào nền hơn), dùng lại ở đây là đẩy dấu
 * xuống thêm 16 px vô cớ, mà cái lò thì nằm ngay hàng trên cùng bản đồ.
 */
const CHORE_TOP = 58;
/** Dấu "việc cần làm" nhô cao hơn điểm neo của trạm chừng này px — xem `drawChores`. */
const CHORE_LIFT = 26;
/** Một lượt lau trừ ít nhất chừng này độ bẩn — xem `wipeBoard`. */
const WIPE_DIRT = 0.15;
/**
 * Lau xong thì quầy sạch ÍT NHẤT tới mức này, tức bẩn 0,30 — dưới `FLY_DIRT_MIN` một
 * khoảng thấy được.
 *
 * Viết thẳng con số thay vì suy ra `1 − FLY_DIRT_MIN`: `1 − 0,35` quay về qua `dirt`
 * thành 0,35000000000000003, nhỉnh hơn ngưỡng đúng một hạt bụi dấu phẩy động, và thế
 * là lau xong vẫn còn đúng một con ruồi bay. Khoảng 0,05 này là để KHÔNG phải nghĩ về
 * chuyện đó nữa.
 */
const WIPED_CLEAN = 0.7;


/** Đỉnh đầu nhân vật tính từ điểm chạm đất — cùng con số `zonePoint` dùng cho vùng TAY. */
const HEAD_PX = 52;
/** Chiều cao dải HUD trên cùng (hộp ngày/giờ, nút trà, nút tạm dừng) ở cỡ chữ 100%. */
const HUD_BAND_PX = 74;

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
 * Thay vào đó mọi thứ nằm thẳng trên display list (có sort) và camera lo phần
 * canh khung — xem `world/camera`, chỗ đó cũng giải thích vì sao UI phải đi một
 * camera riêng khi camera thế giới có zoom.
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
  /** Bụi bốc lên lúc lau thớt — phản hồi ngay tại mặt thớt, chỗ mắt đang nhìn. */
  private wipePuff!: WipePuff;
  /**
   * Đồ đang NẰM DƯỚI SÀN (phím Q). Không phải thùng rác — đây là chỗ đặt tạm để rảnh
   * tay, nhặt lên lúc nào cũng được, món đồ giữ nguyên mọi thông số của nó.
   *
   * Có trần `FLOOR_MAX`: sàn mà chứa được vô hạn thì nó thành cái kho tiện nhất quán,
   * và rổ bánh nóng lẫn thớt đều hoá vô nghĩa.
   */
  private floor: { x: number; y: number; hand: Hand; warmth: number; crust: number; q: number; dish: Ingredient[] }[] = [];
  /**
   * Món đang cầm ĐÃ TỪNG CHẠM ĐẤT — đặt xuống rồi nhặt lên, hay rớt rồi nhặt lên.
   *
   * Cờ này đi theo ổ bánh qua mọi chặng (tay → thớt → tay → khách) đúng như `handCrust`,
   * và KHÔNG có đường nào tẩy được nó ngoài việc bỏ ổ đó đi. Nó là thứ duy nhất phân
   * biệt "ổ sạch" với "ổ vừa nhặt dưới đất lên rồi phủi phủi" — mà cái phân biệt đó
   * phải nằm ở tầng sim chứ không nằm trong trí nhớ người chơi.
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
   * Tách khỏi `labelY` vì hai cái khác nhau thật. `labelY` là đỉnh SPRITE của ô — với
   * một khúc quầy thì đó là đỉnh cả khối cao 92 px, kể cả nóc tủ kính. Cái thớt thì nằm
   * trên MẶT quầy, thấp hơn nóc tủ 38 px. Neo dấu theo `labelY` là dấu "thớt dơ" lơ lửng
   * cách cái thớt 64 px, trỏ vào khoảng không — đúng lỗi người chơi báo.
   *
   * Vật đứng trên sàn (lò, bồn rửa, thùng rác) thì hai mốc trùng nhau; chỉ mấy thứ GÁC
   * TRÊN QUẦY mới phải ghi riêng, và chúng ghi ở `addBoard` / `addBasket`, nơi đã biết
   * mặt quầy nằm ở đâu.
   */
  private choreAt = new Map<string, { x: number; y: number }>();
  /** Nhãn trạm + chỗ "nhà" của nó — xem `drawLabels`. */
  /** Độ chắc tay với món đang cầm (P1-01 §2.7). */
  private grip = new Grip();
  private gripGfx!: Phaser.GameObjects.Graphics;
  /**
   * Tay bận tới giây này — đi được, làm không được.
   *
   * Bốn field đi CÙNG NHAU, luôn đặt qua `beBusy()`:
   *   · `handsBusyUntil` — hết bận lúc nào
   *   · `handsBusyFrom`  — bắt đầu lúc nào, để vẽ được thanh tiến trình
   *   · `handsBusyWhat`  — ĐANG LÀM GÌ, để nói đúng tên việc
   *   · `handsBusyBar`   — việc này có đáng một thanh không (xem `beBusy`)
   *
   * `handsBusyWhat` ra đời từ một lỗi đọc được: lau thớt xong bấm E lần nữa thì máy báo
   * "tay đang bận" trong lúc tay rõ ràng đang trống. Câu đó KHÔNG sai — tay đang bận
   * LAU, còn 2,5 giây nữa mới xong — nhưng nó dùng đúng chữ của mấy câu từ chối vì
   * "đang cầm đồ", nên người chơi đọc ra là máy nói nhảm. Chữa bằng cách nói đúng việc
   * ("đang lau thớt…") và cho cái việc đó một THANH TIẾN TRÌNH nhìn thấy được, chứ
   * không phải bằng cách bỏ cái khoá đi.
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
    // ⚖️ CÂN BẰNG — `burnAt` lò gas 1,25 → 1,70, đi kèm `CRUST.BURNT` 1,00 → 1,30 (xem
    // `sim/oven.ts`). P3-04 A1 hứa lò gas "nướng nhanh hơn, và cửa sổ trước khi cháy RỘNG
    // HƠN"; vì `rateMul` 1,35 bóp mọi cửa sổ lại 1/1,35, ngưỡng cháy phải nới theo mới
    // giữ được lời hứa: READY→BURNT 12,7 s (lò gas) so với 11,7 s (lò than).
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
    if (!this.resumed) this.clock.reset();
    this.clock.paused = false;
    // CANON §15.2 / P0-02 §2.2: đồng hồ VẪN trôi, chỉ chậm một nửa.
    this.clock.scaleMul = this.settings.noTimePressure ? 0.5 : 1;
  }

  private get world() { return this.ctx.world; }

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
    this.cameras.main.setBackgroundColor("#6f838d");

    this.ring = this.add.image(0, 0, FX.ring).setOrigin(0.5, 0.5).setVisible(false);

    this.player = new Player(this);
    this.player.reset();

    this.hud = new Hud(this, this.settings, () => (this.paused ? this.resume() : this.pause()));
    this.talk = new TalkPanel(this, (i) => this.pickTalk(i), () => this.ignoreTalk());
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
     * Lớp âm thanh của quán. Dựng SAU `service` vì nó hỏi `service` chỗ từng khách
     * đứng để pan tiếng về đúng phía (P5-03 §2.4), và dùng chung dòng `ambient` của
     * scene chứ không tự đẻ thêm một nguồn ngẫu nhiên nữa.
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
     * P5-03 — tiền vào/ra bay lên trên đầu.
     *
     * Nghe `money:changed` chứ không gắn vào từng chỗ trả tiền: mọi đường tiền của buổi
     * bán đã đi qua đúng event này rồi (bán hàng, trả nợ cũ, ly trà, và từ P5-02 là tiền
     * mua vé số + chỗ bớt cho khách). Thêm một đường tiền mới mai mốt là nó tự có số bay.
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
     * P5-06 — "việc mình vừa làm có ăn thua gì không?"
     *
     * Trước đây quan hệ là một con số HOÀN TOÀN ẩn: cho thêm đồ chua, nhớ món quen, để
     * khách chờ — tất cả chỉ hiện ra sau mấy ngày, qua tiền boa và tần suất ghé. Người
     * chơi không học được luật chơi vì không bao giờ thấy nhân với quả cạnh nhau.
     *
     * T3 KHÔNG bị phá: ở đây vẫn không có con số, không có tổng, không có thanh. Chỉ
     * một dòng chữ nói HƯỚNG và cái VIỆC vừa làm ra nó, rồi tắt — cũng là mức thông tin
     * mà một người bán hàng thật đọc được từ nét mặt khách.
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
     * P2-04 — lời đồn phải ĐẬP VÀO MẶT ít nhất một lần.
     *
     * Tin đồn vốn chỉ hiện ra qua ba đường rất kín: một câu khách buột miệng ở quầy, một
     * cảnh nghe lỏm ở góc hẻm, và một hệ số nhân thầm lặng vào tiền boa. Hai đường đầu
     * trôi qua trong hai giây giữa lúc đang kẹp bánh, đường thứ ba thì không ai thấy.
     * Kết quả là người chơi bị tin đồn làm cho ế mà không biết có tin đồn.
     *
     * Dòng này KHÔNG phải cái badge "tin đồn mới!" mà `GossipCorner` cấm: nó không mọc
     * ở góc hẻm, không bắt đi xem, không đếm. Nó chỉ nói lại thành chữ đúng cái vừa xảy
     * ra trước mắt, ở chỗ người chơi đang nhìn.
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
   * Mép đường đi của camera: hình bao THẬT của những gì đã dựng.
   *
   * Phải là hình bao thật chứ không phải hình bao của lưới ô — tường cao nhô lên trên
   * hàng đầu tiên cả trăm pixel, lấy theo lưới là camera trượt tới mép trên sẽ hở một
   * khoảng trời trống. Nền nướng sẵn (`bakeGround`) lo phần sàn, đạo cụ lo phần nhô cao.
   */
  private sceneBounds(ground: Phaser.Geom.Rectangle, props: Phaser.GameObjects.Image[]) {
    const bounds = Phaser.Geom.Rectangle.Clone(ground);
    for (const img of props) Phaser.Geom.Rectangle.Union(bounds, img.getBounds(), bounds);
    return bounds;
  }

  /**
   * Nền không bao giờ đổi -> nướng hết vào MỘT RenderTexture.
   * Gọi drawFrame() cho từng ô riêng lẻ sẽ tụt fps thấy rõ khi map to ra.
   *
   * Trả về hình bao của nền — `sceneBounds` cần nó để chặn đường đi của camera.
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
   * Đặt một texture vào ô (tx, ty) theo đúng luật của `art/canvas.ts`.
   *
   * `artScale` là chỗ ảnh thật và hình vẽ-bằng-code gặp nhau: ảnh thật được
   * `photo.ts` nướng dư pixel ra cho khỏi mờ, nên sprite phải thu lại đúng từng ấy
   * lần mới về cỡ thiết kế. Hình vẽ bằng Graphics trả về 1 nên không suy suyển.
   * Thu quanh origin (0.5, 1) nên điểm chạm đất không nhúc nhích.
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
   * Thớt gỗ đặt lên mặt quầy ở trạm `board`.
   *
   * Đặt theo MỐC CỦA CHÍNH KHÚC QUẦY (`img`), không theo lưới ô: mặt quầy cao hơn mặt
   * đất, mà `footY` thì chỉ biết mặt đất. Origin (0,5 · 1) nghĩa là MÉP DƯỚI của thớt
   * chạm vạch mặt quầy — nhờ vậy ảnh render lại dày mỏng thế nào cũng vẫn nằm đúng chỗ,
   * không phải chỉnh lại con số nào.
   *
   * Depth bám theo ô của nó chứ không dùng `LABEL_DEPTH`: thớt là vật trong cảnh, người
   * chơi đi ra phía trước quầy thì phải che được nó.
   */
  /**
   * Đặt một vật NẰM TRÊN mặt quầy (thớt, rổ bánh). Trả về sprite, hoặc null nếu chưa
   * có ảnh — khi đó khúc quầy để trơn, đúng lệ "thà thiếu một món đạo cụ còn hơn một ô
   * vuông xanh lè" của `placeProps`.
   *
   * Mốc là MẶT QUẦY, không phải mặt đất — `COUNTER.TOP_ABOVE_FOOT` lo phần đó, đo từ
   * mép dưới sprite khúc quầy nên không phụ thuộc chiều cao texture.
   *
   * Origin (0,5 · 1) là mép TRƯỚC của ê-líp đáy, thấp hơn tâm đáy đúng 1/4 bề ngang —
   * vì phép chiếu ép mọi hình tròn nằm ngang về 2:1.
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
   * Bỏ sprite cái rổ đi vì hai lẽ. Một: nó không chứa được ổ ĐÃ GÓI, mà gói sẵn mấy ổ
   * lúc vắng rồi bán nhanh lúc đông mới là thứ người chơi cần chỗ để. Hai: ổ bánh gác
   * lên "miệng rổ" là gác lên một con số ước lượng từ bề cao sprite (×0,72) — nhìn ra
   * ngay là ổ bánh bay lơ lửng trên không. Đặt thẳng lên MẶT QUẦY thì chiều cao lấy từ
   * `COUNTER.TOP_ABOVE_FOOT`, cùng con số cái thớt đang dùng, nên không đoán gì cả.
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
   * Ghi lại ĐIỂM NEO trên đỉnh mỗi trạm. Không còn vẽ cái tên nữa.
   *
   * Bảy ô chữ đen nổi lềnh bềnh trên quầy là bảy thứ che mất chính cái quán, và chúng
   * nói một điều người chơi học thuộc sau hai phút rồi không bao giờ cần đọc lại. Cái
   * lò trông ra cái lò, cái bồn rửa trông ra cái bồn rửa. Thứ người chơi THẬT SỰ cần
   * biết — đứng gần cái gì, bấm được gì — vẫn còn nguyên và còn rõ hơn: vòng sáng dưới
   * chân trạm (`drawRing`) và dòng nhắc dưới màn hình (`promptLine`) gọi đúng tên nó.
   *
   * Điểm neo thì vẫn phải ghi: vòng độ giòn của lò, dấu `!` việc cần làm và đàn ruồi
   * đều treo theo nó.
   *
   * Neo là toạ độ THẾ GIỚI, đặt một lần lúc dựng cảnh và không bao giờ đổi nữa. Trước
   * đây mỗi frame nó còn bị kẹp vào trong khung nhìn — cái kẹp ấy sinh ra để lôi chữ ra
   * khỏi dải HUD, mà khung nhìn thì đi theo người chơi, nên bỏ chữ đi rồi thì nó chỉ còn
   * làm đúng một việc: kéo ba cái vòng độ giòn CHẠY THEO CHÂN người chơi thay vì nằm yên
   * trên cửa lò. Vật trong thế giới thì phải đứng yên trong thế giới.
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

  /**
   * Kẹp nhãn trạm vào trong khung nhìn, mỗi frame.
   *
   * Mấy trạm ở hàng trên cùng (tủ bánh, lò) có nhãn nằm cao hơn đỉnh đạo cụ, mà đỉnh
   * đạo cụ đã gần sát mép trên của `setBounds` — camera trượt hết cỡ vẫn không kéo nổi
   * cái nhãn vào khung, nên nó bị cắt cụt đúng lúc người chơi cần đọc tên trạm nhất.
   * Mở rộng `ZOOM` đỡ được phần lớn, nhưng ở cỡ chữ 200% hay màn hình lạ thì vẫn hụt —
   * kẹp là cách duy nhất đúng với MỌI cỡ.
   *
   * Nhãn bị kẹp thì mấy chỉ báo neo theo nó (vòng độ giòn của lò, dấu chấm than, ruồi)
   * phải đi theo, nên `labelY` được viết lại bằng vị trí ĐÃ KẸP chứ không phải vị trí nhà.
   */



  // ───────────────────────────────────────────────────────────────────── input

  private bindInput() {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys("W,A,S,D,UP,LEFT,DOWN,RIGHT,E,SPACE,Q,R,ESC,SHIFT,C,F,P") as any;

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
        this.clock.busy = this.service.busy || this.finaleAt >= 0;
        return this.closed ? 0 : this.clock.advance(raw);
      },
      input: (dt) => {
        /*
         * ĐANG LÀM THÌ ĐỨNG YÊN — lau thớt, rót trà, rửa tay, nhận tiền, ghi sổ.
         *
         * Trước đây mấy thao tác đó chỉ khoá PHÍM chứ không khoá CHÂN: người chơi vẫn
         * chạy khắp quán trong lúc giẻ lau còn đang trên thớt và vòi nước còn đang chảy.
         * Vừa phi lý vừa làm mất luôn cái giá của thao tác — "mất 2,5 giây" mà 2,5 giây
         * đó vẫn đi lấy bánh được thì nó không tốn gì cả.
         *
         * Truyền input TOÀN `false` chứ không bỏ qua lời gọi `move()`: bỏ qua thì
         * `Player` giữ nguyên cờ `moving` và cái nhún bước chân của frame trước — nhân
         * vật đứng một chỗ mà vẫn nhấp nhô như đang đi.
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
      render: (dt) => { this.syncAudio(dt); this.renderSync(); },
      // Pause: `dt` = 0 nên hẻm không đẻ thêm tiếng xe và bước chân đứng im, nhưng
      // nền vẫn kêu — §6.5 #8: "pause phải thấy an toàn, không thấy trống rỗng".
      renderPaused: () => { this.syncAudio(0); this.renderSync(); },
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
    // Camera bám chân người chơi, không bám đỉnh đầu: chân mới là chỗ nhân vật THẬT SỰ
    // đứng trên lưới, bám đỉnh đầu thì camera giật một nấc mỗi lần nhún.
    const p = toScreen(this.player.x, this.player.y);
    this.cam.lookAt(p.sx, footY(p.sy));
    this.syncActors();
    this.syncMusic();
    // Hình ổ bánh trên tay theo ĐỘ GIÒN, không chỉ theo nóng/nguội (xem `art/held.heldTexture`):
    // ổ nướng dở rồi để nguội phải nhìn ra là đã nướng, không được quay về hình bột sống.
    this.player.heldCrust = this.handCrust;
    this.player.draw(this.settings.reducedMotion, this.keys.C.isDown);
    for (const a of this.actors.values()) a.draw(this.settings.reducedMotion, this.time.now, this.elapsed);
    this.moneyPops.update(this.tickPopClock(), this.settings.reducedMotion);
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
   * Có ai đang để mắt tới mình không — nguồn của con mắt ở đỉnh màn hình (`Hud.drawEye`).
   *
   * Đọc THẲNG từ máy trạng thái ánh nhìn chứ không từ `certainty`: con mắt phải sáng
   * TRƯỚC khi mình làm bậy, không phải sau khi đã bị bắt. Người đang tới / đã quay lưng
   * về thì không tính — họ không còn soi tay mình nữa.
   *
   * LOOK_HANDS là bậc duy nhất đáng gọi là "bị soi" (gazeFactor 1,00 trong `GAZE_TABLE`);
   * LOOK_FACE chỉ là có người để ý tới mình. Mấy bậc còn lại — điện thoại, ly trà, ngó
   * quanh, liếc đồng hồ — đều đã có đạo cụ riêng trên đầu khách, không gọi con mắt dậy.
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
   * Nhích đồng hồ hiệu ứng. Đứng yên khi pause (menu, sổ tay, bảng trò chuyện) nên số
   * tiền treo nguyên tại chỗ chờ người chơi đọc xong; `CLOCK_DT_CLAMP_MS` để tab bị nền
   * lại rồi mở ra không ăn một bước nhảy năm giây trong một frame.
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
    // Dòng cuối cùng, sau mọi việc của cái quán: có người trong tầm với mà KHÔNG đứng ở
    // quầy — người xếp cuối hàng, hay người đang đi ngang ngoài đường. Phải nói ra, vì
    // "lại gần ai cũng nói chuyện được" là một luật mới: không ai đoán ra nếu không được
    // chỉ, và người chơi đã học suốt mấy ngày rằng F chỉ dành cho người đứng trước mặt.
    const who = this.service.nearbyToTalk();
    if (who && !this.talk.isOpen) return `F — nói chuyện với ${this.service.label(who)}`;
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
  /**
   * Khách `npcId` đang đứng lệch về phía nào — P5-03 §2.4.
   *
   * Tính theo KHOẢNG CÁCH THẬT trong thế giới chứ không tra bảng slot: bảng ở §2.4
   * ghi sẵn ±0,25 cho `FRONT_SIDE` và ±0,35 cho `QUEUE_2/3`, nhưng chính người chơi
   * cũng DI CHUYỂN dọc quầy — đứng ở bồn rửa tay (x=15) thì người xếp hàng thứ ba
   * nằm hẳn bên trái, chứ không còn bên phải như lúc đứng ở kệ. Lấy theo vị trí thì
   * đúng trong cả hai trường hợp mà không phải thêm nhánh nào.
   *
   * Trần 0,6 chứ không 1,0: quầy bánh mì rộng chừng chục bước, pan hết biên nghe như
   * khách đứng ngoài khung hình.
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
   * `Service` đẩy ra một dòng chữ — nó thuộc kênh nào?
   *
   * LỜI NGƯỜI luôn có dạng `TÊN NGƯỜI: câu nói` — `service.ts` và `talk.ts` đều dựng
   * đúng khuôn đó ("con: …", "Bà Bảy: …", "Cô Mai (chạy qua): …"). Lời tường thuật thì
   * KHÔNG bao giờ có cái tiền tố ấy ("bà Bảy bỏ đi — chờ lâu quá", "hết tiền lẻ"), nên
   * nó đi lên dải thông báo.
   *
   * Dấu ngoặc kép KHÔNG dùng để nhận ra được: chỉ một phần câu thoại có ngoặc (câu trả
   * lời trong bảng trò chuyện), còn câu khách gọi món thì không — lấy ngoặc làm mốc là
   * đẩy đúng câu gọi món sang nhầm cột, mà đó là câu quan trọng nhất màn hình.
   *
   * Phân loại ở ĐÂY chứ không bắt `Service` tự gắn nhãn, vì `Service` là tầng sim — nó
   * không được biết HUD có mấy kênh chữ. Ngày nào sim cần nói rõ hơn thì thêm field vào
   * chính event, chỗ này đọc field đó thay vì đọc khuôn chữ.
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
      if (ev.kind === "talkOffer") {
        this.hud.toast(`${ev.name} bắt chuyện — bấm F để trả lời`, "info", this.popClock);
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
    const sec = this.workSeconds(2.0);
    this.beBusy(sec, "đang ghi sổ");
    this.audio.writeFor(sec);                    // lật sổ rồi mấy nét bút, suốt lượt ghi
    this.hud.toast(`đã ghi sổ: ${p.name} ${p.record.trueAmount.toLocaleString("vi-VN")}₫`, "good", this.popClock);
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

    if (!this.busy || this.busy.st.id !== st!.id) {
      this.busy = { st: st!, ms: 0 };
      /*
       * Tiếng của một thao tác GIỮ PHÍM nổ ở ĐÂY, lúc bắt đầu giữ — không phải ở
       * `finish`, lúc đã xong.
       *
       * Rót trà mất 0,6 giây (0,25 với bình trà). Đặt tiếng rót ở `finish` thì nó
       * bắt đầu kêu đúng lúc ly trà đã đầy và đã nằm trên tay — nghe ra ngay là
       * sai, vì tai biết tiếng nước chảy phải trùng với lúc nước đang chảy. Cùng
       * một lỗi với việc để dư im lặng ở đầu file foley, chỉ là ở quy mô nửa giây
       * thay vì 300 mili-giây.
       *
       * Vòi rửa tay không nằm ở đây vì nó là một VÒNG LẶP chạy suốt lượt giữ
       * (`syncAudio` -> `washing`), tự tắt đúng lúc nhả phím.
       */
      if (st!.id === "tea") this.audio.tea();
    }
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
      // E Ở THỚT CHỈ CÓ MỘT NGHĨA: "làm việc với cái đang nằm trên thớt".
      //
      // Trước đây cùng một phím E là ba việc khác nhau tuỳ trạng thái — mở bảng kẹp
      // nhân, hay cầm ổ lên, hay lau thớt — mà trạng thái quyết định lại là thứ người
      // chơi không nhìn thấy (ổ còn ấm hay đã nguội). Kết quả: cùng một thao tác tay,
      // lúc ra bảng kẹp nhân lúc ra ổ bánh trên tay. Cầm ổ lên giờ là phím R riêng
      // (`liftFromBoard`), nên E không còn đoán ý ai nữa.
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
   * Rổ bánh nóng — trạm HAI CHIỀU, giống hệt lò: tay đang cầm ổ thì GÁC xuống, tay không
   * thì LẤY ổ giòn nhất lên.
   *
   * Lấy ổ GIÒN NHẤT chứ không phải ổ để lâu nhất: người chơi gác ổ vào rổ là để dành ổ
   * ngon cho khách tới, nên cái họ muốn lấy ra bao giờ cũng là ổ tới độ nhất. Ổ nguội
   * nằm lại thì chính họ sẽ phải quyết định cầm đi nướng lại hay bỏ — đó là một lựa
   * chọn, không phải một hình phạt giấu mặt.
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
     * Lấy ổ NÀO: ấm trước, rồi mới tới giòn.
     *
     * Bấm E ở đây với hai tay không thì ý người chơi luôn là "đưa tôi cái bán được
     * ngay". Ổ nguội là ổ khách chê (`WRONG_TEMP` lúc đưa), nên ổ còn ấm bao giờ cũng
     * được rút trước — và trong đám còn ấm thì ổ giòn nhất, đúng luật cũ. Chỉ khi cả
     * chỗ này nguội hết thì mới phải cầm một ổ nguội lên, mà lúc đó người chơi cũng
     * chẳng còn lựa chọn nào khác để mà bực.
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
   * Phím R — cầm ổ đang gác trên thớt lên.
   *
   * Phím RIÊNG chứ không chung E: ổ nguội ngắt thì việc đúng là cầm ra lò nướng lại
   * (`Oven.put` giữ nguyên phần vỏ đã có, nướng lại không phải nút reset độ giòn miễn
   * phí), còn ổ còn ấm thì việc đúng là kẹp tiếp — hai việc trái ngược nhau mà xưa nay
   * đi chung một phím. Giờ E luôn là "kẹp", R luôn là "cầm lên", bất kể ổ nóng hay nguội.
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
   * Gói ổ bánh lại. So ngay với đơn của người đang đứng trước mặt: nếu sai, phát
   * `ORDER_DEFECT` tại slot BOARD — khách ĐANG NHÌN thì sẽ thấy, và lúc đưa bánh
   * họ nói câu "tôi thấy con quên bỏ hành rồi đó" thay vì "ủa… thiếu hành rồi".
   * Đó chính là trụ cột T1 dưới dạng kỹ thuật (CANON §6).
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
    //
    // P1-01 §2.11 ghi 2,0 s; chơi thử thì con số đó sai hẳn cảm giác. Nhận tiền không
    // phải một thao tác có tay nghề — nó không hỏng được, không có gì để canh, không
    // đánh đổi gì. Hai giây đứng chôn chân sau MỖI lượt khách, giờ cao điểm là hàng
    // chục lần, chỉ còn là thời gian chết giữa hai việc thật. 0,8 s vẫn đủ để thấy tay
    // mình bận và vẫn giữ nguyên cái giá thật của nó: tay DÍNH TIỀN cho tới khi đi rửa.
    if (wasDish) {
      this.hands = "MONEY";
      this.audio.money();
      this.beBusy(this.workSeconds(TAKE_MONEY_SEC), "đang nhận tiền", "quick");
    }
    // Autosave sau mỗi khách: DayScene nghe `npc:left` (P0-02 §2.6).
  }

  /**
   * Khoá tay lại `sec` giây để làm `what`. MỌI chỗ khoá tay phải đi qua đây — khoá mà
   * không nói đang làm gì thì người chơi lại gặp đúng cái "tay đang bận" vô duyên cũ.
   *
   * `how` chia việc làm hai loại, và nó là chuyện CẢM GIÁC chứ không phải chuyện số giây:
   *
   *   · `"bar"` — việc phải ĐỨNG CHỜ: lau thớt, ghi sổ, băng tay. Người chơi nhìn thanh
   *     để biết còn bao lâu, và biết là chờ chứ không phải máy từ chối.
   *   · `"quick"` — động tác cúi người / chìa tay: đặt xuống, nhặt lên, bỏ vô thùng, nhận
   *     tiền. Xong trước khi mắt kịp liếc xuống chân màn hình, nên cái thanh chỉ kịp loé
   *     một cái rồi tắt — nhiễu, không phải thông tin. Tay vẫn khoá, dòng nhắc vẫn nói
   *     đang làm gì; chỉ cái thanh là bỏ.
   *
   * Cố ý KHÔNG tự suy ra từ `sec`: giữ C (che tay) nhân mọi thao tác lên 1,3×, mà "nhận
   * tiền" chậm đi thì vẫn là nhận tiền — không được tới một ngưỡng nào đó rồi tự mọc thanh.
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
   * Cầm một món lên. MỌI đường cầm đều đi qua đây.
   *
   * `handSoiled` reset về `false` ngay tại đây, rồi chỗ gọi nào biết ổ đó thật sự dính
   * đất thì tự bật lại (nhặt dưới sàn, lấy từ rổ, cầm từ thớt). Đây là chỗ sửa một lỗi
   * đã đọc được trong lúc chơi: trước đây cờ bám theo BÀN TAY chứ không theo Ổ BÁNH,
   * nên nhặt một ổ rớt lên rồi bỏ nó đi và cầm ổ khác thì cái cờ vẫn còn — khách từ
   * chối một ổ chưa từng chạm đất. Cờ phải là thuộc tính của ổ bánh, y như `handCrust`.
   */
  private pickUp(hand: Station["gives"]) {
    this.player.hand = hand;
    this.handSoiled = false;
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

  /**
   * Lau thớt mất bao lâu — CÀNG BẨN CÀNG LÂU.
   *
   * Trước đây lau lúc nào cũng đúng 2,5 giây, nên bỏ bê cái quầy cả buổi không tốn thêm
   * một giây nào: người chơi tối ưu là người không bao giờ lau cho tới lúc ruồi bay, rồi
   * lau một phát sạch bong. Bẩn phải ĐẮT DẦN thì "lau tranh thủ lúc vắng" mới là một
   * lựa chọn thật.
   *
   * Nhân từ ×1,0 ở mức sạch bong tới ×2,0 ở mức bẩn nhất — tức 2,5 s lên tới 5,0 s, một
   * quãng dài đủ để mất một người khách đang chờ. Chưa gấp ba để không thành cái vòng
   * xoáy mà `wipeBoard` vừa gỡ ra: bẩn quá thì lau lâu, nhưng vẫn luôn là MỘT lượt lau.
   *
   * Khăn ba màu (`KHAN_3_MAU`) rút ngắn phần gốc chứ không rút phần phạt — mua đồ nghề
   * làm mình nhanh hơn, không làm cái bẩn biến mất.
   */
  private wipeSeconds() {
    const base = has(this.world.equipment, "KHAN_3_MAU") ? 1.2 : 2.5;
    return base * (1 + this.dirt);
  }

  /**
   * Lau thớt. MỘT lần là hết ruồi, dù quầy đang bẩn tới đâu.
   *
   * Trước đây mỗi lượt chỉ trừ 0,15 nên quầy bẩn 0,95 phải lau năm lượt — mỗi lượt 2,5
   * giây tay bận — mới đuổi được ruồi, mà trong năm lượt đó khách vẫn tới. Đó là cái
   * vòng xoáy không gỡ ra được, chứ không phải một lựa chọn khó.
   *
   * Vẫn trừ ÍT NHẤT `WIPE_DIRT` như cũ, nên lau lúc quầy đã sạch sẵn vẫn có ích cho hai
   * ngưỡng 0,5 và 0,7 — chỉ là không bao giờ DỪNG ở mức còn ruồi.
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
  /**
   * Phím Q — ĐẶT XUỐNG SÀN, và nhặt lại.
   *
   * Trước đây Q là "bỏ vô thùng": bấm ở bất cứ đâu, món đồ bốc hơi tại chỗ. Vừa không
   * có thật (thùng rác duy nhất nằm ngoài vỉa hè) vừa là một cú xoá không lấy lại được
   * nằm dưới một phím bấm nhầm rất dễ. Giờ Q chỉ đặt xuống — món đồ còn nguyên đó, còn
   * nguyên độ nóng và độ giòn của nó, nhặt lên lúc nào cũng được. Muốn bỏ thật thì đi
   * tới thùng rác trong quầy và bấm E (`finish` nhánh `bin`).
   *
   * Nhờ vậy cú "lỡ tay" rẻ hẳn đi, mà cũng gỡ được thế kẹt kinh điển: đang cầm ổ nóng
   * thì khách đòi ly trà — đặt ổ xuống, rót trà, đưa, nhặt ổ lên.
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
   * Phát `DROPPED_FOOD` kể cả khi ĐẶT CÓ CHỦ Ý, không chỉ khi rớt. Nếu chỉ cú rớt mới
   * phát thì có ngay một kẽ hở: bấm Q đặt xuống rồi nhặt lên là một cách rửa sạch lý
   * lịch ổ bánh — khách không bao giờ "thấy" nên không bao giờ từ chối. Mà ngoài đời
   * thì đặt ổ bánh xuống đất ngay trước mặt người ta cũng khó coi y như làm rớt.
   *
   * Phát ra KHÔNG có nghĩa là bị bắt: tầng nhận thấy vẫn quyết theo chỗ đứng, hướng
   * nhìn và độ che của từng người (CANON §5). Đặt xuống lúc cả hàng đang bấm điện thoại
   * thì không ai hay — và đó đúng là lựa chọn mà T5 muốn người chơi được cân nhắc.
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
   * F — bắt chuyện với người trước quầy (hoặc trả lời người vừa bắt chuyện với mình).
   *
   * Chỉ còn MỘT đường: mở bảng lựa chọn và ĐÓNG BĂNG đồng hồ. Đường lui cũ (rút một câu
   * xã giao từ túi `askPlayer`) đã bỏ hẳn — chính nó là cái bug ban đầu: câu người chơi
   * và câu khách rút từ hai túi độc lập nên không bao giờ ăn khớp nhau.
   *
   * Không có chuyện để nói thì nói thẳng ra vậy, chứ không im: bấm một phím mà màn hình
   * không nhúc nhích thì người chơi tưởng phím hỏng.
   */
  private askFront() {
    if (this.handsBusy || this.paused || this.closed || this.talk.isOpen) return;
    const view = this.service.openTalk();
    if (view) { this.openTalkPanel(view); return; }
    this.hud.toast(this.service.talkUnavailable(), "info", this.popClock);
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
    for (const l of this.service.drainLogs()) this.routeLine(l);
    if (!next) { this.closeTalkPanel(); return; }
    // Nhịp cuối: vẫn vẽ bảng một lần nữa để người chơi ĐỌC được câu đáp cuối cùng, rồi
    // Enter mới đóng. Đáp xong đóng cái rụp là mất đúng câu quan trọng nhất của cuộc.
    this.talk.show(next);
    if (!next.done) return;
  }

  /** Esc giữa chừng = làm thinh. Service tính tiền cho nó (`talk.ignore`). */
  private ignoreTalk() {
    this.service.closeTalk();
    for (const l of this.service.drainLogs()) this.routeLine(l);
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
   * Vì sao cần, trong khi hai thứ đó ĐÃ có tín hiệu riêng: ruồi bay quanh thớt, icon
   * bàn tay cầm tờ tiền ở HUD. Vì cả hai đều là tín hiệu "tình trạng", đọc được khi
   * người chơi ĐÃ nhìn đúng chỗ — mà lúc đông khách thì mắt họ ở trên mặt khách và
   * trên tay mình, không ai đi soi mấy con ruồi. Dấu này nói thêm một điều khác hẳn:
   * ĐI TỚI ĐÂY, BẤM MỘT CÁI, HẾT. Nó chỉ mọc trên trạm nào giải quyết được bằng một
   * thao tác có thật, và tắt ngay khi việc xong.
   *
   * KHÔNG phải một danh sách nhiệm vụ: không đếm, không xếp hạng, không ép làm. Bỏ qua
   * nó cả buổi thì vẫn bán được hàng, chỉ là bẩn và khách thấy.
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
   * Ổ bánh đang nằm trong rổ.
   *
   * Vẽ ĐÚNG SỐ ổ đang có, mỗi ổ một sprite riêng với hình theo độ giòn của CHÍNH NÓ —
   * gác một ổ vàng rượm cạnh một ổ nướng dở thì nhìn vào phải phân biệt được, không thì
   * cái rổ thành một con số đếm trá hình và người chơi lại phải nhớ trong đầu.
   *
   * Xếp so le sang phải và nhích lên theo từng ổ: ba ổ chồng đúng một chỗ thì chỉ đọc
   * ra là một ổ.
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
      // Xếp so le sang phải, KHÔNG nhích lên: nhích lên là ổ thứ ba lơ lửng trên mặt
      // quầy. Mỗi ổ lùi một chút theo cả hai trục cho ra chiều sâu của phép chiếu.
      // Xếp dọc theo mặt quầy: quầy chạy chéo trên màn hình nên nhích ngang bao nhiêu thì
      // nhích dọc đúng một nửa ngần ấy (độ dốc lưới iso), không thì dãy bánh cắt ngang
      // mặt quầy. `LOAF_SINK` cho đáy ổ chạm thật vào mặt gỗ chứ không treo bên trên.
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
   * Món đang nằm dưới sàn (phím Q).
   *
   * Vẽ ở ĐÚNG chỗ đặt, với depth theo ô của chỗ đó — nằm dưới chân người chơi thật chứ
   * không lửng lơ, và người đi qua trước mặt nó thì che nó. Hình theo độ giòn của chính
   * món đó, y như trên tay và trong rổ: một ổ đã nướng đặt xuống sàn không được hoá
   * thành ổ bột sống chỉ vì nó rời tay.
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
   * `ui/chorePin` — thuần, không Phaser, có test quét cả ngàn vị trí. Nó đã sai hai lần
   * liên tiếp hồi còn viết thẳng ở đây, mà lần nào cũng phải chơi thật mới lòi ra.
   *
   * Nhỏ lại 0,8 lần lúc bị ghim: để mắt phân biệt "việc ở ngay đây" với "việc ở ngoài
   * kia" mà không phải đọc gì thêm.
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
   * Độ bẩn nhìn thấy được = RUỒI, hết (P1-02 §2.10).
   *
   * Mấy chấm vụn bánh và vệt dầu vẽ bằng code đã bỏ: ở cỡ này chúng chỉ là mấy đốm
   * vàng lấm tấm trên mặt thớt, đọc ra "lỗi hiển thị" chứ không đọc ra "bẩn". Con ruồi
   * thì nhìn phát biết ngay, và nó mới là thứ khách phản ứng theo.
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
   * ĐẦU QUAY THEO HƯỚNG BAY. Ảnh ruồi chụp NGANG và quay sang TRÁI, nên:
   *  · bay sang phải  -> lật ảnh (`flipX`), lúc đó mũi quay sang +x;
   *  · chúi lên/xuống -> xoay, nhưng xoay CÓ TRẦN `FLY_TILT`.
   *
   * Trần đó là phần quan trọng. Xoay đủ 360° theo vận tốc thì ở quãng bay gần như
   * thẳng đứng con ruồi dựng ngược hoặc nằm ngửa — ruồi thật đổi hướng bằng cách
   * quay mình, không lộn nhào, nên nhìn là thấy sai ngay.
   *
   * Dấu của góc xoay phải đảo theo `flipX`: ảnh đã lật thì chiều quay cũng lật.
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
    const { sx } = toScreen(board.tx + 0.5, board.ty + 0.5);
    const parked = !!this.boardLoaf && !this.assembly.isOpen;
    const warm = isWarm(this.boardWarmth);
    // Nằm trên MẶT THỚT, không lửng lơ cách mặt quầy một quãng gõ tay: `boardTopY` do
    // `addBoard` tính từ chính cái thớt. Lùi thêm một phần tư bề cao ảnh thì đáy ổ mới
    // chạm mặt thớt — origin của ảnh ổ bánh nằm ở GIỮA ảnh, không ở đáy.
    // Ổ gác trên thớt: origin (0,5 · 1) nên `y` CHÍNH LÀ mép dưới texture — đặt nó thấp
    // hơn mặt thớt đúng phần trong suốt thì đáy ổ chạm mặt gỗ.
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
  /**
   * Khai báo cho lớp âm thanh biết GIỜ NÀY ĐÁNG LẼ PHẢI NGHE GÌ — gọi mỗi frame.
   *
   * Cố ý là một bức ảnh chụp trạng thái, không phải một chuỗi lệnh bật/tắt rải khắp
   * scene: trời chuyển mưa, lò nguội, quầy sạch lại — mỗi chuyện đó xảy ra ở một chỗ
   * khác nhau trong file này, và sẽ có một chỗ quên gọi.
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
    // Emitter không phải tween nên `tweens.pauseAll()` không đụng tới nó — bụi sẽ phun
    // đều sau tấm che pause nếu không tắt bằng tay.
    this.wipePuff.setPaused(true);
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
