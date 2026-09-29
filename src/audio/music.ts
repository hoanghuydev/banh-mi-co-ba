import Phaser from "phaser";
import { loadSettings, type Settings } from "../core/save";

/**
 * NHẠC NỀN — kênh "Nhạc" của CANON §15.4, luật ở P5-03 §6.
 *
 * Đây là ĐIỂM NỐI DUY NHẤT giữa game và phần nhạc. Scene chỉ nói "giờ này nên
 * nghe cue nào", không scene nào tự gọi `this.sound.play` — nhờ vậy khi thay
 * nhạc thật (P5-03 §6.3: 10 cue sáng tác gốc) chỉ phải sửa bảng `CUES` bên dưới.
 *
 * Ba luật của P5-03 §6 được cài thẳng vào đây, không phải "ghi nhớ rồi tự giữ":
 *  · §6.4  Nhạc phản ứng với BỐI CẢNH (giờ trong ngày), KHÔNG với điểm số.
 *          Không có API nào ở đây nhận vào "người chơi đang làm tốt hay dở".
 *  · §6.5  Nhạc phải IM ĐI ở khoảnh khắc quan trọng -> `hush()`.
 *  · §6.5#8 Mở menu tạm dừng thì HẠ chứ không TẮT -> `duck()`.
 *
 * Nhạc sống ngoài scene (dùng `game.sound` toàn cục) nên đi từ sảnh vào quán
 * không bị đứt tiếng. Vì thế fade cũng KHÔNG chạy bằng tween của scene —
 * scene tắt giữa chừng là tween chết và tiếng kẹt lại ở nửa âm lượng.
 * Fade chạy bằng `game.events` (PRE_STEP), sống đúng bằng tuổi của game.
 */

export type CueId = "menu" | "to_mo" | "cao_diem" | "lang" | "toi";

export type Cue = {
  key: string;
  file: string;
  /** Ghi công — luật bản quyền của bản nhạc này, xem `public/audio/PROVENANCE.csv`. */
  title: string;
  author: string;
  license: string;
};

/**
 * Nhạc TẠM: CC BY 4.0 của Kevin MacLeod, chọn theo đúng tiêu chí P5-03 §6.2
 * (mộc, ≤3 bè, 57–82 BPM, không lo-fi beat, không pad synth vô danh tính).
 * P5-03 §6.5.1 đòi nhạc SÁNG TÁC GỐC mua đứt — nên bảng này là chỗ tạm giữ chỗ,
 * còn nguyên cấu trúc cue để thay file là xong.
 */
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

/** Các nấc âm lượng ở Cài đặt. 55 là mặc định của bus `nhac` (P5-03 §2.1). */
export const MUSIC_STEPS = [0, 25, 55, 80, 100] as const;

/** Trần của bus `nhac`: −6 dB (P5-03 §2.1) — nhạc không bao giờ to bằng giọng người. */
const BUS_CEILING = 0.5;

/** Mức hạ khi mở menu tạm dừng: −12 dB (P5-03 §6.5 #8). */
const DUCK_GAIN = 0.25;

type Track = {
  sound: Phaser.Sound.BaseSound & { setVolume(v: number): unknown };
  /** Âm lượng tương đối 0..1 của riêng track này, trước khi nhân với bus. */
  level: number;
  target: number;
  /** Đơn vị level trên mỗi giây. 0 = không fade. */
  rate: number;
  /** Fade về 0 xong thì dừng hẳn và bỏ. */
  stopAtZero: boolean;
};

class MusicDirector {
  private game: Phaser.Game | null = null;
  private tracks = new Map<CueId, Track>();
  private currentId: CueId | null = null;

  /** 0..1 từ Cài đặt. */
  private volume = 0.55;
  /** Hệ số ducking khi mở menu (P5-03 §6.5 #8). */
  private duckGain = 1;
  /** Còn bao nhiêu giây phải im hẳn (P5-03 §6.5). */
  private hushLeft = 0;

  private loading = new Set<CueId>();

  // ────────────────────────────────────────────────────────────────── vòng đời

  /** Gọi một lần ở `main.ts`. Từ đây nhạc sống độc lập với mọi scene. */
  attach(game: Phaser.Game) {
    if (this.game) return;
    this.game = game;
    this.applySettings(loadSettings());
    game.events.on(Phaser.Core.Events.PRE_STEP, this.step, this);
  }

  applySettings(s: Settings) {
    this.volume = Math.max(0, Math.min(100, s.musicVolume)) / 100;
    this.refreshGains();
    // Kéo về 0 thì thả file luôn, không giữ một track câm chạy nền tốn CPU.
    if (this.volume === 0) this.stop(0);
  }

  // ───────────────────────────────────────────────────────────────── điều khiển

  /**
   * Chuyển sang cue `id`, crossfade `fadeMs`.
   * Gọi lại với cue đang phát là không làm gì — scene cứ gọi mỗi frame cũng được.
   */
  play(scene: Phaser.Scene, id: CueId, fadeMs = 1400) {
    if (this.currentId === id) return;
    if (this.volume === 0) { this.currentId = id; return; }

    const cue = CUES[id];
    if (!scene.cache.audio.exists(cue.key)) {
      this.currentId = id;                        // nhớ ý định trước, phát khi tải xong
      this.load(scene, id, () => { if (this.currentId === id) this.start(scene, id, fadeMs); });
      this.fadeOthers(id, fadeMs);
      return;
    }

    this.currentId = id;
    this.start(scene, id, fadeMs);
    this.fadeOthers(id, fadeMs);
  }

  /** Dừng mọi thứ. `fadeMs = 0` là cắt ngay. */
  stop(fadeMs = 900) {
    this.currentId = null;
    this.tracks.forEach((t) => this.fadeTo(t, 0, fadeMs, true));
  }

  /**
   * Menu tạm dừng: hạ −12 dB chứ KHÔNG tắt.
   * P5-03 §6.5 #8: "pause phải thấy an toàn, không thấy trống rỗng".
   */
  duck(on: boolean) {
    this.duckGain = on ? DUCK_GAIN : 1;
    this.refreshGains();
  }

  /**
   * Im hẳn trong `seconds` rồi tự quay lại.
   * Dùng cho các khoảnh khắc ở P5-03 §6.5: khách mở hàng, sự kiện tiêu cực
   * chạm CONFIRMED, `REMEMBERED_USUAL`, khách bỏ đi không nói gì.
   */
  hush(seconds: number) {
    this.hushLeft = Math.max(this.hushLeft, seconds);
    this.refreshGains();
  }

  /** Đang có nhạc không — dùng để đo tỉ lệ 52–65% của P5-03 §6.5. */
  get playing() {
    return this.hushLeft <= 0 && this.currentId !== null && this.volume > 0;
  }

  get nowPlaying(): Cue | null {
    return this.currentId ? CUES[this.currentId] : null;
  }

  // ─────────────────────────────────────────────────────────────────── bên trong

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
    // Không có file cũng không được làm sập game — chỉ là không có nhạc.
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
    // Phaser xếp hàng `play()` khi trình duyệt chưa cho phát tiếng
    // (chính sách autoplay) rồi tự phát lại sau cú chạm/gõ phím đầu tiên.
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

  /** Âm lượng thật = level của track × cài đặt × trần bus × ducking × im lặng. */
  private applyGain(t: Track) {
    const hushed = this.hushLeft > 0 ? 0 : 1;
    t.sound.setVolume(t.level * this.volume * BUS_CEILING * this.duckGain * hushed);
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

/** Một dàn nhạc cho cả game. */
export const music = new MusicDirector();
