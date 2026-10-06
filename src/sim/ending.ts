/**
 * Kết game — P4-04. "Đừng làm ending dựa trên 'bạn đã làm tốt tới đâu'. Cho mọi ending đều
 * tử tế, chỉ khác nhau về AI CÒN Ở ĐÓ VỚI MÌNH." (CANON §15 cuối mục)
 *
 * Ending KHÔNG phải một nhánh được chọn. Ending là DANH SÁCH NGƯỜI CÓ MẶT sáng ngày 40 — mỗi
 * người trả lời độc lập một câu hỏi, không tổng, không ngưỡng, không so sánh (§2.7).
 *
 * 🔴 `EndingState` KHÔNG ĐƯỢC có trường nào là điểm, tiền, xếp hạng, %, bucket (T3 — có test).
 */
import DONG_CUOI from "../content/lines/co-ba-dong-cuoi.json";
import type { SaveFile } from "../core/save";

export type EndingState = {
  presentOnDay40: string[];
  /** Hằng số. Luôn true. Không phải biến (R3). */
  lanReturned: true;
  lanGotLastBanhMi: boolean;
  lanOrderCorrect: boolean;
  playerStays: "o_lai" | "dung_lai" | "chua_ro";
  kietStopped: boolean;
  signboard: "ve_tay_run" | "in_decal" | "bang_cu";
  finalPhoto: "hanh_film" | "co_ba_dien_thoai";
  debtBook: "khop" | "lech_nhe" | "trong";
  /** Số ghi chú NGƯỜI CHƠI tự gõ — không phải điểm, chỉ để biết trang sổ có trống không. */
  notebookEntries: number;
  keptTheScissors: boolean;
};

/** Sàn tuyệt đối (§2.7): 6 người + cô Ba. Không ai chơi ra được một ngày 40 cô đơn. */
export const ALWAYS = ["BA_BAY", "CO_MAI", "THAY_PHUC", "BA_SAU", "CHU_KIET", "CHI_LAN"] as const;
/** Không bao giờ có: chú Tư (chủ ý tuyệt đối), ông Hải (về Bình Dương — nhưng cái bảng thì còn). */
export const NEVER = ["CHU_TU", "ONG_HAI"] as const;

/** Mỗi người có điều kiện — một câu hỏi độc lập (P4-04 §2.7 bảng rẽ nhánh). */
function conditional(w: SaveFile): string[] {
  const f = w.story?.flags ?? {};
  const out: string[] = [];
  if (f.dungStory) out.push("ANH_DUNG");                 // đèn ca tối đã bỏ — xem `content/arcs.ts` ANH_DUNG d40
  if (!f.suCover) out.push("BE_SU");
  out.push("CHI_HANH");                                  // M5 "nghen" luôn tới trước ngày 36 trong bản dựng (M3 muộn nhất ngày 20)
  if ((f.baoRespect || f.baoAsksChili) && !f.baoSneak) out.push("ANH_BAO");
  return out;
}

/** Người chơi ở lại hay dừng — đọc bằng HÀNH ĐỘNG mua hàng ngày 35–39 (SK-34), không bằng câu trả lời. */
export function playerStaysOf(basket: Record<number, number>): EndingState["playerStays"] {
  const before = [35, 36, 37, 38].map((d) => basket[d] ?? 0);
  const avg = before.reduce((a, b) => a + b, 0) / before.length;
  const last = basket[39] ?? 0;
  if (!before.some((x) => x > 0) && !last) return "chua_ro";
  if (last === 0 || (avg > 0 && last < 0.4 * avg)) return "dung_lai";
  return "o_lai";
}

/** Sổ nợ chốt với cô Mai (P4-04 §2.4 Phần 3) — ba nhánh, cả ba đều tử tế. */
export function debtBookOf(w: SaveFile): EndingState["debtBook"] {
  const debts = (w.money.debtsOwedToPlayer ?? []).filter((d) => d.day >= 9);
  if (!debts.length) return "khop";
  const written = debts.filter((d) => d.playerWrote !== null);
  if (!written.length) return "trong";
  const gap = debts.reduce((a, d) => a + Math.abs((d.playerWrote ?? 0) - d.trueAmount), 0);
  return gap === 0 ? "khop" : gap < 100_000 ? "lech_nhe" : "trong";
}

