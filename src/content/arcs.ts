/**
 * Arc 40 ngày của 12 NPC — P4-01 (hồ sơ) + P4-02 §2.5 (tín hiệu báo trước từng ngày).
 *
 * File này là DỮ LIỆU có điều kiện: mỗi người một hàm "hôm nay người này làm gì khác
 * thường". Lịch nền (thứ nào, mấy giờ) nằm ở `npcs.ts`; ở đây chỉ có chỗ LỆCH: vắng, tới
 * trễ, gọi khác, nói thêm một câu. Luật của P4-01 §2.0 áp dụng cho mọi dòng dưới đây:
 *  · L4 — không một chữ về chiến tranh (CI chặn build).
 *  · L5 / Đừng-1 — chuyện nhà họ chỉ được NÓI RA, không mô phỏng.
 *  · B2 (P4-02) — không tín hiệu nào được đánh dấu: chúng chỉ là một câu, một giờ tới khác.
 *  · T2 — câu gọi món nguyên văn phải tự nó đủ để làm đúng ổ (có test đọc lại câu).
 *
 * ⚠️ Lời thoại: bản dựng chép nguyên văn P4-01/P4-03 khi doc có; câu nào doc không có mà
 * bản dựng phải viết thêm thì đánh dấu `// viết thêm` — CHỦ BIÊN VĂN HOÁ PHẢI DUYỆT (P4-05 §2.8).
 */
import type { Ingredient, OrderIntent, OrderSpec } from "../sim/order";
import { levelsOf } from "../sim/order";
import { weekdayOf, type Weekday } from "../sim/schedule";

// ─────────────────────────────────────────────────────────────── kiểu

export type StoryFlags = Record<string, number | boolean | string>;

/** Thứ arc được phép đọc — KHÔNG đọc điểm quan hệ ra thành ngưỡng lộ liễu, chỉ đọc chuyện đã xảy ra. */
export type ArcCtx = {
  day: number;
  flags: StoryFlags;
  /** Đếm số lần — "đã đưa trà cho bà Bảy mấy lần", "đã làm đúng đơn chị Hạnh mấy lần"… */
  count: (key: string) => number;
  rain: boolean;
  /** Đồ nghề đang có (đèn ca tối, bảng QR…). */
  owns: (equip: string) => boolean;
  /** Người này có ký ức WRONG_NAME không (chị Lan đi sớm — P4-03 §2.3). */
  hasWrongName: (npcId: string) => boolean;
};

/** Một câu nói có hẹn giờ — giây kể từ lúc khách gọi món xong (after) / nhận bánh (served). */
export type Line = string | { text: string; by?: string; delay?: number };

export type ArcDay = {
  absent?: boolean;
  /** Giờ tới (phút trong ngày) — thay giờ của lịch nền. */
  at?: number;
  /** Đơn hôm nay khác đơn quen (vẫn là câu nguyên văn). */
  order?: OrderSpec;
  /** Mua thêm ổ nữa — gọi SAU khi nhận ổ trước (một người, một hàng, từng ổ một). */
  more?: OrderSpec[];
  /** Nói thêm sau khi gọi món. */
  after?: Line[];
  /** Nói sau khi nhận bánh — `ok` chỉ khi ổ đúng đơn, `any` lúc nào cũng nói. */
  served?: { ok?: Line[]; any?: Line[] };
  /** Chỉ đi ngang, không mua (bà Bảy thứ Ba/Năm, chú Kiệt gật đầu, bà Sáu rao). */
  pass?: { lines?: Line[]; stay?: number; nod?: boolean };
  /** Ngồi im mấy giây rồi mới gọi (anh Dũng ngày 11). */
  holdSec?: number;
  /** Trả tiền kiểu này (đổi hàng với bà Sáu = 0₫). */
  barter?: boolean;
  /** Không có câu "như mọi bữa" hôm nay (thầy Phúc mất quyền nói tắt — ML-05). */
  noShort?: boolean;
  tag?: string;
};

/** Khách đặc biệt không có tên / không thuộc lịch nền (SK-07, SK-18, SK-26, SK-33…). */
export type ExtraVisit = ArcDay & {
  key: string;
  /** Người có tên (đi ngang, ghé thêm) — hoặc null: khách vô danh có kịch bản. */
  npcId: string | null;
  at: number;
  name?: string;
  /** Chỉ số kiểu người trong `WALKIN_STYLES` (khách vô danh). */
  style?: number;
  /** Đưa tờ tiền này (SK-01: 500.000₫ lúc 6h30). */
  paysWith?: number;
};

const at = (h: number, m = 0) => h * 60 + m;

