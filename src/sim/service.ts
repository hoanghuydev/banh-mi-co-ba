import { Rng, type RngHub, type BagState } from "../core/rng";
import { Barks } from "../content/lines";
import { Query } from "../dialog/facts";
import { Speaker, type DialogState } from "../dialog/speaker";
import type { Rule } from "../dialog/ruledb";
import { NPCS, WALKIN_NAMES, WALKIN_STYLES, type NpcDef, type Personality } from "../content/npcs";
import { DAY_END_MIN, DAY_START_MIN, PEAK_END_MIN, PEAK_START_MIN, bandOf, fmtHhmm, gioVi } from "../core/clock";
import type { Bus } from "../core/eventbus";
import type { CustomerSlot, LeaveReason as BusLeaveReason, StimId } from "../core/types";
import { newNpcState, type NpcState } from "../core/save";
import { orderDefectKey } from "../core/stimid";
import { Customer, DEFAULT_PATIENCE_SEC, LEAVE_AT, PATIENCE_BONUS_SEC, TEA, teaSuspectAtCup, type LeaveReason } from "./customer";
import {
  INGREDIENTS, diffDish, extraPortions, generosityOf, labelOf, levelsOf, mkDefect,
  sayOrder,
  type Defect, type Ingredient, type OrderSpec,
} from "./order";
import {
  MAX_LIVE_STIMULI, SALIENCE, STIM_SPEC, observe, peakOf, peakOfKey, rank, stateOf,
  type ActiveStim, type ObsState, type Occluder, type Zone,
} from "./perception";
import { ASIDE_SPOT, CART_CHUNG, CART_LAN, CART_XA, CUSTOMER_GATE, GANH_IN, GANH_OUT, QUEUE_SLOTS, SEAT_CAPACITY, SEAT_SPOT, SHADE_CAPACITY, SHADE_SPOT, STREET_BIN, hitsWall } from "../world/map";
import { PASSERS_MAX, PASSER_NAMES, inviteChance, nextGapSec, planPasser } from "./passersby";
import { rollVisit } from "./schedule";
import { SHARED_POOL, TalkStore } from "../content/talks";
import { allHold, firstBroken, holds, type WorldSnapshot } from "./worldfacts";
import { bandOfMinutes, type DriveId, type PracticeId } from "../content/vocab";
import { describe as describePurpose, purposeHurry, purposeInviteMul, rollPurpose } from "./purpose";
import { baseDrives, bump, decayDrives, drivesNow, scoreSatisfies } from "./drives";
import {
  ADDRESS, TalkSession, WALKIN_ADDRESS, angerToWaitSec,
  actsUnder, eligible, pickTalk, visibleOptions, isSharedTalk, MOOD_FACE, MOOD_POSE,
  // `kindOf` của `talk.ts` đụng tên với `kindOf` lỗi món đã có sẵn trong file này.
  kindOf as talkKindOf, countsAgainstDailyCap, forSecOf, satisfiesOf,
  type TalkOpenBy, type Deed, type ForSec,
  type Talk, type TalkAct, type TalkCtx, type TalkEffect, type TalkGate, type TalkMood, type TalkTone,
} from "./talk";
import { CAL, PRICE_FX, crowdMul, dishPriceVnd, dongVi, isRain, pickOf, tasteThreshold, weatherOf, type PricePicks } from "./econ";
import { nhanOf, type MenuItemId } from "./menu";
import { easeBalk } from "./ease";
import { peakCap } from "./ease";
import { has, walkInMul as equipWalkIn, type EquipId, type EquipState } from "./equipment";
import { makeChange } from "./till";
import { moodBaseFace, moodPatienceMul, rollMood } from "./mood";
import { faceHoldSec, intensityMul, isSilentGrudge, reactionDelay } from "./personality";
import { GROUP_OF, faceFor, poseFor, type Group, type Intensity, type PoseId } from "./reaction";
import { CRUST, bandOfCrust } from "./oven";
import { satisfaction, servedVector, tasteOf } from "./taste";
import TAM from "../content/lines/tam.json";

const TAM_CANH: readonly (readonly string[])[] = TAM.canh;

const SLOTS: readonly { x: number; y: number; zone: Zone }[] = QUEUE_SLOTS;
const GATE = CUSTOMER_GATE;
const WALK_SPEED = 1.7;

/** Trần cả hẻm mỗi buổi cho lượt NPC tự bắt chuyện, không phải trần từng cuộc. */
export const TALK_OFFERS_PER_DAY = 4;
const TALK_OFFER_GAP_SEC = 100;

/** Áp cho CẢ HAI đường (bấm phím lẫn khách tự mở lời). `BARK`/`SHORT` không tiêu vào trần này. */
const TALK_DEEP_PER_DAY = 2;

/** Cổng chặn cuộc sâu kèm câu giải thích, dùng chung cho `canOpenDeep` và `talkUnavailable` để không lệch nhau. */
export function deepGateReason(deepToday: number, nowMin: number): string | null {
  if (deepToday >= TALK_DEEP_PER_DAY) return "Nói nhiều rồi. Để mai đi.";
  if (bandOf(nowMin) === "PEAK") return "Giờ này đông quá, để nói chuyện sau.";
  return null;
}

/** Đủ cao để `TALK_OFFERS_PER_DAY` là cái chặn cuối chứ không phải roll. */
const TALK_INITIATE_BASE = 0.55;

const PASSER_TALK_TAIL = 4;
/** `talkedThisVisit` chỉ chặn mở LẠI cùng một cuộc, không chặn mở cuộc khác — trần phải nằm riêng. */
const PASSER_TALKS_MAX = 2;

const DIRT_ON_CAMERA = 0.35;

/** Khác cái gánh bà Sáu: gánh chắn LỐI (đo được bằng `balkChance`), xe thì ăn bớt khách LẠ đi ngang. */
const KIET_STEAL = 0.18;

/** Phần người đi ngang ngoái lại khi nghe rao — chỉ bật `t.glanced`, người chơi vẫn phải mời. */
const RAO_TURN = 0.45;

const RAO_SEC = 12;

/** Cơ hội chịu đổi đơn trước khi trừ phần vội. */
const ORDER_CHANGE_BASE = 0.72;

/** ⚠️ Phải dài hơn `StallScene.REPLY_DELAY_SEC` — xem `talkVoice`. */
const TALK_VOICE_TAIL = 2.5;

/** Quá hạn thì HUỶ IM LẶNG, không phạt. */
const OFFER_DEFER_TTL_SEC = 90;
const OFFER_QUEUE_MAX = 2;

const GREET_CHANCE = 0.25;
const GREET_REACH = 1.0;
/** Chào nhau thì đi chậm lại; cảnh tám (`chatScene`) thì cả hai dừng hẳn. */
const GREET_SLOW = 0.75;
const GREET_SLOW_SEC = 1.6;

/** Tầm (ô) người bị nói xấu nghe thấy — `OVERHEARD_BY`. */
const OVERHEAR_REACH = 4.5;

/** Phải hiếm hơn chào nhau nhiều; đo bằng `tools/probe-tam.ts` ra chừng một cảnh một buổi. */
const CHAT_SCENE_CHANCE = 0.18;
const CHAT_LINE_GAP = 1.9;
const GREET_REPLY_SEC = 1.2;

/** Người GẦN NHẤT thắng, kể cả người đi ngang; không ai trong tầm thì rơi về người đầu quầy. */
export const TALK_REACH = 3;

const EMPTY_STR: readonly string[] = [];

/** Phải đóng lại TRƯỚC khi người ta bắt đầu sốt ruột (`t.impatient` ở 0,6). */
const ORDER_WINDOW = 0.35;

const OVEN_SMELL_SEC = 90;

/** ⚠️ Giây THẬT, không phải phút game: đồng hồ tua nhanh khi quầy trống thì mọi lời hứa cùng hết hạn một lượt. */
const DEED_DUE: Record<string, number> = {
  ROT_TRA: 25, DUA_BANH: 15, BUNG_GANH: 15, LAY_SO: 40, DOI_DON: 20,
};

const DEED_LABEL: Record<string, string> = {
  ROT_TRA: "rót cho người ta ly trà", DUA_BANH: "đưa người ta miếng bánh",
  BUNG_GANH: "bưng giúp cái gánh", LAY_SO: "lấy giúp cuốn sổ", DOI_DON: "sửa lại cái đơn",
};

/** Nhắc → nói nặng → bỏ đi. Nóng tính bỏ nấc một; người lạ bỏ cả ba. */
const DEED_STAGES = [1.0, 1.6, 2.4] as const;

/** `LATERAL` là trục DỌC QUẦY (phân biệt được ai với ai); `DEPTH` xuyên mặt quầy, gần như hằng số. */
export const TALK_W_LATERAL = 1.0;
export const TALK_W_DEPTH = 0.45;
export const TALK_B_FRONT = -0.9;
export const TALK_B_ADDRESSED = -99;
export const TALK_P_REFUSED = 1.2;
/** Bám dính mục tiêu — cùng con số với `stations.STICKY`, để mục tiêu không nhấp nháy. */
export const TALK_STICKY = 0.62;

const PROMISE_KEPT = 45;
const PROMISE_SWAPPED = 55;
const PROMISE_BROKEN = 85;

/** Tính SAU `intensityMul`: ông Hải nổ ở `anger` 40, thầy Phúc phải 80. */
const STORM_OFF_ANGER = 55;

export const PRICE_BANH = 25_000;
export const TEA_COST = 350;
export const TEA_PER_DAY = 18;

export const MAX_AUDIENCE = 6;

/** Câu thứ hai HOÃN, không bỏ. */
export const DIALOG_QUERIES_PER_FRAME = 1;
export const MAX_BUBBLES = 2;
const QUEUE_EXPIRE_SEC = 2.5;
/** Dưới 0,35 s thì câu sau bật lên khi câu trước chưa mờ hết — đọc ra là MỘT bong bóng đổi chữ. */
export const SAME_SPEAKER_GAP_SEC = 0.35;
/** Chênh 20 là chênh HẠNG: 20–55 chuyện phiếm, 70–100 chuyện của ổ bánh. */
export const BARGE_IN_PRI = 20;
export const BARGE_IN_SEC = 1.2;
/** ⚠️ Thiếu trần thì câu sau chết theo người nói — khách quay lưng là vòng dọn xoá sạch hàng đợi của họ. */
export const HOLD_MAX_SEC = 3;

/** NHÂN chứ không CỘNG (cộng thẳng giây sẽ xoá mất nét tính cách), và chặn ở bậc thứ tư. */
const QUEUE_PATIENCE_STEP = 0.15;
const QUEUE_PATIENCE_CAP = 4;

export function queuePatienceMul(ahead: number) {
  return 1 + QUEUE_PATIENCE_STEP * Math.min(ahead, QUEUE_PATIENCE_CAP);
}

/** ⚠️ Ngược chiều với `queuePatienceMul` (cái kia xảy ra SAU khi đã xếp vào), đừng trộn. */
const BALK_FROM_FILL = 0.6;
const BALK_AT_FROM = 0.2;
const BALK_MAX = 0.55;
const BALK_WHEN_FULL = 0.92;
const BALK_RUSH = 1.35;
const BALK_CEIL = 0.8;

export const balkFrom = (slots: number) => Math.max(1, Math.ceil(BALK_FROM_FILL * slots));

/** ⚠️ Gọi ở nhánh `default` của `applyAct`: `switch` thiếu nhánh KHÔNG phải lỗi kiểu, tham số `never` mới làm nó thành lỗi. */
function assertActHandled(act: never): void {
  throw new Error(`TalkAct chưa được nối vào applyAct: ${JSON.stringify(act)}`);
}

export function balkChance(o: {
  ahead: number;
  /** Hàng chứa được mấy chỗ — LUÔN truyền `QUEUE_SLOTS.length`, đừng chép số. */
  slots: number;
  person: Personality;
  moodPatience: number;
  rushing: boolean;
}) {
  if (o.slots <= 0) return 0;
  if (o.ahead >= o.slots) return BALK_WHEN_FULL;
  const from = balkFrom(o.slots);
  if (o.ahead < from) return 0;
  const span = Math.max(1, o.slots - 1 - from);
  const base = BALK_AT_FROM + (BALK_MAX - BALK_AT_FROM) * clamp01((o.ahead - from) / span);
  const mood = 1 / Math.max(0.01, o.moodPatience);
  return Math.min(BALK_CEIL, base * intensityMul(o.person) * mood * (o.rushing ? BALK_RUSH : 1));
}

/** Lùi thêm một bậc sau chỗ cuối hàng. Phải là điểm THẬT trên vỉa hè, không thì người chơi chỉ thấy một buổi vắng khách. */
const BALK_LOOK = (() => {
  const n = SLOTS.length;
  const p = n >= 2 ? { x: 2 * SLOTS[n - 1].x - SLOTS[n - 2].x, y: SLOTS[n - 1].y } : { ...SLOTS[0] };
  return hitsWall(p.x, p.y) ? { x: SLOTS[n - 1].x, y: SLOTS[n - 1].y } : p;
})();
const BALK_LOOK_SEC = 0.8;

const ASIDE_HOLD_SEC = 6;

const BARK_DELAY_MIN = 0.2;
const BARK_DELAY_SPAN = 0.2;
const FOLLOWUP_EXPIRE_SEC = 6;
const SMALLTALK_AFTER_SEC = 4;
/** Không phải cooldown của nút F — nó chặn việc bấm F liên tục để ép gaze rời khỏi tay mình. */
export const ASK_COOLDOWN = 60;

export const READ_CPS = 11;
export const NOTICE_SEC = 0.8;
export const BUBBLE_MIN_SEC = 2.8;
/** ⚠️ Phải đủ cao để không cắt cụt dòng dài nhất của kho (82 ký tự). Test `B-1` giữ cả hai đầu. */
export const BUBBLE_MAX_SEC = 9;

export const bubbleLife = (text: string, slow = 1) =>
  Math.min(BUBBLE_MAX_SEC, Math.max(BUBBLE_MIN_SEC, NOTICE_SEC + text.length / READ_CPS)) * slow;

/** Lâu hơn bark vì nó MỞ RA một việc người chơi phải làm; dấu ba chấm bền lo phần còn lại. */
export const OFFER_BUBBLE_SEC = 5.5;
export const offerBubbleLife = (text: string, slow = 1) =>
  Math.max(OFFER_BUBBLE_SEC * slow, bubbleLife(text, slow) + 1.5);

const NHAN_IDS: ReadonlySet<Ingredient> = new Set(INGREDIENTS.filter((i) => i.kind === "nhan").map((i) => i.id));

/** Ngưỡng ở "không miếng nhân mặn nào", không phải "ổ trống trơn" — ổ trống trơn lách được bằng một cọng rau. */
export function isHollowLoaf(spec: OrderSpec, dish: readonly Ingredient[]) {
  if (dish.some((i) => NHAN_IDS.has(i))) return false;
  for (const i of NHAN_IDS) if ((spec.levels[i] ?? 0) > 0) return true;
  return false;
}

export function hollowWantLabel(spec: OrderSpec) {
  const first = INGREDIENTS.find((i) => NHAN_IDS.has(i.id) && (spec.levels[i.id] ?? 0) > 0);
  return first ? first.label : "nhân";
}

/** `playerSay` là câu chủ quán nói lúc chìa ổ có đồ cho thêm — scene vẽ bong bóng trên đầu người chơi. */
export type ServeResult = { ok: boolean; reason?: string; playerSay?: string };

export type ServiceEvent =
  | { kind: "log"; text: string }
  | { kind: "paid"; amount: number; item: "dish" }
  | { kind: "cost"; amount: number; item: "tea" | "talk" }
  | { kind: "talkOffer"; npcId: string; name: string }
  /** ⚠️ Phải đi qua đây, KHÔNG tự đặt `this.playerHand` — `StallScene` gán lại nó mỗi frame. */
  | { kind: "takeHand"; npcId: string; name: string };

export type TalkView = {
  npcKey: string;
  name: string;
  line: string;
  silent: boolean;
  said?: string;
  mood?: TalkMood;
  skin: number;
  hair: number;
  /** Ô BẢN ĐỒ — scene tự chiếu sang toạ độ màn hình. */
  at: { x: number; y: number };
  options: readonly { say: string; tone: TalkTone }[];
  done: boolean;
};

export type ServiceDeps = {
  bus: Bus;
  hub: RngHub;
  saveId: string;
  day: number;
  npcs: Record<string, NpcState>;
  bags: Record<string, BagState>;
  /** Reload giữa buổi: bỏ qua mọi lượt khách hẹn tới trước mốc này. */
  resumeAt?: number;
  /** Trỏ thẳng vào `world.progress.today`; vắng thì Service tự đếm trong bộ nhớ. */
  todayCounters?: { talksDeep?: number; talkOffers?: number; strangers?: number; sick?: number; praise?: number; overpriced?: number; priceLost?: number };
  /** Mốc giá đang chọn theo món; trỏ thẳng vào save nên đổi giữa buổi có hiệu lực ngay. */
  prices?: PricePicks;
  readMul?: number;
  dialog?: DialogState;
  patienceMul?: number;
  /** Giây cộng thêm vào kiên nhẫn mọi khách. */
  patienceBonusSec?: number;
  /** Số khách lạ thêm trong ngày. */
  extraGuests?: number;
  gazeMul?: number;
  till?: { floatLeft: number };
  equip?: EquipState;
  loaOn?: boolean;
  noTimePressure?: boolean;
  /** Cờ thoại (`TalkEffect.flag`) — lưu ngày đặt; trỏ vào `SaveFile.flags`. */
  flags?: Record<string, string | number | boolean>;
};

