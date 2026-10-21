/** Toạ độ thế giới, khớp field của `Phaser.Geom.Rectangle`. */
export type ViewRect = { left: number; right: number; top: number; bottom: number };

export type ChorePin = {
  x: number;
  y: number;
  /** Việc đã ra khỏi khung, chỗ gọi vẽ nhỏ lại. */
  pinned: boolean;
};

export type PinOpts = {
  /** Lề trái / phải / dưới: nửa bề ngang dấu + khoảng hở mép. */
  edge: number;
  /** Lề trên, rộng hơn để né dải icon ở đỉnh màn hình. */
  top: number;
};

/** `anchorX`/`anchorY` đã cộng phần nhô lên trên cái việc. */
export function chorePin(anchorX: number, anchorY: number, v: ViewRect, o: PinOpts): ChorePin {
  const x0 = v.left + o.edge, x1 = v.right - o.edge;
  const y0 = v.top + o.top, y1 = v.bottom - o.edge;

  // Khung hẹp hơn hai lề thì phải xét trước, không thì kẹp với `lo > hi` ra toạ độ ngoài khung.
  if (x1 <= x0 || y1 <= y0) {
    return { x: (v.left + v.right) / 2, y: (v.top + v.bottom) / 2, pinned: true };
  }

  // Kẹp từng trục cho cả trong lẫn ngoài khung; tách phép chiếu riêng cho lúc khuất thì lệch tới 90 px ở chỗ giao.
  const x = clamp(anchorX, x0, x1);
  const y = clamp(anchorY, y0, y1);
  // Đo trên khung thật, không trừ lề.
  const outside = anchorX <= v.left || anchorX >= v.right || anchorY <= v.top || anchorY >= v.bottom;
  return { x, y, pinned: outside };
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}
