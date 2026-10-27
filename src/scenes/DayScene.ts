import Phaser from "phaser";
import { fitDesignFrame, refitGame } from "../core/render";
import { dawn } from "../sim/day";
import { markBroke } from "../sim/broke";
import { markShutdown } from "../sim/reviews";
import { markWin } from "../sim/win";
import { checkEvening, checkLive, clearAch, wireAch } from "../sim/ach";
import { bus, type EventKey, type EventMap } from "../core/eventbus";
import { GameContext } from "../core/context";
import { DAY_START_MIN } from "../core/clock";
import { SaveService, newGame, type SaveFile } from "../core/save";
import { gcBags } from "../core/rng";
import { DEV_TOOLS } from "../core/flags";
import { dev } from "../dev/registry";
import { refillPresets } from "../sim/presets";
import { installPending } from "../sim/gear";
import { deliverDue } from "../sim/shop";
import { clearBuffsIfStale, linked } from "../sim/system";
import { addRewind } from "../core/rewinds";
import { morning as resellMorning } from "../sim/resell";
import { DEFAULT_SHOP_NAME } from "../content/shop";
import { phoneTick, type PhoneState } from "../sim/phone";
import { sfx } from "../audio/sfx";
import { ART_SHARE, LOADING, fadeOut, paintTick, setStep, showLoading } from "../ui/bootScreen";
import { whenWarm } from "./warmup";
import { nightIn, shutterDown, shutterFade, shutterHold } from "../ui/transition";
import { dailyTin } from "../sim/vietsoci";

/** Scene thường trực sở hữu `GameContext`, không bao giờ restart; scene con nhận ctx lúc launch và chỉ phát event. */
export type DayStart = { mode: "new"; shopName?: string; phone?: PhoneState } | { mode: "continue" };

const CHILDREN = ["stall", "evening", "broke", "win"] as const;
type Child = typeof CHILDREN[number];

const MONEY_SAVE_THRESHOLD = 20_000;

export class DayScene extends Phaser.Scene {
  ctx!: GameContext;
  private off: (() => void)[] = [];
  private entering = true;

  constructor() { super("day"); }

  create(data: DayStart = { mode: "continue" }) {
    fitDesignFrame(this.cameras.main);
    this.entering = true;
    const probe = new SaveService(bus, () => { throw new Error("probe"); });
    let world: SaveFile | null = null;
    if (data.mode === "continue") {
      world = probe.load();
    } else {
      probe.clear();
    }
    const fresh = !world;
    const start = world ?? newGame(data.mode === "new" && data.shopName || DEFAULT_SHOP_NAME);
    if (!world && data.mode === "new" && data.phone) start.phone = data.phone;
    this.ctx = new GameContext(start, bus);
    this.ctx.world.telemetry.sessionCount++;
    if (DEV_TOOLS) dev.ctx = this.ctx;

    clearAch();
    this.wire();

    if (fresh || !world!.progress.dayStartSnapshotRef) this.beginDay();
    else this.resume();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
  }

  /** Chụp bản đầu ngày để "Chơi lại ngày này" khôi phục đúng vị trí RNG, không reroll. */
  private beginDay() {
    const { ctx } = this;
    const w = ctx.world;
    ctx.rng.beginDay(w.saveId, w.progress.dayIndex);
    ctx.clock.reset(DAY_START_MIN);
    w.progress.today = { served: 0, lost: 0, revenue: 0, talksDeep: 0, talkOffers: 0 };
    w.progress.scene = "Stall";
    w.stall.presets = refillPresets(w.stall.presets as never);
    w.stall.cleanliness = 1 - (1 - w.stall.cleanliness) * 0.4;
    gcBags(w.shuffleBags, w.progress.dayIndex);
    // Trước bản chụp đầu ngày, để chơi lại không thu tiền chỗ hai lần.
    const installed = installPending(w);
    dawn(w);
    clearBuffsIfStale(w);
    deliverDue(w, DAY_START_MIN);
    resellMorning(w);
    phoneTick(w);
    dailyTin(w);
    ctx.sync();
    w.progress.dayStartSnapshotRef = ctx.save.writeDayStart(ctx.snapshot());
    bus.emit("day:started", { dayIndex: w.progress.dayIndex, daySeed: ctx.rng.daySeed, weather: w.progress.weather });
    // Ở đây chứ không ở `StallScene` vì cảnh quán còn bị mở lại giữa ngày.
    sfx.play(this, "ui_chuyen_ngay");
    sfx.play(this, "sfx_cua_cuon", { delay: 450, volume: 0.8 });
    this.open("stall", { installed });
    ctx.save.request("SCENE_CHANGE");
  }

  private resume() {
    const { ctx } = this;
    const p = ctx.world.progress;
    ctx.rng.fromJSON(ctx.world.saveId, p.dayIndex, ctx.world.rng.counters);
    ctx.clock.reset(p.gameMinutes);
    if (ctx.world.flags.won) {
      this.open("win");
      return;
    }
    if (ctx.world.flags.broke) {
      this.open("broke");
      return;
    }
    const at: Record<string, Child> = { Stall: "stall", Evening: "evening", Broke: "broke", Win: "win" };
    this.open(at[p.scene] ?? "stall", { resume: true });
  }

