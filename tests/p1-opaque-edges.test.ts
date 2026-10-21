import { test } from "node:test";
import assert from "node:assert/strict";
import { opaqueEdges, type OpaqueBox, type SpriteBox } from "../src/art/opaque";

function gan(a: number, b: number, ten: string) {
  assert.ok(Math.abs(a - b) < 1e-9, `${ten}: ${a} ≠ ${b} (lệch ${a - b})`);
}

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const KHUNG: SpriteBox = { left: 1234.5, top: -876.25, width: 62, height: 70 };

test("hộp đục phủ kín texture: mép trả về đúng bằng khung sprite", () => {
  const ca: Array<[SpriteBox, number, number]> = [
    [KHUNG, 62, 70],
    [{ left: 0, top: 0, width: 40, height: 40 }, 40, 40],
    [{ left: -5000.5, top: 9999.25, width: 186, height: 210 }, 186, 210],
    // ART_SS = 3: px texture gấp ba px thiết kế.
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

test("hộp rỗng: lui về khung sprite, cx đúng tâm khung", () => {
  const e = opaqueEdges(KHUNG, 62, 70, null);
  assert.deepEqual(
    [e.left, e.right, e.top, e.bottom, e.cx],
    [KHUNG.left, KHUNG.left + KHUNG.width, KHUNG.top, KHUNG.top + KHUNG.height,
      KHUNG.left + KHUNG.width / 2],
  );
});

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

test("ổ bánh trong khung 40×40: mép dưới thật cao hơn mép khung đúng 15 px", () => {
  const b: SpriteBox = { left: 300, top: 500, width: 40, height: 40 };
  const e = opaqueEdges(b, 40, 40, { left: 10, right: 30, top: 13, bottom: 25 });
  gan(e.bottom, b.top + 25, "mép dưới");
  gan(b.top + b.height - e.bottom, 15, "dải trong suốt dưới đáy");
  gan(e.top, b.top + 13, "mép trên");
  gan(e.bottom - e.top, 12, "bề cao thật");
});

test("khúc quầy 92 px: mép trên thật thấp hơn mép khung đúng 20 px", () => {
  const b: SpriteBox = { left: 0, top: 1000, width: 62, height: 92 };
  const e = opaqueEdges(b, 62, 92, { left: 0, right: 62, top: 20, bottom: 92 });
  gan(e.top, b.top + 20, "mép trên");
  gan(e.top - b.top, 20, "dải trống trên nóc");
  gan(e.bottom, b.top + b.height, "mép dưới");
});

// cx − tâm_khung = d × (bề_ngang_khung / bề_ngang_texture).
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

// Số suy từ STANDING[PROP.sink] + cỡ ảnh nguồn, không chép số đo được.
test("bồn rửa: tâm vật lệch tâm khung 2,12 px — đúng con số suy từ bảng STANDING", () => {
  const srcW = 303, srcH = 384, h = 58, dx = -2, TW = 60;
  const w = (srcW / srcH) * h;
  const texW = Math.max(TW + 2, Math.ceil(w) + 6);
  const veTai = Math.round(texW / 2 - w / 2 + dx);
  assert.deepEqual([w, texW, veTai], [45.765625, 62, 6], "giả định về standing() đã đổi");

  const b: SpriteBox = { left: 2000, top: 3000, width: texW, height: 70 };
  const e = opaqueEdges(b, texW, 70, { left: veTai, right: veTai + w, top: 0, bottom: 58 });
  const lech = (b.left + b.width / 2) - e.cx;
  gan(lech, 2.1171875, "độ lệch hình học");
  assert.equal(Number(lech.toFixed(2)), 2.12);

  // Quét alpha thật trả về px nguyên nên mép phải làm tròn lên.
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
  for (const ss of [1, 2, 3, 4]) {
    const e = opaqueEdges({ left: L, top: T, width: 62, height: 70 }, 62 * ss, 70 * ss, {
      left: box.left * ss, right: box.right * ss, top: box.top * ss, bottom: box.bottom * ss,
    });
    gan(e.left, mot.left, `ss=${ss} left`);
    gan(e.cx, mot.cx, `ss=${ss} cx`);
    gan(e.bottom, mot.bottom, `ss=${ss} bottom`);
  }
});

// getBounds() đã tính origin, cộng thêm ở chỗ gọi là tính hai lần.
test("mép không phụ thuộc origin: cùng một khung thì cùng một kết quả", () => {
  const box: OpaqueBox = { left: 6, right: 52, top: 3, bottom: 58 };
  const w = 62, h = 70, x = 1500.5, y = -220.75;
  const mocTuongDoi = [6, 52, 3, 58, 29];
  for (const [ox, oy] of [[0.5, 1], [0, 0], [0.5, 0.5], [1, 1], [0.25, 0.8]]) {
    const b: SpriteBox = { left: x - ox * w, top: y - oy * h, width: w, height: h };
    const e = opaqueEdges(b, w, h, box);
    const tuongDoi = [e.left - b.left, e.right - b.left, e.top - b.top,
      e.bottom - b.top, e.cx - b.left];
    for (let i = 0; i < 5; i++) gan(tuongDoi[i], mocTuongDoi[i], `origin ${ox},${oy} #${i}`);
  }
  const khungCua = (ox: number, oy: number, px: number, py: number): SpriteBox =>
    ({ left: px - ox * w, top: py - oy * h, width: w, height: h });
  const k1 = khungCua(0.5, 1, x, y);
  const k2 = khungCua(0, 0, x - w / 2, y - h);
  assert.deepEqual(k1, k2, "hai cách đặt này phải ra cùng một khung — giả định đã hỏng");
  assert.deepEqual(opaqueEdges(k1, w, h, box), opaqueEdges(k2, w, h, box),
    "cùng một khung mà ra hai kết quả");
});

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

test("hộp đục một pixel: vẫn ra mép tử tế, cx nằm giữa đúng pixel ấy", () => {
  const b: SpriteBox = { left: 100, top: 200, width: 40, height: 40 };
  const e = opaqueEdges(b, 40, 40, { left: 17, right: 18, top: 9, bottom: 10 });
  assert.deepEqual([e.left, e.right, e.top, e.bottom, e.cx],
    [117, 118, 209, 210, 117.5]);
  gan(e.right - e.left, 1, "bề ngang một pixel");
});

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
