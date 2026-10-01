#!/usr/bin/env python3
"""
NGUỒN ÂM THANH — bảng duy nhất nói file nào lấy ở đâu và gọt thế nào.

Mọi `id` ở đây đều lấy tên đúng theo bảng SFX của `P5-03 §4.2`, để khi thay bằng
bản THU THẬT ngoài hẻm (điều §4.1 bắt buộc với nhóm âm đặc trưng) thì chỉ đổi
nguồn trong file này, không đụng một dòng code game nào.

── Vì sao Freesound, và vì sao chỉ CC0 ─────────────────────────────────────────
`P5-03 §4.1` cho dùng thư viện "có giấy phép thương mại rõ ràng". Bảng này lấy
**duy nhất giấy phép CC0 1.0** — hiến tặng vào phạm vi công cộng: dùng thương mại
được, sửa được, KHÔNG phải ghi công, không điều khoản share-alike.

Cố ý loại CC BY: 1 bản nhạc CC BY thì ghi công được (nhạc hiện tại đang vậy), chứ
~150 file SFX của ~90 tác giả thì bảng ghi công dài hơn phần credits thật, và chỉ
cần sót MỘT dòng là vi phạm. CC0 không đẻ ra nghĩa vụ nào về sau.
(Vẫn ghi đầy đủ tác giả + link vào `PROVENANCE.csv` — đó là phép lịch sự và là
đường lần ngược khi cần kiểm chứng, không phải nghĩa vụ pháp lý.)

── Thứ CỐ Ý KHÔNG có trong bảng này ────────────────────────────────────────────
· **Tiếng rao** (`amb_rao_*`) — §3 gọi nó là "tài sản ba vai" và §4.1 bắt THU
  THẬT. Không có bản CC0 nào là tiếng rao Việt Nam, mà lấy tiếng rao nước khác
  dán vào thì hỏng đúng cái thứ duy nhất không ai copy được. Để trống.
· **`amb_radio_hangxom`** (cải lương nhà bên) — §4.2 cảnh báo thẳng: bản thu cải
  lương nào cũng có chủ. Có mấy bản "nhạc Việt" trên Freesound gắn CC0, nhưng
  người upload chỉ sở hữu BẢN GHI, không sở hữu phần TRÌNH DIỄN. Để trống,
  chờ đặt hàng bản gốc.
· **Bark / VO có lời** — §2 đòi lồng tiếng người thật giọng miền Nam. Không có
  nguồn nào thay được. Bảng này chỉ có tiếng PHI LỜI (`vox_*`).

── Đọc một dòng nguồn ──────────────────────────────────────────────────────────
    "fs": 123456     id Freesound (tra ở https://freesound.org/s/123456/)
    "start"/"dur"    cắt đoạn nào ra khỏi bản gốc, tính bằng giây
    "gain"           bù dB riêng cho file này, sau khi đã chuẩn hoá chung

Và một bộ (`SFX`) gồm:
    bus              1 trong 4 bus của CANON §15.4 (bus "nhac" ở `music.ts`)
    desc             để đọc `PROVENANCE.csv` ra còn hiểu
    proc             luật gọt chung cho cả bộ, xem `audioproc.process`
"""

# Mức RMS mục tiêu theo nhóm, suy từ bảng LUFS ở P5-03 §2.2.
# Chuẩn hoá SẴN TỪ LÚC DỰNG, không chuẩn hoá lúc chạy: game chỉ việc nhân âm lượng bus.
RMS_AMB = -26.0        # §2.2 ambience bed −28..−24 LUFS
RMS_FOLEY = -19.0      # §2.2 foley thao tác −22..−16 LUFS
RMS_UI = -24.0         # §2.2 UI −24 LUFS
RMS_VOX = -18.0        # §2.2 VO −18 LUFS

