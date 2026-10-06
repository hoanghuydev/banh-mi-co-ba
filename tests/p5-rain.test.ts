/**
 * TRỜI MƯA — phần ĐÚNG của cơn mưa (`world/rain.ts`). Phần ĐẸP (`ui/stall/Rain.ts`)
 * không test được bằng Node, nên mọi con số mà sai thì nhìn ra ngay đều phải bị kẹp
 * ở đây.
 *
 * Ba hợp đồng, và cái thứ ba là cái dễ mất nhất:
 *
 *  1. MÁI HIÊN — mưa chỉ rơi từ hàng `SKY_FROM_Y` trở ra. Trong quán có mái: nắng
 *     không rọi tới (`isSunlit`) thì mưa cũng không tạt tới. MỘT con số cho cả hai.
 *  2. CHẠM ĐẤT — giọt rơi đúng quãng của hàng nó nhắm, không hơn không kém. Sai là
 *     vòng nước bắn nở ra giữa không trung hoặc chìm dưới mặt đường.
 *  3. GIÓ — thả lệch sang bên đúng bằng quãng gió sẽ thổi nó đi, nên gió to cỡ nào
 *     thì giọt vẫn rơi trúng chỗ đã định. Vế này là vế duy nhất có nghiệm đóng, và
 *     cũng là vế duy nhất không ai phát hiện được bằng mắt nếu nó lệch vài pixel —
 *     mưa trông vẫn như mưa, chỉ là vòng nước nở lệch khỏi chỗ giọt chạm.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { TH, TW, toScreen } from "../src/world/iso";
import { SHOPFRONT_X, SKY_FROM_Y, WORLD_H, WORLD_W, isSunlit } from "../src/world/map";
import {
  LAST_SKY_ROW, REDUCED_MUL, ROOF_PX, eaveCenterY, fallPx, isUnderSky, rainDensity,
  rainGrade, rowAtFall, spawnSx, windAt,
} from "../src/world/rain";
import type { Weather } from "../src/core/types";
import { PAL } from "../src/art/palette";

const ALL: Weather[] = ["NANG_GAT", "MAT", "AM_U", "MUA_RAO", "MUA_DAM", "OI"];
const RAINY: Weather[] = ["MUA_RAO", "MUA_DAM"];

// ───────────────────────────────────────────────────────────── 1 · mái hiên

test("mưa và nắng dùng CHUNG một mép mái — chỗ nào nắng không rọi tới thì mưa không tạt tới", () => {
  for (let ty = 0; ty < WORLD_H; ty++) {
    for (let tx = 0; tx < WORLD_W; tx++) {
      if (isSunlit(tx, ty)) {
        assert.equal(isUnderSky(ty), true, `ô (${tx},${ty}) có nắng rọi mà lại không có trời`);
      }
    }
  }
  assert.equal(isUnderSky(SKY_FROM_Y - 1), false, "hàng trong cùng của quán lại bị tính là ngoài trời");
  assert.equal(isUnderSky(SKY_FROM_Y), true, "hàng đầu tiên ngoài hiên lại bị tính là có mái");
});

test("đường mép mái chạy ĐÚNG theo hàng ngoài cùng của mái, suy từ phép chiếu", () => {
  // Lấy mấy điểm thật trên hàng `SKY_FROM_Y` rồi hỏi ngược: đường mép mái ở cột đó
  // nằm ở đâu? Phải trùng khít — nếu không thì mưa bắt đầu rơi lệch khỏi mái.
  for (const wx of [3, 7.5, 12, 20, 25]) {
    const { sx, sy } = toScreen(wx, SKY_FROM_Y);
    assert.ok(Math.abs(eaveCenterY(sx) - sy) < 1e-9, `cột x=${wx} lệch khỏi hàng mép mái`);
  }
});

test("mép mái dốc đúng dốc của lưới iso — không phải một đường ngang", () => {
  // Dốc phải là TH/TW (= 0,5): sang phải 2 px thì xuống 1 px. Một đường NGANG ở đây
  // nghĩa là mưa bắt đầu ở cùng một độ cao khắp màn hình, tức là cái mái nằm ngang
  // trong một thế giới vẽ nghiêng.
  assert.equal(eaveCenterY(2 * TW) - eaveCenterY(0), 2 * TH);
});

// ──────────────────────────────────────────────────────────── 2 · chạm đất

test("giọt rơi trúng ngay mép hiên thì rơi đúng chiều cao mái, không hơn", () => {
  assert.equal(fallPx(SKY_FROM_Y), ROOF_PX);
});

test("mỗi hàng ra xa thêm một bậc thì rơi thêm đúng một ô", () => {
  for (let wy = SKY_FROM_Y; wy <= LAST_SKY_ROW; wy++) {
    assert.equal(fallPx(wy + 1) - fallPx(wy), TH, `bậc ${wy} rơi hụt`);
  }
});

test("`rowAtFall` là nghịch đảo thật của `fallPx` — đi và về không mất pixel nào", () => {
  for (const wy of [7, 7.6, 9.25, 12.4, 16.5]) {
    assert.ok(Math.abs(rowAtFall(fallPx(wy)) - wy) < 1e-9, `hàng ${wy} đi về không khớp`);
  }
});

test("hàng khách đứng chờ CÓ mưa rơi tới, và vệt đủ dài để đọc ra là mưa", () => {
  // y7,6 là chỗ người đứng đầu hàng (QUEUE_SLOTS). Nếu quãng rơi ở đó quá ngắn thì
  // đúng chỗ người chơi nhìn nhiều nhất lại là chỗ mưa trông như mấy cái gạch nhấp nháy.
  const d = fallPx(7.6);
  assert.ok(d >= 90, `giọt rơi xuống hàng khách chỉ đi được ${d} px`);
});

test("mặt tiền quán — chỗ mái nhỏ nước — suy từ dãy ô quầy, không gõ tay", () => {
  assert.ok(SHOPFRONT_X.hi > SHOPFRONT_X.lo + 10, "mặt tiền ngắn bất thường");
  assert.ok(SHOPFRONT_X.lo >= 1 && SHOPFRONT_X.hi <= WORLD_W, "mặt tiền tràn ra ngoài bản đồ");
});

// ───────────────────────────────────────────────────────────────── 3 · gió

/** Mô phỏng lại đúng việc hạt làm: thả ở `spawnSx` trên mép mái rồi để gió kéo đi. */
function landing(tx: number, ty: number, lean: number, eaveC: number) {
  const sx = spawnSx(tx, ty, lean, eaveC);
  const sy = sx * (TH / TW) + eaveC;
  return { x: sx + lean * (ty - sy), y: ty, from: { x: sx, y: sy } };
}

