# Research — Giọng nói theo nhóm người nói (R6)

> Làm theo skill `research-giong-viet`. Phục vụ `docs/revamp/R6-PLAN.md` §4.
> Ngày thu: **2026-10-23**. Bảng giọng từng người: `docs/revamp/R6-GIONG-12-NGUOI.md`.
> Mẫu đã ẩn danh (chỉ chữ, bỏ tên/avatar/tag). Mẫu để rút pattern, **không chép vào game**.
> Bổ sung cho `chu-quan-tre.md` (giọng Phương Anh) và `review-quan-an.md` (giọng review).

---

## 0. Kết luận nhanh

| # | Phát hiện | Bằng chứng |
|---|---|---|
| 1 | **`nghen` `hổng` `biểu` `mần` `đặng` `hổm rày` gần như không ai gõ.** Chỉ `hông` và `thiệt` còn sống, ở mức thấp. | Bảng §2: ≤ 3‰ câu ở cả 3 kho (trừ `thiệt` 5–12‰) |
| 2 | **Từ Nam còn sống mạnh:** `nha` · `nè` · `á` · `luôn` · `vô` · `tui` · `xíu` · `ảnh/bả/cổ`. `luôn` là từ đệm số một (134–167‰). | Bảng §2 |
| 3 | **`dạ` hầu như không xuất hiện** trong comment (0–4‰); `ạ` thì có (27–56‰). Câu NPC đang có: `dạ` 453 lần. | Bảng §2 · `grep` content |
| 4 | **Người trẻ gõ tắt, không teencode kiểu cute:** `ko · k · đc · cj · e · a · ae · cty · tr · v`. Cười bằng `😂` `=))` `kkk`, không `hihi/hehe`. | Corpus §3 |
| 5 | **Nỗi khổ nói bằng con số cụ thể**, không than chung chung: "chạy 13 cây được 40k", "9 tiếng được 500k". | Nhóm A |
| 6 | **Khen/chê bằng thành ngữ ngắn, một vế:** "tham là thâm", "gậy ông đập lưng ông", "cũng là cái nghiệp". | Nhóm E |
| 7 | **Người Bắc ở Sài Gòn kể bằng chi tiết lặt vặt**, xưng `mình`, ngạc nhiên nhẹ: trà đá rót hoài, xe buýt phải vẫy, chưa quen khẩu vị. Không kể bằng cảm xúc to. | Nhóm D |
| 8 | **Người lớn tuổi gõ comment (Facebook cải lương, 24 câu):** xưng `mình`/`tôi`, kể bằng **hoài niệm** (`hồi xưa`, `ngày xưa`, `nhớ`), khen đủ chữ (`rất thích`, `quá luôn`), kết bằng cảm ơn + lời thương (`về với Phật`, `vô thường`). **Cũng không gõ `nghen` `hổng`.** | §3.F |
| 9 | **Bốn nền tảng mới (Threads, Facebook, Maps, TikTok) đều ra 0 cho `nghen` `hổng` `hông` `biểu`.** | §2b |
| 10 | **Threads: `ạ` 176‰, `mình` 297‰, `mn ơi cho em hỏi`.** Người trẻ viết như đang hỏi nhóm, rất lễ phép, nhiều `ạ`, không `dạ`. | §2b |
| 11 | **Threads có chửi thề (`đm`, `vcl`: 55‰).** Giọng thật nhưng vượt `redlines.json` → không dùng. | §2b |
| 12 | **Review Maps theo khuôn: giá + cỡ ổ + hàng đợi + thái độ.** "78k một ổ ú ụ", "ổ bự chà bá", "nguội ngắc", "cười cợt không coi khách ra gì". Chê thì dài, khen thì ngắn. | §3.G |

---

## 1. Nguồn

| Nhóm | Nền tảng | Mẫu | Đạt chỉ tiêu (30 mẫu / 3 nền tảng)? |
|---|---|---|---|
| A. Tài xế công nghệ | TikTok (3 video) · Threads (1 truy vấn) · Facebook (nhóm tài xế, 1 bài) | 33 + 14 + 16 = **63** | ✅ |
| B. Dân văn phòng | TikTok (1 video) · Threads (1 truy vấn: sếp nhắn ngoài giờ) | 15 + 16 = **31** | ⚠️ 2 nền tảng. Bù: `chu-quan-tre.md` §2.D |
| C. Sinh viên / trẻ | Threads (1 truy vấn) · TikTok (2 video) | 27 + 10 = **37** | ⚠️ 2 nền tảng |
| C'. Học sinh cấp 2 | Threads | 7 (toàn người lớn nói *về* học sinh) | ❌ chưa có giọng cấp 2 thật |
| D. Người Bắc ở SG | TikTok (1 video) · Threads (1 truy vấn) | 11 + 10 = **21** | ⚠️ |
| E. Drama / đối thủ | TikTok (1 video) | 17 | ❌. Bù: `chu-quan-tre.md` §2.A |
| F. Người lớn tuổi (55+) | Facebook (nhóm cải lương xưa, 1 bài, 24 câu) | 24 | ⚠️ 1 nền tảng, 1 chủ đề |
| G. Review quán bánh mì | Google Maps (2 quán: 120 + 10 review) · dataset review 12.000 câu | 130 + 12.000 | ✅ |
| Số đo tần suất | ViHSD (3.352 câu) · review quán (12.000) · Threads/Facebook/Maps/TikTok (226 câu) | 15.578 | ✅ |

Ghi chú nền tảng: Google Maps đọc được **không cần đăng nhập** nhưng chỉ ~10 review/lần nếu chọn nhầm khung cuộn; Facebook cần đăng nhập, kết quả tìm kiếm nhiễu quảng cáo, mỗi bài mở bằng hộp thoại, DOM che tên nên chỉ lấy chữ; Threads đọc tốt nhất (nguyên bài viết là giọng người trẻ viết, không chỉ comment).

