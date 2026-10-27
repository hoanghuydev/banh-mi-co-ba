// Toán thuần, không Phaser, để test headless được.

export type Box = { x0: number; y0: number; x1: number; y1: number };

export const overlaps = (a: Box, b: Box) =>
  a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

export const BUBBLE_EDGE = 6;
/** Đỉnh đầu cách mép bong bóng ít nhất chừng này, để dạt ngang hay kẹp vào khung vẫn che đầu và đuôi còn chỗ. */
export const TAIL_INSET = 24;

/** Đỉnh đầu người nói; mép dưới bong bóng nằm ở `y`. */
export type BubbleAsk = { x: number; y: number; w: number; h: number };

/**
 * Tâm ngang bong bóng: trên đầu, dạt trong tầm còn che đầu để vào khung hoặc né `keepOut`; người nói ra khỏi khung thì đi theo.
 * Bong bóng của người khác được phép đè nhau.
 */
export function bubbleX(
  { x, y, w, h }: BubbleAsk,
  view: { left: number; right: number },
  keepOut: readonly Box[] = [],
): number {
  const reach = w / 2 - TAIL_INSET;
  const lo = view.left + BUBBLE_EDGE + w / 2, hi = view.right - BUBBLE_EDGE - w / 2;
  const at = (side: number) => {
    const inView = lo > hi ? x + side * reach : Math.min(Math.max(x + side * reach, lo), hi);
    return Math.min(Math.max(inView, x - reach), x + reach);
  };
  for (const side of [0, -1, 1]) {
    const cx = at(side);
    const box = { x0: cx - w / 2, x1: cx + w / 2, y0: y - h, y1: y };
    if (!keepOut.some((k) => overlaps(box, k))) return cx;
  }
  return at(0);
}
