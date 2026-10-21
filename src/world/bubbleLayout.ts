// Toán thuần, không Phaser, để test headless được.

export type Box = { x0: number; y0: number; x1: number; y1: number };

export const overlaps = (a: Box, b: Box) =>
  a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

export const BUBBLE_GAP = 6;
export const BUBBLE_EDGE = 6;

/** Hệ số giảm điểm xấu cho chỗ frame trước để bong bóng khỏi nhảy; 0 thì dính cứng vĩnh viễn. */
export const BUBBLE_STICKY = 0.45;

/** Mỗi chỗ thử phải kẹp vào khung trước rồi mới tính điểm, không thì cú kẹp đẩy về đúng chỗ vừa tránh. */
export function pickBubbleSpot(
  centre: { x: number; y: number },
  size: { w: number; h: number },
  view: { left: number; right: number; top: number; bottom: number },
  taken: readonly Box[],
  keepOut: readonly Box[] = [],
  /** Độ lệch so với `centre` của chỗ frame trước. */
  prev?: { dx: number; dy: number } | null,
): { x: number; y: number } {
  const { w, h } = size;
  const clamp = (cx: number, cy: number) => ({
    x: Math.min(Math.max(cx, view.left + BUBBLE_EDGE + w / 2), view.right - BUBBLE_EDGE - w / 2),
    y: Math.min(Math.max(cy, view.top + BUBBLE_EDGE + h / 2), view.bottom - BUBBLE_EDGE - h / 2),
  });
  const lift = h + BUBBLE_GAP;
  // Cần nấc xuống vì sát mép trên thì mọi nấc cao bị kẹp về cùng một chỗ.
  const tries: { dx: number; dy: number; sticky?: boolean }[] = [
    { dx: 0, dy: 0 }, { dx: 0, dy: -lift }, { dx: 0, dy: -lift * 2 }, { dx: 0, dy: lift },
    { dx: w * 0.7, dy: -lift * 0.5 }, { dx: -w * 0.7, dy: -lift * 0.5 },
    { dx: 0, dy: lift * 2 },
  ];
  // Chỗ cũ lên đầu: vòng lặp dừng ở chỗ sạch đầu tiên.
  if (prev && (prev.dx !== 0 || prev.dy !== 0)) tries.unshift({ dx: prev.dx, dy: prev.dy, sticky: true });
  let best = { x: centre.x, y: centre.y, bad: Infinity };
  for (const t of tries) {
    const c = clamp(centre.x + t.dx, centre.y + t.dy);
    const cand: Box = { x0: c.x - w / 2, x1: c.x + w / 2, y0: c.y - h / 2, y1: c.y + h / 2 };
    const area = (o: Box) => (Math.min(cand.x1, o.x1) - Math.max(cand.x0, o.x0))
                           * (Math.min(cand.y1, o.y1) - Math.max(cand.y0, o.y0));
    let bad = 0;
    for (const o of taken) if (overlaps(cand, o)) bad += area(o);
    // Che chỗ người chơi cần nhìn (vòng lò) nặng gấp đôi chồng bong bóng.
    for (const k of keepOut) if (overlaps(cand, k)) bad += area(k) * 2;
    if (t.sticky) bad *= BUBBLE_STICKY;
    if (bad < best.bad) best = { x: c.x, y: c.y, bad };
    if (bad === 0) break;
  }
  return { x: best.x, y: best.y };
}
