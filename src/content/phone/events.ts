import type { SaveFile } from "../../core/save";

export type Reply = { me: string; answer?: string };

export type PhoneEvent = {
  id: string;
  from: string;
  text: string;
  /** Trống = tin báo, không cần trả lời; đủ 2 = cảm ơn rồi tới cà khịa. */
  replies?: [Reply, Reply];
  when: (w: SaveFile) => boolean;
  vars?: (w: SaveFile) => Record<string, string | number>;
};

/** Mẹ nhắn xin tiền học cho em; chỉ có một nút Gửi. */
export const TUITION = {
  id: "tuition",
  /** Xác suất mỗi tối, đo bằng `tools/sim.ts`: ~6% lợi nhuận/ngày. */
  p: 0.1,
  minGapDays: 5,
  /** Số tiền = tỉ lệ × lời trung bình 3 ngày gần nhất, kẹp trong khoảng. */
  share: 0.8,
  minVnd: 60_000,
  maxVnd: 150_000,
  /** Mẹ không xin khi két chưa gấp ngần này lần số tiền. */
  cashMul: 4,
  asks: [
    "con ơi, tiền học kỳ này của em còn thiếu {amount}. con gửi giúp mẹ nha",
    "mẹ đóng học phí cho em mà hụt {amount}. con gửi mẹ được không",
    "em con sắp thi, cần đóng tiền học {amount}. mẹ hỏi con chút",
  ],
  answers: [
    "ừ mẹ nhận rồi. con ăn uống đủ bữa nha",
    "cảm ơn con. em nó biết ơn chị lắm đó",
    "mẹ nhận rồi. ráng giữ sức nha con",
  ],
} as const;

/** Ngưỡng tin theo nền `tools/sim.ts`: lời ~150k/ngày, rổ tối thiểu ~60k. */
export const PENDING_SIM = {
  lossStreak: 3,
  lossStreakDeep: 6,
  huyEnvyAfterDays: 1,
  huyFiredAfterDays: 4,
  lowCashVnd: 150_000,
  recordMinDay: 3,
} as const;

const firedFor = (w: SaveFile, id: string) =>
  w.phone.firedDay[id] === undefined ? -1 : w.progress.dayIndex - w.phone.firedDay[id];

const profit = (r: { revenue: number; cost: number }) => r.revenue - r.cost;
const today = (w: SaveFile) => w.ledger.find((r) => r.day === w.progress.dayIndex);

function lossStreak(w: SaveFile): number {
  let n = 0;
  for (let i = w.ledger.length - 1; i >= 0 && profit(w.ledger[i]) < 0; i--) n++;
  return n;
}

