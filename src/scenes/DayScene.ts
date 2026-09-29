import Phaser from "phaser";
import { bus, type EventKey, type EventMap } from "../core/eventbus";
import { GameContext } from "../core/context";
import { DAY_START_MIN } from "../core/clock";
import { SEASON_DAYS, SaveService, SaveTooNewError, newGame, type SaveFile } from "../core/save";
import { gcBags } from "../core/rng";
import { DEV_TOOLS } from "../core/flags";
import { dev } from "../dev/registry";
import { refillPresets } from "../sim/presets";

/**
 * KHUNG NGÀY — P0-01 §2.3. Scene thường trực: chạy suốt từ lúc vào ván tới lúc về
 * sảnh, KHÔNG BAO GIỜ restart, không vẽ gameplay. Nó sở hữu `GameContext` và điều
 * phối ba scene con:
 *
 *        ┌──────────── DayScene (sở hữu ctx) ────────────┐
 *        │  MORNING        SELLING          EVENING      │
 *        ▼                                               │
 *    MarketScene ──market:done──► StallScene ──stall:closed──► EveningScene
 *        ▲                                                     │
 *        └──────────────────── evening:done (ngày +1) ─────────┘
 *
 * Scene con nhận ctx bằng INJECTION lúc launch và chỉ phát event — không dùng giá
 * trị trả về của scene. Dữ liệu truyền đi hẹp, một chiều.
 */
export type DayStart = { mode: "new" } | { mode: "continue" };

const CHILDREN = ["market", "stall", "evening"] as const;
type Child = typeof CHILDREN[number];

/** Tiền đổi ít nhất ngần này mới đáng một lần autosave riêng (P0-02 §2.6). */
const MONEY_SAVE_THRESHOLD = 20_000;

export class DayScene extends Phaser.Scene {
  ctx!: GameContext;
  private off: (() => void)[] = [];

  constructor() { super("day"); }

  create(data: DayStart = { mode: "continue" }) {
    const probe = new SaveService(bus, () => { throw new Error("probe"); });
    let world: SaveFile | null = null;
    if (data.mode === "continue") {
      try { world = probe.load(); } catch (e) {
        if (e instanceof SaveTooNewError) { this.scene.start("menu"); return; }
      }
    } else {
      probe.clear();
    }
    const fresh = !world;
    this.ctx = new GameContext(world ?? newGame("Cháu cô Ba"), bus);
    this.ctx.world.telemetry.sessionCount++;
    if (DEV_TOOLS) dev.ctx = this.ctx;

    this.wire();

    if (fresh || !world!.progress.dayStartSnapshotRef) this.beginDay();
    else this.resume();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
  }

  // ───────────────────────────────────────────────────────────── luồng ngày

  /**
   * Đầu ngày: reset MỌI stream RNG về đầu ngày, chụp bản đầu ngày (để "Chơi lại
   * ngày này" khôi phục ĐÚNG vị trí RNG — chơi lại chứ không phải reroll), rồi đi chợ.
   */
  private beginDay() {
    const { ctx } = this;
    const w = ctx.world;
    ctx.rng.beginDay(w.saveId, w.progress.dayIndex);
    ctx.clock.reset(DAY_START_MIN);
    w.progress.today = { served: 0, lost: 0, revenue: 0 };
    w.progress.scene = "Market";
    // P1-01 §2.6: sáng nào cũng chia lại phần cho 3 preset.
    w.stall.presets = refillPresets(w.stall.presets as never);
    // P1-02 §2.10: qua đêm cô Ba dọn bớt — sáng ra còn 40% độ bẩn hôm qua.
    w.stall.cleanliness = 1 - (1 - w.stall.cleanliness) * 0.4;
    gcBags(w.shuffleBags, w.progress.dayIndex);
    ctx.sync();
    w.progress.dayStartSnapshotRef = ctx.save.writeDayStart(ctx.snapshot());
    bus.emit("day:started", { dayIndex: w.progress.dayIndex, daySeed: ctx.rng.daySeed, weather: w.progress.weather });
    this.open("market");
    ctx.save.request("SCENE_CHANGE");
  }

