import { test } from "node:test";
import assert from "node:assert/strict";
import { Bus } from "../src/core/eventbus";
import { memoryPlatform } from "../src/core/platform";
import { SaveService, newGame, type SaveFile } from "../src/core/save";
import { ACH_BY_ID, ACH_LIST } from "../src/content/ach";
import {
  achGot, achSeen, achUnseen, checkEvening, checkLive, clearAch, markSeen, takeAch, wireAch, newAch,
} from "../src/sim/ach";
import { addReview } from "../src/sim/reviews";
import { accept, spin } from "../src/sim/system";
import { placeOrder } from "../src/sim/shop";
import { SUPPLIERS } from "../src/sim/suppliers";
import { buyEquip, type EquipId } from "../src/sim/equipment";
import { morning, post } from "../src/sim/resell";
import { dawn, eveningCounting } from "../src/sim/day";
import { brokeReport, markBroke } from "../src/sim/broke";
import { markWin, WIN_VND } from "../src/sim/win";
import { openMenu } from "../src/sim/unlock";
import { MENU_BOARD } from "../src/sim/menu";
import { NPCS } from "../src/content/npcs";
import { nextDay } from "../src/sim/headless";

const drain = () => { while (takeAch()) { /* rỗng */ } };
const ids = (p = memoryPlatform()) => Object.keys(achGot(p));
function setup(id = "ach") {
  drain();
  return { w: newGame("t", id), p: memoryPlatform() };
}
const rev = (w: SaveFile, o: Partial<Parameters<typeof addReview>[1]> = {}) =>
  addReview(w, { day: w.progress.dayIndex, who: "A", stars: 5, text: "", food: false, ...o });
const row = (w: SaveFile, day: number, o: Partial<SaveFile["ledger"][number]> = {}) =>
  w.ledger.push({ day, revenue: 100, cost: 50, served: 10, lost: 0, ...o });

test("bảng 52 danh hiệu: đủ hạng, mã và tên không trùng", () => {
  assert.equal(ACH_LIST.length, 52);
  const count = (t: string) => ACH_LIST.filter((a) => a.tier === t).length;
  assert.deepEqual([count("dong"), count("bac"), count("vang"), count("kc")], [15, 21, 11, 5]);
  assert.equal(new Set(ACH_LIST.map((a) => a.id)).size, 52);
  assert.equal(new Set(ACH_LIST.map((a) => a.name)).size, 52);
  assert.equal(ACH_LIST.filter((a) => a.hidden).length, 17);
  assert.equal(ACH_LIST.filter((a) => a.fail).length, 13);
});

test("mỗi danh hiệu chỉ chấm một lần, giữ ngày đạt đầu tiên", () => {
  const { w, p } = setup("once");
  w.progress.today.served = 1;
  checkLive(w, p);
  assert.equal(achGot(p).dau_xuoi, 1);
  assert.equal(takeAch()?.id, "dau_xuoi");
  w.progress.dayIndex = 5;
  checkLive(w, p);
  assert.equal(achGot(p).dau_xuoi, 1);
  assert.equal(takeAch(), undefined);
});

test("chấm danh hiệu không đổi tiền, buff, kinh nghiệm", () => {
  const { w, p } = setup("pure");
  accept(w);
  w.progress.today.served = 150;
  rev(w, { stars: 1 });
  const before = JSON.stringify({ m: w.money, s: { ...w.system, log: 0 }, i: w.inventory, e: w.equipment });
  checkEvening(w, p);
  assert.ok(ids(p).length > 0);
  assert.equal(JSON.stringify({ m: w.money, s: { ...w.system, log: 0 }, i: w.inventory, e: w.equipment }), before);
  assert.equal(w.system.exp, 0);
});

test("Hệ thống chỉ nói khi đã liên kết", () => {
  const a = setup("say-a");
  a.w.progress.today.served = 1;
  checkLive(a.w, a.p);
  assert.equal(a.w.system.log.length, 0);

  const b = setup("say-b");
  accept(b.w);
  b.w.progress.today.served = 1;
  checkLive(b.w, b.p);
  const text = b.w.system.log.map((l) => l.text);
  assert.match(text[0], /^Keng! .*【Đầu xuôi đuôi lọt】\(Đồng\)/);
  assert.match(text[1], /Danh hiệu chỉ để trưng/);
  assert.match(text[2], new RegExp(ACH_BY_ID.dau_xuoi.desc));
});

