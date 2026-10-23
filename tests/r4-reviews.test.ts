import { test } from "node:test";
import assert from "node:assert/strict";
import { Rng, fnv1a, splitmix32 } from "../src/core/rng";
import { newGame } from "../src/core/save";
import {
  FIX_WINDOW_DAYS, SICK_HARD, SICK_SOFT, SICK_WINDOW_DAYS,
  addReview, applyFix, attpCheck, average, dueReviews, enqueue, fixable, flushQueue,
  markShutdown, reply, rollReview, sickWindow, spread, starsOf, type ServeRecord,
} from "../src/sim/reviews";
import { reviewText } from "../src/sim/reviewText";

const rng = (s: string) => new Rng(splitmix32(fnv1a(s)));

const rec = (o: Partial<ServeRecord> = {}): ServeRecord => ({
  mon: "opla", who: "Khách", silentScore: 0, sat: 0.8, pricePick: 1, waitStage: 0, sick: false, defect: null, ...o,
});

test("sao: ổ sạch được sao cao, lỗi càng nặng sao càng tụt, đau bụng luôn 1–2★", () => {
  const clean = starsOf(rec(), rng("a"));
  const sloppy = starsOf(rec({ silentScore: 60 }), rng("a"));
  assert.ok(clean >= 4, `ổ sạch phải ≥4★, ra ${clean}`);
  assert.ok(sloppy < clean);
  for (const s of ["x", "y", "z", "w"]) {
    const st = starsOf(rec({ sick: true }), rng(s));
    assert.ok(st === 1 || st === 2, `đau bụng phải 1–2★, ra ${st}`);
  }
});

test("sao: giá rẻ cộng điểm, giá đắt trừ điểm, chờ lâu trừ điểm", () => {
  // `silentScore` kéo điểm nền xuống giữa thang, không thì mọi mốc giá đều chạm trần 5★.
  const avg = (o: Partial<ServeRecord>) => {
    let s = 0;
    for (let i = 0; i < 400; i++) s += starsOf(rec({ silentScore: 45, ...o }), rng(`p${i}`));
    return s / 400;
  };
  assert.ok(avg({ pricePick: 0 }) > avg({ pricePick: 1 }));
  assert.ok(avg({ pricePick: 1 }) > avg({ pricePick: 2 }));
  assert.ok(avg({ waitStage: 3 }) < avg({ waitStage: 0 }));
});

test("không phải lượt nào cũng thành đánh giá, và đánh giá hẹn giờ mới lên app", () => {
  const w = newGame("t", "r4-1");
  let made = 0;
  for (let i = 0; i < 200; i++) {
    const p = rollReview(w, rec({ silentScore: i % 3 ? 0 : 40 }), 400);
    if (p) { made++; enqueue(w, p); assert.ok(p.at > 400, "phải trễ vài phút"); }
  }
  assert.ok(made > 20 && made < 120, `tỉ lệ viết phải ở khoảng giữa, ra ${made}/200`);
  assert.equal(w.reviews.list.length, 0, "chưa tới giờ thì chưa lên app");
  const now = dueReviews(w, 10_000);
  assert.equal(now.length, made);
  assert.equal(w.reviews.queue.length, 0);
  assert.equal(w.reviews.list.length, made);
});

test("hàng chờ không sống qua đêm", () => {
  const w = newGame("t", "r4-2");
  enqueue(w, { at: 99_999, r: { day: 1, who: "A", stars: 5, text: "ngon", food: false } });
  assert.equal(flushQueue(w).length, 1);
  assert.equal(w.reviews.queue.length, 0);
  assert.equal(w.reviews.list.length, 1);
});

test("sao trung bình và phân bố đếm đúng", () => {
  const w = newGame("t", "r4-3");
  for (const s of [5, 5, 3, 1]) addReview(w, { day: 1, who: "A", stars: s, text: "", food: false });
  assert.equal(average(w), 3.5);
  assert.deepEqual(spread(w), [1, 0, 1, 0, 2]);
});

