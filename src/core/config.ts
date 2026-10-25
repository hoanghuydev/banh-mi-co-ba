/** Chiều cao thiết kế; mọi layout UI tính theo khung này rồi để Phaser FIT co giãn. */
export const GAME_H = 576;
const BASE_W = 1024;
/** Điện thoại ngang dài hơn mức này thì phần dư vẫn là dải đen. */
const MAX_ASPECT = 2.4;

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

/** Chiều rộng thiết kế: cảm ứng ngang rộng hơn 16:9 thì nới theo tỉ lệ màn, còn lại giữ 1024; chốt lúc tải trang. */
function designWidth(): number {
  if (typeof window === "undefined" || !window.matchMedia?.("(pointer: coarse)").matches) return BASE_W;
  const s = safeInsets();
  const a = Math.max(window.innerWidth, window.innerHeight) - s.l - s.r;
  const b = Math.min(window.innerWidth, window.innerHeight);
  if (b <= 0) return BASE_W;
  return Math.max(BASE_W, Math.round(GAME_H * Math.min(MAX_ASPECT, a / b)));
}

export const GAME_W: number = designWidth();
