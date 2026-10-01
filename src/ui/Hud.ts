import Phaser from "phaser";
import { GAME_W, GAME_H } from "../core/config";
import { BAND_LABEL, type Clock } from "../core/clock";
import type { Settings } from "../core/save";
import { blockedReason, type Hand, type Station } from "../world/stations";
import { INGREDIENTS, portionsOf, type Ingredient } from "../sim/order";
import { FOOD } from "../art/food";
import { FONT, UI } from "./theme";

const DEPTH = 9_000_000;
/** P1-04 §2.10: hướng dẫn phím thường trực chỉ tới hết ngày 3. */
const HELP_UNTIL_DAY = 3;

/**
 * Lớp thông tin trên màn hình. Tách khỏi scene vì HUD là thứ sẽ đổi nhiều nhất.
 *
 * CANON §15 / P1-04: cỡ chữ theo cài đặt và HỘP TỰ GIÃN theo chữ (200% không tràn),
 * nền ĐỤC (alpha 1), không viết hoa toàn bộ. Được hiện: giờ, tiền, câu khách gọi NGUYÊN
 * VĂN, thứ đã bỏ vào ổ đang cầm. KHÔNG hiện: điểm, sao, thanh kiên nhẫn, chỉ số quan hệ,
 * "đúng/sai" của hệ thống (P1-04 §2.10).
 */
export class Hud {
  private left: Phaser.GameObjects.Text;
  private right: Phaser.GameObjects.Text;
  private statBg: Phaser.GameObjects.Graphics;
  private prompt: Phaser.GameObjects.Text;
  private promptBg: Phaser.GameObjects.Graphics;
  private bar: Phaser.GameObjects.Graphics;
  private feedText: Phaser.GameObjects.Text;
  private feedBg: Phaser.GameObjects.Graphics;
  private feed: string[] = [];
  private ticketBg: Phaser.GameObjects.Graphics;
  private ticketText: Phaser.GameObjects.Text;
  private help: Phaser.GameObjects.Text;
  private saveDot: Phaser.GameObjects.Arc;
  private carryBg: Phaser.GameObjects.Graphics;
  private carryIcons: Phaser.GameObjects.Image[] = [];
  private carryNums: Phaser.GameObjects.Text[] = [];
  private carryKey = "";
  private handsGfx: Phaser.GameObjects.Graphics;
  private handsKey = "";
  private scene: Phaser.Scene;
  private fs: (n: number) => string;

