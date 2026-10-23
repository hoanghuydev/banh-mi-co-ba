# Âm thanh — bản dựng thử v0.2

## Trạng thái: TẠM HẾT, KHÔNG PHẢI BẢN CUỐI

Cả nhạc lẫn tiếng động ở đây đều là **asset giữ chỗ**. Chúng tồn tại để vòng lặp
game có không khí trong lúc chờ, và để phần code (`src/audio/`) được thử **với
file thật** chứ không phải với im lặng — một hệ âm thanh chưa bao giờ phát ra
tiếng nào là một hệ chưa biết nó hỏng ở đâu.

Năm bus của `CANON §15.4` giờ đã đủ cả năm:

| Bus | Mặc định | Trần | Nguồn hiện tại | Code |
|---|---|---|---|---|
| Nhạc | 55 | −6 dB | 5 bản CC BY của Kevin MacLeod, nén VBR ~64 kbps bằng `tools/audio/recode-music.py` | `src/audio/music.ts` |
| Tiếng đường phố | 70 | −3 dB | field recording CC0, phần lớn thu tại Việt Nam | `src/audio/sfx.ts` |
| Giọng NPC | 100 | 0 dB | tiếng người phi lời CC0 | `src/audio/sfx.ts` |
| Tiếng thao tác | 85 | −2 dB | foley CC0 | `src/audio/sfx.ts` |
| Âm báo | 80 | −6 dB | UI CC0 | `src/audio/sfx.ts` |

Mỗi bus **một công tắc riêng** ở Cài đặt → Âm thanh, cộng công tắc thứ sáu cho
sub-mix `crowdSubMix` (tiếng người lao xao) — đúng `CANON §15` công tắc số 5.
Không gộp chung, và sẽ không bao giờ gộp: xem lý do ở `src/core/flags.ts`.

---

## Tiếng động — 66 id, 175 file, 5,1 MB

Sinh ra bằng `python3 tools/audio/fetch-sfx.py`. Bảng nguồn là
`tools/audio/sources.py`; thay bằng bản thu thật = sửa bảng đó rồi chạy lại,
**không file gameplay nào phải sửa**.

### Giấy phép: CC0 1.0, toàn bộ, không ngoại lệ

`P5-03 §4.1` cho dùng thư viện "có giấy phép thương mại rõ ràng". Bộ này lấy
**duy nhất CC0** — hiến tặng vào phạm vi công cộng: dùng thương mại được, sửa
được, **không phải ghi công**, không share-alike.

Cố ý loại CC BY cho SFX: một bản nhạc CC BY thì ghi công được (nhạc đang vậy),
chứ 175 file của ~100 tác giả thì bảng ghi công dài hơn phần credits thật, và chỉ
cần sót **một** dòng là vi phạm.

`tools/audio/fetch-sfx.py` **từ chối tải** bất cứ file nào không phải CC0 — nó đọc
lại trang nguồn ở mỗi lần chạy chứ không tin bộ lọc lúc tìm, vì tác giả đổi giấy
phép được bất cứ lúc nào. `tests/p5-audio.test.ts` kiểm lại lần nữa trên
`PROVENANCE.csv`.

Vẫn ghi đủ tác giả + link cho từng file trong `PROVENANCE.csv`, và nhắc chung một
dòng ở trang **Giới thiệu**. Đó là phép lịch sự và là đường lần ngược khi cần
kiểm chứng, không phải nghĩa vụ pháp lý.

### Thứ đáng kể nhất: nền hẻm là bản thu THẬT ở Việt Nam

| File | Nguồn | Dùng ở |
|---|---|---|
| `amb_hem_sang` | giao thông TP.HCM | hẻm, trước và trong giờ cao điểm |
| `amb_hem_trua` | ngoại ô TP.HCM, thưa xe hơn | nắng đứng |
| `amb_hem_chieu` | đường phố TP.HCM, đông hơn | chiều |
| `amb_crowd` | **nhóm phụ nữ Việt nói chuyện** | lớp lao xao, tắt riêng được |
| `amb_cho` | **chợ Bến Thành** | cảnh đi chợ |
| `amb_toi_nha` | đêm ở Cát Tiên | cảnh tối |
| `sfx_xe_may_qua.0` | xe máy chạy qua, thu ở Việt Nam | tiếng lẻ ngoài hẻm |

