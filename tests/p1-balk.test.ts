import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { newGame, type SaveFile } from "../src/core/save";
import { HeadlessStall, POLICIES, type Policy } from "../src/sim/headless";
import { balkChance, balkFrom } from "../src/sim/service";
import { peakCap } from "../src/sim/ease";
import { QUEUE_SLOTS, CUSTOMER_GATE } from "../src/world/map";
import type { Personality } from "../src/content/npcs";

const SLOTS = QUEUE_SLOTS.length;
const P = (nongTinh: number): Personality => ({ soi: 0.5, nongTinh, deTha: 0.5, thanThien: 0.5 });
const plain = (ahead: number, slots: number = SLOTS) =>
  balkChance({ ahead, slots, person: P(0.5), moodPatience: 1, rushing: false });

test("hàng ngắn thì KHÔNG AI quay đầu — kể cả người nóng nhất hẻm, đang vội, đang bực", () => {
  for (let ahead = 0; ahead < balkFrom(SLOTS); ahead++) {
    const p = balkChance({
      ahead, slots: SLOTS, person: P(1), moodPatience: 0.85, rushing: true,
    });
    assert.equal(p, 0, `hàng ${ahead} người mà đã có người quay đầu`);
  }
});

test("quầy TRỐNG thì xác suất đúng bằng 0, không phải 'rất nhỏ'", () => {
  assert.equal(plain(0), 0);
});

test("ngưỡng suy ra từ SỐ CHỖ, không chép số người", () => {
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
  for (let ahead = balkFrom(SLOTS); ahead <= SLOTS + 2; ahead++) {
    const p = plain(ahead);
    assert.ok(p > 0 && p < 1, `bậc ${ahead} người ra ${p} — không còn là xác suất nữa`);
  }
});

test("cùng độ dài hàng, hai người hai câu trả lời khác hẳn nhau", () => {
  const ahead = SLOTS - 1;
  const nong = balkChance({ ahead, slots: SLOTS, person: P(0.9), moodPatience: 0.85, rushing: true });
  const diem = balkChance({ ahead, slots: SLOTS, person: P(0.2), moodPatience: 1.1, rushing: false });
  assert.ok(nong > diem * 2, `người nóng ${nong} phải ngại hơn hẳn người điềm đạm ${diem}`);
  assert.ok(diem > 0, "người điềm đạm vẫn có thể quay đầu — chỉ là ít hơn");
});

test("hàng KÍN CHỖ: tính cách không đẻ ra được một chỗ đứng", () => {
  const full = (p: Personality) =>
    balkChance({ ahead: SLOTS, slots: SLOTS, person: p, moodPatience: 1, rushing: false });
  const a = full(P(0.1)), b = full(P(0.95));
  assert.equal(a, b, "hết chỗ đứng là chuyện vật lý, không phải chuyện tính cách");
  assert.ok(a > plain(SLOTS - 1), "kín chỗ phải cao hơn mọi bậc còn chỗ");
  assert.ok(a < 1, "vẫn phải là xác suất — còn người liều đứng tràn ra lề");
  assert.equal(full(P(0.5)), plain(SLOTS + 3), "quá chỗ thì dài thêm cũng không hơn");
});

const CHAM: Policy = { ...POLICIES.greedy, name: "cham", workSec: [25, 40] };
const dayOf = (day: number): SaveFile => {
  const w = newGame("t", "balk-save");
  w.progress.dayIndex = day;
  return w;
};

type Run = {
  h: HeadlessStall;
  balked: string[];
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

/** Lịch khách đổi theo cân bằng từng phase, nên dò ngày dựng được tình huống thay vì neo vào một ngày. */
function findDay(want: (r: Run) => boolean, from = 11, to = 22): Run {
  for (let d = from; d <= to; d++) {
    const r = play(d);
    if (want(r)) return r;
  }
  throw new Error(`không ngày nào trong ${from}–${to} dựng được tình huống`);
}

const impatientOf = (r: Run) => [...r.left.values()].filter((x) => x === "IMPATIENT").length;

test("chạy thật: có người quay đầu, mà cái hàng đó vẫn có người chịu xếp vào", () => {
  const r = findDay((x) => x.balked.length >= 1);
  assert.ok(r.h.service.servedCount > r.balked.length * 2,
    "quay đầu phải là thiểu số — nếu đa số quay đầu thì giờ cao điểm thành bức tường");
});

test("RANH GIỚI: không một ai đã xếp vào hàng mà bỏ đi vì 'đông'", () => {
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
  const r = findDay((x) => x.balked.length > 0 && impatientOf(x) > 0);
  const impatient = impatientOf(r);
  assert.equal(r.h.ctx.world.progress.today.lost, impatient,
    "`lost` là 'người chơi để mất khách' — hàng dài là hệ quả của bán được, không đếm vào đó");
  assert.equal(r.h.service.balkedCount, r.balked.length);
  assert.equal(r.h.service.lostCount, impatient);
});

test("quay đầu không phải một lượt ghé: không nhích `visits`", () => {
  const r = findDay((x) => x.balked.some((id) => !id.startsWith("walkin")));
  const named = new Set(Object.keys(r.h.ctx.world.npcs));
  // người đi ngang có `npc:arrived` mà không có `npc:left` nên lọc ra
  const real = r.arrived.filter((id) => r.left.has(id));
  let checked = 0;
  for (const key of named) {
    const mine = real.filter((id) => id.startsWith(`${key}#`));
    if (!mine.length) continue;
    const balked = mine.filter((id) => r.balked.includes(id)).length;
    assert.equal(r.h.ctx.world.npcs[key].visits, mine.length - balked, `visits của ${key}`);
    if (balked) checked++;
  }
  assert.ok(checked > 0, "không có ca nào để kiểm — đổi ngày đi");
});

test("tất định: cùng seed, cùng người quay đầu, cùng thứ tự", () => {
  for (const day of [17, 23]) {
    const a = play(day), b = play(day);
    assert.deepEqual(b.balked, a.balked);
    assert.ok(a.balked.length > 0);
  }
});

test("chế độ không giới hạn thời gian: trần MỘT khách nên không bao giờ chạm ngưỡng", () => {
  for (const day of [1, 13, 40]) {
    assert.equal(peakCap(day, true), 1);
    assert.ok(peakCap(day, true) < balkFrom(SLOTS), "trần khách phải nằm dưới ngưỡng ngại");
    assert.equal(plain(peakCap(day, true)), 0);
  }
});
