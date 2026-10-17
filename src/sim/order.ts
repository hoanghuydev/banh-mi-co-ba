import type { Rng } from "../core/rng";
import { easeOf } from "./ease";
import { MENU_IDS, RAU_CO_GIAN, RAU_NEN, isBare, itemOf, nhanOf, type MenuItemId } from "./menu";

/**
 * Đơn hàng, nguyên liệu và ĐỊNH LƯỢNG. CANON T2: món ăn LÀ lựa chọn hội thoại — người chơi không
 * chọn câu nói, họ chọn nguyên liệu, nên tất cả "ý" của một lượt tiếp khách nằm gọn ở file này.
 *
 * Có định lượng vì §8(g) coi "bớt một thứ nhỏ với 100% khách suốt 40 ngày" là lỗ hổng LỚN NHẤT —
 * lỗ hổng đó chỉ tồn tại nếu bớt được. Nhưng không cho bỏ vô hạn: §8(i) cấm spam mua chuộc, và
 * một ổ bánh mì thì kẹp không lại nếu nhồi quá (`CAPACITY`).
 */

export type Ingredient =
  | "pate" | "thit" | "chalua" | "xiumai" | "opla"
  | "dochua" | "dualeo" | "hanhngo" | "ot" | "tuongot";

export type IngredientInfo = {
  id: Ingredient;
  /** Phím số bấm ở bảng kẹp nhân (0 = phím số 0). */
  key: number;
  label: string;
  kind: "nhan" | "rau" | "sot";
  /** Thang hai nấc: một phần là mặc định, hai phần là "cho nhiều". */
  max: number;
};

/** THỨ TỰ XẾP LỚP trong ổ, từ dưới lên — quết pate trước, rắc hành ngò sau cùng. */
export const INGREDIENTS: IngredientInfo[] = [
  { id: "pate",    key: 1, label: "pate",         kind: "nhan", max: 2 },
  { id: "thit",    key: 2, label: "thịt nguội",   kind: "nhan", max: 2 },
  { id: "chalua",  key: 3, label: "chả lụa",      kind: "nhan", max: 2 },
  { id: "xiumai",  key: 4, label: "xíu mại",      kind: "nhan", max: 2 },
  { id: "opla",    key: 5, label: "trứng ốp la",  kind: "nhan", max: 2 },
  { id: "dochua",  key: 6, label: "đồ chua",      kind: "rau",  max: 2 },
  { id: "dualeo",  key: 7, label: "dưa leo",      kind: "rau",  max: 2 },
  { id: "hanhngo", key: 8, label: "hành ngò",     kind: "rau",  max: 2 },
  { id: "ot",      key: 9, label: "ớt",           kind: "rau",  max: 2 },
  { id: "tuongot", key: 0, label: "tương ớt",     kind: "sot",  max: 2 },
];

export const BY_ID = new Map(INGREDIENTS.map((i) => [i.id, i]));
export const labelOf = (id: Ingredient) => BY_ID.get(id)!.label;

/**
 * Nhồi quá là ổ bánh kẹp không lại. Đơn nặng nhất gọi được là 14 phần nên trần phải trên mức đó
 * (cộng hai phần chừa cho chuyện cho thêm), và phải DƯỚI 20 (= 10 món × trần 2 phần) — không thì
 * nhồi hết cỡ vẫn lọt và `STUFFED` thành luật chết.
 */
export const CAPACITY = 16;

/** Mấy thứ cho thêm được mà khách không phật lòng — nguồn của `FREE_EXTRA`. */
export const NICETY: ReadonlySet<Ingredient> = new Set<Ingredient>(["dochua", "ot", "tuongot", "hanhngo"]);

const NHAN = INGREDIENTS.filter((i) => i.kind === "nhan").map((i) => i.id);

/**
 * KHÁCH VÃNG LAI GỌI GÌ — bốc một MÓN trên bảng, không còn tự ghép tổ hợp nguyên liệu.
 *
 * Hồi còn ghép tổ hợp, `randomIntent` sinh ra được "ổ pate với ốp la" — một món không có
 * trên bảng nào, không ai ngoài đời gọi, mà người chơi vẫn bị chấm điểm theo nó. Bảng
 * trọng số này nằm ở đây (chứ không ở `menu.json`) vì nó là chuyện HÔM NAY AI MUA GÌ, không
 * phải chuyện cái xe bán gì; dàn ra thành mảng phẳng để chỉ tốn ĐÚNG MỘT lần rút số.
 */
