/**
 * Đặt dấu "việc cần làm" lên màn hình — TOÁN THUẦN, không đụng Phaser. Tách khỏi scene vì chỗ này
 * đã sai hai lần theo hai kiểu, và cả hai lần chỉ lòi ra khi chơi thật.
 *
 * Ba luật: việc CÒN TRONG KHUNG → dấu ĐÚNG TRÊN nó, chỉ kẹp cho khỏi bị cắt, và kẹp TỪNG TRỤC
 * RIÊNG · việc RA NGOÀI KHUNG → vẫn đúng phép kẹp ấy, nên dấu ở mép ĐÚNG hàng ĐÚNG cột · không có
 * mũi tên.
 *
 * ⚠️ MỘT phép kẹp cho cả hai trường hợp. Hai phép khác nhau (kẹp khi còn thấy, chiếu theo tia khi
 * đã khuất) lệch nhau tới 90 px ngay tại chỗ giao, nặng nhất ở mép trên — đúng chỗ cái lò đứng.
 */

/** Khung nhìn, toạ độ thế giới. Trùng khớp `Phaser.Geom.Rectangle` ở mấy field này. */
export type ViewRect = { left: number; right: number; top: number; bottom: number };

export type ChorePin = {
  x: number;
  y: number;
  /** Cái việc đã ra khỏi khung — chỗ gọi vẽ nhỏ lại để phân biệt "ở đây" với "ngoài kia". */
  pinned: boolean;
};

export type PinOpts = {
  /** Lề trái / phải / dưới: nửa bề ngang dấu + khoảng hở mép. */
  edge: number;
  /** Lề TRÊN, rộng hơn vì còn phải né dải icon ở đỉnh màn hình. */
  top: number;
};

/**
 * `anchorX`/`anchorY` là chỗ muốn đặt dấu (đã cộng phần nhô lên trên cái việc).
 * Trả về chỗ vẽ thật.
 */
export function chorePin(anchorX: number, anchorY: number, v: ViewRect, o: PinOpts): ChorePin {
  const x0 = v.left + o.edge, x1 = v.right - o.edge;
  const y0 = v.top + o.top, y1 = v.bottom - o.edge;

  // Khung quá hẹp để chứa nổi hai lề (cỡ chữ 200% trên màn hình thấp, hoặc `worldView`
  // trả số lạ đúng một frame lúc đổi cỡ cửa sổ): về giữa khung. Phải xét TRƯỚC mọi thứ —
  // để sau thì nhánh kẹp chạy với `lo > hi` và trả ra toạ độ nằm ngoài khung, nghĩa là
  // mọi dấu biến mất mà không để lại dấu vết nào để lần.
  if (x1 <= x0 || y1 <= y0) {
    return { x: (v.left + v.right) / 2, y: (v.top + v.bottom) / 2, pinned: true };
  }

  // KẸP TỪNG TRỤC, một luật duy nhất cho cả hai trường hợp — xem khối đầu file.
  //
  // Chỉ kẹp thì liên tục theo đúng định nghĩa, và không mất gì: việc nằm lệch trái và hơi cao thì
  // dấu ghim ở mép trái ĐÚNG ĐỘ CAO THẬT, nói "đằng kia" rõ hơn hẳn phép chiếu (phép chiếu kéo mọi
  // thứ dồn về đường tâm).
  const x = clamp(anchorX, x0, x1);
  const y = clamp(anchorY, y0, y1);
  // `pinned` đo trên KHUNG THẬT, không trừ lề — nó chỉ để chỗ gọi vẽ nhỏ lại, phân biệt
  // "việc ở ngay đây" với "việc ở ngoài kia". Trừ lề ở đây là lỗi của lần sửa trước nữa.
  const outside = anchorX <= v.left || anchorX >= v.right || anchorY <= v.top || anchorY >= v.bottom;
  return { x, y, pinned: outside };
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}
