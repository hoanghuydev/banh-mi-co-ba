/**
 * npm run content:stats — bảng đếm để đối chiếu mốc CANON §11 (P0-03 §2.3c).
 *
 * Mốc: v1/demo ~520 dòng ~5.000 từ · beta nội bộ ~1.200 · full ~2.980 ~30.000 từ.
 * Firewatch: 8,3 từ/dòng. Nếu ta ra 20 từ/dòng thì ta đang viết VĂN chứ không viết
 * bark, và 2.980 dòng sẽ thành 60.000 từ.
 */
import { join } from "node:path";
import { ROOT, readJson, walk } from "./lib";

const content = join(ROOT, "src", "content");
type Row = { where: string; n: number; words: number; tier: number; npc: string | null; generic: boolean };
const rows: Row[] = [];

const words = (s: string) => s.replace(/\{\w+\}/g, "x").split(/\s+/).filter(Boolean).length;

for (const f of walk(join(content, "lines"), [".json"])) {
  for (const p of readJson<any>(f).pools ?? []) {
    rows.push({
      where: `pool ${p.id}`, n: p.variants.length, words: p.variants.reduce((a: number, s: string) => a + words(s), 0),
      tier: p.tier ?? 2, npc: p.npc ?? null, generic: !p.npc,
    });
  }
}
for (const f of walk(join(content, "rules"), [".json"])) {
  if (f.endsWith("_blackboard.json")) continue;
  const data = readJson<any>(f);
  for (const rule of Array.isArray(data) ? data : data.rules ?? [data]) {
    if (rule.silent || !rule.say?.length) continue;            // im lặng có chủ ý: không phải dòng thoại
    const npc: string | null = typeof rule.when?.npcId === "string" ? rule.when.npcId : null;
    // tier = tên của dải score (P2-01 §2.9): ≥5 → 1 · 3–4 → 2 · ≤2 → 3
    const score = Object.keys(rule.when ?? {}).length;
    rows.push({ where: `rule ${rule.id}`, n: rule.say.length, words: rule.say.reduce((a: number, s: string) => a + words(s), 0),
      tier: score >= 5 ? 1 : score >= 3 ? 2 : 3, npc, generic: !npc });
  }
}

const lines = rows.reduce((a, r) => a + r.n, 0);
const totalWords = rows.reduce((a, r) => a + r.words, 0);
const perTier = [1, 2, 3].map((t) => rows.filter((r) => r.tier === t).reduce((a, r) => a + r.n, 0));
const small = rows.filter((r) => r.n < 8);
const generic = rows.filter((r) => r.generic).reduce((a, r) => a + r.n, 0);

const MILESTONES = [["v1/demo", 520, 5000], ["beta nội bộ", 1200, 12000], ["full", 2980, 30000]] as const;

console.log("\ncontent:stats");
console.log(`  tổng dòng        ${lines}`);
console.log(`  tổng từ          ${totalWords}`);
console.log(`  từ / dòng        ${(totalWords / Math.max(1, lines)).toFixed(1)}   (Firewatch 8,3 · mục tiêu 8–12 · đèn đỏ > 16)`);
console.log(`  theo tier bark   1: ${perTier[0]} · 2: ${perTier[1]} · 3: ${perTier[2]}`);
console.log(`  generic / riêng  ${generic} / ${lines - generic}`);
console.log(`  túi < 8 biến thể ${small.length}/${rows.length}  ${small.map((r) => `${r.where}(${r.n})`).join(", ")}`);
console.log(`  túi < 6 biến thể ${rows.filter((r) => r.n < 6).length}   (B3: đèn đỏ khi > 0 từ P2)`);
console.log("\n  mốc CANON §11:");
for (const [name, l, w] of MILESTONES) {
  console.log(`    ${name.padEnd(12)} ${String(l).padStart(5)} dòng ${String(w).padStart(6)} từ   → đang ở ${(lines / l * 100).toFixed(1)}% dòng, ${(totalWords / w * 100).toFixed(1)}% từ`);
}
