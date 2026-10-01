/**
 * Trí nhớ 3 tầng + quan hệ 3 bucket — P2-03. Thuần dữ liệu, không Phaser, không RNG.
 *
 *   SHORT 6–8 slot · LONG 3–4 slot (decay chậm ~3×) · CORE 1 slot (ghi một lần, không phai)
 *
 * Năm luật làm nên cảm giác "người này thật" — đừng "tối ưu" đi trong một lần refactor:
 *  1. Ghi đè cái có cường độ THẤP NHẤT, không phải cái cũ nhất (§2.2) — không spam chuyện
 *     vặt để đẩy một lỗi nặng ra khỏi đầu người ta được.
 *  2. Decay TAPERING: giữ → dốc cos mượt → sàn. Không có vách đứng kiểu RimWorld (§2.4).
 *  3. Sàn theo bucket ĐÃ ĐẠT (Stardew) + decay đếm LẦN GHÉ BỊ LỠ, không đếm ngày (§2.5, T4).
 *  4. Memory thứ n cùng kind chỉ góp 0,75^(n−1) (§2.6) — không farm được bằng một chiêu.
 *  5. Chuộc lỗi phải tốn công hơn gây lỗi, qua NHIỀU NGÀY, đúng TRỤC (§2.7).
 * Và một biến không bao giờ phục hồi: trần tin tưởng (§2.8, CANON §8d).
 *
 * T3: KHÔNG một con số nào ở đây được lên màn hình. Không bao giờ.
 * ⚠️ REL_K_* và điểm "phục vụ tử tế" là số của bản dựng (doc không chốt) — cần tune.
 */
import type { Personality } from "../content/npcs";
import type { RelTier } from "../core/types";
import { decayMul, relGainMul } from "./personality";

export type BaseKind =
  | "WRONG_NAME" | "MADE_THEM_WAIT" | "BURNT_OR_COLD" | "DROPPED_FOOD" | "ORDER_DEFECT" | "DIRTY_HANDS"
  | "RUDE_TO_THEM"
  | "REMEMBERED_USUAL" | "REMEMBERED_STORY" | "CARED_FOR_THEM" | "FREE_EXTRA" | "FLOURISH";
export type HealableKind = "WRONG_NAME" | "DROPPED_FOOD" | "DIRTY_HANDS" | "BURNT_OR_COLD" | "ORDER_DEFECT" | "RUDE_TO_THEM";
export type MemoryKind = BaseKind | `HEALED_${HealableKind}`;

export type Memory = {
  id: string;
  kind: MemoryKind;
  valence: -1 | 1;
  /** Cache mỗi đêm — giá trị thật luôn tính lại bằng `currentIntensity`. */
  intensity: number;
  /** Lúc tạo — MẪU SỐ CỦA redeem, không bao giờ đổi (§2.7 chi tiết 4). */
  intensity0: number;
  dayCreated: number;
  dayLastReinforced: number;
  /** Đếm TUYẾN TÍNH (§8g) — khác với 0,75^(n−1) của §2.6. */
  occurrences: number;
  source: { via: "WITNESSED" } | { via: "HEARD"; from: string; hops: number; mutated: boolean };
  confidence: number;
  tier: "SHORT" | "LONG" | "CORE";
  redeemPaid: number;
  redeemDays: number[];
  detail?: { missingIngredient?: string; wrongNameUsed?: string };
};

export type BurnReason = "HEAVY_DAY" | "BIG_DROP" | "COOL_OFF_CYCLE";

