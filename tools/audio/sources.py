#!/usr/bin/env python3
"""Nguồn SFX: chỉ Freesound CC0; `fs` = id Freesound, `start`/`dur` tính bằng giây, `gain` bù dB sau chuẩn hoá."""

# RMS mục tiêu (dB) theo nhóm, chuẩn hoá sẵn lúc dựng để game chỉ nhân âm lượng bus.
RMS_AMB = -26.0
RMS_FOLEY = -19.0
RMS_UI = -24.0
RMS_VOX = -18.0

ONESHOT = {"trim": True, "fade_in": 3, "fade_out": 25, "rms": RMS_FOLEY, "mono": True, "bitrate": 96}
UI = {"trim": True, "fade_in": 2, "fade_out": 15, "rms": RMS_UI, "mono": True, "bitrate": 80}
VOX = {"trim": True, "fade_in": 5, "fade_out": 40, "rms": RMS_VOX, "mono": True, "bitrate": 96}
# Ambience giữ stereo để còn pan theo bề ngang hẻm.
AMB = {"rms": RMS_AMB, "mono": False, "bitrate": 96, "loop_xfade": 2.5, "fade_in": 0, "fade_out": 0}


def amb(seconds: float, **kw):
    """Ambience chạy vòng: cắt `seconds` giây rồi nối đuôi vào đầu cho liền mạch."""
    return {**AMB, **kw, "_seg": seconds}


SFX: dict[str, dict] = {

    "sfx_dao_rach": {
        "bus": "thaoTac", "desc": "dao rach doc o banh",
        "proc": {**ONESHOT, "max_dur": 0.9},
        # Cố ý cùng một người thu, để mỗi lần bấm không nghe như đổi bếp.
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
        "proc": amb(22.0, rms=-30.0),
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
        # Cắt đoạn nước đã chảy đều, bỏ cú đổ ộc lúc đầu.
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
    "sfx_buoc_chu_quan": {
        # Chân người chơi nên thuộc bus `thaoTac`, không phải `duongPho`.
        "bus": "thaoTac", "desc": "buoc chan chu quan tren nen xi mang trong quay",
        "proc": {**ONESHOT, "max_dur": 0.5, "rms": -25.0},
        "sources": [{"fs": 166507}, {"fs": 690006}, {"fs": 475860}, {"fs": 562192, "start": 0.0, "dur": 0.4},
                    {"fs": 562192, "start": 0.45, "dur": 0.4}, {"fs": 778502}],
    },

    "amb_hem_sang": {
        "bus": "duongPho", "desc": "ambience hem buoi sang — giao thong HCMC that + chim",
        "proc": amb(40.0),
        "sources": [{"fs": 666730, "start": 8.0}],
    },
    "amb_hem_trua": {
        "bus": "duongPho", "desc": "ambience nang dung — ngoai o HCMC, thua xe hon",
        "proc": amb(36.0, rms=-28.0),
        "sources": [{"fs": 835521, "start": 5.0}],
    },
    "amb_hem_chieu": {
        "bus": "duongPho", "desc": "ambience chieu — duong pho HCMC, dong hon",
        "proc": amb(40.0),
        "sources": [{"fs": 769713, "start": 3.0}],
    },
    "amb_crowd": {
        # File riêng để công tắc giảm tải giác quan tắt được riêng lớp tiếng người.
        "bus": "duongPho", "desc": "tieng nguoi lao xao — giong Viet that (crowdSubMix)",
        "proc": amb(26.0, rms=-27.0),
        "sources": [{"fs": 402907, "start": 1.5}],
    },
    "amb_cho": {
        "bus": "duongPho", "desc": "ambience cho sang — cho Ben Thanh, TP.HCM",
        "proc": amb(20.0, loop_xfade=2.0),
        "sources": [{"fs": 447777, "start": 1.0}],
    },
    "amb_toi_nha": {
        "bus": "duongPho", "desc": "ambience toi trong nha — dem Viet Nam + quat",
        "proc": amb(34.0, rms=-29.0),
        "sources": [{"fs": 806575, "start": 10.0}],
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
        # Bản đầu là xe máy thu ở Việt Nam, cố ý để đầu.
        "proc": {**ONESHOT, "max_dur": 3.5, "mono": False, "rms": -23.0, "fade_in": 60, "fade_out": 200},
        "sources": [
            {"fs": 402960, "start": 2.0, "dur": 3.5},
            {"fs": 432804, "start": 0.5, "dur": 3.5},
            {"fs": 48180},
            {"fs": 397313},
        ],
    },
    "sfx_coi_xe": {
        # Giới hạn tần suất nằm ở `sfx.ts`; ở đây chỉ kéo mức thấp sẵn.
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
        # Phải cùng preset `UI` với `ui_click_go` vì công tắc tắt âm tiêu cực thay cái này bằng nó, cùng độ to.
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
        "proc": {**UI, "max_dur": 0.3, "rms": -34.0},
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
        # Một file duy nhất để sự kiện tốt và xấu nghe giống hệt nhau.
        "bus": "amBao", "desc": "tick go trung tinh cho tro nang (mac dinh TAT)",
        "proc": {**UI, "max_dur": 0.2, "rms": -26.0},
        "sources": [{"fs": 822568}],
    },

    # Một bộ giọng dùng chung, phân biệt NPC bằng `VOICE_PITCH` trong `src/audio/sfx.ts`.
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
        # 12 giọng khác nhau để khỏi nghe lặp; `trim` tắt vì cửa sổ cắt nằm giữa nguyên âm, gọt nữa thành tiếng "cạch".
        "bus": "giongNPC", "desc": "am tiet ngan tu 12 giong nguoi that — thoai kieu chibi, TAM cho toi khi co VO",
        "proc": {**VOX, "trim": False, "max_dur": 0.15, "fade_in": 8, "fade_out": 55, "rms": -26.0},
        "sources": [
            {"fs": 170780, "start": "auto", "dur": 0.17},
            {"fs": 88448,  "start": "auto", "dur": 0.17},
            {"fs": 697497, "start": "auto", "dur": 0.17},
            {"fs": 801137, "start": "auto", "dur": 0.17},
            {"fs": 436108, "start": "auto", "dur": 0.17},
            {"fs": 170768, "start": "auto", "dur": 0.17},
            {"fs": 87647,  "start": "auto", "dur": 0.17},
            {"fs": 87777,  "start": "auto", "dur": 0.17},
            {"fs": 516898, "start": "auto", "dur": 0.17},
            {"fs": 752227, "start": "auto", "dur": 0.17},
            {"fs": 585036, "start": "auto", "dur": 0.17},
            {"fs": 339838, "start": "auto", "dur": 0.17},
        ],
    },
}
