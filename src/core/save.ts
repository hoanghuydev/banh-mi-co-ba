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
import { newRelState, type Memory, type RelState } from "../sim/memory";
import { newStoryState, type StoryState } from "../sim/story";
import { newGossipState, type GossipState } from "../sim/gossip";
import { newNotebook, type Notebook } from "../sim/notebook";
import { ECON, newInventory, scaledVnd, weatherOf, type InventoryState } from "../sim/econ";
import { newEconState, type EconState } from "../sim/obligations";
import type { SupplierState } from "../sim/suppliers";
import type { DebtRecord } from "../sim/till";
import { newEquipState } from "../sim/equipment";
import { fnv1a, type BagState, type StreamName } from "./rng";
import { platform as defaultPlatform, type Platform } from "./platform";
import { BUILD_ID, DEFAULT_SETTINGS, loadSettings, type Settings } from "./flags";
import type { Bus } from "./eventbus";
import type { AutosaveReason, NpcId, SceneKey, StandPointId, Weather } from "./types";
import type { TimeBand } from "./clock";

export { loadSettings, saveSettings, DEFAULT_SETTINGS, type Settings } from "./flags";

export const SCHEMA_VERSION = 5;

/** Ký ức của NPC — schema ở P2-03 §3, luật ở `sim/memory.ts`. */
export type MemorySlot = Memory;

/**
 * State của một NPC — phần nặng nhất và quan trọng nhất của save.
 * Trí nhớ + quan hệ (P2-03) nằm trong `RelState`; phần dưới là của P1 và của P2-04/05.
 */
