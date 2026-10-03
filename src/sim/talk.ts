/**
 * Trò chuyện có nhánh: mỗi nút mang `reply` và `then` của riêng nó; `ref` trỏ vào cây
 * con dùng chung trong `shared`. Thuần dữ liệu — không Phaser, không RNG riêng.
 *
 * ⚠️ Mở cuộc KHÔNG được đóng băng đồng hồ (`StallScene` đặt `clock.busy`), và `rel` /
 * `anger` không bao giờ lên màn hình (CANON T3).
 */
import type { Personality } from "../content/npcs";
import type { RelTier } from "../core/types";
import type { Rng } from "../core/rng";
import { record, talkPoints, type BaseKind, type RelState } from "./memory";
import { weekdayOf, type Weekday } from "./schedule";
import type { TimeBand } from "../core/clock";
import type { Face, PoseId } from "./reaction";
import type { PracticeId } from "../content/vocab";
import { DRIVE_TUNE, pickWeighted, type Satisfies } from "./drives";
import type { DriveId } from "../content/vocab";

/** ⚠️ `GAT` là gắt với CHÍNH người đang đứng đây; `CHUI` là chửi NGƯỜI THỨ BA cùng với họ — hợp người thì được điểm. */
export type TalkTone = "AM" | "THUONG" | "DUA" | "THANG" | "LANH" | "GAT" | "CHUI" | "IM";

export const TONE_LABEL: Record<TalkTone, string> = {
  AM: "ấm", THUONG: "thường", DUA: "giỡn", THANG: "thẳng",
  LANH: "lạnh", GAT: "gắt", CHUI: "chửi đổng", IM: "im",
};

/** Cây sâu quá ngần này là viết lỗi (hoặc `ref` quay vòng) — runtime cắt, test bắt. */
export const MAX_DEPTH = 6;

export type TalkEffect = {
  rel?: number;
  mem?: { kind: BaseKind; intensity: number };
  anger?: number;
  calm?: number;
  flag?: string;
};

/** ⚠️ Mọi act có thời lượng đều phải khai `forSec`, và phải có đường THẤT BẠI thật. */
export type ForSec = number | "TOI_LUOT" | "TOI_KHI_AN_XONG";

export const forSecOf = (f: ForSec): number | null => (typeof f === "number" ? f : null);

/** Khác `PROMISE` (món kẹp vô ổ, kiểm lúc đưa bánh): hạn tính bằng giây THẬT, và thưởng trả LÚC LÀM XONG. */
export type Deed = {
  what: string;
  dueSec: number;
  onKept?: TalkEffect;
  onBroken?: [TalkEffect, TalkEffect, TalkEffect];
};

export type DoiDon = "dayDu" | "themNhan" | "itRau" | "khongOt";

