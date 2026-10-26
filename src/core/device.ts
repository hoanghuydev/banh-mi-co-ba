// Một nguồn sự thật cho thiết bị: cảm ứng hay chuột, hướng màn, cỡ khung nhìn thật.
import { GAME_W, GAME_H } from "./config";
import { loadSettings, onSettingsSaved } from "./flags";

export type Orientation = "landscape" | "portrait";

/** Vùng chạm tối thiểu, pixel CSS thật. */
export const MIN_TOUCH = 44;
/** Cỡ chữ tối thiểu, pixel CSS thật. */
export const MIN_FONT = 14;
/** Điện thoại ngang chỉ cao 300–414 px nên sàn thấp hơn máy tính bảng. */
export const PHONE_FONT = 12;
export const PHONE_TOUCH = 36;
/** Cạnh ngắn khung nhìn dưới mức này là điện thoại. */
const PHONE_SHORT = 500;

const hasWindow = typeof window !== "undefined";
const listeners = new Set<() => void>();

// Gọi mỗi khung cho từng khách nên giữ lại tới lần đổi cỡ kế tiếp; đọc lại DOM là ép layout.
let viewCache: { w: number; h: number } | null = null;
let fitCache: number | null = null;

function clearViewCache() {
  viewCache = null;
  fitCache = null;
}

// iOS có thể bắn resize trước khi layout xong; khung game đổi cỡ sau đó vẫn phải xoá cache.
let hostWatched = false;
function watchHost(el: HTMLElement) {
  if (hostWatched || typeof ResizeObserver === "undefined") return;
  hostWatched = true;
  new ResizeObserver(() => { fitCache = null; }).observe(el);
}

export function viewport(): { w: number; h: number } {
  if (!hasWindow) return { w: GAME_W, h: GAME_H };
  if (viewCache) return viewCache;
  const v = window.visualViewport;
  viewCache = { w: Math.round(v?.width ?? window.innerWidth), h: Math.round(v?.height ?? window.innerHeight) };
  return viewCache;
}

export function orientation(): Orientation {
  const { w, h } = viewport();
  return w >= h ? "landscape" : "portrait";
}

let coarseCache: boolean | null = null;
let touchCache: boolean | null = null;

function coarsePointer(): boolean {
  if (!hasWindow) return false;
  coarseCache ??= !!window.matchMedia?.("(pointer: coarse)").matches || (navigator.maxTouchPoints ?? 0) > 0 && !window.matchMedia?.("(hover: hover)").matches;
  return coarseCache;
}

function clearTouchCache() {
  coarseCache = null;
  touchCache = null;
}

onSettingsSaved(clearTouchCache);

/** Có hiện điều khiển cảm ứng hay không (theo cài đặt, mặc định theo thiết bị). */
export function isTouch(): boolean {
  if (touchCache !== null) return touchCache;
  const t = loadSettings().touchControls;
  touchCache = t === "on" ? true : t === "off" ? false : coarsePointer();
  return touchCache;
}

/** Cảm ứng trên màn điện thoại; máy tính bảng và PC trả false. */
export function isPhone(): boolean {
  if (!isTouch()) return false;
  const { w, h } = viewport();
  return Math.min(w, h) < PHONE_SHORT;
}

/** Sàn cỡ chữ cảm ứng theo loại máy, pixel CSS thật. */
export function minFont(): number {
  return isPhone() ? PHONE_FONT : MIN_FONT;
}

/** Sàn vùng chạm cảm ứng theo loại máy, pixel CSS thật. */
export function minTouch(): number {
  return isPhone() ? PHONE_TOUCH : MIN_TOUCH;
}

/** Hệ số FIT: pixel CSS thật trên một pixel thiết kế của canvas. */
export function fitScale(): number {
  if (fitCache !== null) return fitCache;
  const { w, h } = viewport();
  const el = hasWindow ? document.getElementById("game") : null;
  const host = el?.clientWidth;
  // Chưa có khung game thì chưa giữ, để lần sau đo lại.
  if (!el || !host) return Math.min(w / GAME_W, h / GAME_H);
  watchHost(el);
  fitCache = Math.min(host / GAME_W, h / GAME_H);
  return fitCache;
}

/** Số pixel thiết kế cần để chiếm `cssPx` pixel CSS thật trên canvas. */
export function designFor(cssPx: number): number {
  return cssPx / Math.max(0.1, fitScale());
}

/** Chọn chuỗi theo thiết bị: phím trên PC, chạm trên cảm ứng. */
export function hint(pc: string, touch: string): string {
  return isTouch() ? touch : pc;
}

export function onDeviceChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/** Gọi khi cài đặt `touchControls` đổi để mọi nơi vẽ lại. */
export function notifyDeviceChange() {
  clearTouchCache();
  clearViewCache();
  applyAttrs();
  for (const cb of [...listeners]) cb();
}

function applyAttrs() {
  if (!hasWindow) return;
  const el = document.documentElement;
  el.dataset.touch = isTouch() ? "1" : "0";
  el.dataset.phone = isPhone() ? "1" : "0";
  el.dataset.orient = orientation();
}

if (hasWindow) {
  applyAttrs();
  let raf = 0;
  const fire = () => {
    clearViewCache();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(notifyDeviceChange);
  };
  window.addEventListener("resize", fire);
  window.addEventListener("orientationchange", fire);
  window.visualViewport?.addEventListener("resize", fire);
  window.matchMedia?.("(pointer: coarse)").addEventListener?.("change", fire);
}
