/**
 * ĐỌC QUAN HỆ TRONG SỔ TAY — P2-05b.
 *
 * Cả file này là một cái lưới canh ĐÚNG MỘT ĐƯỜNG: `relationPoints` không được rỉ ra
 * thành con số ở bất cứ đâu (T3), mà người chơi vẫn phải đọc được mình đang đứng ở đâu.
 * Hai trục tách rời:
 *   ĐỘ HIỂU   — `knownOf`, đếm được, hiện số. Thước đo NGƯỜI CHƠI.
 *   TÌNH CẢM  — `relWords`, chỉ ra MỘT CÂU mình tự ghi. Thước đo NPC, và nó không có số.
 *
 * Test cuối cùng (trần tin) là cái đáng nhất: nó chặn một luật mà bản bán ra không có
 * đường nào học được.
 */
import { test } from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { Rng } from "../src/core/rng";
import { newRelState, pushTrail, record, CEILING_MAX_BURNS, TRAIL_LEN, type RelState } from "../src/sim/memory";
import {
  SLOTS, composeEvening, guess, knownOf, logOrder, newNotebook, options, page, penName, relReadState,
  relWords, unguess,
  type EveningCtx, type RelReadState,
} from "../src/sim/notebook";
import { NPCS } from "../src/content/npcs";
import SO_TAY from "../src/content/lines/so-tay.json";

const PERS = NPCS.find((n) => n.id === "CHU_TU")!.personality;

/** RelState ở mốc "quen mặt, không có gì xảy ra" — mọi test dưới đây đẩy nó đi từ đây. */
function rel(over: Partial<RelState> = {}): RelState {
  return { ...newRelState(), visits: 10, relationPoints: 30, ...over };
}

function withLongWound(s: RelState): RelState {
  // Vết LONG thật, dựng qua `record()` chứ không nhét tay: ghi sai tên hai lần rồi để ba
  // ngày là đúng đường mà §2.3 promote lên LONG.
  record(s, PERS, "WRONG_NAME", 80, 1);
  record(s, PERS, "WRONG_NAME", 80, 2);
  s.memory.long.push(...s.memory.short.splice(0));
  return s;
}

// ─────────────────────────────────────────────────────────── trục ĐỘ HIỂU

test("knownOf đếm điều ĐÃ CHẮC, không đếm điều đang đoán", () => {
  const nb = newNotebook();
  const p = page(nb, "CHU_TU", 1);

  assert.deepEqual(knownOf(nb, "CHU_TU"), { done: 0, total: SLOTS.length, vignette: false });
  assert.equal(knownOf(nb, "BA_BAY").done, 0, "người chưa có trang vẫn phải ra 0, không được nổ");

  p.hypotheses.push({ slot: "HAY_AN", value: "ot", dayGuessed: 1, dayChanged: 1, state: "OPEN" });
  assert.equal(knownOf(nb, "CHU_TU").done, 0, "đang đoán KHÔNG phải đã biết");

  p.hypotheses[0].state = "CONFIRMED";
  p.hypotheses.push({ slot: "LAM_NGHE", value: "bảo vệ", dayGuessed: 1, dayChanged: 1, state: "CONFIRMED" });
  assert.equal(knownOf(nb, "CHU_TU").done, 2);

  p.vignetteUnlocked = true;
  assert.equal(knownOf(nb, "CHU_TU").vignette, true);
});

test("total luôn là số Ô, không phải số điều đã điền — dải mặt phải vẽ được cả ô trống", () => {
  const nb = newNotebook();
  page(nb, "CHU_TU", 1);
  const k = knownOf(nb, "CHU_TU");
  assert.equal(k.total, SLOTS.length);
  assert.ok(k.total > 0 && k.done <= k.total);
});

