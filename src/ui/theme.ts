import Phaser from "phaser";
import { loadSettings } from "../core/save";
import { sfx } from "../audio/sfx";
import { MIN_FONT, MIN_TOUCH, designFor, fitScale, isTouch } from "../core/device";
import { ZOOM } from "../world/camera";
import { CLAY, clayButton, clayFaceDy, clayImage, type ClayState } from "./clay";

export const FONT = '"Be Vietnam Pro", ui-sans-serif, "Segoe UI", system-ui, sans-serif';
/** Chữ viết tay trên bảng trong cảnh; tự host ở `public/fonts`. */
export const HAND_FONT = `"Pangolin", ${FONT}`;

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

export type ButtonOpts = {
  width?: number;
  primary?: boolean;
  disabled?: boolean;
  hint?: string;
  /** Trần phóng chữ, dùng chung cho chữ và hộp để chữ không tràn khỏi nút. */
  maxScale?: number;
};

export function button(
  scene: Phaser.Scene, x: number, y: number, text: string,
  onClick: () => void, opts: ButtonOpts = {},
) {
  const w = opts.width ?? 260;
  const cap = opts.maxScale ?? 1.5;
  const h = opts.hint ? hintedButtonHeight(cap) : platedButtonHeight(cap);
  const c = scene.add.container(x, y);
  // label() nhân cỡ chữ với textScale — chia ngược lại để chữ nút theo đúng trần `cap`.
  const ts = textScale(), k = Math.min(ts, cap) / ts;

  const tone = opts.disabled ? CLAY.grey : opts.primary ? CLAY.red : CLAY.cream;
  const face = clayImage(scene, clayButton(scene, tone, w, h, "up"), 0, 0, w, h);
  const txt = label(scene, 0, opts.hint ? -Math.round(h * 0.16) : 0, text, 16 * k,
    opts.primary ? "#ffffff" : UI.ink, "700");
  const hint = opts.hint ? label(scene, 0, Math.round(h * 0.26), opts.hint, 11 * k, opts.primary ? "#ffe3dc" : UI.muted, "500") : null;
  const hi = opts.primary || opts.disabled;
  txt.setShadow(0, hi ? 2 : 1, hi ? tone.lip : "#ffffff", 0, false, true);
  if (opts.disabled) txt.setColor("#f4f4f4");

  const paint = (hover: boolean, down = false) => {
    const st: ClayState = down ? "down" : hover ? "hover" : "up";
    face.setTexture(clayButton(scene, tone, w, h, st));
    const dy = clayFaceDy(st);
    txt.setY((hint ? -Math.round(h * 0.2) : 0) + dy);
    hint?.setY(Math.round(h * 0.2) + dy);
  };
  const fit = () => {
    const room = w - 56;
    for (const t of [txt, hint]) t?.setScale(Math.min(1, room / Math.max(1, t.width)));
  };
  fit();
  c.setData("fit", fit);
  paint(false);

  c.add([face, txt, ...(hint ? [hint] : [])]);
  c.setSize(w, h);
  
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

/** Bộ nút kiểu biển hiệu tôn dùng cho sảnh. */
export const platedKit = {
  button: (scene: Phaser.Scene, x: number, y: number, text: string, onClick: () => void, opts: ButtonOpts = {}) =>
    button(scene, x, y, text, onClick, opts),
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
