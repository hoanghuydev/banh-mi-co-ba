/**
 * Nghĩa vụ và fail mềm — P3-06, bảng hợp nhất CANON §13.1 (nguồn sự thật).
 *
 *   KHÔNG CÓ GAME OVER. Vỡ một nghĩa vụ = một `PermanentLoss`: không mua lại được trong
 *   mùa, nhìn thấy mỗi ngày, và KHÔNG BAO GIỜ là cái cuối — ngày hôm sau vẫn bán bình thường.
 *
 *   Rút về nhà  150k/ngày    tự trừ lúc đếm tiền tối
 *   Thuê chỗ    theo ngày    thu buổi sáng · ân hạn 3 ngày → LOST_PRIME_STAND (dời xuống góc khuất)
 *   Hụi         500k × 8     ngày 5,10,…,40 · ân hạn 1 ngày (kỳ cuối 0) · lần 1 cô Mai ứng · lần 2 HUI_EXPELLED
 *   Tiền học    1.200k × 2   ngày 18, 38 · báo trước 6 ngày · ân hạn 5 ngày → CART_DOWNGRADED
 *   Tiền thuốc  600k × 2     ngày 20, 30 · TỰ NGUYỆN, không ai nhắc, không hệ quả cơ học
 *
 * Mọi số tiền đã co theo `ECON.scale` (quyết định của chủ dự án, xem econ.json).
 * Không có tổng, không màu đỏ, không "còn N ngày" trên UI (P3-06 §3).
 */
import { ECON, scaledVnd } from "./econ";

export type PermanentLossKind = "LOST_PRIME_STAND" | "HUI_EXPELLED" | "SOLD_EQUIPMENT" | "CART_DOWNGRADED";
export type ObligationKind = "HUI" | "TIEN_HOC" | "TIEN_THUOC";

export type Due = {
  id: string;
  kind: ObligationKind;
  dueDay: number;
  amount: number;          // đồng, đã co
  mandatory: boolean;
  /** Ngày cuối còn trả được trước khi thành vỡ. */
  lastDay: number;
};

/**
 * Sổ hôm nay — MỌI đường tiền ra/vào két phải đi qua đúng MỘT dòng ở đây. Không có tổng trên
 * UI (P3-06 §3), nhưng các dòng phải cộng lại đúng bằng chênh lệch `money.cash` trong ngày,
 * nếu không thì trang tối nói dối người chơi.
 *
 * Quy ước dấu: DƯƠNG = tiền RA khỏi két. Bán đồ nghề, hốt hụi, lấy lại cọc là ÂM.
 */
export type EconToday = {
  day: number;
  /** Đi chợ. */
  market: number;
  /** Than, đá, túi, xăng — CHỈ phần két trả nổi (phần cô Ba bù nằm ở `coBaCovered`). */
  fixed: number;
  /** Phần chi phí cố định cô Ba bù giùm — KHÔNG trừ vào két, chỉ để trang tối nói thật. */
  coBaCovered: number;
  /** Tiền chỗ sáng nay. */
  rent: number;
  /** Cọc chỗ đứng, RÒNG (âm = lấy lại cọc chỗ cũ nhiều hơn cọc chỗ mới). */
  deposit: number;
  sendHome: number;
  sendHomeShort: number;
  /** Tiền học + tiền thuốc đã đóng (hụi có dòng riêng). */
  obligations: number;
  /** Góp/hốt hụi, RÒNG (âm = hốt được nhiều hơn góp). */
  hui: number;
  /** Mua/bán đồ nghề, RÒNG (âm = bán được tiền). */
  tools: number;
  /** Trả nợ mối. */
  debtRepay: number;
  /** Chi phí "chuyện trong hẻm" (P4-03 — cảnh tối ghi vào). */
  story: number;
  wasted: string[];
  soldOut: number;
  counted: boolean;
  closedAtMin: number | null;
};

/** Chỗ ghi sổ — nhận cả `EconState` lẫn một `{ today }` rời (để test / gọi từ hệ khác). */
export type EconBook = { today: EconToday };

