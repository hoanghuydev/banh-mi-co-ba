/**
 * DRIVE · KHUNG CẢNH · HÀNH ĐỘNG CÓ THỜI LƯỢNG — P2-09 §2.5, §2.6, §2.7.
 *
 * Ba lưới, ba chuyện khác nhau:
 *  · chấm điểm theo ĐỘ CHÊNH (Zubek) thật sự phân biệt được "đang cần" với "đã đủ";
 *  · khung cảnh bảo đảm ngữ cảnh, nên một câu chỉ còn phải đúng trong MỘT cái;
 *  · mọi act có thời lượng đều khai `forSec`, và hết giờ thì người ta về việc cũ.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ATT_FLOOR, PRACTICE_PUSH, attenuate, baseDrives, bump, decayDrives, drivesNow,
  newDrives, pickWeighted, scoreSatisfies,
} from "../src/sim/drives";
import { DRIVE_IDS, PRACTICE_IDS } from "../src/content/vocab";
import { eligible, satisfiesOf, walkNodes, type Talk, type TalkCtx } from "../src/sim/talk";
import { TalkStore } from "../src/content/talks";

const TALKS: Talk[] = await TalkStore.loadAll();
const P = (o: Partial<Record<"soi" | "nongTinh" | "deTha" | "thanThien", number>> = {}) =>
  ({ soi: 0.5, nongTinh: 0.5, deTha: 0.5, thanThien: 0.5, ...o });

// ─────────────────────────────────────────── chấm điểm (Zubek dạng độ chênh)

test("D-1 dạng ĐỘ CHÊNH: cùng một món, đang cần thì đáng hơn đã gần đủ", () => {
  /**
   * Đây là cả lý do dùng dạng (c) chứ không phải (a)/(b) của Zubek. Với dạng (a) hai
   * trường hợp dưới đây ra ĐÚNG MỘT điểm, và `pickTalk` không phân biệt được "người này
   * đang muốn kể" với "người này kể xong rồi".
   */
  const d = newDrives();
  d.KE_CHUYEN = 80;
  const dangCan = scoreSatisfies({ KE_CHUYEN: 40 }, d);
  d.KE_CHUYEN = 30;
  const daGanDu = scoreSatisfies({ KE_CHUYEN: 40 }, d);
  assert.ok(dangCan > daGanDu * 2, `đang cần ${dangCan.toFixed(2)} phải hơn hẳn đã đủ ${daGanDu.toFixed(2)}`);
});

test("D-2 làm cho một drive TỆ ĐI thì ra điểm ÂM — không cần một luật cấm nào", () => {
  const d = newDrives();
  d.VIEC_RIENG = 70;
  assert.ok(scoreSatisfies({ VIEC_RIENG: -20 }, d) < 0, "giữ người ta lại nói chuyện là một cái giá");
});

test("D-3 hàm suy giảm không nổ ở 0", () => {
  assert.ok(Number.isFinite(attenuate(0)));
  assert.equal(attenuate(0), attenuate(ATT_FLOOR), "dưới sàn thì bằng sàn");
  assert.ok(attenuate(10) > attenuate(90), "A không tăng");
});

test("D-4 `tune` của hồ sơ ĐỔI được thứ hạng — Zubek: tune theo từng agent từng nhu cầu", () => {
  const d = newDrives();
  d.KE_CHUYEN = 60; d.PHAN_NAN = 60;
  const ke = { KE_CHUYEN: 30 }, than = { PHAN_NAN: 30 };
  assert.ok(Math.abs(scoreSatisfies(ke, d) - scoreSatisfies(than, d)) < 1e-9, "không tune thì ngang nhau");
  // chú Kiệt: PHAN_NAN ×1,4 — ông tới đây để càm ràm, không để tâm sự
  const kiet = { PHAN_NAN: 1.4, DUOC_HOI: 0.7 };
  assert.ok(scoreSatisfies(than, d, kiet) > scoreSatisfies(ke, d, kiet));
});

test("D-5 mức nền suy từ TÍNH CÁCH, không phải một bảng số thứ hai", () => {
  assert.ok(baseDrives(P({ thanThien: 1 })).KE_CHUYEN > baseDrives(P({ thanThien: 0 })).KE_CHUYEN);
  assert.ok(baseDrives(P({ thanThien: 0 })).YEN_THAN > baseDrives(P({ thanThien: 1 })).YEN_THAN);
  assert.ok(baseDrives(P({ nongTinh: 1 })).DUOC_PHUC_VU > baseDrives(P({ nongTinh: 0 })).DUOC_PHUC_VU);
});

