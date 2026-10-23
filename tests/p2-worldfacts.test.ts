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
    purpose: null, state: null,
  },
  convo: { tones: [], angered: false, openedBy: "PLAYER" },
  visit: { gaveTea: false, gaveFood: false, apologised: false, promised: [], inviteRefused: false },
  day: { met: false, told: [] },
  hot: false, rain: false, peak: false, queue: 0, shadeFree: false, seatFree: false, menuDayDu: true, ganhOut: false, cartLan: false, cartChung: false, ovenHot: false, meVuaRa: false, band: "SANG", dayIndex: 5,
  ...over,
});

const convo = (over: Partial<WorldSnapshot["convo"]>): Partial<WorldSnapshot> =>
  ({ convo: { tones: [], angered: false, openedBy: "PLAYER", ...over } });

test("W-1 ba dạng khoá, và chỉ ba dạng", () => {
  assert.equal(holds("p.handsEmpty", W()), true);
  assert.equal(holds("p.holdsBread", W()), false);
  assert.equal(holds("p.holdsBread", W({ hand: "loaf_hot" })), true);
  assert.equal(holds("!c.angered", W()), true);
  assert.equal(holds("!c.angered", W(convo({ angered: true }))), false);
  assert.equal(holds("w.queue(2)", W({ queue: 3 })), true);
  assert.equal(holds("w.queue(2)", W({ queue: 1 })), false);
  assert.equal(holds("c.saidTone(GAT)", W(convo({ tones: ["AM", "GAT"] }))), true);
});

test("W-2 khoá LẠ NÉM LỖI — không im lặng trả false", () => {
  assert.throws(() => holds("p.holdsPho", W()), /không có trong `aliases`/);
  assert.throws(() => holds("t.khongCoThat", W()), /không có trong `aliases`/);
  assert.match(checkGate("t.khongCoThat") ?? "", /t\.(passing|queueing|ordering)/);
});

test("W-3 `while` là phép VÀ; rỗng = luôn đúng", () => {
  assert.equal(allHold(undefined, W()), true);
  assert.equal(allHold([], W()), true);
  assert.equal(allHold(["p.handsEmpty", "!w.rain"], W()), true);
  assert.equal(allHold(["p.handsEmpty", "w.rain"], W()), false);
  assert.equal(firstBroken(["p.handsEmpty", "w.rain"], W()), "w.rain");
});

test("W-3b sáu tầng khoá đều đọc được — p t w c v d", () => {
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
});

test("W-3e `w.day(N)` — câu \"mới ra đây bán\" không nói được ở ngày 40", () => {
  assert.equal(holds("w.day(7)", W({ dayIndex: 3 })), true);
  assert.equal(holds("w.day(7)", W({ dayIndex: 20 })), false);
});

test("W-3c `p.stock` là NGƯỠNG, khác `p.soldOut` là 0", () => {
  assert.equal(holds("p.stock(3)", W({ stock: 2 })), true);
  assert.equal(holds("p.stock(3)", W({ stock: 9 })), false);
  assert.equal(holds("p.soldOut", W({ stock: 0 })), false);
  assert.equal(holds("p.soldOut", W({ soldOut: true })), true);
});

test("W-3d fact VẮNG MẶT khác fact bằng false — luật loại trừ của Ruskin", () => {
  const q = queryOf(W());
  assert.equal(q.dump().some(([k]) => k === "npcPurpose"), false);
  assert.equal(holds("t.purpose(DI_CHO)", W()), false);
  assert.equal(holds("t.purpose(DI_CHO)", W({ them: { ...W().them, purpose: "DI_CHO" } })), true);
});

function gateKeysOf(node: TalkNode): string[] {
  return [...needKeys(node), ...(node.while ?? [])];
}

test("W-4 mọi khoá cổng trong nội dung đều CÓ THẬT trong bảng đen", () => {
  const bad: string[] = [];
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      for (const raw of gateKeysOf(node)) {
        if (isStoryFlag(raw.startsWith("!") ? raw.slice(1) : raw)) continue;
        const err = checkGate(raw);
        if (err) bad.push(`${t.id}: ${err}`);
      }
    }
  }
  assert.deepEqual(bad, [], `\n  ${bad.join("\n  ")}`);
});

test("W-4b bảng khoá của người viết KHỚP bảng đen — không còn hai danh sách", () => {
  assert.equal(FACT_KEYS.length + FACT_FNS.length, ALIAS_NAMES.length);
  const ns = new Set(ALIAS_NAMES.map((k) => k.split(".")[0]));
  assert.deepEqual([...ns].sort(), ["c", "d", "p", "t", "v", "w"]);
});

test("W-5 câu MỜI ĂN phải đang cầm bánh; câu MỜI UỐNG phải có trà", () => {
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
