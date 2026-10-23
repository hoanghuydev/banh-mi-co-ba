import { platform } from "./platform";

declare const __DEV_TOOLS__: boolean;
declare const __PLAYTEST__: boolean;
declare const __BUILD_ID__: string;
declare const __BUILD_TIME__: string;

/** Code overlay nằm sau `if (DEV_TOOLS)` để tree-shake sạch khỏi bản phát hành. */
export const DEV_TOOLS: boolean = typeof __DEV_TOOLS__ !== "undefined" ? __DEV_TOOLS__ : false;
/** Build chơi thử: tự pause ở `perception:confirmed`. */
export const PLAYTEST: boolean = typeof __PLAYTEST__ !== "undefined" ? __PLAYTEST__ : false;
export const BUILD_ID: string = typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "dev";
export const BUILD_TIME: string = typeof __BUILD_TIME__ !== "undefined" ? __BUILD_TIME__ : "dev";

export type Settings = {
  textScale: 1 | 1.25 | 1.5 | 2;
  /** Tắt xe chạy qua, lá bay, rung màn hình. */
  reducedMotion: boolean;
  /** Kiên nhẫn không tụt, `MADE_THEM_WAIT` tắt, đồng hồ chậm một nửa — khách chỉ bỏ đi vì làm sai. */
  noTimePressure: boolean;
  /** Âm lượng 0–100. Tổng nhân vào mọi kênh; mỗi kênh vẫn chỉnh riêng được. */
  masterVolume: number;
  musicVolume: number;
  /** Bus `duongPho`. */
  streetVolume: number;
  /** Bus `giongNPC`. */
  voiceVolume: number;
  /** Bus `thaoTac`. */
  foleyVolume: number;
  /** Bus `amBao`. */
  uiVolume: number;
  /** Sub-mix giọng người nền nằm trong `duongPho`, tách riêng vì hay gây quá tải cho người ADHD/tự kỷ. */
  crowdVolume: number;
  /** Tắt âm chấm điểm (buzz sai, hụt tiền), giữ âm mô tả thế giới (bánh rớt, khét, ruồi). */
  disableNegativeAudioCues: boolean;
  /** Tick trung tính khi có người để ý tới bạn, cùng một âm cho chuyện tốt và xấu. */
  a11yPerceptionPing: boolean;
  monoAudio: boolean;
  /** Telemetry cục bộ, không gửi đi; `null` = chưa hỏi. */
  telemetry: boolean | null;
  /** Mũi tên trên đầu người chơi — nhân vật duy nhất không có bảng tên. */
  playerMarker: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  textScale: 1,
  reducedMotion: false,
  noTimePressure: false,
  masterVolume: 100,
  musicVolume: 55,
  streetVolume: 70,
  voiceVolume: 100,
  foleyVolume: 85,
  uiVolume: 80,
  crowdVolume: 60,
  disableNegativeAudioCues: false,
  a11yPerceptionPing: false,
  monoAudio: false,
  telemetry: DEV_TOOLS || PLAYTEST ? true : null,
  playerMarker: true,
};

/** Cài đặt sống độc lập với save. */
const SKEY = "byesep.settings.v1";

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

export const flags = {
  get a11y(): Settings { return loadSettings(); },
};
