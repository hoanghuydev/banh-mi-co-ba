/**
 * Mốc trong ngày dùng chung cho game thật (DayScene / MarketScene / EveningScene) và sim
 * headless — để `npm run sim` 40 ngày ra đúng cái người chơi thấy (P0-02 §2.5).
 *
 *   dawn()      rạng sáng: trời hôm nay · dọn hàng hư · thu tiền thuê chỗ · (ngày 1) rổ của cô Ba
 *   basketFor() giỏ đủ cho N ổ — nút "mua như hôm qua" KHÔNG dùng cái này (nó chép y giỏ hôm qua,
 *               không bao giờ tối ưu); chỉ bot và rổ đầu mùa của cô Ba dùng.
 */
import type { SaveFile } from "../core/save";
import {
  GOODS, GOOD_IDS, buy, expire, newInventory, priceOf, stockOf, vnd, weatherOf, type GoodId, type InventoryState,
} from "./econ";
import { duesOpen, eveningCount, morningRent, newEconState, newToday, pay, processDefaults, rentVnd } from "./obligations";
import { CAL, ECON, fixedCostVnd, isRain } from "./econ";
import { equipPatienceMul, extraDailyVnd, has, newEquipState, resellable, sellEquip, type EquipId } from "./equipment";
import { moment, morningLines, type StoryState } from "./story";
import { resolveFollowers, standClosed, standDayMul, MOVE, STANDS, type StandId } from "./stands";
import { LATE_LINE, SUPPLIERS, afterMarket, dawnCheck, discounted, state, type SupplierId, type SupplierState } from "./suppliers";

const DAWN = "dawnDay";

export const USE_PER_LOAF: Partial<Record<GoodId, number>> = {
  BANH: 1, PATE_NHA: 1.0, THIT_NGUOI: 0.9, CHA_LUA: 0.9, XIU_MAI: 0.6, TRUNG: 0.6,
  RAU: 3.4, OT: 1.1, SOT: 1.1, DO_CHUA_NL: 1.7,
};

