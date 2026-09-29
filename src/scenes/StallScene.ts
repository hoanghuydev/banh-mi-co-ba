import Phaser from "phaser";
import { GAME_W, GAME_H } from "../core/config";
import { Clock, DAY_END_MIN, PEAK_START_MIN } from "../core/clock";
import { bus, type StimId } from "../core/eventbus";
import { Rng } from "../core/rng";
import { loadSettings, saveGame, type SaveData, type Settings } from "../core/save";
import { Service } from "../sim/service";
import { diffDish, ticketOf, type Ingredient } from "../sim/order";
import { CustomerActor } from "../entities/CustomerActor";
import { AssemblyPanel } from "../ui/AssemblyPanel";
import { TH, TW, depthOf, toScreen } from "../world/iso";
import { SIGN_TILE, WORLD_H, WORLD_W, assertWalkable, floorAt, isSunlit, tileAt } from "../world/map";
import {
  blockedReason, stationAtTile, stationNear, type Station,
} from "../world/stations";
import {
  BASE, FX, TILE, buildTextures, createSign, floorTextureAt, footY, textureForTile,
} from "../art";
import { Player } from "../entities/Player";
import { Hud } from "../ui/Hud";
import { UI, button, label, panel, FONT } from "../ui/theme";
import { music, type CueId } from "../audio/music";

/** Lớp nhãn trạm: trên mọi đạo cụ, dưới HUD. */
const LABEL_DEPTH = 8_000_000;

const SEASON_DAYS = 40;                                 // CANON T4: một mùa có điểm kết

/**
 * Một kích thích "sống" bao nhiêu giây game thì khách còn cơ hội nhận thấy.
 * Bánh cháy có MÙI nên kéo dài nhất; làm rớt đồ có tiếng động, tắt nhanh hơn.
 * Con số ở đây là thứ phải tune theo §5: `DROPPED_FOOD` (75) × khách nhìn thẳng
 * phải chạm CONFIRMED sau ~1,4 giây.
 */
const STIM_SECONDS: Partial<Record<StimId, number>> = {
  BURNT_OR_COLD: 6,
  DROPPED_FOOD: 3,
  DIRTY_HANDS: 2,
  // đủ dài để khách KỸ TÍNH đứng nhìn thẳng kịp chạm NOTICED (~3,1s),
  // nhưng khách xuề xoà hoặc đang bấm điện thoại thì vẫn không thấy gì
  ORDER_DEFECT: 4.5,
  // một người bỏ đi giữa chừng thì cả hàng đều nghe — CANON §3.1, bỏ qua gazeFactor
  MADE_THEM_WAIT: 5,
};

/**
 * Sự kiện tiêu cực làm NHẠC DỪNG (P5-03 §6.5 #2): trong một game mà im lặng là
 * một trong các phản ứng, nhạc chạy đè lên là nuốt mất khoảnh khắc đó.
 *
 * Đúng luật thì phải dừng lúc khách chạm `CONFIRMED`; tầng perception chưa bắn
 * ra sự kiện đó nên tạm bám vào lúc kích thích PHÁT RA. Đổi sang CONFIRMED là
 * sửa đúng một dòng ở chỗ đăng ký nghe bên dưới.
 */
const HUSH_ON: ReadonlySet<StimId> = new Set<StimId>(["BURNT_OR_COLD", "DROPPED_FOOD"]);

/** Nhạc dừng bao nhiêu giây sau một sự kiện tiêu cực (P5-03 §6.5 #2). */
const HUSH_SECONDS = 6;

/**
 * Quán bánh mì ở góc hẻm — scene này chỉ ĐIỀU PHỐI.
 * Vẽ cảnh: `art/`. Nhân vật: `entities/Player`. Thông tin: `ui/Hud`.
 * Luật trạm: `world/stations`. Bản đồ: `world/map`.
 *
 * KHÔNG dùng Container để gom cảnh: Container của Phaser không depth-sort con,
 * bỏ vào đó là mọi `setDepth` mất tác dụng và vật phía sau đè lên vật phía trước.
 * Thay vào đó mọi thứ nằm thẳng trên display list (có sort) và cả cảnh được
 * canh giữa bằng CAMERA SCROLL. HUD miễn nhiễm nhờ `setScrollFactor(0)`.
 */
export class StallScene extends Phaser.Scene {
  private save!: SaveData;
  private settings!: Settings;
  private clock = new Clock();

