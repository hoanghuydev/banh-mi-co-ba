/**
 * MÀN MỞ ĐẦU — 4 giờ rưỡi sáng ngày 1, đầu hẻm.
 *
 * ⚠️ ĐỌC `docs/phase-4-noi-dung/P4-06-man-mo-dau.md` TRƯỚC KHI SỬA MỘT CHỮ Ở ĐÂY.
 * File đó là script: nó ghi cảnh này tồn tại để làm ba việc gì, lấy giọng từ đâu, và BỐN LUẬT
 * viết rút ra từ lần bản nháp đầu bị chê "AI quá". Sửa thoại mà không mở script là lần sau
 * không ai biết câu đó để làm gì.
 *
 * Tiền đề (chủ dự án chốt): người chơi TỰ RA BÁN, không ai giao xe cho. Cô mua lại cái xe cũ
 * của cô Ba — bà bán bánh mì ba chục năm ở hẻm này, giờ nghỉ. Tiền của cô, lời lỗ của cô,
 * chi phí cô tự tính. Bảng hiệu mang TÊN CÔ.
 *
 * Vì sao kịch bản nằm ở `.ts` chứ không ở `content/lines/*.json`: mấy file JSON kia là TÚI
 * BIẾN THỂ (shufflebag) để `lint:lines` soi trùng lặp giữa các dòng thay nhau được. Đoạn này
 * là một chuỗi có thứ tự, dòng sau dựa vào dòng trước — đem thước đo túi biến thể ra đo nó
 * thì mọi câu "Dạ." đều bị kêu trùng. Cùng lý do với `content/talks/index.ts`.
 *
 * ⚠️ Giọng miền Nam (CANON §2): "vô" không phải "vào", "ba/má" không phải "bố/mẹ",
 * "nón" không phải "mũ" — xem `content/redlines.json`.
 * ⚠️ Mọi con số tiền trong đoạn này phải khớp `content/econ/econ.json`. Hiện tại:
 * tiền chỗ L1 17.000₫/bữa · chi phí cố định 40.000₫/bữa · ổ thường 25.000₫ · vốn đầu 1.400.000₫.
 */

export type IntroSpeaker = "CO_BA" | "PLAYER";

export type IntroLine = {
  who: IntroSpeaker;
  text: string;
  /** Chỗ trống `{ten}` — chỉ dùng được ở mấy dòng SAU bước đặt tên. */
  needsName?: boolean;
};

/**
 * Tên hiển thị khi người chơi không đặt tên. KHÔNG phải tên quán: bỏ trống thì tấm bảng
 * trơ đúng hai chữ "BÁNH MÌ" (xem `shopName`), còn chỗ nào cần gọi cô ấy thì gọi vầy.
 * Khớp với `newGame()` ở `core/save.ts`.
 */
export const DEFAULT_PLAYER_NAME = "Cô chủ";

/** Bảng hiệu rộng 156 px thiết kế. Dài hơn thì `art/sign.ts` tự thu chữ, nhưng thu hoài thì hết đọc nổi. */
export const NAME_MAX = 14;

/**
 * Beat 1–6 của script. Bỏ qua được (nút "Bỏ qua" / phím Esc) — nút đó nhảy thẳng tới bước
 * đặt tên, vì cái tên thì không bỏ qua được: nó đi lên bảng hiệu và vô save.
 */
