import Phaser from "phaser";
import { bus, type EventKey, type EventMap } from "../core/eventbus";
import type { TimeBand } from "../core/clock";
import type { Weather } from "../core/types";
import type { Ingredient } from "../sim/order";
import { music } from "./music";
import { sfx, type SfxId } from "./sfx";

/**
 * LỚP ÂM THANH CỦA CẢNH QUÁN — chỗ duy nhất nối sự kiện game vào `audio/sfx.ts`.
 *
 * Tách khỏi `StallScene` vì scene đó đã 2600 dòng và vì hai nhóm hook ở đây khác
 * hẳn nhau về vòng đời:
 *
 *  · **Nghe bus** (khách tới, có người nói, bánh rớt) — gắn một lần ở `create`,
 *    gỡ ở `shutdown`. Không chỗ nào trong scene phải nhớ gọi.
 *  · **Nền chạy vòng** (ambience, lò than, ruồi) — hỏi lại MỖI FRAME "giờ này
 *    đáng lẽ phải nghe cái gì", rồi để `sfx.loop` tự biết là không có gì đổi.
 *    Viết theo kiểu "khai báo trạng thái mong muốn" chứ không phải "bật/tắt tại
 *    chỗ xảy ra chuyện": trời chuyển mưa giữa giờ cao điểm thì có BỐN chỗ trong
 *    scene phải nhớ đổi ambience, và sẽ có một chỗ quên.
 *
 * Còn mấy tiếng gắn thẳng vào thao tác tay (dao, gói giấy, rót trà) thì gọi
 * trực tiếp từ `StallScene` — chúng phải nổ ĐÚNG FRAME người chơi bấm phím, đi
 * vòng qua bus là trễ một frame và là một lớp gián tiếp không mua được gì.
 */

/** Mẩu một phát phải nạp SẴN — nạp lười thì cú bấm đầu tiên rơi vào im lặng. */
const PRELOAD: readonly SfxId[] = [
  // thao tác
  "sfx_dao_rach", "sfx_vo_gion", "sfx_than_no", "sfx_quet_pate", "sfx_ruoi_sot",
  "sfx_rac_tieu", "sfx_kep_gap", "sfx_dat_thot", "sfx_goi_giay", "sfx_bich_nilon",
  "sfx_mo_tu_mat", "sfx_cua_lo", "sfx_rot_tra_da", "sfx_dat_ly", "sfx_lau_khan",
  "sfx_do_roi_dat", "sfx_tien_le", "sfx_xu", "sfx_ngan_keo", "sfx_thung_rac",
  "sfx_lat_so", "sfx_viet_but", "sfx_buoc_co_ba",
  // hẻm — chỉ mấy mẩu ngắn; nền dài để `sfx.loop` nạp lười
  "sfx_xe_may_qua", "sfx_coi_xe", "sfx_cho_sua", "sfx_chim_se", "sfx_ga_gay",
  "sfx_buoc_chan", "sfx_keo_ghe",
  // giọng — CHỈ hai thứ đang thật sự dùng (xem luật "NPC chỉ lên tiếng ở hai chỗ").
  // `vox_hm_glimpsed`, `vox_tho_dai`, `vox_chep_mieng`, `vox_cuoi_nhe`, `vox_a_ra`
  // vẫn nằm trong `tools/audio/sources.py` và trong `public/` vì bảng §4.2 D cần
  // chúng cho bark tier-2/tier-3 — nhưng CHƯA nạp, để khỏi kéo về thứ không phát.
  "vox_hum", "vox_blip",
  // âm báo
  "ui_click", "ui_chon_nguyen_lieu", "ui_dat_thanh_cong", "ui_khong_hop_le",
  "ui_click_go", "ui_mo_menu", "ui_dong_menu", "ui_chot_don", "ui_autosave",
  "ui_mo_so_tay", "a11y_ping_glimpsed",
];

/** Nền hẻm theo giờ — P5-03 §4.2 B. Một band một file, không trộn lớp (bộ tạm chưa có stem). */
const BAND_BED: Record<TimeBand, SfxId> = {
  PRE_OPEN: "amb_hem_sang", PEAK: "amb_hem_sang", MID: "amb_hem_trua", LULL: "amb_hem_chieu",
};

const RAINY: ReadonlySet<Weather> = new Set<Weather>(["MUA_RAO", "MUA_DAM"]);

