/**
 * Danh mục FACT của rule DB — P2-01 §2.2–§2.3. Nguồn: `content/rules/_blackboard.json`
 * (validator đọc cùng file đó, nên runtime và validator không bao giờ lệch nhau).
 *
 * Mọi fact và mọi giá trị đều là SỐ NGUYÊN lúc chạy (T-2: không so chuỗi trong vòng
 * nóng). Khoá fact = chỉ số trong danh mục, xếp theo alphabet. Giá trị:
 *   enum / ordinal → chỉ số trong danh sách giá trị · bool → 0/1 · number → số nguyên.
 * Không có module nào ngoài `dialog/` được biết cách mã hoá này.
 */
import CATALOG from "../content/rules/_blackboard.json";
import { NPC_IDS, STIM_IDS } from "../core/types";
import { BAND_IDS, DEED_IDS, HAND_IDS, PRACTICE_IDS, PURPOSE_IDS, STATE_IDS } from "../content/vocab";

export type FactType = "enum" | "ordinal" | "number" | "bool";
type RawFact = { scope: string; type: FactType; values?: string[] | string; min?: number; max?: number; ctx?: boolean; conditional?: boolean };

/**
 * Danh sách id dài thì khai bằng macro, không chép tay vào JSON — P2-09 §2.2.
 * Nguồn của mọi macro: `content/vocab.ts` và `core/types.ts`. Validator đọc **đúng** bảng
 * này qua `MACROS` của `tools/validate-rules.ts`; test `V-2` canh hai bên không lệch.
 */
export const MACROS: Record<string, readonly string[]> = {
  "@NPC_IDS": NPC_IDS, "@STIM_IDS": STIM_IDS,
  "@HAND_IDS": HAND_IDS, "@PRACTICE_IDS": PRACTICE_IDS, "@PURPOSE_IDS": PURPOSE_IDS,
  "@STATE_IDS": STATE_IDS, "@DEED_IDS": DEED_IDS, "@BAND_IDS": BAND_IDS,
};

export type FactDef = { name: string; index: number; type: FactType; values: readonly string[] | null; ctx: boolean };

const raw = (CATALOG as unknown as { facts: Record<string, RawFact> }).facts;
export const FACTS: readonly FactDef[] = Object.keys(raw).filter((k) => !k.startsWith("_")).sort().map((name, index) => {
  const f = raw[name];
  const values = typeof f.values === "string" ? MACROS[f.values] ?? [] : f.values ?? null;
  return { name, index, type: f.type, values, ctx: !!f.ctx };
});
const BY_NAME = new Map(FACTS.map((f) => [f.name, f]));
export const CONCEPTS: readonly string[] = (CATALOG as unknown as { concepts: string[] }).concepts;

export function factDef(name: string): FactDef {
  const f = BY_NAME.get(name);
  if (!f) throw new Error(`rule DB: fact '${name}' không có trong _blackboard.json`);
  return f;
}

export const NEG_INF = -0x7fffffff;
export const POS_INF = 0x7fffffff;

/** Giá trị thật → số nguyên theo kiểu của fact. Tên enum lạ thì ném lỗi (phát hiện lúc nạp). */
export function encode(f: FactDef, v: string | number | boolean): number {
  if (f.type === "bool") return v === true || v === 1 || v === "true" ? 1 : 0;
  if (f.type === "number") return Math.round(Number(v));
  const i = f.values!.indexOf(String(v));
  if (i < 0) throw new Error(`rule DB: '${v}' không phải giá trị của ${f.name} (${f.values!.join("|")})`);
  return i;
}

/**
 * Query — một dict PHẲNG mọi fact đúng NGAY LÚC NÀY (P2-01 §2.1). Dựng lại ở mỗi lần
 * hỏi, không cache. Fact vắng mặt ≠ 0: rule có criterion trên fact vắng mặt bị LOẠI.
 */
export class Query {
  readonly val = new Int32Array(FACTS.length);
  readonly mark = new Uint8Array(FACTS.length);

  reset() { this.mark.fill(0); return this; }

  set(name: string, v: string | number | boolean) {
    const f = factDef(name);
    this.val[f.index] = encode(f, v);
    this.mark[f.index] = 1;
    return this;
  }

  has(i: number) { return this.mark[i] === 1; }
  get(i: number) { return this.val[i]; }

  /** Cho overlay dev / rule.why: fact nào đang có, giá trị gì (đọc được bằng tên). */
  dump(): [string, string | number][] {
    const out: [string, string | number][] = [];
    for (const f of FACTS) {
      if (!this.mark[f.index]) continue;
      const v = this.val[f.index];
      out.push([f.name, f.values ? f.values[v] ?? v : v]);
    }
    return out;
  }
}
