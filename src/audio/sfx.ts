import Phaser from "phaser";
import catalog from "./catalog.json";
import { Rng, fnv1a, ShuffleBag } from "../core/rng";
import { loadSettings, type Settings } from "../core/save";
import { music } from "./music";

/**
 * TIẾNG ĐỘNG — bốn bus còn lại của CANON §15.4. Bus thứ năm ("Nhạc") sống riêng ở `music.ts`:
 * nhạc là 5 cue dài tải lười và crossfade, tiếng động là ~170 mẩu ngắn bắn theo sự kiện.
 *
 * Điểm nối duy nhất: scene nói "vừa có chuyện này", KHÔNG scene nào tự `this.sound.play`.
 *
 * Bốn luật cài thẳng vào đây, không phải "nhớ rồi tự giữ": mỗi bus một công tắc RIÊNG + trần gain
 * riêng · giọng người nói thì mọi bus khác HẠ XUỐNG · pan theo chỗ người ta đứng · "âm mô tả thế
 * giới thì giữ, âm chấm điểm người chơi thì bỏ" (`NEGATIVE_CUES` là DANH SÁCH ĐÓNG).
 */

// ─────────────────────────────────────────────────────────────────── danh mục

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

// ───────────────────────────────────────────────────────────────── trần gain

/**
 * Trần của từng bus, P5-03 §2.1. Đây là mức TỐI ĐA khi người chơi kéo công tắc
 * lên 100 — không phải mặc định. `giongNPC` ở 0 dB là có chủ ý: giọng người là
 * thứ KHÔNG BAO GIỜ bị thứ khác đè, mọi bus khác đều có trần thấp hơn nó.
 */
const CEILING: Record<BusId, number> = {
  duongPho: 0.708,   // −3 dB
  giongNPC: 1.0,     //  0 dB
  thaoTac: 0.794,    // −2 dB
  amBao: 0.501,      // −6 dB
};

const VOICE_DUCK: Record<BusId, number> = {
  duongPho: 0.447,   // −7 dB
  giongNPC: 1.0,     //  không tự hạ mình
  thaoTac: 0.708,    // −3 dB
  amBao: 1.0,        //  0 dB — âm báo phải nghe thấy kể cả khi có người nói
};
const CROWD_DUCK = 0.282;

/**
 * Âm "chấm điểm người chơi" — công tắc `disableNegativeAudioCues` tắt được; giá trị là thứ phát
 * THAY (null = im hẳn).
 *
 * ⚠️ DANH SÁCH NÀY ĐÓNG. Thêm vào đây một âm mô tả THẾ GIỚI (bánh rớt, bánh khét, ruồi bay) là
 * lấy mất của người nhìn không rõ cách duy nhất biết chuyện vừa xảy ra — hợp đồng trợ năng, không
 * phải tuỳ chọn thẩm mỹ.
 */
const NEGATIVE_CUES: Partial<Record<SfxId, SfxId | null>> = {
  ui_khong_hop_le: "ui_click_go",     // thay bằng click gỗ, CÙNG ĐỘ TO
  ui_ngay_am_tien: null,                        // im hẳn
};

/**
 * Giới hạn riêng cho còi xe — P5-03 §4.2 B: "tối đa 1 lần / 25 s". Còi là âm
 * gây khó chịu nhất trong bộ, và một hẻm Sài Gòn thật thì bấm còi nhiều hơn
 * thế rất nhiều — nhưng "thật" không phải mục tiêu, "chịu nổi 40 ngày" mới là.
 */
const COOLDOWN_SEC: Partial<Record<SfxId, number>> = {
  sfx_coi_xe: 25,
  sfx_ga_gay: 20,
  sfx_cho_sua: 9,
  sfx_chim_se: 6,
} as Partial<Record<SfxId, number>>;

/** Rung cao độ / độ to mỗi lần phát, theo bus. UI = 0: âm báo phải GIỐNG HỆT nhau. */
const JITTER: Record<BusId, { rate: number; db: number }> = {
  duongPho: { rate: 0.06, db: 1.5 },
  giongNPC: { rate: 0.04, db: 1.0 },
  thaoTac: { rate: 0.05, db: 1.5 },
  amBao: { rate: 0, db: 0 },           // §5.4: timbre giống hệt = thông tin, không phán xét
};

/**
 * Mức của chuỗi âm tiết "chibi" so với bus giọng. Nó KHÔNG phải lời thoại — nội dung thật nằm ở
 * chữ trên bong bóng — nên để ngang mức VO thì nó thành thứ to nhất trong cả bản phối. Chỉ cần đủ
 * to để nói "có người vừa mở miệng".
 */