Video TikTok dùng (xem 2026-10-23): [@thauthiennguyenvlog](https://www.tiktok.com/@thauthiennguyenvlog/video/7655728782065700117) · [@thiephan1998](https://www.tiktok.com/@thiephan1998/video/7681850695162744084) · [@trumgrabhue](https://www.tiktok.com/@trumgrabhue/video/7666710226413849874) · [@sepgiavalutieuyeu](https://www.tiktok.com/@sepgiavalutieuyeu/video/7686506286782926096) · [@be_hien_mukbang](https://www.tiktok.com/@be_hien_mukbang/video/7676426811311541525) · [@giavyne14](https://www.tiktok.com/@giavyne14/video/7420302872971054354) · [@langthang.saigon12](https://www.tiktok.com/@langthang.saigon12/video/7490955665452649746) · [@_nguyenminhvu](https://www.tiktok.com/@_nguyenminhvu/video/7697462854470978836).
Dataset: [ViHSD](https://huggingface.co/datasets/htdung167/ViHSD) · [review quán ăn](https://huggingface.co/datasets/pqthinh232/vietnamese-restaurant-review-sentiment-dataset). Bài: [VnExpress — Rặt giọng miền Tây](https://vnexpress.net/rat-giong-mien-tay-5041991.html) · [VOV — Sài Gòn đa âm sắc](https://vov.vn/doi-song/co-mot-sai-gon-da-am-sac-tu-muon-neo-giong-dia-phuong-post1341183.vov).

---
## 2. Số đo tần suất (số câu có chứa từ, trên 1.000 câu)

Game hiện tại: `nghen` 341 · `hổng` 447 · `dạ` 453 · `bữa nay` 56 · `chớ` 67 lần trong `content/`.
⚠️ TikTok chỉ 82 câu → số chỉ để tham khảo, không kết luận.

| Từ | MXH (ViHSD) | Review quán | TikTok | Kết luận |
|---|---|---|---|---|
| `nghen` | 0 | 0,7 | 0 | **Bỏ.** `nhen` 3,7 ở review, vẫn hiếm |
| `hổng` | 0,6 | 0,8 | 0 | **Bỏ** |
| `hông` | 1,8 | 2,0 | 0 | Hiếm. Chỉ khi giỡn/nũng |
| `chớ` | 0,3 | 1,2 | 12 | Bỏ (số TikTok là `chớ ko` = không) |
| `biểu` `mần` `đặng` | ≤ 2,4 | ≤ 0,8 | 0 | **Bỏ** |
| `bữa nay` `hổm rày` | 0 | 0,8 / 0 | 0 | **Bỏ** → `hôm nay`, `mấy hôm nay` |
| `thiệt` | 5,4 | 7,6 | 12 | Giữ ít: `thiệt hả`, `nói thiệt` |
| `nha` | 27 | 73 | 24 | **Từ đệm chính** |
| `nè` | 15 | 15 | 24 | Giữ |
| `á` | 9 | 20 | 49 | Giữ, cuối câu |
| `luôn` | 28 | 167 | 134 | Từ đệm số một ("ngon luôn", "khỏi luôn") |
| `vô` | 17 | 39 | 37 | Giữ (không `vào`) |
| `xíu` | 0,6 | 30 | 24 | Giữ |
| `tui` | 10 | 0,8 | 49 | Giữ cho người Nam bình dân/lớn tuổi |
| `ảnh` `bả` `cổ` `ổng` | 2–8 | 0,2–34 | 12–24 | Giữ cho ngôi thứ ba (hợp thoại kể chuyện hẻm) |
| `dạ` | 2,4 | 4,2 | 0 | **Chỉ để đáp lại người lớn.** `ạ` thay được |
| `ko` / `k` | 50 / 66 | 2 / 163 | 73 / 122 | Gõ tắt phổ biến, nhưng game là **lời nói** → viết `không` |
| `😂` `=))` | 31 / 41 | 0 | 122 / 12 | Chỉ trong text/review, không trong thoại nói |

### 2b. Số đo bốn nền tảng mới (câu có chứa từ / 1.000 câu; n nhỏ → chỉ tham khảo)

| Từ | Threads (74) | Facebook (41) | Maps (29) | TikTok (82) |
|---|---|---|---|---|
| `nghen` `hổng` `hông` `biểu` | **0** | **0** | **0** | **0** |
| `nha` | 14 | 24 | 0 | 24 |
| `á` | 27 | 24 | 0 | 49 |
| `luôn` | 41 | 73 | 138 | 134 |
| `vô` | 81 | 24 | 34 | 37 |
| `tui` | 41 | 24 | 0 | 49 |
| `dạ` | 14 | 0 | 0 | 0 |
| `ạ` | **176** | 0 | 0 | 37 |
| `mình` | **297** | 24 | 207 | 134 |
| `không` | 297 | 122 | 379 | 49 |
| `ko` / `k` | 68 / 135 | 0 | 172 / 0 | 73 / 61 |
| `mn` / `mọi người` | 54 / 122 | 0 | 0 / 34 | 12 / 0 |
| `=))` | 54 | 0 | 0 | 12 |
| `đm` `vcl` (chửi thề) | 55 | 0 | 0 | 0 |

---

## 3. Pattern theo nhóm

### A. Tài xế công nghệ → Minh Quân

*Thêm từ Threads + Facebook:* `giờ vàng` · `3k/km` · `chạy bike / food` · `xoá nợ bằng Grab` · `nổ cuốc` · `tắt app rồi lại mở` · `chưa trừ xăng` · `hãng` bị gọi `nó` ("nó hút máu âm thầm"). Tính tiền theo **cuốc, km, giờ**: "34 cuốc, 260km, 12 tiếng được 1 triệu".

| Mặt | Pattern |
|---|---|
| Than | **Kèm số**: "chạy 13 cây được 40k", "9 tiếng được 500k", "1km có 2k8" |
| Từ nghề | `cuốc` · `đơn` · `nổ đơn` · `tắt app` · `cây` (= km) · `bèo` · `cực` |
| Gọi nhau | `ae` (anh em) · `anh ơi` · `đồng nghiệp` |
| Giọng | Cam chịu nhưng cà khịa hãng: "Grab bảo: đổ nước vào chạy đi…" |
| Câu | Cụt, 3–8 từ: "Quá bèo." · "Cố gắng thôi anh ơi." |
| Cười | `kkk`, `😂` (chỉ khi gõ) |
| Không có | Tục, chê khách. Thương nhau là chính ("yêu thương bản thân nha ae") |

### B. Dân văn phòng → Ngọc Trâm

*Thêm từ Threads:* `rep tin nhắn` · `off / wfh` · `OT` · `HR` · `ranh giới` · `tắt máy đi về lúc 5h30` · "sếp nhắn zalo um sùm". Giọng tranh luận hai phía (gen Z vs sếp/HR), nhiều câu hỏi mở "mọi người thường làm gì?".

| Mặt | Pattern |
|---|---|
| Đề tài | `sếp` · xin nghỉ · "đủ lý do để nghỉ đi chơi" · nhắn tin ngoài giờ |
| Câu | Cụt, mỉa nhẹ: "Không đánh mà khai." · "Đỡ chiều đi làm nhé." |
| Từ | `cty` · `leader` · `vô tri` · `lộ hết` |
| Nhớ | Chất cựu công sở của Phương Anh là chuyện **của Phương Anh** (`giong-phuong-anh.md` luật 10); Trâm là khách văn phòng thật, nói ngắn, im nhiều (`silent`) |

### C. Học sinh / trẻ → Khả Hân, Gia Bảo

*Thêm từ Threads (sinh viên):* mở bằng **"Mọi người ơi cho em hỏi…"** · `ạ` cuối câu · `tiền trọ` · `mì gói` · `xin 1k` · `hết tiền ăn dòi` · `ngại xin bố mẹ` · tự giễu `🥲` `=)))`. Kể số tiền cụ thể ("2 triệu 650k sống tới 28/7"). **Chưa có giọng cấp 2 thật.**

| Mặt | Pattern |
|---|---|
| Hỏi | "Bạn ăn hết không ạ?" · "Lỡ chọn số 50 thì tính sao vậy chị?" |
| Than ngán | "2 cái là ngán tận cổ luôn á" — **phóng đại + `luôn á`** |
| Gọi | `chị` `cj` `e` — người trẻ gọi chủ quán trẻ là `chị` |
| Giọng thật của cấp 2 | ❌ chưa thu được. Dùng `giong-phuong-anh.md` §2 (câu gọi Su) + giọng Bảo đã duyệt (`thoai-anh-bao-truoc-sau.md`) |

### D. Người Bắc ở Sài Gòn → Thu Hà

*Thêm từ Threads:* người Bắc tự viết "**tui** là người Bắc lần đầu **vô** Sài Gòn" (có người bắt chước `tui` `vô`) · hỏi "nói giọng Nam có bị ghét không?" · chuyện **chữ `ạ`** nhạy cảm · gọi `ngoài Bắc / trong Nam`. → Thu Hà giữ giọng Bắc, và **biết** mình bị để ý giọng.

| Mặt | Pattern |
|---|---|
| Xưng | `mình` |
| Kể | Chi tiết lặt vặt: "rót trà đá hoài, tưởng mỗi lần rót thêm là 3k hay 5k" · "xe buýt phải vẫy" · "chưa quen khẩu vị" |
| Cảm xúc | Bất ngờ nhẹ, tự ngượng: "Văn minh quá nên sốc" · 🥺 |
| Bị chọc | "ai cũng kêu tui kén ăn" |
| Giữ | `vào` `mẹ` `bố` `nhé` `thế` `đấy` là **đặc điểm nhân vật** (miễn L008). Không trộn `rứa/ri` — đó là giọng Trung |

### E. Drama / đối thủ → Chú Đạt (người xung quanh nói về ông)

| Mặt | Pattern |
|---|---|
| Khuôn bình luận | **Một vế thành ngữ**: "tham là thâm" · "gậy ông đập lưng ông" · "cũng là cái nghiệp" · "tự đập bỏ chén cơm của mình" |
| Hả hê | "vừa lòng t nha" · "mất luôn xe bánh mì" |
| Phản biện | "bán cùng nhau, mỗi người một chỗ, có ảnh hưởng gì đâu" — hỏi ngược |
| Cho Đạt | Câu **chua, ngắn, hơi tự ái**; xưng `tao/mày` giữ theo `_note` hiện có; không thành ngữ dài |

### F. Người lớn tuổi gõ comment → Dì Nguyệt, Chú Quang, Chú Thịnh, Cô Thuý, Thầy Khải, Dì Liên

Nguồn: bình luận nhóm cải lương xưa (Facebook). **Chỉ một chủ đề (hoài niệm)**, chưa cho thấy giọng khi bực, vội, hỏi giá.

| Mặt | Pattern |
|---|---|
| Xưng | `mình` · `tôi` · `tui` (ít). Gọi người khác `chú` `cô` + tên |
| Mở câu | `Hồi xưa…` · `Ngày xưa…` · `Nhớ…` · `Hồi còn nhỏ 9–10 tuổi…` |
| Khen | `rất thích` · `mê` · `quá luôn` · `đẹp quá` · `hát ngọt` · `phúc hậu` |
| Kết | Cảm ơn người đăng + lời thương: `đã về với Phật` · `đời người ngắn ngủi, vô thường` · `già rồi ai cũng vậy` |
| Gõ | `kg` `ko` (một ít), nhiều dấu `..` `...`, viết hoa cả câu khi xúc động, ít emoji |
| Vùng miền | Có `nầy` `củng` `dị` (= vậy) ở vài người; **không** `nghen` `hổng` `biểu` |
| Giữ cho NPC | Câu kể có **mốc thời gian + chi tiết cụ thể** ("hồi 9–10 tuổi", "đoàn Tuấn Kiệt") — hợp Dì Nguyệt, Chú Thịnh, Thầy Khải |

### G. Review quán bánh mì trên Maps → khách lạ, khách giận, review sao

| Mặt | Pattern |
|---|---|
| Khuôn | **Giá + cỡ ổ + hàng đợi + thái độ**: "78k một ổ ú ụ thịt ba tê, 2 người ăn hết 1 ổ" |
| Khen | Ngắn, cụ thể: `vỏ giòn` · `gà xé không khô` · `béo` · `vừa đủ không ngán` · `20k/ổ` |
| Chê | Dài, kể lỗi: `nguội ngắc` · `mềm nhão` · `dặn một đằng làm một nẻo` · `cười cợt không coi khách ra gì` · `thua cả bánh mì lề đường 20k` |
| Chê giá | So với **thứ rẻ hơn**: "tệ hơn ổ lề đường 10k" |
| Cỡ ổ | `to khổng lồ` · `bự chà bá` · `ngán` · `ăn có 1/3 ổ` |
| Giận | Viết HOA vài chữ (GIÁ ĐẮT, TỆ) · `xin thưa` · "ai chưa ăn thì đừng ăn" |
| Chủ quán trả lời (chuỗi lớn) | Khuôn công ty: "thành thật xin lỗi quý khách… cho xin mã hoá đơn". **Không dùng cho Phương Anh** (xem `giong-phuong-anh.md`) |

---

## 4. Bảng từ

### 4.1. Cấm
`nghen` `nhen` `hen` `hổng` `chớ`(= chứ) `biểu` `mần` `đặng` `hổm rày` `bữa nay` `thiệt tình` `mạnh giỏi` `chi`(= gì) `cha!`. Thêm: `dạ` mở đầu câu liên tục ("Dạ. Dạ…"); `ko khum hok j dzậy` trong lời nói.

Chửi thề (`đm` `vcl` `đcm` `vl`) có trong Threads nhưng **không dùng** (`redlines.json`, `lr4-blocklist.txt`).

### 4.2. Đổi

| Cũ | Mới |
|---|---|
| nghen · nhen | nha |
| hổng | không (giỡn: hông) |
| chớ | chứ |
| bữa nay | hôm nay |
| biểu | kêu · nói |
| mần | làm |
| đặng | để |
| đi mạnh giỏi | về cẩn thận nha |
| ăn nói chi kỳ | nói vậy kỳ ghê |
| cha! | trời! · ủa! |

### 4.3. Giữ (còn sống)
`nha · nè · á · luôn · ghê · vô · coi · mắc · xíu · giùm · liền · xỉu · quá trời · xạo · ráng · tui · ảnh · bả · cổ · ổng · thiệt hả`

### 4.4. Không nhét
Trend ("6-7", "slay", "xu cà na"…), teencode (`khum`, `hok`, `iu`), tiếng Anh ≥ 2 chữ/câu, tiếng Anh với người trên 60.

---

## 5. Chỗ thiếu

| Thiếu | Lý do | Cách bù |
|---|---|---|
| Người 55+ **khi bực, vội, hỏi giá, nói chuyện đời thường** | Mẫu duy nhất là comment hoài niệm (cải lương). Hai lần tìm chủ đề đời thường trên Facebook ra bài ít bình luận / không kết quả | Giữ cấu trúc câu hiện có, chỉ thay từ cổ. Bạn duyệt 20–30 câu mẫu mỗi người |
| Học sinh cấp 2 thật | Threads/TikTok chỉ có người lớn nói về học sinh, hoặc mukbang. Chủ đề tình cảm học đường có nội dung nhạy cảm, **không thu** | Dùng giọng nhóm trẻ + `giong-phuong-anh.md` §2 |
| Drama / đối thủ (E) | 1 video | Thêm khi có bài phốt quán trên Facebook có nhiều bình luận |
| Chủ quán **nhỏ** trả lời khách (Maps) | Quán nhỏ thu được không có phản hồi chủ; chuỗi lớn trả lời khuôn công ty | `chu-quan-tre.md` §2.A |
| Kỹ thuật | Facebook: cuộn hộp thoại chỉ nạp ~20–50 bình luận; Maps: chọn nhầm khung cuộn chỉ nạp 10 review | Ghi trong skill §2b |

## 6. Việc kế tiếp

1. Bạn duyệt bảng §4 và `R6-GIONG-12-NGUOI.md`.
2. (Tuỳ bạn) Đăng nhập Chrome → mình thu thêm TikTok/Facebook cho nhóm B, C, người lớn tuổi.
3. Viết thử **10 câu mỗi người** → bạn duyệt → viết hàng loạt (R6-PLAN §5).

---

## Phụ lục — mẫu đã ẩn danh

**A. Tài xế công nghệ (Minh Quân)** — 32 câu

- Grab có dịch vụ chở động vật nữa hả mọi ng?
- Xoá clip giúp mình được k ạ
- vậy thì đừng chở ,
- 🤣 có phải xe nó đâu mà nó lo
- bã nói gì vậy mn
- luật bây giờ cái nón 1tr không còn 5xi
- cái kiểu y như ae xe khách tui nè . khách ko chịu thắt dây an toàn mà phạt tài xế .
- phạt ngay người lỗi cho nó chừa
- Nó bảo: “Khoải lo… xe đâu phải của tao đâu”
- Bà chị bã không biết lun mà bã còn bảo trời ơi nãy giờ chưa đội nón luôn😂😂
- Mình hôm trước cũng chạy được 10m quay lại thấy k đổi mũ, mình đòi hủy cuốc luôn
- sao lúc trẻ ko chuẩn bị cho tuổi già
- đồng lòng tắt app cả nhà ơi. a
- Chạy khát khô cổ cũng k dám mua nước uống luôn tiếc tiền thiệt sự🥺
- nể grap.. bỏ nghề ae ơi😂😂
- Gì tr 800m 15k rồi á
- cố gắng thôi a ơi
- Chạy 6km giao food thu nhập đc 24k quá bèo 🥺
- má đang sáng sớm 4 đơn long châu về ngủ luôn má chán quá vào cty lại ae ơi
- Grab bảo: "đổ nước vào chạy đi, kêu mua xe điện không mua" 😂😂😂
- có sức khỏe mới làm được việc khác. Yêu thương bản thân mình nha các anh chị em tài xế ơi
- Qua chạy 9 tiếng đc 500k nay nghỉ luôn
- Đồng nghiệp ở đâu ghé mình làm ly cafe cho vui
- tắt tiet kiem mà chạy chứ 1km có 2k8 quá bèo
- E chạy 13 cây được 40k tới chỗ khách vô luôn quên trả tiền e luôn kkkkk
- Quá bèo
- nghề chạy xe rất là cực luôn á, nếu tầm 5,6 năm trước còn ngon h k đủ đổ xăng😂
- Ý nghĩa quá
- Anh hay đứng chỗ nào để nổ đơn anh he
- tuyệt vời chúc em nhiều sức khỏe nhé
- em cũng ở huế mà k gặp a bao giờ 😭
- grap chi mà giàu tởn

**B. Dân văn phòng (Ngọc Trâm)** — 14 câu

- xíu nữa mà 2ng gặp sếp....thì sao ta🤣🤣🤣
- Sếp t:)))
- Ước gì đi làm sếp mình cũng giống sếp ngta nhỉ, nc vui vậy mà
- 2 bạn đã hợp tác thành công 😂😂😂
- có vẻ CTY mình vẫn dễ chán.nt phát là được nghỉ
- liên minh với leader là quả bom nổ chậm
- Không đánh mà khai
- Đỡ chiều đi làm nhé 😁😁
- vô tri gheee
- Mình xin nghỉ vì sốt bả bảo là người có vấn đề à em sốt nghỉ nhiều vậy
- lười ko muốn lm diện đủ lý do để nghĩ đi chơi 😂
- 🤣 lộ hết
- đối mùa nên cúm cả nhà tranh thủ xin nghỉ 😂
- rủ nhậu luôn

