/**
 * Chỗ đặt dấu "việc cần làm" (`ui/chorePin`). File này tồn tại vì chỗ toán đó đã sai hai lần, và
 * cả hai lần đều do người thiết kế ngồi chơi tìm ra chứ không phải người viết code — trong scene
 * mỗi lần chạy thử chỉ nhìn được một vị trí camera, ở đây quét vài chục ngàn vị trí trong một giây.
 *
 * Mấy test dưới KHÔNG chép lại công thức: chúng viết lại ba luật ở đầu `chorePin.ts` dưới dạng
 * thứ NGƯỜI CHƠI nhìn thấy, rồi thử phá.
 *
 * ⚠️ Khung nhìn và lề lấy SỐ THẬT, không lấy số tròn (`edge` 19 · `top` 58 — hai lề lệch nhau ba
 * lần, và chính độ lệch đó đẻ ra cú nhảy 90 px của bản cũ). Gốc khung nhìn cố ý KHÔNG đặt ở
 * (0, 0): lẫn "toạ độ khung" với "toạ độ màn hình" chỉ lòi ra khi gốc khác 0.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { chorePin, type PinOpts, type ViewRect } from "../src/ui/chorePin";

/** Khung nhìn thế giới thật của `StallScene`: 1024 × 576 chia cho `ZOOM` 1,28. */
const V: ViewRect = { left: 1000, right: 1800, top: 500, bottom: 950 };
/** Lề thật: `CHORE_R + CHORE_EDGE` và `CHORE_TOP`. */
const O: PinOpts = { edge: 19, top: 58 };

/** Vùng ĐƯỢC PHÉP VẼ (khung trừ lề) — mọi kết quả đều phải nằm trong đây. */
const x0 = V.left + O.edge, x1 = V.right - O.edge;
const y0 = V.top + O.top, y1 = V.bottom - O.edge;
const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;

/** Dịch khung nhìn đi — mô phỏng camera trượt, kích thước giữ nguyên. */
function moved(dx: number, dy: number): ViewRect {
  return { left: V.left + dx, right: V.right + dx, top: V.top + dy, bottom: V.bottom + dy };
}

/** Đúng phép thử "còn thấy" mà người chơi dùng: cái việc có nằm trong KHUNG THẬT không. */
function onScreen(ax: number, ay: number, v: ViewRect) {
  return ax > v.left && ax < v.right && ay > v.top && ay < v.bottom;
}

/** Số ngẫu nhiên tất định — test phải ra y hệt nhau mọi lần chạy, kể cả lúc nó đỏ. */
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ───────────────────────────────────────────────────────────── luật 1: còn trong khung

/**
 * ĐÂY LÀ TEST QUAN TRỌNG NHẤT FILE — lần hỏng gần nhất đúng là chuyện này: cái thớt nằm chình
 * ình giữa màn hình mà dấu chấm than trôi sang ngang mấy chục pixel.
 *
 * Quét lưới dày 2 px (~19.000 vị trí), so sánh BẰNG ĐÚNG không sai số: luật nói "tuyệt đối không
 * nhúc nhích", nên nhúc nhích nửa pixel cũng là sai luật.
 */
test("việc nằm hẳn trong vùng vẽ: dấu đứng ĐÚNG trên nó, không lệch một pixel", () => {
  let n = 0;
  for (let ax = x0; ax <= x1; ax += 2) {
    for (let ay = y0; ay <= y1; ay += 2) {
      const p = chorePin(ax, ay, V, O);
      assert.equal(p.x, ax, `x lệch tại (${ax}, ${ay})`);
      assert.equal(p.y, ay, `y lệch tại (${ax}, ${ay})`);
      assert.equal(p.pinned, false, `bị coi là khuất tại (${ax}, ${ay})`);
      n++;
    }
  }
  // Chốt số điểm đã quét: nếu ai đó lỡ tay sửa bước nhảy thành 200 thì test vẫn xanh
  // mà chẳng còn kiểm gì nữa.
  assert.ok(n > 15_000, `quét quá thưa, mới ${n} điểm`);
});

/**
 * Cái lò nằm ở HÀNG TRÊN CÙNG bản đồ nên "trong khung nhưng chui dưới dải icon" là trường hợp
 * THƯỜNG NGÀY của đúng cái trạm hay cháy bánh nhất.
 *
 * Luật 1 kẹp TỪNG TRỤC RIÊNG: trục x còn nguyên chỗ thì x phải y nguyên — đẩy ngang một cái dấu
 * mà trạm của nó đang nhìn thấy rõ là nói dối người chơi về chỗ đứng.
 */
test("việc còn trong khung mà nằm dưới dải icon: chỉ bị đẩy XUỐNG, x không đổi", () => {
  for (let ax = x0; ax <= x1; ax += 3) {
    // Từ sát mép trên khung thật tới sát mép trên vùng vẽ.
    for (let ay = V.top + 0.5; ay < y0; ay += 1) {
      const p = chorePin(ax, ay, V, O);
      assert.equal(p.x, ax, `x bị đẩy tại (${ax}, ${ay})`);
      assert.equal(p.y, y0, `y không dừng đúng ở mép vùng vẽ tại (${ax}, ${ay})`);
      assert.equal(p.pinned, false, "còn trong khung mà bị tính là ghim");
    }
  }
});

/**
 * Ba lề còn lại cũng phải tách trục y hệt. Viết riêng vì ba lề này dùng `edge` (hẹp)
 * còn lề trên dùng `top` (rộng) — gộp chung một vòng lặp là che mất chuyện ai đó đổi
 * `chorePin` sang dùng một lề duy nhất cho cả bốn phía.
 */