const WALK_IN_WEIGHT: Readonly<Record<MenuItemId, number>> = {
  daydu: 22, thit: 18, chalua: 18, xiumai: 16, opla: 12, pate: 10, khong: 4,
};
const WALK_IN_BAG: readonly MenuItemId[] = MENU_IDS.flatMap((id) =>
  Array.from({ length: WALK_IN_WEIGHT[id] }, () => id));

/**
 * Cái rổ của một NGÀY — sáu bữa đầu chỉ có mấy món `sim/ease.ts` mở (`easeOf().mon`), từ
 * ngày 7 là cả bảy món, tức đúng `WALK_IN_BAG` ở trên.
 *
 * Trọng số giữ nguyên rồi mới lọc, nên mấy món còn lại vẫn giữ đúng tỉ lệ với nhau — ngày 1
 * vẫn là chả lụa nhiều hơn pate gần gấp đôi, y như ngày 20. Dàn phẳng và nhớ lại (`BAGS`) để
 * mỗi lần gọi món vẫn chỉ tốn ĐÚNG MỘT lần rút số.
 */
const BAGS = new Map<string, readonly MenuItemId[]>();
function walkInBag(day?: number): readonly MenuItemId[] {
  const mon = easeOf(day).mon;
  if (mon.length === MENU_IDS.length) return WALK_IN_BAG;
  const key = mon.join(",");
  let bag = BAGS.get(key);
  if (!bag) BAGS.set(key, (bag = WALK_IN_BAG.filter((id) => mon.includes(id))));
  return bag;
}

/**
 * Ý định gọi món. Cả CÂU NÓI lẫn BẢNG ĐỊNH LƯỢNG đều suy ra từ đây, nên hai thứ
 * không bao giờ lệch nhau — câu nói tự nó đủ để làm đúng ổ bánh (có test bất biến).
 */
export type OrderIntent = {
  /**
   * MÓN TRÊN BẢNG — cái khách gọi tên, và cái duy nhất quyết định ổ bánh có nhân gì.
   *
   * Trước đây chỗ này là một danh sách nguyên liệu (`nhan: Ingredient[]`) cộng một cờ
   * `dayDu`, tức mỗi đơn hàng tự khai lại công thức của nó. Hai hệ quả: bánh mì xíu mại
   * không có pate (không ai khai là có), và giá tính bằng cách ĐẾM số nhân nên quết thêm
   * miếng pate là nhảy bậc giá. Giờ công thức nằm ở `content/recipes/menu.json`, đúng
   * một chỗ, và chính là tấm bảng người chơi đọc trên vách.
   */
  mon: MenuItemId;
  /** Một thứ nhân của món được xin thêm — lên mức 2, nấc cuối. */
  nhieu?: Ingredient;
  /**
   * "it" = "cho ít rau": rau MỘT NỬA — không phải cấm thứ nào (P1-03 §2.3 luật vàng).
   * "khong" = "không rau" — P4-05 §2.7 A. Bẫy lớn nhất của người chơi mới (tưởng khách
   * quên) — ML-04 bé Su, ML-12 anh Bảo ngày 29. Ổ "bánh mì không" tự nó đã trơn.
   */
  rau: "day-du" | "it" | "khong";
  /** Thứ khách NÓI bỏ ra ("không hành", "đừng bỏ ngò") — mức 0, bỏ vô là UNWANTED. */
  bo?: Ingredient[];
  ot: 0 | 1 | 2;
  tuong: 0 | 1 | 2;
  usual: boolean;
};

