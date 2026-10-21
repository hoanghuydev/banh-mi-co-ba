import { ME } from "./contacts";

export type Beat = { from: string; text: string; attach?: string; typing?: boolean };
export type Chapter = { thread: string; at: string; bg: "office" | "night" | "morning" | "brown"; beats: Beat[] };

export const INTRO: Chapter[] = [
  {
    thread: "sep", at: "23:07", bg: "office",
    beats: [
      { from: "sep", text: "em ơi" },
      { from: "sep", text: "bản báo cáo quý mai 8h anh cần trên bàn nha" },
      { from: "sep", text: "anh biết hơi gấp nhưng mình là gia đình mà 😊" },
      { from: "sep", text: "à OT tối nay công ty ghi nhận tinh thần nha em, quỹ lương tháng này hơi căng" },
      { from: ME, text: "dạ anh", typing: true },
      { from: ME, text: "em gửi anh đơn nghỉ việc luôn ạ" },
      { from: ME, text: "", attach: "Don_nghi_viec_PhuongAnh.pdf" },
      { from: "sep", text: "??" },
      { from: "sep", text: "em suy nghĩ kỹ chưa. ra ngoài kia không dễ đâu em" },
      { from: "sep", text: "nghỉ rồi đừng có quay lại xin anh nha" },
      { from: ME, text: "dạ em không quay lại đâu ạ 🙂", typing: true },
    ],
  },
  {
    thread: "huy", at: "23:20", bg: "office",
    beats: [
      { from: "huy", text: "ê nghe tụi nó nói bà định nghỉ?" },
      { from: "huy", text: "bà nghỉ thì KPI quý này ai gánh 😤" },
      { from: "huy", text: "à mà tui sắp lên trưởng nhóm rồi nha, sếp hứa với tui rồi 😎" },
      { from: ME, text: "chúc mừng ông. tui nghỉ rồi, không liên quan", typing: true },
      { from: "huy", text: "nghỉ rồi đừng có mà khóc nha. ngoài kia người ta đông như kiến" },
      { from: "huy", text: "bà có gì hơn người ta đâu :))" },
      { from: ME, text: "ừa. cảm ơn đã quan tâm 🙂", typing: true },
    ],
  },
  {
    thread: "team", at: "23:41", bg: "night",
    beats: [
      { from: "linh", text: "ê nghe nói bà nộp đơn hả?????" },
      { from: ME, text: "ừa. mai tui đi thuê mặt bằng mở quán bánh mì", typing: true },
      { from: "huy", text: "bánh mì?? bà biết làm hả 🤨" },
      { from: ME, text: "học. tui học excel từ con số 0 còn được", typing: true },
      { from: "thai", text: "chị ơi quán có tuyển thêm người không 🥲 em xin theo" },
      { from: "huy", text: "để coi trụ được mấy tháng" },
      { from: "linh", text: "im đi Huy. bà làm đi, tui ủng hộ ổ đầu tiên 💪" },
    ],
  },
  {
    thread: "mom", at: "Sáng hôm sau · 07:15", bg: "morning",
    beats: [
      { from: "mom", text: "con nghỉ việc thật hả" },
      { from: "mom", text: "mẹ nghe con Linh nói" },
      { from: ME, text: "dạ. con tính kỹ rồi mẹ", typing: true },
      { from: "mom", text: "mẹ lo lắm. buôn bán đâu có dễ" },
      { from: "mom", text: "thôi mẹ gửi thêm chút, ráng mà làm. đừng để đói" },
      { from: "mom", text: "💸 Mẹ đã chuyển khoản cho bạn" },
      { from: ME, text: "con cảm ơn mẹ. con làm được mà ❤️", typing: true },
    ],
  },
  {
    thread: "landlord", at: "10:30", bg: "brown",
    beats: [
      { from: "landlord", text: "hợp đồng 6 tháng, cọc 2 tháng nha cháu" },
      { from: "landlord", text: "mặt bằng nhỏ nhưng ngay đầu hẻm, người qua lại cũng đông" },
      { from: ME, text: "dạ cháu ký ạ", typing: true },
      { from: "landlord", text: "🔑 chìa khoá để ở tiệm tạp hoá cô Mai nha" },
    ],
  },
  {
    thread: "huy", at: "19:00 21/10", bg: "night",
    beats: [
      { from: "huy", text: "nghe nói bà thuê mặt bằng đầu hẻm thiệt hả 🤣" },
      { from: "huy", text: "bánh mì thì ai chả bán. bà bán khác gì xe đầu ngõ" },
      { from: "huy", text: "tui share status cho cả phòng coi rồi. ai cũng cá bà lỗ" },
      { from: ME, text: "ông rảnh vậy. vô làm đi, sếp nhắc bây giờ", typing: true },
      { from: "huy", text: "tui làm nhiều hơn bà nha. mà thôi bà làm gì có cửa biết" },
    ],
  },
];
