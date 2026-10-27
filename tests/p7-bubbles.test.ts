/**
 * HIỂN THỊ BONG BÓNG THOẠI — ba lỗi người chơi báo, dựng thành lưới.
 *
 *  1. chữ trôi quá nhanh, không kịp đọc
 *  2. bong bóng lệch khỏi đầu người nói
 *  3. bong bóng che mất chỗ người chơi đang làm
 *
 * Phần chọn chỗ đặt là hàm thuần (`bubbleX`) để test không cần Phaser.
 */
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import assert from "node:assert/strict";
import {
  BUBBLE_MAX_SEC, BUBBLE_MIN_SEC, NOTICE_SEC, READ_CPS, bubbleLife, offerBubbleLife,
} from "../src/sim/service";
import { bubbleX, TAIL_INSET, type Box } from "../src/world/bubbleLayout";

const dir = new URL("../src/content/rules/", import.meta.url);
const BARKS: string[] = [];
for (const f of (await readdir(dir)).filter((x) => x.endsWith(".json") && !x.startsWith("_"))) {
  const j = JSON.parse(await readFile(new URL(f, dir), "utf8")) as { rules?: { say?: string[] }[] };
  for (const r of j.rules ?? []) for (const v of r.say ?? []) BARKS.push(v);
}

// ───────────────────────────────────────────── B — kịp đọc không (lỗi #1)

test("B-1 trần tuổi thọ KHÔNG được cắt cụt dòng nào — và không ai viết dòng dài quá mức", () => {
  /**
   * Công thức cũ `clamp(1,6 + 0,045·ký tự, 1,6 … 4,5)` ngầm giả định ~18 ký tự/giây:
   * tốc độ đọc thầm khi đang tập trung hoàn toàn. Nhưng lúc một câu bark nổ ra thì người
   * chơi đang bận hai tay. Ở 10 ký tự/giây, 238/425 dòng (56%) không kịp đọc.
   *
   * Hai đầu phải giữ cùng lúc, nếu không thì công thức tự mâu thuẫn: trần phải đủ cao để
   * không xén dòng nào, VÀ nội dung không được dài quá cái trần đó.
   */
  assert.ok(BARKS.length > 300, `mới đọc được ${BARKS.length} dòng bark`);
  const maxChars = Math.floor((BUBBLE_MAX_SEC - NOTICE_SEC) * READ_CPS);
  for (const line of BARKS) {
    assert.ok(line.length <= maxChars,
      `dòng ${line.length} ký tự vượt trần ${maxChars} — cắt ngắn đi, đừng nới trần: "${line}"`);
    assert.ok(bubbleLife(line) >= NOTICE_SEC + line.length / READ_CPS - 1e-9,
      `trần cắt cụt dòng này: "${line}"`);
  }
});

test("B-2 mọi dòng đọc kịp ở tốc độ của người ĐANG BẬN TAY, không phải người đang đọc sách", () => {
  for (const cps of [10, 11, 12]) {
    const bad = BARKS.filter((s) => s.length / cps > bubbleLife(s));
    assert.equal(bad.length, 0,
      `ở ${cps} ký tự/giây còn ${bad.length}/${BARKS.length} dòng không kịp đọc, ví dụ: "${bad[0]}"`);
  }
});

test("B-3 câu ngắn vẫn phải có thời gian NHẬN RA — không ai đọc được thứ mình chưa thấy", () => {
  assert.ok(bubbleLife("Ờ.") >= BUBBLE_MIN_SEC, "câu hai chữ trôi trước khi người chơi kịp ngẩng lên");
  assert.ok(NOTICE_SEC > 0, "công thức không trả cho quãng rời mắt khỏi việc đang làm");
});

test("B-4 người đọc chậm được thêm giờ — cỡ chữ lớn / không giới hạn thời gian (CANON §15)", () => {
  const line = BARKS.reduce((a, b) => (a.length > b.length ? a : b));
  assert.ok(bubbleLife(line, 1.5) > bubbleLife(line, 1), "hệ số đọc chậm không có tác dụng");
  assert.ok(offerBubbleLife(line, 1.5) > offerBubbleLife(line, 1));
  assert.ok(offerBubbleLife(line) > bubbleLife(line));
});

// ─────────────────────────────── C — bám đầu, không che lò (lỗi #2, #3)

const V = { left: 0, right: 800 };
const W = 190, H = 54;
const ask = (x: number, y = 300) => ({ x, y, w: W, h: H });
const onHead = (cx: number, x: number) => Math.abs(cx - x) <= W / 2 - TAIL_INSET + 1e-9;

