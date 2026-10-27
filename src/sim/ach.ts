// Luật chấm danh hiệu: bản đã đạt lưu theo máy, bộ đếm theo ván nằm trong SaveFile.
import type { SaveFile } from "../core/save";
import type { Bus } from "../core/eventbus";
import { platform as defaultPlatform, type Platform } from "../core/platform";
import { ACH_BY_ID, ACH_LIST, TIER_LABEL, type AchDef } from "../content/ach";
import { NPCS } from "../content/npcs";
import { capacity, has, used } from "./equipment";
import { average } from "./reviews";
import { tourStep } from "./tour";
import { SUPPLIERS } from "./suppliers";
import { MENU_BOARD } from "./menu";
import { linked, say } from "./system";

/** Bộ đếm cộng dồn theo ván cho các danh hiệu cần nhớ. */
export type AchState = {
  tea: number;
  /** Khách bỏ đi vì thấy ổ rơi. */
  soiled: number;
  /** Mọi lần ổ rơi, khách thấy hay không. */
  dropped: number;
  burnt: number;
  burntThru: number;
  resold: number;
  /** Mã nhà cung cấp đã đặt hàng. */
  sup: string[];
  baoKhi: number;
  /** Số lượt quay trượt liên tiếp ở ô may mắn. */
  luckRun: number;
  /** Trong ngày `dayNo`, mọi món đều ở giá rẻ nhất / đắt nhất từ đầu buổi tới giờ. */
  dayNo: number;
  low: boolean;
  high: boolean;
};

export const newAch = (): AchState => ({
  tea: 0, soiled: 0, dropped: 0, burnt: 0, burntThru: 0, resold: 0, sup: [], baoKhi: 0, luckRun: 0,
  dayNo: 0, low: true, high: true,
});

const KEY = "byesep.ach";

type Store = { got: Record<string, number>; seen: string[] };

const cache = new WeakMap<Platform, Store>();

function load(p: Platform): Store {
  let s = cache.get(p);
  if (!s) {
    try {
      const raw = JSON.parse(p.read(KEY) ?? "null");
      s = { got: raw?.got ?? {}, seen: raw?.seen ?? [] };
    } catch {
      s = { got: {}, seen: [] };
    }
    cache.set(p, s);
  }
  return s;
}

const save = (p: Platform, s: Store) => { cache.set(p, s); p.write(KEY, JSON.stringify(s)); };

/** Mã danh hiệu → ngày đạt. */
export const achGot = (p: Platform = defaultPlatform): Record<string, number> => load(p).got;

export const achSeen = (p: Platform = defaultPlatform): string[] => load(p).seen;

/** Đã đạt mà chưa xem trong app. */
export function achUnseen(p: Platform = defaultPlatform): number {
  const s = load(p);
  return Object.keys(s.got).filter((id) => !s.seen.includes(id)).length;
}

/** Không truyền `id` thì đánh dấu xem hết. */
export function markSeen(id?: string, p: Platform = defaultPlatform) {
  const s = load(p);
  const ids = id ? [id] : Object.keys(s.got);
  s.seen = [...new Set([...s.seen, ...ids.filter((x) => x in s.got)])];
  save(p, s);
}

const FRESH_MAX = 8;
const fresh: AchDef[] = [];

/** Bỏ các danh hiệu chưa báo; gọi khi vào ván mới. */
export const clearAch = () => { fresh.length = 0; };

/** Lấy một danh hiệu vừa đạt để báo lên màn hình; hết thì undefined. */
export const takeAch = () => fresh.shift();

function grant(w: SaveFile, id: string, p: Platform): boolean {
  const s = load(p);
  if (id in s.got) return false;
  const def = ACH_BY_ID[id];
  s.got[id] = w.progress.dayIndex;
  save(p, s);
  fresh.push(def);
  if (fresh.length > FRESH_MAX) fresh.shift();
  if (linked(w)) {
    say(w, `Keng! Chúc mừng ký chủ thu được danh hiệu 【${def.name}】(${TIER_LABEL[def.tier]}).`);
    say(w, "Hiệu quả: không có. Danh hiệu chỉ để trưng.");
    say(w, `Mô tả: ${def.desc}`);
  }
  return true;
}

