import type { SaveFile } from "../core/save";
import { Rng, fnv1a, splitmix32 } from "../core/rng";
import type { MenuItemId } from "./menu";
import {
  DOI_THU, HIEM, NAMES, NHAM_QUAN, SPAM, canContrast, hasClause, isGoodTopic, reviewText,
  type Persona, type Tone, type Topic,
} from "./reviewText";

export type Review = {
  id: number;
  day: number;
  who: string;
  stars: number;
  text: string;
  /** Đánh giá đau bụng, không sửa được. */
  food: boolean;
  edited: boolean;
  /** Lời chủ quán trả lời dưới đánh giá. */
  reply?: string;
};

/** Đánh giá đã hẹn giờ nhưng chưa hiện lên app. */
export type Pending = { at: number; r: Omit<Review, "id" | "edited"> };

export type ReviewState = {
  seq: number;
  list: Review[];
  queue: Pending[];
  /** Số lượt đã lăn trong ván, để mỗi lượt có dòng ngẫu nhiên riêng kể cả khi vào lại giữa ngày. */
  rolls: number;
  /** Mã đánh giá cuối đã xem trong app, để đếm badge. */
  seen: number;
};

export const newReviews = (): ReviewState => ({ seq: 0, list: [], queue: [], rolls: 0, seen: 0 });

/** Sao viết theo kiểu Việt: 3,6. */
export const starText = (n: number) => n.toFixed(1).replace(".", ",");

/** Đánh giá chưa mở app xem. */
export const unseen = (w: SaveFile) => w.reviews.list.filter((r) => r.id > (w.reviews.seen ?? 0)).length;

export const markSeen = (w: SaveFile) => { w.reviews.seen = w.reviews.seq; };

export const COMMENT_MAX = 200;
export const REPLY_MAX = 200;

/** Chỉ sửa được đánh giá trong chừng này ngày. */
export const FIX_WINDOW_DAYS = 7;

/** Cửa sổ đếm đánh giá đau bụng cho luật đóng cửa. */
export const SICK_WINDOW_DAYS = 14;
export const SICK_SOFT = 10;
export const SICK_HARD = 12;
export const SICK_STAR_GATE = 3;

export function addReview(w: SaveFile, r: Omit<Review, "id" | "edited">): Review {
  const review = { ...r, id: ++w.reviews.seq, edited: false };
  w.reviews.list.unshift(review);
  return review;
}

export const fixable = (r: Review, day: number) =>
  !r.food && !r.edited && !r.reply && day - r.day <= FIX_WINDOW_DAYS;

export function average(w: SaveFile): number {
  const l = w.reviews.list;
  return l.length ? l.reduce((a, r) => a + r.stars, 0) / l.length : 0;
}

/** Số đánh giá mỗi mức sao, từ 1★ tới 5★. */
export function spread(w: SaveFile): number[] {
  const out = [0, 0, 0, 0, 0];
  for (const r of w.reviews.list) out[Math.min(4, Math.max(0, r.stars - 1))]++;
  return out;
}

/** Dùng một Hồi Tâm Chuyển Ý: sửa số sao và/hoặc lời; không đổi gì thì không mất thẻ. */
export function applyFix(w: SaveFile, id: number, next: { stars: number; text: string }): boolean {
  const r = w.reviews.list.find((x) => x.id === id);
  if (!r || !fixable(r, w.progress.dayIndex) || w.system.fix <= 0) return false;
  const stars = Math.min(5, Math.max(1, Math.round(next.stars)));
  const text = next.text.trim().slice(0, COMMENT_MAX);
  if (stars === r.stars && text === r.text) return false;
  r.stars = stars;
  r.text = text;
  r.edited = true;
  w.system.fix--;
  return true;
}

export function reply(w: SaveFile, id: number, text: string): boolean {
  const r = w.reviews.list.find((x) => x.id === id);
  const t = text.trim().slice(0, REPLY_MAX);
  if (!r || !t) return false;
  r.reply = t;
  return true;
}

// ---------------------------------------------------------------- chấm sao

