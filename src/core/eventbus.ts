/** Bus đồng bộ: `emit()` gọi listener ngay, các hệ nói chuyện qua đây chứ không import nhau. */
import type {
  AttentionTool, AutosaveReason, CustomerSlot, DaySummary, Defect,
  LeaveReason, NpcId, ObsState, SceneKey, StallCloseReason,
  StallZone, StimId, Weather,
} from "./types";
import type { TimeBand } from "./clock";

export type { StimId, Slot, StallZone } from "./types";

export type EventMap = {
  "clock:tick":               { dt: number; gameMinutes: number; hhmm: string };
  "clock:bandChanged":        { from: TimeBand; to: TimeBand };
  "day:started":              { dayIndex: number; daySeed: number; weather: Weather };
  "day:ended":                { dayIndex: number; summary: DaySummary };
  "ui:pauseToggled":          { paused: boolean; source: "PLAYER" | "FOCUS_LOST" | "MENU" | "PLAYTEST" };

  "stim:emitted":             { stimId: StimId; zone: StallZone; salience: number; at: number
                                /** Khoá riêng của lần xảy ra (`core/stimid.ts`). */
                                key?: string
                                /** visitId của người duy nhất nhận. */
                                target?: string
                                /** Có mùi thì cả hàng cùng biết. */
                                smell?: boolean };
  "stim:expired":             { stimId: StimId };
  "perception:stateChanged":  { npcId: NpcId; stimId: StimId; from: ObsState; to: ObsState; certainty: number };
  "perception:confirmed":     { npcId: NpcId; stimId: StimId };
  "gaze:changed":             { npcId: NpcId; gazeFactor: number
                                reason: "PHONE" | "TRA_DA" | "ASKED" | "IDLE" | "TALKING" };
  "attention:toolUsed":       { tool: AttentionTool; npcId: NpcId; durationSec: number };

  "npc:arrived":              { npcId: NpcId; visitId: string; slot: CustomerSlot; atHhmm: string };
  "npc:slotChanged":          { npcId: NpcId; from: CustomerSlot; to: CustomerSlot };
  "npc:left":                 { npcId: NpcId; visitId: string; reason: LeaveReason };
  "npc:actionTaken":          { npcId: NpcId; action: "BINNED_FOOD" };
  "order:placed":             { npcId: NpcId; spec: unknown; phrasing: string };
  "order:delivered":          { npcId: NpcId; dish: string[]; waitedSec: number };
  "delivery:diffed":          { npcId: NpcId; defects: Defect[]; spoken: Defect | null
                                silentScore: number; mode: "ANTICIPATED" | "DISCOVERED" | "NONE" };

  "dialog:spoken":            { npcId: NpcId; text: string; tier: 1 | 2 | 3 };
  /** `INVITE_SAI_NGUOI` = mời người không đi ngang, tức nội dung gắn sai act. */
  "dialog:silent":            { npcId: NpcId; reason: "RATE_35" | "COOLDOWN" | "NO_RULE" | "EXPIRED" | "PERSONALITY" | "INVITE_SAI_NGUOI" };
  "bark:queued":              { npcId: NpcId; tier: 1 | 2 | 3; delaySec: number };

  "money:changed":            { delta: number; balance: number; reason: string };

  "save:autosaveRequested":   { reason: AutosaveReason };
  "save:written":             { bytes: number; ms: number; slot: "A" | "B" };
  "scene:transition":         { from: SceneKey; to: SceneKey };
  "telemetry:mark":           { key: string; value: number | string };

  "stall:closed":             { reason: StallCloseReason; served: number; revenue: number; lost: number };
  "evening:done":             { dayIndex: number };
  "broke:done":               { dayIndex: number; restart?: boolean };
  "win:done":                 { dayIndex: number; restart?: boolean };
};

export type EventKey = keyof EventMap;

type Handler<T> = (payload: T) => void;

/** Sự kiện mỗi frame, không ghi trace kẻo lấp đầy ring buffer. */
const TRACE_SKIP: ReadonlySet<EventKey> = new Set<EventKey>(["clock:tick"]);

export const TRACE_SIZE = 2000;
const MAX_DEPTH = 8;

export class Bus {
  private map = new Map<EventKey, Set<Handler<never>>>();
  private depth = 0;
  private ring: string[] = [];
  private seq = 0;

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

export type GameEvents = EventMap;
export type Stimulus = EventMap["stim:emitted"];

/** Test và headless sim tự tạo bus riêng. */
export const bus = new Bus(import.meta.env?.DEV ?? false);
