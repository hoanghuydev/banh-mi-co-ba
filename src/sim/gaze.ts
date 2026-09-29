/**
 * Máy trạng thái ÁNH NHÌN — P1-02 §2.5.
 *
 * gazeFactor không phải một con số cố định theo chỗ đứng: khách lúc nhìn tay mình,
 * lúc nhìn mặt mình, lúc liếc quanh, lúc bấm điện thoại. Khoảng cách đã nằm trong
 * bảng visibility — nhân thêm một hệ số "đứng xa thì nhìn lơ" là phạt khoảng cách hai lần.
 *
 * Luật T5 đi kèm: KHÔNG CÓ HOẠT ẢNH THÌ KHÔNG CÓ TRẠNG THÁI. Mỗi trạng thái phải vẽ ra
 * được (điện thoại sáng xanh, ly trà che mặt, liếc đồng hồ…) — người chơi phải thấy
 * VÌ SAO khách không thấy mình làm rớt bánh, không được để "không sao" thành "hên".
 */
import { ShuffleBag, fnv1a, splitmix32, type Rng } from "../core/rng";

export type GazeState =
  | "LOOK_HANDS" | "LOOK_FACE" | "IDLE_SCAN" | "PHONE" | "COMPANION" | "WATCH" | "AWAY_RAIN" | "DRINKING";

export const GAZE_TABLE: Record<GazeState, { g: number; dur: [number, number]; hard?: boolean }> = {
  LOOK_HANDS: { g: 1.00, dur: [2.5, 6.0] },
  LOOK_FACE:  { g: 0.35, dur: [1.5, 4.0] },
  IDLE_SCAN:  { g: 0.45, dur: [2.0, 5.0] },
  PHONE:      { g: 0.05, dur: [2.0, 3.0], hard: true },
  COMPANION:  { g: 0.15, dur: [3.0, 8.0] },
  WATCH:      { g: 0.20, dur: [1.0, 2.0] },
  AWAY_RAIN:  { g: 0.10, dur: [4.0, 12.0] },
  DRINKING:   { g: 0.08, dur: [2.0, 3.0], hard: true },
};

/** Thứ tự cột của túi vé: LOOK_HANDS / LOOK_FACE / IDLE_SCAN / PHONE / COMPANION / WATCH. */
export const BAG_ORDER: readonly GazeState[] = ["LOOK_HANDS", "LOOK_FACE", "IDLE_SCAN", "PHONE", "COMPANION", "WATCH"];
export type GazeProfile = { tickets: readonly number[]; phoneBudget: number };

/**
 * Khách vãng lai không có trong bảng của P1-02 — lấy một hồ sơ "người thường":
 * nhìn tay vừa phải, có điện thoại nhưng không nghiện. (Quyết định của bản dựng.)
 */
export const WALKIN_GAZE: GazeProfile = { tickets: [5, 4, 6, 3, 0, 2], phoneBudget: 1 };

export type GazeCtx = {
  /** Có tiếng động lớn (rớt đồ) trong frame này. */
  loudCue: boolean;
  /** Người chơi vừa hỏi chuyện người này. */
  question: boolean;
  /** Tỉ lệ đã chờ / sức chờ (MADE_THEM_WAIT). */
  waitRatio: number;
  hasCompanion: boolean;
  raining: boolean;
};

export class GazeMachine {
  state: GazeState = "IDLE_SCAN";
  private timer = 0;
  private transitions = 0;
  private tickets: GazeState[];
  private bag: ShuffleBag;
  phoneBudget: number;

  constructor(profile: GazeProfile, private seedKey: string, private rng: Rng) {
    this.tickets = BAG_ORDER.flatMap((s, i) => Array<GazeState>(profile.tickets[i] ?? 0).fill(s));
    if (!this.tickets.length) this.tickets = ["IDLE_SCAN"];
    this.bag = new ShuffleBag(this.tickets.length);
    this.phoneBudget = profile.phoneBudget;
    this.enter("IDLE_SCAN");
  }

  get factor() { return GAZE_TABLE[this.state].g; }
  get hard() { return !!GAZE_TABLE[this.state].hard && this.timer > 0; }

  /** Thời lượng lấy từ hàm băm THUẦN (tên, số lần chuyển) — không tiêu RNG, không lệch khi reload. */
  private noise() {
    return splitmix32(fnv1a(this.seedKey) ^ Math.imul(this.transitions++, 0x9e3779b9)) / 4294967296;
  }

  private enter(s: GazeState, dur?: number) {
    const [lo, hi] = GAZE_TABLE[s].dur;
    this.state = s;
    this.timer = dur ?? lo + (hi - lo) * this.noise();
    if (s === "PHONE") this.phoneBudget--;
  }

  /** Ép một trạng thái (ly trà → DRINKING; chờ lâu → WATCH). Trạng thái cứng đang chạy thì không cắt ngang. */
  force(s: GazeState, dur?: number) {
    if (this.hard) return false;
    this.enter(s, dur);
    return true;
  }

  tick(dt: number, ctx: GazeCtx) {
    this.timer -= dt;
    // (1) tiếng động lớn kéo mắt về tay người bán — trừ lúc đang dán mắt vào điện thoại / cúi uống
    if (ctx.loudCue && !this.hard) { this.enter("LOOK_HANDS"); return; }
    // (2) được hỏi chuyện → nhìn mặt
    if (ctx.question && !this.hard) { this.enter("LOOK_FACE"); return; }
    // (3)(4) còn giờ thì đứng yên trạng thái cũ
    if (this.timer > 0) return;
    // (5) rút vé kế tiếp, qua bộ lọc
    let next = this.tickets[this.bag.draw(this.rng)];
    if (next === "PHONE" && this.phoneBudget <= 0) next = "IDLE_SCAN";
    if (next === "COMPANION" && !ctx.hasCompanion) next = "IDLE_SCAN";
    if (next === "WATCH" && ctx.waitRatio <= 0.6) next = "IDLE_SCAN";
    if (ctx.raining && next !== "PHONE") next = "AWAY_RAIN";
    this.enter(next);
  }
}
