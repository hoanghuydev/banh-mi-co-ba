/**
 * Cấu trúc mùa 40 ngày — P4-02. Đọc `content/season/days.json` (nguồn DUY NHẤT của lịch:
 * trời, hồi, sự kiện kịch bản, mốc arc, tín hiệu báo trước) và trả lời những câu hỏi mà
 * các hệ khác cần: hôm nay hồi mấy, cái gì đã mở, đồn thổi đã được phép chưa.
 *
 * KHÔNG một thứ gì ở đây được hiện ra màn hình (P4-02 §4): hồi, cân bằng, tín hiệu là
 * khái niệm của người làm game. Người chơi chỉ thấy trời, người, và lời nói.
 */
import SEASON from "../content/season/days.json";
import type { Weather } from "../core/types";

export type Balance = "++" | "+" | "·" | "−" | "−−";
export type Act = 1 | 2 | 3 | 4;
export type SignalKind = "loi_noi" | "hanh_vi";

export type DaySpec = {
  day: number;
  weekday: "T2" | "T3" | "T4" | "T5" | "T6" | "T7" | "CN";
  weather: Weather;
  act: Act;
  target: { total: number; peak: 1 | 2 | 3 | 4 };
  events: string[];
  beats: [string, string][];
  balance: Balance[];
  absent?: string[];
  telegraph?: [string, string, SignalKind][];
  notebookLine?: string;
  note?: string;
};

type Unlocks = { gossip: { day: number; playMinutes: number }; creditBook: number; notebookWrite: number;
  supplierTiers: number; qr: number; evening: number; stands: number };

const J = SEASON as unknown as { days: DaySpec[]; unlocks: Unlocks; departures: { npc: string; departureDay: number; result: string }[] };

export const DAYS: readonly DaySpec[] = J.days;
export const UNLOCKS = J.unlocks;
export const DEPARTURES = J.departures;

export const daySpec = (day: number): DaySpec => DAYS[Math.max(0, Math.min(DAYS.length - 1, day - 1))];
export const actOf = (day: number): Act => daySpec(day).act;
export const hasEvent = (day: number, id: string) => daySpec(day).events.includes(id);

// ─────────────────────────────────────────────────────────────── cổng mở khoá (§2.2)

/**
 * CANON §12.6 + P4-02 §2.3: đồn thổi và nhớ nhầm KHÔNG xảy ra trong 2 giờ chơi đầu —
 * diễn dịch vận hành: ngày ≥ 9 HOẶC ≥ 90 phút chơi thật (cái nào tới trước). Nhánh
 * `playtime` để người chơi chậm vẫn gặp cú lộ trước ranh giới hoàn tiền Steam.
 */
export function gossipOpen(day: number, playMs: number) {
  return day >= UNLOCKS.gossip.day || playMs >= UNLOCKS.gossip.playMinutes * 60_000;
}
/** Cô Mai đưa cuốn sổ caro ngày 9 (SK-20). Trước đó bán chịu thì chỉ nhớ trong đầu. */
export const creditBookOpen = (day: number) => day >= UNLOCKS.creditBook;
/** Thầy Phúc đưa cây bút ngày 11 (SK-21) — người chơi mới TỰ GHI được vào sổ tay. */
export const notebookWriteOpen = (day: number) => day >= UNLOCKS.notebookWrite;
/** Bà Sáu chỉ chỗ ngày 16 — đổi chỗ đứng (P3-05) mới mở. */
export const standsOpen = (day: number) => day >= UNLOCKS.stands;

// ─────────────────────────────────────────────────────────────── bảng kiểm C (§2.6)

const W: Record<Balance, number> = { "++": 2, "+": 1, "·": 0, "−": -1, "−−": -2 };
export const netOfDay = (d: DaySpec) => d.balance.reduce((a, b) => a + W[b], 0);
export const netOfAct = (act: Act) => DAYS.filter((d) => d.act === act).reduce((a, d) => a + netOfDay(d), 0);
export const doubleNegativeDays = () => DAYS.filter((d) => d.balance.includes("−−")).map((d) => d.day);
export const doublePositiveWithin = (day: number, r: number) =>
  DAYS.some((d) => Math.abs(d.day - day) <= r && d.balance.includes("++"));
export const scriptedNegativesAfter = (day: number) =>
  DAYS.filter((d) => d.day > day && d.balance.some((b) => b === "−" || b === "−−")).map((d) => d.day);

/** Tín hiệu báo trước của một người rời đi (luật B1/B3/B4). */
export function signalsOf(npc: string) {
  const out: { day: number; id: string; kind: SignalKind }[] = [];
  for (const d of DAYS) for (const [n, id, kind] of d.telegraph ?? []) if (n === npc) out.push({ day: d.day, id, kind });
  return out;
}

/**
 * Áp lực thông lượng (§2.7): tối đa mấy khách VÃNG LAI cùng đứng ở quầy. Chế độ không
 * giới hạn thời gian ép về 1 — kịch bản 40 ngày không đổi một chữ (P4-02 §4).
 */
export const peakCap = (day: number, noTimePressure: boolean) => (noTimePressure ? 1 : daySpec(day).target.peak);
