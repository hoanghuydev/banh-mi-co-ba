import type { Slot } from "../core/eventbus";
import { COUNTER_Y, STATION_ROW_Y } from "./map";

/**
 * Trạm làm việc trong quầy — DỮ LIỆU, không phải code.
 * Thêm một công đoạn = thêm một dòng ở đây, không phải sửa scene.
 *
 * Chuỗi thao tác v0.1 (xương sống của control loop), xếp trải dài theo chiều hẻm
 * để mỗi trạm có chỗ thở và người chơi phải thật sự DI CHUYỂN giữa các công đoạn:
 *   kệ (x4) → lò (x7) → thớt (x4) → rổ (x8) → chỗ đưa hàng (x12);
 *   thùng trà đá (x13) và bồn rửa tay (x15) là nhánh riêng.
 *
 * `ty` ĐỌC TỪ BẢN ĐỒ, không chép tay: trạm nằm trên mặt quầy phải theo quầy, trạm
 * nằm dọc tường sau phải theo tường. Hồi còn ghi số thì đẩy quầy ra một hàng là ba
 * cái trạm đứng chơ vơ giữa lối đi, không có gì báo — `assertWalkable()` chỉ soi chỗ
 * người đứng. Giờ muốn lệch cũng không lệch được.
 */

export type Hand =
  | "empty" | "loaf_cold" | "loaf_hot" | "loaf_burnt" | "loaf_filled" | "tea";

export const HAND_LABEL: Record<Hand, string> = {
  empty: "tay không",
  loaf_cold: "ổ bánh nguội",
  loaf_hot: "ổ bánh nóng",
  loaf_burnt: "ổ bánh cháy",
  loaf_filled: "ổ bánh đã kẹp",
  tea: "ly trà đá",
};

export const HAND_COLOR: Record<Hand, number> = {
  empty: 0x9aa6a9,
  loaf_cold: 0xc9a06a,
  loaf_hot: 0xe8b56a,
  loaf_burnt: 0x4a3b32,
  loaf_filled: 0xd9a45f,
  tea: 0x8fc9a8,
};

export type Station = {
  id: string;
  /** Ô người chơi phải đứng cạnh. */
  tx: number;
  ty: number;
  name: string;
  /** Động từ hiện trên gợi ý phím. */
  verb: string;
  /** Cột của bảng visibility (CANON §5) — tầng perception ở P1 sẽ đọc field này. */
  slot: Slot;
  /** Cầm gì thì dùng được trạm. */
  needs: Hand[];
  /** Xong thì tay cầm gì. */
  gives: Hand;
  /** 0 = bấm phát ăn ngay; > 0 = phải GIỮ phím, có thanh tiến trình. */
  holdMs: number;
  /**
   * Chỉ lò mới có: giữ quá mốc này thì cháy.
   * CANON T5 — rủi ro phải ĐỌC ĐƯỢC trước khi hành động, nên nó là thanh tiến trình
   * có vạch đỏ nhìn thấy, không phải một cú roll xúc xắc giấu sau lưng.
   */
  overcookMs?: number;
  spoils?: Hand;
};

