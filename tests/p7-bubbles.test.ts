/**
 * HIỂN THỊ BONG BÓNG THOẠI — ba lỗi người chơi báo, dựng thành lưới.
 *
 *  1. chữ trôi quá nhanh, không kịp đọc
 *  2. khách xếp hàng cạnh nhau thì bong bóng chồng lên nhau
 *  3. bong bóng che mất chỗ người chơi đang làm
 *
 * Phần chọn chỗ đặt đã được tách thành hàm THUẦN (`pickBubbleSpot`) đúng để test được
 * mà không cần dựng Phaser — cái bug ở đó là bug thứ tự, và thứ tự thì kiểm bằng số.
 */
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import assert from "node:assert/strict";
import {
  BUBBLE_MAX_SEC, BUBBLE_MIN_SEC, NOTICE_SEC, READ_CPS, bubbleLife, offerBubbleLife,
} from "../src/sim/service";
import { pickBubbleSpot } from "../src/world/bubbleLayout";

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
  // Lời bắt chuyện LUÔN sống lâu hơn bark cùng độ dài: nó mở ra một việc phải làm, và
  // bỏ lỡ nó thì `leave()` tính giá.
  assert.ok(offerBubbleLife(line) > bubbleLife(line));
});

// ────────────────────────────────── C — chồng lấn & che quầy (lỗi #2, #3)

const V = { left: 0, right: 800, top: 0, bottom: 450 };
const SIZE = { w: 190, h: 54 };
const boxAt = (x: number, y: number, w = SIZE.w, h = SIZE.h) =>
  ({ x0: x - w / 2, x1: x + w / 2, y0: y - h / 2, y1: y + h / 2 });
const hit = (a: ReturnType<typeof boxAt>, b: ReturnType<typeof boxAt>) =>
  a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

test("C-1 hai người đứng cạnh nhau: bong bóng KHÔNG chồng nhau", () => {
  /**
   * Hai chỗ đứng cạnh nhau cách nhau đúng 24 px theo chiều dọc màn hình (Δx 1,5 ô ⇒
   * Δsy = 1,5 × 16), mà một bong bóng hai dòng cao ~54 px. Chồng nhau là HÌNH HỌC,
   * không phải xui — chờ may là không bao giờ hết.
   */
  const first = boxAt(400, 300);
  const spot = pickBubbleSpot({ x: 448, y: 276 }, SIZE, V, [first]);
  assert.ok(!hit(boxAt(spot.x, spot.y), first),
    `vẫn chồng: bong bóng sau ở (${spot.x}, ${spot.y})`);
});

test("C-2 chạm MÉP TRÊN khung nhìn vẫn phải né được — đây đúng là chỗ bản cũ gãy", () => {
  /**
   * Bản cũ né chồng lấn XONG MỚI kẹp vào mép khung nhìn, nên cú kẹp đẩy ngược cái vừa
   * được nâng lên xuống lại — đúng vào cái nó vừa tránh. Ở quầy thì bong bóng chạm mép
   * trên là chuyện thường, nên lỗi này nổ gần như mỗi lần hai người cùng nói.
   */
  const first = boxAt(400, 40);
  const spot = pickBubbleSpot({ x: 420, y: 30 }, SIZE, V, [first]);
  const got = boxAt(spot.x, spot.y);
  assert.ok(got.y0 >= V.top, `bong bóng lòi lên trên mép khung nhìn: y0 = ${got.y0}`);
  assert.ok(!hit(got, first), `kẹp vào mép rồi chồng trở lại: (${spot.x}, ${spot.y})`);
});

