import type { Rng } from "../core/rng";
import type { NpcDef, Personality } from "../content/npcs";
import type { ArcDay } from "../content/arcs";
import type { BodyStyle } from "../art/character";
import { makeOrder, type OrderSpec } from "./order";
import { traitMulFrom, type Observation, type Observer, type Zone } from "./perception";
import { GazeMachine, WALKIN_GAZE, type GazeState } from "./gaze";
import { ReactionState } from "./reaction";
import { CALM_MOOD, type Mood } from "./mood";

/**
 * Một người khách trong một lượt ghé quán.
 *
 * CANON T3: **không hiện chỉ số quan hệ**. Ở đây không có thanh tình cảm, không có
 * `+3 trust`. Chỉ có mặt, lời, dáng, và hệ quả trễ. `mood` dưới đây là để CHỌN
 * biểu cảm và câu thoại, không bao giờ vẽ ra thành số.
 */

export type CustomerPhase =
  | "arriving"    // đang đi từ ngoài đường vào
  | "queueing"    // đứng chờ tới lượt
  | "ordering"    // vừa tới quầy, đang nói món
  | "waiting"     // đã gọi món, chờ bánh
  | "leaving";    // xong việc (được phục vụ, hoặc bỏ đi)

/**
 * `refused`  người chơi mời đi (P5-02 act REFUSE)
 * `insulted` bị nói nặng tới mức bỏ về — KHÔNG mua nữa, và không phải "chờ lâu quá"
 */
export type LeaveReason = "served" | "impatient" | "closed" | "soldout" | "refused" | "insulted";

/** P1-02 §2.7: sức chờ mặc định (giây thật tới mốc MADE_THEM_WAIT). */
export const DEFAULT_PATIENCE_SEC = 50;
/** Rời đi khi đã chờ quá 1,6 lần sức chờ. */
export const LEAVE_AT = 1.6;

/** P1-02 §2.8 — trà đá. */
export const TEA = {
  /** Đưa xong 0,6 s khách mới cúi uống. */
  sipDelay: 0.6,
  /** Ly thứ hai trong vòng 45 s chỉ được cái gật đầu — không cúi uống, không CARED_FOR_THEM. */
  cooldown: 45,
  /** CARED_FOR_THEM nhỏ dần: ly 1 / 2 / 3+ — đếm theo NGÀY, không theo lượt ghé. */
  diminish: [1.0, 0.6, 0.25] as const,
  /** Người soi ≥ 0,7 nhận tới ly thứ 3 là bắt bài chuyện mua chuộc. */
  suspectSoi: 0.7,
  suspectAtCup: 3,
  /** Người xuề xoà bắt bài trễ hơn — nhưng AI CŨNG bắt bài (xem `teaSuspectAtCup`). */
  suspectSpan: 4,
};

/**
 * Ly thứ mấy TRONG NGÀY thì người này bắt bài chuyện mua chuộc — CANON §8(i).
 *
 * Trước đây chỉ người soi ≥ 0,7 mới có trần; khách xuề xoà không có trần nào ngoài
 * 18 ly/ngày của cả quán, nên nhồi được cả chục ly cho một người, mỗi ly một mục trí
 * nhớ CARED_FOR_THEM — đúng lỗ hổng §8(i) cấm. Nay trần áp cho MỌI khách:
 *  · soi ≥ 0,7 → ly 3 (giữ nguyên con số cũ, không ai bị siết thêm)
 *  · soi 0,5   → ly 4 · soi 0,2 → ly 5 · soi 0 → ly 6
 * Trần đếm theo NGÀY (như FREE_EXTRA), không theo lượt ghé: ghé lần hai trong ngày
 * không làm bộ đếm về 0.
 */
export const teaSuspectAtCup = (soi: number) =>
  TEA.suspectAtCup + Math.round(Math.max(0, TEA.suspectSoi - soi) * TEA.suspectSpan);

/** Kịch bản một lượt ghé = ngày của arc + (khách đặc biệt) tên, tờ tiền đưa. */
export type VisitPlan = ArcDay & { key?: string; name?: string; style?: number; paysWith?: number };

export class Customer implements Observer {
  phase: CustomerPhase = "arriving";
  x: number;
  y: number;
  tx: number;
  ty: number;

  /** Chỗ trong hàng chờ; 0 là ngay trước mặt người bán. */
  slot = -1;
  zone: Zone = "SEATED_FAR";
  gaze = 0.45;
  /** Chỉ cho dev (`npc.gaze`): ép gaze cố định để tune §5. null = tự nhiên. */
  gazeOverride: number | null = null;
  /** Vật che riêng (vd. người đứng trước chắn tầm) — scene/service đặt mỗi frame. */
  occluder = 1;
  traitMul: number;
  /** traitMul gốc từ tính cách — `traitMul` = gốc × (1 + 0,35·độ bẩn quầy). */
  readonly baseTrait: number;
  observations = new Map<string, Observation>();
  readonly gazeM: GazeMachine;