export function dawn(w: SaveFile) {
  const day = w.progress.dayIndex;
  if (w.flags[DAWN] === day) return null;
  w.flags[DAWN] = day;
  w.inventory ??= newInventory();
  w.econ ??= newEconState();
  w.progress.weather = weatherOf(day);
  w.equipment ??= newEquipState();
  w.inventory.storage = has(w.equipment, "TU_MAT") ? "tu_mat" : "thung_xop";
  w.inventory.noiU = has(w.equipment, "NOI_U");
  if (isRain(w.progress.weather)) w.flags.rainyDaySeen = true;
  w.econ.today = newToday(day);
  const wasted = expire(w.inventory, day);
  w.econ.today.wasted = wasted.map((x) => `${fmtUnits(x.units)} ${GOODS[x.good].unit} ${GOODS[x.good].label}`);
  if (day === 1 && !w.flags.starterBasket) {
    w.flags.starterBasket = true;
    const b = basketFor(w.inventory, 20, 1);
    for (const [g, n] of Object.entries(b)) buy(w.inventory, g as GoodId, n!, 1);
    w.inventory.lots.push({ good: "DO_CHUA_NL", day: -2, left: GOODS.DO_CHUA_NL.perUnit, q0: 1 });
    w.inventory.lastBasket = b;
  }
  // P3-02 §2.6.1: nợ người bán quá hạn → một lần trễ, trần ×0,75 vĩnh viễn — họ NÓI một câu
  w.suppliers ??= {};
  w.econ.morningLines = dawnCheck(w.suppliers, day).map((id) => `${SUPPLIERS[id].name}: "${LATE_LINE[id] ?? "Con nhớ tiền bữa trước nghen."}"`);
  if (w.story) w.econ.morningLines.push(...morningLines(day, w.story, { hasQr: has(w.equipment, "BANG_QR") }));
  const plan = w.econ.movePlan;
  if (plan && plan.moveDay === day) {
    const from = w.econ.stand;
    // P3-05 §2.3: `noticeDays` = SỐ NGÀY TỜ GIẤY ĐƯỢC DÁN. Dán hôm postedDay, đẩy xe hôm
    // moveDay → khách đọc thấy nó các ngày postedDay…moveDay−1, tức `moveDay − postedDay`
    // ngày. Trừ thêm 1 thì nút "mai dời" ra 0 = "dời không báo ai" — và chị Lan mất hẳn.
    const notice = Math.max(0, plan.moveDay - plan.postedDay);
    const r = resolveFollowers(w.saveId, day, from, plan.to, notice, (id) => w.npcs[id]?.tier ?? "ACQUAINTANCE", (id) => !!w.npcs[id]?.gone);
    const back = w.econ.deposit ?? 0;
    w.money.cash += back;
    // chỉ ghi nhận số cọc THẬT SỰ đóng được — ghi đủ mà trả thiếu thì lần dời sau hoàn đủ,
    // tức là cái két tự đẻ ra tiền
    const want = rentVnd(plan.to) * ECON.rent_k.depositDays;
    const put = Math.max(0, Math.min(w.money.cash, want));
    w.money.cash -= put;
    w.econ.deposit = put;
    w.econ.today.deposit += put - back;
    w.econ.stand = plan.to;
    w.econ.followers = plan.to === "L1" ? null : r.followers;
    w.econ.lastMoveDay = day;
    w.econ.movePlan = null;
    // đẩy xe 45 phút + dọn lại quầy: hôm dời mất buổi sớm (≈ −40% doanh thu, P3-05 §2.3)
    w.flags.lateOpenDay = day;
    for (const id of r.abandoned) {
      const s = w.npcs[id];
      if (s) { s.gone = true; s.goneReason = "MOVED"; }
    }
    w.econ.morningLines.push('Cô Ba: "Xe mà, dời được. Người thì hơi khó."');
  }
  w.econ.float = w.econ.floatLeft = 100_000;
  const rent = morningRent(w.econ, w.money);
  if (rent.lost) w.econ.notices = [...(w.econ.notices ?? []), "LOST_PRIME_STAND"];
  return { wasted, rent };
}

export function basketFor(inv: InventoryState, loaves: number, day: number, pate: GoodId = "PATE_NHA") {
  const out: Partial<Record<GoodId, number>> = {};
  for (const g of GOOD_IDS) {
    const per = g === pate ? USE_PER_LOAF.PATE_NHA : USE_PER_LOAF[g];
    if (!per) continue;
    const need = loaves * per;
    let have = stockOf(inv, g, day);
    if (g === "DO_CHUA_NL") have += stockOf(inv, "DO_CHUA_SAN", day);
    if (g === pate) have += stockOf(inv, pate === "PATE_NHA" ? "PATE_THUONG" : "PATE_NHA", day);
    const units = Math.ceil(Math.max(0, need - have) / GOODS[g].perUnit);
    if (units > 0) out[g] = units;
  }
  return out;
}

export function unitPriceVnd(g: GoodId, day: number, suppliers?: Record<string, SupplierState>) {
  const id = GOODS[g].seller as SupplierId;
  const p = priceOf(g, day);
  const q = suppliers ? discounted(g, p, id, state(suppliers, id)) : p;
  return vnd(suppliers && quenMat(g, day, suppliers) ? Math.round(q * 1.12 * 2) / 2 : q);
}

/**
 * P4-05 §2.2 A — "QUEN MẶT ĐẮT HÀNG": ngày 23, mối pate quen (đã mua ≥ 15 buổi) báo giá cao
 * hơn cho chính người chơi — vẫn cười, vẫn hỏi thăm cô Ba. Không giải thích, không có đáp án.
 */
export function quenMat(g: GoodId, day: number, suppliers: Record<string, SupplierState>) {
  if (day !== 23 || g !== "PATE_NHA") return false;
  return (suppliers[GOODS[g].seller]?.buyDays ?? 0) >= 15;
}

export function basketCost(b: Partial<Record<GoodId, number>>, day: number, suppliers?: Record<string, SupplierState>) {
  let s = 0;
  for (const [g, n] of Object.entries(b)) s += unitPriceVnd(g as GoodId, day, suppliers) * (n ?? 0);
  return s;
}

