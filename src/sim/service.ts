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
  INGREDIENTS, diffDish, generosityOf, labelOf, makeUsual, mkDefect, portionsOf, sameOrder, sayOrder,
  type Defect, type Ingredient, type OrderSpec,
} from "./order";
import {
  MAX_LIVE_STIMULI, SALIENCE, STIM_SPEC, observe, peakOf, peakOfKey, rank, stateOf,
  type ActiveStim, type ObsState, type Occluder, type Zone,
} from "./perception";
import { ASIDE_SPOT, CUSTOMER_GATE, QUEUE_SLOTS, SEAT_CAPACITY, SEAT_SPOT, SHADE_CAPACITY, SHADE_SPOT, STREET_BIN, hitsWall } from "../world/map";
import { PASSERS_MAX, PASSER_NAMES, inviteChance, nextGapSec, planPasser } from "./passersby";
import { rollVisit } from "./schedule";
import { SILENT_ABSENCE, extraHabit, record, servedWell, visitProbabilityMul, type BaseKind, type Memory } from "./memory";
import { SHARED_POOL, TalkStore } from "../content/talks";
import { allHold, firstBroken, holds, type WorldSnapshot } from "./worldfacts";
import { bandOfMinutes, type PracticeId } from "../content/vocab";
import { retrieve, worthMentioning, type Recalled } from "./recall";
import { describe as describePurpose, purposeHurry, purposeInviteMul, rollPurpose } from "./purpose";
import { baseDrives, decayDrives, drivesNow, scoreSatisfies } from "./drives";
import { profileOf } from "./profile";
import {
  ADDRESS, DEFAULT_IGNORE_REL, TalkSession, WALKIN_ADDRESS, angerToWaitSec, applyTalk,
  eligible, pickTalk, visibleOptions, isSharedTalk, MOOD_FACE, MOOD_POSE,
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
import { CRUST } from "./oven";
import { satisfaction, servedVector, tasteOf } from "./taste";
import { arcToday, extraVisits, usualOf as authoredUsual, type ArcCtx, type Line } from "../content/arcs";
import { arcCtx, moment, onPass, onServed, onTea, onUnserved, storyCrowdMul, timeline, walkinLine, type StoryState } from "./story";
import type { VisitPlan } from "./customer";

/**
 * Điều phối việc bán hàng: ai tới lúc nào, đứng chỗ nào, chờ bao lâu, nhận bánh rồi phản
 * ứng ra sao. Scene gọi `perceive()` → `tickNpcs()` → `tickDialog()` mỗi frame.
 * Không import Phaser — chạy headless được (`npm run sim`).
 */

const SLOTS: readonly { x: number; y: number; zone: Zone }[] = QUEUE_SLOTS;
const GATE = CUSTOMER_GATE;
/**
 * Khách đi bao nhiêu ô mỗi giây. Đồng hồ chờ chỉ chạy từ lúc đã đứng vào hàng
 * (`Customer.tick`), nên đi chậm KHÔNG làm họ mất kiên nhẫn.
 */
const WALK_SPEED = 1.7;

/**
 * Trần số lần khách TỰ bắt chuyện mỗi buổi. Ba cái van đều cần: `initiates` của từng
 * cuộc, trần này, và `TALK_OFFER_GAP_SEC`.
 */
const TALK_OFFERS_PER_DAY = 3;
const TALK_OFFER_GAP_SEC = 100;

/**
 * Trần cuộc SÂU (`depth: "FULL"`) mỗi ngày, áp cho CẢ HAI đường: người chơi bấm phím lẫn
 * khách tự bắt chuyện. `BARK` và `SHORT` KHÔNG tiêu vào trần này.
 */
const TALK_DEEP_PER_DAY = 2;

/**
 * Xác suất mở lời mặc định cho cuộc `NPC_ONLY` không khai `initiates`. Ba cái van ở trên
 * mới là thứ giữ nhịp; con số này chỉ quyết ai trong số những người đủ điều kiện.
 */
const TALK_INITIATE_BASE = 0.3;

/**
 * Người đi ngang bị ghim lại bao lâu sau khi mình bắt chuyện — đo bằng thời gian CÒN LẠI
 * sau cuộc, không phải một hằng số tính từ lúc mở.
 */
const PASSER_TALK_TAIL = 4;
/**
 * Một người đi ngang nói được mấy cuộc trong MỘT lần đi qua. `talkedThisVisit` chỉ chặn
 * mở LẠI cùng một cuộc, không chặn mở cuộc khác — nên trần phải nằm riêng ở đây.
 */
const PASSER_TALKS_MAX = 2;

/**
 * Quầy dơ tới mức nào thì LỌT VÀO KHUNG HÌNH — act `FILM`.
 *
 * Thấp hơn ngưỡng khách phàn nàn: ống kính xoi hơn mắt người đứng mua, và đó đúng là
 * chuyện người bán hàng sợ khi có người giơ máy lên.
 */
const DIRT_ON_CAMERA = 0.35;

/**
 * Quay xong thì mấy ngày nữa cái clip mới lên — bé Su còn phải dựng.
 *
 * Bốn ngày: đủ xa để người chơi quên mất mình đã cho quay, rồi lượng khách tự nhảy lên và
 * họ phải tự nối hai chuyện lại. Đó là cách một hệ quả dạy luật chơi mà không cần một
 * dòng chữ nào giải thích.
 */
const CLIP_DUNG_SAU = 4;
/**
 * CÂU CUỐI CÒN NỢ — người vừa nói chuyện còn được cầm micro ngần này giây sau khi phiên
 * đã đóng (xem `talkVoice`). ⚠️ Phải dài hơn `StallScene.REPLY_DELAY_SEC`.
 */
const TALK_VOICE_TAIL = 2.5;

/**
 * Lời bắt chuyện bị hoãn vì tay người chơi đang bận sống được bao lâu (giây thật). Quá
 * hạn thì HUỶ IM LẶNG, không phạt.
 */
const OFFER_DEFER_TTL_SEC = 90;
/** Giữ tối đa mấy lời đang treo. Hơn hai là người chơi không còn theo kịp ai đang đợi mình. */
const OFFER_QUEUE_MAX = 2;

/**
 * Xác suất hai người đi ngang chào nhau. Phải là THIỂU SỐ — ai gặp ai cũng chào thì cái
 * chào hết nghĩa. `GREET_SLOW` là chậm lại, KHÔNG phải dừng.
 */
const GREET_CHANCE = 0.25;
const GREET_REACH = 1.0;
const GREET_SLOW = 0.75;
/** Chậm lại trong ngần này giây rồi đi tiếp như cũ. */
const GREET_SLOW_SEC = 1.6;
/** Câu đáp nói sau câu chào ngần này giây — đủ để đọc ra là một lượt qua lại, không phải đồng thanh. */
const GREET_REPLY_SEC = 1.2;

/**
 * Bấm F với được xa bao nhiêu ô. Trong tầm thì người GẦN NHẤT thắng, kể cả người đi ngang
 * ngoài đường; không ai trong tầm thì rơi về người đứng đầu quầy.
 */
export const TALK_REACH = 3;

/** Mảng rỗng dùng chung — snapshot dựng mỗi lần hỏi, đừng cấp phát thêm rác mỗi nhịp. */
const EMPTY_STR: readonly string[] = [];

/**
 * Cái đơn còn "đang mở" tới mốc nào của quãng chờ — xem `practiceOf`. Phải đóng lại TRƯỚC
 * khi người ta bắt đầu sốt ruột (`t.impatient` ở 0,6).
 */
const ORDER_WINDOW = 0.35;

/** Mẻ vừa ra lò thì còn thơm bao lâu (giây THẬT) — xem `Service.ovenHot`. */
const OVEN_SMELL_SEC = 90;

/**
 * Bao nhiêu phần cảnh chào ngoài đường mang theo một tin đồn. Phải là THIỂU SỐ, nếu không
 * tin đồn hết là tin tức — nó thành tiếng ồn nền.
 */
const STREET_RUMOUR_CHANCE = 0.3;

/**
 * HẠN CỦA TỪNG VIỆC ĐÃ HỨA — giây THẬT, tính từ lúc nói. ⚠️ Không tính theo phút game:
 * đồng hồ game tua nhanh khi quầy trống, nên mọi lời hứa sẽ cùng hết hạn lúc rảnh nhất.
 */
const DEED_DUE: Record<string, number> = {
  ROT_TRA: 25, DUA_BANH: 15, BUNG_GANH: 15, LAY_SO: 40, DOI_DON: 20,
};

const DEED_LABEL: Record<string, string> = {
  ROT_TRA: "rót cho người ta ly trà", DUA_BANH: "đưa người ta miếng bánh",
  BUNG_GANH: "bưng giùm cái gánh", LAY_SO: "lấy giùm cuốn sổ", DOI_DON: "sửa lại cái đơn",
};

/**
 * BA NẤC NUỐT LỜI — nhắc một câu → nói nặng → bỏ đi, mốc tính theo BỘI của hạn. Người
 * nóng tính (`nongTinh ≥ 0,8`) bỏ nấc một; người lạ bỏ cả ba và đi luôn.
 */
const DEED_STAGES = [1.0, 1.6, 2.4] as const;

/**
 * Trọng số chi phí nhắm mục tiêu — xem `Service.talkCost`. `LATERAL` là trục DỌC QUẦY
 * (phân biệt được ai với ai); `DEPTH` xuyên qua mặt quầy, gần như hằng số nên nhẹ hơn.
 */
export const TALK_W_LATERAL = 1.0;
export const TALK_W_DEPTH = 0.45;
/** Người đứng đầu quầy là người mình đang phục vụ — mặc định phải là họ. */
export const TALK_B_FRONT = -0.9;
/** Người vừa mở lời với mình thắng tuyệt đối. */
export const TALK_B_ADDRESSED = -99;
/** Người đã từ chối lời mời: đừng chìa mặt ra làm mục tiêu nữa. */
export const TALK_P_REFUSED = 1.2;
/** Bám dính mục tiêu — cùng con số với `stations.STICKY`, để mục tiêu không nhấp nháy. */
export const TALK_STICKY = 0.62;

/**
 * Giữ lời thưởng VỪA PHẢI (nó chỉ là làm đúng điều mình nói); nuốt lời phạt NẶNG, nặng
 * hơn cả một lỗi đơn hàng.
 */
const PROMISE_KEPT = 45;
const PROMISE_SWAPPED = 55;
const PROMISE_BROKEN = 85;

/**
 * Chửi tới mức này thì người ta BỎ VỀ, không mua nữa (sau khi nhân `intensityMul`).
 * Ông Hải (nongTinh 0,9 → ×1,40) nổ ở `anger` 40; thầy Phúc (0,2 → ×0,70) phải 80.
 */
const STORM_OFF_ANGER = 55;

/** Giá một ổ. Kinh tế thật nằm ở phase P3. */
export const PRICE_BANH = 25_000;
/** Trà đá là MỜI, không bán: mỗi ly tốn ~350₫ đá + trà, tối đa 18 ly/ngày (P1-02 §2.8). */
export const TEA_COST = 350;
export const TEA_PER_DAY = 18;

/** P1-02 §2.3: tối đa 6 người được tính là "đang nhìn"; người thứ 7+ là khách qua đường. */
export const MAX_AUDIENCE = 6;

/** P0-01 §5: trần cứng 1 câu thoại MỚI mỗi frame. Câu thứ hai HOÃN, không bỏ. */
export const DIALOG_QUERIES_PER_FRAME = 1;
/** P1-04 §2.9: tối đa 2 bong bóng cùng lúc trên PC; câu chờ quá 2,5 s thì bỏ. */
export const MAX_BUBBLES = 2;
const QUEUE_EXPIRE_SEC = 2.5;
/**
 * HƠI THỞ giữa hai câu của CÙNG một người, tính bằng giây. Dưới 0,35 s thì câu sau bật
 * lên khi câu trước còn chưa mờ hết — mắt đọc ra là MỘT bong bóng đổi chữ.
 */
export const SAME_SPEAKER_GAP_SEC = 0.35;
/**
 * CẮT NGANG — câu mới phải hơn câu đang hiện ngần này điểm ưu tiên, và chỉ sau khi câu cũ
 * đã nằm trên màn hình `BARGE_IN_SEC` giây. 20 là chênh HẠNG, không phải chênh một chút.
 */
export const BARGE_IN_PRI = 20;
export const BARGE_IN_SEC = 1.2;
/**
 * TRẦN CỨNG cho quãng một câu phải đợi bong bóng của CHÍNH người nói. ⚠️ Thiếu trần thì câu
 * sau chết theo người nói: khách quay lưng là vòng dọn xoá mọi câu còn trong hàng đợi của
 * họ, im lặng. Nhân `readMul` để người đọc chậm được thêm giờ.
 */
export const HOLD_MAX_SEC = 3;

/**
 * Hệ số sức chờ theo CHỖ XẾP HÀNG: người xếp sau ba người đã BIẾT mình phải chờ nên chịu
 * được lâu hơn. NHÂN chứ không CỘNG (để khớp `rush` và `bond`), và chặn ở bậc thứ tư.
 */
const QUEUE_PATIENCE_STEP = 0.15;
const QUEUE_PATIENCE_CAP = 4;

export function queuePatienceMul(ahead: number) {
  return 1 + QUEUE_PATIENCE_STEP * Math.min(ahead, QUEUE_PATIENCE_CAP);
}

/**
 * "Hôm nay đông quá, thôi để bữa khác" — người tới đầu hẻm, ngó cái hàng, rồi QUAY ĐẦU. Mốc
 * "dài quá" suy từ `SLOTS.length`; hàng KÍN CHỖ trả thẳng `BALK_WHEN_FULL`. Trần 0,80.
 *
 * ⚠️ NGƯỢC CHIỀU với `queuePatienceMul` ngay trên (cái kia xảy ra SAU KHI đã xếp vào) — trộn hai
 * cái là phá hợp đồng ở `tests/p1-queue-patience`.
 */
const BALK_FROM_FILL = 0.6;
const BALK_AT_FROM = 0.2;
const BALK_MAX = 0.55;
const BALK_WHEN_FULL = 0.92;
const BALK_REL_MIN = 0.7;
const BALK_REL_MAX = 1.6;
const BALK_RUSH = 1.35;
const BALK_CEIL = 0.8;

/** Từ người thứ mấy thì cái hàng bắt đầu bị coi là dài. 6 chỗ → 4 · 4 chỗ → 3. */
export const balkFrom = (slots: number) => Math.max(1, Math.ceil(BALK_FROM_FILL * slots));

export function balkChance(o: {
  /** Mấy người đã đứng đó lúc người này tới. */
  ahead: number;
  /** Hàng chứa được mấy chỗ — LUÔN truyền `QUEUE_SLOTS.length`, đừng chép số. */
  slots: number;
  person: Personality;
  /** `visitProbabilityMul(mem)` — quan hệ. 1 = người lạ / người quen bình thường. */
  relVisitMul: number;
  /** `moodPatienceMul(dayMood)` — tâm trạng ngoài tầm kiểm soát hôm nay. */
  moodPatience: number;
  /** Đang trong khung giờ vội của người này. */
  rushing: boolean;
}) {
  if (o.slots <= 0) return 0;
  if (o.ahead >= o.slots) return BALK_WHEN_FULL;       // hết chỗ đứng — chuyện vật lý, không phải tính cách
  const from = balkFrom(o.slots);
  if (o.ahead < from) return 0;
  // Nội suy từ bậc "bắt đầu dài" tới bậc "còn đúng một chỗ trống".
  const span = Math.max(1, o.slots - 1 - from);
  const base = BALK_AT_FROM + (BALK_MAX - BALK_AT_FROM) * clamp01((o.ahead - from) / span);
  const rel = Math.min(BALK_REL_MAX, Math.max(BALK_REL_MIN, 1 / Math.max(0.01, o.relVisitMul)));
  const mood = 1 / Math.max(0.01, o.moodPatience);
  return Math.min(BALK_CEIL, base * intensityMul(o.person) * rel * mood * (o.rushing ? BALK_RUSH : 1));
}

/**
 * Chỗ người quay đầu dừng lại ngó — LÙI THÊM MỘT BẬC sau chỗ cuối hàng, suy từ khoảng
 * cách giữa hai chỗ cuối chứ không chép toạ độ. Phải là một điểm THẬT trên vỉa hè: xoá
 * khách ngay ở cổng thì người chơi chỉ thấy một buổi sáng vắng khách, không thấy luật.
 */
const BALK_LOOK = (() => {
  const n = SLOTS.length;
  const p = n >= 2 ? { x: 2 * SLOTS[n - 1].x - SLOTS[n - 2].x, y: SLOTS[n - 1].y } : { ...SLOTS[0] };
  return hitsWall(p.x, p.y) ? { x: SLOTS[n - 1].x, y: SLOTS[n - 1].y } : p;
})();
/** Đứng ngó một nhịp rồi mới quay lưng — không có nhịp này thì động tác đọc ra là "trượt chân". */
const BALK_LOOK_SEC = 0.8;

/**
 * Nép qua một bên mà KHÔNG có ai sau lưng để nhường thì đứng ngần này giây rồi vô lại
 * (`STEP_ASIDE`).
 */
const ASIDE_HOLD_SEC = 6;

const BARK_DELAY_MIN = 0.2;
const BARK_DELAY_SPAN = 0.2;
/** Chuỗi `followup` quá 6 giây không nói được thì bỏ (P2-01 §2.7 — thế giới đã đổi). */
const FOLLOWUP_EXPIRE_SEC = 6;
/** Khách chờ bánh được ngần này giây mà quầy yên thì có thể buông một câu chuyện phiếm. */
const SMALLTALK_AFTER_SEC = 4;
/**
 * Giữa hai lần khách QUAY SANG NHÌN MẶT người bán. Không phải cooldown của nút F — nó chỉ
 * chặn việc bấm F liên tục để ép gaze rời khỏi tay mình.
 */
export const ASK_COOLDOWN = 60;

/**
 * BONG BÓNG SỐNG BAO LÂU — tốc độ đọc của người đang LÀM VIỆC (`READ_CPS`) cộng thời gian
 * NHẬN RA (`NOTICE_SEC`). Sàn 2,8 s, trần 8 s (`MAX_BUBBLES` là 2).
 */
export const READ_CPS = 11;
export const NOTICE_SEC = 0.8;
export const BUBBLE_MIN_SEC = 2.8;
/**
 * Trần. ⚠️ Phải ĐỦ CAO để không cắt cụt dòng dài nhất của kho: 9 s cho tới ~90 ký tự,
 * dòng dài nhất đang có là 82. Test `B-1` giữ cả hai đầu.
 */
export const BUBBLE_MAX_SEC = 9;

/**
 * @param slow nhân thêm cho người đọc chậm — cỡ chữ lớn và chế độ không giới hạn thời
 *   gian đều là lời khai của người chơi rằng họ cần thêm giờ (`CANON` §15).
 */
export const bubbleLife = (text: string, slow = 1) =>
  Math.min(BUBBLE_MAX_SEC, Math.max(BUBBLE_MIN_SEC, NOTICE_SEC + text.length / READ_CPS)) * slow;

/**
 * Bong bóng của một LỜI BẮT CHUYỆN sống lâu hơn bark, vì nó MỞ RA một việc người chơi phải
 * làm. Dấu ba chấm bền trên vai (`StallScene.drawPendingTalk`) lo phần còn lại.
 */
export const OFFER_BUBBLE_SEC = 5.5;
export const offerBubbleLife = (text: string, slow = 1) =>
  Math.max(OFFER_BUBBLE_SEC * slow, bubbleLife(text, slow) + 1.5);

/** Nhân mặn (`kind: "nhan"`) — thứ làm nên ổ bánh. Rau / ớt / tương chỉ là đồ kèm. */
const NHAN_IDS: ReadonlySet<Ingredient> = new Set(INGREDIENTS.filter((i) => i.kind === "nhan").map((i) => i.id));

/**
 * Ổ RỖNG — ổ KHÔNG CÓ MIẾNG NHÂN MẶN NÀO thì không còn là món khách gọi, nó là "bánh mì
 * không" (10.000₫). Ngưỡng là "không một miếng nhân mặn nào", không phải "ổ trống trơn": để
 * ở ổ trống trơn thì lách được bằng một cọng rau.
 */
/**
 * Gọi người chưa biết tên bằng HÌNH DÁNG (xem `Service.label`) — suy từ `body` theo thứ tự
 * nón → kính → tóc → tạp dề → giỏ → dáng.
 *
 * ⚠️ TẠM: chỗ đúng của mấy chuỗi này là một trường trong `content/npcs.ts`.
 */
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

/**
 * Miếng nhân ĐẦU TIÊN mà người ta gọi — chỗ trống `{mon}` của câu nói về ổ chưa có nhân.
 * Gọi hai ba nhân thì chỉ kể một: câu nói của một người, không phải cái phiếu kiểm.
 */
export function hollowWantLabel(spec: OrderSpec) {
  const first = INGREDIENTS.find((i) => NHAN_IDS.has(i.id) && (spec.levels[i.id] ?? 0) > 0);
  return first ? first.label : "nhân";
}

export type ServiceEvent =
  | { kind: "log"; text: string }
  /** Khách quên tiền, mua chịu — scene hỏi người chơi có GHI sổ không (P3-03 §2.6). */
  | { kind: "credit"; record: DebtRecord; name: string }
  /** Khách trả nợ bữa trước — số họ NHỚ (ghi rồi thì là số đã ghi). */
  | { kind: "repay"; amount: number; npcId: string; name: string }
  | { kind: "paid"; amount: number; item: "dish"; tip: number }
  | { kind: "cost"; amount: number; item: "tea" | "talk" }
  /** P5-01 — khách vừa tự bắt chuyện. Scene hiện gợi ý "F để trả lời"; làm lơ cũng được. */
  | { kind: "talkOffer"; npcId: string; name: string }
  /**
   * Đưa đồ trên tay người chơi cho một người (`GIVE_BREAD`). ⚠️ Phải đi qua đây, KHÔNG
   * được tự đặt `this.playerHand` — `StallScene` gán lại nó MỖI FRAME.
   */
  | { kind: "takeHand"; npcId: string; name: string };

/** Một nhịp của cuộc trò chuyện, đủ cho UI vẽ. T3: không một con số nào ở đây. */
export type TalkView = {
  npcKey: string;
  name: string;
  /** Câu khách vừa nói — `opener`, hoặc `reply` của đúng lựa chọn vừa bấm. */
  line: string;
  /** Khách cố ý KHÔNG đáp. Bảng vẽ "…" chứ không vẽ một ô trống (P2-02 §2.3). */
  silent: boolean;
  /** Câu NGƯỜI CHƠI vừa chọn — scene vẽ nó thành bong bóng trên đầu cô Ba. */
  said?: string;
  /**
   * Cảm xúc khách nói câu đó — bảng vẽ một huy hiệu mặt bên cạnh. Vắng = không vẽ gì
   * (và mặt trên người họ vẫn đổi như cũ, suy ra từ hệ quả).
   */
  mood?: TalkMood;
  /** Màu da / màu tóc của chính người này — huy hiệu mặt phải ra đúng người. */
  skin: number;
  hair: number;
  /**
   * Người đang nói đứng ở đâu, theo Ô BẢN ĐỒ. Scene chiếu sang toạ độ màn hình để NEO
   * thẻ lựa chọn cạnh họ (P2-06 §4.2) — thay cho cái bảng đáy che trọn người.
   */
  at: { x: number; y: number };
  options: readonly { say: string; tone: TalkTone }[];
  /** Hết chuyện: UI đóng bảng sau khi người chơi đọc xong câu cuối. */
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
  /**
   * Hai bộ đếm trò chuyện của NGÀY, trỏ thẳng vào `world.progress.today` (P2-06 §2.6).
   * Vắng (test dựng Service trần) thì Service tự đếm trong bộ nhớ.
   */
  todayCounters?: { talksDeep?: number; talkOffers?: number };
  /** Nhân tuổi thọ bong bóng cho người đọc chậm (cỡ chữ lớn / không giới hạn giờ). */
  readMul?: number;
  /** `world.dialogState` — trí nhớ ngắn của rule DB. Vắng (test) thì dùng bản tạm. */
  dialog?: DialogState;
  /** `world.gossip` — tin đồn trong đầu từng người (P2-04). Vắng thì hẻm không ai kể ai. */
  gossip?: GossipState;
  /** `world.notebook` — sổ tay cô Ba (P2-05). Máy ghi cột trái vào đây. */
  notebook?: Notebook;
  /** Hệ số khách vãng lai của chỗ đứng hôm nay (P3-05). */
  standMul?: number;
  /** P3-05 — người quen đang theo mình tới chỗ này (null = ở đầu hẻm, ai cũng ghé). */
  followers?: string[] | null;
  /** Hôm nay chỗ này không bán được (đám cưới chắn hẻm, ngập chợ…). */
  standClosed?: boolean;
  /** Hệ số sức chờ của chỗ đứng (văn phòng không ai chờ nổi). */
  patienceMul?: number;
  /** Hệ số ánh nhìn: trời (mưa thì ít nhìn) × chỗ đứng (cổng trường ai cũng cắm mặt điện thoại). */
  gazeMul?: number;
  /** `world.money.debtsOwedToPlayer` — sổ nợ khách. Vắng thì không ai mua chịu. */
  debts?: DebtRecord[];
  /** Tiền lẻ còn trong két (P3-03 §2.8). Vắng thì coi như luôn đủ lẻ. */
  till?: { floatLeft: number };
  allowFalseMemory?: boolean;
  /** `world.equipment` — đồ nghề trên xe (P3-04). */
  equip?: EquipState;
  /** Loa rao đang mở không (bị hàng xóm bắt tắt thì false). */
  loaOn?: boolean;
  /** P4 — chuyện của mùa (arc 12 người, sự kiện nội dung). Vắng = chỉ có lịch nền (test cũ). */
  story?: StoryState;
  /** Chế độ không giới hạn thời gian: một khách một lượt (P4-02 §4). */
  noTimePressure?: boolean;
};

type Visit = { at: number; npc: NpcDef | null; seq: number; plan?: VisitPlan; defer?: number };
/**
 * Chỗ người đi ngang dừng lại — cạnh hàng chờ, không chen vào hàng. ⚠️ Toạ độ thế giới DUY
 * NHẤT không nằm trong `world/map.ts`, nên `assertWalkable()` không soi tới.
 */
const PASS_SPOT = { x: 16.5, y: 8.4 };
type Pending = {
  c: Customer; text: string; tier: 1 | 2 | 3; delay: number; log: boolean
  /** Độ ưu tiên (salience) — câu gọi món và câu phản ứng nặng được nói trước. */
  pri: number; waited: number;
  /** Đã đứng đợi bong bóng của CHÍNH người nói bao nhiêu giây — trần `HOLD_MAX_SEC`. */
  held: number;
  /** Rule sinh ra câu này — ghi nhận đã-nói + applycontext + followup LÚC NÓI, không lúc chọn. */
  rule?: Rule;
  /** Đây là LỜI BẮT CHUYỆN — bong bóng sống lâu hơn (`offerBubbleLife`). */
  offer?: boolean;
};
type Followup = { c: Customer; concept: string; at: number };

/**
 * Lượt ghé vừa rồi ĐI RA SAO, theo cách người khách sẽ nhớ nó. `GRIT` = ổ đã nằm dưới đất mà
 * người này KHÔNG thấy lúc nó rớt, và nó THẮNG `DEFECT` khi hai cái cùng xảy ra.
 */
type ServeOutcome = "CLEAN" | "DEFECT" | "WAITED" | "GRIT";

/** Mỗi lượt hỏi rule DB kèm các fact Session của tình huống (P2-01 §2.3.1). */
type Extra = Record<string, string | number | boolean>;

const LEAVE_REASON: Record<LeaveReason, BusLeaveReason> = {
  served: "SERVED", impatient: "IMPATIENT", closed: "CLOSED", soldout: "SOLD_OUT",
  refused: "REFUSED", insulted: "SILENT_EXIT", balked: "BALKED", soiled: "SOILED_FOOD",
};

/** Sự kiện được phản ứng bằng lời NGAY khi khách NOTICED (P1-02 §2.9). */
const NOTICE_SPOKEN: ReadonlySet<StimId> = new Set<StimId>(["DROPPED_FOOD", "BURNT_OR_COLD", "DIRTY_HANDS", "WRONG_NAME", "FLOURISH"]);

const TIP_RATE: Record<RelTier, number> = { RIVAL: 0, ACQUAINTANCE: 0.045, FRIEND: 0.11 };
/** REMEMBERED_USUAL tầng T-A (khách nói "như mọi bữa" rồi làm đúng) = 70; T-B (tự làm trước) = 90. */
const REMEMBERED_USUAL_TA = 70;
const REMEMBERED_USUAL_TB = 90;
const FREE_EXTRA_BASE = 25;
const FREE_EXTRA_DIMINISH = [1.0, 0.6, 0.25];
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/**
 * Ổ ĐÃ NẰM DƯỚI ĐẤT — cờ `soiled` đi theo TỪNG Ổ, không theo người chơi; chia hai nhánh theo
 * việc người đó CÓ THẤY KHÔNG.
 *
 * ⚠️ `SOILED_GRIT` 30 phải NHỎ HƠN HẲN 95, nếu không nước đi tối ưu thành "cứ đưa đại". Răn thật
 * nằm ở `occurrences` cộng dồn, và ở chỗ `servedWell()` / `disprove()` không chạy.
 */
const SOILED_CAUGHT = 95;
const SOILED_GRIT = 30;
/** Toast cho `res.ok === false` — ngắn, vì nó hiện ngay trên đầu người vừa lắc đầu. */
const SOILED_REFUSE_TOAST = "khách thấy ổ đó rớt rồi";

/**
 * Ổ CHƯA CÓ NHÂN — thiếu miếng đồ chua là tay làm sai, ổ trống là CHƯA LÀM, nên nó KHÔNG qua túi
 * im lặng và có concept riêng `HOLLOW_LOAF`. Chỉ người vừa điềm đạm vừa dễ tha nhận
 * (`takesHollowLoaf`, 5/12); trả lại thì ổ Ở LẠI TRONG TAY người chơi và đồng hồ chờ vẫn chạy.
 */
const HOLLOW_REFUSED = 55;
/** Toast cho `res.ok === false` — ngắn, vì nó hiện ngay trên đầu người vừa lắc đầu. */
const HOLLOW_REFUSE_TOAST = "khách không nhận — ổ chưa có nhân";

/** Xem khối `HOLLOW_REFUSED`. Chỉ người vừa điềm đạm vừa dễ tha mới cầm ổ trống cho xong. */
export const takesHollowLoaf = (p: Personality) => p.nongTinh <= 0.4 && p.deTha >= 0.7;

/**
 * Ổ NƯỚNG CHƯA TỚI — một LỖI thật, mượn `WRONG_TEMP` chứ không thêm kind mới; nguội và non tách
 * ở tầng THOẠI bằng fact `dishUnderdone`.
 *
 * ⚠️ TRẦN 0,90 chứ không 1,0: ký ức ghi 90 × mag², nên mag 1,0 ra đúng 90 — hơn cả
 * `BURNT_OR_COLD` (80), mà bánh non không được nặng bằng bánh cháy.
 */
const UNDERDONE_FLOOR = 0.35;
const UNDERDONE_CEIL = 0.9;
const UNDERDONE_LABEL = "bánh chưa giòn";
const UNDERDONE_TEXT = "bánh nướng chưa tới";

/**
 * Mốc đổi MẶT khi có lỗi: ổ nướng non một chút không được mang cùng cái mặt với ổ quên
 * miếng chả. 40 = chỗ một `ORDER_DEFECT` bắt đầu ăn 8 điểm quan hệ (×`REL_K_NEG` 0,2).
 */
const DEFECT_FACE_I3 = 40;

/**
 * `relationship:moved` — T3: một CHIỀU, một mức ĐẬM/NHẠT, một mẩu chữ. Sàn 2 (cũng đúng bằng
 * `EPSILON` của `sim/memory.ts`): lượt nào cũng in một dòng thì dòng đó hết nghĩa.
 */
const REL_MOVE_MIN = 2;
const REL_MOVE_STRONG = 8;

/**
 * Câu chào từ biệt đi sau câu nhận bánh, mà mỗi người chỉ có MỘT bong bóng
 * (`Customer.speak` ghi đè). 1,8 s quá mốc sống ngắn nhất của bong bóng nên câu trước kịp
 * đọc hết, và vẫn còn kịp nói trước khi người ta ra tới cổng.
 */
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
  /** Mốc phản ứng gần đây của cả hàng — chống twinning (P2-02 §5.3). */
  private reactAt: number[] = [];
  private dialogRng: Rng;
  private queue: Pending[] = [];
  private offStim: () => void;
  private nowSec = 0;
  private stimSeq = 0;
  private freeExtraToday = new Map<string, number>();
  /**
   * Lượt ghé đã được tính vào chuỗi "cho thêm" rồi (theo `customer.id`). Cần, vì một người
   * mua HAI ổ thì `serveDish` chạy hai lần cho cùng một lượt ghé. Chỉ sống trong buổi bán.
   */
  private habitSettled = new Set<string>();
  /**
   * Lượt ghé đã bị lắc đầu vì ổ chưa có nhân (theo `customer.id`) — xem `HOLLOW_REFUSED`.
   * Vết nhớ và câu nói ghi đúng một lần; lần đưa thứ hai chỉ còn tốn thời gian.
   */
  private hollowShown = new Set<string>();
  /** Lượt ghé nào đi ra sao (theo `customer.id`) — `farewell()` đọc rồi xoá. */
  private serveOutcome = new Map<string, ServeOutcome>();
  /**
   * Mẩu lý do NỔI BẬT NHẤT của khoảnh khắc đang gom cho `relationship:moved` — nhiều
   * `record()` trong một lần giao bánh gộp lại thành MỘT dòng. T3: chữ thường, không số.
   */
  private relNote: { text: string; w: number } | null = null;
  /** Ly trà đã mời cho từng người HÔM NAY — trần và mức nhỏ dần đếm theo ngày (§8i). */
  private teaToday = new Map<string, number>();
  private devSeq = 0;
  /** P5-01 — cuộc trò chuyện đang mở (bảng lựa chọn đang hiện, đồng hồ đang đứng). */
  private talkSession: TalkSession | null = null;
  private talkWith: Customer | null = null;
  /**
   * AI CÒN MỘT CÂU CHƯA KỊP NÓI RA — KHÔNG phải `talkWith`.
   *
   * ⚠️ `chooseTalk` gọi `endTalk()` ngay trong nhịp cuối, nên `talkWith` đã là `null` trước khi
   * scene kịp đưa câu đáp ra màn hình. Quyền nói sống lâu hơn phiên `TALK_VOICE_TAIL` giây.
   */
  private talkVoice: Customer | null = null;
  private talkVoiceUntil = 0;
  /**
   * Khách đã tự bắt chuyện và đang chờ được trả lời — HÀNG ĐỢI, không phải một ô. Với một
   * ô thì hai người cùng muốn bắt chuyện là người thứ hai im suốt lượt ghé, vì
   * `smalltalked.add(c.id)` đã chạy trước `offerTalk()`.
   */
  private offers: { c: Customer; talk: Talk; at: number }[] = [];
  /** Nội dung trò chuyện, nạp theo từng người lúc họ đi vô (P5-01 luật 4). */
  readonly talks = new TalkStore();
  private lastOfferAt = -Infinity;
  /**
   * Hai bộ đếm của ngày nằm trong SAVE (`progress.today`), không phải trong instance: "lưu
   * và về sảnh" rồi vào lại giữa buổi dựng một `Service` mới, nên để ở field thì cái van
   * 2 cuộc/ngày lách được bằng đúng một lần thoát ra vào.
   */
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
  /** Dự phòng khi không có save (test headless dựng Service trần). */
  private deepLocal = 0;
  private offersLocal = 0;
  /**
   * Cuộc đã rút cho một lượt ghé nhưng người chơi bỏ ngang trước khi nói câu nào. ⚠️ Phải
   * giữ lại: rút lại mỗi lần mở thì mở–Esc–mở là một cái máy reroll nội dung.
   */
  private heldTalk = new Map<string, Talk>();
  /**
   * Cuộc đã nghe trong lượt ghé NÀY, cho người KHÔNG CÓ TÊN. ⚠️ Không ghi vào
   * `mem(memKey).talksDone` được: `memKey` của người lạ là `walkin<dáng>`, tám dáng dùng chung
   * một sổ cho cả mùa.
   */
  private talkedThisVisit = new Map<string, string[]>();
  /**
   * NGƯỜI ĐI NGANG NÀY ĐÃ DỪNG LẠI MẤY LẦN — đếm MỌI cuộc, kể cả cuộc túi dùng chung.
   * Không đếm bằng `talkedThisVisit` được: nó cố ý KHÔNG ghi cuộc `ANY`.
   */
  private passerTalks = new Map<string, number>();
  /** Người chơi đã CHỌN ít nhất một câu trong cuộc đang mở chưa. */
  private talkEngaged = false;
  /** Cuộc đang mở là do khách bắt chuyện trước (chứ không phải người chơi bấm F). */
  private talkNpcOpened = false;
  /**
   * Điểm quan hệ đã kiếm được TRONG cuộc đang mở — act `INVITE` đọc nó. Cộng từ `rel` người
   * viết khai, chứ không đo `relNow()` trước/sau: người đi ngang và khách vãng lai đều
   * không có `npc`, nên `relNow()` của họ luôn là 0 — mà đó đúng là những người được mời.
   */
  private talkWarmth = 0;
  /** Mục tiêu của frame trước — để bám dính (`TALK_STICKY`), không nhấp nháy. */
  private lastTarget: Customer | null = null;
  /**
   * Câu đáp do HÀNH ĐỘNG quyết, không do lựa chọn — hiện tại chỉ có act `INVITE`. Người
   * viết khai cả hai câu, cái roll chọn một; `chooseTalk` lấy câu này thay cho `reply`.
   */
  private actReply: { text: string; mood: TalkMood } | null = null;
  /** Lời hứa đang treo của từng lượt ghé (theo `customer.id`) — P5-02. */
  private pledges = new Map<string, { promised: string[]; discount: number; free: boolean }>();
  /** Ly trà còn lại hôm nay. */
  teaLeft = TEA_PER_DAY;
  /** Độ bẩn quầy 0..1 (P1-02 §2.10) — scene đặt mỗi frame. */
  dirt = 0;
  /** Tay người chơi vừa cầm tiền, chưa rửa — scene đặt mỗi frame (fact `playerHandsDirty`). */
  handsDirty = false;
  /**
   * NGẮT QUÃNG ĐƯỢC KHÔNG — scene đặt mỗi frame; van NGỮ CẢNH, khác ba van tần suất ở trên.
   * `false` ở bảy cửa sổ cấm (cầm ổ nóng, bảng kẹp nhân mở, FLOURISH, lò SÉM, `handsBusy`,
   * khách đang gọi món, còn đồ rơi dưới sàn). Mặc định `true` để headless chạy như cũ.
   */
  interruptible = true;
  /**
   * Hết sạch bánh mì (kho + lò + thớt + tay) — scene đặt mỗi frame. Khách tới là về không
   * (P3-03 §2.3 OUT_OF_STOCK): người quen nhớ, và người quen lâu nhớ nặng hơn.
   */
  soldOut = false;
  soldOutCount = 0;
  /**
   * LÒ ĐANG CÓ Ổ TRONG — scene đặt mỗi frame (`oven.count > 0`). Headless không có lò
   * nên nó ở `false`, và đó là thật: một cái bot không nướng gì thì không thơm.
   */
  ovenBusy = false;
  /** Giây mẻ cuối ra lò — `ovenHot` đo cái đuôi mùi bánh tính từ mốc này. */
  private lastBatchOutAt = -Infinity;
  private wasOvenBusy = false;

  /**
   * CÁI XE ĐANG CHẠY — lò có ổ, HOẶC đã bán được ổ nào hôm nay. ⚠️ Khác `w.ovenHot` của
   * bảng đen; xem khối ở `ovenHot` ngay dưới.
   */
  get stallRunning() { return this.ovenBusy || this.servedCount > 0; }

  /**
   * CÓ MÙI BÁNH KHÔNG — thứ `w.ovenHot` của bảng đen nói tới. ⚠️ Phải tách khỏi `stallRunning`:
   * bảng đen khai fact này là "lò đang nhen / mẻ vừa ra", và mùi bánh không tắt ngay lúc rút ổ
   * ra khỏi lò (`OVEN_SMELL_SEC` là cái đuôi đó).
   */
  get ovenHot() { return this.ovenBusy || this.nowSec - this.lastBatchOutAt < OVEN_SMELL_SEC; }
  /** Chuyện có giờ trong ngày (cúp điện 7h15 ngày 24…). */
  private storyTimeline: { at: number; text: string }[] = [];
  private walkinIdx = 0;
  // ── người qua đường (sim/passersby.ts) ─────────────────────────────────────
  /** Còn bao nhiêu GIÂY THẬT nữa thì có người kế tiếp đi ngang. */
  private passerIn = 0;
  private passerSeq = 0;
  /**
   * Vị trí người chơi trong thế giới — scene đặt mỗi frame; `talkTarget` cần nó để chọn
   * người gần nhất. Vắng (test headless) thì F rơi về người đứng đầu quầy như cũ.
   */
  playerAt: { x: number; y: number } | null = null;
  /** Tay người chơi đang cầm gì — scene đặt mỗi frame. Headless: tay không. */
  playerHand = "empty";
  /** Người chơi đã bước ra khỏi khu quầy chưa — scene đặt mỗi frame. */
  playerOnStreet = false;
  /** Còn ô hóng mát trống không (`STAND_IN_SHADE`) — scene đặt mỗi frame. */
  shadeFree = false;
  /** Còn ghế trống không (`THEY_SIT`) — `tickWorldFacts` đặt mỗi frame. */
  seatFree = false;
  /**
   * Còn mấy ổ trong giỏ — scene đặt mỗi frame. Khác `soldOut` (ngưỡng 0): "còn mấy ổ
   * cuối" là một NGƯỠNG, và ba nút của `qua-duong` hỏi đúng cái ngưỡng đó.
   */
  stock = 0;
  /**
   * SÁNG NAY NGƯỜI NÀY ĐÃ KỂ CHUYỆN GÌ — tầng `d.*`, khoá theo `memKey` chứ không theo lượt ghé.
   * Không cần dọn: `Service` sống đúng một buổi bán.
   */
  private toldToday = new Map<string, string[]>();
  /**
   * KÝ ỨC VỪA ĐƯỢC TRUY HỒI cho nhịp đang mở. `null` = không nhớ ra chuyện gì khớp, và lúc
   * đó `m.remembers` sai nên mọi câu nhắc chuyện cũ KHÔNG TỒN TẠI — nội dung không gọi tên
   * một chuyện cũ, nó NHẬN một chuyện cũ.
   */
  private recalled: Recalled | null = null;
  /**
   * LỜI HỨA ĐANG TREO — mỗi món một hạn giây thật và một bộ đếm nấc. Sống trong `Service`
   * (một buổi bán) chứ không trong save; lời hứa QUA ĐÊM là chuyện của `obligations.ts`.
   */
  private deeds: { c: Customer; deed: Deed; dueAt: number; nudged: number }[] = [];
  /** `forSec` của lần dạt ra gần nhất — `asideDone` đọc để biết nép tới chừng nào. */
  private asideFor = new Map<string, ForSec>();
  /** Thứ tự tới, tăng dần — nguồn duy nhất của `Customer.arrivedSeq`. */
  private arriveSeq = 0;
  /** Người đang nói chuyện đã bị chọc giận TRONG cuộc này chưa (P2-07 §3.3). */
  private talkAngered = false;
  /** Vía mở hàng (P3-01 §2.6) — quyết ở lượt khách ĐẦU TIÊN, không một pixel UI nào. */
  via: ViaMood = 0;
  viaSettled = false;
  private opening: OpeningFacts = { walkedAway: false, complained: false, noChange: false, paidExact: false, smiled: false, friend: false };
  private dirtRemarked = false;

  servedCount = 0;
  lostCount = 0;
  /**
   * Mấy người ngó thấy hàng dài rồi quay về. CỐ Ý tách khỏi `lostCount` — xem nhánh
   * `balked` trong `leave()`. Để đây cho dev overlay và cho việc tune, không cho màn tối.
   */
  balkedCount = 0;
  /** Câu thoại tới hạn nhưng phải hoãn sang frame sau vì trần 1 câu/frame hoặc 2 bong bóng. */
  dialogDeferred = 0;

  readonly out: ServiceEvent[] = [];

  constructor(private deps: ServiceDeps) {
    this.dialogRng = deps.hub.stream("dialog-shufflebag");
    this.barks = new Barks(this.dialogRng, deps.bags, deps.day);
    this.speaker = new Speaker(this.dialogRng, deps.bags, deps.day, deps.dialog, 0);
    if (has(deps.equip, "BINH_TRA")) this.teaLeft = 40;                  // P3-04 D3: ~8 → ~40 ly/ngày
    // Tầng thoại dùng chung không gắn với ai, nên không lượt ghé nào `ensure` nó — không nạp
    // ở đây thì `ANY` mãi là một mảng rỗng.
    this.talks.ensure(SHARED_POOL);
    this.buildSchedule();
    if (deps.story) this.storyTimeline = timeline(deps.day, { atAlley: !deps.followers });
    const cut = deps.resumeAt ?? -1;
    this.storyTimeline = this.storyTimeline.filter((x) => x.at > cut);
    this.schedule = this.schedule.filter((v) => v.at > cut);

    // Tầng nhận thấy NGHE bus — không ai gọi thẳng vào nó (P0-01 §2.5 nguyên tắc 3).
    if (deps.notebook) beginDay(deps.notebook, deps.day);
    this.offStim = deps.bus.on("stim:emitted", (s) => {
      if (s.stimId === "DROPPED_FOOD" && this.deps.notebook) this.deps.notebook.today.dropped++;
      // SK-12 — bé Su giơ điện thoại lần đầu (ngày 5): làm đẹp hẳn lên trước ống kính
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
      // Tiếng động lớn kéo mắt cả hàng về tay người bán (trừ ai đang dán mắt vô điện thoại).
      if (spec.channel === "AUDIO_AMBIENT") for (const c of this.customers) c.loudCue = true;
    });
  }

  dispose() {
    this.offStim();
    this.endTalk();
    this.offers = [];
    this.talks.clear();
  }

  /**
   * Lịch khách cả buổi. Giờ cao điểm 6h30–8h dày khách hơn hẳn (CANON §13.3).
   * Sinh từ một dòng số RIÊNG của (ngày, "npc-schedule") — không phụ thuộc người chơi
   * làm gì trong ngày (P0-02 §2.3).
   */
  private buildSchedule() {
    const rng = this.deps.hub.derive("npc-schedule");
    const list: Omit<Visit, "seq">[] = [];
    // 12 người có tên: theo lịch sinh hoạt (P2-03 §2.9) — thứ nào, mấy giờ, khả năng bao nhiêu
    if (this.deps.standClosed) { this.schedule = []; return; }
    const ctx = this.arcCtx();
    for (const npc of NPCS) {
      const m = this.mem(npc.id);
      // trí nhớ → lịch (P2-03 §2.10): người đang giận ghé thưa hơn, người thân ghé đều hơn
      const t0 = rollVisit(npc.schedule, this.deps.day, rng, visitProbabilityMul(m) * this.rumourMul(npc.id, 0.9, 1.1));
      // P4-01 arc: hôm nay người này có gì khác (vắng theo chuyện KHÔNG tính là lỡ — không phải lỗi người chơi)
      const arc = ctx ? arcToday(npc.id, ctx, t0) : null;
      if (arc?.absent) continue;
      const t = arc?.at ?? t0;
      if (t === null || m.gone) continue;
      // ngày 40 ai cũng tìm tới cái xe, đứng ở đâu cũng vậy (P4-04 §2.7 sàn tuyệt đối)
      const followsHere = !this.deps.followers || this.deps.day === 40 || this.deps.followers.includes(npc.id);
      if (arc?.pass) { if (followsHere) list.push({ at: Math.max(DAY_START_MIN + 2, t), npc, plan: arc }); continue; }
      // Có lịch hôm nay = một lần ghé mà người chơi có thể LỠ (decay chỉ đếm lần lỡ, không đếm ngày)
      m.expectedDay = this.deps.day;
      m.expectedAt = t;
      // Người im lặng đang "vắng n ngày" (P2-02 §4.6): chỗ 7h35 trống — và vẫn tính là lỡ
      if (m.absentUntil >= this.deps.day) continue;
      // dời chỗ rồi mà người này không đi theo: lần ghé đó bị LỠ (quan hệ nguội dần) — P3-05 CD-2
      if (this.deps.followers && this.deps.day !== 40 && !this.deps.followers.includes(npc.id)) continue;
      list.push({ at: Math.max(DAY_START_MIN + 2, Math.min(DAY_END_MIN - 12, t)), npc, plan: arc ?? undefined });
    }
    // người đi ngang ngoài lịch + khách có kịch bản (P4-03)
    if (ctx) {
      for (const x of extraVisits(ctx)) {
        const npc = x.npcId ? NPCS.find((n) => n.id === x.npcId) ?? null : null;
        if (npc && this.mem(npc.id).gone) continue;
        // dời chỗ rồi (P3-05): người đi ngang đầu hẻm không đi ngang chỗ mới — trừ ai đã theo mình
        // khách có kịch bản là chuyện CỦA CÁI HẺM — xe dời đi thì chuyện đó diễn ra ở chỗ mình không đứng
        if (this.deps.followers && this.deps.day !== 40 && (!npc || !this.deps.followers.includes(npc.id))) continue;
        list.push({ at: x.at, npc, plan: x });
      }
    }
    // khách vãng lai: dày ở giờ cao điểm 6h30–8h (CANON §13.3); ~1/3 nhịp bỏ trống vì
    // người có tên giờ đã tự tới theo lịch
    let t = DAY_START_MIN + 8;
    while (t < DAY_END_MIN - 10) {
      const peak = t >= PEAK_START_MIN && t < PEAK_END_MIN;
      // P4-02 §2.7: 14–18 khách/ngày ở Hồi I, đỉnh 22–28 sau clip bé Su — người có tên ~8, còn lại là vãng lai
      t += peak ? 6 + rng.next() * 7 : 15 + rng.next() * 16;
      if (t >= DAY_END_MIN - 10) break;
      // ngày 40: sau 10 giờ hẻm vắng hẳn — không ai tới trước chị Lan (P4-04 §2.2 "18 phút lặng")
      if (this.deps.story && this.deps.day === 40 && t >= 10 * 60) continue;
      // P3-01 §2.4.4: trời + sự kiện nhân KHÁCH VÃNG LAI (người có tên không bị trời bớt)
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

  /**
   * Đơn ruột KHÔNG vào save. Người có tên: câu NGUYÊN VĂN của P4-01 (có thể đổi theo arc —
   * chị Hạnh đổi chữ, anh Bảo được dạy ăn cay). Khách vãng lai: suy ra từ seed + id.
   */
  private usualOf(id: string, atMin = 0): OrderSpec {
    const ctx = this.arcCtx();
    const authored = ctx ? authoredUsual(id, ctx, atMin) : null;
    if (authored) return authored;
    let u = this.usual.get(id);
    if (!u) this.usual.set(id, (u = makeUsual(Rng.forSeason(this.deps.saveId, id))));
    return u;
  }

  /** ArcCtx cho content/arcs — null khi không có chuyện (test P1–P3 chạy như cũ). */
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

  /** Câu nói có hẹn giờ của một lượt ghé. `delay` tính từ bây giờ; câu thứ n không rào thì cách nhau ~2,6 s. */
  private queueLines(c: Customer, lines: readonly Line[] | undefined, base = 0.8) {
    let t = this.nowSec + base;
    for (const l of lines ?? []) {
      const o = typeof l === "string" ? { text: l } : l;
      const when = o.delay !== undefined ? this.nowSec + o.delay : t;
      c.script.push({ at: when, text: o.text, by: o.by });
      t = when + 2.6;
    }
  }

  /**
   * "Như mọi bữa" chỉ được nói khi: là NPC có tên, VÀ người chơi đã NGHE họ đọc nguyên
   * đơn ít nhất hai lần. (Bổ sung của bản dựng — dạy trước rồi mới kiểm, giữ T3.)
   */
  private canAskUsual(npc: NpcDef | null, m: NpcState) {
    return npc !== null && m.heard >= 2;
  }

  /**
   * Sức chờ T — P1-02 §2.7: base × (vội ? 0,65 : 1) × {Rival 0,8 · Acq 1,0 · Friend 1,35},
   * NHÂN THÊM hệ số hàng chờ (bổ sung của bản dựng — xem `queuePatienceMul`), rồi CỘNG
   * `PATIENCE_BONUS_SEC` sau cùng.
   */
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
    /*
     * Trần thông lượng: `days.json` viết tay `target.peak` cho từng ngày — tối đa mấy khách
     * VÃNG LAI cùng đứng ở quầy. Chỉ đếm khách vãng lai; chế độ không giới hạn thời gian ép
     * trần về 1 và đếm MỌI người. Quá trần thì lượt ghé đó DỜI LẠI một phút, không mất.
     */
    const unlimited = !!this.deps.noTimePressure;
    if (!plan?.pass && (unlimited || !npc)) {
      // người đang quay đầu không chiếm chỗ nào: đừng để họ dời lịch của người sau
      const standing = this.customers.filter((x) => x.phase !== "leaving" && !x.pass && !x.balking && (unlimited || !x.npc));
      if (standing.length >= peakCap(this.deps.day, unlimited)) {
        this.schedule.unshift({ ...v, at: nowMin + 1 });
        this.schedule.sort((a, b) => a.at - b.at);
        return;
      }
    }
    if (!npc && this.via !== 0 && this.deps.hub.derive(`via:${v.seq}`).next() > viaWalkInMul(this.via)) return;
    // Mỗi lượt ghé có dòng số RIÊNG, sinh từ (ngày, số thứ tự lượt).
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

    // Mood từ dòng số RIÊNG của (ngày, lượt ghé) — không đọc gì của người chơi (P2-02 §5.2)
    const mood = rollMood(this.deps.hub.derive(`mood:${v.seq}`), this.deps.day);
    // Đã có mấy người đứng trước lúc người này tới. Tính ở ĐÂY một lần, chứ không theo chỗ
    // đứng hiện thời: họ đã chấp nhận cái hàng mà họ NHÌN THẤY lúc xếp vào. Người đang bỏ
    // đi, người chỉ đi ngang và người đang quay đầu thì không tính.
    const ahead = this.customers.filter((x) => x.phase !== "leaving" && !x.pass && !x.balking).length;

    /*
     * "Đông quá thôi để bữa khác" — xem `balkChance` ở đầu file. Ba trường hợp KHÔNG bao giờ
     * quay đầu: lượt ghé có kịch bản, chế độ không giới hạn thời gian, và người đi ngang.
     *
     * ⚠️ Dòng số RIÊNG `balk:` chứ không rút ké từ `visit:`.
     */
    const balking = !plan && !this.deps.noTimePressure
      && this.deps.hub.derive(`balk:${v.seq}`).next() < balkChance({
        ahead, slots: SLOTS.length, person,
        relVisitMul: visitProbabilityMul(m), moodPatience: moodPatienceMul(mood),
        rushing: !!npc?.rush && nowMin >= npc.rush[0] && nowMin < npc.rush[1],
      });
    // Quay đầu ở đầu hẻm KHÔNG phải một lượt ghé: không gọi món, không nhận bánh.
    if (!plan?.pass && !balking) m.visits++;           // đi ngang cũng không phải một lượt ghé
    m.lastSeenDay = this.deps.day;

    const c = new Customer(
      id, memKey, name, person, style, npc, this.usualOf(memKey, v.at), m.visits,
      { ...GATE }, this.patienceOf(npc, nowMin, ahead) * moodPatienceMul(mood), rng,
    );
    c.plan = plan;
    c.balking = balking;
    // Nạp nền cây hội thoại của người này. Không `await`: họ còn đi bộ mấy giây thật từ
    // cổng vào quầy, và `openTalk()` đã có đường lui nếu chưa kịp xong.
    void this.talks.ensure(npc ? npc.id : "WALKIN");
    if (plan?.pass) {
      // người đi ngang: KHÔNG vào hàng, không gọi món — tới chỗ dừng, đứng một nhịp, đi
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
    // THẤY → HIỂU → NGHE: mặt nền + prop có từ lúc bước vào hẻm, trước câu nói đầu tiên
    if (base) c.react.baseFace = c.react.face = base;
    if (mood.prop === "VAI_XUOI") c.react.basePose = c.react.pose = "SETTLE_IN";
    if (plan?.order) c.order = plan.order;
    else if (npc && this.deps.story && c.usual.phrase) {
      // người có tên: gọi ĐÚNG câu của mình; quen rồi thì có khi nói tắt — không đổi ý ngẫu nhiên
      const short = c.usual.short && !plan?.noShort && this.canAskUsual(npc, m) && rng.next() < 0.5;
      c.order = short ? { ...c.usual, intent: { ...c.usual.intent, usual: true } } : c.usual;
    } else c.rollOrder(this.canAskUsual(npc, m));
    // khách vãng lai nói NGUỒN (P4-05 §2.6): "em coi TikTok thấy…", "chị Lan bên công ty em kêu…"
    if (!npc && !plan && this.deps.story) {
      const line = walkinLine(this.deps.day, this.deps.story, ++this.walkinIdx);
      if (line) c.plan = { after: [{ text: line, delay: 2.4 }] };
    }
    // P2-01 §2.12: khách mới tới là chuỗi độc thoại đang dở tự tắt (followup tra lại query).
    for (const o of this.customers) if (o.phase !== "leaving") this.speaker.apply(o.memKey, "ctxKhachMoiToi", 1, 8, this.nowSec);
    c.driveBase = baseDrives(c.personality);
    c.drives = { ...c.driveBase };
    c.arrivedSeq = ++this.arriveSeq;
    this.customers.push(c);
    this.maybeCutLine(c);
    this.deps.bus.emit("npc:arrived", { npcId: memKey, visitId: id, slot: "SEATED_FAR", atHhmm: fmtHhmm(v.at) });
  }

  /**
   * CÓ NGƯỜI CHEN HÀNG THẬT — chỗ duy nhất gán `Customer.cutLine`. Ai chen: người NÓNG TÍNH
   * đang VỘI, và chỉ khi hàng đã có người để mà chen. Rút từ `hub.derive` theo id lượt ghé.
   */
  private maybeCutLine(c: Customer) {
    const ahead = this.customers.filter((x) => x !== c && this.inQueue(x) && !x.aside);
    if (ahead.length < 1) return;
    const hurry = c.purpose?.hurry ?? 0.3;
    const p = Math.max(0, 0.45 * c.personality.nongTinh * (0.4 + hurry) - 0.12 * ahead.length);
    /*
     * ⚠️ RÚT TỪ DÒNG RIÊNG, KHÔNG ĐỤNG DÒNG SPAWN. Rút có điều kiện trên một dòng dùng
     * chung thì nó dịch mọi lần rút sau đó nhưng chỉ ở một số lượt — golden không vỡ ngay
     * mà vỡ lệch pha vài ngày sau.
     */
    if (this.deps.hub.derive(`cutline:${this.deps.day}:${c.id}`).next() >= p) return;
    /*
     * Chen là ĐỨNG LÊN TRƯỚC một người: dời họ lên trước người đầu hàng trong mảng, và
     * `assignSlots` cấp chỗ theo thứ tự mới.
     */
    const victim = ahead[ahead.length - 1];
    const i = this.customers.indexOf(c), j = this.customers.indexOf(victim);
    if (i < 0 || j < 0 || j >= i) return;
    this.customers.splice(i, 1);
    this.customers.splice(j, 0, c);
    c.cutLine = true;
    this.assignSlots();
    this.out.push({ kind: "log", text: `${this.label(c)} chen lên trước ${this.label(victim)}.` });
  }

  /** Chỉ cho dev (`npc.spawn`): gọi một NPC có tên tới ngay, ngoài lịch. */
  devSpawn(npcId: string) {
    const npc = NPCS.find((n) => n.id === npcId);
    if (!npc) return false;
    this.spawn({ at: 0, npc, seq: 10_000 + this.devSeq++ }, DAY_START_MIN);
    return true;
  }

  get front(): Customer | null {
    return this.customers.find((c) => c.slot === 0 && c.phase !== "leaving") ?? null;
  }

  /** Có ai ở quầy / hàng chờ không — đồng hồ chỉ tua nhanh khi quầy TRỐNG HOÀN TOÀN. */
  get busy() {
    return this.customers.some((c) => c.phase !== "leaving");
  }

  /** Người đang "nhìn": đã đứng vào hàng, chưa quay lưng đi. Tối đa 6 người. */
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

  /**
   * Duyệt từ phía SỰ KIỆN (CANON §5). Không được hoãn: hoãn perception là đổi kết quả
   * game (P0-01 §2.4). `occluders` do scene đưa (thân người che, hơi lò…).
   */
  perceive(dt: number, nowSec: number, occluders: readonly Occluder[] = []) {
    this.nowSec = nowSec;
    this.active = this.active.filter((s) => s.until > nowSec - 30);
    // SK-12 — hay che tay lại, quay lưng: bé hạ máy ("Ủa, con xin lỗi"), không quay nữa 6 ngày
    const st = this.deps.story;
    if (st && this.deps.day === 5 && !st.flags.suCover && occluders.some((o) => o.mul < 0.5 && o.slots.includes("HANDS"))
      && this.audience.some((x) => x.memKey === "BE_SU")) st.flags.suCover = 5;

    for (const c of this.audience) {
      // P1-02 §2.4: quầy bẩn thì ai cũng soi kỹ hơn — không liên quan tới quan hệ.
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
        // Kênh 5 — hệ quả trễ: sự kiện xấu thành ký ức khi CONFIRMED; FLOURISH (salience 15)
        // chỉ người soi mới thấy, nên NOTICED là đủ (P2-02 §4.11)
        if (to === "CONFIRMED" && (o.id === "DROPPED_FOOD" || o.id === "DIRTY_HANDS" || o.id === "BURNT_OR_COLD")) {
          this.remember(c, o.id, SALIENCE[o.id] * o.certainty);
        } else if (to === "NOTICED" && o.id === "FLOURISH") this.remember(c, "FLOURISH", SALIENCE.FLOURISH);
        if (to === "CONFIRMED") this.deps.bus.emit("perception:confirmed", { npcId: c.memKey, stimId: o.id });
        if (to === "NOTICED" && NOTICE_SPOKEN.has(o.id)) this.noticeBark(c, o.id, to, o.smell);
      }
    }
  }

  /**
   * Phản ứng khi NOTICED — P1-02 §2.9, CANON §11: 35% im lặng (túi theo người). Cooldown
   * tier-1 giờ nằm trong content (`ctxBarkT1_*` của rule) — rule tier-1 hết lượt thì rule
   * điểm thấp hơn ("Hửm.") tự thắng.
   */
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

  /**
   * Kênh 1 + 2 — mặt đổi sau `reactionDelay`, và không hai người nào phản ứng trong cùng 60 ms.
   * Luật 35% im lặng không đụng tới đây: im lặng là không NÓI, không phải không phản ứng.
   */
  private react(c: Customer, id: StimId, i: Intensity, pose?: PoseId, group?: Group) {
    const p = c.personality;
    const g = group ?? GROUP_OF[id];
    let face = faceFor(g, p, i);
    // `M1` (mím chặt) là CHỮ KÝ của chị Lan — gần như chỉ dùng M1 khi có chuyện không vừa ý
    // (P2-02 §3.1 quy ước 1). Người chơi học nó từ chị, rồi rùng mình khi thấy trên mặt ai khác.
    const negative = g === "HYGIENE" || g === "DEFECT" || g === "NAME" || g === "WAIT";
    if (face && negative && isSilentGrudge(p)) face = [face[0], face[1], 1];
    let chosen: PoseId = pose ?? (i >= 2 ? c.npc?.poses?.[id] ?? poseFor(g, p, i) : poseFor(g, p, i));
    // chị Lan lúc CONFIRMED: ĐỨNG SỮNG (damping 40), không nói (P2-02 §4.6)
    if (i === 3 && isSilentGrudge(p) && negative && g !== "WAIT") chosen = "FREEZE";
    this.scheduleReact(c, face, chosen);
  }

  /**
   * Phản ứng với một chuyện KHÔNG có kích thích riêng — lời nói qua lại ở quầy (P5-01).
   * Cùng luật giãn 60 ms và cùng `faceHoldSec` với `react()`; khác ở chỗ không có `StimId`
   * nào để tra `npc.poses`, nên dáng lấy thẳng từ bảng nhóm.
   */
  private reactTalk(c: Customer, g: Group, i: Intensity, pose?: PoseId) {
    const p = c.personality;
    let face = faceFor(g, p, i);
    const negative = g === "NAME";
    if (face && negative && isSilentGrudge(p)) face = [face[0], face[1], 1];
    let chosen: PoseId = pose ?? poseFor(g, p, i);
    if (i === 3 && isSilentGrudge(p) && negative) chosen = "FREEZE";
    this.scheduleReact(c, face, chosen);
  }

  /** Đặt mặt + dáng lên hàng đợi phản ứng. Không hai người nào đổi mặt trong cùng 60 ms. */
  private scheduleReact(c: Customer, face: ReturnType<typeof faceFor>, pose: PoseId) {
    const p = c.personality;
    let at = this.nowSec + reactionDelay(p, this.dialogRng.next());
    for (let guard = 0; guard < 20 && this.reactAt.some((t) => Math.abs(t - at) < 0.06); guard++) at += 0.06;
    this.reactAt.push(at);
    if (this.reactAt.length > 16) this.reactAt.shift();
    c.react.schedule(c.now, at - this.nowSec, face, pose, faceHoldSec(p));
  }

  /**
   * Ghi một ký ức chứng kiến (P2-03). Chỉ 12 người có tên mới có trí nhớ — khách vãng
   * lai lần đầu gặp chuyện xấu thì "im, đi thẳng, không bao giờ quay lại" (P2-02 §5.1 M3′).
   */
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
    // Người im lặng: không nói, không đổi mặt quá mức — CHỈ GHI, rồi vắng (P2-02 §2.3 + §4.6)
    if (isSilentGrudge(c.personality)) {
      const hands = kind === "DIRTY_HANDS" && (m.memory.short.find((x) => x.kind === "DIRTY_HANDS")?.occurrences ?? 0) >= 3;
      const n = SILENT_ABSENCE[kind] ?? (hands ? 3 : 0);
      if (n) m.absentUntil = Math.max(m.absentUntil, day + n);
    }
  }

  // ───────────────────────────────────────── "việc mình làm có tới không" (T3)

  /**
   * Ghi lý do của một chuyện vừa làm quan hệ nhúc nhích. Nhiều lý do trong cùng một khoảnh
   * khắc thì lý do NẶNG KÝ NHẤT thắng — người chơi chỉ đọc được một dòng. `>=` chứ không
   * `>` để lý do ghi SAU thắng khi hoà.
   */
  private noteRel(text: string, weight: number) {
    if (!this.relNote || weight >= this.relNote.w) this.relNote = { text, w: weight };
  }

  /**
   * Kết một khoảnh khắc người chơi nối được với việc mình vừa làm. Một khoảnh khắc = MỘT sự
   * kiện, gộp mọi `record()` bên trong thành một chiều ròng; ròng gần bằng không thì KHÔNG phát.
   * T3 / L2: chỉ có chiều, một mức đậm nhạt, và một mẩu chữ.
   */
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

  /** Điểm quan hệ ngay lúc này — mốc để `settleRelMoved` trừ ra. Khách vãng lai: 0. */
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
    this.tickWorldFacts();
    this.tickDeeds();

    for (const c of this.customers) {
      // câu nói có hẹn giờ (arc / sự kiện) — `by` là người khác đang có mặt; vắng thì thôi
      for (let i = c.script.length - 1; i >= 0; i--) {
        const s = c.script[i];
        if (s.at > this.nowSec) continue;
        c.script.splice(i, 1);
        const who = s.by ? this.customers.find((x) => x.memKey === s.by && x.phase !== "leaving") : c;
        if (who) this.say(who, s.text, 2, true, 96);
      }
      const gazeBefore = c.gazeState;
      // Drive suy giảm VỀ MỨC NỀN, không về 0: mức nền LÀ con người họ, phần vượt lên
      // trên mới là chuyện của sáng hôm nay (P2-09 §2.7).
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
      // Chỗ đi khuất của CHÍNH người này. Không có dòng này thì một người qua đường đi
      // dọc vỉa hè ngang qua cổng khách là bốc hơi giữa hẻm — cổng nằm ngay trên dải họ đi.
      const exit = c.pass?.exit ?? GATE;
      if (c.phase !== "leaving" || !near(c, exit, 0.5) || lingering) continue;
      /*
       * ⚠️ DỌN SẠCH TRƯỚC KHI XOÁ NGƯỜI RA KHỎI DANH SÁCH. Người đi ngang đi khuất ở đây bằng
       * `splice`, KHÔNG qua `leave()` — mà `leave()` là chỗ duy nhất dọn phiên trò chuyện.
       * Thiếu nhánh này thì thẻ còn trên màn hình và cả hẻm câm tới khi người chơi bấm Esc.
       */
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

  /**
   * Nhịp người đi ngang — xem `sim/passersby.ts`. Đếm bằng GIÂY THẬT (`dt`), không bằng phút
   * game: đồng hồ tua nhanh khi quầy trống. Dòng số `passer:<ngày>:<thứ tự>` là dòng RIÊNG.
   */
  private tickPassers(dt: number, dayOver: boolean) {
    // Dọn hàng rồi thì con hẻm vẫn còn người đi, nhưng cảnh đã chuyển: đừng sinh thêm ai
    // để rồi họ đứng lại giữa màn hình kết ngày.
    if (dayOver) return;
    this.passerIn -= dt;
    if (this.passerIn > 0) return;
    const rng = this.deps.hub.derive(`passer:${this.deps.day}:${this.passerSeq}`);
    this.passerIn = nextGapSec(bandOf(this.nowMin), isRain(weatherOf(this.deps.day)), rng);
    // Trần an toàn: tới đây thì BỎ lượt này chứ không dồn lại. Dồn thì lúc trần hạ xuống
    // là cả đám ùa ra cùng một nhịp — đúng thứ cái trần sinh ra để chặn.
    if (this.customers.reduce((n, c) => n + (c.ambient ? 1 : 0), 0) >= PASSERS_MAX) return;
    this.spawnPasser(rng);
  }

  /**
   * HAI NGƯỜI ĐI NGANG GẶP NHAU THÌ CHÀO NHAU MỘT CÂU — đi ngược chiều trong vòng một ô, roll
   * tất định theo CẶP và theo NGÀY, chậm lại 0,8 giây, một câu chào một câu đáp.
   *
   * ⚠️ KHÔNG mang thông tin gì (không `claim`, không tên người, không ghi sổ tay) — đó là ranh
   * giới cứng với cảnh nghe lỏm ở góc hẻm.
   */
  private greetPassers() {
    const amb = this.customers.filter((c) => c.ambient && c.pass && !c.speaking && !c.greeted);
    for (let i = 0; i < amb.length; i++) {
      for (let j = i + 1; j < amb.length; j++) {
        const a = amb[i], b = amb[j];
        const pa = a.pass, pb = b.pass;
        if (!pa || !pb || a.greeted || b.greeted) continue;
        // Chỉ hai người đi NGƯỢC chiều mới "gặp" nhau; hai người cùng chiều là đi cùng đường.
        if (Math.sign((pa.exit?.x ?? a.x) - a.x) === Math.sign((pb.exit?.x ?? b.x) - b.x)) continue;
        if (Math.hypot(a.x - b.x, a.y - b.y) > GREET_REACH) continue;
        const key = [a.id, b.id].sort().join("|");
        if (this.deps.hub.derive(`greet:${this.deps.day}:${key}`).next() >= GREET_CHANCE) {
          a.greeted = b.greeted = true;                 // trượt roll cũng là đã xét — khỏi xét lại
          continue;
        }
        a.greeted = b.greeted = true;
        // Chậm lại ĐÚNG quãng chào rồi đi tiếp như cũ — `greetUntil` trả tốc độ về ở `step()`.
        a.greetUntil = a.now + GREET_SLOW_SEC;
        b.greetUntil = b.now + GREET_SLOW_SEC;
        const hi = this.barks.take("chaoNhau", a.memKey);
        /*
         * KHU PHỐ BIẾT CHUYỆN CỦA MÌNH — câu ĐÁP có xác suất là một tin đồn đang sống. Tin lấy
         * từ `gossip.ts`, đi ra bằng `overhear`: nghe lỏm được, KHÔNG xen vào được. Người đi
         * ngang không giữ niềm tin nào và không dẫn nguồn (`tier: 1`).
         */
        const tin = this.streetRumour();
        const re = tin ?? this.barks.take("chaoDap", b.memKey);
        if (hi) this.say(a, hi, 3, false, 20);
        if (re) this.say(b, re, 3, false, 20, undefined, GREET_REPLY_SEC);
        if (tin) {
          this.deps.bus.emit("gossip:overheard", {
            a: a.memKey as never, b: b.memKey as never,
            claim: this.lastRumourId, source: null, tier: 1,
          });
        }
        return;                                          // một cảnh một lúc — hẻm, không phải chợ
      }
    }
  }

  /** Id của tin vừa thả ra đường — `gossip:overheard` cần nó, và nó chỉ sống một nhịp. */
  private lastRumourId = "";

  /**
   * MỘT TIN ĐANG SỐNG TRONG HẺM, nói thành một câu ngoài đường. Không giữ tin nào thì trả `null`
   * và cảnh chào vẫn chạy bằng bark thường. Dùng câu `belief` (không có `{source}`).
   */
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
    // Dùng chung `walkin<i>` với khách vãng lai: cùng một kho dáng người, cùng một ô trí
    // nhớ. Không đẻ thêm khoá mới vào save cho những người không ai nhớ mặt.
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
    /*
     * MỖI NGƯỜI ĐI NGANG CÓ MỘT LÝ DO ĐỂ ĐI — mục đích phân biệt người trễ giờ làm (mời cũng
     * không dừng) với người đi chợ về, và quyết luôn việc họ dễ cười hay dễ cáu. Rút từ CHÍNH
     * dòng số của lượt đi ngang này.
     */
    const roll = rollPurpose(rng, bandOf(this.nowMin));
    c.driveBase = baseDrives(c.personality);
    /*
     * MỤC ĐÍCH ĐẨY THẲNG VÀO DRIVE. Đây là chỗ "spam mời khách" chết mà không cần một luật
     * chống spam nào: người đang vội có `VIEC_RIENG` và `YEN_THAN` cao nên mọi cuộc MỜI chấm
     * ra gần 0 — `pickTalk` thôi rút chúng, chứ không phải rút rồi mới chặn.
     */
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
    // Vội thì đi nhanh hơn — đọc ra ngay ở dáng đi, trước cả khi ai nói câu nào.
    c.ambient = true;
    // `leaving` ngay từ bước đầu: đó là cách `pass` vốn làm, và nó đúng — người đi ngang
    // không bao giờ vào hàng, nên mọi chỗ đếm người đang đứng (`audience`, `assignSlots`,
    // `ahead`, `peakCap`) phải bỏ qua họ mà không cần thêm một nhánh `if` nào.
    c.phase = "leaving";
    c.pass = {
      stay: plan.stay, until: -1,
      speed: plan.speed * (0.85 + 0.4 * (c.purpose?.hurry ?? 0.5)),
      // Không ngoái nhìn thì "chỗ dừng" chính là chỗ đi khuất: đi một mạch, không khựng.
      spot: plan.spot ?? plan.to, exit: plan.to,
    };
    this.customers.push(c);
    // Nạp nền kho thoại ĐƯỜNG PHỐ (không phải kho của khách mua hàng) — họ còn đi bộ
    // mấy giây thật trước khi tới chỗ người chơi với tay tới được.
    void this.talks.ensure("QUA_DUONG");
  }

  private step(c: Customer, dt: number, dayOver: boolean) {
    if (c.pass) {
      const p = c.pass;
      // Người có kịch bản dừng ở `PASS_SPOT` rồi quay ra đúng cổng họ vào; người qua
      // đường đi XUYÊN cái hẻm nên khai chỗ dừng và chỗ đi khuất của riêng họ.
      const spot = p.spot ?? PASS_SPOT, exit = p.exit ?? GATE;
      if (p.until < 0) {
        walk(c, spot, dt, p.speed);
        if (near(c, spot, 0.25)) {
          p.until = c.now + p.stay;
          /*
           * Người qua đường chỉ ngoái nhìn cái xe một cái. ⚠️ Đặt THẲNG vào `react` chứ không
           * qua `this.react()` — hàm đó rút một số của `dialog-shufflebag`, dòng chung của cả hệ
           * thoại.
           */
          if (c.ambient) {
            if (p.stay > 0) c.react.schedule(c.now, 0, null, "PEEK_OVER", p.stay);
            return;
          }
          if (p.nod && (c.npc?.id !== "CHU_KIET" || this.stallRunning)) this.react(c, "FLOURISH", 1, "NOD");
          this.queueLines(c, c.plan?.pass?.lines, 0.3);
          if (this.deps.story) onPass(this.deps.story, c.npc?.id ?? null, c.plan?.tag, this.deps.day);
        }
        return;
      }
      /*
       * ĐANG NÓI CHUYỆN VỚI MÌNH THÌ ĐỨNG LẠI — gia hạn mỗi frame, không hẹn cứng một lần.
       * `openTalk` chỉ đặt `until = now + PASSER_TALK_TAIL` (4 giây thật) mà đọc hết một
       * cuộc mất 20–30 giây; gia hạn thì họ ở lại đúng bằng quãng mình còn nói.
       */
      // `owesLine` là nửa sau: phiên đã đóng ở nhịp cuối, nhưng câu đáp còn chưa ra
      // khỏi miệng người ta. Đi tiếp ngay lúc đó là nói một mình với một cái lưng.
      if (this.talkWith === c || this.owesLine(c)) { p.until = c.now + PASSER_TALK_TAIL; return; }
      if (c.now < p.until) return;
      walk(c, exit, dt, (p.speed ?? 1) * (c.now < c.greetUntil ? GREET_SLOW : 1));
      return;
    }
    /*
     * Đã quyết không vào nhưng KHÔNG xoá người ta ở cổng: khách sinh ra ngay tại `GATE` nên
     * `leave()` lúc spawn là họ biến mất trong CÙNG một frame. Họ vẫn đi vào, đứng ngó một nhịp,
     * nói câu của mình rồi quay lưng. Trả sớm trước `waitSteps()` — chưa xếp hàng thì chưa có
     * đồng hồ chờ nào chạy.
     */
    if (c.balking && c.phase !== "leaving") {
      walk(c, BALK_LOOK, dt);
      if (!near(c, BALK_LOOK, 0.25)) return;
      c.balkAt = c.now;
      this.leave(c, "balked");
      return;
    }
    if (c.phase === "leaving") {
      if (c.balkAt >= 0 && c.now - c.balkAt < BALK_LOOK_SEC) return;   // đứng ngó một nhịp rồi mới quay lưng
      if (c.binDetour && c.binAt < 0) {
        walk(c, STREET_BIN, dt);
        if (near(c, STREET_BIN, 0.2)) {
          c.binAt = c.now;
          c.carrying = false;
          this.deps.bus.emit("npc:actionTaken", { npcId: c.memKey, action: "BINNED_FOOD" });
        }
        return;
      }
      if (c.binAt >= 0 && c.now - c.binAt < 0.9) return;     // đứng lại một nhịp ở thùng rác
      walk(c, GATE, dt);
      return;
    }

    /*
     * ĐANG NÉP QUA MỘT BÊN — họ ở NGOÀI hàng, nên không một nhánh nào bên dưới được
     * kéo họ về chỗ đứng cũ. Vẫn rơi xuống `waitSteps()` ở cuối hàm: nhường chỗ không
     * phải là bấm tạm dừng đồng hồ chờ của người ta, nép lâu quá thì vẫn bỏ về.
     */
    /*
     * ĐANG NGỒI (`THEY_SIT`) — rời chỗ đứng nhưng KHÔNG rời hàng: tới lượt vẫn là lượt của họ,
     * kiên nhẫn vẫn trôi chỉ chậm hơn.
     *
     * ⚠️ Đặt TRƯỚC nhánh `aside`: ai vừa nép vừa ngồi thì cái ghế thắng, nó là chỗ cụ thể hơn.
     */
    if (c.sitting) {
      if (c.phase === "ordering") c.phase = "waiting";
      walk(c, SEAT_SPOT, dt);
    } else if (c.aside) {
      if (this.asideDone(c)) this.rejoinQueue(c);
      else {
        if (c.phase === "ordering") c.phase = "waiting";   // gọi món xong mới nép thì vẫn là đang chờ bánh
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
        if (c.slot === 0 && c.holdLeft > 0) { c.holdLeft -= dt; walk(c, SLOTS[0], dt); break; }   // ngồi im trên yên xe
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

  /**
   * MADE_THEM_WAIT đi KÊNH THỜI GIAN của riêng từng người, không phải một kích thích cả hàng
   * cùng thấy. Mốc theo r = đã chờ / sức chờ: 0,6 nhấp nhổm · ~0,85 liếc đồng hồ · 1,0 CONFIRMED
   * · 1,6 bỏ đi.
   */
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

  /**
   * SMALLTALK — một lần mỗi lượt ghé, khi khách đã chờ bánh vài giây, không ai đang nói và
   * không có câu nào đang xếp hàng. Rule quyết định nói gì (quầy dơ, chuyện cải lương…);
   * không rule nào khớp thì im — chuyện phiếm không cần lưới an toàn.
   */
  private smalltalk(c: Customer) {
    if (c.phase !== "waiting" || this.smalltalked.has(c.id)) return;
    if (this.nowSec - c.orderedAt < SMALLTALK_AFTER_SEC) return;
    if (this.queue.length || this.customers.some((x) => x.speaking)) return;
    /*
     * ⚠️ ĐÁNH DẤU SAU, không đánh dấu trước: đánh dấu trước thì một người bị trượt vì lý do
     * thuần kỹ thuật (hàng đợi lời mời đang đầy, tay người chơi đang bận) coi như đã tiêu
     * xong lượt bắt chuyện của cả lượt ghé, và im luôn tới lúc đi về.
     */
    if (this.offerTalk(c)) { this.smalltalked.add(c.id); return; }
    if (!this.interruptible) return;
    this.smalltalked.add(c.id);
    if (this.mentionGossip(c)) return;
    this.speakConcept(c, "SMALLTALK", {}, 45, true);
  }

  /**
   * Khách nhắc ở quầy một chuyện NGHE KỂ (P2-04 §2.9 ba pool): "nghe {nguồn} nói…" →
   * "nghe nói…" → "biết mà". Dòng `hearsay` LUÔN có tên nguồn (RB3) — sợi chỉ để lần.
   * Mỗi chuyện tối đa một lần mỗi ngày mỗi người.
   */
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

  /** Hệ số theo tin đồn đang sống trong đầu người này: xấu → `bad`, tốt → `good`, không có → 1. */
  private rumourMul(id: string, bad: number, good: number) {
    const g = this.deps.gossip;
    if (!g) return 1;
    const net = activeHeard(g, id).reduce((a, b) => a + b.valence * b.confidence, 0);
    return net < -0.2 ? bad : net > 0.2 ? good : 1;
  }

  private takeOrder(c: Customer) {
    if (this.soldOut && c.plan?.tag === "SK-42") {
      // P4-04 §2.2 nhánh hết hàng — KHÔNG phải ending tệ. Người chơi lắc đầu; chị gật.
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
    // mood ngoài tầm kiểm soát: MỘT câu nói ra, không giải thích thêm (P2-02 §5.2)
    if (c.dayMood.cause !== "NONE") this.speakConcept(c, "GREET", { npcMoodCause: c.dayMood.cause }, 60, true);
    // P2-03 §2.11 tín hiệu #1 — cách chào: chỉ người đã thân mới hỏi han (không một con số nào)
    else if (c.npc && this.mem(c.memKey).tier === "FRIEND") this.speakConcept(c, "GREET", {}, 50, true);
    this.deps.bus.emit("order:placed", { npcId: c.memKey, spec: c.order, phrasing: line });
    // P2-05 cột trái: ai · mấy giờ · gọi gì (NGUYÊN VĂN) · lần thứ mấy. Không đúng/sai, không suy luận.
    if (this.deps.notebook) {
      logOrder(this.deps.notebook, {
        day: this.deps.day, minute: this.nowMin, npcId: c.npc?.id ?? null, orderText: line, visitCount: this.mem(c.memKey).visits,
      });
    }
    // Đọc nguyên đơn ruột ra thành lời = người chơi vừa được DẠY một lần.
    if (!c.order!.intent.usual && sameOrder(c.order!, c.usual)) this.mem(c.memKey).heard++;
    this.queueLines(c, c.plan?.after, 2.6);
    c.plan = c.plan ? { ...c.plan, after: undefined } : null;   // ổ thứ hai không nói lại
  }

  /**
   * Tới mà hết bánh. Không có sự kiện thứ 12 (CANON §3): là MADE_THEM_WAIT lý do OUT_OF_STOCK,
   * cường độ 55 × (1 + 0,5·min(số lần ghé, 20)/10) — khách ruột lâu năm nhớ nặng nhất.
   */
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

  /**
   * Câu buông ra lúc quay lưng đi. Luật quan trọng nhất: KHÔNG PHẢI AI CŨNG NÓI — chào đủ mỗi
   * khách mỗi lượt thì nó thành tiếng chuông cửa. Bốn cái van đều có sẵn: túi im lặng 7/20
   * (`barks.speaks`) · `odds` của từng rule · `silent: true` · và `QUEUE_EXPIRE_SEC`.
   */
  private farewell(c: Customer) {
    const outcome = this.serveOutcome.get(c.id) ?? "CLEAN";
    this.serveOutcome.delete(c.id);
    if (!this.barks.speaks(c.memKey)) {
      this.deps.bus.emit("dialog:silent", { npcId: c.memKey, reason: "RATE_35" });
      return;
    }
    // pri 55: dưới câu gọi món của người kế tiếp (100) và dưới câu nhận bánh (60–90) —
    // người đang đứng ở quầy bao giờ cũng được nói trước người đang bước ra cổng.
    this.speakConcept(c, "FAREWELL", { leaveReason: "SERVED", serveOutcome: outcome }, 55, true, {}, FAREWELL_DELAY);
  }

  /** Ngày 40: chị Lan đã đi — StallScene bắt đầu khoảng lặng rồi màn kết. */
  lanLeft = false;

  private leave(c: Customer, reason: LeaveReason) {
    // Hứa bỏ thêm món rồi để người ta đi về tay không: lời hứa đó gãy ngay tại đây,
    // không cần đợi tới lúc đưa bánh (vì sẽ không có lúc đưa bánh nào nữa).
    const pledge = this.pledges.get(c.id);
    if (reason !== "served" && pledge?.promised.length) {
      this.remember(c, "BROKEN_PROMISE", PROMISE_BROKEN);
      pledge.promised = [];
    }
    this.pledges.delete(c.id);
    this.habitSettled.delete(c.id);
    this.hollowShown.delete(c.id);
    // `farewell()` đã rút rồi thì xoá này là vô hại; cần cho nhánh mua ổ thứ hai rồi bỏ
    // đi giữa chừng — lượt đó có `serveOutcome` mà không bao giờ có câu chào để xài nó.
    if (reason !== "served") this.serveOutcome.delete(c.id);
    // Bắt chuyện mà không ai trả lời tới lúc đi: đó mới là lúc làm thinh thành ra thiệt.
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
    c.aside = false;                                   // về rồi thì không còn đứng nép nữa
    c.asideFor = null;
    c.zone = "SEATED_FAR";                             // quay lưng rồi thì không còn nhìn quầy
    if (reason === "served") { this.servedCount++; this.farewell(c); }
    // "soiled" cũng là một người ra về tay không ngay ở lượt mở hàng — vía y như vậy.
    if (!this.viaSettled && (reason === "impatient" || reason === "soldout" || reason === "soiled")) { this.opening.walkedAway = true; this.settleVia(); }
    /*
     * Lắc đầu không nhận ổ vừa nhặt dưới đất lên (xem `SOILED_CAUGHT`): một người chơi ĐỂ MẤT,
     * nên vào thẳng `lostCount` và `lost` của sổ tay — khác hẳn nhánh `balked` ngay dưới. Ưu
     * tiên 92, cao hơn mọi câu đang xếp hàng.
     */
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
    /*
     * Quay đầu vì đông: KHÔNG `remember()` (người bán không làm gì sai, mà `remember()` còn gọi
     * `witness()` — cả hẻm kể nhau nghe một chuyện chưa từng xảy ra) và KHÔNG tính vào `lost`
     * (hàng dài là hệ quả của bán được). `balkedCount` là chỗ cho dev overlay.
     *
     * Vẫn có giá: một ổ không bán được · `m.visits` không nhích · tối nay `nightly()` tính một
     * lần LỠ.
     */
    if (reason === "balked") {
      this.balkedCount++;
      this.speakConcept(c, "FAREWELL", { leaveReason: "BALKED" }, 80);
      this.out.push({ kind: "log", text: `${this.label(c)} ngó hàng rồi quay về — đông quá.` });
    }
    this.talks.release(this.talkKey(c));
    // Autosave nghe npc:left — đổ trí nhớ ngắn của rule DB vào world TRƯỚC khi nó ghi.
    this.speaker.sync(this.nowSec);
    this.deps.bus.emit("npc:left", { npcId: c.memKey, visitId: c.id, reason: LEAVE_REASON[reason] });
  }

  // ──────────────────────────── sự thật thế giới mà nội dung đọc (P2-09 §2.3)

  /**
   * CẬP NHẬT MẤY SỰ THẬT CÂU NÓI DỰA VÀO — `t.cutLine` · `t.blocking` · `w.shadeFree`.
   *
   * ⚠️ Đặt ở đây, mỗi frame, MỘT chỗ — không rải vào `assignSlots` / `spawn` / `leave`: một
   * sự thật được ghi từ bốn chỗ là một sự thật sớm muộn gì cũng lệch.
   */
  private tickWorldFacts() {
    /*
     * MẺ VỪA RA LÒ — bắt đúng lúc `ovenBusy` chuyển từ CÓ Ổ sang TRỐNG. Làm ở đây chứ không
     * bắt scene gửi thêm một sự kiện nữa: scene đã phải gửi `ovenBusy` mỗi frame rồi, thêm
     * một đường thứ hai là thêm một chỗ để hai bên lệch nhau.
     */
    if (this.wasOvenBusy && !this.ovenBusy) this.lastBatchOutAt = this.nowSec;
    this.wasOvenBusy = this.ovenBusy;

    /*
     * CHEN HÀNG — thứ tự mảng `customers` LÀ thứ tự người ta tới, nên ai đứng gần quầy hơn một
     * người tới TRƯỚC mình thì người đó đã chen. Chỉ tính người đang thật sự xếp hàng: `aside`
     * tụt lại là do mình bảo họ nép, `balking` thì không ở trong hàng.
     */
    const queue = this.customers.filter((c) => this.inQueue(c) && !c.aside);
    for (let i = 0; i < queue.length; i++) {
      const c = queue[i];
      // Giữ cờ đã gán lúc chen; và bắt luôn trường hợp thứ tự đổi sau đó vì lý do khác.
      if (!c.cutLine) c.cutLine = queue.slice(0, i).some((before) => before.arrivedSeq > c.arrivedSeq);
      /*
       * ĐỨNG CHẮN — đứng ở chỗ đưa hàng mà KHÔNG phải lượt mình. Khác `cutLine` (sai thứ
       * tự) ở chỗ nó là chuyện vị trí: người ta không giành lượt, họ chỉ đứng sai chỗ.
       */
      /*
       * ĐỨNG CHẮN = chiếm CHỖ ĐƯA HÀNG trong lúc người sau không được phục vụ — người đã nhận
       * bánh mà còn đứng đó, hoặc người đứng đầu hàng mà chưa chịu gọi.
       *
       * ⚠️ `arriving` KHÔNG tính: đó là người đang BƯỚC TỚI, không phải người đứng lì.
       */
      const served = c.leaveReason === "served" || this.serveOutcome.has(c.id);
      c.blocking = c.slot === 0 && queue.length > 1 && (served || c.phase === "queueing");
    }
    for (const c of this.customers) if (!queue.includes(c)) { c.cutLine = false; c.blocking = false; }
    /*
     * NGƯỜI ĐI NGANG KHÔNG CHẮN QUẦY — đã thử gán rồi bỏ, ghi lại để không ai gán lại: chỗ họ
     * dừng ngó nằm trên dải đường y9,6 / y12,4, còn chỗ đưa hàng ở y7,6, cách trọn một làn.
     */

    /*
     * CHỖ MÁT CÒN TRỐNG KHÔNG — `SHADE_CAPACITY` = 1, một chỗ một người. Đây là lý do
     * `w.shadeFree` là sự thật ĐỘNG (ra dấu "?" chứ không ẩn nút): người khác chiếm mất giữa
     * lúc mình đang đọc thẻ là chuyện xảy ra được, và nó phải đọc ra được.
     */
    this.shadeFree = this.customers.filter((c) => c.inShade).length < SHADE_CAPACITY;
    /*
     * GHẾ: hết chỗ, hoặc CHƯA MUA ghế, thì không còn chỗ trống nào cả. Kiểm thiết bị ở
     * đây chứ không để nội dung tự khai `needEquip`: một người viết quên khai là câu mời
     * ngồi hiện ra ở cái xe chưa có ghế, và lời mời đó không có gì đỡ.
     */
    this.seatFree = has(this.deps.equip, "GHE_BAN")
      && this.customers.filter((c) => c.sitting).length < SEAT_CAPACITY;

    // Hết giờ thì về đúng việc cũ — "đứng cho mát" không được nghĩa là đứng cả game.
    for (const c of this.customers) {
      if (c.inShade && c.now >= c.shadeUntil) this.leaveShade(c);
      if (c.sitting && c.now >= c.sitUntil) this.standUp(c);
      if (c.filming) this.tickFilm(c);
      if (c.eating && c.now >= c.eatUntil) c.eating = false;
      if (c.lookInsideUntil && c.now >= c.lookInsideUntil) c.lookInsideUntil = 0;
    }
  }

  /**
   * LỜI HỨA HẾT HẠN — ba nấc: nhắc một câu → nói nặng → bỏ đi. Không có hạn thì một lời hứa
   * cũng là một free word, chỉ là loại tinh vi hơn.
   */
  private tickDeeds() {
    for (let i = this.deeds.length - 1; i >= 0; i--) {
      const d = this.deeds[i];
      const c = d.c;
      if (c.phase === "leaving" && !c.pass) { this.deeds.splice(i, 1); continue; }
      /*
       * NGƯỜI NÓNG TÍNH BỎ NẤC MỘT, NGƯỜI LẠ BỎ CẢ BA. Người lạ không có trí nhớ để mà nhắc
       * (`memKey` dùng chung cho tám dáng người), nên với họ lời hứa gãy là đi luôn.
       */
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

  /** Lời hứa đang treo của một người — scene vẽ chỉ báo trên đầu họ (T5, P2-09 §4). */
  pendingDeeds(memKey: string): { what: string; label: string; leftSec: number }[] {
    return this.deeds.filter((d) => d.c.memKey === memKey).map((d) => ({
      what: d.deed.what,
      label: DEED_LABEL[d.deed.what] ?? d.deed.what,
      leftSec: Math.max(0, d.dueAt - d.c.now),
    }));
  }

  /** Ai đứng chỗ nào: người tới trước đứng gần quầy hơn. Người đứng sau bị người trước che. */
  private assignSlots() {
    let i = 0;
    for (const c of this.customers) {
      // người đang quay đầu không xếp vào hàng — cấp chỗ cho họ là đẩy người tới sau lùi
      // một bậc rồi trả lại sau một giây rưỡi, tức cả hàng nhúc nhích không vì lý do gì.
      if (c.phase === "leaving" || c.balking) continue;
      /*
       * NGƯỜI ĐANG NÉP QUA MỘT BÊN KHÔNG CHIẾM CHỖ NÀO (`STEP_ASIDE`). Bỏ họ khỏi vòng cấp
       * chỗ thì `i` không tăng, nên mọi người sau lưng dồn lên một bậc THẬT — người kế bước
       * tới trước quầy, không phải đứng đổi chỗ cho nhau trên cùng một hàng.
       */
      // Ngồi hay nép đều ở NGOÀI vòng cấp chỗ: `i` không tăng nên cả hàng sau dồn lên thật.
      if (c.aside || c.sitting) { c.slot = -1; c.occluder = 1; continue; }
      const from = c.zone;
      c.slot = i < SLOTS.length ? i : SLOTS.length - 1;
      c.zone = SLOTS[c.slot].zone;
      // P1-02 §2.6: khách ở QUEUE_3 trở ra bị người đứng trước che một phần (×0,70).
      c.occluder = c.slot >= 2 ? 0.7 : 1;
      if (from !== c.zone && c.phase !== "arriving") {
        this.deps.bus.emit("npc:slotChanged", { npcId: c.memKey, from: from as CustomerSlot, to: c.zone as CustomerSlot });
      }
      i++;
    }
  }

  // ────────────────────────────────────────────────── bước 5 · lịch nói

  /**
   * Mọi câu khách nói đi qua đây: trễ 0,2–0,4 s, tối đa 1 câu MỚI mỗi frame, tối đa 2 bong bóng;
   * người đứng ngay trước quầy được nói trước; câu chờ quá 2,5 s thì thôi.
   *
   * `wait` cộng vào quãng trễ cho câu phải ĐỨNG SAU một câu khác của CHÍNH người đó, và hạn đếm
   * từ lúc hết trễ nên nó không ăn mất cửa sổ nói.
   */
  private say(c: Customer, text: string, tier: 1 | 2 | 3 = 2, log = false, pri = 50, rule?: Rule, wait = 0, offer = false) {
    const delay = wait + BARK_DELAY_MIN + this.dialogRng.next() * BARK_DELAY_SPAN;
    this.queue.push({ c, text, tier, delay, log, pri, waited: 0, held: 0, rule, offer });
    this.deps.bus.emit("bark:queued", { npcId: c.memKey, tier, delaySec: delay });
  }

  /**
   * Dựng query — P2-01 §2.1: dict PHẲNG mọi fact đúng NGAY LÚC NÀY, dựng lại mỗi lần hỏi.
   * Global (giờ, quầy, hàng) · Player · Customer (tính cách ×100, quan hệ) · ctx* · Session.
   */
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

  /**
   * Mọi câu khách tự nói (trừ câu gọi món) đi qua đây: dựng query → rule DB chọn → xếp
   * vào lịch nói. Không rule nào khớp = im lặng (hợp lệ). `concept` luôn là chuỗi literal
   * ở chỗ gọi để validator (R003) dò được concept nào được hỏi tới.
   */
  private speakConcept(c: Customer, concept: string, extra: Extra, pri = 50, log = false, vars: Record<string, string> = {}, wait = 0): boolean {
    const q = this.buildQuery(c, extra);
    const got = this.speaker.pick(concept, c.memKey, q, this.nowSec, vars);
    if (!got) {
      this.deps.bus.emit("dialog:silent", { npcId: c.memKey, reason: "NO_RULE" });
      return false;
    }
    if (got.rule.silent) {
      // im lặng có chủ ý: vẫn tính là "đã trả lời" (applycontext, followup không có)
      this.speaker.spoken(got.rule, c.memKey, this.nowSec);
      this.deps.bus.emit("dialog:silent", { npcId: c.memKey, reason: "PERSONALITY" });
      return false;
    }
    this.say(c, got.text, got.tier, log, pri, got.rule, wait);
    return true;
  }

  /** Followup tới hạn → tra LẠI với query dựng mới (P2-01 §2.7). Không khớp = chuỗi tắt. */
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

  /**
   * Người này có đang bận một câu mà `p` CHƯA được phép cắt ngang không?
   *
   * ⚠️ Dùng ở hai chỗ — chỗ thả câu ra, và chỗ cộng đồng hồ quá hạn — và phải là CÙNG một
   * phép thử: lệch nhau một chút là câu bị khoá ở chỗ này lại bị tính quá hạn ở chỗ kia.
   */
  private speechBlocked(p: Pending): boolean {
    const c = p.c;
    const slow = this.deps.readMul ?? 1;
    if (!c.speaking) return c.sayQuietFor < SAME_SPEAKER_GAP_SEC;
    // ⚠️ Sàn này đứng TRƯỚC cả trần cứng: câu đang hiện phải kịp ĐƯỢC THẤY đã. Để trần lên
    // trước thì một câu đã đợi quá 3 s được quyền đè bất cứ lúc nào — kể cả đè lên một câu
    // vừa mới hiện ra ở frame trước.
    if (c.saidFor < BARGE_IN_SEC * slow) return true;
    if (p.held >= HOLD_MAX_SEC * slow) return false;                     // trần cứng
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
    // câu hết hạn, hoặc người đã đi khuất
    for (let i = this.queue.length - 1; i >= 0; i--) {
      const p = this.queue[i];
      const gone = !this.customers.includes(p.c);
      // câu gọi món (pri 100) không bao giờ bị bỏ — không có nó thì không làm được bánh
      /*
       * Hạn chờ phải CO THEO tuổi thọ bong bóng, không được là một hằng số: `bubbleLife` đã
       * lên 2,8–9 s và `readMul` (cỡ chữ lớn × không giới hạn giờ) nhân thêm tới 1,875, nên
       * một hạn cứng 2,5 s làm càng bật trợ năng thì cái hẻm càng CÂM.
       */
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
      /*
       * MỘT NGƯỜI NÓI MỘT CÂU MỘT LÚC — xếp hàng chứ không chen. ⚠️ Cái gác phải nhìn thấy CHÍNH
       * người sắp nói, không chỉ người khác: thiếu nó thì `speak()` ghi đè lên `c.say` và câu
       * trước biến mất sau một frame, kể cả CÂU GỌI MÓN.
       *
       * `talkPartnerSpeak` cố ý đè lên nhau nên gọi thẳng `speak()`, không qua đây.
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
        // P2-05 RawNote SAID_SOMETHING — chỉ khi khách nói ra chuyện ĐỜI HỌ (không phải lời chê khen)
        if (p.rule.concept.startsWith("SMALLTALK") && p.c.npc && this.deps.notebook) {
          logNote(this.deps.notebook, this.deps.day, this.nowMin, p.c.npc.id, { t: "SAID_SOMETHING", text: p.text });
        }
        if (p.rule.applycontext.some((a) => a.name === "ctxNhacQuayDo")) this.dirtRemarked = true;
        // followup đếm từ lúc câu này nói XONG
        const f = p.rule.followup;
        if (f) this.followups.push({ c: p.c, concept: f.concept, at: this.nowSec + bubbleLife(p.text, slow) + f.delaySec });
      }
      this.deps.bus.emit("dialog:spoken", { npcId: p.c.memKey, text: p.text, tier: p.tier });
      if (p.log) this.out.push({ kind: "log", text: `${this.label(p.c)}: ${p.text}` });
    }
  }

  // ──────────────────────────────────────────────────────────────── giao bánh

  /**
   * Người chơi đưa ổ bánh cho khách đang đứng trước mặt. Mỗi lỗi tra ĐÚNG khoá của nó
   * (`orderDefectKey`): thấy lúc làm → ANTICIPATED, không thấy → DISCOVERED. `take(1)`: nhiều
   * lỗi chỉ NÓI một, phần còn lại vẫn tính ngầm vào tiền boa. Không bao giờ trừ tiền bánh.
   */
  serveDish(
    dish: Ingredient[],
    /** `soiled` = ĐÚNG Ổ NÀY đã từng nằm dưới đất (cờ theo từng ổ, xem `SOILED_CAUGHT`). */
    opts: { cold?: boolean; crust?: number; quality?: number; readyAt?: number; soiled?: boolean } = {},
  ): { ok: boolean; reason?: string } {
    const c = this.front;
    if (!c || c.phase !== "waiting") return { ok: false, reason: "chưa có ai chờ lấy bánh" };
    const bus = this.deps.bus;
    // Mốc gom của khoảnh khắc "đưa xong một ổ" — mọi `record()` từ đây tới lúc tính tiền
    // cộng lại thành MỘT dòng cho HUD, không phải mỗi lần ghi một dòng (xem `settleRelMoved`).
    const relBefore = this.relNow(c);
    this.relNote = null;

    /*
     * Ổ đã nằm dưới đất và NGƯỜI NÀY ĐÃ THẤY nó rớt — chặn ở ĐẦU hàm, trước cả `diffDish`: không
     * `order:delivered`, không tiền, không boa. Mốc NOTICED chứ không CONFIRMED (liếc thấy là đủ
     * để không ăn), và `peakOf` chứ không `peakOfKey`. Ổ Ở LẠI TRONG TAY người chơi.
     */
    if (opts.soiled && rank(peakOf(c, "DROPPED_FOOD")) >= rank("NOTICED")) {
      this.remember(c, "DROPPED_FOOD", SOILED_CAUGHT);
      this.noteRel("đồ ăn rơi xuống đất", SOILED_CAUGHT);
      this.react(c, "DROPPED_FOOD", 3);
      this.settleRelMoved(c, relBefore);
      this.leave(c, "soiled");                           // đếm, ghi log và nói câu từ chối ở trong đó
      return { ok: false, reason: SOILED_REFUSE_TOAST };
    }
    /** Ổ dưới đất mà người ta KHÔNG thấy: vẫn bán được, và vẫn có giá — `SOILED_GRIT`. */
    const grit = !!opts.soiled;

    /*
     * Ổ CHƯA CÓ MIẾNG NHÂN NÀO, mà người này không phải người cầm cho xong — chặn TRƯỚC
     * `nameCheck` và `diffDish`, lượt giao này không xảy ra. `hollow` tính một lần ở đây rồi dùng
     * lại cho nhánh khách NHẬN ở dưới; đọc `levels` GỐC chứ không đọc khẩu vị ẩn.
     */
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

    // P2-05 — người chơi gọi khách bằng tên đã ghi trong sổ. Gọi SAI là WRONG_NAME (salience
    // 100, bỏ qua gaze: là âm thanh nhắm thẳng vào người đó). Chưa ghi tên = không gọi tên.
    const nb = this.deps.notebook;
    if (nb && c.npc && nameCheck(nb, c.npc.id) === false) {
      this.remember(c, "WRONG_NAME", SALIENCE.WRONG_NAME, { wrongNameUsed: nb.pages[c.npc.id].name });
      this.noteRel("gọi sai tên", SALIENCE.WRONG_NAME);
      this.react(c, "WRONG_NAME", 3);
      this.speakConcept(c, "NOTICE_EVENT", { eventId: "WRONG_NAME", obsState: "CONFIRMED" }, 95, true);
      this.emitStim("WRONG_NAME", { target: c.id });
    }

    let raw = diffDish(c.order!, dish);
    // P4-03 §2.2 món ăn LÀ câu thoại: làm theo khẩu vị ẩn (không ai nói ra) cũng là ĐÚNG.
    // Bỏ qua khẩu vị ẩn thì KHÔNG BAO GIỜ bị phạt (`ignorePenalty: none`) — chỉ là câu đó không được nói.
    let viaAlt = false;
    const alt = c.order!.alt;
    if (raw.length && alt) {
      const r2 = diffDish({ ...c.order!, levels: { ...c.order!.levels, ...alt } }, dish);
      if (!r2.length) { raw = r2; viaAlt = true; }
    }
    // P1-01 §2.4: warmth < 0,55 lúc đưa. Kích thích BURNT_OR_COLD do scene phát đúng lúc đưa.
    if (opts.cold) raw.push(mkDefect("WRONG_TEMP", null));
    // …và ổ rút khỏi lò sớm, cùng một đường (xem khối UNDERDONE_FLOOR ở đầu file).
    const crustLow = opts.crust !== undefined && opts.crust < CRUST.READY;
    if (crustLow) raw.push(underdoneDefect(opts.crust!));
    // P3-03 §2.3: đồ trong kho đã xuống — người soi nếm ra sớm hơn (chị Lan chỉ chịu lệch 0,09)
    if (opts.quality !== undefined && 1 - opts.quality >= tasteThreshold(c.personality.soi)) raw.push(mkDefect("TASTE_OFF", null));
    const defects: DiffedDefect[] = raw.map((d) => {
      const key = d.kind === "WRONG_TEMP" || d.kind === "STUFFED" || d.kind === "TASTE_OFF" ? null : orderDefectKey(c.id, d.kind, d.item);
      const seen = key ? rank(peakOfKey(c, key)) >= rank("NOTICED") : false;
      return { ...d, key, witness: seen ? "ANTICIPATED" : "DISCOVERED" };
    });
    bus.emit("order:delivered", { npcId: c.memKey, dish: [...dish], waitedSec: this.nowSec - c.orderedAt });

    // `hollow` (tính ở đầu hàm): tới được đây nghĩa là người này CẦM CHO XONG. Họ vẫn
    // nói một câu — ổ trống không đi qua túi im lặng, xem khối `HOLLOW_REFUSED`.
    const spoken = this.pickSpoken(c, defects, hollow);
    let positive = 0;
    let tb = false;
    /**
     * Cái nếp "cho thêm" chỉ được đụng tới trên ổ KHÔNG LỖI, và đúng một lần mỗi lượt ghé:
     * trên một ổ làm trật thì không ai đọc ra được chuyện thiếu miếng đồ chua tặng kèm, nên
     * lượt đó nếp giữ nguyên — không dày thêm mà cũng không gãy.
     */
    let habitBroke = 0;
    if (defects.length === 0) {
      // T-B (90): ổ đã GÓI XONG trước khi khách mở miệng, và đúng đơn quen — "bắt đầu chuẩn bị ổ
      // của chú từ 6h42" (P4-01 NPC-02 M1): bài dự báo cầu được dạy xong mà không cần tutorial
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
      }, habitBroke > 0 || extra < 0 ? 70 : 60, true);
    } else if (hollow) {
      // Người cầm cho xong vẫn phải NÓI RA chuyện ổ bánh không có gì trong đó, và nói
      // bằng câu của chính chuyện đó — không phải câu "ủa thiếu pate" của một ổ thiếu
      // một thứ. Xem khối `HOLLOW_REFUSED`.
      positive += this.settlePledge(c, dish);
      this.speakConcept(c, "HOLLOW_LOAF", { dishRefused: false }, 90, true, { mon: hollowWantLabel(c.order!) });
    } else if (spoken) {
      positive += this.settlePledge(c, dish);
      this.speakConcept(c, "DELIVERY", {
        defectCount: defects.length, defectKind: kindOf(spoken), defectWasSeen: spoken.witness === "ANTICIPATED",
        orderIsUsual: c.order!.intent.usual, dishUnderdone: crustLow,
      }, 90, true, { mon: spoken.label });
    } else {
      positive += this.settlePledge(c, dish);
      bus.emit("dialog:silent", { npcId: c.memKey, reason: "RATE_35" });
    }

    // Khẩu vị ẩn (P1-01 §2.6) — không bao giờ nói ra, chỉ đi vào tiền boa. Khách vãng lai
    // không có hồ sơ khẩu vị: coi như "vừa miệng" (0,6).
    const taste = tasteOf(c.memKey);
    const sat = taste ? satisfaction(taste, servedVector(dish, opts.crust ?? 0.66)) : 0.6;
    positive += sat * 35;
    // Thứ khách TẬN MẮT thấy lúc mình làm (T1: khách chấm QUÁ TRÌNH) — tay dơ, rớt, cháy —
    // cũng nằm lại trong bụng họ lúc trả tiền, dù ổ bánh có đúng đơn.
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

    // Kênh 5: ký ức của lượt ghé này
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
        // `!grit`: một ổ có sạn trong đó không phải "ổ sạch", dù không ai thấy gì. Sổ tay
        // là chỗ cô Ba đối chiếu giả thuyết — ghi gian vào đó là hỏng cả cái bài suy luận.
        if (!defects.length && !grit && ![...c.observations.values()].some((o) => o.peak === "CONFIRMED")) t.cleanServedFront.push(c.npc.id);
      }
      const sawBad = [...c.observations.values()].some((o) => o.peak === "CONFIRMED");
      // Cái giá THẬT của nhánh "không ai thấy": lượt này mất tư cách một lượt bán sạch —
      // không `servedWell` (quan hệ không nhích lên), và không `disprove` (tin đồn "bên đó
      // bánh rớt" lẽ ra nhạt đi sau một ổ đàng hoàng thì nay giữ nguyên).
      if (!defects.length && !sawBad && !grit) {
        servedWell(m, c.personality, clamp01(1 - silentScore / 120), isSilentGrudge(c.personality));
        // P2-04 §2.6 kênh #1 — làm NGƯỢC LẠI, trong tầm nhìn: tin "ăn bớt", "bánh rớt"… nhạt đi
        if (this.deps.gossip) disprove(this.deps.gossip, c.memKey, ["ORDER_DEFECT", "DROPPED_FOOD", "DIRTY_HANDS", "BURNT_OR_COLD"], this.deps.day);
      }
    }

    // P3-04 A3 — thớt riêng sống/chín: người rất kỹ tính (soi ≥ 0,8) để ý, MỘT lần mỗi người cả mùa
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
      // SK-02 · đổi hàng với bà Sáu — không qua tiền: một chén tàu hũ lấy một ổ bánh (BARTER)
      this.out.push({ kind: "log", text: `${this.label(c)} đổi một chén tàu hũ lấy ổ bánh.` });
      this.noteOpening({ complained: false, paidExact: true, smiled: true, noChange: false, friend: true });
    } else {
      // Ổ rỗng: đưa ra cái gì thì tính tiền cái đó — bánh mì không (xem `isHollowLoaf`).
      // Ổ vẫn được TRẢ TIỀN BÁNH, chỉ không được tính tiền nhân chưa hề bỏ vô.
      if (hollow) this.out.push({ kind: "log", text: `${this.label(c)} cầm ổ chưa có nhân — tính tiền bánh mì không.` });
      this.settlePayment(c, this.pricedAfterPledge(c, loafPriceVnd(hollow ? "khong" : tierOf(c.order!.intent))), tip, !!spoken);
    }
    if (nb) nb.today.served++;
    // Một ổ = một dòng. Phát ở ĐÂY chứ không sau `leave()`: tiền đã tính xong (chạy qua cô
    // Mai đổi lẻ cũng là một MADE_THEM_WAIT), còn ổ thứ hai của cùng người thì tính riêng —
    // người chơi bỏ thêm đồ chua vô ổ thứ hai phải đọc được dòng của ổ thứ hai.
    this.settleRelMoved(c, relBefore);
    // Người ta nhớ lượt ghé này theo cách nào — `farewell()` đọc lúc họ quay lưng.
    // GRIT đứng TRƯỚC DEFECT: xem ghi chú `ServeOutcome`.
    this.serveOutcome.set(c.id, grit ? "GRIT" : defects.length ? "DEFECT" : c.waitStage >= 2 ? "WAITED" : "CLEAN");
    if (this.deps.story) {
      const ok = defects.length === 0;
      const r = onServed(this.deps.story, {
        npcId: c.npc?.id ?? null, tag: c.plan?.tag, day: this.deps.day, ok, order: c.order!, dish: [...dish], viaAlt,
        crustOk: (opts.crust ?? CRUST.READY) >= CRUST.READY, atMin: this.nowMin, barter: !!c.plan?.barter,
      });
      this.queueLines(c, [...(ok ? c.plan?.served?.ok ?? [] : []), ...(c.plan?.served?.any ?? [])], 1.2);
      for (const s of r.say) c.script.push({ at: this.nowSec + (s.delay ?? 1.2), text: s.text, by: s.by && s.by !== c.memKey ? s.by : undefined });
      if (viaAlt && c.npc?.id === "CHU_TU") this.react(c, "FLOURISH", 1, "NOD");      // ML-02: nhìn lên một giây. Hết.
      c.plan = c.plan ? { ...c.plan, served: undefined } : null;
    }
    // mua thêm ổ nữa — một người, từng ổ một; tiền tính từng ổ
    // hết bánh rồi thì thôi ổ thứ hai — khách cầm ổ đầu về, không đứng chờ cái không có
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
      return { ok: true };
    }
    c.carrying = true;
    // "Trả tiền rồi bỏ món" — P2-02 §3.4: soi ≥ 0,7 + nóng ≤ 0,3 + vệ sinh CONFIRMED. KHÔNG
    // mất tiền — mất NGƯỜI. Người chơi phải nhìn thấy nó, nên nó xảy ra trong khung hình.
    const sawHygiene = [...c.observations.values()].some((o) => o.peak === "CONFIRMED"
      && (o.id === "DROPPED_FOOD" || o.id === "DIRTY_HANDS" || o.id === "BURNT_OR_COLD"));
    if (c.personality.soi >= 0.7 && c.personality.nongTinh <= 0.3 && (sawHygiene || (isSilentGrudge(c.personality) && defects.length > 0))) {
      c.binDetour = true;
    }
    this.leave(c, "served");
    return { ok: true };
  }

  /**
   * `pickSpoken` — P1-03 §2.9.3:
   *  1. xếp theo điểm = (phát hiện lúc ăn ? sEat : sCounter) × magnitude
   *  2. có lỗi ĐÃ THẤY mà thua lỗi đứng đầu chưa tới 15 điểm → nói lỗi đã thấy
   *  3. túi im lặng theo người (7/20) → không nói gì
   */
  private pickSpoken(c: Customer, defects: DiffedDefect[], force = false): DiffedDefect | null {
    if (!defects.length) return null;
    const score = (d: DiffedDefect) => (d.witness === "DISCOVERED" ? d.sEat : d.sCounter) * d.magnitude;
    const sorted = [...defects].sort((a, b) => score(b) - score(a));
    let top = sorted[0];
    const ant = sorted.find((d) => d.witness === "ANTICIPATED");
    if (ant && score(top) - score(ant) < 15) top = ant;
    // `force`: ổ chưa có nhân không được túi im lặng tha (xem khối `HOLLOW_REFUSED`). Và
    // KHÔNG rút vé: để dành cả 20 vé cho mấy lỗi mà im lặng còn có nghĩa lý.
    if (!force && !this.barks.speaks(c.memKey)) return null;
    return top;
  }

  /** P1-03 §2.9.2 — lỗi còn "nằm trong bụng" khách, không nói ra nhưng vẫn tính. */
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

  /**
   * `computeTip` — P1-03 §2.12. Tiền boa là thứ DUY NHẤT chất lượng đụng tới; không hiện
   * ra thành chỉ số nào (T3) — người chơi chỉ thấy tiền trong ống nhiều hay ít.
   */
  private tipOf(c: Customer, silentScore: number, positive: number) {
    const tier = this.mem(c.memKey).tier;
    const q = clamp01(1 - silentScore / 120) ** 1.6;
    const p = clamp01(positive / 100);
    const generosity = 0.6 + 0.8 * c.personality.thanThien;
    const strictness = 1 - 0.5 * c.personality.soi * (1 - q);
    const t = PRICE_BANH * TIP_RATE[tier] * q * (1 + 0.45 * p) * generosity * strictness;
    return Math.max(0, Math.round(t / 1000) * 1000);
  }

  /**
   * FREE_EXTRA — CANON §8i: nhỏ dần trong NGÀY (1 / 0,6 / 0,25); người soi ≥ 0,7 tới lần
   * thứ 3 trong ngày là thấy mình đang bị mua chuộc → phản tác dụng.
   */
  private freeExtra(c: Customer, dish: Ingredient[]) {
    if (generosityOf(c.order!, dish) <= 0) return 0;
    const n = (this.freeExtraToday.get(c.memKey) ?? 0) + 1;
    this.freeExtraToday.set(c.memKey, n);
    this.mem(c.memKey).freebies++;
    // câu "cô ngại" do rule DELIVERY `freeExtraTooMuch` nói
    if (n >= 3 && c.personality.soi >= 0.7) return -FREE_EXTRA_BASE;
    const mul = FREE_EXTRA_DIMINISH[Math.min(n - 1, FREE_EXTRA_DIMINISH.length - 1)];
    this.emitStim("FREE_EXTRA", { salience: FREE_EXTRA_BASE * mul });
    this.remember(c, "FREE_EXTRA", FREE_EXTRA_BASE * mul);
    const lbl = extraLabel(c.order!, dish);
    this.noteRel(lbl ? `cho thêm ${lbl}` : "cho thêm chút đỉnh", FREE_EXTRA_BASE * mul);
    return FREE_EXTRA_BASE * mul;
  }

  /**
   * THÓI QUEN "cho thêm" — cho ba bữa liền rồi bữa thứ tư đưa ổ trơn thì người ta CHƯNG HỬNG.
   * Đếm theo LƯỢT GHÉ chứ không theo ngày (`sim/memory.ts`: `extraHabit`), một lượt một lần.
   * Trả về cường độ cái hụt để `serveDish` trừ vào `positive`.
   */
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
   * Mời ly trà đá — vừa là chăm sóc, vừa là công cụ CHỦ ĐỘNG hạ attention, nên cũng là công cụ
   * dễ phá game nhất. Các khoá:
   *  · khách còn cầm ly thì không nhận ly nữa · cooldown 45 s mỗi người
   *  · `CARED_FOR_THEM` nhỏ dần 1,0 / 0,6 / 0,25, đếm theo NGÀY
   *  · trần theo `soi` áp cho MỌI khách (`teaSuspectAtCup`); bắt bài rồi thì thôi CẢ MÙA, vì nó
   *    nằm trong trí nhớ của người ta chứ không trong một lượt ghé
   *  · trà là MỜI: mỗi ly tốn tiền, có hạn 18 ly/ngày
   */
  serveTea(): { ok: boolean; reason?: string } {
    const c = this.front;
    if (!c || c.phase === "leaving") return { ok: false, reason: "chưa có ai để mời" };
    if (c.holdingTea) return { ok: false, reason: `${this.label(c)} còn cầm ly kia` };
    if (this.teaSuspect(c)) return this.refuseTea(c);
    if (this.teaLeft <= 0) return { ok: false, reason: "hết đá rồi" };

    // Ly thứ mấy TRONG NGÀY của người này — ghé lần hai không làm bộ đếm về 0.
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
      if (r.say.length && c.holdLeft > 0) c.holdLeft = Math.min(c.holdLeft, 6);   // kể xong rồi gọi món
    }
    /*
     * GIỮ LỜI — thưởng trả Ở ĐÂY, lúc ly trà thật sự tới tay, không trả lúc nói. Trả lúc hứa
     * thì cách chơi tối ưu là hứa rồi quên.
     */
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

  /**
   * "Bắt bài chuyện mua chuộc" — sống trong TRÍ NHỚ của người đó (`NpcState.seen.teaSuspect`)
   * nên nó qua được lượt ghé sau, qua đêm và qua save.
   *
   * ⚠️ Khách vãng lai dùng chung `memKey` theo KIỂU NGƯỜI nên cờ này dính cho cả kiểu người đó.
   */
  private teaSuspect(c: Customer) {
    return !!this.mem(c.memKey).seen?.teaSuspect;
  }

  /**
   * Bị từ chối: KHÔNG tốn ly nào (ly còn trên tay người bán), nhưng cũng không được
   * phép chỉ là một dòng log. Khách nói ra câu của mình (TEA_SUSPECT) và đổi mặt —
   * nhóm NAME của bảng P2-02 §3.1: cái ngượng xã giao, không phải chê món.
   */
  private refuseTea(c: Customer): { ok: false; reason: string } {
    this.speakConcept(c, "INTERACT", { interaction: "TEA_SUSPECT" }, 70, true);
    this.react(c, "CARED_FOR_THEM", 2, undefined, "NAME");
    return { ok: false, reason: `${this.label(c)} không nhận nữa` };
  }

  // ──────────────────────────────────────── trò chuyện (P2-06 — flow v2, hai kênh)

  /**
   * CÓ AI ĐANG CHỜ MÌNH KHÔNG — câu hỏi duy nhất chia hai kênh của P2-06 §2.1.
   *
   *   có    → kênh HÀNH ĐỘNG: khách nói bằng bong bóng, mình đáp bằng NGUYÊN LIỆU
   *   không → kênh LỜI: dải lựa chọn mở được
   *
   * Người đã nhận bánh mà còn nán lại thì KHÔNG tính — họ không chờ gì nữa.
   */
  private someoneWaiting(except: Customer | null = null): boolean {
    return this.customers.some((c) =>
      c !== except && !c.balking && !c.pass
      && (c.phase === "queueing" || c.phase === "ordering" || c.phase === "waiting"));
  }

  /**
   * Cuộc SÂU mở được không. ⚠️ "Không ai đang chờ" KHÔNG bao gồm chính người mình đang nói
   * chuyện với (`except`): tính cả họ vào thì một người đứng chờ bánh không bao giờ mở miệng
   * được, kể cả khi cả hẻm chỉ có mình họ.
   *
   * Cái THẬT SỰ phải chặn là bỏ MỘT HÀNG NGƯỜI để đi tâm sự với một người, nên phép đo đúng
   * là "có ai KHÁC đang chờ không".
   */
  private canOpenDeep(except: Customer | null = null): boolean {
    return !this.someoneWaiting(except)
      && this.deepToday < TALK_DEEP_PER_DAY
      && bandOf(this.nowMin) !== "PEAK";
  }

  /**
   * Cuộc này mở được ở ngữ cảnh hiện tại không — chỗ hai kênh của §2.1 thành code.
   *   FULL          chỉ ở kênh LỜI: không ai chờ, chưa đụng trần ngày, không cao điểm
   *   SHORT · BARK  nói được cả lúc đang bán, nhưng chỉ với người mình đang phục vụ hoặc người
   *                 vừa mở lời với mình
   *
   * Luật không phải "im khi đang bán", mà là NÓI VỚI ĐÚNG NGƯỜI ĐANG ĐỨNG TRƯỚC MẶT MÌNH.
   */
  private canRun(t: Talk, c: Customer): boolean {
    const kind = talkKindOf(t);
    /*
     * MỜI đi theo luật của RIÊNG nó, không theo luật hội thoại: nó là việc duy nhất còn làm
     * được khi quán vắng, và `inviteChance` đã đo sẵn "quán đang vắng" bằng `ahead`. Bắt nó
     * qua thêm trần ngày và cổng giờ cao điểm là đánh thuế hai lần lên cùng một hành động.
     */
    if (kind === "MOI") return !this.someoneWaiting(c);
    /*
     * MỌI cây `FULL` đều qua cổng, không riêng `CHUYEN`. ⚠️ Dùng `countsAgainstDailyCap(t)` ở
     * đây là để 5 cây `FULL` của `walkin.json` lọt hẳn qua cổng PEAK.
     *
     * Trần NGÀY thì vẫn chỉ `CHUYEN` mới tiêu — "được mở lúc nào" và "tiêu vào túi nào" là hai
     * chuyện khác nhau.
     */
    if (t.depth === "FULL") return this.canOpenDeep(c);
    return !this.someoneWaiting(c) || c === this.front || !!this.offerFor(c);
  }

  /**
   * Người chơi chủ động bắt chuyện. Trả `null` = không mở được; scene hỏi `talkUnavailable()`
   * để biết nói câu gì.
   *
   * ⚠️ HỢP ĐỒNG VỚI SCENE: dải còn mở thì `clock.busy = true` — đồng hồ chạy ở
   * `TIME_SCALE_BASE`, KHÔNG đóng băng. Nói chuyện tốn giờ bán thật.
   */
  openTalk(): TalkView | null {
    if (this.talkSession) return this.talkView("");
    const c = this.talkTarget();
    if (!c) return null;
    const key = this.talkKey(c);
    // Người đi ngang chỉ dừng được ngần này lần cho một lượt đi qua — xem `PASSER_TALKS_MAX`.
    if (c.ambient && (this.passerTalks.get(c.id) ?? 0) >= PASSER_TALKS_MAX) return null;
    const waiting = this.offerFor(c);
    // Chưa nạp xong (vừa spawn, hoặc chunk còn đang tải). Không chặn frame, không nói dối.
    if (!waiting && !this.talks.has(key)) { this.talks.ensure(key); return null; }
    /*
     * Rút cuộc — ba cổng, theo thứ tự: người này vừa bắt chuyện với mình → dùng ĐÚNG cuộc họ đã
     * mở lời · cuộc đang giữ dở → trả lại đúng cuộc đó, không rút lại (chống máy reroll nội
     * dung) · rút mới từ tập đã lọc `source !== "NPC_ONLY"`.
     */
    /*
     * Cuộc đang GIỮ DỞ chỉ được dùng lại nếu nó còn chạy được. ⚠️ Giữ vô điều kiện là một
     * cái khoá: cuộc giữ dở hết chạy được nhưng vẫn đứng TRƯỚC `pickRunnable`, nên cả kho
     * `ANY` — đúng cái tầng "không bao giờ cạn" — không với tới được.
     */
    const held = this.heldTalk.get(c.id);
    const talk = waiting?.talk
      ?? (held && this.canRun(held, c) && this.stillEligible(held, c) ? held : null)
      ?? this.pickRunnable(c, "PLAYER")
      // Không còn cuộc nào chạy được NGAY: rút một cuộc để GIỮ lại, chỉ để `talkUnavailable()`
      // nói đúng lý do ("gật đầu một cái rồi quay đi") thay vì im bặt.
      ?? pickTalk(this.talks.get(key), this.talkCtx(c), this.dialogRng, "PLAYER");
    if (!talk) return null;
    // Cuộc sâu mà đang có người chờ bánh / đang cao điểm / đã đủ trần ngày: chưa phải lúc.
    // KHÔNG tiêu cuộc đó — nó còn nguyên cho khoảng vắng.
    if (!this.canRun(talk, c)) { this.heldTalk.set(c.id, talk); return null; }
    const opened = !!waiting;
    if (waiting) this.offers.splice(this.offers.indexOf(waiting), 1);
    this.heldTalk.set(c.id, talk);
    /*
     * CỐ Ý chưa đánh dấu "đã nói chuyện này" ở đây — xem `chooseTalk`. Đánh dấu ngay lúc mở
     * thì mở rồi bỏ ngang là cuộc đó mất luôn CẢ MÙA, và phím trông như chết.
     */
    this.talkSession = new TalkSession(talk, c.memKey);
    this.talkWith = c;
    this.holdTalkVoice(c);
    this.talkWarmth = 0;
    this.talkAngered = false;
    this.actReply = null;
    /*
     * Gọi một người đang đi ngang thì người ta DỪNG LẠI — ngay chỗ đang đứng, không
     * phải đi nốt tới chỗ ngoái nhìn rồi mới quay lại.
     */
    if (c.ambient && c.pass) {
      c.pass.spot = { x: c.x, y: c.y };
      c.pass.until = c.now + PASSER_TALK_TAIL;
    }
    this.talkEngaged = false;
    this.talkNpcOpened = opened;
    /*
     * TRUY HỒI CHẠY TRƯỚC KHI DỰNG NHỊP ĐẦU: `m.remembers` quyết nút nào TỒN TẠI, nên nó
     * phải có giá trị trước `talkView()`. Chạy sau là mọi câu nhắc chuyện cũ biến mất ở nhịp
     * đầu rồi hiện ra ở nhịp hai.
     */
    this.recalled = this.recallFor(c, new Set(talk.about ?? []));
    // Nhìn MẶT người bán, không nhìn tay — cùng cửa với ASK_QUESTION cũ (P1-02 §2.8).
    if (c.now - c.lastAskedAt >= ASK_COOLDOWN) {
      c.ask();
      this.deps.bus.emit("attention:toolUsed", { tool: "ASK_QUESTION", npcId: c.memKey, durationSec: 3 });
    }
    /*
     * NGƯỜI CHƠI CHỦ ĐỘNG THÌ NGƯỜI CHƠI NÓI TRƯỚC: bấm phím → danh sách câu → mình nói → họ đáp.
     *
     * ⚠️ KHÔNG phát `talk.opener` ở đường này — `opener` viết cho tình huống NPC tự mở lời, và nó
     * chỉ còn đúng một đường dùng là `offerTalk`.
     */
    return this.talkView("", false, undefined);
  }

  /**
   * Ảnh chụp thế giới NGAY LÚC NÀY — P2-07 §3. Chỉ chỗ này dựng nó.
   *
   * `hand` và `onStreet` do scene đặt mỗi frame; headless thì mặc định tay không, đứng
   * sau quầy — đúng với một cái bot không có tay.
   */
  /**
   * KHUNG CẢNH đang diễn ra giữa người chơi và người này. Suy ra, không khai — cả bảy khung
   * đã tương ứng 1–1 với trạng thái hệ mô phỏng đang giữ. Thứ tự duyệt là thứ tự CHẶT DẦN.
   */
  practiceOf(c: Customer): PracticeId {
    if (c.ambient || c.pass) return "DI_NGANG";
    if (c.phase === "queueing" || c.phase === "arriving") return "XEP_HANG";
    /*
     * GỌI MÓN LÀ MỘT KHOẢNH KHẮC, KHÔNG PHẢI MỘT KHUNG CẢNH — pha `ordering` chiếm 165/131.221
     * frame trong mười ngày, nên khoá một cuộc vào riêng pha đó là chôn nó. Cửa thật là "cái đơn
     * còn đang mở"; qua mốc `ORDER_WINDOW` thì chuyện chuyển sang HỌ ĐANG ĐỢI MÌNH.
     */
    if (c.phase === "ordering") return "GOI_MON";
    if (c.phase === "waiting") return c.waitRatio < ORDER_WINDOW ? "GOI_MON" : "DOI_BANH";
    /*
     * Người đã nhận bánh mà còn nán lại: CÓ AI ĐANG CHỜ hay không đổi hẳn khung cảnh.
     * Còn người chờ thì đây là một người nán lại giữa lúc mình bận (`NAN_LAI`); không
     * ai chờ thì đây đúng là khoảng vắng — chỗ duy nhất chuyện đời sống được (`QUAY_VANG`).
     */
    if (c.leaveReason === "served" || this.serveOutcome.has(c.id)) {
      return this.someoneWaiting(c) ? "NAN_LAI" : "QUAY_VANG";
    }
    return "QUAY_VANG";
  }

  /**
   * NHỚ RA CHUYỆN GÌ CHO CUỘC NÀY. Gọi MỘT lần lúc mở cuộc và phải chạy TRƯỚC khi dựng bộ lựa
   * chọn đầu tiên, vì `m.remembers` quyết nút nào tồn tại.
   *
   * Người KHÔNG CÓ TÊN không bao giờ nhớ gì — `memKey` của họ dùng chung cho tám dáng người.
   */
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
        /*
         * `t.glanced` = ĐÃ NGOÁI NHÌN THẬT. ⚠️ Không đọc `pass.stay > 0`: đó là cờ KẾ HOẠCH đặt
         * lúc spawn, đúng suốt cả quãng đi, nên mọi câu khoá `t.glanced` bày ra cho người đang
         * rảo bước ngang qua. `pass.until >= 0` là mốc họ TỚI chỗ ngó.
         */
        glanced: !!c.pass && c.pass.stay > 0 && c.pass.until >= 0,
        /*
         * `t.lookingInside` = ĐANG nhìn vào quầy, ngay lúc này. Với khách đứng ở quầy đó là
         * `gazeState === "WATCH"`; với người đi ngang thì `gazeState` không chạy, nên "đang
         * nhìn" là khoảng giữa lúc tới chỗ ngó và lúc hết giờ đứng.
         */
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
      ovenHot: this.ovenHot,
      band: bandOfMinutes(this.nowMin),
      dayIndex: this.deps.day,
    };
  }

  /** Người chơi bấm lựa chọn thứ `i` (hoặc phím số). Trả nhịp kế, hoặc nhịp cuối với `done`. */
  chooseTalk(i: number): TalkView | null {
    const s = this.talkSession, c = this.talkWith;
    if (!s || !c) return null;
    // Gia hạn TRƯỚC khi chạy nhịp: nhịp này có thể là nhịp cuối và tự gọi `endTalk()`.
    this.holdTalkVoice(c);
    /*
     * CÂU LẠC ĐỀ — kiểm `while` TRƯỚC khi áp bất cứ hệ quả nào. `need` thì ẩn lựa chọn đi,
     * `while` thì không: vừa nãy câu đó còn đúng, nên người chơi có lý do chính đáng để bấm —
     * nhưng thế giới cũng không giả vờ hiểu, người ta hiện "?" rồi thôi.
     */
    const pending = s.peek(i, this.talkGate());
    if (pending?.while?.length) {
      const w = this.snapshot(c);
      if (!allHold(pending.while, w)) {
        const why = firstBroken(pending.while, w);
        this.deps.bus.emit("dialog:silent", { npcId: c.memKey, reason: "NO_RULE" });
        this.out.push({ kind: "log", text: `con: "${this.fill(c, pending.say)}"` });
        this.out.push({ kind: "log", text: `${this.label(c)}: "?"` });
        // Nhẹ, nhưng không bằng không: nói lạc đề với người đang đứng trước mặt mình là
        // một chuyện có thật. Không `anger` — người ta chỉ không hiểu, không bực.
        this.applyTalkOption(c, { rel: -1 }, "câu mình vừa nói trật");
        void why;
        /*
         * GẠCH CÂU VỪA TRẬT — nếu không thì nhịp cũ hiện lại nguyên si và bấm được vô hạn lần,
         * mỗi lần trừ một điểm quan hệ. Gạch xong mà nhịp hết đường thì đóng phiên: người ta quay
         * đi, không bày tiếp một dải mà bấm cái nào cũng hỏng.
         */
        if (s.strike(pending)) { this.endTalk(); return null; }
        return this.talkView("?", false, "NGHI", this.fill(c, pending.say));
      }
    }
    const r = s.choose(i, this.talkGate());
    if (!r) return null;
    // Nói ra một câu rồi mới tính là đã nghe cuộc này — một lần cho cả mùa.
    if (!this.talkEngaged) {
      this.talkEngaged = true;
      if (c.ambient) this.passerTalks.set(c.id, (this.passerTalks.get(c.id) ?? 0) + 1);
      this.markTalkUsed(c, s.talk);
      this.heldTalk.delete(c.id);
      /*
       * Trần ngày tính theo cuộc ĐÃ NÓI, không theo cuộc đã mở: đọc rồi đổi ý không tốn gì.
       * Và CHỈ `CHUYEN` mới tiêu — mời một người lạ ghé mua không phải là một lần tâm sự
       * với bà Bảy, nên nó không được ăn vào cùng một cái túi (xem `TalkKind`).
       */
      if (countsAgainstDailyCap(s.talk)) this.deepToday++;
    }
    this.out.push({ kind: "log", text: `con: "${this.fill(c, r.node.say)}"` });
    this.actReply = null;
    this.applyTalkOption(c, r.node, "câu mình vừa nói");
    // Câu đáp của một HÀNH ĐỘNG thắng câu đáp viết sẵn: lời mời được nhận hay bị từ chối
    // là chuyện của cái roll, không phải của lựa chọn người chơi vừa bấm.
    const act = this.takeActReply();
    const reply = act?.text ?? r.reply;
    if (reply) this.out.push({ kind: "log", text: `${this.label(c)}: "${this.fill(c, reply)}"` });
    // Im lặng vẫn phải THẤY được: mặt đổi, dáng đổi, chỉ là không có chữ nào.
    else if (r.node.silent) this.reactTalk(c, "NAME", 1, "TURN_AWAY_QUARTER");
    const view = this.talkView(this.fill(c, reply ?? ""), !reply && !!r.node.silent,
      act?.mood ?? r.node.mood, this.fill(c, r.node.say));
    if (r.done) {
      /*
       * `WALK_ON` LÀ TRẠNG THÁI NGHỈ CỦA NGƯỜI ĐI NGANG — họ là người ĐANG ĐI, nên không nút nào
       * phải khai nó. Ba ngoại lệ, đều là chuyện họ còn việc ở đây: vừa nhận lời mời, đang đứng
       * chỗ mát, đang ăn miếng bánh mình vừa đưa.
       */
      const stays = c.inShade || c.eating || !c.ambient;
      this.endTalk();
      if (c.ambient && !stays) this.walkOn(c);
    }
    return view;
  }

  /**
   * Đóng bảng mà chưa nói hết — Esc, hoặc đi làm việc khác. KHÔNG phải nút huỷ: làm thinh
   * với người đang nói chuyện với mình là một câu trả lời, và nó có giá (`talk.ignore`).
   */
  closeTalk(): void {
    const s = this.talkSession, c = this.talkWith;
    const engaged = this.talkEngaged, npcOpened = this.talkNpcOpened;
    this.endTalk();
    if (!s || !c || s.done) return;
    /*
     * LÀM THINH có giá — nhưng chỉ khi thật sự có cái để làm thinh:
     *   khách mở lời trước, mình đóng bảng  → có giá
     *   mình bấm F rồi đổi ý, chưa nói gì   → không mất gì, cuộc đó vẫn còn để bấm F lại
     *   mình đã nói rồi mới bỏ ngang        → có giá
     */
    if (npcOpened || engaged) this.applyIgnore(c, s.talk);
    // Bỏ ngang một người đang đi ngang thì họ đi tiếp — không đứng chờ mình đổi ý.
    if (c.ambient && !c.inShade && !c.eating) this.walkOn(c);
  }

  /**
   * VÌ SAO KHÔNG NÓI ĐƯỢC — mười một lý do, mười một câu. Nguyên tắc: mỗi nguyên nhân KỸ THUẬT
   * ánh xạ sang một lý do CON NGƯỜI nhất quán; nhất quán quan trọng hơn hay.
   *
   * ⚠️ Thứ tự duyệt: NGƯỜI CHƠI → HOÀN CẢNH → QUAN HỆ. Quan hệ luôn là lời giải thích CUỐI CÙNG,
   * không bao giờ là mặc định — theo T3 người chơi không kiểm chứng được nó.
   *
   * Trả `null` = KHÔNG hiện gì cả.
   */
  talkUnavailable(): string | null {
    const c = this.talkTarget();
    if (!c) return null;                                       // 11 — không ai được tô sáng
    if (!this.talks.has(this.talkKey(c))) return null;         // 10 — chưa nạp xong
    const who = this.label(c);
    const a = this.addressOf(c);
    // 9 — người đi ngang đã từ chối lời mời: họ trả lời rồi
    if (c.inviteRefused) return `${who} nói rồi — người ta đi tiếp.`;
    /*
     * Người đi ngang có BỘ LÝ DO RIÊNG, ngắn hơn hẳn: mấy lý do phía dưới đều tra
     * `mem(memKey)`, mà `memKey` của người lạ là `walkin<dáng>` — tám cái sổ dùng chung cho
     * cả mùa, nên nói về tâm trạng hay độ thân của họ là bịa.
     */
    if (c.ambient) {
      if ((this.passerTalks.get(c.id) ?? 0) >= PASSER_TALKS_MAX) {
        return `${who} nói chuyện nãy giờ rồi — người ta còn đi.`;
      }
      if (this.someoneWaiting(c)) return "Còn người đang chờ bánh — để lát hẵng mời.";
      if (this.soldOut) return "Hết bánh rồi, mời người ta vô chi nữa.";
      return `${who} đi lướt qua, không ngó lại.`;
    }
    // 5 — đang chờ tới lượt sau người khác
    if (c.phase === "queueing") return `${who} đang chờ tới lượt.`;
    // 6 — sắp hết kiên nhẫn: họ đang gấp
    if (c.phase === "waiting" && c.waitRatio >= 0.6) return `${who} ngó đồng hồ — thôi làm cho người ta đi.`;
    // 1 — MÌNH đang bận, không phải họ. Người chờ bánh thì chỉ nói chuyện bằng ổ bánh.
    if (this.someoneWaiting(c)) return "Còn người đang chờ bánh — để lát.";
    // 2 — hôm nay có người có chuyện buồn
    if (c.dayMood.value < 0) return `${who} bữa nay hổng có tâm trạng.`;
    // 8 — họ không muốn nói chuyện VỚI MÌNH. Câu duy nhất thật sự là một lời từ chối,
    //     và nó phải ĐÃ ĐƯỢC KIẾM RA.
    if (this.mem(c.memKey).tier === "RIVAL") return `${who} ngó đi chỗ khác.`;
    // Trần ngày / giờ cao điểm: còn chuyện để nói, chỉ là chưa phải lúc.
    if (this.heldTalk.has(c.id) || !this.canOpenDeep(c)) return `${who} gật đầu một cái rồi quay đi.`;
    // 3 / 4 — hết chuyện riêng. Rẽ theo ĐỘ THÂN: "hết nội dung" không phải một sự thật về
    // thế giới, nên nó phải mượn một sự thật có thật để mặc vào.
    const tier = this.mem(c.memKey).tier;
    return tier === "FRIEND"
      ? `${who}: "Bữa nay cũng vậy à ${a.you}."`
      : `${who} gật một cái, hết.`;
  }

  /**
   * Ai đang là mục tiêu — MỘT state công khai: scene vẽ chỉ báo và phím bấm đều đọc CÙNG hàm
   * này (FR-21). ⚠️ KHÔNG loại `front` ra, nếu không thì mục tiêu phổ biến nhất của phím lại
   * là mục tiêu duy nhất không có chỉ báo nào.
   */
  get talkTargetNow(): Customer | null {
    return this.talkTarget();
  }

  /**
   * Dòng nhắc gọi việc này là gì: **mời** một người đang đi, và **nói chuyện** với người đang
   * đứng trước mặt mình. Dùng chung một chữ là dạy người chơi rằng chúng cùng một thứ, rồi để
   * họ tự ngạc nhiên khi luật khác nhau.
   */
  talkVerb(c: Customer): "mời" | "nói chuyện" {
    // Nói đúng việc SẮP XẢY RA, không nói theo loại người: hôm nay mời hết rồi thì bước
    // ra cũng chỉ còn chào được một câu, và dòng nhắc phải thừa nhận điều đó (T5).
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
    // `arriving` = còn đang đi giữa đường, chưa vào tới chỗ đứng. Gọi với một người đang
    // bước tới là nói với một cái lưng đang quay nửa chừng (lỗi ẩn H-10).
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
    // Người vừa mở lời với mình THẮNG TUYỆT ĐỐI — làm lơ người đang nói là chuyện khác hẳn.
    if (this.offerFor(c)) cost += TALK_B_ADDRESSED;
    // Người đứng đầu quầy là người mình đang phục vụ: mặc định phải là họ.
    if (c === this.front) cost += TALK_B_FRONT;
    // Đã từ chối lời mời rồi thì đừng chìa mặt ra làm mục tiêu nữa (lỗi #5).
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
      // Headless (`npm run sim`, test): không có vị trí người chơi → người đã mở lời,
      // rồi tới người đứng đầu quầy, y như bản cũ.
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

  /** Lời bắt chuyện đang treo của người này, nếu có. */
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
   * Cho scene bắt người đang nói chuyện nói MỘT câu ngay lập tức — không qua lịch nói. Lịch
   * nói (`say`) có độ trễ ngẫu nhiên, trần hai bong bóng và hạn bỏ câu: đúng cho bark, sai cho
   * một cuộc đối đáp mà người chơi vừa nói xong và đang đợi.
   */
  talkPartnerSpeak(text: string, sec: number) {
    const c = this.talkWith ?? (this.nowSec <= this.talkVoiceUntil ? this.talkVoice : null);
    // Đã đi khuất thật thì thôi — không có ai trên sân để mà hiện bong bóng.
    if (!c || !this.customers.includes(c)) return;
    c.speak(text, sec);
  }

  /** Cho `c` giữ quyền nói thêm `TALK_VOICE_TAIL` giây nữa — xem `talkVoice`. */
  private holdTalkVoice(c: Customer) {
    this.talkVoice = c;
    this.talkVoiceUntil = this.nowSec + TALK_VOICE_TAIL;
  }

  /** Còn nợ `c` một câu không? Người đi ngang phải đứng lại cho hết câu đó. */
  private owesLine(c: Customer) {
    return this.talkVoice === c && this.nowSec <= this.talkVoiceUntil;
  }

  /** Người đang nói chuyện với mình đứng ở đâu — scene vẽ dấu "đang trả lời" trên đầu họ. */
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

  /** Làm thinh: hiệu ứng khai trong `talk.ignore`, mặc định chỉ nguội đi một chút. */
  private applyIgnore(c: Customer, talk: Talk) {
    const ig = talk.ignore ?? { rel: DEFAULT_IGNORE_REL };
    this.applyTalkOption(c, { rel: ig.rel ?? DEFAULT_IGNORE_REL, anger: ig.anger, mem: ig.mem, mood: ig.mood }, "mình làm thinh");
    if (ig.reply) this.say(c, this.fill(c, ig.reply), 2, true, 55);
  }

  private talkFlags(): TalkCtx["flags"] {
    return (this.deps.story?.flags ?? {}) as TalkCtx["flags"];
  }

  /** Điều kiện hiện lựa chọn. Két rỗng thì không hứa được chuyện tốn tiền (P5-02). */
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
    /*
     * `{gia}` · `{gia2}` — GIÁ LẤY TỪ BẢNG GIÁ, không gõ vào lời thoại. Một con số viết cứng
     * trong câu nói là một con số sẽ sai vào ngày ai đó chỉnh bảng giá, và không test nào bắt
     * được — với trình kiểm kiểu nó chỉ là một chuỗi.
     */
    // `{gio}` — ĐỒNG HỒ, không phải một con số gõ vào lời thoại. Xem `core/clock.gioVi`.
    if (s.includes("{gio}")) s = s.replace(/\{gio\}/g, gioVi(this.nowMin));
    if (s.includes("{gia")) {
      const one = c.order ? loafPriceVnd(tierOf(c.order.intent)) : loafPriceVnd("thuong");
      s = s.replace(/\{gia(\d*)\}/g, (_m, n: string) => dongVi(one * (Number(n) || 1)));
    }
    return s.replace(/\{(call|me|self|you)\}/g, (_m, k: keyof typeof a, at: number) => {
      const w = a[k];
      // Đầu câu thì viết hoa. Không có cái này thì người viết phải tránh đặt chỗ trống ở
      // đầu câu suốt đời, và sẽ có ngày quên — ra một câu bắt đầu bằng "con" chữ thường.
      const before = s.slice(0, at).trimEnd();
      return before === "" || /[.!?…]$/.test(before) ? w[0].toUpperCase() + w.slice(1) : w;
    });
  }

  /**
   * Vai của người này. Người có tên tra `ADDRESS` theo id; người lạ tra `WALKIN_ADDRESS`
   * theo DÁNG (`memKey` = `walkin<i>`, cùng chỉ số với `WALKIN_STYLES`), vì cả tám dáng
   * dùng chung một kho thoại mà vai thì khác hẳn nhau.
   */
  private addressOf(c: Customer) {
    if (c.npc) return ADDRESS[c.npc.id] ?? ADDRESS.WALKIN;
    const i = Number(c.memKey.slice("walkin".length));
    return (c.memKey.startsWith("walkin") && WALKIN_ADDRESS[i]) || ADDRESS.WALKIN;
  }

  /**
   * Khoá kho nội dung: người có tên dùng id, khách vãng lai dùng chung một file.
   *
   * ⚠️ Người QUA ĐƯỜNG có kho RIÊNG (`QUA_DUONG`): kho `WALKIN` toàn chuyện của người đang MUA
   * (trả giá, chê mắc, đòi bớt pate), đem cho người đi ngang là họ mặc cả một ổ chưa hề hỏi mua.
   */
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

  /**
   * CHẤM MỘT CUỘC CHO NGƯỜI NÀY — ba tầng nhân vào nhau:
   *   1. điểm drive (dạng độ chênh của Zubek), đã nhân hệ số `tune` của hồ sơ
   *   2. ×1,25 nếu cuộc đó nói đúng chuyện CỦA HỌ (`advertises`)
   *   3. ×0,15 nếu đụng chuyện CẤM (`taboo`) — không chặn hẳn, vì nói hớ phải có giá chứ không
   *      phải không tồn tại
   */
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

  /**
   * Ghi "đã nói chuyện này rồi" — hai cái sổ, chọn đúng cái là chỗ quan trọng:
   *  · 12 người CÓ TÊN nhớ theo MÙA (`mem.talksDone`)
   *  · người KHÔNG CÓ TÊN nhớ theo LƯỢT GHÉ — `memKey` của họ là `walkin<dáng>`, tám cái sổ dùng
   *    chung cho cả mùa, ghi vào đó thì 64 cuộc `QUA_DUONG` cạn trong một hai ngày
   *
   * Cuộc dùng chung (`ANY`) không vào sổ mùa của ai; `usedToday` theo chủ đề vẫn áp dụng.
   */
  private markTalkUsed(c: Customer, t: Talk) {
    const m = this.mem(c.memKey);
    /*
     * TẦNG `d.*` — SÁNG NAY HỌ ĐÃ KỂ CHUYỆN NÀY RỒI. Khoá theo `memKey`, không theo lượt ghé:
     * chú Tư ghé hai lần một sáng thì lần thứ hai không được hỏi lại chuyện vừa nghe.
     *
     * Khác `usedToday` (chặn RÚT LẠI cùng chủ đề) ở chỗ nó cho NỘI DUNG đọc — `d.toldMe(X)`.
     */
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

  /**
   * HÀNH ĐỘNG THẬT của một câu nói. Phần lớn `act` không kết thúc ở đây: nó TREO một lời hứa
   * lên lượt ghé (`pledges`), rồi `deliver()` và `settlePayment()` mới là chỗ biết người chơi
   * có giữ lời không — lời hứa phải sống qua quãng người chơi còn có thể đổi ý.
   */
  private applyAct(c: Customer, act: TalkAct, tone: TalkTone = "THUONG") {
    const pledge = (this.pledges.get(c.id) ?? { promised: [], discount: 0, free: false });
    this.pledges.set(c.id, pledge);
    switch (act.kind) {
      case "PAY": {
        // Tiền ra khỏi ngăn kéo NGAY, trước cả khi họ đưa tờ vé số — mua là mua.
        const have = this.deps.till?.floatLeft ?? Infinity;
        const amt = Math.min(act.vnd, have);
        if (this.deps.till) this.deps.till.floatLeft -= amt;
        this.out.push({ kind: "cost", amount: amt, item: "talk" });
        this.out.push({ kind: "log", text: `${act.note} — ${amt.toLocaleString("vi-VN")}₫` });
        break;
      }
      case "DISCOUNT":
        pledge.discount += act.vnd;
        break;
      case "FREE_LOAF":
        pledge.free = true;
        break;
      case "PROMISE":
        // Hứa cùng một món hai lần không thành hai món nợ.
        if (!pledge.promised.includes(act.item)) pledge.promised.push(act.item);
        break;
      case "STEP_ASIDE":
        this.askStepAside(c, act.forSec);
        break;
      /*
       * HỌ ĐI TIẾP — P2-08 §2 nhóm B, 56 nút đòi tới. "Đi học đi con" mà con bé không đi:
       * riêng bé Su câu đó xuất hiện 11 lần, và đây là chỗ nó đi thật.
       */
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
      case "LEAVE_SHADE":
        this.leaveShade(c);
        break;
      case "LOOK_INSIDE":
        c.lookInsideUntil = c.now + (forSecOf(act.forSec) ?? 6);
        break;
      case "PROMISE_DEED":
        this.promiseDeed(c, act.deed);
        break;
      /*
       * GHI NỢ ≠ CHO KHÔNG. `tu.quenvi` từng dùng `FREE_LOAF` cho một lần ghi nợ, nên chú Tư
       * quên ví là mình mất luôn một ổ, và cuốn sổ nợ của cô Mai không bao giờ có dòng nào.
       */
      case "CREDIT_LOAF":
        this.creditLoaf(c);
        break;
      case "REFUSE":
        /*
         * "Không bán cho nữa" chỉ có nghĩa với người ĐANG MUA. Với một người chỉ đi ngang
         * qua thì "bị mời đi" là một câu vô nghĩa — họ chỉ đi tiếp như mọi người đi ngang khác.
         */
        if (c.ambient) { c.inviteRefused = true; if (c.pass) c.pass.until = c.now; break; }
        this.out.push({ kind: "log", text: `${this.label(c)} bị mời đi.` });
        this.leave(c, "refused");
        break;
      case "INVITE":
        this.invite(c, act, tone);
        break;
    }
  }

  /**
   * MỜI một người đang đi ngang ghé vô mua — xem `sim/passersby.inviteChance`. Ba chi tiết cố ý:
   * dòng số là `invite:<id lượt đi ngang>` nên MỘT người chỉ có MỘT câu trả lời · người viết khai
   * cả `yes` lẫn `no` và CÁI ROLL quyết câu nào hiện ra · mặt đi theo kết quả chứ không theo lời.
   */
  private invite(c: Customer, act: Extract<TalkAct, { kind: "INVITE" }>, tone: TalkTone) {
    if (!c.ambient || !c.pass) return;
    const unlimited = !!this.deps.noTimePressure;
    const ahead = this.customers.filter((x) => x.phase !== "leaving" && !x.pass && !x.balking).length;
    const p = inviteChance({
      person: c.personality,
      // Đã ngoái nhìn cái xe thì nửa bước chân đã quay vô rồi — `stay > 0` là chỗ ghi điều đó.
      glanced: c.pass.stay > 0,
      tone,
      warmth: this.talkWarmth,
      ahead,
      // Trần thông lượng của ngày vẫn là trần: mời không phải cái cửa sau để lách §4.
      slots: Math.min(SLOTS.length, peakCap(this.deps.day, unlimited)),
      soldOut: this.soldOut,
    });
    /*
     * Mục đích và tâm trạng HÃM lời mời, không bao giờ đẩy nó lên — `INVITE_MAX = 0,8` vẫn là
     * trần. Người đang chạy đi mua thuốc gấp thì mời khéo cỡ nào cũng không dừng.
     */
    const yes = this.deps.hub.derive(`invite:${c.id}`).next() < p * (c.purpose?.inviteMul ?? 1);
    const mood: TalkMood = yes ? "CUOI" : "CUOI_KHAN";
    this.actReply = { text: yes ? act.yes : act.no, mood };
    this.scheduleReact(c, MOOD_FACE[mood], MOOD_POSE[mood]);
    if (!yes) {
      /*
       * Từ chối rồi là THÔI — ba chuyện cùng lúc: `inviteRefused` ẩn hẳn mọi lựa chọn `INVITE` ·
       * họ đi tiếp NGAY, không nán lại làm mục tiêu cho cú mời thứ hai · `talkCost` cộng phạt nên
       * phím tương tác thôi nhắm vào họ.
       *
       * Thiếu cả ba thì roll tất định chỉ chặn được kết quả, còn người chơi vẫn tốn thời gian
       * thật để nghe lại đúng câu "thôi" đó.
       */
      c.inviteRefused = true;
      if (c.pass) c.pass.until = c.now;
      this.out.push({ kind: "log", text: `${this.label(c)} đi tiếp.` });
      return;
    }
    this.acceptInvite(c);
  }

  /**
   * Người đi ngang nhận lời: từ đây họ là một người khách thật. Xoá sạch dấu vết của một lượt đi
   * ngang (`ambient`, `pass`) rồi trả họ về đúng đường đời của khách vãng lai.
   *
   * ⚠️ Không một nhánh `if` nào ở hạ nguồn được biết người này từng đi ngang — nếu không họ thành
   * một loại khách hạng hai có luật riêng.
   */
  private acceptInvite(c: Customer) {
    /*
     * ĐỔI VAI THÌ ĐỔI CẢ SỔ ĐẾM KHO THOẠI. ⚠️ `talkKey(c)` đọc `c.ambient` nên ngay sau hai dòng
     * dưới người này nhảy từ `QUA_DUONG` sang `WALKIN`, trong khi lúc spawn họ đã
     * `ensure("QUA_DUONG")` — cú `release("WALKIN")` thừa ở `leave()` có thể kéo `WALKIN` về 0
     * rồi thả `walkin.json` trong khi người ta còn đứng đó.
     */
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

  /**
   * HỌ ĐI TIẾP, và cuộc kết thúc. Với người đi ngang đây là trạng thái NGHỈ; với khách đang mua
   * thì họ BỎ ĐI, nên hai nhánh tách hẳn, và nhánh thứ hai đi qua `leave()` để kinh tế và trí
   * nhớ ghi đủ.
   */
  private walkOn(c: Customer) {
    if (c.ambient && c.pass) {
      c.inShade = false;
      c.sitting = false;
      c.pass.until = c.now;                       // hết nán, đi tiếp ngay
      c.pass.spot = c.pass.exit;
      this.out.push({ kind: "log", text: `${this.label(c)} đi tiếp.` });
    } else if (c.phase !== "leaving") {
      this.leave(c, "refused");
    }
    if (this.talkWith === c) this.endTalk();
  }

  /**
   * ĐƯA HỌ MIẾNG BÁNH — ổ RỜI TAY người chơi thật (`playerHand` về `empty`), nếu không thì "ăn
   * thử cho biết" là thiện cảm không tốn gì. Cổng `p.holdsBread` đã chặn ở `need` nên tới đây là
   * chắc có ổ; vẫn kiểm lại một lần vì `applyAct` gọi được từ đường khác.
   */
  private giveBread(c: Customer, forSec: ForSec) {
    if (!this.playerHand.startsWith("loaf")) return;
    this.out.push({ kind: "takeHand", npcId: c.memKey, name: this.label(c) });
    c.eating = true;
    c.eatUntil = c.now + (forSecOf(forSec) ?? 25);
    c.visit.gaveFood = true;
    this.keepDeed(c, "DUA_BANH");
    this.remember(c, "CARED_FOR_THEM", SALIENCE.CARED_FOR_THEM);
    this.out.push({ kind: "log", text: `${this.label(c)} cầm lấy ổ bánh.` });
  }

  /**
   * MỜI HỌ LY TRÀ từ một câu nói — nối vào đúng `serveTea()` đã có. Hai chỗ khác với bấm phím rót
   * trà: người được mời có thể là ai đang nói chuyện, và `v.gaveTea` được đặt nên kho dùng chung
   * không mời lại lần hai trong cùng một lượt ghé.
   */
  private offerTeaTo(c: Customer) {
    if (c.visit.gaveTea) return;
    const before = this.front;
    const r = before === c ? this.serveTea() : { ok: false, reason: "chưa tới chỗ rót" };
    if (r.ok) {
      c.visit.gaveTea = true;
      return;
    }
    // Không rót được ngay (chưa đứng đúng chỗ, hết đá, họ đã bắt bài): đây KHÔNG phải
    // chỗ nuốt lời — câu nói trở thành một lời hứa có hạn, và §2.6 lo phần còn lại.
    this.promiseDeed(c, { what: "ROT_TRA", dueSec: DEED_DUE.ROT_TRA });
  }

  /**
   * HỌ ĐI TỚI CHỖ MÁT VÀ ĐỨNG ĐÓ — rồi đi tiếp đúng mục đích cũ, nên `shadeUntil` là bắt buộc.
   *
   * Một chỗ, một người (`SHADE_CAPACITY`) — đó là lý do `w.shadeFree` là sự thật ĐỘNG: người khác
   * chiếm mất giữa lúc mình đang đọc thẻ là chuyện xảy ra được.
   */
  private standInShade(c: Customer, forSec: ForSec) {
    if (!this.shadeFree) return;
    c.inShade = true;
    c.shadeUntil = c.now + (forSecOf(forSec) ?? 25);
    if (c.pass) {
      // Nhớ đường cũ để còn trả họ về: họ đi tiếp ĐÚNG mục đích ban đầu, không bốc hơi.
      c.pass.spot = { x: SHADE_SPOT.x, y: SHADE_SPOT.y };
      c.pass.until = c.now + (forSecOf(forSec) ?? 25);
    }
    this.out.push({ kind: "log", text: `${this.label(c)} bước vô chỗ mát đứng.` });
  }

  /**
   * MỜI NGỒI — và người ta ngồi THẬT. Khác `standInShade` ở hệ quả: ngồi làm kiên nhẫn trôi chậm
   * (`Customer.sitting`), nên cái ghế 320 nghìn có một con số đo được chứ không phải một hình vẽ.
   *
   * Không ngồi được thì IM: `seatFree` là sự thật động nên `chooseTalk` đã trả "?" trước khi tới
   * đây. Tới đây mà hết chỗ nghĩa là người khác vừa ngồi mất trong đúng nhịp vừa rồi.
   */
  private theySit(c: Customer, forSec: ForSec) {
    if (!this.seatFree || c.sitting) return;
    const sec = forSecOf(forSec) ?? 40;
    c.sitting = true;
    c.sitUntil = c.now + sec;
    if (c.inShade) this.leaveShade(c);        // ngồi rồi thì thôi đứng mát — một chỗ một lúc
    if (c.pass) {
      // Nhớ đường cũ để còn trả họ về: ngồi xong họ đi tiếp ĐÚNG việc đang dở.
      c.pass.spot = { x: SEAT_SPOT.x, y: SEAT_SPOT.y };
      c.pass.until = c.now + sec;
    }
    this.out.push({ kind: "log", text: `${this.label(c)} ngồi xuống ghế.` });
  }

  /**
   * CHO QUAY — và cái clip đó phụ thuộc vào mình làm gì trong lúc máy đang chạy.
   *
   * Đây là chỗ `story.flags.clipDay` thôi là một con số kịch bản và thành HỆ QUẢ: clip
   * tới sớm (×1,4 lượng khách ba ngày, `storyCrowdMul`) nếu đoạn quay sạch; dính chuyện
   * xấu thì không những không tới sớm mà còn để lại `clipBad` cho `su.drama.mang` nhắc.
   *
   * Rủi ro ĐỌC ĐƯỢC TRƯỚC KHI BẤM (CANON T5): quầy dơ hay tay bẩn thì người chơi nhìn
   * thấy trên màn hình trước khi gật đầu cho quay.
   */
  private startFilm(c: Customer, forSec: ForSec) {
    if (c.filming) return;
    c.filming = true;
    c.filmUntil = c.now + (forSecOf(forSec) ?? 20);
    c.filmSpoiled = this.filmDirtyNow();
    this.out.push({ kind: "log", text: `${this.label(c)} giơ điện thoại lên quay.` });
  }

  /** Quầy đang có gì lọt vào khung hình không — chấm liên tục, không chỉ lúc bắt đầu. */
  private filmDirtyNow() {
    return this.dirt >= DIRT_ON_CAMERA || this.handsDirty;
  }

  private tickFilm(c: Customer) {
    if (this.filmDirtyNow()) c.filmSpoiled = true;
    if (c.now < c.filmUntil) return;
    this.endFilm(c, true);
  }

  /** Bảo cất máy — đoạn quay huỷ, không ra clip nào, không ghi gì. */
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
    /*
     * Chỉ được DỜI SỚM, không bao giờ dời muộn: ngày 5 đã có một nhánh kịch bản đặt
     * `clipDay` (che tay → 16, làm đẹp → 9, bình thường → 10). Cho quay thêm thì cái clip
     * tới sớm hơn, chứ không được xoá mất nhánh kia.
     */
    const cu = Number(st.flags.clipDay ?? 99);
    const moi = this.deps.day + CLIP_DUNG_SAU;
    if (moi < cu) st.flags.clipDay = moi;
    this.out.push({ kind: "log", text: `${this.label(c)} quay xong một đoạn ưng ý.` });
  }

  private standUp(c: Customer) {
    if (!c.sitting) return;
    c.sitting = false;
    c.sitUntil = 0;
    if (c.pass) { c.pass.spot = c.pass.exit; c.pass.until = c.now; }
    else this.assignSlots();                 // khách ở quầy đứng dậy thì nhận lại chỗ trong hàng
  }

  private leaveShade(c: Customer) {
    if (!c.inShade) return;
    c.inShade = false;
    c.shadeUntil = 0;
    if (c.pass) { c.pass.spot = c.pass.exit; c.pass.until = c.now; }
  }

  /**
   * MỘT LỜI HỨA CÓ HẠN: treo món nợ kèm hạn tính bằng giây THẬT, và **không trả một đồng thưởng
   * nào**. Trả thưởng lúc nói thì cách chơi tối ưu là hứa rồi quên.
   */
  private promiseDeed(c: Customer, deed: Deed) {
    if (c.visit.promised.includes(deed.what)) return;      // hứa lại thứ vừa hứa ≠ hai món nợ
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

  /**
   * GHI NỢ MỘT Ổ — khác `FREE_LOAF` ở chỗ nó là một món NỢ, có sổ, và có ngày đòi.
   * `notebookEntries` đã có sẵn ở `content/arcs.ts`; đây là đường nối vào nó.
   */
  private creditLoaf(c: Customer) {
    const pledge = this.pledges.get(c.id) ?? { promised: [], discount: 0, free: false };
    pledge.free = true;                       // không thu tiền LÚC NÀY
    this.pledges.set(c.id, pledge);
    this.out.push({ kind: "log", text: `ghi nợ một ổ cho ${this.label(c)} — nhớ ghi vô sổ.` });
  }

  /**
   * "Con đứng qua bên cho cô bán nghen." Người ta NGHE hay KHÔNG là chuyện của người ta — đây là
   * một phép thử quan hệ, không phải một cái nút. Không thân, hoặc đang quạu, thì họ đứng ì ra
   * và mình vừa làm mất mặt một người ngay trước hàng.
   */
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
    // Không dạt: đứng y chỗ cũ. Mất mặt trước hàng thì đắt hơn một câu nói thường.
    this.reactTalk(c, "NAME", 2, "ARMS_CROSS");
    if (c.npc) {
      const r = record(m, c.personality, "RUDE_TO_THEM", 45, this.deps.day);
      void r;
    }
    c.waitSec += angerToWaitSec(25 * intensityMul(c.personality), c.waitT, c.waitSec, LEAVE_AT);
    this.out.push({ kind: "log", text: `${this.label(c)} không nhúc nhích.` });
  }

  /**
   * BƯỚC RA KHỎI HÀNG, đứng nép qua một bên. Hai việc, và phải đủ cả hai: THỨ TỰ (tụt xuống sau
   * đúng MỘT người, nhường một lượt chứ không xuống cuối hàng) và CHỖ ĐỨNG (`aside` kéo họ ra
   * khỏi vòng cấp chỗ nên cả hàng sau lưng dồn lên một bậc).
   *
   * Nhường cho AI thì ghi lại (`asideFor`): người đó xong thì mình bước vô lại.
   */
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
    // Nép qua bên quầy thì vẫn thấy tay người bán — không phải quay lưng (`SEATED_FAR`).
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

  /** Đang đứng trong hàng thật — không phải người đi ngang, không phải người quay đầu. */
  private inQueue(c: Customer) {
    return c.phase !== "leaving" && !c.pass && !c.balking;
  }

  /**
   * Nép tới chừng nào? Tới khi người mình nhường XONG VIỆC — họ quay lưng đi về (hoặc
   * biến mất khỏi hàng). Không có ai để nhường thì nép một quãng ngắn rồi bước vô lại:
   * đứng nép mãi ngoài lề trong khi quầy trống là một người bị bỏ quên.
   */
  private asideDone(c: Customer) {
    /*
     * `forSec` của chính lời bảo dạt: số giây thì đếm giây, `"TOI_LUOT"` thì đợi người được
     * nhường xong việc.
     */
    const forSec = this.asideFor.get(c.id);
    const sec = forSec === undefined ? null : forSecOf(forSec);
    if (sec !== null) return c.now - c.asideAt >= sec;
    if (!c.asideFor) return c.now - c.asideAt >= ASIDE_HOLD_SEC;
    return !this.customers.some((x) => x.id === c.asideFor && this.inQueue(x));
  }

  /** Bước trở vô hàng. Chưa gọi món thì vào lại bằng đường của người mới tới. */
  private rejoinQueue(c: Customer) {
    c.aside = false;
    c.asideFor = null;
    /*
     * `arriving` chứ không phải `queueing`: nhánh `queueing` thấy `slot === 0` là gọi món NGAY,
     * kể cả khi người ta còn đứng ngoài lề — tức là gọi món vọng vào từ xa.
     */
    if (c.phase === "queueing") c.phase = "arriving";
    this.assignSlots();
    this.out.push({ kind: "log", text: `${this.label(c)} bước trở vô hàng.` });
  }

  /**
   * Giá ổ sau khi trừ cái người chơi đã HỨA MIỆNG. "Dạ thôi em bớt cô ba ngàn vậy" ra khỏi
   * doanh thu thật, nên câu đó là một quyết định kinh tế chứ không còn là một câu xã giao.
   */
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

  /**
   * Lời hứa được kiểm lúc ĐƯA BÁNH. Trả về điểm cộng/trừ để `deliver()` gộp vào `positive`, và
   * nói ra câu của người ta. Ba kết cục: giữ lời → `CARED_FOR_THEM` · bỏ thứ KHÁC →
   * `BROKEN_PROMISE` nhẹ · không bỏ gì → `BROKEN_PROMISE` nặng, chỗ đắt nhất của cả hệ trò chuyện.
   */
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
      // "Bỏ nhầm": trong ổ có một miếng NHÂN mà đơn không hề gọi — tức là có lòng bỏ thêm,
      // chỉ là bỏ trật thứ đã hứa. Khác hẳn với không bỏ gì hết.
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

  /**
   * Hệ quả của MỘT lựa chọn. Ba kênh, đúng thứ tự THẤY → HIỂU → NGHE: mặt + dáng · sức chờ · trí
   * nhớ.
   *
   * Khách vãng lai KHÔNG có trí nhớ nhưng VẪN giận được — giận là chuyện của lượt ghé này, không
   * cần ai nhớ ai.
   */
  private applyTalkOption(c: Customer, o: TalkEffect & { mood?: TalkMood; act?: TalkAct; tone?: TalkTone }, note?: string) {
    this.talkWarmth += o.rel ?? 0;
    // Một lựa chọn = một khoảnh khắc. `rel` cộng thẳng và `mem` ghi hẳn một ký ức đều
    // nằm gọn trong `applyTalk` ngay dưới, nên đo trước/sau ở đây là ròng của CẢ câu nói.
    const relBefore = this.relNow(c);
    if (note) this.relNote = { text: note, w: 1 };
    if (c.npc) {
      const out = applyTalk(o, this.mem(c.memKey), c.personality, this.deps.day);
      // `memory:written` cố ý KHÔNG bắn ở đây: event đó khai `kind: StimId`, mà lời nói
      // không phải một kích thích ai cũng nhìn thấy — nó chỉ xảy ra giữa hai người ở quầy.
      // Cũng vì vậy nó không đi qua `witness()`: bà Sáu không đem câu này đi kể được.
      if (out.mem) {
        // Người im lặng không cãi lại: mấy bữa sau chỗ của họ trống (P2-02 §4.6).
        const days = SILENT_ABSENCE[out.mem];
        const m = this.mem(c.memKey);
        if (days && isSilentGrudge(c.personality)) m.absentUntil = Math.max(m.absentUntil, this.deps.day + days);
      }
    }
    if (o.flag && this.deps.story) this.deps.story.flags[o.flag] = this.deps.day;

    const anger = (o.anger ?? 0) * intensityMul(c.personality);
    if (anger > 0) {
      c.waitSec += angerToWaitSec(anger, c.waitT, c.waitSec, LEAVE_AT);
      // Nhớ trong CHÍNH cuộc này: câu tử tế nói sau một câu nặng không được đáp
      // như chưa có gì xảy ra (P2-07 §3.3).
      this.talkAngered = true;
    }
    if (o.calm) c.soothe(o.calm / intensityMul(c.personality));
    /*
     * Mặt + dáng. Người viết khai `mood` thì `mood` THẮNG: "Cha, con này!" và "…Ờ. Cảm ơn con."
     * cùng +3 điểm mà hai khuôn mặt khác hẳn nhau, và chỉ người viết biết là khác. Không khai
     * thì suy ra từ hệ quả y như cũ.
     */
    const mood = o.mood;
    if (mood) {
      this.scheduleReact(c, MOOD_FACE[mood], MOOD_POSE[mood]);
    } else if (anger > 0) {
      this.reactTalk(c, "NAME", anger >= 45 ? 3 : 2);
    } else if (o.calm) {
      // Dỗ: điềm đạm thì dễ dịu hơn (nghịch đảo của `intensityMul` dùng cho `anger`) —
      // `soothe` đã chạy ở trên, đây chỉ còn phần nét mặt.
      this.reactTalk(c, "CARED", 1);
    } else if ((o.rel ?? 0) >= 3) {
      this.reactTalk(c, "CARED", 1);
    }
    if ("act" in o && o.act) this.applyAct(c, o.act as TalkAct, o.tone ?? "THUONG");

    /*
     * BỎ VỀ — chửi tới mức này thì họ không mua nữa, và chuyện đó phải THẤY ĐƯỢC: họ quay lưng
     * đi, `lost` nhích lên, ổ đang làm dở thành ổ thừa. Ngưỡng tính SAU `intensityMul` nên tính
     * cách quyết ai nổ trước; đặt cuối hàm để quan hệ và lời hứa ghi xong trước.
     */
    if (anger >= STORM_OFF_ANGER && c.phase !== "leaving") {
      // Người đi ngang không "bỏ về" — họ vốn đang đi. Họ chỉ bước nhanh hơn (H-19).
      if (c.ambient) { c.inviteRefused = true; if (c.pass) c.pass.until = c.now; }
      else {
        this.out.push({ kind: "log", text: `${this.label(c)} bỏ đi — bị nói nặng quá.` });
        this.leave(c, "insulted");
      }
    }
    // Cuối cùng, sau khi quan hệ, lời hứa và cơn giận đã ngã ngũ: một dòng cho người chơi.
    this.settleRelMoved(c, relBefore);
  }

  /**
   * Khách TỰ bắt chuyện — đây là đường vào CHÍNH, không còn là ngoại lệ. Bộ lọc là `source`
   * (81/86 cuộc là `NPC_ONLY`), còn `initiates` chỉ còn là XÁC SUẤT, mặc định
   * `TALK_INITIATE_BASE`.
   *
   * Cuộc SÂU vẫn phải qua `canRun()`: khách không mở một câu chuyện dài khi quầy đang có ba
   * người chờ. Câu ngắn thì cứ nói — hẻm phải sống.
   */
  private offerTalk(c: Customer): boolean {
    if (this.talkSession) return false;
    // Tay đang giữ một thứ hỏng được thì đây không phải lúc. Trả `false` mà KHÔNG tiêu
    // lượt bắt chuyện của họ — `smalltalk()` sẽ thử lại ở frame sau.
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
    // Bong bóng sống LÂU HƠN hẳn bản cũ (2 s): người chơi đang cắm mặt vào thớt, hai
    // giây là chưa kịp ngẩng lên. Chỉ báo bền nằm ở `offers` — scene vẽ dấu trên đầu họ.
    this.say(c, this.fill(c, talk.opener), 2, true, 70, undefined, 0, true);
    this.out.push({ kind: "talkOffer", npcId: c.memKey, name: this.label(c) });
    return true;
  }

  /**
   * Lời bắt chuyện quá hạn thì HUỶ IM LẶNG, không phạt: người chơi hai tay đang bận một ổ nóng
   * thì họ không "làm thinh", họ KHÔNG NGHE THẤY.
   *
   * Làm thinh chỉ có giá khi lời mời đã đứng đó đủ lâu TRONG một lúc tay rảnh — `leave()` lo
   * phần đó.
   */
  private expireOffers() {
    for (let i = this.offers.length - 1; i >= 0; i--) {
      const o = this.offers[i];
      if (this.nowSec - o.at >= OFFER_DEFER_TTL_SEC || !this.talkable(o.c)) this.offers.splice(i, 1);
    }
  }

  /**
   * Scene vẽ dấu "đang chờ mình trả lời" trên vai mấy người này. T3: không một con số.
   *
   * ⚠️ Trả `customer.id` (một LƯỢT GHÉ) chứ không phải `memKey`: tám dáng khách lạ dùng chung
   * tám `memKey`, nên hai người cùng dáng cùng đứng ở quầy sẽ cùng đeo dấu dù chỉ một người
   * mở lời.
   */
  get pendingTalkers(): readonly string[] {
    return this.offers.map((o) => o.c.id);
  }

  /**
   * Dev `rule.test` — hỏi thử rule DB cho người đứng trước quầy với fact Session tuỳ ý,
   * KHÔNG nói, không đánh dấu gì. Trả bảng xếp hạng giống `rule.why`.
   */
  devTest(concept: string, extra: Extra) {
    const c = this.front ?? this.customers[0];
    if (!c) return null;
    const q = this.buildQuery(c, extra);
    this.speaker.ctx.write(q, c.memKey, this.nowSec);
    return { npc: c.memKey, facts: q.dump(), ranking: this.speaker.db.explain(concept, q, this.speaker.st, this.nowSec) };
  }

  /**
   * Tiền — P3-03 §2.5/2.6/2.8. Giá theo thực đơn (không bao giờ trừ tiền bánh). Khách quen
   * có khi quên tiền → mua chịu; tới trả nợ thì nói số họ NHỚ; thối không đủ lẻ thì làm
   * tròn xuống hoặc chạy qua cô Mai đổi (khách đứng chờ).
   */
  private settlePayment(c: Customer, price: number, tip: number, complained: boolean) {
    const day = this.deps.day;
    const debts = this.deps.debts;
    // trả nợ bữa trước
    const open = c.npc && debts ? openDebtOf(debts, c.memKey, day) : undefined;
    if (open) {
      const amt = recalledAmount(open, day, c.personality, this.deps.saveId, this.deps.allowFalseMemory ?? true);
      open.settledOnDay = day;
      open.settledAmount = amt;
      this.out.push({ kind: "repay", amount: amt, npcId: c.memKey, name: this.label(c) });
    }
    // quên tiền — chỉ khách có tên (người quen mới dám mua chịu), và chưa đang nợ
    const r = this.deps.hub.derive(`cash:${c.id}`);
    // SK-10 — cúp điện 7h15 ngày 24: bảng QR vô dụng (điện thoại để trong nhà đang sạc)
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
    // SK-01 · tờ 500 ngàn lúc 6h30 — cô Mai chạy qua đưa tiền lẻ TRƯỚC khi được hỏi (P4-01 NPC-07 M1)
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
          // chạy qua cô Mai đổi: khách đứng chờ — một chút MADE_THEM_WAIT (P3-03 §2.8)
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

  /** Đốt vía xong (hoặc cô Ba đốt giùm): vía xấu về 0 — KHÔNG BAO GIỜ lên +1 (P3-01 §2.6). */
  burnVia() {
    if (this.via < 0) this.via = 0;
  }

  /**
   * Người chơi đang NGHIÊNG NGƯỜI nghe lỏm (P2-04 §2.7 tầng 2) — giá phải trả: người đứng
   * trước quầy thấy mình lơ đễnh, nhìn kỹ hơn 1,3× trong 5 giây.
   */
  playerLeaning() {
    const c = this.front;
    if (c) c.watchedIdleUntil = c.now + 5;
  }

  /**
   * Tên hiện ra với người chơi (nhật ký, phiếu, lý do) — tên là thứ người chơi TỰ GHI vô sổ,
   * chưa ghi thì chưa được gọi tên.
   *
   * Nhưng "chưa gọi tên" không có nghĩa là gọi người ta bằng một gạch ngang: quyền tự ghi tên
   * mở tận ngày 11, nên chưa biết tên thì gọi bằng HÌNH DÁNG (`shapeOf`), đúng như với khách lạ.
   */
  label(c: Customer) {
    if (!c.npc) return displayName(this.deps.notebook, c.memKey, c.name);
    return this.deps.notebook?.pages[c.npc.id]?.name?.trim() || shapeOf(c.npc);
  }

  /**
   * P3-04 C1 — rửa tay ở vòi NGAY TRƯỚC MẶT khách: ai đang nhìn tay mình thì yên tâm hơn
   * (traitMul −0,12 trong 120 s). Chạy qua đúng công thức nhận thấy — không có đường tắt.
   */
  washedVisibly() {
    for (const c of this.audience) if (c.gaze >= 0.45) c.washRelief = c.now + 120;
  }

  /** Kích thích đang sống — overlay dev (F2) đọc để tách thừa số. */
  get liveStims(): readonly ActiveStim[] {
    return this.active.filter((s) => s.until > this.nowSec);
  }

  drain() {
    return this.out.splice(0, this.out.length);
  }

  /**
   * Chỉ rút các dòng NHẬT KÝ — bảng trò chuyện cần in câu ra HUD ngay, mà lúc đó đồng hồ
   * đang đứng nên vòng `settle()` chưa chạy. Sự kiện tiền vẫn nằm nguyên trong hàng đợi
   * để đúng một chỗ xử: nếu rút luôn ở đây thì một lần bấm F ăn mất một lần thu tiền.
   */
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

/** Giá trị fact `defectKind` cho lỗi được nói ra. */
function kindOf(d: DiffedDefect): string {
  if (d.kind === "WRONG_RATIO") return d.dir === "under" ? "RATIO_UNDER" : "RATIO_OVER";
  return d.kind;
}

/**
 * Ổ rút khỏi lò sớm — xem khối `UNDERDONE_FLOOR` ở đầu file để biết vì sao mượn `WRONG_TEMP`
 * và vì sao có sàn 0,35.
 *
 * `mkDefect` lo phần tính điểm; ở đây chỉ thay lại hai chuỗi CHỮ, vì "bánh nguội ngắt" không
 * phải thứ người ta nói về một ổ còn nóng mà mềm oặt. Không đụng gì tới số.
 */
function underdoneDefect(crust: number): Defect {
  const short = clamp01((CRUST.READY - crust) / CRUST.READY);
  const mag = UNDERDONE_FLOOR + (UNDERDONE_CEIL - UNDERDONE_FLOOR) * short;
  return { ...mkDefect("WRONG_TEMP", null, mag), label: UNDERDONE_LABEL, text: UNDERDONE_TEXT };
}

/**
 * Mẩu lý do cho HUD, lấy từ chính lỗi khách để ý nhất — chữ thường, ngắn, KHÔNG số (T3).
 * `d.text` của lỗi theo món vốn đã đúng dạng ("thiếu pate", "có ớt", "ít đồ chua quá");
 * riêng ổ nhồi chặt có câu dài hai vế nên cắt lại cho vừa một dòng HUD.
 */
function defectNote(d: DiffedDefect): string {
  return d.kind === "STUFFED" ? "ổ nhồi chặt quá" : d.text;
}

/**
 * Món được bỏ dư nhiều nhất — CHỈ để viết nhãn cho HUD, không bao giờ đụng tới điểm
 * (`generosityOf` mới là chỗ quyết có hào phóng hay không). Chỉ được gọi trên ổ KHÔNG LỖI.
 */
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

/**
 * Khách đi thẳng tới đích, chạm tường thì trượt — đủ dùng vì sân trước quán trống.
 *
 * `mul` là nhịp chân riêng của một người (người qua đường mỗi người một tốc độ). Mặc
 * định 1: mọi lời gọi cũ giữ nguyên `WALK_SPEED`, không ai bị nhanh chậm đi một chút nào.
 */
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