/**
 * ── NPC CHỈ LÊN TIẾNG Ở ĐÚNG HAI CHỖ ───────────────────────────────────────
 *
 *   1. lúc GỌI MÓN       — một lần, đúng một lần cho cả lượt ghé
 *   2. lúc BỎ ĐI VÌ GIẬN — một tiếng "hmmm" gắt, trầm hơn và dài hơn
 *
 * Bản đầu làm theo đúng chữ của P5-03 §5.2: 55% số lần chạm `GLIMPSED` thì NPC
 * khẽ "hm", cooldown 4 giây mỗi người. Nghe thử thì sai hẳn. §5.2 viết cho một
 * người khách; giờ cao điểm có bốn người cùng đứng, mà `GLIMPSED` thì bật tắt
 * liên tục theo hướng nhìn — thành ra một dàn "hm… hm… hm…" chồng lên nhau,
 * không ai biết tiếng nào của ai và nó nói gì.
 *
 * Mà §5.2 giao cho tiếng đó đúng một việc: cho biết CÓ NGƯỜI ĐANG ĐỂ Ý. Việc đó
 * KHÔNG MẤT — nó chuyển về đúng chỗ dành cho nó: nét mặt (CANON §5, vẫn nguyên)
 * và, cho ai không đọc được nét mặt ở 72px, cái tick gỗ `a11yPerceptionPing`
 * (§5.4) — thứ vốn sinh ra để làm đúng việc này, phát một lần mỗi lần ĐỔI
 * TRẠNG THÁI chứ không rải theo xác suất, và tắt được riêng.
 *
 * Giọng người thì đắt: nghe là phải quay sang nhìn. Tiêu nó cho mọi cái liếc
 * mắt thì tới lúc có người thật sự bỏ đi, không còn gì để nói.
 */
/** Hạ cao độ cho tiếng "hmmm" lúc bực: trầm hơn VÀ dài hơn, cùng một file. */
const ANGRY_PITCH = 0.78;

/** Bỏ đi kiểu này là bỏ đi vì BỰC — có tiếng. Mấy kiểu còn lại thì không. */
const ANGRY_EXITS: ReadonlySet<string> = new Set([
  "IMPATIENT",     // chờ mãi không tới lượt
  "REFUSED",       // bị từ chối phục vụ
  "SOILED_FOOD",   // nhìn thấy ổ bánh rớt đất rồi vẫn được đưa
]);

/**
 * Độ bẩn mà con ruồi đầu tiên xuất hiện. PHẢI khớp `FLY_DIRT_MIN` ở `StallScene`
 * — hai hằng số, một sự thật; chép sai một chỗ là hình và tiếng lệch nhau.
 */
const FLY_DIRT_MIN = 0.35;

/** Tiếng rời rạc ngoài hẻm: giây trung bình giữa hai lần, theo giờ. */
const AMBIENT_EVERY: Record<TimeBand, number> = {
  PRE_OPEN: 14, PEAK: 22, MID: 26, LULL: 18,
};

export type StallAudioDeps = {
  scene: Phaser.Scene;
  /** −1 (trái) .. +1 (phải) cho một NPC đang ở quầy; 0 nếu không thấy ai. */
  panOf: (npcId: string) => number;
  /** 0..1 — số ngẫu nhiên của scene, để không tự đẻ thêm một nguồn rng nữa. */
  rand: () => number;
};

export class StallAudio {
  private off: (() => void)[] = [];
  /** Ai đã lên tiếng trong lượt ghé này — mỗi người đúng MỘT lần, xoá lúc họ về. */
  private spoke = new Set<string>();
  private now = 0;
  private nextAmbient = 6;
  private stepPhase = 0;
  /** Nền hẻm đang bật — giữ lại để tắt đúng cái cũ khi đổi giờ. */
  private bed: SfxId | null = null;

  constructor(private d: StallAudioDeps) {
    sfx.stopLoops(0);
    this.wire();
  }

  /** Gọi trong `preload()` của scene. */
  static preload(scene: Phaser.Scene) {
    sfx.preload(scene, PRELOAD);
  }

  destroy() {
    this.off.forEach((f) => f());
    this.off = [];
    sfx.stopLoops(500);
  }

  // ────────────────────────────────────────────────────────────── nghe bus

  private listen<K extends EventKey>(k: K, fn: (p: EventMap[K]) => void) {
    this.off.push(bus.on(k, fn));
  }

