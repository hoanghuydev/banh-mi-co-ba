/**
 * TRUY HỒI KÝ ỨC — mô hình Park et al., *Generative Agents* (arXiv:2304.03442).
 *
 *   score(m) = w_r·recency(m) + w_i·importance(m) + w_v·relevance(m, chủ đề)
 *
 * `sim/memory.ts` đã có hai trong ba thành phần (`currentIntensity` = importance, decay theo lần
 * ghé bị lỡ = recency); thiếu **relevance** và **một hàm truy hồi** — và thiếu hai ô đó giải
 * thích trọn vẹn 26 chỗ "nhớ nhầm chuyện chưa từng xảy ra".
 *
 * BA CHỖ CỐ Ý LỆCH khỏi bài báo, đều về phía rẻ hơn / đọc được hơn:
 *  1. recency đếm LẦN GHÉ BỊ LỠ, không đếm giờ — chỉ mượn hình dạng `0,995^n`
 *  2. relevance bằng khớp THẺ (Jaccard), không cosine embedding: kho ký ức một người là 6–8 slot
 *     nên quét tuyến tính rẻ hơn, và người thiết kế ĐỌC RA ĐƯỢC vì sao nó chọn cái đó
 *  3. trọng số theo TỪNG NGƯỜI, suy thẳng từ bốn chiều tính cách — không thêm núm nào cho tune
 *
 * ⚠️ LUẬT CỨNG: nội dung không được GỌI TÊN một chuyện cũ, chỉ được NHẬN một chuyện cũ. Truy hồi
 * trả rỗng ⇒ `m.remembers` sai ⇒ câu đó KHÔNG TỒN TẠI. Luật này không sửa 26 nút nhớ nhầm — nó
 * làm cho nút thứ 27 không viết ra được.
 */
import type { Personality } from "../content/npcs";
import { SALIENCE_OF, currentIntensity, type BaseKind, type Memory, type RelState } from "./memory";

/**
 * Hệ số suy giảm — mỗi LẦN GHÉ, không phải mỗi giờ.
 *
 * ⚠️ CỐ Ý KHÁC con số của bài báo: `0,995` của Park et al. là suy giảm mỗi GIỜ mô phỏng, chép
 * thẳng sang thang NGÀY thì cả dải chỉ còn rộng 1% và recency thành một con số không bao giờ đổi
 * được thứ hạng.
 *
 * `0,995^24 ≈ 0,887` là đúng một ngày của bài báo; `0,88` mỗi LẦN GHÉ cho đường cong đọc được:
 * 5 lần ghé còn 0,53 · 10 lần còn 0,28.
 */
export const RECENCY_DECAY = 0.88;

export type Weights = { recency: number; importance: number; relevance: number };

/**
 * Trọng số suy từ tính cách — P2-09 §2.4 ghi chú 3.
 *
 * `deTha` cao = dễ bỏ qua = chuyện cũ phai nhanh ⇒ nặng *recency*, nhẹ *importance*.
 * `soi` cao = để ý từng chi tiết ⇒ nặng *relevance*: họ nhớ đúng chuyện đang nói tới,
 * không nhớ chuyện to nhất.
 */
export function weightsOf(p: Personality): Weights {
  return {
    recency: 0.6 + 0.8 * p.deTha,
    importance: 1.4 - 0.8 * p.deTha,
    relevance: 0.7 + 0.8 * p.soi,
  };
}

/**
 * THẺ của một ký ức. Không có trường nào mới trong save: suy từ `kind` + `detail` + tầng.
 *
 * Giữ nghèo cố ý — mỗi thẻ phải là một chữ người viết nội dung gõ được vào `about` của
 * một topic mà không phải tra bảng.
 */
