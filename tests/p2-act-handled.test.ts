import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { TalkStore } from "../src/content/talks";
import { walkNodes, type TalkNode } from "../src/sim/talk";

const SRC = new URL("../src/sim/service.ts", import.meta.url);
const TALKS = await TalkStore.loadAll();

test("A-1 MỌI act có trong nội dung đều có nhánh trong `applyAct` — không act nào chạy không tải", async () => {
  const src = await readFile(SRC, "utf8");
  const dung = new Set<string>();
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      const k = ((node as TalkNode).act as { kind?: string } | undefined)?.kind;
      if (k) dung.add(k);
    }
  }
  const thieu = [...dung].filter((k) => !src.includes(`case "${k}":`));
  assert.deepEqual(thieu, [],
    `act có trong nội dung mà applyAct không nối: ${thieu.join(", ")} — lời nói miễn phí, và nó IM LẶNG`);
  assert.match(src, /assertActHandled\(act\)/,
    "không còn `never` chặn ở `default` — thêm một `kind` mà quên nối sẽ lại im lặng");
});