  private wire() {
    const { scene } = this.d;

    // Khách tới: BƯỚC CHÂN thôi, chưa có giọng — họ mới bước tới, chưa nói gì.
    this.listen("npc:arrived", (p) => this.steps(this.d.panOf(p.npcId)));

    /*
     * CHỖ LÊN TIẾNG THỨ NHẤT — gọi món.
     *
     * Một lượt ghé đẻ ra cả chục dòng thoại (bark, trả lời, than phiền). Bám vào
     * `dialog:spoken` thì mỗi dòng một chuỗi âm tiết, và giờ cao điểm thành cái
     * chợ. Bám vào `order:placed` thì đúng một lần, ở đúng khoảnh khắc người chơi
     * đang nhìn vào mặt người đó để nghe họ muốn gì.
     */
    this.listen("order:placed", (p) => {
      if (this.spoke.has(p.npcId)) return;
      this.spoke.add(p.npcId);
      sfx.talk(scene, p.npcId, 26, this.d.panOf(p.npcId));
    });

    /*
     * CHỖ LÊN TIẾNG THỨ HAI — bỏ đi vì bực.
     *
     * Cùng một file "hửm", hạ cao độ xuống 0,78: trầm hơn và DÀI HƠN (hạ rate là
     * kéo dài file), nên nó thành một tiếng "hmmmm" gắt thay vì một tiếng "hm?"
     * dò hỏi. Không thêm file mới — cái phải nghe ra là cùng một người đó, lúc
     * này đang bực.
     *
     * `SILENT_EXIT` cố ý KHÔNG có ở đây: §6.5 #5 nói khách bỏ đi không nói gì thì
     * không có gì cả, chỉ tiếng bước chân xa dần. Cái im lặng đó là một phản ứng.
     */
    this.listen("npc:left", (p) => {
      this.spoke.delete(p.npcId);                       // lượt ghé sau được lên tiếng lại
      const pan = this.d.panOf(p.npcId);
      if (ANGRY_EXITS.has(p.reason)) {
        sfx.voice(scene, "vox_hum", p.npcId, pan, ANGRY_PITCH);
        this.steps(pan, 0.8, 320);                      // bước nhanh hơn: họ đang đi thẳng
      } else {
        this.steps(pan, 0.7);
      }
    });

    /*
     * Tầng nhận thấy — P5-03 §5: KHÔNG CÓ STING, và từ bản này thì cũng KHÔNG CÓ
     * GIỌNG. Lý do dài ở `ANGRY_EXITS` phía trên.
     *
     * Còn lại đúng cái tick gỗ của §5.4 — mặc định TẮT, cùng một âm cho chuyện
     * tốt và chuyện xấu, pan theo chỗ người đó đứng nên vẫn cho biết LÀ AI.
     * Một "ting!" phi diegetic thì không: người chơi sẽ học cách nghe tiếng ting
     * thay vì nhìn mặt người, và thế là hỏng cả T3 lẫn T5.
     */
    this.listen("perception:stateChanged", (p) => {
      if (p.to === "GLIMPSED" || p.to === "NOTICED") sfx.perceptionPing(scene, this.d.panOf(p.npcId));
    });

    // Bánh rớt: KHÔNG tắt được bằng công tắc âm báo tiêu cực (§5.5) — với người
    // nhìn không rõ, đây là cách duy nhất biết mình vừa làm rớt.
    this.listen("craft:dropped", () => sfx.play(scene, "sfx_do_roi_dat"));

    this.listen("save:written", () => sfx.play(scene, "ui_autosave"));
    this.listen("ui:pauseToggled", (p) => {
      sfx.play(scene, p.paused ? "ui_mo_menu" : "ui_dong_menu");
      music.duck(p.paused);
    });
  }

  // ───────────────────────────────────────────────────────── nền chạy vòng

