/**
 * Chụp màn hình game thật bằng Chrome headless + CDP.
 *
 *   node tools/screenshot.mjs --out /tmp/a.png --save "$(npx tsx tools/dev-save.ts)" --after 8000
 *   node tools/screenshot.mjs --out /tmp/b.png --eval "dev.day.skipTo('07:00')"
 *   node tools/screenshot.mjs --out /tmp/c.png --click 683,509 --storage
 *   node tools/screenshot.mjs --out /tmp/d.png --size 390,844
 *
 * Cần `npm run dev` đang chạy (cổng 5174). Save được nạp thẳng vào localStorage
 * rồi vào cảnh quán, khỏi bấm qua menu và intro.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const out = arg("out", "/tmp/shot.png");
const url = arg("url", "http://localhost:5174/");
const save = arg("save", "");
const wait = Number(arg("wait", "3500"));
const after = Number(arg("after", "0"));
/** `--eval`, `--click x,y`, `--drag x1,y1,x2,y2`, `--shot <png>`, `--wait-ms <n>` chạy ĐÚNG THỨ TỰ gõ. */
const STEP_FLAGS = { "--eval": "eval", "--click": "drag", "--drag": "drag", "--shot": "shot", "--wait-ms": "sleep" };
const steps = process.argv.flatMap((x, i) => (STEP_FLAGS[x] ? [{ kind: STEP_FLAGS[x], arg: process.argv[i + 1] }] : []));
const storage = process.argv.includes("--storage");
const port = 9333 + (Date.now() % 200);

const chrome = spawn("google-chrome", [
  "--headless=new", `--remote-debugging-port=${port}`, "--mute-audio", "--no-first-run",
  "--disable-gpu-vsync", `--window-size=${arg("size", "1366,768")}`, "--hide-scrollbars",
  `--user-data-dir=${mkdtempSync(join(tmpdir(), "shot-"))}`, "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function target() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/list`);
      const pages = (await r.json()).filter((t) => t.type === "page");
      if (pages[0]?.webSocketDebuggerUrl) return pages[0].webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error("Chrome không mở được cổng debug");
}

const ws = new WebSocket(await target());
await new Promise((r) => (ws.onopen = r));
let seq = 0;
const waiting = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && waiting.has(m.id)) {
    const { ok, bad } = waiting.get(m.id);
    waiting.delete(m.id);
    m.error ? bad(new Error(JSON.stringify(m.error))) : ok(m.result);
  }
};
const cmd = (method, params = {}) => new Promise((ok, bad) => {
  const id = ++seq;
  waiting.set(id, { ok, bad });
  ws.send(JSON.stringify({ id, method, params }));
});
/** Gói lại để kết quả luôn là chuỗi: CDP không trả nổi object của Phaser. */
const js = (expr) => cmd("Runtime.evaluate", {
  expression: `(() => { try { const v = (${expr}); return typeof v === "object" ? "[object]" : String(v); }`
    + ` catch (e) { return "LỖI " + e.message; } })()`,
  awaitPromise: true, returnByValue: true,
});

await cmd("Page.enable");
await cmd("Runtime.enable");
const [vw, vh] = arg("size", "1366,768").split(",").map(Number);
await cmd("Emulation.setDeviceMetricsOverride", { width: vw, height: vh, deviceScaleFactor: 1, mobile: vw < 500 });

await cmd("Page.navigate", { url });
await sleep(1200);
if (save) {
  const rows = JSON.parse(save);
  await js(`(() => { ${Object.entries(rows).map(([k, v]) =>
    `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join("")} return 1; })()`);
  await cmd("Page.reload");
  await sleep(1500);
  await js(`window.__game.scene.start("day", { mode: "continue" })`);
}
const mouse = (type, x, y) => cmd("Input.dispatchMouseEvent", {
  type, x, y, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1,
});

await sleep(wait);
for (const st of steps) {
  if (st.kind === "eval") {
    const r = await js(st.arg);
    console.log(`eval ${st.arg} →`, r.result?.value);
    await sleep(600);
    continue;
  }
  if (st.kind === "sleep") { await sleep(Number(st.arg)); continue; }
  if (st.kind === "shot") {
    const s = await cmd("Page.captureScreenshot", { format: "png" });
    writeFileSync(st.arg, Buffer.from(s.data, "base64"));
    console.log("ảnh:", st.arg);
    continue;
  }
  const [x1, y1, x2 = x1, y2 = y1] = st.arg.split(",").map(Number);
  await mouse("mousePressed", x1, y1);
  await sleep(120);
  await mouse("mouseMoved", (x1 + x2) / 2, (y1 + y2) / 2);
  await sleep(120);
  await mouse("mouseMoved", x2, y2);
  await sleep(120);
  await mouse("mouseReleased", x2, y2);
  await sleep(700);
}
if (after) await sleep(after);
if (storage) {
  // Đọc thẳng qua CDP, không qua JS của trang: loại hẳn nghi vấn "chạy khác thế giới".
  await cmd("DOMStorage.enable");
  const origin = new URL(url).origin;
  const { entries } = await cmd("DOMStorage.getDOMStorageItems", {
    storageId: { securityOrigin: origin, isLocalStorage: true },
  });
  console.log("localStorage:", entries.map(([k, v]) => `${k}=${String(v).length} ký tự`).join(" · ") || "(trống)");
}
const shot = await cmd("Page.captureScreenshot", { format: "png" });
writeFileSync(out, Buffer.from(shot.data, "base64"));
console.log("ảnh:", out);
ws.close();
chrome.kill();
