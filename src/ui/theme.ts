import Phaser from "phaser";
import { loadSettings } from "../core/save";
import { sfx } from "../audio/sfx";
import { MIN_FONT, MIN_TOUCH, designFor, fitScale, isTouch } from "../core/device";
import { ZOOM } from "../world/camera";
import { CLAY, clayButton, clayCard, clayFaceDy, clayImage, type ClayState } from "./clay";

export const FONT = '"Be Vietnam Pro", ui-sans-serif, "Segoe UI", system-ui, sans-serif';

export const UI = {
  ink: "#222a31",
  inkNum: 0x222a31,
  paper: 0xf3f0e7,
  paperCss: "#f3f0e7",
  muted: "#6a7680",
  line: 0xc9c3b4,
  accent: 0xc0392b,
  accentCss: "#c0392b",
  good: "#3f7d5a",
  goodCss: "#3f7d5a",
} as const;

/** Xếp theo chiều cao đo được, không toạ độ cố định, để chữ 150–200% không chồng nhau. */
export class Stack {
  y: number;
  constructor(top: number, private gap = 12) { this.y = top; }
  /** Object có origin (0.5, 0.5). */
  place<T extends Phaser.GameObjects.Components.Transform & { height: number; displayHeight?: number }>(o: T, gap = this.gap): T {
    const h = (o as any).displayHeight ?? o.height;
    o.setY(this.y + h / 2);
    this.y += h + gap;
    return o;
  }
  button<T extends Phaser.GameObjects.Components.Transform>(o: T, gap = this.gap): T {
    const h = (o as unknown as { height?: number }).height ?? buttonHeight();
    o.setY(this.y + h / 2);
    this.y += h + gap;
    return o;
  }
  skip(dy: number) { this.y += dy; }
}

/** Cạnh thiết kế nhỏ nhất để một vùng chạm đạt `css` px thật trên cảm ứng; chuột giữ `base`. */
export function touchSize(base: number, css = MIN_TOUCH) {
  return isTouch() ? Math.max(base, Math.ceil(designFor(css))) : base;
}

/** Cỡ chữ thiết kế nhỏ nhất để chữ đạt `css` px thật trên cảm ứng; chuột giữ `base`. */
export function touchFont(base: number, css = MIN_FONT) {
  return isTouch() ? Math.max(base, Math.ceil(designFor(css))) : base;
}

/** Cỡ chữ trong thế giới (camera zoom) để chữ đạt `css` px thật trên cảm ứng; chuột giữ `base`. */
export function worldFont(base: number, css = MIN_FONT) {
  return isTouch() ? Math.max(base, Math.ceil(css / (fitScale() * ZOOM))) : base;
}

export function buttonHeight(maxScale = 1.5) {
  return touchSize(Math.round(46 * Math.min(textScale(), maxScale)));
}

export function platedButtonHeight(maxScale = 1.5) {
  return touchSize(Math.round(40 * Math.min(textScale(), maxScale)));
}

/** Nút ảnh có dòng phụ cần hai tầng chữ nằm gọn trong khung kẻ chỉ. */
export function hintedButtonHeight(maxScale = 1.5) {
  return touchSize(Math.round(54 * Math.min(textScale(), maxScale)));
}

export function textScale() {
  return loadSettings().textScale;
}

export function label(
  scene: Phaser.Scene, x: number, y: number, text: string,
  size = 15, color: string = UI.ink, weight: "400" | "500" | "700" = "500",
) {
  return scene.add.text(x, y, text, {
    fontFamily: FONT,
    fontSize: `${touchFont(Math.round(size * textScale()))}px`,
    fontStyle: weight,
    color,
    lineSpacing: Math.round(size * 0.5),
  }).setOrigin(0.5);
}

