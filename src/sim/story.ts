/**
 * Chuyện của mùa — P4-03 (sự kiện nội dung) chạy trên P4-01 (arc) và P4-02 (lịch).
 *
 * `StoryState` chỉ ghi CHUYỆN ĐÃ XẢY RA (đã mời bà Bảy trà mấy lần, bé Su quay clip ngày
 * nào, người chơi có đem hũ đồ chua qua cho chú Kiệt không). KHÔNG có điểm, không có ngưỡng
 * lộ ra ngoài (T3), không có "đáp án đúng" (E3). Mọi lựa chọn của người chơi ở đây đều là
 * một trong bốn loại của E2: làm món · đưa vật · thân thể · không làm gì.
 */
import type { ArcCtx, StoryFlags } from "../content/arcs";
import type { Ingredient, OrderSpec } from "./order";
import { weekdayOf } from "./schedule";

export type StoryState = {
  flags: StoryFlags;
  counts: Record<string, number>;
  moments: string[];
  basketLoaves: Record<number, number>;
};

export const newStoryState = (): StoryState => ({ flags: {}, counts: {}, moments: [], basketLoaves: {} });

export const bump = (st: StoryState, key: string, n = 1) => { st.counts[key] = (st.counts[key] ?? 0) + n; return st.counts[key]; };
export const countOf = (st: StoryState | undefined, key: string) => st?.counts[key] ?? 0;
export function moment(st: StoryState, id: string) { if (!st.moments.includes(id)) st.moments.push(id); }

export function arcCtx(st: StoryState, day: number, o: { rain: boolean; owns: (e: string) => boolean; hasWrongName: (id: string) => boolean }): ArcCtx {
  return { day, flags: st.flags, count: (k) => countOf(st, k), rain: o.rain, owns: o.owns, hasWrongName: o.hasWrongName };
}

// ─────────────────────────────────────────────────────────────── khách vãng lai

/**
 * Hệ số khách vãng lai của CHUYỆN (P4-02 §2.7) — người có tên KHÔNG bị bớt/thêm bởi hệ số này.
 *  · N4 Chủ nhật nhẹ hơn 20% · ngày 5–9 chú Kiệt mở xe rẻ hơn 2 ngàn: −25% (SK-04)
 *  · 3 ngày sau clip bé Su: +40% (SK-14) · ngày 21 đờn ca ở sân đình (SK-27)
 *  · ngày 36–38 chưa có QR mà chú Kiệt gắn POS: mất khách trẻ (SK-37)
 *  · Hồi IV gỡ dần; ngày 40 gần như toàn khách quen
 */
export function storyCrowdMul(day: number, st: StoryState | undefined, o: { hasQr: boolean }) {
  let m = 1;
  if (weekdayOf(day) === "SUN") m *= 0.8;
  if (day >= 5 && day <= 9) m *= 0.75;
  const clip = Number(st?.flags.clipDay ?? 10);
  if (day > clip && day <= clip + 3) m *= 1.4;
  if (day === 21) m *= st?.flags.dinhCa ? 1.7 : 0.7;
  if (day >= 36 && day <= 38 && !o.hasQr) m *= 0.85;
  if (day >= 34 && day <= 39) m *= 0.9;
  if (day === 40) m *= 0.5;
  return m;
}

// ─────────────────────────────────────────────────────────────── móc từ quầy

export type StoryOut = { say: { by: string | null; text: string; delay?: number }[]; log: string[] };
const out = (): StoryOut => ({ say: [], log: [] });

