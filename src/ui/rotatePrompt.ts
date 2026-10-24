import Phaser from "phaser";
import { isTouch, onDeviceChange, orientation } from "../core/device";

type FsDoc = Document & { webkitFullscreenElement?: Element | null; webkitFullscreenEnabled?: boolean; webkitExitFullscreen?: () => Promise<void> | void };
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

const CSS = `
#rotate-prompt{position:fixed;inset:0;z-index:9600;display:none;flex-direction:column;align-items:center;justify-content:center;gap:1.4rem;
  padding:var(--safe-top) var(--safe-right) var(--safe-bottom) var(--safe-left);background:#1d232b;color:#e8eef3;text-align:center;touch-action:none}
#rotate-prompt.on{display:flex}
#rotate-prompt .rp-phone{width:3.4rem;height:6rem;border:.3rem solid #f0c419;border-radius:.8rem;position:relative;animation:rp-turn 2.4s ease-in-out infinite}
#rotate-prompt .rp-phone::after{content:"";position:absolute;left:50%;bottom:.45rem;width:1rem;height:.2rem;margin-left:-.5rem;border-radius:1px;background:#f0c419}
@keyframes rp-turn{0%,20%{transform:rotate(0)}60%,100%{transform:rotate(-90deg)}}
#rotate-prompt .rp-title{font-size:1.25rem;font-weight:800}
#rotate-prompt .rp-fs{min-height:44px;min-width:44px;padding:0 1.4rem;border:0;border-radius:999px;background:#f0c419;color:#2a2420;font:700 1rem/1.2 "Be Vietnam Pro",system-ui,sans-serif;cursor:pointer}
@media (prefers-reduced-motion:reduce){#rotate-prompt .rp-phone{animation:none;transform:rotate(-90deg)}}
`;

export function fullscreenSupported(): boolean {
  const d = document as FsDoc;
  return !!(d.fullscreenEnabled || d.webkitFullscreenEnabled);
}

export function isFullscreen(): boolean {
  const d = document as FsDoc;
  return !!(d.fullscreenElement || d.webkitFullscreenElement);
}

function lockLandscape() {
  try {
    const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    o?.lock?.("landscape")?.catch(() => {});
  } catch { /* trình duyệt không cho khoá hướng */ }
}

export function toggleFullscreen() {
  const d = document as FsDoc;
  const root = document.documentElement as FsEl;
  try {
    if (isFullscreen()) {
      (d.exitFullscreen?.() ?? d.webkitExitFullscreen?.() as Promise<void> | undefined)?.catch?.(() => {});
      return;
    }
    const req = root.requestFullscreen?.() ?? root.webkitRequestFullscreen?.() as Promise<void> | undefined;
    Promise.resolve(req).then(lockLandscape).catch(() => {});
  } catch { /* bị chặn */ }
}

/** Nhắc xoay máy ngang khi đang ở cảnh quán; cảnh đứng yên đến khi xoay. */
export function installRotatePrompt(game: Phaser.Game) {
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);

  const el = document.createElement("div");
  el.id = "rotate-prompt";
  el.setAttribute("role", "alert");
  el.innerHTML = `<div class="rp-phone" aria-hidden="true"></div><div class="rp-title">Xoay ngang màn hình</div>`;
  if (fullscreenSupported()) {
    const b = document.createElement("button");
    b.className = "rp-fs";
    b.textContent = "Toàn màn hình";
    b.addEventListener("click", toggleFullscreen);
    el.appendChild(b);
  }
  document.body.appendChild(el);

  let shown = false;
  let inStall = false;
  const update = () => {
    const want = inStall && isTouch() && orientation() === "portrait";
    if (want === shown) return;
    shown = want;
    el.classList.toggle("on", want);
    if (want) game.loop.sleep();
    else { game.loop.wake(); game.loop.resetDelta(); }
  };
  const setStall = (on: boolean) => {
    if (on && !inStall && isFullscreen()) lockLandscape();
    inStall = on;
    update();
  };
  const watch = () => {
    const ev = game.scene.getScene("stall").events;
    for (const e of ["start", "wake", "resume"]) ev.on(e, () => setStall(true));
    for (const e of ["shutdown", "sleep", "pause"]) ev.on(e, () => setStall(false));
  };
  onDeviceChange(update);
  if (game.scene.getScene("stall")) watch();
  else game.events.once(Phaser.Core.Events.READY, watch);
}
