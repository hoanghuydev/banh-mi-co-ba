import type { BodyStyle } from "../art/character";
import type { GazeProfile } from "../sim/gaze";
import type { StimId } from "../core/types";
import type { PoseId } from "../sim/reaction";
import { EVERY_DAY, WEEKDAYS_WORK, type ScheduleRule } from "../sim/schedule";

/**
 * Dàn nhân vật — CANON §9. Tên và bốn chỉ số tính cách lấy đúng từ bảng đó,
 * KHÔNG được tự đổi. Mỗi người khác người kế bên ít nhất HAI dấu hiệu BÓNG HÌNH
 * (nón, tóc, kính, giỏ, tạp dề, dáng) — ở 64 px màu áo gần như vô dụng.
 *
 * Ba người đầu dạy ba luật (P1): bà Bảy soi nhưng dễ tha · chú Tư dạy LỊCH · anh Dũng
 * dạy MADE_THEM_WAIT. Chín người sau thêm ở P2-02 — mỗi người một ô trong bảng 16 tổ
 * hợp tính cách (P2-02 §2.3), và mỗi người có MỘT thứ không liên quan tới gameplay.
 *
 * Lịch ghé (`schedule`) là dữ liệu cho P2-03 §2.9: KHÔNG BAO GIỜ hiện ra màn hình.
 * ⚠️ Giờ ghé, xác suất và sức chờ của 9 người thêm ở P2-02 là số tạm — cần tune.
 */

export type Personality = {
  soi: number;        // 0..1  kỹ tính ↔ xuề xoà   → traitMul ở tầng nhận thấy
  nongTinh: number;   // 0..1  dễ nổi  ↔ điềm đạm  → cường độ phản ứng, tốc độ mất kiên nhẫn
  deTha: number;      // 0..1  dễ bỏ qua ↔ để bụng → mặt về nền nhanh hay chậm
  thanThien: number;  // 0..1  mở lòng ↔ khép kín  → xác suất đi theo khi dời chỗ, hảo ý
};

export type NpcDef = {
  id: string;
  name: string;
  role: string;
  personality: Personality;
  body: BodyStyle;
  schedule: ScheduleRule[];
  /**
   * `patienceBaseSec` của P1-02 §2.7 — giây thật tới mốc MADE_THEM_WAIT (r = 1).
   * Bỏ đi ở r ≥ 1,6. KHÔNG nhân traitMul: kiên nhẫn là chuyện thời gian, không phải soi.
   */
  patience: number;
  /** Khung giờ vội (phút trong ngày) — trong khung này sức chờ × 0,65. */
  rush?: [number, number];
  /** Túi vé ánh nhìn 20 vé + số lần được bấm điện thoại mỗi lượt (P1-02 §2.5.4). */
  gaze: GazeProfile;
  /** Dáng RIÊNG khi NOTICED/CONFIRMED một sự kiện (P2-02 §4, cột "Tức thì" kênh 2). */
  poses?: Partial<Record<StimId, PoseId>>;
};

const at = (h: number, m = 0) => h * 60 + m;