  private player!: Player;
  private hud!: Hud;
  private ring!: Phaser.GameObjects.Image;

  private served = 0;
  private near: Station | null = null;

  private service!: Service;
  private actors = new Map<string, CustomerActor>();
  private assembly!: AssemblyPanel;
  /** Nhân đang kẹp trong ổ bánh trên tay. */
  private dish: Ingredient[] = [];
  /** Giây THẬT kể từ đầu buổi — thang thời gian của tầng nhận thấy. */
  private elapsed = 0;
  /** Trạm đang giữ phím + số ms đã giữ. Một chỗ duy nhất giữ state của thao tác. */
  private busy: { st: Station; ms: number } | null = null;

  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private paused = false;
  private overlay: Phaser.GameObjects.Container | null = null;
  private offStimulus?: () => void;

  constructor() { super("stall"); }

  init(data: { save: SaveData }) {
    this.save = data.save;
    this.settings = loadSettings();
    this.clock = new Clock();
    this.served = 0;
    this.near = null;
    this.busy = null;
    this.paused = false;
    this.overlay = null;
    this.dish = [];
    this.elapsed = 0;
    this.actors.clear();
  }

  create() {
    // Vỡ ngay nếu ai đó vừa sửa bản đồ mà chặn mất cổng khách hay chỗ xếp hàng.
    if (import.meta.env.DEV) assertWalkable();

    buildTextures(this);
    this.cameras.main.setBackgroundColor("#6f838d");

    this.bakeGround();
    this.centerCamera(this.placeProps());

    this.ring = this.add.image(0, 0, FX.ring).setOrigin(0.5, 0.5).setVisible(false);

    this.player = new Player(this);
    this.player.reset();

    this.hud = new Hud(this, this.settings);
    // Seed cố định theo ngày -> phát lại ngày đó ra y hệt, chống save-scum (CANON §8e).
    // Còn `seasonSeed` + `npcMemory` là phần phải sống xuyên ngày: đơn "ruột" của
    // mỗi khách và số lần đã ghé. Sinh lại mỗi sáng là "như mọi bữa" mất nghĩa.
    this.service = new Service({
      dayRng: Rng.forDay(this.save.seed, this.save.day),
      seasonSeed: this.save.seed,
      persist: this.save.npcMemory,
    });
    this.assembly = new AssemblyPanel(this, (dish) => this.finishDish(dish));
    this.bindInput();

    // CANON §15.2: chế độ không giới hạn thời gian -> đồng hồ đứng yên,
    // ngày chỉ kết thúc khi người chơi tự đóng hàng.
    this.clock.paused = this.settings.noTimePressure;

    // Sự kiện phát ra từ phía SỰ KIỆN (CANON §5) -> vừa ghi log, vừa nạp vào
    // tầng nhận thấy của mọi người đang đứng đó.
    this.offStimulus = bus.on("stimulus", (s) => {
      this.hud.log(stimText(s.id));
      const secs = STIM_SECONDS[s.id];
      if (secs) this.service.pushStimulus(s.id, s.slot, this.nowSec, secs);
      if (HUSH_ON.has(s.id)) music.hush(HUSH_SECONDS);
    });

    music.duck(false);
    this.syncMusic();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.offStimulus?.();
      for (const a of this.actors.values()) a.destroy();
      this.actors.clear();
    });
  }

  // ───────────────────────────────────────────────────────────────── dựng cảnh

  /**
   * Cả góc quán nằm gọn một khung hình — không có camera đi lang thang (CANON T1).
   *
   * Canh theo HÌNH BAO THẬT của những gì đã dựng, không theo hình bao của lưới ô:
   * tường cao nhô lên trên hàng đầu tiên cả trăm pixel, canh theo lưới là cắt mất ngọn.
   * Canh bằng scroll của camera, không bằng vị trí của Container (Container không sort depth).
   */
  private centerCamera(scene: Phaser.GameObjects.Image[]) {
    const bounds = new Phaser.Geom.Rectangle();
    scene.forEach((img, i) => {
      const b = img.getBounds();
      if (i === 0) bounds.setTo(b.x, b.y, b.width, b.height);
      else Phaser.Geom.Rectangle.Union(bounds, b, bounds);
    });
    this.cameras.main.setScroll(
      bounds.centerX - GAME_W / 2,
      bounds.centerY - GAME_H / 2,
    );
  }

  /**
   * Nền không bao giờ đổi -> nướng hết vào MỘT RenderTexture.
   * Gọi drawFrame() cho từng ô riêng lẻ sẽ tụt fps thấy rõ khi map to ra.
   */
  private bakeGround() {
    const minX = toScreen(0, WORLD_H).sx - TW;
    const minY = toScreen(0, 0).sy - TH;
    const w = toScreen(WORLD_W, 0).sx - minX + TW;
    const h = toScreen(WORLD_W, WORLD_H).sy - minY + TH + BASE * 2;

    const rt = this.add.renderTexture(minX, minY, w, h).setOrigin(0, 0).setDepth(-1_000_000);
    const put = (key: string, tx: number, ty: number) => {
      const { sx, sy } = toScreen(tx + 0.5, ty + 0.5);
      rt.batchDrawFrame(key, undefined, sx - minX - (TW + 2) / 2, footY(sy) - minY - (TH + BASE + 2));
    };

    rt.beginDraw();
    for (let ty = 0; ty < WORLD_H; ty++)                 // sàn quán / vỉa hè / mặt đường
      for (let tx = 0; tx < WORLD_W; tx++) put(floorTextureAt(floorAt(tx, ty), tx, ty), tx, ty);
    for (let ty = 0; ty < WORLD_H; ty++)                 // vạt nắng dán chồng lên sàn
      for (let tx = 0; tx < WORLD_W; tx++) if (isSunlit(tx, ty)) put(TILE.sun, tx, ty);
    rt.endDraw();
  }

  /** Mọi thứ đứng trên sàn: duyệt bản đồ một lần, ra sprite có depth đúng. */
  private placeProps() {
    const placed: Phaser.GameObjects.Image[] = [];
    for (let ty = 0; ty < WORLD_H; ty++) {
      for (let tx = 0; tx < WORLD_W; tx++) {
        const code = tileAt(tx, ty);
        const key = textureForTile(code, tx, ty, {
          isCounterEnd: code === "Q" && (tileAt(tx - 1, ty) !== "Q" || tileAt(tx + 1, ty) !== "Q"),
          isStation: stationAtTile(tx, ty) !== null,
        });
        if (!key) continue;

        const img = this.addAt(key, tx, ty);
        placed.push(img);
        const st = stationAtTile(tx, ty);
        if (st) this.addStationLabel(st, img);
      }
    }

    // Bảng hiệu nằm trong mặt vách của tường sau.
    // Depth phải vượt TOÀN BỘ hàng tường y=0: bảng rộng bằng mấy ô, mà ô bên phải
    // cùng hàng lại có depth cao hơn -> để depth theo ô của chính nó thì bị cắt mất
    // nửa bên phải. Không ảnh hưởng các hàng sau vì chúng nằm ở dải x khác hẳn.
    const { sx, sy } = toScreen(SIGN_TILE.x, SIGN_TILE.y);
    createSign(this, sx, sy, depthOf(WORLD_W, 0) + 1);

    return placed;
  }

  private addAt(key: string, tx: number, ty: number) {
    const { sx, sy } = toScreen(tx + 0.5, ty + 0.5);
    return this.add.image(sx, footY(sy), key)
      .setOrigin(0.5, 1)
      .setDepth(depthOf(tx + 0.5, ty + 0.5));
  }

  /**
   * Tên trạm dán ngay trên đạo cụ, để không ai phải đoán khối nào là lò, khối nào là kệ.
   * Nhãn nằm trên MỘT lớp riêng cao hơn mọi đạo cụ — nếu để depth theo ô thì bảng hiệu
   * hay khúc xe ở gần camera hơn sẽ che mất nhãn của trạm phía sau.
   */
  private addStationLabel(st: Station, img: Phaser.GameObjects.Image) {
    const y = img.y - img.displayHeight - 5;
    const t = this.add.text(img.x, y, st.name, {
      fontFamily: FONT, fontSize: "11px", fontStyle: "500", color: "#f4f1e8",
    }).setOrigin(0.5).setDepth(LABEL_DEPTH + 1);

    const g = this.add.graphics().setDepth(LABEL_DEPTH);
    g.fillStyle(0x1b2429, 0.62);
    g.fillRoundedRect(img.x - t.width / 2 - 8, y - t.height / 2 - 3, t.width + 16, t.height + 6, 8);
  }

  /**
   * Mốc thời gian của tầng nhận thấy — giây THẬT, không phải giờ trong game.
   * Đồng hồ ngày bị nén (1 giây thật = 1 phút game); dùng nó cho perception thì
   * mọi kích thích tắt ngay trước khi ai kịp nhìn.
   */
  private get nowSec() {
    return this.elapsed;
  }

  // ───────────────────────────────────────────────────────────────────── input

  private bindInput() {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys("W,A,S,D,UP,LEFT,DOWN,RIGHT,E,SPACE,Q,ESC") as any;

    // Bảng kẹp nhân được quyền nuốt phím trước; Esc vẫn luôn là pause thật (CANON §15.2).
    kb.on("keydown", (ev: KeyboardEvent) => {
      if (ev.code === "Escape") return;
      if (this.assembly.handleKey(ev.code)) ev.stopImmediatePropagation();
    });
    kb.on("keydown-ESC", () => (this.paused ? this.resume() : this.pause()));
    kb.on("keydown-Q", () => { if (!this.assembly.isOpen) this.dropHeld(); });
    kb.on("keydown-E", () => { if (!this.assembly.isOpen) this.press(); });
    kb.on("keydown-SPACE", () => { if (!this.assembly.isOpen) this.press(); });
  }

  private holdingWorkKey() {
    return this.keys.E.isDown || this.keys.SPACE.isDown;
  }

  // ──────────────────────────────────────────────────────────────────── update

  update(_t: number, dtMs: number) {
    // Chặn nhảy cóc khi tab bị treo / máy lag: một buổi bán không được tự trôi
    // mấy chục phút chỉ vì người chơi chuyển sang tab khác.
    const stepMs = Math.min(Number.isFinite(dtMs) ? dtMs : 0, 50);
    const dt = stepMs / 1000;

    if (!this.paused) {
      this.elapsed += dt;
      this.clock.tick(stepMs);
      if (this.clock.isOver && !this.overlay) return this.endDay();

      this.player.move({
        up: this.keys.W.isDown || this.keys.UP.isDown,
        down: this.keys.S.isDown || this.keys.DOWN.isDown,
        left: this.keys.A.isDown || this.keys.LEFT.isDown,
        right: this.keys.D.isDown || this.keys.RIGHT.isDown,
      }, dt);

      this.near = stationNear(this.player.x, this.player.y);
      // đi khỏi trạm là huỷ thao tác — không cho "giữ phím rồi chạy đi chỗ khác"
      if (this.busy && this.near?.id !== this.busy.st.id) this.busy = null;
      this.tickStation(stepMs);

      this.service.update(dt, {
        minutes: this.clock.minutes,
        nowSec: this.nowSec,
        // CANON §15.2: chế độ không giới hạn thời gian -> kiên nhẫn đứng yên.
        // Khách vẫn bỏ đi vì bạn làm SAI, nhưng không bao giờ vì bạn CHẬM.
        pressure: !this.settings.noTimePressure,
        dayOver: this.clock.isOver,
      });
      this.drainService();
      this.syncActors();
      this.syncMusic();
    }

    this.player.draw(this.settings.reducedMotion);
    for (const a of this.actors.values()) a.draw(this.settings.reducedMotion, this.time.now);
    this.drawRing();
    this.hud.update({
      day: this.save.day, seasonDays: SEASON_DAYS, clock: this.clock,
      money: this.save.money, served: this.served,
      near: this.near, hand: this.player.hand, busy: this.busy,
      frozen: this.paused || this.clock.isOver,
      ticket: this.frontTicket(),
    });
  }

  /** Phiếu đơn của người đang đứng trước mặt. Khách nói "như mọi bữa" thì KHÔNG hiện gì. */
  private frontTicket() {
    const c = this.service.front;
    if (!c || !c.order || c.phase === "leaving") return null;
    return {
      name: c.name,
      text: c.order.intent.usual ? "\"như mọi bữa\" — tự nhớ lấy" : ticketOf(c.order),
      urgent: c.mood === "annoyed",
    };
  }

  /** Dựng / dọn sprite khách theo danh sách trong `Service`. */
  private syncActors() {
    const live = new Set<string>();
    for (const c of this.service.customers) {
      live.add(c.id);
      if (!this.actors.has(c.id)) this.actors.set(c.id, new CustomerActor(this, c));
    }
    for (const [id, actor] of this.actors) {
      if (live.has(id)) continue;
      actor.destroy();
      this.actors.delete(id);
    }
  }

  private drainService() {
    for (const ev of this.service.drain()) {
      if (ev.kind === "log") this.hud.log(ev.text);
      else if (ev.kind === "paid") {
        this.save.money += ev.amount;
        if (ev.item === "dish") this.served++;         // ly trà không tính là một "phần"
        saveGame(this.save);                           // CANON §2: autosave sau mỗi khách
      }
      else this.emit(ev.id);
    }
  }

  /** Thao tác giữ phím. Lò là chỗ duy nhất có "quá tay" — vạch đỏ luôn nhìn thấy (CANON T5). */
  private tickStation(dtMs: number) {
    const st = this.near;
    const usable = st && !blockedReason(st, this.player.hand) && st.holdMs > 0;

    if (!usable || !this.holdingWorkKey()) {
      // thả tay đúng lúc bánh vừa vàng thì ăn; thả sớm thì huỷ, không phạt
      if (this.busy && this.busy.st.overcookMs && this.busy.ms >= this.busy.st.holdMs) {
        this.finish(this.busy.st);
      }
      this.busy = null;
      return;
    }

    if (!this.busy || this.busy.st.id !== st!.id) this.busy = { st: st!, ms: 0 };
    this.busy.ms += dtMs;

    if (st!.overcookMs) {
      if (this.busy.ms >= st!.overcookMs) {              // giữ quá tay: cháy, không cứu được
        this.player.hand = st!.spoils ?? "loaf_burnt";
        this.emit("BURNT_OR_COLD");
        this.busy = null;
      }
    } else if (this.busy.ms >= st!.holdMs) {
      this.finish(st!);
      this.busy = null;
    }
  }

  /** Nhấn một cái ăn ngay (trạm có holdMs = 0). Tách hàm để test gọi thẳng được. */
  private press() {
    if (this.paused || this.clock.isOver) return;
    const st = this.near;
    if (st && st.holdMs === 0 && !blockedReason(st, this.player.hand)) this.finish(st);
  }

  private finish(st: Station) {
    switch (st.id) {
      case "board":                                     // T2: mở bảng CHỌN NGUYÊN LIỆU
        this.assembly.show();
        return;

      case "handoff":
        return this.handOver();

      default:
        this.player.hand = st.gives;
        if (st.id === "oven") this.hud.log("bánh vừa vàng — thơm.");
    }
  }

  /**
   * Gói ổ bánh lại. So ngay với đơn của người đang đứng trước mặt: nếu sai, phát
   * `ORDER_DEFECT` tại slot BOARD — khách ĐANG NHÌN thì sẽ thấy, và lúc đưa bánh
   * họ nói câu "tôi thấy con quên bỏ hành rồi đó" thay vì "ủa… thiếu hành rồi".
   * Đó chính là trụ cột T1 dưới dạng kỹ thuật (CANON §6).
   */
  private finishDish(dish: Ingredient[]) {
    this.dish = dish;
    this.player.hand = "loaf_filled";

    const want = this.service.front?.order;
    if (want && diffDish(want, dish).length > 0) this.emit("ORDER_DEFECT");
  }

  private handOver() {
    const res = this.player.hand === "tea"
      ? this.service.serveTea()
      : this.service.serveDish(this.dish);

    if (!res.ok) { this.hud.log(res.reason ?? "chưa đưa được"); return; }

    this.player.hand = "empty";
    this.dish = [];
    saveGame(this.save);                                // CANON §2: autosave sau mỗi khách
  }

  /** CANON §7.2: đồ hỏng là BẮT BUỘC bỏ. Không có nút nhặt lên dùng tiếp. */
  private dropHeld() {
    if (this.paused || this.player.hand === "empty") return;
    const wasBurnt = this.player.hand === "loaf_burnt";
    this.player.hand = "empty";
    this.busy = null;
    this.emit("DROPPED_FOOD");
    // lời của cô Ba đi SAU sự kiện, để nó là dòng cuối người chơi đọc được
    if (wasBurnt) this.hud.log("cô Ba: \"bánh đó con để cô ăn.\"");   // CANON §7.4: cô buồn chứ không la
  }

  private emit(id: StimId) {
    bus.emit("stimulus", { id, slot: this.near?.slot ?? "HANDS", at: this.clock.minutes * 60 });
  }

  /** Vòng sáng dưới chân trạm đang với tới được — người chơi không phải đoán. */
  private drawRing() {
    if (!this.near) { this.ring.setVisible(false); return; }
    const { sx, sy } = toScreen(this.near.tx + 0.5, this.near.ty + 0.5);
    const pulse = this.settings.reducedMotion ? 0.2 : Math.sin(this.time.now / 260) * 0.2;
    this.ring.setVisible(true)
      .setPosition(sx, sy)
      .setDepth(depthOf(this.near.tx + 0.5, this.near.ty + 0.5) - 2)
      .setAlpha(0.55 + pulse);
  }

  /**
   * Nhạc bám theo GIỜ TRONG NGÀY — P5-03 §6.4.
   *
   * Cố ý không có nhánh nào đọc `served`, `money` hay số lỗi: nhạc phản ứng với
   * BỐI CẢNH, không bao giờ là bảng điểm (vi phạm là hỏng trụ cột T3).
   * Gọi mỗi frame cũng không sao — `music.play` bỏ qua nếu đã đúng cue.
   */
  private syncMusic() {
    const cue: CueId = this.clock.isPeak ? "cao_diem"
      : this.clock.minutes < PEAK_START_MIN ? "to_mo"
      : "lang";
    music.play(this, cue);
  }

  // ───────────────────────────────────────────────────────── tạm dừng / kết ngày

  /** CANON §15.2: pause mọi lúc, và pause đóng băng CẢ sự kiên nhẫn của khách. */
  private pause() {
    if (this.overlay) return;
    this.paused = true;
    this.busy = null;
    music.duck(true);            // P5-03 §6.5 #8: hạ chứ không tắt — pause phải thấy an toàn
    this.overlay = this.modal("Tạm dừng", [
      ["Tiếp tục bán", () => this.resume()],
      ["Đóng hàng, về sảnh", () => this.endDay()],
    ]);
  }

  private resume() {
    this.overlay?.destroy(true);
    this.overlay = null;
    this.paused = false;
    music.duck(false);
  }

  private endDay() {
    this.overlay?.destroy(true);
    this.paused = true;
    this.clock.minutes = DAY_END_MIN;
    music.duck(false);
    music.play(this, "toi", 2200);      // cảnh tối, đếm tiền — P5-03 §6.3 `mus_toi`

    const finished = this.save.day;
    this.save.day = Math.min(SEASON_DAYS, this.save.day + 1);
    saveGame(this.save);
    bus.emit("dayEnded", { day: finished });

    const lost = this.service.lostCount;
    const sub = `đã đưa ${this.served} phần  ·  ${this.save.money.toLocaleString("vi-VN")}₫ trong ống`
      + (lost ? `\n${lost} người bỏ đi vì chờ lâu` : "");
    this.overlay = this.modal(`Hết buổi — ngày ${finished}`, [
      ["Về sảnh", () => this.scene.start("menu")],
    ], sub);
  }

  private modal(title: string, actions: [string, () => void][], sub?: string) {
    const c = this.add.container(0, 0).setDepth(9_500_000).setScrollFactor(0);
    c.add(this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x0d1216, 0.55));
    c.add(panel(this, GAME_W / 2, GAME_H / 2, 420, sub ? 232 : 200, UI.paper, 0.98));
    c.add(label(this, GAME_W / 2, GAME_H / 2 - (sub ? 68 : 52), title, 22, UI.ink, "700"));
    if (sub) c.add(label(this, GAME_W / 2, GAME_H / 2 - 32, sub, 13, UI.muted, "400"));

    actions.forEach(([text, fn], i) =>
      c.add(button(this, GAME_W / 2, GAME_H / 2 + 10 + i * 58, text, fn, { width: 280, primary: i === 0 })));
    return c;
  }
}

function stimText(id: StimId) {
  return ({
    WRONG_NAME: "· gọi sai tên khách",
    MADE_THEM_WAIT: "· để khách chờ quá lâu",
    BURNT_OR_COLD: "· bánh cháy — có mùi, cả phố ngửi thấy",
    DROPPED_FOOD: "· bỏ đồ đang cầm",
    ORDER_DEFECT: "· ổ bánh không đúng đơn",
    DIRTY_HANDS: "· tay chưa sạch mà bốc đồ ăn",
    REMEMBERED_USUAL: "· nhớ đúng \"như mọi bữa\"",
    REMEMBERED_STORY: "· hỏi thăm đúng chuyện hôm trước",
    CARED_FOR_THEM: "· đưa ly trà đá",
    FREE_EXTRA: "· cho thêm đồ chua",
    FLOURISH: "· gói gọn, đưa hai tay",
  } as Record<StimId, string>)[id];
}