export function panel(
  scene: Phaser.Scene, x: number, y: number, w: number, h: number,
  fill: number = UI.paper, alpha = 1, plated = false,
): Phaser.GameObjects.Graphics | Phaser.GameObjects.Image {
  if (plated) return clayImage(scene, clayCard(scene, w, h), x, y, w, h);
  const g = scene.add.graphics();
  g.fillStyle(0x0d1216, 0.18);
  g.fillRoundedRect(x - w / 2 + 2, y - h / 2 + 5, w, h, 14);
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);
  g.lineStyle(1.5, UI.line, alpha);
  g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 14);
  return g;
}

export type ButtonOpts = {
  width?: number;
  primary?: boolean;
  disabled?: boolean;
  hint?: string;
  /** Trần phóng chữ, dùng chung cho chữ và hộp để chữ không tràn khỏi nút. */
  maxScale?: number;
  plated?: boolean;
};

export function button(
  scene: Phaser.Scene, x: number, y: number, text: string,
  onClick: () => void, opts: ButtonOpts = {},
) {
  const w = opts.width ?? 260;
  const cap = opts.maxScale ?? 1.5;
  const h = !opts.plated ? buttonHeight(cap) : opts.hint ? hintedButtonHeight(cap) : platedButtonHeight(cap);
  const c = scene.add.container(x, y);
  // label() nhân cỡ chữ với textScale — chia ngược lại để chữ nút theo đúng trần `cap`.
  const ts = textScale(), k = Math.min(ts, cap) / ts;

  const bg = scene.add.graphics();
  const tone = opts.disabled ? CLAY.grey : opts.primary ? CLAY.red : CLAY.cream;
  const face = opts.plated ? clayImage(scene, clayButton(scene, tone, w, h, "up"), 0, 0, w, h) : null;
  const txt = label(scene, 0, opts.hint ? -Math.round(h * 0.16) : 0, text, 16 * k,
    opts.primary ? "#ffffff" : UI.ink, "700");
  const hint = opts.hint ? label(scene, 0, Math.round(h * 0.26), opts.hint, 11 * k, opts.primary ? "#ffe3dc" : UI.muted, "500") : null;
  if (face) {
    const hi = opts.primary || opts.disabled;
    txt.setShadow(0, hi ? 2 : 1, hi ? tone.lip : "#ffffff", 0, false, true);
    if (opts.disabled) txt.setColor("#f4f4f4");
  }

  const paint = (hover: boolean, down = false) => {
    bg.clear();
    if (face) {
      const st: ClayState = down ? "down" : hover ? "hover" : "up";
      face.setTexture(clayButton(scene, tone, w, h, st));
      const dy = clayFaceDy(st);
      txt.setY((hint ? -Math.round(h * 0.2) : 0) + dy);
      hint?.setY(Math.round(h * 0.2) + dy);
      return;
    }
    const fill = opts.disabled ? 0xdedacf : opts.primary ? UI.accent : UI.paper;
    bg.fillStyle(0x0d1216, opts.disabled ? 0.08 : 0.18);
    bg.fillRoundedRect(-w / 2 + 1, -h / 2 + (hover ? 2 : 4), w, h, 12);
    bg.fillStyle(fill, 1);
    bg.fillRoundedRect(-w / 2, -h / 2 + (hover ? 2 : 0), w, h, 12);
    if (!opts.primary) {
      bg.lineStyle(1.5, hover ? UI.accent : UI.line, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2 + (hover ? 2 : 0), w, h, 12);
    }
  };
  const fit = () => {
    const room = w - 56;
    for (const t of [txt, hint]) t?.setScale(Math.min(1, room / Math.max(1, t.width)));
  };
  if (face) { fit(); c.setData("fit", fit); }
  paint(false);

  c.add([bg, ...(face ? [face] : []), txt, ...(hint ? [hint] : [])]);
  c.setSize(w, h);
  c.setAlpha(opts.disabled && !opts.plated ? 0.55 : 1);

  if (!opts.disabled) {
    // Phaser cộng displayOrigin vào toạ độ local của Container nên hit area tính từ (0,0).
    c.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    // Đòi nhấn xuống trên chính nút, để kéo–thả nhả tay trúng nút không bấm nhầm.
    let pressed = false;
    c.on("pointerover", () => { paint(true); scene.input.setDefaultCursor("pointer"); });
    c.on("pointerout", () => { pressed = false; paint(false); scene.input.setDefaultCursor("default"); });
    c.on("pointerdown", () => { pressed = true; paint(true, true); });
    c.on("pointerup", () => {
      scene.input.setDefaultCursor("default");
      paint(false);
      if (!pressed) return;
      pressed = false;
      sfx.play(scene, "ui_click");
      onClick();
    });
  }
  return c;
}

