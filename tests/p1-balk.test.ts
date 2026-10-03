/**
 * Luật QUAY ĐẦU Ở ĐẦU HẺM (`sim/service.balkChance`). Giữ hai thứ:
 *  1. HÌNH DẠNG đường cong — mấy con số là HỢP ĐỒNG, đổi chúng là đổi cảm giác giờ cao điểm
 *  2. ⚠️ RANH GIỚI với `queuePatienceMul`: hai luật NGƯỢC CHIỀU một cách cố ý (hàng dài làm người
 *     ta ngại VÀO, nhưng vào rồi thì chính nó làm người ta chờ LÂU HƠN). Trộn hai cái là vỡ ở đây.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { newGame, type SaveFile } from "../src/core/save";
import { HeadlessStall, POLICIES, type Policy } from "../src/sim/headless";
import { balkChance, balkFrom } from "../src/sim/service";
import { peakCap } from "../src/sim/season";
import { QUEUE_SLOTS, CUSTOMER_GATE } from "../src/world/map";
import type { Personality } from "../src/content/npcs";

const SLOTS = QUEUE_SLOTS.length;
const P = (nongTinh: number): Personality => ({ soi: 0.5, nongTinh, deTha: 0.5, thanThien: 0.5 });
/** Người bình thường, quan hệ bình thường, tâm trạng bình thường, không vội. */
const plain = (ahead: number, slots: number = SLOTS) =>
  balkChance({ ahead, slots, person: P(0.5), relVisitMul: 1, moodPatience: 1, rushing: false });

// ────────────────────────────────────────────────────── hình dạng đường cong

test("hàng ngắn thì KHÔNG AI quay đầu — kể cả người nóng nhất hẻm, đang vội, đang bực", () => {
  for (let ahead = 0; ahead < balkFrom(SLOTS); ahead++) {
    const p = balkChance({
      ahead, slots: SLOTS, person: P(1), relVisitMul: 0.45, moodPatience: 0.85, rushing: true,
    });
    assert.equal(p, 0, `hàng ${ahead} người mà đã có người quay đầu`);
  }
});

test("quầy TRỐNG thì xác suất đúng bằng 0, không phải 'rất nhỏ'", () => {
  assert.equal(plain(0), 0);
});

test("ngưỡng suy ra từ SỐ CHỖ, không chép số người", () => {
  // 6 chỗ → từ người thứ tư; 4 chỗ (bản đồ cũ) → từ người thứ ba. Cùng một dòng code.
  assert.equal(balkFrom(6), 4);
  assert.equal(balkFrom(4), 3);
  for (const slots of [4, 6]) {
    const from = balkFrom(slots);
    assert.equal(plain(from - 1, slots), 0, `${slots} chỗ: ${from - 1} người chưa phải hàng dài`);
    assert.ok(plain(from, slots) > 0, `${slots} chỗ: ${from} người phải bắt đầu có người ngại`);
  }
});

test("đơn điệu không giảm: hàng dài thêm không bao giờ làm người ta DỄ vào hơn", () => {
  for (let n = 1; n <= SLOTS + 4; n++) assert.ok(plain(n) >= plain(n - 1), `tụt ở ${n} người`);
});

test("mọi bậc đều là XÁC SUẤT THẬT (0 < p < 1) — cùng một hàng phải ra được hai câu trả lời", () => {
  // Đây là cái chặn "ngưỡng cứng": nếu có bậc nào p = 1 thì người chơi học được một con
  // số ma ("quá 5 người là mất khách"), thay vì học cách đọc tình hình.
  for (let ahead = balkFrom(SLOTS); ahead <= SLOTS + 2; ahead++) {
    const p = plain(ahead);
    assert.ok(p > 0 && p < 1, `bậc ${ahead} người ra ${p} — không còn là xác suất nữa`);
  }
});

test("cùng độ dài hàng, hai người hai câu trả lời khác hẳn nhau", () => {
  const ahead = SLOTS - 1;                               // còn đúng một chỗ trống
  const nong = balkChance({ ahead, slots: SLOTS, person: P(0.9), relVisitMul: 0.45, moodPatience: 0.85, rushing: true });
  const diem = balkChance({ ahead, slots: SLOTS, person: P(0.2), relVisitMul: 1.15, moodPatience: 1.1, rushing: false });
  assert.ok(nong > diem * 2, `người nóng ${nong} phải ngại hơn hẳn người điềm đạm ${diem}`);
  assert.ok(diem > 0, "người điềm đạm vẫn có thể quay đầu — chỉ là ít hơn");
});

