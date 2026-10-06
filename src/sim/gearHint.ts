import type { SaveFile } from "../core/save";
import { EQUIP, capacity, has, used, type EquipId } from "./equipment";


/**
 * DẤU VẾT — một dòng dưới món đồ chưa mua, kể lại chuyện HÔM NAY của chính người chơi.
 *
 * ⚠️ TỪ ĐỢT RÚT GỌN, DẤU VẾT KHÔNG CÒN LÀ THỨ DUY NHẤT NÓI VỀ MÓN ĐỒ. Thẻ nào cũng có `gain`
 * (lợi ích quy ra chỉ số: "+15% khách ghé"), nên dòng dấu vết thôi phải gánh việc giải thích.
 * Nó quay về đúng việc của nó: nhắc một chuyện vừa xảy ra với chính người chơi, để con số bên
 * trên có chỗ bám. Món nào không có dấu vết trung thực thì vẫn KHÔNG CÓ DÒNG NÀO.
 *
 * Chủ dự án, đọc trang Đồ nghề: *"Tôi đọc không biết mua để làm gì."* Lỗi không nằm ở chỗ
 * thiếu chữ. Luật cũ cấm hiện con số hiệu ứng ("+18% khách vãng lai"), và nó bị thi hành thành
 * KHÔNG NÓI GÌ. Lần đó cách chữa là dòng dấu vết dưới đây; lần này chủ dự án gỡ luôn cái cấm
 * (*"quy ra chỉ số để user dễ nắm"*), nên con số về lại thẻ và dấu vết đứng CẠNH nó.
 *
 * Việc của dấu vết: không nói món đồ làm được gì, nói CÁI VỪA XẢY RA VỚI MÌNH. Người chơi không
 * cần ai giải thích cái kẹp gắp — họ cần nhớ ra rằng chiều nay họ cầm tiền xong rồi bốc
 * nhân sáu lần. Con số đó là của họ, không phải của món đồ; nó đã xảy ra rồi, không phải
 * một lời hứa; và nó không so sánh hai món với nhau.
 *
 * BA LUẬT CỦA MỘT DÒNG DẤU VẾT
 *
 *  1. Chỉ kể thứ NGƯỜI ĐỨNG BÁN TỰ THẤY. Tay mình, ổ bánh của mình, câu người ta nói với
 *     mình. Không có "mười hai người đi ngang không ghé" — đứng ở quầy thì không ai đếm
 *     được con số đó, và một con số không thấy được là một con số của trò chơi, không phải
 *     của cái hẻm.
 *  2. Im khi chưa có chuyện gì. Ngưỡng dưới đây không phải để lọc nhiễu — nó là để một dòng
 *     dấu vết lúc nào hiện ra cũng có sức nặng. Hiện mỗi tối thì ba bữa là hết ai đọc.
 *  3. Không khuyên. Kể xong là thôi. "Bữa nay cháy ba ổ." chứ không phải "Bữa nay cháy ba ổ,
 *     cân nhắc mua lò điện." Người chơi tự nối hai thứ đó — và chính lúc tự nối, món đồ mới
 *     có nghĩa.
 *
 * Món nào không có dấu vết trung thực thì KHÔNG CÓ DÒNG NÀO. Thà trống còn hơn bịa ra một
 * con số để lấp chỗ.
 */

/** Dưới ngần này ổ thì buổi bán đó vắng thật — bản dựng nhắm ~18 ổ/ngày (econ.json `scale`). */
const QUIET_DAY = 12;
/** Quầy coi như dơ hẳn khi sạch sẽ tụt xuống dưới mức này (`stall.cleanliness`, 1 = sạch bóng). */
const DIRTY_END = 0.5;

const dem = (n: number, mot: string, nhieu = mot) => (n === 1 ? `một ${mot}` : `${n} ${nhieu}`);

