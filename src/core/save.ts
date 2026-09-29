/**
 * Save — P0-02 §2.5–§2.8. CANON §2: localStorage, autosave sau MỖI KHÁCH.
 *
 * Bốn quyết định:
 *  1. CHỤP trong frame (rẻ, phải đúng khoảnh khắc), GHI lúc rảnh (`requestIdleCallback`).
 *  2. Double-buffer A/B + meta: crash giữa lúc ghi slot B thì slot A vẫn nguyên.
 *     Với một game 40 ngày về quan hệ không respawn được, mất save là mất người chơi.
 *  3. `timeout: 3000` — giờ cao điểm idle có thể không bao giờ tới.
 *  4. Checksum sai thì CẢNH BÁO, không chặn (§8f: sửa save là chuyện của người chơi).
 *
 * Chống save-scum (§2.8) = autosave NGAY khi sự kiện xảy ra × seed cố định theo ngày
 * × stream RNG tách. Cái KHÔNG khoá: chơi lại cả ngày bằng nút chính thức.
 */
import { fnv1a, type BagState, type StreamName } from "./rng";
import { platform as defaultPlatform, type Platform } from "./platform";
import { BUILD_ID, DEFAULT_SETTINGS, loadSettings, type Settings } from "./flags";
import type { Bus } from "./eventbus";
import type { AutosaveReason, NpcId, RelTier, SceneKey, StandPointId, StimId, Weather } from "./types";
import type { TimeBand } from "./clock";

export { loadSettings, saveSettings, DEFAULT_SETTINGS, type Settings } from "./flags";

export const SCHEMA_VERSION = 2;

export type MemorySlot = {
  id: string; kind: StimId; intensity: number;
  createdOnDay: number; lastTouchedDay: number;
  stackIndex: number;
  source: "WITNESSED" | "TOLD_BY"; toldBy?: NpcId; confidence: number;
};

/**
 * State của một NPC — phần nặng nhất và quan trọng nhất của save.
 * Ba field đầu là thứ P1 đã dùng thật; phần còn lại là khung cho P2 (trí nhớ, quan hệ).
 */
export type NpcState = {
  /** Lần ghé trong mùa. */
  visits: number;
  /** Đã được cho thêm bao nhiêu lần. CANON §8(i): spam hào phóng phải mất tác dụng dần. */
  freebies: number;
  /**
   * Số lần người chơi THẬT SỰ nghe khách đọc nguyên đơn ruột. Không phải số lần ghé:
   * ghé ba lần mà hai lần chỉ nói "như mọi bữa" thì người chơi mới nghe đúng một lần.
   */
  heard: number;
  relationPoints: number;
  tier: RelTier;
  /** §8d: đốt rồi để nguội → HẠ TRẦN VĨNH VIỄN. */
  trustCeiling: number;
  lastSeenDay: number;
  memory: { short: MemorySlot[]; long: MemorySlot[]; core: MemorySlot | null };
  knownFacts: { factId: string; confidence: number; source: NpcId | "WITNESSED"; hop: number; learnedOnDay: number }[];
  /** §8g — micro-cheat phát hiện theo PATTERN. */
  microCheatCounter: Record<string, number>;
  gone: boolean;
  goneReason?: "ARC" | "SILENT_EXIT" | "MOVED";
};

export type LedgerRow = { day: number; revenue: number; cost: number; served: number; lost: number };

