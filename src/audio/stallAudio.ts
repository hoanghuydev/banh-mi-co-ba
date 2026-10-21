import Phaser from "phaser";
import { bus, type EventKey, type EventMap } from "../core/eventbus";
import type { TimeBand } from "../core/clock";
import type { Weather } from "../core/types";
import type { Ingredient } from "../sim/order";
import { music } from "./music";
import { sfx, type SfxId } from "./sfx";

// Nền âm khai báo trạng thái mong muốn mỗi frame, không bật/tắt tại chỗ xảy ra chuyện.

const PRELOAD: readonly SfxId[] = [
  "sfx_dao_rach", "sfx_vo_gion", "sfx_than_no", "sfx_quet_pate", "sfx_ruoi_sot",
  "sfx_rac_tieu", "sfx_kep_gap", "sfx_dat_thot", "sfx_goi_giay", "sfx_bich_nilon",
  "sfx_mo_tu_mat", "sfx_cua_lo", "sfx_rot_tra_da", "sfx_dat_ly", "sfx_lau_khan",
  "sfx_do_roi_dat", "sfx_tien_le", "sfx_xu", "sfx_ngan_keo", "sfx_thung_rac",
  "sfx_buoc_chu_quan",
  "sfx_xe_may_qua", "sfx_coi_xe", "sfx_cho_sua", "sfx_chim_se", "sfx_ga_gay",
  "sfx_buoc_chan", "sfx_keo_ghe",
  // Chỉ nạp hai `vox_*` đang thật sự phát.
  "vox_hum", "vox_blip",
  "ui_click", "ui_chon_nguyen_lieu", "ui_dat_thanh_cong", "ui_khong_hop_le",
  "ui_click_go", "ui_mo_menu", "ui_dong_menu", "ui_chot_don", "ui_autosave",
  "a11y_ping_glimpsed",
];

const BAND_BED: Record<TimeBand, SfxId> = {
  PRE_OPEN: "amb_hem_sang", PEAK: "amb_hem_sang", MID: "amb_hem_trua", LULL: "amb_hem_chieu",
};

const RAINY: ReadonlySet<Weather> = new Set<Weather>(["MUA_RAO", "MUA_DAM"]);

/** NPC chỉ lên tiếng ở hai chỗ: lúc gọi món và lúc bỏ đi vì giận. */
const ANGRY_PITCH = 0.78;

const ANGRY_EXITS: ReadonlySet<string> = new Set([
  "IMPATIENT",
  "REFUSED",
  "SOILED_FOOD",
]);

/** Phải khớp `FLY_DIRT_MIN` ở `StallScene`. */
const FLY_DIRT_MIN = 0.35;

const AMBIENT_EVERY: Record<TimeBand, number> = {
  PRE_OPEN: 14, PEAK: 22, MID: 26, LULL: 18,
};

export type StallAudioDeps = {
  scene: Phaser.Scene;
  panOf: (npcId: string) => number;
  rand: () => number;
};

export class StallAudio {
  private off: (() => void)[] = [];
  private spoke = new Set<string>();
  private now = 0;
  private nextAmbient = 6;
  private stepPhase = 0;
  private bed: SfxId | null = null;

  constructor(private d: StallAudioDeps) {
    sfx.stopLoops(0);
    this.wire();
  }

  static preload(scene: Phaser.Scene) {
    sfx.preload(scene, PRELOAD);
  }

  destroy() {
    this.off.forEach((f) => f());
    this.off = [];
    sfx.stopLoops(500);
  }

  private listen<K extends EventKey>(k: K, fn: (p: EventMap[K]) => void) {
    this.off.push(bus.on(k, fn));
  }

  private wire() {
    const { scene } = this.d;

    this.listen("npc:arrived", (p) => this.steps(this.d.panOf(p.npcId)));

    // Bám `order:placed` chứ không `dialog:spoken`, không thì giờ cao điểm ồn như chợ.
    this.listen("order:placed", (p) => {
      if (this.spoke.has(p.npcId)) return;
      this.spoke.add(p.npcId);
      sfx.talk(scene, p.npcId, 26, this.d.panOf(p.npcId));
    });

    this.listen("npc:left", (p) => {
      this.spoke.delete(p.npcId);
      const pan = this.d.panOf(p.npcId);
      if (ANGRY_EXITS.has(p.reason)) {
        sfx.voice(scene, "vox_hum", p.npcId, pan, ANGRY_PITCH);
        this.steps(pan, 0.8, 320);
      } else {
        this.steps(pan, 0.7);
      }
    });

    // Không sting, không giọng: người chơi phải nhìn mặt người chứ không nghe tiếng ting.
    this.listen("perception:stateChanged", (p) => {
      if (p.to === "GLIMPSED" || p.to === "NOTICED") sfx.perceptionPing(scene, this.d.panOf(p.npcId));
    });

    this.listen("save:written", () => sfx.play(scene, "ui_autosave"));
    this.listen("ui:pauseToggled", (p) => {
      sfx.play(scene, p.paused ? "ui_mo_menu" : "ui_dong_menu");
      music.duck(p.paused);
    });
  }

