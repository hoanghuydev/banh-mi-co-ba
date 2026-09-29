/**
 * Kênh 1 (nét mặt) và kênh 2 (dáng) — P2-02 §3.1–§3.2. Chỉ là DỮ LIỆU + một hàng đợi
 * nhỏ theo thời gian; phần vẽ ở `entities/CustomerActor` (Phaser), phần này chạy headless.
 *
 * Mặt = 3 lớp × 6 biến thể (mày B0–B5 · mắt E0–E5 · miệng M0–M5) = 216 tổ hợp.
 * Dáng = một bộ TARGET cho lò xo — 0 sprite mới (kỹ thuật Rain World, CANON §16 Đừng-4).
 *
 * Luật phối kênh (P2-02 §3): GLIMPSED = mặt nhẹ + quay đầu · NOTICED = mặt + dáng ·
 * CONFIRMED = mặt + dáng + ghi nhớ. Luật 35% im lặng KHÔNG đụng tới kênh 1, 2.
 */
import type { StimId } from "../core/types";
import type { Personality } from "../content/npcs";
import { dominant, faceHoldSec, type Dim } from "./personality";

export type Face = readonly [brow: number, eye: number, mouth: number];
export const NEUTRAL: Face = [0, 0, 0];

export type PoseId =
  | "IDLE" | "LEAN_IN" | "LEAN_BACK" | "STEP_BACK_HALF" | "TILT_HEAD" | "PEEK_OVER" | "NOD" | "SHAKE_SLOW"
  | "SHRUG" | "ARMS_CROSS" | "TURN_AWAY_QUARTER" | "SHIFT_WEIGHT" | "CHECK_TIME" | "PHONE_DOWN" | "PHONE_UP"
  | "SETTLE_IN" | "FREEZE" | "HAND_OUT" | "WAVE_SMALL";

/** Nhóm sự kiện của bảng §3.1. */
export type Group = "HYGIENE" | "WAIT" | "DEFECT" | "NAME" | "POS_LIGHT" | "POS_HEAVY" | "CARED";
export const GROUP_OF: Record<StimId, Group> = {
  DROPPED_FOOD: "HYGIENE", DIRTY_HANDS: "HYGIENE", MADE_THEM_WAIT: "WAIT",
  ORDER_DEFECT: "DEFECT", BURNT_OR_COLD: "DEFECT", WRONG_NAME: "NAME", REFUSED_SERVICE: "DEFECT",
  FLOURISH: "POS_LIGHT", FREE_EXTRA: "POS_LIGHT",
  REMEMBERED_USUAL: "POS_HEAVY", REMEMBERED_STORY: "POS_HEAVY", CARED_FOR_THEM: "CARED",
};

const f = (s: string): Face => [Number(s[1]), Number(s[4]), Number(s[7])] as const;
type Row = [i1: string | null, i2: string, i3: string];
const ANY = (r: Row): Record<Dim, Row> => ({ soi: r, nongTinh: r, deTha: r, thanThien: r });

/** P2-02 §3.1 — (nhóm × chiều trội) → [I1 GLIMPSED, I2 NOTICED, I3 CONFIRMED]. Chép nguyên bảng. */
const FACE_TABLE: Record<Group, Record<Dim, Row>> = {
  HYGIENE: {
    soi: ["B1 E1 M0", "B2 E1 M1", "B2 E2 M4"], nongTinh: ["B3 E2 M0", "B2 E2 M5", "B2 E2 M5"],
    deTha: ["B3 E2 M0", "B1 E0 M2", "B1 E0 M4"], thanThien: ["B3 E2 M5", "B5 E0 M5", "B5 E2 M4"],
  },
  WAIT: {
    soi: ["B0 E3 M1", "B1 E3 M1", "B2 E4 M1"], nongTinh: ["B1 E3 M0", "B2 E0 M5", "B2 E2 M5"],
    deTha: ["B0 E3 M0", "B0 E4 M0", "B0 E4 M2"], thanThien: ["B0 E0 M2", "B5 E3 M1", "B5 E4 M1"],
  },
  DEFECT: {
    soi: ["B4 E1 M0", "B4 E1 M1", "B2 E1 M4"], nongTinh: ["B3 E2 M0", "B2 E2 M5", "B2 E2 M5"],
    deTha: ["B3 E0 M0", "B4 E0 M2", "B1 E0 M2"], thanThien: ["B3 E2 M5", "B5 E0 M5", "B5 E4 M1"],
  },
  NAME: {
    soi: [null, "B3 E2 M1", "B5 E4 M1"], nongTinh: [null, "B3 E2 M5", "B2 E2 M5"],
    deTha: [null, "B3 E2 M2", "B1 E0 M2"], thanThien: [null, "B5 E2 M5", "B5 E4 M1"],
  },
  POS_LIGHT: ANY(["B0 E0 M2", "B3 E5 M2", "B3 E5 M3"]),
  POS_HEAVY: {
    soi: ["B3 E2 M2", "B3 E5 M3", "B5 E5 M3"], nongTinh: ["B3 E2 M3", "B3 E2 M3", "B3 E2 M3"],
    deTha: ["B0 E5 M2", "B3 E5 M3", "B3 E5 M3"], thanThien: ["B3 E5 M2", "B3 E5 M3", "B5 E5 M3"],
  },
  CARED: ANY(["B3 E2 M2", "B5 E5 M2", "B5 E5 M3"]),
};

