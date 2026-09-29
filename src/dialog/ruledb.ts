/**
 * Rule DB kiểu Valve / Firewatch — P2-01. Bốn danh từ, không hơn: Fact · Query ·
 * Criterion · Rule. Chọn thoại = tìm rule KHỚP HẾT criterion mà có NHIỀU criterion nhất.
 *
 *   score = criteria.length                (tính lúc nạp — T-1: không trọng số, không ưu tiên)
 *   hoà điểm → chọn ngẫu nhiên đều trong nhóm thắng
 *   criterion trên fact vắng mặt → rule bị LOẠI (trừ criterion "absent")
 *
 * Nhanh nhờ ba thứ: một xô cho mỗi concept · xô xếp GIẢM theo score, gặp điểm thấp hơn
 * người thắng là `break` · criterion xếp theo khoá, loại sớm ngay criterion đầu trượt.
 *
 * `applycontext` là TOÀN BỘ trí nhớ ngắn của rule DB (ghi fact `ctx*` có hạn giờ).
 * `followup` được tra LÚC CHẠY TỚI với query dựng lại — thế giới đổi thì chuỗi tự tắt.
 *
 * Không import Phaser. Mọi số ngẫu nhiên từ stream `dialog-shufflebag` được truyền vào.
 */
import type { Rng } from "../core/rng";
import { FACTS, NEG_INF, POS_INF, Query, encode, factDef } from "./facts";

export type WhenValue = string | number | boolean | (string | number)[];
export type RuleJson = {
  id: string;
  concept: string;
  when?: Record<string, WhenValue>;
  say: string[];
  en?: string[];
  emote?: string;
  pose?: string;
  applycontext?: Record<string, { value: number | boolean; duration: number }>;
  followup?: { target: "SELF"; concept: string; delay: number };
  speakonce?: boolean;
  norepeat?: boolean;
  cooldown?: number;
  odds?: number;
  /**
   * Im lặng CÓ CHỦ Ý (P2-02 §2.3): rule khớp thì người này KHÔNG nói — "không một chữ" là
   * một câu trả lời của nhân vật, không phải thiếu nội dung. `say` để rỗng.
   */
  silent?: boolean;
};

/** Khoảng đóng [lo, hi]; `absent` = chỉ khớp khi fact KHÔNG có mặt. */
export type Criterion = { k: number; lo: number; hi: number; absent: boolean };

export type Rule = {
  idName: string;
  concept: string;
  criteria: Criterion[];
  score: number;
  say: string[];
  en?: string[];
  emote?: string;
  pose?: string;
  applycontext: { k: number; name: string; value: number; durationSec: number }[];
  followup?: { concept: string; delaySec: number };
  speakonce: boolean;
  norepeat: boolean;
  cooldownSec: number;
  odds: number;
  silent: boolean;
};

/** "Tier" chỉ là tên người viết gọi một dải score (P2-01 §2.9) — không phải field. */
export const tierOfScore = (score: number): 1 | 2 | 3 => (score >= 5 ? 1 : score >= 3 ? 2 : 3);

function parseCriterion(name: string, spec: string | number | boolean): Criterion {
  const f = factDef(name);
  const k = f.index;
  if (spec === "absent") return { k, lo: NEG_INF, hi: POS_INF, absent: true };
  if (spec === "present") return { k, lo: NEG_INF, hi: POS_INF, absent: false };
  if (typeof spec === "string") {
    const m = /^(>=|<=|>|<)(.+)$/.exec(spec);
    if (m) {
      const v = encode(f, m[2]);
      if (m[1] === ">=") return { k, lo: v, hi: POS_INF, absent: false };
      if (m[1] === ">") return { k, lo: v + 1, hi: POS_INF, absent: false };
      if (m[1] === "<=") return { k, lo: NEG_INF, hi: v, absent: false };
      return { k, lo: NEG_INF, hi: v - 1, absent: false };
    }
    const r = /^(.+)\.\.(.+)$/.exec(spec);
    if (r) return { k, lo: encode(f, r[1]), hi: encode(f, r[2]), absent: false };
  }
  const v = encode(f, spec);
  return { k, lo: v, hi: v, absent: false };
}

/**
 * Nạp + biên dịch. Giá trị mảng trong `when` ("một trong nhiều") được TÁCH thành các
 * rule anh em cùng câu thoại (P2-01 §2.4) — mỗi rule vẫn chỉ là một dãy khoảng đóng.
 */
export function compileRules(list: RuleJson[]): Rule[] {
  const out: Rule[] = [];
  for (const j of list) {
    const entries = Object.entries(j.when ?? {});
    let variants: [string, string | number | boolean][][] = [[]];
    for (const [name, spec] of entries) {
      const opts = Array.isArray(spec) ? spec : [spec];
      variants = variants.flatMap((v) => opts.map((o) => [...v, [name, o] as [string, string | number | boolean]]));
    }
    variants.forEach((v, i) => {
      const criteria = v.map(([n, s]) => parseCriterion(n, s)).sort((a, b) => a.k - b.k);
      out.push({
        idName: variants.length > 1 ? `${j.id}#${i}` : j.id,
        concept: j.concept,
        criteria,
        score: criteria.length,
        say: j.say, en: j.en, emote: j.emote, pose: j.pose,
        applycontext: Object.entries(j.applycontext ?? {}).map(([name, a]) => ({
          k: factDef(name).index, name, value: Number(a.value === true ? 1 : a.value === false ? 0 : a.value), durationSec: a.duration,
        })),
        followup: j.followup ? { concept: j.followup.concept, delaySec: j.followup.delay } : undefined,
        speakonce: !!j.speakonce,
        norepeat: !!j.norepeat,
        cooldownSec: j.cooldown ?? 0,
        odds: j.odds ?? 100,
        silent: !!j.silent,
      });
    });
  }
  return out;
}

