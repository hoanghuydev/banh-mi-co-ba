/**
 * Đồn thổi + nhớ nhầm — P2-04. Tick ĐÚNG MỘT LẦN mỗi đêm (không realtime), RNG riêng
 * của (mùa, ngày, "gossip") → cùng save + cùng ngày ra kết quả byte-identical (CANON §8e).
 *
 *   Bạn CHỨNG KIẾN → bạn nhớ ĐÚNG. Không ngoại lệ.
 *   Bạn NGHE KỂ    → bạn có thể nhớ SAI. Và bạn luôn nhớ MÌNH NGHE TỪ AI.
 *
 * Sáu ràng buộc CANON §12: mutation per-kind (RB1) · tối đa 3 hop (RB2) · confidence
 * ×0,70–0,85 mỗi hop + nguồn truy vết được (RB3) · nghe lỏm được (RB4, StallScene) · tin
 * tốt lan mạnh hơn (RB5) · không có trong ~2 giờ đầu + có công tắc (RB6).
 *
 * Danh sách ĐEN (§2.12): tin đồn KHÔNG đổi công thức, tiền, cốt truyện, category/intensity
 * của sự kiện với người chứng kiến, việc NPC có ghé hay không (chỉ ±15% xác suất), trần
 * tin tưởng, kết quả vệ sinh, CORE. Module này không chạm vào bất kỳ thứ nào trong đó.
 */
import TIES from "../content/npcs/ties.json";
import CLAIMS from "../content/lines/claims.json";
import { NPCS } from "../content/npcs";
import { Rng } from "../core/rng";
import type { NpcId } from "../core/types";
import type { Personality } from "../content/npcs";

export const GOSSIP_START_DAY = 4;
export const MUTATION_START_DAY = 8;
export const MAX_HOPS = 3;
export const MAX_TRANSMISSIONS_PER_NIGHT = 3;
export const MIN_CONFIDENCE = { bad: 0.35, good: 0.30 };
export const GOOD_NEWS_MUL = 1.45, BAD_NEWS_MUL = 0.85;
export const DECLARATION_GAIN = 0.12, DECLARATION_CAP = 1.6;
export const SEASON_MUTATIONS = 4, MUTATION_MIN_GAP = 6;
export const NIGHTLY_FADE = 0.08;
export const DORMANT_REVIVE = 1.3;

export type Severity = "EXAGGERATE" | "INTENT" | "PRAISE";
export type Pool = "hearsay" | "belief" | "conviction";

export type Belief = {
  id: string;
  kind: string;
  claim: string;
  valence: -1 | 1;
  intensity: number;
  intensityMul: number;
  confidence: number;
  hops: number;
  /** Đường đi đầy đủ — KHÔNG BAO GIỜ rỗng khi hops ≥ 1; chain.length === hops. */
  chain: NpcId[];
  from: NpcId | null;
  mutated: boolean;
  severity?: Severity;
  declarations: number;
  hardened: boolean;
  toldTo: NpcId[];
  disproofDays: number[];
  dormant: boolean;
  dayHeard: number;
  lastToldDay: number;
  mentionedDay: number;
};

export type OverhearPlan = {
  day: number;
  a: NpcId; b: NpcId;
  claim: string;
  source: NpcId | null;
  lines: [string, string, string];
  hiddenA: string;
};

/** `mutated` = tin đã méo (kể cả méo từ trước) · `mutatedHere` = méo NGAY trên cạnh này (tiêu ngân sách). */
export type GossipLogEntry = { day: number; from: NpcId; to: NpcId; claim: string; mutated: boolean; mutatedHere: boolean; hops: number };

export type GossipState = {
  beliefs: Record<NpcId, Belief[]>;
  log: GossipLogEntry[];
  budget: { mutationsLeft: number; lastMutationDay: number; minGapDays: number };
  overhear: OverhearPlan | null;
  scriptedDone: boolean;
  revealDone?: boolean;
  seq: number;
};

export const newGossipState = (): GossipState => ({
  beliefs: {}, log: [], budget: { mutationsLeft: SEASON_MUTATIONS, lastMutationDay: -99, minGapDays: MUTATION_MIN_GAP },
  overhear: null, scriptedDone: false, seq: 0,
});

// ─────────────────────────────────────────────────────────────── dữ liệu

type Node = { amplifier?: number; credibility?: number; role?: string; resident?: boolean; neverOverheard?: boolean;
  neverMutated?: boolean; confidenceMulOnReceive?: number; requiresWitnessToRelay?: boolean; badNewsMul?: number; goodNewsMul?: number };