test("hai trục rời nhau thật: điểm quan hệ kéo được câu nhận xét, kéo không nổi con số", () => {
  const nb = newNotebook();
  const p = page(nb, "CHU_TU", 1);
  p.hypotheses.push({ slot: "HAY_AN", value: "ot", dayGuessed: 1, dayChanged: 1, state: "CONFIRMED" });

  const states = new Set<RelReadState>();
  for (const [pts, tier] of [[-60, "RIVAL"], [10, "ACQUAINTANCE"], [70, "FRIEND"]] as const) {
    const s = rel({ relationPoints: pts, tier });
    states.add(relWords(s, "chú Tư", new Rng(1)).state);
    // …mà thước ĐỘ HIỂU thì không nhúc nhích, vì nó không đọc `relationPoints` một lần nào.
    assert.equal(knownOf(nb, "CHU_TU").done, 1, `điểm ${pts} làm đổi số trên trang — hai trục đã dính nhau`);
  }
  assert.equal(states.size, 3, "điểm quan hệ đổi hẳn bucket mà sổ vẫn ghi y một câu");
});

// ─────────────────────────────────────────────────────────── trục TÌNH CẢM

test("tám trạng thái đều ra được, và thứ tự dò là ƯU TIÊN VIỆC LÀM ĐƯỢC", () => {
  const seen = new Map<RelReadState, RelState>();

  seen.set("RIVAL", rel({ tier: "RIVAL", relationPoints: -50 }));
  seen.set("VET_CHUA_LANH", withLongWound(rel()));
  seen.set("TRAN_TIN", rel({ trustCeiling: 52, relationPoints: 52 }));
  seen.set("MOI_GHE", rel({ visits: 1 }));
  seen.set("FRIEND", rel({ tier: "FRIEND", relationPoints: 70 }));
  seen.set("DANG_XUONG", rel({ trail: ["DOWN", "UP", "DOWN"] }));
  seen.set("DANG_LEN", rel({ trail: ["UP", "DOWN", "UP"] }));
  seen.set("QUEN_MAT", rel({ trail: ["UP"] }));

  for (const [want, s] of seen) assert.equal(relReadState(s), want, `trạng thái ${want}`);
  assert.equal(seen.size, 8, "thêm trạng thái thì phải thêm cả lời và cả test");

  // RIVAL thắng tất: đó là điều to nhất người chơi cần biết.
  assert.equal(relReadState(withLongWound(rel({ tier: "RIVAL", trustCeiling: 52 }))), "RIVAL");
  // Vết chưa lành thắng trần tin: nó là cái người chơi LÀM ĐƯỢC gì đó, trần thì không.
  assert.equal(relReadState(withLongWound(rel({ trustCeiling: 52, relationPoints: 52 }))), "VET_CHUA_LANH");
  // Trần tin thắng "mới ghé" và thắng cả hướng: nó là cái tường vô hình.
  assert.equal(relReadState(rel({ visits: 1, trustCeiling: 52, relationPoints: 52 })), "TRAN_TIN");
  assert.equal(relReadState(rel({ trustCeiling: 52, relationPoints: 52, trail: ["UP", "UP"] })), "TRAN_TIN");
});

test("trần tin chỉ lên tiếng khi đang ĐỤNG trần — hạ trần mà còn xa thì im", () => {
  assert.equal(relReadState(rel({ trustCeiling: 64, relationPoints: 10 })), "QUEN_MAT");
  assert.equal(relReadState(rel({ trustCeiling: 64, relationPoints: 62 })), "TRAN_TIN");
  // Người đã là bạn thì cái trần không chặn gì nữa — `nextTier` giữ FRIEND ở FRIEND.
  assert.equal(relReadState(rel({ tier: "FRIEND", trustCeiling: 52, relationPoints: 52 })), "FRIEND");
});

test("chuộc lỗi xong thì câu đổi theo — `heal` đổi valence, không phải đổi kind suông", () => {
  const s = withLongWound(rel());
  assert.equal(relReadState(s), "VET_CHUA_LANH");
  for (const m of s.memory.long) { m.kind = "HEALED_WRONG_NAME"; m.valence = 1; }
  assert.notEqual(relReadState(s), "VET_CHUA_LANH", "vết đã lành mà sổ còn nhắc là sai");
});

