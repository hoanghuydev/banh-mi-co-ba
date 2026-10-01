import { Rng, type RngHub, type BagState } from "../core/rng";
import { Barks } from "../content/lines";
import { Query } from "../dialog/facts";
import { Speaker, type DialogState } from "../dialog/speaker";
import type { Rule } from "../dialog/ruledb";
import { NPCS, WALKIN_NAMES, WALKIN_STYLES, type NpcDef, type Personality } from "../content/npcs";
import { DAY_END_MIN, DAY_START_MIN, PEAK_END_MIN, PEAK_START_MIN, bandOf, fmtHhmm } from "../core/clock";
import type { Bus } from "../core/eventbus";
import type { CustomerSlot, LeaveReason as BusLeaveReason, RelTier, StimId } from "../core/types";
import { newNpcState, type NpcState } from "../core/save";
import { orderDefectKey } from "../core/stimid";
import { Customer, DEFAULT_PATIENCE_SEC, LEAVE_AT, TEA, teaSuspectAtCup, type LeaveReason } from "./customer";
import {
  INGREDIENTS, diffDish, generosityOf, labelOf, makeUsual, mkDefect, portionsOf, sameOrder, sayOrder,
  type Defect, type Ingredient, type OrderSpec,
} from "./order";
import {
  MAX_LIVE_STIMULI, SALIENCE, STIM_SPEC, observe, peakOf, peakOfKey, rank, stateOf,
  type ActiveStim, type ObsState, type Occluder, type Zone,
} from "./perception";
import { CUSTOMER_GATE, QUEUE_SLOTS, STREET_BIN, hitsWall } from "../world/map";
import { PASSERS_MAX, PASSER_NAMES, inviteChance, nextGapSec, planPasser } from "./passersby";
import { rollVisit } from "./schedule";
import { SILENT_ABSENCE, extraHabit, record, servedWell, visitProbabilityMul, type BaseKind, type Memory } from "./memory";
import { TalkStore } from "../content/talks";
import {
  ADDRESS, DEFAULT_IGNORE_REL, TalkSession, WALKIN_ADDRESS, angerToWaitSec, applyTalk,
  pickTalk, visibleOptions, MOOD_FACE, MOOD_POSE,
  type Talk, type TalkAct, type TalkCtx, type TalkEffect, type TalkGate, type TalkMood, type TalkTone,
} from "./talk";
import { CLAIM, activeHeard, disprove, nameOf, poolOf, witness, type GossipState } from "./gossip";
import { beginDay, displayName, logNote, logOrder, nameCheck, type Notebook } from "./notebook";
import { CAL, crowdMul, isRain, loafPriceVnd, tasteThreshold, tierOf, weatherOf } from "./econ";
import { peakCap } from "./season";
import { has, walkInMul as equipWalkIn, type EquipState } from "./equipment";
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
 * Điều phối việc bán hàng: ai tới lúc nào, đứng chỗ nào, chờ bao lâu, nhận bánh rồi
 * phản ứng ra sao. Đây là chỗ DUY NHẤT nối lịch khách, tầng nhận thấy (P1-02) và
 * delivery-diff (P1-03). Scene không biết gì về mấy luật này.
 *
 * Chia đúng theo vòng đời frame P0-01 §2.4 — scene gọi lần lượt:
 *   perceive()  → bước 3, tầng nhận thấy
 *   tickNpcs()  → bước 4, lịch đến / chờ / hàng chờ
 *   tickDialog()→ bước 5, lịch nói (delay 0,2–0,4 s, tối đa 1 câu mới/frame, 2 bong bóng)
 *
 * Không import Phaser — chạy headless được (`npm run sim`).
 */

const SLOTS: readonly { x: number; y: number; zone: Zone }[] = QUEUE_SLOTS;
const GATE = CUSTOMER_GATE;
/**
 * Khách đi bao nhiêu ô mỗi giây.
 *
 * 2,2 → 1,7, cùng lý do với `Player.SPEED`: ở 2,2 thì một người băng hết cái hẻm trong
 * mười giây, nhìn ra là trượt chứ không ra đi bộ — và chính mấy người qua đường
 * (`sim/passersby`) làm chuyện đó lộ hẳn, vì họ là những người duy nhất đi một mạch suốt
 * chiều ngang khung hình. Khách tới quầy chậm hơn một chút KHÔNG làm họ mất kiên nhẫn:
 * đồng hồ chờ chỉ chạy từ lúc đã đứng vào hàng (xem `Customer.tick`).
 */
const WALK_SPEED = 1.7;

/**
 * Khách TỰ bắt chuyện — P5-01 §3. Đa số khách KHÔNG bắt chuyện: họ tới mua bánh mì.
 *
 * Ba cái van, cả ba đều cần: `initiates` của từng cuộc (ít cuộc có, và đều ≤ 0,35),
 * trần cả buổi, và khoảng cách giữa hai lần. Thiếu trần thì một buổi đông khách thành
 * ra sáu lần bị bắt chuyện — người chơi không làm được việc, và đó là lúc hệ thống trò
 * chuyện quay ra phá chính trò chơi.
 */
const TALK_OFFERS_PER_DAY = 3;
const TALK_OFFER_GAP_SEC = 100;

/**
 * Bấm F với được xa bao nhiêu ô — "lại gần là nói chuyện được", không cần ai đứng vô quầy.
 *
 * 3 ô. Mặt quầy ngăn giữa người chơi (trong quán) và người đứng ngoài: từ chỗ đưa hàng
 * tới chỗ đứng số 0 đã là ~2,1 ô, nên dưới 2,5 thì chính cái việc THƯỜNG NGÀY — nói
 * chuyện với người đang đứng trước mặt mình — lại là việc khó nhất. Trên 4 ô thì đứng ở
 * bồn rửa tay cũng với tới người cuối hàng, và "lại gần" hết nghĩa.
 *
 * Trong tầm thì người GẦN NHẤT thắng, kể cả người đi ngang ngoài đường. Không ai trong
 * tầm thì rơi về người đứng đầu quầy — đứng ở lò mà bấm F vẫn nói được với người đang
 * chờ mình, y như trước.
 */
export const TALK_REACH = 3;

/**
 * Bắt chuyện với một người đang đi ngang thì họ ĐỨNG LẠI ngần này giây sau khi mình nói
 * xong — không phải quay đi giữa câu. Đủ để đọc nốt câu đáp cuối, không đủ để họ thành
 * một người đứng đó mãi: họ còn phải đi.
 */
const PASSER_TALK_STAY = 4;

/**
 * Giữ lời / nuốt lời — P5-02. Giữ lời thưởng VỪA PHẢI (nó chỉ là làm đúng điều mình nói);
 * nuốt lời phạt NẶNG, và nặng hơn cả một lỗi đơn hàng, vì lỗi đơn là tay làm sai còn
 * nuốt lời là mình đã nói ra miệng rồi đổi ý.
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
 * Hệ số sức chờ theo CHỖ XẾP HÀNG — bổ sung của bản dựng, không có trong P1-02 §2.7.
 *
 * Người tới lúc quầy trống mong được phục vụ ngay; người xếp sau ba người thì ngay lúc
 * đứng vào đã BIẾT mình phải chờ, nên cùng một cái chờ ấy họ chịu được lâu hơn. Không
 * có hệ số này thì một người ít kiên nhẫn xếp cuối hàng gần như chắc chắn bỏ đi, mà cái
 * đó không phải lỗi người chơi — là lỗi của mô hình.
 *
 * NHÂN chứ không CỘNG, để khớp với `rush` và `bond` ngay cạnh: cộng thẳng giây thì +10 s
 * là +36% với chú Kiệt (28 s) nhưng chỉ +11% với bà Sáu (90 s), tức vô tình xoá mất đúng
 * cái nét tính cách mà `npcs.ts` dựng ra. Nhân thì người vội vẫn vội.
 *
 * 0,15 mỗi bậc: người thứ hai +15%, thứ ba +30%, thứ tư +45%. Đủ để cứu người xếp cuối
 * khỏi cái án bỏ đi tự động, chưa đủ để hàng dài thành ra DỄ hơn hàng ngắn.
 *
 * Chặn ở bậc thứ tư: `peakCap` cho tối đa 4 khách vãng lai, nhưng người có tên tới theo
 * lịch của họ nên hàng vẫn có thể dài hơn. Không chặn thì người cuối một hàng tám người
 * thành ra gần như chờ được mãi.
 */
const QUEUE_PATIENCE_STEP = 0.15;
const QUEUE_PATIENCE_CAP = 4;

export function queuePatienceMul(ahead: number) {
  return 1 + QUEUE_PATIENCE_STEP * Math.min(ahead, QUEUE_PATIENCE_CAP);
}