test("ba lề trái / phải / dưới cũng kẹp tách trục", () => {
  const mid = (y0 + y1) / 2, midX = (x0 + x1) / 2;
  for (let d = 0.5; d < O.edge; d += 0.5) {
    const tr = chorePin(V.left + d, mid, V, O);
    assert.deepEqual([tr.x, tr.y, tr.pinned], [x0, mid, false]);
    const ph = chorePin(V.right - d, mid, V, O);
    assert.deepEqual([ph.x, ph.y, ph.pinned], [x1, mid, false]);
    const du = chorePin(midX, V.bottom - d, V, O);
    assert.deepEqual([du.x, du.y, du.pinned], [midX, y1, false]);
  }
});

/**
 * `pinned` không phải chi tiết nội bộ: chỗ gọi lấy nó để thu dấu nhỏ lại 0,8 lần, tức
 * nó là thứ người chơi NHÌN THẤY. Nó phải nói đúng một điều — "cái việc này đã ra khỏi
 * màn hình" — đo trên khung THẬT. Đo trên khung đã trừ lề chính là lỗi lần trước.
 */
test("cờ `pinned` đúng bằng phép thử ra-khỏi-khung-thật, không phải khung đã trừ lề", () => {
  const rnd = lcg(20251001);
  for (let i = 0; i < 20_000; i++) {
    const ax = V.left - 400 + rnd() * 1600, ay = V.top - 400 + rnd() * 1250;
    assert.equal(chorePin(ax, ay, V, O).pinned, !onScreen(ax, ay, V),
      `sai cờ tại (${ax}, ${ay})`);
  }
});

// ──────────────────────────────────────────────────────────── luật 2: ghim vào mép

/**
 * Ghim thì phải ghim ĐÚNG LÊN VIỀN: lọt vào trong viền là dấu lơ lửng giữa màn hình
 * trong khi cái việc ở tận đâu (đọc ra là "việc ở đây", sai hẳn nghĩa); ra ngoài viền
 * là dấu bị HUD che hoặc bị cắt cụt ở mép màn hình.
 */
test("việc ra hẳn ngoài khung: dấu nằm ĐÚNG trên viền vùng vẽ, không trong không ngoài", () => {
  const rnd = lcg(7);
  for (let i = 0; i < 20_000; i++) {
    // Quanh một vòng tròn bán kính lớn hơn hẳn nửa đường chéo khung -> chắc chắn khuất.
    const a = rnd() * Math.PI * 2, r = 500 + rnd() * 4000;
    const ax = cx + Math.cos(a) * r, ay = cy + Math.sin(a) * r;
    const p = chorePin(ax, ay, V, O);
    assert.equal(p.pinned, true);
    // Trong vùng vẽ (có dung sai dấu phẩy động)...
    assert.ok(p.x >= x0 - 1e-9 && p.x <= x1 + 1e-9, `x ra ngoài: ${p.x}`);
    assert.ok(p.y >= y0 - 1e-9 && p.y <= y1 + 1e-9, `y ra ngoài: ${p.y}`);
    // ...và CHẠM ít nhất một cạnh.
    const onEdge = Math.min(Math.abs(p.x - x0), Math.abs(p.x - x1),
      Math.abs(p.y - y0), Math.abs(p.y - y1));
    assert.ok(onEdge < 1e-6, `không chạm viền nào, cách ${onEdge} tại (${ax}, ${ay})`);
  }
});

/**
 * "Trạm ở hướng nào thì dấu ở đúng phía ấy" — đo TỪNG TRỤC, vì luật là MỘT phép kẹp tách trục
 * chứ không còn là phép chiếu theo tia:
 *  · việc ở bên TRÁI khung → dấu ở ĐÚNG lề trái · ở TRÊN → đúng lề trên · cả hai → đúng cái GÓC
 *  · trục nào KHÔNG bị kẹp → dấu báo ĐÚNG TOẠ ĐỘ THẬT trên trục đó, chính xác từng bit
 *
 * Vế cuối là phần phép chiếu cũ KHÔNG làm được: nó dồn mọi thứ về đường tâm nên cái lò khuất bên
 * trái bị báo sai cả độ cao. Quét kín cả chín vùng.
 */
test("ghim đúng phía theo TỪNG TRỤC, trục còn lại báo đúng toạ độ thật", () => {
  // Ba mốc cho mỗi trục: ngoài hẳn · trong khung · ngoài hẳn. Thêm vài mốc lẻ trong khung
  // để bắt chuyện kẹp lề (trong khung nhưng dưới dải icon).
  const xs = [V.left - 5000, V.left - 1, V.left, V.left + 1, x0, cx,
    x1, V.right - 1, V.right, V.right + 5000];
  const ys = [V.top - 5000, V.top - 1, V.top, V.top + 1, y0 - 1, y0, cy,
    y1, V.bottom - 1, V.bottom, V.bottom + 5000];
  for (const ax of xs) {
    for (const ay of ys) {
      const p = chorePin(ax, ay, V, O);
      const ten = `(${ax}, ${ay})`;
      // ── trục x
      if (ax <= V.left) assert.equal(p.x, x0, `${ten}: việc bên trái mà dấu không ở lề trái`);
      else if (ax >= V.right) assert.equal(p.x, x1, `${ten}: việc bên phải mà dấu không ở lề phải`);
      else if (ax >= x0 && ax <= x1) assert.equal(p.x, ax, `${ten}: x còn chỗ mà vẫn bị dời`);
      // ── trục y
      if (ay <= V.top) assert.equal(p.y, y0, `${ten}: việc ở trên mà dấu không ở lề trên`);
      else if (ay >= V.bottom) assert.equal(p.y, y1, `${ten}: việc ở dưới mà dấu không ở lề dưới`);
      else if (ay >= y0 && ay <= y1) assert.equal(p.y, ay, `${ten}: y còn chỗ mà vẫn bị dời`);
      // ── không bao giờ ghim NGƯỢC phía. Lọt cái này là người chơi chạy ngược hướng.
      if (ax <= V.left) assert.notEqual(p.x, x1, `${ten}: ghim ngược sang phải`);
      if (ax >= V.right) assert.notEqual(p.x, x0, `${ten}: ghim ngược sang trái`);
      if (ay <= V.top) assert.notEqual(p.y, y1, `${ten}: ghim ngược xuống dưới`);
      if (ay >= V.bottom) assert.notEqual(p.y, y0, `${ten}: ghim ngược lên trên`);
    }
  }
});

