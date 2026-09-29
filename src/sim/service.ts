import { Rng, type RngHub, type BagState } from "../core/rng";
import { Barks } from "../content/lines";
import { Query } from "../dialog/facts";
import { Speaker, type DialogState } from "../dialog/speaker";
import type { Rule } from "../dialog/ruledb";
import { NPCS, WALKIN_NAMES, WALKIN_STYLES, type NpcDef } from "../content/npcs";
import { DAY_END_MIN, DAY_START_MIN, PEAK_END_MIN, PEAK_START_MIN, fmtHhmm } from "../core/clock";
import type { Bus } from "../core/eventbus";
import type { CustomerSlot, LeaveReason as BusLeaveReason, RelTier, StimId } from "../core/types";
import { newNpcState, type NpcState } from "../core/save";
import { orderDefectKey } from "../core/stimid";
import { Customer, DEFAULT_PATIENCE_SEC, LEAVE_AT, TEA, type LeaveReason } from "./customer";
import {
  diffDish, generosityOf, makeUsual, mkDefect, sameOrder, sayOrder,
  type Defect, type Ingredient, type OrderSpec,
} from "./order";
import {
  MAX_LIVE_STIMULI, SALIENCE, STIM_SPEC, observe, peakOfKey, rank, stateOf,
  type ActiveStim, type ObsState, type Occluder, type Zone,
} from "./perception";
import { CUSTOMER_GATE, QUEUE_SLOTS, STREET_BIN, hitsWall } from "../world/map";
import { rollVisit } from "./schedule";
import { SILENT_ABSENCE, record, servedWell, visitProbabilityMul, type BaseKind, type Memory } from "./memory";
import { CLAIM, activeHeard, disprove, nameOf, poolOf, witness, type GossipState } from "./gossip";
import { beginDay, displayName, logNote, logOrder, nameCheck, type Notebook } from "./notebook";
import { moodBaseFace, moodPatienceMul, moodTipMul, rollMood } from "./mood";
import { faceHoldSec, isSilentGrudge, reactionDelay } from "./personality";
import { GROUP_OF, faceFor, poseFor, type Intensity, type PoseId } from "./reaction";
import { CRUST } from "./oven";
import { satisfaction, servedVector, tasteOf } from "./taste";

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
const WALK_SPEED = 2.2;

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
const BARK_DELAY_MIN = 0.2;
const BARK_DELAY_SPAN = 0.2;
/** Chuỗi `followup` quá 6 giây không nói được thì bỏ (P2-01 §2.7 — thế giới đã đổi). */
const FOLLOWUP_EXPIRE_SEC = 6;
/** Khách chờ bánh được ngần này giây mà quầy yên thì có thể buông một câu chuyện phiếm. */
const SMALLTALK_AFTER_SEC = 4;
/** Hỏi chuyện: 60 s mỗi người mới hỏi lại được (P1-02 §2.8). */
export const ASK_COOLDOWN = 60;

/** P1-04 §2.9: bong bóng sống `clamp(1600 + 45·số ký tự, 1600, 4500)` ms. */
export const bubbleLife = (text: string) => Math.min(4.5, Math.max(1.6, 1.6 + 0.045 * text.length));

export type ServiceEvent =
  | { kind: "log"; text: string }
  | { kind: "paid"; amount: number; item: "dish"; tip: number }
  | { kind: "cost"; amount: number; item: "tea" };

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
};

type Visit = { at: number; npc: NpcDef | null; seq: number };
type Pending = {
  c: Customer; text: string; tier: 1 | 2 | 3; delay: number; log: boolean
  /** Độ ưu tiên (salience) — câu gọi món và câu phản ứng nặng được nói trước. */
  pri: number; waited: number;
  /** Rule sinh ra câu này — ghi nhận đã-nói + applycontext + followup LÚC NÓI, không lúc chọn. */
  rule?: Rule;
};
type Followup = { c: Customer; concept: string; at: number };

