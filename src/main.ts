import Phaser from "phaser";
import { GAME_W, GAME_H } from "./core/config";
import { RENDER_SCALE, installTextResolution, refitGame } from "./core/render";
import { installGraphicsCache } from "./core/graphicsCache";
import { BUILD_TIME, DEV_TOOLS } from "./core/flags";
import { FPS_LIMIT, installPhaserPatches } from "./core/phaserPatches";
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
  // `keepForOffline` đọc danh sách này; mặc định chỉ giữ 250 file.
  performance.setResourceTimingBufferSize(1000);
}

// Phải chạy trước khi dựng game: nó thay factory `add.text` của Phaser.
installTextResolution();
installPhaserPatches();
installGraphicsCache();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  // Canvas ở độ phân giải thật; toạ độ code vẫn là 1024 × 576, camera zoom `RENDER_SCALE` để khớp.
  width: Math.round(GAME_W * RENDER_SCALE),
  height: Math.round(GAME_H * RENDER_SCALE),
  backgroundColor: "#1d232b",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { pixelArt: false, antialias: true, roundPixels: true, powerPreference: "high-performance" },
  fps: { target: FPS_LIMIT, limit: FPS_LIMIT },
  // Không dùng preFX/postFX; bật thì Phaser dựng sẵn hơn trăm render target chiếm vài trăm MB.
  disablePreFX: true,
  disablePostFX: true,
  // Chạm vào cần và nút cảm ứng (HTML) cũng chiếm con trỏ Phaser; thiếu con trỏ thì cú chạm lên canvas bị bỏ.
  input: { activePointers: 3 },
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
onDeviceChange(() => {
  // Đang trong ngày chơi thì giữ khung cũ, `DayScene` đổi lúc mở cảnh kế.
  if (!game.scene.isActive("day")) refitGame(game);
  game.scale.refresh();
});

// iOS không đưa touchend lên window khi phần tử bị gỡ giữa lúc chạm, con trỏ Phaser kẹt mãi: nhả trước mỗi cú chạm mới.
window.addEventListener("touchstart", (e) => {
  const live = new Set(Array.from(e.touches, (t) => t.identifier));
  const stale = game.input.pointers.filter((p) => p.active && p.wasTouch && !live.has(p.identifier))
    .map((p) => ({ identifier: p.identifier, target: document.body, pageX: 0, pageY: 0 }));
  // `onTouchCancel` có trong Phaser nhưng thiếu ở bản khai kiểu.
  if (stale.length) (game.input as unknown as { onTouchCancel(ev: unknown): void }).onTouchCancel({ changedTouches: stale, timeStamp: e.timeStamp });
}, { capture: true, passive: true });

const isField = (t: EventTarget | null) => t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement;
window.addEventListener("contextmenu", (e) => { if (!isField(e.target)) e.preventDefault(); });

// Xin giữ dữ liệu một lần sau cử chỉ đầu tiên để trình duyệt không tự dọn save.
const GESTURES = ["pointerup", "touchend", "click", "keydown"] as const;
const onFirstGesture = () => {
  for (const g of GESTURES) window.removeEventListener(g, onFirstGesture, true);
  navigator.storage?.persist?.().catch(() => {});
};
for (const g of GESTURES) window.addEventListener(g, onFirstGesture, { capture: true, passive: true });

// Mất ngữ cảnh GL thì canvas hỏng không cứu được: lưu rồi tải lại trang.
game.events.once(Phaser.Core.Events.READY, () => {
  const canvas = game.canvas;
  canvas.addEventListener("webglcontextlost", (e) => e.preventDefault());
  canvas.addEventListener("webglcontextrestored", () => {
    window.dispatchEvent(new Event("pagehide"));
    location.reload();
  });
});
