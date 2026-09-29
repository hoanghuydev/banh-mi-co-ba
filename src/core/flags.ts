/**
 * Cờ — P0-01 §2.2: cờ trợ năng (CANON §15), cờ dev-build, cờ build playtest.
 * KHÔNG chứa state chơi.
 */
import { platform } from "./platform";

declare const __DEV_TOOLS__: boolean;
declare const __PLAYTEST__: boolean;
declare const __BUILD_ID__: string;

/**
 * Chỉ có ở dev build. Mọi code overlay nằm sau `if (DEV_TOOLS)` → tree-shake sạch
 * khỏi bản phát hành (P0-03 §2.2). KHÔNG BAO GIỜ có chế độ hiện certainty trong
 * bản bán ra — một thanh số làm người chơi ngừng nhìn mặt người (vi phạm T5).
 */
export const DEV_TOOLS: boolean = typeof __DEV_TOOLS__ !== "undefined" ? __DEV_TOOLS__ : false;
/** Build gửi người lạ chơi thử cho cổng P1 (P0-03 §2.4): tự pause ở `perception:confirmed`. */
export const PLAYTEST: boolean = typeof __PLAYTEST__ !== "undefined" ? __PLAYTEST__ : false;
export const BUILD_ID: string = typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "dev";

export type Settings = {
  /** CANON §15.1: 4 mức cỡ chữ. */
  textScale: 1 | 1.25 | 1.5 | 2;
  /** CANON §15.3: tắt xe chạy qua, lá bay, rung màn hình. */
  reducedMotion: boolean;
  /**
   * CANON §15.2: khách vẫn bỏ đi vì bạn làm SAI, không bao giờ vì bạn CHẬM.
   * P0-02 §2.2: kiên nhẫn không tụt, `MADE_THEM_WAIT` tắt, đồng hồ chậm một nửa.
   */
  noTimePressure: boolean;
  /**
   * CANON §15.4: bus "Nhạc", 0–100. Mặc định 55 theo P5-03 §2.1.
   * Bốn bus còn lại (đường phố / giọng NPC / thao tác / âm báo) thêm vào đây
   * khi có âm thanh cho chúng — mỗi bus một công tắc riêng, không gộp.
   */
  musicVolume: number;
  /**
   * P0-03 §2.1: telemetry CỤC BỘ, không gửi đi đâu. `null` = chưa hỏi.
   * Dev/playtest mặc định bật; bản bán ra mặc định tắt và hỏi rõ một lần.
   */
  telemetry: boolean | null;
};

export const DEFAULT_SETTINGS: Settings = {
  textScale: 1,
  reducedMotion: false,
  noTimePressure: false,
  musicVolume: 55,
  telemetry: DEV_TOOLS || PLAYTEST ? true : null,
};

/** Cài đặt sống độc lập với save: đổi ở menu là có hiệu lực ngay, kể cả chưa có ván nào. */
const SKEY = "banhmicoba.settings.v1";

export function loadSettings(): Settings {
  const raw = platform.read(SKEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    const s = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as Settings;
    if (PLAYTEST) s.telemetry = true;
    return s;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings) {
  platform.write(SKEY, JSON.stringify(s));
}

/** Truy cập nhanh cho các hệ cần đọc cờ mà không cầm `GameContext`. */
export const flags = {
  get a11y(): Settings { return loadSettings(); },
};
