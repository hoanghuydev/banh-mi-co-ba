import type { SaveFile } from "../../core/save";
import { sickWindow } from "../../sim/reviews";
import { recentStars } from "../../sim/demand";
import { WIN_VND } from "../../sim/win";

export type Reply = { me: string; answer?: string };
export type Vars = Record<string, string | number>;

export type PhoneEvent = {
  id: string;
  from: string;
  text: string;
  /** Trống = tin báo, không cần trả lời; đủ 2 = cảm ơn rồi tới cà khịa. */
  replies?: [Reply, Reply] | ((vars: Vars) => [Reply, Reply]);
  when: (w: SaveFile) => boolean;
  vars?: (w: SaveFile) => Vars;
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
  sickWarn: 6,
  sickAlarm: 10,
  lowCashVnd: 150_000,
  recordMinDay: 3,
} as const;

const firedFor = (w: SaveFile, id: string) =>
  w.phone.firedDay[id] === undefined ? -1 : w.progress.dayIndex - w.phone.firedDay[id];

/** Từ số ổ này của ngày đầu trở lên thì Linh khen. */
const SOLD_GOOD = 6;

/** Số đánh giá tối thiểu để một mốc sao đáng nhắc. */
const STAR_NOTE_MIN = 20;
const STAR_PRAISE_MIN = 50;
const REVIEW_MILESTONE = 100;

/** Gần mốc thắng tới mức này thì mẹ nhắn. */
const WIN_NEAR = 0.8;

const BAD_FREE_DAYS = 7;

