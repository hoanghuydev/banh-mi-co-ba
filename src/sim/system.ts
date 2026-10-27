import type { SaveFile } from "../core/save";
import { guestsOf } from "./demand";
import { fnv1a, Rng, splitmix32 } from "../core/rng";
import { CAL, buy, weatherOf } from "./econ";
import { GEAR_COUPON_PCT, giftGear } from "./gear";
import { EQUIP } from "./equipment";

export type RewardId =
  | "LUCK" | "TIEN_LE" | "KIM_KHO" | "NHAN_SAC" | "DANH_TIENG" | "BAT_NHIEM" | "THE_GIAM" | "THAN_HANH"
  | "LUONG_THAO" | "THIEN_DINH" | "MIEN_TO" | "TAI_CHUYEN" | "HOI_TAM"
  | "BAO_KHI" | "THE_DO_NGHE" | "NHAN_LIEU" | "PHONG_HANH" | "THIEN_CO";

export type Reward = {
  id: RewardId;
  name: string;
  tier: string;
  /** Trọng số trúng. */
  win: number;
  /** Trọng số được bốc lên vòng. */
  draw: number;
  /** Giá trị quy ra đồng theo doanh thu trung bình, để kiểm trần thưởng. */
  value: (avgRevenue: number) => number;
  effect: string;
  term?: string;
  desc?: string;
};

const none = () => 0;

export const BEAUTY_MAX = 12;
export const THIEN_DINH_SEC = 3;
export const DANH_TIENG_GUESTS = 2;
export const SWIFT_MUL = 0.8;
const GIFT_LOAVES = 6;
const GIFT_PATE = 20;
const GIFT_RAU = 12;
const GIFT_TRUNG = 10;

