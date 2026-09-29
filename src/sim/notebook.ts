/**
 * Sổ tay cô Ba — P2-05. Mặt phẳng để người chơi NHẬN RA hệ thống (bài học Oblivion,
 * mô hình Bombers' Notebook). Logic thuần, không DOM, không Phaser.
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

// ─────────────────────────────────────────────────────────────── cột trái

export type RawNote =
  | { t: "EAVESDROP"; claim: string; source?: NpcId }
  | { t: "ABSENT_STREAK"; missed: number }
  | { t: "FIRST_VISIT" }
  | { t: "SAID_SOMETHING"; text: string };

/** ĐÚNG SÁU trường (P2-05 §2.2) — thêm trường thứ 7 là test type hỏng. */
export type LogEntry = {
  day: number;
  /** Phút trong ngày: 407 → "6h47". */
  minute: number;
  npcId: NpcId | "KHACH_LA";
  /** Nguyên văn cách họ gọi. */
  orderText: string;
  /** "lần thứ 9". */
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
  /** Id trong từ vựng, KHÔNG phải chuỗi tự do. */
  value: string;
  dayGuessed: number;
  /** KHÔNG CÓ 'WRONG'. */
  state: "OPEN" | "CONFIRMED";
  dayConfirmed?: number;
  /** Ngày đổi giá trị gần nhất — mỗi slot đổi tối đa 1 lần/ngày. */
  dayChanged: number;
};

export type NpcPage = {
  /** Tên người chơi tự ghi — thứ DUY NHẤT gắn tên lên đầu khách (P2-05, quyết định của chủ dự án). */
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
  /** Đã thấy ai từng tới quầy — mặt của họ mới có trong sổ. */
  met: NpcId[];
  /** Ghi nhận trong NGÀY để dựng trang tối (không phải cột trái — sổ tối đọc rồi quên). */
  today: DayFacts;
};

export type DayFacts = {
  day: number;
  dropped: number;
  served: number;
  lost: number;
  newFaces: number;
  strangers: number;
  firstUsual: NpcId[];
  healed: NpcId[];
  heardBad: boolean;
  heardGood: boolean;
  visitors: NpcId[];
  /** Bằng chứng cho giả thuyết (§2.3 wasDemonstratedToday). */
  usualServed: NpcId[];
  cleanServedFront: NpcId[];
  served_: Record<NpcId, { minute: number; dish: Ingredient[] }[]>;
};