**C. Học sinh / trẻ, mukbang bánh mì (Khả Hân, Gia Bảo)** — 10 câu

- rì viu chi tiết quá🤣
- này mình hỏi thật, bạn ăn hết ko ạ?
- Bà mà nói thích số 50 thì 🥰
- Mua vậy chớ ăn hết đâu?
- em ăn đến 11 ổ lận nè cj
- Lỡ chọn số 50 thì mình tính như nào vậy chị😂
- 2 cái là ngán tận cổ luôn á
- Thấy 3 tê là sợ..gặp trúng chổ ăn đau bụng
- rồi chị kia bảo 50 thì sao tr=)
- lấy e ổ bánh mì 50k=))

**D. Người Bắc vào Sài Gòn (Thu Hà)** — 10 câu

- Ở mẹ ngoài đó đi , vô đây chi
- ai ở sg cho e lời khuyên với ạ
- chiếm lòng lề đường thì nhiều
- vào quán nước ngồi lâu xíu thấy rót trà đá hoài , hồi đầu tui cứ tưởng mỗi lần rót thêm là 3k or 5k á
- mình vào nam được nửa năm rồi, nhưng vẫn chưa quen được khẩu vị món ăn trong này, mà ai cũng kêu tui kén ăn 🥺🥺🥺
- Xe bus ko tự dừng khi đến điểm, mà phải vẫy
- Văn minh qa nên sốc😂
- ê sao t thấy bth mà sao mng phân biệt vùng miền vậy
- 3 năm nay Sài Gòn ko có giựt đồ hay cướp nữa 😅
- Người SG h để nhà trên đây cho mướn về miền tây ở hết dồi !!

