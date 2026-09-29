import type { Rng } from "../core/rng";
import type { NpcDef, Personality } from "../content/npcs";
import type { BodyStyle } from "../art/character";
import { makeOrder, type OrderSpec } from "./order";
import { traitMulFrom, type Observation, type Observer, type Zone } from "./perception";
import type { StimId } from "../core/eventbus";

/**
 * Một người khách trong một lượt ghé quán.
 *
 * CANON T3: **không hiện chỉ số quan hệ**. Ở đây không có thanh tình cảm, không có
 * `+3 trust`. Chỉ có mặt, lời, dáng, và hệ quả trễ. `mood` dưới đây là để CHỌN
 * biểu cảm và câu thoại, không bao giờ vẽ ra thành số.
 */

export type CustomerPhase =
  | "arriving"    // đang đi từ ngoài đường vào
  | "queueing"    // đứng chờ tới lượt
  | "ordering"    // vừa tới quầy, đang nói món
  | "waiting"     // đã gọi món, chờ bánh
  | "leaving";    // xong việc (được phục vụ, hoặc bỏ đi)

export type LeaveReason = "served" | "impatient" | "closed";

export class Customer implements Observer {
  phase: CustomerPhase = "arriving";
  /** Ô đang đứng / đang đi tới. */
  x: number;
  y: number;
  tx: number;
  ty: number;

  /** Chỗ trong hàng chờ; 0 là ngay trước mặt người bán. */
  slot = -1;
  zone: Zone = "SEATED_FAR";
  gaze = 1;
  occluder = 1;
  traitMul: number;
  observations = new Map<StimId, Observation>();

  order: OrderSpec | null = null;
  /** Giây thật còn lại trước khi bỏ đi. */
  patience: number;
  readonly patienceMax: number;

  /** Đã cằn nhằn tới tier mấy — để không lặp lại một câu. */
  nagged = 0;
  /** Cửa sổ bấm điện thoại còn lại (giây). CANON §5.4: chỉ 2–3 giây. */
  private phoneFor = 0;
  private phoneCooldown = 4;

  // ── trà đá ─────────────────────────────────────────────────────────────────
  /** Số ly đã nhận trong lượt này. */
  teaCount = 0;
  /** Còn cầm ly bao lâu. Đang cầm thì không nhận thêm — ràng buộc VẬT LÝ, không phải bộ đếm. */
  private holdingTeaFor = 0;
  /** Đang cúi xuống uống. ĐÂY mới là cửa sổ hạ gaze của CANON §5.4, không phải bản thân ly trà. */
  private sipFor = 0;
  /**
   * Đã bắt bài chuyện bạn lôi trà đá ra đánh lạc hướng.
   * CANON §8(i): "người tinh ý nhận ra bạn đang mua chuộc → phản tác dụng".
   * Bắt bài rồi thì công cụ đó cháy vĩnh viễn với người này.
   */
  onToTea = false;

  leaveReason: LeaveReason | null = null;
  /** Lời thoại đang hiện trên bong bóng, và còn hiện bao lâu. */
  say: string | null = null;
  sayFor = 0;

  constructor(
    readonly id: string,
    /** Khoá tra sổ nhớ xuyên mùa — khách vãng lai dùng chung khoá theo kiểu người. */
    readonly memKey: string,
    readonly name: string,
    readonly personality: Personality,
    readonly body: BodyStyle,
    readonly npc: NpcDef | null,
    readonly usual: OrderSpec,
    /** Lần ghé thứ mấy trong mùa — từ lần 3 mới được phép nói "như mọi bữa". */
    readonly visitCount: number,
    spawn: { x: number; y: number },
    patienceBase: number,
    private rng: Rng,
  ) {
    this.x = this.tx = spawn.x;
    this.y = this.ty = spawn.y;
    this.traitMul = traitMulFrom(personality.soi);
    // nóng tính thì mất kiên nhẫn nhanh hơn; điềm đạm thì chờ được lâu
    this.patienceMax = patienceBase * (1.25 - personality.nongTinh * 0.5);
    this.patience = this.patienceMax;
  }

  /**
   * `canAskUsual` do `Service` quyết, không tự suy ra từ `visitCount`:
   * điều kiện thật là "người chơi đã NGHE đủ", chứ không phải "khách đã ghé đủ".
   */
  rollOrder(canAskUsual: boolean) {
    this.order = makeOrder(this.rng, this.usual, canAskUsual);
  }

  speak(text: string, seconds = 3.2) {
    this.say = text;
    this.sayFor = seconds;
  }

  /**
   * Nhịp thở của khách: điện thoại, kiên nhẫn, bong bóng thoại.
   * `pressure` = false khi bật chế độ không giới hạn thời gian (CANON §15.2):
   * khách vẫn bỏ đi vì bạn làm SAI, nhưng không bao giờ vì bạn CHẬM.
   */
  tick(dt: number, pressure: boolean) {
    if (this.sayFor > 0) {
      this.sayFor -= dt;
      if (this.sayFor <= 0) this.say = null;
    }

    if (this.holdingTeaFor > 0) this.holdingTeaFor -= dt;
    if (this.sipFor > 0) this.sipFor -= dt;

    // Cửa sổ bấm điện thoại: chỉ 2–3 giây, đủ để dùng nếu đã chuẩn bị sẵn,
    // không đủ để "farm" (CANON §8a).
    if (this.phoneFor > 0) {
      this.phoneFor -= dt;
      if (this.phoneFor <= 0) this.phoneCooldown = 5 + this.rng.next() * 7;
    } else {
      this.phoneCooldown -= dt;
      if (this.phoneCooldown <= 0 && this.phase !== "arriving") {
        this.phoneFor = 2 + this.rng.next();
      }
    }
    const distracted = this.phoneFor > 0 || this.sipFor > 0;
    this.gaze = distracted ? 0.05 : this.slot === 0 ? 1 : 0.55;

    if (pressure && (this.phase === "queueing" || this.phase === "waiting")) {
      this.patience -= dt;
    }
  }

  get onPhone() {
    return this.phoneFor > 0;
  }

  get patienceRatio() {
    return Math.max(0, this.patience / this.patienceMax);
  }

  get holdingTea() {
    return this.holdingTeaFor > 0;
  }

  /**
   * Nhận được mấy ly trước khi thấy kỳ. Người SOI cao bắt bài sớm hơn hẳn:
   * Bà Bảy (soi 0.9) chịu đúng một ly, Anh Dũng (soi 0.2) tới ly thứ ba.
   * Dùng lại đúng chiều tính cách đã có, không đẻ thêm chỉ số mới (CANON §4).
   */
  get teaTolerance() {
    return this.personality.soi > 0.7 ? 1 : this.personality.soi > 0.4 ? 2 : 3;
  }

  /** `sipSeconds = 0` nghĩa là khách chỉ cầm lấy đặt xuống, KHÔNG có cửa sổ hạ gaze. */
  takeTea(sipSeconds: number) {
    this.teaCount++;
    this.holdingTeaFor = 7;
    this.sipFor = sipSeconds;
  }

  /** Ba nấc biểu cảm — CANON T3: đọc qua dáng và mặt, không qua thanh số. */
  get mood(): "calm" | "checking" | "annoyed" {
    if (this.patienceRatio > 0.55) return "calm";
    if (this.patienceRatio > 0.22) return "checking";
    return "annoyed";
  }
}
