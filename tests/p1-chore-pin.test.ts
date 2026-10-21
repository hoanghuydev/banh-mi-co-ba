import { test } from "node:test";
import assert from "node:assert/strict";
import { chorePin, type PinOpts, type ViewRect } from "../src/ui/chorePin";

// Lề lấy số thật và gốc khung cố ý khác (0, 0) để lộ lỗi lẫn toạ độ khung/màn hình.
const V: ViewRect = { left: 1000, right: 1800, top: 500, bottom: 950 };
const O: PinOpts = { edge: 19, top: 58 };

const x0 = V.left + O.edge, x1 = V.right - O.edge;
const y0 = V.top + O.top, y1 = V.bottom - O.edge;
const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;

function moved(dx: number, dy: number): ViewRect {
  return { left: V.left + dx, right: V.right + dx, top: V.top + dy, bottom: V.bottom + dy };
}

function onScreen(ax: number, ay: number, v: ViewRect) {
  return ax > v.left && ax < v.right && ay > v.top && ay < v.bottom;
}

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

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
  assert.ok(n > 15_000, `quét quá thưa, mới ${n} điểm`);
});

test("việc còn trong khung mà nằm dưới dải icon: chỉ bị đẩy XUỐNG, x không đổi", () => {
  for (let ax = x0; ax <= x1; ax += 3) {
    for (let ay = V.top + 0.5; ay < y0; ay += 1) {
      const p = chorePin(ax, ay, V, O);
      assert.equal(p.x, ax, `x bị đẩy tại (${ax}, ${ay})`);
      assert.equal(p.y, y0, `y không dừng đúng ở mép vùng vẽ tại (${ax}, ${ay})`);
      assert.equal(p.pinned, false, "còn trong khung mà bị tính là ghim");
    }
  }
});

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

test("cờ `pinned` đúng bằng phép thử ra-khỏi-khung-thật, không phải khung đã trừ lề", () => {
  const rnd = lcg(20251001);
  for (let i = 0; i < 20_000; i++) {
    const ax = V.left - 400 + rnd() * 1600, ay = V.top - 400 + rnd() * 1250;
    assert.equal(chorePin(ax, ay, V, O).pinned, !onScreen(ax, ay, V),
      `sai cờ tại (${ax}, ${ay})`);
  }
});

test("việc ra hẳn ngoài khung: dấu nằm ĐÚNG trên viền vùng vẽ, không trong không ngoài", () => {
  const rnd = lcg(7);
  for (let i = 0; i < 20_000; i++) {
    const a = rnd() * Math.PI * 2, r = 500 + rnd() * 4000;
    const ax = cx + Math.cos(a) * r, ay = cy + Math.sin(a) * r;
    const p = chorePin(ax, ay, V, O);
    assert.equal(p.pinned, true);
    assert.ok(p.x >= x0 - 1e-9 && p.x <= x1 + 1e-9, `x ra ngoài: ${p.x}`);
    assert.ok(p.y >= y0 - 1e-9 && p.y <= y1 + 1e-9, `y ra ngoài: ${p.y}`);
    const onEdge = Math.min(Math.abs(p.x - x0), Math.abs(p.x - x1),
      Math.abs(p.y - y0), Math.abs(p.y - y1));
    assert.ok(onEdge < 1e-6, `không chạm viền nào, cách ${onEdge} tại (${ax}, ${ay})`);
  }
});

test("ghim đúng phía theo TỪNG TRỤC, trục còn lại báo đúng toạ độ thật", () => {
  const xs = [V.left - 5000, V.left - 1, V.left, V.left + 1, x0, cx,
    x1, V.right - 1, V.right, V.right + 5000];
  const ys = [V.top - 5000, V.top - 1, V.top, V.top + 1, y0 - 1, y0, cy,
    y1, V.bottom - 1, V.bottom, V.bottom + 5000];
  for (const ax of xs) {
    for (const ay of ys) {
      const p = chorePin(ax, ay, V, O);
      const ten = `(${ax}, ${ay})`;
      if (ax <= V.left) assert.equal(p.x, x0, `${ten}: việc bên trái mà dấu không ở lề trái`);
      else if (ax >= V.right) assert.equal(p.x, x1, `${ten}: việc bên phải mà dấu không ở lề phải`);
      else if (ax >= x0 && ax <= x1) assert.equal(p.x, ax, `${ten}: x còn chỗ mà vẫn bị dời`);
      if (ay <= V.top) assert.equal(p.y, y0, `${ten}: việc ở trên mà dấu không ở lề trên`);
      else if (ay >= V.bottom) assert.equal(p.y, y1, `${ten}: việc ở dưới mà dấu không ở lề dưới`);
      else if (ay >= y0 && ay <= y1) assert.equal(p.y, ay, `${ten}: y còn chỗ mà vẫn bị dời`);
      if (ax <= V.left) assert.notEqual(p.x, x1, `${ten}: ghim ngược sang phải`);
      if (ax >= V.right) assert.notEqual(p.x, x0, `${ten}: ghim ngược sang trái`);
      if (ay <= V.top) assert.notEqual(p.y, y1, `${ten}: ghim ngược xuống dưới`);
      if (ay >= V.bottom) assert.notEqual(p.y, y0, `${ten}: ghim ngược lên trên`);
    }
  }
});

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

