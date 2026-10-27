import { test } from "node:test";
import assert from "node:assert/strict";
import { GOODS, buy, goodsFor, newInventory, shelfDays, takeFull, tasteFlaws, tasteThreshold, type Quality } from "../src/sim/econ";
import { INGREDIENTS, tasteDefect, tasteGroup, type Ingredient } from "../src/sim/order";
import { freshnessOf, stacksOf } from "../src/sim/stock";

/** Khách khó tính nhất: lỗi dưới ngưỡng này thì không ai nếm ra. */
const PICKIEST = tasteThreshold(1);
const SIDES: Ingredient[] = ["dochua", "dualeo", "hanhngo", "ot", "tuongot"];
const MENU: Record<string, Ingredient[]> = {
  opla: ["opla"], pate: ["pate"], xiumai: ["pate", "xiumai"], chalua: ["pate", "chalua"],
  thit: ["pate", "thit"], daydu: ["pate", "thit", "chalua"],
};

/** Mua mỗi thứ một lô ở `boughtOn`, ráp ổ vào ngày `day`. */
function dish(ing: Ingredient[], tier: (g: string) => Quality, boughtOn: (g: string) => number, day: number) {
  const inv = newInventory();
  for (const g of ["BANH", ...new Set(ing.flatMap((i) => goodsFor(i)))] as (keyof typeof GOODS)[]) {
    buy(inv, g, 5, boughtOn(g), tier(g));
  }
  const bread = takeFull(inv, "bread", 1, day)[0];
  const parts = ing.flatMap((i) => takeFull(inv, i, 1, day).map((p) => ({ ...p, ing: i })));
  return tasteFlaws(bread, parts);
}

test("hàng mới nhập không bao giờ bị chê không tươi", () => {
  for (const tier of ["BAN", "THUONG", "NGON"] as Quality[]) {
    for (const [mon, nhan] of Object.entries(MENU)) {
      assert.equal(dish([...nhan, ...SIDES], () => tier, () => 1, 1).stale.loss, 0, `${tier} ${mon}`);
    }
  }
});

test("hàng ngon mới nhập (đồ chua tự ngâm đã ngấm): khách khó tính nhất cũng không chê", () => {
  for (const [mon, nhan] of Object.entries(MENU)) {
    const f = dish(["pate", ...nhan, "dochua", "dualeo"], () => "NGON", (g) => (g === "DO_CHUA_SAN" ? 0 : g === "DO_CHUA_NL" ? -2 : 1), 1);
    assert.ok(f.poor.loss < PICKIEST, `${mon} bị chê dở (${f.poor.loss.toFixed(3)} · ${f.poor.item})`);
  }
});

test("hàng còn nhãn tươi trong kho thì một mình nó không làm ổ bị chê không tươi", () => {
  for (const it of INGREDIENTS) {
    for (const g of goodsFor(it.id)) {
      for (let age = 0; age < shelfDays(g); age++) {
        const inv = newInventory();
        buy(inv, g, 1, 1);
        const st = stacksOf(inv, 1 + age).find((s) => s.good === g)!;
        if (freshnessOf(st) !== "fresh") continue;
        const f = dish([it.id], () => "THUONG", (x) => (x === g ? 1 : 1 + age), 1 + age);
        assert.ok(f.stale.loss < PICKIEST, `${g} ngày ${age} còn tươi mà bị chê (${f.stale.loss.toFixed(3)})`);
      }
    }
  }
});

test("hàng dỏm mới nhập: chê dở đúng món, không chê không tươi", () => {
  const f = dish(["pate"], (g) => (g === "PATE" ? "BAN" : "THUONG"), () => 1, 1);
  assert.equal(f.stale.loss, 0);
  assert.equal(f.poor.item, "pate");
  assert.ok(f.poor.loss >= PICKIEST);
});

test("ổ ốp la không bao giờ bị chê pate", () => {
  for (let age = 0; age < shelfDays("TRUNG", "thung_xop", "BAN"); age++) {
    const f = dish(["opla", ...SIDES], () => "BAN", (g) => (g === "TRUNG" ? 1 : 1 + age), 1 + age);
    assert.notEqual(f.stale.item, "pate");
    assert.notEqual(f.poor.item, "pate");
  }
});

test("pate ngày cuối: chê không tươi đúng pate", () => {
  const last = shelfDays("PATE") - 1;
  const f = dish(["pate", "thit"], () => "NGON", (g) => (g === "PATE" ? 1 : 1 + last), 1 + last);
  assert.equal(f.stale.item, "pate");
  assert.equal(f.poor.loss, 0);
});

test("bánh mì qua đêm: chê không tươi đúng bánh", () => {
  const f = dish(["pate"], () => "NGON", (g) => (g === "BANH" ? 1 : 2), 2);
  assert.equal(f.stale.item, "banh");
  assert.ok(f.stale.loss >= PICKIEST);
});

test("đồ chua tự ngâm chưa ngấm không tính là để lâu", () => {
  const inv = newInventory();
  buy(inv, "DO_CHUA_NL", 1, 1);
  const [p] = takeFull(inv, "dochua", 1, 1);
  assert.equal(p.fresh, 1);
  assert.ok(p.q < 1);
});

test("câu chê gọi đúng tên món và đúng nhóm", () => {
  assert.equal(tasteDefect("TASTE_OFF", "opla").label, "trứng ốp la");
  assert.equal(tasteDefect("TASTE_POOR", "banh").label, "bánh");
  assert.equal(tasteGroup("chalua"), "nhan");
  assert.equal(tasteGroup("ot"), "rau");
});