  constructor(scene: Phaser.Scene, private settings: Settings, onPause?: () => void) {
    this.scene = scene;
    const fs = this.fs = (n: number) => `${Math.round(n * settings.textScale)}px`;
    const fixed = <T extends Phaser.GameObjects.GameObject>(o: T, d = DEPTH) =>
      (o as any).setScrollFactor(0).setDepth(d) as T;

    this.statBg = fixed(scene.add.graphics());
    const stat = (x: number, origin: number) => fixed(scene.add.text(x, 20, "", {
      fontFamily: FONT, fontSize: fs(14), fontStyle: "500", color: UI.ink, lineSpacing: Math.round(7 * settings.textScale),
    }).setOrigin(origin, 0), DEPTH + 100);
    this.left = stat(26, 0);
    this.right = stat(GAME_W - 26, 1);

    this.promptBg = fixed(scene.add.graphics());
    // Hộp tự giãn theo chữ, và không bao giờ rộng hơn khung (CANON §15.1): dòng nhắc dài
    // nhất ở cỡ chữ 200% đo được 783 px / 1024 — nhưng câu mới thì cứ xuống dòng, đừng tràn.
    this.prompt = fixed(scene.add.text(GAME_W / 2, GAME_H - 66, "", {
      fontFamily: FONT, fontSize: fs(15), fontStyle: "500", color: UI.ink, align: "center",
      wordWrap: { width: GAME_W - 80 },
    }).setOrigin(0.5), DEPTH + 100);

    this.bar = fixed(scene.add.graphics(), DEPTH + 50);

    // Phiếu đơn: câu khách gọi NGUYÊN VĂN, ghim suốt lượt (P1-03 §2.4.3). Ở góc trên PHẢI,
    // dưới ô tiền: góc đó là tường sau quán — không che mặt khách, không bị bảng kẹp nhân
    // (bên trái) che, dù câu dài hay chữ to cỡ nào.
    this.ticketBg = fixed(scene.add.graphics());
    this.ticketText = fixed(scene.add.text(GAME_W - 26, 100, "", {
      fontFamily: FONT, fontSize: fs(13), fontStyle: "500", color: UI.ink, align: "right",
      lineSpacing: Math.round(7 * settings.textScale), wordWrap: { width: 320 * Math.min(settings.textScale, 1.5) },
    }).setOrigin(1, 0), DEPTH + 100);

    // Nhật ký lời khách — nền đục để đọc được trên mọi nền.
    this.feedBg = fixed(scene.add.graphics());
    this.feedText = fixed(scene.add.text(26, GAME_H - 100, "", {
      fontFamily: FONT, fontSize: fs(12), color: "#f2efe9", lineSpacing: Math.round(6 * settings.textScale),
      wordWrap: { width: 380 },
    }).setOrigin(0, 1), DEPTH + 100);

    // CANON §15.1 / P1-04: ở cỡ chữ 200% dòng này dài 1131 px so với khung 1024 — tràn
    // hẳn ra ngoài hai mép. Cho nó XUỐNG DÒNG theo bề ngang khung (ngắt đúng dấu "·" vì
    // hai bên dấu đều có khoảng trắng) và neo ở ĐÁY màn hình, rồi `drawPrompt` đẩy dòng
    // nhắc lên trên nó — không cắt chữ, không thu nhỏ chữ của người cần chữ to.
    this.help = fixed(scene.add.text(GAME_W / 2, GAME_H - 8,
      "WASD đi · Shift chạy · E làm việc · F hỏi chuyện · giữ C che tay · Q bỏ vô thùng · Tab sổ tay · P/Esc tạm dừng", {
      fontFamily: FONT, fontSize: fs(11), color: "#f2efe9", stroke: "#1b2429", strokeThickness: 3,
      align: "center", wordWrap: { width: GAME_W - 32 },
    }).setOrigin(0.5, 1), DEPTH + 100);

    this.carryBg = fixed(scene.add.graphics());

    // Nút tạm dừng bấm được bằng chuột / chạm — không bắt ai phải có bàn phím (CANON §15.2).
    const px = GAME_W / 2, py = 26;
    const pbg = fixed(scene.add.graphics());
    pbg.fillStyle(UI.paper, 1).fillRoundedRect(px - 24, py - 18, 48, 36, 10);
    pbg.fillStyle(0x222a31, 1).fillRect(px - 7, py - 8, 5, 16).fillRect(px + 2, py - 8, 5, 16);
    const hit = fixed(scene.add.zone(px, py, 48, 36).setInteractive({ useHandCursor: true }), DEPTH + 200);
    hit.on("pointerup", () => onPause?.());

    this.handsGfx = fixed(scene.add.graphics());

    this.saveDot = fixed(scene.add.circle(GAME_W - 14, GAME_H - 14, 4, 0xf4f1e8), DEPTH + 100).setAlpha(0);
  }

  /**
   * Chỉ báo autosave — P0-02 §4: một chấm nhỏ mờ dần 0,8 s ở góc.
   * KHÔNG vòng xoay, KHÔNG chặn thao tác.
   */
  flashSaved() {
    this.scene.tweens.killTweensOf(this.saveDot);
    this.saveDot.setAlpha(0.85);
    this.scene.tweens.add({ targets: this.saveDot, alpha: 0, duration: 800, ease: "Sine.easeIn" });
  }

  /** Đáy khung ngày/giờ góc trên trái — để bảng kẹp nhân nằm ngay dưới, không đè lên. */
  get statsBottom() {
    return this.left.getBounds().bottom + 11;
  }

  /**
   * Bảng kẹp nhân mở (bên trái) thì nhật ký dời sang phải, sát đáy màn hình — không thì
   * "khét rồi!" của lò nằm khuất sau bảng đúng lúc cần đọc nhất.
   */
  dockFeed(right: boolean) {
    const x = right ? 496 : 26;
    if (this.feedText.x === x) return;
    this.feedText.setPosition(x, right ? GAME_H - 14 : GAME_H - 100);
    this.redrawFeedBg();
  }

  private redrawFeedBg() {
    this.feedBg.clear();
    if (!this.feed.length) return;
    const b = this.feedText.getBounds();
    this.feedBg.fillStyle(0x2b2f31, 1).fillRoundedRect(b.x - 10, b.y - 6, b.width + 20, b.height + 12, 8);
  }

  /** Nhật ký lời khách và sự thật vật lý ("khét rồi!") — KHÔNG có lời phán của hệ thống. */
  log(line: string) {
    this.feed.push(line);
    if (this.feed.length > 3) this.feed.shift();
    this.feedText.setText(this.feed.join("\n"));
    this.redrawFeedBg();
  }

