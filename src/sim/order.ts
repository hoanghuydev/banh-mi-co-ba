import type { Rng } from "../core/rng";

/**
 * Đơn hàng, nguyên liệu và ĐỊNH LƯỢNG.
 *
 * CANON T2: **món ăn LÀ lựa chọn hội thoại**. Người chơi không bao giờ chọn câu nói,
 * họ chọn nguyên liệu — nên tất cả "ý" của một lượt tiếp khách nằm gọn ở file này.
 *
 * Vì sao có định lượng chứ không phải chỉ có/không:
 *  · §3.1 xếp "sai tỉ lệ" vào `ORDER_DEFECT` — định lượng vốn đã là canon
 *  · §14 cho sẵn từ vựng: "nhiều ớt", "cho ít rau"
 *  · §8(g) coi "bớt một thứ nhỏ với 100% khách suốt 40 ngày" là lỗ hổng LỚN NHẤT;
 *    lỗ hổng đó chỉ tồn tại nếu bớt được
 *  · §3.2 có `FREE_EXTRA` (cho thêm đồ chua) là sự kiện tích cực
 *
 * Vì sao KHÔNG cho bỏ vô hạn:
 *  · §8(i) cấm spam hành vi mua chuộc — phải có diminishing returns
 *  · và một ổ bánh mì thì kẹp không lại nếu nhồi quá — xem `CAPACITY`
 *
 * Bảng phân loại lỗi, mức nặng nhẹ và dung sai theo P1-03 §2.6.
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
  /**
   * Tối đa bỏ được mấy phần. Thang chỉ còn hai nấc: một phần là mặc định, hai phần là
   * "nhiều" — hết nấc. Nấc thứ ba không thêm được chữ nào vào câu khách nói, chỉ thêm
   * một lần bấm, nên bỏ.
   */
  max: number;
};

/**
 * Thứ tự này là THỨ TỰ XẾP LỚP trong ổ bánh, từ dưới lên trên —
 * quết pate trước, nhân mặn, rồi rau, sốt rưới sau cùng. Bảng kẹp nhân vẽ theo đúng đây.
 */
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
 * Nhồi quá là ổ bánh kẹp không lại. Đơn nặng nhất gọi được là ổ đầy đủ + xin thêm một
 * nhân + rau đầy đủ + nhiều ớt + nhiều tương = 14 phần — trần phải trên mức đó, không
 * thì có đơn không làm đúng nổi, cộng hai phần chừa cho chuyện cho thêm.
 * Trần cũng phải DƯỚI 20 (= 10 món × trần 2 phần), không thì nhồi hết cỡ vẫn lọt và
 * `STUFFED` thành luật chết.
 */
export const CAPACITY = 16;

/** Mấy thứ cho thêm được mà khách không phật lòng — nguồn của `FREE_EXTRA`. */
const NICETY: ReadonlySet<Ingredient> = new Set<Ingredient>(["dochua", "ot", "tuongot", "hanhngo"]);

const NHAN = INGREDIENTS.filter((i) => i.kind === "nhan").map((i) => i.id);
/** "Cho một ổ đầy đủ" ở Sài Gòn = thịt nguội + chả lụa + pate (P1-03 §2.2). */
const DAY_DU: readonly Ingredient[] = ["pate", "thit", "chalua"];

/**
 * Ý định gọi món. Cả CÂU NÓI lẫn BẢNG ĐỊNH LƯỢNG đều suy ra từ đây, nên hai thứ
 * không bao giờ lệch nhau — câu nói tự nó đủ để làm đúng ổ bánh (có test bất biến).
 */
