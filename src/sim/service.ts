import { Rng } from "../core/rng";
import { Barks } from "../content/lines";
import { NPCS, WALKIN_NAMES, WALKIN_STYLES, type NpcDef } from "../content/npcs";
import { DAY_END_MIN, DAY_START_MIN, PEAK_END_MIN, PEAK_START_MIN } from "../core/clock";
import type { StimId } from "../core/eventbus";
import { Customer, type LeaveReason } from "./customer";
import {
  diffDish, generosityOf, makeUsual, sameOrder, sayOrder,
  type Defect, type Ingredient, type OrderSpec,
} from "./order";
import { observe, peakOf, type ActiveStim, type ObsState, type Zone } from "./perception";
import { CUSTOMER_GATE, QUEUE_SLOTS, hitsWall } from "../world/map";

/**
 * Điều phối việc bán hàng: ai tới lúc nào, đứng chỗ nào, chờ bao lâu,
 * nhận bánh rồi phản ứng ra sao.
 *
 * Đây là chỗ DUY NHẤT nối ba thứ lại với nhau — lịch khách, tầng nhận thấy (§5),
 * và delivery-diff (§6). Scene không biết gì về mấy luật này.
 */

/** Chỗ đứng và cổng lấy thẳng từ bản đồ — xem chú thích ở `world/map.ts`. */
const SLOTS: readonly { x: number; y: number; zone: Zone }[] = QUEUE_SLOTS;
const GATE = CUSTOMER_GATE;

const WALK_SPEED = 2.2;

/** Giá một ổ. Kinh tế thật nằm ở phase P3. */
const PRICE_BANH = 25_000;
const PRICE_TEA = 3_000;

export type ServiceEvent =
  | { kind: "log"; text: string }
  | { kind: "stimulus"; id: StimId }
  | { kind: "paid"; amount: number; item: "dish" | "tea" };

type Memory = {
  visits: number;
  usual: OrderSpec;
  /** Đã được cho thêm bao nhiêu lần. CANON §8(i): spam hào phóng phải mất tác dụng dần. */
  freebies: number;
  /** Số lần người chơi thật sự nghe khách đọc nguyên đơn ruột. Xem `canAskUsual`. */
  heard: number;
};

export type ServiceDeps = {
  /** Ngẫu nhiên của RIÊNG ngày hôm nay: lịch khách, thoại, đổi ý. */
  dayRng: Rng;
  /** Seed của cả mùa — dùng cho những thứ phải bất biến 40 ngày. */
  seasonSeed: number;
  /** Sổ nhớ nằm trong save, Service ghi thẳng vào đây. */
  persist: Record<string, { visits: number; freebies: number; heard: number }>;
};

export class Service {
  readonly customers: Customer[] = [];
  private active: ActiveStim[] = [];
  private schedule: { at: number; npc: NpcDef | null }[] = [];
  private memory = new Map<string, Memory>();
  private barks: Barks;
  private walkinSeq = 0;

  /** Đếm để tổng kết cuối buổi. Không phải chỉ số quan hệ — chỉ là sổ sách. */
  servedCount = 0;
  lostCount = 0;

  /** Sự kiện đẩy ngược lên scene (ghi log, cộng tiền, phát stimulus). */
  readonly out: ServiceEvent[] = [];

  private rng: Rng;

  constructor(private deps: ServiceDeps) {
    this.rng = deps.dayRng;
    this.barks = new Barks(this.rng);
    this.buildSchedule();
  }