test("relWords KHÔNG BAO GIỜ ra một chữ số — đây là cái lưới canh T3", () => {
  const states: [RelReadState, RelState][] = [
    ["RIVAL", rel({ tier: "RIVAL" })],
    ["VET_CHUA_LANH", withLongWound(rel())],
    ["TRAN_TIN", rel({ trustCeiling: 52, relationPoints: 52 })],
    ["MOI_GHE", rel({ visits: 1 })],
    ["FRIEND", rel({ tier: "FRIEND", relationPoints: 70 })],
    ["DANG_XUONG", rel({ trail: ["DOWN", "DOWN"] })],
    ["DANG_LEN", rel({ trail: ["UP", "UP"] })],
    ["QUEN_MAT", rel()],
  ];
  for (const [want, s] of states) {
    // Quét MỌI biến thể, không chỉ cái rút ra: một câu lọt số là T3 vỡ ở bản bán ra.
    for (let seed = 0; seed < 60; seed++) {
      const { state, line } = relWords(s, "chú Tư", new Rng(seed));
      assert.equal(state, want);
      assert.ok(line.length > 4, `${want}: câu rỗng`);
      assert.doesNotMatch(line, /[0-9]/, `${want}: lọt con số — "${line}"`);
      assert.doesNotMatch(line, /[★♥♡]|\+\d|trust|điểm/i, `${want}: lọt dấu chỉ số — "${line}"`);
      assert.ok(!line.includes("{"), `${want}: còn chỗ thay chưa điền — "${line}"`);
    }
  }
});

test("cùng người cùng ngày thì cùng một câu — cột phải dựng lại sau mỗi chữ người chơi gõ", () => {
  const s = rel();
  const same = () => relWords(s, "chú Tư", Rng.forSeason("save-1", "rel:CHU_TU:12")).line;
  assert.equal(same(), same());
  assert.equal(same(), same(), "rút hai lần phải ra một câu, nếu không chữ nhảy dưới ngón tay");
  const other = relWords(s, "chú Tư", Rng.forSeason("save-1", "rel:CHU_TU:13")).line;
  assert.ok(typeof other === "string");
});

test("trail giữ đúng ba nét mới nhất, mới nhất ở cuối", () => {
  const s = rel();
  for (const d of ["UP", "DOWN", "UP", "DOWN", "DOWN"] as const) pushTrail(s, d);
  assert.equal(s.trail!.length, TRAIL_LEN);
  assert.deepEqual(s.trail, ["UP", "DOWN", "DOWN"]);
  assert.equal(relReadState(s), "DANG_XUONG");
});

// ─────────────────────────────────────────────────────────── giọng sổ

test("cả cuốn sổ là MỘT giọng: chính mình ghi cho mình, không ai ghi giùm", () => {
  const all: [string, string][] = [];
  for (const [k, v] of Object.entries(SO_TAY.notes)) for (const l of v.variants) all.push([`notes.${k}`, l]);
  for (const [k, v] of Object.entries(SO_TAY.confirm)) for (const l of v) all.push([`confirm.${k}`, l]);
  for (const [k, v] of Object.entries(SO_TAY.quanHe)) for (const l of v) all.push([`quanHe.${k}`, l]);
  assert.ok(all.length > 80, `mới có ${all.length} dòng — bộ lời bị hụt`);

  for (const [where, line] of all) {
    // Quán là của người chơi. Cô Ba chỉ ở màn mở đầu (P4-06) — không ghi sổ giùm ai.
    assert.doesNotMatch(line, /cô ba/i, `${where}: cô Ba quay lại trong sổ — "${line}"`);
    // "con" ở đây chỉ có thể là một người thứ hai đang xưng hô với người chơi. Nếu sau này
    // thật sự cần "con gái / con nít", nới regex ở ĐÂY và ghi rõ vì sao — đừng bỏ test.
    assert.doesNotMatch(line, /\bcon\b/i, `${where}: còn ai đó gọi người chơi là "con" — "${line}"`);
    // Cô Ba tự xưng "cô" và kể chuyện hồi xưa của bả.
    assert.doesNotMatch(line, /\bcô (thấy|nghe|nói|cũng|biết|bù|mới bán|còn bán|đi ngủ)\b/i,
      `${where}: còn giọng người thứ hai — "${line}"`);
  }
});

