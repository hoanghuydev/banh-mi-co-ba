/**
 * npm run validate:rules [-- --content <dir>]
 *
 * Validator cho rule DB — P0-03 §2.3(a), 14 kiểm tra R001–R014, theo đúng định dạng
 * runtime đọc (`when` / `say`, P2-01 §2.4). ERROR chặn commit; WARN in ra nhưng cho qua.
 * Chỉ lỗi làm HỎNG THẬT mới là ERROR — validator quá nghiêm thì writer sẽ tắt nó đi (R8).
 *
 * Rule chết là loại bug tốn nhất để tìm bằng tay: không crash, chỉ là không bao giờ nói.
 */
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { NPC_IDS, STIM_IDS } from "../src/core/types";
import { ROOT, Report, read, readJson, walk } from "./lib";

type WhenValue = string | number | boolean | (string | number)[];
export type Rule = {
  id: string;
  concept: string;
  when?: Record<string, WhenValue>;
  say: string[];
  en?: string[];
  applycontext?: Record<string, { value: number | boolean; duration: number }>;
  followup?: { target: string; concept: string; delay: number };
  speakonce?: boolean;
  norepeat?: boolean;
  cooldown?: number;
  odds?: number;
  silent?: boolean;
};

type FactDef = { type: "enum" | "ordinal" | "number" | "bool"; values?: string[] | string; min?: number; max?: number; ctx?: boolean };
type Schema = { concepts: string[]; facts: Record<string, FactDef>; signature: Record<string, string[]>; silentOk?: string[] };

const MACROS: Record<string, readonly string[]> = { "@NPC_IDS": NPC_IDS, "@STIM_IDS": STIM_IDS };
export const LINE_VARIANT_FLOOR = 6;
/** Mỗi concept cần một rule "lưới an toàn" điểm thấp (P2-01 §2.9: tier-3 = score ≤ 2). */
const SAFETY_NET_SCORE = 2;

function valuesOf(def: FactDef): readonly string[] | null {
  if (!def.values) return null;
  return typeof def.values === "string" ? MACROS[def.values] ?? [] : def.values;
}

/**
 * Khoảng [lo, hi] mà một criterion chấp nhận, trên miền của fact. Trả lỗi dạng chuỗi
 * nếu giá trị lạ (R001/R013) hoặc khoảng rỗng (R002).
 */
function interval(def: FactDef, spec: string | number | boolean): { lo: number; hi: number } | { bad: string; code: "R001" | "R002" | "R013" } {
  const vals = valuesOf(def);
  const dom = def.type === "bool" ? { lo: 0, hi: 1 }
    : vals ? { lo: 0, hi: vals.length - 1 } : { lo: def.min ?? -Infinity, hi: def.max ?? Infinity };
  const macro = typeof def.values === "string";
  const enc = (v: string | number | boolean): number | null => {
    if (def.type === "bool") return v === true || v === "true" || v === 1 ? 1 : v === false || v === "false" || v === 0 ? 0 : null;
    if (def.type === "number") { const n = Number(v); return Number.isFinite(n) ? n : null; }
    const i = vals!.indexOf(String(v));
    return i < 0 ? null : i;
  };
  const badVal = (v: unknown) => ({ bad: `'${v}' không phải giá trị hợp lệ${vals ? ` (${vals.join("|")})` : ""}`, code: macro ? "R013" as const : "R001" as const });
  if (spec === "absent" || spec === "present") return dom;
  let lo: number, hi: number;
  const s = typeof spec === "string" ? spec : null;
  const m = s ? /^(>=|<=|>|<)(.+)$/.exec(s) : null;
  const r = s && !m ? /^(.+)\.\.(.+)$/.exec(s) : null;
  if (m) {
    if (def.type === "enum" || def.type === "bool") return { bad: `so sánh '${m[1]}' trên fact ${def.type} — chỉ ordinal/number mới so được`, code: "R001" };
    const v = enc(m[2]);
    if (v === null) return badVal(m[2]);
    [lo, hi] = m[1] === ">=" ? [v, Infinity] : m[1] === ">" ? [v + 1, Infinity] : m[1] === "<=" ? [-Infinity, v] : [-Infinity, v - 1];
  } else if (r) {
    const a = enc(r[1]), b = enc(r[2]);
    if (a === null) return badVal(r[1]);
    if (b === null) return badVal(r[2]);
    [lo, hi] = [a, b];
  } else {
    const v = enc(spec);
    if (v === null) return badVal(spec);
    lo = hi = v;
  }
  lo = Math.max(lo, dom.lo); hi = Math.min(hi, dom.hi);
  if (lo > hi) return { bad: `'${spec}' nằm ngoài miền [${dom.lo}, ${dom.hi}] — không bao giờ đúng`, code: "R002" };
  return { lo, hi };
}

