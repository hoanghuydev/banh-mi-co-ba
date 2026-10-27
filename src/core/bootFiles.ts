/** File menu cần trước khi hiện; `BootScene` tải, service worker precache khi cài (`vite.config.ts`). */
export const BACKDROP_FILE = "art/sanh_bg.webp";
/** Sảnh không có `preload` riêng mà nút nào cũng kêu. */
export const BOOT_SFX_BUS = "amBao";
/** `DayScene` thường trực và điện thoại (gọi từ HTML) không có `preload` riêng. */
export const BOOT_SFX = ["sfx_cua_cuon", "sfx_tien_le", "sfx_ngan_keo"] as const;
