import { test } from "node:test";
import assert from "node:assert/strict";
import { COOL_RATE, WARM_OK, cool, isWarm } from "../src/sim/loaf";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { HeadlessStall, POLICIES } from "../src/sim/headless";
import { CAPACITY, INGREDIENTS, dishFor, type Ingredient } from "../src/sim/order";
import { CRUST } from "../src/sim/oven";
import { SALIENCE } from "../src/sim/perception";
import { extraHabit, newRelState } from "../src/sim/memory";
import { STATIONS, stationNear } from "../src/world/stations";

test("ổ ra lò nguội sau ~26 s (P1-01 §2.4), mưa nguội nhanh hơn 1,4 lần", () => {
  const tCold = (1 - WARM_OK) / COOL_RATE;
  assert.ok(tCold > 25 && tCold < 27);
  let w = 1;
  for (let i = 0; i < 25 * 30; i++) w = cool(w, 1 / 30);
  assert.ok(isWarm(w), "25 s vẫn còn ấm");
  for (let i = 0; i < 2 * 30; i++) w = cool(w, 1 / 30);
  assert.ok(!isWarm(w), "27 s đã nguội");
  assert.ok(cool(1, 10, "MUA_RAO") < cool(1, 10, "NANG_GAT"));
});

test("đưa ổ nguội: lỗi 'bánh nguội ngắt' được nói ra, không tính là ORDER_DEFECT", () => {
  const bus = new Bus();
  const h = new HeadlessStall(newGame("t", "cold-1"), { ...POLICIES.greedy, workSec: [1e9, 1e9] }, { bus });
  h.run({ until: (x) => x.service.front?.phase === "waiting" });
  const c = h.service.front!;
  const dish = dishFor(c.order!);
  let diff: any = null;
  const stims: string[] = [];
  bus.on("delivery:diffed", (p) => { diff = p; });
  bus.on("stim:emitted", (p) => stims.push(p.stimId));
  h.service.serveDish(dish, { cold: true });
  assert.ok(diff.defects.some((d: any) => d.kind === "WRONG_TEMP"));
  // túi im lặng (7/20) có thể khiến khách không nói — nhưng nếu nói thì là nói chuyện nguội
  if (diff.spoken) assert.equal(diff.spoken.kind, "WRONG_TEMP");
  assert.equal(diff.mode, "DISCOVERED");
  assert.ok(!stims.includes("ORDER_DEFECT"), "ổ đúng đơn mà nguội không phải sai đơn");
});

import { satisfaction, servedVector, tasteOf } from "../src/sim/taste";
import { defaultPresets, presetDish, refillPresets } from "../src/sim/presets";

test("khẩu vị ẩn: ổ đúng gu → ~1; ổ lệch gu (không ớt cho người mê cay) → thấp hơn — nhưng KHÔNG phải lỗi đơn", () => {
  const dung = tasteOf("ANH_DUNG")!;
  const spicy = servedVector(["pate", "thit", "thit", "chalua", "chalua", "dochua", "ot", "ot", "tuongot", "tuongot"], 0.7);
  const bland = servedVector(["pate", "thit", "thit", "chalua", "chalua", "dochua"], 0.7);
  assert.ok(satisfaction(dung, spicy) > satisfaction(dung, bland));
  assert.equal(tasteOf("walkin3"), null);
});

test("preset: 3 cái, đúng số phần; sáng nào cũng chia lại", () => {
  const ps = defaultPresets();
  assert.equal(ps.length, 3);
  // "đầy đủ nhà mình" phải LÀ ổ đầy đủ của câu gọi món: thang hai nấc nên nhân một phần,
  // rau đầy đủ hai phần. Preset mà bỏ hai phần nhân thì mỗi lần một chạm là một lỗi
  // "nhiều pate quá" — đường tắt mà làm sai thì không còn là đường tắt.
  const p1 = presetDish(ps[0]);
  assert.equal(p1.filter((x) => x === "pate").length, 1);
  assert.equal(p1.filter((x) => x === "dochua").length, 2);
  ps[0].prepped = 0;
  assert.equal(refillPresets(ps)[0].prepped, 12);
});

test("preset không được vượt trần mỗi món, cũng không được nhồi quá sức ổ bánh", () => {
  for (const p of defaultPresets()) {
    const dish = presetDish(p);
    assert.ok(dish.length <= CAPACITY, `${p.name}: ${dish.length} phần`);
    for (const ing of INGREDIENTS) {
      assert.ok((p.dish[ing.id] ?? 0) <= ing.max, `${p.name}: ${ing.label} quá trần`);
    }
  }
});

