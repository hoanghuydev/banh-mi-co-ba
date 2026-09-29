/** Tiện ích chung cho các công cụ Node trong `tools/` — không dùng ở runtime game. */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

export const ROOT = join(import.meta.dirname, "..");

export function walk(dir: string, ext: string[]): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, ext));
    else if (ext.some((e) => p.endsWith(e))) out.push(p);
  }
  return out.sort();
}

export const rel = (p: string) => relative(ROOT, p).replace(/\\/g, "/");

export function readJson<T = any>(p: string): T {
  return JSON.parse(readFileSync(p, "utf8"));
}

export type Level = "ERROR" | "WARN";
export type Diag = { code: string; level: Level; file: string; where: string; detail: string };

export class Report {
  readonly diags: Diag[] = [];
  add(code: string, level: Level, file: string, where: string, detail: string) {
    this.diags.push({ code, level, file: rel(file), where, detail });
  }
  get errors() { return this.diags.filter((d) => d.level === "ERROR"); }
  get warns() { return this.diags.filter((d) => d.level === "WARN"); }
  has(code: string) { return this.diags.some((d) => d.code === code); }

  print(title: string) {
    console.log(`\n${title}`);
    if (!this.diags.length) { console.log("  sạch — 0 lỗi, 0 cảnh báo"); return; }
    for (const d of this.diags) {
      console.log(`  ${d.level === "ERROR" ? "✖" : "⚠"} ${d.code} ${d.level.padEnd(5)} ${d.file} ${d.where}\n      ${d.detail}`);
    }
    console.log(`\n  ${this.errors.length} ERROR · ${this.warns.length} WARN`);
  }
}

/** Levenshtein chuẩn hoá về [0,1] — 1 là giống hệt. */
export function similarity(a: string, b: string) {
  if (a === b) return 1;
  const m = a.length, n = b.length;
  if (!m || !n) return 0;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return 1 - prev[n] / Math.max(m, n);
}

export const read = (p: string) => readFileSync(p, "utf8");
