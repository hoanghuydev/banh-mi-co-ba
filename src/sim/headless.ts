/**
 * Chạy một buổi bán KHÔNG render — P0-03 §2.2 "công cụ đáng giá nhất trong danh sách".
 *
 * Chạy được vì `sim/` không import Phaser (cổng CI của P0-01). Dùng để: đo nhịp một
 * ngày, tune cân bằng, tìm chiến lược áp đảo (§8), và kiểm TẤT ĐỊNH (chạy hai lần
 * cùng seed + cùng input → trace bus giống hệt từng byte).
 *
 * Vòng frame y hệt `StallScene`: cùng `runFrame`, cùng thứ tự 7 bước. Chỗ khác
 * duy nhất là "tay người chơi" được thay bằng một con bot có policy.
 */
import { standDeps } from "./day";
import { settleNight } from "./night";
import { basketFor, bedtime, botPayDues, buyBasket, dawn, eveningCounting, forcedSell, neighborTick } from "./day";
import { EQUIP, buyEquip, has, priceVnd, resellable, whyNot, type EquipId } from "./equipment";
import { dishQuality, portionsFor, take } from "./econ";
import { Bus } from "../core/eventbus";
import { GameContext } from "../core/context";
import { DAY_START_MIN } from "../core/clock";
import { memoryPlatform, type Platform } from "../core/platform";
import type { SaveFile } from "../core/save";
import type { StimId, StallZone } from "../core/types";
import type { Rng } from "../core/rng";
import { Service } from "./service";
import { SALIENCE } from "./perception";
import { runFrame } from "./frame";
import { diffDish, dishFor, type Ingredient } from "./order";
import { orderDefectKey } from "../core/stimid";

export type Policy = {
  name: string;
  /** Đi chợ đủ cho mấy ổ (P3). Mặc định 16. */
  buyLoaves?: number;
  /** Mua pate nào — bà Tám (ngon, đắt) hay thường (rẻ, dở hơn). */
  pate?: "PATE_NHA" | "PATE_THUONG";
  /** Tỉ lệ ghi sổ khi khách mua chịu (0..1). Mặc định 1. */
  writeDebts?: number;
  /** Mua đồ nghề theo lịch [ngày, món] (P3-04 §2.6 ba build tham chiếu) — tối ngày đó, nếu đủ tiền. */
  build?: [number, EquipId][];
  /** Giây thật để làm xong một ổ (lấy bánh → nướng → kẹp → gói), khoảng [lo, hi). */
  workSec: [number, number];
  /** Xác suất làm rớt ổ đang cầm. */
  dropRate: number;
  /** Xác suất kẹp thiếu một thứ. */
  defectRate: number;
  /** Xác suất đưa ly trà đá trước khi làm. */
  teaRate: number;
  /** Người quen (đã nghe đơn ≥ 3 lần): xác suất bot làm SẴN ổ quen trước khi khách gọi (T-B). */
  anticipate?: number;
};

/** P3-04 §2.6 — build "Vệ sinh" tham chiếu (ngày:món). */
export const BUILD_VE_SINH: [number, EquipId][] = [
  [2, "KEP_GAP"], [4, "THUNG_RAC"], [5, "KHAN_3_MAU"], [5, "THOT_RIENG"], [6, "LONG_BAN"], [14, "BANG_QR"],
  [12, "VOI_BON"], [15, "DAO_BEN"], [19, "GIA_TREO"], [22, "TU_MAT"], [29, "GHE_BAN"], [33, "BINH_TRA"],
];

export const POLICIES: Record<string, Policy> = {
  /** Làm đúng, làm nhanh — trần trên của thông lượng. */
  // P4-02 §2.7: 14–28 khách/ngày → bot làm ăn giỏi đi chợ cho ~20 ổ
  greedy: { name: "greedy", workSec: [7, 10], dropRate: 0, defectRate: 0, teaRate: 0, build: BUILD_VE_SINH, anticipate: 0.5, buyLoaves: 20 },
  /** Người mới: chậm, thỉnh thoảng rớt, thỉnh thoảng thiếu. */
  newbie: { name: "newbie", workSec: [12, 20], dropRate: 0.08, defectRate: 0.15, teaRate: 0.1 },
  /** Người chơi "khéo": hay dùng trà đá. */
  tea: { name: "tea", workSec: [9, 13], dropRate: 0.04, defectRate: 0.05, teaRate: 0.6 },
};

