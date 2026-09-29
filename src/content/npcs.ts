import type { BodyStyle } from "../art/character";

/**
 * Dàn nhân vật — CANON §9. Tên và bốn chỉ số tính cách lấy đúng từ bảng đó,
 * KHÔNG được tự đổi.
 *
 * P1 chỉ cần **3 NPC có tên và có mặt** (CANON §17). Ba người này được chọn vì
 * mỗi người dạy người chơi một luật khác nhau:
 *  · Bà Bảy  — soi nhất hẻm nhưng dễ tha, nên an toàn để học luật
 *  · Chú Tư  — khách 6h45 cố định, dạy người chơi đọc LỊCH SINH HOẠT
 *  · Anh Dũng — luôn vội, dạy người chơi cái giá của MADE_THEM_WAIT
 */

export type Personality = {
  soi: number;        // 0..1  kỹ tính ↔ xuề xoà   → traitMul ở tầng nhận thấy
  nongTinh: number;   // 0..1  dễ nổi  ↔ điềm đạm  → cường độ phản ứng, tốc độ mất kiên nhẫn
  deTha: number;      // 0..1  dễ bỏ qua ↔ để bụng → tốc độ decay của memory
  thanThien: number;  // 0..1  mở lòng ↔ khép kín  → tốc độ lên quan hệ + xác suất lan tin
};

export type NpcDef = {
  id: string;
  name: string;
  /** Cách khách tự xưng / người chơi gọi. CANON §2: KHÔNG dịch đại từ. */
  role: string;
  personality: Personality;
  body: BodyStyle;
  /** Giờ ghé quán (phút trong ngày). Vắng thì tới ngẫu nhiên. */
  arrivesAt?: number;
  /** Kiên nhẫn gốc tính bằng giây thật, trước khi nhân với tính cách. */
  patience: number;
};

export const NPCS: NpcDef[] = [
  {
    id: "bay", name: "Bà Bảy", role: "bán vé số",
    personality: { soi: 0.9, nongTinh: 0.6, deTha: 0.8, thanThien: 0.7 },
    // tóc búi bạc + kính lão + lưng còng: ba tín hiệu tuổi tác, đọc được ở 62 px
    body: {
      skin: 0xe3b189, hair: 0xb9b3ab, shirt: 0x7d5e8c, trousers: 0x3b3550,
      stoop: true, hairStyle: "bun", glasses: true,
    },
    arrivesAt: 6 * 60 + 10,
    patience: 70,
  },
  {
    id: "tu", name: "Chú Tư", role: "bảo vệ công ty",
    personality: { soi: 0.3, nongTinh: 0.3, deTha: 0.9, thanThien: 0.6 },
    body: {
      skin: 0xd9a97e, hair: 0x2b2420, shirt: 0x41628c, trousers: 0x2f3a49,
      hat: "cap", hairStyle: "short",
    },
    arrivesAt: 6 * 60 + 45,                            // CANON §9: khách 6h45 T2–T6
    patience: 85,
  },
  {
    id: "dung", name: "Anh Dũng", role: "tài xế công nghệ",
    personality: { soi: 0.2, nongTinh: 0.5, deTha: 0.7, thanThien: 0.5 },
    body: {
      skin: 0xe0b085, hair: 0x241e1b, shirt: 0x2f7d52, trousers: 0x2a3138,
      hat: "helmet", hairStyle: "short",
    },
    patience: 42,                                      // luôn vội — đây là chỗ đau
  },
];

/** Khách vãng lai vô danh — CANON §9 "ngoài danh sách", dùng pool thoại generic. */
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