export function tagsOf(m: Memory): Set<string> {
  const out = new Set<string>();
  out.add(m.kind);
  const base = m.kind.startsWith("HEALED_") ? m.kind.slice("HEALED_".length) : m.kind;
  out.add(base);
  out.add(m.valence < 0 ? "XAU" : "TOT");
  if (m.tier === "CORE") out.add("CODE");
  if (m.detail?.missingIngredient) out.add(`MON_${m.detail.missingIngredient}`);
  if (m.detail?.wrongNameUsed) out.add("TEN");
  // Nhóm theo CHỦ ĐỀ, không theo cơ chế: người ta nhớ "nó làm mình đợi", không nhớ
  // "sự kiện salience 100". Đây là tầng duy nhất người viết nội dung phải học.
  if (base === "MADE_THEM_WAIT") out.add("CHO_DOI");
  if (base === "BURNT_OR_COLD" || base === "ORDER_DEFECT") out.add("O_BANH");
  if (base === "DROPPED_FOOD" || base === "DIRTY_HANDS") out.add("SACH_SE");
  if (base === "RUDE_TO_THEM" || base === "BROKEN_PROMISE") out.add("LOI_NOI");
  if (base === "REMEMBERED_USUAL" || base === "REMEMBERED_STORY") out.add("DUOC_NHO");
  if (base === "CARED_FOR_THEM" || base === "FREE_EXTRA" || base === "FLOURISH") out.add("TU_TE");
  return out;
}

/** Giao / hợp. Hai tập rỗng ⇒ 0, không phải 1 — "không nói về gì cả" không khớp với gì cả. */
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Một ký ức đã được truy hồi, kèm lý do — overlay dev `rule.why` in thẳng cái này ra. */
export type Recalled = {
  memory: Memory;
  score: number;
  parts: { recency: number; importance: number; relevance: number };
  /** Một dòng tiếng Việt điền vào `{m.what}` của nội dung. */
  what: string;
};

/**
 * Chuyện này đọc ra thành câu nói thế nào — `{m.what}` của nội dung lấy từ đây.
 *
 * Người viết KHÔNG được gõ mấy chữ này vào file thoại: đó đúng là cái bẫy cũ (viết "chuyện
 * thằng con" rồi mong là có chuyện thằng con). Bảng nằm đây vì nó phải khớp 1–1 với
 * `BaseKind`, và trình kiểm kiểu bắt được chỗ thiếu.
 */
const WHAT: Record<BaseKind, string> = {
  WRONG_NAME: "cái vụ {me} kêu lộn tên",
  MADE_THEM_WAIT: "bữa {call} đứng chờ lâu",
  BURNT_OR_COLD: "ổ bánh bữa đó",
  DROPPED_FOOD: "cái vụ rớt ổ bánh",
  ORDER_DEFECT: "ổ hôm bữa làm trật",
  DIRTY_HANDS: "cái vụ tay {me} chưa rửa",
  RUDE_TO_THEM: "câu {me} lỡ nói bữa trước",
  BROKEN_PROMISE: "cái {me} hứa mà chưa làm",
  MISSED_EXTRA: "bữa nay {me} quên bỏ thêm",
  REMEMBERED_USUAL: "cái món {call} hay ăn",
  REMEMBERED_STORY: "chuyện {call} kể bữa trước",
  CARED_FOR_THEM: "bữa {me} rót cho {call} ly trà",
  FREE_EXTRA: "miếng {me} bỏ thêm bữa đó",
  FLOURISH: "cái kiểu {me} gói bữa trước",
};

function whatOf(m: Memory): string {
  const base = (m.kind.startsWith("HEALED_") ? m.kind.slice("HEALED_".length) : m.kind) as BaseKind;
  return WHAT[base] ?? "chuyện bữa trước";
}

/**
 * GIỜ NÊN NHỚ CHUYỆN GÌ.
 *
 * `about` là tập thẻ của chủ đề đang hỏi; rỗng = "nhớ gì cũng được" và lúc đó relevance
 * bị bỏ khỏi tổng (không phải tính bằng 0 — bằng 0 sẽ làm cả ba trọng số lệch).
 *
 * `missedVisits` = số LẦN GHÉ đã trôi qua kể từ ký ức đó, do `Service` đưa vào. Không
 * tính trong này vì `RelState` không giữ lịch sử lần ghé; nó chỉ giữ `visits`.
 *
 * Gọi lúc dựng topic, KHÔNG gọi trong vòng vẽ.
 */