/** Bot gói bánh trước khi đưa bao lâu (giây) — thời gian đi từ thớt ra quầy. */
const WRAP_BEFORE_SERVE = 3;

/** Thao tác chèn vào giữa buổi (test). `t` = giây thật kể từ lúc mở quầy. */
export type Inject = (t: number, h: HeadlessStall) => void;

export class HeadlessStall {
  readonly ctx: GameContext;
  readonly service: Service;
  elapsed = 0;
  closed = false;
  frames = 0;
  private bot: Rng;
  private breadQ = 1;
  /** false = chế độ không giới hạn thời gian (CANON §15.2). */
  private pressure: boolean;
  private work: { left: number; forVisit: string; dropped: boolean; dish: Ingredient[]; wrapped: boolean } | null = null;

  constructor(
    world: SaveFile,
    readonly policy: Policy = POLICIES.greedy,
    opts: { bus?: Bus; platform?: Platform; resume?: boolean; pressure?: boolean } = {},
  ) {
    const bus = opts.bus ?? new Bus(true);
    this.ctx = new GameContext(world, bus, opts.platform ?? memoryPlatform());
    const w = this.ctx.world;
    if (opts.resume) {
      this.ctx.rng.fromJSON(w.saveId, w.progress.dayIndex, w.rng.counters);
      this.ctx.clock.reset(w.progress.gameMinutes);
    } else {
      this.ctx.rng.beginDay(w.saveId, w.progress.dayIndex);
      this.ctx.clock.reset(DAY_START_MIN);
      w.progress.today = { served: 0, lost: 0, revenue: 0 };
      bus.emit("day:started", { dayIndex: w.progress.dayIndex, daySeed: this.ctx.rng.daySeed, weather: w.progress.weather });
    }
    this.ctx.setScene("Stall");
    this.pressure = opts.pressure ?? true;
    this.ctx.clock.scaleMul = this.pressure ? 1 : 0.5;
    this.bot = this.ctx.rng.derive(`bot:${policy.name}`);
    // Rạng sáng + đi chợ — bot mua đủ cho `buyLoaves` ổ (không tối ưu, không nhìn giá)
    if (!opts.resume) {
      dawn(w);
      if (w.progress.dayIndex > 1 || policy.buyLoaves) buyBasket(w, basketFor(w.inventory, policy.buyLoaves ?? 16, w.progress.dayIndex, policy.pate ?? "PATE_NHA"));
    }
    // bảng QR tốn một buổi sáng (P3-04 E1): hôm đó 8h mới mở hàng
    const lateOpen = !opts.resume && w.flags.lateOpenDay === w.progress.dayIndex;
    if (lateOpen) this.ctx.clock.reset(8 * 60);
    this.service = new Service({
      bus, hub: this.ctx.rng, saveId: w.saveId, day: w.progress.dayIndex,
      npcs: w.npcs, bags: w.shuffleBags, dialog: w.dialogState, gossip: w.gossip, notebook: w.notebook,
      ...standDeps(w),
      debts: w.money.debtsOwedToPlayer, till: w.econ, allowFalseMemory: w.a11y.allowFalseMemory ?? true,
      equip: w.equipment, loaOn: (w.econ?.loaOffUntil ?? 0) < w.progress.dayIndex,
      story: w.story,
      resumeAt: opts.resume || lateOpen ? this.ctx.clock.minutes : undefined,
    });
    bus.on("npc:left", (p) => { if (p.reason === "IMPATIENT") w.progress.today.lost++; });
    // mở khoá vòi rửa (P3-04 C1): sau lần đầu có khách CHẮC CHẮN thấy tay dơ
    bus.on("perception:confirmed", (p) => { if (p.stimId === "DIRTY_HANDS") w.flags.dirtyHandsConfirmed = true; });
  }