  /**
   * Lịch khách cả buổi, sinh một lần từ seed của ngày.
   * Giờ cao điểm 6h30–8h dày khách hơn hẳn — CANON §13.3: đông khách = nhiều mắt
   * nhìn hơn + áp lực làm nhanh = dễ ẩu.
   */
  private buildSchedule() {
    for (const npc of NPCS) {
      if (npc.arrivesAt !== undefined) this.schedule.push({ at: npc.arrivesAt, npc });
    }
    let t = DAY_START_MIN + 8;
    while (t < DAY_END_MIN - 10) {
      const peak = t >= PEAK_START_MIN && t < PEAK_END_MIN;
      t += peak ? 9 + this.rng.next() * 9 : 20 + this.rng.next() * 22;
      if (t >= DAY_END_MIN - 10) break;
      const named = this.rng.next() < 0.35 ? this.rng.pick(NPCS) : null;
      this.schedule.push({ at: t, npc: named });
    }
    this.schedule.sort((a, b) => a.at - b.at);
  }

  /**
   * Hồ sơ nhớ về một người. Hai nguồn khác nhau, cố ý:
   *  · `usual` sinh từ SEED CỦA MÙA + tên người đó -> bất biến suốt 40 ngày,
   *    nên "cho cô như mọi bữa" mới có nghĩa (CANON §3.2, salience 90)
   *  · `visits` / `freebies` đọc ra từ SAVE -> tích luỹ qua các ngày
   */
  private mem(id: string): Memory {
    let m = this.memory.get(id);
    if (!m) {
      const saved = this.deps.persist[id] ?? { visits: 0, freebies: 0, heard: 0 };
      saved.heard ??= 0;
      this.deps.persist[id] = saved;
      this.memory.set(id, (m = {
        visits: saved.visits,
        freebies: saved.freebies,
        heard: saved.heard,
        usual: makeUsual(Rng.forSeason(this.deps.seasonSeed, id)),
      }));
    }
    return m;
  }

  /** Đẩy phần đếm được về lại save sau mỗi lần đổi. */
  private flush(id: string, m: Memory) {
    this.deps.persist[id] = { visits: m.visits, freebies: m.freebies, heard: m.heard };
  }

  /**
   * Khách được phép nói "cho cô như mọi bữa" chưa?
   *
   * Hai điều kiện, cả hai đều là chuyện công bằng với người chơi:
   *  1. Phải là NPC CÓ TÊN. Khách vãng lai vô danh (CANON §9) dùng chung ô nhớ và
   *     mỗi hôm là một người khác — hỏi "mọi bữa" của người lạ là vô lý.
   *  2. Người chơi phải đã NGHE họ đọc nguyên đơn ít nhất HAI lần. Đếm số lần ghé
   *     là sai: ghé ba lần mà hai lần chỉ nói "như mọi bữa" thì người chơi mới nghe
   *     đúng một lần. Chỉ được bắt nhớ cái đã từng được nói cho nghe.
   */
  private canAskUsual(npc: NpcDef | null, m: Memory) {
    return npc !== null && m.heard >= 2;
  }

  private spawn(npc: NpcDef | null) {
    // `id` phải DUY NHẤT theo từng lượt ghé: Chú Tư ghé hai lần trong ngày là hai
    // người khác nhau trên màn hình. Trùng id thì scene chỉ dựng được một sprite
    // và người thứ hai thành vô hình.
    // `memKey` mới là khoá tra sổ nhớ, và nó cố ý ổn định qua các lượt.
    const seq = this.walkinSeq++;
    const memKey = npc ? npc.id : `walkin${seq % WALKIN_STYLES.length}`;
    const id = `${memKey}#${seq}`;
    const m = this.mem(memKey);
    m.visits++;
    this.flush(memKey, m);

    const style = npc ? npc.body : WALKIN_STYLES[seq % WALKIN_STYLES.length];
    const name = npc ? npc.name : WALKIN_NAMES[seq % WALKIN_NAMES.length];
    const person = npc
      ? npc.personality
      : { soi: 0.3 + this.rng.next() * 0.5, nongTinh: 0.2 + this.rng.next() * 0.5,
          deTha: 0.5 + this.rng.next() * 0.4, thanThien: 0.3 + this.rng.next() * 0.5 };

    const c = new Customer(
      id, memKey, name, person, style, npc, m.usual, m.visits,
      { ...GATE }, npc?.patience ?? 55, this.rng,
    );
    c.rollOrder(this.canAskUsual(npc, m));
    this.customers.push(c);
  }

