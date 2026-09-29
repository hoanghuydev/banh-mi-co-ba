import Phaser from "phaser";
import { GAME_W, GAME_H } from "./core/config";
import { DEV_TOOLS } from "./core/flags";
import "./core/session";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { DayScene } from "./scenes/DayScene";
import { MarketScene } from "./scenes/MarketScene";
import { StallScene } from "./scenes/StallScene";
import { EveningScene } from "./scenes/EveningScene";
import { music } from "./audio/music";

/**
 * Bánh Mì Cô Ba — bản dựng thử v0.2
 * CANON §2: client-only, offline-first. Không server, không netcode.
 *
 * Năm scene của P0-01 §2.3: Boot → (Menu) → Day (thường trực) ⟶ Market → Stall → Evening.
 */
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_W,
  height: GAME_H,
  backgroundColor: "#1d232b",
  // FIT + khung hình cố định: mọi layout tính bằng toạ độ thiết kế, không phải đoán theo cửa sổ
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { pixelArt: false, antialias: true, roundPixels: true },
  // KHÔNG khoá fps. "30 fps" của CANON §2 / P0-01 §2.8 là SÀN phải giữ được trên máy yếu
  // (ngân sách 33 ms/frame), không phải trần: mọi hệ đều chạy theo `dt` nên 60/120 Hz vẫn
  // ra đúng luật, chỉ mượt hơn. Khoá cứng 30 thì di chuyển và kéo–thả thấy giật.
  scene: [BootScene, MenuScene, DayScene, MarketScene, StallScene, EveningScene],
});

// Nhạc sống ngoài scene để đi từ sảnh vào quán không bị đứt tiếng (xem audio/music.ts).
music.attach(game);

// Chỉ ở dev build (P0-03 §2.2): overlay F1–F8 + `window.dev`. Tree-shake sạch khỏi bản phát hành.
if (DEV_TOOLS) {
  (window as any).__game = game;
  import("./dev/overlay").then((m) => m.installDevTools(game));
}
