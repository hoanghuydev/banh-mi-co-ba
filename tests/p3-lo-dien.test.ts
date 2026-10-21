import { test } from "node:test";
import assert from "node:assert/strict";
import { newGame } from "../src/core/save";
import { buyEquip, has, priceVnd } from "../src/sim/equipment";
import { CRUST, OVEN_DIEN, Oven, bandOfCrust, ovenFor } from "../src/sim/oven";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../tools/lib";

function nuong(o: Oven) {
  o.put(1);
  let t = 0, gion = -1, sem = -1;
  while (t < 200) {
    o.tick(0.02); t += 0.02;
    const c = o.slots[0]!.crust;
    if (gion < 0 && c >= CRUST.READY) gion = t;
    if (sem < 0 && c >= o.singeAt) sem = t;
    if (c > o.burnAt) return { toiGion: gion, daiGion: sem - gion, gionToiChay: t - gion };
  }
  throw new Error("ổ không bao giờ cháy — `tick` hay `burnAt` hỏng");
}

const than = () => nuong(ovenFor(false));
const gas = () => nuong(ovenFor(true));

test("LG-1 người chơi mua được lò điện, và cái lò sáng mai dựng lên LÀ lò điện", () => {
  const w = newGame("gas", "gas");
  assert.ok(!has(w.equipment, "LO_DIEN") && has(w.equipment, "LO_THAN"), "ván mới đã có sẵn lò điện");
  assert.equal(ovenFor(has(w.equipment, "LO_DIEN")).rateMul, 1, "chưa mua mà lò đã chạy hệ số gas");

  w.money.cash = priceVnd("LO_DIEN") + 1_000_000;
  assert.ok(buyEquip("LO_DIEN", w.equipment, w.money), "bấm mua mà không mua được");
  assert.ok(has(w.equipment, "LO_DIEN") && !has(w.equipment, "LO_THAN"), "lò than chưa được thay");

  const o = ovenFor(has(w.equipment, "LO_DIEN"));
  assert.equal(o.rateMul, OVEN_DIEN.rateMul);
  assert.equal(o.singeAt, OVEN_DIEN.singeAt);
  assert.equal(o.burnAt, OVEN_DIEN.burnAt);
});

