/**
 * npm run lint:lines [-- --fix] [-- --content <dir>]
 *
 * Linter cho file thoại — kiểm tra L001–L014.
 * `--fix` sửa được L004 (NFC), L005 (kiểu đặt dấu), L007 (viết hoa toàn bộ).
 *
 * Đọc `content/lines/**.json` (pool generic) và `content/rules/**.json` (response của rule).
 */
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { ROOT, Report, readJson, similarity, walk } from "./lib";

export const LINE_MAX_CHARS = 90;
const ADDRESS_VARS = ["call", "me", "self", "you"];
/** Chỗ trống khác mà `Service.fill` điền: `gia`/`giaN` giá N ổ của đơn đang đứng đó, `gio` giờ đọc thành lời. */
const FILL_VARS = ["gia", "gia2", "gia3", "gio"];
export const LINE_SIMILARITY_MAX = 0.85;
/** Bong bóng thoại ở fontScale 2: rộng 285 px, chữ 24 px (xem ui/stall/BubblePool). */
const BUBBLE_PX = 285, FONT_PX_AT_2X = 24, MAX_LINES_AT_2X = 3;
/** Khung chữ của một dòng: mặc định bong bóng; thân cây hội thoại hiện trong `ui/stall/TalkPanel`. */
type Box = { px: number; font: number; maxLines: number };
const BUBBLE: Box = { px: BUBBLE_PX, font: FONT_PX_AT_2X, maxLines: MAX_LINES_AT_2X };
/** 620 px bảng − 32 px lề − ~34 px cột huy hiệu mặt, chữ 16 px ở cỡ 1,15. */
const PANEL: Box = { px: 520, font: 19, maxLines: 4 };

type Red = {
  war: string[]; demeaning: string[];
  northern: { allowNpcs: string[]; words: Record<string, string> };
  archaic: Record<string, string>;
  unaccentedRisk: string[]; enPronounLeaks: string[];
};

type Bag = { file: string; where: string; vi: string[]; en?: string[]; vars: string[]; npc?: string; set: (vi: string[]) => void
  /** L012 tắt: túi của một cuộc trò chuyện là cả cuộc nói chuyện, không phải pool biến thể. */
  noVariants?: boolean;
  box?: Box };

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