type Visit = { at: number; npc: NpcDef | null; seq: number; defer?: number };
/** ⚠️ Toạ độ thế giới DUY NHẤT không nằm trong `world/map.ts` — `assertWalkable()` không soi tới. */
const PASS_SPOT = { x: 16.5, y: 8.4 };
type Pending = {
  c: Customer; text: string; tier: 1 | 2 | 3; delay: number; log: boolean
  pri: number; waited: number;
  held: number;
  /** Rule sinh ra câu này — ghi nhận đã-nói + applycontext + followup LÚC NÓI, không lúc chọn. */
  rule?: Rule;
  offer?: boolean;
};
type Followup = { c: Customer; concept: string; at: number };

/** `GRIT` = ổ nằm dưới đất mà người này KHÔNG thấy lúc nó rớt, và nó THẮNG `DEFECT`. */
type ServeOutcome = "CLEAN" | "DEFECT" | "WAITED" | "GRIT";

type Extra = Record<string, string | number | boolean>;

const LEAVE_REASON: Record<LeaveReason, BusLeaveReason> = {
  served: "SERVED", impatient: "IMPATIENT", closed: "CLOSED", soldout: "SOLD_OUT",
  refused: "REFUSED", insulted: "SILENT_EXIT", balked: "BALKED", soiled: "SOILED_FOOD",
};

const NOTICE_SPOKEN: ReadonlySet<StimId> = new Set<StimId>(["DROPPED_FOOD", "BURNT_OR_COLD", "DIRTY_HANDS", "FLOURISH"]);

const FREE_EXTRA_BASE = 25;
const FREE_EXTRA_DIMINISH = [1.0, 0.6, 0.25];
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Cờ `soiled` đi theo TỪNG Ổ; khách thấy nó rơi thì không nhận. */
const SOILED_REFUSE_TOAST = "khách thấy ổ đó rơi rồi";

/** Ổ trống là CHƯA LÀM, không phải làm sai — concept riêng `HOLLOW_LOAF`, nói một lần mỗi lượt ghé. */
const HOLLOW_REFUSE_TOAST = "khách không nhận — ổ chưa có nhân";

export const takesHollowLoaf = (p: Personality) => p.nongTinh <= 0.4 && p.deTha >= 0.7;

/** Mượn `WRONG_TEMP`; trần 0,90 để bánh non không nặng bằng bánh nguội ngắt. */
const UNDERDONE_FLOOR = 0.35;
const UNDERDONE_CEIL = 0.9;
const UNDERDONE_LABEL = "bánh chưa giòn";
const UNDERDONE_TEXT = "bánh nướng chưa tới";

/** Dải `SINGED` của lò — ổ rút ra TRỄ nhưng chưa cháy: bán được, chất lượng kém. */
const SINGED_FLOOR = 0.3;
const SINGED_CEIL = 0.85;
const SINGED_LABEL = "bánh cháy cạnh";
const SINGED_TEXT = "bánh cháy cạnh rồi";

/** Gom tối đa ngần này tên món vào một câu — dài hơn là bong bóng cao quá ba dòng. */
const MON_LIST_MAX = 3;
/** Trần MỀM: quá thì bỏ bớt vế, không cắt cụt giữa câu. */
const WRAP_SOFT_MAX = 100;

const DEFECT_FACE_I3 = 40;

/** Mỗi người chỉ có MỘT bong bóng, nên phải đợi câu nhận bánh đọc xong — mà vẫn kịp trước khi họ ra tới cổng. */
const FAREWELL_DELAY = 1.8;

export type DiffedDefect = Defect & { key: string | null; witness: "ANTICIPATED" | "DISCOVERED" };

export class Service {
  readonly customers: Customer[] = [];
  private active: ActiveStim[] = [];
  private schedule: Visit[] = [];
  private barks: Barks;
  readonly speaker: Speaker;
  private followups: Followup[] = [];
  private smalltalked = new Set<string>();
  private nowMin = DAY_START_MIN;
  private query = new Query();
  private reactAt: number[] = [];
  private dialogRng: Rng;
  private queue: Pending[] = [];
  private offStim: () => void;
  private nowSec = 0;
  private stimSeq = 0;
  private freeExtraToday = new Map<string, number>();
  private hollowShown = new Set<string>();
  private serveOutcome = new Map<string, ServeOutcome>();
  private teaToday = new Map<string, number>();
  private devSeq = 0;
  private talkSession: TalkSession | null = null;
  private talkWith: Customer | null = null;
  /** ⚠️ Khác `talkWith`, vốn đã `null` trước khi scene kịp đưa câu đáp cuối ra. */
  private talkVoice: Customer | null = null;
  private talkVoiceUntil = 0;
  /** Hàng đợi chứ không một ô, không thì người thứ hai im suốt lượt ghé. */
  private offers: { c: Customer; talk: Talk; at: number }[] = [];
  get hasOffer() { return this.offers.length > 0; }
  readonly talks = new TalkStore();
  private lastOfferAt = -Infinity;
  /** ⚠️ Trong SAVE chứ không trong instance: "lưu và về sảnh" dựng `Service` mới, lách được trần ngày. */
  private get deepToday() { return this.deps.todayCounters?.talksDeep ?? this.deepLocal; }
  private set deepToday(n: number) {
    this.deepLocal = n;
    if (this.deps.todayCounters) this.deps.todayCounters.talksDeep = n;
  }
  private get offersToday() { return this.deps.todayCounters?.talkOffers ?? this.offersLocal; }
  private set offersToday(n: number) {
    this.offersLocal = n;
    if (this.deps.todayCounters) this.deps.todayCounters.talkOffers = n;
  }
  private deepLocal = 0;
  private offersLocal = 0;
  /** ⚠️ Phải giữ lại: rút lại mỗi lần mở thì mở–Esc–mở là một cái máy reroll nội dung. */
  private heldTalk = new Map<string, Talk>();
  /** ⚠️ Không ghi vào `mem(memKey).talksDone`: `memKey` của người lạ là `walkin<dáng>` — tám dáng dùng chung một sổ. */
  private talkedThisVisit = new Map<string, string[]>();
  /** Đếm MỌI cuộc kể cả túi dùng chung — `talkedThisVisit` cố ý không ghi cuộc `ANY`. */
  private passerTalks = new Map<string, number>();
  private talkEngaged = false;
  private talkNpcOpened = false;
  private lastTarget: Customer | null = null;
  private actReply: { text: string; mood: TalkMood } | null = null;
  private pledges = new Map<string, { promised: string[]; discount: number; free: boolean }>();
  /** 0 khi chưa mua bình trà — chính nó khoá `p.hasTea` cho mọi nhánh thoại mời trà. */
  teaLeft = 0;
  dirt = 0;
  handsDirty = false;
  /** `false` ở các cửa sổ cấm (cầm ổ nóng, bảng kẹp mở, lò SÉM, khách đang gọi…). */
  interruptible = true;
  soldOut = false;
  soldOutCount = 0;
  ovenBusy = false;
  private lastBatchOutAt = -Infinity;
  private wasOvenBusy = false;

  get stallRunning() { return this.ovenBusy || this.servedCount > 0; }

  get ovenHot() { return this.ovenBusy || this.nowSec - this.lastBatchOutAt < OVEN_SMELL_SEC; }
  /** Cố ý không `ovenBusy ||`: lò nhen gần suốt buổi, thêm vào là mất nghĩa "vừa ra". */
  get meVuaRa() { return this.nowSec - this.lastBatchOutAt < OVEN_SMELL_SEC; }
  private passerIn = 0;
  private passerSeq = 0;
  playerAt: { x: number; y: number } | null = null;
  playerHand = "empty";
  playerOnStreet = false;
  shadeFree = false;
  seatFree = false;
  /** `"NGOAI"` chiếm một chỗ mặt tiền cho tới khi được mời dời vô. */
  ganh: "NGOAI" | "TRONG" | null = null;
  /** Xe chú Kiệt; tới là `"LAN"` (lấn mặt tiền) mặc định, `null` là vắng. */
  cart: "LAN" | "XA" | "CHUNG" | null = null;
  /** Giây THẬT. */
  raoUntil = -1;
  stock = 0;
  /** Tầng `d.*`, khoá theo `memKey` chứ không theo lượt ghé. */
  private toldToday = new Map<string, string[]>();
  /** Chỉ trong buổi bán; lời hứa qua đêm là của `obligations.ts`. */
  private deeds: { c: Customer; deed: Deed; dueAt: number; nudged: number }[] = [];
  private asideFor = new Map<string, ForSec>();
  private arriveSeq = 0;
  private talkAngered = false;
  private dirtRemarked = false;

  servedCount = 0;
  lostCount = 0;
  /** Cố ý tách khỏi `lostCount` — xem nhánh `balked` trong `leave()`. */
  balkedCount = 0;
  dialogDeferred = 0;

  readonly out: ServiceEvent[] = [];

  constructor(private deps: ServiceDeps) {
    this.dialogRng = deps.hub.stream("dialog-shufflebag");
    this.barks = new Barks(this.dialogRng, deps.bags, deps.day);
    this.speaker = new Speaker(this.dialogRng, deps.bags, deps.day, deps.dialog, 0);
    if (has(deps.equip, "BINH_TRA")) this.teaLeft = TEA_PER_DAY * 2;
    this.talks.ensure(SHARED_POOL);
    this.buildSchedule();
    const cut = deps.resumeAt ?? -1;
    this.schedule = this.schedule.filter((v) => v.at > cut);

    this.offStim = deps.bus.on("stim:emitted", (s) => {
      const spec = STIM_SPEC[s.stimId];
      if (!spec) return;
      const live = this.active.filter((a) => a.until > this.nowSec);
      if (live.length >= MAX_LIVE_STIMULI) {
        const weakest = live.reduce((a, b) => (a.salience <= b.salience ? a : b));
        this.active.splice(this.active.indexOf(weakest), 1);
      }
      this.active.push({
        key: s.key ?? `${s.stimId}#${this.stimSeq++}`, id: s.stimId, slot: s.zone, salience: s.salience,
        until: s.at + spec.lifetime, target: s.target, smell: s.smell,
      });
      if (spec.channel === "AUDIO_AMBIENT") for (const c of this.customers) c.loudCue = true;
    });
  }

  dispose() {
    this.offStim();
    this.endTalk();
    this.offers = [];
    this.talks.clear();
  }

  /** Dòng số riêng để lịch không phụ thuộc người chơi làm gì trong ngày. */
  private buildSchedule() {
    const rng = this.deps.hub.derive("npc-schedule");
    const list: Omit<Visit, "seq">[] = [];
    for (const npc of NPCS) {
      const t = rollVisit(npc.schedule, this.deps.day, rng);
      if (t === null) continue;
      list.push({ at: Math.max(DAY_START_MIN + 2, Math.min(DAY_END_MIN - 12, t)), npc });
    }
    let t = DAY_START_MIN + 8;
    while (t < DAY_END_MIN - 10) {
      const peak = t >= PEAK_START_MIN && t < PEAK_END_MIN;
      t += peak ? 6 + rng.next() * 7 : 15 + rng.next() * 16;
      if (t >= DAY_END_MIN - 10) break;
      const wx = weatherOf(this.deps.day);
      const gear = equipWalkIn(this.deps.equip, isRain(wx), wx === "NANG_GAT", this.deps.loaOn ?? true);
      const keep = Math.min(1, 0.65 * CAL.weatherInfo[wx].walkIn * crowdMul(this.deps.day) * gear);
      if (rng.next() >= keep) continue;
      list.push({ at: t, npc: null });
    }
    for (let i = 0; i < (this.deps.extraGuests ?? 0); i++) {
      list.push({ at: DAY_START_MIN + 12 + rng.next() * (DAY_END_MIN - DAY_START_MIN - 30), npc: null });
    }
    list.sort((a, b) => a.at - b.at);
    this.schedule = list.map((v, seq) => ({ ...v, seq }));
  }

  get upcoming(): readonly { at: number; name: string }[] {
    return this.schedule.map((v) => ({ at: v.at, name: v.npc?.name ?? "khách lạ" }));
  }

  private mem(id: string): NpcState {
    return (this.deps.npcs[id] ??= newNpcState());
  }

  private patienceOf(npc: NpcDef | null, at: number, ahead: number) {
    const base = npc?.patience ?? DEFAULT_PATIENCE_SEC;
    const rush = npc?.rush && at >= npc.rush[0] && at < npc.rush[1] ? 0.65 : 1;
    return base * rush * queuePatienceMul(ahead) * (this.deps.patienceMul ?? 1) + PATIENCE_BONUS_SEC + (this.deps.patienceBonusSec ?? 0);
  }

  private spawn(v: Visit, nowMin: number) {
    const npc = v.npc;
    // Trần chỉ đếm khách vãng lai; quá trần thì dời lượt ghé một phút, không mất.
    const unlimited = !!this.deps.noTimePressure;
    if (unlimited || !npc) {
      const standing = this.customers.filter((x) => x.phase !== "leaving" && !x.pass && !x.balking && (unlimited || !x.npc));
      if (standing.length >= peakCap(this.deps.day, unlimited)) {
        this.schedule.unshift({ ...v, at: nowMin + 1 });
        this.schedule.sort((a, b) => a.at - b.at);
        return;
      }
    }
    const rng = this.deps.hub.derive(`visit:${v.seq}`);
    const wi = v.seq % WALKIN_STYLES.length;
    const memKey = npc ? npc.id : `walkin${wi}`;
    const id = `${memKey}#${v.seq}`;
    const m = this.mem(memKey);
    const style = npc ? npc.body : WALKIN_STYLES[wi];
    const name = npc ? npc.name : WALKIN_NAMES[wi];
    const person = npc
      ? npc.personality
      : { soi: 0.3 + rng.next() * 0.5, nongTinh: 0.2 + rng.next() * 0.5,
          deTha: 0.5 + rng.next() * 0.4, thanThien: 0.3 + rng.next() * 0.5 };

    const mood = rollMood(this.deps.hub.derive(`mood:${v.seq}`), this.deps.day);
    // Tính một lần lúc xếp vào; gánh để ngoài tính như thêm một người.
    const ahead = this.customers.filter((x) => x.phase !== "leaving" && !x.pass && !x.balking).length
      + (this.ganh === "NGOAI" ? 1 : 0);

    // ⚠️ Dòng số riêng `kiet:` — rút ké là dịch chuỗi số của cả lượt ghé.
    const kietLay = this.cart === "LAN" && !npc
      && this.deps.hub.derive(`kiet:${v.seq}`).next() < KIET_STEAL;
    if (kietLay) this.out.push({ kind: "log", text: "một người ghé xe chú Kiệt thay vì xe mình." });

    const balking = kietLay || (!this.deps.noTimePressure
      && this.deps.hub.derive(`balk:${v.seq}`).next() < easeBalk(this.deps.day) * balkChance({
        ahead, slots: SLOTS.length, person, moodPatience: moodPatienceMul(mood),
        rushing: !!npc?.rush && nowMin >= npc.rush[0] && nowMin < npc.rush[1],
      }));
    if (!balking) m.visits++;
    m.lastSeenDay = this.deps.day;

    const c = new Customer(
      id, memKey, name, person, style, npc, m.visits,
      { ...GATE }, this.patienceOf(npc, nowMin, ahead) * moodPatienceMul(mood), rng,
    );
    c.balking = balking;
    // Không `await`: họ còn đi bộ mấy giây, và `openTalk()` đã có đường lui nếu chưa kịp.
    void this.talks.ensure(npc ? npc.id : "WALKIN");
    c.dayMood = mood;
    c.gazeMul = this.deps.gazeMul ?? 1;
    const base = moodBaseFace(mood);
    if (base) c.react.baseFace = c.react.face = base;
    if (mood.prop === "VAI_XUOI") c.react.basePose = c.react.pose = "SETTLE_IN";
    c.rollOrder(this.deps.day);
    if (!c.balking && c.order && this.deps.hub.derive(`price:${v.seq}`).next()
      < PRICE_FX.walkAway[pickOf(this.deps.prices, c.order.intent.mon)]) {
      c.balking = true;
      c.priceWalk = true;
    }
    for (const o of this.customers) if (o.phase !== "leaving") this.speaker.apply(o.memKey, "ctxKhachMoiToi", 1, 8, this.nowSec);
    c.driveBase = baseDrives(c.personality);
    c.drives = { ...c.driveBase };
    c.arrivedSeq = ++this.arriveSeq;
    this.customers.push(c);
    this.maybeCutLine(c);
    this.deps.bus.emit("npc:arrived", { npcId: memKey, visitId: id, slot: "SEATED_FAR", atHhmm: fmtHhmm(v.at) });
  }

  private maybeCutLine(c: Customer) {
    const ahead = this.customers.filter((x) => x !== c && this.inQueue(x) && !x.aside);
    if (ahead.length < 1) return;
    const hurry = c.purpose?.hurry ?? 0.3;
    const p = Math.max(0, 0.45 * c.personality.nongTinh * (0.4 + hurry) - 0.12 * ahead.length);
    // ⚠️ Dòng số riêng: rút có điều kiện trên dòng dùng chung làm golden lệch pha vài ngày sau.
    if (this.deps.hub.derive(`cutline:${this.deps.day}:${c.id}`).next() >= p) return;
    const victim = ahead[ahead.length - 1];
    const i = this.customers.indexOf(c), j = this.customers.indexOf(victim);
    if (i < 0 || j < 0 || j >= i) return;
    this.customers.splice(i, 1);
    this.customers.splice(j, 0, c);
    c.cutLine = true;
    this.assignSlots();
    this.out.push({ kind: "log", text: `${this.label(c)} chen lên trước ${this.label(victim)}.` });
  }

