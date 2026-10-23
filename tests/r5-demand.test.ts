import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { newGame, type SaveFile } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { HeadlessStall, POLICIES } from "../src/sim/headless";
import { STAR_MIN_REVIEWS, baseGuests, crowdFactor, guestsOf, recentStars } from "../src/sim/demand";
import { addReview } from "../src/sim/reviews";

const withReviews = (day: number, stars: number, n: number, from = day): SaveFile => {
  const w = newGame("t", "demand");
  w.progress.dayIndex = day;
  for (let i = 0; i < n; i++) addReview(w, { day: from, who: "x", stars, text: "", food: false });
  return w;
};

test("nền khách lên theo ngày rồi đứng ở trần — quầy không phục vụ nổi hơn", () => {
  assert.equal(baseGuests(1), baseGuests(5), "trong năm ngày đầu nền không nhích");
  assert.ok(baseGuests(6) > baseGuests(1), "qua mốc 5 ngày phải nhích một bậc");
  for (let d = 2; d <= 400; d++) assert.ok(baseGuests(d) >= baseGuests(d - 1), `tụt ở ngày ${d}`);
  assert.equal(baseGuests(400), baseGuests(200), "nền phải có trần, không leo vô hạn");
});

test("hệ số khách nội suy giữa hai mốc sao, không nhảy bậc", () => {
  assert.ok(crowdFactor(3.7) > crowdFactor(3) && crowdFactor(3.7) < crowdFactor(4), "3,7★ phải nằm giữa 3★ và 4★");
  for (let x = 1; x <= 5; x += 0.1) assert.ok(crowdFactor(x) >= crowdFactor(x - 0.1) - 1e-9, `tụt ở ${x.toFixed(1)}★`);
  assert.ok(crowdFactor(1) < crowdFactor(5) / 5, "1★ phải thưa hơn 5★ nhiều lần");
});

test("chưa đủ đánh giá thì quán chưa có tiếng: hệ số 1, không phải 0", () => {
  const w = newGame("t", "demand");
  assert.equal(recentStars(w), null);
  assert.equal(crowdFactor(null), 1);
  assert.ok(guestsOf(w) >= baseGuests(1) * 0.5, "ván mới không được rơi về một hai khách");
});

test("chỉ sao trong cửa sổ nuôi số khách — đánh giá cũ không khoá quán lại", () => {
  const w = withReviews(60, 1, 40, 2);
  assert.equal(recentStars(w), null, "đánh giá từ ngày 2 đã ra khỏi cửa sổ ngày 60");
  const nay = withReviews(60, 1, STAR_MIN_REVIEWS, 59);
  assert.equal(recentStars(nay), 1);
  assert.ok(guestsOf(nay) < guestsOf(w), "một sao gần đây phải làm khách thưa hẳn");
});

test("sao cao ra nhiều khách hơn sao thấp, cùng ngày cùng ván", () => {
  const te = guestsOf(withReviews(40, 2, 30, 39));
  const on = guestsOf(withReviews(40, 5, 30, 39));
  assert.ok(on > te * 2, `5★ ra ${on} khách mà 2★ ra ${te} — sao chưa kéo được khách`);
});

test("số khách của một ngày không đổi giữa hai lần hỏi", () => {
  const w = withReviews(12, 4, 20, 11);
  assert.equal(guestsOf(w), guestsOf(w));
});

test("buổi bán rải đúng số khách đã tính, phần khách lạ không bị khách quen ăn hết", () => {
  const w = newGame("t", "r5-sched");
  w.progress.dayIndex = 11;
  const want = guestsOf(w);
  const h = new HeadlessStall(w, POLICIES.greedy, { bus: new Bus(false), platform: memoryPlatform() });
  const sched = (h as unknown as { service: { schedule: { npc: unknown }[] } }).service.schedule;
  assert.equal(sched.length, want);
  const la = sched.filter((v) => !v.npc).length;
  assert.ok(la >= want * 0.3, `chỉ ${la}/${want} là khách lạ — khách quen chiếm hết buổi`);
});
