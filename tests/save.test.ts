import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { memoryPlatform, type Platform } from "../src/core/platform";
import { SCHEMA_VERSION, SaveService, newGame, type SaveFile } from "../src/core/save";

function service(world: SaveFile, platform: Platform, bus = new Bus()) {
  return new SaveService(bus, () => structuredClone(world), platform);
}

test("save chứa đủ các nhóm (+ sổ cái, trợ năng, cờ)", () => {
  const s = newGame("x", "id-1");
  for (const k of ["progress", "rng", "money", "inventory", "equipment", "npcs",
    "shuffleBags", "dialogState", "stall", "ledger", "a11y", "telemetry", "flags"]) {
    assert.ok(k in s, `thiếu nhóm ${k}`);
  }
  assert.equal(s.schemaVersion, SCHEMA_VERSION);
});

test("ghi rồi đọc lại ra đúng thế giới; ghi luân phiên A/B", () => {
  const p = memoryPlatform();
  const w = newGame("x", "id-2");
  const sv = service(w, p);
  const slots: string[] = [];
  const bus = (sv as any).bus as Bus;
  bus.on("save:written", (e) => slots.push(e.slot));
  w.money.cash = 777;
  sv.flushNow();
  w.money.cash = 888;
  sv.flushNow();
  assert.deepEqual(slots, ["A", "B"]);
  const back = new SaveService(new Bus(), () => { throw new Error(); }, p).load()!;
  assert.equal(back.money.cash, 888);
  assert.equal(back.saveId, "id-2");
});

test("kill giữa lúc ghi 50 lần → 50/50 lần load lại được save hợp lệ (double-buffer)", () => {
  const base = memoryPlatform();
  const w = newGame("x", "id-3");
  service(w, base).flushNow();
  let committed = w.money.cash;
  for (let i = 0; i < 50; i++) {
    // Nền tảng "chết" đúng lúc đang ghi slot: slot nhận nửa file, meta không kịp cập nhật.
    const dying: Platform = {
      ...base,
      write: (k, v) => {
        if (k.includes("slot")) { base.write(k, v.slice(0, Math.floor(v.length / 2))); throw new Error("mất điện"); }
        return base.write(k, v);
      },
    };
    w.money.cash = 1000 + i;
    assert.throws(() => service(w, dying).flushNow());
    const back = new SaveService(new Bus(), () => { throw new Error(); }, base).load();
    assert.ok(back, `lần ${i}: không load được`);
    assert.equal(back!.money.cash, committed, `lần ${i}: sai dữ liệu`);
    if (i % 5 === 0) {
      service(w, base).flushNow();
      committed = w.money.cash;
    }
  }
});

test("slot đang hoạt động hỏng → lùi về slot kia", () => {
  const p = memoryPlatform();
  const w = newGame("x", "id-4");
  w.money.cash = 1; service(w, p).flushNow();            // → A
  w.money.cash = 2; const sv = service(w, p); sv.flushNow();   // → B (meta trỏ B)
  p.write("byesep.slotB", "{hỏng");
  const back = new SaveService(new Bus(), () => { throw new Error(); }, p).load()!;
  assert.equal(back.money.cash, 1);
});

test("save khác SCHEMA_VERSION = không có save, không crash", () => {
  for (const v of [SCHEMA_VERSION - 1, SCHEMA_VERSION + 1]) {
    const p = memoryPlatform();
    const w = newGame("x", "id-old");
    service(w, p).flushNow();
    const meta = JSON.parse(p.read("byesep.meta")!);
    p.write("byesep.meta", JSON.stringify({ ...meta, schemaVersion: v }));
    const sv = new SaveService(new Bus(), () => { throw new Error(); }, p);
    assert.equal(sv.hasSave(), false, `v${v}`);
    assert.equal(sv.load(), null, `v${v}`);
    assert.equal(sv.parse(JSON.stringify({ ...w, schemaVersion: v })), null, `v${v}`);
  }
});

test("checksum sai thì CẢNH BÁO, không chặn (§8f)", () => {
  const p = memoryPlatform();
  const w = newGame("x", "id-5");
  service(w, p).flushNow();
  const raw = p.read("byesep.slotA")!;
  p.write("byesep.slotA", raw.replace(`"cash":${w.money.cash}`, '"cash":999999999'));
  const bus = new Bus();
  const marks: string[] = [];
  bus.on("telemetry:mark", (m) => marks.push(m.key));
  const back = new SaveService(bus, () => { throw new Error(); }, p).load()!;
  assert.equal(back.money.cash, 999999999);
  assert.deepEqual(marks, ["save.checksum_mismatch"]);
});

test("bản chụp đầu ngày: giữ tối đa 2 bản", () => {
  const p = memoryPlatform();
  const w = newGame("x", "id-6");
  const sv = service(w, p);
  for (let d = 1; d <= 4; d++) { w.progress.dayIndex = d; sv.writeDayStart(structuredClone(w)); }
  assert.equal(p.keys("byesep.day.id-6:").length, 2);
  assert.equal(sv.readDayStart("id-6", 4)!.progress.dayIndex, 4);
  assert.equal(sv.readDayStart("id-6", 2), null);
});

test("autosave gộp: nhiều request liên tiếp chỉ ghi một lần với bản chụp MỚI NHẤT", async () => {
  const p = memoryPlatform();
  const w = newGame("x", "id-7");
  const bus = new Bus();
  const sv = service(w, p, bus);
  let writes = 0;
  bus.on("save:written", () => writes++);
  for (let i = 0; i < 5; i++) { w.money.cash = i; sv.request("CUSTOMER_DONE"); }
  await new Promise((r) => setTimeout(r, 700));
  assert.equal(writes, 1);
  assert.equal(new SaveService(new Bus(), () => { throw new Error(); }, p).load()!.money.cash, 4);
});