export type OrderSpec = {
  intent: OrderIntent;
  /** Mức khách muốn cho từng thứ. Không có trong bảng = khách không nói tới. */
  levels: Partial<Record<Ingredient, number>>;
  /**
   * Câu gọi NGUYÊN VĂN của một người có tên (P4-01 "Đơn hàng quen"). Luật T2 vẫn giữ: câu
   * phải tự nó quyết định được ổ bánh — có test đọc lại câu ra bảng định lượng.
   */
  phrase?: string;
  /** Câu nói tắt khi đã quen ("Như mọi bữa nghen con.") — mỗi người một kiểu nói. */
  short?: string;
  /**
   * KHẨU VỊ ẨN (P4-01, P4-03 §2.2 ML) — mức mà người này THẬT SỰ muốn nhưng không bao giờ
   * nói. Ổ làm theo mức này cũng ĐÚNG. Bỏ qua thì không bị gì (ignorePenalty = none).
   */
  alt?: Partial<Record<Ingredient, number>>;
};

export function levelsOf(it: OrderIntent): Partial<Record<Ingredient, number>> {
  const lv: Partial<Record<Ingredient, number>> = {};
  /**
   * Nhân KHÔNG có trong món = mức 0, KHÔNG phải "khách không nhắc tới". Gọi tên món chính là
   * cách nói ra cả hai vế: "cho một ổ xíu mại" đã nói rằng ổ đó không có chả lụa.
   *
   * ⚠️ Để mức `undefined` thì `diffDish` bỏ qua, và bỏ đại một miếng pate vào ổ bánh mì không vẫn
   * được chấm hoàn hảo — T2 chết ngay chỗ đó.
   */
  for (const n of NHAN) lv[n] = 0;
  for (const [id, phan] of Object.entries(itemOf(it.mon).nhan)) {
    lv[id as Ingredient] = it.nhieu === id ? 2 : phan;
  }
  // Ổ trơn thì khay rau không chạm tới nó — "bánh mì không" là ổ bánh, hết.
  const bare = isBare(it.mon);
  const mul = bare || it.rau === "khong" ? 0 : it.rau === "it" ? 0.5 : 1;
  for (const id of RAU_CO_GIAN) lv[id] = Math.round((RAU_NEN[id] ?? 0) * mul);
  lv.ot = bare ? 0 : it.ot;
  lv.tuongot = bare ? 0 : it.tuong;
  for (const b of it.bo ?? []) lv[b] = 0;
  return lv;
}

export const specOf = (intent: OrderIntent): OrderSpec => ({ intent, levels: levelsOf(intent) });

/**
 * `day` là CỦA SÁU BỮA ĐẦU, không bắt buộc (xem `sim/ease.ts`): nó co cái rổ món lại và
 * nhân `fuss` vào mọi lời dặn thêm. `fuss = 0` nghĩa là câu gọi món ngày 1 gọn đúng một
 * mệnh đề — *"Cho một ổ chả lụa."* — không "cho nhiều", không "ít rau", không "khỏi ớt".
 *
 * ⚠️ Cấu trúc rút số GIỮ NGUYÊN từng dòng: `fuss` chỉ nhân vào NGƯỠNG so sánh, không thêm
 * cũng không bớt một lần `rng.next()` nào. Nhờ vậy ngày 7 trở đi (`fuss = 1`) dãy số ra y
 * hệt trước khi có file `ease.ts` — mọi lưới đo neo ở ngày 7/8 vẫn gặp đúng người cũ, đơn cũ.
 */
function randomIntent(rng: Rng, usual: boolean, day?: number): OrderIntent {
  const f = easeOf(day).fuss;
  const mon = rng.pick(walkInBag(day));
  if (mon === "khong") return { mon, rau: "khong", ot: 0, tuong: 0, usual };
  const nhan = nhanOf(mon);
  return {
    mon,
    nhieu: rng.next() < 0.25 * f ? rng.pick(nhan) : undefined,
    // "ít rau" là lời dặn, nên nó mới là vế co lại: f = 0 → 1,0 → ai cũng rau đầy đủ.
    rau: rng.next() < 1 - 0.3 * f ? "day-du" : "it",
    ot: rng.next() < 0.25 * f ? 2 : rng.next() < 0.3 * f ? 0 : 1,
    tuong: rng.next() < 0.2 * f ? 2 : rng.next() < 0.25 * f ? 0 : 1,
    usual,
  };
}

/** Đơn "ruột" của một NPC: cố định cả mùa, là thứ người chơi phải NHỚ. */
export const makeUsual = (rng: Rng, day?: number) => specOf(randomIntent(rng, false, day));

