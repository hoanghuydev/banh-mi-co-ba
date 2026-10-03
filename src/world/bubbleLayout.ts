/**
 * BỐ CỤC BONG BÓNG THOẠI — toán thuần, KHÔNG Phaser.
 *
 * Tách khỏi `entities/CustomerActor.ts` vì một lý do rất cụ thể: cái bug ở đây là bug
 * THỨ TỰ (né chồng lấn trước hay kẹp vào mép khung nhìn trước), và thứ tự thì kiểm bằng
 * số chứ không cần dựng một cảnh Phaser. File kia `import Phaser`, nên test headless
 * (`npm test`) không nạp nổi nó.
 */

export type Box = { x0: number; y0: number; x1: number; y1: number };

export const overlaps = (a: Box, b: Box) =>
  a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/** Khe hở tối thiểu giữa hai bong bóng đã né nhau. */
export const BUBBLE_GAP = 6;
/** Chừa mép khung nhìn — bong bóng không bao giờ dính vào cạnh màn hình. */
export const BUBBLE_EDGE = 6;

/**
 * ƯU ÁI CHỖ ĐANG ĐỨNG — hệ số nhân vào điểm xấu của chỗ bong bóng đang ở.
 *
 * Vì sao cần: `keepOut` là ĐỘNG. Nó gồm "trạm người chơi đang đứng cạnh", mà người chơi
 * thì bước dọc quầy; gồm cái lò "khi trong lò có ổ" và cái thớt "khi còn ổ dở" — hai
 * thứ bật tắt giữa chừng một câu nói. Mỗi lần danh sách đó đổi, vòng thử ở dưới lại
 * chọn ra một chỗ sạch KHÁC và bong bóng NHẢY sang đó ngay trong frame kế. Đứng ở quầy
 * nói chuyện thì nó nhảy liên tục — người chơi báo "hội thoại bay lung tung hết".
 *
 * Nên chỗ cũ được tính rẻ đi: nó chỉ thua khi chỗ mới tốt hơn HẲN, không phải khi tốt
 * hơn một chút. Cộng với cú nội suy bên `CustomerActor`, bong bóng đứng yên gần như
 * suốt, và lúc phải dời thì nó TRƯỢT sang chứ không nhảy.
 *
 * 0,45 chứ không 0: bằng 0 là dính cứng vĩnh viễn — che mất cái vòng độ giòn lúc ổ sắp
 * cháy thì không chỗ nào gỡ được nữa, mà đó đúng là thứ `keepOut` sinh ra để tránh.
 */
export const BUBBLE_STICKY = 0.45;

/**
 * CHỌN CHỖ ĐẶT MỘT BONG BÓNG — hàm THUẦN, để test được mà không cần Phaser.
 *
 * Thứ tự là chỗ bản cũ sai: nó né chồng lấn xong MỚI kẹp vào mép khung nhìn, nên ở quầy
 * — nơi bong bóng hay chạm mép trên — cú kẹp đẩy ngược cái vừa được nâng lên xuống lại,
 * đúng vào cái nó vừa tránh. Ở đây mỗi chỗ thử đều KẸP TRƯỚC rồi mới tính điểm xấu.
 *
 * Trả về tâm bong bóng. Không chỗ nào sạch thì trả chỗ xấu ÍT NHẤT — thà lệch một chút
 * còn hơn đè khít lên nhau.
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
   * Nấc XUỐNG phải có, và đây đúng là chỗ bản cũ không có đường ra: lúc bong bóng đã
   * chạm mép TRÊN khung nhìn thì "nâng lên" không còn nghĩa gì — mọi nấc cao đều bị kẹp
   * về cùng một chỗ, và nó nằm đè lên cái bong bóng nó đang tránh. Ở quầy thì chạm mép
   * trên là chuyện thường. Xuống dưới che mất thân người một lúc, nhưng thà vậy còn hơn
   * hai khối chữ chồng khít lên nhau.
   *
   * Lệch NGANG để cuối: nó làm bong bóng rời khỏi cột của chủ nó rõ hơn là lệch dọc, mà
   * "ai vừa nói câu đó" là thông tin không được mất.
   */
  const tries: { dx: number; dy: number; sticky?: boolean }[] = [
    { dx: 0, dy: 0 }, { dx: 0, dy: -lift }, { dx: 0, dy: -lift * 2 }, { dx: 0, dy: lift },
    { dx: w * 0.7, dy: -lift * 0.5 }, { dx: -w * 0.7, dy: -lift * 0.5 },
    { dx: 0, dy: lift * 2 },
  ];
  /*
   * Chỗ cũ xếp ĐẦU HÀNG, trước cả "đúng chỗ".
   *
   * Thứ tự ở đây có nghĩa: vòng lặp `break` ngay khi gặp chỗ đầu tiên sạch hoàn toàn.
   * Nên để chỗ cũ lên đầu là nói "còn sạch thì đừng đụng vào" — chính là cái chặn đứng
   * việc bong bóng nhảy mỗi lần `keepOut` đổi. Bỏ qua khi chỗ cũ TRÙNG "đúng chỗ"
   * (lệch 0,0): thêm một bản sao vào đầu hàng thì chỉ tốn một vòng, không đổi kết quả.
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
