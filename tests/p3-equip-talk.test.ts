/**
 * NỘI DUNG KHÔNG ĐƯỢC NHẮC TỚI ĐỒ CHƯA MUA. Thoại từng mời người ta "đứng nhờ cái dù cho mát"
 * trong khi chẳng có cái dù nào — lỗi THẾ GIỚI, và nó không nổ ra thành bug nào nên không có lưới
 * thì nó mọc lại ngay lần viết nội dung sau.
 *
 * Bảng từ vựng CỐ Ý hẹp — chỉ đồ `StallScene` vẽ CÓ ĐIỀU KIỆN. Đã kiểm và LOẠI RA: bảng hiệu (xe
 * có sẵn từ đầu) · loa (trong câu bà Bảy là điện thoại của bà) · ghế "kia" (ghế hàng xóm ở y11).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { visibleOptions, walkNodes, type Talk, type TalkNode } from "../src/sim/talk";
import { TalkStore } from "../src/content/talks";
import { EQUIP } from "../src/sim/equipment";

const TALKS: Talk[] = await TalkStore.loadAll();

/** `(^|không phải chữ)từ(không phải chữ|$)` — `\b` của JS không ăn với chữ có dấu. */
const word = (w: string) => new RegExp(`(^|[^\\p{L}])${w}([^\\p{L}]|$)`, "iu");

/**
 * Từ vựng → thiết bị phải mua mới có.
 *
 * ⚠️ VỚI GHẾ THÌ PHẢI ĐỂ Ý CHỈ TỪ: map `y11` có hai ghế nhựa sẵn của hàng xóm, nên "ngồi ghế KIA"
 * là có thật (không cần cổng) còn "ngồi cái ghế NÀY" mới cần `GHE_BAN`. Bắt bừa cả chữ "ghế" là
 * đẩy người viết sau đi gắn cổng cho một câu vốn đúng.
 */
const PROP_WORDS: [RegExp, string][] = [
  [word("dù"), "DU_CHE"],
  // chỉ bắt chỉ từ "này/đây" — ghế của chính quầy mình
  [/ghế\s+(này|đây)|cái\s+ghế\s+(này|đây)/iu, "GHE_BAN"],
];

test("E-1 câu NGƯỜI CHƠI nói mà nhắc tới đồ phải mua thì phải khai `needEquip`", () => {
  const bad: string[] = [];
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      for (const [re, id] of PROP_WORDS) {
        if (!re.test(node.say) || node.needEquip) continue;
        bad.push(`${t.id}: "${node.say}" — nhắc tới ${id} (${EQUIP[id as keyof typeof EQUIP]?.name ?? id}) mà không khai \`needEquip\``);
      }
    }
  }
  assert.deepEqual(bad, [], `\n  ${bad.join("\n  ")}`);
});

test("E-2 `needEquip` phải trỏ tới một thiết bị CÓ THẬT", () => {
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      if (node.needEquip) assert.ok(node.needEquip in EQUIP, `${t.id}: thiết bị lạ "${node.needEquip}"`);
    }
    if (t.when?.needEquip) assert.ok(t.when.needEquip in EQUIP, `${t.id}: thiết bị lạ "${t.when.needEquip}"`);
  }
});

test("E-3 cổng thiết bị THỰC SỰ chặn — chưa mua thì câu đó biến mất", () => {
  const gated = TALKS.flatMap((t) => walkNodes(t).map((x) => x.node)).filter((n) => n.needEquip);
  assert.ok(gated.length > 0, "không có câu nào gắn cổng — lưới này đang canh một chỗ trống");
  const node = gated[0];
  const beat: TalkNode[] = [node, { say: "thôi", tone: "LANH" }];
  const off = visibleOptions(beat, { flags: {}, hasEquip: () => false });
  assert.ok(!off.includes(node), "chưa mua mà câu nhắc tới nó vẫn hiện");
  const on = visibleOptions(beat, { flags: {}, hasEquip: () => true });
  assert.ok(on.includes(node), "mua rồi mà câu đó không hiện");
});

test("E-4 cắt cổng thiết bị rồi vẫn phải còn đường đi tiếp ở mọi nhịp", () => {
  // Gate chặt nhất có thể: không có thiết bị nào, không có cờ nào, két rỗng.
  const broke = new Set<string>();
  for (const t of TALKS) {
    const beats = [t.tree, ...walkNodes(t).map((x) => x.node.then).filter((x): x is TalkNode[] => !!x)];
    for (const b of beats) {
      if (!visibleOptions(b, { flags: {}, cash: 0, hasEquip: () => false }).length) broke.add(t.id);
    }
  }
  assert.deepEqual([...broke], [], "có nhịp bị lọc sạch, người chơi kẹt giữa buổi bán");
});