export function onTea(st: StoryState, npcId: string | null, day: number, ctx: { tag?: string; holding?: boolean }): StoryOut {
  const r = out();
  if (!npcId) return r;
  const before = countOf(st, `tea:${npcId}`);
  bump(st, `tea:${npcId}`);
  if (st.flags.coaster && (day === 14 || day === 15)) st.flags.coasterUsed = true;
  // SK-13 · tai nghe của bà Bảy — cần đã mời bà trà ÍT NHẤT một lần trước đó
  if (npcId === "BA_BAY" && day >= 6 && day <= 9 && before >= 1 && !st.flags.caiLuong) {
    st.flags.caiLuong = day;
    r.say.push({ by: "BA_BAY", text: "(bà rút một bên tai nghe, đưa qua — trong đó có ai đang ca vọng cổ)", delay: 0.6 });
    r.say.push({ by: "BA_BAY", text: "Bà nói thiệt, đào bây giờ ca không có hơi.", delay: 6.5 });
  }
  // SK-15 · app khoá tài khoản anh Dũng — đưa trà lúc anh đang ngồi im
  if (npcId === "ANH_DUNG" && ctx.tag === "SK-15" && ctx.holding && !st.flags.dungStory) {
    st.flags.dungStory = day;
    r.say.push({ by: "ANH_DUNG", text: "Khách đặt rồi bỏ, còn báo xấu anh. App khoá hai bốn tiếng. Mất nguyên ngày.", delay: 1.2 });
  }
  return r;
}

export function onPass(st: StoryState, _npcId: string | null, tag: string | undefined, day: number) {
  if (tag === "LAN-M2") st.flags.coaster = day;
  if (tag === "SK-38") st.flags.walletFound = day;
  if (tag === "SK-11") st.flags.kietTowelSeen = day;
  if (tag === "SK-32") { st.flags.kietTalked = day; moment(st, "ONG_BA_NOI_KHONG_SAI"); }
  if (tag === "SK-41-STOP") st.flags.kietStopped = day;
  if (tag === "SK-27-BAY") st.flags.bayStayed = day;
}

export function endOfDay(st: StoryState, day: number) {
  // SK-12 → SK-14: che tay thì bé không quay 6 ngày (clip dời tới 16); làm đẹp hẳn thì clip tới sớm (9)
  if (day === 5 && st.flags.clipDay === undefined) st.flags.clipDay = st.flags.suCover ? 16 : st.flags.suPretty ? 9 : 10;
  if (day === 24) st.flags.signPeeled = day;
}

/**
 * Cảnh nghe lỏm CÓ KỊCH BẢN (P4-03) — thay cảnh đồn thổi của sáng hôm đó. Chỉ những chuyện
 * mà một nhánh sau này cần (SK-24 → SK-29), hoặc là thước đo tiến trình (P4-05 §2.6), hoặc là
 * tin đồn lớn không bao giờ được xác nhận (P4-04 §2.3 biến thể 1: chết sau 2 hop).
 */
export function storyOverhear(day: number): { id: string; a: string; b: string; lines: [string, string, string] } | null {
  if (day === 16) return { id: "story:SK-24", a: "BA_SAU", b: "CO_MAI", lines: [
    "Cái bảng đó ông Hải viết đó.", "Thiệt hả?", "Hồi xưa ổng viết bảng cho cả xóm. Chữ đẹp thấy mồ."] };
  if (day === 19) return { id: "story:LADDER-1", a: "BA_SAU", b: "CO_MAI", lines: [
    "Nhà tui gần chỗ bán tàu hũ á... à thôi, nói nhà tui gần xe bánh mì cô Ba cho dễ.", "Ừ, nói vậy ai cũng biết.", "Giờ ai hỏi đường tui cũng chỉ cái xe."] };
  if (day === 28) return { id: "story:GIAI_TOA", a: "CO_MAI", b: "BA_SAU", lines: [
    "Nghe nói mấy hẻm bên kia người ta đo đạc gì đó.", "Ai nói vậy?", "Tui đâu biết. Nghe nói vậy thôi."] };
  return null;
}

export function onStoryOverheard(st: StoryState, id: string, tier: number, day: number) {
  if (tier < 1) return;
  if (id === "story:SK-24") st.flags.knowsSign = day;
  if (id === "story:LADDER-1") moment(st, "NHA_TUI_GAN_XE_BANH_MI");
}

/**
 * Khách vãng lai nói nguồn (P4-05 §2.6 bậc 2–3, P4-01 anh Dũng/chị Lan/bé Su) — "nguồn truy
 * vết được". `idx` = khách vãng lai thứ mấy trong ngày. Không có UI nào cho hệ này.
 */