test("danh hiệu sống qua save.clear(), seen theo máy", () => {
  const { w, p } = setup("clear");
  w.progress.today.served = 1;
  checkLive(w, p);
  new SaveService(new Bus(), () => structuredClone(w), p).clear();
  assert.deepEqual(ids(p), ["dau_xuoi"]);
  assert.equal(achUnseen(p), 1);
  markSeen("dau_xuoi", p);
  assert.deepEqual(achSeen(p), ["dau_xuoi"]);
  assert.equal(achUnseen(p), 0);
  markSeen(undefined, p);
  assert.equal(achUnseen(p), 0);
});

test("save cũ thiếu trường ach vẫn đọc được, bộ đếm về mặc định", () => {
  const p = memoryPlatform();
  const w = newGame("t", "old");
  delete (w as Partial<SaveFile>).ach;
  p.write("byesep.slotA", JSON.stringify(w));
  const svc = new SaveService(new Bus(), () => w, p);
  const back = svc.parse(JSON.stringify(w))!;
  assert.deepEqual(back.ach, newAch());
});

test("ổ cộng dồn: ledger các ngày trước + hôm nay, không đếm đôi hàng của hôm nay", () => {
  const { w, p } = setup("served");
  w.progress.dayIndex = 3;
  row(w, 1, { served: 60 });
  row(w, 2, { served: 35 });
  w.progress.today.served = 4;
  checkLive(w, p);
  assert.ok(!("nang_nhat" in achGot(p)));
  row(w, 3, { served: 4 });
  w.progress.today.served = 5;
  checkLive(w, p);
  assert.ok("nang_nhat" in achGot(p));
});

test("đánh giá: 5 sao khách thật, 1 sao, đau bụng, trả lời, nhiễu", () => {
  const { w, p } = setup("rev");
  rev(w, { stars: 5, noise: "spam" });
  checkLive(w, p);
  assert.deepEqual(ids(p), ["co_tieng"]);
  rev(w, { stars: 5 });
  rev(w, { stars: 1, food: true });
  rev(w, { stars: 3, noise: "nham" });
  checkLive(w, p);
  for (const id of ["vui_long", "chin_nguoi", "ngua_co", "rau_ong"]) assert.ok(id in achGot(p), id);
  assert.ok(!("tai_bay" in achGot(p)));
  for (let i = 0; i < 4; i++) rev(w, { stars: 1 });
  for (let i = 0; i < 6; i++) rev(w);
  for (const r of w.reviews.list.slice(0, 10)) r.reply = "ok";
  w.reviews.list[0].edited = true;
  checkLive(w, p);
  for (const id of ["tai_bay", "co_qua", "quay_dau"]) assert.ok(id in achGot(p), id);
});

test("sao trung bình 4,2 cần đủ 50 đánh giá", () => {
  const { w, p } = setup("avg");
  for (let i = 0; i < 49; i++) rev(w);
  checkLive(w, p);
  assert.ok(!("tieng_lanh" in achGot(p)));
  rev(w);
  checkLive(w, p);
  assert.ok("tieng_lanh" in achGot(p));
});

test("bộ đếm sự kiện: trà đá, ổ rơi", () => {
  const { w, p } = setup("bus");
  const bus = new Bus();
  const off = wireAch(bus, () => w);
  for (let i = 0; i < 20; i++) bus.emit("attention:toolUsed", { tool: "TRA_DA", npcId: "BA_BAY", durationSec: 1 });
  bus.emit("attention:toolUsed", { tool: "ASK_QUESTION", npcId: "BA_BAY", durationSec: 1 });
  for (let i = 0; i < 9; i++) bus.emit("npc:left", { npcId: "BA_BAY", visitId: "v", reason: "SOILED_FOOD" });
  bus.emit("npc:left", { npcId: "BA_BAY", visitId: "v", reason: "IMPATIENT" });
  checkLive(w, p);
  assert.equal(w.ach.tea, 20);
  assert.equal(w.ach.soiled, 9);
  assert.deepEqual(ids(p).sort(), ["o_hien"]);
  bus.emit("npc:left", { npcId: "BA_BAY", visitId: "v", reason: "SOILED_FOOD" });
  checkLive(w, p);
  assert.ok("nuoc_do" in achGot(p));
  off();
  bus.emit("attention:toolUsed", { tool: "TRA_DA", npcId: "BA_BAY", durationSec: 1 });
  assert.equal(w.ach.tea, 20);
});

