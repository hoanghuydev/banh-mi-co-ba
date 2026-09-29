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
  /** Tối đa bỏ được mấy phần. Không ai kẹp bốn lát chả vào một ổ. */
  max: number;
};

/**
 * Thứ tự này là THỨ TỰ XẾP LỚP trong ổ bánh, từ dưới lên trên —
 * quết pate trước, nhân mặn, rồi rau, sốt rưới sau cùng. Bảng kẹp nhân vẽ theo đúng đây.
 */
export const INGREDIENTS: IngredientInfo[] = [
  { id: "pate",    key: 1, label: "pate",         kind: "nhan", max: 3 },
  { id: "thit",    key: 2, label: "thịt nguội",   kind: "nhan", max: 3 },
  { id: "chalua",  key: 3, label: "chả lụa",      kind: "nhan", max: 3 },
  { id: "xiumai",  key: 4, label: "xíu mại",      kind: "nhan", max: 3 },
  { id: "opla",    key: 5, label: "trứng ốp la",  kind: "nhan", max: 2 },
  { id: "dochua",  key: 6, label: "đồ chua",      kind: "rau",  max: 3 },
  { id: "dualeo",  key: 7, label: "dưa leo",      kind: "rau",  max: 3 },
  { id: "hanhngo", key: 8, label: "hành ngò",     kind: "rau",  max: 3 },
  { id: "ot",      key: 9, label: "ớt",           kind: "rau",  max: 3 },
  { id: "tuongot", key: 0, label: "tương ớt",     kind: "sot",  max: 3 },
];

export const BY_ID = new Map(INGREDIENTS.map((i) => [i.id, i]));
export const labelOf = (id: Ingredient) => BY_ID.get(id)!.label;

/** Nhồi quá là ổ bánh kẹp không lại. Đơn bình thường tốn 8–10 phần. */
export const CAPACITY = 15;

/** Mấy thứ cho thêm được mà khách không phật lòng — nguồn của `FREE_EXTRA`. */
const NICETY: ReadonlySet<Ingredient> = new Set<Ingredient>(["dochua", "ot", "tuongot", "hanhngo"]);

const NHAN = INGREDIENTS.filter((i) => i.kind === "nhan").map((i) => i.id);

/**
 * Ý định gọi món. Cả CÂU NÓI lẫn BẢNG ĐỊNH LƯỢNG đều suy ra từ đây, nên hai thứ
 * không bao giờ lệch nhau — câu nói tự nó đủ để làm đúng ổ bánh mà không cần nhìn phiếu.
 */
export type OrderIntent = {
  /** 1–2 loại nhân mặn, mặc định mức 2. */
  nhan: Ingredient[];
  /** Một loại nhân được xin thêm — lên mức 3. */
  nhieu?: Ingredient;
  /** "đầy đủ" = rau full; "ít" = ít rau, bỏ hành ngò. */
  rau: "day-du" | "it";
  ot: 0 | 1 | 3;
  tuong: 0 | 1 | 3;
  usual: boolean;
};

export type OrderSpec = {
  intent: OrderIntent;
  /** Mức khách muốn cho từng thứ. Không có trong bảng = khách không nói tới. */
  levels: Partial<Record<Ingredient, number>>;
};

export function levelsOf(it: OrderIntent): Partial<Record<Ingredient, number>> {
  const lv: Partial<Record<Ingredient, number>> = {};
  for (const n of it.nhan) lv[n] = it.nhieu === n ? 3 : 2;
  if (it.rau === "day-du") { lv.dochua = 2; lv.dualeo = 2; lv.hanhngo = 2; }
  else { lv.dochua = 1; lv.dualeo = 1; lv.hanhngo = 0; }
  lv.ot = it.ot;
  lv.tuongot = it.tuong;
  return lv;
}

export const specOf = (intent: OrderIntent): OrderSpec => ({ intent, levels: levelsOf(intent) });

