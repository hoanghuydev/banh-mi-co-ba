/**
 * TRUY HỒI KÝ ỨC — P2-09 §2.4 (mô hình Park et al., *Generative Agents*).
 *
 * Lưới này canh đúng một chuyện, và nó là chuyện làm cho 26 nút "nhớ nhầm" của P2-08 §1.7
 * không mọc lại được: **nội dung không GỌI TÊN một chuyện cũ, nó NHẬN một chuyện cũ.**
 * Truy hồi trả rỗng ⇒ `m.remembers` sai ⇒ câu đó không tồn tại.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { jaccard, retrieve, tagsOf, weightsOf, worthMentioning, RECENCY_DECAY } from "../src/sim/recall";
import { currentIntensity, newRelState, record, type RelState } from "../src/sim/memory";
import { NPCS } from "../src/content/npcs";
import { PROFILE_IDS, memWeights, profileOf } from "../src/sim/profile";

const P = (over: Partial<{ soi: number; nongTinh: number; deTha: number; thanThien: number }> = {}) =>
  ({ soi: 0.5, nongTinh: 0.5, deTha: 0.5, thanThien: 0.5, ...over });

/**
 * `visits` phải ĐẶT THẬT. Thang recency đo bằng LẦN GHÉ, quy từ ngày qua `visits/day`;
 * để `visits = 0` là ép thang về sàn 0,25 và mọi ký ức trông như vừa mới xảy ra — một
 * cái bẫy của chính lưới này, không phải của mô hình.
 */
function withMem(kinds: [string, number][], day = 10, madeOn = day - 1): RelState {
  const s = newRelState();
  s.visits = day;                                   // ghé mỗi ngày — người quen
  for (const [k, inten] of kinds) record(s, P(), k as never, inten, madeOn);
  return s;
}

test("R-1 thẻ của một ký ức gom theo CHỦ ĐỀ, không theo cơ chế", () => {
  const s = withMem([["MADE_THEM_WAIT", 60]]);
  const t = tagsOf(s.memory.short[0]);
  assert.ok(t.has("MADE_THEM_WAIT"), "giữ nguyên kind");
  assert.ok(t.has("CHO_DOI"), "gom về chủ đề người ta NHỚ, không phải tên sự kiện");
  assert.ok(t.has("XAU"));
  assert.ok(!t.has("TU_TE"));
});

test("R-2 jaccard: hai tập rỗng ra 0, không ra 1", () => {
  // "không nói về gì cả" KHÔNG khớp với gì cả — nếu ra 1 thì mọi ký ức khớp mọi chủ đề.
  assert.equal(jaccard(new Set(), new Set(["A"])), 0);
  assert.equal(jaccard(new Set(), new Set()), 0);
  assert.equal(jaccard(new Set(["A", "B"]), new Set(["A"])), 0.5);
  assert.equal(jaccard(new Set(["A"]), new Set(["A"])), 1);
});

test("R-3 khớp thẻ BẰNG 0 thì BỊ LOẠI — đây là chỗ 'nhớ nhầm' chết", () => {
  /**
   * Nếu một ký ức không liên quan vẫn thắng được bằng mỗi `importance` thì hệ sẽ lôi
   * chuyện rớt bánh ra giữa một cuộc nói về thời tiết. Đó đúng là cách sinh ra 26 nút
   * nhắc một chuyện chưa từng xảy ra *trong ngữ cảnh đó*.
   */
  const s = withMem([["DROPPED_FOOD", 90]]);
  assert.equal(retrieve(s, P(), 10, new Set(["CHO_DOI"])).length, 0, "chủ đề khác hẳn ⇒ không nhớ ra gì");
  assert.equal(retrieve(s, P(), 10, new Set(["SACH_SE"])).length, 1, "đúng chủ đề ⇒ nhớ ra");
  assert.equal(retrieve(s, P(), 10, new Set()).length, 1, "không hỏi chủ đề nào ⇒ nhớ gì cũng được");
});