/**
 * HAI TRỤC RỜI NHAU HẲN — cột sống của luật mới, và là thứ bản cũ vi phạm: phép chiếu theo tia
 * lấy `t = min(...)` CHUNG cho cả hai trục nên độ cao của cái việc ảnh hưởng tới vị trí NGANG của
 * dấu, và chính cái dính líu đó đẻ ra cú nhảy 90 px.
 */
test("hai trục độc lập hoàn toàn: dời cái việc theo y không làm dấu nhúc nhích theo x", () => {
  const nhieuY = [V.top - 9000, V.top - 1, V.top + 1, y0, cy, y1, V.bottom, V.bottom + 9000];
  const nhieuX = [V.left - 9000, V.left - 1, V.left + 1, x0, cx, x1, V.right, V.right + 9000];
  for (let ax = V.left - 400; ax <= V.right + 400; ax += 7) {
    const moc = chorePin(ax, cy, V, O).x;
    for (const ay of nhieuY) {
      assert.equal(chorePin(ax, ay, V, O).x, moc, `x đổi theo y tại ax = ${ax}, ay = ${ay}`);
    }
  }
  for (let ay = V.top - 400; ay <= V.bottom + 400; ay += 7) {
    const moc = chorePin(cx, ay, V, O).y;
    for (const ax of nhieuX) {
      assert.equal(chorePin(ax, ay, V, O).y, moc, `y đổi theo x tại ay = ${ay}, ax = ${ax}`);
    }
  }
});

/**
 * Dấu đi CÙNG CHIỀU với cái việc, và KHÔNG BAO GIỜ đi nhanh hơn nó (1-Lipschitz):
 *  · cùng chiều — đẩy việc sang phải thì dấu không bao giờ nhích sang trái
 *  · không nhanh hơn — việc dời `d` px thì dấu dời nhiều nhất `d` px, tức KHÔNG BAO GIỜ CÓ CÚ
 *    NHẢY; đây là lý do mọi ngưỡng mượt ở dưới siết được xuống đúng 1 px
 *
 * Phép chiếu theo tia hỏng cả hai: gần góc khung nó khuếch đại bước đi lên ~2,04 lần.
 */
test("dấu đi cùng chiều với cái việc và không bao giờ đi nhanh hơn nó", () => {
  const rnd = lcg(5150);
  for (let i = 0; i < 30_000; i++) {
    const a = V.left - 1500 + rnd() * 3800, b = a + (rnd() - 0.5) * 600;
    const c = V.top - 1500 + rnd() * 3450, d = c + (rnd() - 0.5) * 600;
    const p = chorePin(a, c, V, O), q = chorePin(b, d, V, O);
    assert.ok(Math.sign(q.x - p.x) * Math.sign(b - a) >= 0, `x đi ngược chiều: ${a} -> ${b}`);
    assert.ok(Math.sign(q.y - p.y) * Math.sign(d - c) >= 0, `y đi ngược chiều: ${c} -> ${d}`);
    assert.ok(Math.abs(q.x - p.x) <= Math.abs(b - a) + 1e-9, `x đi nhanh hơn việc: ${a} -> ${b}`);
    assert.ok(Math.abs(q.y - p.y) <= Math.abs(d - c) + 1e-9, `y đi nhanh hơn việc: ${c} -> ${d}`);
  }
});

/**
 * Dời CẢ cái việc LẪN khung nhìn đi cùng một quãng thì dấu phải dời đúng quãng ấy — khoá chuyện
 * trong hàm không còn sót chỗ nào bám vào toạ độ TUYỆT ĐỐI. Quán nằm ở toạ độ thế giới vài ngàn,
 * mà mọi phép thử bằng mắt thì làm quanh gốc.
 */
test("dời việc và khung cùng một quãng: dấu dời đúng quãng ấy", () => {
  const rnd = lcg(31337);
  for (let i = 0; i < 20_000; i++) {
    const ax = V.left - 1200 + rnd() * 3200, ay = V.top - 1200 + rnd() * 2850;
    const dx = (rnd() - 0.5) * 20_000, dy = (rnd() - 0.5) * 20_000;
    const p = chorePin(ax, ay, V, O);
    const q = chorePin(ax + dx, ay + dy, moved(dx, dy), O);
    assert.ok(Math.abs(q.x - (p.x + dx)) < 1e-6 && Math.abs(q.y - (p.y + dy)) < 1e-6,
      `lệch khi dời (${dx}, ${dy})`);
  }
});