export type TalkAct =
  | { kind: "PAY"; vnd: number; note: string }
  /**
   * TIỀN ĐI VÀO KÉT — chiều ngược của `PAY`, năm nút đòi (bé Su, thầy Phúc).
   *
   * *"Ừ. Cô cầm lại."* — bé Su thối dư hai ngàn, mình cầm lại, và **két không nhích một
   * đồng**. Một lời thoại nói về tiền mà không đụng tới tiền thì nó là lời thoại suông:
   * cùng họ với "làm đầy đủ" mà đơn không đổi.
   *
   * ⚠️ KHÔNG phải doanh thu. Nó là tiền lẻ quay lại ống, nên đi vào `floatLeft` chứ không
   * vào `soldOut`/`revenue` — nhập nhằng chỗ này thì trang tối nói dối người chơi.
   */
  | { kind: "TAKE_CASH"; vnd: number; note: string }
  | { kind: "DISCOUNT"; vnd: number }
  | { kind: "FREE_LOAF" }
  | { kind: "PROMISE"; item: string }
  | { kind: "REFUSE" }
  | { kind: "STEP_ASIDE"; forSec: ForSec }
  /** Kết cục do roll `passersby.inviteChance` × `purpose.purposeInviteMul` quyết, không do lựa chọn người chơi. */
  | { kind: "INVITE"; yes: string; no: string }
  /** Với `QUA_DUONG` đây là trạng thái NGHỈ: nút lá không khai act thì mặc định đi tiếp. */
  | { kind: "WALK_ON" }
  | { kind: "GIVE_BREAD"; forSec: ForSec }
  | { kind: "OFFER_TEA"; forSec: ForSec }
  | { kind: "STAND_IN_SHADE"; forSec: ForSec }
  /** Mở khoá bằng `GHE_BAN`; ngồi làm kiên nhẫn trôi chậm (`Customer.sitting`), khác `STAND_IN_SHADE` ở chỗ đó. */
  | { kind: "THEY_SIT"; forSec: ForSec }
  /** Clip ra sao phụ thuộc quầy sạch hay dơ lúc máy đang chạy — xem `Service.filmSpoiled`. */
  | { kind: "FILM"; forSec: ForSec }
  | { kind: "STOP_FILM" }
  /** Khác `MOVE_GANH` ở chỗ AI làm: bưng giùm là một việc mình bỏ công nên mua được thiện cảm; bảo bà tự dời thì không. */
  | { kind: "CARRY_GANH" }
  | { kind: "MOVE_GANH" }
  /** Chiều NHẬN một món vào: đưa ổ bánh mà không lấy tiền, và cầm về một thứ. */
  | { kind: "BARTER"; nhan: string }
  /** `XA` chú về bên kia hẻm (mặt tiền thông, mà mình vừa đuổi ông ta) · `CHUNG` hai xe chung một mái (mình mất một khúc). */
  | { kind: "MOVE_CART"; toi: "XA" | "CHUNG" }
  /**
   * CẤT TIẾNG RAO — bà Sáu dạy (7 nhắc), `sau.rao`.
   *
   * *"Con bán mà con hổng rao. Người ta đi ngang đâu có biết con ơi."* — cả cuộc đó dựng
   * quanh một câu người chơi tự nói ra (*"Bánh mì nóng hông…"*), mà tới đợt này nó không
   * làm một ai ngoái lại.
   *
   * Đây là nước đi NGƯỢC với cái xe chú Kiệt: xe lấn thì ăn bớt người đi ngang, tiếng rao
   * thì kéo họ quay đầu lại.
   */
  | { kind: "RAO"; forSec: ForSec }
  /**
   * CHO MƯỢN ĐỒ — arc áo mưa (anh Dũng · chị Lan, 5 nhắc).
   *
   * *"Anh lấy cái áo mưa này của em đi anh. Em có hai cái."* — một câu nói ra con số của
   * chính nó, mà tới đợt này không có cái áo mưa nào tồn tại để mà cho.
   *
   * Khác `FREE_LOAF` (cho hẳn) và khác `BARTER` (đổi): cho mượn là món đồ CÒN PHẢI VỀ,
   * và chuyện nó có về hay không mới là chỗ đáng chơi.
   */
  | { kind: "LEND_ITEM"; item: string }
  /** Họ mang trả món đã mượn. */
  | { kind: "CLEAR_DEBT" }
  /**
   * ĐỔI CÁI ĐƠN — *"Vậy em làm đầy đủ cho anh nghen."*
   *
   * Lỗi chủ dự án bắt được: câu đó mang `PROMISE { item: "pate" }`, nên NGƯỜI TA GẬT
   * (*"Ừ. Đầy đủ. Khỏi hỏi."*) mà **cái đơn vẫn y như cũ** — và tiền vẫn tính theo đơn cũ.
   * Một câu đổi đơn thì phải đổi ĐƠN, không phải hứa thêm một món.
   *
   * `ok`/`no` là hai câu đáp do CHÍNH HỌ quyết: không phải ai cũng chịu đổi, và người
   * đang vội thì càng không. Giá đi theo `tierOf(order.intent)` nên đổi đơn là đổi tiền —
   * không có đường nào làm ổ đầy đủ mà thu tiền ổ thường.
   */
  | {
      kind: "ORDER_CHANGE";
      /** Một đổi, hoặc mấy đổi cùng lúc — *"cho em ổ đầy đủ, khỏi ớt"* là hai thứ một câu. */
      toi: DoiDon | DoiDon[];
      ok: string;
      no: string;
      /**
       * AI MỞ MIỆNG XIN. `"MINH"` (mặc định) là mình đề nghị — họ có cửa từ chối, và câu
       * `no` dùng tới. `"HO"` là CHÍNH HỌ xin đổi (anh Bảo nói lắp cuối cùng cũng gọi
       * được món): roll từ chối ở đây là vô lý, không ai xin rồi tự từ chối mình.
       */
      aiXin?: "MINH" | "HO";
    }
  | { kind: "LEAVE_SHADE" }
  /**
   * NGƯỜI TA NGHE THẤY — hai nút đòi (`dung.basau`: nói xấu bà Sáu *ngay giữa hẻm bà đang
   * gánh đi qua*).
   *
   * Trước đợt này câu đó chỉ mất `rel −3` với anh Dũng; **bà Sáu không biết gì**. Nói xấu
   * một người ngay lúc người đó đi ngang phải có giá, và cái giá phải nằm đúng chỗ: ở
   * TRÍ NHỚ CỦA NGƯỜI BỊ NÓI, không ở người nghe cùng.
   *
   * Chỉ ăn khi người đó CÓ MẶT và đủ gần. Không có mặt thì không có gì xảy ra — và đó là
   * một nước đi hợp lệ, không phải một cái bẫy: người chơi NHÌN THẤY bà đứng đó hay không
   * trước khi bấm (T5).
   */
  | {
      kind: "OVERHEARD_BY";
      /** `memKey` của người NGHE THẤY — người đang bị nói xấu, không phải người đang đứng nói chuyện. */
      ai: string;
      /** Vết nhớ ghi vào sổ của HỌ. Mặc định `RUDE_TO_THEM`. */
      vet?: BaseKind;
      intensity?: number;
    }
  | { kind: "LOOK_INSIDE"; forSec: ForSec }
  | { kind: "PROMISE_DEED"; deed: Deed }
  | { kind: "CREDIT_LOAF" };


/** ⚠️ KHÔNG dùng emoji: bảng glyph của game (linter L013) chỉ có chữ Việt và dấu câu. */
export type TalkMood =
  | "CUOI_TUOI" | "CUOI" | "CUOI_KHAN" | "THUONG" | "NGAC_NHIEN" | "NGUONG"
  | "BUON" | "RUNG_RUNG" | "GIAN" | "BUC" | "NGHI" | "LANH" | "MET" | "NGHIEM";

export const MOOD_LABEL: Record<TalkMood, string> = {
  CUOI_TUOI: "cười lớn", CUOI: "cười nhẹ", CUOI_KHAN: "cười gượng", THUONG: "thương",
  NGAC_NHIEN: "ngạc nhiên", NGUONG: "ngượng", BUON: "buồn", RUNG_RUNG: "rưng rưng",
  GIAN: "giận", BUC: "bực", NGHI: "nghi", LANH: "lạnh", MET: "mệt", NGHIEM: "nghiêm",
};

/**
 * Mỗi cảm xúc → một bộ ba (mày, mắt, miệng) của `entities/face.ts`.
 *   Mày  0 thường · 1 nhíu nhẹ · 2 nhíu sâu · 3 nhướn · 4 lệch · 5 xuôi
 *   Mắt  0 thường · 1 nheo · 2 mở to · 3 liếc ngang · 4 nhắm · 5 cười
 *   Miệng 0 thường · 1 mím · 2 cười nhẹ · 3 cười tươi · 4 méo · 5 há
 */