test("D-6 suy giảm VỀ MỨC NỀN, không về 0 — mức nền LÀ con người họ", () => {
  const base = baseDrives(P());
  const d = { ...base };
  bump(d, "PHAN_NAN", 50);
  decayDrives(d, base, 60);                       // một giờ game
  assert.ok(Math.abs(d.PHAN_NAN - base.PHAN_NAN) < 1e-6, "phần vượt lên tan hết");
  decayDrives(d, base, 60);
  assert.ok(d.PHAN_NAN > 0, "không bao giờ về 0");
});

test("D-7 `DOI_BANH` áp đảo mọi chuyện tán gẫu — luật thành HÌNH DẠNG, không phải `if`", () => {
  /**
   * *"Đang đợi bánh thì thứ duy nhất bạn nói được là ổ bánh."* Đây là hệ quả số học chứ
   * không phải nhánh viết tay, nên đúng cho cả nội dung chưa ai viết.
   */
  const base = baseDrives(P());
  const now = drivesNow(base, { ...base }, "DOI_BANH");
  const banh = scoreSatisfies({ DUOC_PHUC_VU: 40 }, now);
  const tanGau = scoreSatisfies({ KE_CHUYEN: 40, DUOC_HOI: 40 }, now);
  assert.ok(banh > tanGau, `ổ bánh ${banh.toFixed(2)} phải thắng tán gẫu ${tanGau.toFixed(2)}`);
});

test("D-8 mỗi khung cảnh đẩy một drive khác nhau — bảy khung, bảy nghĩa", () => {
  assert.equal(Object.keys(PRACTICE_PUSH).length, PRACTICE_IDS.length);
  for (const p of PRACTICE_IDS) assert.ok(Object.keys(PRACTICE_PUSH[p]).length > 0, `${p} không đẩy gì`);
  assert.ok((PRACTICE_PUSH.DI_NGANG.VIEC_RIENG ?? 0) > 40, "người đi ngang còn việc của họ");
  assert.ok((PRACTICE_PUSH.DOI_BANH.DUOC_PHUC_VU ?? 0) > (PRACTICE_PUSH.XEP_HANG.DUOC_PHUC_VU ?? 0));
});

test("D-9 rút trong TOP-3, không winner-takes-all", () => {
  const list = [{ item: "a", score: 10 }, { item: "b", score: 9 }, { item: "c", score: 8 }, { item: "d", score: -50 }];
  const seen = new Set<string>();
  for (let i = 0; i < 40; i++) seen.add(pickWeighted(list, i / 40)!);
  assert.ok(seen.size >= 2, "winner-takes-all làm nhân vật trông máy móc (Zubek)");
  assert.ok(!seen.has("d"), "cuộc ngoài top-3 không được lọt");
});

// ─────────────────────────────────────────── nội dung

test("D-10 mọi cuộc đều chấm ra một con số HỮU HẠN, và tán gẫu KHÔNG BAO GIỜ miễn phí", () => {
  const base = baseDrives(P());
  for (const t of TALKS) {
    const sat = satisfiesOf(t);
    assert.ok(Object.keys(sat).length > 0, `${t.id}: không thoả drive nào`);
    assert.ok((sat.VIEC_RIENG ?? 0) <= 0, `${t.id}: đứng nói chuyện phải TỐN việc của người ta, không được cộng`);
    for (const p of PRACTICE_IDS) {
      const n = scoreSatisfies(sat, drivesNow(base, { ...base }, p));
      assert.ok(Number.isFinite(n), `${t.id} @ ${p}: điểm không hữu hạn`);
    }
  }
});

test("D-11 mọi act có THỜI LƯỢNG đều khai `forSec` — P2-07 §3.5", () => {
  /**
   * Không có `forSec` thì vào chỗ mát là đứng luôn cả ngày.
   */
  const TIMED = new Set(["STEP_ASIDE", "STAND_IN_SHADE", "LOOK_INSIDE", "GIVE_BREAD", "OFFER_TEA"]);
  const bad: string[] = [];
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      const a = node.act as { kind: string; forSec?: unknown } | undefined;
      if (a && TIMED.has(a.kind) && a.forSec === undefined) bad.push(`${t.id}: ${a.kind} — "${node.say}"`);
    }
  }
  assert.deepEqual(bad, [], `\n  ${bad.join("\n  ")}`);
});

