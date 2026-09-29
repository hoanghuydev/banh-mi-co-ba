import Phaser from "phaser";
import { GAME_W, GAME_H } from "./core/config";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { StallScene } from "./scenes/StallScene";
import { music } from "./audio/music";

/**
 * Bánh Mì Cô Ba — bản dựng thử v0.1
 * CANON §2: client-only, offline-first. Không server, không netcode.
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
  scene: [BootScene, MenuScene, StallScene],
});

// Nhạc sống ngoài scene để đi từ sảnh vào quán không bị đứt tiếng (xem audio/music.ts).
music.attach(game);

// Chỉ ở dev: mở console gõ `__game` để soi scene, tua đồng hồ, test tay.
if (import.meta.env.DEV) (window as any).__game = game;