/** Những gì một lượt phục vụ để lại, đủ để chấm sao. */
export type ServeRecord = {
  mon: MenuItemId;
  who: string;
  /** Điểm lỗi tích luỹ từ `service.silentScore`; 0 là không lỗi gì. */
  silentScore: number;
  /** Khớp khẩu vị, 0…1. */
  sat: number;
  /** Chất lượng ổ, 0…1 — hàng dỏm và hàng để lâu đều kéo xuống. */
  quality?: number;
  pricePick: number;
  waitStage: number;
  sick: boolean;
  /** Lỗi nặng nhất khách thấy, để chọn câu. */
  defect: string | null;
  /** Khách vãng lai: `who` chỉ là dáng người, đánh giá phải mượn tên khác. */
  anon?: boolean;
  dirtyHands?: boolean;
  gaveExtra?: boolean;
  gaveTea?: boolean;
  wasCut?: boolean;
  rain?: boolean;
  loaOn?: boolean;
  freshGear?: boolean;
};

const SCORE_PER_STAR = 35;
const SAT_WEIGHT = 1.2;
const WAIT_PENALTY = 0.3;
/** Hụt chất lượng dưới mức này thì không ai để ý. */
const QUALITY_FREE = 0.08;
/** Mốc hụt của hàng dỏm so với hàng thường. */
const QUALITY_SPAN = 0.2;
const QUALITY_WEIGHT = 2.2;

/**
 * Phạt luỹ tiến, không tuyến tính: hàng thường để qua đêm chỉ hụt chút nên gần như không sao,
 * hàng dỏm hụt gấp bốn lần thì mất hẳn mấy sao.
 */
function qualityPenalty(quality = 1): number {
  const over = Math.max(0, 1 - quality - QUALITY_FREE) / QUALITY_SPAN;
  return over * over * QUALITY_WEIGHT;
}
export const PRICE_STAR = [0.3, 0, -0.35];

/** Tỉ lệ khách chịu viết đánh giá, theo số sao họ định chấm. */
const WRITE_ODDS = [0.5, 0.35, 0.12, 0.18, 0.3];
/** Khách đau bụng chịu viết — chốt ở `R0.7-PLAN.md` §9. */
const WRITE_ODDS_SICK = 0.4;
/** Đánh giá chỉ có sao, không chữ. */
const SILENT_ODDS = 0.18;

/**
 * Trần sao cho thứ khách chỉ biết khi đã ăn. Cho thêm nhân không chuộc được —
 * `silentScore` không đếm mấy lỗi này, không chặn thì ổ bẩn vẫn ra 5★.
 */
const STAR_CAP: Record<string, number> = { "co-san": 2, "tay-ban": 2, "het-banh": 3 };

export function starsOf(r: ServeRecord, rng: Rng): number {
  if (r.sick) return rng.next() < 0.6 ? 1 : 2;
  let s = 5 - r.silentScore / SCORE_PER_STAR;
  s += (r.sat - 0.6) * SAT_WEIGHT;
  // `TASTE_OFF` là lỗi nhị phân nên không phân biệt dỏm hẳn với hơi cũ — chỗ này phân biệt.
  s -= qualityPenalty(r.quality);
  s += PRICE_STAR[r.pricePick] ?? 0;
  s -= r.waitStage * WAIT_PENALTY;
  s += rng.range(-0.4, 0.4);
  return Math.min(capOf(r), Math.max(1, Math.round(s)));
}

/** Trần thấp nhất trong mọi thứ đáng phàn nàn của lượt này. */
function capOf(r: ServeRecord): number {
  let cap = 5;
  if (r.defect) cap = Math.min(cap, STAR_CAP[r.defect] ?? 5);
  if (r.dirtyHands) cap = Math.min(cap, STAR_CAP["tay-ban"]);
  return cap;
}

const PERSONAS: Persona[] = ["sinhvien", "vanphong", "colon", "reviewer", "khachquen"];

/** Giọng hãm chỉ hợp lúc chê; giọng vui chỉ hợp lúc khen. */
function toneFor(stars: number, sick: boolean, rng: Rng): Tone {
  if (sick) return rng.next() < 0.75 ? "ham" : "chanthat";
  if (stars <= 2) return rng.pick(["ham", "chanthat", "chanthat", "haihuoc"]);
  if (stars === 3) return rng.pick(["chanthat", "nhat", "nhat", "haihuoc"]);
  return rng.pick(["chanthat", "vuitinh", "vuitinh", "nhat", "haihuoc"]);
}

