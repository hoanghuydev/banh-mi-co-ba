/**
 * Save — CANON §2: localStorage, autosave sau MỖI KHÁCH (không phải mỗi ngày).
 * v1 mới có khung; phần khách sẽ gọi `saveGame()` ở chỗ autosave sau này.
 */
const KEY = "banhmicoba.save.v1";

export type Settings = {
  /** CANON §15.1: 4 mức cỡ chữ. */
  textScale: 1 | 1.25 | 1.5 | 2;
  /** CANON §15.3: tắt xe chạy qua, lá bay, rung màn hình. */
  reducedMotion: boolean;
  /** CANON §15.2: khách vẫn bỏ đi vì bạn làm SAI, không bao giờ vì bạn CHẬM. */
  noTimePressure: boolean;
  /**
   * CANON §15.4: bus "Nhạc", 0–100. Mặc định 55 theo P5-03 §2.1.
   * Bốn bus còn lại (đường phố / giọng NPC / thao tác / âm báo) thêm vào đây
   * khi có âm thanh cho chúng — mỗi bus một công tắc riêng, không gộp.
   */
  musicVolume: number;
};

/**
 * Phần nhớ về từng khách, sống xuyên suốt cả mùa.
 * CANON §3.2: `REMEMBERED_USUAL` là sự kiện tích cực nặng nhất (salience 90) —
 * nó chỉ có nghĩa nếu "mọi bữa" thật sự giống nhau qua nhiều ngày.
 */
export type NpcMemory = {
  visits: number;
  freebies: number;
  /**
   * Số lần người chơi THẬT SỰ nghe khách đọc nguyên đơn ruột của họ.
   * Không phải số lần ghé: khách có thể ghé ba lần mà hai lần chỉ nói "như mọi bữa",
   * lúc đó người chơi mới nghe đúng một lần và chưa thể nhớ nổi.
   */
  heard: number;
};

export type SaveData = {
  version: 1;
  /** Seed của cả mùa — mọi ngày suy ra từ đây (CANON §8e). */
  seed: number;
  /** Mùa có 40 ngày rồi kết thúc (trụ cột T4). */
  day: number;
  playerName: string;
  money: number;
  /** Khoá là id NPC. Xem `NpcMemory`. */
  npcMemory: Record<string, NpcMemory>;
  settings: Settings;
  savedAt: number;
};

export const DEFAULT_SETTINGS: Settings = {
  textScale: 1,
  reducedMotion: false,
  noTimePressure: false,
  musicVolume: 55,
};

export function newGame(name: string, seed = (Math.random() * 0xffffffff) >>> 0): SaveData {
  return {
    version: 1,
    seed,
    day: 1,
    playerName: name || "Cháu cô Ba",
    money: 150_000,
    npcMemory: {},
    settings: { ...DEFAULT_SETTINGS, ...loadSettings() },
    savedAt: Date.now(),
  };
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== 1) return null;
    data.settings = { ...DEFAULT_SETTINGS, ...data.settings };
    data.npcMemory ??= {};
    for (const m of Object.values(data.npcMemory)) m.heard ??= 0;
    return data;
  } catch {
    return null;
  }
}

export function saveGame(data: SaveData) {
  data.savedAt = Date.now();
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* hết quota / chế độ riêng tư — không được làm sập game vì chuyện này */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch { /* bỏ qua */ }
}

/** Cài đặt sống độc lập với save: đổi ở menu là có hiệu lực ngay, kể cả chưa có ván nào. */
const SKEY = "banhmicoba.settings.v1";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SKEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(SKEY, JSON.stringify(s));
  } catch { /* bỏ qua */ }
}