/** Bảy ngày liền có đánh giá mà không cái nào 1–2★. */
function cleanWeek(w: SaveFile): boolean {
  const from = w.progress.dayIndex - BAD_FREE_DAYS;
  if (w.progress.dayIndex <= BAD_FREE_DAYS) return false;
  const recent = w.reviews.list.filter((r) => r.day > from);
  return recent.length > 0 && recent.every((r) => r.stars > 2);
}

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
    replies: ({ n }) => Number(n) >= SOLD_GOOD
      ? [
        { me: "được {n} ổ nè, mệt xỉu mà vui", answer: "đỉnh!! mai tui ghé" },
        { me: "đủ để không phải nhìn mặt sếp nữa", answer: "😂😂 chuẩn" },
      ]
      : Number(n) > 0
        ? [
          { me: "mới {n} ổ thôi bà ơi", answer: "ngày đầu vậy là ổn rồi. mai tui rủ thêm người ghé" },
          { me: "ít hơn tui tưởng, mà tui chưa bỏ cuộc đâu", answer: "đúng chất bà. cố lên" },
        ]
        : [
          { me: "chưa bán được ổ nào luôn 😅", answer: "hả?? thôi mai tui ghé mua, bà đừng nản nha" },
          { me: "hôm nay tui tập làm quen thôi", answer: "ừa, từ từ. mai bán cho tui ổ đầu tiên nha" },
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
    replies: ({ n }) => Number(n) > 5
      ? [
        { me: "nhiều hơn 5. mai ông ghé đếm thử", answer: "thôi tui bận. tui là trưởng nhóm rồi, lịch kín 😎" },
        { me: "đoán sai rồi, tính lại KPI đi", answer: "KPI của tui lúc nào cũng đạt nha, bà nhớ chưa" },
      ]
      : [
        { me: "{n} ổ. ông đoán gần đúng, đừng vênh", answer: "tui nói rồi, dân văn phòng nhìn thị trường chuẩn lắm 😎" },
        { me: "ít thôi, mai tui bán hơn cho ông coi", answer: "ờ, tui chờ coi 😏" },
      ],
    when: (w) => w.progress.dayIndex === 2,
    vars: (w) => ({ n: w.ledger.find((r) => r.day === 1)?.served ?? 0 }),
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
  {
    id: "sao-bon-linh", from: "linh",
    text: "ê quán bà 4 sao rồi á. tui vừa coi trên map 🔥",
    replies: [
      { me: "tui cũng mới thấy. mừng xỉu", answer: "giữ cho tui nha, đừng tụt" },
      { me: "nhờ bà rủ người ghé đó", answer: "công tui một phần thôi. bánh bà ngon mà" },
    ],
    when: (w) => w.reviews.list.length >= STAR_NOTE_MIN && (recentStars(w) ?? 0) >= 4,
  },
  {
    id: "tram-danh-gia-huy", from: "huy",
    text: "quán bà trăm cái đánh giá rồi hả. chắc nhờ mấy cái 1 sao thôi 🙄",
    replies: [
      { me: "ông vô đếm thử rồi tính lại", answer: "tui đâu rảnh. tui chỉ tình cờ thấy" },
      { me: "ừa, cảm ơn người đóng góp một cái", answer: "...tui có đánh giá gì đâu 😶" },
    ],
    when: (w) => w.reviews.list.length >= REVIEW_MILESTONE,
  },
  {
    id: "sao-bon-rem-sep", from: "sep",
    text: "anh thấy quán em trên map, 4,5 sao luôn. em làm bên ngoài cũng giỏi quá ta 😊 cần người bán giúp thì gọi anh nha",
    replies: [
      { me: "dạ cảm ơn anh. quán em một người lo được", answer: "ừ, anh nói thật mà. bên này cũng còn chỗ cho em" },
      { me: "anh ghé mua ổ đi, em tính giá khách quen", answer: "haha được, hôm nào anh ghé" },
    ],
    when: (w) => w.reviews.list.length >= STAR_PRAISE_MIN && (recentStars(w) ?? 0) >= 4.5,
  },
  {
    id: "sao-tut-huy", from: "huy",
    text: "sao quán bà xuống dưới 3 rồi kìa. tui đoán trước mà 😏",
    replies: [
      { me: "tui sửa được. ông coi tuần sau", answer: "ờ, để coi 😏" },
      { me: "ông theo dõi quán tui kỹ quá nha", answer: "tui bận lắm nha!! chỉ là map tự hiện lên thôi" },
    ],
    when: (w) => w.reviews.list.length >= STAR_NOTE_MIN && (recentStars(w) ?? 5) < 3,
  },
  {
    id: "gan-moc-me", from: "mom",
    text: "con ơi chú Tâm nói gần quán con có chỗ sang lại. con để dành được nhiêu rồi",
    replies: [
      { me: "con gần đủ rồi mẹ, còn chút nữa", answer: "ừ. đủ thì nói mẹ, mẹ coi chỗ giùm con" },
      { me: "mẹ đừng hỏi, con sợ hớ", answer: "haha ừ. mẹ không hỏi nữa" },
    ],
    when: (w) => w.money.cash >= WIN_VND * WIN_NEAR,
  },
  {
    id: "tuan-sach-linh", from: "linh",
    text: "cả tuần không có cái đánh giá xấu nào luôn. bà làm gì mà đỉnh vậy",
    replies: [
      { me: "tui đổi hàng với rửa tay đàng hoàng thôi", answer: "nghe đơn giản mà mấy quán khác làm không nổi á" },
      { me: "tui cũng không biết nữa, cứ làm thôi", answer: "giữ nhịp đó nha" },
    ],
    when: cleanWeek,
  },
  {
    id: "dau-bung-linh", from: "linh",
    text: "ê bà. tui nghe có người kêu ăn quán bà xong bị đau bụng đó. coi lại hàng đi",
    replies: [
      { me: "cảm ơn bà, tui kiểm tra lại liền", answer: "ừa. đừng mua hàng rẻ quá nha" },
      { me: "tin đồn thôi. bà nghe ai nói", answer: "tui nghe Huy nói á. ổng khoe cả group" },
    ],
    when: (w) => sickWindow(w) >= 1,
  },
  {
    id: "dau-bung-me", from: "mom",
    text: "con ơi mẹ thấy trên mạng nói quán con có người đau bụng. con giữ vệ sinh hàng nha",
    replies: [
      { me: "dạ con biết rồi mẹ, con đổi hàng liền", answer: "ừ. tiền bạc từ từ, sức khoẻ khách quan trọng hơn" },
      { me: "mẹ yên tâm, con lo được", answer: "ừ. mẹ lo thôi chứ không ép con" },
    ],
    when: (w) => sickWindow(w) >= PENDING_SIM.sickWarn,
  },
  {
    id: "dau-bung-phuong", from: "linh",
    text: "bà ơi tui thấy trên group khu mình người ta đang réo tên quán bà quá trời. coi chừng phường xuống kiểm tra đó",
    replies: [
      { me: "tui bỏ hết hàng dỏm rồi, mai nhập lại", answer: "ừa làm liền đi. để lâu là mệt đó" },
      { me: "kệ đi, ai nói gì mặc ai", answer: "ờ... thôi bà liệu mà lo nha" },
    ],
    when: (w) => sickWindow(w) >= PENDING_SIM.sickAlarm,
  },
];
