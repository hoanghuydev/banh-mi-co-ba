/**
 * Đặt dấu "việc cần làm" lên màn hình — TOÁN THUẦN, không đụng Phaser.
 *
 * Tách ra khỏi scene vì chính chỗ này đã sai hai lần liên tiếp theo hai kiểu khác nhau,
 * mà cả hai lần đều chỉ lòi ra khi chơi thật: trong scene thì nó chỉ chạy được bằng mắt,
 * còn ở đây thì quét được cả ngàn vị trí trong một cái test.
 *
 * ── Luật, đúng ba dòng ───────────────────────────────────────────────────────
 *  1. Cái việc CÒN TRONG KHUNG  → dấu nằm ĐÚNG TRÊN cái việc, chỉ kẹp vào trong lề cho
 *     khỏi bị cắt và khỏi chui sau dải icon ở đỉnh màn hình. Kẹp TỪNG TRỤC RIÊNG: trục
 *     nào còn chỗ thì tuyệt đối không nhúc nhích.
 *  2. Cái việc RA NGOÀI KHUNG → vẫn đúng một phép kẹp ấy, nên dấu nằm ở mép, ĐÚNG hàng
 *     và ĐÚNG cột thật của cái việc. Trạm ở hướng nào thì dấu ở đúng phía ấy; đi một
 *     bước thì dấu bò theo một bước, không bao giờ nhảy.
 *  3. Không có mũi tên. Cái cần nói là "có việc ở đằng kia", mà một cái chấm than ghim
 *     lệch hẳn về một phía đã nói đủ.
 *
 * MỘT phép kẹp cho cả hai trường hợp — đó là chỗ sửa lần này. Bản trước dùng hai phép
 * khác nhau (kẹp khi còn thấy, chiếu theo tia khi đã khuất) và chúng lệch nhau tới 90 px
 * ngay tại chỗ giao, nặng nhất ở mép trên, tức đúng chỗ cái lò đứng.
 *
 * `pinned` chỉ còn là một cái NHÃN ("việc này đang ngoài khung") để chỗ gọi vẽ nhỏ lại,
 * không còn tham gia vào việc tính toạ độ nữa.
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

  // KẸP TỪNG TRỤC, một luật duy nhất cho cả hai trường hợp.
  //
  // Bản trước có hai nhánh: còn thấy thì kẹp từng trục, khuất thì chiếu dọc tia nối tâm
  // vùng vẽ tới cái việc. Hai phép đó KHÔNG khớp nhau ở chỗ giao: đo được tới 90 px
  // nhảy trong một frame, và lệch nhất ở MÉP TRÊN (lề trên 58 px so với 19 px ba mép
  // kia) — đúng nơi cái lò đứng, vì hàng trạm nằm ở hàng trên cùng bản đồ. Người chơi
  // thấy dấu chấm than trượt ngang khỏi cái lò đúng lúc cái lò chạm mép.
  //
  // Chỉ kẹp thì liên tục theo đúng định nghĩa, và KHÔNG mất gì: cái việc nằm lệch trái
  // và hơi cao thì dấu ghim ở mép trái, ĐÚNG ĐỘ CAO THẬT của nó — nói "đằng kia" rõ hơn
  // hẳn phép chiếu, vì phép chiếu kéo mọi thứ dồn về phía đường tâm.
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