const TALK_GAIN = 0.62;

const MAX_CONCURRENT = 14;

// ─────────────────────────────────────────────────────────────────── giọng NPC

/**
 * Cao độ cố định cho từng NPC. Bộ asset tạm chỉ có MỘT bộ tiếng phi lời dùng chung, nên chỗ phân
 * biệt 12 NPC là cao độ — bà Bảy không được "hm" y hệt anh Dũng, nếu không thì tiếng phi lời mất
 * luôn chức năng "ai đang nhìn mình".
 *
 * Số lấy tay, không sinh từ hash: hash cho ra vài cặp sát nhau nghe như một người.
 */
const VOICE_PITCH: Record<string, number> = {
  BA_BAY: 1.12, BA_SAU: 1.08,                     // hai bà lớn tuổi, giọng cao mà khô
  CHU_TU: 0.82, ONG_HAI: 0.78, CHU_KIET: 0.86,    // ba ông, trầm
  THAY_PHUC: 0.92,
  ANH_DUNG: 0.95, ANH_BAO: 1.0,
  CHI_LAN: 1.18, CHI_HANH: 1.14, CO_MAI: 1.22,
  BE_SU: 1.45,                                     // bé Sứ — cao hẳn, nghe ra ngay là trẻ con
  CO_BA: 1.05,
};
const DEFAULT_PITCH = 1.0;

export function voicePitch(npcId: string): number {
  return VOICE_PITCH[npcId] ?? DEFAULT_PITCH;
}