test("gió nghiêng cỡ nào thì giọt vẫn rơi TRÚNG chỗ đã định", () => {
  const eaveC = SKY_FROM_Y * TH + TH / 2 + 6 - ROOF_PX;   // hằng số thật của cảnh quán
  for (const deg of [-12, -7, 0, 3, 7, 12]) {
    const lean = Math.tan((deg * Math.PI) / 180);
    for (const [tx, ty] of [[0, 300], [-240, 180], [600, 640], [120, 250]]) {
      const hit = landing(tx, ty, lean, eaveC);
      assert.ok(Math.abs(hit.x - tx) < 1e-9, `gió ${deg}°: rơi lệch ${hit.x - tx} px`);
    }
  }
});

test("thả ở ĐÚNG trên mép mái, không phải lơ lửng giữa trời hay chui dưới mái", () => {
  const eaveC = SKY_FROM_Y * TH + TH / 2 + 6 - ROOF_PX;
  for (const deg of [0, 9]) {
    const lean = Math.tan((deg * Math.PI) / 180);
    const { from } = landing(140, 420, lean, eaveC);
    assert.ok(Math.abs(from.y - (from.x * (TH / TW) + eaveC)) < 1e-9, `gió ${deg}°: chỗ thả rời khỏi mép mái`);
  }
});

test("gió thổi sang phải thì thả lệch sang TRÁI — không bao giờ ngược lại", () => {
  const eaveC = SKY_FROM_Y * TH + TH / 2 + 6 - ROOF_PX;
  const thang = spawnSx(200, 500, 0, eaveC);
  const gio = spawnSx(200, 500, Math.tan(0.2), eaveC);
  assert.ok(gio < thang, "gió tạt mà chỗ thả lại chạy theo chiều gió — vệt mưa sẽ đi ngược chiều");
});

// ───────────────────────────────────────────────────── mật độ & lớp phủ

test("chỉ hai kiểu trời có mưa; bốn kiểu còn lại KHÔNG dựng lớp mưa nào", () => {
  for (const w of ALL) {
    const on = RAINY.includes(w);
    assert.equal(rainDensity(w, false) !== null, on, `${w}: mật độ mưa sai`);
    assert.equal(rainGrade(w) !== null, on, `${w}: lớp phủ sai`);
  }
});

