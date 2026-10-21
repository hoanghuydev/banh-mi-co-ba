/** Phép chiếu isometric: lưới ô vuông thế giới → lưới hình thoi 2:1 trên màn hình. */
export const TW = 60;                 // bề rộng 1 ô trên màn hình
export const TH = 30;                 // bề cao 1 ô (= TW/2 -> góc 2:1 kinh điển)

export function toScreen(wx: number, wy: number) {
  return { sx: (wx - wy) * (TW / 2), sy: (wx + wy) * (TH / 2) };
}

/** Thứ tự vẽ: cái ở "xa" (tổng x+y nhỏ) vẽ trước. */
export function depthOf(wx: number, wy: number) {
  return Math.round((wx + wy) * 1000);
}

/** Hướng suy từ vận tốc màn hình để khớp phím vừa bấm. */
export type Facing = "s" | "n" | "e" | "w";

export function facingOf(wdx: number, wdy: number): Facing {
  const ssx = wdx - wdy, ssy = wdx + wdy;
  return Math.abs(ssy) >= Math.abs(ssx) ? (ssy > 0 ? "s" : "n") : (ssx > 0 ? "e" : "w");
}

/** Đừng dùng `facingOf` bốn hướng cho người đang đi: hướng chéo sẽ bị vẽ bằng tấm thẳng, lệch 63°. */
export type Facing8 = Facing | "se" | "sw" | "ne" | "nw";

/** Chia đều 45° trên lưới iso chưa nhân tỉ lệ 2:1, để khớp đúng tám tổ hợp phím của `Player.move`. */
const RING = ["w", "nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;

export function facingOf8(wdx: number, wdy: number): Facing8 {
  const ssx = wdx - wdy, ssy = wdx + wdy;
  // atan2 trả về −π..π; chia 45° rồi làm tròn ra −4..4, cộng 4 thành chỉ số của RING.
  return RING[Math.round(Math.atan2(ssy, ssx) / (Math.PI / 4)) + 4];
}
