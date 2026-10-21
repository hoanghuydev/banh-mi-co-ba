/**
 * BẢNG MENU TREO VÁCH — P1-03 (đơn hàng) + P3-01 (giá).
 *
 * Cái bảng này tồn tại để làm MỘT việc: trả lời "ổ xíu mại có gì" ở đúng một chỗ. Nên
 * mọi test dưới đây đều là một dạng của cùng câu hỏi — tấm bảng người chơi đọc, tấm bảng
 * `diffDish` chấm điểm, và bảng giá `econ.json` có còn là một hay không.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Rng } from "../src/core/rng";
import { MENU_BOARD, MENU_IDS, MENU_ITEMS, MENU_TIPS, RAU_CO_GIAN, RAU_NEN, isBare, itemOf, nhanOf } from "../src/sim/menu";
import { INGREDIENTS, CAPACITY, diffDish, dishFor, levelsOf, randomOrder, sayOrder, specOf, type Ingredient } from "../src/sim/order";
import { ECON, loafPriceVnd, tierOf, vnd } from "../src/sim/econ";
import { assertMenuSpotFree } from "../src/world/stations";

const NHAN_IDS = INGREDIENTS.filter((i) => i.kind === "nhan").map((i) => i.id);

test("dữ liệu bảng lành lặn: id không trùng, nhân có thật, bậc giá tra được ra tiền", () => {
  assert.ok(MENU_ITEMS.length >= 5);
  assert.equal(new Set(MENU_IDS).size, MENU_IDS.length, "id món bị trùng");
  for (const it of MENU_ITEMS) {
    assert.ok(it.name.startsWith("bánh mì "), `${it.id}: tên trên bảng phải là "bánh mì …"`);
    assert.ok(it.call.length > 1, it.id);
    assert.ok(loafPriceVnd(it.tier) > 0, `${it.id}: bậc "${it.tier}" không ra giá`);
    for (const [ing, n] of Object.entries(it.nhan)) {
      assert.ok(NHAN_IDS.includes(ing as Ingredient), `${it.id}: "${ing}" không phải nhân mặn`);
      assert.ok(n === 1 || n === 2, `${it.id}: thang chỉ có hai nấc, "${ing}" ghi ${n}`);
    }
  }
  for (const id of RAU_CO_GIAN) assert.ok((RAU_NEN[id] ?? 0) > 0, `khay rau thiếu ${id}`);
});

test("làm đúng công thức trên bảng là 0 lỗi — với MỌI món, mọi lời dặn thêm", () => {
  for (const mon of MENU_IDS) {
    for (const rau of ["day-du", "it", "khong"] as const) {
      for (const ot of [0, 1, 2] as const) {
        const spec = specOf({ mon, rau, ot, tuong: 1 });
        assert.deepEqual(diffDish(spec, dishFor(spec)), [], `${mon} / ${rau} / ớt ${ot} — ${sayOrder(spec)}`);
      }
    }
  }
});

/**
 * Ổ xíu mại cũng có pate: người chơi quết pate theo phản xạ đời thật thì không được bị `UNWANTED`.
 */
test("ổ nào cũng quết pate trước — trừ bánh mì không", () => {
  for (const mon of MENU_IDS) {
    const lv = levelsOf({ mon, rau: "day-du", ot: 1, tuong: 1 });
    if (isBare(mon)) { assert.equal(lv.pate, 0, `${mon} là ổ trơn`); continue; }
    assert.equal(lv.pate, 1, `${mon}: thiếu pate`);
  }
  const xm = specOf({ mon: "xiumai", rau: "day-du", ot: 1, tuong: 1 });
  assert.equal(xm.levels.xiumai, 1);
  assert.equal(xm.levels.pate, 1, "bánh mì xíu mại có pate");
  assert.equal(diffDish(xm, dishFor(xm).filter((x) => x !== "pate"))[0]?.kind, "MISSING");
});

test("bánh mì không là ổ TRƠN: khay rau không chạm tới nó, kể cả khi đơn ghi rau đầy đủ", () => {
  const lv = levelsOf({ mon: "khong", rau: "day-du", ot: 2, tuong: 2 });
  for (const i of INGREDIENTS) assert.equal(lv[i.id], 0, `${i.id} lọt vào ổ bánh mì không`);
  const spec = specOf({ mon: "khong", rau: "khong", ot: 0, tuong: 0 });
  assert.deepEqual(diffDish(spec, []), [], "ổ trống là ổ ĐÚNG — bẫy dịch lớn nhất của game");
  assert.ok(sayOrder(spec).includes("bánh mì không"));
});

test("'cho ít rau' là rau MỘT NỬA của khay, không phải bỏ thứ nào (P1-03 §2.3)", () => {
  const du = levelsOf({ mon: "thit", rau: "day-du", ot: 1, tuong: 1 });
  const it = levelsOf({ mon: "thit", rau: "it", ot: 1, tuong: 1 });
  for (const id of RAU_CO_GIAN) {
    assert.equal(du[id], RAU_NEN[id], `${id}: rau đầy đủ phải đúng bằng khay`);
    assert.equal(it[id], Math.round((RAU_NEN[id] ?? 0) / 2), `${id}: "ít rau" là một nửa`);
    assert.ok((it[id] ?? 0) > 0, `${id}: "ít rau" KHÔNG được thành bỏ hẳn`);
  }
});