  /** Kích thích mới xảy ra — scene gọi vào đây mỗi khi người chơi làm gì đó. */
  pushStimulus(id: StimId, slot: ActiveStim["slot"], now: number, seconds: number) {
    this.active.push({ id, slot, until: now + seconds });
  }

  get front(): Customer | null {
    return this.customers.find((c) => c.slot === 0 && c.phase !== "leaving") ?? null;
  }

  // ─────────────────────────────────────────────────────────────────── vòng lặp

  update(dt: number, ctx: { minutes: number; nowSec: number; pressure: boolean; dayOver: boolean }) {
    while (this.schedule.length && this.schedule[0].at <= ctx.minutes && !ctx.dayOver) {
      this.spawn(this.schedule.shift()!.npc);
    }
    this.active = this.active.filter((s) => s.until > ctx.nowSec - 2);

    for (const c of this.customers) {
      c.tick(dt, ctx.pressure);
      observe(c, this.active, ctx.nowSec, dt);
      this.step(c, dt, ctx.dayOver);
    }

    for (let i = this.customers.length - 1; i >= 0; i--) {
      const c = this.customers[i];
      if (c.phase === "leaving" && near(c, GATE, 0.5)) this.customers.splice(i, 1);
    }
    this.assignSlots();
  }

  private step(c: Customer, dt: number, dayOver: boolean) {
    if (c.phase === "leaving") { walk(c, GATE, dt); return; }

    switch (c.phase) {
      case "arriving":
        if (c.slot >= 0) {
          walk(c, SLOTS[c.slot], dt);
          if (near(c, SLOTS[c.slot], 0.22)) {
            c.phase = c.slot === 0 ? "ordering" : "queueing";
            if (c.slot === 0) this.takeOrder(c);
          }
        }
        break;

      case "queueing":
        if (c.slot === 0) { c.phase = "ordering"; this.takeOrder(c); break; }
        walk(c, SLOTS[Math.min(c.slot, SLOTS.length - 1)], dt);
        this.nag(c);
        break;

      case "ordering":
        c.phase = "waiting";
        break;

      case "waiting":
        walk(c, SLOTS[0], dt);
        this.nag(c);
        break;
    }

    if (isLeaving(c)) return;                          // takeOrder/nag có thể đã cho về
    if (c.patience <= 0) this.leave(c, "impatient");
    else if (dayOver) this.leave(c, "closed");
  }

  /** Cằn nhằn hai tầng — CANON §11: tier-1 cụ thể, tier-2 chung hơn rồi mới bỏ đi. */
  private nag(c: Customer) {
    if (c.nagged === 0 && c.patienceRatio < 0.5) {
      c.nagged = 1;
      if (this.barks.speaks()) c.speak(this.barks.take("waitSoft"));
    } else if (c.nagged === 1 && c.patienceRatio < 0.2) {
      c.nagged = 2;
      c.speak(this.barks.take("waitSoft"));
    }
  }

  private takeOrder(c: Customer) {
    const line = sayOrder(c.order!);
    c.speak(line, 4.5);
    this.out.push({ kind: "log", text: `${c.name}: ${line}` });

    // Đọc nguyên đơn ruột ra thành lời = người chơi vừa được DẠY một lần.
    // Đây là thứ duy nhất mở khoá cho "như mọi bữa" ở các lần sau.
    if (!c.order!.intent.usual && sameOrder(c.order!, c.usual)) {
      const m = this.mem(c.memKey);
      m.heard++;
      this.flush(c.memKey, m);
    }
  }

  private leave(c: Customer, reason: LeaveReason) {
    c.phase = "leaving";
    c.leaveReason = reason;
    c.slot = -1;
    if (reason === "served") this.servedCount++;
    if (reason === "impatient") {
      this.lostCount++;
      c.speak(this.barks.take("waitHard"), 3);
      this.out.push({ kind: "log", text: `${c.name} bỏ đi — chờ lâu quá.` });
      this.out.push({ kind: "stimulus", id: "MADE_THEM_WAIT" });
    }
  }