test("C-1 không vướng gì thì nằm ngay giữa đỉnh đầu", () => {
  assert.equal(bubbleX(ask(400), V), 400);
});

test("C-2 sát mép khung thì dạt vào trong, ra khỏi khung thì đi theo người", () => {
  const edge = bubbleX(ask(80), V);
  assert.ok(edge - W / 2 >= V.left, `lòi ra mép trái: ${edge}`);
  assert.ok(onHead(edge, 80));
  assert.ok(onHead(bubbleX(ask(-300), V), -300), "bị kẹp lại trong khung, bỏ người nói");
});

test("C-3 tránh vòng lò mà vẫn trên đầu", () => {
  // Che vòng độ giòn lúc ổ sắp sém là mất thứ duy nhất báo nó sắp cháy (CANON T5).
  const oven: Box = { x0: 290, x1: 370, y0: 214, y1: 290 };
  const cx = bubbleX(ask(400), V, [oven]);
  assert.ok(cx - W / 2 >= oven.x1, `vẫn đè lò: ${cx}`);
  assert.ok(onHead(cx, 400));
});

test("C-4 không né được lò thì vẫn trên đầu", () => {
  const wall: Box = { x0: 0, x1: 800, y0: 0, y1: 310 };
  assert.equal(bubbleX(ask(400), V, [wall]), 400);
});

// ──────────────────── D — thẻ trò chuyện không được NHẢY giữa hai nhịp

import { placeTalkCard, CARD_EDGE, type CardSpot } from "../src/ui/stall/talkCardLayout";

const SCREEN = { w: 1024, h: 576 };

test("D-1 thẻ neo bằng MÉP TRÊN — nhịp dày hơn thì dài thêm xuống, không đẩy mép trên đi", () => {
  /**
   * Lỗi người chơi báo: "nó nhảy lên trên rồi mới nhảy xuống". Chiều cao thẻ đổi theo
   * TỪNG NHỊP (câu đáp dài ngắn khác nhau, số lựa chọn khác nhau). Neo bằng TÂM thì mỗi
   * lần vẽ lại, cả mép trên lẫn mép dưới cùng xê dịch.
   */
  const a = { x: 300, y: 200 };
  const thin = placeTalkCard(null, a, { w: 310, h: 140 }, SCREEN);
  const thick = placeTalkCard(null, a, { w: 310, h: 240 }, SCREEN);
  assert.equal(thin.top, thick.top, "chiều cao đổi mà mép trên cũng đổi theo");
});

test("D-2 chốt chỗ rồi thì ĐI MỘT CHIỀU — không bao giờ tụt lại", () => {
  /**
   * Nửa sau của cái nhảy: nhịp dày chạm mép dưới màn hình thì cú kẹp đẩy thẻ LÊN, rồi
   * nhịp sau mỏng lại nó RƠI XUỐNG. Neo mép trên thôi chưa chặn được chuyện này.
   */
  const a = { x: 300, y: 500 };
  let spot: CardSpot = placeTalkCard(null, a, { w: 310, h: 120 }, SCREEN);
  const first = spot.top;
  spot = placeTalkCard(spot, a, { w: 310, h: 300 }, SCREEN);
  const lifted = spot.top;
  assert.ok(lifted < first, "nhịp dày chạm mép dưới mà thẻ không trồi lên để đủ chỗ");
  spot = placeTalkCard(spot, a, { w: 310, h: 120 }, SCREEN);
  assert.equal(spot.top, lifted, "thẻ tụt xuống lại — đúng nửa sau của cái nhảy");
});

test("D-3 trong một cuộc, thẻ đứng yên dù điểm neo nhúc nhích", () => {
  let spot = placeTalkCard(null, { x: 300, y: 200 }, { w: 310, h: 180 }, SCREEN);
  const t0 = { ...spot };
  spot = placeTalkCard(spot, { x: 480, y: 330 }, { w: 310, h: 180 }, SCREEN);
  assert.deepEqual(spot, t0, "thẻ chạy theo người nói giữa hai nhịp");
});

test("D-4 thẻ không bao giờ tràn khỏi màn hình, neo ở đâu cũng vậy", () => {
  for (const a of [{ x: 0, y: 0 }, { x: 1024, y: 576 }, { x: -200, y: 900 }, { x: 512, y: 288 }]) {
    for (const h of [120, 300, 460]) {
      const s = placeTalkCard(null, a, { w: 310, h }, SCREEN);
      assert.ok(s.top >= CARD_EDGE, `neo (${a.x},${a.y}) h=${h}: lòi lên trên (${s.top})`);
      assert.ok(s.top + h <= SCREEN.h - CARD_EDGE, `neo (${a.x},${a.y}) h=${h}: lòi xuống dưới`);
      assert.ok(s.cx - 155 >= CARD_EDGE && s.cx + 155 <= SCREEN.w - CARD_EDGE, "lòi ngang");
    }
  }
});