test("mưa rào nặng hơn mưa dầm ở CẢ BA mặt: hạt, gió, độ tối", () => {
  const rao = rainDensity("MUA_RAO", false)!, dam = rainDensity("MUA_DAM", false)!;
  assert.ok(rao.drops > dam.drops, "mưa rào mà thưa hạt hơn mưa dầm");
  assert.ok(rao.windDeg > dam.windDeg, "mưa rào mà lặng gió hơn mưa dầm");
  assert.ok(rainGrade("MUA_RAO")! > rainGrade("MUA_DAM")!, "mưa rào mà sáng hơn mưa dầm");
});

test("P5-01 §2.3 mục 10 — giảm chuyển động: 25% mật độ, BỎ LAY GIÓ, mưa vẫn còn", () => {
  for (const w of RAINY) {
    const full = rainDensity(w, false)!, less = rainDensity(w, true)!;
    assert.ok(Math.abs(less.drops - full.drops * REDUCED_MUL) < 1e-9, `${w}: không phải 25% mật độ`);
    assert.ok(Math.abs(less.drips - full.drips * REDUCED_MUL) < 1e-9, `${w}: giọt mái không giảm theo`);
    assert.equal(less.gustDeg, 0, `${w}: còn lay gió`);
    assert.equal(less.windDeg, full.windDeg, `${w}: bỏ luôn cả độ nghiêng, không chỉ bỏ lay`);
    // Mục 10 nói GIẢM, không nói XOÁ (khác hẳn mục 3 "lá bay / bụi" là xoá hẳn):
    // mưa là một sự kiện của thế giới, xoá sạch là người bật trợ năng mất một tin.
    assert.ok(less.drops > 0, `${w}: giảm chuyển động mà tắt hẳn mưa`);
  }
});

test("lay gió dao động QUANH góc nền, không bao giờ lật ngược chiều gió", () => {
  const d = rainDensity("MUA_RAO", false)!;
  let lo = Infinity, hi = -Infinity;
  for (let t = 0; t < 40_000; t += 97) {
    const a = windAt(d, t);
    lo = Math.min(lo, a); hi = Math.max(hi, a);
  }
  assert.ok(lo > 0, `gió đổi chiều (thấp nhất ${lo.toFixed(2)}°) — cả màn mưa sẽ lật qua lật lại`);
  assert.ok(hi <= d.windDeg + d.gustDeg + 1e-9, "lay quá biên độ đã khai");
  assert.ok(hi - lo > d.gustDeg, "khai có lay gió mà thực tế đứng im");
});

test("giảm chuyển động thì gió ĐỨNG YÊN hẳn — không còn một nhịp đung đưa nào", () => {
  const d = rainDensity("MUA_DAM", true)!;
  const a = windAt(d, 0);
  for (let t = 0; t < 20_000; t += 311) assert.equal(windAt(d, t), a);
});

test("lớp phủ chỉ HẠ TÔNG, không bôi đen: thấy là trời mưa, không phải trời tối", () => {
  for (const w of RAINY) {
    const a = rainGrade(w)!;
    /*
     * `alpha` = phần sáng bị tấm phủ ăn mất. Bản cũ theo spec hai lớp của P5-02 §2.1.5 ăn gần một
     * nửa và trên khung hình thật đọc ra là "tối thui" — xem ghi chú ở `world/rain.rainGrade`.
     * Mưa nói bằng HẠT và NỀN ƯỚT; tấm phủ chỉ hạ tông chừng 10%.
     *
     * Dưới 0,05 là không còn đổi gì (bỏ hẳn tấm phủ cho rồi); trên 0,15 là bò trở lại chỗ cũ —
     * mà từ khi bỏ đèn trong quán thì không còn gì kéo khu làm việc sáng lại nữa.
     */
    assert.ok(a >= 0.05 && a <= 0.15, `${w}: lớp phủ alpha ${a} ngoài khoảng cho phép`);
  }
});

test("hạ tông 10% thì mặt người VẪN đọc được — mức xám còn lại không tụt quá một bậc", () => {
  /*
   * Kiểm cái mà alpha chỉ nói gián tiếp: một mảng sáng (mặt người, ổ bánh, áo trắng) sau khi
   * qua tấm phủ còn lại bao nhiêu. `d ↦ d·(1−a) + grade·a`.
   */
  const rgb = (hex: number) => [(hex >> 16) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
  for (const w of RAINY) {
    const a = rainGrade(w)!;
    for (let i = 0; i < 3; i++) {
      const out = 1 * (1 - a) + rgb(PAL.rain.grade)[i] * a;
      assert.ok(out >= 0.85, `${w} kênh ${i}: trắng tụt xuống ${out.toFixed(3)} — tối quá`);
      assert.ok(out <= 0.99, `${w} kênh ${i}: trắng còn ${out.toFixed(3)} — tấm phủ không làm gì`);
    }
  }
});
