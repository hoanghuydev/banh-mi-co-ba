import { Rng, type RngHub, type BagState } from "../core/rng";
import { Barks } from "../content/lines";
import { Query } from "../dialog/facts";
import { Speaker, type DialogState } from "../dialog/speaker";
import type { Rule } from "../dialog/ruledb";
import { NPCS, WALKIN_NAMES, WALKIN_STYLES, type NpcDef, type Personality } from "../content/npcs";
import { DAY_END_MIN, DAY_START_MIN, PEAK_END_MIN, PEAK_START_MIN, bandOf, fmtHhmm, gioVi } from "../core/clock";
import type { Bus } from "../core/eventbus";
import type { CustomerSlot, LeaveReason as BusLeaveReason, RelTier, StimId } from "../core/types";
import { newNpcState, type NpcState } from "../core/save";
import { orderDefectKey } from "../core/stimid";
import { Customer, DEFAULT_PATIENCE_SEC, LEAVE_AT, PATIENCE_BONUS_SEC, TEA, teaSuspectAtCup, type LeaveReason } from "./customer";
import {
  INGREDIENTS, diffDish, extraPortions, generosityOf, labelOf, levelsOf, makeUsual, mkDefect, portionsOf,
  sameOrder, sayOrder,
  type Defect, type Ingredient, type OrderSpec,
} from "./order";
import {
  MAX_LIVE_STIMULI, SALIENCE, STIM_SPEC, observe, peakOf, peakOfKey, rank, stateOf,
  type ActiveStim, type ObsState, type Occluder, type Zone,
} from "./perception";
import { ASIDE_SPOT, CART_CHUNG, CART_LAN, CART_XA, CUSTOMER_GATE, GANH_IN, GANH_OUT, QUEUE_SLOTS, SEAT_CAPACITY, SEAT_SPOT, SHADE_CAPACITY, SHADE_SPOT, STREET_BIN, hitsWall } from "../world/map";
import { PASSERS_MAX, PASSER_NAMES, inviteChance, nextGapSec, planPasser } from "./passersby";
import { rollVisit } from "./schedule";
import { SILENT_ABSENCE, extraHabit, record, servedWell, visitProbabilityMul, type BaseKind, type Memory } from "./memory";
import { SHARED_POOL, TalkStore } from "../content/talks";
import { allHold, firstBroken, holds, type WorldSnapshot } from "./worldfacts";
import { bandOfMinutes, type DriveId, type PracticeId } from "../content/vocab";
import { retrieve, worthMentioning, type Recalled } from "./recall";
import { describe as describePurpose, purposeHurry, purposeInviteMul, rollPurpose } from "./purpose";
import { baseDrives, bump, decayDrives, drivesNow, scoreSatisfies } from "./drives";
import { profileOf } from "./profile";
import {
  ADDRESS, DEFAULT_IGNORE_REL, TalkSession, WALKIN_ADDRESS, angerToWaitSec, applyTalk,
  actsUnder, eligible, pickTalk, visibleOptions, isSharedTalk, MOOD_FACE, MOOD_POSE,
  // `kindOf` của `talk.ts` đụng tên với `kindOf` lỗi món đã có sẵn trong file này.
  kindOf as talkKindOf, countsAgainstDailyCap, forSecOf, satisfiesOf,
  type TalkOpenBy, type Deed, type ForSec,
  type Talk, type TalkAct, type TalkCtx, type TalkEffect, type TalkGate, type TalkMood, type TalkTone,
} from "./talk";
import { CLAIM, activeHeard, disprove, nameOf, poolOf, witness, type GossipState } from "./gossip";
import { beginDay, displayName, logNote, logOrder, nameCheck, type Notebook } from "./notebook";
import { CAL, crowdMul, dongVi, isRain, loafPriceVnd, tasteThreshold, tierOf, weatherOf } from "./econ";
import { peakCap } from "./season";
import { has, walkInMul as equipWalkIn, type EquipId, type EquipState } from "./equipment";
import {
  SHORT_OF_CASH_RATE, makeChange, openDebtOf, recalledAmount, viaOf, viaRoundUp, viaWalkInMul,
  type DebtRecord, type OpeningFacts, type ViaMood,
} from "./till";
import { moodBaseFace, moodPatienceMul, moodTipMul, rollMood } from "./mood";
import { faceHoldSec, intensityMul, isSilentGrudge, reactionDelay } from "./personality";
import { GROUP_OF, faceFor, poseFor, type Group, type Intensity, type PoseId } from "./reaction";
import { CRUST, bandOfCrust } from "./oven";
import { satisfaction, servedVector, tasteOf } from "./taste";
import { arcToday, extraVisits, usualOf as authoredUsual, type ArcCtx, type Line } from "../content/arcs";
import { arcCtx, moment, onPass, onServed, onTea, onUnserved, storyCrowdMul, timeline, walkinLine, type StoryState } from "./story";
import TAM from "../content/lines/tam.json";

/** Mấy cảnh hai người đi ngang đứng lại tám — xem `chatScene()`. */
const TAM_CANH: readonly (readonly string[])[] = TAM.canh;
import type { VisitPlan } from "./customer";

/**
 * Điều phối bán hàng. Scene gọi `perceive()` → `tickNpcs()` → `tickDialog()` mỗi frame.
 * Không import Phaser — chạy headless được.
 */

const SLOTS: readonly { x: number; y: number; zone: Zone }[] = QUEUE_SLOTS;
const GATE = CUSTOMER_GATE;
const WALK_SPEED = 1.7;

/**
 * Mỗi buổi CẢ HẺM có ngần này lượt người ta tự bắt chuyện với mình. Đây là cái giữ lời
 * hứa "phải HIẾM" — không phải trần `initiates` của từng cuộc (xem `L-9`).
 *
 * 3 → 4 sau khi đo: trước đợt này cái trần KHÔNG hề thắt (6,4% lượt thử thành lời mời ⇒
 * ~0,9 lượt/buổi), nên nâng nó là vặn vào không khí. Sau khi gỡ hai chỗ thắt thật —
 * `TALK_INITIATE_BASE` và `drives` của mấy cuộc hàng xóm — thì nó MỚI thành cái chặn
 * (357/598 lượt thử của bà Sáu chết ở đây). Lúc đó nâng mới có nghĩa.
 */
export const TALK_OFFERS_PER_DAY = 4;
const TALK_OFFER_GAP_SEC = 100;

/** Áp cho CẢ HAI đường (bấm phím lẫn khách tự mở lời). `BARK`/`SHORT` không tiêu vào trần này. */
const TALK_DEEP_PER_DAY = 2;

/**
 * Một cuộc ĐÃ qua hết mọi cổng rồi còn bị roll này ném đi bao nhiêu phần.
 *
 * 0,3 là hai lần thắt cổ chai cho cùng một việc: `TALK_OFFERS_PER_DAY` đã chặn số lượt
 * rồi, roll này chặn thêm lần nữa. Đo `tools/probe-offer2.ts` (8 buổi, 110 lượt thử):
 *
 *   không cuộc nào chạy được 44,5% · trượt roll 27,3% · chưa giãn đủ 100 giây 21,8%
 *   MỜI ĐƯỢC **6,4%** ⇒ ~0,9 lượt/buổi, trong khi trần là 3.
 *
 * Tức cái trần KHÔNG hề thắt — nâng nó lên là vặn vào không khí (đúng bài học `ATT_K`).
 * Chỗ thắt thật là roll này. 0,55 đưa lên ~1,5 lượt/buổi, vẫn nằm dưới trần, nên trần
 * vẫn là cái chặn cuối chứ không phải roll.
 */
const TALK_INITIATE_BASE = 0.55;

const PASSER_TALK_TAIL = 4;
/** `talkedThisVisit` chỉ chặn mở LẠI cùng một cuộc, không chặn mở cuộc khác — trần phải nằm riêng. */
const PASSER_TALKS_MAX = 2;

const DIRT_ON_CAMERA = 0.35;

/** Khác cái gánh bà Sáu: gánh chắn LỐI (đo được bằng `balkChance`), xe thì ăn bớt khách LẠ đi ngang. */
const KIET_STEAL = 0.18;

/**
 * TIẾNG RAO KÉO ĐƯỢC BAO NHIÊU PHẦN NGƯỜI ĐANG ĐI NGANG NGOÁI LẠI.
 *
 * Nước đi NGƯỢC với cái xe chú Kiệt: xe lấn ăn bớt người đi ngang (`KIET_STEAL`), tiếng
 * rao làm họ quay đầu. Ngoái lại ⇒ `t.glanced` ⇒ `inviteChance` +0,24 — tức nó không tự
 * biến ai thành khách, nó chỉ mở cửa cho câu mời. Người chơi vẫn phải mời.
 *
 * 0,45 — gần một nửa. Bà Sáu rao ba chục năm, và cả hẻm lấy tiếng bà làm đồng hồ.
 */
const RAO_TURN = 0.45;

/** Rao xong thì tiếng còn "trong không khí" bao lâu — người mới đi tới cũng nghe. */
const RAO_SEC = 12;

/**
 * MÌNH CÓ MẤY CÁI ÁO MƯA — act `LEND_ITEM`.
 *
 * HAI, vì chính lời thoại nói ra con số đó: *"Anh lấy cái áo mưa này của em đi anh. Em có
 * hai cái."* Một câu đã khai sẵn kho của nó thì đừng để code khai một con số khác.
 *
 * Và đó là cả cái giá: cho mượn được đúng hai lần, rồi hết — tới khi có người mang trả.
 */
const COATS_START = 2;

/**
 * CƠ HỘI NGƯỜI TA CHỊU ĐỔI ĐƠN, trước khi trừ đi phần vội.
 *
 * Không phải 1: chủ dự án hỏi đúng chỗ — *"bảo làm đầy đủ thì lâu lâu vẫn từ chối chứ
 * nhỉ"*. Mời một người ăn sang hơn là một lời mời, không phải một cái nút; người đang trễ
 * làm thì gần như chắc chắn lắc.
 */
const ORDER_CHANGE_BASE = 0.72;

/** Bốn ngày: đủ xa để người chơi quên mình đã làm gì, đủ gần để còn nối được nhân với quả. */
const CLIP_DUNG_SAU = 4;
/** ⚠️ Phải dài hơn `StallScene.REPLY_DELAY_SEC` — xem `talkVoice`. */
const TALK_VOICE_TAIL = 2.5;

/** Quá hạn thì HUỶ IM LẶNG, không phạt. */
const OFFER_DEFER_TTL_SEC = 90;
const OFFER_QUEUE_MAX = 2;

const GREET_CHANCE = 0.25;
const GREET_REACH = 1.0;
const GREET_SLOW = 0.75;
const GREET_SLOW_SEC = 1.6;
/**
 * CHÀO NHAU thì đi chậm lại; NÓI CHUYỆN thì phải ĐỨNG LẠI.
 *
 * Chủ dự án: *"2 npc nói chuyện với nhau ít nhất cũng phải đứng lại nói. đi ngang qua nói
 * thì sao đúng logic. thà chào nhau còn được."* Đúng — một câu chào ném qua vai thì được,
 * còn đứng kể một chuyện mà cả hai vẫn bước đều là hai cái đầu nói vào không khí.
 *
 * Nên tách hai việc: `GREET_SLOW` giữ nguyên cho câu chào, còn cảnh có TIN ĐỒN thì cả hai
 * dừng hẳn ngần này giây.
 */
const CHAT_STOP_SEC = 4.5;

/**
 * Nói xấu ai trong vòng bao nhiêu ô thì người đó NGHE THẤY — act `OVERHEARD_BY`.
 *
 * Rộng hơn `TALK_REACH` (3) một chút: một câu nói to giữa hẻm thì người đi ngang cách bốn
 * ô vẫn nghe được, và chính người chơi cũng nhìn thấy họ ở đó trước khi bấm.
 */
const OVERHEAR_REACH = 4.5;

/**
 * Bao lâu một lần hai người đi ngang ĐỨNG LẠI TÁM một cảnh — `content/lines/tam.json`.
 *
 * Phải HIẾM hơn chào nhau nhiều: cái hẻm sống là vì thỉnh thoảng có người dừng kể chuyện,
 * chứ không phải vì lúc nào cũng có hai người đứng giữa đường nói. 0,12 — chừng một cảnh
 * mỗi năm lần hai người dừng chào nhau — đo được chừng một cảnh một buổi (`tools/probe-tam.ts`).
 */
const CHAT_SCENE_CHANCE = 0.18;
/** Một cảnh bốn câu, mỗi câu cách nhau ngần này giây. */
const CHAT_LINE_GAP = 1.9;
const GREET_REPLY_SEC = 1.2;

/** Người GẦN NHẤT thắng, kể cả người đi ngang; không ai trong tầm thì rơi về người đầu quầy. */
export const TALK_REACH = 3;

const EMPTY_STR: readonly string[] = [];

/** Phải đóng lại TRƯỚC khi người ta bắt đầu sốt ruột (`t.impatient` ở 0,6). */
const ORDER_WINDOW = 0.35;

const OVEN_SMELL_SEC = 90;

const STREET_RUMOUR_CHANCE = 0.3;

/** ⚠️ Giây THẬT, không phải phút game: đồng hồ tua nhanh khi quầy trống thì mọi lời hứa cùng hết hạn một lượt. */
const DEED_DUE: Record<string, number> = {
  ROT_TRA: 25, DUA_BANH: 15, BUNG_GANH: 15, LAY_SO: 40, DOI_DON: 20,
};

const DEED_LABEL: Record<string, string> = {
  ROT_TRA: "rót cho người ta ly trà", DUA_BANH: "đưa người ta miếng bánh",
  BUNG_GANH: "bưng giùm cái gánh", LAY_SO: "lấy giùm cuốn sổ", DOI_DON: "sửa lại cái đơn",
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

/**
 * Mốc "dài quá" suy từ `SLOTS.length`; hàng kín chỗ trả thẳng `BALK_WHEN_FULL`.
 * ⚠️ NGƯỢC CHIỀU với `queuePatienceMul` (cái kia xảy ra SAU khi đã xếp vào) — trộn hai cái là phá
 * hợp đồng ở `tests/p1-queue-patience`.
 */
const BALK_FROM_FILL = 0.6;
const BALK_AT_FROM = 0.2;
const BALK_MAX = 0.55;
const BALK_WHEN_FULL = 0.92;
const BALK_REL_MIN = 0.7;
const BALK_REL_MAX = 1.6;
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
  relVisitMul: number;
  moodPatience: number;
  rushing: boolean;
}) {
  if (o.slots <= 0) return 0;
  if (o.ahead >= o.slots) return BALK_WHEN_FULL;
  const from = balkFrom(o.slots);
  if (o.ahead < from) return 0;
  const span = Math.max(1, o.slots - 1 - from);
  const base = BALK_AT_FROM + (BALK_MAX - BALK_AT_FROM) * clamp01((o.ahead - from) / span);
  const rel = Math.min(BALK_REL_MAX, Math.max(BALK_REL_MIN, 1 / Math.max(0.01, o.relVisitMul)));
  const mood = 1 / Math.max(0.01, o.moodPatience);
  return Math.min(BALK_CEIL, base * intensityMul(o.person) * rel * mood * (o.rushing ? BALK_RUSH : 1));
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
/** ⚠️ TẠM: chỗ đúng của mấy chuỗi này là một trường mô tả hình dáng trong `content/npcs.ts`. */
const XUNG_HO: Record<string, string> = {
  "Bà": "bà", "Ông": "ông", "Chú": "chú", "Cô": "cô",
  "Anh": "anh", "Chị": "chị", "Bé": "nhỏ", "Thầy": "ông",
};
const HAT_VI: Record<string, string> = { nonla: "nón lá", helmet: "nón bảo hiểm", cap: "nón lưỡi trai" };
const HAIR_VI: Record<string, string> = { bun: "tóc búi", ponytail: "tóc đuôi ngựa", bob: "tóc ngang vai" };

export function shapeOf(npc: NpcDef): string {
  const b = npc.body;
  const xh = XUNG_HO[npc.name.split(" ")[0]] ?? "khách";
  const net = (b.hat ? HAT_VI[b.hat] : undefined)
    ?? (b.glasses ? "đeo kính" : undefined)
    ?? (b.hairStyle ? HAIR_VI[b.hairStyle] : undefined)
    ?? (b.apron !== undefined ? "mang tạp dề" : undefined)
    ?? (b.bag !== undefined ? "xách giỏ" : undefined)
    ?? (b.stoop ? "lưng còng" : undefined)
    ?? (b.build === "round" ? "to con" : undefined);
  return net ? `${xh} ${net}` : xh;
}

export function isHollowLoaf(spec: OrderSpec, dish: readonly Ingredient[]) {
  if (dish.some((i) => NHAN_IDS.has(i))) return false;
  for (const i of NHAN_IDS) if ((spec.levels[i] ?? 0) > 0) return true;
  return false;
}

export function hollowWantLabel(spec: OrderSpec) {
  const first = INGREDIENTS.find((i) => NHAN_IDS.has(i.id) && (spec.levels[i.id] ?? 0) > 0);
  return first ? first.label : "nhân";
}

/** `playerSay` là câu CÔ BA nói lúc chìa ổ có đồ cho thêm — scene vẽ bong bóng trên đầu cô. */
export type ServeResult = { ok: boolean; reason?: string; playerSay?: string };

export type ServiceEvent =
  | { kind: "log"; text: string }
  | { kind: "credit"; record: DebtRecord; name: string }
  | { kind: "repay"; amount: number; npcId: string; name: string }
  | { kind: "paid"; amount: number; item: "dish"; tip: number }
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
  todayCounters?: { talksDeep?: number; talkOffers?: number };
  readMul?: number;
  dialog?: DialogState;
  gossip?: GossipState;
  notebook?: Notebook;
  standMul?: number;
  followers?: string[] | null;
  standClosed?: boolean;
  patienceMul?: number;
  gazeMul?: number;
  debts?: DebtRecord[];
  till?: { floatLeft: number };
  allowFalseMemory?: boolean;
  equip?: EquipState;
  loaOn?: boolean;
  story?: StoryState;
  noTimePressure?: boolean;
};

type Visit = { at: number; npc: NpcDef | null; seq: number; plan?: VisitPlan; defer?: number };
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

const NOTICE_SPOKEN: ReadonlySet<StimId> = new Set<StimId>(["DROPPED_FOOD", "BURNT_OR_COLD", "DIRTY_HANDS", "WRONG_NAME", "FLOURISH"]);

const TIP_RATE: Record<RelTier, number> = { RIVAL: 0, ACQUAINTANCE: 0.045, FRIEND: 0.11 };
/** T-A = khách nói "như mọi bữa" rồi mình làm đúng · T-B = mình làm sẵn trước khi họ mở miệng. */
const REMEMBERED_USUAL_TA = 70;
const REMEMBERED_USUAL_TB = 90;
const FREE_EXTRA_BASE = 25;
const FREE_EXTRA_DIMINISH = [1.0, 0.6, 0.25];
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/**
 * Cờ `soiled` đi theo TỪNG Ổ, không theo người chơi; chia hai nhánh theo việc người đó CÓ THẤY KHÔNG.
 * ⚠️ `GRIT` phải nhỏ hơn hẳn `CAUGHT`, nếu không nước đi tối ưu thành "cứ đưa đại, cầu cho nó đừng thấy".
 */