test("D-5 thẻ đặt BÊN CẠNH người nói, không đè lên họ", () => {
  const a = { x: 300, y: 250 };
  const s = placeTalkCard(null, a, { w: 310, h: 180 }, SCREEN);
  assert.ok(Math.abs(s.cx - a.x) >= 150, `thẻ nằm đè lên người nói: cx=${s.cx}, người ở ${a.x}`);
});

// ─────────────────── E — lịch nói: không câu nào bị nuốt, không câu nào bị bỏ quên

import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import {
  BARGE_IN_PRI, BARGE_IN_SEC, HOLD_MAX_SEC, SAME_SPEAKER_GAP_SEC, Service,
} from "../src/sim/service";
import { Customer } from "../src/sim/customer";

/**
 * Lỗi người chơi báo: "lâu lâu không hiện hội thoại NPC, phía lịch sử thoại vẫn thấy
 * thoại."
 *
 * Nguyên nhân: cái gác bong bóng trong `tickDialog` đếm `x !== p.c` — nó thấy mọi người
 * KHÁC đang nói, mà không thấy chính người sắp nói. Nên hai câu liền của cùng một người
 * được thả ra hai frame liên tiếp, và `speak()` ghi đè thẳng lên `c.say`: câu trước sống
 * đúng một frame rồi biến mất. Dòng nhật ký thì vẫn được đẩy ra ngay dưới đó, không phụ
 * thuộc bong bóng sống được bao lâu — nên lịch sử có đủ còn màn hình thì không.
 *
 * Bài này bọc `Customer.speak` để bắt đúng cái khoảnh khắc ghi đè, rồi chạy bot mấy ngày.
 */
const SEASON = 40;

test("E-1 không câu nào bị câu sau đè lên trước khi kịp đọc", () => {
  const stomps: string[] = [];
  const orig = Customer.prototype.speak;
  (Customer.prototype as unknown as { speak: typeof orig }).speak =
    function (this: Customer, text: string, seconds = 3.2, pri = 100) {
      if (this.say !== null && this.sayFor > 0 && this.saidFor < BARGE_IN_SEC) {
        stomps.push(`"${this.say}" (mới ${this.saidFor.toFixed(2)}s) ⟵ "${text}"`);
      }
      return orig.call(this, text, seconds, pri);
    };
  try {
    /*
     * Cả MÙA, không phải ba ngày — lỗ hổng thứ hai ("trần cứng vượt mặt sàn đọc") chỉ
     * nổ 22 lần trong 40 ngày, tức mười ngày đầu sạch trơn. Một bài chỉ chạy ba ngày là
     * một bài nói "không thấy gì" rồi để lỗi đi qua. 40 ngày bot ≈ 5 giây.
     */
    const w = newGame("t", "bubbles-E1");
    const bus = new Bus(false);
    for (let d = 1; d <= SEASON; d++) {
      if (d > 1) nextDay(w);
      const h = new HeadlessStall(w, POLICIES.greedy, { bus });
      h.run({});
      h.close();
    }
  } finally {
    (Customer.prototype as unknown as { speak: typeof orig }).speak = orig;
  }
  assert.equal(stomps.length, 0, `câu bị nuốt:\n  ${stomps.slice(0, 5).join("\n  ")}`);
});

