/**
 * Cây thiết bị: mấy luật gốc còn lại sau đợt rút gọn + các đường nối vào hệ khác.
 *
 * Đợt này bỏ sáu món (dao bén, thớt riêng, khung gia cố, khăn ba màu, thùng rác nắp đạp, vòi +
 * bồn rửa) và đổi `drawbacks` thành `gain` — lợi ích quy ra chỉ số. Lưới mới quan trọng nhất là
 * TB-5: con số trên THẺ phải khớp con số trong MÃ, vì giờ người chơi đọc được nó.
 */
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
    if (EQUIP[id].starting) continue;              // lò than / thùng xốp: có sẵn, không phải lời mời
    assert.ok(EQUIP[id].gain.length >= 1, `${id} không nói mua về thì được gì`);
    for (const g of EQUIP[id].gain) assert.ok(g.length > 8, `${id}: dòng lợi ích cụt — "${g}"`);
  }
});

test("TB-3 đã gỡ: KHÔNG món nào còn khai nhược điểm (chủ dự án: \"không cần nhược điểm món đồ\")", () => {
  const raw = read(join(ROOT, "src/content/econ/equipment.json"));
  assert.ok(!/"drawbacks"\s*:/.test(raw), "`drawbacks` còn trong dữ liệu — mua là được, không cân đo");
  // Đọc CHỖ DÙNG (`d.drawbacks`), không bắt chữ trong chú thích — chú thích còn nói tới nó là đúng,
  // vì người sau cần biết khối đó từng ở đâu và tại sao đi.
  assert.ok(!/\bd\.drawbacks\b/.test(read(join(ROOT, "src/ui/evening/EveningView.ts"))), "thẻ Đồ nghề còn vẽ nhược điểm");
});

/**
 * TB-5 — DÒNG CHỮ PHẢI KHỚP CON SỐ.
 *
 * Thẻ ghi "+20% khách ghé" là một hợp đồng, không phải chữ trang trí: người chơi quyết mua bằng
 * nó. Lưới này đọc chính con số trong `walkInMul` / `dirtMul` / `equipPatienceMul` rồi đối chiếu
 * với phần trăm viết trên thẻ, nên sửa một bên mà quên bên kia là đỏ ngay — chứ không im lặng
 * nói dối người chơi suốt một bản dựng.
 */
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
  // cái dù hứa HAI con số (nắng/mưa) và không được âm ở bên nào
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
  const maxCap = CART.baseSlots + 2;                        // nền 12 + giá treo (khung gia cố đã bỏ)
  const allSlots = EQUIP_IDS.reduce((a, id) => a + Math.max(0, EQUIP[id].slots), 0)
    - EQUIP.LO_THAN.slots - EQUIP.THUNG_XOP.slots;          // hai món đầu mùa bị thay chứ không cộng dồn
  assert.ok(allSlots > maxCap, `mua hết vẫn vừa xe (${allSlots} ≤ ${maxCap}) — sức chứa thôi là một lựa chọn`);
  assert.ok(allSlots - maxCap <= 4, `thiếu tới ${allSlots - maxCap} ô — chật như vậy thì lại thành bài toán`);
});

test("đầu mùa: lò than + thùng xốp chiếm 4 ô, còn 8 ô trống", () => {
  const e = newEquipState();
  assert.equal(capacity(e), 12);
  assert.equal(used(e), 4);
});

test("mua tủ mát thay thùng xốp (+1 ô ròng, thùng xốp bán lại được); lò điện thay lò than (lò của cô Ba không bán)", () => {
  const e = newEquipState(); const m = { cash: 10_000_000 };
  // Tủ mát KHÔNG còn cổng `requiresAny`: hai món nó từng đòi (thớt riêng / vòi rửa) đã bỏ.
  assert.equal(whyNot("TU_MAT", e, m.cash, 30, {}), null);
  const before = m.cash;
  buyEquip("TU_MAT", e, m);
  assert.ok(!has(e, "THUNG_XOP") && has(e, "TU_MAT"));
  assert.equal(before - m.cash, priceVnd("TU_MAT") - resaleVnd("THUNG_XOP"));
  const c2 = m.cash;
  buyEquip("LO_DIEN", e, m);
  assert.equal(c2 - m.cash, priceVnd("LO_DIEN"));                          // lò than không bán lại
  assert.equal(used(e), 3 + 3);                                           // tủ mát 3 + lò điện 3
});

