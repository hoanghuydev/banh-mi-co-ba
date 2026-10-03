/**
 * npm run lint:lines [-- --fix] [-- --content <dir>]
 *
 * Linter cho file thoại — P0-03 §2.3(b), 13 kiểm tra L001–L013 + L014 (P2-04: tin đồn phải có nguồn).
 * `--fix` sửa được L004 (NFC), L005 (kiểu đặt dấu), L007 (viết hoa toàn bộ).
 *
 * Đọc `content/lines/**.json` (pool generic) và `content/rules/**.json` (response của rule).
 */
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { ROOT, Report, readJson, similarity, walk } from "./lib";

export const LINE_MAX_CHARS = 90;
/** Chỗ trống danh xưng trong cây hội thoại — xem `sim/service.fill`. */
const ADDRESS_VARS = ["call", "me", "self", "you"];
/**
 * Chỗ trống KHÁC mà `Service.fill` điền được — P2-09 §2.4, §2.6.
 *
 *   `m.what` chuyện cũ VỪA TRUY HỒI. Người viết không gõ tên chuyện vào lời thoại; họ
 *            để một chỗ trống và `retrieve()` điền. Không nhớ ra gì thì câu đó không
 *            tồn tại (cổng `m.remembers`), nên chỗ trống này không bao giờ rỗng.
 *   `gia`    giá MỘT ổ theo đúng đơn của người đang đứng đó, đọc thành lời ("sáu mươi
 *   `giaN`   tư ngàn"). `giaN` = N ổ. Một con số gõ cứng vào câu nói là một con số sẽ
 *            sai vào ngày ai đó chỉnh `econ.json`, và không test nào bắt được.
 */
const FILL_VARS = ["m.what", "gia", "gia2", "gia3", "gio"];
export const LINE_SIMILARITY_MAX = 0.85;
/** Bong bóng thoại ở fontScale 2: rộng 285 px, chữ 24 px (xem ui/stall/BubblePool). */
const BUBBLE_PX = 285, FONT_PX_AT_2X = 24, MAX_LINES_AT_2X = 3;
/**
 * Khung CHỮ của một dòng. Mặc định là bong bóng — nhưng thân cây hội thoại KHÔNG đi
 * qua bong bóng: nó hiện trong `ui/stall/TalkPanel` rộng 620 px, chữ 16 px, và bảng
 * cao tới 56% màn hình. Lint cả hai bằng một cái thước là bắt sai: 95 dòng bị kêu
 * "bong bóng quá cao" trong khi chúng chưa bao giờ nằm trong bong bóng nào.
 */
type Box = { px: number; font: number; maxLines: number };
const BUBBLE: Box = { px: BUBBLE_PX, font: FONT_PX_AT_2X, maxLines: MAX_LINES_AT_2X };
/** 620 px bảng − 32 px lề − ~34 px cột huy hiệu mặt, chữ 16 px ở cỡ 1,15. */
const PANEL: Box = { px: 520, font: 19, maxLines: 4 };

type Red = {
  war: string[]; demeaning: string[];
  northern: { allowNpcs: string[]; words: Record<string, string> };
  unaccentedRisk: string[]; enPronounLeaks: string[];
};