/**
 * Ghi số ổ bánh mua trong một buổi chợ — P4-04 §2.3 "trả lời bằng cách mua hàng".
 *
 * Ngày 35–39 cô Ba hỏi "còn cái xe… con tính sao thì tính" và người chơi trả lời bằng việc
 * mua bao nhiêu bánh cho ngày mai, không bằng một nút chọn (`ending.playerStaysOf`). Mọi
 * đường đi chợ — bot, "mua như hôm qua", và màn chợ của người thật — phải gọi đúng hàm này,
 * nếu không thì màn kết đọc một cuốn sổ trắng.
 */
export function noteBasketLoaves(story: StoryState, day: number, loaves: number): void {
  if (loaves <= 0) return;
  story.basketLoaves[day] = (story.basketLoaves[day] ?? 0) + loaves;
}

export function buyBasket(w: SaveFile, b: Partial<Record<GoodId, number>>) {
  const day = w.progress.dayIndex;
  const basket = { ...b };
  const order: GoodId[] = ["BANH", "PATE_NHA", "PATE_THUONG", "THIT_NGUOI", "CHA_LUA", "RAU", "DO_CHUA_NL", "XIU_MAI", "TRUNG", "OT", "SOT", "DO_CHUA_SAN"];
  while (basketCost(basket, day, w.suppliers) > w.money.cash) {
    const g = [...order].reverse().find((x) => (basket[x] ?? 0) > 0);
    if (!g) break;
    basket[g] = (basket[g] ?? 0) - (g === "BANH" ? Math.min(basket[g]!, 5) : 1);
  }
  const cost = basketCost(basket, day, w.suppliers);
  w.money.cash -= cost;
  w.econ.today.market += cost;
  if (w.story) noteBasketLoaves(w.story, day, basket.BANH ?? 0);
  if (w.story && (basket.PATE_NHA ?? 0) > 0 && quenMat("PATE_NHA", day, w.suppliers)) moment(w.story, "QUEN_MAT_DAT_HANG");
  for (const [g, n] of Object.entries(basket)) if (n) buy(w.inventory, g as GoodId, n, day);
  w.inventory.lastBasket = basket;
  afterMarket(w.suppliers, new Set(Object.entries(basket).filter(([, n]) => n).map(([g]) => GOODS[g as GoodId].seller as SupplierId)), day);
  return { cost, basket };
}

export const fmtUnits = (u: number) => (Math.round(u * 10) / 10).toLocaleString("vi-VN");

export function eveningCounting(w: SaveFile) {
  const day = w.progress.dayIndex;
  eveningCount(w.econ, w.money, day, fixedCostVnd(day) + extraDailyVnd(w.equipment ?? newEquipState()));
  const e = w.econ.today, t = w.progress.today;
  const cost = e.market + e.rent + e.deposit + e.fixed + e.sendHome + e.obligations
    + e.hui + e.tools + e.debtRepay + e.story;
  const row = { day, revenue: t.revenue, cost, served: t.served, lost: t.lost };
  const i = w.ledger.findIndex((r) => r.day === day);
  if (i >= 0) w.ledger[i] = row; else w.ledger.push(row);
}

export function botPayDues(w: SaveFile, medicine = false) {
  const day = w.progress.dayIndex;
  for (const d of duesOpen(w.econ, day)) if (d.mandatory || medicine) pay(w.econ, w.money, d, day);
}

export function bedtime(w: SaveFile) {
  const out = processDefaults(w.econ, w.money, w.progress.dayIndex, resellable(w.equipment ?? newEquipState()).length > 0);
  return out;
}

/**
 * P3-04 E2 — loa rao làm hàng xóm khó chịu dần (ẩn, không bao giờ hiện số). Ngưỡng 7: cô Mai
 * nhắc khéo · 12: khách than ồn · 18: bị bắt tắt 5 ngày. Chạy mỗi tối.
 */
