// Buổi bán không render, cùng `runFrame` với `StallScene`, tay người chơi thay bằng bot.
import { basketFor, buyBasket, dawn, dayDeps, eveningCounting, neighborTick } from "./day";
import { EQUIP, buyEquip, has, priceVnd, whyNot, type EquipId } from "./equipment";
import { FULL_TASTE, dishQuality, portionsFor, sickChance, take, takeFull, tasteFlaws, type Portion, type PricePick, type Quality, type Taste } from "./econ";
import { MENU_IDS } from "./menu";
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
import { openTilesFor, setOpenTiles } from "../world/map";
import { enqueue, rollReview } from "./reviews";
import { guestsOf } from "./demand";
import { wireAch } from "./ach";
import { filmedToday, postClip } from "./vietsoci";

/** Bot nhập dư chừng này so với số khách dự kiến. */
const BOT_BUY_MARGIN = 1.05;

export type Policy = {
  name: string;
  /** Số ổ bot nhập; vắng thì nhập theo số khách dự kiến. */
  buyLoaves?: number;
  /** Mức hàng bot mua, mặc định hàng thường. */
  tier?: Quality;
  /** Mốc giá bot đặt cho mọi món, mặc định Thường. */
  price?: PricePick;
  build?: [number, EquipId][];
  workSec: [number, number];
  dropRate: number;
  defectRate: number;
  teaRate: number;
  /** Xác suất mỗi ổ bị cháy trong lò. */
  burnRate?: number;
  /** Xác suất thử mở lời mỗi lần có cơ hội. */
  socialRate?: number;
  /** Rỗng = nhận act đầu tiên gặp (act hiếm không tới lượt); có danh sách thì mỗi cuộc săn một act xoay vòng. */
  socialActs?: readonly string[];
};

/** Ghế và máy trà mua sớm vì thiếu chúng thì act xã giao không chạy. */
export const BUILD_XA_GIAO: [number, EquipId][] = [
  [1, "GHE_BAN"], [1, "BINH_TRA"], [2, "DU_CHE"], [3, "KEP_GAP"], [8, "LONG_BAN"], [12, "QUAT_DIEN"],
];

export const BUILD_VE_SINH: [number, EquipId][] = [
  [2, "KEP_GAP"], [6, "LONG_BAN"], [14, "BANG_QR"],
  [19, "GIA_TREO"], [22, "TU_MAT"], [29, "GHE_BAN"], [33, "BINH_TRA"],
];

export const POLICIES: Record<string, Policy> = {
  greedy: { name: "greedy", workSec: [7, 10], dropRate: 0, defectRate: 0, teaRate: 0, build: BUILD_VE_SINH },
  newbie: { name: "newbie", workSec: [12, 20], dropRate: 0.08, defectRate: 0.15, teaRate: 0.1 },
  tea: { name: "tea", workSec: [9, 13], dropRate: 0.04, defectRate: 0.05, teaRate: 0.6 },
  social: {
    name: "social", workSec: [9, 13], dropRate: 0, defectRate: 0, teaRate: 0.25,
    build: BUILD_XA_GIAO,
    socialRate: 0.85, socialActs: [],
  },
};

const WRAP_BEFORE_SERVE = 3;

/** `MAX_DEPTH` + 1. */
const SOCIAL_MAX_BEATS = 7;

/** Phần số lần mở lời là ra đường mời người đi ngang. */
const SOCIAL_STREET = 0.45;

/** Còn chừng này phần chặng làm thì coi như ổ đã có nhân. */
const HAND_FILLED_FROM = 0.4;

export type Inject = (t: number, h: HeadlessStall) => void;

