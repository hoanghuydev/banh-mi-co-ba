/**
 * CHỖ ĐẶT THẺ TRÒ CHUYỆN — toán thuần, KHÔNG Phaser.
 *
 * Tách ra vì cái bug ở đây là bug người chơi NHÌN THẤY ("nó nhảy lên trên rồi mới nhảy
 * xuống") nhưng chỉ kiểm được bằng số: thẻ bị vẽ lại mỗi nhịp, và giữa hai nhịp thì
 * CHIỀU CAO đổi — câu đáp dài ngắn khác nhau, số lựa chọn khác nhau.
 */

/** Chừa mép khung nhìn — thẻ không bao giờ dính vào cạnh màn hình. */
export const CARD_EDGE = 10;
/** Cách người nói bao nhiêu px theo chiều ngang. */
export const CARD_ANCHOR_GAP = 56;
/** Mép TRÊN của thẻ nằm cao hơn điểm neo ngần này — thẻ dài thêm XUỐNG, không lên. */
export const CARD_TOP_ABOVE_HEAD = 24;

export type CardSpot = { cx: number; top: number };

/**
 * @param locked chỗ đã chốt của cuộc đang mở, `null` = nhịp đầu
 * @param anchor chỗ người nói trên màn hình; vắng = không có sân khấu (headless)
 *
 * HAI LUẬT, và cả hai đều là chỗ bản đầu sai:
 *
 *  1. **Neo bằng MÉP TRÊN, không bằng tâm.** Neo bằng tâm thì chiều cao đổi một cái là
 *     cả mép trên lẫn mép dưới cùng xê dịch. Mắt người đang đọc từ trên xuống, nên cái
 *     mỏ neo phải là chỗ họ đang nhìn.
 *  2. **Chốt chỗ rồi thì ĐI MỘT CHIỀU.** Chỉ neo mép trên vẫn chưa đủ: nhịp dày chạm mép
 *     dưới màn hình thì cú kẹp đẩy thẻ LÊN, rồi nhịp sau mỏng lại nó RƠI XUỐNG — đúng
 *     cái người chơi thấy. Nên thẻ được phép trồi lên khi cần thêm chỗ, và không bao giờ
 *     tụt lại.
 */
export function placeTalkCard(
  locked: CardSpot | null,
  anchor: { x: number; y: number } | undefined,
  card: { w: number; h: number },
  screen: { w: number; h: number },
  gap = CARD_ANCHOR_GAP,
): CardSpot {
  const { w, h } = card;
  const fit = (top: number) => Math.max(CARD_EDGE, Math.min(screen.h - CARD_EDGE - h, top));
  const fitX = (cx: number) => Math.max(w / 2 + CARD_EDGE, Math.min(screen.w - w / 2 - CARD_EDGE, cx));

  if (locked) return { cx: locked.cx, top: Math.min(locked.top, fit(locked.top)) };
  if (!anchor) return { cx: fitX(w / 2 + CARD_EDGE), top: fit(screen.h - CARD_EDGE - h) };

  // Bên nào còn chỗ thì đặt bên đó — người đứng sát mép trái thì thẻ phải nhảy sang phải.
  const right = anchor.x + gap + w / 2;
  const left = anchor.x - gap - w / 2;
  const cx = right + w / 2 <= screen.w - CARD_EDGE ? right
    : left - w / 2 >= CARD_EDGE ? left
      : screen.w / 2;
  return { cx: fitX(cx), top: fit(anchor.y - CARD_TOP_ABOVE_HEAD) };
}