export function walkinLine(day: number, st: StoryState, idx: number): string | null {
  const clip = Number(st.flags.clipDay ?? 10);
  if (idx === 1 && day > clip && day <= clip + 3) return "Em coi TikTok thấy chỗ này nè.";
  if (idx === 2 && day >= 16 && day % 3 === 1 && countOf(st, "usual:CHI_LAN") >= 5) return "Chị Lan bên công ty em kêu qua đây mua.";
  if (idx === 3 && day >= 20 && day % 4 === 0) return "Nghe mấy ông tài xế nói ở đây bánh mì được lắm.";
  if (idx === 2 && day >= 30 && day % 5 === 2) return "Chị ơi cho hỏi hẻm này có nhà số 12 không? Người ta chỉ em tới cái xe bánh mì.";
  return null;
}

export function timeline(day: number, o: { atAlley: boolean }): { at: number; text: string }[] {
  const T: { at: number; text: string }[] = [];
  if (day === 24) T.push({ at: 7 * 60 + 15, text: "Cúp điện. Cả khu tắt đèn. Bảng QR hết xài được." });
  if (day === 34) T.push({ at: 10 * 60 + 45, text: 'Bà Sáu về, xách lại cái gánh: "Cảm ơn con nghen."' });
  if (day === 38 && o.atAlley) T.push({ at: 10 * 60, text: "Nhà đám mang ra cho một mâm — xôi, thịt kho. Cô Ba đẩy lon bia qua cho chú Hải." });
  return T;
}

export type ServedInfo = {
  npcId: string | null; tag?: string; day: number; ok: boolean; order: OrderSpec; dish: Ingredient[];
  viaAlt: boolean; crustOk: boolean; atMin: number; barter: boolean;
};

export function onServed(st: StoryState, s: ServedInfo): StoryOut {
  const r = out();
  const count = (id: Ingredient) => s.dish.filter((x) => x === id).length;
  if (s.npcId && s.ok) bump(st, `usual:${s.npcId}`);
  if (s.npcId === "ONG_HAI" && s.atMin >= 10 * 60) st.flags.haiPmDay = s.day;
  if (s.barter && s.npcId === "BA_SAU") bump(st, "barterAccepted");
  // ML-11 · anh Bảo — tự bỏ thêm ớt, bốn lần, anh tự nói "cho em nhiều ớt chút"
  //
  // `+ 1` chứ không `+ 2`: thang phần ăn chỉ còn hai nấc (`INGREDIENTS[].max` = 2), nên
  // `+ 2` là một ngưỡng KHÔNG BAO GIỜ với tới được — cả nhánh truyện chết lặng lẽ.
  // Trên thang mới, "cho hơn mức anh xin một nấc" đã là hết cỡ hào phóng rồi.
  if (s.npcId === "ANH_BAO" && !st.flags.baoAsksChili && count("ot") >= (s.order.levels.ot ?? 1) + 1) {
    if (bump(st, "baoChili") >= 4) st.flags.baoAsksChili = s.day;
  }
  // ML-05 · thầy Phúc và cọng ngò — bỏ nhầm thì hôm sau ông nói lại đủ câu (mất quyền nói tắt)
  if (s.npcId === "THAY_PHUC" && count("hanhngo") > 0) st.flags.phucLostShort = s.day;
  // ML-03 · bà Bảy — không ớt, ổ ít rau: "Con này khôn." (một lần)
  if (s.npcId === "BA_BAY" && s.viaAlt && !st.flags.bayKhon) { st.flags.bayKhon = s.day; r.say.push({ by: "BA_BAY", text: "Con này khôn.", delay: 1.4 }); }
  // ML-02 · chú Tư từ ngày 23 — tự bớt ớt mà không hỏi: chú nhìn lên một giây. KHÔNG có REMEMBERED_USUAL.
  if (s.npcId === "CHU_TU" && s.day >= 23 && count("ot") === 0 && (s.order.levels.ot ?? 0) > 0) st.flags.tuLookedUp = s.day;
  // SK-31 · anh Bảo ngày 29 — ba trong bốn cách "tốt bụng" làm anh xấu hổ
  if (s.tag === "SK-31") {
    const filled = s.dish.some((x) => x === "pate" || x === "thit" || x === "chalua" || x === "xiumai" || x === "opla");
    if (filled) st.flags.baoSneak = s.day;
    else if (s.ok && s.crustOk) st.flags.baoRespect = s.day;
  }
  // SK-17 · người lạ ăn cay không nổi — đọc được người chưa gặp thì người ta quay lại
  if (s.tag === "SK-17" && count("ot") === 0) st.flags.strangerCame = s.day;
  if (s.tag === "SK-38b") st.flags.walletReturned = s.day;
  // SK-29 — cái bảng tay run được treo lên. Nó ở đó tới ngày 40, và ở khung hình cuối.
  if (s.tag === "SK-29") { st.flags.signPainted = s.day; st.flags.signboard = "ve_tay_run"; moment(st, "LAU_QUA_KHONG_CAM_CO"); }
  // SK-42 · ổ bánh cuối có tới tay chị Lan không, và có đúng ổ của chị không (KHÔNG phải điểm)
  if (s.tag === "SK-42") { st.flags.lanGot = s.day; st.flags.lanCorrect = s.ok; moment(st, "CON_O_NAO_KHONG_EM"); }
  // SK-33 · vợ chú Tư — lời nhắn đã tới tay
  if (s.tag === "SK-33") st.flags.tuMessage = s.day;
  return r;
}