  replayDay() {
    const w = this.ctx.world;
    const snap = this.ctx.save.readDayStart(w.saveId, w.progress.dayIndex);
    if (!snap) return false;
    this.closeChildren();
    this.ctx.world = snap;
    this.beginDay();
    return true;
  }

  /** Phải đi qua `open()`, không `scene.restart()`: `StallScene.init` cần `ctx` và `day` trong `data`. */
  devReopenStall() {
    this.open("stall", { resume: true });
  }

  quitToMenu() {
    this.ctx.save.flushNow("QUIT");
    this.closeChildren();
    this.ctx.setScene("Menu");
    this.scene.start("menu");
  }

  private open(child: Child, extra: Record<string, unknown> = {}) {
    if (child !== "stall") return this.launch(child, extra);
    const shown = this.entering;
    if (shown) showLoading(LOADING);
    const warm = () => whenWarm(shown ? (p) => setStep(LOADING, p * ART_SHARE) : undefined);
    warm()
      .catch((e) => {
        console.error("nướng ảnh lỗi, thử lại", e);
        return warm();
      })
      .then(paintTick)
      .then(() => { if (this.sys.isActive()) this.launch(child, extra); }, (e) => {
        console.error("nướng ảnh lỗi, về menu", e);
        fadeOut();
        if (this.sys.isActive()) this.quitToMenu();
      });
  }

  private closeShop() {
    void shutterDown(this).then(shutterHold).then(() => {
      if (this.sys.isActive()) this.launch("evening", {});
      void shutterFade();
    });
  }

  private launch(child: Child, extra: Record<string, unknown>) {
    this.entering = false;
    this.closeChildren();
    refitGame(this.game);
    const key = ({ stall: "Stall", evening: "Evening", broke: "Broke", win: "Win" } as const)[child];
    this.ctx.setScene(key);
    this.scene.launch(child, { ctx: this.ctx, day: this, ...extra });
  }

  private closeChildren() {
    for (const k of CHILDREN) if (this.scene.isActive(k) || this.scene.isPaused(k)) this.scene.stop(k);
  }

  private wire() {
    const { ctx } = this;
    const on = <K extends EventKey>(k: K, fn: (p: EventMap[K]) => void) => { this.off.push(bus.on(k, fn)); };

    this.off.push(wireAch(bus, () => ctx.world));

    on("stall:closed", (p) => {
      const w = ctx.world;
      bus.emit("day:ended", {
        dayIndex: w.progress.dayIndex,
        summary: { served: p.served, lost: p.lost, revenue: p.revenue },
      });
      this.closeShop();
      ctx.save.request("SCENE_CHANGE");
    });
    on("day:ended", (p) => { if (p.summary.revenue < 0) sfx.play(this, "ui_ngay_am_tien"); });
    on("evening:done", () => {
      const w = ctx.world;
      // Chốt sau cảnh tối, khi mọi khoản tiêu trong đêm đã đủ mặt.
      checkEvening(w);
      if (markWin(w)) {
        checkLive(w);
        ctx.save.flushNow("SCENE_CHANGE");
        this.open("win");
        return;
      }
      if (markShutdown(w) || markBroke(w)) {
        checkLive(w);
        ctx.save.flushNow("SCENE_CHANGE");
        this.open("broke");
        return;
      }
      void nightIn(`Ngày ${w.progress.dayIndex + 1}`).then(() => {
        if (!this.sys.isActive()) return;
        w.progress.dayIndex++;
        w.progress.dayStartSnapshotRef = null;
        this.beginDay();
      });
    });

    on("broke:done", (p) => {
      if (p.restart && linked(ctx.world)) addRewind();
      ctx.save.clear();
      this.closeChildren();
      this.scene.start(p.restart ? "intro" : "menu");
    });

    on("win:done", (p) => {
      ctx.save.clear();
      this.closeChildren();
      this.scene.start(p.restart ? "intro" : "menu");
    });

    on("npc:left", () => ctx.save.request("CUSTOMER_DONE"));
    on("perception:confirmed", (p) => {
      if (p.stimId === "DIRTY_HANDS") ctx.world.flags.dirtyHandsConfirmed = true;
      ctx.save.request("EVENT");
    });
    on("money:changed", (p) => { if (Math.abs(p.delta) >= MONEY_SAVE_THRESHOLD) ctx.save.request("EVENT"); });

    const hidden = () => { if (document.visibilityState === "hidden") ctx.save.flushNow("QUIT"); };
    const unload = () => ctx.save.flushNow("QUIT");
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("beforeunload", unload);
    window.addEventListener("pagehide", unload);
    this.off.push(() => document.removeEventListener("visibilitychange", hidden));
    this.off.push(() => window.removeEventListener("beforeunload", unload));
    this.off.push(() => window.removeEventListener("pagehide", unload));
  }

  private teardown() {
    for (const f of this.off) f();
    this.off = [];
    if (DEV_TOOLS && dev.ctx === this.ctx) dev.ctx = null;
  }
}
