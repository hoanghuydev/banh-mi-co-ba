/**
 * Mép THẬT của một sprite (`art/opaque.opaqueEdges`).
 *
 * Hàm này sinh ra từ MỘT lỗi lặp lại ba lần ở ba chỗ khác nhau, lần nào cũng chỉ lòi ra
 * khi chơi thật: code hỏi KHUNG TEXTURE trong khi nó cần hỏi CÁI VẬT. Ổ bánh trong khung
 * 40×40 treo lơ lửng trên mặt thớt; dấu "việc cần làm" trỏ vào khoảng không phía trên
 * khúc quầy cao 92 px; cái bồn rửa nướng lệch 2 px nên tâm sprite không phải tâm bồn.
 *
 * Phần quét alpha không sai được — nó chỉ đọc pixel. Cái sai LUÔN nằm ở bước sau: co
 * giãn hộp pixel về toạ độ màn hình rồi dời gốc. Bước đó giờ là `opaqueEdges`, thuần
 * toán, nên quét được cả ngàn trường hợp ở đây thay vì phải mở game ra nhìn.
 *
 * ── Giao kèo của `box` ───────────────────────────────────────────────────────
 * `left`/`top` tính vào, `right`/`bottom` hở ra, đơn vị là px TEXTURE, gốc góc trên
 * trái. `null` = texture trong suốt hết, hoặc không đọc nổi pixel.
 *
 * `b` là `getBounds()` của Phaser — ĐÃ nuốt sẵn origin, xoay và co. Mấy test dưới khoá
 * lại chuyện đó: ai lỡ tay cộng origin thêm lần nữa ở chỗ gọi sẽ gãy ở đây.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { opaqueEdges, type OpaqueBox, type SpriteBox } from "../src/art/opaque";

/** So sánh có dung sai — mấy phép co giãn đi qua chia rồi nhân, không về đúng bit được. */
function gan(a: number, b: number, ten: string) {
  assert.ok(Math.abs(a - b) < 1e-9, `${ten}: ${a} ≠ ${b} (lệch ${a - b})`);
}

/** Số ngẫu nhiên tất định — test phải ra y hệt nhau mọi lần chạy, kể cả lúc nó đỏ. */
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const KHUNG: SpriteBox = { left: 1234.5, top: -876.25, width: 62, height: 70 };

// ───────────────────────────────────────────────────────── hai cái mốc của phép ánh xạ

/**
 * Hộp đục phủ KÍN texture thì không có gì để cắt: trả lại đúng khung sprite.
 *
 * Đây là một trong hai cái mốc neo phép ánh xạ texture → màn hình (mốc kia là hộp rỗng).
 * Sai ở đây là sai hệ quy chiếu, và mọi vật trong game lệch đi cùng một kiểu — thứ nhìn
 * lướt qua rất dễ tưởng là "art vẽ thế".
 */
test("hộp đục phủ kín texture: mép trả về đúng bằng khung sprite", () => {
  const ca: Array<[SpriteBox, number, number]> = [
    [KHUNG, 62, 70],
    [{ left: 0, top: 0, width: 40, height: 40 }, 40, 40],
    [{ left: -5000.5, top: 9999.25, width: 186, height: 210 }, 186, 210],
    // Texture siêu lấy mẫu (`ART_SS`): px texture nhiều gấp ba px thiết kế.
    [{ left: 10, top: 20, width: 62, height: 70 }, 186, 210],
  ];
  for (const [b, tw, th] of ca) {
    const e = opaqueEdges(b, tw, th, { left: 0, right: tw, top: 0, bottom: th });
    gan(e.left, b.left, "left");
    gan(e.right, b.left + b.width, "right");
    gan(e.top, b.top, "top");
    gan(e.bottom, b.top + b.height, "bottom");
    gan(e.cx, b.left + b.width / 2, "cx");
  }
});