ONESHOT = {"trim": True, "fade_in": 3, "fade_out": 25, "rms": RMS_FOLEY, "mono": True, "bitrate": 96}
UI = {"trim": True, "fade_in": 2, "fade_out": 15, "rms": RMS_UI, "mono": True, "bitrate": 80}
VOX = {"trim": True, "fade_in": 5, "fade_out": 40, "rms": RMS_VOX, "mono": True, "bitrate": 96}
# Ambience giữ STEREO: §2.4 pan khách và xe theo bề ngang hẻm, bóp mono là mất chiều đó.
AMB = {"rms": RMS_AMB, "mono": False, "bitrate": 96, "loop_xfade": 2.5, "fade_in": 0, "fade_out": 0}


def amb(seconds: float, **kw):
    """Ambience chạy vòng: cắt `seconds` giây rồi nối đuôi vào đầu cho liền mạch."""
    return {**AMB, **kw, "_seg": seconds}


SFX: dict[str, dict] = {

    # ══ A. THAO TÁC LÀM BÁNH — bus `thaoTac` (P5-03 §4.2 A) ═══════════════════

    "sfx_dao_rach": {
        "bus": "thaoTac", "desc": "dao rach doc o banh",
        "proc": {**ONESHOT, "max_dur": 0.9},
        # Một bộ 4 nhát dao của cùng một người thu, cùng micro, cùng căn phòng.
        # Gom biến thể từ 4 tác giả khác nhau thì mỗi lần bấm nghe như đổi sang
        # một cái bếp khác — đó là lỗi nặng hơn hẳn việc nghe lặp.
        "sources": [{"fs": 573300}, {"fs": 573299}, {"fs": 573298}, {"fs": 573297}],
    },
    "sfx_vo_gion": {
        "bus": "thaoTac", "desc": "vo banh nut / bop nghe gion",
        "proc": {**ONESHOT, "max_dur": 1.2},
        "sources": [{"fs": 406336}, {"fs": 528962}, {"fs": 816237}, {"fs": 718593}],
    },
    "sfx_than_no": {
        "bus": "thaoTac", "desc": "than no lach tach",
        "proc": {**ONESHOT, "max_dur": 0.9, "rms": -23.0},
        "sources": [
            {"fs": 537459, "start": 0.2, "dur": 0.8},
            {"fs": 537459, "start": 1.1, "dur": 0.8},
            {"fs": 188038, "start": 0.4, "dur": 0.8},
            {"fs": 165870, "start": 0.1, "dur": 0.7},
        ],
    },
    "sfx_lo_bed": {
        "bus": "thaoTac", "desc": "lo than chay — nen chay vong",
        "proc": amb(22.0, rms=-30.0),       # nền lò: phải CHÌM, chỉ nghe ra khi đứng cạnh
        "sources": [{"fs": 660298, "start": 6.0}, {"fs": 454745, "start": 2.0}],
    },
    "sfx_khet": {
        "bus": "thaoTac", "desc": "banh chay — khet no lach tach (ganh vai 'co mui' cua BURNT_OR_COLD)",
        "proc": amb(6.0, rms=-22.0, loop_xfade=1.0),
        "sources": [{"fs": 188038, "start": 1.0}],
    },
    "sfx_quet_pate": {
        "bus": "thaoTac", "desc": "quet pate len ruot banh",
        "proc": {**ONESHOT, "max_dur": 1.0},
        "sources": [{"fs": 607527}, {"fs": 607526}, {"fs": 607528}],
    },
    "sfx_ruoi_sot": {
        "bus": "thaoTac", "desc": "ruoi nuoc sot",
        "proc": {**ONESHOT, "max_dur": 1.1},
        "sources": [{"fs": 445973}, {"fs": 732892, "start": 0.3, "dur": 1.2}, {"fs": 190458, "start": 0.2, "dur": 1.2}],
    },
    "sfx_rac_tieu": {
        "bus": "thaoTac", "desc": "rac muoi tieu",
        "proc": {**ONESHOT, "max_dur": 0.9, "rms": -22.0},
        "sources": [{"fs": 803174}, {"fs": 868464}],
    },
    "sfx_kep_gap": {
        "bus": "thaoTac", "desc": "kep gap kim loai",
        "proc": {**ONESHOT, "max_dur": 0.5},
        "sources": [
            {"fs": 489530, "start": 0.0, "dur": 0.5},
            {"fs": 489530, "start": 0.7, "dur": 0.5},
            {"fs": 344396, "start": 0.0, "dur": 0.4},
            {"fs": 344396, "start": 0.45, "dur": 0.4},
        ],
    },
    "sfx_dat_thot": {
        "bus": "thaoTac", "desc": "dat banh / nguyen lieu xuong thot",
        "proc": {**ONESHOT, "max_dur": 0.45},
        "sources": [{"fs": 684856}, {"fs": 862542}, {"fs": 207631}],
    },
    "sfx_goi_giay": {
        "bus": "thaoTac", "desc": "goi giay bao quanh o banh",
        "proc": {**ONESHOT, "max_dur": 1.6},
        "sources": [{"fs": 67040}, {"fs": 151913, "start": 0.2, "dur": 1.6}, {"fs": 332111, "start": 0.1, "dur": 1.6},
                    {"fs": 153099, "start": 0.2, "dur": 1.5}],
    },
    "sfx_bich_nilon": {
        "bus": "thaoTac", "desc": "mo / sot soat bich nilon",
        "proc": {**ONESHOT, "max_dur": 1.4},
        "sources": [{"fs": 762402}, {"fs": 172068}],
    },
    "sfx_mo_tu_mat": {
        "bus": "thaoTac", "desc": "mo / dong tu mat (ke nguyen lieu)",
        "proc": {**ONESHOT, "max_dur": 1.3},
        "sources": [{"fs": 121210}, {"fs": 442999}, {"fs": 426366}],
    },
    "sfx_cua_lo": {
        "bus": "thaoTac", "desc": "cua lo mo / dong",
        "proc": {**ONESHOT, "max_dur": 1.1},
        "sources": [{"fs": 238891}, {"fs": 724095}],
    },
    "sfx_rot_tra_da": {
        "bus": "thaoTac", "desc": "rot tra da, da va thanh ly — am cua CARED_FOR_THEM",
        # §4.2: "phải DỄ CHỊU NHẤT trong game". Để dài hơn mọi foley khác và cắt
        # đúng đoạn nước đã chảy đều, không lấy cú đổ ộc lúc bắt đầu.
        "proc": {**ONESHOT, "max_dur": 2.0, "fade_out": 60, "rms": -20.0},
        "sources": [
            {"fs": 108429, "start": 0.6, "dur": 2.2},
            {"fs": 120527, "start": 0.5, "dur": 2.2},
            {"fs": 406251, "start": 0.2, "dur": 2.0},
            {"fs": 837691},
        ],
    },
    "sfx_dat_ly": {
        "bus": "thaoTac", "desc": "dat ly xuong mat ban",
        "proc": {**ONESHOT, "max_dur": 0.6},
        "sources": [{"fs": 235498}, {"fs": 454222}, {"fs": 184285}],
    },
    "sfx_lau_khan": {
        "bus": "thaoTac", "desc": "lau khan len mat xe / thot",
        "proc": {**ONESHOT, "max_dur": 1.4},
        "sources": [{"fs": 496471}, {"fs": 210858}, {"fs": 207628}, {"fs": 588631}],
    },
    "sfx_rua_tay": {
        # KHÔNG có trong bảng §4.2 — bảng đó viết trước khi bồn rửa tay thành một
        # TRẠM có thật trong quầy (`world/stations.ts` id `sink`, giữ phím 1,5 s).
        # Một trạm giữ phím mà im thì người chơi không biết nó đang chạy hay kẹt.
        "bus": "thaoTac", "desc": "rua tay o bon — nen chay vong trong luc giu phim",
        "proc": amb(4.0, rms=-23.0, loop_xfade=0.8, mono=True, bitrate=80),
        "sources": [{"fs": 235618, "start": 1.0}, {"fs": 429400, "start": 0.8}],
    },
    "sfx_do_roi_dat": {
        "bus": "thaoTac", "desc": "o banh / nguyen lieu rot xuong dat — SU KIEN, khong bi tat boi cong tac am bao tieu cuc",
        "proc": {**ONESHOT, "max_dur": 0.8, "rms": -17.0},
        "sources": [{"fs": 570977}, {"fs": 146977}, {"fs": 654415}, {"fs": 651287}],
    },
    "sfx_tien_le": {
        "bus": "thaoTac", "desc": "dua / dem tien giay",
        "proc": {**ONESHOT, "max_dur": 1.3},
        "sources": [{"fs": 63524}, {"fs": 179102}, {"fs": 179105}, {"fs": 444436}],
    },
    "sfx_xu": {
        "bus": "thaoTac", "desc": "tien xu le",
        "proc": {**ONESHOT, "max_dur": 1.0},
        "sources": [{"fs": 336571}, {"fs": 847349}, {"fs": 699523}],
    },
    "sfx_ngan_keo": {
        "bus": "thaoTac", "desc": "mo khay tien",
        "proc": {**ONESHOT, "max_dur": 1.6},
        "sources": [{"fs": 378269}, {"fs": 202531, "start": 0.0, "dur": 1.6}],
    },
    "sfx_thung_rac": {
        "bus": "thaoTac", "desc": "bo do vao thung rac",
        "proc": {**ONESHOT, "max_dur": 1.2},
        "sources": [{"fs": 427390}, {"fs": 208769}],
    },
    "sfx_lat_so": {
        "bus": "thaoTac", "desc": "lat trang so no / so tay",
        "proc": {**ONESHOT, "max_dur": 1.2, "rms": -21.0},
        "sources": [{"fs": 397550}, {"fs": 397552}, {"fs": 726518}, {"fs": 705384}],
    },
    "sfx_viet_but": {
        "bus": "thaoTac", "desc": "viet but bi len giay — canh toi, so tay",
        "proc": {**ONESHOT, "max_dur": 1.3, "rms": -21.0},
        "sources": [{"fs": 562153}, {"fs": 632478}, {"fs": 611719}],
    },
    "sfx_buoc_co_ba": {
        # Bước chân CỦA NGƯỜI CHƠI. §2.1 xếp "tiếng thao tác của chính người chơi"
        # vào `thaoTac`, KHÔNG vào `duongPho` — và §2.4 bắt pan 0,0: đó là chân bạn.
        "bus": "thaoTac", "desc": "buoc chan co Ba tren nen xi mang trong quay",
        "proc": {**ONESHOT, "max_dur": 0.5, "rms": -25.0},
        "sources": [{"fs": 166507}, {"fs": 690006}, {"fs": 475860}, {"fs": 562192, "start": 0.0, "dur": 0.4},
                    {"fs": 562192, "start": 0.45, "dur": 0.4}, {"fs": 778502}],
    },

    # ══ B. HẺM VÀ ĐƯỜNG PHỐ — bus `duongPho` (P5-03 §4.2 B) ═══════════════════
    #
    # Năm nền ambience dưới đây là FIELD RECORDING THẬT Ở VIỆT NAM, không phải
    # "ambience thành phố" chung chung. Đó là chỗ duy nhất trong cả bộ asset tạm
    # này đạt đúng tinh thần §4.1 ("thu thật, đúng hẻm"): tiếng xe máy Sài Gòn
    # không giống tiếng xe máy ở đâu khác, và tai người Việt nghe ra ngay.

    "amb_hem_sang": {
        "bus": "duongPho", "desc": "ambience hem buoi sang — giao thong HCMC that + chim",
        "proc": amb(40.0),
        "sources": [{"fs": 666730, "start": 8.0}],           # HCMC_traffic, thu tại TP.HCM
    },
    "amb_hem_trua": {
        "bus": "duongPho", "desc": "ambience nang dung — ngoai o HCMC, thua xe hon",
        "proc": amb(36.0, rms=-28.0),
        "sources": [{"fs": 835521, "start": 5.0}],           # Traffic_Suburbs_HoChiMinhCity
    },
    "amb_hem_chieu": {
        "bus": "duongPho", "desc": "ambience chieu — duong pho HCMC, dong hon",
        "proc": amb(40.0),
        "sources": [{"fs": 769713, "start": 3.0}],           # Ho Chi Minh street
    },
    "amb_crowd": {
        # Sub-mix riêng của CANON §15 công tắc 5. GIỌNG VIỆT thật — đây là lớp mà
        # người ADHD / tự kỷ hay bị quá tải, nên nó phải tắt được RIÊNG, và cũng
        # vì thế nó phải là một file RIÊNG chứ không trộn sẵn vào nền hẻm.
        "bus": "duongPho", "desc": "tieng nguoi lao xao — giong Viet that (crowdSubMix)",
        "proc": amb(26.0, rms=-27.0),
        "sources": [{"fs": 402907, "start": 1.5}],           # phụ nữ Việt nói chuyện
    },
    "amb_cho": {
        "bus": "duongPho", "desc": "ambience cho sang — cho Ben Thanh, TP.HCM",
        "proc": amb(20.0, loop_xfade=2.0),
        "sources": [{"fs": 447777, "start": 1.0}],           # Bến Thành
    },
    "amb_toi_nha": {
        "bus": "duongPho", "desc": "ambience toi trong nha — dem Viet Nam + quat",
        "proc": amb(34.0, rms=-29.0),
        "sources": [{"fs": 806575, "start": 10.0}],          # Night Ambience, Cát Tiên
    },
    "amb_mua_mai_ton": {
        "bus": "duongPho", "desc": "mua tren mai ton",
        "proc": amb(30.0, rms=-25.0),
        "sources": [{"fs": 239939, "start": 8.0}],
    },
    "amb_mua_nen": {
        "bus": "duongPho", "desc": "mua nen nhe",
        "proc": amb(30.0, rms=-28.0),
        "sources": [{"fs": 242889, "start": 4.0}],
    },
    "sfx_xe_may_qua": {
        "bus": "duongPho", "desc": "xe may chay qua",
        # Cái đầu là xe máy thu Ở VIỆT NAM — tiếng máy 4 thì nhỏ, rè, khác hẳn
        # motorcycle phương Tây. Để nó đứng đầu danh sách là có chủ ý.
        "proc": {**ONESHOT, "max_dur": 3.5, "mono": False, "rms": -23.0, "fade_in": 60, "fade_out": 200},
        "sources": [
            {"fs": 402960, "start": 2.0, "dur": 3.5},
            {"fs": 432804, "start": 0.5, "dur": 3.5},
            {"fs": 48180},
            {"fs": 397313},
        ],
    },
    "sfx_coi_xe": {
        # §4.2 đặt giới hạn riêng cho còi xe (tối đa 1 lần / 25 s, trần −16 dB) vì
        # nó là âm khó chịu nhất bộ. Giới hạn cài ở `sfx.ts`; ở đây chỉ kéo sẵn
        # mức xuống thật thấp để dù có lọt cũng không chói.
        "bus": "duongPho", "desc": "coi xe (co gioi han rieng o sfx.ts)",
        "proc": {**ONESHOT, "max_dur": 1.1, "rms": -27.0},
        "sources": [{"fs": 170243}, {"fs": 571348}, {"fs": 547667}],
    },
    "sfx_cho_sua": {
        "bus": "duongPho", "desc": "cho sua xa",
        "proc": {**ONESHOT, "max_dur": 1.6, "rms": -27.0},
        "sources": [{"fs": 277058}, {"fs": 110134}, {"fs": 236967}, {"fs": 485962, "start": 0.2, "dur": 1.6}],
    },
    "sfx_chim_se": {
        "bus": "duongPho", "desc": "chim se",
        "proc": {**ONESHOT, "max_dur": 2.0, "rms": -28.0},
        "sources": [{"fs": 451766}, {"fs": 695297}],
    },
    "sfx_ga_gay": {
        "bus": "duongPho", "desc": "ga gay xa — chi TO_MO",
        "proc": {**ONESHOT, "max_dur": 2.6, "rms": -28.0},
        "sources": [{"fs": 435508}, {"fs": 347040}, {"fs": 268018}],
    },
    "sfx_ruoi": {
        # Chỉ số STALL_CLEANLINESS dạng diegetic (T3: không có con số nào hiện ra).
        "bus": "duongPho", "desc": "ruoi bay — chi so do ban cua quay, dang nghe duoc",
        "proc": amb(8.0, rms=-30.0, loop_xfade=1.2, mono=True, bitrate=80),
        "sources": [{"fs": 717567, "start": 1.0}, {"fs": 656042, "start": 0.5}],
    },
    "sfx_buoc_chan": {
        "bus": "duongPho", "desc": "buoc chan khach den / di",
        "proc": {**ONESHOT, "max_dur": 0.5, "rms": -26.0},
        "sources": [{"fs": 778502}, {"fs": 565489}, {"fs": 475860}, {"fs": 690006}],
    },
    "sfx_keo_ghe": {
        "bus": "duongPho", "desc": "keo ghe nhua tren nen xi mang",
        "proc": {**ONESHOT, "max_dur": 1.6, "rms": -24.0},
        "sources": [{"fs": 871017}, {"fs": 485145, "start": 0.2, "dur": 1.6}],
    },
    "sfx_quat_may": {
        "bus": "duongPho", "desc": "quat may cu (chay vong)",
        "proc": amb(18.0, rms=-31.0, loop_xfade=1.5, mono=True, bitrate=64),
        "sources": [{"fs": 553745, "start": 3.0}],
    },
    "sfx_cua_cuon": {
        "bus": "duongPho", "desc": "cua cuon keo len / ha xuong — am mo dau ngay",
        "proc": {**ONESHOT, "max_dur": 3.0, "rms": -22.0},
        "sources": [{"fs": 350641}],
    },
    "sfx_choi_quet": {
        "bus": "duongPho", "desc": "choi quet san",
        "proc": {**ONESHOT, "max_dur": 2.0, "rms": -26.0},
        "sources": [{"fs": 442338}, {"fs": 121213, "start": 0.3, "dur": 2.0}, {"fs": 593466}],
    },

    # ══ C. ÂM BÁO GIAO DIỆN — bus `amBao` (P5-03 §4.2 C) ══════════════════════

    "ui_click": {
        "bus": "amBao", "desc": "click nut",
        "proc": {**UI, "max_dur": 0.25},
        "sources": [{"fs": 677861}, {"fs": 467951}, {"fs": 253168}],
    },
    "ui_chon_nguyen_lieu": {
        "bus": "amBao", "desc": "chon nguyen lieu (tap-to-place)",
        "proc": {**UI, "max_dur": 0.3},
        "sources": [{"fs": 736912}, {"fs": 546974}],
    },
    "ui_dat_thanh_cong": {
        "bus": "amBao", "desc": "dat hop le",
        "proc": {**UI, "max_dur": 0.4},
        "sources": [{"fs": 405547}, {"fs": 245242}],
    },
    "ui_khong_hop_le": {
        # Công tắc `disableNegativeAudioCues` thay cái này bằng `ui_click_go`,
        # **cùng độ to** (P5-03 §4.2 C). Nên hai bộ phải chuẩn hoá cùng mức RMS —
        # chúng đã cùng dùng preset `UI`, đừng tách ra.
        "bus": "amBao", "desc": "thao tac khong hop le (TAT duoc)",
        "proc": {**UI, "max_dur": 0.35},
        "sources": [{"fs": 869284}, {"fs": 388047}],
    },
    "ui_click_go": {
        "bus": "amBao", "desc": "click go trung tinh — ban thay cho ui_khong_hop_le",
        "proc": {**UI, "max_dur": 0.3},
        "sources": [{"fs": 822568}, {"fs": 861328}],
    },
    "ui_mo_menu": {
        "bus": "amBao", "desc": "mo menu",
        "proc": {**UI, "max_dur": 0.35},
        "sources": [{"fs": 141121}],
    },
    "ui_dong_menu": {
        "bus": "amBao", "desc": "dong menu",
        "proc": {**UI, "max_dur": 0.35},
        "sources": [{"fs": 141257}],
    },
    "ui_chot_don": {
        "bus": "amBao", "desc": "chot don (sau buoc xac nhan)",
        "proc": {**UI, "max_dur": 0.7},
        "sources": [{"fs": 542044}],
    },
    "ui_autosave": {
        "bus": "amBao", "desc": "autosave — rat nhe",
        "proc": {**UI, "max_dur": 0.3, "rms": -34.0},         # §4.2 ghi −30 dB so với UI
        "sources": [{"fs": 141259}],
    },
    "ui_qr_beep": {
        "bus": "amBao", "desc": "beep may QR",
        "proc": {**UI, "max_dur": 0.5},
        "sources": [{"fs": 759010}, {"fs": 388046}],
    },
    "ui_chuyen_ngay": {
        "bus": "amBao", "desc": "chuyen sang ngay moi",
        "proc": {**UI, "max_dur": 1.4, "fade_out": 120},
        "sources": [{"fs": 452379}],
    },
    "ui_ngay_am_tien": {
        "bus": "amBao", "desc": "doanh thu ngay am (TAT duoc -> im lang)",
        "proc": {**UI, "max_dur": 0.8},
        "sources": [{"fs": 388047}],
    },
    "ui_mo_so_tay": {
        "bus": "amBao", "desc": "mo so tay",
        "proc": {**UI, "max_dur": 0.6},
        "sources": [{"fs": 726518}],
    },
    "a11y_ping_glimpsed": {
        # §5.4: TIMBRE GIỐNG HỆT NHAU cho sự kiện tốt và xấu — nó là THÔNG TIN,
        # không phải PHÁN XÉT. Vì vậy chỉ MỘT file, không biến thể: biến thể mở
        # đường cho việc lỡ tay làm cái "xấu" nghe tối hơn cái "tốt".
        "bus": "amBao", "desc": "tick go trung tinh cho tro nang (mac dinh TAT)",
        "proc": {**UI, "max_dur": 0.2, "rms": -26.0},
        "sources": [{"fs": 822568}],
    },

    # ══ D. GIỌNG NPC PHI LỜI — bus `giongNPC` (P5-03 §4.2 D) ══════════════════
    #
    # Đây là TIẾNG NGƯỜI THẬT, không phải giọng tổng hợp — đúng lời hứa ở §1
    # ("lồng tiếng người thật, KHÔNG AI voice"). Nhưng là người THU SẴN TRÊN
    # THƯ VIỆN, không phải diễn viên giọng miền Nam, nên nó vẫn là bản TẠM:
    # §4.2 D đòi 4–6 biến thể MỖI NHÓM GIỌNG, ở đây mới có một bộ dùng chung,
    # phân biệt nhau bằng cao độ (xem `VOICE_PITCH` trong `src/audio/sfx.ts`).

    "vox_hm_glimpsed": {
        "bus": "giongNPC", "desc": "tieng 'hm?' rat nhe — tin hieu GLIMPSED",
        "proc": {**VOX, "max_dur": 1.0, "rms": -22.0},
        "sources": [{"fs": 697497}, {"fs": 699008}, {"fs": 170768}, {"fs": 818157, "start": 0.1, "dur": 1.0}],
    },
    "vox_tho_dai": {
        "bus": "giongNPC", "desc": "tho dai",
        "proc": {**VOX, "max_dur": 1.8},
        "sources": [{"fs": 265249}, {"fs": 318088, "start": 0.2, "dur": 1.8}, {"fs": 446651}, {"fs": 687027}],
    },
    "vox_chep_mieng": {
        "bus": "giongNPC", "desc": "chep mieng — rat Viet Nam",
        "proc": {**VOX, "max_dur": 0.5},
        "sources": [{"fs": 672571}, {"fs": 573148}, {"fs": 135515}, {"fs": 262301}],
    },
    "vox_cuoi_nhe": {
        "bus": "giongNPC", "desc": "cuoi nhe",
        "proc": {**VOX, "max_dur": 1.6},
        "sources": [{"fs": 458101}, {"fs": 377742, "start": 0.3, "dur": 1.6}, {"fs": 687262}, {"fs": 344066}],
    },
    "vox_a_ra": {
        "bus": "giongNPC", "desc": "'A…' / 'Ua…' — bark tier-3",
        "proc": {**VOX, "max_dur": 1.1},
        "sources": [{"fs": 801137}, {"fs": 170780}, {"fs": 436108}, {"fs": 88448}],
    },
    "vox_hum": {
        "bus": "giongNPC", "desc": "'Hum.' — luoi an toan bark tier-3",
        "proc": {**VOX, "max_dur": 1.0},
        "sources": [{"fs": 867879}, {"fs": 165011, "start": 0.1, "dur": 1.0}, {"fs": 429923, "start": 0.0, "dur": 1.0}],
    },
    "vox_blip": {
        # KHÔNG có trong §4.2 — đây là lớp vá cho tới khi có VO thật.
        #
        # Vấn đề nó giải: bong bóng thoại hiện ra NGUYÊN CÂU (`ui/stall/BubblePool`),
        # không gõ từng chữ, nên không có chỗ bám cho VO. Thiếu hẳn tiếng người thì
        # luật §6.5 #1 ("nhạc fade về 0 khi NPC nói") nghe như nhạc tự nhiên tắt.
        #
        # Cách làm: cắt NGUYÊN ÂM từ giọng người thật xuống ~140 ms rồi bắn 2–5 cái
        # một chuỗi lúc khách gọi món, cao độ theo NPC. Đây là lối "chibi" của Animal
        # Crossing — gợi ra có người đang nói mà không giả vờ là lời thoại.
        #
        # MƯỜI HAI biến thể, không phải sáu, và cố ý lấy từ MƯỜI HAI NGƯỜI KHÁC NHAU
        # với nguyên âm khác nhau (a / o / u / ư / hm / uh). Bản sáu biến thể đầu lấy
        # gần hết từ mấy file "ah / oh / hm" na ná nhau, nên dù bốc ngẫu nhiên vẫn
        # nghe ra ngay là cùng một tiếng lặp lại — cái tai bắt được không phải là
        # "file nào", mà là "chất giọng nào". Đổi chất giọng mới hết lặp.
        #
        # `trim` TẮT: ở đây đang cắt một cửa sổ nằm GIỮA nguyên âm, mà cắt im lặng
        # thì gọt tiếp vào chính cửa sổ đó — một file đã rơi xuống 0,05 s và nghe ra
        # tiếng "cạch" chứ không còn ra tiếng người.
        "bus": "giongNPC", "desc": "am tiet ngan tu 12 giong nguoi that — thoai kieu chibi, TAM cho toi khi co VO",
        # Nhỏ hơn hẳn mức VO (−18): đây là tiếng GỢI Ý có người đang nói, không phải
        # lời thoại. Để ngang VO thì nó là thứ to nhất trong cả bản phối, mà nội dung
        # thật thì nằm ở chữ trên bong bóng.
        "proc": {**VOX, "trim": False, "max_dur": 0.15, "fade_in": 8, "fade_out": 55, "rms": -26.0},
        "sources": [
            {"fs": 170780, "start": "auto", "dur": 0.17},       # "Oh"            — nam
            {"fs": 88448,  "start": "auto", "dur": 0.17},       # "Ann"           — nữ
            {"fs": 697497, "start": "auto", "dur": 0.17},       # "hmm"
            {"fs": 801137, "start": "auto", "dur": 0.17},       # "Ahhh"          — nhẹ nhõm
            {"fs": 436108, "start": "auto", "dur": 0.17},       # "Oh!"           — nam
            {"fs": 170768, "start": "auto", "dur": 0.17},       # "Hmm?"          — dò hỏi
            {"fs": 87647,  "start": "auto", "dur": 0.17},       # nguyên âm "o"
            {"fs": 87777,  "start": "auto", "dur": 0.17},       # nguyên âm "u"
            {"fs": 516898, "start": "auto", "dur": 0.17},       # "Uhm"           — nữ
            {"fs": 752227, "start": "auto", "dur": 0.17},       # "mhm"           — nữ
            {"fs": 585036, "start": "auto", "dur": 0.17},       # "Uh"
            {"fs": 339838, "start": "auto", "dur": 0.17},       # "mhm"           — trầm
        ],
    },
}
