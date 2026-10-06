import type { Rng } from "../core/rng";
import type { NpcDef, Personality } from "../content/npcs";
import type { ArcDay } from "../content/arcs";
import type { BodyStyle } from "../art/character";
import { makeOrder, type OrderSpec } from "./order";
import { traitMulFrom, type Observation, type Observer, type Zone } from "./perception";
import { GazeMachine, WALKIN_GAZE, type GazeState } from "./gaze";
import { ReactionState } from "./reaction";
import { CALM_MOOD, type Mood } from "./mood";
import { newDrives, type DriveLevels } from "./drives";

/** ⚠️ CANON T3: không thanh tình cảm, không `+3 trust` — chỉ có mặt, lời, dáng, và hệ quả trễ. */

export type CustomerPhase =
  | "arriving"
  | "queueing"
  | "ordering"
  | "waiting"
  | "leaving";

/** `insulted` = bị nói nặng tới mức bỏ về, KHÔNG phải "chờ lâu quá" · `balked` = ngó thấy hàng dài nên không vào · `soiled` = thấy ổ rớt rồi vẫn được đưa. */
export type LeaveReason =
  | "served" | "impatient" | "closed" | "soldout" | "refused" | "insulted" | "balked" | "soiled";

export const DEFAULT_PATIENCE_SEC = 50;
export const LEAVE_AT = 1.6;

/** Cộng THẲNG chứ không nhân: 6 s là 6 s với tất cả, nên người ít kiên nhẫn được đỡ nhiều hơn theo tỉ lệ. */
export const PATIENCE_BONUS_SEC = 6;

/**
 * RÓT MỘT LY LÀ MUA THÊM 20 GIÂY. Chủ dự án: *"Rót nước trà sẽ tăng hảo cảm + tăng thời gian chờ.
 * Thời gian chờ nên tăng lên tầm 20 giây."*
 *
 * Cộng vào `waitT` (sức chờ) chứ không trừ `waitSec` (quãng đã chờ) như `soothe`: dỗ một câu thì
 * xoá bớt chuyện đã qua, còn đưa ly nước trà thì người ta chịu đứng thêm — hai việc khác nhau, và
 * cái sau là thứ người chơi bỏ 210 nghìn ra mua. Cộng THẲNG 20 s nên người ít kiên nhẫn được đỡ
 * nhiều hơn theo tỉ lệ, y như `PATIENCE_BONUS_SEC`.
 */
export const TEA_PATIENCE_SEC = 20;

export const TEA = {
  sipDelay: 0.6,
  cooldown: 45,
  diminish: [1.0, 0.6, 0.25] as const,
  suspectSoi: 0.7,
  suspectAtCup: 3,
  suspectSpan: 4,
};

/** Trần áp cho MỌI khách, không riêng người soi: soi ≥ 0,7 bắt bài ở ly 3, xuề xoà nhất cũng tới ly 6. Đếm theo NGÀY. */
export const teaSuspectAtCup = (soi: number) =>
  TEA.suspectAtCup + Math.round(Math.max(0, TEA.suspectSoi - soi) * TEA.suspectSpan);

export type VisitPlan = ArcDay & { key?: string; name?: string; style?: number; paysWith?: number };

