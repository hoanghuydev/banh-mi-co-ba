import Phaser from "phaser";
import catalog from "./catalog.json";
import { Rng, fnv1a, ShuffleBag } from "../core/rng";
import { loadSettings, type Settings } from "../core/save";
import { music } from "./music";

// Mọi tiếng động phát qua đây, không scene nào tự `this.sound.play`; nhạc ở `music.ts`.

export type BusId = "duongPho" | "giongNPC" | "thaoTac" | "amBao";
export type SfxId = keyof typeof catalog;

type Entry = { bus: BusId; desc: string; files: string[] };
const CATALOG = catalog as Record<string, Entry>;

export const SFX_IDS = Object.keys(CATALOG) as SfxId[];

export function hasSfx(id: string): id is SfxId {
  return id in CATALOG;
}

export function sfxBus(id: SfxId): BusId {
  return CATALOG[id].bus;
}

/** Mức tối đa khi công tắc ở 100. */
const CEILING: Record<BusId, number> = {
  duongPho: 0.708,   // −3 dB
  giongNPC: 1.0,     //  0 dB
  thaoTac: 0.794,    // −2 dB
  amBao: 0.501,      // −6 dB
};

const VOICE_DUCK: Record<BusId, number> = {
  duongPho: 0.447,   // −7 dB
  giongNPC: 1.0,
  thaoTac: 0.708,    // −3 dB
  amBao: 1.0,        //  âm báo phải nghe thấy cả khi có người nói
};
const CROWD_DUCK = 0.282;

/** Chỉ âm chấm điểm; âm mô tả thế giới (bánh rớt, khét) không được thêm vào vì người nhìn kém cần nó. */
const NEGATIVE_CUES: Partial<Record<SfxId, SfxId | null>> = {
  ui_khong_hop_le: "ui_click_go",
  ui_ngay_am_tien: null,
  sys_canh_bao: "ui_click_go",
  wheel_truot: null,
};

const COOLDOWN_SEC: Partial<Record<SfxId, number>> = {
  sfx_coi_xe: 25,
  sfx_ga_gay: 20,
  sfx_cho_sua: 9,
  sfx_chim_se: 6,
} as Partial<Record<SfxId, number>>;

/** Rung cao độ / độ to mỗi lần phát; âm báo = 0 để luôn giống hệt nhau. */
const JITTER: Record<BusId, { rate: number; db: number }> = {
  duongPho: { rate: 0.06, db: 1.5 },
  giongNPC: { rate: 0.04, db: 1.0 },
  thaoTac: { rate: 0.05, db: 1.5 },
  amBao: { rate: 0, db: 0 },
};

/** Tiếng lầm bầm thấp hơn VO, không thì thành thứ to nhất bản phối. */
const TALK_GAIN = 0.62;

const MAX_CONCURRENT = 14;

/** Cao độ chọn tay để phân biệt NPC; hash cho ra vài cặp sát nhau nghe như một người. */
const VOICE_PITCH: Record<string, number> = {
  BA_BAY: 1.12, BA_SAU: 1.08,
  CHU_TU: 0.82, ONG_HAI: 0.78, CHU_KIET: 0.86,
  THAY_PHUC: 0.92,
  ANH_DUNG: 0.95, ANH_BAO: 1.0,
  CHI_LAN: 1.18, CHI_HANH: 1.14, CO_MAI: 1.22,
  BE_SU: 1.45,
};
const DEFAULT_PITCH = 1.0;

export function voicePitch(npcId: string): number {
  return VOICE_PITCH[npcId] ?? DEFAULT_PITCH;
}

type Loop = {
  sound: Phaser.Sound.BaseSound & { setVolume(v: number): unknown };
  bus: BusId;
  level: number;
  target: number;
  rate: number;
  pan: number;
  crowd: boolean;
  stopAtZero: boolean;
};

type Opts = {
  pan?: number;
  rate?: number;
  volume?: number;
  delay?: number;
};

const SILENT_BUS: Record<BusId, number> = { duongPho: 0, giongNPC: 0, thaoTac: 0, amBao: 0 };

