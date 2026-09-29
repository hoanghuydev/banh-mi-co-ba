/**
 * npm run lint:lines [-- --fix] [-- --content <dir>]
 *
 * Linter cho file thoại — P0-03 §2.3(b), 13 kiểm tra L001–L013.
 * `--fix` sửa được L004 (NFC), L005 (kiểu đặt dấu), L007 (viết hoa toàn bộ).
 *
 * Đọc `content/lines/**.json` (pool generic) và `content/rules/**.json` (response của rule).
 */
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { ROOT, Report, readJson, similarity, walk } from "./lib";

export const LINE_MAX_CHARS = 90;
export const LINE_SIMILARITY_MAX = 0.85;
/** Bong bóng thoại ở fontScale 2: rộng 285 px, chữ 24 px (xem ui/stall/BubblePool). */
const BUBBLE_PX = 285, FONT_PX_AT_2X = 24, MAX_LINES_AT_2X = 3;

type Red = {
  war: string[]; demeaning: string[];
  northern: { allowNpcs: string[]; words: Record<string, string> };
  unaccentedRisk: string[]; enPronounLeaks: string[];
};

/** Một "túi" thoại cần lint: biến thể + biến được phép + ai nói. */
type Bag = { file: string; where: string; vi: string[]; en?: string[]; vars: string[]; npc?: string; set: (vi: string[]) => void };

// ── bảng chữ ────────────────────────────────────────────────────────────────
const VN_VOWELS = "aàáảãạăằắẳẵặâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩịoòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵ";
const VN_LETTERS = new Set([..."bcdđghklmnpqrstvx" + "fjwz" + VN_VOWELS]);
const PUNCT = new Set([..." .,;:!?'\"()[]-–—…/%&+*#@_~«»“”‘’0123456789₫\n"]);
const DIACRITIC = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

/** L005 — chuẩn đã chọn: dấu đặt kiểu `oà`, `uỷ` (tông hoài niệm hợp với game). */
const ACCENT_FIX: Record<string, string> = {
  "òa": "oà", "óa": "oá", "ỏa": "oả", "õa": "oã", "ọa": "oạ",
  "òe": "oè", "óe": "oé", "ỏe": "oẻ", "õe": "oẽ", "ọe": "oẹ",
  "ùy": "uỳ", "úy": "uý", "ủy": "uỷ", "ũy": "uỹ", "ụy": "uỵ",
};
const ACCENT_RE = new RegExp(`(${Object.keys(ACCENT_FIX).join("|")})(?![\\p{L}])`, "giu");

function isAllCaps(s: string) {
  const letters = [...s].filter((ch) => ch.toLowerCase() !== ch.toUpperCase());
  return letters.length >= 4 && letters.every((ch) => ch === ch.toUpperCase());
}

function sentenceCase(s: string) {
  const low = s.toLowerCase();
  return low.charAt(0).toUpperCase() + low.slice(1);
}

