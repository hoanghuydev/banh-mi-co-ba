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
  buyLoaves?: number;
  pate?: "PATE_NHA" | "PATE_THUONG";
  writeDebts?: number;
  build?: [number, EquipId][];
  workSec: [number, number];
  dropRate: number;
  defectRate: number;
  teaRate: number;
  anticipate?: number;
  /**
   * CON BOT BIẾT LÀM VIỆC XÃ GIAO — rót trà, mời ngồi, cho mượn áo mưa, mời ghé, bưng gánh…
   *
   * Vì sao phải có: bot `greedy` chỉ biết GÓI BÁNH, nên `tools/probe-facts.ts` đo ra
   * `v.gaveTea` 0% · `t.sitting` 0% · `t.filming` 0% · `m.borrowing` 0% · `w.cartChung` 0%
   * — và không ai phân biệt được "nhánh đó chết" với "bot không biết làm". Một bảng đo
   * không nói được nó KHÔNG đo được cái gì thì nó là một tờ giấy chứng nhận sạch.
   *
   * `socialRate` = xác suất mỗi lần có cơ hội thì thử mở lời.
   *
   * `socialActs` rỗng = nhận MỌI act. ⚠️ Nhận mọi act KHÔNG phủ hết: bot bấm cái đầu tiên
   * nó gặp, nên mấy act nằm sâu hoặc hiếm không bao giờ tới lượt — đo thật ra 10/27 act.
   * Khai một DANH SÁCH thì bot **xoay vòng**, mỗi cuộc săn một act, nên cả danh sách đều
   * có cửa. Đó mới là cách trả lời "nhánh này có với tới được không".
   */
  socialRate?: number;
  socialActs?: readonly string[];
};

/** Đồ nghề của bot xã giao — ghế và bình trà mua SỚM, vì không có chúng thì act không chạy. */
export const BUILD_XA_GIAO: [number, EquipId][] = [
  [1, "GHE_BAN"], [1, "BINH_TRA"], [2, "DU_CHE"], [3, "KEP_GAP"], [4, "THUNG_RAC"],
  [5, "KHAN_3_MAU"], [6, "THOT_RIENG"], [8, "LONG_BAN"], [12, "VOI_BON"],
];

export const BUILD_VE_SINH: [number, EquipId][] = [
  [2, "KEP_GAP"], [4, "THUNG_RAC"], [5, "KHAN_3_MAU"], [5, "THOT_RIENG"], [6, "LONG_BAN"], [14, "BANG_QR"],
  [12, "VOI_BON"], [15, "DAO_BEN"], [19, "GIA_TREO"], [22, "TU_MAT"], [29, "GHE_BAN"], [33, "BINH_TRA"],
];

export const POLICIES: Record<string, Policy> = {
  greedy: { name: "greedy", workSec: [7, 10], dropRate: 0, defectRate: 0, teaRate: 0, build: BUILD_VE_SINH, anticipate: 0.5, buyLoaves: 20 },
  newbie: { name: "newbie", workSec: [12, 20], dropRate: 0.08, defectRate: 0.15, teaRate: 0.1 },
  tea: { name: "tea", workSec: [9, 13], dropRate: 0.04, defectRate: 0.05, teaRate: 0.6 },
  /**
   * BOT XÃ GIAO — bán chậm hơn `greedy` một chút và dành thì giờ cho người, đúng kiểu
   * người chơi mà cả hệ thoại này viết cho. Mua sẵn ghế + bình trà + dù từ sớm, nếu không
   * thì mấy act cần đồ nghề (`THEY_SIT`, `OFFER_TEA`) không có cửa chạy.
   */
  social: {
    name: "social", workSec: [9, 13], dropRate: 0, defectRate: 0, teaRate: 0.25,
    build: BUILD_XA_GIAO, anticipate: 0.5, buyLoaves: 20,
    socialRate: 0.85, socialActs: [],
  },
};

const WRAP_BEFORE_SERVE = 3;

/** Trần nhịp một cuộc của bot xã giao — cây sâu nhất là `MAX_DEPTH`, thêm một nhịp cho chắc. */
const SOCIAL_MAX_BEATS = 7;

/** Bao nhiêu phần số lần mở lời là BƯỚC RA ĐƯỜNG mời người đi ngang, phần còn lại nói với khách ở quầy. */
const SOCIAL_STREET = 0.45;

/** Còn bao nhiêu phần chặng làm thì coi như ổ ĐÃ CÓ NHÂN trên tay — xem khối ở `act()`. */
const HAND_FILLED_FROM = 0.4;

export type Inject = (t: number, h: HeadlessStall) => void;

