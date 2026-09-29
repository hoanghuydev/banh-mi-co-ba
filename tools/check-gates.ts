/**
 * npm run gates [-- --dist]
 *
 * Cổng kỹ thuật cứng của P0 — CANON §8.1 + P0-01 §6 + P0-02 §6. Đây là CỔNG, không
 * phải khuyến nghị: một `Math.random()` lọt vào là cơ chế chống save-scum hỏng âm
 * thầm, và không ai biết cho tới khi người chơi viết lên Reddit.
 *
 * `--dist` quét thêm bản build: code overlay dev không được lọt vào bản phát hành
 * (một thanh certainty trong bản bán ra là giết T5).
 */
import { existsSync } from "node:fs";
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
        const code = line.replace(/\/\/.*$/, "");               // bỏ chú thích cuối dòng
        if (/^\s*(\*|\/\*)/.test(line)) return;                  // bỏ dòng chú thích khối
        if (re.test(code)) hits.push(`${rel(f)}:${i + 1}  ${line.trim()}`);
      });
    }
  }
  gates.push({ name, hits });
}

const RULE_DIRS = ["src/sim", "src/dialog", "src/craft", "src/econ"];

// P0-01 §6 — luật chơi không biết Phaser tồn tại → chạy headless được.
scan('sim/dialog/craft/econ không import "phaser"', RULE_DIRS, /from\s+["']phaser["']/);
// CANON §8.1 — mọi số ngẫu nhiên đi qua core/rng.
scan("không Math.random() ngoài src/core", ["src"], /Math\.random\s*\(/, {
  exclude: (f) => rel(f).startsWith("src/core/"),
});
// P0-02 R2 — hệ tự giữ bộ đếm giây thì pause không đóng băng được nó.
scan("không Date.now / setTimeout / setInterval trong luật chơi", RULE_DIRS, /\b(Date\.now|setTimeout|setInterval)\s*\(/);
// P0-02 §2.3 — ngẫu nhiên không chạm hệ quả (Đừng-3).
scan("không rng trong craft/ và econ/ledger", ["src/craft"], /\brng\b|RngHub|\.derive\(/);
if (existsSync(join(ROOT, "src/econ/ledger.ts"))) {
  const hits = read(join(ROOT, "src/econ/ledger.ts")).split("\n").filter((l) => /\brng\b/.test(l));
  gates.push({ name: "econ/ledger.ts không dùng rng", hits });
}
// P0-01 §2.1 — không còn netcode.
scan("không colyseus", ["src"], /colyseus/i);
if (/colyseus/i.test(read(join(ROOT, "package.json")))) gates.push({ name: "package.json không có colyseus", hits: ["package.json"] });
// P0-02 §6 — đúng một nơi gọi advance() (StallScene; headless là bản sao của nó để test).
scan("clock.advance() chỉ ở StallScene + sim/headless", ["src"], /\.advance\(/, {
  exclude: (f) => ["src/core/clock.ts", "src/scenes/StallScene.ts", "src/sim/headless.ts"].includes(rel(f)),
});
// P0-01 §2.5 — đủ 44 event.
{
  const src = read(join(ROOT, "src/core/eventbus.ts"));
  const body = src.slice(src.indexOf("export type EventMap = {"), src.indexOf("export type EventKey"));
  const n = [...body.matchAll(/^\s*"[a-z0-9]+:[A-Za-z]+":/gm)].length;
  gates.push({ name: `EventMap khai báo ≥ 44 event (đang có ${n})`, hits: n >= 44 ? [] : [`chỉ có ${n}`] });
}
// P0-01 §2.1 kỷ luật — README / trang giới thiệu không hứa co-op.
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
