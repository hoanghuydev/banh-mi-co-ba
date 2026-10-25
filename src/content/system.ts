/** Lời của Hệ thống Bán Bánh Mì. */
export const AWAKEN_LINES = [
  "Keng!",
  "Phát hiện ký chủ vừa nộp đơn nghỉ việc.",
  "Hệ thống Bán Bánh Mì đang khởi động… 1%… 47%… 100%.",
  "Liên kết thành công.",
];

export const AWAKEN_STATS = (cash: string) => [
  ["Ký chủ", "Phương Anh"],
  ["Cảnh giới", "Chủ Quán Mới Mở (Tầng 1)"],
  ["Tài sản", cash],
  ["Mục tiêu tối thượng", "Khai mở chi nhánh 2"],
  ["Thất bại", "Quay lại xin việc"],
] as const;

export const ASK_ACCEPT = [
  "Nhiệm vụ tân thủ đã được kích hoạt!",
  "Điều kiện tiếp nhận đã đáp ứng. Ký chủ có chấp nhận nhiệm vụ?",
];

export const REFUSE_ONE = [
  "Keng! Hệ thống ghi nhận ký chủ từ chối.",
  "Cảnh báo: từ chối lần nữa sẽ gỡ liên kết vĩnh viễn với hệ thống.",
  "Ký chủ có chấp nhận nhiệm vụ?",
];

export const REFUSE_TWO = [
  "Keng! Đang gỡ liên kết… 100%.",
  "Hệ thống Bán Bánh Mì đã rời khỏi ký chủ.",
  "Chúc ký chủ một mình bình an.",
];

/** Câu khịa theo số lần quay ngược, lấy câu của mốc cao nhất đã qua. */
export const REWIND_QUIPS: [number, string][] = [
  [10, "Hệ thống đề nghị ký chủ đọc lại nhiệm vụ tân thủ."],
  [8, "Sếp cũ đã thắng ván cược trong tưởng tượng của hệ thống."],
  [6, "Hệ thống bắt đầu nghi ngờ lựa chọn liên kết của mình."],
];

export function rewindLines(n: number): string[] {
  const quip = REWIND_QUIPS.find(([from]) => n >= from)?.[1];
  if (!quip) return [];
  return [
    `Keng! Ký chủ đã quay ngược thời gian ${n} lần.`,
    quip,
    "Để ký chủ không phải quay lại công ty, kích hoạt chế độ trợ giúp: tỉ lệ trúng phần thưởng ×2.",
  ];
}

export const REWIND_ASK = [
  "Keng! Phát hiện ký chủ thất bại.",
  "Kích hoạt năng lực 【Nghịch Chuyển Thời Gian】.",
  "Kí chủ có muốn quay về đêm ký chủ nộp đơn nghỉ việc?",
];

export const QUEST_DONE = "Keng! Nhiệm vụ hoàn thành. Phần thưởng: Kinh nghiệm sống +1.";

export const ROOKIE_DONE = [
  "Keng! Nhiệm vụ tân thủ hoàn thành.",
  "Mở khoá: điểm danh mỗi ngày · vòng quay vận khí.",
  "Hệ thống chuyển sang chế độ chờ.",
  "Hy vọng ký chủ không khiến sếp cũ phải thốt lên: \"Anh đã nói rồi mà\".",
];

/** Câu của Hệ thống cho từng bước hướng dẫn; bước không có ở đây thì không giao việc. */
export const QUEST_TEXT: Record<string, string> = {
  CHO: "Thu thập tài nguyên. Mở điện thoại, vào Thực phẩm, đặt hàng đủ bán hôm nay.",
  MENU: "Tra cứu thực đơn. Tới bảng menu, bấm E.",
  KHO: "Kiểm kê tài nguyên. Tới thùng xốp, bấm E.",
  BANH: "Lấy phôi bánh. Tới kệ, bấm E.",
  LO: "Luyện bánh. Bỏ vào lò, bấm E. Vàng giòn thì lấy ra.",
  THOT: "Lên thớt. Gác ổ lên thớt, bấm E.",
  NHAN: "Kẹp nhân. Đủ từng phần theo đơn của khách.",
  GOI: "Gói. Bấm Gói lại.",
  GIAO: "Giao hàng. Đưa cho khách ở quầy gọi món.",
  TAY: "Tay dơ rồi rửa ngay. Tới bồn, bấm E. Cứ 10 ổ bán ra thì rửa tay một lần.",
  DT: "Kiểm tra truyền âm. Có tin nhắn mới, bấm Tab.",
};

export const KHO_READ = "Keng! Số lượng: tài nguyên còn lại. \"Còn … ngày\": hạn dùng. Thanh màu càng ngắn càng gần hỏng. Xem xong bấm Đóng.";

export const EYE_TEXT = "Keng! Mắt sáng: có khách đang nhìn ký chủ. Mắt đỏ nháy: khách nhìn chằm vào tay. Sơ suất lúc này, khách thấy rõ.";

export const LUCK_LINES = ["Hệ thống đã cố gắng.", "Hệ thống không tiếp nhận khiếu nại."];