export const MOOD_FACE: Record<TalkMood, Face> = {
  CUOI_TUOI:  [3, 5, 3],
  CUOI:       [0, 5, 2],
  CUOI_KHAN:  [4, 0, 2],
  THUONG:     [5, 5, 2],
  NGAC_NHIEN: [3, 2, 5],
  NGUONG:     [3, 4, 2],
  BUON:       [5, 4, 0],
  RUNG_RUNG:  [5, 2, 1],
  GIAN:       [2, 1, 4],
  BUC:        [1, 3, 1],
  NGHI:       [1, 1, 0],
  LANH:       [0, 0, 1],
  MET:        [5, 4, 1],
  NGHIEM:     [1, 0, 1],
};

export const MOOD_POSE: Record<TalkMood, PoseId> = {
  CUOI_TUOI: "LEAN_IN", CUOI: "NOD", CUOI_KHAN: "SHRUG", THUONG: "SETTLE_IN",
  NGAC_NHIEN: "STEP_BACK_HALF", NGUONG: "TURN_AWAY_QUARTER", BUON: "IDLE", RUNG_RUNG: "SETTLE_IN",
  GIAN: "LEAN_IN", BUC: "ARMS_CROSS", NGHI: "PEEK_OVER", LANH: "FREEZE", MET: "SETTLE_IN",
  NGHIEM: "TILT_HEAD",
};

export const MOOD_NEGATIVE: ReadonlySet<TalkMood> = new Set<TalkMood>(["GIAN", "BUC", "LANH", "BUON", "MET", "NGHI"]);

/**
 * Hợp đồng ba phần: `need` (chuyện ĐÃ xảy ra — không thoả thì ẨN lựa chọn) · `while` (đang đúng
 * LÚC nói — không thoả thì NPC hiện "?") · `act` (nói xong thế giới đổi gì — không có là free word).
 *
 * Hai cách xử khác nhau vì hai loại sai khác nhau: `need` sai = câu vô nghĩa với người này;
 * `while` sai = vừa nãy còn đúng, giờ hết đúng.
 */
export type TalkNode = TalkEffect & {
  while?: string[];
  /** Vắng = kế thừa `about` của cả cuộc. */
  about?: string[];
  act?: TalkAct;
  needCash?: number;
  say: string;
  tone: TalkTone;
  reply?: string;
  mood?: TalkMood;
  /** Cố ý im. Test đòi mọi nút không có `reply` phải khai cờ này, để phân biệt với chỗ quên viết. */
  silent?: boolean;
  then?: TalkNode[];
  ref?: string;
  /**
   * Chỉ dùng cho sự thật TĨNH — sự thật ĐỘNG thì dùng `while`. Hai loại khoá phân biệt bằng DẤU CHẤM:
   * `coBienHieu` = cờ chuyện · `p.holdsBread` = khoá bảng đen · `m.visits(3)` = khoá có tham số · `!x` phủ định.
   */
  need?: string | string[];
  needEquip?: string;
};

export type TalkWhen = {
  day?: [number, number];
  weekday?: Weekday[];
  tier?: RelTier[];
  slot?: TimeBand[];
  rain?: boolean;
  minVisits?: number;
  needFlag?: string;
  notFlag?: string;
  needEquip?: string;
  /** Khác `TalkNode.need` ở TẦNG: `need` ẩn một LỰA CHỌN, cái này rút cả CUỘC ra. */
  world?: string[];
};

/** Bắt buộc khai (linter L014). `NPC_ONLY` là ĐA SỐ — 81/86 cuộc: ý định của chính họ thì người chơi không moi ra bằng một cú bấm phím. */
export type TalkSource = "NPC_ONLY" | "PLAYER_ONLY" | "BOTH";

/**
 * Tốn bao nhiêu thời gian ĐỌC, không đo độ quan trọng: `BARK` một nhịp · `SHORT` ba nhịp · `FULL`
 * cây đầy đủ. Chỉ `FULL` tiêu vào `TALK_DEEP_PER_DAY` và đòi mở dải lựa chọn ở kênh LỜI.
 */
export type TalkDepth = "BARK" | "SHORT" | "FULL";

/**
 * Trục vuông góc với `depth`: chuyện này để LÀM GÌ. ⚠️ `MOI` không trí nhớ, không điểm quan hệ,
 * không tiêu trần ngày (người đi ngang dùng chung `memKey` cho tám dáng); `CHUYEN` là chỗ duy nhất có cả ba.
 */
export type TalkKind = "MOI" | "CHAO" | "MUA" | "CHUYEN";

export function kindOf(t: Talk): TalkKind {
  if (t.kind) return t.kind;
  if (t.npc === "ANY") return "CHAO";
  if (t.npc === "QUA_DUONG") return hasInvite(t) ? "MOI" : "CHAO";
  if (t.npc === "WALKIN") return "MUA";
  return "CHUYEN";
}