/**
 * Đặt lại dấu lên chính chỗ nó vừa được đặt thì nó phải đứng yên. `clamp` luỹ đẳng, nên
 * đây là phát biểu rẻ tiền mà bắt được cả một lớp lỗi: bất cứ ai sau này nối thêm một
 * bước xử lý nữa lên đầu ra (kẹp thêm lần hai, bù thêm một lề) đều rơi vào đây.
 */
test("kẹp hai lần bằng kẹp một lần — không có cú trôi tích luỹ", () => {
  const rnd = lcg(808);
  for (let i = 0; i < 20_000; i++) {
    const ax = V.left - 2000 + rnd() * 4800, ay = V.top - 2000 + rnd() * 4450;
    const p = chorePin(ax, ay, V, O);
    const q = chorePin(p.x, p.y, V, O);
    assert.deepEqual([q.x, q.y], [p.x, p.y], `trôi khi kẹp lại tại (${ax}, ${ay})`);
  }
});

// ────────────────────────────────────────────────────── luật 2: "đi một bước, bò một bước"

/**
 * Camera trượt 1 px thì dấu được phép bò ĐÚNG 1 px, không hơn một hạt bụi. Suy ra chứ không đoán:
 * dấu = `clamp(việc, lo, hi)`, camera trượt `δ` thì việc đứng yên còn `lo`/`hi` cùng dời `δ`, nên
 *
 *      dấu(δ) − dấu(0) = δ + [clamp(a−δ) − clamp(a)] ∈ [0, δ]
 *
 * Trần là ĐÚNG `δ` và chạm trần thật (lúc dấu bám lề). Bản cũ phải cho tới 2,5 px vì phép chiếu
 * theo tia khuếch đại bước đi ~2,04 lần — siết từ 2,5 xuống 1,0 chính là cái lợi đo được của lần
 * sửa này. Lần này quét CẢ LÚC CHUYỂN giữa "còn thấy" và "đã khuất".
 */
const BUOC_TOI_DA = 1.0;

test("camera trượt từng pixel thì dấu bò theo từng pixel — kể cả lúc việc vượt mép", () => {
  const rnd = lcg(1234);
  let doMaxX = 0, doMaxY = 0, soLanChuyen = 0;
  for (let lan = 0; lan < 400; lan++) {
    // Cái việc đứng yên ở một chỗ; camera trượt theo một hướng cố định suốt lượt.
    //
    // Một nửa số lượt ĐẶT CÁI VIỆC HẲN TRONG KHUNG lúc bắt đầu. Khung chỉ 800 × 450 mà
    // camera đi 600 px, nên lượt đó chắc chắn kéo cái việc vượt mép — tức chắc chắn đi
    // qua đúng chỗ bản cũ nhảy 90 px. Thả hết cho ngẫu nhiên thì phần lớn lượt nằm trọn
    // ngoài khung và phép quét chỉ kiểm lại cái quãng dễ.
    const batDauTrong = lan % 2 === 0;
    const ax = batDauTrong ? V.left + 20 + rnd() * 760 : V.left - 900 + rnd() * 2600;
    const ay = batDauTrong ? V.top + 20 + rnd() * 410 : V.top - 900 + rnd() * 2250;
    const bx = Math.round(rnd() * 2 - 1), by = Math.round(rnd() * 2 - 1);
    if (bx === 0 && by === 0) continue;
    let truoc: { x: number; y: number; pinned: boolean } | null = null;
    for (let k = 0; k < 600; k++) {
      const p = chorePin(ax, ay, moved(bx * k, by * k), O);
      if (truoc) {
        // Đo TỪNG TRỤC, so với bước camera của ĐÚNG trục đó: trục camera không trượt thì
        // dấu phải đứng im tuyệt đối. Gộp lại thành một khoảng cách Euclid là tự tay nới
        // cho mỗi trục thêm một hệ số √2 mà không nói ra.
        const dx = Math.abs(p.x - truoc.x), dy = Math.abs(p.y - truoc.y);
        doMaxX = Math.max(doMaxX, dx); doMaxY = Math.max(doMaxY, dy);
        if (p.pinned !== truoc.pinned) soLanChuyen++;
        assert.ok(dx <= Math.abs(bx) * BUOC_TOI_DA + 1e-9,
          `x giật ${dx.toFixed(4)} px cho ${bx} px camera, việc ở (${ax}, ${ay}), bước ${k}`);
        assert.ok(dy <= Math.abs(by) * BUOC_TOI_DA + 1e-9,
          `y giật ${dy.toFixed(4)} px cho ${by} px camera, việc ở (${ax}, ${ay}), bước ${k}`);
      }
      truoc = p;
    }
  }
  // Phép quét phải thật sự ĐI QUA chỗ chuyển thấy/khuất — không thì nó chỉ đang kiểm lại
  // cái quãng dễ, và cú nhảy 90 px cũ sẽ chui lọt y như lần trước.
  assert.ok(soLanChuyen > 100, `mới qua chỗ chuyển ${soLanChuyen} lần, quá ít để tin`);
  // Và phải chạm trần, không thì ngưỡng 1,0 chỉ là trang trí.
  assert.ok(doMaxX > 0.99 && doMaxY > 0.99,
    `quét chưa chạm trần: x ${doMaxX.toFixed(3)}, y ${doMaxY.toFixed(3)}`);
});

/**
 * KHÔNG ĐƯỢC LẮC: người chơi đi đều sang trái thì dấu bò đều sang phải — bò rồi giật ngược lại là
 * thứ mắt bắt được ngay ở ngoại vi và đọc ra là "màn hình bị lỗi".
 *
 * Đo theo TOẠ ĐỘ MÀN HÌNH (trừ mép khung) vì đó mới là thứ con mắt thấy. Chạy một lượt dài qua cả
 * ba giai đoạn: khuất bên phải → hiện ra → khuất bên trái.
 */
