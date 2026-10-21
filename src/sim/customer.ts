import type { Rng } from "../core/rng";
import type { NpcDef, Personality } from "../content/npcs";
import type { BodyStyle } from "../art/character";
import { randomOrder, type OrderSpec } from "./order";
import { traitMulFrom, type Observation, type Observer, type Zone } from "./perception";
import { GazeMachine, WALKIN_GAZE, type GazeState } from "./gaze";
import { ReactionState } from "./reaction";
import { CALM_MOOD, type Mood } from "./mood";
import { newDrives, type DriveLevels } from "./drives";

export type CustomerPhase =
  | "arriving"
  | "queueing"
  | "ordering"
  | "waiting"
  | "leaving";

/** `insulted` = bị nói nặng; `balked` = ngó hàng dài nên không vào; `soiled` = thấy ổ rớt rồi vẫn được đưa. */
export type LeaveReason =
  | "served" | "impatient" | "closed" | "soldout" | "refused" | "insulted" | "balked" | "soiled";

export const DEFAULT_PATIENCE_SEC = 50;
export const LEAVE_AT = 1.6;

/** Cộng thẳng chứ không nhân, nên người ít kiên nhẫn được đỡ nhiều hơn theo tỉ lệ. */
export const PATIENCE_BONUS_SEC = 6;

/** Một ly trà cộng vào sức chờ `waitT`, không trừ quãng đã chờ như `soothe`. */
export const TEA_PATIENCE_SEC = 20;

export const TEA = {
  sipDelay: 0.6,
  cooldown: 45,
  diminish: [1.0, 0.6, 0.25] as const,
  suspectSoi: 0.7,
  suspectAtCup: 3,
  suspectSpan: 4,
};

/** Đếm theo ngày: soi ≥ 0,7 bắt bài ở ly 3, xuề xoà nhất tới ly 6. */
export const teaSuspectAtCup = (soi: number) =>
  TEA.suspectAtCup + Math.round(Math.max(0, TEA.suspectSoi - soi) * TEA.suspectSpan);

/** Khác 0 để cái ghế không thành nút tắt kiên nhẫn; thẻ `GHE_BAN` hứa "chậm 45%". */
export const SIT_PATIENCE_MUL = 0.55;

export class Customer implements Observer {
  phase: CustomerPhase = "arriving";
  x: number;
  y: number;
  tx: number;
  ty: number;

  slot = -1;
  zone: Zone = "SEATED_FAR";
  gaze = 0.45;
  gazeOverride: number | null = null;
  occluder = 1;
  traitMul: number;
  readonly baseTrait: number;
  observations = new Map<string, Observation>();
  readonly gazeM: GazeMachine;

  order: OrderSpec | null = null;
  orderLine = "";

  waitSec = 0;
  /** Ly trà nới ra (`waitMore`); mốc bỏ đi là `waitT · LEAVE_AT`. */
  waitT: number;
  waitStage = 0;

  teaCount = 0;
  private holdingTeaFor = 0;
  private sipIn = -1;
  private lastTeaAt = -Infinity;

  private questionPending = false;
  lastAskedAt = -Infinity;
  loudCue = false;

  leaveReason: LeaveReason | null = null;
  readonly react = new ReactionState();
  /** Mood ngoài tầm kiểm soát của hôm nay, khác `mood` chờ bên dưới. */
  dayMood: Mood = CALM_MOOD;
  /** Trên đường về đi vòng qua thùng rác đầu hẻm rồi mới ra cổng. */
  binDetour = false;
  binAt = -1;
  carrying = false;
  washRelief = 0;
  gazeMul = 1;
  orderedAt = 0;
  /** `spot`/`exit` vắng thì về mặc định. */
  pass: {
    stay: number; until: number; nod?: boolean;
    spot?: { x: number; y: number }; exit?: { x: number; y: number }; speed?: number;
  } | null = null;
  /** Cờ duy nhất phân biệt với người đi ngang có kịch bản — hai thứ dùng chung `pass`. */
  ambient = false;
  /** Chỉ bật ở `phase === "arriving"` và không bao giờ bật lại. */
  balking = false;
  inviteRefused = false;
  /** Bật cả lúc trượt roll, không thì bị xét lại mỗi frame. */
  greeted = false;
  greetUntil = 0;
  cutLine = false;
  /** Không dùng được thứ tự mảng `customers` vì `stepAside` splice trong chính mảng đó. */
  arrivedSeq = 0;
  /** Người nép không được cấp chỗ (`assignSlots` bỏ qua) nên cả hàng sau dồn lên thật. */
  aside = false;
  asideFor: string | null = null;
  asideAt = 0;
  inShade = false;
  shadeUntil = 0;
  sitting = false;
  sitUntil = 0;
  filming = false;
  filmUntil = 0;
  filmSpoiled = false;
  /** Đứng chắn chỗ đưa hàng lúc chưa tới lượt — khác `cutLine` và `aside`. */
  blocking = false;
  eating = false;
  eatUntil = 0;
  lookInsideUntil = 0;
  /** Chỉ dùng để chọn chuyện để nói, không bao giờ để chọn chỗ để đi. */
  drives: DriveLevels = newDrives();
  driveBase: DriveLevels = newDrives();
  /** Nhớ trong lượt ghé này, vì kho thoại rút lại được trong cùng một lượt. */
  visit = {
    gaveTea: false,
    gaveFood: false,
    apologised: false,
    promised: [] as string[],
  };
  purpose: { id: string; hurry: number; inviteMul: number } | null = null;
  purposeState: { id: string; patienceMul: number; angerMul: number; inviteMul: number } | null = null;
  purposeLabel = "";
  /** −1 = chưa tới chỗ ngó. */
  balkAt = -1;
  say: string | null = null;
  sayFor = 0;
  /** `Infinity` = chưa nói câu nào; dùng để chừa một hơi thở giữa hai câu của cùng một người. */
  sayQuietFor = Infinity;
  /** Mặc định 100 cố ý: gọi thẳng `speak()` là câu kịch bản, không bị cắt ngang. */
  sayPri = 100;
  sayLife = 0;
  get saidFor() { return this.sayLife - this.sayFor; }
  private clock = 0;