export const NPCS: NpcDef[] = [
  {
    id: "BA_BAY", name: "Bà Bảy", role: "bán vé số",
    personality: { soi: 0.9, nongTinh: 0.6, deTha: 0.8, thanThien: 0.7 },
    // tóc búi bạc + kính lão + lưng còng: ba tín hiệu tuổi tác, đọc được ở 62 px
    body: {
      skin: 0xe3b189, hair: 0xb9b3ab, shirt: 0x7d5e8c, trousers: 0x3b3550,
      stoop: true, hairStyle: "bun", glasses: true,
    },
    // mở hàng T2·T4·T6·T7 lúc 6h20 · CN không
    schedule: [{ days: ["MON", "WED", "FRI", "SAT"], arriveMin: at(6, 20), jitterMin: 4, probability: 0.94 }],
    patience: 90,
    // người soi nhất hẻm KHÔNG bao giờ bấm điện thoại — đó là cả con người bà
    gaze: { tickets: [9, 4, 5, 0, 2, 0], phoneBudget: 0 },
    poses: { DROPPED_FOOD: "LEAN_IN", DIRTY_HANDS: "PEEK_OVER", MADE_THEM_WAIT: "SETTLE_IN", BURNT_OR_COLD: "LEAN_IN" },
  },
  {
    id: "CHU_TU", name: "Chú Tư", role: "bảo vệ công ty",
    personality: { soi: 0.3, nongTinh: 0.3, deTha: 0.9, thanThien: 0.6 },
    body: {
      skin: 0xd9a97e, hair: 0x2b2420, shirt: 0x41628c, trousers: 0x2f3a49,
      hat: "cap", hairStyle: "short",
    },
    // CANON §9: khách 6h45 T2–T6 (P2-03 §2.9 chép nguyên)
    schedule: [{ days: WEEKDAYS_WORK, arriveMin: at(6, 45), jitterMin: 3, probability: 0.96 }],   // ±3 phút — đồng hồ sống
    patience: 35,
    rush: [at(6, 30), at(7)],                          // trễ giờ vô ca: 35 s → ~23 s
    gaze: { tickets: [3, 4, 7, 2, 0, 4], phoneBudget: 1 },
    poses: { DROPPED_FOOD: "SHRUG", MADE_THEM_WAIT: "CHECK_TIME", BURNT_OR_COLD: "SHRUG" },
  },
  {
    id: "ANH_DUNG", name: "Anh Dũng", role: "tài xế công nghệ",
    personality: { soi: 0.2, nongTinh: 0.5, deTha: 0.7, thanThien: 0.5 },
    body: {
      skin: 0xe0b085, hair: 0x241e1b, shirt: 0x2f7d52, trousers: 0x2a3138,
      hat: "helmet", hairStyle: "short",
    },
    // 7h20 ± 12 MỌI ngày kể cả T7/CN — không cố định, đối lập chú Tư
    schedule: [{ days: EVERY_DAY, arriveMin: at(7, 20), jitterMin: 12, probability: 0.8 }],
    patience: 28,                                      // luôn vội — đây là chỗ đau
    gaze: { tickets: [2, 3, 5, 4, 0, 6], phoneBudget: 2 },
    poses: { DROPPED_FOOD: "SHRUG", MADE_THEM_WAIT: "SHIFT_WEIGHT" },
  },
  {
    id: "CHI_LAN", name: "Chị Lan", role: "nhân viên văn phòng",
    personality: { soi: 0.9, nongTinh: 0.1, deTha: 0.2, thanThien: 0.3 },
    // tóc ngắn ngang vai + túi xách tối + áo sơ mi sáng: đồ đi làm, đọc ra từ xa
    body: {
      skin: 0xebbe96, hair: 0x1c1816, shirt: 0xdfe6ec, trousers: 0x2c3442,
      hairStyle: "bob", bag: 0x3a3440,
    },
    // 7h05 ± 2 — còn đúng giờ hơn chú Tư · T7 ~9h30 thỉnh thoảng, mặc đồ thường
    schedule: [
      { days: WEEKDAYS_WORK, arriveMin: at(7, 5), jitterMin: 2, probability: 0.96 },
      { days: ["SAT"], arriveMin: at(9, 30), jitterMin: 15, probability: 0.35 },
    ],
    patience: 45,
    gaze: { tickets: [8, 1, 4, 5, 0, 2], phoneBudget: 2 },
    // người im lặng: đứng sững chứ không nói (P2-02 §4.6)
    poses: { DROPPED_FOOD: "STEP_BACK_HALF", DIRTY_HANDS: "LEAN_BACK", MADE_THEM_WAIT: "CHECK_TIME", BURNT_OR_COLD: "LEAN_BACK" },
  },
  {
    id: "BE_SU", name: "Bé Su", role: "học sinh cấp 2",
    personality: { soi: 0.4, nongTinh: 0.4, deTha: 0.9, thanThien: 1.0 },
    // đồng phục áo trắng quần xanh + tóc cột: học sinh, không lẫn với ai
    body: {
      skin: 0xf0c7a0, hair: 0x2a1f1a, shirt: 0xf3f1ea, trousers: 0x2d4f8a,
      hairStyle: "ponytail",
    },
    schedule: [
      { days: ["MON", "TUE", "WED", "THU", "FRI", "SAT"], arriveMin: at(6, 35), jitterMin: 5, probability: 0.88 },   // đi học
      { days: ["SUN"], arriveMin: at(9), jitterMin: 15, probability: 0.8 },                                          // đi chơi, ở lại lâu
    ],
    patience: 70,
    gaze: { tickets: [3, 3, 5, 7, 2, 0], phoneBudget: 3 },
    poses: { DROPPED_FOOD: "LEAN_IN", MADE_THEM_WAIT: "PHONE_DOWN" },
  },
  {
    id: "ONG_HAI", name: "Ông Hải", role: "khách hay nhậu",
    personality: { soi: 0.5, nongTinh: 0.9, deTha: 0.5, thanThien: 0.6 },
    // người to, tóc muối tiêu, áo nâu: đứng chiếm chỗ
    body: {
      skin: 0xcf9a6c, hair: 0x6b6660, shirt: 0x9b6a3c, trousers: 0x3a3a3a,
      hairStyle: "short", build: "round",
    },
    // HAI người — bản sáng (T3·T5·T7·CN 7h30, tử tế) và bản "sau 10 giờ" (T2·T4·T6 10h40,
    // ngày bán chỉ tới 11h). Cùng cái áo, cùng khuôn mặt.
    schedule: [
      { days: ["TUE", "THU", "SAT", "SUN"], arriveMin: at(7, 30), jitterMin: 8, probability: 0.85 },
      { days: ["MON", "WED", "FRI"], arriveMin: at(10, 40), jitterMin: 6, probability: 0.7 },
    ],
    patience: 55,
    rush: [at(10), at(11)],                            // sau 10h: hết kiên nhẫn nhanh
    gaze: { tickets: [4, 6, 8, 0, 2, 0], phoneBudget: 0 },
    poses: { DROPPED_FOOD: "LEAN_IN", MADE_THEM_WAIT: "LEAN_IN" },
  },
  {
    id: "CO_MAI", name: "Cô Mai", role: "chủ tạp hoá đối diện",
    personality: { soi: 0.6, nongTinh: 0.4, deTha: 0.6, thanThien: 0.8 },
    // tóc búi đen + áo hoa hồng + dáng tròn: bà chủ tiệm, KHÔNG còng (khác bà Bảy)
    body: {
      skin: 0xe6b58c, hair: 0x231c18, shirt: 0xc9577a, trousers: 0x3b3c4a,
      hairStyle: "bun", build: "round",
    },
    // 8h10 sau giờ cao điểm — cố tình tránh giờ đông (không bao giờ giải thích) · CN không mua
    schedule: [{ days: ["MON", "TUE", "WED", "THU", "FRI", "SAT"], arriveMin: at(8, 10), jitterMin: 5, probability: 0.9 }],
    patience: 50,
    gaze: { tickets: [5, 5, 6, 2, 2, 0], phoneBudget: 1 },
    poses: { DROPPED_FOOD: "TILT_HEAD", MADE_THEM_WAIT: "PEEK_OVER", BURNT_OR_COLD: "TILT_HEAD" },
  },
  {
    id: "THAY_PHUC", name: "Thầy Phúc", role: "giáo viên hưu trí",
    personality: { soi: 0.8, nongTinh: 0.2, deTha: 0.7, thanThien: 0.5 },
    // tóc bạc trắng + kính + áo sơ mi kem + lưng hơi còng
    body: {
      skin: 0xdcae86, hair: 0xe0ddd6, shirt: 0xe6dcc0, trousers: 0x55565c,
      hairStyle: "short", glasses: true, stoop: true,
    },
    // 7h40 ± 5 ngày thường · T7/CN 6h00 mặc đồ xe đạp, mua mang theo
    schedule: [
      { days: WEEKDAYS_WORK, arriveMin: at(7, 40), jitterMin: 5, probability: 0.92 },
      { days: ["SAT", "SUN"], arriveMin: at(6), jitterMin: 5, probability: 0.85 },
    ],
    patience: 80,
    gaze: { tickets: [7, 5, 6, 0, 2, 0], phoneBudget: 0 },
    poses: { DROPPED_FOOD: "NOD", DIRTY_HANDS: "TILT_HEAD", MADE_THEM_WAIT: "IDLE" },
  },
  {
    id: "CHI_HANH", name: "Chị Hạnh", role: "người Bắc mới vô Sài Gòn",
    personality: { soi: 0.5, nongTinh: 0.3, deTha: 0.6, thanThien: 0.4 },
    // tóc cột + giỏ nâu + áo xanh nhạt
    body: {
      skin: 0xf2caa5, hair: 0x2e231d, shirt: 0x6a8fb5, trousers: 0x363a44,
      hairStyle: "ponytail", bag: 0x8a5a44,
    },
    // 7h15 ± 6, ngay sau chị Lan · T7 ~10h mang máy ảnh đi chụp hẻm · CN không
    schedule: [
      { days: WEEKDAYS_WORK, arriveMin: at(7, 15), jitterMin: 6, probability: 0.88 },
      { days: ["SAT"], arriveMin: at(10), jitterMin: 15, probability: 0.6 },
    ],
    patience: 55,
    gaze: { tickets: [5, 4, 7, 3, 0, 1], phoneBudget: 1 },
    poses: { DROPPED_FOOD: "LEAN_BACK", MADE_THEM_WAIT: "SHIFT_WEIGHT" },
  },
  {
    id: "ANH_BAO", name: "Anh Bảo", role: "sinh viên",
    personality: { soi: 0.3, nongTinh: 0.2, deTha: 0.8, thanThien: 0.4 },
    // nón kết + áo khoác tối: cắm mặt điện thoại — gaze thấp nhất hẻm
    body: {
      skin: 0xe4b48a, hair: 0x1f1b18, shirt: 0x3c3f46, trousers: 0x2b2f38,
      hat: "cap", hairStyle: "short",
    },
    schedule: [{ days: WEEKDAYS_WORK, arriveMin: at(8, 45), jitterMin: 15, probability: 0.85 }],   // khách của khoảng lặng
    patience: 75,
    gaze: { tickets: [2, 1, 4, 11, 0, 2], phoneBudget: 4 },
    poses: { DROPPED_FOOD: "PHONE_DOWN", MADE_THEM_WAIT: "PHONE_DOWN" },
  },
  {
    id: "BA_SAU", name: "Bà Sáu", role: "gánh tàu hũ",
    personality: { soi: 0.4, nongTinh: 0.3, deTha: 0.8, thanThien: 0.9 },
    // nón lá + áo bà ba xanh + lưng còng: người bán rong đi ngang hẻm
    body: {
      skin: 0xd6a275, hair: 0x9c968e, shirt: 0x5e7f63, trousers: 0x262626,
      hat: "nonla", hairStyle: "bun", stoop: true,
    },
    // vòng 1 ~8h50 — tiếng rao là mốc giờ của cả hẻm. Hiếm khi mua: bà ĐỔI.
    schedule: [{ days: EVERY_DAY, arriveMin: at(8, 50), jitterMin: 6, probability: 0.92 }],
    patience: 80,
    gaze: { tickets: [4, 6, 8, 0, 2, 0], phoneBudget: 0 },
    poses: { MADE_THEM_WAIT: "SETTLE_IN" },
  },
  {
    id: "CHU_KIET", name: "Chú Kiệt", role: "xe bánh mì bên kia hẻm",
    personality: { soi: 0.7, nongTinh: 0.6, deTha: 0.3, thanThien: 0.4 },
    // TẠP DỀ — người bán duy nhất đứng phía khách: nhìn là biết đồng nghiệp
    body: {
      skin: 0xc99466, hair: 0x2a2522, shirt: 0xd8c9a0, trousers: 0x33363c,
      hairStyle: "short", apron: 0x8d3b2f,
    },
    // qua "ngó" sau giờ cao điểm bên xe mình — không phải ngày nào cũng qua
    // 6h10 đẩy xe ngang, liếc vô lò. CN nghỉ.
    schedule: [{ days: ["MON", "TUE", "WED", "THU", "FRI", "SAT"], arriveMin: at(6, 10), jitterMin: 2, probability: 0.97 }],
    patience: 45,
    gaze: { tickets: [8, 3, 7, 0, 0, 2], phoneBudget: 0 },
    poses: { DROPPED_FOOD: "PEEK_OVER", DIRTY_HANDS: "PEEK_OVER", MADE_THEM_WAIT: "ARMS_CROSS" },
  },
];