export function notebookEntriesOf(w: SaveFile) {
  let n = 0;
  for (const p of Object.values(w.notebook?.pages ?? {})) {
    if (p.name?.trim()) n++;
    n += (p.freeLines ?? "").split("\n").filter((l) => l.trim()).length;
  }
  return n;
}

export function computeEnding(w: SaveFile): EndingState {
  const f = w.story?.flags ?? {};
  const present = new Set<string>([...ALWAYS, ...conditional(w)]);
  for (const id of NEVER) present.delete(id);
  const stays = playerStaysOf(w.story?.basketLoaves ?? {});
  return {
    presentOnDay40: [...present],
    lanReturned: true,
    lanGotLastBanhMi: !!f.lanGot,
    lanOrderCorrect: !!f.lanCorrect,
    playerStays: stays,
    kietStopped: !!f.kietStopped,
    signboard: f.signboard === "ve_tay_run" ? "ve_tay_run" : f.signboard === "in_decal" ? "in_decal" : "bang_cu",
    finalPhoto: present.has("CHI_HANH") ? "hanh_film" : "co_ba_dien_thoai",
    debtBook: debtBookOf(w),
    notebookEntries: notebookEntriesOf(w),
    keptTheScissors: stays === "o_lai",
  };
}

type Rule = { id: string; criteria: string[]; score: number; text: string };

/** Dòng cuối của cô Ba — rule cụ thể nhất thắng (Elan Ruskin, CANON §11). KHÔNG cộng dồn. */
export function coBaLastLine(e: EndingState): { id: string; text: string } {
  const ok = (c: string) => {
    const [k, v] = c.split("==").map((x) => x.trim());
    const val = (e as unknown as Record<string, unknown>)[k];
    if (v === "true") return val === true;
    if (v === "false") return val === false;
    if (/^\d+$/.test(v)) return val === Number(v);
    return val === v;
  };
  const rules = (DONG_CUOI.rules as Rule[]).filter((r) => r.criteria.every(ok));
  const best = rules.reduce((a, r) => (r.score > a.score ? r : a), rules[rules.length - 1]);
  return { id: best.id, text: best.text };
}

/** Phần 3 — cô Mai chốt sổ. Cô không trách, không giảng, không cộng trừ gì vào chỉ số nào. */
export const DEBT_LINE: Record<EndingState["debtBook"], string> = {
  khop: 'Cô Mai đọc con số, gật đầu. "Ừ. Khớp."',
  lech_nhe: 'Cô Mai nhíu mày một giây. "Thôi kệ. Chắc tui ghi sót."',
  trong: 'Cô Mai nhìn cuốn sổ, xé trang đó ra. "Thôi con. Coi như huề."',
};

/** Một track duy nhất cho màn kết — không đổi theo số người có mặt (có test). */
export const endingMusicTrack = (_e: EndingState) => "lang" as const;

/**
 * Credits — LR-5 (CANON §14.1): người Việt viết văn hoá đứng ĐẦU, không phải dòng "cultural
 * consultant" ở cuối. Bản dựng CHƯA có tên người thật cho ba mục đầu — để trống có ghi chú,
 * KHÔNG bịa tên.
 */
export const CREDITS: { head: string; lines: string[] }[] = [
  { head: "Viết văn hoá và lời thoại", lines: ["(chưa có — vị trí tuyển đầu tiên của dự án, có quyền phủ quyết mọi nội dung)"] },
  { head: "Lồng tiếng", lines: ["(chưa thu — 13 giọng người thật; không một dòng nào bằng AI)"] },
  { head: "Cố vấn nghề", lines: ["(chưa phỏng vấn — 3–5 chủ xe bánh mì ở TP.HCM, P4-05 §2.10)"] },
  { head: "Làm game", lines: ["bản dựng thử"] },
];
