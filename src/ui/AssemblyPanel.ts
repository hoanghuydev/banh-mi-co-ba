import Phaser from "phaser";
import { fitPhoto } from "../art/photo";
import { GAME_H } from "../core/config";
import { designFor, hint, isTouch, onDeviceChange } from "../core/device";
import { FOOD, buildFood } from "../art/food";
import { CAPACITY, INGREDIENTS, labelOf, portionsOf, type Ingredient, type IngredientInfo } from "../sim/order";
import { FONT, UI, hintedButtonHeight, platedButtonHeight, platedKit, textScale, touchFont, touchSize, tray, well } from "./theme";
import { Steam } from "./stall/Steam";

const { button } = platedKit;

/** Chữ phụ và báo lỗi trên khay tối. */
const HINT = "#d8cfba";
const HINT_ERR = "#ffb4a6";
const HINT_OK = "#a6e3bd";

/** Bên trái, dưới phiếu đơn của HUD, để không che hàng khách. */
const PANEL_W = 470;
const PANEL_LEFT = 8;
const PANEL_TOP = 96;
const TILE_H = 44;
const TRAY_COLS = 3;
const LOAF_H = FOOD.LOAF_H;
/** Khung thiết kế chỉ cao 576 px và bảng phải nằm gọn dưới dải HUD. */
const MAX_SCALE = 1.45;
const MAX_SCALE_W = 1.15;
const MAX_SCALE_BTN = 1.25;
/** Gói trong khoảng này sau miếng cuối thì tính là gói khéo. */
const WRAP_SNAP_MS = 900;

type Spot = { x: number; y: number; w: number };
type Geo = {
  presets: Spot[];
  park: Spot;
  loaf: { x: number; y: number };
  well: number;
  hint: { x: number; y: number };
  /** Tâm ô đầu tiên của khay nguyên liệu. */
  tray0: { x: number; y: number };
  rows: number;
  undo: Spot;
  wrap: Spot;
};

export class AssemblyPanel {
  private root: Phaser.GameObjects.Container;
  private loafImg!: Phaser.GameObjects.Image;
  private steam!: Steam;
  private fillLayer!: Phaser.GameObjects.Container;
  private hint!: Phaser.GameObjects.Text;
  private dropZone!: Phaser.Geom.Rectangle;
  private ghost: Phaser.GameObjects.Image | null = null;
  /** Phaser bắn `dragend` rồi mới bắn `pointerup` trên ô vừa kéo, nên phải chặn để khỏi thêm hai lần. */
  private dragging = false;

  /** Một `id` lặp mấy lần là mấy phần. */
  private stack: Ingredient[] = [];
  private presetBtns: Phaser.GameObjects.Text[][] = [];
  /** Suất chia sẵn chỉ bị trừ lúc gói xong. */
  private presetUsed: number | null = null;
  private presetArm: number | null = null;
  private tiles = new Map<Ingredient, () => void>();
  private tileSpot = new Map<Ingredient, { x: number; y: number }>();
  wrapSnapMs = WRAP_SNAP_MS;
  addCooldownMs = 0;
  private lastAddAt = -1e9;
  private open = false;

  private s = 1;
  private sw = 1;
  private pw = PANEL_W;
  private ph = 400;
  private tw = 140;
  private th = TILE_H;
  private rowStep = 50;
  private g!: Geo;
  private touch = false;
  private presetsCache: readonly { id: string; name: string; prepped: number }[] | null = null;
  private offDevice: () => void;
  private savedDragThreshold = 0;