export function gearEvidence(id: EquipId, w: SaveFile): string | null {
  const t = w.notebook.today, d = w.progress.today, e = w.econ.today;
  const day = w.progress.dayIndex;
  if (t.day !== day) return null;                    // sổ của ngày khác — đừng kể chuyện cũ như chuyện nay
  /*
   * CHƯA ĐẾM TIỀN XONG THÌ CHƯA CÓ CHUYỆN GÌ ĐỂ KỂ.
   *
   * `econ.today.counted` bật đúng một lần, ở `eveningCount` — tức là lúc buổi bán đã đóng
   * sổ. Thiếu cái cổng này thì một ván chưa bán buổi nào vẫn có `served === 0`, và `0 ≤ 12`
   * là đúng, nên cái loa với cái bảng hiệu cùng mở miệng than "bữa nay bán được 0 ổ, cả buổi
   * im re" trước khi người chơi kịp dọn hàng ra. Lưới DV-1 bắt được đúng chuyện đó.
   */
  if (!w.econ.today.counted) return null;

  switch (id) {
    case "KEP_GAP":
      return t.bareHands >= 3 ? `Bữa nay con cầm tiền xong bốc thẳng vô nhân. ${dem(t.bareHands, "lần")}.` : null;
    case "LO_DIEN":
      return t.burnt >= 1 ? `Bữa nay cháy ${dem(t.burnt, "ổ")} trong lò.` : null;
    case "LONG_BAN":
      return w.stall.cleanliness <= DIRTY_END ? "Chiều ruồi bu quanh khay nhân." : null;
    case "GHE_BAN":
      return d.lost >= 2 ? `Bữa nay ${dem(d.lost, "người")} đứng đợi không nổi rồi về.` : null;
    case "DU_CHE":
      // cái dù đọc TRỜI, không đọc số người bỏ đi — để nó khỏi nói trùng câu với bộ bàn ghế
      if (w.progress.weather.startsWith("MUA")) return "Bữa nay mưa.";
      return w.progress.weather === "NANG_GAT" ? "Bữa nay nắng gắt, không ai đứng lâu nổi." : null;
    /*
     * Quạt điện và bình nước trà cùng đọc MỘT con số (người chờ không nổi rồi về) với bộ bàn ghế,
     * nên mỗi món phải nói bằng cái CHÍNH NÓ đỡ được: cái ghế là chỗ ngồi, cái quạt là cái nóng,
     * cái bình là mấy phút cuối trước khi người ta quay lưng.
     */
    case "QUAT_DIEN":
      return d.lost >= 2 && w.progress.weather === "NANG_GAT" ? "Trưa nay nắng, mấy người đứng chờ cứ lấy nón quạt." : null;
    case "BINH_TRA":
      return d.lost >= 3 ? `Bữa nay ${dem(d.lost, "người")} chờ gần tới lượt rồi mới bỏ đi.` : null;
    case "TU_MAT": case "NOI_U": {
      // `econ.today.wasted` đã là chữ người đọc được ("0,4 lạng pate nhà") — `sim/day.expire`
      // dựng sẵn, nên ở đây khỏi tra lại bảng hàng hoá. Nồi ủ chỉ đụng tới xíu mại.
      const bo = e.wasted.filter((x) => id === "TU_MAT" || /xíu mại/i.test(x));
      if (bo.length) return `Sáng nay bỏ ${bo.join(", ")} vì hư.`;
      return id === "TU_MAT" && e.soldOut ? "Bữa nay có người tới mà hết bánh." : null;
    }
    case "LOA_RAO":
      return d.served <= QUIET_DAY ? `Bữa nay bán được ${dem(d.served, "ổ")}. Cả buổi im re.` : null;
    case "BANG_HIEU":
      // cái bảng kéo NGƯỜI LẠ, nên nó đọc đúng chỗ đó thay vì chia chung con số ế với cái
      // loa. `strangers` là khách lạ ĐÃ GHÉ — người chơi tự đếm được, không phải người đi ngang.
      return d.served <= QUIET_DAY && t.strangers === 0 ? "Bữa nay không có người lạ nào ghé." : null;
    case "GIA_TREO":
      return used(w.equipment) >= capacity(w.equipment) ? "Xe không còn chỗ nào trống." : null;
    default:
      return null;
  }
}

/**
 * Một món có đáng để kể dấu vết không, ở ngay thẻ nó. Tách khỏi `gearEvidence` để trang Đồ
 * nghề đẩy mấy món ĐANG CÓ CHUYỆN lên đầu nhóm: tối nào cháy bánh thì cái lò điện phải nằm
 * chỗ mắt rơi vào, không phải nằm dưới ba món không liên quan.
 */
export const hasEvidence = (id: EquipId, w: SaveFile) => gearEvidence(id, w) !== null;

/** Món đã có rồi thì dấu vết là chuyện cũ — đừng kể. */
export const evidenceFor = (id: EquipId, w: SaveFile) =>
  has(w.equipment, id) || EQUIP[id].starting ? null : gearEvidence(id, w);