export function onUnserved(st: StoryState, npcId: string | null, tag: string | undefined, barter: boolean) {
  // SK-02 — không đưa ổ bánh cho bà Sáu = từ chối đổi. Hai lần là bà không bao giờ hỏi nữa.
  if (barter && npcId === "BA_SAU") bump(st, "barterRefused");
  // "Còn ổ nào không em?" — hết rồi. Màn kết vẫn ghi chị có mặt; thành tựu mở cho MỌI người chơi.
  if (tag === "SK-42") moment(st, "CON_O_NAO_KHONG_EM");
}

// ─────────────────────────────────────────────────────────────── sáng / tối

export function morningLines(day: number, st: StoryState, o: { hasQr: boolean }): string[] {
  const L: string[] = [];
  if (day === 3 && st.flags.coMaiChange) L.push('Cô Mai (đứng bên tiệm, giơ xấp tiền lẻ cột thun): "Tiền lẻ nè con. Sáng nào cô cũng để sẵn."');
  if (day === 7) L.push('Cô Ba: "Con đi đi. Cô đứng coi xe."');
  if (day === 12) L.push('Cô Ba: "Mối nào mình trả đúng hẹn thì người ta nhớ. Trễ một lần là người ta nhớ lâu hơn nữa."');
  if (day === 18) L.push("Cô Ba không xuống xe được. Bữa nay con bán một mình.");
  if (day === 23) L.push("Một người lạ mua pate cùng sạp, trả giá một câu, được bớt.");
  if (day === 24) L.push("Mưa từ sáu giờ. Nước lên ngập lối vô.");
  if (day === 36 && !o.hasQr) L.push('Bé Su: "Bên chú Kiệt có quẹt thẻ rồi đó cô."');
  if (day === 38) L.push('Cô Ba: "Nhà giữa hẻm cưới. Rạp dựng từ năm giờ, lối vô hẹp lắm."');
  if (day === 40) L.push("Hẻm, năm giờ năm mươi. Đèn đường còn sáng.");
  return L;
}

export function eveningNoteOverride(day: number, st: StoryState, specLine?: string): string | null {
  if (specLine) return specLine;
  if (day === 18) return "Bữa nay cô nằm suốt. Con bán được hả?\nCô nghe tiếng con dọn tới chín giờ.";
  if (day === 34) return "Cô nói với con rồi đó.\nCô nhẹ người.";
  if (day === 39) return "Cô ghi sổ sớm bữa nay.\nNgồi coi trang cuối hơi lâu.";                         // viết thêm
  void st;
  return null;
}

