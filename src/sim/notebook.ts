/**
 * Sổ tay của chính người bán — P2-05. Mặt phẳng để người chơi NHẬN RA hệ thống (bài học
 * Oblivion, mô hình Bombers' Notebook). Logic thuần, không DOM, không Phaser.
 *
 * MỘT GIỌNG: quán là của người chơi, nên mọi dòng chữ trong đây là chữ của chính họ. Không
 * có nhân vật nào ghi giùm — cô Ba chỉ ở màn mở đầu (P4-06).
 *
 * PHÂN CHIA LAO ĐỘNG TUYỆT ĐỐI (§2.2) — mỗi ô chỉ một bên được đụng:
 *   cột TRÁI  = máy viết dữ liệu thô đã xảy ra · chỉ đọc · append-only · ĐÚNG 6 trường
 *   cột PHẢI  = người chơi viết diễn giải · sửa/xoá tự do · máy KHÔNG BAO GIỜ ghi vào
 *
 * Cột trái tuyệt đối không ghi: con số quan hệ (T3) · đúng/sai (T1) · suy luận · dự báo.
 * Giả thuyết KHÔNG có trạng thái sai — sai thì không có gì xảy ra hết (§2.3).
 */
import type { NpcId } from "../core/types";
import { NPCS, type NpcDef } from "../content/npcs";
import { INGREDIENTS, type Ingredient } from "./order";
import { weekdayOf, type Weekday } from "./schedule";
import SO_TAY from "../content/lines/so-tay.json";
import { ShuffleBag, type BagState, type Rng } from "../core/rng";
import type { GossipState } from "./gossip";
import type { RelState } from "./memory";

// ─────────────────────────────────────────────────────────────── cột trái

export type RawNote =
  | { t: "EAVESDROP"; claim: string; source?: NpcId }
  | { t: "ABSENT_STREAK"; missed: number }
  | { t: "FIRST_VISIT" }
  | { t: "SAID_SOMETHING"; text: string };

export type LogEntry = {
  day: number;
  minute: number;
  npcId: NpcId | "KHACH_LA";
  orderText: string;
  visitCount: number;
  note?: RawNote;
};

// ─────────────────────────────────────────────────────────────── cột phải

export type HypothesisSlot = "HAY_AN" | "KHONG_AN_DUOC" | "THUONG_GHE" | "NGAY_TRONG_TUAN" | "LAM_NGHE" | "TINH_Y";
export const SLOTS: readonly HypothesisSlot[] = ["HAY_AN", "KHONG_AN_DUOC", "THUONG_GHE", "NGAY_TRONG_TUAN", "LAM_NGHE", "TINH_Y"];
export const SLOT_LABEL: Record<HypothesisSlot, string> = {
  HAY_AN: "hay ăn", KHONG_AN_DUOC: "không ăn", THUONG_GHE: "thường ghé", NGAY_TRONG_TUAN: "ngày nào ghé",
  LAM_NGHE: "làm nghề", TINH_Y: "tính ý",
};

export type Hypothesis = {
  slot: HypothesisSlot;
  value: string;
  dayGuessed: number;
  /** KHÔNG CÓ 'WRONG'. */
  state: "OPEN" | "CONFIRMED";
  dayConfirmed?: number;
  dayChanged: number;
};

export type NpcPage = {
  name: string;
  freeLines: string;
  hypotheses: Hypothesis[];
  vignetteUnlocked: boolean;
  firstSeenDay: number;
  pinned: boolean;
};

export type EveningNote = { day: number; lines: string[]; confirmations: { npcId: NpcId; slot: HypothesisSlot; line: string }[] };

export type Notebook = {
  log: LogEntry[];
  pages: Record<NpcId, NpcPage>;
  eveningNotes: EveningNote[];
  landmarkTier: 0 | 1 | 2 | 3 | 4;
  met: NpcId[];
  today: DayFacts;
};

