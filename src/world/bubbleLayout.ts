/**
 * BỐ CỤC BONG BÓNG THOẠI — toán thuần, KHÔNG Phaser. Tách khỏi `CustomerActor` vì bug ở đây là bug
 * THỨ TỰ (né chồng lấn trước hay kẹp mép khung trước), kiểm bằng số được; file kia `import Phaser`
 * nên test headless không nạp nổi.
 */

export type Box = { x0: number; y0: number; x1: number; y1: number };

export const overlaps = (a: Box, b: Box) =>
  a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/** Khe hở tối thiểu giữa hai bong bóng đã né nhau. */
export const BUBBLE_GAP = 6;
/** Chừa mép khung nhìn — bong bóng không bao giờ dính vào cạnh màn hình. */
export const BUBBLE_EDGE = 6;

/**
 * ƯU ÁI CHỖ ĐANG ĐỨNG — `keepOut` là ĐỘNG (trạm người chơi đứng cạnh, lò khi có ổ, thớt khi còn ổ
 * dở), nên mỗi lần nó đổi là vòng thử chọn ra chỗ sạch KHÁC và bong bóng nhảy ngay frame kế.
 *
 * Chỗ cũ tính rẻ đi nên chỉ thua khi chỗ mới tốt hơn HẲN. ⚠️ 0,45 chứ không 0 — bằng 0 là dính
 * cứng vĩnh viễn, che mất vòng độ giòn lúc ổ sắp cháy thì không chỗ nào gỡ được.
 */
export const BUBBLE_STICKY = 0.45;

/**
 * Hàm THUẦN, để test được mà không cần Phaser.
 *
 * ⚠️ Mỗi chỗ thử đều KẸP TRƯỚC rồi mới tính điểm xấu: né chồng lấn xong mới kẹp thì cú kẹp đẩy
 * ngược cái vừa được nâng lên xuống lại, đúng vào cái nó vừa tránh.
 */
export function pickBubbleSpot(
  centre: { x: number; y: number },
  size: { w: number; h: number },
  view: { left: number; right: number; top: number; bottom: number },
  taken: readonly Box[],
  keepOut: readonly Box[] = [],
  /** Chỗ frame trước, tính theo ĐỘ LỆCH so với `centre`. Có thì nó được thử TRƯỚC và tính rẻ đi. */
  prev?: { dx: number; dy: number } | null,
): { x: number; y: number } {
  const { w, h } = size;
  const clamp = (cx: number, cy: number) => ({
    x: Math.min(Math.max(cx, view.left + BUBBLE_EDGE + w / 2), view.right - BUBBLE_EDGE - w / 2),
    y: Math.min(Math.max(cy, view.top + BUBBLE_EDGE + h / 2), view.bottom - BUBBLE_EDGE - h / 2),
  });
  const lift = h + BUBBLE_GAP;
  /*
   * Đúng chỗ · cao một nấc · cao hai nấc · THẤP một nấc · lệch phải · lệch trái.
   *
   * ⚠️ Nấc XUỐNG phải có: chạm mép TRÊN khung nhìn thì mọi nấc cao đều bị kẹp về cùng một chỗ, và
   * nó nằm đè lên cái bong bóng nó đang tránh. Lệch NGANG để cuối — nó làm bong bóng rời khỏi cột
   * của chủ nó rõ hơn lệch dọc.
   */
  const tries: { dx: number; dy: number; sticky?: boolean }[] = [
    { dx: 0, dy: 0 }, { dx: 0, dy: -lift }, { dx: 0, dy: -lift * 2 }, { dx: 0, dy: lift },
    { dx: w * 0.7, dy: -lift * 0.5 }, { dx: -w * 0.7, dy: -lift * 0.5 },
    { dx: 0, dy: lift * 2 },
  ];
  /*
   * Chỗ cũ xếp ĐẦU HÀNG, trước cả "đúng chỗ": vòng lặp `break` ngay khi gặp chỗ sạch đầu tiên, nên
   * để nó lên đầu là nói "còn sạch thì đừng đụng vào".
   */
  if (prev && (prev.dx !== 0 || prev.dy !== 0)) tries.unshift({ dx: prev.dx, dy: prev.dy, sticky: true });
  let best = { x: centre.x, y: centre.y, bad: Infinity };
  for (const t of tries) {
    const c = clamp(centre.x + t.dx, centre.y + t.dy);
    const cand: Box = { x0: c.x - w / 2, x1: c.x + w / 2, y0: c.y - h / 2, y1: c.y + h / 2 };
    const area = (o: Box) => (Math.min(cand.x1, o.x1) - Math.max(cand.x0, o.x0))
                           * (Math.min(cand.y1, o.y1) - Math.max(cand.y0, o.y0));
    let bad = 0;
    for (const o of taken) if (overlaps(cand, o)) bad += area(o);
    // Đè lên chỗ người chơi đang cần nhìn tính NẶNG GẤP ĐÔI đè lên bong bóng khác: hai
    // bong bóng chồng nhau thì đọc chậm, còn che mất cái vòng lò thì cháy bánh.
    for (const k of keepOut) if (overlaps(cand, k)) bad += area(k) * 2;
    if (t.sticky) bad *= BUBBLE_STICKY;
    if (bad < best.bad) best = { x: c.x, y: c.y, bad };
    if (bad === 0) break;
  }
  return { x: best.x, y: best.y };
}