test("E-2 một người nói MỘT câu một lúc — câu sau đợi, và đợi có trần", () => {
  /**
   * Ba luật của `Service.speechBlocked`, kiểm thẳng trên hàm:
   *  · đang nói → câu sau đợi
   *  · quan trọng hơn HẲN (`BARGE_IN_PRI`) và câu cũ đã đọc được → cắt ngang
   *  · đợi quá `HOLD_MAX_SEC` → chen lên, KHÔNG bị bỏ (người nói sắp quay lưng đi)
   */
  const blocked = (c: Customer, p: { pri: number; held: number }) =>
    (Service.prototype as unknown as {
      speechBlocked(this: { deps: { readMul: number } }, p: unknown): boolean;
    }).speechBlocked.call({ deps: { readMul: 1 } }, { c, ...p });

  const c = { say: "đang nói", sayFor: 5, sayPri: 55, saidFor: 0.1, sayQuietFor: 0, speaking: true } as Customer;
  assert.equal(blocked(c, { pri: 55, held: 0 }), true, "câu sau chen ngang ngay — đúng cái lỗi E-1");
  assert.equal(blocked(c, { pri: 90, held: 0 }), true, "cắt ngang khi câu cũ còn chưa kịp thấy");

  (c as { saidFor: number }).saidFor = BARGE_IN_SEC + 0.1;
  assert.equal(blocked(c, { pri: 55 + BARGE_IN_PRI, held: 0 }), false, "chuyện của ổ bánh phải cắt được chuyện phiếm");
  assert.equal(blocked(c, { pri: 56, held: 0 }), true, "hơn một điểm mà cũng cắt — thành ra ai cũng cắt được ai");

  assert.equal(blocked(c, { pri: 20, held: HOLD_MAX_SEC + 0.1 }), false,
    "đợi quá trần vẫn không được nói — câu này sẽ chết theo người nói lúc họ quay lưng");

  (c as { saidFor: number }).saidFor = 0.1;
  assert.equal(blocked(c, { pri: 20, held: HOLD_MAX_SEC + 99 }), true,
    "đợi lâu rồi thì được đè lên cả câu chưa ai kịp thấy");
  assert.equal(blocked(c, { pri: 55 + BARGE_IN_PRI, held: 0 }), true,
    "quan trọng hơn hẳn thì được đè lên cả câu chưa ai kịp thấy");

  const done = { say: null, sayFor: 0, sayPri: 55, saidFor: 5, sayQuietFor: 0.1, speaking: false } as unknown as Customer;
  assert.equal(blocked(done, { pri: 55, held: 0 }), true);
  (done as { sayQuietFor: number }).sayQuietFor = SAME_SPEAKER_GAP_SEC + 0.01;
  assert.equal(blocked(done, { pri: 55, held: 0 }), false);
});

// ───────── F — thẻ trò chuyện: chọn lời thoại xong thì PHẢI có bong bóng

/**
 * Lỗi người chơi báo, lần hai: "bắt chuyện với người khác rồi chọn lời thoại — không
 * hiện bóng lời thoại, mà lịch sử thoại vẫn thấy câu đó."
 *
 * Nhịp CUỐI của một cuộc (`r.done`) gọi `endTalk()` ngay bên trong `chooseTalk`, nên
 * `talkWith` đã là `null` lúc `StallScene` đưa câu đáp ra bằng `talkPartnerSpeak` —
 * và hàm đó viết `talkWith?.speak(...)`, dấu `?.` nuốt gọn. Dòng nhật ký thì đã được
 * `chooseTalk` đẩy vào `out` TRƯỚC đó, nên lịch sử có đủ còn trên đầu người ta trống
 * trơn. Cuộc `qua-duong` chỉ một hai nhịp ⇒ nhịp cuối cũng là nhịp đầu: bấm một câu
 * rồi không thấy gì hết.
 *
 * Bài này đi đúng đường của scene: `openTalk` → `chooseTalk` → `talkPartnerSpeak`.
 */
test("F-1 câu đáp của nhịp CUỐI vẫn lên bong bóng — không chỉ vào lịch sử thoại", async () => {
  const w = newGame("t", "bubbles-F1");
  w.progress.dayIndex = 10;
  const h = new HeadlessStall(w, POLICIES.greedy, { bus: new Bus(false) });
  await h.service.talks.ensure("QUA_DUONG");

  const checked: { line: string; said: string | null; last: boolean }[] = [];
  h.run({
    inject: (_t, x) => {
      if (checked.length >= 4) return;
      const sv = x.service;
      const near = sv.customers.find((p) => !p.say && !p.pass?.until);
      if (!near) return;
      sv.playerAt = { x: near.x + 0.5, y: near.y };
      if (!sv.openTalk()) return;
      const who = sv.talkingTo;
      if (!who) return;
      for (let depth = 0; depth < 8; depth++) {
        const next = sv.chooseTalk(0);
        if (!next) break;
        if (next.line) {
          sv.talkPartnerSpeak("…", 1.2);
          sv.talkPartnerSpeak(next.line, bubbleLife(next.line));
          if (sv.customers.includes(who)) checked.push({ line: next.line, said: who.say, last: next.done });
        }
        if (next.done) break;
      }
      sv.closeTalk();
    },
  });

  assert.ok(checked.some((k) => k.last),
    "không dựng được NHỊP CUỐI nào để kiểm — bài này không kiểm được gì");
  for (const k of checked) {
    assert.equal(k.said, k.line,
      `câu "${k.line}"${k.last ? " (nhịp cuối)" : ""} vào lịch sử thoại mà không lên bong bóng`);
  }
});