export type DayFacts = {
  day: number;
  dropped: number;
  /**
   * DẤU VẾT CỦA ĐÔI TAY HÔM NAY — bốn con số dưới đây KHÔNG dùng để chấm điểm.
   *
   * Trang Đồ nghề ở màn tối lấy chúng ra để nói *"bữa nay con bốc nhân bằng tay sáu lần"*
   * ngay dưới cái kẹp gắp chưa mua. Luật P3-04 §4 cấm hiện con số HIỆU ỨNG CỦA MÓN ĐỒ —
   * nó không cấm nhắc lại chuyện vừa xảy ra với chính người chơi, và đó là khác biệt giữa
   * "món này +18%" (cấm) với "bữa nay cháy ba ổ" (chuyện của mình).
   *
   * Chỉ đếm thứ NGƯỜI CHƠI tự thấy được: tay mình làm gì, ổ nào cháy, ai lên tiếng về tay
   * mình. KHÔNG đếm người đi ngang không ghé — người đứng bán không có cách nào biết con số
   * đó, và `Service.balkedCount` cố ý không cho màn tối đọc vì đúng lý do này.
   */
  bareHands: number;
  wipes: number;
  burnt: number;
  handsSeen: number;
  served: number;
  lost: number;
  newFaces: number;
  strangers: number;
  firstUsual: NpcId[];
  healed: NpcId[];
  heardBad: boolean;
  heardGood: boolean;
  visitors: NpcId[];
  usualServed: NpcId[];
  cleanServedFront: NpcId[];
  served_: Record<NpcId, { minute: number; dish: Ingredient[] }[]>;
};

export const newDayFacts = (day: number): DayFacts => ({
  day, dropped: 0, bareHands: 0, wipes: 0, burnt: 0, handsSeen: 0,
  served: 0, lost: 0, newFaces: 0, strangers: 0, firstUsual: [], healed: [], heardBad: false, heardGood: false,
  visitors: [], usualServed: [], cleanServedFront: [], served_: {},
});

export const newNotebook = (): Notebook => ({ log: [], pages: {}, eveningNotes: [], landmarkTier: 0, met: [], today: newDayFacts(1) });

export const MAX_OPEN_HYPOTHESES = 5;
export const VIGNETTE_AT = 3;

const NPC = new Map<string, NpcDef>(NPCS.map((n) => [n.id, n]));

// ─────────────────────────────────────────────────────────────── tên

/**
 * Tên "chìa" để so tên người chơi ghi với tên thật. Tiếng Việt: Bảy / Bảo / Sáu chỉ khác
 * nhau ở DẤU — so có dấu, không bỏ dấu.
 */
const KEY: Record<string, string> = {
  BA_BAY: "bảy", CHU_TU: "tư", ANH_DUNG: "dũng", CHI_LAN: "lan", BE_SU: "su", ONG_HAI: "hải",
  CO_MAI: "mai", THAY_PHUC: "phúc", CHI_HANH: "hạnh", ANH_BAO: "bảo", BA_SAU: "sáu", CHU_KIET: "kiệt",
};
const words = (s: string) => s.normalize("NFC").toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);

/**
 * Người chơi gọi khách bằng tên đã ghi trong sổ. `null` = chưa ghi (không gọi tên — trung
 * tính). `false` = gọi SAI (có tên người khác, hoặc không có tên của chính người này).
 */
export function nameCheck(nb: Notebook, npcId: NpcId): boolean | null {
  const written = nb.pages[npcId]?.name?.trim();
  if (!written || !KEY[npcId]) return null;
  const w = words(written);
  if (!w.includes(KEY[npcId])) return false;
  return !Object.entries(KEY).some(([id, k]) => id !== npcId && k !== KEY[npcId] && w.includes(k));
}