test("camera đi đều một chiều: dấu bò đều một chiều, không lắc qua lắc lại", () => {
  // Đặt cái việc đúng tầm cao tâm vùng vẽ: trục y không có gì để cãi, mọi chuyện xảy ra
  // trên trục x — đúng cái trục đang đo.
  const ay = cy;
  const ax = V.right + 500;
  let truoc = Infinity;
  for (let k = 0; k <= 1800; k++) {
    const v = moved(k, 0);
    const p = chorePin(ax, ay, v, O);
    const manHinh = p.x - v.left;
    assert.ok(manHinh <= truoc + 1e-9,
      `dấu giật NGƯỢC ở bước ${k}: ${truoc.toFixed(2)} -> ${manHinh.toFixed(2)}`);
    assert.ok(manHinh >= O.edge - 1e-9 && manHinh <= 800 - O.edge + 1e-9,
      `dấu lọt ra ngoài lề ở bước ${k}: ${manHinh}`);
    truoc = manHinh;
  }
  // Và nó phải đi hết chiều ngang, không đứng ì một chỗ.
  assert.ok(truoc < O.edge + 1e-9, `cuối lượt dấu chưa về sát mép trái: ${truoc}`);
});

/**
 * Cái việc nằm hẳn TRÊN khung, camera lia ngang qua dưới nó: trục y bị kẹp và CHỈ bị kẹp, nên dấu
 * bám đúng lề trên và ĐỨNG IM TUYỆT ĐỐI theo chiều dọc. Bản cũ chỉ dám đòi "đổi chiều nhiều nhất
 * một lần" vì phép chiếu theo tia kéo dấu dâng lên rồi hạ xuống theo góc nhìn.
 */
test("việc nằm trên đỉnh màn hình: dấu bám lề trên, đứng im theo chiều dọc", () => {
  const ax = cx + 2000, ay = V.top - 600;        // ở trên và lệch hẳn sang phải
  let truocX = Infinity;
  for (let k = 0; k <= 2600; k++) {
    const v = moved(k, 0);
    assert.equal(onScreen(ax, ay, v), false, "lượt này phải khuất suốt");
    const p = chorePin(ax, ay, v, O);
    const mx = p.x - v.left, my = p.y - v.top;
    assert.equal(my, O.top, `dấu rời lề trên ở bước ${k}`);
    assert.ok(mx <= truocX + 1e-9, `x giật ngược ở bước ${k}`);
    truocX = mx;
  }
  assert.ok(truocX < O.edge + 1e-9, `cuối lượt dấu chưa về sát mép trái: ${truocX}`);
});

// ─────────────────────────────────── chỗ nối giữa "còn thấy" và "đã ghim"

/**
 * Trần cho cú NHẢY lúc cái việc vượt mép khung — thước đo CỦA MẮT: bán kính dấu `CHORE_R` = 11,
 * nên nhảy quá một ĐƯỜNG KÍNH (22 px) là hai vòng tròn trước-sau rời hẳn nhau, đúng định nghĩa
 * "biến mất chỗ này, hiện ra chỗ kia".
 *
 * ĐÃ SỬA. Hai test dưới từng là `todo`, ghi lại lỗi thật: hai nhánh của hàm đo trên hai hình chữ
 * nhật khác nhau và không gặp nhau ở biên khung — mép TRÊN lệch tới 90,4 px, tức ~116 px thật
 * trên màn 1024 trong đúng một frame, và nặng nhất ở đúng nơi cái lò đứng.
 *
 * Giờ chỉ còn MỘT phép kẹp nên cú nhảy biến mất theo cấu trúc chứ không nhờ chỉnh số. Ngưỡng
 * 22 px giữ lại để nói lên điều đó; ngưỡng TOÁN chặt hơn nhiều nằm ngay dưới.
 */
const NHAY_TOI_DA = 2 * 11;

/**
 * Hai điểm cách nhau 2e-6 px, một bên trong một bên ngoài mép khung: phép kẹp không giãn nên hai
 * kết quả phải cách nhau nhiều nhất cũng 2e-6 — tức đứng yên ở mọi thang đo. Quét kín cả bốn mép,
 * từng pixel một; đây chính là phép quét đã bắt được 90,4 px.
 */
test("việc trượt khỏi mép: dấu đứng yên, không còn cú nhảy nào", () => {
  const eps = 1e-6;
  let te = 0, moTa = "";
  const soi = (ax: number, ay: number, dx: number, dy: number) => {
    const trong = chorePin(ax - dx * eps, ay - dy * eps, V, O);
    const ngoai = chorePin(ax + dx * eps, ay + dy * eps, V, O);
    assert.equal(trong.pinned, false, `(${ax}, ${ay}): phía trong phải là "còn thấy"`);
    assert.equal(ngoai.pinned, true, `(${ax}, ${ay}): phía ngoài phải là "đã ghim"`);
    const d = Math.hypot(trong.x - ngoai.x, trong.y - ngoai.y);
    if (d > te) { te = d; moTa = `(${ax}, ${ay}) ra hướng (${dx}, ${dy})`; }
  };
  for (let k = 1; k < 800; k++) {
    soi(V.left + k, V.top, 0, -1);                 // vượt mép trên
    soi(V.left + k, V.bottom, 0, 1);               // vượt mép dưới
  }
  for (let k = 1; k < 450; k++) {
    soi(V.left, V.top + k, -1, 0);                 // vượt mép trái
    soi(V.right, V.top + k, 1, 0);                 // vượt mép phải
  }
  assert.ok(te <= NHAY_TOI_DA, `dấu nhảy ${te.toFixed(1)} px tại ${moTa}`);
  // Và cái ngưỡng THẬT: không giãn, nên nhiều nhất bằng đúng quãng dời đầu vào.
  assert.ok(te <= 2 * eps + 1e-12,
    `nhảy ${te} px cho đầu vào dời ${2 * eps} px — phép kẹp đang giãn, tại ${moTa}`);
});