/** SK-32 — 4 phút hay nhất về viết của cả dự án (P4-03). Nói về NGHỀ; về mình đúng một câu. */
const KIET_TALK: Line[] = [
  { text: "Cái lò đó bên trái nó yếu. Con để khay lệch qua phải chừng hai lóng tay là đều.", delay: 0.8 },
  { text: "Pate bên chợ mắc hơn ba ngàn mà nó để được ba ngày. Chỗ rẻ để hai ngày là hôi liền. Tính ra không rẻ.", delay: 5.2 },
  { text: "Trời ẩm vầy bánh nó mềm nhanh. Con đừng nướng sẵn. Nướng từng ổ thôi, cực mà bán được giá.", delay: 10 },
  { text: "Tui làm công cho lò bánh chín năm. Chín năm mới dám ra riêng.", delay: 14.6 },
  { text: "(chú lôi điện thoại ra, khoe tấm hình mô hình Gundam mới ráp xong — rồi hơi ngượng)", delay: 18.4 },
];
const WD = (d: number): Weekday => weekdayOf(d);
const isWork = (d: number) => !["SAT", "SUN"].includes(WD(d));

/** Dựng một đơn nguyên văn. `intent` thiếu trường nào thì lấy mặc định của câu gọi (ớt 1, tương 1). */
export function spec(intent: Partial<OrderIntent>, phrase?: string, short?: string): OrderSpec {
  const it: OrderIntent = { nhan: [], rau: "day-du", ot: 1, tuong: 1, usual: false, ...intent };
  return { intent: it, levels: levelsOf(it), phrase, short };
}
const KHONG: Partial<OrderIntent> = { nhan: [], rau: "khong", ot: 0, tuong: 0 };
const withAlt = (s: OrderSpec, alt?: OrderSpec["alt"]): OrderSpec => (alt ? { ...s, alt } : s);
const NO_HANH: Ingredient[] = ["hanhngo"];

// ─────────────────────────────────────────────────────────────── đơn hàng quen (P4-01)

/**
 * Đơn quen của từng người — câu NGUYÊN VĂN của P4-01 mục "Đơn hàng quen". Có thể đổi theo
 * arc (chị Hạnh đổi chữ, anh Bảo được dạy ăn cay, cô Mai còn một ổ).
 */