/**
 * TÊN SỔ TỰ GỌI — tên người chơi đã ghi, chưa ghi thì gọi bằng `asName`.
 *
 * Cuốn sổ là chữ của chính người bán (P2-05b §3), nên nó KHÔNG được gọi đúng tên một người
 * mà cô ấy chưa học được: vừa vỡ fiction, vừa phát không cái tên mà `nameCheck`/WRONG_NAME
 * đang bắt người chơi phải nghe ra. Hồi cuốn sổ còn là của cô Ba thì dùng tên thật được —
 * bả biết cả hẻm. Giờ thì không.
 *
 * ⚠️ Khác `displayName` (trả `—`): chỗ này đi vào GIỮA CÂU, nên phải là một cụm gọi được.
 */
export function penName(nb: Notebook | undefined, npcId: NpcId): string {
  const written = nb?.pages[npcId]?.name?.trim();
  return written || NPC.get(npcId)?.asName || "người ta";
}

export function displayName(nb: Notebook | undefined, npcId: NpcId, fallback: string) {
  if (!NPC.has(npcId)) return fallback;
  return nb?.pages[npcId]?.name?.trim() || "—";
}

// ─────────────────────────────────────────────────────────────── ghi nhật ký

export function page(nb: Notebook, id: NpcId, day: number): NpcPage {
  return (nb.pages[id] ??= { name: "", freeLines: "", hypotheses: [], vignetteUnlocked: false, firstSeenDay: day, pinned: false });
}

export function beginDay(nb: Notebook, day: number) {
  if (nb.today.day !== day) nb.today = newDayFacts(day);
}

export function logOrder(nb: Notebook, e: { day: number; minute: number; npcId: NpcId | null; orderText: string; visitCount: number }) {
  beginDay(nb, e.day);
  const id = e.npcId ?? "KHACH_LA";
  let note: RawNote | undefined;
  if (e.npcId) {
    if (!nb.met.includes(e.npcId)) { nb.met.push(e.npcId); nb.today.newFaces++; note = { t: "FIRST_VISIT" }; page(nb, e.npcId, e.day); }
    if (!nb.today.visitors.includes(e.npcId)) nb.today.visitors.push(e.npcId);
  } else nb.today.strangers++;
  nb.log.push({ day: e.day, minute: Math.round(e.minute), npcId: id, orderText: e.orderText, visitCount: e.visitCount, ...(note ? { note } : {}) });
}

export function logNote(nb: Notebook, day: number, minute: number, npcId: NpcId | "KHACH_LA", note: RawNote) {
  nb.log.push({ day, minute: Math.round(minute), npcId, orderText: "", visitCount: 0, note });
}

// ─────────────────────────────────────────────────────────────── giả thuyết

const BANDS = [[360, 390], [390, 420], [420, 450], [450, 480], [480, 540], [540, 600], [600, 660]] as const;
const bandId = (m: number) => { const b = BANDS.find(([a, z]) => m >= a && m < z) ?? BANDS[BANDS.length - 1]; return `${b[0]}_${b[1]}`; };
export const bandLabel = (id: string) => { const [a, z] = id.split("_").map(Number); const f = (x: number) => `${Math.floor(x / 60)}h${x % 60 ? String(x % 60).padStart(2, "0") : ""}`; return `${f(a)}–${f(z)}`; };

const WEEK_PATTERNS: Record<string, { label: string; days: readonly Weekday[] }> = {
  hang_ngay: { label: "ngày nào cũng ghé", days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] },
  t2_t6: { label: "thứ Hai tới thứ Sáu", days: ["MON", "TUE", "WED", "THU", "FRI"] },
  t2_t7: { label: "thứ Hai tới thứ Bảy", days: ["MON", "TUE", "WED", "THU", "FRI", "SAT"] },
  vai_ngay: { label: "vài ngày trong tuần", days: [] },
};
const TINH_Y: Record<string, string> = { de_y_ky: "để ý kỹ", xue_xoa: "xuề xoà" };

export function valueLabel(slot: HypothesisSlot, v: string): string {
  if (slot === "HAY_AN" || slot === "KHONG_AN_DUOC") return INGREDIENTS.find((i) => i.id === v)?.label ?? v;
  if (slot === "THUONG_GHE") return bandLabel(v);
  if (slot === "NGAY_TRONG_TUAN") return WEEK_PATTERNS[v]?.label ?? v;
  if (slot === "TINH_Y") return TINH_Y[v] ?? v;
  return v;
}

