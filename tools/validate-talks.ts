/**
 * npm run validate:talks — validator cho CÂY THOẠI. Song sinh với `validate-rules.ts` và có mặt
 * vì cùng một lý do: một cổng viết sai không crash, nó chỉ làm một câu KHÔNG BAO GIỜ HIỆN.
 *
 * Mười tám kiểm tra T001–T018. ERROR chặn commit; WARN in ra nhưng cho qua — ranh giới giữa hai
 * mức là "có làm hỏng thật không", không phải "có xấu không" (validator quá nghiêm thì writer tắt
 * nó đi).
 */
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, Report, readJson, walk } from "./lib";
import { checkGate, isStoryFlag } from "../src/dialog/gates";
import { PRACTICE_IDS } from "../src/content/vocab";
import { MAX_DEPTH, beatWidth, kindOf, type Talk, type TalkNode } from "../src/sim/talk";

/** Duyệt mọi nút, kể cả cây con `shared` — bản của `tools/`, không nhập runtime. */
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

/**
 * TĨNH / ĐỘNG — P2-07 §4.1. Ranh giới là **ai đổi được nó**: thứ thuộc về tay người chơi
 * và vai vế thì đứng yên trong lúc thẻ mở; thứ thuộc về người khác và về thế giới thì không.
 */
/*
 * ⚠️ `w.hot` và `w.rain` là TĨNH, không phải động — đã xếp sai một lần. `econ.weatherOf(day)` tra
 * một bảng theo NGÀY, nên xếp vào nhóm động là bắt nội dung khai ở `while` và người chơi thấy
 * "Sáng nay mát ha cô" bày ra giữa ngày nắng gắt rồi ăn một dấu `?`.
 *
 * ⚠️ `w.band` thì KHÔNG tĩnh: ngày game chạy 06:00 → 11:00, vắt qua cả ba buổi, nên nó đổi được
 * giữa lúc thẻ đang mở. (Cũng đã xếp nhầm một lần.)
 *
 * `w.ovenHot` tĩnh với người đứng ngoài đường, nhưng đã lên tầng cuộc (`when.world`).
 */
const STATIC = /^!?(p\.(holds|hands|soldOut|onStreet|atCounter|stock)|t\.(passing|named|purpose|state|tier|practice)|m\.|v\.|c\.openedBy|w\.(hot|rain))/;
const DYNAMIC = /^!?(w\.(queue|shadeFree|peak|band)|t\.(impatient|leaving|inShade|lookingInside|onPhone|eating))/;

/** Câu HỨA một việc làm — mỗi mẫu đi kèm cổng BẮT BUỘC phải có. */
const PROMISES: [RegExp, string[], string][] = [
  [/(ăn thử|nếm thử|bẻ miếng|cầm ổ này|lấy ổ này)/iu, ["p.holdsBread", "p.holdsFilled"], "mời ăn"],
  [/(rót \S+ ly trà|uống ly trà|ly trà đá nè|làm ly trà)/iu, ["p.holdsTea", "p.hasTea"], "mời uống"],
  [/chen (hàng|ngang)|tới trước (chị|anh|cô|chú|bà)/iu, ["t.cutLine"], "buộc tội chen hàng"],
  [/(đứng|vô|vào) .{0,12}(cho mát|chỗ mát|núp mưa|trú mưa)/iu, ["w.shadeFree"], "mời đứng chỗ mát"],
  /*
   * "Dời qua chỗ khác" chỉ THẬT khi hệ mô phỏng tự biết một trong ba chuyện: có người
   * đang chờ sau lưng, họ đang đứng chắn, hoặc **chỗ mình chỉ tới có thật và còn trống**.
   * Không có cái nào thì đó là nói bừa — cùng họ với câu "chị chen hàng".
   */
  [/xích (qua|ra)|dạt (qua|ra)|đứng qua bên/iu, ["w.queue", "t.blocking", "w.shadeFree"], "bảo người ta dời chỗ"],
  /*
   * "Ngồi xuống đi" chỉ thật khi CÓ CÁI GHẾ và ghế còn chỗ. Trước đợt này 12 câu mời ngồi
   * khai `needEquip: "GHE_BAN"` rồi thôi — người chơi bỏ 320 nghìn mua ghế, mời người ta
   * ngồi, và người ta đứng nguyên. Một câu trong số đó còn gắn nhầm `STEP_ASIDE`, tức là
   * mời ngồi mà hoá ra bảo người ta tránh đường.
   */
  [/ngồi (xuống|ghế|cái ghế|đây|nghỉ)|lấy ghế|ngồi nhờ/iu, ["w.seatFree", "GHE_BAN"], "mời ngồi"],
];

