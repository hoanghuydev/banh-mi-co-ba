/**
 * Kinh tế lõi — P3-01 / P3-03 / P3-06. Thuần dữ liệu, không Phaser, không RNG lúc chạy
 * (lịch mùa là bảng cố định — chơi lại ngày nào cũng ra đúng trời đó, giá đó: CANON §8e).
 *
 * Đơn vị: nội dung tính bằng NGHÌN đồng (k); `world.money.cash` tính bằng ĐỒNG.
 * `SCALE` (chủ dự án chốt): khoản theo ngày/mùa co theo nhịp ~18 ổ/ngày của bản dựng;
 * giá từng ổ, giá từng món ở chợ giữ nguyên như đời thật.
 *
 * Bốn luật của kho (P3-03 §2.1–2.3):
 *  · hàng HƯ là KHOÁ — không có "dùng đại" (CANON §7)
 *  · lấy lô cũ nhất trước (FIFO) — người chơi tự quyết mua loại nào, không chọn lô
 *  · chất lượng KHÔNG BAO GIỜ hiện thành số — chỉ hiện ngày mua / màu nước hũ đồ chua
 *  · hết là hết: không có nút nhập thêm giữa buổi (KH-3)
 */
import ECON_JSON from "../content/econ/econ.json";
import GOODS_JSON from "../content/econ/goods.json";
import CAL_JSON from "../content/econ/calendar.json";
import type { Ingredient } from "./order";

export type Weather = "NANG_GAT" | "MAT" | "AM_U" | "MUA_RAO" | "MUA_DAM" | "OI";
export type GoodId = "BANH" | "PATE_NHA" | "PATE_THUONG" | "THIT_NGUOI" | "CHA_LUA" | "XIU_MAI" | "TRUNG"
  | "RAU" | "OT" | "SOT" | "DO_CHUA_NL" | "DO_CHUA_SAN";

export type GoodDef = {
  label: string; unit: string; perUnit: number; base_k: number; q0: number; curve: number[];
  weekday: "fixed" | "pate" | "thit" | "rau"; seller: string; step: number; storage: "COLD" | "DRY";
  coldSlots?: number; pickle?: boolean;
};

export const ECON = ECON_JSON as unknown as {
  scale: number; startCash_k: number;
  fixedCost_k: { base: number; fromDay: number; raised: number };
  menu_k: { khong: number; thuong: number; dayDu: number; dacBiet: number };
  sendHome_k: number;
  rent_k: Record<string, number> & { depositDays: number; graceDays: number };
  hui: { perPeriod_k: number; days: number[]; graceDays: number; lastGraceDays: number; remindDays: number[] };
  tuition: { amount_k: number; days: number[]; graceDays: number; telegraphDays: number };
  medicine: { amount_k: number; days: number[] };
  storage: { thung_xop: { coldSlots: number; coldShelfLifeDelta: Partial<Record<GoodId, number>> } };
};
export const GOODS = (GOODS_JSON as unknown as { goods: Record<GoodId, GoodDef> }).goods;
export const GOOD_IDS = Object.keys(GOODS) as GoodId[];
export const SELLERS = (GOODS_JSON as unknown as { sellers: Record<string, { name: string; blurb: string }> }).sellers;
const ING_GOOD = (GOODS_JSON as unknown as { ingredientGood: Record<string, GoodId[]> }).ingredientGood;
export const goodsFor = (ing: Ingredient): GoodId[] => ING_GOOD[ing] ?? [];
export const RECIPE_W = (GOODS_JSON as unknown as { recipeWeight: Record<string, number> }).recipeWeight;

type Cal = {
  weather: Weather[];
  weatherInfo: Record<Weather, { label: string; walkIn: number; gazeMul: number }>;
  weekdayIndex: Record<GoodDef["weekday"], number[]>;
  events: { id: string; fromDay: number; toDay: number; priceMul?: Record<string, number>; crowdMul?: number;
    breadPrice_k?: number; breadQ0?: number; telegraphFromDay: number; speakers: string[]; line?: string }[];
};
export const CAL = CAL_JSON as unknown as Cal;

/** Khoản theo ngày/mùa → ĐỒNG, đã co theo SCALE (làm tròn nghìn). */
export const scaledVnd = (k: number) => Math.round(k * ECON.scale) * 1000;
/** Giá từng món / từng ổ → ĐỒNG, KHÔNG co. */
export const vnd = (k: number) => Math.round(k * 1000);

// ─────────────────────────────────────────────────────────────── lịch mùa

export const weatherOf = (day: number): Weather => CAL.weather[(Math.max(1, day) - 1) % CAL.weather.length];
export const isRain = (w: Weather) => w === "MUA_RAO" || w === "MUA_DAM";
/** 0 = thứ Hai … 6 = Chủ nhật. Ngày 1 là thứ Hai (P3-01 §2.4.4). */
export const weekdayIdx = (day: number) => (((day - 1) % 7) + 7) % 7;
export const WEEKDAY_VI = ["thứ Hai", "thứ Ba", "thứ Tư", "thứ Năm", "thứ Sáu", "thứ Bảy", "Chủ nhật"];