/**
 * Hộp RỖNG (`null`): texture trong suốt hết, hoặc trình duyệt chặn đọc pixel (canvas bị
 * "nhuốm bẩn" vì ảnh khác nguồn — chuyện có thật khi deploy lên CDN khác domain).
 *
 * Lúc đó thà trả về khung sprite — RỘNG HƠN cái vật — còn hơn bịa ra một con số. Rộng
 * hơn thì dấu chấm than treo hơi cao một chút; bịa số thì nó trỏ vào chỗ không có gì.
 * `cx` phải là tâm khung, vì không còn gì khác để biết tâm vật nằm đâu.
 */
test("hộp rỗng: lui về khung sprite, cx đúng tâm khung", () => {
  const e = opaqueEdges(KHUNG, 62, 70, null);
  assert.deepEqual(
    [e.left, e.right, e.top, e.bottom, e.cx],
    [KHUNG.left, KHUNG.left + KHUNG.width, KHUNG.top, KHUNG.top + KHUNG.height,
      KHUNG.left + KHUNG.width / 2],
  );
});

/**
 * Cỡ texture bằng 0 hoặc âm. `getSourceImage()` trả về 0 trong đúng một frame lúc texture
 * còn đang nạp, và một phép chia cho 0 ở đây là `Infinity` chảy thẳng vào `setPosition` —
 * sprite bay ra khỏi thế giới và không bao giờ quay lại.
 */
test("cỡ texture 0 hoặc âm: lui về khung sprite, không chia cho 0", () => {
  const phu: OpaqueBox = { left: 1, right: 5, top: 1, bottom: 5 };
  for (const [tw, th] of [[0, 70], [62, 0], [0, 0], [-62, 70], [62, -70], [-1, -1]]) {
    const e = opaqueEdges(KHUNG, tw, th, phu);
    assert.ok(Object.values(e).every(Number.isFinite), `tex ${tw}×${th}: ra NaN/∞`);
    assert.deepEqual(
      [e.left, e.right, e.top, e.bottom],
      [KHUNG.left, KHUNG.left + KHUNG.width, KHUNG.top, KHUNG.top + KHUNG.height],
      `tex ${tw}×${th}: không lui về khung sprite`,
    );
  }
});

// ──────────────────────────────────────────────────── ba cái lỗi lịch sử, viết thành số

/**
 * LỖI 1 — ổ bánh treo lơ lửng trên mặt thớt.
 *
 * Texture món cầm tay là khung vuông 40×40 (`HELD.W/H`) vẽ ổ bánh quanh TÂM, nên dưới ổ
 * còn một dải trong suốt dày. "Đặt mép dưới sprite vào mặt thớt" vì thế là đặt mép dưới
 * KHUNG — ổ bánh nổi lên trên mặt gỗ đúng bằng dải trống đó.
 *
 * Lấy một ổ chiếm các hàng 13…24 (`bottom` = 25, hở phải): còn 15 hàng trong suốt phía
 * dưới, nên mép dưới THẬT phải cao hơn mép dưới khung đúng 15 px. Đúng con số
 * `heldFootPad` đang đếm, chỉ khác là giờ suy ra được thay vì đo bằng mắt.
 */
test("ổ bánh trong khung 40×40: mép dưới thật cao hơn mép khung đúng 15 px", () => {
  const b: SpriteBox = { left: 300, top: 500, width: 40, height: 40 };
  const e = opaqueEdges(b, 40, 40, { left: 10, right: 30, top: 13, bottom: 25 });
  gan(e.bottom, b.top + 25, "mép dưới");
  gan(b.top + b.height - e.bottom, 15, "dải trong suốt dưới đáy");
  gan(e.top, b.top + 13, "mép trên");
  // Và bề cao THẬT của ổ là 12 px, không phải 40 — chính chỗ `displayHeight` nói dối.
  gan(e.bottom - e.top, 12, "bề cao thật");
});

