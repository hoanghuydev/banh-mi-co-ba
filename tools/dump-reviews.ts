/** Xuất toàn bộ lời đánh giá ra file duyệt: npm run dump:reviews */
import { writeFileSync } from "node:fs";
import LINES from "../src/content/reviews/lines.json";

const RAW = LINES as unknown as {
  loi: Record<string, Record<string, string[]>>;
  them: Record<string, string[]>;
  ket: Record<string, string[]>;
  dan: string[];
  persona: Record<string, string[]>;
  nghiem: string[];
  khongTuongPhan: { ids: string[] };
  ve: Record<string, string[]>;
  noi: { totXau: string[]; xauTot: string[] };
  nhamQuan: string[];
  doiThu: string[];
  spam: string[];
  hiem: string[];
  ten: string[];
};

const TOPIC_VI: Record<string, string> = {
  "ngon": "Ổ ngon, không lỗi gì",
  "nhat-nheo": "Ổ không lỗi nhưng cũng không có gì hay",
  "gia-dat": "Chê giá đắt",
  "gia-re": "Khen giá rẻ",
  "cho-lau": "Chờ lâu mới tới lượt",
  "thieu-nhan": "Thiếu hẳn một thứ nhân khách gọi",
  "sai-mon": "Bỏ thứ khách đã dặn bỏ ra, hoặc đưa nhầm ổ",
  "it-nhan": "Có đủ nhân nhưng quá ít",
  "nguoi": "Ổ nguội",
  "banh-song": "Bánh nướng chưa tới",
  "banh-khet": "Bánh nướng khét",
  "nhoi-nhet": "Nhồi quá nhiều, rớt ra ngoài",
  "do-cu": "Nguyên liệu cũ, có mùi",
  "co-san": "Ổ dính sạn / đồ đã rơi xuống đất",
  "dau-bung": "Khách đau bụng sau khi ăn",
  "tay-ban": "Khách thấy chủ quán chưa rửa tay",
  "chen-hang": "Khách bị người khác chen lên trước",
  "loa-on": "Loa rao mở to",
  "cho-them": "Khách được cho thêm nhân",
  "tra-da": "Khách được rót trà đá",
  "troi-mua": "Trời mưa mà quán vẫn mở",
  "do-nghe-moi": "Quán vừa lắp đồ nghề mới",
  "het-banh": "Khách tới nơi thì hết bánh",
};

/** Trần sao — `sim/reviews.ts: STAR_CAP`. */
const CAP: Record<string, number> = { "co-san": 2, "do-cu": 3, "tay-ban": 2, "het-banh": 3 };

const TONE_VI: Record<string, string> = {
  chanthat: "Chân thật", nhat: "Nhạt", vuitinh: "Vui tính", haihuoc: "Hài hước", ham: "Hãm",
};

const TRIGGER: Record<string, string> = {
  "ngon": "Phục vụ không lỗi, khách chấm ≥4★",
  "nhat-nheo": "Không lỗi nhưng khách chấm 3★",
  "gia-dat": "Mốc giá **đắt** và khách chấm ≤3★",
  "gia-re": "Mốc giá **rẻ** và khách chấm ≥4★",
  "cho-lau": "Khách phải chờ qua 2 bậc kiên nhẫn trở lên",
  "thieu-nhan": "`MISSING` — thiếu hẳn một nhân có trong món",
  "sai-mon": "`UNWANTED` — bỏ thêm thứ khách đã dặn bỏ",
  "it-nhan": "`WRONG_RATIO` — lượng nhân lệch quá ngưỡng",
  "nguoi": "`WRONG_TEMP` — ổ nguội",
  "banh-song": "Vỏ bánh dưới ngưỡng chín của lò đang dùng",
  "banh-khet": "Vỏ bánh trên ngưỡng sém của lò đang dùng",
  "nhoi-nhet": "`STUFFED` — quá sức chứa của ổ",
  "do-cu": "`TASTE_OFF` — chất lượng nguyên liệu dưới ngưỡng khó tính của khách",
  "co-san": "Ổ rơi xuống đất mà vẫn gói, và khách **không kịp thấy** (thấy thì họ từ chối nhận, không có đánh giá)",
  "dau-bung": "Lăn trúng xác suất đau bụng của hàng dỏm trong ổ",
  "tay-ban": "Khách quan sát tới mức `CONFIRMED` stimulus `DIRTY_HANDS`",
  "chen-hang": "Khách bị chen lượt (`wasCut`) và chấm ≤3★",
  "loa-on": "`LOA_RAO` đang bật và khách chấm ≤3★",
  "cho-them": "Được cho thêm nhân (`freeExtra`) và khách chấm ≥4★",
  "tra-da": "Được rót trà đá (`visit.gaveTea`) và khách chấm ≥4★",
  "troi-mua": "Thời tiết mưa rào / mưa dầm và khách chấm ≥4★",
  "do-nghe-moi": "Có đơn đồ nghề đã lắp trong 3 ngày gần đây và khách chấm ≥4★",
  "het-banh": "Khách tới quầy mà kho hết bánh — đi qua `turnAway`, không có ổ nào được chấm",
};

