/** Đáy phá sản: tiền trong ống + bán sạch đồ nghề vẫn không mua nổi rổ sáng mai. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { newGame } from "../src/core/save";
import { EQUIP_IDS } from "../src/sim/equipment";
import { brokeReport, markBroke, minBasketVnd } from "../src/sim/broke";
import { evidenceFor, gearEvidence } from "../src/sim/gearHint";

// ──────────────────────────────────────────────────────── hết vốn

/** Két rỗng, xe trơ, chưa quen mối nào — đáy thật. */
function tayTrang() {
  const w = newGame("T");
  w.money.cash = 0;
  return w;
}

test("HV-3 hết vốn là PHÉP CỘNG ba đường xoay, không phải ba câu hỏi rời", () => {
  const w = tayTrang();
  assert.ok(brokeReport(w).broke, "két rỗng, xe chỉ còn đồ đầu ván mà vẫn chưa gọi là hết vốn");

  // Còn đồ bán lại đủ mua rổ sáng mai thì chưa hết vốn (giá treo 149.000₫ > rổ 56.000₫).
  const conDo = tayTrang();
  conDo.equipment.owned.push("GIA_TREO");
  const rDo = brokeReport(conDo);
  assert.ok(rDo.resale >= rDo.need, "giá treo không còn bán đủ một rổ — ca thử này mất nghĩa, chọn món khác");
  assert.equal(rDo.broke, false, "xe còn giá treo bán đủ một rổ mà đã báo hết vốn");

  const conTien = tayTrang();
  conTien.money.cash = minBasketVnd(conTien.progress.dayIndex + 1);
  assert.equal(brokeReport(conTien).broke, false, "đủ tiền lấy hàng mà đã báo hết vốn");
});

test("HV-3b CÒN ĐỒ BÁN mà bán hết vẫn không đủ một rổ thì VẪN là hết vốn", () => {
  // Phải hỏi "bán hết có đủ không", không phải "còn món nào bán được không" — nếu không người chơi kẹt vòng lặp vô tận.
  for (const mon of ["KEP_GAP", "BINH_TRA"] as const) {
    const w = tayTrang();
    w.equipment.owned.push(mon);
    w.equipment.installed = [...w.equipment.owned];
    const r = brokeReport(w);
    assert.ok(r.resale > 0, `${mon} không bán lại được — ca thử này mất nghĩa`);
    assert.ok(r.resale < r.need, `${mon} giờ bán đủ một rổ — chọn món rẻ hơn cho ca thử này`);
    assert.equal(r.broke, true,
      `xe còn ${mon} bán được ${r.resale}₫ mà rổ sáng mai tốn ${r.need}₫ — bán hết vẫn không mở hàng được, phải là hết vốn`);
  }
});

test("HV-3c cờ hết vốn khớp ĐÚNG phép cộng, không lệch một ca nào", () => {
  const combos = [[], ["KEP_GAP"], ["BINH_TRA"], ["QUAT_DIEN"], ["GIA_TREO"], ["KEP_GAP", "BINH_TRA"]] as const;
  for (const own of combos) {
    for (const cash of [0, 20_000, 56_000, 500_000]) {
      const w = tayTrang();
      w.money.cash = cash;
      w.equipment.owned.push(...own);
      w.equipment.installed = [...w.equipment.owned];
      const r = brokeReport(w);
      assert.equal(r.broke, r.cash + r.resale < r.need,
        `lệch ở cash=${cash} owns=${own.join("+") || "không"}: gom được ${r.cash + r.resale}₫, rổ tốn ${r.need}₫, mà broke=${r.broke}`);
    }
  }
});

test("HV-4 `markBroke` cắm cờ vào save một lần, kèm ngày", () => {
  const w = tayTrang();
  w.progress.dayIndex = 7;
  assert.ok(markBroke(w));
  assert.equal(w.flags.broke, true);
  assert.equal(w.flags.brokeDay, 7);
  // Cắm rồi thì giữ nguyên kể cả khi có tiền lại, để vào lại ván rơi đúng màn dừng.
  w.money.cash = 9_000_000;
  assert.ok(markBroke(w), "cờ hết vốn tự gỡ khi két có tiền — vào lại ván sẽ nhảy về buổi sáng");
});