export function usualOf(npcId: string, c: ArcCtx, atMin = 0): OrderSpec | null {
  const d = c.day;
  switch (npcId) {
    case "BA_BAY":
      // khẩu vị ẩn: KHÔNG ớt — bà chưa từng nói, bà chỉ gỡ ra, đặt lên tờ giấy gói
      return withAlt(spec({ nhan: ["thit"], rau: "it" }, "Cho bà ổ thịt, ít rau thôi con, bà nhai không nổi.", "Ổ của bà đó con."), { ot: 0 }); // short: viết thêm
    case "CHU_TU":
      // ML-02: từ ngày 23 chú bớt ớt mà không nói — tự bớt thì chú nhìn lên một giây
      return withAlt(spec({ dayDu: true, nhan: ["pate", "thit", "chalua"], ot: 2 }, "Cho chú ổ đầy đủ, nhiều ớt, cho xin bịch.", "Như mọi bữa nghen con."), d >= 23 ? { ot: 0 } : undefined);
    case "ANH_DUNG":
      // ML-08: không nước sốt nhiều — anh chỉ lau tay vào quần
      return withAlt(spec({ nhan: ["xiumai"] }, "Ổ xíu mại, gói lẹ giùm anh, anh có cuốc.", "Như cũ nghen em, anh có cuốc."), { tuongot: 0 }); // short: viết thêm
    case "CHI_LAN":
      // 23 ngày y hệt từng chữ — chị KHÔNG BAO GIỜ nói tắt (P4-01 NPC-04)
      return spec({ nhan: ["chalua"], ot: 0, bo: NO_HANH }, "Cho em ổ chả lụa, không ớt, không hành. Gói mang về.");
    case "BE_SU":
      // trà sữa (P4-01: từ ngày 14) CHƯA có trong bản dựng — bé giữ đơn bánh mì không cả mùa
      return spec(KHONG, "Cho con ổ bánh mì không, chấm sữa á cô.");
    case "ONG_HAI":
      // HAI đơn quen: sáng thì nhớ mình thích gì; sau 10 giờ thì không (P4-01 NPC-06)
      return atMin >= at(10)
        ? spec({ dayDu: true, nhan: ["pate", "thit", "chalua"] }, "Ổ gì cũng được con ơi. Ờ... đầy đủ. Đầy đủ đi.")
        : spec({ nhan: ["opla"] }, "Cho chú ổ ốp la, hai trứng. Chú ăn tại chỗ. Cho xin ly trà đá.", "Như bữa sáng nghen con."); // short: viết thêm
    case "CO_MAI":
      if (d >= 30) return spec({ dayDu: true, nhan: ["pate", "thit", "chalua"], bo: NO_HANH, usual: true }, undefined, "Cho cô một ổ.");
      // ML-06: ổ đầy đủ là của con Hương — và Hương ăn cay
      return withAlt(spec({ dayDu: true, nhan: ["pate", "thit", "chalua"] }, "Cho cô hai ổ, một đầy đủ một không hành. Cô ăn với con Hương.", "Như mọi bữa nghen con, hai ổ."), { ot: 2 }); // short: viết thêm
    case "THAY_PHUC":
      return spec({ nhan: ["pate"], rau: "it", bo: NO_HANH }, "Cho thầy ổ pate, ít rau, đừng bỏ ngò. Ăn tại chỗ.", "Như mọi bữa nghen con.");
    case "CHI_HANH": {
      // arc hoà nhập đo bằng TỪ VỰNG (P4-01 NPC-09): M3 tự sửa (13, hoặc 20 nếu chưa đủ ba lần
      // làm đúng) · M5 chữ "nghen" (27, và chỉ khi M3 đã tới)
      const m3 = d >= 20 || (d >= 13 && c.count("usual:CHI_HANH") >= 3);
      const pate = { nhan: ["pate"] as Ingredient[], rau: "it" as const };
      if (m3 && d >= 27) return spec(pate, "Cho chị ổ pate, ít ngò, ly trà đá. Cảm ơn em nghen.");
      if (m3) return spec(pate, "Cho chị một ổ pa-tê... à, cho ít ngò. Ly trà đá nữa em.");
      return spec(pate, "Chị lấy một cái bánh mì pa-tê. Cho chị xin ít rau mùi. Với một cốc trà đá.");
    }
    case "ANH_BAO":
      // ML-11: người chơi TỰ bỏ thêm ớt 4 lần → anh tự nói "cho em nhiều ớt chút"
      if (c.flags.baoAsksChili) return spec({ dayDu: true, nhan: ["pate", "thit", "chalua"], ot: 2 }, "Dạ... ổ đầy đủ, cho em nhiều ớt chút. Dạ.");
      // ML-11: anh ăn cay được hơn anh gọi — anh không biết mình được phép xin
      return withAlt(spec({ dayDu: true, nhan: ["pate", "thit", "chalua"] }, "Dạ... ổ đầy đủ. Dạ.", "Dạ... như mọi bữa. Dạ."), { ot: 2 }); // short: viết thêm
    case "BA_SAU":
      return spec({ ...KHONG, usual: false }, "Đổi hôn con? Chén tàu hũ lấy ổ bánh không.");
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────── ngày của từng người

/** Hôm nay người này có gì khác thường. `atMin` = giờ lịch nền đã rút (null = lịch nền nói vắng). */
export function arcToday(npcId: string, c: ArcCtx, atMin: number | null): ArcDay | null {
  const d = c.day;
  switch (npcId) {
    case "BA_BAY": {
      if (d === 18) return { absent: true };                                   // "ngày 18: bà không tới"
      if (d === 36) return { at: at(6, 20), after: ["Bà đi coi hát về nè. Tuồng hay dữ lắm."] }; // M4 — viết thêm (doc: cầm tờ chương trình)
      if (d === 40) return { at: at(6, 15), served: { any: ["Mai bà lại mua nghen."] } };
      if (d === 13 && WD(d) === "SAT") return { more: [spec({ dayDu: true, nhan: ["pate", "thit", "chalua"] }, "Thêm một ổ đầy đủ nữa con. Ổ này bà gửi.")], tag: "BAY_M2" };
      if (WD(d) === "SAT") return { more: [spec({ dayDu: true, nhan: ["pate", "thit", "chalua"] }, "Thêm một ổ đầy đủ nữa con. Ổ này bà gửi.")] }; // viết thêm
      // SK-13 ngày 6 ở `story` (cần biết người chơi đã mời trà chưa); cải lương mỗi ~5 ngày sau đó
      if (c.flags.caiLuong && atMin !== null && d % 5 === 1) return { after: ["Bà nói thiệt, đào bây giờ ca không có hơi."] };
      return null;
    }
    case "CHU_TU": {
      if (d >= 30) return { absent: true };                                    // M5 — vĩnh viễn, chủ ý
      if (d === 22) return {
        order: spec({ dayDu: true, nhan: ["pate", "thit", "chalua"], ot: 0 }, "Như mọi bữa, mà thôi khỏi ớt con. Bữa nay chú ăn lạt."),
        tag: "TU-S1",
      };
      if (d === 26) return {
        at: at(7, 10), tag: "TU-S2",
        after: [{ text: "Công ty chú nó tính dời qua bên Bình Dương đó con.", delay: 3 }, { text: "Ờ mà bữa nay đồ chua ngon nghen.", delay: 6.5 }],
      };
      if (d === 29) return {
        at: at(7, 10), tag: "TU-S3",
        order: spec({ nhan: ["thit"], rau: "it", ot: 0 }, "Bữa nay chú ăn ít. Cho chú ổ thịt thôi, ít rau, khỏi ớt."),
      };
      if (atMin !== null && c.rain) return { at: atMin - 5 };                 // mưa: đi sớm cho kịp ca
      return null;
    }
    case "ANH_DUNG": {
      if (d >= 18 && d !== 34 && d !== 40) return { absent: true };            // M4 — chạy đêm (ca tối ở `story`)
      if (d === 3) return { after: ["Bữa nay mặc đồ mới nè em. Đứng đầu hẻm giờ ai kêu nữa."] }; // M1 — viết gọn từ hai câu của doc
      if (d === 11) return { holdSec: 40, tag: "SK-15" };
      if (d === 15) return { after: [{ text: "Ủa quán em mấy giờ dọn vậy?", delay: 3 }], tag: "DUNG-S1" };
      if (d === 16) return { at: at(7, 45), tag: "DUNG-S2" };                   // trễ 25 phút, không kêu trà đá
      if (d === 17) return { after: [{ text: "Chắc anh chạy đêm. Ngày giờ đông tài xế quá.", delay: 3 }], tag: "DUNG-S3" };
      if (d === 34) {
        const girl = c.flags.dungStory
          ? [spec({ nhan: ["xiumai"], usual: true }, undefined, "Cho con ổ như ba.")]
          : [];
        return { at: at(7, 30), more: girl, after: c.flags.dungStory ? [] : ["Lâu quá hả em. Anh chạy đêm quen rồi."], tag: "DUNG-M5" };
      }
      if (d === 40) return (c.owns("DEN_CA_TOI") || c.flags.dungStory)
        ? { at: at(7, 20), served: { any: ["Thôi khỏi, anh ngồi đây ăn."] }, tag: "DUNG-KET" }
        : { absent: true };
      if (atMin === null && c.rain) return { at: at(7, 25) };                   // mưa: anh chạy ngang NHIỀU hơn
      return null;
    }
    case "CHI_LAN": {
      // đi sớm được, giữ lại không được (P4-03 §2.3): gọi sai tên → biến mất từ ngày 20
      const leave = c.hasWrongName("CHI_LAN") && d >= 20 ? 20 : 24;
      if (d >= leave && d <= 39) return { absent: true };
      if (d === 40) return { absent: true };                                   // cảnh 10h20 là của `story` (SK-42)
      if (d === 14) return { at: at(9, 30), pass: { stay: 3 }, tag: "LAN-M2" }; // để miếng lót ly lên nắp thùng đá
      if (d === 15 && c.flags.coasterUsed) return { served: { any: [{ text: "Hôm nay có đồ chua mới hả?", delay: 1.2 }] } };
      if (d === 19) return { at: at(7, 11), tag: "LAN-S1" };
      if (d === 20) return { order: spec({ nhan: ["chalua"], ot: 0, bo: NO_HANH }, "Cho em ổ chả lụa, không ớt, không hành."), tag: "LAN-S2" };
      if (d === 23) return { after: [{ text: "...Dạ, thôi em.", delay: 2.5 }], tag: "LAN-S4" };
      return null;
    }
    case "BE_SU": {
      if (d === 10 && c.flags.clipDay === 10) return { after: ["Cô ơi! Bốn trăm ngàn view nè cô! Cái này lên xu hướng là cô đông khách luôn đó!"] };
      if (d === 17) return { after: ["Con mua được cái gimbal rồi nè cô!"] };   // viết thêm
      if (d === 28) return { after: ["Cô coi nè — huy chương đồng Toán cấp quận đó. Con hổng quay cái này đâu, chán thấy mồ."] };
      if (d === 40) return { after: [{ text: "Con quay được hông cô?", delay: 2 }] };
      return null;
    }
    case "ONG_HAI": {
      if (d >= 39) return { absent: true };
      const am = { at: at(7, 30) };
      // SK-29 — người chơi chờ chú buổi sáng: chú ngồi vẽ. Tay run. Vẽ lại hai lần. KHÔNG có bản "vẽ đẹp".
      if (c.flags.signChoice === "hai" && !c.flags.signPainted && atMin !== null && atMin < at(10)) return {
        tag: "SK-29", after: [{ text: "(chú ngồi xuống, vẽ lại mấy chữ trên bảng hiệu — chậm, vẽ lại hai lần)", delay: 3 }, { text: "Lâu quá không cầm cọ.", delay: 9 }],
      };
      if (d === 5) return { ...am, after: ["Cái quạt của bà Ba hư hả? Để chú coi cho, khỏi tiền."] };
      if (d === 8) return { at: at(7, 12), tag: "SK-18-HAI" };                 // có mặt để chặn thằng nhại giọng
      if (d === 12) return am;                                                  // sáng ngoài lịch (sửa máy lạnh gấp)
      if (d === 27) return { ...am, after: [{ text: "Con gái chú gọi hoài, kêu lên ở chung cho gần.", delay: 3 }], tag: "HAI-S1" };
      if (d === 34) return { ...am, after: ["Chú đang dọn đồ trong nhà. Quạt cũ cho hết rồi."], tag: "HAI-S2" };
      if (d === 36) return { ...am, after: ["Con gái chú nó lên rồi đó. Tuần này chú dọn đi."], tag: "HAI-S3" };
      if (d === 38) return { ...am, after: ["Áo mới đó con. Con gái mua. Mai chú đi rồi."], tag: "HAI-S4" };
      // sáng hôm sau một buổi "sau 10 giờ": ông xin lỗi vì không nhớ (P4-01 NPC-06 câu #5)
      if (atMin !== null && atMin < at(10) && c.flags.haiPmDay === d - 1) return { after: [{ text: "Hôm qua chú có nói gì bậy không con?", delay: 3 }] };
      return null;
    }
    case "CO_MAI": {
      if (d === 9) return { after: [{ text: "Con ghi sổ đi, cuối tháng tính một lần. Cô cũng ghi vậy.", delay: 3 }], tag: "SK-20" };
      if (d === 14) return { after: [{ text: "Tiệm cô gắn cái QR lâu rồi. Tụi nhỏ bây giờ hổng cầm tiền mặt đâu con.", delay: 3 }], tag: "SK-23" };
      if (d === 27) return { after: [{ text: "Bốn triệu đó con. Bốn triệu một chậu mà nó chết queo. Tui tưới đúng bài mà.", delay: 3 }], served: { any: ["Nè, nhánh trầu bà. Cái này thì không chết được đâu con, yên tâm."] }, tag: "SK-30" };
      if (d === 30) return { served: { ok: [{ text: "Ừ. Còn một thôi.", delay: 1.5 }] }, tag: "MAI-M5" };
      if (d === 40) return { at: at(8, 10) };                                  // luôn tới — chốt sổ ở màn kết
      // ổ thứ hai là của cô — cô ghét ớt
      if (d < 30) return { more: [withAlt(spec({ dayDu: true, nhan: ["pate", "thit", "chalua"], bo: NO_HANH }, "Còn ổ đầy đủ không hành nữa con."), { ot: 0 })] };
      return null;
    }
    case "THAY_PHUC": {
      if (d === 20 || d === 21) return { absent: true };                       // M3 — đi giải xe đạp Vũng Tàu
      if (d === 11) return { served: { any: [{ text: "Ghi đi con. Trí nhớ là thứ mình tưởng mình có.", delay: 1.5 }] }, tag: "SK-21" };
      if (d === 19) return { after: [{ text: "Cuối tuần thầy đạp xe đi Vũng Tàu.", delay: 3 }] };
      if (d === 22) return { after: ["Đèo bên đó dốc thấy mồ, mà thầy lên được."] }; // viết thêm
      if (d === 32) return { served: { any: [c.flags.notebookEntries ? "Con ghi kỹ hơn thầy tưởng." : "Không sao. Có người nhớ bằng tay, có người nhớ bằng bụng."] }, tag: "PHUC-M4" };
      if (d === 40) return { at: at(6), more: [spec({ nhan: ["pate"], rau: "it", bo: NO_HANH }, "Thêm một ổ pate nữa, ít rau, đừng bỏ ngò. Để dành.")] };
      if (c.flags.phucLostShort && Number(c.flags.phucLostShort) === d - 1) return { noShort: true };
      return null;
    }
    case "CHI_HANH": {
      if (d === 9 || d === 10) return { absent: true };                        // mua chỗ khác sau SK-18
      if (d === 22) return { after: ["Ở đây nắng thật đấy."] };               // M4: câu duy nhất với chị Lan — bản dựng: nói ra quầy
      if (d === 40) return { at: at(7, 15), served: { any: ["Cho chị chụp một tấm cái xe nhé."] } }; // M6 — tấm ảnh ở màn kết
      return null;
    }
    case "ANH_BAO": {
      if (d >= 19 && d <= 21) return {
        at: at(6, 20),
        order: spec({ dayDu: true, nhan: ["pate", "thit", "chalua"] }, "Cho em hai ổ đầy đủ, em đi thi."),
        more: [spec({ dayDu: true, nhan: ["pate", "thit", "chalua"] }, "Ổ nữa đầy đủ luôn. Dạ.")],
      };
      if (d === 29) return { order: spec(KHONG, "Cho em ổ bánh mì không thôi."), tag: "SK-31" };
      if (d === 30 && c.flags.baoSneak) return { absent: true };
      if (d === 31 && c.flags.baoSneak) return { after: ["Hôm bữa cô bỏ pate cho em. Em gửi tiền nè cô."], tag: "BAO-TRA" };
      if (d === 40) return (c.flags.baoRespect || c.flags.baoAsksChili) && !c.flags.baoSneak
        ? { served: { any: [{ text: "Cảm ơn cô.", delay: 1 }] }, tag: "BAO-KET" }
        : { absent: true };
      return null;
    }
    case "BA_SAU": {
      if (d >= 35 && d !== 40) return { absent: true };                        // M4 — bán cố định chỗ khác
      if (d === 40) return { at: at(9, 10), order: spec(KHONG, "Bữa nay tui hết tàu hũ. Đổi bằng cái gì giờ ta. Cho tui ổ bánh mì không."), barter: true };
      // SK-02: rủ đổi ngày 3, hỏi lại ngày 6 nếu bị từ chối; từ chối hai lần → không bao giờ hỏi nữa
      const refused = c.count("barterRefused");
      const offer = d === 3 || (d === 6 && refused === 1) || (c.count("barterAccepted") > 0 && refused < 2 && d % 3 === 0);
      if (d === 22) return { after: ["Tui chạy xe tải ba năm đó nghen. Tuyến Mỹ Tho."], barter: offer, tag: "SK-28" };
      if (d === 25 && !c.flags.knowsSign) return { pass: { lines: ["Cái bảng hiệu đó hồi xưa ông Hải viết đó. Chữ đẹp thấy mồ."], stay: 5 } };
      if (d === 28) return { at: at(9, 10), pass: { lines: ["Nắng quá con ơi."], stay: 4 }, tag: "SAU-S1" };
      if (d === 33) return { pass: { lines: ["Nắng quá."], stay: 25 }, tag: "SAU-S3" }; // ngồi nghỉ ở ghế xe — chưa từng
      if (d === 34) return { pass: { lines: ["Con coi giùm tui mười lăm phút. Tui qua bển cái."], stay: 5 }, tag: "SK-35" };
      if (offer) return { barter: true, tag: "SK-02" };
      return { pass: { lines: ["Ai... tàu hũ nước đường hông..."], stay: 2 } };
    }
    case "CHU_KIET": {
      if (d < 5 || WD(d) === "SUN" || d === 38) return { absent: true };      // mở xe ngày 5 · CN nghỉ · đám cưới chắn
      // SK-32 — chỉ mở nếu ngày 25 người chơi đem hũ đồ chua qua: một buổi, hai người cùng nghề
      if (d === 31 && c.flags.kietHelped) return { at: at(10, 20), pass: { lines: KIET_TALK, stay: 22 }, tag: "SK-32" };
      // truyền xe (P4-04 §2.3 biến thể 2): SK-32 + đem bánh qua ngày 36–39 → ngày 40 chú dừng lại
      if (d === 40 && c.flags.kietTalked && c.flags.kietBread) return {
        at: at(6, 10), tag: "SK-41-STOP",
        pass: { nod: true, stay: 9, lines: [{ text: "Nóng rồi hả.", delay: 0.8 }, { text: "Nghe nói bà Ba nghỉ.", delay: 3.4 }, { text: "Cái xe đó tốt. Đừng bán ve chai.", delay: 6.6 }] },
      };
      if (c.flags.kietBread && d === Number(c.flags.kietBread) + 1) return { at: at(6, 10), pass: { nod: true, lines: ["Ờ."], stay: 2 } };
      if (d === 5) return { at: at(6, 10), pass: { lines: ["Bánh mì nóng đây! Mười lăm ngàn thôi bà con ơi!"], stay: 3 }, tag: "SK-04" };
      if (d === 36) return { at: at(6, 10), pass: { lines: ["Quẹt thẻ, chuyển khoản đều được nghen bà con!"], stay: 3, nod: true }, tag: "SK-37" };
      if (d === 40) return { at: at(6, 10), pass: { nod: true, stay: 2 }, tag: "SK-41" };
      return { at: at(6, 10), pass: { nod: true, stay: 1.5 } };
    }
  }
  return null;
}

/** Người đi ngang không có trong lịch nền (bà Bảy thứ Ba/Năm, cô Mai chạy bộ thứ Hai) + khách có kịch bản. */
export function extraVisits(c: ArcCtx): ExtraVisit[] {
  const d = c.day, out: ExtraVisit[] = [];
  // bà Bảy T3/T5 chỉ đi ngang chào (vẫn nhận ly trà đá — P4-01 NPC-01)
  if ((WD(d) === "TUE" || WD(d) === "THU") && d !== 18) {
    const line = d === 25 ? "Ủa, ông bên kia lau dao bằng cái khăn vắt vai kìa. Đồ hôm qua mà còn bán." : undefined; // SK-11
    out.push({ key: "bay-ngang", npcId: "BA_BAY", at: at(7, 50), pass: { lines: line ? [line] : [], stay: line ? 5 : 2.5 }, tag: line ? "SK-11" : undefined });
  }
  // cô Mai chạy bộ ngang lúc mở hàng, thứ Hai (P4-01 NPC-07: ngày 1, 8, 15, 22, 29, 36)
  if (WD(d) === "MON") out.push({ key: "mai-chay", npcId: "CO_MAI", at: at(6, 5), pass: { stay: 1.2, nod: true } });
  // bà Sáu vòng 2 (bản dựng dồn vòng chiều về 10h30 — ngày bán chỉ tới 11h); ngày 31 mất vòng 2
  if (d < 35 && d !== 31 && d !== 34) out.push({ key: "sau-vong2", npcId: "BA_SAU", at: at(10, 30), pass: { lines: ["Ai... tàu hũ nước đường hông..."], stay: 2 }, tag: d === 31 ? "SAU-S2" : undefined });

  // SK-42 · 🔴 CÚ QUAY LẠI — ngày 40, 10h20, DÙ NGƯỜI CHƠI CHƠI THẾ NÀO (P4-04 R3). Chị không giải
  // thích đi đâu (R1). Chị hỏi "Còn ổ nào không em?" — ổ gì là TRÍ NHỚ của người chơi, như ngày 1.
  if (d === 40) out.push({
    key: "lan-40", npcId: "CHI_LAN", at: at(10, 20), tag: "SK-42",
    order: spec({ nhan: ["chalua"], ot: 0, bo: NO_HANH, usual: true }, "Cho em ổ chả lụa, không ớt, không hành. Gói mang về.", "Còn ổ nào không em?"),
    served: { ok: [{ text: "...Em còn nhớ.", delay: 1.5 }], any: [{ text: "Cảm ơn em.", delay: 4.2 }, { text: "Em bán ở đây tới chừng nào?", delay: 8.5 }] },
  });
  // SK-27 · ở lại hẻm hôm đờn ca: bà Bảy ghé — lần DUY NHẤT bà ngồi lại, nghe cải lương bằng loa ngoài
  if (d === 21 && !c.flags.dinhCa) out.push({ key: "bay-dinh", npcId: "BA_BAY", at: at(10, 25), tag: "SK-27-BAY",
    pass: { stay: 24, lines: [{ text: "(bà ngồi xuống ghế nhựa, mở loa ngoài — một bài vọng cổ)", delay: 1 }] } });
  // SK-01 · khách thứ hai trong ngày 2 đưa tờ 500 ngàn lúc 6h30
  if (d === 2) out.push({ key: "sk01", npcId: null, at: at(6, 30), style: 7, paysWith: 500_000, tag: "SK-01" });
  // SK-18 · khách vãng lai nhại giọng chị Hạnh (người nhại LUÔN là vô danh — P4-03 lằn ranh §14.1)
  if (d === 8) out.push({
    key: "sk18", npcId: null, at: at(7, 17), style: 0, tag: "SK-18",
    after: [{ text: "Cái bánh mì! Rau mùi! Ha ha, ngoài Bắc mới dzô hả chị?", delay: 0.5 }, { text: "Ê, kỳ vậy cha nội.", by: "ONG_HAI", delay: 3 }],
  });
  // SK-26 · người áo cam — ghé đều 11 ngày, không có tên, rồi thôi
  if (d >= 9 && d <= 19) out.push({ key: "sk26", npcId: null, at: at(7, 32), style: 0, name: "anh áo cam", order: spec({ nhan: ["xiumai"], rau: "khong" }, "Cho một ổ xíu mại, không rau."), tag: "SK-26" });
  // SK-07 · khách cáu vô cớ — và bạn không làm gì sai. KHÔNG có nhánh làm anh ta dịu lại.
  if (d === 15) out.push({
    key: "sk07", npcId: null, at: at(7, 24), style: 5, tag: "SK-07",
    served: { any: [{ text: "Sao lâu vậy em? Tui đứng đây nãy giờ nè.", delay: 0.4 }, { text: "Thôi. Cảm ơn.", delay: 3.2 }] },
  });
  if (d === 21) out.push({ key: "sk07b", npcId: null, at: at(7, 50), style: 5, order: spec({ nhan: ["thit"] }, "Cho một ổ thịt nguội. Cảm ơn em nghen."), tag: "SK-07b" });
  // SK-17 · ông Hải dẫn người mới tới khoe
  if (d === 28) out.push({
    key: "sk17", npcId: null, at: at(7, 36), style: 7, name: "bạn chú Hải", tag: "SK-17",
    order: spec({ nhan: ["opla"], usual: true }, undefined, "Chú Hải nói làm cho tui một ổ giống ổng."),
  });
  if ((d === 33 || d === 37) && c.flags.strangerCame) out.push({ key: "sk17b", npcId: null, at: at(8, 20), style: 7, name: "bạn chú Hải", order: spec({ nhan: ["opla"], ot: 0 }, "Cho tui ổ ốp la, hai trứng, khỏi ớt nghen.") });
  // SK-33 · vợ chú Tư — lời giải thích DUY NHẤT (công tắc "họ để lại lời nhắn" → sớm hơn, ngày 30)
  const wifeDay = c.flags.leaveMessages ? 30 : 33;
  if (d === wifeDay) out.push({
    key: "sk33", npcId: null, at: at(7), style: 3, name: "cô lạ", tag: "SK-33",
    order: spec({ dayDu: true, nhan: ["pate", "thit", "chalua"], ot: 2 }, "Cho cô hai ổ đầy đủ, nhiều ớt."),
    more: [spec({ dayDu: true, nhan: ["pate", "thit", "chalua"], ot: 2 }, "Ổ nữa đầy đủ, nhiều ớt, y vậy con.")],
    after: [{ text: wifeDay === 30 ? "Ổng gửi con nè: \"Chú đi làm chỗ mới. Xa quá con ơi. Cảm ơn con 30 bữa cơm sáng.\"" : "Ổng gửi lời hỏi thăm con. Ổng đi làm xa, sáu giờ đã phải ra bến xe rồi.", delay: 2.5 }],
    served: { ok: [{ text: "Ờ. Ổng nói con nhớ.", delay: 1 }] },
  });
  // SK-38 · trẻ con nhặt được ví (bản dựng: nhánh "để ví lên quầy" — chủ ví ghé lúc gần trưa)
  if (d === 37) {
    out.push({ key: "sk38a", npcId: null, at: at(8, 40), style: 6, name: "tụi nhỏ", pass: { lines: ["Cô ơi cô, tụi con lượm được ở đằng kia nè."], stay: 4 }, tag: "SK-38" });
    out.push({ key: "sk38b", npcId: null, at: at(10, 25), style: 7, name: "chú mất ví", order: spec({ dayDu: true, nhan: ["pate", "thit", "chalua"] }, "Trời ơi cái ví của tui. Cảm ơn con. Cho chú một ổ đầy đủ."), tag: "SK-38b" });
  }
  if (d === 39 || d === 40) {
    if (c.flags.walletReturned) out.push({ key: "sk38c", npcId: null, at: at(8, 5), style: 7, name: "chú mất ví", order: spec({ dayDu: true, nhan: ["pate", "thit", "chalua"] }, "Cho chú một ổ đầy đủ nghen con.") });
  }
  return out;
}

export const isWorkday = isWork;

/**
 * Luật L2 của P4-01 (chống rập khuôn, BẮT BUỘC): mỗi người đúng MỘT thứ không liên quan tới
 * nghề hay hoàn cảnh. Không có mục này thì hồ sơ bị trả lại (có test). `reveal` = nó lộ ra
 * qua đâu — luôn là LỜI NÓI hoặc PROP, không bao giờ mô phỏng (Đừng-1).
 */
export const QUIRKS: Record<string, { key: string; reveal: string }> = {
  BA_BAY:    { key: "mê cải lương, thuộc lòng — có ý kiến gắt về 'đào bây giờ ca không có hơi'", reveal: "SK-13 tai nghe · ngày 36 tờ chương trình" },
  CHU_TU:    { key: "chơi chim chào mào tên Sáu Ngón, đi thi hót mỗi tháng, thua hoài", reveal: "SK-27 lồng chim phủ vải" },
  ANH_DUNG:  { key: "nuôi và lai cá lia thia — 14 hũ, nói về màu cá bằng giọng khác hẳn", reveal: "ngày 12 hũ nhựa trong cốp" },
  CHI_LAN:   { key: "móc len — một cái chăn hai năm chưa xong", reveal: "ngày 14 miếng lót ly (không bao giờ giải thích)" },
  BE_SU:     { key: "giỏi toán thật — huy chương cấp quận, nhẩm tiền thối nhanh hơn người chơi", reveal: "ngày 28 huy chương" },
  ONG_HAI:   { key: "viết bảng hiệu tay suốt thập niên 90 — chữ đỏ viền vàng trên xe cô Ba là của ông", reveal: "SK-24 (người khác nói) · SK-29" },
  CO_MAI:    { key: "chạy bộ 5 km sáng thứ Hai, ba huy chương giải phong trào treo giữa đống mì gói · sưu tầm lan", reveal: "thứ Hai chạy ngang · SK-30" },
  THAY_PHUC: { key: "cà phê phin cực đoan (cân tiểu ly 22 gam) · đạp xe 40 km cuối tuần ở tuổi 68", reveal: "T7/CN 6h00 đồ xe đạp · ngày 20–21 Vũng Tàu" },
  CHI_HANH:  { key: "sưu tầm và sửa máy ảnh film, tự tráng đen trắng trong nhà tắm — chụp rồi cất, không đăng", reveal: "T7 máy ảnh · tấm ảnh ở màn kết" },
  ANH_BAO:   { key: "dịch truyện tranh tiếng Nhật không công — tiếng Nhật khá hơn tiếng Anh", reveal: "bé Su nhìn qua vai (không bao giờ tự nói)" },
  BA_SAU:    { key: "có bằng lái xe tải, từng chạy Sài Gòn – Mỹ Tho ba năm — chê cách anh Dũng ôm cua", reveal: "SK-28 tấm bằng hết hạn" },
  CHU_KIET:  { key: "ráp mô hình Gundam, sơn bằng cọ nhỏ", reveal: "SK-32 — chỉ ở nhánh người chơi giúp chú" },
};