  devSpawn(npcId: string) {
    const npc = NPCS.find((n) => n.id === npcId);
    if (!npc) return false;
    this.spawn({ at: 0, npc, seq: 10_000 + this.devSeq++ }, DAY_START_MIN);
    return true;
  }

  get front(): Customer | null {
    return this.customers.find((c) => c.slot === 0 && c.phase !== "leaving") ?? null;
  }

  get busy() {
    return this.customers.some((c) => c.phase !== "leaving");
  }

  get audience(): Customer[] {
    return this.customers
      .filter((c) => c.phase === "queueing" || c.phase === "ordering" || c.phase === "waiting")
      .slice(0, MAX_AUDIENCE);
  }

  private emitStim(id: StimId, extra: { salience?: number; target?: string; zone?: ActiveStim["slot"] } = {}) {
    this.deps.bus.emit("stim:emitted", {
      stimId: id, zone: extra.zone ?? "HANDS", salience: extra.salience ?? SALIENCE[id], at: this.nowSec,
      target: extra.target,
    });
  }

  /** ⚠️ Không được hoãn — hoãn perception là đổi kết quả game. */
  perceive(dt: number, nowSec: number, occluders: readonly Occluder[] = []) {
    this.nowSec = nowSec;
    this.active = this.active.filter((s) => s.until > nowSec - 30);

    for (const c of this.audience) {
      c.traitMul = Math.min(2.2, c.baseTrait * (1 + 0.35 * this.dirt)) - (c.now < c.washRelief ? 0.12 : 0);
      const before = new Map<string, ObsState>();
      for (const [k, o] of c.observations) before.set(k, stateOf(o.certainty));
      observe(c, this.active, nowSec, dt, occluders);
      for (const [key, o] of c.observations) {
        const from = before.get(key) ?? "UNAWARE";
        const to = stateOf(o.certainty);
        if (from === to) continue;
        this.deps.bus.emit("perception:stateChanged", { npcId: c.memKey, stimId: o.id, from, to, certainty: o.certainty });
        if (rank(to) <= rank(from)) continue;
        this.react(c, o.id, to === "GLIMPSED" ? 1 : to === "NOTICED" ? 2 : 3);
        if (to === "CONFIRMED") this.deps.bus.emit("perception:confirmed", { npcId: c.memKey, stimId: o.id });
        if (to === "NOTICED" && NOTICE_SPOKEN.has(o.id)) this.noticeBark(c, o.id, to, o.smell);
      }
    }
  }

  private noticeBark(c: Customer, id: StimId, state: ObsState, smell?: boolean) {
    if (!this.barks.speaks(c.memKey)) {
      this.deps.bus.emit("dialog:silent", { npcId: c.memKey, reason: "RATE_35" });
      return;
    }
    const q: Record<string, string | number | boolean> = { eventId: id, obsState: state, eventSalience: SALIENCE[id] };
    // `BURNT_OR_COLD` gánh cả cháy (có mùi) lẫn nguội; không tách thì khách kêu "khét" trước ổ chỉ nguội.
    if (id === "BURNT_OR_COLD") q.eventBurnt = !!smell;
    this.speakConcept(c, "NOTICE_EVENT", q, SALIENCE[id]);
  }

  private react(c: Customer, id: StimId, i: Intensity, pose?: PoseId, group?: Group) {
    const p = c.personality;
    const g = group ?? GROUP_OF[id];
    let face = faceFor(g, p, i);
    const negative = g === "HYGIENE" || g === "DEFECT" || g === "NAME" || g === "WAIT";
    if (face && negative && isSilentGrudge(p)) face = [face[0], face[1], 1];
    let chosen: PoseId = pose ?? (i >= 2 ? c.npc?.poses?.[id] ?? poseFor(g, p, i) : poseFor(g, p, i));
    if (i === 3 && isSilentGrudge(p) && negative && g !== "WAIT") chosen = "FREEZE";
    this.scheduleReact(c, face, chosen);
  }

  /** Không có `StimId` để tra `npc.poses` nên dáng lấy từ bảng nhóm. */
  private reactTalk(c: Customer, g: Group, i: Intensity, pose?: PoseId) {
    const p = c.personality;
    let face = faceFor(g, p, i);
    const negative = g === "NAME";
    if (face && negative && isSilentGrudge(p)) face = [face[0], face[1], 1];
    let chosen: PoseId = pose ?? poseFor(g, p, i);
    if (i === 3 && isSilentGrudge(p) && negative) chosen = "FREEZE";
    this.scheduleReact(c, face, chosen);
  }

  private scheduleReact(c: Customer, face: ReturnType<typeof faceFor>, pose: PoseId) {
    const p = c.personality;
    let at = this.nowSec + reactionDelay(p, this.dialogRng.next());
    for (let guard = 0; guard < 20 && this.reactAt.some((t) => Math.abs(t - at) < 0.06); guard++) at += 0.06;
    this.reactAt.push(at);
    if (this.reactAt.length > 16) this.reactAt.shift();
    c.react.schedule(c.now, at - this.nowSec, face, pose, faceHoldSec(p));
  }

  tickNpcs(dt: number, ctx: { minutes: number; pressure: boolean; dayOver: boolean }) {
    this.nowMin = ctx.minutes;
    while (this.schedule.length && this.schedule[0].at <= ctx.minutes && !ctx.dayOver) {
      this.spawn(this.schedule.shift()!, ctx.minutes);
    }
    this.tickPassers(dt, ctx.dayOver);
    this.greetPassers();
    this.expireOffers();
    this.walkedAwayMidTalk();
    this.tickWorldFacts();
    this.tickDeeds();

    for (const c of this.customers) {
      const gazeBefore = c.gazeState;
      decayDrives(c.drives, c.driveBase, dt / 60);
      c.tick(dt, ctx.pressure);
      if (c.gazeState !== gazeBefore) {
        this.deps.bus.emit("gaze:changed", {
          npcId: c.memKey, gazeFactor: c.gaze,
          reason: c.sipping ? "TRA_DA" : c.onPhone ? "PHONE" : c.gazeState === "LOOK_FACE" ? "TALKING" : "IDLE",
        });
      }
      this.step(c, dt, ctx.dayOver);
    }

    for (let i = this.customers.length - 1; i >= 0; i--) {
      const c = this.customers[i];
      const lingering = c.pass && (c.pass.until < 0 || c.now < c.pass.until);
      const exit = c.pass?.exit ?? GATE;
      if (c.phase !== "leaving" || !near(c, exit, 0.5) || lingering) continue;
      // ⚠️ Đi khuất bằng `splice`, không qua `leave()`, nên phải tự dọn phiên trò chuyện.
      if (this.talkWith === c) this.endTalk();
      const pendingOffer = this.offerFor(c);
      if (pendingOffer) this.offers.splice(this.offers.indexOf(pendingOffer), 1);
      this.heldTalk.delete(c.id);
      this.talkedThisVisit.delete(c.id);
      this.passerTalks.delete(c.id);
      if (c.ambient) this.talks.release("QUA_DUONG");
      this.customers.splice(i, 1);
    }
    this.assignSlots();
  }

  /** Đếm bằng giây THẬT: đồng hồ tua nhanh khi quầy trống, đếm phút game thì lúc vắng nhất họ lại ùa ra. */
  private tickPassers(dt: number, dayOver: boolean) {
    if (dayOver) return;
    this.passerIn -= dt;
    if (this.passerIn > 0) return;
    const rng = this.deps.hub.derive(`passer:${this.deps.day}:${this.passerSeq}`);
    this.passerIn = nextGapSec(bandOf(this.nowMin), isRain(weatherOf(this.deps.day)), rng);
    // Quá trần thì bỏ lượt, không dồn, để không cả đám ùa ra một nhịp.
    if (this.customers.reduce((n, c) => n + (c.ambient ? 1 : 0), 0) >= PASSERS_MAX) return;
    this.spawnPasser(rng);
  }

  private greetPassers() {
    const amb = this.customers.filter((c) => c.ambient && c.pass && !c.speaking && !c.greeted);
    for (let i = 0; i < amb.length; i++) {
      for (let j = i + 1; j < amb.length; j++) {
        const a = amb[i], b = amb[j];
        const pa = a.pass, pb = b.pass;
        if (!pa || !pb || a.greeted || b.greeted) continue;
        if (Math.sign((pa.exit?.x ?? a.x) - a.x) === Math.sign((pb.exit?.x ?? b.x) - b.x)) continue;
        if (Math.hypot(a.x - b.x, a.y - b.y) > GREET_REACH) continue;
        const key = [a.id, b.id].sort().join("|");
        if (this.deps.hub.derive(`greet:${this.deps.day}:${key}`).next() >= GREET_CHANCE) {
          a.greeted = b.greeted = true;
          continue;
        }
        a.greeted = b.greeted = true;
        // Chỉ khi hẻm đang im: câu nền `pri 18` quá hạn là bị bỏ, hai người sẽ đứng câm.
        if (this.queue.length <= 1 && this.deps.hub.derive(`tam:${this.deps.day}:${key}`).next() < CHAT_SCENE_CHANCE) {
          this.chatScene(a, b, key);
          return;
        }
        const hi = this.barks.take("chaoNhau", a.memKey);
        for (const x of [a, b]) x.greetUntil = x.now + GREET_SLOW_SEC;
        const re = this.barks.take("chaoDap", b.memKey);
        if (hi) this.say(a, hi, 3, false, 20);
        if (re) this.say(b, re, 3, false, 20, undefined, GREET_REPLY_SEC);
        return;
      }
    }
  }

  /** Dừng bằng cách ghim `pass.spot` như `openTalk`, không đẻ đường dừng thứ hai. */
  private chatScene(a: Customer, b: Customer, key: string) {
    if (Math.hypot(a.x - b.x, a.y - b.y) > GREET_REACH + 0.5) return;
    const canh = TAM_CANH[Math.floor(this.deps.hub.derive(`tamidx:${this.deps.day}:${key}`).next() * TAM_CANH.length)];
    if (!canh?.length) return;
    const giu = canh.length * CHAT_LINE_GAP + 1.2;
    for (const x of [a, b]) {
      x.greetUntil = x.now + giu;
      if (x.pass) { x.pass.spot = { x: x.x, y: x.y }; x.pass.until = x.now + giu; }
    }
    canh.forEach((text, i) => {
      const who = i % 2 === 0 ? a : b;
      this.say(who, text, 3, false, 18, undefined, i * CHAT_LINE_GAP);
    });
    this.out.push({ kind: "log", text: `${this.label(a)} với ${this.label(b)} đứng tám chuyện.` });
  }

  private spawnPasser(rng: Rng) {
    const seq = this.passerSeq++;
    const plan = planPasser(rng, SLOTS[0].x);
    const memKey = `walkin${plan.style}`;
    const person: Personality = {
      soi: 0.3 + rng.next() * 0.5, nongTinh: 0.2 + rng.next() * 0.5,
      deTha: 0.5 + rng.next() * 0.4, thanThien: 0.3 + rng.next() * 0.5,
    };
    const c = new Customer(
      `passer#${this.deps.day}:${seq}`, memKey, PASSER_NAMES[plan.style] ?? PASSER_NAMES[0],
      person, WALKIN_STYLES[plan.style], null, 0,
      plan.from, DEFAULT_PATIENCE_SEC, rng,
    );
    const roll = rollPurpose(rng, bandOf(this.nowMin));
    c.driveBase = baseDrives(c.personality);
    // Người vội có `VIEC_RIENG` cao nên lời mời chấm gần 0 — không cần luật chống spam mời.
    c.driveBase.VIEC_RIENG = 25 + 60 * purposeHurry(roll.purpose, roll.state);
    c.driveBase.YEN_THAN = Math.max(c.driveBase.YEN_THAN, 20 + 50 * (1 - roll.state.inviteMul));
    c.drives = { ...c.driveBase };
    c.purpose = {
      id: roll.purpose.id,
      hurry: purposeHurry(roll.purpose, roll.state),
      inviteMul: purposeInviteMul(roll.purpose, roll.state),
    };
    c.purposeState = {
      id: roll.state.id, patienceMul: roll.state.patienceMul,
      angerMul: roll.state.angerMul, inviteMul: roll.state.inviteMul,
    };
    c.purposeLabel = describePurpose(roll.purpose, roll.state);
    c.ambient = true;
    // `leaving` ngay từ đầu để mọi chỗ đếm người đang đứng tự bỏ qua họ.
    c.phase = "leaving";
    c.pass = {
      stay: plan.stay, until: -1,
      speed: plan.speed * (0.85 + 0.4 * (c.purpose?.hurry ?? 0.5)),
      spot: plan.spot ?? plan.to, exit: plan.to,
    };
    this.customers.push(c);
    void this.talks.ensure("QUA_DUONG");
  }

  private step(c: Customer, dt: number, dayOver: boolean) {
    if (c.pass) {
      const p = c.pass;
      const spot = p.spot ?? PASS_SPOT, exit = p.exit ?? GATE;
      if (p.until < 0) {
        walk(c, spot, dt, p.speed);
        if (near(c, spot, 0.25)) {
          p.until = c.now + p.stay;
          // ⚠️ Không qua `this.react()` vì nó rút số dòng chung `dialog-shufflebag`.
          if (c.ambient) {
            if (p.stay > 0) c.react.schedule(c.now, 0, null, "PEEK_OVER", p.stay);
            return;
          }
          if (p.nod && (c.npc?.id !== "CHU_KIET" || this.stallRunning)) this.react(c, "FLOURISH", 1, "NOD");
          // `smalltalk()` chỉ chạy cho người đợi bánh, nên người có tên đi ngang mở lời qua `offerTalk`.
          if (c.npc && this.offerTalk(c)) return;
        }
        return;
      }
      // Gia hạn mỗi frame: `openTalk` chỉ hẹn 4 giây mà đọc hết một cuộc mất 20–30 giây.
      if (this.talkWith === c || this.owesLine(c)) { p.until = c.now + PASSER_TALK_TAIL; return; }
      if (c.now < p.until) {
        // `standInShade`/`theySit` đổi `spot` khi đã có `until`, nên vẫn phải đi tới chỗ mới.
        if (!near(c, spot, 0.3)) walk(c, spot, dt, p.speed);
        // Thử suốt quãng đứng vì cổng của `offerTalk` phần lớn chỉ chặn nhất thời.
        if (c.npc) this.offerTalk(c);
        return;
      }
      walk(c, exit, dt, (p.speed ?? 1) * (c.now < c.greetUntil ? GREET_SLOW : 1));
      return;
    }
    // Sinh ra ngay tại `GATE` nên phải đi ra chỗ ngó hàng trước khi `leave()`, không thì biến mất cùng frame.
    if (c.balking && c.phase !== "leaving") {
      walk(c, BALK_LOOK, dt);
      if (!near(c, BALK_LOOK, 0.25)) return;
      c.balkAt = c.now;
      this.leave(c, "balked");
      return;
    }
    if (c.phase === "leaving") {
      if (c.balkAt >= 0 && c.now - c.balkAt < BALK_LOOK_SEC) return;
      if (c.binDetour && c.binAt < 0) {
        walk(c, STREET_BIN, dt);
        if (near(c, STREET_BIN, 0.2)) {
          c.binAt = c.now;
          c.carrying = false;
          this.deps.bus.emit("npc:actionTaken", { npcId: c.memKey, action: "BINNED_FOOD" });
        }
        return;
      }
      if (c.binAt >= 0 && c.now - c.binAt < 0.9) return;
      walk(c, GATE, dt);
      return;
    }

    // ⚠️ `sitting` đứng trước `aside`: vừa nép vừa ngồi thì cái ghế thắng.
    if (c.sitting) {
      if (c.phase === "ordering") c.phase = "waiting";
      walk(c, SEAT_SPOT, dt);
    } else if (c.aside) {
      if (this.asideDone(c)) this.rejoinQueue(c);
      else {
        if (c.phase === "ordering") c.phase = "waiting";
        walk(c, ASIDE_SPOT, dt);
      }
    } else switch (c.phase) {
      case "arriving":
        if (c.slot >= 0) {
          walk(c, SLOTS[c.slot], dt);
          if (near(c, SLOTS[c.slot], 0.22)) {
            c.phase = c.slot === 0 ? "ordering" : "queueing";
            if (c.phase === "ordering") this.takeOrder(c);
          }
        }
        break;
      case "queueing":
        if (c.slot === 0) { c.phase = "ordering"; this.takeOrder(c); break; }
        walk(c, SLOTS[Math.min(c.slot, SLOTS.length - 1)], dt);
        break;
      case "ordering":
        c.phase = "waiting";
        break;
      case "waiting":
        walk(c, SLOTS[0], dt);
        break;
    }

    if (isLeaving(c)) return;
    this.waitSteps(c);
    if (isLeaving(c)) return;
    if (dayOver) this.leave(c, "closed");
  }

