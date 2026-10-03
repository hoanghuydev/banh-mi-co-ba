/**
 * DRIVE và CHẤM ĐIỂM CHỌN CHUYỆN. Mô hình Robert Zubek, *Needs-Based AI* — dạng (c), tổng độ
 * chênh có suy giảm:
 *
 *   score = Σ_drive ( A(mức hiện tại) − A(mức sau khi nói) ),   A(x) = K / x
 *
 * Dạng (c) chứ không (a)/(b) vì nó phân biệt được hai chuyện mà hai dạng kia không: kéo một drive
 * đang rất thiếu thì ăn nhiều hơn hẳn kéo một drive đã gần đủ, và làm cho một drive TỆ ĐI thì ra
 * điểm ÂM nên tự rơi xuống đáy mà không cần luật cấm nào.
 *
 * Ba lỗi cũ tự biến mất dưới hệ này, không cần ba nhánh `if`: "spam mời khách" (người đang vội có
 * `YEN_THAN` + `VIEC_RIENG` cao nên mọi cuộc mời điểm gần 0) · "đang bán mà bị bắt chuyện rất
 * phiền" (đợi bánh ⇒ `DUOC_PHUC_VU` áp đảo mọi chuyện tán gẫu) · "hết chuyện để nói" (hết cuộc
 * điểm dương ≠ hết nội dung).
 *
 * ⚠️ RANH GIỚI CỨNG với CANON §16 Đừng-1: điểm này chỉ chọn CHUYỆN ĐỂ NÓI, không bao giờ chọn CHỖ
 * ĐỂ ĐI — NPC vẫn đi theo lịch của P2-03 §2.9.
 * ⚠️ RANH GIỚI CỨNG với T3: đây là điểm chọn NỘI DUNG, không phải điểm QUAN HỆ. Chỗ duy nhất nó
 * hiện ra là overlay dev F3.
 */
import type { Personality } from "../content/npcs";
import type { DriveId, PracticeId } from "../content/vocab";
import { DRIVE_IDS } from "../content/vocab";

export type DriveLevels = Record<DriveId, number>;

export const newDrives = (): DriveLevels => ({
  DUOC_PHUC_VU: 0, KE_CHUYEN: 0, DUOC_HOI: 0, PHAN_NAN: 0, YEN_THAN: 0, VIEC_RIENG: 0,
});

/**
 * Hằng của hàm suy giảm `A(x) = K / max(x, FLOOR)`.
 *
 * `FLOOR` có mặt để `A` không nổ ở 0: một drive bằng 0 nghĩa là "chuyện này tôi không cần",
 * không phải "chuyện này tôi cần vô hạn". Zubek không nói tới chỗ này vì nhu cầu của ông
 * không bao giờ chạm 0 — nhu cầu ở đây thì chạm suốt.
 */
export const ATT_K = 1000;
export const ATT_FLOOR = 8;

export const attenuate = (x: number) => ATT_K / Math.max(ATT_FLOOR, Math.min(100, x));

/**
 * MỨC NỀN theo tính cách — không phải một bảng viết tay thứ hai.
 *
 * Bốn chiều của P2-02 đã nói đủ: người mở lòng thì muốn kể và muốn được hỏi, người kỹ
 * tính thì dễ phàn nàn, người điềm đạm thì ít đòi được phục vụ ngay. Thêm một bảng số
 * riêng cho drive là thêm một chỗ để lệch với tính cách.
 */
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

/**
 * Suy giảm về mức nền — điểm/phút game. Không suy giảm về 0: mức nền LÀ con người họ,
 * còn phần vượt lên trên mới là chuyện của sáng hôm nay.
 */
export const DRIVE_DECAY_PER_MIN = 2;

export function decayDrives(d: DriveLevels, base: DriveLevels, minutes: number) {
  const step = DRIVE_DECAY_PER_MIN * minutes;
  for (const k of DRIVE_IDS) {
    const b = base[k];
    d[k] = d[k] > b ? Math.max(b, d[k] - step) : Math.min(b, d[k] + step);
  }
}

export const bump = (d: DriveLevels, k: DriveId, by: number) => {
  d[k] = Math.max(0, Math.min(100, d[k] + by));
};