export const STATIONS: Station[] = [
  {
    id: "shelf", tx: 4, ty: STATION_ROW_Y, name: "kệ nguyên liệu", verb: "lấy ổ bánh",
    slot: "UNDER_COUNTER", needs: ["empty"], gives: "loaf_cold", holdMs: 0,
  },
  {
    id: "oven", tx: 7, ty: STATION_ROW_Y, name: "lò than", verb: "nướng bánh",
    slot: "OVEN", needs: ["loaf_cold"], gives: "loaf_hot",
    holdMs: 1500, overcookMs: 2300, spoils: "loaf_burnt",
  },
  {
    id: "board", tx: 4, ty: COUNTER_Y, name: "thớt", verb: "kẹp nhân",
    // holdMs = 0: bấm E là MỞ BẢNG CHỌN NGUYÊN LIỆU, không phải giữ phím chờ xong.
    // Trụ cột T2 nằm ở đây — người chơi chọn nguyên liệu chứ không chọn câu nói.
    slot: "BOARD", needs: ["loaf_hot"], gives: "loaf_filled", holdMs: 0,
  },
  {
    /**
     * Chỗ để bánh trên quầy — ổ đã nướng chưa tới lượt kẹp, VÀ ổ đã gói sẵn.
     *
     * Lò có ba ngăn, thớt chỉ có một chỗ: nướng ba ổ một lượt xong là kẹt — ổ thứ hai
     * lấy ra khỏi lò thì không có chỗ nào đặt, đứng cầm trên tay mà tay thì cần rảnh để
     * làm việc khác. Nhận luôn ổ ĐÃ GÓI thì mở ra một lối chơi riêng: gói sẵn lúc vắng,
     * giờ cao điểm chỉ việc rút ra đưa.
     *
     * Nó KHÔNG phải một cái kho: ổ để đây vẫn NGUỘI đi như mọi chỗ khác, mà ổ nguội là
     * ổ khách chê (`WRONG_TEMP` lúc đưa). Gói sẵn là một CUỘC CƯỢC vào việc khách sẽ tới
     * kịp, không phải một nước đi thắng chắc.
     *
     * Đặt ở x=8, giữa thớt (x=4) và chỗ đưa hàng (x=12): cách mỗi bên 4 ô, xa hơn hẳn
     * bán kính với tới 1,6 ô, nên không bao giờ bấm E nhầm sang trạm bên cạnh.
     *
     * `needs` liệt kê cả ba tay dùng được vì đây là trạm HAI CHIỀU (để xuống / lấy lên),
     * mà `needs`/`gives` chỉ tả được một chiều — luật thật nằm ở `pressBasket`.
     */
    id: "basket", tx: 8, ty: COUNTER_Y, name: "chỗ để bánh", verb: "để bánh xuống",
    slot: "BOARD", needs: ["empty", "loaf_hot", "loaf_cold", "loaf_filled"], gives: "empty", holdMs: 0,
  },
  {
    /**
     * Chỗ đưa hàng. Nhận cả Ổ TRƠN chưa kẹp gì, không chỉ ổ đã gói.
     *
     * Có người gọi đúng "cho ổ bánh mì không" — và `Service` xưa nay vẫn bán được ổ
     * rỗng, tính đúng giá bánh mì không. Nhưng `needs` lại chỉ nhận `loaf_filled`, nên
     * muốn đưa một ổ trơn thì phải gác lên thớt, mở bảng kẹp nhân, rồi bấm gói mà không
     * chọn gì — ba thao tác để làm đúng cái việc KHÔNG LÀM GÌ CẢ. Nhận thẳng ổ trơn.
     *
     * Không mở đường cho ẩu: đưa ổ trơn cho người gọi ổ đầy đủ thì `diffDish` đếm thiếu
     * từng món một, nặng y như mọi lần làm sai khác.
     */
    id: "handoff", tx: 12, ty: COUNTER_Y, name: "quầy gọi món", verb: "đưa cho khách",
    slot: "HANDS", needs: ["loaf_filled", "loaf_hot", "loaf_cold", "tea"], gives: "empty", holdMs: 0,
  },
  {
    /**
     * Thùng rác TRONG QUẦY. Trước đây thùng rác duy nhất đứng ngoài vỉa hè (`STREET_BIN`)
     * và người chơi không với tới được — bỏ đồ đi là một phím Q bấm ở bất cứ đâu, món đồ
     * bốc hơi ngay tại chỗ đang đứng. Giờ bỏ đi là một VIỆC có chỗ chốn: đi tới thùng,
     * bấm E. Còn Q thì đổi nghĩa hẳn — ĐẶT XUỐNG SÀN, nhặt lại được (xem `StallScene.drop`).
     *
     * Ở x=10, giữa lò (x=7) và thùng trà đá (x=13): cách mỗi bên 3 ô, ngoài tầm với 1,6 ô
     * nên không có chỗ nào bấm E mà phân vân giữa hai trạm.
     */
    id: "bin", tx: 10, ty: STATION_ROW_Y, name: "thùng rác", verb: "bỏ đi",
    slot: "UNDER_COUNTER", needs: ["loaf_cold", "loaf_hot", "loaf_burnt", "loaf_filled", "tea"],
    gives: "empty", holdMs: 0,
  },
  {
    /**
     * Rửa tay. P1-01 §2.8 ghi 3,0 s; chơi thử thì dài gấp đôi mức đáng.
     *
     * Rửa tay là cái GIÁ của việc cầm tiền, mà cái giá đó đã đủ nặng ở chỗ khác rồi:
     * phải bỏ việc đang làm, đi hết chiều quầy, và trong lúc đó hàng vẫn dài ra. Ba
     * giây đứng chôn chân ở vòi chỉ cộng thêm thời gian chết, không cộng thêm quyết
     * định nào. 1,5 s vẫn đủ lâu để khách kịp NHÌN THẤY mình rửa (P3-04 C1) — mà đó
     * mới là thứ con số này tồn tại để bảo vệ.
     */
    id: "sink", tx: 15, ty: STATION_ROW_Y, name: "rửa tay", verb: "rửa tay",
    slot: "HANDS", needs: ["empty"], gives: "empty", holdMs: 1500,
  },
  {
    id: "tea", tx: 13, ty: STATION_ROW_Y, name: "thùng trà đá", verb: "rót ly trà đá",
    slot: "UNDER_COUNTER", needs: ["empty"], gives: "tea", holdMs: 600,
  },
];