  /** r = đã chờ / sức chờ: 0,6 nhấp nhổm · 1,0 CONFIRMED · `LEAVE_AT` bỏ đi. */
  private waitSteps(c: Customer) {
    const r = c.waitRatio;
    const watchAt = Math.max(0.85 * c.waitT, c.waitT - 8) / c.waitT;
    if (c.waitStage < 1 && r >= 0.6) { c.waitStage = 1; this.react(c, "MADE_THEM_WAIT", 1); }
    if (c.waitStage < 2 && r >= watchAt) {
      c.waitStage = 2;
      c.gazeM.force("WATCH");
      this.react(c, "MADE_THEM_WAIT", 2);
      if (this.barks.speaks(c.memKey)) this.speakConcept(c, "NOTICE_EVENT", { eventId: "MADE_THEM_WAIT", obsState: "NOTICED" }, 60);
      else this.deps.bus.emit("dialog:silent", { npcId: c.memKey, reason: "RATE_35" });
    }
    if (c.waitStage < 3 && r >= 1) {
      c.waitStage = 3;
      this.react(c, "MADE_THEM_WAIT", 3);
      c.observations.set(`MADE_THEM_WAIT:${c.id}`, { id: "MADE_THEM_WAIT", slot: "HANDS", certainty: 1, peak: "CONFIRMED", diedAt: null });
      this.deps.bus.emit("perception:stateChanged", { npcId: c.memKey, stimId: "MADE_THEM_WAIT", from: "UNAWARE", to: "CONFIRMED", certainty: 1 });
      this.deps.bus.emit("perception:confirmed", { npcId: c.memKey, stimId: "MADE_THEM_WAIT" });
      this.speakConcept(c, "NOTICE_EVENT", { eventId: "MADE_THEM_WAIT", obsState: "CONFIRMED" }, SALIENCE.MADE_THEM_WAIT);
    }
    if (r >= LEAVE_AT) { this.leave(c, "impatient"); return; }
    this.smalltalk(c);
  }

  /** Một lần mỗi lượt ghé. */
  private smalltalk(c: Customer) {
    if (c.phase !== "waiting" || this.smalltalked.has(c.id)) return;
    if (this.nowSec - c.orderedAt < SMALLTALK_AFTER_SEC) return;
    if (this.queue.length || this.customers.some((x) => x.speaking)) return;
    // ⚠️ Đánh dấu SAU, không thì trượt vì lý do kỹ thuật cũng tiêu mất lượt của cả lượt ghé.
    if (this.offerTalk(c)) { this.smalltalked.add(c.id); return; }
    if (!this.interruptible) return;
    this.smalltalked.add(c.id);
    this.speakConcept(c, "SMALLTALK", {}, 45, true);
  }

  private takeOrder(c: Customer) {
    if (this.soldOut) { this.turnAway(c); return; }
    const line = sayOrder(c.order!);
    c.orderLine = line;
    c.orderedAt = this.nowSec;
    this.say(c, line, 2, true, 100);
    if (c.dayMood.cause !== "NONE") this.speakConcept(c, "GREET", { npcMoodCause: c.dayMood.cause }, 60, true);
    this.deps.bus.emit("order:placed", { npcId: c.memKey, spec: c.order, phrasing: line });
    const t = this.deps.todayCounters;
    if (!c.npc && t) t.strangers = (t.strangers ?? 0) + 1;
  }

  private turnAway(c: Customer) {
    this.soldOutCount++;
    this.speakConcept(c, "FAREWELL", { leaveReason: "SOLD_OUT" }, 80, true);
    this.react(c, "MADE_THEM_WAIT", 2);
    this.leave(c, "soldout");
  }

  /** Không phải ai cũng chào, không thì thành tiếng chuông cửa. */
  private farewell(c: Customer) {
    const outcome = this.serveOutcome.get(c.id) ?? "CLEAN";
    this.serveOutcome.delete(c.id);
    if (!this.barks.speaks(c.memKey)) {
      this.deps.bus.emit("dialog:silent", { npcId: c.memKey, reason: "RATE_35" });
      return;
    }
    this.speakConcept(c, "FAREWELL", { leaveReason: "SERVED", serveOutcome: outcome }, 55, true, {}, FAREWELL_DELAY);
  }

  /** Ghi sổ khách khen hoặc chê giá sau khi trả tiền. */
  private rollPriceVerdict(c: Customer) {
    const t = this.deps.todayCounters;
    if (!t || !c.order) return;
    const pick = pickOf(this.deps.prices, c.order.intent.mon);
    const rng = this.deps.hub.derive(`verdict:${this.deps.day}:${c.id}`);
    if (rng.next() < PRICE_FX.praise[pick]) t.praise = (t.praise ?? 0) + 1;
    if (rng.next() < PRICE_FX.overpriced[pick]) t.overpriced = (t.overpriced ?? 0) + 1;
  }

  private priceOf(intent: { mon: MenuItemId; nhieu?: string }) {
    return dishPriceVnd(intent, pickOf(this.deps.prices, intent.mon));
  }

  private leave(c: Customer, reason: LeaveReason) {
    this.pledges.delete(c.id);
    this.hollowShown.delete(c.id);
    if (reason !== "served") this.serveOutcome.delete(c.id);
    const pending = this.offerFor(c);
    if (pending) { this.applyIgnore(c, pending.talk); this.offers.splice(this.offers.indexOf(pending), 1); }
    this.heldTalk.delete(c.id);
    this.talkedThisVisit.delete(c.id);
    this.passerTalks.delete(c.id);
    if (this.talkWith === c) this.endTalk();
    c.phase = "leaving";
    c.leaveReason = reason;
    c.slot = -1;
    c.aside = false;
    c.asideFor = null;
    c.zone = "SEATED_FAR";
    if (reason === "served") { this.servedCount++; this.farewell(c); }
    if (reason === "soiled") {
      this.lostCount++;
      this.speakConcept(c, "FAREWELL", { leaveReason: "SOILED_FOOD" }, 92);
      this.out.push({ kind: "log", text: `${this.label(c)} không nhận ổ bánh — thấy nó rơi xuống đất rồi.` });
    }
    if (reason === "impatient") {
      this.lostCount++;
      this.speakConcept(c, "FAREWELL", { leaveReason: "IMPATIENT" }, 80);
      this.out.push({ kind: "log", text: `${this.label(c)} bỏ đi — chờ lâu quá.` });
    }
    // Không tính vào `lost`: hàng dài là hệ quả của bán được.
    if (reason === "balked" && c.priceWalk) {
      const t = this.deps.todayCounters;
      if (t) t.priceLost = (t.priceLost ?? 0) + 1;
      if (c.order) { const bubble = `${dongVi(this.priceOf(c.order.intent))}?!`; c.speak(bubble, bubbleLife(bubble)); }
      this.out.push({ kind: "log", text: `${this.label(c)} xem giá rồi quay đi — đắt quá.` });
    } else if (reason === "balked") {
      this.balkedCount++;
      this.speakConcept(c, "FAREWELL", { leaveReason: "BALKED" }, 80);
      this.out.push({ kind: "log", text: `${this.label(c)} nhìn hàng rồi quay về — đông quá.` });
    }
    this.talks.release(this.talkKey(c));
    this.speaker.sync(this.nowSec);
    this.deps.bus.emit("npc:left", { npcId: c.memKey, visitId: c.id, reason: LEAVE_REASON[reason] });
  }

  /** ⚠️ Sự thật thế giới chỉ ghi ở đây, mỗi frame, một chỗ — ghi nhiều chỗ là sớm muộn lệch. */
  private tickWorldFacts() {
    if (this.wasOvenBusy && !this.ovenBusy) this.lastBatchOutAt = this.nowSec;
    this.wasOvenBusy = this.ovenBusy;

    const queue = this.customers.filter((c) => this.inQueue(c) && !c.aside);
    for (let i = 0; i < queue.length; i++) {
      const c = queue[i];
      if (!c.cutLine) c.cutLine = queue.slice(0, i).some((before) => before.arrivedSeq > c.arrivedSeq);
      // Đã nhận bánh mà còn đứng, hoặc đứng đầu chưa chịu gọi; `arriving` không tính.
      const served = c.leaveReason === "served" || this.serveOutcome.has(c.id);
      c.blocking = c.slot === 0 && queue.length > 1 && (served || c.phase === "queueing");
    }
    for (const c of this.customers) if (!queue.includes(c)) { c.cutLine = false; c.blocking = false; }

    this.shadeFree = this.customers.filter((c) => c.inShade).length < SHADE_CAPACITY;
    if (this.ganh === null && this.customers.some((c) => c.memKey === "BA_SAU")) this.ganh = "NGOAI";
    if (this.cart === null && this.customers.some((c) => c.memKey === "CHU_KIET")) this.cart = "LAN";

    this.seatFree = has(this.deps.equip, "GHE_BAN")
      && this.customers.filter((c) => c.sitting).length < SEAT_CAPACITY;

    for (const c of this.customers) {
      if (c.inShade && c.now >= c.shadeUntil) this.leaveShade(c);
      if (c.sitting && c.now >= c.sitUntil) this.standUp(c);
      if (c.filming) this.tickFilm(c);
      if (c.eating && c.now >= c.eatUntil) c.eating = false;
      if (c.lookInsideUntil && c.now >= c.lookInsideUntil) c.lookInsideUntil = 0;
    }
  }

  /** Ba nấc: nhắc → nói nặng → bỏ đi. */
  private tickDeeds() {
    for (let i = this.deeds.length - 1; i >= 0; i--) {
      const d = this.deeds[i];
      const c = d.c;
      if (c.phase === "leaving" && !c.pass) { this.deeds.splice(i, 1); continue; }
      // Người lạ bỏ qua hai nấc đầu, nóng tính bỏ nấc một.
      const first = c.npc ? (c.personality.nongTinh >= 0.8 ? 1 : 0) : 2;
      const stage = DEED_STAGES.findIndex((m, k) => k >= first && c.now >= d.dueAt + (m - 1) * d.deed.dueSec);
      if (stage < 0 || stage < d.nudged) continue;
      d.nudged = stage + 1;
      const step = d.deed.onBroken?.[stage];
      if (stage === 0) {
        this.say(c, `${DEED_LABEL[d.deed.what] ?? "Cái hồi nãy"}… sao rồi {you}?`, 2, true, 70);
        if (step) this.applyTalkOption(c, step);
      } else if (stage === 1) {
        this.say(c, "Thôi khỏi. Nói vậy chớ có làm đâu.", 2, true, 85);
        this.applyTalkOption(c, step ?? { anger: 25 });
      } else {
        if (step) this.applyTalkOption(c, step);
        this.deeds.splice(i, 1);
        c.visit.promised = c.visit.promised.filter((x) => x !== d.deed.what);
        this.walkOn(c);
        continue;
      }
      if (stage >= 2) this.deeds.splice(i, 1);
    }
  }

  pendingDeeds(memKey: string): { what: string; label: string; leftSec: number }[] {
    return this.deeds.filter((d) => d.c.memKey === memKey).map((d) => ({
      what: d.deed.what,
      label: DEED_LABEL[d.deed.what] ?? d.deed.what,
      leftSec: Math.max(0, d.dueAt - d.c.now),
    }));
  }

  private assignSlots() {
    let i = 0;
    for (const c of this.customers) {
      if (c.phase === "leaving" || c.balking) continue;
      if (c.aside || c.sitting) { c.slot = -1; c.occluder = 1; continue; }
      const from = c.zone;
      c.slot = i < SLOTS.length ? i : SLOTS.length - 1;
      c.zone = SLOTS[c.slot].zone;
      c.occluder = c.slot >= 2 ? 0.7 : 1;
      if (from !== c.zone && c.phase !== "arriving") {
        this.deps.bus.emit("npc:slotChanged", { npcId: c.memKey, from: from as CustomerSlot, to: c.zone as CustomerSlot });
      }
      i++;
    }
  }

  /** `wait` cộng vào quãng trễ; hạn đếm từ lúc hết trễ nên không ăn mất cửa sổ nói. */
  private say(c: Customer, text: string, tier: 1 | 2 | 3 = 2, log = false, pri = 50, rule?: Rule, wait = 0, offer = false) {
    const delay = wait + BARK_DELAY_MIN + this.dialogRng.next() * BARK_DELAY_SPAN;
    this.queue.push({ c, text, tier, delay, log, pri, waited: 0, held: 0, rule, offer });
    this.deps.bus.emit("bark:queued", { npcId: c.memKey, tier, delaySec: delay });
  }

  private buildQuery(c: Customer, extra: Extra): Query {
    const q = this.query.reset();
    const h = Math.floor(this.nowMin / 60), mm = Math.floor(this.nowMin % 60);
    q.set("hour", h * 100 + mm);
    q.set("timeSlot", this.nowMin < DAY_START_MIN ? "PRE_OPEN" : this.nowMin < PEAK_END_MIN ? "PEAK" : this.nowMin < 630 ? "MID" : "LULL");
    q.set("day", this.deps.day);
    q.set("stallCleanliness", Math.round((1 - this.dirt) * 100));
    q.set("queueLength", this.audience.length);
    q.set("customersServedToday", this.servedCount);
    if (this.dirtRemarked) q.set("dirtRemarkedToday", true);
    q.set("playerHandsDirty", this.handsDirty);
    if (has(this.deps.equip, "LO_DIEN")) q.set("equipLoDien", true);

    const m = this.mem(c.memKey);
    const p = c.personality;
    q.set("npcId", c.npc ? c.npc.id : "KHACH_VANG_LAI");
    q.set("npcSoi", Math.round(p.soi * 100));
    q.set("npcNongTinh", Math.round(p.nongTinh * 100));
    q.set("npcDeTha", Math.round(p.deTha * 100));
    q.set("npcThanThien", Math.round(p.thanThien * 100));
    q.set("npcVisitCount", m.visits);
    q.set("npcSlot", Math.max(0, c.slot));
    q.set("npcGazeState", c.gazeState);
    q.set("npcMood", c.dayMood.value);
    q.set("npcMoodCause", c.dayMood.cause);
    for (const k in extra) q.set(k, extra[k]);
    return q;
  }

  /** `concept` luôn là chuỗi literal để validator dò được. */
  private speakConcept(
    c: Customer, concept: string, extra: Extra, pri = 50, log = false,
    vars: Record<string, string> = {}, wait = 0, wrap?: { pre?: string; post?: string },
  ): boolean {
    const q = this.buildQuery(c, extra);
    const got = this.speaker.pick(concept, c.memKey, q, this.nowSec, vars);
    if (!got) {
      this.deps.bus.emit("dialog:silent", { npcId: c.memKey, reason: "NO_RULE" });
      return false;
    }
    if (got.rule.silent) {
      this.speaker.spoken(got.rule, c.memKey, this.nowSec);
      this.deps.bus.emit("dialog:silent", { npcId: c.memKey, reason: "PERSONALITY" });
      return false;
    }
    // Dài quá thì vế cảm ơn (`pre`) rụng trước, vế chê ở lại.
    const full = [wrap?.pre, got.text, wrap?.post].filter(Boolean).join(" ");
    const text = full.length > WRAP_SOFT_MAX ? [got.text, wrap?.post].filter(Boolean).join(" ") : full;
    this.say(c, text, got.tier, log, pri, got.rule, wait);
    return true;
  }

  private runFollowups() {
    for (let i = this.followups.length - 1; i >= 0; i--) {
      const f = this.followups[i];
      if (f.at > this.nowSec) continue;
      this.followups.splice(i, 1);
      if (!this.customers.includes(f.c) || f.c.phase === "leaving") continue;
      if (this.nowSec - f.at > FOLLOWUP_EXPIRE_SEC) continue;
      this.speakConcept(f.c, f.concept, {}, 45, true);
    }
  }

  /** ⚠️ Dùng ở hai chỗ (thả câu ra, và cộng đồng hồ quá hạn) và phải là CÙNG một phép thử. */
  private speechBlocked(p: Pending): boolean {
    const c = p.c;
    const slow = this.deps.readMul ?? 1;
    if (!c.speaking) return c.sayQuietFor < SAME_SPEAKER_GAP_SEC;
    // ⚠️ Sàn đứng trước trần cứng để câu đang hiện kịp được thấy trước khi bị đè.
    if (c.saidFor < BARGE_IN_SEC * slow) return true;
    if (p.held >= HOLD_MAX_SEC * slow) return false;
    return p.pri - c.sayPri < BARGE_IN_PRI;
  }

  tickDialog(dt: number) {
    if (this.followups.length) this.runFollowups();
    if (!this.queue.length) return;
    for (const p of this.queue) {
      if (p.delay > 0) { p.delay -= dt; continue; }
      // `waited` (hẻm ồn, quá hạn thì bỏ) khác `held` (xếp sau chính người nói, quá trần thì chen) — đừng gộp.
      if (this.speechBlocked(p)) p.held += dt;
      else p.waited += dt;
    }
    for (let i = this.queue.length - 1; i >= 0; i--) {
      const p = this.queue[i];
      const gone = !this.customers.includes(p.c);
      // Hạn co theo `readMul`, không thì bật trợ năng đọc chậm làm hẻm càng câm.
      const expire = QUEUE_EXPIRE_SEC * (this.deps.readMul ?? 1);
      if (gone || (p.waited > expire && p.pri < 100)) {
        this.queue.splice(i, 1);
        if (!gone) this.deps.bus.emit("dialog:silent", { npcId: p.c.memKey, reason: "EXPIRED" });
      }
    }
    const ready = this.queue.filter((p) => p.delay <= 0);
    if (!ready.length) return;
    ready.sort((a, b) =>
      Number(b.c.slot === 0) - Number(a.c.slot === 0) || b.pri - a.pri || a.tier - b.tier);

    let released = 0;
    for (const p of ready) {
      if (released >= DIALOG_QUERIES_PER_FRAME) { this.dialogDeferred++; break; }
      // ⚠️ Gác cả chính người sắp nói, không thì `speak()` đè mất câu trước (kể cả câu gọi món).
      if (this.speechBlocked(p)) { this.dialogDeferred++; continue; }
      const others = this.customers.filter((x) => x.speaking && x !== p.c).length;
      if (others >= MAX_BUBBLES) { this.dialogDeferred++; break; }
      this.queue.splice(this.queue.indexOf(p), 1);
      const slow = this.deps.readMul ?? 1;
      p.c.speak(p.text, p.offer ? offerBubbleLife(p.text, slow) : bubbleLife(p.text, slow), p.pri);
      released++;
      if (p.rule) {
        this.speaker.spoken(p.rule, p.c.memKey, this.nowSec);
        if (p.rule.applycontext.some((a) => a.name === "ctxNhacQuayDo")) this.dirtRemarked = true;
        const f = p.rule.followup;
        if (f) this.followups.push({ c: p.c, concept: f.concept, at: this.nowSec + bubbleLife(p.text, slow) + f.delaySec });
      }
      this.deps.bus.emit("dialog:spoken", { npcId: p.c.memKey, text: p.text, tier: p.tier });
      if (p.log) this.out.push({ kind: "log", text: `${this.label(p.c)}: ${p.text}` });
    }
  }