test("trạm bám dính: đứng giữa thùng trà và bồn rửa thì không nhảy qua lại", () => {
  const tea = STATIONS.find((s) => s.id === "tea")!;
  const sink = STATIONS.find((s) => s.id === "sink")!;
  // Hai trạm cách nhau đúng 2 ô mà bán kính với tới là 1,6 ô — có một vạt ở giữa với
  // tới được CẢ HAI, và đó là chỗ cú E rơi nhầm trạm.
  assert.equal(Math.abs(sink.tx - tea.tx), 2);

  // Không truyền trạm cũ: vẫn là "gần nhất thắng", nên qua mốc giữa là đổi ngay —
  // đúng cái làm trạm được chọn rung bần bật khi người chơi đứng nhún quanh đó.
  const mid = (tea.tx + sink.tx) / 2 + 0.5;
  assert.equal(stationNear(mid - 0.1, 1.5)?.id, "tea");
  assert.equal(stationNear(mid + 0.1, 1.5)?.id, "sink");

  // Truyền trạm cũ: quanh mốc giữa có một VẠT CHẾT, trong đó trạm đang chọn được giữ.
  assert.equal(stationNear(mid + 0.1, 1.5, tea)?.id, "tea", "nhích qua mốc chưa đủ để đổi");
  assert.equal(stationNear(mid - 0.1, 1.5, sink)?.id, "sink");

  // Vạt chết phải đối xứng hai phía, nếu không thì nó chỉ dời chỗ rung chứ không hết rung.
  assert.equal(stationNear(mid + 0.1, 1.5, sink)?.id, "sink");
  assert.equal(stationNear(mid - 0.1, 1.5, tea)?.id, "tea");

  // Nhưng đi hẳn về một bên thì vẫn phải đổi — bám dính không được thành dính chết.
  assert.equal(stationNear(mid + 0.3, 1.5, tea)?.id, "sink");
  assert.equal(stationNear(mid - 0.3, 1.5, sink)?.id, "tea");
  assert.equal(stationNear(sink.tx + 0.5, sink.ty + 0.5, tea)?.id, "sink");
  assert.equal(stationNear(tea.tx + 0.5, tea.ty + 0.5, sink)?.id, "tea");

  // Ra khỏi tầm với của cả hai thì không còn trạm nào, dù trạm cũ là gì.
  // Điểm thử phải TỰ CHỨNG MINH là xa mọi trạm chứ không ghi cứng một toạ độ: bản cũ
  // lấy y=6 làm "chỗ xa tít", rồi quầy dời xuống đúng hàng y6 và chỗ đó hoá ra sát
  // ngay chỗ đưa hàng — test đỏ vì cái mốc, không phải vì cái luật.
  //
  // Nên giờ nó tự DÒ ra chỗ trống nhất trong khu làm việc thay vì ghi một toạ độ: ghi
  // cứng thì cứ thêm một cái trạm là đỏ một lần (đã hai lần — quầy dời xuống y6, rồi
  // thùng rác mọc lên hàng trạm ngay trên đầu điểm thử cũ (10,5 · 3,5)).
  const distTo = (p: { x: number; y: number }) =>
    Math.min(...STATIONS.map((s) => Math.hypot(s.tx + 0.5 - p.x, s.ty + 0.5 - p.y)));
  let far = { x: 10.5, y: 3.5 }, nearest = -1;
  for (let x = 3.5; x <= 21.5; x += 0.5) {
    for (let y = 2.5; y <= 5.5; y += 0.5) {
      const d = distTo({ x, y });
      if (d > nearest) { nearest = d; far = { x, y }; }
    }
  }
  assert.ok(nearest > 2, `điểm thử chỉ cách trạm gần nhất ${nearest.toFixed(2)} ô — chọn chỗ khác`);
  assert.equal(stationNear(far.x, far.y, tea), null);
});

test("rổ bánh nóng đứng đủ xa thớt và chỗ đưa hàng để không bấm nhầm", () => {
  const basket = STATIONS.find((s) => s.id === "basket")!;
  assert.ok(basket, "có trạm rổ bánh nóng");
  for (const id of ["board", "handoff"]) {
    const other = STATIONS.find((s) => s.id === id)!;
    const d = Math.hypot(basket.tx - other.tx, basket.ty - other.ty);
    // Xa hơn hai lần bán kính với tới (1,6) thì không có điểm nào với tới được cả hai.
    assert.ok(d > 3.2, `${id} cách rổ ${d} ô — phải hơn 3,2`);
  }
  // Gác được ổ đã nướng lẫn ổ nguội, và lấy lại được bằng tay không.
  assert.ok(basket.needs.includes("loaf_hot"));
  assert.ok(basket.needs.includes("loaf_cold"));
  assert.ok(basket.needs.includes("empty"));
});

