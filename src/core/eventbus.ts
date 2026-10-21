/**
 * EventBus — xương sống nối các hệ. Năm nguyên tắc: ĐỒNG BỘ (`emit()` gọi listener ngay — sự kiện
 * phát trong frame phải xử lý xong trong frame) · TYPED, sai payload là lỗi biên dịch · một hệ
 * không import hệ khác · GHI LẠI ĐƯỢC (ring buffer 2.000 mục, `trace.dump()` ra JSONL) · độ sâu
 * emit lồng nhau > 8 thì throw.
 *
 * ⚠️ Thêm hệ mới: THÊM EVENT VÀO ĐÂY TRƯỚC, viết code sau.
 */
import type {
  AttentionTool, AutosaveReason, CustomerSlot, DaySummary, Defect,
  ItemId, LeaveReason, NpcId, ObsState, SceneKey, StallCloseReason,
  StallZone, StimId, Weather,
} from "./types";
import type { TimeBand } from "./clock";

export type { StimId, Slot, StallZone } from "./types";

export type EventMap = {
  // ── thời gian & ngày ────────────────────────────────────────────────
  "clock:tick":               { dt: number; gameMinutes: number; hhmm: string };
  "clock:bandChanged":        { from: TimeBand; to: TimeBand };
  "day:started":              { dayIndex: number; daySeed: number; weather: Weather };
  "day:ended":                { dayIndex: number; summary: DaySummary };
  "ui:pauseToggled":          { paused: boolean; source: "PLAYER" | "FOCUS_LOST" | "MENU" | "PLAYTEST" };

  // ── tầng NHẬN THẤY ─────────────────────────────────────────────────
  "stim:emitted":             { stimId: StimId; zone: StallZone; salience: number; at: number
                                /** Khoá riêng của lần xảy ra — `core/stimid.ts`. Vắng thì bus tự cấp. */
                                key?: string
                                /** Nói thẳng vào MỘT người (visitId). */
                                target?: string
                                /** Bánh cháy thật → có mùi, cả hàng cùng biết. */
                                smell?: boolean };
  "stim:expired":             { stimId: StimId };
  "perception:stateChanged":  { npcId: NpcId; stimId: StimId; from: ObsState; to: ObsState; certainty: number };
  "perception:confirmed":     { npcId: NpcId; stimId: StimId };
  "gaze:changed":             { npcId: NpcId; gazeFactor: number
                                reason: "PHONE" | "TRA_DA" | "ASKED" | "IDLE" | "TALKING" };
  "attention:toolUsed":       { tool: AttentionTool; npcId: NpcId; durationSec: number };

  // ── khách ──────────────────────────────────────────────────────────
  "npc:arrived":              { npcId: NpcId; visitId: string; slot: CustomerSlot; atHhmm: string };
  "npc:slotChanged":          { npcId: NpcId; from: CustomerSlot; to: CustomerSlot };
  "npc:left":                 { npcId: NpcId; visitId: string; reason: LeaveReason };
  "npc:actionTaken":          { npcId: NpcId; action: "BINNED_FOOD" };
  "order:placed":             { npcId: NpcId; spec: unknown; phrasing: string };
  "order:delivered":          { npcId: NpcId; dish: string[]; waitedSec: number };
  "delivery:diffed":          { npcId: NpcId; defects: Defect[]; spoken: Defect | null
                                silentScore: number; mode: "ANTICIPATED" | "DISCOVERED" | "NONE" };

  // ── thoại ──────────────────────────────────────────────────────────
  "dialog:spoken":            { npcId: NpcId; text: string; tier: 1 | 2 | 3 };
  /** `INVITE_SAI_NGUOI` = mời một người KHÔNG đi ngang, tức nội dung gắn sai act — xem `Service.invite()`. */
  "dialog:silent":            { npcId: NpcId; reason: "RATE_35" | "COOLDOWN" | "NO_RULE" | "EXPIRED" | "PERSONALITY" | "INVITE_SAI_NGUOI" };
  "bark:queued":              { npcId: NpcId; tier: 1 | 2 | 3; delaySec: number };

  // ── kinh tế ───────────────────────────────────────────────────
  "money:changed":            { delta: number; balance: number; reason: string };

  // ── trợ năng & hạ tầng ─────────────────────────────────────────────
  "save:autosaveRequested":   { reason: AutosaveReason };
  "save:written":             { bytes: number; ms: number; slot: "A" | "B" };
  "scene:transition":         { from: SceneKey; to: SceneKey };
  "telemetry:mark":           { key: string; value: number | string };

  // ── chuyển khung ngày (P0-01 §2.3) ─────────────────────────────────
  "market:done":              { spent: number; bought: { itemId: ItemId; qty: number }[] };
  "stall:closed":             { reason: StallCloseReason; served: number; revenue: number; lost: number };
  "evening:done":             { dayIndex: number };
  /** Hết vốn (sim/broke): về sảnh, xoá bản lưu. */
  "broke:done":               { dayIndex: number };
};