  /** Lỗi thấy lúc làm → ANTICIPATED, không thấy → DISCOVERED; không bao giờ trừ tiền bánh. */
  serveDish(
    dish: Ingredient[],
    opts: { cold?: boolean; crust?: number; quality?: number; soiled?: boolean; burnAt?: number; singeAt?: number; sick?: number } = {},
  ): ServeResult {
    const c = this.front;
    if (!c || c.phase !== "waiting") return { ok: false, reason: "chưa có ai chờ lấy bánh" };
    const bus = this.deps.bus;

    // Mốc NOTICED: liếc thấy rơi là đủ để không ăn.
    if (opts.soiled && rank(peakOf(c, "DROPPED_FOOD")) >= rank("NOTICED")) {
      this.react(c, "DROPPED_FOOD", 3);
      this.leave(c, "soiled");
      return { ok: false, reason: SOILED_REFUSE_TOAST };
    }
    const grit = !!opts.soiled;

    // Đọc `levels` gốc chứ không khẩu vị ẩn.
    const hollow = isHollowLoaf(c.order!, dish);
    if (hollow && !takesHollowLoaf(c.personality)) {
      if (!this.hollowShown.has(c.id)) {
        this.hollowShown.add(c.id);
        const mon = hollowWantLabel(c.order!);
        this.react(c, "ORDER_DEFECT", 2);
        this.speakConcept(c, "HOLLOW_LOAF", { dishRefused: true }, 92, true, { mon });
      }
      return { ok: false, reason: HOLLOW_REFUSE_TOAST };
    }

    let raw = diffDish(c.order!, dish);
    const alt = c.order!.alt;
    if (raw.length && alt) {
      const r2 = diffDish({ ...c.order!, levels: { ...c.order!.levels, ...alt } }, dish);
      if (!r2.length) raw = r2;
    }
    if (opts.cold) raw.push(mkDefect("WRONG_TEMP", null));
    const burnAt = opts.burnAt ?? CRUST.BURNT;
    // Ngưỡng sém của chính lò đang dùng — lò điện đẩy lên 1,30.
    const singeAt = opts.singeAt ?? CRUST.SINGED;
    const band = opts.crust === undefined ? null : bandOfCrust(opts.crust, burnAt, singeAt);
    const crustLow = band === "RAW";
    const crustSinged = band === "SINGED";
    if (crustLow) raw.push(underdoneDefect(opts.crust!));
    else if (crustSinged) raw.push(singedDefect(opts.crust!, burnAt, singeAt));
    if (opts.quality !== undefined && 1 - opts.quality >= tasteThreshold(c.personality.soi)) raw.push(mkDefect("TASTE_OFF", null));
    const defects: DiffedDefect[] = raw.map((d) => {
      const key = d.kind === "WRONG_TEMP" || d.kind === "STUFFED" || d.kind === "TASTE_OFF" ? null : orderDefectKey(c.id, d.kind, d.item);
      const seen = key ? rank(peakOfKey(c, key)) >= rank("NOTICED") : false;
      return { ...d, key, witness: seen ? "ANTICIPATED" : "DISCOVERED" };
    });
    bus.emit("order:delivered", { npcId: c.memKey, dish: [...dish], waitedSec: this.nowSec - c.orderedAt });

    // Lỗi vỏ bánh không bao giờ là câu chính khi còn lỗi khác — nó thành vế bổ sung.
    const crustDefect = defects.find(isCrustDefect) ?? null;
    const others = crustDefect ? defects.filter((d) => d !== crustDefect) : defects;
    const spoken = this.pickSpoken(others.length ? others : defects);
    const crustTail = crustDefect && spoken !== crustDefect ? crustDefect : null;
    // Cho thêm trên ổ có lỗi vẫn được nói ra, dù không được điểm.
    const extraMons = extraPortions(c.order!, dish).map(labelOf);
    const gaveExtra = extraMons.length > 0;
    const playerSay = gaveExtra
      ? this.fill(c, this.barks.take("extraOffer", c.memKey, { mon: monVi(extraMons) }))
      : undefined;
    let positive = 0;
    if (defects.length === 0) {
      const extra = this.freeExtra(c, dish);
      positive += extra;
      positive += this.settlePledge(c, dish);
      this.speakConcept(c, "DELIVERY", {
        defectCount: 0, freeExtraTooMuch: extra < 0, freeExtraGiven: gaveExtra,
      }, extra < 0 ? 70 : 60, true);
    } else if (hollow) {
      positive += this.settlePledge(c, dish);
      this.speakConcept(c, "HOLLOW_LOAF", { dishRefused: false }, 90, true, { mon: hollowWantLabel(c.order!) });
    } else if (spoken) {
      positive += this.settlePledge(c, dish);
      // ⚠️ `dishUnderdone`/`dishSinged` chỉ đặt khi lỗi vỏ bánh là câu chính.
      this.speakConcept(c, "DELIVERY", {
        defectCount: defects.length, defectKind: kindOf(spoken), defectWasSeen: spoken.witness === "ANTICIPATED",
        freeExtraGiven: gaveExtra,
        dishUnderdone: spoken === crustDefect && crustLow,
        dishSinged: spoken === crustDefect && crustSinged,
      }, 90, true, { mon: this.monList(spoken, defects) }, 0, {
        pre: gaveExtra ? this.barks.take("thanksExtra", c.memKey, this.addressOf(c)) : "",
        post: crustTail ? this.barks.take("crustTail", c.memKey, { ...this.addressOf(c), mon: crustTailWord(crustTail) }) : "",
      });
    } else {
      positive += this.settlePledge(c, dish);
      bus.emit("dialog:silent", { npcId: c.memKey, reason: "RATE_35" });
    }

    const taste = tasteOf(c.memKey);
    const sat = taste ? satisfaction(taste, servedVector(dish, opts.crust ?? 0.66)) : 0.6;
    positive += sat * 35;
    let process = 0;
    for (const o of c.observations.values()) {
      if (o.peak === "CONFIRMED" && (o.id === "DIRTY_HANDS" || o.id === "DROPPED_FOOD" || o.id === "BURNT_OR_COLD")) {
        process += SALIENCE[o.id] * 0.5;
      }
    }
    const silentScore = this.silentScore(defects, spoken, positive) + process;
    const toBus = (d: DiffedDefect) => ({ kind: d.kind, item: d.item, text: d.text, weight: d.weight, witness: d.witness });
    bus.emit("delivery:diffed", {
      npcId: c.memKey,
      defects: defects.map(toBus),
      spoken: spoken ? toBus(spoken) : null,
      silentScore,
      mode: spoken ? spoken.witness : defects.length ? "DISCOVERED" : "NONE",
    });

    const worst = defects.reduce((a, d) => Math.max(a, (d.witness === "DISCOVERED" ? d.sEat : d.sCounter) * d.magnitude), 0);

    if (defects.length) this.react(c, "ORDER_DEFECT", worst >= DEFECT_FACE_I3 ? 3 : 2);
    else this.react(c, "FREE_EXTRA", 2, "HAND_OUT");

    if (hollow) this.out.push({ kind: "log", text: `${this.label(c)} cầm ổ chưa có nhân — tính tiền bánh mì không.` });
    this.settlePayment(c, this.pricedAfterPledge(c, this.priceOf(hollow ? { mon: "khong" } : c.order!.intent)));
    // GRIT đứng TRƯỚC DEFECT — xem `ServeOutcome`.
    this.serveOutcome.set(c.id, grit ? "GRIT" : defects.length ? "DEFECT" : c.waitStage >= 2 ? "WAITED" : "CLEAN");
    c.carrying = true;
    const sawHygiene = [...c.observations.values()].some((o) => o.peak === "CONFIRMED"
      && (o.id === "DROPPED_FOOD" || o.id === "DIRTY_HANDS" || o.id === "BURNT_OR_COLD"));
    if (c.personality.soi >= 0.7 && c.personality.nongTinh <= 0.3 && (sawHygiene || (isSilentGrudge(c.personality) && defects.length > 0))) {
      c.binDetour = true;
    }
    if ((opts.sick ?? 0) > 0 && this.deps.hub.derive(`sick:${this.deps.day}:${c.id}`).next() < opts.sick!) {
      const t = this.deps.todayCounters;
      if (t) t.sick = (t.sick ?? 0) + 1;
    }
    this.rollPriceVerdict(c);
    this.leave(c, "served");
    return { ok: true, playerSay };
  }

  /** ⚠️ Không qua túi im lặng: đây là chỗ duy nhất người chơi biết mình làm trật chỗ nào. */
  private pickSpoken(defects: DiffedDefect[]): DiffedDefect | null {
    if (!defects.length) return null;
    const score = (d: DiffedDefect) => (d.witness === "DISCOVERED" ? d.sEat : d.sCounter) * d.magnitude;
    const sorted = [...defects].sort((a, b) => score(b) - score(a));
    let top = sorted[0];
    const ant = sorted.find((d) => d.witness === "ANTICIPATED");
    if (ant && score(top) - score(ant) < 15) top = ant;
    return top;
  }

  /** Gom mọi món cùng `kindOf` lỗi vào `{mon}` để người chơi sửa hết một lượt. */
  private monList(spoken: DiffedDefect, defects: DiffedDefect[]): string {
    const k = kindOf(spoken);
    const same = defects.filter((d) => d.item && kindOf(d) === k);
    const names = [spoken.label, ...same.map((d) => d.label)];
    return monVi([...new Set(names)].slice(0, MON_LIST_MAX));
  }

  private silentScore(defects: DiffedDefect[], spoken: DiffedDefect | null, positive: number) {
    const perKind = new Map<string, number>();
    let s = 0;
    for (const d of defects) {
      const n = (perKind.get(d.kind) ?? 0) + 1;
      perKind.set(d.kind, n);
      const base = d.witness === "DISCOVERED" ? d.sEat : d.sCounter;
      s += base * (d === spoken ? 0.7 : 1) * 0.75 ** (n - 1) * (d.witness === "ANTICIPATED" ? 0.8 : 1) * d.magnitude;
    }
    return Math.max(0, s - positive * 0.6);
  }

  /** Nhỏ dần trong ngày; người soi ≥ 0,7 tới lần thứ 3 thì phản tác dụng. */
  private freeExtra(c: Customer, dish: Ingredient[]) {
    if (generosityOf(c.order!, dish) <= 0) return 0;
    const n = (this.freeExtraToday.get(c.memKey) ?? 0) + 1;
    this.freeExtraToday.set(c.memKey, n);
    if (n >= 3 && c.personality.soi >= 0.7) return -FREE_EXTRA_BASE;
    const mul = FREE_EXTRA_DIMINISH[Math.min(n - 1, FREE_EXTRA_DIMINISH.length - 1)];
    this.emitStim("FREE_EXTRA", { salience: FREE_EXTRA_BASE * mul });
    return FREE_EXTRA_BASE * mul;
  }

  /** Công cụ hạ attention dễ phá game nhất, nên khoá nhiều lớp: cooldown, nhỏ dần, trần theo `soi`, tốn tiền. */
  serveTea(): ServeResult {
    const c = this.front;
    if (!c || c.phase === "leaving") return { ok: false, reason: "chưa có ai để mời" };
    if (c.holdingTea) return { ok: false, reason: `${this.label(c)} còn cầm ly kia` };
    if (this.teaSuspect(c)) return this.refuseTea(c);
    if (!has(this.deps.equip, "BINH_TRA")) return { ok: false, reason: "chưa có bình nước trà" };
    if (this.teaLeft <= 0) return { ok: false, reason: "hết đá rồi" };

    const cup = (this.teaToday.get(c.memKey) ?? 0) + 1;
    if (cup >= teaSuspectAtCup(c.personality.soi)) {
      const m = this.mem(c.memKey);
      (m.seen ??= {}).teaSuspect = this.deps.day;
      return this.refuseTea(c);
    }
    this.teaToday.set(c.memKey, cup);

    this.teaLeft--;
    this.out.push({ kind: "cost", amount: TEA_COST, item: "tea" });
    c.visit.gaveTea = true;
    this.keepDeed(c, "ROT_TRA");
    const mul = c.takeTea(cup);
    if (mul > 0) {
      this.speakConcept(c, "INTERACT", { interaction: "TEA" }, 40, true);
      this.emitStim("CARED_FOR_THEM", { salience: SALIENCE.CARED_FOR_THEM * mul, target: c.id });
      this.deps.bus.emit("attention:toolUsed", { tool: "TRA_DA", npcId: c.memKey, durationSec: TEA.sipDelay + 2.5 });
    } else {
      this.speakConcept(c, "INTERACT", { interaction: "TEA_NOD" }, 20);
    }
    return { ok: true };
  }

  /** Nhớ qua đêm và qua save; ⚠️ khách vãng lai dùng chung `memKey` theo dáng. */
  private teaSuspect(c: Customer) {
    return !!this.mem(c.memKey).seen?.teaSuspect;
  }

  private refuseTea(c: Customer): { ok: false; reason: string } {
    this.speakConcept(c, "INTERACT", { interaction: "TEA_SUSPECT" }, 70, true);
    this.react(c, "CARED_FOR_THEM", 2, undefined, "NAME");
    return { ok: false, reason: `${this.label(c)} không nhận nữa` };
  }

  /** Người đã nhận bánh mà nán lại không tính. */
  private someoneWaiting(except: Customer | null = null): boolean {
    return this.customers.some((c) =>
      c !== except && !c.balking && !c.pass
      && (c.phase === "queueing" || c.phase === "ordering" || c.phase === "waiting"));
  }

  /** ⚠️ Trừ chính người đang nói chuyện (`except`), không thì người đang chờ bánh không bao giờ mở miệng được. */
  private canOpenDeep(except: Customer | null = null): boolean {
    return !this.someoneWaiting(except) && !deepGateReason(this.deepToday, this.nowMin);
  }

  /** `SHORT`/`BARK` nói được lúc đang bán nhưng chỉ với người đang phục vụ. */
  private canRun(t: Talk, c: Customer): boolean {
    const kind = talkKindOf(t);
    // `inviteChance` đã tính quán vắng, không bắt qua trần ngày nữa.
    if (kind === "MOI") return !this.someoneWaiting(c);
    if (t.depth === "FULL") return this.canOpenDeep(c);
    return !this.someoneWaiting(c) || c === this.front || !!this.offerFor(c);
  }

  /** ⚠️ Hợp đồng với scene: dải mở thì `clock.busy = true`, không đóng băng. */
  openTalk(): TalkView | null {
    if (this.talkSession) return this.talkView("");
    const c = this.talkTarget();
    if (!c) return null;
    const key = this.talkKey(c);
    if (c.ambient && (this.passerTalks.get(c.id) ?? 0) >= PASSER_TALKS_MAX) return null;
    const waiting = this.offerFor(c);
    if (!waiting && !this.talks.has(key)) { this.talks.ensure(key); return null; }
    // ⚠️ Cuộc giữ dở chỉ thắng khi còn chạy được, không thì nó khoá cả kho `ANY`.
    const held = this.heldTalk.get(c.id);
    const talk = waiting?.talk
      ?? (held && this.canRun(held, c) && this.stillEligible(held, c) ? held : null)
      ?? this.pickRunnable(c, "PLAYER")
      ?? pickTalk(this.talks.get(key), this.talkCtx(c), this.dialogRng, "PLAYER");
    if (!talk) return null;
    if (!this.canRun(talk, c)) { this.heldTalk.set(c.id, talk); return null; }
    const opened = !!waiting;
    if (waiting) this.offers.splice(this.offers.indexOf(waiting), 1);
    this.heldTalk.set(c.id, talk);
    // Chưa đánh dấu đã dùng lúc mở, để mở rồi bỏ ngang không mất cuộc cả ván.
    this.talkSession = new TalkSession(talk, c.memKey);
    this.talkWith = c;
    this.holdTalkVoice(c);
    this.talkAngered = false;
    this.actReply = null;
    if (c.ambient && c.pass) {
      c.pass.spot = { x: c.x, y: c.y };
      c.pass.until = c.now + PASSER_TALK_TAIL;
    }
    this.talkEngaged = false;
    this.talkNpcOpened = opened;
    if (c.now - c.lastAskedAt >= ASK_COOLDOWN) {
      c.ask();
      this.deps.bus.emit("attention:toolUsed", { tool: "ASK_QUESTION", npcId: c.memKey, durationSec: 3 });
    }
    // ⚠️ Không phát `talk.opener`: nó chỉ dành cho NPC tự mở lời (`offerTalk`).
    return this.talkView("", false, undefined);
  }

