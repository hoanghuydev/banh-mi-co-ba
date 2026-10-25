import { defineConfig, type Plugin } from "vite";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import catalog from "./src/audio/catalog.json";
import { BACKDROP_FILE, BOOT_SFX, BOOT_SFX_BUS } from "./src/core/bootFiles";

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

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? filesUnder(p) : [p];
  });
}

/** Ghi vào `dist/sw.js` tên cache tĩnh băm từ nội dung art/audio/phông và danh sách file precache lúc cài. */
function serviceWorkerManifest(): Plugin {
  let outDir = "dist";
  return {
    name: "sw-manifest",
    apply: "build",
    configResolved(c) { outDir = c.build.outDir; },
    closeBundle() {
      const rel = (p: string) => relative(outDir, p).split("\\").join("/");
      const statics = ["art", "audio", "fonts", "icons"].flatMap((d) => filesUnder(join(outDir, d))).map(rel).sort();
      const hash = createHash("sha256");
      for (const f of statics) hash.update(f).update(readFileSync(join(outDir, f)));
      const html = readFileSync(join(outDir, "index.html"), "utf8");
      const cat = catalog as Record<string, { bus: string; files: string[] }>;
      const sfx = Object.entries(cat).filter(([id, e]) => e.bus === BOOT_SFX_BUS || (BOOT_SFX as readonly string[]).includes(id)).flatMap(([, e]) => e.files);
      const precache = {
        shell: filesUnder(join(outDir, "assets")).map(rel),
        static: [...new Set([...(html.match(/(?:art|fonts|icons)\/[\w./-]+/g) ?? []), BACKDROP_FILE, ...sfx])].filter((f) => statics.includes(f)),
      };
      const sw = join(outDir, "sw.js");
      const src = readFileSync(sw, "utf8");
      const out = src
        .replace(/^const STATIC_HASH = .*$/m, `const STATIC_HASH = ${JSON.stringify(hash.digest("hex").slice(0, 12))};`)
        .replace(/^const PRECACHE = .*$/m, `const PRECACHE = ${JSON.stringify(precache)};`);
      if (out === src) throw new Error("sw.js: không thấy dòng STATIC_HASH/PRECACHE để thay");
      writeFileSync(sw, out);
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
  plugins: command === "build" ? [phaserWithoutPhysics(), serviceWorkerManifest()] : [],
  resolve: command === "build" ? { alias: [{ find: /^phaser$/, replacement: "phaser/src/phaser.js" }] } : {},
  define: {
    __DEV_TOOLS__: JSON.stringify(mode === "development"),
    __PLAYTEST__: JSON.stringify(mode === "playtest"),
    __BUILD_ID__: JSON.stringify(gitSha()),
    __BUILD_TIME__: JSON.stringify(String(Date.now())),
  },
}));