  /** Ai đứng chỗ nào: người tới trước đứng gần quầy hơn. */
  private assignSlots() {
    let i = 0;
    for (const c of this.customers) {
      if (c.phase === "leaving") continue;
      c.slot = i < SLOTS.length ? i : SLOTS.length - 1;
      c.zone = SLOTS[c.slot].zone;
      i++;
    }
  }

  // ──────────────────────────────────────────────────────────────── giao bánh

  /**
   * Người chơi đưa ổ bánh cho khách đang đứng trước mặt.
   *
   * CANON §6 — delivery-time diff, kỹ thuật lõi ROI cao nhất trên mỗi dòng thoại:
   * cùng MỘT lỗi, hai câu thoại khác hẳn nhau tuỳ khách có CHỨNG KIẾN hay không.
   * Và luật `take(1)` của Lucas Pope: nhiều lỗi cùng lúc chỉ được nói ra MỘT,
   * vì nói hết làm game dễ đi chứ không khó lên.
   */
  serveDish(dish: Ingredient[]): { ok: boolean; reason?: string } {
    const c = this.front;
    if (!c || c.phase !== "waiting") return { ok: false, reason: "chưa có ai chờ lấy bánh" };

    const defects = diffDish(c.order!, dish);
    const silent = defects.reduce((s, d) => s + d.weight, 0);

    if (defects.length === 0) {
      const remembered = c.order!.intent.usual;
      const extra = generosityOf(c.order!, dish);
      c.speak(this.barks.take(remembered ? "remembered" : "happy"), 3);
      this.out.push({ kind: "stimulus", id: remembered ? "REMEMBERED_USUAL" : "FLOURISH" });
      this.out.push({ kind: "log", text: `${c.name}: ${c.say}` });

      // Cho thêm đồ chua / ớt / tương mà ổ bánh vẫn đúng đơn -> FREE_EXTRA (§3.2).
      // Nhưng §8(i): làm hoài thì hết thiêng, và tới lúc nào đó khách thấy mình
      // đang bị mua chuộc. Nên hệ số tắt dần theo số lần đã cho.
      let bonus = 0;
      if (extra > 0) {
        const m = this.mem(c.memKey);
        bonus = Math.min(extra, 3) * 0.05 * Math.max(0, 1 - m.freebies * 0.34);
        m.freebies++;
        this.flush(c.memKey, m);
        this.out.push({ kind: "stimulus", id: "FREE_EXTRA" });
        if (m.freebies > 4) {
          c.speak("Con cho nhiều vậy chi, cô ngại.", 3);
          bonus = -0.05;                               // phản tác dụng
        }
      }
      this.pay(c, PRICE_BANH, 1 + bonus);
    } else {
      const shown: Defect = defects[0];                // take(1)
      // CANON §6 dùng đúng ngưỡng NOTICED: mới "liếc thấy" (GLIMPSED) thì chưa đủ
      // để khách dám nói "tôi thấy con quên bỏ hành rồi đó".
      const witnessed = atLeastNoticed(peakOf(c, "ORDER_DEFECT"));
      const line = this.barks.take(witnessed ? "anticipated" : "discovered", { defect: shown.text });
      c.speak(line, 3.6);
      this.out.push({ kind: "log", text: `${c.name}: ${line}` });
      this.out.push({ kind: "stimulus", id: "ORDER_DEFECT" });
      this.pay(c, PRICE_BANH, Math.max(0.35, 1 - silent * 0.18));
    }

    this.leave(c, "served");
    return { ok: true };
  }