  /** Suy từ trạng thái; thứ tự duyệt là thứ tự chặt dần. */
  practiceOf(c: Customer): PracticeId {
    if (c.ambient || c.pass) return "DI_NGANG";
    if (c.phase === "queueing" || c.phase === "arriving") return "XEP_HANG";
    // Pha `ordering` chỉ vài frame nên `GOI_MON` kéo dài tới hết `ORDER_WINDOW`.
    if (c.phase === "ordering") return "GOI_MON";
    if (c.phase === "waiting") return c.waitRatio < ORDER_WINDOW ? "GOI_MON" : "DOI_BANH";
    if (c.leaveReason === "served" || this.serveOutcome.has(c.id)) {
      return this.someoneWaiting(c) ? "NAN_LAI" : "QUAY_VANG";
    }
    return "QUAY_VANG";
  }

  private snapshot(c: Customer): WorldSnapshot {
    const m = this.mem(c.memKey);
    return {
      hand: this.playerHand,
      handsDirty: this.handsDirty,
      onStreet: this.playerOnStreet,
      soldOut: this.soldOut,
      cash: this.deps.till?.floatLeft ?? 0,
      teaLeft: this.teaLeft,
      stock: this.stock,
      them: {
        phase: c.phase,
        practice: this.practiceOf(c),
        passing: !!c.pass,
        served: c.leaveReason === "served" || this.serveOutcome.has(c.id),
        named: !!c.npc,
        cutLine: c.cutLine,
        blocking: c.blocking,
        // ⚠️ `pass.stay` là kế hoạch lúc spawn; `pass.until >= 0` mới là đã tới chỗ ngó.
        glanced: !!c.pass && c.pass.stay > 0 && c.pass.until >= 0,
        // Người đi ngang không chạy `gazeState`, nên đo bằng quãng dừng ngó.
        lookingInside: c.pass
          ? c.pass.stay > 0 && c.pass.until >= 0 && c.now < c.pass.until
          : c.gazeState === "WATCH",
        inShade: c.inShade,
        sitting: c.sitting,
        filming: c.filming,
        onPhone: c.gazeState === "PHONE",
        eating: c.eating,
        hasOrder: !!c.order,
        waitRatio: c.waitRatio,
        purpose: c.purpose?.id ?? null,
        state: c.purposeState?.id ?? null,
      },
      convo: {
        tones: this.talkSession?.picked.map((p) => p.tone) ?? [],
        angered: this.talkAngered,
        openedBy: this.talkNpcOpened ? "NPC" : "PLAYER",
      },
      visit: {
        gaveTea: c.visit.gaveTea,
        gaveFood: c.visit.gaveFood,
        apologised: c.visit.apologised,
        promised: c.visit.promised,
        inviteRefused: c.inviteRefused,
      },
      day: {
        met: m.lastSeenDay === this.deps.day && m.visits > 1,
        told: this.toldToday.get(c.memKey) ?? EMPTY_STR,
      },
      hot: !isRain(weatherOf(this.deps.day)) && bandOf(this.nowMin) !== "PRE_OPEN",
      rain: isRain(weatherOf(this.deps.day)),
      peak: bandOf(this.nowMin) === "PEAK",
      queue: this.audience.length,
      shadeFree: this.shadeFree,
      seatFree: this.seatFree,
      ganhOut: this.ganh === "NGOAI",
      cartLan: this.cart === "LAN",
      cartChung: this.cart === "CHUNG",
      ovenHot: this.ovenHot,
      meVuaRa: this.meVuaRa,
      band: bandOfMinutes(this.nowMin),
      dayIndex: this.deps.day,
    };
  }

  chooseTalk(i: number): TalkView | null {
    const s = this.talkSession, c = this.talkWith;
    if (!s || !c) return null;
    // Gia hạn TRƯỚC khi chạy nhịp: nhịp này có thể là nhịp cuối và tự gọi `endTalk()`.
    this.holdTalkVoice(c);
    // `while` không ẩn lựa chọn như `need`: câu vừa còn đúng nên bấm vào phải ra phản ứng.
    const pending = s.peek(i, this.talkGate());
    if (pending?.while?.length) {
      const w = this.snapshot(c);
      if (!allHold(pending.while, w)) {
        const why = firstBroken(pending.while, w);
        this.deps.bus.emit("dialog:silent", { npcId: c.memKey, reason: "NO_RULE" });
        this.out.push({ kind: "log", text: `con: "${this.fill(c, pending.say)}"` });
        this.out.push({ kind: "log", text: `${this.label(c)}: "?"` });
        void why;
        // Gạch đi, không thì bấm được vô hạn lần.
        if (s.strike(pending)) { this.endTalk(); return null; }
        return this.talkView("?", false, "NGHI", this.fill(c, pending.say));
      }
    }
    const r = s.choose(i, this.talkGate());
    if (!r) return null;
    if (!this.talkEngaged) {
      this.talkEngaged = true;
      if (c.ambient) this.passerTalks.set(c.id, (this.passerTalks.get(c.id) ?? 0) + 1);
      this.markTalkUsed(c, s.talk);
      this.heldTalk.delete(c.id);
      // Tính theo cuộc đã nói, không theo cuộc đã mở.
      if (countsAgainstDailyCap(s.talk)) this.deepToday++;
    }
    this.out.push({ kind: "log", text: `con: "${this.fill(c, r.node.say)}"` });
    this.actReply = null;
    this.applyTalkOption(c, r.node);
    const act = this.takeActReply();
    const reply = act?.text ?? r.reply;
    if (reply) this.out.push({ kind: "log", text: `${this.label(c)}: "${this.fill(c, reply)}"` });
    else if (r.node.silent) this.reactTalk(c, "NAME", 1, "TURN_AWAY_QUARTER");
    const view = this.talkView(this.fill(c, reply ?? ""), !reply && !!r.node.silent,
      act?.mood ?? r.node.mood, this.fill(c, r.node.say));
    if (r.done) {
      // Người đi ngang nói xong thì đi tiếp, trừ khi vừa nhận lời mời, đang đứng chỗ mát hay đang ăn.
      const stays = c.inShade || c.eating || !c.ambient;
      this.endTalk();
      if (c.ambient && !stays) this.walkOn(c);
    }
    return view;
  }

  /** Không phải nút huỷ: làm thinh là một câu trả lời và có giá. */
  closeTalk(): void {
    const s = this.talkSession, c = this.talkWith;
    const engaged = this.talkEngaged, npcOpened = this.talkNpcOpened;
    this.endTalk();
    if (!s || !c || s.done) return;
    // Bấm F rồi đổi ý khi chưa nói gì thì không mất gì.
    if (npcOpened || engaged) this.applyIgnore(c, s.talk);
    if (c.ambient && !c.inShade && !c.eating) this.walkOn(c);
  }

  /** Ánh xạ nguyên nhân kỹ thuật sang lý do con người; ⚠️ duyệt người chơi trước, hoàn cảnh sau. */
  talkUnavailable(): string | null {
    const c = this.talkTarget();
    if (!c) return null;
    if (!this.talks.has(this.talkKey(c))) return null;
    const who = this.label(c);
    if (c.inviteRefused) return `${who} nói rồi — người ta đi tiếp.`;
    if (c.ambient) {
      if ((this.passerTalks.get(c.id) ?? 0) >= PASSER_TALKS_MAX) {
        return `${who} nói chuyện nãy giờ rồi — người ta còn đi.`;
      }
      if (this.someoneWaiting(c)) return "Còn người đang chờ bánh — để lát hãy mời.";
      if (this.soldOut) return "Hết bánh — mời vào cũng không có gì bán.";
      return `${who} đi lướt qua, không nhìn lại.`;
    }
    if (c.phase === "queueing") return `${who} đang chờ tới lượt.`;
    if (c.phase === "waiting" && c.waitRatio >= 0.6) return `${who} nhìn đồng hồ — thôi làm cho người ta đi.`;
    if (this.someoneWaiting(c)) return "Còn người đang chờ bánh — để lát.";
    if (c.dayMood.value < 0) return `${who} hôm nay không có tâm trạng.`;
    const gate = deepGateReason(this.deepToday, this.nowMin);
    if (gate) return gate;
    if (this.heldTalk.has(c.id) || !this.canOpenDeep(c)) return `${who} gật đầu một cái rồi quay đi.`;
    return `${who} gật một cái, hết.`;
  }

  get talkTargetNow(): Customer | null {
    return this.talkTarget();
  }

  talkVerb(c: Customer): "mời" | "nói chuyện" {
    if (!c.ambient) return "nói chuyện";
    const ok = eligible(this.talks.get(this.talkKey(c)), this.talkCtx(c), "PLAYER");
    return ok.some((t) => talkKindOf(t) === "MOI" && this.canRun(t, c)) ? "mời" : "nói chuyện";
  }

  /** ⚠️ Không loại `front` — người đầu quầy cũng phải được tô sáng. */
  nearbyToTalk(): Customer | null {
    return this.talkTarget();
  }

  /** Người đã mua xong đang quay lưng thì không gọi giật lại. */
  private talkable(c: Customer) {
    if (c.balking) return false;
    if (c.phase === "arriving") return false;
    return c.pass ? true : c.phase !== "leaving";
  }

  /** Nhỏ nhất thắng, `Infinity` là loại; ⚠️ trục `y` ở quầy gần như hằng số nên đè trọng số thấp. */
  private talkCost(c: Customer, p: { x: number; y: number }): number {
    if (!this.talkable(c)) return Infinity;
    const dx = Math.abs(c.x - p.x), dy = Math.abs(c.y - p.y);
    if (Math.hypot(dx, dy) > TALK_REACH) return Infinity;
    let cost = TALK_W_LATERAL * dx + TALK_W_DEPTH * dy;
    if (this.offerFor(c)) cost += TALK_B_ADDRESSED;
    if (c === this.front) cost += TALK_B_FRONT;
    if (c.inviteRefused) cost += TALK_P_REFUSED;
    return cost;
  }

  /** Chỉ báo trên màn hình và cú bấm phím cùng đọc hàm này. */
  private talkTarget(): Customer | null {
    const p = this.playerAt;
    if (!p) {
      const spoke = this.offers.find((o) => this.talkable(o.c));
      if (spoke) return spoke.c;
      const f = this.front;
      return f && this.talkable(f) ? f : null;
    }
    let best: Customer | null = null, bestCost = Infinity;
    for (const c of this.customers) {
      let cost = this.talkCost(c, p);
      if (c === this.lastTarget) cost -= TALK_STICKY;
      if (cost < bestCost) { best = c; bestCost = cost; }
    }
    this.lastTarget = best;
    return best;
  }

  private stillEligible(t: Talk, c: Customer): boolean {
    return eligible([t], this.talkCtx(c), "PLAYER").length > 0;
  }

  private offerFor(c: Customer) {
    return this.offers.find((o) => o.c === c) ?? null;
  }

  /** ⚠️ Lọc `canRun` TRƯỚC khi rút, không thì phần lớn lượt rút trúng cuộc không chạy được. */
  private pickRunnable(c: Customer, by: TalkOpenBy): Talk | null {
    const pool = this.talks.get(this.talkKey(c));
    const ctx = this.talkCtx(c);
    const ok = eligible(pool, ctx, by).filter((t) => this.canRun(t, c));
    if (!ok.length) return null;
    // Người đi ngang thì ưu tiên tuyệt đối cuộc `MOI`, khớp dòng nhắc "mời".
    const prefer = c.ambient ? ok.filter((t) => talkKindOf(t) === "MOI") : [];
    const list = prefer.length ? prefer : ok;
    return pickTalk(list, ctx, this.dialogRng, by);
  }

  get talkOpen() {
    return this.talkSession !== null;
  }

  /** Cho bot ở `sim/headless.ts`. */
  optionActs(): { kind: string | null; sau: readonly string[] }[] {
    const s = this.talkSession;
    const here = s?.options;
    if (!s || !here) return [];
    return visibleOptions(here, this.talkGate()).map((n) => ({
      kind: n.act?.kind ?? null,
      sau: actsUnder(n, s.talk),
    }));
  }

  /** Nói ngay, bỏ qua lịch nói (`say`) vốn có trễ, trần bong bóng và hạn bỏ câu. */
  talkPartnerSpeak(text: string, sec: number) {
    const c = this.talkWith ?? (this.nowSec <= this.talkVoiceUntil ? this.talkVoice : null);
    if (!c || !this.customers.includes(c)) return;
    c.speak(text, sec);
  }

  private holdTalkVoice(c: Customer) {
    this.talkVoice = c;
    this.talkVoiceUntil = this.nowSec + TALK_VOICE_TAIL;
  }

  private owesLine(c: Customer) {
    return this.talkVoice === c && this.nowSec <= this.talkVoiceUntil;
  }

  get talkingTo(): Customer | null {
    return this.talkWith;
  }

  /** Hàm riêng vì đọc thẳng `this.actReply` thì TS thu hẹp kiểu về `null`. */
  private takeActReply() {
    const r = this.actReply;
    this.actReply = null;
    return r;
  }

  private endTalk() {
    this.talkSession = null;
    this.talkWith = null;
    this.talkEngaged = false;
    this.talkNpcOpened = false;
    this.talkAngered = false;
    this.actReply = null;
  }

  private applyIgnore(c: Customer, talk: Talk) {
    const ig = talk.ignore ?? {};
    this.applyTalkOption(c, { anger: ig.anger, mood: ig.mood });
    if (ig.reply) this.say(c, this.fill(c, ig.reply), 2, true, 55);
  }

  private talkFlags(): TalkCtx["flags"] {
    return this.deps.flags ?? {};
  }

  private talkGate(): TalkGate {
    // Không ai đang nói chuyện thì `holds` vắng và mọi khoá bảng đen coi như đúng.
    const c = this.talkWith;
    const w = c ? this.snapshot(c) : null;
    return {
      flags: this.talkFlags(),
      day: this.deps.day,
      holds: w ? (key: string) => holds(key, w) : undefined,
      cash: this.deps.till?.floatLeft,
      noInvite: !!c?.inviteRefused,
      hasEquip: (id: string) => has(this.deps.equip, id as EquipId),
    };
  }

  /** {call} mình gọi họ · {me} mình tự xưng · {self} họ tự xưng · {you} họ gọi mình. */
  private fill(c: Customer, s: string): string {
    if (!s.includes("{")) return s;
    const a = this.addressOf(c);
    if (s.includes("{gio}")) s = s.replace(/\{gio\}/g, gioVi(this.nowMin));
    if (s.includes("{gia")) {
      const one = c.order ? this.priceOf(c.order.intent) : this.priceOf({ mon: "opla" });
      s = s.replace(/\{gia(\d*)\}/g, (_m, n: string) => dongVi(one * (Number(n) || 1)));
    }
    return s.replace(/\{(call|me|self|you)\}/g, (_m, k: keyof typeof a, at: number) => {
      const w = a[k];
      const before = s.slice(0, at).trimEnd();
      return before === "" || /[.!?…]$/.test(before) ? w[0].toUpperCase() + w.slice(1) : w;
    });
  }

  /** Người lạ tra `WALKIN_ADDRESS` theo dáng. */
  private addressOf(c: Customer) {
    if (c.npc) return ADDRESS[c.npc.id] ?? ADDRESS.WALKIN;
    const i = Number(c.memKey.slice("walkin".length));
    return (c.memKey.startsWith("walkin") && WALKIN_ADDRESS[i]) || ADDRESS.WALKIN;
  }

  /** ⚠️ `QUA_DUONG` có kho riêng vì kho `WALKIN` toàn chuyện của người đang mua. */
  private talkKey(c: Customer) {
    return c.npc ? c.npc.id : c.ambient ? "QUA_DUONG" : "WALKIN";
  }

  private talkCtx(c: Customer): TalkCtx {
    const m = this.mem(c.memKey);
    return {
      npcId: this.talkKey(c),
      day: this.deps.day,
      slot: bandOf(this.nowMin),
      rain: isRain(weatherOf(this.deps.day)),
      flags: this.talkFlags(),
      usedToday: m.talkTopics?.day === this.deps.day ? m.talkTopics.topics : [],
      usedBefore: c.npc ? (m.talksDone ?? []) : (this.talkedThisVisit.get(c.id) ?? []),
      hasEquip: (id: string) => has(this.deps.equip, id as EquipId),
      practice: this.practiceOf(c),
      holds: (key: string) => holds(key, this.snapshot(c)),
      score: (t) => this.scoreTalk(c, t),
    };
  }

  private scoreTalk(c: Customer, t: Talk): number {
    return scoreSatisfies(satisfiesOf(t), drivesNow(c.driveBase, c.drives, this.practiceOf(c)));
  }

  /** Người có tên nhớ cả ván; người lạ nhớ theo lượt ghé; cuộc `ANY` không vào sổ ai. */
  private markTalkUsed(c: Customer, t: Talk) {
    // `satisfiesOf` dương = được thoả, nên trừ khỏi `drives`.
    for (const [k, drop] of Object.entries(satisfiesOf(t))) {
      if (drop) bump(c.drives, k as DriveId, -drop);
    }
    const m = this.mem(c.memKey);
    const told = this.toldToday.get(c.memKey) ?? [];
    if (!told.includes(t.topic)) { told.push(t.topic); this.toldToday.set(c.memKey, told); }
    if (!isSharedTalk(t)) {
      if (c.npc) (m.talksDone ??= []).push(t.id);
      else {
        const seen = this.talkedThisVisit.get(c.id) ?? [];
        seen.push(t.id);
        this.talkedThisVisit.set(c.id, seen);
      }
    }
    if (m.talkTopics?.day !== this.deps.day) m.talkTopics = { day: this.deps.day, topics: [] };
    m.talkTopics.topics.push(t.topic);
  }