/** Phần quan hệ + trí nhớ của NpcState (save v3). */
export type RelState = {
  relationPoints: number;
  tier: RelTier;
  highestTier: RelTier | null;
  pointsAtDawn: number;
  visits: number;
  missStreak: number;
  /** Ngày gần nhất NPC có lịch ghé (để decay chỉ đếm lần ghé bị LỠ). */
  expectedDay: number;
  /** Giờ (phút) định ghé hôm đó — dẹp hàng sớm trước giờ này là họ tới mà không có gì (P3-01 §2.7). */
  expectedAt?: number;
  /** Ngày gần nhất được phục vụ xong (không tính bỏ đi). */
  lastServedDay: number;
  trustCeiling: number;
  burnCount: number;
  burnHistory: { day: number; reason: BurnReason }[];
  wasRivalOnDay: number | null;
  pointsAtRival: number;
  missStreakSinceRival: number;
  /** Số sự kiện âm salience ≥ 75 đã CONFIRMED hôm nay — dò HEAVY_DAY. */
  heavyToday: number;
  heavyDay: number;
  /** "Vắng n ngày" — hệ quả trễ của người im lặng (P2-02 §4.6). */
  absentUntil: number;
  memory: { short: Memory[]; long: Memory[]; core: Memory | null };
  memSeq: number;
};

// ─────────────────────────────────────────────────────────────── hằng số

export const PROMOTE_AFTER_DAYS = 3;
export const PROMOTE_FLOOR = 45;
export const EPSILON = 2;
export const GRACE_MISSES = 1;
export const STACK_R = 0.75;
/** HẰNG SỐ trong code, không phải bảng config — đổi phải qua review (R7). */
export const OFFENSE_MUL = 1.0;
export const KINDNESS_MUL_RIVAL = 1.25;
export const FRIEND_MIN_VISITS = 6;
export const CEILING_STEP = 12;
export const CEILING_MAX_BURNS = 4;
/** Điểm quan hệ mỗi điểm cường độ. ⚠️ bản dựng đặt — P2-03 không chốt. */
export const REL_K_POS = 0.12, REL_K_NEG = 0.2;
/** Một lượt phục vụ tử tế không có chuyện gì — quen mặt dần. ⚠️ bản dựng đặt; đo bằng `npm run sim`. */
export const SERVED_WELL_PTS = 1.0;

export const VALENCE: Record<BaseKind, -1 | 1> = {
  WRONG_NAME: -1, MADE_THEM_WAIT: -1, BURNT_OR_COLD: -1, DROPPED_FOOD: -1, ORDER_DEFECT: -1, DIRTY_HANDS: -1,
  RUDE_TO_THEM: -1,
  REMEMBERED_USUAL: 1, REMEMBERED_STORY: 1, CARED_FOR_THEM: 1, FREE_EXTRA: 1, FLOURISH: 1,
};

/** §2.4 — ngày; `floor` tính theo % của intensity0. */
export const DECAY: Record<BaseKind, { hold: number; taper: number; floor: number }> = {
  WRONG_NAME:       { hold: 2, taper: 14, floor: 25 },
  DROPPED_FOOD:     { hold: 2, taper: 12, floor: 20 },
  DIRTY_HANDS:      { hold: 1, taper: 8,  floor: 10 },
  BURNT_OR_COLD:    { hold: 1, taper: 6,  floor: 0 },
  MADE_THEM_WAIT:   { hold: 0, taper: 4,  floor: 0 },
  // Lời nói khó nghe: phai chậm hơn một ổ bánh nguội, nhanh hơn gọi sai tên. Sàn 15 —
  // "nó có nói một câu đó" là thứ người ta còn giữ lại được sau hai tuần.
  RUDE_TO_THEM:     { hold: 2, taper: 11, floor: 15 },
  ORDER_DEFECT:     { hold: 1, taper: 5,  floor: 0 },
  REMEMBERED_USUAL: { hold: 3, taper: 20, floor: 15 },
  REMEMBERED_STORY: { hold: 3, taper: 16, floor: 10 },
  CARED_FOR_THEM:   { hold: 2, taper: 12, floor: 5 },
  FREE_EXTRA:       { hold: 0, taper: 4,  floor: 0 },
  FLOURISH:         { hold: 0, taper: 3,  floor: 0 },
};
/** Vết thương đã lành: memory dương yếu, bền (§2.7 chi tiết 3). */
const HEALED_DECAY = { hold: 5, taper: 30, floor: 40 };