export const eventsOn = (day: number) => CAL.events.filter((e) => day >= e.fromDay && day <= e.toDay);
export const crowdMul = (day: number) => eventsOn(day).reduce((a, e) => a * (e.crowdMul ?? 1), 1);

/** Giá một ĐƠN VỊ hàng hôm nay (nghìn đồng). Bánh mì là mỏ neo: không bao giờ nhân thứ/sự kiện. */
export function priceOf(g: GoodId, day: number): number {
  const d = GOODS[g];
  if (g === "BANH") return eventsOn(day).find((e) => e.breadPrice_k)?.breadPrice_k ?? d.base_k;
  let p = d.base_k * CAL.weekdayIndex[d.weekday][weekdayIdx(day)];
  for (const e of eventsOn(day)) p *= e.priceMul?.[d.weekday] ?? 1;
  return Math.round(p * 2) / 2;                        // chợ làm tròn tới 500đ
}

export function q0Of(g: GoodId, day: number): number {
  if (g === "BANH") return eventsOn(day).find((e) => e.breadQ0)?.breadQ0 ?? GOODS.BANH.q0;
  return GOODS[g].q0;
}

/** Chi phí cố định mỗi ngày (đồng, đã co) — than, đá, túi, xăng, gửi xe… chạy cả ngày nghỉ. */
export const fixedCostVnd = (day: number) => scaledVnd(day >= ECON.fixedCost_k.fromDay ? ECON.fixedCost_k.raised : ECON.fixedCost_k.base);

// ─────────────────────────────────────────────────────────────── kho

export type Lot = { good: GoodId; day: number; left: number; q0: number };
export type Storage = "thung_xop" | "tu_mat";
/** `storage` do thiết bị quyết (P3-04 B1 tủ mát); `noiU` = có nồi ủ xíu mại (B2). */
export type InventoryState = { lots: Lot[]; lastBasket: Partial<Record<GoodId, number>>; storage?: Storage; noiU?: boolean };
export const newInventory = (): InventoryState => ({ lots: [], lastBasket: {}, storage: "thung_xop" });

/**
 * Hạn dùng theo cách bảo quản: thùng xốp làm pate chỉ còn 1 ngày; tủ mát (P3-04 B1) cho đồ
 * lạnh để được GẤP ĐÔI (đường cong chất lượng giãn ra theo). Nồi ủ giữ xíu mại qua đêm.
 * Đồ chua không đổi hạn theo tủ.
 */
export function shelfDays(g: GoodId, storage: Storage = "thung_xop", noiU = false): number {
  const d = GOODS[g];
  if (g === "XIU_MAI" && noiU) return 2;
  if (d.storage === "COLD" && storage === "tu_mat") return d.curve.length * 2;
  const delta = d.storage === "COLD" ? ECON.storage.thung_xop.coldShelfLifeDelta[g] ?? 0 : 0;
  return Math.max(1, d.curve.length + delta);
}

/** Chất lượng một lô hôm nay; null = HƯ (khoá). Người chơi KHÔNG BAO GIỜ thấy số này. */
export function lotQuality(l: Lot, day: number, storage: Storage = "thung_xop", noiU = false): number | null {
  const age = day - l.day;
  if (age < 0 || age >= shelfDays(l.good, storage, noiU)) return null;
  const c = GOODS[l.good].curve;
  const idx = GOODS[l.good].storage === "COLD" && storage === "tu_mat" ? Math.floor(age / 2) : age;
  return l.q0 * (c[Math.min(idx, c.length - 1)] ?? (l.good === "XIU_MAI" ? 0.85 : c[c.length - 1]));
}
const lq = (inv: InventoryState, l: Lot, day: number) => lotQuality(l, day, inv.storage ?? "thung_xop", !!inv.noiU);

export function stockOf(inv: InventoryState, g: GoodId, day: number) {
  return inv.lots.reduce((a, l) => a + (l.good === g && lq(inv, l, day) !== null ? l.left : 0), 0);
}

/** Còn bao nhiêu PHẦN kẹp được cho nguyên liệu này (gộp mọi loại hàng dùng được). */
export function portionsFor(inv: InventoryState, ing: Ingredient, day: number) {
  return goodsFor(ing).reduce((a, g) => a + stockOf(inv, g, day), 0);
}

