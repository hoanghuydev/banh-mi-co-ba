import type { SaveFile } from "../core/save";
import { fnv1a, Rng, splitmix32 } from "../core/rng";

export type RewardId = "LUCK" | "TIEN_LE" | "KIM_KHO" | "MY_NHAN" | "DANH_TIENG" | "THE_GIAM" | "THAN_HANH";

export type Reward = {
  id: RewardId;
  name: string;
  tier: string;
  /** Trọng số trúng. */
  win: number;
  /** Trọng số được bốc lên vòng. */
  draw: number;
  effect: string;
  term?: string;
  desc?: string;
};

/** Trọng số chờ mô phỏng chốt. */
export const REWARDS: Reward[] = [
  { id: "LUCK", name: "Chúc may mắn", tier: "", win: 40, draw: 40, effect: "" },
  { id: "TIEN_LE", name: "Tiền Lẻ Trong Túi Áo", tier: "Phổ thông", win: 20, draw: 22, effect: "" },
  { id: "KIM_KHO", name: "Tiểu Kim Khố", tier: "Hiếm", win: 4, draw: 10, effect: "", desc: "Tích tiểu thành đại." },
  { id: "MY_NHAN", name: "Mỹ Nhân Đứng Quầy", tier: "Sơ cấp", win: 12, draw: 16, effect: "Thời gian kiên nhẫn của khách +2 giây.", term: "hôm nay", desc: "Nhan sắc chính là chính nghĩa." },
  { id: "DANH_TIENG", name: "Danh Tiếng Lan Xa", tier: "Sơ cấp", win: 6, draw: 12, effect: "Khách hôm nay +1.", term: "hôm nay", desc: "Rượu thơm không sợ hẻm sâu." },
  { id: "THE_GIAM", name: "Thẻ giảm giá nhà cung cấp", tier: "", win: 5, draw: 10, effect: "−10% một đơn Thực phẩm." },
  { id: "THAN_HANH", name: "Thần Hành Phù", tier: "Hiếm", win: 2, draw: 6, effect: "Một đơn Thực phẩm giao trong 1 giờ.", desc: "Ngàn dặm trong chớp mắt. Phí ship: 0đ." },
];

export const REWARD_BY_ID = Object.fromEntries(REWARDS.map((r) => [r.id, r])) as Record<RewardId, Reward>;

export const SLOTS = 8;
export const MIN_LUCK = 2;
export const CARD_CAP = 3;
export const LEDGER_AVG_DAYS = 3;
export const MONEY_PCT = { TIEN_LE: 0.02, KIM_KHO: 0.06 } as const;
const FALLBACK_REVENUE = 450_000;

export type SystemState = {
  /** `new` chưa thức tỉnh; `linked` đã nhận; `unlinked` đã từ chối hai lần. */
  stage: "new" | "linked" | "unlinked";
  refused: number;
  /** Đã xong 10 nhiệm vụ tân thủ. */
  unlocked: boolean;
  spunDay: number;
  /** Phần thưởng kỹ năng bị động còn hiệu lực trong ngày `buffDay`. */
  buffDay: number;
  patience: boolean;
  crowd: boolean;
  discount: number;
  express: number;
  exp: number;
  /** Chế độ trợ giúp: quay ngược quá 5 lần thì thưởng ×2 (trừ may mắn). */
  help: boolean;
  log: { day: number; text: string }[];
};

export const newSystem = (): SystemState => ({
  stage: "new", refused: 0, unlocked: false, spunDay: 0, buffDay: 0, patience: false, crowd: false,
  discount: 0, express: 0, exp: 0, help: false, log: [],
});

export const linked = (w: SaveFile) => w.system.stage === "linked";

export function say(w: SaveFile, text: string) {
  w.system.log.push({ day: w.progress.dayIndex, text });
  if (w.system.log.length > 60) w.system.log.splice(0, w.system.log.length - 60);
}

export function refuse(w: SaveFile): "again" | "gone" {
  const s = w.system;
  s.refused++;
  if (s.refused >= 2) { s.stage = "unlinked"; return "gone"; }
  return "again";
}

export function accept(w: SaveFile, help = false) {
  w.system.stage = "linked";
  w.system.help = help;
}

export function canSpin(w: SaveFile) {
  const s = w.system;
  return s.stage === "linked" && (s.unlocked || w.progress.dayIndex >= 2) && s.spunDay < w.progress.dayIndex;
}