test("kẹp hai lần bằng kẹp một lần — không có cú trôi tích luỹ", () => {
  const rnd = lcg(808);
  for (let i = 0; i < 20_000; i++) {
    const ax = V.left - 2000 + rnd() * 4800, ay = V.top - 2000 + rnd() * 4450;
    const p = chorePin(ax, ay, V, O);
    const q = chorePin(p.x, p.y, V, O);
    assert.deepEqual([q.x, q.y], [p.x, p.y], `trôi khi kẹp lại tại (${ax}, ${ay})`);
  }
});

// dấu(δ) − dấu(0) = δ + [clamp(a−δ) − clamp(a)] ∈ [0, δ], nên trần đúng 1 px mỗi px camera.
const BUOC_TOI_DA = 1.0;

test("camera trượt từng pixel thì dấu bò theo từng pixel — kể cả lúc việc vượt mép", () => {
  const rnd = lcg(1234);
  let doMaxX = 0, doMaxY = 0, soLanChuyen = 0;
  for (let lan = 0; lan < 400; lan++) {
    // Nửa số lượt bắt đầu trong khung để chắc chắn đi qua chỗ vượt mép.
    const batDauTrong = lan % 2 === 0;
    const ax = batDauTrong ? V.left + 20 + rnd() * 760 : V.left - 900 + rnd() * 2600;
    const ay = batDauTrong ? V.top + 20 + rnd() * 410 : V.top - 900 + rnd() * 2250;
    const bx = Math.round(rnd() * 2 - 1), by = Math.round(rnd() * 2 - 1);
    if (bx === 0 && by === 0) continue;
    let truoc: { x: number; y: number; pinned: boolean } | null = null;
    for (let k = 0; k < 600; k++) {
      const p = chorePin(ax, ay, moved(bx * k, by * k), O);
      if (truoc) {
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
  assert.ok(soLanChuyen > 100, `mới qua chỗ chuyển ${soLanChuyen} lần, quá ít để tin`);
  assert.ok(doMaxX > 0.99 && doMaxY > 0.99,
    `quét chưa chạm trần: x ${doMaxX.toFixed(3)}, y ${doMaxY.toFixed(3)}`);
});

test("camera đi đều một chiều: dấu bò đều một chiều, không lắc qua lắc lại", () => {
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
  assert.ok(truoc < O.edge + 1e-9, `cuối lượt dấu chưa về sát mép trái: ${truoc}`);
});

test("việc nằm trên đỉnh màn hình: dấu bám lề trên, đứng im theo chiều dọc", () => {
  const ax = cx + 2000, ay = V.top - 600;
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

// Đường kính dấu (CHORE_R = 11): nhảy quá mức này là hai vòng tròn rời hẳn nhau.
const NHAY_TOI_DA = 2 * 11;

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
    soi(V.left + k, V.top, 0, -1);
    soi(V.left + k, V.bottom, 0, 1);
  }
  for (let k = 1; k < 450; k++) {
    soi(V.left, V.top + k, -1, 0);
    soi(V.right, V.top + k, 1, 0);
  }
  assert.ok(te <= NHAY_TOI_DA, `dấu nhảy ${te.toFixed(1)} px tại ${moTa}`);
  assert.ok(te <= 2 * eps + 1e-12,
    `nhảy ${te} px cho đầu vào dời ${2 * eps} px — phép kẹp đang giãn, tại ${moTa}`);
});

test("cái lò trôi khỏi đỉnh màn hình: dấu bò đúng 1 px, không nhảy", () => {
  const ax = x0, ay = V.top + 300;
  let truoc: { x: number; y: number } | null = null, te = 0, daGhim = false;
  for (let k = 0; k <= 400; k++) {
    const v = moved(0, k);
    const p = chorePin(ax, ay, v, O);
    daGhim ||= p.pinned;
    if (truoc) te = Math.max(te, Math.hypot(p.x - truoc.x, p.y - truoc.y));
    truoc = p;
  }
  assert.ok(daGhim, "lượt này phải đi qua chỗ cái việc vượt mép, không thì chẳng kiểm gì");
  assert.ok(te <= NHAY_TOI_DA, `dấu nhảy ${te.toFixed(1)} px cho đúng 1 px camera`);
  assert.ok(te <= 1 + 1e-9, `dấu bò ${te.toFixed(4)} px cho đúng 1 px camera`);
});

function lanhLan(p: { x: number; y: number }, v: ViewRect, ghiChu: string) {
  assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), `${ghiChu}: ra NaN/∞`);
  const lo = Math.min(v.left, v.right), hi = Math.max(v.left, v.right);
  const tren = Math.min(v.top, v.bottom), duoi = Math.max(v.top, v.bottom);
  assert.ok(p.x >= lo - 1e-9 && p.x <= hi + 1e-9, `${ghiChu}: x = ${p.x} ra ngoài khung`);
  assert.ok(p.y >= tren - 1e-9 && p.y <= duoi + 1e-9, `${ghiChu}: y = ${p.y} ra ngoài khung`);
}

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

