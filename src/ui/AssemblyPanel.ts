import Phaser from "phaser";
import { GAME_W, GAME_H } from "../core/config";
import { FOOD, buildFood } from "../art/food";
import { CAPACITY, INGREDIENTS, labelOf, portionsOf, type Ingredient } from "../sim/order";
import { FONT, UI, button, panel } from "./theme";

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

const PANEL_W = 690;
const PANEL_H = 400;
const TILE_W = 140;
const TILE_H = 50;
const TILE_GAP = 6;

export class AssemblyPanel {
  private root: Phaser.GameObjects.Container;
  private loafImg!: Phaser.GameObjects.Image;
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
  private tiles = new Map<Ingredient, () => void>();
  private open = false;

  constructor(private scene: Phaser.Scene, private onDone: (dish: Ingredient[]) => void) {
    buildFood(scene);

    const cx = GAME_W / 2, cy = GAME_H / 2 - 6;
    this.root = scene.add.container(0, 0).setDepth(9_400_000).setScrollFactor(0).setVisible(false);
    this.root.add(panel(scene, cx, cy, PANEL_W, PANEL_H, UI.paper, 0.98).setScrollFactor(0));
    this.root.add(this.text(cx, cy - PANEL_H / 2 + 24, "Kẹp nhân", 16, UI.ink, "700"));

    this.buildLoaf(cx - PANEL_W / 2 + 176, cy - 26);
    this.buildTray(cx + 58, cy - PANEL_H / 2 + 76);
    this.buildActions(cx, cy + PANEL_H / 2 - 36);
  }

  // ───────────────────────────────────────────────────────────────── dựng bảng

  /** Ổ bánh + vùng thả. Bấm vào một miếng đã kẹp thì gỡ nó ra. */
  private buildLoaf(x: number, y: number) {
    this.loafImg = this.scene.add.image(x, y, FOOD.loaf).setScrollFactor(0);
    this.fillLayer = this.scene.add.container(0, 0).setScrollFactor(0);
    this.root.add([this.loafImg, this.fillLayer]);

    // khe kẹp nhân, rộng hơn hình một chút cho dễ thả trúng
    this.dropZone = new Phaser.Geom.Rectangle(x - 140, y - 74, 280, 136);
    this.hint = this.text(x, y + 62, "kéo miếng nhân thả vào đây", 11, UI.muted, "400");
    this.root.add(this.hint);
  }

  /** Khay nguyên liệu: 2 cột × 4 hàng, mỗi ô kéo được và bấm được. */
  private buildTray(x: number, y: number) {
    INGREDIENTS.forEach((ing, i) => {
      const col = i % 2, row = (i / 2) | 0;
      const tx = x + col * (TILE_W + 10);
      const ty = y + row * (TILE_H + TILE_GAP);
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
      if (dropped) this.add(id);
    });

    return c;
  }

  /** Trần mỗi loại — không ai kẹp bốn lát chả vào một ổ (xem `INGREDIENTS[].max`). */
  private maxOf(id: Ingredient) {
    return INGREDIENTS.find((i) => i.id === id)!.max;
  }

  private buildActions(cx: number, y: number) {
    this.root.add(button(this.scene, cx - 106, y, "Hoàn tác", () => this.undo(), { width: 160 }));
    this.root.add(button(this.scene, cx + 106, y, "Gói lại", () => this.confirm(), {
      width: 200, primary: true, hint: "bấm E cũng được",
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
    const have = portionsOf(this.stack).get(id) ?? 0;
    if (have >= this.maxOf(id)) { this.flash(`${labelOf(id)} hết chỗ rồi`); return; }
    if (this.stack.length >= CAPACITY) { this.flash("ổ bánh đầy rồi, kẹp không lại"); return; }
    this.stack.push(id);
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
    this.scene.time.delayedCall(900, () => { if (this.open) this.repaint(); });
  }

  private undo() {
    this.stack.pop();
    this.repaint();
  }

  private confirm() {
    const dish = [...this.stack];
    this.hide();
    this.onDone(dish);
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

    if (this.stack.length === 0) {
      this.hint.setText("kéo miếng nhân thả vào đây");
      this.tiles.forEach((f) => f());
      return;
    }
    this.hint.setText(`bấm vào một lớp để gỡ bớt   ·   ${this.stack.length}/${CAPACITY} phần`);

    // Xếp so le thành nhiều hàng, hàng sau chồng lên hàng trước. Xếp thành MỘT cột
    // thì đống nhân vống hẳn ra ngoài ổ bánh; trải thành hàng thì vừa nằm gọn trong
    // ruột bánh, vừa đọc ra "ổ này nhồi nhiều hay ít" chỉ bằng chiều cao đống.
    const PER_ROW = 5, ROW_H = 12, SPAN = 178;
    const counts = portionsOf(this.stack);
    const total = this.stack.length;
    const baseY = this.loafImg.y + 13;
    let i = 0;

    for (const ing of INGREDIENTS) {                   // dưới lên trên, đúng thứ tự xếp lớp
      const n = counts.get(ing.id) ?? 0;
      for (let k = 0; k < n; k++, i++) {
        const row = (i / PER_ROW) | 0;
        const col = i % PER_ROW;
        const inRow = Math.min(PER_ROW, total - row * PER_ROW);
        const x = this.loafImg.x + (inRow === 1 ? 0 : -SPAN / 2 + (col * SPAN) / (inRow - 1));
        const img = this.scene.add.image(x, baseY - row * ROW_H, FOOD.icon(ing.id))
          .setScrollFactor(0).setScale(0.78);
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

  show() {
    this.stack = [];
    this.open = true;
    this.root.setVisible(true);
    this.repaint();
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
    if (code === "KeyE" || code === "Space" || code === "Enter") { this.confirm(); return true; }
    return false;
  }
}