/**
 * LỖI 2 — dấu "việc cần làm" trỏ vào khoảng không phía trên khúc quầy.
 *
 * `counter_work` cao 92 px (`heightFor(BODY + 22)`), nhưng mặt quầy chỉ cao 54 px tính từ
 * điểm chân — phần trên texture là khoảng trống chừa cho khúc có tủ kính. Neo dấu theo
 * `displayHeight` là neo vào nóc cái khoảng trống ấy.
 *
 * Hộp đục bắt đầu ở hàng 20 thì mép trên THẬT phải thấp hơn mép khung đúng 20 px. Hồi
 * đó sai đúng kiểu này: dấu chấm than nổi cách cái thớt một quãng, trỏ vào không khí.
 */
test("khúc quầy 92 px: mép trên thật thấp hơn mép khung đúng 20 px", () => {
  const b: SpriteBox = { left: 0, top: 1000, width: 62, height: 92 };
  const e = opaqueEdges(b, 62, 92, { left: 0, right: 62, top: 20, bottom: 92 });
  gan(e.top, b.top + 20, "mép trên");
  gan(e.top - b.top, 20, "dải trống trên nóc");
  // Mép dưới chạm đáy khung: khúc quầy đứng trên sàn, không có khoảng hở nào bên dưới.
  gan(e.bottom, b.top + b.height, "mép dưới");
});

/**
 * LỖI 3, dạng tổng quát — tâm VẬT không phải tâm KHUNG.
 *
 * `standing()` vẽ ảnh vào texture ở `round(W/2 − w/2 + dx)`, với `dx` lấy từ bảng
 * `STANDING`. Hễ `dx ≠ 0` là vật nằm lệch trong khung, mà mọi chỗ neo lại dùng `img.x`
 * tức tâm KHUNG. Luật phải đúng với mọi độ lệch và mọi tỉ lệ co:
 *
 *      cx − tâm_khung = d × (bề_ngang_khung / bề_ngang_texture)
 *
 * Nhân với tỉ lệ co chứ không phải cộng thẳng: texture siêu lấy mẫu gấp ba thì lệch 6 px
 * texture chỉ là lệch 2 px trên màn.
 */
test("cx lệch tâm khung đúng bằng độ lệch của hộp đục, nhân tỉ lệ co", () => {
  const texW = 62, texH = 70;
  for (const tiLe of [1, 0.5, 2, 1 / 3, 7.25]) {
    const b: SpriteBox = { left: -321.5, top: 88.25, width: texW * tiLe, height: texH * tiLe };
    for (const rong of [4, 20, 45, 62]) {
      for (let tam = rong / 2; tam <= texW - rong / 2; tam += 0.5) {
        const box: OpaqueBox =
          { left: tam - rong / 2, right: tam + rong / 2, top: 0, bottom: texH };
        const d = tam - texW / 2;                        // độ lệch, px texture
        const e = opaqueEdges(b, texW, texH, box);
        gan(e.cx - (b.left + b.width / 2), d * (b.width / texW), `lệch ${d} tỉ lệ ${tiLe}`);
      }
    }
  }
});

/**
 * LỖI 3, ca thật: CÁI BỒN RỬA. Suy từ gốc chứ không chép con số đo được.
 *
 * `STANDING[PROP.sink] = ["prop_sink", { h: 58, dx: −2 }]`, ảnh nguồn `prop_sink.png`
 * 303×384. `standing()` tính ra:
 *      w = (303 / 384) × 58 = 45,765625            bề ngang bồn trên màn
 *      W = max(TW + 2, ⌈w⌉ + 6) = max(62, 52) = 62 bề ngang texture
 *      vẽ tại x = round(62/2 − w/2 − 2) = 6
 * nên bồn chiếm px 6 … 51,765625, tâm 28,8828125, trong khi tâm khung là 31,0.
 * LỆCH 2,1171875 px — làm tròn 2,12.
 *
 * Trước khi có hàm này, mọi chỗ neo đều báo lệch 0: cái bồn bị coi là nằm giữa ô. 2 px
 * thì mắt không bắt được, nhưng nó là cùng MỘT lỗi với 38 px của cái thớt, chỉ nhỏ hơn.
 * Vá cái to mà bỏ cái nhỏ là để nguyên cái bẫy cho lần sau.
 */
