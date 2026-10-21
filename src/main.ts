import Phaser from "phaser";
import { GAME_W, GAME_H } from "./core/config";
import { RENDER_SCALE, installTextResolution } from "./core/render";
import { DEV_TOOLS } from "./core/flags";
import "./core/session";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { IntroScene } from "./scenes/IntroScene";
import { DayScene } from "./scenes/DayScene";
import { StallScene } from "./scenes/StallScene";
import { EveningScene } from "./scenes/EveningScene";
import { BrokeScene } from "./scenes/BrokeScene";
import { music } from "./audio/music";
import { sfx } from "./audio/sfx";

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
  render: { pixelArt: false, antialias: true, roundPixels: true },
  // Không khoá fps: mọi hệ chạy theo `dt`, 30 fps chỉ là sàn.
  scene: [BootScene, MenuScene, IntroScene, DayScene, StallScene, EveningScene, BrokeScene],
});

// Sống ngoài scene và fade bằng `game.events` để chuyển scene không đứt hay kẹt tiếng.
music.attach(game);
sfx.attach(game);

if (DEV_TOOLS) {
  (window as any).__game = game;
  import("./dev/overlay").then((m) => m.installDevTools(game));
}