test("bán lại = 60% giá; bán lò điện thì lò than của cô Ba vẫn còn đó", () => {
  const e = newEquipState(); const m = { cash: 10_000_000 };
  buyEquip("LO_DIEN", e, m);
  const v = sellEquip("LO_DIEN", e, m);
  assert.equal(v, resaleVnd("LO_DIEN"));
  assert.equal(resaleVnd("LO_DIEN"), Math.round(priceVnd("LO_DIEN") * 0.6 / 1000) * 1000);
  assert.ok(has(e, "LO_THAN"));
});

test("tủ mát: đồ lạnh để được gấp đôi (pate 2 ngày → 4), đồ chua KHÔNG đổi", () => {
  assert.equal(shelfDays("PATE_NHA", "thung_xop"), 2);
  assert.equal(shelfDays("PATE_NHA", "tu_mat"), 6);
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

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * ĐỒ CHƯA MUA THÌ KHÔNG ĐƯỢC CÓ MẶT — CẢ VỀ HÌNH LẪN VỀ CHỖ ĐỨNG
 *
 * Lượt trước mới làm nửa đầu: `StallScene.propHidden` thôi vẽ bốn ô đạo cụ mua được, nhưng
 * `isBlocked` vẫn đọc bản đồ gốc. Chủ dự án chơi và bắt được ngay: *"hiện tại nếu chưa mua ghế
 * thì ghế ẩn rồi. Nhưng mà cái chỗ ô của ghế vẫn bị chiếm chỗ chứ không hề bỏ ra"* — tức là một
 * cái ghế VÔ HÌNH chặn đường, lỗi tệ hơn hẳn cái ghế thừa vì không ai đọc ra nổi chuyện gì.
 */

test("TB-6 bốn ô đạo cụ mua được trỏ vào món CÓ THẬT, và ký tự của chúng CÓ THẬT trên bản đồ", () => {
  // `BUYABLE_TILES` để giá trị kiểu `string` vì `world/` không được biết tới `sim/`. Chỗ hở đó
  // bịt ở đây: gõ sai một mã là không món nào khớp, rồi cái ô ấy lặng lẽ mở suốt cả mùa.
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
    // Chưa mua gì cả -> cả bốn ô đều mở.
    setOpenTiles(openTilesFor(() => false));
    for (const code of codes) {
      const { tx, ty } = oCua(code);
      assert.equal(isBlocked(tx, ty), false, `chưa mua mà ô "${code}" (${tx},${ty}) vẫn chặn chân`);
    }

    // Mua hết -> cả bốn ô chặn lại. Cái ghế có mặt thật thì đi vòng qua nó là chuyện đời thường.
    setOpenTiles(openTilesFor(() => true));
    for (const code of codes) {
      const { tx, ty } = oCua(code);
      assert.equal(isBlocked(tx, ty), true, `mua rồi mà ô "${code}" (${tx},${ty}) vẫn đi xuyên qua`);
    }

    // Mua ĐÚNG MỘT món: chỉ ô của nó đóng lại, ba ô kia còn mở. Lưới này bắt cái lỗi dễ nhất —
    // mở/đóng cả bốn ô cùng lúc theo một món bất kỳ.
    setOpenTiles(openTilesFor((id) => id === "BINH_TRA"));
    const tra = oCua("T");
    assert.equal(isBlocked(tra.tx, tra.ty), true, "mua bình trà rồi mà ô của nó vẫn trống");
    const ghe = oCua("s");
    assert.equal(isBlocked(ghe.tx, ghe.ty), false, "mới mua bình trà mà ô ghế đã bị chiếm");
  } finally {
    // ⚠️ Trả bản đồ về nguyên trạng: `openTiles` là trạng thái của cả module, bỏ quên là mấy
    // lưới chạy sau trong cùng file này đi một bản đồ khác.
    setOpenTiles([]);
  }
});

test("TB-8 ghế và bàn đi CHUNG một món — mua ghế là dọn cả hai ô, không sót cái bàn vô hình", () => {
  assert.equal(BUYABLE_TILES.s, BUYABLE_TILES.b);
  const open = openTilesFor((id) => id !== "GHE_BAN");
  assert.deepEqual(open.sort(), ["b", "s"]);
});

test("TB-9 mặc định bản đồ KHÔNG mở ô nào — đi một bản đồ nới sẵn là lưới nào cũng dễ hơn thật", () => {
  // `setOpenTiles` phải được gọi hẳn hoi thì ô mới mở. Mặc định là bản đồ gốc, đúng cái mà
  // `assertWalkable` và `tests/p6-passersby` đang soi.
  const { tx, ty } = { tx: MAP[11].indexOf("s"), ty: 11 };
  assert.equal(isBlocked(tx, ty), true, "chưa ai khai gì mà ô ghế đã mở sẵn");
});