/** Dáng mặc định theo (nhóm × chiều trội) khi NPC không có dáng riêng cho sự kiện đó. */
const POSE_TABLE: Record<Group, Record<Dim, [PoseId, PoseId, PoseId]>> = {
  HYGIENE: {
    soi: ["LEAN_IN", "PEEK_OVER", "LEAN_BACK"], nongTinh: ["TILT_HEAD", "LEAN_IN", "LEAN_IN"],
    deTha: ["TILT_HEAD", "SHRUG", "SHRUG"], thanThien: ["TILT_HEAD", "LEAN_IN", "LEAN_BACK"],
  },
  WAIT: {
    soi: ["SHIFT_WEIGHT", "CHECK_TIME", "ARMS_CROSS"], nongTinh: ["SHIFT_WEIGHT", "CHECK_TIME", "LEAN_IN"],
    deTha: ["SHIFT_WEIGHT", "CHECK_TIME", "SHIFT_WEIGHT"], thanThien: ["SHIFT_WEIGHT", "CHECK_TIME", "ARMS_CROSS"],
  },
  DEFECT: {
    soi: ["TILT_HEAD", "TILT_HEAD", "SHAKE_SLOW"], nongTinh: ["TILT_HEAD", "LEAN_IN", "LEAN_IN"],
    deTha: ["TILT_HEAD", "SHRUG", "SHRUG"], thanThien: ["TILT_HEAD", "TILT_HEAD", "SHAKE_SLOW"],
  },
  NAME: {
    soi: ["TILT_HEAD", "TILT_HEAD", "NOD"], nongTinh: ["LEAN_BACK", "LEAN_BACK", "LEAN_BACK"],
    deTha: ["SHRUG", "SHRUG", "SHRUG"], thanThien: ["TILT_HEAD", "TURN_AWAY_QUARTER", "TURN_AWAY_QUARTER"],
  },
  POS_LIGHT: { soi: ["IDLE", "PEEK_OVER", "NOD"], nongTinh: ["IDLE", "NOD", "NOD"], deTha: ["IDLE", "NOD", "NOD"], thanThien: ["IDLE", "NOD", "LEAN_IN"] },
  POS_HEAVY: { soi: ["LEAN_IN", "NOD", "NOD"], nongTinh: ["LEAN_IN", "LEAN_IN", "LEAN_IN"], deTha: ["NOD", "NOD", "NOD"], thanThien: ["LEAN_IN", "NOD", "LEAN_IN"] },
  CARED: { soi: ["NOD", "NOD", "SETTLE_IN"], nongTinh: ["NOD", "SETTLE_IN", "SETTLE_IN"], deTha: ["NOD", "NOD", "SETTLE_IN"], thanThien: ["NOD", "SETTLE_IN", "SETTLE_IN"] },
};

export type Intensity = 1 | 2 | 3;

export function faceFor(g: Group, p: Personality, i: Intensity): Face | null {
  const row = FACE_TABLE[g][dominant(p)];
  const s = row[i - 1];
  return s ? f(s) : null;
}

export function poseFor(g: Group, p: Personality, i: Intensity): PoseId {
  return POSE_TABLE[g][dominant(p)][i - 1];
}