const SOILED_CAUGHT = 95;
const SOILED_GRIT = 30;
const SOILED_REFUSE_TOAST = "khách thấy ổ đó rớt rồi";

/**
 * Thiếu miếng đồ chua là tay làm sai, ổ trống là CHƯA LÀM — nên nó không qua túi im lặng và có
 * concept riêng `HOLLOW_LOAF`. Ghi đúng một lần mỗi lượt ghé.
 */
const HOLLOW_REFUSED = 55;
const HOLLOW_REFUSE_TOAST = "khách không nhận — ổ chưa có nhân";

export const takesHollowLoaf = (p: Personality) => p.nongTinh <= 0.4 && p.deTha >= 0.7;

/**
 * Mượn `WRONG_TEMP` chứ không thêm kind mới; nguội và non tách ở tầng THOẠI bằng `dishUnderdone`.
 * ⚠️ Trần 0,90 chứ không 1,0: ký ức ghi 90 × mag², mà bánh non không được nặng bằng bánh cháy (80).
 */
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

/** T3: một CHIỀU, một mức ĐẬM/NHẠT, một mẩu chữ. Sàn 2 = `EPSILON` của `sim/memory.ts`. */
const REL_MOVE_MIN = 2;
const REL_MOVE_STRONG = 8;

/** Mỗi người chỉ có MỘT bong bóng, nên phải đợi câu nhận bánh đọc xong — mà vẫn kịp trước khi họ ra tới cổng. */
const FAREWELL_DELAY = 1.8;

export type DiffedDefect = Defect & { key: string | null; witness: "ANTICIPATED" | "DISCOVERED" };

export class Service {
  readonly customers: Customer[] = [];
  private active: ActiveStim[] = [];
  private schedule: Visit[] = [];
  private usual = new Map<string, OrderSpec>();
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
  /** Một người mua HAI ổ thì `serveDish` chạy hai lần cho cùng một lượt ghé. */
  private habitSettled = new Set<string>();
  private hollowShown = new Set<string>();
  private serveOutcome = new Map<string, ServeOutcome>();
  /** Nhiều `record()` trong một lần giao bánh gộp thành MỘT dòng; lý do nặng ký nhất thắng. */
  private relNote: { text: string; w: number } | null = null;
  private teaToday = new Map<string, number>();
  private devSeq = 0;
  private talkSession: TalkSession | null = null;
  private talkWith: Customer | null = null;
  /**
   * ⚠️ KHÔNG phải `talkWith`: `chooseTalk` gọi `endTalk()` ngay trong nhịp cuối, nên `talkWith` đã
   * `null` trước khi scene kịp đưa câu đáp ra màn hình.
   */
  private talkVoice: Customer | null = null;
  private talkVoiceUntil = 0;
  /** HÀNG ĐỢI chứ không phải một ô: một ô thì người thứ hai im suốt lượt ghé vì `smalltalked` đã chạy trước. */
  private offers: { c: Customer; talk: Talk; at: number }[] = [];
  /** Có ai đang CHỜ MÌNH TRẢ LỜI không — cho bot/công cụ; `StallScene` đọc qua `pendingTalk`. */
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
  /** ⚠️ Không ghi vào `mem(memKey).talksDone`: `memKey` của người lạ là `walkin<dáng>` — tám dáng dùng chung một sổ cả mùa. */
  private talkedThisVisit = new Map<string, string[]>();
  /** Đếm MỌI cuộc kể cả túi dùng chung — `talkedThisVisit` cố ý không ghi cuộc `ANY`. */
  private passerTalks = new Map<string, number>();
  private talkEngaged = false;
  private talkNpcOpened = false;
  /** Cộng từ `rel` người viết khai, không đo `relNow()`: người đi ngang không có `npc` nên `relNow()` luôn 0. */
  private talkWarmth = 0;
  private lastTarget: Customer | null = null;
  private actReply: { text: string; mood: TalkMood } | null = null;
  private pledges = new Map<string, { promised: string[]; discount: number; free: boolean }>();
  teaLeft = TEA_PER_DAY;
  dirt = 0;
  handsDirty = false;
  /** Van NGỮ CẢNH, khác ba van tần suất ở trên: `false` ở bảy cửa sổ cấm (cầm ổ nóng, bảng kẹp nhân mở, FLOURISH, lò SÉM, tay bận, khách đang gọi, còn đồ rơi). */
  interruptible = true;
  soldOut = false;
  soldOutCount = 0;
  ovenBusy = false;
  private lastBatchOutAt = -Infinity;
  private wasOvenBusy = false;

  /** ⚠️ Khác `w.ovenHot` của bảng đen — xem khối ở `ovenHot` ngay dưới. */
  get stallRunning() { return this.ovenBusy || this.servedCount > 0; }

  /**
   * ⚠️ Phải tách khỏi `stallRunning`: bảng đen khai fact này là "lò đang nhen / mẻ vừa ra", và mùi
   * bánh không tắt ngay lúc rút ổ ra khỏi lò.
   */
  get ovenHot() { return this.ovenBusy || this.nowSec - this.lastBatchOutAt < OVEN_SMELL_SEC; }
  /**
   * MẺ VỪA RA LÒ — không có `ovenBusy ||`, và đó là cả điểm khác biệt.
   *
   * `ovenHot` đo ra **100%** lúc mở cuộc: đang bán thì lò gần như lúc nào cũng nhen, nên
   * `OVEN_SMELL_SEC` nằm sau một `||` luôn đúng và 90 giây kia không có nghĩa gì. Hai cuộc
   * khoá vào nó ("thơm quá {you} ơi", "mẻ mới ra lò") vì thế chạy mọi lúc, kể cả khi mẻ
   * gần nhất ra cách đây nửa tiếng.
   */
  get meVuaRa() { return this.nowSec - this.lastBatchOutAt < OVEN_SMELL_SEC; }
  private storyTimeline: { at: number; text: string }[] = [];
  private walkinIdx = 0;
  // ── người qua đường (sim/passersby.ts) ─────────────────────────────────────
  private passerIn = 0;
  private passerSeq = 0;
  playerAt: { x: number; y: number } | null = null;
  playerHand = "empty";
  playerOnStreet = false;
  shadeFree = false;
  seatFree = false;
  /** `"NGOAI"` là bà hạ gánh ngoài lối vào — chiếm một chỗ mặt tiền cho tới khi được mời dời vô. */
  ganh: "NGOAI" | "TRONG" | null = null;
  /**
   * XE CHÚ KIỆT đang ở đâu — `null` là chú không có mặt.
   *
   * `"LAN"` là chú đẩy sát qua mặt tiền mình, và đó là mặc định khi chú tới: ông ta không
   * xin phép. Người chơi xử lý bằng `MOVE_CART`.
   */
  cart: "LAN" | "XA" | "CHUNG" | null = null;
  /** Tiếng rao còn trong không khí tới giây nào (giây THẬT) — act `RAO`. */
  raoUntil = -1;
  /** Còn mấy cái áo mưa chưa cho ai mượn — act `LEND_ITEM` / `CLEAR_DEBT`. */
  coats = COATS_START;
  /** Khác `soldOut` (ngưỡng 0): "còn mấy ổ cuối" là một NGƯỠNG, và ba nút `qua-duong` hỏi đúng nó. */
  stock = 0;
  /** Tầng `d.*`, khoá theo `memKey` chứ không theo lượt ghé. Không cần dọn — `Service` sống một buổi bán. */
  private toldToday = new Map<string, string[]>();
  /** `null` = không nhớ ra gì khớp, và lúc đó `m.remembers` sai nên mọi câu nhắc chuyện cũ không tồn tại. */
  private recalled: Recalled | null = null;
  /** Sống trong `Service` (một buổi bán), không trong save — lời hứa QUA ĐÊM là của `obligations.ts`. */
  private deeds: { c: Customer; deed: Deed; dueAt: number; nudged: number }[] = [];
  private asideFor = new Map<string, ForSec>();
  private arriveSeq = 0;
  private talkAngered = false;
  via: ViaMood = 0;
  viaSettled = false;
  private opening: OpeningFacts = { walkedAway: false, complained: false, noChange: false, paidExact: false, smiled: false, friend: false };
  private dirtRemarked = false;

  servedCount = 0;
  lostCount = 0;
  /** CỐ Ý tách khỏi `lostCount` — xem nhánh `balked` trong `leave()`. Cho dev overlay, không cho màn tối. */
  balkedCount = 0;
  dialogDeferred = 0;

  readonly out: ServiceEvent[] = [];

