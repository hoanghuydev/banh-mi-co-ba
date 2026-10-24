// Dịch trạng thái game thành `Query` của bảng đen; khoá nằm ở `content/rules/_blackboard.json` mục `aliases`.
import { Query } from "../dialog/facts";
import {
  ALIAS_FLAGS, ALIAS_FNS, allGates, checkGate, firstBrokenGate, gateHolds, isStoryFlag,
} from "../dialog/gates";
import type { PracticeId } from "../content/vocab";

export type WorldSnapshot = {
  hand: string;
  handsDirty: boolean;
  onStreet: boolean;
  soldOut: boolean;
  cash: number;
  teaLeft: number;
  stock: number;

  them: {
    phase: string;
    practice: PracticeId;
    passing: boolean;
    served: boolean;
    named: boolean;
    cutLine: boolean;
    blocking: boolean;
    glanced: boolean;
    lookingInside: boolean;
    inShade: boolean;
    sitting: boolean;
    filming: boolean;
    onPhone: boolean;
    eating: boolean;
    hasOrder: boolean;
    waitRatio: number;
    purpose: string | null;
    state: string | null;
  };

  convo: {
    tones: readonly string[];
    angered: boolean;
    openedBy: "PLAYER" | "NPC";
  };

  visit: {
    gaveTea: boolean;
    gaveFood: boolean;
    apologised: boolean;
    promised: readonly string[];
    inviteRefused: boolean;
  };

  day: {
    met: boolean;
    told: readonly string[];
  };

  hot: boolean;
  rain: boolean;
  peak: boolean;
  queue: number;
  shadeFree: boolean;
  seatFree: boolean;
  /** Ổ đầy đủ đã lên bảng menu. */
  menuDayDu: boolean;
  ovenHot: boolean;
  /** Mẻ vừa ra lò — hẹp hơn `ovenHot` vốn đúng suốt lúc lò đang nhen. */
  meVuaRa: boolean;
  band: string;
  /** Ngày thứ mấy của ván; `day` ở trên là tầng `d.*` (chuyện trong ngày). */
  dayIndex: number;
};

/** Fact vắng mặt làm rule bị loại (khác fact bằng false), nên fact điều kiện chỉ `set` khi có mặt. */
export function queryOf(w: WorldSnapshot, q = new Query()): Query {
  q.reset();
  const t = w.them, c = w.convo, v = w.visit, d = w.day;

  q.set("playerHolding", w.hand);
  q.set("playerHandsDirty", w.handsDirty);
  q.set("playerOnStreet", w.onStreet);
  q.set("playerSoldOut", w.soldOut);
  q.set("playerCash", Math.max(0, Math.round(w.cash)));
  q.set("playerTeaLeft", Math.max(0, Math.round(w.teaLeft)));
  q.set("playerStock", Math.max(0, Math.round(w.stock)));

  q.set("npcPhase", t.phase);
  q.set("npcPractice", t.practice);
  q.set("npcPassing", t.passing);
  q.set("npcServed", t.served);
  q.set("npcNamed", t.named);
  q.set("npcCutLine", t.cutLine);
  q.set("npcBlocking", t.blocking);
  q.set("npcGlanced", t.glanced);
  q.set("npcLookingInside", t.lookingInside);
  q.set("npcInShade", t.inShade);
  q.set("npcSitting", t.sitting);
  q.set("npcFilming", t.filming);
  q.set("npcOnPhone", t.onPhone);
  q.set("npcEating", t.eating);
  q.set("npcHasOrder", t.hasOrder);
  q.set("npcWaitRatio", Math.round(Math.max(0, Math.min(1, t.waitRatio)) * 100));
  if (t.purpose) q.set("npcPurpose", t.purpose);
  if (t.state) q.set("npcState", t.state);

  q.set("convoAngered", c.angered);
  q.set("convoOpenedBy", c.openedBy);
  // `convoTone` giữ giọng NẶNG NHẤT đã dùng.
  for (const tone of c.tones) q.set("convoTone", tone);

  q.set("visitGaveTea", v.gaveTea);
  q.set("visitGaveFood", v.gaveFood);
  q.set("visitApologised", v.apologised);
  q.set("visitInviteRefused", v.inviteRefused);

  q.set("dayMetToday", d.met);

  q.set("worldHot", w.hot);
  q.set("worldRain", w.rain);
  q.set("worldPeak", w.peak);
  q.set("worldBand", w.band);
  q.set("worldShadeFree", w.shadeFree);
  q.set("worldSeatFree", w.seatFree);
  q.set("worldMenuDayDu", w.menuDayDu);
  q.set("worldOvenHot", w.ovenHot);
  q.set("worldMeVuaRa", w.meVuaRa);
  q.set("queueLength", Math.max(0, Math.round(w.queue)));
  q.set("day", Math.max(1, Math.round(w.dayIndex)));
  return q;
}

/** Khoá đa trị tra thẳng tập trong snapshot vì `Query` chỉ giữ một giá trị mỗi fact. */
const SET_KEYS: Record<string, (w: WorldSnapshot, arg: string) => boolean> = {
  "c.saidTone": (w, a) => w.convo.tones.includes(a),
  "v.promised": (w, a) => w.visit.promised.includes(a),
  "d.toldMe":   (w, a) => w.day.told.includes(a),
};

const SCRATCH = new Query();

/** Khoá lạ ném lỗi; `tools/validate-talks.ts` chặn trước lúc build. */
export function holds(key: string, w: WorldSnapshot): boolean {
  const neg = key.startsWith("!");
  const body = neg ? key.slice(1) : key;
  const call = /^([a-z]\.[a-zA-Z]+)\((.*)\)$/.exec(body);
  const set = call ? SET_KEYS[call[1]] : undefined;
  if (set) return neg !== set(w, call![2]);
  return gateHolds(key, queryOf(w, SCRATCH));
}

export const allHold = (keys: readonly string[] | undefined, w: WorldSnapshot) =>
  !keys?.length || keys.every((k) => holds(k, w));

export const firstBroken = (keys: readonly string[] | undefined, w: WorldSnapshot) =>
  keys?.find((k) => !holds(k, w)) ?? null;

export const FACT_KEYS: readonly string[] = ALIAS_FLAGS;
export const FACT_FNS: readonly string[] = ALIAS_FNS;

export { allGates, checkGate, firstBrokenGate, isStoryFlag };