  clearLog() {
    this.feed = [];
    this.feedText.setText("");
    this.feedBg.clear();
  }

  update(s: {
    day: number; seasonDays: number; clock: Clock; money: number; served: number;
    near: Station | null; hand: Hand; busy: { st: Station; ms: number } | null;
    frozen: boolean;
    ticket: { name: string; text: string; urgent: boolean } | null;
    /** Scene biết điều trạm không biết (vd. ổ đang gác trên thớt) → ghi đè dòng nhắc. */
    prompt?: string | null;
    /** Ổ đã gói đang cầm trên tay — dải "đã bỏ" (P1-01 §4, CANON §15.5). */
    carry?: readonly Ingredient[] | null;
    /** Tay sạch / dính tiền (P1-01 §2.8). */
    hands?: "CLEAN" | "MONEY";
  }) {
    // Tên khung giờ bằng CHỮ, không thanh tiến trình (P0-02 §4). Giờ viết kiểu "6h47".
    const m = Math.floor(s.clock.minutes);
    const hhmm = `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
    const slow = this.settings.noTimePressure ? " · thong thả" : "";
    // P4-02 §4: KHÔNG có "/40" — người chơi không được đếm ngược, chữ đó biến mùa thành thanh tiến trình
    this.left.setText(`ngày ${s.day}\n${hhmm} · ${BAND_LABEL[s.clock.band]}${slow}`);
    this.right.setText(`${s.money.toLocaleString("vi-VN")}₫\nđã đưa ${s.served} phần`);
    this.drawStats();

    this.help.setVisible(s.day <= HELP_UNTIL_DAY && this.feedText.x < 100);
    this.drawPrompt(s.near, s.hand, s.frozen, s.prompt ?? null);
    this.drawBar(s.busy);
    this.drawTicket(s.ticket, s.frozen);
    this.drawCarry(s.frozen ? null : s.carry ?? null);
    this.drawHands(s.hands ?? "CLEAN");
  }

  /**
   * Icon bàn tay, khác nhau về HÌNH DẠNG (P1-04 §2.8): CLEAN = bàn tay rỗng viền ·
   * MONEY = bàn tay + tờ tiền đặt chéo. Nằm cạnh nút tạm dừng, luôn thấy.
   */
  private drawHands(state: "CLEAN" | "MONEY") {
    if (state === this.handsKey) return;
    this.handsKey = state;
    const g = this.handsGfx;
    g.clear();
    const x = GAME_W / 2 - 58, y = 26;
    g.fillStyle(UI.paper, 1).fillRoundedRect(x - 22, y - 18, 44, 36, 10);
    const ink = 0x222a31;
    g.lineStyle(2, ink, 1);
    g.strokeRoundedRect(x - 7, y - 3, 14, 13, 3);                     // lòng bàn tay
    for (let i = 0; i < 4; i++) g.strokeRoundedRect(x - 7 + i * 3.6, y - 12, 2.6, 10, 1.2);  // bốn ngón
    g.strokeRoundedRect(x + 7, y - 1, 5, 3, 1.2);                     // ngón cái
    if (state === "MONEY") {
      g.fillStyle(0x5f9e6e, 1);
      g.fillPoints([{ x: x - 12, y: y + 6 }, { x: x + 2, y: y - 6 }, { x: x + 12, y: y + 2 }, { x: x - 2, y: y + 14 }], true);
      g.lineStyle(1.5, 0xf2efe9, 1).strokeCircle(x, y + 4, 3);
    }
  }

  private drawStats() {
    const g = this.statBg;
    g.clear();
    for (const t of [this.left, this.right]) {
      const b = t.getBounds();
      g.fillStyle(0x0d1216, 0.18).fillRoundedRect(b.x - 14, b.y - 9, b.width + 28, b.height + 18, 12);
      g.fillStyle(UI.paper, 1).fillRoundedRect(b.x - 14, b.y - 11, b.width + 28, b.height + 18, 12);
    }
  }

  private drawTicket(t: { name: string; text: string; urgent: boolean } | null, frozen: boolean) {
    this.ticketBg.clear();
    if (!t || frozen) { this.ticketText.setText(""); return; }
    const top = this.right.getBounds().bottom + 20;
    this.ticketText.setText(`${t.name}\n${t.text}`).setPosition(GAME_W - 26, top);
    const b = this.ticketText.getBounds();
    this.ticketBg.fillStyle(UI.paper, 1).fillRoundedRect(b.x - 12, b.y - 8, b.width + 24, b.height + 16, 10);
    this.ticketBg.lineStyle(1.2, UI.line, 1).strokeRoundedRect(b.x - 12, b.y - 8, b.width + 24, b.height + 16, 10);
  }

  /** "Đã bỏ": icon từng món + số phần, luôn thấy lúc cầm ổ đã gói đi ra quầy. */
  private drawCarry(dish: readonly Ingredient[] | null) {
    const key = dish ? dish.join(",") : "";
    if (key === this.carryKey) return;
    this.carryKey = key;
    this.carryBg.clear();
    for (const o of [...this.carryIcons, ...this.carryNums]) o.setVisible(false);
    if (!dish || !dish.length || !this.scene.textures.exists(FOOD.icon("pate"))) return;

    const counts = portionsOf(dish as Ingredient[]);
    const items = INGREDIENTS.filter((i) => counts.has(i.id));
    // Ngay dưới nút tạm dừng ở giữa trên — vùng tường sau, không đụng nhật ký góc dưới trái.
    const step = 46, w = items.length * step + 16, y = 76;
    // không lấn sang phiếu đơn ở góc phải
    const x0 = Math.max(16, Math.min(GAME_W / 2 - w / 2, this.ticketText.getBounds().left - 24 - w));
    this.carryBg.fillStyle(UI.paper, 1).fillRoundedRect(x0, y - 22, w, 44, 10);
    items.forEach((ing, i) => {
      const icon = this.carryIcons[i] ??= this.scene.add.image(0, 0, FOOD.icon(ing.id)).setScrollFactor(0).setDepth(DEPTH + 100);
      const num = this.carryNums[i] ??= this.scene.add.text(0, 0, "", {
        fontFamily: FONT, fontSize: this.fs(11), fontStyle: "700", color: UI.ink,
      }).setOrigin(0, 1).setScrollFactor(0).setDepth(DEPTH + 101);
      const cx = x0 + 8 + step * i + step / 2 - 4;
      icon.setTexture(FOOD.icon(ing.id)).setPosition(cx, y).setScale(0.62).setVisible(true);
      num.setText(`×${counts.get(ing.id)}`).setPosition(cx + 11, y + 18).setVisible(true);
    });
  }

  /**
   * Mép trên của dòng hướng dẫn phím — dòng nhắc và thanh tiến trình xếp NGƯỢC LÊN từ
   * đây. Ở cỡ chữ 200% dòng hướng dẫn chiếm hai dòng, đặt cứng `GAME_H − 66` là đè lên.
   */
  private get stackTop() {
    return this.help.visible ? this.help.getBounds().top - 8 : GAME_H - 48;
  }

  /** `override` không cần trạm: khoảng lặng ngày 40 nhắc phím bỏ qua giữa hẻm trống. */
  private drawPrompt(st: Station | null, hand: Hand, frozen: boolean, override: string | null) {
    this.promptBg.clear();
    if (frozen || (!st && !override)) { this.prompt.setText(""); return; }

    const why = override || !st ? null : blockedReason(st, hand);
    const keyHint = st && st.holdMs === 0 ? "bấm E" : "giữ E";
    this.prompt.setText(override ?? (why
      ? `${st!.name} — ${why}`
      : `${st!.name} — ${keyHint} để ${st!.verb}`));

    const w = this.prompt.width + 34, h = this.prompt.height + 16;
    const x = GAME_W / 2 - w / 2, y = this.stackTop - h;
    this.prompt.setPosition(GAME_W / 2, y + h / 2);
    this.promptBg.fillStyle(0x0d1216, 0.22);
    this.promptBg.fillRoundedRect(x, y + 3, w, h, 10);
    this.promptBg.fillStyle(why ? 0xe7e0d2 : UI.paper, 1);
    this.promptBg.fillRoundedRect(x, y, w, h, 10);
  }

  /** Thanh tiến trình của thao tác giữ phím (rót trà). */
  private drawBar(busy: { st: Station; ms: number } | null) {
    this.bar.clear();
    if (!busy) return;
    const { st, ms } = busy;
    const promptH = this.prompt.text ? this.prompt.height + 16 : 0;
    const W = 200, H = 10, x = GAME_W / 2 - W / 2, y = this.stackTop - promptH - H - 12;
    this.bar.fillStyle(0x1b2429, 0.55);
    this.bar.fillRoundedRect(x - 2, y - 2, W + 4, H + 4, 6);
    this.bar.fillStyle(ms >= st.holdMs ? 0x6fbf8a : 0xe8c27a, 1);
    this.bar.fillRoundedRect(x, y, Math.max(4, W * Math.min(1, ms / st.holdMs)), H, 5);
  }
}
