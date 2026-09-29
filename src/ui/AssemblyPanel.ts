import Phaser from "phaser";
import { GAME_H } from "../core/config";
import { FOOD, buildFood } from "../art/food";
import { CAPACITY, INGREDIENTS, labelOf, portionsOf, type Ingredient } from "../sim/order";
import { FONT, UI, button, panel } from "./theme";
import { Steam } from "./stall/Steam";

/**
 * Bảng kẹp nhân — nơi trụ cột T2 sống hoặc chết.
 *
 * "Món ăn LÀ lựa chọn hội thoại": người chơi KHÔNG BAO GIỜ chọn câu nói, họ chọn
 * nguyên liệu. Nên đây là màn hình quan trọng nhất game.
 *
 * Ba đường vào đều dùng được, và CANON §15.5 bắt buộc phải có ĐỦ CẢ BA, đi chung:
 *   1. kéo miếng nhân thả vào ổ bánh            (cách chính)
 *   2. BẤM một cái vào miếng nhân               (chạm-để-đặt, đường trợ năng)
 *   3. phím số 1–8                              (bàn phím thuần)
 * cộng **nút Hoàn tác** và **một bước xác nhận** trước khi bánh rời tay.
 *
 * Bảng cố tình KHÔNG đóng băng thế giới: khách vẫn đứng đó chờ, kiên nhẫn vẫn tụt.
 * Muốn dừng hẳn thì bấm Esc — pause thật, đóng băng cả sự kiên nhẫn (CANON §15.2).
 */

/**
 * Bảng nằm BÊN TRÁI, dưới phiếu đơn của HUD — KHÔNG che hàng khách (hàng khách đứng ở
 * giữa–phải màn hình). Lúc kẹp nhân là lúc khách nhìn tay mình kỹ nhất; bảng mà che mặt
 * họ là T1/T5 chết đúng lúc quan trọng nhất (P1-04 §2.1: sân khấu luôn phải thấy được).
 */
const PANEL_W = 470;
const PANEL_H = 400;
const PANEL_LEFT = 8;
/** Phiếu đơn của HUD nằm góc trên PHẢI, nên bảng dùng được gần hết chiều cao bên trái. */
const PANEL_TOP = 96;
const TILE_W = 140;
const TILE_H = 44;
/** Khoảng cách tâm giữa hai hàng khay. */
const ROW_STEP = 50;
const TRAY_COLS = 3;
const WRAP_BEATS = ["gập", "cuộn", "xoắn"] as const;
const WRAP_EVEN_TOL = 0.18;

export class AssemblyPanel {
  private root: Phaser.GameObjects.Container;
  private loafImg!: Phaser.GameObjects.Image;
  /** Hơi khói trên ổ — tắt hẳn khi ổ đã nguội (P1-01 §4). */
  private steam!: Steam;
  private fillLayer!: Phaser.GameObjects.Container;
  private hint!: Phaser.GameObjects.Text;
  private dropZone!: Phaser.Geom.Rectangle;
  private ghost: Phaser.GameObjects.Image | null = null;
  /**
   * Phaser bắn `dragend` RỒI mới bắn `pointerup` trên chính ô vừa kéo.
   * Không chặn thì một lần kéo-thả bị tính thành hai lần bật/tắt và món biến mất.
   */
  private dragging = false;

  /**
   * NHẬT KÝ kẹp, không phải tập hợp: một `id` xuất hiện mấy lần là bỏ mấy phần.
   * Giữ đúng thứ tự thao tác nên Hoàn tác chỉ việc `pop()`.
   */
  private stack: Ingredient[] = [];
  /** Nhãn [tên, gợi ý] của 3 nút preset. */
  private presetBtns: Phaser.GameObjects.Text[][] = [];
  /**
   * Gói bánh 3 nhịp: gập · cuộn · xoắn (P1-01 §2.9 WRAP_FAST). Mốc thời gian mỗi nhịp —
   * nhịp đều tay (lệch ≤ 18%) là FLOURISH. Không có nhánh "gói hỏng": gói lệch nhịp vẫn gói xong.
   */
  private wrapBeats: number[] = [];
  private tiles = new Map<Ingredient, () => void>();
  private open = false;