test("Hồi Tâm: chỉ sửa đánh giá còn hạn, không phải đau bụng, chưa trả lời, và tốn một thẻ", () => {
  const w = newGame("t", "r4-4");
  w.progress.dayIndex = 10;
  w.system.fix = 1;
  const moi = addReview(w, { day: 10, who: "A", stars: 1, text: "dở", food: false });
  const cu = addReview(w, { day: 10 - FIX_WINDOW_DAYS - 1, who: "B", stars: 1, text: "dở", food: false });
  const bung = addReview(w, { day: 10, who: "C", stars: 1, text: "đau bụng", food: true });
  assert.ok(fixable(moi, 10));
  assert.ok(!fixable(cu, 10), "quá hạn thì thôi");
  assert.ok(!fixable(bung, 10), "đau bụng không sửa được");

  assert.equal(applyFix(w, cu.id, { stars: 5, text: "ngon" }), false);
  assert.equal(applyFix(w, bung.id, { stars: 5, text: "ngon" }), false);
  assert.equal(applyFix(w, moi.id, { stars: 1, text: "dở" }), false, "không đổi gì thì không mất thẻ");
  assert.equal(w.system.fix, 1);

  assert.equal(applyFix(w, moi.id, { stars: 5, text: "ngon mà" }), true);
  assert.equal(w.system.fix, 0);
  assert.equal(moi.stars, 5);
  assert.ok(moi.edited);
  assert.equal(applyFix(w, moi.id, { stars: 4, text: "x" }), false, "sửa rồi thì thôi");
});

test("trả lời: hiện dưới đánh giá, và chặn Hồi Tâm sau đó", () => {
  const w = newGame("t", "r4-5");
  w.progress.dayIndex = 3;
  const r = addReview(w, { day: 3, who: "A", stars: 2, text: "ít nhân", food: false });
  assert.equal(reply(w, r.id, "   "), false, "lời rỗng thì không gửi");
  assert.equal(reply(w, r.id, "dạ em xin lỗi chị"), true);
  assert.equal(r.reply, "dạ em xin lỗi chị");
  assert.ok(!fixable(r, 3), "trả lời rồi thì không sửa nữa");
});

test("ATTP: đếm theo cửa sổ trượt, hai ngả thua, và chốt cờ một lần", () => {
  const w = newGame("t", "r4-6");
  w.progress.dayIndex = 20;
  const bung = (n: number, day: number, stars = 1) => {
    for (let i = 0; i < n; i++) addReview(w, { day, who: "A", stars, text: "", food: true });
  };

  bung(SICK_SOFT + 1, 20);
  assert.equal(sickWindow(w), SICK_SOFT + 1);
  assert.ok(attpCheck(w).closed, "quá mốc mềm mà sao thấp thì đóng cửa");

  // Sao cao thì mốc mềm chưa giết được.
  const w2 = newGame("t", "r4-7");
  w2.progress.dayIndex = 20;
  for (let i = 0; i < SICK_SOFT + 1; i++) addReview(w2, { day: 20, who: "A", stars: 1, text: "", food: true });
  for (let i = 0; i < 300; i++) addReview(w2, { day: 20, who: "B", stars: 5, text: "", food: false });
  assert.ok(average(w2) > 3);
  assert.ok(!attpCheck(w2).closed, "sao còn cao thì mốc mềm chưa đóng cửa");

  // Mốc cứng thì sao cao cũng thua.
  for (let i = 0; i < SICK_HARD; i++) addReview(w2, { day: 20, who: "A", stars: 1, text: "", food: true });
  assert.ok(attpCheck(w2).closed, "quá mốc cứng là thua bất kể sao");

  assert.equal(markShutdown(w2), true);
  assert.equal(w2.flags.shutdown, true);
  assert.equal(w2.flags.shutdownDay, 20);
});

test("ATTP: đánh giá đau bụng cũ rơi khỏi cửa sổ", () => {
  const w = newGame("t", "r4-8");
  w.progress.dayIndex = 5;
  for (let i = 0; i < SICK_HARD + 5; i++) addReview(w, { day: 5, who: "A", stars: 1, text: "", food: true });
  assert.ok(attpCheck(w).closed);
  w.progress.dayIndex = 5 + SICK_WINDOW_DAYS + 1;
  assert.equal(sickWindow(w), 0);
  assert.ok(!attpCheck(w).closed, "qua cửa sổ thì sống lại");
});