export type EconState = {
  /** Mã chỗ đứng (P3-05). Vỡ tiền thuê thì bị đẩy về L5 — góc khuất. */
  stand: "L1" | "L2" | "L3" | "L4" | "L5";
  rentArrearsDays: number;
  /** Tiền thuê còn nợ (đồng). */
  rentOwed: number;
  paid: Record<string, number>;      // id nghĩa vụ → ngày trả
  huiLate: number;
  huiExpelled: boolean;
  huiContributed: number;            // đồng
  huiTakenPeriod: number | null;
  losses: PermanentLossKind[];
  /** Ngày cô Ba phải bù tiền chợ / chi phí vì két không đủ — chỉ để trang tối nói một câu. */
  coBaCovered: number[];
  /** Sổ sách hôm nay — tối đếm tiền. */
  today: EconToday;
  /** Số preset kẹp sẵn tối đa — xe cũ còn 2 chỗ sau CART_DOWNGRADED. */
  presetSlots: number;
  /** Chuyện xảy ra đêm qua (fail mềm) — sáng nay người ta nói ra một câu. */
  notices: (PermanentLossKind | "HUI_UNG")[];
  /** Câu người ta nói sáng nay (người bán nhắc nợ, v.v.) — nói ra, không có banner. */
  morningLines: string[];
  /** P3-03 §2.8 — tiền lẻ đổi ở cô Mai sáng nay (đồng) và còn lại bao nhiêu. */
  float: number;
  floatLeft: number;
  /** Số lần bỏ qua nghi thức đốt vía — lần đầu cô Ba đốt giùm, từ lần hai cô im (P3-01 §2.6). */
  ritualSkips: number;
  /** P3-04 E2 — hàng xóm khó chịu vì loa (ẩn, không bao giờ hiện số). */
  neighborAnnoyance: number;
  /** Bị bắt tắt loa tới hết ngày này. */
  loaOffUntil: number;
  /** Tên ghi trên bảng hiệu (P3-04 E3): "CO_BA" · "PLAYER" · "BLANK". */
  signName?: "CO_BA" | "PLAYER" | "BLANK";
  /** Tiền học vỡ mà xe còn đồ bán được → sáng mai phải chọn bán một món (P3-06 §2.4). */
  mustSell: boolean;
  /** P3-05 — kế hoạch dời xe (tờ giấy dán trên xe), ai đang theo mình ở chỗ hiện tại, đã hỏi thăm chỗ nào. */
  movePlan: { to: EconState["stand"]; postedDay: number; moveDay: number } | null;
  /** null = ở đầu hẻm, ai cũng ghé như thường. */
  followers: string[] | null;
  lastMoveDay: number;
  scouted: EconState["stand"][];
  /** Tiền cọc đang nằm ở chủ chỗ hiện tại (cọc đầu hẻm là của cô Ba từ trước — 0). */
  deposit: number;
};

export const newEconState = (): EconState => ({
  stand: "L1", rentArrearsDays: 0, rentOwed: 0, paid: {}, huiLate: 0, huiExpelled: false, huiContributed: 0,
  huiTakenPeriod: null, losses: [], coBaCovered: [], today: newToday(1), presetSlots: 3, notices: [],
  morningLines: [], float: 0, floatLeft: 0, ritualSkips: 0, neighborAnnoyance: 0, loaOffUntil: 0, mustSell: false,
  movePlan: null, followers: null, lastMoveDay: -99, scouted: ["L1", "L5"], deposit: 0,
});
export const newToday = (day: number): EconToday =>
  ({ day, market: 0, fixed: 0, coBaCovered: 0, rent: 0, deposit: 0, sendHome: 0, sendHomeShort: 0, obligations: 0,
    hui: 0, tools: 0, debtRepay: 0, story: 0, wasted: [], soldOut: 0, counted: false, closedAtMin: null });

export const rentVnd = (stand: EconState["stand"]) => scaledVnd(ECON.rent_k[stand]);
/** Hệ số khách vãng lai theo chỗ đứng (P3-05 §2.2 `standLocationMul`). Đợt D mở đủ 5 chỗ. */
/** @deprecated — dùng `standDayMul` của sim/stands (đã gồm sự kiện hẻm + mái che). Giữ cho save cũ / test. */
export const STAND_MUL: Record<EconState["stand"], number> = { L1: 1.0, L2: 1.05, L3: 1.15, L4: 1.2, L5: 0.65 };

/** Câu người ta nói ra sáng hôm sau một fail mềm (P3-06 §2.3–2.4). Không có sting, không rung. */
export const NOTICE_LINES: Record<PermanentLossKind | "HUI_UNG", string[]> = {
  LOST_PRIME_STAND: ['Chủ nhà: "Đầu hẻm cô cho người khác thuê rồi. Con dọn xuống góc khuất nghen."',
    'Chú Kiệt: "Tao không giành đâu. Chỗ trống thì người ta cho tao. Mày cần gì thì qua nói."'],
  HUI_UNG: ['Cô Mai: "Cô ứng cho con kỳ này. Kỳ sau nhớ nghen."'],
  HUI_EXPELLED: ['Cô Mai: "Thôi con… dây hụi cô cho người khác vô. Tiền góp cô trả lại con một phần."'],
  CART_DOWNGRADED: ['Cô Ba: "Xe này cô đẩy hồi mới hăm mấy. Thôi, xe nào cũng bán bánh mì được hết con."'],
  SOLD_EQUIPMENT: ['Cô Ba: "Bán thì bán. Mình còn tay nghề mà con."'],
};
export const sendHomeVnd = () => scaledVnd(ECON.sendHome_k);