test("C-3 không bao giờ ra khỏi khung nhìn, dù bị đẩy đi đâu", () => {
  const taken = [boxAt(400, 300), boxAt(400, 240), boxAt(400, 180)];
  for (const [cx, cy] of [[400, 300], [5, 5], [795, 445], [400, -100]] as const) {
    const spot = pickBubbleSpot({ x: cx, y: cy }, SIZE, V, taken);
    const g = boxAt(spot.x, spot.y);
    assert.ok(g.x0 >= V.left && g.x1 <= V.right && g.y0 >= V.top && g.y1 <= V.bottom,
      `từ (${cx}, ${cy}) ra ngoài khung: ${JSON.stringify(g)}`);
  }
});

test("C-4 tránh chỗ người chơi đang cần nhìn — và tránh nó NẶNG HƠN tránh nhau", () => {
  /**
   * Che cái lò lúc trong lò trống chỉ là che một bức hình; che đúng cái vòng độ giòn lúc
   * ổ sắp sém là lấy mất thứ duy nhất báo nó sắp cháy — CANON T5 nói rủi ro phải đọc
   * được TRƯỚC khi hỏng.
   */
  const oven = boxAt(400, 200, 92, 76);
  const spot = pickBubbleSpot({ x: 400, y: 200 }, SIZE, V, [], [oven]);
  assert.ok(!hit(boxAt(spot.x, spot.y), oven), `vẫn đè lên lò: (${spot.x}, ${spot.y})`);

  // Khi buộc phải chọn, thà chồng lên một bong bóng khác còn hơn che mất cái lò.
  const other = boxAt(400, 140);
  const s2 = pickBubbleSpot({ x: 400, y: 200 }, SIZE, V, [other], [oven]);
  assert.ok(!hit(boxAt(s2.x, s2.y), oven), "ưu tiên sai: che lò để né một bong bóng");
});

test("C-6 đã dời đi rồi thì ĐỨNG YÊN — chỗ cũ còn sạch là không được nhảy đi đâu nữa", () => {
  /**
   * Lỗi người chơi báo: "npc nói chuyện lúc đứng ở quầy hàng hiển thị hội thoại bay lung
   * tung hết". `keepOut` là ĐỘNG — nó gồm trạm người chơi đang đứng cạnh, mà người chơi
   * thì bước dọc quầy. Mỗi lần nó đổi, hàm này lại chọn ra một chỗ sạch KHÁC.
   *
   * Nên chỗ frame trước được thử TRƯỚC: còn sạch thì giữ nguyên, bất kể lúc này có chỗ
   * nào khác cũng sạch.
   */
  const blocker = boxAt(400, 300);
  const lifted = pickBubbleSpot({ x: 400, y: 300 }, SIZE, V, [blocker]);
  const prev = { dx: lifted.x - 400, dy: lifted.y - 300 };
  assert.notEqual(prev.dy, 0, "chưa bị đẩy đi đâu thì test này không kiểm được gì");

  // Vật cản biến mất: "đúng chỗ" giờ sạch, nhưng bong bóng KHÔNG được rơi về đó giữa câu.
  const again = pickBubbleSpot({ x: 400, y: 300 }, SIZE, V, [], [], prev);
  assert.deepEqual(again, lifted, "vật cản vừa hết là bong bóng nhảy ngay về chỗ cũ");
});

test("C-7 nhưng dính KHÔNG phải dán chết: chỗ cũ bị chặn thì vẫn phải dời đi", () => {
  /**
   * Nửa còn lại. Dính bằng 0 điểm xấu là dính vĩnh viễn — che mất cái vòng độ giòn lúc ổ
   * sắp cháy thì không gì gỡ được nữa, mà đó đúng là thứ `keepOut` sinh ra để tránh.
   */
  const oven = boxAt(400, 200, 92, 76);
  const prev = { dx: 0, dy: 0 };                      // đang ở đúng đầu người nói…
  const spot = pickBubbleSpot({ x: 400, y: 200 }, SIZE, V, [], [oven], prev);
  assert.ok(!hit(boxAt(spot.x, spot.y), oven), `dính chết vào chỗ che lò: (${spot.x}, ${spot.y})`);

  // …và cả khi chỗ cũ là một chỗ ĐÃ BỊ ĐẨY, nó vẫn phải nhường khi bị chặn hẳn.
  const wall = boxAt(400, 140);
  const s2 = pickBubbleSpot({ x: 400, y: 200 }, SIZE, V, [wall], [oven], { dx: 0, dy: -60 });
  assert.ok(!hit(boxAt(s2.x, s2.y), oven), "ưu ái chỗ cũ tới mức che mất cái lò");
});