export function retrieve(
  s: RelState, p: Personality, day: number,
  about: ReadonlySet<string>, k = 3,
): Recalled[] {
  const w = weightsOf(p);
  const useRelevance = about.size > 0;
  const out: Recalled[] = [];
  for (const m of [...s.memory.short, ...s.memory.long, ...(s.memory.core ? [s.memory.core] : [])]) {
    const age = Math.max(0, day - m.dayLastReinforced);
    // Đếm theo NGÀY ở đây, nhưng thang thì của lần ghé: `visitsPerDay` quy đổi cho người
    // ghé thưa. Người ghé mỗi ngày thì hai thang trùng nhau — và họ là đa số.
    const recency = Math.pow(RECENCY_DECAY, age * visitsPerDay(s, day));
    const importance = currentIntensity(m, day, p) / 100;
    const relevance = useRelevance ? jaccard(tagsOf(m), about as Set<string>) : 0;
    // Khớp thẻ bằng 0 trong khi ĐANG hỏi một chủ đề = chuyện này không liên quan. Bỏ hẳn,
    // không để nó thắng bằng mỗi importance — đó đúng là cách sinh ra "nhớ nhầm".
    if (useRelevance && relevance === 0) continue;
    const score = w.recency * recency + w.importance * importance
      + (useRelevance ? w.relevance * relevance : 0);
    out.push({ memory: m, score, parts: { recency, importance, relevance }, what: whatOf(m) });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, k);
}

/**
 * Người này ghé dày cỡ nào — để quy "ngày trôi qua" thành "lần ghé trôi qua".
 *
 * Trần 1,5 và sàn 0,25: người ghé ba lần một ngày không được quên nhanh gấp ba, và người
 * cả mùa ghé hai lần không được nhớ như mới hôm qua.
 */
function visitsPerDay(s: RelState, day: number): number {
  return Math.max(0.25, Math.min(1.5, s.visits / Math.max(1, day)));
}

/**
 * Chuyện ĐÁNG nhắc lại không — ngưỡng để `m.remembers` bật.
 *
 * Không phải mọi ký ức đều đáng lôi ra giữa lúc bán hàng: một `FLOURISH` salience 15 từ
 * tuần trước không phải chuyện để mở lời. Ngưỡng tính theo salience gốc của kind nhân với
 * điểm truy hồi, nên một chuyện nhỏ vẫn lên được nếu nó rất mới và rất đúng chủ đề.
 */
export const RECALL_FLOOR = 0.45;

export function worthMentioning(r: Recalled): boolean {
  const base = (r.memory.kind.startsWith("HEALED_")
    ? r.memory.kind.slice("HEALED_".length) : r.memory.kind) as BaseKind;
  return r.score * (0.5 + (SALIENCE_OF[base] ?? 50) / 100) >= RECALL_FLOOR;
}

// ───────────────────────────────────────── reflection (P2-09 §2.4)

/**
 * KẾT LUẬN RÚT RA CUỐI NGÀY — bản không-LLM của *reflection* (Park et al. §4.2).
 *
 * Bài báo cho agent tự đặt ba câu hỏi rồi viết câu trả lời ngược vào dòng ký ức, khi tổng
 * `importance` của sự kiện mới vượt **ngưỡng 150**. Ở đây không có LLM và cũng không cần:
 * cái đáng lấy là **hình dạng** — một ký ức DẪN XUẤT, nói về một MẪU chứ không về một
 * lần, và nó cũng truy hồi được như mọi ký ức khác.
 *
 * Vì sao đáng làm: nếu không có nó thì sau bốn mươi ngày một người chỉ có một chồng sự
 * kiện rời. Có nó thì họ nhắc lại được một **kết luận** — *"cô này hay quên bỏ đồ chua"* —
 * và đó mới là thứ đọc ra là một mùa có tích luỹ.
 *
 * Ba mẫu, viết tay, KHÔNG sinh chữ. Mỗi mẫu đòi một MẪU HÌNH thật trong kho ký ức, nên
 * một kết luận sai không ra được: nó nặng hơn một sự kiện sai (`§7` rủi ro).
 */
