// Toán thuần, không Phaser, để test headless được.

export type Box = { x0: number; y0: number; x1: number; y1: number };

export const overlaps = (a: Box, b: Box) =>
  a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

export const BUBBLE_GAP = 6;
export const BUBBLE_EDGE = 6;
/** Số tầng chồng tối đa trên đầu một người. */
export const BUBBLE_LEVELS = 3;
/** Đỉnh đầu cách mép bong bóng ít nhất chừng này, để dạt ngang hay kẹp vào khung vẫn che đầu và đuôi còn chỗ. */
export const TAIL_INSET = 24;

export type BubbleAsk = {
  /** Đỉnh đầu người nói; mép dưới bong bóng nằm ở `y` khi không phải né. */
  x: number; y: number;
  w: number; h: number;
  /** Chỗ frame trước, tính theo đầu. */
  prev?: Slot | null;
};
/** `side` -1…1 là phần của tầm dạt ngang; `level` là số tầng nâng lên. */
export type Slot = { side: number; level: number };

const SIDES = [0, -0.5, 0.5, -1, 1];
/** Hết chỗ sạch: chỗ mới phải đỡ chồng ít nhất 40% mới bỏ chỗ cũ. */
const STAY_RATIO = 0.6;

/**
 * Chỉ dạt ngang trong tầm còn che đỉnh đầu, rồi mới nâng lên; người nói ra khỏi khung thì bong bóng đi theo.
 * `asks` xếp theo thứ tự nói trước, người nói trước giữ chỗ tốt nhất.
 */
export function stackBubbles(
  asks: readonly BubbleAsk[],
  view: { left: number; right: number; top: number },
  keepOut: readonly Box[] = [],
): (Slot & { x: number; y: number })[] {
  const placed: Box[] = [];
  return asks.map(({ x, y, w, h, prev }) => {
    const reach = w / 2 - TAIL_INSET;
    const lo = view.left + BUBBLE_EDGE + w / 2, hi = view.right - BUBBLE_EDGE - w / 2;
    const spot = (s: Slot) => {
      const inView = lo > hi ? x + s.side * reach : Math.min(Math.max(x + s.side * reach, lo), hi);
      const cx = Math.min(Math.max(inView, x - reach), x + reach);
      const cy = y - s.level * (h + BUBBLE_GAP);
      const box: Box = { x0: cx - w / 2, x1: cx + w / 2, y0: cy - h, y1: cy };
      let bad = 0;
      for (const o of placed) if (overlaps(box, o)) bad += area(box, o);
      // Che vòng lò nặng gấp đôi chồng bong bóng.
      for (const k of keepOut) if (overlaps(box, k)) bad += area(box, k) * 2;
      // Nâng tầng mà lòi khỏi mép trên thì cũng mất chữ như bị che.
      if (s.level > 0 && box.y0 < view.top) bad += (view.top - box.y0) * w;
      return { ...s, x: cx, y: cy, box, bad };
    };
    const tries: Slot[] = [{ side: 0, level: 0 }];
    if (prev) tries.push(prev);
    for (let level = 0; level < BUBBLE_LEVELS; level++) {
      for (const side of SIDES) tries.push({ side, level });
      // Chỗ vừa khít sát mép từng bong bóng đã đặt, nếu còn trong tầm dạt.
      for (const o of placed) for (const cx of [o.x0 - BUBBLE_GAP - w / 2, o.x1 + BUBBLE_GAP + w / 2]) {
        const side = (cx - x) / reach;
        if (Math.abs(side) <= 1) tries.push({ side, level });
      }
    }
    // Về chỗ gốc khi trống, không thì giữ chỗ cũ còn sạch; hết chỗ sạch thì chỉ rời chỗ cũ khi đỡ chồng hẳn, khỏi giật mỗi frame.
    let best: ReturnType<typeof spot> | null = null;
    for (const t of tries) {
      const c = spot(t);
      if (c.bad === 0) { best = c; break; }
      if (!best || c.bad < best.bad) best = c;
    }
    if (best!.bad > 0 && prev) {
      const stay = spot(prev);
      if (best!.bad > stay.bad * STAY_RATIO) best = stay;
    }
    placed.push(best!.box);
    return { side: best!.side, level: best!.level, x: best!.x, y: best!.y };
  });
}

const area = (a: Box, b: Box) =>
  (Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * (Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
