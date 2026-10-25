import { defineConfig, type Plugin } from "vite";
import { execSync } from "node:child_process";

function gitSha() {
  try { return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); }
  catch { return "nogit"; }
}

/** Cờ Phaser tự thay lúc build bản `dist`; dựng từ `phaser/src` thì phải thay giống vậy. */
const PHASER_FLAGS: Record<string, boolean> = {
  CANVAS_RENDERER: true, WEBGL_RENDERER: true, WEBGL_DEBUG: false, EXPERIMENTAL: false,
  PLUGIN_3D: false, PLUGIN_CAMERA3D: false, PLUGIN_FBINSTANT: false, FEATURE_SOUND: true,
};

/** Bản dựng lấy Phaser từ mã nguồn, bỏ `Physics` (Arcade + Matter) vì game không dùng. */
function phaserWithoutPhysics(): Plugin {
  const flag = new RegExp(`typeof (${Object.keys(PHASER_FLAGS).join("|")})\\b`, "g");
  return {
    name: "phaser-without-physics",
    enforce: "pre",
    transform(code, id) {
      if (!id.includes("/node_modules/phaser/src/")) return null;
      let out = code.replace(flag, (_, k: string) => String(PHASER_FLAGS[k]));
      if (id.endsWith("/phaser/src/phaser.js")) {
        out = out.replace("Physics: require('./physics'),", "").replace("global.Phaser = Phaser;", "window.Phaser = Phaser;");
      }
      return out;
    },
  };
}

/**
 * Ba bản dựng (P0-03 §2.2, §4):
 *   dev         `npm run dev`            — overlay F1–F8, `window.dev`, trace bus
 *   playtest    `npm run build:playtest` — KHÔNG overlay, telemetry bật, tự pause ở perception:confirmed
 *   production  `npm run build`          — không overlay, telemetry mặc định tắt và hỏi một lần
 *
 * `__DEV_TOOLS__` là hằng số lúc build → mọi nhánh `if (DEV_TOOLS)` bị tree-shake sạch.
 * Cổng: `npm run gates -- --dist` quét `dist/` để chắc chắn không còn code overlay.
 */
export default defineConfig(({ command, mode }) => ({
  // Đường dẫn tương đối: zip `dist/` thả lên itch.io (chạy trong thư mục con) vẫn chạy.
  base: "./",
  server: { host: true, port: 5174 },   // host:true -> mở được từ điện thoại cùng wifi
  build: {
    target: "es2022",
    rollupOptions: { output: { manualChunks: (id) => (id.includes("/node_modules/phaser/") ? "phaser" : undefined) } },
  },
  plugins: command === "build" ? [phaserWithoutPhysics()] : [],
  resolve: command === "build" ? { alias: [{ find: /^phaser$/, replacement: "phaser/src/phaser.js" }] } : {},
  define: {
    __DEV_TOOLS__: JSON.stringify(mode === "development"),
    __PLAYTEST__: JSON.stringify(mode === "playtest"),
    __BUILD_ID__: JSON.stringify(gitSha()),
    __BUILD_TIME__: JSON.stringify(String(Date.now())),
  },
}));
