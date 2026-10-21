// Người đi ngang không đụng kinh tế (không gọi món, không tính `ahead`/`peakCap`/`audience`); chỉ thành khách khi người chơi mời.
import type { Rng } from "../core/rng";
import type { TimeBand } from "../core/clock";
import { STREET_LANES, STREET_X } from "../world/map";
import { WALKIN_STYLES } from "../content/npcs";

/** Trần an toàn, nhịp độ nằm ở `GAP_SEC`. */
export const PASSERS_MAX = 5;

/** Giây thật, vì đồng hồ game tua nhanh khi quầy trống. */
export const GAP_SEC: Record<TimeBand, readonly [number, number]> = {
  PRE_OPEN: [6, 14],
  PEAK: [2.6, 6],
  MID: [4.5, 10],
  LULL: [8, 18],
};

/** Nhân vào khoảng cách giữa hai người. */
export const RAIN_GAP_MUL = 1.7;

/** Phải là thiểu số, ai cũng ngoái thì cái ngoái hết nghĩa. */
export const GLANCE_CHANCE = 0.3;

/** Giây thật; dưới 1 s trông như giật chân. */
export const GLANCE_SEC: readonly [number, number] = [1.1, 2.6];

export const SPEED_MUL: readonly [number, number] = [0.8, 1.25];

/** Khớp 1–1 theo chỉ số với `WALKIN_STYLES`. */
export const PASSER_NAMES = [
  "người đi đường", "chị đeo khẩu trang", "cô xách giỏ", "bà cụ",
  "cô nón lá", "anh chạy xe", "chị áo hồng", "chú đeo kính",
];

export type PassPlan = {
  /** Chỉ số trong `STREET_LANES`. */
  lane: number;
  /** Luôn nằm ngoài khung nhìn. */
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** `null` = đi thẳng, không ngoái. */
  spot: { x: number; y: number } | null;
  stay: number;
  speed: number;
  /** Chỉ số trong `WALKIN_STYLES` / `PASSER_NAMES`. */
  style: number;
};

/** Rút đúng một số, thêm lần rút là lệch mọi golden của dòng `passer`. */
export function nextGapSec(band: TimeBand, raining: boolean, rng: Rng): number {
  const [lo, hi] = GAP_SEC[band];
  return rng.range(lo, hi) * (raining ? RAIN_GAP_MUL : 1);
}

/** Thứ tự rút số là hợp đồng mà `p6-passersby` neo vào, đừng chèn thêm. */
export function planPasser(rng: Rng, counterX: number): PassPlan {
  const rightward = rng.next() < 0.5;
  const lane = rng.int(0, STREET_LANES.length);
  const y = STREET_LANES[lane].y;
  const style = rng.int(0, WALKIN_STYLES.length);
  const speed = rng.range(SPEED_MUL[0], SPEED_MUL[1]);
  const glances = rng.next() < GLANCE_CHANCE;
  const stay = glances ? rng.range(GLANCE_SEC[0], GLANCE_SEC[1]) : 0;
  const spotX = glances ? counterX + rng.range(-1, 1) : 0;

  const [x0, x1] = STREET_X;
  const from = { x: rightward ? x0 : x1, y };
  const to = { x: rightward ? x1 : x0, y };
  return { lane, from, to, spot: glances ? { x: spotX, y } : null, stay, speed, style };
}

/** Đo bằng ô bản đồ, không theo mép khung nhìn vì camera bám người chơi làm nhấp nháy. */
export const FADE_TILES = 1.5;

export function passerAlpha(x: number): number {
  const [x0, x1] = STREET_X;
  const d = Math.min(x - x0, x1 - x);
  return Math.max(0, Math.min(1, d / FADE_TILES));
}

export const INVITE_MAX = 0.8;
export const INVITE_BASE = 0.2;
/** Giọng không có ở đây (gắt, lạnh…) thì xác suất bằng 0. */
export const INVITE_TONE: Record<string, number> = {
  AM: 0.2, DUA: 0.08, THUONG: 0.04, THANG: -0.04,
};

export type InviteCtx = {
  /** `thanThien` ấm · `deTha` xuề xoà · `soi` kỹ tính. */
  person: { soi: number; deTha: number; thanThien: number };
  glanced: boolean;
  tone: string;
  ahead: number;
  slots: number;
  soldOut: boolean;
};

export function inviteChance(o: InviteCtx): number {
  if (o.soldOut) return 0;
  const tone = INVITE_TONE[o.tone];
  if (tone === undefined) return 0;
  if (o.ahead >= o.slots) return 0;
  const p = INVITE_BASE
    + tone
    + (o.glanced ? 0.24 : 0)
    + 0.15 * o.person.thanThien + 0.1 * o.person.deTha - 0.1 * o.person.soi
    - 0.13 * o.ahead;
  return Math.max(0, Math.min(INVITE_MAX, p));
}