export type NpcState = RelState & {
  /** Đã được cho thêm bao nhiêu lần. CANON §8(i): spam hào phóng phải mất tác dụng dần. */
  freebies: number;
  /**
   * Số lần người chơi THẬT SỰ nghe khách đọc nguyên đơn ruột. Không phải số lần ghé:
   * ghé ba lần mà hai lần chỉ nói "như mọi bữa" thì người chơi mới nghe đúng một lần.
   */
  heard: number;
  lastSeenDay: number;
  knownFacts: { factId: string; confidence: number; source: NpcId | "WITNESSED"; hop: number; learnedOnDay: number }[];
  /** §8g — micro-cheat phát hiện theo PATTERN. */
  microCheatCounter: Record<string, number>;
  gone: boolean;
  goneReason?: "ARC" | "SILENT_EXIT" | "MOVED";
  /** Chuyện "một lần mỗi người cả mùa" đã xảy ra (vd. thấy thớt riêng — P3-04 A3). */
  seen?: Record<string, number>;
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
    /** P3-03 §2.6 — sổ nợ khách: ai mua chịu, bao nhiêu, người chơi có ghi không. */
    debtsOwedToPlayer: DebtRecord[];
    debtsPlayerOwes: { kind: string; amount: number; dueDay: number }[];
    qrEnabled: boolean;
  };

  /** P3-03 — kho theo LÔ (ngày mua, phần còn lại, chất lượng gốc). */
  inventory: InventoryState;
  /** P3-06 — chỗ đứng, tiền thuê còn nợ, nghĩa vụ đã trả, những gì đã mất. */
  econ: EconState;

  equipment: { owned: string[]; installed: string[]; wear: Record<string, number> };

  /** P3-02 — người bán ở chợ LÀ NPC: mối quen, nợ, trễ hạn. Không bao giờ hiện ra thành số. */
  suppliers: Record<string, SupplierState>;

  npcs: Record<NpcId, NpcState>;

  /** P2-04 — tin đồn trong đầu từng người, nhật ký lan tin, ngân sách nhớ nhầm của mùa. */
  gossip: GossipState;

  shuffleBags: Record<string, BagState>;

  dialogState: {
    spokenOnce: string[];
    norepeat: Record<string, number>;
    appliedContext: { key: string; value: unknown; expiresAtMinutes: number }[];
    barkCooldowns: Record<string, number>;
  };

  /** Sổ tay cô Ba (P2-05) — cột trái máy ghi, cột phải người chơi ghi. */
  notebook: Notebook;

  /**
   * `cleanliness` 1 = sạch bóng, 0 = bẩn hết mức (độ bẩn = 1 − cleanliness, P1-02 §2.10).
   * `presets` = 3 công thức chia sẵn mỗi sáng (P1-01 §2.6).
   */
  stall: {
    cleanliness: number; layoutSide: "LEFT" | "RIGHT"
    presets: { id: string; name: string; dish: Record<string, number>; prepped: number }[];
    /**
     * Ổ đang gác trên thớt và ổ đang cầm trên tay lúc rời quầy giữa buổi (P0-02 §2.8:
     * "thoát bất cứ lúc nào, vào lại đúng chỗ"). Không lưu thì một ổ bánh bốc hơi mỗi
     * lần thoát — bánh đã trừ khỏi kho ở kệ rồi. `dish` là id nguyên liệu (`sim/order`),
     * để nguyên `string[]` cho `core/` khỏi phải biết kiểu của `sim/`.
     * Thiếu trường (save cũ) = không có ổ nào, nên không cần bước migrate riêng.
     */
    board?: { dish: string[]; warmth: number; crust: number; q: number } | null;
    hand?: { item: string; warmth: number; crust: number; q: number } | null;
  };

  /** 40 dòng, để vẽ biểu đồ cuối mùa. */
  ledger: LedgerRow[];

  /** Bản sao cài đặt lúc ghi — cài đặt thật sống riêng để đổi ở menu là có hiệu lực ngay. */
  a11y: Settings;

  telemetry: { optedIn: boolean; sessionCount: number; totalPlayMs: number };
  flags: Record<string, boolean | number | string>;
  /** P4 — chuyện của mùa: chuyện ĐÃ xảy ra (không điểm, không ngưỡng lộ ra — T3). */
  story: StoryState;
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
    ...newRelState(),
    freebies: 0, heard: 0, lastSeenDay: 0,
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
      weather: weatherOf(1), standPoint: "DAU_HEM", dayStartSnapshotRef: null,
      today: { served: 0, lost: 0, revenue: 0 },
    },
    rng: { counters: [] },
    money: { cash: scaledVnd(ECON.startCash_k), debtsOwedToPlayer: [], debtsPlayerOwes: [], qrEnabled: false },
    inventory: newInventory(),
    econ: newEconState(),
    equipment: newEquipState(),
    suppliers: {},
    npcs: {},
    gossip: newGossipState(),
    shuffleBags: {},
    dialogState: { spokenOnce: [], norepeat: {}, appliedContext: [], barkCooldowns: {} },
    notebook: newNotebook(),
    stall: { cleanliness: 1, layoutSide: "LEFT", presets: [], board: null, hand: null },
    ledger: [],
    a11y: { ...DEFAULT_SETTINGS, ...loadSettings() },
    telemetry: { optedIn: false, sessionCount: 0, totalPlayMs: 0 },
    flags: {},
    story: newStoryState(),
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
  // 2 → 3: P2-03 — trí nhớ 3 tầng + quan hệ đầy đủ. Khung memory của v2 chưa từng được
  // ghi (MemorySlot cũ), nên chỉ bù field mới bằng mặc định, giữ nguyên field cũ.
  2: (old) => {
    for (const [k, n] of Object.entries<any>(old.npcs ?? {})) {
      const fresh = newRelState();
      old.npcs[k] = {
        ...fresh, ...n,
        memory: { short: [], long: [], core: null },
        pointsAtDawn: n.relationPoints ?? 0,
      };
    }
    // khung `gossip.inFlight` của v2 chưa từng được ghi → thay bằng state P2-04
    old.gossip = newGossipState();
    old.notebook = newNotebook();
    return old;
  },
  // 3 → 4: P3 — kho theo lô, sổ kinh tế, 6 kiểu trời. Khung `inventory.items` cũ chưa từng dùng.
  3: (old) => {
    old.inventory = newInventory();
    old.econ = newEconState();
    old.suppliers = {};
    old.money.debtsOwedToPlayer = [];
    old.equipment = newEquipState();
    old.progress.weather = weatherOf(old.progress.dayIndex ?? 1);
    return old;
  },
  // 4 → 5: P4 — chuyện của mùa. Save giữa mùa bắt đầu với "chưa có chuyện gì" (không bịa quá khứ).
  4: (old) => {
    old.story = newStoryState();
    return old;
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

  /**
   * Ghi đồng bộ, ép ngay — dùng lúc thoát, mất focus, chuyển cảnh lớn.
   *
   * LUÔN chụp lại: một `request()` trước đó có thể còn nằm chờ (idle timeout tới 3 s) với
   * bản chụp CŨ hơn hiện tại. Giữ bản cũ đó = mất mọi thứ xảy ra sau nó, đúng lúc người chơi
   * đóng tab — trái hẳn ý của §2.6 ("ghi đúng khoảnh khắc này").
   */
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