/** Luật trái chiều: cuộc nào cũng đẩy `VIEC_RIENG` LÊN — đứng nói chuyện là chậm việc của người ta. */
export function satisfiesOf(t: Talk): Satisfies {
  if (t.drives) return t.drives;
  const deep = t.depth === "FULL" ? 1.6 : t.depth === "SHORT" ? 1 : 0.5;
  const k = kindOf(t);
  if (k === "MOI") return { VIEC_RIENG: -12 * deep };
  const out: Satisfies = { VIEC_RIENG: -6 * deep };
  if (t.source !== "PLAYER_ONLY") out.KE_CHUYEN = 30 * deep;
  if (t.source !== "NPC_ONLY") out.DUOC_HOI = 28 * deep;
  if (k === "MUA") out.DUOC_PHUC_VU = 22 * deep;
  /*
   * Cuộc KHÔNG dính tới chuyện mua bán thì làm cái chờ nặng thêm — xem `DRIVE_TUNE.CHO_PHIEN`.
   * Thiếu khoản này thì `DOI_BANH → DUOC_PHUC_VU 85` không chạm được vào cuộc tán gẫu, vì
   * `scoreSatisfies` chỉ cộng trên drive mà cuộc đó ĐỘNG TỚI.
   */
  else out.DUOC_PHUC_VU = -DRIVE_TUNE.CHO_PHIEN * deep;
  const tones = walkNodes(t).map((x) => x.node.tone);
  const kho = tones.filter((x) => x === "CHUI" || x === "THANG").length;
  if (kho >= 2) out.PHAN_NAN = 18 * deep;
  return out;
}

/**
 * Mọi act nằm TRONG nhánh con của một nút — để bot biết "bấm câu này rồi đi tiếp thì có
 * tới được `OFFER_TEA` không". Có trần `MAX_DEPTH` vì `ref` trỏ vòng lại là cây vô hạn.
 */
export function actsUnder(n: TalkNode, t: Talk, depth = 0): string[] {
  if (depth >= MAX_DEPTH) return [];
  const out: string[] = [];
  for (const k of childrenOf(n, t) ?? []) {
    if (k.act) out.push(k.act.kind);
    out.push(...actsUnder(k, t, depth + 1));
  }
  return out;
}

export function hasInvite(t: Talk): boolean {
  return walkNodes(t).some((x) => x.node.act?.kind === "INVITE");
}

/** Khác `hasInvite` ở chỗ chỉ xét NHỊP ĐẦU — cái quyết ai được miễn sàn điểm trong `pickTalk`. */
export const opensWithInvite = (t: Talk): boolean =>
  t.tree.some((n) => n.act?.kind === "INVITE");

export const countsAgainstDailyCap = (t: Talk) => kindOf(t) === "CHUYEN" && t.depth === "FULL";

/** `MOI` thì không: `memKey` của người đi ngang dùng chung cho tám dáng suốt cả mùa. */
export const touchesRelationship = (t: Talk) => kindOf(t) !== "MOI";

export type TalkOpenBy = "PLAYER" | "NPC";

export const TALK_CHOICES_MAX = 3;

export const TALK_SCORE_FLOOR = -5;

export type Talk = {
  id: string;
  npc: string;
  topic: string;
  source: TalkSource;
  depth: TalkDepth;
  kind?: TalkKind;
  /** Vắng = mọi khung cảnh; hiếm, và phải có lý do ghi trong `_note`. */
  practice?: PracticeId | PracticeId[];
  opener: string;
  openMood?: TalkMood;
  /** 0..0,6, roll lúc họ đứng chờ. Người chơi làm lơ được, và làm lơ có giá — xem `ignore`. */
  initiates?: number;
  ignore?: { reply?: string; rel?: number; anger?: number; mem?: TalkEffect["mem"]; mood?: TalkMood };
  when?: TalkWhen;
  /** ĐƯỜNG LUI: `pickTalk` chấm điểm theo drive khi `TalkCtx.score` có mặt. */
  weight?: number;
  drives?: Partial<Record<DriveId, number>>;
  /** ⚠️ KHÔNG phải chỗ khai chuyện gì đã xảy ra — chỉ là chủ đề; nhớ ra gì là việc của `retrieve()`. */
  about?: string[];
  tree: TalkNode[];
  shared?: Record<string, TalkNode[]>;
};

export type TalkFile = { talks: Talk[] };

// ─────────────────────────────────────────────────────────────── danh xưng

/** `self`/`you` là của khách, `call`/`me` là của người chơi. Test `p5-talk` đọc bảng này bắt mọi dòng dùng sai đại từ. */
export type Address = { self: string; you: string; call: string; me: string };

export const ANON_TALK_POOLS = ["WALKIN", "QUA_DUONG"] as const;
export const EXTRA_TALK_POOLS = [...ANON_TALK_POOLS, "ANY"] as const;

export const ADDRESS: Record<string, Address> = {
  BA_BAY:    { self: "bà",   you: "con", call: "bà",   me: "con" },
  CHU_TU:    { self: "chú",  you: "con", call: "chú",  me: "con" },
  ANH_DUNG:  { self: "anh",  you: "em",  call: "anh",  me: "em" },
  CHI_LAN:   { self: "em",   you: "em",  call: "chị",  me: "em" },
  BE_SU:     { self: "con",  you: "cô",  call: "con",  me: "cô" },
  ONG_HAI:   { self: "chú",  you: "con", call: "chú",  me: "con" },
  CO_MAI:    { self: "cô",   you: "con", call: "cô",   me: "con" },
  THAY_PHUC: { self: "thầy", you: "con", call: "thầy", me: "con" },
  CHI_HANH:  { self: "chị",  you: "em",  call: "chị",  me: "em" },
  ANH_BAO:   { self: "em",   you: "cô",  call: "em",   me: "cô" },
  BA_SAU:    { self: "tui",  you: "con", call: "bà",   me: "con" },
  CHU_KIET:  { self: "tao",  you: "mày", call: "chú",  me: "tui" },
  WALKIN:    { self: "tui",  you: "em",  call: "anh",  me: "em" },
  QUA_DUONG: { self: "tui",  you: "cô",  call: "anh",  me: "em" },
};

