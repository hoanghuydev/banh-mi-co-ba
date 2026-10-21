// Chụp trong frame, ghi lúc rảnh; slot A/B để crash giữa lúc ghi không mất save; checksum sai chỉ cảnh báo.
import { ECON, newInventory, scaledVnd, weatherOf, type InventoryState } from "../sim/econ";
import { newEconState, type EconState } from "../sim/obligations";
import { newEquipState } from "../sim/equipment";
import { fnv1a, type BagState, type StreamName } from "./rng";
import { platform as defaultPlatform, type Platform } from "./platform";
import { BUILD_ID, DEFAULT_SETTINGS, loadSettings, type Settings } from "./flags";
import type { Bus } from "./eventbus";
import type { AutosaveReason, NpcId, SceneKey, Weather } from "./types";
import type { TimeBand } from "./clock";

export { loadSettings, saveSettings, DEFAULT_SETTINGS, type Settings } from "./flags";

/** Save khác phiên bản này bị bỏ qua — vào game như chưa có ván nào. */
export const SCHEMA_VERSION = 6;

export type NpcState = {
  /** Quay đầu ở đầu hẻm không tính. */
  visits: number;
  lastSeenDay: number;
  seen?: Record<string, number>;
  talksDone?: string[];
  talkTopics?: { day: number; topics: string[] };
};

export type LedgerRow = { day: number; revenue: number; cost: number; served: number; lost: number };

export type SaveFile = {
  schemaVersion: number;
  saveId: string;
  createdAt: string;
  savedAt: string;
  buildId: string;
  /** FNV-1a của payload, chỉ phát hiện hỏng, không chống sửa. */
  checksum: string;
  playerName: string;

  progress: {
    dayIndex: number;
    band: TimeBand;
    gameMinutes: number;
    scene: SceneKey;
    weather: Weather;
    dayStartSnapshotRef: string | null;
    today: { served: number; lost: number; revenue: number;
      /** Lưu trong save để thoát ra vào lại không lách được trần cuộc/ngày. */
      talksDeep?: number; talkOffers?: number;
      /** Cho `sim/gearHint`: ổ cháy · tay cầm tiền bốc nhân · khách lạ ghé. */
      burnt?: number; bareHands?: number; strangers?: number };
  };

  rng: { counters: [StreamName, number][] };

  money: {
    cash: number;
    qrEnabled: boolean;
  };

  inventory: InventoryState;
  econ: EconState;

  equipment: { owned: string[]; installed: string[]; wear: Record<string, number> };

  npcs: Record<NpcId, NpcState>;

  shuffleBags: Record<string, BagState>;

  dialogState: {
    spokenOnce: string[];
    norepeat: Record<string, number>;
    appliedContext: { key: string; value: unknown; expiresAtMinutes: number }[];
    barkCooldowns: Record<string, number>;
  };

  /** `cleanliness` 1 = sạch bóng, 0 = bẩn hết mức. */
  stall: {
    cleanliness: number; layoutSide: "LEFT" | "RIGHT"
    presets: { id: string; name: string; dish: Record<string, number>; prepped: number }[];
    /** Ổ dở dang lúc thoát giữa buổi (bánh đã trừ kho); `dish` để `string[]` cho `core/` khỏi biết kiểu `sim/`. */
    board?: { dish: string[]; warmth: number; crust: number; q: number } | null;
    hand?: { item: string; warmth: number; crust: number; q: number } | null;
    basket?: {
      hand?: string; warmth: number; crust: number; q: number; soiled?: boolean;
      dish?: string[]; dishQ?: number;
    }[] | null;
    floor?: { x: number; y: number; hand: string; warmth: number; crust: number; q: number; soiled?: boolean; dish: string[] }[] | null;
    handSoiled?: boolean;
    boardSoiled?: boolean;
  };

  ledger: LedgerRow[];

  a11y: Settings;

  telemetry: { optedIn: boolean; sessionCount: number };
  flags: Record<string, boolean | number | string>;
};