/**
 * Cùng chỗ đó nhìn từ phía người chơi: đi thẳng đều, cái lò trôi khỏi đỉnh màn hình.
 * Tách khỏi test trên vì test trên đo ở giới hạn toán học (hai điểm cách nhau 1e-6), còn
 * cái này đo ở BƯỚC CHÂN THẬT — 1 px camera mỗi frame — nên không ai cãi được là "chỉ là
 * chuyện biên vô cùng bé". Chính cấu hình này từng đo ra 90,4 px.
 */
test("cái lò trôi khỏi đỉnh màn hình: dấu bò đúng 1 px, không nhảy", () => {
  const ax = x0, ay = V.top + 300;               // cái việc nằm sát lề trái màn hình
  let truoc: { x: number; y: number } | null = null, te = 0, daGhim = false;
  for (let k = 0; k <= 400; k++) {
    const v = moved(0, k);                       // camera trượt XUỐNG -> việc trôi lên khỏi đỉnh
    const p = chorePin(ax, ay, v, O);
    daGhim ||= p.pinned;
    if (truoc) te = Math.max(te, Math.hypot(p.x - truoc.x, p.y - truoc.y));
    truoc = p;
  }
  assert.ok(daGhim, "lượt này phải đi qua chỗ cái việc vượt mép, không thì chẳng kiểm gì");
  assert.ok(te <= NHAY_TOI_DA, `dấu nhảy ${te.toFixed(1)} px cho đúng 1 px camera`);
  // Ngưỡng thật: 1 px camera -> nhiều nhất 1 px dấu, kể cả ngay tại frame vượt mép.
  assert.ok(te <= 1 + 1e-9, `dấu bò ${te.toFixed(4)} px cho đúng 1 px camera`);
});

// ─────────────────────────────────────────────────────────── đầu vào quái đản

/** Kết quả nào cũng phải là số thật và nằm trong khung — không có ngoại lệ. */
function lanhLan(p: { x: number; y: number }, v: ViewRect, ghiChu: string) {
  assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), `${ghiChu}: ra NaN/∞`);
  const lo = Math.min(v.left, v.right), hi = Math.max(v.left, v.right);
  const tren = Math.min(v.top, v.bottom), duoi = Math.max(v.top, v.bottom);
  assert.ok(p.x >= lo - 1e-9 && p.x <= hi + 1e-9, `${ghiChu}: x = ${p.x} ra ngoài khung`);
  assert.ok(p.y >= tren - 1e-9 && p.y <= duoi + 1e-9, `${ghiChu}: y = ${p.y} ra ngoài khung`);
}

/**
 * Đứng ĐÚNG trên viền khung. Hàm dùng so sánh ngặt (`>`), nên viền tính là NGOÀI —
 * tức dấu ghim và thu nhỏ 0,8 lần đúng lúc cái việc còn ló ra nửa vòng tròn. Không phải
 * lỗi, nhưng phải khoá lại: nó quyết định cái dấu "nháy cỡ" ở đâu, và đó là thứ nhìn ra.
 */
test("việc nằm ĐÚNG trên viền khung: tính là khuất, và vẫn ra số tử tế", () => {
  const mep: Array<[number, number, string]> = [
    [V.left, (V.top + V.bottom) / 2, "mép trái"],
    [V.right, (V.top + V.bottom) / 2, "mép phải"],
    [(V.left + V.right) / 2, V.top, "mép trên"],
    [(V.left + V.right) / 2, V.bottom, "mép dưới"],
    [V.left, V.top, "góc trên-trái"],
    [V.right, V.bottom, "góc dưới-phải"],
  ];
  for (const [ax, ay, ten] of mep) {
    const p = chorePin(ax, ay, V, O);
    assert.equal(p.pinned, true, `${ten}: viền phải tính là khuất`);
    lanhLan(p, V, ten);
  }
});

/**
 * Đúng tâm. Hai cái tâm KHÁC NHAU và cả hai đều phải trả về chính nó, vì cả hai đều nằm
 * hẳn trong khung: tâm khung nhìn, và tâm vùng vẽ (lệch xuống vì lề trên rộng hơn).
 * Nhánh "rơi đúng tâm mà vẫn ngoài khung" trong `chorePin` do đó là nhánh CHẾT với mọi
 * lề không âm — xem báo cáo.
 */
test("việc ở đúng tâm: dấu nằm nguyên tại đó, không bị tính là ghim", () => {
  for (const [ax, ay] of [[(V.left + V.right) / 2, (V.top + V.bottom) / 2], [cx, cy]]) {
    const p = chorePin(ax, ay, V, O);
    assert.deepEqual([p.x, p.y, p.pinned], [ax, ay, false]);
  }
});

