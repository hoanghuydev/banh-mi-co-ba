/**
 * P1-02 §6.A + P1-03 §6.A — các mốc hiệu chỉnh của doc là HỢP ĐỒNG, không phải gợi ý.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { HOLD_TIME, observe, stateOf, traitMulFrom, type ActiveStim, type Observer } from "../src/sim/perception";
import { GazeMachine } from "../src/sim/gaze";
import { Rng } from "../src/core/rng";
import { orderDefectKey } from "../src/core/stimid";
import { diffDish, dishFor, generosityOf, sayOrder, specOf, mkDefect, type Ingredient } from "../src/sim/order";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { HeadlessStall, POLICIES } from "../src/sim/headless";
import { Oven, CRUST, bandOfCrust } from "../src/sim/oven";
import { Grip } from "../src/sim/grip";

function observer(zone: Observer["zone"], gaze: number, trait = 1): Observer {
  return { zone, gaze, occluder: 1, traitMul: trait, observations: new Map(), id: "v1" };
}

/** Giây tới CONFIRMED với một kích thích sống mãi. */
function timeToConfirm(o: Observer, stim: Omit<ActiveStim, "until" | "key">) {
  const s: ActiveStim = { ...stim, key: "k", until: 1e9 };
  const dt = 1 / 600;
  for (let t = 0; t < 400; t += dt) {
    observe(o, [s], t, dt);
    if (o.observations.get("k")?.peak === "CONFIRMED") return t + dt;
  }
  return Infinity;
}

test("traitMul theo CANON §4: soi 0,5 → 1,000; bảng 0,2…0,9 khớp doc", () => {
  const want: Record<number, number> = { 0.9: 1.28, 0.8: 1.21, 0.7: 1.14, 0.6: 1.07, 0.5: 1.0, 0.4: 0.93, 0.3: 0.86, 0.2: 0.79 };
  for (const [soi, v] of Object.entries(want)) assert.ok(Math.abs(traitMulFrom(Number(soi)) - v) < 0.001, `soi ${soi}`);
});

test("hiệu chỉnh §5.1: DROPPED_FOOD ở FRONT_CENTER → CONFIRMED 1,40 s (nhìn thẳng) / 28,07 s (bấm điện thoại)", () => {
  const drop = { id: "DROPPED_FOOD" as const, slot: "HANDS" as const, salience: 75 };
  assert.ok(Math.abs(timeToConfirm(observer("FRONT_CENTER", 1), drop) - 1.40) < 0.05);
  assert.ok(Math.abs(timeToConfirm(observer("FRONT_CENTER", 0.05), drop) - 28.07) < 0.5);
  assert.ok(Math.abs(timeToConfirm(observer("QUEUE_2", 1), drop) - 2.96) < 0.05);
  assert.ok(Math.abs(timeToConfirm(observer("QUEUE_3", 1), drop) - 6.67) < 0.05);
});

test("mùi khét: gaze có sàn 0,40 — đang bấm điện thoại vẫn ngửi thấy (§5.1: 5,21 s)", () => {
  const burnt = { id: "BURNT_OR_COLD" as const, slot: "OVEN" as const, salience: 80, smell: true };
  assert.ok(Math.abs(timeToConfirm(observer("FRONT_CENTER", 0.05), burnt) - 5.21) < 0.1);
});

test("CONFIRMED chốt: kích thích tắt rồi cũng không rò; dưới CONFIRMED thì giữ 1,5 s rồi mới rò", () => {
  const o = observer("FRONT_CENTER", 1);
  observe(o, [{ key: "a", id: "DROPPED_FOOD", slot: "HANDS", salience: 75, until: 2 }], 0, 1.5);
  observe(o, [{ key: "a", id: "DROPPED_FOOD", slot: "HANDS", salience: 75, until: 2 }], 3, 0.1);
  for (let t = 3; t < 60; t += 0.1) observe(o, [], t, 0.1);
  assert.equal(o.observations.get("a")!.peak, "CONFIRMED");
  assert.equal(o.observations.get("a")!.certainty, 1);

  const q = observer("FRONT_CENTER", 0.45);
  const s: ActiveStim = { key: "b", id: "DROPPED_FOOD", slot: "HANDS", salience: 75, until: 1 };
  observe(q, [s], 0, 1.0);                       // tích một ít, chưa tới CONFIRMED
  const c0 = q.observations.get("b")!.certainty;
  observe(q, [s], 1.0, 0.01);                     // tắt ở t = 1
  observe(q, [s], 1.0 + HOLD_TIME - 0.1, 0.5);   // vẫn trong thời gian giữ
  assert.equal(q.observations.get("b")!.certainty, c0);
  observe(q, [s], 1.0 + HOLD_TIME + 0.5, 1);
  assert.ok(q.observations.get("b")!.certainty < c0);
});