  private talkView(line: string, silent = false, mood?: TalkMood, said?: string): TalkView | null {
    const s = this.talkSession, c = this.talkWith;
    if (!s || !c) return null;
    const here = s.options;
    const opts = here ? visibleOptions(here, this.talkGate()) : [];
    return {
      npcKey: c.memKey, name: this.label(c), line, silent, mood, said,
      skin: c.body.skin, hair: c.body.hair,
      at: { x: c.x, y: c.y },
      options: opts.map((o) => ({ say: this.fill(c, o.say), tone: o.tone })),
      done: s.done || !here,
    };
  }

  /** Phần lớn act treo lời hứa lên lượt ghé, tới lúc giao bánh/trả tiền mới quyết. */
  private applyAct(c: Customer, act: TalkAct, tone: TalkTone = "THUONG") {
    const pledge = (this.pledges.get(c.id) ?? { promised: [], discount: 0, free: false });
    this.pledges.set(c.id, pledge);
    switch (act.kind) {
      case "PAY": {
        const have = this.deps.till?.floatLeft ?? Infinity;
        const amt = Math.min(act.vnd, have);
        if (this.deps.till) this.deps.till.floatLeft -= amt;
        this.out.push({ kind: "cost", amount: amt, item: "talk" });
        this.out.push({ kind: "log", text: `${act.note} — ${amt.toLocaleString("vi-VN")}₫` });
        break;
      }
      case "TAKE_CASH": {
        // Vào `floatLeft`, không vào doanh thu; `cost` âm vì dương là tiền ra khỏi két.
        if (this.deps.till) this.deps.till.floatLeft += act.vnd;
        this.out.push({ kind: "cost", amount: -act.vnd, item: "talk" });
        this.out.push({ kind: "log", text: `${act.note} — +${act.vnd.toLocaleString("vi-VN")}₫` });
        break;
      }
      case "OVERHEARD_BY":
        this.overheardBy(c, act);
        break;
      case "DISCOUNT":
        pledge.discount += act.vnd;
        break;
      case "FREE_LOAF":
        pledge.free = true;
        break;
      case "PROMISE":
        if (!pledge.promised.includes(act.item)) pledge.promised.push(act.item);
        break;
      case "STEP_ASIDE":
        this.askStepAside(c, act.forSec);
        break;
      case "WALK_ON":
        this.walkOn(c);
        break;
      case "GIVE_BREAD":
        this.giveBread(c, act.forSec);
        break;
      case "OFFER_TEA":
        this.offerTeaTo(c);
        break;
      case "STAND_IN_SHADE":
        this.standInShade(c, act.forSec);
        break;
      case "THEY_SIT":
        this.theySit(c, act.forSec);
        break;
      case "FILM":
        this.startFilm(c, act.forSec);
        break;
      case "STOP_FILM":
        this.stopFilm(c);
        break;
      case "CARRY_GANH":
        this.carryGanh(c, true);
        break;
      case "MOVE_GANH":
        this.carryGanh(c, false);
        break;
      case "LEAVE_SHADE":
        this.leaveShade(c);
        break;
      case "LOOK_INSIDE":
        c.lookInsideUntil = c.now + (forSecOf(act.forSec) ?? 6);
        break;
      case "PROMISE_DEED":
        this.promiseDeed(c, act.deed);
        break;
      case "REFUSE":
        // Người đi ngang thì chỉ đi tiếp.
        if (c.ambient) { c.inviteRefused = true; if (c.pass) c.pass.until = c.now; break; }
        this.out.push({ kind: "log", text: `${this.label(c)} bị mời đi.` });
        this.leave(c, "refused");
        break;
      case "INVITE":
        this.invite(c, act, tone);
        break;
      case "BARTER":
        this.barter(c, act.nhan);
        break;
      case "MOVE_CART":
        this.moveCart(c, act.toi);
        break;
      case "RAO":
        this.rao(act.forSec);
        break;
      case "ORDER_CHANGE":
        this.orderChange(c, act);
        break;
      default:
        return assertActHandled(act);
    }
  }

  /** Dòng số `invite:<id lượt>` nên mỗi người chỉ có một câu trả lời. */
  private invite(c: Customer, act: Extract<TalkAct, { kind: "INVITE" }>, tone: TalkTone) {
    if (!c.ambient || !c.pass) {
      // Tới được đây là nội dung gắn sai — kêu lên chứ đừng nuốt.
      this.deps.bus.emit("dialog:silent", { npcId: c.memKey, reason: "INVITE_SAI_NGUOI" });
      return;
    }
    const unlimited = !!this.deps.noTimePressure;
    const ahead = this.customers.filter((x) => x.phase !== "leaving" && !x.pass && !x.balking).length;
    const p = inviteChance({
      person: c.personality,
      glanced: c.pass.stay > 0,
      tone,
      ahead,
      slots: Math.min(SLOTS.length, peakCap(this.deps.day, unlimited)),
      soldOut: this.soldOut,
    });
    // `inviteMul` chỉ hãm, không đẩy lên — `INVITE_MAX` vẫn là trần.
    const yes = this.deps.hub.derive(`invite:${c.id}`).next() < p * (c.purpose?.inviteMul ?? 1);
    const mood: TalkMood = yes ? "CUOI" : "CUOI_KHAN";
    this.actReply = { text: yes ? act.yes : act.no, mood };
    this.scheduleReact(c, MOOD_FACE[mood], MOOD_POSE[mood]);
    if (!yes) {
      c.inviteRefused = true;
      if (c.pass) c.pass.until = c.now;
      this.out.push({ kind: "log", text: `${this.label(c)} đi tiếp.` });
      return;
    }
    this.acceptInvite(c);
  }

  /** ⚠️ Hạ nguồn không được biết người này từng đi ngang. */
  private acceptInvite(c: Customer) {
    // ⚠️ `talkKey` đổi theo `c.ambient`, nên chuyển kho `QUA_DUONG` → `WALKIN` ngay tại đây.
    this.talks.ensure("WALKIN");
    this.talks.release("QUA_DUONG");
    c.ambient = false;
    c.pass = null;
    c.phase = "arriving";
    c.rollOrder();
    c.dayMood = rollMood(this.deps.hub.derive(`invite-mood:${c.id}`), this.deps.day);
    c.gazeMul = this.deps.gazeMul ?? 1;
    const m = this.mem(c.memKey);
    m.visits++;
    m.lastSeenDay = this.deps.day;
    this.assignSlots();
    this.out.push({ kind: "log", text: `${this.label(c)} ghé vào thật.` });
    this.deps.bus.emit("npc:arrived", {
      npcId: c.memKey, visitId: c.id, slot: "SEATED_FAR", atHhmm: fmtHhmm(this.nowMin),
    });
  }

  /** Khách đang mua thì đi tiếp nghĩa là bỏ đi, nên qua `leave()`. */
  private walkOn(c: Customer) {
    if (c.ambient && c.pass) {
      c.inShade = false;
      c.sitting = false;
      c.pass.until = c.now;
      c.pass.spot = c.pass.exit;
      this.out.push({ kind: "log", text: `${this.label(c)} đi tiếp.` });
    } else if (c.phase !== "leaving") {
      this.leave(c, "refused");
    }
    if (this.talkWith === c) this.endTalk();
  }

  /** Ổ rời tay thật, không thì là thiện cảm không tốn gì. */
  private giveBread(c: Customer, forSec: ForSec) {
    if (!this.playerHand.startsWith("loaf")) return;
    /*
     * ⚠️ MỘT Ổ, MỘT LẦN: `StallScene` gán `playerHand` mỗi frame, nên chỉ hỏi "tay có cầm ổ
     * nào không" thì một phiên thoại cho ăn được hai lần bằng một ổ.
     *
     * `visit.gaveFood` là mốc đúng: nó cũng chính là cổng `!v.gaveFood` mà nội dung dùng,
     * nên hai chỗ không thể lệch nhau.
     */
    if (c.eating || c.visit.gaveFood) return;
    this.out.push({ kind: "takeHand", npcId: c.memKey, name: this.label(c) });
    c.eating = true;
    c.eatUntil = c.now + (forSecOf(forSec) ?? 25);
    c.visit.gaveFood = true;
    this.keepDeed(c, "DUA_BANH");
    this.out.push({ kind: "log", text: `${this.label(c)} cầm lấy ổ bánh.` });
  }

  /** Nối vào `serveTea()` đã có. Người được mời có thể là ai đang nói chuyện, và `v.gaveTea` chặn mời lại lần hai. */
  private offerTeaTo(c: Customer) {
    if (c.visit.gaveTea) return;
    const before = this.front;
    const r = before === c ? this.serveTea() : { ok: false, reason: "chưa tới chỗ rót" };
    if (r.ok) {
      c.visit.gaveTea = true;
      return;
    }
    // Chưa có bình thì ĐỪNG HỨA: một lời hứa không có đường thực hiện là một món nợ cài sẵn.
    // (Thực tế nhánh này không tới được — `p.hasTea` đã gác — nhưng act còn chạy được từ kịch bản.)
    if (!has(this.deps.equip, "BINH_TRA")) return;
    // Không rót được ngay thì câu nói thành một lời hứa có hạn, không phải nuốt lời.
    this.promiseDeed(c, { what: "ROT_TRA", dueSec: DEED_DUE.ROT_TRA });
  }

  /** Rồi đi tiếp đúng mục đích cũ, nên `shadeUntil` là bắt buộc. Một chỗ một người. */
  private standInShade(c: Customer, forSec: ForSec) {
    if (!this.shadeFree) return;
    c.inShade = true;
    c.shadeUntil = c.now + (forSecOf(forSec) ?? 25);
    if (c.pass) {
      c.pass.spot = { x: SHADE_SPOT.x, y: SHADE_SPOT.y };
      c.pass.until = c.now + (forSecOf(forSec) ?? 25);
    }
    this.out.push({ kind: "log", text: `${this.label(c)} bước vào chỗ mát đứng.` });
  }

  /** Ngồi làm kiên nhẫn trôi chậm, nên cái ghế 320 nghìn có một con số đo được. Hết chỗ thì IM, không phải lời hứa suông. */
  private theySit(c: Customer, forSec: ForSec) {
    if (!this.seatFree || c.sitting) return;
    const sec = forSecOf(forSec) ?? 40;
    c.sitting = true;
    c.sitUntil = c.now + sec;
    if (c.inShade) this.leaveShade(c);
    if (c.pass) {
      c.pass.spot = { x: SEAT_SPOT.x, y: SEAT_SPOT.y };
      c.pass.until = c.now + sec;
    }
    this.out.push({ kind: "log", text: `${this.label(c)} ngồi xuống ghế.` });
  }

  /** Clip phụ thuộc vào mình làm gì trong lúc máy đang chạy — `filmSpoiled` chấm liên tục, không chỉ lúc bắt đầu. */
  private startFilm(c: Customer, forSec: ForSec) {
    if (c.filming) return;
    c.filming = true;
    c.filmUntil = c.now + (forSecOf(forSec) ?? 20);
    c.filmSpoiled = this.filmDirtyNow();
    this.out.push({ kind: "log", text: `${this.label(c)} giơ điện thoại lên quay.` });
  }

  private filmDirtyNow() {
    return this.dirt >= DIRT_ON_CAMERA || this.handsDirty;
  }

  private tickFilm(c: Customer) {
    if (this.filmDirtyNow()) c.filmSpoiled = true;
    if (c.now < c.filmUntil) return;
    this.endFilm(c, true);
  }

  private stopFilm(c: Customer) {
    if (!c.filming) return;
    this.endFilm(c, false);
    this.out.push({ kind: "log", text: `${this.label(c)} cất máy.` });
  }

  private endFilm(c: Customer, quayXong: boolean) {
    const hong = c.filmSpoiled;
    c.filming = false;
    c.filmUntil = 0;
    c.filmSpoiled = false;
    if (!quayXong) return;
    if (hong) {
      this.out.push({ kind: "log", text: `đoạn quay dính cảnh quầy chưa dọn.` });
      return;
    }
    this.out.push({ kind: "log", text: `${this.label(c)} quay xong một đoạn ưng ý.` });
  }

  /** `minhBung` phân biệt hai việc: mình bưng giùm (lối thông, và là một việc mình làm) với bảo bà tự dời. */
  private carryGanh(c: Customer, minhBung: boolean) {
    if (this.ganh !== "NGOAI") return;
    this.ganh = "TRONG";
    void GANH_IN; void GANH_OUT;
    this.out.push({
      kind: "log",
      text: minhBung ? `mình bưng gánh vào trong giúp ${this.label(c)}.` : `${this.label(c)} dời gánh vào sát vách.`,
    });
  }

  /** Ổ RỜI KHO thật và cầm về một món — không tiền, mà cũng không phải cho không. */
  private barter(c: Customer, nhan: string) {
    if (this.soldOut || c.visit.gaveFood) return;
    this.stock = Math.max(0, this.stock - 1);
    c.visit.gaveFood = true;
    this.out.push({ kind: "log", text: `đổi một ổ lấy ${nhan} của ${this.label(c)}.` });
  }

  /** `XA` dọn sạch mặt tiền (mà mình vừa đuổi một người đi) · `CHUNG` chung một mái lúc mưa (mình mất một khúc). */
  private moveCart(c: Customer, toi: "XA" | "CHUNG") {
    if (this.cart === null || this.cart === toi) return;
    this.cart = toi;
    void CART_LAN; void CART_XA; void CART_CHUNG;
    this.out.push({
      kind: "log",
      text: toi === "XA" ? `${this.label(c)} đẩy xe về chỗ cũ.` : `hai cái xe đứng chung một mái.`,
    });
  }

  /**
   * CẤT TIẾNG RAO — người đang đi ngang ngoái lại.
   *
   * Tác động lên người ĐÃ Ở TRÊN ĐƯỜNG, không phải lên lượt spawn sau: một tiếng rao là
   * một tiếng rao, nó tới tai những người đang đi qua ngay lúc đó. Người nào đã dừng ngó
   * rồi thì thôi — rao thêm không làm họ ngó thêm lần nữa.
   *
   * Dòng số riêng `rao:` theo NGÀY + id người, không rút ké dòng `passer` (P0-02 §2.3):
   * rút ké là rút CÓ ĐIỀU KIỆN từ dòng dùng chung, và mọi golden của người đi ngang lệch
   * theo mỗi lần người chơi mở miệng.
   */
  private rao(forSec: ForSec) {
    const sec = forSecOf(forSec) ?? RAO_SEC;
    this.raoUntil = this.nowSec + sec;
    let ngoai = 0;
    for (const c of this.customers) {
      if (!c.ambient || !c.pass) continue;
      /*
       * "Đi thẳng" = `stay === 0`, KHÔNG phải `spot === null`.
       *
       * `spot` luôn có giá trị — lúc spawn nó mặc định là chính lối ra (`plan.spot ?? plan.to`),
       * nên lấy nó làm dấu "chưa dừng ngó" thì không ai lọt qua. Đúng cặp cờ là cặp mà
       * `snapshot.glanced` dùng: `stay > 0 && until >= 0`.
       */
      if (c.pass.stay > 0 || c.pass.until >= 0) continue;
      if (this.deps.hub.derive(`rao:${this.deps.day}:${c.id}`).next() >= RAO_TURN) continue;
      c.pass.stay = Math.max(c.pass.stay, 1.6);
      c.pass.spot = { x: c.x, y: c.y };
      c.pass.until = c.now + c.pass.stay;
      ngoai++;
    }
    this.out.push({
      kind: "log",
      text: ngoai ? `rao một câu — ${ngoai} người ngoái lại.` : `rao một câu, chưa ai ngoái.`,
    });
  }

  /** Người bị nói xấu NGHE THẤY — có dòng nhật ký và nét mặt, để nói xấu sau lưng không miễn phí (T5). */
  private overheardBy(noi: Customer, act: Extract<TalkAct, { kind: "OVERHEARD_BY" }>) {
    const ho = this.customers.find((x) => x.memKey === act.ai && x.phase !== "leaving");
    if (!ho) return;                               // không có mặt thì không ai nghe — nước đi hợp lệ
    if (Math.hypot(ho.x - noi.x, ho.y - noi.y) > OVERHEAR_REACH) return;
    this.out.push({ kind: "log", text: `${this.label(ho)} đứng ngay đó. ${this.label(ho)} nghe hết.` });
    this.scheduleReact(ho, MOOD_FACE.BUC, MOOD_POSE.BUC);
  }