export const newDayFacts = (day: number): DayFacts => ({
  day, dropped: 0, served: 0, lost: 0, newFaces: 0, strangers: 0, firstUsual: [], healed: [], heardBad: false, heardGood: false,
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

/** Tên hiện trên đầu / trên phiếu: tên người chơi ghi, hoặc "—". */
export function displayName(nb: Notebook | undefined, npcId: NpcId, fallback: string) {
  if (!NPC.has(npcId)) return fallback;                    // khách vãng lai: mô tả hình dáng
  return nb?.pages[npcId]?.name?.trim() || "—";
}

// ─────────────────────────────────────────────────────────────── ghi nhật ký

export function page(nb: Notebook, id: NpcId, day: number): NpcPage {
  return (nb.pages[id] ??= { name: "", freeLines: "", hypotheses: [], vignetteUnlocked: false, firstSeenDay: day, pinned: false });
}

export function beginDay(nb: Notebook, day: number) {
  if (nb.today.day !== day) nb.today = newDayFacts(day);
}

/** Máy ghi một lượt gọi món. Không đúng/sai, không suy luận — chỉ chuyện đã xảy ra. */
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

/** Nhãn đọc được của một giá trị. */
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
export function options(nb: Notebook, npcId: NpcId, slot: HypothesisSlot): string[] {
  const mine = nb.log.filter((e) => e.npcId === npcId && e.orderText);
  if (!mine.length) return [];
  if (slot === "HAY_AN" || slot === "KHONG_AN_DUOC") {
    const said = new Set<string>();
    for (const e of nb.log) if (e.orderText) for (const ing of INGREDIENTS) if (e.orderText.includes(ing.label)) said.add(ing.id);
    return INGREDIENTS.map((i) => i.id).filter((id) => said.has(id));
  }
  if (slot === "THUONG_GHE") return [...new Set(mine.map((e) => bandId(e.minute)))];
  if (slot === "NGAY_TRONG_TUAN") return mine.length >= 3 ? Object.keys(WEEK_PATTERNS) : [];
  if (slot === "TINH_Y") return mine.length >= 2 ? Object.keys(TINH_Y) : [];
  // nghề: nghề của những người mình đã gặp — không lộ nghề người chưa gặp
  return mine.length >= 2 ? [...new Set(nb.met.map((id) => NPC.get(id)?.role).filter((r): r is string => !!r))] : [];
}

/** Đặt / đổi một giả thuyết. Trả lý do nếu không được (không bao giờ nói "sai"). */
export function guess(nb: Notebook, npcId: NpcId, slot: HypothesisSlot, value: string, day: number): string | null {
  const p = page(nb, npcId, day);
  if (!options(nb, npcId, slot).includes(value)) return "chưa gặp điều này ở người này";
  const h = p.hypotheses.find((x) => x.slot === slot);
  if (h) {
    if (h.state === "CONFIRMED") return "cô Ba đánh dấu rồi";
    if (h.value === value) return null;
    if (h.dayChanged === day) return "mai hãy đổi — mỗi ngày đổi một lần thôi";
    h.value = value; h.dayChanged = day; h.dayGuessed = day;
    return null;
  }
  if (p.hypotheses.filter((x) => x.state === "OPEN").length >= MAX_OPEN_HYPOTHESES) return "đang đoán 5 điều rồi — xoá bớt một cái";
  p.hypotheses.push({ slot, value, dayGuessed: day, state: "OPEN", dayChanged: day });
  return null;
}

export function unguess(nb: Notebook, npcId: NpcId, slot: HypothesisSlot) {
  const p = nb.pages[npcId];
  if (p) p.hypotheses = p.hypotheses.filter((h) => h.slot !== slot || h.state === "CONFIRMED");
}

/** Sự thật của game — người chơi không bao giờ thấy trực tiếp. */
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

/** Ban đêm: tick mực đỏ cho giả thuyết đúng VÀ đã được chứng minh hôm nay. Sai thì không làm gì. */
export function checkHypotheses(nb: Notebook, day: number, usualOf: (id: NpcId) => Partial<Record<Ingredient, number>>): Confirmation[] {
  const out: Confirmation[] = [];
  for (const [id, p] of Object.entries(nb.pages)) {
    const npc = NPC.get(id);
    if (!npc) continue;
    for (const h of p.hypotheses) {
      if (h.state !== "OPEN") continue;
      if (!truth(npc, usualOf(id), h.slot, h.value)) continue;           // sai → im lặng
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
const ST = SO_TAY as unknown as { notes: Record<string, NoteDef>; confirm: Record<HypothesisSlot, string[]> };
export const NOTE_RULES = ST.notes;
export const CONFIRM_LINES = ST.confirm;

/** "Chú Tư" giữa câu → "chú Tư"; đầu câu giữ hoa. */
const mid = (name: string) => name.charAt(0).toLowerCase() + name.slice(1);
const fill = (s: string, name: string, value = "") => {
  const out = s.replace(/\{name\}/g, (_m, i: number) => (i === 0 ? name : mid(name))).replace(/\{value\}/g, value);
  return out.charAt(0).toUpperCase() + out.slice(1);
};

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
  /** Người đã gặp mà đang lỡ liên tiếp n lần ghé có lịch (P2-03 missStreak). */
  absences: { npcId: NpcId; missed: number }[];
  landmark: 0 | 1 | 2 | 3 | 4;
  confirmations: Confirmation[];
  bags: Record<string, BagState>;
  rng: Rng;
  spokenOnce: string[];
};

const NAME = (id: NpcId) => NPC.get(id)?.name ?? id;

/**
 * 2–3 dòng, KHÔNG phán đúng sai, KHÔNG giải thích cơ chế (§2.4). Chấm theo độ cụ thể
 * (priority) như rule DB, mỗi concept tối đa một dòng, biến thể rút bằng shuffle-bag.
 */
export function composeEvening(nb: Notebook, c: EveningCtx): EveningNote {
  const t = nb.today.day === c.day ? nb.today : newDayFacts(c.day);
  const cands: { id: string; name?: string }[] = [];
  const longAbs = c.absences.filter((a) => a.missed >= 5).sort((a, b) => b.missed - a.missed)[0];
  const shortAbs = c.absences.filter((a) => a.missed >= 2 && a.missed < 5).sort((a, b) => b.missed - a.missed)[0];
  if (c.lastDay) cands.push({ id: "day40" });
  if (t.dropped) cands.push({ id: "dropped" });
  if (longAbs) cands.push({ id: "absentLong", name: NAME(longAbs.npcId) });
  if (t.healed[0]) cands.push({ id: "healed", name: NAME(t.healed[0]) });
  if (t.heardBad) cands.push({ id: "gossipBad" });
  if (c.landmark > nb.landmarkTier) cands.push({ id: `landmark${c.landmark}` });
  if (t.heardGood) cands.push({ id: "gossipGood" });
  if (t.firstUsual.length) cands.push({ id: "firstUsual" });
  if (t.visitors.includes("BA_BAY")) cands.push({ id: "baBay" });
  if (shortAbs) cands.push({ id: "absentShort", name: NAME(shortAbs.npcId) });
  if (c.weather === "MUA_RAO" || c.weather === "MUA_DAM") cands.push({ id: "rain" });
  if (t.newFaces || t.strangers >= 4) cands.push({ id: "newFace" });
  if (t.lost) cands.push({ id: "lost" });
  if (t.served >= 15) cands.push({ id: "goodDay" });
  if (c.weather === "NANG_GAT") cands.push({ id: "sunny" });
  cands.push({ id: "ordinary" });

  const ranked = cands.map((x) => ({ ...x, def: NOTE_RULES[x.id] })).filter((x) => x.def && !(x.def.speakonce && c.spokenOnce.includes(`note:${x.id}`)))
    .sort((a, b) => b.def.priority - a.def.priority);
  const lines: string[] = [];
  const used = new Set<string>();
  for (const x of ranked) {
    if (lines.length >= 3 || used.has(x.def.concept)) continue;
    // dòng "ngày thường" chỉ để lấp khi chưa đủ 2 dòng
    if (x.id === "ordinary" && lines.length >= 2) continue;
    used.add(x.def.concept);
    const key = `note:${x.id}`;
    const bag = new ShuffleBag(x.def.variants.length, c.bags[key]);
    const i = bag.draw(c.rng, c.day);
    c.bags[key] = bag.toJSON();
    lines.push(fill(x.def.variants[i], x.name ?? ""));
    if (x.def.speakonce) c.spokenOnce.push(`note:${x.id}`);
  }
  const confirmations = c.confirmations.map((k) => {
    const h = nb.pages[k.npcId]?.hypotheses.find((x) => x.slot === k.slot);
    const vs = CONFIRM_LINES[k.slot];
    const line = fill(vs[Math.floor(c.rng.next() * vs.length)], NAME(k.npcId), h ? valueLabel(k.slot, h.value) : "");
    return { ...k, line };
  });
  nb.landmarkTier = c.landmark;
  const note = { day: c.day, lines, confirmations };
  nb.eveningNotes = nb.eveningNotes.filter((n) => n.day !== c.day);
  nb.eveningNotes.push(note);
  return note;
}
