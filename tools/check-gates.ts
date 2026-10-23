/** npm run gates [-- --dist] — cổng kỹ thuật cứng, trượt là exit 1; `--dist` quét thêm bản build. */
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { ROOT, read, rel, walk } from "./lib";

type Gate = { name: string; hits: string[] };
const gates: Gate[] = [];

function scan(name: string, dirs: string[], re: RegExp, opts: { exclude?: (f: string) => boolean; ext?: string[] } = {}) {
  const hits: string[] = [];
  for (const d of dirs) {
    for (const f of walk(join(ROOT, d), opts.ext ?? [".ts"])) {
      if (opts.exclude?.(f)) continue;
      read(f).split("\n").forEach((line, i) => {
        const code = line.replace(/\/\/.*$/, "");
        if (/^\s*(\*|\/\*)/.test(line)) return;
        if (re.test(code)) hits.push(`${rel(f)}:${i + 1}  ${line.trim()}`);
      });
    }
  }
  gates.push({ name, hits });
}

const RULE_DIRS = ["src/sim", "src/dialog", "src/craft", "src/econ"];

// Luật chơi phải chạy headless được.
scan('sim/dialog/craft/econ không import "phaser"', RULE_DIRS, /from\s+["']phaser["']/);
scan("không Math.random() ngoài src/core", ["src"], /Math\.random\s*\(/, {
  exclude: (f) => rel(f).startsWith("src/core/"),
});
// Hệ tự giữ bộ đếm giây thì pause không đóng băng được nó.
scan("không Date.now / setTimeout / setInterval trong luật chơi", RULE_DIRS, /\b(Date\.now|setTimeout|setInterval)\s*\(/);
scan("không rng trong craft/ và econ/ledger", ["src/craft"], /\brng\b|RngHub|\.derive\(/);
if (existsSync(join(ROOT, "src/econ/ledger.ts"))) {
  const hits = read(join(ROOT, "src/econ/ledger.ts")).split("\n").filter((l) => /\brng\b/.test(l));
  gates.push({ name: "econ/ledger.ts không dùng rng", hits });
}
// Rút có điều kiện từ rng dùng chung làm lệch pha mọi lần rút sau, nên hàm ngoài spawn/plan phải tự `hub.derive()`.
{
  const src = read(join(ROOT, "src/sim/service.ts"));
  const ALLOW = /^(spawn|spawnPasser|devSpawn|rollOrder|plan\w*)$/;
  const hits: string[] = [];
  const DECL = new RegExp(String.raw`^\s*(?:export\s+)?(?:private\s+|function\s+)?(\w+)\s*\(([^)]*)\)`, "gm");
  for (const m of src.matchAll(DECL)) {
    if (!/\brng:\s*Rng\b/.test(m[2])) continue;
    if (!ALLOW.test(m[1])) hits.push(`service.ts: ${m[1]}() nhận \`rng\` dùng chung — dùng hub.derive()`);
  }
  gates.push({ name: "không hàm nào ngoài spawn/plan nhận `rng` dùng chung", hits });
}

scan("không colyseus", ["src"], /colyseus/i);
if (/colyseus/i.test(read(join(ROOT, "package.json")))) gates.push({ name: "package.json không có colyseus", hits: ["package.json"] });
// headless là bản sao của StallScene để test.
scan("clock.advance() chỉ ở StallScene + sim/headless", ["src"], /\.advance\(/, {
  exclude: (f) => ["src/core/clock.ts", "src/scenes/StallScene.ts", "src/sim/headless.ts"].includes(rel(f)),
});
{
  const hits = ["README.md", "index.html"].flatMap((f) =>
    read(join(ROOT, f)).split("\n").map((l, i) => ({ l, i }))
      .filter(({ l }) => /\b(multiplayer|co-?op|netcode)\b/i.test(l) && !/cắt|cut|không|removed|❌/i.test(l))
      .map(({ l, i }) => `${f}:${i + 1}  ${l.trim()}`));
  gates.push({ name: 'không hứa "multiplayer / co-op / netcode"', hits });
}

if (process.argv.includes("--dist")) {
  const dist = join(ROOT, "dist");
  if (!existsSync(dist)) gates.push({ name: "dist/ tồn tại", hits: ["chưa build — chạy vite build trước"] });
  else {
    const hits: string[] = [];
    for (const f of walk(dist, [".js"])) {
      const s = read(f);
      for (const needle of ["dev-overlay", "P1 · Perception", "__DEV_TOOLS__", "installDevTools"]) {
        if (s.includes(needle)) hits.push(`${rel(f)} chứa "${needle}"`);
      }
    }
    gates.push({ name: "bản build không chứa code overlay dev", hits });

    const MB = 1024 * 1024;
    const BUDGET: [dir: string, maxMB: number][] = [["art", 6], ["audio/music", 8], ["audio/sfx", 7]];
    const over = BUDGET.flatMap(([d, max]) => {
      const total = walk(join(dist, d), [""]).reduce((n, f) => n + statSync(f).size, 0);
      return total > max * MB ? [`dist/${d} ${(total / MB).toFixed(1)} MB > ${max} MB`] : [];
    });
    gates.push({ name: "dung lượng art/nhạc/sfx trong ngân sách", hits: over });

    const heavy = walk(join(dist, "art"), [".webp", ".png"])
      .filter((f) => f.endsWith(".png") || statSync(f).size > 1.2 * MB)
      .map((f) => `${rel(f)} ${f.endsWith(".png") ? "còn là PNG — chạy tools/optimize-art.py" : "quá 1,2 MB"}`);
    gates.push({ name: "ảnh trong dist/art là WebP và không file nào quá 1,2 MB", hits: heavy });
  }
}

let failed = 0;
console.log("\ngates");
for (const g of gates) {
  const ok = g.hits.length === 0;
  if (!ok) failed++;
  console.log(`  ${ok ? "✔" : "✖"} ${g.name}`);
  for (const h of g.hits.slice(0, 10)) console.log(`      ${h}`);
}
console.log(failed ? `\n  ${failed} cổng TRƯỢT` : "\n  mọi cổng đều qua");
process.exit(failed ? 1 : 0);