// ----------------------------------------------------------------- số liệu

const servedAll = (w: SaveFile) =>
  w.ledger.reduce((a, r) => a + (r.day === w.progress.dayIndex ? 0 : r.served), 0) + w.progress.today.served;

const burntAll = (w: SaveFile) => w.ach.burnt + (w.ach.burntThru < w.progress.dayIndex ? w.progress.today.burnt ?? 0 : 0);

const reviews = (w: SaveFile) => w.reviews.list;
const stars5 = (w: SaveFile) => reviews(w).filter((r) => r.stars === 5 && !r.noise).length;
const stars1 = (w: SaveFile) => reviews(w).filter((r) => r.stars === 1).length;

const wonBefore = (w: SaveFile, day: number) => !!w.flags.won && Number(w.flags.wonDay) < day;

/** `n` ngày cuối nối liền nhau và đều thoả `f`. */
function streak(w: SaveFile, n: number, f: (r: SaveFile["ledger"][number]) => boolean): boolean {
  const rows = w.ledger.slice(-n);
  return rows.length === n && rows[n - 1].day - rows[0].day === n - 1 && rows.every(f);
}

const talked = (w: SaveFile) => NPCS.filter((n) => (w.npcs[n.id]?.talksDone?.length ?? 0) > 0).length;

/** Lấy mẫu giá: mốc rẻ nhất / đắt nhất phải giữ suốt buổi. */
function samplePrices(w: SaveFile) {
  const a = w.ach;
  if (a.dayNo !== w.progress.dayIndex) { a.dayNo = w.progress.dayIndex; a.low = true; a.high = true; }
  const picks = MENU_BOARD.filter((m) => m.unlockDay <= w.progress.dayIndex).map((m) => w.menu.price[m.id] ?? 1);
  a.low &&= picks.every((x) => x === 0);
  a.high &&= picks.every((x) => x === 2);
}

/** Điều kiện đọc thẳng từ trạng thái hiện tại; chấm lúc nào cũng được. */
const STATE: Record<string, (w: SaveFile) => boolean> = {
  dau_xuoi: (w) => servedAll(w) >= 1,
  nang_nhat: (w) => servedAll(w) >= 100,
  kien_tha: (w) => servedAll(w) >= 1000,
  gop_gio: (w) => servedAll(w) >= 1600,
  co_tieng: (w) => reviews(w).length >= 1,
  hoc_an: (w) => tourStep(w) === "XONG",
  troi_xui: linked,
  menh_ta: (w) => w.system.stage === "unlinked",
  vui_long: (w) => stars5(w) >= 1,
  tram_hoa: (w) => stars5(w) >= 120,
  mot_nang: (w) => w.progress.dayIndex >= 31,
  dung_mui: (w) => w.progress.dayIndex >= 61,
  lua_thu: (w) => (w.progress.today.burnt ?? 0) >= 5,
  lo_bat_quai: (w) => (w.progress.today.burnt ?? 0) >= 10,
  ngua_co: (w) => reviews(w).some((r) => r.food),
  chin_nguoi: (w) => stars1(w) >= 1,
  tai_bay: (w) => stars1(w) >= 5,
  gia_cat_co: (w) => (w.progress.today.priceLost ?? 0) >= 5,
  o_hien: (w) => w.ach.tea >= 20,
  cua_ben: (w) => w.ach.resold >= 1,
  cua_an: (w) => w.money.cash >= 10_000_000,
  tien_vao: (w) => w.money.cash >= 20_000_000,
  dat_tom: (w) => w.econ.today.soldOut > 0,
  co_qua: (w) => reviews(w).filter((r) => r.reply).length >= 10,
  loi_ra: (w) => reviews(w).length >= 100,
  quay_dau: (w) => reviews(w).some((r) => r.edited),
  nuoc_do: (w) => w.ach.soiled >= 10,
  benh_tu: (w) => !!w.flags.shutdown,
  nha_tan: (w) => !!w.flags.broke,
  pha_gia: (w) => !!w.flags.broke && Number(w.flags.brokeDay) <= 3,
  quen_mat: (w) => Object.values(w.npcs).some((n) => n.visits >= 50),
  tien_nao: (w) => has(w.equipment, "TU_MAT"),
  buon_co_ban: (w) => w.ach.sup.length >= SUPPLIERS.length,
  rau_ong: (w) => reviews(w).some((r) => r.noise === "nham"),
  tren_troi: (w) => w.ach.baoKhi > 0,
  tieng_lanh: (w) => reviews(w).length >= 50 && average(w) >= 4.2,
  them_ban: (w) => talked(w) >= 12,
  dau_vao: (w) => capacity(w.equipment) >= 14 && used(w.equipment) >= capacity(w.equipment),
  da_trang: (w) => w.ach.luckRun >= 8,
  chim_sa: (w) => w.system.beauty >= 10,
  mo_may: (w) => !!w.flags.won,
  buon_may: (w) => wonBefore(w, 100),
  mot_von: (w) => wonBefore(w, 90),
  sach_nhu: (w) => !!w.flags.won && burntAll(w) === 0 && w.ach.dropped === 0,
  hai_ban_tay: (w) => !!w.flags.won && !linked(w),
};