/** Chuyện buổi tối — cô Ba, cô Mai, bé Su nói một câu. Hành động (nếu có) ở `eveningActions`. */
export function eveningLines(day: number, st: StoryState, o: { hasLamp: boolean }): string[] {
  const L: string[] = [];
  if (day === 14) L.push('Cô Mai: "Con gắn cái QR đi. Cô chỉ cho, mất một buổi sáng thôi."', 'Bé Su: "Cô ơi bán trà sữa đi cô!"');
  if (day >= 18 && o.hasLamp && day !== 34 && day < 40) L.push("19h40 — anh Dũng ghé, ổ xíu mại. \"Ca đêm quen rồi em.\"");
  if (day === 20) L.push('Cô Mai: "Mai cả hẻm đi đờn ca ở sân đình đó con."');
  if (day === 24) L.push("Bảng hiệu tróc sơn một mảng sau cơn mưa.");
  if (day === 25 && st.flags.kietTowelSeen) L.push("Bên kia hẻm, xe chú Kiệt dọn sớm. Hàng hôm qua ướt hết.");
  if (day === 34) {
    L.push('Cô Ba: "Con ngồi xuống cô nói cái này."',
      'Cô Ba: "Cô sáu mươi bốn rồi con. Cô bán hai mươi sáu năm. Đủ rồi."',
      'Cô Ba: "Cái gối cô nó không có khá hơn đâu. Bác sĩ nói rồi mà cô không chịu nghe."',
      'Cô Ba: "Cô định nói từ bữa mổ lận. Mà cô thấy con làm được, nên cô để coi thêm."',
      'Cô Ba: "Ngày mốt cô nói với mấy người trong hẻm. Còn cái xe... con tính sao thì tính."');
  }
  if (day === 35) L.push('Bà Sáu (ghé ngang): "Ngồi một chỗ mà bán được y chang. Tui ngu ghê, làm chi cực ba chục năm."');
  return L;
}

export type StoryAction = { id: string; label: string; kind: "dua_vat" | "than_the"; costVnd?: number; done?: string };

/**
 * Hành động buổi tối (E2: đưa vật / thân thể — KHÔNG phải câu nói). Luôn có một nhánh
 * "không làm gì": là không bấm. Không nhánh nào được khen hay chê (E3).
 */
export function eveningActions(day: number, st: StoryState): StoryAction[] {
  const A: StoryAction[] = [];
  // SK-11 (b) — chú Kiệt hết hàng thật, không phải tham: đem qua một hũ đồ chua mới
  if (day === 25 && !st.flags.kietHelped) A.push({ id: "kiet_dochua", label: "đem qua cho chú Kiệt một hũ đồ chua", kind: "dua_vat", costVnd: 22_000 });
  // SK-27 — mai đẩy xe ra sân đình (bán được nhiều) hay ở lại hẻm
  if (day === 20 && !st.flags.dinhCa) A.push({ id: "dinh_ca", label: "mai đẩy xe ra sân đình", kind: "than_the" });
  // SK-29 — bảng hiệu tróc: thuê tiệm decal, hay chờ chú Hải buổi sáng
  if (day >= 24 && day <= 26 && !st.flags.signChoice) {
    A.push({ id: "sign_decal", label: "thuê tiệm decal làm bảng mới", kind: "dua_vat", costVnd: 180_000 });
    if (st.flags.knowsSign) A.push({ id: "sign_hai", label: "để dành chờ chú Hải ghé buổi sáng", kind: "than_the" });
  }
  // truyền xe (P4-04 §2.3 biến thể 2) — chỉ mở nếu SK-32 đã có
  if (day >= 36 && day <= 39 && st.flags.kietTalked && !st.flags.kietBread) A.push({ id: "kiet_banh", label: "mai đem một ổ qua cho chú Kiệt", kind: "dua_vat", costVnd: 10_000 });
  return A;
}

export function doAction(st: StoryState, id: string, day: number): string {
  switch (id) {
    case "kiet_dochua": st.flags.kietHelped = day; return 'Chú Kiệt: "Ờ. Cảm ơn."';
    case "dinh_ca": st.flags.dinhCa = day; return "Mai đẩy xe ra sân đình.";
    case "sign_decal": st.flags.signChoice = "decal"; st.flags.signboard = "in_decal"; return "Tiệm decal hẹn mốt có bảng.";
    case "sign_hai": st.flags.signChoice = "hai"; return "Để chú Hải ghé buổi sáng.";
    case "kiet_banh": st.flags.kietBread = day; return "Sáng mai đem qua.";
  }
  return "";
}
