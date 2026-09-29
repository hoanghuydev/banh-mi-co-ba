/**
 * Đồng hồ trong game. CANON P0: "đo được một ngày = bao nhiêu phút thật".
 *
 * Một buổi bán kéo dài 05:30 → 10:30 giờ trong game = 300 phút game.
 * `scale` = số phút GAME trôi qua trong 1 giây THẬT.
 *   scale = 1  ->  một buổi bán = 300 giây = 5 phút thật   (giá trị hiện dùng)
 * Cao điểm 6h30–8h (CANON §13.3) rơi vào phút thật thứ 1:00 → 2:30 của buổi.
 */
export const DAY_START_MIN = 5 * 60 + 30;
export const DAY_END_MIN = 10 * 60 + 30;
export const PEAK_START_MIN = 6 * 60 + 30;
export const PEAK_END_MIN = 8 * 60;

export class Clock {
  /** Phút trong ngày, tính từ 00:00. */
  minutes = DAY_START_MIN;
  /** Bao nhiêu phút game trôi qua trong 1 giây thật. Xem chú thích ở đầu file. */
  scale = 1;
  paused = false;

  /** dtMs lấy thẳng từ vòng update của Phaser. */
  tick(dtMs: number) {
    if (this.paused) return;
    this.minutes = Math.min(DAY_END_MIN, this.minutes + (dtMs / 1000) * this.scale);
  }

  get isOver() {
    return this.minutes >= DAY_END_MIN;
  }

  get isPeak() {
    return this.minutes >= PEAK_START_MIN && this.minutes < PEAK_END_MIN;
  }

  /** 0 → 1 xuyên suốt buổi bán, dùng để nội suy ánh sáng. */
  get progress() {
    return (this.minutes - DAY_START_MIN) / (DAY_END_MIN - DAY_START_MIN);
  }

  format() {
    const m = Math.floor(this.minutes);
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  }
}