function randomIntent(rng: Rng, usual: boolean): OrderIntent {
  const nhan = [rng.pick(NHAN)];
  if (rng.next() < 0.3) {                              // thỉnh thoảng gọi hai nhân
    const second = rng.pick(NHAN.filter((n) => n !== nhan[0]));
    nhan.push(second);
  }
  return {
    nhan,
    nhieu: rng.next() < 0.25 ? rng.pick(nhan) : undefined,
    rau: rng.next() < 0.7 ? "day-du" : "it",
    ot: rng.next() < 0.25 ? 3 : rng.next() < 0.3 ? 0 : 1,
    tuong: rng.next() < 0.2 ? 3 : rng.next() < 0.25 ? 0 : 1,
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
 * LUẬT: câu nói phải TỰ NÓ quyết định được ổ bánh. Nghe xong là làm đúng được,
 * không cần nhìn phiếu; phiếu trên HUD chỉ là cái nạng cho bản dựng thử.
 * Có test bất biến kiểm chuyện này.
 */
export function sayOrder(spec: OrderSpec): string {
  const it = spec.intent;
  if (it.usual) return "Cho cô như mọi bữa nghen con.";

  const nhan = it.nhan.map((n) => (it.nhieu === n ? `nhiều ${labelOf(n)}` : labelOf(n)));
  const parts = [`Cho một ổ ${nhan.join(" với ")}`];
  parts.push(it.rau === "day-du" ? "đầy đủ" : "cho ít rau");
  if (it.ot === 3) parts.push("nhiều ớt");
  else if (it.ot === 0) parts.push("không ớt");
  if (it.tuong === 3) parts.push("nhiều tương");
  else if (it.tuong === 0) parts.push("không tương");
  return parts.join(", ") + ".";
}

/** Tóm tắt ngắn để in lên phiếu đơn trên HUD. */
export function ticketOf(spec: OrderSpec): string {
  const on: string[] = [], off: string[] = [];
  for (const ing of INGREDIENTS) {
    const lv = spec.levels[ing.id];
    if (lv === undefined) continue;
    if (lv === 0) off.push(ing.label);
    else on.push(lv === 1 ? `ít ${ing.label}` : lv >= 3 ? `nhiều ${ing.label}` : ing.label);
  }
  return on.join(" · ") + (off.length ? `   ✕ ${off.join(" ")}` : "");
}

/** Hai đơn có cùng nội dung không (bỏ qua chuyện có nói "như mọi bữa" hay không). */
export function sameOrder(a: OrderSpec, b: OrderSpec) {
  return INGREDIENTS.every((i) => (a.levels[i.id] ?? -1) === (b.levels[i.id] ?? -1));
}

export type Defect = {
  kind: "missing" | "forbidden" | "under" | "over" | "unwanted" | "stuffed";
  item: Ingredient | null;
  /** Nặng hay nhẹ — thiếu hẳn nhân mặn đau hơn dư một cọng ngò. */
  weight: number;
  text: string;
};

export function portionsOf(dish: Ingredient[]) {
  const m = new Map<Ingredient, number>();
  for (const id of dish) m.set(id, (m.get(id) ?? 0) + 1);
  return m;
}

/**
 * So ổ bánh đã làm với đơn đã gọi.
 * CANON §6: nhiều lỗi cùng lúc chỉ được NÓI RA một lỗi, phần còn lại vẫn trừ tiền ngầm.
 */
export function diffDish(spec: OrderSpec, dish: Ingredient[]): Defect[] {
  const got = portionsOf(dish);
  const out: Defect[] = [];

  for (const ing of INGREDIENTS) {
    const want = spec.levels[ing.id];
    const have = got.get(ing.id) ?? 0;
    const heavy = ing.kind === "nhan";

    if (want === undefined) {
      // khách không nói tới: thêm nhân mặn lạ là sai món, thêm rau/sốt thì không sao
      if (have > 0 && heavy) {
        out.push({ kind: "unwanted", item: ing.id, weight: 2, text: `có ${ing.label}` });
      }
      continue;
    }
    if (want === 0 && have > 0) {
      out.push({ kind: "forbidden", item: ing.id, weight: 3, text: `có ${ing.label}` });
    } else if (want > 0 && have === 0) {
      out.push({ kind: "missing", item: ing.id, weight: heavy ? 3 : 1, text: `thiếu ${ing.label}` });
    } else if (have < want) {
      out.push({ kind: "under", item: ing.id, weight: want - have >= 2 ? 2 : 1, text: `ít ${ing.label} quá` });
    } else if (have > want) {
      // Cho THÊM MỘT PHẦN đồ chua / ớt / tương / ngò không phải lỗi — đó là hào phóng,
      // và CANON §3.2 xếp `FREE_EXTRA` vào nhóm sự kiện TÍCH CỰC. Từ hai phần trở lên
      // thì hết là hào phóng, thành ẩu. Thứ khách đã CẤM thì bao nhiêu cũng là lỗi,
      // nhánh `want === 0` ở trên đã chặn rồi.
      const generous = NICETY.has(ing.id) && have - want === 1;
      if (!generous) {
        out.push({ kind: "over", item: ing.id, weight: have - want >= 2 ? 2 : 1, text: `nhiều ${ing.label} quá` });
      }
    }
  }

  if (dish.length > CAPACITY) {
    out.push({ kind: "stuffed", item: null, weight: 2, text: "ổ bánh nhồi chặt quá, kẹp không lại" });
  }
  return out.sort((a, b) => b.weight - a.weight);
}

/**
 * Cho thêm bao nhiêu phần đồ "dễ thương" so với mức khách xin.
 * Chỉ tính khi ổ bánh không có lỗi nào — hào phóng trên một ổ làm sai thì không
 * phải là hào phóng, là chống chế.
 */
export function generosityOf(spec: OrderSpec, dish: Ingredient[]) {
  const got = portionsOf(dish);
  let extra = 0;
  for (const id of NICETY) {
    const want = spec.levels[id] ?? 0;
    extra += Math.max(0, (got.get(id) ?? 0) - want);
  }
  return extra;
}