/** Cấp trung: thưởng kỳ vọng ≤ 2,5% doanh thu/ngày (`tests/phone-apps.test.ts`). */
export const REWARDS: Reward[] = [
  { id: "LUCK", name: "Chúc may mắn", tier: "", win: 34, draw: 40, value: none, effect: "" },
  { id: "TIEN_LE", name: "Tiền Lẻ Trong Túi Áo", tier: "Phổ thông", win: 14, draw: 20, value: (a) => cashOf("TIEN_LE", a), effect: "" },
  { id: "KIM_KHO", name: "Tiểu Kim Khố", tier: "Hiếm", win: 3, draw: 8, value: (a) => cashOf("KIM_KHO", a), effect: "", desc: "Tích tiểu thành đại." },
  { id: "NHAN_SAC", name: "Dung Nhan Tinh Tiến", tier: "Sơ cấp", win: 10, draw: 16, value: none, effect: "Nhan sắc +1.", desc: "Nhan sắc chính là chính nghĩa." },
  { id: "DANH_TIENG", name: "Danh Tiếng Lan Xa", tier: "Sơ cấp", win: 7, draw: 12, value: none, effect: `Khách hôm nay +${DANH_TIENG_GUESTS}.`, term: "hôm nay", desc: "Rượu thơm không sợ hẻm sâu." },
  { id: "BAT_NHIEM", name: "Bất Nhiễm Trần Thể", tier: "Sơ cấp", win: 8, draw: 12, value: none, effect: "Hôm nay không cần tẩy trần (rửa tay).", term: "hôm nay", desc: "Bụi trần không dính thân." },
  { id: "THIEN_DINH", name: "Thiền Định Chi Tâm", tier: "Sơ cấp", win: 6, draw: 10, value: none, effect: `Thời gian kiên nhẫn của khách +${THIEN_DINH_SEC} giây.`, term: "hôm nay", desc: "Tâm tĩnh, khách cũng tĩnh." },
  { id: "THE_GIAM", name: "Thẻ giảm giá", tier: "", win: 7, draw: 10, value: none, effect: "−10% một đơn Thực phẩm." },
  { id: "LUONG_THAO", name: "Thiên Giáng Lương Thảo", tier: "Phổ thông", win: 5, draw: 10, value: () => GIFT_VALUE, effect: `Nhận ngay ${GIFT_LOAVES} ổ bánh mì.`, desc: "Của trời cho." },
  { id: "MIEN_TO", name: "Địa Chủ Miễn Tô", tier: "Hiếm", win: 3, draw: 6, value: () => WAIVER_VALUE, effect: "Chi phí cố định hôm nay: 0đ.", term: "hôm nay", desc: "Chủ nhà hôm nay làm ngơ." },
  { id: "THAN_HANH", name: "Thần Hành Phù", tier: "Hiếm", win: 3, draw: 6, value: none, effect: "Một đơn Thực phẩm giao trong 1 giờ.", desc: "Ngàn dặm trong chớp mắt. Phí ship: 0đ." },
  { id: "TAI_CHUYEN", name: "Thiên Mệnh Tái Chuyển", tier: "Hiếm", win: 3, draw: 5, value: none, effect: "Được quay thêm một lần.", desc: "Số mệnh không phải một lần." },
  { id: "PHONG_HANH", name: "Phong Hành Chi Thủ", tier: "Sơ cấp", win: 6, draw: 10, value: none, effect: "Thao tác làm bánh nhanh hơn 20%.", term: "hôm nay", desc: "Tay nhanh hơn mắt." },
  { id: "THIEN_CO", name: "Thiên Cơ Dự Báo", tier: "Sơ cấp", win: 5, draw: 8, value: none, effect: "Xem trước thời tiết và lượng khách ngày mai.", desc: "Biết trước một ngày, đỡ lo một ngày." },
  { id: "NHAN_LIEU", name: "Thiên Giáng Nhân Liệu", tier: "Phổ thông", win: 3, draw: 8, value: () => FILLING_VALUE, effect: `Nhận ngay ${GIFT_PATE} phần pate thường, ${GIFT_RAU} phần rau, ${GIFT_TRUNG} quả trứng.`, desc: "Của trời cho, không lấy phí." },
  { id: "THE_DO_NGHE", name: "Thẻ giảm giá đồ nghề", tier: "", win: 3, draw: 8, value: () => GEAR_COUPON_VALUE, effect: `−${GEAR_COUPON_PCT * 100}% một đơn Đồ nghề.` },
  { id: "BAO_KHI", name: "Thiên Giáng Bảo Khí", tier: "Cực hiếm", win: 1, draw: 3, value: () => GEAR_GIFT_VALUE, effect: "Nhận một món đồ nghề nhỏ, giao và lắp sáng mai.", desc: "Trời cho mà không lấy là có tội." },
  { id: "HOI_TAM", name: "Hồi Tâm Chuyển Ý", tier: "Cực hiếm", win: 2, draw: 4, value: none, effect: "Sửa số sao và lời của một đánh giá.", desc: "Quay đầu là bờ." },
];

export const REWARD_BY_ID = Object.fromEntries(REWARDS.map((r) => [r.id, r])) as Record<RewardId, Reward>;

export const SLOTS = 8;
export const MIN_LUCK = 2;
export const CARD_CAP = 3;
export const LEDGER_AVG_DAYS = 3;
const FALLBACK_REVENUE = 450_000;
const GIFT_VALUE = 21_000;
const WAIVER_VALUE = 60_000;
const FILLING_VALUE = 64_000;
const GEAR_COUPON_VALUE = 40_000;
const GEAR_GIFT_VALUE = 200_000;

const CASH = {
  TIEN_LE: { pct: 0.055, min: 15_000, max: 40_000 },
  KIM_KHO: { pct: 0.165, min: 50_000, max: 110_000 },
} as const;

const round1k = (v: number) => Math.max(1000, Math.round(v / 1000) * 1000);

function cashOf(id: "TIEN_LE" | "KIM_KHO", avg: number) {
  const c = CASH[id];
  return round1k(Math.min(c.max, Math.max(c.min, avg * c.pct)));
}