test("giá đọc từ econ.json theo MÓN, không đếm số nhân", () => {
  const k = ECON.menu_k;
  assert.equal(loafPriceVnd(tierOf({ mon: "khong" })), vnd(k.khong));
  assert.equal(loafPriceVnd(tierOf({ mon: "xiumai" })), vnd(k.thuong), "hai thứ nhân mà vẫn là giá món thường");
  assert.equal(loafPriceVnd(tierOf({ mon: "daydu" })), vnd(k.dayDu));
  assert.equal(loafPriceVnd(tierOf({ mon: "daydu", nhieu: "thit" })), vnd(k.dacBiet));
  assert.equal(loafPriceVnd(tierOf({ mon: "thit", nhieu: "thit" })), vnd(k.thuong),
    "xin nhiều một thứ trên ổ thường không làm nó thành ổ đặc biệt");
});

test("khách vãng lai chỉ gọi món CÓ TRÊN BẢNG, và câu gọi luôn nêu tên món", () => {
  for (let seed = 0; seed < 400; seed++) {
    const spec = randomOrder(new Rng(seed));
    assert.ok(MENU_IDS.includes(spec.intent.mon), `seed ${seed}: món "${spec.intent.mon}" không có trên bảng`);
    const call = itemOf(spec.intent.mon).call;
    assert.ok(sayOrder(spec).toLowerCase().includes(call), `seed ${seed}: "${sayOrder(spec)}" không nêu "${call}"`);
    assert.deepEqual(diffDish(spec, dishFor(spec)), [], sayOrder(spec));
    if (spec.intent.nhieu) {
      assert.ok(nhanOf(spec.intent.mon).includes(spec.intent.nhieu),
        `seed ${seed}: xin thêm "${spec.intent.nhieu}" mà món không có thứ đó`);
    }
  }
});

test("đơn nặng nhất gọi được vẫn kẹp lọt một ổ (CAPACITY) — chừa chỗ cho chuyện cho thêm", () => {
  let nang = 0;
  for (const mon of MENU_IDS) {
    for (const nhieu of [undefined, ...nhanOf(mon)]) {
      const spec = specOf({ mon, nhieu, rau: "day-du", ot: 2, tuong: 2 });
      const dish = dishFor(spec);
      nang = Math.max(nang, dish.length);
      assert.deepEqual(diffDish(spec, dish), [], `${mon} + nhiều ${nhieu} bị chấm lỗi`);
    }
  }
  assert.ok(nang < CAPACITY, `đơn nặng nhất ${nang} phần, trần ${CAPACITY} — nhồi hết cỡ là STUFFED oan`);
  assert.ok(CAPACITY - nang >= 2, "phải còn chỗ cho ít nhất hai phần cho thêm (CANON §3.2 FREE_EXTRA)");
});

/**
 * Tấm bảng DẠY một mớ từ vựng ("cho ít rau", "không hành", "nhiều ớt"…). Dạy xong mà game
 * không nói được câu đó là dạy sai — đúng thứ người chơi sẽ trách game chứ không trách mình.
 */
test("từ vựng bảng dạy là từ vựng game nói: mỗi câu dặn đều ra được từ `sayOrder`", () => {
  const noi = (mon: "thit", over: Partial<Parameters<typeof specOf>[0]>) =>
    sayOrder(specOf({ mon, rau: "day-du", ot: 1, tuong: 1, ...over }));
  assert.ok(noi("thit", { rau: "it" }).includes("cho ít rau"));
  assert.ok(noi("thit", { rau: "khong" }).includes("không rau"));
  assert.ok(noi("thit", { bo: ["hanhngo"] }).includes("không hành"));
  assert.ok(noi("thit", { ot: 0 }).includes("không ớt"));
  assert.ok(noi("thit", { ot: 2 }).includes("nhiều ớt"));
  assert.ok(noi("thit", { tuong: 0 }).includes("không tương"));
  assert.ok(noi("thit", { tuong: 2 }).includes("nhiều tương"));
  assert.ok(noi("thit", { nhieu: "thit" }).includes("cho nhiều thịt nguội"));
  // và không câu nào trên bảng bị bỏ trống
  for (const t of MENU_TIPS) assert.ok(t.say.trim() && t.means.trim(), t.say);
});

test("chỗ đứng đọc bảng nằm ngoài tầm với của mọi trạm — không thì cú E rơi vào trạm", () => {
  assert.doesNotThrow(() => assertMenuSpotFree());
});

/**
 * `onBoard: false` là cờ HIỂN THỊ, không phải cờ tồn tại: gỡ một món khỏi `menu.json` thì
 * `itemOf()` trả `undefined` và đơn viết tay gọi món đó (bé Su, bà Sáu) vỡ. Giấu thì được, xoá thì không.
 */
test("món ẩn khỏi bảng vẫn gọi được, vẫn có giá, vẫn chấm điểm đúng", () => {
  const an = MENU_ITEMS.filter((i) => i.onBoard === false);
  assert.ok(an.length >= 1, "ít nhất 'bánh mì không' phải là món ẩn");
  assert.ok(!MENU_BOARD.some((i) => i.onBoard === false), "món ẩn lọt lên bảng");
  assert.ok(MENU_BOARD.every((i) => MENU_IDS.includes(i.id)), "bảng có món không nằm trong dữ liệu");
  for (const it of an) {
    const spec = specOf({ mon: it.id, rau: "khong", ot: 0, tuong: 0 });
    assert.deepEqual(diffDish(spec, dishFor(spec)), [], `${it.id}: ẩn khỏi bảng mà chấm điểm sai`);
    assert.ok(loafPriceVnd(tierOf(spec.intent)) > 0, `${it.id}: ẩn khỏi bảng mà mất giá`);
  }
  assert.ok(MENU_IDS.includes("khong"), "bánh mì không PHẢI còn trong dữ liệu — xem bé Su / bà Sáu");
});