type RedeemSpec = { K: number; minDistinctDays: number; requireKinds?: BaseKind[] };
export const REDEEM: Partial<Record<BaseKind, RedeemSpec>> = {
  WRONG_NAME:     { K: 2.5, minDistinctDays: 3, requireKinds: ["REMEMBERED_USUAL", "REMEMBERED_STORY"] },
  DROPPED_FOOD:   { K: 2.0, minDistinctDays: 3, requireKinds: ["CARED_FOR_THEM"] },
  DIRTY_HANDS:    { K: 2.2, minDistinctDays: 2 },
  BURNT_OR_COLD:  { K: 1.6, minDistinctDays: 2 },
  ORDER_DEFECT:   { K: 1.5, minDistinctDays: 2 },
  MADE_THEM_WAIT: { K: 1.2, minDistinctDays: 1 },
  // Chuộc một câu nói phải bằng LỜI và sự để ý, không bằng ổ bánh to hơn (§2.7 "đúng trục").
  RUDE_TO_THEM:   { K: 2.0, minDistinctDays: 3, requireKinds: ["CARED_FOR_THEM", "REMEMBERED_STORY"] },
};

export const SALIENCE_OF: Record<BaseKind, number> = {
  WRONG_NAME: 100, MADE_THEM_WAIT: 100, BURNT_OR_COLD: 80, DROPPED_FOOD: 75, ORDER_DEFECT: 100, DIRTY_HANDS: 40,
  RUDE_TO_THEM: 65,
  REMEMBERED_USUAL: 90, REMEMBERED_STORY: 70, CARED_FOR_THEM: 50, FREE_EXTRA: 25, FLOURISH: 15,
};

const baseOf = (k: MemoryKind): BaseKind | null => (k.startsWith("HEALED_") ? null : (k as BaseKind));

export function newRelState(): RelState {
  return {
    relationPoints: 0, tier: "ACQUAINTANCE", highestTier: null, pointsAtDawn: 0, visits: 0,
    missStreak: 0, expectedDay: 0, lastServedDay: 0,
    trustCeiling: 100, burnCount: 0, burnHistory: [],
    wasRivalOnDay: null, pointsAtRival: 0, missStreakSinceRival: 0,
    heavyToday: 0, heavyDay: 0, absentUntil: 0,
    memory: { short: [], long: [], core: null }, memSeq: 0,
  };
}

// ─────────────────────────────────────────────────────────────── slot + decay

export function slotCount(p: Personality) {
  return { short: Math.round(6 + 2 * p.soi), long: Math.round(3 + 1 * (1 - p.deTha)), core: 1 };
}

/** Âm: `0,4 + 1,6·deTha` — CÙNG con số với P2-02 §4.6 (decayMul). Dương: người mở lòng nhớ ơn lâu hơn. */
function temperFactor(m: Memory, p: Personality) {
  return m.valence < 0 ? decayMul(p) : 0.8 + 0.6 * p.thanThien;
}

/** Giữ — dốc cos — sàn; đạo hàm bằng 0 ở CẢ HAI đầu (không có góc gãy). LONG chậm hơn ~3×. */
export function currentIntensity(m: Memory, day: number, p: Personality): number {
  if (m.tier === "CORE") return m.intensity0;
  const base = baseOf(m.kind);
  const d = base ? DECAY[base] : HEALED_DECAY;
  const t = day - m.dayLastReinforced;
  if (t <= d.hold) return m.intensity0;
  const taper = d.taper * temperFactor(m, p) * (m.tier === "LONG" ? 3 : 1);
  const u = Math.min(1, (t - d.hold) / taper);
  const ease = 0.5 * (1 + Math.cos(Math.PI * u));
  const floor = (m.intensity0 * d.floor) / 100;
  return floor + (m.intensity0 - floor) * ease;
}

