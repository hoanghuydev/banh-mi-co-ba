import Phaser from "phaser";
import { fitPhoto } from "../art/photo";
import { GAME_H } from "../core/config";
import { FOOD, buildFood } from "../art/food";
import { CAPACITY, INGREDIENTS, labelOf, portionsOf, type Ingredient } from "../sim/order";
import { FONT, UI, button, buttonHeight, panel, textScale } from "./theme";
import { Steam } from "./stall/Steam";

/**
 * Bảng kẹp nhân — nơi trụ cột T2 sống hoặc chết: món ăn LÀ lựa chọn hội thoại, nên đây là chỗ
 * người chơi "nói". Mọi thứ ở đây phải đọc được bằng HÌNH, và phải mở/đóng được giữa chừng.
 */

/** Bên TRÁI, dưới phiếu đơn của HUD — KHÔNG che hàng khách, vì khách đang nhìn tay mình là cả luật chơi. */
const PANEL_W = 470;
const PANEL_LEFT = 8;
const PANEL_TOP = 96;
const TILE_H = 44;
const TRAY_COLS = 3;
const TRAY_ROWS = Math.ceil(INGREDIENTS.length / TRAY_COLS);
const LOAF_H = FOOD.LOAF_H;
/** Khung thiết kế chỉ cao 576 px và bảng phải nằm gọn dưới dải HUD. */
const MAX_SCALE = 1.45;
const MAX_SCALE_W = 1.15;
const MAX_SCALE_BTN = 1.25;
/** Gói bánh là MỘT cú bấm; FLOURISH đo bằng nhịp bấm đó. */
const WRAP_SNAP_MS = 900;

export class AssemblyPanel {
  private root: Phaser.GameObjects.Container;
  private loafImg!: Phaser.GameObjects.Image;
  private steam!: Steam;
  private fillLayer!: Phaser.GameObjects.Container;
  private hint!: Phaser.GameObjects.Text;
  private dropZone!: Phaser.Geom.Rectangle;
  private ghost: Phaser.GameObjects.Image | null = null;
  /** ⚠️ Phaser bắn `dragend` RỒI mới bắn `pointerup` trên chính ô vừa kéo — không chặn thì một cú kéo thành một cú kéo cộng một cú chạm. */
  private dragging = false;

  /** NHẬT KÝ kẹp, không phải tập hợp: một `id` xuất hiện mấy lần là bỏ mấy phần. */
  private stack: Ingredient[] = [];
  private presetBtns: Phaser.GameObjects.Text[][] = [];
  /** Suất chia sẵn CHỈ bị trừ lúc gói xong, không phải lúc áp preset. */
  private presetUsed: number | null = null;
  private presetArm: number | null = null;
  private tiles = new Map<Ingredient, () => void>();
  wrapSnapMs = WRAP_SNAP_MS;
  addCooldownMs = 0;
  private lastAddAt = -1e9;
  private open = false;

  // ─── cỡ thật của bảng ở cỡ chữ hiện tại (CANON §15.1) — xem `layout()`
  private s = 1;
  private sw = 1;
  private pw = PANEL_W;
  private ph = 400;
  private tw = 140;
  private th = TILE_H;
  private rowStep = 50;
  private yPreset = 0;
  private yLoaf = 0;
  private yHint = 0;
  private yTray = 0;
  private yAct = 0;
  /** Tâm ngang của bảng — giữ lại để `trayBounds`/`wrapBounds` khỏi tính lại. */
  private cx = 0;

