// Chấm điểm chọn chuyện kiểu Zubek: score = Σ (A(hiện tại) − A(sau khi nói)), A(x) = K/x; chỉ chọn chuyện, không chọn chỗ đi.
import type { Personality } from "../content/npcs";
import type { DriveId, PracticeId } from "../content/vocab";
import { DRIVE_IDS } from "../content/vocab";

export type DriveLevels = Record<DriveId, number>;

export const newDrives = (): DriveLevels => ({
  DUOC_PHUC_VU: 0, KE_CHUYEN: 0, DUOC_HOI: 0, PHAN_NAN: 0, YEN_THAN: 0, VIEC_RIENG: 0,
});

// Gom một object để `tools/tune-drives.ts` quét; mã chạy thật không ghi vào đây.
export const DRIVE_TUNE = {
  // Chỉ đổi lựa chọn qua mốc tuyệt đối `TALK_SCORE_FLOOR`; dưới 1000 thì sàn đó thành mã chết.
  K: 1000,
  // Chặn chia-cho-0 khi `cur = 100 − mức` về 0, gần như không bao giờ ăn.
  FLOOR: 8,
  // Điểm/phút game trôi về mức nền; ở 2 thì một cuộc kể (~48 điểm) kéo ~24 phút, đủ hết một lượt ghé.
  DECAY_PER_MIN: 2,
  // Phạt âm lên `DUOC_PHUC_VU` cho tán gẫu lúc chờ; 6 là mức duy nhất giữ thứ tự đợi bánh < gọi món < xếp hàng (`tools/probe-tangau.ts`).
  CHO_PHIEN: 6,
};

export const ATT_K = DRIVE_TUNE.K;
export const ATT_FLOOR = DRIVE_TUNE.FLOOR;

export const attenuate = (x: number) => DRIVE_TUNE.K / Math.max(DRIVE_TUNE.FLOOR, Math.min(100, x));

export function baseDrives(p: Personality): DriveLevels {
  return {
    DUOC_PHUC_VU: 10 + 35 * p.nongTinh,
    KE_CHUYEN: 10 + 45 * p.thanThien,
    DUOC_HOI: 8 + 40 * p.thanThien,
    PHAN_NAN: 5 + 35 * p.soi,
    YEN_THAN: 10 + 35 * (1 - p.thanThien),
    VIEC_RIENG: 12,
  };
}

// Trôi về mức nền chứ không về 0.
export const DRIVE_DECAY_PER_MIN = DRIVE_TUNE.DECAY_PER_MIN;

export function decayDrives(d: DriveLevels, base: DriveLevels, minutes: number) {
  const step = DRIVE_TUNE.DECAY_PER_MIN * minutes;
  for (const k of DRIVE_IDS) {
    const b = base[k];
    d[k] = d[k] > b ? Math.max(b, d[k] - step) : Math.min(b, d[k] + step);
  }
}

export const bump = (d: DriveLevels, k: DriveId, by: number) => {
  d[k] = Math.max(0, Math.min(100, d[k] + by));
};

// Mức sàn khung cảnh đẩy drive lên.
export const PRACTICE_PUSH: Record<PracticeId, Partial<DriveLevels>> = {
  DI_NGANG:  { VIEC_RIENG: 55, YEN_THAN: 30 },
  XEP_HANG:  { DUOC_PHUC_VU: 45 },
  GOI_MON:   { DUOC_PHUC_VU: 70 },
  DOI_BANH:  { DUOC_PHUC_VU: 85 },
  NAN_LAI:   { KE_CHUYEN: 25, DUOC_HOI: 25 },
  QUAY_VANG: { KE_CHUYEN: 20, DUOC_HOI: 20 },
  NGHE_LOM:  { YEN_THAN: 60 },
};

export function drivesNow(base: DriveLevels, live: DriveLevels, practice: PracticeId): DriveLevels {
  const push = PRACTICE_PUSH[practice];
  const out = { ...live };
  for (const k of DRIVE_IDS) {
    const p = push[k];
    if (p !== undefined) out[k] = Math.max(out[k], p);
  }
  void base;
  return out;
}

// Dương = được thoả.
export type Satisfies = Partial<Record<DriveId, number>>;

// Trả điểm thô; người gọi nhân tiếp `salience`.
export function scoreSatisfies(
  sat: Satisfies, now: DriveLevels, tune: Partial<Record<DriveId, number>> = {},
): number {
  let sum = 0;
  for (const k of DRIVE_IDS) {
    const drop = sat[k];
    if (!drop) continue;
    // Đổi thang "đang muốn" sang thang "đã thoả" của Zubek, không thì mọi dấu lộn ngược.
    const cur = 100 - now[k];
    const fut = Math.max(0, Math.min(100, cur + drop));
    sum += (attenuate(cur) - attenuate(fut)) * (tune[k] ?? 1);
  }
  return sum;
}

// Rút có trọng số trong top-N cho đỡ máy móc; nhỏ hơn thì lặp chuyện, lớn hơn thì cuộc tệ cũng có cửa.
export const TOP_N = 3;

export function pickWeighted<T>(
  list: readonly { item: T; score: number }[], roll: number, n = TOP_N,
): T | null {
  if (!list.length) return null;
  const top = [...list].sort((a, b) => b.score - a.score).slice(0, n);
  // Điểm âm hết vẫn phải chọn một; im lặng là việc của `talkUnavailable`.
  const lo = Math.min(0, ...top.map((x) => x.score));
  const total = top.reduce((a, x) => a + (x.score - lo) + 0.001, 0);
  let r = roll * total;
  for (const x of top) if ((r -= (x.score - lo) + 0.001) < 0) return x.item;
  return top[top.length - 1].item;
}
