/**
 * Chụp một màn ở cả ma trận cỡ, ra thư mục do tham số.
 *
 *   node tools/shot-matrix.mjs --out DIR --name boot [--url URL] [--sizes 360x640,844x390] [--wait 1500]
 *        [--save JSON] [--eval JS] [--click x,y] ...   (các cờ còn lại chuyển nguyên cho tools/screenshot.mjs)
 *
 * Điện thoại (cạnh ngắn ≤ 500) chụp với --touch --dpr 3; còn lại chuột, dpr 1.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const MATRIX = ["360x640", "390x844", "412x915", "800x360", "844x390", "915x412", "1024x768", "1180x820", "1280x720"];
const argv = process.argv.slice(2);
const take = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  if (i < 0) return d;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
};
const outDir = take("out", "shots");
const name = take("name", "shot");
const sizes = take("sizes", MATRIX.join(",")).split(",");
mkdirSync(outDir, { recursive: true });
const shotJs = join(dirname(fileURLToPath(import.meta.url)), "screenshot.mjs");

for (const size of sizes) {
  const [w, h] = size.split("x").map(Number);
  const phone = Math.min(w, h) <= 500;
  const file = join(outDir, `${name}-${size}${phone ? "-touch" : ""}.png`);
  const args = [shotJs, ...argv, "--size", `${w},${h}`, "--out", file, ...(phone ? ["--touch", "--dpr", "3"] : [])];
  const r = spawnSync("node", args, { stdio: "inherit" });
  if (r.status !== 0) console.error(`lỗi khi chụp ${size}`);
}