  /**
   * Gọi mỗi frame. `dt` là giây ĐÃ TRỪ pause — nên lúc tạm dừng thì hẻm không
   * tự đẻ thêm tiếng xe, mà nền vẫn kêu (pause phải thấy an toàn, §6.5 #8).
   */
  tick(dt: number, s: { band: TimeBand; weather: Weather; dirt: number; ovenHot: boolean; washing: boolean; burning: boolean; moving: boolean; running: boolean }) {
    this.now += dt;
    const { scene } = this.d;

    // ── nền hẻm theo giờ ────────────────────────────────────────────────────
    const want = BAND_BED[s.band];
    if (want !== this.bed) {
      if (this.bed) sfx.loop(scene, this.bed, false, {}, 2200);
      sfx.loop(scene, want, true, {}, 2600);
      this.bed = want;
    } else {
      sfx.loop(scene, want, true, {}, 2600);
    }
    sfx.loop(scene, "amb_crowd", true, {}, 3000);

    // ── mưa ─────────────────────────────────────────────────────────────────
    const rain = RAINY.has(s.weather);
    sfx.loop(scene, "amb_mua_mai_ton", rain, {}, 3000);
    sfx.loop(scene, "amb_mua_nen", rain, {}, 3000);

    // ── lò than ─────────────────────────────────────────────────────────────
    sfx.loop(scene, "sfx_lo_bed", s.ovenHot, {}, 1600);
    sfx.loop(scene, "sfx_khet", s.burning, {}, 400);
    // Vòi nước chỉ kêu trong lúc thật sự đang rửa — fade ngắn để tắt gọn theo tay.
    sfx.loop(scene, "sfx_rua_tay", s.washing, {}, 180);

    /*
     * Ruồi — P5-03 §4.2 B: chỉ số `STALL_CLEANLINESS` dạng NGHE ĐƯỢC. Không có
     * con số nào hiện ra (T3); càng bẩn thì càng nhiều con và càng to.
     *
     * Ngưỡng phải khớp ĐÚNG `FLY_DIRT_MIN` của `StallScene.drawDirt` (0,35), chỗ
     * con ruồi đầu tiên được vẽ. Lệch hai ngưỡng thì có một quãng nghe thấy ruồi
     * mà không thấy con nào — và người chơi sẽ đi tìm một thứ không tồn tại.
     * Độ to bò lên theo đúng ba nấc số ruồi của `drawDirt` (1 / 3 / 5 con).
     */
    const fly = s.dirt > FLY_DIRT_MIN;
    sfx.loop(scene, "sfx_ruoi", fly, {}, 1500);
    if (fly) sfx.loopVolume("sfx_ruoi", Math.min(1, (s.dirt - FLY_DIRT_MIN) / 0.35));

    // ── bước chân cô Ba ─────────────────────────────────────────────────────
    if (s.moving) {
      // Nhịp theo tốc độ đi, không theo đồng hồ: chạy thì bước mau hơn.
      this.stepPhase += dt * (s.running ? 3.1 : 2.1);
      if (this.stepPhase >= 1) {
        this.stepPhase -= 1;
        sfx.play(scene, "sfx_buoc_co_ba");     // pan 0: đó là chân bạn (§2.4)
      }
    } else {
      // Dừng lại là bước kế tiếp nổ NGAY khi đi tiếp, không phải sau nửa nhịp thừa.
      this.stepPhase = 0.92;
    }

    // ── tiếng rời rạc ngoài hẻm ─────────────────────────────────────────────
    this.nextAmbient -= dt;
    if (this.nextAmbient <= 0) {
      this.nextAmbient = AMBIENT_EVERY[s.band] * (0.6 + this.d.rand() * 0.9);
      this.oneOffStreetSound(s.band, rain);
    }
  }

  /**
   * Một tiếng lẻ ngoài hẻm. Trời mưa thì BỎ HẲN — §3.1: "Mưa: không có tiếng rao.
   * Im lặng mưa — chi tiết đúng và đắt." Cùng lý do đó, mưa cũng không có chim.
   */
  private oneOffStreetSound(band: TimeBand, rain: boolean) {
    if (rain) return;
    const { scene } = this.d;
    const r = this.d.rand();
    // Pan chạy từ bên này sang bên kia cho xe máy — §2.4. Mẩu ngắn nên pan tĩnh,
    // lấy một bên ngẫu nhiên; emitter chạy path là việc của bản thu thật sau này.
    const side = this.d.rand() < 0.5 ? -0.75 : 0.75;

    if (band === "PRE_OPEN" && r < 0.22) { sfx.play(scene, "sfx_ga_gay", { pan: side }); return; }
    if (r < 0.42) sfx.play(scene, "sfx_xe_may_qua", { pan: side });
    else if (r < 0.56) sfx.play(scene, "sfx_coi_xe", { pan: side * 0.8 });
    else if (r < 0.72) sfx.play(scene, "sfx_chim_se", { pan: side * 0.6 });
    else if (r < 0.84) sfx.play(scene, "sfx_cho_sua", { pan: side });
    else sfx.play(scene, "sfx_keo_ghe", { pan: side * 0.5 });
  }

  /** Ba bước chân của một người đi tới / đi khỏi quầy. `gap` = mili-giây mỗi bước. */
  private steps(pan: number, vol = 1, gap = 300) {
    const { scene } = this.d;
    for (let i = 0; i < 3; i++) {
      sfx.play(scene, "sfx_buoc_chan", { pan, volume: vol, delay: i * (gap + this.d.rand() * 90) });
    }
  }