/** Số tiền hốt hụi theo kỳ (P3-06 §2.3) — đã co. Hốt càng muộn càng nhiều. */
export const HUI_PAYOUT_K: Record<number, number> = { 2: 2800, 3: 3000, 4: 3200, 5: 3400, 6: 3700, 7: 3950, 8: 4200 };

/** Các khoản đang tới hạn / còn trong ân hạn, chưa trả. */
export function duesOpen(e: EconState, day: number): Due[] {
  const out: Due[] = [];
  const add = (d: Due) => { if (!e.paid[d.id] && day >= d.dueDay && day <= d.lastDay) out.push(d); };
  if (!e.huiExpelled) {
    ECON.hui.days.forEach((d, i) => {
      const last = i === ECON.hui.days.length - 1 ? ECON.hui.lastGraceDays : ECON.hui.graceDays;
      add({ id: `hui_${i + 1}`, kind: "HUI", dueDay: d, amount: scaledVnd(ECON.hui.perPeriod_k), mandatory: true, lastDay: d + last });
    });
  }
  ECON.tuition.days.forEach((d, i) => add({ id: `hoc_${i + 1}`, kind: "TIEN_HOC", dueDay: d, amount: scaledVnd(ECON.tuition.amount_k), mandatory: true, lastDay: d + ECON.tuition.graceDays }));
  // tiền thuốc: tự nguyện — mở từ ngày tới hạn tới hết mùa, không bao giờ "vỡ"
  ECON.medicine.days.forEach((d, i) => add({ id: `thuoc_${i + 1}`, kind: "TIEN_THUOC", dueDay: d, amount: scaledVnd(ECON.medicine.amount_k), mandatory: false, lastDay: 40 }));
  return out;
}

/** Khoản sắp tới (để NPC/điện thoại nhắc trước) — KHÔNG hiện đếm ngược. */
export function upcoming(e: EconState, day: number, within: number): Due[] {
  const all: Due[] = [];
  if (!e.huiExpelled) ECON.hui.days.forEach((d, i) => { if (!e.paid[`hui_${i + 1}`] && d > day && d - day <= within) all.push({ id: `hui_${i + 1}`, kind: "HUI", dueDay: d, amount: scaledVnd(ECON.hui.perPeriod_k), mandatory: true, lastDay: d }); });
  ECON.tuition.days.forEach((d, i) => { if (!e.paid[`hoc_${i + 1}`] && d > day && d - day <= ECON.tuition.telegraphDays) all.push({ id: `hoc_${i + 1}`, kind: "TIEN_HOC", dueDay: d, amount: scaledVnd(ECON.tuition.amount_k), mandatory: true, lastDay: d }); });
  return all;
}

export type Money = { cash: number };

export function pay(e: EconState, m: Money, d: Due, day: number): boolean {
  if (m.cash < d.amount || e.paid[d.id]) return false;
  m.cash -= d.amount;
  e.paid[d.id] = day;
  // hụi có dòng sổ RIÊNG (`today.hui`) vì còn có chiều ngược lại — hốt hụi. Cộng vào
  // `obligations` nữa là đếm hai lần, tối cộng lại không khớp với cái két.
  if (d.kind === "HUI") { e.today.hui += d.amount; e.huiContributed += d.amount; }
  else e.today.obligations += d.amount;
  return true;
}

/** Hốt hụi — chỉ một lần cả mùa, sau khi đã góp kỳ đó (kỳ 1 là của cô Mai). */
export function huiPayoutVnd(period: number) {
  const k = HUI_PAYOUT_K[period];
  return k ? scaledVnd(k) : 0;
}
export function canTakeHui(e: EconState, day: number): number | null {
  if (e.huiExpelled || e.huiTakenPeriod !== null) return null;
  const i = ECON.hui.days.indexOf(day);
  if (i < 1 || !e.paid[`hui_${i + 1}`]) return null;
  return i + 1;
}
export function takeHui(e: EconState, m: Money, day: number): number {
  const p = canTakeHui(e, day);
  if (!p) return 0;
  const v = huiPayoutVnd(p);
  e.huiTakenPeriod = p;
  m.cash += v;
  e.today.hui -= v;                                // tiền VÔ — dòng hụi hôm nay thành âm
  return v;
}