export class HeadlessStall {
  readonly ctx: GameContext;
  readonly service: Service;
  elapsed = 0;
  closed = false;
  frames = 0;
  private bot: Rng;
  private bread: Taste = FULL_TASTE;
  private pressure: boolean;
  private work: { left: number; forVisit: string; dropped: boolean; dish: Ingredient[]; wrapped: boolean } | null = null;
  private refused = new Set<string>();
  private offAch: () => void;
  private talkBeats = 0;
  private hunt = 0;

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
      w.progress.today = { served: 0, lost: 0, revenue: 0, talksDeep: 0, talkOffers: 0 };
      bus.emit("day:started", { dayIndex: w.progress.dayIndex, daySeed: this.ctx.rng.daySeed, weather: w.progress.weather });
    }
    this.ctx.setScene("Stall");
    // Như `StallScene.create`, để bản đồ giống bản người chơi đi.
    setOpenTiles(openTilesFor((id) => has(w.equipment, id as EquipId)));
    this.pressure = opts.pressure ?? true;
    this.ctx.clock.scaleMul = this.pressure ? 1 : 0.5;
    this.bot = this.ctx.rng.derive(`bot:${policy.name}`);
    if (policy.price !== undefined) for (const id of MENU_IDS) w.menu.price[id] = policy.price;
    if (!opts.resume) {
      dawn(w);
      const loaves = policy.buyLoaves ?? Math.ceil(guestsOf(w) * BOT_BUY_MARGIN);
      buyBasket(w, basketFor(w.inventory, loaves, w.progress.dayIndex), policy.tier ?? "THUONG");
    }
    const lateOpen = !opts.resume && w.flags.lateOpenDay === w.progress.dayIndex;
    if (lateOpen) this.ctx.clock.reset(8 * 60);
    this.service = new Service({
      bus, hub: this.ctx.rng, saveId: w.saveId, day: w.progress.dayIndex,
      npcs: w.npcs, bags: w.shuffleBags, dialog: w.dialogState,
      ...dayDeps(w),
      till: w.econ, flags: w.flags,
      equip: w.equipment, loaOn: has(w.equipment, "LOA_RAO") && (w.econ?.loaOffUntil ?? 0) < w.progress.dayIndex,
      todayCounters: w.progress.today,
      onServed: (rec) => {
        const p = rollReview(w, rec, this.ctx.clock.minutes);
        if (p) enqueue(w, p);
      },
      filmed: (ch) => filmedToday(w, ch),
      onClip: (clip) => postClip(w, clip, this.ctx.clock.minutes),
      resumeAt: opts.resume || lateOpen ? this.ctx.clock.minutes : undefined,
    });
    this.offAch = wireAch(bus, () => w);
    bus.on("npc:left", (p) => { if (p.reason === "IMPATIENT" || p.reason === "SOILED_FOOD") w.progress.today.lost++; });
    bus.on("perception:confirmed", (p) => { if (p.stimId === "DIRTY_HANDS") w.flags.dirtyHandsConfirmed = true; });
  }

  get bus() { return this.ctx.bus; }

  private emit(id: StimId, zone: StallZone) {
    this.bus.emit("stim:emitted", { stimId: id, zone, salience: SALIENCE[id], at: this.elapsed });
  }

  /** Đi qua `openTalk` → `chooseTalk` như người chơi, không gọi tắt hàm act. */
  private socialise() {
    const p = this.policy;
    const s = this.service;
    if (!p.socialRate) return;

    if (!s.talkOpen) {
      if (this.bot.next() >= p.socialRate) return;
      // Trả lời NPC vừa mời trước: phần lớn cuộc là `NPC_ONLY`; `playerAt = null` để nhắm người đó.
      if (s.hasOffer) {
        s.playerAt = null;
        s.playerOnStreet = false;
        if (!s.openTalk()) return;
        this.talkBeats = 0;
        this.hunt++;
        return;
      }
      // Không lọc `phase !== "leaving"`: người đi ngang mang phase đó suốt.
      const duong = s.customers.filter((c) => c.ambient && c.pass);
      if (duong.length && this.bot.next() < SOCIAL_STREET) {
        const ai = duong[this.bot.int(0, duong.length)];
        s.playerAt = { x: ai.x, y: ai.y };
        s.playerOnStreet = true;
      } else {
        s.playerAt = null;
        s.playerOnStreet = false;
      }
      if (!s.openTalk()) return;
      this.talkBeats = 0;
      this.hunt++;
      return;
    }

    if (this.talkBeats >= SOCIAL_MAX_BEATS) { s.closeTalk(); return; }
    this.talkBeats++;

    const acts = s.optionActs();
    if (!acts.length) { s.closeTalk(); return; }
    const pool = p.socialActs ?? [];
    const muon = pool.length > 1 ? [pool[this.hunt % pool.length]] : pool;
    const hop = (xs: readonly string[]) => (muon.length ? xs.some((a) => muon.includes(a)) : xs.length > 0);

    // Ưu tiên: nút có act cần → nhánh con có act đó → act bất kỳ → nút đầu.
    let i = acts.findIndex((o) => o.kind && hop([o.kind]));
    if (i < 0) i = acts.findIndex((o) => hop(o.sau));
    if (i < 0) i = acts.findIndex((o) => o.kind !== null);
    if (i < 0) i = 0;

    const v = s.chooseTalk(i);
    if (!v || v.done) { s.closeTalk(); this.talkBeats = 0; }
  }

  private act(dt: number) {
    const s = this.service;
    this.socialise();
    const c = s.front;
    if (!c || c.phase !== "waiting" || !c.order) { this.work = null; this.service.playerHand = "empty"; return; }
    // Khách đã từ chối thì thôi, làm lại là đốt sạch kệ bánh khi kho hết nhân.
    if (this.refused.has(c.id)) { this.work = null; return; }
    const p = this.policy;
    const inv = this.ctx.world.inventory, day = this.ctx.world.progress.dayIndex;
    if (!this.work || this.work.forVisit !== c.id) {
      if (this.bot.next() < p.teaRate) s.serveTea();
      if (p.burnRate && this.bot.next() < p.burnRate) {
        const t = this.ctx.world.progress.today;
        t.burnt = (t.burnt ?? 0) + 1;
        this.emit("BURNT_OR_COLD", "OVEN");
      }
      const bread = take(inv, "bread", 1, day);
      if (!bread.length) { s.soldOut = true; this.work = null; return; }
      this.bread = bread[0];
      const dish = dishFor(c.order).filter((ing) => portionsFor(inv, ing, day) > 0);
      if (this.bot.next() < p.defectRate && dish.length) dish.splice(this.bot.int(0, dish.length), 1);
      this.work = { left: this.bot.range(p.workSec[0], p.workSec[1]), forVisit: c.id, dropped: false, dish, wrapped: false };
    }
    const w = this.work;
    // Mốc "đã có nhân" không phải `w.wrapped` (chỉ 3 s chót) vì người thật cầm ổ đầy đi một quãng dài.
    const tongCong = p.workSec[1];
    this.service.playerHand = w.left <= tongCong * HAND_FILLED_FROM ? "loaf_filled" : "loaf_hot";
    w.left -= dt;
    if (!w.dropped && w.left < 2 && this.bot.next() < p.dropRate * dt) {
      w.dropped = true;
      this.emit("DROPPED_FOOD", "HANDS");
      w.left += 4;
    }
    // Lỗi trong ổ phát lúc gói, như `StallScene.finishDish`.
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
    const parts: (Portion & { ing: typeof w.dish[number] })[] = [];
    for (const ing of w.dish) {
      const got = takeFull(inv, ing, 1, day);
      if (got.length) parts.push({ ...got[0], ing });
    }
    const res = s.serveDish(parts.map((p) => p.ing), {
      quality: dishQuality(this.bread.q, parts), flaws: tasteFlaws(this.bread, parts), sick: sickChance(parts), soiled: w.dropped,
    });
    this.work = null;
    s.playerHand = "empty";
    if (!res.ok) this.refused.add(c.id);
  }

  private drain() {
    const w = this.ctx.world;
    for (const ev of this.service.drain()) {
      if (ev.kind === "log") continue;
      if (ev.kind === "cost") {
        w.money.cash -= ev.amount;
        if (ev.item === "talk") w.econ.today.talk += ev.amount; else w.econ.today.fixed += ev.amount;
        continue;
      }
      if (ev.kind === "talkOffer" || ev.kind === "takeHand") continue;
      w.money.cash += ev.amount;
      w.progress.today.revenue += ev.amount;
      w.progress.today.served++;
      this.bus.emit("money:changed", { delta: ev.amount, balance: w.money.cash, reason: "SALE" });
    }
  }

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
    for (const [d, id] of this.policy.build ?? []) {
      if (d > w.progress.dayIndex || has(w.equipment, id)) continue;
      if (w.money.cash - priceVnd(id) < 250_000) break;
      if (whyNot(id, w.equipment, w.money.cash)) continue;
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
    this.offAch();
  }

  run(opts: { inject?: Inject; until?: (h: HeadlessStall) => boolean; maxFrames?: number } = {}) {
    const max = opts.maxFrames ?? 30 * 60 * 30;
    while (!this.closed && this.frames < max) {
      this.step(1000 / 30, opts.inject);
      if (opts.until?.(this)) break;
    }
    return this.elapsed;
  }
}

export function nextDay(world: SaveFile) {
  eveningCounting(world);
  neighborTick(world);
  world.progress.dayIndex++;
  world.progress.gameMinutes = DAY_START_MIN;
  world.progress.today = { served: 0, lost: 0, revenue: 0, talksDeep: 0, talkOffers: 0 };
}