  constructor(
    private scene: Phaser.Scene,
    private onDone: (dish: Ingredient[], evenWrap: boolean) => void,
    private onPark: (dish: Ingredient[]) => void = () => {},
    private onAdd: (id: Ingredient) => void = () => {},
    /** Trả null nếu hết phần chia sẵn. */
    private onPreset: (i: number) => Ingredient[] | null = () => null,
    /** Trả lý do nếu không bỏ thêm được phần này. */
    private canAdd: (id: Ingredient, stack: readonly Ingredient[]) => string | null = () => null,
    private allowEmptyLoaf: () => boolean = () => false,
    private onPresetConsumed: (i: number) => void = () => {},
    private ingredients: readonly IngredientInfo[] = INGREDIENTS,
  ) {
    buildFood(scene);
    this.root = scene.add.container(0, 0).setDepth(9_400_000).setScrollFactor(0).setVisible(false);
    this.build();
    this.offDevice = onDeviceChange(() => this.rebuild());
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.offDevice());
  }

  private build() {
    this.layout();
    const g = this.g;
    const scene = this.scene;
    this.root.add(tray(scene, PANEL_LEFT + this.pw / 2, PANEL_TOP + this.ph / 2, this.pw, this.ph, 22, 0.72).setScrollFactor(0));
    g.presets.forEach((p, i) => {
      const b = button(scene, p.x, p.y, `P${i + 1}`, () => this.applyPreset(i), { width: p.w, hint: " ", maxScale: MAX_SCALE_BTN });
      b.setScrollFactor(0);
      this.presetBtns.push(b.list.filter((o) => o instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text[]);
      this.root.add(b);
    });
    this.root.add(button(scene, g.park.x, g.park.y, "Gác lại", () => this.park(), {
      width: g.park.w, hint: this.touch ? undefined : "Esc", maxScale: MAX_SCALE_BTN,
    }).setScrollFactor(0));

    this.buildLoaf(g.loaf.x, g.loaf.y);
    this.buildTray();
    this.buildActions();
  }

  /** Dựng lại toàn bộ khi đổi thiết bị, giữ nguyên phần đang kẹp. */
  private rebuild() {
    const wasOpen = this.open, stack = [...this.stack], at = this.root.y;
    this.ghost?.destroy();
    this.ghost = null;
    this.root.removeAll(true);
    this.presetBtns = [];
    this.tiles.clear();
    this.tileSpot.clear();
    this.build();
    this.root.y = at;
    this.dropZone.y += at;
    this.root.setVisible(wasOpen);
    if (wasOpen) { this.stack = stack; this.repaint(); }
    this.presetsCache && this.setPresets(this.presetsCache);
  }

  /** Giãn theo cỡ chữ để ở 200% không bị cắt; cảm ứng thì hàng cao tới mức chạm được. */
  private layout() {
    this.touch = isTouch();
    this.s = Math.max(1, Math.min(textScale(), MAX_SCALE));
    this.sw = Math.min(this.s, MAX_SCALE_W);
    const n = this.ingredients.length;
    const bh = hintedButtonHeight(MAX_SCALE_BTN);
    const L = PANEL_LEFT, T = PANEL_TOP;

    if (this.touch) {
      const gap = 8;
      const font = touchFont(Math.round(13 * this.s));
      this.th = Math.max(touchSize(TILE_H), Math.ceil(font * 2.6 + 8));
      this.rowStep = this.th + 6;
      this.tw = Math.round(170 * this.sw);
      const leftW = FOOD.LOAF_W, trayW = TRAY_COLS * this.tw + (TRAY_COLS - 1) * 8;
      this.pw = 16 + leftW + 16 + trayW + 16;
      const bw = Math.round(150 * this.sw);
      const presets = [0, 1, 2].map((i) => ({ x: L + 16 + bw / 2 + i * (bw + gap), y: T + 8 + bh / 2, w: bw }));
      const park = { x: L + this.pw - 16 - bw / 2, y: T + 8 + bh / 2, w: bw };
      const y1 = 8 + bh + 8;
      const loaf = { x: L + 16 + leftW / 2, y: T + y1 + LOAF_H / 2 };
      const hintH = touchFont(Math.round(11 * this.s)) + 8;
      const hintPos = { x: loaf.x, y: T + y1 + LOAF_H + hintH / 2 };
      const ab = Math.max(platedButtonHeight(MAX_SCALE_BTN), touchSize(44));
      const undoY = y1 + LOAF_H + hintH + 4 + ab / 2;
      const wrapY = undoY + ab + gap;
      const tray0 = { x: L + 16 + leftW + 16 + this.tw / 2, y: T + y1 + this.th / 2 };
      const rows = Math.ceil(n / TRAY_COLS);
      const trayBottom = y1 + (rows - 1) * this.rowStep + this.th;
      this.ph = Math.round(Math.max(wrapY + ab / 2, trayBottom) + 8);
      this.g = {
        presets, park, loaf, well: leftW, hint: hintPos, tray0, rows,
        undo: { x: loaf.x, y: T + undoY, w: leftW }, wrap: { x: loaf.x, y: T + wrapY, w: leftW },
      };
      return;
    }

    this.pw = Math.round(PANEL_W * this.sw);
    this.tw = Math.round((this.pw - 2 * 17 - 2 * 8) / TRAY_COLS);
    this.th = Math.round(TILE_H - 18 + 18 * this.s);
    this.rowStep = this.th + 6;

    let y = 6;
    const yPreset = y + bh / 2; y += bh + 6;
    const yLoaf = y + LOAF_H / 2; y += LOAF_H;
    const yHint = y + Math.round(7 * this.s); y += Math.round(18 * this.s);
    const rows = Math.ceil(n / TRAY_COLS);
    const actRow = n % TRAY_COLS === 1 ? rows - 1 : rows;
    const yTray = y + this.th / 2;
    const yAct = yTray + actRow * this.rowStep;
    this.ph = Math.round(yAct + Math.max(this.th, bh) / 2 + 8);

    const cx = L + this.pw / 2;
    const pw = Math.round(100 * this.sw), pgap = Math.round(108 * this.sw);
    const col = (c: number) => cx + (c - (TRAY_COLS - 1) / 2) * (this.tw + 8);
    this.g = {
      presets: [0, 1, 2].map((i) => ({ x: cx - this.pw / 2 + Math.round(62 * this.sw) + i * pgap, y: T + yPreset, w: pw })),
      park: { x: cx + this.pw / 2 - Math.round(60 * this.sw), y: T + yPreset, w: Math.round(96 * this.sw) },
      loaf: { x: cx, y: T + yLoaf },
      well: this.pw - 36,
      hint: { x: cx, y: T + yHint },
      tray0: { x: col(0), y: T + yTray }, rows,
      undo: { x: col(1), y: T + yAct, w: this.tw }, wrap: { x: col(2), y: T + yAct, w: this.tw },
    };
  }

  private buildLoaf(x: number, y: number) {
    this.loafImg = fitPhoto(this.scene.add.image(x, y, FOOD.loaf)).setScrollFactor(0);
    this.fillLayer = this.scene.add.container(0, 0).setScrollFactor(0);
    this.steam = new Steam(this.scene, true);
    const slot = well(this.scene, x, y - 2, this.g.well, LOAF_H - 8, 14).setScrollFactor(0);
    this.root.add([slot, this.loafImg, this.fillLayer, this.steam.graphics]);

    // Không được chạm hàng nút phía trên, nhả tay trúng nút là bấm nút.
    this.dropZone = new Phaser.Geom.Rectangle(
      x - FOOD.LOAF_W / 2 + 10, y - LOAF_H / 2 + 6, FOOD.LOAF_W - 20, LOAF_H - 12);
    this.hint = this.text(this.g.hint.x, this.g.hint.y, this.idleHint(), 11, HINT, "400");
    this.root.add(this.hint);
  }

  placeBelow(y: number) {
    const dy = Math.max(0, Math.min(GAME_H - 4 - (PANEL_TOP + this.ph), y + 8 - PANEL_TOP));
    if (dy === this.root.y) return;
    this.dropZone.y += dy - this.root.y;
    this.root.y = dy;
  }

  get dish(): readonly Ingredient[] {
    return this.stack;
  }

  get loafPoint() {
    return { x: this.loafImg.x, y: this.loafImg.y + this.root.y };
  }

  /** Toạ độ khung thiết kế (đã cộng `root.y`) cho lớp dẫn DOM, không trả GameObject. */
  trayBounds() {
    const { tray0, rows } = this.g;
    return {
      x: tray0.x - this.tw / 2, y: tray0.y - this.th / 2 + this.root.y,
      w: TRAY_COLS * this.tw + (TRAY_COLS - 1) * 8, h: (rows - 1) * this.rowStep + this.th,
    };
  }

  wrapBounds() {
    const { wrap } = this.g;
    const h = this.touch ? Math.max(platedButtonHeight(MAX_SCALE_BTN), touchSize(44)) : hintedButtonHeight(MAX_SCALE_BTN);
    return { x: wrap.x - wrap.w / 2, y: wrap.y - h / 2 + this.root.y, w: wrap.w, h };
  }

  private idleHint() {
    return hint("kéo miếng nhân thả vào đây", "chạm miếng nhân để cho vào ổ");
  }

  setWarm(warm: boolean, time: number, reducedMotion: boolean) {
    if (!this.open) return;
    this.steam.draw(this.loafImg.x, this.loafImg.y - LOAF_H / 2, 0, time, warm, reducedMotion, 1.6);
  }

  private buildTray() {
    const { x, y } = this.g.tray0;
    this.ingredients.forEach((ing, i) => {
      const col = i % TRAY_COLS, row = (i / TRAY_COLS) | 0;
      const tx = x + col * (this.tw + 8);
      const ty = y + row * this.rowStep;
      this.tileSpot.set(ing.id, { x: tx, y: ty });
      this.root.add(this.makeTile(ing.id, ing.label, tx, ty));
    });
  }

  /** Khung một ô nhân theo toạ độ thiết kế; `null` nếu món chưa mở. */
  tileBounds(id: Ingredient) {
    const p = this.tileSpot.get(id);
    if (!p) return null;
    return { x: p.x - this.tw / 2, y: p.y - this.th / 2 + this.root.y, w: this.tw, h: this.th };
  }

  private makeTile(id: Ingredient, label: string, x: number, y: number) {
    const c = this.scene.add.container(x, y).setScrollFactor(0);
    const TW = this.tw, TH = this.th;

    const bg = this.scene.add.graphics().setScrollFactor(0);
    const paint = (hot: boolean) => {
      bg.clear();
      bg.fillStyle(0xffffff, 0.7).fillRoundedRect(-TW / 2, -TH / 2 + 2, TW, TH, 10);
      bg.fillStyle(hot ? 0xdcd3bb : 0xcfc6ae, 1).fillRoundedRect(-TW / 2, -TH / 2, TW, TH, 10);
      bg.fillStyle(0x8d8570, 0.45).fillRoundedRect(-TW / 2 + 1, -TH / 2, TW - 2, 5, { tl: 10, tr: 10, bl: 2, br: 2 });
      if (hot) bg.lineStyle(1.4, UI.accent, 1).strokeRoundedRect(-TW / 2, -TH / 2, TW, TH, 10);
    };
    paint(false);

    const si = Math.min(this.s, 1.2) * (this.touch ? 0.85 : 1);
    const iconX = -TW / 2 + Math.round(16 + 14 * si);
    const icon = fitPhoto(this.scene.add.image(iconX, 0, FOOD.icon(id)), si).setScrollFactor(0);
    const nameX = -TW / 2 + Math.round(30 + 24 * si);
    const name = this.scene.add.text(nameX, 0, label, {
      fontFamily: FONT, fontSize: `${touchFont(Math.round(13 * this.s))}px`, fontStyle: "500", color: "#2a2420",
      wordWrap: { width: TW / 2 - 8 - nameX, useAdvancedWrap: true },
    }).setOrigin(0, 0.5).setScrollFactor(0);
    // Huy hiệu "×n" ở góc ảnh, vì bên phải là chỗ của tên.
    const badgeFont = touchFont(Math.round(12 * this.s));
    const r = this.touch ? Math.ceil(badgeFont * 0.72) : Math.round(10 * Math.min(this.s, 1.3));
    const bx = iconX - Math.round(FOOD.ICON * si / 2) + Math.round(r * 0.5);
    const by = -TH / 2 + r + 2;
    const badgeBg = this.scene.add.graphics().setScrollFactor(0);
    const badge = this.scene.add.text(bx, by, "", {
      fontFamily: FONT, fontSize: `${badgeFont}px`, fontStyle: "700", color: "#ffffff",
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

    c.add([bg, icon, name, badgeBg, badge]);
    c.setSize(TW, TH);
    c.setInteractive(new Phaser.Geom.Rectangle(0, 0, TW, TH), Phaser.Geom.Rectangle.Contains);
    this.scene.input.setDraggable(c);

    if (!this.touch) {
      c.on("pointerover", () => paint(true));
      c.on("pointerout", () => paint(false));
    }
    c.on("pointerdown", () => { this.dragging = false; });
    c.on("pointerup", () => { if (!this.dragging) this.add(id); });

    c.on("dragstart", (p: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.ghost = fitPhoto(this.scene.add.image(p.x, p.y - this.fingerLift(), FOOD.icon(id)), 1.15 * si)
        .setScrollFactor(0).setDepth(9_450_000).setAlpha(0.95);
    });
    c.on("drag", (p: Phaser.Input.Pointer) => {
      const y = p.y - this.fingerLift();
      this.ghost?.setPosition(p.x, y);
      const over = this.dropZone.contains(p.x, y);
      this.hint.setColor(over ? HINT_OK : HINT);
    });
    c.on("dragend", (p: Phaser.Input.Pointer) => {
      const dropped = this.dropZone.contains(p.x, p.y - this.fingerLift());
      this.ghost?.destroy();
      this.ghost = null;
      this.hint.setColor(HINT);
      paint(false);
      if (dropped && this.open) this.add(id);
    });

    return c;
  }

  /** Bóng kéo nằm cao hơn ngón để ngón không che. */
  private fingerLift() {
    return this.touch ? Math.ceil(designFor(56)) : 0;
  }

  private maxOf(id: Ingredient) {
    return this.ingredients.find((i) => i.id === id)!.max;
  }

  private buildActions() {
    const { undo, wrap } = this.g;
    this.root.add(button(this.scene, undo.x, undo.y, "Hoàn tác", () => this.undo(), { width: undo.w, maxScale: MAX_SCALE_BTN }));
    this.root.add(button(this.scene, wrap.x, wrap.y, "Gói lại", () => this.confirm(), {
      width: wrap.w, primary: true, hint: this.touch ? undefined : "E", maxScale: MAX_SCALE_BTN,
    }));
    this.root.list.filter((o) => o instanceof Phaser.GameObjects.Container)
      .forEach((o) => (o as Phaser.GameObjects.Container).setScrollFactor(0));
  }

  private text(x: number, y: number, t: string, size: number, color: string,
    weight: "400" | "500" | "700") {
    return this.scene.add.text(x, y, t, {
      fontFamily: FONT, fontSize: `${touchFont(Math.round(size * this.s))}px`, fontStyle: weight, color,
    }).setOrigin(0.5).setScrollFactor(0);
  }

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
    this.hint.setText(msg).setColor(HINT_ERR);
    this.scene.time.delayedCall(2500, () => { if (this.open) this.repaint(); });
  }

  private undo() {
    this.stack.pop();
    this.presetArm = null;
    if (!this.stack.length) this.presetUsed = null;
    this.repaint();
  }

  setPresets(list: readonly { id: string; name: string; prepped: number }[]) {
    this.presetsCache = list;
    list.slice(0, 3).forEach((p, i) => {
      const [main, hint] = this.presetBtns[i] ?? [];
      main?.setText(`${p.id} · ${p.prepped}`);
      hint?.setText(p.name);
      if (hint) hint.setScale(Math.min(1, (this.g.presets[i].w - 14) / Math.max(1, hint.width)));
    });
  }

  /** Không trừ suất chia sẵn ở đây, chỉ trừ lúc gói xong. */
  private applyPreset(i: number) {
    // Hoàn tác chỉ gỡ một miếng nên phải xác nhận trước khi ghi đè cả ổ.
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
    // Preset tính là vừa đặt nhân, để gói ngay vẫn được tính khéo.
    this.lastAddAt = this.scene.time.now;
    this.presetUsed = i;
    this.presetArm = null;
    this.repaint();
  }

  private confirm() {
    if (!this.open) return;
    if (!this.stack.length && !this.allowEmptyLoaf()) {
      this.flash("ổ còn trống — kẹp nhân trước");
      return;
    }
    const even = this.scene.time.now - this.lastAddAt <= this.wrapSnapMs;
    const dish = [...this.stack];
    const used = this.presetUsed;
    this.presetUsed = null;
    this.presetArm = null;
    this.hide();
    if (used !== null) this.onPresetConsumed(used);
    this.onDone(dish, even);
  }

  private repaint() {
    this.fillLayer.removeAll(true);
    this.hint.setColor(HINT);

    if (this.stack.length === 0) {
      this.hint.setText(this.idleHint());
      this.tiles.forEach((f) => f());
      return;
    }
    this.hint.setText(this.touch
      ? `${this.stack.length}/${CAPACITY} phần`
      : `bấm vào một lớp để gỡ bớt   ·   ${this.stack.length}/${CAPACITY} phần`);

    // Luôn một hàng dọc ruột bánh, nhiều miếng thì đè khít hơn chứ không xuống hàng.
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
        if (!this.touch) {
          img.setInteractive({ useHandCursor: true });
          img.on("pointerup", () => this.removeOne(ing.id));
        }
        this.fillLayer.add(img);
      }
    }
    this.tiles.forEach((f) => f());
  }

  get isOpen() {
    return this.open;
  }

  show(initial: readonly Ingredient[] = []) {
    this.stack = [...initial];
    // Ổ gác dở mở lại thì giữ preset, không thì mất suất.
    if (!this.stack.length) this.presetUsed = null;
    // Mở lại ổ gác dở không tính là vừa đặt nhân.
    this.lastAddAt = -1e9;
    this.presetArm = null;
    if (!this.open) this.savedDragThreshold = this.scene.input.dragDistanceThreshold;
    this.open = true;
    this.root.setVisible(true);
    this.scene.input.dragDistanceThreshold = this.touch ? Math.ceil(designFor(8)) : this.savedDragThreshold;
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
    if (this.open) this.scene.input.dragDistanceThreshold = this.savedDragThreshold;
    this.open = false;
    this.ghost?.destroy();
    this.ghost = null;
    this.root.setVisible(false);
  }

  handleKey(code: string): boolean {
    if (!this.open) return false;

    if (code === "Backspace") { this.undo(); return true; }
    if (code === "Escape") { this.park(); return true; }
    if (code === "KeyE" || code === "Space" || code === "Enter") { this.confirm(); return true; }
    return false;
  }
}
