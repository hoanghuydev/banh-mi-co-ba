import type { CustomerSlot, ObsState, Slot, StimId } from "../core/types";

/**
 * Tầng NHẬN THẤY — CANON §5 + P1-02.
 *
 *   rate = salience * visibility[zone][slot] * occluderMul * gazeEff * traitMul / 100
 *   obs.certainty += rate * dt          // TÍCH LUỸ, không roll xúc xắc mỗi frame
 *
 * Khi kích thích tắt: GIỮ NGUYÊN 1,5 s (HOLD_TIME) rồi mới rò, rò CHẬM DẦN theo dải
 * (tụ điện). CONFIRMED thì CHỐT — đã chắc rồi thì không "quên" giữa buổi (P1-02 §2.4).
 *
 * Hai điều bắt buộc, vi phạm là hỏng trụ cột:
 *  · T5 — không có xác suất giấu sau lưng. Người chơi phải ĐỌC ĐƯỢC rủi ro trước khi làm.
 *  · §16 Đừng-2 — visibility là BẢNG TRA TĨNH O(1), không phải raycast.
 *
 * Mỗi sự kiện có KHOÁ RIÊNG (`key`), không gộp theo loại: hai lần rớt bánh là hai
 * sự kiện, và lỗi trong ổ của khách A không được thành "đã thấy" của khách B
 * (CANON §8.1 luật L4 — stimId một nguồn, xem `core/stimid.ts`).
 */

/** Chỗ đứng của khách so với quầy (cột của bảng visibility). */
export type Zone = CustomerSlot;

/** Bảng tra tĩnh, chép đúng số của CANON §5. */
const VISIBILITY: Record<Zone, Record<Slot, number>> = {
  FRONT_CENTER: { HANDS: 0.95, BOARD: 0.85, OVEN: 0.60, UNDER_COUNTER: 0.05 },
  FRONT_SIDE:   { HANDS: 0.70, BOARD: 0.65, OVEN: 0.75, UNDER_COUNTER: 0.05 },
  QUEUE_2:      { HANDS: 0.45, BOARD: 0.40, OVEN: 0.50, UNDER_COUNTER: 0.02 },
  QUEUE_3:      { HANDS: 0.20, BOARD: 0.18, OVEN: 0.30, UNDER_COUNTER: 0.00 },
  SEATED_FAR:   { HANDS: 0.10, BOARD: 0.10, OVEN: 0.25, UNDER_COUNTER: 0.00 },
};

/** Salience của từng sự kiện — CANON §3. Payload có thể ghi đè (vd. REMEMBERED_USUAL tầng T-A = 70). */
export const SALIENCE: Record<StimId, number> = {
  WRONG_NAME: 100,
  MADE_THEM_WAIT: 100,
  BURNT_OR_COLD: 80,
  DROPPED_FOOD: 75,
  ORDER_DEFECT: 20,        // 20 tại quầy -> 100 lúc ăn (xử lý ở delivery-diff)
  DIRTY_HANDS: 40,
  REFUSED_SERVICE: 85,     // CANON §3.4 — bịt lỗ hổng §8k
  REMEMBERED_USUAL: 90,
  REMEMBERED_STORY: 70,
  CARED_FOR_THEM: 50,
  FREE_EXTRA: 25,
  FLOURISH: 15,
};

/**
 * Kênh + thời gian sống của từng loại — P1-02 §3.1.
 *  · AUDIO_DIRECTED: nói thẳng vào MỘT người → bỏ qua gaze, chỉ người đó nghe
 *  · SMELL: gaze có sàn (đang bấm điện thoại vẫn ngửi thấy khét)
 *  · MADE_THEM_WAIT đi kênh THỜI GIAN riêng của từng khách, không phải kích thích chung
 *  · REMEMBERED_USUAL là sự kiện lúc giao bánh, không phải thứ để "bắt gặp"
 */