// ─────────────────────────────────────────────────────────────── sáng + tối

/** Buổi sáng: thu tiền thuê chỗ (trả nợ cũ trước). Không đủ thì dồn nợ — 3 ngày → mất chỗ. */
export function morningRent(e: EconState, m: Money): { paid: number; lost: boolean } {
  const due = e.rentOwed + rentVnd(e.stand);
  if (m.cash >= due) {
    m.cash -= due;
    e.today.rent += due;
    e.rentOwed = 0;
    e.rentArrearsDays = 0;
    return { paid: due, lost: false };
  }
  e.rentOwed = due;
  e.rentArrearsDays++;
  if (e.rentArrearsDays > ECON.rent_k.graceDays && e.stand !== "L5") {
    // P3-06 §2.4: vỡ tiền thuê → dời xuống góc khuất; đầu hẻm vào tay chú Kiệt. Nợ cũ xoá theo chỗ cũ.
    e.stand = "L5";
    e.followers = null;                            // cùng hẻm — người quen vẫn tìm tới
    e.rentOwed = 0;
    e.rentArrearsDays = 0;
    if (!e.losses.includes("LOST_PRIME_STAND")) e.losses.push("LOST_PRIME_STAND");
    return { paid: 0, lost: true };
  }
  return { paid: 0, lost: false };
}

export type NightOutcome = { defaulted: { due: Due; loss: PermanentLossKind | "HUI_UNG" }[] };

/**
 * Vào cảnh tối — đếm tiền: trừ chi phí cố định + rút về nhà. Chạy MỘT lần mỗi tối. Không
 * bao giờ để két âm: thiếu thì cô Ba bù chi phí cố định, tiền gửi về nhà gửi thiếu — ghi
 * lại để trang tối nói một câu, KHÔNG phạt.
 */
export function eveningCount(e: EconState, m: Money, day: number, fixed: number) {
  if (e.today.counted) return;
  e.today.counted = true;
  const f = Math.max(0, Math.min(m.cash, fixed));
  m.cash -= f;
  // sổ chỉ ghi phần KÉT thật sự trả; phần cô Ba bù đi dòng riêng — ghi đủ vào `fixed` thì
  // trang tối in "−40.000₫" rồi kết bằng "trong ống: 0₫", tức là nói dối (P3-06 §3)
  e.today.fixed += f;
  if (f < fixed) { e.coBaCovered.push(day); e.today.coBaCovered += fixed - f; }
  const home = sendHomeVnd();
  const h = Math.min(m.cash, home);
  m.cash -= h;
  e.today.sendHome += h;
  e.today.sendHomeShort = home - h;
}

/** Đi ngủ — các khoản BẮT BUỘC quá ân hạn mà chưa trả thành fail mềm. */
export function processDefaults(e: EconState, m: Money, day: number, hasResellable = false): NightOutcome {
  const out: NightOutcome = { defaulted: [] };
  for (const d of duesOpen(e, day)) {
    if (!d.mandatory || day < d.lastDay) continue;
    if (d.kind === "HUI") {
      e.huiLate++;
      if (e.huiLate === 1) {
        e.paid[d.id] = day;                          // cô Mai ứng giùm — một lần cả mùa
        out.defaulted.push({ due: d, loss: "HUI_UNG" });
      } else {
        e.huiExpelled = true;
        const back = Math.round(e.huiContributed * 0.55 / 1000) * 1000;
        m.cash += back;
        e.today.hui -= back;                       // "tiền góp cô trả lại con một phần" — cũng phải có dòng
        if (!e.losses.includes("HUI_EXPELLED")) e.losses.push("HUI_EXPELLED");
        out.defaulted.push({ due: d, loss: "HUI_EXPELLED" });
      }
    } else if (d.kind === "TIEN_HOC") {
      // P3-06 §2.4: phải xoay cho đủ — có đồ nghề thì sáng mai PHẢI chọn bán một món (không có
      // nút thoát); chưa có gì để bán thì bán bớt cái xe (còn 2 chỗ kẹp sẵn)
      e.paid[d.id] = day;
      if (hasResellable) {
        e.mustSell = true;
        if (!e.losses.includes("SOLD_EQUIPMENT")) e.losses.push("SOLD_EQUIPMENT");
        out.defaulted.push({ due: d, loss: "SOLD_EQUIPMENT" });
      } else {
        e.presetSlots = Math.min(e.presetSlots, 2);
        if (!e.losses.includes("CART_DOWNGRADED")) e.losses.push("CART_DOWNGRADED");
        out.defaulted.push({ due: d, loss: "CART_DOWNGRADED" });
      }
    }
  }
  return out;
}