/**
 * Khách vãng lai vô danh — CANON §9 "ngoài danh sách", dùng pool thoại generic.
 *
 * Tám người này phải NHÌN RA LÀ TÁM NGƯỜI KHÁC NHAU dù không ai có tên. Ở 64 px
 * thì màu áo gần như vô dụng: nó bị quầy che nửa dưới, lại đứng lẫn trong một hẻm
 * toàn tông xanh xám. Thứ phân biệt được là BÓNG HÌNH — cái nằm quanh đầu và nhô
 * ra khỏi thân: nón lá, nón bảo hiểm, tóc búi, đuôi tóc, giỏ đi chợ, khẩu trang.
 * Nên mỗi người dưới đây khác người kế bên ít nhất HAI dấu hiệu bóng hình,
 * không phải chỉ khác màu áo.
 */
export const WALKIN_STYLES: BodyStyle[] = [
  { skin: 0xe8b98c, hair: 0x2a2320, shirt: 0xb0563f, trousers: 0x34404d, hairStyle: "short" },
  { skin: 0xd8a877, hair: 0x332a24, shirt: 0x4a6f7d, trousers: 0x3c3b46, hairStyle: "ponytail", mask: true },
  { skin: 0xefc39a, hair: 0x1f1a17, shirt: 0x8a7bb0, trousers: 0x2e3540, hairStyle: "bob", bag: 0xd9a441 },
  { skin: 0xdcae82, hair: 0x6f6a63, shirt: 0xc79a3e, trousers: 0x39424b, hairStyle: "bun", glasses: true, stoop: true },
  { skin: 0xe2b489, hair: 0x2b2018, shirt: 0x5d7f5a, trousers: 0x2f3a42, hat: "nonla", bag: 0xb0563f },
  { skin: 0xd3a271, hair: 0x241d1a, shirt: 0x8d9aa6, trousers: 0x33393f, hat: "helmet", mask: true },
  { skin: 0xeec49c, hair: 0x453026, shirt: 0xc46f86, trousers: 0x3a4550, hairStyle: "ponytail", build: "round" },
  { skin: 0xc99a6d, hair: 0x1d1a17, shirt: 0x3f6f8c, trousers: 0x2c333a, hairStyle: "short", build: "round", glasses: true },
];

/** Tên gọi tạm — khớp 1–1 theo chỉ số với `WALKIN_STYLES`, để tên đi đúng với người. */
export const WALKIN_NAMES = [
  "khách lạ", "chị đeo khẩu trang", "cô xách giỏ", "bà cụ",
  "cô nón lá", "anh chạy xe", "chị áo hồng", "chú đeo kính",
];