export type OrderIntent = {
  /** Loại nhân mặn, mặc định mức 1 — kể tên ra là được một phần. */
  nhan: Ingredient[];
  /** Một loại nhân được xin thêm — lên mức 2, nấc cuối. */
  nhieu?: Ingredient;
  /** Gọi "một ổ đầy đủ" — ba nhân tiêu chuẩn, không cần kể tên. */
  dayDu?: boolean;
  /**
   * "it" = "cho ít rau": rau MỘT NỬA — không phải cấm thứ nào (P1-03 §2.3 luật vàng).
   * "khong" = "không rau" / "bánh mì không" — P4-05 §2.7 A: chỉ ổ bánh. Bẫy lớn nhất của
   * người chơi mới (tưởng khách quên) — ML-04 bé Su, ML-12 anh Bảo ngày 29.
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
   * Nhân KHÔNG được gọi tên = mức 0, KHÔNG phải "khách không nhắc tới".
   * Gọi tên nhân chính là cách nói ra cả hai vế: "cho một ổ pate" đã nói rằng ổ đó không
   * có chả lụa, y như "cho một ổ bánh mì không" nói rằng ổ đó không có gì hết. Để mức
   * `undefined` thì `diffDish` bỏ qua, và bỏ đại một miếng pate vào ổ bánh mì không vẫn
   * được chấm hoàn hảo — T2 ("câu nói quyết định ổ bánh") chết ngay chỗ đó.
   * Rau/sốt không cần dòng này: `veg`/`ot`/`tuong` bên dưới đã gán mức cho đủ cả năm thứ.
   */
  for (const n of NHAN) lv[n] = 0;
  for (const n of it.nhan) lv[n] = it.nhieu === n ? 2 : 1;
  const veg = it.rau === "day-du" ? 2 : it.rau === "it" ? 1 : 0;
  lv.dochua = veg; lv.dualeo = veg; lv.hanhngo = veg;
  lv.ot = it.ot;
  lv.tuongot = it.tuong;
  for (const b of it.bo ?? []) lv[b] = 0;
  return lv;
}

export const specOf = (intent: OrderIntent): OrderSpec => ({ intent, levels: levelsOf(intent) });

function randomIntent(rng: Rng, usual: boolean): OrderIntent {
  const dayDu = rng.next() < 0.15;
  const nhan = dayDu ? [...DAY_DU] : [rng.pick(NHAN)];
  if (!dayDu && rng.next() < 0.3) {                    // thỉnh thoảng gọi hai nhân
    nhan.push(rng.pick(NHAN.filter((n) => n !== nhan[0])));
  }
  const nhieu = rng.next() < 0.25 ? rng.pick(nhan) : undefined;
  return {
    nhan,
    nhieu: dayDu ? undefined : nhieu,
    dayDu: dayDu || undefined,
    rau: rng.next() < 0.7 ? "day-du" : "it",
    ot: rng.next() < 0.25 ? 2 : rng.next() < 0.3 ? 0 : 1,
    tuong: rng.next() < 0.2 ? 2 : rng.next() < 0.25 ? 0 : 1,
    usual,
  };
}

/** Đơn "ruột" của một NPC: cố định cả mùa, là thứ người chơi phải NHỚ. */
export const makeUsual = (rng: Rng) => specOf(randomIntent(rng, false));

/** Đơn của một lượt: đa số là đơn ruột, thỉnh thoảng đổi ý. */
export function makeOrder(rng: Rng, usual: OrderSpec, canAskUsual: boolean): OrderSpec {
  if (canAskUsual && rng.next() < 0.5) return specOf({ ...usual.intent, usual: true });
  if (rng.next() < 0.65) return usual;
  return specOf(randomIntent(rng, false));
}

/**
 * Câu gọi món, dùng đúng cách nói miền Nam của CANON §14.
 *
 * LUẬT: câu nói phải TỰ NÓ quyết định được ổ bánh — và phiếu đơn trên màn hình chỉ
 * được hiện ĐÚNG câu này, nguyên văn (P1-03 §2.4.3: checklist đã phân tích là giết T2).
 * Rau đầy đủ là mặc định nên không ai nói ra; chỉ nói khi muốn ít.
 */
