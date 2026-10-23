import Phaser from "phaser";
import { loadSettings } from "../core/save";
import { sfx } from "../audio/sfx";

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
    const h = buttonHeight();
    o.setY(this.y + h / 2);
    this.y += h + gap;
    return o;
  }
  skip(dy: number) { this.y += dy; }
}

export function buttonHeight(maxScale = 1.5) {
  return Math.round(46 * Math.min(textScale(), maxScale));
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
    fontSize: `${Math.round(size * textScale())}px`,
    fontStyle: weight,
    color,
    lineSpacing: Math.round(size * 0.5),
  }).setOrigin(0.5);
}

export function panel(
  scene: Phaser.Scene, x: number, y: number, w: number, h: number,
  fill: number = UI.paper, alpha = 1,
) {
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
};

export function button(
  scene: Phaser.Scene, x: number, y: number, text: string,
  onClick: () => void, opts: ButtonOpts = {},
) {
  const w = opts.width ?? 260;
  const cap = opts.maxScale ?? 1.5;
  const h = buttonHeight(cap);
  const c = scene.add.container(x, y);
  // label() nhân cỡ chữ với textScale — chia ngược lại để chữ nút theo đúng trần `cap`.
  const ts = textScale(), k = Math.min(ts, cap) / ts;

  const bg = scene.add.graphics();
  const txt = label(scene, 0, opts.hint ? -Math.round(h * 0.16) : 0, text, 16 * k,
    opts.primary ? "#ffffff" : UI.ink, opts.primary ? "700" : "500");
  const hint = opts.hint ? label(scene, 0, Math.round(h * 0.26), opts.hint, 11 * k, opts.primary ? "#ffd9d2" : UI.muted, "400") : null;

  const paint = (hover: boolean) => {
    bg.clear();
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
  paint(false);

  c.add([bg, txt, ...(hint ? [hint] : [])]);
  c.setSize(w, h);
  c.setAlpha(opts.disabled ? 0.55 : 1);

  if (!opts.disabled) {
    // Phaser cộng displayOrigin vào toạ độ local của Container nên hit area tính từ (0,0).
    c.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    // Đòi nhấn xuống trên chính nút, để kéo–thả nhả tay trúng nút không bấm nhầm.
    let pressed = false;
    c.on("pointerover", () => { paint(true); scene.input.setDefaultCursor("pointer"); });
    c.on("pointerout", () => { pressed = false; paint(false); scene.input.setDefaultCursor("default"); });
    c.on("pointerdown", () => { pressed = true; });
    c.on("pointerup", () => {
      scene.input.setDefaultCursor("default");
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

export type SliderOpts = { width?: number; hint?: string; step?: number; onRelease?: () => void };

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
    bg.fillStyle(0x0d1216, 0.18);
    bg.fillRoundedRect(-w / 2 + 1, -h / 2 + 4, w, h, 12);
    bg.fillStyle(UI.paper, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.lineStyle(1.5, UI.line, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.fillStyle(UI.line, 1);
    bg.fillRoundedRect(-trackW / 2, trackY - 3, trackW, 6, 3);
    bg.fillStyle(UI.accent, 1);
    bg.fillRoundedRect(-trackW / 2, trackY - 3, (trackW * v) / 100, 6, 3);
    bg.fillStyle(UI.accent, 1);
    bg.fillCircle(-trackW / 2 + (trackW * v) / 100, trackY, 9);
    bg.fillStyle(0xffffff, 1);
    bg.fillCircle(-trackW / 2 + (trackW * v) / 100, trackY, 4);
  };
  paint();

  c.add([bg, name, val, ...(hint ? [hint] : [])]);
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
  get: () => string, onClick: () => void, width = 300, hint?: string,
) {
  let txt: Phaser.GameObjects.Text;
  const c = button(scene, x, y, `${text}:  ${get()}`, () => {
    onClick();
    if (txt.scene) txt.setText(`${text}:  ${get()}`);
  }, { width, hint });
  txt = c.list.find((o) => o instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text;
  return c;
}
