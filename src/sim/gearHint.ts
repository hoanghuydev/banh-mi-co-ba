import type { SaveFile } from "../core/save";
import { EQUIP, capacity, has, used, type EquipId } from "./equipment";

// Dòng dấu vết chỉ kể thứ người đứng bán tự thấy hôm nay, không khuyên mua; chưa có chuyện thì im.

/** Số ổ/ngày coi là vắng — bản dựng nhắm ~18 ổ/ngày. */
const QUIET_DAY = 12;
/** `stall.cleanliness` (1 = sạch bóng). */
const DIRTY_END = 0.5;

const dem = (n: number, mot: string, nhieu = mot) => (n === 1 ? `một ${mot}` : `${n} ${nhieu}`);

export function gearEvidence(id: EquipId, w: SaveFile): string | null {
  const d = w.progress.today, e = w.econ.today;
  const bareHands = d.bareHands ?? 0, burnt = d.burnt ?? 0;
  // Thiếu cổng này thì ván chưa bán buổi nào có `served === 0` và loa than "bán được 0 ổ".
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
      // đọc trời, không đọc `lost`, để khỏi trùng câu với bộ bàn ghế
      if (w.progress.weather.startsWith("MUA")) return "Hôm nay mưa.";
      return w.progress.weather === "NANG_GAT" ? "Hôm nay nắng gắt, không ai đứng lâu nổi." : null;
    // Quạt, bình trà, bàn ghế cùng đọc `lost` nên mỗi món nói bằng cái chính nó đỡ được.
    case "QUAT_DIEN":
      return d.lost >= 2 && w.progress.weather === "NANG_GAT" ? "Trưa nay nắng, mấy người đứng chờ cứ lấy mũ quạt." : null;
    case "BINH_TRA":
      return d.lost >= 3 ? `Hôm nay ${dem(d.lost, "người")} chờ gần tới lượt rồi mới bỏ đi.` : null;
    case "TU_MAT": {
      if (e.wasted.length) return `Sáng nay bỏ ${e.wasted.join(", ")} vì hư.`;
      return e.soldOut ? "Hôm nay có người tới mà hết bánh." : null;
    }
    case "LOA_RAO":
      return d.served <= QUIET_DAY ? `Hôm nay bán được ${dem(d.served, "ổ")}. Cả buổi im ắng.` : null;
    case "BANG_HIEU":
      // `strangers` là khách lạ đã ghé, không phải người đi ngang.
      return d.served <= QUIET_DAY && (d.strangers ?? 0) === 0 ? "Hôm nay không có người lạ nào ghé." : null;
    case "GIA_TREO":
      return used(w.equipment) >= capacity(w.equipment) ? "Xe không còn chỗ nào trống." : null;
    default:
      return null;
  }
}

export const hasEvidence = (id: EquipId, w: SaveFile) => gearEvidence(id, w) !== null;

export const evidenceFor = (id: EquipId, w: SaveFile) =>
  has(w.equipment, id) || EQUIP[id].starting ? null : gearEvidence(id, w);