export type SaveFile = {
  schemaVersion: number;
  /** UUID, cố định đời đời — hạt giống của mọi RNG. */
  saveId: string;
  createdAt: string;
  savedAt: string;
  /** git sha — để lọc bug report. */
  buildId: string;
  /** FNV-1a của payload. Phát hiện HỎNG, không chống SỬA (§8f). */
  checksum: string;
  playerName: string;

  progress: {
    dayIndex: number;                    // 1..40
    band: TimeBand;
    gameMinutes: number;
    /** Reload vào đúng chỗ đang đứng. */
    scene: SceneKey;
    weather: Weather;
    standPoint: StandPointId;
    dayStartSnapshotRef: string | null;
    /** Sổ sách của ngày đang dở — để reload giữa buổi bán không mất tiền đã thu. */
    today: { served: number; lost: number; revenue: number };
  };

  rng: { counters: [StreamName, number][] };

  money: {
    cash: number;
    debtsOwedToPlayer: { npcId: NpcId; amount: number; sinceDay: number }[];
    debtsPlayerOwes: { kind: string; amount: number; dueDay: number }[];
    qrEnabled: boolean;
  };

  inventory: {
    items: { itemId: string; qty: number; boughtOnDay: number; quality: number; supplierId: string }[];
    fridgeCapacity: number;
  };

  equipment: { owned: string[]; installed: string[]; wear: Record<string, number> };

  suppliers: Record<string, { relationPoints: number; tier: RelTier; lastBoughtDay: number; streakDays: number }>;

  npcs: Record<NpcId, NpcState>;

  gossip: {
    inFlight: { factId: string; origin: NpcId; holders: NpcId[]; hop: number; confidence: number
                mutatedFrom?: string; createdOnDay: number }[];
  };

  shuffleBags: Record<string, BagState>;

  dialogState: {
    spokenOnce: string[];
    norepeat: Record<string, number>;
    appliedContext: { key: string; value: unknown; expiresAtMinutes: number }[];
    barkCooldowns: Record<string, number>;
  };

  /** Sổ tay NGƯỜI CHƠI tự ghi (P2-05). */
  notebook: {
    entries: { npcId: NpcId; field: string; value: string; writtenOnDay: number; byPlayer: true }[];
    hypotheses: { id: string; npcId: NpcId; text: string; status: "OPEN" | "CONFIRMED" | "WRONG"; resolvedOnDay?: number }[];
    pinned: NpcId[];
  };

  /**
   * `cleanliness` 1 = sạch bóng, 0 = bẩn hết mức (độ bẩn = 1 − cleanliness, P1-02 §2.10).
   * `presets` = 3 công thức chia sẵn mỗi sáng (P1-01 §2.6).
   */
  stall: {
    cleanliness: number; layoutSide: "LEFT" | "RIGHT"
    presets: { id: string; name: string; dish: Record<string, number>; prepped: number }[];
  };

  /** 40 dòng, để vẽ biểu đồ cuối mùa. */
  ledger: LedgerRow[];

  /** Bản sao cài đặt lúc ghi — cài đặt thật sống riêng để đổi ở menu là có hiệu lực ngay. */
  a11y: Settings;

  telemetry: { optedIn: boolean; sessionCount: number; totalPlayMs: number };
  flags: Record<string, boolean | number | string>;
};

export const SEASON_DAYS = 40;