/** Mọi thứ đáng nhắc trong lượt này, nặng trước nhẹ sau. */
function factorsOf(r: ServeRecord, stars: number): Topic[] {
  const out: Topic[] = [];
  if (r.sick) out.push("dau-bung");
  if (r.defect) out.push(r.defect as Topic);
  if (r.dirtyHands) out.push("tay-ban");
  if (r.wasCut) out.push("chen-hang");
  if (r.loaOn) out.push("loa-on");
  if (r.waitStage >= 2) out.push("cho-lau");
  if (r.pricePick === 2) out.push("gia-dat");

  if (r.gaveExtra) out.push("cho-them");
  if (r.gaveTea) out.push("tra-da");
  if (r.rain) out.push("troi-mua");
  if (r.freshGear) out.push("do-nghe-moi");
  if (r.pricePick === 0) out.push("gia-re");
  if (stars >= 4) out.push("ngon");
  return out;
}

/**
 * Vế chính là yếu tố nặng nhất hợp với số sao đã chấm; vế trái chiều lấy từ phía còn lại.
 * Chấm 2★ thì không mở bằng câu khen, và ngược lại.
 */
function pickTopics(r: ServeRecord, stars: number, rng: Rng): { topic: Topic; contrast: Topic | null } {
  const all = factorsOf(r, stars);
  const good = all.filter((t) => isGoodTopic(t));
  const bad = all.filter((t) => !isGoodTopic(t));
  const wantGood = stars >= 4;
  // Chuyện quanh quán chỉ thỉnh thoảng mới thành vế chính, không thì ngày mưa ai cũng kể chuyện mưa.
  const quanh = good.filter((t) => t !== "ngon");
  // Chấm sao thấp mà không có gì để chê thì nói là bình thường, đừng mở bằng lời khen.
  const main = wantGood
    ? (quanh.length && rng.next() < SITUATION_ODDS ? rng.pick(quanh) : good.includes("ngon") ? "ngon" : quanh[0] ?? "ngon")
    : bad[0] ?? "nhat-nheo";

  const other = (wantGood ? bad : good).filter((t) => t !== main && hasClause(t));
  const contrast = other.length && canContrast(main) && rng.next() < CONTRAST_ODDS ? rng.pick(other) : null;
  return { topic: main as Topic, contrast };
}

/** Bao nhiêu phần đánh giá có cả hai vế. */
const CONTRAST_ODDS = 0.45;

/** Bao nhiêu phần lời khen mở bằng chuyện quanh quán thay vì chuyện ổ bánh. */
const SITUATION_ODDS = 0.35;

/** Lăn một lượt phục vụ thành đánh giá, hoặc không. `at` là phút trong ngày. */
export function rollReview(w: SaveFile, rec: ServeRecord, at: number): Pending | null {
  const day = w.progress.dayIndex;
  const seq = w.reviews.rolls ?? 0;
  w.reviews.rolls = seq + 1;
  const rng = new Rng(splitmix32(fnv1a(`${w.saveId}|rev|${day}|${seq}`)));
  const raw = starsOf(rec, rng);
  const { topic, contrast } = pickTopics(rec, raw, rng);
  // Đã chịu nói ra một lời chê thì không còn là ổ trọn vẹn — chặn "5★ mà bánh sém một bên".
  const stars = contrast && !isGoodTopic(contrast) ? Math.min(raw, 4) : raw;
  const odds = rec.sick ? WRITE_ODDS_SICK : WRITE_ODDS[stars - 1];
  if (rng.next() >= odds) return null;
  const silent = !rec.sick && rng.next() < SILENT_ODDS;
  return {
    at: at + rng.int(2, 9),
    r: {
      day,
      who: rec.anon ? anonName(w, day, seq) : rec.who,
      stars,
      text: silent ? "" : reviewText(rng, {
        topic,
        contrast,
        tone: toneFor(stars, rec.sick, rng),
        persona: rng.pick(PERSONAS),
        stars,
        mon: rec.mon,
      }),
      food: rec.sick,
    },
  };
}