  order: OrderSpec | null = null;
  /** Câu gọi món NGUYÊN VĂN — thứ duy nhất phiếu đơn được phép hiện (P1-03 §2.4.3). */
  orderLine = "";

  // ── chờ (kênh THỜI GIAN, P1-02 §2.7) ─────────────────────────────────────────
  /** Giây thật đã chờ. Pause / chế độ không giới hạn thời gian thì đứng yên. */
  waitSec = 0;
  /** Sức chờ: tới đây là MADE_THEM_WAIT (CONFIRMED). */
  readonly waitT: number;
  /** Đã qua mấy mốc: 1 = nhấp nhổm (0,6) · 2 = liếc đồng hồ + thở dài · 3 = CONFIRMED. */
  waitStage = 0;

  // ── trà đá ─────────────────────────────────────────────────────────────────
  /** Số ly đã nhận trong LƯỢT GHÉ này (chỉ để xem; trần và mức nhỏ dần đếm theo NGÀY). */
  teaCount = 0;
  private holdingTeaFor = 0;
  private sipIn = -1;
  private lastTeaAt = -Infinity;
  // "Bắt bài chuyện mua chuộc" KHÔNG sống ở đây: nó là chuyện người đó NHỚ, nên nằm
  // trong `NpcState` (Service.teaSuspect) và đi qua save — không phải thuộc tính của
  // một lượt ghé, nếu không thì ghé lại là quên sạch.

  // ── hỏi chuyện (ASK_QUESTION) ─────────────────────────────────────────────
  private questionPending = false;
  lastAskedAt = -Infinity;
  /** Có tiếng động lớn trong frame này (service đặt, tick tiêu). */
  loudCue = false;

  leaveReason: LeaveReason | null = null;
  /** Kênh 1 + 2 (mặt, dáng) — P2-02 §3. Renderer đọc, sim ghi. */
  readonly react = new ReactionState();
  /** Mood ngoài tầm kiểm soát của hôm nay (P2-02 §5.2) — KHÔNG phải `mood` chờ bên dưới. */
  dayMood: Mood = CALM_MOOD;
  /**
   * "Trả tiền rồi bỏ món" (P2-02 §3.4, chữ ký của chị Lan): trên đường về đi vòng qua
   * thùng rác đầu hẻm. `binAt` = lúc bỏ ổ bánh vô thùng (giây của khách), −1 = chưa.
   */
  binDetour = false;
  binAt = -1;
  /** Còn cầm ổ bánh trên tay không (lúc đi về). */
  carrying = false;
  /**
   * P2-04 §2.12 danh sách trắng #6: nghe đồn "ăn bớt", "bánh rớt"… thì NHÌN TAY kỹ hơn
   * (gaze nền +≤0,15). Không đụng traitMul — tin đồn không làm ai soi hơn, chỉ nhìn nhiều hơn.
   */
  gazeBias = 0;
  /** Người chơi nghiêng người nghe lỏm → khách trước quầy thấy mình lơ đễnh: gaze ×1,3 trong 5 s. */
  watchedIdleUntil = 0;
  /** Thấy người bán rửa tay ở vòi (P3-04 C1) — tới lúc này soi bớt đi một chút. */
  washRelief = 0;
  /** Trời + chỗ đứng (P3-01 weather.gazeMul · P3-05 avgGazeFactor) — nhân vào gaze nền. */
  gazeMul = 1;
  orderedAt = 0;
  /** P4 — kịch bản của lượt ghé này (arc P4-01 / sự kiện P4-03). null = lượt thường. */
  plan: VisitPlan | null = null;
  /** Mua thêm ổ nữa — gọi sau khi nhận ổ trước (cô Mai hai ổ, bà Bảy thứ Bảy…). */
  more: OrderSpec[] = [];
  /** Câu nói có hẹn giờ (giây của service) — ai nói (`by` = người khác trong hàng). */
  script: { at: number; text: string; by?: string }[] = [];
  /** Chỉ đi ngang (chú Kiệt gật đầu, bà Sáu rao): đứng lại `stay` giây ở chỗ dừng rồi đi. */
  pass: { stay: number; until: number; nod?: boolean } | null = null;
  /** Ngồi im trước khi gọi (anh Dũng ngày 11) — không tính vào thời gian chờ. */
  holdLeft = 0;
  /** Lời thoại đang hiện trên bong bóng, và còn hiện bao lâu. */
  say: string | null = null;
  sayFor = 0;
  private clock = 0;