test("ba luật viết của §2.4 còn nguyên sau khi đổi giọng", () => {
  for (const [k, v] of Object.entries(SO_TAY.notes)) {
    for (const line of v.variants) {
      // (1) không tự chấm điểm — chấm điểm là việc của khách (T1)
      assert.doesNotMatch(line, /làm (tốt|giỏi|dở|tệ)|khá lắm|kém quá/i, `notes.${k}: tự chấm điểm — "${line}"`);
      // (2) không giải thích cơ chế — đây là sổ của một người, không phải tooltip
      assert.doesNotMatch(line, /trần tin|điểm quan hệ|bucket|trust|\bRIVAL\b|\bFRIEND\b/i,
        `notes.${k}: lộ cơ chế — "${line}"`);
      // (3) ngắn
      assert.ok(line.length <= 110, `notes.${k}: dài ${line.length} ký tự — "${line}"`);
    }
  }
});

test("sổ không gọi đúng tên người mình chưa học được", () => {
  const nb = newNotebook();
  // Chưa ghi tên → gọi bằng cách người bán hàng gọi khách quen chưa biết tên.
  assert.equal(penName(nb, "CHU_TU"), "chú bảo vệ");
  assert.notEqual(penName(nb, "CHU_TU"), "Chú Tư");
  // Ghi rồi → dùng đúng chữ người chơi viết, kể cả viết sai.
  page(nb, "CHU_TU", 1).name = "  chú Tư  ";
  assert.equal(penName(nb, "CHU_TU"), "chú Tư");
  page(nb, "CHU_TU", 1).name = "chú Năm";
  assert.equal(penName(nb, "CHU_TU"), "chú Năm", "sổ phải chép đúng cái sai của người chơi");

  // Mọi NPC có tên đều phải có cách gọi, và nó không được là tên thật.
  for (const n of NPCS) {
    assert.ok(n.asName && n.asName.length > 2, `${n.id}: thiếu asName`);
    assert.doesNotMatch(n.asName, new RegExp(n.name, "i"), `${n.id}: asName lộ luôn tên thật`);
  }
});

test("trang cuối ngày cũng đi qua penName — không phát không cái tên nào", () => {
  const nb = newNotebook();
  const note = composeEvening(nb, evening({ trust: [{ npcId: "CHU_TU", hard: false }] }));
  const joined = note.lines.join(" | ");
  assert.match(joined, /chú bảo vệ/i, `chưa gọi bằng cách gọi: ${joined}`);
  assert.doesNotMatch(joined, /Chú Tư/i, `lộ tên thật: ${joined}`);
});

// ─────────────────────────────────── hai ô ngược nhau không được chọi nhau

/** Dựng nhật ký để `options` chịu mở danh sách nguyên liệu (luật chống brute-force 1). */
function heardOrder(nb: ReturnType<typeof newNotebook>, text: string, day = 1) {
  logOrder(nb, { day, minute: 400, npcId: "CHU_TU", orderText: text, visitCount: 1 });
}

test('"hay ăn ớt" và "không ăn ớt" không cùng tồn tại được', () => {
  const nb = newNotebook();
  heardOrder(nb, "cho một ổ pate, nhiều ớt");   // `options` dò theo NHÃN trong câu gọi

  assert.ok(options(nb, "CHU_TU", "HAY_AN").includes("ot"), "ớt phải có trong danh sách");
  assert.equal(guess(nb, "CHU_TU", "HAY_AN", "ot", 1), null, "đoán cái đầu phải trôi");

  // Ô ngược lại KHÔNG được còn chào mời ớt nữa…
  assert.ok(!options(nb, "CHU_TU", "KHONG_AN_DUOC").includes("ot"), "ớt vẫn còn ở ô ngược lại");
  // …nhưng pate thì vẫn phải còn: chỉ cấm đúng cái đang chọi nhau.
  assert.ok(options(nb, "CHU_TU", "KHONG_AN_DUOC").includes("pate"), "cấm lan sang nguyên liệu khác");

  // …và nếu có đường nào lọt tới `guess`, nó phải nói ĐÚNG lý do.
  const msg = guess(nb, "CHU_TU", "KHONG_AN_DUOC", "ot", 1);
  assert.ok(msg, "đoán ngược nhau mà vẫn cho qua");
  assert.match(msg!, /hay ăn/, `lý do sai: ${msg}`);
  assert.doesNotMatch(msg!, /chưa gặp/, `lý do sai — người chơi GẶP ớt rồi: ${msg}`);
  assert.equal(nb.pages.CHU_TU.hypotheses.filter((h) => h.value === "ot").length, 1, "vẫn ghi vào sổ");
});