let dragging = 0;

/** Đang kéo một thanh — trang cuộn theo chuột phải nhường lúc đó. */
export const sliderDragging = () => dragging > 0;

export type SliderOpts = { width?: number; hint?: string; step?: number; onRelease?: () => void; plated?: boolean };

/** Thanh kéo 0–100: nhãn trái, số phải, rãnh dưới. Bấm hoặc kéo đều đặt được giá trị. */
export function slider(
  scene: Phaser.Scene, x: number, y: number, text: string,
  get: () => number, set: (v: number) => void, opts: SliderOpts = {},
) {
  const w = opts.width ?? 340;
  const step = opts.step ?? 5;
  const h = sliderHeight();
  const k = Math.min(textScale(), 1.25) / textScale();
  const padX = 16;
  const trackW = w - padX * 2;
  const trackY = Math.round(h * 0.3);

  const c = scene.add.container(x, y);
  const face = opts.plated ? clayImage(scene, clayCard(scene, w, h, { ornate: false, lip: 6, radius: 18 }), 0, 0, w, h) : null;
  const bg = scene.add.graphics();
  const name = label(scene, -w / 2 + padX, -Math.round(h * 0.3), text, 15 * k, UI.ink, "500").setOrigin(0, 0.5);
  const val = label(scene, w / 2 - padX, -Math.round(h * 0.3), "", 14 * k, UI.muted, "500").setOrigin(1, 0.5);
  const hint = opts.hint
    ? label(scene, -w / 2 + padX, -Math.round(h * 0.02), opts.hint, 11 * k, UI.muted, "400").setOrigin(0, 0.5)
    : null;

  const paint = () => {
    const v = Math.max(0, Math.min(100, get()));
    val.setText(v === 0 ? "tắt" : `${v}%`);
    bg.clear();
    if (!opts.plated) {
      bg.fillStyle(0x0d1216, 0.18);
      bg.fillRoundedRect(-w / 2 + 1, -h / 2 + 4, w, h, 12);
      bg.fillStyle(UI.paper, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
      bg.lineStyle(1.5, UI.line, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    }
    const kx = -trackW / 2 + (trackW * v) / 100;
    if (opts.plated) {
      const th = 12, tx = -trackW / 2, ty = trackY - th / 2;
      bg.fillStyle(0xffffff, 0.75).fillRoundedRect(tx, ty + 2, trackW, th, th / 2);
      bg.fillStyle(0xb4b0a2, 1).fillRoundedRect(tx, ty, trackW, th, th / 2);
      bg.fillStyle(0x8d8a7e, 0.55).fillRoundedRect(tx + 1, ty, trackW - 2, 4, 2);
      if (v > 0) {
        const fw = Math.max(th, kx - tx);
        bg.fillStyle(0xe0432f, 1).fillRoundedRect(tx, ty, fw, th, th / 2);
        bg.fillStyle(0xb52a1a, 1).fillRoundedRect(tx + 1, ty + th - 4, fw - 2, 3.5, 1.5);
        bg.fillStyle(0xffffff, 0.5).fillRoundedRect(tx + 3, ty + 1.5, fw - 6, 3, 1.5);
      }
      bg.fillStyle(0x3c1c0a, 0.3).fillCircle(kx, trackY + 7, 11);
      bg.fillStyle(0xb9a47a, 1).fillCircle(kx, trackY + 3.5, 11);
      bg.fillStyle(0xf6efdc, 1).fillCircle(kx, trackY, 11);
      bg.fillStyle(0xe3d6b4, 1).fillCircle(kx, trackY + 3, 8);
      bg.fillStyle(0xfffdf6, 1).fillCircle(kx, trackY - 1.5, 8.5);
      bg.fillStyle(0xffffff, 0.9).fillCircle(kx - 3, trackY - 4, 3);
      bg.lineStyle(1.2, 0x7d6a43, 0.5).strokeCircle(kx, trackY, 11);
      return;
    }
    bg.fillStyle(UI.line, 1);
    bg.fillRoundedRect(-trackW / 2, trackY - 3, trackW, 6, 3);
    bg.fillStyle(UI.accent, 1);
    bg.fillRoundedRect(-trackW / 2, trackY - 3, (trackW * v) / 100, 6, 3);
    bg.fillStyle(UI.accent, 1);
    bg.fillCircle(kx, trackY, 9);
    bg.fillStyle(0xffffff, 1);
    bg.fillCircle(kx, trackY, 4);
  };
  paint();

  c.add([...(face ? [face] : []), bg, name, val, ...(hint ? [hint] : [])]);
  c.setSize(w, h);
  c.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);

  const at = (px: number) => {
    const raw = ((px - (c.x - trackW / 2)) / trackW) * 100;
    const v = Math.round(Math.max(0, Math.min(100, raw)) / step) * step;
    if (v !== get()) { set(v); paint(); }
  };
  let held = false;
  c.on("pointerdown", (p: Phaser.Input.Pointer) => { held = true; dragging++; at(p.worldX); });
  c.on("pointermove", (p: Phaser.Input.Pointer) => { if (held) at(p.worldX); });
  const release = () => {
    if (!held) return;
    held = false;
    dragging = Math.max(0, dragging - 1);
    sfx.play(scene, "ui_click");
    opts.onRelease?.();
  };
  scene.input.on("pointerup", release);
  c.once(Phaser.GameObjects.Events.DESTROY, () => {
    scene.input.off("pointerup", release);
    if (held) dragging = Math.max(0, dragging - 1);
  });
  return c;
}

export const sliderHeight = () => Math.round(72 * Math.min(textScale(), 1.25));

/** `onClick` có thể dựng lại cả trang và huỷ nút này, nên kiểm `txt.scene` trước khi đổi nhãn. */
export function toggle(
  scene: Phaser.Scene, x: number, y: number, text: string,
  get: () => string, onClick: () => void, width = 300, hint?: string, plated = false,
) {
  let txt: Phaser.GameObjects.Text;
  const c = button(scene, x, y, `${text}:  ${get()}`, () => {
    onClick();
    if (txt.scene) { txt.setText(`${text}:  ${get()}`); c.getData("fit")?.(); }
  }, { width, hint, plated });
  txt = c.list.find((o) => o instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text;
  return c;
}

/** Bộ nút kiểu biển hiệu tôn dùng cho sảnh. */
export const platedKit = {
  button: (scene: Phaser.Scene, x: number, y: number, text: string, onClick: () => void, opts: ButtonOpts = {}) =>
    button(scene, x, y, text, onClick, { ...opts, plated: true }),
  panel: (scene: Phaser.Scene, x: number, y: number, w: number, h: number, fill?: number, alpha?: number) =>
    panel(scene, x, y, w, h, fill, alpha, true),
  slider: (scene: Phaser.Scene, x: number, y: number, text: string,
    get: () => number, set: (v: number) => void, opts: SliderOpts = {}) =>
    slider(scene, x, y, text, get, set, { ...opts, plated: true }),
  toggle: (scene: Phaser.Scene, x: number, y: number, text: string,
    get: () => string, onClick: () => void, width?: number, hint?: string) =>
    toggle(scene, x, y, text, get, onClick, width, hint, true),
};

/** Khay phẳng tối đặt nền cho các nút 3D; tâm tại (x, y). */
export function tray(scene: Phaser.Scene, x: number, y: number, w: number, h: number, r = 22, alpha = 0.62) {
  const g = scene.add.graphics();
  g.fillStyle(0x2a2018, alpha).fillRoundedRect(x - w / 2, y - h / 2, w, h, r);
  g.lineStyle(2, 0xf7f1e2, 0.2).strokeRoundedRect(x - w / 2 + 1, y - h / 2 + 1, w - 2, h - 2, r - 1);
  return g;
}

/** Biển kính phẳng cho số liệu chỉ để xem (không bấm được). */
export function glass(scene: Phaser.Scene, x: number, y: number, w: number, h: number, r = 12) {
  const g = scene.add.graphics();
  g.fillStyle(0x2a2018, 0.55).fillRoundedRect(x - w / 2, y - h / 2, w, h, r);
  g.lineStyle(1.5, 0xf7f1e2, 0.28).strokeRoundedRect(x - w / 2 + 0.75, y - h / 2 + 0.75, w - 1.5, h - 1.5, r);
  return g;
}

/** Ô lõm: chứa thứ kéo-thả hoặc ô nhập; tâm tại (x, y). */
export function well(scene: Phaser.Scene, x: number, y: number, w: number, h: number, r = 10) {
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 0.7).fillRoundedRect(x - w / 2, y - h / 2 + 2, w, h, r);
  g.fillStyle(0xcfc6ae, 1).fillRoundedRect(x - w / 2, y - h / 2, w, h, r);
  g.fillStyle(0x8d8570, 0.45).fillRoundedRect(x - w / 2 + 1, y - h / 2, w - 2, Math.min(5, h / 3), { tl: r, tr: r, bl: 2, br: 2 });
  return g;
}

export type IconButton = Phaser.GameObjects.Container & {
  icon: Phaser.GameObjects.Graphics;
  /** Đặt ảnh làm icon, cao `h`, hạ theo trạng thái nhấn như `.icon`. */
  setIconImage: (key: string, h: number) => void;
};

/**
 * Nút 3D nhỏ có chỗ vẽ icon: vẽ vào `.icon` với toạ độ (0, 0) là tâm mặt nút;
 * `.icon` tự hạ theo trạng thái nhấn.
 */
export function iconButton(
  scene: Phaser.Scene, x: number, y: number, w: number, h: number, onClick: () => void,
  opts: { primary?: boolean } = {},
): IconButton {
  const tone = opts.primary ? CLAY.red : CLAY.cream;
  const c = scene.add.container(x, y) as IconButton;
  const face = clayImage(scene, clayButton(scene, tone, w, h, "up"), 0, 0, w, h);
  const icon = scene.add.graphics();
  c.icon = icon;
  c.add([face, icon]);
  c.setSize(w, h);
  let img: Phaser.GameObjects.Image | null = null;
  const paint = (st: ClayState) => {
    face.setTexture(clayButton(scene, tone, w, h, st));
    icon.setY(clayFaceDy(st));
    img?.setY(clayFaceDy(st));
  };
  c.setIconImage = (key, ih) => {
    img?.destroy();
    img = scene.add.image(0, clayFaceDy("up"), key);
    img.setScale(ih / img.height);
    c.add(img);
  };
  paint("up");
  c.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
  let pressed = false;
  c.on("pointerover", () => { paint("hover"); scene.input.setDefaultCursor("pointer"); });
  c.on("pointerout", () => { pressed = false; paint("up"); scene.input.setDefaultCursor("default"); });
  c.on("pointerdown", () => { pressed = true; paint("down"); });
  c.on("pointerup", () => {
    scene.input.setDefaultCursor("default");
    paint("up");
    if (!pressed) return;
    pressed = false;
    sfx.play(scene, "ui_click");
    onClick();
  });
  return c;
}
