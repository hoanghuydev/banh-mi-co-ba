import Phaser from "phaser";
import { GAME_H } from "../core/config";
import { FOOD, buildFood } from "../art/food";
import { CAPACITY, INGREDIENTS, labelOf, portionsOf, type Ingredient } from "../sim/order";
import { FONT, UI, button, buttonHeight, panel, textScale } from "./theme";
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
 *
 * Mấy con số dưới đây là cỡ ở chữ 100%; CANON §15.1 bắt bảng phải GIÃN theo cỡ chữ nên
 * chúng chỉ là gốc để nhân — xem `layout()`.
 */
const PANEL_W = 470;
const PANEL_LEFT = 8;
/** Phiếu đơn của HUD nằm góc trên PHẢI, nên bảng dùng được gần hết chiều cao bên trái. */
const PANEL_TOP = 96;
const TILE_H = 44;
const TRAY_COLS = 3;
const TRAY_ROWS = Math.ceil(INGREDIENTS.length / TRAY_COLS);
/** Chỗ ảnh ổ bánh chiếm theo chiều dọc. Ảnh ổ KHÔNG phóng theo cỡ chữ. */
const LOAF_H = FOOD.LOAF_H;
/**
 * Trần phóng của bảng. Khung hình thiết kế chỉ cao 576 px và bảng phải nằm gọn dưới
 * khung ngày/giờ của HUD, nên ở chữ 200% bảng KHÔNG thể phóng 200% — phóng hết mức mà
 * vẫn còn thấy đủ 10 ô nhân là ~145%. Bề ngang chặn thấp hơn nữa: bảng mà rộng quá
 * nửa màn hình là che mất hàng khách.
 */
const MAX_SCALE = 1.45;
const MAX_SCALE_W = 1.15;
/** Trần phóng của nút — nút cao quá thì hàng cuối của khay không còn chỗ. */
const MAX_SCALE_BTN = 1.25;
/**
 * Gói bánh là MỘT cú bấm. Trước đây là ba nhịp gập · cuộn · xoắn và FLOURISH đo
 * bằng độ đều của hai khoảng nhịp — ba cú bấm cho mỗi ổ, mỗi khách, cả bốn mươi
 * ngày, là quá nhiều thao tác cho một thứ không có nhánh hỏng.
 *
 * FLOURISH không mất theo: nó chuyển từ ĐỀU TAY sang NHANH TAY — gói trong vòng
 * `wrapSnapMs` kể từ lúc đặt miếng nhân cuối là khéo. Vẫn là một khoảnh khắc đọc
 * được từ nhịp tay người chơi, và `service.ts` (SK ngày 5 của bé Sử) cùng
 * `gossip.ts` vẫn có cái để bắt.
 */
