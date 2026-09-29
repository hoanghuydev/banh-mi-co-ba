# P5-03 — Âm thanh

**Thuộc phase:** P5 — Hoàn thiện
**Phụ thuộc:** `CANON.md` §15.4 (5 kênh + tắt âm báo tiêu cực) · §14 (tiếng rao, cơ chế Việt Nam) · §11 (số dòng thoại, shuffle-bag, bark 3 tầng) · §5 (perception — `GLIMPSED`/`NOTICED` cần tín hiệu) · §2 (lồng tiếng người thật, giọng miền Nam) · `P5-01` §2.4 (hợp đồng trợ năng) · `P5-02` §2.3.5 (đồng bộ miệng ↔ VO)
**Trạng thái:** **Chốt** về kiến trúc, danh sách và chính sách · **Còn mở** ở ngân sách lồng tiếng (§5.3 — chưa có số trong `idea.md`, **không bịa**)

---

## 1. Mục tiêu

Âm thanh trong game này làm ba việc, theo đúng thứ tự quan trọng:

1. **Là kênh sự kiện.** CANON §3 có ba sự kiện mà **âm thanh là cơ chế**, không phải trang trí: `WRONG_NAME` (*"là âm thanh, nhắm thẳng vào khách → bỏ qua gazeFactor, luôn bị nghe thấy"*), `DROPPED_FOOD` (*"có tiếng động"*), `BURNT_OR_COLD` (*"có mùi"* — không nghe được mùi, nên âm thanh phải gánh: tiếng khét nổ lách tách). → Âm thanh phục vụ **T1** và **T5** trực tiếp.
2. **Là bối cảnh không ai copy được.** **Tiếng rao** là thứ duy nhất trong tài liệu này vừa là chất liệu âm thanh, vừa là **thiết bị mua được**, vừa là **chất liệu cảm xúc cho cái kết**. Ba vai trong một tài sản.
3. **Là kênh trợ năng.** Người nhìn không rõ nghe ra bánh rớt. Người không nghe được đọc caption. Người bị quá tải tắt từng bus. Hợp đồng ở P5-01 §2.4 là ràng buộc cứng, không phải mong muốn.

Và một lời hứa marketing đã ký: **lồng tiếng người thật, KHÔNG AI voice.** *"Tôi nghe ra AI voice trong 2 giây và tôi sẽ refund."* (idea §19.5)

---

## 2. Kiến trúc 5 bus

Khớp 1–1 với 5 kênh bắt buộc của CANON §15.4. **Không có bus thứ 6.** Mọi âm thanh mới phải thuộc đúng một trong năm.

### 2.1. Bảng bus

| # | Bus | Khoá | Mặc định | Gain trần | Chứa | Không chứa |
|---|---|---|---|---|---|---|
| 1 | **Nhạc** | `bus.nhac` | 55 | −6 dB | Mọi cue nhạc, mọi stem thích ứng | Sting phán xét (không tồn tại, §6.4) |
| 2 | **Tiếng đường phố** | `bus.duongPho` | 70 | −3 dB | Ambience hẻm, xe máy, còi, mưa, radio hàng xóm, chó, chim, cửa cuốn, chổi quét, **tiếng rao** | Tiếng thao tác của chính người chơi |
| 3 | **Giọng NPC** | `bus.giongNPC` | 100 | **0 dB** | VO, bark, tiếng thở/"hm?", tiếng chép miệng, tiếng nói lỏm ở góc hẻm | Giọng người chơi (**không có** — người chơi không nói, T2) |
| 4 | **Tiếng thao tác** | `bus.thaoTac` | 85 | −2 dB | Dao, vỏ bánh giòn, than nổ, quết pate, rưới sốt, gói giấy, tiền lẻ, kẹp gắp, mở tủ, **tiếng bánh rớt**, tiếng khét | Âm UI |
| 5 | **Âm báo** | `bus.amBao` | 80 | −6 dB | Mở/đóng menu, chốt đơn, autosave, beep QR, chuyển ngày, click nút, click hợp lệ/không hợp lệ | Bất cứ gì diegetic |

**Sub-mix tách riêng** (CANON §15 công tắc số 5): `crowdSubMix` (mặc định 60) nằm **trong** `duongPho`, chứa **riêng tiếng người lao xao**. Lý do tách: người ADHD / tự kỷ thường bị chính lớp giọng nói nền làm quá tải, chứ không phải tiếng xe.

```
                       ┌─ crowdSubMix (60) ──┐
master (90) ──┬── duongPho (70) ─────────────┴── [ambience, xe, mưa, rao]
              ├── nhac (55) ──────────────────── [cue + stem]
              ├── giongNPC (100) ─────────────── [VO, bark, thở]
              ├── thaoTac (85) ──────────────── [foley]
              └── amBao (80) ─────────────────── [UI]
                   └─ (mono? → downmix cuối chuỗi)
```

### 2.2. Gain structure và mức chuẩn

| Mục | Giá trị | Ghi chú |
|---|---|---|
| Master integrated | **−18 LUFS** | Chuẩn thoải mái cho game cozy; không đua loudness |
| True peak trần | **−1,5 dBTP** | Tránh méo khi encode Ogg |
| Dải động (LRA) | 7–11 LU | Đủ để **im lặng có nghĩa** (§6.5) |
| VO sau xử lý, mỗi file | **−18 LUFS**, peak −3 dBTP | Chuẩn hoá từng file → không cần normalize lúc chạy |
| Ambience bed | −28 đến −24 LUFS | |
| Foley thao tác | −22 đến −16 LUFS | |
| UI | −24 LUFS | |
| Limiter cuối | Trần −1,5 dBTP, ratio ∞, attack 1ms | Chống người chơi kéo hết 5 bus lên 100 rồi clip |

### 2.3. Ducking

Khi có VO đang phát trên `giongNPC`:

| Bus bị hạ | Mức hạ (ở `duckingStrength` = 70) | Attack | Release |
|---|---|---|---|
| `nhac` | **−14 dB** | 120ms | 450ms |
| `duongPho` | **−7 dB** | 150ms | 600ms |
| `crowdSubMix` | **−11 dB** | 150ms | 600ms |
| `thaoTac` | **−3 dB** | 80ms | 300ms |
| `amBao` | 0 dB | — | — |

`duckingStrength` 0–100 scale tuyến tính lên các mức trên (P5-01 §2.4). Ở 0 → không duck (cho người muốn nghe đủ ambience); ở 100 → ×1,3 các mức trên.

### 2.4. Định vị không gian

Stereo 2D đơn giản, **không HRTF, không 3D audio** — quầy hàng là một mặt phẳng hẹp.

| Nguồn | Pan | Ghi chú |
|---|---|---|
| Khách ở `FRONT_CENTER` | 0,0 | |
| Khách ở `FRONT_SIDE` | ±0,25 | Theo bên đang đứng |
| Khách ở `QUEUE_2` / `QUEUE_3` | ±0,35 | + lowpass 8 kHz nhẹ (xa hơn) |
| Nói lỏm ở góc hẻm | ±0,55 | + lowpass 5 kHz + gain −9 dB. **Vẫn phải nghe ra nội dung** (CANON §12.4: không nghe lỏm được thì bỏ luôn cả tin đồn) |
| Thao tác của người chơi | 0,0 | Luôn ở giữa — đó là tay bạn |
| Xe máy chạy qua | −0,9 → +0,9 theo thời gian | Doppler nhẹ (±4% pitch), tắt Doppler khi `reduceMotion` |
| Tiếng rao (loa, đi ngang) | −0,8 → +0,8, chậm | §3 |
| `mono` = true | Tất cả về 0,0 | Downmix cuối chuỗi, bù +0 dB |

---

## 3. Tiếng rao — tài sản ba vai

> *"Bánh mì Sài Gòn, đặc ruột thơm bơ, một ngàn một ổ…"*
> *"Bánh mì nóng giòn đê... ê..."*
> — rao qua loa, **giọng ghi âm sẵn** (idea §19.3)

### 3.1. Vai 1 — chất liệu âm thanh (ambience)

Tiếng rao là **âm thanh nhận dạng tức thì** của Sài Gòn. Nghe 2 giây là biết mình đang ở đâu. Nó phải có mặt trong **20 giây đầu** của trailer và **20 giây đầu** của game.