export class HeadlessStall {
  readonly ctx: GameContext;
  readonly service: Service;
  elapsed = 0;
  closed = false;
  frames = 0;
  private bot: Rng;
  private breadQ = 1;
  private pressure: boolean;
  private work: { left: number; forVisit: string; dropped: boolean; dish: Ingredient[]; wrapped: boolean } | null = null;
  private refused = new Set<string>();
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
    this.pressure = opts.pressure ?? true;
    this.ctx.clock.scaleMul = this.pressure ? 1 : 0.5;
    this.bot = this.ctx.rng.derive(`bot:${policy.name}`);
    if (!opts.resume) {
      dawn(w);
      if (w.progress.dayIndex > 1 || policy.buyLoaves) buyBasket(w, basketFor(w.inventory, policy.buyLoaves ?? 16, w.progress.dayIndex, policy.pate ?? "PATE_NHA"));
    }
    const lateOpen = !opts.resume && w.flags.lateOpenDay === w.progress.dayIndex;
    if (lateOpen) this.ctx.clock.reset(8 * 60);
    this.service = new Service({
      bus, hub: this.ctx.rng, saveId: w.saveId, day: w.progress.dayIndex,
      npcs: w.npcs, bags: w.shuffleBags, dialog: w.dialogState, gossip: w.gossip, notebook: w.notebook,
      ...standDeps(w),
      debts: w.money.debtsOwedToPlayer, till: w.econ, allowFalseMemory: w.a11y.allowFalseMemory ?? true,
      equip: w.equipment, loaOn: (w.econ?.loaOffUntil ?? 0) < w.progress.dayIndex,
      story: w.story,
      todayCounters: w.progress.today,
      resumeAt: opts.resume || lateOpen ? this.ctx.clock.minutes : undefined,
    });
    bus.on("npc:left", (p) => { if (p.reason === "IMPATIENT" || p.reason === "SOILED_FOOD") w.progress.today.lost++; });
    bus.on("perception:confirmed", (p) => { if (p.stimId === "DIRTY_HANDS") w.flags.dirtyHandsConfirmed = true; });
  }

  get bus() { return this.ctx.bus; }

  private emit(id: StimId, zone: StallZone) {
    this.bus.emit("stim:emitted", { stimId: id, zone, salience: SALIENCE[id], at: this.elapsed });
  }

  /**
   * NÓI CHUYỆN NHƯ MỘT NGƯỜI CHƠI — mở lời, rồi đi theo nhánh NÀO CÓ ACT.
   *
   * Đi qua đúng hai hàm `StallScene` gọi (`openTalk` → `chooseTalk`), không có đường tắt
   * nào: một con bot gọi thẳng `service.serveTea()` thì nó đo cái hàm, không đo cái game.
   *
   * Cách chọn, theo thứ tự:
   *   1. nút CÓ act mình đang cần          — việc chính
   *   2. nút có act đó ở trong NHÁNH con   — đi xuống để tới được nó
   *   3. nút có act bất kỳ                 — còn hơn một câu nói suông
   *   4. nút đầu                           — cho cuộc trôi tới nhịp sau
   */
  private socialise() {
    const p = this.policy;
    const s = this.service;
    if (!p.socialRate) return;

    if (!s.talkOpen) {
      if (this.bot.next() >= p.socialRate) return;
      /*
       * BƯỚC RA ĐƯỜNG. `talkTarget()` không có `playerAt` thì chỉ nhắm được người ĐẦU QUẦY,
       * nên bot cũ không bao giờ nói chuyện với người đi ngang — và `INVITE` (25 nhắc) với
       * `WALK_ON` (37 nhắc) đo ra 0 lần, trông như nội dung chết. Đặt `playerAt` đúng như
       * `StallScene` làm khi người chơi đi ra lề: cùng một đường, không có cửa sau.
       */
      /** ⚠️ KHÔNG lọc `phase !== "leaving"`: người đi ngang MANG phase đó suốt — họ đang đi qua mà. */
      /*
       * CÓ NGƯỜI VỪA MỞ LỜI THÌ TRẢ LỜI HỌ TRƯỚC — và đây là chỗ bot cũ mù hẳn một nửa kho.
       *
       * 81/86 cuộc khai `NPC_ONLY`: người chơi KHÔNG bấm ra được, chúng chỉ tới qua lời mời
       * của chính họ. Bot chỉ mở bằng `"PLAYER"` nên `okSource` gạt sạch — đo ra `su.toan`
       * rụng **53/53 mẫu** ở đúng cổng đó, và cả `PAY`·`TAKE_CASH`·`RAO`·`BARTER` báo
       * "nhánh chết" trong khi chúng sống nguyên.
       *
       * `playerAt = null` ⇒ `talkTarget()` nhắm người đang chờ mình trả lời.
       */
      if (s.hasOffer) {
        s.playerAt = null;
        s.playerOnStreet = false;
        if (!s.openTalk()) return;
        this.talkBeats = 0;
        this.hunt++;
        return;
      }
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
      this.hunt++;                                  // cuộc mới ⇒ săn act kế tiếp trong danh sách
      return;
    }

    /** Trần nhịp: cuộc nào cũng có đường ra, nhưng bot bấm hoài thì một cuộc ăn cả buổi. */
    if (this.talkBeats >= SOCIAL_MAX_BEATS) { s.closeTalk(); return; }
    this.talkBeats++;

    const acts = s.optionActs();
    if (!acts.length) { s.closeTalk(); return; }
    /** Xoay vòng: mỗi cuộc săn MỘT act, nên act hiếm cũng tới lượt. Rỗng = nhận mọi act. */
    const pool = p.socialActs ?? [];
    const muon = pool.length > 1 ? [pool[this.hunt % pool.length]] : pool;
    const hop = (xs: readonly string[]) => (muon.length ? xs.some((a) => muon.includes(a)) : xs.length > 0);

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
    // Lượt mà khách đã LẮC ĐẦU một lần thì bỏ luôn, đừng lấy ổ bánh khác ra làm lại.
    // Chỗ này xảy ra khi kho hết nhân: ổ nào gói ra cũng là ổ chưa có nhân, mà 7 trong
    // 12 người không nhận (`service.takesHollowLoaf`). Con bot không có nước đi nào khác
    // — nó không "xin lỗi chú, hết pate rồi" được — nên nếu cứ làm lại thì nó đốt sạch
    // kệ bánh vào một người không bao giờ nhận, và `npm run sim` đọc ra một ngày sai hẳn.
    // Người đó đứng hết kiên nhẫn rồi về: ĐÚNG hình dạng của chuyện hết hàng giữa buổi.
    if (this.refused.has(c.id)) { this.work = null; return; }
    const p = this.policy;
    const inv = this.ctx.world.inventory, day = this.ctx.world.progress.dayIndex;
    if (!this.work || this.work.forVisit !== c.id) {
      if (this.bot.next() < p.teaRate) s.serveTea();
      const bread = take(inv, "bread", 1, day);
      if (!bread.length) { s.soldOut = true; this.work = null; return; }
      this.breadQ = bread[0];
      const dish = dishFor(c.order).filter((ing) => portionsFor(inv, ing, day) > 0);
      if (this.bot.next() < p.defectRate && dish.length) dish.splice(this.bot.int(0, dish.length), 1);
      this.work = { left: this.bot.range(p.workSec[0], p.workSec[1]), forVisit: c.id, dropped: false, dish, wrapped: false };
    }
    const w = this.work;
    /*
     * TRÊN TAY ĐANG CÓ CÁI GÌ. `StallScene` gán `service.playerHand = player.hand` mỗi
     * frame; bot thì để nguyên `"empty"` cả buổi, nên `p.holdsBread` / `p.holdsFilled`
     * không bao giờ đúng — và `GIVE_BREAD` (5 nhắc, "bẻ miếng ăn thử") với `BARTER` (2
     * nhắc, đổi ổ lấy chén tàu hũ) đo ra 0 lần, trông như nhánh chết. Bot ĐANG làm ổ bánh
     * thật, nên khai đúng cái nó đang cầm.
     *
     * ⚠️ Mốc "đã có nhân" KHÔNG phải `w.wrapped`: cờ đó chỉ bật ở 3 giây chót, nên đo ra
     * `loaf_filled` đúng **1 lần / 74 lần mở cuộc** và `p.holdsFilled` coi như không bao
     * giờ đúng. Người chơi thật bỏ nhân xong là cầm ổ ĐẦY đi ra quầy — một quãng dài.
     * Lấy 40% chặng cuối làm quãng đó.
     */
    const tongCong = p.workSec[1];
    this.service.playerHand = w.left <= tongCong * HAND_FILLED_FROM ? "loaf_filled" : "loaf_hot";
    w.left -= dt;
    if (!w.dropped && w.left < 2 && this.bot.next() < p.dropRate * dt) {
      w.dropped = true;
      this.emit("DROPPED_FOOD", "HANDS");
      w.left += 4;
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
    const parts: { ing: typeof w.dish[number]; q: number }[] = [];
    const served: typeof w.dish = [];
    for (const ing of w.dish) {
      const q = take(inv, ing, 1, day);
      if (q.length) { parts.push({ ing, q: q[0] }); served.push(ing); }
    }
    const known = c.npc && (this.ctx.world.npcs[c.memKey]?.heard ?? 0) >= 3 && this.bot.next() < (p.anticipate ?? 0);
    const res = s.serveDish(served, { quality: dishQuality(this.breadQ, parts), readyAt: known ? c.orderedAt - 1 : undefined });
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
        if (ev.item === "talk") w.econ.today.story += ev.amount; else w.econ.today.fixed += ev.amount;
        continue;
      }
      if (ev.kind === "credit") { w.progress.today.served++; if (this.bot.next() < (this.policy.writeDebts ?? 1)) ev.record.playerWrote = ev.record.trueAmount; continue; }
      if (ev.kind === "repay") { w.money.cash += ev.amount; w.progress.today.revenue += ev.amount; continue; }
      // bot không trò chuyện — nó không có mắt để đọc bốn lựa chọn, và không có tay
      // để đưa ai miếng bánh (`takeHand` chỉ có nghĩa với một người chơi thật).
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

  run(opts: { inject?: Inject; until?: (h: HeadlessStall) => boolean; maxFrames?: number } = {}) {
    const max = opts.maxFrames ?? 30 * 60 * 30;
    while (!this.closed && this.frames < max) {
      this.step(1000 / 30, opts.inject);
      if (opts.until?.(this)) break;
    }
    return this.elapsed;
  }
}

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
  world.progress.today = { served: 0, lost: 0, revenue: 0, talksDeep: 0, talkOffers: 0 };
}