const NODES = (TIES as unknown as { nodes: Record<string, Node> }).nodes;
const TIE = new Map<string, { to: NpcId; strength: number }[]>();
for (const [a, b, s] of (TIES as unknown as { edges: [string, string, number][] }).edges) {
  (TIE.get(a) ?? TIE.set(a, []).get(a)!).push({ to: b, strength: s });
  (TIE.get(b) ?? TIE.set(b, []).get(b)!).push({ to: a, strength: s });
}
const NEVER = (TIES as unknown as { neverTellsTo?: Record<string, string[] | string> }).neverTellsTo ?? {};
export const tiesOf = (id: NpcId) => {
  const no = NEVER[id];
  const list = TIE.get(id) ?? [];
  return Array.isArray(no) ? list.filter((e) => !no.includes(e.to)) : list;
};
export const nodeOf = (id: NpcId): Node => NODES[id] ?? {};

type ClaimDef = { kind: string; valence: -1 | 1; label: string; mutated?: boolean; hearsay: string[]; belief: string[];
  conviction: string[]; seen?: string[]; tell: string[]; wonder?: string };
const C = CLAIMS as unknown as { reactions: Record<string, string[]>; claims: Record<string, ClaimDef> };
export const CLAIM = C.claims;
export const REACTIONS = C.reactions;

export const TRUE_CLAIM: Record<string, string> = {};
for (const [id, c] of Object.entries(CLAIM)) if (!c.mutated && !TRUE_CLAIM[c.kind]) TRUE_CLAIM[c.kind] = id;

/** RB1 — per-kind, KHÔNG BAO GIỜ global. Tên người chơi / tên NPC / món "như mọi bữa": null. */
export const MUTATION_GRAPH: Record<string, { to: string; rate: number; severity: Severity } | null> = {
  DROPPED_FOOD:     { to: "ban_do_roi_dat",     rate: 0.30, severity: "EXAGGERATE" },
  ORDER_DEFECT:     { to: "an_bot_nguyen_lieu", rate: 0.35, severity: "INTENT" },
  WRONG_NAME:       { to: "chanh_khong_nho",    rate: 0.40, severity: "INTENT" },
  DIRTY_HANDS:      { to: "cam_tien_boc_do",    rate: 0.28, severity: "EXAGGERATE" },
  BURNT_OR_COLD:    { to: "ban_banh_hom_qua",   rate: 0.22, severity: "INTENT" },
  MADE_THEM_WAIT:   { to: "om_dom_qua",         rate: 0.15, severity: "EXAGGERATE" },
  REMEMBERED_USUAL: { to: "ngon_nhat_khu",      rate: 0.20, severity: "PRAISE" },
  REMEMBERED_STORY: { to: "nho_het_chuyen_nha", rate: 0.22, severity: "PRAISE" },
  CARED_FOR_THEM:   { to: "tu_te_lam",          rate: 0.18, severity: "PRAISE" },
  FREE_EXTRA:       { to: "cho_them_vi_e",      rate: 0.25, severity: "INTENT" },
  FLOURISH:         { to: "tay_nghe_nhu_co_ba", rate: 0.10, severity: "PRAISE" },
  HEALED:           { to: "hoi_do_lo_gio_ky",   rate: 0.12, severity: "PRAISE" },
  PLAYER_NAME: null, NPC_NAME: null, USUAL_ORDER: null,
};

const GRAVITY_FLOOR: Record<string, number> = { DROPPED_FOOD: 0.55, DIRTY_HANDS: 0.45, WRONG_NAME: 0.40 };

const PERSON = new Map(NPCS.map((n) => [n.id, n]));
const personality = (id: NpcId): Personality => PERSON.get(id)!.personality;
export const nameOf = (id: NpcId) => PERSON.get(id)?.name ?? id;
const minConf = (b: Belief) => (b.valence > 0 ? MIN_CONFIDENCE.good : MIN_CONFIDENCE.bad);

// ─────────────────────────────────────────────────────────────── ghi nhận

/**
 * Người này CHỨNG KIẾN — hops 0, confidence 1, không bao giờ méo. Gọi từ Service mỗi
 * khi một ký ức được ghi (P2-03). Chuyện cũ đang ngủ mà tái phạm → thức dậy mạnh hơn.
 */