/** Chữ ký criterion để so trùng (R008/R009). Mảng tách thành nhiều chữ ký như runtime. */
const critSig = (name: string, spec: WhenValue) => `${name}=${JSON.stringify(spec)}`;

export function validateRules(contentDir: string, srcDir: string): Report {
  const r = new Report();
  const rulesDir = join(contentDir, "rules");
  const schemaFile = join(rulesDir, "_blackboard.json");
  const schema = readJson<Schema>(schemaFile);

  const rules: { rule: Rule; file: string }[] = [];
  for (const f of walk(rulesDir, [".json"])) {
    if (f.endsWith("_blackboard.json")) continue;
    const data = readJson<Rule[] | { rules: Rule[] }>(f);
    const list = Array.isArray(data) ? data : data.rules ?? [];
    for (const rule of list) rules.push({ rule, file: f });
  }

  // Concept nào thật sự được HỎI trong code — R003. Chỗ gọi luôn viết concept là literal.
  const emitted = new Set<string>();
  const followTargets = new Set<string>();
  for (const f of walk(srcDir, [".ts"])) {
    const src = read(f);
    for (const m of src.matchAll(/concept:\s*["'`]([A-Z0-9_]+)["'`]/g)) emitted.add(m[1]);
    for (const m of src.matchAll(/speakConcept\([^,()]+,\s*["'`]([A-Z0-9_]+)["'`]/g)) emitted.add(m[1]);
  }
  for (const { rule } of rules) if (rule.followup) { emitted.add(rule.followup.concept); followTargets.add(rule.followup.concept); }

  const concepts = new Set(rules.map((x) => x.rule.concept));
  const readFacts = new Set(rules.flatMap((x) => Object.keys(x.rule.when ?? {})));

  for (const { rule, file } of rules) {
    const where = `[${rule.id}]`;
    if (!schema.concepts.includes(rule.concept)) r.add("R003", "ERROR", file, where, `concept '${rule.concept}' không có trong danh mục concepts của blackboard`);

    for (const [name, spec] of Object.entries(rule.when ?? {})) {
      const def = schema.facts[name];
      if (!def) { r.add("R001", "ERROR", file, where, `fact '${name}' không có trong blackboard — rule không bao giờ khớp`); continue; }
      for (const one of Array.isArray(spec) ? spec : [spec]) {
        const iv = interval(def, one);
        if ("bad" in iv) r.add(iv.code, "ERROR", file, where, `'${name}': ${iv.bad}`);
      }
    }

    if (!emitted.has(rule.concept)) {
      r.add("R003", "ERROR", file, where, `concept '${rule.concept}' không ai hỏi tới (không có speakConcept/concept: nào trong src/, không followup nào trỏ tới)`);
    }
    if (rule.followup) {
      if (!concepts.has(rule.followup.concept)) r.add("R004", "ERROR", file, where, `followup trỏ tới concept '${rule.followup.concept}' không có rule nào`);
      if (rule.followup.target !== "SELF") r.add("R004", "ERROR", file, where, `followup target '${rule.followup.target}' — bản dựng mới hỗ trợ SELF`);
    }
    for (const [fact, a] of Object.entries(rule.applycontext ?? {})) {
      const def = schema.facts[fact];
      if (!def) { r.add("R001", "ERROR", file, where, `applycontext ghi fact '${fact}' không có trong blackboard`); continue; }
      if (!def.ctx) r.add("R005", "ERROR", file, where, `applycontext ghi '${fact}' không phải fact ctx* — chỉ fact ctx được ghi từ rule`);
      if (!readFacts.has(fact)) r.add("R005", "ERROR", file, where, `applycontext ghi '${fact}' mà không rule nào đọc — trí nhớ ghi vào hư không`);
      // P2-01 §2.6: −1 = tới hết ngày · 0 = chỉ tick này · > 0 = giây
      if (!(a.duration === -1 || a.duration >= 0)) r.add("R011", "ERROR", file, where, `applycontext '${fact}' duration ${a.duration} không hợp lệ (−1 | 0 | > 0)`);
    }
    if (rule.silent) {
      if (rule.say?.length) r.add("R007", "ERROR", file, where, "rule `silent` mà vẫn có câu trong `say`");
    } else if (!rule.say?.length) r.add("R007", "ERROR", file, where, "không có câu nào trong `say` (muốn im thì đặt `silent: true`)");
    // Sàn biến thể là cho dòng DÙNG CHUNG (lặp nhiều nhất). Dòng riêng của một NPC có ctx
    // cooldown / odds, và bảng P2-02 §4 chỉ cho 1 câu mẫu mỗi ô — không cảnh báo.
    else if (rule.say.length < LINE_VARIANT_FLOOR && !rule.when?.npcId && !rule.speakonce && !rule.norepeat && !followTargets.has(rule.concept)) {
      r.add("R007", "WARN", file, where, `${rule.say.length} biến thể < sàn ${LINE_VARIANT_FLOOR} (mục tiêu 8)`);
    }
    if (rule.en && rule.en.length !== rule.say.length) r.add("R007", "WARN", file, where, `en có ${rule.en.length} dòng, say có ${rule.say.length}`);
    if (rule.speakonce && rule.norepeat) r.add("R010", "ERROR", file, where, "speakonce và norepeat cùng bật — mâu thuẫn ngữ nghĩa");
    if (rule.odds !== undefined && (rule.odds < 0 || rule.odds > 100)) r.add("R011", "ERROR", file, where, `odds ${rule.odds} ngoài [0,100]`);
    if (rule.cooldown !== undefined && rule.cooldown < 0) r.add("R011", "ERROR", file, where, `cooldown ${rule.cooldown} < 0`);
  }

  // R008 trùng hệt · R009 che khuất vô ích
  const sig = (x: Rule) => Object.entries(x.when ?? {}).map(([k, v]) => critSig(k, v)).sort();
  const ids = new Map<string, string>();
  for (const { rule, file } of rules) {
    if (ids.has(rule.id)) r.add("R008", "ERROR", file, `[${rule.id}]`, `id trùng với rule trong ${ids.get(rule.id)}`);
    ids.set(rule.id, file);
  }
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const a = rules[i].rule, b = rules[j].rule;
      if (a.concept !== b.concept) continue;
      const sa = sig(a), sb = sig(b);
      if (sa.join() === sb.join()) {
        r.add("R008", "ERROR", rules[j].file, `[${b.id}]`, `cùng điều kiện với [${a.id}] — hoà điểm, hai rule tranh nhau ngẫu nhiên`);
        continue;
      }
      const [small, big, bigFile] = sa.length < sb.length ? [a, b, rules[j].file] : [b, a, rules[i].file];
      const setBig = new Set(sig(big));
      const subset = sig(small).every((k) => setBig.has(k));
      if (subset && JSON.stringify(small.say) === JSON.stringify(big.say)) {
        r.add("R009", "WARN", bigFile, `[${big.id}]`, `cụ thể hơn [${small.id}] nhưng nói y hệt — che khuất vô ích`);
      }
    }
  }

  // R006 fact không ai đọc · R012 thiếu lưới an toàn · R014 thiếu dòng đặc trưng
  for (const [name, def] of Object.entries(schema.facts)) {
    if (!readFacts.has(name) && !def.ctx) r.add("R006", "WARN", schemaFile, name, "khai báo trong blackboard nhưng không rule nào đọc");
  }
  const silentOk = new Set(schema.silentOk ?? []);
  for (const concept of concepts) {
    if (followTargets.has(concept) || silentOk.has(concept)) continue;    // chuỗi / chuyện phiếm: im là hợp lệ
    if (!rules.some((x) => x.rule.concept === concept && Object.keys(x.rule.when ?? {}).length <= SAFETY_NET_SCORE)) {
      r.add("R012", "WARN", rulesDir, concept, `không có rule score ≤ ${SAFETY_NET_SCORE} làm lưới an toàn — có tình huống NPC câm`);
    }
  }
  for (const [npc, sigConcepts] of Object.entries(schema.signature)) {
    if (npc.startsWith("_")) continue;
    const has = rules.some((x) => sigConcepts.includes(x.rule.concept) && x.rule.when?.npcId === npc);
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
