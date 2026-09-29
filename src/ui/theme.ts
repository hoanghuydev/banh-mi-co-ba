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
  const h = Math.round(46 * Math.min(textScale(), 1.5));
  const c = scene.add.container(x, y);

  const bg = scene.add.graphics();
  const txt = label(scene, 0, opts.hint ? -7 : 0, text, 16,
    opts.primary ? "#ffffff" : UI.ink, opts.primary ? "700" : "500");
  const hint = opts.hint ? label(scene, 0, 12, opts.hint, 11, opts.primary ? "#ffd9d2" : UI.muted, "400") : null;

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
    c.on("pointerover", () => { paint(true); scene.input.setDefaultCursor("pointer"); });
    c.on("pointerout", () => { paint(false); scene.input.setDefaultCursor("default"); });
    c.on("pointerup", () => { scene.input.setDefaultCursor("default"); onClick(); });
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
