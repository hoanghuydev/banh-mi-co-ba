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

export const MUSIC_STEPS = [0, 25, 55, 80, 100] as const;

const BUS_CEILING = 0.5;

const DUCK_GAIN = 0.25;

const VOICE_DUCK_GAIN = 0.2;

type Track = {
  sound: Phaser.Sound.BaseSound & { setVolume(v: number): unknown };
  level: number;
  target: number;
  rate: number;
  stopAtZero: boolean;
};

class MusicDirector {
  private game: Phaser.Game | null = null;
  private tracks = new Map<CueId, Track>();
  private currentId: CueId | null = null;

  private volume = 0.55;
  private duckGain = 1;
  /** Tách khỏi `duckGain` vì pause và giọng NPC chồng được lên nhau. */
  private voiceDuckGain = 1;
  private hushLeft = 0;

  private loading = new Set<CueId>();

  attach(game: Phaser.Game) {
    if (this.game) return;
    this.game = game;
    this.applySettings(loadSettings());
    game.events.on(Phaser.Core.Events.PRE_STEP, this.step, this);
  }

  applySettings(s: Settings) {
    this.volume = Math.max(0, Math.min(100, s.musicVolume)) / 100;
    this.refreshGains();
    if (this.volume === 0) this.stop(0);
  }

  /** Gọi lại với cue đang phát thì không làm gì, nên gọi mỗi frame cũng được. */
  play(scene: Phaser.Scene, id: CueId, fadeMs = 1400) {
    if (this.currentId === id) return;
    if (this.volume === 0) { this.currentId = id; return; }

    const cue = CUES[id];
    if (!scene.cache.audio.exists(cue.key)) {
      this.currentId = id;
      this.load(scene, id, () => { if (this.currentId === id) this.start(scene, id, fadeMs); });
      this.fadeOthers(id, fadeMs);
      return;
    }

    this.currentId = id;
    this.start(scene, id, fadeMs);
    this.fadeOthers(id, fadeMs);
  }

  stop(fadeMs = 900) {
    this.currentId = null;
    this.tracks.forEach((t) => this.fadeTo(t, 0, fadeMs, true));
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

  private load(scene: Phaser.Scene, id: CueId, done: () => void) {
    if (this.loading.has(id)) return;
    this.loading.add(id);

    const cue = CUES[id];
    scene.load.audio(cue.key, cue.file);
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.loading.delete(id);
      // scene có thể đã tắt trong lúc tải; `done` tự kiểm tra lại ý định hiện tại
      if (scene.cache.audio.exists(cue.key)) done();
    });
    scene.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, () => this.loading.delete(id));
    if (!scene.load.isLoading()) scene.load.start();
  }

  private start(scene: Phaser.Scene, id: CueId, fadeMs: number) {
    let t = this.tracks.get(id);
    if (!t) {
      const sound = scene.sound.add(CUES[id].key, { loop: true, volume: 0 }) as Track["sound"];
      t = { sound, level: 0, target: 0, rate: 0, stopAtZero: false };
      this.tracks.set(id, t);
    }
    // Bị chặn autoplay thì Phaser tự xếp hàng và phát sau cú chạm đầu tiên.
    if (!t.sound.isPlaying) t.sound.play();
    t.stopAtZero = false;
    this.fadeTo(t, 1, fadeMs, false);
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
      if (target === 0 && stopAtZero) t.sound.stop();
    }
  }

  private applyGain(t: Track) {
    const hushed = this.hushLeft > 0 ? 0 : 1;
    t.sound.setVolume(t.level * this.volume * BUS_CEILING * this.duckGain * this.voiceDuckGain * hushed);
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

    this.tracks.forEach((t, id) => {
      if (t.level === t.target) return;
      const stepSize = t.rate === Infinity ? 1 : t.rate * dt;
      t.level = t.level < t.target
        ? Math.min(t.target, t.level + stepSize)
        : Math.max(t.target, t.level - stepSize);
      this.applyGain(t);

      if (t.level === 0 && t.stopAtZero) {
        t.sound.stop();
        t.sound.destroy();
        this.tracks.delete(id);
      }
    });
  }
}

export const music = new MusicDirector();