export function witness(g: GossipState, npc: NpcId, kind: string, intensity: number, day: number) {
  const claim = TRUE_CLAIM[kind.startsWith("HEALED_") ? "HEALED" : kind];
  if (!claim) return;
  const list = (g.beliefs[npc] ??= []);
  // tái phạm: tin xấu cùng GỐC đang ngủ (kể cả bản đã méo) thức dậy ×1,3 — "tiếng dữ đồn xa"
  for (const b of list) {
    if (b.kind === kind && b.dormant) { b.dormant = false; b.confidence = Math.min(0.95, Math.max(minConf(b), b.confidence) * DORMANT_REVIVE); }
  }
  const same = list.find((b) => b.claim === claim && b.hops === 0);
  if (same) { same.intensity = Math.max(same.intensity, intensity); same.confidence = 1; same.dayHeard = day; return; }
  list.push({
    id: `b${++g.seq}`, kind: kind.startsWith("HEALED_") ? "HEALED" : kind, claim, valence: CLAIM[claim].valence,
    intensity, intensityMul: 1, confidence: 1, hops: 0, chain: [], from: null, mutated: false,
    declarations: 0, hardened: false, toldTo: [], disproofDays: [], dormant: false, dayHeard: day, lastToldDay: -1, mentionedDay: -1,
  });
}

export function activeHeard(g: GossipState, npc: NpcId) {
  return (g.beliefs[npc] ?? []).filter((b) => b.hops >= 1 && !b.dormant && b.confidence >= minConf(b));
}

export const poolOf = (b: Belief): Pool => (b.declarations >= 3 || b.hardened ? "conviction" : b.declarations >= 2 ? "belief" : "hearsay");

/**
 * Kênh giải thích #1 — làm NGƯỢC LẠI trong tầm nhìn (§2.6): ×0,55. Cáo buộc về Ý ĐỊNH với
 * người soi ≥ 0,7 chỉ ×0,80 ("làm đầy đặn một lần chỉ chứng minh hôm nay bạn đầy đặn").
 * Tin đã `hardened` không bác được bằng kênh 1. KHÔNG xoá — tin ngủ, chờ tái phạm.
 */
export function disprove(g: GossipState, npc: NpcId, kinds: readonly string[], day: number) {
  const p = personality(npc);
  let n = 0;
  for (const b of g.beliefs[npc] ?? []) {
    if (b.valence > 0 || b.dormant || b.hardened || b.hops === 0 || !kinds.includes(b.kind) || b.disproofDays.includes(day)) continue;
    b.confidence *= b.severity === "INTENT" && p.soi >= 0.7 ? 0.8 : 0.55;
    b.disproofDays.push(day);
    if (b.confidence < minConf(b)) b.dormant = true;
    n++;
  }
  return n;
}

// ─────────────────────────────────────────────────────────────── tick đêm

/** Ai chịu kể — thanThien là trục chính. KHÔNG đọc `deTha` ở bất kỳ nhánh nào (bịt §8b). */
export function tellWillingness(id: NpcId, kind: string) {
  const p = personality(id);
  const base = 0.20 + 0.55 * p.thanThien;
  const amp = nodeOf(id).amplifier ?? 1.0;
  return Math.min(0.92, Math.max(0, Math.max(base * amp, GRAVITY_FLOOR[kind] ?? 0)));
}

/** §2.11 — hướng méo lệch theo tính cách người NHẬN: soi kéo về xấu, thân thiện kéo về tốt. */
export function personalityBias(receiver: NpcId, severity: Severity) {
  const p = personality(receiver);
  const soiPull = 0.6 + 1.0 * p.soi, thanPull = 0.6 + 1.0 * p.thanThien;
  return severity === "PRAISE" ? thanPull / soiPull : soiPull / thanPull;
}

function weighted<T>(rng: Rng, items: T[], w: (x: T) => number): T | null {
  const total = items.reduce((a, x) => a + Math.max(0, w(x)), 0);
  if (total <= 0) return null;
  let r = rng.next() * total;
  for (const x of items) { r -= Math.max(0, w(x)); if (r < 0) return x; }
  return items[items.length - 1];
}

