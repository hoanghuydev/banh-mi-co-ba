/** Validator cây thoại: cổng viết sai không crash mà làm câu không bao giờ hiện; ERROR chặn commit, WARN cho qua. */
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, Report, readJson, walk } from "./lib";
import { checkGate, isStoryFlag } from "../src/dialog/gates";
import { PRACTICE_IDS } from "../src/content/vocab";
import { MAX_DEPTH, beatWidth, kindOf, type Talk, type TalkNode } from "../src/sim/talk";

/** Duyệt mọi nút, kể cả cây con `shared`. */
function walkTalk(t: Talk): { node: TalkNode; path: string; depth: number }[] {
  const out: { node: TalkNode; path: string; depth: number }[] = [];
  const seen = new Set<TalkNode>();
  const go = (nodes: readonly TalkNode[], path: string, depth: number) => {
    if (depth > MAX_DEPTH) return;
    nodes.forEach((n, i) => {
      if (seen.has(n)) return;
      seen.add(n);
      const here = `${path}.${i + 1}`;
      out.push({ node: n, path: here, depth });
      if (n.then?.length) go(n.then, here, depth + 1);
      else if (n.ref && t.shared?.[n.ref]) go(t.shared[n.ref], `${here}→${n.ref}`, depth + 1);
    });
  };
  go(t.tree, "", 1);
  for (const [name, sub] of Object.entries(t.shared ?? {})) go(sub, `S:${name}`, 1);
  return out;
}

const needKeys = (n: TalkNode): string[] =>
  n.need === undefined ? [] : Array.isArray(n.need) ? n.need : [n.need];

/** TĨNH = người chơi tự đổi được (đứng yên khi thẻ mở), ĐỘNG = thế giới đổi; `w.hot`/`w.rain` tra theo ngày nên tĩnh, `w.band` đổi giữa buổi nên động. */
const STATIC = /^!?(p\.(holds|hands|soldOut|onStreet|atCounter|stock)|t\.(passing|named|purpose|state|practice)|v\.|c\.openedBy|w\.(hot|rain))/;
const DYNAMIC = /^!?(w\.(queue|shadeFree|peak|band)|t\.(impatient|leaving|inShade|lookingInside|onPhone|eating))/;

/** Câu HỨA một việc làm — mỗi mẫu đi kèm cổng bắt buộc. */
const PROMISES: [RegExp, string[], string][] = [
  [/(ăn thử|nếm thử|bẻ miếng|cầm ổ này|lấy ổ này)/iu, ["p.holdsBread", "p.holdsFilled"], "mời ăn"],
  [/(rót \S+ ly trà|uống ly trà|ly trà đá nè|làm ly trà)/iu, ["p.holdsTea", "p.hasTea"], "mời uống"],
  [/chen (hàng|ngang)|tới trước (chị|anh|cô|chú|bà)/iu, ["t.cutLine"], "buộc tội chen hàng"],
  [/(đứng|vô|vào) .{0,12}(cho mát|chỗ mát|núp mưa|trú mưa)/iu, ["w.shadeFree"], "mời đứng chỗ mát"],
  // "Dời chỗ" chỉ thật khi có người chờ, họ đang chắn, hoặc chỗ chỉ tới có thật và còn trống.
  [/xích (qua|ra)|dạt (qua|ra)|đứng qua bên/iu, ["w.queue", "t.blocking", "w.shadeFree"], "bảo người ta dời chỗ"],
  // "Ngồi" chỉ thật khi có ghế và ghế còn chỗ.
  [/ngồi (xuống|ghế|cái ghế|đây|nghỉ)|lấy ghế|ngồi nhờ/iu, ["w.seatFree", "GHE_BAN"], "mời ngồi"],
];

/** Nợ T015 — rỗng thì xoá cả khối. */
const T015_NO = new Set<string>([]);

/** Mở bằng tiếng ừ hữ là lời đáp; không dùng `\b` vì JS tính theo ASCII nên `dạ\b` khớp cả "Dạo". */
const LOI_DAP = /^\s*(dạ|ừ|ờ|vâng|ùa|ủa|thôi vậy|vậy thôi)(?=[\s,.…!?:;]|$)/iu;
/** Câu làm quen lần đầu. */
const LAN_DAU = /(lần đầu|mới (thấy|gặp) (cô|chú|anh|chị|bà|em)|chưa gặp .{0,10}bao giờ)/iu;
/** Câu nhắc chuyện cũ — phải có bằng chứng chuyện đó đã xảy ra. */
const CHUYEN_CU = /(bữa trước|hôm bữa|mấy bữa nay|lần trước|bữa nọ|hổm rày)/iu;
/** `act` có thời lượng — bắt buộc `forSec`. */
const ACT_CO_GIO = new Set(["GIVE_BREAD", "OFFER_TEA", "STAND_IN_SHADE", "LOOK_INSIDE", "STEP_ASIDE", "THEY_SIT", "FILM", "RAO"]);
/** `act` là việc còn nợ — thưởng nằm ở `onKept`; `PROMISE` có hệ quả ngay nên không tính. */
const ACT_LA_HUA = new Set(["PROMISE_DEED"]);

