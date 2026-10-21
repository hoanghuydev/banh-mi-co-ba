import { test } from "node:test";
import assert from "node:assert/strict";
import { GANH_IN, GANH_OUT } from "../src/world/map";
import { TalkStore } from "../src/content/talks";
import { walkNodes, needKeys, type TalkNode } from "../src/sim/talk";
import { balkChance } from "../src/sim/service";
import { QUEUE_SLOTS } from "../src/world/map";
import { NPCS } from "../src/content/npcs";

// `balkChance` chỉ khác 0 từ `ahead = 4` (trên 6 chỗ), nên phải đo ở đúng dải đó.
test("N-1 gánh để ngoài thì khách quay đầu NHIỀU HƠN — đó là cái giá", () => {
  const o = {
    slots: QUEUE_SLOTS.length, person: NPCS[0].personality,
    relVisitMul: 1, moodPatience: 1, rushing: false,
  };
  // Gánh để ngoài = thêm một chỗ mặt tiền bị chiếm.
  const khong = balkChance({ ahead: 3, ...o });
  const coGanh = balkChance({ ahead: 4, ...o });
  assert.ok(coGanh > khong,
    `gánh nằm đó mà khách không ngại hơn (${khong.toFixed(3)} → ${coGanh.toFixed(3)}) — vậy bưng vô làm gì`);
  assert.equal(balkChance({ ahead: 1, ...o }), balkChance({ ahead: 0, ...o }));
});

test("N-2 chỗ để gánh trong và ngoài là hai chỗ KHÁC NHAU", () => {
  assert.ok(Math.hypot(GANH_IN.x - GANH_OUT.x, GANH_IN.y - GANH_OUT.y) >= 1.5,
    "bưng vô với để ngoài trông như một chỗ — người chơi không thấy mình vừa làm gì");
});

test("N-3 mọi câu đụng tới cái gánh đều mang act, và khoá `w.ganhOut`", async () => {
  const talks = await TalkStore.loadAll();
  const hong: string[] = [];
  for (const t of talks) {
    for (const { node } of walkNodes(t)) {
      const n = node as TalkNode;
      const k = (n.act as { kind?: string } | undefined)?.kind;
      if (k !== "CARRY_GANH" && k !== "MOVE_GANH") continue;
      const gates = [...needKeys(n), ...(n.while ?? [])];
      if (!gates.some((g) => g.includes("ganhOut"))) {
        hong.push(`${t.id}: "${n.say}" — thiếu \`while: w.ganhOut\`, bưng một cái gánh không có ở đó`);
      }
    }
  }
  assert.deepEqual(hong, []);
});

test("N-5 ĐỔI HÀNG tốn một ổ thật — không tiền, mà cũng không phải cho không", async () => {
  const talks = await TalkStore.loadAll();
  let doi = 0;
  for (const t of talks) {
    for (const { node } of walkNodes(t)) {
      const n = node as TalkNode;
      if ((n.act as { kind?: string } | undefined)?.kind !== "BARTER") continue;
      doi++;
      const gates = needKeys(n);
      assert.ok(gates.includes("p.holdsFilled"),
        `${t.id}: "${n.say}" — đổi một ổ mà tay không cầm ổ nào`);
      assert.ok(gates.includes("!p.soldOut"),
        `${t.id}: "${n.say}" — đổi một ổ lúc đã hết bánh`);
    }
  }
  assert.ok(doi >= 2, `mới ${doi} nút đổi hàng — `
    + `"Đổi hôn con? Chén tàu hũ lấy ổ bánh không." là cả cuộc \`sau.doi\` dựng quanh`);
});

test("N-4 bà Sáu có cả hai nước đi: mình bưng giùm, và bảo bà tự dời", async () => {
  const talks = await TalkStore.loadAll();
  let bung = 0, doi = 0;
  for (const t of talks) {
    for (const { node } of walkNodes(t)) {
      const k = ((node as TalkNode).act as { kind?: string } | undefined)?.kind;
      if (k === "CARRY_GANH") bung++;
      if (k === "MOVE_GANH") doi++;
    }
  }
  assert.ok(bung >= 4, `mới ${bung} câu bưng giùm — 11 nhắc mà gần như không câu nào làm gì`);
  assert.ok(doi >= 1, "không có đường bảo bà tự dời — mất hẳn một nước đi");
});
