/** Phá nội dung từng kiểu một rồi kiểm `validate:talks` còn kêu — validator chết thì im lặng cho mọi thứ qua. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, cpSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateTalks } from "../tools/validate-talks";

type Any = Record<string, any>;
const SRC = join(import.meta.dirname, "..", "src", "content");

/** Một kiểu phá, kèm mã lưới PHẢI kêu lên. */
const CASES: [string, (t: Any, d: Any) => void][] = [
  ["T001", (t) => { t.tree[0].need = ["t.khongCoThat"]; }],
  ["T002", (t) => { t.tree[0].while = ["t.purpose(DI_CHO)"]; }],
  ["T003", (t) => { t.tree[0].say = "Cô cầm ổ này đi cô."; delete t.tree[0].need; }],
  ["T004", (t) => { t.tree[0].say = "Bữa trước cô nói gì đó cô?"; }],
  ["T005", (t) => { t.tree[0].say = "Lần đầu cô ghé đây hả cô?"; delete t.tree[0].need; }],
  ["T006", (t) => { t.tree[0].act = { kind: "OFFER_TEA" }; }],
  ["T007", (t) => { t.tree[0].act = { kind: "PROMISE_DEED", deed: "DUA_BANH" }; t.tree[0].calm = 10; }],
  ["T008", (t, d) => { d.talks.push({ ...t }); }],
  ["T009", (t) => { t.practice = ["KHONG_CO_KHUNG_NAY"]; }],
  ["T010", (t) => { t.tree[0].tone = "GAT"; t.tree[0].then = [{ say: "Dạ cô đừng giận.", tone: "AM", reply: "Ờ.", mood: "LANH" }]; }],
  ["T011", (t) => { t.tree = [t.tree[0]]; }],
  ["T012", (t) => { t.source = "PLAYER_ONLY"; t.tree[0].say = "Dạ, cô nói đi cô."; }],
  ["T013", (t) => { for (const n of t.tree) { delete n.then; delete n.ref; } }],
  ["T014", (t) => { for (const n of t.tree) n.while = ["t.onPhone"]; delete t.when; }],
  // Gỡ đệ quy vì `T015` đếm act ở mọi nhịp, chỉ gỡ nhịp đầu là phá hụt.
  ["T015", (_t, d) => {
    const go = (ns: Any[]) => ns.forEach((n) => { delete n.act; if (n.then) go(n.then); });
    for (const x of d.talks) { go(x.tree); for (const sub of Object.values(x.shared ?? {})) go(sub as Any[]); }
  }],

];

for (const [code, phaHoai] of CASES) {
  test(`${code} còn bắt được khi nội dung bị phá đúng kiểu nó canh`, () => {
    const tmp = mkdtempSync(join(tmpdir(), "sab-"));
    try {
      cpSync(SRC, join(tmp, "content"), { recursive: true });
      const p = join(tmp, "content", "talks", "ba-bay.json");
      const d = JSON.parse(readFileSync(p, "utf8"));
      phaHoai(d.talks[0], d);
      writeFileSync(p, JSON.stringify(d, null, 2));
      const rep = validateTalks(join(tmp, "content"));
      assert.ok(rep.diags.some((x) => x.code === code),
        `${code}: phá rồi mà validator im — lưới này chết`);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
}

test("T017 còn bắt được khi nội dung bị phá đúng kiểu nó canh", () => {
  // T017 chỉ canh kho `ANY` / `QUA_DUONG`: gỡ `INVITE` khỏi câu mời mua mà giữ câu đáp nhận lời.
  const tmp = mkdtempSync(join(tmpdir(), "sab-"));
  try {
    cpSync(SRC, join(tmp, "content"), { recursive: true });
    const p = join(tmp, "content", "talks", "qua-duong.json");
    const d = JSON.parse(readFileSync(p, "utf8"));
    let pha = 0;
    const go = (ns: Any[]) => ns.forEach((n) => {
      if (n.act?.kind === "INVITE") { n.reply = "Ờ thì… cho một ổ coi sao."; delete n.act; pha++; }
      if (n.then) go(n.then);
    });
    for (const x of d.talks) { go(x.tree); for (const sub of Object.values(x.shared ?? {})) go(sub as Any[]); }
    assert.ok(pha > 0, "không còn câu mời mua nào để phá — lưới này mất chỗ bám");
    writeFileSync(p, JSON.stringify(d, null, 2));
    const rep = validateTalks(join(tmp, "content"));
    assert.ok(rep.diags.some((x) => x.code === "T017"),
      "T017: gỡ INVITE rồi mà validator im — lưới này chết");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("nội dung THẬT của repo vẫn sạch — lưới nghiêm mà không bắt oan", () => {
  const rep = validateTalks(SRC);
  assert.deepEqual(rep.errors.map((d) => `${d.code} ${d.where} ${d.detail}`), []);
});