  /** ĐỔI CÁI ĐƠN thật (giá ăn theo); người đang vội gần như không chịu. Dòng số riêng `doidon:` rút MỘT lần. */
  private orderChange(c: Customer, act: Extract<TalkAct, { kind: "ORDER_CHANGE" }>) {
    if (!c.order || c.phase === "leaving") return;
    const hurry = c.purpose?.hurry ?? 0.3;
    const p = Math.max(0.1, ORDER_CHANGE_BASE - hurry * 0.55 + 0.2 * c.personality.thanThien);
    /** Họ tự xin thì không roll — không ai xin đổi món rồi tự từ chối mình. */
    const yes = act.aiXin === "HO" || this.deps.hub.derive(`doidon:${c.id}`).next() < p;
    const mood: TalkMood = yes ? "CUOI" : "THUONG";
    this.actReply = { text: yes ? act.ok : act.no, mood };
    this.scheduleReact(c, MOOD_FACE[mood], MOOD_POSE[mood]);
    if (!yes) { this.out.push({ kind: "log", text: `${this.label(c)} giữ đơn cũ.` }); return; }

    const it = c.order.intent;
    for (const toi of Array.isArray(act.toi) ? act.toi : [act.toi]) {
      // "Làm đầy đủ" = đổi hẳn sang MÓN đầy đủ trên bảng, không bật cờ nằm cạnh danh sách nhân.
      if (toi === "dayDu") it.mon = "daydu";
      else if (toi === "itRau") it.rau = "it";
      else if (toi === "themNhan" && !it.nhieu) it.nhieu = nhanOf(it.mon)[0] ?? "pate";
      else if (toi === "khongOt") { it.ot = 0; it.tuong = 0; }
    }
    c.order.levels = levelsOf(it);
    c.order.phrase = undefined;                        // câu gọi cũ không còn tả đúng ổ nữa
    this.out.push({
      kind: "log",
      text: `${this.label(c)} đổi đơn — giờ tính ${dongVi(this.priceOf(it))}.`,
    });
  }

  private standUp(c: Customer) {
    if (!c.sitting) return;
    c.sitting = false;
    c.sitUntil = 0;
    if (c.pass) { c.pass.spot = c.pass.exit; c.pass.until = c.now; }
    else this.assignSlots();
  }

  private leaveShade(c: Customer) {
    if (!c.inShade) return;
    c.inShade = false;
    c.shadeUntil = 0;
    if (c.pass) { c.pass.spot = c.pass.exit; c.pass.until = c.now; }
  }

  /** Treo món nợ kèm hạn giây THẬT, và KHÔNG trả một đồng thưởng nào — trả lúc hứa thì tối ưu là hứa rồi quên. */
  private promiseDeed(c: Customer, deed: Deed) {
    if (c.visit.promised.includes(deed.what)) return;
    c.visit.promised.push(deed.what);
    this.deeds.push({ c, deed, dueAt: c.now + deed.dueSec, nudged: 0 });
    this.out.push({ kind: "log", text: `mình vừa hứa với ${this.label(c)} — ${DEED_LABEL[deed.what] ?? deed.what}.` });
  }

  /** Giữ lời: thưởng trả Ở ĐÂY, không trả lúc nói. */
  private keepDeed(c: Customer, what: string) {
    const i = this.deeds.findIndex((d) => d.c === c && d.deed.what === what);
    if (i < 0) return;
    const [d] = this.deeds.splice(i, 1);
    c.visit.promised = c.visit.promised.filter((x) => x !== what);
    if (d.deed.onKept) this.applyTalkOption(c, d.deed.onKept);
  }

  /** Người ta NGHE hay KHÔNG là chuyện của họ, không phải một cái nút. */
  private askStepAside(c: Customer, forSec: ForSec = "TOI_LUOT") {
    this.asideFor.set(c.id, forSec);
    const willing = c.npc ? 0.55 * (1.25 - c.personality.nongTinh) : 0.45;
    if (this.deps.hub.derive(`aside:${this.deps.day}:${c.id}`).next() < willing) {
      this.stepAside(c);
      this.reactTalk(c, "CARED", 1, "STEP_BACK_HALF");
      return;
    }
    this.reactTalk(c, "NAME", 2, "ARMS_CROSS");
    c.waitSec += angerToWaitSec(25 * intensityMul(c.personality), c.waitT, c.waitSec, LEAVE_AT);
    this.out.push({ kind: "log", text: `${this.label(c)} không nhúc nhích.` });
  }

  /** Hai việc, phải đủ cả hai: THỨ TỰ (tụt sau đúng MỘT người) và CHỖ ĐỨNG (`aside` kéo họ khỏi vòng cấp chỗ). */
  private stepAside(c: Customer) {
    const i = this.customers.indexOf(c);
    if (i < 0 || c.aside) return;
    const next = this.customers.find((x, k) => k > i && this.inQueue(x) && !x.aside) ?? null;
    if (next) {
      this.customers.splice(i, 1);
      this.customers.splice(this.customers.indexOf(next) + 1, 0, c);
    }
    c.aside = true;
    c.asideFor = next?.id ?? null;
    c.asideAt = c.now;
    c.slot = -1;
    c.occluder = 1;
    if (c.zone !== "FRONT_SIDE") {
      const from = c.zone;
      c.zone = "FRONT_SIDE";
      this.deps.bus.emit("npc:slotChanged", { npcId: c.memKey, from: from as CustomerSlot, to: c.zone as CustomerSlot });
    }
    this.assignSlots();
    this.out.push({
      kind: "log",
      text: next
        ? `${this.label(c)} bước ra khỏi hàng, nhường ${this.label(next)}.`
        : `${this.label(c)} bước ra khỏi hàng, đứng nép qua một bên.`,
    });
  }

  private inQueue(c: Customer) {
    return c.phase !== "leaving" && !c.pass && !c.balking;
  }

  /** Tới khi người mình nhường XONG VIỆC; không có ai để nhường thì nép một quãng ngắn rồi vô lại. */
  private asideDone(c: Customer) {
    const forSec = this.asideFor.get(c.id);
    const sec = forSec === undefined ? null : forSecOf(forSec);
    if (sec !== null) return c.now - c.asideAt >= sec;
    if (!c.asideFor) return c.now - c.asideAt >= ASIDE_HOLD_SEC;
    return !this.customers.some((x) => x.id === c.asideFor && this.inQueue(x));
  }

  private rejoinQueue(c: Customer) {
    c.aside = false;
    c.asideFor = null;
    /** `arriving` chứ không `queueing`: nhánh `queueing` thấy `slot === 0` là gọi món NGAY, kể cả lúc còn đứng ngoài lề. */
    if (c.phase === "queueing") c.phase = "arriving";
    this.assignSlots();
    this.out.push({ kind: "log", text: `${this.label(c)} bước trở vào hàng.` });
  }

  /** "Bớt cô ba ngàn" ra khỏi doanh thu thật, nên nó là một quyết định kinh tế chứ không phải câu xã giao. */
  private pricedAfterPledge(c: Customer, price: number): number {
    const pledge = this.pledges.get(c.id);
    if (!pledge) return price;
    if (pledge.free) {
      this.out.push({ kind: "log", text: `${this.label(c)} — ổ này mình nói không lấy tiền.` });
      return 0;
    }
    if (pledge.discount > 0) {
      const cut = Math.min(pledge.discount, price);
      this.out.push({ kind: "log", text: `bớt ${cut.toLocaleString("vi-VN")}₫ cho ${this.label(c)}.` });
      return price - cut;
    }
    return price;
  }

  /** Ba kết cục: giữ lời · bỏ thứ KHÁC · không bỏ gì. */
  private settlePledge(c: Customer, dish: Ingredient[]): number {
    const pledge = this.pledges.get(c.id);
    if (!pledge?.promised.length) return 0;
    let score = 0;
    for (const item of pledge.promised) {
      const label = labelOf(item as Ingredient);
      if (dish.includes(item as Ingredient)) {
        score += PROMISE_KEPT;
        this.say(c, this.barks.take("promiseKept", c.memKey, { mon: label }), 2, true, 70);
        continue;
      }
      const swapped = dish.some((x) => !c.order!.levels[x] && NHAN_IDS.has(x));
      score -= swapped ? PROMISE_SWAPPED : PROMISE_BROKEN;
      this.say(c, this.barks.take(swapped ? "promiseWrong" : "promiseBroken", c.memKey, { mon: label }), 2, true, 95);
      this.reactTalk(c, "NAME", swapped ? 2 : 3);
    }
    pledge.promised = [];
    return score;
  }

  /** Ba kênh, thứ tự THẤY → HIỂU → NGHE. */
  private applyTalkOption(c: Customer, o: TalkEffect & { mood?: TalkMood; act?: TalkAct; tone?: TalkTone }) {
    if (o.flag && this.deps.flags) this.deps.flags[o.flag] = this.deps.day;

    const anger = (o.anger ?? 0) * intensityMul(c.personality);
    if (anger > 0) {
      c.waitSec += angerToWaitSec(anger, c.waitT, c.waitSec, LEAVE_AT);
      this.talkAngered = true;
    }
    if (o.calm) c.soothe(o.calm / intensityMul(c.personality));
    /** Người viết khai `mood` thì `mood` THẮNG. */
    const mood = o.mood;
    if (mood) {
      this.scheduleReact(c, MOOD_FACE[mood], MOOD_POSE[mood]);
    } else if (anger > 0) {
      this.reactTalk(c, "NAME", anger >= 45 ? 3 : 2);
    } else if (o.calm) {
      this.reactTalk(c, "CARED", 1);
    }
    if ("act" in o && o.act) this.applyAct(c, o.act as TalkAct, o.tone ?? "THUONG");

    /** Ngưỡng tính SAU `intensityMul` nên tính cách quyết ai nổ trước. */
    if (anger >= STORM_OFF_ANGER && c.phase !== "leaving") {
      if (c.ambient) { c.inviteRefused = true; if (c.pass) c.pass.until = c.now; }
      else {
        this.out.push({ kind: "log", text: `${this.label(c)} bỏ đi — bị nói nặng quá.` });
        this.leave(c, "insulted");
      }
    }
  }

  /** Bộ lọc là `source` (81/86 cuộc `NPC_ONLY`); `initiates` chỉ còn là xác suất. Cuộc SÂU vẫn phải qua `canRun()`. */
  private offerTalk(c: Customer): boolean {
    if (this.talkSession) return false;
    // Trả `false` mà KHÔNG tiêu lượt bắt chuyện của họ — `smalltalk()` thử lại frame sau.
    if (!this.interruptible) return false;
    if (this.offers.length >= OFFER_QUEUE_MAX || this.offerFor(c)) return false;
    if (this.offersToday >= TALK_OFFERS_PER_DAY) return false;
    if (this.nowSec - this.lastOfferAt < TALK_OFFER_GAP_SEC) return false;
    const key = this.talkKey(c);
    if (!this.talks.has(key)) return false;
    const talk = this.pickRunnable(c, "NPC");
    if (!talk) return false;
    if (this.deps.hub.derive(`talk:${this.deps.day}:${c.id}`).next() >= (talk.initiates ?? TALK_INITIATE_BASE)) return false;
    this.offersToday++;
    this.lastOfferAt = this.nowSec;
    this.offers.push({ c, talk, at: this.nowSec });
    this.say(c, this.fill(c, talk.opener), 2, true, 70, undefined, 0, true);
    this.out.push({ kind: "talkOffer", npcId: c.memKey, name: this.label(c) });
    return true;
  }

  /** Người chơi hai tay đang bận thì họ KHÔNG NGHE THẤY, không phải "làm thinh". */
  /**
   * ĐANG NÓI DỞ MÀ MÌNH BỎ ĐI THÌ CUỘC TẮT — `openTalk()` chỉ kiểm khoảng cách lúc MỞ.
   *
   * Nới hơn `TALK_REACH` một thân người: đứng nói chuyện thì người ta xê dịch vài bước là
   * thường, cắt đúng ngưỡng mở sẽ làm cuộc rụng oan giữa chừng.
   */
  private walkedAwayMidTalk() {
    const c = this.talkWith, p = this.playerAt;
    if (!c || !p) return;
    if (Math.hypot(c.x - p.x, c.y - p.y) <= TALK_REACH + 1.5) return;
    this.out.push({ kind: "log", text: `mình bỏ đi giữa chừng — ${this.label(c)} thôi nói.` });
    /** Người đi ngang thì đi tiếp luôn: họ không đứng đó chờ mình quay lại. */
    if (c.pass) { c.pass.spot = c.pass.exit; c.pass.until = c.now; }
    this.endTalk();
  }

  private expireOffers() {
    for (let i = this.offers.length - 1; i >= 0; i--) {
      const o = this.offers[i];
      if (this.nowSec - o.at >= OFFER_DEFER_TTL_SEC || !this.talkable(o.c)) this.offers.splice(i, 1);
    }
  }

  /** ⚠️ Trả `customer.id` (một LƯỢT GHÉ) chứ không `memKey`: hai người cùng dáng cùng đeo dấu dù chỉ một người mở lời. */
  get pendingTalkers(): readonly string[] {
    return this.offers.map((o) => o.c.id);
  }

  devTest(concept: string, extra: Extra) {
    const c = this.front ?? this.customers[0];
    if (!c) return null;
    const q = this.buildQuery(c, extra);
    this.speaker.ctx.write(q, c.memKey, this.nowSec);
    return { npc: c.memKey, facts: q.dump(), ranking: this.speaker.db.explain(concept, q, this.speaker.st, this.nowSec) };
  }

  /** Giá theo thực đơn (không bao giờ trừ tiền bánh). Thiếu lẻ thì làm tròn xuống hoặc chạy qua cô Mai. */
  private settlePayment(c: Customer, price: number) {
    const r = this.deps.hub.derive(`cash:${c.id}`);
    const qr = has(this.deps.equip, "BANG_QR");
    let amount = price;
    const scanned = qr && r.next() < 0.5;
    if (this.deps.till && !scanned) {
      const ch = makeChange(amount, this.deps.till, r.next());
      if (!ch.ok) {
        if (ch.roundedDown) {
          amount -= ch.roundedDown;
          this.out.push({ kind: "log", text: `hết tiền lẻ — bớt cho khách ${ch.roundedDown.toLocaleString("vi-VN")}₫` });
        } else {
          this.out.push({ kind: "log", text: "hết tiền lẻ — chạy qua cô Mai đổi" });
        }
      }
    }
    this.out.push({ kind: "paid", amount, item: "dish" });
  }

  label(c: Customer) {
    return c.name;
  }

  /** Rửa tay NGAY TRƯỚC MẶT khách: đi qua đúng công thức nhận thấy, không có đường tắt. */
  washedVisibly() {
    for (const c of this.audience) if (c.gaze >= 0.45) c.washRelief = c.now + 120;
  }

  get liveStims(): readonly ActiveStim[] {
    return this.active.filter((s) => s.until > this.nowSec);
  }

  drain() {
    return this.out.splice(0, this.out.length);
  }

  /** ⚠️ Chỉ rút dòng NHẬT KÝ: rút luôn sự kiện tiền ở đây thì một lần bấm F ăn mất một lần thu tiền. */
  drainLogs(): string[] {
    const out: string[] = [];
    for (let i = this.out.length - 1; i >= 0; i--) {
      const e = this.out[i];
      if (e.kind !== "log") continue;
      out.unshift(e.text);
      this.out.splice(i, 1);
    }
    return out;
  }
}

function kindOf(d: DiffedDefect): string {
  if (d.kind === "WRONG_RATIO") return d.dir === "under" ? "RATIO_UNDER" : "RATIO_OVER";
  return d.kind;
}

/** Xem khối `UNDERDONE_FLOOR` ở đầu file. `mkDefect` lo phần điểm; ở đây chỉ thay hai chuỗi CHỮ. */
function underdoneDefect(crust: number): Defect {
  const short = clamp01((CRUST.READY - crust) / CRUST.READY);
  const mag = UNDERDONE_FLOOR + (UNDERDONE_CEIL - UNDERDONE_FLOOR) * short;
  return { ...mkDefect("WRONG_TEMP", null, mag), label: UNDERDONE_LABEL, text: UNDERDONE_TEXT };
}

/** Nặng dần từ lúc chớm sém tới sát ngưỡng cháy của CHÍNH cái lò đang dùng — xem `SINGED_FLOOR`. */
function singedDefect(crust: number, burnAt: number, singeAt: number = CRUST.SINGED): Defect {
  const span = Math.max(0.01, burnAt - singeAt);
  const over = clamp01((crust - singeAt) / span);
  const mag = SINGED_FLOOR + (SINGED_CEIL - SINGED_FLOOR) * over;
  return { ...mkDefect("WRONG_TEMP", null, mag), label: SINGED_LABEL, text: SINGED_TEXT };
}

/** Lỗi của VỎ BÁNH (non hoặc sém), tách khỏi `WRONG_TEMP` nghĩa gốc là ổ nguội. */
const isCrustDefect = (d: Defect) => d.kind === "WRONG_TEMP" && (d.label === UNDERDONE_LABEL || d.label === SINGED_LABEL);

/** Vế bổ sung nói bằng mấy chữ nào: "chưa giòn" / "cháy cạnh". */
const crustTailWord = (d: Defect) => (d.label === SINGED_LABEL ? "cháy cạnh" : "chưa giòn");

/** "đồ chua", "đồ chua với ớt", "đồ chua, ớt với tương ớt" — cách kể món của người mình. */
function monVi(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} với ${names[names.length - 1]}`;
}

// ───────────────────────────────────────────────────────────────────── đi lại

function isLeaving(c: Customer) {
  return c.phase === "leaving";
}

function near(c: { x: number; y: number }, p: { x: number; y: number }, r: number) {
  return Math.hypot(p.x - c.x, p.y - c.y) < r;
}

/** `mul` là nhịp chân riêng của một người (người qua đường mỗi người một tốc độ); mặc định 1. */
function walk(c: Customer, to: { x: number; y: number }, dt: number, mul = 1) {
  const dx = to.x - c.x, dy = to.y - c.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.05) return;
  const step = Math.min(d, WALK_SPEED * mul * dt);
  const nx = c.x + (dx / d) * step;
  const ny = c.y + (dy / d) * step;
  if (!hitsWall(nx, c.y, 0.22)) c.x = nx;
  if (!hitsWall(c.x, ny, 0.22)) c.y = ny;
}