test("HV-5 ván mới KHÔNG hết vốn", () => {
  assert.equal(brokeReport(newGame("T")).broke, false, "vốn khởi điểm không đủ mua rổ nhỏ nhất");
});

// ──────────────────────────────────────────────────────── dấu vết

/** Buổi bán hỏng đủ đường để mọi nhánh dấu vết cùng lên tiếng. */
function buaTeHai() {
  const w = newGame("T");
  w.progress.dayIndex = 6;
  w.progress.weather = "MUA_RAO";
  w.progress.today = { served: 8, lost: 3, revenue: 0, talksDeep: 0, talkOffers: 0, bareHands: 6, burnt: 2, strangers: 0 };
  w.stall.cleanliness = 0.2;
  w.econ.today.wasted = ["0,4 lạng pate bà Tám", "nửa chục viên xíu mại"];
  w.econ.today.soldOut = 2;
  w.econ.today.counted = true;                   // buổi bán đã đóng sổ — cổng của `gearEvidence`
  w.flags.rainyDaySeen = true;
  w.flags.dirtyHandsConfirmed = true;
  return w;
}

test("DV-1 một bữa bán trơn tru thì KHÔNG món nào mở miệng", () => {
  // Bữa yên là bữa đã bán bình thường, không phải save trắng (bán 0 ổ thì loa phải lên tiếng).
  const w = newGame("T");
  w.econ.today.counted = true;
  w.progress.today = { served: 20, lost: 0, revenue: 700_000, talksDeep: 0, talkOffers: 0 };
  w.progress.weather = "MAT";
  w.stall.cleanliness = 1;
  const noi = EQUIP_IDS.filter((id) => gearEvidence(id, w) !== null);
  assert.deepEqual(noi, [], `im lặng là mặc định, mà mấy món này vẫn nói: ${noi.join(", ")}`);
});

test("DV-1b bán được 0 ổ thì cái loa PHẢI lên tiếng", () => {
  const w = newGame("T");
  w.econ.today.counted = true;
  w.progress.today = { served: 0, lost: 0, revenue: 0, talksDeep: 0, talkOffers: 0 };
  assert.match(gearEvidence("LOA_RAO", w)!, /im ắng/);
  w.econ.today.counted = false;
  assert.equal(gearEvidence("LOA_RAO", w), null, "chưa đếm tiền xong mà đã than ế");
});

test("DV-2 dấu vết đọc đúng con số của buổi bán", () => {
  const w = buaTeHai();
  assert.match(gearEvidence("LO_DIEN", w)!, /2 ổ/);
  assert.match(gearEvidence("KEP_GAP", w)!, /6 lần/);
  assert.match(gearEvidence("GHE_BAN", w)!, /3 người/);
  assert.match(gearEvidence("BINH_TRA", w)!, /3 người/);
  assert.equal(gearEvidence("DU_CHE", w), "Hôm nay mưa.");
  assert.match(gearEvidence("NOI_U", w)!, /xíu mại/);
});

test("DV-3 KHÔNG hai món nào nói cùng một câu", () => {
  const w = buaTeHai();
  const noi = new Map<string, string[]>();
  for (const id of EQUIP_IDS) {
    const l = gearEvidence(id, w);
    if (l) noi.set(l, [...(noi.get(l) ?? []), id]);
  }
  assert.ok(noi.size >= 8, "buổi tệ nhất đời mà chưa tới tám món lên tiếng — lưới này đang canh chỗ trống");
  const trung = [...noi].filter(([, ids]) => ids.length > 1);
  assert.deepEqual(trung, [],
    `\n  ${trung.map(([l, ids]) => `"${l}" dùng chung cho ${ids.join(", ")}`).join("\n  ")}`);
});

test("DV-4 món ĐÃ CÓ rồi thì không kể dấu vết nữa", () => {
  const w = buaTeHai();
  assert.ok(gearEvidence("LO_DIEN", w), "chưa mua mà đã im");
  w.equipment.owned.push("LO_DIEN");
  // `gearEvidence` là lớp thô; `evidenceFor` mới là cổng.
  assert.equal(evidenceFor("LO_DIEN", w), null, "mua rồi mà trang tối còn kể chuyện cháy bánh");
});