  constructor(
    private scene: Phaser.Scene,
    private onDone: (dish: Ingredient[], evenWrap: boolean) => void,
    private onPark: (dish: Ingredient[]) => void = () => {},
    private onAdd: (id: Ingredient) => void = () => {},
    /** Trả null nếu hết phần chia sẵn. */
    private onPreset: (i: number) => Ingredient[] | null = () => null,
    /** Hết là hết: trả lý do nếu KHÔNG bỏ thêm được phần này. */
    private canAdd: (id: Ingredient, stack: readonly Ingredient[]) => string | null = () => null,
    private allowEmptyLoaf: () => boolean = () => false,
    private onPresetConsumed: (i: number) => void = () => {},
  ) {
    buildFood(scene);
    this.layout();

    const cx = this.cx = PANEL_LEFT + this.pw / 2, cy = PANEL_TOP + this.ph / 2;
    const top = PANEL_TOP;
    this.root = scene.add.container(0, 0).setDepth(9_400_000).setScrollFactor(0).setVisible(false);
    this.root.add(panel(scene, cx, cy, this.pw, this.ph, UI.paper, 1).setScrollFactor(0));
    // Ba preset chia sẵn buổi sáng (P1-01 §2.6) — một chạm thay cho mười chạm. Nhãn ghi số
    // phần còn lại: hết thì quay về kẹp tay, không bị chặn.
    const pw = Math.round(100 * this.sw), pgap = Math.round(108 * this.sw);
    for (let i = 0; i < 3; i++) {
      const b = button(scene, cx - this.pw / 2 + Math.round(62 * this.sw) + i * pgap, top + this.yPreset,
        `P${i + 1}`, () => this.applyPreset(i), { width: pw, hint: " ", maxScale: MAX_SCALE_BTN });
      b.setScrollFactor(0);
      this.presetBtns.push(b.list.filter((o) => o instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text[]);
      this.root.add(b);
    }
    // Không bắt người chơi kẹt trong bảng: khách khác đang chờ ly trà, bánh trong lò sắp
    // cháy… thì gác ổ lại trên thớt, đi làm việc khác, quay lại kẹp tiếp.
    this.root.add(button(scene, cx + this.pw / 2 - Math.round(60 * this.sw), top + this.yPreset, "Gác lại", () => this.park(), {
      width: Math.round(96 * this.sw), hint: "Esc", maxScale: MAX_SCALE_BTN,
    }).setScrollFactor(0));

    this.buildLoaf(cx, top + this.yLoaf);
    // Phiếu đơn KHÔNG nằm trong bảng: bảng nằm ngay dưới phiếu của HUD nên câu khách
    // nói (nguyên văn) luôn thấy được ngay phía trên.
    this.buildTray(cx, top + this.yTray);
    // Hàng cuối của khay chỉ có một ô (10 món / 3 cột) — hai nút Hoàn tác / Gói lại nằm
    // ngay trên hai cột trống của hàng đó, không chồng lên ô nào.
    this.buildActions(cx, top + this.yAct);
  }

  // ───────────────────────────────────────────────────────────────── dựng bảng

  /** CANON §15.1: hộp TỰ GIÃN theo chữ — bảng kẹp nhân là màn hình quan trọng nhất, cỡ chữ 200% không được cắt mất gì. */
  private layout() {
    this.s = Math.max(1, Math.min(textScale(), MAX_SCALE));
    this.sw = Math.min(this.s, MAX_SCALE_W);
    this.pw = Math.round(PANEL_W * this.sw);
    this.tw = Math.round((this.pw - 2 * 17 - 2 * 8) / TRAY_COLS);
    this.th = Math.round(TILE_H - 18 + 18 * this.s);
    this.rowStep = this.th + 6;

    const bh = buttonHeight(MAX_SCALE_BTN);
    let y = 6;
    this.yPreset = y + bh / 2; y += bh + 6;
    this.yLoaf = y + LOAF_H / 2; y += LOAF_H;
    this.yHint = y + Math.round(7 * this.s); y += Math.round(18 * this.s);
    this.yTray = y + this.th / 2; y += TRAY_ROWS * this.rowStep;
    this.yAct = this.yTray + (TRAY_ROWS - 1) * this.rowStep;
    this.ph = Math.round(this.yAct + Math.max(this.th, bh) / 2 + 8);
  }

  private buildLoaf(x: number, y: number) {
    this.loafImg = fitPhoto(this.scene.add.image(x, y, FOOD.loaf)).setScrollFactor(0);
    this.fillLayer = this.scene.add.container(0, 0).setScrollFactor(0);
    this.steam = new Steam(this.scene, true);
    this.root.add([this.loafImg, this.fillLayer, this.steam.graphics]);

    // khe kẹp nhân, rộng hơn hình một chút cho dễ thả trúng
    // Vùng thả KHÔNG được chạm hàng nút phía trên (preset, "Gác lại") — nhả tay trúng nút là bấm nút.
    this.dropZone = new Phaser.Geom.Rectangle(
      x - FOOD.LOAF_W / 2 + 10, y - LOAF_H / 2 + 6, FOOD.LOAF_W - 20, LOAF_H - 12);
    this.hint = this.text(x, PANEL_TOP + this.yHint, "kéo miếng nhân thả vào đây", 11, UI.muted, "400");
    this.root.add(this.hint);
  }

  /** Dời cả bảng xuống để mép trên nằm dưới đáy khung ngày/giờ của HUD. */
  placeBelow(y: number) {
    const dy = Math.max(0, Math.min(GAME_H - 4 - (PANEL_TOP + this.ph), y + 8 - PANEL_TOP));
    if (dy === this.root.y) return;
    this.dropZone.y += dy - this.root.y;
    this.root.y = dy;
  }

  /** Phần nhân ĐANG nằm trên ổ. Chỉ đọc — người dẫn bữa đầu hỏi "còn thiếu gì" (`sim/tour.fillGap`). */
  get dish(): readonly Ingredient[] {
    return this.stack;
  }

  get loafPoint() {
    return { x: this.loafImg.x, y: this.loafImg.y + this.root.y };
  }

  /**
   * Khay nhân và nút "Gói lại", theo TOẠ ĐỘ KHUNG THIẾT KẾ (đã cộng `root.y` của `placeBelow`).
   *
   * Chỉ có một chỗ dùng: bong bóng dẫn bữa đầu khoanh tròn đúng hai chỗ này (`ui/tour/TourCoach`).
   * Trả toạ độ chứ không trả object: lớp dẫn là DOM, nó không được phép cầm GameObject của Phaser
   * rồi lỡ tay sửa gì trong đó.
   */
  trayBounds() {
    const w = TRAY_COLS * this.tw + (TRAY_COLS - 1) * 8;
    return {
      x: this.cx - w / 2, y: PANEL_TOP + this.yTray - this.th / 2 + this.root.y,
      w, h: (TRAY_ROWS - 1) * this.rowStep + this.th,
    };
  }

  wrapBounds() {
    const h = buttonHeight(MAX_SCALE_BTN);
    return {
      x: this.cx + (this.tw + 8) - this.tw / 2, y: PANEL_TOP + this.yAct - h / 2 + this.root.y,
      w: this.tw, h,
    };
  }

  setWarm(warm: boolean, time: number, reducedMotion: boolean) {
    if (!this.open) return;
    // Khói bốc lên từ MÉP TRÊN của ảnh ổ, không phải từ một con số gõ tay —
    // đổi cỡ ổ bánh mà quên chỗ này là ra khói chui ra từ giữa ruột bánh.
    this.steam.draw(this.loafImg.x, this.loafImg.y - LOAF_H / 2, 0, time, warm, reducedMotion, 1.6);
  }

  private buildTray(x: number, y: number) {
    INGREDIENTS.forEach((ing, i) => {
      const col = i % TRAY_COLS, row = (i / TRAY_COLS) | 0;
      const tx = x + (col - (TRAY_COLS - 1) / 2) * (this.tw + 8);
      const ty = y + row * this.rowStep;
      this.root.add(this.makeTile(ing.id, ing.key, ing.label, tx, ty));
    });
  }

  private makeTile(id: Ingredient, key: number, label: string, x: number, y: number) {
    const c = this.scene.add.container(x, y).setScrollFactor(0);
    const TW = this.tw, TH = this.th;

    const bg = this.scene.add.graphics().setScrollFactor(0);
    const paint = (hot: boolean) => {
      bg.clear();
      bg.fillStyle(hot ? 0xe9e2d2 : 0xfaf8f1, 1);
      bg.fillRoundedRect(-TW / 2, -TH / 2, TW, TH, 10);
      bg.lineStyle(1.4, hot ? UI.accent : UI.line, 1);
      bg.strokeRoundedRect(-TW / 2, -TH / 2, TW, TH, 10);
    };
    paint(false);

    const si = Math.min(this.s, 1.2);
    const iconX = -TW / 2 + Math.round(16 + 14 * si);
    const icon = fitPhoto(this.scene.add.image(iconX, 0, FOOD.icon(id)), si).setScrollFactor(0);
    // Tên phải TỰ XUỐNG DÒNG, không thì ở cỡ chữ lớn "trứng ốp la" chạy ra khỏi ô.
    const nameX = -TW / 2 + Math.round(30 + 24 * si);
    const name = this.scene.add.text(nameX, 0, label, {
      fontFamily: FONT, fontSize: `${Math.round(13 * this.s)}px`, fontStyle: "500", color: UI.ink,
      wordWrap: { width: TW / 2 - 8 - nameX, useAdvancedWrap: true },
    }).setOrigin(0, 0.5).setScrollFactor(0);
    const num = this.scene.add.text(TW / 2 - 10, -TH / 2 + 6, String(key), {
      fontFamily: FONT, fontSize: `${Math.round(10 * this.s)}px`, color: "#9aa4ac",
    }).setOrigin(1, 0).setScrollFactor(0);

    // Huy hiệu số phần đang kẹp — "×2", "×3". Không có thì ẩn hẳn. Nằm ở GÓC ẢNH nguyên
    // liệu chứ không nằm bên phải ô: bên phải là chỗ của tên, huy hiệu đè lên thì ô hiện
    // "trứng ốp l" và chữ cuối biến mất dưới cái chấm tròn.
    const r = Math.round(10 * Math.min(this.s, 1.3));
    const bx = iconX - Math.round(FOOD.ICON * si / 2) + Math.round(r * 0.5);
    const by = -TH / 2 + r + 2;
    const badgeBg = this.scene.add.graphics().setScrollFactor(0);
    const badge = this.scene.add.text(bx, by, "", {
      fontFamily: FONT, fontSize: `${Math.round(12 * this.s)}px`, fontStyle: "700", color: "#ffffff",
    }).setOrigin(0.5).setScrollFactor(0);

    this.tiles.set(id, () => {
      const n = portionsOf(this.stack).get(id) ?? 0;
      badgeBg.clear();
      badge.setText(n > 0 ? `×${n}` : "");
      if (n > 0) {
        badgeBg.fillStyle(n >= this.maxOf(id) ? UI.accent : 0x6d7b84, 1);
        badgeBg.fillCircle(bx, by, r);
      }
    });

    c.add([bg, icon, name, num, badgeBg, badge]);
    c.setSize(TW, TH);
    c.setInteractive(new Phaser.Geom.Rectangle(0, 0, TW, TH), Phaser.Geom.Rectangle.Contains);
    this.scene.input.setDraggable(c);

    c.on("pointerover", () => paint(true));
    c.on("pointerout", () => paint(false));
    c.on("pointerdown", () => { this.dragging = false; });
    c.on("pointerup", () => { if (!this.dragging) this.add(id); });

    c.on("dragstart", (p: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.ghost = fitPhoto(this.scene.add.image(p.x, p.y, FOOD.icon(id)), 1.15 * si)
        .setScrollFactor(0).setDepth(9_450_000).setAlpha(0.95);
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

  /** Thang phần ăn chỉ có HAI nấc: một phần là mặc định, hai phần là "cho nhiều". */
  private maxOf(id: Ingredient) {
    return INGREDIENTS.find((i) => i.id === id)!.max;
  }

  private buildActions(cx: number, y: number) {
    const col = (c: number) => cx + (c - (TRAY_COLS - 1) / 2) * (this.tw + 8);
    this.root.add(button(this.scene, col(1), y, "Hoàn tác", () => this.undo(), { width: this.tw, maxScale: MAX_SCALE_BTN }));
    this.root.add(button(this.scene, col(2), y, "Gói lại", () => this.confirm(), {
      width: this.tw, primary: true, hint: "E", maxScale: MAX_SCALE_BTN,
    }));
    this.root.list.filter((o) => o instanceof Phaser.GameObjects.Container)
      .forEach((o) => (o as Phaser.GameObjects.Container).setScrollFactor(0));
  }

  private text(x: number, y: number, t: string, size: number, color: string,
    weight: "400" | "500" | "700") {
    return this.scene.add.text(x, y, t, {
      fontFamily: FONT, fontSize: `${Math.round(size * this.s)}px`, fontStyle: weight, color,
    }).setOrigin(0.5).setScrollFactor(0);
  }

  // ──────────────────────────────────────────────────────────────── thao tác

  private add(id: Ingredient) {
    if (!this.open) return;
    const have = portionsOf(this.stack).get(id) ?? 0;
    if (have >= this.maxOf(id)) { this.flash(`${labelOf(id)} — hết chỗ`); return; }
    if (this.stack.length >= CAPACITY) { this.flash("ổ đã đầy — không kẹp thêm được"); return; }
    const out = this.canAdd(id, this.stack);
    if (out) { this.flash(out); return; }
    const now = this.scene.time.now;
    if (now - this.lastAddAt < this.addCooldownMs) return;
    this.lastAddAt = now;
    this.presetArm = null;
    this.stack.push(id);
    this.onAdd(id);
    this.repaint();
  }

  private removeOne(id: Ingredient) {
    const at = this.stack.lastIndexOf(id);
    if (at >= 0) this.stack.splice(at, 1);
    this.presetArm = null;
    if (!this.stack.length) this.presetUsed = null;
    this.repaint();
  }

  private flash(msg: string) {
    this.hint.setText(msg).setColor(UI.accentCss);
    this.scene.time.delayedCall(2500, () => { if (this.open) this.repaint(); });
  }

  private undo() {
    this.stack.pop();
    this.presetArm = null;
    if (!this.stack.length) this.presetUsed = null;
    this.repaint();
  }

  setPresets(list: readonly { id: string; name: string; prepped: number }[]) {
    list.slice(0, 3).forEach((p, i) => {
      const [main, hint] = this.presetBtns[i] ?? [];
      main?.setText(`${p.id} · ${p.prepped}`);
      hint?.setText(p.name);
    });
  }

  /** KHÔNG trừ suất chia sẵn ở đây — hợp đồng của bảng là "kho chỉ bị trừ lúc gói xong". */
  private applyPreset(i: number) {
    // Ghi đè cả ổ đang kẹp là chuyện lớn: Hoàn tác chỉ `pop()` một miếng nên 20 phần đã
    // kẹp tay không lấy lại được. Hỏi một lần trước khi xoá.
    if (this.stack.length && this.presetArm !== i) {
      this.presetArm = i;
      this.flash(`P${i + 1} thay hết ${this.stack.length} phần đang kẹp — bấm lại để xác nhận`);
      return;
    }
    const dish = this.onPreset(i);
    if (!dish) { this.presetArm = null; this.flash("phần chia sẵn đã hết"); return; }
    const probe: Ingredient[] = [];
    for (const id of dish) {
      const out = this.canAdd(id, probe);
      if (out) { this.presetArm = null; this.flash(out); return; }
      probe.push(id);
    }
    this.stack = [];
    for (const id of dish) { this.stack.push(id); this.onAdd(id); }
    // Preset cũng là một lần "vừa đặt nhân xong" — không ghi mốc thì bấm P1 rồi gói
    // ngay lập tức vẫn trượt FLOURISH, mà đó mới đúng là cú gói nhanh nhất có thể.
    this.lastAddAt = this.scene.time.now;
    this.presetUsed = i;
    this.presetArm = null;
    this.repaint();
  }

  private confirm() {
    if (!this.open) return;
    // Ổ trống KHÔNG phải lúc nào cũng sai ("bánh mì không"); đơn nào cho phép thì scene nói qua `allowEmptyLoaf`.
    if (!this.stack.length && !this.allowEmptyLoaf()) {
      this.flash("ổ còn trống — kẹp nhân trước");
      return;
    }
    // Gói liền tay sau miếng cuối = khéo. Ổ chưa đặt miếng nào trong phiên này
    // (`lastAddAt` còn ở -1e9) thì không tính — gác ổ cả phút rồi quay lại bấm gói
    // không phải là nhanh tay.
    const even = this.scene.time.now - this.lastAddAt <= this.wrapSnapMs;
    const dish = [...this.stack];
    const used = this.presetUsed;
    this.presetUsed = null;
    this.presetArm = null;
    this.hide();
    if (used !== null) this.onPresetConsumed(used);
    this.onDone(dish, even);
  }

  /** XẾP CHỒNG THÀNH LỚP, không xếp thành hàng — đúng cách nhân nằm trong một ổ bánh thật. */
  private repaint() {
    this.fillLayer.removeAll(true);
    this.hint.setColor(UI.muted);

    if (this.stack.length === 0) {
      this.hint.setText("kéo miếng nhân thả vào đây");
      this.tiles.forEach((f) => f());
      return;
    }
    this.hint.setText(`bấm vào một lớp để gỡ bớt   ·   ${this.stack.length}/${CAPACITY} phần`);

    // Dàn NGANG như lát nhân xếp dọc ruột bánh: miếng sau đè lên miếng trước, miếng
    // nào cũng còn lộ một phần — đủ nhận ra hình dáng từng loại.
    //
    // MỘT HÀNG, LUÔN LUÔN. Kẹp nhiều thì các miếng đè khít hơn, chứ không nhảy xuống
    // hàng thứ hai: ổ bánh mì chỉ có một cái máng, xếp thành hai tầng lơ lửng trên
    // vỏ bánh là nhìn ra ngay không phải một ổ bánh nữa.
    const SIZE = Math.ceil(FOOD.ICON * FOOD.BIG_SCALE);
    const SPAN = FOOD.CRUMB_W - SIZE;
    const counts = portionsOf(this.stack);
    const total = this.stack.length;
    const STEP = total > 1 ? Math.min(SIZE * 0.35, SPAN / (total - 1)) : 0;
    const baseY = this.loafImg.y + FOOD.CRUMB_DY;
    let i = 0;

    for (const ing of INGREDIENTS) {
      const n = counts.get(ing.id) ?? 0;
      for (let k = 0; k < n; k++, i++) {
        const x = this.loafImg.x + (i - (total - 1) / 2) * STEP;
        const img = fitPhoto(this.scene.add.image(x, baseY, FOOD.big(ing.id)))
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

  show(initial: readonly Ingredient[] = []) {
    this.stack = [...initial];
    // Ổ mới tinh: quên preset cũ. Ổ gác dở mở lại: GIỮ, không thì gác một cái là mất suất.
    if (!this.stack.length) this.presetUsed = null;
    // Mở lại ổ gác dở KHÔNG phải vừa đặt nhân: để mốc cũ thì bấm gói luôn là ăn
    // FLOURISH free. Lùi hẳn ra ngoài mọi cửa sổ nhanh tay.
    this.lastAddAt = -1e9;
    this.presetArm = null;
    this.open = true;
    this.root.setVisible(true);
    this.repaint();
  }

  park() {
    if (!this.open) return;
    this.presetArm = null;
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
