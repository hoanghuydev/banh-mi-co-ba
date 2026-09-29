import Phaser from "phaser";
import { loadSettings } from "../core/save";

/**
 * Bộ UI tối thiểu dùng chung cho menu + HUD.
 * CANON §15: font sans, line-height rộng (tiếng Việt chồng dấu: ề ộ ỡ ữ),
 * KHÔNG viết hoa toàn bộ, hộp thoại nền ĐỤC (không trong suốt).
 */
export const FONT = '"Be Vietnam Pro", ui-sans-serif, "Segoe UI", system-ui, sans-serif';

export const UI = {
  ink: "#222a31",
  inkNum: 0x222a31,      // cùng màu với `ink`, dùng cho Graphics (cần số, không nhận chuỗi)
  paper: 0xf3f0e7,
  paperCss: "#f3f0e7",
  muted: "#6a7680",
  line: 0xc9c3b4,
  accent: 0xc0392b,
  accentCss: "#c0392b",
  good: "#3f7d5a",
  goodCss: "#3f7d5a",
} as const;

/**
 * Xếp từ trên xuống theo CHIỀU CAO ĐO ĐƯỢC của từng thứ — không đặt toạ độ cố định.
 * Toạ độ cố định chỉ đúng ở cỡ chữ 100%; ở 150–200% chữ tự chồng lên nhau (CANON §15.1:
 * hộp phải TỰ GIÃN theo chữ).
 */
export class Stack {
  y: number;
  constructor(top: number, private gap = 12) { this.y = top; }
  /** Đặt một object có origin (0.5, 0.5) ngay dưới thứ trước đó. */
  place<T extends Phaser.GameObjects.Components.Transform & { height: number; displayHeight?: number }>(o: T, gap = this.gap): T {
    const h = (o as any).displayHeight ?? o.height;
    o.setY(this.y + h / 2);
    this.y += h + gap;
    return o;
  }
  /** Chừa một khoảng cho nút (nút là Container, chiều cao = `buttonHeight()`). */
  button<T extends Phaser.GameObjects.Components.Transform>(o: T, gap = this.gap): T {
    const h = buttonHeight();
    o.setY(this.y + h / 2);
    this.y += h + gap;
    return o;
  }
  skip(dy: number) { this.y += dy; }
}

/** Chiều cao nút theo cỡ chữ — mọi layout xếp nút theo đúng con số này, không đoán. */
export function buttonHeight(maxScale = 1.5) {
  return Math.round(46 * Math.min(textScale(), maxScale));
}

/** Cỡ chữ người chơi chọn ở Cài đặt (CANON §15.1: 4 mức). */
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

/** Hộp nền đục bo góc. Dùng Graphics chứ không dùng ảnh 9-slice để còn đổi size thoải mái. */
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
  /**
   * Trần phóng chữ của nút (mặc định 1,5 — bằng trần chiều cao nút). Chữ và hộp phải cùng
   * một trần, không thì ở 200% chữ tràn khỏi nút và đè lên dòng gợi ý. Nút nằm trong một
   * khung cố định (bảng kẹp nhân) được chặn thấp hơn.
   */
  maxScale?: number;
};

/**
 * Nút: container gồm nền + chữ. Có trạng thái hover/disabled rõ ràng —
 * phản hồi điều khiển quan trọng hơn trang trí.
 */
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
    // Container: Phaser cộng displayOrigin (w/2, h/2) vào toạ độ local trước khi
    // gọi Contains, nên hit area phải tính từ (0,0) — để (-w/2,-h/2) thì vùng bấm
    // lệch đúng nửa nút sang trái/lên trên.
    c.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    // Chỉ bấm khi nhấn XUỐNG và nhả RA trên cùng nút này. Không thì một cú kéo–thả nhả tay
    // trúng nút (vd. thả miếng nhân lên nút preset) sẽ bấm luôn nút đó.
    let pressed = false;
    c.on("pointerover", () => { paint(true); scene.input.setDefaultCursor("pointer"); });
    c.on("pointerout", () => { pressed = false; paint(false); scene.input.setDefaultCursor("default"); });
    c.on("pointerdown", () => { pressed = true; });
    c.on("pointerup", () => {
      scene.input.setDefaultCursor("default");
      if (!pressed) return;
      pressed = false;
      onClick();
    });
  }
  return c;
}

/**
 * Nút gạt cho Cài đặt: bấm -> đổi state -> tự cập nhật nhãn.
 *
 * `onClick` được phép dựng lại cả trang (đổi cỡ chữ thì bắt buộc phải thế), và khi đó
 * chính cái nút này đã bị huỷ — nên phải kiểm tra trước khi đụng vào nhãn,
 * không thì Phaser ném lỗi "drawImage of null" trên Text đã destroy.
 */
export function toggle(
  scene: Phaser.Scene, x: number, y: number, text: string,
  get: () => string, onClick: () => void, width = 300,
) {
  let txt: Phaser.GameObjects.Text;
  const c = button(scene, x, y, `${text}:  ${get()}`, () => {
    onClick();
    if (txt.scene) txt.setText(`${text}:  ${get()}`);
  }, { width });
  txt = c.list.find((o) => o instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text;
  return c;
}