test("đủ 7 nhà cung cấp tính theo đơn đã đặt", () => {
  const { w, p } = setup("sup");
  w.money.cash = 50_000_000;
  const o = { coupon: false, express: false, beforeOpen: true };
  for (const s of SUPPLIERS) {
    const key = Object.keys(s.offers).filter((g) => g === "BANH" || g === "OT" || g === "SOT")[0] ?? Object.keys(s.offers)[0];
    assert.ok(placeOrder(w, { [`${s.id}.${key}`]: 1 }, 360, o), s.id);
    if (s.id !== SUPPLIERS.at(-1)!.id) { checkLive(w, p); assert.ok(!("buon_co_ban" in achGot(p))); }
  }
  checkLive(w, p);
  assert.equal(w.ach.sup.length, SUPPLIERS.length);
  assert.ok("buon_co_ban" in achGot(p));
});

test("bán đồ cũ: đếm khi có người mua", () => {
  const { p } = setup();
  let sold: SaveFile | null = null;
  for (let i = 0; i < 60 && !sold; i++) {
    const w = newGame("t", `rs-${i}`);
    w.money.cash = 5_000_000;
    buyEquip("KEP_GAP", w.equipment, w.money);
    post(w, "equip", "KEP_GAP", "RE");
    morning(w);
    if (w.resell.news.some((n) => n.startsWith("Đã bán"))) sold = w;
  }
  assert.ok(sold);
  assert.equal(sold!.ach.resold, 1);
  checkLive(sold!, p);
  assert.ok("cua_ben" in achGot(p));
});

test("vòng quay: chuỗi ô may mắn liên tiếp được đếm và reset", () => {
  const { w, p } = setup("spin");
  accept(w);
  let run = 0;
  for (let d = 2; d < 80; d++) {
    w.progress.dayIndex = d;
    const r = spin(w)!;
    run = r.id === "LUCK" ? run + 1 : 0;
    assert.equal(w.ach.luckRun, run);
  }
  w.ach.luckRun = 8;
  checkLive(w, p);
  assert.ok("da_trang" in achGot(p));
});

test("nợ mặt bằng: phải từng nợ rồi mới trả hết", () => {
  const { w, p } = setup("debt");
  checkLive(w, p);
  assert.ok(!("kho_truoc" in achGot(p)));
  w.econ.rentOwed = 40_000;
  checkLive(w, p);
  assert.ok(!("kho_truoc" in achGot(p)));
  w.econ.rentOwed = 0;
  checkLive(w, p);
  assert.ok("kho_truoc" in achGot(p));
});

test("chuỗi ngày: lỗ, ế, không đau bụng phải liền nhau", () => {
  const { w, p } = setup("streak");
  w.progress.dayIndex = 4;
  row(w, 1, { revenue: 10, cost: 50, served: 2 });
  row(w, 3, { revenue: 10, cost: 50, served: 2 });
  row(w, 4, { revenue: 10, cost: 50, served: 2 });
  checkEvening(w, p);
  assert.ok(!("that_lung" in achGot(p)) && !("ngoi_cho" in achGot(p)));
  w.ledger.splice(0, 1, { day: 2, revenue: 10, cost: 50, served: 2, lost: 0 });
  w.ledger.sort((a, b) => a.day - b.day);
  row(w, 1, { revenue: 10, cost: 50, served: 2 });
  w.ledger.sort((a, b) => a.day - b.day);
  checkEvening(w, p);
  assert.ok("that_lung" in achGot(p) && "ngoi_cho" in achGot(p));

  const b = setup("sick");
  for (let d = 1; d <= 30; d++) row(b.w, d, { sick: d === 10 ? 1 : 0 });
  b.w.progress.dayIndex = 30;
  checkEvening(b.w, b.p);
  assert.ok(!("an_ngon" in achGot(b.p)));
  b.w.ledger.find((r) => r.day === 10)!.sick = 0;
  checkEvening(b.w, b.p);
  assert.ok("an_ngon" in achGot(b.p));
});