test("khách ruột quý mình thì chịu xếp hàng hơn người lạ, người lạ hơn người đang giận", () => {
  const at = (relVisitMul: number) =>
    balkChance({ ahead: SLOTS - 1, slots: SLOTS, person: P(0.5), relVisitMul, moodPatience: 1, rushing: false });
  // đúng ba con số của `memory.visitProbabilityMul`: Friend 1,15 · Acquaintance 1,0 · Rival 0,45
  assert.ok(at(1.15) < at(1.0), "người thân phải ngại ÍT hơn người lạ");
  assert.ok(at(1.0) < at(0.45), "người đang giận phải ngại HƠN người lạ");
  // nhưng không được phạt cùng một mối giận hai lần: 1/0,45 = 2,22 bị chặn lại
  assert.ok(at(0.45) < at(1.0) * 2, "hệ số quan hệ phải bị chặn, không nhân nguyên 1/0,45");
});

test("hàng KÍN CHỖ: tính cách không đẻ ra được một chỗ đứng", () => {
  const full = (p: Personality, rel: number) =>
    balkChance({ ahead: SLOTS, slots: SLOTS, person: p, relVisitMul: rel, moodPatience: 1, rushing: false });
  const a = full(P(0.1), 1.15), b = full(P(0.95), 0.45);
  assert.equal(a, b, "hết chỗ đứng là chuyện vật lý, không phải chuyện tính cách");
  assert.ok(a > plain(SLOTS - 1), "kín chỗ phải cao hơn mọi bậc còn chỗ");
  assert.ok(a < 1, "vẫn phải là xác suất — còn người liều đứng tràn ra lề");
  assert.equal(full(P(0.5), 1), plain(SLOTS + 3), "quá chỗ thì dài thêm cũng không hơn");
});

// ────────────────────────────────────────────────────────── chạy thật một ngày

/** Người chơi chậm tay: đó là người duy nhất làm cái hàng dài ra được. */
const CHAM: Policy = { ...POLICIES.greedy, name: "cham", workSec: [25, 40] };
const dayOf = (day: number): SaveFile => {
  const w = newGame("t", "balk-save");
  w.progress.dayIndex = day;
  return w;
};

type Run = {
  h: HeadlessStall;
  balked: string[];
  /** visitId của những người ĐÃ từng đứng vào hàng (slot ≥ 0, hoặc đã qua phase chờ). */
  queued: Set<string>;
  left: Map<string, string>;
  arrived: string[];
};

function play(day: number, watch?: (h: HeadlessStall) => void): Run {
  const bus = new Bus();
  const balked: string[] = [];
  const queued = new Set<string>();
  const left = new Map<string, string>();
  const arrived: string[] = [];
  const h = new HeadlessStall(dayOf(day), CHAM, { bus });
  bus.on("npc:arrived", (p) => arrived.push(p.visitId));
  bus.on("npc:left", (p) => { left.set(p.visitId, p.reason); if (p.reason === "BALKED") balked.push(p.visitId); });
  h.run({
    inject: () => {
      for (const c of h.service.customers) {
        if (c.slot >= 0 || c.phase === "queueing" || c.phase === "ordering" || c.phase === "waiting") queued.add(c.id);
      }
      watch?.(h);
    },
  });
  return { h, balked, queued, left, arrived };
}

test("chạy thật: có người quay đầu, mà cái hàng đó vẫn có người chịu xếp vào", () => {
  const r = play(13);
  assert.ok(r.balked.length >= 2, `ngày 13 phải có người quay đầu, đang có ${r.balked.length}`);
  assert.ok(r.h.service.servedCount > r.balked.length * 2,
    "quay đầu phải là thiểu số — nếu đa số quay đầu thì giờ cao điểm thành bức tường");
});

test("RANH GIỚI: không một ai đã xếp vào hàng mà bỏ đi vì 'đông'", () => {
  // Đây là chỗ hợp đồng `queuePatienceMul` bị đụng tới. Người đã đứng vào hàng chỉ được
  // bỏ đi vì IMPATIENT (chờ quá 1,6 lần sức chờ) — không bao giờ vì BALKED.
  for (const day of [11, 12, 13, 16]) {
    const r = play(day);
    for (const id of r.balked) {
      assert.ok(!r.queued.has(id), `ngày ${day}: ${id} đã đứng vào hàng rồi mà vẫn tính là quay đầu`);
    }
  }
});