function uuid(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  // Không có crypto (trình duyệt rất cũ): vẫn phải duy nhất, không cần mật mã.
  return `s-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export function newNpcState(): NpcState {
  return {
    visits: 0, freebies: 0, heard: 0,
    relationPoints: 0, tier: "ACQUAINTANCE", trustCeiling: 100, lastSeenDay: 0,
    memory: { short: [], long: [], core: null },
    knownFacts: [], microCheatCounter: {}, gone: false,
  };
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
    playerName: name || "Cháu cô Ba",
    progress: {
      dayIndex: 1, band: "PRE_OPEN", gameMinutes: 6 * 60, scene: "Market",
      weather: "NANG", standPoint: "DAU_HEM", dayStartSnapshotRef: null,
      today: { served: 0, lost: 0, revenue: 0 },
    },
    rng: { counters: [] },
    money: { cash: 150_000, debtsOwedToPlayer: [], debtsPlayerOwes: [], qrEnabled: false },
    inventory: { items: [], fridgeCapacity: 0 },
    equipment: { owned: [], installed: [], wear: {} },
    suppliers: {},
    npcs: {},
    gossip: { inFlight: [] },
    shuffleBags: {},
    dialogState: { spokenOnce: [], norepeat: {}, appliedContext: [], barkCooldowns: {} },
    notebook: { entries: [], hypotheses: [], pinned: [] },
    stall: { cleanliness: 1, layoutSide: "LEFT", presets: [] },
    ledger: [],
    a11y: { ...DEFAULT_SETTINGS, ...loadSettings() },
    telemetry: { optedIn: false, sessionCount: 0, totalPlayMs: 0 },
    flags: {},
  };
}

// ─────────────────────────────────────────────────────────────── migration (§2.7)

/** Id NPC ở bản dựng đầu → id CANON §9. */
const LEGACY_NPC_IDS: Record<string, NpcId> = { bay: "BA_BAY", tu: "CHU_TU", dung: "ANH_DUNG" };

/**
 * Bốn luật: chỉ tiến không lùi · chạy tuần tự từng bước · backup trước khi migrate ·
 * thêm field mới luôn có mặc định, không bao giờ đổi nghĩa field cũ.
 */
export const MIGRATIONS: Record<number, (s: any) => any> = {
  // 1 → 2: bản dựng thử đầu tiên (một object phẳng) → SaveFile đầy đủ của P0-02.
  1: (old) => {
    const s = newGame(old.playerName ?? "", `legacy-${old.seed ?? 0}`);
    s.createdAt = old.savedAt ? new Date(old.savedAt).toISOString() : s.createdAt;
    s.progress.dayIndex = old.day ?? 1;
    s.money.cash = old.money ?? s.money.cash;
    for (const [k, m] of Object.entries<any>(old.npcMemory ?? {})) {
      const n = newNpcState();
      n.visits = m.visits ?? 0;
      n.freebies = m.freebies ?? 0;
      // Đơn ruột giờ sinh theo saveId + id CANON, tức là ĐỔI so với bản cũ.
      // Giữ `heard` thì khách sẽ nói "như mọi bữa" cho một đơn người chơi chưa nghe bao giờ.
      n.heard = 0;
      s.npcs[LEGACY_NPC_IDS[k] ?? k] = n;
    }
    if (old.settings) s.a11y = { ...s.a11y, ...old.settings };
    return s;
  },
};

export class SaveTooNewError extends Error {
  constructor(readonly found: number) {
    super(`Bản lưu này của phiên bản game mới hơn (schema ${found} > ${SCHEMA_VERSION}).`);
  }
}

/** Bổ sung field thiếu — save sửa tay hay save cũ đều không được làm sập game. */
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

// ──────────────────────────────────────────────────────────────── SaveService

const PREFIX = "banhmicoba.";
const K = {
  slotA: `${PREFIX}slotA`,
  slotB: `${PREFIX}slotB`,
  meta: `${PREFIX}meta`,
  legacy: `${PREFIX}save.v1`,
  backup: (tag: string) => `${PREFIX}backup.${tag}`,
  day: (saveId: string, day: number) => `${PREFIX}day.${saveId}:${day}`,
};

type Meta = { activeSlot: "A" | "B"; schemaVersion: number; savedAt: string; checksum: string };

export const AUTOSAVE_COALESCE_MS = 500;
export const AUTOSAVE_IDLE_TIMEOUT_MS = 3000;
export const SAVE_SIZE_WARN_KB = 512;
export const DAY_SNAPSHOT_KEEP = 2;
const BACKUP_KEEP = 3;

export type DayStartSnapshot = { key: string; dayIndex: number; payload: SaveFile };

export class SaveService {
  private pending: SaveFile | null = null;
  private handle: number | null = null;
  private slot: "A" | "B";
  /** Số lần ghi bị ép (idle không tới) — telemetry, mục tiêu < 10%. */
  forcedWrites = 0;
  writes = 0;

  constructor(
    private bus: Bus,
    /** Chụp thế giới NGAY BÂY GIỜ thành một object thuần. Chủ context cung cấp. */
    private snapshot: () => SaveFile,
    private platform: Platform = defaultPlatform,
  ) {
    this.slot = this.readMeta()?.activeSlot ?? "B";
  }

  /** Có save nào để "Chơi tiếp" không — không cần parse cả file. */
  hasSave() {
    return !!this.readMeta() || !!this.platform.read(K.legacy);
  }

  // ── ghi ──────────────────────────────────────────────────────────────────

  request(reason: AutosaveReason) {
    this.pending = this.snapshot();                        // ≤ 1 ms, chụp đúng khoảnh khắc này
    this.bus.emit("save:autosaveRequested", { reason });
    if (this.handle !== null) return;                      // gộp: chỉ giữ snapshot mới nhất

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

  /** Ghi đồng bộ, ép ngay — dùng lúc thoát, mất focus, chuyển cảnh lớn. */
  flushNow(reason: AutosaveReason = "QUIT") {
    if (!this.pending) this.pending = this.snapshot();
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

    const next: "A" | "B" = this.slot === "A" ? "B" : "A";   // GHI LUÂN PHIÊN
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

  // ── đọc ──────────────────────────────────────────────────────────────────

  private readMeta(): Meta | null {
    const raw = this.platform.read(K.meta);
    if (!raw) return null;
    try { return JSON.parse(raw) as Meta; } catch { return null; }
  }

  /**
   * Đọc slot đang hoạt động; hỏng thì lùi về slot kia; không có gì thì thử save
   * đời đầu. Save của phiên bản MỚI hơn → ném `SaveTooNewError`, không đoán mò.
   */
  load(): SaveFile | null {
    const meta = this.readMeta();
    const order: ("A" | "B")[] = meta ? [meta.activeSlot, meta.activeSlot === "A" ? "B" : "A"] : [];
    for (const slot of order) {
      const raw = this.platform.read(slot === "A" ? K.slotA : K.slotB);
      if (!raw) continue;
      try {
        const s = this.parse(raw);
        this.slot = slot;
        return s;
      } catch (e) {
        if (e instanceof SaveTooNewError) throw e;
        this.bus.emit("telemetry:mark", { key: "save.slot_corrupt", value: slot });
      }
    }
    const legacy = this.platform.read(K.legacy);
    if (legacy) {
      try { return this.parse(legacy); } catch (e) { if (e instanceof SaveTooNewError) throw e; }
    }
    return null;
  }

  parse(raw: string): SaveFile {
    let s = JSON.parse(raw);
    s.schemaVersion ??= s.version ?? 1;
    if (s.schemaVersion > SCHEMA_VERSION) throw new SaveTooNewError(s.schemaVersion);
    if (s.schemaVersion < SCHEMA_VERSION) {
      this.backup(`pre-migrate-v${s.schemaVersion}`, raw);  // luôn giữ bản gốc
      while (s.schemaVersion < SCHEMA_VERSION) {
        const step = MIGRATIONS[s.schemaVersion];
        if (!step) throw new Error(`Thiếu migration từ schema ${s.schemaVersion}`);
        const from = s.schemaVersion;
        s = step(s);
        s.schemaVersion = from + 1;
      }
    } else if (s.checksum && !verifyChecksum(s)) {
      this.bus.emit("telemetry:mark", { key: "save.checksum_mismatch", value: 1 });   // CẢNH BÁO, không chặn
    }
    return normalize(s as SaveFile);
  }

  private backup(tag: string, raw: string) {
    this.platform.write(K.backup(`${tag}.${Date.now()}`), raw);
    const all = this.platform.keys(`${PREFIX}backup.`).sort();
    for (const k of all.slice(0, Math.max(0, all.length - BACKUP_KEEP))) this.platform.remove(k);
  }

  /** Xoá sạch để bắt đầu mùa mới. Bản chụp đầu ngày của mùa cũ cũng đi theo. */
  clear() {
    for (const k of [K.slotA, K.slotB, K.meta, K.legacy]) this.platform.remove(k);
    for (const k of this.platform.keys(`${PREFIX}day.`)) this.platform.remove(k);
  }

  // ── bản chụp đầu ngày + "Chơi lại ngày này" (§2.8) ───────────────────────

  /** Chụp lúc `day:started`, TRƯỚC khi đi chợ. Giữ tối đa 2 bản. */
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
    try { return normalize((JSON.parse(raw) as DayStartSnapshot).payload); } catch { return null; }
  }
}

function now() {
  return typeof performance !== "undefined" ? performance.now() : 0;
}