const all = (s: RelState) => [...s.memory.short, ...s.memory.long, ...(s.memory.core ? [s.memory.core] : [])];

/** §2.6 — đóng góp của một kind, trần tiệm cận 4× (= 1/(1−0,75)). */
export function effectiveContribution(s: RelState, kind: MemoryKind, day: number, p: Personality) {
  return all(s).filter((m) => m.kind === kind).map((m) => currentIntensity(m, day, p))
    .sort((a, b) => b - a).reduce((sum, v, i) => sum + v * STACK_R ** i, 0);
}

// ─────────────────────────────────────────────────────────────── bucket

const FLOOR_OF: Record<RelTier, number> = { RIVAL: 0, ACQUAINTANCE: 12, FRIEND: 35 };
export const floorOfTier = (t: RelTier | null) => (t ? FLOOR_OF[t] : 0);
const rank = (t: RelTier) => (t === "RIVAL" ? 0 : t === "ACQUAINTANCE" ? 1 : 2);

function clampPoints(s: RelState) {
  s.relationPoints = Math.min(s.trustCeiling, Math.max(-100, s.relationPoints));
  s.relationPoints = Math.max(s.relationPoints, floorOfTier(s.highestTier));
}

/** §2.5 — ngưỡng vào/ra BẤT ĐỐI XỨNG (hysteresis). Chỉ chạy một lần mỗi đêm. */
export function nextTier(s: RelState): RelTier {
  const p = s.relationPoints;
  const hasLong = (v: -1 | 1) => s.memory.long.some((m) => m.valence === v) || (s.memory.core?.valence === v);
  switch (s.tier) {
    case "FRIEND":
      if (p < 45) return p <= -35 && hasLong(-1) ? "RIVAL" : "ACQUAINTANCE";
      return "FRIEND";
    case "RIVAL":
      return p >= -10 ? "ACQUAINTANCE" : "RIVAL";
    default:
      if (p >= 60 && s.visits >= FRIEND_MIN_VISITS && hasLong(1) && p <= s.trustCeiling) return "FRIEND";
      if (p <= -35 && hasLong(-1)) return "RIVAL";
      return "ACQUAINTANCE";
  }
}

// ─────────────────────────────────────────────────────────────── ghi nhớ

function newMemory(s: RelState, kind: BaseKind, intensity: number, day: number, confidence = 1): Memory {
  return {
    id: `m${++s.memSeq}`, kind, valence: VALENCE[kind], intensity, intensity0: intensity,
    dayCreated: day, dayLastReinforced: day, occurrences: 1, source: { via: "WITNESSED" }, confidence,
    tier: "SHORT", redeemPaid: 0, redeemDays: [],
  };
}

/** §2.2 — cùng kind: giữ cái MẠNH hơn; đầy: thay cái có cường độ HIỆN TẠI thấp nhất (nếu đủ mạnh). */
function insertShort(s: RelState, m: Memory, day: number, p: Personality): { evicted?: string; merged: boolean; stored: boolean } {
  const same = s.memory.short.find((x) => x.kind === m.kind) ?? s.memory.long.find((x) => x.kind === m.kind);
  if (same) {
    same.occurrences += 1;
    same.dayLastReinforced = day;
    if (m.intensity0 > currentIntensity(same, day, p)) { same.intensity = same.intensity0 = Math.max(same.intensity0, m.intensity0); }
    return { merged: true, stored: true };
  }
  const cap = slotCount(p).short;
  if (s.memory.short.length < cap) { s.memory.short.push(m); return { merged: false, stored: true }; }
  let victim = s.memory.short[0];
  for (const x of s.memory.short) if (currentIntensity(x, day, p) < currentIntensity(victim, day, p)) victim = x;
  if (currentIntensity(victim, day, p) >= m.intensity0) return { merged: false, stored: false };
  s.memory.short[s.memory.short.indexOf(victim)] = m;
  return { evicted: victim.id, merged: false, stored: true };
}