**E. Drama xe bánh mì / gánh hàng (Chú Đạt)** — 16 câu

- vỗ tay cho chị áo xanh🥰🥰
- Rồi mất xe bánh mì đóng phạt rồi ai mua bánh mì nó nữa 😆😆😆😆
- ủa.mà bán rau liên quan éo gì xe bánh mì của nó mà nó nói ng ta vậy
- Rồi chắc sẽ ế bánh mỳ rồi
- Bán cùng nhau bán mỗi ng 1 chỗ mà có ảnh hưởng j đâu nhỉ
- tự mình đập bỏ chén cơm của mình
- im lặng bao năm kg ai biết, lu loa láo nháo mất mẹ cái xe 😁😁
- mất xe bánh mì luôn ..
- vừa lòng t nha 😂😂😂
- Cũng là cái Nghiệp
- tham là thâm
- Nước đi quá khôn của cô gái
- chị gái quá hiệp nghĩa
- gậy bà đập lưng bà. kkkkkkkk
- Ngựa ngựa mất luôn xe bánh mì
- anh em tui lớn lên bằng gánh hàng rau của mẹ, sáng 4h sáng đã phải ra đồng hái rau, ngày xưa 500đ, 1000đ 1 mớ rau

**C. Sinh viên (Threads)** — 26 câu

