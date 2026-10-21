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
   * CANON §15.4 — NĂM bus, NĂM công tắc riêng, 0–100. Mặc định theo P5-03 §2.1.
   *
   * Cố ý KHÔNG gộp thành một thanh "âm lượng": năm thứ này làm năm việc khác hẳn
   * nhau với người chơi. Có người tắt sạch nhạc mà vẫn cần tiếng thao tác để biết
   * tay mình vừa làm gì; có người ngược lại. Một thanh chung thì cả hai cùng thua.
   */
  musicVolume: number;
  /** Bus `duongPho` — ambience hẻm, xe máy, còi, mưa, chó, chim, tiếng rao. */
  streetVolume: number;
  /** Bus `giongNPC` — tiếng người. Mặc định 100 và trần 0 dB: không gì đè lên giọng. */
  voiceVolume: number;
  /** Bus `thaoTac` — dao, vỏ bánh, gói giấy, tiền lẻ, bánh rớt. */
  foleyVolume: number;
  /** Bus `amBao` — click, chốt đơn, autosave, chuyển ngày. */
  uiVolume: number;
  /**
   * CANON §15 công tắc số 5 / P5-03 §2.1 — sub-mix `crowdSubMix`, NẰM TRONG `duongPho`.
   * Tách riêng vì người ADHD / tự kỷ thường bị chính lớp GIỌNG NÓI nền làm quá tải,
   * chứ không phải tiếng xe. Kéo cái này về 0 vẫn còn hẻm, chỉ bớt người.
   */
  crowdVolume: number;
  /**
   * CANON §15 / P5-03 §5.5 — tắt âm "chấm điểm người chơi".
   *
   * Ranh giới một dòng: *âm mô tả thế giới thì giữ; âm chấm điểm người chơi thì bỏ.*
   * Nên nó TẮT tiếng buzz "sai rồi" và tiếng hụt khi âm tiền, nhưng KHÔNG tắt tiếng
   * bánh rớt, tiếng khét, tiếng ruồi — với người nhìn không rõ, đó là cách duy nhất
   * biết chuyện vừa xảy ra.
   */
  disableNegativeAudioCues: boolean;
  /**
   * P5-03 §5.4 — tick gỗ trung tính khi có người để ý tới bạn. Mặc định TẮT.
   * Cho người không đọc được nét mặt ở 72px. Cùng một âm cho chuyện tốt và xấu:
   * nó là THÔNG TIN, không phải PHÁN XÉT. Độc lập với `disableNegativeAudioCues`.
   */
  a11yPerceptionPing: boolean;
  /** P5-03 §2.4 — gộp hết về giữa. Cho người điếc một tai hoặc nghe bằng một bên. */
  monoAudio: boolean;
  /**
   * P0-03 §2.1: telemetry CỤC BỘ, không gửi đi đâu. `null` = chưa hỏi.
   * Dev/playtest mặc định bật; bản bán ra mặc định tắt và hỏi rõ một lần.
   */
  telemetry: boolean | null;
  /**
   * P3-03 §4 luật UI #4 — công tắc trợ năng "hiện tổng khi đang chọn". TẮT thì đi chợ không
   * có tổng chạy, người chơi phải nhẩm, tổng chỉ hiện ở bước xác nhận. BẬT thì chân trang
   * hiện tổng giỏ ngay lúc đang bấm +/−. Dù bật hay tắt, con số vẫn là dữ liệu thô: tổng
   * và tiền trong ống, không gợi ý, không "còn mua được mấy ổ nữa".
   */
  marketRunningTotal: boolean;
  /** Mũi tên trên đầu người chơi (`entities/Player.ts`) — nhân vật duy nhất không có bảng tên. Mặc định BẬT. */
  playerMarker: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  textScale: 1,
  reducedMotion: false,
  noTimePressure: false,
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
  marketRunningTotal: true,
  playerMarker: true,
};

/** Cài đặt sống độc lập với save: đổi ở menu là có hiệu lực ngay, kể cả chưa có ván nào. */
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

/** Truy cập nhanh cho các hệ cần đọc cờ mà không cầm `GameContext`. */
export const flags = {
  get a11y(): Settings { return loadSettings(); },
};
