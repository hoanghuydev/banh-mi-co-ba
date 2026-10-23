# Giọng review quán ăn — research cho app Đánh giá (R4)

> Dùng cho `content/reviews/*.json`. Viết lại theo pattern, **không chép nguyên văn** câu của người thật.

## 1. Nguồn

| Nguồn | Cỡ | Ghi chú |
|---|---|---|
| `pqthinh232/vietnamese-restaurant-review-sentiment-dataset` (Hugging Face, parquet) | **26.170** review quán ăn tiếng Việt | Nhãn `0` chê · `1` khen · `2` nửa khen nửa chê. Văn phong Foody/Google Maps, đã ẩn danh sẵn |
| Dataset đối chiếu: AIVIVN 2019 (Foody), ViSpamReviews | — | Chỉ đọc mô tả, không lấy được chữ thô công khai |
| Bài tổng hợp từ lóng Gen Z 2025–2026 | — | Blog thương mại, độ tin cậy thấp → chỉ dùng để **loại** từ đã hết trend |

Xem 2026-10-22. Không lưu tên người, avatar, URL cá nhân.

## 2. Số đo rút từ corpus

**Độ dài (số từ, trung vị):** chê 55 · khen 36 · nửa nửa 61.
→ Người **khen thì ngắn**, người **chê thì dài** (phải kể lý do). Review game nên theo đúng tỉ lệ đó.

Nhưng đuôi ngắn rất dày: **779 review chê ≤ 22 từ**, và có cả loạt review đúng **một từ** (`tốt`, `bình thường`, `được`, `đẹp`). Google Maps ngắn hơn Foody nhiều.

**Tần suất (% review có chứa):**

| Từ | % | Từ | % |
|---|---|---|---|
| `ngon` | 60,1 | `khá` | 37,8 |
| `hơi` | 21,3 | `nha` | 21,1 |
| `luôn` | 16,9 | `k` (= không/nghìn) | 16,2 |
| `ok` | 12,0 | `mọi người` | 6,4 |
| `nhé` | 6,6 | `sẽ quay lại` | 5,4 |
| `siêu` | 5,6 | `cực` | 5,3 |
| `bình thường` | 5,1 | `tệ` | 3,3 |
| `thất vọng` | 2,9 | `điểm trừ` | 2,0 |
| `recommend` | 1,8 | `dở` | 1,4 |
| `đỉnh` | 1,2 | `không quay lại` | 1,1 |

⚠️ Bỏ qua số đo của `á`, `m`, `t`, `ạ` — chúng khớp nhầm bên trong `giá`, `mình`, `tốt`, `lạnh`.

**Teencode gần như không có.** `khum` 8/26.170 · `hok` 23 · `cx` 3 · `mik` 10 · `bth` 51. Người ta viết **tắt kiểu gõ nhanh** (`k`, `r`, `đc`, `j`, `v`) chứ không viết teencode kiểu cute. → Game đừng rắc `khum`, `iu`, `ko bít` vào — nghe giả.

**Mở đầu** hầu hết là **danh ngữ chủ đề**, không phải chủ ngữ người: `đồ ăn…` (2.114) · `không gian…` (590) · `món ăn…` (439) · `quán này…`. Kiểu "Mình thấy rằng…" gần như không có.

**Kết** là **lời hứa quay lại hoặc không**: `sẽ quay lại` (455) · `không quay lại` (117) · `ủng hộ quán dài dài` · `nha mọi người`.

## 3. Cấu trúc câu — bốn khuôn thật

| Khuôn | Tỉ lệ cảm nhận | Ví dụ (viết lại) |
|---|---|---|
| **Liệt kê cụt, phẩy nối phẩy** | cao nhất | `đồ ăn ngon, quán sạch, nhân viên nhiệt tình, giá hợp lý` |
| **Khen rồi bẻ** (`nhưng`, `mỗi tội`, `có điều`, `tuy nhiên`) | cao | `phở ngon tuy nhiên hơi ít thịt` · `vẫn ngon, mỗi tội ngồi vỉa hè bẩn` |
| **Một ý, cụt lủn** | cao | `chất lượng tệ quá` · `giao thiếu đồ ăn` · `cũng được` |
| **Kể lể có số** | vừa | `suất cơm 40k mà rau luộc không mắm, thịt toàn mỡ` |

**Luật vàng:** gần như **không review nào chỉ có một tính từ trần trụi**. Luôn có bổ ngữ mức độ (`khá`, `hơi`, `siêu`, `cực`, `quá`, `vãi`) hoặc một chi tiết cụ thể (con số, món, bộ phận).

## 4. Trục giọng — năm kiểu, trộn với persona

Yêu cầu chủ dự án 2026-10-22: review càng đa dạng giọng càng tốt. Năm giọng rút từ corpus:

| Giọng | Dấu hiệu | Ví dụ corpus (đã viết lại) |
|---|---|---|
| **Chân thật** | kể chi tiết, có số, không cảm thán | `ổ 20k, pate thơm, rau giòn, ăn no tới trưa` |
| **Bình thường / nhạt** | 1–4 từ, không cảm xúc | `tốt` · `cũng được` · `bình thường` · `được của nó` |
| **Vui tính** | `nha`, `luôn`, `10 điểm`, lặp từ, `xỉu` | `ngon xỉu nha mọi người, 10 điểm 10 điểm` |
| **Hài hước / cà khịa** | so sánh lố, tự giễu, `trời ơi`, `vãi`, `cạn lời` | `ăn xong đứng dậy thấy đời dễ thở hẳn` |
| **Hãm** | ra lệnh cho người đọc, quy chụp | `mọi người đừng ghé` · `tránh xa ra` · `làm ăn kiểu gì vậy` |

Dấu hiệu của **hãm** rất rõ trong corpus chê: `thái độ` (dùng như tính từ: *"phục vụ thái độ"*), `đừng bao giờ`, `tránh xa`, `lừa đảo`, `không bao giờ quay lại`, `tẩy chay`.

Persona trộn vào: sinh viên · dân văn phòng · cô chú lớn tuổi · food reviewer tự phong (`10 điểm`, `recommend`, `chấm 8/10`) · khách quen · shipper.

## 5. Theo tình huống — từ vựng lấy thẳng từ corpus

| Tình huống | Từ/cụm người thật dùng |
|---|---|
| Ngon | `ngon`, `hợp khẩu vị`, `đậm đà`, `thơm`, `vừa miệng`, `chắc thịt`, `đáng tiền`, `ngon bổ rẻ`, `hơi bị ngon` |
| Giá đắt | `mắc`, `đắt`, `chát`, `cắt cổ`, `phí tiền`, `không đáng tiền`, `giá chát 1 chút`, `đắt trời người` |
| Giá rẻ | `rẻ`, `bình dân`, `hợp lý`, `phải chăng`, `giá sinh viên`, `ngon bổ rẻ` |
| Ít nhân | `ít nhân`, `ít thịt`, `lèo tèo`, `tí teo`, `được mấy miếng`, `toàn cơm ít nhân` |
| Thiếu / sai món | `giao thiếu`, `thiếu hẳn`, `làm thiếu món`, `ghi chú cũng không thèm đọc` |
| Nguội / cháy / sống | `nguội`, `lạnh ngắt`, `cứng ngắt`, `bị sống`, `khét`, `ỉu`, `nguội như vừa lấy trong tủ lạnh ra` |
| Đau bụng / bẩn | `đau bụng`, `tào tháo`, `ngộ độc`, `thiu`, `chua loét`, `mất vệ sinh`, `có ruồi`, `dị vật`, `kinh dị`, `buồn nôn` |
| Chờ lâu | `lên đồ chậm`, `chờ hơn 1 tiếng`, `hối 3 lần không ra` |
| Thái độ | `thái độ`, `gắt giọng`, `khó chịu khi bị complain`, `coi thường khách`, `lơ là khách` |
| Lời kết tốt | `sẽ quay lại`, `ủng hộ quán dài dài`, `recommend`, `nha mọi người`, `10 điểm` |
| Lời kết xấu | `không bao giờ quay lại`, `mọi người đừng ghé`, `thua`, `chán` |

## 6. Cấm

- **Giọng Nam cổ:** `biểu`, `mần`, `đặng`, `hổm rày`, `ăn nói chi kỳ`, `thiệt tình hổng biết`.
- **Teencode cute:** `khum`, `iu`, `bít`, `vuiii` — corpus gần như không có.
- **Giọng nhà văn:** `Quả thực`, `Phải nói rằng`, `Tôi cảm thấy`, `Nhìn chung`.
- **Khuôn lặp:** quá 2 review cùng mở bằng một cụm là phải viết lại.
- Chửi tục nặng, miệt thị vùng miền/giới — theo `content/redlines.json` và `tools/lr4-blocklist.txt`.

## 7. Áp vào R4

| Nguồn review (`R4-PLAN.md` §4) | Giọng chủ đạo |
|---|---|
| Việc làm thật 4–5★ | chân thật · vui tính · nhạt |
| Việc làm thật 1–2★ | chân thật · hãm |
| Chê giá | chân thật · cà khịa |
| Đau bụng | hãm (nặng nhất trong game) |
| Nhầm quán hủ tiếu | chân thật nhưng **nói về món không có trên menu** |
| Đối thủ chơi xấu | hãm, chung chung, không chi tiết cụ thể — đó là dấu hiệu nhận ra |
| Spam vô nghĩa | nhạt một từ (`tốt`, `đẹp`, `được`) hoặc lạc đề hẳn |
| Chỉ sao không chữ | rỗng |

Tỉ lệ độ dài đặt theo §2: ổ khen ngắn, ổ chê dài.
