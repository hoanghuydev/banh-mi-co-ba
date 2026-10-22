import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CART, EQUIP, EQUIP_IDS, buyEquip, capacity, dirtMul, equipPatienceMul, has, newEquipState, priceVnd,
  resaleVnd, sellEquip, used, walkInMul, whyNot, type EquipId,
} from "../src/sim/equipment";
import { SIT_PATIENCE_MUL, TEA_PATIENCE_SEC } from "../src/sim/customer";
import { lotQuality, shelfDays } from "../src/sim/econ";
import { BUYABLE_TILES, MAP, isBlocked, openTilesFor, setOpenTiles } from "../src/world/map";
import { ROOT, read, walk } from "../tools/lib";
import { join } from "node:path";

test("TB-1: món nào cũng có một câu về cảm giác; món mua được thì có lợi ích quy ra số", () => {
  for (const id of EQUIP_IDS) {
    assert.ok(EQUIP[id].feel.length > 10, id);
    if (EQUIP[id].starting) continue;
    assert.ok(EQUIP[id].gain.length >= 1, `${id} không nói mua về thì được gì`);
    for (const g of EQUIP[id].gain) assert.ok(g.length > 8, `${id}: dòng lợi ích cụt — "${g}"`);
  }
});

test("TB-3 KHÔNG món nào khai nhược điểm", () => {
  const raw = read(join(ROOT, "src/content/econ/equipment.json"));
  assert.ok(!/"drawbacks"\s*:/.test(raw), "`drawbacks` còn trong dữ liệu — mua là được, không cân đo");
  assert.ok(!/\bd\.drawbacks\b/.test(read(join(ROOT, "src/ui/evening/EveningView.ts"))), "thẻ Đồ nghề còn vẽ nhược điểm");
});

test("TB-5 con số trên thẻ khớp con số trong mã", () => {
  const e = newEquipState();
  const pc = (id: EquipId, re: RegExp) => {
    const m = EQUIP[id].gain.join(" ").match(re);
    assert.ok(m, `${id}: thẻ không ghi con số nào khớp ${re}`);
    return Number(m![1]);
  };
  const owning = (id: EquipId) => ({ ...e, owned: [...e.owned, id] });

  for (const [id, rain] of [["LOA_RAO", false], ["BANG_HIEU", false]] as const) {
    const noi = pc(id, /\+(\d+)% khách lạ ghé/);
    assert.equal(Math.round((walkInMul(owning(id), rain) - 1) * 100), noi, `${id}: thẻ nói +${noi}%`);
  }
  assert.equal(Math.round((walkInMul(owning("DU_CHE"), false) - 1) * 100), pc("DU_CHE", /\+(\d+)% khách lạ ghé/));
  assert.equal(Math.round((walkInMul(owning("DU_CHE"), true) - 1) * 100), pc("DU_CHE", /mưa \+(\d+)%/));
  assert.ok(walkInMul(owning("DU_CHE"), false) > 1, "bữa nắng cái dù trừ ngược — thẻ hứa một con số dương");

  assert.equal(Math.round((1 - dirtMul(owning("LONG_BAN"))) * 100), pc("LONG_BAN", /chậm hơn (\d+)%/));
  assert.equal(dirtMul(e), 1, "chưa mua gì mà quầy đã bẩn khác mức nền — có món nào còn trừ ngược");

  assert.equal(Math.round((equipPatienceMul(owning("QUAT_DIEN")) - 1) * 100), pc("QUAT_DIEN", /\+(\d+)% kiên nhẫn/));
  assert.equal(TEA_PATIENCE_SEC, pc("BINH_TRA", /chờ thêm (\d+) giây/));
  assert.equal(Math.round((1 - SIT_PATIENCE_MUL) * 100), pc("GHE_BAN", /trôi chậm (\d+)%/));
});

test("TB-4: xe vẫn không chứa nổi mọi thứ — nhưng chỉ thiếu một hai món, không phải một bài toán", () => {
  const maxCap = CART.baseSlots + 2;                        // nền 12 + giá treo
  const allSlots = EQUIP_IDS.reduce((a, id) => a + Math.max(0, EQUIP[id].slots), 0)
    - EQUIP.LO_THAN.slots - EQUIP.THUNG_XOP.slots;          // hai món ban đầu bị thay, không cộng dồn
  assert.ok(allSlots > maxCap, `mua hết vẫn vừa xe (${allSlots} ≤ ${maxCap}) — sức chứa thôi là một lựa chọn`);
  assert.ok(allSlots - maxCap <= 4, `thiếu tới ${allSlots - maxCap} ô — chật như vậy thì lại thành bài toán`);
});

test("lúc bắt đầu: lò than + thùng xốp chiếm 4 ô, còn 8 ô trống", () => {
  const e = newEquipState();
  assert.equal(capacity(e), 12);
  assert.equal(used(e), 4);
});

