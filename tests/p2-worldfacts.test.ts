/**
 * NEO THOẠI VÀO THẾ GIỚI — P2-07, gộp vào MỘT bảng đen ở P2-09 §2.2.
 *
 * Đo trước khi làm: **1.534 nút thoại, 46 nút có `act`** — 97% lời nói không làm gì cả.
 * Chủ dự án gọi đúng tên: *free word*. Nó không nổ ra thành bug nào, nên nếu không có
 * lưới thì nó mọc lại mỗi lần viết nội dung.
 *
 * Lưới này canh bốn chuyện:
 *  1. máy đọc khoá còn đúng ba dạng (phẳng · phủ định · có tham số);
 *  2. mọi khoá trong nội dung — `need` LẪN `while` — đều CÓ THẬT trong bảng đen;
 *  3. câu HỨA một chuyện thì phải có cổng/act làm chuyện đó;
 *  4. **một chế độ hỏng duy nhất** — khoá lạ NÉM LỖI, không im lặng trả `false`.
 *     Đây là điểm của việc gộp, và nếu ai đó "tối ưu" nó về `return false` thì 374 nút
 *     `SỬA` lại im lặng biến mất như trước.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { needKeys, walkNodes, type Talk, type TalkNode } from "../src/sim/talk";
import { TalkStore } from "../src/content/talks";
import {
  FACT_FNS, FACT_KEYS, allHold, checkGate, firstBroken, holds, isStoryFlag, queryOf,
  type WorldSnapshot,
} from "../src/sim/worldfacts";
import { ALIAS_NAMES } from "../src/dialog/gates";

const TALKS: Talk[] = await TalkStore.loadAll();

const W = (over: Partial<WorldSnapshot> = {}): WorldSnapshot => ({
  hand: "empty", handsDirty: false, onStreet: false, soldOut: false,
  cash: 0, teaLeft: 10, stock: 20,
  them: {
    phase: "waiting", practice: "DOI_BANH", passing: false, served: false, named: true,
    cutLine: false, blocking: false, glanced: false, lookingInside: false, inShade: false, sitting: false, filming: false,
    onPhone: false, eating: false, hasOrder: true, waitRatio: 0,
    purpose: null, state: null, tier: "ACQUAINTANCE", visits: 1,
  },
  convo: { tones: [], warmth: 0, angered: false, openedBy: "PLAYER" },
  visit: { gaveTea: false, gaveFood: false, apologised: false, promised: [], inviteRefused: false },
  day: { met: false, told: [] },
  season: { remembers: false },
  hot: false, rain: false, peak: false, queue: 0, shadeFree: false, seatFree: false, ganhOut: false, ovenHot: false, band: "SANG", dayIndex: 5,
  ...over,
});

const convo = (over: Partial<WorldSnapshot["convo"]>): Partial<WorldSnapshot> =>
  ({ convo: { tones: [], warmth: 0, angered: false, openedBy: "PLAYER", ...over } });

// ────────────────────────────────────────────── máy đọc khoá

test("W-1 ba dạng khoá, và chỉ ba dạng", () => {
  assert.equal(holds("p.handsEmpty", W()), true);
  assert.equal(holds("p.holdsBread", W()), false);
  assert.equal(holds("p.holdsBread", W({ hand: "loaf_hot" })), true);
  // phủ định
  assert.equal(holds("!c.angered", W()), true);
  assert.equal(holds("!c.angered", W(convo({ angered: true }))), false);
  // hàm một tham số
  assert.equal(holds("w.queue(2)", W({ queue: 3 })), true);
  assert.equal(holds("w.queue(2)", W({ queue: 1 })), false);
  assert.equal(holds("c.saidTone(GAT)", W(convo({ tones: ["AM", "GAT"] }))), true);
});

test("W-2 khoá LẠ NÉM LỖI — không im lặng trả false", () => {
  /**
   * Đây là cả điểm của P2-09 §2.2. Bản cũ có HAI bảng: rule DB ném lỗi lúc nạp, bảng
   * thoại `switch` rơi vào `default: return false`. Cùng một lỗi gõ sai, hai chế độ hỏng
   * ngược nhau — và cái im lặng là cái đã giấu 374 nút suốt một bản dựng.
   */
  assert.throws(() => holds("p.holdsPho", W()), /không có trong `aliases`/);
  assert.throws(() => holds("t.khongCoThat", W()), /không có trong `aliases`/);
  // và lỗi phải CHỈ ĐƯỜNG, không chỉ nói "sai"
  assert.match(checkGate("t.khongCoThat") ?? "", /t\.(passing|queueing|ordering)/);
});

