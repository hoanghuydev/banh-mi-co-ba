import { test } from "node:test";
import assert from "node:assert/strict";
import { COOL_RATE, WARM_OK, cool, isWarm } from "../src/sim/loaf";
import { Bus } from "../src/core/eventbus";
import { newGame } from "../src/core/save";
import { buy, portionsFor, putBack, take } from "../src/sim/econ";
import { HeadlessStall, POLICIES } from "../src/sim/headless";
import { CAPACITY, INGREDIENTS, dishFor, mkDefect, type Ingredient } from "../src/sim/order";
import { CRUST } from "../src/sim/oven";
import { STATIONS, blockedReason, stationNear } from "../src/world/stations";

test("ổ ra lò nguội sau 60 s, đủ cho một lô ba ổ gác sẵn; mưa nguội nhanh hơn 1,4 lần", () => {
  const tCold = (1 - WARM_OK) / COOL_RATE;
  assert.ok(tCold > 55 && tCold < 65, `t_nguội ${tCold.toFixed(1)} s`);
  let w = 1;
  for (let i = 0; i < 55 * 30; i++) w = cool(w, 1 / 30);
  assert.ok(isWarm(w), "55 s vẫn còn ấm");
  for (let i = 0; i < 10 * 30; i++) w = cool(w, 1 / 30);
  assert.ok(!isWarm(w), "65 s đã nguội");
  // Ba vòng phục vụ nhịp chậm nhất (8,5 s) + quãng đi và gói.
  const LAST_OF_BATCH = 3 * 8.5 + 6;
  assert.ok(isWarm(cool(1, LAST_OF_BATCH)), "ổ thứ ba trong lô gác sẵn vẫn phải còn ấm");
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
  assert.equal(Math.abs(sink.tx - tea.tx), 2);

  const mid = (tea.tx + sink.tx) / 2 + 0.5;
  assert.equal(stationNear(mid - 0.1, 1.5)?.id, "tea");
  assert.equal(stationNear(mid + 0.1, 1.5)?.id, "sink");

  assert.equal(stationNear(mid + 0.1, 1.5, tea)?.id, "tea", "nhích qua mốc chưa đủ để đổi");
  assert.equal(stationNear(mid - 0.1, 1.5, sink)?.id, "sink");

  assert.equal(stationNear(mid + 0.1, 1.5, sink)?.id, "sink");
  assert.equal(stationNear(mid - 0.1, 1.5, tea)?.id, "tea");

  assert.equal(stationNear(mid + 0.3, 1.5, tea)?.id, "sink");
  assert.equal(stationNear(mid - 0.3, 1.5, sink)?.id, "tea");
  assert.equal(stationNear(sink.tx + 0.5, sink.ty + 0.5, tea)?.id, "sink");
  assert.equal(stationNear(tea.tx + 0.5, tea.ty + 0.5, sink)?.id, "tea");

  // Dò chỗ trống nhất thay vì ghi cứng toạ độ, vì thêm trạm là toạ độ cứng sai.
  const distTo = (p: { x: number; y: number }) =>
    Math.min(...STATIONS.map((s) => Math.hypot(s.tx + 0.5 - p.x, s.ty + 0.5 - p.y)));
  let far = { x: 10.5, y: 3.5 }, nearest = -1;
  for (let x = 3.5; x <= 14.5; x += 0.5) {
    for (let y = 2.5; y <= 5.5; y += 0.5) {
      const d = distTo({ x, y });
      if (d > nearest) { nearest = d; far = { x, y }; }
    }
  }
  assert.ok(nearest > 2, `điểm thử chỉ cách trạm gần nhất ${nearest.toFixed(2)} ô — chọn chỗ khác`);
  assert.equal(stationNear(far.x, far.y, tea), null);
});

test("rổ bánh nóng cách thớt và chỗ đưa hàng ít nhất 2 ô để không bấm nhầm", () => {
  const basket = STATIONS.find((s) => s.id === "basket")!;
  assert.ok(basket, "có trạm rổ bánh nóng");
  for (const id of ["board", "handoff"]) {
    const other = STATIONS.find((s) => s.id === id)!;
    const d = Math.hypot(basket.tx - other.tx, basket.ty - other.ty);
    assert.ok(d >= 2, `${id} cách rổ ${d} ô — phải từ 2 ô để trạm gần nhất thắng`);
  }
  assert.ok(basket.needs.includes("loaf_hot"));
  assert.ok(basket.needs.includes("loaf_cold"));
  assert.ok(basket.needs.includes("empty"));
});

test("ổ đã gói đem lại thớt được: kẹp nhầm thì mở ra sửa, không phải bỏ cả ổ", () => {
  const board = STATIONS.find((s) => s.id === "board")!;
  assert.ok(board.needs.includes("loaf_hot"), "ổ nóng trơn vẫn đặt xuống thớt được");
  assert.ok(board.needs.includes("loaf_filled"), "ổ đã gói phải mở lại được ở thớt");
  assert.equal(blockedReason(board, "loaf_filled"), null, "không được nói 'đang cầm ổ bánh đã kẹp'");
  assert.ok(blockedReason(board, "loaf_cold"));
  assert.ok(blockedReason(board, "loaf_burnt"));
});

test("mở ổ ra thì kho nhận lại đúng số phần đã trừ lúc gói", () => {
  const w = newGame("t", "unwrap");
  const day = w.progress.dayIndex;
  const inv = w.inventory;
  buy(inv, "CHA_LUA", 1, day);
  buy(inv, "OT", 1, day);
  const before = { cha: portionsFor(inv, "chalua", day), ot: portionsFor(inv, "ot", day) };
  assert.ok(before.cha > 0 && before.ot > 0, "có hàng để thử");

  const dish: Ingredient[] = ["chalua", "chalua", "ot"];
  for (const ing of dish) take(inv, ing, 1, day);
  assert.equal(portionsFor(inv, "chalua", day), before.cha - 2);
  assert.equal(portionsFor(inv, "ot", day), before.ot - 1);

  for (const ing of dish) putBack(inv, ing, 1, day);
  assert.equal(portionsFor(inv, "chalua", day), before.cha);
  assert.equal(portionsFor(inv, "ot", day), before.ot);
});

test("bánh nướng CHƯA TỚI là một lỗi thật, nặng dần, nhưng không bao giờ bằng bánh cháy", () => {
  const run = (crust: number) => {
    const w = newGame("t", "raw");
    w.progress.dayIndex = 6;
    const bus = new Bus();
    const mem: number[] = [];
    bus.on("delivery:diffed", (p) => { for (const d of p.defects) if (d.kind === "WRONG_TEMP") mem.push(d.weight); });
    const h = new HeadlessStall(w, POLICIES.greedy, { bus });
    const svc = h.service as any;
    const orig = svc.serveDish.bind(svc);
    // Ép ổ đúng đơn để chỉ đo độ giòn.
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
  const cold = mkDefect("WRONG_TEMP", null).weight;
  assert.ok(dough < cold, `ổ bột sống ${dough} phải nhẹ hơn ổ nguội ${cold}`);
});