/** Vòng quay hôm nay: ≥ 2 ô may mắn, còn lại bốc theo trọng số, cùng ngày cùng seed. */
export function wheelOf(w: SaveFile): RewardId[] {
  const rng = new Rng(splitmix32(fnv1a(`${w.saveId}|wheel|${w.progress.dayIndex}`)));
  const slots: RewardId[] = Array(MIN_LUCK).fill("LUCK");
  const pool = REWARDS.filter((r) => r.id !== "LUCK");
  while (slots.length < SLOTS) {
    const total = pool.reduce((a, r) => a + r.draw, 0);
    let x = rng.next() * total;
    const pick = pool.find((r) => (x -= r.draw) < 0) ?? pool[0];
    slots.push(pick.id);
  }
  for (let i = slots.length - 1; i > 0; i--) {
    const j = rng.int(0, i + 1);
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  return slots;
}

/** Ô trúng của lượt quay hôm nay (chỉ số trên `wheelOf`). */
export function spinIndex(w: SaveFile): number {
  const slots = wheelOf(w);
  const rng = new Rng(splitmix32(fnv1a(`${w.saveId}|spin|${w.progress.dayIndex}`)));
  const weights = slots.map((id) => REWARD_BY_ID[id].win * (w.system.help && id !== "LUCK" ? 2 : 1));
  let x = rng.next() * weights.reduce((a, b) => a + b, 0);
  const i = weights.findIndex((v) => (x -= v) < 0);
  return i < 0 ? 0 : i;
}

export function avgRevenue(w: SaveFile): number {
  const rows = w.ledger.slice(-LEDGER_AVG_DAYS);
  if (!rows.length) return FALLBACK_REVENUE;
  return rows.reduce((a, r) => a + r.revenue, 0) / rows.length;
}

const round1k = (v: number) => Math.max(1000, Math.round(v / 1000) * 1000);

export type SpinResult = { id: RewardId; lines: string[] };

/** Quay một lần: áp thưởng và ghi nhật ký Hệ thống. */
export function spin(w: SaveFile): SpinResult | null {
  if (!canSpin(w)) return null;
  const s = w.system;
  const day = w.progress.dayIndex;
  const id = wheelOf(w)[spinIndex(w)];
  const r = REWARD_BY_ID[id];
  s.spunDay = day;
  const lines: string[] = [];
  switch (id) {
    case "LUCK":
      lines.push("Keng! Phần thưởng: Chúc may mắn ×1.", LUCK_AT(day));
      break;
    case "TIEN_LE":
    case "KIM_KHO": {
      const v = round1k(avgRevenue(w) * MONEY_PCT[id]);
      w.money.cash += v;
      lines.push(
        id === "KIM_KHO"
          ? `Keng! Chúc mừng ký chủ thu được 【${r.name}】(${r.tier}).`
          : `Keng! Chúc mừng ký chủ thu được 【${r.name}】×1.`,
        `Hiệu quả: +${v.toLocaleString("vi-VN")}đ.`,
      );
      if (r.desc) lines.push(`Mô tả: ${r.desc}`);
      break;
    }
    case "MY_NHAN":
    case "DANH_TIENG":
      s.buffDay = day;
      if (id === "MY_NHAN") s.patience = true; else s.crowd = true;
      lines.push(`Keng! Chúc mừng ký chủ thu được kỹ năng bị động 【${r.name}】(${r.tier}).`,
        `Hiệu quả: ${r.effect}`, `Thời hạn: ${r.term}.`, `Mô tả: ${r.desc}`);
      break;
    case "THE_GIAM":
      if (s.discount >= CARD_CAP) return convertCard(w, lines);
      s.discount++;
      lines.push("Keng! Chúc mừng ký chủ thu được Thẻ giảm giá nhà cung cấp một trương.", `Hiệu quả: ${r.effect}`);
      break;
    case "THAN_HANH":
      if (s.express >= CARD_CAP) return convertCard(w, lines);
      s.express++;
      lines.push(`Keng! Chúc mừng ký chủ thu được 【${r.name}】×1 (${r.tier}).`, `Hiệu quả: ${r.effect}`, `Mô tả: ${r.desc}`);
      break;
  }
  for (const l of lines) say(w, l);
  return { id, lines };

  function convertCard(world: SaveFile, out: string[]): SpinResult {
    const v = round1k(avgRevenue(world) * MONEY_PCT.TIEN_LE);
    world.money.cash += v;
    out.push("Keng! Thẻ đã đạt giới hạn 3 trương. Tự động chuyển hoá thành 【Tiền Lẻ Trong Túi Áo】.",
      `Hiệu quả: +${v.toLocaleString("vi-VN")}đ.`);
    for (const l of out) say(world, l);
    return { id: "TIEN_LE", lines: out };
  }
}

const LUCK_AT = (day: number) => (day % 2 ? "Hệ thống đã cố gắng." : "Hệ thống không tiếp nhận khiếu nại.");

/** Buff chỉ có hiệu lực đúng ngày nhận. */
export const patienceBonusSec = (w: SaveFile) => (w.system.buffDay === w.progress.dayIndex && w.system.patience ? 2 : 0);
export const extraGuests = (w: SaveFile) => (w.system.buffDay === w.progress.dayIndex && w.system.crowd ? 1 : 0);

export function clearBuffsIfStale(w: SaveFile) {
  const s = w.system;
  if (s.buffDay !== w.progress.dayIndex) { s.patience = false; s.crowd = false; }
}

/** Kinh nghiệm sống +1 mỗi nhiệm vụ. */
export function questDone(w: SaveFile) {
  if (!linked(w)) return;
  w.system.exp++;
  say(w, "Keng! Nhiệm vụ hoàn thành. Phần thưởng: Kinh nghiệm sống +1.");
}

export function finishRookie(w: SaveFile, lines: readonly string[]) {
  w.system.unlocked = true;
  for (const l of lines) say(w, l);
}

export const startCashText = (w: SaveFile) => `${w.money.cash.toLocaleString("vi-VN")}đ`;