  constructor(
    readonly id: string,
    /** Khách vãng lai dùng chung khoá theo kiểu người. */
    readonly memKey: string,
    readonly name: string,
    readonly personality: Personality,
    readonly body: BodyStyle,
    readonly npc: NpcDef | null,
    readonly visitCount: number,
    spawn: { x: number; y: number },
    patienceSec: number,
    private rng: Rng,
  ) {
    this.x = this.tx = spawn.x;
    this.y = this.ty = spawn.y;
    this.traitMul = this.baseTrait = traitMulFrom(personality.soi);
    this.waitT = patienceSec;
    this.gazeM = new GazeMachine(npc?.gaze ?? WALKIN_GAZE, id, rng);
  }

  rollOrder(day?: number) {
    this.order = randomOrder(this.rng, day);
  }

  speak(text: string, seconds = 3.2, pri = 100) {
    this.say = text;
    this.sayFor = seconds;
    this.sayLife = seconds;
    this.sayPri = pri;
    this.sayQuietFor = 0;
  }

  get speaking() { return this.say !== null; }

  /** `pressure` = false: khách vẫn bỏ đi vì làm sai, nhưng không bao giờ vì chậm. */
  tick(dt: number, pressure: boolean) {
    this.clock += dt;
    this.react.tick(this.clock);
    if (this.sayFor > 0) {
      this.sayFor -= dt;
      if (this.sayFor <= 0) { this.say = null; this.sayQuietFor = 0; }
    } else if (this.say === null) this.sayQuietFor += dt;
    if (this.holdingTeaFor > 0) this.holdingTeaFor -= dt;
    if (this.sipIn >= 0) {
      this.sipIn -= dt;
      if (this.sipIn < 0) this.gazeM.force("DRINKING");
    }

    if (pressure && (this.phase === "queueing" || this.phase === "waiting")) {
      this.waitSec += dt * (this.sitting ? SIT_PATIENCE_MUL : 1);
    }

    this.gazeM.tick(dt, {
      loudCue: this.loudCue, question: this.questionPending,
      waitRatio: this.waitRatio, hasCompanion: false, raining: false,
    });
    this.loudCue = false;
    this.questionPending = false;
    this.gaze = this.gazeOverride ?? Math.min(1, this.gazeM.factor * this.gazeMul);
  }

  get gazeState(): GazeState { return this.gazeM.state; }
  get sipping() { return this.gazeM.state === "DRINKING"; }
  get onPhone() { return this.gazeM.state === "PHONE"; }
  get holdingTea() { return this.holdingTeaFor > 0; }

  get waitRatio() { return this.waitSec / this.waitT; }

  /** Đo theo mốc bỏ đi (`LEAVE_AT`), khác `waitRatio` đo theo mốc r = 1. */
  get patienceLeft() {
    return Math.max(0, Math.min(1, 1 - this.waitRatio / LEAVE_AT));
  }

  /** `amount` 0..100 = lấy lại ngần ấy % quãng đã chờ, không phải % tổng sức chờ. */
  soothe(amount: number) {
    this.waitSec = Math.max(0, this.waitSec - this.waitSec * (Math.min(100, amount) / 100));
  }

  waitMore(sec: number) {
    this.waitT += sec;
  }

  get teaOnCooldown() { return this.clock - this.lastTeaAt < TEA.cooldown; }

  /** `cupNo` = ly thứ mấy trong ngày; trả hệ số CARED_FOR_THEM (0 khi còn cooldown). */
  takeTea(cupNo: number): number {
    const onCd = this.teaOnCooldown;
    this.teaCount++;
    this.holdingTeaFor = 7;
    // Sức chờ cộng trước cổng cooldown: chỉ CARED_FOR_THEM mới có cooldown.
    this.waitMore(TEA_PATIENCE_SEC);
    if (onCd) return 0;
    this.lastTeaAt = this.clock;
    this.sipIn = TEA.sipDelay;
    return TEA.diminish[Math.min(Math.max(1, cupNo) - 1, TEA.diminish.length - 1)];
  }

  ask() {
    this.lastAskedAt = this.clock;
    this.questionPending = true;
  }

  get now() { return this.clock; }

  get mood(): "calm" | "checking" | "annoyed" {
    const r = this.waitRatio;
    if (r < 0.6) return "calm";
    if (r < 1) return "checking";
    return "annoyed";
  }
}