export function validateTalks(dir: string): Report {
  const r = new Report();
  const talks: { t: Talk; file: string }[] = [];
  const ids = new Map<string, string>();

  for (const file of walk(join(dir, "talks"), [".json"])) {
    const data = readJson<{ talks?: Talk[] }>(file);
    for (const t of data.talks ?? []) {
      const where = `[${t.id}]`;
      // T008 — id trùng: cuộc nào được nạp tuỳ thứ tự file.
      if (ids.has(t.id)) r.add("T008", "ERROR", file, where, `id trùng với cuộc trong ${ids.get(t.id)}`);
      ids.set(t.id, file);
      // T009 — khung cảnh phải có thật.
      for (const p of t.practice ?? []) {
        if (!(PRACTICE_IDS as readonly string[]).includes(p)) {
          r.add("T009", "ERROR", file, where, `practice '${p}' không có trong PRACTICE_IDS`);
        }
      }
      // T001 — cổng tầng cuộc phải có thật.
      for (const key of t.when?.world ?? []) {
        const err = checkGate(key);
        if (err) r.add("T001", "ERROR", file, `${where} when.world`, err);
      }
      talks.push({ t, file });
    }
  }

  for (const { t, file } of talks) {
    const where = `[${t.id}]`;
    for (const { node, path, depth } of walkTalk(t)) {
      const at = `${where}${path}`;
      const gates = [...needKeys(node), ...(node.while ?? [])];

      // T001 — khoá cổng phải có thật.
      for (const key of gates) {
        const bare = key.startsWith("!") ? key.slice(1) : key;
        if (isStoryFlag(bare)) continue;
        const err = checkGate(key);
        if (err) r.add("T001", "ERROR", file, at, `${err}  — câu: "${node.say}"`);
      }

      // T002 — TĨNH ở `need`, ĐỘNG ở `while`; sai phía thì người chơi ăn "?" oan.
      for (const k of node.while ?? []) {
        if (STATIC.test(k)) r.add("T002", "ERROR", file, at, `'${k}' là sự thật TĨNH — chuyển sang \`need\` (ẩn hẳn): "${node.say}"`);
      }
      for (const k of needKeys(node)) {
        if (DYNAMIC.test(k)) r.add("T002", "ERROR", file, at, `'${k}' là sự thật ĐỘNG — chuyển sang \`while\` (ra "?"): "${node.say}"`);
      }

      // T003 — câu hứa phải có cổng làm được chuyện đó.
      for (const [re, keys, label] of PROMISES) {
        if (!re.test(node.say)) continue;
        if (!gates.some((g) => keys.some((k) => g.includes(k.split("(")[0])))) {
          r.add("T003", "ERROR", file, at, `${label} mà không khai ${keys.map((k) => `\`${k}\``).join(" / ")}: "${node.say}"`);
        }
      }

      // T004 — nhắc chuyện cũ phải có bằng chứng: cổng `d.toldMe()` hoặc cờ chuyện.
      if (CHUYEN_CU.test(node.say)) {
        const byDay = gates.some((g) => g.startsWith("d.toldMe"));
        const byFlag = gates.some((g) => isStoryFlag(g.replace("!", "")) && !g.startsWith("!")) || !!t.when?.needFlag;
        if (!byDay && !byFlag) {
          r.add("T004", "ERROR", file, at,
            `nhắc chuyện cũ mà KHÔNG CÓ BẰNG CHỨNG nó đã xảy ra — thêm cổng cờ chuyện của cuộc nguồn: "${node.say}"`);
        }
      }

      // T005 — câu làm quen lần đầu với khách quen là hỏng vai.
      if (LAN_DAU.test(node.say)) {
        const gated = gates.some((g) => g.includes("m.visits"));
        if (gated === false) r.add("T005", "WARN", file, at, `câu làm quen lần đầu không khai \`!m.visits(2)\`: "${node.say}"`);
      }

      // T012 — câu đáp không được đứng ở nhịp đầu cuộc người chơi mở; `NPC_ONLY` miễn.
      if (depth === 1 && t.source !== "NPC_ONLY" && LOI_DAP.test(node.say)) {
        if (!needKeys(node).some((g) => g.startsWith("c.openedBy(NPC)"))) {
          r.add("T012", "ERROR", file, at,
            `câu ĐÁP ("${node.say}") ở NHỊP ĐẦU — khai \`need: "c.openedBy(NPC)"\`, hoặc viết lại thành câu mở lời`);
        }
      }

      const act = node.act as { kind: string; forSec?: unknown } | undefined;
      if (act && ACT_CO_GIO.has(act.kind) && act.forSec === undefined) {
        r.add("T006", "ERROR", file, at, `act '${act.kind}' có thời lượng mà không khai \`forSec\`: "${node.say}"`);
      }
      // T007 — hứa thì thưởng ở `onKept`, không phải lúc nói.
      if (act && ACT_LA_HUA.has(act.kind) && node.calm !== undefined) {
        r.add("T007", "ERROR", file, at, `lời hứa trả \`calm\` NGAY LÚC NÓI — phần thưởng phải nằm ở \`onKept\`: "${node.say}"`);
      }
    }
  }

  // T010 — câu ấm ngay sau câu gắt phải khai `!c.angered`, kẻo gắt rồi dỗ không có giá.
  for (const { t, file } of talks) {
    const where = `[${t.id}]`;
    for (const { node, path } of walkTalk(t)) {
      if (node.tone !== "GAT" && node.tone !== "CHUI") continue;
      const kids = node.then ?? (node.ref ? t.shared?.[node.ref] : null) ?? [];
      for (const kid of kids) {
        if (kid.tone !== "AM") continue;
        if (!needKeys(kid).includes("!c.angered")) {
          r.add("T010", "WARN", file, `${where}${path}`,
            `câu ấm nối ngay sau câu ${node.tone} mà không khai \`need: "!c.angered"\`: "${kid.say}"`);
        }
      }
    }
  }
  // T011 — mọi cổng đóng thì mỗi nhịp vẫn còn ít nhất hai dòng; chữa ở nội dung, không ở runtime.
  for (const { t, file } of talks) {
    const beats: [string, readonly TalkNode[]][] = [[`[${t.id}] nhịp đầu`, t.tree]];
    for (const [name, sub] of Object.entries(t.shared ?? {})) beats.push([`[${t.id}] shared.${name}`, sub]);
    for (const { node, path } of walkTalk(t)) if (node.then?.length) beats.push([`[${t.id}]${path}`, node.then]);
    for (const [where, nodes] of beats) {
      // Cùng định nghĩa với lưới `L-2` của `p5-talk.test.ts` để hai chỗ đếm không lệch nhau.
      const w = beatWidth(nodes);
      if (w.min < 2) {
        r.add("T011", "ERROR", file, where,
          `nhánh "${w.worst}" chỉ còn ${w.min} dòng — gặp người không khớp cổng nào thì nhịp này teo xuống một dòng`);
      }
    }
  }

  // T013 — mọi cổng đóng thì nhịp đầu vẫn còn một nút có nhánh; miễn `MOI` và `BARK`.
  for (const { t, file } of talks) {
    if (kindOf(t) === "MOI" || t.depth === "BARK") continue;
    const branching = t.tree.filter((n) => n.then?.length || n.ref);
    const w = beatWidth(branching);
    if (w.min < 1) {
      r.add("T013", "ERROR", file, `[${t.id}] nhịp đầu`,
        branching.length
          ? `mọi nút CÓ NHÁNH đều nằm sau cổng (nhánh "${w.worst}") — gặp người không khớp cổng nào thì cuộc tắt sau một nhịp`
          : `không nút nào ở nhịp đầu có \`then\`/\`ref\` — cuộc này luôn dài đúng một nhịp`);
    }
  }

  // T014 — nhịp đầu không được để mọi dòng sau `while` (bấm gì cũng "?"); khoá cả cuộc bằng `when.world`.
  for (const { t, file } of talks) {
    if (!t.tree.length) continue;
    if (t.tree.every((n) => n.while?.length)) {
      const keys = [...new Set(t.tree.flatMap((n) => n.while ?? []))];
      const sealed = new Set(t.when?.world ?? []);
      if (keys.every((k) => sealed.has(k))) continue;
      r.add("T014", "ERROR", file, `[${t.id}] nhịp đầu`,
        `cả ${t.tree.length} dòng đều nằm sau \`while\` [${keys.join(", ")}] — mở cuộc lúc sự thật đó sai thì bấm gì cũng ra "?"; khoá cả cuộc bằng \`when.world\``);
    }
  }

  // T015 — ít nhất nửa số cuộc của một kho phải có `act`, kẻo nói chuyện không đổi được gì.
  {
    const t015Debt: string[] = [];
    const byFile = new Map<string, { n: number; act: number }>();
    for (const { t, file } of talks) {
      const has = [...walkTalk(t)].some(({ node }) => !!node.act);
      const v = byFile.get(file) ?? { n: 0, act: 0 };
      v.n++; if (has) v.act++;
      byFile.set(file, v);
    }
    for (const [file, v] of byFile) {
      if (v.act * 2 >= v.n) continue;
      const name = file.split("/").pop() ?? file;
      if (T015_NO.has(name)) { t015Debt.push(`${name} ${v.act}/${v.n}`); continue; }
      r.add("T015", "ERROR", file, "[kho]",
        `chỉ ${v.act}/${v.n} cuộc có HÀNH ĐỘNG THẬT — nói chuyện ở đây không đổi được gì (CANON T2)`);
    }
    if (t015Debt.length) {
      r.add("T015", "WARN", "src/content/talks", "[nợ]", `${t015Debt.length} kho còn nợ T015 — ${t015Debt.join(", ")}`);
    }
  }

  // T017 — trong kho `ANY`/`QUA_DUONG`, câu đáp chốt vụ mua phải mang `INVITE` hoặc khoá `!t.passing`; mẫu không dùng `\b` sau chữ có dấu.
  const CHOT_MUA = /(cho|lấy|mua|làm|gói)\s+(?:\S+\s+){0,2}?(?:một|hai|ba|[123])?\s*(ổ|phần)(?![\p{L}])|lấy luôn (mấy )?ổ/iu;
  /** Mua ở chỗ khác thì không phải vụ mua của mình. */
  const MUA_CHO_KHAC = /ở (cổng|trường|chợ|nhà|bên)|bên kia|chỗ khác|hồi nãy|lúc nãy/iu;
  for (const { t, file } of talks) {
    if (t.npc !== "ANY" && t.npc !== "QUA_DUONG") continue;
    for (const { node, path } of walkTalk(t)) {
      if (!node.reply || !CHOT_MUA.test(node.reply) || MUA_CHO_KHAC.test(node.reply)) continue;
      if (node.act?.kind === "INVITE") continue;
      const keys = [node.need ?? [], node.while ?? []].flat().map(String);
      if (keys.includes("!t.passing")) continue;
      r.add("T017", "ERROR", file, `${t.id}${path}`,
        `câu đáp chốt vụ mua mà không có \`INVITE\` và không khoá \`!t.passing\` — `
        + `một người đi ngang nói "${node.reply}" rồi đi tiếp, không đơn nào sinh ra`);
    }
  }

  // T018 — `NAN_LAI` chỉ có khi còn người chờ, mà `FULL` đòi không ai chờ: cuộc `FULL` chỉ gắn `NAN_LAI` không bao giờ chạy.
  for (const { t, file } of talks) {
    if (t.depth !== "FULL") continue;
    const pr = [t.practice ?? []].flat();
    if (!pr.length || !pr.includes("NAN_LAI")) continue;
    if (pr.every((p) => p === "NAN_LAI")) {
      r.add("T018", "ERROR", file, t.id,
        "cuộc `FULL` mà chỉ sống ở khung `NAN_LAI` — `practiceOf` trả khung đó CHỈ KHI còn "
        + "người chờ, mà `canOpenDeep` cấm `FULL` đúng lúc đó. Không bao giờ chạy được.");
    } else {
      r.add("T018", "WARN", file, t.id,
        "thẻ `NAN_LAI` trên một cuộc `FULL` là chữ chết (xem khối T018) — bỏ đi hoặc hạ `depth`.");
    }
  }

  // T009b — kho `ANY` phải phủ mọi khung cảnh, kẻo bấm phím ra dải rỗng.
  const covered = new Map<string, number>();
  for (const { t } of talks) {
    if (t.npc !== "ANY") continue;
    // Không khai `practice` = sống ở mọi khung.
    const raw = t.practice;
    const list: readonly string[] = raw === undefined ? PRACTICE_IDS
      : typeof raw === "string" ? [raw]
      : raw.length ? raw : PRACTICE_IDS;
    for (const p of list) covered.set(p, (covered.get(p) ?? 0) + 1);
  }
  for (const p of PRACTICE_IDS) {
    if (p === "NGHE_LOM") continue;                // cảnh NPC↔NPC: người chơi không xen vào
    if (!covered.get(p)) {
      r.add("T009", "ERROR", join(dir, "any.json"), `[practice ${p}]`,
        `không cuộc dùng chung nào sống được ở khung cảnh này — bấm phím ra một dải rỗng`);
    }
  }

  return r;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const i = process.argv.indexOf("--content");
  const content = i >= 0 ? process.argv[i + 1] : join(ROOT, "src", "content");
  const t0 = performance.now();
  const rep = validateTalks(content);
  rep.print(`validate:talks — ${((performance.now() - t0) / 1000).toFixed(2)} s`);
  process.exit(rep.errors.length ? 1 : 0);
}