  constructor(
    readonly id: string,
    /** Khoá tra sổ nhớ xuyên mùa — khách vãng lai dùng chung khoá theo kiểu người. */
    readonly memKey: string,
    readonly name: string,
    readonly personality: Personality,
    readonly body: BodyStyle,
    readonly npc: NpcDef | null,
    readonly usual: OrderSpec,
    readonly visitCount: number,
    spawn: { x: number; y: number },
    /** `patienceBaseSec` đã tính cả khung giờ vội. */
    patienceSec: number,
    private rng: Rng,
  ) {
    this.x = this.tx = spawn.x;
    this.y = this.ty = spawn.y;
    this.traitMul = this.baseTrait = traitMulFrom(personality.soi);
    this.waitT = patienceSec;
    this.gazeM = new GazeMachine(npc?.gaze ?? WALKIN_GAZE, id, rng);
  }

  rollOrder(canAskUsual: boolean) {
    this.order = makeOrder(this.rng, this.usual, canAskUsual);
  }

  speak(text: string, seconds = 3.2) {
    this.say = text;
    this.sayFor = seconds;
  }

  get speaking() { return this.say !== null; }

  /**
   * `pressure` = false khi bật chế độ không giới hạn thời gian (CANON §15.2):
   * khách vẫn bỏ đi vì bạn làm SAI, nhưng không bao giờ vì bạn CHẬM.
   */
  tick(dt: number, pressure: boolean) {
    this.clock += dt;
    this.react.tick(this.clock);
    if (this.sayFor > 0) {
      this.sayFor -= dt;
      if (this.sayFor <= 0) this.say = null;
    }
    if (this.holdingTeaFor > 0) this.holdingTeaFor -= dt;
    if (this.sipIn >= 0) {
      this.sipIn -= dt;
      if (this.sipIn < 0) this.gazeM.force("DRINKING");
    }

    if (pressure && this.holdLeft <= 0 && (this.phase === "queueing" || this.phase === "waiting")) this.waitSec += dt;

    this.gazeM.tick(dt, {
      loudCue: this.loudCue, question: this.questionPending,
      waitRatio: this.waitRatio, hasCompanion: false, raining: false,
    });
    this.loudCue = false;
    this.questionPending = false;
    this.gaze = this.gazeOverride ?? Math.min(1, (this.gazeM.factor + (this.gazeM.hard ? 0 : this.gazeBias)) * this.gazeMul);
    if (this.gazeOverride === null && this.clock < this.watchedIdleUntil) this.gaze = Math.min(1, this.gaze * 1.3);
  }

  get gazeState(): GazeState { return this.gazeM.state; }
  get sipping() { return this.gazeM.state === "DRINKING"; }
  get onPhone() { return this.gazeM.state === "PHONE"; }
  get holdingTea() { return this.holdingTeaFor > 0; }

  get waitRatio() { return this.waitSec / this.waitT; }

  /** Còn trong 45 s kể từ ly trước? */
  get teaOnCooldown() { return this.clock - this.lastTeaAt < TEA.cooldown; }

  /**
   * Nhận ly trà. `cupNo` = ly thứ mấy TRONG NGÀY của người này (Service đếm — mức nhỏ
   * dần là chuyện của cả ngày, không phải của một lượt ghé: §8i).
   * Trả hệ số CARED_FOR_THEM (0 = chỉ gật đầu). Cửa sổ hạ gaze chỉ có khi ngoài
   * cooldown — cửa sổ attention phải ngắn và KHÔNG farm được (§8a).
   */
  takeTea(cupNo: number): number {
    const onCd = this.teaOnCooldown;
    this.teaCount++;
    this.holdingTeaFor = 7;
    if (onCd) return 0;
    this.lastTeaAt = this.clock;
    this.sipIn = TEA.sipDelay;
    return TEA.diminish[Math.min(Math.max(1, cupNo) - 1, TEA.diminish.length - 1)];
  }

  /** Người chơi hỏi chuyện → nhìn mặt người chơi thay vì nhìn tay (P1-02 §2.8). */
  ask() {
    this.lastAskedAt = this.clock;
    this.questionPending = true;
  }

  get now() { return this.clock; }

  /** Ba nấc biểu cảm — CANON T3: đọc qua dáng và mặt, không qua thanh số. */
  get mood(): "calm" | "checking" | "annoyed" {
    const r = this.waitRatio;
    if (r < 0.6) return "calm";
    if (r < 1) return "checking";
    return "annoyed";
  }
}
