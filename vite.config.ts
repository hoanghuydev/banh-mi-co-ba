import { defineConfig } from "vite";
import { execSync } from "node:child_process";

function gitSha() {
  try { return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); }
  catch { return "nogit"; }
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
export default defineConfig(({ mode }) => ({
  // Đường dẫn tương đối: zip `dist/` thả lên itch.io (chạy trong thư mục con) vẫn chạy.
  base: "./",
  server: { host: true, port: 5174 },   // host:true -> mở được từ điện thoại cùng wifi
  build: { target: "es2022" },
  define: {
    __DEV_TOOLS__: JSON.stringify(mode === "development"),
    __PLAYTEST__: JSON.stringify(mode === "playtest"),
    __BUILD_ID__: JSON.stringify(gitSha()),
  },
}));