test("khoá riêng: lỗi trong ổ của khách A không thành 'đã thấy' lỗi trong ổ của khách B", () => {
  const a = orderDefectKey("BA_BAY#0", "MISSING", "pate");
  const b = orderDefectKey("CHU_TU#1", "MISSING", "pate");
  assert.notEqual(a, b);
  assert.equal(a, "ORDER_DEFECT:BA_BAY#0:MISSING:pate");   // định dạng khoá là hợp đồng — đổi là vỡ test này
});

test("Bà Bảy không bao giờ bấm điện thoại (phoneBudget 0) — qua 500 lần chuyển ánh nhìn", () => {
  const g = new GazeMachine({ tickets: [9, 4, 5, 0, 2, 0], phoneBudget: 0 }, "BA_BAY#0", new Rng(1));
  const anh = new GazeMachine({ tickets: [2, 1, 4, 11, 0, 2], phoneBudget: 4 }, "ANH_BAO#0", new Rng(1));
  const seen = new Set<string>();
  let phone = 0;
  for (let i = 0; i < 20_000; i++) {
    g.tick(0.05, { loudCue: false, question: false, waitRatio: 0, hasCompanion: false, raining: false });
    anh.tick(0.05, { loudCue: false, question: false, waitRatio: 0, hasCompanion: false, raining: false });
    seen.add(g.state);
    if (anh.state === "PHONE") phone++;
  }
  assert.ok(!seen.has("PHONE"));
  assert.ok(phone > 0, "người nghiện điện thoại thì phải có lúc bấm");
  assert.ok(anh.phoneBudget >= 0);
});

test("tiếng rớt đồ kéo mắt về tay người bán — trừ lúc đang dán mắt vô điện thoại", () => {
  const g = new GazeMachine({ tickets: [0, 0, 20, 0, 0, 0], phoneBudget: 0 }, "x", new Rng(3));
  g.tick(0.05, { loudCue: true, question: false, waitRatio: 0, hasCompanion: false, raining: false });
  assert.equal(g.state, "LOOK_HANDS");
  g.force("PHONE", 3);
  g.tick(0.05, { loudCue: true, question: false, waitRatio: 0, hasCompanion: false, raining: false });
  assert.equal(g.state, "PHONE");
});

test("câu gọi món TỰ NÓ quyết định ổ bánh: làm theo câu là 0 lỗi (bất biến P1-03)", () => {
  const rng = new Rng(11);
  for (let i = 0; i < 300; i++) {
    const spec = specOf({
      nhan: [rng.pick(["pate", "thit", "chalua", "xiumai", "opla"] as const)],
      rau: rng.next() < 0.5 ? "it" : "day-du",
      ot: rng.pick([0, 1, 2] as const), tuong: rng.pick([0, 1, 2] as const), usual: false,
    });
    assert.deepEqual(diffDish(spec, dishFor(spec)), [], sayOrder(spec));
  }
});

test("'cho ít rau' là rau MỘT NỬA, không cấm hành ngò (P1-03 §2.3 luật vàng)", () => {
  const spec = specOf({ nhan: ["pate"], rau: "it", ot: 1, tuong: 1, usual: false });
  assert.equal(spec.levels.hanhngo, 1);
  assert.ok(!sayOrder(spec).includes("đầy đủ"));
});

test("thang hai nấc: kể tên là một phần, 'nhiều' là hai phần — không còn nấc nào khác", () => {
  const spec = specOf({ nhan: ["pate", "thit"], nhieu: "thit", rau: "day-du", ot: 2, tuong: 1, usual: false });
  assert.equal(spec.levels.pate, 1);
  assert.equal(spec.levels.thit, 2);
  assert.equal(spec.levels.dochua, 2);
  assert.equal(spec.levels.ot, 2);
  assert.ok(sayOrder(spec).includes("nhiều thịt nguội") && sayOrder(spec).includes("nhiều ớt"));
  assert.deepEqual(diffDish(spec, dishFor(spec)), []);
});

/**
 * Thang ngắn lại thì lệch một nấc là lệch NỬA ổ thứ đó, không còn là một phần ba —
 * nó phải nặng hơn hồi bốn nấc, và tuyệt đối không được tụt xuống "trong dung sai".
 */