  /** "Chơi tiếp": vào lại ĐÚNG chỗ đang đứng, bộ đếm RNG đúng chỗ đã dừng. */
  private resume() {
    const { ctx } = this;
    const p = ctx.world.progress;
    ctx.rng.fromJSON(ctx.world.saveId, p.dayIndex, ctx.world.rng.counters);
    ctx.clock.reset(p.gameMinutes);
    const at: Record<string, Child> = { Market: "market", Stall: "stall", Evening: "evening" };
    this.open(at[p.scene] ?? "market", { resume: true });
  }

  /** P0-02 §2.8 — nút chính thức "Chơi lại ngày này": về sáng sớm, cùng seed, cùng lịch. */
  replayDay() {
    const w = this.ctx.world;
    const snap = this.ctx.save.readDayStart(w.saveId, w.progress.dayIndex);
    if (!snap) return false;
    this.closeChildren();
    this.ctx.world = snap;
    this.beginDay();
    return true;
  }

  /** Lưu ngay rồi về sảnh. */
  quitToMenu() {
    this.ctx.save.flushNow("QUIT");
    this.closeChildren();
    this.ctx.setScene("Menu");
    this.scene.start("menu");
  }

  private open(child: Child, extra: Record<string, unknown> = {}) {
    this.closeChildren();
    const key = ({ market: "Market", stall: "Stall", evening: "Evening" } as const)[child];
    this.ctx.setScene(key);
    this.scene.launch(child, { ctx: this.ctx, day: this, ...extra });
  }

  private closeChildren() {
    for (const k of CHILDREN) if (this.scene.isActive(k) || this.scene.isPaused(k)) this.scene.stop(k);
  }

  // ───────────────────────────────────────────────────────── nghe sự kiện

  private wire() {
    const { ctx } = this;
    const on = <K extends EventKey>(k: K, fn: (p: EventMap[K]) => void) => { this.off.push(bus.on(k, fn)); };

    on("market:done", () => this.open("stall"));
    on("stall:closed", (p) => {
      const w = ctx.world;
      bus.emit("day:ended", {
        dayIndex: w.progress.dayIndex,
        summary: { served: p.served, lost: p.lost, revenue: p.revenue },
      });
      this.open("evening");
      ctx.save.request("SCENE_CHANGE");
    });
    on("evening:done", () => {
      const w = ctx.world;
      if (w.progress.dayIndex >= SEASON_DAYS) {
        // T4: một mùa có điểm kết. Cú quay lại ngày 40 là việc của P4 — ở đây chỉ dừng đúng chỗ.
        w.flags.seasonOver = true;
        this.quitToMenu();
        return;
      }
      w.progress.dayIndex++;
      w.progress.dayStartSnapshotRef = null;
      this.beginDay();
    });

    // Autosave — P0-02 §2.6: ghi NGAY khi sự kiện xảy ra, không đợi hết ngày.
    on("npc:left", () => ctx.save.request("CUSTOMER_DONE"));
    on("perception:confirmed", () => ctx.save.request("EVENT"));    // cú ghi quan trọng nhất của §8e
    on("gossip:seeded", () => ctx.save.request("EVENT"));
    on("relationship:tierChanged", () => ctx.save.request("EVENT"));
    on("obligation:due", () => ctx.save.request("EVENT"));
    on("money:changed", (p) => { if (Math.abs(p.delta) >= MONEY_SAVE_THRESHOLD) ctx.save.request("EVENT"); });

    // Mất focus / đóng tab: ghi đồng bộ, ép ngay.
    const hidden = () => { if (document.visibilityState === "hidden") ctx.save.flushNow("QUIT"); };
    const unload = () => ctx.save.flushNow("QUIT");
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("beforeunload", unload);
    this.off.push(() => document.removeEventListener("visibilitychange", hidden));
    this.off.push(() => window.removeEventListener("beforeunload", unload));
  }

  private teardown() {
    for (const f of this.off) f();
    this.off = [];
    if (DEV_TOOLS && dev.ctx === this.ctx) dev.ctx = null;
  }
}