export function matches(r: Rule, q: Query): boolean {
  const cs = r.criteria;
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i];
    if (c.absent) { if (q.has(c.k)) return false; continue; }
    if (!q.has(c.k)) return false;                       // luật loại trừ của Ruskin
    const v = q.get(c.k);
    if (v < c.lo || v > c.hi) return false;
  }
  return true;
}

/** Trạng thái đã-nói của rule — sống trong save (`dialogState`), không trong content. */
export type SpokenState = {
  /** speakonce: một lần cho cả save. */
  once: Set<string>;
  /** norepeat: một lần mỗi ngày — idName → ngày nói gần nhất. */
  norepeat: Record<string, number>;
  /** cooldown: idName → giây thật lúc nói gần nhất (trong buổi bán). */
  lastAt: Map<string, number>;
  day: number;
};

export class RuleDb {
  private byConcept = new Map<string, Rule[]>();
  readonly all: Rule[];

  constructor(rules: Rule[]) {
    this.all = rules;
    for (const r of rules) {
      let b = this.byConcept.get(r.concept);
      if (!b) this.byConcept.set(r.concept, (b = []));
      b.push(r);
    }
    for (const b of this.byConcept.values()) b.sort((a, b2) => b2.score - a.score);
  }

  concepts() { return [...this.byConcept.keys()]; }

  private blocked(r: Rule, st: SpokenState, now: number) {
    if (r.speakonce && st.once.has(r.idName)) return true;
    if (r.norepeat && st.norepeat[r.idName] === st.day) return true;
    const last = st.lastAt.get(r.idName);
    // now < last: đang giải thích một lần hỏi TRƯỚC lúc nói (overlay dev) — chưa tính
    return last !== undefined && now >= last && now - last < r.cooldownSec;
  }

  /**
   * P2-01 §2.5. Sửa một lỗ của pseudo-code trong doc: rule trượt `odds` KHÔNG được để
   * rule điểm thấp hơn thắng trong cùng lượt — nó vẫn giữ mức điểm, chỉ là không nói.
   */
  select(concept: string, q: Query, st: SpokenState, now: number, rng: Rng): Rule | null {
    const bucket = this.byConcept.get(concept);
    if (!bucket) return null;
    let bestScore = -1;
    const winners: Rule[] = [];
    for (const r of bucket) {
      if (r.score < bestScore) break;
      if (this.blocked(r, st, now)) continue;
      if (!matches(r, q)) continue;
      if (r.odds < 100 && rng.next() * 100 >= r.odds) { bestScore = Math.max(bestScore, r.score); continue; }
      if (r.score > bestScore) { bestScore = r.score; winners.length = 0; }
      winners.push(r);
    }
    if (!winners.length) return null;
    return winners.length === 1 ? winners[0] : winners[Math.floor(rng.next() * winners.length)];
  }

  /** Ghi nhận rule vừa được NÓI (không phải vừa được chọn — chọn rồi hoãn thì chưa tính). */
  markSpoken(r: Rule, st: SpokenState, now: number) {
    if (r.speakonce) st.once.add(r.idName);
    if (r.norepeat) st.norepeat[r.idName] = st.day;
    st.lastAt.set(r.idName, now);
  }

  /**
   * "Tại sao nó nói câu đó?" — P0-03 §2.2 panel F3 / `rule.why`: xếp hạng mọi rule của
   * concept, rule nào trượt thì trượt ở criterion nào.
   */
  explain(concept: string, q: Query, st: SpokenState, now: number) {
    return (this.byConcept.get(concept) ?? []).map((r) => {
      if (this.blocked(r, st, now)) return { id: r.idName, score: r.score, ok: false, why: "đã nói / đang cooldown" };
      for (const c of r.criteria) {
        const has = q.has(c.k);
        const ok = c.absent ? !has : has && q.get(c.k) >= c.lo && q.get(c.k) <= c.hi;
        if (!ok) {
          const f = FACTS[c.k];
          const show = (v: number) => (v <= NEG_INF || v >= POS_INF ? "∞" : f.type === "bool" ? String(v === 1) : f.values ? f.values[v] ?? String(v) : String(v));
          const need = c.absent ? "vắng" : c.lo === c.hi ? show(c.lo) : `${show(c.lo)}..${show(c.hi)}`;
          return { id: r.idName, score: r.score, ok: false, why: `loại tại ${f.name} (${has ? `= ${show(q.get(c.k))}` : "vắng"}; cần ${need})` };
        }
      }
      return { id: r.idName, score: r.score, ok: true, why: "khớp" };
    });
  }
}