test("R-4 ba thành phần đều ĐỔI được thứ hạng — không có cái nào là đồ trang trí", () => {
  /**
   * Một ký ức NẶNG mà CŨ, và một ký ức NHẸ mà MỚI. Ai nhớ cái nào là chuyện của tính
   * cách — nếu không thì công thức ba thành phần chỉ là một thành phần đội lốt ba.
   */
  const s = newRelState();
  s.visits = 12;                                 // người quen, ghé gần như mỗi ngày
  record(s, P(), "DROPPED_FOOD", 95, 2);         // nặng, mười ngày trước
  record(s, P(), "FLOURISH", 35, 11);            // nhẹ, hôm qua

  /*
   * So CÙNG MỘT TUỔI, cố ý: hướng của `importance` theo thời gian đang vướng một lỗi có
   * sẵn của P2-03 (xem `R-4b`), và lưới này không được dựa vào nó.
   */
  const same = newRelState();
  same.visits = 12;
  record(same, P(), "DROPPED_FOOD", 95, 11);
  record(same, P(), "FLOURISH", 35, 11);
  assert.equal(retrieve(same, P(), 12, new Set(), 2)[0].memory.kind, "DROPPED_FOOD",
    "cùng tuổi ⇒ chuyện nặng thắng, đó là importance làm việc");

  const detha = retrieve(s, P({ deTha: 0.95 }), 12, new Set(), 2);
  assert.equal(detha[0].memory.kind, "FLOURISH", "dễ tha ⇒ chuyện hôm qua thắng chuyện mười ngày trước");
  assert.ok(detha[0].parts.recency > detha[1].parts.recency * 2,
    "recency phải có BIÊN ĐỘ THẬT — dải rộng 1% là một phần ba công thức làm cảnh");

  // và CHỦ ĐỀ kéo được hạng: hỏi đúng chuyện sạch sẽ thì chuyện nhẹ không chen vào
  const sach = retrieve(s, P({ deTha: 0.95 }), 12, new Set(["SACH_SE"]), 2);
  assert.equal(sach.length, 1, "chỉ một ký ức khớp chủ đề");
  assert.equal(sach[0].memory.kind, "DROPPED_FOOD");
});

test("R-4b người ĐỂ BỤNG phải nhớ lâu hơn người MAU QUÊN — chiều của decay", () => {
  /**
   * Đây từng là một LỖI CÓ SẴN của `P2-03 §2.4`, tìm ra trong lúc dựng P2-09 và đã sửa.
   * Giữ lưới lại vì nó là loại sai đọc doc không thấy được, và loại đó mọc lại:
   *
   *   `decayMul = 0,4 + 1,6·deTha` là một **TỐC ĐỘ QUÊN** (deTha cao ⇒ số lớn).
   *   `taper` là một **ĐỘ DÀI** đoạn dốc (số lớn ⇒ phai chậm).
   * Nhân thẳng cái thứ nhất vào cái thứ hai là lộn ngược — phải NGHỊCH ĐẢO.
   *
   * Bản cũ đo được (`WRONG_NAME` 90, tạo ngày 1): ngày 16 chị Lan còn **23**, bé Su còn
   * **56**. Tức suốt hơn hai tuần, người mau quên nhất hẻm giận dai hơn người để bụng nhất.
   */
  const lan = { soi: 0.9, nongTinh: 0.1, deTha: 0.2, thanThien: 0.3 };
  const su = { soi: 0.4, nongTinh: 0.4, deTha: 0.9, thanThien: 1.0 };
  const mk = (p: typeof lan) => {
    const s = newRelState();
    record(s, p, "WRONG_NAME", 90, 1);
    return s.memory.short[0];
  };
  const mLan = mk(lan), mSu = mk(su);
  for (const day of [8, 12, 16, 20]) {
    assert.ok(currentIntensity(mLan, day, lan) > currentIntensity(mSu, day, su),
      `ngày ${day}: để bụng ${currentIntensity(mLan, day, lan).toFixed(0)} phải > mau quên ${currentIntensity(mSu, day, su).toFixed(0)}`);
  }
  // Và chiều NGƯỢC LẠI cho ký ức DƯƠNG: người mở lòng nhớ ơn lâu hơn (nhánh này vốn đúng).
  const mkTot = (p: typeof lan) => {
    const s = newRelState();
    record(s, p, "CARED_FOR_THEM", 80, 1);
    return s.memory.short[0];
  };
  assert.ok(currentIntensity(mkTot(su), 10, su) > currentIntensity(mkTot(lan), 10, lan),
    "người mở lòng (thanThien cao) nhớ ơn lâu hơn");
});