type StimSpec = { lifetime: number; channel: "VISUAL" | "AUDIO_DIRECTED" | "AUDIO_AMBIENT" | "SMELL"; gazeFloor?: number };
export const STIM_SPEC: Partial<Record<StimId, StimSpec>> = {
  WRONG_NAME:       { lifetime: 1.2, channel: "AUDIO_DIRECTED" },
  BURNT_OR_COLD:    { lifetime: 12.0, channel: "SMELL", gazeFloor: 0.40 },
  DROPPED_FOOD:     { lifetime: 3.5, channel: "AUDIO_AMBIENT" },
  // sống từ lúc sai tới lúc gói/đưa (P1-02 §3.1: 4–12 s)
  ORDER_DEFECT:     { lifetime: 8.0, channel: "VISUAL" },
  DIRTY_HANDS:      { lifetime: 6.0, channel: "VISUAL" },
  REMEMBERED_STORY: { lifetime: 2.5, channel: "AUDIO_DIRECTED" },
  CARED_FOR_THEM:   { lifetime: 3.0, channel: "AUDIO_DIRECTED" },
  FREE_EXTRA:       { lifetime: 3.0, channel: "VISUAL" },
  FLOURISH:         { lifetime: 3.0, channel: "VISUAL" },
  REFUSED_SERVICE:  { lifetime: 5.0, channel: "AUDIO_AMBIENT" },
};
/** Tên cũ — số giây sống của từng loại. */
export const STIM_SECONDS: Partial<Record<StimId, number>> = Object.fromEntries(
  Object.entries(STIM_SPEC).map(([k, v]) => [k, v!.lifetime]),
);

export const HOLD_TIME = 1.5;
/** Rò theo DẢI đang đứng — càng chắc thì càng lâu quên. CONFIRMED = 0 (chốt). */
const DECAY: Record<Exclude<ObsState, "CONFIRMED">, number> = { NOTICED: 0.06, GLIMPSED: 0.12, UNAWARE: 0.25 };
/** P1-02 §2.3: quá trần thì kích thích mới thay cái salience thấp nhất. */
export const MAX_LIVE_STIMULI = 8;
/** Sàn của occluder — che kỹ tới đâu cũng không mù hẳn. */
const OCCLUDER_FLOOR = 0.15;
/** P1-01 §2.4 / CANON Đ1: bánh CHÁY có mùi → visibility ở mọi chỗ đứng tối thiểu 0,55. */
const SMELL_VIS_FLOOR = 0.55;

export type { ObsState };

export function stateOf(certainty: number): ObsState {
  if (certainty >= 1) return "CONFIRMED";
  if (certainty >= 0.7) return "NOTICED";
  if (certainty >= 0.35) return "GLIMPSED";
  return "UNAWARE";
}

/** Một kích thích đang diễn ra. */
export type ActiveStim = {
  /** Khoá riêng của lần xảy ra này — cùng loại mà khác lần là khác khoá. */
  key: string;
  id: StimId;
  slot: Slot;
  salience: number;
  /** Giây THẬT kể từ lúc mở quầy. */
  until: number;
  /** AUDIO_DIRECTED: chỉ người này nghe (visitId). */
  target?: string;
  /** Bánh cháy thật (không phải nguội) → có mùi. */
  smell?: boolean;
};

export type Observation = {
  id: StimId;
  slot: Slot;
  certainty: number;
  peak: ObsState;
  /** Lúc kích thích tắt — `null` khi còn sống. Rò chỉ bắt đầu sau `diedAt + HOLD_TIME`. */
  diedAt: number | null;
  /**
   * Chép lại từ kích thích: ổ CHÁY (có mùi) hay chỉ ổ NGUỘI. `BURNT_OR_COLD` là một
   * `StimId` gánh hai chuyện khác hẳn nhau, mà câu thoại thì không được gánh chung —
   * người ta không kêu "khét" trước một ổ bánh nguội. Giữ ở đây vì tới lúc chọn câu
   * (`Service.noticeBark`) thì kích thích đã có thể tắt rồi, chỉ còn Observation.
   */
  smell?: boolean;
};

/** Thứ che tầm nhìn — P1-02 §2.6. Nhân dồn, sàn 0,15. */
export type Occluder = { mul: number; slots: readonly Slot[]; zones: readonly Zone[] };

export type Observer = {
  zone: Zone;
  /** Chỉ số lượt ghé (visitId) — để kích thích nói thẳng vào một người tìm đúng người. */
  id?: string;
  /** 0..1 — đang nhìn thẳng vào tay người bán hay đang bấm điện thoại. */
  gaze: number;
  /** Vật che riêng của người này (vd. người đứng trước chắn tầm). */
  occluder: number;
  traitMul: number;
  observations: Map<string, Observation>;
};

/**
 * CANON §4 (chốt ở P1-02): `soi = 0.5` cho đúng 1.000, nên "khách chuẩn" trong mọi
 * bảng hiệu chỉnh là một NPC có thật (Ông Hải / Chị Hạnh). KHÔNG BAO GIỜ gắn với quan hệ.
 */
export function traitMulFrom(soi: number) {
  return Math.min(2.2, Math.max(0.5, 0.65 + 0.70 * soi));
}

function occluderFor(o: Observer, slot: Slot, occluders: readonly Occluder[]) {
  let m = o.occluder;
  for (const oc of occluders) if (oc.slots.includes(slot) && oc.zones.includes(o.zone)) m *= oc.mul;
  return Math.max(OCCLUDER_FLOOR, m);
}