/**
 * NỢ T015 / T016 — xoá dần, danh sách rỗng thì xoá luôn cả khối. Để trống ngay từ đầu là cố ý:
 * hai cổng này sinh ra sau câu hỏi "tôi có thấy bạn code item hay hành động hay điều kiện và trí
 * nhớ gì đâu", và câu trả lời đúng là trả nợ chứ không phải ghi nợ.
 */
const T015_NO = new Set<string>([]);
const T016_NO = new Set<string>([]);

/**
 * Mẫu một câu ĐÁP: mở miệng bằng tiếng ừ hữ thì đó là lời đáp, không phải lời mở.
 *
 * ⚠️ KHÔNG dùng `\b`: `\b` của JS tính theo ASCII mà "ạ" không phải ASCII, nên `dạ\b` khớp luôn
 * chữ "Dạo" trong "Dạo này có vụ gì mới hông con?" — một câu MỞ LỜI hẳn hoi.
 */
const LOI_DAP = /^\s*(dạ|ừ|ờ|vâng|ùa|ủa|thôi vậy|vậy thôi)(?=[\s,.…!?:;]|$)/iu;
/** Câu làm quen LẦN ĐẦU — nói với người đã ghé hai chục lần là hỏng vai. */
const LAN_DAU = /(lần đầu|mới (thấy|gặp) (cô|chú|anh|chị|bà|em)|chưa gặp .{0,10}bao giờ)/iu;
/** Câu NHẮC CHUYỆN CŨ — phải có bằng chứng chuyện đó đã xảy ra. */
const CHUYEN_CU = /(bữa trước|hôm bữa|mấy bữa nay|lần trước|bữa nọ|hổm rày)/iu;
/** `act` có THỜI LƯỢNG — thiếu `forSec` thì scene không biết giữ người ta bao lâu. */
const ACT_CO_GIO = new Set(["GIVE_BREAD", "OFFER_TEA", "STAND_IN_SHADE", "LOOK_INSIDE", "STEP_ASIDE", "THEY_SIT", "FILM", "RAO"]);
/**
 * `act` là một VIỆC CÒN NỢ — thưởng phải nằm ở `onKept`, trả lúc LÀM chứ không lúc nói.
 *
 * Chỉ `PROMISE_DEED`: nó là việc mình hẹn làm rồi mới làm. `PROMISE` (bỏ thêm miếng chả) và
 * `CREDIT_LOAF` thì hệ quả rơi NGAY trong lượt đó nên được trả liền.
 */
const ACT_LA_HUA = new Set(["PROMISE_DEED"]);