test("vắng như chùa: ế cả ngày, trừ khi tự đóng quầy sớm", () => {
  const a = setup("empty-a");
  row(a.w, 1, { served: 0 });
  a.w.econ.today.closedAtMin = 700;
  checkEvening(a.w, a.p);
  assert.ok(!("vang_chua" in achGot(a.p)));
  a.w.econ.today.closedAtMin = null;
  checkEvening(a.w, a.p);
  assert.ok("vang_chua" in achGot(a.p));
});

test("giá cả ngày: một lần lệch mốc là mất, đúng mốc thì đạt", () => {
  const a = setup("px-a");
  const open = openMenu(1);
  for (const m of open) a.w.menu.price[m.id] = 0;
  checkLive(a.w, a.p);
  a.w.menu.price[open[0].id] = 1;
  checkLive(a.w, a.p);
  for (const m of open) a.w.menu.price[m.id] = 0;
  a.w.progress.today.served = 30;
  row(a.w, 1, { served: 30 });
  checkEvening(a.w, a.p);
  assert.ok(!("lay_cong" in achGot(a.p)));

  const b = setup("px-b");
  for (const m of open) b.w.menu.price[m.id] = 0;
  b.w.progress.today.served = 25;
  row(b.w, 1, { served: 25 });
  checkEvening(b.w, b.p);
  assert.ok("lay_cong" in achGot(b.p));

  const c = setup("px-c");
  for (const m of open) c.w.menu.price[m.id] = 2;
  c.w.progress.today.served = 10;
  c.w.progress.today.lost = 1;
  row(c.w, 1, { served: 10 });
  checkEvening(c.w, c.p);
  assert.ok(!("dat_xat" in achGot(c.p)));
  c.w.progress.today.lost = 0;
  checkEvening(c.w, c.p);
  assert.ok("dat_xat" in achGot(c.p));
});

test("thắng: mốc ngày 90/100, sạch như lau, không liên kết", () => {
  const a = setup("win-a");
  a.w.progress.dayIndex = 89;
  a.w.money.cash = WIN_VND;
  row(a.w, 89);
  checkEvening(a.w, a.p);
  assert.ok(markWin(a.w));
  checkLive(a.w, a.p);
  for (const id of ["mo_may", "buon_may", "mot_von", "sach_nhu", "hai_ban_tay"]) assert.ok(id in achGot(a.p), id);

  const b = setup("win-b");
  b.w.progress.dayIndex = 95;
  b.w.money.cash = WIN_VND;
  b.w.progress.today.burnt = 1;
  accept(b.w);
  checkEvening(b.w, b.p);
  markWin(b.w);
  checkLive(b.w, b.p);
  assert.deepEqual(ids(b.p).filter((x) => ["buon_may", "mot_von", "sach_nhu", "hai_ban_tay"].includes(x)), ["buon_may"]);
});

test("phá sản trong 3 ngày đầu: dồn tiền vào hàng chợ rồi không bán", () => {
  const { w, p } = setup("broke");
  let brokeDay = 0;
  for (let d = 1; d <= 6 && !brokeDay; d++) {
    if (d > 1) nextDay(w);
    dawn(w);
    if (d === 1) assert.ok(placeOrder(w, { BANH: 440 }, 360, { coupon: false, express: false, beforeOpen: true }));
    eveningCounting(w);
    checkEvening(w, p);
    if (markBroke(w)) { checkLive(w, p); brokeDay = d; }
  }
  assert.ok(brokeDay > 0 && brokeDay <= 3, `phá sản ngày ${brokeDay}`);
  assert.ok("nha_tan" in achGot(p) && "pha_gia" in achGot(p));
});

test("mua tủ mát ngày 1 không đủ để phá sản: đồ nghề bán lại được", () => {
  const { w } = setup("tumat");
  dawn(w);
  buyEquip("TU_MAT", w.equipment, w.money, w.econ);
  for (let d = 1; d <= 3; d++) {
    if (d > 1) { nextDay(w); dawn(w); }
    eveningCounting(w);
  }
  assert.equal(brokeReport(w).broke, false);
});

test("phá sản sau ngày 3 chỉ được Nhà tan cửa nát", () => {
  const { w, p } = setup("broke-late");
  w.flags.broke = true;
  w.flags.brokeDay = 4;
  checkLive(w, p);
  assert.ok("nha_tan" in achGot(p) && !("pha_gia" in achGot(p)));
});