/**
 * Khung cảnh ĐẨY drive nào lên — P2-09 §2.5 × §2.7.
 *
 * Đây là chỗ *"đang đợi bánh thì chỉ nói chuyện bằng ổ bánh"* thôi là một `if` viết tay
 * và trở thành hình dạng của hệ: `DOI_BANH` đẩy `DUOC_PHUC_VU` lên 85, và không chuyện
 * tán gẫu nào thắng nổi con số đó.
 */
export const PRACTICE_PUSH: Record<PracticeId, Partial<DriveLevels>> = {
  DI_NGANG:  { VIEC_RIENG: 55, YEN_THAN: 30 },
  XEP_HANG:  { DUOC_PHUC_VU: 45 },
  GOI_MON:   { DUOC_PHUC_VU: 70 },
  DOI_BANH:  { DUOC_PHUC_VU: 85 },
  NAN_LAI:   { KE_CHUYEN: 25, DUOC_HOI: 25 },
  QUAY_VANG: { KE_CHUYEN: 20, DUOC_HOI: 20 },
  NGHE_LOM:  { YEN_THAN: 60 },
};

/** Trạng thái drive sau khi khung cảnh và hôm nay nói vào. */
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

/** Một cuộc nói xong thì drive nào hạ, hạ bao nhiêu. Dương = ĐƯỢC THOẢ. */
export type Satisfies = Partial<Record<DriveId, number>>;

/**
 * CHẤM MỘT CUỘC — dạng (c) của Zubek, nhân thêm hệ số tune của từng người.
 *
 * `tune` là *"tuning theo từng agent cho từng nhu cầu"* của Zubek, và nó tái dùng hồ sơ
 * giao tiếp (`content/npcs/profiles.json`) chứ không thêm một núm nào cho người tune.
 *
 * Trả về điểm THÔ. Người gọi nhân tiếp với `salience` và lọc theo khung cảnh.
 */
export function scoreSatisfies(
  sat: Satisfies, now: DriveLevels, tune: Partial<Record<DriveId, number>> = {},
): number {
  let sum = 0;
  for (const k of DRIVE_IDS) {
    const drop = sat[k];
    if (!drop) continue;
    /*
     * ĐỔI THANG TRƯỚC KHI CHẤM — chỗ dễ sai nhất của cả file, và tôi đã sai một lần.
     *
     * Thang của Zubek là **ĐÃ THOẢ BAO NHIÊU** (hunger 10 = sắp chết đói), nên `A(x) = K/x`
     * cho điểm cao ở giá trị THẤP, và `A(hiện tại) − A(tương lai)` ra dương khi ăn vào.
     * Thang ở đây là **ĐANG MUỐN BAO NHIÊU** (`KE_CHUYEN` 80 = rất muốn kể) — ngược hẳn.
     *
     * Chép thẳng công thức mà không đổi thang thì mọi dấu lộn ngược: một cuộc thoả đúng
     * cái người ta đang cần ra điểm ÂM, và `pickTalk` sẽ chọn đúng cái chuyện họ không
     * muốn nghe. Nên quy về thang của ông ngay tại đây, một dòng, có tên.
     */
    const cur = 100 - now[k];
    const fut = Math.max(0, Math.min(100, cur + drop));
    sum += (attenuate(cur) - attenuate(fut)) * (tune[k] ?? 1);
  }
  return sum;
}

/**
 * RÚT NGẪU NHIÊN CÓ TRỌNG SỐ TRONG TOP-N — Zubek khuyên thẳng chuyện này:
 * *"winner-takes-all làm nhân vật trông máy móc khó chịu"*.
 *
 * `n = 3` là chỗ cân: nhỏ hơn thì cùng một người lặp lại cùng một chuyện, lớn hơn thì
 * điểm số hết nghĩa vì cuộc tệ nhất cũng có cửa.
 */
export const TOP_N = 3;

export function pickWeighted<T>(
  list: readonly { item: T; score: number }[], roll: number, n = TOP_N,
): T | null {
  if (!list.length) return null;
  const top = [...list].sort((a, b) => b.score - a.score).slice(0, n);
  // Điểm âm hết: chuyện gì nói ra cũng làm người ta khó chịu hơn. Vẫn phải chọn một —
  // im lặng là chuyện của `talkUnavailable`, không phải của hàm rút.
  const lo = Math.min(0, ...top.map((x) => x.score));
  const total = top.reduce((a, x) => a + (x.score - lo) + 0.001, 0);
  let r = roll * total;
  for (const x of top) if ((r -= (x.score - lo) + 0.001) < 0) return x.item;
  return top[top.length - 1].item;
}