class SfxDirector {
  private game: Phaser.Game | null = null;
  private loops = new Map<string, Loop>();
  private bags = new Map<string, ShuffleBag>();
  /** Dòng riêng để việc chọn biến thể không làm lệch các stream gameplay. */
  private rng = new Rng(fnv1a("sfx|presentation"));

  private vol: Record<BusId, number> = { ...SILENT_BUS };
  private crowdVol = 0.6;
  private mono = false;
  private noNegative = false;
  private pingOn = false;
  private voiceLeft = 0;
  private lastPlayed = new Map<string, number>();
  /** Giữ object chứ không đếm `live++/--`: đếm thì rò tới trần và mọi tiếng im luôn. */
  private live = new Set<Phaser.Sound.BaseSound>();
  private now = 0;
  private warned = new Set<string>();

  attach(game: Phaser.Game) {
    if (this.game) return;
    this.game = game;
    this.applySettings(loadSettings());
    game.events.on(Phaser.Core.Events.PRE_STEP, this.step, this);
    document.addEventListener("visibilitychange", () => {
      const ctx = (game.sound as { context?: AudioContext }).context;
      if (document.visibilityState === "visible" && ctx && ctx.state !== "running") ctx.resume().catch(() => {});
    });
  }

  applySettings(s: Settings) {
    const master = Math.max(0, Math.min(100, s.masterVolume)) / 100;
    const pct = (v: number) => (Math.max(0, Math.min(100, v)) / 100) * master;
    this.vol = {
      duongPho: pct(s.streetVolume),
      giongNPC: pct(s.voiceVolume),
      thaoTac: pct(s.foleyVolume),
      amBao: pct(s.uiVolume),
    };
    this.crowdVol = pct(s.crowdVolume);
    this.mono = s.monoAudio;
    this.noNegative = s.disableNegativeAudioCues;
    this.pingOn = s.a11yPerceptionPing;
    this.loops.forEach((l) => this.applyLoopGain(l));
    this.loops.forEach((l, key) => { if (this.busGain(l.bus) === 0) this.loop(null, key as SfxId, false, {}, 0); });
  }

  /** Âm một phát phải nạp trước để cú bấm đầu tiên có tiếng; ambience thì nạp lười. */
  preload(scene: Phaser.Scene, ids: readonly SfxId[]) {
    for (const id of ids) {
      const e = CATALOG[id];
      if (!e) continue;
      e.files.forEach((f, i) => {
        const key = this.key(id, i);
        if (!scene.cache.audio.exists(key)) scene.load.audio(key, f);
      });
    }
  }

  idsOfBus(...buses: BusId[]): SfxId[] {
    return SFX_IDS.filter((id) => buses.includes(CATALOG[id].bus));
  }