/** Tình huống quanh quán chỉ chen vào 45% số lần, không thì ổ nào cũng kể chuyện bên lề. */
const BEN_LE = ["chen-hang", "loa-on", "cho-them", "tra-da", "troi-mua", "do-nghe-moi"];

const out: string[] = [];
const w = (s = "") => out.push(s);

w("# Đánh giá — toàn bộ lời sẽ xuất hiện trong game");
w();
w("> File này **sinh tự động** từ `src/content/reviews/lines.json` — chạy `npm run dump:reviews`. Sửa nội dung thì sửa file JSON, đừng sửa file này.");
w("> Giọng rút từ `docs/research/giong-noi/review-quan-an.md` (corpus 26.170 review quán ăn thật).");
w();
w("## Cách một đánh giá được ghép");
w();
w("```");
w("[dẫn] + CÂU LÕI (tình huống × giọng) + [VẾ TRÁI CHIỀU] + [vế phụ] + [dấu persona] + [lời kết]");
w("```");
w();
w("### Một lượt phục vụ có nhiều yếu tố thì sao");
w();
w("Game gom **tất cả** thứ đáng nhắc của lượt đó — cả điểm cộng lẫn điểm trừ — rồi:");
w();
w("1. **Vế chính** = yếu tố nặng nhất **cùng chiều với số sao**. Chấm ≥4★ thì mở bằng điểm cộng, ≤3★ thì mở bằng điểm trừ.");
w("2. **Vế trái chiều** = lấy từ phía còn lại, nối bằng `mỗi tội` / `có điều` / `nhưng` / `mà` (khen rồi bẻ) hoặc `được cái` / `bù lại` (chê rồi vớt). Chỉ chen vào **45%** số lần — người thật không phải lúc nào cũng kể hết.");
w();
w("**Hai luật chặn mâu thuẫn:**");
w();
w("| Luật | Nghĩa |");
w("|---|---|");
w("| Đã nói ra một lời chê thì **không còn là 5★** | Không có chuyện \"5★ — ngon, mà bánh sém một bên\" |");
w("| Trần sao tính trên **mọi** thứ đáng phàn nàn, không chỉ lỗi của ổ | Cho thêm nhân mà quên rửa tay vẫn **≤2★** |");
w();
w(`Chuyện nặng tới mức nhắc điểm cộng là vô duyên — **chỉ một vế**, không trái chiều: ${RAW.khongTuongPhan.ids.map((x) => `\`${x}\``).join(" · ")}.`);
w("Cho thêm nhân rồi làm khách đau bụng thì review chỉ nói chuyện đau bụng.");
w();
w("Ví dụ thật do game sinh ra:");
w();
w("```");
w("2★  gọi bánh mì đầy đủ, thấy chủ quán bốc đồ mà chưa rửa tay, ăn không yên tâm");
w("2★  được cho thêm nhân nha mọi người, ưng cái bụng, mỗi tội cái vụ tay chưa rửa thì chịu");
w("4★  vừa ăn vừa làm ly trà đá, đúng bài, mà nhân hơi ít");
w("1★  mua bánh mì đầy đủ, ăn xong nằm cả ngày, mọi người đừng ghé");
w("5★  bánh mì đầy đủ ở đây, có trà đá free nữa chứ, ưng quá, ai gần đây thì thử đi");
w("```");
w();
w("| Mảnh | Khi nào có |");
w("|---|---|");
w("| dẫn | 18% |");
w("| vế phụ | 35% nếu ≥4★, 60% nếu <4★ — bỏ nếu trùng ý câu lõi, hoặc tình huống nặng |");
w("| dấu persona | 22% — bỏ nếu tình huống nặng |");
w("| lời kết | 40% nếu ≥4★, 45% nếu <4★ |");
w();
w(`Tình huống nặng (không chêm vế vặt): ${RAW.nghiem.map((x) => `\`${x}\``).join(" · ")}.`);
w();
w("Giọng **Nhạt** chỉ dùng mỗi câu lõi, không ghép gì thêm.");
w();

let n = 0;
for (const pool of Object.values(RAW.loi)) for (const arr of Object.values(pool)) if (Array.isArray(arr)) n += arr.length;
w(`## Câu lõi theo tình huống — ${n} câu`);
w();

