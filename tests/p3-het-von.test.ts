/**
 * HẾT VỐN + DẤU VẾT — hai thứ đi chung, nên canh chung một chỗ.
 *
 * Chủ dự án gỡ khoá theo ngày của cây thiết bị (*"mở hạn chế ngày ra đi"*) và đổi lấy một
 * cái đáy thật: *"Nếu user mua mà phá sản tiêu hết vốn thì menu game over."* Hai vế đó phải
 * cùng sống hoặc cùng chết — bỏ khoá mà không có đáy thì chỉ là bỏ phanh, nên lưới này giữ
 * cả hai cùng lúc.
 *
 * Lưới thứ ba (TRÙNG CÂU) là lưới về VĂN PHONG, và nó ở đây vì cùng một lỗi đã mọc lại hai
 * lần: một cụm chữ xài cho nhiều món. Lần đầu là `"quầy đỡ dơ"` nằm ở ba món trong
 * `equipment.json`; lần hai là `"tới chiều cái quầy dơ hết"` nằm ở ba thẻ dấu vết. Không có
 * lưới thì nó mọc lần thứ ba.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { newGame } from "../src/core/save";
import { EQUIP, EQUIP_IDS } from "../src/sim/equipment";
import { brokeReport, markBroke, minBasketVnd } from "../src/sim/broke";
import { evidenceFor, gearEvidence } from "../src/sim/gearHint";

// ──────────────────────────────────────────────────────── khoá theo ngày

test("HV-1 chỉ còn ĐÚNG một món khoá theo ngày, và nó khoá vì một cảnh có ngày cố định", () => {
  // Đèn ca tối từng là món thứ hai; nó đã bị bỏ hẳn khỏi cây thiết bị vì đo ra không bán thêm
  // một ổ nào (`tools/audit-gain.ts`: 914 → 914). Còn lại bảng QR, khoá vì cảnh SK-23.
  const theoNgay = EQUIP_IDS.filter((id) => EQUIP[id].unlock?.minDay !== undefined);
  assert.deepEqual(theoNgay.sort(), ["BANG_QR"],
    "có món khoá theo ngày mà không phải SK-23 — nhịp mùa giờ do `sim/broke` giữ, không do đồng hồ");
  for (const id of theoNgay) assert.equal(EQUIP[id].unlock!.minDay, 14, `${id} lệch ngày 14 của SK-23`);
});

test("HV-2 cổng còn lại là chuyện của thế giới, không phải đồng hồ", () => {
  for (const id of EQUIP_IDS) {
    const u = EQUIP[id].unlock;
    if (!u || u.minDay !== undefined) continue;
    assert.ok(u.afterFlag || u.requiresAny?.length, `${id} có khối unlock rỗng`);
  }
});

// ──────────────────────────────────────────────────────── hết vốn

/** Két rỗng, xe trơ, chưa quen mối nào — đáy thật. */
function tayTrang() {
  const w = newGame("T");
  w.money.cash = 0;
  return w;
}

test("HV-3 hết vốn là PHÉP CỘNG ba đường xoay, không phải ba câu hỏi rời", () => {
  const w = tayTrang();
  assert.ok(brokeReport(w).broke, "két rỗng, xe chỉ còn đồ của cô Ba, chưa quen mối nào mà vẫn chưa gọi là hết vốn");

  // (a) còn đồ bán lại ĐỦ mua rổ sáng mai thì CHƯA hết vốn — đường "xoay cho đủ" (P3-06 §2.4)
  // vẫn còn đi được. Giá treo bán lại 149.000₫, rổ nhỏ nhất 56.000₫.
  const conDo = tayTrang();
  conDo.equipment.owned.push("GIA_TREO");
  const rDo = brokeReport(conDo);
  assert.ok(rDo.resale >= rDo.need, "giá treo không còn bán đủ một rổ — ca thử này mất nghĩa, chọn món khác");
  assert.equal(rDo.broke, false, "xe còn giá treo bán đủ một rổ mà đã báo hết vốn");

  // (b) đủ tiền mua rổ sáng mai thì CHƯA hết vốn, dù xe trơ
  const conTien = tayTrang();
  conTien.money.cash = minBasketVnd(conTien.progress.dayIndex + 1, conTien.suppliers);
  assert.equal(brokeReport(conTien).broke, false, "đủ tiền lấy hàng mà đã báo hết vốn");
});

test("HV-3b CÒN ĐỒ BÁN mà bán hết vẫn không đủ một rổ thì VẪN là hết vốn", () => {
  // Cái đáy từng thủng ở đúng đây, vì một chữ: luật cũ hỏi "trên xe còn món nào bán lại được
  // không", chứ không hỏi "bán hết có đủ không". Người chơi sạch tiền mà còn cái kẹp gắp bán
  // được 23.000₫ thì không bao giờ chạm đáy — 23.000₫ không mua nổi rổ 56.000₫, nhưng nó khác
  // 0 nên cờ không cắm. Sáng ra không mua được gì, đứng bán cái xe trống, tối lại về, lặp vô
  // tận. Lưới này giữ cho cái lỗ đó không mọc lại.
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
  // Quét thẳng: với mọi cách xếp đồ lên xe, `broke` phải bằng đúng "gom hết < rổ sáng mai".
  const combos = [[], ["KEP_GAP"], ["BINH_TRA"], ["QUAT_DIEN"], ["GIA_TREO"], ["KEP_GAP", "BINH_TRA"]] as const;
  for (const own of combos) {
    for (const cash of [0, 20_000, 56_000, 500_000]) {
      const w = tayTrang();
      w.money.cash = cash;
      w.equipment.owned.push(...own);
      w.equipment.installed = [...w.equipment.owned];
      const r = brokeReport(w);
      assert.equal(r.broke, r.cash + r.resale + r.credit < r.need,
        `lệch ở cash=${cash} owns=${own.join("+") || "không"}: gom được ${r.cash + r.resale + r.credit}₫, rổ tốn ${r.need}₫, mà broke=${r.broke}`);
    }
  }
});