  // ───────────────────────────────────── tiếng gắn thẳng vào thao tác tay
  //
  // Scene gọi mấy hàm này ngay trong hàm xử lý phím. Chúng cố ý KHÔNG đi qua bus:
  // phải nổ đúng frame bấm phím thì não mới nối tiếng với hành động (xem
  // `audioproc.trim_silence` — cùng một lý do, ở khâu khác).

  private one(id: SfxId, o: Parameters<typeof sfx.play>[2] = {}) {
    sfx.play(this.d.scene, id, o);
  }

  layLoaf() { this.one("sfx_mo_tu_mat"); }
  ovenDoor() { this.one("sfx_cua_lo"); }
  /** Lấy ổ nóng ra lò: tiếng cửa lò + vỏ bánh nứt. */
  loafOut() { this.one("sfx_cua_lo"); this.one("sfx_vo_gion", { delay: 160 }); }
  knife() { this.one("sfx_dao_rach"); }
  putDown() { this.one("sfx_dat_thot"); }
  wrap() { this.one("sfx_goi_giay"); }
  tea() { this.one("sfx_rot_tra_da"); }
  cup() { this.one("sfx_dat_ly"); }
  /**
   * Lau thớt — NHIỀU nhát, trải đúng bằng lượt lau.
   *
   * Một nhát khăn dài 1,4 giây cho một lượt lau 2,5–5 giây (`wipeSeconds`, co giãn
   * theo độ bẩn) thì nửa sau của lượt lau im hẳn, trong khi thanh tiến trình vẫn
   * chạy và bụi vẫn bốc — nghe như tay đã dừng mà máy vẫn bắt chờ. Cùng một lỗi
   * với tiếng rót trà nổ sau khi rót xong, chỉ ở đầu kia của quãng thời gian.
   */
  wipeFor(seconds: number) {
    const nhat = Math.max(1, Math.round(seconds / 1.3));
    for (let i = 0; i < nhat; i++) {
      this.one("sfx_lau_khan", { delay: i * (seconds * 1000) / nhat, volume: i === 0 ? 1 : 0.85 });
    }
  }
  bin() { this.one("sfx_thung_rac"); }
  drop() { this.one("sfx_do_roi_dat"); }
  notebook() { this.one("ui_mo_so_tay"); }
  writePen() { this.one("sfx_viet_but"); }

  /** Ghi sổ nợ — hai nét bút rải đều trong lượt ghi, cùng lý do với `wipeFor`. */
  writeFor(seconds: number) {
    this.one("sfx_lat_so");
    const net = Math.max(1, Math.round(seconds / 1.1));
    for (let i = 0; i < net; i++) {
      this.one("sfx_viet_but", { delay: 180 + i * (seconds * 900) / net, volume: 0.9 });
    }
  }
  pageTurn() { this.one("sfx_lat_so"); }

  /** Nhận tiền: tiền giấy sột soạt rồi khay tiền. Dùng mỗi khách → nhiều biến thể nhất. */
  money() {
    this.one("sfx_tien_le");
    this.one(this.d.rand() < 0.45 ? "sfx_xu" : "sfx_ngan_keo", { delay: 220 });
  }

  /**
   * Bỏ một phần nhân lên ổ — tiếng theo LOẠI nguyên liệu, không phải một tiếng
   * "đặt đồ" dùng chung. Quết pate, rưới sốt và rắc tiêu là ba động tác khác hẳn
   * nhau, mà tay người chơi làm chúng cả ngàn lần trong một mùa.
   */
  place(ing: Ingredient) {
    if (ing === "pate") this.one("sfx_quet_pate");          // quết — ẩm, nhớp, gần
    else if (ing === "tuongot") this.one("sfx_ruoi_sot");   // rưới
    else if (ing === "ot") this.one("sfx_rac_tieu");        // rắc
    else this.one("sfx_kep_gap");                            // gắp — nhân và rau
    this.one("ui_chon_nguyen_lieu", { volume: 0.8 });
  }

  /** Âm báo giao diện — gom vào đây để scene không phải biết tên id. */
  uiClick() { this.one("ui_click"); }
  uiOk() { this.one("ui_dat_thanh_cong"); }
  uiBad() { this.one("ui_khong_hop_le"); }
  uiConfirm() { this.one("ui_chot_don"); }
}