test("lời đánh giá: có chữ, không lặp một khuôn, và chuyện nặng không chêm vế vặt", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 120; i++) {
    const t = reviewText(rng(`t${i}`), { topic: "ngon", tone: "chanthat", persona: "sinhvien", stars: 5, mon: "opla" });
    assert.ok(t.length > 0);
    seen.add(t);
  }
  assert.ok(seen.size > 20, `phải đa dạng, chỉ ra ${seen.size} câu khác nhau`);

  for (let i = 0; i < 60; i++) {
    const t = reviewText(rng(`s${i}`), { topic: "dau-bung", tone: "ham", persona: "sinhvien", stars: 1, mon: "opla" });
    assert.ok(!/chỗ để xe|rau hơi ít|chỗ đứng chật/.test(t), `đau bụng không được chêm vế vặt: ${t}`);
  }
});

test("gộp nhiều yếu tố: lời chê kéo trần sao, và chuyện nặng không thèm nhắc điểm cộng", () => {
  const w = newGame("t", "r4-9");
  w.progress.dayIndex = 4;
  const many = (o: Partial<ServeRecord>, n = 60) => {
    const out: { stars: number; text: string }[] = [];
    for (let i = 0; i < n; i++) {
      const p = rollReview(w, rec(o), 400);
      if (p) out.push({ stars: p.r.stars, text: p.r.text });
    }
    return out;
  };

  // Tay bẩn kéo trần xuống 2★ dù cho thêm nhân và mọi thứ khác đều ngon.
  for (const r of many({ gaveExtra: true, gaveTea: true, dirtyHands: true })) {
    assert.ok(r.stars <= 2, `cho thêm nhân mà không rửa tay phải ≤2★, ra ${r.stars}★: ${r.text}`);
  }

  // Rớt đất cũng vậy, và không được nhắc tới chuyện cho thêm nhân.
  for (const r of many({ gaveExtra: true, defect: "co-san" })) {
    assert.ok(r.stars <= 2, `ổ dính sạn phải ≤2★, ra ${r.stars}★`);
    assert.ok(!/cho thêm|trà đá/.test(r.text), `chuyện nặng không nhắc điểm cộng: ${r.text}`);
  }
  for (const r of many({ gaveExtra: true, gaveTea: true, sick: true })) {
    assert.ok(!/cho thêm|trà đá/.test(r.text), `đau bụng không nhắc điểm cộng: ${r.text}`);
  }

  // Đã nói ra một lời chê thì không còn là 5★.
  const mixed = many({ gaveTea: true, rain: true, defect: "it-nhan", silentScore: 20 }, 120);
  const named = mixed.filter((r) => /nhân hơi ít|nhân mỏng/.test(r.text));
  assert.ok(named.length > 0, "phải có câu gộp cả khen lẫn chê");
  for (const r of named) assert.ok(r.stars <= 4, `câu có lời chê không được 5★: ${r.text}`);

  // Toàn điểm cộng thì vẫn lên được 5★.
  assert.ok(many({ gaveTea: true, rain: true }).some((r) => r.stars === 5));
});

test("sao bám theo chất lượng thật, không chỉ nhị phân 'có lỗi vị hay không'", () => {
  const avg = (quality: number) => {
    let s = 0;
    for (let i = 0; i < 400; i++) s += starsOf(rec({ silentScore: 20, defect: "do-cu", quality }), rng(`q${i}`));
    return s / 400;
  };
  const ngon = avg(1.0), thuongCu = avg(0.874), dom = avg(0.72);
  assert.ok(ngon > thuongCu, `hàng ngon phải hơn hàng để qua đêm: ${ngon} vs ${thuongCu}`);
  assert.ok(thuongCu > dom, `hàng để qua đêm vẫn phải hơn hàng dỏm: ${thuongCu} vs ${dom}`);
  assert.ok(ngon - dom > 1, `khoảng cách ngon ↔ dỏm phải rõ, ra ${(ngon - dom).toFixed(2)} sao`);
  assert.equal(avg(0.95), avg(1.0), "hụt dưới ngưỡng thì không ai để ý");
});