function wrappedLines(s: string, box: Box = BUBBLE) {
  const w = (ch: string) => (/[mwMWđĐ]/.test(ch) ? 0.8 : /[iljtf.,'!:;|]/.test(ch) ? 0.3 : ch === " " ? 0.28 : 0.56) * box.font;
  let lines = 1, cur = 0;
  for (const word of s.split(" ")) {
    const ww = [...word].reduce((a, ch) => a + w(ch), 0);
    if (cur > 0 && cur + w(" ") + ww > box.px) { lines++; cur = ww; }
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
    for (const [id, vi] of Object.entries(((data as any).reactions ?? {}) as Record<string, string[]>)) {
      bags.push({ file: f, where: `reactions.${id}`, vi, vars: [], set: () => {} });
    }
    for (const p of data.pools ?? []) {
      bags.push({
        file: f, where: `pool ${p.id}`, vi: p.variants, en: p.en, vars: p.vars ?? [], npc: p.npc,
        set: (vi) => { p.variants = vi; dirty.set(f, () => writeFileSync(f, JSON.stringify(data, null, 2) + "\n")); },
      });
    }
  }
  // Hội thoại có nhánh. Hai túi mỗi cuộc, vì hai giọng khác nhau: lời KHÁCH
  // (dính luật giọng Bắc/Nam theo `npc`) và lời NGƯỜI CHƠI (luôn giọng Nam).
  for (const f of walk(join(contentDir, "talks"), [".json"])) {
    const data = readJson<{ talks: any[] }>(f);
    for (const t of data.talks ?? []) {
      // Đi cây (`tree` + `shared`), cắt ở độ sâu 6 để `ref` quay vòng không treo lệnh build.
      // Hai khung khác nhau: câu MỞ LỜI (khách tự bắt chuyện) và câu làm thinh bay ra
      // bong bóng trên đầu họ; mọi dòng trong cây nằm trong bảng F.
      const bubbleLines: string[] = [t.opener, ...(t.ignore?.reply ? [t.ignore.reply] : [])];
      const npcLines: string[] = [];
      const sayLines: string[] = [];
      const seen = new Set<any>();
      const go = (nodes: any[], depth: number) => {
        if (depth > 6) return;
        for (const o of nodes ?? []) {
          if (!o || seen.has(o)) continue;
          seen.add(o);
          sayLines.push(o.say);
          if (o.reply) npcLines.push(o.reply);
          // Act INVITE: hai câu đáp do roll chọn, hiện đúng chỗ `reply` nên chịu cùng thước.
          for (const k of ["yes", "no"] as const) if (o.act?.[k]) npcLines.push(o.act[k]);
          const kids = o.then?.length ? o.then : o.ref ? t.shared?.[o.ref] : null;
          if (kids) go(kids, depth + 1);
        }
      };
      go(t.tree ?? [], 1);
      for (const sub of Object.values(t.shared ?? {})) go(sub as any[], 1);
      // Chỗ trống DANH XƯNG (sim/talk.WALKIN_ADDRESS, điền ở `Service.fill`): một bộ
      // thoại dùng chung cho mọi dáng người thì không viết cứng "anh" vào được.
      const vars = [...ADDRESS_VARS, ...FILL_VARS];
      bags.push({ file: f, where: `talk ${t.id}.bong-bong`, vi: bubbleLines, vars, npc: t.npc, noVariants: true, set: () => {} });
      bags.push({ file: f, where: `talk ${t.id}.npc`, vi: npcLines, vars, npc: t.npc, noVariants: true, box: PANEL, set: () => {} });
      bags.push({ file: f, where: `talk ${t.id}.say`, vi: sayLines, vars, noVariants: true, box: PANEL, set: () => {} });
    }
  }
  for (const f of walk(join(contentDir, "rules"), [".json"])) {
    if (f.endsWith("_blackboard.json")) continue;
    const data = readJson<any>(f);
    const rules: any[] = Array.isArray(data) ? data : data.rules ?? [data];
    for (const rule of rules) {
      bags.push({
        file: f, where: `rule ${rule.id}`, vi: rule.say ?? [], en: rule.en, vars: ["mon", "self", "you", "call", "me"], npc: rule.when?.npcId,
        set: (vi) => { rule.say = vi; dirty.set(f, () => writeFileSync(f, JSON.stringify(data, null, 2) + "\n")); },
      });
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

      if (s !== s.normalize("NFC")) {
        if (opts.fix) { s = s.normalize("NFC"); changed = true; }
        else r.add("L004", "ERROR", b.file, where, `Unicode NFD (dấu tách rời) — ép NFC: "${s.normalize("NFC")}"`);
      }

      if (ACCENT_RE.test(s)) {
        ACCENT_RE.lastIndex = 0;
        const to = s.replace(ACCENT_RE, (m) => ACCENT_FIX[m.toLowerCase()] ?? m);
        if (opts.fix) { s = to; changed = true; }
        else r.add("L005", "WARN", b.file, where, `kiểu dấu lệch chuẩn repo (oà/uỷ): "${s}" → "${to}"`);
      }
      ACCENT_RE.lastIndex = 0;

      if (isAllCaps(s)) {
        if (opts.fix) { s = sentenceCase(s); changed = true; }
        else r.add("L007", "ERROR", b.file, where, `viết hoa toàn bộ (CANON §15): "${s}"`);
      }

      for (const m of s.matchAll(/\{([\w.]+)\}/g)) {
        if (b.vars.includes(m[1])) continue;
        if (allVars.has(m[1])) r.add("L002", "ERROR", b.file, where, `biến {${m[1]}} đúng tên nhưng SAI SCOPE — túi này chỉ có [${b.vars.join(", ")}]`);
        else r.add("L001", "ERROR", b.file, where, `biến {${m[1]}} chưa định nghĩa — sẽ hiện nguyên chữ "{${m[1]}}" trên màn hình`);
      }

      const shown = s.replace(/\{[\w.]+\}/g, "xxxxxxxx");
      const box = b.box ?? BUBBLE;
      if (shown.length > LINE_MAX_CHARS) r.add("L003", "WARN", b.file, where, `${shown.length} ký tự > ${LINE_MAX_CHARS}`);
      else if (wrappedLines(shown, box) > box.maxLines) {
        r.add("L003", "WARN", b.file, where, `${wrappedLines(shown, box)} dòng trong khung ${box.px} px — hộp quá cao`);
      }

      const words = s.split(/\s+/).filter(Boolean);
      if (words.length >= 5 && !DIACRITIC.test(s) && red.unaccentedRisk.some((w) => hasWord(s, w))) {
        r.add("L006", "ERROR", b.file, where, `câu tiếng Việt bị MẤT DẤU: "${s}"`);
      }

      if (!b.npc || !red.northern.allowNpcs.includes(b.npc)) {
        for (const [bac, nam] of Object.entries(red.northern.words)) {
          if (hasWord(s, bac)) r.add("L008", "WARN", b.file, where, `từ giọng Bắc "${bac}" → giọng Nam "${nam}"`);
        }
      }

      for (const [cu, moi] of Object.entries(red.archaic)) {
        if (hasWord(s, cu)) r.add("L014", "ERROR", b.file, where, `giọng Nam cổ "${cu}" → "${moi}"`);
      }

      for (const w of [...red.war, ...red.demeaning]) {
        if (hasWord(s, w)) r.add("L010", "ERROR", b.file, where, `chạm lằn ranh đỏ §14.1: "${w}"`);
      }

      // L013 — ký tự font không vẽ được
      for (const ch of s.replace(/\{[\w.]+\}/g, "")) {
        const low = ch.toLowerCase();
        if (!VN_LETTERS.has(low) && !PUNCT.has(ch) && !/[a-z]/.test(low)) {
          r.add("L013", "ERROR", b.file, where, `ký tự "${ch}" (U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}) ngoài bảng glyph`);
        }
      }
      return s;
    });
    if (changed) b.set(fixed);

    for (const [i, en] of (b.en ?? []).entries()) {
      for (const leak of red.enPronounLeaks) {
        if (hasWord(en, leak)) r.add("L009", "ERROR", b.file, `${b.where}.en[${i}]`, `đại từ xưng hô bị DỊCH thành "${leak}" — CANON §2: không dịch`);
      }
    }
    const enCount = (b.en ?? []).filter((x) => x && x !== "…").length;
    if (enCount < b.vi.length) r.add("L011", "WARN", b.file, b.where, `thiếu phụ đề tiếng Anh (${enCount}/${b.vi.length})`);

    if (b.noVariants) continue;
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