/** Lấy n phần, lô cũ nhất trước. Trả chất lượng từng phần (thiếu thì trả ít hơn n). */
export function take(inv: InventoryState, ing: Ingredient | "bread", n: number, day: number): number[] {
  const goods = ing === "bread" ? (["BANH"] as GoodId[]) : goodsFor(ing);
  const lots = inv.lots.filter((l) => goods.includes(l.good) && l.left > 0 && lq(inv, l, day) !== null)
    .sort((a, b) => a.day - b.day);
  const out: number[] = [];
  for (const l of lots) {
    while (l.left > 0 && out.length < n) { l.left--; out.push(lq(inv, l, day)!); }
    if (out.length >= n) break;
  }
  inv.lots = inv.lots.filter((l) => l.left > 0);
  return out;
}

/** Trả phần lại kho (gỡ miếng khỏi ổ chưa gói). */
export function putBack(inv: InventoryState, ing: Ingredient, n: number, day: number) {
  const g = goodsFor(ing).find((x) => stockOf(inv, x, day) > 0) ?? goodsFor(ing)[0];
  if (!g) return;
  const l = inv.lots.filter((x) => x.good === g && lq(inv, x, day) !== null).sort((a, b) => b.day - a.day)[0];
  if (l) l.left += n; else inv.lots.push({ good: g, day, left: n, q0: q0Of(g, day) });
}

export function buy(inv: InventoryState, g: GoodId, units: number, day: number) {
  if (units <= 0) return;
  inv.lots.push({ good: g, day, left: units * GOODS[g].perUnit, q0: q0Of(g, day) });
}

/** Đầu ngày: dọn hàng hư. Trả những gì bỏ đi (để sổ sách tối ghi "bỏ: …"). */
export function expire(inv: InventoryState, day: number): { good: GoodId; units: number }[] {
  const out: { good: GoodId; units: number }[] = [];
  inv.lots = inv.lots.filter((l) => {
    if (lq(inv, l, day) !== null) return true;
    out.push({ good: l.good, units: l.left / GOODS[l.good].perUnit });
    return false;
  });
  return out;
}

/** Ô lạnh đang dùng (1 ô ≈ 20 phần của doc). Thùng xốp có 8 ô. */
export function coldSlotsUsed(inv: InventoryState, day: number) {
  let s = 0;
  for (const g of GOOD_IDS) {
    const d = GOODS[g];
    if (d.storage !== "COLD") continue;
    s += (stockOf(inv, g, day) / d.perUnit) * (d.coldSlots ?? 1);
  }
  return s;
}
/** Ô lạnh: thùng xốp 8, tủ mát 20 (P3-03 §2.2 STORAGE). */
export const coldSlotCap = (inv?: InventoryState) => (inv?.storage === "tu_mat" ? 20 : ECON.storage.thung_xop.coldSlots);

// ─────────────────────────────────────────────────────────────── giá ổ + chất lượng ổ

/** "khong" = bánh mì không (P4-03 SK-31: 10.000₫ thay vì 25.000₫). */
export type Tier = "khong" | "thuong" | "dayDu" | "dacBiet";
/** Giá bán theo loại ổ khách gọi (P3-03 §2.5 thực đơn). */
export function tierOf(intent: { nhan: readonly string[]; nhieu?: string; dayDu?: boolean }): Tier {
  const n = intent.nhan.length;
  if (!n && !intent.dayDu) return "khong";
  if ((intent.dayDu || n >= 3) && intent.nhieu) return "dacBiet";
  if (intent.dayDu || n >= 2) return "dayDu";
  return "thuong";
}
export const loafPriceVnd = (t: Tier) => vnd(ECON.menu_k[t]);

const MEAT: ReadonlySet<string> = new Set(["thit", "chalua", "xiumai", "opla"]);
const RAU_ING: ReadonlySet<string> = new Set(["dualeo", "hanhngo", "ot"]);

/**
 * `dishQuality` (P3-03 §2.3): 1 − Σ w·(1 − Q) theo nhóm. Chỉ tính nhóm CÓ trong ổ.
 * Nhận vào chất lượng từng phần đã lấy khỏi kho.
 */
export function dishQuality(bread: number, parts: { ing: Ingredient; q: number }[]): number {
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 1);
  const grp = (f: (i: string) => boolean) => avg(parts.filter((p) => f(p.ing)).map((p) => p.q));
  const q = 1
    - RECIPE_W.bread * (1 - bread)
    - RECIPE_W.pate * (1 - grp((i) => i === "pate"))
    - RECIPE_W.meat * (1 - grp((i) => MEAT.has(i)))
    - RECIPE_W.dochua * (1 - grp((i) => i === "dochua"))
    - RECIPE_W.rau * (1 - grp((i) => RAU_ING.has(i)))
    - RECIPE_W.sot * (1 - grp((i) => i === "tuongot"));
  return Math.max(0, Math.min(1, q));
}

/** Ngưỡng khách nếm ra: người soi nếm ra sớm hơn. Chị Lan (0,9) chỉ chịu được lệch 0,09. */
export const tasteThreshold = (soi: number) => 0.18 - 0.10 * soi;