  constructor(private deps: ServiceDeps) {
    this.dialogRng = deps.hub.stream("dialog-shufflebag");
    this.barks = new Barks(this.dialogRng, deps.bags, deps.day);
    this.speaker = new Speaker(this.dialogRng, deps.bags, deps.day, deps.dialog, 0);
    if (has(deps.equip, "BINH_TRA")) this.teaLeft = 40;
    this.talks.ensure(SHARED_POOL);
    this.buildSchedule();
    if (deps.story) this.storyTimeline = timeline(deps.day, { atAlley: !deps.followers });
    const cut = deps.resumeAt ?? -1;
    this.storyTimeline = this.storyTimeline.filter((x) => x.at > cut);
    this.schedule = this.schedule.filter((v) => v.at > cut);

    if (deps.notebook) beginDay(deps.notebook, deps.day);
    this.offStim = deps.bus.on("stim:emitted", (s) => {
      if (s.stimId === "DROPPED_FOOD" && this.deps.notebook) this.deps.notebook.today.dropped++;
      if (s.stimId === "FLOURISH" && this.deps.story && this.deps.day === 5 && this.audience.some((x) => x.memKey === "BE_SU")) this.deps.story.flags.suPretty = 5;
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

  /** Sinh từ dòng số RIÊNG của (ngày, "npc-schedule") — không phụ thuộc người chơi làm gì trong ngày. */
  private buildSchedule() {
    const rng = this.deps.hub.derive("npc-schedule");
    const list: Omit<Visit, "seq">[] = [];
    if (this.deps.standClosed) { this.schedule = []; return; }
    const ctx = this.arcCtx();
    for (const npc of NPCS) {
      const m = this.mem(npc.id);
      const t0 = rollVisit(npc.schedule, this.deps.day, rng, visitProbabilityMul(m) * this.rumourMul(npc.id, 0.9, 1.1));
      const arc = ctx ? arcToday(npc.id, ctx, t0) : null;
      if (arc?.absent) continue;
      const t = arc?.at ?? t0;
      if (t === null || m.gone) continue;
      const followsHere = !this.deps.followers || this.deps.day === 40 || this.deps.followers.includes(npc.id);
      if (arc?.pass) { if (followsHere) list.push({ at: Math.max(DAY_START_MIN + 2, t), npc, plan: arc }); continue; }
      // Có lịch hôm nay = một lần ghé người chơi có thể LỠ — decay đếm lần lỡ, không đếm ngày.
      m.expectedDay = this.deps.day;
      m.expectedAt = t;
      if (m.absentUntil >= this.deps.day) continue;
      if (this.deps.followers && this.deps.day !== 40 && !this.deps.followers.includes(npc.id)) continue;
      list.push({ at: Math.max(DAY_START_MIN + 2, Math.min(DAY_END_MIN - 12, t)), npc, plan: arc ?? undefined });
    }
    if (ctx) {
      for (const x of extraVisits(ctx)) {
        const npc = x.npcId ? NPCS.find((n) => n.id === x.npcId) ?? null : null;
        if (npc && this.mem(npc.id).gone) continue;
        if (this.deps.followers && this.deps.day !== 40 && (!npc || !this.deps.followers.includes(npc.id))) continue;
        list.push({ at: x.at, npc, plan: x });
      }
    }
    let t = DAY_START_MIN + 8;
    while (t < DAY_END_MIN - 10) {
      const peak = t >= PEAK_START_MIN && t < PEAK_END_MIN;
      t += peak ? 6 + rng.next() * 7 : 15 + rng.next() * 16;
      if (t >= DAY_END_MIN - 10) break;
      if (this.deps.story && this.deps.day === 40 && t >= 10 * 60) continue;
      const wx = weatherOf(this.deps.day);
      const gear = equipWalkIn(this.deps.equip, isRain(wx), wx === "NANG_GAT", this.deps.loaOn ?? true);
      const story = storyCrowdMul(this.deps.day, this.deps.story, { hasQr: has(this.deps.equip, "BANG_QR") });
      const keep = Math.min(1, 0.65 * CAL.weatherInfo[wx].walkIn * crowdMul(this.deps.day) * (this.deps.standMul ?? 1) * gear * story);
      if (rng.next() >= keep) continue;
      list.push({ at: t, npc: null });
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

  /** Không vào save. Người có tên: câu NGUYÊN VĂN của P4-01; khách vãng lai: suy từ seed + id. */
  private usualOf(id: string, atMin = 0): OrderSpec {
    const ctx = this.arcCtx();
    const authored = ctx ? authoredUsual(id, ctx, atMin) : null;
    if (authored) return authored;
    let u = this.usual.get(id);
    if (!u) this.usual.set(id, (u = makeUsual(Rng.forSeason(this.deps.saveId, id))));
    return u;
  }

  private arcCtx(): ArcCtx | null {
    const st = this.deps.story;
    if (!st) return null;
    return arcCtx(st, this.deps.day, {
      rain: isRain(weatherOf(this.deps.day)),
      owns: (e) => has(this.deps.equip, e as never),
      hasWrongName: (id) => {
        const m = this.deps.npcs[id]?.memory;
        return !!m && [...m.short, ...m.long, ...(m.core ? [m.core] : [])].some((x) => x.kind === "WRONG_NAME");
      },
    });
  }

  private queueLines(c: Customer, lines: readonly Line[] | undefined, base = 0.8) {
    let t = this.nowSec + base;
    for (const l of lines ?? []) {
      const o = typeof l === "string" ? { text: l } : l;
      const when = o.delay !== undefined ? this.nowSec + o.delay : t;
      c.script.push({ at: when, text: o.text, by: o.by });
      t = when + 2.6;
    }
  }

  /** Chỉ khi là NPC có tên VÀ người chơi đã NGHE họ đọc nguyên đơn ít nhất hai lần. */
  private canAskUsual(npc: NpcDef | null, m: NpcState) {
    return npc !== null && m.heard >= 2;
  }

  private patienceOf(npc: NpcDef | null, at: number, ahead: number) {
    const base = npc?.patience ?? DEFAULT_PATIENCE_SEC;
    const rush = npc?.rush && at >= npc.rush[0] && at < npc.rush[1] ? 0.65 : 1;
    const tier = npc ? this.mem(npc.id).tier : "ACQUAINTANCE";
    const bond = tier === "RIVAL" ? 0.8 : tier === "FRIEND" ? 1.35 : 1;
    return base * rush * bond * queuePatienceMul(ahead) * (this.deps.patienceMul ?? 1) + PATIENCE_BONUS_SEC;
  }

  private spawn(v: Visit, nowMin: number) {
    const npc = v.npc;
    const plan = v.plan ?? null;
    /** Chỉ đếm khách VÃNG LAI — người có tên tới theo lịch của họ. Quá trần thì lượt ghé DỜI LẠI một phút, không mất. */
    const unlimited = !!this.deps.noTimePressure;
    if (!plan?.pass && (unlimited || !npc)) {
      const standing = this.customers.filter((x) => x.phase !== "leaving" && !x.pass && !x.balking && (unlimited || !x.npc));
      if (standing.length >= peakCap(this.deps.day, unlimited)) {
        this.schedule.unshift({ ...v, at: nowMin + 1 });
        this.schedule.sort((a, b) => a.at - b.at);
        return;
      }
    }
    if (!npc && this.via !== 0 && this.deps.hub.derive(`via:${v.seq}`).next() > viaWalkInMul(this.via)) return;
    const rng = this.deps.hub.derive(`visit:${v.seq}`);
    const wi = plan?.style ?? v.seq % WALKIN_STYLES.length;
    const memKey = npc ? npc.id : plan?.key ? `x_${plan.key}` : `walkin${wi}`;
    const id = `${memKey}#${v.seq}`;
    const m = this.mem(memKey);
    const style = npc ? npc.body : WALKIN_STYLES[wi];
    const name = npc ? npc.name : plan?.name ?? WALKIN_NAMES[wi];
    const person = npc
      ? npc.personality
      : { soi: 0.3 + rng.next() * 0.5, nongTinh: 0.2 + rng.next() * 0.5,
          deTha: 0.5 + rng.next() * 0.4, thanThien: 0.3 + rng.next() * 0.5 };

    const mood = rollMood(this.deps.hub.derive(`mood:${v.seq}`), this.deps.day);
    // Tính ở ĐÂY một lần, không theo chỗ đứng hiện thời: họ đã chấp nhận cái hàng họ NHÌN THẤY lúc xếp vào.
    /** Cái gánh để ngoài CHIẾM MỘT CHỖ MẶT TIỀN — khách nhìn vô thấy chật y như có thêm một người. */
    const ahead = this.customers.filter((x) => x.phase !== "leaving" && !x.pass && !x.balking).length
      + (this.ganh === "NGOAI" ? 1 : 0);

    /**
     * Ba trường hợp KHÔNG bao giờ quay đầu: lượt ghé có kịch bản · chế độ không giới hạn thời gian ·
     * người đi ngang. ⚠️ Dòng số RIÊNG `balk:`, không rút ké từ `visit:`.
     */
    /** ⚠️ Dòng số RIÊNG `kiet:` — rút ké là dịch chuỗi số của cả lượt ghé. */
    const kietLay = this.cart === "LAN" && !npc && !plan?.pass
      && this.deps.hub.derive(`kiet:${v.seq}`).next() < KIET_STEAL;
    if (kietLay) this.out.push({ kind: "log", text: "một người ghé xe chú Kiệt thay vì xe mình." });

    const balking = kietLay || (!plan && !this.deps.noTimePressure
      && this.deps.hub.derive(`balk:${v.seq}`).next() < balkChance({
        ahead, slots: SLOTS.length, person,
        relVisitMul: visitProbabilityMul(m), moodPatience: moodPatienceMul(mood),
        rushing: !!npc?.rush && nowMin >= npc.rush[0] && nowMin < npc.rush[1],
      }));
    // Quay đầu ở đầu hẻm KHÔNG phải một lượt ghé.
    if (!plan?.pass && !balking) m.visits++;
    m.lastSeenDay = this.deps.day;

    const c = new Customer(
      id, memKey, name, person, style, npc, this.usualOf(memKey, v.at), m.visits,
      { ...GATE }, this.patienceOf(npc, nowMin, ahead) * moodPatienceMul(mood), rng,
    );
    c.plan = plan;
    c.balking = balking;
    // Không `await`: họ còn đi bộ mấy giây, và `openTalk()` đã có đường lui nếu chưa kịp.
    void this.talks.ensure(npc ? npc.id : "WALKIN");
    if (plan?.pass) {
      c.phase = "leaving";
      c.pass = { stay: plan.pass.stay ?? 2, until: -1, nod: plan.pass.nod };
      this.customers.push(c);
      this.deps.bus.emit("npc:arrived", { npcId: memKey, visitId: id, slot: "SEATED_FAR", atHhmm: fmtHhmm(v.at) });
      return;
    }
    c.more = [...(plan?.more ?? [])];
    c.holdLeft = plan?.holdSec ?? 0;
    c.dayMood = mood;
    c.gazeMul = this.deps.gazeMul ?? 1;
    if (npc && this.deps.gossip && activeHeard(this.deps.gossip, npc.id)
      .some((b) => b.valence < 0 && (b.kind === "ORDER_DEFECT" || b.kind === "DIRTY_HANDS" || b.kind === "DROPPED_FOOD"))) c.gazeBias = 0.1;
    const base = moodBaseFace(mood);
    if (base) c.react.baseFace = c.react.face = base;
    if (mood.prop === "VAI_XUOI") c.react.basePose = c.react.pose = "SETTLE_IN";
    if (plan?.order) c.order = plan.order;
    else if (npc && this.deps.story && c.usual.phrase) {
      const short = c.usual.short && !plan?.noShort && this.canAskUsual(npc, m) && rng.next() < 0.5;
      c.order = short ? { ...c.usual, intent: { ...c.usual.intent, usual: true } } : c.usual;
    } else c.rollOrder(this.canAskUsual(npc, m));
    if (!npc && !plan && this.deps.story) {
      const line = walkinLine(this.deps.day, this.deps.story, ++this.walkinIdx);
      if (line) c.plan = { after: [{ text: line, delay: 2.4 }] };
    }
    for (const o of this.customers) if (o.phase !== "leaving") this.speaker.apply(o.memKey, "ctxKhachMoiToi", 1, 8, this.nowSec);
    c.driveBase = baseDrives(c.personality);
    c.drives = { ...c.driveBase };
    c.arrivedSeq = ++this.arriveSeq;
    this.customers.push(c);
    this.maybeCutLine(c);
    this.deps.bus.emit("npc:arrived", { npcId: memKey, visitId: id, slot: "SEATED_FAR", atHhmm: fmtHhmm(v.at) });
  }

  /** Chỗ duy nhất gán `Customer.cutLine`. Ai chen: người NÓNG TÍNH đang VỘI, và chỉ khi hàng đã có người. */
  private maybeCutLine(c: Customer) {
    const ahead = this.customers.filter((x) => x !== c && this.inQueue(x) && !x.aside);
    if (ahead.length < 1) return;
    const hurry = c.purpose?.hurry ?? 0.3;
    const p = Math.max(0, 0.45 * c.personality.nongTinh * (0.4 + hurry) - 0.12 * ahead.length);
    /** ⚠️ Rút có điều kiện trên dòng dùng chung thì golden không vỡ ngay mà vỡ lệch pha vài ngày sau. */
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

  // ─────────────────────────────────────────────── bước 3 · tầng NHẬN THẤY

  /** Duyệt từ phía SỰ KIỆN. ⚠️ Không được hoãn — hoãn perception là đổi kết quả game. */
  perceive(dt: number, nowSec: number, occluders: readonly Occluder[] = []) {
    this.nowSec = nowSec;
    this.active = this.active.filter((s) => s.until > nowSec - 30);
    const st = this.deps.story;
    if (st && this.deps.day === 5 && !st.flags.suCover && occluders.some((o) => o.mul < 0.5 && o.slots.includes("HANDS"))
      && this.audience.some((x) => x.memKey === "BE_SU")) st.flags.suCover = 5;

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
        if (to === "CONFIRMED" && (o.id === "DROPPED_FOOD" || o.id === "DIRTY_HANDS" || o.id === "BURNT_OR_COLD")) {
          this.remember(c, o.id, SALIENCE[o.id] * o.certainty);
        } else if (to === "NOTICED" && o.id === "FLOURISH") this.remember(c, "FLOURISH", SALIENCE.FLOURISH);
        if (to === "CONFIRMED") this.deps.bus.emit("perception:confirmed", { npcId: c.memKey, stimId: o.id });
        if (to === "NOTICED" && NOTICE_SPOKEN.has(o.id)) this.noticeBark(c, o.id, to, o.smell);
      }
    }
  }

  /** 35% im lặng (túi theo người). Cooldown tier-1 nằm trong content — hết lượt thì rule điểm thấp hơn thắng. */
  private noticeBark(c: Customer, id: StimId, state: ObsState, smell?: boolean) {
    if (!this.barks.speaks(c.memKey)) {
      this.deps.bus.emit("dialog:silent", { npcId: c.memKey, reason: "RATE_35" });
      return;
    }
    const q: Record<string, string | number | boolean> = { eventId: id, obsState: state, eventSalience: SALIENCE[id] };
    // `BURNT_OR_COLD` gánh hai chuyện: ổ cháy trong lò (có MÙI) và ổ nguội lúc đưa. Không
    // tách ra thì khách kêu "khét lẹt" trước một ổ chỉ nguội.
    if (id === "BURNT_OR_COLD") q.eventBurnt = !!smell;
    this.speakConcept(c, "NOTICE_EVENT", q, SALIENCE[id]);
  }

  /** Mặt đổi sau `reactionDelay`, không hai người nào trong cùng 60 ms. Luật 35% im lặng là không NÓI, không phải không phản ứng. */
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

  /** Chuyện KHÔNG có kích thích riêng (lời nói ở quầy): không có `StimId` để tra `npc.poses` nên dáng lấy từ bảng nhóm. */
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

  /** Chỉ 12 người có tên mới có trí nhớ — khách vãng lai gặp chuyện xấu thì "im, đi thẳng, không quay lại". */
  private remember(c: Customer, kind: BaseKind, intensity: number, detail?: Memory["detail"]) {
    if (!c.npc || intensity <= 0) return;
    const m = this.mem(c.memKey);
    const day = this.deps.day;
    const res = record(m, c.personality, kind, Math.min(100, intensity), day, { detail, badDay: c.dayMood.value < 35 });
    if (this.deps.gossip) witness(this.deps.gossip, c.memKey, kind, Math.min(100, intensity), day);
    const nb = this.deps.notebook;
    if (nb) {
      if (res.healed.length && !nb.today.healed.includes(c.memKey)) nb.today.healed.push(c.memKey);
      if (kind === "REMEMBERED_USUAL" && (m.memory.short.find((x) => x.kind === kind) ?? m.memory.long.find((x) => x.kind === kind))?.occurrences === 1) {
        nb.today.firstUsual.push(c.memKey);
      }
    }
    this.deps.bus.emit("memory:written", {
      npcId: c.memKey, kind: kind as StimId, intensity: Math.round(Math.min(100, intensity)),
      tier: res.core ? "CORE" : "SHORT", evicted: res.evicted,
    });
    if (isSilentGrudge(c.personality)) {
      const hands = kind === "DIRTY_HANDS" && (m.memory.short.find((x) => x.kind === "DIRTY_HANDS")?.occurrences ?? 0) >= 3;
      const n = SILENT_ABSENCE[kind] ?? (hands ? 3 : 0);
      if (n) m.absentUntil = Math.max(m.absentUntil, day + n);
    }
  }

  // ───────────────────────────────────────── "việc mình làm có tới không" (T3)

  /** Lý do NẶNG KÝ NHẤT thắng (người chơi chỉ đọc được một dòng). `>=` để lý do ghi SAU thắng khi hoà. */
  private noteRel(text: string, weight: number) {
    if (!this.relNote || weight >= this.relNote.w) this.relNote = { text, w: weight };
  }

  /** Gộp mọi `record()` của một sự kiện thành một chiều ròng; ròng gần 0 thì KHÔNG phát — im lặng cũng là tin. */
  private settleRelMoved(c: Customer, before: number) {
    const note = this.relNote;
    this.relNote = null;
    if (!c.npc || !note) return;
    const delta = this.mem(c.memKey).relationPoints - before;
    if (Math.abs(delta) < REL_MOVE_MIN) return;
    this.deps.bus.emit("relationship:moved", {
      npcId: c.memKey,
      dir: delta > 0 ? "UP" : "DOWN",
      strength: Math.abs(delta) >= REL_MOVE_STRONG ? "RO" : "NHE",
      note: note.text,
    });
  }

  private relNow(c: Customer) {
    return c.npc ? this.mem(c.memKey).relationPoints : 0;
  }

  // ──────────────────────────────────────────────────── bước 4 · khách

  tickNpcs(dt: number, ctx: { minutes: number; pressure: boolean; dayOver: boolean }) {
    this.nowMin = ctx.minutes;
    while (this.storyTimeline.length && this.storyTimeline[0].at <= ctx.minutes) this.out.push({ kind: "log", text: this.storyTimeline.shift()!.text });
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
      for (let i = c.script.length - 1; i >= 0; i--) {
        const s = c.script[i];
        if (s.at > this.nowSec) continue;
        c.script.splice(i, 1);
        const who = s.by ? this.customers.find((x) => x.memKey === s.by && x.phase !== "leaving") : c;
        if (who) this.say(who, s.text, 2, true, 96);
      }
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
      // Chỗ đi khuất của CHÍNH người này — cổng khách nằm ngay trên dải người qua đường đi.
      const exit = c.pass?.exit ?? GATE;
      if (c.phase !== "leaving" || !near(c, exit, 0.5) || lingering) continue;
      /** ⚠️ Người đi ngang đi khuất bằng `splice`, không qua `leave()` — mà `leave()` là chỗ duy nhất dọn phiên trò chuyện. */
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

  // ────────────────────────────────────────────── người qua đường (ambient)

  /** Đếm bằng GIÂY THẬT, không phút game: đồng hồ tua nhanh khi quầy trống thì hẻm vắng nhất lại là lúc họ ùa ra. */
  private tickPassers(dt: number, dayOver: boolean) {
    if (dayOver) return;
    this.passerIn -= dt;
    if (this.passerIn > 0) return;
    const rng = this.deps.hub.derive(`passer:${this.deps.day}:${this.passerSeq}`);
    this.passerIn = nextGapSec(bandOf(this.nowMin), isRain(weatherOf(this.deps.day)), rng);
    // Quá trần thì BỎ lượt này, không dồn lại: dồn thì lúc trần hạ là cả đám ùa ra một nhịp.
    if (this.customers.reduce((n, c) => n + (c.ambient ? 1 : 0), 0) >= PASSERS_MAX) return;
    this.spawnPasser(rng);
  }

  /**
   * Đi ngược chiều trong vòng một ô, roll tất định theo CẶP và NGÀY, chậm lại 0,8 giây.
   *
   * Ba mức, từ nhẹ tới nặng: chào một câu rồi đi tiếp → đứng lại ném một TIN ĐỒN →
   * `chatScene()` đứng tám hẳn một cảnh. Cảnh chỉ nổ khi hẻm đang im (hàng đợi lời ≤ 1),
   * vì một câu nền `pri 18` quá hạn `QUEUE_EXPIRE_SEC` là bị bỏ — nổ giữa lúc đông thì
   * hai người đứng chôn chân mà không ai nói gì.
   */
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
        /*
         * CẢNH TÁM CHUYỆN — hai người dừng hẳn, nói qua lại mấy nhịp. Người chơi không
         * cần xen vào; nó là cái nền làm hẻm có người sống. Roll RIÊNG, tất định theo cặp
         * và ngày, không rút ké dòng `greet:`.
         */
        if (this.queue.length <= 1 && this.deps.hub.derive(`tam:${this.deps.day}:${key}`).next() < CHAT_SCENE_CHANCE) {
          this.chatScene(a, b, key);
          return;
        }
        const hi = this.barks.take("chaoNhau", a.memKey);
        /** Câu ĐÁP có xác suất là một tin đồn đang sống. Người đi ngang không giữ niềm tin nào và không dẫn nguồn. */
        const tin = this.streetRumour();
        /*
         * Chào một câu thì đi chậm lại; KỂ một chuyện thì đứng hẳn. Dừng bằng cách ghim
         * `pass.spot` vào đúng chỗ đang đứng — cùng cơ chế `openTalk` dùng để ghim một
         * người đang đi ngang, nên không đẻ thêm một đường dừng thứ hai.
         */
        const dung = !!tin;
        for (const x of [a, b]) {
          x.greetUntil = x.now + (dung ? CHAT_STOP_SEC : GREET_SLOW_SEC);
          if (dung && x.pass) { x.pass.spot = { x: x.x, y: x.y }; x.pass.until = x.now + CHAT_STOP_SEC; }
        }
        const re = tin ?? this.barks.take("chaoDap", b.memKey);
        if (hi) this.say(a, hi, 3, false, 20);
        if (re) this.say(b, re, 3, false, 20, undefined, GREET_REPLY_SEC);
        if (tin) {
          this.deps.bus.emit("gossip:overheard", {
            a: a.memKey as never, b: b.memKey as never,
            claim: this.lastRumourId, source: null, tier: 1,
          });
        }
        return;
      }
    }
  }

  /**
   * Hai người đi ngang đứng lại tám một cảnh — luân phiên A → B → A → B.
   *
   * Dừng bằng chính cơ chế `openTalk` ghim người đi ngang (`pass.spot` = chỗ đang đứng),
   * nên không đẻ thêm một đường dừng thứ hai. Cảnh rút tất định theo cặp + ngày: cùng một
   * ván thì cùng một cảnh, golden không lệch.
   */
  private chatScene(a: Customer, b: Customer, key: string) {
    /*
     * ⚠️ Phải đứng GẦN nhau mới tám được. `greetPassers()` đã lọc `GREET_REACH`, nhưng cái
     * gác nằm ở ĐÂY mới đủ: chơi thử trên trình duyệt (ngày 8) thấy hai bong bóng nổ ở hai
     * đầu hẻm cách nhau mười bốn ô — nhìn như hai người hét qua đường. Một hàm công khai
     * dựng cảnh thì tự nó phải từ chối cái cặp vô lý, không trông vào chỗ gọi.
     */
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

  private lastRumourId = "";

  /** Không giữ tin nào thì trả `null` và cảnh chào chạy bằng bark thường. Dùng câu `belief` (không `{source}`). */
  private streetRumour(): string | null {
    const g = this.deps.gossip;
    if (!g) return null;
    if (this.deps.hub.derive(`rumour:${this.deps.day}:${this.passerSeq}`).next() >= STREET_RUMOUR_CHANCE) return null;
    let best: { id: string; conf: number } | null = null;
    for (const npc of NPCS) {
      for (const b of activeHeard(g, npc.id)) {
        if (!best || b.confidence > best.conf) best = { id: b.claim, conf: b.confidence };
      }
    }
    if (!best) return null;
    const c = CLAIM[best.id] as { belief?: string[]; conviction?: string[] } | undefined;
    const pool = c?.belief ?? c?.conviction;
    if (!pool?.length) return null;
    this.lastRumourId = best.id;
    const i = Math.floor(this.deps.hub.derive(`rumour-line:${this.deps.day}:${this.passerSeq}`).next() * pool.length);
    return pool[Math.min(i, pool.length - 1)];
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
      person, WALKIN_STYLES[plan.style], null, this.usualOf(memKey), 0,
      plan.from, DEFAULT_PATIENCE_SEC, rng,
    );
    /** Phân biệt người trễ giờ làm (mời cũng không dừng) với người đi chợ về. Rút từ chính dòng số của lượt đi ngang này. */
    const roll = rollPurpose(rng, bandOf(this.nowMin));
    c.driveBase = baseDrives(c.personality);
    /** Đây là chỗ "spam mời khách" chết mà không cần luật chống spam: người vội có `VIEC_RIENG` cao nên cuộc MỜI chấm gần 0. */
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
    // `leaving` ngay từ đầu: mọi chỗ đếm người đang đứng bỏ qua họ mà không cần thêm nhánh `if` nào.
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
          /** ⚠️ Đặt THẲNG vào `react`, không qua `this.react()` — hàm đó rút số của `dialog-shufflebag`, dòng chung cả hệ thoại. */
          if (c.ambient) {
            if (p.stay > 0) c.react.schedule(c.now, 0, null, "PEEK_OVER", p.stay);
            return;
          }
          if (p.nod && (c.npc?.id !== "CHU_KIET" || this.stallRunning)) this.react(c, "FLOURISH", 1, "NOD");
          /*
           * HÀNG XÓM ĐI NGANG CŨNG GỌI MÌNH ĐƯỢC.
           *
           * `smalltalk()` — đường DUY NHẤT dẫn tới `offerTalk()` — mở đầu bằng
           * `if (c.phase !== "waiting") return`, tức chỉ người ĐANG ĐỨNG ĐỢI BÁNH mới tự
           * bắt chuyện. Mà bà Sáu và chú Kiệt `DI_NGANG` **100%**: họ gánh/đẩy xe đi qua,
           * không bao giờ xếp hàng. Cộng với `NPC_ONLY` (người chơi bấm F không ra), 13
           * cuộc của hai người đó KHÔNG CÓ ĐƯỜNG NÀO mở được — kể cả sau khi đã vá thẻ
           * khung cảnh. Đo: `RAO`·`BARTER`·`MOVE_GANH`·`CARRY_GANH` = 0 lần / 16 buổi.
           *
           * Mà mấy cuộc đó viết đúng cho cảnh này: *"Con ơi… tui để gánh xuống đây chút
           * nghen"* là một người đi ngang GỌI mình. Nên cho người CÓ TÊN đang đi ngang
           * dùng chung cửa `offerTalk` — vẫn qua đủ bảy cổng và trần lượt/ngày như mọi
           * người, không có đường riêng.
           */
          if (c.npc && this.offerTalk(c)) return;
          this.queueLines(c, c.plan?.pass?.lines, 0.3);
          if (this.deps.story) onPass(this.deps.story, c.npc?.id ?? null, c.plan?.tag, this.deps.day);
        }
        return;
      }
      /** Gia hạn mỗi frame: `openTalk` chỉ hẹn 4 giây mà đọc hết một cuộc mất 20–30 giây. */
      // `owesLine`: phiên đã đóng nhưng câu đáp còn chưa ra khỏi miệng người ta.
      if (this.talkWith === c || this.owesLine(c)) { p.until = c.now + PASSER_TALK_TAIL; return; }
      /*
       * ĐƯỢC MỜI TỚI MỘT CHỖ KHÁC THÌ PHẢI ĐI TỚI ĐÓ.
       *
       * Lỗi chủ dự án bắt: *"kêu người ta đứng đây cho mát… họ cũng chả thèm chạy lại chỗ
       * cái ô để đứng."* `standInShade` đổi `spot` sang ô hóng mát VÀ đặt `until`, mà nhánh
       * đi bộ phía trên chỉ chạy khi `until < 0` — nên họ đứng nguyên chỗ cũ đếm ngược rồi
       * đi tiếp. Lời mời có hiệu lực trên giấy, không có hiệu lực trên màn hình.
       *
       * `theySit` cũng y vậy với cái ghế.
       */
      if (c.now < p.until) {
        // Chưa tới chỗ được mời thì ĐI TỚI; tới rồi thì đứng cho hết quãng.
        if (!near(c, spot, 0.3)) walk(c, spot, dt, p.speed);
        /*
         * Thử gọi mình SUỐT quãng đứng, không chỉ đúng cái frame vừa tới nơi. Bảy cổng của
         * `offerTalk` phần lớn là chuyện NHẤT THỜI (mình đang bận tay, chưa giãn đủ 100
         * giây, hàng chờ mời đầy) — thử một frame rồi thôi thì gần như luôn trượt.
         */
        if (c.npc) this.offerTalk(c);
        return;
      }
      walk(c, exit, dt, (p.speed ?? 1) * (c.now < c.greetUntil ? GREET_SLOW : 1));
      return;
    }
    /** Khách sinh ra ngay tại `GATE` nên `leave()` lúc spawn là họ biến mất cùng frame. Trả sớm trước `waitSteps()`. */
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

