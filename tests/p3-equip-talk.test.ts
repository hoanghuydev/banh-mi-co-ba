/**
 * NỘI DUNG KHÔNG ĐƯỢC NHẮC TỚI ĐỒ CHƯA MUA — P2-06 §2.17.
 *
 * Chủ dự án bắt được: thoại mời người ta *"đứng nhờ cái dù cho mát"* trong khi
 * **chẳng có cái dù nào** trong sân. Quét ra thì không phải một ca lẻ — `DU_CHE`
 * (540k, mở ngày 8) và `GHE_BAN` (320k, ngày 5) đều là THIẾT BỊ MUA ĐƯỢC, và
 * `StallScene` chỉ vẽ chúng khi đã mua (`:3038`, `:3043`). Tổng mười câu.
 *
 * Đây không phải lỗi chính tả mà là lỗi THẾ GIỚI: nhân vật nói về một vật không tồn
 * tại, và người chơi nhìn quanh không thấy nó. Nó cũng không nổ ra thành bug nào —
 * nên nếu không có lưới, nó mọc lại ngay lần viết nội dung sau.
 *
 * Bảng từ vựng dưới đây CỐ Ý hẹp: chỉ những đồ `StallScene` vẽ CÓ ĐIỀU KIỆN. Ba thứ
 * ĐÃ KIỂM VÀ LOẠI RA, ghi lại để người sau khỏi đi gắn cổng nhầm:
 *
 *  · **bảng hiệu** — cái xe có bảng sẵn từ đầu (`createSign` gọi vô điều kiện ở
 *    `StallScene:848`); `BANG_HIEU` chỉ là bản nâng cấp đỏ-chữ-vàng.
 *  · **loa** — trong câu bà Bảy đó là điện thoại của chính bà, không phải `LOA_RAO`.
 *  · **ghế "kia"** — map `y11` có hai ghế nhựa sẵn ở ô (19,11)(20,11), bàn của hàng
 *    xóm bên kia hẻm. Chỉ "cái ghế NÀY" mới là ghế của quầy mình.
 *
 * Và một thứ ĐÃ SỬA chứ không gắn cổng: *"đứng nhờ cái mái hiên kia"* — trong cả
 * `art/props.ts` lẫn `world/map.ts` **không có mái hiên nào**, mua hay không mua cũng
 * không có. Câu đó đổi thành "đứng ké bóng cái xe", vì cái xe thì chắc chắn có.
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
 * Từ vựng → thiết bị phải mua mới có. Thêm dòng khi thêm đạo cụ vẽ-có-điều-kiện.
 *
 * ⚠️ VỚI GHẾ THÌ PHẢI ĐỂ Ý CHỈ TỪ. Hàng `y11` của `world/map.ts` có **hai cái ghế nhựa
 * sẵn từ đầu** ở ô (19,11) và (20,11) — bàn của hàng xóm bên kia hẻm, không phải của
 * quán. Nên:
 *
 *   "ngồi ghế KIA"      → chỉ sang bên kia hẻm. CÓ THẬT, không cần cổng.
 *   "ngồi cái ghế NÀY"  → ghế của chính quầy mình ⇒ cần `GHE_BAN` (320k, ngày 5).
 *
 * Bắt bừa cả chữ "ghế" là bắt oan người viết sau và đẩy họ đi gắn cổng cho một câu vốn
 * đúng. Lưới chỉ được chặt ở chỗ nó CHẮC.
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
