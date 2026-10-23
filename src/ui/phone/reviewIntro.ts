import { el, starRow } from "./dom";

/** Đầu trang Đánh giá của quán chưa có lượt nào. */
export function reviewIntro(shopName: string): HTMLElement[] {
  const hero = el("div", "ph-rev-hero");
  hero.append(el("div", "shop", shopName), el("div", "sub", "Quán bánh mì"));
  hero.append(el("div", "ph-score", "0,0"));
  const stars = el("div", "ph-stars");
  stars.setAttribute("aria-label", "Chưa có sao");
  stars.innerHTML = starRow(0, 30);
  hero.append(stars, el("div", "ph-count", "0 đánh giá"));
  const empty = el("div", "ph-rev-empty");
  empty.append(el("b", "", "Chưa có đánh giá"));
  return [hero, empty];
}