/** Khớp 1–1 theo CHỈ SỐ với `WALKIN_STYLES`; nội dung viết `{call}`/`{me}`/`{self}`/`{you}` và `Service.fill()` thay vào. */
export const WALKIN_ADDRESS: readonly Address[] = [
  { self: "tui", you: "cô",  call: "anh", me: "em" },   // 0 tóc ngắn — anh
  { self: "tui", you: "em",  call: "chị", me: "em" },   // 1 đuôi gà, khẩu trang — chị
  { self: "tui", you: "cô",  call: "cô",  me: "em" },   // 2 tóc bob, xách giỏ — cô
  { self: "tui", you: "con", call: "bà",  me: "con" },  // 3 tóc búi bạc, lưng còng — bà cụ
  { self: "tui", you: "con", call: "cô",  me: "con" },  // 4 nón lá — cô
  { self: "tui", you: "cô",  call: "anh", me: "em" },   // 5 nón bảo hiểm — anh chạy xe
  { self: "tui", you: "em",  call: "chị", me: "em" },   // 6 đuôi gà, áo hồng — chị
  { self: "tui", you: "con", call: "chú", me: "con" },  // 7 đeo kính, tóc ngắn — chú
];

/** Người lạ không có MỘT vai cố định, nên lưới chỉ đòi gọi bằng một trong mấy vai này. */
export const WALKIN_CALLS = ["anh", "chị", "cô", "chú", "bà", "ông", "em"];

/** Không suy ra được từ `ADDRESS`: chiều ngược lại mới là chỗ sai hay gặp (bé Su gọi người chơi là "em"). */
export const FORBIDDEN_SELF: Record<string, string[]> = {
  BE_SU: ["chị", "cô ấy", "tui", "tao"],
  ANH_BAO: ["anh", "tui", "tao", "chú"],
  CHI_LAN: ["tui", "tao"],
  THAY_PHUC: ["tao", "tui", "chú", "anh"],
  BA_BAY: ["tao", "chị", "em"],
  CHU_TU: ["tao", "anh", "ông"],
  CO_MAI: ["tao", "chị", "bà"],
  ONG_HAI: ["cô", "chị", "em"],
  BA_SAU: ["tao", "cô", "chị"],
  ANH_DUNG: ["tao", "chú", "tui"],
  CHI_HANH: ["tui", "tao", "cô"],
};

// ─────────────────────────────────────────────────────────────── chọn cuộc

export type TalkCtx = {
  npcId: string;
  day: number;
  slot: TimeBand;
  rain: boolean;
  tier: RelTier;
  visits: number;
  flags: Record<string, string | number | boolean | undefined>;
  usedToday: readonly string[];
  usedSeason: readonly string[];
  hasEquip?: (id: string) => boolean;
  practice?: PracticeId;
  holds?: (key: string) => boolean;
  /** Vắng = rơi về `weight`, để `tools/sim.ts` và golden bốn mươi ngày chạy y như cũ. */
  score?: (t: Talk) => number;
};

export function okWhen(w: TalkWhen | undefined, c: TalkCtx): boolean {
  if (!w) return true;
  if (w.day && (c.day < w.day[0] || c.day > w.day[1])) return false;
  if (w.weekday && !w.weekday.includes(weekdayOf(c.day))) return false;
  if (w.tier && !w.tier.includes(c.tier)) return false;
  if (w.slot && !w.slot.includes(c.slot)) return false;
  if (w.rain !== undefined && w.rain !== c.rain) return false;
  if (w.minVisits !== undefined && c.visits < w.minVisits) return false;
  if (w.needFlag && !flagHeld(c.flags, w.needFlag, c.day)) return false;
  if (w.needEquip && !(c.hasEquip?.(w.needEquip) ?? true)) return false;
  if (w.notFlag && flagHeld(c.flags, w.notFlag, c.day)) return false;
  // Vắng `holds` (test, công cụ) = coi như THOẢ: một bộ ctx trần không được phép làm cả
  // kho biến mất — cùng lý do với `TalkGate.holds`.
  if (w.world?.length && c.holds && !w.world.every((k) => c.holds!(k))) return false;
  return true;
}

/**
 * Ai mở lời thì rút được cuộc nào. ⚠️ Cổng này nằm trong `eligible()` chứ KHÔNG ở chỗ
 * gọi — đặt ở đây thì không đường nào vòng được.
 */
export function okSource(t: Talk, by: TalkOpenBy): boolean {
  return by === "PLAYER" ? t.source !== "NPC_ONLY" : t.source !== "PLAYER_ONLY";
}

/**
 * Cuộc dùng chung KHÔNG BAO GIỜ CẠN: không áp `usedSeason`, chỉ còn `usedToday` theo chủ
 * đề. Hôm nay hỏi thăm rồi thì mai hỏi tiếp.
 */
export const isSharedTalk = (t: Talk) => t.npc === "ANY";

/**
 * Cuộc này sống được trong khung cảnh đang diễn ra không. Không khai `practice` = sống ở
 * mọi khung; `validate-talks` T009 đẩy việc gắn nhãn đi tới.
 */
export function okPractice(t: Talk, here: PracticeId | undefined): boolean {
  if (!t.practice || !here) return true;
  return Array.isArray(t.practice) ? t.practice.includes(here) : t.practice === here;
}

export function eligible(all: readonly Talk[], c: TalkCtx, by: TalkOpenBy = "PLAYER"): Talk[] {
  return all.filter((t) =>
    (t.npc === c.npcId || t.npc === "ANY")
    && okSource(t, by)
    && okPractice(t, c.practice)
    && (isSharedTalk(t) || !c.usedSeason.includes(t.id))
    && !c.usedToday.includes(t.topic)
    && okWhen(t.when, c));
}

/**
 * Rút một cuộc theo trọng số, dùng stream `dialog-shufflebag`. ⚠️ KHÔNG được đụng
 * `npc-schedule`, nếu không bấm F hôm nay làm xê dịch ai tới ngày mai.
 */