test("C-5 không có chỗ nào sạch thì vẫn phải trả về một chỗ TRONG khung, không treo máy", () => {
  const wall = Array.from({ length: 9 }, (_, i) => boxAt(400, 30 + i * 50));
  const spot = pickBubbleSpot({ x: 400, y: 300 }, SIZE, V, wall);
  const g = boxAt(spot.x, spot.y);
  assert.ok(Number.isFinite(spot.x) && Number.isFinite(spot.y), "trả về toạ độ không hợp lệ");
  assert.ok(g.x0 >= V.left && g.x1 <= V.right, "chen chúc xong thì văng ra ngoài khung");
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
  const a = { x: 300, y: 500 };                       // sát mép dưới
  let spot: CardSpot = placeTalkCard(null, a, { w: 310, h: 120 }, SCREEN);
  const first = spot.top;
  spot = placeTalkCard(spot, a, { w: 310, h: 300 }, SCREEN);   // nhịp dày: phải trồi lên
  const lifted = spot.top;
  assert.ok(lifted < first, "nhịp dày chạm mép dưới mà thẻ không trồi lên để đủ chỗ");
  spot = placeTalkCard(spot, a, { w: 310, h: 120 }, SCREEN);   // nhịp mỏng: KHÔNG được rơi
  assert.equal(spot.top, lifted, "thẻ tụt xuống lại — đúng nửa sau của cái nhảy");
});

test("D-3 trong một cuộc, thẻ đứng yên dù điểm neo nhúc nhích", () => {
  // Người nói nhích chân, camera trượt — thẻ của CÙNG một cuộc không được chạy theo.
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
      // Chỉ tính là NUỐT khi câu cũ chưa kịp nằm đủ lâu để đọc — cắt ngang có luật
      // (`BARGE_IN_SEC`) là chuyện được phép, xem E-2.
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

  // …nhưng trần KHÔNG được vượt mặt cái sàn: đã đợi quá lâu cũng không cho đè lên một
  // câu vừa mới hiện ra. Để trần lên trước là đẻ lại đúng lỗi E-1 ở một cửa khác.
  (c as { saidFor: number }).saidFor = 0.1;
  assert.equal(blocked(c, { pri: 20, held: HOLD_MAX_SEC + 99 }), true,
    "đợi lâu rồi thì được đè lên cả câu chưa ai kịp thấy");
  assert.equal(blocked(c, { pri: 55 + BARGE_IN_PRI, held: 0 }), true,
    "quan trọng hơn hẳn thì được đè lên cả câu chưa ai kịp thấy");

  // Nói xong rồi: còn một hơi thở trước câu kế, nếu không thì mắt đọc ra là MỘT bong
  // bóng đổi chữ chứ không phải hai câu nói.
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
      // Ai THẬT SỰ đang nói chuyện — `openTalk` tự chọn người theo luật của nó, không
      // nhất thiết là người mình vừa đứng cạnh. Phải chụp TRƯỚC nhịp đầu: nhịp cuối
      // xoá `talkWith` đi, mà đó đúng là nhịp bài này cần soi.
      const who = sv.talkingTo;
      if (!who) return;
      for (let depth = 0; depth < 8; depth++) {
        const next = sv.chooseTalk(0);
        if (!next) break;
        if (next.line) {
          // Đúng cái `StallScene.advanceTalk` làm: ba chấm "đang nhập", rồi câu đáp.
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