  play(scene: Phaser.Scene, id: SfxId, o: Opts = {}): boolean {
    const resolved = this.resolve(id);
    if (!resolved) return false;
    const e = CATALOG[resolved];
    if (!e) return false;

    const gain = this.busGain(e.bus) * (o.volume ?? 1);
    if (gain <= 0) return false;

    const cd = COOLDOWN_SEC[resolved];
    if (cd !== undefined && this.now - (this.lastPlayed.get(resolved) ?? -1e9) < cd) return false;
    if (this.countLive() >= MAX_CONCURRENT) return false;

    const idx = this.drawVariant(resolved, e.files.length);
    const key = this.key(resolved, idx);
    if (!scene.cache.audio.exists(key)) {
      if (!this.warned.has(key)) {
        this.warned.add(key);
        if (import.meta.env?.DEV) console.warn(`[sfx] chưa nạp: ${key} — thêm vào preload của scene`);
      }
      return false;
    }

    const j = JITTER[e.bus];
    const rate = (o.rate ?? 1) * (1 + (this.rng.next() * 2 - 1) * j.rate);
    const jitterDb = (this.rng.next() * 2 - 1) * j.db;
    const vol = gain * Math.pow(10, jitterDb / 20);

    const snd = scene.sound.add(key, { volume: vol, rate }) as Phaser.Sound.BaseSound;
    this.setPan(snd, o.pan ?? 0);
    snd.once(Phaser.Sound.Events.COMPLETE, () => snd.destroy());

    // Ghi vào `live` lúc phát chứ không lúc tạo, vì `countLive` dọn những cái chưa kêu.
    const start = () => { this.live.add(snd); snd.play(); };
    if (o.delay && o.delay > 0) {
      // Scene tắt trước hẹn thì `delayedCall` không chạy, phải tự dọn kẻo sound nằm lại trên mixer.
      const t = scene.time.delayedCall(o.delay, start);
      scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        if (!snd.isPlaying) { t.remove(); snd.destroy(); }
      });
    } else {
      start();
    }

    this.lastPlayed.set(resolved, this.now);
    return true;
  }

  /** Cho UI HTML không có scene trong tay; phát qua scene đang chạy. */
  ui(id: SfxId, o: Opts = {}): boolean {
    const scene = this.game?.scene.getScenes(true)[0];
    return scene ? this.play(scene, id, o) : false;
  }

  /** Như `play` nhưng bật ducking cho các bus khác. */
  voice(scene: Phaser.Scene, id: SfxId, npcId: string, pan = 0, mul = 1): boolean {
    const ok = this.play(scene, id, { pan, rate: voicePitch(npcId) * mul });
    if (ok) this.duckForVoice(1.0);
    return ok;
  }

  /** Tiếng lầm bầm thay VO; có VO thật thì gỡ hàm này. */
  talk(scene: Phaser.Scene, npcId: string, textLength: number, pan = 0) {
    if (!hasSfx("vox_blip")) return;
    const pitch = voicePitch(npcId);

    const n = Math.max(2, Math.min(5, Math.round(textLength / 15 + this.rng.next() * 1.2)));

    // `drift` là hướng cao độ cả câu, `wobble` xê dịch từng tiếng.
    const drift = (this.rng.next() * 2 - 1) * 0.14;
    let at = 0;
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 0;
      const wobble = (this.rng.next() * 2 - 1) * 0.08;
      const fall = i === n - 1 ? -0.06 : 0;
      this.play(scene, "vox_blip", {
        pan,
        rate: pitch * (1 + drift * t + wobble + fall),
        volume: TALK_GAIN * (i === 0 ? 1 : 0.78 + this.rng.next() * 0.16),
        delay: at,
      });
      // Khoảng cách không đều, đều thì nghe như máy gõ.
      at += 85 + this.rng.next() * 85;
    }
    this.duckForVoice(at / 1000 + 0.2);
  }

  /** Idempotent, gọi mỗi frame được. */
  loop(scene: Phaser.Scene | null, id: SfxId, on: boolean, o: Omit<Opts, "delay"> = {}, fadeMs = 1200) {
    const e = CATALOG[id];
    if (!e) return;
    const cur = this.loops.get(id);

    if (!on) {
      if (cur) this.fadeLoop(cur, 0, fadeMs, true);
      return;
    }
    if (this.busGain(e.bus) <= 0) return;
    if (!scene) return;

    if (cur) {
      cur.pan = o.pan ?? cur.pan;
      if (cur.target !== 1 || cur.stopAtZero) this.fadeLoop(cur, 1, fadeMs, false);
      this.applyLoopGain(cur);
      return;
    }

    const idx = this.drawVariant(id, e.files.length);
    const key = this.key(id, idx);
    if (!scene.cache.audio.exists(key)) {
      // Nạp lười: fade-in che được độ trễ, đỡ ~4 MB lúc vào quán.
      this.lazyLoad(scene, id, key, () => this.loop(scene, id, true, o, fadeMs));
      return;
    }

    const snd = scene.sound.add(key, { loop: true, volume: 0 }) as Loop["sound"];
    const l: Loop = {
      sound: snd, bus: e.bus, level: 0, target: 0, rate: 0,
      pan: o.pan ?? 0, crowd: id === ("amb_crowd"), stopAtZero: false,
    };
    this.loops.set(id, l);
    snd.play();
    this.setPan(snd, l.pan);
    this.fadeLoop(l, 1, fadeMs, false);
  }

  looping(id: SfxId) {
    const l = this.loops.get(id);
    return !!l && l.target > 0;
  }

  loopVolume(id: SfxId, v: number) {
    const l = this.loops.get(id);
    if (!l) return;
    l.target = Math.max(0, Math.min(1, v));
    if (l.rate === 0) { l.level = l.target; this.applyLoopGain(l); }
  }

  stopLoops(fadeMs = 600) {
    this.loops.forEach((l) => this.fadeLoop(l, 0, fadeMs, true));
  }

  /** Cùng một âm cho chuyện tốt lẫn xấu: chỉ báo "có người để ý", không phán xét. */
  perceptionPing(scene: Phaser.Scene, pan: number) {
    if (!this.pingOn) return;
    this.play(scene, "a11y_ping_glimpsed", { pan });
  }

  private countLive() {
    for (const s of this.live) {
      if (!s.isPlaying && !s.isPaused) this.live.delete(s);
    }
    return this.live.size;
  }

  private key(id: string, i: number) {
    return `sfx_${id}_${i}`;
  }

  private resolve(id: SfxId): SfxId | null {
    if (!this.noNegative) return id;
    return id in NEGATIVE_CUES ? (NEGATIVE_CUES[id] ?? null) : id;
  }

  private busGain(bus: BusId) {
    const duck = this.voiceLeft > 0 ? VOICE_DUCK[bus] : 1;
    return this.vol[bus] * CEILING[bus] * duck;
  }

  private drawVariant(id: string, n: number) {
    if (n <= 1) return 0;
    let bag = this.bags.get(id);
    if (!bag || bag.n !== n) { bag = new ShuffleBag(n); this.bags.set(id, bag); }
    return bag.draw(this.rng);
  }

  private setPan(snd: Phaser.Sound.BaseSound, pan: number) {
    const p = this.mono ? 0 : Math.max(-1, Math.min(1, pan));
    (snd as unknown as { setPan?: (v: number) => void }).setPan?.(p);
  }

  private lazyLoad(scene: Phaser.Scene, id: string, key: string, done: () => void) {
    const e = CATALOG[id];
    const i = Number(key.slice(key.lastIndexOf("_") + 1));
    scene.load.audio(key, e.files[i]);
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
      if (scene.cache.audio.exists(key)) done();
    });
    scene.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, () => { });
    if (!scene.load.isLoading()) scene.load.start();
  }

  private fadeLoop(l: Loop, target: number, ms: number, stopAtZero: boolean) {
    l.target = target;
    l.stopAtZero = stopAtZero;
    l.rate = ms <= 0 ? Infinity : 1 / (ms / 1000);
    if (ms <= 0) {
      l.level = target;
      this.applyLoopGain(l);
      if (target === 0 && stopAtZero) this.dropLoop(l);
    }
  }

  private applyLoopGain(l: Loop) {
    const sub = l.crowd ? this.crowdVol : 1;
    const duck = this.voiceLeft > 0 ? (l.crowd ? CROWD_DUCK : VOICE_DUCK[l.bus]) : 1;
    l.sound.setVolume(l.level * this.vol[l.bus] * CEILING[l.bus] * sub * duck);
    this.setPan(l.sound as Phaser.Sound.BaseSound, l.pan);
  }

  private dropLoop(l: Loop) {
    l.sound.stop();
    l.sound.destroy();
    for (const [k, v] of this.loops) if (v === l) this.loops.delete(k);
  }

  private duckForVoice(seconds: number) {
    this.voiceLeft = Math.max(this.voiceLeft, seconds + 0.45);   // + release 450 ms
    music.voiceDuck(true);
    this.loops.forEach((l) => this.applyLoopGain(l));
  }

  private step(_t: number, deltaMs: number) {
    const dt = Math.min(deltaMs, 100) / 1000;
    this.now += dt;

    if (this.voiceLeft > 0) {
      this.voiceLeft -= dt;
      if (this.voiceLeft <= 0) {
        this.voiceLeft = 0;
        music.voiceDuck(false);
        this.loops.forEach((l) => this.applyLoopGain(l));
      }
    }

    this.loops.forEach((l) => {
      if (l.level === l.target) return;
      const stepSize = l.rate === Infinity ? 1 : l.rate * dt;
      l.level = l.level < l.target
        ? Math.min(l.target, l.level + stepSize)
        : Math.max(l.target, l.level - stepSize);
      this.applyLoopGain(l);
      if (l.level === 0 && l.stopAtZero) this.dropLoop(l);
    });
  }
}

export const sfx = new SfxDirector();