export type EventKey = keyof EventMap;

type Handler<T> = (payload: T) => void;

/** Sự kiện phát mỗi frame — không ghi vào trace, nếu không 2.000 mục chỉ toàn tiếng tích tắc. */
const TRACE_SKIP: ReadonlySet<EventKey> = new Set<EventKey>(["clock:tick"]);

export const TRACE_SIZE = 2000;
const MAX_DEPTH = 8;

export class Bus {
  private map = new Map<EventKey, Set<Handler<never>>>();
  private depth = 0;
  private ring: string[] = [];
  private seq = 0;

  /** `trace` bật ở dev build và trong test tất định. Tắt ở bản bán ra. */
  constructor(private traceOn = false) {}

  on<K extends EventKey>(key: K, fn: Handler<EventMap[K]>): () => void {
    let set = this.map.get(key);
    if (!set) this.map.set(key, (set = new Set()));
    set.add(fn as Handler<never>);
    return () => { set!.delete(fn as Handler<never>); };
  }

  once<K extends EventKey>(key: K, fn: Handler<EventMap[K]>): () => void {
    const off = this.on(key, (p) => { off(); fn(p); });
    return off;
  }

  /** Nghe MỌI event — cho telemetry và overlay dev. */
  private any = new Set<(key: EventKey, payload: unknown) => void>();
  onAny(fn: (key: EventKey, payload: unknown) => void) {
    this.any.add(fn);
    return () => { this.any.delete(fn); };
  }

  emit<K extends EventKey>(key: K, payload: EventMap[K]) {
    if (++this.depth > MAX_DEPTH) {
      this.depth = 0;
      throw new Error(`EventBus: emit lồng nhau quá ${MAX_DEPTH} tầng ở '${String(key)}' — có vòng lặp A → B → A`);
    }
    try {
      if (this.traceOn && !TRACE_SKIP.has(key)) {
        this.ring.push(JSON.stringify({ i: this.seq++, e: key, p: payload }));
        if (this.ring.length > TRACE_SIZE) this.ring.shift();
      }
      const set = this.map.get(key);
      if (set) for (const fn of [...set]) (fn as Handler<EventMap[K]>)(payload);
      for (const fn of this.any) fn(key, payload);
    } finally {
      this.depth--;
    }
  }

  readonly trace = {
    dump: () => this.ring.join("\n"),
    clear: () => { this.ring = []; this.seq = 0; },
    enable: (on: boolean) => { this.traceOn = on; },
  };
}

/** Tên khác của `EventMap`. */
export type GameEvents = EventMap;
export type Stimulus = EventMap["stim:emitted"];

/** Bus của cả game. Test và headless sim tự tạo bus riêng. */
export const bus = new Bus(import.meta.env?.DEV ?? false);