test("bồn rửa: tâm vật lệch tâm khung 2,12 px — đúng con số suy từ bảng STANDING", () => {
  const srcW = 303, srcH = 384, h = 58, dx = -2, TW = 60;
  const w = (srcW / srcH) * h;
  const texW = Math.max(TW + 2, Math.ceil(w) + 6);
  const veTai = Math.round(texW / 2 - w / 2 + dx);
  assert.deepEqual([w, texW, veTai], [45.765625, 62, 6], "giả định về standing() đã đổi");

  const b: SpriteBox = { left: 2000, top: 3000, width: texW, height: 70 };
  // Hình học ĐÚNG (mép ảnh là số lẻ).
  const e = opaqueEdges(b, texW, 70, { left: veTai, right: veTai + w, top: 0, bottom: 58 });
  const lech = (b.left + b.width / 2) - e.cx;
  gan(lech, 2.1171875, "độ lệch hình học");
  assert.equal(Number(lech.toFixed(2)), 2.12);

  // Quét alpha thật trả về số NGUYÊN px texture, nên mép phải làm tròn LÊN. Kiểm cả ba
  // mức siêu lấy mẫu `ART_SS` có thể gặp: con số phải vẫn là ~2, tuyệt đối không phải 0.
  for (const ss of [1, 2, 3]) {
    const nguyen: OpaqueBox = {
      left: veTai * ss, right: Math.ceil((veTai + w) * ss), top: 0, bottom: 58 * ss,
    };
    const q = opaqueEdges(b, texW * ss, 70 * ss, nguyen);
    const lq = (b.left + b.width / 2) - q.cx;
    gan(lq, 2, `quét alpha ss=${ss}`);
    assert.ok(lq > 1.5 && lq < 2.5, `ss=${ss}: lệch ${lq}, phải quanh 2 px`);
  }
});

// ─────────────────────────────────────────────────────────── bất biến của phép ánh xạ

/**
 * DỜI khung sprite đi bao nhiêu thì mép dời theo đúng bấy nhiêu.
 *
 * Quán nằm ở toạ độ thế giới vài ngàn (`toScreen` của lưới iso), mà mọi phép thử bằng
 * mắt thì làm ở quanh gốc toạ độ. Một chỗ lẫn toạ độ tuyệt đối với toạ độ tương đối sẽ
 * sống sót qua mọi lần chơi thử và chỉ chết ở đây — nên dời hẳn ±50.000 px cho chắc.
 */
test("dời khung sprite: mép dời đúng quãng ấy, mọi góc toạ độ thế giới", () => {
  const rnd = lcg(4242);
  const box: OpaqueBox = { left: 6, right: 52, top: 3, bottom: 58 };
  const goc = opaqueEdges({ left: 0, top: 0, width: 62, height: 70 }, 62, 70, box);
  for (let i = 0; i < 5_000; i++) {
    const dx = (rnd() - 0.5) * 100_000, dy = (rnd() - 0.5) * 100_000;
    const e = opaqueEdges({ left: dx, top: dy, width: 62, height: 70 }, 62, 70, box);
    gan(e.left - goc.left, dx, "left"); gan(e.right - goc.right, dx, "right");
    gan(e.top - goc.top, dy, "top"); gan(e.bottom - goc.bottom, dy, "bottom");
    gan(e.cx - goc.cx, dx, "cx");
  }
});