// ────────────────────────────────────────────────────────────────── bên trong

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
  /** Dòng ngẫu nhiên RIÊNG cho phần trình bày — không đụng 6 stream của P0-02 §2.3.
   *  Chọn biến thể nào không được phép làm lệch chuỗi số của lịch khách hay tin đồn. */
  private rng = new Rng(fnv1a("sfx|presentation"));

  private vol: Record<BusId, number> = { ...SILENT_BUS };
  private crowdVol = 0.6;
  private mono = false;
  private noNegative = false;
  private pingOn = false;
  private voiceLeft = 0;
  private lastPlayed = new Map<string, number>();
  /**
   * Mẩu một phát đang kêu. GIỮ CẢ OBJECT chứ không đếm bằng một con số.
   *
   * ⚠️ Đếm bằng `live++` / `live--` thì rò: trong vài chục giây chơi bình thường con số bò lên
   * tới trần 14 và từ đó MỌI tiếng một phát đều im, không báo lỗi gì cả.
   *
   * Không sửa bằng cách tìm cho ra chỗ rò — chỗ rò sau sẽ mọc ở một đường thoát khác (scene tắt
   * giữa chừng, `stopAll`, trình duyệt chặn phát). Sửa bằng cách bỏ hẳn con số: giữ danh sách, và
   * TỰ DỌN những cái đã tắt ngay trước khi đếm.
   */
  private live = new Set<Phaser.Sound.BaseSound>();
  private now = 0;
  private warned = new Set<string>();

  // ───────────────────────────────────────────────────────────────── vòng đời

  attach(game: Phaser.Game) {
    if (this.game) return;
    this.game = game;
    this.applySettings(loadSettings());
    game.events.on(Phaser.Core.Events.PRE_STEP, this.step, this);
  }

  applySettings(s: Settings) {
    const pct = (v: number) => Math.max(0, Math.min(100, v)) / 100;
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

  // ─────────────────────────────────────────────────────────────────── nạp

  /**
   * Xếp hàng tải `ids` vào loader của scene. Gọi trong `preload()`.
   *
   * Mẩu một phát PHẢI nạp trước: nạp lười thì tiếng dao của cú bấm đầu tiên rơi vào khoảng không,
   * mà cú đầu tiên là cú duy nhất người chơi còn đang HỌC rằng bấm E thì có tiếng. Ambience thì
   * nạp lười được vì nó fade vào trong 2 giây.
   */
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

  // ─────────────────────────────────────────────────────────────── phát một phát

  /**
   * Bắn một mẩu. Trả về `true` nếu thật sự có tiếng — chỗ gọi hầu như không cần,
   * nhưng test thì cần, và `dev/overlay` dùng để đếm.
   */
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

    // Ghi vào `live` ĐÚNG LÚC PHÁT, không phải lúc tạo: mẩu hẹn giờ chưa kêu thì
    // chưa chiếm một suất, mà `countLive` lại dọn đúng những cái chưa kêu.
    const start = () => { this.live.add(snd); snd.play(); };
    if (o.delay && o.delay > 0) {
      // Scene tắt trước khi tới hẹn thì `delayedCall` không bao giờ chạy — dọn luôn,
      // không thì cái sound object nằm lại mãi trên bàn mixer toàn cục.
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

  /**
   * Giọng NPC phi lời. Khác `play` ở đúng một chỗ: nó BẬT DUCKING (§2.3) —
   * nhạc, tiếng đường phố và tiếng thao tác lùi lại để nghe rõ người.
   */
  voice(scene: Phaser.Scene, id: SfxId, npcId: string, pan = 0, mul = 1): boolean {
    // `mul` nhân vào cao độ CỦA NGƯỜI ĐÓ, không thay thế nó: bà Bảy bực vẫn phải
    // ra giọng bà Bảy, chỉ trầm hơn. Hạ rate cũng kéo dài file — "hm?" thành "hmmm".
    const ok = this.play(scene, id, { pan, rate: voicePitch(npcId) * mul });
    if (ok) this.duckForVoice(1.0);
    return ok;
  }

  /**
   * Thoại kiểu chibi: 2–5 âm tiết ngắn từ giọng người thật, cao độ theo NPC.
   *
   * ⚠️ Đây là lớp VÁ, không phải thiết kế — `BubblePool` hiện nguyên câu chứ không gõ từng chữ
   * nên chưa có chỗ bám cho VO thật. Nối VO thật vào thì GỠ HÀM NÀY, đừng giữ cả hai.
   *
   * Gọi ở ĐÚNG MỘT CHỖ: lúc khách gọi món, một lần mỗi lượt ghé. Gọi theo mọi dòng thoại thì bốn
   * người cùng đứng là bốn chuỗi âm tiết chồng lên nhau.
   */
  talk(scene: Phaser.Scene, npcId: string, textLength: number, pan = 0) {
    if (!hasSfx("vox_blip")) return;
    const pitch = voicePitch(npcId);

    /*
     * Số âm tiết theo độ dài câu, nhưng CÓ XÊ DỊCH — hai câu dài bằng nhau mà lúc
     * nào cũng ra đúng ba tiếng thì tai bắt được cái nhịp đó trước khi bắt được
     * nội dung, và đó chính là cảm giác "lặp".
     */
    const n = Math.max(2, Math.min(5, Math.round(textLength / 15 + this.rng.next() * 1.2)));

    /*
     * Đường cao độ, không phải cao độ phẳng: `drift` là hướng đi của cả câu (câu hỏi vống lên,
     * câu trả lời xuôi xuống), `wobble` là xê dịch từng tiếng.
     *
     * Dải ±18% rộng gấp đôi bản đầu — đổi file mà không đổi cao độ thì tai vẫn nhận ra cùng một
     * giọng cùng một nốt, vì thứ tai bắt được là CHẤT GIỌNG chứ không phải file nào.
     */
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
      // Khoảng cách KHÔNG ĐỀU. Bản đầu dùng `i * (70 + ngẫu nhiên)`, tức là một lưới
      // đều tăm tắp — nghe ra máy gõ chứ không ra người nói.
      at += 85 + this.rng.next() * 85;
    }
    this.duckForVoice(at / 1000 + 0.2);
  }

  // ──────────────────────────────────────────────────────────────── chạy vòng

  /**
   * Bật / tắt một vòng lặp (ambience, lò than, vòi nước, ruồi).
   *
   * Gọi lại với trạng thái đang có là KHÔNG LÀM GÌ — scene cứ gọi mỗi frame cũng
   * được, đó là cách dùng mong muốn: "giờ này đáng lẽ phải nghe cái này".
   */
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
      // Ambience nạp LƯỜI: nó fade vào trong hơn một giây nên chậm vài trăm ms
      // không ai nghe ra, mà nạp sẵn hết thì vào quán phải kéo về thêm ~4 MB.
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

  // ────────────────────────────────────────────────────────────── trợ năng

  /**
   * Tick gỗ trung tính cho người thị lực kém. Mặc định TẮT.
   *
   * ⚠️ CÙNG MỘT ÂM cho chuyện tốt và chuyện xấu — đó là điều kiện tồn tại của nó: nó nói "có
   * người vừa để ý tới bạn", không nói "bạn vừa làm sai". Pan theo chỗ người ta đứng nên nó còn
   * cho biết LÀ AI.
   */
  perceptionPing(scene: Phaser.Scene, pan: number) {
    if (!this.pingOn) return;
    this.play(scene, "a11y_ping_glimpsed", { pan });
  }

  // ─────────────────────────────────────────────────────────────── bên trong

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
    this.voiceLeft = Math.max(this.voiceLeft, seconds + 0.45);   // + release 450 ms của §2.3
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