function uuid(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `s-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export function newNpcState(): NpcState {
  return { visits: 0, lastSeenDay: 0 };
}

export function newGame(name: string, saveId = uuid()): SaveFile {
  const now = new Date().toISOString();
  return {
    schemaVersion: SCHEMA_VERSION,
    saveId,
    createdAt: now,
    savedAt: now,
    buildId: BUILD_ID,
    checksum: "",
    // Khớp `DEFAULT_PLAYER_NAME` ở `content/shop.ts`; `core/` không import `content/`.
    playerName: name || "Phương Anh",
    progress: {
      dayIndex: 1, band: "PRE_OPEN", gameMinutes: 6 * 60, scene: "Market",
      weather: weatherOf(1), dayStartSnapshotRef: null,
      today: { served: 0, lost: 0, revenue: 0, talksDeep: 0, talkOffers: 0 },
    },
    rng: { counters: [] },
    money: { cash: scaledVnd(ECON.startCash_k), qrEnabled: false },
    inventory: newInventory(),
    econ: newEconState(),
    equipment: newEquipState(),
    npcs: {},
    shuffleBags: {},
    dialogState: { spokenOnce: [], norepeat: {}, appliedContext: [], barkCooldowns: {} },
    stall: { cleanliness: 1, layoutSide: "LEFT", presets: [], board: null, hand: null },
    ledger: [],
    a11y: { ...DEFAULT_SETTINGS, ...loadSettings() },
    telemetry: { optedIn: false, sessionCount: 0 },
    flags: {},
  };
}

/** Bổ sung field thiếu — save sửa tay không được làm sập game. */
function normalize(s: SaveFile): SaveFile {
  const d = newGame(s.playerName, s.saveId);
  for (const k of Object.keys(d) as (keyof SaveFile)[]) (s as any)[k] ??= (d as any)[k];
  s.progress = { ...d.progress, ...s.progress, today: { ...d.progress.today, ...s.progress?.today } };
  s.money = { ...d.money, ...s.money };
  s.dialogState = { ...d.dialogState, ...s.dialogState };
  for (const [k, n] of Object.entries(s.npcs)) s.npcs[k] = { ...newNpcState(), ...n };
  return s;
}

function stringifyWithChecksum(s: SaveFile): { json: string; checksum: string } {
  s.checksum = "";
  const blank = JSON.stringify(s);
  const checksum = fnv1a(blank).toString(16).padStart(8, "0");
  s.checksum = checksum;
  return { json: blank.replace('"checksum":""', `"checksum":"${checksum}"`), checksum };
}

function verifyChecksum(s: SaveFile): boolean {
  const want = s.checksum;
  s.checksum = "";
  const ok = fnv1a(JSON.stringify(s)).toString(16).padStart(8, "0") === want;
  s.checksum = want;
  return ok;
}

const PREFIX = "byesep.";
const K = {
  slotA: `${PREFIX}slotA`,
  slotB: `${PREFIX}slotB`,
  meta: `${PREFIX}meta`,
  day: (saveId: string, day: number) => `${PREFIX}day.${saveId}:${day}`,
};

type Meta = { activeSlot: "A" | "B"; schemaVersion: number; savedAt: string; checksum: string };

export const AUTOSAVE_COALESCE_MS = 500;
export const AUTOSAVE_IDLE_TIMEOUT_MS = 3000;
export const SAVE_SIZE_WARN_KB = 512;
export const DAY_SNAPSHOT_KEEP = 2;

export type DayStartSnapshot = { key: string; dayIndex: number; payload: SaveFile };

export class SaveService {
  private pending: SaveFile | null = null;
  private handle: number | null = null;
  private slot: "A" | "B";
  forcedWrites = 0;
  writes = 0;

  constructor(
    private bus: Bus,
    private snapshot: () => SaveFile,
    private platform: Platform = defaultPlatform,
  ) {
    this.slot = this.readMeta()?.activeSlot ?? "B";
  }

  hasSave() {
    return this.readMeta()?.schemaVersion === SCHEMA_VERSION;
  }

  request(reason: AutosaveReason) {
    this.pending = this.snapshot();
    this.bus.emit("save:autosaveRequested", { reason });
    if (this.handle !== null) return;

    const g = globalThis as any;
    if (typeof g.requestIdleCallback === "function") {
      this.handle = g.requestIdleCallback((dl: { didTimeout: boolean }) => {
        if (dl?.didTimeout) this.forcedWrites++;
        this.flush();
      }, { timeout: AUTOSAVE_IDLE_TIMEOUT_MS });
    } else if (typeof g.setTimeout === "function") {
      this.handle = g.setTimeout(() => this.flush(), AUTOSAVE_COALESCE_MS);
    } else {
      this.flush();
    }
  }

  /** Luôn chụp lại vì `request()` đang chờ có thể giữ bản chụp cũ. */
  flushNow(reason: AutosaveReason = "QUIT") {
    this.pending = this.snapshot();
    this.bus.emit("save:autosaveRequested", { reason });
    this.flush();
  }

  private flush() {
    const g = globalThis as any;
    if (this.handle !== null) {
      g.cancelIdleCallback?.(this.handle);
      g.clearTimeout?.(this.handle);
      this.handle = null;
    }
    const snap = this.pending;
    this.pending = null;
    if (!snap) return;

    const t0 = now();
    snap.savedAt = new Date().toISOString();
    snap.schemaVersion = SCHEMA_VERSION;
    snap.buildId = BUILD_ID;
    const { json, checksum } = stringifyWithChecksum(snap);

    const next: "A" | "B" = this.slot === "A" ? "B" : "A";
    if (!this.platform.write(next === "A" ? K.slotA : K.slotB, json)) return;
    this.platform.write(K.meta, JSON.stringify({
      activeSlot: next, schemaVersion: SCHEMA_VERSION, savedAt: snap.savedAt, checksum,
    } satisfies Meta));
    this.slot = next;
    this.writes++;
    const ms = now() - t0;
    this.bus.emit("save:written", { bytes: json.length, ms, slot: next });
    if (json.length > SAVE_SIZE_WARN_KB * 1024) {
      this.bus.emit("telemetry:mark", { key: "save.size_warn_kb", value: Math.round(json.length / 1024) });
    }
  }

  private readMeta(): Meta | null {
    const raw = this.platform.read(K.meta);
    if (!raw) return null;
    try { return JSON.parse(raw) as Meta; } catch { return null; }
  }

  /** Slot đang hoạt động hỏng thì lùi về slot kia. */
  load(): SaveFile | null {
    const meta = this.readMeta();
    if (meta?.schemaVersion !== SCHEMA_VERSION) return null;
    for (const slot of [meta.activeSlot, meta.activeSlot === "A" ? "B" : "A"] as const) {
      const raw = this.platform.read(slot === "A" ? K.slotA : K.slotB);
      if (!raw) continue;
      try {
        const s = this.parse(raw);
        if (!s) continue;
        this.slot = slot;
        return s;
      } catch {
        this.bus.emit("telemetry:mark", { key: "save.slot_corrupt", value: slot });
      }
    }
    return null;
  }

  parse(raw: string): SaveFile | null {
    const s = JSON.parse(raw);
    if (s?.schemaVersion !== SCHEMA_VERSION) return null;
    if (s.checksum && !verifyChecksum(s)) {
      this.bus.emit("telemetry:mark", { key: "save.checksum_mismatch", value: 1 });
    }
    return normalize(s as SaveFile);
  }

  clear() {
    this.pending = null;
    for (const k of [K.slotA, K.slotB, K.meta]) this.platform.remove(k);
    for (const k of this.platform.keys(`${PREFIX}day.`)) this.platform.remove(k);
  }

  writeDayStart(s: SaveFile): string {
    const key = `${s.saveId}:${s.progress.dayIndex}`;
    const snap: DayStartSnapshot = { key, dayIndex: s.progress.dayIndex, payload: s };
    this.platform.write(K.day(s.saveId, s.progress.dayIndex), JSON.stringify(snap));
    const mine = this.platform.keys(`${PREFIX}day.${s.saveId}:`)
      .map((k) => ({ k, d: Number(k.split(":").pop()) }))
      .sort((a, b) => a.d - b.d);
    for (const { k } of mine.slice(0, Math.max(0, mine.length - DAY_SNAPSHOT_KEEP))) this.platform.remove(k);
    return key;
  }

  readDayStart(saveId: string, day: number): SaveFile | null {
    const raw = this.platform.read(K.day(saveId, day));
    if (!raw) return null;
    try {
      const p = (JSON.parse(raw) as DayStartSnapshot).payload;
      return p?.schemaVersion === SCHEMA_VERSION ? normalize(p) : null;
    } catch { return null; }
  }
}

function now() {
  return typeof performance !== "undefined" ? performance.now() : 0;
}
