/**
 * npm run validate:rules [-- --content <dir>]
 *
 * Validator cho rule DB — P0-03 §2.3(a), 14 kiểm tra R001–R014.
 * ERROR chặn commit; WARN in ra nhưng cho qua. Chỉ lỗi làm HỎNG THẬT mới là ERROR —
 * validator quá nghiêm thì writer sẽ tắt nó đi (R8).
 *
 * Rule chết là loại bug tốn nhất để tìm bằng tay: không crash, chỉ là không bao giờ nói.
 */
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { NPC_IDS, STIM_IDS } from "../src/core/types";
import { ROOT, Report, read, readJson, walk } from "./lib";

export type Criterion = { key: string; op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in"; value: unknown };
export type Rule = {
  id: string;
  concept: string;
  criteria: Criterion[];
  responses: { id: string; variants: string[]; en?: string[] }[];
  applycontext?: [string, unknown, number][];
  followup?: [string, string, number];
  speakonce?: boolean;
  norepeat?: boolean;
  odds?: number;
  tier?: 1 | 2 | 3;
  npc?: string;
};

type KeyDef = { type: "enum" | "ordinal" | "number" | "bool" | "string"; values?: string[] | string; min?: number; max?: number };
type Schema = { keys: Record<string, KeyDef>; signature: Record<string, string[]> };

const MACROS: Record<string, readonly string[]> = { "@NPC_IDS": NPC_IDS, "@STIM_IDS": STIM_IDS };
export const LINE_VARIANT_FLOOR = 6;

function valuesOf(def: KeyDef): string[] | null {
  if (!def.values) return null;
  return typeof def.values === "string" ? [...(MACROS[def.values] ?? [])] : def.values;
}

/** Tập giá trị còn thoả sau khi giao mọi criterion trên một key. Rỗng = R002. */
function satisfiable(def: KeyDef, cs: Criterion[]): boolean {
  if (def.type === "number") {
    let lo = def.min ?? -Infinity, hi = def.max ?? Infinity;
    const not = new Set<number>();
    for (const c of cs) {
      const v = Number(c.value);
      if (c.op === "eq") { lo = Math.max(lo, v); hi = Math.min(hi, v); }
      else if (c.op === "gt") lo = Math.max(lo, v + 1e-9);
      else if (c.op === "gte") lo = Math.max(lo, v);
      else if (c.op === "lt") hi = Math.min(hi, v - 1e-9);
      else if (c.op === "lte") hi = Math.min(hi, v);
      else if (c.op === "neq") not.add(v);
    }
    return lo <= hi && !(lo === hi && not.has(lo));
  }
  if (def.type === "bool") {
    let allowed = new Set([true, false]);
    for (const c of cs) {
      if (c.op === "eq") allowed = new Set([...allowed].filter((x) => x === c.value));
      if (c.op === "neq") allowed.delete(c.value as boolean);
    }
    return allowed.size > 0;
  }
  const all = valuesOf(def);
  if (!all) {                                                // string tự do
    const eqs = new Set(cs.filter((c) => c.op === "eq").map((c) => String(c.value)));
    return eqs.size <= 1;
  }
  let allowed = new Set(all);
  for (const c of cs) {
    const v = String(c.value);
    const i = all.indexOf(v);
    const keep = (pred: (x: string, j: number) => boolean) => { allowed = new Set([...allowed].filter((x) => pred(x, all.indexOf(x)))); };
    if (c.op === "eq") keep((x) => x === v);
    else if (c.op === "neq") keep((x) => x !== v);
    else if (c.op === "in") keep((x) => (c.value as string[]).includes(x));
    else if (def.type === "ordinal") {
      if (c.op === "gte") keep((_, j) => j >= i);
      if (c.op === "gt") keep((_, j) => j > i);
      if (c.op === "lte") keep((_, j) => j <= i);
      if (c.op === "lt") keep((_, j) => j < i);
    }
  }
  return allowed.size > 0;
}

const critKey = (c: Criterion) => `${c.key}|${c.op}|${JSON.stringify(c.value)}`;

export function validateRules(contentDir: string, srcDir: string): Report {
  const r = new Report();
  const rulesDir = join(contentDir, "rules");
  const schemaFile = join(rulesDir, "_blackboard.json");
  const schema = readJson<Schema>(schemaFile);

  const rules: { rule: Rule; file: string }[] = [];
  for (const f of walk(rulesDir, [".json"])) {
    if (f.endsWith("_blackboard.json")) continue;
    const data = readJson<Rule | Rule[] | { rules: Rule[] }>(f);
    const list = Array.isArray(data) ? data : "rules" in data ? data.rules : [data];
    for (const rule of list) rules.push({ rule, file: f });
  }

  // Concept nào thật sự được phát trong code (dialog:requested) — R003.
  const emitted = new Set<string>();
  for (const f of walk(srcDir, [".ts"])) {
    for (const m of read(f).matchAll(/concept:\s*["'`]([A-Z0-9_]+)["'`]/g)) emitted.add(m[1]);
  }
  for (const { rule } of rules) if (rule.followup) emitted.add(rule.followup[1]);   // followup cũng là một nguồn phát

  const concepts = new Set(rules.map((x) => x.rule.concept));
  const readKeys = new Set(rules.flatMap((x) => x.rule.criteria.map((c) => c.key)));

  for (const { rule, file } of rules) {
    const where = `[${rule.id}]`;
    const byKey = new Map<string, Criterion[]>();
    for (const c of rule.criteria) byKey.set(c.key, [...(byKey.get(c.key) ?? []), c]);

    for (const [key, cs] of byKey) {
      const def = schema.keys[key];
      if (!def) { r.add("R001", "ERROR", file, where, `key '${key}' không có trong blackboard — rule không bao giờ match`); continue; }
      if (!satisfiable(def, cs)) {
        r.add("R002", "ERROR", file, where, `'${key}': ${cs.map((c) => `${c.op} ${JSON.stringify(c.value)}`).join(" ∧ ")} mâu thuẫn`);
      }
      // R013 — định danh phải thuộc CANON (11+1 sự kiện, 12 NPC)
      const canon = def.values === "@NPC_IDS" ? NPC_IDS : def.values === "@STIM_IDS" ? STIM_IDS : null;
      if (canon) {
        for (const c of cs) {
          const vals = Array.isArray(c.value) ? c.value : [c.value];
          for (const v of vals) if (!canon.includes(String(v) as never)) {
            r.add("R013", "ERROR", file, where, `'${v}' không thuộc danh sách CANON của ${key}`);
          }
        }
      }
    }
    if (rule.npc && !NPC_IDS.includes(rule.npc as never)) r.add("R013", "ERROR", file, where, `npc '${rule.npc}' không thuộc CANON §9`);

    if (!emitted.has(rule.concept)) {
      r.add("R003", "ERROR", file, where, `concept '${rule.concept}' không có ai emit (không có dialog:requested nào trong src/)`);
    }
    if (rule.followup && !concepts.has(rule.followup[1])) {
      r.add("R004", "ERROR", file, where, `followup trỏ tới concept '${rule.followup[1]}' không tồn tại`);
    }
    for (const [key, , dur] of rule.applycontext ?? []) {
      if (!readKeys.has(key)) r.add("R005", "ERROR", file, where, `applycontext ghi '${key}' mà không rule nào đọc — trí nhớ ghi vào hư không`);
      if (!(dur > 0)) r.add("R011", "ERROR", file, where, `applycontext '${key}' có duration_sec ${dur} ≤ 0`);
    }
    for (const resp of rule.responses) {
      if (resp.variants.length < LINE_VARIANT_FLOOR) {
        r.add("R007", "WARN", file, `${where}.${resp.id}`, `${resp.variants.length} biến thể < sàn ${LINE_VARIANT_FLOOR} (mục tiêu 8)`);
      }
    }
    if (rule.speakonce && rule.norepeat) r.add("R010", "ERROR", file, where, "speakonce và norepeat cùng bật — mâu thuẫn ngữ nghĩa");
    if (rule.odds !== undefined && (rule.odds < 0 || rule.odds > 100)) r.add("R011", "ERROR", file, where, `odds ${rule.odds} ngoài [0,100]`);
  }

  // R008 trùng hệt · R009 che khuất vô ích
  const sig = (x: Rule) => x.criteria.map(critKey).sort();
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const a = rules[i].rule, b = rules[j].rule;
      if (a.concept !== b.concept) continue;
      const sa = sig(a), sb = sig(b);
      if (sa.join() === sb.join()) {
        r.add("R008", "ERROR", rules[j].file, `[${b.id}]`, `trùng hệt [${a.id}] — hoà điểm, thứ tự load quyết định = không xác định`);
        continue;
      }
      const [small, big, bigFile] = sa.length < sb.length ? [a, b, rules[j].file] : [b, a, rules[i].file];
      const setBig = new Set(sig(big));
      const subset = sig(small).every((k) => setBig.has(k));
      const sameText = JSON.stringify(small.responses.map((x) => x.variants)) === JSON.stringify(big.responses.map((x) => x.variants));
      if (subset && sameText) {
        r.add("R009", "WARN", bigFile, `[${big.id}]`, `cụ thể hơn [${small.id}] nhưng nói y hệt — che khuất vô ích`);
      }
    }
  }

  // R006 key không ai dùng · R012 thiếu lưới tier-3 · R014 thiếu dòng đặc trưng
  for (const key of Object.keys(schema.keys)) {
    if (!readKeys.has(key)) r.add("R006", "WARN", schemaFile, key, "khai báo trong blackboard nhưng không criterion nào đọc");
  }
  for (const concept of concepts) {
    if (!rules.some((x) => x.rule.concept === concept && x.rule.tier === 3)) {
      r.add("R012", "WARN", rulesDir, concept, "không có rule tier-3 làm lưới an toàn — có tình huống NPC câm");
    }
  }
  for (const [npc, sigConcepts] of Object.entries(schema.signature)) {
    if (npc.startsWith("_")) continue;
    const has = rules.some((x) => sigConcepts.includes(x.rule.concept)
      && x.rule.criteria.some((c) => c.key === "Customer.npcId" && c.value === npc));
    if (!has) r.add("R014", "WARN", schemaFile, npc, `chưa có dòng riêng cho tình huống đặc trưng (${sigConcepts.join(", ")})`);
  }
  return r;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const i = process.argv.indexOf("--content");
  const content = i >= 0 ? process.argv[i + 1] : join(ROOT, "src", "content");
  const t0 = performance.now();
  const rep = validateRules(content, join(ROOT, "src"));
  rep.print(`validate:rules — ${((performance.now() - t0) / 1000).toFixed(2)} s`);
  process.exit(rep.errors.length ? 1 : 0);
}