| Thuộc tính | Giá trị |
|---|---|
| `id` | `amb_rao_banhmi_01..03`, `amb_rao_tauhu_01..02`, `amb_rao_vesochieu_01` |
| Bus | `duongPho` |
| Độ dài | 6–11s mỗi câu (một vòng loa) |
| Biến thể | **6 tổng** (3 bánh mì + 2 tàu hũ + 1 khác) |
| Nguồn | **Thu thật ngoài đường** (xem §4.1), hoặc **thu diễn viên rồi xử lý qua loa thật** |
| Chuỗi xử lý "qua loa" | Band-pass **400 Hz – 3,4 kHz** (roll-off 12 dB/oct) → soft clip **+2,5 dB drive** → slap delay **62ms, feedback 12%, mix 15%** (dội vách hẻm) → gain theo khoảng cách |
| Chuyển động | Emitter 2D chạy path từ pan −0,8 → +0,8 trong 14–22s, gain theo `1/(1+d²)` |
| Khi `reduceMotion` | **Giữ nguyên** — chuyển động âm thanh không gây kích ứng tiền đình. Chỉ tắt bằng `bus.duongPho` |

**Lịch phát trong ngày** (nguồn ambience, không phải sự kiện gameplay):

| Khung giờ | Rao gì | Tần suất |
|---|---|---|
| `TO_MO` 5:30–6:30 | Bánh mì (đối thủ đi xe đạp), xôi | 1–2 lần |
| `CAO_DIEM` 6:30–8:00 | Ít nhất (ai cũng bận) | 0–1 lần |
| `NANG_DUNG` 8:00–10:30 | Tàu hũ (bà Sáu — nhân vật CANON §9 #11), vé số | 1–2 lần |
| `CHIEU` 15:00–17:30 | Tàu hũ, bánh tráng trộn, "ve chai" | 2–3 lần |
| Mưa | **Không có tiếng rao** | Im lặng mưa — chi tiết đúng và đắt |

### 3.2. Vai 2 — thiết bị mua được: **loa rao**

Nằm trong Trục B (CANON §10: *"mua thiết bị / nâng cấp — bể chứa tiền duy nhất đáng tin"*).

| Thuộc tính | Giá trị khởi điểm |
|---|---|
| Tên | **Loa rao** |
| Chi phí | Theo bảng thiết bị P5-04 §3 (hạng trung) |
| Tác dụng cơ học | `+walkInCustomers` mỗi ngày (khách vãng lai vô danh, **không** phải 12 NPC có tên); tăng theo giờ: `CAO_DIEM` +0, `NANG_DUNG` +2, `CHIEU` +3 |
| Tác dụng phụ (đánh đổi thật) | **`+gazeFactor` cho mọi khách trong 3 giây sau mỗi vòng rao** — loa kêu thì người ta quay sang nhìn cái xe, và nhìn luôn cả **tay bạn**. Tăng lượng khách ↔ tăng số mắt (nối thẳng vào §5 và §13.3 CANON) |
| Tác dụng phụ 2 | Bà Bảy / thầy Phúc (`soi` cao, `nongTinh` thấp) có bark riêng: *"Con mở nhỏ nhỏ thôi, điếc tai bà."* Lạm dụng → `traitMul` +0,05 cho họ |
| Nội dung phát | **Giọng cô Ba, thu sẵn một lần** (xem §3.3) |
| Tắt/bật | Có nút tắt trên xe — lựa chọn mỗi ngày, không phải mua một lần rồi kệ |

Đây là một nâng cấp **đúng chất Trục B**: nó không làm bạn mạnh hơn một chiều, nó **đổi hình dạng bài toán**.

### 3.3. Vai 3 — chất liệu cảm xúc cho cái kết

Nguồn: SGGP, bài *"Tiếng rao… lặng yên"* — **tiếng rao đang mất dần** khỏi thành phố (idea §19.3).

**Cơ chế đề xuất (cần P4 duyệt — xem §9):**

1. **Taper trong mùa.** Số lần rao **của người khác** trong một ngày giảm dần theo lịch: ngày 1–10 trung bình **3,2 lần/ngày** → ngày 31–40 trung bình **0,9 lần/ngày**. Không thông báo, không ghi ở đâu. Người chơi chỉ **nhận ra** khi họ nhận ra.
2. **Một NPC nói ra** (nguyên tắc Jeff Orkin, CANON §16 Đừng-1: *vocalizing intentions* rẻ hơn mô phỏng). Khoảng ngày 24–28, bà Sáu (gánh tàu hũ): *"Dạo này đi cả buổi hổng thấy ai rao nữa hà."* **Một câu. Không giải thích thêm.**
3. **Đảo chiều.** Khi người chơi mua **loa rao**, tiếng rao **quay lại hẻm** — và nó là **giọng cô Ba**. Thứ đang biến mất khỏi thành phố giờ phát ra từ cái xe của bạn.
4. **Ngày 40.** Trong 90 giây cuối, **nhạc im hoàn toàn** (§6.5). Chỉ còn ambience hẻm + **một vòng rao của cô Ba** từ loa trên xe của bạn.

**Ghi chú thu âm quan trọng:** file rao của cô Ba phải được thu **ở buổi đầu tiên**, dù nó chỉ dùng ở phút cuối của game. Nó là file VO có giá trị cảm xúc cao nhất trong toàn dự án và **không được để tới session cuối** khi diễn viên đã mệt và ngân sách đã cạn.

---

## 4. Danh sách SFX đầy đủ

### 4.1. Nguyên tắc nguồn thu

| Loại | Chính sách |
|---|---|
| **Âm thanh đặc trưng** (dao rạch bánh, vỏ giòn, than nổ, quết pate, gói giấy, tiếng rao, ambience hẻm) | **THU THẬT. Bắt buộc.** Đây là thứ phân biệt game này với mọi game nấu ăn khác |
| Âm thanh chung không đặc trưng | Được dùng thư viện **có giấy phép thương mại rõ ràng**, ghi vào `assets/PROVENANCE.csv` (P5-02 §2.8.2) |
| **Gen-AI** | **CẤM TUYỆT ĐỐI** (P5-02 §2.9) |
| Thiết bị đề xuất | Recorder cầm tay 24-bit/48kHz + 1 shotgun + 1 cặp lav; **thu ở đúng hẻm** trong chuyến phỏng vấn 3–5 chủ xe bánh mì của tuần 1 (idea §23) — **gộp hai việc vào một chuyến** |

> **Việc quan trọng nhất của §4:** chuyến phỏng vấn tuần 1 **phải mang theo recorder**. Đi lại lần hai tốn tiền và mất thời cơ.

### 4.2. Bảng SFX

`BT` = biến thể (shuffle-bag). `RR` = round-robin.

#### A. Thao tác làm bánh — bus `thaoTac`

| `id` | Mô tả | Nguồn thu | Độ dài | BT | Ghi chú |
|---|---|---|---|---|---|
| `sfx_dao_rach` | **Dao rạch dọc ổ bánh** | Thu thật, dao thật + bánh mì thật mua sáng | 0,25–0,40s | **8** | Âm chữ ký của game. Thu 20 lần, giữ 8 tốt nhất |
| `sfx_vo_gion` | **Vỏ bánh nứt / bóp nghe giòn** | Thu thật, gần micro | 0,30–0,60s | **8** | Phát kèm khi cầm ổ mới ra lò |
| `sfx_than_no` | **Than nổ lách tách** | Thu thật tại lò | 0,10–0,30s | **6** | + 1 loop bed 30s |
| `sfx_lo_bed` | Lò than cháy (loop nền) | Thu thật | 30s loop | 2 | RR offset |
| `sfx_quet_pate` | **Quết pate lên ruột bánh** | Foley: pate thật + muỗng | 0,50–1,20s | **6** | Ẩm, nhớp, gần |
| `sfx_ruoi_sot` | **Rưới nước sốt** | Foley | 0,40–0,80s | **5** | |
| `sfx_ra_xi_dau` | Rắc/nhỏ xì dầu | Foley | 0,30s | 4 | |
| `sfx_rac_tieu` | Rắc muối tiêu | Foley | 0,35s | 5 | |
| `sfx_kep_gap` | Kẹp gắp kim loại | Foley | 0,12–0,18s | **6** | Dùng rất nhiều → cần nhiều BT |
| `sfx_dat_thot` | Đặt bánh/nguyên liệu xuống thớt | Foley | 0,10–0,15s | **6** | |
| `sfx_xep_rau` | Xếp rau / đồ chua | Foley | 0,25s | 5 | |
| `sfx_goi_giay` | **Gói giấy báo quanh ổ bánh** | Thu thật, giấy báo thật | 0,80–1,50s | **6** | |
| `sfx_bich_nilon` | Mở / sột soạt bịch nilon | Thu thật | 0,35–0,50s | **5** | |
| `sfx_xe_giay` | Xé cuộn giấy | Foley | 0,30s | 4 | |
| `sfx_mo_tu_mat` | Mở / đóng tủ mát | Thu thật | 0,50s | 3 | |
| `sfx_cua_lo` | Cửa lò mở / đóng | Thu thật | 0,40s | 3 | |
| `sfx_rot_tra_da` | Rót trà đá, đá va thành ly | Foley | 0,60s | **6** | Âm của `CARED_FOR_THEM` — phải **dễ chịu nhất** trong game |
| `sfx_dat_ly` | Đặt ly xuống mặt bàn | Foley | 0,20s | 6 | |
| `sfx_lau_khan` | Lau khăn lên mặt xe | Foley | 0,70s | 4 | |
| **`sfx_do_roi_dat`** | **Ổ bánh / nguyên liệu rớt xuống đất** | Foley, nền xi măng thật | 0,35–0,50s | **4** | **Sự kiện, không phải feedback.** Xem §5.3 — **KHÔNG bị tắt** bởi công tắc âm báo tiêu cực |
| `sfx_khet` | Bánh cháy — khét nổ lách tách | Foley | 1,2s loop | 3 | Gánh vai "có mùi" của `BURNT_OR_COLD` (CANON §3.1) |
| `sfx_tien_le` | **Đếm / đưa tiền lẻ, tiền giấy sột soạt + xu** | Thu thật | 0,30–0,70s | **8** | Dùng mỗi khách → nhiều BT nhất |
| `sfx_ngan_keo` | Mở khay tiền | Foley | 0,25s | 3 | |
| `sfx_lat_so` | Lật trang sổ nợ | Foley | 0,30s | 5 | |
| `sfx_viet_but` | Viết bút bi lên giấy | Foley | 0,40–0,90s | **5** | Cảnh tối, sổ tay |

#### B. Hẻm và đường phố — bus `duongPho`

| `id` | Mô tả | Nguồn thu | Độ dài | BT | Ghi chú |
|---|---|---|---|---|---|
| `amb_hem_sang` | **Ambience hẻm buổi sáng** — 4 lớp: giao thông xa, chim sẻ, chổi quét, tiếng người xa | **Thu thật, 6:00–7:00 sáng, ≥ 20 phút** | 120s loop | **4 lớp** | Nền của cả game. Trộn lớp độc lập theo giờ |
| `amb_hem_trua` | Ambience nắng đứng: ve, quạt, ít người | Thu thật | 120s loop | 2 | |
| `amb_hem_chieu` | Ambience chiều: đông hơn, TV nhà bên | Thu thật | 120s loop | 2 | |
| `amb_crowd` | **Tiếng người lao xao** (→ `crowdSubMix`) | Thu thật | 60s loop | 3 | Tách riêng để tắt độc lập (CANON §15 công tắc 5) |
| `sfx_xe_may_qua` | **Xe máy chạy qua** — gần / vừa / xa × 3 loại máy | Thu thật | 1,5–3,0s | **8** | Doppler ±4%, pan chạy |
| `sfx_xe_may_no` | Nổ máy / tắt máy | Thu thật | 1,2s | 4 | |
| `sfx_coi_xe` | Còi xe | Thu thật | 0,30s | **6** | **Giới hạn riêng**: tối đa 1 lần / 25s, luôn qua lowpass 6 kHz, gain trần −16 dB. Còi xe là âm gây khó chịu nhất trong bộ |
| `amb_mua_mai_ton` | **Mưa trên mái tôn** | Thu thật | 40s loop | **3 mức** | Nhẹ / vừa / nặng. Crossfade theo `rainIntensity` |
| `amb_mua_nen` | Mưa nền + nước chảy máng xối | Thu thật | 60s loop | 2 | |
| `sfx_nuoc_dot` | Giọt nước rơi xuống vũng | Thu thật | 0,20s | 5 | Sau mưa |
| `amb_radio_hangxom` | **Radio nhà hàng xóm — cải lương** | **Sáng tác + thu riêng** (xem cảnh báo dưới) | 90s loop | **3** | Motif của bà Bảy (CANON §9 #1: *mê cải lương*) |
| `amb_tv_hangxom` | TV nhà bên (tin tức lí nhí, **không nghe rõ nội dung**) | Thu thật, lowpass mạnh | 60s loop | 2 | **Không được nghe ra nội dung** — tránh mọi rủi ro chính trị |
| `sfx_cua_cuon` | Cửa cuốn kéo lên / hạ xuống | Thu thật | 2,0s | 3 | Âm mở đầu ngày |
| `sfx_choi_quet` | Chổi quét sân | Thu thật | 0,90s loop | 4 | |
| `sfx_cho_sua` | Chó sủa xa | Thu thật | 0,80s | 4 | |
| `sfx_chim_se` | Chim sẻ | Thu thật | 0,60s | 5 | |
| `sfx_ga_gay` | Gà gáy xa (chỉ `TO_MO`) | Thu thật | 1,5s | 3 | Có thật ở hẻm Sài Gòn |
| **`sfx_ruoi`** | **Tiếng ruồi bay** | Thu thật/foley | 6s loop | 2 | **Chỉ số `STALL_CLEANLINESS` dạng diegetic** — quầy càng bẩn, mật độ và gain càng tăng. **Không có số nào hiện ra** (T3) |
| `sfx_buoc_chan` | Bước chân khách đến / đi | Foley | 0,45s | **6** | 3 loại: dép lê, giày tây, dép nhựa |
| `sfx_keo_ghe` | Kéo ghế nhựa trên nền xi măng | Thu thật | 0,60s | 5 | |
| `sfx_quat_may` | Quạt máy cũ (loop) | Thu thật | 30s loop | 2 | |
| `amb_cho` | Ambience chợ sáng | Thu thật | 90s loop | 2 | Cảnh chợ |
| `amb_toi_nha` | Ambience tối trong nhà: quạt trần, đèn huỳnh quang ù | Thu thật | 60s loop | 2 | Cảnh tối |

> **CẢNH BÁO BẢN QUYỀN — `amb_radio_hangxom`.**
> **Không được dùng bản thu cải lương có thật.** Mọi bản thu cải lương thương mại đều có chủ sở hữu, và việc dùng vài giây trong game phát hành toàn cầu là vi phạm rõ ràng.
> → **Đặt hàng một đoạn cải lương gốc**, 60–90 giây, một giọng + đàn kìm hoặc guitar phím lõm, mua đứt (buyout). Đây cũng là cách đúng về văn hoá: **trả tiền cho nghệ sĩ Việt**, và tên họ đứng đầu credits (CANON §14.1).

#### C. Âm báo giao diện — bus `amBao`

| `id` | Mô tả | Độ dài | BT | Bị tắt bởi `disableNegativeAudioCues`? |
|---|---|---|---|---|
| `ui_click` | Click nút | 0,08s | 3 | Không |
| `ui_chon_nguyen_lieu` | Chọn nguyên liệu (tap-to-place) | 0,09s | 4 | Không |
| `ui_dat_thanh_cong` | Đặt hợp lệ | 0,10s | 3 | Không |
| **`ui_khong_hop_le`** | **Thao tác không hợp lệ** | 0,12s | 2 | **CÓ** → thay bằng `ui_click_go` (click gỗ trung tính), **cùng độ to** |
| `ui_click_go` | Click gỗ trung tính | 0,10s | 3 | (là bản thay thế) |
| `ui_mo_menu` / `ui_dong_menu` | Mở / đóng menu | 0,15s | 1 | Không |
| `ui_chot_don` | Chốt đơn (sau bước xác nhận) | 0,25s | 2 | Không |
| `ui_autosave` | Autosave (rất nhẹ, −30 dB) | 0,12s | 1 | Không |
| `ui_qr_beep` | Beep máy QR | 0,30s | 2 | Không (là âm thành công, và là âm có thật) |
| `ui_chuyen_ngay` | Chuyển sang ngày mới | 0,90s | 1 | Không |
| **`ui_ngay_am_tien`** | Âm "hụt" khi doanh thu ngày âm | 0,60s | 1 | **CÓ** → **im lặng** |
| `ui_mo_so_tay` | Mở sổ tay | 0,20s | 2 | Không |
| `a11y_ping_glimpsed` | **Tick gỗ trung tính, opt-in** | 0,07s | 2 | Không áp dụng (mặc định TẮT, xem §5.4) |

#### D. Giọng NPC phi lời — bus `giongNPC`

| `id` | Mô tả | Độ dài | BT | Ghi chú |
|---|---|---|---|---|
| `vox_hm_glimpsed` | **Tiếng "hm?" rất nhẹ + sột soạt áo quần** | 0,30s | **6/NPC**, thu chung 1 session | Tín hiệu `GLIMPSED` (§5.2) |
| `vox_tho_dai` | Thở dài | 0,60s | 4/nhóm giọng | |
| `vox_chep_mieng` | Chép miệng | 0,25s | 4/nhóm giọng | Rất Việt Nam |
| `vox_cuoi_nhe` | Cười nhẹ | 0,50s | 4/nhóm giọng | |
| `vox_a_ra` | "À…" / "Ủa…" | 0,40s | **6/nhóm giọng** | Dùng cho bark tier-3 (CANON §11) |
| `vox_hum` | "Hửm." | 0,35s | 4/nhóm giọng | **Lưới an toàn bark tier-3** |

### 4.3. Tổng khối lượng

| Nhóm | Số `id` | Tổng file (kể BT) |
|---|---|---|
| A. Thao tác | 25 | ~128 |
| B. Hẻm / đường phố | 24 | ~86 |
| C. UI | 13 | ~27 |
| D. Giọng phi lời | 6 | ~90 (theo nhóm giọng) |
| Tiếng rao | 6 | 6 |
| **Tổng SFX** | **74 id** | **~337 file** |

---

## 5. Âm thanh làm việc của perception

### 5.1. Nguyên tắc

> **Perception không có sting.** Mọi tín hiệu perception đều **diegetic** — phát ra từ chính con người đang quan sát bạn, ở đúng vị trí họ đứng.

Lý do không phải thẩm mỹ mà là cơ chế: một sting phi diegetic ("ting!" khi bị để ý) sẽ trở thành **chỉ số** — người chơi học cách nghe sting thay vì nhìn mặt. Điều đó vi phạm **T3** (không hiện chỉ số) và làm hỏng **T5** (attention phải **NHÌN** thấy được).

### 5.2. `GLIMPSED` (certainty 0,35–0,70)

| Kênh | Biểu hiện |
|---|---|
| Hình (CANON §5) | Quay đầu + dấu `?` nhỏ; pose `tilt_head` (P5-02 §2.4.3) |
| **Âm** | `vox_hm_glimpsed` — **rất nhẹ, −28 dBFS**, pan theo vị trí khách, bus `giongNPC` |
| Xác suất phát | **55%** (không phải 100% — CANON §11: *~35% số lần "nhận thấy" KHÔNG nói gì cả*) |
| Cooldown | 4,0s / NPC |
| Caption (nếu `soundCaptions`) | `[bà Bảy khẽ hắng giọng]` |

### 5.3. `NOTICED` (certainty 0,70–1,0)

| Kênh | Biểu hiện |
|---|---|
| Hình | Nhíu mày (`brow_04 / eye_03 / mouth_04`), pose `look_at_hands` |
| **Âm** | **Bark tier-1 có lồng tiếng** (CANON §11), bus `giongNPC` |
| Xác suất nói | **65%** — 35% còn lại chỉ đổi nét mặt |
| Cooldown tier-1 | 12s / NPC / kind |
| Tier-2 / tier-3 | Khi tier-1 còn cooldown → `vox_a_ra` / `vox_hum` |
| Caption | Phụ đề đầy đủ, luôn bật cho dòng có VO |

### 5.4. Tuỳ chọn trợ năng `a11yPerceptionPing`

Cho người thị lực kém **không đọc được nét mặt ở 72px**. Mặc định **TẮT**.

| Thuộc tính | Giá trị |
|---|---|
| Âm | `a11y_ping_glimpsed` — click gỗ trung tính, −26 dBFS, 0,07s |
| Bus | `amBao` |
| Phát khi | `GLIMPSED` **và** `NOTICED` chuyển trạng thái |
| **Timbre giống hệt nhau** cho sự kiện tốt và xấu | **Bắt buộc.** Nó là **thông tin**, không phải **phán xét** |
| Quan hệ với `disableNegativeAudioCues` | **Độc lập.** Có thể bật ping mà vẫn tắt âm báo tiêu cực — vì ping không tiêu cực |
| Pan | Theo vị trí khách → cũng cho biết **ai** đang để ý |

### 5.5. Cái gì bị tắt / không bị tắt bởi "tắt âm báo tiêu cực"

Nhắc lại hợp đồng P5-01 §2.4 dưới góc nhìn âm thanh:

| Âm | Tắt? | Lý do |
|---|---|---|
| `ui_khong_hop_le` (buzz "sai rồi") | **TẮT** → `ui_click_go` | Là lời phán xét của giao diện |
| Sting nhạc buồn khi khách bỏ đi | **TẮT** → im lặng | Là lời phán xét của nhạc |
| Hợp âm thứ khi `CONFIRMED` tiêu cực | **KHÔNG TỒN TẠI** | §5.1: perception không có sting, ngay cả khi công tắc tắt |
| `ui_ngay_am_tien` | **TẮT** → im lặng | |
| Rung tay cầm khi làm sai | **TẮT** | Trùng công tắc 6 (CANON §15) |
| **`sfx_do_roi_dat`** (bánh rớt) | **KHÔNG TẮT** | **Sự kiện có thật trong thế giới.** Với người nhìn không rõ, đây là cách duy nhất biết mình vừa làm rớt |
| **`sfx_khet`** (bánh cháy) | **KHÔNG TẮT** | Gánh vai "có mùi" của `BURNT_OR_COLD` |
| **`sfx_ruoi`** (quầy bẩn) | **KHÔNG TẮT** | Là trạng thái thế giới, không phải điểm số |
| `vox_tho_dai` / `vox_chep_mieng` | **KHÔNG TẮT** bởi công tắc này | Là con người phản ứng. Tắt bằng `bus.giongNPC` nếu muốn |

> **Ranh giới một dòng:** *âm mô tả thế giới thì giữ; âm chấm điểm người chơi thì bỏ.*

---

## 6. Nhạc

### 6.1. Cái KHÔNG làm

> idea.md Phần I §2 mục 3: **"Thẩm mỹ thay cho cơ chế. Pastel + lo-fi beats không phải là gameplay."**

**Cấm:**
- **Lo-fi hip-hop beats chung chung.** Nó là đồng phục của cozy game và nó nói đúng một điều: *"chúng tôi không nghĩ ra gì cả."*
- Vinyl crackle + rain layer + Rhodes + boom-bap nhịp 80 BPM.
- Pad synth mơ màng vô danh tính.
- **Nhạc chạy liên tục không ngắt.**
- **Nhạc phản hồi điểm số** ("nhạc vui khi làm tốt") — đó là một **thanh chỉ số bằng âm thanh**, vi phạm T3.
- Pastiche cải lương bằng sample từ bản thu có sẵn.

### 6.2. Hướng nhạc — gắn với bối cảnh

**Ý tưởng lõi: nhạc của game này là thứ có thể phát ra từ trong cái hẻm đó.** Không phải nhạc nền của một video YouTube về "chill Saigon vibes".

| Yếu tố | Đề xuất |
|---|---|
| **Biên chế** | Nhỏ, **tối đa 3 bè cùng lúc**. Acoustic là chính |
| **Nhạc cụ lõi** | **Guitar phím lõm** (guitar khoét phím của nhạc tài tử Nam Bộ — âm sắc này *chỉ* Sài Gòn có) · **đàn kìm** dùng thưa · guitar thùng nylon · contrabass gảy · trống brush rất nhẹ |
| **Nhạc cụ "hẻm"** | **Piano upright hơi lạc dây** · **keyboard rẻ tiền kiểu Casio** (thứ đám cưới/quán nhậu hay dùng) · harmonica |
| **Chất liệu điệu thức** | Vay hơi thở **điệu oán / hò** của nhạc tài tử — **luyến láy và nhấn nhá**, không phải sao chép bài bản. **Không pastiche.** Nhạc sĩ phải là người Việt hiểu nhạc tài tử |
| **Tempo** | 68–84 BPM, **rubato nhẹ** (không quantize cứng — đó là điểm khác lo-fi) |
| **Dải tần** | Để trống **400 Hz – 3,4 kHz** khi có VO — cùng dải với giọng nói và với loa rao |
| **Không dùng** | Trống điện tử, sidechain pump, sub-bass, reverb cathedral |

### 6.3. Danh sách cue

`stem` = số lớp có thể bật/tắt độc lập.

| `id` | Dùng ở | Độ dài | Stem | Ghi chú |
|---|---|---|---|---|
| `mus_to_mo` | Trước giờ mở hàng | 2:10 loop | 3 | Thưa nhất. Gần như chỉ guitar đơn |
| `mus_cao_diem` | 6:30–8:00 | 2:40 loop | 3 | **Chỉ lớp nhịp + bass. KHÔNG có giai điệu** — giai điệu sẽ đánh nhau với bark |
| `mus_lang` | Giờ vắng khách | 3:00 loop | 3 | Chỗ duy nhất giai điệu được phép nở ra |
| `mus_cho` | Cảnh chợ | 2:00 loop | 2 | Nhịp hơi nhanh hơn, vui hơn |
| `mus_toi` | Cảnh tối, đếm tiền, sổ tay | 2:30 loop | 3 | Piano lạc dây làm chính |
| `mus_mua` | Ngày mưa (đè lên cue giờ) | 2:20 loop | 2 | Rút hết trống. Chỉ còn bè giữ và guitar |
| `mus_arc_am` | Arc nặng (chú Tư đi, chị Lan không quay lại) | 1:10 one-shot | 1 | **Vào SAU sự kiện ít nhất 4 giây**, không vào cùng lúc |
| `mus_arc_duong` | Arc ấm (`REMEMBERED_USUAL` với khách ruột lâu năm) | 0:50 one-shot | 1 | Xem luật §6.4 |
| `mus_ngay_40` | Kết mùa | 2:00 | 2 | **Dừng hẳn ở 90 giây cuối** (§6.5) |
| `mus_menu` | Menu chính | 1:40 loop | 2 | |

**Tổng: 10 cue, ~20 phút nhạc, ~24 stem.** Đây là khối lượng một nhạc sĩ làm được trong 4–6 tuần bán thời gian.

### 6.4. Luật thích ứng — nhạc phản ứng với **bối cảnh**, không với **điểm số**

| Điều kiện | Hành động |
|---|---|
| Vào giờ cao điểm | Bật stem nhịp, **tắt stem giai điệu** |
| Hàng chờ ≥ 3 người | Thêm một lớp shaker rất khẽ. **Không tăng tempo** (tăng tempo = giục = phản chill) |
| `STALL_CLEANLINESS` thấp | **Không đổi nhạc.** Tiếng ruồi đã làm việc đó |
| Trời mưa | Crossfade sang `mus_mua`, 3,0s |
| `REMEMBERED_USUAL` với khách đã `Friend` | **Một nốt guitar đơn** vang lên — không phải một đoạn nhạc. Nghe như có người khẽ gật đầu | 
| Bất kỳ sự kiện tiêu cực `CONFIRMED` nào | **Nhạc dừng** (§6.5). **Không có sting buồn.** Im lặng chính là phản ứng |
| Người chơi đang làm tốt / làm dở nói chung | **KHÔNG CÓ LUẬT NÀO.** Nhạc không bao giờ là bảng điểm |

> **Luật về `mus_arc_duong`:** chỉ dùng cho **mốc arc đã viết sẵn** (ví dụ bà Sáu đổi câu *"nhà tui gần chỗ bán tàu hũ"* thành *"gần xe bánh mì cô Ba"*), **không** dùng cho một lần phục vụ tốt. Nhạc ấm mà rẻ thì mất giá trị sau 3 lần.

### 6.5. **Nhạc phải IM ĐI ở khoảnh khắc quan trọng**

Đây là luật quan trọng nhất của §6. Trong một game mà **im lặng là một trong các phản ứng** (CANON §11: *~35% số lần nhận thấy không nói gì cả*), nhạc chạy liên tục sẽ **nuốt mất** im lặng đó.

| # | Khoảnh khắc | Hành động nhạc |
|---|---|---|
| **1** | NPC bắt đầu một dòng `blocking` | Fade xuống **0** trong **400ms**. Quay lại **1,2s sau** khi dòng kết thúc, ở **−6 dB trong 8 giây** |
| **2** | Bất kỳ sự kiện tiêu cực nào chạm `CONFIRMED` | **Dừng hẳn.** Quay lại sau **6 giây**, từ đầu một loop, ở −6 dB |
| **3** | **Khách mở hàng** (đầu tiên trong ngày, CANON §14 mở hàng/đốt vía) | Nhạc **im từ lúc họ bước tới** đến khi giao dịch xong. Đây là nghi thức, không phải một khách bình thường |
| **4** | **Khoảnh khắc `REMEMBERED_USUAL`** — *"khoảnh khắc chữa lành lõi của game"* (CANON §3.2) | **KHÔNG dâng nhạc lên.** Ngược lại: tắt mọi stem trừ một, để nghe rõ tiếng gói giấy và câu khách nói |
| **5** | Khách bỏ đi không nói gì (`silentDeparture`) | **Không có gì cả.** Không nhạc, không sting. Chỉ có tiếng bước chân xa dần và ambience hẻm |
| **6** | Minigame đốt vía | Nhạc im. Chỉ có tiếng giấy cháy, tiếng muối rơi, và giọng cô Ba khấn |
| **7** | **90 giây cuối của ngày 40** | **Nhạc dừng hẳn và không quay lại.** Chỉ ambience hẻm + một vòng tiếng rao giọng cô Ba (§3.3) |
| **8** | Người chơi mở menu Pause | Nhạc hạ xuống −12 dB (không tắt — pause phải thấy an toàn, không thấy trống rỗng) |

**Quy tắc kiểm chứng:** đo tỉ lệ thời gian có nhạc trong một ngày chơi. Mục tiêu **52–65%**. Trên 75% là nhạc đang chạy liên tục → im lặng mất nghĩa. Dưới 45% là game trống.

### 6.5.1. Bản quyền nhạc

- Sáng tác gốc, **mua đứt (buyout) vĩnh viễn, mọi nền tảng, gồm quyền dùng trong trailer và trên mạng xã hội**.
- **Không AI** — điều khoản trong hợp đồng.
- **Không cho phép dùng bản ghi để huấn luyện AI** — điều khoản trong hợp đồng.
- Nhạc sĩ Việt đứng **đầu credits** cùng nhóm viết văn hoá (CANON §14.1).

---

## 7. Lồng tiếng

### 7.1. Ràng buộc cứng

| # | Ràng buộc | Nguồn |
|---|---|---|
| 1 | **Người thật. KHÔNG AI voice.** *"Tôi nghe ra AI voice trong 2 giây và tôi sẽ refund."* | idea §19.5 · CANON §2 |
| 2 | **Giọng miền Nam** là gốc | idea §19.5 · CANON §2 |
| 3 | **Chị Hạnh giọng Bắc** — nhân vật "người Bắc mới vô Sài Gòn, bị chọc giọng" (CANON §9 #9). Đây là **nhân vật**, không phải lỗi casting | CANON §9 |
| 4 | **Đại từ xưng hô không dịch** — "cô / con / chú / chị / anh / em" giữ nguyên cả trong phụ đề Anh | CANON §2 |
| 5 | **Phụ đề luôn có** cho mọi dòng có VO, kèm tên người nói, cỡ theo P5-01 §2.1 | P5-01 |
| 6 | Không cho phép dùng bản ghi để **huấn luyện AI** — điều khoản hợp đồng | P5-02 §2.9 |

### 7.2. Số dòng cần thu theo 3 mốc CANON §11

**Quan trọng:** *số dòng thoại* ≠ *số dòng có lồng tiếng*. Thu 100% là bất khả thi về ngân sách và **không cần thiết** — thoại nghe lỏm, ghi chú sổ tay, và pool generic lặp lại sống tốt bằng chữ + `vox_*` phi lời.

| Mốc CANON §11 | Tổng dòng | **Dòng THU** | % | Thu những gì |
|---|---|---|---|---|
| **v1 / demo** | **~520** | **~220** | 42% | 100% bark tier-1 của 3 NPC vertical slice · toàn bộ thoại cô Ba · **6 câu rao** · toàn bộ `vox_*` phi lời · dòng gọi món của 3 NPC |
| **Beta nội bộ** | ~1.200 | **~520** | 43% | + bark tier-1 của cả 12 NPC · dòng gọi món đủ · dòng nghe lỏm gossip (cần nghe được — CANON §12.4) |
| **Full release** | **~2.980** | **~1.250** | 42% | + toàn bộ arc nhân vật · dòng mốc quan hệ · dòng kết mùa · dòng thời tiết/lễ · pickup |

**Không thu:** ghi chú sổ tay (người chơi tự viết), mô tả hệ thống, dòng tin đồn tầng 3 (đã bị biến dạng, nghe qua thuật lại), pool generic khách vãng lai từ lần lặp thứ 3 trở đi.

**Chiến lược "VO một phần"** cho dòng dài: thu **câu đầu**, các câu sau hiện bằng chữ. Người chơi đã nghe giọng, não tự điền phần còn lại. Cắt ~18% khối lượng thu mà gần như không mất gì.

### 7.3. Casting

| Nhóm giọng | NPC | Ghi chú |
|---|---|---|
| **Nữ lớn tuổi, Nam Bộ** | **Cô Ba** (mentor), **Bà Bảy**, **Bà Sáu** | Cô Ba là vai **quan trọng nhất**. Casting riêng, không gộp |
| Nữ trung niên, Nam Bộ | **Cô Mai** | |
| Nữ trẻ, Nam Bộ | **Chị Lan** | Giọng phải **phẳng, ít biểu cảm** — "người im lặng biến mất" |
| **Nữ trẻ, Bắc** | **Chị Hạnh** | Bắt buộc giọng Bắc thật |
| Nữ thiếu niên | **Bé Su** | Nhanh, cao, nhiều filler word kiểu TikTok |
| Nam lớn tuổi, Nam Bộ | **Thầy Phúc**, **Chú Tư** | Thầy Phúc điềm đạm; chú Tư chân chất |
| Nam trung niên, Nam Bộ | **Ông Hải**, **Chú Kiệt** | Ông Hải phải diễn được **hai người**: trước 10h và sau 10h (idea §19.5). Đây là vai khó nhất |
| Nam trẻ, Nam Bộ | **Anh Dũng**, **Anh Bảo** | Anh Bảo nói lí nhí, đang cắm mặt điện thoại |
| Pool generic | nam trẻ / nữ trẻ / nam lớn / nữ lớn | Ghép vào các diễn viên trên |

**13 vai có tên + 4 pool generic.** Với việc gộp vai hợp lý: **7–8 diễn viên**. Ràng buộc gộp: không để một diễn viên đóng hai NPC **hay xuất hiện cùng lúc ở quầy**.

### 7.4. Chiến lược thu — **bark ngắn trước, mở rộng sau**

| Session | Khi nào | Nội dung | Thời lượng | Ưu tiên |
|---|---|---|---|---|
| **S0 — "Tiếng rao + cô Ba"** | **Trước vertical slice** | **6 câu rao** · 40 dòng cô Ba · toàn bộ `vox_*` phi lời cho 4 nhóm giọng | 3h | **Làm đầu tiên.** File rao là tài sản cảm xúc cao nhất, không để tới cuối |
| **S1 — Vertical slice** | Tuần 6–7 | 3 NPC (đề xuất Bà Bảy / Chú Tư / Anh Bảo): bark tier-1, gọi món, phản ứng 11 sự kiện | 3h × 3 diễn viên | Phải xong trước playtest vòng 1 |
| **S2 — 12 NPC barks** | Sau khi rule DB ổn định (P2 xong) | Bark tier-1/2/3 cho 9 NPC còn lại + pool generic | 3h × 5 diễn viên | |
| **S3 — Arc + mốc quan hệ** | P4 | Arc chú Tư biến mất, chị Lan, ông Hải, chú Kiệt, mốc bà Sáu, kết mùa | 2,5h × 8 diễn viên | |
| **S4 — Pickup** | P5 | Sửa, thêm, dòng phát sinh từ playtest | **Ngân sách 15%** tổng | **Phải có.** Dự án nào không chừa pickup cũng phải trả giá |

**Luật vàng:** **không thu dòng nào mà rule của nó chưa chạy được trong build.** Thu thoại cho hệ thống chưa tồn tại = thu lại lần hai.

### 7.5. Kỹ thuật thu

| Mục | Yêu cầu |
|---|---|
| Định dạng master | **WAV 48 kHz / 24-bit / mono** |
| Phòng | Phòng xử lý âm, hoặc **một phòng nhỏ có nhiều vải + tủ quần áo**. Không thu ngoài trời |
| Micro | Condenser large-diaphragm, pop filter, khoảng cách 15–20cm |
| Sàn nhiễu | ≤ **−60 dBFS** |
| **Không gate lúc thu** | Gate làm mất đuôi hơi thở — thứ làm giọng nghe như người |
| Xử lý | HPF 80 Hz → de-ess nhẹ → EQ tối thiểu → chuẩn hoá **−18 LUFS**, peak **−3 dBTP** |
| **Reverb hẻm** | **Thêm lúc chạy trong engine**, không bake vào file. Một convolution/algo reverb ngắn (RT60 ~0,45s, predelay 12ms), gửi theo `zone` |
| Head/tail | 200ms đầu và cuối mỗi file |
| Ghi hiện trường | `SND` phải ghi lại: mỗi dòng thu **≥ 2 take**, đánh dấu take tốt ngay tại chỗ |
| Đọc kịch bản | Diễn viên phải được cho biết **ngữ cảnh** (khách này vừa thấy bạn làm rớt bánh) — không đưa danh sách câu trần trụi |

### 7.6. Tổ chức file

```
assets/vo/<npcId>/<CONCEPT>__<ruleId>__<variant>.ogg

ví dụ:
assets/vo/ba_bay/EV_DROPPED_FOOD__r0142__01.ogg
assets/vo/ba_bay/EV_DROPPED_FOOD__r0142__02.ogg
assets/vo/co_ba/RAO_LOA__rao01__01.ogg
assets/vo/_generic/nu_tre/BARK_T3__r0009__03.ogg
```

- `<npcId>` dùng đúng tên CANON §9 (snake_case không dấu), khớp P5-02 §2.3.3.
- `<CONCEPT>` viết hoa, khớp `concept: Symbol` của rule DB (CANON §11).
- `<ruleId>` khớp `Rule.id` — **đây là khoá nối VO với rule DB**.
- `<variant>` 2 chữ số, chính là chỉ số trong **shuffle-bag** của `Response.variants`.

**Manifest `assets/vo/vo_manifest.json`:**

```json
{
  "version": 1,
  "entries": [
    {
      "file": "ba_bay/EV_DROPPED_FOOD__r0142__01.ogg",
      "npcId": "ba_bay",
      "ruleId": "r0142",
      "concept": "EV_DROPPED_FOOD",
      "variant": 1,
      "durationMs": 2840,
      "lufs": -18.0,
      "subtitle": {
        "vi": "Ủa con, cái bánh đó rớt xuống đất rồi mà?",
        "en": "Con, that bánh just hit the ground, didn't it?"
      },
      "speaker": { "vi": "Bà Bảy", "en": "Bà Bảy" },
      "mouthShape": "06",
      "caption": null
    }
  ]
}
```

**Ba kiểm tra CI bắt buộc:**
1. Mọi `Rule` có `voiced: true` → có **≥ 1** file khớp `ruleId`. *(thiếu VO)*
2. Mọi file trong `assets/vo/` → có **đúng 1** entry trong manifest **và** có rule tương ứng. *(file mồ côi — dấu hiệu rule bị xoá mà VO còn)*
3. Mọi entry có `subtitle.vi` **và** `subtitle.en` khác rỗng. *(thiếu phụ đề = vi phạm P5-01)*

**Đóng gói:** Ogg Vorbis **q5 (~112 kbps) mono** cho build web; q6 cho build desktop. WAV master **không** vào repo build — lưu ở kho riêng, ghi trong `PROVENANCE.csv`.

**Ước tính dung lượng:** 1.250 file × trung bình 2,6s × 112 kbps ≈ **45 MB**. Chấp nhận được cho cả demo web.

### 7.7. Đồng bộ với mặt (nối P5-02 §2.3.5)

```ts
// Khi phát VO:
faceRig.setMouth(entry.mouthShape ?? '06')
speakLoop.start(speakHz)             // luân phiên mouth_06 <-> mouth hiện tại, 8 Hz
audio.on('complete', () => { speakLoop.stop(); faceRig.restoreMouth() })
// reduceMotion:        speakHz = 4
// reduceMotion.strict: speakLoop không chạy, giữ tĩnh mouth_06
```
**Không lip-sync theo phoneme.** Chi phí không tương xứng, và ở 128px không ai thấy.

### 7.8. Ngân sách lồng tiếng — **chưa có số, không bịa**

> **CANON §18:** *"Không bịa số liệu thị trường mới. Chỉ dùng số đã có trong `idea.md`."*
> `idea.md` **không có** đơn giá lồng tiếng. Số duy nhất về nhân sự sáng tạo trong `idea.md` là **artist VN $1.500–2.500/tháng** (§23) và **capsule $800–1.200** (§23) — cả hai đều **không** áp dụng được cho VO.

**Quy trình lấy số (làm ở tuần 5, trước session S0):**

1. Lấy **3 báo giá** từ: (a) studio lồng tiếng game ở TP.HCM, (b) diễn viên lồng tiếng tự do, (c) cộng đồng lồng tiếng / nhóm làm phim indie VN.
2. Yêu cầu báo giá theo **cả ba mô hình** để so được: **theo giờ studio** · **theo dòng** · **buyout trọn gói theo vai**.
3. Điền vào bảng dưới và **đưa vào doc này** — đây là chỗ số sẽ nằm:

| Hạng mục | Đơn giá | Số lượng | Thành tiền |
|---|---|---|---|
| Diễn viên — vai chính (cô Ba) | *(chờ báo giá)* | 1 vai | |
| Diễn viên — 12 vai có tên | *(chờ báo giá)* | 12 vai | |
| Diễn viên — pool generic | *(chờ báo giá)* | 4 nhóm | |
| Thuê studio / kỹ sư thu | *(chờ báo giá)* | ~28h | |
| Biên tập + xử lý + đặt tên file | *(chờ báo giá)* | ~60h | |
| **Pickup 15%** | | | |
| Đặt hàng đoạn cải lương gốc | *(chờ báo giá)* | 1 | |
| Sáng tác nhạc 10 cue | *(chờ báo giá)* | ~20 phút | |
| **TỔNG ÂM THANH** | | | **(chờ)** |

**Điều khoản hợp đồng bắt buộc — không thương lượng:**
- **Mua đứt (buyout) vĩnh viễn**, toàn cầu, mọi nền tảng, mọi bản dịch, mọi bản cập nhật sau này.
- Bao gồm quyền dùng trong **trailer, quảng cáo, mạng xã hội, bản demo**.
- **Không được dùng bản ghi để huấn luyện mô hình AI** — của bên nào cũng vậy.
- **Dự án không được dùng AI để sinh, nhân bản hoặc mở rộng giọng của diễn viên.** Hết dòng thì thu thêm, không tổng hợp.
- Tên diễn viên đứng **đầu credits** cùng nhóm viết văn hoá (CANON §14.1).

---

## 8. Chống lặp âm thanh

Nguyên tắc từ CANON §11 áp thẳng sang âm thanh: **"nghịch lý lặp" — âm càng đặc thù càng dễ lộ khi lặp.**

### 8.1. Shuffle-bag (tái dùng `dialog/shufflebag.ts`)

**Không dùng random thuần.** Với 8 biến thể, random thuần cho xác suất trùng ~50% sau chỉ **~3,4 lần** (bài toán sinh nhật — idea §18.7). Shuffle-bag biến 8 biến thể thành 8 lần phát chắc chắn không trùng.

```ts
// audio/sfxBag.ts
class SfxBag {
  private bag: number[] = []
  constructor(private n: number, private avoidLastK = 2) {}
  next(): number {
    if (this.bag.length === 0) this.refill()
    return this.bag.pop()!
  }
  private refill() {
    const tail = this.lastDrawn.slice(-this.avoidLastK)
    do { this.bag = shuffle(range(this.n)) }
    while (this.avoidLastK > 0 && tail.includes(this.bag[this.bag.length - 1]))
    // ^ không cho phần tử đầu của túi mới trùng với K phần tử cuối vừa rút
  }
}
```

Áp cho **mọi** `id` có BT ≥ 3. `avoidLastK = 2`.

### 8.2. Biến điệu pitch

| Loại âm | Pitch jitter | Lý do |
|---|---|---|
| Hữu cơ (dao, giòn, than, pate, giấy, bước chân, lá) | **±60 cents** (±3,5%) | Vật thật không bao giờ kêu giống hệt hai lần |
| Cơ khí (kẹp, tủ, lò, cửa cuốn) | **±25 cents** | Kim loại đúng cao độ hơn; jitter nhiều nghe giả |
| UI | **±12 cents** | Gần như không, để giao diện thấy chắc chắn |
| Giọng người (`vox_*`, VO) | **±0** | **Cấm pitch-shift giọng người.** Nghe ra ngay, và nó là bước đầu tiên trên con đường tới "giọng AI" |
| Tiếng rao | **±0** | Cùng lý do |

### 8.3. Biến điệu gain và delay

| Tham số | Giá trị |
|---|---|
| Gain jitter | **±1,5 dB**, phân phối đều |
| Random delay (âm không quan trọng về nhịp) | **0–45ms** |
| Random delay (âm khớp với animation: dao chạm bánh, đồ rớt) | **0ms** — phải khớp frame |
| Pan jitter (ambience) | **±0,08** |
| LPF jitter (ambience xa) | cutoff ±400 Hz |

### 8.4. Giới hạn giọng (voice limiting)

| Luật | Giá trị |
|---|---|
| Tối đa instance **cùng `id`** | **3**, cull cái cũ nhất |
| Tối đa instance toàn game | **24** |
| `minRetriggerMs` mặc định | **45ms** |
| `minRetriggerMs` cho `sfx_kep_gap`, `sfx_dat_thot` | **90ms** (dùng rất dày) |
| `sfx_coi_xe` | **1 lần / 25s** toàn cục |
| `vox_*` mỗi NPC | 1 lần / 4s |
| VO | **1 dòng / NPC.** Dòng mới của cùng NPC → cắt dòng cũ bằng fade 80ms |

### 8.5. Chống "twinning" (CANON §11)

Không bao giờ để hai NPC phát âm **cùng frame**, kể cả khi dùng file khác nhau.

```ts
npcAudioDelayMs = rand(200, 400)     // khớp với poseDelayMs của P5-02 §2.4.3
// Dùng CÙNG một giá trị cho pose và cho audio của một NPC -> mặt, thân và tiếng khớp nhau
```

### 8.6. Loop không lộ mối nối

| Luật | Giá trị |
|---|---|
| Ambience loop | Độ dài **≥ 60s**, crossfade mối nối **1,5s** |
| RR start offset | Mỗi lần vào scene, loop bắt đầu ở một offset ngẫu nhiên |
| Lớp độc lập | Mỗi ambience có 2–4 lớp **loop độ dài khác nhau** (ví dụ 60s / 83s / 97s) → chu kỳ tổng rất dài, tai không bắt được mối |
| One-shot rải lên nền | Chim, chó, còi, cửa cuốn rải ngẫu nhiên lên bed theo Poisson — đây là thứ thật sự giết cảm giác loop |

---

## 9. Tiêu chí đạt

*(mục này thay cho mẫu §6 của CANON §18 do doc này có thêm §7–§8; thứ tự mục còn lại giữ nguyên)*

| # | Tiêu chí | Cách đo | Pass |
|---|---|---|---|
| C1 | Đúng **5 bus**, không có bus thứ 6 | Đọc mã | Pass |
| C2 | Mỗi bus kéo về 0 thì **không rò rỉ** âm nào | Đo RMS từng bus khi 4 bus kia = 0 | 5/5 |
| C3 | Mọi `id` SFX thuộc **đúng 1** bus | Script kiểm bảng đăng ký | 74/74 |
| C4 | Master integrated −18 LUFS ±1, true peak ≤ −1,5 dBTP | Đo 10 phút gameplay | Pass |
| C5 | `disableNegativeAudioCues` tắt đúng 5 mục, **giữ đúng 4 mục** | Checklist §5.5, 9 mục | 9/9 |
| C6 | `crowdSubMix` tách được độc lập khỏi `duongPho` | Thủ công | Pass |
| C7 | Không có sting phi diegetic nào cho perception | Review mã + nghe | **0** |
| C8 | Tiếng rao có mặt trong 20 giây đầu game và 20 giây đầu trailer | Thủ công | Pass |
| C9 | Taper tiếng rao: ngày 1–10 ≈3,2 lần/ngày → ngày 31–40 ≈0,9 | Log 40 ngày bot | Trong ±15% |
| C10 | Mọi `id` có BT ≥ 3 đều dùng shuffle-bag | Script | 100% |
| C11 | **Không có pitch-shift trên giọng người** | Grep + nghe | **0** |
| C12 | Phát 200 lần liên tiếp `sfx_dao_rach`: không lần nào trùng biến thể với 2 lần trước | Test tự động | Pass |
| C13 | 3 NPC phản ứng cùng sự kiện → không cùng frame | Quay 20 lần | 0 lần trùng |
| C14 | Tỉ lệ thời gian có nhạc trong một ngày | Log | **52–65%** |
| C15 | Nhạc dừng đúng ở 8 khoảnh khắc §6.5 | Checklist | 8/8 |
| C16 | **Không có nhạc nào phản hồi theo điểm số / độ tốt của người chơi** | Review mã | **0** luật |
| C17 | Không dùng bản thu cải lương thương mại | `PROVENANCE.csv` | Pass |
| C18 | 100% dòng có VO đều có phụ đề VI **và** EN | CI kiểm manifest | 100% |
| C19 | 0 file VO mồ côi, 0 rule `voiced` thiếu file | CI | 0 / 0 |
| C20 | **Không có giọng AI** ở bất kỳ đâu | `PROVENANCE.csv` + hợp đồng + nghe duyệt | Pass |
| C21 | Giọng miền Nam cho mọi NPC trừ chị Hạnh | Nghe duyệt bởi người miền Nam | Pass |
| C22 | Đại từ xưng hô giữ nguyên trong phụ đề EN | Grep "ma'am", "sir", "auntie", "uncle" trong `subtitle.en` | **0 khớp** |
| C23 | Nghe lỏm ở góc hẻm **nghe ra được nội dung** | 10 người nghe 10 đoạn, chép lại | ≥ 8/10 đúng ý chính |
| C24 | Dung lượng VO đóng gói ≤ 60 MB | Đo build | Pass |
| C25 | Ambience loop: 10 người nghe 5 phút, không ai nhận ra mối nối | Test người | ≥ 8/10 |

---

## 10. Rủi ro & cách bịt

| # | Rủi ro | Hậu quả | Cách bịt |
|---|---|---|---|
| R1 | **Thu âm hiện trường bị hoãn** rồi phải dùng thư viện | Mất đúng cái làm game này khác biệt | **Gộp vào chuyến phỏng vấn tuần 1** (idea §23). Recorder là thiết bị bắt buộc mang theo |
| R2 | **AI voice lọt vào** (kể cả chỉ để làm placeholder rồi quên xoá) | Refund + mất niềm tin + phải khai báo gen-AI | Placeholder VO dùng **giọng thật của chính team đọc**, xấu cũng được. Không bao giờ dùng TTS. `PROVENANCE.csv` + C20 |
| R3 | **Dùng bản thu cải lương thật** vì "chỉ vài giây" | Vi phạm bản quyền rõ ràng, có thể bị gỡ khỏi Steam | Đặt hàng đoạn gốc (§4.2 cảnh báo). Ghi vào PROVENANCE |
| R4 | **Nhạc trượt vào lo-fi** — đây là phản xạ mặc định của mọi nhạc sĩ làm cozy game | Đúng lỗi idea §2.3 ("thẩm mỹ thay cho cơ chế") | Brief §6.2 ghi rõ nhạc cụ; cấm danh sách §6.1; duyệt cue đầu tiên trước khi làm 9 cue còn lại |
| R5 | **Nhạc chạy liên tục** vì "nghe trống quá" | Nuốt mất im lặng — mà im lặng là một phản ứng của hệ thống (CANON §11) | C14 đo được: 52–65%. Nếu ai đó thấy trống → thêm **ambience**, không thêm nhạc |
| R6 | **Sting phán xét bị thêm vào** vì "người chơi không biết mình sai" | Biến âm thanh thành bảng điểm → vi phạm T3 | C7 + C16. Nếu người chơi không biết mình sai thì **mặt NPC chưa đủ rõ** — sửa ở P5-02, không sửa ở đây |
| R7 | **Thu VO cho rule chưa tồn tại** | Thu lại lần hai, tốn gấp đôi | Luật §7.4: không thu dòng nào rule chưa chạy trong build |
| R8 | **Quên chừa ngân sách pickup** | Không sửa được dòng dở sau playtest | 15% cứng trong bảng §7.8 |
| R9 | **Còi xe làm người chơi khó chịu** | Tắt `duongPho` → mất cả ambience | Giới hạn riêng: 1 lần/25s, lowpass 6 kHz, trần −16 dB (§4.2 B) |
| R10 | **Nghe lỏm không nghe ra nội dung** | CANON §12.4: *"Không có nghe lỏm thì bỏ luôn cả nhớ nhầm lẫn đồn thổi"* → mất một hệ thống lớn | C23 là tiêu chí cứng. Nếu fail → tăng gain, giảm lowpass, hoặc cho khách bước gần hơn |
| R11 | **Tắt âm báo tiêu cực làm mất thông tin sự kiện** | Người chơi không biết bánh vừa rớt | §5.5: `sfx_do_roi_dat`, `sfx_khet`, `sfx_ruoi` **không nằm trong danh sách tắt** |
| R12 | **VO đè lên nhau khi nhiều NPC cùng phản ứng** | Không nghe ra gì | Luật `take(1)` của CANON §6 đã giới hạn **1 lỗi được nói ra**; cộng voice limiting §8.4 (1 dòng/NPC) + delay 200–400ms |
| R13 | Ogg q5 làm giọng nghe "nén" | Mất chất giọng thật — thứ ta trả tiền để có | So A/B trước khi chốt; nếu nghe ra thì lên q6 cho VO và giữ q5 cho SFX |
| R14 | **Diễn viên không biết ngữ cảnh** → đọc phẳng | Thu lại | §7.5: đưa ngữ cảnh từng dòng, không đưa danh sách trần trụi |

---

## 11. Truy vết

| Nội dung | `idea.md` | `CANON.md` |
|---|---|---|
| Âm thanh tách 5 kênh + nút "tắt âm báo tiêu cực" | §20.4 | §15.4 |
| Tiếng rao nguyên văn (2 câu), rao qua loa giọng ghi âm sẵn | §19.3 | §14 |
| "Tiếng rao… lặng yên" — chất liệu cảm xúc cho cái kết | §19.3 | §14 (ngầm) |
| Lồng tiếng người thật, không AI voice, giọng miền Nam | §19.5 | §2 |
| Chị Hạnh người Bắc, bị chọc giọng | §19.5 | §9 (#9) |
| Đại từ xưng hô không dịch | §19.5 | §2 |
| Số dòng thoại 520 / 1.200 / 2.980 | §18.7 | §11 |
| Shuffle-bag: 8 biến thể ≈ 25–30 dòng random; random thuần trùng sau ~3,4 lần | §18.7 | §11 |
| Bark 3 tầng, ~35% không nói gì, chống twinning 0,2–0,4s | §18.7 | §11 |
| "Pastel + lo-fi beats không phải là gameplay" | Phần I §2 mục 3 | — |
| `WRONG_NAME` là âm thanh, bỏ qua `gazeFactor` | §17 | §3.1 |
| `DROPPED_FOOD` có tiếng động · `BURNT_OR_COLD` có mùi | §17 | §3.1 |
| 4 state perception, `GLIMPSED`/`NOTICED` | §17 | §5 |
| Nghe lỏm là điều kiện tồn tại của tin đồn | §18.5 | §12 |
| Bà Bảy mê cải lương | §19.5 | §9 (#1) |
| Bà Sáu — mốc "nhà tui gần xe bánh mì cô Ba" | §19.2 | §9 (#11) |
| Mua thiết bị là bể chứa tiền duy nhất đáng tin | §22 | §10 |
| Rủi ro AI nằm ở asset; không dùng gen-AI | §10 | — |
| Credits: người Việt đứng đầu | §19.4 | §14.1 |
| Phỏng vấn 3–5 chủ xe bánh mì tuần 1 | §23 | — |

---

## 12. Đề xuất sửa CANON

| # | Mục CANON | Hiện tại | Đề xuất | Lý do |
|---|---|---|---|---|
| **C1** | **§11** (số dòng thoại) | Bảng 520 / 1.200 / 2.980 dòng | Thêm cột **"dòng có lồng tiếng"**: **~220 / ~520 / ~1.250** (≈42%) | Hiện tại dễ bị đọc thành "phải thu 2.980 dòng" → ngân sách âm thanh sai gấp 2,4 lần. Phân biệt *dòng thoại* và *dòng thu* là một quyết định ngân sách lớn |
| **C2** | **§14** (cơ chế Việt Nam) | Nêu tiếng rao như chất liệu | Thêm: **"Loa rao là một thiết bị mua được (Trục B). Nội dung phát là giọng cô Ba thu sẵn. Số lần rao của người khác giảm dần trong mùa (≈3,2 → ≈0,9 lần/ngày); ngày 40 kết bằng một vòng rao của cô Ba, không nhạc."** | Đây là tài sản ba vai (ambience / thiết bị / cái kết) nối §10 (thiết bị), §5 (`gazeFactor`) và kết game. Cần P4 duyệt phần kết, nhưng nên là hằng số dùng chung |
| **C3** | **§15.4** | *"nút riêng tắt âm báo tiêu cực"* | Làm rõ ranh giới: **"Tắt âm báo tiêu cực bỏ âm PHÁN XÉT (buzz sai, sting buồn), KHÔNG bỏ âm DIEGETIC mang thông tin sự kiện (bánh rớt, bánh cháy, tiếng ruồi)."** | Không có ranh giới này thì người bật công tắc sẽ **mất kênh sự kiện**, mà §3 có 3 sự kiện phụ thuộc âm thanh |
| **C4** | **§5** | 4 state có "biểu hiện hình ảnh bắt buộc" | Thêm cột **biểu hiện ÂM THANH**: `GLIMPSED` → `vox_hm` nhẹ 55% · `NOTICED` → bark tier-1 65% · **không state nào có sting phi diegetic** | Perception hiện chỉ định nghĩa kênh hình. Kênh âm bị bỏ trống → ai đó sẽ thêm sting và làm hỏng T3 |
| **C5** | **§2** | Ngôn ngữ / lồng tiếng | Thêm: **"Mọi hợp đồng art / nhạc / VO phải có điều khoản: không dùng AI sinh nội dung, và không cho phép dùng sản phẩm bàn giao để huấn luyện AI."** | Đang là chính sách trong P5-02 và P5-03; nên nằm ở CANON để mọi hợp đồng dùng chung và để P6 khai báo Steam nhất quán |