/**
 * Danh sách lựa chọn — CHỈ những gì người chơi ĐÃ GẶP (§2.3 luật chống brute-force 1):
 * danh sách lớn dần đúng theo hiểu biết của người chơi. Nó là thanh tiến trình không số.
 */
/** Giá trị đang đoán ở ô NGƯỢC LẠI (`hay ăn` ↔ `không ăn`), kể cả đã xác nhận. */
function opposite(nb: Notebook, npcId: NpcId, slot: HypothesisSlot): string | null {
  if (slot !== "HAY_AN" && slot !== "KHONG_AN_DUOC") return null;
  const other: HypothesisSlot = slot === "HAY_AN" ? "KHONG_AN_DUOC" : "HAY_AN";
  return nb.pages[npcId]?.hypotheses.find((h) => h.slot === other)?.value ?? null;
}

export function options(nb: Notebook, npcId: NpcId, slot: HypothesisSlot): string[] {
  const mine = nb.log.filter((e) => e.npcId === npcId && e.orderText);
  if (!mine.length) return [];
  if (slot === "HAY_AN" || slot === "KHONG_AN_DUOC") {
    const said = new Set<string>();
    for (const e of nb.log) if (e.orderText) for (const ing of INGREDIENTS) if (e.orderText.includes(ing.label)) said.add(ing.id);
    // Hai ô này NGƯỢC NHAU: `truth` đòi `usual >= 2` cho ô này và `usual === 0` cho ô kia,
    // nên "hay ăn ớt" + "không ăn ớt" là một câu tự mâu thuẫn — KHÔNG BAO GIỜ xác nhận
    // được cái nào. Mà giả thuyết sai thì cố ý im lặng (§2.3), nên người chơi sẽ không bao
    // giờ biết, và hai ô đó ngồi ăn mất hai trong năm chỗ đoán cho tới hết mùa.
    const taken = opposite(nb, npcId, slot);
    return INGREDIENTS.map((i) => i.id).filter((id) => said.has(id) && id !== taken);
  }
  if (slot === "THUONG_GHE") return [...new Set(mine.map((e) => bandId(e.minute)))];
  if (slot === "NGAY_TRONG_TUAN") return mine.length >= 3 ? Object.keys(WEEK_PATTERNS) : [];
  if (slot === "TINH_Y") return mine.length >= 2 ? Object.keys(TINH_Y) : [];
  return mine.length >= 2 ? [...new Set(nb.met.map((id) => NPC.get(id)?.role).filter((r): r is string => !!r))] : [];
}

export function guess(nb: Notebook, npcId: NpcId, slot: HypothesisSlot, value: string, day: number): string | null {
  const p = page(nb, npcId, day);
  // Chặn ở ĐÂY nữa chứ không chỉ ở `options`: save cũ có thể đã lỡ đoán ngược nhau, và
  // "chưa gặp điều này" là một lý do SAI cho trường hợp đó — người chơi gặp rồi, chỉ là
  // đang đoán ngược ở ô bên kia.
  if (opposite(nb, npcId, slot) === value) {
    const other = slot === "HAY_AN" ? "KHONG_AN_DUOC" : "HAY_AN";
    return `ô "${SLOT_LABEL[other]}" đang đoán ${valueLabel(slot, value)} — xoá ô đó trước`;
  }
  if (!options(nb, npcId, slot).includes(value)) return "chưa gặp điều này ở người này";
  const h = p.hypotheses.find((x) => x.slot === slot);
  if (h) {
    if (h.state === "CONFIRMED") return "Đã xác nhận — không đổi được";
    if (h.value === value) return null;
    if (h.dayChanged === day) return "mỗi ngày chỉ đổi được một lần · mai đổi lại";
    h.value = value; h.dayChanged = day; h.dayGuessed = day;
    return null;
  }
  if (p.hypotheses.filter((x) => x.state === "OPEN").length >= MAX_OPEN_HYPOTHESES) return `đang đoán ${MAX_OPEN_HYPOTHESES} điều · hết chỗ — xoá bớt một ô`;
  p.hypotheses.push({ slot, value, dayGuessed: day, state: "OPEN", dayChanged: day });
  return null;
}