test("lệch một nấc vẫn là WRONG_RATIO, cả thiếu lẫn thừa", () => {
  const spec = specOf({ nhan: ["pate"], nhieu: "pate", rau: "day-du", ot: 1, tuong: 1, usual: false });
  const thieu = dishFor(spec).filter((x, i) => !(x === "pate" && i === 0));   // pate 2 → 1
  const d1 = diffDish(spec, thieu);
  assert.equal(d1.length, 1);
  assert.equal(d1[0].kind, "WRONG_RATIO");
  assert.equal(d1[0].item, "pate");
  assert.equal(d1[0].dir, "under");
  assert.ok(d1[0].magnitude > 0.25, "nặng hơn mức lệch một nấc của thang bốn nấc");

  const nheo = specOf({ nhan: ["pate"], rau: "day-du", ot: 1, tuong: 1, usual: false });
  const thua = [...dishFor(nheo), "pate" as Ingredient];                      // pate 1 → 2
  const d2 = diffDish(nheo, thua);
  assert.equal(d2.length, 1);
  assert.equal(d2[0].kind, "WRONG_RATIO");
  assert.equal(d2[0].dir, "over");
  // nhưng vẫn nhẹ hơn hẳn chuyện quên hẳn miếng pate
  assert.ok(d2[0].sCounter * d2[0].magnitude < mkDefect("MISSING", "pate").sCounter);
});

/**
 * CANON §3.2: cho thêm đồ chua / ớt / tương / ngò là sự kiện TÍCH CỰC. Trần còn hai phần
 * nên "khách xin một, mình bỏ hai" là lần cho thêm DUY NHẤT còn làm được — nó phải vừa
 * không thành lỗi, vừa còn đếm được, không thì `Service.freeExtra()` không bao giờ bắn.
 */
test("cho thêm một phần đồ chua / ớt: không phải lỗi, và vẫn đếm là hào phóng", () => {
  const spec = specOf({ nhan: ["pate"], rau: "it", ot: 1, tuong: 1, usual: false });
  const hao = [...dishFor(spec), "dochua" as Ingredient, "ot" as Ingredient];
  assert.deepEqual(diffDish(spec, hao), []);
  assert.ok(generosityOf(spec, hao) > 0, "Service.freeExtra() sống bằng dấu > 0 này");
  // dưa leo không nằm trong nhóm "dễ thương": bỏ dư là ẩu, không phải hào phóng
  const au = [...dishFor(spec), "dualeo" as Ingredient];
  assert.equal(diffDish(spec, au)[0]?.kind, "WRONG_RATIO");
  assert.equal(generosityOf(spec, au), 0);
});

/**
 * §8(i) — hào phóng phải TỐN. Tính bằng số phần thì ớt với tương là cách cày thiện cảm
 * rẻ nhất trong game; tính bằng giá chợ thì không ai cày nổi.
 */
test("hào phóng tính theo giá chợ: ớt rẻ hơn đồ chua, và cho hết cỡ vẫn chưa bằng một lát thịt", () => {
  const spec = specOf({ nhan: ["pate"], rau: "it", ot: 1, tuong: 1, usual: false });
  const them = (id: Ingredient) => generosityOf(spec, [...dishFor(spec), id]);
  assert.ok(them("ot") < them("dochua"), "một nhúm ớt 0,35k không bằng một gắp đồ chua 0,44k");
  assert.ok(them("hanhngo") < them("tuongot"));
  // cho dư TẤT CẢ những gì cho dư được trong một ổ
  const hetco = [...dishFor(spec), "dochua", "hanhngo", "ot", "tuongot"] as Ingredient[];
  assert.deepEqual(diffDish(spec, hetco), [], "cho thêm hết cỡ vẫn không phải lỗi");
  assert.ok(generosityOf(spec, hetco) < 1, "cả ổ cho thêm còn rẻ hơn một lát thịt nguội");
});

test("salience lỗi theo doc: MISSING đồ chua 20 tại quầy / 100 lúc ăn; thiếu pate nặng hơn thiếu ngò", () => {
  const d = mkDefect("MISSING", "dochua");
  assert.equal(d.sCounter, 20);
  assert.equal(d.sEat, 100);
  assert.ok(mkDefect("MISSING", "pate").sCounter > mkDefect("MISSING", "hanhngo").sCounter);
});

test("không bao giờ trừ tiền bánh: tệ nhất là không có boa", () => {
  const bus = new Bus();
  const h = new HeadlessStall(newGame("t", "tip-1"), { ...POLICIES.greedy, workSec: [1e9, 1e9] }, { bus });
  h.run({ until: (x) => x.service.front?.phase === "waiting" });
  const dish = dishFor(h.service.front!.order!);
  h.service.serveDish(dish.slice(0, -1));         // thiếu MỘT thứ — vẫn là món khách gọi
  const paid = h.service.drain().find((e) => e.kind === "paid");
  assert.ok(paid && paid.kind === "paid" && paid.amount >= 25_000 && paid.tip === 0);
});