export function pickTalk(all: readonly Talk[], c: TalkCtx, rng: Rng, by: TalkOpenBy = "PLAYER"): Talk | null {
  const list = eligible(all, c, by);
  if (!list.length) return null;
  const scored = list.map((t) => ({ item: t, score: c.score ? c.score(t) : (t.weight ?? 10) }));
  if (c.score) {
    /*
     * SÀN ĐIỂM — người ta đang bận thì KHÔNG AI BẮT CHUYỆN ĐƯỢC. Thiếu nó thì
     * `pickWeighted` luôn trả về một cuộc, kể cả khi mọi điểm đều âm nặng.
     *
     * Trả `null` chứ không trả một cuộc tệ: `talkUnavailable()` có sẵn câu đúng.
     */
    /*
     * LỜI MỜI KHÔNG BỊ SÀN CHẶN. Hai chuyện khác nhau: mở miệng mời thì ai cũng mời được,
     * còn họ có ghé không là việc của `inviteChance` × `purposeInviteMul`.
     *
     * Miễn theo `opensWithInvite`, KHÔNG theo `hasInvite`: cuộc có lời mời tận nhịp hai
     * thì nhịp đầu vẫn là tán gẫu.
     */
    const ok = scored.filter((x) => x.score >= TALK_SCORE_FLOOR || opensWithInvite(x.item));
    if (!ok.length) return null;
    /*
     * XOAY DANH SÁCH TRƯỚC KHI CHẤM — điểm bằng nhau thì `Array.sort` ổn định cho THỨ TỰ
     * TRONG FILE quyết định mãi mãi, và nội dung viết sau không bao giờ chạy.
     *
     * Rút MỘT số nữa, LUÔN LUÔN rút — không rút có điều kiện (P0-02 §2.3).
     */
    const off = Math.floor(rng.next() * ok.length);
    const spun = off ? [...ok.slice(off), ...ok.slice(0, off)] : ok;
    return pickWeighted(spun, rng.next());
  }
  const total = scored.reduce((a, x) => a + x.score, 0);
  let x = rng.next() * total;
  for (const s of scored) if ((x -= s.score) < 0) return s.item;
  return list[list.length - 1];
}

export type TalkGate = {
  flags: TalkCtx["flags"];
  /**
   * Ngày hôm nay — chỉ để chấm `~cờ` ("đặt từ một ngày TRƯỚC"). Vắng = `~cờ` rơi về
   * "có cờ là được", y như cũ.
   */
  day?: number;
  /**
   * Một khoá bảng đen có đúng không — `Service` đưa vào (`worldfacts.holds` đã gắn sẵn
   * ảnh chụp thế giới). Vắng = coi như đúng hết (test, headless).
   */
  holds?: (key: string) => boolean;
  cash?: number;
  hasEquip?: (id: string) => boolean;
  noInvite?: boolean;
};

/**
 * Lựa chọn nào được hiện ở nhịp này. Luôn trả về ít nhất một đường ra — lọc sạch hết thì
 * người chơi kẹt giữa buổi bán.
 *
 * ⚠️ Đường lui phải là một nút THẬT SỰ đi được (ưu tiên nút qua được cổng tiền), không
 * phải `nodes.slice(0, 1)`. Trần `TALK_CHOICES_MAX` cắt SAU khi lọc.
 */
export function visibleOptions(nodes: readonly TalkNode[], gate: TalkGate): TalkNode[] {
  const affordable = (o: TalkNode) => o.needCash === undefined || (gate.cash ?? Infinity) >= o.needCash;
  const offerable = (o: TalkNode) => !(gate.noInvite && o.act?.kind === "INVITE");
  const equipped = (o: TalkNode) => !o.needEquip || (gate.hasEquip?.(o.needEquip) ?? true);
  const needed = (o: TalkNode) => needKeys(o).every((k) => gateOk(k, gate));
  const out = nodes.filter((o) => needed(o) && affordable(o) && offerable(o) && equipped(o));
  const list = out.length ? out : nodes.filter((o) => affordable(o) && offerable(o) && equipped(o));
  return trimKeepingExit(list.length ? list : [...nodes]);
}

export const needKeys = (o: TalkNode): string[] =>
  o.need === undefined ? [] : Array.isArray(o.need) ? o.need : [o.need];

/**
 * Khoá VÉT CẠN — luôn đúng đúng MỘT trong mấy giá trị này, không bao giờ vắng mặt. Nhờ
 * vậy một nhịp chia theo khoá vét cạn thì KHÔNG BAO GIỜ teo.
 */
export const EXHAUSTIVE_KEYS: Record<string, readonly string[]> = {
  "c.openedBy": ["PLAYER", "NPC"],
};

/**
 * Khoá CHỈ NHẬN MỘT GIÁ TRỊ một lúc, nên `beatWidth` đếm chúng là MỘT dòng.
 *
 * ⚠️ `m.tier` và `t.tier` là CÙNG một sự thật (`seasonTier`) dưới hai alias — cả hai phải
 * có mặt ở đây. (`c.saidTone` và `v.promised` KHÔNG thuộc đây — chúng là tập.)
 */
const SINGLE_VALUED = ["t.purpose", "t.state", "t.practice", "t.tier", "m.tier", "w.band", "c.openedBy"];

/**
 * MỘT NHỊP RA MẤY DÒNG — đếm thứ người chơi THẤY, không đếm phần tử trong mảng.
 *   `min`  nhánh NGHÈO NHẤT còn mấy dòng — dưới 2 là lưới `T011` bắt
 *   `max`  nhịp ĐÔNG NHẤT ra mấy dòng — trên 4 là quá ngân sách đọc, lưới `L-2`
 *
 * Cách đếm: nút không cổng tính cho mọi nhánh; nút chỉ khoá bằng một khoá vét cạn tính
 * cho đúng nhánh của nó; nút khoá bằng thứ khác không tính vào `min` nhưng có tính vào
 * `max`, và mấy nút khoá cùng một khoá đơn-trị chỉ góp MỘT vào `max`.
 */
