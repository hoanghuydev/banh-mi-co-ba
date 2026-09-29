import type { Slot, StimId } from "../core/eventbus";

/**
 * Tầng NHẬN THẤY — CANON §5, chép nguyên công thức.
 *
 *   rate = salience * visibility[slot][zone] * occluderMul * gazeFactor * traitMul / 100
 *   obs.certainty += rate * dt      // TÍCH LUỸ, không roll xúc xắc mỗi frame
 *   obs.certainty -= decay * dt     // khi kích thích biến mất (kiểu tụ điện)
 *
 * Hai điều bắt buộc, vi phạm là hỏng trụ cột:
 *  · T5 — không có xác suất giấu sau lưng. Người chơi phải ĐỌC ĐƯỢC rủi ro trước khi làm.
 *  · §16 Đừng-2 — "player perception should win over simulation accuracy":
 *    khoảng cách và góc nhìn ở quầy là hằng số, nên visibility là BẢNG TRA TĨNH O(1),
 *    không phải raycast.
 */

/** Chỗ đứng của khách so với quầy. */
export type Zone = "FRONT_CENTER" | "FRONT_SIDE" | "QUEUE_2" | "QUEUE_3" | "SEATED_FAR";

/** Bảng tra tĩnh, chép đúng số của CANON §5. */
const VISIBILITY: Record<Zone, Record<Slot, number>> = {
  FRONT_CENTER: { HANDS: 0.95, BOARD: 0.85, OVEN: 0.60, UNDER_COUNTER: 0.05 },
  FRONT_SIDE:   { HANDS: 0.70, BOARD: 0.65, OVEN: 0.75, UNDER_COUNTER: 0.05 },
  QUEUE_2:      { HANDS: 0.45, BOARD: 0.40, OVEN: 0.50, UNDER_COUNTER: 0.02 },
  QUEUE_3:      { HANDS: 0.20, BOARD: 0.18, OVEN: 0.30, UNDER_COUNTER: 0.00 },
  SEATED_FAR:   { HANDS: 0.10, BOARD: 0.10, OVEN: 0.25, UNDER_COUNTER: 0.00 },
};

/** Salience của từng sự kiện — CANON §3. */
export const SALIENCE: Record<StimId, number> = {
  WRONG_NAME: 100,
  MADE_THEM_WAIT: 100,
  BURNT_OR_COLD: 80,
  DROPPED_FOOD: 75,
  ORDER_DEFECT: 20,        // 20 tại quầy -> 100 lúc ăn (xử lý ở delivery-diff)
  DIRTY_HANDS: 40,
  REMEMBERED_USUAL: 90,
  REMEMBERED_STORY: 70,
  CARED_FOR_THEM: 50,
  FREE_EXTRA: 25,
  FLOURISH: 15,
};

/**
 * Hai sự kiện bỏ qua gazeFactor vì chúng là ÂM THANH nhắm thẳng vào khách
 * hoặc là chuyện xảy ra với chính họ (CANON §3.1).
 */
const IGNORES_GAZE: ReadonlySet<StimId> = new Set<StimId>(["WRONG_NAME", "MADE_THEM_WAIT"]);

export type ObsState = "UNAWARE" | "GLIMPSED" | "NOTICED" | "CONFIRMED";

export function stateOf(certainty: number): ObsState {
  if (certainty >= 1) return "CONFIRMED";
  if (certainty >= 0.7) return "NOTICED";
  if (certainty >= 0.35) return "GLIMPSED";
  return "UNAWARE";
}

/** Một kích thích đang diễn ra. Hết `until` thì certainty bắt đầu rò đi. */
export type ActiveStim = {
  id: StimId;
  slot: Slot;
  /** Giây trong ngày, tính theo đồng hồ game. */
  until: number;
};

export type Observation = { certainty: number; peak: ObsState };

const DECAY = 0.35;        // tốc độ rò khi kích thích biến mất

export type Observer = {
  zone: Zone;
  /** 0..1 — đang nhìn thẳng vào tay người bán hay đang bấm điện thoại. */
  gaze: number;
  /** Có gì che tầm nhìn không (thân người bán, ổ bánh dựng đứng…). */
  occluder: number;
  /** Từ tính cách `soi`: 0.6 (xuề xoà) → 1.4 (kỹ tính). */
  traitMul: number;
  observations: Map<StimId, Observation>;
};

export function traitMulFrom(soi: number) {
  return 0.6 + soi * 0.8;
}

/**
 * Cập nhật nhận thấy của MỘT người quan sát.
 * Duyệt từ phía SỰ KIỆN, không từ phía NPC — bài học Mark of the Ninja (CANON §5).
 */
export function observe(o: Observer, active: ActiveStim[], now: number, dt: number) {
  const seen = new Set<StimId>();

  for (const stim of active) {
    if (stim.until <= now) continue;
    seen.add(stim.id);

    const gaze = IGNORES_GAZE.has(stim.id) ? 1 : o.gaze;
    const rate = SALIENCE[stim.id] * VISIBILITY[o.zone][stim.slot]
      * o.occluder * gaze * o.traitMul / 100;

    const obs = o.observations.get(stim.id) ?? { certainty: 0, peak: "UNAWARE" as ObsState };
    obs.certainty = Math.min(1.6, obs.certainty + rate * dt);
    const st = stateOf(obs.certainty);
    if (rank(st) > rank(obs.peak)) obs.peak = st;
    o.observations.set(stim.id, obs);
  }

  for (const [id, obs] of o.observations) {            // kích thích tắt rồi thì rò dần
    if (seen.has(id)) continue;
    obs.certainty = Math.max(0, obs.certainty - DECAY * dt);
  }
}

const ORDER: ObsState[] = ["UNAWARE", "GLIMPSED", "NOTICED", "CONFIRMED"];
const rank = (s: ObsState) => ORDER.indexOf(s);

/** Mức cao nhất mà người này TỪNG đạt tới với một sự kiện — dùng lúc giao bánh. */
export function peakOf(o: Observer, id: StimId): ObsState {
  return o.observations.get(id)?.peak ?? "UNAWARE";
}

/** Đang ở mức nào NGAY LÚC NÀY — dùng để vẽ dấu `?`, nhíu mày. */
export function nowState(o: Observer): { id: StimId; state: ObsState } | null {
  let best: { id: StimId; state: ObsState } | null = null;
  for (const [id, obs] of o.observations) {
    const st = stateOf(obs.certainty);
    if (st === "UNAWARE") continue;
    if (!best || rank(st) > rank(best.state)) best = { id, state: st };
  }
  return best;
}