/**
 * CO GIÃN khung sprite thì mép co giãn theo, quanh chính góc trên trái của khung.
 *
 * Đây là chỗ `ART_SS` sống: texture nướng dư gấp `ss` lần rồi sprite thu lại `1/ss`.
 * Nhân nhầm hay chia nhầm một lần là cái vật co lại còn một phần ba — mà `artScale` thì
 * khác nhau giữa texture ảnh thật và texture vẽ bằng code, nên lỗi chỉ hiện ở nửa số
 * đạo cụ và rất dễ đọc nhầm thành "artist gửi ảnh sai cỡ".
 */
test("co giãn khung sprite: mép co giãn theo đúng tỉ lệ, quanh góc trên trái", () => {
  const box: OpaqueBox = { left: 6, right: 52, top: 3, bottom: 58 };
  const L = 777.5, T = -333.25;
  const mot = opaqueEdges({ left: L, top: T, width: 62, height: 70 }, 62, 70, box);
  for (const k of [0.25, 0.5, 1, 2, 3, 10.5]) {
    const e = opaqueEdges({ left: L, top: T, width: 62 * k, height: 70 * k }, 62, 70, box);
    gan(e.left - L, (mot.left - L) * k, `left ×${k}`);
    gan(e.right - L, (mot.right - L) * k, `right ×${k}`);
    gan(e.top - T, (mot.top - T) * k, `top ×${k}`);
    gan(e.bottom - T, (mot.bottom - T) * k, `bottom ×${k}`);
    gan(e.cx - L, (mot.cx - L) * k, `cx ×${k}`);
  }
  // Và cùng một khung sprite thì cỡ TEXTURE không đổi kết quả, miễn hộp đục co theo —
  // đúng chuyện `ART_SS` làm: 62×70 hay 186×210 cũng ra một cái vật.
  for (const ss of [1, 2, 3, 4]) {
    const e = opaqueEdges({ left: L, top: T, width: 62, height: 70 }, 62 * ss, 70 * ss, {
      left: box.left * ss, right: box.right * ss, top: box.top * ss, bottom: box.bottom * ss,
    });
    gan(e.left, mot.left, `ss=${ss} left`);
    gan(e.cx, mot.cx, `ss=${ss} cx`);
    gan(e.bottom, mot.bottom, `ss=${ss} bottom`);
  }
});

/**
 * ORIGIN KHÔNG ĐƯỢC TÍNH HAI LẦN.
 *
 * `getBounds()` đã nuốt sẵn origin — sprite origin (0,5 · 1) đặt tại (x, y) và sprite
 * origin (0 · 0) đặt tại (x − w/2, y − h) cho ra ĐÚNG một cái khung. Hàm chỉ được nhìn
 * cái khung ấy. Ai đó sau này "sửa cho đúng" bằng cách cộng thêm origin ở chỗ gọi thì
 * mọi đạo cụ tụt xuống nửa chiều cao, và test này là chỗ nó gãy.
 *
 * Đạo cụ trong game dùng origin (0,5 · 1) — mép dưới là điểm chạm đất; bảng kẹp nhân thì
 * dùng (0 · 0). Liệt kê cả hai, cộng vài origin lẻ cho chắc.
 */