- Hi mọi người, mình nhận luôn là mình nghèo và k có tiền ạ. Hiện mình là sinh viên năm 3, ngoài sinh hoạt phí bố mẹ gửi cho, mình có làm thêm nv cafe, Mỗi tháng mình thường dư ra đâu đấy 3-500k để tiết kiệm.
- Sinh viên tiêu 1 tháng hết từng này, không đi làm thêm có ổn ko nhỉ mn
- Mọi người ơi cho em hỏi thường thì mọi người ở 1 tháng hết bn khối nước vậy ạ. Tháng này có mình em ở mà hết tận 9 khối🙂 thì có ảo quá không ạ
- Mới ra trường được 1 tháng, tiết kiệm được 10 triệu từ hồi sinh viên tới giờ mà em chưa biết nên đầu tư gì với số tiền này cho an toàn
- Trung bình mỗi tháng sinh viên nếu không tính tiền thuê nhà ra thì sẽ tiêu hết bn vào những khoản cố định nào vậy mn.
- Cho mik xin mỗi người 1k để ăn mì gói ạ Sinh viên cuối tháng hết tiền ăn dòi🥲🥲
- Bỏ hơn 3tr/tháng thuê trọ xong chủ trọ bảo 😃
- Mọi người ơi, em đang phân vân có nên mua dấu mộc thực tập không ạ 🥹 Chứ bỏ 8 triệu cho trường chỉ để đi thực tập không lương thì em xót tiền bố mẹ quá.
- Ê t tự hỏi các sinh viên khác 1 tháng kiếm ra bn tiền vậy ạ. T sv năm nhất, 1 tháng làm đc có hơn 1tr thì là có ổn k ạ
- Đm tính ra tháng này t chỉ ở có 3 tuần mà tiền điện hết 189k???? Đắt vcl ấy, bắt đầu nghi ngờ có ai đó vụng trộm xài điện
- Với mức lương 7-9 triệu/1thang cho sinh viên vừa ra trường, mới có kinh nghiệm 6 tháng thì có phải là ít không mọi người :(
- Sao mấy bạn sinh viên có thể tiêu 3tr trong 1th vậy, các bạn có thấy thiếu k hay như vậy là đủ ăn rồi á?
- Ví dụ giờ e làm thủ quỹ của lớp, e thu của mng tiền mặt xong e bỏ vô quỹ, xong giờ nó sinh lời vậy tiền lời thì e dc hưởng đúng hong dạ mng =)))))?
- Sinh viên đang thiếu tiền, nhận tất cả các công việc, kể cả bốc mộ, vớt x*c
- Mấy bạn sinh năm 2000 thế nào rồi ạ🥹 Mình đi làm hơn 3 năm tích luỹ được thế này. Có lời khuyên nào để mình gấp đôi số tiền này đến cuối năm không ta 😅
- 2k4 mới ra trường lương 15tr/th là thấp hả mng:(( Hôm nay ba e gọi hỏi e làm lương tháng được bao nhiêu. Ba e nghe xong rồi cười rồ lên
- Sinh viên đi first date mình đồng ý share bill có kì quá không ạ=((
- Hôm nay vừa nhận lương xong. Sau một vòng thanh toán tiền nhà, tiền nợ, tiền "trên trời rơi xuống"… thì trong tài khoản còn đúng 2 triệu 6 5 chục để sống đến 28/7
- Cống hiến hết mình cho mức lương 20k/h 🥰🥰
- Đm có ai như t chưa. Có 1 đợt t thiếu tiền kinh khủng, cũng ngại xin bố mẹ, đang là sinh viên nên cũng chưa có công việc ổn định gì
- Sinh viên bây giờ nếu chỉ tiêu cơ bản thì 3 triệu/tháng có đủ không?
- "Mới nhập học ở Sài Gòn, làm sao sống sót với 500k/tháng?" 😓 Mình là sinh viên mới vào Sài Gòn, gia đình chỉ cho 2 triệu/tháng, mà tiền trọ đã hết 1.5 triệu
- Mn ơi cho e hỏi cái phí này là ntn vậy ạ😓 e ms là svien mà mỗi tháng nó trừ như v chắc hết tiền ăn sáng qá😔
- Mọi người nghĩ sao về tình yêu sinh viên ngày nào cũng gặp nhau, chở nhau đi học đi ăn nhưng chỉ 1 người chi tiền. Tuy 1 bx 80-100k thôi nhưng cả tháng cũng cũng ạ
- Tsv ở 1 mình ơi, 1 tháng tụi m bao nhiêu tiền điện
- Top 1 job nuôi sống tôi thời sinh viên

**A. Tài xế (Threads)** — 14 câu

- 1 ngày CHẠY GRAB kiếm được bao nhiêu tiền Thu nhập 12 giờ : 1.051.000 Tiền xăng 🤣 34 cuốc xe ! Hôm nay ngày chạy hơn 260km
- T không thể tin nổi 1tuần t kiếm được hơn 9tr bằng việc chạy Grab ( chỉ tính tiền app) chưa kể tiền chở khách ngoài app
- mình chuyên chạy grab đêm, từ 18h tối đến 6h sáng hôm sau hôm nay app phát cho mình 1 cuốc, 8km, 24k -> 3k/km mình chỉ biết á đù 1 cái thật to
- Ngày 2/7 ngày hoàn thành 180 cuốc Hôm nay được đăng kí giờ vàng nên chạy được 30 cuốc lận. Ae grab nay chạy ổn hong, chứ nay giờ vàng mà tấp dô ăn tô hủ tiếu 30p
- Mấy tài xế grab không chạy bike tiết kiệm nữa hả? Mình đặt không có ai nhận
- Nay mình chạy Grab Bike 9 tiếng, mới đc có 350K chưa trừ xăng. Dạo này, toàn cuốc 9-10k nhiều lắm, cặm cụi đi nhặt nhạnh từng đồng. Thôi, cố găng động viên bản thân, có ngày này ngày kia
- BÀI NÀY TAO KHÔNG CÓ KHUYÊN AI ĐI CHẠY GRAB NHA , TAO ĐANG XOÁ NỢ BẰNG GRAB NÊN
- chạy grab 3 th mà người đầu tiên mình chở mình vẫn nhớ, hôm nay người ấy lại đặt lần nx. nổ cuốc cho mình tiếp . sau 3th người ta đã quên mình rồi
- Hôm nay CHẠY GRAB thất bại rồi Sáng sớm đi Hóc Môn rồi về Tây Ninh. mới kiếm thu nhập thực tế app Grab 878.000 - tiền ngoài 80.000 Hôm nay mưa hên sao x giá được vài đơn bù
- Q : Nên để bao nhiêu tiền trong ví Grab ? A : Tổng 2 ví dưới 1m , vì để trên 1m nếu xui dính đơn tiền
- Nay 01/12/25 mình chạy 11 tiếng full đc 466k GrabFood chưa trừ tiền xăng.
- Nhận cuốc grab car 5 điểm mình cũng nể mình thiệc
- Chuyện là sáng nay t có bắt Grab để đi tới nhà bạn t chơi. Thế nào điện thoại chú Grab lại hết pin nên lộ trình cứ mãi không di chuyển =)))))
- Tiền app 460k + 20k tip + 400 k cuốc ngoài + 40k thưởng - 200k xăng với ăn. Nay chạy đều , app nổ liên tục k kịp nghỉ trưa , chắc app bù mấy hôm mưa