test("D-12 KHÔNG act nào trả thưởng NGAY LÚC NÓI — Zubek: thưởng trao tay trong hành động", () => {
  /** Trả thưởng lúc HỨA thì cách chơi tối ưu là hứa rồi quên. */
  const bad: string[] = [];
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      if (node.act?.kind !== "PROMISE_DEED") continue;
      if (node.calm) bad.push(`${t.id}: "${node.say}" — thưởng phải nằm ở \`onKept\``);
    }
  }
  assert.deepEqual(bad, [], `\n  ${bad.join("\n  ")}`);
});

test("D-13 mỗi khung cảnh đều có cuộc sống được — không khung nào CÂM", () => {
  const n = new Map<string, number>();
  for (const t of TALKS) {
    const list = t.practice ? (Array.isArray(t.practice) ? t.practice : [t.practice]) : PRACTICE_IDS;
    for (const p of list) n.set(p, (n.get(p) ?? 0) + 1);
  }
  for (const p of PRACTICE_IDS) {
    if (p === "NGHE_LOM") continue;                  // cảnh NPC↔NPC: người chơi không xen vào
    assert.ok((n.get(p) ?? 0) >= 3, `${p}: chỉ ${n.get(p) ?? 0} cuộc — bấm phím ra một dải gần rỗng`);
  }
});

test("D-14 sáu drive, và không có cái thứ bảy lẻn vào", () => {
  assert.equal(DRIVE_IDS.length, 6);
  assert.deepEqual(Object.keys(newDrives()).sort(), [...DRIVE_IDS].sort());
});

// ─────────────────────────────────────────── cổng cấp CUỘC (P2-09 §2.5 · `TalkWhen.world`)

test("D-15 `when.world` rút cả CUỘC ra, không phải ẩn một lựa chọn", () => {
  /**
   * `duong.mui` (MÙI BÁNH) khoá cả chủ đề, không khoá từng nút: khoá ở nút thì `T002` đòi
   * nằm ở `while` (ra "?"), còn `T011` thấy nhánh người-chơi-mở-lời teo xuống một dòng.
   */
  const mui = TALKS.find((t) => t.id === "duong.mui")!;
  /*
   * ⚠️ `w.meVuaRa` chứ KHÔNG phải `w.ovenHot`: cái sau có `ovenBusy ||` ở trước nên lúc
   * đang bán nó đúng gần như 100%, tức cuộc này coi như không khoá gì. Mùi bánh là một
   * KHOẢNH KHẮC (mẻ vừa ra trong `OVEN_SMELL_SEC`), không phải trạng thái "lò đang nhen".
   */
  assert.deepEqual(mui.when?.world, ["w.meVuaRa"], "cuộc về mùi bánh phải khoá ở TẦNG CUỘC");

  const ctx = (ovenHot: boolean): TalkCtx => ({
    npcId: "QUA_DUONG", day: 5, slot: "MID", rain: false,
    flags: {}, usedToday: [], usedBefore: [], practice: "DI_NGANG",
    holds: (k) => (k === "w.meVuaRa" ? ovenHot : true),
  });
  const ids = (on: boolean) => eligible(TALKS.filter((t) => t.npc === "QUA_DUONG"), ctx(on), "PLAYER").map((t) => t.id);
  assert.ok(ids(true).includes("duong.mui"), "lò đang nhen ⇒ rút được");
  assert.ok(!ids(false).includes("duong.mui"), "không có mùi nào ⇒ KHÔNG rút ra");
  assert.ok(ids(false).length >= 3, "tắt một cuộc không được làm cạn cả kho");
});

test("D-16 KHÔNG nút nào khoá `w.ovenHot` ở tầng nút", () => {
  // Khoá ở tầng cuộc (`when.world`) mới đúng tầng — xem D-15.
  const bad: string[] = [];
  for (const t of TALKS) {
    for (const { node } of walkNodes(t)) {
      const keys = [...(Array.isArray(node.need) ? node.need : node.need ? [node.need] : []), ...(node.while ?? [])];
      if (keys.includes("w.ovenHot")) bad.push(`${t.id}: "${node.say}"`);
    }
  }
  assert.deepEqual(bad, [], `\n  ${bad.join("\n  ")}`);
});