export type TickCtx = {
  saveId: string;
  day: number;
  allowFalseMemory: boolean;
  present: (id: NpcId) => boolean;
  extraTransmissions?: number;
  /**
   * P4-01 NPC-12 — sau SK-32 (hai người cùng nghề) chú Kiệt kể tin XẤU ít hẳn đi: 0,45 → 0,15,
   * vĩnh viễn. Người chơi không bao giờ được thông báo — chỉ thấy hẻm bớt dò xét.
   */
  willMul?: (teller: NpcId, valence: number) => number;
  /**
   * P4-02 §2.2–2.3 (CANON §12.6): hẻm đã được phép kể chưa — ngày ≥ 9 hoặc ≥ 90 phút chơi.
   * Chưa mở thì CHỈ có chuỗi kịch bản đầu tiên (người chứng kiến → bà Sáu) đi ngầm, không
   * méo, không cảnh nghe lỏm: "tin đã đi được 5 ngày trước khi người chơi biết". Vắng = mở.
   */
  open?: boolean;
};

export function gossipTick(g: GossipState, t: TickCtx): GossipLogEntry[] {
  const out: GossipLogEntry[] = [];
  const { day } = t;
  g.overhear = null;
  if (day < GOSSIP_START_DAY) return out;
  const rng = Rng.forSeason(t.saveId, `gossip:${day}`);
  const inAlley = (id: NpcId) => !!nodeOf(id).resident || t.present(id);

  const open = t.open ?? true;
  const send = (teller: NpcId, b: Belief, listener: NpcId) => {
    const e = transmit(g, teller, b, listener, day, rng, t.allowFalseMemory && open);
    out.push(e);
    g.log.push(e);
    if (open && !g.overhear && !nodeOf(teller).neverOverheard) g.overhear = planOverhear(teller, listener, g.beliefs[listener].at(-1)!, b, day + 1, rng);
  };

  let budget = MAX_TRANSMISSIONS_PER_NIGHT + (t.extraTransmissions ?? 0);
  // §2.13 #1 — chuỗi đầu tiên có kịch bản: lần đầu có người CHỨNG KIẾN bánh rớt, đêm đó
  // người đó kể cho bà Sáu (nút khuếch đại, đi ngang cả hẻm) — xảy ra với MỌI người chơi
  if (!g.scriptedDone) {
    for (const n of NPCS) {
      if (n.id === "BA_SAU") continue;
      const b = (g.beliefs[n.id] ?? []).find((x) => x.kind === "DROPPED_FOOD" && x.hops === 0 && !x.toldTo.includes("BA_SAU"));
      if (b) { send(n.id, b, "BA_SAU"); g.scriptedDone = true; budget--; break; }
    }
  }
  if (!open) return out;
  // P4-02 §2.3 CÚ LỘ — đêm đầu tiên hẻm được kể: bà Sáu dừng gánh trước tiệm cô Mai, và
  // người chơi nghe (sáng mai 8h50) chuyện đã đi mấy ngày mà mình không biết. Chỉ dùng
  // tin bà Sáu THẬT SỰ đang giữ — không có thì không có cảnh (không bịa thông tin).
  if (!g.revealDone) {
    g.revealDone = true;
    const held = (g.beliefs.BA_SAU ?? []).filter((x) => !x.dormant && !x.toldTo.includes("CO_MAI"));
    const b = held.find((x) => x.hops > 0) ?? held[0];
    if (b) { g.overhear = null; send("BA_SAU", b, "CO_MAI"); budget--; }
  }

  const tellers = NPCS.map((n) => n.id).filter(inAlley);
  for (let i = tellers.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [tellers[i], tellers[j]] = [tellers[j], tellers[i]];
  }
  for (const teller of tellers) {
    if (budget <= 0) break;
    const node = nodeOf(teller);
    const pool = (g.beliefs[teller] ?? []).filter((b) => !b.dormant && b.hops < MAX_HOPS && b.confidence >= minConf(b)
      && b.intensity * b.confidence * b.intensityMul >= 25
      && (!node.requiresWitnessToRelay || b.hops === 0));
    const b = weighted(rng, pool, (x) => x.intensity * x.confidence * x.intensityMul * (x.valence > 0 ? GOOD_NEWS_MUL : BAD_NEWS_MUL));
    const roll = rng.next();
    if (!b || roll >= tellWillingness(teller, b.kind) * (t.willMul?.(teller, b.valence) ?? 1)) continue;
    const cands = tiesOf(teller).filter((e) => e.strength > 0 && !b.toldTo.includes(e.to) && !b.chain.includes(e.to) && inAlley(e.to));
    const pick = weighted(rng, cands, (e) => e.strength);
    if (!pick) continue;
    send(teller, b, pick.to);
    budget--;
  }

  for (const list of Object.values(g.beliefs)) {
    for (const b of list) {
      if (b.hops === 0) { b.intensity *= 0.94; continue; }
      if (b.lastToldDay === day || b.dayHeard === day) continue;
      b.confidence = Math.max(0, b.confidence - NIGHTLY_FADE);
      if (b.confidence < minConf(b)) b.dormant = true;
    }
  }
  return out;
}

