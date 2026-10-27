import type { Rng } from "../core/rng";
import LINES from "../content/reviews/lines.json";
import { monName, type MenuItemId } from "./menu";

export type Tone = "chanthat" | "nhat" | "vuitinh" | "haihuoc" | "ham";
export type Persona = "sinhvien" | "vanphong" | "colon" | "reviewer" | "khachquen";
export type Topic = keyof typeof RAW.loi;

const RAW = LINES as unknown as {
  loi: Record<string, Record<Tone, string[]>>;
  them: { tot: string[]; xau: string[] };
  ket: { tot: string[]; vua: string[]; xau: string[] };
  dan: string[];
  nghiem: string[];
  khongDan: { ids: string[] };
  ve: Record<string, string[]>;
  noi: { totXau: string[]; xauTot: string[] };
  khongTuongPhan: { ids: string[] };
  ky: Record<string, string>;
  persona: Record<Persona, string[]>;
  nhamQuan: string[];
  doiThu: string[];
  spam: string[];
  ten: string[];
  hiem: string[];
};

export const NHAM_QUAN = RAW.nhamQuan;
export const DOI_THU = RAW.doiThu;
export const SPAM = RAW.spam;
export const HIEM = RAW.hiem;
export const NAMES = RAW.ten;

export type TextSpec = {
  topic: Topic;
  /** Yếu tố trái chiều cùng lượt phục vụ — "ngon mỗi tội thấy không rửa tay". */
  contrast?: Topic | null;
  tone: Tone;
  persona: Persona;
  stars: number;
  mon: MenuItemId;
  /** Món gây lỗi vị; câu chê vị viết `{nl}`. */
  nl?: string;
};

export const GOOD_TOPICS = ["ngon", "gia-re", "cho-them", "tra-da", "troi-mua", "do-nghe-moi"] as const;
export const isGoodTopic = (t: string) => (GOOD_TOPICS as readonly string[]).includes(t);
export const canContrast = (t: string) => !RAW.khongTuongPhan.ids.includes(t) && !!RAW.ve[t];
export const hasClause = (t: string) => !!RAW.ve[t]?.length;

/** Giọng nào trống thì lùi về `chanthat`. */
function coreOf(topic: Topic, tone: Tone, rng: Rng): string {
  const byTone = RAW.loi[topic];
  const pool = byTone?.[tone]?.length ? byTone[tone] : byTone?.chanthat ?? [];
  return pool.length ? rng.pick(pool) : "";
}

/** Khen thì ngắn, chê thì dài — tỉ lệ lấy từ corpus (research §2). */
const extraOdds = (stars: number) => (stars >= 4 ? 0.35 : 0.6);
const closerOdds = (stars: number) => (stars >= 4 ? 0.4 : 0.45);
const personaOdds = 0.22;
const monOdds = 0.18;

/** Vế phụ không được nói lại câu lõi, cũng không được cãi vế trái chiều. */
function addOn(topics: (Topic | null)[], good: boolean, rng: Rng): string {
  const pool = good ? RAW.them.tot : RAW.them.xau;
  const ky = topics.map((t) => t && RAW.ky[t]).filter((k): k is string => !!k);
  const ok = pool.filter((x) => !ky.some((k) => x.includes(k)));
  return ok.length ? rng.pick(ok) : "";
}

const closers = (stars: number) => (stars >= 4 ? RAW.ket.tot : stars === 3 ? RAW.ket.vua : RAW.ket.xau);

/** Ý đã nói rồi thì lời kết đừng nói lại — "không bao giờ quay lại, không quay lại nữa". */
const KEY = ["quay lại", "cân nhắc", "thất vọng", "chỗ khác", "xem lại", "ủng hộ", "ghé", "thử"];
const trung = (a: string, b: string) => KEY.some((k) => a.includes(k) && b.includes(k));

export const reviewText = (rng: Rng, s: TextSpec): string => compose(rng, s).replaceAll("{nl}", s.nl ?? "nhân");

function compose(rng: Rng, s: TextSpec): string {
  const good = s.stars >= 4;
  const core = coreOf(s.topic, s.tone, rng);
  if (!core) return "";
  const parts = [core];
  if (s.tone === "nhat") return core;

  // Hai vế trái chiều: "bánh ngon, mỗi tội thấy không rửa tay".
  if (s.contrast && canContrast(s.topic) && hasClause(s.contrast)) {
    const noi = isGoodTopic(s.topic) ? RAW.noi.totXau : RAW.noi.xauTot;
    parts.push(`${rng.pick(noi)} ${rng.pick(RAW.ve[s.contrast])}`);
  }

  if (!RAW.khongDan.ids.includes(s.topic) && rng.next() < monOdds) {
    parts.unshift(rng.pick(RAW.dan).replace("{mon}", monName(s.mon)));
  }
  // Chuyện nặng thì không chêm vế vặt vào, nghe như đang kể chuyện khác.
  if (!RAW.nghiem.includes(s.topic)) {
    if (rng.next() < extraOdds(s.stars)) parts.push(addOn([s.topic, s.contrast ?? null], good, rng));
    if (rng.next() < personaOdds) parts.push(rng.pick(RAW.persona[s.persona]));
  }
  if (rng.next() < closerOdds(s.stars)) {
    const so_far = parts.join(" ");
    const pool = closers(s.stars).filter((c) => !trung(so_far, c));
    if (pool.length) parts.push(rng.pick(pool));
  }
  return parts.filter(Boolean).join(", ");
}