/** Mỗi lượt hỏi rule DB kèm các fact Session của tình huống (P2-01 §2.3.1). */
type Extra = Record<string, string | number | boolean>;

const LEAVE_REASON: Record<LeaveReason, BusLeaveReason> = {
  served: "SERVED", impatient: "IMPATIENT", closed: "CLOSED",
};

/** Sự kiện được phản ứng bằng lời NGAY khi khách NOTICED (P1-02 §2.9). */
const NOTICE_SPOKEN: ReadonlySet<StimId> = new Set<StimId>(["DROPPED_FOOD", "BURNT_OR_COLD", "DIRTY_HANDS", "WRONG_NAME", "FLOURISH"]);

const TIP_RATE: Record<RelTier, number> = { RIVAL: 0, ACQUAINTANCE: 0.045, FRIEND: 0.11 };
/** REMEMBERED_USUAL tầng T-A (khách nói "như mọi bữa" rồi làm đúng) = 70; T-B (tự làm trước) = 90. */
const REMEMBERED_USUAL_TA = 70;
const FREE_EXTRA_BASE = 25;
const FREE_EXTRA_DIMINISH = [1.0, 0.6, 0.25];
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

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
  private devSeq = 0;
  /** Ly trà còn lại hôm nay. */
  teaLeft = TEA_PER_DAY;
  /** Độ bẩn quầy 0..1 (P1-02 §2.10) — scene đặt mỗi frame. */
  dirt = 0;
  /** Tay người chơi vừa cầm tiền, chưa rửa — scene đặt mỗi frame (fact `playerHandsDirty`). */
  handsDirty = false;
  private dirtRemarked = false;

  servedCount = 0;
  lostCount = 0;
  /** Câu thoại tới hạn nhưng phải hoãn sang frame sau vì trần 1 câu/frame hoặc 2 bong bóng. */
  dialogDeferred = 0;

  readonly out: ServiceEvent[] = [];

  constructor(private deps: ServiceDeps) {
    this.dialogRng = deps.hub.stream("dialog-shufflebag");
    this.barks = new Barks(this.dialogRng, deps.bags, deps.day);
    this.speaker = new Speaker(this.dialogRng, deps.bags, deps.day, deps.dialog, 0);
    this.buildSchedule();
    const cut = deps.resumeAt ?? -1;
    this.schedule = this.schedule.filter((v) => v.at > cut);

    // Tầng nhận thấy NGHE bus — không ai gọi thẳng vào nó (P0-01 §2.5 nguyên tắc 3).
    if (deps.notebook) beginDay(deps.notebook, deps.day);
    this.offStim = deps.bus.on("stim:emitted", (s) => {
      if (s.stimId === "DROPPED_FOOD" && this.deps.notebook) this.deps.notebook.today.dropped++;
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
    for (const npc of NPCS) {
      const m = this.mem(npc.id);
      // trí nhớ → lịch (P2-03 §2.10): người đang giận ghé thưa hơn, người thân ghé đều hơn
      const t = rollVisit(npc.schedule, this.deps.day, rng, visitProbabilityMul(m) * this.rumourMul(npc.id, 0.9, 1.1));
      if (t === null || m.gone) continue;
      // Có lịch hôm nay = một lần ghé mà người chơi có thể LỠ (decay chỉ đếm lần lỡ, không đếm ngày)
      m.expectedDay = this.deps.day;
      // Người im lặng đang "vắng n ngày" (P2-02 §4.6): chỗ 7h35 trống — và vẫn tính là lỡ
      if (m.absentUntil >= this.deps.day) continue;
      list.push({ at: Math.max(DAY_START_MIN + 2, Math.min(DAY_END_MIN - 12, t)), npc });
    }
    // khách vãng lai: dày ở giờ cao điểm 6h30–8h (CANON §13.3); ~1/3 nhịp bỏ trống vì
    // người có tên giờ đã tự tới theo lịch (trước P2-02 nhịp này rút ngẫu nhiên người có tên)
    let t = DAY_START_MIN + 8;
    while (t < DAY_END_MIN - 10) {
      const peak = t >= PEAK_START_MIN && t < PEAK_END_MIN;
      t += peak ? 9 + rng.next() * 9 : 20 + rng.next() * 22;
      if (t >= DAY_END_MIN - 10) break;
      if (rng.next() < 0.35) continue;
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

  /** Đơn ruột KHÔNG vào save — nó suy ra từ seed của mùa + id, bất biến 40 ngày. */
  private usualOf(id: string): OrderSpec {
    let u = this.usual.get(id);
    if (!u) this.usual.set(id, (u = makeUsual(Rng.forSeason(this.deps.saveId, id))));
    return u;
  }

  /**
   * "Như mọi bữa" chỉ được nói khi: là NPC có tên, VÀ người chơi đã NGHE họ đọc nguyên
   * đơn ít nhất hai lần. (Bổ sung của bản dựng — dạy trước rồi mới kiểm, giữ T3.)
   */
  private canAskUsual(npc: NpcDef | null, m: NpcState) {
    return npc !== null && m.heard >= 2;
  }

  /** Sức chờ T — P1-02 §2.7: base × (vội ? 0,65 : 1) × {Rival 0,8 · Acq 1,0 · Friend 1,35}. */
  private patienceOf(npc: NpcDef | null, at: number) {
    const base = npc?.patience ?? DEFAULT_PATIENCE_SEC;
    const rush = npc?.rush && at >= npc.rush[0] && at < npc.rush[1] ? 0.65 : 1;
    const tier = npc ? this.mem(npc.id).tier : "ACQUAINTANCE";
    const bond = tier === "RIVAL" ? 0.8 : tier === "FRIEND" ? 1.35 : 1;
    return base * rush * bond;
  }

  private spawn(v: Visit, nowMin: number) {
    const npc = v.npc;
    // Mỗi lượt ghé có dòng số RIÊNG, sinh từ (ngày, số thứ tự lượt).
    const rng = this.deps.hub.derive(`visit:${v.seq}`);
    const memKey = npc ? npc.id : `walkin${v.seq % WALKIN_STYLES.length}`;
    const id = `${memKey}#${v.seq}`;
    const m = this.mem(memKey);
    m.visits++;
    m.lastSeenDay = this.deps.day;

    const style = npc ? npc.body : WALKIN_STYLES[v.seq % WALKIN_STYLES.length];
    const name = npc ? npc.name : WALKIN_NAMES[v.seq % WALKIN_NAMES.length];
    const person = npc
      ? npc.personality
      : { soi: 0.3 + rng.next() * 0.5, nongTinh: 0.2 + rng.next() * 0.5,
          deTha: 0.5 + rng.next() * 0.4, thanThien: 0.3 + rng.next() * 0.5 };

    // Mood từ dòng số RIÊNG của (ngày, lượt ghé) — không đọc gì của người chơi (P2-02 §5.2)
    const mood = rollMood(this.deps.hub.derive(`mood:${v.seq}`), this.deps.day);
    const c = new Customer(
      id, memKey, name, person, style, npc, this.usualOf(memKey), m.visits,
      { ...GATE }, this.patienceOf(npc, nowMin) * moodPatienceMul(mood), rng,
    );
    c.dayMood = mood;
    if (npc && this.deps.gossip && activeHeard(this.deps.gossip, npc.id)
      .some((b) => b.valence < 0 && (b.kind === "ORDER_DEFECT" || b.kind === "DIRTY_HANDS" || b.kind === "DROPPED_FOOD"))) c.gazeBias = 0.1;
    const base = moodBaseFace(mood);
    // THẤY → HIỂU → NGHE: mặt nền + prop có từ lúc bước vào hẻm, trước câu nói đầu tiên
    if (base) c.react.baseFace = c.react.face = base;
    if (mood.prop === "VAI_XUOI") c.react.basePose = c.react.pose = "SETTLE_IN";
    c.rollOrder(this.canAskUsual(npc, m));
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

    for (const c of this.audience) {
      // P1-02 §2.4: quầy bẩn thì ai cũng soi kỹ hơn — không liên quan tới quan hệ.
      c.traitMul = Math.min(2.2, c.baseTrait * (1 + 0.35 * this.dirt));
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
   */
  private react(c: Customer, id: StimId, i: Intensity, pose?: PoseId) {
    const p = c.personality;
    const g = GROUP_OF[id];
    let face = faceFor(g, p, i);
    // `M1` (mím chặt) là CHỮ KÝ của chị Lan — gần như chỉ dùng M1 khi có chuyện không vừa ý
    // (P2-02 §3.1 quy ước 1). Người chơi học nó từ chị, rồi rùng mình khi thấy trên mặt ai khác.
    const negative = g === "HYGIENE" || g === "DEFECT" || g === "NAME" || g === "WAIT";
    if (face && negative && isSilentGrudge(p)) face = [face[0], face[1], 1];
    let chosen: PoseId = pose ?? (i >= 2 ? c.npc?.poses?.[id] ?? poseFor(g, p, i) : poseFor(g, p, i));
    // chị Lan lúc CONFIRMED: ĐỨNG SỮNG (damping 40), không nói (P2-02 §4.6)
    if (i === 3 && isSilentGrudge(p) && negative && g !== "WAIT") chosen = "FREEZE";
    let at = this.nowSec + reactionDelay(p, this.dialogRng.next());
    for (let guard = 0; guard < 20 && this.reactAt.some((t) => Math.abs(t - at) < 0.06); guard++) at += 0.06;
    this.reactAt.push(at);
    if (this.reactAt.length > 16) this.reactAt.shift();
    c.react.schedule(c.now, at - this.nowSec, face, chosen, faceHoldSec(p));
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

  // ──────────────────────────────────────────────────── bước 4 · khách

  tickNpcs(dt: number, ctx: { minutes: number; pressure: boolean; dayOver: boolean }) {
    this.nowMin = ctx.minutes;
    while (this.schedule.length && this.schedule[0].at <= ctx.minutes && !ctx.dayOver) {
      this.spawn(this.schedule.shift()!, ctx.minutes);
    }

    for (const c of this.customers) {
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
      if (c.phase === "leaving" && near(c, GATE, 0.5)) this.customers.splice(i, 1);
    }
    this.assignSlots();
  }

  private step(c: Customer, dt: number, dayOver: boolean) {
    if (c.phase === "leaving") {
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
            c.phase = c.slot === 0 ? "ordering" : "queueing";
            if (c.slot === 0) this.takeOrder(c);
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
  }

  private leave(c: Customer, reason: LeaveReason) {
    c.phase = "leaving";
    c.leaveReason = reason;
    c.slot = -1;
    c.zone = "SEATED_FAR";                             // quay lưng rồi thì không còn nhìn quầy
    if (reason === "served") this.servedCount++;
    if (reason === "impatient") {
      this.lostCount++;
      if (this.deps.notebook) this.deps.notebook.today.lost++;
      this.speakConcept(c, "FAREWELL", { leaveReason: "IMPATIENT" }, 80);
      this.out.push({ kind: "log", text: `${this.label(c)} bỏ đi — chờ lâu quá.` });
    }
    // Autosave nghe npc:left — đổ trí nhớ ngắn của rule DB vào world TRƯỚC khi nó ghi.
    this.speaker.sync(this.nowSec);
    this.deps.bus.emit("npc:left", { npcId: c.memKey, visitId: c.id, reason: LEAVE_REASON[reason] });
  }

  /** Ai đứng chỗ nào: người tới trước đứng gần quầy hơn. Người đứng sau bị người trước che. */
  private assignSlots() {
    let i = 0;
    for (const c of this.customers) {
      if (c.phase === "leaving") continue;
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
   */
  private say(c: Customer, text: string, tier: 1 | 2 | 3 = 2, log = false, pri = 50, rule?: Rule) {
    const delay = BARK_DELAY_MIN + this.dialogRng.next() * BARK_DELAY_SPAN;
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
  private speakConcept(c: Customer, concept: string, extra: Extra, pri = 50, log = false, vars: Record<string, string> = {}): boolean {
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
    this.say(c, got.text, got.tier, log, pri, got.rule);
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
  serveDish(dish: Ingredient[], opts: { cold?: boolean; crust?: number } = {}): { ok: boolean; reason?: string } {
    const c = this.front;
    if (!c || c.phase !== "waiting") return { ok: false, reason: "chưa có ai chờ lấy bánh" };
    const bus = this.deps.bus;

    // P2-05 — người chơi gọi khách bằng tên đã ghi trong sổ. Gọi SAI là WRONG_NAME (salience
    // 100, bỏ qua gaze: là âm thanh nhắm thẳng vào người đó). Chưa ghi tên = không gọi tên.
    const nb = this.deps.notebook;
    if (nb && c.npc && nameCheck(nb, c.npc.id) === false) {
      this.remember(c, "WRONG_NAME", SALIENCE.WRONG_NAME, { wrongNameUsed: nb.pages[c.npc.id].name });
      this.react(c, "WRONG_NAME", 3);
      this.speakConcept(c, "NOTICE_EVENT", { eventId: "WRONG_NAME", obsState: "CONFIRMED" }, 95, true);
      this.emitStim("WRONG_NAME", { target: c.id });
    }

    const raw = diffDish(c.order!, dish);
    // P1-01 §2.4: warmth < 0,55 lúc đưa. Kích thích BURNT_OR_COLD do scene phát đúng lúc đưa.
    if (opts.cold) raw.push(mkDefect("WRONG_TEMP", null));
    const defects: DiffedDefect[] = raw.map((d) => {
      const key = d.kind === "WRONG_TEMP" || d.kind === "STUFFED" ? null : orderDefectKey(c.id, d.kind, d.item);
      const seen = key ? rank(peakOfKey(c, key)) >= rank("NOTICED") : false;
      return { ...d, key, witness: seen ? "ANTICIPATED" : "DISCOVERED" };
    });
    bus.emit("order:delivered", { npcId: c.memKey, dish: [...dish], waitedSec: this.nowSec - c.orderedAt });

    const spoken = this.pickSpoken(c, defects);
    let positive = 0;

    // P1-01 §2.4: bánh "chưa tới" không phải lỗi đơn — nhưng người sành ăn (soi ≥ 0,7) chê.
    const crustLow = opts.crust !== undefined && opts.crust < CRUST.READY;
    const underdone = crustLow && c.personality.soi >= 0.7;
    if (defects.length === 0) {
      const remembered = c.order!.intent.usual;
      if (underdone) positive -= 10;
      if (remembered) {
        positive += REMEMBERED_USUAL_TA;
        this.emitStim("REMEMBERED_USUAL", { salience: REMEMBERED_USUAL_TA, target: c.id });
      }
      const extra = this.freeExtra(c, dish);
      positive += extra;
      this.speakConcept(c, "DELIVERY", {
        defectCount: 0, orderIsUsual: remembered, dishUnderdone: crustLow, freeExtraTooMuch: extra < 0,
      }, extra < 0 ? 70 : 60, true);
    } else if (spoken) {
      this.speakConcept(c, "DELIVERY", {
        defectCount: defects.length, defectKind: kindOf(spoken), defectWasSeen: spoken.witness === "ANTICIPATED",
        orderIsUsual: c.order!.intent.usual,
      }, 90, true, { mon: spoken.label });
    } else {
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
    if (defects.length) {
      const worst = defects.reduce((a, d) => Math.max(a, (d.witness === "DISCOVERED" ? d.sEat : d.sCounter) * d.magnitude), 0);
      this.remember(c, "ORDER_DEFECT", worst, { missingIngredient: (spoken ?? defects[0]).label });
    } else if (c.order!.intent.usual) this.remember(c, "REMEMBERED_USUAL", REMEMBERED_USUAL_TA);
    if (c.npc) {
      const m = this.mem(c.memKey);
      m.lastServedDay = this.deps.day;
      if (nb) {
        const t = nb.today;
        (t.served_[c.npc.id] ??= []).push({ minute: this.nowMin, dish: [...dish] });
        if (!defects.length && c.order!.intent.usual) t.usualServed.push(c.npc.id);
        if (!defects.length && ![...c.observations.values()].some((o) => o.peak === "CONFIRMED")) t.cleanServedFront.push(c.npc.id);
      }
      const sawBad = [...c.observations.values()].some((o) => o.peak === "CONFIRMED");
      if (!defects.length && !sawBad) {
        servedWell(m, c.personality, clamp01(1 - silentScore / 120), isSilentGrudge(c.personality));
        // P2-04 §2.6 kênh #1 — làm NGƯỢC LẠI, trong tầm nhìn: tin "ăn bớt", "bánh rớt"… nhạt đi
        if (this.deps.gossip) disprove(this.deps.gossip, c.memKey, ["ORDER_DEFECT", "DROPPED_FOOD", "DIRTY_HANDS", "BURNT_OR_COLD"], this.deps.day);
      }
    }

    // Kênh 1+2 lúc nhận bánh: lỗi → mặt "sai món" nặng; đúng → tích cực (nhớ đơn thì nặng hơn)
    if (defects.length) this.react(c, "ORDER_DEFECT", 3);
    else this.react(c, c.order!.intent.usual ? "REMEMBERED_USUAL" : "FREE_EXTRA", c.order!.intent.usual ? 3 : 2, "HAND_OUT");

    const tip = Math.round(this.tipOf(c, silentScore, positive) * moodTipMul(c.dayMood) * this.rumourMul(c.memKey, 0.8, 1.2) / 1000) * 1000;
    this.out.push({ kind: "paid", amount: PRICE_BANH + tip, item: "dish", tip });
    if (nb) nb.today.served++;
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
  private pickSpoken(c: Customer, defects: DiffedDefect[]): DiffedDefect | null {
    if (!defects.length) return null;
    const score = (d: DiffedDefect) => (d.witness === "DISCOVERED" ? d.sEat : d.sCounter) * d.magnitude;
    const sorted = [...defects].sort((a, b) => score(b) - score(a));
    let top = sorted[0];
    const ant = sorted.find((d) => d.witness === "ANTICIPATED");
    if (ant && score(top) - score(ant) < 15) top = ant;
    if (!this.barks.speaks(c.memKey)) return null;
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
    return FREE_EXTRA_BASE * mul;
  }

  /**
   * Mời ly trà đá — P1-02 §2.8: vừa là chăm sóc, vừa là công cụ CHỦ ĐỘNG hạ attention,
   * nên cũng là công cụ dễ phá game nhất. Các khoá:
   *  · VẬT LÝ — khách còn cầm ly thì không nhận ly nữa
   *  · cooldown 45 s mỗi người: ly trong cooldown chỉ được cái gật đầu, KHÔNG cúi uống
   *  · CARED_FOR_THEM nhỏ dần 1,0 / 0,6 / 0,25
   *  · người soi ≥ 0,7 nhận tới ly thứ 3 → bắt bài mua chuộc, không nhận nữa
   *  · trà là MỜI: mỗi ly tốn tiền, có hạn 18 ly/ngày
   */
  serveTea(): { ok: boolean; reason?: string } {
    const c = this.front;
    if (!c || c.phase === "leaving") return { ok: false, reason: "chưa có ai để mời" };
    if (c.holdingTea) return { ok: false, reason: `${this.label(c)} còn cầm ly kia` };
    if (c.suspectBribery) return { ok: false, reason: `${this.label(c)} không nhận nữa` };
    if (this.teaLeft <= 0) return { ok: false, reason: "hết đá rồi" };

    if (c.teaCount + 1 >= TEA.suspectAtCup && c.personality.soi >= TEA.suspectSoi) {
      c.suspectBribery = true;
      this.speakConcept(c, "INTERACT", { interaction: "TEA_SUSPECT" }, 70, true);
      return { ok: false, reason: `${this.label(c)} không nhận nữa` };
    }

    this.teaLeft--;
    this.out.push({ kind: "cost", amount: TEA_COST, item: "tea" });
    const mul = c.takeTea();
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
   * Hỏi chuyện — P1-02 §2.8 (ASK_QUESTION): khách nhìn MẶT người chơi (gaze 0,35) thay vì
   * nhìn tay, trong 1,5–4 s. Cooldown 60 s mỗi người. Trả câu người chơi nói (để ghi nhật ký).
   */
  ask(): { ok: boolean; line?: string; reason?: string } {
    const c = this.front;
    if (!c || c.phase === "leaving") return { ok: false, reason: "chưa có ai để hỏi chuyện" };
    const line = this.barks.take("askPlayer", "player");
    if (c.now - c.lastAskedAt >= ASK_COOLDOWN) {
      c.ask();
      this.deps.bus.emit("attention:toolUsed", { tool: "ASK_QUESTION", npcId: c.memKey, durationSec: 2.5 });
    }
    // Trong cooldown: vẫn trả lời, nhưng không quay sang nhìn mặt nữa — không farm được.
    this.speakConcept(c, "INTERACT", { interaction: "ASK" }, 30);
    return { ok: true, line };
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
   * Người chơi đang NGHIÊNG NGƯỜI nghe lỏm (P2-04 §2.7 tầng 2) — giá phải trả: người đứng
   * trước quầy thấy mình lơ đễnh, nhìn kỹ hơn 1,3× trong 5 giây.
   */
  playerLeaning() {
    const c = this.front;
    if (c) c.watchedIdleUntil = c.now + 5;
  }

  /**
   * Tên hiện ra với người chơi (nhật ký, phiếu, lý do) — P2-05: tên người chơi tự ghi trong
   * sổ, chưa ghi thì "—". Khách vãng lai giữ mô tả hình dáng ("cô nón lá").
   */
  label(c: Customer) {
    return displayName(this.deps.notebook, c.memKey, c.name);
  }

  /** Kích thích đang sống — overlay dev (F2) đọc để tách thừa số. */
  get liveStims(): readonly ActiveStim[] {
    return this.active.filter((s) => s.until > this.nowSec);
  }

  drain() {
    return this.out.splice(0, this.out.length);
  }
}

/** Giá trị fact `defectKind` cho lỗi được nói ra. */
function kindOf(d: DiffedDefect): string {
  if (d.kind === "WRONG_RATIO") return d.dir === "under" ? "RATIO_UNDER" : "RATIO_OVER";
  return d.kind;
}

// ───────────────────────────────────────────────────────────────────── đi lại

function isLeaving(c: Customer) {
  return c.phase === "leaving";
}

function near(c: { x: number; y: number }, p: { x: number; y: number }, r: number) {
  return Math.hypot(p.x - c.x, p.y - c.y) < r;
}

/** Khách đi thẳng tới đích, chạm tường thì trượt — đủ dùng vì sân trước quán trống. */
function walk(c: Customer, to: { x: number; y: number }, dt: number) {
  const dx = to.x - c.x, dy = to.y - c.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.05) return;
  const step = Math.min(d, WALK_SPEED * dt);
  const nx = c.x + (dx / d) * step;
  const ny = c.y + (dy / d) * step;
  if (!hitsWall(nx, c.y, 0.22)) c.x = nx;
  if (!hitsWall(c.x, ny, 0.22)) c.y = ny;
}