export const EVENTS: PhoneEvent[] = [
  {
    id: "khai-truong-linh", from: "linh",
    text: "quán mở chưa bà? chiều tui ghé ủng hộ ổ đầu tiên nha 💪",
    when: (w) => w.progress.dayIndex === 1 && w.ledger.length === 0,
  },
  {
    id: "ngay1-linh", from: "linh",
    text: "khai trương sao rồi bà ơi. bán được nhiêu ổ?",
    replies: [
      { me: "được {n} ổ nè, mệt xỉu mà vui", answer: "đỉnh!! mai tui ghé" },
      { me: "đủ để không phải nhìn mặt sếp nữa", answer: "😂😂 chuẩn" },
    ],
    when: (w) => w.progress.dayIndex === 1 && !!today(w),
    vars: (w) => ({ n: today(w)?.served ?? 0 }),
  },
  {
    id: "lo-dau-me", from: "mom",
    text: "hôm nay bán được không con. có gì nói mẹ",
    replies: [
      { me: "hơi lỗ mẹ ơi, mai con làm lại", answer: "từ từ con, ai mới làm cũng vậy" },
      { me: "ổn mà mẹ, mẹ đừng lo", answer: "ừ, nhớ ăn uống đàng hoàng" },
    ],
    when: (w) => { const r = today(w); return !!r && profit(r) < 0 && w.ledger.filter((x) => profit(x) < 0).length === 1; },
  },
  {
    id: "lo-lien-huy", from: "huy",
    text: "nghe nói quán vắng hả 😏 về lại công ty đi, sếp còn chừa ghế",
    replies: [
      { me: "cảm ơn quan tâm, tui ổn", answer: "ờ, cố lên" },
      { me: "ghế đó để ông ngồi OT tiếp nha", answer: "...😶" },
    ],
    when: (w) => lossStreak(w) === PENDING_SIM.lossStreak,
  },
  {
    id: "ky-luc-linh", from: "linh",
    text: "quán bà lên xu hướng trong group review ăn uống kìa 🔥",
    replies: [
      { me: "trời ơi thiệt hả, cảm ơn bà đã kéo khách", answer: "ổ đầu tiên của bà là tui mua đó nha" },
      { me: "chắc tại bà share 10 lần", answer: "đúng rồi, công tui hết 😤" },
    ],
    when: (w) => {
      const r = today(w);
      if (!r || w.progress.dayIndex < PENDING_SIM.recordMinDay) return false;
      return w.ledger.filter((x) => x.day < r.day).every((x) => x.revenue < r.revenue);
    },
  },
  {
    id: "het-tien-me", from: "mom",
    text: "con còn tiền nhập hàng không. đừng giấu mẹ",
    replies: [
      { me: "con còn, mẹ yên tâm", answer: "ừ, cần thì nói" },
      { me: "hơi kẹt mẹ ơi", answer: "mẹ đang hơi kẹt nên không gửi thêm được, con ráng tính toán nha" },
    ],
    when: (w) => w.progress.dayIndex > 1 && w.money.cash < PENDING_SIM.lowCashVnd,
  },
  {
    id: "huy-ngay2", from: "huy",
    text: "ngày đầu bán được mấy ổ vậy bà 😏 tui đoán 5 ổ",
    replies: [
      { me: "nhiều hơn 5. mai ông ghé đếm thử", answer: "thôi tui bận. tui là trưởng nhóm rồi, lịch kín 😎" },
      { me: "đoán sai rồi, tính lại KPI đi", answer: "KPI của tui lúc nào cũng đạt nha, bà nhớ chưa" },
    ],
    when: (w) => w.progress.dayIndex === 2,
  },
  {
    id: "huy-lo-sau", from: "huy",
    text: "tui nói rồi mà. về xin sếp đi bà, tui nói giúp cho 😌",
    replies: [
      { me: "ông giúp tui bằng cách đừng nhắn nữa", answer: "ơ tui tốt bụng mà. sao bà khó chịu vậy" },
      { me: "ông lo cái ghế trưởng nhóm của ông trước đi", answer: "ghế tui chắc như đinh đóng cột nha 😤" },
    ],
    when: (w) => lossStreak(w) === PENDING_SIM.lossStreakDeep,
  },
  {
    id: "huy-ganh", from: "huy",
    text: "ủa quán bà lên group review hả. chắc mua view thôi 🙄",
    replies: [
      { me: "ừa mua view. mua bằng mồ hôi", answer: "văn vở. tui vẫn thấy quán bà bình thường" },
      { me: "ông để ý nhiều vậy chắc rảnh lắm", answer: "tui bận lắm nha!! chỉ là tình cờ thấy thôi" },
    ],
    when: (w) => firedFor(w, "ky-luc-linh") >= PENDING_SIM.huyEnvyAfterDays,
  },
  {
    id: "huy-bi-duoi-tin", from: "linh",
    text: "bà ơi tin nóng: Huy bị sa thải rồi 😭😂 sếp nói cắt giảm nhân sự, ổng bị cắt đầu tiên",
    when: (w) => firedFor(w, "ky-luc-linh") >= PENDING_SIM.huyFiredAfterDays,
  },
  {
    id: "huy-xin-viec", from: "huy",
    text: "bà ơi... tui nghỉ việc rồi. quán bà có tuyển phụ bếp không 🥲",
    replies: [
      { me: "vô đi, rửa chén tính lương theo giờ", answer: "rửa chén?? thôi để tui suy nghĩ lại" },
      { me: "quán tui không nhận người chê bánh mì bán không nổi", answer: "...tui nói vậy hồi nào 😶" },
    ],
    when: (w) => firedFor(w, "huy-bi-duoi-tin") >= 1,
  },
];
