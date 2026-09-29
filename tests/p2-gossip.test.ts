/**
 * P2-04 §6 — bất biến của đồn thổi + nhớ nhầm. Mô phỏng mùa bằng headless (bot người mới:
 * hay rớt bánh, hay làm thiếu → có chuyện để kể).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { newGame, type SaveFile } from "../src/core/save";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import {
  CLAIM, GOSSIP_START_DAY, MAX_HOPS, MUTATION_GRAPH, SEASON_MUTATIONS, gossipTick, newGossipState, tellWillingness, witness,
} from "../src/sim/gossip";
import { OverhearScene } from "../src/sim/overhear";
import { ROOT } from "../tools/lib";

function season(days: number, id: string, allowFalse = true): SaveFile {
  const w = newGame("g", id);
  w.a11y.allowFalseMemory = allowFalse;
  for (let d = 1; d <= days; d++) {
    if (d > 1) nextDay(w);
    new HeadlessStall(w, POLICIES.newbie).run();
  }
  nextDay(w);                                              // settle đêm cuối
  return w;
}

const A = season(30, "gossip-a");

test("trước ngày 4 không ai kể ai (RB6: không có trong ~2 giờ chơi đầu)", () => {
  assert.ok(A.gossip.log.length > 0);
  assert.ok(A.gossip.log.every((e) => e.day >= GOSSIP_START_DAY));
});

test("chứng kiến thì nhớ ĐÚNG: không belief hops 0 nào bị méo; chain.length === hops ≤ 3; nguồn luôn có", () => {
  for (const list of Object.values(A.gossip.beliefs)) {
    for (const b of list) {
      if (b.hops === 0) { assert.equal(b.mutated, false); assert.equal(b.from, null); continue; }
      assert.equal(b.chain.length, b.hops);
      assert.ok(b.hops <= MAX_HOPS);
      assert.ok(b.from, "belief nghe kể mà không có nguồn");
      assert.equal(b.from, b.chain.at(-1));
      assert.ok(b.intensityMul <= 1.6);
    }
  }
});

test("ngân sách nhớ nhầm: ≤ 4 lần cả mùa, cách nhau ≥ 6 ngày, không trước ngày 8", () => {
  const m = A.gossip.log.filter((e) => e.mutatedHere);
  assert.ok(m.length <= SEASON_MUTATIONS);
  assert.ok(A.gossip.budget.mutationsLeft >= 0);
  for (let i = 1; i < m.length; i++) assert.ok(m[i].day - m[i - 1].day >= 6);
  assert.ok(m.every((e) => e.day >= 8));
});

test("tắt công tắc 'nhớ nhầm' → 0 lần méo, NHƯNG đồn thổi vẫn chạy", () => {
  const B = season(20, "gossip-b", false);
  assert.equal(B.gossip.log.filter((e) => e.mutatedHere).length, 0);
  assert.ok(B.gossip.log.length > 0);
});

test("tên người, tên NPC, món 'như mọi bữa' là BẤT KHẢ XÂM PHẠM", () => {
  assert.equal(MUTATION_GRAPH.PLAYER_NAME, null);
  assert.equal(MUTATION_GRAPH.NPC_NAME, null);
  assert.equal(MUTATION_GRAPH.USUAL_ORDER, null);
});

test("chị Lan × bánh rớt = 0,55 (khớp P2-02 §4.6); tellWillingness KHÔNG đọc deTha (bịt §8b)", () => {
  assert.equal(tellWillingness("CHI_LAN", "DROPPED_FOOD"), 0.55);
  const src = readFileSync(join(ROOT, "src", "sim", "gossip.ts"), "utf8");
  const body = src.slice(src.indexOf("export function tellWillingness"), src.indexOf("export function personalityBias"));
  assert.ok(!/deTha/.test(body.replace(/\/\*\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")));
});

test("mọi dòng nghe-kể (hearsay, tell) đều có {source} — sợi chỉ để lần", () => {
  for (const [id, c] of Object.entries(CLAIM)) {
    for (const s of [...c.hearsay, ...c.tell]) assert.ok(s.includes("{source}"), `${id}: "${s}"`);
  }
});

test("cùng save + cùng ngày → tick byte-identical (CANON §8e)", () => {
  const mk = () => {
    const g = newGossipState();
    witness(g, "BA_BAY", "DROPPED_FOOD", 75, 9);
    witness(g, "CO_MAI", "REMEMBERED_USUAL", 90, 9);
    return gossipTick(g, { saveId: "det", day: 9, allowFalseMemory: true, present: () => true });
  };
  assert.deepEqual(mk(), mk());
});

test("chuỗi đầu tiên có KỊCH BẢN: người đầu tiên thấy bánh rớt kể cho bà Sáu ngay đêm đó, sáng mai có cảnh nghe lỏm", () => {
  const g = newGossipState();
  witness(g, "CHU_TU", "DROPPED_FOOD", 75, 7);
  const sent = gossipTick(g, { saveId: "s", day: 7, allowFalseMemory: true, present: () => false });
  assert.equal(sent[0].from, "CHU_TU");
  assert.equal(sent[0].to, "BA_SAU");
  assert.ok(g.overhear && g.overhear.day === 8);
  assert.ok(g.overhear.lines[0].length > 0);
});

test("nghe lỏm: tầng 1 giấu tên nguồn, tầng 2 hiện đủ; lỡ lõm khách thì hôm đó thôi", () => {
  const g = newGossipState();
  witness(g, "BA_BAY", "DROPPED_FOOD", 75, 7);
  gossipTick(g, { saveId: "o", day: 7, allowFalseMemory: true, present: () => true });   // bà Bảy → bà Sáu
  g.overhear = null;
  gossipTick(g, { saveId: "o", day: 8, allowFalseMemory: false, present: () => true });  // bà Sáu kể tiếp
  const plan = g.overhear!;
  if (plan.source) {
    const sc = new OverhearScene(plan, { reducedMotion: false, noTimePressure: false });
    sc.tick(0.1, { minutes: 500, quiet: true, tier: 1 });
    assert.ok(sc.text(1).includes("…"));
    assert.ok(!sc.text(1).includes(CLAIM[plan.claim] ? "{source}" : "x"));
    assert.equal(sc.text(0), "· · ·");
  }
  const late = new OverhearScene(plan, { reducedMotion: false, noTimePressure: false });
  late.tick(0.1, { minutes: 11 * 60, quiet: true, tier: 2 });
  assert.equal(late.state, "DONE");
});

test("danh sách ĐEN: tin đồn không bao giờ đổi GIÁ bánh — tệ nhất là không có boa", () => {
  const w = newGame("price", "gossip-price");
  let paid = 0;
  for (let d = 1; d <= 12; d++) {
    if (d > 1) nextDay(w);
    const h = new HeadlessStall(w, POLICIES.newbie);
    const drain = h.service.drain.bind(h.service);
    h.service.drain = () => {
      const out = drain();
      for (const e of out) {
        if (e.kind !== "paid") continue;
        paid++;
        // thiếu tiền lẻ thì bớt ≤ 5k (P3-03 §2.8), vía tốt làm tròn lên 1k — ngoài ra giá là giá
        const base = e.amount - e.tip;
        assert.ok([25_000, 32_000, 40_000].some((p) => base >= p - 5000 && base <= p + 1000), `${base}`);
      }
      return out;
    };
    h.run();
  }
  assert.ok(paid > 50, `chỉ thấy ${paid} lượt trả tiền`);
  assert.ok(Object.values(w.gossip.beliefs).flat().some((b) => b.hops > 0), "12 ngày mà chưa ai nghe kể gì");
});
