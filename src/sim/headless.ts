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
  /** Giây thật để làm xong một ổ (lấy bánh → nướng → kẹp → gói), khoảng [lo, hi). */
  workSec: [number, number];
  /** Xác suất làm rớt ổ đang cầm. */
  dropRate: number;
  /** Xác suất kẹp thiếu một thứ. */
  defectRate: number;
  /** Xác suất đưa ly trà đá trước khi làm. */
  teaRate: number;
};

export const POLICIES: Record<string, Policy> = {
  /** Làm đúng, làm nhanh — trần trên của thông lượng. */
  greedy: { name: "greedy", workSec: [7, 10], dropRate: 0, defectRate: 0, teaRate: 0 },
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
    this.service = new Service({
      bus, hub: this.ctx.rng, saveId: w.saveId, day: w.progress.dayIndex,
      npcs: w.npcs, bags: w.shuffleBags,
      resumeAt: opts.resume ? this.ctx.clock.minutes : undefined,
    });
    bus.on("npc:left", (p) => { if (p.reason === "IMPATIENT") w.progress.today.lost++; });
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
    if (!this.work || this.work.forVisit !== c.id) {
      if (this.bot.next() < p.teaRate) s.serveTea();
      const dish = dishFor(c.order);
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
    s.serveDish(w.dish);
    this.work = null;
  }

  private drain() {
    const w = this.ctx.world;
    for (const ev of this.service.drain()) {
      if (ev.kind === "log") continue;
      if (ev.kind === "cost") { w.money.cash -= ev.amount; continue; }
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
export function nextDay(world: SaveFile) {
  world.progress.dayIndex++;
  world.progress.gameMinutes = DAY_START_MIN;
  world.progress.today = { served: 0, lost: 0, revenue: 0 };
}