/** Đơn của một lượt: đa số là đơn ruột, thỉnh thoảng đổi ý. */
export function makeOrder(rng: Rng, usual: OrderSpec, canAskUsual: boolean, day?: number): OrderSpec {
  if (canAskUsual && rng.next() < 0.5) return specOf({ ...usual.intent, usual: true });
  if (rng.next() < 0.65) return usual;
  return specOf(randomIntent(rng, false, day));
}

/**
 * Câu gọi món, dùng đúng cách nói miền Nam của CANON §14.
 *
 * ⚠️ Câu nói phải TỰ NÓ quyết định được ổ bánh, và phiếu đơn trên màn hình chỉ được hiện ĐÚNG câu
 * này nguyên văn — checklist đã phân tích sẵn là giết T2. Rau đầy đủ là mặc định nên không ai nói
 * ra; chỉ nói khi muốn ít.
 */
export function sayOrder(spec: OrderSpec): string {
  const it = spec.intent;
  if (it.usual) return spec.short ?? "Như mọi bữa nghen con.";
  if (spec.phrase) return spec.phrase;
  const item = itemOf(it.mon);
  if (isBare(it.mon)) return `Cho một ổ ${item.call}.`;

  const parts = [`Cho một ổ ${item.call}`];
  if (it.nhieu) parts.push(`cho nhiều ${labelOf(it.nhieu)}`);
  if (it.rau === "it") parts.push("cho ít rau");
  else if (it.rau === "khong") parts.push("không rau");
  // Mọi thứ khách CẤM đều phải thành lời: mức 0 mà không ai nói ra thì bỏ vô là một khoản
  // phạt UNWANTED câm — đúng thứ T2 cấm. Chỉ bỏ qua những thứ CÂU NÀY đã nói rồi: nhân
  // KHÔNG có trong món (gọi tên món đã hàm ý mức 0), "không rau", "không ớt", "không tương".
  const spoken = new Set<Ingredient>();
  for (const i of INGREDIENTS) if (i.kind === "nhan" && item.nhan[i.id] === undefined) spoken.add(i.id);
  if (it.rau === "khong") for (const r of RAU_CO_GIAN) spoken.add(r);
  if (it.ot === 0) spoken.add("ot");
  if (it.tuong === 0) spoken.add("tuongot");
  for (const b of it.bo ?? []) {
    if (spoken.has(b)) continue;
    spoken.add(b);
    parts.push(b === "hanhngo" ? "không hành" : `không ${labelOf(b)}`);
  }
  if (it.ot === 2) parts.push("nhiều ớt");
  else if (it.ot === 0) parts.push("không ớt");
  if (it.tuong === 2) parts.push("nhiều tương");
  else if (it.tuong === 0) parts.push("không tương");
  return parts.join(", ") + ".";
}

/** Hai đơn có cùng nội dung không (bỏ qua chuyện có nói "như mọi bữa" hay không). */
export function sameOrder(a: OrderSpec, b: OrderSpec) {
  return INGREDIENTS.every((i) => (a.levels[i.id] ?? -1) === (b.levels[i.id] ?? -1));
}

// ─────────────────────────────────────────────────────────── delivery-time diff

/**
 * Phân loại lỗi — P1-03 §2.6. `sCounter` là salience nếu phát hiện TẠI QUẦY (khách
 * đứng nhìn), `sEat` là lúc cắn miếng đầu (×5). WRONG_TEMP ở đây là ổ nguội (P1-01 §2.4).
 * `stuffed` không có trong doc — giữ lại vì là chuyện vật lý (ổ nhồi không kẹp lại được).
 */
/**
 * `TASTE_OFF` (P3-03 §2.3): đồ để lâu / pate rẻ / đồ chua quá ngày → khách NẾM ra lúc ăn
 * (salience 20 tại quầy, 100 lúc ăn). Không phải lỗi công thức — là lỗi của KHO.
 */
export type DefectKind = "MISSING" | "UNWANTED" | "WRONG_RATIO" | "WRONG_TEMP" | "STUFFED" | "TASTE_OFF";