test("bánh nướng CHƯA TỚI là một lỗi thật, nặng dần, nhưng không bao giờ bằng bánh cháy", () => {
  // Trước đây ổ chưa giòn chỉ bị trừ điểm NGẦM, và chỉ với khách soi >= 0,7 — bán một ổ
  // bột sống cho người thường thì tuyệt đối không có gì xảy ra. Giờ nó đi cùng đường với
  // ổ nguội: thành defect, có người nói ra, có ghi vào trí nhớ.
  const run = (crust: number) => {
    const w = newGame("t", "raw");
    w.progress.dayIndex = 6;
    const bus = new Bus();
    const mem: number[] = [];
    bus.on("memory:written", (p) => { if (p.kind === "ORDER_DEFECT") mem.push(p.intensity); });
    const h = new HeadlessStall(w, POLICIES.greedy, { bus });
    const svc = h.service as any;
    const orig = svc.serveDish.bind(svc);
    // Ép ổ ĐÚNG ĐƠN, chỉ sai mỗi độ giòn — để cái đo được là độ giòn chứ không phải đơn sai.
    svc.serveDish = (dish: Ingredient[], opts: Record<string, unknown>) => {
      const c = svc.front;
      return orig(c?.order ? dishFor(c.order) : dish, { ...opts, crust, cold: false, quality: 1 });
    };
    h.run();
    return mem.length ? Math.max(...mem) : 0;
  };

  assert.equal(run(CRUST.READY + 0.01), 0, "tới độ giòn thì không có lỗi nào");
  const barely = run(CRUST.READY - 0.01);
  const half = run(0.2);
  const dough = run(0);
  assert.ok(barely > 0, "thiếu một chút vẫn phải có người càu nhàu, không được chìm nghỉm");
  assert.ok(barely < half && half < dough, "càng sống càng nặng");
  // Trần có chủ ý: bột sống vẫn nhẹ hơn ổ cháy khét — cháy là hỏng hẳn, sống là chưa tới.
  assert.ok(dough < SALIENCE.BURNT_OR_COLD, `ổ bột sống ${dough} phải nhẹ hơn ổ cháy ${SALIENCE.BURNT_OR_COLD}`);
});

test("nếp cho thêm: ba lượt thành thói quen, bỏ một lượt là hụt hẫng — và chỉ hụt MỘT lần", () => {
  const pen = (seq: readonly ("GAVE" | "NONE" | "REFUSED")[]) => {
    const s = newRelState();
    return seq.map((k) => extraHabit(s, k));
  };
  // Hai lượt chưa thành nếp: bỏ cũng không ai để ý.
  assert.deepEqual(pen(["GAVE", "GAVE", "NONE"]), [0, 0, 0]);
  // Ba lượt là thành nếp. Lượt thứ tư không có thì hụt — rồi thôi, không hụt mãi.
  const [, , , miss, again] = pen(["GAVE", "GAVE", "GAVE", "NONE", "NONE"]);
  assert.ok(miss > 0, "gãy nếp phải có giá");
  assert.equal(again, 0, "gãy rồi thì thôi, không phạt tiếp mỗi lượt");
  // Bị chính khách từ chối ("cho nhiều vậy chi") thì nếp đứt mà KHÔNG bị phạt — không thì
  // lời từ chối của họ thành một cái bẫy.
  assert.deepEqual(pen(["GAVE", "GAVE", "GAVE", "REFUSED", "NONE"]).slice(3), [0, 0]);
  // Save cũ chưa có trường này: đọc ra 0, không nổ.
  assert.equal(extraHabit({} as ReturnType<typeof newRelState>, "NONE"), 0);
});

test("T3 — báo quan hệ nhích KHÔNG được mang con số nào ra màn hình", () => {
  const w = newGame("t", "t3");
  const bus = new Bus();
  const notes: string[] = [];
  let perDelivery = 0, maxPerDelivery = 0;
  bus.on("order:delivered", () => { maxPerDelivery = Math.max(maxPerDelivery, perDelivery); perDelivery = 0; });
  bus.on("relationship:moved", (p) => { notes.push(p.note); perDelivery++; });
  for (let d = 1; d <= 8; d++) {
    w.progress.dayIndex = d;
    new HeadlessStall(w, POLICIES.greedy, { bus }).run();
  }
  assert.ok(notes.length > 0, "cả tuần phải có lúc quan hệ nhích");
  // CANON T3: không `+3 trust`, không thanh tình cảm. Một chữ số lọt ra là vỡ trụ cột.
  const withDigits = notes.filter((n) => /\d/.test(n));
  assert.deepEqual(withDigits, [], "mẩu lý do có chữ số");
  assert.ok(maxPerDelivery <= 1, "mỗi lượt đưa bánh chỉ được MỘT dòng, không phải một dòng mỗi lần ghi nhớ");
});