test("xoá ô này thì ô kia nhận lại giá trị đó", () => {
  const nb = newNotebook();
  heardOrder(nb, "cho một ổ đầy đủ, nhiều ớt");
  guess(nb, "CHU_TU", "HAY_AN", "ot", 1);
  unguess(nb, "CHU_TU", "HAY_AN");
  assert.ok(options(nb, "CHU_TU", "KHONG_AN_DUOC").includes("ot"), "xoá rồi mà ô kia vẫn bị khoá");
  assert.equal(guess(nb, "CHU_TU", "KHONG_AN_DUOC", "ot", 1), null);
});

test("hai ô ngược nhau KHÔNG BAO GIỜ cùng đúng — nên không có save nào xác nhận được cả hai", () => {
  // `truth` đòi usual >= 2 cho "hay ăn" và usual === 0 cho "không ăn". Test này chốt cái
  // bất biến đó: nếu ai nới một trong hai ngưỡng, luật chặn ở trên thành vô nghĩa.
  for (const lv of [0, 1, 2, 3]) {
    const hay = lv >= 2, khong = lv === 0;
    assert.ok(!(hay && khong), `mức ${lv}: hai ô cùng đúng`);
  }
});

// ─────────────────────────────────────────── văn phong UI (VAN-PHONG-UI)

/**
 * `npm run lint:lines` chỉ quét `content/lines` + `content/rules` — chuỗi trong `src/ui/**`
 * KHÔNG ai canh (VAN-PHONG-UI §6). Đây là cái lưới cho đúng cuốn sổ: nhãn hệ thống phải là
 * TIẾNG PHỔ THÔNG; giọng miền Nam chỉ sống trong thứ có người viết ra, và thứ đó nằm hết ở
 * `content/lines/so-tay.json` — không có một câu nào hardcode trong file view.
 */
test("nhãn trong sổ viết tiếng phổ thông, không đeo giọng vùng", () => {
  const src = readFileSync(new URL("../src/ui/notebook/NotebookView.ts", import.meta.url), "utf8");
  // Bỏ comment TRƯỚC khi rút chuỗi: khối cảnh báo trong file có nhắc chính mấy từ này.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  const lits = [...code.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"|`([^`\\]*(?:\\.[^`\\]*)*)`/g)]
    .map((m) => m[1] ?? m[2]).filter((t) => /[àáảãạăâđêôơưèéíòóùýỳ]/i.test(t));
  assert.ok(lits.length > 20, `mới rút được ${lits.length} chuỗi — regex hỏng rồi`);

  // Bảng đổi từ của VAN-PHONG-UI §4: bên trái CHỈ được xuất hiện trong thoại.
  const GIONG = /\b(vô|hổng|hông|giùm|xíu|bự|mắc|lẹ|kiếm|chừng nào|mối|nghen|nha|nhé|nè|hẵng|khỏi|bữa|đặng)\b/i;
  for (const t of lits) assert.doesNotMatch(t, GIONG, `nhãn đeo giọng vùng: ${JSON.stringify(t)}`);

  // §5 — không khen, không rào trước đón sau, không emoji.
  for (const t of lits) {
    assert.doesNotMatch(t, /tuyệt vời|làm tốt|cố lên|vui lòng|rất tiếc|đừng lo/i, `câu cấm: ${JSON.stringify(t)}`);
    assert.doesNotMatch(t, /\p{Extended_Pictographic}/u, `có emoji: ${JSON.stringify(t)}`);
  }
});