export const INTRO_SCRIPT: readonly IntroLine[] = [
  // beat 1 — bà đi bộ ngang, nhận ra cái xe cũ của mình
  { who: "CO_BA", text: "Ủa. Xe này của cô mà." },
  { who: "PLAYER", text: "Dạ. Con mua lại của cô hồi tháng trước." },
  { who: "CO_BA", text: "Cô biết. Cô hỏi cho có chuyện thôi." },

  // beat 2 — cái xe sơn lại, bắc cầu qua chuyện tiền
  { who: "CO_BA", text: "Con sơn lại dữ há. Chắc tốn." },
  { who: "PLAYER", text: "Dạ… cũng hết một mớ." },
  { who: "CO_BA", text: "Còn nhiêu?" },
  { who: "PLAYER", text: "Dạ còn một triệu bốn." },

  // beat 3 — bắt tự nhẩm. Cô Ba KHÔNG đọc ra con số cuối; người chơi đọc.
  { who: "CO_BA", text: "Ừ. Con tính nhẩm với cô coi." },
  { who: "CO_BA", text: "Than, đá, bịch, giấy gói, xăng chạy đi chợ." },
  { who: "CO_BA", text: "Rồi tiền chỗ. Đầu hẻm mười bảy ngàn một bữa, chủ nhà thu chiều." },
  { who: "PLAYER", text: "Dạ… cỡ bốn chục ngàn một bữa." },
  { who: "CO_BA", text: "Ờ. Bốn chục. Chưa bán được ổ nào là đã mất rồi đó con." },

  // beat 4 — giá, và người chơi được cãi đúng một câu
  { who: "CO_BA", text: "Bán nhiêu một ổ?" },
  { who: "PLAYER", text: "Dạ hăm lăm." },
  { who: "CO_BA", text: "Thằng Kiệt bên kia hai mươi." },
  { who: "PLAYER", text: "Dạ con bỏ thịt nhiều hơn chú Kiệt." },
  { who: "CO_BA", text: "Ờ thì bán thử coi." },

  // beat 5 — chuyện ông khách. Beat duy nhất được phép dài.
  { who: "CO_BA", text: "Cô nói con nghe cái này rồi cô đi bộ tiếp." },
  { who: "CO_BA", text: "Hồi cô mới ra bán, có ông khách đứng ngay chỗ con đứng đó." },
  { who: "CO_BA", text: "Cô gãi đầu một cái, rồi bốc đồ chua bỏ vô ổ của ổng." },
  { who: "CO_BA", text: "Ổng trả tiền, cầm ổ bánh, đi." },
  { who: "CO_BA", text: "Hai chục năm sau cô mới gặp lại ổng ngoài chợ." },
  { who: "PLAYER", text: "Ổng có nói gì không cô?" },
  { who: "CO_BA", text: "Không. Ổng nhớ, vậy thôi." },
  { who: "CO_BA", text: "Khách nó đứng cách con nửa thước à con. Có giấu được gì đâu." },

  // beat 6 — bà bỏ đi, ngoái lại nhắc cái bảng hiệu
  { who: "CO_BA", text: "Thôi. Sáu giờ người ta đi làm, lo mà kịp." },
  { who: "CO_BA", text: "À. Cái bảng hiệu cô cạo tên cô ra rồi đó." },
];

/** Câu mời gõ tên — hiện cùng ô nhập, KHÔNG bỏ qua được. */
export const INTRO_ASK: IntroLine = {
  who: "CO_BA",
  text: "Con ghi tên con vô đi. Người ta phải biết mua của ai chứ.",
};

/** Beat 7 — có tên. `{ten}` = tên vừa đặt. */
export const INTRO_AFTER: readonly IntroLine[] = [
  { who: "CO_BA", text: "{ten} hả. Ờ, nghe được.", needsName: true },
  { who: "CO_BA", text: "Nhóm lò đi con. Lát nữa người ta ra." },
];

/** Beat 7 — bỏ trống. Bà không ép, và tấm bảng cứ trơ hai chữ "BÁNH MÌ" vậy. */
export const INTRO_AFTER_BLANK: readonly IntroLine[] = [
  { who: "CO_BA", text: "Chưa nghĩ ra hả. Thôi, để trống đó cũng được." },
  { who: "CO_BA", text: "Nhóm lò đi con. Lát nữa người ta ra." },
];

export const SPEAKER_NAME: Record<IntroSpeaker, string> = {
  CO_BA: "Cô Ba",
  PLAYER: "Con",
};

/**
 * Dọn tên người chơi.
 *
 * NFC vì tiếng Việt gõ bằng bộ gõ nào cũng ra được chuỗi tổ hợp (ê = e + ◌̂), mà chuỗi tổ hợp
 * thì `slice` cắt trúng giữa chữ và dấu, còn máy khác đọc `localStorage` ra chữ khác.
 * Cắt xuống dòng và ký tự điều khiển vì cái tên này đi lên một tấm bảng vẽ bằng Phaser.Text —
 * ở đó `\n` là một dòng thứ hai chui ra khỏi tấm tôn.
 */
export function cleanName(raw: string): string {
  return raw
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, NAME_MAX)
    .trim();
}

/**
 * TÊN QUÁN trên bảng hiệu và trên bảng menu — "BÁNH MÌ HOÀNG HUY".
 *
 * Viết hoa: CANON §15 cấm viết hoa toàn bộ ở CHỮ GIAO DIỆN (đọc mỏi mắt, trình đọc màn hình
 * đọc thành từng chữ cái). Tấm bảng hiệu không phải chữ giao diện — nó là chữ SƠN TRÊN TÔN,
 * và bảng hiệu hẻm Sài Gòn thì viết hoa hết, y như tấm của cô Ba trước đó.
 *
 * Bỏ trống tên → còn trơ hai chữ "BÁNH MÌ". Đó là chuyện cố ý, không phải thiếu dữ liệu:
 * cô Ba đã cạo tên cô ra rồi, ai không ghi tên vô thì tấm bảng trống.
 */
export function shopName(name: string): string {
  const n = cleanName(name);
  return n && n !== DEFAULT_PLAYER_NAME ? `BÁNH MÌ ${n.toUpperCase()}` : "BÁNH MÌ";
}
