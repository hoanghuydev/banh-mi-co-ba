/**
 * ĐO XEM MẤY CON SỐ TRÊN THẺ ĐỒ NGHỀ CÓ THẬT KHÔNG.
 *
 * Chủ dự án: *"mấy con số + đó có đúng thật không hay chỉ đang giả"*. Câu đó không trả lời được
 * bằng cách đọc lại mã và gật đầu — `tests/p3-equipment.test.ts` (TB-5) chỉ canh chữ-khớp-hằng-số,
 * tức là nó bắt được "thẻ ghi 20% mà hằng số là 15%", KHÔNG bắt được "hằng số đúng 20% nhưng chẳng
 * ai nhân nó vào đâu cả", và cũng không bắt được "nhân vào rồi nhưng bị một cái `Math.min(1, …)`
 * ăn mất".
 *
 * Nên công cụ này đi đường khác: CHẠY sim thật, bật/tắt từng món, đo cái người chơi thấy. Số in ra
 * là số đo, không phải số khai.
 *
 *   npx tsx tools/audit-gain.ts
 */
import { newGame } from "../src/core/save";
import { HeadlessStall, POLICIES, nextDay } from "../src/sim/headless";
import { dawn, standDeps } from "../src/sim/day";
import { EQUIP, capacity, dirtMul, equipPatienceMul, newEquipState, used, walkInMul, type EquipId } from "../src/sim/equipment";
import { SIT_PATIENCE_MUL, TEA_PATIENCE_SEC, Customer, DEFAULT_PATIENCE_SEC } from "../src/sim/customer";
import { coldSlotCap, newInventory, shelfDays } from "../src/sim/econ";
import { CRUST, ovenFor } from "../src/sim/oven";

import { RngHub } from "../src/core/rng";

const hub = new RngHub();
hub.beginDay("audit", 1);

const pct = (a: number, b: number) => `${(((b - a) / a) * 100 >= 0 ? "+" : "")}${(((b - a) / a) * 100).toFixed(1)}%`;
const line = (ten: string, the: string, do_: string, ok: boolean | null) =>
  console.log(`  ${ok === null ? "?" : ok ? "✔" : "✘"} ${ten.padEnd(11)} thẻ: ${the.padEnd(46)} đo: ${do_}`);
/** Cột "thẻ" ĐỌC THẲNG TỪ `equipment.json` — chép tay vào đây là để nó lệch lần nữa. */
const the = (id: EquipId, i = 0) => EQUIP[id].gain[i] ?? "(không có dòng nào)";

// ───────────────────────────────────────────────── 1. khách ghé: đếm người THẬT SỰ tới quầy

/** Chạy `days` ngày với đúng bộ đồ nghề này, đếm tổng số lượt khách đã tới trước quầy. */
function demKhach(owned: EquipId[], days: number, seeds: number) {
  let n = 0, la = 0;
  for (let s = 0; s < seeds; s++) {
    const w = newGame(`audit${s}`, `audit-${s}`);
    w.equipment = { ...newEquipState(), owned: [...newEquipState().owned, ...owned], installed: [] };
    w.equipment.installed = [...w.equipment.owned];
    for (let d = 1; d <= days; d++) {
      if (d > 1) nextDay(w, undefined, { payDues: false });
      const run = new HeadlessStall(w, { ...POLICIES.greedy, build: [], buyLoaves: 40 });
      run.run();
      n += w.progress.today.served + w.progress.today.lost;
      la += w.notebook.today.strangers;
    }
  }
  return { n, la };
}