  constructor(
    private scene: Phaser.Scene,
    private onDone: (dish: Ingredient[], evenWrap: boolean) => void,
    /** Đóng bảng mà CHƯA gói — ổ bánh nằm lại trên thớt với đúng phần nhân đã kẹp. */
    private onPark: (dish: Ingredient[]) => void = () => {},
    /** Vừa đặt một phần lên ổ — scene cần biết để phát lỗi NGAY lúc đặt sai (P1-03 §2.6.2). */
    private onAdd: (id: Ingredient) => void = () => {},
    /** Bấm nút preset P1/P2/P3 — scene trả lại danh sách phần (hoặc null nếu hết phần chia sẵn). */
    private onPreset: (i: number) => Ingredient[] | null = () => null,
  ) {
    buildFood(scene);

    const cx = PANEL_LEFT + PANEL_W / 2, cy = PANEL_TOP + PANEL_H / 2;
    const top = PANEL_TOP;
    this.root = scene.add.container(0, 0).setDepth(9_400_000).setScrollFactor(0).setVisible(false);
    this.root.add(panel(scene, cx, cy, PANEL_W, PANEL_H, UI.paper, 1).setScrollFactor(0));
    // Ba preset chia sẵn buổi sáng (P1-01 §2.6) — một chạm thay cho mười chạm. Nhãn ghi số
    // phần còn lại: hết thì quay về kẹp tay, không bị chặn.
    for (let i = 0; i < 3; i++) {
      const b = button(scene, cx - PANEL_W / 2 + 62 + i * 108, top + 26, `P${i + 1}`, () => this.applyPreset(i), { width: 100, hint: " ", maxScale: 1 });
      b.setScrollFactor(0);
      this.presetBtns.push(b.list.filter((o) => o instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text[]);
      this.root.add(b);
    }
    // Không bắt người chơi kẹt trong bảng: khách khác đang chờ ly trà, bánh trong lò sắp
    // cháy… thì gác ổ lại trên thớt, đi làm việc khác, quay lại kẹp tiếp.
    this.root.add(button(scene, cx + PANEL_W / 2 - 60, top + 26, "để đó", () => this.park(), {
      width: 96, hint: "Esc", maxScale: 1,
    }).setScrollFactor(0));

    this.buildLoaf(cx, top + 112);
    // Phiếu đơn KHÔNG nằm trong bảng: bảng nằm ngay dưới phiếu của HUD nên câu khách
    // nói (nguyên văn) luôn thấy được ngay phía trên.
    this.buildTray(cx, top + 210);
    // Hàng cuối của khay chỉ có một ô (10 món / 3 cột) — hai nút Hoàn tác / Gói lại nằm
    // ngay trên hai cột trống của hàng đó, không chồng lên ô nào.
    this.buildActions(cx, top + 210 + 3 * ROW_STEP);
  }

  // ───────────────────────────────────────────────────────────────── dựng bảng

  /** Ổ bánh + vùng thả. Bấm vào một miếng đã kẹp thì gỡ nó ra. */
  private buildLoaf(x: number, y: number) {
    this.loafImg = this.scene.add.image(x, y, FOOD.loaf).setScrollFactor(0);
    this.fillLayer = this.scene.add.container(0, 0).setScrollFactor(0);
    this.steam = new Steam(this.scene, true);
    this.root.add([this.loafImg, this.fillLayer, this.steam.graphics]);

    // khe kẹp nhân, rộng hơn hình một chút cho dễ thả trúng
    // Vùng thả KHÔNG được chạm hàng nút phía trên (preset, "để đó") — nhả tay trúng nút là bấm nút.
    this.dropZone = new Phaser.Geom.Rectangle(x - 140, y - 48, 280, 110);
    this.hint = this.text(x, y + 62, "kéo miếng nhân thả vào đây", 11, UI.muted, "400");
    this.root.add(this.hint);
  }

  /**
   * Dời cả bảng xuống để mép trên nằm dưới `y` (đáy khung ngày/giờ của HUD — ở chữ 200%
   * khung đó cao hơn). Không dời quá đáy màn hình.
   */
  placeBelow(y: number) {
    const dy = Math.max(0, Math.min(GAME_H - 4 - (PANEL_TOP + PANEL_H), y + 8 - PANEL_TOP));
    if (dy === this.root.y) return;
    this.dropZone.y += dy - this.root.y;
    this.root.y = dy;
  }

  /** Điểm màn hình của ổ bánh trong bảng — đích của tia nhìn khi bảng đang mở. */
  get loafPoint() {
    return { x: this.loafImg.x, y: this.loafImg.y + this.root.y };
  }

  /** Scene gọi mỗi frame: ổ còn ấm thì còn khói. */
  setWarm(warm: boolean, time: number, reducedMotion: boolean) {
    if (!this.open) return;
    this.steam.draw(this.loafImg.x, this.loafImg.y - 58, 0, time, warm, reducedMotion, 1.6);
  }

  /** Khay nguyên liệu: 3 cột, mỗi ô kéo được và bấm được. */
  private buildTray(x: number, y: number) {
    INGREDIENTS.forEach((ing, i) => {
      const col = i % TRAY_COLS, row = (i / TRAY_COLS) | 0;
      const tx = x + (col - (TRAY_COLS - 1) / 2) * (TILE_W + 8);
      const ty = y + row * ROW_STEP;
      this.root.add(this.makeTile(ing.id, ing.key, ing.label, tx, ty));
    });
  }

  private makeTile(id: Ingredient, key: number, label: string, x: number, y: number) {
    const c = this.scene.add.container(x, y).setScrollFactor(0);

    const bg = this.scene.add.graphics().setScrollFactor(0);
    const paint = (hot: boolean) => {
      bg.clear();
      bg.fillStyle(hot ? 0xe9e2d2 : 0xfaf8f1, 1);
      bg.fillRoundedRect(-TILE_W / 2, -TILE_H / 2, TILE_W, TILE_H, 10);
      bg.lineStyle(1.4, hot ? UI.accent : UI.line, 1);
      bg.strokeRoundedRect(-TILE_W / 2, -TILE_H / 2, TILE_W, TILE_H, 10);
    };
    paint(false);

    const icon = this.scene.add.image(-TILE_W / 2 + 30, 0, FOOD.icon(id)).setScrollFactor(0);
    const name = this.scene.add.text(-TILE_W / 2 + 54, 0, label, {
      fontFamily: FONT, fontSize: "13px", fontStyle: "500", color: UI.ink,
    }).setOrigin(0, 0.5).setScrollFactor(0);
    const num = this.scene.add.text(TILE_W / 2 - 10, -TILE_H / 2 + 6, String(key), {
      fontFamily: FONT, fontSize: "10px", color: "#9aa4ac",
    }).setOrigin(1, 0).setScrollFactor(0);

    // huy hiệu số phần đang kẹp — "×2", "×3". Không có thì ẩn hẳn.
    const badgeBg = this.scene.add.graphics().setScrollFactor(0);
    const badge = this.scene.add.text(TILE_W / 2 - 16, 9, "", {
      fontFamily: FONT, fontSize: "12px", fontStyle: "700", color: "#ffffff",
    }).setOrigin(0.5).setScrollFactor(0);

    this.tiles.set(id, () => {
      const n = portionsOf(this.stack).get(id) ?? 0;
      badgeBg.clear();
      badge.setText(n > 0 ? `×${n}` : "");
      if (n > 0) {
        badgeBg.fillStyle(n >= this.maxOf(id) ? UI.accent : 0x6d7b84, 1);
        badgeBg.fillCircle(TILE_W / 2 - 16, 9, 11);
      }
    });

    c.add([bg, icon, name, num, badgeBg, badge]);
    c.setSize(TILE_W, TILE_H);
    c.setInteractive(new Phaser.Geom.Rectangle(0, 0, TILE_W, TILE_H), Phaser.Geom.Rectangle.Contains);
    this.scene.input.setDraggable(c);

    c.on("pointerover", () => paint(true));
    c.on("pointerout", () => paint(false));
    c.on("pointerdown", () => { this.dragging = false; });
    c.on("pointerup", () => { if (!this.dragging) this.add(id); });   // chạm-để-đặt

    c.on("dragstart", (p: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.ghost = this.scene.add.image(p.x, p.y, FOOD.icon(id))
        .setScrollFactor(0).setDepth(9_450_000).setScale(1.15).setAlpha(0.95);
    });
    c.on("drag", (p: Phaser.Input.Pointer) => {
      this.ghost?.setPosition(p.x, p.y);
      const over = this.dropZone.contains(p.x, p.y);
      this.hint.setColor(over ? UI.goodCss : UI.muted);
    });
    c.on("dragend", (p: Phaser.Input.Pointer) => {
      const dropped = this.dropZone.contains(p.x, p.y);
      this.ghost?.destroy();
      this.ghost = null;
      this.hint.setColor(UI.muted);
      paint(false);
      if (dropped && this.open) this.add(id);
    });

    return c;
  }

  /** Trần mỗi loại — không ai kẹp bốn lát chả vào một ổ (xem `INGREDIENTS[].max`). */
  private maxOf(id: Ingredient) {
    return INGREDIENTS.find((i) => i.id === id)!.max;
  }

  private buildActions(cx: number, y: number) {
    const col = (c: number) => cx + (c - (TRAY_COLS - 1) / 2) * (TILE_W + 8);
    this.root.add(button(this.scene, col(1), y, "Hoàn tác", () => this.undo(), { width: TILE_W, maxScale: 1 }));
    this.root.add(button(this.scene, col(2), y, "Gói lại", () => this.confirm(), {
      width: TILE_W, primary: true, hint: "3 nhịp: E · E · E", maxScale: 1,
    }));
    this.root.list.filter((o) => o instanceof Phaser.GameObjects.Container)
      .forEach((o) => (o as Phaser.GameObjects.Container).setScrollFactor(0));
  }

  private text(x: number, y: number, t: string, size: number, color: string,
    weight: "400" | "500" | "700") {
    return this.scene.add.text(x, y, t, {
      fontFamily: FONT, fontSize: `${size}px`, fontStyle: weight, color,
    }).setOrigin(0.5).setScrollFactor(0);
  }

  // ──────────────────────────────────────────────────────────────── thao tác

  /** Bỏ thêm một phần. Chạm trần của món đó, hoặc đầy ổ, thì không nhận nữa. */
  private add(id: Ingredient) {
    if (!this.open) return;                             // kéo dở mà bảng đã đóng (đi khỏi thớt)
    if (this.wrapBeats.length) { this.flash("đang gói — Hoàn tác để mở ra"); return; }
    const have = portionsOf(this.stack).get(id) ?? 0;
    if (have >= this.maxOf(id)) { this.flash(`${labelOf(id)} hết chỗ rồi`); return; }
    if (this.stack.length >= CAPACITY) { this.flash("ổ bánh đầy rồi, kẹp không lại"); return; }
    this.stack.push(id);
    this.onAdd(id);
    this.repaint();
  }

  /** Gỡ MỘT phần của món đó — bỏ miếng mới nhất. */
  private removeOne(id: Ingredient) {
    const at = this.stack.lastIndexOf(id);
    if (at >= 0) this.stack.splice(at, 1);
    this.repaint();
  }

  private flash(msg: string) {
    this.hint.setText(msg).setColor(UI.accentCss);
    // P1-04 §2.4 mục 7: lý do hiện đủ 2,5 s — không có nút nào bị chặn mà câm.
    this.scene.time.delayedCall(2500, () => { if (this.open) this.repaint(); });
  }

  private undo() {
    if (this.wrapBeats.length) { this.wrapBeats = []; this.repaint(); return; }  // huỷ gói trước
    this.stack.pop();
    this.repaint();
  }

  /** Scene báo tên + số phần còn lại của 3 preset. */
  setPresets(list: readonly { id: string; name: string; prepped: number }[]) {
    list.slice(0, 3).forEach((p, i) => {
      const [main, hint] = this.presetBtns[i] ?? [];
      main?.setText(`${p.id} · ${p.prepped}`);
      hint?.setText(p.name);
    });
  }

  private applyPreset(i: number) {
    if (this.wrapBeats.length) return;
    const dish = this.onPreset(i);
    if (!dish) { this.flash("preset đó hết phần chia sẵn rồi"); return; }
    this.stack = [];
    for (const id of dish) { this.stack.push(id); this.onAdd(id); }
    this.repaint();
  }

  private confirm() {
    if (!this.open) return;
    if (!this.stack.length && !this.wrapBeats.length) { this.flash("ổ còn trống — kẹp nhân trước đã"); return; }
    const now = this.scene.time.now;
    this.wrapBeats.push(now);
    if (this.wrapBeats.length < WRAP_BEATS.length) { this.repaint(); return; }
    const [a, b, c] = this.wrapBeats;
    const i1 = b - a, i2 = c - b;
    const even = Math.abs(i1 - i2) / ((i1 + i2) / 2) <= WRAP_EVEN_TOL && i1 < 1500 && i2 < 1500;
    this.wrapBeats = [];
    const dish = [...this.stack];
    this.hide();
    this.onDone(dish, even);
  }

  /**
   * Vẽ phần nhân nằm trong ổ — XẾP CHỒNG THÀNH LỚP, không phải xếp thành hàng.
   * Đúng thứ tự người ta làm thật: quết pate trước, nhân mặn, rồi rau, sốt rưới sau cùng
   * (thứ tự lấy từ `INGREDIENTS`). Bỏ hai phần thì thấy hai lớp — nhìn là biết mình cho dư.
   * Bấm vào một lớp thì gỡ đúng một phần.
   */
  private repaint() {
    this.fillLayer.removeAll(true);
    this.hint.setColor(UI.muted);

    if (this.stack.length === 0 && !this.wrapBeats.length) {
      this.hint.setText("kéo miếng nhân thả vào đây");
      this.tiles.forEach((f) => f());
      return;
    }
    this.hint.setText(this.wrapBeats.length
      ? `gói: ${WRAP_BEATS.map((w, i) => `${i < this.wrapBeats.length ? "●" : "○"} ${w}`).join("  ")}   — bấm tiếp, đều tay`
      : `bấm vào một lớp để gỡ bớt   ·   ${this.stack.length}/${CAPACITY} phần`);

    // Dàn NGANG như lát nhân xếp dọc ruột bánh: miếng sau đè lên 65% miếng trước,
    // miếng nào cũng còn lộ 35% — vẫn đủ nhận ra hình dáng từng loại. Hàng đầy
    // (chạm bề ngang ruột bánh) thì sang hàng mới, nằm cao hơn và chồng lên hàng trước.
    const SIZE = Math.ceil(FOOD.ICON * FOOD.BIG_SCALE);
    const STEP = SIZE * (1 - 0.65);
    const CRUMB_W = 250;                               // bề ngang ruột bánh, xem `loaf()` trong food.ts
    const PER_ROW = Math.floor((CRUMB_W - SIZE) / STEP) + 1;
    const ROW_H = 16;
    const counts = portionsOf(this.stack);
    const total = this.stack.length;
    const baseY = this.loafImg.y + 10;
    let i = 0;

    for (const ing of INGREDIENTS) {                   // dưới lên trên, đúng thứ tự xếp lớp
      const n = counts.get(ing.id) ?? 0;
      for (let k = 0; k < n; k++, i++) {
        const row = (i / PER_ROW) | 0;
        const col = i % PER_ROW;
        const inRow = Math.min(PER_ROW, total - row * PER_ROW);
        const x = this.loafImg.x + (col - (inRow - 1) / 2) * STEP;   // canh giữa theo số miếng trong hàng
        const img = this.scene.add.image(x, baseY - row * ROW_H, FOOD.big(ing.id))
          .setScrollFactor(0);
        img.setInteractive({ useHandCursor: true });
        img.on("pointerup", () => this.removeOne(ing.id));
        this.fillLayer.add(img);
      }
    }
    this.tiles.forEach((f) => f());
  }

  // ───────────────────────────────────────────────────────────────── vòng đời

  get isOpen() {
    return this.open;
  }

  /** `initial` = phần nhân đã kẹp dở từ lần trước (ổ đang gác trên thớt). */
  show(initial: readonly Ingredient[] = []) {
    this.stack = [...initial];
    this.wrapBeats = [];
    this.open = true;
    this.root.setVisible(true);
    this.repaint();
  }

  /** Gác ổ lại trên thớt — giữ nguyên phần đã kẹp. */
  park() {
    if (!this.open) return;
    this.wrapBeats = [];
    const dish = [...this.stack];
    this.hide();
    this.onPark(dish);
  }

  hide() {
    this.open = false;
    this.ghost?.destroy();
    this.ghost = null;
    this.root.setVisible(false);
  }

  /** Đường bàn phím. Trả về true nếu phím đã được bảng này nuốt. */
  handleKey(code: string): boolean {
    if (!this.open) return false;

    const num = /^(?:Digit|Numpad)([0-9])$/.exec(code);
    if (num) {
      const ing = INGREDIENTS.find((i) => i.key === Number(num[1]));
      if (ing) this.add(ing.id);
      return true;
    }
    if (code === "Backspace") { this.undo(); return true; }
    if (code === "Escape") { this.park(); return true; }
    if (code === "KeyE" || code === "Space" || code === "Enter") { this.confirm(); return true; }
    return false;
  }
}
