/**
 * Chỗ đứng — P3-05. Một xe, một chỗ (CD-1). Chi phí thật của dời chỗ là QUAN HỆ, không phải
 * tiền (CD-2): người quen đi theo hay không là do mình quen họ tới đâu, họ mở lòng tới đâu,
 * chỗ mới xa cỡ nào, mình báo trước mấy ngày, và chỗ mới có nằm trên đường họ đi không.
 *
 *   p = min(0,90, base[bucket] · (0,40 + 0,60·thanThien) · distance · notice · onRoute)
 *
 * Không bao giờ hiện p, localRep, hay điểm của chỗ đứng (P3-05 §6). Ai đi theo thì sáng mai
 * người ta tự tới — đó là cách duy nhất biết.
 */
import STANDS_JSON from "../content/econ/stands.json";
import { NPCS } from "../content/npcs";
import { Rng } from "../core/rng";
import type { RelTier } from "../core/types";
import type { EconState } from "./obligations";

export type StandId = EconState["stand"];
type StandDef = { name: string; push: number; walkIn: number; gaze: number; patience: number; gossip: number; rain: number;
  rivals: number; shelter?: boolean; blurb: string };
type AlleyEvent = { id: string; fromDay: number; toDay: number; mul: Partial<Record<StandId, number>>; warnFrom: number; line: string; needsKietFriend?: boolean };

const J = STANDS_JSON as unknown as {
  stands: Record<StandId, StandDef>; distance: Record<string, number>; onRoute: Record<string, string[]>;
  events: AlleyEvent[]; move: { cooldownDays: number; dayRevenueMul: number; followBase: Record<RelTier, number> };
};
export const STANDS = J.stands;
export const STAND_IDS = Object.keys(STANDS) as StandId[];
export const ALLEY_EVENTS = J.events;
export const MOVE = J.move;

export const distanceMul = (a: StandId, b: StandId) => J.distance[`${a}-${b}`] ?? J.distance[`${b}-${a}`] ?? 0.35;
export const onRoute = (npc: string, s: StandId) => s === "L1" || (J.onRoute[s] ?? []).includes(npc);

/** Hệ số khách vãng lai của chỗ đứng hôm nay, đã tính sự kiện hẻm và mưa có mái che hay không. */
export function standDayMul(s: StandId, day: number, rain: boolean) {
  let m = STANDS[s].walkIn;
  for (const e of ALLEY_EVENTS) if (day >= e.fromDay && day <= e.toDay && e.mul[s] !== undefined) m *= e.mul[s]!;
  // mưa: chỗ có mái che đỡ hơn (doc: đầu hẻm ×0,60; chợ −18%; góc khuất −22%) — tính tương đối so với ×0,60 chung
  if (rain) m *= STANDS[s].rain / 0.60;
  return m;
}
/** Chỗ này hôm nay có bán được không (đám cưới chắn đầu hẻm, ngập chợ, sửa đường…). */
export const standClosed = (s: StandId, day: number) => ALLEY_EVENTS.some((e) => day >= e.fromDay && day <= e.toDay && e.mul[s] === 0);

/** Lời báo trước sự kiện hẻm — NÓI RA 2–4 ngày trước, ít nhất một prop (P3-05 §2.5). */
export function alleyRumours(day: number, kietFriend: boolean) {
  return ALLEY_EVENTS.filter((e) => day >= e.warnFrom && day < e.fromDay && (!e.needsKietFriend || kietFriend)).map((e) => e.line);
}

export type MovePlan = { to: StandId; postedDay: number; moveDay: number };

export function followChance(npc: string, tier: RelTier, thanThien: number, from: StandId, to: StandId, noticeDays: number) {
  if (to === "L1") return 1;                                        // về lại đầu hẻm: người trong hẻm vẫn ở đó
  const base = MOVE.followBase[tier] ?? 0;
  const notice = noticeDays >= 3 ? 1.25 : noticeDays >= 1 ? 1.0 : 0.7;
  const route = onRoute(npc, to) ? 1.0 : 0.3;
  return Math.min(0.9, base * (0.4 + 0.6 * thanThien) * distanceMul(from, to) * notice * route);
}

/**
 * Ngày dời: rút ai đi theo (tất định theo mùa). Người không đi theo thì không ghé chỗ mới — lần
 * ghé bị lỡ vẫn tính (quan hệ nguội dần). Dời mà KHÔNG báo trước: người im lặng (chị Lan) mất
 * hẳn — đứng ở chỗ cái xe từng đậu, nhìn một lúc, rồi đi (P3-05 §2.3).
 *
 * `noticeDays === 0` = tờ giấy chưa từng được dán ngày nào. Ba nút ở màn tối đều dán giấy
 * (1/2/4 ngày) nên nhánh này KHÔNG phải cái người chơi bấm nhầm phải — nó là luật canon,
 * để dành cho đường dời không qua `postMove`.
 */
export function resolveFollowers(saveId: string, day: number, from: StandId, to: StandId, noticeDays: number,
  tierOf: (id: string) => RelTier, gone: (id: string) => boolean) {
  const followers: string[] = [], abandoned: string[] = [];
  for (const n of NPCS) {
    if (gone(n.id)) continue;
    const p = followChance(n.id, tierOf(n.id), n.personality.thanThien, from, to, noticeDays);
    const r = Rng.forSeason(saveId, `follow:${n.id}:${day}`).next();
    if (r < p) followers.push(n.id);
    else if (noticeDays === 0 && n.id === "CHI_LAN") abandoned.push(n.id);
  }
  return { followers, abandoned };
}