/**
 * Từng thừa số của công thức §5 — overlay dev (F2) hiện ĐÚNG thừa số nào đang
 * giết công thức. Runtime cũng tính qua đây, nên hai bên không bao giờ lệch nhau.
 */
export function factorsOf(o: Observer, stim: Pick<ActiveStim, "id" | "slot"> & Partial<ActiveStim>, occluders: readonly Occluder[] = []) {
  const spec = STIM_SPEC[stim.id];
  const salience = stim.salience ?? SALIENCE[stim.id];
  let visibility = VISIBILITY[o.zone][stim.slot];
  if (stim.smell) visibility = Math.max(visibility, SMELL_VIS_FLOOR);
  const directed = spec?.channel === "AUDIO_DIRECTED";
  const gaze = directed ? 1 : Math.max(o.gaze, spec?.gazeFloor ?? 0);
  const occluder = directed ? 1 : occluderFor(o, stim.slot, occluders);
  const rate = salience * visibility * occluder * gaze * o.traitMul / 100;
  return { salience, visibility, occluder, gaze, trait: o.traitMul, rate };
}

/**
 * Cập nhật nhận thấy của MỘT người quan sát. Duyệt từ phía SỰ KIỆN, không từ phía
 * NPC — bài học Mark of the Ninja (CANON §5). Không cấp phát gì mỗi frame ngoài
 * lúc thật sự có Observation mới.
 */
export function observe(o: Observer, active: readonly ActiveStim[], now: number, dt: number, occluders: readonly Occluder[] = []) {
  for (const stim of active) {
    if (stim.target && stim.target !== o.id) continue;
    const alive = stim.until > now;
    let obs = o.observations.get(stim.key);
    if (!alive) {
      if (obs && obs.diedAt === null) obs.diedAt = stim.until;
      continue;
    }
    const f = factorsOf(o, stim, occluders);
    if (!obs) {
      // Lười cấp phát (P1-02 §2.3): không đủ để ai để ý thì khỏi tạo.
      if (f.rate * 100 / o.traitMul < 0.5) continue;
      obs = { id: stim.id, slot: stim.slot, certainty: 0, peak: "UNAWARE", diedAt: null, smell: stim.smell };
      o.observations.set(stim.key, obs);
    }
    if (obs.peak === "CONFIRMED") continue;               // đã chốt
    obs.certainty = Math.min(1, obs.certainty + f.rate * dt);
    const st = stateOf(obs.certainty);
    if (rank(st) > rank(obs.peak)) obs.peak = st;
  }

  for (const obs of o.observations.values()) {
    if (obs.peak === "CONFIRMED") { obs.certainty = 1; continue; }
    if (obs.diedAt === null || now < obs.diedAt + HOLD_TIME) continue;
    const band = stateOf(obs.certainty) as Exclude<ObsState, "CONFIRMED">;
    obs.certainty = Math.max(0, obs.certainty - DECAY[band] * dt);
  }
}

const ORDER: ObsState[] = ["UNAWARE", "GLIMPSED", "NOTICED", "CONFIRMED"];
export const rank = (s: ObsState) => ORDER.indexOf(s);

/** Mức cao nhất người này TỪNG đạt với một lần xảy ra (theo khoá). */
export function peakOfKey(o: Observer, key: string): ObsState {
  return o.observations.get(key)?.peak ?? "UNAWARE";
}

/** Mức cao nhất với MỌI lần xảy ra của một loại. */
export function peakOf(o: Observer, id: StimId): ObsState {
  let best: ObsState = "UNAWARE";
  for (const obs of o.observations.values()) if (obs.id === id && rank(obs.peak) > rank(best)) best = obs.peak;
  return best;
}

/** Một lần CONFIRMED còn hiện trên mặt bao lâu sau khi kích thích tắt (nó vẫn chốt trong trí nhớ). */
export const CONFIRMED_SHOW_SEC = 4;

/** Đang ở mức nào NGAY LÚC NÀY, nhìn vào đâu — để vẽ dấu trên đầu và tia nhìn. */
export function nowState(o: Observer, now = Infinity): { id: StimId; state: ObsState; slot: Slot } | null {
  let best: { id: StimId; state: ObsState; slot: Slot } | null = null;
  for (const obs of o.observations.values()) {
    if (obs.peak === "CONFIRMED" && obs.diedAt !== null && now - obs.diedAt > CONFIRMED_SHOW_SEC) continue;
    const st = stateOf(obs.certainty);
    if (st === "UNAWARE") continue;
    if (!best || rank(st) > rank(best.state)) best = { id: obs.id, state: st, slot: obs.slot };
  }
  return best;
}