Đây là chỗ duy nhất trong bộ asset tạm đạt đúng tinh thần `§4.1` ("thu thật, đúng
hẻm"). Tiếng xe máy Sài Gòn không giống tiếng xe máy ở đâu khác, và tai người Việt
nghe ra ngay.

### Xử lý file

`tools/audio/audioproc.py` — GStreamer + `audioop` của Python, **không cần ffmpeg,
không cần numpy** (máy dựng không có, mà nhạc hiện tại cũng đã nén bằng GStreamer).

Mỗi file đi qua: giải mã → cắt đoạn → bỏ im lặng đầu/cuối → nối vòng liền mạch
(ambience) → fade → **bẻ mềm đỉnh** → chuẩn RMS → nén mp3.

Hai khâu đáng nói, vì cả hai đều đã làm hỏng một vòng trước khi được thêm vào:

- **Bỏ im lặng đầu.** Thư viện nào cũng để dư 100–400 ms im ở đầu file. Tiếng dao
  rạch bánh nổ chậm 300 ms so với cú bấm thì não người chơi không nối nó vào hành
  động nữa — nó thành một tiếng động lạ, không phải phản hồi.
- **Bẻ mềm đỉnh.** Trần đỉnh đặt ở **−3,0 dBFS** trên PCM, không phải −1,5 như
  `§2.2` ghi: §2.2 nói về −1,5 dB**TP** của bản *đã nén*, mà MP3 vọt đỉnh lên quá
  mức PCM. Và bẻ mềm chứ không hạ cả file: bản thu lửa than có mấy cú nổ nhọn hơn
  nền cả chục dB, "hạ gain cho tới khi đỉnh vừa trần" kéo luôn nền xuống −36 dB.

Mức RMS theo nhóm, suy từ bảng LUFS `§2.2`: ambience −26, foley −19, UI −24,
giọng −18. Chuẩn hoá **sẵn từ lúc dựng**, không chuẩn hoá lúc chạy.

### Nạp

- **Âm báo** (`amBao`) nạp ngay ở `BootScene` — mọi nút trong game đều kêu, kể cả
  nút đầu tiên ở sảnh, mà sảnh không có `preload` riêng. Cả nhóm ~90 KB.
- **Mẩu một phát** (foley, giọng) nạp ở `StallScene.preload`. Nạp lười thì cú bấm
  đầu tiên rơi vào im lặng — mà đó đúng là cú người chơi còn đang học rằng bấm E
  thì có tiếng.
- **Nền chạy vòng** nạp lười, lúc cần: chúng fade vào trong 2 giây nên vài trăm
  mili-giây chờ tải không ai nghe ra, mà nạp sẵn hết thì vào quán kéo thêm ~2,6 MB.

---

## NPC chỉ lên tiếng ở đúng HAI chỗ

1. **Lúc gọi món** — 2–5 âm tiết ngắn cắt từ giọng người thật. Đúng **một lần mỗi
   lượt ghé**, không phải mỗi dòng thoại.
2. **Lúc bỏ đi vì bực** (`IMPATIENT` / `REFUSED` / `SOILED_FOOD`) — cùng một file
   "hửm" nhưng hạ cao độ xuống 0,78: trầm hơn và dài hơn, thành một tiếng
   "hmmmm" gắt.

Bản đầu làm theo đúng chữ của `§5.2`: 55% số lần chạm `GLIMPSED` thì NPC khẽ "hm".
Nghe thử thì sai hẳn — §5.2 viết cho một người khách, còn giờ cao điểm có bốn người
cùng đứng và `GLIMPSED` bật tắt liên tục theo hướng nhìn, nên thành một dàn
"hm… hm… hm…" chồng lên nhau, không ai biết tiếng nào của ai.

Việc mà §5.2 giao cho tiếng đó — *cho biết có người đang để ý* — **không mất**: nó
nằm ở nét mặt (CANON §5), và cho ai không đọc được nét mặt ở 72px thì ở cái tick gỗ
`a11yPerceptionPing` (§5.4), thứ vốn sinh ra để làm đúng việc này.

Giọng người là thứ đắt: nghe là phải quay sang nhìn. Tiêu nó cho mọi cái liếc mắt
thì tới lúc có người thật sự bỏ đi, không còn gì để nói.

`SILENT_EXIT` cố ý không có tiếng gì: `§6.5 #5` — khách bỏ đi không nói gì thì chỉ
có tiếng bước chân xa dần. Cái im lặng đó là một phản ứng.

### Làm sao để 2–5 âm tiết không nghe ra là lặp

Bản đầu lấy sáu mẩu từ mấy file "ah / oh / hm" na ná nhau rồi bắn ra với cao độ
phẳng và khoảng cách đều. Nghe ra ngay là lặp — và lý do không phải vì ít file.
Thứ tai bắt được là **chất giọng** và **nhịp**, không phải "file thứ mấy". Nên ba
chỗ cùng phải đổi:

| | bản đầu | giờ |
|---|---|---|
| biến thể | 6, phần lớn cùng kiểu nguyên âm | **12, mười hai người khác nhau** — a / o / u / hm / uh, cả nam lẫn nữ |
| cao độ | cố định theo NPC, xê dịch ±8% | cao độ NPC **+ đường ngữ điệu cả câu** (±14%) + xê dịch từng tiếng (±8%) + tiếng cuối xuôi xuống |
| nhịp | lưới đều `i × (70–125 ms)` | khoảng cách **không đều**, 85–170 ms mỗi tiếng |
| số tiếng | theo độ dài câu | theo độ dài câu **có xê dịch** — hai câu dài bằng nhau không ra cùng số tiếng |
| độ to | ngang mức VO (−18 dB) | file ở −26 dB, nhân thêm `TALK_GAIN` 0,62, mỗi tiếng một mức |

Mốc cắt trong file nguồn do máy chọn (`audioproc.loudest_window`), không chỉnh
tay: chỉnh tay thì phải mở từng file ra nghe, và chỉ cần một file có 120 ms im ở
đầu là cửa sổ rơi trúng chỗ im — rồi bước chuẩn hoá kéo đúng chỗ im đó lên mức
giọng, biến tiếng người thành tiếng xì. Đã dính đúng một lần (freesound #88448).

---

## Tiếng phải trùng với ĐỘNG TÁC, không phải với kết quả

Thao tác giữ phím kéo dài 0,6–5 giây. Gắn tiếng vào chỗ "làm xong" thì nó kêu lúc
việc đã xong — nghe sai ngay, vì tai biết tiếng nước chảy phải trùng với lúc nước
đang chảy.

| Việc | Dài | Tiếng |
|---|---|---|
| Rót trà đá | 0,6 s (0,25 với bình trà) | tiếng rót nổ ở **lúc bắt đầu giữ phím**; tiếng đặt ly ở lúc xong |
| Rửa tay | 1,5 s (0,5 với vòi bồn) | **vòng lặp** vòi nước, chạy đúng bằng lượt giữ, tắt theo tay |
| Lau thớt | 2,5–5 s, co theo độ bẩn | **nhiều nhát khăn** rải đều suốt lượt, không phải một nhát ở đầu |
| Ghi sổ nợ | 2 s | lật sổ rồi mấy nét bút rải đều |
| Nướng bánh | lò 3 ngăn, không giữ phím | cửa lò lúc bỏ vào / lấy ra; nền lò than chạy vòng khi còn lửa |

---

## Ghi công — BẮT BUỘC với nhạc, không được bỏ

Cả 5 bản nhạc đều của **Kevin MacLeod (incompetech.com)**, giấy phép
**Creative Commons Attribution 4.0** (<https://creativecommons.org/licenses/by/4.0/>).
CC BY buộc phải nêu tên tác giả **ở nơi người chơi thấy được** — hiện nằm ở trang
**Giới thiệu** trong menu. Gỡ dòng đó ra là vi phạm giấy phép.

| Cue | Bản nhạc | Vì sao chọn |
|---|---|---|
| `menu` | Cattails | guitar mộc + erhu, 77 BPM — có màu đàn dây châu Á mà không thành pastiche |
| `to_mo` | Morning | guitar cổ điển thưa, 60 BPM — đúng "gần như chỉ guitar đơn" của §6.3 |
| `cao_diem` | Ave Marimba | marimba + trống, **không có giai điệu nổi** — §6.3 cấm giai điệu ở giờ cao điểm vì nó đánh nhau với bark |
| `lang` | Windswept | guitar + dàn dây, 79 BPM — chỗ duy nhất §6.3 cho phép giai điệu nở ra |
| `toi` | Avec Soin | piano solo chậm, 64 BPM — màn kết buổi, đếm tiền |

Danh sách máy đọc được: `PROVENANCE.csv` (đúng quy ước `P5-02 §2.8.2`).

Nhạc tải lười theo cue, không tải hết lúc mở game: vào sảnh chỉ kéo về ~2 MB.

---

## Còn thiếu so với P5-03 — và biết là thiếu

### Cố ý để trống

- **Tiếng rao** (`amb_rao_*`). `§3` gọi nó là "tài sản ba vai" và `§4.1` bắt **thu
  thật**. Không có bản CC0 nào là tiếng rao Việt Nam, mà dán tiếng rao nước khác
  vào thì hỏng đúng cái thứ duy nhất không ai copy được. Kéo theo: **loa rao**
  (`§3.2`) chưa có tiếng, và **90 giây cuối ngày 40** (`§3.3`, `§6.5 #7`) chưa có
  thứ đáng ra phải vang lên ở đó.
- **`amb_radio_hangxom`** (cải lương nhà bên). `§4.2` cảnh báo thẳng: bản thu cải
  lương nào cũng có chủ. Trên Freesound có vài bản "nhạc Việt" gắn CC0, nhưng người
  upload chỉ sở hữu **bản ghi**, không sở hữu phần **trình diễn**. Chờ đặt hàng
  bản gốc.
- **Bark / VO có lời.** `§2` đòi lồng tiếng người thật giọng miền Nam. Không nguồn
  nào thay được. Bộ này chỉ có tiếng **phi lời**.

### Chưa đạt, cần làm tiếp

- **Biến thể.** `§4.2` đòi 5–8 biến thể cho mấy âm dùng nhiều; bộ này có 3–6, bù
  bằng rung cao độ ±4–6% và rung độ to ±1,5 dB lúc chạy (`JITTER` trong `sfx.ts`).
  Rung cứu được phần lớn, nhưng không cứu được việc 4 nhát dao vẫn là 4 nhát dao.
- **Lớp ambience.** `§4.2` muốn `amb_hem_sang` có **4 lớp trộn độc lập** (giao
  thông xa / chim / chổi quét / người xa) để đổi theo giờ. Bộ này mỗi khung giờ
  một file liền, không tách lớp được.
- **Doppler và emitter chạy đường.** `§2.4` muốn xe máy chạy pan −0,9 → +0,9 kèm
  Doppler ±4%. Hiện mỗi tiếng xe lấy một bên ngẫu nhiên, pan tĩnh.
- **Ba mức mưa.** `§4.2` muốn `amb_mua_mai_ton` có nhẹ/vừa/nặng crossfade theo
  `rainIntensity`; hiện một mức.
- **`§6.5` còn 5/8 mục chưa cài** — khách mở hàng, `REMEMBERED_USUAL`, minigame đốt
  vía, 90 giây cuối ngày 40, và luật "vào sau sự kiện ít nhất 4 giây" của
  `mus_arc_am`. Mấy mục này cần hệ khách mở hàng và cue nhạc chưa có.
- **`vox_tho_dai` / `vox_chep_mieng` / `vox_cuoi_nhe` / `vox_a_ra` / `vox_hm_glimpsed`**
  đã tải về và nằm trong `public/`, nhưng **chưa nạp và chưa phát** — chúng dành cho
  bark tier-2/tier-3 (`CANON §11`), thứ chưa nối vào âm thanh.
