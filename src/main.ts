import Phaser from "phaser";
import { GAME_W, GAME_H } from "./core/config";
import { RENDER_SCALE, installTextResolution } from "./core/render";
import { BUILD_TIME, DEV_TOOLS } from "./core/flags";
import "./core/session";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { IntroScene } from "./scenes/IntroScene";
import { DayScene } from "./scenes/DayScene";
import { StallScene } from "./scenes/StallScene";
import { EveningScene } from "./scenes/EveningScene";
import { BrokeScene } from "./scenes/BrokeScene";
import { WinScene } from "./scenes/WinScene";
import { music } from "./audio/music";
import { sfx } from "./audio/sfx";
import { onDeviceChange } from "./core/device";
import { installRotatePrompt } from "./ui/rotatePrompt";
import { installSaveToast } from "./ui/saveToast";

// Mỗi bản dựng một tên cache, nên art/nhạc đổi là người chơi tải lại đúng một lần.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register(`sw.js?v=${BUILD_TIME}`).catch(() => {});
}

// Phải chạy trước khi dựng game: nó thay factory `add.text` của Phaser.
installTextResolution();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  // Canvas ở độ phân giải thật; toạ độ code vẫn là 1024 × 576, camera zoom `RENDER_SCALE` để khớp.
  width: Math.round(GAME_W * RENDER_SCALE),
  height: Math.round(GAME_H * RENDER_SCALE),
  backgroundColor: "#1d232b",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { pixelArt: false, antialias: true, roundPixels: true, powerPreference: "high-performance" },
  // Không khoá fps: mọi hệ chạy theo `dt`, 30 fps chỉ là sàn.
  scene: [BootScene, MenuScene, IntroScene, DayScene, StallScene, EveningScene, BrokeScene, WinScene],
});

// Sống ngoài scene và fade bằng `game.events` để chuyển scene không đứt hay kẹt tiếng.
music.attach(game);
sfx.attach(game);

if (DEV_TOOLS) {
  (window as any).__game = game;
  import("./dev/overlay").then((m) => m.installDevTools(game));
}

installRotatePrompt(game);
installSaveToast();
onDeviceChange(() => game.scale.refresh());

const isField = (t: EventTarget | null) => t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement;
window.addEventListener("contextmenu", (e) => { if (!isField(e.target)) e.preventDefault(); });

// Xin giữ dữ liệu một lần sau cử chỉ đầu tiên để trình duyệt không tự dọn save.
const GESTURES = ["pointerup", "touchend", "click", "keydown"] as const;
const onFirstGesture = () => {
  for (const g of GESTURES) window.removeEventListener(g, onFirstGesture, true);
  navigator.storage?.persist?.().catch(() => {});
};
for (const g of GESTURES) window.addEventListener(g, onFirstGesture, { capture: true, passive: true });

// iOS không bắn beforeunload khi vuốt tắt app; cảnh quán lắng nghe beforeunload để lưu.
window.addEventListener("pagehide", () => window.dispatchEvent(new Event("beforeunload")));

// Mất ngữ cảnh GL thì canvas hỏng không cứu được: lưu rồi tải lại trang.
game.events.once(Phaser.Core.Events.READY, () => {
  const canvas = game.canvas;
  canvas.addEventListener("webglcontextlost", (e) => e.preventDefault());
  canvas.addEventListener("webglcontextrestored", () => {
    window.dispatchEvent(new Event("beforeunload"));
    location.reload();
  });
});