export type SystemState = {
  /** `new` chưa thức tỉnh; `linked` đã nhận; `unlinked` đã từ chối hai lần. */
  stage: "new" | "linked" | "unlinked";
  refused: number;
  /** Đã xong 10 nhiệm vụ tân thủ. */
  unlocked: boolean;
  spunDay: number;
  /** Lượt quay thêm trong ngày, từ 0. */
  spunCount: number;
  extraSpins: number;
  /** Phần thưởng trong ngày `buffDay`; hết ngày là tắt. */
  buffDay: number;
  patience: boolean;
  crowd: boolean;
  clean: boolean;
  waiver: boolean;
  swift: boolean;
  /** Nhan sắc: mỗi cấp +1 giây kiên nhẫn của khách, vĩnh viễn, tối đa `BEAUTY_MAX`. */
  beauty: number;
  discount: number;
  gearCoupon: number;
  express: number;
  fix: number;
  exp: number;
  /** Chế độ trợ giúp: quay ngược quá 5 lần thì thưởng ×2 (trừ may mắn). */
  help: boolean;
  log: { day: number; text: string }[];
};

export const newSystem = (): SystemState => ({
  stage: "new", refused: 0, unlocked: false, spunDay: 0, spunCount: 0, extraSpins: 0, buffDay: 0,
  patience: false, crowd: false, clean: false, waiver: false, swift: false, beauty: 0,
  discount: 0, gearCoupon: 0, express: 0, fix: 0, exp: 0, help: false, log: [],
});

/** Thông báo cũ hơn chừng này ngày thì bỏ, khỏi phình save sau trăm ngày. */
export const LOG_KEEP_DAYS = 15;

export const linked = (w: SaveFile) => w.system.stage === "linked";