export type RecordResult = { memoryId: string | null; evicted?: string; healed: MemoryKind[]; core: boolean; delta: number };

/**
 * Ghi một ký ức CHỨNG KIẾN — P2-03 §2.2 + §2.5 + §2.7. Trả về để Service phát event.
 * `intensity` = salience × confidence (P2-02 §2.1). Điểm quan hệ đổi NGAY (autosave ngay
 * sau đó — chống save-scum §8e); bucket chỉ đổi ban đêm (hysteresis).
 */
export function record(s: RelState, p: Personality, kind: BaseKind, intensity: number, day: number,
  opts: { detail?: Memory["detail"]; badDay?: boolean } = {}): RecordResult {
  const m = newMemory(s, kind, Math.max(0, Math.min(100, intensity)), day);
  if (opts.detail) m.detail = opts.detail;
  const ins = insertShort(s, m, day, p);
  // §2.6 — lần thứ n cùng kind chỉ góp 0,75^(n−1). Cùng kind được GỘP vào một ký ức nên n
  // chính là `occurrences` của ký ức đó (đếm tuyến tính, không phai — trần tiệm cận 4×).
  const n = all(s).find((x) => x.kind === kind && x.tier !== "CORE")?.occurrences ?? 1;
  const res: RecordResult = { memoryId: ins.stored && !ins.merged ? m.id : null, evicted: ins.evicted, healed: [], core: false, delta: 0 };

  const before = s.relationPoints;
  if (m.valence < 0) {
    s.relationPoints -= m.intensity0 * REL_K_NEG * OFFENSE_MUL;
    if (SALIENCE_OF[kind] >= 75) {
      if (s.heavyDay !== day) { s.heavyDay = day; s.heavyToday = 0; }
      s.heavyToday++;
    }
  } else {
    const kindness = s.tier === "RIVAL" ? KINDNESS_MUL_RIVAL : 1;
    s.relationPoints += m.intensity0 * REL_K_POS * relGainMul(p) * kindness * STACK_R ** (n - 1);
    res.healed = applyRedeem(s, m, day, p);
  }
  clampPoints(s);
  res.delta = s.relationPoints - before;

  // CORE — ghi MỘT LẦN cả mùa (§2.3)
  if (!s.memory.core) {
    const wrongNames = all(s).find((x) => x.kind === "WRONG_NAME")?.occurrences ?? 0;
    const trigger = (kind === "REMEMBERED_USUAL" && s.visits >= 5)
      || (kind === "WRONG_NAME" && wrongNames >= 3)
      || (opts.badDay && m.valence > 0 && (kind === "CARED_FOR_THEM" || kind === "REMEMBERED_USUAL"));
    if (trigger) {
      s.memory.core = { ...m, id: `m${++s.memSeq}`, tier: "CORE", intensity: 100, intensity0: 100 };
      res.core = true;
    }
  }
  return res;
}

/** §2.7 — mỗi vết thương nhận tối đa 1 đóng góp / ngày; phải đúng trục (`requireKinds`). */
function applyRedeem(s: RelState, pos: Memory, day: number, p: Personality): MemoryKind[] {
  const healed: MemoryKind[] = [];
  for (const w of [...s.memory.short, ...s.memory.long]) {
    if (w.valence > 0) continue;
    const base = baseOf(w.kind);
    const spec = base ? REDEEM[base] : undefined;
    if (!spec || w.redeemDays.includes(day)) continue;
    if (spec.requireKinds && !spec.requireKinds.includes(pos.kind as BaseKind)) continue;
    w.redeemPaid += pos.intensity0;
    w.redeemDays.push(day);
    if (w.redeemPaid >= w.intensity0 * spec.K && w.redeemDays.length >= spec.minDistinctDays) {
      heal(s, w, day, p);
      healed.push(w.kind);
    }
  }
  return healed;
}