test("việc ở đúng tâm: dấu nằm nguyên tại đó, không bị tính là ghim", () => {
  for (const [ax, ay] of [[(V.left + V.right) / 2, (V.top + V.bottom) / 2], [cx, cy]]) {
    const p = chorePin(ax, ay, V, O);
    assert.deepEqual([p.x, p.y, p.pinned], [ax, ay, false]);
  }
});

test("khung quá hẹp để chứa hai lề: vẫn ra số tử tế, rơi về giữa khung", () => {
  const hep: ViewRect[] = [
    { left: 1000, right: 1030, top: 500, bottom: 530 },
    { left: 1000, right: 1800, top: 500, bottom: 540 },
    { left: 1000, right: 1020, top: 500, bottom: 950 },
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

test("khung thấp hơn lề trên mà việc đang ở TRONG khung: dấu vẫn nằm trong khung", () => {
  const v: ViewRect = { left: 0, right: 800, top: 0, bottom: 50 };
  const p = chorePin(400, 25, v, O);
  assert.ok(p.y <= v.bottom, `dấu rơi xuống y = ${p.y}, đáy khung ở ${v.bottom}`);
  assert.deepEqual([p.x, p.y, p.pinned], [400, 25, true]);
  for (const [ax, ay] of [[0, 0], [799, 49], [400, 1], [-500, 25]]) {
    const q = chorePin(ax, ay, v, O);
    lanhLan(q, v, `khung bẹt, việc (${ax}, ${ay})`);
    assert.deepEqual([q.x, q.y], [400, 25]);
  }
});

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

test("liền mạch ở biên với MỌI cỡ lề, không chỉ cỡ đang dùng", () => {
  const eps = 1e-7;
  const cacLe: PinOpts[] = [
    { edge: 0, top: 0 },
    { edge: 1, top: 1 },
    { edge: 19, top: 58 },
    { edge: 19, top: 116 },
    { edge: 60, top: 180 },
    { edge: 19, top: 0 },
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

test("cỡ chữ 200%: lề trên gấp đôi mà ba luật vẫn đứng", () => {
  const O2: PinOpts = { edge: 19, top: 116 };
  const a0 = V.left + O2.edge, a1 = V.right - O2.edge;
  const b0 = V.top + O2.top, b1 = V.bottom - O2.edge;
  for (let ax = a0; ax <= a1; ax += 7) {
    for (let ay = b0; ay <= b1; ay += 7) {
      const p = chorePin(ax, ay, V, O2);
      assert.deepEqual([p.x, p.y, p.pinned], [ax, ay, false]);
    }
  }
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
  let truoc: { x: number; y: number } | null = null, te = 0;
  for (let k = 0; k <= 500; k++) {
    const p = chorePin(a0, V.top + 300, moved(0, k), O2);
    if (truoc) te = Math.max(te, Math.hypot(p.x - truoc.x, p.y - truoc.y));
    truoc = p;
  }
  assert.ok(te <= 1 + 1e-9, `ở cỡ chữ 200% dấu bò ${te.toFixed(4)} px cho 1 px camera`);
});

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

test("mọi đầu vào hợp lệ: dấu luôn nằm TRONG khung nhìn", () => { quet(lanhLan); });
