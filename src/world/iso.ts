/**
 * Phép chiếu isometric — chỉ toán, không biết gì về Phaser hay về bản đồ.
 * Thế giới là lưới ô vuông; màn hình là lưới hình thoi tỉ lệ 2:1.
 */
export const TW = 60;                 // bề rộng 1 ô trên màn hình
export const TH = 30;                 // bề cao 1 ô (= TW/2 -> góc 2:1 kinh điển)

export function toScreen(wx: number, wy: number) {
  return { sx: (wx - wy) * (TW / 2), sy: (wx + wy) * (TH / 2) };
}

/** Thứ tự vẽ: cái ở "xa" (tổng x+y nhỏ) vẽ trước. */
export function depthOf(wx: number, wy: number) {
  return Math.round((wx + wy) * 1000);
}

/**
 * Hướng nhìn suy từ vận tốc MÀN HÌNH, nên luôn khớp với phím vừa bấm
 * (bấm D thì nhân vật quay sang phải màn hình, không quay theo trục thế giới).
 */
export type Facing = "s" | "n" | "e" | "w";

export function facingOf(wdx: number, wdy: number): Facing {
  const ssx = wdx - wdy, ssy = wdx + wdy;
  return Math.abs(ssy) >= Math.abs(ssx) ? (ssy > 0 ? "s" : "n") : (ssx > 0 ? "e" : "w");
}
