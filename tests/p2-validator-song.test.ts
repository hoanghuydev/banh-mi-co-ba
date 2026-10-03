/**
 * LƯỚI CÓ CÒN SỐNG KHÔNG — phá từng cái một rồi hỏi `validate:talks`.
 *
 * Một validator chết KHÔNG kêu: nó chỉ lặng lẽ cho mọi thứ đi qua, và người viết nội dung
 * tin vào dấu "sạch" của nó. Đã bị một lần ở cổng `check-gates`: heredoc nuốt mất `\b`
 * thành một byte backspace, lưới hết khớp gì nữa mà vẫn in ✔, suýt nữa thì tin.
 *
 * Lưới này có mặt vì `tools/validate-talks.ts` từng phải dựng lại trọn vẹn — file đó chưa
 * bao giờ được commit nên git không giữ bản nào. Dựng lại xong mà chỉ nhìn "0 lỗi" rồi
 * yên tâm thì đó là tin vào đúng thứ vừa mất.
 */
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
  ["T007", (t) => { t.tree[0].act = { kind: "PROMISE_DEED", deed: "DUA_BANH" }; t.tree[0].rel = 2; }],
  ["T008", (t, d) => { d.talks.push({ ...t }); }],
  ["T009", (t) => { t.practice = ["KHONG_CO_KHUNG_NAY"]; }],
  ["T010", (t) => { t.tree[0].tone = "GAT"; t.tree[0].then = [{ say: "Dạ cô đừng giận.", tone: "AM", reply: "Ờ.", mood: "LANH" }]; }],
  ["T011", (t) => { t.tree = [t.tree[0]]; }],
  ["T012", (t) => { t.source = "PLAYER_ONLY"; t.tree[0].say = "Dạ, cô nói đi cô."; }],
  ["T013", (t) => { for (const n of t.tree) { delete n.then; delete n.ref; } }],
  ["T014", (t) => { for (const n of t.tree) n.while = ["t.onPhone"]; delete t.when; }],
  // Gỡ `act` ĐỆ QUY: `T015` đếm act ở MỌI nhịp (`walkTalk`), nên chỉ gỡ nhịp đầu thì
  // act ở nhịp hai sống sót và lưới không có gì để kêu — bài phá hụt, không phải lưới hỏng.
  ["T015", (_t, d) => {
    const go = (ns: Any[]) => ns.forEach((n) => { delete n.act; if (n.then) go(n.then); });
    for (const x of d.talks) { go(x.tree); for (const sub of Object.values(x.shared ?? {})) go(sub as Any[]); }
  }],
  ["T016", (_t, d) => {
    for (const x of d.talks) {
      delete x.about;
      const go = (ns: Any[]) => ns.forEach((n) => { n.say = String(n.say).replace("{m.what}", "chuyện cũ"); if (n.then) go(n.then); });
      go(x.tree);
    }
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
  /*
   * T017 chỉ sống ở hai kho `ANY` / `QUA_DUONG` nên không dùng chung được bộ phá
   * `ba-bay.json` ở trên: phá đúng chỗ nó canh mới là phá.
   *
   * Dựng lại ĐÚNG lỗi chủ dự án bắt được lần thứ ba: gỡ `INVITE` khỏi một câu mời mua
   * trong `qua-duong.json` và để nguyên câu đáp nhận lời. Người đi ngang gật rồi đi mất.
   */
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