test("người đang quay đầu không tích một giây chờ nào, và không chiếm chỗ của ai", () => {
  play(13, (h) => {
    for (const c of h.service.customers) {
      if (!c.balking) continue;
      assert.equal(c.waitSec, 0, "đồng hồ chờ không được chạy cho người chưa xếp vào hàng");
      assert.equal(c.slot, -1, "người quay đầu không được cấp chỗ trong hàng");
      assert.ok(c.phase === "arriving" || c.phase === "leaving", `phase lạ: ${c.phase}`);
    }
  });
});

test("khách quay đầu phải ĐI BỘ ra cho người chơi thấy, không bị xoá tại cổng", () => {
  let deepest = 0, sawLeaving = false;
  play(13, (h) => {
    for (const c of h.service.customers) {
      if (!c.balking) continue;
      deepest = Math.max(deepest, Math.hypot(c.x - CUSTOMER_GATE.x, c.y - CUSTOMER_GATE.y));
      if (c.phase === "leaving") sawLeaving = true;
    }
  });
  assert.ok(deepest > 1.5, `chỉ đi vô được ${deepest.toFixed(2)} ô — gần như không thấy gì trên màn hình`);
  assert.ok(sawLeaving, "phải đi qua phase 'leaving' như mọi người khác, không biến mất lúc đang 'arriving'");
});

test("quay đầu KHÔNG tính vào `lost` của ngày", () => {
  const r = play(13);
  const impatient = [...r.left.values()].filter((x) => x === "IMPATIENT").length;
  assert.ok(r.balked.length > 0 && impatient > 0, "ngày này phải có cả hai kiểu để so");
  assert.equal(r.h.ctx.world.progress.today.lost, impatient,
    "`lost` là 'người chơi để mất khách' — hàng dài là hệ quả của bán được, không đếm vào đó");
  assert.equal(r.h.service.balkedCount, r.balked.length);
  assert.equal(r.h.service.lostCount, impatient);
});

test("quay đầu không phải một lượt ghé: không nhích `visits`, không ghi gì vào trí nhớ", () => {
  const r = play(13);
  const named = new Set(Object.keys(r.h.ctx.world.npcs));
  // người đi ngang có `npc:arrived` mà không bao giờ có `npc:left` — trừ ra
  const real = r.arrived.filter((id) => r.left.has(id));
  let checked = 0;
  for (const key of named) {
    const mine = real.filter((id) => id.startsWith(`${key}#`));
    if (!mine.length) continue;
    const balked = mine.filter((id) => r.balked.includes(id)).length;
    assert.equal(r.h.ctx.world.npcs[key].visits, mine.length - balked, `visits của ${key}`);
    // người mà cả ngày chỉ ghé đúng một lần, và lần đó quay đầu: sổ nhớ phải SẠCH TRƠN
    if (mine.length === 1 && balked === 1) {
      const s = r.h.ctx.world.npcs[key];
      assert.equal(s.relationPoints, 0, `${key}: quay đầu mà quan hệ vẫn nhúc nhích`);
      assert.equal(s.memory.short.length + s.memory.long.length + (s.memory.core ? 1 : 0), 0,
        `${key}: quay đầu mà vẫn bị ghi một mục trí nhớ — người bán có làm gì sai đâu`);
      checked++;
    }
  }
  assert.ok(checked > 0, "không có ca nào để kiểm — đổi ngày đi");
});

test("tất định: cùng seed, cùng người quay đầu, cùng thứ tự", () => {
  for (const day of [12, 13]) {
    const a = play(day), b = play(day);
    assert.deepEqual(b.balked, a.balked);
    assert.ok(a.balked.length > 0);
  }
});

test("chế độ không giới hạn thời gian: trần MỘT khách nên không bao giờ chạm ngưỡng", () => {
  // Hai lớp khoá, cố ý trùng nhau. Lớp ngoài: `spawn()` tắt hẳn luật quay đầu khi
  // `deps.noTimePressure` — thêm một cửa mất khách vào chế độ dành cho người chơi thong
  // thả là sai. Lớp trong (kiểm ở đây, vì nó đo được): `peakCap` ép MỘT khách một lượt
  // (P4-02 §4), mà một người thì còn xa mới tới mốc "hàng dài".
  for (const day of [1, 13, 40]) {
    assert.equal(peakCap(day, true), 1);
    assert.ok(peakCap(day, true) < balkFrom(SLOTS), "trần khách phải nằm dưới ngưỡng ngại");
    assert.equal(plain(peakCap(day, true)), 0);
  }
});
