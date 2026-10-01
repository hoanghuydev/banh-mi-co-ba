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

/**
 * Tám hướng — thêm bốn hướng CHÉO cho ai có đủ tám bộ hình (hiện là mỗi người chơi,
 * xem `art/photo.ts`). Ai chỉ có hình bốn hướng thì cứ dùng `facingOf` như cũ:
 * gộp hướng chéo về hình nghiêng là người đi chéo lại quay ngang, nhìn ra ngay.
 */
export type Facing8 = Facing | "se" | "sw" | "ne" | "nw";

/**
 * Tám hướng trên MÀN HÌNH, chia đều 45° một nấc.
 *
 * Tám nấc này khớp ĐÚNG tám tổ hợp phím của `entities/Player.move`: bấm D ra "e",
 * bấm S+D ra "se". Cố ý tính trên lưới iso (chưa nhân tỉ lệ 2:1 của phép chiếu) —
 * nhân vào thì phím chéo rơi vào nấc 26,6° và người chơi bấm S+D lại thấy nhân vật
 * quay gần như ngang hẳn.
 */
const RING = ["w", "nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;

export function facingOf8(wdx: number, wdy: number): Facing8 {
  const ssx = wdx - wdy, ssy = wdx + wdy;
  // atan2 trả về −π..π; chia 45° rồi làm tròn ra −4..4, cộng 4 thành chỉ số của RING.
  return RING[Math.round(Math.atan2(ssy, ssx) / (Math.PI / 4)) + 4];
}