/** Không xoá trắng — ĐỔI DẤU: vết thương lành nằm lại ở LONG thành một ký ức dương yếu. */
function heal(s: RelState, w: Memory, day: number, p: Personality) {
  s.memory.short = s.memory.short.filter((x) => x !== w);
  s.memory.long = s.memory.long.filter((x) => x !== w);
  const h: Memory = {
    ...w, id: `m${++s.memSeq}`, kind: `HEALED_${w.kind as HealableKind}`, valence: 1,
    intensity0: w.intensity0 * 0.35, intensity: w.intensity0 * 0.35, dayCreated: day, dayLastReinforced: day,
    tier: "LONG", redeemPaid: 0, redeemDays: [],
  };
  insertLong(s, h, day, p);
}

function insertLong(s: RelState, m: Memory, day: number, p: Personality) {
  m.tier = "LONG";
  const cap = slotCount(p).long;
  if (s.memory.long.length < cap) { s.memory.long.push(m); return; }
  let victim = s.memory.long[0];
  for (const x of s.memory.long) if (currentIntensity(x, day, p) < currentIntensity(victim, day, p)) victim = x;
  if (currentIntensity(victim, day, p) < currentIntensity(m, day, p)) s.memory.long[s.memory.long.indexOf(victim)] = m;
}

/**
 * Một câu nói qua lại làm ấm lên (hoặc nguội đi) MỘT CHÚT — P5-01.
 *
 * Phần lớn câu trong một cuộc trò chuyện không đáng thành ký ức: nó chỉ là chuyện
 * "nói chuyện được" hay "nói chuyện khó chịu". Nên nó đi thẳng vào điểm quan hệ, KHÔNG
 * qua `record()`: không chiếm slot trí nhớ, không đi tin đồn, không chuộc được bằng
 * một ổ bánh. Câu nào nặng tới mức người ta NHỚ thì content phải khai `mem` riêng.
 *
 * `relGainMul` chỉ nhân cho phần DƯƠNG — người khép kín ấm lên chậm, nhưng không vì
 * khép kín mà bớt đau khi bị nói nặng.
 */
export function talkPoints(s: RelState, p: Personality, delta: number) {
  const before = s.relationPoints;
  s.relationPoints += delta > 0 ? delta * relGainMul(p) : delta;
  clampPoints(s);
  return s.relationPoints - before;
}

/** Được phục vụ tử tế mà không có chuyện gì (không phải ký ức — chỉ là thói quen quen mặt). */
export function servedWell(s: RelState, p: Personality, quality01: number, silentGrudge: boolean) {
  // người im lặng không ấm lên vì một ổ bánh bình thường — cửa duy nhất là NHỚ ĐÚNG (P2-02 §5)
  if (silentGrudge) return 0;
  const before = s.relationPoints;
  s.relationPoints += SERVED_WELL_PTS * relGainMul(p) * quality01;
  clampPoints(s);
  return s.relationPoints - before;
}

// ─────────────────────────────────────────────────────────────── ban đêm

export type NightResult = { promoted: string[]; decayed: number; burn: BurnReason | null; from: RelTier; to: RelTier };

/**
 * Chạy MỘT lần mỗi đêm, sau buổi bán — P2-03 §2.3 promote · §2.5 decay lần ghé bị lỡ ·
 * §2.8 dò đốt NPC · cập nhật bucket · dọn memory < EPSILON.
 */