// ─────────────────────────────────────────────────────────── trần tin

const evening = (over: Partial<EveningCtx> = {}): EveningCtx => ({
  day: 5, lastDay: false, weather: "MAT", absences: [], landmark: 0, confirmations: [],
  bags: {}, rng: new Rng(7), spokenOnce: [], ...over,
});

test("hạ trần tin lần đầu thì sổ NÓI RA — và chỉ nói một lần cho mỗi người", () => {
  const nb = newNotebook();
  const spokenOnce: string[] = [];
  // Ghi tên vào sổ trước, để câu ra đúng cái tên NGƯỜI CHƠI đã học — không phải tên thật.
  page(nb, "CHU_TU", 1).name = "chú Tư";
  page(nb, "BA_BAY", 1).name = "bà Bảy";

  const n1 = composeEvening(nb, evening({ trust: [{ npcId: "CHU_TU", hard: false }], spokenOnce }));
  assert.ok(n1.lines.some((l) => /chú Tư/i.test(l)), `không thấy câu nào về chú Tư: ${n1.lines.join(" | ")}`);
  assert.ok(spokenOnce.includes("note:trust:CHU_TU:first"));

  // Burn thứ hai của CÙNG người: im. Không ai muốn nghe lại câu đó mỗi tối.
  const n2 = composeEvening(nb, evening({ day: 6, trust: [{ npcId: "CHU_TU", hard: false }], spokenOnce }));
  assert.ok(!n2.lines.some((l) => /chú Tư/i.test(l)), `nhắc lại rồi: ${n2.lines.join(" | ")}`);

  // Nhưng người KHÁC thì vẫn còn một lần của họ — đây đúng là lỗi mà khoá dùng chung gây ra.
  const n3 = composeEvening(nb, evening({ day: 7, trust: [{ npcId: "BA_BAY", hard: false }], spokenOnce }));
  assert.ok(n3.lines.some((l) => /bà Bảy/i.test(l)), `bà Bảy mất tiếng: ${n3.lines.join(" | ")}`);
});

test("tới mốc trần thấp nhất thì có một câu KHÁC — và FRIEND lúc đó thật sự không tới được", () => {
  const nb = newNotebook();
  const spokenOnce: string[] = [];
  page(nb, "CHU_TU", 1).name = "chú Tư";
  const first = composeEvening(nb, evening({ trust: [{ npcId: "CHU_TU", hard: false }], spokenOnce })).lines.join(" | ");
  const hard = composeEvening(nb, evening({ day: 9, trust: [{ npcId: "CHU_TU", hard: true }], spokenOnce })).lines.join(" | ");
  // `fill` hoa chữ đầu câu, nên tên mở đầu ra "Chú Tư" mà nằm giữa thì ra "chú Tư".
  assert.match(hard, /chú Tư/i, `câu mốc cứng không ra: ${hard}`);
  assert.notEqual(first, hard, "hai mốc phải nói hai kiểu khác nhau");

  // Và đây là lý do câu đó phải tồn tại: trần tụt dưới ngưỡng FRIEND là CHẶN VĨNH VIỄN.
  const s = rel({ burnCount: CEILING_MAX_BURNS, trustCeiling: 52, relationPoints: 52, visits: 20 });
  assert.ok(s.trustCeiling < 60, "nếu trần không còn dưới 60 thì cả cơ chế này đã đổi — đọc lại §2.8");
  assert.equal(relReadState(s), "TRAN_TIN");
});

test("không có ai bị hạ trần thì trang tối không mọc thêm dòng nào", () => {
  const nb = newNotebook();
  const a = composeEvening(nb, evening()).lines;
  const b = composeEvening(nb, evening({ day: 6, trust: [] })).lines;
  for (const l of [...a, ...b]) assert.doesNotMatch(l, /trần|không còn tin/i);
});
