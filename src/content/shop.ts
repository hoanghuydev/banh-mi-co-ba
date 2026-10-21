export const GAME_TITLE = "Bye Sếp, Em Bán Bánh Mì";

/** Nhân vật chính và tên quán. Khớp `newGame()` ở `core/save.ts`. */
export const DEFAULT_PLAYER_NAME = "Phương Anh";
export const DEFAULT_SHOP_NAME = `Bánh Mì ${DEFAULT_PLAYER_NAME}`;

/** Bảng hiệu rộng 156 px thiết kế; dài hơn thì `art/sign.ts` tự thu chữ. */
export const NAME_MAX = 14;

/** NFC để `slice` không cắt giữa chữ và dấu; bỏ ký tự điều khiển vì tên đi lên Phaser.Text. */
export function cleanName(raw: string): string {
  return raw
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, NAME_MAX)
    .trim();
}

/** Tên quán trên bảng hiệu và bảng menu — viết hoa như chữ sơn trên tôn. */
export function shopName(name: string): string {
  return `BÁNH MÌ ${(cleanName(name) || DEFAULT_PLAYER_NAME).toUpperCase()}`;
}