**B. Văn phòng (Threads)** — 16 câu

- lời khuyên cho genz hướng nội khi đi làm. phải biết nói chuyện với sếp
- Mình khá thắc mắc việc sếp bắt nhân viên phải trả lời tin nhắn ngay lập tức kể cả khi k trong giờ làm? Nma khi nvien nhắn hỏi thì có thể vài ngày mới đc rep
- SẾP BẢO "LET'S TAKE THIS OFFLINE", TAO LIỀN BẤM KẾT THÚC CUỘC HỌP CHO CẢ TEAM… ĐM, CHƯA BAO GIỜ TAO MUỐN BIẾN MẤT KHỎI CÔNG TY ĐẾN VẬY =))))
- Một dấu hiệu nhận biết leader/sếp yếu kém chính là lúc nào bạn cũng sẽ thấy họ bận rộn, tất bật chạy ngược xuôi, thường OT tới tối nhưng vẫn k làm được cgi có hiệu quả 🤡
- Thế mà nhiều bạn hay chê bai "bán mình cho tư bản". Mình làm cty Pháp-Hàn, 8h-17h, đúng giờ xách đít về ko ai nói gì. Về nhà thì zalo báo tin nhắn um sùm
- Có bạn nào liên tục bị sếp giao việc và hỏi (hối) việc ngoài giờ hành chính không? Trong trường hợp như thế các bạn thường sẽ làm gì?
- Công ty mình có một bạn nhân viên cứ đúng 5h30 là tắt máy đi về, không tăng ca, hết giờ cũng gần như không trả lời tin nhắn.
- Ôi bạn ơi không nhé. Trên đời này có thứ gọi là giới hạn/ranh giới đấy. Trong công việc thì mình chỉ có nghĩa vụ với công ty khi trong giờ làm thôi ạ.
- Ý là rep tin nhắn sếp cũng khó khăn đến vậy sao? Bạn kia thấy tin nhắn nhưng mà k rep luôn ấy.
- Mấy ní văn phòng thường đi làm thêm gì ngoài giờ hành chính vậy ?
- Nay mắc kể chuyện nên em có vài dòng tâm sự muốn nhờ mọi người tư vấn. Chuyện là hôm nay em mới bị sếp em lập biên bản lý do thái độ kém vì 2 ngày liên tục lãnh đạo nhắn tin không trả lời.
- Bị sếp nhắn tin công việc ngoài giờ hành chính❌ Nhắn tin công việc ngoài giờ hành chính sếp ko thèm rep✅ Máaaaa tôi đang rất vộiiiiiiiiiiiiii
- Mình là HR. Không biết vì lý do gì nhưng mình thấy thái độ tìm việc của các bạn trẻ bây giờ lạ quá
- Nói thẳng luôn, hành động nhắn tin ngoài giờ làm việc (mà k phải chuyện gấp gì) là bất lịch sự và tự thể hiện bản thân bị thiếu chuyên nghiệp
- Ỏooo làm HR xong mới hiểu zụ này🤣🤣
- T vừa bị sếp mắng vì đi làm thêm ngoài công việc trên công ty ạ. Thời gian đi làm của t là 8h - 17h30.

**D. Người Bắc (Threads)** — 11 câu

- Các bác ơi, tui là người Bắc lần đầu tiên vô Sài Gòn. Tui vào với tâm thế đi trải nghiệm văn hoá, tham quan mấy chỗ nổi tiếng với khám phá đồ ăn trong đó.
- fun fact : người sài gòn không bao giờ gọi sài gòn là tphcm=)))
- Cuộc sống trong Sài Gòn như thế nào vậy mọi người?? Mình ở ngoài bắc, mình tính ăn tết xong sẽ chuyển hẳn vào SG sống.
- Nếu tớ người bắc nhưng thích nói giọng nam với người nam thì có bị ghét không?
- Bây ơi bây. Chuyện là tao mới ăn xong và tao phải đăng cái này ngay lập tức. Tao người Bắc và đây là lần đầu tao vô đây, không thể nói được gì khi ăn món này
- Ra chơi 1 time đã rồi hãy quyết định bạn ơi. Môi trường ngoài này khác xa trong Sài Gòn. Tui người Bắc Ninh còn muốn vô Sài Gòn sống. Trong đó ra ngoài này làm chi cho cực vậy
- Bờ kè Sài Gòn vô mua lá vàng rồi mọi người ơi. Tranh thủ đi check in liền thôi…
- Em mới vô sài gòn có ai tốt bụng chạy qua dẫn e đi khai sáng sài gòn hong hụ hụ
- Tui thắc mắc tại sao người miền Nam lại nhạy cảm với chữ "ạ" vậy, xài chữ ạ thì không phải người miền Nam hả
- Người miền Nam có đúng là không thích giọng Bắc không ạ. Chứ tính vào sài gòn học mà nghe hoang mang quáa😭😭
- Thấy người miền bắc với người miền nam y chang. Hay tự cao, thượng đẳng hà nội gốc, sài gòn gốc.