export const REFLECT_THRESHOLD = 150;
export const REFLECT_MIN_OCCURRENCES = 3;

export type Reflection = { kind: BaseKind; intensity: number; note: string };

/**
 * Hôm nay người này có rút ra kết luận gì không. Gọi MỘT lần lúc đóng cửa, trước `nightly()`.
 *
 * Trả `null` là đa số, và đó là đúng: bài báo ra 2–3 lần mỗi ngày mô phỏng cho một agent
 * sống trọn ngày; ở đây một người ghé quầy mười lăm phút, nên vài ngày mới có một lần.
 */
export function reflect(s: RelState, day: number): Reflection | null {
  const all = [...s.memory.short, ...s.memory.long];
  /*
   * CỘNG DỒN TỪ LẦN RÚT TRƯỚC, không cộng trong một ngày.
   *
   * Bài báo đếm "từ lần phản tỉnh gần nhất" và ra 2–3 lần mỗi ngày mô phỏng — nhưng agent
   * của họ sống trọn một ngày, còn người ở đây ghé quầy mười lăm phút. Đo thử với mốc
   * một-ngày: **4 lần cho cả mười hai người suốt bốn mươi ngày**, tức cơ chế coi như
   * không tồn tại. Cộng dồn từ mốc thì nó ra đúng nhịp "vài ngày một lần".
   */
  const since = s.reflectedDay ?? 0;
  const fresh = all.filter((m) => m.dayLastReinforced > since);
  const weight = fresh.reduce((a, m) => a + m.intensity0, 0);
  if (weight < REFLECT_THRESHOLD) return null;
  s.reflectedDay = day;

  // MẪU 1 — cùng một lỗi lặp lại: đây là cái người ta gọi tên thành một THÓI QUEN.
  const byKind = new Map<BaseKind, number>();
  for (const m of all) {
    const base = (m.kind.startsWith("HEALED_") ? m.kind.slice(7) : m.kind) as BaseKind;
    byKind.set(base, (byKind.get(base) ?? 0) + m.occurrences);
  }
  for (const [kind, n] of byKind) {
    if (n < REFLECT_MIN_OCCURRENCES) continue;
    if (SALIENCE_OF[kind] === undefined) continue;
    const xau = fresh.some((m) => m.valence < 0);
    return {
      kind: xau ? "RUDE_TO_THEM" : "REMEMBERED_STORY",
      intensity: Math.min(100, 30 + 8 * n),
      note: `${HABIT[kind] ?? "cái kiểu đó"} — ${n} lần rồi`,
    };
  }

  // MẪU 2 — một ngày toàn chuyện tốt mà không có chuyện xấu nào: người ta tin.
  if (fresh.length >= 2 && fresh.every((m) => m.valence > 0)) {
    return { kind: "REMEMBERED_STORY", intensity: 45, note: "con nhỏ này được" };
  }

  // MẪU 3 — một chuyện nặng chưa được chuộc: người ta để ý chừng.
  const nang = fresh.find((m) => m.valence < 0 && m.intensity0 >= 75 && m.redeemPaid <= 0);
  if (nang) return { kind: "RUDE_TO_THEM", intensity: 50, note: "để ý chút" };

  return null;
}

/** Một câu gọi tên THÓI QUEN, không gọi tên một lần. Dùng cho `note` của reflection. */
const HABIT: Partial<Record<BaseKind, string>> = {
  ORDER_DEFECT: "hay làm trật đơn",
  MISSED_EXTRA: "hay quên bỏ thêm",
  MADE_THEM_WAIT: "hay bắt đứng chờ",
  BURNT_OR_COLD: "ổ hay bị nguội",
  DIRTY_HANDS: "hay quên rửa tay",
  DROPPED_FOOD: "hay làm rớt",
  WRONG_NAME: "hay kêu lộn tên",
  BROKEN_PROMISE: "hứa rồi hay quên",
  REMEMBERED_USUAL: "nhớ món của mình",
  CARED_FOR_THEM: "để ý tới mình",
  FREE_EXTRA: "hay cho thêm",
  FLOURISH: "làm khéo tay",
};