console.log("\nKHÁCH GHÉ — đếm lượt khách tới quầy, 6 seed × 8 ngày (bot greedy, không mua gì thêm)\n");
const DAYS = 8, SEEDS = 6;
const nen = demKhach([], DAYS, SEEDS);
for (const id of ["BANG_HIEU", "LOA_RAO", "DU_CHE"] as const) {
  const co = demKhach([id], DAYS, SEEDS);
  const hua = (walkInMul({ owned: [id], installed: [], wear: {} }, false) - 1) * 100;
  line(id, the(id),
    `KHÁCH LẠ ${nen.la} → ${co.la} (${pct(nen.la, co.la)}) · TỔNG ${nen.n} → ${co.n} (${pct(nen.n, co.n)})`,
    Math.abs(((co.la - nen.la) / nen.la) * 100 - hua) < hua * 0.35);
}

// ───────────────────────────────────────────────── 2. mấy chỉ số đo thẳng được, không cần sim

console.log("\nCHỈ SỐ ĐO THẲNG\n");

// quạt: hệ số có tới được `Service.deps.patienceMul` không
{
  const w0 = newGame("q0", "q0"), w1 = newGame("q1", "q1");
  dawn(w0); dawn(w1);
  w1.equipment.owned.push("QUAT_DIEN");
  const a = standDeps(w0).patienceMul, b = standDeps(w1).patienceMul;
  line("QUAT_DIEN", the("QUAT_DIEN"), `patienceMul ${a} → ${b} (${pct(a, b)})`, Math.abs(b / a - equipPatienceMul(w1.equipment)) < 1e-9);
}

// bình nước trà: rót một ly thì sức chờ tăng bao nhiêu giây
{
  const c = new Customer("x", "x", "x", { soi: 0.3, noi: 0.5, kien_nhan: 0.5, deu: 0.5 } as never,
    0 as never, null, { levels: {} } as never, 1, { x: 0, y: 0 }, DEFAULT_PATIENCE_SEC, hub.derive("audit"));
  const truoc = c.waitT;
  c.takeTea(1);
  line("BINH_TRA", the("BINH_TRA"), `waitT ${truoc}s → ${c.waitT}s (+${c.waitT - truoc}s)`, c.waitT - truoc === TEA_PATIENCE_SEC);
}

// ghế: hai chỗ, và kiên nhẫn trôi chậm bao nhiêu
{
  const c = new Customer("x", "x", "x", { soi: 0.3, noi: 0.5, kien_nhan: 0.5, deu: 0.5 } as never,
    0 as never, null, { levels: {} } as never, 1, { x: 0, y: 0 }, 100, hub.derive("audit"));
  c.phase = "waiting";
  c.tick(10, true);
  const dung = c.waitSec;
  c.waitSec = 0; c.sitting = true;
  c.tick(10, true);
  line("GHE_BAN", the("GHE_BAN"),
    `10 s đứng = ${dung}s chờ, 10 s ngồi = ${c.waitSec}s chờ (${pct(dung, c.waitSec)})`,
    Math.abs(c.waitSec / dung - SIT_PATIENCE_MUL) < 1e-9);
}

// lồng bàn: quầy bẩn chậm hơn bao nhiêu
line("LONG_BAN", the("LONG_BAN"),
  `dirtMul 1 → ${dirtMul({ owned: ["LONG_BAN"], installed: [], wear: {} })}`,
  dirtMul({ owned: ["LONG_BAN"], installed: [], wear: {} }) === 0.8);

// tủ mát + nồi ủ
{
  const pate = [shelfDays("PATE_NHA", "thung_xop"), shelfDays("PATE_NHA", "tu_mat")];
  const o = [coldSlotCap(newInventory()), coldSlotCap({ ...newInventory(), storage: "tu_mat" })];
  line("TU_MAT", the("TU_MAT"), `pate ${pate[0]} → ${pate[1]} ngày · chỗ lạnh ${o[0]} → ${o[1]}`,
    pate[0] === 2 && pate[1] === 6 && o[0] === 8 && o[1] === 20);
  const xm = [shelfDays("XIU_MAI", "thung_xop", false), shelfDays("XIU_MAI", "thung_xop", true)];
  line("NOI_U", the("NOI_U"), `${xm[0]} → ${xm[1]} ngày`, xm[0] === 1 && xm[1] === 2);
}