const WRAP_SNAP_MS = 900;

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
   * Ổ đang kẹp được áp bằng preset thứ mấy. Suất chia sẵn CHỈ bị trừ lúc gói xong —
   * đúng hợp đồng của bảng ("gỡ ra thì như chưa lấy"), nên phải nhớ qua cả lần gác ổ.
   */
  private presetUsed: number | null = null;
  /** Preset đang chờ xác nhận ghi đè (bấm lần nữa) — xem `applyPreset`. */
  private presetArm: number | null = null;
  private tiles = new Map<Ingredient, () => void>();
  /** Dao bén (P3-04 A2) nới cửa sổ gói nhanh tay 0,9 s → 1,5 s. */
  wrapSnapMs = WRAP_SNAP_MS;
  /** Kẹp gắp (P3-04 A4): gắp chậm hơn bốc tay — mỗi lần gắp cách nhau chừng này (ms). */
  addCooldownMs = 0;
  private lastAddAt = -1e9;
  private open = false;

  // ─── cỡ thật của bảng ở cỡ chữ hiện tại (CANON §15.1) — xem `layout()`
  /** Hệ số phóng chung. */
  private s = 1;
  /** Hệ số phóng theo bề ngang (chặn thấp hơn: bảng không được lấn sang hàng khách). */
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

  constructor(
    private scene: Phaser.Scene,
    private onDone: (dish: Ingredient[], evenWrap: boolean) => void,
    /** Đóng bảng mà CHƯA gói — ổ bánh nằm lại trên thớt với đúng phần nhân đã kẹp. */
    private onPark: (dish: Ingredient[]) => void = () => {},
    /** Vừa đặt một phần lên ổ — scene cần biết để phát lỗi NGAY lúc đặt sai (P1-03 §2.6.2). */
    private onAdd: (id: Ingredient) => void = () => {},
    /**
     * Bấm nút preset P1/P2/P3 — scene trả lại danh sách phần (hoặc null nếu hết phần chia
     * sẵn). THUẦN TUÝ: chỉ đọc, KHÔNG được trừ suất chia sẵn ở đây (xem `onPresetConsumed`).
     */
    private onPreset: (i: number) => Ingredient[] | null = () => null,
    /**
     * P3-03 — hết là hết (KH-3): trả lý do nếu KHÔNG bỏ thêm được phần này (kho hết),
     * null nếu được. Kiểm lúc bỏ vào; kho chỉ bị trừ lúc gói xong (gỡ ra thì như chưa lấy).
     */
    private canAdd: (id: Ingredient, stack: readonly Ingredient[]) => string | null = () => null,
    /** Đơn hiện tại cho phép ổ trống (bánh mì không) — P4-03 SK-31. */
    private allowEmptyLoaf: () => boolean = () => false,
    /** Ổ đã gói xong bằng preset thứ i — giờ mới được trừ phần chia sẵn. */
    private onPresetConsumed: (i: number) => void = () => {},
  ) {
    buildFood(scene);
    this.layout();

    const cx = PANEL_LEFT + this.pw / 2, cy = PANEL_TOP + this.ph / 2;
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
    this.root.add(button(scene, cx + this.pw / 2 - Math.round(60 * this.sw), top + this.yPreset, "để đó", () => this.park(), {
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

  /**
   * CANON §15.1: hộp phải TỰ GIÃN theo chữ — bảng kẹp nhân là màn hình quan trọng nhất
   * game, không được là chỗ duy nhất giữ nguyên 13 px ở cỡ chữ 200%.
   *
   * Phóng hết mức mà bảng vẫn nằm trong khung 1024×576 và vẫn chừa hàng khách bên phải:
   *  · chiều cao chốt ở 4 hàng khay + ổ bánh (ảnh ổ không phóng) → trần ~1,45
   *  · bề ngang chốt ở "không quá nửa màn hình"                  → trần 1,15
   * Muốn tới đúng 200% thì phải cho khay CUỘN được — đổi lớn hơn phạm vi chỗ này.
   */
  private layout() {
    this.s = Math.max(1, Math.min(textScale(), MAX_SCALE));
    this.sw = Math.min(this.s, MAX_SCALE_W);
    this.pw = Math.round(PANEL_W * this.sw);
    // 3 ô + 2 khe 8 px + lề 17 px hai bên = pw
    this.tw = Math.round((this.pw - 2 * 17 - 2 * 8) / TRAY_COLS);
    // Ô cao theo chữ, nhưng chậm hơn chữ: 13 px trong ô 44 px vốn đã rất thoáng.
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

  /** Ổ bánh + vùng thả. Bấm vào một miếng đã kẹp thì gỡ nó ra. */
  private buildLoaf(x: number, y: number) {
    this.loafImg = this.scene.add.image(x, y, FOOD.loaf).setScrollFactor(0);
    this.fillLayer = this.scene.add.container(0, 0).setScrollFactor(0);
    this.steam = new Steam(this.scene, true);
    this.root.add([this.loafImg, this.fillLayer, this.steam.graphics]);

    // khe kẹp nhân, rộng hơn hình một chút cho dễ thả trúng
    // Vùng thả KHÔNG được chạm hàng nút phía trên (preset, "để đó") — nhả tay trúng nút là bấm nút.
    this.dropZone = new Phaser.Geom.Rectangle(
      x - FOOD.LOAF_W / 2 + 10, y - LOAF_H / 2 + 6, FOOD.LOAF_W - 20, LOAF_H - 12);
    this.hint = this.text(x, PANEL_TOP + this.yHint, "kéo miếng nhân thả vào đây", 11, UI.muted, "400");
    this.root.add(this.hint);
  }

  /**
   * Dời cả bảng xuống để mép trên nằm dưới `y` (đáy khung ngày/giờ của HUD — ở chữ 200%
   * khung đó cao hơn). Không dời quá đáy màn hình.
   */
  placeBelow(y: number) {
    const dy = Math.max(0, Math.min(GAME_H - 4 - (PANEL_TOP + this.ph), y + 8 - PANEL_TOP));
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
    // Khói bốc lên từ MÉP TRÊN của ảnh ổ, không phải từ một con số gõ tay —
    // đổi cỡ ổ bánh mà quên chỗ này là ra khói chui ra từ giữa ruột bánh.
    this.steam.draw(this.loafImg.x, this.loafImg.y - LOAF_H / 2, 0, time, warm, reducedMotion, 1.6);
  }

  /** Khay nguyên liệu: 3 cột, mỗi ô kéo được và bấm được. */
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

    // Ảnh nguyên liệu nướng sẵn ở 36 px — phóng vừa phải thôi, quá tay là bể hạt.
    const si = Math.min(this.s, 1.2);
    const iconX = -TW / 2 + Math.round(16 + 14 * si);
    const icon = this.scene.add.image(iconX, 0, FOOD.icon(id)).setScale(si).setScrollFactor(0);
    // Tên phải TỰ XUỐNG DÒNG: không có bề ngang cố định thì ở cỡ chữ lớn "trứng ốp la"
    // chạy thẳng ra khỏi ô (và trước đây còn chui xuống dưới huy hiệu ×N).
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
    c.on("pointerup", () => { if (!this.dragging) this.add(id); });   // chạm-để-đặt

    c.on("dragstart", (p: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.ghost = this.scene.add.image(p.x, p.y, FOOD.icon(id))
        .setScrollFactor(0).setDepth(9_450_000).setScale(1.15 * si).setAlpha(0.95);
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

  /** Bỏ thêm một phần. Chạm trần của món đó, hoặc đầy ổ, thì không nhận nữa. */
  private add(id: Ingredient) {
    if (!this.open) return;                             // kéo dở mà bảng đã đóng (đi khỏi thớt)
    const have = portionsOf(this.stack).get(id) ?? 0;
    if (have >= this.maxOf(id)) { this.flash(`${labelOf(id)} hết chỗ rồi`); return; }
    if (this.stack.length >= CAPACITY) { this.flash("ổ bánh đầy rồi, kẹp không lại"); return; }
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

  /** Gỡ MỘT phần của món đó — bỏ miếng mới nhất. */
  private removeOne(id: Ingredient) {
    const at = this.stack.lastIndexOf(id);
    if (at >= 0) this.stack.splice(at, 1);
    this.presetArm = null;
    if (!this.stack.length) this.presetUsed = null;     // ổ về trống = như chưa lấy suất nào
    this.repaint();
  }

  private flash(msg: string) {
    this.hint.setText(msg).setColor(UI.accentCss);
    // P1-04 §2.4 mục 7: lý do hiện đủ 2,5 s — không có nút nào bị chặn mà câm.
    this.scene.time.delayedCall(2500, () => { if (this.open) this.repaint(); });
  }

  private undo() {
    this.stack.pop();
    this.presetArm = null;
    if (!this.stack.length) this.presetUsed = null;
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

  /**
   * Áp một preset. KHÔNG trừ suất chia sẵn ở đây: hợp đồng của bảng là "kho chỉ bị trừ
   * lúc gói xong (gỡ ra thì như chưa lấy)", mà trước đây bấm P1 rồi Hoàn tác là mất suất
   * vĩnh viễn — ba cú bấm hụt là mất 3 trong 12 suất, không lấy lại được. Suất chỉ rụng
   * ở `confirm()`, qua `onPresetConsumed`.
   */
  private applyPreset(i: number) {
    // Ghi đè cả ổ đang kẹp là chuyện lớn: Hoàn tác chỉ `pop()` một miếng nên 20 phần đã
    // kẹp tay không lấy lại được. Hỏi một lần trước khi xoá.
    if (this.stack.length && this.presetArm !== i) {
      this.presetArm = i;
      this.flash(`P${i + 1} thay hết ${this.stack.length} phần đang kẹp — bấm lần nữa`);
      return;
    }
    const dish = this.onPreset(i);
    if (!dish) { this.presetArm = null; this.flash("preset đó hết phần chia sẵn rồi"); return; }
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
    // Ổ trống KHÔNG phải lúc nào cũng sai: bé Sử gọi "ổ bánh mì không" cả 40 ngày, bà Sáu
    // đổi chén tàu hũ lấy ổ không, và SK-31 ngày 29 (bắt buộc) có hẳn nhánh "làm đúng ổ
    // bánh mì không". Đơn nào cho phép thì scene nói qua `allowEmptyLoaf`.
    if (!this.stack.length && !this.allowEmptyLoaf()) {
      this.flash("ổ còn trống — kẹp nhân trước đã");
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

    // Dàn NGANG như lát nhân xếp dọc ruột bánh: miếng sau đè lên miếng trước, miếng
    // nào cũng còn lộ một phần — đủ nhận ra hình dáng từng loại.
    //
    // MỘT HÀNG, LUÔN LUÔN. Kẹp nhiều thì các miếng đè khít hơn, chứ không nhảy xuống
    // hàng thứ hai: ổ bánh mì chỉ có một cái máng, xếp thành hai tầng lơ lửng trên
    // vỏ bánh là nhìn ra ngay không phải một ổ bánh nữa.
    const SIZE = Math.ceil(FOOD.ICON * FOOD.BIG_SCALE);
    const SPAN = FOOD.CRUMB_W - SIZE;                  // tâm miếng đầu -> tâm miếng cuối
    const counts = portionsOf(this.stack);
    const total = this.stack.length;
    // Thưa nhất là đè 65% (chừa 35% mỗi miếng); đông quá thì bóp lại cho vừa lòng máng.
    const STEP = total > 1 ? Math.min(SIZE * 0.35, SPAN / (total - 1)) : 0;
    const baseY = this.loafImg.y + FOOD.CRUMB_DY;      // hàng nhân nằm trong lòng máng
    let i = 0;

    for (const ing of INGREDIENTS) {                   // dưới lên trên, đúng thứ tự xếp lớp
      const n = counts.get(ing.id) ?? 0;
      for (let k = 0; k < n; k++, i++) {
        const x = this.loafImg.x + (i - (total - 1) / 2) * STEP;     // canh giữa lòng máng
        const img = this.scene.add.image(x, baseY, FOOD.big(ing.id))
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

  /** Gác ổ lại trên thớt — giữ nguyên phần đã kẹp (và giữ cả `presetUsed`). */
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
