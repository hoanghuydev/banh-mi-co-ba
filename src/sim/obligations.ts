/**
 * Tiền ra hằng ngày: thuê chỗ (buổi sáng) và chi phí cố định (lúc đếm tiền tối).
 * Mọi số tiền đã co theo `ECON.scale` (xem econ.json). Không có tổng, không màu đỏ trên UI.
 */
import { ECON, scaledVnd } from "./econ";

/**
 * Sổ hôm nay — MỌI đường tiền ra/vào két đi qua đúng MỘT dòng ở đây; các dòng cộng lại phải
 * bằng chênh lệch `money.cash` trong ngày. DƯƠNG = tiền RA khỏi két; bán đồ nghề là ÂM.
 */
export type EconToday = {
  day: number;
  market: number;
  /** Than, đá, túi, xăng — phần két trả nổi. */
  fixed: number;
  rent: number;
  /** Mua/bán đồ nghề, RÒNG (âm = bán được tiền). */
  tools: number;
  /** Tiền chi trong lúc trò chuyện (act tốn tiền). */
  talk: number;
  /** Gửi về nhà. */
  family: number;
  wasted: string[];
  soldOut: number;
  counted: boolean;
  closedAtMin: number | null;
};

export type EconBook = { today: EconToday };

export type EconState = {
  rentOwed: number;
  today: EconToday;
  /** Tiền lẻ đổi ở cô Mai sáng nay (đồng) và còn lại bao nhiêu. */
  float: number;
  floatLeft: number;
  neighborAnnoyance: number;
  loaOffUntil: number;
};

export const newEconState = (): EconState => ({
  rentOwed: 0, today: newToday(1), float: 0, floatLeft: 0, neighborAnnoyance: 0, loaOffUntil: 0,
});
export const newToday = (day: number): EconToday =>
  ({ day, market: 0, fixed: 0, rent: 0, tools: 0, talk: 0, family: 0,
    wasted: [], soldOut: 0, counted: false, closedAtMin: null });

/** Tiền thuê mặt bằng mỗi ngày (đồng, đã co). */
export const rentVnd = () => scaledVnd(ECON.rent_k);

export type Money = { cash: number };

/** Buổi sáng: thu tiền thuê (trả nợ cũ trước). Không đủ thì dồn nợ sang mai. */
export function morningRent(e: EconState, m: Money): { paid: number } {
  const due = e.rentOwed + rentVnd();
  if (m.cash >= due) {
    m.cash -= due;
    e.today.rent += due;
    e.rentOwed = 0;
    return { paid: due };
  }
  e.rentOwed = due;
  return { paid: 0 };
}

/** Đếm tiền tối, MỘT lần mỗi tối: trừ chi phí cố định, không để két âm. */
export function eveningCount(e: EconState, m: Money, fixed: number) {
  if (e.today.counted) return;
  e.today.counted = true;
  const f = Math.max(0, Math.min(m.cash, fixed));
  m.cash -= f;
  e.today.fixed += f;
}