/** Tra nhanh theo ô, dùng lúc dựng cảnh. */
export function stationAtTile(tx: number, ty: number) {
  return STATIONS.find((s) => s.tx === tx && s.ty === ty) ?? null;
}

/** Bán kính với tới một trạm, tính bằng ô. */
const REACH = 1.6;
/**
 * Trạm đang chọn được GIỮ cho tới khi có trạm khác gần hơn hẳn — hệ số này là "gần hơn
 * hẳn" bằng bao nhiêu, đo trên bình phương khoảng cách (0,62 ≈ gần hơn 21% quãng đường).
 *
 * Thùng trà đá ở ô (13,1) và bồn rửa tay ở (15,1) chỉ cách nhau 2 ô, mà bán kính với
 * tới là 1,6 ô mỗi bên: đứng ở quãng giữa thì nhích nửa bước là trạm được chọn nhảy qua
 * lại, và cú E vừa bấm rơi vào trạm KHÁC với trạm người chơi đang đọc tên trên dòng
 * nhắc. Bám dính một chút thì mép lật nằm ở một chỗ cố định thay vì rung ngay dưới chân.
 */
const STICKY = 0.62;

/**
 * Trạm người chơi với tới được, hoặc null.
 *
 * `current` là trạm của frame trước. Truyền vào thì hàm BÁM lấy nó (xem `STICKY`);
 * không truyền thì vẫn là "gần nhất thắng" như cũ, nên test và `headless` gọi được
 * mà không phải dựng thêm state.
 */
export function stationNear(wx: number, wy: number, current?: Station | null): Station | null {
  const dist2 = (s: Station) => {
    const dx = s.tx + 0.5 - wx, dy = s.ty + 0.5 - wy;
    return dx * dx + dy * dy;
  };
  let best: Station | null = null;
  let bestD = REACH * REACH;
  for (const s of STATIONS) {
    const d = dist2(s);
    if (d < bestD) { bestD = d; best = s; }
  }
  if (!current || !best || best === current) return best;
  // Trạm cũ còn với tới được thì phải gần hơn HẲN mới đổi — không thì ở yên.
  const dCur = dist2(current);
  if (dCur <= REACH * REACH && bestD > dCur * STICKY) return current;
  return best;
}

/** Vì sao chưa dùng được trạm — nói thẳng ra, không để người chơi bấm vào khoảng không. */
export function blockedReason(s: Station, hand: Hand): string | null {
  if (s.needs.includes(hand)) return null;
  if (hand === "loaf_burnt") return "bánh cháy rồi, đem bỏ thùng rác";
  if (s.id === "handoff") return "chưa có gì để đưa";
  if (s.id === "board" && hand === "loaf_cold") return "bánh còn nguội, nướng đã";
  if (hand === "empty") return `cần cầm ${s.needs.map((h) => HAND_LABEL[h]).join(" hoặc ")}`;
  return `đang cầm ${HAND_LABEL[hand]}`;
}
