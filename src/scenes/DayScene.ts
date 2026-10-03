import Phaser from "phaser";
import { fitDesignFrame } from "../core/render";
import { bedtime, dawn, eveningCounting, neighborTick } from "../sim/day";
import { settleNight } from "../sim/night";
import { duesOpen, pay } from "../sim/obligations";
import { bus, type EventKey, type EventMap } from "../core/eventbus";
import { GameContext } from "../core/context";
import { DAY_START_MIN } from "../core/clock";
import { SEASON_DAYS, SaveService, SaveTooNewError, newGame, type SaveFile } from "../core/save";
import { gcBags } from "../core/rng";
import { DEV_TOOLS } from "../core/flags";
import { dev } from "../dev/registry";
import { refillPresets } from "../sim/presets";
import { sfx } from "../audio/sfx";

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

const CHILDREN = ["market", "stall", "evening", "ending"] as const;
type Child = typeof CHILDREN[number];

/** Tiền đổi ít nhất ngần này mới đáng một lần autosave riêng (P0-02 §2.6). */
const MONEY_SAVE_THRESHOLD = 20_000;

export class DayScene extends Phaser.Scene {
  ctx!: GameContext;
  private off: (() => void)[] = [];

  constructor() { super("day"); }

  create(data: DayStart = { mode: "continue" }) {
    fitDesignFrame(this.cameras.main);          // canvas phóng to, toạ độ giữ nguyên — `core/render`
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

  /**
   * Giờ chơi THẬT (kể cả pause — Steam cũng tính vậy). P4-02 §2.3: cú lộ đồn thổi bắn ở
   * ngày 9 HOẶC phút thứ 90, cái nào tới trước. Frame dài (tab ẩn) bị cắt ở 250 ms.
   */
  update(_t: number, delta: number) {
    const t = this.ctx?.world.telemetry;
    if (t) t.totalPlayMs = (t.totalPlayMs ?? 0) + Math.min(250, Math.max(0, delta));
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
    w.progress.today = { served: 0, lost: 0, revenue: 0, talksDeep: 0, talkOffers: 0 };
    w.progress.scene = "Market";
    // P1-01 §2.6: sáng nào cũng chia lại phần cho 3 preset.
    w.stall.presets = refillPresets(w.stall.presets as never);
    // P3-06: xe đã bán bớt (CART_DOWNGRADED) chỉ còn 2 chỗ kẹp sẵn — vĩnh viễn trong mùa
    if (w.econ && w.stall.presets.length > w.econ.presetSlots) w.stall.presets = w.stall.presets.slice(0, w.econ.presetSlots);
    // P1-02 §2.10: qua đêm cô Ba dọn bớt — sáng ra còn 40% độ bẩn hôm qua.
    w.stall.cleanliness = 1 - (1 - w.stall.cleanliness) * 0.4;
    gcBags(w.shuffleBags, w.progress.dayIndex);
    // P3: rạng sáng — trời hôm nay, dọn hàng hư, thu tiền chỗ. TRƯỚC bản chụp đầu ngày, để
    // "chơi lại ngày này" không thu tiền chỗ hai lần và ra đúng trời đó, giá đó.
    dawn(w);
    ctx.sync();
    w.progress.dayStartSnapshotRef = ctx.save.writeDayStart(ctx.snapshot());
    bus.emit("day:started", { dayIndex: w.progress.dayIndex, daySeed: ctx.rng.daySeed, weather: w.progress.weather });
    // Ngày mới: một tiếng chuông khẽ + cửa cuốn kéo lên. §4.2 B gọi cửa cuốn là
    // "âm mở đầu ngày" — nó nằm ở ĐÂY chứ không ở `StallScene`, vì ngày bắt đầu
    // từ lúc đi chợ, và cảnh quán còn bị mở lại khi "chơi lại ngày này".
    sfx.play(this, "ui_chuyen_ngay");
    sfx.play(this, "sfx_cua_cuon", { delay: 450, volume: 0.8 });
    this.open("market");
    ctx.save.request("SCENE_CHANGE");
  }

  /** "Chơi tiếp": vào lại ĐÚNG chỗ đang đứng, bộ đếm RNG đúng chỗ đã dừng. */
  private resume() {
    const { ctx } = this;
    const p = ctx.world.progress;
    ctx.rng.fromJSON(ctx.world.saveId, p.dayIndex, ctx.world.rng.counters);
    ctx.clock.reset(p.gameMinutes);
    // Save từ bản dựng cũ ghi màn kết dưới key "Evening" (lúc đó `SceneKey` chưa có "Ending").
    // Nhánh dưới cứu đúng những save đó; save mới đi thẳng qua bảng `at`.
    // Thiếu nhánh này thì reload giữa màn kết rơi vào CẢNH TỐI của ngày 40 — đúng cái cảnh
    // P4-04 cấm — và người chơi mất màn kết vĩnh viễn.
    // Vế thứ hai là để cứu save cũ: ngày 40 không bao giờ có cảnh tối hợp lệ, nên save nào
    // ghi "Evening" ở ngày 40 là save của bản dựng lỗi trước đó — cũng trả về màn kết.
    if (ctx.world.flags.endingReached || (p.dayIndex >= SEASON_DAYS && p.scene === "Evening")) {
      this.open("ending", { resume: true });
      return;
    }
    const at: Record<string, Child> = { Market: "market", Stall: "stall", Evening: "evening", Ending: "ending" };
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

  /**
   * Khép sổ ngày 40 — P4-04 cấm CẢNH tối của ngày 40, không cấm việc QUYẾT TOÁN ngày 40.
   * Bỏ hẳn bước này thì sổ cái thiếu hẳn dòng ngày 40, và hụi kỳ 8 (đáo hạn đúng ngày 40,
   * `lastGraceDays: 0`) rơi vào khoảng trống: không góp được mà cũng không vỡ được.
   *
   * Thứ tự y hệt cảnh tối (EveningScene) và y hệt `nextDay()` của sim headless, để 40 ngày
   * chạy trong Node ra đúng cái người chơi thấy (P0-02 §2.5).
   */
  private settleFinalDay() {
    const w = this.ctx.world;
    const day = w.progress.dayIndex;
    eveningCounting(w);                       // chi phí cố định + rút về nhà (một lần mỗi tối)
    neighborTick(w);
    // Không có cảnh tối = không có cái nút nào để góp. Khoản BẮT BUỘC hết hạn ĐÚNG HÔM NAY
    // được trả giùm nếu két đủ — fail mềm (P3-06) phải là hệ quả của một lựa chọn, không phải
    // của việc game không đưa ra lựa chọn nào.
    for (const d of duesOpen(w.econ, day)) if (d.mandatory && d.lastDay <= day) pay(w.econ, w.money, d, day);
    bedtime(w);
    settleNight(w, bus);
    eveningCounting(w);                       // ghi lại dòng sổ cái SAU khi đã trả nghĩa vụ
  }

  /**
   * Chỉ cho dev (`day.weather`): dựng lại cảnh quán TẠI CHỖ, giữ nguyên giờ và state.
   *
   * Phải đi qua `open()` chứ không gọi `scene.restart()` từ ngoài: `StallScene.init`
   * cần `ctx` và `day` trong `data`, mà `restart()` thì chỉ mang theo đúng cái người
   * gọi đưa — thiếu hai thứ đó là cảnh quán chết ngay ở dòng đầu `init`.
   *
   * Dùng để xem thử nền nướng lại (ngày mưa: mặt đường ướt, tắt vạt nắng) mà không
   * phải chơi tới ngày 6.
   */
  devReopenStall() {
    this.open("stall", { resume: true });
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
    // Màn kết có `SceneKey` riêng ("Ending"), nên reload giữa màn kết quay lại đúng chỗ.
    // Cờ `endingReached` giữ lại làm lưới đỡ cho save ghi bởi bản dựng cũ.
    const key = ({ market: "Market", stall: "Stall", evening: "Evening", ending: "Ending" } as const)[child];
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
      // P4-04: ngày 40 không có cảnh tối — sau khoảng lặng là màn kết.
      // `endingReached` ≠ `seasonOver`: mùa chỉ "đã kết" khi người chơi xem HẾT màn kết và tự bấm
      // về sảnh (EndingScene). Đặt `seasonOver` ở đây thì reload giữa màn kết sẽ khoá luôn
      // "Chơi tiếp" (MenuScene) trong khi màn kết còn chưa được xem.
      if (w.progress.dayIndex >= SEASON_DAYS) {
        this.settleFinalDay();
        w.flags.endingReached = true;
        this.open("ending");
        ctx.save.flushNow("SCENE_CHANGE");
        return;
      }
      this.open("evening");
      ctx.save.request("SCENE_CHANGE");
    });
    on("ending:done", () => this.quitToMenu());
    // Doanh thu ngày ÂM — P5-03 §4.2 C: công tắc `disableNegativeAudioCues` tắt hẳn
    // tiếng này (`sfx.ts` lo, không phải chỗ này). Nó là lời phán xét của giao diện,
    // nên nó nằm trong danh sách tắt được; tiếng bánh rớt thì không.
    on("day:ended", (p) => { if (p.summary.revenue < 0) sfx.play(this, "ui_ngay_am_tien"); });
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
    on("perception:confirmed", (p) => {
      if (p.stimId === "DIRTY_HANDS") ctx.world.flags.dirtyHandsConfirmed = true;   // mở khoá vòi rửa (P3-04 C1)
      ctx.save.request("EVENT");
    });    // cú ghi quan trọng nhất của §8e
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
