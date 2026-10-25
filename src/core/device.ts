// Một nguồn sự thật cho thiết bị: cảm ứng hay chuột, hướng màn, cỡ khung nhìn thật.
import { GAME_W, GAME_H } from "./config";
import { loadSettings, onSettingsSaved } from "./flags";

export type Orientation = "landscape" | "portrait";

/** Vùng chạm tối thiểu, pixel CSS thật. */
export const MIN_TOUCH = 44;
/** Cỡ chữ tối thiểu, pixel CSS thật. */
export const MIN_FONT = 14;

const hasWindow = typeof window !== "undefined";
const listeners = new Set<() => void>();

export function viewport(): { w: number; h: number } {
  if (!hasWindow) return { w: GAME_W, h: GAME_H };
  const v = window.visualViewport;
  return { w: Math.round(v?.width ?? window.innerWidth), h: Math.round(v?.height ?? window.innerHeight) };
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

/** Hệ số FIT: pixel CSS thật trên một pixel thiết kế của canvas. */
export function fitScale(): number {
  const { w, h } = viewport();
  const host = hasWindow ? document.getElementById("game")?.clientWidth : 0;
  return Math.min((host || w) / GAME_W, h / GAME_H);
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
  applyAttrs();
  for (const cb of [...listeners]) cb();
}

function applyAttrs() {
  if (!hasWindow) return;
  const el = document.documentElement;
  el.dataset.touch = isTouch() ? "1" : "0";
  el.dataset.orient = orientation();
}

if (hasWindow) {
  applyAttrs();
  let raf = 0;
  const fire = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(notifyDeviceChange);
  };
  window.addEventListener("resize", fire);
  window.addEventListener("orientationchange", fire);
  window.visualViewport?.addEventListener("resize", fire);
  window.matchMedia?.("(pointer: coarse)").addEventListener?.("change", fire);
}
