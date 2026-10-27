import Phaser from "phaser";
import { loadSettings, type Settings } from "../core/save";

// Fade chạy bằng `game.events` PRE_STEP chứ không tween của scene, vì scene tắt giữa chừng sẽ kẹt tiếng ở nửa âm lượng.

export type CueId = "menu" | "to_mo" | "cao_diem" | "lang" | "toi";

export type Cue = {
  key: string;
  file: string;
  title: string;
  author: string;
  license: string;
};

export const CUES: Record<CueId, Cue> = {
  menu: {
    key: "mus_menu", file: "audio/music/menu-cattails.mp3",
    title: "Cattails", author: "Kevin MacLeod", license: "CC BY 4.0",
  },
  to_mo: {
    key: "mus_to_mo", file: "audio/music/to-mo-morning.mp3",
    title: "Morning", author: "Kevin MacLeod", license: "CC BY 4.0",
  },
  cao_diem: {
    key: "mus_cao_diem", file: "audio/music/cao-diem-ave-marimba.mp3",
    title: "Ave Marimba", author: "Kevin MacLeod", license: "CC BY 4.0",
  },
  lang: {
    key: "mus_lang", file: "audio/music/lang-windswept.mp3",
    title: "Windswept", author: "Kevin MacLeod", license: "CC BY 4.0",
  },
  toi: {
    key: "mus_toi", file: "audio/music/toi-avec-soin.mp3",
    title: "Avec Soin", author: "Kevin MacLeod", license: "CC BY 4.0",
  },
};


const BUS_CEILING = 0.5;

const DUCK_GAIN = 0.25;

const VOICE_DUCK_GAIN = 0.2;

/** Phát thẳng từ file (không giải mã cả bài vào RAM); âm lượng qua `GainNode` vì iOS bỏ qua `el.volume`. */
type Voice = {
  el: HTMLAudioElement;
  gain: GainNode | null;
};

type Track = {
  id: CueId;
  voice: Voice;
  level: number;
  target: number;
  rate: number;
  stopAtZero: boolean;
};

const GESTURES = ["pointerup", "touchend", "click", "keydown"] as const;

/** Đủ cho một bài đang vào, một bài đang ra và một bài bị đổi ý giữa chừng. */
const POOL = 3;

/** WAV im 1 mẫu: phát một lần trong cú chạm đầu để iOS cho phép phần tử đó tự phát về sau. */
const SILENT = "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQIAAAAAAA==";

class MusicDirector {
  private game: Phaser.Game | null = null;
  private tracks = new Map<CueId, Track>();
  private currentId: CueId | null = null;
  private pool: Voice[] = [];
  private free: Voice[] = [];

  private volume = 0.55;
  private duckGain = 1;
  /** Tách khỏi `duckGain` vì pause và giọng NPC chồng được lên nhau. */
  private voiceDuckGain = 1;
  private hushLeft = 0;

  private gestured = false;
  private pending: { id: CueId; fadeMs: number } | null = null;

