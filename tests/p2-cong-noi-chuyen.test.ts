/**
 * HAI CỔNG T2 CHẶN CUỘC SÂU — và lời giải thích cho từng cổng.
 *
 * CANON T2: trần 2 cuộc sâu/ngày, 0 trong khung PEAK. Luật đúng, nhưng trước đây cả hai
 * cổng cùng ra một câu tả cái gật ("gật đầu một cái rồi quay đi") mà không nói vì sao —
 * nên người chơi, kể cả người VIẾT RA luật đó, đọc ra là "NPC hỏng".
 *
 * File này chốt đúng một bất biến: **chặn thì phải có câu, có câu thì phải thật sự chặn.**
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { deepGateReason } from "../src/sim/service";
import { DAY_END_MIN, DAY_START_MIN, PEAK_END_MIN, PEAK_START_MIN, bandOf } from "../src/core/clock";

const CAP = "Nói nhiều rồi. Để mai đi.";
const PEAK = "Giờ này đông quá, để nói chuyện sau.";
const h = (hh: number, mm = 0) => hh * 60 + mm;
/** CANON T2 — giữ bằng tay ở đây để đổi trần trong sim là test này đỏ, không im lặng trôi qua. */
const TALK_DEEP = 2;

test("ngoài khung đông, chưa hết trần → không chặn, không nói gì", () => {
  assert.equal(deepGateReason(0, PEAK_END_MIN), null);
  assert.equal(deepGateReason(1, h(9)), null, "cuộc thứ hai vẫn phải mở được");
  assert.equal(deepGateReason(0, DAY_START_MIN), null, "mở hàng xong là nói được ngay");
});

test("trong khung đông → nói ra là đông, không phải gật suông", () => {
  for (let m = PEAK_START_MIN; m < PEAK_END_MIN; m += 10) {
    assert.equal(deepGateReason(0, m), PEAK, `${Math.floor(m / 60)}h${m % 60}`);
  }
  // Ngay mép: vào là chặn, ra là thôi.
  assert.equal(deepGateReason(0, PEAK_START_MIN - 1), null);
  assert.equal(deepGateReason(0, PEAK_END_MIN), null);
});

test("hết trần ngày → 'để mai', và nó THẮNG cả khung đông", () => {
  assert.equal(deepGateReason(2, h(9)), CAP);
  assert.equal(deepGateReason(5, h(9)), CAP);
  // Hết trần mà còn hứa "để nói chuyện sau" là hứa một thứ không có thật — chờ qua khung
  // đông cũng không nói được nữa.
  assert.equal(deepGateReason(2, PEAK_START_MIN + 10), CAP, "khung đông không được giành chỗ của trần ngày");
});

test("cả buổi bán: lúc nào cũng có câu trả lời, và nó khớp với thực tế", () => {
  for (let m = DAY_START_MIN; m < DAY_END_MIN; m += 5) {
    const peak = bandOf(m) === "PEAK";
    assert.equal(deepGateReason(0, m), peak ? PEAK : null, `chưa dùng cuộc nào, ${m}`);
    assert.equal(deepGateReason(TALK_DEEP, m), CAP, `đã hết trần, ${m}`);
  }
});

test("hai câu này không lộ cơ chế — không số, không tên luật", () => {
  for (const line of [CAP, PEAK]) {
    assert.doesNotMatch(line, /[0-9]/, `lọt con số: ${line}`);
    assert.doesNotMatch(line, /PEAK|trần|cuộc sâu|deep|cap/i, `lộ tên luật: ${line}`);
    // VAN-PHONG-UI §4: chữ của game, không đeo giọng vùng.
    assert.doesNotMatch(line, /\b(vô|hổng|hông|giùm|nghen|nha|nè|bữa|hẵng|khỏi)\b/i, `đeo giọng vùng: ${line}`);
    assert.ok(line.endsWith("."), `thiếu dấu chấm cuối câu: ${line}`);
  }
});
