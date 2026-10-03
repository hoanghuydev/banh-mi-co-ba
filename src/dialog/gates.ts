/**
 * CỔNG — một ngôn ngữ duy nhất cho `need`, `while`, và `when` của rule DB. P2-09 §2.2.
 *
 * Trước file này có BA từ vựng cùng mô tả một thế giới:
 *   A. `_blackboard.json` + `dialog/facts.ts` — 52 fact, rule DB đọc
 *   B. `sim/worldfacts.ts` — 34 khoá `p. t. w. c.`, chỉ `while` đọc
 *   C. `TalkWhen` — cổng cấp cuộc
 * và không đường nào nối chúng. Hậu quả không phải chuyện gọn gàng:
 *
 *  · `TalkNode.need` tra đúng một chỗ — `gate.flags[need]`. Viết `need: "t.cutLine"` vào
 *    JSON là **ẩn mất nút đó vĩnh viễn**, im lặng, không ai biết. Chặn trọn 374 nút `SỬA`.
 *  · Cùng một lỗi gõ sai: ở A **ném lỗi lúc nạp**, ở B **im lặng trả `false`**. Hai chế
 *    độ hỏng ngược nhau cho cùng một sai lầm — định nghĩa của một hệ không dạy được người
 *    dùng nó.
 *
 * Từ đây: một danh mục fact, một `Query`, một bộ `Criterion`. Khoá lạ **ném lỗi**, và
 * `tools/validate-talks.ts` quét toàn bộ nội dung lúc build nên không có đường nào lọt.
 *
 * Cú pháp cố ý NGHÈO — người viết nội dung không phải học một ngôn ngữ:
 *
 *   `p.holdsBread`        alias phẳng
 *   `!c.angered`          phủ định, dấu chấm than ở ĐẦU
 *   `w.queue(2)`          alias có tham số
 *   `coBienHieu`          KHÔNG có dấu chấm = cờ chuyện (tương thích bản cũ, xem §2.2)
 *
 * Cần logic phức tạp hơn thì đó là dấu hiệu nên thêm MỘT alias có tên đọc được, chứ
 * không phải viết một biểu thức. Không Phaser, không RNG.
 */
import CATALOG from "../content/rules/_blackboard.json";
import { Query, factDef } from "./facts";
import { type Criterion } from "./ruledb";
import { NEG_INF, POS_INF, encode } from "./facts";

type AliasSpec = Record<string, string | number | boolean | (string | number)[]>;
const ALIASES = (CATALOG as unknown as { aliases: Record<string, AliasSpec> }).aliases ?? {};

export const ALIAS_NAMES: readonly string[] = Object.keys(ALIASES);
/** Alias nào nhận tham số (`$` trong giá trị) — `w.queue(2)`, `t.purpose(DI_CHO)`. */
export const ALIAS_FNS: readonly string[] = ALIAS_NAMES.filter((n) =>
  Object.values(ALIASES[n]).some((v) => typeof v === "string" && v.includes("$")));
/** Alias phẳng — `p.holdsBread`. */
export const ALIAS_FLAGS: readonly string[] = ALIAS_NAMES.filter((n) => !ALIAS_FNS.includes(n));

/**
 * Một cổng đã biên dịch. `any` là phép HOẶC trong một criterion (`playerHolding` khớp một
 * trong bốn loại ổ); mảng ngoài là phép VÀ.
 */
export type Gate = { key: string; neg: boolean; all: { any: Criterion[] }[] };

/** Cờ chuyện: chuỗi không có dấu chấm. Giữ nguyên nghĩa cũ — 36 nút `need` chạy không sửa. */
export const isStoryFlag = (key: string) => !key.includes(".");

function criterionOf(fact: string, spec: string | number | boolean): Criterion {
  const f = factDef(fact);
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

const CACHE = new Map<string, Gate>();

/**
 * Biên dịch một khoá. **Ném lỗi** nếu khoá lạ — đó là cả điểm của việc gộp: một chế độ
 * hỏng duy nhất, và nó nổ ở chỗ sửa được (lúc nạp / lúc validate), không nổ âm thầm ở
 * giữa buổi bán.
 */
export function compileGate(key: string): Gate {
  const hit = CACHE.get(key);
  if (hit) return hit;
  const neg = key.startsWith("!");
  const body = neg ? key.slice(1) : key;

  const call = /^([a-z]\.[a-zA-Z]+)\((.*)\)$/.exec(body);
  const name = call ? call[1] : body;
  const arg = call ? call[2] : null;

  const spec = ALIASES[name];
  if (!spec) {
    throw new Error(
      `cổng: khoá '${key}' không có trong \`aliases\` của _blackboard.json`
      + ` — xem P2-09 §2.2. Khoá gần nhất: ${nearest(name).join(" · ") || "(không có)"}`);
  }
  if (call && !ALIAS_FNS.includes(name)) throw new Error(`cổng: '${name}' không nhận tham số`);
  if (!call && ALIAS_FNS.includes(name)) throw new Error(`cổng: '${name}' cần một tham số — viết '${name}(…)'`);

  const all = Object.entries(spec).map(([fact, raw]) => {
    const list = Array.isArray(raw) ? raw : [raw];
    return {
      any: list.map((one) =>
        criterionOf(fact, typeof one === "string" && one.includes("$")
          ? one.replace("$", String(arg ?? ""))
          : one)),
    };
  });

  const gate: Gate = { key, neg, all };
  CACHE.set(key, gate);
  return gate;
}

/** Ba khoá gần giống nhất — thông báo lỗi phải chỉ được đường đi, không chỉ nói "sai". */
function nearest(name: string): string[] {
  const head = name.split(".")[0];
  return ALIAS_NAMES.filter((n) => n.startsWith(`${head}.`)).slice(0, 3);
}

function holdsCriterion(c: Criterion, q: Query): boolean {
  if (c.absent) return !q.has(c.k);
  if (!q.has(c.k)) return false;                  // luật loại trừ của Ruskin — fact vắng = loại
  const v = q.get(c.k);
  return v >= c.lo && v <= c.hi;
}

/** Cổng này có đúng với ảnh chụp thế giới hiện tại không. */
export function gateHolds(key: string, q: Query): boolean {
  const g = compileGate(key);
  const ok = g.all.every((grp) => grp.any.some((c) => holdsCriterion(c, q)));
  return g.neg ? !ok : ok;
}

/** Mọi khoá đều đúng (phép VÀ). Danh sách rỗng = luôn đúng. */
export const allGates = (keys: readonly string[] | undefined, q: Query) =>
  !keys?.length || keys.every((k) => gateHolds(k, q));

/** Khoá nào hỏng — để nhật ký dev nói được vì sao câu đó ra dấu "?". */
export const firstBrokenGate = (keys: readonly string[] | undefined, q: Query) =>
  keys?.find((k) => !gateHolds(k, q)) ?? null;

/**
 * Khoá có hợp lệ không, KHÔNG ném — validator và test dùng để gom hết lỗi một lượt thay
 * vì chết ở cái đầu tiên.
 */
export function checkGate(key: string): string | null {
  try { compileGate(key); return null; } catch (e) { return (e as Error).message; }
}