    /** Họ ở NGOÀI hàng nên không nhánh nào kéo họ về chỗ cũ, nhưng vẫn rơi xuống `waitSteps()` — nép lâu quá thì vẫn bỏ về. */
    /** Rời chỗ đứng nhưng KHÔNG rời hàng. ⚠️ Đặt TRƯỚC nhánh `aside`: vừa nép vừa ngồi thì cái ghế thắng. */
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
            c.phase = c.slot === 0 && c.holdLeft <= 0 ? "ordering" : "queueing";
            if (c.phase === "ordering") this.takeOrder(c);
          }
        }
        break;
      case "queueing":
        if (c.slot === 0 && c.holdLeft > 0) { c.holdLeft -= dt; walk(c, SLOTS[0], dt); break; }
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

  /** Kênh THỜI GIAN của riêng từng người. Mốc theo r = đã chờ / sức chờ: 0,6 nhấp nhổm · 1,0 CONFIRMED · 1,6 bỏ đi. */
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
      this.remember(c, "MADE_THEM_WAIT", SALIENCE.MADE_THEM_WAIT);
      c.observations.set(`MADE_THEM_WAIT:${c.id}`, { id: "MADE_THEM_WAIT", slot: "HANDS", certainty: 1, peak: "CONFIRMED", diedAt: null });
      this.deps.bus.emit("perception:stateChanged", { npcId: c.memKey, stimId: "MADE_THEM_WAIT", from: "UNAWARE", to: "CONFIRMED", certainty: 1 });
      this.deps.bus.emit("perception:confirmed", { npcId: c.memKey, stimId: "MADE_THEM_WAIT" });
      this.speakConcept(c, "NOTICE_EVENT", { eventId: "MADE_THEM_WAIT", obsState: "CONFIRMED" }, SALIENCE.MADE_THEM_WAIT);
    }
    if (r >= LEAVE_AT) { this.leave(c, "impatient"); return; }
    this.smalltalk(c);
  }

  /** Một lần mỗi lượt ghé. Rule quyết nói gì; không rule nào khớp thì im — chuyện phiếm không cần lưới an toàn. */
  private smalltalk(c: Customer) {
    if (c.phase !== "waiting" || this.smalltalked.has(c.id)) return;
    if (this.nowSec - c.orderedAt < SMALLTALK_AFTER_SEC) return;
    if (this.queue.length || this.customers.some((x) => x.speaking)) return;
    /** ⚠️ ĐÁNH DẤU SAU: đánh dấu trước thì người bị trượt vì lý do kỹ thuật coi như tiêu xong lượt bắt chuyện của cả lượt ghé. */
    if (this.offerTalk(c)) { this.smalltalked.add(c.id); return; }
    if (!this.interruptible) return;
    this.smalltalked.add(c.id);
    if (this.mentionGossip(c)) return;
    this.speakConcept(c, "SMALLTALK", {}, 45, true);
  }

  /** Ba pool: "nghe {nguồn} nói…" → "nghe nói…" → "biết mà". Dòng `hearsay` LUÔN có tên nguồn — sợi chỉ để lần. */
  private mentionGossip(c: Customer): boolean {
    const g = this.deps.gossip;
    if (!g || !c.npc) return false;
    const day = this.deps.day;
    const cands = activeHeard(g, c.memKey).filter((b) => b.mentionedDay !== day);
    if (!cands.length) return false;
    const b = cands.reduce((a, x) => (x.confidence * x.intensity > a.confidence * a.intensity ? x : a));
    const pool = poolOf(b);
    const lines = CLAIM[b.claim][pool];
    const text = lines[Math.floor(this.dialogRng.next() * lines.length)].replace(/\{source\}/g, b.from ? nameOf(b.from) : "người ta");
    b.mentionedDay = day;
    this.say(c, text, 2, true, 55);
    this.deps.bus.emit("gossip:mentioned", { npcId: c.memKey, claim: b.claim, source: b.from, pool });
    const nb = this.deps.notebook;
    if (nb) { if (b.valence < 0) nb.today.heardBad = true; else nb.today.heardGood = true; }
    return true;
  }

  private rumourMul(id: string, bad: number, good: number) {
    const g = this.deps.gossip;
    if (!g) return 1;
    const net = activeHeard(g, id).reduce((a, b) => a + b.valence * b.confidence, 0);
    return net < -0.2 ? bad : net > 0.2 ? good : 1;
  }

  private takeOrder(c: Customer) {
    if (this.soldOut && c.plan?.tag === "SK-42") {
      this.say(c, "Còn ổ nào không em?", 2, true, 100);
      c.script.push({ at: this.nowSec + 3.4, text: "Dạ. Không sao đâu em." });
      this.leave(c, "soldout");
      return;
    }
    if (this.soldOut) { this.turnAway(c); return; }
    const line = sayOrder(c.order!);
    c.orderLine = line;
    c.orderedAt = this.nowSec;
    this.say(c, line, 2, true, 100);
    if (c.dayMood.cause !== "NONE") this.speakConcept(c, "GREET", { npcMoodCause: c.dayMood.cause }, 60, true);
    else if (c.npc && this.mem(c.memKey).tier === "FRIEND") this.speakConcept(c, "GREET", {}, 50, true);
    this.deps.bus.emit("order:placed", { npcId: c.memKey, spec: c.order, phrasing: line });
    if (this.deps.notebook) {
      logOrder(this.deps.notebook, {
        day: this.deps.day, minute: this.nowMin, npcId: c.npc?.id ?? null, orderText: line, visitCount: this.mem(c.memKey).visits,
      });
    }
    if (!c.order!.intent.usual && sameOrder(c.order!, c.usual)) this.mem(c.memKey).heard++;
    this.queueLines(c, c.plan?.after, 2.6);
    c.plan = c.plan ? { ...c.plan, after: undefined } : null;
  }

  /** Không có sự kiện thứ 12: là `MADE_THEM_WAIT` lý do OUT_OF_STOCK, cường độ theo số lần ghé — khách ruột nhớ nặng nhất. */
  private turnAway(c: Customer) {
    this.soldOutCount++;
    this.speakConcept(c, "FAREWELL", { leaveReason: "SOLD_OUT" }, 80, true);
    if (c.npc) {
      const streak = Math.min(this.mem(c.memKey).visits, 20);
      this.remember(c, "MADE_THEM_WAIT", 55 * (1 + (0.5 * streak) / 10));
    }
    this.react(c, "MADE_THEM_WAIT", 2);
    this.leave(c, "soldout");
  }

  /** KHÔNG PHẢI AI CŨNG NÓI — chào đủ mỗi khách mỗi lượt thì thành tiếng chuông cửa. Bốn van đều có sẵn. */
  private farewell(c: Customer) {
    const outcome = this.serveOutcome.get(c.id) ?? "CLEAN";
    this.serveOutcome.delete(c.id);
    if (!this.barks.speaks(c.memKey)) {
      this.deps.bus.emit("dialog:silent", { npcId: c.memKey, reason: "RATE_35" });
      return;
    }
    this.speakConcept(c, "FAREWELL", { leaveReason: "SERVED", serveOutcome: outcome }, 55, true, {}, FAREWELL_DELAY);
  }

  lanLeft = false;

  private leave(c: Customer, reason: LeaveReason) {
    const pledge = this.pledges.get(c.id);
    if (reason !== "served" && pledge?.promised.length) {
      this.remember(c, "BROKEN_PROMISE", PROMISE_BROKEN);
      pledge.promised = [];
    }
    this.pledges.delete(c.id);
    this.habitSettled.delete(c.id);
    this.hollowShown.delete(c.id);
    if (reason !== "served") this.serveOutcome.delete(c.id);
    const pending = this.offerFor(c);
    if (pending) { this.applyIgnore(c, pending.talk); this.offers.splice(this.offers.indexOf(pending), 1); }
    this.heldTalk.delete(c.id);
    this.talkedThisVisit.delete(c.id);
    this.passerTalks.delete(c.id);
    if (this.talkWith === c) this.endTalk();
    if (c.plan?.tag === "SK-42") this.lanLeft = true;
    if (reason !== "served" && this.deps.story) onUnserved(this.deps.story, c.npc?.id ?? null, c.plan?.tag, !!c.plan?.barter);
    c.phase = "leaving";
    c.leaveReason = reason;
    c.slot = -1;
    c.aside = false;
    c.asideFor = null;
    c.zone = "SEATED_FAR";
    if (reason === "served") { this.servedCount++; this.farewell(c); }
    if (!this.viaSettled && (reason === "impatient" || reason === "soldout" || reason === "soiled")) { this.opening.walkedAway = true; this.settleVia(); }
    /** Một người chơi ĐỂ MẤT: vào thẳng `lostCount` và `lost` của sổ tay — khác hẳn nhánh `balked` ngay dưới. */
    if (reason === "soiled") {
      this.lostCount++;
      if (this.deps.notebook) this.deps.notebook.today.lost++;
      this.speakConcept(c, "FAREWELL", { leaveReason: "SOILED_FOOD" }, 92);
      this.out.push({ kind: "log", text: `${this.label(c)} không nhận ổ bánh — thấy nó rớt xuống đất rồi.` });
    }
    if (reason === "impatient") {
      this.lostCount++;
      if (this.deps.notebook) this.deps.notebook.today.lost++;
      this.speakConcept(c, "FAREWELL", { leaveReason: "IMPATIENT" }, 80);
      this.out.push({ kind: "log", text: `${this.label(c)} bỏ đi — chờ lâu quá.` });
    }
    /**
     * KHÔNG `remember()` (người bán không làm gì sai, mà `remember()` còn gọi `witness()`) và KHÔNG
     * tính vào `lost` (hàng dài là hệ quả của bán được). Giá nằm ở chỗ khác: một ổ không bán được,
     * `m.visits` không nhích, và tối nay `nightly()` tính một lần LỠ.
     */
    if (reason === "balked") {
      this.balkedCount++;
      this.speakConcept(c, "FAREWELL", { leaveReason: "BALKED" }, 80);
      this.out.push({ kind: "log", text: `${this.label(c)} ngó hàng rồi quay về — đông quá.` });
    }
    this.talks.release(this.talkKey(c));
    this.speaker.sync(this.nowSec);
    this.deps.bus.emit("npc:left", { npcId: c.memKey, visitId: c.id, reason: LEAVE_REASON[reason] });
  }

  // ──────────────────────────── sự thật thế giới mà nội dung đọc (P2-09 §2.3)

  /** ⚠️ Đặt ở đây, mỗi frame, MỘT chỗ — một sự thật được ghi từ bốn chỗ là một sự thật sớm muộn gì cũng lệch. */
  private tickWorldFacts() {
    /** Bắt đúng lúc `ovenBusy` chuyển CÓ Ổ → TRỐNG. Scene đã gửi `ovenBusy` mỗi frame rồi, thêm đường thứ hai là thêm chỗ lệch. */
    if (this.wasOvenBusy && !this.ovenBusy) this.lastBatchOutAt = this.nowSec;
    this.wasOvenBusy = this.ovenBusy;

    /** Thứ tự mảng `customers` LÀ thứ tự người ta tới. Chỉ tính người đang thật sự xếp hàng. */
    const queue = this.customers.filter((c) => this.inQueue(c) && !c.aside);
    for (let i = 0; i < queue.length; i++) {
      const c = queue[i];
      if (!c.cutLine) c.cutLine = queue.slice(0, i).some((before) => before.arrivedSeq > c.arrivedSeq);
      /** Người đã nhận bánh mà còn đứng đó, hoặc người đầu hàng chưa chịu gọi. ⚠️ `arriving` KHÔNG tính — đó là người đang BƯỚC TỚI. */
      const served = c.leaveReason === "served" || this.serveOutcome.has(c.id);
      c.blocking = c.slot === 0 && queue.length > 1 && (served || c.phase === "queueing");
    }
    for (const c of this.customers) if (!queue.includes(c)) { c.cutLine = false; c.blocking = false; }
    /** Đã thử gán rồi bỏ: chỗ họ dừng ngó cách chỗ đưa hàng trọn một làn, gán vào thì câu "xích qua chút" lúc nào cũng bày ra được. */

    /** Một chỗ một người. Đây là lý do `w.shadeFree` là sự thật ĐỘNG: người khác chiếm mất giữa lúc mình đang đọc thẻ. */
    this.shadeFree = this.customers.filter((c) => c.inShade).length < SHADE_CAPACITY;
    /** Kiểm thiết bị ở ĐÂY, không ở nội dung: `needEquip` chỉ ẩn nút, còn act thì vẫn chạy. */
    /** Bà tới thì gánh nằm ngoài mặt tiền, bà về thì gánh đi theo — không có gánh mồ côi. */
    /** Cái gánh và cái xe là chuyện CẢ NGÀY, không phải chuyện một lượt ghé — nên chúng sống ở `Service`, không ở `Customer`. */
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

  /** Ba nấc: nhắc → nói nặng → bỏ đi. Không có hạn thì một lời hứa cũng là free word, chỉ tinh vi hơn. */
  private tickDeeds() {
    for (let i = this.deeds.length - 1; i >= 0; i--) {
      const d = this.deeds[i];
      const c = d.c;
      if (c.phase === "leaving" && !c.pass) { this.deeds.splice(i, 1); continue; }
      /** Người lạ không có trí nhớ để mà nhắc, nên với họ lời hứa gãy là đi luôn. */
      const first = c.npc ? (c.personality.nongTinh >= 0.8 ? 1 : 0) : 2;
      const stage = DEED_STAGES.findIndex((m, k) => k >= first && c.now >= d.dueAt + (m - 1) * d.deed.dueSec);
      if (stage < 0 || stage < d.nudged) continue;
      d.nudged = stage + 1;
      const step = d.deed.onBroken?.[stage];
      if (stage === 0) {
        this.say(c, `${DEED_LABEL[d.deed.what] ?? "Cái hồi nãy"}… sao rồi {you}?`, 2, true, 70);
        this.applyTalkOption(c, step ?? { rel: -1 }, "mình chưa làm cái vừa hứa");
      } else if (stage === 1) {
        this.say(c, "Thôi khỏi. Nói vậy chớ có làm đâu.", 2, true, 85);
        this.applyTalkOption(c, step ?? { rel: -3, anger: 25, mem: { kind: "BROKEN_PROMISE", intensity: 45 } }, "mình nuốt lời");
      } else {
        this.applyTalkOption(c, step ?? { rel: -4, mem: { kind: "BROKEN_PROMISE", intensity: 60 } }, "mình nuốt lời, người ta bỏ đi");
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
      // Ngồi hay nép đều ở NGOÀI vòng cấp chỗ: `i` không tăng nên cả hàng sau dồn lên thật.
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

  // ────────────────────────────────────────────────── bước 5 · lịch nói

  /**
   * Trễ 0,2–0,4 s, tối đa 1 câu MỚI mỗi frame, tối đa 2 bong bóng; người đứng trước quầy nói trước.
   * `wait` cộng vào quãng trễ cho câu phải đứng sau một câu khác của CHÍNH người đó, và hạn đếm từ
   * lúc hết trễ nên nó không ăn mất cửa sổ nói.
   */
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
    if (has(this.deps.equip, "LO_GAS")) q.set("equipGasOven", true);

    const m = this.mem(c.memKey);
    const p = c.personality;
    q.set("npcId", c.npc ? c.npc.id : "KHACH_VANG_LAI");
    q.set("npcSoi", Math.round(p.soi * 100));
    q.set("npcNongTinh", Math.round(p.nongTinh * 100));
    q.set("npcDeTha", Math.round(p.deTha * 100));
    q.set("npcThanThien", Math.round(p.thanThien * 100));
    q.set("npcRelTier", m.tier);
    q.set("npcVisitCount", m.visits);
    q.set("npcIsFirstVisit", m.visits <= 1);
    q.set("npcKnowsUsual", this.canAskUsual(c.npc, m));
    q.set("npcSlot", Math.max(0, c.slot));
    q.set("npcGazeState", c.gazeState);
    q.set("npcMood", c.dayMood.value);
    q.set("npcMoodCause", c.dayMood.cause);
    for (const k in extra) q.set(k, extra[k]);
    return q;
  }

  /** Không rule nào khớp = im lặng (hợp lệ). `concept` luôn là chuỗi literal để validator dò được. */
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
    /** Thứ tự ƯU TIÊN khi câu ghép dài quá: vế CHÊ ở lại, vế CẢM ƠN rụng trước. */
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
    // ⚠️ Sàn này đứng TRƯỚC cả trần cứng: câu đang hiện phải kịp ĐƯỢC THẤY đã. Để trần lên
    // trước thì một câu đã đợi quá 3 s được quyền đè bất cứ lúc nào — kể cả đè lên một câu
    // vừa mới hiện ra ở frame trước.
    if (c.saidFor < BARGE_IN_SEC * slow) return true;
    if (p.held >= HOLD_MAX_SEC * slow) return false;
    return p.pri - c.sayPri < BARGE_IN_PRI;
  }

  tickDialog(dt: number) {
    if (this.followups.length) this.runFollowups();
    if (!this.queue.length) return;
    for (const p of this.queue) {
      if (p.delay > 0) { p.delay -= dt; continue; }
      // Hai đồng hồ KHÁC NHAU: `waited` đo quãng câu này nằm ế vì cả hẻm đang ồn (quá hạn
      // thì BỎ), `held` đo quãng nó xếp sau CHÍNH người nói ra nó (quá trần thì CHEN LÊN,
      // không bỏ). Gộp hai cái vào một là câu thứ hai của mọi người đều chết.
      if (this.speechBlocked(p)) p.held += dt;
      else p.waited += dt;
    }
    for (let i = this.queue.length - 1; i >= 0; i--) {
      const p = this.queue[i];
      const gone = !this.customers.includes(p.c);
      /** Hạn phải CO THEO tuổi thọ bong bóng: `readMul` nhân tới 1,875, nên một hạn cứng làm càng bật trợ năng cái hẻm càng CÂM. */
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
      /**
       * ⚠️ Cái gác phải nhìn thấy CHÍNH người sắp nói, không chỉ người khác — thiếu nó thì `speak()`
       * ghi đè lên `c.say` và câu trước biến mất sau một frame, kể cả CÂU GỌI MÓN.
       */
      if (this.speechBlocked(p)) { this.dialogDeferred++; continue; }
      const others = this.customers.filter((x) => x.speaking && x !== p.c).length;
      if (others >= MAX_BUBBLES) { this.dialogDeferred++; break; }
      this.queue.splice(this.queue.indexOf(p), 1);
      const slow = this.deps.readMul ?? 1;
      p.c.speak(p.text, p.offer ? offerBubbleLife(p.text, slow) : bubbleLife(p.text, slow), p.pri);
      released++;
      if (p.rule) {
        this.speaker.spoken(p.rule, p.c.memKey, this.nowSec);
        if (p.rule.concept.startsWith("SMALLTALK") && p.c.npc && this.deps.notebook) {
          logNote(this.deps.notebook, this.deps.day, this.nowMin, p.c.npc.id, { t: "SAID_SOMETHING", text: p.text });
        }
        if (p.rule.applycontext.some((a) => a.name === "ctxNhacQuayDo")) this.dirtRemarked = true;
        const f = p.rule.followup;
        if (f) this.followups.push({ c: p.c, concept: f.concept, at: this.nowSec + bubbleLife(p.text, slow) + f.delaySec });
      }
      this.deps.bus.emit("dialog:spoken", { npcId: p.c.memKey, text: p.text, tier: p.tier });
      if (p.log) this.out.push({ kind: "log", text: `${this.label(p.c)}: ${p.text}` });
    }
  }

  // ──────────────────────────────────────────────────────────────── giao bánh

  /** Mỗi lỗi tra ĐÚNG khoá của nó: thấy lúc làm → ANTICIPATED, không thấy → DISCOVERED. Không bao giờ trừ tiền bánh. */
  serveDish(
    dish: Ingredient[],
    opts: { cold?: boolean; crust?: number; quality?: number; readyAt?: number; soiled?: boolean; burnAt?: number } = {},
  ): ServeResult {
    const c = this.front;
    if (!c || c.phase !== "waiting") return { ok: false, reason: "chưa có ai chờ lấy bánh" };
    const bus = this.deps.bus;
    const relBefore = this.relNow(c);
    this.relNote = null;

    /** Chặn ở ĐẦU hàm, trước cả `diffDish`. Mốc NOTICED chứ không CONFIRMED — liếc thấy là đủ để không ăn. */
    if (opts.soiled && rank(peakOf(c, "DROPPED_FOOD")) >= rank("NOTICED")) {
      this.remember(c, "DROPPED_FOOD", SOILED_CAUGHT);
      this.noteRel("đồ ăn rơi xuống đất", SOILED_CAUGHT);
      this.react(c, "DROPPED_FOOD", 3);
      this.settleRelMoved(c, relBefore);
      this.leave(c, "soiled");
      return { ok: false, reason: SOILED_REFUSE_TOAST };
    }
    const grit = !!opts.soiled;

    /** Chặn TRƯỚC `nameCheck` và `diffDish`: lượt giao này không xảy ra. Đọc `levels` GỐC chứ không khẩu vị ẩn. */
    const hollow = isHollowLoaf(c.order!, dish);
    if (hollow && !takesHollowLoaf(c.personality)) {
      if (!this.hollowShown.has(c.id)) {
        this.hollowShown.add(c.id);
        const mon = hollowWantLabel(c.order!);
        this.remember(c, "ORDER_DEFECT", HOLLOW_REFUSED, { missingIngredient: mon });
        this.noteRel("đưa ổ chưa có nhân", HOLLOW_REFUSED);
        this.react(c, "ORDER_DEFECT", 2);
        this.speakConcept(c, "HOLLOW_LOAF", { dishRefused: true }, 92, true, { mon });
        this.settleRelMoved(c, relBefore);
      }
      return { ok: false, reason: HOLLOW_REFUSE_TOAST };
    }

    const nb = this.deps.notebook;
    if (nb && c.npc && nameCheck(nb, c.npc.id) === false) {
      this.remember(c, "WRONG_NAME", SALIENCE.WRONG_NAME, { wrongNameUsed: nb.pages[c.npc.id].name });
      this.noteRel("gọi sai tên", SALIENCE.WRONG_NAME);
      this.react(c, "WRONG_NAME", 3);
      this.speakConcept(c, "NOTICE_EVENT", { eventId: "WRONG_NAME", obsState: "CONFIRMED" }, 95, true);
      this.emitStim("WRONG_NAME", { target: c.id });
    }

    let raw = diffDish(c.order!, dish);
    let viaAlt = false;
    const alt = c.order!.alt;
    if (raw.length && alt) {
      const r2 = diffDish({ ...c.order!, levels: { ...c.order!.levels, ...alt } }, dish);
      if (!r2.length) { raw = r2; viaAlt = true; }
    }
    if (opts.cold) raw.push(mkDefect("WRONG_TEMP", null));
    /** HAI đầu của vòng độ giòn, cùng một luật: rút sớm quá thì chưa giòn, trễ quá thì sém cạnh. */
    const burnAt = opts.burnAt ?? CRUST.BURNT;
    const band = opts.crust === undefined ? null : bandOfCrust(opts.crust, burnAt);
    const crustLow = band === "RAW";
    const crustSinged = band === "SINGED";
    if (crustLow) raw.push(underdoneDefect(opts.crust!));
    else if (crustSinged) raw.push(singedDefect(opts.crust!, burnAt));
    if (opts.quality !== undefined && 1 - opts.quality >= tasteThreshold(c.personality.soi)) raw.push(mkDefect("TASTE_OFF", null));
    const defects: DiffedDefect[] = raw.map((d) => {
      const key = d.kind === "WRONG_TEMP" || d.kind === "STUFFED" || d.kind === "TASTE_OFF" ? null : orderDefectKey(c.id, d.kind, d.item);
      const seen = key ? rank(peakOfKey(c, key)) >= rank("NOTICED") : false;
      return { ...d, key, witness: seen ? "ANTICIPATED" : "DISCOVERED" };
    });
    bus.emit("order:delivered", { npcId: c.memKey, dish: [...dish], waitedSec: this.nowSec - c.orderedAt });

    /** Lỗi VỎ BÁNH không bao giờ là câu chính khi trong ổ còn lỗi khác — nó thành vế bổ sung. */
    const crustDefect = defects.find(isCrustDefect) ?? null;
    const others = crustDefect ? defects.filter((d) => d !== crustDefect) : defects;
    const spoken = this.pickSpoken(others.length ? others : defects);
    /** Vỏ bánh có lỗi mà câu chính đang nói chuyện khác → vế bổ sung. */
    const crustTail = crustDefect && spoken !== crustDefect ? crustDefect : null;
    /** CHO THÊM trên ổ CÓ LỖI vẫn phải được nói ra, dù điểm thì không (`freeExtra` vẫn chặn). */
    const extraMons = extraPortions(c.order!, dish).map(labelOf);
    const gaveExtra = extraMons.length > 0;
    /** Bỏ thêm miếng đồ chua mà không ai nói gì thì người chơi không biết mình vừa cho. */
    const playerSay = gaveExtra
      ? this.fill(c, this.barks.take("extraOffer", c.memKey, { mon: monVi(extraMons) }))
      : undefined;
    let positive = 0;
    let tb = false;
    /** Chỉ đụng trên ổ KHÔNG LỖI, một lần mỗi lượt ghé: trên ổ làm trật thì không ai đọc ra được cái thiếu tặng kèm. */
    let habitBroke = 0;
    if (defects.length === 0) {
      tb = !!c.npc && opts.readyAt !== undefined && opts.readyAt <= c.orderedAt && sameOrder(c.order!, c.usual);
      const remembered = c.order!.intent.usual || tb;
      if (tb && this.deps.story) moment(this.deps.story, "NHU_MOI_BUA");
      if (remembered) {
        positive += tb ? REMEMBERED_USUAL_TB : REMEMBERED_USUAL_TA;
        this.emitStim("REMEMBERED_USUAL", { salience: tb ? REMEMBERED_USUAL_TB : REMEMBERED_USUAL_TA, target: c.id });
      }
      const extra = this.freeExtra(c, dish);
      positive += extra;
      positive += this.settlePledge(c, dish);
      habitBroke = this.settleExtraHabit(c, extra);
      positive -= habitBroke;
      this.speakConcept(c, "DELIVERY", {
        defectCount: 0, orderIsUsual: remembered, freeExtraTooMuch: extra < 0, extraHabitBroken: habitBroke > 0,
        freeExtraGiven: gaveExtra,
      }, habitBroke > 0 || extra < 0 ? 70 : 60, true);
    } else if (hollow) {
      // Người cầm cho xong vẫn phải NÓI RA chuyện ổ bánh không có gì trong đó, và nói
      // bằng câu của chính chuyện đó — không phải câu "ủa thiếu pate" của một ổ thiếu
      // một thứ. Xem khối `HOLLOW_REFUSED`.
      positive += this.settlePledge(c, dish);
      this.speakConcept(c, "HOLLOW_LOAF", { dishRefused: false }, 90, true, { mon: hollowWantLabel(c.order!) });
    } else if (spoken) {
      positive += this.settlePledge(c, dish);
      /** ⚠️ CHỈ đặt khi chính lỗi vỏ bánh là câu chính — đặt luôn thì mọi câu khác cũng kéo theo rule vỏ bánh. */
      this.speakConcept(c, "DELIVERY", {
        defectCount: defects.length, defectKind: kindOf(spoken), defectWasSeen: spoken.witness === "ANTICIPATED",
        orderIsUsual: c.order!.intent.usual, freeExtraGiven: gaveExtra,
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

    let worst = 0;
    if (defects.length) {
      worst = defects.reduce((a, d) => Math.max(a, (d.witness === "DISCOVERED" ? d.sEat : d.sCounter) * d.magnitude), 0);
      this.remember(c, "ORDER_DEFECT", worst, { missingIngredient: (spoken ?? defects[0]).label });
      this.noteRel(defectNote(spoken ?? defects[0]), worst);
    } else if (tb) { this.remember(c, "REMEMBERED_USUAL", REMEMBERED_USUAL_TB); this.noteRel("nhớ món quen", REMEMBERED_USUAL_TB); }
    else if (c.order!.intent.usual) { this.remember(c, "REMEMBERED_USUAL", REMEMBERED_USUAL_TA); this.noteRel("nhớ món quen", REMEMBERED_USUAL_TA); }
    // Cắn phải sạn. Ghi NGAY lúc đưa chứ không đợi họ cắn: `record` là sổ của hệ, không
    // phải của người — họ sẽ biết trong vài phút nữa, và `farewell` mới là lúc họ nói ra.
    // Cùng kind `DROPPED_FOOD` với nhánh bị bắt: lần thứ hai với cùng một người là cộng dồn.
    if (grit) { this.remember(c, "DROPPED_FOOD", SOILED_GRIT); this.noteRel("nhai phải sạn", SOILED_GRIT); }
    if (c.npc) {
      const m = this.mem(c.memKey);
      m.lastServedDay = this.deps.day;
      if (nb) {
        const t = nb.today;
        (t.served_[c.npc.id] ??= []).push({ minute: this.nowMin, dish: [...dish] });
        if (!defects.length && c.order!.intent.usual) t.usualServed.push(c.npc.id);
        // `!grit`: ổ có sạn không phải "ổ sạch" — ghi gian vào sổ là hỏng cả bài suy luận.
        if (!defects.length && !grit && ![...c.observations.values()].some((o) => o.peak === "CONFIRMED")) t.cleanServedFront.push(c.npc.id);
      }
      const sawBad = [...c.observations.values()].some((o) => o.peak === "CONFIRMED");
      // Cái giá THẬT của nhánh "không ai thấy": lượt này mất tư cách một lượt bán sạch —
      // không `servedWell` (quan hệ không nhích lên), và không `disprove` (tin đồn "bên đó
      // bánh rớt" lẽ ra nhạt đi sau một ổ đàng hoàng thì nay giữ nguyên).
      if (!defects.length && !sawBad && !grit) {
        servedWell(m, c.personality, clamp01(1 - silentScore / 120), isSilentGrudge(c.personality));
        if (this.deps.gossip) disprove(this.deps.gossip, c.memKey, ["ORDER_DEFECT", "DROPPED_FOOD", "DIRTY_HANDS", "BURNT_OR_COLD"], this.deps.day);
      }
    }

    if (c.npc && !defects.length && has(this.deps.equip, "THOT_RIENG") && c.personality.soi >= 0.8) {
      const m = this.mem(c.memKey);
      m.seen ??= {};
      if (!m.seen.thotRieng) {
        m.seen.thotRieng = this.deps.day;
        this.remember(c, "CARED_FOR_THEM", 50);
        this.noteRel("làm ăn sạch sẽ", 50);
        this.say(c, "Con này làm ăn sạch sẽ à nghen.", 2, true, 55);
      }
    }

    // Kênh 1+2 lúc nhận bánh: lỗi → mặt "sai món" (nặng nhẹ theo lỗi, xem DEFECT_FACE_I3);
    // nếp "cho thêm" vừa gãy → vẫn nhận bánh (dáng HAND_OUT) nhưng mặt sượng một nhịp;
    // còn lại → tích cực (nhớ đơn thì nặng hơn).
    if (defects.length) this.react(c, "ORDER_DEFECT", worst >= DEFECT_FACE_I3 ? 3 : 2);
    else if (habitBroke > 0) this.react(c, "ORDER_DEFECT", 1, "HAND_OUT");
    else this.react(c, c.order!.intent.usual ? "REMEMBERED_USUAL" : "FREE_EXTRA", c.order!.intent.usual ? 3 : 2, "HAND_OUT");

    const tip = Math.round(this.tipOf(c, silentScore, positive) * moodTipMul(c.dayMood) * this.rumourMul(c.memKey, 0.8, 1.2) / 1000) * 1000;
    if (c.plan?.barter) {
      this.out.push({ kind: "log", text: `${this.label(c)} đổi một chén tàu hũ lấy ổ bánh.` });
      this.noteOpening({ complained: false, paidExact: true, smiled: true, noChange: false, friend: true });
    } else {
      if (hollow) this.out.push({ kind: "log", text: `${this.label(c)} cầm ổ chưa có nhân — tính tiền bánh mì không.` });
      this.settlePayment(c, this.pricedAfterPledge(c, loafPriceVnd(hollow ? "khong" : tierOf(c.order!.intent))), tip, !!spoken);
    }
    if (nb) nb.today.served++;
    // Một ổ = một dòng. Phát ở ĐÂY chứ không sau `leave()`: tiền đã tính xong (chạy qua cô
    // Mai đổi lẻ cũng là một MADE_THEM_WAIT), còn ổ thứ hai của cùng người thì tính riêng —
    // người chơi bỏ thêm đồ chua vô ổ thứ hai phải đọc được dòng của ổ thứ hai.
    this.settleRelMoved(c, relBefore);
    // GRIT đứng TRƯỚC DEFECT — xem `ServeOutcome`.
    this.serveOutcome.set(c.id, grit ? "GRIT" : defects.length ? "DEFECT" : c.waitStage >= 2 ? "WAITED" : "CLEAN");
    if (this.deps.story) {
      const ok = defects.length === 0;
      const r = onServed(this.deps.story, {
        npcId: c.npc?.id ?? null, tag: c.plan?.tag, day: this.deps.day, ok, order: c.order!, dish: [...dish], viaAlt,
        crustOk: (opts.crust ?? CRUST.READY) >= CRUST.READY, atMin: this.nowMin, barter: !!c.plan?.barter,
      });
      this.queueLines(c, [...(ok ? c.plan?.served?.ok ?? [] : []), ...(c.plan?.served?.any ?? [])], 1.2);
      for (const s of r.say) c.script.push({ at: this.nowSec + (s.delay ?? 1.2), text: s.text, by: s.by && s.by !== c.memKey ? s.by : undefined });
      if (viaAlt && c.npc?.id === "CHU_TU") this.react(c, "FLOURISH", 1, "NOD");
      c.plan = c.plan ? { ...c.plan, served: undefined } : null;
    }
    const next = this.soldOut ? undefined : c.more.shift();
    if (next) {
      c.order = next;
      c.phase = "waiting";
      c.waitSec = 0;
      c.waitStage = 0;
      c.orderLine = sayOrder(next);
      c.orderedAt = this.nowSec;
      this.say(c, c.orderLine, 2, true, 100);
      this.deps.bus.emit("order:placed", { npcId: c.memKey, spec: next, phrasing: c.orderLine });
      if (nb) logOrder(nb, { day: this.deps.day, minute: this.nowMin, npcId: c.npc?.id ?? null, orderText: c.orderLine, visitCount: this.mem(c.memKey).visits });
      return { ok: true, playerSay };
    }
    c.carrying = true;
    const sawHygiene = [...c.observations.values()].some((o) => o.peak === "CONFIRMED"
      && (o.id === "DROPPED_FOOD" || o.id === "DIRTY_HANDS" || o.id === "BURNT_OR_COLD"));
    if (c.personality.soi >= 0.7 && c.personality.nongTinh <= 0.3 && (sawHygiene || (isSilentGrudge(c.personality) && defects.length > 0))) {
      c.binDetour = true;
    }
    this.leave(c, "served");
    return { ok: true, playerSay };
  }

  /**
   * ⚠️ Túi im lặng 7/20 ĐÃ BỎ khỏi đây (và `force` theo đó bỏ luôn): giao bánh là khoảnh khắc DUY
   * NHẤT người chơi đọc được mình vừa làm trật chỗ nào, mà im thì họ chỉ thấy tiền boa hụt không
   * biết vì sao. Hình phạt vẫn nằm nguyên ở boa và ở trí nhớ.
   *
   * Túi vẫn sống ở mấy chỗ khác của nó; im lặng CÓ CHỦ Ý (`silent` của chị Lan / anh Bảo) chặn ở
   * `speakConcept`, sau chỗ này — đó là tính cách, không phải một cú roll.
   */
  private pickSpoken(defects: DiffedDefect[]): DiffedDefect | null {
    if (!defects.length) return null;
    const score = (d: DiffedDefect) => (d.witness === "DISCOVERED" ? d.sEat : d.sCounter) * d.magnitude;
    const sorted = [...defects].sort((a, b) => score(b) - score(a));
    let top = sorted[0];
    const ant = sorted.find((d) => d.witness === "ANTICIPATED");
    if (ant && score(top) - score(ant) < 15) top = ant;
    return top;
  }

  /**
   * Tên món điền vào `{mon}`. Nhiều món CÙNG MỘT LỖI thì gom hết vào một câu ("thiếu đồ chua với
   * ớt") — nói một món rồi im là người chơi sửa đúng một món và lần sau nghe chê tiếp. Chỉ gom
   * trong cùng một `kindOf`: "thiếu pate" với "nhiều ớt quá" là hai câu khác nhau.
   */
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

  /** Tiền boa là thứ DUY NHẤT chất lượng đụng tới, và nó không hiện ra thành chỉ số nào (T3). */
  private tipOf(c: Customer, silentScore: number, positive: number) {
    const tier = this.mem(c.memKey).tier;
    const q = clamp01(1 - silentScore / 120) ** 1.6;
    const p = clamp01(positive / 100);
    const generosity = 0.6 + 0.8 * c.personality.thanThien;
    const strictness = 1 - 0.5 * c.personality.soi * (1 - q);
    const t = PRICE_BANH * TIP_RATE[tier] * q * (1 + 0.45 * p) * generosity * strictness;
    return Math.max(0, Math.round(t / 1000) * 1000);
  }

  /** Nhỏ dần trong NGÀY; người soi ≥ 0,7 tới lần thứ 3 là thấy mình đang bị mua chuộc → phản tác dụng. */
  private freeExtra(c: Customer, dish: Ingredient[]) {
    if (generosityOf(c.order!, dish) <= 0) return 0;
    const n = (this.freeExtraToday.get(c.memKey) ?? 0) + 1;
    this.freeExtraToday.set(c.memKey, n);
    this.mem(c.memKey).freebies++;
    if (n >= 3 && c.personality.soi >= 0.7) return -FREE_EXTRA_BASE;
    const mul = FREE_EXTRA_DIMINISH[Math.min(n - 1, FREE_EXTRA_DIMINISH.length - 1)];
    this.emitStim("FREE_EXTRA", { salience: FREE_EXTRA_BASE * mul });
    this.remember(c, "FREE_EXTRA", FREE_EXTRA_BASE * mul);
    const lbl = extraLabel(c.order!, dish);
    this.noteRel(lbl ? `cho thêm ${lbl}` : "cho thêm chút đỉnh", FREE_EXTRA_BASE * mul);
    return FREE_EXTRA_BASE * mul;
  }

  /** Đếm theo LƯỢT GHÉ chứ không theo ngày — không ai trong mười hai người ghé đủ bốn mươi bữa. */
  private settleExtraHabit(c: Customer, extra: number): number {
    if (!c.npc || this.habitSettled.has(c.id)) return 0;
    this.habitSettled.add(c.id);
    const missed = extraHabit(this.mem(c.memKey), extra > 0 ? "GAVE" : extra < 0 ? "REFUSED" : "NONE");
    if (missed <= 0) return 0;
    this.remember(c, "MISSED_EXTRA", missed);
    this.noteRel("mấy bữa có, bữa nay không", missed);
    return missed;
  }

  /**
   * Vừa là chăm sóc vừa là công cụ hạ attention, nên cũng là công cụ dễ phá game nhất. Các khoá:
   * khách còn cầm ly · cooldown 45 s · `CARED_FOR_THEM` nhỏ dần theo NGÀY · trần theo `soi`
   * (`teaSuspectAtCup`), bắt bài rồi thì thôi CẢ MÙA · trà tốn tiền, hạn 18 ly/ngày.
   */
  serveTea(): ServeResult {
    const c = this.front;
    if (!c || c.phase === "leaving") return { ok: false, reason: "chưa có ai để mời" };
    if (c.holdingTea) return { ok: false, reason: `${this.label(c)} còn cầm ly kia` };
    if (this.teaSuspect(c)) return this.refuseTea(c);
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
    if (this.deps.story) {
      const r = onTea(this.deps.story, c.npc?.id ?? null, this.deps.day, { tag: c.plan?.tag, holding: c.holdLeft > 0 });
      for (const s of r.say) c.script.push({ at: this.nowSec + (s.delay ?? 1), text: s.text, by: s.by && s.by !== c.memKey ? s.by : undefined });
      if (r.say.length && c.holdLeft > 0) c.holdLeft = Math.min(c.holdLeft, 6);
    }
    /** Thưởng trả Ở ĐÂY, lúc ly trà tới tay — trả lúc hứa thì cách chơi tối ưu là hứa rồi quên. */
    c.visit.gaveTea = true;
    this.keepDeed(c, "ROT_TRA");
    const mul = c.takeTea(cup);
    if (mul > 0) {
      this.speakConcept(c, "INTERACT", { interaction: "TEA" }, 40, true);
      this.emitStim("CARED_FOR_THEM", { salience: SALIENCE.CARED_FOR_THEM * mul, target: c.id });
      this.remember(c, "CARED_FOR_THEM", SALIENCE.CARED_FOR_THEM * mul);
      this.deps.bus.emit("attention:toolUsed", { tool: "TRA_DA", npcId: c.memKey, durationSec: TEA.sipDelay + 2.5 });
    } else {
      this.speakConcept(c, "INTERACT", { interaction: "TEA_NOD" }, 20);
    }
    return { ok: true };
  }

  /** Sống trong TRÍ NHỚ nên qua được lượt ghé sau, qua đêm và qua save. ⚠️ Khách vãng lai dùng chung `memKey` theo dáng. */
  private teaSuspect(c: Customer) {
    return !!this.mem(c.memKey).seen?.teaSuspect;
  }

  /** KHÔNG tốn ly nào, nhưng cũng không được chỉ là một dòng log: khách nói câu của mình và đổi mặt. */
  private refuseTea(c: Customer): { ok: false; reason: string } {
    this.speakConcept(c, "INTERACT", { interaction: "TEA_SUSPECT" }, 70, true);
    this.react(c, "CARED_FOR_THEM", 2, undefined, "NAME");
    return { ok: false, reason: `${this.label(c)} không nhận nữa` };
  }

  // ──────────────────────────────────────── trò chuyện (P2-06 — flow v2, hai kênh)

  /** Câu hỏi duy nhất chia hai kênh: có người chờ → mình đáp bằng NGUYÊN LIỆU; không → dải lựa chọn mở được. Người đã nhận bánh mà nán lại KHÔNG tính. */
  private someoneWaiting(except: Customer | null = null): boolean {
    return this.customers.some((c) =>
      c !== except && !c.balking && !c.pass
      && (c.phase === "queueing" || c.phase === "ordering" || c.phase === "waiting"));
  }

  /** ⚠️ "Không ai đang chờ" KHÔNG gồm chính người mình đang nói chuyện (`except`) — tính cả họ thì một người đứng chờ bánh không bao giờ mở miệng được. */
  private canOpenDeep(except: Customer | null = null): boolean {
    return !this.someoneWaiting(except)
      && this.deepToday < TALK_DEEP_PER_DAY
      && bandOf(this.nowMin) !== "PEAK";
  }

  /** `FULL` chỉ ở kênh LỜI; `SHORT`/`BARK` nói được cả lúc đang bán nhưng chỉ với người mình đang phục vụ. Luật là NÓI VỚI ĐÚNG NGƯỜI ĐANG ĐỨNG TRƯỚC MẶT. */
  private canRun(t: Talk, c: Customer): boolean {
    const kind = talkKindOf(t);
    /** `inviteChance` đã đo "quán đang vắng" bằng `ahead` rồi — bắt nó qua thêm trần ngày là đánh thuế hai lần. */
    if (kind === "MOI") return !this.someoneWaiting(c);
    /** ⚠️ `countsAgainstDailyCap(t)` ở đây là để 5 cây `FULL` của `walkin.json` lọt qua cổng PEAK. Trần NGÀY thì vẫn chỉ `CHUYEN` tiêu. */
    if (t.depth === "FULL") return this.canOpenDeep(c);
    return !this.someoneWaiting(c) || c === this.front || !!this.offerFor(c);
  }

  /** ⚠️ HỢP ĐỒNG VỚI SCENE: dải mở thì `clock.busy = true`, KHÔNG đóng băng. */
  openTalk(): TalkView | null {
    if (this.talkSession) return this.talkView("");
    const c = this.talkTarget();
    if (!c) return null;
    const key = this.talkKey(c);
    if (c.ambient && (this.passerTalks.get(c.id) ?? 0) >= PASSER_TALKS_MAX) return null;
    const waiting = this.offerFor(c);
    if (!waiting && !this.talks.has(key)) { this.talks.ensure(key); return null; }
    /** Ba cổng theo thứ tự: cuộc họ vừa mở lời → cuộc đang giữ dở → rút mới. */
    /** ⚠️ Giữ vô điều kiện là một cái khoá: cuộc giữ dở hết chạy được vẫn đứng TRƯỚC `pickRunnable`, nên cả kho `ANY` không với tới được. */
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
    /** Đánh dấu ngay lúc mở thì mở rồi bỏ ngang là cuộc đó mất luôn CẢ MÙA. */
    this.talkSession = new TalkSession(talk, c.memKey);
    this.talkWith = c;
    this.holdTalkVoice(c);
    this.talkWarmth = 0;
    this.talkAngered = false;
    this.actReply = null;
    /** Dừng ngay chỗ đang đứng, không đi nốt tới chỗ ngoái nhìn rồi mới quay lại. */
    if (c.ambient && c.pass) {
      c.pass.spot = { x: c.x, y: c.y };
      c.pass.until = c.now + PASSER_TALK_TAIL;
    }
    this.talkEngaged = false;
    this.talkNpcOpened = opened;
    /** `m.remembers` quyết nút nào TỒN TẠI, nên chạy sau là mọi câu nhắc chuyện cũ biến mất ở nhịp đầu rồi hiện ra ở nhịp hai. */
    this.recalled = this.recallFor(c, new Set(talk.about ?? []));
    if (c.now - c.lastAskedAt >= ASK_COOLDOWN) {
      c.ask();
      this.deps.bus.emit("attention:toolUsed", { tool: "ASK_QUESTION", npcId: c.memKey, durationSec: 3 });
    }
    /** ⚠️ KHÔNG phát `talk.opener` ở đường này — `opener` viết cho tình huống NPC tự mở lời, và chỉ còn một đường dùng là `offerTalk`. */
    return this.talkView("", false, undefined);
  }

  /** `hand` và `onStreet` do scene đặt mỗi frame; headless thì tay không, đứng sau quầy. */
  /** Suy ra, không khai — cả bảy khung đã ứng 1–1 với trạng thái hệ đang giữ. Thứ tự duyệt là thứ tự CHẶT DẦN. */
  practiceOf(c: Customer): PracticeId {
    if (c.ambient || c.pass) return "DI_NGANG";
    if (c.phase === "queueing" || c.phase === "arriving") return "XEP_HANG";
    /** Pha `ordering` chỉ chiếm 165/131.221 frame, nên khoá một cuộc vào riêng nó là chôn nó. Cửa thật là "cái đơn còn đang mở". */
    if (c.phase === "ordering") return "GOI_MON";
    if (c.phase === "waiting") return c.waitRatio < ORDER_WINDOW ? "GOI_MON" : "DOI_BANH";
    /** Còn người chờ thì đây là người nán lại giữa lúc mình bận; không ai chờ thì đúng là khoảng vắng. */
    if (c.leaveReason === "served" || this.serveOutcome.has(c.id)) {
      return this.someoneWaiting(c) ? "NAN_LAI" : "QUAY_VANG";
    }
    return "QUAY_VANG";
  }

  /** Gọi MỘT lần lúc mở cuộc, TRƯỚC khi dựng bộ lựa chọn đầu tiên. Người KHÔNG CÓ TÊN không bao giờ nhớ gì — `memKey` của họ dùng chung. */
  private recallFor(c: Customer, about: ReadonlySet<string>): Recalled | null {
    if (!c.npc) return null;
    const hit = retrieve(this.mem(c.memKey), c.personality, this.deps.day, about, 1)[0];
    return hit && worthMentioning(hit) ? hit : null;
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
        /** ⚠️ Không đọc `pass.stay > 0`: đó là cờ KẾ HOẠCH đặt lúc spawn, đúng suốt cả quãng đi. `pass.until >= 0` mới là mốc họ TỚI chỗ ngó. */
        glanced: !!c.pass && c.pass.stay > 0 && c.pass.until >= 0,
        /** Với khách ở quầy là `gazeState === "WATCH"`; với người đi ngang thì `gazeState` không chạy, nên đo bằng quãng dừng ngó. */
        lookingInside: c.pass
          ? c.pass.stay > 0 && c.pass.until >= 0 && c.now < c.pass.until
          : c.gazeState === "WATCH",
        inShade: c.inShade,
        sitting: c.sitting,
        filming: c.filming,
        borrowing: !!this.mem(c.memKey).borrowed,
        onPhone: c.gazeState === "PHONE",
        eating: c.eating,
        hasOrder: !!c.order,
        waitRatio: c.waitRatio,
        purpose: c.purpose?.id ?? null,
        state: c.purposeState?.id ?? null,
        tier: m.tier,
        visits: m.visits,
      },
      convo: {
        tones: this.talkSession?.picked.map((p) => p.tone) ?? [],
        warmth: this.talkWarmth,
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
      season: { remembers: this.recalled !== null },
      hot: !isRain(weatherOf(this.deps.day)) && bandOf(this.nowMin) !== "PRE_OPEN",
      rain: isRain(weatherOf(this.deps.day)),
      peak: bandOf(this.nowMin) === "PEAK",
      queue: this.audience.length,
      shadeFree: this.shadeFree,
      seatFree: this.seatFree,
      ganhOut: this.ganh === "NGOAI",
      coats: this.coats,
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
    /** `need` ẩn lựa chọn, `while` thì không: vừa nãy câu đó còn đúng nên người chơi có lý do chính đáng để bấm. */
    const pending = s.peek(i, this.talkGate());
    if (pending?.while?.length) {
      const w = this.snapshot(c);
      if (!allHold(pending.while, w)) {
        const why = firstBroken(pending.while, w);
        this.deps.bus.emit("dialog:silent", { npcId: c.memKey, reason: "NO_RULE" });
        this.out.push({ kind: "log", text: `con: "${this.fill(c, pending.say)}"` });
        this.out.push({ kind: "log", text: `${this.label(c)}: "?"` });
        this.applyTalkOption(c, { rel: -1 }, "câu mình vừa nói trật");
        void why;
        /** Không gạch thì nhịp cũ hiện lại nguyên si và bấm được vô hạn lần, mỗi lần trừ một điểm. */
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
      /** Tính theo cuộc ĐÃ NÓI, không theo cuộc đã mở; và chỉ `CHUYEN` mới tiêu. */
      if (countsAgainstDailyCap(s.talk)) this.deepToday++;
    }
    this.out.push({ kind: "log", text: `con: "${this.fill(c, r.node.say)}"` });
    this.actReply = null;
    this.applyTalkOption(c, r.node, "câu mình vừa nói");
    const act = this.takeActReply();
    const reply = act?.text ?? r.reply;
    if (reply) this.out.push({ kind: "log", text: `${this.label(c)}: "${this.fill(c, reply)}"` });
    else if (r.node.silent) this.reactTalk(c, "NAME", 1, "TURN_AWAY_QUARTER");
    const view = this.talkView(this.fill(c, reply ?? ""), !reply && !!r.node.silent,
      act?.mood ?? r.node.mood, this.fill(c, r.node.say));
    if (r.done) {
      /** Họ là người ĐANG ĐI nên đứng lại mới là cái bất thường. Ba ngoại lệ: vừa nhận lời mời, đang đứng chỗ mát, đang ăn. */
      const stays = c.inShade || c.eating || !c.ambient;
      this.endTalk();
      if (c.ambient && !stays) this.walkOn(c);
    }
    return view;
  }

  /** KHÔNG phải nút huỷ: làm thinh với người đang nói chuyện với mình là một câu trả lời, và nó có giá. */
  closeTalk(): void {
    const s = this.talkSession, c = this.talkWith;
    const engaged = this.talkEngaged, npcOpened = this.talkNpcOpened;
    this.endTalk();
    if (!s || !c || s.done) return;
    /** Chỉ tính giá khi khách mở lời trước, hoặc mình đã nói rồi mới bỏ ngang. Bấm F rồi đổi ý mà chưa nói gì thì không mất gì. */
    if (npcOpened || engaged) this.applyIgnore(c, s.talk);
    if (c.ambient && !c.inShade && !c.eating) this.walkOn(c);
  }

  /**
   * Mười một lý do, mười một câu — mỗi nguyên nhân KỸ THUẬT ánh xạ sang một lý do CON NGƯỜI nhất quán.
   * ⚠️ Thứ tự duyệt: NGƯỜI CHƠI → HOÀN CẢNH → QUAN HỆ. Quan hệ luôn là lời giải thích CUỐI CÙNG.
   */
  talkUnavailable(): string | null {
    const c = this.talkTarget();
    if (!c) return null;
    if (!this.talks.has(this.talkKey(c))) return null;
    const who = this.label(c);
    const a = this.addressOf(c);
    if (c.inviteRefused) return `${who} nói rồi — người ta đi tiếp.`;
    /** Mấy lý do phía dưới đều tra `mem(memKey)`, mà `memKey` của người lạ dùng chung cho tám dáng — nói về tâm trạng hay độ thân của họ là bịa. */
    if (c.ambient) {
      if ((this.passerTalks.get(c.id) ?? 0) >= PASSER_TALKS_MAX) {
        return `${who} nói chuyện nãy giờ rồi — người ta còn đi.`;
      }
      if (this.someoneWaiting(c)) return "Còn người đang chờ bánh — để lát hẵng mời.";
      if (this.soldOut) return "Hết bánh rồi, mời người ta vô chi nữa.";
      return `${who} đi lướt qua, không ngó lại.`;
    }
    if (c.phase === "queueing") return `${who} đang chờ tới lượt.`;
    if (c.phase === "waiting" && c.waitRatio >= 0.6) return `${who} ngó đồng hồ — thôi làm cho người ta đi.`;
    if (this.someoneWaiting(c)) return "Còn người đang chờ bánh — để lát.";
    if (c.dayMood.value < 0) return `${who} bữa nay hổng có tâm trạng.`;
    if (this.mem(c.memKey).tier === "RIVAL") return `${who} ngó đi chỗ khác.`;
    if (this.heldTalk.has(c.id) || !this.canOpenDeep(c)) return `${who} gật đầu một cái rồi quay đi.`;
    const tier = this.mem(c.memKey).tier;
    return tier === "FRIEND"
      ? `${who}: "Bữa nay cũng vậy à ${a.you}."`
      : `${who} gật một cái, hết.`;
  }

  /** MỘT state công khai: chỉ báo trên màn hình và cú bấm phím đọc CÙNG hàm này. */
  get talkTargetNow(): Customer | null {
    return this.talkTarget();
  }

  /**
   * Dòng nhắc gọi việc này là gì: **mời** một người đang đi, và **nói chuyện** với người đang
   * đứng trước mặt mình. Dùng chung một chữ là dạy người chơi rằng chúng cùng một thứ, rồi để
   * họ tự ngạc nhiên khi luật khác nhau.
   */
  talkVerb(c: Customer): "mời" | "nói chuyện" {
    if (!c.ambient) return "nói chuyện";
    const ok = eligible(this.talks.get(this.talkKey(c)), this.talkCtx(c), "PLAYER");
    return ok.some((t) => talkKindOf(t) === "MOI" && this.canRun(t, c)) ? "mời" : "nói chuyện";
  }

  /**
   * Tên cũ, giữ lại cho scene và test. ⚠️ KHÔNG còn loại `front` ra — chính chỗ loại đó làm
   * người đứng đầu quầy thành người duy nhất không bao giờ được tô sáng.
   */
  nearbyToTalk(): Customer | null {
    return this.talkTarget();
  }

  /**
   * Nói chuyện được với người này không. Người ĐI NGANG nói chuyện được suốt quãng còn trong
   * hẻm; người đã được phục vụ xong và đang quay lưng thì KHÔNG — gọi giật lại một người vừa
   * mua xong là níu người ta lại.
   */
  private talkable(c: Customer) {
    if (c.balking) return false;
    // `arriving` = còn đang đi giữa đường — gọi với họ là nói với một cái lưng quay nửa chừng.
    if (c.phase === "arriving") return false;
    return c.pass ? true : c.phase !== "leaving";
  }

  /**
   * CHI PHÍ nhắm một người; nhỏ nhất thì thắng, `Infinity` là loại.
   *
   * ⚠️ Không dùng khoảng cách thẳng: ở quầy mọi người đều cách người chơi ~2,1 ô theo `y` nên
   * trục đó là hằng số chỉ gây nhiễu — CHỈ trục `x` phân biệt được ai với ai.
   */
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

  /**
   * Nói chuyện với AI. MỘT hàm duy nhất — chỉ báo trên màn hình và cú bấm phím đọc cùng kết quả.
   * Bám dính `TALK_STICKY` (cùng hằng số với `stations.STICKY`) để mục tiêu không nhấp nháy qua
   * lại theo từng pixel bước chân.
   */
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

  /**
   * Cuộc giữ dở còn hợp lệ không — giờ giấc, thời tiết, cờ chuyện có thể đã đổi từ lúc
   * giữ. Giữ một cuộc của buổi sáng rồi mở nó ra lúc gần trưa là nói sai cảnh.
   */
  private stillEligible(t: Talk, c: Customer): boolean {
    return eligible([t], this.talkCtx(c), "PLAYER").length > 0;
  }

  private offerFor(c: Customer) {
    return this.offers.find((o) => o.c === c) ?? null;
  }

  /**
   * Rút một cuộc CHẠY ĐƯỢC NGAY BÂY GIỜ.
   *
   * ⚠️ Lọc TRƯỚC khi rút, không rút rồi mới kiểm: `canRun` loại gần hết kho lúc quầy có người,
   * nên rút trên cả kho nghĩa là năm lần trong sáu một người đủ điều kiện mở lời vẫn im. Lọc
   * trước thì `weight` cũng được chia lại đúng trong tập còn chơi được.
   */
  private pickRunnable(c: Customer, by: TalkOpenBy): Talk | null {
    const pool = this.talks.get(this.talkKey(c));
    const ctx = this.talkCtx(c);
    const ok = eligible(pool, ctx, by).filter((t) => this.canRun(t, c));
    if (!ok.length) return null;
    /*
     * BƯỚC RA ĐƯỜNG VỚI MỘT NGƯỜI ĐANG ĐI LÀ ĐỂ MỜI HỌ — ưu tiên tuyệt đối cuộc `MOI`. Kho `ANY`
     * ghép vào MỌI người nên không ưu tiên thì chỉ 41,7% số lần bấm ra được một cuộc có đường
     * mời, trong khi dòng nhắc đã ghi sẵn "mời … ghé mua".
     *
     * Hôm nay mời hết rồi thì rơi về chào hỏi, và `talkVerb` đổi chữ theo.
     */
    const prefer = c.ambient ? ok.filter((t) => talkKindOf(t) === "MOI") : [];
    const list = prefer.length ? prefer : ok;
    return pickTalk(list, ctx, this.dialogRng, by);
  }

  get talkOpen() {
    return this.talkSession !== null;
  }

  /**
   * MỖI LỰA CHỌN ĐANG HIỆN LÀM GÌ — act của chính nó, và act gần nhất nằm trong NHÁNH con.
   *
   * `TalkView.options` cố tình chỉ có `say` + `tone`: người chơi đọc câu nói, không đọc tên
   * act, và bày tên act ra màn hình là vi phạm T5 theo chiều ngược (nói trước kết cục).
   * Nhưng một con BOT thì cần biết — không có cái này thì không bot nào bấm trúng được
   * `OFFER_TEA`/`THEY_SIT`/`LEND_ITEM`, nên mấy fact `v.gaveTea`, `t.sitting`, `m.borrowing`
   * đo ra 0% và không ai biết là "chưa từng xảy ra" hay "bot không biết làm".
   *
   * Dùng cho `sim/headless.ts` và mấy công cụ đo. KHÔNG dùng ở `StallScene`.
   */
  optionActs(): { kind: string | null; sau: readonly string[] }[] {
    const s = this.talkSession;
    const here = s?.options;
    if (!s || !here) return [];
    return visibleOptions(here, this.talkGate()).map((n) => ({
      kind: n.act?.kind ?? null,
      sau: actsUnder(n, s.talk),
    }));
  }

  /**
   * Cho scene bắt người đang nói chuyện nói MỘT câu ngay lập tức — không qua lịch nói. Lịch
   * nói (`say`) có độ trễ ngẫu nhiên, trần hai bong bóng và hạn bỏ câu: đúng cho bark, sai cho
   * một cuộc đối đáp mà người chơi vừa nói xong và đang đợi.
   */
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

  /**
   * Lấy câu đáp của hành động ra và dọn chỗ. Là một hàm chứ không đọc thẳng `this.actReply`
   * vì trình kiểm kiểu không biết `applyTalkOption()` có ghi vào đó: đọc thẳng thì nó thu
   * hẹp kiểu về `null` ngay sau dòng gán `null` phía trên và báo lỗi.
   */
  private takeActReply() {
    const r = this.actReply;
    this.actReply = null;
    return r;
  }

  private endTalk() {
    this.talkSession = null;
    this.talkWith = null;
    this.recalled = null;
    this.talkEngaged = false;
    this.talkNpcOpened = false;
    this.talkWarmth = 0;
    this.talkAngered = false;
    this.actReply = null;
  }

  private applyIgnore(c: Customer, talk: Talk) {
    const ig = talk.ignore ?? { rel: DEFAULT_IGNORE_REL };
    this.applyTalkOption(c, { rel: ig.rel ?? DEFAULT_IGNORE_REL, anger: ig.anger, mem: ig.mem, mood: ig.mood }, "mình làm thinh");
    if (ig.reply) this.say(c, this.fill(c, ig.reply), 2, true, 55);
  }

  private talkFlags(): TalkCtx["flags"] {
    return (this.deps.story?.flags ?? {}) as TalkCtx["flags"];
  }

  private talkGate(): TalkGate {
    /*
     * `holds` gắn ảnh chụp thế giới của ĐÚNG người đang nói chuyện; dựng snapshot MỘT lần cho cả
     * lượt lọc vì `snapshot()` đọc hai chục chỗ trong hệ.
     *
     * Không có ai đang nói chuyện (test, headless) ⇒ `holds` vắng và mọi khoá bảng đen coi như
     * ĐÚNG — một gate trần không được làm cả cây thoại biến mất.
     */
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

  /**
   * Thay DANH XƯNG vào một câu thoại — `{call}` `{me}` `{self}` `{you}`.
   *
   *   {call} người chơi gọi họ     {me}   người chơi tự xưng với họ
   *   {self} họ tự xưng            {you}  họ gọi người chơi
   *
   * Chỗ xưng hô để TRỐNG trong file nội dung và điền ở đây theo đúng người đang đứng trước mặt
   * (`WALKIN_ADDRESS` tra theo dáng) — một bộ thoại dùng chung cho tám dáng người. Câu không có
   * dấu ngoặc nào thì trả về nguyên xi.
   */
  private fill(c: Customer, s: string): string {
    if (!s.includes("{")) return s;
    const a = this.addressOf(c);
    /*
     * `{m.what}` — CHUYỆN CŨ, điền từ ký ức VỪA TRUY HỒI, không phải từ chữ người viết gõ:
     * người viết gõ "Bữa trước {m.what} sao rồi?". Không nhớ ra gì thì `m.remembers` đã sai từ
     * trước và nút này không bao giờ hiện, nên nhánh dự phòng dưới đây chỉ là lưới thứ hai.
     */
    if (s.includes("{m.what}")) {
      s = s.replace(/\{m\.what\}/g, this.recalled?.what ?? "chuyện bữa trước");
    }
    /** Một con số viết cứng trong lời thoại là một con số sẽ sai vào ngày ai đó chỉnh bảng giá, và không test nào bắt được. */
    if (s.includes("{gio}")) s = s.replace(/\{gio\}/g, gioVi(this.nowMin));
    if (s.includes("{gia")) {
      const one = c.order ? loafPriceVnd(tierOf(c.order.intent)) : loafPriceVnd("thuong");
      s = s.replace(/\{gia(\d*)\}/g, (_m, n: string) => dongVi(one * (Number(n) || 1)));
    }
    return s.replace(/\{(call|me|self|you)\}/g, (_m, k: keyof typeof a, at: number) => {
      const w = a[k];
      const before = s.slice(0, at).trimEnd();
      return before === "" || /[.!?…]$/.test(before) ? w[0].toUpperCase() + w.slice(1) : w;
    });
  }

  /** Người có tên tra `ADDRESS` theo id; người lạ tra `WALKIN_ADDRESS` theo DÁNG — tám dáng dùng chung một kho thoại mà vai khác hẳn nhau. */
  private addressOf(c: Customer) {
    if (c.npc) return ADDRESS[c.npc.id] ?? ADDRESS.WALKIN;
    const i = Number(c.memKey.slice("walkin".length));
    return (c.memKey.startsWith("walkin") && WALKIN_ADDRESS[i]) || ADDRESS.WALKIN;
  }

  /** ⚠️ `QUA_DUONG` có kho RIÊNG: kho `WALKIN` toàn chuyện của người đang MUA, đem cho người đi ngang là họ mặc cả một ổ chưa hề hỏi mua. */
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
      tier: m.tier,
      visits: m.visits,
      flags: this.talkFlags(),
      usedToday: m.talkTopics?.day === this.deps.day ? m.talkTopics.topics : [],
      usedSeason: c.npc ? (m.talksDone ?? []) : (this.talkedThisVisit.get(c.id) ?? []),
      hasEquip: (id: string) => has(this.deps.equip, id as EquipId),
      practice: this.practiceOf(c),
      holds: (key: string) => holds(key, this.snapshot(c)),
      score: (t) => this.scoreTalk(c, t),
    };
  }

  /** Ba tầng nhân vào nhau: điểm drive × 1,25 nếu nói đúng chuyện CỦA HỌ × 0,15 nếu đụng chuyện CẤM (không chặn hẳn — nói hớ phải có giá). */
  private scoreTalk(c: Customer, t: Talk): number {
    const prof = profileOf(c.npc?.id);
    const now = drivesNow(c.driveBase, c.drives, this.practiceOf(c));
    let score = scoreSatisfies(satisfiesOf(t), now, prof?.tune);
    if (prof) {
      const topic = t.topic.toUpperCase();
      if (prof.advertises.some((x) => topic.includes(x) || x.includes(topic))) score *= 1.25;
      if (prof.taboo.some((x) => topic.includes(x) || x.includes(topic))) score *= 0.15;
    }
    return score;
  }

  /** 12 người CÓ TÊN nhớ theo MÙA; người KHÔNG CÓ TÊN nhớ theo LƯỢT GHÉ (`memKey` của họ dùng chung cả mùa). Cuộc `ANY` không vào sổ của ai. */
  private markTalkUsed(c: Customer, t: Talk) {
    /*
     * NÓI XONG THÌ CÁI MUỐN HẠ XUỐNG — mắt xích thiếu của cả hệ drive.
     *
     * `scoreSatisfies` chấm một cuộc theo chuyện nó THOẢ được bao nhiêu, nhưng trước đợt
     * này không chỗ nào THOẢ thật: `bump()` của `sim/drives.ts` không một ai gọi, nên
     * `c.drives` nằm y nguyên ở `driveBase` suốt buổi. Hệ quả đo được: quét
     * `DRIVE_DECAY_PER_MIN` từ 0,5 tới 8 mà KHÔNG đổi một con số nào — không có gì để suy
     * giảm. Nghe một người kể chuyện xong, cái muốn kể của họ vẫn y như lúc chưa kể.
     *
     * Dấu: `satisfiesOf` trả DƯƠNG = được thoả, mà thang ở đây là "đang muốn bao nhiêu",
     * nên thoả thì TRỪ đi.
     */
    for (const [k, drop] of Object.entries(satisfiesOf(t))) {
      if (drop) bump(c.drives, k as DriveId, -drop);
    }
    const m = this.mem(c.memKey);
    /** Khoá theo `memKey` chứ không theo lượt ghé: ghé hai lần một sáng thì lần thứ hai không được hỏi lại chuyện vừa nghe. */
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

  /** Phần lớn `act` TREO một lời hứa lên lượt ghé rồi `deliver()` / `settlePayment()` mới biết người chơi có giữ lời không. */
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
        /*
         * Chiều VÀO của `PAY`. Vào `floatLeft` (tiền lẻ trong ống), KHÔNG vào doanh thu —
         * đây là tiền quay lại chứ không phải tiền bán được. Dấu ÂM trên dòng `cost` để
         * trang tối cộng đúng: dương = tiền ra khỏi két.
         */
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
      /** 56 nút đòi tới — "đi học đi con" mà con bé không đi là chỗ này. */
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
      /** Khác `FREE_LOAF`: nợ là nợ, có sổ, và có ngày đòi. */
      case "CREDIT_LOAF":
        this.creditLoaf(c);
        break;
      case "REFUSE":
        /** "Không bán cho nữa" chỉ có nghĩa với người ĐANG MUA — người đi ngang thì chỉ đi tiếp. */
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
      case "LEND_ITEM":
        this.lendItem(c, act.item);
        break;
      case "CLEAR_DEBT":
        this.clearDebt(c);
        break;
      case "ORDER_CHANGE":
        this.orderChange(c, act);
        break;
      default:
        /**
         * ⚠️ MỘT ACT KHÔNG CÓ NHÁNH LÀ MỘT LỜI NÓI MIỄN PHÍ, và nó IM LẶNG — `switch` thiếu nhánh không
         * phải lỗi kiểu. Nhánh `default` gọi `assertActHandled(act)` để biến nó thành lỗi BIÊN DỊCH.
         */
        return assertActHandled(act);
    }
  }

  /** Dòng số `invite:<id lượt>` nên MỘT người chỉ có MỘT câu trả lời; người viết khai cả `yes` lẫn `no`, roll quyết câu nào. */
  private invite(c: Customer, act: Extract<TalkAct, { kind: "INVITE" }>, tone: TalkTone) {
    if (!c.ambient || !c.pass) {
      /*
       * Mời một người KHÔNG đi ngang là một act im lặng — cùng họ với `BARTER` thiếu
       * `case`. Nội dung đã khoá (`t.passing`, hoặc kho `WALKIN`/`QUA_DUONG`), nên tới
       * được đây là nội dung gắn sai; kêu lên chứ đừng nuốt.
       */
      this.deps.bus.emit("dialog:silent", { npcId: c.memKey, reason: "INVITE_SAI_NGUOI" });
      return;
    }
    const unlimited = !!this.deps.noTimePressure;
    const ahead = this.customers.filter((x) => x.phase !== "leaving" && !x.pass && !x.balking).length;
    const p = inviteChance({
      person: c.personality,
      glanced: c.pass.stay > 0,
      tone,
      warmth: this.talkWarmth,
      ahead,
      slots: Math.min(SLOTS.length, peakCap(this.deps.day, unlimited)),
      soldOut: this.soldOut,
    });
    /** Mục đích và tâm trạng HÃM lời mời, không bao giờ đẩy lên — `INVITE_MAX` vẫn là trần. */
    const yes = this.deps.hub.derive(`invite:${c.id}`).next() < p * (c.purpose?.inviteMul ?? 1);
    const mood: TalkMood = yes ? "CUOI" : "CUOI_KHAN";
    this.actReply = { text: yes ? act.yes : act.no, mood };
    this.scheduleReact(c, MOOD_FACE[mood], MOOD_POSE[mood]);
    if (!yes) {
      /** Ba chuyện cùng lúc: ẩn mọi lựa chọn `INVITE` · họ đi tiếp NGAY · `talkCost` cộng phạt. Thiếu cả ba thì roll tất định chỉ chặn kết quả. */
      c.inviteRefused = true;
      if (c.pass) c.pass.until = c.now;
      this.out.push({ kind: "log", text: `${this.label(c)} đi tiếp.` });
      return;
    }
    this.acceptInvite(c);
  }

  /** ⚠️ Không nhánh `if` nào ở hạ nguồn được biết người này từng đi ngang — nếu không họ thành khách hạng hai có luật riêng. */
  private acceptInvite(c: Customer) {
    /** ⚠️ `talkKey(c)` đọc `c.ambient` nên người này nhảy kho `QUA_DUONG` → `WALKIN`; cú `release` thừa ở `leave()` có thể thả `walkin.json` khi người ta còn đứng đó. */
    this.talks.ensure("WALKIN");
    this.talks.release("QUA_DUONG");
    c.ambient = false;
    c.pass = null;
    c.phase = "arriving";
    c.rollOrder(false);
    c.dayMood = rollMood(this.deps.hub.derive(`invite-mood:${c.id}`), this.deps.day);
    c.gazeMul = this.deps.gazeMul ?? 1;
    const m = this.mem(c.memKey);
    m.visits++;
    m.lastSeenDay = this.deps.day;
    this.assignSlots();
    this.out.push({ kind: "log", text: `${this.label(c)} ghé vô thiệt.` });
    this.deps.bus.emit("npc:arrived", {
      npcId: c.memKey, visitId: c.id, slot: "SEATED_FAR", atHhmm: fmtHhmm(this.nowMin),
    });
  }

  // ──────────────────────────────── hành động thật của một câu nói (P2-09 §2.6)

  /** Với người đi ngang đây là trạng thái NGHỈ; với khách đang mua thì họ BỎ ĐI, nên nhánh đó qua `leave()`. */
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

  /** Ổ RỜI TAY thật, nếu không thì "ăn thử cho biết" là thiện cảm không tốn gì. */
  private giveBread(c: Customer, forSec: ForSec) {
    if (!this.playerHand.startsWith("loaf")) return;
    /*
     * ⚠️ MỘT Ổ, MỘT LẦN. Bản trước chỉ hỏi "tay có cầm ổ nào không" — mà `StallScene` gán
     * `playerHand` mỗi frame, nên trong cùng một phiên thoại bấm hai nút cho ăn là **hai**
     * ổ rời tay bằng một ổ trên tay. Lưới `PHA-2` bắt được đúng cái đó.
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
    this.remember(c, "CARED_FOR_THEM", SALIENCE.CARED_FOR_THEM);
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
    this.out.push({ kind: "log", text: `${this.label(c)} bước vô chỗ mát đứng.` });
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
    const st = this.deps.story;
    if (!st) return;
    if (hong) {
      st.flags.clipBad = this.deps.day;
      this.out.push({ kind: "log", text: `đoạn quay dính cảnh quầy chưa dọn.` });
      return;
    }
    /** ⚠️ Chỉ được DỜI SỚM, không bao giờ dời muộn — ngày 5 đã có một nhánh kịch bản đặt `clipDay`. */
    const cu = Number(st.flags.clipDay ?? 99);
    const moi = this.deps.day + CLIP_DUNG_SAU;
    if (moi < cu) st.flags.clipDay = moi;
    this.out.push({ kind: "log", text: `${this.label(c)} quay xong một đoạn ưng ý.` });
  }

  /** `minhBung` phân biệt hai việc: mình bưng giùm (lối thông, và là một việc mình làm) với bảo bà tự dời. */
  private carryGanh(c: Customer, minhBung: boolean) {
    if (this.ganh !== "NGOAI") return;
    this.ganh = "TRONG";
    void GANH_IN; void GANH_OUT;
    this.out.push({
      kind: "log",
      text: minhBung ? `mình bưng gánh vô trong giùm ${this.label(c)}.` : `${this.label(c)} dời gánh vô sát vách.`,
    });
  }

  /** Ổ RỜI KHO thật và cầm về một món — không tiền, mà cũng không phải cho không. */
  private barter(c: Customer, nhan: string) {
    if (this.soldOut || c.visit.gaveFood) return;
    this.stock = Math.max(0, this.stock - 1);
    c.visit.gaveFood = true;
    this.remember(c, "CARED_FOR_THEM", SALIENCE.CARED_FOR_THEM);
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

  /**
   * CHO MƯỢN MỘT MÓN — món đồ CÒN PHẢI VỀ.
   *
   * Khác `FREE_LOAF` (cho hẳn) và `BARTER` (đổi ngang): cái đáng chơi nằm ở chỗ nó có về
   * hay không. Ghi vào sổ MÙA (`mem.borrowed`) chứ không sổ lượt ghé — cho mượn hôm nay
   * thì mai họ mới mang trả, món nợ đó phải sống qua đêm.
   *
   * Chỉ người CÓ TÊN: `memKey` của khách lạ dùng chung cho tám dáng người cả mùa, ghi nợ
   * vào đó là ghi lên sổ người khác (P2-09 §2.4).
   */
  private lendItem(c: Customer, item: string) {
    if (!c.npc || this.coats <= 0) return;
    const m = this.mem(c.memKey);
    if (m.borrowed) return;
    this.coats--;
    m.borrowed = { item, day: this.deps.day };
    this.remember(c, "CARED_FOR_THEM", SALIENCE.CARED_FOR_THEM);
    this.out.push({ kind: "log", text: `cho ${this.label(c)} mượn ${item}. Còn ${this.coats} cái.` });
  }

  /** Họ mang trả. Món đồ về kho, và việc GIỮ LỜI mới là thứ đáng nhớ chứ không phải cái áo. */
  private clearDebt(c: Customer) {
    const m = this.mem(c.memKey);
    if (!m.borrowed) return;
    const item = m.borrowed.item;
    const tre = this.deps.day - m.borrowed.day;
    delete m.borrowed;
    this.coats = Math.min(COATS_START, this.coats + 1);
    this.remember(c, "REMEMBERED_STORY", SALIENCE.CARED_FOR_THEM);
    this.out.push({
      kind: "log",
      text: tre <= 1 ? `${this.label(c)} mang trả ${item}.` : `${this.label(c)} mang trả ${item} sau ${tre} bữa.`,
    });
  }

  /**
   * ĐỔI CÁI ĐƠN — và KHÔNG phải lúc nào họ cũng chịu.
   *
   * Lỗi chủ dự án bắt: *"Vậy em làm đầy đủ cho anh nghen."* mang `PROMISE { item }`, nên
   * người ta gật mà cái đơn vẫn y như cũ, và tiền vẫn tính theo đơn cũ. Giờ nó đổi
   * `c.order.intent` thật; `loafPriceVnd(tierOf(intent))` tự ăn theo, nên không có đường
   * nào làm ổ đầy đủ mà thu tiền ổ thường.
   *
   * CƠ HỘI GẬT: người đang vội thì gần như không — mời họ ăn sang hơn giữa lúc trễ làm là
   * mời sai lúc. Dòng số riêng `doidon:` theo lượt ghé, rút MỘT lần, không rút ké.
   */
  /**
   * Người bị nói xấu NGHE THẤY — act `OVERHEARD_BY`.
   *
   * Giá phải nằm trong sổ của CHÍNH HỌ (`record` + `witness`), không phải của người đang
   * đứng nghe cùng. Và phải có một dòng nhật ký: không thấy gì xảy ra thì người chơi học
   * sai bài — tưởng nói xấu sau lưng là miễn phí (T5).
   */
  private overheardBy(noi: Customer, act: Extract<TalkAct, { kind: "OVERHEARD_BY" }>) {
    const ho = this.customers.find((x) => x.memKey === act.ai && x.phase !== "leaving");
    if (!ho) return;                               // không có mặt thì không ai nghe — nước đi hợp lệ
    if (Math.hypot(ho.x - noi.x, ho.y - noi.y) > OVERHEAR_REACH) return;
    const vet = act.vet ?? "RUDE_TO_THEM";
    const manh = act.intensity ?? 55;
    record(this.mem(act.ai), ho.personality, vet, manh, this.deps.day);
    /*
     * `witness()` là chỗ nó khác một vết nhớ thường: bà Sáu không chỉ GIẬN, bà còn có một
     * niềm tin hạng nhất để KỂ LẠI. Nói xấu người ta giữa hẻm thì chuyện đó đi tiếp.
     */
    if (this.deps.gossip) witness(this.deps.gossip, act.ai as never, vet, manh, this.deps.day);
    this.out.push({ kind: "log", text: `${this.label(ho)} đứng ngay đó. ${this.label(ho)} nghe hết.` });
    this.scheduleReact(ho, MOOD_FACE.BUC, MOOD_POSE.BUC);
  }

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
      if (toi === "dayDu") it.dayDu = true;
      else if (toi === "itRau") it.rau = "it";
      else if (toi === "themNhan" && !it.nhieu) it.nhieu = it.nhan[0] ?? "pate";
      else if (toi === "khongOt") { it.ot = 0; it.tuong = 0; }
    }
    c.order.levels = levelsOf(it);
    c.order.phrase = undefined;                        // câu gọi cũ không còn tả đúng ổ nữa
    this.out.push({
      kind: "log",
      text: `${this.label(c)} đổi đơn — giờ tính ${dongVi(loafPriceVnd(tierOf(it)))}.`,
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
    this.applyTalkOption(c, d.deed.onKept ?? { rel: 2, mem: { kind: "CARED_FOR_THEM", intensity: 40 } }, "mình giữ lời");
  }

  /** Khác `FREE_LOAF`: nợ là nợ, có sổ, có ngày đòi. */
  private creditLoaf(c: Customer) {
    const pledge = this.pledges.get(c.id) ?? { promised: [], discount: 0, free: false };
    pledge.free = true;
    this.pledges.set(c.id, pledge);
    this.out.push({ kind: "log", text: `ghi nợ một ổ cho ${this.label(c)} — nhớ ghi vô sổ.` });
  }

  /** Người ta NGHE hay KHÔNG là chuyện của họ — một phép thử quan hệ, không phải một cái nút. */
  private askStepAside(c: Customer, forSec: ForSec = "TOI_LUOT") {
    const m = this.mem(c.memKey);
    this.asideFor.set(c.id, forSec);
    const willing = c.npc
      ? (m.tier === "FRIEND" ? 0.92 : m.tier === "RIVAL" ? 0.15 : 0.55) * (1.25 - c.personality.nongTinh)
      : 0.45;
    if (this.deps.hub.derive(`aside:${this.deps.day}:${c.id}`).next() < willing) {
      this.stepAside(c);
      this.reactTalk(c, "CARED", 1, "STEP_BACK_HALF");
      return;
    }
    this.reactTalk(c, "NAME", 2, "ARMS_CROSS");
    if (c.npc) {
      const r = record(m, c.personality, "RUDE_TO_THEM", 45, this.deps.day);
      void r;
    }
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
    this.out.push({ kind: "log", text: `${this.label(c)} bước trở vô hàng.` });
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

  /** Ba kết cục: giữ lời → `CARED_FOR_THEM` · bỏ thứ KHÁC → `BROKEN_PROMISE` nhẹ · không bỏ gì → nặng. */
  private settlePledge(c: Customer, dish: Ingredient[]): number {
    const pledge = this.pledges.get(c.id);
    if (!pledge?.promised.length) return 0;
    let score = 0;
    for (const item of pledge.promised) {
      const label = labelOf(item as Ingredient);
      if (dish.includes(item as Ingredient)) {
        score += PROMISE_KEPT;
        this.remember(c, "CARED_FOR_THEM", PROMISE_KEPT);
        this.noteRel(`giữ lời, có ${label}`, PROMISE_KEPT);
        this.say(c, this.barks.take("promiseKept", c.memKey, { mon: label }), 2, true, 70);
        continue;
      }
      const swapped = dish.some((x) => !c.order!.levels[x] && NHAN_IDS.has(x));
      score -= swapped ? PROMISE_SWAPPED : PROMISE_BROKEN;
      this.remember(c, "BROKEN_PROMISE", swapped ? PROMISE_SWAPPED : PROMISE_BROKEN);
      this.noteRel(swapped ? `hứa ${label} mà bỏ thứ khác` : `hứa ${label} mà không có`, swapped ? PROMISE_SWAPPED : PROMISE_BROKEN);
      this.say(c, this.barks.take(swapped ? "promiseWrong" : "promiseBroken", c.memKey, { mon: label }), 2, true, 95);
      this.reactTalk(c, "NAME", swapped ? 2 : 3);
    }
    pledge.promised = [];
    return score;
  }

  /** Ba kênh, thứ tự THẤY → HIỂU → NGHE. Khách vãng lai KHÔNG có trí nhớ nhưng VẪN giận được. */
  private applyTalkOption(c: Customer, o: TalkEffect & { mood?: TalkMood; act?: TalkAct; tone?: TalkTone }, note?: string) {
    this.talkWarmth += o.rel ?? 0;
    const relBefore = this.relNow(c);
    if (note) this.relNote = { text: note, w: 1 };
    if (c.npc) {
      const out = applyTalk(o, this.mem(c.memKey), c.personality, this.deps.day);
      // `memory:written` cố ý KHÔNG bắn ở đây: lời nói không phải kích thích ai cũng thấy, nên nó cũng không đi qua `witness()`.
      if (out.mem) {
        const days = SILENT_ABSENCE[out.mem];
        const m = this.mem(c.memKey);
        if (days && isSilentGrudge(c.personality)) m.absentUntil = Math.max(m.absentUntil, this.deps.day + days);
      }
    }
    if (o.flag && this.deps.story) this.deps.story.flags[o.flag] = this.deps.day;

    const anger = (o.anger ?? 0) * intensityMul(c.personality);
    if (anger > 0) {
      c.waitSec += angerToWaitSec(anger, c.waitT, c.waitSec, LEAVE_AT);
      this.talkAngered = true;
    }
    if (o.calm) c.soothe(o.calm / intensityMul(c.personality));
    /** Người viết khai `mood` thì `mood` THẮNG — cùng +3 điểm mà hai khuôn mặt khác hẳn nhau. */
    const mood = o.mood;
    if (mood) {
      this.scheduleReact(c, MOOD_FACE[mood], MOOD_POSE[mood]);
    } else if (anger > 0) {
      this.reactTalk(c, "NAME", anger >= 45 ? 3 : 2);
    } else if (o.calm) {
      this.reactTalk(c, "CARED", 1);
    } else if ((o.rel ?? 0) >= 3) {
      this.reactTalk(c, "CARED", 1);
    }
    if ("act" in o && o.act) this.applyAct(c, o.act as TalkAct, o.tone ?? "THUONG");

    /** Ngưỡng tính SAU `intensityMul` nên tính cách quyết ai nổ trước. Đặt cuối hàm để quan hệ và lời hứa ghi xong trước. */
    if (anger >= STORM_OFF_ANGER && c.phase !== "leaving") {
      if (c.ambient) { c.inviteRefused = true; if (c.pass) c.pass.until = c.now; }
      else {
        this.out.push({ kind: "log", text: `${this.label(c)} bỏ đi — bị nói nặng quá.` });
        this.leave(c, "insulted");
      }
    }
    this.settleRelMoved(c, relBefore);
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
   * ĐANG NÓI DỞ MÀ MÌNH BỎ ĐI THÌ CUỘC TẮT.
   *
   * Chủ dự án: *"bắt chuyện với người ta mà trong lúc đó user đi chỗ khác rồi người ta vẫn
   * phản hồi, trong khi 2 người đứng cực kì xa."* Đúng — `openTalk()` kiểm khoảng cách một
   * lần lúc MỞ, rồi không ai kiểm lại nữa; người chơi đi hết cái hẻm mà cuộc vẫn chạy.
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

  /** Giá theo thực đơn (không bao giờ trừ tiền bánh). Quên tiền → mua chịu; trả nợ thì nói số họ NHỚ; thiếu lẻ thì làm tròn xuống hoặc chạy qua cô Mai. */
  private settlePayment(c: Customer, price: number, tip: number, complained: boolean) {
    const day = this.deps.day;
    const debts = this.deps.debts;
    const open = c.npc && debts ? openDebtOf(debts, c.memKey, day) : undefined;
    if (open) {
      const amt = recalledAmount(open, day, c.personality, this.deps.saveId, this.deps.allowFalseMemory ?? true);
      open.settledOnDay = day;
      open.settledAmount = amt;
      this.out.push({ kind: "repay", amount: amt, npcId: c.memKey, name: this.label(c) });
    }
    const r = this.deps.hub.derive(`cash:${c.id}`);
    const qr = has(this.deps.equip, "BANG_QR") && !(this.deps.story && this.deps.day === 24 && this.nowMin >= 7 * 60 + 15);
    if (c.npc && debts && !open && r.next() < (qr ? 0.02 : SHORT_OF_CASH_RATE)) {
      const record: DebtRecord = { npcId: c.memKey, day, minute: Math.round(this.nowMin), trueAmount: price, playerWrote: null };
      debts.push(record);
      this.say(c, "Chết, bữa nay quên đem tiền. Mai gửi nghen con?", 2, true, 60);
      this.out.push({ kind: "credit", record, name: this.label(c) });
      this.noteOpening({ complained, paidExact: false, smiled: false, noChange: false, friend: c.npc !== null && this.mem(c.memKey).tier === "FRIEND" });
      return;
    }
    let amount = price + tip;
    if (tip === 0 && this.via > 0 && r.next() < viaRoundUp(this.via)) amount += 1000;
    let noChange = false, exact = false;
    const bill = c.plan?.paysWith;
    if (bill && this.deps.till) {
      const need = bill - amount;
      if (this.deps.till.floatLeft >= need) this.deps.till.floatLeft -= need;
      else {
        noChange = true;
        this.out.push({ kind: "log", text: 'Cô Mai (chạy qua): "Cần tiền lẻ hôn? Cô có nè."' });
        if (this.deps.story) this.deps.story.flags.coMaiChange = this.deps.day;
      }
      this.out.push({ kind: "paid", amount, item: "dish", tip });
      this.noteOpening({ complained, paidExact: false, smiled: tip > 0, noChange, friend: false });
      return;
    }
    const scanned = qr && r.next() < 0.5;
    if (this.deps.till && !scanned) {
      const ch = makeChange(amount, this.deps.till, r.next());
      exact = ch.ok && ch.need === 0;
      if (!ch.ok) {
        noChange = true;
        if (ch.roundedDown) {
          amount -= ch.roundedDown;
          this.out.push({ kind: "log", text: `hết tiền lẻ — bớt cho khách ${ch.roundedDown.toLocaleString("vi-VN")}₫` });
        } else {
          this.out.push({ kind: "log", text: "hết tiền lẻ — chạy qua cô Mai đổi" });
          if (c.npc) { this.remember(c, "MADE_THEM_WAIT", 20); this.noteRel("bắt đứng chờ tiền thối", 20); }
        }
      }
    }
    this.out.push({ kind: "paid", amount, item: "dish", tip });
    this.noteOpening({ complained, paidExact: exact, smiled: tip > 0, noChange, friend: c.npc !== null && this.mem(c.memKey).tier === "FRIEND" });
  }

  private noteOpening(f: Omit<OpeningFacts, "walkedAway">) {
    if (this.viaSettled) return;
    Object.assign(this.opening, f);
    this.settleVia();
  }

  private settleVia() {
    this.viaSettled = true;
    this.via = viaOf(this.opening);
    this.deps.bus.emit("telemetry:mark", { key: "via", value: this.via });
  }

  burnVia() {
    if (this.via < 0) this.via = 0;
  }

  /** Giá phải trả: người đứng trước quầy thấy mình lơ đễnh, nhìn kỹ hơn 1,3× trong 5 giây. */
  playerLeaning() {
    const c = this.front;
    if (c) c.watchedIdleUntil = c.now + 5;
  }

  /** Tên là thứ người chơi TỰ GHI vô sổ; chưa ghi thì gọi bằng HÌNH DÁNG, không phải một gạch ngang. */
  label(c: Customer) {
    if (!c.npc) return displayName(this.deps.notebook, c.memKey, c.name);
    return this.deps.notebook?.pages[c.npc.id]?.name?.trim() || shapeOf(c.npc);
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
function singedDefect(crust: number, burnAt: number): Defect {
  const span = Math.max(0.01, burnAt - CRUST.SINGED);
  const over = clamp01((crust - CRUST.SINGED) / span);
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

/** Chữ thường, ngắn, KHÔNG số (T3). Ổ nhồi chặt có câu hai vế nên cắt lại cho vừa một dòng HUD. */
function defectNote(d: DiffedDefect): string {
  return d.kind === "STUFFED" ? "ổ nhồi chặt quá" : d.text;
}

/** CHỈ để viết nhãn HUD, không bao giờ đụng tới điểm (`generosityOf` mới là chỗ quyết). */
function extraLabel(spec: OrderSpec, dish: readonly Ingredient[]): string | null {
  const got = portionsOf(dish);
  let best: Ingredient | null = null;
  let bestOver = 0;
  for (const ing of INGREDIENTS) {
    const over = (got.get(ing.id) ?? 0) - (spec.levels[ing.id] ?? 0);
    if (over > bestOver) { bestOver = over; best = ing.id; }
  }
  return best ? labelOf(best) : null;
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