test("đóng cửa vì ATTP, hết sạch bánh, tủ mát, lắp kín xe, đủ 12 người quen", () => {
  const { w, p } = setup("misc");
  w.flags.shutdown = true;
  w.econ.today.soldOut = 2;
  w.equipment.owned.push("TU_MAT");
  w.npcs.BA_BAY = { visits: 50, lastSeenDay: 1 };
  checkLive(w, p);
  for (const id of ["benh_tu", "dat_tom", "tien_nao", "quen_mat"]) assert.ok(id in achGot(p), id);
  assert.ok(!("them_ban" in achGot(p)));
});

test("thêm bạn bớt thù cần nói chuyện sâu với đủ 12 người có tên", () => {
  const { w, p } = setup("friends");
  const all = NPCS.map((n) => n.id);
  for (const id of all.slice(0, 11)) w.npcs[id] = { visits: 1, lastSeenDay: 1, talksDone: ["x"] };
  w.npcs[all[11]] = { visits: 9, lastSeenDay: 1 };
  checkLive(w, p);
  assert.ok(!("them_ban" in achGot(p)));
  w.npcs[all[11]].talksDone = ["x"];
  checkLive(w, p);
  assert.ok("them_ban" in achGot(p));
});

test("lắp kín xe: 14 chỗ cần giá treo và bỏ qua một món một chỗ", () => {
  const { w, p } = setup("full");
  w.money.cash = 1e9;
  const all: EquipId[] = ["GIA_TREO", "LO_DIEN", "TU_MAT", "BANG_HIEU", "GHE_BAN", "LONG_BAN", "DU_CHE", "BINH_TRA", "QUAT_DIEN"];
  for (const id of all.slice(0, -1)) buyEquip(id, w.equipment, w.money);
  checkLive(w, p);
  assert.ok(!("dau_vao" in achGot(p)));
  buyEquip(all.at(-1)!, w.equipment, w.money);
  checkLive(w, p);
  assert.ok("dau_vao" in achGot(p));
});

test("giá cả ngày sau ngày 16: món ẩn khỏi bảng không cản", () => {
  const { w, p } = setup("px-late");
  w.progress.dayIndex = 20;
  const board = MENU_BOARD.filter((m) => m.unlockDay <= 20);
  assert.ok(openMenu(20).length > board.length);
  for (const m of board) w.menu.price[m.id] = 0;
  w.progress.today.served = 25;
  row(w, 20, { served: 25 });
  checkEvening(w, p);
  assert.ok("lay_cong" in achGot(p));
});

test("hàng đợi toast: có trần, và xả khi vào ván mới", () => {
  const { w, p } = setup("queue");
  w.progress.today.served = 1;
  w.flags.shutdown = true;
  w.flags.broke = true;
  w.flags.brokeDay = 1;
  w.flags.won = true;
  w.flags.wonDay = 1;
  checkEvening(w, p);
  checkLive(w, p);
  assert.ok(ids(p).length > 3);
  clearAch();
  assert.equal(takeAch(), undefined);
  const many = Array.from({ length: 40 }, (_, i) => i);
  for (const i of many) {
    const q = setup(`q-${i}`);
    q.w.progress.today.served = 1;
    checkLive(q.w, q.p);
  }
  let n = 0;
  while (takeAch()) n++;
  assert.ok(n <= 8, `hàng đợi ${n}`);
});

test("ổ rơi mà khách không thấy vẫn mất Sạch như lau như li", () => {
  const { w, p } = setup("drop");
  const bus = new Bus();
  const off = wireAch(bus, () => w);
  bus.emit("stim:emitted", { stimId: "DROPPED_FOOD", zone: "HANDS", salience: 1, at: 0 });
  assert.equal(w.ach.dropped, 1);
  assert.equal(w.ach.soiled, 0);
  w.progress.dayIndex = 80;
  w.money.cash = WIN_VND;
  checkEvening(w, p);
  markWin(w);
  checkLive(w, p);
  assert.ok("mo_may" in achGot(p));
  assert.ok(!("sach_nhu" in achGot(p)));
  off();
});

test("kho danh hiệu đọc lại từ máy sau khi cache mới", () => {
  const { w, p } = setup("cache");
  w.progress.today.served = 1;
  checkLive(w, p);
  const stored = JSON.parse(p.read("byesep.ach")!);
  assert.equal(stored.got.dau_xuoi, 1);
});