/** Số dòng khi bọc chữ ở fontScale 2 — ước lượng bề ngang ký tự như trình duyệt. */
function wrappedLines(s: string) {
  const w = (ch: string) => (/[mwMWđĐ]/.test(ch) ? 0.8 : /[iljtf.,'!:;|]/.test(ch) ? 0.3 : ch === " " ? 0.28 : 0.56) * FONT_PX_AT_2X;
  let lines = 1, cur = 0;
  for (const word of s.split(" ")) {
    const ww = [...word].reduce((a, ch) => a + w(ch), 0);
    if (cur > 0 && cur + w(" ") + ww > BUBBLE_PX) { lines++; cur = ww; }
    else cur += (cur > 0 ? w(" ") : 0) + ww;
  }
  return lines;
}

const hasWord = (text: string, word: string) =>
  new RegExp(`(^|[^\\p{L}])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`, "iu").test(text);

function collect(contentDir: string): { bags: Bag[]; save: () => void } {
  const bags: Bag[] = [];
  const dirty = new Map<string, () => void>();

  for (const f of walk(join(contentDir, "lines"), [".json"])) {
    const data = readJson<{ pools: { id: string; vars?: string[]; variants: string[]; en?: string[]; npc?: string }[] }>(f);
    for (const p of data.pools ?? []) {
      bags.push({
        file: f, where: `pool ${p.id}`, vi: p.variants, en: p.en, vars: p.vars ?? [], npc: p.npc,
        set: (vi) => { p.variants = vi; dirty.set(f, () => writeFileSync(f, JSON.stringify(data, null, 2) + "\n")); },
      });
    }
  }
  for (const f of walk(join(contentDir, "rules"), [".json"])) {
    if (f.endsWith("_blackboard.json")) continue;
    const data = readJson<any>(f);
    const rules: any[] = Array.isArray(data) ? data : data.rules ?? [data];
    for (const rule of rules) {
      const npc = rule.npc ?? rule.criteria?.find((c: any) => c.key === "Customer.npcId" && c.op === "eq")?.value;
      for (const resp of rule.responses ?? []) {
        bags.push({
          file: f, where: `rule ${rule.id}.${resp.id}`, vi: resp.variants, en: resp.en, vars: rule.vars ?? [], npc,
          set: (vi) => { resp.variants = vi; dirty.set(f, () => writeFileSync(f, JSON.stringify(data, null, 2) + "\n")); },
        });
      }
    }
  }
  return { bags, save: () => { for (const w of dirty.values()) w(); } };
}

export function lintLines(contentDir: string, opts: { fix?: boolean } = {}): Report {
  const r = new Report();
  const red = readJson<Red>(join(contentDir, "redlines.json"));
  const { bags, save } = collect(contentDir);
  const allVars = new Set(bags.flatMap((b) => b.vars));

  for (const b of bags) {
    let changed = false;
    const fixed = b.vi.map((raw, i) => {
      let s = raw;
      const where = `${b.where}[${i}]`;

      // L004 — NFD (dấu tách rời)
      if (s !== s.normalize("NFC")) {
        if (opts.fix) { s = s.normalize("NFC"); changed = true; }
        else r.add("L004", "ERROR", b.file, where, `Unicode NFD (dấu tách rời) — ép NFC: "${s.normalize("NFC")}"`);
      }

      // L005 — kiểu đặt dấu không nhất quán
      if (ACCENT_RE.test(s)) {
        ACCENT_RE.lastIndex = 0;
        const to = s.replace(ACCENT_RE, (m) => ACCENT_FIX[m.toLowerCase()] ?? m);
        if (opts.fix) { s = to; changed = true; }
        else r.add("L005", "WARN", b.file, where, `kiểu dấu lệch chuẩn repo (oà/uỷ): "${s}" → "${to}"`);
      }
      ACCENT_RE.lastIndex = 0;

      // L007 — VIẾT HOA TOÀN BỘ
      if (isAllCaps(s)) {
        if (opts.fix) { s = sentenceCase(s); changed = true; }
        else r.add("L007", "ERROR", b.file, where, `viết hoa toàn bộ (CANON §15): "${s}"`);
      }

      // L001 / L002 — biến nội suy
      for (const m of s.matchAll(/\{(\w+)\}/g)) {
        if (b.vars.includes(m[1])) continue;
        if (allVars.has(m[1])) r.add("L002", "ERROR", b.file, where, `biến {${m[1]}} đúng tên nhưng SAI SCOPE — túi này chỉ có [${b.vars.join(", ")}]`);
        else r.add("L001", "ERROR", b.file, where, `biến {${m[1]}} chưa định nghĩa — sẽ hiện nguyên chữ "{${m[1]}}" trên màn hình`);
      }

      // L003 — độ dài
      const shown = s.replace(/\{\w+\}/g, "xxxxxxxx");
      if (shown.length > LINE_MAX_CHARS) r.add("L003", "WARN", b.file, where, `${shown.length} ký tự > ${LINE_MAX_CHARS}`);
      else if (wrappedLines(shown) > MAX_LINES_AT_2X) r.add("L003", "WARN", b.file, where, `${wrappedLines(shown)} dòng ở cỡ chữ 200% — bong bóng quá cao`);

      // L006 — mất dấu
      const words = s.split(/\s+/).filter(Boolean);
      if (words.length >= 5 && !DIACRITIC.test(s) && red.unaccentedRisk.some((w) => hasWord(s, w))) {
        r.add("L006", "ERROR", b.file, where, `câu tiếng Việt bị MẤT DẤU: "${s}"`);
      }

      // L008 — từ Bắc trong pool Nam
      if (!b.npc || !red.northern.allowNpcs.includes(b.npc)) {
        for (const [bac, nam] of Object.entries(red.northern.words)) {
          if (hasWord(s, bac)) r.add("L008", "WARN", b.file, where, `từ giọng Bắc "${bac}" → giọng Nam "${nam}"`);
        }
      }

      // L010 — lằn ranh đỏ §14.1
      for (const w of [...red.war, ...red.demeaning]) {
        if (hasWord(s, w)) r.add("L010", "ERROR", b.file, where, `chạm lằn ranh đỏ §14.1: "${w}"`);
      }

      // L013 — ký tự font không vẽ được
      for (const ch of s.replace(/\{\w+\}/g, "")) {
        const low = ch.toLowerCase();
        if (!VN_LETTERS.has(low) && !PUNCT.has(ch) && !/[a-z]/.test(low)) {
          r.add("L013", "ERROR", b.file, where, `ký tự "${ch}" (U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}) ngoài bảng glyph`);
        }
      }
      return s;
    });
    if (changed) b.set(fixed);

    // L009 — đại từ xưng hô bị dịch trong bản en
    for (const [i, en] of (b.en ?? []).entries()) {
      for (const leak of red.enPronounLeaks) {
        if (hasWord(en, leak)) r.add("L009", "ERROR", b.file, `${b.where}.en[${i}]`, `đại từ xưng hô bị DỊCH thành "${leak}" — CANON §2: không dịch`);
      }
    }
    // L011 — thiếu phụ đề Anh
    const enCount = (b.en ?? []).filter((x) => x && x !== "…").length;
    if (enCount < b.vi.length) r.add("L011", "WARN", b.file, b.where, `thiếu phụ đề tiếng Anh (${enCount}/${b.vi.length})`);

    // L012 — biến thể giả
    for (let i = 0; i < fixed.length; i++) {
      for (let j = i + 1; j < fixed.length; j++) {
        const sim = similarity(fixed[i].toLowerCase(), fixed[j].toLowerCase());
        if (sim > LINE_SIMILARITY_MAX) {
          r.add("L012", "WARN", b.file, `${b.where}[${i}~${j}]`, `giống nhau ${(sim * 100).toFixed(0)}% — túi thật ít biến thể hơn con số`);
        }
      }
    }
  }
  if (opts.fix) save();
  return r;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const i = process.argv.indexOf("--content");
  const content = i >= 0 ? process.argv[i + 1] : join(ROOT, "src", "content");
  const fix = process.argv.includes("--fix");
  const rep = lintLines(content, { fix });
  rep.print(`lint:lines${fix ? " --fix" : ""}`);
  process.exit(rep.errors.length ? 1 : 0);
}