export function neighborTick(w: SaveFile) {
  const e = w.econ, day = w.progress.dayIndex;
  if (w.flags.neighborDay === day) return [];
  w.flags.neighborDay = day;
  const loaOn = has(w.equipment, "LOA_RAO") && (e.loaOffUntil ?? 0) < day;
  const before = e.neighborAnnoyance ?? 0;
  e.neighborAnnoyance = Math.max(0, before + (loaOn ? 1 : 0) - 0.5);
  const lines: string[] = [];
  if (before < 7 && e.neighborAnnoyance >= 7) lines.push('Cô Mai: "Con mở nhỏ nhỏ chút nghen, bà Tư nhà trên ngủ trưa."');
  if (before < 12 && e.neighborAnnoyance >= 12) lines.push('Khách: "Ồn quá con."');
  if (e.neighborAnnoyance >= 18) {
    e.loaOffUntil = day + 5;
    e.neighborAnnoyance = 10;
    lines.push('Hàng xóm: "Tắt cái loa giùm cái! Ngày nào cũng rao!" — năm hôm nay không mở loa được.');
  }
  return lines;
}

/**
 * Fail mềm SOLD_EQUIPMENT: bán một món ở giá 50%, tiền đi THẲNG vào tiền học (P3-06 §2.4).
 *
 * "Đi thẳng vào tiền học" nghĩa là tiền có thật rồi đi mất, không phải là tiền bốc hơi:
 * trước đây tiền bán rơi vào một object rác nên màn "Phải xoay cho đủ" ghi "bán 36.000₫"
 * mà két vẫn 0₫. `processDefaults` đã đánh dấu khoản học là xong mà chưa trừ đồng nào, nên
 * đây chính là chỗ nó được trả — hai dòng sổ, cộng lại bằng 0 đúng như cái két.
 */
export function forcedSell(w: SaveFile, id: EquipId) {
  if (!w.econ.mustSell) return 0;
  const v = sellEquip(id, w.equipment, w.money, 0.5 / 0.6);
  if (v > 0) {
    w.money.cash -= v;
    w.econ.today.tools -= v;
    w.econ.today.obligations += v;
  }
  w.econ.mustSell = false;
  return v;
}

export function canMoveTo(w: SaveFile, to: StandId): string | null {
  const e = w.econ, day = w.progress.dayIndex;
  if (to === e.stand) return "đang đứng đây";
  if (to === "L1" && e.losses.includes("LOST_PRIME_STAND")) return "đầu hẻm giờ chú Kiệt thuê rồi";
  if (!e.scouted.includes(to)) return "chưa xem chỗ này";
  if (day - e.lastMoveDay < MOVE.cooldownDays) return "mới dời, để yên vài hôm";
  return null;
}

/**
 * Dán tờ giấy báo dời lên xe. `inDays` = mấy ngày nữa đẩy xe đi — và cũng chính là số ngày
 * tờ giấy được dán, tức `noticeDays` (P3-05 §2.3). Ba nút ở màn tối 1/2/4 → báo trước 1/2/4.
 */
export function postMove(w: SaveFile, to: StandId, inDays: number) {
  const day = w.progress.dayIndex;
  w.econ.movePlan = { to, postedDay: day, moveDay: day + Math.max(1, inDays) };
}

export function scout(w: SaveFile, s: StandId) {
  if (!w.econ.scouted.includes(s)) w.econ.scouted.push(s);
}

export { standClosed, STANDS };

export function standDeps(w: SaveFile) {
  const day = w.progress.dayIndex, s = (w.econ?.stand ?? "L1") as StandId;
  const wx = weatherOf(day);
  return {
    standMul: standDayMul(s, day, isRain(wx)),
    followers: w.econ?.followers ?? null,
    standClosed: standClosed(s, day),
    // Chỗ đứng × đồ nghề: quạt điện +15% (`equipPatienceMul`) — thẻ món đó hứa đúng con số này.
    patienceMul: STANDS[s].patience * equipPatienceMul(w.equipment),
    gazeMul: STANDS[s].gaze * CAL.weatherInfo[wx].gazeMul,
  };
}