  get bus() { return this.ctx.bus; }

  private emit(id: StimId, zone: StallZone) {
    this.bus.emit("stim:emitted", { stimId: id, zone, salience: SALIENCE[id], at: this.elapsed });
  }

  /** Tay người chơi — chạy ở bước craft, đúng chỗ tay thật chạy trong StallScene. */
  private act(dt: number) {
    const s = this.service;
    const c = s.front;
    if (!c || c.phase !== "waiting" || !c.order) { this.work = null; return; }
    const p = this.policy;
    const inv = this.ctx.world.inventory, day = this.ctx.world.progress.dayIndex;
    if (!this.work || this.work.forVisit !== c.id) {
      if (this.bot.next() < p.teaRate) s.serveTea();
      // lấy ổ ở kệ — hết bánh thì khách về không (Service.soldOut)
      const bread = take(inv, "bread", 1, day);
      if (!bread.length) { s.soldOut = true; this.work = null; return; }
      this.breadQ = bread[0];
      const dish = dishFor(c.order).filter((ing) => portionsFor(inv, ing, day) > 0);
      if (this.bot.next() < p.defectRate && dish.length) dish.splice(this.bot.int(0, dish.length), 1);
      this.work = { left: this.bot.range(p.workSec[0], p.workSec[1]), forVisit: c.id, dropped: false, dish, wrapped: false };
    }
    const w = this.work;
    w.left -= dt;
    if (!w.dropped && w.left < 2 && this.bot.next() < p.dropRate * dt) {
      w.dropped = true;
      this.emit("DROPPED_FOOD", "HANDS");
      w.left += 4;                                             // làm lại ổ khác
    }
    // "Gói lại" ~3 s trước khi đưa, như người thật đi từ thớt ra quầy — lỗi trong ổ phát
    // lúc gói (giống StallScene.finishDish), mỗi lỗi một khoá riêng của ổ này + người này.
    if (!w.wrapped && w.left <= WRAP_BEFORE_SERVE) {
      w.wrapped = true;
      for (const d of diffDish(c.order, w.dish)) {
        if (d.kind === "STUFFED") continue;
        this.bus.emit("stim:emitted", {
          stimId: "ORDER_DEFECT", zone: "BOARD", salience: d.sCounter * d.magnitude, at: this.elapsed,
          key: orderDefectKey(c.id, d.kind, d.item),
        });
      }
    }
    if (w.left > 0) return;
    // gói xong mới trừ kho (giống StallScene): phần nào hết thì ổ thiếu phần đó
    const parts: { ing: typeof w.dish[number]; q: number }[] = [];
    const served: typeof w.dish = [];
    for (const ing of w.dish) {
      const q = take(inv, ing, 1, day);
      if (q.length) { parts.push({ ing, q: q[0] }); served.push(ing); }
    }
    // làm sẵn ổ quen trước khi khách mở miệng (T-B, P4-01 "chuẩn bị ổ chú Tư từ 6h42")
    const known = c.npc && (this.ctx.world.npcs[c.memKey]?.heard ?? 0) >= 3 && this.bot.next() < (p.anticipate ?? 0);
    s.serveDish(served, { quality: dishQuality(this.breadQ, parts), readyAt: known ? c.orderedAt - 1 : undefined });
    this.work = null;
  }

  private drain() {
    const w = this.ctx.world;
    for (const ev of this.service.drain()) {
      if (ev.kind === "log") continue;
      if (ev.kind === "cost") { w.money.cash -= ev.amount; w.econ.today.fixed += ev.amount; continue; }
      // bot ghi sổ nợ theo chính sách (mặc định: ghi hết)
      if (ev.kind === "credit") { w.progress.today.served++; if (this.bot.next() < (this.policy.writeDebts ?? 1)) ev.record.playerWrote = ev.record.trueAmount; continue; }
      if (ev.kind === "repay") { w.money.cash += ev.amount; w.progress.today.revenue += ev.amount; continue; }
      // bot không trò chuyện — nó không có mắt để đọc bốn lựa chọn
      if (ev.kind === "talkOffer") continue;
      w.money.cash += ev.amount;
      w.progress.today.revenue += ev.amount;
      w.progress.today.served++;
      this.bus.emit("money:changed", { delta: ev.amount, balance: w.money.cash, reason: "SALE" });
    }
  }