export function nightly(s: RelState, p: Personality, day: number): NightResult {
  const from = s.tier;
  const expected = s.expectedDay === day;
  const served = s.lastServedDay === day;

  // §2.3 promote: vừa sống qua 3 ngày VỪA được lặp lại (một lần lỡ tay không thành ký ức dài hạn)
  const promoted: string[] = [];
  for (const m of [...s.memory.short]) {
    const age = day - m.dayCreated;
    const survived = currentIntensity(m, day, p) >= PROMOTE_FLOOR;
    const reinforced = m.occurrences >= 2 || m.kind === "WRONG_NAME";
    if (age >= PROMOTE_AFTER_DAYS && survived && reinforced) {
      s.memory.short = s.memory.short.filter((x) => x !== m);
      insertLong(s, m, day, p);
      promoted.push(m.id);
    }
  }

  // §2.5 decay: chỉ khi HÔM NAY người đó có lịch ghé mà không được phục vụ; lỡ 1 bữa là chuyện thường
  let decayed = 0;
  if (expected && !served) {
    s.missStreak++;
    if (s.wasRivalOnDay !== null) s.missStreakSinceRival++;
    if (s.missStreak > GRACE_MISSES) {
      const before = s.relationPoints;
      const d = s.relationPoints < 25 ? 2 : s.relationPoints < 60 ? 10 : 20;
      s.relationPoints = Math.max(s.relationPoints - d, floorOfTier(s.highestTier));
      decayed = before - s.relationPoints;
    }
  } else if (served) s.missStreak = 0;

  // §2.8 đốt NPC rồi để nguội → HẠ TRẦN VĨNH VIỄN. Không đường nào làm trần TĂNG.
  let burn: BurnReason | null = null;
  if (s.heavyDay === day && s.heavyToday >= 2) burn = "HEAVY_DAY";
  else if (s.pointsAtDawn - s.relationPoints >= 30) burn = "BIG_DROP";
  else if (s.wasRivalOnDay !== null && s.missStreakSinceRival >= 3 && served && s.relationPoints >= s.pointsAtRival + 20) burn = "COOL_OFF_CYCLE";
  if (burn) {
    s.burnCount++;
    s.burnHistory.push({ day, reason: burn });
    s.trustCeiling = Math.min(s.trustCeiling, 100 - CEILING_STEP * Math.min(s.burnCount, CEILING_MAX_BURNS));
    if (burn === "COOL_OFF_CYCLE") { s.wasRivalOnDay = null; s.missStreakSinceRival = 0; }
  }
  clampPoints(s);

  // bucket — một lần mỗi đêm (không đổi 2 lần trong một ngày)
  const to = nextTier(s);
  if (to !== from) {
    s.tier = to;
    if (to === "RIVAL") { s.wasRivalOnDay = day; s.pointsAtRival = s.relationPoints; s.missStreakSinceRival = 0; }
  }
  if (!s.highestTier || rank(to) > rank(s.highestTier)) {
    if (to !== "RIVAL" && (to === "FRIEND" || s.relationPoints >= 25)) s.highestTier = to;
  }

  // cache cường độ + dọn ký ức đã chìm
  for (const m of [...s.memory.short, ...s.memory.long]) m.intensity = currentIntensity(m, day, p);
  s.memory.short = s.memory.short.filter((m) => m.intensity >= EPSILON);
  s.memory.long = s.memory.long.filter((m) => m.intensity >= EPSILON);
  s.pointsAtDawn = s.relationPoints;
  return { promoted, decayed, burn, from, to: s.tier };
}

/** P2-03 §2.10 — trí nhớ → lịch: người đang giận ghé thưa hơn; người thân ghé đều hơn. */
export function visitProbabilityMul(s: RelState) {
  const bucket = s.tier === "RIVAL" ? 0.45 : s.tier === "FRIEND" ? 1.15 : 1.0;
  return bucket * (s.burnCount >= 2 ? 0.9 : 1.0);
}

/** "Vắng n ngày" của người im lặng — P2-02 §4.6 (chị Lan): kind → số ngày vắng. */
export const SILENT_ABSENCE: Partial<Record<BaseKind, number>> = {
  DROPPED_FOOD: 5, WRONG_NAME: 3, ORDER_DEFECT: 3, BURNT_OR_COLD: 2, MADE_THEM_WAIT: 2,
  // Chị Lan bị nói nặng một câu: không cãi, không giận ra mặt — bốn bữa sau chỗ 7h05 trống.
  RUDE_TO_THEM: 4,
};