/**
 * 0,55 chứ không 0 — ngồi lâu vẫn sốt ruột; cái ghế không được thành một nút tắt kiên nhẫn.
 * Xuất ra vì thẻ `GHE_BAN` hứa "kiên nhẫn trôi chậm 45%" và `tests/p3-equipment.test.ts` (TB-5)
 * đối chiếu chữ với số.
 */
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

  // ── chờ (kênh THỜI GIAN, P1-02 §2.7) ─────────────────────────────────────────
  waitSec = 0;
  /** KHÔNG `readonly` nữa: ly nước trà nới sức chờ ra (`waitMore`). Mốc bỏ đi vẫn là `waitT · LEAVE_AT`. */
  waitT: number;
  waitStage = 0;

  // ── trà đá ─────────────────────────────────────────────────────────────────
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
  loudCue = false;

  leaveReason: LeaveReason | null = null;
  /** Renderer đọc, sim ghi. */
  readonly react = new ReactionState();
  /** Mood ngoài tầm kiểm soát của hôm nay (P2-02 §5.2) — KHÔNG phải `mood` chờ bên dưới. */
  dayMood: Mood = CALM_MOOD;
  /** Chữ ký của chị Lan: trên đường về đi vòng qua thùng rác đầu hẻm rồi mới ra cổng. */
  binDetour = false;
  binAt = -1;
  carrying = false;
  /** Nghe đồn "ăn bớt" / "bánh rớt" thì NHÌN TAY kỹ hơn — gaze nền cộng thêm ngần này. */
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
  /** Gọi sau khi đã nhận ổ trước — một người, từng ổ một. */
  more: OrderSpec[] = [];
  /** Câu nói có hẹn giờ (giây của service) — ai nói (`by` = người khác trong hàng). */
  script: { at: number; text: string; by?: string }[] = [];
  /** Đứng lại `stay` giây ở chỗ dừng rồi đi. `spot`/`exit` vắng thì về mặc định; người qua đường khai cả hai vì họ đi XUYÊN cái hẻm. */
  pass: {
    stay: number; until: number; nod?: boolean;
    spot?: { x: number; y: number }; exit?: { x: number; y: number }; speed?: number;
  } | null = null;
  /** ⚠️ Cờ DUY NHẤT phân biệt họ với người đi ngang CÓ KỊCH BẢN — hai thứ dùng chung đường đi `pass`. */
  ambient = false;
  /**
   * Quyết LÚC VỪA TỚI đầu hẻm, trước khi chờ một giây nào. ⚠️ Chỉ bật ở `phase === "arriving"` và
   * không bao giờ bật lại: `queuePatienceMul` ngược chiều với nó, và hợp đồng đó có test riêng.
   */
  balking = false;
  /** Roll của `inviteChance` vốn đã tất định nên mời lại cũng ra chữ "thôi" đó — nhưng nó chặn KẾT QUẢ, không chặn CƠ HỘI. */
  inviteRefused = false;
  /** Kể cả lúc trượt roll — không có cờ này thì hai người đi ngược chiều bị xét lại mỗi frame. */
  greeted = false;
  /** Đang chậm chân vì chào người đi ngược chiều — `step()` trả tốc độ về sau mốc này. */
  greetUntil = 0;
  /** `Service.tickWorldFacts` gán. Không có cờ này thì thoại buộc tội người ta chen hàng trong khi họ xếp đàng hoàng. */
  cutLine = false;
  /** ⚠️ Không dùng được thứ tự mảng `customers`: `stepAside` splice người ta đi chỗ khác trong chính mảng đó. */
  arrivedSeq = 0;
  /**
   * ⚠️ Chuyện VỊ TRÍ, không phải thứ tự: người nép không được cấp chỗ nào (`assignSlots` bỏ qua),
   * nên cả hàng sau lưng dồn lên một bậc THẬT. Chỉ đảo thứ tự mảng thì không ai dạt ra cả.
   */
  aside = false;
  asideFor: string | null = null;
  asideAt = 0;
  inShade = false;
  shadeUntil = 0;
  /** Khác `inShade` ở hệ quả: ngồi làm kiên nhẫn trôi CHẬM (`SIT_PATIENCE_MUL`) — đó là lý do mua cái ghế. */
  sitting = false;
  sitUntil = 0;
  /** Clip ra sao phụ thuộc quầy sạch hay dơ trong lúc máy chạy — `filmSpoiled` chấm liên tục. */
  filming = false;
  filmUntil = 0;
  filmSpoiled = false;
  /**
   * ĐỨNG CHẮN ngay chỗ đưa hàng. Khác `cutLine` (sai thứ tự) và khác `aside` (đã dạt rồi): đây
   * là chuyện CHỖ ĐỨNG trong lúc chưa tới lượt. Không có cờ này thì câu "xích qua chút giùm"
   * nói bừa.
   */
  blocking = false;
  /** Đang ăn — chặn mời ăn lần nữa, và đổi câu chào. Hết `eatUntil` thì thôi. */
  eating = false;
  eatUntil = 0;
  /** Đang quay nhìn vào quầy vì MỘT CÂU NÓI (`LOOK_INSIDE`), tới thời điểm này. */
  lookInsideUntil = 0;
  /**
   * TRONG LƯỢT GHÉ NÀY — tầng `v.*`, nằm giữa "trong cuộc" (`TalkSession`) và "cả mùa"
   * (`RelState`).
   *
   * Cần một tầng riêng vì kho dùng chung rút lại được trong CÙNG một lượt ghé (`eligible()` chỉ
   * chặn theo chủ đề trong ngày), nên mời ăn hai lần với cùng một người là chuyện xảy ra được.
   * Sống đúng bằng vòng đời `Customer`.
   */
  /**
   * LÚC NÀY NGƯỜI NÀY MUỐN MỘT CUỘC TRAO ĐỔI KIỂU GÌ.
   *
   * ⚠️ KHÔNG phải "nhu cầu sống" kiểu The Sims — CANON §16 Đừng-1 cấm mô phỏng đời sống NPC
   * ngoài quầy: sáu con số này chỉ được dùng để chọn CHUYỆN ĐỂ NÓI, không bao giờ để chọn CHỖ ĐỂ
   * ĐI. Lịch sinh hoạt vẫn là của P2-03 §2.9.
   */
  drives: DriveLevels = newDrives();
  driveBase: DriveLevels = newDrives();
  visit = {
    gaveTea: false,
    gaveFood: false,
    apologised: false,
    /** `DeedId` đang hứa dở trong lượt này. */
    promised: [] as string[],
  };
  /**
   * HÔM NAY NGƯỜI NÀY ĐI ĐÂU, VÀ ĐANG THẤY THẾ NÀO. Có mục đích thì mới trả lời được câu "mời họ
   * có vô lý không", và mục đích quyết cả việc họ dễ cười hay dễ cáu.
   */
  purpose: { id: string; hurry: number; inviteMul: number } | null = null;
  purposeState: { id: string; patienceMul: number; angerMul: number; inviteMul: number } | null = null;
  /** Một dòng tiếng Việt mô tả họ hôm nay — nhật ký dev và overlay đọc. */
  purposeLabel = "";
  /** Lúc dừng lại ngó cái hàng (giây của khách), trước khi quay lưng. −1 = chưa tới chỗ ngó. */
  balkAt = -1;
  /** Ngồi im trước khi gọi (anh Dũng ngày 11) — không tính vào thời gian chờ. */
  holdLeft = 0;
  /** Lời thoại đang hiện trên bong bóng, và còn hiện bao lâu. */
  say: string | null = null;
  sayFor = 0;
  /**
   * Giây đã trôi kể từ lúc bong bóng câu trước TẮT; `Infinity` = chưa nói câu nào.
   * `Service.tickDialog` đọc nó để chừa một hơi thở giữa hai câu của CÙNG một người — dán sát
   * nhau thì mắt đọc ra là một bong bóng ĐỔI CHỮ.
   */
  sayQuietFor = Infinity;
  /**
   * Ưu tiên và tổng tuổi thọ của câu ĐANG hiện — `Service.speechBlocked` đọc để quyết câu nào
   * được cắt ngang câu nào.
   *
   * Mặc định 100 (không ai cắt được) là CỐ Ý: ai gọi thẳng `speak()` thay vì đi qua hàng đợi thì
   * đang nói một câu của kịch bản, và kịch bản không bị một lời cằn nhằn nào chen ngang.
   */
  sayPri = 100;
  sayLife = 0;
  /** Câu đang hiện đã nằm trên màn hình bao nhiêu giây. */
  get saidFor() { return this.sayLife - this.sayFor; }
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

  speak(text: string, seconds = 3.2, pri = 100) {
    this.say = text;
    this.sayFor = seconds;
    this.sayLife = seconds;
    this.sayPri = pri;
    this.sayQuietFor = 0;
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
      if (this.sayFor <= 0) { this.say = null; this.sayQuietFor = 0; }
    } else if (this.say === null) this.sayQuietFor += dt;
    if (this.holdingTeaFor > 0) this.holdingTeaFor -= dt;
    if (this.sipIn >= 0) {
      this.sipIn -= dt;
      if (this.sipIn < 0) this.gazeM.force("DRINKING");
    }

    /*
     * NGỒI THÌ CHỜ ĐƯỢC LÂU HƠN — `SIT_PATIENCE_MUL`. Không đóng băng hẳn (cái ghế không được
     * thành một nút tắt kiên nhẫn), nhưng phải ĐO ĐƯỢC, nếu không thì 320 nghìn tiền ghế mua về
     * một hình vẽ.
     */
    if (pressure && this.holdLeft <= 0 && (this.phase === "queueing" || this.phase === "waiting")) {
      this.waitSec += dt * (this.sitting ? SIT_PATIENCE_MUL : 1);
    }

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

  /**
   * Còn lại bao nhiêu phần kiên nhẫn, 1 → 0. Hết là bỏ về (`LEAVE_AT`).
   *
   * ⚠️ Khác `waitRatio` ở MẪU SỐ: `waitRatio` đo theo mốc MADE_THEM_WAIT (r = 1), còn cái này đo
   * theo mốc BỎ ĐI (r = 1,6). Vẽ thanh theo `waitRatio` thì thanh cạn sạch trong khi người ta
   * còn đứng đó thêm 60% nữa.
   */
  get patienceLeft() {
    return Math.max(0, Math.min(1, 1 - this.waitRatio / LEAVE_AT));
  }

  /**
   * Nói được một câu làm người ta dịu lại — P5-05. `amount` 0..100 = lấy lại ngần ấy %
   * quãng ĐÃ chờ, chứ không phải % tổng sức chờ: dỗ một người vừa mới tới thì gần như
   * không có tác dụng gì, dỗ người đã đứng lâu mới đáng kể. Không bao giờ về dưới 0.
   */
  soothe(amount: number) {
    this.waitSec = Math.max(0, this.waitSec - this.waitSec * (Math.min(100, amount) / 100));
  }

  /** Nới SỨC CHỜ thêm `sec` giây — ly nước trà. Khác `soothe` (xoá quãng đã chờ), xem `TEA_PATIENCE_SEC`. */
  waitMore(sec: number) {
    this.waitT += sec;
  }

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
    /*
     * 20 GIÂY TRẢ Ở ĐÂY, TRƯỚC CỔNG COOLDOWN. Hảo cảm (`CARED_FOR_THEM`) thì có nhỏ dần và có
     * cooldown — vì đó là tình cảm, mà tình cảm không farm được. Thời gian chờ thì KHÔNG: ly nước
     * trà thứ hai vẫn là một ly nước trà, và người đứng nắng vẫn chịu đứng thêm vì nó. Trần chống
     * lạm dụng đã có ở chỗ khác và đủ chặt: còn cầm ly thì không nhận ly nữa, và `teaSuspectAtCup`
     * cho người soi bắt bài ở ly thứ ba.
     */
    this.waitMore(TEA_PATIENCE_SEC);
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