/**
 * Ranh giới của luật trên. §2.12 là mục TIỀN BOA: "không có cơ chế trừ tiền, tệ nhất là
 * không tip" — nó không nói ổ nào cũng bán bằng giá món khách gọi. Ổ không có một miếng
 * nhân mặn nào THẬT SỰ là bánh mì không, nên tính đúng bậc `khong` của thực đơn
 * (P3-03 §2.5). Boa vẫn 0, không âm. Thiếu bao nhiêu thứ đi nữa mà còn nhân mặn thì
 * vẫn giá cũ — test ngay trên giữ chỗ đó.
 */
test("ổ không có miếng nhân mặn nào = bánh mì không, 10.000₫ (P3-03 §2.5)", () => {
  const bus = new Bus();
  const h = new HeadlessStall(newGame("t", "tip-1"), { ...POLICIES.greedy, workSec: [1e9, 1e9] }, { bus });
  h.run({ until: (x) => x.service.front?.phase === "waiting" });
  h.service.serveDish([]);
  const paid = h.service.drain().find((e) => e.kind === "paid");
  assert.ok(paid && paid.kind === "paid" && paid.amount === 10_000 && paid.tip === 0);
});

test("ANTICIPATED khi đứng nhìn thẳng lúc gói, DISCOVERED khi không ai kịp thấy", () => {
  for (const [gaze, want] of [[1, "ANTICIPATED"], [0.05, "DISCOVERED"]] as const) {
    const bus = new Bus();
    const h = new HeadlessStall(newGame("t", "wit-1"), { ...POLICIES.greedy, workSec: [1e9, 1e9] }, { bus });
    h.run({ until: (x) => x.service.front?.phase === "waiting" });
    const c = h.service.front!;
    c.gazeOverride = gaze;
    const dish = dishFor(c.order!);
    const drop = dish.indexOf(c.order!.intent.nhan[0]);
    dish.splice(drop, 2);                          // quên hẳn nhân chính
    for (const d of diffDish(c.order!, dish)) {
      bus.emit("stim:emitted", { stimId: "ORDER_DEFECT", zone: "BOARD", salience: d.sCounter * d.magnitude, at: h.elapsed, key: orderDefectKey(c.id, d.kind, d.item) });
    }
    for (let i = 0; i < 30 * 6; i++) h.step();    // 6 giây đi từ thớt ra quầy
    let mode = "";
    bus.on("delivery:diffed", (p) => { mode = p.defects[0]?.witness ?? ""; });
    h.service.serveDish(dish);
    assert.equal(mode, want, `gaze ${gaze}`);
  }
});

test("lò: vùng giòn rộng ~6 s (không phải game canh giờ), quá 1,0 là cháy đúng một lần", () => {
  const o = new Oven();
  o.put();
  let t = 0, crispFrom = -1, crispTo = -1, burns = 0;
  while (t < 30) {
    burns += o.tick(0.05).length;
    t += 0.05;
    const c = o.slots[0]!.crust;
    if (crispFrom < 0 && bandOfCrust(c) === "CRISP") crispFrom = t;
    if (crispTo < 0 && c >= CRUST.SINGED) crispTo = t;
  }
  assert.ok(crispTo - crispFrom > 5, `vùng giòn ${crispTo - crispFrom}s`);
  assert.equal(burns, 1);
});

test("grip: đi thường không bao giờ rớt; chạy liên tục thì rớt sau 2–4 s; vừa chạy vừa va thì rớt sớm hơn", () => {
  const g = new Grip();
  for (let i = 0; i < 30 * 60; i++) assert.equal(g.tick(1 / 30, 0.6, false), false);
  g.reset();
  let t = 0;
  while (!g.tick(1 / 30, 0.9, false)) t += 1 / 30;
  assert.ok(t > 2 && t < 4, `rớt sau ${t}s`);
  g.reset();
  let t2 = 0;
  while (!g.tick(1 / 30, 0.9, true)) t2 += 1 / 30;   // chạy + dí vào đồ đạc
  assert.ok(t2 < t, `va thì phải rớt sớm hơn (${t2}s < ${t}s)`);
});

test("stateOf đúng ngưỡng CANON §5", () => {
  assert.equal(stateOf(0.34), "UNAWARE");
  assert.equal(stateOf(0.35), "GLIMPSED");
  assert.equal(stateOf(0.7), "NOTICED");
  assert.equal(stateOf(1), "CONFIRMED");
});