  /** Một frame — cùng `runFrame` với StallScene. */
  step(rawMs = 1000 / 30, inject?: Inject) {
    this.frames++;
    runFrame({
      clock: (raw) => {
        this.ctx.clock.busy = this.service.busy;
        return this.closed ? 0 : this.ctx.clock.advance(raw);
      },
      input: () => { inject?.(this.elapsed, this); },
      craft: (dt) => this.act(dt),
      perception: (dt) => { this.elapsed += dt; this.service.perceive(dt, this.elapsed); },
      npc: (dt) => {
        this.service.tickNpcs(dt, { minutes: this.ctx.clock.minutes, pressure: this.pressure, dayOver: this.ctx.clock.isOver });
        this.drain();
      },
      dialog: (dt) => {
        this.service.tickDialog(dt);
        this.drain();
        if (this.ctx.clock.isOver && !this.service.busy) this.close();
      },
      render: () => {},
      renderPaused: () => {},
    }, rawMs);
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    const w = this.ctx.world;
    // tối nay: mua đồ nghề theo lịch của chính sách, giữ lại một khoản đệm để còn đi chợ
    for (const [d, id] of this.policy.build ?? []) {
      if (d > w.progress.dayIndex || has(w.equipment, id)) continue;
      if (w.money.cash - priceVnd(id) < 250_000) break;
      if (whyNot(id, w.equipment, w.money.cash, w.progress.dayIndex, w.flags)) continue;
      buyEquip(id, w.equipment, w.money, w.econ);
      if (EQUIP[id].costsMorning) w.flags.lateOpenDay = w.progress.dayIndex + 1;
    }
    const t = w.progress.today;
    this.bus.emit("stall:closed", { reason: "CLOCK", served: t.served, revenue: t.revenue, lost: t.lost });
    this.bus.emit("day:ended", { dayIndex: w.progress.dayIndex, summary: { ...t } });
    const row = { day: w.progress.dayIndex, revenue: t.revenue, cost: 0, served: t.served, lost: t.lost };
    const i = w.ledger.findIndex((r) => r.day === row.day);
    if (i >= 0) w.ledger[i] = row; else w.ledger.push(row);
    this.service.dispose();
  }

  /** Chạy tới khi đóng quầy (hoặc tới `until` trả true). Trả số giây THẬT của buổi bán. */
  run(opts: { inject?: Inject; until?: (h: HeadlessStall) => boolean; maxFrames?: number } = {}) {
    const max = opts.maxFrames ?? 30 * 60 * 30;               // 30 phút thật là quá đủ
    while (!this.closed && this.frames < max) {
      this.step(1000 / 30, opts.inject);
      if (opts.until?.(this)) break;
    }
    return this.elapsed;
  }
}

/** Sang ngày mới trên cùng một world — y như EveningScene → DayScene làm. */
export function nextDay(world: SaveFile, bus?: Bus, opts: { payDues?: boolean; medicine?: boolean } = {}) {
  eveningCounting(world);
  neighborTick(world);
  if (opts.payDues !== false) botPayDues(world, opts.medicine);
  bedtime(world);
  if (world.econ.mustSell) {
    const list = resellable(world.equipment).sort((a, b) => priceVnd(a) - priceVnd(b));
    if (list[0]) forcedSell(world, list[0]);
  }
  settleNight(world, bus);
  world.progress.dayIndex++;
  world.progress.gameMinutes = DAY_START_MIN;
  world.progress.today = { served: 0, lost: 0, revenue: 0 };
}
