import { test } from "node:test";
import assert from "node:assert/strict";
import { TalkStore } from "../src/content/talks";
import { walkNodes, needKeys, type TalkNode } from "../src/sim/talk";

test("N-1 ĐỔI HÀNG tốn một ổ thật — không tiền, mà cũng không phải cho không", async () => {
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