/**
 * Khung hẹp hơn tổng hai lề. Có thật: cỡ chữ 200% nhân `CHORE_TOP` lên 116, cộng lề dưới 19 là
 * 135. Lúc đó thà về giữa khung còn hơn trả ra một toạ độ lộn ngược — dấu bay ra ngoài màn hình
 * thì người chơi mất hẳn chỉ báo mà không biết vì sao.
 */
test("khung quá hẹp để chứa hai lề: vẫn ra số tử tế, rơi về giữa khung", () => {
  const hep: ViewRect[] = [
    { left: 1000, right: 1030, top: 500, bottom: 530 },   // bẹt cả hai chiều
    { left: 1000, right: 1800, top: 500, bottom: 540 },   // chỉ bẹt chiều cao
    { left: 1000, right: 1020, top: 500, bottom: 950 },   // chỉ bẹt chiều ngang
    // Đúng sát ngưỡng: rộng = 2 × lề, cao = lề trên + lề dưới.
    { left: 1000, right: 1000 + 2 * O.edge, top: 500, bottom: 500 + O.top + O.edge },
  ];
  for (const v of hep) {
    for (const [ax, ay] of [[0, 0], [1e6, -1e6], [v.left - 1, v.top - 1], [1e9, 1e9]]) {
      const p = chorePin(ax, ay, v, O);
      lanhLan(p, v, `khung hẹp ${JSON.stringify(v)} việc (${ax}, ${ay})`);
      assert.equal(p.x, (v.left + v.right) / 2);
      assert.equal(p.y, (v.top + v.bottom) / 2);
      assert.equal(p.pinned, true);
    }
  }
});

/**
 * ĐÃ SỬA — từng là `todo`, do phép quét bao trùm ở cuối file tìm ra.
 *
 * Cái chốt "khung quá hẹp thì về giữa" từng nằm SAU nhánh `if (visible)` nên không che được chính
 * nhánh đó: khung thấp hơn lề trên mà việc đang Ở TRONG khung thì `clamp` chạy với `lo > hi` và
 * trả về một điểm nằm DƯỚI ĐÁY khung — dấu bị vẽ ra ngoài vùng camera, mà `pinned` vẫn `false` nên
 * chỗ gọi còn vẽ nó cỡ to.
 *
 * Giữ lại dù khung nhìn bản dựng luôn là 800 × 450: `worldView` CÓ lúc báo số lạ đúng một frame
 * (đổi cỡ cửa sổ, tab ẩn rồi hiện lại).
 */
test("khung thấp hơn lề trên mà việc đang ở TRONG khung: dấu vẫn nằm trong khung", () => {
  const v: ViewRect = { left: 0, right: 800, top: 0, bottom: 50 };
  const p = chorePin(400, 25, v, O);
  assert.ok(p.y <= v.bottom, `dấu rơi xuống y = ${p.y}, đáy khung ở ${v.bottom}`);
  assert.deepEqual([p.x, p.y, p.pinned], [400, 25, true]);
  // Và cái việc ở bất cứ đâu trong khung bẹt ấy cũng phải về đúng chỗ đó.
  for (const [ax, ay] of [[0, 0], [799, 49], [400, 1], [-500, 25]]) {
    const q = chorePin(ax, ay, v, O);
    lanhLan(q, v, `khung bẹt, việc (${ax}, ${ay})`);
    assert.deepEqual([q.x, q.y], [400, 25]);
  }
});

/**
 * Khung RỖNG. Xảy ra thật trong một frame: Phaser dựng `worldView` trước khi scene kịp
 * `resize`, và vài trình duyệt báo 0 × 0 ngay sau khi tab bị ẩn rồi hiện lại. Một `NaN`
 * lọt ra đây là `Graphics.fillCircle(NaN, NaN, r)` và cả lớp đồ hoạ tắt ngóm — mất luôn
 * mọi dấu, không chỉ cái đang tính.
 */
test("khung rỗng (0 × 0): không NaN, không ∞", () => {
  for (const v of [
    { left: 0, right: 0, top: 0, bottom: 0 },
    { left: 1400, right: 1400, top: 725, bottom: 725 },
  ]) {
    for (const [ax, ay] of [[0, 0], [1400, 725], [-9999, 9999]]) {
      const p = chorePin(ax, ay, v, O);
      lanhLan(p, v, "khung rỗng");
      assert.equal(p.pinned, true);
    }
  }
});

/**
 * Chỗ giao "còn thấy / đã ghim" liền mạch với MỌI cỡ lề, không riêng cỡ đang dùng.
 *
 * Vốn là một phép CHẨN ĐOÁN: hồi còn hai nhánh, lề = 0 là cấu hình duy nhất mà cú nhảy biến mất,
 * và chính điều đó chỉ ra nguyên nhân. Giờ nó đổi vai — khoá lại rằng tính liền mạch KHÔNG phụ
 * thuộc vào lề nữa, mà lề trên thì là biến (58 → 116, đổi được giữa chừng khi người chơi chỉnh cỡ
 * chữ trong lúc đang chơi).
 */
test("liền mạch ở biên với MỌI cỡ lề, không chỉ cỡ đang dùng", () => {
  const eps = 1e-7;
  const cacLe: PinOpts[] = [
    { edge: 0, top: 0 },          // không lề
    { edge: 1, top: 1 },          // lề bé tí
    { edge: 19, top: 58 },        // cỡ chữ 100%
    { edge: 19, top: 116 },       // cỡ chữ 200%
    { edge: 60, top: 180 },       // lề to vô lý — vẫn phải liền
    { edge: 19, top: 0 },         // lệch hẳn hai trục
  ];
  for (const o of cacLe) {
    for (let k = 1; k < 800; k += 1) {
      for (const [ax, ay, dx, dy] of [
        [V.left + k, V.top, 0, -1], [V.left + k, V.bottom, 0, 1],
      ] as const) {
        const trong = chorePin(ax - dx * eps, ay - dy * eps, V, o);
        const ngoai = chorePin(ax + dx * eps, ay + dy * eps, V, o);
        assert.ok(Math.hypot(trong.x - ngoai.x, trong.y - ngoai.y) <= 2 * eps + 1e-12,
          `nhảy ở biên với lề ${JSON.stringify(o)} tại (${ax}, ${ay})`);
      }
    }
  }
});