export function say(w: SaveFile, text: string) {
  const log = w.system.log;
  log.push({ day: w.progress.dayIndex, text });
  const from = w.progress.dayIndex - LOG_KEEP_DAYS + 1;
  if (log[0].day < from) w.system.log = log.filter((e) => e.day >= from);
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
  if (s.stage !== "linked") return false;
  if (s.extraSpins > 0 && s.spunDay === w.progress.dayIndex) return true;
  return (s.unlocked || w.progress.dayIndex >= 2) && s.spunDay < w.progress.dayIndex;
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

/** Số thứ tự lượt quay sắp tới trong ngày. */
const nextSpinNo = (w: SaveFile) => (w.system.spunDay === w.progress.dayIndex ? w.system.spunCount + 1 : 0);

/** Ô trúng của lượt quay sắp tới (chỉ số trên `wheelOf`). */
export function spinIndex(w: SaveFile): number {
  const slots = wheelOf(w);
  const rng = new Rng(splitmix32(fnv1a(`${w.saveId}|spin|${w.progress.dayIndex}|${nextSpinNo(w)}`)));
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

export type SpinResult = { id: RewardId; lines: string[] };

const LUCK_AT = (day: number) => (day % 2 ? "Hệ thống đã cố gắng." : "Hệ thống không tiếp nhận khiếu nại.");

const money = (v: number) => `${v.toLocaleString("vi-VN")}đ`;

/** Tiền thưởng thay cho phần thưởng đã chạm giới hạn. */
function cashLines(w: SaveFile, id: "TIEN_LE" | "KIM_KHO"): string[] {
  const r = REWARD_BY_ID[id];
  const v = cashOf(id, avgRevenue(w));
  w.money.cash += v;
  return [
    id === "KIM_KHO"
      ? `Keng! Chúc mừng ký chủ thu được 【${r.name}】(${r.tier}).`
      : `Keng! Chúc mừng ký chủ thu được 【${r.name}】×1.`,
    `Hiệu quả: +${money(v)}.`,
    ...(r.desc ? [`Mô tả: ${r.desc}`] : []),
  ];
}

function capLines(w: SaveFile, what: string): string[] {
  const v = cashOf("TIEN_LE", avgRevenue(w));
  w.money.cash += v;
  return [what, "Tự động chuyển hoá thành 【Tiền Lẻ Trong Túi Áo】.", `Hiệu quả: +${money(v)}.`];
}

function skillLines(r: Reward): string[] {
  return [
    `Keng! Chúc mừng ký chủ thu được kỹ năng bị động 【${r.name}】(${r.tier}).`,
    `Hiệu quả: ${r.effect}`, `Thời hạn: ${r.term}.`, `Mô tả: ${r.desc}`,
  ];
}

/** Quay một lần: áp thưởng và ghi nhật ký Hệ thống. */
export function spin(w: SaveFile): SpinResult | null {
  if (!canSpin(w)) return null;
  const s = w.system;
  const day = w.progress.dayIndex;
  const id = wheelOf(w)[spinIndex(w)];
  const r = REWARD_BY_ID[id];
  if (s.spunDay === day) { s.spunCount++; s.extraSpins--; } else { s.spunDay = day; s.spunCount = 0; }
  const today = () => { s.buffDay = day; };
  let lines: string[] = [];
  switch (id) {
    case "LUCK":
      lines = ["Keng! Phần thưởng: Chúc may mắn ×1.", LUCK_AT(day)];
      break;
    case "TIEN_LE":
    case "KIM_KHO":
      lines = cashLines(w, id);
      break;
    case "NHAN_SAC":
      if (s.beauty >= BEAUTY_MAX) {
        lines = capLines(w, `Keng! Nhan sắc ký chủ đã đạt cảnh giới Nghiêng Nước Nghiêng Thành (+${BEAUTY_MAX} giây). Không thể xinh hơn nữa.`);
      } else {
        s.beauty++;
        lines = [
          `Keng! Chúc mừng ký chủ thu được 【${r.name}】(${r.tier}).`,
          `Hiệu quả: nhan sắc +1 (cấp ${s.beauty}/${BEAUTY_MAX}). Kiên nhẫn của khách +1 giây, vĩnh viễn, cộng dồn. Hiện tại: +${s.beauty} giây.`,
          `Mô tả: ${r.desc}`,
        ];
      }
      break;
    case "DANH_TIENG":
      today(); s.crowd = true; lines = skillLines(r);
      break;
    case "BAT_NHIEM":
      today(); s.clean = true; lines = skillLines(r);
      break;
    case "THIEN_DINH":
      today(); s.patience = true; lines = skillLines(r);
      break;
    case "MIEN_TO":
      today(); s.waiver = true;
      lines = [`Keng! Chúc mừng ký chủ thu được 【${r.name}】(${r.tier}).`, `Hiệu quả: ${r.effect}`, `Thời hạn: ${r.term}.`, `Mô tả: ${r.desc}`];
      break;
    case "LUONG_THAO":
      buy(w.inventory, "BANH", GIFT_LOAVES, day);
      lines = [`Keng! Chúc mừng ký chủ thu được 【${r.name}】×1.`, `Hiệu quả: ${r.effect}`, `Mô tả: ${r.desc}`];
      break;
    case "THE_GIAM":
      if (s.discount >= CARD_CAP) lines = capLines(w, "Keng! Thẻ giảm giá đã đạt giới hạn 3 trương.");
      else { s.discount++; lines = ["Keng! Chúc mừng ký chủ thu được Thẻ giảm giá.", `Hiệu quả: ${r.effect}`]; }
      break;
    case "THAN_HANH":
      if (s.express >= CARD_CAP) lines = capLines(w, "Keng! Thần Hành Phù đã đạt giới hạn 3 trương.");
      else { s.express++; lines = [`Keng! Chúc mừng ký chủ thu được 【${r.name}】×1 (${r.tier}).`, `Hiệu quả: ${r.effect}`, `Mô tả: ${r.desc}`]; }
      break;
    case "PHONG_HANH":
      today(); s.swift = true; lines = skillLines(r);
      break;
    case "THIEN_CO": {
      const wx = CAL.weatherInfo[weatherOf(day + 1)];
      lines = [
        `Keng! Chúc mừng ký chủ thu được 【${r.name}】(${r.tier}).`,
        `Hiệu quả: ngày mai ${wx.label}, khách chừng ${guestsOf(w, day + 1)} người.`,
        `Mô tả: ${r.desc}`,
      ];
      break;
    }
    case "NHAN_LIEU":
      buy(w.inventory, "PATE", GIFT_PATE, day);
      buy(w.inventory, "RAU", GIFT_RAU, day);
      buy(w.inventory, "TRUNG", GIFT_TRUNG, day);
      lines = [`Keng! Chúc mừng ký chủ thu được 【${r.name}】×1.`, `Hiệu quả: ${r.effect}`, `Mô tả: ${r.desc}`];
      break;
    case "THE_DO_NGHE":
      if (s.gearCoupon >= CARD_CAP) lines = capLines(w, "Keng! Thẻ giảm giá đồ nghề đã đạt giới hạn 3 trương.");
      else { s.gearCoupon++; lines = ["Keng! Chúc mừng ký chủ thu được Thẻ giảm giá đồ nghề.", `Hiệu quả: ${r.effect}`]; }
      break;
    case "BAO_KHI": {
      const g = giftGear(w);
      if (!g) {
        const k = cashLines(w, "KIM_KHO");
        lines = ["Keng! Xe không còn chỗ cho bảo khí. Tự động chuyển hoá thành 【Tiểu Kim Khố】.", ...k.slice(1)];
      } else {
        w.ach.baoKhi++;
        lines = [`Keng! Chúc mừng ký chủ thu được 【${r.name}】(${r.tier}).`, `Hiệu quả: nhận ${EQUIP[g].name}, giao và lắp sáng mai.`, `Mô tả: ${r.desc}`];
      }
      break;
    }
    case "HOI_TAM":
      if (s.fix >= CARD_CAP) lines = capLines(w, "Keng! Hồi Tâm Chuyển Ý đã đạt giới hạn 3 trương.");
      else {
        s.fix++;
        lines = [`Keng! Chúc mừng ký chủ thu được 【${r.name}】×1 (${r.tier}).`, `Hiệu quả: ${r.effect}`,
          "Giới hạn: không áp dụng cho đánh giá đau bụng.", `Mô tả: ${r.desc}`];
      }
      break;
    case "TAI_CHUYEN":
      s.extraSpins++;
      lines = [`Keng! Chúc mừng ký chủ thu được 【${r.name}】(${r.tier}).`, `Hiệu quả: ${r.effect}`, `Mô tả: ${r.desc}`];
      break;
  }
  w.ach.luckRun = id === "LUCK" ? w.ach.luckRun + 1 : 0;
  for (const l of lines) say(w, l);
  return { id, lines };
}

/** Kiên nhẫn cộng thêm: nhan sắc vĩnh viễn + thiền định trong ngày. */
export const patienceBonusSec = (w: SaveFile) =>
  (linked(w) ? w.system.beauty : 0) + (todays(w) && w.system.patience ? THIEN_DINH_SEC : 0);
export const extraGuests = (w: SaveFile) => (todays(w) && w.system.crowd ? DANH_TIENG_GUESTS : 0);
export const cleanHandsToday = (w: SaveFile) => todays(w) && w.system.clean;
export const swiftToday = (w: SaveFile) => todays(w) && w.system.swift;
export const feeWaivedToday = (w: SaveFile) => todays(w) && w.system.waiver;

const todays = (w: SaveFile) => w.system.buffDay === w.progress.dayIndex;

export function clearBuffsIfStale(w: SaveFile) {
  const s = w.system;
  if (s.buffDay !== w.progress.dayIndex) { s.patience = false; s.crowd = false; s.clean = false; s.waiver = false; s.swift = false; }
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