test("mép không phụ thuộc origin: cùng một khung thì cùng một kết quả", () => {
  const box: OpaqueBox = { left: 6, right: 52, top: 3, bottom: 58 };
  const w = 62, h = 70, x = 1500.5, y = -220.75;
  // Hộp đục [6, 52) × [3, 58) trong texture 62×70, tỉ lệ co 1:1 -> mép so với khung là
  // đúng mấy con số ấy, và `cx` = (6 + 52)/2 = 29. Phải y hệt với MỌI origin.
  const mocTuongDoi = [6, 52, 3, 58, 29];
  for (const [ox, oy] of [[0.5, 1], [0, 0], [0.5, 0.5], [1, 1], [0.25, 0.8]]) {
    // Khung mà Phaser dựng ra cho origin (ox, oy) tại (x, y).
    const b: SpriteBox = { left: x - ox * w, top: y - oy * h, width: w, height: h };
    const e = opaqueEdges(b, w, h, box);
    const tuongDoi = [e.left - b.left, e.right - b.left, e.top - b.top,
      e.bottom - b.top, e.cx - b.left];
    for (let i = 0; i < 5; i++) gan(tuongDoi[i], mocTuongDoi[i], `origin ${ox},${oy} #${i}`);
  }
  // Và cái mệnh đề cốt lõi: HAI origin khác nhau, đặt ở HAI chỗ khác nhau, nhưng dựng ra
  // CÙNG một khung — thì phải ra cùng một kết quả, từng bit. Đạo cụ trong game dùng
  // origin (0,5 · 1) đặt tại điểm chạm đất; vẽ lại bằng origin (0 · 0) ở góc trên trái
  // là đúng cùng một sprite, và hàm này không được phân biệt nổi hai cách viết ấy.
  const khungCua = (ox: number, oy: number, px: number, py: number): SpriteBox =>
    ({ left: px - ox * w, top: py - oy * h, width: w, height: h });
  const k1 = khungCua(0.5, 1, x, y);
  const k2 = khungCua(0, 0, x - w / 2, y - h);
  assert.deepEqual(k1, k2, "hai cách đặt này phải ra cùng một khung — giả định đã hỏng");
  assert.deepEqual(opaqueEdges(k1, w, h, box), opaqueEdges(k2, w, h, box),
    "cùng một khung mà ra hai kết quả");
});

/**
 * Mép THẬT không bao giờ chui ra ngoài khung sprite, và không bao giờ lộn ngược.
 *
 * Quét dày mọi hộp đục HỢP LỆ trong một texture 24×24 — hơn 20.000 hộp. Hợp lệ nghĩa là
 * nằm trong `[0, texW] × [0, texH]`, đúng thứ `opaqueBox` sinh ra được: nó quét trong
 * đúng kích thước ảnh nên không đẻ ra nổi hộp tràn ra ngoài.
 *
 * `cx` luôn là trung điểm của `left`/`right` — kiểm riêng, vì đó là trường duy nhất
 * không đọc thẳng ra từ hộp và là chỗ một dấu ngoặc sai sẽ nấp.
 */
test("mọi hộp đục hợp lệ: mép nằm trong khung, không lộn ngược, cx đúng trung điểm", () => {
  const N = 24;
  const b: SpriteBox = { left: -40.5, top: 17.25, width: 62, height: 70 };
  const phai = b.left + b.width, duoi = b.top + b.height;
  let dem = 0;
  for (let l = 0; l < N; l++) {
    for (let r = l + 1; r <= N; r++) {
      for (let t = 0; t < N; t += 2) {
        for (let bo = t + 1; bo <= N; bo += 2) {
          const e = opaqueEdges(b, N, N, { left: l, right: r, top: t, bottom: bo });
          const ten = `hộp [${l},${r})×[${t},${bo})`;
          assert.ok(Object.values(e).every(Number.isFinite), `${ten}: NaN/∞`);
          assert.ok(e.left >= b.left - 1e-9 && e.right <= phai + 1e-9, `${ten}: tràn ngang`);
          assert.ok(e.top >= b.top - 1e-9 && e.bottom <= duoi + 1e-9, `${ten}: tràn dọc`);
          assert.ok(e.left < e.right && e.top < e.bottom, `${ten}: lộn ngược`);
          assert.ok(e.cx >= e.left && e.cx <= e.right, `${ten}: cx ra ngoài chính nó`);
          gan(e.cx, (e.left + e.right) / 2, `${ten}: cx`);
          dem++;
        }
      }
    }
  }
  assert.ok(dem > 20_000, `quét quá thưa, mới ${dem} hộp`);
});

// ─────────────────────────────────────────────────────────────── đầu vào quái đản