export function beatWidth(nodes: readonly TalkNode[]): { min: number; max: number; worst: string } {
  type Info = { branch: [string, string] | null; other: string[] };
  const infoOf = (o: TalkNode): Info => {
    let branch: [string, string] | null = null;
    const other: string[] = [];
    if (o.needCash !== undefined) other.push("needCash");
    if (o.needEquip) other.push(`needEquip:${o.needEquip}`);
    for (const raw of needKeys(o)) {
      const neg = raw.startsWith("!");
      const k = neg ? raw.slice(1) : raw;
      const m = /^([a-z]\.[a-zA-Z]+)\((.*)\)$/.exec(k);
      if (m && EXHAUSTIVE_KEYS[m[1]] && !neg) { branch = [m[1], m[2]]; continue; }
      other.push(m && SINGLE_VALUED.includes(m[1]) ? m[1] : k);
    }
    return { branch, other };
  };

  const infos = nodes.map(infoOf);
  const always = infos.filter((x) => !x.branch && !x.other.length).length;
  const aliases = new Set(infos.map((x) => x.branch?.[0]).filter((x): x is string => !!x));

  const widthOf = (keep: (x: Info) => boolean) => {
    const groups = new Set<string>();
    let n = 0;
    for (const x of infos) {
      if (!keep(x)) continue;
      if (!x.other.length) { n++; continue; }
      /*
       * Nhóm theo KHOÁ ĐƠN-TRỊ nếu có, không theo cả bộ cổng: hai nút cùng khoá
       * `t.purpose` loại trừ nhau dù cổng kèm theo khác nhau.
       */
      const don = x.other.find((k) => SINGLE_VALUED.includes(k));
      groups.add(don ?? x.other.slice().sort().join("+"));
    }
    return n + groups.size;
  };

  if (!aliases.size) {
    const only = (x: Info) => !x.branch;
    return { min: always, max: widthOf(only), worst: "(không cổng)" };
  }
  let min = Infinity, max = 0, worst = "(không cổng)";
  for (const alias of aliases) {
    for (const val of EXHAUSTIVE_KEYS[alias]) {
      const inBranch = (x: Info) => !x.branch || (x.branch[0] === alias && x.branch[1] === val);
      const chac = always + infos.filter((x) => x.branch?.[0] === alias && x.branch[1] === val && !x.other.length).length;
      if (chac < min) { min = chac; worst = `${alias}(${val})`; }
      max = Math.max(max, widthOf(inBranch));
    }
  }
  return { min, max, worst };
}

/**
 * Một cờ chuyện có đang giữ không, với tiền tố `~` = ĐẶT TỪ MỘT NGÀY TRƯỚC.
 *
 * Mọi lời hứa "mai con đem ra cho cô coi" đều cần `~`: cờ trơn thì câu trả bài nổ NGAY
 * trong cùng buổi, người ta vừa hứa xong đã làm xong — đúng cái vô lý chủ dự án bắt được
 * ở người đi ngang. Cờ lưu NGÀY đặt (`story.flags[f] = day`), nên so ngày là đủ; cờ kiểu
 * boolean cũ rơi về "có là được".
 */
/** Bỏ tiền tố `~` để lấy TÊN cờ — lưới F-1/F-2/M-5 phải so bằng tên, không bằng cách hỏi. */
export const bareFlag = (key: string): string => (key.startsWith("~") ? key.slice(1) : key);

export function flagHeld(flags: TalkCtx["flags"], key: string, day?: number): boolean {
  if (!key.startsWith("~")) return !!flags[key];
  const at = flags[key.slice(1)];
  return typeof at === "number" ? day === undefined || at < day : !!at;
}

/**
 * Một khoá `need` có thoả không. Không có dấu chấm = cờ chuyện; có dấu chấm = khoá bảng
 * đen, hỏi qua `gate.holds`. ⚠️ Thiếu `gate.holds` thì coi như ĐÚNG, không coi như sai.
 *
 * Tiền tố `~` = CỜ ĐẶT TỪ MỘT NGÀY TRƯỚC. Mọi lời hứa "mai con đem ra cho cô coi" đều
 * cần nó: `need: "cờ"` trơn thì câu trả bài nổ NGAY trong cùng buổi, người ta vừa hứa
 * xong đã làm xong — đúng cái vô lý chủ dự án bắt được ở người đi ngang.
 */
function gateOk(key: string, gate: TalkGate): boolean {
  const neg = key.startsWith("!");
  const body = neg ? key.slice(1) : key;
  if (body.includes(".")) return gate.holds ? gate.holds(key) : true;
  return neg !== flagHeld(gate.flags, body, gate.day);
}

const EXIT_TONES: ReadonlySet<TalkTone> = new Set<TalkTone>(["LANH", "IM", "GAT"]);

/**
 * Cắt xuống `TALK_CHOICES_MAX` dòng mà KHÔNG cắt mất đường ra: giữ `max - 1` dòng đầu rồi
 * dành chỗ cuối cho một dòng `EXIT_TONES`.
 *
 * ⚠️ `.slice(0, 3)` thẳng là sai — người viết gần như luôn đặt dòng `LANH` / `IM` ở CUỐI,
 * nên cắt thẳng làm nhịp đầu không còn cách nào từ chối.
 */
