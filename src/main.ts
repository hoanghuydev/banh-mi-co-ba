import Phaser from "phaser";
import { GAME_W, GAME_H } from "./core/config";
import { RENDER_SCALE, installTextResolution } from "./core/render";
import { DEV_TOOLS } from "./core/flags";
import "./core/session";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { DayScene } from "./scenes/DayScene";
import { MarketScene } from "./scenes/MarketScene";
import { StallScene } from "./scenes/StallScene";
import { EveningScene } from "./scenes/EveningScene";
import { BrokeScene } from "./scenes/BrokeScene";
import { music } from "./audio/music";
import { sfx } from "./audio/sfx";

/**
 * Bản dựng thử v0.2 — client-only, offline-first (CANON §2).
 * Boot → (Menu) → Day (thường trực) ⟶ Market → Stall → Evening; hết vốn → Broke.
 */
// Phải chạy TRƯỚC khi dựng game: nó thay factory `add.text` của Phaser.
installTextResolution();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  // Canvas dựng ở độ phân giải THẬT của màn hình (xem `core/render`), còn mọi toạ độ
  // trong code vẫn là 1024 × 576 — camera của từng scene zoom `RENDER_SCALE` để khớp.
  width: Math.round(GAME_W * RENDER_SCALE),
  height: Math.round(GAME_H * RENDER_SCALE),
  backgroundColor: "#1d232b",
  // FIT + khung hình cố định: mọi layout tính bằng toạ độ thiết kế, không phải đoán theo cửa sổ.
  // FIT vẫn kéo canvas cho vừa cửa sổ, nhưng kéo XUỐNG từ độ phân giải thật chứ không
  // kéo LÊN từ 1024 px — thu nhỏ thì không mất nét, phóng to mới mất.
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { pixelArt: false, antialias: true, roundPixels: true },
  // KHÔNG khoá fps. "30 fps" của CANON §2 / P0-01 §2.8 là SÀN phải giữ được trên máy yếu
  // (ngân sách 33 ms/frame), không phải trần: mọi hệ đều chạy theo `dt` nên 60/120 Hz vẫn
  // ra đúng luật, chỉ mượt hơn. Khoá cứng 30 thì di chuyển và kéo–thả thấy giật.
  scene: [BootScene, MenuScene, DayScene, MarketScene, StallScene, EveningScene, BrokeScene],
});

// Nhạc và tiếng động sống ngoài scene để đi từ sảnh vào quán không bị đứt tiếng
// (xem audio/music.ts, audio/sfx.ts). Cả hai fade bằng `game.events`, không bằng
// tween của scene — scene tắt giữa chừng là tween chết và tiếng kẹt ở nửa âm lượng.
music.attach(game);
sfx.attach(game);

// Chỉ ở dev build (P0-03 §2.2): overlay F1–F8 + `window.dev`. Tree-shake sạch khỏi bản phát hành.
if (DEV_TOOLS) {
  (window as any).__game = game;
  import("./dev/overlay").then((m) => m.installDevTools(game));
}