export function sayOrder(spec: OrderSpec): string {
  const it = spec.intent;
  if (it.usual) return spec.short ?? "Như mọi bữa nghen con.";
  if (spec.phrase) return spec.phrase;
  if (!it.nhan.length && !it.dayDu && it.rau === "khong") return "Cho một ổ bánh mì không.";

  const parts = [it.dayDu
    ? "Cho một ổ đầy đủ"
    : `Cho một ổ ${it.nhan.map((n) => (it.nhieu === n ? `nhiều ${labelOf(n)}` : labelOf(n))).join(" với ")}`];
  if (it.rau === "it") parts.push("cho ít rau");
  else if (it.rau === "khong") parts.push("không rau");
  // Mọi thứ khách CẤM đều phải thành lời: mức 0 mà không ai nói ra thì bỏ vô là một khoản
  // phạt UNWANTED câm — đúng thứ T2 cấm. Chỉ bỏ qua những thứ CÂU NÀY đã nói rồi:
  // nhân không được kể tên (đã hàm ý mức 0), "không rau", "không ớt", "không tương".
  const spoken = new Set<Ingredient>(it.nhan);
  for (const i of INGREDIENTS) if (i.kind === "nhan" && !it.nhan.includes(i.id)) spoken.add(i.id);
  if (it.rau === "khong") { spoken.add("dochua"); spoken.add("dualeo"); spoken.add("hanhngo"); }
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
 * Thang chỉ còn hai nấc, nên lệch một nấc là lệch GẤP ĐÔI hoặc còn MỘT NỬA phần —
 * tức một đơn vị tỉ lệ tròn, không phải nửa đơn vị như hồi thang bốn nấc.
 * Dung sai 0,5 là nửa nấc: không nấc nào lọt qua được (một nấc vẫn là lỗi, y như cũ),
 * nhưng nó kéo `magnitude` của lệch một nấc lên 0,5 thay vì 0,25 — đúng với chuyện
 * "ít rau quá" bây giờ là hụt nửa ổ rau chứ không còn là hụt một phần ba.
 * Vẫn nhẹ hơn hẳn `MISSING` (12 × 0,5 so với 20), nên thứ tự nặng nhẹ không đảo.
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
 * So ổ bánh đã làm với đơn đã gọi (P1-03 §2.6).
 *  · MISSING   — thứ khách gọi mà ổ không có
 *  · UNWANTED  — thứ khách đã NÓI không muốn ("không ớt") mà vẫn có
 *  · WRONG_RATIO — lệch mức quá dung sai ±0,5 (tức lệch từ một nấc trở lên)
 * Chỉ lời khách nói ra mới là ràng buộc cứng (CANON Đ3) — nhưng KỂ TÊN NHÂN cũng là nói:
 * "cho một ổ pate" đồng thời nói rằng ổ đó không có chả lụa (xem `levelsOf`). Thứ thật sự
 * không ai nhắc tới thì `spec.levels` để trống và vòng lặp dưới bỏ qua.
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
 * Một phần đáng bao nhiêu — theo ĐÚNG giá chợ (`econ/goods.json`: base_k ÷ perUnit),
 * lấy một phần thịt nguội (2k) làm mốc 1,0: pate thường 1k → 0,5; chả lụa 1,83k → 0,9;
 * xíu mại 1,5k → 0,75; trứng 2,5k → 1,25; đồ chua 0,44k và tương 0,44k → 0,22;
 * ớt 0,35k → 0,18; rau 0,31k → 0,16.
 *
 * Vì sao phải theo giá chứ không đếm số phần: một nhúm ớt và một lát thịt không phải
 * cùng một tấm lòng. Đếm phần thì ớt với tương là cách cày thiện cảm RẺ NHẤT trong game —
 * §8(i) cấm đúng chuyện đó. Bảng chép tay ở đây chứ không `import` từ `econ.ts`:
 * `order.ts` là tầng dưới (econ đọc ngược lên lấy `Ingredient`), và đây là GIÁ TRỊ TẤM
 * LÒNG chứ không phải sổ sách. Chợ đổi giá thì sửa tay ở đây.
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

/** Ổ bánh ĐÚNG đơn — cái người chơi phải làm ra khi nghe câu gọi món. Dùng cho test và bot. */
export function dishFor(spec: OrderSpec): Ingredient[] {
  const out: Ingredient[] = [];
  for (const ing of INGREDIENTS) for (let i = 0; i < (spec.levels[ing.id] ?? 0); i++) out.push(ing.id);
  return out;
}