test("R-5 trọng số suy từ TÍNH CÁCH, không phải một bảng số thứ hai", () => {
  const detha = weightsOf(P({ deTha: 0.95 })), debung = weightsOf(P({ deTha: 0.05 }));
  assert.ok(detha.recency > debung.recency, "dễ tha ⇒ nặng recency");
  assert.ok(detha.importance < debung.importance, "để bụng ⇒ nặng importance");
  assert.ok(weightsOf(P({ soi: 0.9 })).relevance > weightsOf(P({ soi: 0.1 })).relevance, "soi ⇒ nặng relevance");
  /*
   * Hằng suy giảm CỐ Ý khác bài báo: `0,995` của họ là mỗi GIỜ mô phỏng. Chép sang thang
   * lần-ghé thì cả dải recency rộng 1% và nó thôi đổi được thứ hạng — xem khối chú thích
   * ở `recall.RECENCY_DECAY`. Lưới này canh để không ai "sửa lại cho đúng bài báo".
   */
  assert.equal(RECENCY_DECAY, 0.88);
  assert.ok(Math.pow(RECENCY_DECAY, 5) < 0.6, "5 lần ghé phải mờ đi thấy rõ");
});

test("R-6 `worthMentioning` chặn chuyện vặt khỏi lọt ra giữa buổi bán", () => {
  const vat = withMem([["FLOURISH", 12]], 30, 2);   // nhẹ nhất bảng, và từ bốn tuần trước
  const r = retrieve(vat, P(), 30, new Set());
  assert.ok(r.length === 0 || !worthMentioning(r[0]), "một cái gói đẹp bốn tuần trước không phải chuyện để mở lời");
  const nang = withMem([["WRONG_NAME", 90]], 11);
  assert.ok(worthMentioning(retrieve(nang, P(), 11, new Set())[0]), "gọi lộn tên thì đáng nhắc");
});

test("R-7 `{m.what}` có bản dịch cho MỌI kind — không có chỗ nào ra chữ trống", () => {
  const KINDS = ["WRONG_NAME", "MADE_THEM_WAIT", "BURNT_OR_COLD", "DROPPED_FOOD", "ORDER_DEFECT",
    "DIRTY_HANDS", "RUDE_TO_THEM", "BROKEN_PROMISE", "MISSED_EXTRA", "REMEMBERED_USUAL",
    "REMEMBERED_STORY", "CARED_FOR_THEM", "FREE_EXTRA", "FLOURISH"] as const;
  for (const k of KINDS) {
    const r = retrieve(withMem([[k, 70]]), P(), 10, new Set())[0];
    assert.ok(r, `${k}: không truy hồi được`);
    assert.ok(r.what.length > 4 && r.what !== "chuyện bữa trước", `${k}: rơi về chữ dự phòng`);
  }
});

// ──────────────────────────────── hồ sơ giao tiếp (P2-09 §2.8)

test("R-8 cả 12 người có tên đều có hồ sơ — không ai bị bỏ quên", () => {
  const ids = NPCS.map((n) => n.id);
  assert.deepEqual([...ids].sort(), [...PROFILE_IDS].sort());
});

test("R-9 hồ sơ ĐỔI được cách nhớ — chị Lan và bé Su không bao giờ giống nhau", () => {
  const lan = profileOf("CHI_LAN")!, su = profileOf("BE_SU")!;
  assert.ok(su.mem.recency > lan.mem.recency, "bé Su nhớ theo cái mới");
  assert.ok(lan.mem.importance > su.mem.importance, "chị Lan nhớ theo cái nặng");
  // ông Hải nóng tính ⇒ BỎ nấc nhắc, nói nặng luôn
  assert.equal(profileOf("ONG_HAI")!.breakPromise[0], 0);
  assert.ok(profileOf("BE_SU")!.breakPromise[0] > 0, "con nít thì nhắc trước đã");
});

test("R-10 người KHÔNG CÓ TÊN không có hồ sơ — và đó là đúng", () => {
  /**
   * `memKey` của họ dùng chung cho tám dáng người suốt cả mùa, nên một hồ sơ riêng ở đó
   * là một hồ sơ nói về tám người khác nhau. Họ rơi về bộ suy từ tính cách.
   */
  assert.equal(profileOf("walkin3"), null);
  assert.equal(profileOf(null), null);
  assert.deepEqual(memWeights("walkin3", P({ deTha: 0.9 })), weightsOf(P({ deTha: 0.9 })));
  assert.deepEqual(memWeights("CHI_LAN", P()), profileOf("CHI_LAN")!.mem);
});