/** Người lạ trong quán gọi theo dáng, nhưng trên app đánh giá thì ai cũng có tên. */
const anonName = (w: SaveFile, day: number, seq: number) =>
  NAMES[fnv1a(`${w.saveId}|who|${day}|${seq}`) % NAMES.length];

export const enqueue = (w: SaveFile, p: Pending) => w.reviews.queue.push(p);

// ----------------------------------------------------------------- nhiễu

/** Phần đánh giá KHÔNG đến từ khách thật, tính theo tỉ lệ trên tổng đánh giá. */
const NOISE_SHARE = { nham: 0.02, doiThu: 0.05, spam: 0.01, hiem: 0.01 };
/** Đối thủ chỉ ra tay khi quán đã có tiếng. */
const DOI_THU_FROM = 20;

/** Ước số đánh giá hôm nay theo số ổ bán hôm qua. */
function expected(w: SaveFile): number {
  const last = w.ledger[w.ledger.length - 1];
  return Math.max(4, last?.served ?? 10) * 0.25;
}

/** Đầu ngày: hẹn giờ cho đánh giá nhiễu. Gọi một lần mỗi ngày. */
export function dailyNoise(w: SaveFile, from: number, to: number): void {
  const day = w.progress.dayIndex;
  const rng = new Rng(splitmix32(fnv1a(`${w.saveId}|noise|${day}`)));
  const n = expected(w);
  const put = (text: string, stars: number, who: string) =>
    enqueue(w, { at: rng.int(from, to), r: { day, who, stars, text, food: false } });

  if (rng.next() < NOISE_SHARE.nham * n) put(rng.pick(NHAM_QUAN), rng.int(1, 4), rng.pick(NAMES));
  if (w.reviews.list.length >= DOI_THU_FROM && rng.next() < NOISE_SHARE.doiThu * n) {
    put(rng.pick(DOI_THU), rng.int(1, 3), rng.pick(NAMES));
  }
  if (rng.next() < NOISE_SHARE.spam * n) put(rng.pick(SPAM), rng.int(1, 6), rng.pick(NAMES));
  if (rng.next() < NOISE_SHARE.hiem * n) put(rng.pick(HIEM), rng.int(4, 6), rng.pick(NAMES));
}

/** Đánh giá tới giờ thì lên app; trả về những cái vừa hiện để báo. */
export function dueReviews(w: SaveFile, minutes: number): Review[] {
  const out: Review[] = [];
  const left: Pending[] = [];
  for (const p of w.reviews.queue) {
    if (p.at <= minutes) out.push(addReview(w, p.r));
    else left.push(p);
  }
  w.reviews.queue = left;
  return out;
}

/** Hàng chờ không được sống qua đêm — đánh giá còn treo thì đổ hết vào cuối ngày. */
export function flushQueue(w: SaveFile): Review[] {
  const out = w.reviews.queue.map((p) => addReview(w, p.r));
  w.reviews.queue = [];
  return out;
}

// ------------------------------------------------------------- an toàn thực phẩm

/** Đánh giá đau bụng trong cửa sổ trượt. */
export function sickWindow(w: SaveFile): number {
  const from = w.progress.dayIndex - SICK_WINDOW_DAYS;
  return w.reviews.list.filter((r) => r.food && r.day > from).length;
}

export type Attp = { n: number; closed: boolean; warn: boolean };

export function attpCheck(w: SaveFile): Attp {
  const n = sickWindow(w);
  const closed = n > SICK_HARD || (n > SICK_SOFT && average(w) <= SICK_STAR_GATE);
  return { n, closed, warn: !closed && n >= SICK_SOFT - 4 };
}

/** Chốt lúc đi ngủ, như `sim/broke.markBroke`. */
export function markShutdown(w: SaveFile): boolean {
  if (w.flags.shutdown) return true;
  if (!attpCheck(w).closed) return false;
  w.flags.shutdown = true;
  w.flags.shutdownDay = w.progress.dayIndex;
  return true;
}
