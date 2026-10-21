import type { SaveFile } from "../core/save";

export type Review = {
  id: number;
  day: number;
  who: string;
  stars: number;
  text: string;
  /** Đánh giá đau bụng, không sửa được. */
  food: boolean;
  edited: boolean;
};

export type ReviewState = { seq: number; list: Review[] };

export const newReviews = (): ReviewState => ({ seq: 0, list: [] });

export const COMMENT_MAX = 200;

export function addReview(w: SaveFile, r: Omit<Review, "id" | "edited">): Review {
  const review = { ...r, id: ++w.reviews.seq, edited: false };
  w.reviews.list.unshift(review);
  return review;
}

export const fixable = (r: Review) => !r.food && !r.edited;

export function average(w: SaveFile): number {
  const l = w.reviews.list;
  return l.length ? l.reduce((a, r) => a + r.stars, 0) / l.length : 0;
}

/** Dùng một Hồi Tâm Chuyển Ý: sửa số sao và/hoặc lời; không đổi gì thì không mất thẻ. */
export function applyFix(w: SaveFile, id: number, next: { stars: number; text: string }): boolean {
  const r = w.reviews.list.find((x) => x.id === id);
  if (!r || !fixable(r) || w.system.fix <= 0) return false;
  const stars = Math.min(5, Math.max(1, Math.round(next.stars)));
  const text = next.text.trim().slice(0, COMMENT_MAX);
  if (stars === r.stars && text === r.text) return false;
  r.stars = stars;
  r.text = text;
  r.edited = true;
  w.system.fix--;
  return true;
}