export function unguess(nb: Notebook, npcId: NpcId, slot: HypothesisSlot) {
  const p = nb.pages[npcId];
  if (p) p.hypotheses = p.hypotheses.filter((h) => h.slot !== slot || h.state === "CONFIRMED");
}

function truth(npc: NpcDef, usual: Partial<Record<Ingredient, number>>, slot: HypothesisSlot, v: string): boolean {
  switch (slot) {
    case "HAY_AN": return (usual[v as Ingredient] ?? 0) >= 2;
    case "KHONG_AN_DUOC": return (usual[v as Ingredient] ?? 0) === 0;
    case "THUONG_GHE": { const [a, z] = v.split("_").map(Number); return npc.schedule.some((r) => r.arriveMin >= a - 5 && r.arriveMin < z + 5); }
    case "NGAY_TRONG_TUAN": {
      const days = new Set(npc.schedule.flatMap((r) => r.days));
      const want = WEEK_PATTERNS[v]?.days ?? [];
      if (v === "vai_ngay") return days.size <= 4;
      return want.length === days.size && want.every((d) => days.has(d));
    }
    case "TINH_Y": return v === "de_y_ky" ? npc.personality.soi >= 0.6 : npc.personality.soi < 0.5;
    case "LAM_NGHE": return npc.role === v;
  }
}

/**
 * `wasDemonstratedToday` — trái tim của cơ chế (§2.3): đoán không đủ, phải DÙNG cái mình
 * đoán ở quầy. Không bấm để thắng; bấm để nói ra điều mình tin, rồi ra quầy làm theo nó.
 */
function demonstrated(nb: Notebook, npcId: NpcId, slot: HypothesisSlot, v: string, day: number): boolean {
  const t = nb.today;
  if (t.day !== day) return false;
  const served = t.served_[npcId] ?? [];
  if (!served.length) return false;
  switch (slot) {
    case "HAY_AN": return t.usualServed.includes(npcId) && served.some((s) => s.dish.includes(v as Ingredient));
    case "KHONG_AN_DUOC": return served.some((s) => !s.dish.includes(v as Ingredient)) && t.cleanServedFront.includes(npcId);
    case "THUONG_GHE": { const [a, z] = v.split("_").map(Number); return served.some((s) => s.minute >= a && s.minute < z + 15); }
    case "NGAY_TRONG_TUAN": return (WEEK_PATTERNS[v]?.days ?? []).includes(weekdayOf(day)) || v === "vai_ngay";
    case "TINH_Y": case "LAM_NGHE": return t.cleanServedFront.includes(npcId);
  }
}

export type Confirmation = { npcId: NpcId; slot: HypothesisSlot };

