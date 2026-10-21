import type { CustomerSlot, ObsState, Slot, StimId } from "../core/types";

// certainty += salience·visibility·occluder·gaze·trait/100 · dt — tích luỹ, không roll ngẫu nhiên; mỗi sự kiện một `key` riêng.

export type Zone = CustomerSlot;

const VISIBILITY: Record<Zone, Record<Slot, number>> = {
  FRONT_CENTER: { HANDS: 0.95, BOARD: 0.85, OVEN: 0.60, UNDER_COUNTER: 0.05 },
  FRONT_SIDE:   { HANDS: 0.70, BOARD: 0.65, OVEN: 0.75, UNDER_COUNTER: 0.05 },
  QUEUE_2:      { HANDS: 0.45, BOARD: 0.40, OVEN: 0.50, UNDER_COUNTER: 0.02 },
  QUEUE_3:      { HANDS: 0.20, BOARD: 0.18, OVEN: 0.30, UNDER_COUNTER: 0.00 },
  SEATED_FAR:   { HANDS: 0.10, BOARD: 0.10, OVEN: 0.25, UNDER_COUNTER: 0.00 },
};

export const SALIENCE: Record<StimId, number> = {
  MADE_THEM_WAIT: 100,
  BURNT_OR_COLD: 80,
  DROPPED_FOOD: 75,
  ORDER_DEFECT: 20,
  DIRTY_HANDS: 40,
  REFUSED_SERVICE: 85,
  CARED_FOR_THEM: 50,
  FREE_EXTRA: 25,
  FLOURISH: 15,
};

// AUDIO_DIRECTED bỏ qua gaze và chỉ `target` nghe; SMELL có sàn gaze; MADE_THEM_WAIT không nằm ở đây vì đi theo đồng hồ từng khách.
type StimSpec = { lifetime: number; channel: "VISUAL" | "AUDIO_DIRECTED" | "AUDIO_AMBIENT" | "SMELL"; gazeFloor?: number };
export const STIM_SPEC: Partial<Record<StimId, StimSpec>> = {
  BURNT_OR_COLD:    { lifetime: 12.0, channel: "SMELL", gazeFloor: 0.40 },
  DROPPED_FOOD:     { lifetime: 3.5, channel: "AUDIO_AMBIENT" },
  ORDER_DEFECT:     { lifetime: 8.0, channel: "VISUAL" },
  DIRTY_HANDS:      { lifetime: 6.0, channel: "VISUAL" },
  CARED_FOR_THEM:   { lifetime: 3.0, channel: "AUDIO_DIRECTED" },
  FREE_EXTRA:       { lifetime: 3.0, channel: "VISUAL" },
  FLOURISH:         { lifetime: 3.0, channel: "VISUAL" },
  REFUSED_SERVICE:  { lifetime: 5.0, channel: "AUDIO_AMBIENT" },
};
export const STIM_SECONDS: Partial<Record<StimId, number>> = Object.fromEntries(
  Object.entries(STIM_SPEC).map(([k, v]) => [k, v!.lifetime]),
);

/** Giây giữ nguyên certainty sau khi kích thích tắt, rồi mới rò. */
export const HOLD_TIME = 1.5;
/** Rò mỗi giây theo dải đang đứng; CONFIRMED thì chốt, không rò. */
const DECAY: Record<Exclude<ObsState, "CONFIRMED">, number> = { NOTICED: 0.06, GLIMPSED: 0.12, UNAWARE: 0.25 };
/** Quá trần thì kích thích mới thay cái salience thấp nhất. */
export const MAX_LIVE_STIMULI = 8;
const OCCLUDER_FLOOR = 0.15;
/** Bánh cháy có mùi nên visibility mọi chỗ đứng tối thiểu ngần này. */
const SMELL_VIS_FLOOR = 0.55;

export type { ObsState };

export function stateOf(certainty: number): ObsState {
  if (certainty >= 1) return "CONFIRMED";
  if (certainty >= 0.7) return "NOTICED";
  if (certainty >= 0.35) return "GLIMPSED";
  return "UNAWARE";
}

export type ActiveStim = {
  key: string;
  id: StimId;
  slot: Slot;
  salience: number;
  until: number;
  target?: string;
  smell?: boolean;
};

export type Observation = {
  id: StimId;
  slot: Slot;
  certainty: number;
  peak: ObsState;
  diedAt: number | null;
  /** Tách cháy/nguội của `BURNT_OR_COLD` cho câu thoại, vì lúc chọn câu kích thích có thể đã tắt. */
  smell?: boolean;
};

export type Occluder = { mul: number; slots: readonly Slot[]; zones: readonly Zone[] };

export type Observer = {
  zone: Zone;
  id?: string;
  gaze: number;
  occluder: number;
  traitMul: number;
  observations: Map<string, Observation>;
};

/** `soi = 0.5` cho đúng 1.0 — khách chuẩn của mọi bảng hiệu chỉnh. */
export function traitMulFrom(soi: number) {
  return Math.min(2.2, Math.max(0.5, 0.65 + 0.70 * soi));
}

function occluderFor(o: Observer, slot: Slot, occluders: readonly Occluder[]) {
  let m = o.occluder;
  for (const oc of occluders) if (oc.slots.includes(slot) && oc.zones.includes(o.zone)) m *= oc.mul;
  return Math.max(OCCLUDER_FLOOR, m);
}

/** Overlay dev và runtime cùng tính qua đây để không lệch nhau. */
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
      if (f.rate * 100 / o.traitMul < 0.5) continue;
      obs = { id: stim.id, slot: stim.slot, certainty: 0, peak: "UNAWARE", diedAt: null, smell: stim.smell };
      o.observations.set(stim.key, obs);
    }
    if (obs.peak === "CONFIRMED") continue;
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

export function peakOfKey(o: Observer, key: string): ObsState {
  return o.observations.get(key)?.peak ?? "UNAWARE";
}

export function peakOf(o: Observer, id: StimId): ObsState {
  let best: ObsState = "UNAWARE";
  for (const obs of o.observations.values()) if (obs.id === id && rank(obs.peak) > rank(best)) best = obs.peak;
  return best;
}

export const CONFIRMED_SHOW_SEC = 4;

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