for (const [topic, byTone] of Object.entries(RAW.loi)) {
  w(`### ${TOPIC_VI[topic] ?? topic}`);
  w();
  w(`*Kích hoạt khi:* ${TRIGGER[topic] ?? "—"}`);
  if (CAP[topic]) w(`*Trần sao:* tối đa **${CAP[topic]}★** — cho thêm nhân hay làm tốt chỗ khác cũng không kéo lên được.`);
  if (BEN_LE.includes(topic)) w("*Chuyện bên lề:* chỉ chen vào 45% số lần đủ điều kiện.");
  w();
  for (const [tone, arr] of Object.entries(byTone)) {
    if (!Array.isArray(arr) || !arr.length) continue;
    w(`**${TONE_VI[tone] ?? tone}**`);
    w();
    for (const line of arr) w(`- ${line}`);
    w();
  }
}

const block = (title: string, note: string, arr: string[]) => {
  w(`### ${title}`);
  w();
  w(`*${note}*`);
  w();
  for (const line of arr) w(`- ${line}`);
  w();
};

w("## Mảnh ghép thêm");
w();
block("Dẫn", "Chèn trước câu lõi, 18%. `{mon}` thay bằng tên món.", RAW.dan);
block("Từ nối — khen rồi bẻ", "Câu lõi là điểm cộng, vế sau là điểm trừ.", RAW.noi.totXau);
block("Từ nối — chê rồi vớt", "Câu lõi là điểm trừ, vế sau là điểm cộng.", RAW.noi.xauTot);
w("### Vế trái chiều — dạng rút gọn của từng tình huống");
w();
w("*Dùng làm vế thứ hai khi một lượt phục vụ có cả hai chiều.*");
w();
w("| Tình huống | Các cách nói |");
w("|---|---|");
for (const [k, arr] of Object.entries(RAW.ve)) {
  if (k.startsWith("_")) continue;
  w(`| ${TOPIC_VI[k] ?? k} | ${arr.join(" · ")} |`);
}
w();
for (const [k, arr] of Object.entries(RAW.them)) {
  block(`Vế phụ — ${k === "tot" ? "khi khen" : "khi chê"}`, "Nối sau câu lõi bằng dấu phẩy.", arr);
}
for (const [k, arr] of Object.entries(RAW.ket)) {
  const vi = k === "tot" ? "≥4★" : k === "vua" ? "3★" : "≤2★";
  block(`Lời kết — ${vi}`, "Câu chốt cuối đánh giá.", arr);
}
for (const [k, arr] of Object.entries(RAW.persona)) {
  block(`Dấu persona — ${k}`, "Chèn cuối, cho biết người viết là ai.", arr);
}

w("## Đánh giá không đến từ khách thật");
w();
w("| Nguồn | Tỉ lệ trên tổng đánh giá | Số sao |");
w("|---|---|---|");
w("| Nhầm quán hủ tiếu kế bên | 2% | 1–3★ |");
w("| Chủ xe bánh mì đối thủ chơi xấu | 5%, chỉ sau khi quán có ≥20 đánh giá | 1–2★ |");
w("| Spam / lạc đề | 1% | ngẫu nhiên |");
w("| Tình huống hiếm | 1% | 4–5★ |");
w("| Chỉ sao, không chữ | 18% số đánh giá thật | theo lượt phục vụ |");
w();
block("Nhầm quán hủ tiếu", "Nói về món không có trên menu — dấu hiệu nhận ra.", RAW.nhamQuan);
block("Đối thủ chơi xấu", "Chê chung chung, không chi tiết cụ thể — dấu hiệu nhận ra.", RAW.doiThu);
block("Spam / lạc đề", "", RAW.spam);
block("Tình huống hiếm", "Phần thưởng cho người chơi lâu.", RAW.hiem);
block(`Tên người viết (${RAW.ten.length})`, "Dùng cho đánh giá nhiễu; đánh giá thật lấy tên khách đã phục vụ.", RAW.ten);

w("## Còn thiếu");
w();
w("Hai thứ **cố ý chưa làm**, để R5 chốt cùng mô phỏng:");
w();
w("- Đánh giá nhắc tới mốc truyện (quán lên tin tức, sếp cũ vào mỉa).");
w("- Đánh giá đổi giọng theo quy mô quán (quán nhỏ khác quán đã có tiếng).");
w();

writeFileSync("docs/revamp/R4-DANH-GIA.md", out.join("\n") + "\n");
console.log(`docs/revamp/R4-DANH-GIA.md — ${n} câu lõi, ${out.length} dòng`);