test("W-3 `while` là phép VÀ; rỗng = luôn đúng", () => {
  assert.equal(allHold(undefined, W()), true);
  assert.equal(allHold([], W()), true);
  assert.equal(allHold(["p.handsEmpty", "!w.rain"], W()), true);
  assert.equal(allHold(["p.handsEmpty", "w.rain"], W()), false);
  assert.equal(firstBroken(["p.handsEmpty", "w.rain"], W()), "w.rain");
});

test("W-3b bảy tầng khoá đều đọc được — p t w c v d m", () => {
  /** P2-07 §4ter đòi bốn tầng trí nhớ; P2-08 §4 ghi `v.*` và `d.*` là "chưa tồn tại". */
  assert.equal(holds("p.hasTea", W({ teaLeft: 3 })), true);
  assert.equal(holds("p.hasTea", W({ teaLeft: 0 })), false);
  assert.equal(holds("t.practice(DOI_BANH)", W()), true);
  assert.equal(holds("w.band(SOM)", W({ band: "SOM" })), true);
  assert.equal(holds("c.openedBy(NPC)", W(convo({ openedBy: "NPC" }))), true);
  assert.equal(holds("c.openedBy(NPC)", W()), false);
  assert.equal(holds("v.gaveTea", W({ visit: { ...W().visit, gaveTea: true } })), true);
  assert.equal(holds("v.promised(ROT_TRA)", W({ visit: { ...W().visit, promised: ["ROT_TRA"] } })), true);
  assert.equal(holds("d.metToday", W({ day: { met: true, told: [] } })), true);
  assert.equal(holds("d.toldMe(ve-so)", W({ day: { met: true, told: ["ve-so"] } })), true);
  assert.equal(holds("m.visits(3)", W({ them: { ...W().them, visits: 5 } })), true);
  assert.equal(holds("m.visits(3)", W({ them: { ...W().them, visits: 2 } })), false);
  assert.equal(holds("m.remembers", W({ season: { remembers: true } })), true);
  assert.equal(holds("m.remembers", W()), false);
});

test("W-3e `w.day(N)` — câu \"mới ra đây bán\" không nói được ở ngày 40", () => {
  assert.equal(holds("w.day(7)", W({ dayIndex: 3 })), true);
  assert.equal(holds("w.day(7)", W({ dayIndex: 20 })), false);
});

test("W-3c `p.stock` là NGƯỠNG, khác `p.soldOut` là 0", () => {
  // qua-duong §2 đòi đúng chỗ phân biệt này: "còn mấy ổ cuối" không phải "hết sạch".
  assert.equal(holds("p.stock(3)", W({ stock: 2 })), true);
  assert.equal(holds("p.stock(3)", W({ stock: 9 })), false);
  assert.equal(holds("p.soldOut", W({ stock: 0 })), false);      // soldOut là cờ riêng
  assert.equal(holds("p.soldOut", W({ soldOut: true })), true);
});

test("W-3d fact VẮNG MẶT khác fact bằng false — luật loại trừ của Ruskin", () => {
  /**
   * `t.purpose(DI_CHO)` phải SAI với một người không có mục đích nào, chứ không phải
   * sai vì mục đích của họ khác `DI_CHO`. Nếu `queryOf` đặt bừa một giá trị mặc định thì
   * mọi câu theo mục đích sẽ đúng với mọi người — đúng loại lỗi không ai nhìn ra.
   */
  const q = queryOf(W());
  assert.equal(q.dump().some(([k]) => k === "npcPurpose"), false);
  assert.equal(holds("t.purpose(DI_CHO)", W()), false);
  assert.equal(holds("t.purpose(DI_CHO)", W({ them: { ...W().them, purpose: "DI_CHO" } })), true);
});

// ────────────────────────────────────────────── nội dung

/** Mọi khoá cổng của một nút — `need` lẫn `while`, đã bỏ dấu phủ định. */
function gateKeysOf(node: TalkNode): string[] {
  return [...needKeys(node), ...(node.while ?? [])];
}