  attach(game: Phaser.Game) {
    if (this.game) return;
    this.game = game;
    this.applySettings(loadSettings());
    game.events.on(Phaser.Core.Events.PRE_STEP, this.step, this);
    // Như `pauseOnBlur` của Phaser: context bị treo thì phần tử cũng phải dừng, không thì bài trôi tiếp trong im lặng.
    game.events.on(Phaser.Core.Events.BLUR, () => this.tracks.forEach((t) => t.voice.el.pause()));
    game.events.on(Phaser.Core.Events.FOCUS, () => this.tracks.forEach((t) => this.resume(t.voice)));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") this.resumeContext();
    });
    const onGesture = () => {
      for (const g of GESTURES) window.removeEventListener(g, onGesture, true);
      this.gestured = true;
      this.resumeContext();
      this.unlock();
      const p = this.pending;
      this.pending = null;
      if (p && this.currentId === p.id) this.start(p.id, p.fadeMs);
    };
    for (const g of GESTURES) window.addEventListener(g, onGesture, { capture: true, passive: true });
  }

  private get context() {
    return (this.game?.sound as { context?: AudioContext } | undefined)?.context;
  }

  private resumeContext() {
    const ctx = this.context;
    if (ctx && ctx.state !== "running") ctx.resume().catch(() => {});
  }

  private voices() {
    if (this.pool.length) return;
    const ctx = this.context;
    const out = (this.game?.sound as { destination?: AudioNode } | undefined)?.destination ?? ctx?.destination;
    for (let i = 0; i < POOL; i++) {
      const el = new Audio();
      el.loop = true;
      el.preload = "auto";
      let gain: GainNode | null = null;
      if (ctx && out) {
        gain = ctx.createGain();
        gain.gain.value = 0;
        ctx.createMediaElementSource(el).connect(gain);
        gain.connect(out);
      } else el.volume = 0;
      this.pool.push({ el, gain });
    }
    this.free = [...this.pool];
  }

  private unlock() {
    this.voices();
    for (const v of this.free) {
      v.el.src = SILENT;
      v.el.play().then(() => { if (v.el.src === SILENT) v.el.pause(); }).catch(() => {});
    }
  }

  private resume(v: Voice) {
    if (v.el.paused) v.el.play().catch(() => {});
  }

  applySettings(s: Settings) {
    const pct = (v: number) => Math.max(0, Math.min(100, v)) / 100;
    this.volume = pct(s.musicVolume) * pct(s.masterVolume);
    this.refreshGains();
    if (this.volume === 0) this.stop(0);
  }

  /** Gọi lại với cue đang phát thì không làm gì, nên gọi mỗi frame cũng được. */
  play(id: CueId, fadeMs = 1400) {
    if (this.currentId === id) return;
    if (this.volume === 0) { this.currentId = id; this.pending = null; return; }
    this.currentId = id;
    this.start(id, fadeMs);
    this.fadeOthers(id, fadeMs);
  }

  stop(fadeMs = 900) {
    this.currentId = null;
    this.pending = null;
    [...this.tracks.values()].forEach((t) => this.fadeTo(t, 0, fadeMs, true));
  }

  /** Menu tạm dừng: hạ −12 dB chứ không tắt. */
  duck(on: boolean) {
    this.duckGain = on ? DUCK_GAIN : 1;
    this.refreshGains();
  }

  /** Gọi từ `audio/sfx.ts` chứ không từ scene, vì scene không biết khi nào giọng tắt. */
  voiceDuck(on: boolean) {
    const g = on ? VOICE_DUCK_GAIN : 1;
    if (g === this.voiceDuckGain) return;
    this.voiceDuckGain = g;
    this.refreshGains();
  }

  /** Im hẳn trong `seconds` rồi tự quay lại. */
  hush(seconds: number) {
    this.hushLeft = Math.max(this.hushLeft, seconds);
    this.refreshGains();
  }

  get playing() {
    return this.hushLeft <= 0 && this.currentId !== null && this.volume > 0;
  }

  get nowPlaying(): Cue | null {
    return this.currentId ? CUES[this.currentId] : null;
  }

  private start(id: CueId, fadeMs: number) {
    if (!this.gestured) { this.pending = { id, fadeMs }; return; }
    let t = this.tracks.get(id);
    if (!t) {
      const voice = this.take();
      voice.el.src = CUES[id].file;
      t = { id, voice, level: 0, target: 0, rate: 0, stopAtZero: false };
      this.tracks.set(id, t);
      this.applyGain(t);
    }
    this.resume(t.voice);
    t.stopAtZero = false;
    this.fadeTo(t, 1, fadeMs, false);
  }

  /** Hết phần tử rảnh thì lấy bài nhỏ tiếng nhất đang tắt dần. */
  private take(): Voice {
    this.voices();
    const v = this.free.pop();
    if (v) return v;
    let quiet: Track | null = null;
    this.tracks.forEach((t) => { if (t.id !== this.currentId && (!quiet || t.level < quiet.level)) quiet = t; });
    this.retire(quiet!);
    return this.free.pop()!;
  }

  private fadeOthers(keep: CueId, fadeMs: number) {
    this.tracks.forEach((t, id) => {
      if (id !== keep) this.fadeTo(t, 0, fadeMs, true);
    });
  }

  private fadeTo(t: Track, target: number, ms: number, stopAtZero: boolean) {
    t.target = target;
    t.stopAtZero = stopAtZero;
    t.rate = ms <= 0 ? Infinity : 1 / (ms / 1000);
    if (ms <= 0) {
      t.level = target;
      this.applyGain(t);
      if (target === 0 && stopAtZero) this.retire(t);
    }
  }

  private applyGain(t: Track) {
    const hushed = this.hushLeft > 0 ? 0 : 1;
    const v = t.level * this.volume * BUS_CEILING * this.duckGain * this.voiceDuckGain * hushed;
    if (t.voice.gain) t.voice.gain.gain.value = v;
    else t.voice.el.volume = Math.min(1, v);
  }

  private refreshGains() {
    this.tracks.forEach((t) => this.applyGain(t));
  }

  private step(_time: number, deltaMs: number) {
    const dt = Math.min(deltaMs, 100) / 1000;

    if (this.hushLeft > 0) {
      this.hushLeft -= dt;
      if (this.hushLeft <= 0) { this.hushLeft = 0; this.refreshGains(); }
    }

    [...this.tracks.values()].forEach((t) => {
      if (t.level === t.target) return;
      const stepSize = t.rate === Infinity ? 1 : t.rate * dt;
      t.level = t.level < t.target
        ? Math.min(t.target, t.level + stepSize)
        : Math.max(t.target, t.level - stepSize);
      this.applyGain(t);

      if (t.level === 0 && t.stopAtZero) this.retire(t);
    });
  }

  /** Bỏ `src` để trình duyệt nhả bộ đệm của bài. */
  private retire(t: Track) {
    const el = t.voice.el;
    el.pause();
    el.removeAttribute("src");
    el.load();
    if (t.voice.gain) t.voice.gain.gain.value = 0;
    this.tracks.delete(t.id);
    this.free.push(t.voice);
  }
}

export const music = new MusicDirector();
