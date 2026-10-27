const BASE_W = 1024;
const BASE_H = 576;
/** Màn ngang dài hơn mức này thì phần dư vẫn là dải đen. */
const MAX_ASPECT = 2.4;
/** Màn vuông hơn 4:3 thì phần dư vẫn là dải đen. */
const MIN_ASPECT = 4 / 3;

/** Vùng an toàn (tai thỏ, thanh điều hướng) theo pixel CSS; canvas chỉ co theo hai bên. */
export function safeInsets(): { l: number; r: number; t: number; b: number } {
  if (typeof document === "undefined") return { l: 0, r: 0, t: 0, b: 0 };
  const p = document.createElement("div");
  p.style.cssText = "position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)";
  document.documentElement.appendChild(p);
  const cs = getComputedStyle(p);
  const n = (k: string) => parseFloat(cs.getPropertyValue(k)) || 0;
  const v = { l: n("padding-left"), r: n("padding-right"), t: n("padding-top"), b: n("padding-bottom") };
  p.remove();
  return v;
}

/** Khung thiết kế phủ kín khung nhìn: màn rộng hơn 16:9 nới ngang, hẹp hơn thì nới dọc; cạnh ngắn của khung giữ 576 hoặc 1024. */
function designSize(): { w: number; h: number } {
  if (typeof window === "undefined") return { w: BASE_W, h: BASE_H };
  const s = safeInsets();
  const a = Math.max(window.innerWidth, window.innerHeight) - s.l - s.r;
  const b = Math.min(window.innerWidth, window.innerHeight);
  if (b <= 0) return { w: BASE_W, h: BASE_H };
  const r = a / b;
  return r >= BASE_W / BASE_H
    ? { w: Math.round(BASE_H * Math.min(MAX_ASPECT, r)), h: BASE_H }
    : { w: BASE_W, h: Math.round(BASE_W / Math.max(MIN_ASPECT, r)) };
}

/** Kích thước thiết kế; chỉ đổi qua `applyDesignSize` lúc chưa có cảnh chơi nào dựng theo nó. */
const first = designSize();
export let GAME_W = first.w;
export let GAME_H = first.h;

/** Đo lại khung nhìn; trả true nếu khung thiết kế đổi. */
export function applyDesignSize(): boolean {
  const { w, h } = designSize();
  if (w === GAME_W && h === GAME_H) return false;
  GAME_W = w;
  GAME_H = h;
  return true;
}