test("W-4 mọi khoá cổng trong nội dung đều CÓ THẬT trong bảng đen", () => {
  /**
   * Gõ sai một chữ thì câu đó không bao giờ hiện. Đây là loại bug chỉ lộ ra khi có người
   * ngồi chơi đủ lâu để thấy một lựa chọn lẽ ra phải có mà không bao giờ thấy.
   *
   * Từ P2-09 lưới này phủ CẢ `need` — trước đây nó chỉ phủ `while`, mà `need` mới là chỗ
   * 374 nút đang chờ.
   */
  const bad: string[] = [];
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      for (const raw of gateKeysOf(node)) {
        if (isStoryFlag(raw.startsWith("!") ? raw.slice(1) : raw)) continue;   // cờ chuyện
        const err = checkGate(raw);
        if (err) bad.push(`${t.id}: ${err}`);
      }
    }
  }
  assert.deepEqual(bad, [], `\n  ${bad.join("\n  ")}`);
});

test("W-4b bảng khoá của người viết KHỚP bảng đen — không còn hai danh sách", () => {
  assert.equal(FACT_KEYS.length + FACT_FNS.length, ALIAS_NAMES.length);
  // bảy namespace, không có cái thứ tám lẻn vào
  const ns = new Set(ALIAS_NAMES.map((k) => k.split(".")[0]));
  assert.deepEqual([...ns].sort(), ["c", "d", "m", "p", "t", "v", "w"]);
});

test("W-5 câu MỜI ĂN phải đang cầm bánh; câu MỜI UỐNG phải có trà", () => {
  /**
   * Chủ dự án: *"Nói họ cần ăn ổ bánh mì (mình cho) thì thật sự mình phải đang cầm bánh
   * mì mới được nói câu đó. Nếu cầm trà đá mời nước họ thì thật sự phải cầm trà đá."*
   *
   * P2-07 §4.1 nói thêm: đó là sự thật TĨNH ⇒ phải nằm ở `need` (ẩn hẳn), không phải
   * `while` (ra "?"). Lưới nhận cả hai chỗ, nhưng `W-7` mới là chỗ bắt đặt sai phía.
   */
  const GIVE_FOOD = /(ăn thử|nếm thử|bẻ miếng|cầm ổ này|lấy ổ này|cho \S+ ổ này)/iu;
  const GIVE_TEA = /(rót \S+ ly trà|uống ly trà|ly trà đá nè|làm ly trà)/iu;
  const bad: string[] = [];
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      const k = gateKeysOf(node);
      if (GIVE_FOOD.test(node.say) && !k.some((x) => x.includes("holdsBread") || x.includes("holdsFilled"))) {
        bad.push(`${t.id}: "${node.say}" — mời ăn mà không khai \`p.holdsBread\``);
      }
      if (GIVE_TEA.test(node.say) && !k.some((x) => x.includes("holdsTea") || x.includes("hasTea"))) {
        bad.push(`${t.id}: "${node.say}" — mời uống mà không khai \`p.holdsTea\`/\`p.hasTea\``);
      }
    }
  }
  assert.deepEqual(bad, [], `\n  ${bad.join("\n  ")}`);
});

test("W-6 câu BUỘC TỘI phải kiểm chuyện đó đã xảy ra thật", () => {
  /**
   * *"Rồi bảo có người tới trước chị, chị chen hàng. Trong khi bà ấy có chen hàng thật đâu?"*
   */
  const ACCUSE = [[/chen (hàng|ngang)|tới trước (chị|anh|cô|chú|bà)/iu, "t.cutLine"]] as const;
  const bad: string[] = [];
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      for (const [re, key] of ACCUSE) {
        if (!re.test(node.say)) continue;
        if (!gateKeysOf(node).includes(key)) bad.push(`${t.id}: "${node.say}" — buộc tội mà không kiểm \`${key}\``);
      }
    }
  }
  assert.deepEqual(bad, [], `\n  ${bad.join("\n  ")}`);
});

/*
 * W-7 ĐÃ DỜI SANG `tools/validate-talks.ts` (lưới `T002`).
 *
 * Bản cũ chép tay lại bảng TĨNH/ĐỘNG vào đây, nên có HAI bản của cùng một luật — và
 * chúng lệch nhau thật: lúc xếp lại `w.hot`/`w.rain` sang nhóm tĩnh (thời tiết tra theo
 * NGÀY nên không đổi trong một buổi), tôi sửa bảng của validator mà quên bảng ở đây, và
 * cùng một nút bị một bên khen một bên chê.
 *
 * `tests/content-tools.test.ts` đã bắt `validateTalks` trên nội dung thật phải 0 ERROR,
 * nên luật vẫn được canh — chỉ còn đúng một bản.
 */