/**
 * Hộp đục chỉ MỘT pixel. Có thật: `ing_ot` là trái ớt mảnh, mà ở mức siêu lấy mẫu thấp
 * với ngưỡng alpha 8/255 thì một món bé tí hoàn toàn có thể co về còn một hàng một cột.
 * Lúc đó `left === right` là chia đôi một đoạn rỗng — phải ra số tử tế, không ra `NaN`.
 */
test("hộp đục một pixel: vẫn ra mép tử tế, cx nằm giữa đúng pixel ấy", () => {
  const b: SpriteBox = { left: 100, top: 200, width: 40, height: 40 };
  const e = opaqueEdges(b, 40, 40, { left: 17, right: 18, top: 9, bottom: 10 });
  assert.deepEqual([e.left, e.right, e.top, e.bottom, e.cx],
    [117, 118, 209, 210, 117.5]);
  gan(e.right - e.left, 1, "bề ngang một pixel");
});

/**
 * Khung sprite BẸP (bề ngang hoặc bề cao bằng 0). Xảy ra khi sprite bị `setScale(0)` —
 * đúng cách `drawBasket` giấu một ô rổ trống, và cách vài hiệu ứng co vật về trước khi
 * xoá. Không được ra `NaN`: một `NaN` lọt vào `setPosition` là mất luôn cả sprite.
 */
test("khung sprite bẹp: không NaN, mọi mép tụ về đúng cái khung bẹp ấy", () => {
  const box: OpaqueBox = { left: 6, right: 52, top: 3, bottom: 58 };
  for (const [w, h] of [[0, 70], [62, 0], [0, 0]]) {
    const b: SpriteBox = { left: 500, top: 600, width: w, height: h };
    const e = opaqueEdges(b, 62, 70, box);
    assert.ok(Object.values(e).every(Number.isFinite), `khung ${w}×${h}: NaN/∞`);
    assert.ok(e.left >= 500 && e.right <= 500 + w + 1e-9, `khung ${w}×${h}: tràn ngang`);
    assert.ok(e.top >= 600 && e.bottom <= 600 + h + 1e-9, `khung ${w}×${h}: tràn dọc`);
  }
});

/**
 * Quét bao trùm: khung bất kỳ ở toạ độ bất kỳ, texture bất kỳ, hộp đục bất kỳ (hợp lệ).
 * Lưới đỡ cuối cùng — một dấu trừ lộn chiều hay một chỗ chia nhầm sẽ rơi vào đây kể cả
 * khi nó không vi phạm cái luật nào kể trên.
 */
test("quét bao trùm: luôn ra số thật, luôn nằm trong khung sprite", () => {
  const rnd = lcg(2718);
  for (let i = 0; i < 50_000; i++) {
    const texW = 1 + Math.floor(rnd() * 400), texH = 1 + Math.floor(rnd() * 400);
    const b: SpriteBox = {
      left: -5000 + rnd() * 10_000, top: -5000 + rnd() * 10_000,
      width: rnd() * 500, height: rnd() * 500,
    };
    const l = Math.floor(rnd() * texW), t = Math.floor(rnd() * texH);
    const box: OpaqueBox = rnd() < 0.05 ? null : {
      left: l, right: l + 1 + Math.floor(rnd() * (texW - l)),
      top: t, bottom: t + 1 + Math.floor(rnd() * (texH - t)),
    };
    const e = opaqueEdges(b, texW, texH, box);
    const ten = `#${i} tex ${texW}×${texH}`;
    assert.ok(Object.values(e).every(Number.isFinite), `${ten}: NaN/∞`);
    assert.ok(e.left >= b.left - 1e-9 && e.right <= b.left + b.width + 1e-9, `${ten}: tràn ngang`);
    assert.ok(e.top >= b.top - 1e-9 && e.bottom <= b.top + b.height + 1e-9, `${ten}: tràn dọc`);
    assert.ok(e.left <= e.right && e.top <= e.bottom, `${ten}: lộn ngược`);
    gan(e.cx, (e.left + e.right) / 2, `${ten}: cx`);
  }
});