test("LG-2 `StallScene` KHÔNG tự chế lại ba con số đó — nó phải gọi `ovenFor`", () => {
  const src = readFileSync(join(ROOT, "src/scenes/StallScene.ts"), "utf8");
  assert.match(src, /this\.oven = ovenFor\(/, "scene dựng lò bằng tay — lưới này lại thành mù");
  assert.ok(!/oven\.rateMul\s*=/.test(src), "scene còn gán `rateMul` thẳng — hai chỗ sẽ lệch nhau");
  assert.ok(!/oven\.singeAt\s*=/.test(src), "scene còn gán `singeAt` thẳng");
  assert.ok(!/oven\.burnAt\s*=/.test(src), "scene còn gán `burnAt` thẳng");
});

test("LG-3 nướng nhanh hơn — và 'nhanh hơn' đo bằng giây, không bằng hệ số", () => {
  const a = than().toiGion, b = gas().toiGion;
  // Tốc độ ×1,35 là thời gian ÷1,35 = −26%, không phải nhanh hơn 35%.
  assert.ok(b < a, `lò điện nướng CHẬM hơn (${a.toFixed(1)}s → ${b.toFixed(1)}s)`);
  const nhanh = ((a - b) / a) * 100;
  assert.ok(nhanh > 20 && nhanh < 30, `nhanh hơn ${nhanh.toFixed(0)}% — thẻ ghi 25%`);
});

test("LG-4 DẢI GIÒN rộng ra, không co lại — đây là chỗ cả lỗi cũ nằm", () => {
  const a = than().daiGion, b = gas().daiGion;
  assert.ok(b > a, `dải giòn CO LẠI (${a.toFixed(1)}s → ${b.toFixed(1)}s) — lò điện lại làm khó bánh ngon`);
  const rong = ((b - a) / a) * 100;
  assert.ok(rong > 40 && rong < 55, `dải giòn rộng thêm ${rong.toFixed(0)}% — thẻ ghi 45%`);
});

test("LG-5 khó cháy hơn: quãng từ giòn tới cháy dài ra", () => {
  const a = than().gionToiChay, b = gas().gionToiChay;
  assert.ok(b > a, `giòn→cháy NGẮN lại (${a.toFixed(1)}s → ${b.toFixed(1)}s) — lò điện làm dễ cháy hơn`);
  const rong = ((b - a) / a) * 100;
  assert.ok(rong > 20 && rong < 35, `rộng thêm ${rong.toFixed(0)}% — thẻ ghi 11,6 → 14,7 giây`);
});

test("LG-6 ổ crust 1,0 ra từ lò điện là ổ GIÒN; đúng ổ đó ra từ lò than là ổ SÉM", () => {
  assert.equal(bandOfCrust(1.0, CRUST.BURNT, CRUST.SINGED), "SINGED", "lò than: 1,0 phải là sém");
  assert.equal(bandOfCrust(1.0, OVEN_DIEN.burnAt, OVEN_DIEN.singeAt), "CRISP", "lò điện: 1,0 phải là GIÒN");
});

test("LG-7 `serveDish` nhận `singeAt` của CHÍNH cái lò — không thì lời khen thành lời chê", async () => {
  const scene = readFileSync(join(ROOT, "src/scenes/StallScene.ts"), "utf8");
  assert.match(scene, /burnAt: this\.oven\.burnAt, singeAt: this\.oven\.singeAt/,
    "`serveDish` không nhận `singeAt` — ổ giòn của lò điện sẽ bị chấm là cháy cạnh");
  const svc = readFileSync(join(ROOT, "src/sim/service.ts"), "utf8");
  assert.match(svc, /const singeAt = opts\.singeAt \?\? CRUST\.SINGED;/, "`Service` bỏ qua `singeAt`");
  assert.match(svc, /bandOfCrust\(opts\.crust, burnAt, singeAt\)/, "`serveDish` chấm bánh bằng hằng số dùng chung");
});

test("LG-9 mua lò điện thì ô lò ĐỔI ẢNH — không dán thêm một vật vẽ bằng code cạnh lò than", () => {
  // Đọc mã vì `art/` import Phaser, test node không có `window`.
  const art = readFileSync(join(ROOT, "src/art/index.ts"), "utf8");
  assert.match(art, /case "O": return opts\.eOven \? PROP\.ovenE : PROP\.oven;/,
    "ô `O` không đổi ảnh theo đồ nghề — mua lò xong vẫn thấy đúng cái lò than");

  const props = readFileSync(join(ROOT, "src/art/props.ts"), "utf8");
  assert.match(props, /ovenE: "oven_e"/, "`PROP.ovenE` chưa có — không có texture nào để đổi sang");
  assert.ok(!/oven: "oven_e"|ovenE: "oven"/.test(props), "hai cái lò dùng chung một key texture");

  const scene = readFileSync(join(ROOT, "src/scenes/StallScene.ts"), "utf8");
  const ve = scene.slice(scene.indexOf("private drawEquipment()"), scene.indexOf("private get hasFinale()"));
  assert.ok(!/has\(e, "LO_DIEN"\)/.test(ve),
    "`drawEquipment` còn vẽ cái lò bằng code — nâng cấp phải THAY vật đang đứng đó, không dán thêm một cái hộp cạnh nó");
  assert.match(scene, /eOven,/, "`placeProps` không nói cho `textureForTile` biết đang có lò nào");
  assert.match(scene, /key === PROP\.ovenE && !this\.textures\.exists\(key\)/,
    "thiếu đường lùi khi ảnh chưa về — `ovenE` chỉ có ảnh thật, hỏng là chỗ lò trống trơn");
});

test("LG-10 ảnh lò điện có thật trong `public/art`, và `photo.ts` có khai nó", () => {
  assert.ok(existsSync(join(ROOT, "public/art/prop_e-oven.png")), "thiếu file ảnh — ô lò sẽ lùi về lò than");
  assert.match(readFileSync(join(ROOT, "src/art/photo.ts"), "utf8"), /\[PROP\.ovenE\]: \["prop_e-oven"/,
    "`photo.ts` chưa nạp ảnh lò điện — texture `oven_e` sẽ không bao giờ tồn tại");
});

test("LG-8 lò than KHÔNG đổi một li — lưới này không được âm thầm buff cả hai lò", () => {
  const o = ovenFor(false);
  assert.equal(o.rateMul, 1);
  assert.equal(o.singeAt, CRUST.SINGED);
  assert.equal(o.burnAt, CRUST.BURNT);
  const t = than();
  assert.ok(Math.abs(t.toiGion - 6.5) < 0.3, `lò than tới giòn ${t.toiGion.toFixed(1)}s, trước giờ là 6,5s`);
  assert.ok(Math.abs(t.daiGion - 5.9) < 0.3, `dải giòn lò than ${t.daiGion.toFixed(1)}s, trước giờ là 5,9s`);
});

test("LG-11 vạch chia trên vòng độ giòn đọc `oven.singeAt`, không đọc hằng số dùng chung", () => {
  const src = readFileSync(join(ROOT, "src/scenes/StallScene.ts"), "utf8");
  const ve = src.slice(src.indexOf("private drawOven()"), src.indexOf("private drawChores()"));

  assert.ok(!/\[CRUST\.READY, CRUST\.SINGED\]/.test(ve),
    "vạch chia còn khắc ở hằng số `CRUST.SINGED` — với lò điện nó lệch 22% cả vòng so với chỗ màu đổi");
  assert.match(ve, /for \(const n of \[CRUST\.READY, singeAt\]\)/, "vạch thứ hai không bám `oven.singeAt`");
  assert.match(ve, /const burnAt = this\.oven\.burnAt, singeAt = this\.oven\.singeAt;/,
    "`drawOven` không lấy ngưỡng từ chính cái lò đang dùng");
  assert.match(ve, /g\.lineStyle\(4, RAW_COL, 0\.22\)/, "thiếu cung nền nấc NON");
  assert.match(ve, /g\.lineStyle\(4, CRISP_COL, 0\.3\)/, "thiếu cung nền nấc GIÒN");
  assert.match(ve, /g\.lineStyle\(4, SINGE_COL, 0\.3\)/, "thiếu cung nền nấc SÉM");

  for (const hasDien of [false, true]) {
    const o = ovenFor(hasDien);
    const vach = o.singeAt / o.burnAt;
    const mau = o.singeAt / o.burnAt;
    assert.equal(vach, mau);
    if (hasDien) {
      const cu = CRUST.SINGED / o.burnAt;
      assert.ok(Math.abs(mau - cu) > 0.15, `hằng số cũ chỉ lệch ${((mau - cu) * 100).toFixed(1)}% — lưới này mất chỗ bám`);
    }
  }
});