export function validateTalks(dir: string): Report {
  const r = new Report();
  const talks: { t: Talk; file: string }[] = [];
  const ids = new Map<string, string>();

  for (const file of walk(join(dir, "talks"), [".json"])) {
    const data = readJson<{ talks?: Talk[] }>(file);
    for (const t of data.talks ?? []) {
      const where = `[${t.id}]`;
      // T008 — một id hai nơi: `TalkStore` nạp cái nào thì tuỳ thứ tự file, tức là tuỳ hệ điều hành.
      if (ids.has(t.id)) r.add("T008", "ERROR", file, where, `id trùng với cuộc trong ${ids.get(t.id)}`);
      ids.set(t.id, file);
      // T009 — khung cảnh phải có thật, nếu không cuộc đó không bao giờ khớp.
      for (const p of t.practice ?? []) {
        if (!(PRACTICE_IDS as readonly string[]).includes(p)) {
          r.add("T009", "ERROR", file, where, `practice '${p}' không có trong PRACTICE_IDS`);
        }
      }
      // T001 — cổng ở TẦNG CUỘC cũng phải có thật.
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

      // T001 — khoá cổng phải CÓ THẬT. Đây là kiểm tra lý do file này tồn tại.
      for (const key of gates) {
        const bare = key.startsWith("!") ? key.slice(1) : key;
        if (isStoryFlag(bare)) continue;
        const err = checkGate(key);
        if (err) r.add("T001", "ERROR", file, at, `${err}  — câu: "${node.say}"`);
      }

      // T002 — TĨNH ở `need`, ĐỘNG ở `while` (P2-07 §4.1). Đặt sai phía không làm hỏng
      // game: nó làm người chơi ăn một dấu "?" cho câu lẽ ra không nên bày ra.
      for (const k of node.while ?? []) {
        if (STATIC.test(k)) r.add("T002", "ERROR", file, at, `'${k}' là sự thật TĨNH — chuyển sang \`need\` (ẩn hẳn): "${node.say}"`);
      }
      for (const k of needKeys(node)) {
        if (DYNAMIC.test(k)) r.add("T002", "ERROR", file, at, `'${k}' là sự thật ĐỘNG — chuyển sang \`while\` (ra "?"): "${node.say}"`);
      }

      // T003 — câu HỨA phải có cổng làm được chuyện đó
      for (const [re, keys, label] of PROMISES) {
        if (!re.test(node.say)) continue;
        if (!gates.some((g) => keys.some((k) => g.includes(k.split("(")[0])))) {
          r.add("T003", "ERROR", file, at, `${label} mà không khai ${keys.map((k) => `\`${k}\``).join(" / ")}: "${node.say}"`);
        }
      }

      /*
       * T004 — NHẮC CHUYỆN CŨ PHẢI CÓ BẰNG CHỨNG CHUYỆN ĐÓ ĐÃ XẢY RA. Ba loại bằng chứng, đều là
       * thứ hệ mô phỏng BIẾT: `{m.what}` + `m.remembers` (mạnh nhất — nội dung không gọi tên
       * chuyện gì cả, nó nhận một chuyện) · một cổng `m.*` / `d.toldMe()` · một CỜ CHUYỆN do cuộc
       * nguồn đặt.
       *
       * Loại thứ ba là chỗ 26 nút "nhớ nhầm" sống: chúng nhắc lại một chuyện mà cuộc nguồn không
       * đặt cờ nào.
       */
      if (CHUYEN_CU.test(node.say)) {
        const byMemory = node.say.includes("{m.what}") || gates.some((g) => g.replace("!", "").startsWith("m.") || g.startsWith("d.toldMe"));
        const byFlag = gates.some((g) => isStoryFlag(g.replace("!", "")) && !g.startsWith("!")) || !!t.when?.needFlag;
        if (!byMemory && !byFlag) {
          r.add("T004", "ERROR", file, at,
            `nhắc chuyện cũ mà KHÔNG CÓ BẰNG CHỨNG nó đã xảy ra — thêm \`m.remembers\` + {m.what}, hoặc cổng cờ chuyện của cuộc nguồn: "${node.say}"`);
        }
      }
      if (node.say.includes("{m.what}") && !gates.includes("m.remembers")) {
        r.add("T004", "ERROR", file, at, `dùng {m.what} mà không khai \`need: m.remembers\` — sẽ điền chữ dự phòng: "${node.say}"`);
      }

      // T005 — câu làm quen lần đầu nói với người ghé hai chục lần là hỏng vai.
      if (LAN_DAU.test(node.say)) {
        const gated = gates.some((g) => g.includes("m.visits"));
        if (gated === false) r.add("T005", "WARN", file, at, `câu làm quen lần đầu không khai \`!m.visits(2)\`: "${node.say}"`);
      }

      /*
       * T012 — CÂU ĐÁP KHÔNG ĐƯỢC ĐỨNG Ở NHỊP ĐẦU của một cuộc người chơi mở được: nhịp đầu là chỗ
       * MÌNH mở miệng, mà một dòng bắt đầu bằng "Dạ"/"Ừ" là đang trả lời ai đó. Cuộc `NPC_ONLY`
       * thì ngược lại — nhịp đầu LUÔN là lời đáp, nên không áp.
       */
      if (depth === 1 && t.source !== "NPC_ONLY" && LOI_DAP.test(node.say)) {
        if (!needKeys(node).some((g) => g.startsWith("c.openedBy(NPC)"))) {
          r.add("T012", "ERROR", file, at,
            `câu ĐÁP ("${node.say}") ở NHỊP ĐẦU — khai \`need: "c.openedBy(NPC)"\`, hoặc viết lại thành câu mở lời`);
        }
      }

      const act = node.act as { kind: string; forSec?: unknown } | undefined;
      // T006 — act có thời lượng mà không khai `forSec` thì scene không biết giữ người ta bao lâu.
      if (act && ACT_CO_GIO.has(act.kind) && act.forSec === undefined) {
        r.add("T006", "ERROR", file, at, `act '${act.kind}' có thời lượng mà không khai \`forSec\`: "${node.say}"`);
      }
      // T007 — hứa thì chưa được thưởng. Thưởng trao tay trong HÀNH ĐỘNG (Zubek), tức `onKept`.
      if (act && ACT_LA_HUA.has(act.kind) && (node.rel !== undefined || node.calm !== undefined)) {
        r.add("T007", "ERROR", file, at, `lời hứa trả \`rel\`/\`calm\` NGAY LÚC NÓI — phần thưởng phải nằm ở \`onKept\`: "${node.say}"`);
      }
    }
  }

  /*
   * T010 — CÂU ẤM NGAY SAU CÂU GẮT phải biết là mình vừa gắt.
   *
   * Gắt xong rồi dỗ ngọt ở nhịp sau mà không kiểm `c.angered` là dựng lại đúng cái máy
   * "chọc rồi dỗ" mà `P-3` đi dẹp: người chơi học được rằng gắt không có giá.
   */
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
  /*
   * T011 — MỘT NHỊP PHẢI CÒN ÍT NHẤT HAI DÒNG KHI MỌI CỔNG ĐỀU ĐÓNG. Lỗi này do chính P2-09 đẻ ra:
   * khi `need` đọc được thế giới thì người viết có thể khoá CẢ NHỊP sau cổng, và với một người
   * không khớp cổng nào thì nhịp đó teo xuống còn đúng đường ra.
   *
   * `visibleOptions` có đường lui, nhưng đường lui đó bày ra những câu KHÔNG ĐÚNG CẢNH — chữa ở
   * nội dung, không chữa ở runtime.
   */
  for (const { t, file } of talks) {
    const beats: [string, readonly TalkNode[]][] = [[`[${t.id}] nhịp đầu`, t.tree]];
    for (const [name, sub] of Object.entries(t.shared ?? {})) beats.push([`[${t.id}] shared.${name}`, sub]);
    for (const { node, path } of walkTalk(t)) if (node.then?.length) beats.push([`[${t.id}]${path}`, node.then]);
    for (const [where, nodes] of beats) {
      // `beatWidth` của `sim/talk.ts` — CÙNG định nghĩa với lưới `L-2` của `p5-talk.test.ts`,
      // chỉ canh đầu ngược lại. Hai chỗ đếm hai kiểu là hai chỗ để lệch (và đã lệch một lần).
      const w = beatWidth(nodes);
      if (w.min < 2) {
        r.add("T011", "ERROR", file, where,
          `nhánh "${w.worst}" chỉ còn ${w.min} dòng — gặp người không khớp cổng nào thì nhịp này teo xuống một dòng`);
      }
    }
  }

  /*
   * T013 — MỌI CỔNG ĐÓNG THÌ NHỊP ĐẦU VẪN PHẢI CÒN MỘT NÚT CÓ NHÁNH.
   *
   * T011 chỉ đếm nhịp còn mấy DÒNG, không hỏi mấy dòng đó đi được tới đâu — và đó đúng là chỗ nó
   * phản tác dụng: để qua T011 người viết nhét thêm câu trần cho đủ hai dòng, mà câu nhét thêm thì
   * cụt. Đo được: 8/9 cuộc dài đúng MỘT nhịp khi bấm F với người đi ngang.
   *
   * Chỉ soi NHỊP ĐẦU (nhịp sau được phép kết thúc, đó là cách một cuộc tàn tự nhiên); miễn `MOI`
   * và `BARK`.
   */
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

  /*
   * T014 — NHỊP ĐẦU KHÔNG ĐƯỢC ĐỂ MỌI DÒNG NẰM SAU `while`.
   *
   * `need` ẩn dòng đi; `while` bày ra rồi trả "?" khi sự thật đã đổi. Một nhịp mà mọi dòng đều
   * `while` không phải nhịp hẹp — nó là nhịp BẤM GÌ CŨNG HỎNG, và ở nhịp đầu thì chưa có hành động
   * nào xảy ra để dựng nên sự thật đó.
   *
   * Cách đúng: khoá CẢ CUỘC bằng `when.world`, để `while` bên trong làm đúng việc của nó là đỡ cho
   * trường hợp sự thật đổi GIỮA CHỪNG.
   */
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

  /*
   * T015 — MỘT KHO MÀ NÓI CHUYỆN KHÔNG ĐỔI ĐƯỢC GÌ THÌ NÓ LÀ CÁI MENU.
   *
   * `A-1` (test `p5-talk`) đọc TỪNG CÂU theo mấy lối nói cố định nên không thấy được chuyện cả một
   * con người không có một hành động nào. Đo được: `thay-phuc` và `chi-hanh` 0/8 cuộc mang `act`,
   * 12 người có tên gộp lại chỉ 2% số nút — trong khi `qua-duong` 100% và `walkin` 75%, nên đây
   * không phải giới hạn của hệ.
   *
   * Ngưỡng MỘT NỬA, không phải tất cả: có những cuộc đúng là chỉ để nói.
   */
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

  /*
   * T016 — MỖI NGƯỜI CÓ TÊN PHẢI CÓ ÍT NHẤT MỘT CUỘC NEO VÀO KÝ ỨC. Cả `sim/recall.ts` dựng xong
   * mà chạy không tải: `{m.what}` xuất hiện 0 lần trong toàn bộ nội dung, 0/98 cuộc khai `about`.
   *
   * Một cuộc neo ký ức cần hai thứ, thiếu một thì tầng kia vô dụng: `about` (đầu vào relevance) và
   * một nút `{m.what}` (chỗ ký ức được NÓI RA).
   *
   * Chỉ áp cho 12 người CÓ TÊN — `WALKIN`/`QUA_DUONG` dùng chung `memKey` cho cả mùa.
   */
  {
    const t016Debt: string[] = [];
    const SHARED = new Set(["ANY", "WALKIN", "QUA_DUONG"]);
    const byNpc = new Map<string, { file: string; about: number; what: number }>();
    for (const { t, file } of talks) {
      if (SHARED.has(t.npc)) continue;
      const v = byNpc.get(t.npc) ?? { file, about: 0, what: 0 };
      if (t.about?.length) v.about++;
      if ([...walkTalk(t)].some(({ node }) => node.say.includes("{m.what}"))) v.what++;
      byNpc.set(t.npc, v);
    }
    for (const [npc, v] of byNpc) {
      if (v.about && v.what) continue;
      if (T016_NO.has(npc)) { t016Debt.push(npc); continue; }
      r.add("T016", "ERROR", v.file, `[${npc}]`,
        `chưa neo vào ký ức — cần ít nhất một cuộc khai \`about\` (${v.about} có) và một nút nói \`{m.what}\` (${v.what} có)`);
    }
    if (t016Debt.length) {
      r.add("T016", "WARN", "src/content/talks", "[nợ]", `${t016Debt.length} người còn nợ T016: ${t016Debt.join(", ")}`);
    }
  }

  /*
   * T017 — BÁN ĐƯỢC HÀNG CHO MỘT NGƯỜI ĐANG ĐI NGANG THÌ PHẢI QUA `INVITE`.
   *
   * Chủ dự án bắt được lần thứ ba cùng một lớp lỗi, lần này ở `any.banh`:
   *
   *   mình: *"Ngon thiệt mà. {call} ăn rồi biết."*
   *   họ:   *"Ờ thì… cho một ổ coi sao."*  → rồi đi mất, không mua.
   *
   * Câu đáp CHỐT MỘT VỤ MUA mà nút không có act nào, nên không đơn nào sinh ra. Với khách
   * đã đứng mua thì câu đó vô hại (họ mua sẵn rồi); với người ĐANG ĐI NGANG thì nó là
   * "free word" — nguyên văn chủ dự án.
   *
   * Nên luật: trong kho `ANY` và `QUA_DUONG` — hai kho một người đi ngang nghe được —
   * một nút chốt vụ mua phải HOẶC mang `INVITE`, HOẶC khoá `!t.passing` để nó không bao
   * giờ tới tai người đang đi.
   *
   * ⚠️ Mẫu dưới KHÔNG được dùng `\b` sau chữ có dấu: `\b` của JS tính theo ASCII nên
   * `ổ\b` không bao giờ khớp "cho một ổ coi sao" — đúng cái bẫy đã cắn hai lần.
   */
  const CHOT_MUA = /(cho|lấy|mua|làm|gói)\s+(?:\S+\s+){0,2}?(?:một|hai|ba|[123])?\s*(ổ|phần)(?![\p{L}])|lấy luôn (mấy )?ổ/iu;
  /** Mua ở CHỖ KHÁC thì không phải vụ mua của mình — con bé nói nó mua bánh ở cổng trường. */
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

  /*
   * T018 — MỘT CUỘC `FULL` KHÔNG SỐNG NỔI TRONG KHUNG `NAN_LAI`. Mâu thuẫn toán học, không
   * phải chuyện hiếm:
   *
   *   `Service.practiceOf()` trả `NAN_LAI` CHỈ KHI `someoneWaiting(c)` — người vừa được
   *   phục vụ còn nán lại trong lúc còn người chờ.
   *   `Service.canRun()` với `depth: FULL` đòi `canOpenDeep()` = **`!someoneWaiting(c)`**.
   *
   * Hai cái loại trừ nhau. Cuộc `FULL` mà CHỈ gắn `NAN_LAI` thì không bao giờ rút ra được —
   * `su.toan` (bé Su trả lại hai ngàn thối dư) nằm đúng chỗ đó, và `tools/probe-act.ts` đo
   * 22 buổi không một lượt nào đủ điều kiện. Gắn thêm thẻ khác thì sống, nhưng riêng thẻ
   * `NAN_LAI` trên một cuộc `FULL` vẫn là chữ chết — cảnh báo để người viết biết.
   */
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

  /*
   * T009b — TẦNG DÙNG CHUNG PHẢI PHỦ CẢ BẢY KHUNG CẢNH. Chia kho `ANY` về đúng khung cảnh là việc
   * đúng, nhưng chia hết tay thì sinh ra những khung cảnh KHÔNG CÒN CUỘC NÀO.
   *
   * ERROR chứ không WARN: một khung cảnh câm không nổ ra thành bug nào, nó chỉ làm một cái phím
   * trông như chết.
   */
  const covered = new Map<string, number>();
  for (const { t } of talks) {
    if (t.npc !== "ANY") continue;
    // `practice` khai được một chuỗi hoặc một mảng; không khai = cuộc này sống ở mọi khung.
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