/**
 * Bộ target của một dáng — đơn vị PIXEL màn hình, `fwd` = về phía quầy, `up` = lên trên,
 * `rot` độ. `osc` = dao động quanh target (nhịp/biên độ). `k`,`d` = lò xo riêng (FREEZE d=40).
 */
export type PoseDef = { fwd: number; up: number; rot: number; sy?: number; osc?: { axis: "x" | "y" | "rot"; amp: number; period: number; beats?: number }; d?: number };
export const POSES: Record<PoseId, PoseDef> = {
  IDLE:              { fwd: 0, up: 0, rot: 0 },
  LEAN_IN:           { fwd: 4, up: 0, rot: 2 },
  LEAN_BACK:         { fwd: -4, up: 0, rot: -3 },
  STEP_BACK_HALF:    { fwd: -10, up: 0, rot: -1 },
  TILT_HEAD:         { fwd: 0, up: 0, rot: 6 },
  PEEK_OVER:         { fwd: 5, up: 3, rot: 4 },
  NOD:               { fwd: 0, up: 0, rot: 0, osc: { axis: "y", amp: 3, period: 0.45, beats: 2 } },
  SHAKE_SLOW:        { fwd: 0, up: 0, rot: 0, osc: { axis: "rot", amp: 4, period: 0.9, beats: 2 } },
  SHRUG:             { fwd: 0, up: 3, rot: 0, sy: 1.04 },
  ARMS_CROSS:        { fwd: 0, up: 0, rot: 1, sy: 0.99 },
  TURN_AWAY_QUARTER: { fwd: -2, up: 0, rot: -8 },
  SHIFT_WEIGHT:      { fwd: 0, up: 0, rot: 0, osc: { axis: "x", amp: 3, period: 1.8 } },
  CHECK_TIME:        { fwd: 0, up: -1, rot: 5 },
  PHONE_DOWN:        { fwd: 0, up: -2, rot: 6 },
  PHONE_UP:          { fwd: 0, up: 0, rot: 0 },
  SETTLE_IN:         { fwd: 0, up: -2, rot: 0, sy: 0.97 },
  FREEZE:            { fwd: 0, up: 0, rot: 0, d: 40 },
  HAND_OUT:          { fwd: 2, up: 0, rot: 1 },
  WAVE_SMALL:        { fwd: 0, up: 2, rot: 0, osc: { axis: "rot", amp: 3, period: 0.5, beats: 2 } },
};

type Pending = { at: number; face: Face | null; pose: PoseId | null; hold: number };

/**
 * Trạng thái hiển thị của một người khách. Không đụng RNG của sim: jitter do người gọi
 * đưa vào (Service lấy từ stream `dialog-shufflebag`, cùng chỗ với độ trễ lời nói).
 */
export class ReactionState {
  face: Face = NEUTRAL;
  /** Mặt NỀN (mood xấu từ xa → lầm lì sẵn). Mặt phản ứng hết hạn thì trả về đây. */
  baseFace: Face = NEUTRAL;
  faceUntil = 0;
  pose: PoseId = "IDLE";
  basePose: PoseId = "IDLE";
  poseSince = 0;
  poseUntil = 0;
  /** Lần đổi mặt gần nhất — renderer dùng để giật đầu 1 px trong 90 ms (Celeste). */
  faceChangedAt = -1;
  private q: Pending[] = [];

  schedule(now: number, delay: number, face: Face | null, pose: PoseId | null, hold: number) {
    this.q.push({ at: now + delay, face, pose, hold });
  }

  tick(now: number) {
    for (let i = this.q.length - 1; i >= 0; i--) {
      const p = this.q[i];
      if (p.at > now) continue;
      this.q.splice(i, 1);
      if (p.face) { this.face = p.face; this.faceUntil = now + p.hold; this.faceChangedAt = now; }
      if (p.pose) { this.pose = p.pose; this.poseSince = now; this.poseUntil = now + Math.min(p.hold, 4); }
    }
    if (this.faceUntil && now >= this.faceUntil) { this.face = this.baseFace; this.faceUntil = 0; this.faceChangedAt = now; }
    if (this.poseUntil && now >= this.poseUntil) { this.pose = this.basePose; this.poseUntil = 0; this.poseSince = now; }
  }

  get pending() { return this.q.length; }
}

export { faceHoldSec };