test("mua tủ mát thay thùng xốp (+1 ô ròng, thùng xốp bán lại được); lò điện thay lò than (lò than không bán)", () => {
  const e = newEquipState(); const m = { cash: 10_000_000 };
  assert.equal(whyNot("TU_MAT", e, m.cash), null);
  const before = m.cash;
  buyEquip("TU_MAT", e, m);
  assert.ok(!has(e, "THUNG_XOP") && has(e, "TU_MAT"));
  assert.equal(before - m.cash, priceVnd("TU_MAT") - resaleVnd("THUNG_XOP"));
  const c2 = m.cash;
  buyEquip("LO_DIEN", e, m);
  assert.equal(c2 - m.cash, priceVnd("LO_DIEN"));
  assert.equal(used(e), 3 + 3);
});

test("bán lại = 60% giá; bán lò điện thì lò than vẫn còn đó", () => {
  const e = newEquipState(); const m = { cash: 10_000_000 };
  buyEquip("LO_DIEN", e, m);
  const v = sellEquip("LO_DIEN", e, m);
  assert.equal(v, resaleVnd("LO_DIEN"));
  assert.equal(resaleVnd("LO_DIEN"), Math.round(priceVnd("LO_DIEN") * 0.6 / 1000) * 1000);
  assert.ok(has(e, "LO_THAN"));
});

test("tủ mát: đồ lạnh để được gấp đôi (pate 2 ngày → 4), đồ chua KHÔNG đổi", () => {
  assert.equal(shelfDays("PATE", "thung_xop"), 2);
  assert.equal(shelfDays("PATE", "tu_mat"), 6);
  assert.equal(shelfDays("DO_CHUA_NL", "tu_mat"), shelfDays("DO_CHUA_NL", "thung_xop"));
  assert.equal(lotQuality({ good: "RAU", day: 1, left: 1, q0: 1 }, 2, "thung_xop"), 0.55);
  assert.equal(lotQuality({ good: "RAU", day: 1, left: 1, q0: 1 }, 2, "tu_mat"), 1.0);
});

test("TB-2: không món nào tự làm thay người chơi — không có hiệu ứng AUTO, không ai gọi assembly.commit", () => {
  for (const f of walk(join(ROOT, "src"), [".ts", ".json"])) {
    const s = read(f);
    assert.ok(!/kind:\s*["']AUTO["']/.test(s), f);
    assert.ok(!/assembly\.commit\(/.test(s), f);
  }
});

test("cái xe LÀ bảng thành tựu: không achievement / toast / progress bar ở đâu cả", () => {
  for (const f of walk(join(ROOT, "src"), [".ts"])) assert.ok(!/achievement|unlocked_toast|progress_bar/i.test(read(f)), f);
});

test("TB-6 bốn ô đạo cụ mua được trỏ vào món CÓ THẬT, và ký tự của chúng CÓ THẬT trên bản đồ", () => {
  for (const [code, id] of Object.entries(BUYABLE_TILES)) {
    assert.ok(EQUIP_IDS.includes(id as EquipId), `ô "${code}" trỏ vào món không có: ${id}`);
    assert.ok(MAP.some((row) => row.includes(code)), `ký tự "${code}" không có trên bản đồ`);
  }
});

test("TB-7 chưa mua thì ô ĐI QUA ĐƯỢC; mua rồi thì nó chặn chân như mọi đạo cụ khác", () => {
  const codes = Object.keys(BUYABLE_TILES);
  const oCua = (code: string) => {
    for (let ty = 0; ty < MAP.length; ty++) {
      const tx = MAP[ty].indexOf(code);
      if (tx >= 0) return { tx, ty };
    }
    throw new Error(`không thấy ô "${code}"`);
  };

  try {
    setOpenTiles(openTilesFor(() => false));
    for (const code of codes) {
      const { tx, ty } = oCua(code);
      assert.equal(isBlocked(tx, ty), false, `chưa mua mà ô "${code}" (${tx},${ty}) vẫn chặn chân`);
    }

    setOpenTiles(openTilesFor(() => true));
    for (const code of codes) {
      const { tx, ty } = oCua(code);
      assert.equal(isBlocked(tx, ty), true, `mua rồi mà ô "${code}" (${tx},${ty}) vẫn đi xuyên qua`);
    }

    setOpenTiles(openTilesFor((id) => id === "BINH_TRA"));
    const tra = oCua("T");
    assert.equal(isBlocked(tra.tx, tra.ty), true, "mua bình trà rồi mà ô của nó vẫn trống");
    const ghe = oCua("s");
    assert.equal(isBlocked(ghe.tx, ghe.ty), false, "mới mua bình trà mà ô ghế đã bị chiếm");
  } finally {
    // `openTiles` là trạng thái module, phải trả về cho các test sau.
    setOpenTiles([]);
  }
});

test("TB-8 ghế và bàn đi CHUNG một món — mua ghế là dọn cả hai ô, không sót cái bàn vô hình", () => {
  assert.equal(BUYABLE_TILES.s, BUYABLE_TILES.b);
  const open = openTilesFor((id) => id !== "GHE_BAN");
  assert.deepEqual(open.sort(), ["b", "s"]);
});

test("TB-9 mặc định bản đồ KHÔNG mở ô nào — đi một bản đồ nới sẵn là lưới nào cũng dễ hơn thật", () => {
  const { tx, ty } = { tx: MAP[10].indexOf("s"), ty: 10 };
  assert.equal(isBlocked(tx, ty), true, "chưa ai khai gì mà ô ghế đã mở sẵn");
});