**C'. Học sinh cấp 2 (Threads, người lớn nói về học sinh)** — 7 câu

- topic: mn thấy mấy đứa con nít bây giờ mất dạy vl k 😭
- Bất lực trong quản lý lớp học! Mình dạy thêm cấp 2. Cảm giác mình bị HS nhờn, ko có uy trong mắt tụi nhỏ
- Dạy cấp 2: Học sinh chạy ra chạy vào xin đổi chỗ xin đi WC tùm lum, lớp thì ồn như cái chợ
- Topic: Những trải nghiệm "tệ nhất" bạn phải trải qua khi học cấp 2. Mình trước: Bị bạn thân cũ kể hết bí mật cho tụi mình k ưa
- Hồi xưa cái thằng đầu sỏ nhất chào cô to nhất mà giờ học sinh dữ dằn quá
- mấy giáo viên ở VN bỏ hình phạt là chép phạt đc ko? con mik năm nay lớp 9 bữa thấy làm bài đến 1h sáng hỏi ra mới bt con mik bị chép phạt
- Xin chào mọi người , em là Dũng 2k12 Em nghĩ mình n

**A. Tài xế (Facebook)** — 16 câu

- Chưa kể rước khách toàn trên 1km đổ lên không, có khi trên 2km nữa :))
- Mấy ông lớn lụm chứ có gì đâu phải suy nghĩ
- Gửi ảnh này cho bộ chưa bạn ơi
- Chả biết nó tính nào khi nhận về cứ thấy 50/50
- Nó hút máu âm thầm mà
- Nó đang bóc lột sức lao động của người dân Việt Nam theo một cách tinh vi hơn
- Anh em hãy thu thập thật nhiều bằng chứng khi cần có cái mà nói
- Vẫn như cũ
- Gửi ae nha…..
- Muốn thu gì thì thu, nhưng hãy show tất cả giá và phí công khai. Như đơn food nó ăn trên bàn thờ tụi food xong nó dấu cước phí đã thu của khách rồi bố thí lại cho tụi tài food vài đồng
- Sợ mấy thằng không có kiến thức đăng bài ghê. :)) Muốn hạ nó cũng phải coi cái giá đó cho khách hay tài xế?
- sao ae lạ nhỉ t chạy food vs exp toàn ~5k/km th mà ngày chạy chill chill 3-4 tiếng th
- Grap nó cuốn gói đi nơi khác giùm
- 4k3 là của khách là chưa trừ phí ông ơi
- Nó gian lận
- Nói chung là đc vài ngày tắt áp rồi lại mở . Chả có khả quang . Nhìu ông tài xế đứng ra kêu gọi . Auto vài hôm nữa khoá áp 100% . Lại cực qua hãng khác

**F. Người lớn tuổi (Facebook cải lương)** — 25 câu

- Nghệ sĩ Út Hiền thì tui nhận ra ngay còn Chị Kim Ngọc thì khác quá , bởi vì nhập tâm hình ảnh phát tướng và tài năng tấu hài của chị sau nầy nên nhìn hình chị hồi trẻ còn đóng vai đào thương
- Hai cố nghệ sỹ này một thì đẹp trai ca hay còn cô Ngọc Giàu lúc trẻ cũng đẹp gái lắm giờ cả hai đã đi về thế giới bên kia nếu có kiếp sau vẫn mong có cải lương
- Ns ngày xưa ăn mặc rất lịch sự , kg có lấp lánh hột xoàn
- Hình đẹp quá ? Rất nhớ Nghệ Sĩ Út Hiền : Giọng hát nhẹ nhàng rất hiền . Cám ơn Cải Lương Xưa nhiều lắm
- Nhớ ngày xưa cô Kim Ngọc còn ở đoàn TUẤN KIỆT diễn hài cô cười muốn chết vậy á, cô ấy diễn rất tự nhiên.
- Nghệ sĩ .Út Hiền đúng hiền luôn . NS.Kim Ngọc hồi này đẹp quá
- CHÚ ÚT HIỀN HÁT RẤT NGỌT. CHÚ RA ĐI QUÁ SỚM. CÔ KIM NGỌC HÀI RẤT VUI. GIỜ CÔ CHÚ ĐÃ VỀ VỚI PHẬT
- Hồi còn nhỏ 9-10 tuổi có nghe Út Hiền ca, ca hay, mùi mẫn, giọng trầm buồn.
- Tôi cũng mê giọng ca nghệ sỹ Út Hiền lắm. Cảm ơn tác giả đã gợi nhớ lại trong tôi!
- Nhìn hình cô Kim Ngọc không đẹp nhưng rất dễ thương và phúc hậu
- 100 năm nữa cải lương xưa... cũng không bao giờ xuất hiện nữa thật đáng tiếc... Bây giờ người trẻ... họ không biết phải làm sao....đa số mì ăn liền
- Ngày xưa nghe hát đĩa tuy âm thanh kg hiện đại lắm nhưng rất mê
- Tôi rất thích Kim Ngọc, diễn xuất rất tự nhiên không có quá làm điệu như Bạch Tuyết. Rất tiếc đã ra đi và để lại nhiều thương tiếc.
- Hồi xưa rất thích chú Út Hiền.. Ngồi đâu cũng vẽ chú...
- Các nghệ sĩ tài danh xưa giờ lần lượt ra đi hết cuộc đời thật ngắn ngủi và vô thường
- Già rồi ....ai củng dị thôi
- Nhớ giọng ca nghệ sĩ Út Hiền, Út Hậu
- Đẹp trai.. hát hay.. giọng ông ấm nhẹ nhàng...
- Nhớ 60năm trước
- Cô Kim Ngọc ngày xưa đẹp quá luôn.
- Quá tuyệt vời luôn
- Lúc đó tôi 10 tuổi ba tôi thường dắt đi xem đề kiểm duyệt kịch bản.
- Tre già măng mọc mà còn thế hệ tiếp nối
- Cô đẹp quá
- Mình rất thích giọng ca của hai nghệ sĩ này