  /**
   * Đưa ly trà đá — CANON §5.4: vừa là chăm sóc, vừa là công cụ CHỦ ĐỘNG hạ attention.
   *
   * Chính vì nó hạ attention nên nó là công cụ NGUY HIỂM NHẤT trong tay người chơi:
   * không chặn thì cứ nhồi trà là khách mù, rồi làm rớt đồ / bánh cháy / sai đơn
   * đều không ai thấy — T1 và T5 sụp cùng lúc. Ba cái khoá, theo đúng thứ tự canon:
   *
   *  1. VẬT LÝ — khách còn cầm ly thì không nhận ly nữa (§7.2: rủi ro chuyển sang vận hành)
   *  2. §8(a)  — cửa sổ hạ gaze CHỈ có ở ly đầu, và chỉ 2,5 giây. Ly sau họ chỉ
   *              cầm lấy đặt xuống. Cửa sổ attention phải ngắn và KHÔNG farm được
   *  3. §8(i)  — người tinh ý bắt bài chuyện mua chuộc, và khi đã bắt bài thì
   *              PHẢN TÁC DỤNG: từ chối, mất kiên nhẫn, và công cụ cháy vĩnh viễn
   */
  serveTea(): { ok: boolean; reason?: string } {
    const c = this.front;
    if (!c || c.phase === "leaving") return { ok: false, reason: "chưa có ai để đưa" };
    if (c.holdingTea) return { ok: false, reason: `${c.name} còn cầm ly kia` };

    if (c.teaCount >= c.teaTolerance) {
      if (!c.onToTea) {
        c.onToTea = true;                              // công cụ cháy, không hồi lại được
        c.patience -= 6;
        c.speak("Thôi đủ rồi con, cô đâu có khát.", 3);
        this.out.push({ kind: "log", text: `${c.name}: ${c.say}` });
      }
      return { ok: false, reason: `${c.name} không nhận nữa` };
    }

    const first = c.teaCount === 0;
    c.takeTea(first && !c.onToTea ? 2.5 : 0);
    c.patience = Math.min(c.patienceMax, c.patience + (first ? 12 : 5));
    c.speak(this.barks.take("tea"), 2.8);
    if (first) this.out.push({ kind: "stimulus", id: "CARED_FOR_THEM" });
    this.out.push({ kind: "log", text: `${c.name}: ${c.say}` });
    this.out.push({ kind: "paid", amount: PRICE_TEA, item: "tea" });
    return { ok: true };
  }

  private pay(c: Customer, base: number, quality: number) {
    // Tiền boa theo chất lượng phục vụ + độ thân thiện. KHÔNG hiện ra thành chỉ số nào
    // (CANON T3) — người chơi chỉ thấy tổng tiền trong ống nhiều hay ít.
    const tip = base * 0.12 * quality * (0.5 + c.personality.thanThien);
    // làm tròn về bội số 1.000₫: ngoài đời không ai trả 27.682₫
    this.out.push({ kind: "paid", amount: Math.round((base * quality + tip) / 1000) * 1000, item: "dish" });
  }

  drain() {
    return this.out.splice(0, this.out.length);
  }
}

// ───────────────────────────────────────────────────────────────────── đi lại

function atLeastNoticed(st: ObsState) {
  return st === "NOTICED" || st === "CONFIRMED";
}

/** Gọi qua hàm để TypeScript không thu hẹp kiểu — `leave()` đổi phase ngay trong switch. */
function isLeaving(c: Customer) {
  return c.phase === "leaving";
}

function near(c: { x: number; y: number }, p: { x: number; y: number }, r: number) {
  return Math.hypot(p.x - c.x, p.y - c.y) < r;
}

/** Khách đi thẳng tới đích, chạm tường thì trượt — đủ dùng vì sân trước quán trống. */
function walk(c: Customer, to: { x: number; y: number }, dt: number) {
  const dx = to.x - c.x, dy = to.y - c.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.05) return;
  const step = Math.min(d, WALK_SPEED * dt);
  const nx = c.x + (dx / d) * step;
  const ny = c.y + (dy / d) * step;
  if (!hitsWall(nx, c.y, 0.22)) c.x = nx;
  if (!hitsWall(c.x, ny, 0.22)) c.y = ny;
}