/**
 * "Hôm nay đông quá, thôi để bữa khác" — người tới đầu hẻm, ngó cái hàng, rồi QUAY ĐẦU.
 *
 * ⚠ Đây là luật NGƯỢC CHIỀU với `queuePatienceMul` ngay ở trên, và hai cái phải nằm cạnh
 * nhau đúng chỗ này để không ai sửa một mà quên cái kia. Khác nhau ở MỐC THỜI GIAN, không
 * phải ở hướng:
 *   · quyết định này xảy ra LÚC TỚI, khi người ta còn đứng ngoài hàng và chưa mất gì cả;
 *   · `queuePatienceMul` xảy ra SAU KHI đã xếp vào — lúc đó cái hàng dài lại là lý do để
 *     ở lại ("đứng nãy giờ rồi, bỏ đi thì phí"), nên nó CỘNG sức chờ.
 * Người đã vào hàng không bao giờ quay ra vì lý do "đông" — `Customer.balking` chỉ bật ở
 * `phase === "arriving"`. Trộn hai cái vào nhau là phá hợp đồng ở tests/p1-queue-patience.
 *
 * ── Ngưỡng: "dài quá" bắt đầu từ đâu ─────────────────────────────────────────
 * Suy ra từ `SLOTS.length`, KHÔNG chép số người. Bản đồ vừa nới từ 4 chỗ lên 6; viết
 * thẳng "từ người thứ tư" thì hôm nay nó nghĩa là hàng gần đầy, mai nó nghĩa là hàng mới
 * vơi quá nửa — cùng một dòng code, hai luật chơi khác nhau.
 *
 * Mốc là `ceil(0,60 × số chỗ)`: 6 chỗ → từ người thứ TƯ · 4 chỗ → từ người thứ BA. Dưới
 * mốc đó thì KHÔNG AI ngại, và chuyện này không cần làm cho mờ đi: hai ba người đứng trước
 * một xe bánh mì là hàng NGẮN, nói dối điều đó mới là chỗ người chơi học ra con số ma.
 *
 * Đo trên 38 ngày bot (lúc có người tới thì đang có mấy người đứng đó):
 *            ≤2 người     3        4       5      6+
 *   nhanh     99,6%      1,4%    0,4%      –       –      → gần như không ai quay đầu
 *   vừa       88,6%      7,6%    3,0%    0,8%      –      → vài lần mỗi tuần
 *   chậm      62,4%     19,9%   12,4%    4,4%    1,0%     → chuyện thường ngày
 * Nên đường cong phải DỐC ngay từ bậc đầu: nếu bậc 4 người chỉ ~9% thì cả mùa của người
 * chơi tầm tầm được đâu đó bốn lần quay đầu, tức là một luật không ai thấy bao giờ.
 *
 * Ba bậc, nội suy tuyến tính giữa hai mốc đầu (6 chỗ):
 *   4 người (bắt đầu dài)      → `BALK_AT_FROM` 0,20 — một phần năm, đủ để nhận ra
 *   5 người (còn đúng một chỗ) → `BALK_MAX` 0,55 — hơn nửa số người quay về
 *   6 người (KÍN CHỖ)          → `BALK_WHEN_FULL` 0,92, xem bên dưới
 *
 * ── Hàng KÍN CHỖ là chuyện khác hẳn ──────────────────────────────────────────
 * `ahead >= slots` thì KHÔNG CÒN MỘT CHỖ NÀO để đứng, và `assignSlots()` dồn mọi người
 * thừa vào đúng cái ô cuối: ba người chồng khít lên nhau, tên đè lên tên — đã dựng lại
 * được với 9 khách / 6 chỗ. Đó không phải chuyện tính cách, nên nó KHÔNG đi qua mấy hệ số
 * người bên dưới: trả thẳng `BALK_WHEN_FULL`. Để 0,92 chứ không phải 1 vì vẫn còn người
 * liều đứng tràn ra lề — và vì phải thấy được rằng đây là XÁC SUẤT, không phải cổng chặn.
 * (Lượt ghé có kịch bản vẫn đi lọt: xem chỗ gọi `balkChance` trong `spawn()`.)
 *
 * ── Ba hệ số người ───────────────────────────────────────────────────────────
 * Cả ba đều là số CÓ SẴN, không phải số mới phải tune:
 *  · `intensityMul` (nongTinh) — npcs.ts ghi thẳng nongTinh là "tốc độ mất kiên nhẫn".
 *    Ông Hải ×1,40 · thầy Phúc ×0,70. Người điềm đạm vẫn vào, người nóng thì thôi.
 *  · nghịch đảo `visitProbabilityMul` — quan hệ đã quyết chuyện CÓ TỚI HÔM NAY KHÔNG, giờ
 *    quyết thêm chuyện CÓ CHỊU XẾP HÀNG KHÔNG. Khách ruột quý mình thì chịu đứng (×0,87),
 *    người lạ thì không (×1,0). CHẶN ở [0,7 · 1,6]: 1/0,45 của Rival là ×2,22, mà nhân
 *    nguyên con số đó là phạt cùng một mối giận hai lần trong cùng một buổi sáng.
 *  · nghịch đảo `moodPatienceMul` — bữa nay người ta bực sẵn thì cái hàng dài thêm một
 *    người cũng đủ. Nhờ nó mà CÙNG một người, CÙNG độ dài hàng, hai ngày hai câu trả lời.
 * Và khung giờ vội (`npc.rush`, chú Tư 6h30–7h) ×1,35: người trễ ca là người quay đầu.
 *
 * Trần 0,80 chứ không phải 1: dù có cộng dồn cỡ nào cũng luôn còn cái cửa người ta tấp vào.
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
 * Chỗ người quay đầu dừng lại ngó — LÙI THÊM MỘT BẬC sau chỗ cuối hàng, suy ra từ khoảng
 * cách giữa hai chỗ cuối chứ không chép toạ độ. Phải là một điểm THẬT trên vỉa hè, vì cả
 * cái luật này chỉ đáng giá nếu người chơi THẤY được: xoá khách ngay ở cổng thì họ chỉ
 * "không bao giờ tới", mà cái đó không đọc ra được gì ngoài một buổi sáng vắng khách.
 * Lùi một bậc chứ không đứng đúng chỗ cuối: chỗ đó có thể đang có người thật đứng.
 */
const BALK_LOOK = (() => {
  const n = SLOTS.length;
  const p = n >= 2 ? { x: 2 * SLOTS[n - 1].x - SLOTS[n - 2].x, y: SLOTS[n - 1].y } : { ...SLOTS[0] };
  return hitsWall(p.x, p.y) ? { x: SLOTS[n - 1].x, y: SLOTS[n - 1].y } : p;
})();
/** Đứng ngó một nhịp rồi mới quay lưng — không có nhịp này thì động tác đọc ra là "trượt chân". */
const BALK_LOOK_SEC = 0.8;

const BARK_DELAY_MIN = 0.2;
const BARK_DELAY_SPAN = 0.2;
/** Chuỗi `followup` quá 6 giây không nói được thì bỏ (P2-01 §2.7 — thế giới đã đổi). */
const FOLLOWUP_EXPIRE_SEC = 6;
/** Khách chờ bánh được ngần này giây mà quầy yên thì có thể buông một câu chuyện phiếm. */
const SMALLTALK_AFTER_SEC = 4;
/** Hỏi chuyện: 60 s mỗi người mới hỏi lại được (P1-02 §2.8). */
/**
 * Giữa hai lần khách QUAY SANG NHÌN MẶT người bán (P1-02 §2.8). Không phải cooldown của
 * nút F — F mở được hay không là do còn chuyện để nói hay không. Cái này chỉ chặn việc
 * bấm F liên tục để ép gaze rời khỏi tay mình.
 */
export const ASK_COOLDOWN = 60;

/** P1-04 §2.9: bong bóng sống `clamp(1600 + 45·số ký tự, 1600, 4500)` ms. */
export const bubbleLife = (text: string) => Math.min(4.5, Math.max(1.6, 1.6 + 0.045 * text.length));

/** Nhân mặn (`kind: "nhan"`) — thứ làm nên ổ bánh. Rau / ớt / tương chỉ là đồ kèm. */
const NHAN_IDS: ReadonlySet<Ingredient> = new Set(INGREDIENTS.filter((i) => i.kind === "nhan").map((i) => i.id));

/**
 * Ổ RỖNG — P3-03 §2.5 (thực đơn) đọc chung với P1-03 §2.12.
 *
 * §2.12 cấm TRỪ TIỀN BÁNH vì lỗi kẹp: quên đồ chua, ít rau, lệch tỉ lệ, thiếu một
 * trong hai nhân — ổ vẫn là món khách gọi, giá vẫn nguyên, hình phạt nằm ở tiền boa
 * và ở trí nhớ. Nhưng một ổ KHÔNG CÓ MIẾNG NHÂN MẶN NÀO thì không còn là món đó: nó
 * đúng nghĩa là "bánh mì không" — một DÒNG KHÁC của thực đơn (10.000₫, P4-03 SK-31).
 * Vẫn tính đủ tiền ổ đầy đủ cho nó là bán thứ chưa hề đưa ra, và là lỗ hổng CANON §8:
 * chỉ mua bánh thì tiền chợ rụng ~70% mà doanh thu không đổi.
 *
 * Vì sao ngưỡng là "không một miếng nhân mặn nào":
 *  · thiếu MỘT trong hai nhân vẫn là ổ bánh mì thịt → giá cũ, §2.12 nguyên vẹn
 *  · để ngưỡng ở "ổ trống trơn" thì lách được bằng một cọng rau (333₫/ổ, vẫn rẻ hơn
 *    nhân mặn 12×) — đóng lỗ hổng bằng ngưỡng đó là không đóng gì cả
 *  · ngưỡng này khớp ĐÚNG định nghĩa bậc `khong` của `tierOf`: n = 0 nhân
 *
 * Đơn vốn KHÔNG gọi nhân mặn ("cho một ổ bánh mì không") đã là bậc `khong` sẵn — hàm
 * này không đụng tới, cũng không phạt ai gọi ổ chay.
 */