**G. Review quán bánh mì lớn (Google Maps)** — 21 câu

- 1* Vừa nhận được ổ bánh mì từ shipper lấy ra vỏ bánh mì mềm như bánh mì cũ, cắn thử 1 miếng mà thất vọng vô cùng, còn tệ hơn ổ bánh lề đường 10k, thương hiệu lớn ko đi với chất lượng và giá tiền mà KH phải bỏ ra.
- 1* Mua ổ bánh mì nổi tiếng GIÁ ĐẮT NHƯNG CHẤT LƯỢNG CỰC KÌ TỆ, vỏ bánh mì mềm, nhão, dai (cắn không đứt nổi), thua cả tiệm bánh mì lề đường 20k
- 1* Tôi chưa bao giờ ăn 1 ổ bánh mì dở tệ đến vậy, bánh mì nguội không giòn, khách dặn 1 đằng còn nhân viên làm 1 nẻo
- 1* Nhân viên làm dịch vụ bán nhanh mà sao làm chậm quá luôn, mình nói cắt đôi giúp mình thì bạn không cắt và thái độ. Bánh mì thì nguội ngắc
- 3* Quán đông, xếp hàng dài, chủ yếu khách nước ngoài Đồ ăn cũng ko quá đặc sắc với mức giá cao ~70k
- 1* Đồ ăn ngon nhưng thái độ phục vụ rất tệ 6h tới phải đợi nhân viên chuẩn bị 6h15 mới bán vậy sao không thông báo 6h15 bán đi khỏi chờ đợi mất thời gian
- 3* Bánh Mì TO / 2ng ăn 1 ổ ok (73k/ổ TO, nhiều Topping) Về chất lượng & Hương vị bthuong chưa ấn tượng hay đặc trưng
- 1* Thái độ nhân viên cười cợt, không coi khách ra gì, khách đưa nhầm bill thì đứng cười trước mặt khách
- 2* Là người thích ăn bánh mỳ và ăn nhiều nơi. Ổ bánh mỳ ở đây không có gì đặc biệt. Cũng đầy thịt nguội và chả. Lúc nào quán cũng hết bánh mỳ loại size vừa mà chỉ bán size to nhất.
- 3* Xem review thấy khen tiệm bánh mì này quá trời nên phải tìm đến mua một ổ ăn cho biết. Ổ bánh mì bình thường nhưng nó trở nên bự chà bá vì bỏ vào rất nhiều
- 2* Bánh mì siêu to khổng lồ nhưng ăn không ngon và ngán. Thử một lần không ăn lần thứ 2 nữa. Rất thất vọng.
- 1* Đã order khá nhiều lần, nhưng quán chỉ cắt đúng 1 lần thành 3 khúc, các lần sau order đều bị từ chối nên cho 1 sao
- 1* Bánh mì không cần khách. Cám ơn chú bảo vệ đã nhiệt tình hỗ trợ ae lấy đơn grab nhưng thái độ nhân viên bên trong thì ko phản hồi
- 2* Bánh mỳ ăn ngon, nhưng làm ổ quá lớn, khiến đồ ăn bên trong luôn bị rơi ra do bánh bị vỡ đôi!
- 1* Bánh mì dở mắc ói, ăn có 1/3 ổ mà nó ngán khủng khiếp. Xin thưa ai chưa ăn thì đừng ăn vì nó rất là kinh khủng và khủng khiếp Mắc nữa chứ đã vậy chẳng có ngon bổ gì
- 1* đồ ăn thì tạm, riêng về thái độ nhân viên(order) đi 2 ng nhưng ăn 1 ổ ra rất no, lúc mình mua 1 ổ thái độ ra mặt
- 4* Có vẻ hàng bánh mỳ này nổi tiếng với người nước ngoài hơn so với người Việt mình. Mình xếp hàng mua bánh thì chỉ có mình và 2 bác bảo vệ là người VN còn lại đều là khách du lịch nước ngoài.
- 4* Quán chia làm 2 nơi, 1 bên cho shipper 1 bên cho cá nhân, khá tiện. Ổ to và đầy đặn quá xá, mình mua ổ size L xém tí quên kêu họ cắt ra làm đôi giúp ak..😆
- 5* 78k cho một ổ ú ụ thịt ba tê. 2 ng ăn hét 1 ổ 🤪. Ngon, béo. Bánh mì ở đây quá nổi tiếng rồi. Có chỗ ngồi lại ăn luôn.
- 4* Hương vị khá vừa miệng, bánh mì topping nhiều, chất lượng dịch vụ tốt. Nhân viên thân thiện, nhiệt thành và chuyên nghiệp.
- 4* Ăn nhiều lần lắm rồi mà hay mua đem ra công viên, nay thèm đặt về nhà ăn

**G. Review bánh mì cóc nhỏ (Google Maps)** — 8 câu

- 5* Nếu là người mê bánh mì mà lại là Bánh mì Cóc, thì chắc là thương hiệu này thuộc Top of mind của dân Saigon luôn rồi. Chỉ tiếc cái là ở xa quá nên mỗi lần thèm thì
- 5* Bánh mì cóc 22k/ổ. Ngon, rẻ, vừa ăn. Nước sâm rong biển cũng rất vừa uống, không bị ngọt gắt. Gà xé không bị khô, thấm vừa gia vị. Bơ và pate béo thơm, ngon.
- 5* Mình biết qua tiktok. Nhìn sạch sẽ, ổ mình ăn 22k. Ck mình ăn ổ 25k nhìu gà, pate hơn, khá đầy đặn. Nhìn mỗi thứ 1 ít vậy thôi chứ ăn cảm thấy vừa đủ, ko bị ngán.
- 1* tiệm bánh này bán ngon nhưng ko đảm bảo vệ sinh, gây ngộ độc hơn 300 người lên báo, mọi người mua ăn cẩn thận, giờ ngộ độc bánh mì quá nhiều
- 4* Bánh mì giòn, được phết nhiều bơ với pate lắm, gà xé lẫn đồ chua rau cũng nhiều mà dù vậy ăn vẫn rất ngấy bơ.
- 5* Bánh mì vỏ giòn, rất thơm, nhân bánh nhiều bơ và pate và đầy đặn chả lụa gà xé chỉ 20k 1 ổ. Cà phê sữa tươi sương sáo kế bên siêu ngon, ít ngọt cũng chỉ 20k.
- 4* bánh mì gà pate ngon nhưng mình thấy chả không ngon, giá vừa phải
- 5* Bánh mì cóc có tiếng ở gò vấp. Pate và sốt bơ ở đây là điểm nhấn. Gà xé không bị khô. Ổ 20k chất lượng.