// giá treo
{
  const e = newEquipState();
  const a = capacity(e);
  e.owned.push("GIA_TREO");
  line("GIA_TREO", the("GIA_TREO"), `capacity ${a} → ${capacity(e)}, đang dùng ${used(e)}`, capacity(e) - a === 2);
}

// lò điện: đo bằng chính `Oven`, theo GIÂY chứ không theo đơn vị `crust`
{
  // ⚠️ Dựng lò bằng `ovenFor` — đúng hàm `StallScene` gọi. Chép tay 1,35 / 1,30 / 1,90 vào đây
  // là để công cụ đo một cái lò KHÁC với cái lò người chơi dùng.
  const chay = (hasDien: boolean) => {
    const o = ovenFor(hasDien);
    const { burnAt, singeAt } = o;
    o.put(1);
    let t = 0, ready = -1, singe = -1;
    while (t < 200) {
      o.tick(0.02); t += 0.02;
      const c = o.slots[0]!.crust;
      if (ready < 0 && c >= CRUST.READY) ready = t;
      if (singe < 0 && c >= singeAt) singe = t;
      if (c > burnAt) return { ready, crisp: singe - ready, window: t - ready };
    }
    return { ready, crisp: NaN, window: NaN };
  };
  const than = chay(false), gas = chay(true);
  line("LO_DIEN", the("LO_DIEN", 0), `tới GIÒN ${than.ready.toFixed(1)}s → ${gas.ready.toFixed(1)}s (${pct(than.ready, gas.ready)})`, null);
  line("LO_DIEN", the("LO_DIEN", 1), `${than.crisp.toFixed(1)}s → ${gas.crisp.toFixed(1)}s (${pct(than.crisp, gas.crisp)})`, null);
  line("LO_DIEN", the("LO_DIEN", 2), `${than.window.toFixed(1)}s → ${gas.window.toFixed(1)}s (${pct(than.window, gas.window)})`, null);
}


// ───────────────────────────────────────────────── 3. hai món "mở ra một hệ" — đo xem hệ có ở đó không

console.log("\nBẢNG QR — thứ nó THẬT SỰ đụng (không phải thối tiền lẻ)\n");

/** Đếm số lần khách quên tiền (ghi nợ) — đó là thứ DUY NHẤT `BANG_QR` đụng tới trong lúc bán. */
function demNo(owned: EquipId[], days: number, seeds: number) {
  let n = 0;
  for (let s = 0; s < seeds; s++) {
    const w = newGame(`qr${s}`, `qr-${s}`);
    w.progress.dayIndex = 14;                       // bảng QR khoá tới ngày 14
    w.equipment = { ...newEquipState(), owned: [...newEquipState().owned, ...owned], installed: [] };
    w.equipment.installed = [...w.equipment.owned];
    for (let d = 0; d < days; d++) {
      if (d > 0) nextDay(w, undefined, { payDues: false });
      new HeadlessStall(w, { ...POLICIES.greedy, build: [], buyLoaves: 40 }).run();
      n += w.money.debtsOwedToPlayer.length;
      w.money.debtsOwedToPlayer.length = 0;
    }
  }
  return n;
}
{
  const a = demNo([], 10, 6), b = demNo(["BANG_QR"], 10, 6);
  line("BANG_QR", the("BANG_QR"), `số lần khách quên tiền ${a} → ${b} (${pct(a, b)})`, b < a * 0.5);
}

/*
 * ĐÈN CA TỐI đã bỏ khỏi cây thiết bị sau chính lần đo này: 914 → 914 ổ, chênh đúng 0, vì bản dựng
 * không có ca bán tối nào. Giữ lại khối chú thích chứ không giữ phép đo — `EquipId` không còn id
 * đó nữa. Đây là ví dụ mẫu của thứ lưới TB-5 mù: hằng số đúng, chữ đúng ngữ pháp, không ai nhân
 * nó vào đâu cả.
 */

console.log("");
