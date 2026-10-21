// `states` của mỗi mục đích là danh sách trắng: chỉ cặp mục đích–tâm trạng được khai ra mới tồn tại.
import DATA from "../content/npcs/purposes.json";
import type { Rng } from "../core/rng";
import type { TimeBand } from "../core/clock";
import type { PoseId } from "./reaction";
import type { TalkMood } from "./talk";

export type StateId = string;
export type PurposeId = string;

/** Ba hệ số đều là nhân — 1,0 là không đổi. */
export type NpcState = {
  id: StateId;
  label: string;
  /** Khoá của `MOOD_FACE`; tên sai = ô vuông trắng trên màn hình. */
  face: TalkMood;
  pose: PoseId;
  patienceMul: number;
  angerMul: number;
  inviteMul: number;
};

export type Purpose = {
  id: PurposeId;
  label: string;
  /** 0..1, chỉ hãm `inviteChance` (đã có trần `INVITE_MAX`), không đẩy lên. */
  buyable: number;
  /** 0 thong thả · 1 cuống. */
  hurry: number;
  states: readonly StateId[];
  bands: readonly TimeBand[];
  /** Trọng số tương đối, không phải phần trăm. */
  weight: number;
  note?: string;
};

type RawState = Omit<NpcState, "face" | "pose"> & { face: string; pose: string };
type RawPurpose = Omit<Purpose, "bands"> & { bands: string[] };
type Raw = { states: RawState[]; purposes: RawPurpose[] };

const RAW = DATA as unknown as Raw;

export const STATES: readonly NpcState[] = RAW.states.map((s) => ({
  ...s, face: s.face as TalkMood, pose: s.pose as PoseId,
}));

export const PURPOSES: readonly Purpose[] = RAW.purposes.map((p) => ({
  ...p, bands: p.bands as TimeBand[],
}));

const STATE_OF = new Map(STATES.map((s) => [s.id, s]));
const PURPOSE_OF = new Map(PURPOSES.map((p) => [p.id, p]));

export function stateById(id: StateId): NpcState | null {
  return STATE_OF.get(id) ?? null;
}

export function purposeById(id: PurposeId): Purpose | null {
  return PURPOSE_OF.get(id) ?? null;
}

/** Chỗ duy nhất dịch id sang state — không ghép tay chỗ khác. */
export function statesOf(p: Purpose): readonly NpcState[] {
  return p.states.map((id) => STATE_OF.get(id)).filter((s): s is NpcState => !!s);
}

export function allows(p: Purpose, s: StateId): boolean {
  return p.states.includes(s);
}

const BY_BAND = new Map<TimeBand, readonly Purpose[]>();

export function purposesIn(band: TimeBand): readonly Purpose[] {
  const hit = BY_BAND.get(band);
  if (hit) return hit;
  const list = PURPOSES.filter((p) => p.bands.includes(band));
  // Khung giờ rỗng là lỗi dữ liệu, nhưng thà lệch giờ còn hơn hẻm đứng im.
  const out = list.length ? list : PURPOSES;
  BY_BAND.set(band, out);
  return out;
}

export type PurposeRoll = { purpose: Purpose; state: NpcState };

/** Đúng hai lần rút số (mục đích rồi tâm trạng) — thêm một lần là lệch mọi golden. */
export function rollPurpose(rng: Rng, band: TimeBand): PurposeRoll {
  const list = purposesIn(band);
  let total = 0;
  for (const p of list) total += Math.max(0, p.weight);

  let r = rng.next() * total;
  let purpose = list[list.length - 1];
  for (const p of list) {
    r -= Math.max(0, p.weight);
    if (r < 0) { purpose = p; break; }
  }

  const pool = statesOf(purpose);
  const state = pool[rng.int(0, pool.length)] ?? STATES[0];
  return { purpose, state };
}

export function purposeInviteMul(p: Purpose, s: NpcState): number {
  return Math.max(0, p.buyable * s.inviteMul);
}

/** Không có `hurryMul` riêng: lấy `patienceMul` soi gương để vội và hết kiên nhẫn không mâu thuẫn. */
export function purposeHurry(p: Purpose, s: NpcState): number {
  const mul = Math.max(0.5, Math.min(1.6, 2 - s.patienceMul));
  return Math.max(0, Math.min(1, p.hurry * mul));
}

/** Sàn 0,45 để không ai chờ được 3 giây rồi bỏ đi. */
export function purposePatienceMul(p: Purpose, s: NpcState): number {
  return Math.max(0.45, s.patienceMul * (1 - 0.45 * purposeHurry(p, s)));
}

export function purposeAngerMul(p: Purpose, s: NpcState): number {
  return s.angerMul * (1 + 0.3 * purposeHurry(p, s));
}

export function describe(p: Purpose, s: NpcState): string {
  return `${p.label} · ${s.label}`;
}