test("HV-4 `markBroke` cắm cờ vào save một lần, kèm ngày", () => {
  const w = tayTrang();
  w.progress.dayIndex = 7;
  assert.ok(markBroke(w));
  assert.equal(w.flags.broke, true);
  assert.equal(w.flags.brokeDay, 7);
  // cắm rồi thì giữ nguyên, kể cả khi sau đó có tiền lại (vào lại ván phải rơi đúng màn dừng)
  w.money.cash = 9_000_000;
  assert.ok(markBroke(w), "cờ hết vốn tự gỡ khi két có tiền — vào lại ván sẽ nhảy về buổi sáng");
});

test("HV-5 ván mới KHÔNG hết vốn", () => {
  assert.equal(brokeReport(newGame("T")).broke, false, "vốn khởi điểm không đủ mua rổ nhỏ nhất");
});

// ──────────────────────────────────────────────────────── dấu vết

/** Một buổi bán hỏng đủ đường — để mọi nhánh dấu vết cùng lên tiếng một lượt. */
function buaTeHai() {
  const w = newGame("T");
  w.progress.dayIndex = 6;
  w.progress.weather = "MUA_RAO";
  w.progress.today = { served: 8, lost: 3, revenue: 0, talksDeep: 0, talkOffers: 0 };
  w.stall.cleanliness = 0.2;
  w.econ.today.wasted = ["0,4 lạng pate bà Tám", "nửa chục viên xíu mại"];
  w.econ.today.soldOut = 2;
  w.econ.today.counted = true;                   // buổi bán đã đóng sổ — cổng của `gearEvidence`
  w.flags.rainyDaySeen = true;
  w.flags.dirtyHandsConfirmed = true;
  Object.assign(w.notebook.today, { day: 6, bareHands: 6, wipes: 5, burnt: 2, handsSeen: 1, dropped: 1, strangers: 0 });
  return w;
}

test("DV-1 một bữa bán trơn tru thì KHÔNG món nào mở miệng", () => {
  // "Không có chuyện gì" KHÔNG phải là một cái save trắng: bán được 0 ổ là một bữa rất có
  // chuyện, và cái loa rao nói đúng khi nó lên tiếng ở đó. Bữa yên là bữa ĐÃ BÁN BÌNH THƯỜNG.
  const w = newGame("T");
  w.notebook.today.day = w.progress.dayIndex;
  w.econ.today.counted = true;
  w.progress.today = { served: 20, lost: 0, revenue: 700_000, talksDeep: 0, talkOffers: 0 };
  w.progress.weather = "MAT";
  w.stall.cleanliness = 1;
  const noi = EQUIP_IDS.filter((id) => gearEvidence(id, w) !== null);
  assert.deepEqual(noi, [], `im lặng là mặc định, mà mấy món này vẫn nói: ${noi.join(", ")}`);
});

test("DV-1b bán được 0 ổ thì cái loa PHẢI lên tiếng", () => {
  const w = newGame("T");
  w.notebook.today.day = w.progress.dayIndex;
  w.econ.today.counted = true;
  w.progress.today = { served: 0, lost: 0, revenue: 0, talksDeep: 0, talkOffers: 0 };
  assert.match(gearEvidence("LOA_RAO", w)!, /im re/);
  // nhưng chỉ sau khi đã đóng sổ — giữa buổi thì chưa có gì để nói
  w.econ.today.counted = false;
  assert.equal(gearEvidence("LOA_RAO", w), null, "chưa đếm tiền xong mà đã than ế");
});

test("DV-2 dấu vết đọc đúng con số của buổi bán", () => {
  const w = buaTeHai();
  assert.match(gearEvidence("LO_DIEN", w)!, /2 ổ/);
  assert.match(gearEvidence("KEP_GAP", w)!, /6 lần/);
  assert.match(gearEvidence("GHE_BAN", w)!, /3 người/);
  assert.match(gearEvidence("BINH_TRA", w)!, /3 người/);
  assert.equal(gearEvidence("DU_CHE", w), "Bữa nay mưa.");
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
  // `gearEvidence` là lớp thô; `evidenceFor` mới là cổng — lưới DV-4 canh đúng cái cổng đó
  assert.equal(evidenceFor("LO_DIEN", w), null, "mua rồi mà trang tối còn kể chuyện cháy bánh");
});

test("DV-5 dấu vết của NGÀY KHÁC không được đọc thành chuyện bữa nay", () => {
  const w = buaTeHai();
  w.progress.dayIndex = 7;                       // sổ `today` vẫn còn của ngày 6
  for (const id of EQUIP_IDS) assert.equal(gearEvidence(id, w), null, `${id} kể chuyện hôm qua`);
});