/**
 * Gọi người chưa biết tên bằng HÌNH DÁNG — P2-05 (xem `Service.label`).
 *
 * Suy thẳng từ `body`, theo đúng thứ tự dấu hiệu BÓNG HÌNH mà `content/npcs.ts` nói là
 * thứ đọc được ở 64 px — nón → kính → TÓC (thứ nằm ngay cạnh mặt) → tạp dề → giỏ → dáng,
 * nên cái người chơi ĐỌC khớp cái họ THẤY. Thứ tự này cũng là thứ duy nhất tách được
 * chị Lan (tóc ngang vai) với chị Hạnh (tóc đuôi ngựa) — hai người cùng xách giỏ.
 * Xưng hô lấy ở chữ đầu của tên; "Thầy" thành "ông" vì nghề nghiệp là thứ phải quen mới
 * biết, không phải thứ nhìn là ra.
 *
 * ⚠️ TẠM: chỗ đúng của mấy chuỗi này là một trường do người viết nội dung đặt trong
 * `content/npcs.ts` (hiện 12 NPC chưa có trường mô tả hình dáng nào). Ở đây suy máy móc
 * để không còn một dòng "—" nào lọt ra màn hình; thay bằng bản viết tay thì tốt hơn.
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
 * Thứ tự `INGREDIENTS` là thứ tự xếp lớp trong ổ, nên cái đầu tiên cũng là cái lẽ ra
 * phải quết vô trước hết ("ổ này chưa thấy pate đâu hết con"). Gọi hai ba nhân thì chỉ
 * kể một — câu nói của một người, không phải cái phiếu kiểm.
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
  | { kind: "talkOffer"; npcId: string; name: string };

/** Một nhịp của cuộc trò chuyện, đủ cho UI vẽ. T3: không một con số nào ở đây. */
export type TalkView = {
  npcKey: string;
  name: string;
  /** Câu khách vừa nói — `opener`, hoặc `reply` của đúng lựa chọn vừa bấm. */
  line: string;
  /** Khách cố ý KHÔNG đáp. Bảng vẽ "…" chứ không vẽ một ô trống (P2-02 §2.3). */
  silent: boolean;
  /**
   * Cảm xúc khách nói câu đó — bảng vẽ một huy hiệu mặt bên cạnh. Vắng = không vẽ gì
   * (và mặt trên người họ vẫn đổi như cũ, suy ra từ hệ quả).
   */
  mood?: TalkMood;
  /** Màu da / màu tóc của chính người này — huy hiệu mặt phải ra đúng người. */
  skin: number;
  hair: number;
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
 * Chỗ người đi ngang dừng lại — cạnh hàng chờ, không chen vào hàng (P4-01: chú Kiệt liếc vô lò).
 *
 * Dời khỏi (13,2 · 7,2) của bản đồ 20×12 cũ: trên bản đồ 26×17 chỗ đó chỉ cách chỗ đứng
 * số 0 có 33 px VÀ có depth lớn hơn (x+y), nên người đi ngang vẽ ĐÈ lên đúng người đang
 * được phục vụ — che mất cảnh duy nhất người chơi bắt buộc phải đọc được.
 *
 * ⚠️ Đây là toạ độ thế giới DUY NHẤT không nằm trong `world/map.ts`, nên `assertWalkable()`
 * không soi tới: lần sau bản đồ đổi thì phải tự tay kiểm lại chỗ này, không có gì báo.
 */
const PASS_SPOT = { x: 16.5, y: 8.4 };
type Pending = {
  c: Customer; text: string; tier: 1 | 2 | 3; delay: number; log: boolean
  /** Độ ưu tiên (salience) — câu gọi món và câu phản ứng nặng được nói trước. */
  pri: number; waited: number;
  /** Rule sinh ra câu này — ghi nhận đã-nói + applycontext + followup LÚC NÓI, không lúc chọn. */
  rule?: Rule;
};
type Followup = { c: Customer; concept: string; at: number };

/**
 * Lượt ghé vừa rồi ĐI RA SAO, theo cách người khách sẽ nhớ nó lúc quay lưng. Bốn chuyện
 * khác nhau nên bốn câu chào khác nhau: ổ đúng và nhanh · ổ có chuyện · chờ mỏi mà vẫn
 * đứng lại tới cùng (và vẫn nhận bánh) · và `GRIT`.
 *
 * `GRIT` = ổ đã nằm dưới đất mà người này KHÔNG thấy lúc nó rớt (xem `SOILED_GRIT`). Nó
 * thắng cả `DEFECT` khi hai cái cùng xảy ra: thiếu miếng đồ chua thì người ta cằn nhằn
 * lúc mở gói, còn cắn phải sạn thì đó là thứ duy nhất họ còn nhớ về buổi sáng hôm đó.
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
 * Ổ ĐÃ NẰM DƯỚI ĐẤT (`serveDish` opts.soiled) — hai cái giá, và KHOẢNG CÁCH giữa chúng
 * mới là luật chơi.
 *
 * Cái cờ `soiled` đi theo TỪNG Ổ, không theo người chơi (`StallScene.handSoiled`): làm
 * rớt một ổ rồi nướng ổ khác đưa khách thì không có gì xảy ra hết, và phải như vậy —
 * nếu không thì một lần tuột tay là cả buổi sáng bị phạt.
 *
 * Chia hai nhánh bằng ĐÚNG câu hỏi mà cả game này được dựng quanh nó: người đó CÓ THẤY
 * KHÔNG. Không phải một roll mới — `DROPPED_FOOD` (salience 75) đã bay qua tầng nhận
 * thấy lúc ổ chạm đất, mỗi người tự tích `certainty` theo ánh nhìn của mình. Anh Bảo cắm
 * mặt vô điện thoại thì THẬT SỰ không thấy, và đó không phải lỗ hổng, đó là nội dung.
 *
 * ── `SOILED_CAUGHT` 95 — bị bắt tận mắt ──────────────────────────────────────
 * Nặng hơn `PROMISE_BROKEN` (85) và hơn mọi lỗi đơn hàng, vì nó không cùng HỌ với chúng:
 * lỗi đơn là tay làm sai, còn cái này là người bán đã NHÌN THẤY ổ bánh rơi, nhặt lên,
 * phủi phủi, rồi đưa cho người đang đứng nhìn mình làm đúng chuyện đó. Nó là hành động
 * cố ý duy nhất trong cả bảng. Vẫn dưới 100 để trần còn nghĩa lý: WRONG_NAME và
 * MADE_THEM_WAIT giữ mốc đó.
 *
 * Và nó KHÔNG đứng một mình: lúc nhìn thấy ổ rơi người ta đã ghi một mục DROPPED_FOOD 75
 * rồi (xem `perception:stateChanged` → CONFIRMED). Mục thứ hai này cùng KIND nên `record`
 * cộng dồn `occurrences` — tức qua đêm nó đủ điều kiện lên trí nhớ DÀI HẠN (`PROMOTE`
 * cần occurrences ≥ 2). Làm một lần là người ta nhớ sang mùa sau.
 *
 * ── `SOILED_GRIT` 30 — ăn trúng sạn mà không biết vì sao ─────────────────────
 * Phải NHỎ HƠN HẲN, nếu không thì nước đi tối ưu thành "cứ đưa đại, cầu cho nó đừng
 * thấy". 30 là cỡ một miếng đồ chua cho thêm (`FREE_EXTRA_BASE` 25) tính ngược — một
 * cái nhíu mày, không phải một vết thương: người ta có thấy gì đâu mà giận.
 *
 * Cái răn thật của nhánh này không nằm ở con số, nó nằm ở ba chỗ khác:
 *  1. CÙNG KIND `DROPPED_FOOD`. Làm với cùng một người lần thứ hai là `occurrences` lên
 *     2, và 30 nhỏ cũng leo lên trí nhớ dài hạn y như 95. Nó CỘNG DỒN trên đầu người đó.
 *  2. Mất cái ĐƯỢC. Lượt bán đó không còn là "một ổ sạch": `servedWell()` không chạy, và
 *     `disprove()` không chạy — tức cái tin đồn "bên đó bánh rớt" không được xoá bớt đúng
 *     lúc lẽ ra nó phải được xoá. Bán gian thì không gột được tiếng.
 *  3. `witness()` vẫn ghi: người ta không biết VÌ SAO, nhưng tối nay vẫn kể "bánh bên đó
 *     ăn thấy sạn sạn". Tin đồn không cần nhân chứng, nó chỉ cần một cái miệng.
 */
const SOILED_CAUGHT = 95;
const SOILED_GRIT = 30;
/** Toast cho `res.ok === false` — ngắn, vì nó hiện ngay trên đầu người vừa lắc đầu. */
const SOILED_REFUSE_TOAST = "khách thấy ổ đó rớt rồi";

/**
 * Ổ CHƯA CÓ NHÂN — đưa một ổ bánh trống cho người vừa gọi pate (xem `isHollowLoaf`).
 *
 * Chuyện này KHÔNG cùng họ với mấy lỗi đơn hàng khác, dù `diffDish` xếp nó thành một
 * chồng `MISSING`. Thiếu một miếng đồ chua là tay làm sai; đưa ra ổ bánh không có gì
 * trong đó là CHƯA LÀM. Người ta không cần soi, không cần cắn thử, không cần nhớ mình
 * đã gọi gì: cầm lên là biết. Nên nó không được đi qua hai cái cửa vốn dành cho lỗi:
 *
 *  1. KHÔNG qua túi im lặng (`barks.speaks`, 7/20). Túi im lặng là để khách đôi khi
 *     tha cho một ổ ít rau — nó không được phép tha cho một ổ trống, vì khi nó tha thì
 *     người chơi MỚI không nhận được một tín hiệu nào: không câu nói, không mặt, chỉ
 *     có tiền vô ống. Lỗ hổng đó là lỗ hổng dạy sai, nặng hơn lỗ hổng tiền.
 *  2. KHÔNG nói bằng câu DELIVERY ("Ủa… pate đâu con?"). Câu đó là câu của người vừa
 *     nhìn vô ổ bánh và thấy thiếu MỘT thứ. Ở đây có concept riêng `HOLLOW_LOAF`.
 *
 * ── Ai LẮC ĐẦU, ai nhận ────────────────────────────────────────────────────
 * Không phải chuyện `soi` — ổ trống thì ai cũng thấy. Chuyện ở đây là có BẮT LÀM LẠI
 * hay không, và đó là hai nét khác: dễ nổi (`nongTinh`) thì nói ngay, còn `deTha` cao
 * thì thôi cầm cho xong. Nên chỉ người VỪA điềm đạm VỪA dễ tha mới nhận:
 *   nhận  — chú Tư · thầy Phúc · bé Su · anh Bảo · bà Sáu   (5/12)
 *   trả lại — bà Bảy · chị Lan · ông Hải · cô Mai · chị Hạnh · anh Dũng · chú Kiệt
 * Người nhận KHÔNG phải người không bị gì: họ trả tiền một ổ bánh mì không, không boa,
 * và `diffDish` vẫn ghi đủ `MISSING` vô sổ nhớ của họ. Họ chỉ không làm mình làm mẩy.
 *
 * ── Trả lại thì mất gì ─────────────────────────────────────────────────────
 * Ổ bánh Ở LẠI TRONG TAY người chơi (`res.ok === false`), nên đường ra là đem nó về
 * thớt kẹp nhân cho đủ rồi đưa lại — ĐÚNG việc lẽ ra phải làm. Khách vẫn đứng đó
 * (`phase` không đổi), nghĩa là đồng hồ chờ vẫn chạy: trả lại hai ba lần là
 * `MADE_THEM_WAIT`, rồi tới `LEAVE_AT` là mất khách. Cái giá nằm ở thời gian, chỗ
 * người chơi thiếu nhất, chứ không nằm ở một khoản phạt mới.
 *
 * `HOLLOW_REFUSED` 55: nặng hơn một lỗi đơn tại quầy (`ORDER_DEFECT` 20 × trọng số
 * món ≈ 28) vì nó là chuyện không thể nhìn lầm, nhưng NHẸ hơn hẳn `SOILED_CAUGHT` 95 —
 * ổ nhặt dưới đất là cố ý và che giấu, ổ trống thì không che gì cả và sửa được ngay
 * tại chỗ. Ghi ĐÚNG MỘT LẦN mỗi lượt ghé (`hollowShown`): người chơi thử đưa lần nữa
 * là mất thêm thời gian, không phải chồng thêm một vết nhớ.
 */
const HOLLOW_REFUSED = 55;
/** Toast cho `res.ok === false` — ngắn, vì nó hiện ngay trên đầu người vừa lắc đầu. */
const HOLLOW_REFUSE_TOAST = "khách không nhận — ổ chưa có nhân";

/** Xem khối `HOLLOW_REFUSED`. Chỉ người vừa điềm đạm vừa dễ tha mới cầm ổ trống cho xong. */
export const takesHollowLoaf = (p: Personality) => p.nongTinh <= 0.4 && p.deTha >= 0.7;

/**
 * Ổ NƯỚNG CHƯA TỚI — P1-01 §2.4 đọc chung với P1-03 §2.6.
 *
 * Trước đây chuyện này chỉ là một con số trừ 10 giấu trong nhánh "không lỗi", và chỉ
 * người sành ăn (soi ≥ 0,7) mới được nói một câu về nó. Kết quả là bán một ổ còn mềm
 * oặt cho mười một người trong hẻm thì KHÔNG AI phản ứng, không ai nhớ, và nó vẫn được
 * tính là một lượt bán sạch — tức là cái lò, thứ người chơi phải canh suốt buổi, gần
 * như không có hậu quả nào. Giờ nó là một LỖI thật, đi đúng đường của `opts.cold`.
 *
 * Mượn `DefectKind: "WRONG_TEMP"` chứ không thêm kind mới, vì `DefectKind` ở
 * `sim/order.ts` và thêm một giá trị ở đó kéo theo `BASE`, `mkDefect`, bảng
 * `defectKind` của blackboard và mọi rule đang đọc nó. "WRONG_TEMP" vốn đã là "ổ bánh
 * sai trạng thái nhiệt", do người gọi bơm vào chứ `diffDish` không tự sinh — nguội và
 * non là hai đầu của đúng một chuyện: cái lò. Hai đầu đó được tách ra ở tầng THOẠI bằng
 * fact `dishUnderdone` (rule non có thêm một criterion nên luôn thắng rule nguội), và
 * `label` / `text` của lỗi được viết lại cho đúng miệng người nói.
 *
 * SÀN 0,35 cho `magnitude`: ổ 0,44 (hụt đúng một nhịp so với CRUST.READY 0,45) vẫn phải
 * ra được một câu càm ràm nhẹ, không thì nó lại chìm y như cũ.
 *
 * TRẦN 0,90 chứ không phải 1,0, và đó là chỗ duy nhất phải tính cho kỹ. Ký ức ghi vào
 * là `sEat × magnitude` = 90 × mag², nên mag = 1,0 cho ra đúng 90 — bằng ổ nguội và
 * HƠN cả BURNT_OR_COLD (80). Bánh non không bao giờ được phép nặng bằng bánh cháy:
 * cháy là ổ bỏ đi, non chỉ là ổ chưa tới, ăn vẫn ăn được. 0,90 kéo trần xuống 73.
 *   crust 0,44 → mag 0,36 → ký ức ≈ 12   (càm ràm một câu rồi thôi)
 *   crust 0,05 → mag 0,84 → ký ức ≈ 63   (chuyện thật sự)
 *   crust 0    → mag 0,90 → ký ức ≈ 73   (bột sống — vẫn dưới bánh cháy 80)
 */
const UNDERDONE_FLOOR = 0.35;
const UNDERDONE_CEIL = 0.9;
const UNDERDONE_LABEL = "bánh chưa giòn";
const UNDERDONE_TEXT = "bánh nướng chưa tới";

/**
 * Mốc đổi MẶT khi có lỗi — P2-02 §3.1. Trước đây mọi lỗi đều ra mặt I3, kể cả lệch một
 * nhúm ngò; giờ ổ nướng non một chút không được mang cùng cái mặt với ổ quên miếng chả.
 * 40 = chỗ một ORDER_DEFECT bắt đầu ăn 8 điểm quan hệ (×REL_K_NEG 0,2) — cỡ tám lượt
 * bán tử tế mới gỡ lại, tức là đủ nặng để đáng một cái mặt sượng hẳn.
 */
const DEFECT_FACE_I3 = 40;

/**
 * `relationship:moved` — T3 nguyên vẹn: một CHIỀU, một mức ĐẬM/NHẠT và một mẩu chữ.
 * Không con số nào ra khỏi đây, và không con số nào suy ngược ra được từ hai bậc.
 *
 * Sàn 2: một lượt bán sạch trơn chỉ đáng `SERVED_WELL_PTS` = 1,0 điểm. Nếu lượt nào
 * cũng in một dòng thì dòng đó hết nghĩa trong ba phút — im lặng cũng là tin. 2 cũng
 * đúng bằng `EPSILON` của `sim/memory.ts`, mốc "dưới mức này là nhiễu" của cả hệ.
 *
 * Mốc ĐẬM 8: cỡ một REMEMBERED_USUAL hạng T-A (70 × REL_K_POS 0,12 ≈ 8,4), và khoảng
 * một phần tám quãng đường ACQUAINTANCE → FRIEND (60 điểm). Tức là "RO" nghĩa đúng
 * nghĩa đen: chuyện vừa rồi dịch người ta đi một đoạn thấy được.
 */
const REL_MOVE_MIN = 2;
const REL_MOVE_STRONG = 8;

/**
 * Câu chào từ biệt của người được phục vụ xong đi sau câu nhận bánh — mà mỗi người chỉ
 * có MỘT bong bóng (`Customer.speak` ghi đè). 1,8 s là quá mốc sống ngắn nhất của một
 * bong bóng (`bubbleLife` sàn 1,6 s) nên câu trước kịp đọc hết, và vẫn còn kịp nói
 * trước khi người ta ra tới cổng (quãng slot 0 → cổng ≈ 3,5 s ở tốc độ đi 2,2).
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
   * Lượt ghé đã được tính vào chuỗi "cho thêm" rồi (theo `customer.id`). Cần, vì một
   * người mua HAI ổ thì `serveDish` chạy hai lần cho cùng một lượt ghé — không có cái
   * này thì ổ thứ hai hoặc dựng thêm một nếp không có thật, hoặc bẻ gãy nếp vừa dựng.
   * Chỉ sống trong buổi bán: reload giữa một lượt ghé hai ổ là chuyện không đáng lưu.
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
   * `record()` trong một lần giao bánh gộp lại thành MỘT dòng, và dòng đó nói về thứ
   * nặng ký nhất đã xảy ra. T3: chữ thường, không một con số.
   */
  private relNote: { text: string; w: number } | null = null;
  /** Ly trà đã mời cho từng người HÔM NAY — trần và mức nhỏ dần đếm theo ngày (§8i). */
  private teaToday = new Map<string, number>();
  private devSeq = 0;
  /** P5-01 — cuộc trò chuyện đang mở (bảng lựa chọn đang hiện, đồng hồ đang đứng). */
  private talkSession: TalkSession | null = null;
  private talkWith: Customer | null = null;
  /** Khách đã tự bắt chuyện và đang chờ được trả lời. */
  private offer: { c: Customer; talk: Talk } | null = null;
  /** Nội dung trò chuyện, nạp theo từng người lúc họ đi vô (P5-01 luật 4). */
  readonly talks = new TalkStore();
  private offersToday = 0;
  private lastOfferAt = -Infinity;
  /** Người chơi đã CHỌN ít nhất một câu trong cuộc đang mở chưa. */
  private talkEngaged = false;
  /** Cuộc đang mở là do khách bắt chuyện trước (chứ không phải người chơi bấm F). */
  private talkNpcOpened = false;
  /**
   * Điểm quan hệ đã kiếm được TRONG cuộc đang mở — "mời khéo" của act `INVITE` đọc nó.
   *
   * Cộng từ `rel` người viết khai, chứ không đo `relNow()` trước/sau: người đi ngang và
   * khách vãng lai đều không có `npc`, nên `relNow()` của họ luôn là 0 và phép đo kia
   * không bao giờ nhúc nhích. Mà đó lại đúng là những người được mời.
   */
  private talkWarmth = 0;
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
   * Hết sạch bánh mì (kho + lò + thớt + tay) — scene đặt mỗi frame. Khách tới là về không
   * (P3-03 §2.3 OUT_OF_STOCK): người quen nhớ, và người quen lâu nhớ nặng hơn.
   */
  soldOut = false;
  soldOutCount = 0;
  /** Lò đã nóng chưa (scene đặt) — chú Kiệt liếc vô lò lúc 6h10: nóng thì gật đầu (P4-01 NPC-12). */
  ovenHot = true;
  /** Chuyện có giờ trong ngày (cúp điện 7h15 ngày 24…). */
  private storyTimeline: { at: number; text: string }[] = [];
  private walkinIdx = 0;
  // ── người qua đường (sim/passersby.ts) ─────────────────────────────────────
  /** Còn bao nhiêu GIÂY THẬT nữa thì có người kế tiếp đi ngang. */
  private passerIn = 0;
  private passerSeq = 0;
  /**
   * Vị trí người chơi trong thế giới — scene đặt mỗi frame. Bấm F chọn người GẦN NHẤT
   * (`talkTarget`), nên cần biết mình đang đứng đâu. Vắng (test headless, `npm run sim`)
   * thì F rơi về người đứng đầu quầy như cũ.
   */
  playerAt: { x: number; y: number } | null = null;
  /** Vía mở hàng (P3-01 §2.6) — quyết ở lượt khách ĐẦU TIÊN, không một pixel UI nào. */
  via: ViaMood = 0;
  viaSettled = false;
  private opening: OpeningFacts = { walkedAway: false, complained: false, noChange: false, paidExact: false, smiled: false, friend: false };
  private dirtRemarked = false;

  servedCount = 0;
  lostCount = 0;
  /**
   * Mấy người ngó thấy hàng dài rồi quay về. CỐ Ý tách khỏi `lostCount` — xem ghi chú
   * nhánh `balked` trong `leave()`. Để đây cho dev overlay và cho việc tune, không phải
   * cho màn tối: người chơi không cần một con số thứ hai về chuyện họ không làm gì sai.
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
    this.offer = null;
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
    // người có tên giờ đã tự tới theo lịch (trước P2-02 nhịp này rút ngẫu nhiên người có tên)
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
   * NHÂN THÊM hệ số hàng chờ (bổ sung của bản dựng — xem `queuePatienceMul`).
   */
  private patienceOf(npc: NpcDef | null, at: number, ahead: number) {
    const base = npc?.patience ?? DEFAULT_PATIENCE_SEC;
    const rush = npc?.rush && at >= npc.rush[0] && at < npc.rush[1] ? 0.65 : 1;
    const tier = npc ? this.mem(npc.id).tier : "ACQUAINTANCE";
    const bond = tier === "RIVAL" ? 0.8 : tier === "FRIEND" ? 1.35 : 1;
    return base * rush * bond * queuePatienceMul(ahead) * (this.deps.patienceMul ?? 1);
  }

  private spawn(v: Visit, nowMin: number) {
    const npc = v.npc;
    const plan = v.plan ?? null;
    /*
     * Trần thông lượng — P4-02 §2.7 + §4.
     *
     * `days.json` viết tay `target.peak` cho từng ngày: tối đa mấy khách VÃNG LAI cùng
     * đứng ở quầy (2 suốt Hồi I, 4 ở ba ngày đỉnh sau clip bé Su, 2 lại ở những ngày
     * vắng). Con số đó là ĐƯỜNG CONG ÁP LỰC của cả mùa — không áp thì ngày nào cũng có
     * thể dồn tới 6 người và cái đường cong ấy không còn nghĩa gì. `peakCap` trước giờ
     * không ai gọi; đây là chỗ nối.
     *
     * Chỉ đếm khách vãng lai: người có tên tới theo lịch sinh hoạt của họ (P2-03 §2.9),
     * dời giờ ghé của họ là đổi kịch bản. Chế độ không giới hạn thời gian ép trần về 1
     * và đếm MỌI người — MỘT khách một lượt (§4), kịch bản 40 ngày không đổi một chữ.
     *
     * Quá trần thì lượt ghé đó DỜI LẠI một phút, không mất: hàng chờ dãn ra thôi.
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
    // Đã có mấy người đứng trước lúc người này tới. Tính ở ĐÂY, một lần, chứ không
    // theo chỗ đứng hiện thời: người thứ tư nhích dần lên đầu hàng không có nghĩa là
    // sức chờ của họ tụt lại — họ đã chấp nhận cái hàng mà họ NHÌN THẤY lúc xếp vào.
    // Người đang bỏ đi, người chỉ đi ngang và người đang quay đầu thì không tính, vì
    // không ai chờ sau họ.
    const ahead = this.customers.filter((x) => x.phase !== "leaving" && !x.pass && !x.balking).length;

    /*
     * "Đông quá thôi để bữa khác" — xem `balkChance` ở đầu file.
     *
     * Quyết ở ĐÂY, lúc người ta vừa tới đầu hẻm, chứ không phải ở `waitSteps()`: một khi
     * đã xếp vào hàng thì luật kia (`queuePatienceMul`) cầm trịch và cái hàng dài làm
     * người ta chờ ĐƯỢC LÂU HƠN, không phải ít hơn.
     *
     * Ba trường hợp KHÔNG bao giờ quay đầu:
     *  · lượt ghé có kịch bản (`plan`) — arc 40 ngày và sự kiện P4-03 không được phép rụng
     *    vì sáng đó tình cờ đông; vắng mặt theo chuyện đã có đường riêng (`arc.absent`);
     *  · chế độ không giới hạn thời gian — ở đó `peakCap` đã ép MỘT khách một lượt nên
     *    chẳng có hàng nào để mà ngại, và §15.2 không muốn thêm một cửa mất khách nào;
     *  · người đi ngang — họ vốn không vào hàng.
     * Dòng số RIÊNG `balk:` chứ không rút từ `visit:`: rút ké là dịch chuỗi số của cả lượt
     * ghé (đơn hàng, thoại), tức thêm một luật là mọi golden của hệ khác lệch theo.
     */
    const balking = !plan && !this.deps.noTimePressure
      && this.deps.hub.derive(`balk:${v.seq}`).next() < balkChance({
        ahead, slots: SLOTS.length, person,
        relVisitMul: visitProbabilityMul(m), moodPatience: moodPatienceMul(mood),
        rushing: !!npc?.rush && nowMin >= npc.rush[0] && nowMin < npc.rush[1],
      });
    // Quay đầu ở đầu hẻm KHÔNG phải một lượt ghé: không gọi món, không nhận bánh, nên
    // `npcVisitCount` (và cái streak khách ruột của `turnAway`) không được nhích.
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
    this.customers.push(c);
    this.deps.bus.emit("npc:arrived", { npcId: memKey, visitId: id, slot: "SEATED_FAR", atHhmm: fmtHhmm(v.at) });
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
        if (to === "NOTICED" && NOTICE_SPOKEN.has(o.id)) this.noticeBark(c, o.id, to);
      }
    }
  }

  /**
   * Phản ứng khi NOTICED — P1-02 §2.9, CANON §11: 35% im lặng (túi theo người). Cooldown
   * tier-1 giờ nằm trong content (`ctxBarkT1_*` của rule) — rule tier-1 hết lượt thì rule
   * điểm thấp hơn ("Hửm.") tự thắng.
   */
  private noticeBark(c: Customer, id: StimId, state: ObsState) {
    if (!this.barks.speaks(c.memKey)) {
      this.deps.bus.emit("dialog:silent", { npcId: c.memKey, reason: "RATE_35" });
      return;
    }
    this.speakConcept(c, "NOTICE_EVENT", { eventId: id, obsState: state, eventSalience: SALIENCE[id] }, SALIENCE[id]);
  }

  /**
   * Kênh 1 + 2 — P2-02 §3.1–§3.2. Mặt đổi sau `reactionDelay` (0,20–0,65 s, điềm đạm chậm
   * hơn); không hai người nào phản ứng trong cùng 60 ms (§5.3 luật phụ 1). Luật 35% im
   * lặng KHÔNG đụng tới đây: im lặng là không NÓI, không phải không phản ứng.
   *
   * `group` chỉ để ép nhóm bảng mặt khi chuyện xảy ra không có kích thích riêng của nó
   * (vd. từ chối ly trà: mặt ngượng của nhóm NAME, không phải mặt chê món).
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
   * Ghi lý do của một chuyện vừa làm quan hệ nhúc nhích. Nhiều lý do trong cùng một
   * khoảnh khắc thì lý do NẶNG KÝ NHẤT thắng: người chơi chỉ đọc được một dòng, và
   * dòng đó phải nói đúng thứ họ vừa làm mạnh tay nhất. `>=` chứ không `>` để lý do
   * ghi SAU thắng khi hoà — chỗ gọi xếp theo thứ tự "gần cái người ta thấy nhất".
   */
  private noteRel(text: string, weight: number) {
    if (!this.relNote || weight >= this.relNote.w) this.relNote = { text, w: weight };
  }

  /**
   * Kết một khoảnh khắc người chơi nối được với việc mình vừa làm (giao xong một ổ,
   * chọn xong một câu, cái nếp "cho thêm" vừa gãy) — P4 bổ sung sau playtest: điểm
   * thiện cảm ẩn hoàn toàn nên người chơi không biết bỏ thêm miếng đồ chua có tới hay
   * không, và chuyện đó biến cả hệ quan hệ thành may rủi trong mắt họ.
   *
   * Một khoảnh khắc = MỘT sự kiện, gộp mọi `record()` bên trong thành một chiều ròng.
   * Ròng gần bằng không thì KHÔNG phát: im lặng cũng là tin, và một dòng hiện lên sau
   * mỗi ổ bánh thì ba phút sau không còn ai đọc.
   *
   * T3 / L2: chỉ có chiều, một trong hai mức đậm nhạt, và một mẩu chữ. Không con số
   * nào ra khỏi đây — kể cả gián tiếp: hai bậc đậm nhạt không đo ngược ra điểm được.
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
      if (c.phase === "leaving" && near(c, exit, 0.5) && !lingering) this.customers.splice(i, 1);
    }
    this.assignSlots();
  }

  // ────────────────────────────────────────────── người qua đường (ambient)

  /**
   * Nhịp người đi ngang. Xem `sim/passersby.ts` cho toàn bộ lý do tồn tại của họ.
   *
   * Đếm bằng GIÂY THẬT (`dt`), không bằng phút game: đồng hồ tua nhanh khi quầy trống
   * (`core/clock`), nên đếm bằng phút game thì đúng lúc hẻm vắng nhất lại là lúc người
   * đi ngang ùa ra một lượt. Mắt người chơi đọc giây thật.
   *
   * Dòng số `passer:<ngày>:<thứ tự>` là dòng RIÊNG, không đụng `ambient` hay bất cứ
   * stream chính nào — một con hẻm đông hay vắng không được phép dịch chuỗi số của ai
   * tới ngày mai, cũng như của câu thoại nào hôm nay.
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
    c.ambient = true;
    // `leaving` ngay từ bước đầu: đó là cách `pass` vốn làm, và nó đúng — người đi ngang
    // không bao giờ vào hàng, nên mọi chỗ đếm người đang đứng (`audience`, `assignSlots`,
    // `ahead`, `peakCap`) phải bỏ qua họ mà không cần thêm một nhánh `if` nào.
    c.phase = "leaving";
    c.pass = {
      stay: plan.stay, until: -1, speed: plan.speed,
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
           * Người qua đường không có chuyện gì để kể: không gật đầu chào, không thoại
           * hẹn giờ, không đụng tới `story`. Họ chỉ ngoái nhìn cái xe một cái.
           *
           * Đặt THẲNG vào `react` chứ không qua `this.react()`: hàm đó rút một số của
           * `dialog-shufflebag` để giãn độ trễ phản ứng, mà dòng số đó là dòng chung của
           * cả hệ thoại. Một người đi ngang — thứ xảy ra vài chục lần một buổi và không
           * liên quan gì tới ai — mà tiêu số của nó là dịch toàn bộ lời thoại của 12
           * người có tên sang chỗ khác. Ở đây không cần giãn: họ không nói câu nào.
           */
          if (c.ambient) {
            if (p.stay > 0) c.react.schedule(c.now, 0, null, "PEEK_OVER", p.stay);
            return;
          }
          if (p.nod && (c.npc?.id !== "CHU_KIET" || this.ovenHot)) this.react(c, "FLOURISH", 1, "NOD");
          this.queueLines(c, c.plan?.pass?.lines, 0.3);
          if (this.deps.story) onPass(this.deps.story, c.npc?.id ?? null, c.plan?.tag, this.deps.day);
        }
        return;
      }
      if (c.now < p.until) return;
      walk(c, exit, dt, p.speed);
      return;
    }
    /*
     * Đã quyết không vào (`balkChance` lúc spawn) — nhưng KHÔNG xoá người ta ở cổng.
     *
     * Khách sinh ra ngay tại `GATE`, mà vòng dọn cuối `tickNpcs()` xoá mọi người đang về
     * khi họ chạm cổng trong bán kính 0,5 ô: gọi `leave()` ngay lúc spawn là người đó biến
     * mất trong CÙNG một frame, chưa kịp có một pixel nào trên màn hình. Nên họ vẫn đi
     * vào thật, tới cuối hàng, đứng ngó một nhịp (`BALK_LOOK_SEC`, chặn ở nhánh "leaving"
     * bên dưới), nói câu của mình rồi quay lưng đi ra — cùng một đường về của mọi người.
     *
     * Trả sớm trước cả `waitSteps()`: người chưa xếp vào hàng thì không có đồng hồ chờ nào
     * chạy, không có MADE_THEM_WAIT, không có cửa `LEAVE_AT`. Hai luật không đụng nhau.
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

    switch (c.phase) {
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
   * MADE_THEM_WAIT đi KÊNH THỜI GIAN của riêng từng người — P1-02 §2.7. Không phải một
   * kích thích cả hàng cùng "nhìn thấy". Các mốc theo r = đã chờ / sức chờ:
   *   0,6  → nhấp nhổm (dáng, không lời)
   *   max(0,85·T, T−8) → liếc đồng hồ + thở dài
   *   1,0  → CONFIRMED: người này THẬT SỰ thấy mình bị để chờ
   *   1,6  → bỏ đi
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
    this.smalltalked.add(c.id);
    if (this.offerTalk(c)) return;
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
   * Câu buông ra lúc quay lưng đi — sau khi đã nhận bánh, đã trả tiền, không còn việc gì.
   *
   * Mấy nhánh bỏ về (hết hàng, chờ hết nổi) vốn đã có câu của nó; nhánh ĐƯỢC PHỤC VỤ thì
   * chưa ai viết, nên bốn mươi ngày bán hàng không một ai nói với mình câu nào lúc đi.
   *
   * Luật quan trọng nhất ở đây là KHÔNG PHẢI AI CŨNG NÓI, và cùng một người thì lúc nói
   * lúc không — chào đủ mỗi khách mỗi lượt thì nó thành tiếng chuông cửa, không còn là
   * người. Ba cái van, cả ba đều có sẵn trong nhà:
   *   · túi im lặng 7/20 theo từng người (`barks.speaks`) — chia đều chứ không roll, nên
   *     không bao giờ im năm lượt liền mà cũng không bao giờ nói mười lượt liền
   *   · `odds` của từng rule trong content — người viết thoại vặn, không phải lập trình
   *   · `silent: true` của người không nói (chị Lan có sẵn, anh Bảo thêm ở file của anh)
   * Chưa kể cái van thứ tư có sẵn và rất thật: đi tới cổng trước khi tới lượt nói thì
   * câu đó rụng (`QUEUE_EXPIRE_SEC`) — đúng như người ta đi mất rồi mới nghĩ ra câu chào.
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
    if (this.offer?.c === c) { this.applyIgnore(c, this.offer.talk); this.offer = null; }
    if (this.talkWith === c) this.endTalk();
    if (c.plan?.tag === "SK-42") this.lanLeft = true;
    if (reason !== "served" && this.deps.story) onUnserved(this.deps.story, c.npc?.id ?? null, c.plan?.tag, !!c.plan?.barter);
    c.phase = "leaving";
    c.leaveReason = reason;
    c.slot = -1;
    c.zone = "SEATED_FAR";                             // quay lưng rồi thì không còn nhìn quầy
    if (reason === "served") { this.servedCount++; this.farewell(c); }
    // "soiled" cũng là một người ra về tay không ngay ở lượt mở hàng — vía y như vậy.
    if (!this.viaSettled && (reason === "impatient" || reason === "soldout" || reason === "soiled")) { this.opening.walkedAway = true; this.settleVia(); }
    /*
     * Lắc đầu không nhận ổ bánh vừa nhặt dưới đất lên — xem `SOILED_CAUGHT`.
     *
     * Đây là một người chơi ĐỂ MẤT, không bàn cãi, nên nó vào thẳng `lostCount` và vào
     * `lost` của sổ tay — khác hẳn nhánh `balked` ngay bên dưới, chỗ người chơi không
     * làm gì sai. Ưu tiên 92: cao hơn mọi câu khác đang xếp hàng, vì đây là câu nặng
     * nhất người chơi có thể nghe được ở quầy.
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
     * Quay đầu vì đông — GIÁ CỦA NÓ là gì, và vì sao không hơn thế.
     *
     * KHÔNG `remember()`. Trí nhớ là sổ ghi "người bán đã LÀM GÌ với tôi", mà ở đây người
     * bán không làm gì sai hết: họ đang bận bán cho người khác. Ghi MADE_THEM_WAIT (như
     * `turnAway` làm lúc hết bánh) thì sai cả hai đầu: người này chưa chờ một giây nào, và
     * `remember()` còn gọi `witness()` — tức cả hẻm bắt đầu kể nhau nghe "quán đó để người
     * ta chờ" về một chuyện chưa từng xảy ra. Tệ hơn nữa, nó biến BÁN ĐẮT thành một đường
     * tụt quan hệ: càng đông càng bị ghi, mà đông là thứ người chơi đang cố làm cho được.
     *
     * Nhẹ hơn `turnAway` là có chủ ý và đúng thứ tự: hết bánh là người ta đã tới tận quầy,
     * đã mở miệng, rồi mới bị trả về tay không. Đằng này người ta còn chưa đứng vào hàng.
     *
     * Mà vẫn KHÔNG phải mất trắng không dấu vết, ba đường, không đường nào cần máy mới:
     *  · một ổ không bán được — và một buổi sáng mất bốn người là mất đứt tiền lời;
     *  · `m.visits` không nhích (xem `spawn`), nên lượt ghé đó không đẩy quan hệ đi đâu:
     *    không REMEMBERED_USUAL, không trà đá, không một dịp nào để tử tế với người ta;
     *  · người có lịch ghé hôm nay mà không được phục vụ thì tối nay `nightly()` §2.5 tính
     *    là một lần LỠ (có `GRACE_MISSES` đỡ cho một bữa). Đó mới là cái giá thật, và nó
     *    đúng hình dạng cần có: không phải vết thương, mà là một khoản chưa kịp gửi.
     *
     * Và KHÔNG tính vào `lost`: `lost` là "người chơi để mất khách", đọc ở màn tối. Hàng
     * dài là hệ quả của bán được, không phải của làm dở — đếm vào đó thì ngày bán đắt nhất
     * mùa lại hiện ra con số xấu nhất mùa, và cái cột đó hết đọc được. `StallScene` và
     * `sim/headless` chỉ cộng `lost` khi reason là IMPATIENT nên không cần sửa gì bên đó.
     * `balkedCount` là chỗ để dev overlay / telemetry đọc nếu cần tune.
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

  /** Ai đứng chỗ nào: người tới trước đứng gần quầy hơn. Người đứng sau bị người trước che. */
  private assignSlots() {
    let i = 0;
    for (const c of this.customers) {
      // người đang quay đầu không xếp vào hàng — cấp chỗ cho họ là đẩy người tới sau lùi
      // một bậc rồi trả lại sau một giây rưỡi, tức cả hàng nhúc nhích không vì lý do gì.
      if (c.phase === "leaving" || c.balking) continue;
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
   * Mọi câu khách nói đi qua đây — P1-04 §2.9: trễ 0,2–0,4 s, tối đa 1 câu MỚI mỗi frame,
   * tối đa 2 bong bóng cùng lúc; người đứng ngay trước quầy luôn được nói trước; câu
   * chờ quá 2,5 s thì thôi (đã qua lúc để nói).
   *
   * `wait` cộng thêm vào quãng trễ cho câu phải ĐỨNG SAU một câu khác của CHÍNH người
   * đó — mỗi người chỉ có một bong bóng, nói chồng lên là cắt ngang câu đang đọc dở.
   * Hạn 2,5 s đếm từ lúc hết trễ, nên `wait` không ăn mất cửa sổ nói.
   */
  private say(c: Customer, text: string, tier: 1 | 2 | 3 = 2, log = false, pri = 50, rule?: Rule, wait = 0) {
    const delay = wait + BARK_DELAY_MIN + this.dialogRng.next() * BARK_DELAY_SPAN;
    this.queue.push({ c, text, tier, delay, log, pri, waited: 0, rule });
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

  tickDialog(dt: number) {
    if (this.followups.length) this.runFollowups();
    if (!this.queue.length) return;
    for (const p of this.queue) {
      if (p.delay > 0) p.delay -= dt;
      else p.waited += dt;
    }
    // câu hết hạn, hoặc người đã đi khuất
    for (let i = this.queue.length - 1; i >= 0; i--) {
      const p = this.queue[i];
      const gone = !this.customers.includes(p.c);
      // câu gọi món (pri 100) không bao giờ bị bỏ — không có nó thì không làm được bánh
      if (gone || (p.waited > QUEUE_EXPIRE_SEC && p.pri < 100)) {
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
      const others = this.customers.filter((x) => x.speaking && x !== p.c).length;
      if (released >= DIALOG_QUERIES_PER_FRAME || others >= MAX_BUBBLES) { this.dialogDeferred++; break; }
      this.queue.splice(this.queue.indexOf(p), 1);
      p.c.speak(p.text, bubbleLife(p.text));
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
        if (f) this.followups.push({ c: p.c, concept: f.concept, at: this.nowSec + bubbleLife(p.text) + f.delaySec });
      }
      this.deps.bus.emit("dialog:spoken", { npcId: p.c.memKey, text: p.text, tier: p.tier });
      if (p.log) this.out.push({ kind: "log", text: `${this.label(p.c)}: ${p.text}` });
    }
  }

  // ──────────────────────────────────────────────────────────────── giao bánh

  /**
   * Người chơi đưa ổ bánh cho khách đang đứng trước mặt — P1-03 §2.6–§2.12.
   *
   * Mỗi lỗi tra ĐÚNG khoá của nó (`orderDefectKey`): khách thấy lỗi đó lúc làm → ANTICIPATED
   * ("cô thấy con quên…"), không thấy → DISCOVERED ("ủa… thiếu…"). `take(1)`: nhiều lỗi
   * chỉ NÓI một, phần còn lại vẫn tính ngầm vào tiền boa. Không bao giờ trừ tiền bánh —
   * tệ nhất là không có boa (P1-03 §2.12).
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
     * Ổ đã nằm dưới đất, và NGƯỜI NÀY ĐÃ THẤY nó rớt — xem `SOILED_CAUGHT`.
     *
     * Chặn ở ĐẦU hàm, trước cả `diffDish`: không có lượt giao nào hết. Không `order:delivered`,
     * không tính tiền, không tiền boa, không `serveOutcome`. Lắc đầu là lắc đầu.
     *
     * `peakOf` chứ không `peakOfKey`: ta không biết ổ bánh trên tay ứng với LẦN RỚT nào
     * (scene chỉ đưa qua một cái cờ bool). Mà người khách cũng vậy — họ thấy một ổ bánh
     * rơi xuống đất trong lượt ghé này, giờ cầm một ổ vừa được nhặt lên, và họ nối hai
     * chuyện đó lại. Mốc NOTICED chứ không CONFIRMED: liếc thấy là đủ để không ăn.
     *
     * Ổ bánh Ở LẠI TRONG TAY người chơi (`res.ok === false` → scene không xoá gì cả), nên
     * đường ra duy nhất là đi bỏ nó vô thùng — đúng việc lẽ ra phải làm từ đầu.
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
     * Ổ CHƯA CÓ MIẾNG NHÂN NÀO, mà người này không phải người cầm cho xong — xem khối
     * `HOLLOW_REFUSED`. Chặn TRƯỚC `nameCheck` và trước `diffDish`: lượt giao này không
     * xảy ra, nên không có chuyện gọi tên (gọi sai tên bị ghi lại ở lần đưa THẬT, chứ
     * không ghi thêm một lần cho mỗi lần bị trả lại), không `order:delivered`, không
     * tiền, không `serveOutcome`. Lắc đầu là lắc đầu.
     *
     * `hollow` tính một lần ở đây rồi dùng lại cho cả nhánh khách NHẬN ở dưới — chỗ nó
     * quyết định giá (ổ trống thì tính tiền một ổ bánh mì không). Đọc `levels` GỐC chứ
     * không đọc khẩu vị ẩn: `alt` chỉ đụng ớt/tương, không bao giờ đụng nhân mặn.
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
     * Cái nếp "cho thêm" chỉ được đụng tới trên ổ KHÔNG LỖI, và đúng một lần mỗi lượt ghé.
     *
     * Trên một ổ làm trật thì không ai đọc ra được chuyện thiếu miếng đồ chua tặng kèm:
     * người ta đang bận với cái thiếu thật. Nên lượt đó nếp giữ nguyên, không dày thêm mà
     * cũng không gãy — `generosityOf` vốn đã theo luật ấy ("hào phóng trên ổ làm sai thì
     * không phải hào phóng, là chống chế").
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
      // Cái giá THẬT của nhánh "không ai thấy": lượt này mất tư cách một lượt bán sạch.
      // Không `servedWell` (quan hệ không nhích lên), và không `disprove` — tin đồn "bên
      // đó bánh rớt" lẽ ra nhạt đi sau một ổ đàng hoàng thì nay giữ nguyên. Bán gian thì
      // không gột được tiếng, kể cả khi không ai bắt được.
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
   * THÓI QUEN "cho thêm" — CANON §8i đọc ngược lại.
   *
   * §8i chặn chiều đi: cho hoài thì mỗi lần cho đáng ít dần, và người tinh ý bắt bài.
   * Nhưng nó không nói gì về chiều về, mà chiều về mới là chỗ cái hẻm thật: cho ba bữa
   * liền rồi bữa thứ tư đưa ổ trơn, người ta không giận — người ta CHƯNG HỬNG. Cái đó
   * phải có thật, không thì "cho thêm" chỉ còn là một nút cộng điểm bấm lúc nào cũng được.
   *
   * Đếm theo LƯỢT GHÉ chứ không theo ngày (`sim/memory.ts`: `extraHabit`), vì không ai
   * trong mười hai người ghé đủ bốn mươi bữa. Một lượt ghé tính đúng một lần, kể cả khi
   * người đó mua hai ổ.
   *
   * Trả về cường độ cái hụt để `serveDish` trừ vào `positive` — tiền boa bữa đó mỏng đi
   * một chút, đúng kênh duy nhất mà chất lượng được phép chạm tới (P1-03 §2.12).
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
   * Mời ly trà đá — P1-02 §2.8: vừa là chăm sóc, vừa là công cụ CHỦ ĐỘNG hạ attention,
   * nên cũng là công cụ dễ phá game nhất. Các khoá:
   *  · VẬT LÝ — khách còn cầm ly thì không nhận ly nữa
   *  · cooldown 45 s mỗi người: ly trong cooldown chỉ được cái gật đầu, KHÔNG cúi uống
   *  · CARED_FOR_THEM nhỏ dần 1,0 / 0,6 / 0,25 — đếm theo NGÀY, không theo lượt ghé
   *  · trần theo `soi` áp cho MỌI khách (`teaSuspectAtCup`): ly 3 với người soi ≥ 0,7,
   *    trễ nhất là ly 6 với người xuề xoà nhất. Bắt bài rồi thì thôi CẢ MÙA — cái đó
   *    nằm trong trí nhớ của người ta (`teaSuspect`), không phải trong một lượt ghé.
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
   * "Bắt bài chuyện mua chuộc" — CANON §8(i). Sống trong TRÍ NHỚ của người đó
   * (`NpcState.seen.teaSuspect` = ngày bắt bài), nên nó qua được lượt ghé sau, qua đêm
   * và qua save: "từ chối vĩnh viễn" mới thật là vĩnh viễn. Trước đây cờ này là thuộc
   * tính của một lượt ghé nên chính người đó ghé lại là bộ đếm về 0.
   *
   * ⚠️ Khách vãng lai dùng chung `memKey` theo KIỂU NGƯỜI (`walkin0..7`) — y như
   * `freebies` và `visits` đã làm — nên cờ này cũng dính cho cả kiểu người đó.
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

  // ─────────────────────────────────────────────────────── trò chuyện (P5-01)

  /**
   * Bấm F. Trả `null` = không có chuyện gì để nói với người này lúc này (chưa ai ở quầy,
   * nội dung chưa nạp xong, hoặc đã nói hết chuyện với người này rồi). Scene báo một dòng
   * nhật ký — KHÔNG còn đường lui "một câu xã giao" nào nữa.
   *
   * ⚠️ HỢP ĐỒNG VỚI SCENE: bảng còn mở thì đồng hồ phải ĐỨNG (`clock.paused`). Đọc bốn
   * dòng mà kiên nhẫn vẫn tụt thì người chơi học được đúng một bài — đừng bao giờ bấm F.
   */
  openTalk(): TalkView | null {
    if (this.talkSession) return this.talkView("");
    const c = this.talkTarget();
    if (!c) return null;
    const key = this.talkKey(c);
    // Chưa nạp xong (vừa spawn, hoặc chunk còn đang tải): rơi về `ask()`. Không chặn frame.
    if (!this.offer && !this.talks.has(key)) { this.talks.ensure(key); return null; }
    const talk = this.offer?.c === c ? this.offer.talk : pickTalk(this.talks.get(key), this.talkCtx(c), this.dialogRng);
    if (!talk) return null;
    const opened = this.offer?.c === c;
    this.offer = null;
    /*
     * CỐ Ý chưa đánh dấu "đã nói chuyện này" ở đây — xem `chooseTalk`.
     *
     * Trước đây đánh dấu ngay lúc mở, nên mở bảng rồi bấm Esc là cuộc đó mất luôn CẢ MÙA:
     * bấm F lại thì `pickTalk` không còn gì để rút và nút F trông như chết. Mở bảng ra đọc
     * rồi đổi ý thì mình chưa nói câu nào cả — không có gì để nhớ.
     */
    this.talkSession = new TalkSession(talk, c.memKey);
    this.talkWith = c;
    this.talkWarmth = 0;
    this.actReply = null;
    /*
     * Gọi một người đang đi ngang thì người ta DỪNG LẠI — ngay chỗ đang đứng, không
     * phải đi nốt tới chỗ ngoái nhìn rồi mới quay lại.
     *
     * `until` đang là −1 (chưa tới chỗ dừng) hay đã đếm xong thì cũng vậy: ghim `spot`
     * về đúng chân họ và hẹn `until` ra sau. Không có hai dòng này thì mở bảng ra là
     * thấy người mình vừa gọi vẫn thủng thẳng đi tiếp trong lúc đang trả lời mình.
     */
    if (c.ambient && c.pass) {
      c.pass.spot = { x: c.x, y: c.y };
      c.pass.until = c.now + PASSER_TALK_STAY;
    }
    this.talkEngaged = false;
    this.talkNpcOpened = opened;
    // Nhìn MẶT người bán, không nhìn tay — cùng cửa với ASK_QUESTION cũ (P1-02 §2.8).
    if (c.now - c.lastAskedAt >= ASK_COOLDOWN) {
      c.ask();
      this.deps.bus.emit("attention:toolUsed", { tool: "ASK_QUESTION", npcId: c.memKey, durationSec: 3 });
    }
    // Khách đã nói opener thành bong bóng lúc họ bắt chuyện rồi — không nói lại lần hai.
    return this.talkView(opened ? "" : this.fill(c, talk.opener), false, opened ? undefined : talk.openMood);
  }

  /** Người chơi bấm lựa chọn thứ `i` (hoặc phím số). Trả nhịp kế, hoặc nhịp cuối với `done`. */
  chooseTalk(i: number): TalkView | null {
    const s = this.talkSession, c = this.talkWith;
    if (!s || !c) return null;
    const r = s.choose(i, this.talkGate());
    if (!r) return null;
    // Nói ra một câu rồi mới tính là đã nghe cuộc này — một lần cho cả mùa.
    if (!this.talkEngaged) { this.talkEngaged = true; this.markTalkUsed(c, s.talk); }
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
    const view = this.talkView(this.fill(c, reply ?? ""), !reply && !!r.node.silent, act?.mood ?? r.node.mood);
    if (r.done) this.endTalk();
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
     * LÀM THINH có giá — nhưng chỉ khi thật sự có cái để làm thinh.
     *
     *   khách mở lời trước, mình đóng bảng        → làm thinh với người đang nói. Có giá.
     *   mình bấm F rồi đổi ý, CHƯA nói câu nào     → chưa có gì xảy ra. Không mất gì,
     *                                                và cuộc đó vẫn còn để bấm F lại.
     *   mình đã nói rồi mới bỏ ngang               → bỏ người ta giữa chừng. Có giá.
     */
    if (npcOpened || engaged) this.applyIgnore(c, s.talk);
  }

  /**
   * Vì sao F không mở được bảng — để scene nói ra cho người chơi biết phím vẫn sống.
   * Ba lý do, ba câu khác nhau: không có ai · chưa nạp kịp · hết chuyện để nói.
   */
  talkUnavailable(): string {
    const c = this.talkTarget();
    if (!c) return "chưa có ai để nói chuyện";
    if (!this.talks.has(this.talkKey(c))) return "…";
    return `hết chuyện để nói với ${this.label(c)} bữa nay rồi`;
  }

  /**
   * Ai đang trong tầm bấm F — để `StallScene` nhắc một dòng "lại gần, bấm F". Trả null
   * khi người gần nhất là người đứng đầu quầy (chuyện đó đã có đường nhắc riêng) hoặc
   * khi không có ai.
   */
  nearbyToTalk(): Customer | null {
    const c = this.nearestTalkable();
    return c && c !== this.front ? c : null;
  }

  /**
   * Nói chuyện được với người này không.
   *
   * Người ĐI NGANG (`pass`) nói chuyện được suốt quãng họ còn ở trong hẻm — đó chính là
   * chỗ sửa: trước đây F chỉ với tới `front`, nên chú Kiệt đẩy xe ngang qua mỗi sáng
   * suốt 40 ngày mà không có cách nào chào ông một câu. Người đã được phục vụ xong và
   * đang quay lưng về thì KHÔNG: gọi giật lại một người vừa mua xong không phải "lại gần
   * nói chuyện", nó là níu người ta lại.
   */
  private talkable(c: Customer) {
    if (c.balking) return false;
    return c.pass ? true : c.phase !== "leaving";
  }

  /** Người nói chuyện được GẦN NHẤT người chơi, trong `TALK_REACH` ô. */
  private nearestTalkable(): Customer | null {
    const p = this.playerAt;
    if (!p) return null;
    let best: Customer | null = null, bestD = TALK_REACH;
    for (const c of this.customers) {
      if (!this.talkable(c)) continue;
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (d < bestD) { best = c; bestD = d; }
    }
    return best;
  }

  /**
   * F nói chuyện với AI. Thứ tự là thứ tự của phép lịch sự:
   *   1. người vừa bắt chuyện với mình — làm lơ người đang nói là chuyện khác hẳn;
   *   2. người đứng gần mình nhất trong tầm với (kể cả người đang đi ngang ngoài đường);
   *   3. người đứng đầu quầy — đường cũ, để đứng ở lò bấm F vẫn nói được với người chờ.
   */
  private talkTarget(): Customer | null {
    if (this.offer && this.talkable(this.offer.c)) return this.offer.c;
    const near = this.nearestTalkable();
    if (near) return near;
    const f = this.front;
    return f && this.talkable(f) ? f : null;
  }

  get talkOpen() {
    return this.talkSession !== null;
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
    this.talkEngaged = false;
    this.talkNpcOpened = false;
    this.talkWarmth = 0;
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
    return { flags: this.talkFlags(), cash: this.deps.till?.floatLeft };
  }

  /**
   * Thay DANH XƯNG vào một câu thoại — `{call}` `{me}` `{self}` `{you}`.
   *
   * Một bộ thoại dùng chung cho tám dáng người khác nhau thì không thể viết cứng "anh"
   * vào câu nói được: dáng số 3 là một bà cụ, và "Anh ăn thử một ổ nghen?" nói với bà cụ
   * là một câu tiếng Việt không tồn tại. Nên chỗ xưng hô để TRỐNG trong file nội dung,
   * và điền ở đây theo đúng người đang đứng trước mặt (`WALKIN_ADDRESS` tra theo dáng).
   *
   *   {call} người chơi gọi họ     {me}   người chơi tự xưng với họ
   *   {self} họ tự xưng            {you}  họ gọi người chơi
   *
   * Câu nào không có dấu ngoặc nào thì trả về nguyên xi — 12 người có tên viết thẳng tên
   * vai vào lời thoại như cũ, không ai phải sửa một chữ.
   */
  private fill(c: Customer, s: string): string {
    if (!s.includes("{")) return s;
    const a = this.addressOf(c);
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
   * Người QUA ĐƯỜNG có kho riêng (`QUA_DUONG`), không dùng chung với khách vãng lai —
   * và đó không phải chuyện gọn gàng, nó là chuyện đúng sai. Kho `WALKIN` toàn chuyện
   * của người đang MUA: trả giá, chê mắc, đòi bớt pate. Đem mấy câu đó cho một người
   * đang đi ngang là họ tự dưng mặc cả một ổ bánh mà họ chưa hề hỏi mua.
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
      usedSeason: m.talksDone ?? [],
    };
  }

  /** Ghi "đã nói chuyện này rồi" NGAY lúc mở, không đợi nói xong — bỏ ngang cũng là đã nghe. */
  private markTalkUsed(c: Customer, t: Talk) {
    const m = this.mem(c.memKey);
    (m.talksDone ??= []).push(t.id);
    if (m.talkTopics?.day !== this.deps.day) m.talkTopics = { day: this.deps.day, topics: [] };
    m.talkTopics.topics.push(t.topic);
  }

  private talkView(line: string, silent = false, mood?: TalkMood): TalkView | null {
    const s = this.talkSession, c = this.talkWith;
    if (!s || !c) return null;
    const here = s.options;
    const opts = here ? visibleOptions(here, this.talkGate()) : [];
    return {
      npcKey: c.memKey, name: this.label(c), line, silent, mood,
      skin: c.body.skin, hair: c.body.hair,
      options: opts.map((o) => ({ say: this.fill(c, o.say), tone: o.tone })),
      done: s.done || !here,
    };
  }

  /**
   * HÀNH ĐỘNG THẬT của một câu nói — P5-02.
   *
   * Phần lớn `act` không kết thúc ở đây: nó TREO một lời hứa lên lượt ghé (`pledges`),
   * rồi `deliver()` và `settlePayment()` mới là chỗ biết người chơi có giữ lời không.
   * Đó là chủ ý: lời hứa phải sống qua quãng thời gian người chơi còn có thể đổi ý.
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
        this.askStepAside(c);
        break;
      case "REFUSE":
        this.out.push({ kind: "log", text: `${this.label(c)} bị mời đi.` });
        this.leave(c, "refused");
        break;
      case "INVITE":
        this.invite(c, act, tone);
        break;
    }
  }

  /**
   * MỜI một người đang đi ngang ghé vô mua — xem `sim/passersby.inviteChance`.
   *
   * Ba chi tiết cố ý:
   *
   *  · Dòng số là `invite:<id lượt đi ngang>`, nên MỘT người chỉ có MỘT câu trả lời. Mời
   *    hụt rồi mở cuộc khác mời lại cũng ra đúng chữ "thôi" đó. Không có chuyện bấm Esc
   *    rồi bấm lại cho tới lúc trúng (CANON §8 chống save-scum).
   *  · Người viết khai cả `yes` lẫn `no`, và câu nào hiện ra là do CÁI ROLL quyết, không
   *    phải do lựa chọn. Lựa chọn chỉ làm cái cửa rộng ra.
   *  · Mặt đi theo kết quả chứ không theo lời: chịu thì cười, từ chối thì cười gượng.
   *    Người viết nắm chữ, người chơi đọc mặt — và hai cái đó phải khớp nhau.
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
    const yes = this.deps.hub.derive(`invite:${c.id}`).next() < p;
    const mood: TalkMood = yes ? "CUOI" : "CUOI_KHAN";
    this.actReply = { text: yes ? act.yes : act.no, mood };
    this.scheduleReact(c, MOOD_FACE[mood], MOOD_POSE[mood]);
    if (!yes) {
      this.out.push({ kind: "log", text: `${this.label(c)} đi tiếp.` });
      return;
    }
    this.acceptInvite(c);
  }

  /**
   * Người đi ngang nhận lời: từ đây họ là một người khách thật, không còn là cái nền.
   *
   * Xoá sạch mọi dấu vết của một lượt đi ngang (`ambient`, `pass`) rồi trả họ về đúng
   * đường đời của một khách vãng lai — `arriving`, `assignSlots` cấp chỗ, `takeOrder` gọi
   * món, `deliver`/`settlePayment` tính tiền. Không một nhánh `if` nào ở hạ nguồn phải
   * biết rằng người này từng đi ngang: đó là cách duy nhất để họ không thành một loại
   * khách hạng hai có luật riêng.
   */
  private acceptInvite(c: Customer) {
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

  /**
   * "Con đứng qua bên cho cô bán nghen."
   *
   * Người ta NGHE hay KHÔNG là chuyện của người ta, không phải của người chơi — nên đây
   * là một phép thử quan hệ, không phải một cái nút. Thân thì dạt qua thật (người sau
   * được phục vụ trước, thấy bằng mắt). Không thân, hoặc đang quạu, thì họ đứng ì ra,
   * và mình vừa làm mất mặt một người ngay trước hàng.
   */
  private askStepAside(c: Customer) {
    const m = this.mem(c.memKey);
    const willing = c.npc
      ? (m.tier === "FRIEND" ? 0.92 : m.tier === "RIVAL" ? 0.15 : 0.55) * (1.25 - c.personality.nongTinh)
      : 0.45;
    if (this.deps.hub.derive(`aside:${this.deps.day}:${c.id}`).next() < willing) {
      this.yieldSlot(c);
      this.reactTalk(c, "CARED", 1, "STEP_BACK_HALF");
      this.out.push({ kind: "log", text: `${this.label(c)} dạt qua một bên.` });
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

  /** Đẩy người này xuống sau người kế tiếp. Thứ tự mảng CHÍNH LÀ thứ tự hàng (`assignSlots`). */
  private yieldSlot(c: Customer) {
    const i = this.customers.indexOf(c);
    const j = this.customers.findIndex((x, k) => k > i && x.phase !== "leaving" && !x.pass);
    if (i < 0 || j < 0) return;
    this.customers.splice(i, 1);
    this.customers.splice(j, 0, c);
    this.assignSlots();
  }

  /**
   * Giá ổ sau khi trừ cái người chơi đã HỨA MIỆNG — P5-02.
   *
   * Trước đây "Dạ thôi em bớt cô ba ngàn vậy" không bớt một đồng nào: khách vẫn trả đủ,
   * mà người chơi vẫn được tiếng tử tế. Giờ ba ngàn đó ra khỏi doanh thu thật, nên câu
   * "bớt cho cô" là một quyết định kinh tế chứ không còn là một câu xã giao.
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
   * Lời hứa được kiểm lúc ĐƯA BÁNH — P5-02. Trả về điểm cộng/trừ để `deliver()` gộp vào
   * `positive`, và nói ra câu của người ta.
   *
   * Ba kết cục, ba câu khác nhau:
   *   giữ lời           → họ thấy, và họ nhớ (CARED_FOR_THEM)
   *   bỏ thứ KHÁC       → họ vẫn nhận, nhưng họ biết mình bị đổi (BROKEN_PROMISE nhẹ)
   *   không bỏ gì       → BROKEN_PROMISE nặng. Đây là chỗ đắt nhất của cả hệ trò chuyện.
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
      // Bỏ nhầm món khác: có lòng, mà không phải thứ đã hứa.
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
   * Hệ quả của MỘT lựa chọn. Ba kênh, đúng thứ tự THẤY → HIỂU → NGHE của P2-02:
   *   mặt + dáng (thấy ngay)  ·  sức chờ (hiểu: họ bớt muốn đứng đây)  ·  trí nhớ (nghe sau)
   *
   * Khách vãng lai KHÔNG có trí nhớ (P2-02 §5.1 M3′) nhưng VẪN giận được: giận là chuyện
   * của lượt ghé này, không cần ai nhớ ai.
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
    if (anger > 0) c.waitSec += angerToWaitSec(anger, c.waitT, c.waitSec, LEAVE_AT);
    if (o.calm) c.soothe(o.calm / intensityMul(c.personality));
    /*
     * Mặt + dáng. Người viết khai `mood` thì `mood` THẮNG: "Cha, con này!" và
     * "…Ờ. Cảm ơn con." cùng +3 điểm mà hai khuôn mặt khác hẳn nhau, và chỉ người viết
     * biết là khác. Không khai thì suy ra từ hệ quả y như cũ.
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
     * BỎ VỀ — P5-02. Chửi một người tới mức này thì họ không mua nữa, và chuyện đó phải
     * THẤY ĐƯỢC: họ quay lưng đi, `lost` nhích lên, ổ đang làm dở thành ổ thừa.
     *
     * Ngưỡng tính SAU `intensityMul`, nên chính tính cách quyết ai nổ trước: ông Hải
     * (nongTinh 0,9 → ×1,40) bỏ về ở `anger` 40, thầy Phúc (0,2 → ×0,70) phải tới 80.
     * Đặt cuối hàm để quan hệ và lời hứa ghi xong trước khi người ta bước đi.
     */
    if (anger >= STORM_OFF_ANGER && c.phase !== "leaving") {
      this.out.push({ kind: "log", text: `${this.label(c)} bỏ đi — bị nói nặng quá.` });
      this.leave(c, "insulted");
    }
    // Cuối cùng, sau khi quan hệ, lời hứa và cơn giận đã ngã ngũ: một dòng cho người chơi.
    this.settleRelMoved(c, relBefore);
  }

  /**
   * Khách TỰ bắt chuyện — một lần mỗi lượt ghé, chen vào đúng chỗ của SMALLTALK cũ.
   * Họ nói opener thành bong bóng rồi đứng đó; người chơi bấm F thì bảng mở ngay tại
   * nhịp đầu (không nghe lại opener). Không bấm gì tới lúc họ đi = làm thinh, có giá.
   */
  private offerTalk(c: Customer): boolean {
    if (this.offer || this.talkSession) return false;
    if (this.offersToday >= TALK_OFFERS_PER_DAY) return false;
    if (this.nowSec - this.lastOfferAt < TALK_OFFER_GAP_SEC) return false;
    const key = this.talkKey(c);
    if (!this.talks.has(key)) return false;
    const talk = pickTalk(this.talks.get(key).filter((t) => !!t.initiates), this.talkCtx(c), this.dialogRng);
    if (!talk) return false;
    if (this.deps.hub.derive(`talk:${this.deps.day}:${c.id}`).next() >= (talk.initiates ?? 0)) return false;
    this.offersToday++;
    this.lastOfferAt = this.nowSec;
    this.offer = { c, talk };
    this.say(c, this.fill(c, talk.opener), 2, true, 70);
    this.out.push({ kind: "talkOffer", npcId: c.memKey, name: this.label(c) });
    return true;
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
   * Tên hiện ra với người chơi (nhật ký, phiếu, lý do) — P2-05: tên là thứ người chơi TỰ
   * GHI vô sổ, chưa ghi thì chưa được gọi tên. Nhưng "chưa gọi tên" không có nghĩa là gọi
   * người ta bằng một gạch ngang: quyền tự ghi tên mở tận ngày 11, nên suốt mười ngày đầu
   * mọi dòng hệ thống đều là "—", ba người bỏ đi ra ba dòng giống hệt nhau, và người QUEN
   * hoá ra khó nhận mặt hơn người lạ (khách vãng lai vốn đã có "cô xách giỏ", "anh chạy xe").
   * Chưa biết tên thì gọi bằng HÌNH DÁNG, đúng như với khách lạ (`shapeOf`).
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
 * Ổ rút khỏi lò sớm — xem khối `UNDERDONE_FLOOR` ở đầu file để biết vì sao mượn
 * `WRONG_TEMP` và vì sao có sàn 0,35.
 *
 * `mkDefect` lo phần tính điểm (`sCounter` = 18 × magnitude, `sEat` = ×5); ở đây chỉ
 * thay lại hai chuỗi CHỮ, vì "bánh nguội ngắt" không phải thứ người ta nói về một ổ
 * còn nóng mà mềm oặt. Không đụng gì tới số.
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
 * (`generosityOf` mới là chỗ quyết có hào phóng hay không). Chỉ được gọi trên ổ KHÔNG
 * LỖI, và trên một ổ không lỗi thì mọi thứ dư ra đều nằm trong nhóm "dễ thương" của
 * `order.ts` — dư dưa leo là `WRONG_RATIO`, tức là đã rớt khỏi nhánh này từ trước.
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