/** Điều kiện cần ngày đã chốt sổ; chỉ chấm ở `checkEvening`. */
const DAYS: Record<string, (w: SaveFile) => boolean> = {
  vang_chua: (w) => w.ledger.at(-1)?.served === 0 && w.econ.today.closedAtMin === null,
  that_lung: (w) => streak(w, 3, (r) => r.revenue < r.cost),
  ngoi_cho: (w) => streak(w, 3, (r) => r.served < 5),
  an_ngon: (w) => streak(w, 30, (r) => !r.sick),
  lay_cong: (w) => w.ach.low && w.progress.today.served >= 25,
  dat_xat: (w) => w.ach.high && w.progress.today.served >= 10 && w.progress.today.lost === 0,
};

function run(w: SaveFile, rules: Record<string, (w: SaveFile) => boolean>, p: Platform) {
  const got = load(p).got;
  for (const def of ACH_LIST) {
    const rule = rules[def.id];
    if (rule && !(def.id in got) && rule(w)) grant(w, def.id, p);
  }
}

/** Chấm điều kiện trạng thái; gọi khi quầy đang chạy và sau khi chốt thắng/thua. */
export function checkLive(w: SaveFile, p: Platform = defaultPlatform) {
  samplePrices(w);
  run(w, STATE, p);
}

/** Chốt ngày, gọi lúc `evening:done`, TRƯỚC `markWin`/`markShutdown`/`markBroke`. */
export function checkEvening(w: SaveFile, p: Platform = defaultPlatform) {
  checkLive(w, p);
  run(w, DAYS, p);
  if (w.ach.burntThru < w.progress.dayIndex) {
    w.ach.burnt += w.progress.today.burnt ?? 0;
    w.ach.burntThru = w.progress.dayIndex;
  }
}

const TICK_SEC = 1;
let acc = 0;

/** Mỗi frame; chấm thật mỗi giây. */
export function achTick(w: SaveFile, dtSec: number, p: Platform = defaultPlatform) {
  acc += dtSec;
  if (acc < TICK_SEC) return;
  acc = 0;
  checkLive(w, p);
}

/** Nghe trà đá và ổ rơi; `getW` lấy thế giới hiện tại vì "Chơi lại ngày này" thay cả `world`. */
export function wireAch(bus: Bus, getW: () => SaveFile): () => void {
  const offs = [
    bus.on("npc:left", (e) => { if (e.reason === "SOILED_FOOD") getW().ach.soiled++; }),
    bus.on("stim:emitted", (e) => { if (e.stimId === "DROPPED_FOOD") getW().ach.dropped++; }),
    bus.on("attention:toolUsed", (e) => { if (e.tool === "TRA_DA") getW().ach.tea++; }),
  ];
  return () => { for (const off of offs) off(); };
}