/** Một "túi" thoại cần lint: biến thể + biến được phép + ai nói. */
type Bag = { file: string; where: string; vi: string[]; en?: string[]; vars: string[]; npc?: string; set: (vi: string[]) => void
  /** L014 — biến BẮT BUỘC có mặt ở mọi dòng (tin đồn: tên nguồn). */
  mustHave?: string;
  /**
   * L012 tắt. Túi của một CUỘC TRÒ CHUYỆN không phải một pool biến thể thay nhau được:
   * nó là cả cuộc nói chuyện, và "Dạ." với "Dạ, con biết rồi." giống nhau 85% là đúng
   * như đời, không phải biến thể giả.
   */
  noVariants?: boolean;
  /** Khung chữ của túi này. Vắng = bong bóng. */
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

/** Số dòng khi bọc chữ trong một khung — ước lượng bề ngang ký tự như trình duyệt. */
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
    // P2-04 claims.json — tin đồn: hearsay/tell nói về NGUỒN nên có biến {source}
    const claims = (data as any).claims as Record<string, Record<string, unknown>> | undefined;
    for (const [id, c] of Object.entries(claims ?? {})) {
      for (const pool of ["hearsay", "belief", "conviction", "seen", "tell"] as const) {
        const vi = c[pool] as string[] | undefined;
        if (!vi) continue;
        bags.push({
          file: f, where: `claim ${id}.${pool}`, vi, vars: ["source"], mustHave: pool === "hearsay" || pool === "tell" ? "source" : undefined,
          set: (v) => { c[pool] = v; dirty.set(f, () => writeFileSync(f, JSON.stringify(data, null, 2) + "\n")); },
        });
      }
    }
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
  // P5-01 — hội thoại có nhánh. Hai túi mỗi cuộc, vì hai giọng khác nhau: lời KHÁCH
  // (dính luật giọng Bắc/Nam theo `npc`) và lời NGƯỜI CHƠI (luôn giọng Nam).
  for (const f of walk(join(contentDir, "talks"), [".json"])) {
    const data = readJson<{ talks: any[] }>(f);
    for (const t of data.talks ?? []) {
      /*
       * ⚠️ Cũ đọc `t.beats` — trường đó chết từ hồi P5-01 đổi sang CÂY (`tree` + `shared`),
       * nên linter chạy xanh suốt mà chưa từng soi một dòng nào trong cây. Đi đúng cây ở
       * đây, cắt ở MAX_DEPTH để `ref` quay vòng không treo lệnh build.
       */
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
          // P6 act INVITE: hai câu đáp do CÁI ROLL chọn, không do lựa chọn. Chúng hiện
          // ra đúng chỗ `reply` hiện, nên phải chịu đúng cái thước đó — bỏ sót thì có
          // hai câu thoại NPC cả game không ai soi.
          for (const k of ["yes", "no"] as const) if (o.act?.[k]) npcLines.push(o.act[k]);
          const kids = o.then?.length ? o.then : o.ref ? t.shared?.[o.ref] : null;
          if (kids) go(kids, depth + 1);
        }
      };
      go(t.tree ?? [], 1);
      for (const sub of Object.values(t.shared ?? {})) go(sub as any[], 1);
      // Chỗ trống DANH XƯNG (sim/talk.WALKIN_ADDRESS, điền ở `Service.fill`): một bộ
      // thoại dùng chung cho tám dáng người thì không viết cứng "anh" vào được.
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
      // Biến nội suy của rule: `{mon}` = tên món (P2-01 §2.8). NPC nói = criterion npcId.
      bags.push({
        file: f, where: `rule ${rule.id}`, vi: rule.say ?? [], en: rule.en, vars: ["mon"], npc: rule.when?.npcId,
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
      for (const m of s.matchAll(/\{([\w.]+)\}/g)) {
        if (b.vars.includes(m[1])) continue;
        if (allVars.has(m[1])) r.add("L002", "ERROR", b.file, where, `biến {${m[1]}} đúng tên nhưng SAI SCOPE — túi này chỉ có [${b.vars.join(", ")}]`);
        else r.add("L001", "ERROR", b.file, where, `biến {${m[1]}} chưa định nghĩa — sẽ hiện nguyên chữ "{${m[1]}}" trên màn hình`);
      }

      // L003 — độ dài
      const shown = s.replace(/\{[\w.]+\}/g, "xxxxxxxx");
      const box = b.box ?? BUBBLE;
      if (shown.length > LINE_MAX_CHARS) r.add("L003", "WARN", b.file, where, `${shown.length} ký tự > ${LINE_MAX_CHARS}`);
      else if (wrappedLines(shown, box) > box.maxLines) {
        r.add("L003", "WARN", b.file, where, `${wrappedLines(shown, box)} dòng trong khung ${box.px} px — hộp quá cao`);
      }

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
      //
      // `[\w.]+` chứ không phải `\w+`: biến có dấu chấm (`{m.what}`) thì `\w` không
      // khớp, cặp ngoặc sót lại và báo đúng hai lỗi "{ ngoài bảng glyph" cho mỗi câu.
      // Ba chỗ còn lại trong file này đã dùng `[\w.]+` từ đầu; chỉ chỗ này lệch, và nó
      // nằm im cho tới khi có người đầu tiên viết `{m.what}` vào nội dung.
      for (const ch of s.replace(/\{[\w.]+\}/g, "")) {
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
    // L014 — P2-04 RB3: mọi dòng thoại phát từ tin NGHE KỂ bắt buộc chèn tên nguồn
    if (b.mustHave) {
      for (const [i, s] of b.vi.entries()) {
        if (!s.includes(`{${b.mustHave}}`)) r.add("L014", "ERROR", b.file, `${b.where}[${i}]`, `thiếu {${b.mustHave}} — tin đồn không truy được nguồn = bị report là bug, và họ đúng`);
      }
    }
    // L011 — thiếu phụ đề Anh
    const enCount = (b.en ?? []).filter((x) => x && x !== "…").length;
    if (enCount < b.vi.length) r.add("L011", "WARN", b.file, b.where, `thiếu phụ đề tiếng Anh (${enCount}/${b.vi.length})`);

    // L012 — biến thể giả
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
