/**
 * SỰ THẬT VỀ THẾ GIỚI, lúc một câu được nói ra — P2-07 §3, gộp vào một bảng đen ở P2-09 §2.2.
 *
 * File này KHÔNG còn là một từ vựng thứ hai. Nó chỉ làm đúng một việc: dịch *trạng thái
 * game* thành một `Query` của bảng đen, rồi để `dialog/gates.ts` trả lời. Bảng khoá nằm
 * ở `content/rules/_blackboard.json` mục `aliases` — một chỗ, cho cả rule DB lẫn cây thoại.
 *
 * Vì sao phải gộp (bản cũ có hai bảng): cùng một lỗi gõ sai, bảng của rule DB **ném lỗi
 * lúc nạp** còn bảng ở đây **im lặng trả `false`** — câu đó không bao giờ hiện, và không
 * ai biết. Hai chế độ hỏng ngược nhau cho cùng một sai lầm.
 *
 * Thuần dữ liệu: không Phaser, không đọc file. `Service` dựng `WorldSnapshot` mỗi lần cần
 * hỏi, rồi `holds()` trả lời.
 */
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
    tier: string;
    visits: number;
  };

  convo: {
    tones: readonly string[];
    warmth: number;
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

  season: {
    remembers: boolean;
  };

  hot: boolean;
  rain: boolean;
  peak: boolean;
  queue: number;
  shadeFree: boolean;
  seatFree: boolean;
  ganhOut: boolean;
  cartLan: boolean;
  cartChung: boolean;
  ovenHot: boolean;
  band: string;
  /**
   * Ngày thứ mấy của mùa — cho `w.day(N)`.
   *
   * Tên là `dayIndex` chứ không phải `day` vì `day` đã là TẦNG `d.*` (trong ngày) ở trên.
   * Hai thứ khác hẳn nhau: một cái là "hôm nay là ngày mấy của mùa", một cái là "sáng nay
   * đã xảy ra chuyện gì".
   */
  dayIndex: number;
};

/**
 * Trạng thái game → `Query`. Đây là CHỖ DUY NHẤT biết tên fact của bảng đen cho phía thoại.
 *
 * Fact *vắng mặt* khác fact *bằng false*: criterion trên fact vắng mặt làm rule BỊ LOẠI
 * (luật loại trừ của Ruskin). Nên mấy fact `conditional` dưới đây chỉ được `set` khi
 * chúng thật sự có mặt — `t.purpose(X)` phải sai với một người không có mục đích nào,
 * chứ không phải sai vì mục đích của họ khác X.
 */
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
  q.set("convoWarmth", Math.round(c.warmth));
  q.set("convoOpenedBy", c.openedBy);
  // Nhiều giọng cùng lúc: `convoTone` giữ giọng NẶNG NHẤT đã dùng, và mỗi giọng còn được
  // ghi riêng để `c.saidTone(X)` hỏi được từng cái — xem `toneMark`.
  for (const tone of c.tones) q.set("convoTone", tone);

  q.set("visitGaveTea", v.gaveTea);
  q.set("visitGaveFood", v.gaveFood);
  q.set("visitApologised", v.apologised);
  q.set("visitInviteRefused", v.inviteRefused);

  q.set("dayMetToday", d.met);

  q.set("seasonVisits", Math.max(0, Math.round(t.visits)));
  q.set("seasonTier", t.tier);
  if (w.season.remembers) q.set("seasonRemembers", true);

  q.set("worldHot", w.hot);
  q.set("worldRain", w.rain);
  q.set("worldPeak", w.peak);
  q.set("worldBand", w.band);
  q.set("worldShadeFree", w.shadeFree);
  q.set("worldSeatFree", w.seatFree);
  q.set("worldGanhOut", w.ganhOut);
  q.set("worldCartLan", w.cartLan);
  q.set("worldCartChung", w.cartChung);
  q.set("worldOvenHot", w.ovenHot);
  q.set("queueLength", Math.max(0, Math.round(w.queue)));
  q.set("day", Math.max(1, Math.round(w.dayIndex)));
  return q;
}

/**
 * Khoá đa trị (`c.saidTone(GAT)`, `v.promised(ROT_TRA)`, `d.toldMe(X)`) hỏi về MỘT phần
 * tử của một tập, mà `Query` chỉ giữ được một giá trị cho mỗi fact. Nên ba khoá đó không
 * đi qua `Query`: chúng tra thẳng tập trong snapshot. Ba trường hợp, khai hết ở đây để
 * không ai phải đi tìm.
 */
const SET_KEYS: Record<string, (w: WorldSnapshot, arg: string) => boolean> = {
  "c.saidTone": (w, a) => w.convo.tones.includes(a),
  "v.promised": (w, a) => w.visit.promised.includes(a),
  "d.toldMe":   (w, a) => w.day.told.includes(a),
};

const SCRATCH = new Query();

/**
 * Một khoá có đúng không.
 *
 * Khoá lạ **ném lỗi** — khác hẳn bản cũ (im lặng trả `false`). Chỗ chặn thật nằm ở
 * `tools/validate-talks.ts` + test `W-4`: cả hai quét toàn bộ nội dung lúc build, nên
 * một chữ gõ sai không bao giờ đi được tới tay người chơi.
 */
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
