import type { SaveFile } from "../core/save";
import { EQUIP, capacity, has, used, type EquipId } from "./equipment";


/**
 * DẤU VẾT — một dòng dưới món đồ chưa mua, kể lại chuyện HÔM NAY của chính người chơi để con
 * số `gain` bên trên có chỗ bám. Không nói món đồ làm được gì, nói CÁI VỪA XẢY RA VỚI MÌNH.
 *
 * BA LUẬT CỦA MỘT DÒNG DẤU VẾT
 *
 *  1. Chỉ kể thứ NGƯỜI ĐỨNG BÁN TỰ THẤY: tay mình, ổ bánh của mình, câu người ta nói với
 *     mình. Không có "mười hai người đi ngang không ghé" — đứng ở quầy thì không ai đếm được.
 *  2. Im khi chưa có chuyện gì — ngưỡng dưới đây để dòng nào hiện ra cũng có sức nặng.
 *  3. Không khuyên. "Bữa nay cháy ba ổ." chứ không phải "…, cân nhắc mua lò điện."
 *
 * Món nào không có dấu vết trung thực thì KHÔNG CÓ DÒNG NÀO.
 */

/** Dưới ngần này ổ thì buổi bán đó vắng thật — bản dựng nhắm ~18 ổ/ngày (econ.json `scale`). */
const QUIET_DAY = 12;
/** Quầy coi như dơ hẳn khi sạch sẽ tụt xuống dưới mức này (`stall.cleanliness`, 1 = sạch bóng). */
const DIRTY_END = 0.5;

const dem = (n: number, mot: string, nhieu = mot) => (n === 1 ? `một ${mot}` : `${n} ${nhieu}`);

export function gearEvidence(id: EquipId, w: SaveFile): string | null {
  const d = w.progress.today, e = w.econ.today;
  const bareHands = d.bareHands ?? 0, burnt = d.burnt ?? 0;
  /*
   * CHƯA ĐẾM TIỀN XONG THÌ CHƯA CÓ CHUYỆN GÌ ĐỂ KỂ: `econ.today.counted` chỉ bật ở `eveningCount`.
   * Thiếu cổng này thì ván chưa bán buổi nào có `served === 0`, và loa với bảng hiệu than "bán được 0 ổ".
   */
  if (!w.econ.today.counted) return null;

  switch (id) {
    case "KEP_GAP":
      return bareHands >= 3 ? `Hôm nay cầm tiền xong bốc thẳng vào nhân. ${dem(bareHands, "lần")}.` : null;
    case "LO_DIEN":
      return burnt >= 1 ? `Hôm nay cháy ${dem(burnt, "ổ")} trong lò.` : null;
    case "LONG_BAN":
      return w.stall.cleanliness <= DIRTY_END ? "Chiều ruồi bám quanh khay nhân." : null;
    case "GHE_BAN":
      return d.lost >= 2 ? `Hôm nay ${dem(d.lost, "người")} đứng đợi không nổi rồi về.` : null;
    case "DU_CHE":
      // cái dù đọc TRỜI, không đọc số người bỏ đi — để nó khỏi nói trùng câu với bộ bàn ghế
      if (w.progress.weather.startsWith("MUA")) return "Hôm nay mưa.";
      return w.progress.weather === "NANG_GAT" ? "Hôm nay nắng gắt, không ai đứng lâu nổi." : null;
    /*
     * Quạt điện và bình nước trà cùng đọc MỘT con số (người chờ không nổi rồi về) với bộ bàn ghế,
     * nên mỗi món phải nói bằng cái CHÍNH NÓ đỡ được: cái ghế là chỗ ngồi, cái quạt là cái nóng,
     * cái bình là mấy phút cuối trước khi người ta quay lưng.
     */
    case "QUAT_DIEN":
      return d.lost >= 2 && w.progress.weather === "NANG_GAT" ? "Trưa nay nắng, mấy người đứng chờ cứ lấy mũ quạt." : null;
    case "BINH_TRA":
      return d.lost >= 3 ? `Hôm nay ${dem(d.lost, "người")} chờ gần tới lượt rồi mới bỏ đi.` : null;
    case "TU_MAT": case "NOI_U": {
      // `econ.today.wasted` đã là chữ người đọc được ("0,4 lạng pate nhà") — `sim/day.expire`
      // dựng sẵn, nên ở đây khỏi tra lại bảng hàng hoá. Nồi ủ chỉ đụng tới xíu mại.
      const bo = e.wasted.filter((x) => id === "TU_MAT" || /xíu mại/i.test(x));
      if (bo.length) return `Sáng nay bỏ ${bo.join(", ")} vì hư.`;
      return id === "TU_MAT" && e.soldOut ? "Hôm nay có người tới mà hết bánh." : null;
    }
    case "LOA_RAO":
      return d.served <= QUIET_DAY ? `Hôm nay bán được ${dem(d.served, "ổ")}. Cả buổi im ắng.` : null;
    case "BANG_HIEU":
      // cái bảng kéo NGƯỜI LẠ, nên nó đọc đúng chỗ đó thay vì chia chung con số ế với cái
      // loa. `strangers` là khách lạ ĐÃ GHÉ — người chơi tự đếm được, không phải người đi ngang.
      return d.served <= QUIET_DAY && (d.strangers ?? 0) === 0 ? "Hôm nay không có người lạ nào ghé." : null;
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