export type Defect = {
  kind: DefectKind;
  item: Ingredient | null;
  /** Hướng lệch của WRONG_RATIO. */
  dir?: "under" | "over";
  magnitude: number;
  sCounter: number;
  sEat: number;
  /** Nhãn món để điền vào câu thoại ("pate", "đồ chua"…). */
  label: string;
  /** Tên cũ — điểm để xếp hạng `take(1)` (= sCounter × magnitude). */
  weight: number;
  /** Tên cũ — mô tả ngắn cho log/telemetry. */
  text: string;
};

const BASE: Record<DefectKind, number> = { MISSING: 20, UNWANTED: 24, WRONG_RATIO: 12, WRONG_TEMP: 18, STUFFED: 12, TASTE_OFF: 20 };
/** P1-03 §2.6 ITEM_WEIGHT, ánh xạ sang bộ nguyên liệu hiện có. */
const ITEM_WEIGHT: Record<Ingredient, number> = {
  pate: 1.4, thit: 1.3, chalua: 1.2, xiumai: 1.3, opla: 1.3,
  dochua: 1.0, dualeo: 0.8, hanhngo: 0.7, ot: 0.8, tuongot: 1.0,
};
/**
 * Thang chỉ còn hai nấc nên lệch một nấc là lệch GẤP ĐÔI hoặc còn MỘT NỬA phần. Dung sai 0,5 là
 * nửa nấc: không nấc nào lọt qua được, nhưng nó kéo `magnitude` của lệch một nấc lên 0,5 thay vì
 * 0,25 — đúng với chuyện "ít rau quá" bây giờ là hụt nửa ổ rau. Vẫn nhẹ hơn hẳn `MISSING`.
 */
const DEFAULT_TOLERANCE = 0.5;
const LEVEL_TO_RATIO = 1;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function mkDefect(kind: DefectKind, item: Ingredient | null, magnitude = 1, dir?: "under" | "over"): Defect {
  const w = item ? ITEM_WEIGHT[item] : 1;
  const sCounter = Math.min(100, BASE[kind] * w * magnitude);
  const label = item ? labelOf(item) : kind === "WRONG_TEMP" ? "bánh nguội" : kind === "TASTE_OFF" ? "vị lạ" : "nhồi chặt quá";
  const text = kind === "MISSING" ? `thiếu ${label}`
    : kind === "UNWANTED" ? `có ${label}`
    : kind === "WRONG_RATIO" ? `${dir === "under" ? "ít" : "nhiều"} ${label} quá`
    : kind === "WRONG_TEMP" ? "bánh nguội ngắt"
    : kind === "TASTE_OFF" ? "ăn thấy lạ vị"
    : "ổ bánh nhồi chặt quá, kẹp không lại";
  return { kind, item, dir, magnitude, sCounter, sEat: Math.min(100, sCounter * 5), label, weight: sCounter, text };
}

export function portionsOf(dish: readonly Ingredient[]) {
  const m = new Map<Ingredient, number>();
  for (const id of dish) m.set(id, (m.get(id) ?? 0) + 1);
  return m;
}

/**
 * So ổ bánh đã làm với đơn đã gọi:
 *  · MISSING  thứ khách gọi mà ổ không có · UNWANTED  thứ khách đã NÓI không muốn mà vẫn có
 *  · WRONG_RATIO  lệch mức quá dung sai ±0,5
 *
 * Chỉ lời khách nói ra mới là ràng buộc cứng — nhưng KỂ TÊN NHÂN cũng là nói (xem `levelsOf`).
 * Kết quả xếp theo điểm giảm dần: phần tử đầu là ứng viên của `take(1)`.
 */