  /** `dt` đã trừ pause, nên lúc tạm dừng không đẻ thêm tiếng rời mà nền vẫn kêu. */
  tick(dt: number, s: { band: TimeBand; weather: Weather; dirt: number; ovenHot: boolean; washing: boolean; burning: boolean; moving: boolean; running: boolean }) {
    this.now += dt;
    const { scene } = this.d;

    const want = BAND_BED[s.band];
    if (want !== this.bed) {
      if (this.bed) sfx.loop(scene, this.bed, false, {}, 2200);
      sfx.loop(scene, want, true, {}, 2600);
      this.bed = want;
    } else {
      sfx.loop(scene, want, true, {}, 2600);
    }
    sfx.loop(scene, "amb_crowd", true, {}, 3000);

    const rain = RAINY.has(s.weather);
    sfx.loop(scene, "amb_mua_mai_ton", rain, {}, 3000);
    sfx.loop(scene, "amb_mua_nen", rain, {}, 3000);

    sfx.loop(scene, "sfx_lo_bed", s.ovenHot, {}, 1600);
    sfx.loop(scene, "sfx_khet", s.burning, {}, 400);
    sfx.loop(scene, "sfx_rua_tay", s.washing, {}, 180);

    // Độ to ruồi bò theo ba nấc số ruồi của `drawDirt`.
    const fly = s.dirt > FLY_DIRT_MIN;
    sfx.loop(scene, "sfx_ruoi", fly, {}, 1500);
    if (fly) sfx.loopVolume("sfx_ruoi", Math.min(1, (s.dirt - FLY_DIRT_MIN) / 0.35));

    if (s.moving) {
      this.stepPhase += dt * (s.running ? 3.1 : 2.1);
      if (this.stepPhase >= 1) {
        this.stepPhase -= 1;
        sfx.play(scene, "sfx_buoc_chu_quan");
      }
    } else {
      this.stepPhase = 0.92;
    }

    this.nextAmbient -= dt;
    if (this.nextAmbient <= 0) {
      this.nextAmbient = AMBIENT_EVERY[s.band] * (0.6 + this.d.rand() * 0.9);
      this.oneOffStreetSound(s.band, rain);
    }
  }

  private oneOffStreetSound(band: TimeBand, rain: boolean) {
    if (rain) return;
    const { scene } = this.d;
    const r = this.d.rand();
    const side = this.d.rand() < 0.5 ? -0.75 : 0.75;

    if (band === "PRE_OPEN" && r < 0.22) { sfx.play(scene, "sfx_ga_gay", { pan: side }); return; }
    if (r < 0.42) sfx.play(scene, "sfx_xe_may_qua", { pan: side });
    else if (r < 0.56) sfx.play(scene, "sfx_coi_xe", { pan: side * 0.8 });
    else if (r < 0.72) sfx.play(scene, "sfx_chim_se", { pan: side * 0.6 });
    else if (r < 0.84) sfx.play(scene, "sfx_cho_sua", { pan: side });
    else sfx.play(scene, "sfx_keo_ghe", { pan: side * 0.5 });
  }

  private steps(pan: number, vol = 1, gap = 300) {
    const { scene } = this.d;
    for (let i = 0; i < 3; i++) {
      sfx.play(scene, "sfx_buoc_chan", { pan, volume: vol, delay: i * (gap + this.d.rand() * 90) });
    }
  }

  // Tiếng thao tác tay cố ý không đi qua bus: phải nổ đúng frame bấm phím.
  private one(id: SfxId, o: Parameters<typeof sfx.play>[2] = {}) {
    sfx.play(this.d.scene, id, o);
  }

  layLoaf() { this.one("sfx_mo_tu_mat"); }
  ovenDoor() { this.one("sfx_cua_lo"); }
  loafOut() { this.one("sfx_cua_lo"); this.one("sfx_vo_gion", { delay: 160 }); }
  knife() { this.one("sfx_dao_rach"); }
  putDown() { this.one("sfx_dat_thot"); }
  wrap() { this.one("sfx_goi_giay"); }
  tea() { this.one("sfx_rot_tra_da"); }
  cup() { this.one("sfx_dat_ly"); }
  /** Nhiều nhát trải đúng bằng lượt lau, để nửa sau không im trong khi thanh vẫn chạy. */
  wipeFor(seconds: number) {
    const nhat = Math.max(1, Math.round(seconds / 1.3));
    for (let i = 0; i < nhat; i++) {
      this.one("sfx_lau_khan", { delay: i * (seconds * 1000) / nhat, volume: i === 0 ? 1 : 0.85 });
    }
  }
  bin() { this.one("sfx_thung_rac"); }
  drop() { this.one("sfx_do_roi_dat"); }

  money() {
    this.one("sfx_tien_le");
    this.one(this.d.rand() < 0.45 ? "sfx_xu" : "sfx_ngan_keo", { delay: 220 });
  }

  place(ing: Ingredient) {
    if (ing === "pate") this.one("sfx_quet_pate");
    else if (ing === "tuongot") this.one("sfx_ruoi_sot");
    else if (ing === "ot") this.one("sfx_rac_tieu");
    else this.one("sfx_kep_gap");
    this.one("ui_chon_nguyen_lieu", { volume: 0.8 });
  }

  uiClick() { this.one("ui_click"); }
  uiOk() { this.one("ui_dat_thanh_cong"); }
  uiBad() { this.one("ui_khong_hop_le"); }
  uiConfirm() { this.one("ui_chot_don"); }
}