/**
 * Cỡ chữ 200% nhân lề trên lên gấp đôi — vùng vẽ tụt xuống hẳn 116 px. Mọi luật phải giữ nguyên:
 * người bật cỡ chữ lớn đúng là người cần chỉ báo rõ nhất, nên sai cho riêng họ là kiểu hỏng tệ
 * nhất. Kiểm bằng đúng cách phát biểu MỚI (kẹp từng trục).
 */
test("cỡ chữ 200%: lề trên gấp đôi mà ba luật vẫn đứng", () => {
  const O2: PinOpts = { edge: 19, top: 116 };
  const a0 = V.left + O2.edge, a1 = V.right - O2.edge;
  const b0 = V.top + O2.top, b1 = V.bottom - O2.edge;
  // Luật 1: trong vùng vẽ (đã hẹp lại) thì đứng yên tuyệt đối.
  for (let ax = a0; ax <= a1; ax += 7) {
    for (let ay = b0; ay <= b1; ay += 7) {
      const p = chorePin(ax, ay, V, O2);
      assert.deepEqual([p.x, p.y, p.pinned], [ax, ay, false]);
    }
  }
  // Luật 2: ra ngoài thì về mép ĐÚNG PHÍA, và trục còn chỗ vẫn báo đúng toạ độ thật.
  for (const ax of [V.left - 3000, V.left, cx, V.right, V.right + 3000]) {
    for (const ay of [V.top - 3000, V.top, (b0 + b1) / 2, V.bottom, V.bottom + 3000]) {
      const p = chorePin(ax, ay, V, O2);
      const ten = `200% tại (${ax}, ${ay})`;
      if (ax <= V.left) assert.equal(p.x, a0, ten);
      else if (ax >= V.right) assert.equal(p.x, a1, ten);
      else if (ax >= a0 && ax <= a1) assert.equal(p.x, ax, ten);
      if (ay <= V.top) assert.equal(p.y, b0, ten);
      else if (ay >= V.bottom) assert.equal(p.y, b1, ten);
      else if (ay >= b0 && ay <= b1) assert.equal(p.y, ay, ten);
      assert.ok(p.x >= a0 - 1e-9 && p.x <= a1 + 1e-9 && p.y >= b0 - 1e-9 && p.y <= b1 + 1e-9, ten);
    }
  }
  // Luật 2, phần "đi một bước bò một bước": vẫn đúng 1 px, kể cả ở lề trên rộng gấp đôi —
  // chính chỗ cú nhảy cũ nặng nhất (lề càng rộng thì hai nhánh cũ càng lệch).
  let truoc: { x: number; y: number } | null = null, te = 0;
  for (let k = 0; k <= 500; k++) {
    const p = chorePin(a0, V.top + 300, moved(0, k), O2);
    if (truoc) te = Math.max(te, Math.hypot(p.x - truoc.x, p.y - truoc.y));
    truoc = p;
  }
  assert.ok(te <= 1 + 1e-9, `ở cỡ chữ 200% dấu bò ${te.toFixed(4)} px cho 1 px camera`);
});

/**
 * Quét bao trùm: khung bất kỳ × chỗ đặt bất kỳ, 50.000 lượt tất định — cái lưới đỡ cho mọi lần
 * sửa sau.
 *
 * ⚠️ `NaN` nguy hơn một toạ độ sai nhiều: `Graphics.fillCircle(NaN, NaN, r)` làm hỏng cả lớp đồ
 * hoạ, mất luôn mọi dấu khác chứ không riêng cái đang tính.
 */
function quet(xet: (p: { x: number; y: number }, v: ViewRect, ghiChu: string) => void) {
  const rnd = lcg(99);
  for (let i = 0; i < 50_000; i++) {
    const w = 40 + rnd() * 1600, h = 40 + rnd() * 1200;
    const left = -3000 + rnd() * 6000, top = -3000 + rnd() * 6000;
    const v: ViewRect = { left, top, right: left + w, bottom: top + h };
    const ax = left - 3000 + rnd() * (w + 6000), ay = top - 3000 + rnd() * (h + 6000);
    const ghiChu = `quét #${i} khung ${w.toFixed(1)}×${h.toFixed(1)}`
      + ` việc (${ax.toFixed(1)}, ${ay.toFixed(1)})`;
    xet(chorePin(ax, ay, v, O), v, ghiChu);
  }
}

test("mọi đầu vào hợp lệ: không bao giờ ra NaN hay ∞", () => {
  quet((p, _v, ghiChu) => {
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), `${ghiChu}: ra NaN/∞`);
  });
});

/**
 * ĐÃ SỬA — chính phép quét này tìm ra lỗi "chốt khung-quá-hẹp đặt sai chỗ" (xem test
 * repro ở trên). Giữ cả hai: cái repro nói rõ một ca, cái này canh cả lớp lỗi sau nó.
 */
test("mọi đầu vào hợp lệ: dấu luôn nằm TRONG khung nhìn", () => { quet(lanhLan); });