export function diffDish(spec: OrderSpec, dish: readonly Ingredient[]): Defect[] {
  const got = portionsOf(dish);
  const out: Defect[] = [];

  for (const ing of INGREDIENTS) {
    const want = spec.levels[ing.id];
    if (want === undefined) continue;
    const have = got.get(ing.id) ?? 0;

    if (want === 0 && have > 0) { out.push(mkDefect("UNWANTED", ing.id)); continue; }
    if (want > 0 && have === 0) { out.push(mkDefect("MISSING", ing.id)); continue; }
    if (have === want) continue;
    // Cho THÊM MỘT PHẦN đồ chua / ớt / tương / ngò không phải lỗi — đó là hào phóng,
    // CANON §3.2 xếp `FREE_EXTRA` vào nhóm TÍCH CỰC. Thang hai nấc nên đây cũng là
    // lần cho thêm DUY NHẤT làm được: khách xin một phần, mình bỏ hai, hết trần.
    // Dòng này phải đứng TRƯỚC phép tính dung sai, không thì một nấc nào cũng là lỗi.
    if (have - want === 1 && NICETY.has(ing.id)) continue;
    const gap = Math.abs(have - want) * LEVEL_TO_RATIO;
    if (gap <= DEFAULT_TOLERANCE) continue;
    out.push(mkDefect("WRONG_RATIO", ing.id, clamp01((gap - DEFAULT_TOLERANCE) / 1.0), have < want ? "under" : "over"));
  }

  if (dish.length > CAPACITY) out.push(mkDefect("STUFFED", null, 1));
  return out.sort((a, b) => b.weight - a.weight);
}

/**
 * Một phần đáng bao nhiêu — theo ĐÚNG giá chợ (`econ/goods.json`), lấy một phần thịt nguội làm
 * mốc 1,0.
 *
 * ⚠️ Phải theo giá chứ không đếm số phần: một nhúm ớt và một lát thịt không phải cùng một tấm
 * lòng, và đếm phần thì ớt với tương là cách cày thiện cảm RẺ NHẤT trong game.
 *
 * Bảng chép tay ở đây chứ không `import` từ `econ.ts`: `order.ts` là tầng dưới, và đây là GIÁ TRỊ
 * TẤM LÒNG chứ không phải sổ sách. Chợ đổi giá thì sửa tay ở đây.
 */
const PORTION_VALUE: Record<Ingredient, number> = {
  pate: 0.5, thit: 1, chalua: 0.9, xiumai: 0.75, opla: 1.25,
  dochua: 0.22, dualeo: 0.16, hanhngo: 0.16, ot: 0.18, tuongot: 0.22,
};

/**
 * Cho thêm đồ "dễ thương" được bao nhiêu — tính bằng GIÁ TRỊ, không phải số lần bấm.
 * Chỉ tính khi ổ bánh không có lỗi nào — hào phóng trên một ổ làm sai thì không
 * phải là hào phóng, là chống chế.
 *
 * Mức trần tự nó đã chặn chuyện spam: thang hai nấc nên mỗi món chỉ cho dư được MỘT phần,
 * mà nhóm "dễ thương" có bốn món, nên tối đa một ổ là 0,78 — chưa bằng một lát thịt nguội.
 * Muốn khách quý mình thì phải làm đúng đơn và nhớ người, không có đường tắt bằng ớt.
 */
export function generosityOf(spec: OrderSpec, dish: readonly Ingredient[]) {
  const got = portionsOf(dish);
  let value = 0;
  for (const id of NICETY) {
    const want = spec.levels[id] ?? 0;
    value += Math.max(0, (got.get(id) ?? 0) - want) * PORTION_VALUE[id];
  }
  return value;
}

/**
 * Mấy thứ "dễ thương" người chơi bỏ DƯ so với đơn — theo ĐÚNG thứ tự xếp lớp của `INGREDIENTS`.
 * Cùng một phép đếm với `generosityOf` (chỉ nhóm `NICETY`), chỉ khác là ở đây cần TÊN để nói
 * thành lời: "con cho thêm đồ chua với ớt cho bà nè". Bỏ dư một miếng pate không nằm trong
 * danh sách này — cái đó là `RATIO_OVER`, một lỗi, không phải một tấm lòng.
 */
export function extraPortions(spec: OrderSpec, dish: readonly Ingredient[]): Ingredient[] {
  const got = portionsOf(dish);
  return INGREDIENTS
    .filter((i) => NICETY.has(i.id) && (got.get(i.id) ?? 0) > (spec.levels[i.id] ?? 0))
    .map((i) => i.id);
}

/** Ổ bánh ĐÚNG đơn — cái người chơi phải làm ra khi nghe câu gọi món. Dùng cho test và bot. */
export function dishFor(spec: OrderSpec): Ingredient[] {
  const out: Ingredient[] = [];
  for (const ing of INGREDIENTS) for (let i = 0; i < (spec.levels[ing.id] ?? 0); i++) out.push(ing.id);
  return out;
}