function transmit(g: GossipState, teller: NpcId, b: Belief, listener: NpcId, day: number, rng: Rng, allowFalse: boolean): GossipLogEntry {
  const pt = personality(teller);
  const keep = (b.valence > 0 ? 0.75 : 0.70) + 0.15 * pt.thanThien;
  const tn = nodeOf(teller), ln = nodeOf(listener);
  let conf = b.confidence * keep * (tn.credibility !== undefined ? 0.85 + 0.15 * tn.credibility : 1);
  if (tn.role === "DISTORTER") conf *= b.valence < 0 ? tn.badNewsMul ?? 1 : tn.goodNewsMul ?? 1;
  if (ln.confidenceMulOnReceive) conf *= ln.confidenceMulOnReceive;

  let claim = b.claim, mutated = b.mutated, severity = b.severity, here = false;
  // Nhớ nhầm — nơi DUY NHẤT mutation được phép xảy ra: trên cạnh truyền tin, không trên sự kiện
  const edge = MUTATION_GRAPH[b.kind];
  if (allowFalse && day >= MUTATION_START_DAY && !b.mutated && edge && !tn.neverMutated
    && g.budget.mutationsLeft > 0 && day - g.budget.lastMutationDay >= g.budget.minGapDays
    && rng.next() < edge.rate * personalityBias(listener, edge.severity)) {
    g.budget.mutationsLeft--;
    g.budget.lastMutationDay = day;
    claim = edge.to; mutated = true; severity = edge.severity; here = true;
    conf = Math.min(0.95, conf * 1.10);
  }

  const list = (g.beliefs[listener] ??= []);
  const chain = [...b.chain, teller];
  const existing = list.find((x) => x.claim === claim);
  if (existing) {
    existing.confidence = Math.min(0.95, Math.max(existing.confidence, conf));
    existing.dormant = false;
    existing.dayHeard = day;
    if (existing.hops > 0 && chain.length <= MAX_HOPS && chain.length < existing.hops) { existing.chain = chain; existing.hops = chain.length; existing.from = teller; }
  } else {
    list.push({
      id: `b${++g.seq}`, kind: b.kind, claim, valence: CLAIM[claim].valence, intensity: b.intensity, intensityMul: 1,
      confidence: conf, hops: chain.length, chain, from: teller, mutated, severity,
      declarations: 0, hardened: false, toldTo: [], disproofDays: [], dormant: false, dayHeard: day, lastToldDay: -1, mentionedDay: -1,
    });
  }
  // §2.9 declaration — nói mãi thành tin thật, với CHÍNH người kể
  b.toldTo.push(listener);
  b.lastToldDay = day;
  b.declarations++;
  b.intensityMul = Math.min(DECLARATION_CAP, 1 + DECLARATION_GAIN * b.declarations);
  b.confidence = Math.min(0.95, b.confidence * (1 + 0.5 * DECLARATION_GAIN));
  if (b.hops === 0) b.confidence = 1;
  if (b.declarations >= 3) b.hardened = true;
  return { day, from: teller, to: listener, claim, mutated, mutatedHere: here, hops: chain.length };
}

function planOverhear(a: NpcId, b: NpcId, heard: Belief, told: Belief, day: number, rng: Rng): OverhearPlan {
  const pick = (xs: string[]) => xs[Math.floor(rng.next() * xs.length)];
  const def = CLAIM[told.claim];
  const source = told.hops === 0 ? null : told.from;
  const raw = source ? pick(def.tell) : pick(def.seen ?? def.tell);
  const a1 = raw.replace(/\{source\}/g, source ? nameOf(source) : "Tui");
  const hiddenA = raw.replace(/\{source\}/g, "…");
  const pb = personality(b);
  const react = def.valence > 0 ? REACTIONS.good : pb.soi >= 0.6 && pb.thanThien < 0.7 ? REACTIONS.doubt : REACTIONS.believe;
  const b1 = heard.mutated && !told.mutated ? CLAIM[heard.claim].wonder ?? pick(react) : pick(react);
  const a2 = pick(source ? REACTIONS.close : REACTIONS.closeSeen);
  return { day, a, b, claim: heard.claim, source, lines: [a1, b1, a2], hiddenA };
}