export function trimKeepingExit(list: TalkNode[], max = TALK_CHOICES_MAX): TalkNode[] {
  if (list.length <= max) return list;
  const head = list.slice(0, max);
  if (head.some((o) => EXIT_TONES.has(o.tone))) return head;
  const exit = list.find((o) => EXIT_TONES.has(o.tone));
  return exit ? [...list.slice(0, max - 1), exit] : head;
}

export function childrenOf(n: TalkNode, t: Talk): TalkNode[] | null {
  if (n.then?.length) return n.then;
  if (n.ref) return t.shared?.[n.ref] ?? null;
  return null;
}

// ─────────────────────────────────────────────────────────────── phiên

export class TalkSession {
  private here: TalkNode[] | null;
  private depth = 0;
  done = false;
  /**
   * Những câu đã nói TRẬT (`while` không giữ nữa). Nói trật rồi thì không nói lại được —
   * nếu không, một nhịp khoá trọn sau `while` cho bấm vô hạn lần, mỗi lần trừ một điểm.
   */
  private struck = new Set<TalkNode>();
  readonly picked: { say: string; tone: TalkTone }[] = [];

  constructor(readonly talk: Talk, readonly npcKey: string) {
    this.here = talk.tree.length ? talk.tree : null;
    this.done = this.here === null;
  }

  get options(): readonly TalkNode[] | null {
    if (this.done || !this.here) return null;
    const left = this.here.filter((n) => !this.struck.has(n));
    return left.length ? left : null;
  }

  /**
   * Câu vừa chọn nói trật (`while` không giữ) — gạch nó đi. Trả `true` nếu nhịp này đã
   * hết đường: `Service` đóng phiên và cuộc kết thúc.
   */
  strike(n: TalkNode): boolean {
    this.struck.add(n);
    if (this.options) return false;
    this.here = null;
    this.done = true;
    return true;
  }

  /**
   * Người chơi chọn lựa chọn thứ `i` của nhịp hiện tại (đã lọc `need`).
   * Trả câu khách đáp + chính cái nút đã chọn, và tự đi xuống nhánh con của nó.
   */
  /**
   * Nhìn trước lựa chọn thứ `i` mà KHÔNG đi tiếp — để `Service` kiểm `while` trước khi áp
   * bất cứ hệ quả nào.
   */
  peek(i: number, gate: TalkGate): TalkNode | null {
    const here = this.options;
    if (!here) return null;
    const opts = visibleOptions(here, gate);
    return opts[Math.max(0, Math.min(opts.length - 1, i))] ?? null;
  }

  choose(i: number, gate: TalkGate): { node: TalkNode; reply?: string; done: boolean } | null {
    const here = this.options;
    if (!here) return null;
    const opts = visibleOptions(here, gate);
    const n = opts[Math.max(0, Math.min(opts.length - 1, i))];
    this.picked.push({ say: n.say, tone: n.tone });

    const kids = childrenOf(n, this.talk);
    this.depth++;
    // Cắt ở MAX_DEPTH: `ref` trỏ vòng lại là cây vô hạn. Test L-9 bắt lúc build; đây là
    // lưới thứ hai lúc chạy.
    this.here = kids && this.depth < MAX_DEPTH ? kids : null;
    this.struck.clear();
    this.done = this.here === null;
    return { node: n, reply: n.reply, done: this.done };
  }
}

// ─────────────────────────────────────────────────────────────── hệ quả

export const DEFAULT_IGNORE_REL = -1;

export type TalkOutcome = { relDelta: number; mem: BaseKind | null; anger: number; flag?: string };

/**
 * Áp hiệu ứng của MỘT lựa chọn lên quan hệ + trí nhớ. ⚠️ KHÔNG đi qua `Service.remember()`
 * nên không vào tin đồn — chỉ hành động mới đi xa được, lời nói ở quầy thì không.
 */
export function applyTalk(e: TalkEffect, s: RelState, p: Personality, day: number): TalkOutcome {
  const out: TalkOutcome = { relDelta: 0, mem: null, anger: e.anger ?? 0, flag: e.flag };
  if (e.rel) out.relDelta += talkPoints(s, p, e.rel);
  if (e.mem) {
    const r = record(s, p, e.mem.kind, e.mem.intensity, day);
    out.relDelta += r.delta;
    out.mem = e.mem.kind;
  }
  return out;
}

/**
 * Giận → sức chờ: `anger` 0..100 = đốt ngần ấy % quãng kiên nhẫn CÒN LẠI của lượt ghé.
 * Trả số giây phải cộng thêm; không bao giờ đẩy quá mốc bỏ đi trong MỘT câu.
 */
export function angerToWaitSec(anger: number, waitT: number, waited: number, leaveAt: number) {
  if (anger <= 0) return 0;
  const room = Math.max(0, waitT * leaveAt - waited);
  return Math.min(room * 0.85, (room * Math.min(100, anger)) / 100);
}

// ─────────────────────────────────────────────────────── duyệt cây (test/tool)

export function walkNodes(t: Talk): { node: TalkNode; depth: number }[] {
  const out: { node: TalkNode; depth: number }[] = [];
  const seen = new Set<TalkNode>();
  const go = (nodes: readonly TalkNode[], depth: number) => {
    if (depth > MAX_DEPTH) return;
    for (const n of nodes) {
      if (seen.has(n)) continue;
      seen.add(n);
      out.push({ node: n, depth });
      const kids = childrenOf(n, t);
      if (kids) go(kids, depth + 1);
    }
  };
  go(t.tree, 1);
  return out;
}

export function linesOf(t: Talk): { npc: string[]; player: string[] } {
  const all = walkNodes(t);
  return {
    npc: [t.opener, ...(t.ignore?.reply ? [t.ignore.reply] : []), ...all.map((x) => x.node.reply).filter((x): x is string => !!x)],
    player: all.map((x) => x.node.say),
  };
}