export function checkHypotheses(nb: Notebook, day: number, usualOf: (id: NpcId) => Partial<Record<Ingredient, number>>): Confirmation[] {
  const out: Confirmation[] = [];
  for (const [id, p] of Object.entries(nb.pages)) {
    const npc = NPC.get(id);
    if (!npc) continue;
    for (const h of p.hypotheses) {
      if (h.state !== "OPEN") continue;
      if (!truth(npc, usualOf(id), h.slot, h.value)) continue;
      if (!demonstrated(nb, id, h.slot, h.value, day)) continue;
      h.state = "CONFIRMED"; h.dayConfirmed = day;
      out.push({ npcId: id, slot: h.slot });
    }
    if (!p.vignetteUnlocked && p.hypotheses.filter((h) => h.state === "CONFIRMED").length >= VIGNETTE_AT) p.vignetteUnlocked = true;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────── trang cuối ngày


type NoteDef = { priority: number; concept: string; variants: string[]; speakonce?: boolean };
const ST = SO_TAY as unknown as {
  notes: Record<string, NoteDef>;
  confirm: Record<HypothesisSlot, string[]>;
  quanHe: Record<RelReadState, string[]>;
};
export const NOTE_RULES = ST.notes;
export const CONFIRM_LINES = ST.confirm;

const mid = (name: string) => name.charAt(0).toLowerCase() + name.slice(1);
const fill = (s: string, name: string, value = "") => {
  const out = s.replace(/\{name\}/g, (_m, i: number) => (i === 0 ? name : mid(name))).replace(/\{value\}/g, value);
  return out.charAt(0).toUpperCase() + out.slice(1);
};

// ──────────────────────────────────────────────── đọc quan hệ (P2-05b)

/**
 * ĐỘ HIỂU — thước đo NGƯỜI CHƠI, không phải thước đo NPC.
 *
 * Đếm giả thuyết đã `CONFIRMED`: tức là đếm những điều người chơi ĐOÁN ĐÚNG và đã CHỨNG
 * MINH bằng tay ở quầy. T3 cấm hiện chỉ số *quan hệ*; con số này không dẫn một chút nào
 * từ `relationPoints`, nên nó không phải cái T3 đang canh. Trang sổ vốn đã hiện
 * `đang đoán 2/5` ngay dưới ô Cô đoán — đây là cùng một loại số.
 *
 * ⚠️ `total` trả ra để chỗ gọi hiện CẢ Ô TRỐNG (`○○○`), không chỉ hiện phần đã điền:
 * vòng lặp chưa đóng mới là thứ kéo người chơi ra quầy để ý tiếp (§4 — Zeigarnik).
 */
export type Known = { done: number; total: number; vignette: boolean };

export function knownOf(nb: Notebook, id: NpcId): Known {
  const p = nb.pages[id];
  return {
    done: p ? p.hypotheses.filter((h) => h.state === "CONFIRMED").length : 0,
    total: SLOTS.length,
    vignette: p?.vignetteUnlocked ?? false,
  };
}

/**
 * TÌNH CẢM — giữ ĐỊNH TÍNH. Tám trạng thái, ra bằng MỘT CÂU mình tự ghi, không bao giờ ra
 * một con số (T3) hay một cái thanh (L2).
 *
 * Thứ tự dò là **ưu tiên việc làm được**, không phải ưu tiên độ lớn: cái người chơi cần
 * là (a) có chuyện gì chưa xong, (b) có cái gì đang chặn, (c) đang lên hay đang xuống.
 * Độ lớn là câu ít hành động được nhất trong cả bốn — và nó cũng đúng là câu mà một trái
 * tim có số trả lời.
 */
export type RelReadState =
  | "RIVAL" | "VET_CHUA_LANH" | "TRAN_TIN" | "MOI_GHE" | "FRIEND" | "DANG_XUONG" | "DANG_LEN" | "QUEN_MAT";

/** Dưới ngần này lượt ghé thì chưa có gì để nói — và trang sổ ghi thẳng là chưa có gì. */
const KNOWN_AFTER_VISITS = 3;
/** "Đang đụng trần": điểm đã sát trần tin, tức là cái tường vô hình đang có thật. */
const CEIL_PRESS = 5;

export function relReadState(s: RelState): RelReadState {
  if (s.tier === "RIVAL") return "RIVAL";
  // Chỉ LONG/CORE: một ổ nguội hôm nay là chuyện trong ngày, chưa phải cái vết. Cùng tiêu
  // chí `hasLong(-1)` mà `nextTier` dùng để hạ bucket — một nguồn sự thật, không hai.
  // `heal()` đổi tại chỗ kind sang `HEALED_*` VÀ valence sang 1, nên chỉ cần soi valence.
  const wound = s.memory.long.some((m) => m.valence === -1) || s.memory.core?.valence === -1;
  if (wound) return "VET_CHUA_LANH";
  if (s.tier !== "FRIEND" && s.trustCeiling < 100 && s.relationPoints >= s.trustCeiling - CEIL_PRESS) return "TRAN_TIN";
  if (s.visits < KNOWN_AFTER_VISITS) return "MOI_GHE";
  if (s.tier === "FRIEND") return "FRIEND";
  const t = s.trail ?? [];
  if (t.filter((d) => d === "DOWN").length >= 2) return "DANG_XUONG";
  if (t.filter((d) => d === "UP").length >= 2) return "DANG_LEN";
  return "QUEN_MAT";
}

/**
 * ⚠️ `rng` phải là một mạch TIỀN ĐỊNH theo (saveId, npcId, ngày) — đừng đưa RNG của mùa
 * vào đây. Lớp UI dựng lại trang sau mỗi lần gõ một chữ vào ô ghi chú; rút ngẫu nhiên
 * thật thì câu đó nhảy chữ dưới ngón tay người chơi.
 */
export function relWords(s: RelState, name: string, rng: Rng): { state: RelReadState; line: string } {
  const state = relReadState(s);
  const vs = ST.quanHe[state];
  return { state, line: fill(vs[Math.floor(rng.next() * vs.length)], name) };
}

/**
 * P2-05 §2.5 — mốc tiến trình KHÔNG CÓ CON SỐ: người trong hẻm định vị nhà bằng hàng quán.
 * Có thể TỤT (tin tốt chết hết thì cách chỉ đường quay về mốc cũ) — không thông báo gì.
 */
export function landmarkTier(g: GossipState, strangerVisits: number, baSauFriend: boolean): 0 | 1 | 2 | 3 | 4 {
  const good: { holder: string; decl: number; hops: number }[] = [];
  for (const [holder, list] of Object.entries(g.beliefs)) {
    for (const b of list) if (b.valence > 0 && !b.dormant) good.push({ holder, decl: b.declarations, hops: b.hops });
  }
  const hardenedHolders = new Set(good.filter((b) => b.decl >= 3).map((b) => b.holder));
  const reach2 = good.some((b) => b.hops >= 2);
  if (hardenedHolders.size >= 2 && reach2 && strangerVisits >= 1 && baSauFriend) return 4;
  if (hardenedHolders.size >= 2 && reach2 && strangerVisits >= 1) return 3;
  if (hardenedHolders.size >= 2) return 2;
  if (new Set(good.map((b) => b.holder)).size >= 3 && good.some((b) => b.decl >= 2)) return 1;
  return 0;
}

export type EveningCtx = {
  day: number;
  lastDay: boolean;
  weather: import("../core/types").Weather;
  absences: { npcId: NpcId; missed: number }[];
  landmark: 0 | 1 | 2 | 3 | 4;
  confirmations: Confirmation[];
  /**
   * P2-05b §5 — ai vừa bị HẠ TRẦN TIN tối nay. `hard` = đã tới `CEILING_MAX_BURNS`, tức
   * là trần tụt dưới ngưỡng FRIEND và người đó VĨNH VIỄN không lên bạn được nữa.
   *
   * Luật §2.8 hạ trần hoàn toàn im lặng, và `nextTier` thì đòi `p <= trustCeiling` để lên
   * FRIEND — nên nếu không có dòng này, người chơi phục vụ tử tế thêm hai chục bữa, đập
   * vào một cái tường không ai thấy, rồi kết luận là game hỏng. T3 cấm hiện CHỈ SỐ; nó
   * không cấp phép cho một luật KHÔNG HỌC ĐƯỢC, và T5 thì đòi ngược lại.
   */
  trust?: { npcId: NpcId; hard: boolean }[];
  bags: Record<string, BagState>;
  rng: Rng;
  spokenOnce: string[];
};

/** Trang cuối ngày là chữ của chính mình → gọi người bằng cái tên MÌNH biết, không phải tên thật. */
const NAME = (nb: Notebook, id: NpcId) => penName(nb, id);

/**
 * 2–3 dòng, KHÔNG phán đúng sai, KHÔNG giải thích cơ chế (§2.4). Chấm theo độ cụ thể
 * (priority) như rule DB, mỗi concept tối đa một dòng, biến thể rút bằng shuffle-bag.
 */
export function composeEvening(nb: Notebook, c: EveningCtx): EveningNote {
  const t = nb.today.day === c.day ? nb.today : newDayFacts(c.day);
  const cands: { id: string; name?: string; once?: string }[] = [];
  const longAbs = c.absences.filter((a) => a.missed >= 5).sort((a, b) => b.missed - a.missed)[0];
  const shortAbs = c.absences.filter((a) => a.missed >= 2 && a.missed < 5).sort((a, b) => b.missed - a.missed)[0];
  if (c.lastDay) cands.push({ id: "day40" });
  if (t.dropped) cands.push({ id: "dropped" });
  if (longAbs) cands.push({ id: "absentLong", name: NAME(nb, longAbs.npcId) });
  if (t.healed[0]) cands.push({ id: "healed", name: NAME(nb, t.healed[0]) });
  if (t.heardBad) cands.push({ id: "gossipBad" });
  if (c.landmark > nb.landmarkTier) cands.push({ id: `landmark${c.landmark}` });
  if (t.heardGood) cands.push({ id: "gossipGood" });
  if (t.firstUsual.length) cands.push({ id: "firstUsual" });
  if (t.visitors.includes("BA_BAY")) cands.push({ id: "baBay" });
  // Khoá `once` theo TỪNG NGƯỜI: câu này ghi một lần cho bà Bảy, và vẫn còn một lần
  // cho chú Tư. Dùng khoá chung `note:trustCeil` là người thứ hai mất tiếng mãi mãi.
  for (const x of c.trust ?? []) {
    cands.push({ id: x.hard ? "trustCeilHard" : "trustCeil", name: NAME(nb, x.npcId), once: `note:trust:${x.npcId}:${x.hard ? "hard" : "first"}` });
  }
  if (shortAbs) cands.push({ id: "absentShort", name: NAME(nb, shortAbs.npcId) });
  if (c.weather === "MUA_RAO" || c.weather === "MUA_DAM") cands.push({ id: "rain" });
  if (t.newFaces || t.strangers >= 4) cands.push({ id: "newFace" });
  if (t.lost) cands.push({ id: "lost" });
  if (t.served >= 15) cands.push({ id: "goodDay" });
  if (c.weather === "NANG_GAT") cands.push({ id: "sunny" });
  cands.push({ id: "ordinary" });

  const onceKey = (x: { id: string; once?: string }) => x.once ?? `note:${x.id}`;
  const ranked = cands.map((x) => ({ ...x, def: NOTE_RULES[x.id] })).filter((x) => x.def && !(x.def.speakonce && c.spokenOnce.includes(onceKey(x))))
    .sort((a, b) => b.def.priority - a.def.priority);
  const lines: string[] = [];
  const used = new Set<string>();
  for (const x of ranked) {
    if (lines.length >= 3 || used.has(x.def.concept)) continue;
    if (x.id === "ordinary" && lines.length >= 2) continue;
    used.add(x.def.concept);
    const key = `note:${x.id}`;
    const bag = new ShuffleBag(x.def.variants.length, c.bags[key]);
    const i = bag.draw(c.rng, c.day);
    c.bags[key] = bag.toJSON();
    lines.push(fill(x.def.variants[i], x.name ?? ""));
    if (x.def.speakonce) c.spokenOnce.push(onceKey(x));
  }
  const confirmations = c.confirmations.map((k) => {
    const h = nb.pages[k.npcId]?.hypotheses.find((x) => x.slot === k.slot);
    const vs = CONFIRM_LINES[k.slot];
    const line = fill(vs[Math.floor(c.rng.next() * vs.length)], NAME(nb, k.npcId), h ? valueLabel(k.slot, h.value) : "");
    return { ...k, line };
  });
  nb.landmarkTier = c.landmark;
  const note = { day: c.day, lines, confirmations };
  nb.eveningNotes = nb.eveningNotes.filter((n) => n.day !== c.day);
  nb.eveningNotes.push(note);
  return note;
}
